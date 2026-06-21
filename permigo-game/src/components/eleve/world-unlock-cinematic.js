/**
 * World Unlock Cinematic — séquence full-screen quand l'élève termine un monde.
 *
 * 5 phases :
 *  1. Fade to black + scale up des particules (0-600ms)
 *  2. Bannière "MONDE X TERMINÉ" depuis le bas (600-1100ms)
 *  3. Sous-titre "Tu as conquis [Nom]" (1100-1500ms)
 *  4. 3 stats clés en cascade (1500-2500ms)
 *  5. Bouton "ENTRER DANS LE MONDE X+1" qui pulse (2500ms+)
 *
 * Auto-detect : utilise localStorage pour ne pas re-jouer une cinematic déjà vue.
 *
 * Usage :
 *   import { detectAndPlayUnlock } from '@/components/eleve/world-unlock-cinematic.js';
 *   detectAndPlayUnlock({
 *     worldsCompleted: [1, 2],       // numéros (1-based) des mondes complets
 *     worldsMeta: WORLDS_META,        // metadata (name, color, etc.)
 *     stats: { byWorld: { 1: { hours: 6, comps: 8, days: 5 } } },
 *     onEnter: (nextWorldNum) => scroll(...),
 *   });
 */

import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { burstConfetti } from "@/components/common/confetti.js";
import { playFanfare } from "@/utils/sound.js";

const LS_KEY = "pg-unlock-seen";

function getSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function markSeen(worldNum) {
  const s = getSeen();
  s.add(worldNum);
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(s)));
}

/** Vérifie si un monde vient d'être complété et lance la cinematic. */
export function detectAndPlayUnlock({
  worldsCompleted = [],
  worldsMeta = [],
  stats = {},
  onEnter,
} = {}) {
  const seen = getSeen();
  const toCelebrate = worldsCompleted.find((n) => !seen.has(n));
  if (!toCelebrate) return false;

  const meta = worldsMeta[toCelebrate - 1];
  if (!meta) return false;

  const worldStats = (stats.byWorld && stats.byWorld[toCelebrate]) || {
    hours: 0,
    comps: 0,
    days: 0,
  };
  playUnlockCinematic({
    worldNum: toCelebrate,
    worldName: meta.name,
    worldColor: meta.color,
    worldGlow: meta.glow,
    nextWorldName: worldsMeta[toCelebrate]?.name || null,
    nextWorldNum: toCelebrate + 1 <= worldsMeta.length ? toCelebrate + 1 : null,
    stats: worldStats,
    onEnter,
  });
  return true;
}

