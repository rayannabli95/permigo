/**
 * Page Login — DA « Arène 3D » (nuit-violet + plastique 3D), badge vert PermiGo
 * comme seule marque (« feu vert / GO »). Accessibilité poussée (WCAG AA/AAA).
 *
 * Stack sécurité actif (INCHANGÉ) :
 *  - Honeypot (champs invisibles website_url/fax_number)
 *  - Rate limit client (5 login/5min, 3 OTP/5min)
 *  - Cloudflare Turnstile captcha (si VITE_TURNSTILE_SITEKEY défini)
 *  - Magic link / OTP par email (bouton "Code par email")
 *  - OAuth Google / Apple (si activé dans Supabase)
 *  - PKCE flow Supabase
 */

import { sb, login, loginWithOtp, verifyOtp } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { getCurUser } from "@/auth/cur-user.js";

// Traductions FR des messages d'erreur Supabase Auth (en anglais côté API)
const AUTH_ERRORS_FR = {
  "Invalid login credentials": "Identifiants invalides.",
  "Email not confirmed": "Email non confirmé — vérifie ta boîte mail.",
  "User not found": "Aucun compte trouvé pour cet email.",
  "Invalid OTP": "Code invalide ou expiré.",
  "Token has expired or is invalid":
    "Le lien a expiré. Demande un nouveau code.",
  "Signup requires a valid password": "Mot de passe requis.",
  "Password should be at least 6 characters":
    "Le mot de passe doit contenir au moins 6 caractères.",
  "User already registered": "Un compte existe déjà pour cet email.",
  "Email rate limit exceeded":
    "Trop de tentatives — réessaie dans quelques minutes.",
  over_email_send_rate_limit:
    "Trop de codes envoyés — réessaie dans 60 secondes.",
  "For security purposes, you can only request this once every 60 seconds":
    "Attends 60 secondes avant de renvoyer un code.",
  "Signups not allowed for otp":
    "Cette adresse email n'est pas enregistrée. Vérifie l'adresse saisie.",
  "Unable to validate email address: invalid format": "Adresse email invalide.",
};
function translateAuthError(msg) {
  if (!msg) return null;
  for (const [en, fr] of Object.entries(AUTH_ERRORS_FR)) {
    if (msg.includes(en)) return fr;
  }
  return msg; // fallback : message brut Supabase
}
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  formatWaitTime,
} from "@/utils/rate-limit.js";
import { getTurnstileToken, isTurnstileEnabled } from "@/utils/turnstile.js";
import { renderHoneypot, checkHoneypot } from "@/utils/honeypot.js";

const DEMO_ACCOUNTS = [
  { role: "Élève", email: "eleve@test.fr", ico: "school", gold: false },
  { role: "Enseignant", email: "enseignant@test.fr", ico: "car", gold: false },
  { role: "Gérant", email: "gerant@test.fr", ico: "crown", gold: true },
];

// État des effets visuels (étincelles) — nettoyés à l'unmount.
let _fxRaf = 0;
let _fxResize = null;

export function mount(root) {
  root.innerHTML = template();
  wire(root);
  restoreRememberedEmail(root);
  startFx(root); // étincelles + tilt (coupés si prefers-reduced-motion)
}

export function unmount() {
  // Stoppe la boucle d'animation et le listener resize (évite une fuite rAF)
  if (_fxRaf) (cancelAnimationFrame(_fxRaf), (_fxRaf = 0));
  if (_fxResize) (removeEventListener("resize", _fxResize), (_fxResize = null));
}

