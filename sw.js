importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyCGseAeqdXPeasq16eG7XrDYwpiDPz790c",
    authDomain: "otz2025-57eec.firebaseapp.com",
    projectId: "otz2025-57eec",
    storageBucket: "otz2025-57eec.firebasestorage.app",
    messagingSenderId: "742102106188",
    appId: "1:742102106188:web:22864fd63b92dd3ceb74e9",
    measurementId: "G-R5M9V208PY"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'otz-cache-v4';
const API_CACHE = 'otz-api-v1';
const ASSETS = [
    '/otz2025/',
    '/otz2025/index.html',
    '/otz2025/styles.css',
    '/otz2025/app.js',
    '/otz2025/bot.js',
    '/otz2025/manifest.json',
    '/otz2025/img/icon-192x192.png',
    '/otz2025/img/icon-512x512.png',
    '/otz2025/img/OTZ.png',
    '/otz2025/img/OTZ3.png',
    '/otz2025/img/PPATROL.png',
    '/otz2025/img/RWE.png',
    '/otz2025/img/BULLDOGS.png',
    '/otz2025/img/KITTY BOYS.png',
    '/otz2025/img/NEWS_NO.png',
    '/otz2025/img/TG.png'
];

// Установка и кэширование
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование основных ресурсов');
                return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))
            .catch(err => console.error('[SW] Ошибка кэширования:', err))
        })
    );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(cacheNames.map(cacheName => 
                [CACHE_NAME, API_CACHE].includes(cacheName) ? null : caches.delete(cacheName)
            ))
        )
    );
});

// Стратегия кэширования
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Пропускаем не-GET запросы
    if (event.request.method !== 'GET') return;

    // Для API - Network First
    if (url.pathname.includes('/api/')) {
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

    // Для статических файлов - Cache First
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request))
    );
});

// Обработка фоновых уведомлений FCM
messaging.onBackgroundMessage(payload => {
    const notificationTitle = payload.notification.title || 'OTZ Notification';
    const notificationOptions = {
        body: payload.notification.body || 'Новое сообщение',
        icon: '/otz2025/img/icon-192x192.png',
        badge: '/otz2025/img/icon-192x192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://otz2026.github.io/otz2025/')
    );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncPendingData());
    }
});

async function syncPendingData() {
    const cache = await caches.open(API_CACHE);
    const pendingResponse = await cache.match('/otz2025/pending');
    if (pendingResponse) {
        const pendingData = await pendingResponse.json();
        try {
            console.log('Синхронизация данных:', pendingData);
            await cache.delete('/otz2025/pending');
        } catch (err) {
            console.error('Ошибка синхронизации:', err);
        }
    }
}
