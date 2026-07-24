// ═══════════════════════════════════════════════════════════════
// Vercel Web Analytics — trafic (visiteurs / pages vues).
// Cookieless, mais branché derrière le consentement RGPD comme PostHog
// (privacy by default). NE S'INJECTE PAS sans consentement analytics.
//
// Appels publics :
//   initVercelAnalytics() — appelé par main.js au boot + sur permigo:consent
// ═══════════════════════════════════════════════════════════════
import { analyticsConsentGranted } from '@/components/common/cookie-banner.js';

let _initialized = false;
let _loading = false;

/**
 * Injecte le script Vercel Analytics si le consentement analytics est accordé.
 * Idempotente : peut être appelée plusieurs fois sans risque.
 * Mode 'auto' : Vercel détecte prod/dev automatiquement.
 */
export async function initVercelAnalytics() {
  if (_initialized || _loading || !analyticsConsentGranted()) return;
  _loading = true;
  try {
    const { inject } = await import("@vercel/analytics");
    inject();
    _initialized = true;
  } catch {
    // Réseau indisponible pendant l'import : un prochain appel pourra retenter.
  } finally {
    _loading = false;
  }
}
