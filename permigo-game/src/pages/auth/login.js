/**
 * Page Login — design v2 (inputs avec icônes, social OAuth, remember me).
 *
 * Stack sécurité actif :
 *  - Honeypot (champs invisibles website_url/fax_number)
 *  - Rate limit client (5 login/5min, 3 OTP/5min)
 *  - Cloudflare Turnstile captcha (si VITE_TURNSTILE_SITEKEY défini)
 *  - Magic link / OTP par email (bouton "Code par email")
 *  - OAuth Google / Apple (si activé dans Supabase)
 *  - PKCE flow Supabase
 */

import { sb, login, loginWithOtp, verifyOtp } from '@/auth/auth.js';
import { toast } from '@/components/common/toast.js';
import { esc } from '@/utils/escape.js';
import { getCurUser } from '@/auth/cur-user.js';

// Traductions FR des messages d'erreur Supabase Auth (en anglais côté API)
const AUTH_ERRORS_FR = {
  'Invalid login credentials':              'Identifiants invalides.',
  'Email not confirmed':                    'Email non confirmé — vérifie ta boîte mail.',
  'User not found':                         'Aucun compte trouvé pour cet email.',
  'Invalid OTP':                            'Code invalide ou expiré.',
  'Token has expired or is invalid':        'Le lien a expiré. Demande un nouveau code.',
  'Signup requires a valid password':       'Mot de passe requis.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'User already registered':                'Un compte existe déjà pour cet email.',
  'Email rate limit exceeded':              'Trop de tentatives — réessaie dans quelques minutes.',
  'over_email_send_rate_limit':             'Trop de codes envoyés — réessaie dans 60 secondes.',
  'For security purposes, you can only request this once every 60 seconds': 'Attends 60 secondes avant de renvoyer un code.',
};
function translateAuthError(msg) {
  if (!msg) return null;
  for (const [en, fr] of Object.entries(AUTH_ERRORS_FR)) {
    if (msg.includes(en)) return fr;
  }
  return msg; // fallback : message brut Supabase
}
import { checkRateLimit, recordAttempt, resetRateLimit, formatWaitTime } from '@/utils/rate-limit.js';
import { playLaunch } from '@/utils/sound.js';
import { getTurnstileToken, isTurnstileEnabled } from '@/utils/turnstile.js';
import { renderHoneypot, checkHoneypot } from '@/utils/honeypot.js';

const _isNight = (() => { const h = new Date().getHours(); return h >= 20 || h < 7; })();
const _landingBg = `/skins/landing/monde4${_isNight ? 'nuit' : 'jour'}.webp`;

const DEMO_ACCOUNTS = [
  { role: 'Élève',      email: 'eleve@test.fr',           emoji: '🎓' },
  { role: 'Enseignant', email: 'enseignant@test.fr',       emoji: '🚗' },
  { role: 'Gérant',     email: 'gerant@test.fr',            emoji: '👑' },
];

export function mount(root) {
  root.innerHTML = template();
  wire(root);
  restoreRememberedEmail(root);
}

export function unmount() { /* rien à clean */ }

