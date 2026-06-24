// ═══════════════════════════════════════════════════════════════
// Élève — Boutique (refonte "app de l'année" — ADN Supercell/CR)
// RPCs : get_items_catalog() · purchase_item(p_item_id)
// Onglets : Skins (avatars = voitures) · Fonds (permis_bg)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import {
  equipItem,
  unequipItem,
  setEquippedAsset,
  getEquipped,
  getEquippedAsset,
  getGemmes,
} from "@/utils/game-state.js";
import { openBottomSheet } from "@/components/common/bottom-sheet.js";
import { volantImg } from "@/utils/volant.js";
import { bumpVolantPill } from "@/components/eleve/volant-reward.js";
import { showPurchaseReveal } from "@/components/eleve/purchase-reveal.js";

const TABS = [
  { key: "skins", label: "Skins", ico: "car" },
  { key: "autres", label: "Fonds", ico: "image" },
];

// Types regroupés sous chaque onglet.
// Les thèmes ne sont plus vendus ici : le changement de couleur/thème est
// gratuit (F2P) dans les Réglages. La boutique reste cosmétique « flex ».
const TAB_TYPES = {
  skins: ["avatar"],
  autres: ["permis_bg"],
};

// Rareté — palette harmonisée :
//   commun    = bleu neutre  (aucune émotion)
//   rare      = violet accent (thème élève)
//   épique    = magenta/violet chaud (jamais orange = « alerte »)
//   légendaire = or (aspiration max)
//
// ⚠️ Volontairement DISTINCT de RARITY_META dans data/achievements.js :
// surfaces différentes — ici, tags boutique (fond sombre) ; là-bas, médailles
// trophées (dégradés). Ne PAS fusionner sans refonte visuelle des deux écrans.
const RARITY_META = {
  commun: {
    label: "Commun",
    c: "#3b82f6",
    tagBg: "color-mix(in srgb, #3b82f6 75%, #000)",
    tagFg: "#fff",
    order: 0,
    glow: false,
    legendary: false,
  },
  rare: {
    label: "Rare",
    c: "#8b5cf6",
    tagBg: "color-mix(in srgb, #8b5cf6 75%, #000)",
    tagFg: "#fff",
    order: 1,
    glow: false,
    legendary: false,
  },
  epique: {
    label: "Épique",
    c: "#c026d3",
    tagBg: "color-mix(in srgb, #c026d3 70%, #000)",
    tagFg: "#fff",
    order: 2,
    glow: true, // glow subtil + léger gradient de fond
    legendary: false,
  },
  legendaire: {
    label: "Légendaire",
    c: "#fbbf24",
    tagBg: "#fbbf24",
    tagFg: "#1a1208",
    order: 3,
    glow: true,
    legendary: true, // bordure conic animée + shimmer holographique
  },
};

function rm(rarity) {
  return RARITY_META[rarity] ?? RARITY_META.commun;
}

