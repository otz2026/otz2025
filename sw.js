const CACHE_NAME = 'my-site-cache-v1'; // Можете изменить название кэша (например, "my-app-v1")

// Список файлов для кэширования (укажите свои!)
const urlsToCache = [
  '/',              // Главная страница
  '/index.html',    // Основной HTML
  '/style.css',    // CSS-файл (если есть)
  '/script.js',     // JS-файл (если есть)
  '/img/icon-192x192.png', // Иконка
  '/img/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache)) // Кэшируем файлы
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request)) // Отдаём из кэша или загружаем
  );
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js') // Укажите правильный путь, если sw.js не в корне
      .then(registration => console.log('ServiceWorker зарегистрирован'))
      .catch(err => console.log('Ошибка ServiceWorker:', err));
  });
}
