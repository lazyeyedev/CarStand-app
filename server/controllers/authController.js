const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Dealer = require('../models/Dealer');
const generateToken = require('../utils/generateToken');
const validatePassword = require('../utils/validatePassword');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { getPublicClientUrl } = require('../utils/clientUrl');

// Separate secret for password-reset tokens if provided, otherwise reuse
// JWT_SECRET. Kept as a distinct signing call (not generateToken) since
// reset tokens carry a different payload shape and purpose than auth tokens.
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET;
const RESET_TOKEN_EXPIRES_IN = '1h';

// POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password, role: 'user' });

  // Fire-and-forget welcome email
  sendWelcomeEmail({ email: user.email, name: user.name }).catch(() => {});

  const token = generateToken({ id: user._id, role: user.role });

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
    },
  });
};

// POST /api/auth/register/dealer
const registerDealer = async (req, res) => {
  const { name, email, password, businessName, businessAddress, region, phone, whatsapp } = req.body;

  if (!name || !email || !password || !businessName || !businessAddress || !region || !phone) {
    res.status(400);
    throw new Error('Please provide all required fields: name, email, password, businessName, businessAddress, region, phone');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password, role: 'dealer', phone });

  const dealer = await Dealer.create({
    user: user._id,
    businessName,
    businessAddress,
    region,
    phone,
    whatsapp: whatsapp || '',
  });

  // Fire-and-forget welcome email
  sendWelcomeEmail({ email: user.email, name: user.name }).catch(() => {});

  const token = generateToken({ id: user._id, role: user.role });

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    dealer: {
      _id: dealer._id,
      businessName: dealer.businessName,
      businessAddress: dealer.businessAddress,
      region: dealer.region,
      phone: dealer.phone,
      subscriptionTier: dealer.subscriptionTier,
      isApproved: dealer.isApproved,
    },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact support.');
  }

  let dealerProfile = null;
  if (user.role === 'dealer') {
    dealerProfile = await Dealer.findOne({ user: user._id });
  }

  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
    },
    dealer: dealerProfile,
  });
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  let dealerProfile = null;
  if (req.user.role === 'dealer') {
    dealerProfile = await Dealer.findOne({ user: req.user._id });
  }

  res.status(200).json({
    user: req.user,
    dealer: dealerProfile,
  });
};

// PUT /api/auth/change-password  (protected)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide currentPassword and newPassword');
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save bcrypt hook

  res.status(200).json({ message: 'Password updated successfully' });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const user = await User.findOne({ email });

  // Always return the same response whether or not the account exists —
  // this prevents the endpoint from being used to enumerate registered emails.
  if (user) {
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      RESET_TOKEN_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN }
    );
    const resetUrl = `${getPublicClientUrl()}/reset-password?token=${resetToken}`;

    sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl }).catch(() => {});
  }

  res.status(200).json({
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400);
    throw new Error('Please provide a reset token and new password');
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, RESET_TOKEN_SECRET);
  } catch (err) {
    res.status(400);
    throw new Error('This reset link is invalid or has expired');
  }

  if (decoded.purpose !== 'password_reset') {
    res.status(400);
    throw new Error('This reset link is invalid or has expired');
  }

  const user = await User.findById(decoded.id).select('+password');
  if (!user) {
    res.status(400);
    throw new Error('This reset link is invalid or has expired');
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save bcrypt hook

  res.status(200).json({ message: 'Password has been reset successfully. You can now sign in.' });
};

module.exports = {
  registerUser,
  registerDealer,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
