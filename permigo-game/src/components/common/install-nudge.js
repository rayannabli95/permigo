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
} from "@/utils/pwa.js";
import { track } from "@/services/analytics.js";

const BADGE = "/skins/avatars/permigo-badge-icon.png";
const LS_NEXT = "permigo-a2hs-next"; // timestamp avant lequel on se tait
const LS_OFF = "permigo-a2hs-off"; // "1" = ne plus jamais proposer
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 jours
const FIRST_DELAY_MS = 1800; // laisse la page respirer avant la sheet

const SHARE_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>`;
const DOTS_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;

const STYLE = `<style id="inn-style">
.inn-bg {
  position: fixed; inset: 0; z-index: 240;
  background: rgba(11,13,26,.45);
  backdrop-filter: blur(3px);
  opacity: 0; transition: opacity .28s ease;
}
.inn-bg.on { opacity: 1; }
.inn {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 241;
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
.inn-steps { background: var(--bg2); border-radius: 14px; padding: 4px 14px; margin-bottom: 14px; }
.inn-step { display: flex; gap: 11px; align-items: flex-start; padding: 10px 0; }
.inn-step + .inn-step { border-top: 1px solid var(--bo2); }
.inn-num { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 50%;
           background: var(--a); color: var(--a-ink); font: 800 12px/22px 'Inter', sans-serif; text-align: center; }
.inn-step-txt { font: 500 13px/1.45 'Inter', sans-serif; color: var(--ink); padding-top: 2px; }
.inn-glyph { display: inline-flex; vertical-align: -4px; margin: 0 2px; padding: 2px;
             border-radius: 6px; background: var(--su); color: var(--a-txt); border: 1px solid var(--bo); }
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

function stepsHtml(platform) {
  if (platform === "ios") {
    return `
      <div class="inn-step"><div class="inn-num">1</div><div class="inn-step-txt">Dans <strong>Safari</strong>, touche Partager <span class="inn-glyph">${SHARE_SVG}</span> en bas de l'écran.</div></div>
      <div class="inn-step"><div class="inn-num">2</div><div class="inn-step-txt">Choisis <strong>« Sur l'écran d'accueil »</strong>, puis <strong>« Ajouter »</strong>.</div></div>`;
  }
  return `
      <div class="inn-step"><div class="inn-num">1</div><div class="inn-step-txt">Dans <strong>Chrome</strong>, touche le menu <span class="inn-glyph">${DOTS_SVG}</span> en haut à droite.</div></div>
      <div class="inn-step"><div class="inn-num">2</div><div class="inn-step-txt">Choisis <strong>« Ajouter à l'écran d'accueil »</strong>, puis confirme.</div></div>`;
}

/**
 * Affiche la bottom-sheet d'install si les conditions sont réunies.
 * @param {object} me — user courant (le ton suit le rôle : tutoiement élève)
 */
export function maybeShowInstallNudge(me) {
  if (!shouldShow()) return;

  setTimeout(() => {
    // Re-check : l'install a pu se faire entre-temps (event natif Chrome)
    if (!shouldShow()) return;
    show(me);
  }, FIRST_DELAY_MS);
}

function show(me) {
  const platform = guessPlatform(); // 'ios' | 'android' (jamais 'other' ici)
  const tu = me?.role === "eleve";
  const native = platform === "android" && canPromptInstall();

  track("a2hs.nudge_shown", { platform, native, role: me?.role });

  const host = document.createElement("div");
  host.innerHTML = `${STYLE}
    <div class="inn-bg" id="inn-bg"></div>
    <div class="inn" role="dialog" aria-modal="true" aria-labelledby="inn-title">
      <div class="inn-handle" aria-hidden="true"></div>
      <div class="inn-hd">
        <img class="inn-badge" src="${BADGE}" alt="" aria-hidden="true"/>
        <div>
          <div class="inn-title" id="inn-title">${tu ? "Installe PermiGo sur ton téléphone" : "Installez PermiGo sur votre téléphone"}</div>
          <div class="inn-sub">${tu ? "Ouvre l'app en 1 tap depuis ton écran d'accueil." : "Ouvrez l'app en 1 tap depuis votre écran d'accueil."}</div>
        </div>
        <button class="inn-close" id="inn-close" type="button" aria-label="Fermer">×</button>
      </div>
      ${
        native
          ? `<button class="inn-install" id="inn-install" type="button">Installer l'app en 1 tap</button>`
          : `<div class="inn-steps">${stepsHtml(platform)}</div>`
      }
      <div class="inn-row">
        <button class="inn-later" id="inn-later" type="button">Plus tard</button>
        <button class="inn-never" id="inn-never" type="button">Ne plus me le proposer</button>
      </div>
    </div>`;
  document.body.appendChild(host);

  const sheet = host.querySelector(".inn");
  const bg = host.querySelector("#inn-bg");
  requestAnimationFrame(() => {
    sheet.classList.add("on");
    bg.classList.add("on");
  });

  const close = (reason) => {
    track("a2hs.nudge_closed", { reason });
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
    btn.textContent = "Installation…";
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
    btn.outerHTML = `<div class="inn-steps">${stepsHtml("android")}</div>`;
  });

  requestAnimationFrame(() => host.querySelector("#inn-close")?.focus());
}
