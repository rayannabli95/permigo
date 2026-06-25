// ═══════════════════════════════════════════════════════════════
// Élève — Accueil. 3 questions, 3 secondes :
// 1. Où j'en suis ?        → hero + PERMIS VIRTUEL (dominant)
// 2. Que dois-je faire ?   → ACTION DU JOUR (1 seul CTA)
// 3. Mon objectif actuel ? → ligue + mondes + examen blanc
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { REMC } from "@/data/remc.js";
import {
  renderHeatmap,
  ensureHeatmapStyles,
} from "@/components/eleve/activity-heatmap.js";
import {
  maybeSoftRequestPush,
  maybeSendStreakRiskNotif,
} from "@/services/web-push.js";
import { icon } from "@/utils/icons.js";
import { volantImg } from "@/utils/volant.js";
import { ill, illMask } from "@/utils/illustrations.js";
import { ASSETS } from "@/utils/assets.js";
import { emotionalBanner } from "@/components/eleve/emotional-banner.js";
import { getMyChests } from "@/utils/game-state.js";
import { mountFeedbackFeed } from "@/components/eleve/feedback-feed.js";
import {
  mountDailyQuests,
  cleanQuestTitle,
} from "@/components/eleve/daily-quests.js";
import { toast } from "@/components/common/toast.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { startTour } from "@/components/common/guided-tour.js";
import { onPopupsSettled } from "@/utils/intro-overlays.js";
import { theoryLeague } from "@/utils/theory-league.js";
import { getDailyStreak } from "@/services/daily-quiz.js";
import { isStandalone } from "@/utils/pwa.js";
import { openInstallSheet } from "@/components/common/install-nudge.js";
import { CATALOG } from "@/data/achievements.js";

// Tour guidé élève — 1× à la première arrivée sur l'accueil (l'onboarding
// plein écran est déjà passé : main.js le monte AVANT cette page).
const TOUR_KEY = "pg-tour-eleve-v1";
const ELEVE_TOUR_STEPS = [
  {
    title: "Bienvenue 👋",
    text: "Visite express. Passe quand tu veux.",
  },
  {
    sel: "#streak-badge-btn",
    title: "Ta flamme 🔥",
    text: "Reviens chaque jour. Ta série monte et te rapporte des volants.",
  },
  {
    sel: "#action-cta-btn",
    title: "Par où commencer",
    text: "Un quiz par jour. C'est ici que ça démarre.",
  },
  {
    sel: '.bn-tab[data-id="parcours"]',
    title: "Ta carte du permis",
    text: "31 compétences à valider avec ton moniteur.",
  },
  {
    sel: '.bn-tab[data-id="boutique"]',
    title: "La boutique",
    text: "Dépense tes volants : skins de voiture, fonds de permis.",
  },
];

function maybeStartEleveTour() {
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
  } catch {
    return;
  }
  // Le tuto attend que le popup d'engagement (A2HS / rappels) soit fermé :
  // sinon il s'affiche dessous et le spotlight se mesure au mauvais endroit.
  onPopupsSettled(() => {
    setTimeout(() => {
      // Ancré sur le CTA king (toujours rendu) — présent quel que soit l'état
      // (premier run, question du jour, done...). Garanti en DOM avant ce timeout.
      if (!document.querySelector("#action-cta-btn")) return;
      track("eleve.tour.start");
      startTour(ELEVE_TOUR_STEPS, {
        onDone: () => {
          try {
            localStorage.setItem(TOUR_KEY, "1");
          } catch {
            /* stockage indispo */
          }
          track("eleve.tour.done");
        },
      });
    }, 600);
  });
}

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.acc2 {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 110px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

/* ════ ACCENT ACCUEIL — suit le token --a (l'accent choisi par l'élève) ════
   Défaut élève = violet (cf. main.js). Tout l'accueil + le chrome (header/nav,
   qui suivent --a) restent cohérents, et le picker de couleur recolore aussi
   l'accueil. Neutres via --su/--ink/--mu (theme-aware) → pas d'override dark. */
.acc2 {
  --acc-vio: var(--a);
  --acc-vio-dk: var(--adk);
  --acc-vio-lt: var(--a-lt);
  --acc-hero-bg: linear-gradient(150deg,
    color-mix(in srgb, var(--a) 13%, var(--su)) 0%,
    color-mix(in srgb, var(--a) 6%, var(--su)) 55%,
    var(--su) 100%);
  --acc-hero-border: color-mix(in srgb, var(--a) 24%, var(--su));
  --acc-hero-kicker: var(--a-txt);
  --acc-hero-ink: var(--ink);
  --acc-hero-mu: var(--mu);
  --acc-gold: #f7b32b;
  --acc-gold-dk: #e08e0b;
  --acc-hud-bg: var(--su);
  --acc-hud-border: var(--bo);
  --acc-cta-shadow: 0 6px 0 var(--adk), 0 14px 26px -6px color-mix(in srgb, var(--a) 42%, transparent);
}

/* ════════════════ HUD — rangée tout en haut ════════════════════ */
.acc2-hud {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 18px 0;
}
.acc2-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--acc-hud-bg);
  border: 1px solid var(--acc-hud-border);
  border-radius: 999px;
  padding: 6px 13px 6px 8px;
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.acc2-chip img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.acc2-chip.streak img {
  filter: drop-shadow(0 2px 4px rgba(255,120,0,.5));
  animation: hudFlameFlick 1.5s ease-in-out infinite;
  transform-origin: 50% 85%;
}
.acc2-chip.streak.inactive img {
  filter: grayscale(1) brightness(.72);
  animation: none;
}
.acc2-chip .num {
  font-variant-numeric: tabular-nums;
}
@keyframes hudFlameFlick {
  0%, 100% { transform: scale(1) rotate(0); }
  50%       { transform: scale(1.08, 1.12) rotate(-2deg); }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-chip.streak img { animation: none; }
}

/* ════════════════ HERO FOCAL v2 ════════════════════════════════ */
.acc2-hero-v2 {
  position: relative;
  background: var(--acc-hero-bg);
  border: 1px solid var(--acc-hero-border);
  border-radius: 28px;
  margin: 12px 16px 0;
  padding: 22px 20px 20px;
  overflow: visible;
  isolation: isolate;
  box-shadow:
    0 16px 40px -16px color-mix(in srgb, var(--a) 28%, transparent),
    0 2px 0 rgba(255,255,255,.7) inset;
  min-height: 196px;
}
.acc2-hero-halo {
  position: absolute;
  right: -12px;
  top: -16px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle,
    color-mix(in srgb, var(--a-lt) 60%, transparent),
    color-mix(in srgb, var(--a) 20%, transparent) 45%,
    transparent 70%);
  filter: blur(6px);
  z-index: 0;
  pointer-events: none;
}
.acc2-hero-v2-txt {
  position: relative;
  z-index: 2;
  max-width: 58%;
}
.acc2-hero-kicker {
  font: 800 12px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .06em;
  color: var(--acc-hero-kicker);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.acc2-hero-h1 {
  font: 700 30px/1.05 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.01em;
  color: var(--acc-hero-ink);
  margin: 0;
}
.acc2-hero-meta {
  margin-top: 9px;
  font: 700 12.5px/1.4 'Plus Jakarta Sans', sans-serif;
  color: var(--acc-hero-mu);
}
.acc2-hero-floor {
  position: absolute;
  right: 18px;
  bottom: 8px;
  width: 120px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(20,30,15,.26), transparent 70%);
  filter: blur(4px);
  z-index: 0;
  pointer-events: none;
  animation: heroFloorBreathe 4.5s ease-in-out infinite;
}
.acc2-hero-mascot {
  position: absolute;
  right: -14px;
  bottom: -4px;
  width: 188px;
  z-index: 1;
  filter:
    drop-shadow(0 3px 3px rgba(20,30,15,.18))
    drop-shadow(0 14px 20px rgba(20,30,15,.22));
  animation: heroFloatIdle 4.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes heroFloatIdle {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
@keyframes heroFloorBreathe {
  0%, 100% { transform: scale(1); opacity: .3; }
  50%       { transform: scale(.82); opacity: .18; }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-hero-mascot { animation: none; }
  .acc2-hero-floor  { animation: none; }
}

/* ════════════ CTA ROI — gros bouton violet 3D ══════════════════ */
.acc2-cta-king {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: calc(100% - 32px);
  margin: 14px 16px 0;
  border: none;
  border-radius: 20px;
  padding: 18px;
  font: 800 18px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  /* Dégradé MÊME TEINTE (reflet clair → accent → accent foncé) : on garde le
     relief plastique 3D sans virer de couleur. L'ancien --a-lt → --a faisait
     lavande-clair → bleu-violet → lecture « bicolore ». */
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--a) 88%, #fff) 0%,
    var(--a) 50%,
    var(--adk) 100%);
  box-shadow: var(--acc-cta-shadow);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform .09s, box-shadow .09s;
}
.acc2-cta-king:active {
  transform: translateY(5px);
  box-shadow: 0 1px 0 var(--acc-vio-dk), 0 6px 14px -6px color-mix(in srgb, var(--a) 30%, transparent);
}
.acc2-cta-king.muted {
  background: transparent;
  border: 1.5px solid var(--bo);
  color: var(--mu);
  box-shadow: none;
}
.acc2-cta-king.muted:active { box-shadow: none; transform: none; }
.acc2-cta-arr { font-size: 20px; }
@media (prefers-reduced-motion: reduce) {
  .acc2-cta-king { transition: none; }
}

/* ── Skeletons ── */
.skel2 {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: skel2Shim 1.4s ease-in-out infinite;
  border-radius: var(--r-xl);
}
@keyframes skel2Shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }


