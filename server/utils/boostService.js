const Boost   = require('../models/Boost');
const Listing = require('../models/Listing');

// One boost product: "Featured". A featured listing is sorted to the top of
// search, carries the Featured badge, and appears in the home page's featured
// row. Prices are in GHS, keyed by duration in days.
//
// (The first build also sold "top" and "banner" tiers at higher prices, but
// nothing in the app ever treated them differently from "featured" — they
// would have charged more for the same placement.)
const PRICING = {
  featured: { 7: 50, 14: 90, 30: 150 },
};

const priceFor = (boostType, days) => PRICING[boostType]?.[days];

// Turn a confirmed Paystack payment into an active boost. Called from both the
// webhook and the browser's verify call, so it must give the same result no
// matter which arrives first or whether both do.
//
// `payment` = { reference, amount (pesewas), currency, metadata }
const activateBoost = async (payment) => {
  const { reference, amount, currency, metadata } = payment;

  const existing = await Boost.findOne({ paystackReference: reference });
  if (existing) return existing;

  const { listingId, boostType, dealerId } = metadata || {};
  const days = parseInt(metadata?.durationDays, 10);
  const price = priceFor(boostType, days);

  // A payment on the account that isn't a boost purchase, or whose amount
  // doesn't match what that boost costs, must not activate anything.
  if (!listingId || !dealerId || !price) {
    const err = new Error('This payment is not a boost purchase');
    err.statusCode = 400;
    throw err;
  }
  if ((currency && currency !== 'GHS') || Number(amount) !== price * 100) {
    const err = new Error('Payment amount does not match the boost price');
    err.statusCode = 400;
    throw err;
  }

  const listing = await Listing.findOne({ _id: listingId, dealer: dealerId });
  if (!listing) {
    const err = new Error('The listing for this boost no longer exists');
    err.statusCode = 404;
    throw err;
  }

  // Buying again while still featured adds time to the end rather than
  // overlapping days the dealer has already paid for.
  const now = new Date();
  const startDate = listing.isBoosted && listing.boostExpiry && listing.boostExpiry > now
    ? new Date(listing.boostExpiry)
    : now;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  let boost;
  try {
    boost = await Boost.create({
      listing: listing._id,
      dealer: dealerId,
      boostType,
      durationDays: days,
      amountPaid: price,
      currency: 'GHS',
      startDate,
      endDate,
      paystackReference: reference,
      status: 'active',
    });
  } catch (err) {
    // Webhook and verify raced: the unique index on paystackReference let
    // only one through. Return the one that won.
    if (err.code === 11000) return Boost.findOne({ paystackReference: reference });
    throw err;
  }

  await Listing.updateOne({ _id: listing._id }, { isBoosted: true, boostExpiry: endDate });
  return boost;
};

// Featured status ends when boostExpiry passes. There is no background worker
// on the free hosting tier, so this runs on the way into the queries that care
// (public search, dealer listings, admin boosts), at most once a minute.
let lastSweep = 0;
const expireBoosts = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && now - lastSweep < 60 * 1000) return;
  lastSweep = now;
  const cutoff = new Date(now);
  await Promise.all([
    Listing.updateMany({ isBoosted: true, boostExpiry: { $lte: cutoff } }, { isBoosted: false }),
    Boost.updateMany({ status: 'active', endDate: { $lte: cutoff } }, { status: 'expired' }),
  ]);
};

module.exports = { PRICING, priceFor, activateBoost, expireBoosts };
