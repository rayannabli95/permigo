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

const KEY = 'permigo_cookie_consent';

/** @returns {'all'|'essential'|null} */
export function getConsent() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/** L'analytics produit n'est autorisé que si l'utilisateur a accepté "all". */
export function analyticsConsentGranted() {
  return getConsent() === 'all';
}

function setConsent(value) {
  try { localStorage.setItem(KEY, value); } catch { /* mode privé : pas de persistance */ }
  // Permet à analytics.js (et autres) de réagir immédiatement.
  window.dispatchEvent(new CustomEvent('permigo:consent', { detail: value }));
}

const STYLE = `<style>
  .ck-banner {
    position: fixed;
    left: 50%; bottom: 0;
    transform: translateX(-50%) translateY(110%);
    width: min(520px, calc(100vw - 24px));
    margin-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: var(--su, #fff);
    border: 1px solid var(--bo);
    border-radius: 20px;
    box-shadow: 0 16px 48px -12px rgba(11,13,26,.28);
    padding: 18px 18px 16px;
    z-index: 9000;
    transition: transform .42s cubic-bezier(.22,1,.32,1);
    font-family: 'Inter', sans-serif;
  }
  .ck-banner.on { transform: translateX(-50%) translateY(0); }
  @media (prefers-reduced-motion: reduce) { .ck-banner { transition: none; } }
  .ck-ttl {
    font: 800 15px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); margin: 0 0 6px;
    display: flex; align-items: center; gap: 7px;
  }
  .ck-txt { font: 500 12.5px/1.55 'Inter', sans-serif; color: var(--mu, var(--mu3)); margin: 0 0 14px; }
  .ck-txt a { color: var(--a); text-decoration: underline; }
  .ck-row { display: flex; gap: 8px; }
  .ck-btn {
    flex: 1; padding: 12px 14px; border-radius: 12px;
    font: 700 13.5px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 46px; border: 1px solid transparent;
    transition: transform .12s, opacity .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ck-btn:active { transform: scale(.97); }
  .ck-btn-accept { background: linear-gradient(135deg, var(--a), var(--pu)); color: #fff; box-shadow: 0 6px 18px -6px rgba(99,102,241,.5); }
  .ck-btn-refuse { background: var(--bg); color: var(--mu, var(--mu4)); border-color: var(--bo); }
</style>`;

export function mountCookieBanner() {
  // Choix déjà fait → rien à afficher.
  if (getConsent()) return;
  if (document.getElementById('ck-banner-root')) return;

  const root = document.createElement('div');
  root.id = 'ck-banner-root';
  root.innerHTML = `${STYLE}
    <div class="ck-banner" role="dialog" aria-label="Préférences cookies" aria-live="polite">
      <div class="ck-ttl">🍪 Cookies & confidentialité</div>
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

  const banner = root.querySelector('.ck-banner');
  requestAnimationFrame(() => banner.classList.add('on'));

  const close = (value) => {
    setConsent(value);
    banner.classList.remove('on');
    const done = () => root.remove();
    banner.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 500); // fallback si transitionend ne se déclenche pas
  };

  root.querySelector('#ck-all').addEventListener('click', () => close('all'));
  root.querySelector('#ck-essential').addEventListener('click', () => close('essential'));
}
