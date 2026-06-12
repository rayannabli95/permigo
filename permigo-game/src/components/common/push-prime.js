// ═══════════════════════════════════════════════════════════════
// Push Prime — LE chaînon manquant de la boucle d'engagement.
// Sur iOS, l'API Notification n'existe QUE dans la PWA installée :
// l'opt-in de l'onboarding est donc invisible pour un élève Safari,
// et le localStorage standalone est NEUF (stockage séparé de Safari)
// → sans ce primer, personne ne nous demande jamais la permission.
//
// Affiché au lancement en mode installé (standalone) si la permission
// est encore 'default'. Une bottom-sheet, un tap, c'est réglé.
// Snooze 2 jours sur « Plus tard » ; s'éteint seul une fois la
// permission accordée ou refusée (elle n'est plus 'default').
//
// Usage (main.js, après le chrome) : maybeShowPushPrime(me)
// ═══════════════════════════════════════════════════════════════
import { isStandalone } from "@/utils/pwa.js";
import { requestPushPermission } from "@/services/web-push.js";
import { track } from "@/services/analytics.js";
import { icon } from "@/utils/icons.js";

const LS_NEXT = "permigo-push-prime-next";
const SNOOZE_MS = 2 * 24 * 60 * 60 * 1000; // 2 jours
const SHOW_DELAY_MS = 1200;

const STYLE = `<style id="ppr-style">
.ppr-bg {
  position: fixed; inset: 0; z-index: 240;
  background: rgba(11,13,26,.45); backdrop-filter: blur(3px);
  opacity: 0; transition: opacity .28s ease;
}
.ppr-bg.on { opacity: 1; }
.ppr {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 241;
  max-width: 480px; margin: 0 auto;
  background: var(--su); color: var(--ink);
  border-radius: 22px 22px 0 0; border-top: 1px solid var(--bo);
  box-shadow: var(--s3);
  padding: 10px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  font-family: 'Inter', sans-serif;
  transform: translateY(105%);
  transition: transform .34s cubic-bezier(.32,.72,0,1);
}
.ppr.on { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .ppr, .ppr-bg { transition: none; } }
.ppr-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--bo); margin: 0 auto 16px; }
.ppr-bell {
  width: 64px; height: 64px; margin: 0 auto 12px; border-radius: 50%;
  background: color-mix(in srgb, var(--a) 14%, transparent);
  color: var(--a-txt);
  display: flex; align-items: center; justify-content: center;
  animation: pprRing 2.2s ease-in-out .6s infinite; transform-origin: 50% 10%;
}
@keyframes pprRing {
  0%, 64%, 100% { rotate: 0deg; }
  68% { rotate: 11deg; } 72% { rotate: -9deg; }
  76% { rotate: 6deg; } 80% { rotate: -4deg; } 84% { rotate: 1deg; }
}
@media (prefers-reduced-motion: reduce) { .ppr-bell { animation: none; } }
.ppr-title { font: 800 19px/1.25 'Plus Jakarta Sans', sans-serif; text-align: center; letter-spacing: -.015em; }
.ppr-sub { font: 500 13.5px/1.45 'Inter', sans-serif; color: var(--mu2); text-align: center; margin: 5px 0 16px; }
.ppr-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.ppr-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg2); border-radius: 13px; padding: 11px 14px;
  font: 600 14px/1.3 'Inter', sans-serif; color: var(--ink);
}
.ppr-row-ico { flex-shrink: 0; display: flex; color: var(--a-txt); }
.ppr-cta {
  width: 100%; min-height: 52px; border: 0; border-radius: 14px;
  background: linear-gradient(to bottom, var(--a-lt), var(--a) 55%, var(--adk));
  color: var(--a-ink); font: 800 15.5px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; margin-bottom: 8px;
  box-shadow: 0 6px 16px -4px color-mix(in srgb, var(--a) 55%, transparent);
  -webkit-tap-highlight-color: transparent;
}
.ppr-cta:active { transform: scale(.98); }
.ppr-cta:disabled { opacity: .6; }
.ppr-later {
  width: 100%; min-height: 44px; border: 0; border-radius: 12px;
  background: none; color: var(--mu); font: 700 13.5px/1 'Inter', sans-serif; cursor: pointer;
}
.ppr-cta:focus-visible, .ppr-later:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; }
</style>`;

