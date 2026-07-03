// ═══════════════════════════════════════════════════════════════
// Élève — Trophées « Salle des trophées » (Arène violet/or, ADN Clash Royale)
// RPC : get_my_achievements()
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { volantImg, volantLabel } from "@/utils/volant.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { toast } from "@/components/common/toast.js";
import { openBottomSheet } from "@/components/common/bottom-sheet.js";
import { CATALOG, RARITY_META, shortProgress } from "@/data/achievements.js";
import { recompensesTabs } from "@/components/eleve/recompenses-tabs.js";

// Ordre de prestige (pour élire le trophée vedette)
const RARITY_RANK = { commun: 0, rare: 1, epique: 2, legendaire: 3 };
// Libellés courts de rareté (chips)
const RARITY_LABEL = {
  commun: "Commun",
  rare: "Rare",
  epique: "Épique",
  legendaire: "Légendaire",
};

// ─── CSS — SALLE DES TROPHÉES (arène nuit-violet + or) ─────────
const STYLE = `<style>
.tr2 {
  /* Palette locale "Arène" (scopée — indépendante du thème app, comme la
     boutique avec ses tokens --g-*). La salle des trophées = un écrin sombre
     où l'or et les raretés rayonnent. */
  --ar-ink:#fff; --ar-mu:#c3b8e8; --ar-mu2:#9488bf;
  --ar-panel:#241644; --ar-panel2:#2b1b54; --ar-line:rgba(167,139,250,.18);
  --ar-violet:#a855f7; --ar-violet2:#7c4dff;
  --ar-gold1:#ffe9a8; --ar-gold2:#ffd24a; --ar-gold3:#ff9c1c; --ar-gold4:#c87d12;
  /* raretés (glow coloré différencié) */
  --rc-commun:#9a93c8; --rc-rare:#54a0ff; --rc-epique:#b06bff; --rc-legendaire:#ffd24a;

  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 108px;
  min-height: 100dvh;
  color: var(--ar-ink);
  font-family: 'Inter', sans-serif;
  background:
    radial-gradient(120% 70% at 50% -8%, #34206a 0%, transparent 52%),
    radial-gradient(90% 55% at 88% 12%, rgba(255,156,28,.10) 0%, transparent 48%),
    linear-gradient(180deg, #1d1138 0%, #150d2b 46%, #100a22 100%);
}

/* ── Skeleton ── */
.tr2-skel {
  background: linear-gradient(90deg, rgba(255,255,255,.04) 0%, rgba(167,139,250,.14) 50%, rgba(255,255,255,.04) 100%);
  background-size: 200% 100%;
  animation: tr2Shim 1.4s ease-in-out infinite;
  border-radius: var(--r-lg);
}
@keyframes tr2Shim { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Hero sticky ── */
.tr2-hero {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  padding: 18px 20px 20px;
  overflow: hidden;
  background:
    radial-gradient(120% 130% at 12% 0%, rgba(168,85,247,.40) 0%, transparent 55%),
    radial-gradient(90% 120% at 96% 100%, rgba(255,156,28,.22) 0%, transparent 52%),
    linear-gradient(160deg, #2a1a52 0%, #1d1138 70%, #170e30 100%);
  box-shadow: 0 14px 30px -16px rgba(0,0,0,.7);
}
.tr2-hero::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 50% at 20% 20%, rgba(255,255,255,.10) 0%, transparent 60%);
  pointer-events: none;
}
.tr2-hero-inner { position: relative; z-index: 1; }
.tr2-hero-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; gap: 10px;
}
.tr2-hero-title {
  font: 800 clamp(21px, 6vw, 25px)/1 'Baloo 2', cursive;
  color: #fff; letter-spacing: -.01em;
  text-shadow: 0 2px 0 rgba(0,0,0,.25), 0 0 22px rgba(168,85,247,.45);
}
.tr2-hero-count {
  flex: none;
  font: 800 13px/1 'Baloo 2', cursive;
  color: #1a1208;
  background: linear-gradient(180deg, var(--ar-gold1), var(--ar-gold2) 55%, var(--ar-gold3));
  border: 1px solid rgba(255,255,255,.35);
  box-shadow: 0 3px 10px rgba(255,156,28,.4), inset 0 1px 0 rgba(255,255,255,.6);
  border-radius: var(--r-full); padding: 6px 13px;
  letter-spacing: -.01em;
}
.tr2-progress-wrap { display: flex; flex-direction: column; gap: 7px; }
.tr2-progress-bar {
  position: relative;
  height: 12px; background: rgba(0,0,0,.32);
  border-radius: var(--r-full); overflow: hidden;
  box-shadow: inset 0 1.5px 3px rgba(0,0,0,.5), inset 0 -1px 0 rgba(255,255,255,.05);
}
.tr2-progress-fill {
  position: relative;
  height: 100%; width: 0;
  background: linear-gradient(90deg, var(--ar-violet2) 0%, var(--ar-violet) 42%, var(--ar-gold2) 100%);
  box-shadow: 0 0 14px rgba(255,210,74,.55), inset 0 1.5px 0 rgba(255,255,255,.45);
  border-radius: var(--r-full);
  transition: width 1.1s var(--ease-out);
}
.tr2-progress-fill::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 22px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.6));
  border-radius: var(--r-full);
}
.tr2-progress-hint {
  font: 600 12px/1.35 'Inter', sans-serif;
  color: var(--ar-mu);
}

/* ═══ Trophée VEDETTE (héros qui domine) ═══ */
.tr2-feat {
  position: relative; overflow: hidden;
  margin: 16px 16px 2px; padding: 16px 18px 18px;
  border-radius: 24px;
  background:
    radial-gradient(110% 80% at 50% -10%, rgba(168,85,247,.22), transparent 60%),
    linear-gradient(180deg, var(--ar-panel2) 0%, var(--ar-panel) 100%);
  border: 1px solid var(--ar-line);
  box-shadow: 0 20px 44px -20px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.06);
  cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none;
  transition: transform .16s var(--ease-spring);
}
.tr2-feat:active { transform: scale(.985); }
.tr2-feat.commun     { --fc:var(--rc-commun); }
.tr2-feat.rare       { --fc:var(--rc-rare); }
.tr2-feat.epique     { --fc:var(--rc-epique); }
.tr2-feat.legendaire { --fc:var(--rc-legendaire); border-color: rgba(255,210,74,.5); box-shadow: 0 22px 48px -20px rgba(255,156,28,.55), inset 0 1px 0 rgba(255,255,255,.12); }
.tr2-feat.locked     { --fc:var(--ar-mu2); opacity: .96; }
.tr2-feat-kick {
  position: relative; z-index: 2;
  display: inline-flex; align-items: center; gap: 6px;
  font: 800 9.5px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .14em; text-transform: uppercase;
  color: var(--fc);
}
.tr2-feat-kick .pin { width: 5px; height: 5px; border-radius: 50%; background: var(--fc); box-shadow: 0 0 8px var(--fc); }
.tr2-feat-stage {
  position: relative; z-index: 1;
  height: 138px; margin: 4px 0 10px;
  display: flex; align-items: center; justify-content: center;
}
.tr2-feat-halo {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  width: 190px; height: 190px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--fc) 55%, transparent) 0%, transparent 62%);
  filter: blur(2px);
  animation: tr2HaloPulse 3.4s ease-in-out infinite;
}
.tr2-feat.locked .tr2-feat-halo { opacity: .4; }
@keyframes tr2HaloPulse { 0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)} }
.tr2-feat-badge {
  position: relative; z-index: 2;
  width: 116px; height: 116px; object-fit: contain;
  filter: drop-shadow(0 10px 18px rgba(0,0,0,.5));
  animation: tr2Float 5s ease-in-out infinite;
}
.tr2-feat.locked .tr2-feat-badge { filter: grayscale(1) brightness(.45) drop-shadow(0 8px 14px rgba(0,0,0,.5)); }
@keyframes tr2Float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
.tr2-feat-badge-emoji { position: relative; z-index: 2; font-size: 88px; }
/* shimmer doré sur le légendaire vedette */
.tr2-feat.legendaire .tr2-feat-stage::after {
  content: ''; position: absolute; top: 0; left: -40%; width: 45%; height: 100%; z-index: 3; pointer-events: none;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,.5), transparent); transform: skewX(-16deg);
  animation: tr2Sweep 4.4s ease-in-out infinite;
}
@keyframes tr2Sweep { 0%,72%{left:-45%} 88%,100%{left:130%} }
.tr2-feat-spark { position: absolute; z-index: 4; width: 9px; height: 9px; pointer-events: none;
  background: linear-gradient(transparent 46%, var(--ar-gold2) 46% 54%, transparent 54%), linear-gradient(90deg, transparent 46%, var(--ar-gold2) 46% 54%, transparent 54%);
  filter: drop-shadow(0 0 3px var(--ar-gold2)); animation: tr2Spark 2.6s ease-in-out infinite; }
.tr2-feat-spark.a { top: 16px; right: 26px; }
.tr2-feat-spark.b { bottom: 18px; left: 30px; width: 6px; height: 6px; animation-delay: 1.3s; }
@keyframes tr2Spark { 0%,100%{opacity:0;transform:scale(.4) rotate(0)} 50%{opacity:1;transform:scale(1) rotate(45deg)} }
.tr2-feat-foot { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.tr2-feat-name { font: 800 21px/1.08 'Baloo 2', cursive; color: #fff; letter-spacing: -.01em; text-shadow: 0 1px 0 rgba(0,0,0,.3); }
.tr2-feat-sub { margin-top: 4px; font: 600 12px/1.4 'Inter', sans-serif; color: var(--ar-mu); }
.tr2-feat-chip {
  flex: none; align-self: center;
  font: 800 10px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .08em; text-transform: uppercase;
  color: #fff; background: color-mix(in srgb, var(--fc) 30%, rgba(0,0,0,.3));
  border: 1px solid color-mix(in srgb, var(--fc) 55%, transparent);
  box-shadow: 0 0 14px -2px color-mix(in srgb, var(--fc) 60%, transparent);
  border-radius: var(--r-full); padding: 6px 12px;
}
.tr2-feat.legendaire .tr2-feat-chip { color: #1a1208; background: linear-gradient(180deg, var(--ar-gold1), var(--ar-gold2)); border-color: var(--ar-gold3); }

/* ── Accès Galerie ── */
.tr2-galerie {
  display: flex; align-items: center; gap: 12px;
  margin: 14px 16px 0; padding: 13px 14px;
  background: linear-gradient(180deg, var(--ar-panel2), var(--ar-panel));
  border: 1px solid var(--ar-line);
  border-radius: var(--r-xl); cursor: pointer; text-decoration: none; color: inherit;
  box-shadow: 0 10px 24px -16px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.05);
  transition: transform .15s, border-color .15s;
}
.tr2-galerie:hover { transform: translateY(-1px); border-color: rgba(168,85,247,.45); }
.tr2-galerie:active { transform: scale(.99); }
.tr2-galerie-ico {
  flex-shrink: 0; width: 42px; height: 42px; border-radius: var(--r);
  display: flex; align-items: center; justify-content: center;
  background: rgba(168,85,247,.18); color: #c4a3ff;
  box-shadow: inset 0 0 0 1px rgba(168,85,247,.3);
}
.tr2-galerie-tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tr2-galerie-t { font: 800 15px/1.1 'Baloo 2', cursive; color: #fff; letter-spacing: -.01em; }
.tr2-galerie-s { font: 500 12px/1.2 'Inter', sans-serif; color: var(--ar-mu); }
.tr2-galerie-arrow { flex-shrink: 0; color: var(--ar-mu2); display: flex; }

/* ── Section label ── */
.tr2-group-label {
  padding: 22px 16px 10px;
  font: 800 11px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .12em; text-transform: uppercase;
  color: var(--ar-mu2);
}

/* ── Grille 3 colonnes ── */
.tr2-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px; padding: 0 12px;
}

/* ── Card trophée ── */
.tr2-card {
  position: relative;
  border-radius: 18px;
  padding: 15px 8px 13px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring), opacity .12s;
  overflow: hidden; min-height: 116px; user-select: none;
}
.tr2-card:active { transform: scale(.93); }
.tr2-new-dot {
  position: absolute; top: 7px; left: 7px; z-index: 3;
  background: var(--rdx); color: #fff;
  font: 800 7.5px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .06em;
  padding: 4px 7px; border-radius: var(--r-full);
  box-shadow: 0 3px 10px rgba(239,68,68,.6);
  animation: tr2NewPulse 1.4s ease-in-out infinite;
}
@keyframes tr2NewPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
.tr2-card.locked {
  background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015));
  border: 1px solid rgba(255,255,255,.06);
}
.tr2-card.locked .tr2-card-emoji img,
.tr2-card.locked .tr2-card-emoji span { filter: grayscale(1) brightness(.4); opacity: .55; }
/* Cartes débloquées — écrin sombre + teinte de rareté + glow coloré + relief.
   La rareté est signalée par la couleur, la pastille ET le glow (color-not-only). */
.tr2-card.commun     { --rc: var(--rc-commun); }
.tr2-card.rare       { --rc: var(--rc-rare); }
.tr2-card.epique     { --rc: var(--rc-epique); }
.tr2-card.legendaire { --rc: var(--rc-legendaire); }
.tr2-card:not(.locked) {
  background:
    radial-gradient(90% 70% at 50% 0%, color-mix(in srgb, var(--rc) 26%, transparent) 0%, transparent 62%),
    linear-gradient(180deg, var(--ar-panel2) 0%, var(--ar-panel) 100%);
  border: 1px solid color-mix(in srgb, var(--rc) 36%, var(--ar-line));
  box-shadow: 0 10px 22px -14px color-mix(in srgb, var(--rc) 70%, #000), inset 0 1px 0 rgba(255,255,255,.07);
}
.tr2-card.legendaire {
  border-color: rgba(255,210,74,.5);
  box-shadow: 0 12px 26px -12px rgba(255,156,28,.55), inset 0 1px 0 rgba(255,255,255,.12);
}
/* shimmer léger sur le légendaire */
.tr2-card.legendaire::after {
  content: ''; position: absolute; top: 0; left: -45%; width: 45%; height: 100%; z-index: 2; pointer-events: none;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,.42), transparent); transform: skewX(-16deg);
  animation: tr2Sweep 5s ease-in-out 1s infinite;
}
.tr2-card-rarity {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--rc);
  box-shadow: 0 0 8px var(--rc), 0 0 0 2px color-mix(in srgb, var(--rc) 25%, transparent);
}
.tr2-card-emoji { line-height: 1; display: flex; align-items: center; justify-content: center; transition: transform .2s; }
.tr2-card-emoji img { width: 64px; height: 64px; object-fit: contain; mix-blend-mode: normal; }
.tr2-card-emoji span { font-size: 40px; }
.tr2-card:not(.locked):active .tr2-card-emoji { transform: scale(1.12); }
.tr2-card-name {
  font: 700 10.5px/1.2 'Plus Jakarta Sans', sans-serif;
  text-align: center; letter-spacing: -.005em;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.tr2-card.locked .tr2-card-name { color: var(--ar-mu2); }
.tr2-card:not(.locked) .tr2-card-name { color: #fff; }
.tr2-card-mystery { font: 700 9.5px/1 'IBM Plex Mono', monospace; color: var(--ar-mu2); }

/* ── Modal ── */
.tr2-modal-bg {
  position: fixed; inset: 0;
  background: rgba(10,6,22,.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
  animation: tr2FadeBg .2s ease both;
}
@keyframes tr2FadeBg { from{opacity:0} to{opacity:1} }
.tr2-modal {
  width: 100%; max-width: 480px; border-radius: 28px 28px 0 0;
  padding: 0 0 32px; overflow: hidden; touch-action: none;
  background: linear-gradient(180deg, var(--ar-panel2) 0%, #1a1036 100%);
  box-shadow: 0 -14px 50px rgba(0,0,0,.55);
  animation: tr2ModalUp .3s cubic-bezier(.32,.72,0,1) both;
}
@keyframes tr2ModalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
.tr2-modal-glow {
  position: relative; overflow: hidden;
  min-height: 196px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; padding: 4px 0 14px;
}
.tr2-modal-glow::before {
  content: ''; position: absolute; left: 50%; top: 52%; transform: translate(-50%,-50%);
  width: 280px; height: 280px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--mc) 60%, transparent) 0%, transparent 60%);
  animation: tr2HaloPulse 3.4s ease-in-out infinite;
}
.tr2-modal-handle { position: relative; z-index: 2; width: 38px; height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; margin: 14px auto 2px; }
.tr2-modal-emoji { position: relative; z-index: 1; width: 130px; height: 130px; margin: 0 auto; display: flex; align-items: center; justify-content: center;
  animation: tr2EmojiIn .55s .08s var(--ease-spring) both; }
.tr2-modal-emoji img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 8px 22px rgba(0,0,0,.5)); mix-blend-mode: normal !important; }
.tr2-modal-emoji span { font-size: 84px; filter: drop-shadow(0 0 20px rgba(255,255,255,.5)); }
.tr2-modal-emoji.locked img, .tr2-modal-emoji.locked span { filter: grayscale(1) brightness(.4); opacity: .5; }
@keyframes tr2EmojiIn { from{transform:scale(.4) rotate(-10deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
.tr2-modal-spark { position: absolute; z-index: 2; width: 11px; height: 11px; pointer-events: none;
  background: linear-gradient(transparent 46%, #fff 46% 54%, transparent 54%), linear-gradient(90deg, transparent 46%, #fff 46% 54%, transparent 54%);
  filter: drop-shadow(0 0 4px var(--mc)); animation: tr2Spark 2.4s ease-in-out infinite; }
.tr2-modal-spark.s1 { top: 30px; left: 28%; }
.tr2-modal-spark.s2 { top: 54px; right: 26%; width: 8px; height: 8px; animation-delay: .8s; }
.tr2-modal-spark.s3 { bottom: 38px; left: 36%; width: 7px; height: 7px; animation-delay: 1.5s; }
.tr2-rarity-chip {
  position: relative; z-index: 2;
  font: 800 11px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .1em; text-transform: uppercase;
  color: #fff; background: color-mix(in srgb, var(--mc) 30%, rgba(0,0,0,.35));
  border: 1px solid color-mix(in srgb, var(--mc) 60%, transparent);
  box-shadow: 0 0 16px -2px color-mix(in srgb, var(--mc) 70%, transparent);
  border-radius: var(--r-full); padding: 6px 14px;
}
.tr2-rarity-chip.legendaire { color: #1a1208; background: linear-gradient(180deg, var(--ar-gold1), var(--ar-gold2)); border-color: var(--ar-gold3); }
.tr2-rarity-chip.locked { color: var(--ar-mu); background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.14); box-shadow: none; }
.tr2-modal-body { padding: 18px 22px 8px; }
.tr2-modal-title { font: 800 24px/1.12 'Baloo 2', cursive; color: #fff; letter-spacing: -.01em; margin-bottom: 8px; text-align: center; }
.tr2-modal-desc { font: 500 14px/1.55 'Inter', sans-serif; color: var(--ar-mu); margin-bottom: 16px; text-align: center; }
.tr2-modal-meta { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 18px; }
.tr2-modal-chip { display: flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: var(--r-full); font: 700 12px/1 'IBM Plex Mono', monospace; }
.tr2-modal-chip.gems { background: rgba(255,210,74,.14); color: var(--ar-gold2); border: 1px solid rgba(255,210,74,.25); }
.tr2-modal-chip.date { background: rgba(255,255,255,.06); color: var(--ar-mu); border: 1px solid rgba(255,255,255,.1); }
.tr2-modal-social { font: 500 12.5px/1.5 'Inter', sans-serif; color: var(--ar-mu2); text-align: center; margin-bottom: 20px; }
.tr2-modal-actions { display: flex; gap: 8px; padding: 0 22px; }
.tr2-modal-share {
  flex: 1; padding: 15px; min-height: 52px; border: none; border-radius: var(--r-md);
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  background: linear-gradient(180deg, var(--ar-violet), var(--ar-violet2));
  color: #fff; font: 800 14px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  box-shadow: 0 4px 0 #5b34c0, 0 8px 18px -6px rgba(124,77,255,.6);
  transition: transform .12s, box-shadow .12s;
}
.tr2-modal-share:active { transform: translateY(3px); box-shadow: 0 1px 0 #5b34c0; }
.tr2-modal-share.goto { background: linear-gradient(180deg, var(--ar-gold2), var(--ar-gold3)); color: #1a1208; box-shadow: 0 4px 0 var(--ar-gold4), 0 8px 18px -6px rgba(255,156,28,.55); }
.tr2-modal-share.goto:active { box-shadow: 0 1px 0 var(--ar-gold4); }
.tr2-modal-close {
  padding: 15px 20px; min-height: 52px; background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12); border-radius: var(--r-md);
  color: var(--ar-mu); font: 700 14px/1 'Inter', sans-serif; cursor: pointer;
  transition: background .12s;
}
.tr2-modal-close:active { background: rgba(255,255,255,.12); }

/* Focus clavier visible (a11y) */
.tr2-card:focus-visible, .tr2-feat:focus-visible, .tr2-galerie:focus-visible,
.tr2-modal-share:focus-visible, .tr2-modal-close:focus-visible {
  outline: 2px solid var(--ar-gold2); outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.001ms!important;animation-iteration-count:1!important;
    transition-duration:.001ms!important;scroll-behavior:auto!important}
}
</style>`;

