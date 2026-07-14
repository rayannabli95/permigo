// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » : la salle d'entraînement (maquette validée
// Rayan, 2026-07 : mockups/nav-hub-reviser-A.html).
//
// Hiérarchie (fidèle à la maquette) :
//   1. Série (statut discret)
//   2. Hero « L'Arène » — monde REMC en cours + étoiles + CTA Jouer +
//      ligne ligue (Révision)
//   3. « Aussi dans ta salle » — 5 modes : Examen blanc (de CONDUITE) ·
//      En situation · Mes fautes · Quiz éclair · Fiches de conduite
//   4. Bulle du coach — conseil en règles simples (pas d'IA)
//
// ⚠️ Écart texte volontaire vs maquette : le kicker de l'Arène ne dit
// PAS « ton entraînement au code » — la règle produit (theory-league.js)
// interdit tout libellé « code »/« ETG » (PermiGo ne couvre pas l'ETG).
// Remplacé par « ta révision », cohérent avec « Ligue Révision » ailleurs.
//
// DA « Arène Néo » : nuit-violet + or, toujours sombre (indépendant du
// thème clair/sombre de l'app) — même exception assumée que quiz-ui.js /
// exam-blanc.js / flash-quiz.js (écran d'entraînement dédié).
//
// Données 100% réelles (repli gracieux si indisponible, jamais inventées) :
//   - Monde/étoiles   : table `validations` (eleve_id=moi) + data/remc.js + data/worlds.js
//   - Ligue Révision  : RPC get_theory_leaderboard (déjà utilisé par classement.js)
//   - Série           : utils/game-state.js getStreak() (local)
//   - Examen blanc    : quiz_attempts (type=exam_blanc, ref_id="exam-conduite" — le blanc de CONDUITE)
//   - Mes fautes      : utils/weak-points.js (local — alimenté par exam-blanc.js,
//                       l'Arène (quiz-engine.js) et exam-conduite.js)
//   - Quiz éclair     : table flash_quizzes (sent_to=moi, non répondu, non expiré)
//   - Fiches lues     : localStorage rvc_read_v1 + data/fiches-conduite.js
//
// Le devoir ciblé du moniteur (`revision_focus`) n'est plus affiché ici
// (retiré du hero pour coller à la maquette) : il reste visible dans
// `#/revision-conduite` (qui lit déjà cette table) — pas de régression.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { getStreak } from "@/utils/game-state.js";
import { getWeakPoints } from "@/utils/weak-points.js";
import { theoryLeague } from "@/utils/theory-league.js";
import { FICHES } from "@/data/fiches-conduite.js";
import { REMC } from "@/data/remc.js";
import { WORLDS } from "@/data/worlds.js";
import { medallion } from "@/utils/medallions.js";
import { toast } from "@/components/common/toast.js";

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite.js

// ⚠️ Retour Rayan 2026-07-14 : « Examen blanc » dans ce hub = l'examen blanc
// de CONDUITE (#/exam-conduite, 8 phases ECE — le différenciateur PermiGo),
// PAS l'ancien exam-blanc du code (page à l'ancienne mise en page, sans
// porte ailleurs). « En situation » retrouve aussi sa porte ici.
// Les fautes (« Mes fautes ») sont nourries par weak-points.js, alimenté
// par exam-blanc.js, l'Arène (quiz-engine.js) et l'exam conduite.

// Médaillon du monde REMC en cours — même convention que quiz.js (CAT_MED).
const WORLD_MED = {
  1: ["volant", "gold"],
  2: ["route", "blue"],
  3: ["eclair", "violet"],
  4: ["couronne", "gold"],
};

// Seuils de déblocage des mondes — mêmes valeurs que parcours.js
// (computeWorldStates / UNLOCK_REQ). Dupliqué ici volontairement : lecture
// seule d'une petite constante, pas de dépendance vers une page.
const UNLOCK_REQ = [null, 5, 6, 6];