/* ═══════════ PERMIS VIRTUEL — l'élément dominant ═══════════════ */
.acc2-permis {
  margin: -52px 16px 0;
  position: relative;
  z-index: 2;
  animation: acc2PermisIn .55s .05s var(--ease-spring) both;
}
@keyframes acc2PermisIn {
  from { opacity: 0; transform: translateY(14px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ══════════ BLOC 2 — SÉANCE À CONFIRMER (si en attente) ════════ */
.acc2-ms {
  margin: 24px 16px 0;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  animation: acc2MsIn .55s .1s var(--ease-spring) both;
}
@keyframes acc2MsIn {
  from { opacity: 0; transform: translateY(14px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Session à confirmer (priorité) */
.acc2-ms-session {
  background: linear-gradient(145deg, var(--ink) 0%, var(--ink4) 50%, var(--ink) 100%);
  padding: 24px;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px -12px rgba(15,23,42,.5), 0 6px 16px rgba(10,13,26,.15);
}
.acc2-ms-session::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 90% 20%, color-mix(in srgb, var(--a) 25%, transparent) 0%, transparent 55%);
  pointer-events: none;
}
.acc2-ms-session-label {
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.5);
  margin-bottom: 12px;
  position: relative; z-index: 1;
}
.acc2-ms-session-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  position: relative; z-index: 1;
}
.acc2-ms-session-av {
  width: 48px; height: 48px;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--a) 30%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 40%, transparent);
  display: flex; align-items: center; justify-content: center;
  font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  flex-shrink: 0;
}
.acc2-ms-session-info { flex: 1; }
.acc2-ms-session-title {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -.02em;
  margin-bottom: 4px;
}
.acc2-ms-session-sub {
  font: 500 12.5px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.6);
}
.acc2-ms-session-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%;
  padding: 14px 20px;
  background: var(--acc-vio);
  border: none;
  border-radius: var(--r-lg);
  color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 52px;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring), opacity .12s;
  position: relative; z-index: 1;
}
.acc2-ms-session-btn:active { transform: scale(.96); opacity: .9; }


/* ═══════════════════════ BELOW FOLD ═══════════════════════════ */
/* Réserve la hauteur des ligues injectées en async : évite le layout-shift
   à chaque retour sur l'accueil. :empty → la réserve disparaît une fois
   le contenu monté (qui est toujours plus haut que cette valeur). */
#acc-lb-slot:empty { display: block; min-height: 156px; }

.acc2-section-title {
  font: 600 12px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin: 32px 20px 14px;
}


/* ── Tes ligues — 2 cartes premium (École + Révision) ── */
.acc-lg-head {
  font: 800 18px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.01em;
  color: var(--ink); margin: 28px 18px 4px;
  display: flex; align-items: center; gap: 10px;
}
.acc-lg-head::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--a) 22%, transparent), transparent);
}
/* Lève l'ambiguïté « faut-il cliquer ? » : on dit ce que c'est ET que ça s'ouvre. */
.acc-lg-lead {
  font: 600 12.5px/1.4 'Inter', sans-serif; color: var(--mu);
  margin: 0 18px 14px;
}
.acc-lg-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  padding: 0 16px; margin-bottom: 4px;
}

/* ── Carte de base — socle commun ── */
.acc-lg-card {
  display: flex; flex-direction: column; align-items: flex-start;
  text-align: left; min-height: 118px;
  padding: 15px 15px 13px; border-radius: var(--r-xl);
  cursor: pointer; position: relative; overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  transition: transform .18s var(--ease-spring, cubic-bezier(.34,1.56,.64,1)), box-shadow .18s ease, border-color .18s ease;
  font-family: 'Inter', sans-serif;
  animation: lgCardReveal .42s cubic-bezier(.34,1.56,.64,1) both;
}
.acc-lg-card:nth-child(2) { animation-delay: .07s; }

@keyframes lgCardReveal {
  from { opacity: 0; transform: translateY(10px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .acc-lg-card { animation: none; }
}

/* ── Inner highlight bord supérieur (::after) — fine ligne, pas de halo ── */
.acc-lg-card::after {
  content: ''; position: absolute; pointer-events: none;
  top: 0; left: 10%; right: 10%; height: 1px;
  border-radius: 0 0 50% 50%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--a-lt) 70%, transparent) 40%, color-mix(in srgb, var(--a-lt) 70%, transparent) 60%, transparent);
  opacity: .6;
}

/* ── Variante École ── */
.acc-lg-card[data-ligue="ecole"] {
  background: linear-gradient(158deg, color-mix(in srgb, var(--a) 10%, transparent) 0%, var(--su) 100%);
  border: 1.5px solid color-mix(in srgb, var(--a) 22%, transparent);
  box-shadow:
    0 2px 0 0 color-mix(in srgb, var(--a) 8%, transparent) inset,
    0 6px 18px -6px color-mix(in srgb, var(--a) 22%, transparent);
}
/* ── Variante Révision ── */
.acc-lg-card[data-ligue="revision"] {
  background: linear-gradient(142deg, color-mix(in srgb, var(--a) 8%, transparent) 0%, var(--su) 85%);
  border: 1.5px solid color-mix(in srgb, var(--a) 18%, transparent);
  box-shadow:
    0 2px 0 0 color-mix(in srgb, var(--a) 10%, transparent) inset,
    0 6px 22px -8px color-mix(in srgb, var(--a) 20%, transparent);
}

.acc-lg-card:active { transform: scale(.97); box-shadow: 0 2px 8px -4px color-mix(in srgb, var(--a) 18%, transparent) !important; }
.acc-lg-card:focus-visible { outline: 2px solid var(--acc-vio); outline-offset: 2px; }
@media (hover:hover) and (pointer:fine) {
  .acc-lg-card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--a) 40%, transparent) !important;
    box-shadow: 0 10px 26px -8px color-mix(in srgb, var(--a) 35%, transparent) !important;
  }
}

/* ── Tag label ── */
.acc-lg-tag {
  display: inline-flex; align-items: center; gap: 5px;
  font: 800 13px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.01em;
  color: var(--acc-vio);
  position: relative; z-index: 1;
  background: color-mix(in srgb, var(--a) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 18%, transparent);
  border-radius: 100px; padding: 5px 11px 5px 8px;
}

/* ── Le RANG — héros de la carte ── */
/* « Ta place » : micro-label qui donne du sens au gros numéro (sinon « #1 »
   tout seul ne dit pas que c'est ton classement). */
.acc-lg-kick {
  font: 800 10px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--mu); margin-top: 9px; position: relative; z-index: 1;
}
.acc-lg-rank {
  font: 800 40px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.04em; margin: 2px 0 0; position: relative; z-index: 1;
  color: var(--ink);              /* numéro UNI — fini le dégradé « bicolore » */
  font-variant-numeric: tabular-nums;
}
.acc-lg-rank.is-empty { color: var(--mu); }
/* Podium top-3 : seul le #1 passe en or (signal sobre, une seule couleur) */
.acc-lg-card[data-pos="1"] .acc-lg-rank { color: var(--acc-gold-dk); font-size: 46px; }
.acc-lg-card[data-pos="2"] .acc-lg-rank,
.acc-lg-card[data-pos="3"] .acc-lg-rank {
  font-size: 43px;
}

/* ── Footer : contexte + chevron ── */
.acc-lg-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  width: 100%; margin-top: auto; padding-top: 6px;
  position: relative; z-index: 1;
}
.acc-lg-sub {
  font: 600 12.5px/1.3 'Inter', sans-serif; color: var(--mu);
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* Pastille chevron violette pleine — affordance forte */
.acc-lg-go {
  flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--acc-vio); color: #fff;
  box-shadow: 0 4px 11px -3px color-mix(in srgb, var(--a) 55%, transparent);
  transition: transform .15s var(--ease-spring, cubic-bezier(.34,1.56,.64,1));
}
.acc-lg-card:active .acc-lg-go { transform: translateX(3px) scale(.94); }
@media (hover:hover) and (pointer:fine) {
  .acc-lg-card:hover .acc-lg-go { transform: translateX(3px); }
}
/* Indice de cliquabilité : petit aller-retour horizontal, joué 2× au montage.
   Activé seulement les 3 premières sessions via .acc2-afford-hint (cf. mount). */
@keyframes affordNudge {
  0%, 100% { transform: translateX(0); }
  40%      { transform: translateX(4px); }
  70%      { transform: translateX(0); }
}
.acc2-afford-hint .acc-lg-go { animation: affordNudge 1.9s var(--ease-spring) .9s 2; }
.acc2-afford-hint .pplus-arrow { animation: affordNudge 1.9s var(--ease-spring) 1.1s 2; }
@media (prefers-reduced-motion: reduce) {
  .acc-lg-go, .pplus-arrow { animation: none; }
}

