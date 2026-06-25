/**
 * Service Worker — cache offline-first basique pour PermiGo.
 *
 * Stratégie :
 *  - Cache First pour assets statiques (logo, manifeste, etc.)
 *  - Network First pour HTML et appels API (Supabase)
 *  - Pas de tracking, juste pour permettre l'install PWA sur iOS / Android.
 */

const CACHE_NAME = "permigo-v5";
// Scope auto-detect : ex '/permigo-v7/' sur GitHub Pages, '/' en local
const SCOPE = self.registration
  ? self.registration.scope
  : self.location.href.replace(/sw\.js.*$/, "");
const SCOPE_PATH = new URL(SCOPE).pathname;
const ASSETS = [
  SCOPE_PATH,
  SCOPE_PATH + "index.html",
  SCOPE_PATH + "permigo-logo.png",
  SCOPE_PATH + "manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ─── Push Notifications ──────────────────────────────────────────
// Payload JSON attendu depuis la edge function dispatch_push :
// { type, title, body, icon?, badge?, data: { route?, competence_id? } }

const NOTIF_DEFAULTS = {
  // /icons/* n'existe pas (le rewrite Vercel renvoyait le HTML du SPA → notif
  // sans icône). On pointe les vrais assets de public/ (utilisés par le manifest).
  icon: "/icon-192.png",
  badge: "/icon-192.png", // pas de badge monochrome dédié → fallback sur l'icône
  requireInteraction: false,
};

const NOTIF_COPY = {
  post_validation_quiz: {
    title: "🎉 Compétence validée !",
    body: "Ton moniteur a validé une compétence. Lance le quiz de 3 questions maintenant !",
  },
  consolidation_quiz: {
    title: "🔄 Consolide tes acquis",
    body: "Il est temps de revoir une compétence. 2 questions, 2 minutes.",
  },
  streak_risk: {
    title: "🔥 Ta série t'attend",
    body: "Ne laisse pas ta flamme s'éteindre. Une petite session suffit !",
  },
};

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { type: "generic", body: event.data?.text() ?? "" };
  }

  const defaults = NOTIF_COPY[payload.type] ?? {
    title: "PermiGo",
    body: payload.body || "",
  };
  const title = payload.title ?? defaults.title;
  const options = {
    ...NOTIF_DEFAULTS,
    body: payload.body ?? defaults.body,
    icon: payload.icon ?? NOTIF_DEFAULTS.icon,
    badge: payload.badge ?? NOTIF_DEFAULTS.badge,
    // tag stable par TYPE (daily/comeback se remplacent) mais distinct par
    // route pour les pushs événementiels (sinon validation/consolidation/série
    // partageaient "permigo" et s'écrasaient l'un l'autre).
    tag:
      payload.type ??
      (payload.data?.route ? `pg:${payload.data.route}` : `pg:${Date.now()}`),
    data: payload.data ?? {},
    // Vibration douce : 200ms on, 100ms off, 100ms on
    vibrate: [200, 100, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const route = event.notification.data?.route ?? "";
  const targetUrl =
    self.registration.scope + (route ? `#${route.replace(/^#/, "")}` : "");

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Cherche une fenêtre déjà ouverte et navigue dedans
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(targetUrl);
            return;
          }
        }
        // Aucune fenêtre ouverte → on ouvre l'app
        return self.clients.openWindow(targetUrl);
      }),
  );
});

// Re-subscribe automatiquement si la subscription expire
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((sub) => {
        // Le frontend se chargera de re-synchroniser la nouvelle sub avec Supabase
        // via un BroadcastChannel au prochain boot de l'app
        const bc = new BroadcastChannel("permigo-push");
        bc.postMessage({
          type: "subscription_renewed",
          subscription: sub.toJSON(),
        });
        bc.close();
      }),
  );
});

// ─── Fetch (cache + network) ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne touche pas aux requêtes Supabase / API
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.in")
  )
    return;

  // Network first pour HTML (toujours la dernière version)
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(SCOPE_PATH + "index.html")),
    );
    return;
  }

  // Cache first pour assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const clone = resp.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
    }),
  );
});
