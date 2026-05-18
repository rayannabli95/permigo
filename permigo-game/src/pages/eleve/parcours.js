// ═══════════════════════════════════════════════════════════════
// Élève — Parcours REMC (Map immersive v2)
// Inspiration : Apple Health × Duolingo × ancien permigo-v7
// Route SVG sinueuse · Images monde · Nodes animés · Light theme
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { REMC } from '@/data/remc.js';
import { WORLDS } from '@/data/worlds.js';
import { ASSETS } from '@/utils/assets.js';
import { getCompDetail } from '@/data/remc-details.js';
import { icon } from '@/utils/icons.js';
import { renderEmptyState } from '@/components/empty-state.js';
import { renderChest, openChestModal, ensureChestStyles } from '@/components/chest.js';
import { isChestOpened, unlockChest } from '@/utils/game-state.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout global avec volant filigrane fixe ── */
.prc {
  padding: 0 0 100px;
  max-width: 480px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #0a0d1a;
  position: relative;
  /* Le volant est fixe dans le viewport → suit le scroll comme un watermark */
  background-color: #f8f9fc;
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
/* Le contenu reste lisible : on baisse l'opacity du fond blanc des sections monde */
.prc-world {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--wc, #10b981) 6%, rgba(255,255,255,.88)) 0%,
    color-mix(in srgb, var(--wc, #10b981) 3%, rgba(255,255,255,.85)) 50%,
    rgba(255,255,255,.78) 100%) !important;
}
/* Tous les contenus passent au-dessus du volant */
.prc > * { position: relative; z-index: 1; }

/* ── Header sticky (sous le header global fixe de 52px) ── */
.prc-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  background: rgba(248,249,252,.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid #e2e6f2;
}
.prc-title    { font: 800 20px/1.1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.prc-subtitle { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; margin-top: 3px; }
.prc-hd-right { text-align: right; }
.prc-total    { font: 800 26px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.prc-total-denom { font-size: 15px; color: #94a3b8; }
.prc-total-lbl{ font: 600 10px/1 'Inter', sans-serif; color: #94a3b8; margin-top: 3px; }

/* ── Barre de progression globale ── */
.prc-global-bar {
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f2f8;
}
.prc-global-track {
  height: 6px;
  background: #e2e6f2;
  border-radius: 3px;
  overflow: hidden;
}
.prc-global-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6, #f59e0b);
  border-radius: 3px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.prc-global-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font: 600 10.5px/1 'Inter', sans-serif;
  color: #94a3b8;
}

/* ── Légende ── */
.prc-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 20px;
  background: #f8f9fc;
  border-bottom: 1px solid #e2e6f2;
  font: 600 11px/1 'Inter', sans-serif;
  color: #64748b;
}
.prc-legend span { display: inline-flex; align-items: center; gap: 5px; }
.prc-legend i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── Map frame (contenant la carte des 4 mondes) ── */
.prc-map-frame {
  position: relative;
  margin: 14px 12px 24px;
  border-radius: 24px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 24px 60px -20px rgba(11,13,26,.12),
    0 4px 16px rgba(11,13,26,.06);
  isolation: isolate;
}
/* Bordure gradient animée */
.prc-map-border {
  position: absolute;
  inset: -2px;
  border-radius: 26px;
  background: conic-gradient(from 0deg,
    #10b981, #06b6d4, #8b5cf6, #f59e0b, #10b981);
  animation: prc-border-spin 12s linear infinite;
  z-index: 0;
  opacity: .5;
}
@keyframes prc-border-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .prc-map-border { animation: none; } }
.prc-map-frame::before {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 22px;
  background: #f8f9fc;
  z-index: 1;
}

/* Coins décoratifs */
.prc-map-corners { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.prc-corner { position: absolute; width: 16px; height: 16px; border: 2px solid rgba(99,102,241,.35); border-radius: 2px; }
.prc-corner.tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
.prc-corner.tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
.prc-corner.bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
.prc-corner.br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }

/* Badge "CARTE D'APPRENTISSAGE" */
.prc-map-badge {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  background: rgba(248,249,252,.95);
  backdrop-filter: blur(12px);
  border: 1px solid #e2e6f2;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #64748b;
  box-shadow: 0 4px 12px rgba(11,13,26,.08);
  pointer-events: none;
  white-space: nowrap;
}
.prc-map-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
  animation: prc-dot-pulse 1.8s ease-in-out infinite;
}
@keyframes prc-dot-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.7); } }

/* Scroll container */
.prc-map {
  position: relative;
  z-index: 2;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(99,102,241,.2) transparent;
  padding-top: 40px;
}
.prc-map::-webkit-scrollbar { width: 4px; }
.prc-map::-webkit-scrollbar-track { background: transparent; }
.prc-map::-webkit-scrollbar-thumb { background: rgba(99,102,241,.2); border-radius: 99px; }
@media (max-width: 560px) { .prc-map { max-height: 65vh; } }
@media (min-height: 900px) { .prc-map { max-height: 75vh; } }

