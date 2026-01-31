const CACHE_NAME = 'bodha-survey-v4';

// Cache index on install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json'
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests except for CDNs we might use (like fonts)
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('fonts.googleapis.com')) {
        return;
    }

    // Define strategy: Network first, then fall back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If successful and valid, cache it
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // If network fails, try the cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;

                    // CRITICAL: For page navigation, always fall back to index.html 
                    // to let React Router handle the route offline
                    if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
                        return caches.match('/') || caches.match('/index.html');
                    }
                });
            })
    );
});
