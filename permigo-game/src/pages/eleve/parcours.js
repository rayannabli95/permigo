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
import { medallion, medStatus } from "@/utils/medallions.js";
import { haptic } from "@/utils/haptic.js";
import {
  renderChest,
  openChestModal,
  ensureChestStyles,
} from "@/components/eleve/chest.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import {
  unlockChest,
  openChest,
  getMyChests,
  markChestOpened,
} from "@/utils/game-state.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* CSS purgé (vue carte/liste supprimée) — seul le CSS vue-chapitre + bsheet + fiche suit */

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
/* Disque héros portant un médaillon 3D : la pièce fournit le relief,
   on retire le fond plat + l'ombre + l'anim rotative du carré coloré. */
.fiche-circle.has-med {
  background: none !important;
  box-shadow: none !important;
  animation: none !important;
  width: 62px; height: 62px;
}
.fiche-circle.has-med svg.pg-med {
  width: 100%; height: 100%;
  filter: drop-shadow(0 6px 12px rgba(10,4,26,.32));
}
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

/* ════════════════════════════════════════════════════════════════
   FICHE COMPÉTENCE — refonte « Arène nuit-violet » (cohérente avec
   l'itinéraire immersif). Override des styles clairs ci-dessus.
   ════════════════════════════════════════════════════════════════ */
