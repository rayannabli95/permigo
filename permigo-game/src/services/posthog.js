// ═══════════════════════════════════════════════════════════════
// PostHog — init lazy, branché derrière le consentement RGPD.
// NE S'INITIALISE PAS sans consentement analytics (privacy by default).
//
// Appels publics :
//   initPosthog()          — appelé par main.js au boot + sur permigo:consent
//   phCapture(name, props) — forward depuis analytics.js track()
//   phPageview()           — appelé par router.js sur chaque hashchange
// ═══════════════════════════════════════════════════════════════
import posthog from 'posthog-js';
import { analyticsConsentGranted } from '@/components/common/cookie-banner.js';
import { getCurUser, onUserChange } from '@/auth/cur-user.js';

const PH_KEY = 'phc_AN2fCzu9yfMYjCyG9d7sNym3CSaRjY9fNjy6FDgBwgfy';

const PH_CONFIG = {
  api_host: 'https://eu.i.posthog.com',
  autocapture: true,
  capture_pageview: true,      // capture la vue initiale à l'init (page de consentement ou 1ère route)
  capture_pageleave: true,
  person_profiles: 'identified_only',  // aucun profil créé pour les visiteurs anonymes
  session_recording: { maskAllInputs: true },  // masque tous les champs saisis (RGPD mineurs)
};

let _initialized = false;

/**
 * Initialise PostHog uniquement si le consentement analytics est accordé.
 * Idempotente : peut être appelée plusieurs fois sans risque.
 */
export function initPosthog() {
  if (_initialized || !analyticsConsentGranted()) return;

  posthog.init(PH_KEY, PH_CONFIG);
  _initialized = true;

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
}

/**
 * Forward un event métier vers PostHog.
 * No-op si PostHog n'est pas initialisé (pas de consentement).
 */
export function phCapture(name, props) {
  if (_initialized) posthog.capture(name, props);
}

/**
 * Déclenche manuellement une vue de page.
 * Nécessaire car PostHog ne détecte pas les hash-router navigations seul.
 */
export function phPageview() {
  if (_initialized) posthog.capture('$pageview');
}
