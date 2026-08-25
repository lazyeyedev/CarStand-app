const rateLimit = require('express-rate-limit');

// Tighter than the global 100/15min limiter — login is the highest-value
// target for credential stuffing / brute force, so it gets its own cap.
// Public login and admin login both go through POST /api/auth/login,
// so this one limiter covers both.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter };
