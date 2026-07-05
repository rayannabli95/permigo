// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Réviser » : LA porte unique d'entraînement
// (nav 5 portes — regroupe Arène, examen blanc, fiches conduite,
//  trouve la faute, en situation, question du jour, points faibles)
//
// DA « Arène Néo » : nuit-violet + or (le monde du quiz), exécuté en
// matière premium — plaques « plastique 3D », médaillon doré + badge
// 3D réel, CTA vert relief, et de VRAIS visuels de conduite (volant,
// panneaux routiers, mascotte) à la place des pictos-trait génériques.
//
// Données 100% locales au premier rendu (instantané), enrichies
// ensuite par la question du jour (1 fetch léger).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getStreak } from "@/utils/game-state.js";
import { isDailyDone } from "@/services/daily-quiz.js";
import { getWeakPoints } from "@/utils/weak-points.js";
import { FICHES } from "@/data/fiches-conduite.js";
import { ASSETS } from "@/utils/assets.js";
import { medallion } from "@/utils/medallions.js";

const LS_READ_KEY = "rvc_read_v1"; // même clé que revision-conduite (fiches lues)

// Images réelles conservées : la flamme de série (chip) et le badge 3D de
// l'Arène (hero) fonctionnent déjà comme centres de gravité.
const IMG = {
  flame: ASSETS.streakFlame, // /skins/permigo-streak-flame-v1.webp
  badge: ASSETS.badgeUltimate, // médaillon de l'Arène
};

// ── Set d'icônes COHÉRENT « médaillon » (1 seul style pour les 5 tuiles) :
// disque dégradé + biseau + reflet haut + glyphe blanc. Migré sur la banque
// centrale @/utils/medallions.js pour dédupliquer (fini le set local qui
// dérivait). cls:"rvh-med" conserve le dimensionnement existant (54px).
// Le glyphe « volant » PLEIN remplace enfin le volant en trait (point faible).
const MED = {
  exam: medallion("examen", "gold", { cls: "rvh-med" }),
  fiches: medallion("volant", "violet", { cls: "rvh-med" }),
  faute: medallion("faute", "red", { cls: "rvh-med" }),
  situ: medallion("route", "blue", { cls: "rvh-med" }),
  daily: medallion("ampoule", "green", { cls: "rvh-med" }),
};

// Quelques traits vectoriels soignés (ampoule dégradée, flèche play, chevron,
// cible) — des accents, pas des pictos nus dans un carré.
const SVG = {
  bulb: `<svg class="rvh-bulb" viewBox="0 0 24 24" fill="none" aria-hidden="true"><defs><linearGradient id="rvhGlb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#ffd24a"/><stop offset="1" stop-color="#ff9c1c"/></linearGradient></defs><path d="M12 2.5a6.6 6.6 0 0 0-4 11.85c.7.55 1.1 1.35 1.15 2.2h5.7c.05-.85.45-1.65 1.15-2.2A6.6 6.6 0 0 0 12 2.5Z" fill="url(#rvhGlb)" stroke="#c87d12" stroke-width="1"/><path d="M9.4 19.2h5.2M9.9 21.4h4.2" stroke="#ffe9a8" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.5-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="#ff6b6b" stroke-width="2"/><circle cx="12" cy="12" r="5" stroke="#ffb347" stroke-width="2"/><circle cx="12" cy="12" r="1.6" fill="#ffd24a"/></svg>`,
};

