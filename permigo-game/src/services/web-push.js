// ═══════════════════════════════════════════════════════════════
// Web Push — permission + subscription VAPID + streak-risk local
//
// Soft opt-in rules :
//  - Ne demande JAMAIS au 1er login (first_value_action_at = NULL)
//  - Ne demande que si l'élève a ≥1 compétence validée (permigo_has_validated)
//  - Ne re-demande pas si déjà demandé ou refusé (permigo_push_asked)
//  - Désactivable depuis profil (permigo_push_optout)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { track } from '@/services/analytics.js';

const PUSH_ASKED_KEY = 'permigo_push_asked';
const PUSH_OPTED_OUT = 'permigo_push_optout';
const HAS_VALIDATED  = 'permigo_has_validated';

// ─── Flag : set par notif-listener après 1ère post_validation_quiz ──────────

/** Appelé par notif-listener.js quand un post_validation_quiz est traité. */
export function markHasValidated() {
  localStorage.setItem(HAS_VALIDATED, '1');
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Appelé depuis accueil.js après le chargement, si first_value_action_at est set.
 * Montre le banner soft seulement si l'élève a ≥1 validation (sinon no-op).
 */
export function maybeSoftRequestPush() {
  if (!('Notification' in window)) return;
  if (!localStorage.getItem(HAS_VALIDATED)) return; // pas encore validé
  if (localStorage.getItem(PUSH_ASKED_KEY)) return;
  if (localStorage.getItem(PUSH_OPTED_OUT)) return;
  if (Notification.permission === 'granted') {
    // Déjà accordé → juste s'assurer que la sub existe
    _ensureSubscription();
    return;
  }
  if (Notification.permission === 'denied') return;

  // Délai 5s — pas intrusif
  setTimeout(() => {
    const banner = _createSoftBanner();
    document.body.appendChild(banner);
  }, 5_000);
}

/**
 * Demande la permission Notification au browser.
 * Appelé depuis profil.js (toggle) ou le banner soft.
 */
export async function requestPushPermission() {
  if (!('Notification' in window)) return false;

  localStorage.setItem(PUSH_ASKED_KEY, '1');
  const result = await Notification.requestPermission();
  track('push.permission_result', { result });

  if (result === 'granted') {
    await _ensureSubscription();
    return true;
  }
  return false;
}

/** Opt-out depuis profil. Désabonne la subscription si possible. */
export async function optOutPush() {
  localStorage.setItem(PUSH_OPTED_OUT, '1');
  track('push.opted_out', {});
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch { /* silent */ }
}

/** Réactive depuis profil (retire l'opt-out et re-demande). */
export async function optInPush() {
  localStorage.removeItem(PUSH_OPTED_OUT);
  track('push.opted_in', {});
  return requestPushPermission();
}

/** Vérifie si push est actif du point de vue utilisateur. */
export function isPushEnabled() {
  return 'Notification' in window
    && Notification.permission === 'granted'
    && !localStorage.getItem(PUSH_OPTED_OUT);
}

/**
 * Appelé depuis accueil.js — notif locale (pas VAPID) si l'élève
 * n'a pas été actif depuis ≥ 15h et que la fenêtre 20h–21h est atteinte.
 */
export async function maybeSendStreakRiskNotif() {
  if (!isPushEnabled()) return;
  const me = getCurUser();
  if (!me || me.role !== 'eleve') return;

  const now  = new Date();
  const hour = now.getHours();
  if (hour < 20 || hour >= 21) return;

  const lastSentKey = `permigo_push_last_${now.toDateString()}`;
  if (localStorage.getItem(lastSentKey)) return;

  const today = now.toISOString().split('T')[0];
  const { data: todayEvents } = await sb
    .from('events_analytics')
    .select('id')
    .eq('user_id', me.id)
    .gte('created_at', today)
    .limit(1);

  if (todayEvents?.length) return;

  localStorage.setItem(lastSentKey, '1');
  track('push.streak_risk_sent', {});

  new Notification('PermiGo 🛣️', {
    body:  `Ton parcours t'attend — 2 min suffisent !`,
    icon:  '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag:   'streak-risk',
  });
}

// ─── Internals ───────────────────────────────────────────────────

/**
 * Crée (ou retrouve) la PushSubscription VAPID et l'envoie à Supabase.
 * Nécessite VITE_VAPID_PUBLIC_KEY en .env + table push_subscriptions.
 * TODO(Cowork): cf. .telemetry/push-spec.md pour le schéma attendu.
 */
async function _ensureSubscription() {
  if (!('serviceWorker' in navigator)) return;
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn('[web-push] VITE_VAPID_PUBLIC_KEY manquante — subscription désactivée');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(vapidKey),
      });
      track('push.subscribed', {});
    }

    await _saveSub(sub);

    // Écoute BroadcastChannel pour les re-subscriptions depuis le SW
    const bc = new BroadcastChannel('permigo-push');
    bc.onmessage = async (e) => {
      if (e.data?.type === 'subscription_renewed') {
        const newSub = await reg.pushManager.getSubscription();
        if (newSub) await _saveSub(newSub);
      }
    };
  } catch (e) {
    console.warn('[web-push] subscription failed:', e);
  }
}

