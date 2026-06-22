/**
 * Service Worker — cache offline-first basique pour PermiGo.
 *
 * Stratégie :
 *  - Cache First pour assets statiques (logo, manifeste, etc.)
 *  - Network First pour HTML et appels API (Supabase)
 *  - Pas de tracking, juste pour permettre l'install PWA sur iOS / Android.
 */

const CACHE_NAME = 'permigo-v1';
// Scope auto-detect : ex '/permigo-v7/' sur GitHub Pages, '/' en local
const SCOPE = self.registration ? self.registration.scope : self.location.href.replace(/sw\.js.*$/, '');
const SCOPE_PATH = new URL(SCOPE).pathname;
const ASSETS = [
  SCOPE_PATH,
  SCOPE_PATH + 'index.html',
  SCOPE_PATH + 'permigo-logo.png',
  SCOPE_PATH + 'manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne touche pas aux requêtes Supabase / API
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) return;

  // Network first pour HTML (toujours la dernière version)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(SCOPE_PATH + 'index.html'))
    );
    return;
  }

  // Cache first pour assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