const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const PLAY = `<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.5-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>`;

function ordinal(n) {
  return n === 1 ? "ʳᵉ" : "ᵉ";
}

// ─── Logique métier : monde REMC en cours ─────────────────────────
function computeCurrentWorld(validatedMap) {
  const states = REMC.map((cat, idx) => {
    const done = cat.subs.filter((s) => validatedMap[s.c]).length;
    const total = cat.subs.length;
    const complete = done === total;
    let status;
    if (idx === 0) {
      status = complete ? "complete" : "in_progress";
    } else {
      const prevDone = REMC[idx - 1].subs.filter(
        (s) => validatedMap[s.c],
      ).length;
      status =
        prevDone < UNLOCK_REQ[idx]
          ? "locked"
          : complete
            ? "complete"
            : "in_progress";
    }
    return { idx, world: WORLDS[idx], done, total, complete, status };
  });

  const current = states.find((s) => s.status === "in_progress");
  if (current) return { ...current, allDone: false };

  const allDone = states.every((s) => s.complete);
  if (allDone) {
    const doneAll = states.reduce((n, s) => n + s.done, 0);
    const totalAll = states.reduce((n, s) => n + s.total, 0);
    return {
      ...states[states.length - 1],
      allDone: true,
      done: doneAll,
      total: totalAll,
    };
  }
  return { ...states[0], allDone: false };
}