/* ── Bottom sheet streak ── */
.bs-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0); z-index: 490;
  pointer-events: none; transition: background .3s;
  animation: none !important;
}
.bs-bg.open { background: rgba(0,0,0,.45); pointer-events: auto; backdrop-filter: blur(4px); }
.bs-streak {
  position: fixed; bottom: 0; left: 0; right: 0;
  z-index: 495; background: var(--su);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  overscroll-behavior: contain;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid var(--bo);
  transform: translateY(100%) !important;
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  max-height: 85dvh; overflow-y: auto;
  animation: none !important;
}
.bs-streak.open { transform: translateY(0) !important; }
.bs-handle { width: 36px; height: 4px; background: var(--bo); border-radius: 2px; margin: 14px auto 0; }
.bs-hd { padding: 16px 20px 14px; border-bottom: 1px solid var(--bo2); }
.bs-hd-title { font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.bs-hd-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 4px; }
.bs-hmap-wrap { padding: 16px 16px 8px; }
.bs-hmap-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.bs-hmap-title { font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.bs-hmap-sub { font: 500 11px/1 'Inter', sans-serif; color: var(--mu2); }
.bs-hmap-wrap .hmap { padding: 0; background: none; border: none; box-shadow: none; }
.bs-hmap-wrap .hmap-tap-info { margin-top: 10px; min-height: 20px; font: 600 11.5px/1 'Inter', sans-serif; color: var(--mu3); text-align: center; transition: opacity .15s; }
.bs-freeze-wrap { padding: 0 20px 8px; margin-top: 12px; }
.bs-freeze-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 20px;
  background: linear-gradient(135deg,#dbeafe,#e0f2fe);
  border: 1.5px solid #bfdbfe; border-radius: var(--r-lg);
  color: var(--blk2); font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; min-height: 52px;
  transition: transform .15s, opacity .15s;
}
.bs-freeze-btn:active { transform: scale(.98); opacity: .9; }
.bs-freeze-btn:disabled { opacity: .55; cursor: default; }
.bs-freeze-desc { font: 500 11px/1.4 'Inter', sans-serif; color: var(--mu3); text-align: center; margin-top: 7px; }

/* ── First-run dominant CTA ── */
.acc2-action--first-run {
  margin: 20px 16px 0;
  background: var(--su);
  border: 2px solid color-mix(in srgb, var(--a) 30%, transparent);
  border-radius: var(--rx);
  padding: 24px 20px 22px;
  box-shadow: 0 8px 28px -10px color-mix(in srgb, var(--a) 28%, transparent), 0 2px 6px rgba(10,13,26,.06);
}
.acc2-action--first-run .acc2-action-tag {
  font-size: 11px;
  color: var(--acc-vio);
}
.acc2-action--first-run .acc2-action-title {
  font-size: clamp(20px, 6vw, 24px);
  margin-bottom: 8px;
}
.acc2-action--first-run .acc2-action-sub {
  font-size: 14.5px;
  color: var(--mu);
  margin-bottom: 4px;
}
.acc2-action--first-run .acc2-action-btn {
  margin-top: 20px;
  padding: 18px 24px;
  font-size: 16px;
  min-height: 58px;
  letter-spacing: -.01em;
  box-shadow: 0 10px 28px -8px color-mix(in srgb, var(--a) 48%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .acc2-action--first-run .acc2-action-btn { transition: none; }
}

/* ── État vide : tiret muet dans le slot du rang ── */
.acc-lg-rank.is-empty {
  background: none;
  -webkit-text-fill-color: var(--mu);
  color: var(--mu);
  font-size: 40px; opacity: .7;
}

/* ── First-run progressive disclosure ── */
.acc2--first-run .acc2-section-title,
.acc2--first-run .worlds-grid,
.acc2--first-run .acc2-premium {
  opacity: 0.45;
  pointer-events: none;
  user-select: none;
}

/* ═══════════════ PERMIS COMPACT (carte maquette) ═══════════════ */
.acc2-permis-compact {
  display: flex; align-items: center; gap: 14px;
  background: var(--su); border: 1px solid var(--bo);
  border-radius: 22px; padding: 14px; margin: 14px 16px 0;
  text-decoration: none; cursor: pointer;
  box-shadow: 0 8px 22px -12px color-mix(in srgb, var(--a) 22%, transparent);
  transition: transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.acc2-permis-compact:active { transform: scale(.985); }
.acc2-permis-thumb {
  width: 62px; height: 62px; flex: none;
  display: grid; place-items: center; position: relative; isolation: isolate;
}
.acc2-permis-thumb::before {
  content: ""; position: absolute; inset: -6px; border-radius: 50%;
  background: radial-gradient(circle, rgba(247,179,43,.4), transparent 68%);
  filter: blur(3px); z-index: 0;
}
.acc2-permis-thumb img {
  width: 58px; height: 58px; object-fit: contain; position: relative; z-index: 1;
  filter: drop-shadow(0 2px 2px rgba(40,20,90,.22)) drop-shadow(0 8px 12px rgba(40,20,90,.18));
}
.acc2-permis-body { flex: 1; min-width: 0; }
.acc2-permis-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.acc2-permis-label2 {
  font: 800 15px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink);
}
.acc2-permis-val {
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--a-txt); font-variant-numeric: tabular-nums;
}
.acc2-permis-bar {
  height: 9px; border-radius: 999px; background: var(--bo);
  overflow: hidden; margin: 9px 0 6px;
}
.acc2-permis-fill {
  display: block; height: 100%; border-radius: 999px;
  background: var(--a);
  box-shadow: 0 0 10px color-mix(in srgb, var(--a) 55%, transparent);
  width: 0; transition: width .6s cubic-bezier(.34,1.56,.64,1);
}
.acc2-permis-sub {
  font: 700 11.5px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu);
}
@media (prefers-reduced-motion: reduce) {
  .acc2-permis-fill { transition: none; }
}

/* ═══════════════ PREMIUM (carte maquette) ══════════════════════ */
.acc2-premium {
  display: block; margin: 22px 16px 0;
  background: linear-gradient(180deg,#fffdf8,#fdf4e6);
  border: 1px solid #f6e6c4; border-radius: 24px;
  overflow: hidden; text-decoration: none;
  box-shadow: 0 14px 30px -14px rgba(224,142,11,.36);
  position: relative; transition: transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.acc2-premium:active { transform: scale(.985); }
.acc2-premium-media {
  position: relative; height: 130px; overflow: hidden;
}
.acc2-premium-media > img.acc2-pm-bg {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.acc2-premium-media::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 28%, rgba(18,6,0,.58));
}
.acc2-premium-shine {
  position: absolute; inset: 0; overflow: hidden; z-index: 2; pointer-events: none;
}
.acc2-premium-shine::after {
  content: ""; position: absolute; top: 0; left: -130%; width: 55%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,.5), transparent);
  transform: skewX(-20deg);
  animation: acc2PremiumShine 5s ease-in-out infinite;
}
@keyframes acc2PremiumShine {
  0%       { left: -130%; }
  55%, 100% { left: 140%; }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-premium-shine::after { animation: none; }
}
.acc2-premium-crown {
  position: absolute; top: 10px; right: 12px; width: 44px; z-index: 3;
  filter: drop-shadow(0 3px 6px rgba(120,70,0,.45));
  animation: acc2CrownFloat 4s ease-in-out infinite;
}
@keyframes acc2CrownFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-8px); }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-premium-crown { animation: none; }
}
.acc2-premium-tag {
  position: absolute; top: 14px; left: 13px; z-index: 3;
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(28,21,51,.55); backdrop-filter: blur(6px);
  color: #ffe9b8; font: 800 10.5px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: .08em; text-transform: uppercase;
  padding: 5px 10px; border-radius: 999px;
}
.acc2-premium-ttl {
  position: absolute; left: 14px; bottom: 11px; z-index: 3;
  color: #fff; font: 700 25px/1 'Fredoka', 'Plus Jakarta Sans', sans-serif;
  text-shadow: 0 2px 10px rgba(0,0,0,.55);
}
.acc2-premium-body {
  padding: 13px 15px 15px;
  display: flex; align-items: center; gap: 10px;
}
.acc2-premium-body p {
  flex: 1; font: 700 12.5px/1.45 'Plus Jakarta Sans', sans-serif; color: #8a6a3a; margin: 0;
}
.acc2-premium-go {
  flex: none; background: linear-gradient(180deg,#f8b62b,#ef9f12);
  color: #3a2606; font: 800 13px/1 'Plus Jakarta Sans', sans-serif;
  padding: 11px 15px; border-radius: 14px;
  box-shadow: 0 5px 0 var(--acc-gold-dk, #e08e0b);
  text-decoration: none;
}
.acc2-premium-links {
  display: flex; flex-direction: column; gap: 0;
  margin: 6px 16px 0;
}
.acc2-premium-link {
  display: flex; align-items: center; gap: 14px;
  padding: 17px 16px; background: var(--su);
  border: 1px solid var(--bo); text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.acc2-premium-link:first-child { border-radius: 18px 18px 0 0; border-bottom: none; }
.acc2-premium-link:last-child  { border-radius: 0 0 18px 18px; }
.acc2-premium-link:active { background: color-mix(in srgb, var(--a) 6%, transparent); }
.acc2-premium-link-ico {
  width: 46px; height: 46px; flex: none;
  background: color-mix(in srgb, var(--a) 10%, transparent); border-radius: 14px;
  display: grid; place-items: center;
}
.acc2-premium-link-ico img {
  width: 32px; height: 32px; object-fit: contain;
  filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--a) 25%, transparent));
}
.acc2-premium-link-txt { flex: 1; min-width: 0; }
.acc2-premium-link-t {
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  letter-spacing: -.01em;
}
.acc2-premium-link-s {
  font: 500 12.5px/1.35 'Inter', sans-serif; color: var(--mu); margin-top: 3px;
}
.acc2-premium-link-arr {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--acc-vio); color: #fff;
  box-shadow: 0 4px 10px -3px color-mix(in srgb, var(--a) 50%, transparent);
  font-size: 16px; font-weight: 800;
}

/* ═══════════════ COFFRE (style maquette) ════════════════════════ */
.acc2-chest-v2 {
  display: flex; align-items: center; gap: 13px;
  background: linear-gradient(120deg, var(--su), #fff7ec);
  border: 1px solid #f4e7cf; border-radius: 20px;
  padding: 11px 14px 11px 11px; margin: 14px 16px 0;
  text-decoration: none; cursor: pointer;
  box-shadow: 0 8px 22px -12px rgba(224,142,11,.3);
  position: relative; -webkit-tap-highlight-color: transparent;
  transition: transform .12s;
}
.acc2-chest-v2:active { transform: scale(.985); }
[data-theme="dark"] .acc2-chest-v2 {
  background: linear-gradient(120deg, var(--su), rgba(247,179,43,.07));
  border-color: rgba(247,179,43,.22);
}
.acc2-chest-v2 > img {
  width: 56px; height: 56px; object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(120,80,20,.28));
  animation: acc2ChestFloat 3.4s ease-in-out infinite;
}
@keyframes acc2ChestFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-7px); }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-chest-v2 > img { animation: none; }
}
.acc2-chest-v2-body { flex: 1; min-width: 0; }
.acc2-chest-v2-title {
  display: block; font: 800 14.5px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink);
}
.acc2-chest-v2-sub {
  font: 700 11.5px/1 'Plus Jakarta Sans', sans-serif; color: var(--mu); margin-top: 3px;
}
.acc2-chest-v2-arr {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #fde68a, #f7b32b 60%, #e08e0b);
  color: #3a2606; font-size: 17px; font-weight: 800;
  box-shadow: 0 4px 10px -3px rgba(224,142,11,.5);
}

/* ═══════════════ SECTION TITRE GÉNÉRIQUE ════════════════════════ */
.acc2-sec {
  margin-top: 22px; display: flex; align-items: baseline;
  justify-content: space-between; padding: 0 18px 10px;
}
.acc2-sec h2 {
  font: 800 16px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink);
}
.acc2-sec a {
  font: 700 12.5px/1 'Plus Jakarta Sans', sans-serif;
  /* --a-txt = accent assombri pour le texte (l'accent pur fait ~2:1 sur clair, échec AA) */
  color: var(--a-txt); text-decoration: none;
}

