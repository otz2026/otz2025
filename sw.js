// Конфигурация
const CACHE_VERSION = 'v1.3';
const CACHE_NAME = `otz-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `otz-api-cache-${CACHE_VERSION}`;
const BASE_PATH = '/otz2025/';

// Файлы для предварительного кэширования
const PRE_CACHE_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}styles.css`,
  `${BASE_PATH}app.js`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}img/icon-192x192.png`,
  `${BASE_PATH}img/icon-512x512.png`
];

// Установка и кэширование
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Кэширование основных ресурсов');
        return cache.addAll(PRE_CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;

  // Пропускаем не-GET запросы
  if (request.method !== 'GET') return;

  // Для API запросов
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      handleApiRequest(request)
    );
    return;
  }

  // Для статических файлов
  event.respondWith(
    cacheFirstWithUpdate(request)
  );
});

// Стратегия для API: Network First
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Пытаемся получить свежие данные
    const networkResponse = await fetch(request);
    
    // Клонируем ответ для кэширования
    const responseClone = networkResponse.clone();
    
    // Обновляем кэш в фоне
    event.waitUntil(
      cache.put(request, responseClone)
    );
    
    return networkResponse;
  } catch (error) {
    // Если сеть недоступна - берем из кэша
    const cachedResponse = await cache.match(request);
    return cachedResponse || createErrorResponse();
  }
}

// Стратегия для статики: Cache First с фоновым обновлением
async function cacheFirstWithUpdate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Фоновое обновление кэша
  if (navigator.onLine) {
    const updatePromise = fetch(request)
      .then(networkResponse => {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      })
      .catch(() => null);
    
    event.waitUntil(updatePromise);
  }
  
  return cachedResponse || fetch(request);
}

function createErrorResponse() {
  return new Response(JSON.stringify({
    error: 'Офлайн-режим',
    timestamp: Date.now()
  }), {
    headers: {'Content-Type': 'application/json'}
  });
}

// Фоновая синхронизация (для Android)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Периодическая синхронизация (для iOS)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function syncData() {
  const cache = await caches.open(API_CACHE_NAME);
  const requests = await cache.keys();
  
  await Promise.all(requests.map(async request => {
    try {
      const response = await fetch(request.url);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      console.log('Ошибка синхронизации:', request.url, error);
    }
  }));
}

async function updateContent() {
  await syncData();
  // Уведомляем клиентов об обновлении
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'content-updated',
      timestamp: Date.now()
    });
  });
}
