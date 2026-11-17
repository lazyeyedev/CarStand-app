const express = require('express');
const router  = express.Router();
const {
  getMyEnquiries, updateProfile, uploadAvatar,
  getSavedListings, saveListing, unsaveListing,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/enquiries', getMyEnquiries);
router.put('/profile', uploadAvatar, updateProfile);

router.get('/saved', getSavedListings);
router.post('/saved/:listingId', saveListing);
router.delete('/saved/:listingId', unsaveListing);

module.exports = router;
