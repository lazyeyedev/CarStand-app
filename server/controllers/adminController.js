const User = require('../models/User');
const Dealer = require('../models/Dealer');
const Listing = require('../models/Listing');
const Enquiry = require('../models/Enquiry');
const Boost = require('../models/Boost');
const { cloudinary } = require('../utils/cloudinaryUpload');
const { contains, paginate } = require('../utils/queryHelpers');
const { expireBoosts } = require('../utils/boostService');

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    totalDealers,
    pendingDealers,
    totalListings,
    pendingListings,
    totalEnquiries,
    activeBoosts,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    Dealer.countDocuments(),
    Dealer.countDocuments({ isApproved: false }),
    Listing.countDocuments(),
    Listing.countDocuments({ isApproved: false }),
    Enquiry.countDocuments(),
    Boost.countDocuments({ status: 'active' }),
  ]);

  res.status(200).json({
    totalUsers,
    totalDealers,
    pendingDealers,
    totalListings,
    pendingListings,
    totalEnquiries,
    activeBoosts,
  });
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

  const filter = {};
  if (search) {
    filter.$or = [
      { name:  contains(search) },
      { email: contains(search) },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};

// PUT /api/admin/users/:userId/status
const updateUserStatus = async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    res.status(400);
    throw new Error('isActive must be a boolean');
  }

  // Deactivating yourself would lock the only admin out of the platform.
  if (!isActive && req.params.userId === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot deactivate your own account');
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { isActive },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json(user);
};

