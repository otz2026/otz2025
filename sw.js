// Конфигурация кэша
const CACHE_VERSION = 'v1.0.3'; // Меняйте при обновлениях
const BASE_PATH = '/otz2025/'; // Укажите ваш путь на GitHub Pages
const CACHE_NAME = `otz-cache-${CACHE_VERSION}`;

// Файлы для предварительного кэширования (обязательно полные пути)
const PRECACHE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'style.css',
  BASE_PATH + 'script.js',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'img/icon-192x192.png',
  BASE_PATH + 'img/icon-512x512.png'
];

// ===== Установка и кэширование =====
self.addEventListener('install', (event) => {
  console.log('[SW] Установка версии', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование основных ресурсов');
        return cache.addAll(
          PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' }))
        ).catch(err => {
          console.error('[SW] Ошибка кэширования:', err);
          throw err;
        });
      })
  );
});

// ===== Активация =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация новой версии');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ===== Стратегия кэширования =====
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Пропускаем POST-запросы и другие не-GET
  if (event.request.method !== 'GET') return;
  
  // Для файлов из нашего origin используем Cache-First стратегию
  if (requestUrl.origin === location.origin) {
    // Для основных ресурсов - из кэша с fallback на сеть
    if (PRECACHE_ASSETS.some(path => requestUrl.pathname === path)) {
      event.respondWith(
        caches.match(event.request)
          .then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
          })
      );
      return;
    }
  }
  
  // Для всех остальных запросов - сеть с fallback на кэш
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Клонируем ответ для кэширования
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ===== Уведомления =====
self.addEventListener('push', (event) => {
  // Здесь можно добавить обработку push-уведомлений
  console.log('[SW] Push событие получено', event);
});
