const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  // Suspended/deactivated accounts lose access immediately, not when the
  // token happens to expire.
  if (!user.isActive) {
    res.status(401);
    throw new Error('Not authorized, account is deactivated');
  }

  // Tokens issued before the last password change are dead. Compared at
  // second precision because JWT iat is in seconds — a token issued in the
  // same second as the change (the one change-password hands back) stays valid.
  if (user.passwordChangedAt &&
      decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    res.status(401);
    throw new Error('Not authorized, password was changed — please sign in again');
  }

  req.user = user;
  next();
};

module.exports = { protect };
