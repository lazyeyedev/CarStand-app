const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Listing = require('../models/Listing');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'carstand/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPEG, PNG, WebP allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

// GET /api/users/enquiries  (protected)
const getMyEnquiries = async (req, res) => {
  const enquiries = await Enquiry.find({ user: req.user._id })
    .populate('listing', 'title make model year images')
    .populate('dealer', 'businessName')
    .sort({ createdAt: -1 });

  const shaped = enquiries.map(e => {
    const obj = e.toObject();
    if (obj.listing?.images) obj.listing.images = obj.listing.images.slice(0, 1);
    return obj;
  });

  res.status(200).json({ enquiries: shaped, total: shaped.length });
};

// PUT /api/users/profile  (protected)
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;

  const updates = {};
  if (name)  updates.name  = name;
  if (phone) updates.phone = phone;
  if (req.file) updates.avatar = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json(user);
};

// Fields a saved-car card needs. Same shape the public search returns.
const SAVED_FIELDS = 'title make model year price currency mileage mileageUnit transmission condition region images isBoosted dealer isActive isApproved';

// GET /api/users/saved  (protected)
// Only listings a buyer could still open are returned: sold, withdrawn,
// unapproved or deleted ones are left out (the ids stay on the user so a
// listing that comes back reappears).
const getSavedListings = async (req, res) => {
  const user = await User.findById(req.user._id).select('savedListings').populate({
    path: 'savedListings',
    select: SAVED_FIELDS,
    populate: { path: 'dealer', select: 'businessName isVerified isApproved' },
  });

  const listings = (user?.savedListings || [])
    .filter((l) => l && l.isActive && l.isApproved && l.dealer && l.dealer.isApproved)
    .map((l) => {
      const obj = l.toObject();
      obj.images = (obj.images || []).slice(0, 1);
      return obj;
    })
    .reverse(); // most recently saved first

  res.status(200).json({ listings, savedIds: user?.savedListings?.filter(Boolean).map((l) => l._id) || [] });
};

const checkListingId = (req, res) => {
  if (!mongoose.isValidObjectId(req.params.listingId)) {
    res.status(404);
    throw new Error('Listing not found');
  }
};

// POST /api/users/saved/:listingId  (protected)
const saveListing = async (req, res) => {
  checkListingId(req, res);
  const exists = await Listing.exists({ _id: req.params.listingId, isActive: true, isApproved: true });
  if (!exists) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { savedListings: req.params.listingId } },
    { new: true }
  ).select('savedListings');

  res.status(200).json({ savedListings: user.savedListings });
};

// DELETE /api/users/saved/:listingId  (protected)
// No existence check: a buyer must be able to unsave a listing that was
// since removed.
const unsaveListing = async (req, res) => {
  checkListingId(req, res);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedListings: req.params.listingId } },
    { new: true }
  ).select('savedListings');

  res.status(200).json({ savedListings: user.savedListings });
};

module.exports = { getMyEnquiries, updateProfile, uploadAvatar, getSavedListings, saveListing, unsaveListing };