// ─── Template ───
// DA « Arène 3D » : fond nuit-violet, carte plaque plastique 3D, badge vert PermiGo
// (le « feu vert / GO ») comme seule marque. A11y : focus visibles, contrastes AA,
// fix autofill, cibles ≥44px, support reduced-motion / forced-colors / prefers-contrast.
function template() {
  return `
    <style>
      .lg-root{
        position:fixed;inset:0;overflow:auto;overscroll-behavior:contain;
        display:flex;align-items:center;justify-content:center;
        padding:24px 18px calc(24px + env(safe-area-inset-bottom));
        font-family:'Baloo 2',var(--fb);-webkit-font-smoothing:antialiased;
        /* Jetons DA (scopés) */
        --in:#6c63ff;--in-lt:#8e87ff;--in-dp:#4a3fc9;--in-dk:#372fa3;
        --gold:#ffce4d;--gold-dp:#e8a317;--go:#58cc02;--go-dp:#3a8a01;
        --ncard:#2b2160;--ink:#f4f1ff;--ink-soft:#cdc8ec;--ink-mu:#aaa2d8;
        --field:#221a4f;--field-line:#6257a8;--focus:#ffd84d;--rad:26px;--tap:46px;
        color:var(--ink);
        background:
          radial-gradient(120% 90% at 50% -10%,rgba(255,206,77,.16),transparent 55%),
          radial-gradient(130% 120% at 50% 110%,rgba(0,0,0,.55),transparent 60%),
          linear-gradient(160deg,#241a4d 0%,#3a2a7a 100%);
      }

      /* Étincelles dorées (canvas, décor) */
      .lg-sparks{position:fixed;inset:0;z-index:0;width:100%;height:100%;pointer-events:none}

      /* Scène (perspective pour le tilt) */
      .lg-scene{position:relative;z-index:1;width:100%;max-width:430px;margin:auto;perspective:1100px}

      /* Carte = plaque plastique 3D */
      .lg-card{
        position:relative;
        background:linear-gradient(180deg,#322764 0%,var(--ncard) 60%,#261d56 100%);
        border-radius:var(--rad);padding:30px 26px 26px;
        box-shadow:
          inset 0 3px 0 rgba(255,255,255,.18),
          inset 0 2px 14px rgba(255,255,255,.06),
          inset 0 -10px 22px rgba(0,0,0,.45),
          0 10px 0 #160f38,
          0 22px 38px rgba(0,0,0,.5),
          0 0 0 2px rgba(124,111,224,.35);
        transition:transform .12s ease-out;transform-style:preserve-3d;will-change:transform;
        display:flex;flex-direction:column;
      }
      /* Liseré doré subtil */
      .lg-card::before{
        content:"";position:absolute;inset:0;border-radius:var(--rad);padding:1.5px;
        background:linear-gradient(180deg,rgba(255,206,77,.55),rgba(255,206,77,0) 45%);
        -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
        -webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}

      /* En-tête : badge vert = seule marque */
      .lg-head{text-align:center}
      .lg-emblem{position:relative;display:grid;place-items:center;width:88px;height:88px;margin:0 auto 16px}
      .lg-emblem img{width:88px;height:88px;object-fit:contain;position:relative;z-index:1;
        filter:drop-shadow(0 5px 8px rgba(0,0,0,.5)) drop-shadow(0 0 16px rgba(88,204,2,.6))}
      .lg-emblem::before{content:"";position:absolute;inset:-14px;border-radius:50%;z-index:0;
        background:radial-gradient(circle,rgba(88,204,2,.45),rgba(88,204,2,0) 68%);
        animation:lg-pulse 2.8s ease-in-out infinite}
      @keyframes lg-pulse{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.12);opacity:.9}}
      .lg-emblem-fb{display:none;width:80px;height:80px;place-items:center;position:relative;z-index:1;
        background:linear-gradient(180deg,#7ee838,var(--go) 55%,var(--go-dp) 100%);
        clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
        box-shadow:inset 0 2px 3px rgba(255,255,255,.5),0 4px 8px rgba(0,0,0,.4)}
      .lg-emblem-fb b{color:#fff;font-size:42px;font-weight:800;text-shadow:0 2px 2px rgba(0,0,0,.35)}

      .lg-title{margin:6px 0 4px;font-size:26px;font-weight:800;line-height:1.1;text-shadow:0 2px 0 rgba(0,0,0,.35)}
      .lg-subtitle{margin:0 0 22px;font-size:14.5px;color:var(--ink-soft);font-weight:600}

      /* Champs */
      .lg-field{margin-bottom:14px}
      .lg-field label{display:block;font-size:13px;font-weight:700;color:var(--ink-soft);margin:0 0 6px 4px}
      .lg-shell{position:relative;display:flex;align-items:center;background:var(--field);border-radius:15px;
        box-shadow:inset 0 2px 5px rgba(0,0,0,.5),inset 0 0 0 1.5px var(--field-line);transition:box-shadow .15s ease}
      .lg-shell:focus-within{box-shadow:inset 0 2px 5px rgba(0,0,0,.4),inset 0 0 0 2px var(--focus),0 0 0 4px rgba(255,216,77,.35)}
      .lg-ico{flex:0 0 auto;display:grid;place-items:center;width:46px;height:var(--tap);color:#b7afe8}
      .lg-ico svg{width:20px;height:20px}
      .lg-shell input{flex:1 1 auto;min-width:0;height:var(--tap);background:transparent;border:0;outline:0;
        color:var(--ink);font-family:inherit;font-size:16px;font-weight:600;padding:0 6px 0 0}
      .lg-shell input::placeholder{color:#9b93cf;font-weight:500}
      .lg-otp-input{letter-spacing:.4em;font-family:var(--fn,monospace);font-size:17px;text-align:center}

      /* FIX autofill : garde le champ sombre (plus de rectangle blanc) */
      .lg-root input:-webkit-autofill,
      .lg-root input:-webkit-autofill:hover,
      .lg-root input:-webkit-autofill:focus,
      .lg-root input:-webkit-autofill:active{
        -webkit-text-fill-color:var(--ink) !important;
        -webkit-box-shadow:0 0 0 1000px var(--field) inset !important;
        box-shadow:0 0 0 1000px var(--field) inset !important;
        caret-color:var(--ink);transition:background-color 9999s ease-out 0s}

      /* Bouton œil */
      .lg-eye{flex:0 0 auto;width:var(--tap);height:var(--tap);display:grid;place-items:center;
        background:transparent;border:0;cursor:pointer;color:#b7afe8;border-radius:12px}
      .lg-eye:hover{color:var(--ink)}
      .lg-eye:focus-visible{outline:3px solid var(--focus);outline-offset:-3px}

      /* Ligne se souvenir / oublié */
      .lg-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 2px 20px}
      .lg-remember{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-size:13.5px;
        color:var(--ink-soft);font-weight:600;user-select:none;min-height:var(--tap);padding:4px 4px 4px 0}
      .lg-remember input{position:absolute;opacity:0;width:0;height:0}
      .lg-box{width:24px;height:24px;border-radius:7px;flex:0 0 auto;background:var(--field);display:grid;place-items:center;
        box-shadow:inset 0 2px 4px rgba(0,0,0,.5),inset 0 0 0 1.5px var(--field-line);transition:all .15s ease}
      .lg-box svg{width:14px;height:14px;opacity:0;transform:scale(.5);color:#1a1340;
        transition:all .15s cubic-bezier(.34,1.56,.64,1)}
      .lg-remember input:checked + .lg-box{background:linear-gradient(180deg,var(--gold),var(--gold-dp));
        box-shadow:inset 0 1px 2px rgba(255,255,255,.6),0 2px 5px rgba(0,0,0,.35)}
      .lg-remember input:checked + .lg-box svg{opacity:1;transform:scale(1)}
      .lg-remember input:focus-visible + .lg-box{outline:3px solid var(--focus);outline-offset:3px}

      .lg-link{background:transparent;border:0;cursor:pointer;font-family:inherit;color:#bdb6ff;
        text-decoration:underline;text-underline-offset:2px;font-weight:700;font-size:13.5px;
        display:inline-flex;align-items:center;min-height:var(--tap);padding:4px 2px;border-radius:8px}
      .lg-link:hover{color:#d8d4ff}
      .lg-link:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

      /* CTA plastique 3D */
      .lg-cta{width:100%;height:58px;border:0;cursor:pointer;border-radius:17px;font-family:inherit;
        font-size:18px;font-weight:800;letter-spacing:.2px;color:#fff;
        background:linear-gradient(180deg,var(--in-lt) 0%,var(--in) 55%,var(--in-dp) 100%);
        box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -4px 8px rgba(0,0,0,.28),
          0 7px 0 var(--in-dk),0 12px 20px rgba(74,63,201,.5);
        text-shadow:0 2px 1px rgba(0,0,0,.3);transform:translateY(0);
        transition:transform .08s cubic-bezier(.34,1.56,.64,1),box-shadow .08s ease}
      .lg-cta:hover{filter:brightness(1.04)}
      .lg-cta:active{transform:translateY(5px);box-shadow:inset 0 2px 0 rgba(255,255,255,.45),
        inset 0 -2px 6px rgba(0,0,0,.3),0 2px 0 var(--in-dk),0 5px 10px rgba(74,63,201,.45)}
      .lg-cta:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
      .lg-cta:disabled{opacity:.65;cursor:wait;transform:none;filter:none}

      .lg-err{color:#ffb3b3;font-size:13px;margin:10px 0 0;min-height:18px;text-align:center;font-weight:700}

      /* Lien code par email (bascule de mode) */
      .lg-code-link{display:flex;align-items:center;justify-content:center;gap:5px;text-align:center;
        margin:10px auto 4px;background:transparent;border:0;cursor:pointer;font-family:inherit;
        color:#bdb6ff;font-size:13.5px;font-weight:700;text-decoration:underline;text-underline-offset:2px;
        padding:8px;min-height:var(--tap);border-radius:10px}
      .lg-code-link:hover{color:#fff}
      .lg-code-link:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

      /* Séparateur démo */
      .lg-sep{display:flex;align-items:center;gap:12px;margin:14px 0 16px;color:var(--ink-mu);
        font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .lg-sep::before,.lg-sep::after{content:"";flex:1;height:2px;border-radius:2px;
        background:linear-gradient(90deg,transparent,rgba(124,111,224,.4),transparent)}

      /* 3 mini-cartes démo */
      .lg-demos{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .lg-demo{display:flex;flex-direction:column;align-items:center;gap:7px;padding:13px 6px 11px;
        min-height:var(--tap);border:0;cursor:pointer;border-radius:16px;color:var(--ink);
        background:linear-gradient(180deg,#3a2f72 0%,#2c2360 100%);font-family:inherit;font-size:12.5px;font-weight:700;
        box-shadow:inset 0 2px 0 rgba(255,255,255,.16),0 4px 0 #1b143f,0 7px 12px rgba(0,0,0,.35);
        transition:transform .08s ease,box-shadow .08s ease}
      .lg-demo:hover{filter:brightness(1.06)}
      .lg-demo:active{transform:translateY(3px);box-shadow:inset 0 2px 0 rgba(255,255,255,.14),0 1px 0 #1b143f,0 3px 7px rgba(0,0,0,.3)}
      .lg-demo:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
      .lg-demo .lg-badge{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#fff;
        background:linear-gradient(180deg,var(--in-lt),var(--in-dp));
        box-shadow:inset 0 2px 2px rgba(255,255,255,.4),0 2px 4px rgba(0,0,0,.3)}
      .lg-demo.is-gold .lg-badge{background:linear-gradient(180deg,var(--gold),var(--gold-dp));color:#3a2600}

      /* Footer */
      .lg-foot{margin-top:18px;text-align:center;font-size:13.5px;color:var(--ink-soft);font-weight:600}
      .lg-foot a{color:var(--gold);font-weight:700;text-decoration:underline;text-underline-offset:2px;
        display:inline-flex;min-height:var(--tap);align-items:center;padding:2px 4px;border-radius:8px}
      .lg-foot a:hover{color:#ffe39a}
      .lg-foot a:focus-visible{outline:3px solid var(--focus);outline-offset:2px}

      .lg-version{position:fixed;right:14px;bottom:12px;z-index:2;font-size:11px;font-weight:700;
        color:var(--ink-mu);letter-spacing:.3px}

      /* Préférence de mouvement */
      @media (prefers-reduced-motion: reduce){
        .lg-sparks{display:none}
        .lg-card{transform:none !important}
        .lg-root *,.lg-root *::before,.lg-root *::after{animation:none !important;transition:none !important}
        .lg-emblem::before{transform:scale(1);opacity:.7}
      }
      /* Contraste renforcé */
      @media (prefers-contrast: more){
        .lg-root{--ink-soft:#e4e1f7;--ink-mu:#cfcaee;--field-line:#8a7ed0}
        .lg-shell{box-shadow:inset 0 0 0 2px var(--field-line)}
        .lg-demo,.lg-cta{outline:1px solid rgba(255,255,255,.4)}
        .lg-link,.lg-code-link,.lg-foot a{text-decoration-thickness:2px}
      }
      /* Contrastes forcés (Windows High Contrast) */
      @media (forced-colors: active){
        .lg-card{border:1px solid CanvasText}
        .lg-shell{border:1px solid CanvasText;box-shadow:none}
        .lg-cta,.lg-demo{border:2px solid ButtonText;box-shadow:none}
        .lg-box{border:1px solid CanvasText}
        .lg-remember input:checked + .lg-box{background:Highlight}
        .lg-root :focus-visible{outline:2px solid Highlight !important}
        .lg-emblem img{filter:none}
      }
      /* Petits écrans */
      @media (max-width:360px){
        .lg-card{padding:26px 20px 22px}
        .lg-title{font-size:23px}
        .lg-demo{font-size:11.5px}
      }
    </style>

    <div class="lg-root">
      <canvas class="lg-sparks" id="lg-sparks" aria-hidden="true"></canvas>

      <main class="lg-scene">
        <form class="lg-card" id="login-form" autocomplete="on" novalidate>
          ${renderHoneypot()}

          <div class="lg-head">
            <div class="lg-emblem">
              <img src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" loading="eager" draggable="false"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="lg-emblem-fb" aria-hidden="true"><b>P</b></span>
            </div>
            <h1 class="lg-title">Content de te revoir</h1>
            <p class="lg-subtitle">Élève, moniteur ou gérant — retrouve ton espace</p>
          </div>

          <div class="lg-field" id="lg-email-field">
            <label for="lg-email">Email</label>
            <div class="lg-shell">
              <span class="lg-ico" aria-hidden="true">${ICON_MAIL}</span>
              <input id="lg-email" type="email" name="email" inputmode="email" required autocomplete="email" placeholder="toi@exemple.fr">
            </div>
          </div>

          <div class="lg-field" id="lg-pwd-field">
            <label for="lg-pwd">Mot de passe</label>
            <div class="lg-shell">
              <span class="lg-ico" aria-hidden="true">${ICON_LOCK}</span>
              <input id="lg-pwd" type="password" name="password" autocomplete="current-password" placeholder="••••••••">
              <button type="button" class="lg-eye" id="lg-pw-toggle" aria-label="Afficher le mot de passe" aria-pressed="false">${icon("eye", { size: 20 })}</button>
            </div>
          </div>

          <div class="lg-field" id="lg-otp-field" style="display:none">
            <label for="lg-otp">Code reçu par email</label>
            <div class="lg-shell">
              <span class="lg-ico" aria-hidden="true">${ICON_KEY}</span>
              <input id="lg-otp" class="lg-otp-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="123456">
            </div>
            <button type="button" id="lg-otp-resend" class="lg-link" style="margin:6px auto 0">Renvoyer le code</button>
          </div>

          <div class="lg-row" id="lg-row-remember">
            <label class="lg-remember">
              <input type="checkbox" id="lg-remember">
              <span class="lg-box" aria-hidden="true">${ICON_CHECK}</span>
              <span>Se souvenir de moi</span>
            </label>
            <button type="button" class="lg-link" id="lg-forgot">Mot de passe oublié ?</button>
          </div>

          <button type="submit" class="lg-cta" id="lg-submit">Se connecter</button>
          <p class="lg-err" id="lg-err" role="alert" aria-live="assertive"></p>

          <button type="button" class="lg-code-link" id="lg-mode-toggle">Recevoir un code par email</button>

          ${
            import.meta.env.DEV
              ? `<div class="lg-sep">Comptes démo</div>
          <div class="lg-demos">
            ${DEMO_ACCOUNTS.map(
              (a) => `
              <button class="lg-demo${a.gold ? " is-gold" : ""}" type="button" data-email="${esc(a.email)}" aria-label="Démo ${esc(a.role)}">
                <span class="lg-badge" aria-hidden="true">${icon(a.ico, { size: 20 })}</span>
                ${esc(a.role)}
              </button>
            `,
            ).join("")}
          </div>`
              : ""
          }

          <p class="lg-foot">
            Pas encore de compte ? <a href="/#/creer-compte">Crée ton compte moniteur</a>
          </p>
          <p class="lg-foot">
            Élève avec un code moniteur ? <a href="/#/rejoindre">Rejoins ton moniteur</a>
          </p>
        </form>
      </main>

      <span class="lg-version">PermiGo · v7</span>
    </div>
  `;
}