async function _saveSub(sub) {
  const me = getCurUser();
  if (!me) return;
  const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))));
  const auth   = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))));
  // TODO(Cowork): table push_subscriptions doit exister — cf. .telemetry/push-spec.md
  const { error } = await sb.from('push_subscriptions').upsert({
    user_id:    me.id,
    endpoint:   sub.endpoint,
    p256dh,
    auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) console.warn('[web-push] push_subscriptions upsert failed:', error.message);
  else track('push.subscription_saved', {});
}

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function _createSoftBanner() {
  const el = document.createElement('div');
  el.id = 'push-soft-banner';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Activer les notifications PermiGo');
  el.innerHTML = `
    <style>
      #push-soft-banner {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        z-index: 8000; width: calc(100% - 32px); max-width: 420px;
        background: linear-gradient(135deg, #1a1d2e, #0f1220);
        border: 1px solid rgba(99,102,241,.3); border-radius: 18px;
        padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;
        box-shadow: 0 16px 48px rgba(0,0,0,.6);
        animation: psb-in .4s cubic-bezier(.23,1,.32,1) both;
      }
      @keyframes psb-in {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      #push-soft-banner .pb-ttl { font: 700 15px/1.3 'Plus Jakarta Sans', sans-serif; color: #fff; }
      #push-soft-banner .pb-sub { font: 500 13px/1.4 'Inter', sans-serif; color: #94a3b8; margin: 0; }
      #push-soft-banner .pb-btns { display: flex; gap: 10px; }
      #push-soft-banner .pb-ok {
        flex: 1; padding: 12px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: 0; border-radius: 12px; color: #fff;
        font: 700 13px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
        transition: transform .12s, opacity .12s; min-height: 44px;
      }
      #push-soft-banner .pb-ok:active { transform: scale(.97); opacity: .9; }
      #push-soft-banner .pb-skip {
        padding: 12px 16px; background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
        color: #94a3b8; font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
        transition: background .15s; min-height: 44px;
      }
      #push-soft-banner .pb-skip:active { background: rgba(255,255,255,.1); }
    </style>
    <div class="pb-ttl">🛣️ Reste dans ton parcours</div>
    <p class="pb-sub">Active les notifications pour ne jamais rater un quiz ou une compétence validée.</p>
    <div class="pb-btns">
      <button class="pb-ok"   id="pb-allow">Activer</button>
      <button class="pb-skip" id="pb-skip">Pas maintenant</button>
    </div>
  `;

  el.querySelector('#pb-allow').addEventListener('click', async () => {
    el.remove();
    await requestPushPermission();
  });
  el.querySelector('#pb-skip').addEventListener('click', () => {
    el.remove();
    localStorage.setItem(PUSH_ASKED_KEY, '1');
    track('push.banner_skipped', {});
  });

  return el;
}
