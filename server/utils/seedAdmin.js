require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');
const validatePassword = require('./validatePassword');

// Credentials come from the environment, never from this file — the repo is public.
//
//   Create the first admin:      npm run seed
//   Replace the existing admin's email + password:   npm run seed -- --reset
//
// --reset also sets passwordChangedAt, which signs out every existing admin session.
const ADMIN_EMAIL    = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || '';
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME || 'CarStand Admin';
const RESET          = process.argv.includes('--reset');

const fail = (msg) => { console.error(msg); process.exit(1); };

const seed = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env first.');
  }
  const pwError = validatePassword(ADMIN_PASSWORD);
  if (pwError) fail(`SEED_ADMIN_PASSWORD rejected: ${pwError}`);

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('+password');

    if (existing && !RESET) {
      console.log(`An admin already exists (${existing.email}). Run with --reset to replace its credentials.`);
      process.exit(0);
    }

    if (existing && RESET) {
      const clash = await User.findOne({ email: ADMIN_EMAIL, _id: { $ne: existing._id } });
      if (clash) fail(`${ADMIN_EMAIL} is already used by another account.`);

      existing.email = ADMIN_EMAIL;
      existing.password = ADMIN_PASSWORD;
      existing.passwordChangedAt = new Date();
      await existing.save();
      console.log(`Admin credentials replaced. Sign in as ${ADMIN_EMAIL}. All old admin sessions are now invalid.`);
      process.exit(0);
    }

    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin created. Sign in as ${ADMIN_EMAIL}.`);
    process.exit(0);
  } catch (err) {
    fail(`Seed failed: ${err.message}`);
  }
};

seed();
