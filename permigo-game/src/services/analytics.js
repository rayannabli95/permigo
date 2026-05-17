// ═══════════════════════════════════════════════════════════════
// Analytics — wrapper unifié (Supabase events_analytics + PostHog futur)
// Voir .telemetry/tracking-plan.yaml pour le contrat
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';

const DEBUG = import.meta.env.DEV;
const queue = [];
let flushTimer = null;

/**
 * Track an event.
 * @param {string} name  - event name (snake_case object.action)
 * @param {object} props - event properties (no PII)
 */
export function track(name, props = {}) {
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
}

function schedule() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 2000);
}

async function flush() {
  flushTimer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  try {
    await sb.from('events_analytics').insert(batch);
  } catch (e) {
    if (DEBUG) console.warn('[track] flush failed', e);
    // Re-queue on failure (max 50 retries pour éviter boucle infinie)
    if (queue.length < 50) queue.unshift(...batch);
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
    await sb.from('profiles').update(traits).eq('id', me.id);
  } catch (e) {
    if (DEBUG) console.warn('[identify]', e);
  }
}