/* Fades haut/bas */
.prc-map-fade-top, .prc-map-fade-bottom {
  position: absolute;
  left: 2px; right: 2px;
  height: 38px;
  pointer-events: none;
  z-index: 3;
}
.prc-map-fade-top {
  top: 2px;
  background: linear-gradient(180deg, #f8f9fc 0%, transparent 100%);
  border-radius: 22px 22px 0 0;
}
.prc-map-fade-bottom {
  bottom: 2px;
  background: linear-gradient(0deg, #f8f9fc 0%, transparent 100%);
  border-radius: 0 0 22px 22px;
}

/* ── Sections Monde — design propre, gradient subtil par monde ── */
.prc-world {
  position: relative;
  padding: 0 0 70px;
  overflow: hidden;
  min-height: 300px;
  /* Fond gradient doux : couleur du monde 5% → blanc */
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--wc, #10b981) 8%, #fff) 0%,
    color-mix(in srgb, var(--wc, #10b981) 3%, #fff) 50%,
    #fff 100%);
}
/* Petit visuel décoratif en haut à droite (au lieu de fond pleine page) */
.prc-world-decor {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 72px;
  height: 72px;
  object-fit: contain;
  z-index: 4;
  filter: drop-shadow(0 4px 12px rgba(11,13,26,.15));
  opacity: .95;
  transition: transform .4s cubic-bezier(.23,1,.32,1);
  pointer-events: none;
}
.prc-world.complete .prc-world-decor {
  animation: decorFloat 2.6s ease-in-out infinite;
}
@keyframes decorFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-4px) rotate(3deg); }
}
@media (prefers-reduced-motion: reduce) {
  .prc-world.complete .prc-world-decor { animation: none; }
}

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
  border-radius: 99px;
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
  background: var(--wc, #10b981);
  color: #fff;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 900;
}
.prc-world-h2 {
  font: 800 20px/1.1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin: 0 0 3px;
  text-shadow: 0 1px 8px rgba(255,255,255,.8);
}
.prc-world-tagline {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: #475569;
  margin-bottom: 8px;
  text-shadow: 0 1px 4px rgba(255,255,255,.7);
}
.prc-world-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--wc, #10b981);
  padding: 4px 12px;
  border-radius: 99px;
  box-shadow: 0 3px 10px color-mix(in srgb, var(--wc, #10b981) 40%, transparent);
}

/* ── Route SVG ── */
.prc-route {
  position: relative;
  padding: 0 10px 60px;
  z-index: 3;
}
.prc-route svg { display: block; width: 100%; height: auto; overflow: visible; }
/* 4 layers route : ombre, bord, surface, marquage */
.prc-path-shadow { stroke: rgba(11,13,26,.12); stroke-width: 28; fill: none; stroke-linecap: round; filter: blur(4px); transform: translateY(3px); }
.prc-path-edge   { stroke: rgba(71,85,105,.3);  stroke-width: 26; fill: none; stroke-linecap: round; }
.prc-path        { stroke: #94a3b8;              stroke-width: 20; fill: none; stroke-linecap: round; }
.prc-path-light  { stroke: #f59e0b; stroke-width: 1.5; stroke-dasharray: 5 10; stroke-linecap: round; fill: none; opacity: .9; }

/* ── Nodes (style Duolingo path) ── */
.prc-node {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 6;
  opacity: 0;
  animation: nd-pop .55s cubic-bezier(.34,1.56,.64,1) both;
  animation-delay: var(--nd-delay, 0s);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
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

/* Cercle principal */
.nd-circle {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: box-shadow .2s, transform .15s cubic-bezier(.2,.7,.3,1);
  flex-shrink: 0;
}
@media (max-width: 400px) {
  .nd-circle { width: 48px; height: 48px; border-width: 3px; }
}
.prc-node:not(.locked):active .nd-circle {
  transform: scale(.95);
  box-shadow: 0 6px 16px rgba(0,0,0,.14);
}
.prc-node:not(.locked):hover .nd-circle {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.12);
}

/* ─ DONE — cercle vert, check SVG ─ */
.prc-node.done .nd-circle {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16,185,129,.35);
  animation: nd-breathe-done 3s ease-in-out infinite;
}
@keyframes nd-breathe-done {
  0%,100% { box-shadow: 0 4px 12px rgba(16,185,129,.35); }
  50%     { box-shadow: 0 4px 20px rgba(16,185,129,.55); }
}
/* Anneau pulse sur done */
.prc-node.done .nd-circle::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(16,185,129,.4);
  animation: nd-ring-pulse 2.4s ease-out infinite;
}
@keyframes nd-ring-pulse {
  0%   { transform: scale(.85); opacity: .6; }
  100% { transform: scale(1.35); opacity: 0; }
}

/* ─ NEXT — couleur monde, éclair, halo pulsant ─ */
.prc-node.next .nd-circle {
  background: #6366f1;
  box-shadow: 0 4px 18px rgba(99,102,241,.45);
  animation: ndPulseValid 2.4s ease-in-out infinite;
}
/* Pulse blanc → vert pour indiquer "prêt à valider" */
@keyframes ndPulseValid {
  0%, 100% {
    background: #6366f1;
    box-shadow: 0 4px 18px rgba(99,102,241,.45);
  }
  40% {
    background: #ffffff;
    box-shadow: 0 4px 22px rgba(255,255,255,.7), inset 0 0 0 2.5px #6366f1;
  }
  70% {
    background: #10b981;
    box-shadow: 0 4px 22px rgba(16,185,129,.55);
  }
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
  background: radial-gradient(circle, rgba(99,102,241,.22) 0%, transparent 70%);
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
  border: 1.5px solid rgba(99,102,241,.25);
  animation: nd-ring-pulse 1.8s ease-out infinite;
}

/* ─ TODO — blanc, bordure pointillée ─ */
.prc-node.todo .nd-circle {
  background: #fff;
  border-color: #e2e6f2;
  border-style: dashed;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
/* Volant grisé statique sur les compétences pas encore débloquées */
.nd-wheel-todo {
  width: 60%;
  height: 60%;
  background-color: #cbd5e1;
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
  background: #cbd5e1;
  position: absolute;
}

/* ─ LOCKED — gris pâle, cadenas SVG ─ */
.prc-node.locked .nd-circle {
  background: #e5e7eb;
  border-color: #f3f4f6;
  box-shadow: none;
}

/* ── Labels flottants sous le node ── */
.nd-lbl {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,.97);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid #e2e6f2;
  border-radius: 12px;
  padding: 7px 11px 8px;
  width: max-content;
  max-width: 190px;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 6px 18px rgba(11,13,26,.1), 0 1px 3px rgba(11,13,26,.06);
  pointer-events: none;
}
/* Nom compétence — ROI typographique */
.nd-lbl .nd-name {
  display: block;
  font: 600 13px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
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
  color: #94a3b8;
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
.prc-node.done .nd-lbl .nd-stt { color: #10b981; }

.prc-node.next .nd-lbl {
  border-color: rgba(99,102,241,.3);
  box-shadow: 0 8px 22px rgba(99,102,241,.15), 0 0 0 2px rgba(99,102,241,.2);
}
.prc-node.next .nd-lbl .nd-name { color: #0a0d1a; }
.prc-node.next .nd-lbl .nd-stt  { color: #6366f1; }
/* Badge "TU ES ICI" */
.prc-node.next .nd-lbl::before {
  content: 'TU ES ICI';
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background: #6366f1;
  color: #fff;
  font: 800 8px/1 'Inter', sans-serif;
  padding: 3px 9px;
  border-radius: 99px;
  letter-spacing: .14em;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(99,102,241,.35);
  animation: tu-bounce 1.6s ease-in-out infinite;
}
@keyframes tu-bounce {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%     { transform: translateX(-50%) translateY(-3px); }
}

.prc-node.todo .nd-lbl .nd-name { color: #64748b; }
.prc-node.todo .nd-lbl .nd-stt  { color: #94a3b8; }

.prc-node.locked .nd-lbl {
  background: rgba(248,249,252,.95);
  border-color: rgba(203,213,225,.4);
  box-shadow: 0 2px 8px rgba(11,13,26,.06);
}
.prc-node.locked .nd-lbl .nd-name { color: #94a3b8; }
.prc-node.locked .nd-lbl .nd-code { color: #cbd5e1; }
.prc-node.locked .nd-lbl .nd-stt  { color: #cbd5e1; }

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
  border-radius: 99px;
  background: rgba(255,255,255,.9);
  border: 1px solid #e2e6f2;
  font-family: 'Inter', sans-serif;
  font-size: 9.5px;
  font-weight: 800;
  color: var(--wc, #6366f1);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 5px;
  box-shadow: 0 2px 8px rgba(11,13,26,.07);
}
.prc-portal h3 { font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin: 0 0 4px; }
.prc-portal p  { font: 500 12px/1.4 'Inter', sans-serif; color: #64748b; max-width: 260px; margin: 0 auto; }
.prc-world.complete .prc-portal h3 { color: var(--wc); }

/* Monde verrouillé → overlay grisé */
.prc-world.locked::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(248,249,252,.6);
  z-index: 8;
  backdrop-filter: grayscale(.8);
  pointer-events: none;
}
.prc-world.locked { background: #fafbfd; }
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
  border-radius: 99px;
}
.prc-bridge::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background-image: linear-gradient(180deg, #94a3b8 50%, transparent 0);
  background-size: 2px 10px;
  opacity: .6;
}

/* ── Final — fin du voyage ── */
.prc-final {
  margin: 20px 12px 0;
  padding: 24px 18px;
  background: #fff;
  border: 1.5px solid #e2e6f2;
  color: #0a0d1a;
  border-radius: 20px;
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
    radial-gradient(ellipse at 30% 20%, rgba(99,102,241,.06), transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(245,158,11,.05), transparent 50%);
  pointer-events: none;
}
.prc-final h3  { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; margin: 0 0 6px; position: relative; color: #0a0d1a; }
.prc-final p   { font: 500 12.5px/1.4 'Inter', sans-serif; color: #64748b; margin: 0 0 16px; position: relative; }
.prc-final-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; position: relative; }
.prc-final-stat .v { font: 900 22px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; color: #0a0d1a; }
.prc-final-stat .l { font: 600 9px/1 'Inter', sans-serif; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }

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
.bsheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 99;
  background: #fff;
  border-radius: 24px 24px 0 0;
  border-top: 1px solid #e2e6f2;
  box-shadow: 0 -4px 32px rgba(11,13,26,.1);
  transform: translateY(100%);
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  touch-action: pan-y;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  will-change: transform;
  max-height: 86vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.bsheet.open { transform: translateY(0); }
.bsheet-handle {
  width: 36px; height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  margin: 12px auto 0;
  flex-shrink: 0;
  touch-action: none;
  cursor: grab;
}

/* Fiche compétence (bottom sheet content) */
.fiche-hero {
  position: relative;
  padding: 20px 20px 28px;
  text-align: center;
}
.fiche-hero .fiche-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #f0f2f8;
  color: #64748b;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border: 0;
}
.fiche-badge-cat {
  font: 700 9.5px/1 'Inter', sans-serif;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 12px;
  text-align: center;
}
.fiche-circle {
  width: 80px; height: 80px;
  border-radius: 50%;
  margin: 0 auto 12px;
  border: 3px solid #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 24px rgba(11,13,26,.12);
  font-size: 28px;
  background: var(--wc, #6366f1);
  color: #fff;
}
.fiche-circle.done { background: #10b981; animation: fiche-pop .55s cubic-bezier(.5,1.6,.4,1) both; }
@keyframes fiche-pop {
  0%  { transform: scale(.3) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.12) rotate(8deg); opacity: 1; }
  100%{ transform: scale(1) rotate(0); }
}
.fiche-hero h3 {
  font: 800 20px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin: 0 0 4px;
}
.fiche-hero .fiche-id {
  font: 600 10.5px/1 'Inter', sans-serif;
  color: #94a3b8;
  letter-spacing: 1px;
  margin-bottom: 10px;
}
.stt-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.stt-pill.done   { background: #dcfce7; color: #15803d; }
.stt-pill.next   { background: var(--wc, #6366f1); color: #fff; }
.stt-pill.todo   { background: #f0f2f8; color: #64748b; }
.stt-pill.locked { background: #f0f2f8; color: #94a3b8; }

.fiche-body { padding: 0 16px 16px; }
.fiche-section {
  background: #f8f9fc;
  border: 1px solid #e2e6f2;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
}
.fiche-section .sec-lbl {
  font: 700 9.5px/1 'Inter', sans-serif;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fiche-section .sec-txt {
  font: 500 13.5px/1.5 'Inter', sans-serif;
  color: #0a0d1a;
  font-style: italic;
}
.fiche-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid #f0f2f8;
  font-size: 13px;
}
.fiche-meta-row:first-of-type { border-top: 0; padding-top: 0; }
.fiche-meta-row .ml { color: #64748b; font-weight: 500; }
.fiche-meta-row .mv { color: #0a0d1a; font-weight: 700; font-family: 'Inter', sans-serif; font-size: 12px; }
.fiche-empty {
  text-align: center;
  padding: 18px;
}
.fiche-empty .em { font-size: 28px; opacity: .4; margin-bottom: 6px; }
.fiche-empty .et { font: 500 12.5px/1.5 'Inter', sans-serif; color: #94a3b8; font-style: italic; }

/* ── Fiche premium v2 (refonte 2026-05) ──────────────────────── */
.fiche-circle svg { width: 36px; height: 36px; stroke: #fff; stroke-width: 2.5; }
.fiche-circle.done svg { stroke: #fff; }

/* Bloc "summary" — la phrase qui résume l'essentiel */
.fiche-summary {
  padding: 16px 18px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #f8f9fc, #fff);
  border: 1px solid #e2e6f2;
  border-radius: 16px;
  position: relative;
}
.fiche-summary::before {
  content: '"';
  position: absolute;
  top: -8px; left: 14px;
  font: 900 48px/1 Georgia, serif;
  color: var(--wc, #6366f1);
  opacity: .55;
}
.fiche-summary p {
  margin: 0;
  font: 600 15px/1.45 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -.015em;
}

/* Progression chip + barre */
.fiche-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 14px;
}
.fiche-progress-info {
  flex-shrink: 0;
  text-align: left;
}
.fiche-progress-step {
  font: 700 11px/1 'Inter', sans-serif;
  color: #94a3b8;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.fiche-progress-val {
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
}
.fiche-progress-val .of { font-weight: 600; color: #94a3b8; font-size: 13px; }
.fiche-progress-track {
  flex: 1;
  height: 8px;
  background: #f0f2f8;
  border-radius: 99px;
  overflow: hidden;
  position: relative;
}
.fiche-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--wc, #6366f1), color-mix(in srgb, var(--wc, #6366f1) 70%, #fff));
  border-radius: 99px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

/* Bloc "Ce que tu vas maîtriser" */
.fiche-block {
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
}
.fiche-block-title {
  font: 700 11px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fiche-block-title svg { color: var(--wc, #6366f1); }
.fiche-block-list { list-style: none; margin: 0; padding: 0; }
.fiche-block-list li {
  position: relative;
  padding: 7px 0 7px 26px;
  font: 500 13.5px/1.4 'Inter', sans-serif;
  color: #0a0d1a;
  border-top: 1px solid #f0f2f8;
}
.fiche-block-list li:first-child { border-top: 0; padding-top: 4px; }
.fiche-block-list li::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px; height: 14px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--wc, #6366f1) 15%, #fff);
  border: 1.5px solid var(--wc, #6366f1);
}

/* Bloc "Conseil du coach" — accent jaune doux */
.fiche-tip {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fef9e7, #fffbeb);
  border: 1px solid #fde68a;
  border-radius: 14px;
  margin-bottom: 10px;
}
.fiche-tip-ico {
  flex-shrink: 0;
  width: 32px; height: 32px;
  border-radius: 10px;
  background: #f59e0b;
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
  color: #b45309;
  margin-bottom: 4px;
}
.fiche-tip-text {
  font: 500 13.5px/1.45 'Inter', sans-serif;
  color: #0a0d1a;
}

/* Bloc status contextuel (acquise / next / locked) */
.fiche-status {
  padding: 14px 16px;
  border-radius: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.fiche-status.done   { background: #ecfdf5; border: 1px solid #a7f3d0; }
.fiche-status.next   { background: color-mix(in srgb, var(--wc, #6366f1) 8%, #fff); border: 1px solid color-mix(in srgb, var(--wc, #6366f1) 35%, transparent); }
.fiche-status.locked { background: #f8f9fc; border: 1px solid #e2e6f2; }
.fiche-status-ico {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.fiche-status.done   .fiche-status-ico { background: #10b981; color: #fff; }
.fiche-status.next   .fiche-status-ico { background: var(--wc, #6366f1); color: #fff; }
.fiche-status.locked .fiche-status-ico { background: #cbd5e1; color: #fff; }
.fiche-status-body { flex: 1; }
.fiche-status-title {
  font: 700 13px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  margin-bottom: 2px;
}
.fiche-status-sub {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: #64748b;
}
</style>`;

// ─── Identité visuelle par monde (PNG premium ChatGPT 3D) ───────
const WORLDS_META = [
  { num: 1, color: '#10b981', glow: 'rgba(16,185,129,.35)',  img: ASSETS.worldC1 },
  { num: 2, color: '#06b6d4', glow: 'rgba(6,182,212,.35)',   img: ASSETS.worldC2 },
  { num: 3, color: '#8b5cf6', glow: 'rgba(139,92,246,.35)',  img: ASSETS.worldC3 },
  { num: 4, color: '#f59e0b', glow: 'rgba(245,158,11,.35)',  img: ASSETS.worldC4 },
];

// Combien de compétences du monde N-1 pour débloquer le monde N
const UNLOCK_REQ = [null, 5, 6, 6];

const NOW_MS       = Date.now();
const NEW_BADGE_MS = 24 * 60 * 60 * 1000;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'eleve_parcours' });

  root.innerHTML = `${STYLE}<div class="prc"><div class="prc-hd"><div><div class="prc-title">Mon parcours</div><div class="prc-subtitle">31 compétences · Permis B</div></div></div><div style="padding:32px;text-align:center;color:#94a3b8">Chargement…</div></div>`;

  const { data: valData } = await sb
    .from('validations')
    .select('competence_id, validated_at, statut, score_cognitif, score_consolidation, teacher:profiles!validated_by(prenom, nom)')
    .eq('eleve_id', me.id);

  // validatedMap : { compId → validation entry }
  const validatedMap = {};
  for (const v of (valData || [])) {
    if (v.statut === 'acquis') {
      validatedMap[v.competence_id] = {
        validated_at:        v.validated_at,
        teacherName:         v.teacher?.prenom ?? null,
        score_cognitif:      v.score_cognitif ?? null,
        score_consolidation: v.score_consolidation ?? null,
      };
    }
  }

  const worldStates = computeWorldStates(validatedMap);

  ensureChestStyles();
  root.innerHTML = renderPage(worldStates, validatedMap);
  wire(root, worldStates, validatedMap, me);

  // Persister en DB les coffres des mondes complétés (idempotent)
  const CHEST_REWARDS = [
    { xp: 200, gemmes: 50  },
    { xp: 400, gemmes: 100 },
    { xp: 700, gemmes: 175 },
    { xp: 1200, gemmes: 300 },
  ];
  worldStates.forEach((ws, i) => {
    if (ws.status === 'complete') {
      const num = i + 1;
      unlockChest(`world_${num}`, CHEST_REWARDS[i] ?? { xp: 200, gemmes: 50 }).catch(() => {});
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
      fresh = cid; freshTs = ts;
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
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Crée l'overlay flèche après le scroll
  setTimeout(() => spawnArrow(node, compId), 600);
}

function spawnArrow(node, compId) {
  // Évite doublon
  document.querySelector('.fresh-arrow')?.remove();

  const ind = document.createElement('div');
  ind.className = 'fresh-arrow';
  ind.innerHTML = `
    <style>
      .fresh-arrow {
        position: fixed;
        z-index: 320;
        pointer-events: none;
        transform: translate(-50%, -100%);
        animation: faIn .35s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes faIn {
        from { opacity: 0; transform: translate(-50%, -130%) scale(.85); }
        to   { opacity: 1; transform: translate(-50%, -100%) scale(1); }
      }
      .fa-bubble {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
        padding: 10px 16px;
        border-radius: 14px;
        font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
        white-space: nowrap;
        box-shadow: 0 12px 32px -8px rgba(99,102,241,.6);
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
        background: #8b5cf6;
      }
      .fa-arrow {
        width: 28px;
        height: 40px;
        margin: 0 auto;
        color: #6366f1;
        animation: faBounce 1.2s ease-in-out infinite;
        filter: drop-shadow(0 4px 8px rgba(99,102,241,.4));
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
    <div class="fa-bubble">✨ Tu viens de débloquer : ${esc(resolveCompName(compId))}</div>
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
  window.addEventListener('scroll', position, { passive: true });
  window.addEventListener('resize', position);

  const dismiss = () => {
    ind.classList.add('dismiss');
    setTimeout(() => {
      ind.remove();
      window.removeEventListener('scroll', position);
      window.removeEventListener('resize', position);
    }, 280);
  };

  // Tap node = disparaît
  node.addEventListener('click', dismiss, { once: true });
  // Auto-dismiss après 8s
  setTimeout(dismiss, 8000);
}

// ─── Logique métier ───────────────────────────────────────────────
function computeWorldStates(validatedMap) {
  const states = REMC.map((cat, idx) => {
    const world  = WORLDS[idx];
    const subs   = cat.subs;
    const done   = subs.filter(s => validatedMap[s.c]).length;
    const total  = subs.length;
    const pct    = Math.round((done / total) * 100);
    const complete = done === total;

    let status;
    if (idx === 0) {
      status = complete ? 'complete' : 'in_progress';
    } else {
      const prevDone = REMC[idx - 1].subs.filter(s => validatedMap[s.c]).length;
      const req      = UNLOCK_REQ[idx];
      status = prevDone < req ? 'locked' : (complete ? 'complete' : 'in_progress');
    }

    const nextChallenge = status !== 'locked' && !complete
      ? subs.find(s => !validatedMap[s.c])?.c ?? null
      : null;

    const prevDoneCount = idx > 0
      ? REMC[idx - 1].subs.filter(s => validatedMap[s.c]).length
      : null;

    return { idx, world, cat, subs, done, total, pct, complete, status, nextChallenge, prevDoneCount };
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
  if (!compId) return '';
  const normalized = compId.toLowerCase();
  for (const cat of REMC) {
    const sub = cat.subs.find(s => s.c.toLowerCase() === normalized);
    if (sub) return sub.n;
  }
  return compId;
}

function compStatus(compId, worldStatus, nextChallenge, validatedMap) {
  if (worldStatus === 'locked') return 'locked';
  if (validatedMap[compId])     return 'done';
  if (compId === nextChallenge) return 'next';
  return 'todo';
}

// ─── Render principal ─────────────────────────────────────────────
function renderPage(worldStates, validatedMap) {
  const totalDone  = worldStates.reduce((s, w) => s + w.done, 0);
  const totalComps = worldStates.reduce((s, w) => s + w.total, 0);
  const globalPct  = Math.round((totalDone / totalComps) * 100);

  return `${STYLE}
<div class="prc">

  <!-- Header sticky -->
  <div class="prc-hd">
    <div>
      <div class="prc-title">Mon parcours</div>
      <div class="prc-subtitle">31 compétences · Permis B</div>
    </div>
    <div class="prc-hd-right">
      <div class="prc-total">${totalDone}<span class="prc-total-denom">/${totalComps}</span></div>
      <div class="prc-total-lbl">acquises</div>
    </div>
  </div>

  <!-- Barre globale -->
  <div class="prc-global-bar">
    <div class="prc-global-track">
      <div class="prc-global-fill" style="width:${globalPct}%"></div>
    </div>
    <div class="prc-global-meta">
      <span>${globalPct}% du chemin</span>
      <span>${totalComps - totalDone} restantes</span>
    </div>
  </div>

  <!-- Légende -->
  <div class="prc-legend">
    <span><i style="background:#10b981"></i>Acquis</span>
    <span><i style="background:#6366f1"></i>En cours</span>
    <span><i style="background:#e2e6f2"></i>À faire</span>
    <span><i style="background:#cbd5e1"></i>Verrouillé</span>
  </div>

  <!-- Carte des mondes -->
  <div class="prc-map-frame">
    <div class="prc-map-border" aria-hidden="true"></div>
    <div class="prc-map-corners" aria-hidden="true">
      <span class="prc-corner tl"></span>
      <span class="prc-corner tr"></span>
      <span class="prc-corner bl"></span>
      <span class="prc-corner br"></span>
    </div>
    <div class="prc-map-badge" aria-hidden="true">
      <span class="prc-map-badge-dot"></span> CARTE D'APPRENTISSAGE
    </div>
    <div class="prc-map" id="prc-map-scroll">
      ${totalDone === 0 ? renderEmptyState({
        illustration: '/skins/empty-parcours.png',
        title: 'Ton parcours t\'attend !',
        subtitle: 'Clique sur ta première compétence ci-dessous pour démarrer.',
        ctaLabel: 'Voir ma première compétence',
        ctaHref: '#prc-comp-first',
      }) : ''}
      ${worldStates.map((ws, i) => renderWorldSection(ws, validatedMap, i < worldStates.length - 1)).join('')}
      ${renderFinal(totalDone, totalComps)}
      <div style="height: 24px"></div>
    </div>
    <div class="prc-map-fade-top"  aria-hidden="true"></div>
    <div class="prc-map-fade-bottom" aria-hidden="true"></div>
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
function renderWorldSection(ws, validatedMap, hasNext) {
  const { idx, cat, subs, done, total, status, nextChallenge } = ws;
  const meta = WORLDS_META[idx];
  const world = WORLDS[idx];
  const isLocked = status === 'locked';
  const isComplete = status === 'complete';

  // ─ Génération route SVG sinueuse ─
  const W = 280;
  const H = Math.max(480, subs.length * 175 + 80);

  const points = subs.map((sub, i) => {
    const yPct = (i + 0.5) / subs.length;
    const wave = Math.sin(i * 0.85) * 0.28;
    const xPct = 0.5 + wave;
    return { c: sub.c, n: sub.n, x: xPct * W, y: yPct * H };
  });

  let pathD = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i], pp = points[i - 1];
    const my = (pp.y + p.y) / 2;
    pathD += ` C ${pp.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }
  pathD += ` L ${points[points.length - 1].x} ${H}`;

  const nodesHTML = points.map((p, i) => {
    const st = compStatus(p.c, status, nextChallenge, validatedMap);
    const xp = (p.x / W * 100).toFixed(2);
    const yp = (p.y / H * 100).toFixed(2);
    const delay = (i * 0.07 + 0.12).toFixed(2);
    const sttLabel = {
      done:   'Acquis',
      next:   'Prochain défi',
      todo:   'À débloquer',
      locked: 'Verrouillé',
    }[st];

    // Icône SVG propre selon statut
    const icon = {
      done: `<div class="nd-wheel-done" aria-hidden="true"></div>`,
      next: `<img class="nd-wheel" src="/worlds/volant.png" alt="" width="32" height="32" aria-hidden="true"/>`,
      todo:   `<div class="nd-wheel-todo" aria-hidden="true"></div>`,
      locked: `<svg width="14" height="17" viewBox="0 0 14 17" fill="none" aria-hidden="true">
        <rect x="1.5" y="7.5" width="11" height="9" rx="2" stroke="#9ca3af" stroke-width="1.4"/>
        <path d="M3.5 7.5V5.5a3.5 3.5 0 017 0v2" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        <circle cx="7" cy="12" r="1.4" fill="#9ca3af"/>
      </svg>`,
    }[st];

    const isLocked = st === 'locked';
    return `
      <div class="prc-node ${st}" data-comp="${esc(p.c)}" data-world-idx="${idx}"
           style="left:${xp}%;top:${yp}%;--wc:${meta.color};--wg:${meta.glow};--nd-delay:${delay}s"
           ${!isLocked ? `role="button" tabindex="0"` : 'aria-hidden="true"'}
           aria-label="${esc(p.n)} — ${esc(sttLabel)}">
        <div class="nd-circle">${icon}</div>
        <div class="nd-lbl" aria-hidden="true">
          <span class="nd-name">${esc(p.n)}</span>
          <span class="nd-code">${esc(p.c.toUpperCase())}</span>
          <span class="nd-stt">${esc(sttLabel)}</span>
        </div>
      </div>`;
  }).join('');

  // Message monde verrouillé
  const lockMsg = isLocked ? (() => {
    const req = UNLOCK_REQ[idx];
    const prevDone = ws.prevDoneCount ?? 0;
    const need = req - prevDone;
    return `<div style="position:relative;z-index:9;text-align:center;padding:12px 16px;font:500 13px/1.4 'Inter',sans-serif;color:#64748b">Débloque <strong style="color:#0a0d1a">${need} compétence${need > 1 ? 's' : ''}</strong> dans le monde précédent pour accéder.</div>`;
  })() : '';

  return `
<section class="prc-world ${isLocked ? 'locked' : ''} ${isComplete ? 'complete' : ''}"
         data-world-idx="${idx}"
         style="--wc:${meta.color};--wg:${meta.glow}">
  <!-- Petit visuel décoratif top-right (au lieu de fond plein) -->
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
      ${isComplete ? ' 🏆' : ''}
    </div>
  </div>

  ${lockMsg}

  <!-- Route + nodes -->
  <div class="prc-route" style="min-height:${H}px">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">
      <path class="prc-path-shadow" d="${pathD}" />
      <path class="prc-path-edge"   d="${pathD}" />
      <path class="prc-path"        d="${pathD}" />
      <path class="prc-path-light"  d="${pathD}" />
    </svg>
    ${nodesHTML}
  </div>

  <!-- Portail de fin de monde -->
  <div class="prc-portal">
    ${renderPortalArch(meta.color, isComplete)}
    <div class="pbadge">${isComplete ? '✓ Monde terminé' : `${total - done} à débloquer`}</div>
    <h3>${isComplete ? `Monde ${meta.num} terminé !` : `Continue l'aventure`}</h3>
    <p>${isComplete
      ? (hasNext ? `Le monde ${idx + 2} t'attend.` : `Tu as conquis tous les mondes !`)
      : (hasNext ? `Termine ce monde pour débloquer le suivant.` : `Le sommet est proche.`)}</p>
  </div>

  ${isComplete ? renderChest({
    worldNum: meta.num,
    worldName: world.nom,
    opened: isChestOpened(meta.num),
  }) : ''}

  ${hasNext ? '<div class="prc-bridge"></div>' : ''}
</section>`;
}

function renderPortalArch(color, isComplete) {
  return `
<div class="prc-portal-arch">
  <svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg">
    <path class="arch-bg" d="M 20 170 L 20 80 Q 20 20, 65 20 Q 110 20, 110 80 L 110 170 Z" />
    <path class="arch-stroke" d="M 20 170 L 20 80 Q 20 20, 65 20 Q 110 20, 110 80 L 110 170" />
    <path class="arch-light"  d="M 30 170 L 30 80 Q 30 30, 65 30 Q 100 30, 100 80 L 100 170" />
    ${isComplete ? `
      <circle cx="65" cy="70" r="5" fill="${color}" opacity=".9"/>
      <circle cx="65" cy="70" r="12" fill="none" stroke="${color}" stroke-width="1.5" opacity=".5">
        <animate attributeName="r" values="6;20" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".8;0" dur="2s" repeatCount="indefinite"/>
      </circle>` : ''}
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
function wire(root, worldStates, validatedMap, me) {
  // Back via hashchange
  root.querySelector('#prc-back')?.addEventListener('click', () => {
    location.hash = '#/accueil';
  });

  // Auto-scroll vers le monde en cours
  requestAnimationFrame(() => {
    const target = worldStates.find(w => w.status === 'in_progress');
    if (target) {
      root.querySelector(`[data-world-idx="${target.idx}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Coffres → modal cinématique
  root.querySelectorAll('.chest-card:not(.opened)').forEach(card => {
    const worldNum = parseInt(card.dataset.chestWorld, 10);
    const ws = worldStates[worldNum - 1];
    const open = () => {
      track('parcours.chest_open', { worldNum });
      openChestModal({ worldNum, worldName: ws?.world?.nom ?? `Monde ${worldNum}` });
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  // Nodes → ouvre la fiche (click + Enter/Space pour keyboard nav)
  root.querySelectorAll('.prc-node:not(.locked)').forEach(n => {
    const open = () => {
      const compId   = n.dataset.comp;
      const worldIdx = parseInt(n.dataset.worldIdx, 10);
      openFiche(root, compId, worldStates[worldIdx], validatedMap);
      track('parcours.node_tap', { compId, worldIdx });
    };
    n.addEventListener('click', open);
    n.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  // Bottom sheet — close
  const bg    = root.querySelector('#bsheet-bg') ?? document.getElementById('bsheet-bg');
  const sheet = root.querySelector('#bsheet')    ?? document.getElementById('bsheet');
  const closeFn = () => {
    sheet?.classList.remove('open');
    bg?.classList.remove('open');
    sheet?.setAttribute('aria-hidden', 'true');
  };
  bg?.addEventListener('click', closeFn);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFn(); });
}

function openFiche(root, compId, ws, validatedMap) {
  const { idx, cat, status, nextChallenge } = ws;
  const meta = WORLDS_META[idx];
  const world = WORLDS[idx];
  const sub = cat.subs.find(s => s.c === compId);
  if (!sub) return;

  const st = compStatus(compId, status, nextChallenge, validatedMap);
  const val = validatedMap[compId];
  const stLabel = { done: 'Acquise', next: "En cours", todo: 'À travailler', locked: 'Verrouillée' }[st];
  const compNum = cat.subs.findIndex(s => s.c === compId) + 1;
  const total = cat.subs.length;
  const detail = getCompDetail(compId);

  // Icône SVG selon statut (au lieu d'emoji)
  const stIcon = {
    done:   icon('check', { size: 36 }),
    next:   icon('zap', { size: 32 }),
    todo:   icon('clock', { size: 30 }),
    locked: icon('lock', { size: 28 }),
  }[st];

  // Progression visuelle dans le monde (n / total)
  const pctInWorld = Math.round((compNum / total) * 100);

  // Bloc status contextuel selon état
  const statusBlock = (() => {
    if (st === 'done' && val) {
      const dateStr = val.validated_at
        ? new Date(val.validated_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })
        : null;
      const parts = [];
      if (dateStr) parts.push(`Validée le ${dateStr}`);
      if (val.teacherName) parts.push(`par ${val.teacherName}`);
      if (val.score_cognitif != null) parts.push(`Quiz : ${Math.round(val.score_cognitif * 100)}%`);
      return `
        <div class="fiche-status done">
          <div class="fiche-status-ico">${icon('check', { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Compétence acquise</div>
            <div class="fiche-status-sub">${esc(parts.join(' · ') || 'Bravo, tu maîtrises cette compétence !')}</div>
          </div>
        </div>`;
    }
    if (st === 'done') {
      return `
        <div class="fiche-status done">
          <div class="fiche-status-ico">${icon('check', { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Compétence acquise</div>
            <div class="fiche-status-sub">Bravo, tu maîtrises cette compétence.</div>
          </div>
        </div>`;
    }
    if (st === 'next') {
      return `
        <div class="fiche-status next" style="--wc:${meta.color}">
          <div class="fiche-status-ico">${icon('zap', { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Prochaine étape</div>
            <div class="fiche-status-sub">Pratique cette compétence avec ton moniteur — il la validera dans ton livret.</div>
          </div>
        </div>`;
    }
    if (st === 'locked') {
      return `
        <div class="fiche-status locked">
          <div class="fiche-status-ico">${icon('lock', { size: 18 })}</div>
          <div class="fiche-status-body">
            <div class="fiche-status-title">Verrouillée</div>
            <div class="fiche-status-sub">Termine les compétences précédentes pour débloquer celle-ci.</div>
          </div>
        </div>`;
    }
    return `
      <div class="fiche-status next" style="--wc:${meta.color}">
        <div class="fiche-status-ico">${icon('clock', { size: 18 })}</div>
        <div class="fiche-status-body">
          <div class="fiche-status-title">À travailler</div>
          <div class="fiche-status-sub">Cette compétence reste à pratiquer. Continue à avancer dans ton parcours.</div>
        </div>
      </div>`;
  })();

  const body = root.querySelector('#bsheet-body') ?? document.getElementById('bsheet-body');
  body.innerHTML = `
    <div class="fiche-hero" style="--wc:${meta.color}">
      <button class="fiche-close" type="button" aria-label="Fermer">×</button>
      <div class="fiche-badge-cat">MONDE ${meta.num} · ${esc(world.nom).toUpperCase()}</div>
      <div class="fiche-circle ${st === 'done' ? 'done' : ''}" style="background:${st === 'done' ? '#10b981' : meta.color}">
        ${stIcon}
      </div>
      <h3 id="bsheet-title">${esc(sub.n)}</h3>
      <div class="fiche-id">${esc(compId.toUpperCase())} · ${compNum}/${total}</div>
      <div><span class="stt-pill ${st}" style="--wc:${meta.color}">${esc(stLabel)}</span></div>
    </div>
    <div class="fiche-body">

      <!-- 1. SUMMARY — le pitch -->
      <div class="fiche-summary" style="--wc:${meta.color}">
        <p>${esc(detail.summary)}</p>
      </div>

      <!-- 2. PROGRESSION dans le monde -->
      <div class="fiche-progress" style="--wc:${meta.color}">
        <div class="fiche-progress-info">
          <div class="fiche-progress-step">Étape</div>
          <div class="fiche-progress-val">${compNum}<span class="of">/${total}</span></div>
        </div>
        <div class="fiche-progress-track">
          <div class="fiche-progress-fill" style="width:${pctInWorld}%"></div>
        </div>
      </div>

      <!-- 3. STATUS contextuel -->
      ${statusBlock}

      <!-- 4. POINTS CLÉS -->
      <div class="fiche-block" style="--wc:${meta.color}">
        <div class="fiche-block-title">
          ${icon('target', { size: 14 })}
          Ce que tu vas maîtriser
        </div>
        <ul class="fiche-block-list">
          ${detail.keyPoints.map(kp => `<li>${esc(kp)}</li>`).join('')}
        </ul>
      </div>

      <!-- 5. CONSEIL DU COACH -->
      <div class="fiche-tip">
        <div class="fiche-tip-ico">${icon('sparkle', { size: 16 })}</div>
        <div class="fiche-tip-body">
          <div class="fiche-tip-label">Conseil du coach</div>
          <div class="fiche-tip-text">${esc(detail.tip)}</div>
        </div>
      </div>

    </div>`;

  body.querySelector('.fiche-close')?.addEventListener('click', () => {
    const bg    = document.getElementById('bsheet-bg');
    const sheet = document.getElementById('bsheet');
    sheet?.classList.remove('open');
    bg?.classList.remove('open');
  });

  const bg    = document.getElementById('bsheet-bg');
  const sheet = document.getElementById('bsheet');
  sheet?.classList.add('open');
  bg?.classList.add('open');
  sheet?.setAttribute('aria-hidden', 'false');
  // Move focus into the dialog for keyboard/screen reader users
  requestAnimationFrame(() => {
    sheet?.querySelector('.fiche-close')?.focus();
  });
}