// GET /api/admin/dealers
const getAllDealers = async (req, res) => {
  const { approved, page = 1, limit = 20 } = req.query;
  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

  const filter = {};
  if (approved !== undefined) filter.isApproved = approved === 'true';

  const [dealers, total] = await Promise.all([
    Dealer.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Dealer.countDocuments(filter),
  ]);

  res.status(200).json({ dealers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};

// GET /api/admin/dealers/:dealerId  (full profile)
const getDealerById = async (req, res) => {
  const dealer = await Dealer.findById(req.params.dealerId).populate(
    'user',
    'name email phone avatar isActive createdAt'
  );

  if (!dealer) {
    res.status(404);
    throw new Error('Dealer not found');
  }

  const [listings, listingStats, enquiryCount] = await Promise.all([
    Listing.find({ dealer: dealer._id }).sort({ createdAt: -1 }).limit(50),
    Listing.aggregate([
      { $match: { dealer: dealer._id } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          activeListings: { $sum: { $cond: ['$isActive', 1, 0] } },
          approvedListings: { $sum: { $cond: ['$isApproved', 1, 0] } },
          totalViews: { $sum: '$views' },
        },
      },
    ]),
    Enquiry.countDocuments({ dealer: dealer._id }),
  ]);

  const stats = listingStats[0] || {
    totalListings: 0,
    activeListings: 0,
    approvedListings: 0,
    totalViews: 0,
  };

  res.status(200).json({
    dealer,
    listings,
    stats: { ...stats, totalEnquiries: enquiryCount },
  });
};

// PUT /api/admin/dealers/:dealerId/approve
const approveDealer = async (req, res) => {
  const dealer = await Dealer.findByIdAndUpdate(
    req.params.dealerId,
    { isApproved: true },
    { new: true }
  ).populate('user', 'name email');

  if (!dealer) {
    res.status(404);
    throw new Error('Dealer not found');
  }

  // Also ensure the linked user account is active
  await User.findByIdAndUpdate(dealer.user._id, { isActive: true });

  res.status(200).json(dealer);
};

// PUT /api/admin/dealers/:dealerId/reject
const rejectDealer = async (req, res) => {
  const dealer = await Dealer.findByIdAndUpdate(
    req.params.dealerId,
    { isApproved: false },
    { new: true }
  );

  if (!dealer) {
    res.status(404);
    throw new Error('Dealer not found');
  }

  await User.findByIdAndUpdate(dealer.user, { isActive: false });

  res.status(200).json({ message: 'Dealer rejected and account deactivated' });
};

// PUT /api/admin/dealers/:dealerId/suspend
const suspendDealer = async (req, res) => {
  const dealer = await Dealer.findByIdAndUpdate(
    req.params.dealerId,
    { isApproved: false },
    { new: true }
  );

  if (!dealer) {
    res.status(404);
    throw new Error('Dealer not found');
  }

  await User.findByIdAndUpdate(dealer.user, { isActive: false });

  res.status(200).json({ message: 'Dealer suspended and account deactivated' });
};

// PUT /api/admin/dealers/:dealerId/verify
const verifyDealer = async (req, res) => {
  const dealer = await Dealer.findByIdAndUpdate(
    req.params.dealerId,
    { isVerified: true },
    { new: true }
  ).populate('user', 'name email');

  if (!dealer) {
    res.status(404);
    throw new Error('Dealer not found');
  }

  res.status(200).json(dealer);
};

// GET /api/admin/listings
const getAllListings = async (req, res) => {
  const { approved, search, page = 1, limit = 20 } = req.query;
  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

  const filter = {};
  if (approved !== undefined) filter.isApproved = approved === 'true';
  if (search) {
    filter.$or = [
      { title: contains(search) },
      { make:  contains(search) },
      { model: contains(search) },
    ];
  }

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('dealer', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({ listings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};

// GET /api/admin/listings/:listingId  (full detail)
const getListingById = async (req, res) => {
  const listing = await Listing.findById(req.params.listingId).populate(
    'dealer',
    'businessName region phone whatsapp isVerified isApproved'
  );

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  res.status(200).json(listing);
};

// PUT /api/admin/listings/:listingId  (full edit — admin, no ownership check)
const updateListingAdmin = async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const forbidden = ['dealer', 'isApproved', 'views', 'enquiryCount', 'isBoosted', 'boostExpiry', 'keptImages'];
  const updates = { ...req.body };
  forbidden.forEach((f) => delete updates[f]);

  // Resolve final image set: kept existing images + newly uploaded ones
  let keptImages = req.body.keptImages;
  if (keptImages === undefined) keptImages = listing.images || [];
  else if (!Array.isArray(keptImages)) keptImages = [keptImages];

  const removedImages = (listing.images || []).filter((url) => !keptImages.includes(url));
  if (removedImages.length > 0) {
    const deletePromises = removedImages.map((url) => {
      const parts = url.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folder = parts[parts.length - 2];
      return cloudinary.uploader.destroy(`${folder}/${filename}`);
    });
    await Promise.allSettled(deletePromises);
  }

  const newUrls = (req.files || []).map((f) => f.path || f.secure_url || f.url);
  updates.images = [...keptImages, ...newUrls].slice(0, 10);

  const updated = await Listing.findByIdAndUpdate(req.params.listingId, updates, {
    new: true,
    runValidators: true,
  }).populate('dealer', 'businessName region phone whatsapp isVerified isApproved');

  res.status(200).json(updated);
};

// PUT /api/admin/listings/:listingId/approve
const approveListing = async (req, res) => {
  // Listings from a dealer who isn't approved are hidden from the public, so
  // approving one would silently do nothing. Say so instead.
  const current = await Listing.findById(req.params.listingId).populate('dealer', 'isApproved businessName');
  if (!current) {
    res.status(404);
    throw new Error('Listing not found');
  }
  if (!current.dealer || !current.dealer.isApproved) {
    res.status(400);
    throw new Error('Approve the dealer first — listings from unapproved dealers are not shown publicly');
  }

  const listing = await Listing.findByIdAndUpdate(
    req.params.listingId,
    { isApproved: true, isActive: true },
    { new: true }
  ).populate('dealer', 'businessName');

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  res.status(200).json(listing);
};

// PUT /api/admin/listings/:listingId/reject
const rejectListing = async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(
    req.params.listingId,
    { isApproved: false, isActive: false },
    { new: true }
  );

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  res.status(200).json({ message: 'Listing rejected' });
};

// DELETE /api/admin/listings/:listingId  (hard delete)
const deleteListingAdmin = async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Delete all images from Cloudinary
  const validImageUrls = (listing.images || []).filter((url) => typeof url === 'string' && url.length > 0);
  if (validImageUrls.length > 0) {
    const deletePromises = validImageUrls.map((url) => {
      const parts = url.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folder   = parts[parts.length - 2];
      const publicId = `${folder}/${filename}`;
      return cloudinary.uploader.destroy(publicId);
    });
    await Promise.allSettled(deletePromises); // don't let a missing image block the delete
  }

  await Listing.findByIdAndDelete(req.params.listingId);
  await Dealer.findByIdAndUpdate(listing.dealer, { $inc: { totalListings: -1 } });

  res.status(200).json({ message: 'Listing permanently deleted' });
};

// GET /api/admin/enquiries
const getAllEnquiries = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

  const [enquiries, total] = await Promise.all([
    Enquiry.find()
      .populate('listing', 'title')
      .populate('dealer', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Enquiry.countDocuments(),
  ]);

  res.status(200).json({ enquiries, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};

// GET /api/admin/boosts
const getBoosts = async (req, res) => {
  await expireBoosts({ force: true });
  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

  // All boosts, newest first — expired ones are the revenue history.
  const [boosts, total, revenue] = await Promise.all([
    Boost.find({})
      .populate('listing', 'title make model year')
      .populate('dealer', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Boost.countDocuments({}),
    Boost.find({}).select('amountPaid').lean(),
  ]);

  res.status(200).json({
    boosts, total, page: pageNum, totalPages: Math.ceil(total / limitNum),
    totalRevenue: revenue.reduce((sum, b) => sum + (b.amountPaid || 0), 0),
  });
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllDealers,
  getDealerById,
  approveDealer,
  rejectDealer,
  suspendDealer,
  verifyDealer,
  getAllListings,
  getListingById,
  updateListingAdmin,
  approveListing,
  rejectListing,
  deleteListingAdmin,
  getAllEnquiries,
  getBoosts,
};
