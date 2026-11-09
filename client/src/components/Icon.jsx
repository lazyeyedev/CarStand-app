// Inline stroke icons (Lucide geometry, 24px grid) so the app has no emoji
// and no icon-font dependency. Decorative by default; pass `label` when the
// icon is the only content of a control so screen readers announce it.
const PATHS = {
  search:   <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  pin:      <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  mail:     <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  phone:    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />,
  whatsapp: <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21Zm6-12a.5.5 0 0 0 1 0V8a.5.5 0 0 0-1 0v1Zm0 0a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />,
  check:    <path d="M20 6 9 17l-5-5" />,
  checkCircle: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  shield:   <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  x:        <path d="M18 6 6 18M6 6l12 12" />,
  menu:     <path d="M4 6h16M4 12h16M4 18h16" />,
  chevDown: <path d="m6 9 6 6 6-6" />,
  chevLeft: <path d="m15 18-6-6 6-6" />,
  chevRight:<path d="m9 18 6-6-6-6" />,
  arrowRight:<path d="M5 12h14m-6-6 6 6-6 6" />,
  arrowLeft:<path d="M19 12H5m6 6-6-6 6-6" />,
  car:      <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10 16 6.4A2 2 0 0 0 14.3 5.5H9.7a2 2 0 0 0-1.7.9L5.6 10l-2.1 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M9 17h6" /></>,
  gauge:    <><path d="m12 14 4-4" /><path d="M3.3 19a10 10 0 1 1 17.4 0" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  fuel:     <><path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.8a2 2 0 0 0-.6-1.4L18 5" /></>,
  cog:      <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
  eye:      <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  message:  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
  plus:     <path d="M12 5v14M5 12h14" />,
  edit:     <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash:    <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></>,
  upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
  image:    <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>,
  grid:     <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  list:     <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  user:     <><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  users:    <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  store:    <><path d="m2 7 1.6-4h16.8L22 7" /><path d="M2 7v2a3 3 0 0 0 5 2.2 3 3 0 0 0 5 0 3 3 0 0 0 5 0A3 3 0 0 0 22 9V7" /><path d="M4 12v9h16v-9M10 21v-5h4v5" /></>,
  zap:      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  star:     <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />,
  logout:   <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  home:     <><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22V12h6v10" /></>,
  dashboard:<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  filter:   <path d="M22 3H2l8 9.5V19l4 2v-8.5Z" />,
  lock:     <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  alert:    <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>,
  info:     <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  clock:    <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  external: <><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  sparkles: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9ZM5 3v4M3 5h4M19 17v4M17 19h4" />,
  trend:    <path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6" />,
  ban:      <><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>,
  refresh:  <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></>,
  card:     <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
};

export default function Icon({ name, label, className = '', size, style }) {
  const glyph = PATHS[name];
  if (!glyph) return null;
  const dims = size ? { width: size, height: size } : null;
  return (
    <svg
      viewBox="0 0 24 24"
      className={`icon ${className}`.trim()}
      style={dims ? { ...dims, ...style } : style}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      {glyph}
    </svg>
  );
}

// The CarStand mark: red carport roof over a car, matching the delivered logo.
export function BrandMark({ className = 'brand-mark' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <path d="M6 13 30 6l5 7-3 15h-3l2-13-3-4L9 16v12H6Z" fill="#c41e2a" />
      <path d="M12 27c0-3 1.5-5 3-6h11c1.5 1 3 3 3 6v1h-17Z" fill="#ececec" />
      <path d="M15 24h3m6 0h3" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 31h32" stroke="#c41e2a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ to = '/', Link }) {
  return (
    <Link to={to} className="brand" aria-label="CarStand home">
      <BrandMark />
      <span>Car<b>Stand</b></span>
    </Link>
  );
}