// ─── Mount ────────────────────────────────────────────────────
// openKey : deep-link #/trophees/{key} → ouvre directement le détail d'un
// trophée (depuis le rail « Tes badges » de l'accueil, une notif, un partage).
export async function mount(root, openKey = null) {
  const me = getCurUser();
  if (!me) return;
  track("page.view", { page: "trophees", deep_link: openKey || undefined });

  root.innerHTML = `${STYLE}
<div class="tr2 anim-slide-up">
  ${recompensesTabs("trophees")}
  <div class="tr2-hero">
    <div class="tr2-hero-inner">
      <div class="tr2-hero-top">
        <h1 class="tr2-hero-title" tabindex="-1">Mes trophées</h1>
        <div class="tr2-hero-count" id="tr2-count">— / ${CATALOG.length}</div>
      </div>
      <div class="tr2-progress-wrap">
        <div class="tr2-progress-bar"><div class="tr2-progress-fill" id="tr2-fill" style="width:0%"></div></div>
        <div class="tr2-progress-hint" id="tr2-hint">Chargement…</div>
      </div>
    </div>
  </div>
  <a class="tr2-galerie" href="#/galerie" aria-label="Ouvrir ta galerie de récompenses">
    <span class="tr2-galerie-ico" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></span>
    <span class="tr2-galerie-tx">
      <span class="tr2-galerie-t">Ta galerie</span>
      <span class="tr2-galerie-s">Tes skins et badges débloqués</span>
    </span>
    <span class="tr2-galerie-arrow" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
  </a>
  <div id="tr2-body">
    <div style="margin:16px 16px 2px"><div class="tr2-skel" style="height:230px;border-radius:24px"></div></div>
    ${[...Array(2)]
      .map(
        () => `
      <div class="tr2-group-label"><div class="tr2-skel" style="height:11px;width:80px;display:inline-block"></div></div>
      <div class="tr2-grid">${[...Array(6)].map(() => `<div class="tr2-skel" style="min-height:116px"></div>`).join("")}</div>
    `,
      )
      .join("")}
  </div>
</div>`;

  try {
    const [achRes, cntRes, strkRes] = await Promise.allSettled([
      sb.rpc("get_my_achievements"),
      sb
        .from("validations")
        .select("id", { count: "exact", head: true })
        .eq("eleve_id", me.id)
        .eq("statut", "acquis"),
      sb
        .from("streaks")
        .select("current_streak")
        .eq("user_id", me.id)
        .maybeSingle(),
    ]);
    // Si la RPC échoue, on NE jette PAS : on rend quand même la grille (tout
    // verrouillé) — l'élève voit les trophées à viser au lieu d'un écran vide.
    if (achRes.value?.error)
      console.warn("[trophees] get_my_achievements:", achRes.value.error);
    const stats = {
      compCount: cntRes.value?.count ?? 0,
      streak: strkRes.value?.data?.current_streak ?? 0,
    };
    renderAll(root, achRes.value?.data ?? [], stats, openKey);
  } catch (e) {
    console.error("[trophees]", e);
    toast("Impossible de charger les trophées", "error");
    root.querySelector("#tr2-body").innerHTML = `
      <div style="text-align:center;padding:56px 24px;color:var(--ar-mu)">
        <div style="margin-bottom:12px;color:var(--ar-gold2)">${icon("trophy", { size: 44 })}</div>
        <div style="font:800 16px/1.3 'Baloo 2',cursive;color:#fff;margin-bottom:6px">Continue à apprendre</div>
        <div style="font:500 13px/1.5 'Inter',sans-serif">Tes premiers trophées arrivent</div>
      </div>`;
  }
}

