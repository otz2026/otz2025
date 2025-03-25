const CACHE_NAME = 'my-site-cache-v2'; // Версия кэша (меняйте при обновлениях!)

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/img/icon-192x192.png',
  '/img/icon-512x512.png'
];

// Установка и кэширование файлов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Ошибка кэширования:', err);
        });
      })
  );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
