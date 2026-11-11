/* Carmium service worker — makes the site installable as an app and keeps it
   usable on a flaky connection. Plain JavaScript, no build step, no libraries.

   What it does:
     - Page loads: always try the network first, so a new deploy shows up on
       the next load. If the network is down, show the last copy of the app,
       or the offline page if there is none.
     - Hashed build files (/static/…): served from cache once downloaded. Their
       names change on every build, so a cached copy can never be stale.
     - Everything else — the API, Cloudinary photos, Paystack, fonts — is left
       alone and goes straight to the network. API data is never cached.

   Bump VERSION to throw away every cache on the next visit. */
const VERSION = 'v1';
const SHELL = `carmium-shell-${VERSION}`;
const ASSETS = `carmium-assets-${VERSION}`;
const PRECACHE = ['/offline.html', '/logo192.png', '/manifest.json'];

// Download the app itself on the first visit, so it can reopen with no
// connection straight away. The first page load happens before this worker is
// in control, so nothing from it would otherwise be cached.
const precacheApp = async () => {
  const shell = await caches.open(SHELL);
  await shell.addAll(PRECACHE);

  try {
    const page = await fetch('/', { cache: 'no-store' });
    if (page.ok) await shell.put('/index.html', page);

    // CRA writes the list of built files (with their hashed names) here
    const manifest = await (await fetch('/asset-manifest.json', { cache: 'no-store' })).json();
    const files = Object.values(manifest.files || {})
      .filter((f) => typeof f === 'string' && f.startsWith('/static/') && /\.(js|css)$/.test(f));
    const assets = await caches.open(ASSETS);
    await Promise.all(files.map((f) => assets.add(f).catch(() => {})));
  } catch (err) {
    // Not fatal: files are still cached one by one as they are requested.
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(precacheApp().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('carmium-') && k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API, images, fonts, payments

  // Opening or reloading a page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL);
          return (await cache.match('/index.html')) || (await cache.match('/offline.html'));
        })
    );
    return;
  }

  // Hashed build output
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
  }
});