const STYLE = `<style>
/* ── Monde de l'entraînement : Arène nuit-violet + or, en full-bleed sous
      le header vitre (pattern livret). ── */
.rvh {
  --rvh-panel:#271850; --rvh-panel2:#2f1e5e; --rvh-panel-deep:#120a2e;
  --rvh-line:rgba(178,150,255,.22);
  --rvh-mu:#cabfef; --rvh-mu2:#9b8dcf;
  --rvh-gold-1:#ffe9a8; --rvh-gold-2:#ffd24a; --rvh-gold-3:#ff9c1c; --rvh-gold-deep:#c87d12;
  --rvh-violet:#a855f7; --rvh-violet-deep:#7c4dff; --rvh-violet-soft:#cbb9ff;
  --rvh-go-1:var(--a-lt); --rvh-go-2:var(--a); --rvh-go-3:var(--adk); --rvh-go-deep:var(--adk);
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
/* grain subtil (matière, pas plat) */
.rvh::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .05; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>");
}
/* étoiles dorées discrètes */
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
  margin: 2px 2px 13px;
  text-shadow: 0 2px 0 rgba(0,0,0,.3), 0 0 22px rgba(168,85,247,.45);
}

/* ── rituels du jour ── */
.rvh-daily { position: relative; z-index: 3; display: flex; gap: 10px; margin-bottom: 14px; }
.rvh-chip {
  flex: 1; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px;
  background: linear-gradient(180deg, var(--rvh-panel2), var(--rvh-panel));
  border: 1px solid var(--rvh-line);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 8px 18px -12px rgba(0,0,0,.7);
}
.rvh-chip-media {
  width: 38px; height: 38px; flex: none; border-radius: 12px; display: grid; place-items: center; overflow: hidden;
  background: radial-gradient(circle at 40% 30%, rgba(255,156,28,.28), rgba(255,156,28,.06));
  border: 1px solid rgba(255,156,28,.32);
}
.rvh-chip-media img { width: 34px; height: 34px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,.4)); }
.rvh-chip-media.q { background: radial-gradient(circle at 40% 30%, rgba(84,160,255,.24), rgba(84,160,255,.05)); border-color: rgba(84,160,255,.34); }
.rvh-bulb { width: 26px; height: 26px; }
.rvh-chip-t { font: 700 13px/1.12 'Baloo 2', cursive; }
.rvh-chip-s { margin-top: 1px; font: 700 10.5px/1.3 'Nunito', sans-serif; color: var(--rvh-mu2); }

/* ── HERO Arène : plaque plastique 3D ── */
.rvh-arena {
  position: relative; z-index: 3; display: block; width: 100%; text-align: left; cursor: pointer;
  color: inherit; font: inherit; overflow: hidden;
  border: 1.5px solid rgba(255,210,74,.4); border-radius: 26px; padding: 17px 17px 15px; margin-bottom: 16px;
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
/* liseré doré haut (matière plaque) */
.rvh-arena::before {
  content: ""; position: absolute; inset: 0; border-radius: 26px; padding: 1.5px;
  background: linear-gradient(180deg, rgba(255,210,74,.6), rgba(255,210,74,0) 40%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.rvh-arena-k {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; margin-bottom: 10px;
  background: rgba(255,210,74,.16); border: 1px solid rgba(255,210,74,.42);
  font: 600 10px/1 'Fredoka', sans-serif; letter-spacing: .16em; text-transform: uppercase; color: var(--rvh-gold-1);
}
.rvh-arena-row { display: flex; align-items: center; gap: 12px; }
.rvh-arena-txt { flex: 1; min-width: 0; }
.rvh-arena-t {
  font: 800 23px/1.04 'Baloo 2', cursive;
  background: linear-gradient(180deg,#fff 0%,#fff7e0 52%,#ffd86b 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 1px rgba(0,0,0,.25));
}
.rvh-arena-s { margin-top: 6px; font: 700 12.5px/1.4 'Nunito', sans-serif; color: var(--rvh-mu); }

/* médaillon doré + badge 3D réel + ombre 6px flat */
.rvh-medallion { position: relative; width: 88px; height: 88px; flex: none; }
.rvh-medallion .rvh-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 38% 30%, #fff7da 0%, var(--rvh-gold-2) 48%, var(--rvh-gold-3) 100%);
  border: 3px solid #fff5cf;
  box-shadow: 0 6px 0 var(--rvh-gold-deep), 0 14px 26px -8px rgba(0,0,0,.65), inset 0 2px 4px rgba(255,255,255,.6);
}
.rvh-medallion .rvh-ring::after { content: ""; position: absolute; inset: 16%; border-radius: 50%; border: 2px dashed rgba(122,74,5,.28); }
.rvh-medallion img {
  position: absolute; left: 50%; top: 44%; transform: translate(-50%,-50%);
  width: 78px; height: 78px; object-fit: contain;
  filter: drop-shadow(0 6px 8px rgba(0,0,0,.5)) drop-shadow(0 0 12px rgba(255,182,44,.55)); z-index: 2;
}

/* CTA vert plastique 3D */
.rvh-arena-cta {
  position: relative; z-index: 2; margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 9px;
  min-height: 54px; border-radius: 17px;
  background: linear-gradient(180deg, var(--rvh-go-1) 0%, var(--rvh-go-2) 52%, var(--rvh-go-3) 100%);
  box-shadow: inset 0 2px 0 rgba(255,255,255,.55), inset 0 -4px 8px rgba(0,0,0,.22), 0 6px 0 var(--rvh-go-deep), 0 12px 22px -6px color-mix(in srgb, var(--a) 70%, transparent);
  font: 800 19px/1 'Baloo 2', cursive; color: #fff; text-shadow: 0 2px 0 rgba(35,80,4,.6); letter-spacing: .3px;
}
.rvh-arena-cta svg { width: 22px; height: 22px; }

/* ── grille des entraînements ── */
.rvh-h { position: relative; z-index: 3; display: flex; align-items: baseline; justify-content: space-between; margin: 4px 3px 11px; }
.rvh-h h2 { font: 700 16px/1 'Baloo 2', cursive; text-shadow: 0 1px 0 rgba(0,0,0,.3); }
.rvh-h span { font: 700 11px/1 'Nunito', sans-serif; color: var(--rvh-mu2); }

.rvh-modes { position: relative; z-index: 3; display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.rvh-mode {
  position: relative; display: flex; flex-direction: column; gap: 7px; text-align: left; cursor: pointer;
  color: inherit; font: inherit; min-height: 132px;
  border: 1px solid var(--rvh-line); border-radius: 20px; padding: 13px 13px 14px;
  background: linear-gradient(180deg, var(--rvh-panel2) 0%, var(--rvh-panel) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 8px 0 var(--rvh-panel-deep), 0 16px 26px -14px rgba(0,0,0,.75);
  transition: transform .16s cubic-bezier(.23,1,.32,1);
}
.rvh-mode:active { transform: translateY(2px) scale(.99); }
/* liseré violet lumineux */
.rvh-mode::before {
  content: ""; position: absolute; inset: 0; border-radius: 20px; padding: 1px;
  background: linear-gradient(180deg, rgba(178,150,255,.5), rgba(178,150,255,0) 55%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.rvh-mode.wide { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 13px; min-height: 0; }
.rvh-mode.wide .rvh-mode-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }

/* médaillon d'icône (set cohérent) */
.rvh-sign { width: 54px; height: 54px; flex: none; display: grid; place-items: center; }
.rvh-med { width: 54px; height: 54px; display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,.45)); }

.rvh-mode-t { font: 700 15px/1.12 'Baloo 2', cursive; }
.rvh-mode-s { font: 700 11px/1.35 'Nunito', sans-serif; color: var(--rvh-mu2); }
.rvh-mode-meta { margin-top: auto; display: inline-flex; align-items: center; gap: 5px; font: 800 11px/1 'Nunito', sans-serif; color: var(--rvh-gold-1); }
.rvh-mode.wide .rvh-mode-meta { margin-top: 2px; }
.rvh-mode-meta.done { color: #b9f26e; }
.rvh-mode-meta svg { width: 13px; height: 13px; color: var(--rvh-violet-soft); }
.rvh-mode-badge {
  position: absolute; top: 11px; right: 11px;
  font: 600 9px/1 'Fredoka', sans-serif; letter-spacing: .09em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px;
  color: #ffdede; background: rgba(255,107,107,.16); border: 1px solid rgba(255,107,107,.4);
  box-shadow: 0 3px 8px -3px rgba(255,107,107,.5);
}

/* ── points faibles ── */
.rvh-weak {
  position: relative; z-index: 3; margin-top: 15px; border-radius: 20px; padding: 14px 15px;
  background: linear-gradient(180deg, var(--rvh-panel2), var(--rvh-panel)); border: 1px solid var(--rvh-line);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 12px 24px -16px rgba(0,0,0,.75);
}
.rvh-weak-h { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; font: 700 15px/1 'Baloo 2', cursive; }
.rvh-weak-ic { display: inline-grid; place-items: center; width: 26px; height: 26px; flex: none; }
.rvh-weak-ic svg { width: 26px; height: 26px; }
.rvh-weak-row {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 11px 2px; border-top: 1px solid rgba(178,150,255,.12);
  background: none; border-left: 0; border-right: 0; border-bottom: 0;
  color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.rvh-weak-row:first-of-type { border-top: 0; }
.rvh-weak-name { flex: 1; font: 800 13.5px/1.2 'Nunito', sans-serif; }
.rvh-weak-stat { font: 700 10.5px/1 'Nunito', sans-serif; color: var(--rvh-mu2); white-space: nowrap; }
.rvh-weak-go { font: 800 12.5px/1 'Baloo 2', cursive; color: var(--rvh-go-1); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .rvh-arena, .rvh-mode { transition: none; }
  .rvh-stars::before, .rvh-stars::after { animation: none; }
}
</style>`;

