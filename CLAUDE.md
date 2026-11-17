# CLAUDE.md

Carmium (repo name CarStand-app) is a car marketplace for Ghana. Two independent npm projects live in one repo, with no root package.json or workspace:

- `client/`: React 19 on Create React App (`react-scripts`), React Router 7, react-hook-form + yup, axios, react-toastify. Plain CSS in `src/styles/global.css`, with no CSS framework.
- `server/`: Express 4 on CommonJS, Mongoose 9 (MongoDB Atlas), JWT auth, Cloudinary uploads via multer, Paystack payments for listing boosts, and Resend for email.

## Commands

Run each in its own folder. Neither project has a lint script beyond CRA's built-in ESLint, and there are no test files yet.

```bash
cd server && npm install && npm run dev   # nodemon, port 5000 by default
cd server && npm start                    # production
cd server && npm run seed                 # create first admin from SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD (--reset to replace)
cd client && npm install && npm start     # http://localhost:3000
cd client && npm run build
cd client && CI=true npm test             # non-interactive Jest
```

The root `.npmrc` (`legacy-peer-deps=true`) is UTF-16 encoded and outside both projects, so npm ignores it. Plain `npm install` currently succeeds in both folders.

## Environment

`server/.env` follows `server/.env.example`. It needs `MONGO_URI`, `JWT_SECRET` and `JWT_EXPIRES_IN`, the Cloudinary keys, and `CLIENT_URL` (comma-separated list of allowed CORS origins). `RESEND_API_KEY` must be set (any non-empty value) or the server crashes on boot, because `utils/emailService.js` constructs the Resend client at import time. Optional keys are `RESET_TOKEN_SECRET`, `EMAIL_FROM` and `PAYSTACK_SECRET_KEY`/`PAYSTACK_PUBLIC_KEY`. `client/.env` takes `REACT_APP_API_URL` and defaults to `http://localhost:5000/api`. Never commit `.env` files.

The server starts without a database, but every `/api` route other than `/api/health` returns 503 until Mongo connects (`config/db.js` → `isDbReady`). `server.js` forces DNS to 8.8.8.8 so Atlas SRV lookups work. In a sandbox that blocks direct DNS, that line can stop the connection.

## Server architecture

`server.js` mounts these routes under `/api`: `auth`, `listings`, `dealers`, `users`, `admin` and `boosts`. Each route file lives in `routes/`, its handlers in `controllers/`, and its schemas in `models/` (User, Dealer, Listing, Enquiry, Boost).

- Auth is `middleware/authMiddleware.js`. `protect` requires a Bearer token, rejects inactive users and rejects tokens issued before `passwordChangedAt`. `optionalAuth` serves guest-or-user routes. Roles are enforced with `authorize('dealer')` and similar from `roleMiddleware.js`. The roles are `user`, `dealer` and `admin`.
- Errors: `express-async-errors` is loaded, so controllers set `res.status(...)` and `throw new Error(msg)` rather than calling `next(err)`. `errorMiddleware.js` maps Mongoose validation, duplicate-key and CastError failures to 400/404 JSON `{ message }`.
- The Paystack webhook (`POST /api/boosts/webhook`) is mounted in `server.js` with `express.raw` before `express.json` because signature verification needs the raw body. Keep that ordering.
- Rate limiting: a global limit of 100 requests per 15 minutes, plus stricter per-route limiters in `middleware/rateLimiters.js`.
- Helpers live in `utils/`. They cover Cloudinary upload and delete (`cloudinaryUpload.js`, `extractPublicId.js`), Paystack and boost logic (`paystackService.js`, `boostService.js`), email (`emailService.js`), query/filter building (`queryHelpers.js`) and password rules (`validatePassword.js`).

## Client architecture

- `src/App.jsx` defines all routes. `components/ProtectedRoute.jsx` gates them by role. The dealer and admin areas use the layouts in `pages/dealer/DealerLayout.jsx` and `pages/admin/AdminLayout.jsx`, built on `components/DashboardShell.jsx`.
- `src/api/axiosInstance.js` is the only HTTP client. It attaches `carstand_token` from localStorage, and on a 401 it clears the session and redirects to `/login` (or `/admin/login`), except on the credential endpoints listed in `CREDENTIAL_ENDPOINTS`.
- `src/context/AuthContext.jsx` holds the signed-in user, also mirrored to localStorage as `carstand_user`.
- Shared dropdown values live in `utils/options.js`. Support-chat copy lives in `utils/supportContent.js`.

## Deployment

The backend deploys to Render (`npm start`, set `NODE_ENV=production`). The free tier cold-starts, which is why the client's axios timeout is 60s. The frontend deploys to Vercel (`npm run build`, output `build/`).

## Repo quirks

`client/react-scripts` is an empty stray file, not the package. The real package is in `node_modules`.
