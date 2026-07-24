// ═══════════════════════════════════════════════════════════════
// Nudge "Installe PermiGo" — relance automatique post-login.
// L'écran d'inscription (add-to-home.js) ne touche que les nouveaux
// inscrits ; ce nudge rattrape tous les autres : à l'ouverture de
// l'app dans un navigateur mobile (pas standalone), une bottom-sheet
// propose l'installation. Plateforme détectée AUTOMATIQUEMENT :
//   - Android + beforeinstallprompt → install natif en 1 tap
//   - Android sans prompt → marche à suivre menu Chrome
//   - iOS → marche à suivre Safari (aucune API d'install sur iOS)
// Snooze 3 jours sur "Plus tard" / fermeture, opt-out définitif dispo.
//
// Usage (main.js, après le mount du chrome) : maybeShowInstallNudge(me)
// ═══════════════════════════════════════════════════════════════
import {
  isStandalone,
  guessPlatform,
  canPromptInstall,
  promptInstall,
  installBlockedReason,
} from "@/utils/pwa.js";
import { track } from "@/services/analytics.js";
import { a2hsStepsHTML, A2HS_STYLE } from "@/components/common/a2hs-steps.js";
import { notifyPopupOpen, notifyPopupSettled } from "@/utils/intro-overlays.js";
import { getLang } from "@/utils/lang.js";

// ── i18n de la COQUE (élève non-francophone) — dict local (règle coque),
// repli FR. Composant commun (tous rôles) : le tu/vous FR reste piloté par
// `tu` ; en/ar n'ont qu'une seule forme (pas de distinction tu/vous).
const INN_I18N = {
  en: {
    title: "Add PermiGo to your Home Screen",
    sub: "Open the app in one tap, keep your streak 🔥 and get your reminders.",
    close: "Close",
    install: "Install the app in 1 tap",
    installing: "Installing…",
    later: "Later",
    never: "Don't ask me again",
    ios_browser_title: "Open PermiGo in Safari",
    browser_title: "Open PermiGo in your browser",
    ios_browser_why:
      "On iPhone, adding to the Home Screen only works in Safari.",
    browser_why:
      "You're inside another app's browser. Open this page in your real browser to install PermiGo.",
    ios_step:
      "Paste the link in <b>Safari</b>, then add it to your Home Screen.",
    step: "Tap the <b>⋯</b> menu, then <b>“Open in browser”</b>.",
    copy: "Copy the link",
    copied: "Link copied ✓",
    select: "Select the link below",
  },
  ar: {
    title: "أضف PermiGo إلى شاشتك الرئيسية",
    sub: "افتح التطبيق بلمسة واحدة، وحافظ على سلسلتك 🔥 واستلم تذكيراتك.",
    close: "إغلاق",
    install: "ثبّت التطبيق بلمسة واحدة",
    installing: "جارٍ التثبيت…",
    later: "لاحقًا",
    never: "لا تعرض علي هذا مجددًا",
    ios_browser_title: "افتح PermiGo في Safari",
    browser_title: "افتح PermiGo في متصفحك",
    ios_browser_why:
      "على الآيفون، الإضافة إلى الشاشة الرئيسية تعمل فقط في Safari.",
    browser_why:
      "أنت داخل متصفح تطبيق آخر. افتح هذه الصفحة في متصفحك الحقيقي لتثبيت PermiGo.",
    ios_step: "الصق الرابط في <b>Safari</b>، ثم أضِفه إلى الشاشة الرئيسية.",
    step: "اضغط على القائمة <b>⋯</b>، ثم <b>«فتح في المتصفح»</b>.",
    copy: "انسخ الرابط",
    copied: "تم نسخ الرابط ✓",
    select: "حدّد الرابط أدناه",
  },
};
function it(key, fr) {
  const l = getLang();
  return (l !== "fr" && INN_I18N[l]?.[key]) || fr;
}

