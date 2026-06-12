// ═══════════════════════════════════════════════════════════════
// Élève — Parcours REMC (Map immersive v2)
// Inspiration : Apple Health × Duolingo × ancien permigo-v7
// Route SVG sinueuse · Images monde · Nodes animés · Light theme
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

// Fond photo immersif par monde, variante jour/nuit selon l'heure.
const isNight = (() => {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
})();
const WORLD_BG = (num) =>
  `/skins/landing/monde${num}${isNight ? "nuit" : "jour"}.webp`;

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
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--wc, var(--gr)) 12%, transparent) 0%,
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
.prc-subtitle { font: 500 11px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }
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
  background: linear-gradient(90deg, var(--gr), #06b6d4, var(--pu), var(--am));
  border-radius: 3px;
  transition: width 1s var(--ease-out);
}
.prc-global-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font: 600 10.5px/1 'Inter', sans-serif;
  color: var(--mu2);
}

/* ── Légende ── */
.prc-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--bo);
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--mu);
}
.prc-legend span { display: inline-flex; align-items: center; gap: 5px; }
.prc-legend i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── Carte des mondes — pleine page, le scroll de la page fait tout ── */
.prc-map {
  position: relative;
  z-index: 2;
  margin-top: 6px;
}

/* ── Sections Monde — fond photo z:0, gradient ::before z:1, contenu z:3+ ── */
.prc-world {
  position: relative;
  padding: 0 0 70px;
  overflow: hidden;
  min-height: 300px;
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
  padding: 24px 16px 12px;
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
  padding: 0 10px 60px;
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
  max-width: 168px;
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
  word-wrap: break-word;
  hyphens: auto;
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
.prc-node.done .nd-lbl .nd-stt { color: var(--gr); }

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
/* Fiche compétence : descend du HAUT de l'écran */
.bsheet {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 99;
  background: var(--su);
  border-radius: 0 0 24px 24px;
  border-bottom: 1px solid var(--bo);
  box-shadow: 0 8px 32px rgba(11,13,26,.16);
  transform: translateY(-100%);
  transition: transform .34s cubic-bezier(.32,.72,0,1);
  touch-action: pan-y;
  padding-top: max(8px, env(safe-area-inset-top));
  will-change: transform;
  max-height: 88vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.bsheet.open { transform: translateY(0); }
/* Poignée en BAS du panneau (il descend du haut) */
.bsheet-handle {
  width: 40px; height: 4px;
  background: var(--bo);
  border-radius: 2px;
  margin: 4px auto 10px;
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
</style>`;

// ─── Identité visuelle par monde (PNG premium ChatGPT 3D) ───────
const WORLDS_META = [
  {
    num: 1,
    color: "var(--gr)",
    glow: "rgba(16,185,129,.35)",
    img: "/skins/permigo-remc-maitrise-vehicule-flag-v1.webp",
  },
  {
    num: 2,
    color: "#06b6d4",
    glow: "rgba(6,182,212,.35)",
    img: ASSETS.worldC2,
  },
  {
    num: 3,
    color: "var(--pu)",
    glow: "rgba(139,92,246,.35)",
    img: ASSETS.worldC3,
  },
  {
    num: 4,
    color: "var(--am)",
    glow: "rgba(245,158,11,.35)",
    img: ASSETS.worldC4,
  },
];

// Combien de compétences du monde N-1 pour débloquer le monde N
const UNLOCK_REQ = [null, 5, 6, 6];

const NOW_MS = Date.now();
const NEW_BADGE_MS = 24 * 60 * 60 * 1000;

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
        <button onclick="location.reload()" style="margin-top:14px;padding:12px 24px;border:0;background:var(--a);color:var(--a-ink);border-radius:12px;cursor:pointer">Réessayer</button>
      </div></div>`;
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
  root.innerHTML = renderPage(
    worldStates,
    validatedMap,
    pendingMap,
    openedWorlds,
  );
  wire(root, worldStates, validatedMap, pendingMap, me);

  // Tuto : 1er passage auto + bouton « ? » pour le revoir
  root.querySelector("#prc-help")?.addEventListener("click", showParcoursTuto);
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

  // ── Flèche "Tu viens de débloquer !" si une comp a été validée < 10 min ──
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
) {
  const totalDone = worldStates.reduce((s, w) => s + w.done, 0);
  const totalComps = worldStates.reduce((s, w) => s + w.total, 0);
  const globalPct = Math.round((totalDone / totalComps) * 100);

  return `${STYLE}
<div class="prc">

  <a href="#prc-map-scroll" class="prc-skip">Aller à la carte</a>

  <!-- Header sticky -->
  <div class="prc-hd">
    <div>
      <h1 class="prc-title" tabindex="-1">Mon parcours <button class="prc-help" id="prc-help" type="button" aria-label="Comment marche le parcours ?">?</button></h1>
      <div class="prc-subtitle">31 compétences · Permis B</div>
    </div>
    <div class="prc-hd-right">
      <div class="prc-total">${totalDone}<span class="prc-total-denom">/${totalComps}</span></div>
      <div class="prc-total-lbl">acquises</div>
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
      <span>${globalPct}% du chemin</span>
      <span>${totalComps - totalDone} restantes</span>
    </div>
  </div>

  <!-- Légende -->
  <div class="prc-legend" role="list" aria-label="Légende des statuts">
    <span role="listitem"><i style="background:var(--gr)" aria-hidden="true"></i>Acquis</span>
    <span role="listitem"><i style="background:var(--a)" aria-hidden="true"></i>En cours</span>
    <span role="listitem"><i style="background:var(--bo)" aria-hidden="true"></i>À faire</span>
    <span role="listitem"><i style="background:var(--bo4)" aria-hidden="true"></i>Verrouillé</span>
  </div>

  <!-- Carte des mondes — pleine page, scroll naturel (plus d'encadré interne) -->
  <div class="prc-map" id="prc-map-scroll" tabindex="-1" role="region" aria-label="Carte d'apprentissage REMC">
    ${worldStates.map((ws, i) => renderWorldSection(ws, validatedMap, pendingMap, i < worldStates.length - 1, openedWorlds)).join("")}
    ${renderFinal(totalDone, totalComps)}
    <div style="height: 24px"></div>
  </div>

</div>

<!-- Bottom sheet -->
<div class="bsheet-bg" id="bsheet-bg" aria-hidden="true"></div>
<div class="bsheet" id="bsheet" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="bsheet-title">
  <div id="bsheet-body"></div>
  <div class="bsheet-handle" aria-hidden="true"></div>
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
  const H = Math.max(420, subs.length * 150 + 70);

  const points = subs.map((sub, i) => {
    const yPct = (i + 0.5) / subs.length;
    const wave = Math.sin(i * 0.85) * 0.28;
    const xPct = 0.5 + wave;
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
        next: "Appuie pour commencer",
        todo: "À débloquer",
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
        return `<div style="position:relative;z-index:9;text-align:center;padding:12px 16px;font:500 13px/1.4 'Inter',sans-serif;color:var(--mu3)">Débloque <strong style="color:var(--ink)">${need} compétence${need > 1 ? "s" : ""}</strong> dans le monde précédent pour accéder.</div>`;
      })()
    : "";

  const isActive = status === "in_progress";
  return `
<section class="prc-world ${isLocked ? "locked" : ""} ${isComplete ? "complete" : ""} ${isActive ? "active" : ""}"
         data-world-idx="${idx}"
         style="--wc:${meta.color};--wg:${meta.glow}">
  <!-- Fond photo immersif jour/nuit du monde -->
  <img src="${WORLD_BG(meta.num)}" alt="" class="prc-world-bg${isActive ? " prc-world-bg--active" : ""}" ${isActive ? 'loading="eager"' : 'loading="lazy"'} draggable="false">
  <!-- Petit visuel décoratif top-right -->
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
      ${done} / ${total} compétences
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
    </svg>
    ${nodesHTML}
  </div>

  <!-- Portail de fin de monde -->
  <div class="prc-portal">
    ${renderPortalArch(meta.color, isComplete)}
    <div class="pbadge">${isComplete ? "✓ Monde terminé" : `${total - done} à débloquer`}</div>
    <h3>${isComplete ? `Monde ${meta.num} terminé !` : `Continue l'aventure`}</h3>
    <p>${
      isComplete
        ? hasNext
          ? `Le monde ${idx + 2} t'attend.`
          : `Tu as conquis tous les mondes !`
        : hasNext
          ? `Termine ce monde pour débloquer le suivant.`
          : `Le sommet est proche.`
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

function renderFinal(done, total) {
  const pct = Math.round((done / total) * 100);
  return `
<div class="prc-final">
  <h3>Bout du voyage : l'Examen</h3>
  <p>Quand toutes tes compétences sont acquises, tu seras prêt(e) pour l'épreuve.</p>
  <div class="prc-final-stats">
    <div class="prc-final-stat">
      <div class="v">${done}<small style="font-size:13px;opacity:.6">/${total}</small></div>
      <div class="l">Compétences</div>
    </div>
    <div class="prc-final-stat">
      <div class="v">${pct}%</div>
      <div class="l">Progression</div>
    </div>
    <div class="prc-final-stat">
      <div class="v">${done * 25}</div>
      <div class="l">XP gagnés</div>
    </div>
  </div>
</div>`;
}

// ─── Wire & bottom sheet ──────────────────────────────────────────
function wire(root, worldStates, validatedMap, pendingMap, me) {
  // Back via hashchange
  root.querySelector("#prc-back")?.addEventListener("click", () => {
    location.hash = "#/";
  });

  // ── Carte vivante : route dessinée + cascade de nodes + parallax ──
  // Gated : IntersectionObserver dispo ET pas de reduced-motion.
  // Sans la classe .prc-anim, tout reste statique (fallback).
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  const mapEl = root.querySelector(".prc-map");
  if (!reduced && "IntersectionObserver" in window && mapEl) {
    root.querySelector(".prc")?.classList.add("prc-anim");
    // Pleine page : le viewport est la racine d'observation
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    root.querySelectorAll(".prc-world").forEach((sec) => io.observe(sec));

    // Parallax léger : le fond photo glisse selon la position du monde
    // dans le viewport (scroll de page, rAF, transform only).
    let ticking = false;
    const vh = () => window.innerHeight || 800;
    const parallax = () => {
      ticking = false;
      root.querySelectorAll(".prc-world").forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh()) return;
        const prog = (vh() / 2 - r.top) / (r.height + vh());
        const bgEl = sec.querySelector(".prc-world-bg");
        if (bgEl)
          bgEl.style.transform = `translateY(${((prog - 0.5) * 36).toFixed(1)}px) scale(1.08)`;
      });
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(parallax);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(parallax);
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeFn();
  });
  // Swipe-to-dismiss vers le HAUT (le panneau descend du haut)
  if (sheet) enableSheetSwipe(sheet, closeFn, { overlay: bg, direction: "up" });
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
    next: "En cours",
    todo: "À travailler",
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
       style="display:flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:15px;background:var(--a);border:none;color:var(--a-ink);border-radius:14px;font:800 14px/1 'Inter',sans-serif;text-align:center;text-decoration:none;box-shadow:0 6px 16px -4px color-mix(in srgb, var(--a) 60%, transparent);min-height:52px;">
      ${icon("zap", { size: 16 })} Clique pour te tester sur la compétence !
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
            <div class="fiche-status-sub">${esc(parts.join(" · ") || "Bravo, tu maîtrises cette compétence !")}</div>
          </div>
        </div>${recapBtn}`;
    }
    if (st === "done") {
      return `
        <div class="fiche-status done">
          <div class="fiche-status-ico">${icon("check", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Compétence acquise</div>
            <div class="fiche-status-sub">Bravo, tu maîtrises cette compétence.</div>
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
            <div class="fiche-status-sub">Validée par ton moniteur.</div>
          </div>
        </div>${recapBtn}`;
    }
    if (st === "next") {
      return `
        <div class="fiche-status next" style="--wc:${meta.color}">
          <div class="fiche-status-ico">${icon("zap", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Prochaine étape</div>
            <div class="fiche-status-sub">Pratique cette compétence avec ton moniteur — il la validera dans ton livret.</div>
          </div>
        </div>`;
    }
    if (st === "locked") {
      return `
        <div class="fiche-status locked">
          <div class="fiche-status-ico">${icon("lock", { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Verrouillée</div>
            <div class="fiche-status-sub">Termine les compétences précédentes pour débloquer celle-ci.</div>
          </div>
        </div>`;
    }
    return `
      <div class="fiche-status next" style="--wc:${meta.color}">
        <div class="fiche-status-ico">${icon("clock", { size: 18 })}</div>
        <div class="fiche-status-body">
          <div class="fiche-status-title">À travailler</div>
          <div class="fiche-status-sub">Cette compétence reste à pratiquer. Continue à avancer dans ton parcours.</div>
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
      <div class="fiche-id">${esc(compId.toUpperCase())} · ${compNum}/${total}</div>
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