/* ═══════════════ BADGES TEASER ══════════════════════════════════ */
.acc2-badges {
  display: flex; gap: 9px;
  padding: 6px 18px 8px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.acc2-badges::-webkit-scrollbar { display: none; }
.acc2-badge-cell {
  width: 62px; height: 62px; flex: none;
  background: var(--su); border: 1px solid var(--bo);
  border-radius: 18px; display: grid; place-items: center;
  box-shadow: 0 6px 16px -8px rgba(80,50,160,.25);
  position: relative;
  scroll-snap-align: start;
  cursor: pointer; text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring), box-shadow .14s ease;
}
.acc2-badge-cell:active { transform: scale(.92); }
.acc2-badge-cell:focus-visible {
  outline: 2px solid var(--a); outline-offset: 2px;
}
@media (hover: hover) and (pointer: fine) {
  .acc2-badge-cell:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px -8px rgba(80,50,160,.4);
  }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-badge-cell { transition: none; }
  .acc2-badge-cell:active { transform: none; }
}
.acc2-badge-cell img {
  width: 46px; height: 46px; object-fit: contain;
  filter: drop-shadow(0 3px 5px rgba(40,20,90,.22));
}
.acc2-badge-cell.acc2-badge-new {
  border-color: var(--acc-vio-lt);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--a-lt) 32%, transparent), 0 8px 18px -7px color-mix(in srgb, var(--a) 48%, transparent);
}
.acc2-badge-cell.acc2-badge-new::after {
  content: ""; position: absolute; top: -3px; right: -3px;
  width: 12px; height: 12px; border-radius: 50%;
  background: #ff4d6d; border: 2.5px solid var(--su);
  box-shadow: 0 2px 5px rgba(255,77,109,.45);
}
.acc2-badge-cell.acc2-badge-locked img {
  filter: grayscale(1) brightness(.75) drop-shadow(0 3px 5px rgba(40,20,90,.14));
  opacity: .82;
}
.acc2-badge-cell.acc2-badge-locked::after {
  content: ""; position: absolute; inset: 0; border-radius: 18px;
  background: rgba(0,0,0,.08);
}

