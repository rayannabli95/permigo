// ═══════════════════════════════════════════════════════════════
// PostHog — init lazy, branché derrière le consentement RGPD.
// NE S'INITIALISE PAS sans consentement analytics (privacy by default).
//
// La lib posthog-js (~190 kB min) est chargée en import DYNAMIQUE dans
// initPosthog() : elle ne pèse plus dans le chunk d'entrée et n'est jamais
// téléchargée tant que le consentement n'est pas donné.
//
// Appels publics :
//   initPosthog()          — appelé par main.js au boot + sur permigo:consent
//   phCapture(name, props) — forward depuis analytics.js track()
//   phPageview()           — appelé par router.js sur chaque hashchange
// ═══════════════════════════════════════════════════════════════
import { analyticsConsentGranted } from "@/components/common/cookie-banner.js";
import { getCurUser, onUserChange } from "@/auth/cur-user.js";

const PH_KEY = "phc_AN2fCzu9yfMYjCyG9d7sNym3CSaRjY9fNjy6FDgBwgfy";

const PH_CONFIG = {
  api_host: "https://eu.i.posthog.com",
  autocapture: true,
  capture_pageview: true, // capture la vue initiale à l'init (page de consentement ou 1ère route)
  capture_pageleave: true,
  person_profiles: "identified_only", // aucun profil créé pour les visiteurs anonymes
  session_recording: { maskAllInputs: true }, // masque tous les champs saisis (RGPD mineurs)
};

let _ph = null; // instance PostHog une fois la lib chargée + init faite
let _loading = false; // import de la lib en cours (consentement déjà accordé)

// File d'attente le temps du chargement de la lib (même idée que la queue de
// analytics.js) : les phCapture() entre le consentement et la fin de l'import
// dynamique sont rejoués à l'init au lieu d'être perdus. Bornée par prudence.
const _preInitQueue = [];
const PRE_INIT_QUEUE_MAX = 50;

/**
 * Initialise PostHog uniquement si le consentement analytics est accordé.
 * Idempotente : peut être appelée plusieurs fois sans risque.
 * Async (import dynamique) — les appelants n'ont pas besoin d'attendre.
 */
export async function initPosthog() {
  if (_ph || _loading || !analyticsConsentGranted()) return;
  _loading = true;

  let posthog;
  try {
    ({ default: posthog } = await import("posthog-js"));
  } catch {
    // Réseau HS pendant l'import → on retentera au prochain appel.
    _loading = false;
    return;
  }

  posthog.init(PH_KEY, PH_CONFIG);
  _ph = posthog;

  // Identifie l'user déjà connecté au moment où le consentement est donné.
  const me = getCurUser();
  if (me) {
    posthog.identify(me.id, {
      role: me.role,
      auto_ecole_id: me.auto_ecole_id ?? null,
      // Jamais : email, nom, prénom, NEPH, téléphone — PII interdit.
    });
  }

  // Réagit aux futurs login / logout sans avoir à re-init.
  onUserChange((user) => {
    if (!user) {
      posthog.reset();
    } else {
      posthog.identify(user.id, {
        role: user.role,
        auto_ecole_id: user.auto_ecole_id ?? null,
      });
    }
  });

  // Rejoue les events capturés pendant le chargement de la lib.
  _preInitQueue.splice(0).forEach(([name, props]) => _ph.capture(name, props));
}

/**
 * Forward un event métier vers PostHog.
 * No-op si PostHog n'est pas initialisé (pas de consentement) ; mis en file
 * si la lib est en cours de chargement (consentement donné, import en vol).
 */
export function phCapture(name, props) {
  if (_ph) {
    _ph.capture(name, props);
  } else if (_loading && _preInitQueue.length < PRE_INIT_QUEUE_MAX) {
    _preInitQueue.push([name, props]);
  }
}

/**
 * Déclenche manuellement une vue de page.
 * Nécessaire car PostHog ne détecte pas les hash-router navigations seul.
 */
export function phPageview() {
  phCapture("$pageview");
}
