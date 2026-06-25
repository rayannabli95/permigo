// ═══════════════════════════════════════════════════════════════
// Élève — Parcours REMC (Map immersive v2)
// Inspiration : Apple Health × Duolingo × ancien permigo-v7
// Route SVG sinueuse · Nodes animés · Light theme · Vue Liste (chapitres)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { REMC } from "@/data/remc.js";
import { WORLDS } from "@/data/worlds.js";
import { ASSETS } from "@/utils/assets.js";
import { getCompDetail } from "@/data/remc-details.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { playWhoosh } from "@/utils/sound.js";
import {
  renderChest,
  openChestModal,
  ensureChestStyles,
} from "@/components/eleve/chest.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import {
  maybeShowParcoursTuto,
  showParcoursTuto,
} from "@/components/eleve/parcours-tuto.js";
import {
  unlockChest,
  openChest,
  getMyChests,
  markChestOpened,
} from "@/utils/game-state.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout global avec volant filigrane fixe ── */
.prc {
  padding: 0 0 100px;
  max-width: 480px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  position: relative;
  background-color: var(--bg);
}
.prc::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  width: min(620px, 95vw);
  height: min(620px, 95vw);
  background-image: url('${ASSETS.volantBg}');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  transform: translate(-50%, -50%);
  opacity: .18;
  pointer-events: none;
  z-index: 0;
  filter: blur(0.6px) saturate(.92);
}
/* Gradient teinté par monde — ::before pour passer au-dessus du fond photo */
.prc-world::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    /* Halo « ciel / horizon » en haut du monde → atmosphère qui évolue avec la
       couleur du monde (vert campagne → cyan ville → violet montagne → ambre sommet). */
    radial-gradient(140% 60% at 50% -4%,
      color-mix(in srgb, var(--wc, var(--gr)) 32%, transparent) 0%,
      color-mix(in srgb, var(--wc, var(--gr)) 9%, transparent) 38%,
      transparent 66%),
    /* Fondu vertical de la teinte monde */
    linear-gradient(180deg,
      color-mix(in srgb, var(--wc, var(--gr)) 13%, transparent) 0%,
      color-mix(in srgb, var(--wc, var(--gr)) 6%, transparent) 50%,
      color-mix(in srgb, var(--wc, var(--gr)) 2%, transparent) 100%);
}
/* Tous les contenus passent au-dessus du volant */
.prc > * { position: relative; z-index: 1; }

/* ── Header sticky (sous le header global fixe de 52px) ── */
/* Header en flux normal : la page scrolle entière (plus de sticky qui
   se faisait chevaucher par la barre de progression). */
.prc-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  background: var(--bg);
  border-bottom: 1px solid var(--bo);
}
.prc-title    { font: 800 20px/1.1 'Plus Jakarta Sans', sans-serif; color: var(--ink); display: inline-flex; align-items: center; gap: 8px; }
.prc-help { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--bo4); background: var(--su); color: var(--mu2); font: 800 12px/1 'Inter', sans-serif; cursor: pointer; flex-shrink: 0; -webkit-tap-highlight-color: transparent; transition: border-color .12s, color .12s; position: relative; }
.prc-help::after { content: ''; position: absolute; inset: -11px; }
.prc-help:hover { border-color: var(--a); color: var(--a-txt); }
.prc-help:active { transform: scale(.9); }
.prc-subtitle { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }
.prc-hd-right { text-align: right; }
.prc-total    { font: 800 26px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.prc-total-denom { font-size: 15px; color: var(--mu2); }
.prc-total-lbl{ font: 600 10px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

/* ── Barre de progression globale ── */
.prc-global-bar {
  position: relative; z-index: 51; /* #12 — au-dessus du header sticky (z 50) */
  padding: 12px 20px;
  background: var(--su);
  border-bottom: 1px solid var(--bo2);
}
.prc-global-track {
  height: 6px;
  background: var(--bo);
  border-radius: 3px;
  overflow: hidden;
}
.prc-global-fill {
  height: 100%;
  /* Couleur unique : variations du thème choisi (pas d'arc-en-ciel) */
  background: linear-gradient(90deg, var(--adk), var(--a));
  border-radius: 3px;
  transition: width 1s var(--ease-out);
}
.prc-global-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--mu2);
}

/* ── Carte des mondes — pleine page, le scroll de la page fait tout ── */
.prc-map {
  position: relative;
  z-index: 2;
  margin-top: 6px;
}

/* ── Sections Monde — fond photo z:0, gradient ::before z:1, contenu z:3+ ── */
.prc-world {
  position: relative;
  padding: 0 0 50px;
  overflow: hidden;
  min-height: 240px;
  background: var(--bg);
}
/* Petit visuel décoratif en haut à droite (au lieu de fond pleine page) */
.prc-world-decor {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 56px;
  height: 56px;
  object-fit: contain;
  z-index: 4;
  filter: drop-shadow(0 4px 12px rgba(11,13,26,.15));
  opacity: .8;
  transition: transform .4s var(--ease-snap);
  pointer-events: none;
}
.prc-world.complete .prc-world-decor { opacity: 1; }

/* ── Fond photographique immersif jour/nuit par monde ── */
.prc-world { background: var(--bg); }
.prc-world-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: .7;
  filter: saturate(1.05);
  transition: opacity .6s ease;
  pointer-events: none;
}
.prc-world-bg--active { opacity: 1; }
.prc-world.locked .prc-world-bg { opacity: .18; filter: grayscale(.5) saturate(.7); }
[data-theme="dark"] .prc-world-bg         { opacity: .3; }
[data-theme="dark"] .prc-world-bg--active { opacity: .7; }
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) .prc-world-bg         { opacity: .3; }
  html:not([data-theme="light"]) .prc-world-bg--active { opacity: .7; }
}
@media (prefers-reduced-motion: reduce) { .prc-world-bg { transition: none; } }
/* Filigrane volant atténué quand fond photo présent */
.prc:has(.prc-world-bg)::before { opacity: .08; }

/* En-tête du monde */
.prc-world-hd {
  position: relative;
  z-index: 5;
  padding: 16px 16px 8px;
  text-align: center;
}
.prc-world-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--r-full);
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.8);
  box-shadow: 0 4px 14px rgba(11,13,26,.1);
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.prc-world-badge .num {
  display: inline-flex;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--wc, var(--gr));
  color: #fff;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 900;
}
.prc-world-h2 {
  font: 800 20px/1.1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0 0 3px;
  text-shadow: 0 1px 8px rgba(255,255,255,.8);
}
.prc-world-tagline {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: var(--ink);
  opacity: .82;
  margin-bottom: 8px;
  text-shadow: 0 1px 6px rgba(255,255,255,.95);
}
.prc-world-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--wc, var(--gr));
  padding: 4px 12px;
  border-radius: var(--r-full);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--wc, var(--gr)) 40%, transparent);
}

/* ── Route SVG ── */
.prc-route {
  position: relative;
  padding: 0 10px 36px;
  z-index: 3;
}
.prc-route svg { display: block; width: 100%; height: auto; overflow: visible; }
/* Route 3D : ombre portée + arête épaisse foncée (profondeur) + surface claire + marquage.
   L'arête est nettement décalée vers le bas et plus foncée → effet « rail » relevé. */
.prc-path-shadow { stroke: rgba(11,13,26,.18); stroke-width: 28; fill: none; stroke-linecap: round; filter: blur(5px); transform: translateY(11px); }
/* Arête 3D : trait foncé épais, bien décalé → c'est l'épaisseur visible de la route */
.prc-path-edge   { stroke: color-mix(in srgb, var(--wc, var(--a)) 55%, #1c2536); stroke-width: 26; fill: none; stroke-linecap: round; transform: translateY(7px); }
/* Surface : dégradé clair → teinté monde pour le volume */
.prc-path        { stroke: color-mix(in srgb, var(--wc, var(--a)) 22%, #f3f5fb); stroke-width: 24; fill: none; stroke-linecap: round; }
/* Liseré clair en haut de la surface (lumière) */
.prc-path-edge2  { stroke: rgba(255,255,255,.55); stroke-width: 24; fill: none; stroke-linecap: round; transform: translateY(-2px); opacity: .5; }
/* Marquage central pointillé */
.prc-path-light  { stroke: #fff; stroke-width: 3; stroke-dasharray: 7 13; stroke-linecap: round; fill: none; opacity: .92; }
[data-theme="dark"] .prc-path { stroke: color-mix(in srgb, var(--wc, var(--a)) 34%, #2a3346); }
[data-theme="dark"] .prc-path-edge2 { opacity: .12; }
[data-theme="dark"] .prc-path-light { opacity: .55; }
/* Marquage central qui « défile » → la route avance vers les prochains nodes.
   GPU-cheap (stroke-dashoffset seulement), coupé sous prefers-reduced-motion.
   dasharray = 7 13 → période 20 ; on translate d'une période pour une boucle sans couture. */
@media (prefers-reduced-motion: no-preference) {
  .prc-path-light { animation: prcRoadFlow .9s linear infinite; }
}
@keyframes prcRoadFlow { to { stroke-dashoffset: -20; } }
/* Volant qui roule sur la route (monde en cours) */
.prc-car { filter: drop-shadow(0 3px 6px rgba(11,13,26,.35)); }
.prc-car image { opacity: .9; }

/* ── Nodes (style Duolingo path) ── */
.prc-node {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 6;
  opacity: 0;
  animation: nd-pop .55s var(--ease-spring) both;
  animation-delay: var(--nd-delay, 0s);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
/* Hit-area tactile etendue des nodes de la carte (les pastilles restent petites) */
.prc-node::after { content: ''; position: absolute; inset: -10px; }
@keyframes nd-pop {
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(.25); filter: blur(4px); }
  65%  { opacity: 1; transform: translate(-50%,-50%) scale(1.08); filter: blur(0); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}
.prc-node.locked { cursor: default; pointer-events: none; opacity: .6; }
.prc-node.next   { transform: translate(-50%,-50%) scale(1.15); }
.prc-node.next.nd-pop-done { transform: translate(-50%,-50%) scale(1.15) !important; }
@keyframes nd-pop-next {
  0%   { opacity: 0; transform: translate(-50%,-50%) scale(.25) !important; filter: blur(4px); }
  65%  { opacity: 1; transform: translate(-50%,-50%) scale(1.25) !important; filter: blur(0); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1.15) !important; }
}
.prc-node.next { animation-name: nd-pop-next; }

/* ── Tuile 3D brillante portant le badge PermiGo (le P vert) ──
   Tuile blanche brillante avec arête 3D portée (--tile-dk) colorée selon le
   statut, le badge PermiGo posé dessus + une pastille de statut. */
.nd-circle {
  width: 60px; height: 60px;
  border-radius: var(--r-xl);
  --tile-dk: #c2c8da;
  background: linear-gradient(160deg, #ffffff 0%, #eef1f8 100%);
  box-shadow: 0 6px 0 0 var(--tile-dk), 0 12px 18px -6px rgba(11,13,26,.28);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: box-shadow .18s, transform .15s var(--ease-out);
  flex-shrink: 0;
}
/* Reflet brillant en haut */
.nd-circle::before {
  content: '';
  position: absolute; top: 5px; left: 9px; right: 9px; height: 38%;
  border-radius: 14px 14px 50% 50%;
  background: linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,0));
  pointer-events: none; z-index: 2;
}
/* Badge PermiGo (le P vert) */
.nd-badge {
  display: block; width: 70%; height: 70%; object-fit: contain;
  position: relative; z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.22));
}
/* Pastille de statut (coin bas-droite) */
.nd-stamp {
  position: absolute; bottom: -5px; right: -5px; z-index: 3;
  width: 22px; height: 22px; border-radius: 50%;
  border: 2.5px solid var(--su);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.nd-stamp.done   { background: var(--gr); }
.nd-stamp.next   { background: var(--a); }
.nd-stamp.locked { background: var(--mu2); }
/* Node actif : la pastille de statut chevauchait le badge « TU ES ICI » et est
   redondante (halo + « TU ES ICI » + CTA signalent déjà l'état). On la masque. */
.prc-node.next .nd-stamp,
.prc-node.a_valider .nd-stamp { display: none; }
@media (max-width: 400px) {
  .nd-circle { width: 52px; height: 52px; border-radius: var(--rl); }
}
.prc-node:not(.locked):active .nd-circle {
  transform: translateY(4px);
  box-shadow: 0 2px 0 0 var(--tile-dk), 0 5px 10px -4px rgba(11,13,26,.25);
}
.prc-node:not(.locked):hover .nd-circle {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 0 var(--tile-dk), 0 16px 22px -6px rgba(11,13,26,.3);
}

/* ─ DONE — arête verte + halo discret ─ */
.prc-node.done .nd-circle { --tile-dk: var(--grdk, #047857); }
.prc-node.done .nd-circle::after {
  content: '';
  position: absolute; inset: -7px; border-radius: var(--rx);
  border: 2px solid color-mix(in srgb, var(--gr) 45%, transparent);
  animation: nd-ring-pulse 2.6s ease-out infinite;
  pointer-events: none;
}
@keyframes nd-ring-pulse {
  0%   { transform: scale(.85); opacity: .55; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* ─ NEXT — arête accent, rebond « tu es ici » + anneau ─ */
.prc-node.next .nd-circle { --tile-dk: var(--adk, var(--a)); animation: nd-bob 1.8s ease-in-out infinite; }
@keyframes nd-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-5px); }
}
.prc-node.next .nd-circle::after {
  content: '';
  position: absolute; inset: -8px; border-radius: 26px;
  border: 2.5px solid color-mix(in srgb, var(--a) 55%, transparent);
  animation: nd-ring-pulse 1.9s ease-out infinite;
  pointer-events: none;
}

/* ─ TODO — badge légèrement atténué ─ */
.prc-node.todo .nd-badge { filter: grayscale(.25) opacity(.85); }

/* ─ LOCKED — tuile grise, badge désaturé ─ */
.prc-node.locked .nd-circle { --tile-dk: #c2c8da; background: linear-gradient(160deg, #eef1f8, #dde2ee); }
.prc-node.locked .nd-badge { filter: grayscale(1) opacity(.45); }
.prc-node.locked .nd-circle::before { opacity: .4; }

.nd-wheel-pending { display: none; }

/* ── Case sélectionnée : se soulève vers le haut ── */
.prc-node.selected { z-index: 8; }
.prc-node.selected .nd-circle {
  transform: translateY(-12px) scale(1.12);
  box-shadow: 0 14px 0 0 var(--tile-dk), 0 22px 26px -6px rgba(11,13,26,.3);
  animation: none;
}
.prc-node.selected .nd-lbl { transform: translateY(-8px); }
@media (prefers-reduced-motion: reduce) {
  .prc-node.selected .nd-circle { transform: scale(1.08); }
}

/* Volant qui oscille gauche-droite sur le prochain défi (image PNG) */
.nd-wheel {
  display: block;
  width: 70%;
  height: 70%;
  object-fit: contain;
  animation: ndWheelOsc 1.6s ease-in-out infinite;
  transform-origin: 50% 50%;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
}
@keyframes ndWheelOsc {
  0%, 100% { transform: rotate(-22deg); }
  50%      { transform: rotate(22deg); }
}
/* Volant acquis — silhouette PNG teintée en blanc, rotation lente */
.nd-wheel-done {
  width: 70%;
  height: 70%;
  background-color: #ffffff;
  -webkit-mask: url('/worlds/volant.png') center/contain no-repeat;
          mask: url('/worlds/volant.png') center/contain no-repeat;
  animation: ndSlowSpin 16s linear infinite;
  transform-origin: 50% 50%;
  pointer-events: none;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,.15));
}
@keyframes ndSlowSpin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .nd-wheel,
  .nd-wheel-done,
  .prc-node.next .nd-circle {
    animation: none !important;
  }
}
.prc-node.next .nd-circle::before {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--a) 22%, transparent) 0%, transparent 70%);
  animation: nd-halo 1.8s ease-in-out infinite;
}
@keyframes nd-halo {
  0%,100% { transform: scale(.8);  opacity: .6; }
  50%     { transform: scale(1.15); opacity: 1; }
}
.prc-node.next .nd-circle::after {
  content: '';
  position: absolute;
  inset: -18px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--a) 25%, transparent);
  animation: nd-ring-pulse 1.8s ease-out infinite;
}

/* ─ TODO — blanc, bordure pointillée ─ */
.prc-node.todo .nd-circle {
  background: var(--su);
  border-color: var(--bo);
  border-style: dashed;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
/* Volant grisé statique sur les compétences pas encore débloquées */
.nd-wheel-todo {
  width: 60%;
  height: 60%;
  background-color: var(--bo4);
  -webkit-mask: url('/worlds/volant.png') center/contain no-repeat;
          mask: url('/worlds/volant.png') center/contain no-repeat;
  pointer-events: none;
  opacity: .8;
}
/* Petit point gris (legacy — remplacé par .nd-wheel-todo, à supprimer plus tard) */
.prc-node.todo .nd-circle::before {
  content: none;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--bo4);
  position: absolute;
}

/* ─ LOCKED — gris pâle, volant grisé (uniformisé avec todo) ─ */
.prc-node.locked .nd-circle {
  background: #e5e7eb;
  border-color: #f3f4f6;
  box-shadow: none;
}
.nd-wheel-locked { opacity: .45; }

/* ── Labels flottants sous le node ── */
/* Noms LÉGERS : pour tous les nodes SAUF l'actif/à valider, on retire la grosse
   carte blanche → simple légende discrète (nom seul, gris, sans cadre).
   Propre ET informatif. Le node actif garde sa carte + CTA + « TU ES ICI ». */
