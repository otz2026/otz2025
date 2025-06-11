const CACHE_NAME = 'otz-cache-v1';
const urlsToCache = [
    '/otz2025/',
    '/otz2025/img/icon-512x512.png',
    '/otz2025/img/logo.png',
    '/otz2025/img/Paw Patrol.png',
    '/otz2025/img/Bulldogs.png',
    '/otz2025/img/Kitty Boys.png',
    '/otz2025/img/Megands.png',
    '/otz2025/img/Crumbl Bishes.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
