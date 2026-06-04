// ═══════════════════════════════════════════════════════════════
// Vercel Web Analytics — trafic (visiteurs / pages vues).
// Cookieless, mais branché derrière le consentement RGPD comme PostHog
// (privacy by default). NE S'INJECTE PAS sans consentement analytics.
//
// Appels publics :
//   initVercelAnalytics() — appelé par main.js au boot + sur permigo:consent
// ═══════════════════════════════════════════════════════════════
import { inject } from '@vercel/analytics';
import { analyticsConsentGranted } from '@/components/common/cookie-banner.js';

let _initialized = false;

/**
 * Injecte le script Vercel Analytics si le consentement analytics est accordé.
 * Idempotente : peut être appelée plusieurs fois sans risque.
 * Mode 'auto' : Vercel détecte prod/dev automatiquement.
 */
export function initVercelAnalytics() {
  if (_initialized || !analyticsConsentGranted()) return;
  inject();
  _initialized = true;
}