// ─── CSS ──────────────────────────────────────────────────────
const STYLE = `<style>
.bo2 {
  max-width: 480px; margin: 0 auto; padding: 0 0 100px;
  background: var(--bg); min-height: 100dvh; font-family: 'Inter', sans-serif;
}

/* ── Skeleton ── */
.bo2-skel {
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%; animation: bo2Shim 1.4s ease-in-out infinite; border-radius: var(--rl);
}
@keyframes bo2Shim { from{background-position:200% 0} to{background-position:-200% 0} }

/* ── Sticky header ── */
.bo2-hd {
  position: sticky; top: calc(52px + env(safe-area-inset-top, 0px)); z-index: 20;
  background: linear-gradient(160deg, color-mix(in srgb, var(--a) 22%, #14101f) 0%, color-mix(in srgb, var(--a) 42%, #14101f) 60%, var(--adk) 100%);
  padding: 14px 20px 0; overflow: hidden;
}
.bo2-hd::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 70% at 90% 20%, color-mix(in srgb, var(--a-lt) 30%, transparent) 0%, transparent 55%);
  pointer-events: none;
}
.bo2-hd-row {
  position: relative; z-index: 1; display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 14px;
}
.bo2-hd-title { font: 800 clamp(19px, 5.6vw, 22px)/1.1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.03em; }

/* Pastille solde — accessible : role status + aria-live */
.bo2-gems {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  border-radius: var(--r-full); padding: 7px 14px; position: relative; overflow: hidden;
}
.bo2-gems-ico { font-size: 16px; line-height: 1; }
.bo2-gems-val { font: 800 15px/1 'IBM Plex Mono', monospace; color: #fff; letter-spacing: -.02em; }
/* Texte SR-only "volants" à côté de l'icône (fallback accessible) */
.bo2-gems-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.bo2-gems-float {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font: 700 13px/1 'IBM Plex Mono', monospace; color: #f87171; pointer-events: none;
  opacity: 0; animation: bo2Float .8s ease-out both;
}
@keyframes bo2Float { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-20px)} }

/* ── Tabs ── */
.bo2-tabs { position: relative; z-index: 1; display: flex; gap: 8px; padding-bottom: 14px; }
.bo2-tab {
  flex: 1; padding: 9px 8px; border-radius: var(--r); min-height: 44px;
  background: rgba(255,255,255,.06); border: 1px solid transparent;
  font: 700 13px/1 'Inter', sans-serif; color: rgba(255,255,255,.6);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: color .15s, background .15s, border-color .15s, transform .14s var(--ease-snap); font-family: inherit; white-space: nowrap;
}
.bo2-tab:active { transform: scale(.97); }
.bo2-tab.active { color: #1e1b4b; background: #fff; border-color: #fff; }

/* ── Hero vedette (premier légendaire ou skin le + cher atteignable) ── */
.bo2-hero {
  margin: 16px 16px 0; border-radius: var(--r-xl); overflow: hidden; position: relative;
  background: linear-gradient(145deg, #1e1340 0%, #2a1f5c 100%);
  border: 1px solid rgba(251,191,36,.28); cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring);
}
.bo2-hero:active { transform: scale(.98); }

/* Bordure conic animée pour le hero légendaire */
.bo2-hero-legendary-border {
  position: absolute; inset: 0; border-radius: var(--r-xl); z-index: 0;
  background: conic-gradient(from 0deg, #fbbf24 0%, #f472b6 25%, #8b5cf6 50%, #fbbf24 75%, #f472b6 100%);
  animation: bo2ConicSpin 4s linear infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; padding: 1.5px;
}
@keyframes bo2ConicSpin { to { transform: rotate(360deg); } }

.bo2-hero-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 16px; padding: 16px; }
.bo2-hero-img {
  width: 88px; height: 88px; flex-shrink: 0; border-radius: var(--r-lg); overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.06);
}
.bo2-hero-img img { width: 100%; height: 100%; object-fit: cover; }
.bo2-hero-img-emoji { font-size: 40px; }
.bo2-hero-body { flex: 1; min-width: 0; }
.bo2-hero-badge {
  display: inline-block; margin-bottom: 6px;
  font: 800 9px/1 'IBM Plex Mono', monospace; letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 9px; border-radius: var(--r-full); background: #fbbf24; color: #1a1208;
}
.bo2-hero-name { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.02em; margin-bottom: 6px; }
.bo2-hero-desc { font: 500 12px/1.4 'Inter', sans-serif; color: rgba(255,255,255,.65); margin-bottom: 10px; }
/* Barre de progression « plus que N volants » */
.bo2-hero-prog-wrap { display: flex; flex-direction: column; gap: 4px; }
.bo2-hero-prog-label { font: 600 11px/1 'Inter', sans-serif; color: rgba(255,255,255,.6); }
.bo2-hero-prog-track {
  height: 6px; border-radius: 3px; background: rgba(255,255,255,.14); overflow: hidden;
}
.bo2-hero-prog-bar { height: 100%; border-radius: 3px; background: linear-gradient(90deg,#fbbf24,#f59e0b); transition: width .4s ease; }

/* ── Section heading ── */
.bo2-sec {
  padding: 18px 20px 4px;
}
.bo2-sec-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.bo2-sec-sub { font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }

/* ── Grid ── */
.bo2-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px 16px 0; }

/* ── Carte commune (escalade visuelle par rareté) ── */
.bo2-card {
  background: var(--su); border-radius: var(--r-xl); overflow: hidden; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: transform .14s var(--ease-spring);
  user-select: none; position: relative;
}
.bo2-card:active { transform: scale(.95); }

/* Rare : bordure teintée visible */
.bo2-card[data-rarity="rare"] {
  border: 1.5px solid rgba(139,92,246,.45) !important;
}

/* Épique : bordure + glow doux + gradient de fond subtil */
.bo2-card[data-rarity="epique"] {
  border: 1.5px solid rgba(192,38,211,.55) !important;
  box-shadow: 0 0 18px -4px rgba(192,38,211,.3) !important;
}

/* Légendaire : bordure conic animée (shimmer holographique) + ruban */
.bo2-card[data-rarity="legendaire"] {
  border: none !important;
  position: relative;
}
.bo2-card[data-rarity="legendaire"]::before {
  content: ''; position: absolute; inset: 0; border-radius: var(--r-xl); z-index: 0;
  background: conic-gradient(from 0deg, #fbbf24 0%, #f472b6 25%, #8b5cf6 50%, #fbbf24 75%, #f472b6 100%);
  animation: bo2ConicSpin 4s linear infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; padding: 1.5px;
  pointer-events: none;
}
/* Shimmer holographique sur le légendaire */
.bo2-card[data-rarity="legendaire"] .bo2-card-preview::after {
  content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 48%, rgba(251,191,36,.12) 52%, transparent 70%);
  animation: bo2Shimmer 3s ease-in-out infinite;
}
@keyframes bo2Shimmer { 0%,100%{opacity:0;transform:translateX(-100%)} 50%{opacity:1;transform:translateX(100%)} }

/* Ruban légendaire (coin supérieur droit) */
.bo2-legendary-ribbon {
  position: absolute; top: 0; right: 0; z-index: 4;
  width: 64px; height: 64px; overflow: hidden; pointer-events: none;
}
.bo2-legendary-ribbon span {
  position: absolute; top: 14px; right: -12px;
  transform: rotate(45deg); transform-origin: 50% 50%;
  width: 68px; text-align: center;
  font: 800 7px/1.6 'IBM Plex Mono', monospace; letter-spacing: .06em; text-transform: uppercase;
  background: #fbbf24; color: #1a1208; padding: 2px 0;
  box-shadow: 0 1px 4px rgba(0,0,0,.3);
}

.bo2-card-preview {
  height: 118px; display: flex; align-items: center; justify-content: center; background: var(--bg); overflow: hidden; position: relative;
}
.bo2-card-preview img { width: 86px; height: 86px; object-fit: contain; filter: drop-shadow(0 6px 14px rgba(11,13,26,.28)); transition: transform .25s var(--ease-spring); position: relative; z-index: 2; }
.bo2-card:active .bo2-card-preview img { transform: scale(.92); }
@media (hover: hover) { .bo2-card:hover .bo2-card-preview img { transform: scale(1.08) translateY(-2px); } }
.bo2-card-preview-circle { width: 66px; height: 66px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; position: relative; z-index: 2; }

/* Étiquette de rareté */
.bo2-card-rarity-tag {
  position: absolute; top: 8px; left: 8px; z-index: 4;
  padding: 3px 8px; border-radius: var(--r-full); color: #fff;
  font: 800 8.5px/1 'Inter', sans-serif; letter-spacing: .08em; text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(11,13,26,.25);
}
.bo2-card-owned-badge {
  position: absolute; top: 8px; right: 8px; z-index: 4;
  background: rgba(16,185,129,.92); border-radius: var(--r-full);
  padding: 3px 8px; font: 700 9px/1 'IBM Plex Mono', monospace; color: #fff; letter-spacing: .04em; text-transform: uppercase;
}
.bo2-card-info { padding: 10px 12px 12px; position: relative; z-index: 1; }
.bo2-card-name { font: 800 13.5px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bo2-card-footer { display: flex; align-items: center; justify-content: center; gap: 8px; }
.bo2-price-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; padding: 9px 12px; border: none; border-radius: var(--r);
  color: #fff; font: 800 12.5px/1 'IBM Plex Mono', monospace; cursor: pointer; min-height: 44px;
  white-space: nowrap; transition: transform .12s, opacity .12s; -webkit-tap-highlight-color: transparent;
}
.bo2-price-btn:active { transform: scale(.95); opacity: .9; }
.bo2-price-btn:disabled { opacity: .5; cursor: default; }
.bo2-price-btn.cant-afford { background: var(--bg2); color: var(--mu2); }
/* Fond = accent FONCÉ (--adk) + texte blanc : garantit le contraste AA quel que
   soit l'accent choisi (les accents clairs type cyan échouaient le 4.5:1 avec --a). */
.bo2-equip-cta { background: var(--adk); color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }
.bo2-owned-txt { display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; font: 800 12px/1 'Plus Jakarta Sans', sans-serif; color: var(--gr-txt); padding: 9px 0; min-height: 40px; }

/* ── Intro / tuto ── */
.bo2-intro {
  position: relative; margin: 14px 16px 4px; padding: 14px 16px;
  border-radius: var(--rl); overflow: hidden;
  display: flex; gap: 13px; align-items: flex-start;
  background: linear-gradient(150deg, color-mix(in srgb, var(--a) 14%, var(--su)) 0%, var(--su) 70%);
  border: 1px solid color-mix(in srgb, var(--a) 26%, transparent);
  transition: height .26s ease, opacity .26s ease, margin .26s ease, padding .26s ease;
}
.bo2-intro.out { opacity: 0; height: 0 !important; margin-top: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
.bo2-intro-x::before { content: ''; position: absolute; inset: -7px; }
.bo2-intro-x {
  position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border: 0;
  background: var(--bg2); color: var(--mu); border-radius: 50%; font-size: 17px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.bo2-intro-ico {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: var(--r-md);
  background: var(--a); color: var(--a-ink);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 5px 14px -4px color-mix(in srgb, var(--a) 55%, transparent);
}
.bo2-intro-body { flex: 1; min-width: 0; padding-right: 24px; }
.bo2-intro-title { font: 800 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 8px; }
.bo2-intro-steps { display: flex; flex-direction: column; gap: 6px; }
.bo2-intro-steps span { display: flex; align-items: center; gap: 7px; font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu); }
.bo2-intro-steps span svg { color: var(--a-txt); flex-shrink: 0; }

/* ── Detail modal (bottom-sheet) ── */
.bo2-modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 500; display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0); animation: bo2FadeBg .2s ease both;
}
@keyframes bo2FadeBg { from{opacity:0} to{opacity:1} }
.bo2-modal {
  width: 100%; max-width: 480px; border-radius: 28px 28px 0 0; padding: 0 0 24px;
  background: linear-gradient(180deg, #1e1b4b 0%, #15122e 100%);
  animation: bo2ModalUp .3s cubic-bezier(.32,.72,0,1) both;
}
@keyframes bo2ModalUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
.bo2-modal-handle { width: 36px; height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; margin: 14px auto 8px; }

/* Halo preview modal */
.bo2-halo { height: 248px; display: flex; align-items: center; justify-content: center; position: relative; padding-top: 10px; }
.bo2-halo-ring {
  width: 216px; height: 216px; border-radius: 28px; overflow: hidden; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.bo2-halo-ring img { width: 100%; height: 100%; object-fit: cover; position: relative; z-index: 2; }
.bo2-halo-ring .bo2-fallback { font-size: 76px; position: relative; z-index: 2; }

/* Shimmer holographique dans le modal pour le légendaire */
.bo2-halo-ring.legendary {
  box-shadow: 0 0 40px rgba(251,191,36,.4), inset 0 0 20px rgba(251,191,36,.08);
}
.bo2-halo-ring.legendary::after {
  content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.22) 48%, rgba(251,191,36,.14) 52%, transparent 70%);
  animation: bo2Shimmer 2.5s ease-in-out infinite;
}

/* Try-before-buy : contexte visuel dans le modal */
.bo2-try-preview {
  margin: 0 24px 14px; border-radius: var(--r-lg); overflow: hidden;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
}
.bo2-try-preview-title {
  font: 700 10px/1 'IBM Plex Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
  color: rgba(255,255,255,.5); padding: 8px 12px 6px;
}
/* Fausse ligne de classement (avatar) */
.bo2-try-rank-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px 10px;
  border-top: 1px solid rgba(255,255,255,.07);
}
.bo2-try-rank-num { font: 800 14px/1 'IBM Plex Mono', monospace; color: #fbbf24; min-width: 24px; }
.bo2-try-rank-avatar {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center;
}
.bo2-try-rank-avatar img { width: 100%; height: 100%; object-fit: cover; }
.bo2-try-rank-avatar-emoji { font-size: 20px; }
.bo2-try-rank-name { flex: 1; font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: #fff; }
.bo2-try-rank-score { font: 600 12px/1 'IBM Plex Mono', monospace; color: rgba(255,255,255,.55); }
/* Mini permis virtuel (permis_bg) */
.bo2-try-permis {
  display: flex; align-items: center; justify-content: center; padding: 10px;
}
.bo2-try-permis-card {
  width: 180px; height: 112px; border-radius: 10px; overflow: hidden; position: relative;
  box-shadow: 0 6px 20px -4px rgba(0,0,0,.5);
}
.bo2-try-permis-card img { width: 100%; height: 100%; object-fit: cover; }
.bo2-try-permis-badge {
  position: absolute; bottom: 6px; left: 8px; right: 8px;
  font: 700 9px/1.3 'Inter', sans-serif; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.7);
}

.bo2-modal-body { padding: 4px 24px 0; text-align: center; }
.bo2-modal-pill {
  display: inline-block; font: 800 10px/1 'IBM Plex Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
  padding: 5px 12px; border-radius: var(--r-full); color: #fff; margin-bottom: 10px;
}
.bo2-modal-name { font: 800 26px/1.1 'Plus Jakarta Sans', sans-serif; color: #fff; letter-spacing: -.03em; margin-bottom: 8px; }
.bo2-modal-desc { font: 500 14px/1.5 'Inter', sans-serif; color: rgba(255,255,255,.7); margin-bottom: 14px; max-width: 320px; margin-left: auto; margin-right: auto; }

/* Bloc prix consolidé (un seul bloc, pas triple affichage) */
.bo2-modal-price {
  margin: 0 24px 16px; padding: 12px 16px; border-radius: var(--r-lg); background: rgba(255,255,255,.08);
  display: flex; align-items: center; justify-content: space-between;
}
.bo2-modal-price-label { font: 600 14px/1 'Inter', sans-serif; color: rgba(255,255,255,.7); }
.bo2-modal-price-amount { display: flex; align-items: center; gap: 6px; font: 800 20px/1 'IBM Plex Mono', monospace; color: #fff; }
.bo2-modal-balance { font: 500 12px/1 'Inter', sans-serif; color: rgba(255,255,255,.55); text-align: center; margin: 0 24px 14px; }

.bo2-modal-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 48px); margin: 0 24px; padding: 17px; border: none; border-radius: var(--r-full);
  font: 800 17px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; min-height: 56px;
  transition: transform .14s var(--ease-spring), opacity .12s;
}
.bo2-modal-cta.buy { background: var(--a); color: var(--a-ink); box-shadow: var(--s-a-lg); }
.bo2-modal-cta.equip { background: #fff; color: #1e1b4b; }
.bo2-modal-cta.locked { background: rgba(255,255,255,.12); color: rgba(255,255,255,.5); cursor: default; }
.bo2-modal-cta:not(.locked):active { transform: scale(.97); opacity: .9; }
.bo2-modal-cancel {
  display: block; width: calc(100% - 48px); margin: 10px 24px 0; padding: 12px; background: none; border: none;
  color: rgba(255,255,255,.6); font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
}

/* ── Empty / error ── */
.bo2-empty { text-align: center; padding: 56px 24px; color: var(--mu); }
.bo2-empty-ico { font-size: 48px; margin-bottom: 12px; }
.bo2-empty-t { font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 6px; }
.bo2-empty-d { font: 500 13px/1.5 'Inter', sans-serif; }

@keyframes bo2CardIn { from{opacity:0;transform:translateY(14px) scale(.93)} to{opacity:1;transform:none} }
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important }
}
</style>`;

