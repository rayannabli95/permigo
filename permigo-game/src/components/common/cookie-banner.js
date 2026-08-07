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

import { pushIntroBlocker, popIntroBlocker } from "@/utils/intro-overlays.js";
import { getLang } from "@/utils/lang.js";

// i18n coque (EN/AR), repli FR.
const CK_I18N = {
  en: {
    aria: "Cookie preferences",
    title: "Cookies & privacy",
    txt: "We use the strict minimum to sign you in, plus audience measurement to improve the app and see where our visitors come from, including Facebook if you accept all. No ads inside the app.",
    privacy: "Privacy policy",
    essential: "Essential only",
    accept: "Accept all",
    txt_short: "Audience measurement to improve the app. No ads.",
    essential_short: "Refuse",
    accept_short: "Accept",
  },
  ar: {
    aria: "تفضيلات ملفات تعريف الارتباط",
    title: "ملفات تعريف الارتباط والخصوصية",
    txt: "نستخدم الحد الأدنى الضروري لتسجيل دخولك، إضافةً إلى قياس الجمهور لتحسين التطبيق ومعرفة مصدر زوّارنا، بما في ذلك فيسبوك إذا قبلت الكل. لا إعلانات داخل التطبيق.",
    privacy: "سياسة الخصوصية",
    essential: "الضروري فقط",
    accept: "قبول الكل",
    txt_short: "قياس الجمهور لتحسين التطبيق. بدون إعلانات.",
    essential_short: "رفض",
    accept_short: "قبول",
  },
};
function ckt(k, fr) {
  const l = getLang();
  return (l !== "fr" && CK_I18N[l]?.[k]) || fr;
}

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
function getConsent() {
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
  /* ⚠️ Bandeau COMPACT et TARDIF. Version précédente : un pavé de 4 lignes
     affiché à 800 ms qui couvrait le tiers bas d'un iPhone 13, donc le billet
     ET le bouton principal de la page de vente (mesuré le 01/08/2026). Le
     premier geste demandé au visiteur était un geste juridique. Aucun traceur
     non essentiel n'est posé avant le choix, donc le différer reste conforme. */
  .ck-banner {
    position: fixed;
    left: 50%; bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    /* +100px pour dégager entièrement l'écran même quand le bandeau est levé
       au-dessus de la barre de nav (cf. body.has-chrome ci-dessous). */
    transform: translateX(-50%) translateY(calc(100% + 100px));
    width: min(520px, calc(100vw - 24px));
    background: var(--su, #fff);
    border: 1px solid var(--bo);
    border-radius: 16px;
    box-shadow: 0 16px 48px -12px rgba(11,13,26,.28);
    padding: 10px 12px;
    z-index: 9000;
    transition: transform .42s cubic-bezier(.22,1,.32,1);
    font-family: 'Archivo', sans-serif;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  /* Dans l'app (chrome monté), le bandeau se pose AU-DESSUS de la barre de nav
     (~60px) au lieu de la recouvrir → les onglets restent tappables. Et pendant
     qu'il est ouvert, on réserve l'espace bas sur #app pour que les CTA de bas
     de page (ex. « Ton centre d'examen » sur Réviser) ne soient plus masqués. */
  body.has-chrome .ck-banner { bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
  body.ck-open.has-chrome #app { padding-bottom: calc(130px + env(safe-area-inset-bottom, 0px)); }
  .ck-banner.on { transform: translateX(-50%) translateY(0); }
  @media (prefers-reduced-motion: reduce) { .ck-banner { transition: none; } }
  .ck-txt {
    flex: 1 1 190px; min-width: 0;
    font: 500 12px/1.4 'Archivo', sans-serif; color: var(--ink); margin: 0;
  }
  .ck-txt a { color: var(--ink, var(--a-ink)); text-decoration: underline; }
  .ck-row { display: flex; gap: 8px; flex: 0 1 auto; }
  .ck-btn {
    padding: 10px 14px; border-radius: 12px; white-space: nowrap;
    font: 700 13px/1 'Archivo', sans-serif;
    cursor: pointer; min-height: 44px; border: 1px solid transparent;
    transition: transform .12s, opacity .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .ck-btn:active { transform: scale(.97); }
  /* Violet PermiGo en dur, PAS var(--a) : l'accent par défaut ne portait le
     blanc qu'à 4,32 quand l'AA en demande 4,5, et surtout var(--a) est
     PERSONNALISABLE — en vert ou en cyan, --a-ink est un encre FONCÉE qui
     s'effondre sur ce fond. Ce bandeau s'affiche de toute façon à un visiteur
     qui n'a encore choisi aucune couleur. Contraste ici : 7,38. */
  .ck-btn-accept { background: #4a3fc9; color: #fff; box-shadow: 0 6px 18px -6px rgba(74,63,201,.5); }
  .ck-btn-refuse { background: var(--bg); color: var(--ink, #1e293b); border-color: var(--bo); }
</style>`;

// ⚠️ Le premier geste d'un nouvel élève ne doit jamais être un choix
// juridique. Deux zones sont donc BLOQUÉES pour l'affichage (le choix reste
// demandé, juste pas au milieu de la création de compte) :
//  - l'inscription (#/rejoindre, 4 écrans mascotte) → détecté par hash, dispo
//    synchrone dès le chargement de la page ;
//  - l'onboarding qui suit (mur posé par accessGateFor pour un élève tout
//    neuf) → connu seulement une fois `boot()` résolu (async), donc signalé
//    depuis main.js via `setCookieBannerBlocked(true)`.
// Dans les deux cas rien n'est tracké avant le choix de toute façon
// (analytics/pixel attendent déjà `permigo:consent`) : différer l'AFFICHAGE
// reste conforme, comme documenté plus haut pour le délai de 4 s.
function isBlockedRoute() {
  return location.hash.startsWith("#/rejoindre");
}
let gateBlocked = false;

/** @param {boolean} v — posé par main.js pendant un mur d'accès (onboarding élève neuf) */
export function setCookieBannerBlocked(v) {
  gateBlocked = !!v;
  if (!gateBlocked) _retryPendingShow();
}
let _retryPendingShow = () => {};

export function mountCookieBanner() {
  // Choix déjà fait → rien à afficher.
  if (getConsent()) return;
  if (document.getElementById("ck-banner-root")) return;

  const root = document.createElement("div");
  root.id = "ck-banner-root";
  root.innerHTML = `${STYLE}
    <div class="ck-banner" role="dialog" aria-label="${ckt("aria", "Préférences cookies")}" aria-live="polite" dir="${getLang() === "ar" ? "rtl" : "ltr"}">
      <p class="ck-txt">
        ${ckt("txt_short", "Mesure d\u0027audience pour améliorer l\u0027app. Aucune publicité.")}
        <a href="#/legal/privacy">${ckt("privacy", "Politique de confidentialité")}</a>
      </p>
      <div class="ck-row">
        <button class="ck-btn ck-btn-refuse" id="ck-essential" type="button">${ckt("essential_short", "Refuser")}</button>
        <button class="ck-btn ck-btn-accept" id="ck-all" type="button">${ckt("accept_short", "Accepter")}</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  // Tant que la question cookies n'a pas de réponse, le tuto guidé attend
  // (canal « bloqueur » : le garde-fou 8 s des popups ne s'applique pas).
  pushIntroBlocker();

  const banner = root.querySelector(".ck-banner");
  // Apparition DIFFEREE : 4 secondes, ou au premier scroll si le visiteur bouge
  // avant. Les 3 premieres secondes appartiennent a l'offre, pas au juridique.
  // Rien n'est pose entre-temps (l'analytics attend deja le choix) donc differer
  // reste conforme : c'est l'AFFICHAGE qu'on retarde, pas le consentement.
  let shown = false;
  let timer = 0;
  // Hauteur réellement occupée en bas de l'écran, publiée en variable CSS.
  // Les barres collantes des pages publiques (la page de vente en a une, avec
  // le compte gratuit dedans) s'en servent pour se poser AU-DESSUS du bandeau.
  // Sans ça, le bandeau les recouvrait purement et simplement : mesuré le
  // 01/08/2026 sur www.permigo.fr, le bouton du compte gratuit n'était pas
  // cliquable tant que le visiteur n'avait pas répondu.
  // ⚠️ offsetHeight et PAS getBoundingClientRect().top : au moment où on
  // mesure, le bandeau est encore translaté hors de l'écran par sa transition
  // d'entrée, donc son « top » vaut plus que la hauteur de la fenêtre et la
  // mesure tombait à 0. La hauteur, elle, est juste tout de suite.
  // Ce qu'on publie est la hauteur SEULE ; le décalage bas (12 px + zone sûre)
  // est ajouté côté CSS, là où env() est disponible.
  const mesurer = () => {
    try {
      const h = banner.offsetHeight;
      if (h > 0) document.body.style.setProperty("--ck-h", h + "px");
    } catch {
      /* pas de mesure possible → le repli CSS prend le relais */
    }
  };

  const show = () => {
    if (shown) return;
    // Inscription/onboarding en cours → on retente dès que le blocage tombe
    // (hashchange hors #/rejoindre, ou setCookieBannerBlocked(false)) au lieu
    // d'afficher le bandeau par-dessus le formulaire de création de compte.
    if (isBlockedRoute() || gateBlocked) return;
    shown = true;
    clearTimeout(timer);
    // La réserve d'espace bas n'est posée qu'AVEC le bandeau : sinon l'app
    // gardait un vide de 130 px pendant les 4 secondes d'attente.
    document.body.classList.add("ck-open");
    window.removeEventListener("scroll", show);
    window.removeEventListener("touchmove", show);
    window.removeEventListener("hashchange", retryShow);
    requestAnimationFrame(() => {
      banner.classList.add("on");
      mesurer();
    });
    window.addEventListener("resize", mesurer, { passive: true });
  };
  const retryShow = () => show();
  _retryPendingShow = retryShow;
  timer = setTimeout(show, 4000);
  window.addEventListener("scroll", show, { passive: true });
  window.addEventListener("touchmove", show, { passive: true });
  window.addEventListener("hashchange", retryShow);

  const close = (value) => {
    setConsent(value);
    banner.classList.remove("on");
    document.body.classList.remove("ck-open");
    document.body.style.removeProperty("--ck-h");
    window.removeEventListener("resize", mesurer);
    popIntroBlocker(); // consentement répondu → le tuto peut démarrer
    const done = () => root.remove();
    banner.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 500); // fallback si transitionend ne se déclenche pas
  };

  root.querySelector("#ck-all").addEventListener("click", () => close("all"));
  root
    .querySelector("#ck-essential")
    .addEventListener("click", () => close("essential"));
}
