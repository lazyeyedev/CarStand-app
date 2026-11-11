const crypto  = require('crypto');
const Boost   = require('../models/Boost');
const Listing = require('../models/Listing');
const Dealer  = require('../models/Dealer');
const { initializePayment, verifyPayment } = require('../utils/paystackService');
const { getPublicClientUrl } = require('../utils/clientUrl');

const PRICING = {
  featured: { 7: 50,  14: 90,  30: 150 },
  top:      { 7: 80,  14: 140, 30: 220 },
  banner:   { 7: 120, 14: 200, 30: 320 },
};

// GET /api/boosts/pricing  (public)
const getBoostPricing = (req, res) => {
  res.status(200).json(PRICING);
};

// POST /api/boosts/initialize  (dealer only)
const initializeBoost = async (req, res) => {
  const { listingId, boostType, durationDays } = req.body;

  if (!listingId || !boostType || !durationDays) {
    res.status(400);
    throw new Error('listingId, boostType, and durationDays are required');
  }

  const days = parseInt(durationDays);

  if (!PRICING[boostType] || !PRICING[boostType][days]) {
    res.status(400);
    throw new Error(`Invalid boost type or duration. Valid types: featured, top, banner. Valid durations: 7, 14, 30`);
  }

  const dealer = await Dealer.findOne({ user: req.user._id }).populate('user', 'email');
  if (!dealer) {
    res.status(404);
    throw new Error('Dealer profile not found');
  }

  const listing = await Listing.findOne({ _id: listingId, dealer: dealer._id });
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found or does not belong to your account');
  }

  const amount = PRICING[boostType][days];

  const { authorization_url, reference } = await initializePayment({
    email: dealer.user.email,
    amount,
    metadata: {
      listingId:   listingId,
      boostType:   boostType,
      durationDays: days,
      dealerId:    dealer._id.toString(),
    },
    callbackUrl: `${getPublicClientUrl()}/dealer/boost/success`,
  });

  res.status(200).json({
    authorization_url,
    reference,
    amount,
    boostType,
    durationDays: days,
  });
};

// POST /api/boosts/webhook  (public — Paystack server-to-server)
const paystackWebhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const rawBody   = req.body; // Buffer from express.raw()

  if (!signature || !Buffer.isBuffer(rawBody) || !process.env.PAYSTACK_SECRET_KEY) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // Verify signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString());

  // Only handle successful charges
  if (event.event !== 'charge.success') {
    return res.status(200).json({ received: true });
  }

  const { reference, metadata, amount } = event.data;
  const { listingId, boostType, durationDays, dealerId } = metadata;

  // Idempotency — skip if already processed
  const existing = await Boost.findOne({ paystackReference: reference });
  if (existing) {
    return res.status(200).json({ received: true });
  }

  const startDate = new Date();
  const endDate   = new Date();
  endDate.setDate(endDate.getDate() + parseInt(durationDays));

  await Boost.create({
    listing:           listingId,
    dealer:            dealerId,
    boostType,
    durationDays:      parseInt(durationDays),
    amountPaid:        amount / 100, // kobo back to GHS
    currency:          'GHS',
    startDate,
    endDate,
    paystackReference: reference,
    status:            'active',
  });

  await Listing.findByIdAndUpdate(listingId, {
    isBoosted:   true,
    boostExpiry: endDate,
  });

  res.status(200).json({ received: true });
};

// GET /api/boosts/verify/:reference  (dealer only)
const verifyBoostPayment = async (req, res) => {
  const { reference } = req.params;

  // Verify with Paystack
  const transaction = await verifyPayment(reference);

  // If the webhook already processed this reference, just return it.
  let boost = await Boost.findOne({ paystackReference: reference })
    .populate('listing', 'title make model year');

  // Fallback: webhook hasn't fired (e.g. unreachable on localhost, or delayed).
  // Since Paystack already confirmed the payment above, activate the boost here too.
  if (!boost) {
    const { listingId, boostType, durationDays, dealerId } = transaction.metadata;

    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(endDate.getDate() + parseInt(durationDays));

    boost = await Boost.create({
      listing:           listingId,
      dealer:            dealerId,
      boostType,
      durationDays:      parseInt(durationDays),
      amountPaid:        transaction.amount / 100, // kobo back to GHS
      currency:          'GHS',
      startDate,
      endDate,
      paystackReference: reference,
      status:            'active',
    });

    await Listing.findByIdAndUpdate(listingId, {
      isBoosted:   true,
      boostExpiry: endDate,
    });

    boost = await Boost.findById(boost._id).populate('listing', 'title make model year');
  }

  res.status(200).json({ status: 'active', boost });
};

module.exports = { getBoostPricing, initializeBoost, paystackWebhook, verifyBoostPayment };
