const Dealer = require('../models/Dealer');
const Listing = require('../models/Listing');
const Enquiry = require('../models/Enquiry');
const { cloudinary } = require('../utils/cloudinaryUpload');
const multer = require('multer');
const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;

// Separate multer instance for dealer profile images
const dealerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'carstand/dealers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const uploadDealerImage = multer({
  storage: dealerStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);

// GET /api/dealers/profile  (dealer only)
const getDealerProfile = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id }).populate(
    'user',
    'name email avatar phone'
  );

  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  res.status(200).json(dealer);
};

// PUT /api/dealers/profile  (dealer only)
const updateDealerProfile = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const { businessName, businessAddress, region, phone, whatsapp, description } = req.body;

  const updates = {};
  if (businessName)   updates.businessName   = businessName;
  if (businessAddress) updates.businessAddress = businessAddress;
  if (region)         updates.region         = region;
  if (phone)          updates.phone          = phone;
  if (whatsapp !== undefined) updates.whatsapp = whatsapp;
  if (description !== undefined) updates.description = description;

  if (req.files) {
    if (req.files.logo && req.files.logo[0]) {
      updates.logo = req.files.logo[0].path;
    }
    if (req.files.coverImage && req.files.coverImage[0]) {
      updates.coverImage = req.files.coverImage[0].path;
    }
  }

  const updated = await Dealer.findByIdAndUpdate(dealer._id, updates, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email avatar phone');

  res.status(200).json(updated);
};

// GET /api/dealers/enquiries  (dealer only)
const getDealerEnquiries = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const filter = { dealer: dealer._id };
  // Whitelisted: the query parser turns ?status[$ne]=x into an object, which
  // would otherwise reach Mongo as an operator.
  if (['new', 'read', 'responded', 'closed'].includes(req.query.status)) filter.status = req.query.status;

  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter)
      .populate('listing', 'title make model year images')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 }),
    Enquiry.countDocuments(filter),
  ]);

  // Trim images to first URL only after population
  const shaped = enquiries.map((e) => {
    const obj = e.toObject();
    if (obj.listing && obj.listing.images) {
      obj.listing.images = obj.listing.images.slice(0, 1);
    }
    return obj;
  });

  res.status(200).json({ enquiries: shaped, total });
};

// PUT /api/dealers/enquiries/:enquiryId/read  (dealer only)
const markEnquiryRead = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const enquiry = await Enquiry.findById(req.params.enquiryId);
  if (!enquiry) {
    res.status(404);
    throw new Error('Enquiry not found');
  }

  if (enquiry.dealer.toString() !== dealer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this enquiry');
  }

  enquiry.status = 'read';
  await enquiry.save();

  res.status(200).json(enquiry);
};

// GET /api/dealers/stats  (dealer only)
const getDealerStats = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const dealerId = dealer._id;

  const [listingAgg, enquiryAgg] = await Promise.all([
    Listing.aggregate([
      { $match: { dealer: dealerId } },
      {
        $group: {
          _id: null,
          totalListings:    { $sum: 1 },
          activeListings:   { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          totalViews:       { $sum: '$views' },
          featuredListings: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } },
        },
      },
    ]),
    Enquiry.aggregate([
      { $match: { dealer: dealerId } },
      {
        $group: {
          _id: null,
          totalEnquiries: { $sum: 1 },
          newEnquiries:   { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const listingStats  = listingAgg[0]  || { totalListings: 0, activeListings: 0, totalViews: 0, featuredListings: 0 };
  const enquiryStats  = enquiryAgg[0]  || { totalEnquiries: 0, newEnquiries: 0 };

  res.status(200).json({
    totalListings:    listingStats.totalListings,
    activeListings:   listingStats.activeListings,
    totalViews:       listingStats.totalViews,
    featuredListings: listingStats.featuredListings,
    totalEnquiries:   enquiryStats.totalEnquiries,
    newEnquiries:     enquiryStats.newEnquiries,
  });
};

module.exports = {
  getDealerProfile,
  updateDealerProfile,
  uploadDealerImage,
  getDealerEnquiries,
  markEnquiryRead,
  getDealerStats,
};
