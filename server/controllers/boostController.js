const crypto  = require('crypto');
const Boost   = require('../models/Boost');
const Listing = require('../models/Listing');
const Dealer  = require('../models/Dealer');
const { initializePayment, verifyPayment } = require('../utils/paystackService');
const { getPublicClientUrl } = require('../utils/clientUrl');
const { PRICING, priceFor, activateBoost } = require('../utils/boostService');

// GET /api/boosts/pricing  (public)
const getBoostPricing = (req, res) => {
  res.status(200).json(PRICING);
};

// POST /api/boosts/initialize  (dealer only)
const initializeBoost = async (req, res) => {
  const { listingId, boostType = 'featured' } = req.body;
  const days = parseInt(req.body.durationDays, 10);

  if (!listingId || !days) {
    res.status(400);
    throw new Error('listingId and durationDays are required');
  }

  const amount = priceFor(boostType, days);
  if (!amount) {
    res.status(400);
    throw new Error('Choose a boost of 7, 14 or 30 days');
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    res.status(503);
    throw new Error('Payments are not set up yet. Please try again later.');
  }

  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const listing = await Listing.findOne({ _id: listingId, dealer: dealer._id });
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found or does not belong to your account');
  }

  // Don't take money for a listing the public can't see.
  if (!dealer.isApproved || !listing.isApproved || !listing.isActive) {
    res.status(400);
    throw new Error('Only live listings can be boosted. This one is not live yet.');
  }

  let payment;
  try {
    payment = await initializePayment({
      email: req.user.email,
      amount,
      metadata: {
        listingId:    listing._id.toString(),
        boostType,
        durationDays: days,
        dealerId:     dealer._id.toString(),
      },
      callbackUrl: `${getPublicClientUrl()}/dealer/boost/success`,
    });
  } catch (err) {
    console.error('Paystack initialize failed:', err.response?.data || err.message);
    res.status(502);
    throw new Error('The payment provider could not start this payment. Please try again.');
  }

  res.status(200).json({
    authorization_url: payment.authorization_url,
    reference: payment.reference,
    amount,
    boostType,
    durationDays: days,
  });
};

// POST /api/boosts/webhook  (public — Paystack server-to-server)
// Mounted in server.js ahead of express.json() so req.body is the raw Buffer.
const paystackWebhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const rawBody   = req.body;

  if (!signature || !Buffer.isBuffer(rawBody) || !process.env.PAYSTACK_SECRET_KEY) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(hash);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  if (event.event === 'charge.success' && event.data) {
    try {
      await activateBoost({
        reference: event.data.reference,
        amount:    event.data.amount,
        currency:  event.data.currency,
        metadata:  event.data.metadata,
      });
    } catch (err) {
      // A payment that isn't a valid boost purchase is logged, not retried:
      // answering non-200 would make Paystack resend the same event for days.
      console.error('Webhook could not activate boost:', event.data.reference, err.message);
    }
  }

  res.status(200).json({ received: true });
};

// GET /api/boosts/verify/:reference  (dealer only)
// The page Paystack sends the dealer back to calls this. It confirms the
// payment with Paystack and activates the boost if the webhook hasn't already.
const verifyBoostPayment = async (req, res) => {
  const { reference } = req.params;

  const dealer = await Dealer.findOne({ user: req.user._id });
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  let transaction;
  try {
    transaction = await verifyPayment(reference);
  } catch (err) {
    res.status(400);
    throw new Error('This payment could not be confirmed. If you were charged, contact support with your payment reference.');
  }

  // A dealer can only confirm their own purchase.
  if (transaction.metadata?.dealerId !== dealer._id.toString()) {
    res.status(404);
    throw new Error('Payment not found');
  }

  let boost;
  try {
    boost = await activateBoost({
      reference,
      amount:   transaction.amount,
      currency: transaction.currency,
      metadata: transaction.metadata,
    });
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }

  boost = await Boost.findById(boost._id).populate('listing', 'title make model year');
  res.status(200).json({ status: 'active', boost });
};

module.exports = { getBoostPricing, initializeBoost, paystackWebhook, verifyBoostPayment };