// ─── STYLE ─────────────────────────────────────────────────────────
const STYLE = `<style>
.rvh {
  --rvh-panel:#271850; --rvh-panel2:#2f1e5e; --rvh-panel-deep:#120a2e;
  --rvh-line:rgba(178,150,255,.22);
  --rvh-mu:#cabfef; --rvh-mu2:#9b8dcf;
  --rvh-gold-1:#ffe9a8; --rvh-gold-2:#ffd24a; --rvh-gold-3:#ff9c1c; --rvh-gold-deep:#c87d12;
  --rvh-violet:#a855f7; --rvh-violet-deep:#7c4dff; --rvh-violet-soft:#cbb9ff;
  --rvh-go-1:#7ee83a; --rvh-go-2:#58cc02; --rvh-go-3:#46a302; --rvh-go-deep:#357c00;
  --rvh-red:#ff6b6b; --rvh-blue:#54a0ff;
  position: relative;
  margin-top: calc(-1 * (var(--th, 52px) + env(safe-area-inset-top, 0px)));
  padding: calc(var(--th, 52px) + env(safe-area-inset-top, 0px) + 12px) 15px 96px;
  min-height: 100dvh;
  max-width: 480px;
  margin-inline: auto;
  color: #fff;
  font-family: 'Nunito', system-ui, sans-serif;
  overflow: hidden;
  background:
    radial-gradient(125% 52% at 18% -6%, rgba(168,85,247,.42) 0%, transparent 55%),
    radial-gradient(115% 46% at 98% 2%, rgba(255,156,28,.16) 0%, transparent 52%),
    radial-gradient(140% 90% at 50% 118%, rgba(0,0,0,.55) 0%, transparent 60%),
    linear-gradient(178deg, #1e1240 0%, #160d30 48%, #0f0824 100%);
}
.rvh::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .05; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>");
}
.rvh-stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.rvh-stars::before, .rvh-stars::after {
  content: ""; position: absolute; top: 0; left: 0; width: 2px; height: 2px; border-radius: 50%;
}
.rvh-stars::before {
  box-shadow:
    9vw 7vh 0 0 rgba(255,231,168,.85), 24vw 3vh 0 0 rgba(255,210,74,.5),
    38vw 11vh 0 0 rgba(255,255,255,.5), 57vw 5vh 0 0 rgba(255,225,140,.55),
    73vw 9vh 0 0 rgba(255,210,74,.6), 88vw 4vh 0 0 rgba(255,255,255,.45),
    14vw 17vh 0 0 rgba(255,255,255,.4), 91vw 15vh 0 0 rgba(255,210,74,.45);
  animation: rvhTwk 5s ease-in-out infinite;
}
.rvh-stars::after {
  box-shadow:
    6vw 30vh 0 0 rgba(203,185,255,.5), 46vw 34vh 0 0 rgba(255,255,255,.3),
    80vw 28vh 0 0 rgba(255,210,74,.4), 20vw 40vh 0 0 rgba(203,185,255,.4);
  animation: rvhTwk 6.4s ease-in-out .8s infinite;
}
@keyframes rvhTwk { 0%,100%{opacity:.35} 50%{opacity:1} }

.rvh-title {
  position: relative; z-index: 3;
  font: 800 26px/1.1 'Baloo 2', cursive; letter-spacing: .2px;
  margin: 2px 2px 12px;
  text-shadow: 0 2px 0 rgba(0,0,0,.3), 0 0 22px rgba(168,85,247,.45);
}

/* ── série (statut, discret) ── */
.rvh-streak {
  position: relative; z-index: 3; display: inline-flex; align-items: center; gap: 7px;
  margin-bottom: 14px; padding: 5px 13px 5px 7px; border-radius: 999px;
  background: rgba(255,210,74,.10); border: 1px solid rgba(255,210,74,.24);
}
.rvh-streak .pg-med { width: 22px; height: 22px; }
.rvh-streak b { font: 800 12.5px/1 'Nunito', sans-serif; color: var(--rvh-gold-1); }
.rvh-streak i { font: 700 11.5px/1 'Nunito', sans-serif; font-style: normal; color: var(--rvh-mu2); }

/* ══ HERO — L'ARÈNE ══ */
.rvh-arena {
  position: relative; z-index: 3; display: block; width: 100%; text-align: left; cursor: pointer;
  color: inherit; font: inherit; overflow: hidden;
  border: 1.5px solid rgba(255,210,74,.4); border-radius: 26px; padding: 18px 17px 16px; margin-bottom: 18px;
  background:
    radial-gradient(135% 92% at 88% 6%, rgba(255,182,44,.24) 0%, transparent 54%),
    radial-gradient(90% 80% at 12% 100%, rgba(124,77,255,.32) 0%, transparent 60%),
    linear-gradient(158deg, #38246a 0%, var(--rvh-panel2) 52%, var(--rvh-panel) 100%);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.14),
    inset 0 -14px 30px rgba(0,0,0,.42),
    0 10px 0 var(--rvh-panel-deep),
    0 22px 40px -14px rgba(0,0,0,.85),
    0 0 34px -12px rgba(255,182,44,.55);
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.rvh-arena:active { transform: translateY(2px) scale(.995); }
.rvh-arena::before {
  content: ""; position: absolute; inset: 0; border-radius: 26px; padding: 1.5px;
  background: linear-gradient(180deg, rgba(255,210,74,.6), rgba(255,210,74,0) 40%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.rvh-arena-k {
  position: relative; z-index: 2;
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; margin-bottom: 10px;
  background: rgba(255,210,74,.16); border: 1px solid rgba(255,210,74,.42);
  font: 600 10px/1 'Fredoka', sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--rvh-gold-1);
}
.rvh-arena-row { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; }
.rvh-arena-txt { flex: 1; min-width: 0; }
.rvh-arena-t {
  font: 800 24px/1.04 'Baloo 2', cursive;
  background: linear-gradient(180deg,#fff 0%,#fff7e0 52%,#ffd86b 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 1px rgba(0,0,0,.25));
}
.rvh-arena-s { margin-top: 6px; font: 700 12.5px/1.35 'Nunito', sans-serif; color: var(--rvh-mu); }

.rvh-arena-medal { position: relative; width: 82px; height: 82px; flex: none; }
.rvh-arena-medal .ring {
  position: absolute; inset: 0; border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle at 38% 30%, #fff7da 0%, var(--rvh-gold-2) 48%, var(--rvh-gold-3) 100%);
  border: 3px solid #fff5cf;
  box-shadow: 0 6px 0 var(--rvh-gold-deep), 0 14px 26px -8px rgba(0,0,0,.65), inset 0 2px 4px rgba(255,255,255,.6);
}
.rvh-arena-medal .pg-med { width: 54px; height: 54px; filter: drop-shadow(0 4px 6px rgba(0,0,0,.4)); }

.rvh-arena-prog {
  position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; margin-top: 12px;
  font: 800 11.5px/1 'Nunito', sans-serif; color: var(--rvh-mu2);
}
.rvh-arena-prog .pg-med { width: 16px; height: 16px; }
.rvh-arena-track { flex: 1; height: 8px; border-radius: 5px; background: rgba(10,7,24,.65); overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,.6); }
.rvh-arena-track i { display: block; height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--rvh-gold-3), var(--rvh-gold-2)); box-shadow: 0 0 10px rgba(255,182,44,.7); }
.rvh-arena-prog b { color: var(--rvh-gold-1); white-space: nowrap; }

.rvh-arena-cta {
  position: relative; z-index: 2; margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 9px;
  min-height: 52px; border-radius: 17px;
  background: linear-gradient(180deg, var(--rvh-go-1) 0%, var(--rvh-go-2) 52%, var(--rvh-go-3) 100%);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.55),
    inset 0 -4px 8px rgba(0,0,0,.22),
    0 6px 0 var(--rvh-go-deep),
    0 12px 22px -6px rgba(70,163,2,.7);
  font: 800 18px/1 'Baloo 2', cursive; color: #fff; text-shadow: 0 2px 0 rgba(35,80,4,.6); letter-spacing: .3px;
}
.rvh-arena-cta svg { width: 20px; height: 20px; }

.rvh-arena-lg {
  position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; margin-top: 13px;
  font: 800 11.5px/1 'Nunito', sans-serif; color: var(--rvh-mu2);
}
.rvh-arena-lg b { color: var(--rvh-violet-soft); }
.rvh-lgtrack { flex: 1; height: 7px; margin: 0 11px; border-radius: 4px; background: rgba(10,7,24,.65); overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,.6); }
.rvh-lgtrack i { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--rvh-violet-deep), var(--rvh-violet)); box-shadow: 0 0 10px rgba(168,85,247,.7); }

/* ══ AUSSI DANS TA SALLE ══ */
.rvh-h { position: relative; z-index: 3; margin: 2px 3px 10px; font: 800 12px/1 'Nunito', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--rvh-mu2); }

.rvh-rows { position: relative; z-index: 3; display: flex; flex-direction: column; gap: 10px; }
.rvh-row {
  position: relative; display: flex; align-items: center; gap: 13px; text-align: left; cursor: pointer;
  color: inherit; font: inherit; border: 1px solid var(--rvh-line); border-radius: 18px; padding: 12px 14px 12px 12px;
  background: linear-gradient(180deg, var(--rvh-panel2) 0%, var(--rvh-panel) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 6px 0 var(--rvh-panel-deep), 0 14px 24px -14px rgba(0,0,0,.75);
  transition: transform .16s cubic-bezier(.23,1,.32,1);
  min-height: 44px;
}
.rvh-row:active { transform: translateY(2px) scale(.995); }
.rvh-row::before {
  content: ""; position: absolute; inset: 0; border-radius: 18px; padding: 1px;
  background: linear-gradient(180deg, rgba(178,150,255,.5), rgba(178,150,255,0) 55%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.rvh-row-med { flex: none; display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,.45)); }
.rvh-row-body { flex: 1; min-width: 0; }
.rvh-row-t { font: 700 15.5px/1.1 'Baloo 2', cursive; }
.rvh-row-s { margin-top: 2px; font: 700 11px/1.35 'Nunito', sans-serif; color: var(--rvh-mu2); }
.rvh-row-end { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex: none; }
.rvh-row-meta { font: 800 11px/1 'Nunito', sans-serif; color: var(--rvh-gold-1); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
.rvh-row-meta svg { width: 13px; height: 13px; color: var(--rvh-violet-soft); }
.rvh-row-count {
  min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; display: grid; place-items: center;
  font: 800 13px/1 'Baloo 2', cursive; color: #fff;
  background: linear-gradient(180deg,#ff8f8f,var(--rvh-red) 55%,#d94848);
  border: 1px solid rgba(255,255,255,.35);
  box-shadow: 0 3px 0 #a52727, 0 6px 12px -4px rgba(255,107,107,.6);
}
.rvh-row-new {
  font: 600 9px/1 'Fredoka', sans-serif; letter-spacing: .09em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px; color: #d5e8ff;
  background: rgba(84,160,255,.16); border: 1px solid rgba(84,160,255,.45);
  box-shadow: 0 3px 8px -3px rgba(84,160,255,.5);
}

/* ── Coach en bas : une phrase ── */
.rvh-coach { position: relative; z-index: 3; display: flex; align-items: flex-end; gap: 10px; margin-top: 18px; padding: 0 2px; }
.rvh-coach img { width: 54px; height: 54px; object-fit: contain; flex: none; filter: drop-shadow(0 6px 8px rgba(0,0,0,.5)); }
.rvh-coach-bulle {
  position: relative; flex: 1; padding: 10px 13px; border-radius: 15px 15px 15px 4px;
  background: rgba(39,24,80,.85); border: 1px solid var(--rvh-line);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
  font: 700 12px/1.4 'Nunito', sans-serif; color: var(--rvh-mu);
}
.rvh-coach-bulle b { color: #fff; }

/* ── Skeleton ── */
.rvh-skel { position: relative; z-index: 3; border-radius: 18px; background: rgba(255,255,255,.06); }
.rvh-skel-arena { height: 236px; border-radius: 26px; margin-bottom: 18px; }
.rvh-skel-row { height: 76px; margin-bottom: 10px; }
@keyframes rvhPulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
.rvh-skel { animation: rvhPulse 1.3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .rvh-arena, .rvh-row { transition: none; }
  .rvh-stars::before, .rvh-stars::after { animation: none; }
  .rvh-skel { animation: none; }
}
</style>`;

