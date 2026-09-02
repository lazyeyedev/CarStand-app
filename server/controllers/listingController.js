const Listing = require('../models/Listing');
const Dealer = require('../models/Dealer');
const Enquiry = require('../models/Enquiry');
const { cloudinary } = require('../utils/cloudinaryUpload');
const extractPublicId = require('../utils/extractPublicId');
const { sendEnquiryNotification } = require('../utils/emailService');
const { getPublicClientUrl } = require('../utils/clientUrl');

// GET /api/listings  (public)
const getListings = async (req, res) => {
  const {
    make, model, year, minPrice, maxPrice, region, condition,
    transmission, fuelType, bodyType, isBoosted,
    page = 1, limit = 20,
  } = req.query;

  const filter = { isActive: true, isApproved: true };

  if (make)         filter.make = { $regex: make, $options: 'i' };
  if (model)        filter.model = { $regex: model, $options: 'i' };
  if (year)         filter.year = Number(year);
  if (region)       filter.region = { $regex: region, $options: 'i' };
  if (condition)    filter.condition = condition;
  if (transmission) filter.transmission = transmission;
  if (fuelType)     filter.fuelType = fuelType;
  if (bodyType)     filter.bodyType = bodyType;
  if (isBoosted)    filter.isBoosted = isBoosted === 'true';
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('dealer', 'businessName logo region isVerified')
      .sort({ isBoosted: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({
    listings,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
};

// GET /api/listings/:id  (public)
const getListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('dealer');

  if (!listing || !listing.isActive || !listing.isApproved) {
    res.status(404);
    throw new Error('Listing not found');
  }

  await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.status(200).json(listing);
};

// POST /api/listings  (dealer only)
const createListing = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const {
    title, make, model, year, price, currency, mileage, mileageUnit,
    transmission, fuelType, condition, bodyType, color, description,
    location, region,
  } = req.body;

  if (!title || !make || !model || !year || !price) {
    res.status(400);
    throw new Error('title, make, model, year, and price are required');
  }

  const imageUrls = req.files ? req.files.map((f) => f.path || f.secure_url || f.url) : [];

  if (imageUrls.length === 0) {
    res.status(400);
    throw new Error('At least one image is required');
  }

  const listing = await Listing.create({
    dealer: dealer._id,
    title, make, model,
    year: Number(year),
    price: Number(price),
    currency, mileage: mileage ? Number(mileage) : undefined,
    mileageUnit, transmission, fuelType, condition, bodyType,
    color, description, location, region,
    images: imageUrls,
    isApproved: false,
  });

  await Dealer.findByIdAndUpdate(dealer._id, { $inc: { totalListings: 1 } });

  res.status(201).json(listing);
};

// PUT /api/listings/:id  (dealer only)
const updateListing = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.dealer.toString() !== dealer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this listing');
  }

  const forbidden = ['dealer', 'isApproved', 'views', 'enquiryCount', 'isBoosted', 'boostExpiry', 'keptImages'];
  const updates = { ...req.body };
  forbidden.forEach((f) => delete updates[f]);

  const newUrls = req.files && req.files.length > 0
    ? req.files.map((f) => f.path || f.secure_url || f.url)
    : [];

  // keptImages is sent as a single JSON-stringified array of image URLs the
  // dealer chose to keep (see ListingForm.jsx). Its presence — even as an
  // empty array — means the dealer's image picker was rendered and the
  // client is telling us the full intended state, so we resolve images
  // here rather than blindly appending. If keptImages wasn't sent at all
  // (e.g. a non-multipart update that doesn't touch images), leave the
  // existing images array untouched.
  if (req.body.keptImages !== undefined) {
    let keptImages;
    try {
      keptImages = JSON.parse(req.body.keptImages);
    } catch (err) {
      res.status(400);
      throw new Error('keptImages must be a JSON array of image URLs');
    }

    if (!Array.isArray(keptImages) || !keptImages.every((u) => typeof u === 'string')) {
      res.status(400);
      throw new Error('keptImages must be a JSON array of image URLs');
    }

    // Only URLs that actually belong to this listing can be "kept" — this
    // stops a crafted request from injecting arbitrary URLs into the
    // listing's images array via this field.
    const currentImages = listing.images || [];
    const kept = keptImages.filter((u) => currentImages.includes(u));
    const removed = currentImages.filter((u) => !kept.includes(u));

    // Validate the final count BEFORE touching Cloudinary — rejecting after
    // destroying assets would leave the DB pointing at deleted images.
    if (kept.length + newUrls.length === 0) {
      res.status(400);
      throw new Error('A listing must have at least one image');
    }

    if (removed.length > 0) {
      await Promise.all(
        removed.map(async (url) => {
          const publicId = extractPublicId(url);
          if (!publicId) return;
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            // Don't fail the whole update if Cloudinary cleanup fails for
            // one image — the listing update itself should still succeed.
            // The orphaned asset is a storage-cost issue, not a data-
            // integrity one.
          }
        })
      );
    }

    updates.images = [...kept, ...newUrls].slice(0, 10); // enforce max 10
  } else if (newUrls.length > 0) {
    // Backward-compatible path: no keptImages field sent, but new files
    // were uploaded — append them to the existing set, as before.
    updates.images = [...(listing.images || []), ...newUrls].slice(0, 10);
  }

  const updated = await Listing.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updated);
};