/* ── Tes devoirs (carte du moniteur — indigo, injectée si en attente) ── */
.acc2-devoirs {
  display: flex; align-items: center; gap: 12px;
  margin: 16px 16px 0; padding: 14px 15px; border-radius: 18px;
  text-decoration: none; color: #fff; position: relative; overflow: hidden;
  background: linear-gradient(135deg, #4f46e5 0%, #6d5ef0 55%, #7c4dff 100%);
  box-shadow: 0 14px 30px -16px rgba(79,70,229,.7), inset 0 1px 0 rgba(255,255,255,.18);
  -webkit-tap-highlight-color: transparent;
  animation: acc2DevoirsIn .4s var(--ease-out, ease) both;
}
@keyframes acc2DevoirsIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .acc2-devoirs { animation: none; } }
.acc2-devoirs:active { transform: scale(.99); }
.acc2-devoirs::before { content: ''; position: absolute; right: -30px; top: -42px; width: 158px; height: 158px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.16), transparent 70%); pointer-events: none; }
.acc2-devoirs-ico { width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(255,255,255,.18); position: relative; z-index: 1; }
.acc2-devoirs-txt { flex: 1; min-width: 0; position: relative; z-index: 1; }
.acc2-devoirs-t { font: 800 15px/1.15 'Baloo 2', 'Plus Jakarta Sans', sans-serif; }
.acc2-devoirs-s { font: 600 11.5px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.85); margin-top: 2px; }
.acc2-devoirs-badge { flex-shrink: 0; min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; background: #ffd24a; color: #1a1208; font: 800 13px/24px 'Inter', sans-serif; text-align: center; position: relative; z-index: 1; box-shadow: 0 0 10px rgba(255,210,74,.5); }
</style>`;

// ─── Constantes ──────────────────────────────────────────────────
const WORLD_IMAGES = [
  ASSETS.worldC1,
  ASSETS.worldC2,
  ASSETS.worldC3,
  ASSETS.worldC4,
];
const WORLDS = REMC.map((cat, i) => ({
  id: cat.id,
  ico: cat.ico,
  image: WORLD_IMAGES[i] || null,
  name: cat.name,
  subs: cat.subs,
  total: cat.subs.length,
  // Une seule couleur (le thème) : la couleur guide l'attention, elle ne décore pas.
  color: "var(--adk)",
}));

// L'examen blanc s'ouvre quand le monde 3 devient accessible
// (même règle que le parcours : 6 compétences du monde 2 acquises).
const EXAM_UNLOCK_WORLD2_DONE = 6;

// Jours d'absence depuis la visite précédente (calculé au mount, lu au render)
let _awayDays = 0;

// Salutation contextuelle. Revisite dans la même journée → message chaleureux.
const LS_LAST_VISIT = "pg-last-visit";
function _greeting(awayDays) {
  if (awayDays >= 3) return "Content de te revoir,";
  let revisitToday = false;
  let hasPriorVisit = false;
  try {
    const today = new Date().toDateString();
    const last = localStorage.getItem(LS_LAST_VISIT);
    revisitToday = last === today;
    hasPriorVisit = !!last && last !== today; // déjà venu un autre jour → retour
    localStorage.setItem(LS_LAST_VISIT, today);
  } catch {
    /* ignore */
  }
  if (revisitToday) return "Ça fait plaisir de te revoir aujourd'hui,";
  if (hasPriorVisit) return "Rebonjour"; // l'élève revient un nouveau jour
  const h = new Date().getHours();
  if (h >= 18 || h < 5) return "Bonsoir";
  return "Bonjour";
}

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "eleve_accueil" });

  // Welcome-back : jours écoulés depuis la visite précédente (localStorage,
  // plus fiable que last_active_at qui est touché par trigger à l'ouverture).
  let awayDays = 0;
  try {
    const prev = parseInt(
      localStorage.getItem("permigo-last-visit") || "0",
      10,
    );
    if (prev) awayDays = Math.floor((Date.now() - prev) / 86_400_000);
    localStorage.setItem("permigo-last-visit", String(Date.now()));
  } catch {
    /* localStorage indisponible → pas de welcome-back, pas grave */
  }
  _awayDays = awayDays;
  if (awayDays >= 3) track("eleve.welcome_back", { awayDays });

  root.innerHTML = SKELETON;

  try {
    // Core fetches en parallèle
    const [profileRes, streakRes, validRes, notifRes, attemptsRes] =
      await Promise.allSettled([
        sb
          .from("profiles")
          .select(
            "prenom, nom, created_at, last_active_at, first_value_action_at, gemmes",
          )
          .eq("id", me.id)
          .maybeSingle(),
        sb
          .from("streaks")
          .select("current_streak, last_activity_date, longest_streak")
          .eq("user_id", me.id)
          .maybeSingle(),
        sb
          .from("validations")
          .select("competence_id, statut")
          .eq("eleve_id", me.id)
          .in("statut", ["acquis", "a_valider"]),
        sb
          .from("notifications")
          .select("id, data, type")
          .eq("user_id", me.id)
          .eq("read", false)
          .in("type", ["consolidation_quiz", "post_validation_quiz"])
          .order("created_at", { ascending: false })
          .limit(1),
        sb
          .from("quiz_attempts")
          .select("completed_at")
          .eq("user_id", me.id)
          .gte(
            "completed_at",
            new Date(Date.now() - 35 * 86400000).toISOString(),
          )
          .order("completed_at", { ascending: true }),
      ]);

    // RPCs optionnels (peuvent ne pas exister encore)
    const [pendingSessionsRes, todayQuestsRes, achievementsRes] =
      await Promise.allSettled([
        sb.rpc("get_pending_sessions_eleve"),
        sb.rpc("get_today_quests"),
        sb.rpc("get_my_achievements"),
      ]);

    const profile = profileRes.value?.data || {
      prenom: me.prenom || "Toi",
    };
    const rawStreak = streakRes.value?.data || {
      current_streak: 0,
      last_activity_date: null,
      longest_streak: 0,
    };
    // get_today_quests (called above) bumps the streak server-side on first visit
    // of the day. Reflect that immediately in the UI without an extra round-trip.
    const _todayStr = new Date().toISOString().slice(0, 10);
    const _questsOk =
      todayQuestsRes.status === "fulfilled" && !todayQuestsRes.value?.error;
    let streak = rawStreak;
    if (_questsOk && rawStreak.last_activity_date !== _todayStr) {
      const _yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
      const _bumped =
        rawStreak.last_activity_date === _yesterday
          ? (rawStreak.current_streak || 0) + 1
          : 1;
      streak = {
        current_streak: _bumped,
        longest_streak: Math.max(rawStreak.longest_streak || 0, _bumped),
        last_activity_date: _todayStr,
      };
    }
    const allValRows = validRes.value?.data || [];
    const validated = new Set(
      allValRows
        .filter((v) => v.statut === "acquis")
        .map((v) => v.competence_id),
    );
    const pendingNotif = notifRes.value?.data?.[0] || null;
    const activityDays = buildActivityData(
      attemptsRes.value?.data || [],
      streak,
    );
    const pendingSessions = pendingSessionsRes.value?.data || [];
    // quest_validate_1 (« Valider 1 compétence ») retirée de l'affichage :
    // l'élève ne valide JAMAIS lui-même (c'est le moniteur). Quête « morte »
    // qu'il ne peut pas accomplir → masquée en attendant sa version reformulée
    // (« Sois prêt pour ta prochaine compétence », branchée sur les fiches de
    // révision, avec une vraie condition côté élève) qui doit la remplacer.
    const todayQuests = (todayQuestsRes.value?.data || []).filter(
      (q) => q.quest_id !== "quest_validate_1",
    );
    if (todayQuestsRes.status === "rejected" || todayQuestsRes.value?.error) {
      console.error(
        "[accueil] get_today_quests:",
        todayQuestsRes.reason ?? todayQuestsRes.value?.error,
      );
    }

    ensureHeatmapStyles();

    const worlds = computeWorlds(validated);
    const streakSt = streakStatus(streak);
    const gemmes = profile.gemmes || 0;

    // Question du jour — la boucle solo quotidienne (plan rétention).
    // Découverte (monde 1) tant que rien n'est acquis, sinon consolidation
    // de l'acquise la moins récemment quizzée.
    let dailyQuiz = null;
    try {
      const { isDailyDone, pickDailyQuiz } =
        await import("@/services/daily-quiz.js");
      const done = isDailyDone();
      const pick = done ? null : await pickDailyQuiz(me.id, [...validated]);
      dailyQuiz = { done, ...(pick || {}) };
    } catch {
      /* service indisponible → l'action du jour retombe sur le parcours */
    }

    // Série quotidienne (streak question du jour) — best-effort localStorage.
    // Indépendant du streak serveur (streaks table), purement local.
    const dailyStreakCount = getDailyStreak();

    // Trophées réels pour le rail « Tes badges » (plus de badges en dur qui
    // mentent). RPC optionnelle → [] si indispo (rail = teaser à viser).
    const achievements = achievementsRes.value?.data || [];

    track("streak.viewed", { days: streak.current_streak, status: streakSt });

    root.innerHTML = render({
      me,
      profile,
      streak,
      streakSt,
      worlds,
      activityDays,
      gemmes,
      pendingSessions,
      todayQuests,
      pendingNotif,
      dailyQuiz,
      dailyStreakCount,
      achievements,
    });
    wire(root, {
      streak,
      streakSt,
      gemmes,
      activityDays,
      pendingSessions,
      todayQuests,
      pendingNotif,
    });

    const accDiv = root.querySelector(".acc2");

    // Indice de cliquabilité : on fait « clignoter » une fois les pastilles
    // « va voir » (ligues + PermiGo+) pour signaler qu'on tape dessus — mais
    // seulement les 3 premières sessions, sinon ça devient du bruit pour les
    // habitués (l'app est un rituel quotidien).
    try {
      const seen = +(localStorage.getItem("pg-afford-hint") || 0);
      if (seen < 3) {
        accDiv?.classList.add("acc2-afford-hint");
        localStorage.setItem("pg-afford-hint", String(seen + 1));
      }
    } catch {
      /* localStorage indispo : pas grave, on n'affiche juste pas l'indice */
    }

    // Composants non-bloquants injectés sous le fold
    if (accDiv) {
      // Quêtes du jour — carrousel réclamable, juste sous le CTA king
      const anchorEl = accDiv.querySelector("#acc-action-anchor");
      if (anchorEl) {
        const dqHost = document.createElement("div");
        dqHost.style.cssText = "margin:16px 16px 0";
        anchorEl.insertAdjacentElement("afterend", dqHost);
        Promise.resolve()
          .then(() =>
            mountDailyQuests(dqHost, { prefetchedQuests: todayQuests }),
          )
          .catch(() => {});
      }
      // Remonté AU-DESSUS de la section premium : les retours du moniteur sont la preuve
      // d'autorité de l'élève, ils ne doivent pas finir tout en bas de page.
      Promise.resolve()
        .then(() =>
          mountFeedbackFeed(accDiv, {
            eleveId: me.id,
            limit: 5,
            anchorEl: accDiv.querySelector(".acc2-premium"),
          }),
        )
        .catch(() => {});
    }

    // Leaderboard async
    _loadAndInjectLeagues(root);

    // Bannière émotionnelle — insérée juste après le hero v2
    emotionalBanner
      .checkAndRender(root, { afterSelector: ".acc2-hero-v2" })
      .catch(() => {});

    // Quiz éclair actif poussé par le moniteur — bandeau prioritaire
    _loadAndInjectFlashQuiz(root, me).catch(() => {});

    // Coffres disponibles — teaser non-bloquant injecté sous l'action du jour
    _loadAndInjectChests(root);
    Promise.resolve()
      .then(() => _loadAndInjectDevoirs(root, me))
      .catch(() => {});

    // Onboarding premier login : géré en amont par main.js (page plein écran
    // pages/onboarding/index.js, gate first_value_action_at). Rien à faire ici.

    // Push web (soft, après 5s)
    if (profile.first_value_action_at) {
      maybeSoftRequestPush();
      maybeSendStreakRiskNotif();
    }

    // Tour guidé première arrivée (après le wiring, ancres en place)
    maybeStartEleveTour();
  } catch (e) {
    console.error("[accueil] mount failed", e);
    root.innerHTML = `<div style="padding:60px 24px;text-align:center;color:var(--mu3);font-family:'Inter',sans-serif">
      <div style="font:800 18px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:8px">Oups, ton accueil a du mal à charger</div>
      <p style="font-size:14px;margin:0 0 20px">Vérifie ta connexion et réessaie.</p>
      <button id="acc-reload" style="padding:12px 24px;border:0;background:var(--a);color: var(--a-ink);border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer">Recharger</button>
    </div>`;
    root
      .querySelector("#acc-reload")
      ?.addEventListener("click", () => location.reload());
  }
}

// ─── Logique métier ───────────────────────────────────────────────
function computeWorlds(validatedIds) {
  return WORLDS.map((w) => {
    const done = w.subs.filter((s) => validatedIds.has(s.c)).length;
    const pct = w.total > 0 ? Math.round((done / w.total) * 100) : 0;
    return { ...w, done, pct, complete: w.total > 0 && done === w.total };
  });
}

function streakStatus(streak) {
  if (!streak.current_streak) return "broken";
  const today = new Date().toISOString().slice(0, 10);
  if (streak.last_activity_date === today) return "saved";
  const hoursLeft = 24 - new Date().getHours() - new Date().getMinutes() / 60;
  return hoursLeft < 6 ? "critical" : "at_risk";
}

// ─── Rail « Tes badges » ──────────────────────────────────────────
// Aperçu interactif des VRAIS trophées de l'élève (plus de badges en dur) :
// jusqu'à 4 débloqués les plus récents + le prochain à viser (verrouillé).
// Chaque vignette est un lien profond #/trophees/{key} → ouvre le détail.
function renderBadgesRail(achievements = []) {
  const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
  // Set des trophées déjà vus (partagé avec trophees.js / nav-bottom).
  let seen = new Set();
  try {
    seen = new Set(JSON.parse(localStorage.getItem("pg-troph-seen") || "[]"));
  } catch {
    /* localStorage indispo → tous neufs, pas grave */
  }

  // Débloqués, du plus récent au plus ancien, mappés sur le catalogue.
  const recent = achievements
    .slice()
    .sort(
      (a, b) =>
        new Date(b.unlocked_at || 0).getTime() -
        new Date(a.unlocked_at || 0).getTime(),
    )
    .map((a) => CATALOG.find((t) => t.key === a.achievement_key))
    .filter(Boolean)
    .slice(0, 4);

  // Prochain(s) à viser = premiers du catalogue non débloqués (complète à 5).
  const locked = CATALOG.filter((t) => !unlockedKeys.has(t.key));
  const nextLocked = locked.slice(0, Math.max(1, 5 - recent.length));

  const cells = [];
  for (const t of recent) {
    const isNew = !seen.has(t.key);
    cells.push(`
      <a class="acc2-badge-cell${isNew ? " acc2-badge-new" : ""}" role="listitem"
         href="#/trophees/${esc(t.key)}"
         aria-label="Trophée ${esc(t.title)}${isNew ? ", nouveau" : ""}">
        <img src="${esc(t.image || "")}" alt="" loading="lazy">
      </a>`);
  }
  for (const t of nextLocked) {
    cells.push(`
      <a class="acc2-badge-cell acc2-badge-locked" role="listitem"
         href="#/trophees/${esc(t.key)}"
         aria-label="Trophée à débloquer : ${esc(t.title)}">
        <img src="${esc(t.image || "")}" alt="" loading="lazy">
      </a>`);
  }
  return cells.join("");
}

// ─── Render ───────────────────────────────────────────────────────
function render({
  me,
  profile,
  streak,
  streakSt,
  worlds,
  activityDays,
  gemmes,
  pendingSessions,
  todayQuests,
  pendingNotif,
  dailyQuiz,
  dailyStreakCount = 0,
  achievements = [],
}) {
  const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
  const prenom = profile.prenom || me.prenom || "Toi";

  // Bandeau d'installation — visible TANT QUE l'app n'est pas installée
  // (sur iPhone, installer = la seule façon d'avoir les notifs). Il disparaît
  // tout seul une fois installée (isStandalone) : pas un popup qu'on oublie.
  const installBanner = !isStandalone()
    ? `<style>
    .acc-install{display:flex;align-items:center;gap:10px;margin:0 16px 12px;padding:10px 12px;border-radius:14px;background:color-mix(in srgb, var(--a) 7%, transparent);border:1px solid color-mix(in srgb, var(--a) 22%, transparent);box-shadow:0 3px 10px -4px color-mix(in srgb, var(--a) 20%, transparent)}
    .acc-install-ico{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--a) 14%, transparent);color:var(--acc-vio)}
    .acc-install-txt{min-width:0;flex:1}
    .acc-install-t{font:700 13px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink)}
    .acc-install-s{font:500 11px/1.3 'Inter',sans-serif;color:var(--mu);margin-top:2px}
    .acc-install-btn{flex:0 0 auto;min-height:36px;padding:0 14px;border:0;border-radius:10px;background:linear-gradient(180deg,var(--acc-vio-lt),var(--acc-vio));color:#fff;font:700 12px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;box-shadow:0 3px 8px -2px color-mix(in srgb, var(--a) 45%, transparent)}
    .acc-install-btn:active{transform:scale(.96)}
    </style>
    <div class="acc-install" id="acc-install">
      <div class="acc-install-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></div>
      <div class="acc-install-txt">
        <div class="acc-install-t">Installe PermiGo sur ton téléphone</div>
        <div class="acc-install-s">Accès direct + tes rappels — 10 secondes.</div>
      </div>
      <button class="acc-install-btn" id="acc-install-btn" type="button">Installer</button>
    </div>`
    : "";
  const isActive = streakSt !== "broken";
  // First-run: no competence validated AND no streak yet → student has never done anything
  const isFirstRun = totalValidated === 0 && !streak.current_streak;

  // ── Séance à confirmer (priorité absolue quand présente) ──
  const pendingSession = pendingSessions?.[0] ?? null;

  // Examen blanc : s'ouvre quand le monde 3 devient accessible.
  // (conservé pour usage futur — actuellement non affiché dans l'accueil)
  // const examUnlocked = (worlds[1]?.done ?? 0) >= EXAM_UNLOCK_WORLD2_DONE;

  // ── Hero v2 : kicker / titre / méta selon l'état de l'action du jour ──
  // On réutilise la même logique que renderActionDuJour mais pour alimenter
  // le hero focal. Le CTA king prend l'id action-cta-btn pour que wire()
  // le câble sans modification (même data-href, même listener).
  let _heroKicker = "Ta question du jour";
  let _heroTitle = "Prêt à réviser ?";
  let _heroMeta = "3 questions · ~2 min · sur ta dernière leçon";
  let _heroCta = "C'est parti";
  let _heroHref = "#/quiz/next/post_validation/revision";
  let _heroDone = false;

  const _pendingQuestForHero = !pendingNotif
    ? (todayQuests.find(
        (q) => !q.completed && !q.claimed && q.quest_id !== "quest_login",
      ) ?? null)
    : null;

  if (_pendingQuestForHero) {
    const _qn = _normalizeQuest(_pendingQuestForHero);
    _heroKicker = "Quête du jour";
    _heroTitle = _qn.label ?? "Quête du jour";
    _heroMeta = _qn.sub ?? "";
    _heroCta = _qn.btnText ?? "Commencer";
    _heroHref = _qn.href ?? "#/parcours";
  } else if (pendingNotif?.data?.competence_id) {
    const _isCons = pendingNotif.type === "consolidation_quiz";
    _heroKicker = _isCons ? "Quiz de consolidation" : "Quiz-récap";
    _heroTitle = _isCons
      ? "Consolide ce que tu viens d'acquérir"
      : "Récap sur ta compétence";
    _heroMeta = _isCons ? "2 questions · 30 sec" : "3 questions · optionnel";
    _heroCta = _isCons ? "Commencer" : "Faire le récap";
    _heroHref = `#/quiz/${pendingNotif.data.competence_id}/${_isCons ? "consolidation" : "post_validation"}`;
  } else if (dailyQuiz && !dailyQuiz.done && dailyQuiz.competenceId) {
    _heroKicker = "Ta question du jour";
    if (_awayDays >= 3) {
      _heroTitle = "Reprends en douceur";
      _heroMeta = "1 question pour te remettre dedans · ~2 min";
    } else if (dailyQuiz.mode === "decouverte") {
      _heroTitle = "Découvre une compétence";
      _heroMeta = "3 questions · 2 min · sur ta prochaine leçon";
    } else {
      _heroTitle = "Prêt à réviser ?";
      _heroMeta = "3 questions · 2 min · sur ta dernière leçon";
    }
    _heroCta = "C'est parti";
    _heroHref = `#/quiz/${dailyQuiz.competenceId}/post_validation/daily`;
  } else if (dailyQuiz?.done) {
    _heroDone = true;
    _heroKicker = "Question du jour";
    _heroTitle = "Fait pour aujourd'hui !";
    _heroMeta = "Reviens demain pour ta prochaine question.";
    _heroCta = "Continue à réviser";
    _heroHref = "#/quiz/next/post_validation/revision";
  } else if (totalValidated === 0) {
    _heroKicker = "Par où commencer ?";
    _heroTitle = "Lance ta première révision";
    _heroMeta = "2 min suffisent pour démarrer.";
    _heroCta = "C'est parti — 2 min";
    _heroHref = "#/quiz/next/post_validation/revision";
  } else {
    _heroTitle = "Continue ton parcours";
    _heroMeta = "Une révision de plus, chaque jour compte.";
    _heroCta = "Continue à réviser";
    _heroHref = "#/quiz/next/post_validation/revision";
  }

  return `${STYLE}
<div class="acc2${isFirstRun ? " acc2--first-run" : ""}">
  ${installBanner}

  <!-- ══ HUD — série ══ (le solde de volants vit dans le header global) -->
  <div class="acc2-hud">
    <button class="acc2-chip streak${isActive ? "" : " inactive"}" id="streak-badge-btn"
            type="button" aria-label="Série ${streak.current_streak} jours, voir le détail">
      <img src="/skins/permigo-streak-flame-v1.webp" alt="" aria-hidden="true">
      <span class="num">${streak.current_streak}</span>
    </button>
  </div>

  <!-- ══ HERO FOCAL v2 — question du jour ══ -->
  <section class="acc2-hero-v2" aria-label="${esc(_heroKicker)}">
    <div class="acc2-hero-halo" aria-hidden="true"></div>
    <div class="acc2-hero-v2-txt">
      <p class="acc2-hero-kicker">${esc(_heroKicker)}</p>
      <h1 class="acc2-hero-h1">${esc(_heroTitle)}</h1>
      ${_heroMeta ? `<p class="acc2-hero-meta">${esc(_heroMeta)}</p>` : ""}
    </div>
    <div class="acc2-hero-floor" aria-hidden="true"></div>
    <img class="acc2-hero-mascot" src="/skins/mascot-point.png" alt="" aria-hidden="true" loading="eager">
  </section>

  <!-- ══ CTA ROI — le seul bouton à presser ══ -->
  <button class="acc2-cta-king${_heroDone ? " muted" : ""}"
          id="action-cta-btn" type="button" data-href="${esc(_heroHref)}">
    ${esc(_heroCta)} <span class="acc2-cta-arr" aria-hidden="true">→</span>
  </button>

  <!-- Ancre pour les quêtes du jour (mountDailyQuests) -->
  <div id="acc-action-anchor"></div>

  <!-- ══ PERMIS VIRTUEL — carte compacte maquette ══ -->
  <div class="acc2-permis-compact" id="acc-permis" role="button" tabindex="0"
       aria-label="Ton permis virtuel — ${totalValidated} sur 31 compétences">
    <div class="acc2-permis-thumb">
      <img src="/skins/trophy-permis-virtuel.webp" alt="" aria-hidden="true" loading="eager">
    </div>
    <div class="acc2-permis-body">
      <div class="acc2-permis-row">
        <span class="acc2-permis-label2">Ton permis virtuel</span>
        <span class="acc2-permis-val">${totalValidated}/31</span>
      </div>
      <div class="acc2-permis-bar">
        <span class="acc2-permis-fill" data-target="${Math.round((totalValidated / 31) * 100)}"></span>
      </div>
      <span class="acc2-permis-sub">${
        totalValidated === 0
          ? "Chaque compétence validée par ton moniteur la complète."
          : totalValidated >= 31
            ? "Toutes les compétences acquises — bravo !"
            : `Plus que ${31 - totalValidated} compétence${31 - totalValidated > 1 ? "s" : ""} avant le grand jour`
      }</span>
    </div>
  </div>

  ${pendingSession ? `<div class="acc2-ms">${renderSessionConfirm(pendingSession)}</div>` : ""}

  <!-- Tes ligues : École (REMC) + Révision (quiz solo), à égalité -->
  <div id="acc-lb-slot"></div>

  <!-- ══ BELOW FOLD ══ -->

  <!-- ══ Carte premium Examen blanc en vedette (sans en-tête de section) ══ -->

  <!-- Carte Examen blanc en vedette -->
  <a class="acc2-premium" id="acc-exam-conduite" href="#/exam-conduite"
     aria-label="Examen blanc PermiGo+">
    <div class="acc2-premium-media">
      <img class="acc2-pm-bg" src="/skins/landing/monde2jour.webp" alt="" loading="lazy">
      <span class="acc2-premium-tag">PermiGo+</span>
      <img class="acc2-premium-crown" src="/skins/couronne.png" alt="" aria-hidden="true" loading="lazy">
      <span class="acc2-premium-ttl">Examen blanc</span>
      <div class="acc2-premium-shine" aria-hidden="true"></div>
    </div>
    <div class="acc2-premium-body">
      <p>Teste-toi en conditions réelles, comme le jour&nbsp;J.</p>
      <span class="acc2-premium-go">Découvrir</span>
    </div>
  </a>

  <!-- Tes devoirs du moniteur (injecté async par _loadAndInjectDevoirs si en attente) -->
  <div id="acc-devoirs-slot"></div>

  <!-- Deux entrées slim violettes -->
  <div class="acc2-premium-links">
    <a class="acc2-premium-link" id="acc-revision" href="#/revision-conduite"
       aria-label="Révision conduite">
      <div class="acc2-premium-link-ico">
        <img src="/skins/badge-3d-02.webp" alt="" aria-hidden="true" loading="lazy">
      </div>
      <div class="acc2-premium-link-txt">
        <div class="acc2-premium-link-t">Révision conduite</div>
        <div class="acc2-premium-link-s">Le geste, pas le code — entre tes leçons</div>
      </div>
      <span class="acc2-premium-link-arr" aria-hidden="true">›</span>
    </a>
    <a class="acc2-premium-link" id="acc-centre" href="#/centre-examen"
       aria-label="Ton centre d'examen">
      <div class="acc2-premium-link-ico">
        <img src="/skins/badge-3d-06.webp" alt="" aria-hidden="true" loading="lazy">
      </div>
      <div class="acc2-premium-link-txt">
        <div class="acc2-premium-link-t">Ton centre d'examen</div>
        <div class="acc2-premium-link-s">Pièges &amp; conseils sur ton centre</div>
      </div>
      <span class="acc2-premium-link-arr" aria-hidden="true">›</span>
    </a>
  </div>

  <!-- Slot coffre (injecté async par _loadAndInjectChests) -->
  <div id="acc-chest-slot"></div>

  <!-- ══ TES BADGES — teaser vers la page trophées ══ -->
  <div class="acc2-sec">
    <h2>Tes badges</h2>
    <a href="#/trophees" id="acc-badges-voir-tout">Voir tout</a>
  </div>
  <div class="acc2-badges" role="list" aria-label="Aperçu de tes trophées">
    ${renderBadgesRail(achievements)}
  </div>

</div>

<!-- STREAK BOTTOM SHEET -->
<div class="bs-bg" id="bs-bg"></div>
<div class="bs-streak" id="bs-streak" role="dialog" aria-label="Détail série">
  <div class="bs-handle"></div>
  <div class="bs-hd">
    <div class="bs-hd-title">Série d'apprentissage</div>
    <div class="bs-hd-sub">Record : ${streak.longest_streak} jour${streak.longest_streak > 1 ? "s" : ""} · En cours : ${streak.current_streak}</div>
  </div>
  <div class="bs-hmap-wrap">
    <div class="bs-hmap-head">
      <span class="bs-hmap-title">Mon mois</span>
      <span class="bs-hmap-sub">${activityDays.totalActive} jour${activityDays.totalActive > 1 ? "s" : ""} actif${activityDays.totalActive > 1 ? "s" : ""}</span>
    </div>
    ${renderHeatmap({ activeDates: activityDays.activeDates, activityLevels: activityDays.levels, activityDetails: activityDays.details, weeks: 5, title: "" })}
    <div class="hmap-tap-info" id="hmap-info" style="opacity:0"> </div>
  </div>
  ${
    (streakSt === "critical" || streakSt === "at_risk") && gemmes >= 50
      ? `
  <div class="bs-freeze-wrap">
    <button class="bs-freeze-btn" id="bs-freeze-btn">Geler ma série · 50 ${volantImg(16)}</button>
    <div class="bs-freeze-desc">Protège ta série pour les prochaines 24h</div>
  </div>`
      : ""
  }
</div>`;
}

