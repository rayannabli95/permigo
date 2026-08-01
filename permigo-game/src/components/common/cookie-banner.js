// ═══════════════════════════════════════════════════════════════
// Bandeau cookies / consentement RGPD-ePrivacy
//
// Modèle de consentement :
//  - "essential"  : cookies/stockage strictement nécessaires (session auth).
//                   Toujours actifs, exemptés de consentement (CNIL).
//  - "all"        : essentiels + analytics produit (mesure d'audience 1st-party).
//
// Tant qu'aucun choix n'est fait, l'analytics est DÉSACTIVÉ (privacy by default).
// Le choix est mémorisé en localStorage (clé `permigo_cookie_consent`).
// ═══════════════════════════════════════════════════════════════

const KEY = "permigo_cookie_consent";
const COOKIE_NAME = "pg_consent";
const COOKIE_DAYS = 365;

function _getCookie() {
  try {
    const m = document.cookie.match("(?:^|;)\\s*" + COOKIE_NAME + "=([^;]+)");
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function _setCookie(value) {
  try {
    const exp = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Lax`;
  } catch {}
}

/** @returns {'all'|'essential'|null} */
export function getConsent() {
  try {
    return localStorage.getItem(KEY) || _getCookie();
  } catch {
    return _getCookie();
  }
}

/** L'analytics produit n'est autorisé que si l'utilisateur a accepté "all". */
export function analyticsConsentGranted() {
  return getConsent() === "all";
}

function setConsent(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
  _setCookie(value); // double persistance : cookie survit au clear localStorage (Safari ITP)
  window.dispatchEvent(new CustomEvent("permigo:consent", { detail: value }));
}

const STYLE = `<style>
  .ck-banner {
    position: fixed;
    left: 50%; bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    /* +100px pour dégager entièrement l'écran même quand le bandeau est levé
       au-dessus de la barre de nav (cf. body.has-chrome ci-dessous). */
    transform: translateX(-50%) translateY(calc(100% + 100px));
    width: min(520px, calc(100vw - 24px));
    background: var(--su, #fff);
    border: 1px solid var(--bo);
    border-radius: 20px;
    box-shadow: 0 16px 48px -12px rgba(11,13,26,.28);
    padding: 18px 18px 16px;
    z-index: 9000;
    transition: transform .42s cubic-bezier(.22,1,.32,1);
    font-family: 'Inter', sans-serif;
  }
  /* Dans l'app (chrome monté), le bandeau se pose AU-DESSUS de la barre de nav
     (~60px) au lieu de la recouvrir → les onglets restent tappables. Et pendant
     qu'il est ouvert, on réserve l'espace bas sur #app pour que les CTA de bas
     de page (ex. « Ton centre d'examen » sur Réviser) ne soient plus masqués. */
  body.has-chrome .ck-banner { bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
  body.ck-open.has-chrome #app { padding-bottom: calc(210px + env(safe-area-inset-bottom, 0px)); }
  .ck-banner.on { transform: translateX(-50%) translateY(0); }
  @media (prefers-reduced-motion: reduce) { .ck-banner { transition: none; } }
  .ck-ttl {
    font: 800 15px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); margin: 0 0 6px;
    display: flex; align-items: center; gap: 7px;
  }
  .ck-txt { font: 500 12.5px/1.55 'Inter', sans-serif; color: var(--ink); margin: 0 0 14px; }
  .ck-txt a { color: var(--ink, var(--a-ink)); text-decoration: underline; }
  .ck-row { display: flex; gap: 8px; }
  .ck-btn {
    flex: 1; padding: 12px 14px; border-radius: 12px;
    font: 700 13.5px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 46px; border: 1px solid transparent;
    transition: transform .12s, opacity .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ck-btn:active { transform: scale(.97); }
  .ck-btn-accept { background: var(--a); color: var(--a-ink); box-shadow: 0 6px 18px -6px color-mix(in srgb, var(--a) 50%, transparent); }
  .ck-btn-refuse { background: var(--bg); color: var(--ink, #1e293b); border-color: var(--bo); }
</style>`;

export function mountCookieBanner() {
  // Choix déjà fait → rien à afficher.
  if (getConsent()) return;
  if (document.getElementById("ck-banner-root")) return;

  const root = document.createElement("div");
  root.id = "ck-banner-root";
  root.innerHTML = `${STYLE}
    <div class="ck-banner" role="dialog" aria-label="Préférences cookies" aria-live="polite">
      <div class="ck-ttl">Cookies & confidentialité</div>
      <p class="ck-txt">
        On utilise le strict nécessaire pour te connecter, plus une mesure d'audience
        interne (sans pub ni tracker tiers) pour améliorer l'app.
        <a href="#/legal/privacy">Politique de confidentialité</a>
      </p>
      <div class="ck-row">
        <button class="ck-btn ck-btn-refuse" id="ck-essential" type="button">Essentiels uniquement</button>
        <button class="ck-btn ck-btn-accept" id="ck-all" type="button">Tout accepter</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  // Réserve l'espace bas (cf. body.ck-open dans STYLE) tant que le bandeau est là.
  document.body.classList.add("ck-open");

  const banner = root.querySelector(".ck-banner");
  requestAnimationFrame(() => banner.classList.add("on"));

  const close = (value) => {
    setConsent(value);
    banner.classList.remove("on");
    document.body.classList.remove("ck-open");
    const done = () => root.remove();
    banner.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 500); // fallback si transitionend ne se déclenche pas
  };

  root.querySelector("#ck-all").addEventListener("click", () => close("all"));
  root
    .querySelector("#ck-essential")
    .addEventListener("click", () => close("essential"));
}
