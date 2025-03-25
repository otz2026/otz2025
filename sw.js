const CACHE_NAME = 'otz-sync-v2';
const API_CACHE = 'otz-api-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/img/icon-192x192.png',
  '/img/icon-512x512.png',
  '/sync.js'
];

// Установка
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// Активация + очистка старых кэшей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => 
        key !== CACHE_NAME && key !== API_CACHE ? caches.delete(key) : null
      )
    )
  );
});

// Стратегия кэширования
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API запросы - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(API_CACHE)
            .then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Статические файлы - Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});

// Фоновая синхронизация (для Android)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Периодическая синхронизация (для iOS)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function syncData() {
  const cache = await caches.open(API_CACHE);
  const responses = await cache.keys();
  // Здесь логика синхронизации с сервером
}

async function updateContent() {
  // Логика обновления контента
}
