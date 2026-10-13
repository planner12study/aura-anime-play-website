/* AnimeKurd service worker.
   - App shell (HTML/CSS/JS/font/icons): precached, served cache-first => instant loads + offline.
   - Same-origin data/images: stale-while-revalidate.
   - Cross-origin (video streams, iframes, remote posters): never intercepted. */
const VERSION = 'v1';                 // bump to ship updates
const CACHE = `animekurd-${VERSION}`;
const SHELL = [
  './', 'index.html', 'css/style.css', 'js/app.js', 'manifest.json',
  'data/anime.json', 'icons/icon-192.png', 'icons/icon-512.png'
];
const OPTIONAL = ['fonts/Speda-Bold.woff2', 'fonts/Speda-Bold.ttf']; // may not exist yet

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    await Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {}))); // don't fail install if font is missing
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('animekurd-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // let video/embeds go straight to the network

  // Page navigations: network-first, fall back to cached shell when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  // Everything else same-origin: cache-first + background refresh
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => cached);
    return cached || refresh;
  })());
});