// ─── Render ──────────────────────────────────────────────────────
function render({ streak, dailyDone, fichesLues, fichesTotal, weak }) {
  const streakTitle =
    streak.count > 0
      ? `Série : ${streak.count} jour${streak.count > 1 ? "s" : ""}`
      : "Lance ta série";
  const streakSub =
    streak.count > 0
      ? streak.isToday
        ? "Validée pour aujourd'hui ✓"
        : "Révise pour la garder !"
      : "1 session = 1 jour de série";

  const weakRows = weak
    .map(
      (w) => `
    <button class="rvh-weak-row" data-weak>
      <span class="rvh-weak-name">${esc(w.label)}</span>
      <span class="rvh-weak-stat">${w.wrong} erreur${w.wrong > 1 ? "s" : ""} · ${Math.round(w.rate * 100)} % ratées</span>
      <span class="rvh-weak-go">Réviser →</span>
    </button>`,
    )
    .join("");

  return `${STYLE}
<div class="rvh">
  <div class="rvh-stars" aria-hidden="true"></div>

  <h1 class="rvh-title">Réviser</h1>

  <!-- rituels du jour -->
  <div class="rvh-daily">
    <div class="rvh-chip">
      <span class="rvh-chip-media" aria-hidden="true"><img src="${IMG.flame}" alt="" width="34" height="34"></span>
      <div>
        <div class="rvh-chip-t">${streakTitle}</div>
        <div class="rvh-chip-s">${streakSub}</div>
      </div>
    </div>
    <div class="rvh-chip">
      <span class="rvh-chip-media q" aria-hidden="true">${SVG.bulb}</span>
      <div>
        <div class="rvh-chip-t">Question du jour</div>
        <div class="rvh-chip-s">${dailyDone ? "Faite ✓ Reviens demain" : "30 sec · à faire"}</div>
      </div>
    </div>
  </div>

  <!-- HERO Arène : la porte principale -->
  <button class="rvh-arena" id="rvh-arena">
    <span class="rvh-arena-k">Ton arène</span>
    <div class="rvh-arena-row">
      <div class="rvh-arena-txt">
        <div class="rvh-arena-t">Continue ton Arène</div>
        <div class="rvh-arena-s">Quiz sur tes compétences · gagne des volants</div>
      </div>
      <div class="rvh-medallion" aria-hidden="true">
        <span class="rvh-ring"></span>
        <img src="${IMG.badge}" alt="" width="78" height="78">
      </div>
    </div>
    <div class="rvh-arena-cta">${SVG.play} Jouer</div>
  </button>

  <!-- tes entraînements -->
  <div class="rvh-h"><h2>Tes entraînements</h2><span>tout est là 👇</span></div>
  <div class="rvh-modes">
    <button class="rvh-mode" data-go="/exam-blanc">
      <span class="rvh-sign" aria-hidden="true">${MED.exam}</span>
      <div class="rvh-mode-t">Examen blanc</div>
      <div class="rvh-mode-s">40 questions · chrono · comme le vrai</div>
      <span class="rvh-mode-meta">Se tester ${SVG.chevron}</span>
    </button>

    <button class="rvh-mode" data-go="/revision-conduite">
      <span class="rvh-sign" aria-hidden="true">${MED.fiches}</span>
      <div class="rvh-mode-t">Fiches de conduite</div>
      <div class="rvh-mode-s">Le geste, pas que le code</div>
      <span class="rvh-mode-meta">${fichesLues}/${fichesTotal} lues ${SVG.chevron}</span>
    </button>

    <button class="rvh-mode" data-go="/jeu-faute">
      <span class="rvh-mode-badge">Mini-jeu</span>
      <span class="rvh-sign" aria-hidden="true">${MED.faute}</span>
      <div class="rvh-mode-t">Trouve la faute</div>
      <div class="rvh-mode-s">Repère la faute éliminatoire</div>
      <span class="rvh-mode-meta">2 min ${SVG.chevron}</span>
    </button>

    <button class="rvh-mode" data-go="/en-situation">
      <span class="rvh-sign" aria-hidden="true">${MED.situ}</span>
      <div class="rvh-mode-t">En situation</div>
      <div class="rvh-mode-s">Une scène, une décision</div>
      <span class="rvh-mode-meta">6 situations ${SVG.chevron}</span>
    </button>

    <button class="rvh-mode wide" id="rvh-daily-tile">
      <span class="rvh-sign" aria-hidden="true">${MED.daily}</span>
      <div class="rvh-mode-body">
        <div class="rvh-mode-t">Question du jour</div>
        <div class="rvh-mode-s">${dailyDone ? "Fait pour aujourd'hui !" : "Ta dose du jour en 30 sec"}</div>
        <span class="rvh-mode-meta ${dailyDone ? "done" : ""}" id="rvh-daily-meta">${dailyDone ? "Faite ✓" : "À faire"} ${dailyDone ? "" : SVG.chevron}</span>
      </div>
    </button>
  </div>

  ${
    weak.length
      ? `
  <div class="rvh-weak">
    <div class="rvh-weak-h"><span class="rvh-weak-ic" aria-hidden="true">${SVG.target}</span> Tes points faibles</div>
    ${weakRows}
  </div>`
      : ""
  }
</div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, { dailyDone }) {
  // Arène : session révision libre (même entrée que « Continue à réviser »)
  root.querySelector("#rvh-arena")?.addEventListener("click", () => {
    track("reviser.arena_open", {});
    location.hash = "#/quiz/next/post_validation/revision";
  });

  root.querySelectorAll("[data-go]").forEach((btn) =>
    btn.addEventListener("click", () => {
      track("reviser.mode_open", { mode: btn.dataset.go });
      navigate(btn.dataset.go);
    }),
  );

  // Points faibles : la révision par thème vit sur l'écran examen blanc
  root.querySelectorAll("[data-weak]").forEach((btn) =>
    btn.addEventListener("click", () => {
      track("reviser.weak_open", {});
      navigate("/exam-blanc");
    }),
  );

  // Question du jour : enrichissement async (1 fetch léger) — la tuile
  // devient un lancement direct dès que la question est choisie.
  if (!dailyDone) {
    const tile = root.querySelector("#rvh-daily-tile");
    tile?.addEventListener("click", async () => {
      try {
        const me = getCurUser();
        const [{ data: rows }, { pickDailyQuiz }] = await Promise.all([
          sb
            .from("validations")
            .select("competence_id")
            .eq("eleve_id", me.id)
            .eq("statut", "acquis"),
          import("@/services/daily-quiz.js"),
        ]);
        const validated = (rows || [])
          .map((r) => r.competence_id)
          .filter(Boolean);
        const pick = await pickDailyQuiz(me.id, validated);
        track("reviser.daily_open", {});
        if (pick?.competenceId) {
          location.hash = `#/quiz/${pick.competenceId}/post_validation/daily`;
        } else {
          // pas de question dispo → l'Arène libre reste la meilleure porte
          location.hash = "#/quiz/next/post_validation/revision";
        }
      } catch {
        location.hash = "#/quiz/next/post_validation/revision";
      }
    });
  } else {
    root.querySelector("#rvh-daily-tile")?.addEventListener("click", () => {
      location.hash = "#/quiz/next/post_validation/revision";
    });
  }
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "eleve_reviser" });

  // Données locales → rendu instantané, pas de skeleton nécessaire
  let read = {};
  try {
    read = JSON.parse(localStorage.getItem(LS_READ_KEY) || "{}") || {};
  } catch {
    /* noop */
  }
  const fichesLues = FICHES.filter((f) => read[f.code]).length;

  const data = {
    streak: getStreak(),
    dailyDone: isDailyDone(),
    fichesLues,
    fichesTotal: FICHES.length,
    weak: getWeakPoints({ minSeen: 3, limit: 3 }),
  };

  root.innerHTML = render(data);
  wire(root, data);
}