// ─── Render all ───────────────────────────────────────────────
// Trophées déjà « vus » : tout débloqué absent de ce set porte une pastille
// NOUVEAU à l'affichage, puis le set est mis à jour (vu = affiché ici).
// Retourne null si le ledger n'existe pas encore (première visite) : dans ce
// cas on seed en silence, sans pastille — un badge sur 100% des cartes ne
// signalerait plus rien.
const LS_TROPH_SEEN = "pg-troph-seen";
function getSeenSet() {
  try {
    const raw = localStorage.getItem(LS_TROPH_SEEN);
    return raw === null ? null : new Set(JSON.parse(raw));
  } catch {
    return null; // ledger illisible → re-seed silencieux, jamais de spam
  }
}
function saveSeenSet(keys) {
  try {
    localStorage.setItem(LS_TROPH_SEEN, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

// Badge d'un trophée (img 3D + fallback emoji). size = px de l'image.
function badgeMarkup(def, size, cls = "") {
  if (def.image) {
    return `<img src="${def.image}" alt="${esc(def.title)}" loading="lazy" class="${cls}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"
      style="width:${size}px;height:${size}px;object-fit:contain">
      <span style="display:none">${def.emoji}</span>`;
  }
  return `<span>${def.emoji}</span>`;
}

function renderAll(
  root,
  unlocked,
  stats = { compCount: 0, streak: 0 },
  openKey = null,
) {
  const unlockedMap = new Map(unlocked.map((u) => [u.achievement_key, u]));
  // Nouveautés = débloqués DEPUIS la dernière visite. Première visite
  // (ledger absent) → aucun badge : on marque l'existant comme déjà vu.
  const seen = getSeenSet();
  const unlockedKeys = unlocked.map((u) => u.achievement_key);
  const freshKeys =
    seen === null
      ? new Set()
      : new Set(unlockedKeys.filter((k) => !seen.has(k)));
  saveSeenSet(new Set([...(seen ?? []), ...unlockedKeys]));
  window.dispatchEvent(new CustomEvent("pg-trophees-seen"));
  const unlockedDefs = CATALOG.filter((t) => unlockedMap.has(t.key));
  const unlockedCount = unlockedDefs.length;

  // Hero
  root.querySelector("#tr2-count").textContent =
    `${unlockedCount} / ${CATALOG.length}`;
  const pct = Math.round((100 * unlockedCount) / CATALOG.length);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const fill = root.querySelector("#tr2-fill");
  if (reduceMotion) {
    if (fill) {
      fill.style.transition = "none";
      fill.style.width = pct + "%";
    }
  } else {
    requestAnimationFrame(() => {
      if (fill) fill.style.width = pct + "%";
    });
  }
  root.querySelector("#tr2-hint").textContent =
    unlockedCount === 0
      ? "Valide des compétences pour décrocher ton premier trophée !"
      : `${pct}% du parcours — ${CATALOG.length - unlockedCount} restant${CATALOG.length - unlockedCount > 1 ? "s" : ""}`;

  // Add entry keyframe
  if (!document.head.querySelector("#tr2-kf")) {
    const s = document.createElement("style");
    s.id = "tr2-kf";
    s.textContent = `@keyframes tr2CardIn{from{opacity:0;transform:translateY(12px) scale(.92)}to{opacity:1;transform:none}}`;
    document.head.appendChild(s);
  }

  // ── Trophée vedette = le plus prestigieux débloqué (rareté puis récence),
  // sinon le prochain objectif (premier verrouillé) en teasing. ──
  let featuredHtml = "";
  if (unlockedCount > 0) {
    const best = [...unlockedDefs].sort((a, b) => {
      const dr = (RARITY_RANK[b.rarity] ?? 0) - (RARITY_RANK[a.rarity] ?? 0);
      if (dr) return dr;
      const da = unlockedMap.get(a.key)?.unlocked_at || 0;
      const db = unlockedMap.get(b.key)?.unlocked_at || 0;
      return new Date(db) - new Date(da);
    })[0];
    featuredHtml = renderFeatured(best, unlockedMap.get(best.key) || null);
  } else {
    // Aucun trophée : on met en avant le tout premier à viser.
    featuredHtml = renderFeatured(CATALOG[0], null, stats);
  }

  // Group by category
  const groups = {};
  for (const t of CATALOG) {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  }

  let html = featuredHtml;
  let globalIdx = 0;
  for (const [group, items] of Object.entries(groups)) {
    html += `<div class="tr2-group-label">${esc(group)}</div><div class="tr2-grid">`;
    for (const t of items) {
      const u = unlockedMap.get(t.key);
      const cssClass = u ? t.rarity : "locked";
      html += `
        <div class="tr2-card ${cssClass}" data-key="${esc(t.key)}" role="button" tabindex="0"
          style="animation:tr2CardIn .4s ${globalIdx * 45}ms cubic-bezier(.34,1.56,.64,1) both">
          ${u && freshKeys.has(t.key) ? `<span class="tr2-new-dot" aria-label="Nouveau trophée">NOUVEAU</span>` : ""}
          ${u ? `<div class="tr2-card-rarity" aria-hidden="true"></div>` : ""}
          <div class="tr2-card-emoji">${badgeMarkup(t, 64)}</div>
          <div class="tr2-card-name">${u ? esc(t.title) : "???"}</div>
          ${!u ? `<div class="tr2-card-mystery">${esc(shortProgress(t.key, stats))}</div>` : ""}
        </div>`;
      globalIdx++;
    }
    html += `</div>`;
  }
  root.querySelector("#tr2-body").innerHTML = html;

  // Vedette → ouvre son détail
  const featEl = root.querySelector(".tr2-feat");
  if (featEl) {
    const openFeat = () => {
      haptic("select");
      const def = CATALOG.find((t) => t.key === featEl.dataset.key);
      if (def) showModal(def, unlockedMap.get(def.key) ?? null, unlockedCount);
    };
    featEl.addEventListener("click", openFeat);
    featEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFeat();
      }
    });
  }

  root.querySelectorAll(".tr2-card").forEach((el) => {
    const open = () => {
      haptic("select");
      const key = el.dataset.key;
      const dot = el.querySelector(".tr2-new-dot");
      if (dot) {
        dot.style.transition = "opacity .25s, transform .25s";
        dot.style.opacity = "0";
        dot.style.transform = "scale(.6)";
        setTimeout(() => dot.remove(), 260);
      }
      const def = CATALOG.find((t) => t.key === key);
      const unlockData = unlockedMap.get(key) ?? null;
      if (def) showModal(def, unlockData, unlockedCount);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  // Deep-link #/trophees/{key} → ouvre directement le détail du trophée ciblé.
  if (openKey) {
    const def = CATALOG.find((t) => t.key === openKey);
    if (def) showModal(def, unlockedMap.get(openKey) ?? null, unlockedCount);
  }
}

// ─── Trophée vedette ──────────────────────────────────────────
function renderFeatured(def, unlockData, stats = { compCount: 0, streak: 0 }) {
  const isU = !!unlockData;
  const rar = def.rarity;
  const kicker = isU
    ? rar === "legendaire"
      ? "Ton trophée légendaire"
      : "Ton meilleur trophée"
    : "Ton premier trophée";
  let sub;
  if (isU && unlockData.unlocked_at) {
    sub = `Débloqué le ${new Date(unlockData.unlocked_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
  } else if (isU) {
    sub = "Débloqué — bravo !";
  } else {
    sub = `Objectif : ${shortProgress(def.key, stats)}`;
  }
  const sparks =
    isU && (rar === "legendaire" || rar === "epique")
      ? `<span class="tr2-feat-spark a" aria-hidden="true"></span><span class="tr2-feat-spark b" aria-hidden="true"></span>`
      : "";
  return `
    <div class="tr2-feat ${isU ? rar : "locked"}" data-key="${esc(def.key)}" role="button" tabindex="0"
      aria-label="${esc(def.title)} — ${esc(RARITY_LABEL[rar] || "")}${isU ? ", débloqué" : ", à débloquer"}">
      <div class="tr2-feat-kick"><span class="pin" aria-hidden="true"></span>${esc(kicker)}</div>
      <div class="tr2-feat-stage">
        <span class="tr2-feat-halo" aria-hidden="true"></span>
        ${sparks}
        ${
          def.image
            ? `<img class="tr2-feat-badge" src="${def.image}" alt="${esc(def.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"><span class="tr2-feat-badge-emoji" style="display:none">${def.emoji}</span>`
            : `<span class="tr2-feat-badge-emoji">${def.emoji}</span>`
        }
      </div>
      <div class="tr2-feat-foot">
        <div>
          <div class="tr2-feat-name">${isU ? esc(def.title) : "???"}</div>
          <div class="tr2-feat-sub">${esc(sub)}</div>
        </div>
        <span class="tr2-feat-chip">${esc(RARITY_LABEL[rar] || "")}</span>
      </div>
    </div>`;
}

// ─── Modal ────────────────────────────────────────────────────
function showModal(def, unlockData, totalUnlocked) {
  const rar = def.rarity;
  const isUnlocked = !!unlockData;
  const rcVar = `var(--rc-${rar})`;
  const dateStr = unlockData?.unlocked_at
    ? new Date(unlockData.unlocked_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const sparks = isUnlocked
    ? `<span class="tr2-modal-spark s1" aria-hidden="true"></span><span class="tr2-modal-spark s2" aria-hidden="true"></span><span class="tr2-modal-spark s3" aria-hidden="true"></span>`
    : "";

  const html = isUnlocked
    ? `
    <div class="tr2-modal" style="--mc:${rcVar}">
      <div class="tr2-modal-glow">
        <div class="tr2-modal-handle"></div>
        ${sparks}
        <div class="tr2-modal-emoji">${badgeMarkup(def, 130)}</div>
        <div class="tr2-rarity-chip ${rar}">${esc(RARITY_LABEL[rar] || "")}</div>
      </div>
      <div class="tr2-modal-body">
        <h2 class="tr2-modal-title">${esc(def.title)}</h2>
        <div class="tr2-modal-desc">${esc(def.body)}</div>
        <div class="tr2-modal-meta">
          <div class="tr2-modal-chip gems">+${def.gemmes} ${volantImg(13)} ${volantLabel(def.gemmes)}</div>
          ${dateStr ? `<div class="tr2-modal-chip date">${icon("calendar", { size: 13 })} ${esc(dateStr)}</div>` : ""}
        </div>
        <div class="tr2-modal-social">${
          totalUnlocked > 1
            ? `Tu fais partie des élèves les plus avancés de ton école`
            : "Continue pour débloquer plus de trophées !"
        }</div>
      </div>
      <div class="tr2-modal-actions">
        <button class="tr2-modal-share" id="tr2-share-btn" aria-label="Partager ce trophée"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg><span>Partager</span></button>
        <button class="tr2-modal-close" id="tr2-close-btn">Fermer</button>
      </div>
    </div>
  `
    : `
    <div class="tr2-modal" style="--mc:${rcVar}">
      <div class="tr2-modal-glow">
        <div class="tr2-modal-handle"></div>
        <div class="tr2-modal-emoji locked">${badgeMarkup(def, 130)}</div>
        <div class="tr2-rarity-chip locked">${icon("lock", { size: 13 })} Verrouillé</div>
      </div>
      <div class="tr2-modal-body">
        <h2 class="tr2-modal-title">${esc(def.title)}</h2>
        <div class="tr2-modal-desc">${esc(def.body)}</div>
        <div class="tr2-modal-meta">
          <div class="tr2-modal-chip gems">+${def.gemmes} ${volantImg(13)} ${volantLabel(def.gemmes)} à débloquer</div>
          <div class="tr2-modal-chip date">${esc(RARITY_LABEL[rar] || "")}</div>
        </div>
        <div class="tr2-modal-social">Objectif : ${esc(shortProgress(def.key))}</div>
      </div>
      <div class="tr2-modal-actions">
        <button class="tr2-modal-share goto" id="tr2-goto-btn">Aller au parcours →</button>
        <button class="tr2-modal-close" id="tr2-close-btn">Fermer</button>
      </div>
    </div>
  `;

  const { overlay, close: closeModal } = openBottomSheet({
    bgClass: "tr2-modal-bg",
    sheetSelector: ".tr2-modal",
    html,
  });
  track("trophy.modal_opened", { key: def.key, unlocked: isUnlocked });
  overlay
    .querySelector("#tr2-close-btn")
    ?.addEventListener("click", closeModal);

  if (isUnlocked) {
    overlay
      .querySelector("#tr2-share-btn")
      ?.addEventListener("click", async () => {
        const text = `J'ai débloqué "${def.title}" sur PermiGo !`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Mon trophée PermiGo",
              text,
              url: window.location.origin,
            });
          } catch {
            /* cancelled */
          }
        } else {
          try {
            await navigator.clipboard.writeText(text);
            toast("Texte copié", "success");
          } catch {
            /* unavailable */
          }
        }
      });
  } else {
    overlay.querySelector("#tr2-goto-btn")?.addEventListener("click", () => {
      closeModal();
      navigate("#/parcours");
    });
  }
}
