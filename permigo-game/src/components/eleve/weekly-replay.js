/**
 * Weekly Replay — modal style Spotify Wrapped pour l'élève.
 *
 * Apparait 1× par semaine (dimanche-lundi) avec un récap des 7 derniers jours.
 * 5 cards qui s'enchaînent : intro, heures, comp, top moment, CTA continue.
 *
 * Usage :
 *   import { maybePlayWeeklyReplay } from '@/components/eleve/weekly-replay.js';
 *   maybePlayWeeklyReplay({ stats: {...} });  // affiche si pas encore vu cette semaine
 *
 * Stats requises :
 *   { hoursThisWeek, hoursLastWeek, compsValidated, monsReview, topLessonHour, topLessonLieu, streak }
 */

import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { burstConfetti } from "@/components/common/confetti.js";
import { track } from "@/services/analytics.js";

const LS_KEY = "pg-replay-week";
const CARD_DURATION = 4500; // ms par card auto-advance

/** ISO week number 'YYYY-WW' pour identifier la semaine en cours. */
function isoWeekKey() {
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const week = 1 + Math.ceil((firstThursday - target) / 604800000);
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

/** Affiche le replay si :
 *  - on n'est pas dimanche soir ou lundi → skip (window weekly)
 *  - déjà vu cette semaine → skip
 *  - aucune activité cette semaine → skip
 */
export function maybePlayWeeklyReplay(stats) {
  const today = new Date();
  const dow = today.getDay(); // 0=dim, 1=lun
  const isReplayWindow = (dow === 0 && today.getHours() >= 18) || dow === 1;
  if (!isReplayWindow) return false;

  const week = isoWeekKey();
  if (localStorage.getItem(LS_KEY) === week) return false;

  const hrs = Number(stats?.hoursThisWeek) || 0;
  if (!stats || (hrs === 0 && (stats.compsValidated || 0) === 0)) return false;

  track("weekly_replay.viewed", {
    comp_semaine: stats.compsValidated,
    streak: stats.streak,
  });
  playReplay(stats);
  localStorage.setItem(LS_KEY, week);
  return true;
}

/** Lance manuellement (depuis un bouton "voir mon récap"). */
export function playReplay(stats) {
  ensureStyles();
  if (document.querySelector(".wrep-overlay")) return;

  const hoursThisWeek = Number(stats.hoursThisWeek) || 0;
  const hoursLastWeek = Number(stats.hoursLastWeek) || 0;
  const compsValidated = Math.max(
    0,
    Math.trunc(Number(stats.compsValidated) || 0),
  );
  const monsReview = Math.max(0, Math.min(5, Number(stats.monsReview) || 0));
  const streak = Math.max(0, Math.trunc(Number(stats.streak) || 0));
  const delta =
    hoursLastWeek > 0
      ? Math.round(((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100)
      : null;
  const deltaText =
    delta === null
      ? null
      : delta > 0
        ? `+${delta}% vs semaine dernière`
        : delta < 0
          ? `${delta}% vs semaine dernière`
          : "Stable vs semaine dernière";

  const cardDefinitions = [
    {
      bg: "linear-gradient(180deg,#1e1b4b 0%,#312e81 50%,var(--adx) 100%)",
      content: `
        <div class="wrep-tag">SEMAINE ${week()}</div>
        <div class="wrep-em">${icon("sparkle", { size: 72, strokeWidth: 1.5 })}</div>
        <h1 class="wrep-title">Ta semaine,<br>en rétro.</h1>
        <p class="wrep-sub">Voici ce que tu as fait ces 7 derniers jours.</p>
      `,
    },
    {
      bg: "linear-gradient(180deg,#7c2d12 0%,var(--rdk) 50%,var(--or) 100%)",
      content: `
        <div class="wrep-tag">TEMPS AU VOLANT</div>
        <div class="wrep-big">${hoursThisWeek.toFixed(1).replace(/\.0$/, "")}<small>h</small></div>
        <div class="wrep-medium">de conduite cette semaine</div>
        ${deltaText ? `<div class="wrep-meta">${esc(deltaText)}</div>` : ""}
      `,
    },
    {
      bg: "linear-gradient(180deg,#064e3b 0%,var(--gr) 50%,#34d399 100%)",
      content: `
        <div class="wrep-tag">COMPÉTENCES</div>
        <div class="wrep-big">${compsValidated}</div>
        <div class="wrep-medium">${compsValidated === 1 ? "compétence validée" : "compétences validées"}</div>
        <div class="wrep-meta">+${compsValidated * 100} XP gagnés</div>
      `,
    },
    {
      bg: "linear-gradient(180deg,#581c87 0%,var(--pul) 50%,#c084fc 100%)",
      content: stats.topLessonHour
        ? `
        <div class="wrep-tag">${icon("star", { size: 14, strokeWidth: 2 })} MOMENT FORT</div>
        <div class="wrep-em">${monsReview >= 4 ? icon("trophy", { size: 72, strokeWidth: 1 }) : icon("zap", { size: 72, strokeWidth: 1 })}</div>
        <h2 class="wrep-h2">${monsReview ? `Note ${monsReview}/5` : "Une belle session"}</h2>
        <div class="wrep-medium">${esc(stats.topLessonHour)}${stats.topLessonLieu ? " · " + esc(stats.topLessonLieu) : ""}</div>
      `
        : `
        <div class="wrep-tag">${icon("star", { size: 14, strokeWidth: 2 })} MOMENT FORT</div>
        <div class="wrep-em">${icon("sun", { size: 72, strokeWidth: 1 })}</div>
        <h2 class="wrep-h2">Tu poses les bases</h2>
        <div class="wrep-medium">La semaine prochaine, encore plus loin.</div>
      `,
    },
    {
      bg: "linear-gradient(180deg,#451a03 0%,#a16207 50%,var(--aml2) 100%)",
      content: `
        <div class="wrep-tag">SÉRIE</div>
        <div class="wrep-big">${streak || 1}<small>j</small></div>
        <div class="wrep-medium">${(streak || 1) > 1 ? "d'affilée" : "à continuer demain"}</div>
        ${streak >= 7 ? '<div class="wrep-meta">Tu deviens un habitué</div>' : '<div class="wrep-meta">Reviens demain pour grandir la série</div>'}
      `,
    },
    {
      bg: "linear-gradient(180deg,#0c4a6e 0%,#0284c7 50%,#38bdf8 100%)",
      content: `
        <div class="wrep-tag">CETTE SEMAINE</div>
        <h1 class="wrep-title" style="font-size:38px">Continue.<br>Le permis t'attend.</h1>
        <p class="wrep-sub">On repart pour une nouvelle semaine.</p>
        <button class="wrep-final-cta" id="wrep-share" type="button">PARTAGER MA SEMAINE</button>
      `,
    },
  ];
  const cards = cardDefinitions.map(({ bg, content }) => {
    const template = document.createElement("template");
    template.innerHTML = content;
    return { bg, content: template.content };
  });

  const overlay = document.createElement("div");
  overlay.className = "wrep-overlay";
  overlay.innerHTML = `
    <div class="wrep-progress" aria-hidden="true">
      ${cards.map((_, i) => `<span class="wrep-pbar" data-pb="${i}"><i></i></span>`).join("")}
    </div>
    <button class="wrep-close" id="wrep-close" type="button" aria-label="Fermer">×</button>
    <div class="wrep-stage" id="wrep-stage"></div>
    <div class="wrep-tap-left" id="wrep-tap-left" role="button" tabindex="0" aria-label="Précédent"></div>
    <div class="wrep-tap-right" id="wrep-tap-right" role="button" tabindex="0" aria-label="Suivant"></div>
  `;
  document.body.appendChild(overlay);

  let idx = 0;
  let timer = null;

  function showCard(i) {
    idx = Math.max(0, Math.min(cards.length - 1, i));
    const stage = overlay.querySelector("#wrep-stage");
    const c = cards[idx];
    overlay.style.background = c.bg;
    const card = document.createElement("div");
    card.className = "wrep-card";
    card.dataset.card = String(idx);
    card.appendChild(c.content.cloneNode(true));
    stage.replaceChildren(card);

    // Update progress bars
    overlay.querySelectorAll(".wrep-pbar").forEach((pb, i) => {
      const fill = pb.querySelector("i");
      if (i < idx) {
        fill.style.width = "100%";
        fill.style.transition = "none";
      } else if (i === idx) {
        fill.style.transition = "none";
        fill.style.width = "0%";
        void fill.offsetWidth;
        fill.style.transition = `width ${CARD_DURATION}ms linear`;
        fill.style.width = "100%";
      } else {
        fill.style.width = "0%";
        fill.style.transition = "none";
      }
    });

    // Confetti sur les cards joyeuses
    if (idx === 2 && stats.compsValidated > 0) {
      setTimeout(
        () => burstConfetti({ x: 0.5, y: 0.3, count: 50, power: 12 }),
        300,
      );
    }
    if (idx === cards.length - 1) {
      setTimeout(
        () => burstConfetti({ x: 0.5, y: 0.3, count: 100, power: 18 }),
        200,
      );
    }

    // Haptique sur chaque card
    try {
      navigator.vibrate?.(20);
    } catch (_) {}

    // Wire bouton partage
    overlay
      .querySelector("#wrep-share")
      ?.addEventListener("click", async () => {
        track("weekly_replay.shared", { comp_semaine: stats.compsValidated });
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Ma semaine sur PermiGo",
              text: `${stats.compsValidated} compétence${stats.compsValidated !== 1 ? "s" : ""} cette semaine — je progresse vers mon permis !`,
              // location.origin : l'ancien domaine en dur
              // (permigo-game.vercel.app) renvoie un 404.
              url: window.location.origin,
            });
          } catch {
            /* user cancelled */
          }
        }
        close();
      });

    // Auto-advance
    clearTimeout(timer);
    if (idx < cards.length - 1) {
      timer = setTimeout(() => showCard(idx + 1), CARD_DURATION);
    }
  }

  function close() {
    clearTimeout(timer);
    overlay.classList.add("wrep-closing");
    setTimeout(() => overlay.remove(), 300);
  }

  overlay.querySelector("#wrep-close").addEventListener("click", close);
  overlay
    .querySelector("#wrep-tap-left")
    .addEventListener("click", () => showCard(idx - 1));
  overlay
    .querySelector("#wrep-tap-right")
    .addEventListener("click", () => showCard(idx + 1));

  // Swipe
  let touchX = 0;
  overlay.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.touches[0].clientX;
    },
    { passive: true },
  );
  overlay.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) showCard(idx - 1);
      else showCard(idx + 1);
    }
  });

  // Keyboard
  const onKey = (e) => {
    if (e.key === "ArrowRight") showCard(idx + 1);
    else if (e.key === "ArrowLeft") showCard(idx - 1);
    else if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("animationend", () => {
    if (overlay.classList.contains("wrep-closing"))
      document.removeEventListener("keydown", onKey);
  });

  showCard(0);
}

