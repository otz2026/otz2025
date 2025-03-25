const CACHE_NAME = 'my-site-cache-v3'; // Измените версию
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/img/icon-192x192.png',
  '/img/icon-512x512.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache opened');
        return cache.addAll(urlsToCache)
          .then(() => console.log('[SW] All files cached'))
          .catch(err => console.error('[SW] Cache addAll error:', err));
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  console.log('[SW] Fetch:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
