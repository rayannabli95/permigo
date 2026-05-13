/**
 * Cloudflare Turnstile — captcha invisible/managed.
 *
 * Préreq :
 *  1. Compte Cloudflare → Turnstile → "Add Site"
 *  2. Domaine : ajoute ton domaine (rayannabli95.github.io OU permigo.fr) + localhost
 *  3. Widget mode : "Managed" (recommandé — invisible la plupart du temps)
 *  4. Copie la SITE KEY → mets-la dans .env : VITE_TURNSTILE_SITEKEY=0x4AAA...
 *  5. Copie la SECRET KEY → Supabase → Auth → Settings → Bot Protection → enable Turnstile → coller secret
 *
 * Usage :
 *   import { getTurnstileToken, isTurnstileEnabled } from '@/utils/turnstile.js';
 *   const token = await getTurnstileToken('login');
 *   await sb.auth.signInWithPassword({ email, password, options: { captchaToken: token } });
 */

import { env } from '@/config/env.js';

// Sitekey publique — peut être commit (la secret key reste côté Supabase)
export const TURNSTILE_SITEKEY = env.TURNSTILE_SITEKEY || '';

let scriptPromise = null;

export function isTurnstileEnabled() {
  return Boolean(TURNSTILE_SITEKEY);
}

function loadScript() {
  if (scriptPromise) return scriptPromise;
  if (typeof window === 'undefined') return Promise.resolve();

  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const cbName = '__turnstileReady_' + Math.random().toString(36).slice(2, 8);
    window[cbName] = () => { resolve(); delete window[cbName]; };
    const s = document.createElement('script');
    s.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${cbName}&render=explicit`;
    s.async = true;
    s.defer = true;
    s.onerror = () => { reject(new Error('Turnstile script failed to load')); delete window[cbName]; };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Récupère un token Turnstile. Renvoie null si désactivé ou erreur.
 * Utilise un container caché en bas à droite (mode "managed").
 * @param {string} action - tag pour analytics (ex: 'login', 'signup')
 * @returns {Promise<string|null>}
 */
export async function getTurnstileToken(action = 'submit') {
  if (!isTurnstileEnabled()) return null;
  try {
    await loadScript();
  } catch (e) {
    console.warn('[turnstile] script load failed', e);
    return null;
  }
  return new Promise((resolve) => {
    const host = document.createElement('div');
    host.id = 'ts-host-' + Date.now();
    host.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:9998;transform:scale(.85);transform-origin:bottom right;opacity:.9';
    document.body.appendChild(host);

    let resolved = false;
    const finish = (token) => {
      if (resolved) return;
      resolved = true;
      setTimeout(() => host.remove(), 300);
      resolve(token);
    };

    try {
      window.turnstile.render('#' + host.id, {
        sitekey: TURNSTILE_SITEKEY,
        action,
        appearance: 'interaction-only', // visible UNIQUEMENT si CF demande interaction
        callback: (token) => finish(token),
        'error-callback': () => finish(null),
        'timeout-callback': () => finish(null),
        'expired-callback': () => finish(null),
      });
    } catch (e) {
      console.warn('[turnstile] render failed', e);
      finish(null);
    }

    // Safety timeout 12s — si CF ne répond pas, on continue sans
    setTimeout(() => finish(null), 12000);
  });
}
