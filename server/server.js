

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
const { isDbReady } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes    = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const dealerRoutes  = require('./routes/dealerRoutes');
const userRoutes    = require('./routes/userRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const boostRoutes   = require('./routes/boostRoutes');
const { paystackWebhook } = require('./controllers/boostController');

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
// The Paystack webhook has to see the raw request bytes to check the signature,
// so it is mounted BEFORE express.json(). (Declaring express.raw on the route
// inside boostRoutes was not enough — the global JSON parser ran first and the
// handler received a parsed object, which made every webhook call fail.)
app.post('/api/boosts/webhook', express.raw({ type: 'application/json' }), paystackWebhook);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Health check: open /api/health in a browser to see whether the server is up
// and whether it can reach the database.
app.get('/api/health', (req, res) => {
  res.status(isDbReady() ? 200 : 503).json({ server: 'up', database: isDbReady() ? 'connected' : 'not connected' });
});

// Without a database nothing below can work — say so plainly instead of
// letting each request fail with a generic error.
app.use('/api', (req, res, next) => {
  if (isDbReady()) return next();
  res.status(503).json({ message: 'The service is temporarily unavailable. Please try again in a moment.' });
});

app.use('/api/auth',     authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dealers',  dealerRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/boosts',   boostRoutes);

// Unknown API route -> JSON 404 rather than Express's HTML page
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

app.use(errorHandler);

// Last line of defence: a promise nobody awaited must not take the server down.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
