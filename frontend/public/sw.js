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
    const url = new URL(event.request.url);

    // DISABLE SERVICE WORKER ON LOCALHOST / DEV
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return;
    }

    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // CRITICAL: Skip internal Vite/HMR requests and WebSockets
    if (
        url.search.includes('v=') ||
        url.search.includes('t=') ||
        url.pathname.includes('@vite') ||
        url.pathname.includes('node_modules') ||
        event.request.headers.get('Upgrade') === 'websocket'
    ) {
        return;
    }

    // Skip cross-origin requests except for CDNs we might use (like fonts)
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('fonts.googleapis.com')) {
        return;
    }

    // Define strategy: Network first (with cache update), then fall back to cache
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
            .catch(async (error) => {
                // If network fails, try the cache
                try {
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) return cachedResponse;

                    // For page navigation, fall back to index.html (SPA logic)
                    if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
                        const indexHtml = await caches.match('/') || await caches.match('/index.html');
                        if (indexHtml) return indexHtml;
                    }
                } catch (e) {
                    console.error('Cache match failed:', e);
                }

                // If everything fails, re-throw or return a network error
                throw error;
            })
    );
});