// ─── Template ───
function template() {
  return `
    <style>
      .lg-root{position:fixed;inset:0;overflow:auto;background:var(--ink);display:flex;align-items:center;justify-content:center;padding:24px 16px;font-family:var(--fb)}
      .lg-bg{position:absolute;inset:0;z-index:0;pointer-events:none}
      .lg-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,var(--a) 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,var(--pu) 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,var(--blk) 0%,transparent 40%);filter:blur(60px);opacity:.5;animation:lg-float 22s ease-in-out infinite alternate}
      @keyframes lg-float{0%{transform:translate(0,0) rotate(0deg) scale(1)}50%{transform:translate(40px,-30px) rotate(180deg) scale(1.08)}100%{transform:translate(-30px,40px) rotate(360deg) scale(.96)}}
      .lg-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0%,rgba(11,13,26,.6) 100%)}
      .lg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;z-index:1;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      .lg-content{position:relative;z-index:2;width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;margin:auto}

      /* Hero logo */
      .lg-logo-host{margin:8px 0 18px;display:flex;justify-content:center;opacity:0;animation:lg-in .7s cubic-bezier(.2,.7,.3,1) .1s both}
      .lg-logo-host img{height:clamp(60px,11vw,96px);filter:drop-shadow(0 12px 32px rgba(139,92,246,.45)) drop-shadow(0 0 24px rgba(99,102,241,.3))}
      @keyframes lg-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

      /* Card — premium glass */
      .lg-card{width:100%;background:rgba(255,255,255,.06);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:28px 26px;box-shadow:0 30px 80px -20px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04) inset;animation:lg-in .5s cubic-bezier(.2,.7,.3,1) .15s both;display:flex;flex-direction:column;gap:18px;color:#fff}

      .lg-card h2{font-family:var(--fd);font-weight:900;font-size:22px;letter-spacing:-.02em;margin:0;text-align:center}
      .lg-card .h-sub{font-size:13px;color:rgba(255,255,255,.65);text-align:center;margin:-10px 0 6px}

      /* Field — icone + input bordured */
      .lg-field{display:flex;flex-direction:column;gap:6px}
      .lg-field label{font-size:10.5px;font-weight:800;color:rgba(255,255,255,.78);letter-spacing:1.2px;text-transform:uppercase}
      .lg-input-wrap{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);transition:all .15s}
      .lg-input-wrap:focus-within{border-color:var(--al3);background:rgba(255,255,255,.08);box-shadow:0 0 0 3px rgba(99,102,241,.18)}
      .lg-input-wrap svg{width:18px;height:18px;color:rgba(255,255,255,.5);flex-shrink:0}
      .lg-input-wrap input{flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:14.5px;font-family:inherit;min-width:0}
      .lg-input-wrap input::placeholder{color:rgba(255,255,255,.35)}
      .lg-pw-eye{background:transparent;border:0;color:rgba(255,255,255,.5);cursor:pointer;padding:4px;font-size:16px;line-height:1;border-radius:6px}
      .lg-pw-eye:hover{background:rgba(255,255,255,.06);color:#fff}

      /* Remember + Forgot row */
      .lg-row{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-top:-4px}
      .lg-remember{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.8);cursor:pointer;user-select:none}
      .lg-remember input{appearance:none;width:16px;height:16px;border:1.5px solid rgba(255,255,255,.3);border-radius:4px;cursor:pointer;position:relative;flex-shrink:0;transition:all .15s}
      .lg-remember input:checked{background:var(--a);border-color:var(--a)}
      .lg-remember input:checked::after{content:'✓';position:absolute;top:-1px;left:2px;font-size:13px;color:#fff;font-weight:900}
      .lg-forgot{background:transparent;border:0;color:var(--al3);cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;text-decoration:underline;text-underline-offset:2px}
      .lg-forgot:hover{color:var(--al2)}

      /* CTA primary */
      .lg-cta{width:100%;height:50px;border-radius:12px;border:0;background:linear-gradient(135deg,var(--a),var(--pu));color:#fff;font-family:var(--fd);font-weight:800;font-size:15px;letter-spacing:.01em;cursor:pointer;transition:transform .12s,box-shadow .12s;box-shadow:0 12px 32px -10px rgba(99,102,241,.65)}
      .lg-cta:hover{transform:translateY(-1px);box-shadow:0 16px 40px -10px rgba(99,102,241,.8)}
      .lg-cta:disabled{opacity:.6;cursor:wait;transform:none}

      .lg-err{color:#fda4af;font-size:12.5px;margin:0;min-height:18px;text-align:center;font-weight:600}

      /* Divider */
      .lg-divider{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.4);font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:4px 0}
      .lg-divider::before,.lg-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.12)}

      /* Social OAuth buttons */
      .lg-social{display:flex;flex-direction:column;gap:8px}
      .lg-oauth{display:flex;align-items:center;justify-content:center;gap:10px;height:46px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .15s}
      .lg-oauth:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);transform:translateY(-1px)}
      .lg-oauth svg,.lg-oauth img{width:18px;height:18px}
      .lg-oauth.apple svg{color:#fff}

      /* OTP mode toggle */
      .lg-otp-toggle{background:transparent;border:0;color:var(--al3);font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:2px;letter-spacing:.2px;display:block;margin:-4px auto 0}
      .lg-otp-toggle:hover{color:var(--al2)}

      /* Demo accounts (toujours utile en dev) */
      .lg-demos{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:-4px}
      .lg-demo{padding:9px 4px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:inherit;color:#fff;transition:all .15s}
      .lg-demo:hover{background:rgba(255,255,255,.08);transform:translateY(-1px)}
      .lg-demo .em{font-size:16px;line-height:1}
      .lg-demo .nm{font-size:10px;font-weight:700;letter-spacing:.04em}

      /* Signup footer */
      .lg-foot{text-align:center;font-size:13px;color:rgba(255,255,255,.65);margin-top:2px}
      .lg-foot a{color:var(--al3);font-weight:700;text-decoration:none;border-bottom:1px solid rgba(165,180,252,.3);transition:border-color .15s}
      .lg-foot a:hover{border-color:var(--al3)}

      .lg-version{position:absolute;bottom:14px;right:14px;font-family:var(--fn);font-size:10.5px;color:rgba(255,255,255,.3);letter-spacing:1.5px;z-index:3}
      .lg-world-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.65;filter:blur(6px) saturate(.7);pointer-events:none;z-index:0}
    </style>

    <div class="lg-root">
      <img src="${_landingBg}" alt="" class="lg-world-bg" loading="eager" draggable="false">
      <div class="lg-bg"></div>
      <div class="lg-grid"></div>

      <div class="lg-content">
        <div class="lg-logo-host">
          <span class="pg-logo-txt">PermiGo</span>
        </div>

        <div class="lg-card">
          <h2>Connexion</h2>
          <p class="h-sub">Élève, enseignant ou gérant — accède à ton espace</p>

          <form id="login-form" novalidate>
            ${renderHoneypot()}

            <div class="lg-field">
              <label for="lg-email">Email</label>
              <div class="lg-input-wrap">
                ${ICON_MAIL}
                <input id="lg-email" type="email" name="email" required autocomplete="email" placeholder="vous@exemple.fr">
              </div>
            </div>

            <div class="lg-field" id="lg-pwd-field">
              <label for="lg-pwd">Mot de passe</label>
              <div class="lg-input-wrap">
                ${ICON_LOCK}
                <input id="lg-pwd" type="password" name="password" autocomplete="current-password" placeholder="••••••••">
                <button type="button" class="lg-pw-eye" id="lg-pw-toggle" aria-label="Afficher le mot de passe">👁️</button>
              </div>
            </div>

            <div class="lg-field" id="lg-otp-field" style="display:none">
              <label for="lg-otp">Code reçu par email</label>
              <div class="lg-input-wrap">
                ${ICON_KEY}
                <input id="lg-otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="123456" style="letter-spacing:.4em;font-family:var(--fn,monospace);font-size:17px;text-align:center">
              </div>
              <button type="button" id="lg-otp-resend" style="background:transparent;border:0;color:var(--al3);font-family:inherit;font-size:11.5px;cursor:pointer;margin-top:6px;text-align:center;text-decoration:underline">Renvoyer le code</button>
            </div>

            <div class="lg-row" id="lg-row-remember">
              <label class="lg-remember">
                <input type="checkbox" id="lg-remember">
                <span>Se souvenir de moi</span>
              </label>
              <button type="button" class="lg-forgot" id="lg-forgot">Mot de passe oublié ?</button>
            </div>

            <button type="submit" class="lg-cta" id="lg-submit">Se connecter</button>
            <p class="lg-err" id="lg-err"></p>
          </form>

          <button type="button" class="lg-otp-toggle" id="lg-mode-toggle">🔐 Recevoir un code par email</button>

          <div class="lg-divider">Démos rapides</div>
          <div class="lg-demos">
            ${DEMO_ACCOUNTS.map(a => `
              <button class="lg-demo" type="button" data-email="${esc(a.email)}">
                <span class="em">${a.emoji}</span>
                <span class="nm">${esc(a.role)}</span>
              </button>
            `).join('')}
          </div>

          <div class="lg-foot">
            Pas encore de compte ?
            <a href="#/signup">Créer un compte gratuit →</a>
          </div>
        </div>
      </div>

      <div class="lg-version">PermiGo · v7</div>
    </div>
  `;
}