const BADGE = "/skins/avatars/permigo-badge-icon.png";
const LS_NEXT = "permigo-a2hs-next"; // timestamp avant lequel on se tait
const LS_OFF = "permigo-a2hs-off"; // "1" = ne plus jamais proposer
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours
const FIRST_DELAY_MS = 1800; // laisse la page respirer avant la sheet
const LS_VM_NEXT = "permigo-a2hs-vm-next"; // cadence des prompts « moment de valeur »
const VM_SNOOZE_MS = 24 * 60 * 60 * 1000; // 1 prompt valeur / 24 h max

const STYLE = `<style id="inn-style">
${A2HS_STYLE}
.inn-bg {
  position: fixed; inset: 0; z-index: 319;
  background: rgba(11,13,26,.45);
  backdrop-filter: blur(3px);
  opacity: 0; transition: opacity .28s ease;
}
.inn-bg.on { opacity: 1; }
.inn {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 320;
  max-width: 480px; margin: 0 auto;
  background: var(--su); color: var(--ink);
  border-radius: 22px 22px 0 0;
  border-top: 1px solid var(--bo);
  box-shadow: var(--s3);
  padding: 10px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  font-family: 'Inter', sans-serif;
  transform: translateY(105%);
  transition: transform .34s cubic-bezier(.32,.72,0,1);
}
.inn.on { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .inn, .inn-bg { transition: none; }
}
.inn-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--bo); margin: 0 auto 14px; }
.inn-hd { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.inn-badge { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0;
             filter: drop-shadow(0 6px 14px color-mix(in srgb, var(--a) 35%, transparent)); }
.inn-title { font: 800 17px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.inn-sub { font: 500 12.5px/1.45 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }
.inn-close { margin-left: auto; align-self: flex-start; width: 44px; height: 44px; flex-shrink: 0;
             border: 0; border-radius: 50%; background: var(--bg2); color: var(--mu);
             font-size: 18px; line-height: 1; cursor: pointer;
             display: flex; align-items: center; justify-content: center; }
.inn-steps { margin-bottom: 14px; }
.inn-install { width: 100%; min-height: 50px; border: 0; border-radius: 14px;
               background: linear-gradient(to bottom, var(--a-lt), var(--a) 55%, var(--adk));
               color: var(--a-ink); font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
               cursor: pointer; margin-bottom: 10px;
               box-shadow: 0 6px 16px -4px color-mix(in srgb, var(--a) 55%, transparent);
               -webkit-tap-highlight-color: transparent; }
.inn-install:active { transform: scale(.98); }
.inn-install:disabled { opacity: .6; }
.inn-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.inn-later { flex: 1; min-height: 44px; border: 0; border-radius: 12px; background: var(--bg2);
             color: var(--mu); font: 700 13px/1 'Inter', sans-serif; cursor: pointer; }
.inn-never { background: none; border: 0; min-height: 44px; padding: 0 8px; color: var(--mu2);
             font: 600 11.5px/1 'Inter', sans-serif; text-decoration: underline; cursor: pointer; }
.inn-close:focus-visible, .inn-install:focus-visible,
.inn-later:focus-visible, .inn-never:focus-visible {
  outline: 3px solid var(--a); outline-offset: 2px;
}
</style>`;

function snooze() {
  try {
    localStorage.setItem(LS_NEXT, String(Date.now() + SNOOZE_MS));
  } catch {
    /* localStorage indisponible → on retentera, pas grave */
  }
}

function shouldShow() {
  if (isStandalone()) return false; // déjà installée
  if (guessPlatform() === "other") return false; // desktop : pas pertinent
  try {
    if (localStorage.getItem(LS_OFF) === "1") return false;
    const next = parseInt(localStorage.getItem(LS_NEXT) || "0", 10);
    if (Date.now() < next) return false;
  } catch {
    /* sans localStorage on affiche (au pire un peu trop souvent) */
  }
  return true;
}

/**
 * Affiche la bottom-sheet d'install si les conditions sont réunies.
 * @param {object} me — user courant (le ton suit le rôle : tutoiement élève)
 */