// Persiste l'avatar équipé dans profiles.avatar_url (slot 'avatar' seulement).
// Sans ça, l'équipement vit en localStorage → invisible du serveur, donc le
// classement affiche toujours l'avatar d'inscription au lieu du skin équipé.
async function syncAvatarUrlToProfile(slot, assetUrl) {
  if (slot !== "avatar") return;
  const me = getCurUser();
  if (!me) return;
  try {
    await sb
      .from("profiles")
      .update({ avatar_url: assetUrl || null })
      .eq("id", me.id);
    me.avatar_url = assetUrl || null;
  } catch (e) {
    console.warn("[boutique] sync avatar_url failed", e);
  }
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track("page.view", { page: "boutique" });

  // Réconciliation : un avatar équipé en local mais absent de la base (ancien
  // équipement) → on le pousse dans profiles.avatar_url pour le classement.
  const equippedAv = getEquippedAsset("avatar");
  if (equippedAv && equippedAv !== me.avatar_url)
    syncAvatarUrlToProfile("avatar", equippedAv);

  root.innerHTML = `${STYLE}
<div class="bo2 anim-slide-up">
  <div class="bo2-hd">
    <div class="bo2-hd-row">
      <h1 class="bo2-hd-title" tabindex="-1">Boutique</h1>
      <div class="bo2-gems"
           id="bo2-gems-badge"
           data-volant-balance
           role="status"
           aria-live="polite"
           aria-label="Ton solde : … volants">
        <span class="bo2-gems-ico">${volantImg(15)}</span>
        <span class="bo2-gems-val" id="bo2-gems-val" data-volant-count>…</span>
        <span class="bo2-gems-sr">volants</span>
      </div>
    </div>
    <div class="bo2-tabs" id="bo2-tabs" role="tablist">
      ${TABS.map(
        (t, i) => `
        <button class="bo2-tab ${i === 0 ? "active" : ""}" data-tab="${esc(t.key)}" role="tab" aria-selected="${i === 0 ? "true" : "false"}">${icon(t.ico, { size: 14 })} ${esc(t.label)}</button>
      `,
      ).join("")}
    </div>
  </div>
  <div id="bo2-content">
    <div class="bo2-grid" style="padding:12px 16px 0">
      ${[...Array(4)].map(() => `<div class="bo2-skel" style="height:180px"></div>`).join("")}
    </div>
  </div>
</div>`;

  // Source canonique du solde : localStorage hydraté par initGameState.
  // Un fetch frais depuis profiles.gemmes est lancé en parallèle.
  let gemmes = getGemmes();
  _updateGemsBadge(root, gemmes);

  const [profileRes, itemsRes] = await Promise.allSettled([
    sb.from("profiles").select("gemmes").eq("id", me.id).maybeSingle(),
    sb.rpc("get_items_catalog"),
  ]);

  // Si le serveur renvoie un solde plus récent, on prend le serveur.
  const serverBalance = profileRes.value?.data?.gemmes;
  if (typeof serverBalance === "number") {
    gemmes = serverBalance;
    // Met à jour localStorage + notifie le header.
    localStorage.setItem("pg-gemmes", String(gemmes));
    _updateGemsBadge(root, gemmes);
  }

  const catalogFailed =
    itemsRes.status === "rejected" || !!itemsRes.value?.error;
  const allItems = itemsRes.value?.data ?? [];

  let activeTab = TABS[0].key;

  // ── Source unique du solde après achat ────────────────────────
  function applyPurchase(result, item) {
    if (!result || result.ok === false) return false;
    const fallback =
      typeof gemmes === "number" ? gemmes - item.cost_gemmes : gemmes;
    const newBalance =
      typeof result.new_balance === "number" ? result.new_balance : fallback;
    gemmes = newBalance;

    // Marque comme possédé dans la liste locale
    const target = allItems.find((i) => i.id === item.id);
    if (target) {
      target.owned = true;
      target.acquired_at = new Date().toISOString();
    }

    // Met à jour le cache localStorage ET notifie le header (event pg-gemmes-changed)
    localStorage.setItem("pg-gemmes", String(newBalance));
    window.dispatchEvent(
      new CustomEvent("pg-gemmes-changed", { detail: { balance: newBalance } }),
    );

    // Met à jour la pastille locale
    _updateGemsBadge(root, newBalance);

    // Rebond visuel sur la pastille
    const badge = root.querySelector("[data-volant-balance]");
    if (badge) bumpVolantPill(badge);

    return true;
  }

  function buyFlow(item, triggerEl) {
    showDetailModal(
      item,
      gemmes,
      me,
      async () => {
        const balanceBadge = root.querySelector("#bo2-gems-badge");
        const result = await doPurchase(item, root, allItems);
        if (applyPurchase(result, item)) {
          showGemsFloat(root, `-${item.cost_gemmes}`);
          // Reveal plein écran (priorité #1)
          showPurchaseReveal({
            item,
            balanceBadge,
            cost: item.cost_gemmes,
            onClose: () => renderTab(activeTab),
          });
        }
      },
      triggerEl,
    );
  }

  function toggleEquip(item) {
    const eq = getEquipped();
    if (eq[item.type] === item.id) {
      unequipItem(item.type);
      setEquippedAsset(item.type, null);
      syncAvatarUrlToProfile(item.type, null);
      toast(`${esc(item.name)} retiré`, "info");
    } else {
      equipItem(item.type, item.id);
      setEquippedAsset(item.type, item.asset_url || null);
      syncAvatarUrlToProfile(item.type, item.asset_url || null);
      toast(`${esc(item.name)} équipé ✓`, "success");
    }
    // Mute seulement la carte concernée (pas de re-render global)
    _muteCard(root, item);
  }

  function renderTab(tabKey) {
    const types = TAB_TYPES[tabKey] || [];
    const items = allItems.filter((i) => types.includes(i.type));
    const content = root.querySelector("#bo2-content");
    if (!content) return;

    // Masque l'onglet Fonds s'il est vide (hygiène #8)
    if (tabKey === "autres" && !items.length && !catalogFailed) {
      content.innerHTML = `<div class="bo2-empty">
        <div class="bo2-empty-ico">${icon("image", { size: 30 })}</div>
        <div class="bo2-empty-t">Bientôt disponible</div>
        <div class="bo2-empty-d">Ces fonds arrivent dans la prochaine mise à jour !</div>
      </div>`;
      return;
    }

    if (!items.length) {
      content.innerHTML = catalogFailed
        ? `<div class="bo2-empty"><div class="bo2-empty-ico">${icon("alert-circle", { size: 30 })}</div><div class="bo2-empty-t">Boutique indisponible</div><div class="bo2-empty-d">Vérifie ta connexion et réessaie.</div></div>`
        : `<div class="bo2-empty"><div class="bo2-empty-ico">${icon("shopping-bag", { size: 30 })}</div><div class="bo2-empty-t">Bientôt disponible</div><div class="bo2-empty-d">Ces items arrivent dans la prochaine mise à jour !</div></div>`;
      return;
    }

    renderGrid(content, items);
  }

  // Wire commun aux grilles
  function wireGrid(content) {
    content.querySelectorAll(".bo2-card").forEach((el) => {
      el.addEventListener("click", (e) => {
        haptic("select");
        const item = allItems.find((i) => i.id === el.dataset.itemId);
        if (!item) return;
        if (item.owned) {
          toggleEquip(item);
          return;
        }
        buyFlow(item, el);
      });
    });
    content.querySelectorAll(".bo2-price-btn:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        haptic("select");
        const item = allItems.find(
          (i) => i.id === btn.closest(".bo2-card")?.dataset.itemId,
        );
        if (!item) return;
        if (item.owned) toggleEquip(item);
        else buyFlow(item, btn);
      });
    });
    // Hero vedette
    content.querySelector(".bo2-hero")?.addEventListener("click", (e) => {
      haptic("select");
      const heroId = content.querySelector(".bo2-hero")?.dataset.itemId;
      const item = allItems.find((i) => i.id === heroId);
      if (!item) return;
      if (item.owned) toggleEquip(item);
      else buyFlow(item, e.currentTarget);
    });
  }

  // ── Grille unifiée (skins + autres) ──────────────────────────
  function renderGrid(content, items) {
    const sorted = [...items].sort(
      (a, b) =>
        rm(b.rarity).order - rm(a.rarity).order || // légendaire en premier
        b.cost_gemmes - a.cost_gemmes,
    );

    // Hero vedette = le légendaire, ou à défaut le plus cher
    const hero = sorted.find((i) => i.rarity === "legendaire") || sorted[0];
    const rest = sorted.filter((i) => i !== hero);

    const heroHtml = hero ? renderHeroCard(hero, gemmes) : "";
    const introHtml = renderIntro();

    content.innerHTML = `
      ${heroHtml}
      ${introHtml}
      <div class="bo2-sec">
        <div class="bo2-sec-title">Tous les items</div>
        <div class="bo2-sec-sub">Débloque ton style sur PermiGo</div>
      </div>
      <div class="bo2-grid">
        ${rest.map((item, idx) => renderGridCard(item, gemmes, idx)).join("")}
      </div>`;

    wireGrid(content);
    wireIntro(content);
  }

  renderTab(activeTab);

  root.querySelector("#bo2-tabs")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".bo2-tab");
    if (!btn) return;
    haptic("tap");
    activeTab = btn.dataset.tab;
    root.querySelectorAll(".bo2-tab").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    requestAnimationFrame(() => renderTab(activeTab));
    track("boutique.tab_changed", { tab: activeTab });
  });
}

