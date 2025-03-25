const CACHE_NAME = 'otz-cache-v5';
const API_CACHE = 'otz-api-v2';
const ASSETS = [
  '/otz2025/',
  '/otz2025/index.html',
  '/otz2025/styles.css',
  '/otz2025/app.js',
  '/otz2025/manifest.json',
  '/otz2025/img/icon-192x192.png',
  '/otz2025/img/icon-512x512.png'
];

// Установка - кэшируем только критически важные ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация - очищаем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => 
        key !== CACHE_NAME && key !== API_CACHE ? caches.delete(key) : null
      ))
  );
});

// Стратегия кэширования
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Для API - Network First с быстрым ответом из кэша
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        try {
          // Пытаемся получить свежие данные
          const networkResponse = await fetch(event.request);
          // Обновляем кэш в фоне
          event.waitUntil(
            cache.put(event.request, networkResponse.clone())
          );
          return networkResponse;
        } catch (err) {
          // Если сеть недоступна - берём из кэша
          const cachedResponse = await cache.match(event.request);
          return cachedResponse || new Response(JSON.stringify({
            error: "Офлайн-режим",
            cached: true
          }), {
            headers: {'Content-Type': 'application/json'}
          });
        }
      })()
    );
    return;
  }

  // Для статики - Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  
  await Promise.all(requests.map(async request => {
    try {
      const networkResponse = await fetch(request);
      await cache.put(request, networkResponse.clone());
    } catch (err) {
      console.log(`Не удалось обновить: ${request.url}`);
    }
  }));
}