export function maybeShowInstallNudge(me) {
  if (!shouldShow()) {
    notifyPopupSettled();
    return;
  }

  // Le tuto guidé attend déjà ce popup (intro-overlays) → priorité au popup,
  // une seule couche à la fois. On gère juste le bandeau cookies : une seule
  // demande à la fois, donc cookies d'abord puis installation.
  if (document.querySelector(".ck-banner")) {
    window.addEventListener(
      "permigo:consent",
      () =>
        setTimeout(() => (shouldShow() ? show(me) : notifyPopupSettled()), 900),
      { once: true },
    );
    return;
  }

  setTimeout(() => {
    // Re-check : l'install a pu se faire entre-temps (event natif Chrome)
    if (!shouldShow()) {
      notifyPopupSettled();
      return;
    }
    show(me);
  }, FIRST_DELAY_MS);
}

// Ouvre la sheet d'install à la demande (entrée permanente Réglages) — ignore
// le snooze, mais reste no-op si déjà installée. Route vers « ouvre dans ton
// navigateur » si le contexte ne permet pas l'A2HS.
export function openInstallSheet(me) {
  if (isStandalone()) return;
  if (document.querySelector(".inn")) return; // déjà ouverte
  show(me);
}

// Déclencheur « moment de valeur » : à appeler après une VRAIE victoire (séance
// validée, quiz réussi, palier…). Convertit bien mieux qu'un prompt froid au
// boot. Cadence propre (1/24 h), respecte l'opt-out définitif, jamais sur
// desktop ni si déjà installée. Bypasse le snooze de boot (le moment est meilleur).
export function promptInstallAtValueMoment(me, reason) {
  if (isStandalone()) return;
  if (guessPlatform() === "other") return; // desktop : non pertinent
  if (document.querySelector(".inn")) return; // une sheet est déjà à l'écran
  try {
    if (localStorage.getItem(LS_OFF) === "1") return; // opt-out respecté
    if (Date.now() < parseInt(localStorage.getItem(LS_VM_NEXT) || "0", 10))
      return;
    localStorage.setItem(LS_VM_NEXT, String(Date.now() + VM_SNOOZE_MS));
  } catch {
    /* sans localStorage : on tente une fois */
  }
  track("a2hs.value_moment", { reason, role: me?.role });
  // Laisse la victoire (toast/anim de succès) respirer avant la sheet.
  setTimeout(() => {
    if (!isStandalone() && !document.querySelector(".inn")) show(me);
  }, 1400);
}