// ─── Mise à jour pastille solde ───────────────────────────────
function _updateGemsBadge(root, balance) {
  const val = root.querySelector("#bo2-gems-val");
  if (val) val.textContent = balance;
  const badge = root.querySelector("#bo2-gems-badge");
  if (badge) {
    badge.setAttribute(
      "aria-label",
      `Ton solde : ${balance} volant${balance <= 1 ? "" : "s"}`,
    );
  }
}

// ─── Hero vedette pleine largeur ─────────────────────────────
function renderHeroCard(item, gemmes) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const pct = Math.min(100, Math.round((gemmes / item.cost_gemmes) * 100));
  const lacking = item.cost_gemmes - gemmes;
  const isOwned = item.owned;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const imgHtml = item.asset_url
    ? `<img src="${esc(item.asset_url)}" alt="${esc(item.name)}" loading="lazy">`
    : `<span class="bo2-hero-img-emoji">${_typeEmoji(item.type)}</span>`;

  const legendaryBorderHtml =
    item.rarity === "legendaire"
      ? `<div class="bo2-hero-legendary-border" aria-hidden="true"></div>`
      : "";

  const progHtml = !isOwned
    ? `<div class="bo2-hero-prog-wrap">
        <div class="bo2-hero-prog-label">${canAfford ? "Tu peux l'acheter !" : `Encore ${lacking} volant${lacking > 1 ? "s" : ""}`}</div>
        <div class="bo2-hero-prog-track">
          <div class="bo2-hero-prog-bar" style="width:${pct}%"></div>
        </div>
      </div>`
    : isEquipped
      ? `<div style="font:700 12px/1 'Inter',sans-serif;color:#34d399">✓ Équipé</div>`
      : `<div style="font:700 12px/1 'Inter',sans-serif;color:rgba(255,255,255,.6)">Débloqué — touche pour équiper</div>`;

  return `
    <div class="bo2-hero" data-item-id="${esc(item.id)}" role="button" tabindex="0" aria-label="${esc(item.name)}, ${esc(r.label)}, ${isOwned ? (isEquipped ? "équipé" : "débloqué") : canAfford ? "acheter" : "pas assez de volants"}">
      ${legendaryBorderHtml}
      <div class="bo2-hero-inner">
        <div class="bo2-hero-img">${imgHtml}</div>
        <div class="bo2-hero-body">
          <div class="bo2-hero-badge">${esc(r.label)}</div>
          <div class="bo2-hero-name">${esc(item.name)}</div>
          ${item.description ? `<div class="bo2-hero-desc">${esc(item.description)}</div>` : ""}
          ${progHtml}
        </div>
      </div>
    </div>`;
}

