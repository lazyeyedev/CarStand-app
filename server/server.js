

require('dotenv').config();
require('express-async-errors');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes    = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const dealerRoutes  = require('./routes/dealerRoutes');
const userRoutes    = require('./routes/userRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const boostRoutes   = require('./routes/boostRoutes');

connectDB();

const app = express();

// CLIENT_URL may contain multiple comma-separated origins (e.g. local dev + production).
// The `cors` package treats a plain string as one literal value, so a comma-separated
// string gets echoed back verbatim and rejected by browsers as an invalid header.
// Parse it into a list and validate the incoming request's origin against it instead.
// Trailing slashes are stripped since browsers never send one in the Origin header —
// a stray trailing slash in the env var would otherwise silently break the match.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : origin;
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    // IMPORTANT: pass `false`, not an Error — throwing here routes into the
    // Express error handler and can produce a malformed/header-less response
    // on preflight OPTIONS requests, which browsers report as an ambiguous
    // "CORS request did not succeed" failure instead of a clean rejection.
    callback(null, false);
  },
  credentials: true,
}));

app.use(helmet());
// 'dev' is verbose (colored, per-request console output) — fine for local
// development but noisy and unnecessary on a production log stream.
// 'combined' is the standard Apache-style access log format for prod.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// NOTE: express.json() is applied globally here.
// The Paystack webhook route applies express.raw() at the route level
// BEFORE express.json() touches it, so signature verification works correctly.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use('/api/auth',     authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dealers',  dealerRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/boosts',   boostRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