.prc-node:not(.next):not(.a_valider) .nd-lbl {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 0;
  box-shadow: none;
  padding: 3px 4px 0;
  max-width: 122px;
  min-width: 0;
}
.prc-node:not(.next):not(.a_valider) .nd-lbl .nd-name {
  font: 600 11px/1.25 'Inter', sans-serif;
  color: var(--mu2);
  margin-bottom: 0;
}
.prc-node:not(.next):not(.a_valider) .nd-lbl .nd-stt { display: none; }
.prc-node.done:not(.next) .nd-lbl .nd-name { color: var(--gr-txt); }
.nd-lbl {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--su) 96%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--bo);
  border-radius: var(--r);
  padding: 6px 10px 7px;
  width: max-content;
  max-width: 184px;
  min-width: 104px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(11,13,26,.08);
  pointer-events: none;
}
/* Nom compétence — ROI typographique */
.nd-lbl .nd-name {
  display: block;
  font: 600 13px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  white-space: normal;
  /* Plus de coupe automatique mid-mot (« ma-nœuvres ») : on passe à la ligne
     aux espaces ; un mot trop long casse sans tiret seulement s'il déborde. */
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: none;
  margin-bottom: 3px;
}
/* Code REMC — caché sur la map (bruit visuel pour le débutant)
   reste accessible dans la fiche détail bottom sheet */
.nd-lbl .nd-code {
  display: none;
  font: 500 10px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .4px;
  margin-bottom: 5px;
}
/* Statut — italique, coloré */
.nd-lbl .nd-stt {
  display: block;
  font: 500 11px/1 'Inter', sans-serif;
  font-style: italic;
}

/* ─── Labels par statut ─── */
.prc-node.done .nd-lbl {
  border-color: rgba(16,185,129,.25);
  box-shadow: 0 6px 18px rgba(16,185,129,.12), 0 0 0 1px rgba(16,185,129,.12);
}
.prc-node.done .nd-lbl .nd-stt { color: var(--gr-txt); }

.prc-node.next .nd-lbl {
  border-color: color-mix(in srgb, var(--a) 30%, transparent);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--a) 15%, transparent), 0 0 0 2px color-mix(in srgb, var(--a) 20%, transparent);
}
.prc-node.next .nd-lbl { padding-bottom: 11px; }
.prc-node.next .nd-lbl .nd-name { color: var(--ink); }
/* Statut "next" rendu comme un bouton tappable → incite au clic */
.prc-node.next .nd-lbl .nd-stt {
  display: inline-block;
  margin-top: 6px;
  padding: 6px 13px;
  background: var(--wc, var(--a));
  color: #fff;
  font: 800 11px/1 'Inter', sans-serif;
  font-style: normal;
  border-radius: var(--r-full);
  box-shadow: 0 3px 10px var(--wg, color-mix(in srgb, var(--a) 40%, transparent));
  /* Le label parent a pointer-events:none (évite de bloquer les nodes voisins).
     On le ré-active uniquement sur cette pastille CTA : le clic remonte alors
     au .prc-node et ouvre la fiche. Sans ça, le bouton « Commence ici → »
     n'était pas cliquable. */
  pointer-events: auto;
  cursor: pointer;
}
.prc-node.next .nd-lbl .nd-stt::after { content: ' →'; }
/* Badge "TU ES ICI" */
.prc-node.next .nd-lbl::before {
  content: 'TU ES ICI';
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--a);
  color: var(--a-ink);
  font: 800 8px/1 'Inter', sans-serif;
  padding: 3px 9px;
  border-radius: var(--r-full);
  letter-spacing: .14em;
  white-space: nowrap;
  box-shadow: 0 3px 10px color-mix(in srgb, var(--a) 35%, transparent);
  animation: tu-bounce 1.6s ease-in-out infinite;
}
@keyframes tu-bounce {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%     { transform: translateX(-50%) translateY(-3px); }
}

.prc-node.todo .nd-lbl .nd-name { color: var(--mu3); }
.prc-node.todo .nd-lbl .nd-stt  { color: var(--mu2); }

.prc-node.a_valider .nd-circle {
  border-color: var(--am);
  background: rgba(245,158,11,.12);
  box-shadow: 0 0 0 4px rgba(245,158,11,.18), 0 8px 22px rgba(245,158,11,.2);
  animation: nd-pop-next 2s ease-in-out infinite;
}
.prc-node.a_valider .nd-lbl {
  border-color: rgba(245,158,11,.35);
  box-shadow: 0 6px 18px rgba(245,158,11,.15), 0 0 0 1px rgba(245,158,11,.2);
}
.prc-node.a_valider .nd-lbl::before {
  content: 'FAIS TON QUIZ';
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--am);
  color: #fff;
  font: 800 8px/1 'Inter', sans-serif;
  padding: 3px 9px;
  border-radius: var(--r-full);
  letter-spacing: .14em;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(245,158,11,.35);
  animation: tu-bounce 1.6s ease-in-out infinite;
}
.prc-node.a_valider .nd-lbl .nd-stt { color: var(--amx); font-weight: 700; }
.nd-wheel-pending {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--am);
  box-shadow: 0 2px 8px rgba(245,158,11,.5);
}

.prc-node.locked .nd-lbl {
  background: color-mix(in srgb, var(--su) 95%, transparent);
  border-color: rgba(203,213,225,.4);
  box-shadow: 0 2px 8px rgba(11,13,26,.06);
}
.prc-node.locked .nd-lbl .nd-name { color: var(--mu2); }
.prc-node.locked .nd-lbl .nd-code { color: var(--bo4); }
.prc-node.locked .nd-lbl .nd-stt  { color: var(--bo4); }

/* ── Portail entre mondes ── */
.prc-portal {
  position: relative;
  z-index: 5;
  padding: 8px 16px 28px;
  text-align: center;
}
.prc-portal-arch { position: relative; width: 100px; height: 130px; margin: 0 auto 12px; }
.prc-portal-arch::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 60%, color-mix(in srgb, var(--wc) 30%, transparent) 0%, transparent 60%);
  filter: blur(8px);
  animation: portal-pulse 3s ease-in-out infinite;
}
@keyframes portal-pulse { 0%,100% { opacity: .5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
.prc-portal-arch svg { position: relative; width: 100%; height: 100%; filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--wc) 25%, transparent)); }
.prc-portal-arch .arch-bg { fill: var(--wc); opacity: .1; }
.prc-portal-arch .arch-stroke { fill: none; stroke: var(--wc); stroke-width: 2.5; stroke-linecap: round; }
.prc-portal-arch .arch-light { fill: none; stroke: rgba(255,255,255,.6); stroke-width: 1; stroke-dasharray: 3 6; stroke-linecap: round; }

.prc-portal .pbadge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: var(--r-full);
  background: rgba(255,255,255,.9);
  border: 1px solid var(--bo);
  font-family: 'Inter', sans-serif;
  font-size: 9.5px;
  font-weight: 800;
  color: var(--wc, var(--a));
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 5px;
  box-shadow: 0 2px 8px rgba(11,13,26,.07);
}
.prc-portal h3 { font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin: 0 0 4px; }
.prc-portal p  { font: 500 12px/1.4 'Inter', sans-serif; color: var(--mu3); max-width: 260px; margin: 0 auto; }
.prc-world.complete .prc-portal h3 { color: var(--wc); }

/* Monde verrouillé → overlay grisé */
.prc-world.locked::after {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  z-index: 8;
  backdrop-filter: grayscale(.8);
  pointer-events: none;
}
.prc-world.locked { background: var(--bg2); }
.prc-world.locked .prc-world-decor { filter: grayscale(.9) opacity(.4); }

/* Pont entre mondes */
.prc-bridge {
  height: 40px;
  position: relative;
  overflow: hidden;
  z-index: 3;
}
.prc-bridge::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -4px;
  bottom: -4px;
  width: 12px;
  transform: translateX(-50%);
  background: rgba(11,13,26,.05);
  border-radius: var(--r-full);
}
.prc-bridge::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background-image: linear-gradient(180deg, var(--mu2) 50%, transparent 0);
  background-size: 2px 10px;
  opacity: .6;
}

/* ── Final — fin du voyage ── */
.prc-final {
  margin: 20px 12px 0;
  padding: 24px 18px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  color: var(--ink);
  border-radius: var(--r-xl);
  text-align: center;
  box-shadow: 0 4px 16px rgba(11,13,26,.07);
  position: relative;
  overflow: hidden;
}
.prc-final::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--a) 6%, transparent), transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(245,158,11,.05), transparent 50%);
  pointer-events: none;
}
.prc-final h3  { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; margin: 0 0 6px; position: relative; color: var(--ink); }
.prc-final p   { font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu3); margin: 0 0 16px; position: relative; }
.prc-final-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; position: relative; }
.prc-final-stat .v { font: 900 22px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; color: var(--ink); }
.prc-final-stat .l { font: 600 9px/1 'Inter', sans-serif; color: var(--mu2); text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }

/* ── Bottom sheet ── */
.bsheet-bg {
  position: fixed;
  inset: 0;
  background: rgba(11,13,26,0);
  z-index: 98;
  pointer-events: none;
  transition: background .3s;
}
.bsheet-bg.open {
  background: rgba(11,13,26,.4);
  pointer-events: auto;
  backdrop-filter: blur(4px);
}
/* Fiche compétence : monte du BAS de l'écran (comme la feuille trophée) */
.bsheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 99;
  background: var(--su);
  border-radius: 24px 24px 0 0;
  border-top: 1px solid var(--bo);
  box-shadow: 0 -8px 32px rgba(11,13,26,.16);
  transform: translateY(100%);
  transition: transform .34s cubic-bezier(.32,.72,0,1);
  touch-action: pan-y;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  will-change: transform;
  max-height: 88vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.bsheet.open { transform: translateY(0); }
/* Poignée en HAUT du panneau (il monte du bas) */
.bsheet-handle {
  width: 40px; height: 4px;
  background: var(--bo);
  border-radius: 2px;
  margin: 10px auto 6px;
  flex-shrink: 0;
  touch-action: none;
  cursor: grab;
}

/* Fiche compétence (bottom sheet content) */
.fiche-hero {
  position: relative;
  padding: 14px 18px 12px;
  text-align: center;
}
.fiche-hero .fiche-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--bg2);
  color: var(--mu);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border: 0;
  transition: transform .14s var(--ease-snap);
}
.fiche-hero .fiche-close:active { transform: scale(.97); }
.fiche-badge-cat {
  font: 700 9.5px/1 'Inter', sans-serif;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 12px;
  text-align: center;
}
.fiche-circle {
  width: 50px; height: 50px;
  border-radius: var(--r-lg);
  margin: 0 auto 10px;
  border: 0;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 22px -6px color-mix(in srgb, var(--wc, var(--a)) 55%, transparent);
  font-size: 22px;
  background: var(--wc, var(--a));
  color: #fff;
}
.fiche-circle.done { box-shadow: 0 8px 22px -6px rgba(16,185,129,.55); }
.fiche-circle.done { background: var(--gr); animation: fiche-pop .55s cubic-bezier(.5,1.6,.4,1) both; }
@keyframes fiche-pop {
  0%  { transform: scale(.3) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.12) rotate(8deg); opacity: 1; }
  100%{ transform: scale(1) rotate(0); }
}
.fiche-hero h3 {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0 0 3px;
}
.fiche-circle svg { width: 26px; height: 26px; }
.fiche-hero .fiche-id {
  font: 600 10.5px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: 1px;
  margin-bottom: 10px;
}
.stt-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: var(--r-full);
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.stt-pill.done   { background: var(--grp2); color: var(--grk2); }
.stt-pill.next   { background: var(--wc, var(--a)); color: #fff; }
.stt-pill.todo   { background: var(--bg2); color: var(--mu3); }
.stt-pill.locked { background: var(--bg2); color: var(--mu2); }

/* padding-bottom large : le dernier bloc (conseil du coach) doit pouvoir
   défiler entièrement au-dessus de la barre de nav fixe (~60px). */
.fiche-body { padding: 0 18px calc(28px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 12px; }

/* ── Fiche compacte (mobile) ── */
.fiche-summary-txt {
  font: 500 13.5px/1.5 'Inter', sans-serif;
  color: var(--mu); margin: 0; text-align: center;
}
.fiche-acc {
  border: 1px solid var(--bo); border-radius: var(--r-md);
  background: var(--bg); overflow: hidden;
}
.fiche-acc > summary {
  list-style: none; cursor: pointer;
  display: flex; align-items: center; gap: 7px;
  padding: 12px 14px;
  font: 700 12px/1 'Inter', sans-serif; color: var(--ink);
  -webkit-tap-highlight-color: transparent;
}
.fiche-acc > summary::-webkit-details-marker { display: none; }
.fiche-acc > summary svg { color: var(--wc, var(--a)); }
.fiche-acc-chev { margin-left: auto; color: var(--mu2); transition: transform .2s; }
.fiche-acc[open] .fiche-acc-chev { transform: rotate(180deg); }
.fiche-acc .fiche-block-list { padding: 0 14px 4px; }
.fiche-acc-tip {
  margin: 4px 12px 12px; padding: 10px 12px;
  background: var(--amp); border-radius: var(--r);
  font: 500 12px/1.45 'Inter', sans-serif; color: var(--amx);
  display: flex; gap: 7px; align-items: flex-start;
}
.fiche-acc-tip svg { color: var(--amx); flex-shrink: 0; margin-top: 1px; }
/* Rythme vertical homogène : on neutralise les marges hétérogènes des blocs
   (14px/10px) au profit d'un gap unique → fiche mieux répartie. */
.fiche-body > * { margin-bottom: 0; }
.fiche-section {
  background: var(--bg);
  border: 1px solid var(--bo);
  border-radius: var(--r-md);
  padding: 14px;
  margin-bottom: 10px;
}
.fiche-section .sec-lbl {
  font: 700 9.5px/1 'Inter', sans-serif;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fiche-section .sec-txt {
  font: 500 13.5px/1.5 'Inter', sans-serif;
  color: var(--ink);
  font-style: italic;
}
.fiche-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--bg3);
  font-size: 13px;
}
.fiche-meta-row:first-of-type { border-top: 0; padding-top: 0; }
.fiche-meta-row .ml { color: var(--mu3); font-weight: 500; }
.fiche-meta-row .mv { color: var(--ink); font-weight: 700; font-family: 'Inter', sans-serif; font-size: 12px; }
.fiche-empty {
  text-align: center;
  padding: 18px;
}
.fiche-empty .em { font-size: 28px; opacity: .4; margin-bottom: 6px; }
.fiche-empty .et { font: 500 12.5px/1.5 'Inter', sans-serif; color: var(--mu2); font-style: italic; }

/* ── Fiche premium v2 (refonte 2026-05) ──────────────────────── */
.fiche-circle svg { width: 36px; height: 36px; stroke: #fff; stroke-width: 2.5; }
.fiche-circle.done svg { stroke: #fff; }

/* Bloc "summary" — phrase d'accroche en texte plein, sous le héros (plus de boîte/guillemet) */
.fiche-summary {
  padding: 2px 8px 4px;
  margin: 0;
  background: transparent;
  border: 0;
  text-align: center;
}
.fiche-summary::before { content: none; }
.fiche-summary p {
  margin: 0;
  font: 600 15.5px/1.5 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  opacity: .82;
  letter-spacing: -.01em;
}

/* Progression chip + barre */
.fiche-progress {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  padding: 4px 6px;
  background: transparent;
  border: 0;
}
.fiche-progress-info {
  flex-shrink: 0;
  text-align: left;
}
.fiche-progress-step {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.fiche-progress-val {
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
}
.fiche-progress-val .of { font-weight: 600; color: var(--mu2); font-size: 13px; }
.fiche-progress-track {
  flex: 1;
  height: 8px;
  background: var(--bg2);
  border-radius: var(--r-full);
  overflow: hidden;
  position: relative;
}
.fiche-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--wc, var(--a)), color-mix(in srgb, var(--wc, var(--a)) 70%, #fff));
  border-radius: var(--r-full);
  transition: width .6s var(--ease);
}

/* Bloc "Ce que tu vas maîtriser" */
.fiche-block {
  background: var(--bg2);
  border: 0;
  border-radius: var(--r-lg);
  padding: 16px 16px 8px;
  margin: 0;
}
.fiche-block-title {
  font: 700 11px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fiche-block-title svg { color: var(--wc, var(--a)); }
.fiche-block-list { list-style: none; margin: 0; padding: 0; }
.fiche-block-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 0;
  font: 500 13.5px/1.4 'Inter', sans-serif;
  color: var(--ink);
  border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}
.fiche-block-list li:first-child { border-top: 0; padding-top: 2px; }
.fiche-block-list .kp-check {
  flex-shrink: 0;
  width: 18px; height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--wc, var(--a)) 16%, transparent);
  color: var(--wc, var(--a));
}

/* Bloc "Conseil du coach" — accent jaune doux */
.fiche-tip {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fef9e7, #fffbeb);
  border: 0;
  border-radius: var(--r-lg);
  margin: 0;
}
.fiche-tip-ico {
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: var(--r);
  background: var(--am);
  color: #fff;
  display: grid;
  place-items: center;
}
.fiche-tip-ico svg { color: #fff; }
.fiche-tip-body { flex: 1; }
.fiche-tip-label {
  font: 700 10px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--amx);
  margin-bottom: 4px;
}
.fiche-tip-text {
  font: 500 13.5px/1.45 'Inter', sans-serif;
  /* Fond crème codé en dur (.fiche-tip) → couleur fixe lisible.
     var(--ink) devenait blanc en dark mode = texte blanc sur fond clair. */
  color: #422006;
}

/* Bloc status contextuel (acquise / next / locked) */
.fiche-status {
  padding: 14px 16px;
  border-radius: var(--r-lg);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.fiche-status.done   { background: #ecfdf5; border: 0; }
.fiche-status.next   { background: color-mix(in srgb, var(--wc, var(--a)) 10%, var(--su)); border: 0; }
.fiche-status.locked { background: var(--bg2); border: 0; }
.fiche-status-ico {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.fiche-status.done   .fiche-status-ico { background: var(--gr); color: #fff; }
.fiche-status.next   .fiche-status-ico { background: var(--wc, var(--a)); color: #fff; }
.fiche-status.locked .fiche-status-ico { background: var(--bo4); color: #fff; }
.fiche-status-body { flex: 1; }
.fiche-status-title {
  font: 700 13px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 2px;
}
.fiche-status-sub {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: var(--mu);
}
/* Variante .done : fond vert clair codé en dur (#ecfdf5) → texte vert foncé fixe.
   Sans ça, var(--ink)/var(--mu) passent au clair en dark mode = illisible
   (le chip "Compétence acquise" apparaissait blanc sur fond clair). */
.fiche-status.done .fiche-status-title { color: #065f46; }
.fiche-status.done .fiche-status-sub   { color: var(--grdk); }
/* Variante .next : fond quasi-blanc (color-mix 8% + #fff), clair dans les 2 modes
   → titre foncé fixe (sinon var(--ink) clair en dark = illisible). */
.fiche-status.next .fiche-status-title { color: var(--ink4); }
.fiche-status.next .fiche-status-sub   { color: var(--mu4); }

/* ── Accessibilité : focus clavier visible ──
   Aucun style :focus n'existait → la navigation clavier était invisible.
   On cible :focus-visible pour ne PAS afficher l'anneau au clic souris. */
.prc-node:focus-visible { outline: none; }
.prc-node:focus-visible .nd-circle {
  outline: 3px solid var(--a);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--a) 28%, transparent);
}
.chest-card:focus-visible,
.fiche-close:focus-visible,
.prc-back:focus-visible,
#prc-back:focus-visible {
  outline: 3px solid var(--a);
  outline-offset: 2px;
  border-radius: var(--r);
}
/* Lien d'évitement clavier vers la carte */
.prc-skip {
  position: absolute; left: 50%; top: 8px; transform: translateX(-50%) translateY(-200%);
  z-index: 60; padding: 10px 16px; border-radius: var(--r);
  background: var(--a); color: var(--a-ink); font: 700 13px/1 'Inter', sans-serif;
  text-decoration: none; transition: transform .15s ease;
}
.prc-skip:focus { transform: translateX(-50%) translateY(0); outline: 2px solid #fff; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .prc-skip { transition: none; } }

/* ── Carte vivante (gated par .prc-anim, ajoutée en JS si IO dispo
   et prefers-reduced-motion absent → fallback 100% statique sinon) ── */
/* Route qui « se dessine » à l'entrée du monde dans le viewport.
   pathLength="1" sur les 3 couches pleines ; la ligne pointillée
   (dasharray absolu) fade-in après le tracé. */
.prc-anim .prc-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: prcRouteDraw 1.1s cubic-bezier(.5,.05,.3,1) both;
  animation-play-state: paused;
}
.prc-anim .prc-world.in .prc-draw { animation-play-state: running; }
@keyframes prcRouteDraw { to { stroke-dashoffset: 0; } }
.prc-anim .prc-path-light { opacity: 0; transition: opacity .6s ease .8s; }
.prc-anim .prc-world.in .prc-path-light { opacity: .9; }
/* Nodes en cascade APRÈS le tracé : on garde nd-pop + --nd-delay,
   simplement mis en pause tant que le monde n'est pas visible. */
.prc-anim .prc-node { animation-play-state: paused; animation-delay: calc(var(--nd-delay, 0s) + .45s); }
.prc-anim .prc-world.in .prc-node { animation-play-state: running; }
/* En-tête et portail du monde glissent doucement */
.prc-anim .prc-world-hd, .prc-anim .prc-portal {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .55s ease, transform .55s var(--ease-out);
}
.prc-anim .prc-world.in .prc-world-hd,
.prc-anim .prc-world.in .prc-portal { opacity: 1; transform: none; }
.prc-anim .prc-world.in .prc-portal { transition-delay: .25s; }
/* Parallax léger sur le fond photo (transform piloté en JS) */
.prc-anim .prc-world-bg { transform: scale(1.08); will-change: transform; }

/* Halo vivant derrière le node courant (respire, couleur du monde) */
.prc-node.next::before {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  width: 96px; height: 96px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--wc, var(--a)) 32%, transparent) 0%, transparent 70%);
  animation: ndHaloLive 2.2s ease-in-out infinite;
  z-index: -1;
  pointer-events: none;
}
@keyframes ndHaloLive {
  0%, 100% { transform: translate(-50%,-50%) scale(.82); opacity: .65; }
  50%      { transform: translate(-50%,-50%) scale(1.18); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .prc-node.next::before { animation: none; }
}

/* ── Indice contextuel zero-state ── */
.prc-hint {
  margin: 0 20px 4px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--a) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: var(--r-md);
  font: 500 13px/1.5 'Inter', sans-serif;
  color: var(--mu);
}

/* ── Bouton recap : scale au press (fallback inline onpointerdown
   couvre les cas où CSS :active ne déclenche pas sur iOS Safari) ── */
@media (prefers-reduced-motion: no-preference) {
  a[href*="post_validation"] {
    transition: transform .2s var(--ease-snap), box-shadow .2s var(--ease-snap);
  }
  a[href*="post_validation"]:active {
    transform: scale(0.97);
    box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--a) 35%, transparent) !important;
  }
}