// ─── Skeleton ────────────────────────────────────────────────────
function skeletonHtml() {
  return `${STYLE}
<div class="rvh">
  <div class="rvh-stars" aria-hidden="true"></div>
  <h1 class="rvh-title">Réviser</h1>
  <div class="rvh-skel rvh-skel-arena"></div>
  <div class="rvh-h">Aussi dans ta salle</div>
  <div class="rvh-skel rvh-skel-row"></div>
  <div class="rvh-skel rvh-skel-row"></div>
  <div class="rvh-skel rvh-skel-row"></div>
  <div class="rvh-skel rvh-skel-row"></div>
</div>`;
}

// ─── Hero « L'Arène » ──────────────────────────────────────────────
function arenaHtml({ world, ligue }) {
  const n = (world?.idx ?? 0) + 1;
  const [glyph, ramp] = WORLD_MED[n] || ["cible", "teal"];
  const worldName = world?.world?.nom || "";

  let sub;
  if (world?.allDone) sub = "Bravo ! Reviens t'entraîner quand tu veux.";
  else if (!world || world.done === 0) sub = "Découvre ce monde à ton rythme.";
  else sub = "Reprends là où tu t'es arrêté.";

  const title = world?.allDone
    ? `Tous les mondes<br>terminés`
    : `Monde ${n}<br>${esc(worldName)}`;

  const progHtml =
    world && world.total > 0
      ? `<div class="rvh-arena-prog">
          ${medallion("etoile", "gold", { size: 16 })}
          <span class="rvh-arena-track" aria-hidden="true"><i style="width:${Math.round((world.done / world.total) * 100)}%"></i></span>
          <b>${world.done}/${world.total} étoiles</b>
        </div>`
      : "";

  let lgHtml = "";
  if (ligue && ligue.classed) {
    const pct2 = ligue.tier.top
      ? 100
      : ligue.tier.league
        ? Math.min(
            100,
            Math.max(
              6,
              Math.round(
                ((ligue.score - ligue.tier.league.startAt) /
                  (ligue.tier.next.startAt - ligue.tier.league.startAt)) *
                  100,
              ),
            ),
          )
        : 8;
    lgHtml = `<div class="rvh-arena-lg">
      <span>Ligue <b>${esc(ligue.tier.league?.name || "Novice")}</b></span>
      <span class="rvh-lgtrack" aria-hidden="true"><i style="width:${pct2}%"></i></span>
      <span>${ligue.rank}<sup>${ordinal(ligue.rank)}</sup> sur ${ligue.total}</span>
    </div>`;
  }

  const cta = world?.allDone ? "Revoir mon parcours" : "Jouer";
  const ariaLabel = world?.allDone
    ? "Revoir ton parcours"
    : `Continuer le monde ${n} — ${worldName}`;

  return `<button class="rvh-arena" id="rvh-arena" aria-label="${escAttr(ariaLabel)}">
    <span class="rvh-arena-k">L'Arène · ta révision</span>
    <div class="rvh-arena-row">
      <div class="rvh-arena-txt">
        <div class="rvh-arena-t">${title}</div>
        <div class="rvh-arena-s">${esc(sub)}</div>
      </div>
      <div class="rvh-arena-medal" aria-hidden="true">
        <span class="ring">${medallion(glyph, ramp, { size: 54 })}</span>
      </div>
    </div>
    ${progHtml}
    <div class="rvh-arena-cta">${PLAY}${esc(cta)}</div>
    ${lgHtml}
  </button>`;
}