.bsheet {
  background:
    radial-gradient(120% 80% at 50% 0%, #2a1655 0%, transparent 55%),
    linear-gradient(180deg, #1c1240 0%, #160c30 55%, #110920 100%);
  border-top: 1px solid rgba(168,85,247,.35);
  box-shadow: 0 -12px 44px rgba(6,2,18,.65), inset 0 1px 0 rgba(255,255,255,.07);
  color: #fff;
}
.bsheet-handle { background: rgba(255,255,255,.2); }
.fiche-hero { padding: 18px 18px 8px; }
.fiche-hero .fiche-close {
  background: rgba(255,255,255,.08);
  color: #cdbff5;
  border: 1px solid rgba(255,255,255,.14);
}
.fiche-hero .fiche-close:hover { background: rgba(255,255,255,.15); color: #fff; }
.fiche-badge-cat { color: #c9b8ff; letter-spacing: .16em; opacity: .92; }
.fiche-circle {
  width: 62px; height: 62px; border-radius: 19px;
  box-shadow:
    0 12px 28px -8px rgba(124,77,255,.7),
    inset 0 2px 0 rgba(255,255,255,.45),
    inset 0 -5px 10px rgba(20,8,50,.4);
}
.fiche-circle.done:not(.has-med) {
  background: linear-gradient(160deg, #3ee07e 0%, #22a35a 60%, #178246 100%) !important;
  box-shadow:
    0 12px 28px -8px rgba(20,120,60,.7),
    inset 0 2px 0 rgba(255,255,255,.5) !important;
}
.fiche-hero h3 {
  font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; font-size: 21px; letter-spacing: -.3px;
  color: #fff; text-shadow: 0 2px 14px rgba(8,2,26,.5);
}
.fiche-hero .fiche-id { color: #a99fce; }
.stt-pill.done   { background: rgba(62,224,126,.16); color: #7ef0a8; }
.stt-pill.next   { background: linear-gradient(160deg,#ffd24a,#ff9c1c); color: #3a1c00; }
.stt-pill.todo   { background: rgba(255,255,255,.08); color: #b9aee0; }
.stt-pill.locked { background: rgba(255,255,255,.06); color: #8d80b8; }
.fiche-summary-txt, .fiche-summary p { color: #d9cffa !important; opacity: 1; }
/* Blocs status */
.fiche-status { border: 1px solid rgba(255,255,255,.09); }
.fiche-status.done   { background: rgba(62,224,126,.1) !important; }
.fiche-status.next   { background: rgba(124,77,255,.16) !important; }
.fiche-status.locked { background: rgba(255,255,255,.05) !important; }
.fiche-status.done   .fiche-status-ico { background: linear-gradient(160deg,#3ee07e,#178246); color:#fff; }
.fiche-status.next   .fiche-status-ico { background: linear-gradient(160deg,#fff0bf,#ffd24a 50%,#ff9c1c); color:#3a1c00; }
.fiche-status.locked .fiche-status-ico { background: rgba(255,255,255,.12); color:#cdbff5; }
.fiche-status-title { color: #fff !important; }
.fiche-status.done   .fiche-status-title { color: #8ef0b0 !important; }
.fiche-status.next   .fiche-status-title { color: #fff !important; }
.fiche-status-sub { color: #b9aee0 !important; }
.fiche-status.done .fiche-status-sub { color: #9fe0b8 !important; }
.fiche-status.next .fiche-status-sub { color: #cdbff5 !important; }
/* Accordéon « points clés » */
.fiche-acc { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
.fiche-acc > summary { color: #fff; }
.fiche-acc > summary svg { color: #ffd24a; }
.fiche-acc-chev { color: #a99fce; }
.fiche-block-list li { color: #e6def8; border-top-color: rgba(255,255,255,.08); }
.fiche-block-list .kp-check { background: rgba(255,210,74,.2); color: #ffd24a; }
.fiche-acc-tip { background: rgba(255,210,74,.1); color: #f0d9a8; }
.fiche-acc-tip svg { color: #ffd24a; }
/* CTA « Révise » — bouton plastique 3D doré (esprit Arène quizz) */
.fiche-quiz-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin: 2px 0 0; padding: 15px; min-height: 54px;
  border: 0; border-radius: 16px; cursor: pointer;
  text-decoration: none; -webkit-tap-highlight-color: transparent;
  font: 800 14.5px/1 'Baloo 2','Inter',sans-serif; color: #3a1c00;
  background: linear-gradient(180deg, #fff0bf 0%, #ffd24a 45%, #ff9c1c 100%);
  box-shadow:
    0 6px 0 #b85e00,
    0 14px 26px -8px rgba(255,156,28,.7),
    inset 0 2px 0 rgba(255,255,255,.7);
  transition: transform .12s var(--ease-snap), box-shadow .12s var(--ease-snap);
}
.fiche-quiz-cta svg { color: #3a1c00; }
.fiche-quiz-cta:active { transform: translateY(4px); box-shadow: 0 2px 0 #b85e00, 0 8px 16px -8px rgba(255,156,28,.7), inset 0 2px 0 rgba(255,255,255,.7); }
.fiche-quiz-cta:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

/* ── Accessibilité : focus clavier visible ── */
.chest-card:focus-visible,
.fiche-close:focus-visible {
  outline: 3px solid var(--a);
  outline-offset: 2px;
  border-radius: var(--r);
}

/* ── Bouton recap : scale au press ── */
@media (prefers-reduced-motion: no-preference) {
  a[href*="post_validation"] {
    transition: transform .2s var(--ease-snap), box-shadow .2s var(--ease-snap);
  }
  a[href*="post_validation"]:active {
    transform: scale(0.97);
    box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--a) 35%, transparent) !important;
  }
}

/* ══ Lien « Prépare ton jour J » (porte Mon permis → #/examen) ══ */
.prc-cv-exam {
  position:relative; z-index:2;
  display:flex; align-items:center; gap:12px;
  margin:18px 16px 0; padding:14px 16px; border-radius:16px;
  background:color-mix(in srgb, var(--su,#fff) 86%, transparent);
  border:1px solid var(--bo,rgba(120,120,160,.28));
  backdrop-filter:blur(6px);
  text-decoration:none; color:var(--ink,#1c1e2e);
  box-shadow:0 10px 24px -14px rgba(10,10,30,.35);
  transition:transform .16s cubic-bezier(.23,1,.32,1);
}
.prc-cv-exam:active { transform:scale(.98); }
.prc-cv-exam-ic { font-size:24px; flex:none; }
.prc-cv-exam-tx { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.prc-cv-exam-tx b { font:700 14.5px/1.2 'Plus Jakarta Sans',sans-serif; }
.prc-cv-exam-tx small { font:500 12px/1.5 'Inter',sans-serif; color:var(--mu,#6b7089); }
.prc-cv-exam-go { font:800 18px/1 'Plus Jakarta Sans',sans-serif; color:var(--a,#6366f1); flex:none; }

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
/* Monde verrouillé : panneaux encore plus discrets — référencé dans .prc-cv */
/* .prc-world.locked .prc-signs — supprimé (vue carte retirée) */

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
  --cv-ink:       #fff;
  --cv-ink-sub:   #d9cffa;

  position: relative;
  min-height: 100dvh;
  background:
    radial-gradient(900px 600px at 18% -5%, #2c1a55 0%, transparent 55%),
    radial-gradient(800px 700px at 110% 12%, #3a1d63 0%, transparent 50%),
    linear-gradient(160deg, #0e0820 0%, #160c2c 50%, #0b0719 100%);
  color: var(--cv-ink);
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

/* ══ VERSION CLAIRE (is-light) — palette premium lavande/blanc ══
   Scopée au conteneur .prc-cv : override uniquement les tokens
   sombres. Thème sombre 100% intact quand .is-light est absent.  */
.prc-cv.is-light {
  --cv-road:      #e2dcf2;
  --cv-road-edge: rgba(124,77,255,.38);
  --cv-night-1:   #f7f5fd;
  --cv-night-2:   #fbfaff;
  --cv-mute:      #6b5e8c;
  --cv-panel:     #ede7f9;
  --cv-ink:       #241a3f;
  --cv-ink-sub:   #4b3f72;
  background:
    radial-gradient(700px 420px at 18% -6%, rgba(180,160,240,.28) 0%, transparent 55%),
    radial-gradient(600px 500px at 108% 14%, rgba(200,170,255,.18) 0%, transparent 50%),
    linear-gradient(160deg, #f7f5fd 0%, #fbfaff 50%, #f3f1fa 100%);
  color: var(--cv-ink);
}
/* Grain atténué en clair */
.prc-cv.is-light::after { opacity: .025; }
/* Halo mesh adouci en clair */
.prc-cv.is-light::before {
  background:
    radial-gradient(500px 280px at 80% 8%, rgba(180,130,255,.12), transparent 60%),
    radial-gradient(420px 380px at 8% 86%, rgba(168,85,247,.08), transparent 60%);
  mix-blend-mode: multiply;
}
/* Panneaux plus visibles en clair (fond blanc naturel sur fond clair) */
.prc-cv.is-light .prc-cv .prc-signs .prc-sign,
.prc-cv.is-light .prc-signs .prc-sign {
  opacity: calc(var(--op, .1) * .75) !important;
  filter: saturate(.7) brightness(1) blur(calc(var(--blur, 1px) + .4px)) !important;
}

/* ── Textes codés en dur : override pour le mode clair ── */
.prc-cv.is-light .prc-cv-world-title { color: var(--cv-ink); text-shadow: none; }
.prc-cv.is-light .prc-cv-world-sub { color: var(--cv-ink-sub); }
.prc-cv.is-light .prc-cv-chip {
  background: rgba(124,77,255,.1);
  border-color: rgba(124,77,255,.3);
  color: #5a2fa0;
}
.prc-cv.is-light .prc-cv-chip .dot { background: linear-gradient(#a870ff, #7c4dff); }
.prc-cv.is-light .prc-cv-world-card {
  background:
    radial-gradient(300px 160px at 88% -10%, rgba(180,130,255,.22), transparent 60%),
    linear-gradient(150deg, #ede7f9 0%, #e4dcf6 48%, #ddd5f0 100%);
  border-color: rgba(124,77,255,.25);
  box-shadow:
    0 1px 0 rgba(255,255,255,.9) inset,
    0 -20px 40px -20px rgba(124,77,255,.18) inset,
    0 14px 28px -12px rgba(100,80,180,.18),
    0 0 40px -20px rgba(124,77,255,.14);
}
.prc-cv.is-light .prc-cv-wp-bar {
  background: rgba(124,77,255,.12);
  box-shadow: inset 0 2px 4px rgba(100,80,180,.1), inset 0 -1px 0 rgba(255,255,255,.6);
}
.prc-cv.is-light .prc-cv-wp-top span { color: var(--cv-mute); }
.prc-cv.is-light .prc-cv-wp-top b { color: #5a2fa0; }
.prc-cv.is-light .prc-cv-route-head h2 { color: var(--cv-ink); }
.prc-cv.is-light .prc-cv-step-count {
  color: var(--cv-mute);
  background: rgba(124,77,255,.08);
  border-color: rgba(124,77,255,.2);
}

/* Route SVG — la 2e passe intérieure (codée en dur #2a1d52) */
.prc-cv.is-light .prc-cv-ribbon path:nth-child(2) { stroke: #ddd5f0; }

/* Nodes locked/todo : lavande pâle en clair */
.prc-cv.is-light .prc-cv-node.locked .prc-cv-node-face {
  background: linear-gradient(160deg, #ede7f9 0%, #e0d8f2 70%);
  box-shadow: 0 4px 0 #cec4e8, 0 8px 14px -6px rgba(100,80,180,.18), inset 0 1px 0 rgba(255,255,255,.9);
}
.prc-cv.is-light .prc-cv-node.locked .prc-cv-node-face svg { opacity: .5; color: #7c5ab8; }
.prc-cv.is-light .prc-cv-node.todo .prc-cv-node-face {
  background: linear-gradient(160deg, #e4dcf6 0%, #d9d0ee 70%);
  box-shadow: 0 4px 0 #c8bfe4, 0 8px 14px -6px rgba(100,80,180,.15), inset 0 1px 0 rgba(255,255,255,.85);
}

/* Chapnav en clair */
.prc-cv.is-light .prc-cv-cn {
  color: #5a4a8a;
  background: rgba(124,77,255,.08);
  border-color: rgba(124,77,255,.22);
}
.prc-cv.is-light .prc-cv-cn.done { color: #1a6637; border-color: rgba(46,200,110,.4); background: rgba(46,200,110,.1); }
.prc-cv.is-light .prc-cv-cn.lock { color: #9e8cbf; opacity: .9; }

/* Milestones labels */
.prc-cv.is-light .prc-cv-ms-ttl { color: var(--cv-ink); }
.prc-cv.is-light .prc-cv-ms-label.locked .prc-cv-ms-ttl { color: #9e8cbf; }
.prc-cv.is-light .prc-cv-ms-label.locked .prc-cv-ms-meta { color: #b5a6d4; }
.prc-cv.is-light .prc-cv-tag-done { color: #1a7840; }

/* Boss card en clair */
.prc-cv.is-light .prc-cv-boss-card {
  background: linear-gradient(160deg, rgba(180,140,255,.18), rgba(220,210,245,.7));
  border-color: rgba(124,77,255,.28);
  box-shadow: 0 10px 20px -14px rgba(100,80,180,.25), inset 0 1px 0 rgba(255,255,255,.8);
}
.prc-cv.is-light .prc-cv-boss-card.won {
  background: linear-gradient(160deg, rgba(255,220,120,.25), rgba(255,245,200,.7));
  border-color: rgba(255,210,74,.45);
  box-shadow: 0 10px 24px -12px rgba(200,140,0,.25), inset 0 1px 0 rgba(255,255,255,.9);
}
.prc-cv.is-light .prc-cv-boss-kick { color: #7c4dff; }
.prc-cv.is-light .prc-cv-boss-ttl { color: var(--cv-ink); }
.prc-cv.is-light .prc-cv-boss-sub { color: var(--cv-mute); }
.prc-cv.is-light .prc-cv-boss-lock {
  background: linear-gradient(160deg, #ede7f9, #ddd5f0);
  box-shadow: 0 4px 8px -3px rgba(100,80,180,.2), inset 0 1px 0 rgba(255,255,255,.8);
}

/* Carte CTA "étape en cours" en clair */
.prc-cv.is-light .prc-cv-current-call {
  background:
    radial-gradient(180px 70px at 80% 0%, rgba(255,210,74,.12), transparent 60%),
    linear-gradient(150deg, rgba(240,233,255,.96), rgba(228,220,248,.96));
  border-color: rgba(255,210,74,.45);
  box-shadow: 0 10px 22px -12px rgba(200,140,0,.22), inset 0 1px 0 rgba(255,255,255,.9);
}
.prc-cv.is-light .prc-cv-call-ct { color: var(--cv-ink); }

/* Gate chapitre suivant en clair */
.prc-cv.is-light .prc-cv-gate {
  background: linear-gradient(150deg, rgba(230,224,250,.9), rgba(240,237,252,.9));
  border-color: rgba(124,77,255,.25);
}
.prc-cv.is-light .prc-cv-gate-lock {
  background: linear-gradient(160deg, #ede7f9, #ddd5f0);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 4px 0 #cec4e8;
}
.prc-cv.is-light .prc-cv-gate-g1 { color: var(--cv-ink); }

/* Carte chapitre suivant en clair */
.prc-cv.is-light .prc-cv-next.locked {
  background: linear-gradient(150deg, rgba(230,224,250,.7), rgba(240,237,252,.8));
}
.prc-cv.is-light .prc-cv-next.open {
  background:
    radial-gradient(120% 140% at 0% 0%, rgba(180,130,255,.25), transparent 55%),
    linear-gradient(150deg, #e8e0f8 0%, #ddd8f2 60%, #d6d0ec 100%);
  border-color: rgba(124,77,255,.35);
  box-shadow:
    0 1px 0 rgba(255,255,255,.9) inset,
    0 14px 28px -14px rgba(100,80,180,.25),
    0 0 32px -18px rgba(124,77,255,.25);
}
.prc-cv.is-light .prc-cv-next-badge.locked {
  background: linear-gradient(160deg, #ede7f9, #ddd5f0);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 4px 0 #cec4e8;
}
.prc-cv.is-light .prc-cv-next-kick { color: #7c4dff; }
.prc-cv.is-light .prc-cv-next.locked .prc-cv-next-kick { color: var(--cv-mute); }
.prc-cv.is-light .prc-cv-next-ttl { color: var(--cv-ink); }
.prc-cv.is-light .prc-cv-next-go {
  background: linear-gradient(160deg, rgba(124,77,255,.18), rgba(124,77,255,.08));
  border-color: rgba(124,77,255,.28);
  color: #5a2fa0;
}

/* ── Sélecteur d'affichage clair / sombre (deux segments visibles) ── */
.prc-cv-themesw {
  flex: 0 0 auto;
  display: inline-flex; gap: 3px; padding: 3px;
  border-radius: 999px;
  background: rgba(42,27,82,.5);
  border: 1.5px solid rgba(168,85,247,.28);
}
.prc-cv-th-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px; border: 0; border-radius: 999px;
  background: transparent; color: #cdbff5;
  font: 800 12px/1 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background .15s, color .15s, transform .12s;
}
.prc-cv-th-btn svg { width: 15px; height: 15px; }
.prc-cv-th-btn.on { background: linear-gradient(180deg, #8b5cf6, #7c3aed); color: #fff; }
.prc-cv-th-btn:not(.on):active { transform: scale(.95); }
.prc-cv-th-btn:focus-visible { outline: 2px solid var(--cv-gold); outline-offset: 2px; }
/* Version claire du sélecteur */
.prc-cv.is-light .prc-cv-themesw {
  background: rgba(124,77,255,.08);
  border-color: rgba(124,77,255,.25);
}
.prc-cv.is-light .prc-cv-th-btn { color: #7c5ab8; }
.prc-cv.is-light .prc-cv-th-btn.on {
  background: #fff; color: #5a2fa0;
  box-shadow: 0 1px 4px rgba(124,77,255,.25);
}

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
  color: var(--cv-ink, #fff);
}
.prc-cv-world-sub { font-size: 13px; color: var(--cv-ink-sub, #d9cffa); font-weight: 500; max-width: 235px; line-height: 1.35; }
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
  color: var(--cv-ink, #fff);
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
/* Face qui porte un médaillon 3D : la pièce EST le relief → on efface le
   fond plat et l'ombre de la pastille pour ne pas faire un rond dans un rond.
   Le médaillon déborde légèrement pour combler l'anneau. */
.prc-cv-node-face.has-med {
  background: none !important;
  box-shadow: none !important;
}
.prc-cv-node .prc-cv-node-face.has-med svg.pg-med {
  width: 112%; height: 112%;
  filter: drop-shadow(0 5px 9px rgba(10,4,26,.4));
}
/* Le médaillon "verrouillé" (slate) porte déjà sa propre teinte muette :
   on annule le voile d'opacité/couleur hérité des anciens svg plats. */
.prc-cv-node.locked .prc-cv-node-face.has-med svg.pg-med { opacity: .9; }

/* Badges (tuiles/ronds) qui accueillent un médaillon 3D : la pièce est le
   relief → on efface le fond plat + l'ombre du carré, y compris en thème clair.
   Cible : gate-lock, next-badge verrouillé, cadenas du boss. */
.prc-cv-gate-lock.has-med,
.prc-cv-next-badge.has-med,
.prc-cv-boss-lock.has-med,
.prc-cv.is-light .prc-cv-gate-lock.has-med,
.prc-cv.is-light .prc-cv-next-badge.has-med {
  background: none !important;
  box-shadow: none !important;
}
.prc-cv-gate-lock.has-med svg.pg-med,
.prc-cv-next-badge.has-med svg.pg-med,
.prc-cv-boss-lock.has-med svg.pg-med {
  width: 100%; height: 100%;
  filter: drop-shadow(0 4px 8px rgba(10,4,26,.4));
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
  font-weight: 800; font-size: 17px; line-height: 1.1; color: var(--cv-ink, #fff); margin: 5px 0 3px;
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
  color: var(--cv-ink, #fff);
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
  font-weight: 700; font-size: 14.5px; margin: 3px 0 11px; line-height: 1.15; color: var(--cv-ink, #fff);
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
.prc-cv-gate-g1 { font-family: 'Baloo 2', 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; color: var(--cv-ink, #cdbff5); }
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
  color: var(--cv-ink, #fff); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
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
  return "chapitre";
}
function saveParcoursView(_v) {
  /* vue unique : plus rien à persister */
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
        <p style="font:600 15px/1.5 'Inter',sans-serif">« Mon parcours » indisponible.<br>Vérifie ta connexion, puis réessaie.</p>
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
    wire(root, worldStates, validatedMap, pendingMap, me);
    // Trace la route SVG à travers les vrais jalons (planification robuste :
    // double rAF + fonts.ready + ResizeObserver).
    scheduleRoadLayout(root);

    // ── Sélecteur d'affichage clair / sombre (deux modes de vision) ──
    // Défaut = "dark" : le mode le plus lisible sur l'itinéraire (validé
    // produit). Le sélecteur 2 segments rend les deux modes explicites.
    const cvRoot = root.querySelector(".prc-cv");
    const applyTheme = (theme) => {
      if (!cvRoot) return;
      const isL = theme === "light";
      cvRoot.classList.toggle("is-light", isL);
      root.querySelectorAll(".prc-cv-th-btn[data-prc-theme]").forEach((b) => {
        const on = b.dataset.prcTheme === theme;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    };
    const savedTheme = localStorage.getItem("permigo_parcours_theme") ?? "dark";
    applyTheme(savedTheme);
    root.querySelectorAll(".prc-cv-th-btn[data-prc-theme]").forEach((b) =>
      b.addEventListener("click", () => {
        const theme = b.dataset.prcTheme;
        // déjà actif → rien à faire
        if (
          !theme ||
          cvRoot?.classList.contains("is-light") === (theme === "light")
        )
          return;
        localStorage.setItem("permigo_parcours_theme", theme);
        track("parcours.theme_toggle", { theme });
        applyTheme(theme);
      }),
    );

    // Navigation entre chapitres (stepper + carte chapitre suivant)
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
  // Évite doublon (+ retire une flèche précédente : DOM ET listeners)
  _arrowCleanup?.();
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

  // Nettoyage centralisé (node <body> + listeners) réutilisé au démontage de
  // la page via unmount() pour éviter une flèche fantôme sur la page suivante.
  _arrowCleanup = () => {
    ind.remove();
    window.removeEventListener("scroll", position);
    window.removeEventListener("resize", position);
    _arrowCleanup = null;
  };

  const dismiss = () => {
    ind.classList.add("dismiss");
    setTimeout(() => _arrowCleanup?.(), 280);
  };

  // Tap node = disparaît
  node.addEventListener("click", dismiss, { once: true });
  // Auto-dismiss après 8s
  setTimeout(dismiss, 8000);
}

// ─── Logique métier ───────────────────────────────────────────────
// Exportée (chantier nav simplifiée, hub « Mon permis ») : mon-permis.js
// réutilise EXACTEMENT ces états/seuils pour ses 4 chapitres C1-C4 — aucune
// re-déclaration des seuils de déblocage (UNLOCK_REQ reste privé ici, la
// fonction encapsule déjà la règle).
export function computeWorldStates(validatedMap) {
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

// ─── Render principal (vue chapitre uniquement) ───────────────────
function renderPage(
  worldStates,
  validatedMap,
  pendingMap,
  openedWorlds = new Set(),
  view = "chapitre",
  currentChapIdx = 0,
) {
  return `${STYLE}
${renderChapterView(worldStates, validatedMap, pendingMap, currentChapIdx, openedWorlds)}

<!-- Bottom sheet -->
<div class="bsheet-bg" id="bsheet-bg" aria-hidden="true"></div>
<div class="bsheet" id="bsheet" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="bsheet-title">
  <div class="bsheet-handle" aria-hidden="true"></div>
  <div id="bsheet-body"></div>
</div>`;
}

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
        <div class="prc-cv-gate-lock has-med" aria-hidden="true">
          ${medallion("cadenas", "slate", { size: 46, shape: "tile" })}
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

      // Contenu du node : médaillon 3D qui REMPLIT la pastille (le
      // médaillon EST la pièce 3D → la face perd son fond plat, cf .has-med).
      // Le "à venir" garde un simple point discret (pas de médaillon).
      const ICO_DOT = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="rgba(255,255,255,.35)"/></svg>`;

      let nodeClass = "";
      let nodeContent = ICO_DOT;
      let faceMed = ""; // classe ajoutée à la face quand elle porte un médaillon
      let glint = "";
      if (st === "done" || st === "a_valider") {
        nodeClass = "done";
        nodeContent = medallion("check", "green", { size: 56 });
        faceMed = " has-med";
      } else if (st === "next") {
        nodeClass = "current";
        nodeContent = medallion("etoile", "gold", { size: 74 });
        faceMed = " has-med";
        glint = `<span class="prc-cv-node-glint" aria-hidden="true"></span>`;
      } else if (st === "locked") {
        nodeClass = "locked";
        nodeContent = medallion("cadenas", "slate", { size: 54 });
        faceMed = " has-med";
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
          <div class="prc-cv-node-face${faceMed}">${glint}${nodeContent}</div>
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
          ${bossWon ? "" : `<span class="prc-cv-boss-lock has-med" aria-hidden="true">${medallion("cadenas", "slate", { size: 30 })}</span>`}
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
        <div class="prc-cv-next-badge locked has-med" aria-hidden="true">
          ${medallion("cadenas", "slate", { size: 50, shape: "tile" })}
        </div>
        <div class="prc-cv-next-txt">
          <div class="prc-cv-next-kick">Chapitre ${nextNum} · Verrouillé</div>
          <div class="prc-cv-next-ttl">${esc(nextTitle)}</div>
          <div class="prc-cv-next-sub">Bats le boss de « ${esc(world.nom ?? chapTitle)} » pour l’ouvrir</div>
        </div>
      </div>`
      : `
      <button class="prc-cv-next open" type="button"
              data-chap="${currentIdx + 1}"
              aria-label="Aller au chapitre ${nextNum} : ${esc(nextTitle)}">
        <div class="prc-cv-next-badge open" aria-hidden="true">${nextNum}</div>
        <div class="prc-cv-next-txt">
          <div class="prc-cv-next-kick">Chapitre suivant · Débloqué</div>
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
  // Icônes toggle thème (soleil / lune)
  const ICO_SUN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const ICO_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const isLightNow =
    (localStorage.getItem("permigo_parcours_theme") ?? "dark") === "light";
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
    </div>
    <div class="prc-cv-themesw" role="group" aria-label="Affichage : clair ou sombre">
      <button class="prc-cv-th-btn ${isLightNow ? "" : "on"}" data-prc-theme="dark" type="button" aria-pressed="${!isLightNow}">${ICO_MOON}<span>Sombre</span></button>
      <button class="prc-cv-th-btn ${isLightNow ? "on" : ""}" data-prc-theme="light" type="button" aria-pressed="${isLightNow}">${ICO_SUN}<span>Clair</span></button>
    </div>`;

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
    </div>
    ${heroHTML}
    ${routeHTML}
    ${chestHTML}
    ${gateHTML}
    <!-- Porte vers le hub « Mon permis » (chantier nav simplifiée) : le jeu
         (ici, #/parcours) et le sérieux sont séparés — cette carte renvoie
         vers l'étape ③ « L'examen » du hub (?scroll=exam), pas directement
         vers l'ancienne page #/examen autonome (qui reste joignable en
         direct/deep-link, cf. router.js). -->
    <a href="#/mon-permis?scroll=exam" class="prc-cv-exam" aria-label="Voir Mon permis — ton examen">
      <span class="prc-cv-exam-ic" aria-hidden="true">🎓</span>
      <span class="prc-cv-exam-tx">
        <b>Prépare ton examen</b>
        <small>Ton compte à rebours et où tu en es</small>
      </span>
      <span class="prc-cv-exam-go" aria-hidden="true">→</span>
    </a>
    <div style="height:40px"></div>
  </div>
</div>`;
}

// Trace le ruban-route SVG À TRAVERS le centre des jalons réellement rendus.
// Robuste à n'importe quel nombre de jalons et à la hauteur variable de la
// carte « Continuer » (le tracé fixe précédent dérivait hors des pastilles).
// PURE mesure : la planification robuste est dans scheduleRoadLayout().
let _roadObserver = null;
let _arrowCleanup = null; // flèche « fraîchement débloqué » (overlay <body> + listeners)

// Démontage de la page (appelé par le router avant de monter la suivante) :
// coupe le ResizeObserver de la route ET nettoie la flèche « fraîchement
// débloqué » (sinon elle reste visible sur la page suivante, listeners inclus).
export function unmount() {
  stopRoadLayout();
  _arrowCleanup?.();
}
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

// ─── Wire & bottom sheet ──────────────────────────────────────────
function wire(root, worldStates, validatedMap, pendingMap, me) {
  // Back via hashchange
  root.querySelector("#prc-back")?.addEventListener("click", () => {
    location.hash = "#/";
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

  // Vue chapitre : milestones → ouvre la fiche compétence
  const clearSelected = () =>
    root
      .querySelectorAll(".prc-cv-ms.selected")
      .forEach((el) => el.classList.remove("selected"));

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
    // Rend le focus à l'élément déclencheur (a11y).
    if (wasOpen && lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  };
  bg?.addEventListener("click", closeFn);
  // Escape ferme la fiche — lié une seule fois (anti-empilement au re-render).
  if (!escBound) {
    escBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const sh = document.getElementById("bsheet");
      if (!sh?.classList.contains("open")) return;
      sh.classList.remove("open");
      document.getElementById("bsheet-bg")?.classList.remove("open");
      sh.setAttribute("aria-hidden", "true");
      root
        .querySelectorAll(".prc-cv-ms.selected")
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

  // Médaillon de statut (grammaire commune à toute l'app, cf medStatus).
  // Remplit le disque héros → celui-ci perd son fond plat (.has-med).
  const stIcon =
    {
      done: medStatus("acquis", { size: 58 }),
      a_valider: medStatus("acquis", { size: 58 }),
      next: medStatus("encours", { size: 58 }),
      todo: medStatus("encours", { size: 58 }),
      locked: medStatus("verrouille", { size: 58 }),
    }[st] ?? medStatus("encours", { size: 58 });

  // Progression visuelle dans le monde (n / total)
  const pctInWorld = Math.round((compNum / total) * 100);

  // Quiz-récap : rappel OPTIONNEL proposé sur une compétence acquise.
  // Ne change pas le statut (already_acquired) — joue l'animation + crédite l'XP d'engagement.
  const recapBtn = `
    <a href="#/quiz/${esc(compId)}/post_validation" role="button" class="fiche-quiz-cta">
      ${icon("zap", { size: 16 })} Révise cette compétence
    </a>`;

  // Compétence pas encore acquise : la fiche doit donner un geste à faire
  // (avant, elle se refermait sur rien — cul-de-sac du 1er jour). Direction
  // la fiche de révision conduite (méthode + « Teste-toi »).
  const reviseBtn = `
    <a href="#/revision-conduite/${esc(compId)}" role="button" class="fiche-quiz-cta">
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
        </div>${reviseBtn}`;
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
      </div>${reviseBtn}`;
  })();

  const body =
    root.querySelector("#bsheet-body") ??
    document.getElementById("bsheet-body");
  body.innerHTML = `
    <div class="fiche-hero" style="--wc:${meta.color}">
      <button class="fiche-close" type="button" aria-label="Fermer">×</button>
      <div class="fiche-badge-cat">CHAPITRE ${meta.num} · ${esc(world.nom).toUpperCase()}</div>
      <div class="fiche-circle has-med ${st === "done" ? "done" : ""}">
        ${stIcon}
      </div>
      <h3 id="bsheet-title">${esc(sub.n)}</h3>
      <div class="fiche-id">${compNum} sur ${total} dans ce chapitre</div>
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
          ${medallion("cible", "teal", { size: 22 })}
          ${st === "done" ? "Ce que tu maîtrises" : "Ce que tu vas maîtriser"}
          <span class="fiche-acc-chev">${icon("chevron-down", { size: 15 })}</span>
        </summary>
        <ul class="fiche-block-list">
          ${detail.keyPoints.map((kp) => `<li><span class="kp-check">${icon("check", { size: 11, strokeWidth: 3 })}</span>${esc(kp)}</li>`).join("")}
        </ul>
        <div class="fiche-acc-tip">${medallion("ampoule", "gold", { size: 22 })} ${esc(detail.tip)}</div>
      </details>

    </div>`;

  body.querySelector(".fiche-close")?.addEventListener("click", () => {
    const bg = document.getElementById("bsheet-bg");
    const sheet = document.getElementById("bsheet");
    sheet?.classList.remove("open");
    bg?.classList.remove("open");
    sheet?.setAttribute("aria-hidden", "true");
    // Retire la sélection visuelle sur le jalon source
    root
      .querySelectorAll(".prc-cv-ms.selected")
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