function show(me) {
  // Contexte où l'A2HS est IMPOSSIBLE (webview Insta/FB/TikTok…, ou iPhone hors
  // Safari) → on ne montre pas des étapes qui ne marcheront pas : on guide vers
  // le vrai navigateur. C'est LE tunnel qui sauve les ouvertures de liens
  // partagés (Le Bon Coin, DM, réseaux).
  const blocked = installBlockedReason();
  if (blocked) {
    showOpenInBrowser(me, blocked);
    return;
  }

  const platform = guessPlatform(); // 'ios' | 'android' (jamais 'other' ici)
  const tu = me?.role === "eleve";
  const native = platform === "android" && canPromptInstall();

  track("a2hs.nudge_shown", { platform, native, role: me?.role });

  const title = it(
    "title",
    tu
      ? "Mets PermiGo sur ton écran d'accueil"
      : "Mettez PermiGo sur votre écran d'accueil",
  );
  const sub = it(
    "sub",
    tu
      ? "Ouvre l'app d'un geste, garde ta série 🔥 et reçois tes rappels."
      : "Vos validations à confirmer en 1 tap — comme une vraie app, sans store.",
  );

  const host = document.createElement("div");
  host.innerHTML = `${STYLE}
    <div class="inn-bg" id="inn-bg"></div>
    <div class="inn" role="dialog" aria-modal="true" aria-labelledby="inn-title">
      <div class="inn-handle" aria-hidden="true"></div>
      <div class="inn-hd">
        <img class="inn-badge" src="${BADGE}" alt="" aria-hidden="true"/>
        <div>
          <div class="inn-title" id="inn-title">${title}</div>
          <div class="inn-sub">${sub}</div>
        </div>
        <button class="inn-close" id="inn-close" type="button" aria-label="${it("close", "Fermer")}">×</button>
      </div>
      ${
        native
          ? `<button class="inn-install" id="inn-install" type="button">${it("install", "Installer l'app en 1 tap")}</button>`
          : `<div class="inn-steps">${a2hsStepsHTML(platform)}</div>`
      }
      <div class="inn-row">
        <button class="inn-later" id="inn-later" type="button">${it("later", "Plus tard")}</button>
        <button class="inn-never" id="inn-never" type="button">${it("never", "Ne plus me le proposer")}</button>
      </div>
    </div>`;
  document.body.appendChild(host);
  notifyPopupOpen(); // le tuto guidé attend que cette sheet soit fermée

  const sheet = host.querySelector(".inn");
  const bg = host.querySelector("#inn-bg");
  requestAnimationFrame(() => {
    sheet.classList.add("on");
    bg.classList.add("on");
  });

  const close = (reason) => {
    track("a2hs.nudge_closed", { reason });
    notifyPopupSettled(); // libère le tuto guidé
    if (reason === "never") {
      try {
        localStorage.setItem(LS_OFF, "1");
      } catch {
        /* tant pis */
      }
    } else if (reason !== "installed") {
      snooze();
    }
    sheet.classList.remove("on");
    bg.classList.remove("on");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => host.remove(), 380);
  };

  const onKey = (e) => {
    if (e.key === "Escape") close("esc");
  };
  document.addEventListener("keydown", onKey);

  bg.addEventListener("click", () => close("backdrop"));
  host.querySelector("#inn-close").addEventListener("click", () => close("x"));
  host
    .querySelector("#inn-later")
    .addEventListener("click", () => close("later"));
  host
    .querySelector("#inn-never")
    .addEventListener("click", () => close("never"));

  host.querySelector("#inn-install")?.addEventListener("click", async () => {
    const btn = host.querySelector("#inn-install");
    btn.disabled = true;
    btn.textContent = it("installing", "Installation…");
    const outcome = await promptInstall();
    track("a2hs.nudge_install", { outcome });
    if (outcome === "accepted") {
      try {
        localStorage.setItem(LS_OFF, "1"); // installée → plus jamais de nudge
      } catch {
        /* tant pis */
      }
      close("installed");
      return;
    }
    // Refusé / indispo → on montre la marche à suivre manuelle à la place
    btn.outerHTML = `<div class="inn-steps">${a2hsStepsHTML("android")}</div>`;
  });

  requestAnimationFrame(() => host.querySelector("#inn-close")?.focus());
}

