const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    title: { type: String, required: true, trim: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, enum: ['GHS', 'USD'], default: 'GHS' },
    mileage: { type: Number },
    mileageUnit: { type: String, enum: ['km', 'miles'], default: 'km' },
    transmission: { type: String, enum: ['automatic', 'manual'] },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
    condition: { type: String, enum: ['new', 'foreign used', 'locally used'] },
    bodyType: {
      type: String,
      enum: ['sedan', 'suv', 'pickup', 'hatchback', 'coupe', 'van', 'bus', 'convertible', 'truck'],
    },
    color: { type: String },
    description: { type: String, maxlength: 2000 },
    images: {
      type: [String],
      validate: { validator: (arr) => arr.length <= 10, message: 'Maximum 10 images allowed.' },
    },
    location: { type: String },
    region: { type: String },
    isFeatured: { type: Boolean, default: false },
    isBoosted: { type: Boolean, default: false },
    boostExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    enquiryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes matching the actual query shapes in listingController/adminController.
//
// 1. Public search + home feed (getListings): filters on isActive+isApproved,
//    optionally isBoosted, sorts by isBoosted desc then createdAt desc.
//    This compound index covers the filter and the sort together.
listingSchema.index({ isActive: 1, isApproved: 1, isBoosted: -1, createdAt: -1 });

// 2. Dealer's own listings (dealerController / admin dealer detail):
//    filters on dealer, sorts by createdAt desc.
listingSchema.index({ dealer: 1, createdAt: -1 });

// 3. Admin listing search (getAllListings): filters on isApproved alone,
//    sorts by createdAt desc.
listingSchema.index({ isApproved: 1, createdAt: -1 });

// 4. Range/equality filters used in the public search form.
listingSchema.index({ price: 1 });
listingSchema.index({ year: 1 });

// Note: make/model/region/title filters use unanchored case-insensitive
// $regex (e.g. { $regex: 'corolla', $options: 'i' }) with no leading '^'.
// Mongo can't use a standard index for an unanchored regex — it still has
// to scan every candidate document character-by-character. A real fix for
// those fields (if search volume grows) is a text index or a search
// service (Atlas Search / Elasticsearch), not a btree index, so none is
// added here for make/model/region — it would sit unused.

module.exports = mongoose.model('Listing', listingSchema);
