// ═══════════════════════════════════════════════════════════════
// Pixel Meta (Facebook / Instagram) — mesure des campagnes publicitaires.
//
// Même contrat que posthog.js : RIEN ne part sans consentement « tout accepter »
// (privacy by default), et le script Meta n'est même pas téléchargé avant. Il
// se coupe tout seul si `VITE_META_PIXEL_ID` est absent — donc en local, en
// preview et tant que Rayan n'a pas créé le pixel, ce module est un no-op
// complet : zéro requête, zéro cookie.
//
// ⚠️ Contrairement à PostHog (mesure interne), c'est un traceur TIERS. Le
// bandeau cookies et la politique de confidentialité doivent le mentionner —
// c'est fait (cf. cookie-banner.js, texte « mesure publicitaire »).
//
// Appels publics :
//   initMetaPixel()        — main.js au boot + sur l'événement permigo:consent
//   fbPageview()           — router.js à chaque changement de route
//   fbTrack(name, params)  — événements standards Meta (Lead, Purchase…)
// ═══════════════════════════════════════════════════════════════
import { analyticsConsentGranted } from "@/components/common/cookie-banner.js";
import { env } from "@/config/env.js";

const PIXEL_ID = env.META_PIXEL_ID;
const SRC = "https://connect.facebook.net/en_US/fbevents.js";

let _initialized = false;
let _loading = false;

// Les événements émis entre le consentement et la fin du chargement du script
// sont rejoués à l'init au lieu d'être perdus (même idée que la file de
// posthog.js). Bornée : un visiteur qui clique vite ne doit pas gonfler la RAM.
const _queue = [];
const QUEUE_MAX = 30;

function fbqReady() {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

/**
 * Injecte le script Meta et initialise le pixel. Idempotente.
 * No-op sans consentement ou sans identifiant de pixel.
 */
export function initMetaPixel() {
  if (_initialized || _loading) return;
  if (!PIXEL_ID) return; // pixel non configuré → module inerte
  if (!analyticsConsentGranted()) return;
  if (typeof document === "undefined") return;

  _loading = true;

  // Stub officiel Meta : on peut appeler fbq() avant que le script soit arrivé,
  // les appels sont mis en file par la lib elle-même.
  if (!window.fbq) {
    const n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
  }

  const s = document.createElement("script");
  s.async = true;
  s.src = SRC;
  s.onerror = () => {
    // Bloqueur de pub, réseau coupé, extension vie privée : on abandonne
    // proprement. La mesure de vérité reste Supabase, jamais le pixel.
    _loading = false;
    console.warn("[meta-pixel] script bloqué ou indisponible");
  };
  document.head.appendChild(s);

  window.fbq("init", PIXEL_ID);
  _initialized = true;
  _loading = false;

  window.fbq("track", "PageView");
  while (_queue.length) {
    const [name, params] = _queue.shift();
    window.fbq("track", name, params);
  }
}

/**
 * Événement standard Meta (« Lead », « InitiateCheckout », « Purchase »…).
 * No-op sans consentement / sans pixel.
 * @param {string} name
 * @param {object} [params]
 */
export function fbTrack(name, params = {}) {
  if (!PIXEL_ID || !analyticsConsentGranted()) return;
  if (_initialized && fbqReady()) {
    window.fbq("track", name, params);
    return;
  }
  if (_queue.length < QUEUE_MAX) _queue.push([name, params]);
  initMetaPixel(); // le consentement vient peut-être d'être donné
}

/** Vue de page — le routeur est en hash, Meta ne les détecte pas seul. */
export function fbPageview() {
  if (!PIXEL_ID || !_initialized || !fbqReady()) return;
  window.fbq("track", "PageView");
}
