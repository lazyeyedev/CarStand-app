const errorHandler = (err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // Malformed ObjectId in a URL (/listings/abc) — a bad link, not a server fault
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Not found' });
  }

  // Upload problems (file too large, too many files, wrong type)
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5MB or smaller'
      : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Too many images — the maximum is 10'
      : 'Upload failed';
    return res.status(400).json({ message: msg });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  // Never send internals to the browser on an unexpected failure. The stack
  // is only included when NODE_ENV is explicitly "development" — if the
  // variable is simply unset on the host, nothing leaks.
  const isDev = process.env.NODE_ENV === 'development';
  if (statusCode === 500) console.error(err);
  res.status(statusCode).json({
    message: statusCode === 500 && !isDev ? 'Something went wrong. Please try again.' : (err.message || 'Server error'),
    ...(isDev ? { stack: err.stack } : {}),
  });
};

module.exports = { errorHandler };