// ─── Icônes SVG inline (lucide-style) ───
const ICON_MAIL  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`;
const ICON_LOCK  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
const ICON_KEY   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8.5-8.5M16 6l3 3M14 8l3 3"/></svg>`;
const ICON_GOOGLE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC04" d="M5.84 14.09A6.97 6.97 0 0 1 5.46 12c0-.73.13-1.43.36-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>`;
const ICON_APPLE = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 12.04c-.03-2.93 2.4-4.35 2.51-4.42-1.37-2-3.49-2.27-4.25-2.31-1.81-.18-3.53 1.06-4.45 1.06-.92 0-2.34-1.03-3.84-1-1.98.03-3.8 1.15-4.82 2.92-2.05 3.55-.52 8.79 1.48 11.66.98 1.41 2.15 2.99 3.69 2.93 1.48-.06 2.04-.96 3.83-.96 1.79 0 2.29.96 3.86.93 1.59-.03 2.6-1.43 3.58-2.84 1.13-1.63 1.59-3.21 1.61-3.29-.04-.02-3.09-1.19-3.12-4.72zM14.5 4.06c.81-.98 1.36-2.34 1.21-3.69-1.17.05-2.59.78-3.43 1.76-.75.86-1.41 2.24-1.23 3.57 1.31.1 2.64-.66 3.45-1.64z"/></svg>`;