// ─── Render ──────────────────────────────────────────────────────
function render(data) {
  const {
    streak,
    world,
    ligue,
    fichesLues,
    fichesTotal,
    examBest,
    weakPoints,
    weakCount,
    flash,
  } = data;

  const streakTxt =
    streak.count > 0
      ? `Série : ${streak.count} jour${streak.count > 1 ? "s" : ""}`
      : "Série : nouvelle";
  const streakSub =
    streak.count > 0
      ? streak.isToday
        ? "· validée aujourd'hui"
        : "· garde ta série"
      : "· 2 min suffisent";

  const weakLabels = weakPoints.map((w) => w.label);
  const weakSub = weakLabels.length
    ? `${weakLabels.slice(0, 2).join(", ")} · rejoue-les`
    : "Repère tes points faibles au fil des quiz.";

  const flashSub = flash
    ? "3 questions choisies par ton moniteur"
    : "Ton moniteur peut t'en envoyer un quand il veut.";
  const flashMeta = flash
    ? `<span class="rvh-row-new">1 en attente</span><span class="rvh-row-meta">${flash.minsLeft} min ${CHEVRON}</span>`
    : `<span class="rvh-row-meta">Découvrir ${CHEVRON}</span>`;

  return `${STYLE}
<div class="rvh">
  <div class="rvh-stars" aria-hidden="true"></div>

  <h1 class="rvh-title">Réviser</h1>

  <div class="rvh-streak">${medallion("flamme", "orange", { size: 22 })}<b>${esc(streakTxt)}</b><i>${esc(streakSub)}</i></div>

  ${arenaHtml({ world, ligue })}

  <div class="rvh-h">Aussi dans ta salle</div>
  <div class="rvh-rows">

    <button class="rvh-row" id="rvh-row-exam" aria-label="Examen blanc de conduite — l'épreuve phase par phase, comme le jour J">
      <span class="rvh-row-med">${medallion("examen", "gold", { size: 46 })}</span>
      <div class="rvh-row-body">
        <div class="rvh-row-t">Examen blanc</div>
        <div class="rvh-row-s">L'épreuve de conduite phase par phase · comme le jour J</div>
      </div>
      <div class="rvh-row-end">
        <span class="rvh-row-meta">${examBest != null ? `Meilleur : ${examBest} %` : "Découvrir"} ${CHEVRON}</span>
      </div>
    </button>

    <button class="rvh-row" id="rvh-row-situation" aria-label="En situation — des scènes réelles, une décision à chaque fois">
      <span class="rvh-row-med">${medallion("voiture", "blue", { size: 46 })}</span>
      <div class="rvh-row-body">
        <div class="rvh-row-t">En situation</div>
        <div class="rvh-row-s">6 scènes réelles · une décision à chaque fois</div>
      </div>
      <div class="rvh-row-end">
        <span class="rvh-row-meta">Jouer ${CHEVRON}</span>
      </div>
    </button>

    <button class="rvh-row" id="rvh-row-fautes" aria-label="Mes fautes à revoir">
      <span class="rvh-row-med">${medallion("faute", "red", { size: 46 })}</span>
      <div class="rvh-row-body">
        <div class="rvh-row-t">Mes fautes</div>
        <div class="rvh-row-s">${esc(weakSub)}</div>
      </div>
      <div class="rvh-row-end">
        ${weakCount > 0 ? `<span class="rvh-row-count">${weakCount}</span><span class="rvh-row-meta">à revoir ${CHEVRON}</span>` : `<span class="rvh-row-meta">Repérer ${CHEVRON}</span>`}
      </div>
    </button>

    <button class="rvh-row" id="rvh-row-flash" aria-label="Quiz éclair">
      <span class="rvh-row-med">${medallion("eclair", "blue", { size: 46 })}</span>
      <div class="rvh-row-body">
        <div class="rvh-row-t">Quiz éclair</div>
        <div class="rvh-row-s">${esc(flashSub)}</div>
      </div>
      <div class="rvh-row-end">${flashMeta}</div>
    </button>

    <button class="rvh-row" id="rvh-row-fiches" aria-label="Fiches de conduite">
      <span class="rvh-row-med">${medallion("fiches", "violet", { size: 46 })}</span>
      <div class="rvh-row-body">
        <div class="rvh-row-t">Fiches de conduite</div>
        <div class="rvh-row-s">Le geste, pas le code · avant ta leçon</div>
      </div>
      <div class="rvh-row-end">
        <span class="rvh-row-meta">${fichesLues}/${fichesTotal} lues ${CHEVRON}</span>
      </div>
    </button>
  </div>

  <div class="rvh-coach">
    <img src="/skins/mascot-coach.png" alt="" aria-hidden="true">
    <div class="rvh-coach-bulle">${coachHtml(weakPoints)}</div>
  </div>
</div>`;
}

