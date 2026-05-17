// ═══════════════════════════════════════════════════════════════
// Web Push — permission + push streak-risk à 20h
// Soft opt-in : ne demande jamais au 1er login (préférence stockée)
// Désactivable depuis profil
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { track } from '@/services/analytics.js';

const PUSH_ASKED_KEY  = 'permigo_push_asked';
const PUSH_OPTED_OUT  = 'permigo_push_optout';

// ─── Public API ──────────────────────────────────────────────────

/**
 * Appelé depuis accueil.js après quelques secondes (pas au 1er login).
 * Si déjà demandé ou refusé → no-op.
 */
export function maybeSoftRequestPush() {
  if (!('Notification' in window)) return;
  if (localStorage.getItem(PUSH_ASKED_KEY)) return;
  if (localStorage.getItem(PUSH_OPTED_OUT)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission === 'denied') return;

  // Délai 5s après l'ouverture accueil — pas intrusif
  setTimeout(() => {
    const banner = _createSoftBanner();
    document.body.appendChild(banner);
  }, 5000);
}

/**
 * Demande la permission Notification au browser.
 * Appelé depuis profil.js ou le banner soft.
 */
export async function requestPushPermission() {
  if (!('Notification' in window)) return false;

  localStorage.setItem(PUSH_ASKED_KEY, '1');
  const result = await Notification.requestPermission();
  track('push.permission_result', { result });

  if (result === 'granted') {
    _subscribeServiceWorker();
    return true;
  }
  return false;
}

/** Opt-out depuis profil */
export function optOutPush() {
  localStorage.setItem(PUSH_OPTED_OUT, '1');
  track('push.opted_out', {});
}

/** Vérifie si push est actif */
export function isPushEnabled() {
  return 'Notification' in window && Notification.permission === 'granted' &&
    !localStorage.getItem(PUSH_OPTED_OUT);
}

// ─── Internals ───────────────────────────────────────────────────

function _createSoftBanner() {
  const el = document.createElement('div');
  el.id = 'push-soft-banner';
  el.innerHTML = `
    <style>
      #push-soft-banner {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        z-index: 8000; width: calc(100% - 32px); max-width: 420px;
        background: linear-gradient(135deg, #1a1d2e, #0f1220);
        border: 1px solid rgba(99,102,241,.3); border-radius: 18px;
        padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;
        box-shadow: 0 16px 48px rgba(0,0,0,.6);
        animation: slideUpBanner .4s cubic-bezier(.2,.7,.3,1) both;
      }
      @keyframes slideUpBanner {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      #push-soft-banner .pb-ttl {
        font: 700 15px/1.3 'Plus Jakarta Sans', sans-serif; color: #fff;
      }
      #push-soft-banner .pb-sub {
        font: 500 13px/1.4 'Inter', sans-serif; color: #94a3b8; margin: 0;
      }
      #push-soft-banner .pb-btns { display: flex; gap: 10px; }
      #push-soft-banner .pb-ok {
        flex: 1; padding: 12px; background: linear-gradient(135deg,#6366f1,#8b5cf6);
        border: 0; border-radius: 12px; color: #fff;
        font: 700 13px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
      }
      #push-soft-banner .pb-skip {
        padding: 12px 16px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
        border-radius: 12px; color: #94a3b8; font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
      }
    </style>
    <div class="pb-ttl">🛣️ Reste dans ton parcours</div>
    <p class="pb-sub">Activer les notifications pour ne jamais rater ton moment d'apprentissage du jour.</p>
    <div class="pb-btns">
      <button class="pb-ok" id="pb-allow">Activer</button>
      <button class="pb-skip" id="pb-skip">Pas maintenant</button>
    </div>
  `;

  el.querySelector('#pb-allow').addEventListener('click', async () => {
    el.remove();
    try {
      await requestPushPermission();
    } catch (e) {
      console.warn('[web-push] requestPushPermission failed', e);
    }
  });

  el.querySelector('#pb-skip').addEventListener('click', () => {
    el.remove();
    localStorage.setItem(PUSH_ASKED_KEY, '1');
    track('push.banner_skipped', {});
  });

  return el;
}

async function _subscribeServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    // VAPID public key needed for real push — stored as env var VITE_VAPID_PUBLIC_KEY
    // For now, just log that SW is ready for push
    console.log('[web-push] SW ready, push subscription requires VAPID key setup');
    track('push.sw_ready', {});
  } catch (e) {
    console.warn('[web-push] SW subscription failed:', e);
  }
}

/**
 * À appeler depuis un cron client-side (accueil.js, requestAnimationFrame loop)
 * pour envoyer un rappel si le streak est à risque (dernier quiz > 20h).
 * Utilise Notification API locale (pas de VAPID — step 1 sans serveur).
 */
export async function maybeSendStreakRiskNotif() {
  if (!isPushEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const me = getCurUser();
  if (!me || me.role !== 'eleve') return;

  const now = new Date();
  const hour = now.getHours();
  // Fenêtre : entre 20h et 21h
  if (hour < 20 || hour >= 21) return;

  const lastSentKey = `permigo_push_last_${now.toDateString()}`;
  if (localStorage.getItem(lastSentKey)) return;

  // Vérifie si l'élève a été actif aujourd'hui
  const today = now.toISOString().split('T')[0];
  const { data: todayEvents } = await sb
    .from('events_analytics')
    .select('id')
    .eq('user_id', me.id)
    .gte('created_at', today)
    .limit(1);

  if (todayEvents?.length) return; // Déjà actif

  // Pas actif aujourd'hui → notif locale
  localStorage.setItem(lastSentKey, '1');
  track('push.streak_risk_sent', {});

  new Notification('PermiGo 🛣️', {
    body: `${me.nom || 'Ton parcours'} t'attend — 2 min suffisent !`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'streak-risk',
  });
}