// ─── Icônes SVG inline (lucide-style) ───
const ICON_MAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;
const ICON_KEY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8.5-8.5M16 6l3 3M14 8l3 3"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

// ─── Effets visuels (étincelles dorées + tilt 3D) — enhancement, sans état métier ───
function startFx(root) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // Tilt 3D subtil de la carte (pointeur fin uniquement)
  if (matchMedia("(pointer:fine)").matches) {
    const card = root.querySelector("#login-form");
    if (card) {
      const MAX = 5;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateZ(0)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    }
  }

  // Étincelles dorées (canvas)
  const cv = root.querySelector("#lg-sparks");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const GOLD = ["#ffce4d", "#ffe39a", "#ffd76b"];
  let dots = [];

  _fxResize = function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + "px";
    cv.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((innerWidth * innerHeight) / 42000);
    dots = Array.from({ length: Math.max(16, Math.min(n, 40)) }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.6 + 0.5,
      vy: Math.random() * 0.25 + 0.06,
      a: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.03 + 0.012,
      c: GOLD[(Math.random() * GOLD.length) | 0],
    }));
  };
  _fxResize();
  addEventListener("resize", _fxResize);

  (function tick() {
    // Auto-stop : si le canvas n'est plus dans le DOM (page quittée), on
    // arrête la boucle — sinon elle tournait pour toujours après connexion.
    if (!document.body.contains(cv)) {
      _fxRaf = 0;
      return;
    }
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const d of dots) {
      d.y -= d.vy;
      d.a += d.sp;
      if (d.y < -5) {
        d.y = innerHeight + 5;
        d.x = Math.random() * innerWidth;
      }
      const glow = (Math.sin(d.a) + 1) / 2;
      ctx.globalAlpha = 0.15 + glow * 0.5;
      ctx.fillStyle = d.c;
      ctx.shadowBlur = 8;
      ctx.shadowColor = d.c;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    _fxRaf = requestAnimationFrame(tick);
  })();
}