// ─── Variante « ouvre dans le vrai navigateur » ───────────────────
// Affichée quand l'A2HS est IMPOSSIBLE dans le contexte (webview d'une autre
// app, ou iPhone hors Safari). On explique comment rejoindre le navigateur et
// on copie le lien pour un collage en 1 geste. Sans ça, ces utilisateurs
// (liens partagés via Le Bon Coin / DM / réseaux) sont perdus à 100 %.
function showOpenInBrowser(me, reason) {
  const tu = me?.role === "eleve";
  track("a2hs.open_in_browser_shown", { reason, role: me?.role });

  const title =
    reason === "ios-browser"
      ? it(
          "ios_browser_title",
          tu ? "Ouvre PermiGo dans Safari" : "Ouvrez PermiGo dans Safari",
        )
      : it(
          "browser_title",
          tu
            ? "Ouvre PermiGo dans ton navigateur"
            : "Ouvrez PermiGo dans votre navigateur",
        );
  const why =
    reason === "ios-browser"
      ? it(
          "ios_browser_why",
          "Sur iPhone, l'ajout à l'écran d'accueil ne marche que dans Safari.",
        )
      : it(
          "browser_why",
          "Tu es dans le navigateur d'une autre app. Ouvre la page dans ton vrai navigateur pour installer PermiGo.",
        );
  const stepIco =
    reason === "ios-browser"
      ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>`
      : `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;
  const stepTxt =
    reason === "ios-browser"
      ? it(
          "ios_step",
          `Colle le lien dans <b>Safari</b>, puis ajoute-le à l'écran d'accueil.`,
        )
      : it(
          "step",
          `Touche le menu <b>⋯</b>, puis <b>« Ouvrir dans le navigateur »</b>.`,
        );

  const host = document.createElement("div");
  host.innerHTML = `${STYLE}
    <style>
      .inn-oib-step { display:flex; align-items:center; gap:11px; font:600 14px/1.4 'Inter',sans-serif; color:var(--ink); background:var(--bg2); border:1px solid var(--bo2); border-radius:14px; padding:13px 14px; margin:2px 0 12px; }
      .inn-oib-ico { flex-shrink:0; display:flex; color:var(--a-txt); }
      .inn-oib-url { width:100%; box-sizing:border-box; font:600 12.5px/1.3 'IBM Plex Mono',monospace; color:var(--mu); background:var(--bg2); border:1px solid var(--bo); border-radius:10px; padding:10px 12px; margin-top:10px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    </style>
    <div class="inn-bg" id="inn-bg"></div>
    <div class="inn" role="dialog" aria-modal="true" aria-labelledby="inn-title">
      <div class="inn-handle" aria-hidden="true"></div>
      <div class="inn-hd">
        <img class="inn-badge" src="${BADGE}" alt="" aria-hidden="true"/>
        <div>
          <div class="inn-title" id="inn-title">${title}</div>
          <div class="inn-sub">${why}</div>
        </div>
        <button class="inn-close" id="inn-close" type="button" aria-label="${it("close", "Fermer")}">×</button>
      </div>
      <div class="inn-oib-step"><span class="inn-oib-ico">${stepIco}</span><span>${stepTxt}</span></div>
      <button class="inn-install" id="inn-copy" type="button">${it("copy", "Copier le lien")}</button>
      <div class="inn-oib-url" id="inn-url"></div>
      <div class="inn-row">
        <button class="inn-later" id="inn-later" type="button">${it("later", "Plus tard")}</button>
      </div>
    </div>`;
  document.body.appendChild(host);
  notifyPopupOpen(); // le tuto guidé attend que cette sheet soit fermée

  // URL en textContent (jamais en innerHTML) → zéro risque XSS.
  host.querySelector("#inn-url").textContent = location.href;

  const sheet = host.querySelector(".inn");
  const bg = host.querySelector("#inn-bg");
  requestAnimationFrame(() => {
    sheet.classList.add("on");
    bg.classList.add("on");
  });

  const close = (r) => {
    track("a2hs.open_in_browser_closed", { reason, how: r });
    notifyPopupSettled();
    if (r !== "copied") snooze();
    sheet.classList.remove("on");
    bg.classList.remove("on");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => host.remove(), 380);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close("esc");
  };
  document.addEventListener("keydown", onKey);

  bg.addEventListener("click", () => close("backdrop"));
  host.querySelector("#inn-close").addEventListener("click", () => close("x"));
  host
    .querySelector("#inn-later")
    .addEventListener("click", () => close("later"));

  const copyBtn = host.querySelector("#inn-copy");
  copyBtn.addEventListener("click", async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(location.href);
      ok = true;
    } catch {
      ok = false;
    }
    track("a2hs.open_in_browser_copy", { reason, ok });
    copyBtn.textContent = ok
      ? it("copied", "Lien copié ✓")
      : it("select", "Sélectionne le lien ci-dessous");
    // On laisse la sheet ouverte : l'utilisateur va coller dans son navigateur.
  });

  requestAnimationFrame(() => host.querySelector("#inn-copy")?.focus());
}