function week() {
  const d = new Date();
  return isoWeekKey().split("-")[1];
}

let _styled = false;
function ensureStyles() {
  if (_styled) return;
  _styled = true;
  const style = document.createElement("style");
  style.textContent = `
    .wrep-overlay{
      position:fixed;inset:0;z-index:400;
      display:flex;align-items:center;justify-content:center;
      padding:18px;color:#fff;
      transition:background .6s cubic-bezier(.2,.7,.3,1);
      animation:wrep-in .35s ease;
      overflow:hidden;
    }
    @keyframes wrep-in{from{opacity:0}to{opacity:1}}
    @keyframes wrep-out{from{opacity:1}to{opacity:0;transform:scale(.96)}}
    .wrep-overlay.wrep-closing{animation:wrep-out .3s ease forwards}

    /* Progress bars en haut */
    .wrep-progress{
      position:absolute;top:max(14px,env(safe-area-inset-top));left:14px;right:14px;
      display:flex;gap:4px;z-index:5;
    }
    .wrep-pbar{flex:1;height:3px;background:rgba(255,255,255,.25);border-radius:99px;overflow:hidden}
    .wrep-pbar i{display:block;height:100%;background:#fff;border-radius:99px;width:0%;box-shadow:0 0 6px rgba(255,255,255,.7)}

    /* Close button */
    .wrep-close{
      position:absolute;top:max(28px,calc(env(safe-area-inset-top) + 14px));right:14px;
      width:36px;height:36px;border-radius:50%;
      background:rgba(255,255,255,.18);color:#fff;border:0;
      font-size:22px;cursor:pointer;z-index:5;
      backdrop-filter:blur(8px);
      transition:background .15s;
    }
    .wrep-close:hover{background:rgba(255,255,255,.3)}

    /* Stage */
    .wrep-stage{
      width:100%;max-width:480px;
      display:flex;align-items:center;justify-content:center;
      min-height:60vh;
      perspective:1000px;
    }
    .wrep-card{
      text-align:center;
      animation:wrep-card-in .6s cubic-bezier(.34,1.56,.64,1) both;
      max-width:100%;
    }
    @keyframes wrep-card-in{
      0%{opacity:0;transform:translateY(40px) scale(.85);filter:blur(8px)}
      60%{opacity:1;transform:translateY(-4px) scale(1.02);filter:blur(0)}
      100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
    }

    .wrep-tag{
      font-family:var(--fn);font-size:11px;font-weight:900;
      letter-spacing:.4em;text-transform:uppercase;
      color:rgba(255,255,255,.85);
      margin-bottom:18px;
      filter:drop-shadow(0 2px 8px rgba(0,0,0,.4));
      display:inline-flex;align-items:center;gap:6px;
    }
    .wrep-em{
      display:flex;align-items:center;justify-content:center;
      margin-bottom:14px;color:#fff;
      filter:drop-shadow(0 8px 24px rgba(0,0,0,.4));
      animation:wrep-em-bob 2.2s ease-in-out infinite;
    }
    @keyframes wrep-em-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-6px) rotate(-3deg)}}
    .wrep-title{
      font-family:var(--fd);font-weight:900;
      font-size:clamp(36px,10vw,52px);
      letter-spacing:-.03em;line-height:1.05;margin:0;
      text-shadow:0 4px 20px rgba(0,0,0,.4);
    }
    .wrep-h2{
      font-family:var(--fd);font-weight:900;font-size:32px;
      letter-spacing:-.02em;margin:8px 0 6px;
    }
    .wrep-sub{
      font-size:15px;color:rgba(255,255,255,.85);
      margin-top:14px;line-height:1.5;
      max-width:340px;margin-left:auto;margin-right:auto;
    }
    .wrep-big{
      font-family:var(--fd);font-weight:900;
      font-size:clamp(80px,22vw,140px);
      letter-spacing:-.04em;line-height:.95;margin:0;
      text-shadow:0 8px 32px rgba(0,0,0,.4),0 0 40px rgba(255,255,255,.2);
    }
    .wrep-big small{font-size:.45em;opacity:.75;font-weight:800;margin-left:4px}
    .wrep-medium{
      font-family:var(--fd);font-weight:800;font-size:20px;
      letter-spacing:-.005em;margin-top:8px;
      color:rgba(255,255,255,.95);
    }
    .wrep-meta{
      font-size:13px;color:rgba(255,255,255,.7);
      margin-top:14px;font-weight:600;letter-spacing:.2px;
    }

    .wrep-final-cta{
      margin-top:24px;
      padding:16px 32px;border-radius:99px;
      background:#fff;color:var(--ink);border:0;
      font-family:var(--fd);font-size:14px;font-weight:900;
      letter-spacing:.4px;cursor:pointer;
      box-shadow:0 10px 28px -4px rgba(0,0,0,.4);
      transition:transform .15s;
    }
    .wrep-final-cta:hover{transform:translateY(-3px) scale(1.04)}

    /* Zones de tap gauche/droite (transparentes mais cliquables) */
    .wrep-tap-left,.wrep-tap-right{
      position:absolute;top:60px;bottom:60px;width:30%;
      cursor:pointer;z-index:2;
    }
    .wrep-tap-left{left:0}
    .wrep-tap-right{right:0}

    @media (prefers-reduced-motion:reduce){
      .wrep-card,.wrep-em{animation:none}
      .wrep-pbar i{transition:none}
    }
  `;
  document.head.appendChild(style);
}

/** Force play (pour bouton "voir mon récap") sans check date. */
export function forcePlayReplay(stats) {
  playReplay(stats);
}