// DELETE /api/listings/:id  (dealer only — soft delete)
const deleteListing = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.dealer.toString() !== dealer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this listing');
  }

  await Listing.findByIdAndUpdate(req.params.id, { isActive: false });
  await Dealer.findByIdAndUpdate(dealer._id, { $inc: { totalListings: -1 } });

  res.status(200).json({ message: 'Listing removed successfully' });
};

// DELETE /api/listings/:id/images  (dealer only)
const deleteListingImage = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.dealer.toString() !== dealer._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    res.status(400);
    throw new Error('imageUrl is required');
  }

  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }

  const updatedImages = listing.images.filter((url) => url !== imageUrl);
  const updated = await Listing.findByIdAndUpdate(
    req.params.id,
    { images: updatedImages },
    { new: true }
  );

  res.status(200).json({ images: updated.images });
};

// GET /api/listings/dealer/mine  (dealer only)
const getDealerListings = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [listings, total] = await Promise.all([
    Listing.find({ dealer: dealer._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Listing.countDocuments({ dealer: dealer._id }),
  ]);

  res.status(200).json({
    listings,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
};

// POST /api/listings/:id/enquiry  (public + authenticated)
const submitEnquiry = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing || !listing.isActive || !listing.isApproved) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const { message, type, guestName, guestEmail, guestPhone } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  // Guest validation — only required if not authenticated
  if (!req.user && (!guestName || !guestEmail || !guestPhone)) {
    res.status(400);
    throw new Error('guestName, guestEmail, and guestPhone are required for guest enquiries');
  }

  const enquiry = await Enquiry.create({
    listing: listing._id,
    dealer: listing.dealer,
    user: req.user ? req.user._id : undefined,
    guestName: req.user ? undefined : guestName,
    guestEmail: req.user ? undefined : guestEmail,
    guestPhone: req.user ? undefined : guestPhone,
    message,
    type: type || 'general',
  });

  await Listing.findByIdAndUpdate(req.params.id, { $inc: { enquiryCount: 1 } });

  // Fire-and-forget email notification to dealer
  (async () => {
    try {
      const dealerWithUser = await Dealer.findById(listing.dealer).populate('user', 'email name');
      if (dealerWithUser?.user?.email) {
        const senderName  = req.user ? req.user.name  : guestName;
        const senderEmail = req.user ? req.user.email : guestEmail;
        const senderPhone = req.user ? req.user.phone : guestPhone;
        await sendEnquiryNotification({
          dealerEmail:  dealerWithUser.user.email,
          dealerName:   dealerWithUser.businessName,
          listingTitle: listing.title,
          senderName,
          senderEmail,
          senderPhone,
          message,
          type: type || 'general',
          listingUrl: `${getPublicClientUrl()}/listings/${listing._id}`,
        });
      }
    } catch (_) {}
  })();

  res.status(201).json(enquiry);
};

module.exports = {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  deleteListingImage,
  getDealerListings,
  submitEnquiry,
};
