// Extracts a Cloudinary public_id from a secure_url so it can be passed to
// cloudinary.uploader.destroy(). Handles any folder depth (e.g.
// carstand/listings/abc123, or a future carstand/listings/2026/abc123) by
// locating the '/upload/' marker and taking everything after it — rather
// than assuming a fixed number of path segments before the filename, which
// breaks the moment the folder structure gets an extra level.
//
// Example:
//   https://res.cloudinary.com/demo/image/upload/v1699999999/carstand/listings/abc123.jpg
//   -> carstand/listings/abc123
const extractPublicId = (url) => {
  if (typeof url !== 'string' || !url) return null;

  const uploadMarker = '/upload/';
  const idx = url.indexOf(uploadMarker);
  if (idx === -1) return null;

  let rest = url.slice(idx + uploadMarker.length);

  // Strip query string / hash if present
  rest = rest.split('?')[0].split('#')[0];

  const segments = rest.split('/').filter(Boolean);

  // Cloudinary URLs usually include a version segment right after /upload/,
  // e.g. v1699999999 — strip it if present. Not every URL has one
  // (delivery URLs without versioning are valid too), so this only strips
  // when the first segment actually matches the version pattern.
  if (segments.length && /^v\d+$/.test(segments[0])) {
    segments.shift();
  }

  if (!segments.length) return null;

  const path = segments.join('/'); // e.g. carstand/listings/abc123.jpg
  const lastDot = path.lastIndexOf('.');
  return lastDot === -1 ? path : path.slice(0, lastDot);
};

module.exports = extractPublicId;