/* ══ Toggle d'affichage Carte / Liste ══════════════════════════ */
.prc-viewtoggle { display:flex; gap:4px; margin:10px 20px 0; padding:4px; background:var(--bg2); border-radius:var(--r-full); position:relative; z-index:2; }
.prc-vt-btn { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:9px 8px; border:0; background:transparent; border-radius:var(--r-full); font:800 13px/1 'Inter',sans-serif; color:var(--mu2); cursor:pointer; -webkit-tap-highlight-color:transparent; transition:color .15s, background .15s, box-shadow .15s; }
.prc-vt-btn svg { width:16px; height:16px; }
.prc-vt-btn.on { background:var(--su); color:var(--ink); box-shadow:0 2px 8px rgba(11,13,26,.1); }
.prc-vt-btn:not(.on):active { transform:scale(.97); }
.prc-vt-btn:focus-visible { outline:3px solid var(--a); outline-offset:2px; }

/* ══ Vue Liste (chapitres dépliables) ══════════════════════════ */
.prc-list { padding:14px 14px 0; display:flex; flex-direction:column; gap:13px; position:relative; z-index:2; }
.prc-chap { background:var(--su); border:1px solid var(--bo); border-radius:var(--r-xl); overflow:hidden; box-shadow:0 4px 16px -10px rgba(11,13,26,.14); }
.prc-chap-hd { display:flex; align-items:center; gap:13px; padding:14px 16px; position:relative; list-style:none; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.prc-chap-hd::-webkit-details-marker { display:none; }
.prc-chap-hd::before { content:''; position:absolute; left:0; top:13px; bottom:13px; width:4px; border-radius:0 4px 4px 0; background:var(--wc,var(--a)); }
.prc-chap-num { width:44px; height:44px; border-radius:13px; flex-shrink:0; display:grid; place-items:center; font:900 17px/1 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--wc,var(--a)); }
.prc-chap-num svg { color:#fff; }
.prc-chap-main { flex:1; min-width:0; }
.prc-chap-eyebrow { font:700 9.5px/1 'Inter',sans-serif; letter-spacing:.13em; text-transform:uppercase; color:var(--mu2); margin-bottom:4px; }
.prc-chap-title { font:800 15.5px/1.15 'Plus Jakarta Sans',sans-serif; color:var(--ink); margin:0 0 8px; }
.prc-chap-bar { display:flex; align-items:center; gap:9px; }
.prc-chap-bar .track { flex:1; height:6px; background:var(--bg2); border-radius:999px; overflow:hidden; }
.prc-chap-bar .track i { display:block; height:100%; border-radius:999px; background:var(--wc,var(--a)); transition:width .6s var(--ease-out); }
.prc-chap-bar .frac { font:800 11px/1 'Inter',sans-serif; color:var(--mu2); white-space:nowrap; }
.prc-chap-right { flex-shrink:0; display:flex; align-items:center; gap:8px; }
.prc-chap-chev { color:var(--mu2); display:grid; transition:transform .22s var(--ease-out); }
details[open] > .prc-chap-hd .prc-chap-chev { transform:rotate(180deg); }
.prc-chap-badge { display:inline-flex; align-items:center; gap:4px; font:800 8.5px/1 'Inter',sans-serif; letter-spacing:.06em; text-transform:uppercase; color:var(--gr-txt); background:var(--grp2); padding:5px 9px; border-radius:999px; }
.prc-chap-lock { color:var(--mu2); display:grid; }
.prc-chap.locked { background:var(--su2); }
.prc-chap.locked .prc-chap-num { background:var(--bo4); }
.prc-chap.locked .prc-chap-hd { cursor:default; }
.prc-chap.locked .prc-chap-hd::before { background:var(--bo4); }
.prc-chap.locked .prc-chap-title { color:var(--mu3); }
.prc-chap-locknote { padding:0 16px 14px; font:500 12.5px/1.5 'Inter',sans-serif; color:var(--mu3); }
.prc-chap-locknote strong { color:var(--ink); font-weight:700; }
.prc-chap-hd:focus-visible { outline:3px solid var(--a); outline-offset:-3px; border-radius:var(--r-xl); }

.prc-chap-body { padding:2px 10px 10px; }
.prc-row { display:flex; align-items:center; gap:11px; padding:11px 10px; border-radius:var(--r-md); position:relative; -webkit-tap-highlight-color:transparent; }
.prc-row + .prc-row { margin-top:1px; }
.prc-row:not(.locked) { cursor:pointer; }
.prc-row:not(.locked):active { background:var(--bg3); }
.prc-row:focus-visible { outline:3px solid var(--a); outline-offset:-2px; }
.prc-row-ic { width:26px; height:26px; border-radius:50%; flex-shrink:0; display:grid; place-items:center; color:#fff; }
.prc-row-ic svg { color:#fff; }
.prc-row.done .prc-row-ic { background:var(--gr); }
.prc-row.a_valider .prc-row-ic { background:var(--am); }
.prc-row.next .prc-row-ic { background:var(--a); box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 18%,transparent); }
.prc-row.todo .prc-row-ic { background:var(--bg2); }
.prc-row.todo .prc-row-ic::after { content:''; width:7px; height:7px; border-radius:50%; background:var(--bo4); }
.prc-row.locked .prc-row-ic { background:transparent; }
.prc-row.locked .prc-row-ic svg { color:var(--bo4); }
.prc-row-main { flex:1; min-width:0; }
.prc-row-nm { font:600 13.5px/1.3 'Inter',sans-serif; color:var(--ink); }
.prc-row.todo .prc-row-nm, .prc-row.locked .prc-row-nm { color:var(--mu3); font-weight:500; }
.prc-row-sub { display:block; font:500 11px/1.2 'Inter',sans-serif; color:var(--mu2); margin-top:3px; }
.prc-row-st { flex-shrink:0; font:700 11px/1 'Inter',sans-serif; color:var(--mu2); }
.prc-row.done .prc-row-st { color:var(--gr-txt); }
.prc-row.next { background:color-mix(in srgb,var(--a) 8%,transparent); border:1px solid color-mix(in srgb,var(--a) 26%,transparent); }
.prc-row.next .prc-row-nm { font-weight:800; }
.prc-row-go { flex-shrink:0; display:inline-flex; align-items:center; gap:5px; background:var(--a); color:var(--a-ink); font:800 11px/1 'Inter',sans-serif; padding:9px 13px; border-radius:999px; box-shadow:0 3px 9px color-mix(in srgb,var(--a) 40%,transparent); }
.prc-chap .chest-card { margin-top:8px; }

/* ══ Décor immersif : panneaux de signalisation (fond, gouttières) ══ */
.prc-signs { position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
.prc-sign {
  position:absolute; height:auto; opacity:var(--op,.1);
  filter:saturate(.85) blur(var(--blur,1px));
  transform:rotate(var(--rot,0deg));
  -webkit-user-select:none; user-select:none;
}
/* Dark mode : panneaux (souvent fond blanc) atténués pour ne pas éblouir */
[data-theme="dark"] .prc-sign { opacity:calc(var(--op,.1) * .45); filter:grayscale(.35) blur(var(--blur,1px)); }
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) .prc-sign { opacity:calc(var(--op,.1) * .45); filter:grayscale(.35) blur(var(--blur,1px)); }
}
/* Monde verrouillé : panneaux encore plus discrets */
.prc-world.locked .prc-signs { opacity:.45; filter:grayscale(.6); }
/* Filigrane volant déjà atténué par les photos retirées ; avec panneaux on le calme aussi */
.prc:has(.prc-signs)::before { opacity:.10; }

/* ══ Vue Chapitre — Immersif nuit-violet (route sinueuse) ════════
   Tokens de route (modifiables pour re-thèmer toute la route) :
   --cv-road        : couleur du ruban de route (fond sombre)
   --cv-road-edge   : arête intérieure du ruban (violet plus vif)
   --cv-road-done   : portion déjà parcourue / nodes validés (= accent thème)
   --cv-gold        : or de l'étape en cours
   --cv-gold-dk     : arête du bouton or (ton plus sombre)
   --cv-night-1     : fond le plus sombre (haut de l'écran)
   --cv-night-2     : fond intermédiaire
   --cv-mute        : texte secondaire sur fond sombre
════════════════════════════════════════════════════════════════ */
.prc-cv {
  --cv-road:      #1c1338;
  --cv-road-edge: rgba(124,77,255,.4);
  --cv-road-done: var(--a);
  --cv-gold:      #ffd24a;
  --cv-gold-dk:   #b85e00;
  --cv-night-1:   #120a24;
  --cv-night-2:   #1a1030;
  --cv-mute:      #b9aee0;
  --cv-panel:     #2a1b52;
  --cv-node:      60px;

  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(900px 600px at 18% -5%, #2c1a55 0%, transparent 55%),
    radial-gradient(800px 700px at 110% 12%, #3a1d63 0%, transparent 50%),
    linear-gradient(160deg, #0e0820 0%, #160c2c 50%, #0b0719 100%);
  color: #fff;
  /* PAS d'overflow:hidden : min-height:100dvh + hidden pouvait clipper le bas
     sur iOS (barre d'outils dynamique). Le scroll horizontal est déjà géré
     par .prc-cv-screen (overflow-x:hidden). */
  overflow: visible;
}
/* grain de texture discret */
.prc-cv::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: .04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
/* Halo mesh violet en arrière-plan */
.prc-cv::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(620px 380px at 80% 8%, rgba(124,77,255,.22), transparent 60%),
    radial-gradient(520px 480px at 8% 86%, rgba(168,85,247,.14), transparent 60%);
  mix-blend-mode: screen;
}
.prc-cv > * { position: relative; z-index: 1; }

/* scrollable inner */
.prc-cv-screen {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 120px;
}
.prc-cv-screen::-webkit-scrollbar { display: none; }

/* ── Barre du haut : stepper des chapitres + bouton Carte ─────────── */
.prc-cv-topbar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 16px 2px;
}
.prc-cv-chapnav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.prc-cv-cn {
  position: relative;
  min-width: 34px; height: 34px; padding: 0 5px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 11px;
  font: 800 14px/1 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  color: #cdbff5;
  background: rgba(42,27,82,.6);
  border: 1.5px solid rgba(168,85,247,.28);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform .12s, border-color .15s, background .15s, color .15s;
}
/* zone tactile ≥44px sans gonfler le visuel */
.prc-cv-cn::after { content: ""; position: absolute; inset: -6px; }
.prc-cv-cn:active { transform: scale(.93); }
.prc-cv-cn.done { color: #6ef0a4; border-color: rgba(46,200,110,.45); background: rgba(20,80,46,.4); }
.prc-cv-cn.lock { color: #8e7fc0; opacity: .85; }
.prc-cv-cn.cur {
  color: #3a1c00;
  background: linear-gradient(160deg,#ffe08a,#ffb33f);
  border-color: #ffd24a;
  box-shadow: 0 4px 14px -4px rgba(255,156,28,.7), inset 0 1px 0 rgba(255,255,255,.6);
  transform: translateY(-1px);
}
.prc-cv-cn.cur.done { color: #16431f; }
.prc-cv-cn:focus-visible { outline: 2px solid var(--cv-gold); outline-offset: 2px; }

/* Bouton "Carte" — lisible (≥44px tactile), plus un lien gris 11px */
.prc-cv-back {
  position: relative;
  display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto;
  height: 34px; padding: 0 13px;
  font: 800 12px/1 'Inter', sans-serif;
  color: #ece6ff;
  background: rgba(42,27,82,.7);
  border: 1.5px solid rgba(168,85,247,.32);
  border-radius: 11px;
  -webkit-tap-highlight-color: transparent; cursor: pointer;
  transition: transform .12s, border-color .15s, color .15s;
}
.prc-cv-back::after { content: ""; position: absolute; inset: -6px; }
.prc-cv-back:hover { color: #fff; border-color: rgba(168,85,247,.5); }
.prc-cv-back:active { transform: scale(.96); }
.prc-cv-back:focus-visible { outline: 2px solid var(--cv-gold); outline-offset: 2px; }

/* ── HERO : monde courant ─────────────────────────────────────── */
.prc-cv-hero-wrap { padding: 10px 18px 6px; }
.prc-cv-world-card {
  position: relative;
  border-radius: 28px;
  padding: 22px 22px 20px;
  overflow: hidden;
  background:
    radial-gradient(380px 200px at 88% -10%, rgba(168,85,247,.55), transparent 60%),
    linear-gradient(150deg, #3a2070 0%, #2a1655 48%, #1d1040 100%);
  border: 1px solid rgba(168,85,247,.4);
  box-shadow:
    0 1px 0 rgba(255,255,255,.1) inset,
    0 -30px 50px -30px rgba(124,77,255,.7) inset,
    0 24px 44px -18px rgba(10,4,26,.9),
    0 0 50px -16px rgba(124,77,255,.55);
}
/* route stylisée en fond de la carte monde */
.prc-cv-world-card .prc-cv-road-deco {
  position: absolute; right: -26px; top: -12px; width: 170px; height: 200px; opacity: .5; z-index: 0; pointer-events: none;
}
.prc-cv-world-meta { position: relative; z-index: 2; }
.prc-cv-chip {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 12px; border-radius: 20px;
  background: rgba(18,10,36,.55);
  border: 1px solid rgba(255,210,74,.35);
  font: 800 11.5px/1 'Inter', sans-serif; letter-spacing: .06em; text-transform: uppercase;
  color: #ffe1a0;
  box-shadow: 0 2px 10px -4px rgba(255,156,28,.5);
}
.prc-cv-chip .dot { width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(#ffd24a, #ff9c1c); box-shadow: 0 0 8px #ffb840; }
.prc-cv-world-title {
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; font-size: 27px; line-height: 1.02; letter-spacing: -.6px;
  margin: 13px 0 4px;
  text-shadow: 0 2px 14px rgba(10,2,30,.6);
  color: #fff;
}
.prc-cv-world-sub { font-size: 13px; color: #d9cffa; font-weight: 500; max-width: 235px; line-height: 1.35; }
.prc-cv-world-prog { position: relative; z-index: 2; margin-top: 18px; }
.prc-cv-wp-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.prc-cv-wp-top span { font-size: 12px; color: var(--cv-mute); font-weight: 600; }
.prc-cv-wp-top b { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 14px; color: #ffe9a8; }
.prc-cv-wp-bar {
  height: 13px; border-radius: 10px;
  background: rgba(11,5,24,.7);
  box-shadow: inset 0 2px 5px rgba(0,0,0,.55), inset 0 -1px 0 rgba(255,255,255,.05);
  overflow: hidden; position: relative;
}
.prc-cv-wp-fill {
  position: absolute; inset: 0; border-radius: 10px;
  background: linear-gradient(90deg, var(--cv-gold), #ff9c1c 65%, #ff8a0d);
  box-shadow: 0 0 16px rgba(255,156,28,.7), inset 0 1px 0 rgba(255,255,255,.55);
  transition: width .7s var(--ease-out);
}
.prc-cv-wp-fill::after {
  content: ""; position: absolute; inset: 0; border-radius: 10px;
  background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.5) 48%, transparent 76%);
  background-size: 200% 100%;
}
@media (prefers-reduced-motion: no-preference) {
  .prc-cv-wp-fill::after { animation: cvShimmer 3.2s linear infinite; }
}
@keyframes cvShimmer { to { background-position: -200% 0; } }

/* ── Titre section route ─────────────────────────────────────── */
.prc-cv-route-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 22px 4px;
}
.prc-cv-route-head h2 {
  font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -.2px;
  color: #fff;
}
.prc-cv-step-count {
  font-size: 11.5px; font-weight: 700; color: var(--cv-mute);
  padding: 4px 10px; border-radius: 14px;
  background: rgba(42,27,82,.7); border: 1px solid rgba(168,85,247,.25);
}

/* ── ROUTE sinueuse ─────────────────────────────────────────── */
.prc-cv-route {
  position: relative;
  padding: 14px 0 30px;
  margin: 0 22px;
}
.prc-cv-ribbon {
  position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none;
  overflow: visible;
}
.prc-cv-nodes { position: relative; z-index: 2; display: flex; flex-direction: column; }

/* ── Milestone (jalon) ─────────────────────────────────────── */
.prc-cv-ms {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 96px;
}
.prc-cv-ms.left  { justify-content: flex-start;  padding-left: 6px; }
.prc-cv-ms.right { justify-content: flex-end; flex-direction: row-reverse; padding-right: 6px; }
@media (prefers-reduced-motion: no-preference) {
  .prc-cv-ms { opacity: 0; animation: cvRise .5s cubic-bezier(.2,.7,.2,1) forwards; }
  .prc-cv-ms:nth-child(1) { animation-delay: .04s; }
  .prc-cv-ms:nth-child(2) { animation-delay: .10s; }
  .prc-cv-ms:nth-child(3) { animation-delay: .16s; }
  .prc-cv-ms:nth-child(4) { animation-delay: .22s; }
  .prc-cv-ms:nth-child(5) { animation-delay: .28s; }
  .prc-cv-ms:nth-child(6) { animation-delay: .34s; }
  .prc-cv-ms:nth-child(7) { animation-delay: .40s; }
  .prc-cv-ms:nth-child(8) { animation-delay: .46s; }
  .prc-cv-ms:nth-child(9) { animation-delay: .52s; }
}
@keyframes cvRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .prc-cv-ms { opacity: 1; } }

/* ── Node (pastille) ────────────────────────────────────────── */
.prc-cv-node {
  position: relative;
  width: var(--cv-node); height: var(--cv-node);
  border-radius: 50%; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.prc-cv-node:focus-visible { outline: 3px solid var(--cv-gold); outline-offset: 4px; }
.prc-cv-node-ring { position: absolute; inset: -6px; border-radius: 50%; }
.prc-cv-node-face {
  position: absolute; inset: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
/* DONE */
.prc-cv-node.done .prc-cv-node-face {
  background: linear-gradient(160deg, #3ee07e 0%, #22a35a 60%, #178246 100%);
  box-shadow:
    0 5px 0 #0f5e32,
    0 10px 18px -6px rgba(20,120,60,.7),
    inset 0 2px 0 rgba(255,255,255,.55),
    inset 0 -4px 8px rgba(8,50,26,.6);
}
.prc-cv-node.done .prc-cv-node-face svg { filter: drop-shadow(0 1px 1px rgba(0,40,20,.5)); }
/* CURRENT — or, halo pulsé */
.prc-cv-node.current { width: 74px; height: 74px; }
.prc-cv-node.current .prc-cv-node-ring {
  inset: -12px;
  background: radial-gradient(circle, rgba(255,210,74,.45) 30%, transparent 70%);
}
@media (prefers-reduced-motion: no-preference) {
  .prc-cv-node.current .prc-cv-node-ring { animation: cvHalo 2.4s ease-in-out infinite; }
}
@keyframes cvHalo { 0%,100%{transform:scale(.92);opacity:.7;} 50%{transform:scale(1.12);opacity:1;} }
.prc-cv-node.current .prc-cv-node-face {
  background: linear-gradient(160deg, #fff0bf 0%, #ffd24a 42%, #ff9c1c 88%);
  box-shadow:
    0 6px 0 var(--cv-gold-dk),
    0 14px 26px -6px rgba(255,156,28,.75),
    inset 0 2px 0 rgba(255,255,255,.85),
    inset 0 -5px 10px rgba(150,70,0,.5);
}
.prc-cv-node-glint {
  position: absolute; top: 9px; left: 14px; width: 18px; height: 9px;
  border-radius: 50%; background: rgba(255,255,255,.85);
  filter: blur(2px); transform: rotate(-22deg);
}
/* LOCKED */
.prc-cv-node.locked { width: 54px; height: 54px; cursor: default; }
.prc-cv-node.locked .prc-cv-node-face {
  background: linear-gradient(160deg, #3a2c5e 0%, #2a1f48 70%);
  box-shadow:
    0 4px 0 #1a1230,
    0 8px 14px -6px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.08);
}
.prc-cv-node.locked .prc-cv-node-face svg { opacity: .55; }
/* TODO (à venir, non verrouillé) */
.prc-cv-node.todo .prc-cv-node-face {
  background: linear-gradient(160deg, #2e2060 0%, #1e1444 70%);
  box-shadow: 0 4px 0 #160e32, 0 8px 14px -6px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.07);
}

/* ── BOSS du chapitre : destination finale, centré ─────────────── */
.prc-cv-ms.boss {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 132px;
  padding: 8px 0 4px;
}
/* BOSS = PNJ couronne 3D posée sur un halo (pas de pastille ronde) */
.prc-cv-node.bossnode {
  width: 120px; height: 86px;
  display: flex; align-items: center; justify-content: center;
  background: none; box-shadow: none; border: 0; cursor: default;
}
.prc-cv-boss-glow {
  position: absolute; inset: -16px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,210,74,.5) 24%, transparent 66%);
}
.prc-cv-node.bossnode.wait .prc-cv-boss-glow {
  background: radial-gradient(circle, rgba(124,77,255,.4) 24%, transparent 66%);
}
@media (prefers-reduced-motion: no-preference) {
  .prc-cv-node.bossnode.won .prc-cv-boss-glow { animation: cvHalo 2.4s ease-in-out infinite; }
}
.prc-cv-boss-img {
  position: relative; z-index: 1; width: 112px; height: auto;
  filter: drop-shadow(0 10px 18px rgba(10,4,26,.55));
}
/* BOSS vaincu : couronne en gloire, légère flottaison */
.prc-cv-node.bossnode.won .prc-cv-boss-img {
  filter: drop-shadow(0 0 16px rgba(255,184,64,.75)) drop-shadow(0 12px 18px rgba(120,60,0,.5));
}
@media (prefers-reduced-motion: no-preference) {
  .prc-cv-node.bossnode.won .prc-cv-boss-img { animation: cvBossFloat 3.2s ease-in-out infinite; }
}
@keyframes cvBossFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
/* BOSS pas encore vaincu : couronne grisée + cadenas */
.prc-cv-node.bossnode.wait .prc-cv-boss-img {
  filter: grayscale(.85) brightness(.55) drop-shadow(0 8px 14px rgba(10,4,26,.6));
  opacity: .82;
}
.prc-cv-boss-lock {
  position: absolute; z-index: 2; right: 14px; bottom: -2px;
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #2a1f56, #1a1030);
  box-shadow: 0 4px 10px -3px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.12);
}
.prc-cv-boss-card {
  text-align: center;
  max-width: 280px;
  padding: 12px 18px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(58,32,112,.65), rgba(26,16,48,.8));
  border: 1px solid rgba(168,85,247,.35);
  box-shadow: 0 14px 30px -16px rgba(10,4,26,.9), inset 0 1px 0 rgba(255,255,255,.08);
}
.prc-cv-boss-card.won {
  background: linear-gradient(160deg, rgba(120,70,0,.4), rgba(40,24,12,.6));
  border-color: rgba(255,210,74,.5);
  box-shadow: 0 14px 34px -14px rgba(255,156,28,.5), inset 0 1px 0 rgba(255,255,255,.1);
}
.prc-cv-boss-kick {
  font: 800 11px/1 'Inter', sans-serif; letter-spacing: .14em; text-transform: uppercase;
  color: #c9b8ff;
}
.prc-cv-boss-card.won .prc-cv-boss-kick { color: #ffd98a; }
.prc-cv-boss-ttl {
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; font-size: 17px; line-height: 1.1; color: #fff; margin: 5px 0 3px;
}
.prc-cv-boss-sub { font: 500 12px/1.35 'Inter', sans-serif; color: #b9aee0; }
.prc-cv-boss-card.won .prc-cv-boss-sub { color: #f0d9a8; }

/* ── Coffre du chapitre (récompense) ───────────────────────────── */
.prc-cv-chest { margin: 6px 0 2px; }

/* ── Label du jalon ─────────────────────────────────────────── */
.prc-cv-ms-label { max-width: 184px; }
.prc-cv-ms.right .prc-cv-ms-label { text-align: right; }
.prc-cv-ms-ttl {
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  font-weight: 700; font-size: 15px; line-height: 1.1; letter-spacing: -.2px;
  color: #fff;
}
.prc-cv-ms-meta {
  margin-top: 3px; font-size: 11.5px; font-weight: 600; color: var(--cv-mute);
  display: inline-flex; align-items: center; gap: 6px;
}
.prc-cv-ms.right .prc-cv-ms-meta { flex-direction: row-reverse; }
.prc-cv-ms-label.locked .prc-cv-ms-ttl { color: #8b7eb8; }
.prc-cv-ms-label.locked .prc-cv-ms-meta { color: #6f63a0; }
.prc-cv-tag-done { color: #76e6a4; }

/* ── Carte CTA "étape en cours" ─────────────────────────────── */
.prc-cv-current-call {
  position: relative;
  margin: 6px 0 4px;
  padding: 14px 16px; border-radius: 20px;
  background:
    radial-gradient(220px 90px at 80% 0%, rgba(255,210,74,.16), transparent 60%),
    linear-gradient(150deg, rgba(58,33,99,.92), rgba(31,17,64,.92));
  border: 1px solid rgba(255,210,74,.35);
  box-shadow: 0 14px 30px -14px rgba(255,156,28,.55), inset 0 1px 0 rgba(255,255,255,.07);
  max-width: 218px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.prc-cv-current-call:focus-visible { outline: 2px solid var(--cv-gold); outline-offset: 2px; border-radius: 20px; }
.prc-cv-call-kick { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #ffd98a; }
.prc-cv-call-ct {
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  font-weight: 700; font-size: 14.5px; margin: 3px 0 11px; line-height: 1.15; color: #fff;
}
.prc-cv-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 18px; border-radius: 15px; border: none; cursor: pointer;
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; font-size: 14px; letter-spacing: .2px; color: #3a1c00;
  background: linear-gradient(160deg, #ffe48f 0%, #ffd24a 40%, #ff9c1c 100%);
  box-shadow: 0 5px 0 var(--cv-gold-dk), 0 12px 22px -8px rgba(255,156,28,.8), inset 0 1px 0 rgba(255,255,255,.7);
  transition: transform .12s ease, box-shadow .12s ease;
}
.prc-cv-cta:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--cv-gold-dk), 0 6px 14px -8px rgba(255,156,28,.8), inset 0 1px 0 rgba(255,255,255,.7); }
.prc-cv-cta svg { filter: drop-shadow(0 1px 0 rgba(255,255,255,.4)); }

/* ── Gate chapitre suivant ──────────────────────────────────── */
.prc-cv-gate {
  margin: 12px 22px 6px;
  padding: 15px 18px; border-radius: 22px;
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(150deg, rgba(33,18,66,.85), rgba(18,10,36,.85));
  border: 1px dashed rgba(168,85,247,.32);
}
.prc-cv-gate-lock {
  width: 46px; height: 46px; border-radius: 14px; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #2c1f4e, #1c1338);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 4px 0 #140d28;
}
.prc-cv-gate-g1 { font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; color: #cdbff5; }
.prc-cv-gate-g2 { font-size: 11.5px; color: var(--cv-mute); font-weight: 600; margin-top: 2px; }

/* Panneaux routiers en fond de l'itinéraire (comme la vue carte). Volontairement
   TRÈS discrets + assombris : texture de fond qui ne dispute jamais la lisibilité
   des jalons verts ni des étiquettes (cf. retour Rayan). */
.prc-cv .prc-signs { z-index: 0; }
.prc-cv .prc-signs .prc-sign {
  opacity: calc(var(--op, .1) * .55);
  filter: saturate(.45) brightness(.6) blur(calc(var(--blur, 1px) + .8px));
}

/* ── Carte « Chapitre suivant » — destination en bout de route ────── */
.prc-cv-next {
  width: calc(100% - 44px);
  margin: 18px 22px 6px;
  padding: 16px 18px;
  display: flex; align-items: center; gap: 14px; text-align: left;
  border-radius: 22px;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}
.prc-cv-next.open {
  border: 1px solid rgba(168,85,247,.5); cursor: pointer;
  background:
    radial-gradient(120% 140% at 0% 0%, rgba(168,85,247,.5), transparent 55%),
    linear-gradient(150deg, #3a2070 0%, #281552 60%, #1c1142 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,.1) inset,
    0 18px 36px -16px rgba(124,77,255,.7),
    0 0 40px -20px rgba(168,85,247,.6);
  transition: transform .18s var(--ease-out), box-shadow .2s;
}
.prc-cv-next.open:hover { transform: translateY(-2px); }
.prc-cv-next.open:active { transform: translateY(0) scale(.99); }
.prc-cv-next.open:focus-visible { outline: 3px solid var(--cv-gold); outline-offset: 3px; }
.prc-cv-next.locked {
  border: 1px dashed rgba(168,85,247,.3); cursor: default;
  background: linear-gradient(150deg, rgba(33,18,66,.7), rgba(18,10,36,.8));
}
.prc-cv-next-badge {
  width: 50px; height: 50px; flex: 0 0 auto; border-radius: 15px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 22px;
}
.prc-cv-next-badge.open {
  color: #3a1c00;
  background: linear-gradient(160deg, #fff0bf, #ffd24a 55%, #ff9c1c);
  box-shadow: 0 5px 0 var(--cv-gold-dk), 0 10px 18px -6px rgba(255,156,28,.6), inset 0 2px 0 rgba(255,255,255,.7);
}
.prc-cv-next-badge.locked {
  background: linear-gradient(160deg, #2c1f4e, #1c1338);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 4px 0 #140d28;
}
.prc-cv-next-txt { flex: 1 1 auto; min-width: 0; }
.prc-cv-next-kick {
  font: 800 10.5px/1 'Inter', sans-serif; letter-spacing: .12em; text-transform: uppercase;
  color: #c9b8ff; margin-bottom: 4px;
}
.prc-cv-next.locked .prc-cv-next-kick { color: var(--cv-mute); }
.prc-cv-next-ttl {
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 17px;
  color: #fff; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.prc-cv-next-sub { font: 500 11.5px/1.3 'Inter', sans-serif; color: var(--cv-mute); margin-top: 3px; }
.prc-cv-next-go {
  flex: 0 0 auto; width: 38px; height: 38px; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, rgba(255,255,255,.18), rgba(255,255,255,.05));
  border: 1px solid rgba(255,255,255,.18);
}
@media (prefers-reduced-motion: no-preference) {
  .prc-cv-next.open .prc-cv-next-go svg { animation: cvNextArrow 1.6s ease-in-out infinite; }
}
@keyframes cvNextArrow { 0%,100% { transform: translateX(0) } 50% { transform: translateX(3px) } }
</style>`;

// ─── Identité visuelle par monde (PNG premium ChatGPT 3D) ───────
// Couleur = l'accent choisi par l'utilisateur (var(--a)), comme l'accueil :
// « une seule couleur (le thème) guide l'attention ». L'identité de chaque
// monde passe par son image, pas par sa teinte. Seul le badge « validé »
// reste vert (var(--gr), codé en dur dans les états .done).
const ACCENT_GLOW = "color-mix(in srgb, var(--a) 38%, transparent)";
const WORLDS_META = [
  {
    num: 1,
    color: "var(--a)",
    glow: ACCENT_GLOW,
    img: "/skins/permigo-remc-maitrise-vehicule-flag-v1.webp",
  },
  {
    num: 2,
    color: "var(--a)",
    glow: ACCENT_GLOW,
    img: ASSETS.worldC2,
  },
  {
    num: 3,
    color: "var(--a)",
    glow: ACCENT_GLOW,
    img: ASSETS.worldC3,
  },
  {
    num: 4,
    color: "var(--a)",
    glow: ACCENT_GLOW,
    img: ASSETS.worldC4,
  },
];

// Combien de compétences du monde N-1 pour débloquer le monde N
const UNLOCK_REQ = [null, 5, 6, 6];

// ─── Décor immersif : panneaux de signalisation par monde ──────────
// Jeux thématisés (SVG réels dans /public/signs). Rendus en gouttières
// gauche/droite, faible opacité, derrière le contenu → immersion sans
// jamais gêner la lisibilité du texte/des nodes.
const WORLD_SIGNS = [
  // C1 — Maîtriser le véhicule : panneaux fondamentaux
  [
    "stop",
    "cedez-le-passage",
    "sens-interdit",
    "priorite-a-droite",
    "sens-unique",
    "circulation-interdite",
    "route-prioritaire",
    "fin-route-prioritaire",
  ],
  // C2 — Circuler en ville : intersections, ronds-points, partage
  [
    "carrefour-giratoire",
    "danger-feux-tricolores",
    "danger-passage-pietons",
    "sens-unique",
    "stationnement-interdit",
    "interdiction-tourner-gauche",
    "piste-cyclable-obligatoire",
    "priorite-a-droite",
  ],
  // C3 — Conditions difficiles : virages, dépassements, dangers
  [
    "danger-virage-droite",
    "depassement-interdit",
    "route-prioritaire",
    "danger-feux-tricolores",
    "cedez-le-passage",
    "arret-stationnement-interdit",
    "stop",
    "fin-toutes-interdictions",
  ],
  // C4 — Conduite autonome : mix
  [
    "route-prioritaire",
    "carrefour-giratoire",
    "danger-passage-pietons",
    "sens-unique",
    "priorite-a-droite",
    "depassement-interdit",
    "fin-toutes-interdictions",
    "stop",
  ],
];

// Emplacements (gouttières l/r) : top%, taille, opacité, flou, rotation.
// Profondeur façon « atmosphère » (petits/flous au loin, plus gros/nets près).
const SIGN_SLOTS = [
  { side: "l", top: 4, size: 70, op: 0.32, blur: 0.4, rot: -8 },
  { side: "r", top: 12, size: 50, op: 0.24, blur: 1.0, rot: 10 },
  { side: "r", top: 27, size: 82, op: 0.36, blur: 0.2, rot: -5 },
  { side: "l", top: 38, size: 54, op: 0.26, blur: 0.8, rot: 7 },
  { side: "l", top: 56, size: 76, op: 0.34, blur: 0.3, rot: 6 },
  { side: "r", top: 64, size: 58, op: 0.26, blur: 0.7, rot: -9 },
  { side: "r", top: 80, size: 72, op: 0.32, blur: 0.4, rot: 8 },
  { side: "l", top: 89, size: 52, op: 0.24, blur: 0.9, rot: -6 },
];

function renderWorldSigns(idx) {
  const set = WORLD_SIGNS[idx] || WORLD_SIGNS[0];
  return `<div class="prc-signs" aria-hidden="true">${SIGN_SLOTS.map((s, i) => {
    const file = set[i % set.length];
    const off = -8 + (i % 3) * 13; // léger décalage pour éviter l'alignement
    const pos = s.side === "l" ? `left:${off}px` : `right:${off}px`;
    return `<img src="/signs/${file}.svg" alt="" loading="lazy" draggable="false" class="prc-sign" style="top:${s.top}%;${pos};width:${s.size}px;--op:${s.op};--blur:${s.blur}px;--rot:${s.rot}deg">`;
  }).join("")}</div>`;
}

const NOW_MS = Date.now();
const NEW_BADGE_MS = 24 * 60 * 60 * 1000;

// ─── Vue Carte | Liste (persistée localStorage) ──────────────────
const PARCOURS_VIEW_KEY = "permigo_parcours_view";
function loadParcoursView() {
  try {
    const stored = localStorage.getItem(PARCOURS_VIEW_KEY);
    if (stored === "list" || stored === "map" || stored === "chapitre")
      return stored;
    return "chapitre"; // défaut : vue Chapitre (focus sur 1 chapitre à la fois)
  } catch {
    return "chapitre";
  }
}
function saveParcoursView(v) {
  try {
    localStorage.setItem(PARCOURS_VIEW_KEY, v);
  } catch {
    /* localStorage indispo — non bloquant */
  }
}
// Escape ferme la fiche — listener global lié une seule fois (anti-empilement au re-render).
let escBound = false;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "eleve_parcours" });

  root.innerHTML = `${STYLE}<div class="prc"><div class="prc-hd"><div><div class="prc-title">Mon parcours</div><div class="prc-subtitle">31 compétences · Permis B</div></div></div><div style="padding:32px;text-align:center;color:var(--mu2)">Chargement…</div></div>`;

  const { data: valData, error: valErr } = await sb
    .from("validations")
    .select(
      "competence_id, validated_at, statut, score_cognitif, score_consolidation, teacher:profiles!validated_by(prenom, nom)",
    )
    .eq("eleve_id", me.id);
  if (valErr) {
    root.innerHTML = `${STYLE}<div class="prc"><div class="prc-hd"><div><div class="prc-title">Mon parcours</div></div></div>
      <div style="padding:48px 24px;text-align:center;color:var(--mu3)">
        <div style="font-size:40px;margin-bottom:12px">${icon("alert-circle", { size: 30 })}</div>
        <p style="font:600 15px/1.4 'Inter',sans-serif">Ton parcours n'a pas pu se charger.</p>
        <button id="prc-retry" style="margin-top:14px;padding:12px 24px;border:0;background:var(--a);color:var(--a-ink);border-radius:12px;cursor:pointer">Réessayer</button>
      </div></div>`;
    root
      .querySelector("#prc-retry")
      ?.addEventListener("click", () => location.reload());
    return;
  }

  // validatedMap : { compId → entry }  — acquis seulement
  // pendingMap   : { compId → true }   — a_valider (quiz à faire)
  const validatedMap = {};
  const pendingMap = {};
  for (const v of valData || []) {
    if (v.statut === "acquis") {
      validatedMap[v.competence_id] = {
        validated_at: v.validated_at,
        teacherName: v.teacher?.prenom ?? null,
        score_cognitif: v.score_cognitif ?? null,
        score_consolidation: v.score_consolidation ?? null,
      };
    } else if (v.statut === "a_valider") {
      pendingMap[v.competence_id] = true;
    }
  }

  const worldStates = computeWorldStates(validatedMap);

  // Coffres : l'état « ouvert » est la source de vérité DB
  // (chest_unlocks.opened_at via get_my_chests), PAS le localStorage.
  // On aligne aussi le cache LS sur la DB.
  const openedWorlds = new Set();
  try {
    const myChests = await getMyChests();
    for (const c of myChests || []) {
      const m = /^world_(\d+)$/.exec(c?.chest_type || "");
      if (m && c.opened_at) {
        const n = parseInt(m[1], 10);
        openedWorlds.add(n);
        markChestOpened(n); // sync cache LS ← DB
      }
    }
  } catch (_) {
    /* fallback : aucun coffre marqué ouvert si la DB échoue */
  }

  ensureChestStyles();

  // Vue active (Chapitre | Carte | Liste), persistée. Le toggle re-rend la page in-place.
  let view = loadParcoursView();

  // Index du chapitre affiché en vue Chapitre :
  // 1er "in_progress", sinon dernier "complete", sinon 0.
  let currentChapIdx = (() => {
    const ipIdx = worldStates.findIndex((w) => w.status === "in_progress");
    if (ipIdx !== -1) return ipIdx;
    let lastComplete = 0;
    worldStates.forEach((w, i) => {
      if (w.status === "complete") lastComplete = i;
    });
    return lastComplete;
  })();

  const renderAndWire = () => {
    root.innerHTML = renderPage(
      worldStates,
      validatedMap,
      pendingMap,
      openedWorlds,
      view,
      currentChapIdx,
    );
    wire(root, worldStates, validatedMap, pendingMap, me, view);
    // Vue Chapitre : trace la route SVG À TRAVERS les vrais jalons (toute
    // hauteur / tout nombre de jalons), au lieu d'un tracé fixe qui dérive.
    // Planification robuste (double rAF + fonts.ready + ResizeObserver).
    if (view === "chapitre") {
      scheduleRoadLayout(root);
    } else {
      stopRoadLayout();
    }
    // Bouton « ? » du tuto (re-câblé à chaque rendu)
    root
      .querySelector("#prc-help")
      ?.addEventListener("click", showParcoursTuto);
    // Toggle Chapitre / Carte / Liste
    root.querySelectorAll(".prc-vt-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const v = btn.dataset.view;
        if (!v || v === view) return;
        view = v;
        saveParcoursView(v);
        track("parcours.view_switch", { view: v });
        renderAndWire();
      }),
    );
    // Vue Chapitre — lien "Voir la carte" / boutons de navigation entre chapitres
    // Cible : .prc-cv-back[data-view] + .prc-cv-gate[data-chap]
    root.querySelectorAll(".prc-cv-back[data-view]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const v = btn.dataset.view;
        if (!v) return;
        view = v;
        saveParcoursView(v);
        track("parcours.view_switch", { view: v });
        renderAndWire();
      }),
    );
    root
      .querySelectorAll(".prc-cv-next[data-chap], .prc-cv-cn[data-chap]")
      .forEach((el) =>
        el.addEventListener("click", () => {
          const idx = parseInt(el.dataset.chap, 10);
          if (isNaN(idx)) return;
          currentChapIdx = idx;
          track("parcours.chap_switch", { idx, view: "chapitre" });
          renderAndWire();
        }),
      );
    // Vue Chapitre — jalons cliquables (milestones non-next + carte CTA or)
    // Milestones avec data-comp (états done/a_valider/todo)
    root.querySelectorAll(".prc-cv-ms[data-comp]").forEach((ms) => {
      const open = () => {
        haptic("tap");
        const compId = ms.dataset.comp;
        const worldIdx = parseInt(ms.dataset.worldIdx, 10);
        openFiche(
          root,
          compId,
          worldStates[worldIdx],
          validatedMap,
          pendingMap,
        );
        track("parcours.node_tap", { compId, worldIdx, view: "chapitre" });
      };
      ms.addEventListener("click", open);
      ms.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
    // Carte CTA or "Étape en cours" + bouton "Continuer →"
    root
      .querySelectorAll(
        ".prc-cv-current-call[data-comp], .prc-cv-cta[data-comp]",
      )
      .forEach((el) => {
        const open = () => {
          haptic("tap");
          const compId = el.dataset.comp;
          const worldIdx = parseInt(el.dataset.worldIdx, 10);
          openFiche(
            root,
            compId,
            worldStates[worldIdx],
            validatedMap,
            pendingMap,
          );
          track("parcours.node_tap", {
            compId,
            worldIdx,
            view: "chapitre_next",
          });
        };
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          open();
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        });
      });
  };
  renderAndWire();

  // Tuto : 1er passage auto
  maybeShowParcoursTuto();

  // Persister en DB les coffres des mondes complétés (idempotent)
  const CHEST_REWARDS = [
    { xp: 200, gemmes: 50 },
    { xp: 400, gemmes: 100 },
    { xp: 700, gemmes: 175 },
    { xp: 1200, gemmes: 300 },
  ];
  worldStates.forEach((ws, i) => {
    if (ws.status === "complete") {
      const num = i + 1;
      unlockChest(
        `world_${num}`,
        CHEST_REWARDS[i] ?? { xp: 200, gemmes: 50 },
      ).catch(() => {});
    }
  });

  // ── Cinématique plein écran « MONDE X TERMINÉ » quand un monde vient d'être
  //    complété (déblocage du suivant). Idempotente (localStorage pg-unlock-seen).
  //    Prioritaire sur la célébration de compétence → évite 2 overlays empilés. ──
  let unlockShown = false;
  try {
    const { detectAndPlayUnlock } =
      await import("@/components/eleve/world-unlock-cinematic.js");
    const unlockMeta = WORLDS.map((w, i) => ({
      name: w.nom,
      color: WORLDS_META[i].color,
      glow: WORLDS_META[i].glow,
    }));
    const unlockStats = { byWorld: {} };
    worldStates.forEach((ws) => {
      if (ws.status !== "complete") return;
      const dates = ws.subs
        .map((s) => validatedMap[s.c]?.validated_at)
        .filter(Boolean);
      const days = new Set(dates.map((d) => new Date(d).toDateString())).size;
      unlockStats.byWorld[ws.idx + 1] = { comps: ws.total, days, hours: 0 };
    });
    unlockShown = detectAndPlayUnlock({
      worldsCompleted: worldStates
        .filter((w) => w.status === "complete")
        .map((w) => w.idx + 1),
      worldsMeta: unlockMeta,
      stats: unlockStats,
      onEnter: (nextWorldNum) => {
        root
          .querySelector(`[data-world-idx="${nextWorldNum - 1}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    });
  } catch (_) {
    /* best-effort — l'absence de cinématique ne casse pas le parcours */
  }

  // ── Célébration plein écran des compétences acquises pas encore vues ──
  // Couvre le cas "moniteur valide → acquis direct" (aucun moment live côté
  // élève) : on célèbre ici, en fonction des validations du parcours.
  // Idempotent (ledger localStorage), lecture seule, ne change aucun statut.
  // Skip si une cinématique de monde vient de s'afficher (priorité au grand moment).
  let celebrated = 0;
  if (!unlockShown) {
    try {
      const { celebrateNewValidations } =
        await import("@/services/competence-celebration.js");
      celebrated = await celebrateNewValidations({ validations: valData });
    } catch (_) {
      /* best-effort — l'absence de célébration ne casse pas le parcours */
    }
  }

  // ── Flèche "Tu viens de débloquer !" si une comp a été validée < 10 min ──
  // Skip si on vient d'afficher un plein écran (cinématique monde ou compétence).
  if (!unlockShown && !celebrated) {
    const FRESH_MS = 10 * 60 * 1000;
    let fresh = null;
    let freshTs = 0;
    for (const [cid, entry] of Object.entries(validatedMap)) {
      if (!entry.validated_at) continue;
      const ts = new Date(entry.validated_at).getTime();
      if (Date.now() - ts < FRESH_MS && ts > freshTs) {
        fresh = cid;
        freshTs = ts;
      }
    }
    if (fresh) {
      setTimeout(() => flashFreshComp(root, fresh), 400);
    }
  }
}

/**
 * Flèche animée + scroll vers la dernière comp débloquée
 */
function flashFreshComp(root, compId) {
  const node = root.querySelector(`[data-comp="${CSS.escape(compId)}"]`);
  if (!node) return;

  // Scroll smooth vers le node
  node.scrollIntoView({ behavior: "smooth", block: "center" });

  // Crée l'overlay flèche après le scroll
  setTimeout(() => spawnArrow(node, compId), 600);
}

function spawnArrow(node, compId) {
  // Évite doublon
  document.querySelector(".fresh-arrow")?.remove();

  const ind = document.createElement("div");
  ind.className = "fresh-arrow";
  ind.innerHTML = `
    <style>
      .fresh-arrow {
        position: fixed;
        z-index: 320;
        pointer-events: none;
        transform: translate(-50%, -100%);
        animation: faIn .35s var(--ease-spring);
      }
      @keyframes faIn {
        from { opacity: 0; transform: translate(-50%, -130%) scale(.85); }
        to   { opacity: 1; transform: translate(-50%, -100%) scale(1); }
      }
      .fa-bubble {
        background: var(--a);
        color: var(--a-ink);
        padding: 10px 16px;
        border-radius: var(--r-md);
        font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
        white-space: nowrap;
        box-shadow: 0 12px 32px -8px color-mix(in srgb, var(--a) 60%, transparent);
        margin-bottom: 6px;
        position: relative;
      }
      .fa-bubble::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 10px; height: 10px;
        background: var(--a);
      }
      .fa-arrow {
        width: 28px;
        height: 40px;
        margin: 0 auto;
        color: var(--a-txt);
        animation: faBounce 1.2s ease-in-out infinite;
        filter: drop-shadow(0 4px 8px color-mix(in srgb, var(--a) 40%, transparent));
      }
      @keyframes faBounce {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(8px); }
      }
      .fresh-arrow.dismiss { animation: faOut .25s ease forwards; }
      @keyframes faOut {
        to { opacity: 0; transform: translate(-50%, -130%) scale(.85); }
      }
      @media (prefers-reduced-motion: reduce) {
        .fresh-arrow, .fa-arrow { animation: none !important; }
      }
    </style>
    <div class="fa-bubble">Tu viens de débloquer : ${esc(resolveCompName(compId))}</div>
    <svg class="fa-arrow" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 0 L12 32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M3 24 L12 36 L21 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  `;
  document.body.appendChild(ind);

  function position() {
    const rect = node.getBoundingClientRect();
    ind.style.left = `${rect.left + rect.width / 2}px`;
    ind.style.top = `${rect.top - 8}px`;
  }
  position();
  window.addEventListener("scroll", position, { passive: true });
  window.addEventListener("resize", position);

  const dismiss = () => {
    ind.classList.add("dismiss");
    setTimeout(() => {
      ind.remove();
      window.removeEventListener("scroll", position);
      window.removeEventListener("resize", position);
    }, 280);
  };

  // Tap node = disparaît
  node.addEventListener("click", dismiss, { once: true });
  // Auto-dismiss après 8s
  setTimeout(dismiss, 8000);
}

// ─── Logique métier ───────────────────────────────────────────────
function computeWorldStates(validatedMap) {
  const states = REMC.map((cat, idx) => {
    const world = WORLDS[idx];
    const subs = cat.subs;
    const done = subs.filter((s) => validatedMap[s.c]).length;
    const total = subs.length;
    const pct = Math.round((done / total) * 100);
    const complete = done === total;

    let status;
    if (idx === 0) {
      status = complete ? "complete" : "in_progress";
    } else {
      const prevDone = REMC[idx - 1].subs.filter(
        (s) => validatedMap[s.c],
      ).length;
      const req = UNLOCK_REQ[idx];
      status =
        prevDone < req ? "locked" : complete ? "complete" : "in_progress";
    }

    const nextChallenge =
      status !== "locked" && !complete
        ? (subs.find((s) => !validatedMap[s.c])?.c ?? null)
        : null;

    const prevDoneCount =
      idx > 0
        ? REMC[idx - 1].subs.filter((s) => validatedMap[s.c]).length
        : null;

    return {
      idx,
      world,
      cat,
      subs,
      done,
      total,
      pct,
      complete,
      status,
      nextChallenge,
      prevDoneCount,
    };
  });

  // ─ Garde UN SEUL nextChallenge global (le 1er monde in_progress dans l'ordre) ─
  // Empêche d'afficher 2 volants si C1 et C2 sont tous les deux in_progress.
  let foundOne = false;
  for (const s of states) {
    if (!foundOne && s.nextChallenge) {
      foundOne = true; // celui-ci garde son next
    } else {
      s.nextChallenge = null; // les autres mondes : pas de next
    }
  }
  return states;
}

/** Résout le nom humain d'une compétence depuis son ID (ex: C1A → "Manœuvres : créneau") */
function resolveCompName(compId) {
  if (!compId) return "";
  const normalized = compId.toLowerCase();
  for (const cat of REMC) {
    const sub = cat.subs.find((s) => s.c.toLowerCase() === normalized);
    if (sub) return sub.n;
  }
  return compId;
}

function compStatus(
  compId,
  worldStatus,
  nextChallenge,
  validatedMap,
  pendingMap,
) {
  if (worldStatus === "locked") return "locked";
  if (validatedMap[compId]) return "done";
  if (pendingMap?.[compId]) return "a_valider";
  if (compId === nextChallenge) return "next";
  return "todo";
}

// ─── Render principal ─────────────────────────────────────────────
function renderPage(
  worldStates,
  validatedMap,
  pendingMap,
  openedWorlds = new Set(),
  view = "map",
  currentChapIdx = 0,
) {
  // ── Vue Chapitre : template full-screen immersif sombre (edge-to-edge) ──
  // Pas de header clair, pas de toggle visible, pas de barre globale.
  // Le fond violet nuit déborde sous la topbar app (comportement voulu).
  if (view === "chapitre") {
    return `${STYLE}
${renderChapterView(worldStates, validatedMap, pendingMap, currentChapIdx, openedWorlds)}

<!-- Bottom sheet -->
<div class="bsheet-bg" id="bsheet-bg" aria-hidden="true"></div>
<div class="bsheet" id="bsheet" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="bsheet-title">
  <div class="bsheet-handle" aria-hidden="true"></div>
  <div id="bsheet-body"></div>
</div>`;
  }

  const totalDone = worldStates.reduce((s, w) => s + w.done, 0);
  const totalComps = worldStates.reduce((s, w) => s + w.total, 0);
  const globalPct = Math.round((totalDone / totalComps) * 100);

  // Zero-state hint: shown only when the student hasn't validated any competence yet.
  const zeroStateHint =
    totalDone === 0
      ? `<div style="margin:0 20px 4px;padding:12px 14px;background:color-mix(in srgb,var(--a) 8%,transparent);border:1px solid color-mix(in srgb,var(--a) 20%,transparent);border-radius:var(--r-md);font:500 13px/1.5 'Inter',sans-serif;color:var(--mu)">
        Chaque étape = une compétence du permis.<br>Ton moniteur la valide en séance — elle s'allume ici automatiquement.
       </div>`
      : "";

  return `${STYLE}
<div class="prc">

  <a href="#prc-map-scroll" class="prc-skip">Aller à la carte</a>

  <!-- Header -->
  <div class="prc-hd">
    <div>
      <h1 class="prc-title" tabindex="-1">Ta carte du permis <button class="prc-help" id="prc-help" type="button" aria-label="Comment marche la carte ?">?</button></h1>
      <div class="prc-subtitle">Valide les ${totalComps} compétences pour décrocher ton permis B</div>
    </div>
    <div class="prc-hd-right">
      <div class="prc-total">${totalDone}<span class="prc-total-denom">/${totalComps}</span></div>
      <div class="prc-total-lbl">compétences acquises</div>
    </div>
  </div>

  <!-- Barre globale -->
  <div class="prc-global-bar">
    <div class="prc-global-track" role="progressbar"
         aria-valuenow="${globalPct}" aria-valuemin="0" aria-valuemax="100"
         aria-label="Progression du parcours : ${globalPct}%, ${totalDone} compétences sur ${totalComps}">
      <div class="prc-global-fill" style="width:${globalPct}%"></div>
    </div>
    <div class="prc-global-meta">
      <span>${totalDone === 0 ? "Commence ta première compétence" : `${globalPct}% de compétences acquises`}</span>
      <span>${totalComps - totalDone} ${totalComps - totalDone === 1 ? "restante" : "restantes"}</span>
    </div>
  </div>

  <!-- Toggle Itinéraire (vue Chapitre immersive) / Carte / Liste -->
  <div class="prc-viewtoggle" role="tablist" aria-label="Mode d'affichage du parcours">
    <button class="prc-vt-btn ${view === "chapitre" ? "on" : ""}" data-view="chapitre" type="button" role="tab" aria-selected="${view === "chapitre"}">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 20c0-6 12-4 12-10"/><circle cx="6" cy="20" r="1.7" fill="currentColor" stroke="none"/><circle cx="18" cy="10" r="1.7" fill="currentColor" stroke="none"/></svg> Itinéraire
    </button>
    <button class="prc-vt-btn ${view === "map" ? "on" : ""}" data-view="map" type="button" role="tab" aria-selected="${view === "map"}">
      ${icon("map", { size: 16 })} Carte
    </button>
    <button class="prc-vt-btn ${view === "list" ? "on" : ""}" data-view="list" type="button" role="tab" aria-selected="${view === "list"}">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.2" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="4.2" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4.2" cy="18" r="1.4" fill="currentColor" stroke="none"/></svg> Liste
    </button>
  </div>

  ${zeroStateHint}

  <!-- Carte des mondes — pleine page, scroll naturel (plus d'encadré interne) -->
  <div class="prc-map" id="prc-map-scroll" tabindex="-1" role="region" aria-label="Carte d'apprentissage">
    ${
      view === "list"
        ? `<div class="prc-list">${renderListView(worldStates, validatedMap, pendingMap, openedWorlds)}</div>`
        : worldStates
            .map((ws, i) =>
              renderWorldSection(
                ws,
                validatedMap,
                pendingMap,
                i < worldStates.length - 1,
                openedWorlds,
              ),
            )
            .join("")
    }
    ${renderFinal(totalDone, totalComps)}
    <div style="height: 24px"></div>
  </div>

</div>

<!-- Bottom sheet -->
<div class="bsheet-bg" id="bsheet-bg" aria-hidden="true"></div>
<div class="bsheet" id="bsheet" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="bsheet-title">
  <div class="bsheet-handle" aria-hidden="true"></div>
  <div id="bsheet-body"></div>
</div>`;
}

// ─── Render d'un monde avec route SVG + nodes ─────────────────────
function renderWorldSection(
  ws,
  validatedMap,
  pendingMap,
  hasNext,
  openedWorlds = new Set(),
) {
  const { idx, cat, subs, done, total, status, nextChallenge } = ws;
  const meta = WORLDS_META[idx];
  const world = WORLDS[idx];
  const isLocked = status === "locked";
  const isComplete = status === "complete";

  // ─ Génération route SVG sinueuse ─
  // W ≈ largeur réelle rendue (≈ conteneur 480) pour éviter la distorsion
  // horizontale du trait : avant W=280 + preserveAspectRatio="none" étirait
  // la route ~1,7× en largeur (route trop grosse/déformée).
  const W = 440;
  // Zigzag franc → les virages "consomment" la distance à l'horizontale, donc
  // on peut resserrer la verticale (~108px/node) sans empiler les étiquettes
  // (nodes consécutifs de côtés opposés). Route plus compacte ET plus "route".
  const H = Math.max(330, subs.length * 108 + 50);

  const ZIG = 0.27; // amplitude du zigzag (part de W de chaque côté du centre)
  const points = subs.map((sub, i) => {
    const yPct = (i + 0.5) / subs.length;
    // Alternance stricte gauche/droite à chaque étape = vrais virages.
    const xPct = 0.5 + (i % 2 === 0 ? ZIG : -ZIG);
    return { c: sub.c, n: sub.n, x: xPct * W, y: yPct * H };
  });

  let pathD = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i],
      pp = points[i - 1];
    const my = (pp.y + p.y) / 2;
    pathD += ` C ${pp.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }
  pathD += ` L ${points[points.length - 1].x} ${H}`;

  const nodesHTML = points
    .map((p, i) => {
      const st = compStatus(
        p.c,
        status,
        nextChallenge,
        validatedMap,
        pendingMap,
      );
      const xp = ((p.x / W) * 100).toFixed(2);
      const yp = ((p.y / H) * 100).toFixed(2);
      const delay = (i * 0.07 + 0.12).toFixed(2);
      const sttLabel = {
        done: "Acquis",
        a_valider: "À valider",
        next: "Commence ici",
        todo: "Pas encore travaillée",
        locked: "Verrouillé",
      }[st];

      // Badge PermiGo (le P vert) dans la tuile, + pastille de statut.
      const BADGE = "/skins/avatars/permigo-badge-icon.png";
      const stamp = {
        done: `<span class="nd-stamp done">${icon("check", { size: 12, strokeWidth: 3 })}</span>`,
        a_valider: `<span class="nd-stamp done">${icon("check", { size: 12, strokeWidth: 3 })}</span>`,
        next: `<span class="nd-stamp next">${icon("zap", { size: 11, strokeWidth: 2.6 })}</span>`,
        todo: "",
        locked: `<span class="nd-stamp locked">${icon("lock", { size: 10, strokeWidth: 2.6 })}</span>`,
      }[st];

      const isLocked = st === "locked";
      return `
      <div class="prc-node ${st}" data-comp="${esc(p.c)}" data-world-idx="${idx}"
           style="left:${xp}%;top:${yp}%;--wc:${meta.color};--wg:${meta.glow};--nd-delay:${delay}s"
           ${!isLocked ? `role="button" tabindex="0"` : 'aria-hidden="true"'}
           aria-label="${esc(p.n)} — ${esc(sttLabel)}">
        <div class="nd-circle"><img class="nd-badge" src="${BADGE}" alt="" aria-hidden="true"/>${stamp}</div>
        <div class="nd-lbl" aria-hidden="true">
          <span class="nd-name">${esc(p.n)}</span>
          <span class="nd-code">${esc(p.c.toUpperCase())}</span>
          <span class="nd-stt">${esc(sttLabel)}</span>
        </div>
      </div>`;
    })
    .join("");

  // Message monde verrouillé
  const lockMsg = isLocked
    ? (() => {
        const req = UNLOCK_REQ[idx];
        const prevDone = ws.prevDoneCount ?? 0;
        const need = req - prevDone;
        return `<div style="position:relative;z-index:9;text-align:center;padding:12px 16px;font:500 13px/1.4 'Inter',sans-serif;color:var(--mu3)">Valide encore <strong style="color:var(--ink)">${need} compétence${need > 1 ? "s" : ""}</strong> dans le monde précédent pour ouvrir celui-ci.</div>`;
      })()
    : "";

  const isActive = status === "in_progress";

  // Volant qui « roule » sur le tracé du monde en cours (immersion Tier 2).
  // SVG <animateMotion> = coordonnées exactes du path (pas de souci d'échelle) ;
  // uniquement le monde actif ; coupé sous prefers-reduced-motion.
  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const carHTML =
    isActive && !reducedMotion
      ? `<g class="prc-car" aria-hidden="true"><image href="/worlds/volant.png" width="28" height="28" x="-14" y="-14" /><animateMotion dur="${Math.max(6, Math.round(H / 110))}s" repeatCount="indefinite" rotate="0" calcMode="linear" path="${pathD}" /></g>`
      : "";

  return `
<section class="prc-world ${isLocked ? "locked" : ""} ${isComplete ? "complete" : ""} ${isActive ? "active" : ""}"
         data-world-idx="${idx}"
         style="--wc:${meta.color};--wg:${meta.glow}">
  <!-- Décor immersif : panneaux de signalisation en gouttières (fond, faible opacité) -->
  ${renderWorldSigns(idx)}
  <!-- Petit visuel décoratif top-right (plus de photo plein écran : illisible + hors charte) -->
  <img src="${meta.img}" alt="" class="prc-world-decor" loading="lazy" draggable="false">


  <!-- En-tête monde -->
  <div class="prc-world-hd">
    <div class="prc-world-badge" style="color:${meta.color}">
      <span class="num">${meta.num}</span>
      ${esc(world.nom)}
    </div>
    <div class="prc-world-h2">${esc(world.titre)}</div>
    <div class="prc-world-tagline">${esc(world.description)}</div>
    <div class="prc-world-count">
      ${done} / ${total} acquises
      ${isComplete ? " " + icon("trophy", { size: 15 }) : ""}
    </div>
  </div>

  ${lockMsg}

  <!-- Route + nodes -->
  <div class="prc-route" style="min-height:${H}px">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">
      <path class="prc-path-shadow prc-draw" d="${pathD}" pathLength="1" />
      <path class="prc-path-edge prc-draw"   d="${pathD}" pathLength="1" />
      <path class="prc-path prc-draw"        d="${pathD}" pathLength="1" />
      <path class="prc-path-edge2"  d="${pathD}" />
      <path class="prc-path-light"  d="${pathD}" />
      ${carHTML}
    </svg>
    ${nodesHTML}
  </div>

  <!-- Portail de fin de monde -->
  <div class="prc-portal">
    ${renderPortalArch(meta.color, isComplete)}
    <div class="pbadge">${isComplete ? "✓ Toutes acquises" : `${total - done} à valider`}</div>
    <h3>${isComplete ? `Monde ${meta.num} bouclé !` : `Continue — tu avances bien`}</h3>
    <p>${
      isComplete
        ? hasNext
          ? `Monde ${idx + 2} débloqué — continue ta progression.`
          : `Bravo, tu as maîtrisé toutes les compétences !`
        : hasNext
          ? `Valide toutes les compétences de ce monde pour passer au suivant.`
          : `Plus que ${total - done} compétence${total - done > 1 ? "s" : ""} et tu touches au but.`
    }</p>
  </div>

  ${
    isComplete
      ? renderChest({
          worldNum: meta.num,
          worldName: world.nom,
          opened: openedWorlds.has(meta.num),
        })
      : ""
  }

  ${hasNext ? '<div class="prc-bridge"></div>' : ""}
</section>`;
}

function renderPortalArch(color, isComplete) {
  return `
<div class="prc-portal-arch">
  <svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg">
    <path class="arch-bg" d="M 20 170 L 20 80 Q 20 20, 65 20 Q 110 20, 110 80 L 110 170 Z" />
    <path class="arch-stroke" d="M 20 170 L 20 80 Q 20 20, 65 20 Q 110 20, 110 80 L 110 170" />
    <path class="arch-light"  d="M 30 170 L 30 80 Q 30 30, 65 30 Q 100 30, 100 80 L 100 170" />
    ${
      isComplete
        ? `
      <circle cx="65" cy="70" r="5" fill="${color}" opacity=".9"/>
      <circle cx="65" cy="70" r="12" fill="none" stroke="${color}" stroke-width="1.5" opacity=".5">
        <animate attributeName="r" values="6;20" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".8;0" dur="2s" repeatCount="indefinite"/>
      </circle>`
        : ""
    }
  </svg>
</div>`;
}

// ─── Vue Chapitre (focus 1 chapitre à la fois) ───────────────────
// ─── Vue Chapitre — Route sinueuse immersive (fidèle au mockup) ──
function renderChapterView(
  worldStates,
  validatedMap,
  pendingMap,
  currentIdx,
  openedWorlds = new Set(),
) {
  const ws = worldStates[currentIdx];
  const meta = WORLDS_META[currentIdx];
  const world = ws.world ?? {};
  const chapTitle = world.titre ?? world.nom ?? `Chapitre ${currentIdx + 1}`;
  const chapPct = ws.total ? Math.round((ws.done / ws.total) * 100) : 0;
  const nextWs = worldStates[currentIdx + 1] ?? null;

  // ── Hero monde courant (carte avec route décorative en fond) ─────
  const heroHTML = `
    <div class="prc-cv-hero-wrap">
      <div class="prc-cv-world-card">
        <!-- Route décorative SVG en fond de la carte -->
        <svg class="prc-cv-road-deco" viewBox="0 0 170 200" fill="none" aria-hidden="true">
          <path d="M120 -10 C 60 30, 150 70, 80 110 S 30 170, 110 210"
                stroke="rgba(255,255,255,.18)" stroke-width="26" stroke-linecap="round"/>
          <path d="M120 -10 C 60 30, 150 70, 80 110 S 30 170, 110 210"
                stroke="rgba(255,210,74,.5)" stroke-width="2.5" stroke-dasharray="9 12" stroke-linecap="round"/>
        </svg>
        <div class="prc-cv-world-meta">
          <span class="prc-cv-chip"><span class="dot" aria-hidden="true"></span>Chapitre ${currentIdx + 1} sur ${worldStates.length}</span>
          <h1 class="prc-cv-world-title">${esc(chapTitle)}</h1>
          <p class="prc-cv-world-sub">${esc(world.description ?? "")}</p>
        </div>
        <div class="prc-cv-world-prog">
          <div class="prc-cv-wp-top">
            <span>Progression du chapitre</span>
            <b>${ws.done} / ${ws.total} jalons</b>
          </div>
          <div class="prc-cv-wp-bar"
               role="progressbar" aria-valuenow="${chapPct}" aria-valuemin="0" aria-valuemax="100"
               aria-label="${ws.done} jalons sur ${ws.total} acquis">
            <div class="prc-cv-wp-fill" style="width:${chapPct}%"></div>
          </div>
        </div>
      </div>
    </div>`;

  // ── Route sinueuse + jalons en quinconce ─────────────────────────
  let routeHTML = "";
  if (ws.status === "locked") {
    // Chapitre verrouillé : pas de route, juste un gate
    const req = UNLOCK_REQ[currentIdx] ?? 0;
    const need = Math.max(0, req - (ws.prevDoneCount ?? 0));
    routeHTML = `
      <div class="prc-cv-gate" style="margin-top:24px">
        <div class="prc-cv-gate-lock" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" stroke="#a48fe0" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#a48fe0" stroke-width="2"/></svg>
        </div>
        <div>
          <div class="prc-cv-gate-g1">${esc(chapTitle)}</div>
          <div class="prc-cv-gate-g2">Valide encore <strong style="color:#cdbff5">${need} compétence${need > 1 ? "s" : ""}</strong> du chapitre précédent</div>
        </div>
      </div>`;
  } else {
    // Génère les jalons avec alternance gauche/droite
    // Un jalon "next" (current) génère en plus une carte CTA or
    const milestones = ws.subs.map((sub, subIdx) => {
      const st = compStatus(
        sub.c,
        ws.status,
        ws.nextChallenge,
        validatedMap,
        pendingMap,
      );
      const side = subIdx % 2 === 0 ? "left" : "right";
      const interactive = st !== "locked";

      // Icône dans le node
      const ICO_CHECK = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4 10-11" stroke="white" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const ICO_LOCK = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" stroke="#9d8fce" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#9d8fce" stroke-width="2"/></svg>`;
      const ICO_STAR = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.1 1-5.75-4.2-4.1 5.8-.85L12 3z" fill="#7a3c00"/></svg>`;
      const ICO_DOT = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="rgba(255,255,255,.35)"/></svg>`;

      let nodeClass = "";
      let nodeContent = ICO_DOT;
      let glint = "";
      if (st === "done" || st === "a_valider") {
        nodeClass = "done";
        nodeContent = ICO_CHECK;
      } else if (st === "next") {
        nodeClass = "current";
        nodeContent = ICO_STAR;
        glint = `<span class="prc-cv-node-glint" aria-hidden="true"></span>`;
      } else if (st === "locked") {
        nodeClass = "locked";
        nodeContent = ICO_LOCK;
      } else {
        nodeClass = "todo";
      }

      const metaText =
        st === "done" || st === "a_valider"
          ? `<span class="prc-cv-tag-done">● Terminé</span>`
          : st === "locked"
            ? "À débloquer"
            : st === "next"
              ? "En cours"
              : "À venir";

      const labelClass =
        st === "locked" ? "prc-cv-ms-label locked" : "prc-cv-ms-label";

      // Carte CTA or uniquement sur le jalon "next"
      const ctaCard =
        st === "next"
          ? `<div class="prc-cv-current-call"
              data-comp="${esc(sub.c)}" data-world-idx="${currentIdx}"
              role="button" tabindex="0"
              aria-label="Étape en cours : ${esc(sub.n)} — Continuer">
            <div class="prc-cv-call-kick">★ Étape en cours</div>
            <div class="prc-cv-call-ct">${esc(sub.n)}</div>
            <button class="prc-cv-cta" type="button"
                    data-comp="${esc(sub.c)}" data-world-idx="${currentIdx}">
              Continuer
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="#3a1c00" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>`
          : `<div class="${labelClass}">
            <div class="prc-cv-ms-ttl">${esc(sub.n)}</div>
            <div class="prc-cv-ms-meta">${metaText}</div>
           </div>`;

      // Le milestone entier est cliquable (sauf locked) via data-comp
      return `<div class="prc-cv-ms ${side}"
        ${interactive && st !== "next" ? `data-comp="${esc(sub.c)}" data-world-idx="${currentIdx}" role="button" tabindex="0" aria-label="${esc(sub.n)}"` : ""}
      >
        <div class="prc-cv-node ${nodeClass}"
          ${interactive && st !== "next" ? "" : ""}
          aria-hidden="true">
          <div class="prc-cv-node-ring"></div>
          <div class="prc-cv-node-face">${glint}${nodeContent}</div>
        </div>
        ${ctaCard}
      </div>`;
    });

    // ── Boss du chapitre : destination FINALE de la route (climax) ───
    // La route file jusqu'à lui ; vaincu quand toutes les compétences du
    // chapitre sont acquises (= le coffre se débloque).
    const bossWon = ws.status === "complete";
    const bossRemain = Math.max(0, ws.total - ws.done);
    // PNJ couronne 3D (DA arène violet/or) — vaincu = couronne en gloire,
    // pas encore = couronne grisée/verrouillée « à conquérir ».
    const BOSS_IMG = "/skins/permigo-autonomie-crown-v1.webp";
    const bossMs = `
      <div class="prc-cv-ms boss">
        <div class="prc-cv-node bossnode ${bossWon ? "won" : "wait"}" aria-hidden="true">
          <div class="prc-cv-boss-glow"></div>
          <img class="prc-cv-boss-img" src="${BOSS_IMG}" alt="" loading="lazy" draggable="false" />
          ${bossWon ? "" : '<span class="prc-cv-boss-lock" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2.3" fill="#1a1030" stroke="#cdbff5" stroke-width="2"/><path d="M8 11V8.5a4 4 0 0 1 8 0V11" stroke="#cdbff5" stroke-width="2"/></svg></span>'}
        </div>
        <div class="prc-cv-boss-card ${bossWon ? "won" : "wait"}">
          <div class="prc-cv-boss-kick">${bossWon ? "★ Boss vaincu" : "Boss du chapitre"}</div>
          <div class="prc-cv-boss-ttl">${esc(chapTitle)}</div>
          <div class="prc-cv-boss-sub">${
            bossWon
              ? "Chapitre maîtrisé — ta récompense est là"
              : bossRemain > 0
                ? `Plus que ${bossRemain} compétence${bossRemain > 1 ? "s" : ""} à valider pour le vaincre`
                : "Toutes acquises — récompense imminente"
          }</div>
        </div>
      </div>`;
    milestones.push(bossMs);

    // Route SVG sinueuse : hauteur dynamique selon le nombre de jalons
    // On réutilise le path du mockup adapté (même courbe, échelle selon hauteur)
    const nodeH = 96; // min-height d'un milestone
    const routeH = Math.max(ws.subs.length * nodeH + 60, 300);
    // Chemin sinueux : gauche → droite → gauche (inspiré du mockup)
    // W=346 correspond au container moins les marges de 22px×2 = env. 346
    const segH = routeH / 4;
    const routePath = `M70 24 C 240 ${segH * 0.7}, 60 ${segH * 1.5}, 276 ${segH * 2} C 80 ${segH * 2.6}, 250 ${segH * 3.2}, 70 ${segH * 3.8} C 250 ${segH * 4.4}, 60 ${routeH - 30}, 200 ${routeH}`;

    routeHTML = `
      <div class="prc-cv-route-head">
        <h2>Ton itinéraire</h2>
        <div class="prc-cv-step-count">${ws.total} étape${ws.total > 1 ? "s" : ""}</div>
      </div>
      <div class="prc-cv-route">
        ${renderWorldSigns(currentIdx)}
        <svg class="prc-cv-ribbon" viewBox="0 0 346 ${routeH}" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="${routePath}" stroke="var(--cv-road)" stroke-width="34" stroke-linecap="round"/>
          <path d="${routePath}" stroke="#2a1d52" stroke-width="26" stroke-linecap="round"/>
          <path d="${routePath}" stroke="var(--cv-road-edge)" stroke-width="3" stroke-dasharray="2 16" stroke-linecap="round"/>
        </svg>
        <div class="prc-cv-nodes">
          ${milestones.join("")}
        </div>
      </div>`;
  }

  // ── Carte « Chapitre suivant » : destination en bout de route ────
  let gateHTML = "";
  if (nextWs && ws.status !== "locked") {
    const nextNum = currentIdx + 2;
    const nextTitle =
      nextWs.world?.titre ?? nextWs.world?.nom ?? `Chapitre ${nextNum}`;
    const nextLocked = nextWs.status === "locked";
    gateHTML = nextLocked
      ? `
      <div class="prc-cv-next locked" aria-label="Chapitre ${nextNum} verrouillé : ${esc(nextTitle)}">
        <div class="prc-cv-next-badge locked" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" stroke="#cdbff5" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#cdbff5" stroke-width="2"/></svg>
        </div>
        <div class="prc-cv-next-txt">
          <div class="prc-cv-next-kick">Chapitre ${nextNum} · Verrouillé</div>
          <div class="prc-cv-next-ttl">${esc(nextTitle)}</div>
          <div class="prc-cv-next-sub">Bats le boss de « ${esc(world.nom ?? chapTitle)} » pour l'ouvrir</div>
        </div>
      </div>`
      : `
      <button class="prc-cv-next open" type="button"
              data-chap="${currentIdx + 1}"
              aria-label="Aller au chapitre ${nextNum} : ${esc(nextTitle)}">
        <div class="prc-cv-next-badge open" aria-hidden="true">${nextNum}</div>
        <div class="prc-cv-next-txt">
          <div class="prc-cv-next-kick">Chapitre suivant · débloqué</div>
          <div class="prc-cv-next-ttl">${esc(nextTitle)}</div>
        </div>
        <div class="prc-cv-next-go" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </button>`;
  }

  // ── Sélecteur de chapitres (stepper) : on VOIT et on atteint les 4 ───
  // Corrige « j'avais que la première partie » : tous les chapitres visibles
  // et atteignables sans quitter la vue immersive.
  const ICO_CHK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4 10-11" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICO_LK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.3" stroke="currentColor" stroke-width="2.4"/><path d="M8 11V8.5a4 4 0 0 1 8 0V11" stroke="currentColor" stroke-width="2.4"/></svg>`;
  const chapNav = `
    <div class="prc-cv-chapnav" role="tablist" aria-label="Chapitres du parcours">
      ${worldStates
        .map((w, i) => {
          const isCur = i === currentIdx;
          const cls =
            (isCur ? "cur " : "") +
            (w.status === "complete"
              ? "done"
              : w.status === "locked"
                ? "lock"
                : "todo");
          const inner =
            w.status === "complete"
              ? ICO_CHK
              : w.status === "locked"
                ? ICO_LK
                : `${i + 1}`;
          return `<button class="prc-cv-cn ${cls}" data-chap="${i}" type="button" role="tab" aria-selected="${isCur}" aria-label="Chapitre ${i + 1}${isCur ? " — affiché" : ""}">${inner}</button>`;
        })
        .join("")}
    </div>`;

  // ── Bouton "Voir la carte" — lisible (≥44px), pas un lien gris ───────
  const backLink = `<button class="prc-cv-back" data-view="map" type="button" aria-label="Voir la carte multi-chapitres">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 6l9-3 9 3-9 3-9-3zM3 12l9 3 9-3M3 18l9 3 9-3"/></svg>
    Carte
  </button>`;

  // ── Coffre du chapitre : la récompense, débloquée quand le boss tombe ──
  const chestWorldNum = meta?.num ?? currentIdx + 1;
  const chestHTML =
    ws.status === "complete"
      ? `<div class="prc-cv-chest">${renderChest({
          worldNum: chestWorldNum,
          worldName: world.nom ?? chapTitle,
          opened: openedWorlds.has(chestWorldNum),
        })}</div>`
      : "";

  return `<div class="prc-cv" role="main" aria-label="Ton parcours — vue chapitre">
  <div class="prc-cv-screen">
    <div class="prc-cv-topbar">
      ${chapNav}
      ${backLink}
    </div>
    ${heroHTML}
    ${routeHTML}
    ${chestHTML}
    ${gateHTML}
    <div style="height:40px"></div>
  </div>
</div>`;
}

// Trace le ruban-route SVG À TRAVERS le centre des jalons réellement rendus.
// Robuste à n'importe quel nombre de jalons et à la hauteur variable de la
// carte « Continuer » (le tracé fixe précédent dérivait hors des pastilles).
// PURE mesure : la planification robuste est dans scheduleRoadLayout().
let _roadObserver = null;
function layoutChapterRoad(root) {
  const scope = root && root.querySelector ? root : document;
  const route = scope.querySelector(".prc-cv-route");
  if (!route) return;
  const svg = route.querySelector(".prc-cv-ribbon");
  const nodes = [...route.querySelectorAll(".prc-cv-node")];
  if (!svg || nodes.length === 0) return;

  // Position d'un node relative au conteneur .prc-cv-route (offsetTop/Left
  // ignorent les transforms → stable pendant l'anim "rise" des jalons).
  const offIn = (el) => {
    let x = 0;
    let y = 0;
    while (el && el !== route) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent;
    }
    return { x, y };
  };
  const pts = nodes.map((n) => {
    const o = offIn(n);
    return { x: o.x + n.offsetWidth / 2, y: o.y + n.offsetHeight / 2 };
  });
  const W = route.clientWidth;
  const H = route.clientHeight;
  if (!W || !H) return; // layout pas encore prêt → on re-mesurera

  // Courbe lisse (S-curve) reliant chaque centre de jalon.
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const my = ((a.y + b.y) / 2).toFixed(1);
    d += ` C ${a.x.toFixed(1)} ${my}, ${b.x.toFixed(1)} ${my}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
}

// Planifie le tracé de façon ROBUSTE aux vrais appareils (le dev validait sur
// desktop polices en cache → OK ; sur mobile 1er chargement, les polices
// Baloo 2 / Fredoka arrivent APRÈS le 1er paint, changent la hauteur des
// jalons, et la route tracée trop tôt se retrouve décalée = « mal affiché »).
function scheduleRoadLayout(root) {
  const run = () => {
    try {
      layoutChapterRoad(root);
    } catch (_) {
      /* jamais throw depuis un callback async */
    }
  };
  // 1) double rAF : layout + début d'anim posés
  requestAnimationFrame(() => requestAnimationFrame(run));
  // 2) après chargement des polices : re-mesure (metrics définitives)
  try {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(() => {});
    }
  } catch (_) {}
  // 3) ResizeObserver : tout reflow du conteneur (polices, rotation, resize)
  //    re-trace pile sur les jalons. Fire aussi une fois à l'observation.
  const route = (root && root.querySelector ? root : document).querySelector(
    ".prc-cv-route",
  );
  if (_roadObserver) {
    _roadObserver.disconnect();
    _roadObserver = null;
  }
  if (route && "ResizeObserver" in window) {
    _roadObserver = new ResizeObserver(run);
    _roadObserver.observe(route);
  }
}

// Stoppe l'observation quand on quitte la vue chapitre (route démontée).
function stopRoadLayout() {
  if (_roadObserver) {
    _roadObserver.disconnect();
    _roadObserver = null;
  }
}

function renderFinal(done, total) {
  const pct = Math.round((done / total) * 100);
  return `
<div class="prc-final">
  <h3>La ligne d'arrivée : l'Examen du permis</h3>
  <p>Acquiers toutes les compétences et ton moniteur pourra te présenter à l'examen.</p>
  <div class="prc-final-stats">
    <div class="prc-final-stat">
      <div class="v">${done}<small style="font-size:13px;opacity:.6">/${total}</small></div>
      <div class="l">Acquises</div>
    </div>
    <div class="prc-final-stat">
      <div class="v">${pct}%</div>
      <div class="l">Progression</div>
    </div>
    <div class="prc-final-stat">
      <div class="v">${total - done}</div>
      <div class="l">Restantes</div>
    </div>
  </div>
</div>`;
}

// ─── Vue Liste (chapitres) — alternative compacte à la carte ──────
function renderListView(worldStates, validatedMap, pendingMap, openedWorlds) {
  return worldStates
    .map((ws) => renderWorldChapter(ws, validatedMap, pendingMap, openedWorlds))
    .join("");
}

function renderWorldChapter(ws, validatedMap, pendingMap, openedWorlds) {
  const { idx, cat, subs, done, total, status, nextChallenge } = ws;
  const meta = WORLDS_META[idx];
  const world = WORLDS[idx];
  const isLocked = status === "locked";
  const isComplete = status === "complete";
  const pct = total ? Math.round((done / total) * 100) : 0;

  const eyebrow = isLocked
    ? `Compétence ${meta.num} · verrouillé`
    : isComplete
      ? `Compétence ${meta.num} · terminé`
      : `Compétence ${meta.num} · en cours`;

  const numCell = isComplete
    ? `<span class="prc-chap-num">${icon("check", { size: 22, strokeWidth: 3 })}</span>`
    : `<span class="prc-chap-num">${meta.num}</span>`;

  const rightCell = isLocked
    ? `<span class="prc-chap-lock">${icon("lock", { size: 16 })}</span>`
    : isComplete
      ? `<span class="prc-chap-badge">${icon("check", { size: 11, strokeWidth: 3 })} Terminé</span><span class="prc-chap-chev">${icon("chevron-down", { size: 16 })}</span>`
      : `<span class="prc-chap-chev">${icon("chevron-down", { size: 16 })}</span>`;

  const header = `
    ${numCell}
    <div class="prc-chap-main">
      <div class="prc-chap-eyebrow">${esc(eyebrow)}</div>
      <h3 class="prc-chap-title">${esc(world.titre)}</h3>
      <div class="prc-chap-bar">
        <div class="track"><i style="width:${pct}%"></i></div>
        <span class="frac">${done}/${total}</span>
      </div>
    </div>
    <div class="prc-chap-right">${rightCell}</div>`;

  // Monde verrouillé : carte statique (header + note), pas de liste dépliable.
  if (isLocked) {
    const req = UNLOCK_REQ[idx];
    const need = Math.max(0, (req ?? 0) - (ws.prevDoneCount ?? 0));
    return `
    <div class="prc-chap locked" data-world-idx="${idx}" style="--wc:${meta.color}">
      <div class="prc-chap-hd">${header}</div>
      <div class="prc-chap-locknote">Valide encore <strong>${need} compétence${need > 1 ? "s" : ""}</strong> du monde précédent pour ouvrir ce chapitre.</div>
    </div>`;
  }

  const rowsHTML = subs
    .map((sub) => {
      const st = compStatus(
        sub.c,
        status,
        nextChallenge,
        validatedMap,
        pendingMap,
      );
      const ic = {
        done: icon("check", { size: 14, strokeWidth: 3 }),
        a_valider: icon("check", { size: 14, strokeWidth: 3 }),
        next: icon("zap", { size: 13, strokeWidth: 2.6 }),
        todo: "",
        locked: icon("lock", { size: 12 }),
      }[st];
      const label = {
        done: "Acquis",
        a_valider: "Acquis",
        next: "",
        todo: "À venir",
        locked: "Verrouillé",
      }[st];
      const right =
        st === "next"
          ? `<span class="prc-row-go">Réviser →</span>`
          : `<span class="prc-row-st">${esc(label)}</span>`;
      const subLine =
        st === "next"
          ? `<span class="prc-row-sub">Prochaine compétence à travailler</span>`
          : "";
      const interactive = st !== "locked";
      return `
      <div class="prc-row ${st}" data-comp="${esc(sub.c)}" data-world-idx="${idx}"
           ${interactive ? 'role="button" tabindex="0"' : 'aria-hidden="true"'}
           aria-label="${esc(sub.n)} — ${esc(label || "à réviser")}">
        <span class="prc-row-ic">${ic}</span>
        <span class="prc-row-main"><span class="prc-row-nm">${esc(sub.n)}</span>${subLine}</span>
        ${right}
      </div>`;
    })
    .join("");

  const chestHTML = isComplete
    ? renderChest({
        worldNum: meta.num,
        worldName: world.nom,
        opened: openedWorlds.has(meta.num),
      })
    : "";

  // Chapitre en cours ouvert par défaut ; terminé replié (cliquable).
  const openAttr = status === "in_progress" ? " open" : "";
  return `
    <details class="prc-chap ${isComplete ? "complete" : ""}" data-world-idx="${idx}" style="--wc:${meta.color}"${openAttr}>
      <summary class="prc-chap-hd">${header}</summary>
      <div class="prc-chap-body">
        ${rowsHTML}
        ${chestHTML}
      </div>
    </details>`;
}

// ─── Wire & bottom sheet ──────────────────────────────────────────
function wire(root, worldStates, validatedMap, pendingMap, me, view = "map") {
  // Back via hashchange
  root.querySelector("#prc-back")?.addEventListener("click", () => {
    location.hash = "#/";
  });

  // ── Carte vivante (vue Carte uniquement) : route dessinée + cascade de nodes ──
  // Gated : vue Carte ET IntersectionObserver dispo ET pas de reduced-motion.
  // Sans la classe .prc-anim, tout reste statique (fallback).
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const mapEl = root.querySelector(".prc-map");
  if (view === "map" && !reduced && "IntersectionObserver" in window && mapEl) {
    root.querySelector(".prc")?.classList.add("prc-anim");
    // Whoosh à l'entrée d'un nouveau monde au scroll (pas au mount initial).
    let whooshArmed = false;
    setTimeout(() => {
      whooshArmed = true;
    }, 700);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            if (whooshArmed) playWhoosh();
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    root.querySelectorAll(".prc-world").forEach((sec) => io.observe(sec));
  }

  // Auto-scroll vers le monde en cours
  requestAnimationFrame(() => {
    const target = worldStates.find((w) => w.status === "in_progress");
    if (target) {
      root
        .querySelector(`[data-world-idx="${target.idx}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Coffres → modal cinématique
  root.querySelectorAll(".chest-card:not(.opened)").forEach((card) => {
    const worldNum = parseInt(card.dataset.chestWorld, 10);
    const ws = worldStates[worldNum - 1];
    const open = () => {
      if (card.classList.contains("opened")) return; // déjà ouvert → pas de re-clic
      track("parcours.chest_open", { worldNum });
      openChestModal({
        worldNum,
        worldName: ws?.world?.nom ?? `Monde ${worldNum}`,
        // Persiste l'ouverture + crédite les gemmes côté serveur (idempotent),
        // puis verrouille la carte pour empêcher toute réouverture/re-crédit.
        onClaim: async () => {
          await openChest("world_" + worldNum);
          card.classList.add("opened");
        },
      });
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Élément qui a ouvert la fiche → on lui rend le focus à la fermeture (a11y).
  let lastTrigger = null;

  // Nodes → ouvre la fiche (click + Enter/Space pour keyboard nav)
  // La case cliquée se « soulève » (classe .selected) tant que la fiche est ouverte.
  const clearSelected = () =>
    root
      .querySelectorAll(".prc-node.selected")
      .forEach((el) => el.classList.remove("selected"));
  root.querySelectorAll(".prc-node:not(.locked)").forEach((n) => {
    const open = () => {
      haptic("tap");
      lastTrigger = n;
      clearSelected();
      n.classList.add("selected");
      const compId = n.dataset.comp;
      const worldIdx = parseInt(n.dataset.worldIdx, 10);
      // Le quiz n'est plus une porte : on ouvre toujours la fiche.
      // Le quiz-récap (optionnel) se lance depuis la fiche d'une compétence acquise.
      openFiche(root, compId, worldStates[worldIdx], validatedMap, pendingMap);
      track("parcours.node_tap", { compId, worldIdx });
    };
    n.addEventListener("click", open);
    n.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Vue Liste : chaque ligne de compétence ouvre la même fiche (bottom sheet)
  root.querySelectorAll(".prc-row:not(.locked)").forEach((rowEl) => {
    const open = () => {
      haptic("tap");
      lastTrigger = rowEl;
      const compId = rowEl.dataset.comp;
      const worldIdx = parseInt(rowEl.dataset.worldIdx, 10);
      openFiche(root, compId, worldStates[worldIdx], validatedMap, pendingMap);
      track("parcours.node_tap", { compId, worldIdx, view: "list" });
    };
    rowEl.addEventListener("click", open);
    rowEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Bottom sheet — close
  const bg =
    root.querySelector("#bsheet-bg") ?? document.getElementById("bsheet-bg");
  const sheet =
    root.querySelector("#bsheet") ?? document.getElementById("bsheet");
  const isOpen = () => sheet?.classList.contains("open");
  const closeFn = () => {
    const wasOpen = isOpen();
    sheet?.classList.remove("open");
    bg?.classList.remove("open");
    sheet?.setAttribute("aria-hidden", "true");
    clearSelected();
    // Rend le focus au node déclencheur (sinon le focus part dans le vide).
    if (wasOpen && lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  };
  bg?.addEventListener("click", closeFn);
  // Escape ferme la fiche — lié une seule fois (anti-empilement au re-render du toggle).
  if (!escBound) {
    escBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const sh = document.getElementById("bsheet");
      if (!sh?.classList.contains("open")) return;
      sh.classList.remove("open");
      document.getElementById("bsheet-bg")?.classList.remove("open");
      sh.setAttribute("aria-hidden", "true");
      document
        .querySelectorAll(".prc-node.selected, .prc-row.selected")
        .forEach((el) => el.classList.remove("selected"));
    });
  }
  // Swipe-to-dismiss vers le BAS (le panneau monte du bas, comme la feuille trophée)
  if (sheet)
    enableSheetSwipe(sheet, closeFn, { overlay: bg, direction: "down" });
}

function openFiche(root, compId, ws, validatedMap, pendingMap) {
  const { idx, cat, status, nextChallenge } = ws;
  const meta = WORLDS_META[idx];
  const world = WORLDS[idx];
  const sub = cat.subs.find((s) => s.c === compId);
  if (!sub) return;

  const st = compStatus(
    compId,
    status,
    nextChallenge,
    validatedMap,
    pendingMap,
  );
  const val = validatedMap[compId];
  const stLabel = {
    done: "Acquise",
    a_valider: "À valider",
    next: "Prochaine compétence",
    todo: "À venir",
    locked: "Verrouillée",
  }[st];
  const compNum = cat.subs.findIndex((s) => s.c === compId) + 1;
  const total = cat.subs.length;
  const detail = getCompDetail(compId);

  // Icône SVG selon statut (au lieu d'emoji)
  const stIcon =
    {
      done: icon("check", { size: 36 }),
      a_valider: icon("clipboard-check", { size: 32 }),
      next: icon("zap", { size: 32 }),
      todo: icon("clock", { size: 30 }),
      locked: icon("lock", { size: 28 }),
    }[st] ?? icon("clock", { size: 30 });

  // Progression visuelle dans le monde (n / total)
  const pctInWorld = Math.round((compNum / total) * 100);

  // Quiz-récap : rappel OPTIONNEL proposé sur une compétence acquise.
  // Ne change pas le statut (already_acquired) — joue l'animation + crédite l'XP d'engagement.
  const recapBtn = `
    <a href="#/quiz/${esc(compId)}/post_validation" role="button"
       style="display:flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:15px;background:var(--a);border:none;color:var(--a-ink);border-radius:14px;font:800 14px/1 'Inter',sans-serif;text-align:center;text-decoration:none;box-shadow:0 6px 16px -4px color-mix(in srgb, var(--a) 60%, transparent);min-height:52px;transition:transform .2s var(--ease-snap),box-shadow .2s var(--ease-snap);-webkit-tap-highlight-color:transparent;"
       onpointerdown="this.style.transform='scale(0.97)'" onpointerup="this.style.transform=''" onpointerleave="this.style.transform=''">
      ${icon("zap", { size: 16 })} Révise cette compétence
    </a>`;

  // Bloc status contextuel selon état
  const statusBlock = (() => {
    if (st === "done" && val) {
      const dateStr = val.validated_at
        ? new Date(val.validated_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
          })
        : null;
      const parts = [];
      if (dateStr) parts.push(`Validée le ${dateStr}`);
      if (val.teacherName) parts.push(`par ${val.teacherName}`);
      if (val.score_cognitif != null)
        parts.push(`Quiz : ${Math.round(val.score_cognitif)}%`);
      return `
        <div class="fiche-status done">
          <div class="fiche-status-ico">${icon("check", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Compétence acquise</div>
            <div class="fiche-status-sub">${esc(parts.join(" · ") || "Ton moniteur a validé cette compétence.")}</div>
          </div>
        </div>${recapBtn}`;
    }
    if (st === "done") {
      return `
        <div class="fiche-status done">
          <div class="fiche-status-ico">${icon("check", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Compétence acquise</div>
            <div class="fiche-status-sub">Ton moniteur a validé cette compétence en séance.</div>
          </div>
        </div>${recapBtn}`;
    }
    if (st === "a_valider") {
      // Legacy : ne devrait plus apparaître (validation moniteur = acquis direct).
      // Affiché comme acquise + quiz-récap optionnel.
      return `
        <div class="fiche-status done">
          <div class="fiche-status-ico">${icon("check", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Compétence acquise</div>
            <div class="fiche-status-sub">Validée par ton moniteur en séance de conduite.</div>
          </div>
        </div>${recapBtn}`;
    }
    if (st === "next") {
      return `
        <div class="fiche-status next" style="--wc:${meta.color}">
          <div class="fiche-status-ico">${icon("zap", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Prochaine à travailler</div>
            <div class="fiche-status-sub">Entraîne-toi en séance — ton moniteur la validera quand tu es prêt(e).</div>
          </div>
        </div>`;
    }
    if (st === "locked") {
      return `
        <div class="fiche-status locked">
          <div class="fiche-status-ico">${icon("lock", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Pas encore accessible</div>
            <div class="fiche-status-sub">Valide les compétences précédentes pour débloquer celle-ci.</div>
          </div>
        </div>`;
    }
    return `
      <div class="fiche-status next" style="--wc:${meta.color}">
        <div class="fiche-status-ico">${icon("clock", { size: 18 })}</div>
        <div class="fiche-status-body">
          <div class="fiche-status-title">À venir</div>
          <div class="fiche-status-sub">Tu travailleras cette compétence avec ton moniteur au fil des séances.</div>
        </div>
      </div>`;
  })();

  const body =
    root.querySelector("#bsheet-body") ??
    document.getElementById("bsheet-body");
  body.innerHTML = `
    <div class="fiche-hero" style="--wc:${meta.color}">
      <button class="fiche-close" type="button" aria-label="Fermer">×</button>
      <div class="fiche-badge-cat">MONDE ${meta.num} · ${esc(world.nom).toUpperCase()}</div>
      <div class="fiche-circle ${st === "done" ? "done" : ""}" style="background:${st === "done" ? "var(--gr)" : meta.color}">
        ${stIcon}
      </div>
      <h3 id="bsheet-title">${esc(sub.n)}</h3>
      <div class="fiche-id">${compNum} sur ${total} dans ce monde</div>
      ${st === "done" ? "" : `<div><span class="stt-pill ${st}" style="--wc:${meta.color}">${esc(stLabel)}</span></div>`}
    </div>
    <div class="fiche-body">

      <!-- SUMMARY — une phrase -->
      <p class="fiche-summary-txt">${esc(detail.summary)}</p>

      <!-- STATUS contextuel (+ CTA quiz si acquise) -->
      ${statusBlock}

      <!-- POINTS CLÉS — repliés par défaut (mobile : moins de texte) -->
      <details class="fiche-acc" style="--wc:${meta.color}">
        <summary>
          ${icon("target", { size: 13 })}
          ${st === "done" ? "Ce que tu maîtrises" : "Ce que tu vas maîtriser"}
          <span class="fiche-acc-chev">${icon("chevron-down", { size: 15 })}</span>
        </summary>
        <ul class="fiche-block-list">
          ${detail.keyPoints.map((kp) => `<li><span class="kp-check">${icon("check", { size: 11, strokeWidth: 3 })}</span>${esc(kp)}</li>`).join("")}
        </ul>
        <div class="fiche-acc-tip">${icon("sparkle", { size: 13 })} ${esc(detail.tip)}</div>
      </details>

    </div>`;

  body.querySelector(".fiche-close")?.addEventListener("click", () => {
    const bg = document.getElementById("bsheet-bg");
    const sheet = document.getElementById("bsheet");
    sheet?.classList.remove("open");
    bg?.classList.remove("open");
    sheet?.setAttribute("aria-hidden", "true");
    // Rend la case à sa position (retire le « lift »)
    root
      .querySelectorAll(".prc-node.selected")
      .forEach((el) => el.classList.remove("selected"));
  });

  const bg = document.getElementById("bsheet-bg");
  const sheet = document.getElementById("bsheet");
  sheet?.classList.add("open");
  bg?.classList.add("open");
  sheet?.setAttribute("aria-hidden", "false");
  // Move focus into the dialog for keyboard/screen reader users
  requestAnimationFrame(() => {
    sheet?.querySelector(".fiche-close")?.focus();
  });
}
