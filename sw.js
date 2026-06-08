const CACHE_NAME = 'sugar-dragon-v1';

const CORE_ASSETS = [
  '/reader.html',
  '/manifest.webmanifest',
  '/assets/brand.css',
  '/assets/reader.css',
  '/book1/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API routes: always network
  if (url.pathname.startsWith('/api/')) return;

  // Never intercept cross-origin requests
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful same-origin GET responses for book assets
        if (
          response.ok &&
          event.request.method === 'GET' &&
          (url.pathname.startsWith('/book1/') ||
           url.pathname.startsWith('/assets/') ||
           url.pathname === '/manifest.webmanifest')
        ) {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        }
        return response;
      });
    })
  );
});