// ─── Tuto / intro ─────────────────────────────────────────────
const INTRO_KEY = "pg-boutique-intro-seen";
function introSeen() {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}
function renderIntro() {
  if (introSeen()) return "";
  return `
    <div class="bo2-intro" id="bo2-intro">
      <button class="bo2-intro-x" id="bo2-intro-x" type="button" aria-label="J'ai compris">×</button>
      <div class="bo2-intro-ico">${icon("car", { size: 22 })}</div>
      <div class="bo2-intro-body">
        <div class="bo2-intro-title">Ta voiture, ta signature</div>
        <div class="bo2-intro-steps">
          <span>${icon("users", { size: 13 })} Elle s'affiche à côté de ton nom dans le classement</span>
          <span>${volantImg(14)} Débloque des skins avec tes volants</span>
          <span>${icon("check", { size: 13, strokeWidth: 3 })} Touche un item pour l'équiper en 1 tap</span>
        </div>
      </div>
    </div>`;
}
function wireIntro(content) {
  content.querySelector("#bo2-intro-x")?.addEventListener("click", () => {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    const el = content.querySelector("#bo2-intro");
    if (el) {
      el.style.height = el.offsetHeight + "px";
      requestAnimationFrame(() => el.classList.add("out"));
      setTimeout(() => el.remove(), 280);
    }
  });
}

