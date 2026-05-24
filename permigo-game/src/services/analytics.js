// ═══════════════════════════════════════════════════════════════
// Analytics — wrapper unifié (Supabase events_analytics + PostHog futur)
// Voir .telemetry/tracking-plan.yaml pour le contrat
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { analyticsConsentGranted } from '@/components/common/cookie-banner.js';
import { phCapture } from '@/services/posthog.js';

const DEBUG = import.meta.env.DEV;
const queue = [];
let flushTimer = null;

/**
 * Track an event.
 * @param {string} name  - event name (snake_case object.action)
 * @param {object} props - event properties (no PII)
 */
export function track(name, props = {}) {
  // RGPD / ePrivacy : pas de mesure d'audience tant que le consentement
  // analytics n'est pas accordé (privacy by default).
  if (!analyticsConsentGranted()) {
    if (DEBUG) console.log('[track] skipped (no consent)', name);
    return;
  }

  const me = getCurUser();
  const evt = {
    user_id: me?.id || null,
    auto_ecole_id: me?.auto_ecole_id || null,
    role: me?.role || 'guest',
    event_name: name,
    properties: props,
    ts: new Date().toISOString(),
  };

  if (DEBUG) console.log('[track]', name, props);

  queue.push(evt);
  schedule();
  phCapture(name, props);  // mirror vers PostHog (events métier unifiés)
}

function schedule() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 2000);
}

async function flush() {
  flushTimer = null;
  if (!queue.length) return;

  // Re-synchroniser user_id avec la session courante.
  // Si l'utilisateur s'est déconnecté entre track() et flush(),
  // get_my_id() retourne null côté RLS et un user_id non-null casse la policy.
  const me = getCurUser();
  const batch = queue.splice(0, queue.length).map(evt => ({
    ...evt,
    user_id: me?.id || null,
    auto_ecole_id: me?.auto_ecole_id || null,
    role: me?.role || 'guest',
  }));

  const { error } = await sb.from('events_analytics').insert(batch);

  if (error) {
    if (DEBUG) console.warn('[track] flush failed', error.message);
    // RLS 42501 → on drop (event obsolète, replay aurait le même résultat)
    // Réseau / 5xx → on retente (cap 50 pour éviter la boucle infinie)
    const isRls = error.code === '42501';
    if (!isRls && queue.length < 50) queue.unshift(...batch);
  }
}

// Flush avant unload
window.addEventListener('beforeunload', () => {
  if (queue.length && navigator.sendBeacon) {
    // best-effort; Supabase REST n'est pas idéal pour beacon, mais on tente
    flush();
  }
});

/**
 * Identify call — set user traits.
 */
export async function identify(traits = {}) {
  const me = getCurUser();
  if (!me) return;
  try {
    const { error } = await sb.from('profiles').update(traits).eq('id', me.id);
    if (error && DEBUG) console.warn('[identify] RLS or DB error:', error.message);
  } catch (e) {
    if (DEBUG) console.warn('[identify] network error:', e);
  }
}
