const CACHE_NAME = 'otz-admin-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './news_data.json',
  '../otz2025/img/OTZ3.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