function coachHtml(weakPoints) {
  const top = weakPoints[0];
  if (top) {
    return `Tu rates souvent les <b>${esc(top.label)}</b>. Rejoue tes fautes avant l'examen blanc.`;
  }
  return `Bienvenue dans ta salle d'entraînement — enchaîne quiz et fiches pour progresser.`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, data) {
  root.querySelector("#rvh-arena")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.arena_play", { world: (data.world?.idx ?? 0) + 1 });
    navigate("/parcours");
  });

  root.querySelector("#rvh-row-exam")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "exam-conduite" });
    navigate("/exam-conduite");
  });

  root.querySelector("#rvh-row-situation")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "en-situation" });
    navigate("/en-situation");
  });

  root.querySelector("#rvh-row-fautes")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "mes-fautes" });
    navigate("/exam-blanc/mes-fautes");
  });

  root.querySelector("#rvh-row-fiches")?.addEventListener("click", () => {
    haptic("tap");
    track("reviser.mode_open", { mode: "revision-conduite" });
    navigate("/revision-conduite");
  });

  root.querySelector("#rvh-row-flash")?.addEventListener("click", () => {
    haptic("tap");
    if (data.flash) {
      track("reviser.mode_open", { mode: "flash-quiz" });
      navigate(`/flash-quiz/${data.flash.id}`);
    } else {
      toast("Pas de quiz éclair pour l'instant.", "info", 3000);
    }
  });
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "eleve_reviser" });

  root.innerHTML = skeletonHtml();

  // Fiches lues (local, instantané)
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHES.filter((f) => read[f.code]).length;

  // Mes fautes (local — exam-blanc + Arène + exam conduite)
  const weakPoints = getWeakPoints({ minSeen: 3, limit: 3 });
  const weakCount = getWeakPoints({ minSeen: 3, limit: 50 }).reduce(
    (n, w) => n + w.wrong,
    0,
  );

  const [valRes, examRes, flashRes, ligueRes] = await Promise.allSettled([
    sb
      .from("validations")
      .select("competence_id, statut")
      .eq("eleve_id", me.id),
    sb
      .from("quiz_attempts")
      .select("score, ref_id")
      .eq("user_id", me.id)
      .eq("type", "exam_blanc"),
    sb
      .from("flash_quizzes")
      .select("id, expires_at, sent_at")
      .eq("sent_to", me.id)
      .is("responded_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("sent_at", { ascending: false })
      .limit(1),
    sb.rpc("get_theory_leaderboard", { p_scope: "ecole", p_limit: 50 }),
  ]);

  // Monde REMC en cours + étoiles
  let world = null;
  if (valRes.status === "fulfilled" && !valRes.value.error) {
    const validatedMap = {};
    for (const v of valRes.value.data || []) {
      if (v.statut === "acquis") validatedMap[v.competence_id] = true;
    }
    world = computeCurrentWorld(validatedMap);
  }

  // Meilleur score de l'examen blanc de CONDUITE (exam-conduite.js écrit
  // quiz_attempts type 'exam_blanc' / ref_id 'exam-conduite', score en %).
  let examBest = null;
  if (examRes.status === "fulfilled" && !examRes.value.error) {
    const attempts = (examRes.value.data || []).filter(
      (a) => a.ref_id === "exam-conduite" && typeof a.score === "number",
    );
    if (attempts.length) {
      examBest = Math.max(...attempts.map((a) => a.score));
    }
  }

  // Quiz éclair en attente
  let flash = null;
  if (
    flashRes.status === "fulfilled" &&
    !flashRes.value.error &&
    flashRes.value.data?.length
  ) {
    const row = flashRes.value.data[0];
    const minsLeft = Math.max(
      1,
      Math.round((new Date(row.expires_at).getTime() - Date.now()) / 60000),
    );
    flash = { id: row.id, minsLeft };
  }

  // Ligue Révision (école, à vie) — repli gracieux : ligne masquée si non classé.
  let ligue = null;
  if (
    ligueRes.status === "fulfilled" &&
    !ligueRes.value.error &&
    Array.isArray(ligueRes.value.data)
  ) {
    const rows = ligueRes.value.data;
    const mine = rows.find((r) => r.is_me === true) || null;
    const total = rows.filter((r) => (r.score ?? 0) > 0).length;
    const classed = !!mine && (mine.score ?? 0) > 0;
    if (classed) {
      ligue = {
        classed: true,
        rank: mine.rang,
        total,
        score: mine.score,
        tier: theoryLeague(mine.score),
      };
    }
  }

  const data = {
    streak: getStreak(),
    world,
    ligue,
    fichesLues,
    fichesTotal: FICHES.length,
    examBest,
    weakPoints,
    weakCount,
    flash,
  };

  root.innerHTML = render(data);
  wire(root, data);
}
