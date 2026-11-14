const CACHE_NAME = 'portal-trabajo-cache-v2';
const OFFLINE_URLS = ['/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // SEC-061: Estrategia Network-First estricta para documentos HTML sin cachear '/'
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline');
      })
    );
  } else if (
    (event.request.destination === 'image' || event.request.destination === 'font') &&
    event.request.url.startsWith(self.location.origin)
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchRes) => {
            if (fetchRes.ok) {
              const copy = fetchRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return fetchRes;
          })
        );
      })
    );
  }
});