// ─── Grid card ────────────────────────────────────────────────
function renderGridCard(item, gemmes, idx) {
  const r = rm(item.rarity);
  const canAfford = gemmes >= item.cost_gemmes;
  const color = item.display_color || r.c;
  const imgUrl = item.asset_url ?? null;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const preview = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` +
      `<div class="bo2-card-preview-circle" style="background:${esc(color)}20;color:${esc(color)};display:none">${_typeIconSvg(item.type, color)}</div>`
    : `<div class="bo2-card-preview-circle" style="background:${esc(color)}20;color:${esc(color)}">${_typeIconSvg(item.type, color)}</div>`;

  const legendaryRibbon =
    item.rarity === "legendaire"
      ? `<div class="bo2-legendary-ribbon" aria-hidden="true"><span>Légend.</span></div>`
      : "";

  return `
    <div class="bo2-card" data-item-id="${esc(item.id)}" data-rarity="${esc(item.rarity)}"
      style="border:1px solid ${r.c}3a; box-shadow:var(--s0); animation: bo2CardIn .4s ${idx * 60}ms cubic-bezier(.34,1.56,.64,1) both">
      <div class="bo2-card-preview" style="background:radial-gradient(120% 90% at 50% 12%, ${r.c}14 0%, transparent 60%), var(--su)">
        <span class="bo2-card-rarity-tag" style="background:${r.tagBg};color:${r.tagFg}">${esc(r.label)}</span>
        ${legendaryRibbon}
        ${preview}
        ${item.owned ? `<div class="bo2-card-owned-badge">✓ Débloqué</div>` : ""}
      </div>
      <div class="bo2-card-info">
        <div class="bo2-card-name">${esc(item.name)}</div>
        <div class="bo2-card-footer">
          ${
            item.owned
              ? isEquipped
                ? `<div class="bo2-owned-txt">${icon("check", { size: 13, strokeWidth: 3 })} Équipé</div>`
                : `<button class="bo2-price-btn bo2-equip-cta">Équiper</button>`
              : `<button class="bo2-price-btn ${canAfford ? "" : "cant-afford"}" style="${canAfford ? `background:${r.c}` : ""}" ${!canAfford ? "disabled" : ""}>${volantImg(14)} ${item.cost_gemmes}</button>`
          }
        </div>
      </div>
    </div>`;
}

// ─── Icônes vectorielles par type (remplace les fallback emoji #8) ──
function _typeIconSvg(type, color) {
  // Renvoie un SVG inline teinté à la couleur de rareté
  const c = esc(color || "#8b5cf6");
  if (type === "avatar") {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M19 17H5c0-2.5 1.5-4 3-5l1-3h6l1 3c1.5 1 3 2.5 3 5z"/><circle cx="8.5" cy="17.5" r="1.5"/><circle cx="15.5" cy="17.5" r="1.5"/>
    </svg>`;
  }
  if (type === "theme") {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/>
    </svg>`;
  }
  if (type === "permis_bg") {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M7 9h.01M7 15h10M7 12h5"/>
    </svg>`;
  }
  return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>
  </svg>`;
}

function _typeEmoji(type) {
  if (type === "avatar") return "🚗";
  if (type === "theme") return "🎨";
  if (type === "permis_bg") return "🖼";
  return "🎁";
}

// ─── Gem float animation ──────────────────────────────────────
function showGemsFloat(root, text) {
  const badge = root.querySelector("#bo2-gems-badge");
  if (!badge) return;
  const el = document.createElement("div");
  el.className = "bo2-gems-float";
  el.textContent = text;
  badge.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ─── Mute ciblé de la carte après équipement (sans re-render global) ─
function _muteCard(root, item) {
  const card = root.querySelector(
    `.bo2-card[data-item-id="${CSS.escape(item.id)}"]`,
  );
  if (!card) return;
  const isEquipped = getEquipped()[item.type] === item.id;
  const footer = card.querySelector(".bo2-card-footer");
  if (!footer) return;
  if (isEquipped) {
    footer.innerHTML = `<div class="bo2-owned-txt">${icon("check", { size: 13, strokeWidth: 3 })} Équipé</div>`;
  } else {
    footer.innerHTML = `<button class="bo2-price-btn bo2-equip-cta">Équiper</button>`;
    // Re-wire le bouton équiper
    footer.querySelector(".bo2-equip-cta")?.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic("select");
      toggleEquipLocal(item, root);
    });
  }
}

// toggleEquip inline pour le re-wire post-mute
function toggleEquipLocal(item, root) {
  const eq = getEquipped();
  if (eq[item.type] === item.id) {
    unequipItem(item.type);
    setEquippedAsset(item.type, null);
    syncAvatarUrlToProfile(item.type, null);
    toast(`${esc(item.name)} retiré`, "info");
  } else {
    equipItem(item.type, item.id);
    setEquippedAsset(item.type, item.asset_url || null);
    syncAvatarUrlToProfile(item.type, item.asset_url || null);
    toast(`${esc(item.name)} équipé ✓`, "success");
  }
  _muteCard(root, item);
}

// ─── Detail modal (bottom-sheet) ─────────────────────────────
function showDetailModal(item, gemmes, me, onConfirm, triggerEl) {
  if (document.querySelector(".bo2-modal-bg")) return; // une seule modale à la fois
  const r = rm(item.rarity);
  const afterBalance = gemmes - item.cost_gemmes;
  const canAfford = afterBalance >= 0;
  const isEquipped = item.owned && getEquipped()[item.type] === item.id;

  const imgUrl = item.asset_url ?? null;
  const halo = imgUrl
    ? `<img src="${esc(imgUrl)}" alt="${esc(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="bo2-fallback" style="display:none">${_typeEmoji(item.type)}</span>`
    : `<span class="bo2-fallback">${_typeEmoji(item.type)}</span>`;

  // Try-before-buy : contexte visuel selon le type (#5)
  const tryPreview = _renderTryPreview(item, me);

  // Bloc prix consolidé (un seul affichage — #8)
  const priceBlock = item.owned
    ? ""
    : `<div class="bo2-modal-price">
        <span class="bo2-modal-price-label">Prix</span>
        <span class="bo2-modal-price-amount">${volantImg(16)} ${item.cost_gemmes}</span>
      </div>`;

  let cta,
    balanceLine = "";
  if (item.owned) {
    cta = `<button class="bo2-modal-cta equip" id="bo2-cta">${isEquipped ? "✓ Équipé — retirer" : "Équiper"}</button>`;
  } else if (canAfford) {
    cta = `<button class="bo2-modal-cta buy" id="bo2-cta">Acheter — ${item.cost_gemmes} ${volantImg(14)}</button>`;
    balanceLine = `<div class="bo2-modal-balance">Il te restera <strong>${afterBalance}</strong> volant${afterBalance <= 1 ? "" : "s"} après l'achat</div>`;
  } else {
    cta = `<button class="bo2-modal-cta locked" id="bo2-cta" disabled>${icon("lock", { size: 14 })} Pas assez de volants</button>`;
    balanceLine = `<div class="bo2-modal-balance" style="color:#f87171">Il te manque ${item.cost_gemmes - gemmes} volant${item.cost_gemmes - gemmes > 1 ? "s" : ""}</div>`;
  }

  const isLegendary = item.rarity === "legendaire";
  const haloRingClass = `bo2-halo-ring${isLegendary ? " legendary" : ""}`;

  const html = `
    <div class="bo2-modal" role="document">
      <div class="bo2-modal-handle" aria-hidden="true"></div>
      <div class="bo2-halo">
        <div class="${haloRingClass}" style="background:${r.c}12;${!isLegendary ? `box-shadow:0 0 30px ${r.c}33` : ""}">
          ${halo}
        </div>
      </div>
      <div class="bo2-modal-body">
        <div class="bo2-modal-pill" style="background:${r.c}" id="bo2-modal-title">${esc(r.label)}</div>
        <div class="bo2-modal-name">${esc(item.name)}</div>
        ${item.description ? `<div class="bo2-modal-desc">${esc(item.description)}</div>` : ""}
      </div>
      ${tryPreview}
      ${priceBlock}
      ${balanceLine}
      ${cta}
      <button class="bo2-modal-cancel" id="bo2-modal-cancel">Fermer</button>
    </div>`;

  const { overlay, close } = openBottomSheet({
    bgClass: "bo2-modal-bg",
    sheetSelector: ".bo2-modal",
    html,
    labelledBy: "bo2-modal-title",
    triggerEl,
  });
  track("boutique.detail_opened", { item_id: item.id });
  overlay.querySelector("#bo2-modal-cancel")?.addEventListener("click", close);

  const ctaBtn = overlay.querySelector("#bo2-cta");
  if (ctaBtn && !ctaBtn.disabled) {
    ctaBtn.addEventListener("click", async () => {
      if (item.owned) {
        // Équiper / retirer directement depuis le modal
        const eq = getEquipped();
        if (eq[item.type] === item.id) {
          unequipItem(item.type);
          setEquippedAsset(item.type, null);
          syncAvatarUrlToProfile(item.type, null);
          toast(`${esc(item.name)} retiré`, "info");
        } else {
          equipItem(item.type, item.id);
          setEquippedAsset(item.type, item.asset_url || null);
          syncAvatarUrlToProfile(item.type, item.asset_url || null);
          toast(`${esc(item.name)} équipé ✓`, "success");
        }
        overlay.remove();
        window.dispatchEvent(
          new CustomEvent("pg-equipped-changed", {
            detail: { slot: item.type, itemId: item.id },
          }),
        );
        return;
      }
      overlay.remove();
      await onConfirm();
    });
  }
}

