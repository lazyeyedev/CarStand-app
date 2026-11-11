const express = require('express');
const router = express.Router();

const {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  deleteListingImage,
  getDealerListings,
  getDealerListing,
  submitEnquiry,
} = require('../controllers/listingController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../utils/cloudinaryUpload');

// Public
router.get('/', getListings);
router.get('/dealer/mine', protect, authorize('dealer'), getDealerListings);
router.get('/dealer/mine/:id', protect, authorize('dealer'), getDealerListing);
router.get('/:id', getListing);

// Dealer protected
router.post(
  '/',
  protect,
  authorize('dealer'),
  upload.array('images', 10),
  createListing
);

router.put(
  '/:id',
  protect,
  authorize('dealer'),
  upload.array('images', 10),
  updateListing
);

router.delete('/:id', protect, authorize('dealer'), deleteListing);
router.delete('/:id/images', protect, authorize('dealer'), deleteListingImage);

// Enquiry — open to guests and signed-in users
router.post('/:id/enquiry', optionalAuth, submitEnquiry);

module.exports = router;
