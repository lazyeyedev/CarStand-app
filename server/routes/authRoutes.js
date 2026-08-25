const express = require('express');
const router = express.Router();
const {
  registerUser,
  registerDealer,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiters');

router.post('/register', registerUser);
router.post('/register/dealer', registerDealer);
// Public login and admin login both route through here — loginLimiter covers both.
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