// ─── Bloc 2 renderers ────────────────────────────────────────────

function renderSessionConfirm(session) {
  const prenom = session.moniteur_prenom ?? "Ton moniteur";
  const initials = prenom.slice(0, 2).toUpperCase();
  const dateStr = session.session_date
    ? new Date(session.session_date).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "long",
      })
    : "Récemment";
  const durStr = session.duration_minutes
    ? `${session.duration_minutes} min`
    : "";
  const sub = [dateStr, durStr].filter(Boolean).join(" · ");

  return `
    <div class="acc2-ms-session">
      <div class="acc2-ms-session-label">Séance à confirmer</div>
      <div class="acc2-ms-session-top">
        <div class="acc2-ms-session-av">${esc(initials)}</div>
        <div class="acc2-ms-session-info">
          <div class="acc2-ms-session-title">${esc(prenom)} a enregistré une séance</div>
          <div class="acc2-ms-session-sub">${esc(sub)}</div>
        </div>
      </div>
      <button class="acc2-ms-session-btn" id="confirm-session-btn" data-session-id="${esc(session.id)}">
        ${icon("check", { size: 16, strokeWidth: 2.8 })}
        Confirmer la séance
      </button>
    </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(
  root,
  {
    streak,
    streakSt,
    gemmes,
    activityDays,
    pendingSessions,
    todayQuests,
    pendingNotif,
  },
) {
  // Bandeau « Installe l'app » (présent tant que pas installé) → ouvre la sheet
  const installBtn = root.querySelector("#acc-install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", () => {
      haptic("tap");
      try {
        track("install.home_banner_click");
      } catch {
        /* best-effort */
      }
      openInstallSheet(getCurUser());
    });
  }

  // Permis virtuel compact : barre animée + tap → parcours
  const permisFill = root.querySelector(".acc2-permis-fill[data-target]");
  if (permisFill)
    setTimeout(() => {
      permisFill.style.width = permisFill.dataset.target + "%";
    }, 150);
  const permisCard = root.querySelector("#acc-permis");
  if (permisCard) {
    const openParcours = () => {
      haptic("tap");
      track("cta.clicked", { cta_type: "permis_card" });
      navigate("#/parcours");
    };
    permisCard.addEventListener("click", openParcours);
    permisCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openParcours();
      }
    });
  }

  // Examen blanc — tuile <a href>, tracking au clic
  root.querySelector("#acc-exam-conduite")?.addEventListener("click", () => {
    haptic("tap");
    track("cta.clicked", { cta_type: "exam_conduite_card" });
  });

  // Centre d'examen — tuile <a href>
  root.querySelector("#acc-centre")?.addEventListener("click", () => {
    haptic("tap");
    track("cta.clicked", { cta_type: "centre_examen_card" });
  });

  // Révision conduite — tuile <a href>
  root.querySelector("#acc-revision")?.addEventListener("click", () => {
    haptic("tap");
    track("cta.clicked", { cta_type: "revision_conduite_card" });
  });

  // Badges teaser — lien « Voir tout »
  root.querySelector("#acc-badges-voir-tout")?.addEventListener("click", () => {
    haptic("tap");
    track("cta.clicked", { cta_type: "badges_voir_tout" });
  });

  // Streak badge → bottom sheet
  const bsBg = root.querySelector("#bs-bg");
  const bsSheet = root.querySelector("#bs-streak");
  const openBS = () => {
    bsSheet?.classList.add("open");
    bsBg?.classList.add("open");
    track("streak.detail_opened", { days: streak?.current_streak });
  };
  const closeBS = () => {
    bsSheet?.classList.remove("open");
    bsBg?.classList.remove("open");
  };
  root.querySelector("#streak-badge-btn")?.addEventListener("click", openBS);
  bsBg?.addEventListener("click", closeBS);

  // Streak freeze
  root.querySelector("#bs-freeze-btn")?.addEventListener("click", async () => {
    const btn = root.querySelector("#bs-freeze-btn");
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "⏳ Gel en cours…";
    try {
      const { data, error } = await sb.rpc("use_streak_freeze");
      if (error || data?.error) {
        toast(
          "Pas assez de volants pour geler ta série. Il t'en faut 50 volants",
          "error",
        );
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `Geler ma série · 50 ${volantImg(16)}`;
        }, 1800);
        return;
      }
      track("streak.freeze_used", {});
      toast("Série gelée pour 24h", "success");
      btn.textContent = "✓ Série gelée"; // évite de laisser "⏳ Gel en cours…" figé
      closeBS();
    } catch {
      toast("Erreur lors du gel", "error");
      btn.disabled = false;
      btn.innerHTML = `Geler ma série · 50 ${volantImg(16)}`;
    }
  });

  // Heatmap tap
  const infoEl = root.querySelector("#hmap-info");
  root.querySelectorAll(".hmap-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const label = cell.dataset.label;
      const detail = cell.dataset.detail
        ? decodeURIComponent(cell.dataset.detail)
        : null;
      if (!label || !infoEl) return;
      infoEl.textContent = detail || label;
      infoEl.style.opacity = "1";
      clearTimeout(infoEl._t);
      infoEl._t = setTimeout(() => {
        infoEl.style.opacity = "0";
      }, 2500);
    });
  });

  // Session confirm btn
  root
    .querySelector("#confirm-session-btn")
    ?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const sessionId = btn.dataset.sessionId;
      if (!sessionId) return;
      haptic("select");
      track("session.confirm_tapped", { session_id: sessionId });
      navigate(`#/sessions/${sessionId}`);
    });

  // CTA king (hero v2) — même id que l'ancien action-cta-btn, comportement identique
  root.querySelector("#action-cta-btn")?.addEventListener("click", (e) => {
    const href = e.currentTarget.dataset.href;
    if (href) {
      haptic("select");
      track("cta.clicked", { cta_type: "action_btn" });
      navigate(href);
    }
  });
}

