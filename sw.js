importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

try {
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

    messaging.onBackgroundMessage(function(payload) {
        console.log('[SW] Received background notification:', payload);
        const notificationTitle = payload.notification?.title || 'OTZ Notification';
        const notificationOptions = {
            body: payload.notification?.body || 'New message',
            icon: '/otz2025/img/icon-192x192.png',
            badge: '/otz2025/img/icon-192x192.png',
            data: { url: 'https://otz2026.github.io/otz2025/' }
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (error) {
    console.error('[SW] Error initializing Firebase:', error);
}

const CACHE_NAME = 'otz-cache-v14';
const API_CACHE = 'otz-api-v10';
const ASSETS = [
    '/otz2025/',
    '/otz2025/index.html',
    '/otz2025/bot.js',
    '/otz2025/manifest.json',
    '/otz2025/img/icon-192x192.png',
    '/otz2025/img/icon-512x512.png',
    '/otz2025/img/OTZ.png',
    '/otz2025/img/OTZ3.png',
    '/otz2025/img/PPATROL.png',
    '/otz2025/img/RWE.png',
    '/otz2025/img/NEWS_NO.png',
    '/otz2025/img/TG.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching assets');
                return Promise.all(
                    ASSETS.map(url => 
                        fetch(url, { cache: 'reload' })
                            .then(response => {
                                if (!response.ok) {
                                    console.warn(`[SW] Failed to cache ${url}: ${response.status}`);
                                    return null;
                                }
                                console.log(`[SW] Cached ${url}`);
                                return cache.put(url, response);
                            })
                            .catch(err => {
                                console.warn(`[SW] Error caching ${url}:`, err);
                                return null;
                            })
                    )
                );
            })
            .catch(err => console.error('[SW] Cache error:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(cacheNames.map(cacheName => 
                [CACHE_NAME, API_CACHE].includes(cacheName) ? null : caches.delete(cacheName)
            ))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (event.request.method !== 'GET') return;

    if (url.pathname.includes('/api/') || url.hostname.includes('raw.githubusercontent.com')) {
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

    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request))
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
            const url = event.notification.data?.url || 'https://otz2026.github.io/otz2025/';
            for (const client of clientsArr) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncPendingData());
    }
});

async function syncPendingData() {
    try {
        const cache = await caches.open(API_CACHE);
        const pendingResponse = await cache.match('/otz2025/pending');
        if (pendingResponse) {
            const pendingData = await pendingResponse.json();
            console.log('[SW] Syncing data:', pendingData);
            await cache.delete('/otz2025/pending');
        }
    } catch (err) {
        console.error('[SW] Sync error:', err);
    }
}