function shouldShow() {
  if (!isStandalone()) return false; // navigateur → c'est l'install-nudge qui joue
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    return false;
  if (Notification.permission !== "default") return false; // déjà tranché
  try {
    if (localStorage.getItem("permigo_push_optout") === "1") return false;
    const next = parseInt(localStorage.getItem(LS_NEXT) || "0", 10);
    if (Date.now() < next) return false;
  } catch {
    /* sans localStorage : on tente, au pire un peu trop souvent */
  }
  return true;
}

/** Affiche la sheet d'activation des rappels si pertinent (PWA installée). */
export function maybeShowPushPrime(me) {
  if (!shouldShow()) return;
  // Premier lancement standalone = storage neuf (iOS) → le bandeau cookies
  // peut être à l'écran en même temps. Une seule demande à la fois :
  // cookies d'abord, rappels juste après le choix.
  const cookieBannerUp = document.querySelector(".ck-banner");
  if (cookieBannerUp) {
    window.addEventListener(
      "permigo:consent",
      () => setTimeout(() => shouldShow() && show(me), 800),
      { once: true },
    );
    return;
  }
  setTimeout(() => {
    if (!shouldShow()) return;
    show(me);
  }, SHOW_DELAY_MS);
}

function show(me) {
  const tu = me?.role === "eleve";
  track("push_prime.shown", { role: me?.role });

  const rows = tu
    ? [
        ["sun", "Ta question du jour"],
        ["flame", "Ta série, avant qu'elle saute"],
        ["check-circle", "Quand ton moniteur te valide"],
      ]
    : [
        ["bell", "Les validations à confirmer"],
        ["users", "L'activité de vos élèves"],
      ];

  const host = document.createElement("div");
  host.innerHTML = `${STYLE}
    <div class="ppr-bg" id="ppr-bg"></div>
    <div class="ppr" role="dialog" aria-modal="true" aria-labelledby="ppr-title">
      <div class="ppr-handle" aria-hidden="true"></div>
      <div class="ppr-bell" aria-hidden="true">${icon("bell", { size: 30 })}</div>
      <div class="ppr-title" id="ppr-title">${tu ? "Active tes rappels" : "Activez vos notifications"}</div>
      <div class="ppr-sub">${tu ? "Un tap maintenant, et on s'occupe du reste. Jamais de spam." : "Un tap maintenant — jamais plus d'une par jour."}</div>
      <div class="ppr-rows">
        ${rows.map(([ico, txt]) => `<div class="ppr-row"><span class="ppr-row-ico">${icon(ico, { size: 19 })}</span>${txt}</div>`).join("")}
      </div>
      <button class="ppr-cta" id="ppr-cta" type="button">${tu ? "Activer mes rappels" : "Activer les notifications"}</button>
      <button class="ppr-later" id="ppr-later" type="button">Plus tard</button>
    </div>`;
  document.body.appendChild(host);

  const sheet = host.querySelector(".ppr");
  const bg = host.querySelector("#ppr-bg");
  requestAnimationFrame(() => {
    sheet.classList.add("on");
    bg.classList.add("on");
  });

  const close = (reason) => {
    track("push_prime.closed", { reason });
    if (reason === "later" || reason === "backdrop") {
      try {
        localStorage.setItem(LS_NEXT, String(Date.now() + SNOOZE_MS));
      } catch {
        /* tant pis */
      }
    }
    sheet.classList.remove("on");
    bg.classList.remove("on");
    setTimeout(() => host.remove(), 380);
  };

  bg.addEventListener("click", () => close("backdrop"));
  host
    .querySelector("#ppr-later")
    .addEventListener("click", () => close("later"));

  host.querySelector("#ppr-cta").addEventListener("click", async () => {
    const btn = host.querySelector("#ppr-cta");
    btn.disabled = true;
    btn.textContent = "Activation…";
    try {
      // DOIT rester dans le geste utilisateur (exigence iOS)
      const granted = await requestPushPermission();
      track("push_prime.result", { granted });
      if (granted) {
        btn.textContent = "Rappels activés ✓";
        setTimeout(() => close("granted"), 900);
        return;
      }
      // Refusé : la permission n'est plus 'default', la sheet ne reviendra pas
      close("denied");
    } catch {
      close("error");
    }
  });
}