/** Lance manuellement la cinematic pour un monde donné. */
export function playUnlockCinematic({
  worldNum,
  worldName,
  worldColor = "var(--aml2)",
  worldGlow = "rgba(251,191,36,.5)",
  nextWorldName,
  nextWorldNum,
  stats,
  onEnter,
} = {}) {
  ensureStyles();

  if (document.querySelector(".wuc-overlay")) return; // déjà ouvert

  // Haptique + fanfare
  try {
    navigator.vibrate?.([80, 50, 80, 50, 200]);
  } catch (_) {}
  playFanfare();

  const overlay = document.createElement("div");
  overlay.className = "wuc-overlay";
  overlay.style.setProperty("--wuc-c", worldColor);
  overlay.style.setProperty("--wuc-g", worldGlow);
  overlay.innerHTML = `
    <div class="wuc-bg" aria-hidden="true"></div>
    <div class="wuc-rays" aria-hidden="true"></div>
    <div class="wuc-stars" aria-hidden="true">
      ${Array.from({ length: 24 })
        .map(
          (_, i) =>
            `<span class="wuc-star" style="--i:${i};--d:${(Math.random() * 2).toFixed(1)}s;left:${Math.random() * 100}%;top:${Math.random() * 100}%"></span>`,
        )
        .join("")}
    </div>

    <div class="wuc-content" role="dialog" aria-modal="true" aria-labelledby="wuc-title">
      <div class="wuc-tag">MONDE ${worldNum} TERMINÉ</div>
      <h1 class="wuc-title" id="wuc-title">${esc(worldName)}</h1>
      <div class="wuc-sub">Tu as conquis ce monde</div>

      <div class="wuc-stats">
        <div class="wuc-stat" style="--d:1.6s">
          <div class="v">${stats.comps || 0}</div>
          <div class="l">Compétences</div>
        </div>
        <div class="wuc-stat" style="--d:1.85s">
          <div class="v">${stats.days || 0}<small>j</small></div>
          <div class="l">Jours</div>
        </div>
      </div>

      ${
        nextWorldNum
          ? `
        <button class="wuc-cta" id="wuc-cta" type="button">
          <span class="wuc-cta-top">
            <span class="wuc-cta-lbl">ENTRER DANS LE MONDE ${nextWorldNum}</span>
            <span class="wuc-cta-arrow">→</span>
          </span>
          <span class="wuc-cta-name">${esc(nextWorldName || "")}</span>
        </button>
      `
          : `
        <button class="wuc-cta wuc-cta-final" id="wuc-cta" type="button">
          <span class="wuc-cta-lbl">${icon("trophy", { size: 18 })} TU AS CONQUIS TOUS LES MONDES</span>
          <span class="wuc-cta-name">Tu es prêt pour l'examen</span>
        </button>
      `
      }

      <button class="wuc-skip" id="wuc-skip" type="button" aria-label="Passer">Passer</button>

      <!-- Signature PermiGo en haut, discrète -->
      <div class="wuc-brand" aria-hidden="true">
        <span class="pg-logo-txt">PermiGo</span>
        <span class="wuc-brand-fb" style="display:none">PermiGo</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Confetti burst au moment du titre
  setTimeout(() => {
    burstConfetti({ x: 0.5, y: 0.3, count: 220, power: 24, spread: Math.PI });
    try {
      navigator.vibrate?.(120);
    } catch (_) {}
  }, 800);

  // Second burst au moment des stats
  setTimeout(() => {
    burstConfetti({
      x: 0.25,
      y: 0.4,
      count: 60,
      power: 14,
      spread: Math.PI * 0.6,
    });
    burstConfetti({
      x: 0.75,
      y: 0.4,
      count: 60,
      power: 14,
      spread: Math.PI * 0.6,
    });
  }, 1700);

  const closeAndEnter = (skipped = false) => {
    overlay.classList.add("wuc-closing");
    setTimeout(() => {
      overlay.remove();
      markSeen(worldNum);
      if (onEnter && nextWorldNum && !skipped) onEnter(nextWorldNum);
    }, 600);
  };

  overlay
    .querySelector("#wuc-cta")
    ?.addEventListener("click", () => closeAndEnter(false));
  overlay
    .querySelector("#wuc-skip")
    ?.addEventListener("click", () => closeAndEnter(true));

  // ESC pour skip
  const onKey = (e) => {
    if (e.key === "Escape") {
      closeAndEnter(true);
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

let _wucCssInjected = false;
function ensureStyles() {
  if (_wucCssInjected) return;
  _wucCssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    /* ╔══ OVERLAY FULL-SCREEN ══════════════════════════════════════════╗ */
    .wuc-overlay{
      position:fixed;inset:0;z-index:500;
      display:flex;align-items:center;justify-content:center;
      padding:14px;
      overflow:hidden;
      animation:wuc-fadein .6s ease-out;
    }
    @keyframes wuc-fadein{from{opacity:0}to{opacity:1}}

    .wuc-bg{
      position:absolute;inset:0;
      background:
        radial-gradient(ellipse at center, var(--wuc-c) 0%, #0b0d1a 50%, #000 100%);
    }

    /* Rayons divins rotatifs */
    .wuc-rays{
      position:absolute;inset:-50%;
      background:repeating-conic-gradient(from 0deg at 50% 50%,
        var(--wuc-c) 0deg, var(--wuc-c) 3deg,
        transparent 3deg, transparent 16deg);
      opacity:.15;
      animation:wuc-rays-spin 25s linear infinite;
      mask-image:radial-gradient(circle, #000 30%, transparent 75%);
    }
    @keyframes wuc-rays-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

    /* Étoiles qui flottent */
    .wuc-stars{position:absolute;inset:0;overflow:hidden}
    .wuc-star{
      position:absolute;width:3px;height:3px;border-radius:50%;
      background:#fff;
      box-shadow:0 0 8px rgba(255,255,255,.8);
      animation:wuc-star-float 4s ease-in-out infinite;
      animation-delay:var(--d);
      opacity:0;
    }
    @keyframes wuc-star-float{
      0%{opacity:0;transform:translateY(0) scale(.5)}
      30%{opacity:.9;transform:translateY(-20px) scale(1)}
      100%{opacity:0;transform:translateY(-80px) scale(.3)}
    }

    /* ╔══ CONTENT ══════════════════════════════════════════╗ */
    .wuc-content{
      position:relative;z-index:2;
      max-width:520px;width:100%;
      text-align:center;
      color:#fff;
    }

    .wuc-tag{
      font-family:var(--fd);font-size:13px;font-weight:900;
      color:var(--wuc-c);letter-spacing:.4em;text-transform:uppercase;
      margin-bottom:18px;
      opacity:0;
      animation:wuc-tag-in .8s cubic-bezier(.34,1.56,.64,1) .4s forwards;
      text-shadow:0 0 20px var(--wuc-g);
      filter:drop-shadow(0 0 8px var(--wuc-g));
    }
    @keyframes wuc-tag-in{
      0%{opacity:0;transform:translateY(20px);letter-spacing:1em}
      60%{opacity:1;transform:translateY(-4px);letter-spacing:.35em}
      100%{opacity:1;transform:translateY(0);letter-spacing:.4em}
    }

    .wuc-title{
      font-family:var(--fd);font-size:clamp(40px,12vw,80px);font-weight:900;
      line-height:1;letter-spacing:-.04em;margin:0;
      background:linear-gradient(180deg,#fff 0%,var(--wuc-c) 100%);
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
      filter:drop-shadow(0 0 24px var(--wuc-g)) drop-shadow(0 0 60px var(--wuc-c));
      opacity:0;
      animation:wuc-title-in 1s cubic-bezier(.34,1.56,.64,1) .8s forwards;
    }
    @keyframes wuc-title-in{
      0%{opacity:0;transform:scale(.7) translateY(20px);filter:blur(20px) drop-shadow(0 0 24px var(--wuc-g))}
      60%{opacity:1;transform:scale(1.05) translateY(-6px);filter:blur(0) drop-shadow(0 0 24px var(--wuc-g))}
      100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0) drop-shadow(0 0 24px var(--wuc-g)) drop-shadow(0 0 60px var(--wuc-c))}
    }

    .wuc-sub{
      font-family:var(--fb);font-size:16px;font-weight:600;
      color:rgba(255,255,255,.75);
      margin-top:10px;letter-spacing:.5px;
      opacity:0;
      animation:wuc-sub-in .6s cubic-bezier(.2,.7,.3,1) 1.2s forwards;
    }
    @keyframes wuc-sub-in{
      from{opacity:0;transform:translateY(10px);filter:blur(4px)}
      to{opacity:1;transform:translateY(0);filter:blur(0)}
    }

    /* Stats cascade */
    .wuc-stats{
      display:grid;grid-template-columns:repeat(2,1fr);gap:12px;
      max-width:340px;margin:28px auto 32px;
    }
    .wuc-stat{
      padding:14px 8px;
      background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.02));
      border:1px solid var(--wuc-c);
      border-radius:14px;
      box-shadow:0 0 20px -8px var(--wuc-g), 0 1px 0 rgba(255,255,255,.1) inset;
      opacity:0;
      animation:wuc-stat-in .6s cubic-bezier(.34,1.56,.64,1) var(--d) forwards;
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    }
    @keyframes wuc-stat-in{
      0%{opacity:0;transform:translateY(30px) scale(.7);filter:blur(8px)}
      60%{opacity:1;transform:translateY(-4px) scale(1.05);filter:blur(0)}
      100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
    }
    .wuc-stat .v{
      font-family:var(--fd);font-size:30px;font-weight:900;
      letter-spacing:-.02em;line-height:1;color:#fff;
      text-shadow:0 0 12px var(--wuc-g);
    }
    .wuc-stat .v small{font-size:14px;color:var(--wuc-c);font-weight:700;margin-left:1px}
    .wuc-stat .l{
      font-family:var(--fn);font-size:9.5px;font-weight:800;
      color:rgba(255,255,255,.65);
      letter-spacing:.2em;text-transform:uppercase;margin-top:5px;
    }

    /* CTA principal */
    .wuc-cta{
      display:flex;flex-direction:column;align-items:center;gap:3px;
      padding:18px 36px;
      background:linear-gradient(180deg,#fff 0%,var(--aml) 50%,var(--wuc-c) 100%);
      color:#10210a; /* couleur FIXE foncée : le fond du CTA est toujours clair,
                        var(--ink) virait au blanc en dark mode = texte illisible. */
      border:0;
      border-radius:99px;
      font-family:var(--fd);font-weight:900;cursor:pointer;
      box-shadow:
        0 14px 32px -6px var(--wuc-g),
        0 0 40px var(--wuc-c),
        inset 0 -4px 0 rgba(0,0,0,.15),
        inset 0 2px 0 rgba(255,255,255,.6);
      transition:transform .2s cubic-bezier(.5,1.6,.4,1);
      opacity:0;
      animation:wuc-cta-in .7s cubic-bezier(.34,1.56,.64,1) 2.6s forwards, wuc-cta-pulse 2s ease-in-out 3.4s infinite;
      letter-spacing:.3px;
      position:relative;overflow:hidden;
    }
    .wuc-cta::before{
      content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;
      background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);
      animation:wuc-cta-shine 2.5s ease-in-out infinite;
      animation-delay:3.4s;
    }
    @keyframes wuc-cta-shine{0%{left:-100%}50%,100%{left:200%}}
    .wuc-cta-top{display:flex;align-items:center;justify-content:center;gap:9px}
    .wuc-cta-lbl{font-size:14px;letter-spacing:.6px;text-transform:uppercase;line-height:1.1}
    .wuc-cta-name{font-size:11px;font-weight:700;color:rgba(11,13,26,.65);letter-spacing:.3px;margin-top:3px}
    .wuc-cta-arrow{font-size:18px;font-weight:900;animation:wuc-arrow-bounce 1.4s ease-in-out infinite}
    @keyframes wuc-arrow-bounce{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
    .wuc-cta:hover{transform:translateY(-3px) scale(1.03)}
    .wuc-cta:active{transform:translateY(-1px) scale(.98)}
    .wuc-cta-final{background:linear-gradient(180deg,var(--aml2),var(--am))}
    @keyframes wuc-cta-in{
      0%{opacity:0;transform:translateY(40px) scale(.7)}
      60%{opacity:1;transform:translateY(-4px) scale(1.08)}
      100%{opacity:1;transform:translateY(0) scale(1)}
    }
    @keyframes wuc-cta-pulse{
      0%,100%{box-shadow:0 14px 32px -6px var(--wuc-g),0 0 40px var(--wuc-c),inset 0 -4px 0 rgba(0,0,0,.15),inset 0 2px 0 rgba(255,255,255,.6)}
      50%{box-shadow:0 18px 40px -4px var(--wuc-g),0 0 60px var(--wuc-c),inset 0 -4px 0 rgba(0,0,0,.15),inset 0 2px 0 rgba(255,255,255,.6)}
    }

    /* Logo PermiGo en haut, discret, signe le moment */
    .wuc-brand{
      position:absolute;top:calc(28px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);
      opacity:0;
      animation:fadein-late 1s ease 2.4s forwards;
    }
    .wuc-brand img{height:20px;width:auto;filter:drop-shadow(0 2px 8px color-mix(in srgb, var(--a) 60%, transparent))}
    .wuc-brand-fb{font-family:var(--fd);font-weight:900;font-size:14px;letter-spacing:-.02em;background:linear-gradient(90deg,var(--al3),#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

    /* Skip discret en bas */
    .wuc-skip{
      position:absolute;bottom:28px;left:50%;transform:translateX(-50%);
      padding:8px 16px;
      background:transparent;border:1px solid rgba(255,255,255,.2);
      color:rgba(255,255,255,.6);
      border-radius:99px;
      font-family:var(--fn);font-size:11px;font-weight:700;
      cursor:pointer;letter-spacing:.2em;text-transform:uppercase;
      opacity:0;transition:opacity .15s,color .15s;
      animation:fadein-late 1s ease 3s forwards;
    }
    @keyframes fadein-late{to{opacity:1}}
    .wuc-skip:hover{color:#fff;border-color:rgba(255,255,255,.4)}

    /* Closing animation */
    .wuc-overlay.wuc-closing{animation:wuc-fadeout .6s ease-in forwards}
    @keyframes wuc-fadeout{from{opacity:1}to{opacity:0;filter:blur(8px)}}

    @media (prefers-reduced-motion:reduce){
      .wuc-star,.wuc-rays,.wuc-cta::before{animation:none}
      .wuc-tag,.wuc-title,.wuc-sub,.wuc-stat,.wuc-cta,.wuc-skip{animation:none;opacity:1;transform:none}
    }
  `;
  document.head.appendChild(style);
}
