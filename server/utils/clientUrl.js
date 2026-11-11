// CLIENT_URL may hold multiple comma-separated origins for CORS purposes
// (e.g. "http://localhost:3000,https://carmiumcars.com").
// Anything that needs to build a single outbound link — Paystack callbacks,
// email links, shareable listing URLs — should use this helper instead of
// reading process.env.CLIENT_URL directly, so it always resolves to one
// real URL rather than the raw comma-separated string.
function getPublicClientUrl() {
  const raw = process.env.CLIENT_URL || 'http://localhost:3000';
  const urls = raw.split(',').map((u) => u.trim().replace(/\/+$/, '')).filter(Boolean);

  // Prefer the first https:// entry (production/public), fall back to the first entry.
  const preferred = urls.find((u) => u.startsWith('https://'));
  return preferred || urls[0] || 'http://localhost:3000';
}

module.exports = { getPublicClientUrl };
