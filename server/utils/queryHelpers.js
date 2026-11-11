// Shared helpers for turning query-string input into safe Mongo queries.

// Escape regex metacharacters so user text is matched literally. Without this,
// a search for "(" throws inside Mongo and a crafted pattern can pin the CPU.
const escapeRegex = (value) => String(value).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "contains" filter on a user-supplied string.
const contains = (value) => ({ $regex: escapeRegex(value), $options: 'i' });

// page/limit from the query string, tolerant of junk ("abc", "-5", "").
const paginate = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page  = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

// A finite number, or undefined if the input isn't one.
const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

module.exports = { escapeRegex, contains, paginate, toNumber };
