const CACHE_NAME = 'may-cross-hub-v9';
const CORE_ASSETS = [
  './', './index.html', './signin.html', './register.html', './privacy.html',
  './terms.html', './guidelines.html', './site-core.css', './site-core.js',
  './legal.css', './favicon.svg', './site.webmanifest', './404.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request)
    .then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    })
    .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./404.html'))));
});