// ─── Wire ───
function wire(root) {
  const form = root.querySelector('#login-form');
  const errEl = root.querySelector('#lg-err');
  const submitBtn = root.querySelector('#lg-submit');
  const emailIn = root.querySelector('#lg-email');
  const pwdIn = root.querySelector('#lg-pwd');
  const pwdField = root.querySelector('#lg-pwd-field');
  const otpField = root.querySelector('#lg-otp-field');
  const otpIn = root.querySelector('#lg-otp');
  const rowRemember = root.querySelector('#lg-row-remember');
  const pwToggle = root.querySelector('#lg-pw-toggle');
  const modeToggle = root.querySelector('#lg-mode-toggle');
  const remember = root.querySelector('#lg-remember');

  let mode = 'password'; // 'password' | 'otp-request' | 'otp-verify'

  function setMode(newMode) {
    mode = newMode;
    errEl.textContent = '';
    if (mode === 'password') {
      pwdField.style.display = '';
      otpField.style.display = 'none';
      rowRemember.style.display = '';
      submitBtn.textContent = 'Se connecter';
      modeToggle.textContent = '🔐 Recevoir un code par email';
    } else if (mode === 'otp-request') {
      pwdField.style.display = 'none';
      otpField.style.display = 'none';
      rowRemember.style.display = 'none';
      submitBtn.textContent = 'Envoyer le code';
      modeToggle.textContent = '← Utiliser mon mot de passe';
    } else if (mode === 'otp-verify') {
      pwdField.style.display = 'none';
      otpField.style.display = '';
      rowRemember.style.display = 'none';
      submitBtn.textContent = 'Vérifier le code';
      modeToggle.textContent = '← Utiliser mon mot de passe';
      setTimeout(() => otpIn.focus(), 100);
    }
  }
  modeToggle.addEventListener('click', () => setMode(mode === 'password' ? 'otp-request' : 'password'));

  // Show/hide password
  pwToggle.addEventListener('click', () => {
    pwdIn.type = pwdIn.type === 'password' ? 'text' : 'password';
    pwToggle.textContent = pwdIn.type === 'password' ? '👁️' : '🙈';
  });

  // Forgot password = bascule en mode OTP
  root.querySelector('#lg-forgot').addEventListener('click', () => {
    if (!emailIn.value.trim()) toast('Saisis ton email d\'abord', 'info');
    setMode('otp-request');
  });

  // Resend OTP
  root.querySelector('#lg-otp-resend').addEventListener('click', async () => {
    const email = emailIn.value.trim();
    if (!email) { setMode('otp-request'); return; }
    const rl = checkRateLimit('otp', email, 3, 5 * 60_000);
    if (!rl.allowed) {
      errEl.textContent = `Trop de demandes — réessaye dans ${formatWaitTime(rl.wait)}`;
      return;
    }
    recordAttempt('otp', email);
    const captchaToken = isTurnstileEnabled() ? await getTurnstileToken('otp') : null;
    const r = await loginWithOtp(email, { captchaToken });
    if (r.ok) toast('Nouveau code envoyé ✉️', 'success');
    else errEl.textContent = esc(r.error || 'Erreur envoi');
  });

  // OAuth buttons
  root.querySelectorAll('[data-oauth]').forEach(b => {
    b.addEventListener('click', async () => {
      if (!sb) return toast('Auth non configurée', 'error');
      const provider = b.dataset.oauth; // 'google' | 'apple'
      b.disabled = true;
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
        },
      });
      if (error) { toast(translateAuthError(error.message) || 'Erreur OAuth', 'error'); b.disabled = false; }
    });
  });

  // Demo buttons → pré-remplit
  root.querySelectorAll('.lg-demo').forEach(b => {
    b.addEventListener('click', () => {
      emailIn.value = b.dataset.email;
      pwdIn.value = 'Autopilot2025!';
      pwdIn.focus();
    });
  });

  // ─── Submit ───
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';

    if (!checkHoneypot(form)) {
      console.warn('[login] honeypot triggered');
      return; // bot silencieux
    }

    const email = emailIn.value.trim();
    if (!email) { errEl.textContent = 'Email requis'; shake(); return; }

    const rlAction = mode === 'otp-verify' ? 'otp-verify' : (mode === 'otp-request' ? 'otp' : 'login');
    const rl = checkRateLimit(rlAction, email, 5, 5 * 60_000);
    if (!rl.allowed) {
      errEl.textContent = `Trop d'essais — réessaye dans ${formatWaitTime(rl.wait)}`;
      shake(); return;
    }
    recordAttempt(rlAction, email);

    submitBtn.disabled = true;
    submitBtn.textContent = '…';

    try {
      const captchaToken = isTurnstileEnabled() ? await getTurnstileToken(rlAction) : null;
      if (isTurnstileEnabled() && !captchaToken) {
        errEl.textContent = 'Vérification anti-bot échouée — réessaye'; shake(); return;
      }

      if (mode === 'password') {
        const pwd = pwdIn.value;
        if (!pwd) { errEl.textContent = 'Mot de passe requis'; shake(); return; }
        const { ok, profile, error } = await login(email, pwd, { captchaToken });
        if (!ok) { errEl.textContent = esc(translateAuthError(error) || 'Identifiants invalides'); shake(); return; }
        resetRateLimit('login', email);
        if (remember.checked) saveRememberedEmail(email); else clearRememberedEmail();
        toast(`Bonjour ${esc(profile.nom.split(' ')[0])} 👋`, 'success');
        afterLogin();
      } else if (mode === 'otp-request') {
        const r = await loginWithOtp(email, { captchaToken });
        if (!r.ok) { errEl.textContent = esc(translateAuthError(r.error) || 'Erreur envoi'); shake(); return; }
        toast('Code envoyé ✉️ Vérifie ta boîte mail', 'success');
        setMode('otp-verify');
      } else if (mode === 'otp-verify') {
        const token = otpIn.value.trim();
        if (!/^\d{6}$/.test(token)) { errEl.textContent = 'Code à 6 chiffres requis'; shake(); return; }
        const r = await verifyOtp(email, token);
        if (!r.ok) { errEl.textContent = esc(translateAuthError(r.error) || 'Code invalide'); shake(); return; }
        resetRateLimit('otp', email);
        resetRateLimit('otp-verify', email);
        toast(`Bonjour ${esc(r.profile.nom.split(' ')[0])} 👋`, 'success');
        afterLogin();
      }
    } finally {
      submitBtn.disabled = false;
      if (mode === 'password') submitBtn.textContent = 'Se connecter';
      else if (mode === 'otp-request') submitBtn.textContent = 'Envoyer le code';
      else submitBtn.textContent = 'Vérifier le code';
    }
  });

  function shake() {
    form.classList.add('anim-shake');
    setTimeout(() => form.classList.remove('anim-shake'), 400);
  }
  async function afterLogin() {
    setTimeout(async () => {
      const [{ route }, { mountBottomNav }, { mountHeader }] = await Promise.all([
        import('@/router.js'),
        import('@/components/common/nav-bottom.js'),
        import('@/components/common/header-top.js'),
      ]);
      const me = getCurUser();
      // Force la home : set le hash ET appelle route() direct (sinon hashchange ne fire pas si hash déjà = #/)
      if (location.hash !== '#/') location.hash = '#/';
      const app = document.getElementById('app');
      await route(app, me);
      playLaunch();
      await mountHeader();
      mountBottomNav(me?.role);
      document.body.classList.add('has-chrome');
    }, 600);
  }
}

// ─── Remember me ───
const REMEMBER_KEY = 'permigo-remember-email';
function saveRememberedEmail(email) { try { localStorage.setItem(REMEMBER_KEY, email); } catch {} }
function clearRememberedEmail() { try { localStorage.removeItem(REMEMBER_KEY); } catch {} }
function restoreRememberedEmail(root) {
  try {
    const e = localStorage.getItem(REMEMBER_KEY);
    if (e) {
      root.querySelector('#lg-email').value = e;
      root.querySelector('#lg-remember').checked = true;
    }
  } catch {}
}
