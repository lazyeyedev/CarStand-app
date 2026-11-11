const express = require('express');
const router  = express.Router();

const {
  getBoostPricing,
  initializeBoost,
  verifyBoostPayment,
} = require('../controllers/boostController');

const { protect }    = require('../middleware/authMiddleware');
const { authorize }  = require('../middleware/roleMiddleware');

// The webhook route is mounted in server.js, ahead of express.json().

// Public
router.get('/pricing', getBoostPricing);

// Dealer protected
router.post('/initialize', protect, authorize('dealer'), initializeBoost);
router.get('/verify/:reference', protect, authorize('dealer'), verifyBoostPayment);

module.exports = router;