// ─── Tes ligues async (École + Révision, à égalité) ──────────────
// Deux dimensions distinctes, mises en avant pareil :
//  - Ligue École   = classement REMC (validations moniteur)        → get_my_leaderboard_position
//  - Ligue Révision = effort solo (quiz réussis + examens blancs)  → get_theory_leaderboard
async function _loadAndInjectLeagues(root) {
  const slot = root.querySelector("#acc-lb-slot");
  if (!slot) return;
  try {
    const [posRes, revRes] = await Promise.allSettled([
      sb.rpc("get_my_leaderboard_position"),
      sb.rpc("get_theory_leaderboard", { p_scope: "ecole", p_limit: 50 }),
    ]);

    // ── Ligue École (REMC / validations) ──
    const pos =
      posRes.status === "fulfilled" && !posRes.value?.error
        ? posRes.value.data
        : null;
    const ecoleRanked =
      pos && pos.my_rank != null && pos.total_eleves != null
        ? pos.total_eleves > 1
        : false;
    const ecoleRankLabel = ecoleRanked ? `#${pos.my_rank}` : null;
    const ecoleSub = ecoleRanked
      ? `sur ${pos.total_eleves} à l'école`
      : "Valide pour te classer";

    // ── Ligue Révision (quiz solo) ──
    const revRows =
      revRes.status === "fulfilled" && Array.isArray(revRes.value?.data)
        ? revRes.value.data
        : [];
    const mineRev = revRows.find((r) => r.is_me === true) || null;
    const revScore = mineRev?.score ?? 0;
    const revInfo = theoryLeague(revScore);
    const revClassed =
      !!revInfo.league && revScore > 0 && mineRev?.rang != null;
    const revRankLabel = revClassed ? `#${mineRev.rang}` : null;
    // « sur N » comme la carte Conduite : le rang seul (#1) n'a de sens
    // qu'avec l'effectif. La ligue (absolue) reste visible sur la page détail.
    const revTotal = revRows.filter((r) => r.rang != null).length;
    const revSub =
      revClassed && revTotal > 0 ? `sur ${revTotal} à l'école` : "Fais un quiz";

    // Render: empty state uses a premium invitation; ranked state shows
    // the number hero with podium accent for top-3 positions.
    // data-ligue differentiates visual identity; data-pos drives podium styling.
    const ecolePos = ecoleRanked ? pos.my_rank : null;
    const revPos = revClassed ? mineRev.rang : null;

    slot.innerHTML = `
      <div class="acc-lg-head">Tes ligues</div>
      <p class="acc-lg-lead">Ton classement parmi les élèves — appuie pour voir le détail.</p>
      <div class="acc-lg-grid">
        <button class="acc-lg-card" id="acc-lg-ecole" data-go="#/classement/ecole"
                data-ligue="ecole"
                ${ecolePos != null && ecolePos <= 3 ? `data-pos="${ecolePos}"` : ""}
                aria-label="Classement conduite — ${esc(ecoleRanked ? `${ecoleRankLabel} sur ${pos.total_eleves}` : "pas encore classé")}">
          <span class="acc-lg-tag">${ill("badge", { size: 16 })} Conduite</span>
          <span class="acc-lg-kick">Ta place</span>
          ${
            ecoleRanked
              ? `<span class="acc-lg-rank">${esc(ecoleRankLabel)}</span>`
              : `<span class="acc-lg-rank is-empty">—</span>`
          }
          <span class="acc-lg-foot">
            ${ecoleSub ? `<span class="acc-lg-sub">${esc(ecoleSub)}</span>` : `<span class="acc-lg-sub">&nbsp;</span>`}
            <span class="acc-lg-go">${icon("chevron-right", { size: 15, strokeWidth: 2.5 })}</span>
          </span>
        </button>
        <button class="acc-lg-card" id="acc-lg-rev" data-go="#/classement/revision"
                data-ligue="revision"
                ${revPos != null && revPos <= 3 ? `data-pos="${revPos}"` : ""}
                aria-label="Classement révision — ${esc(revClassed ? revRankLabel : "pas encore classé")}">
          <span class="acc-lg-tag">${illMask("cahier", { size: 16 })} Révision</span>
          <span class="acc-lg-kick">Ta place</span>
          ${
            revClassed
              ? `<span class="acc-lg-rank">${esc(revRankLabel)}</span>`
              : `<span class="acc-lg-rank is-empty">—</span>`
          }
          <span class="acc-lg-foot">
            ${revSub ? `<span class="acc-lg-sub">${esc(revSub)}</span>` : `<span class="acc-lg-sub">&nbsp;</span>`}
            <span class="acc-lg-go">${icon("chevron-right", { size: 15, strokeWidth: 2.5 })}</span>
          </span>
        </button>
      </div>`;

    slot.querySelectorAll(".acc-lg-card").forEach((card) => {
      card.addEventListener("click", () => {
        const dest = card.dataset.go;
        track("leaderboard.tapped", { target: dest });
        navigate(dest);
      });
    });
  } catch (e) {
    console.error("[accueil] leagues", e);
  }
}