// ─── Wire ───
function wire(root) {
  const form = root.querySelector("#login-form");
  const errEl = root.querySelector("#lg-err");
  const submitBtn = root.querySelector("#lg-submit");
  const emailIn = root.querySelector("#lg-email");
  const pwdIn = root.querySelector("#lg-pwd");
  const pwdField = root.querySelector("#lg-pwd-field");
  const otpField = root.querySelector("#lg-otp-field");
  const otpIn = root.querySelector("#lg-otp");
  const rowRemember = root.querySelector("#lg-row-remember");
  const pwToggle = root.querySelector("#lg-pw-toggle");
  const modeToggle = root.querySelector("#lg-mode-toggle");
  const remember = root.querySelector("#lg-remember");

  let mode = "password"; // 'password' | 'otp-request' | 'otp-verify'

  function setMode(newMode) {
    mode = newMode;
    errEl.textContent = "";
    if (mode === "password") {
      pwdField.style.display = "";
      otpField.style.display = "none";
      rowRemember.style.display = "";
      submitBtn.textContent = "Se connecter";
      modeToggle.textContent = "Recevoir un code par email";
    } else if (mode === "otp-request") {
      pwdField.style.display = "none";
      otpField.style.display = "none";
      rowRemember.style.display = "none";
      submitBtn.textContent = "Envoyer le code";
      modeToggle.textContent = "← Utiliser mon mot de passe";
    } else if (mode === "otp-verify") {
      pwdField.style.display = "none";
      otpField.style.display = "";
      rowRemember.style.display = "none";
      submitBtn.textContent = "Vérifier le code";
      modeToggle.textContent = "← Utiliser mon mot de passe";
      setTimeout(() => otpIn.focus(), 100);
    }
  }
  modeToggle.addEventListener("click", () =>
    setMode(mode === "password" ? "otp-request" : "password"),
  );

  // Show/hide password (+ a11y : aria-pressed / aria-label)
  pwToggle.addEventListener("click", () => {
    const show = pwdIn.type === "password";
    pwdIn.type = show ? "text" : "password";
    pwToggle.innerHTML = show
      ? icon("eye-off", { size: 20 })
      : icon("eye", { size: 20 });
    pwToggle.setAttribute("aria-pressed", String(show));
    pwToggle.setAttribute(
      "aria-label",
      show ? "Masquer le mot de passe" : "Afficher le mot de passe",
    );
  });

  // Forgot password = bascule en mode OTP
  root.querySelector("#lg-forgot").addEventListener("click", () => {
    if (!emailIn.value.trim()) toast("Saisis ton email d'abord", "info");
    setMode("otp-request");
  });

  // Resend OTP
  root.querySelector("#lg-otp-resend").addEventListener("click", async () => {
    const email = emailIn.value.trim();
    if (!email) {
      setMode("otp-request");
      return;
    }
    const rl = checkRateLimit("otp", email, 3, 5 * 60_000);
    if (!rl.allowed) {
      errEl.textContent = `Trop de demandes — réessaye dans ${formatWaitTime(rl.wait)}`;
      return;
    }
    recordAttempt("otp", email);
    const captchaToken = isTurnstileEnabled()
      ? await getTurnstileToken("otp")
      : null;
    const r = await loginWithOtp(email, { captchaToken });
    if (r.ok) toast("Nouveau code envoyé", "success");
    else errEl.textContent = esc(r.error || "Erreur envoi");
  });

  // OAuth buttons
  root.querySelectorAll("[data-oauth]").forEach((b) => {
    b.addEventListener("click", async () => {
      if (!sb) return toast("Auth non configurée", "error");
      const provider = b.dataset.oauth; // 'google' | 'apple'
      b.disabled = true;
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          queryParams:
            provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (error) {
        toast(translateAuthError(error.message) || "Erreur OAuth", "error");
        b.disabled = false;
      }
    });
  });

  // Demo buttons → pré-remplit (DEV uniquement — exclu du bundle prod par Vite,
  // sinon on exposerait des comptes de test + un mot de passe en clair)
  if (import.meta.env.DEV) {
    root.querySelectorAll(".lg-demo").forEach((b) => {
      b.addEventListener("click", () => {
        emailIn.value = b.dataset.email;
        pwdIn.value = "Autopilot2025!";
        errEl.textContent = ""; // Clear error message when demo filled
        pwdIn.focus();
      });
    });
  }

  // ─── Submit ───
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = "";

    if (!checkHoneypot(form)) {
      console.warn("[login] honeypot triggered");
      return; // bot silencieux
    }

    const email = emailIn.value.trim();
    if (!email) {
      errEl.textContent = "Email requis";
      shake();
      return;
    }

    const rlAction =
      mode === "otp-verify"
        ? "otp-verify"
        : mode === "otp-request"
          ? "otp"
          : "login";
    const rl = checkRateLimit(rlAction, email, 5, 5 * 60_000);
    if (!rl.allowed) {
      errEl.textContent = `Trop d'essais — réessaye dans ${formatWaitTime(rl.wait)}`;
      shake();
      return;
    }
    recordAttempt(rlAction, email);

    submitBtn.disabled = true;
    submitBtn.textContent = "…";

    try {
      const captchaToken = isTurnstileEnabled()
        ? await getTurnstileToken(rlAction)
        : null;
      if (isTurnstileEnabled() && !captchaToken) {
        errEl.textContent = "Vérification anti-bot échouée — réessaye";
        shake();
        return;
      }

      if (mode === "password") {
        const pwd = pwdIn.value;
        if (!pwd) {
          errEl.textContent = "Mot de passe requis";
          shake();
          return;
        }
        const { ok, profile, error } = await login(email, pwd, {
          captchaToken,
        });
        if (!ok) {
          errEl.textContent = esc(
            translateAuthError(error) || "Identifiants invalides",
          );
          shake();
          return;
        }
        resetRateLimit("login", email);
        if (remember.checked) saveRememberedEmail(email);
        else clearRememberedEmail();
        // Prénom pour le bonjour — garde anti-null : un profil sans `nom`
        // (ex. compte owner) faisait planter `null.split()` → le login réussissait
        // mais afterLogin() n'était jamais appelé (« rien ne se passe »).
        const greetName = (profile.prenom || profile.nom || "").split(" ")[0];
        toast(`Bonjour ${esc(greetName)}`.trim(), "success");
        afterLogin();
      } else if (mode === "otp-request") {
        const r = await loginWithOtp(email, { captchaToken });
        if (!r.ok) {
          errEl.textContent = esc(
            translateAuthError(r.error) || "Erreur envoi",
          );
          shake();
          return;
        }
        toast("Code envoyé — vérifie ta boîte mail", "success");
        setMode("otp-verify");
      } else if (mode === "otp-verify") {
        const token = otpIn.value.trim();
        if (!/^\d{6}$/.test(token)) {
          errEl.textContent = "Code à 6 chiffres requis";
          shake();
          return;
        }
        const r = await verifyOtp(email, token);
        if (!r.ok) {
          errEl.textContent = esc(
            translateAuthError(r.error) || "Code invalide",
          );
          shake();
          return;
        }
        resetRateLimit("otp", email);
        resetRateLimit("otp-verify", email);
        toast(
          `Bonjour ${esc((r.profile.prenom || r.profile.nom || "").split(" ")[0])}`,
          "success",
        );
        afterLogin();
      }
    } finally {
      submitBtn.disabled = false;
      if (mode === "password") submitBtn.textContent = "Se connecter";
      else if (mode === "otp-request")
        submitBtn.textContent = "Envoyer le code";
      else submitBtn.textContent = "Vérifier le code";
    }
  });

  function shake() {
    form.classList.add("anim-shake");
    setTimeout(() => form.classList.remove("anim-shake"), 400);
  }
  async function afterLogin() {
    // Nettoyage explicite des FX login (rAF + resize) avant de monter la home
    unmount();
    setTimeout(async () => {
      const [{ route }, { mountBottomNav }, { mountHeader }] =
        await Promise.all([
          import("@/router.js"),
          import("@/components/common/nav-bottom.js"),
          import("@/components/common/header-top.js"),
        ]);
      const me = getCurUser();
      // Force la home : set le hash ET appelle route() direct (sinon hashchange ne fire pas si hash déjà = #/)
      if (location.hash !== "#/") location.hash = "#/";
      const app = document.getElementById("app");
      await route(app, me);
      await mountHeader();
      mountBottomNav(me?.role);
      document.body.classList.add("has-chrome");
    }, 600);
  }
}

// ─── Remember me ───
const REMEMBER_KEY = "permigo-remember-email";
function saveRememberedEmail(email) {
  try {
    localStorage.setItem(REMEMBER_KEY, email);
  } catch {}
}
function clearRememberedEmail() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
  } catch {}
}
function restoreRememberedEmail(root) {
  try {
    const e = localStorage.getItem(REMEMBER_KEY);
    if (e) {
      root.querySelector("#lg-email").value = e;
      root.querySelector("#lg-remember").checked = true;
    }
  } catch {}
}