// ─── Try-before-buy : contexte visuel par type (#5) ───────────
function _renderTryPreview(item, me) {
  if (!item.asset_url) return "";
  const pseudoEsc = esc(me?.display_name || me?.email?.split("@")[0] || "Toi");

  if (item.type === "avatar") {
    // Fausse ligne de classement avec le skin équipé
    return `
      <div class="bo2-try-preview">
        <div class="bo2-try-preview-title">Ton skin dans le classement</div>
        <div class="bo2-try-rank-row">
          <div class="bo2-try-rank-num">1</div>
          <div class="bo2-try-rank-avatar">
            <img src="${esc(item.asset_url)}" alt="" aria-hidden="true">
          </div>
          <div class="bo2-try-rank-name">${pseudoEsc}</div>
          <div class="bo2-try-rank-score">1 250 pts</div>
        </div>
      </div>`;
  }

  if (item.type === "permis_bg") {
    // Mini permis virtuel avec ce fond appliqué
    return `
      <div class="bo2-try-preview">
        <div class="bo2-try-preview-title">Aperçu sur ton permis virtuel</div>
        <div class="bo2-try-permis">
          <div class="bo2-try-permis-card">
            <img src="${esc(item.asset_url)}" alt="" aria-hidden="true">
            <div class="bo2-try-permis-badge">${pseudoEsc}</div>
          </div>
        </div>
      </div>`;
  }

  return "";
}

// ─── Execute purchase ─────────────────────────────────────────
async function doPurchase(item) {
  try {
    const { data, error } = await sb.rpc("purchase_item", {
      p_item_id: item.id,
    });
    if (error) {
      toast("Erreur lors de l'achat", "error");
      return null;
    }
    if (data?.error === "insufficient_gemmes") {
      toast("Pas assez de volants", "error");
      return null;
    }
    if (data?.error === "already_owned") {
      toast("Déjà dans ton inventaire", "info");
      return null;
    }
    if (data?.error) {
      toast("Achat impossible", "error");
      return null;
    }
    haptic("success");

    // Auto-équipement de l'item acheté
    try {
      equipItem(item.type, item.id);
      setEquippedAsset(item.type, item.asset_url || null);
      syncAvatarUrlToProfile(item.type, item.asset_url || null);
    } catch (eqErr) {
      console.warn("[boutique] auto-equip failed", eqErr);
    }

    track("boutique.item_purchased", {
      item_id: item.id,
      cost: item.cost_gemmes,
    });
    return data;
  } catch (e) {
    console.error("[boutique] purchase", e);
    toast("Erreur lors de l'achat", "error");
    return null;
  }
}