// Injecte une carte « Tes devoirs » si l'élève a des révisions assignées par
// son moniteur non encore faites (revision_focus.done_at IS NULL). Lecture
// seule via RLS (« eleve lit ses ciblages »). Cadré validation, pas de date.
async function _loadAndInjectDevoirs(root, me) {
  try {
    if (!me) return;
    const { count, error } = await sb
      .from("revision_focus")
      .select("id", { count: "exact", head: true })
      .eq("eleve_id", me.id)
      .is("done_at", null);
    if (error || !count) return;
    const slot = root.querySelector("#acc-devoirs-slot");
    if (!slot) return;
    slot.innerHTML = `
      <a class="acc2-devoirs" href="#/revision-conduite" aria-label="Tes devoirs du moniteur : ${count} à faire">
        <span class="acc2-devoirs-ico">${icon("clipboard", { size: 22, strokeWidth: 2.2 })}</span>
        <span class="acc2-devoirs-txt">
          <span class="acc2-devoirs-t">Tes devoirs · ${count} à faire</span>
          <span class="acc2-devoirs-s">De ton moniteur — à boucler avant ta prochaine validation</span>
        </span>
        <span class="acc2-devoirs-badge">${count}</span>
      </a>`;
  } catch (e) {
    console.warn("[accueil] devoirs", e);
  }
}

async function _loadAndInjectChests(root) {
  try {
    const chests = await getMyChests();
    const pending = chests.filter((c) => !c.opened_at);
    if (!pending.length) return;

    const slot = root.querySelector("#acc-chest-slot");
    if (!slot) return;

    const n = pending.length;
    const label = `${n} coffre${n > 1 ? "s" : ""} à ouvrir`;

    slot.innerHTML = `
      <div class="acc2-chest-v2" id="acc-chest-teaser" role="button" tabindex="0"
           aria-label="${esc(label)}">
        <img src="/skins/chests/chest_welcome.png" alt="" aria-hidden="true" loading="lazy">
        <div class="acc2-chest-v2-body">
          <strong class="acc2-chest-v2-title">${esc(label)}</strong>
          <span class="acc2-chest-v2-sub">Réclame ta récompense du jour</span>
        </div>
        <span class="acc2-chest-v2-arr" aria-hidden="true">›</span>
      </div>`;

    const el = slot.querySelector("#acc-chest-teaser");
    const open = () => {
      track("chest_teaser.tapped", { count: n });
      navigate("#/mes-coffres");
    };
    el?.addEventListener("click", open);
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  } catch {
    /* silent */
  }
}

async function _loadAndInjectFlashQuiz(root, me) {
  try {
    const nowIso = new Date().toISOString();
    const { data } = await sb
      .from("flash_quizzes")
      .select("id, expires_at")
      .eq("sent_to", me.id)
      .is("responded_at", null)
      .gt("expires_at", nowIso)
      .order("sent_at", { ascending: false })
      .limit(1);

    const fq = data?.[0];
    if (!fq) return;

    const hero = root.querySelector(".acc2-hero-v2");
    if (!hero) return;
    if (root.querySelector("#acc-flashq")) return; // déjà injecté (garde anti double-mount)

    const expiresMs = new Date(fq.expires_at).getTime();
    const fmt = (ms) => {
      const s = Math.max(0, Math.ceil(ms / 1000));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };

    if (!document.getElementById("acc-flashq-styles")) {
      const st = document.createElement("style");
      st.id = "acc-flashq-styles";
      st.textContent = `
        .acc2-flashq{display:flex;align-items:center;gap:12px;margin:14px 16px 0;padding:14px 16px;border-radius:var(--r-lg);cursor:pointer;
          background:linear-gradient(135deg,#f59e0b,#f97316);box-shadow:0 6px 20px rgba(249,115,22,.32);animation:fqBannerIn .4s var(--ease-snap)}
        @keyframes fqBannerIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .acc2-flashq:active{transform:scale(.99)}
        .acc2-fq-ico{font-size:24px;line-height:1;animation:fqWiggle 1.4s ease-in-out infinite}
        @keyframes fqWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
        .acc2-fq-text{flex:1;min-width:0}
        .acc2-fq-title{font:800 15px/1.2 'Plus Jakarta Sans',sans-serif;color:#fff}
        .acc2-fq-sub{font:600 12.5px/1.3 'Inter',sans-serif;color:rgba(255,255,255,.88);margin-top:2px}
        .acc2-fq-clock{font:800 18px/1 'IBM Plex Mono',monospace;color:#fff;background:rgba(0,0,0,.18);padding:8px 12px;border-radius:var(--r);flex-shrink:0}
        @media(prefers-reduced-motion:reduce){.acc2-fq-ico{animation:none}}`;
      document.head.appendChild(st);
    }

    hero.insertAdjacentHTML(
      "afterend",
      `
      <div class="acc2-flashq" id="acc-flashq" role="button" tabindex="0" aria-label="Quiz éclair de ton moniteur, réponds maintenant">
        <span class="acc2-fq-ico" aria-hidden="true">${ill("eclair", { size: 24 })}</span>
        <div class="acc2-fq-text">
          <div class="acc2-fq-title">Quiz éclair de ton moniteur</div>
          <div class="acc2-fq-sub">3 questions · réponds maintenant</div>
        </div>
        <span class="acc2-fq-clock" id="acc-fq-clock">${esc(fmt(expiresMs - Date.now()))}</span>
      </div>`,
    );

    const el = root.querySelector("#acc-flashq");
    if (!el) return;
    const clockEl = el.querySelector("#acc-fq-clock");
    const iv = setInterval(() => {
      if (!document.body.contains(el)) {
        clearInterval(iv);
        return;
      }
      const left = expiresMs - Date.now();
      if (left <= 0) {
        clearInterval(iv);
        el.remove();
        return;
      }
      clockEl.textContent = fmt(left);
    }, 500);

    const open = () => {
      track("flash_quiz.banner_tapped", { flash_quiz_id: fq.id });
      navigate(`#/flash-quiz/${fq.id}`);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  } catch (e) {
    /* silent */
  }
}

// ─── Helpers ─────────────────────────────────────────────────────
const _QUEST_HREF = {
  quest_quiz_1: "#/parcours",
  quest_quiz_3: "#/parcours",
  quest_quiz_perfect: "#/parcours",
  quest_streak_keep: "#/",
};
// NB : pas de « → » ici — le CTA roi (acc2-cta-king) ajoute déjà sa propre
// flèche (.acc2-cta-arr). En remettre une donnait « Faire un quiz → → ».
const _QUEST_BTN = {
  quest_quiz_1: "Faire un quiz",
  quest_quiz_3: "Faire 3 quiz",
  quest_quiz_perfect: "Viser 100%",
  quest_streak_keep: "Voir mon accueil",
};

function _normalizeQuest(q) {
  const reward = q.reward_gemmes > 0 ? `+${q.reward_gemmes} volants` : "";
  return {
    label: cleanQuestTitle(q.title),
    sub: reward,
    href: _QUEST_HREF[q.quest_id] ?? "#/parcours",
    btnText: _QUEST_BTN[q.quest_id] ?? "Commencer",
    type: q.quest_id,
  };
}

function _dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildActivityData(attempts, streak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = {};
  for (const a of attempts) {
    const key = (a.completed_at || a.created_at || "").slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }
  if (!attempts.length && streak?.current_streak > 0) {
    const n = Math.min(streak.current_streak, 7);
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      counts[_dKey(d)] = 1;
    }
  }
  const activeDates = Object.keys(counts);
  const levels = {},
    details = {};
  for (const [k, v] of Object.entries(counts)) {
    levels[k] = v >= 4 ? 4 : v >= 3 ? 3 : v >= 2 ? 2 : 1;
    const dt = new Date(k + "T12:00:00");
    details[k] =
      `${dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} — ${v} quiz${v > 1 ? "s" : ""}`;
  }
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = _dKey(d);
    days7.push({ key, count: counts[key] || 0 });
  }
  return {
    activeDates,
    levels,
    details,
    days7,
    totalActive: activeDates.length,
  };
}

// ─── Skeleton ────────────────────────────────────────────────────
const SKELETON = `${STYLE}
<div class="acc2" aria-busy="true">
  <div class="skel2" style="height:200px;border-radius:0;margin-bottom:0"></div>
  <div class="skel2" style="height:170px;border-radius:20px;margin:-52px 16px 0;position:relative;z-index:2"></div>
  <div class="skel2" style="height:130px;border-radius:24px;margin:24px 16px 0"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px;margin-top:40px">
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
  </div>
</div>`;
