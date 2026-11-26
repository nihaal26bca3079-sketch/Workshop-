/**
 * Shakti Shield — Service Worker (service-worker.js)
 * Bump CACHE_VERSION whenever any HTML, CSS, JS, data/*.json, or data/lang/*.json file changes.
 */

const CACHE_VERSION = 'shakti-shield-v1.0.3';
const CACHE_NAME = CACHE_VERSION;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './css/responsive.css',
  './js/fallback-data.js',
  './js/language.js',
  './js/main.js',
  './js/sos.js',
  './js/journey.js',
  './js/checklist.js',
  './js/search.js',
  './js/quiz.js',
  './data/helplines.json',
  './data/rights.json',
  './data/scholarships.json',
  './data/lang/en.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './pages/emergency.html',
  './pages/toolkit.html',
  './pages/incident-guide.html',
  './pages/cyber.html',
  './pages/rights.html',
  './pages/defence.html',
  './pages/quiz.html',
  './pages/empowerment.html',
  './pages/contact.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('shakti-shield-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; do not depend on caching external Google Fonts offline
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first, fallback to cached page, then offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  // On-demand language JSON files (hi, bn, ta, kn, te): cache the first time selected
  if (/\/data\/lang\/(hi|bn|ta|kn|te)\.json$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Core static & data assets: cache-first, fallback to network + update cache
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
