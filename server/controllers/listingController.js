const Listing = require('../models/Listing');
const Dealer = require('../models/Dealer');
const Enquiry = require('../models/Enquiry');
const { cloudinary } = require('../utils/cloudinaryUpload');
const extractPublicId = require('../utils/extractPublicId');
const { sendEnquiryNotification } = require('../utils/emailService');
const { getPublicClientUrl } = require('../utils/clientUrl');
const { contains, paginate, toNumber } = require('../utils/queryHelpers');

// What the public is allowed to see about a dealer on a listing.
const PUBLIC_DEALER_FIELDS = 'businessName businessAddress region phone whatsapp logo coverImage description isVerified createdAt';

// Fields a dealer may set on their own listing. Everything else on the model
// (isApproved, isFeatured, isBoosted, isActive, views, dealer…) is controlled
// by the platform, so the update is built from this list rather than by
// deleting a few known-bad keys from req.body.
const TEXT_FIELDS   = ['title', 'make', 'model', 'color', 'description', 'location', 'region'];
const NUMBER_FIELDS = ['year', 'price', 'mileage'];
const ENUM_FIELDS   = ['currency', 'mileageUnit', 'transmission', 'fuelType', 'condition', 'bodyType'];
const REQUIRED_FIELDS = ['title', 'make', 'model', 'year', 'price'];

// Changing any of these changes what car is being sold, so the listing goes
// back to the admin for review. Price, mileage, colour and location edits
// stay live — dealers adjust those often and they don't change the car.
const REVIEW_FIELDS = ['title', 'make', 'model', 'year', 'condition', 'description'];

// Ids of dealers who are not currently approved (pending, rejected, suspended).
// Their listings stay out of everything public.
const unapprovedDealerIds = async () => {
  const rows = await Dealer.find({ isApproved: false }).select('_id').lean();
  return rows.map((d) => d._id);
};

// GET /api/listings  (public)
const getListings = async (req, res) => {
  const {
    make, model, year, minPrice, maxPrice, region, condition,
    transmission, fuelType, bodyType, isBoosted,
  } = req.query;

  const filter = { isActive: true, isApproved: true };

  const hiddenDealers = await unapprovedDealerIds();
  if (hiddenDealers.length) filter.dealer = { $nin: hiddenDealers };

  if (make)         filter.make = contains(make);
  if (model)        filter.model = contains(model);
  if (toNumber(year) !== undefined) filter.year = toNumber(year);
  if (region)       filter.region = contains(region);
  if (condition)    filter.condition = condition;
  if (transmission) filter.transmission = transmission;
  if (fuelType)     filter.fuelType = fuelType;
  if (bodyType)     filter.bodyType = bodyType;
  if (isBoosted)    filter.isBoosted = isBoosted === 'true';
  const min = toNumber(minPrice);
  const max = toNumber(maxPrice);
  if ((minPrice && min !== undefined) || (maxPrice && max !== undefined)) {
    filter.price = {};
    if (minPrice && min !== undefined) filter.price.$gte = min;
    if (maxPrice && max !== undefined) filter.price.$lte = max;
  }

  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

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
  const listing = await Listing.findById(req.params.id).populate('dealer', `${PUBLIC_DEALER_FIELDS} isApproved`);

  if (!listing || !listing.isActive || !listing.isApproved || !listing.dealer || !listing.dealer.isApproved) {
    res.status(404);
    throw new Error('Listing not found');
  }

  await Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } });

  res.status(200).json(listing);
};

// GET /api/listings/dealer/mine/:id  (dealer only)
// The edit form loads from here. The public endpoint above hides pending and
// inactive listings, so a dealer could never open one of those to fix it.
const getDealerListing = async (req, res) => {
  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const listing = await Listing.findOne({ _id: req.params.id, dealer: dealer._id });
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

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

  if (toNumber(year) === undefined || toNumber(price) === undefined || toNumber(price) <= 0) {
    res.status(400);
    throw new Error('year and price must be valid numbers');
  }

  // A select left on its blank option arrives as '' — store nothing rather
  // than failing the schema's enum check.
  const opt = (v) => (v === '' ? undefined : v);

  const listing = await Listing.create({
    dealer: dealer._id,
    title, make, model,
    year: Number(year),
    price: Number(price),
    currency: opt(currency), mileage: toNumber(mileage || undefined),
    mileageUnit: opt(mileageUnit), transmission: opt(transmission), fuelType: opt(fuelType),
    condition: opt(condition), bodyType: opt(bodyType),
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

  // Build the update from the allow-list only.
  const updates = {};
  for (const f of TEXT_FIELDS) {
    if (typeof req.body[f] === 'string') updates[f] = req.body[f].trim();
  }
  for (const f of NUMBER_FIELDS) {
    if (req.body[f] === undefined || req.body[f] === '') continue;
    const n = toNumber(req.body[f]);
    if (n === undefined || n < 0) {
      res.status(400);
      throw new Error(`${f} must be a valid number`);
    }
    updates[f] = n;
  }
  for (const f of ENUM_FIELDS) {
    // An empty select in the form means "leave as is", not "set to empty".
    if (typeof req.body[f] === 'string' && req.body[f] !== '') updates[f] = req.body[f];
  }
  for (const f of REQUIRED_FIELDS) {
    if (f in updates && (updates[f] === '' || updates[f] === 0)) {
      res.status(400);
      throw new Error(`${f} is required`);
    }
  }

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

  // Did this edit change what car is being sold? If so, it needs a fresh review.
  const same = (a, b) => String(a ?? '') === String(b ?? '');
  const contentChanged = REVIEW_FIELDS.some((f) => f in updates && !same(updates[f], listing[f]));
  const imagesChanged = updates.images !== undefined &&
    (updates.images.length !== (listing.images || []).length ||
     updates.images.some((u, i) => u !== listing.images[i]));
  const needsReview = listing.isApproved && (contentChanged || imagesChanged);
  if (needsReview) updates.isApproved = false;

  const updated = await Listing.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  // `resubmitted` lets the dealer UI explain why the listing left the site.
  res.status(200).json({ ...updated.toObject(), resubmitted: needsReview });
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

  if (!listing.images.includes(imageUrl)) {
    res.status(404);
    throw new Error('That image is not on this listing');
  }
  if (listing.images.length <= 1) {
    res.status(400);
    throw new Error('A listing must have at least one image');
  }

  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    try { await cloudinary.uploader.destroy(publicId); } catch (err) { /* orphaned asset only */ }
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

  const { page: pageNum, limit: limitNum, skip } = paginate(req.query);

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
  const listing = await Listing.findById(req.params.id).populate('dealer', 'isApproved');
  if (!listing || !listing.isActive || !listing.isApproved || !listing.dealer || !listing.dealer.isApproved) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const { type, guestName, guestEmail, guestPhone } = req.body;
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }
  if (message.length > 2000) {
    res.status(400);
    throw new Error('Message is too long (2000 characters maximum)');
  }
  if (!req.user && guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(guestEmail))) {
    res.status(400);
    throw new Error('Enter a valid email address');
  }

  // Guest validation — only required if not authenticated
  if (!req.user && (!guestName || !guestEmail || !guestPhone)) {
    res.status(400);
    throw new Error('guestName, guestEmail, and guestPhone are required for guest enquiries');
  }

  const enquiry = await Enquiry.create({
    listing: listing._id,
    dealer: listing.dealer._id,
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
      const dealerWithUser = await Dealer.findById(listing.dealer._id).populate('user', 'email name');
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
  getDealerListing,
  submitEnquiry,
};
