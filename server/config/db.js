const mongoose = require('mongoose');

const RETRY_MS = 10000;

// Connects to MongoDB and keeps trying if it can't. A failed connection is
// logged with the reason (wrong password, IP not allowed, cluster paused…)
// so the cause is visible in the host's logs, and the server stays up to
// answer with a clear 503 until the database is reachable.
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MongoDB: MONGO_URI is not set. Add it to the environment.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection FAILED: ${err.message}`);
    console.error(`Retrying in ${RETRY_MS / 1000}s…`);
    setTimeout(connectDB, RETRY_MS);
  }
};

mongoose.connection.on('disconnected', () => console.error('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

const isDbReady = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDbReady = isDbReady;
