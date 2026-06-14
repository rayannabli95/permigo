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
import { ASSETS } from "@/utils/assets.js";
import { emotionalBanner } from "@/components/eleve/emotional-banner.js";
import { getMyChests, getEquippedAsset } from "@/utils/game-state.js";
import { mountFeedbackFeed } from "@/components/eleve/feedback-feed.js";
import { mountRevisionCards } from "@/components/eleve/revision-cards.js";
import { mountDailyQuests } from "@/components/eleve/daily-quests.js";
import { toast } from "@/components/common/toast.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { startTour } from "@/components/common/guided-tour.js";
import { onPopupsSettled } from "@/utils/intro-overlays.js";
import { renderPermisMini } from "@/components/eleve/permis-card.js";

// Tour guidé élève — 1× à la première arrivée sur l'accueil (l'onboarding
// plein écran est déjà passé : main.js le monte AVANT cette page).
const TOUR_KEY = "pg-tour-eleve-v1";
const ELEVE_TOUR_STEPS = [
  {
    title: "Bienvenue sur PermiGo 👋",
    text: "Ton permis, étape par étape. Petite visite en 30 secondes — tu peux passer quand tu veux.",
  },
  {
    sel: ".acc2-hero-streak",
    title: "Ta flamme 🔥",
    text: "Reviens chaque jour : ta série grandit et te rapporte des volants à dépenser.",
  },
  {
    sel: ".acc2-action",
    title: "Ton action du jour",
    text: "Un petit quiz par jour, et l'examen devient beaucoup plus facile. C'est ici que ça se passe.",
  },
  {
    sel: '.bn-tab[data-id="parcours"]',
    title: "Ton parcours",
    text: "Ta carte du permis : 4 mondes à traverser, 31 compétences à valider avec ton moniteur.",
  },
  {
    sel: '.bn-tab[data-id="boutique"]',
    title: "La boutique",
    text: "Skins de voiture, fonds de permis… dépense tes volants et montre ton style au classement.",
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
      if (!document.querySelector(".acc2-hero-streak")) return;
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

/* ── Skeletons ── */
.skel2 {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: skel2Shim 1.4s ease-in-out infinite;
  border-radius: var(--r-xl);
}
@keyframes skel2Shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ════════════════════════ BLOC 1 — HERO ═══════════════════════ */
/* Compact : salutation + flamme. Le permis virtuel (juste dessous,
   en chevauchement) est L'élément dominant de l'écran. */
.acc2-hero {
  position: relative;
  overflow: hidden;
  padding: calc(env(safe-area-inset-top, 0px) + 68px) 20px 72px;
  background: linear-gradient(160deg, rgba(11,13,26,.72) 0%, rgba(20,35,5,.55) 40%, rgba(11,13,26,.68) 100%), url('/skins/landing/monde4jour.webp') center/cover no-repeat;
}
.acc2-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 15% 35%, color-mix(in srgb, var(--a) 20%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 85% 75%, color-mix(in srgb, var(--adk) 14%, transparent) 0%, transparent 55%);
  pointer-events: none;
}
.acc2-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--adk) 55%, transparent) 0%,
    rgba(46,122,0,.35) 50%,
    color-mix(in srgb, var(--adk) 55%, transparent) 100%);
  mix-blend-mode: multiply;
  pointer-events: none;
}
.acc2-hero-content { position: relative; z-index: 1; }
.acc2-hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.acc2-hero-greet { flex: 1; min-width: 0; }
.acc2-hero-hi {
  display: block;
  font: 500 14px/1.25 'Inter', sans-serif;
  color: rgba(255,255,255,.78);
}
/* Le prénom = LA star du hero */
.acc2-hero-name {
  font: 800 clamp(26px, 8.5vw, 34px)/1.05 var(--fd), 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -.03em;
  margin: 2px 0 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-shadow: 0 2px 12px rgba(11,13,26,.35);
}
/* Welcome-back : sous-ligne après ≥3 jours d'absence */
.acc2-hero-back {
  display: block;
  width: 100%;
  font: 600 12.5px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.85);
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.16);
  border-radius: var(--r);
  padding: 8px 12px;
  margin-top: 10px;
}
/* Streak EN VEDETTE : la flamme 3D (asset) + compteur, en haut à droite */
.acc2-hero-streak {
  display: flex; flex-direction: column; align-items: center; gap: 0;
  cursor: pointer; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: transform .15s var(--ease-spring);
}
.acc2-hero-streak:active { transform: scale(.92); }
.acc2-hero-streak-img {
  width: 44px; height: 44px; object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(251,146,60,.75));
}
.acc2-hero-streak.active .acc2-hero-streak-img {
  animation: heroFirePulse .8s ease-in-out infinite alternate;
}
@keyframes heroFirePulse {
  from { transform: scale(1) rotate(-3deg); }
  to   { transform: scale(1.12) rotate(3deg); }
}
.acc2-hero-streak-num {
  display: flex; align-items: baseline; gap: 3px; margin-top: -4px;
  background: rgba(11,13,26,.45); border-radius: var(--r-full); padding: 2px 9px 3px;
  box-shadow: var(--s-am);
  backdrop-filter: blur(6px);
}
.acc2-hero-streak-num b { font: 800 14px/1 'Plus Jakarta Sans', sans-serif; color: #ffb35c; }
.acc2-hero-streak-num i { font: 600 9.5px/1 'Inter', sans-serif; color: rgba(255,255,255,.85); font-style: normal; }
@media (prefers-reduced-motion: reduce) { .acc2-hero-streak-img { animation: none !important; } }

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
  background: var(--a);
  border: none;
  border-radius: var(--r-lg);
  color: var(--a-ink);
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 52px;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring), opacity .12s;
  position: relative; z-index: 1;
}
.acc2-ms-session-btn:active { transform: scale(.96); opacity: .9; }

/* ═══════════════════ BLOC 3 — ACTION DU JOUR ══════════════════ */
.acc2-action {
  margin: 24px 16px 0;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: var(--rx);
  padding: 20px;
  box-shadow: 0 2px 4px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  animation: acc2ActionIn .55s .22s var(--ease-spring) both;
}
@keyframes acc2ActionIn {
  from { opacity: 0; transform: translateY(12px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.acc2-action-tag {
  display: flex; align-items: center; gap: 6px;
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .1em;
  text-transform: uppercase;
  /* 10px uppercase : mu2 seul ne tient pas le contraste AA */
  color: color-mix(in srgb, var(--mu) 45%, var(--ink));
  margin-bottom: 12px;
}
.acc2-action-tag-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--a);
  flex-shrink: 0;
}
.acc2-action-tag-dot.urgent { background: var(--rd); animation: urgentPulse 1s ease-in-out infinite; }
@keyframes urgentPulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
.acc2-action-title {
  font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.02em;
  margin-bottom: 6px;
}
.acc2-action-sub {
  font: 500 13.5px/1.4 'Inter', sans-serif;
  color: var(--mu);
}
.acc2-action-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
  margin-top: 16px;
  padding: 16px 24px;
  background: var(--a);
  border: none;
  border-radius: var(--r-lg);
  color: var(--a-ink); /* encre prévue pour l'accent : 4.5:1 garanti par accent.js */
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 52px;
  box-shadow: var(--s-a-lg);
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s var(--ease-spring), box-shadow .14s;
}
.acc2-action-btn:active { transform: scale(.96); box-shadow: 0 4px 12px -4px color-mix(in srgb, var(--a) 40%, transparent); }

/* ═══════════════════════ BELOW FOLD ═══════════════════════════ */
.acc2-section-title {
  font: 600 12px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin: 32px 20px 14px;
}

/* ── Chest teaser ── */
.acc2-chest-teaser {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--a) 8%, transparent), color-mix(in srgb, var(--a) 4%, transparent));
  border: 1.5px solid color-mix(in srgb, var(--a) 20%, transparent);
  border-radius: var(--rl);
  padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer;
  transition: border-color .14s, transform .14s;
  animation: acc2ChestIn .4s var(--ease-spring) both;
}
@keyframes acc2ChestIn {
  from { opacity:0; transform:translateY(8px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@media (hover:hover) and (pointer:fine) {
  .acc2-chest-teaser:hover { border-color: color-mix(in srgb, var(--a) 40%, transparent); }
}
.acc2-chest-teaser:active { transform: scale(.98); }
.acc2-ct-ico { font-size: 28px; flex-shrink: 0; }
.acc2-ct-text { flex: 1; min-width: 0; }
.acc2-ct-title {
  font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
}
.acc2-ct-sub {
  font: 500 12.5px/1 'Inter', sans-serif;
  color: var(--mu);
  margin-top: 3px;
}
.acc2-ct-arrow { flex-shrink: 0; }

.worlds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 16px;
  margin-bottom: 8px;
}
.world-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: var(--r-xl);
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: transform .15s, box-shadow .15s;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.world-card:active { transform: scale(.97); }
.world-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; min-height: 56px; }
.world-ico  { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; }
.world-img  { width: 56px; height: 56px; object-fit: contain; display: block; filter: drop-shadow(0 2px 6px rgba(11,13,26,.12)); transition: transform .3s; }
.world-card[data-world="C2"] .world-img { transform: scale(1.18); }
.world-card:hover .world-img { transform: scale(1.1) rotate(-3deg); }
.world-card[data-world="C2"]:hover .world-img { transform: scale(1.28) rotate(-3deg); }
.world-card[data-complete="true"] .world-img { animation: worldFloat2 2.8s ease-in-out infinite; }
@keyframes worldFloat2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .world-card[data-complete="true"] .world-img { animation: none; } }
.world-pct  { font: 700 13px/1 'Inter', sans-serif; }
.world-name { font: 600 12.5px/1.3 'Inter', sans-serif; color: var(--mu2); margin-bottom: 8px; }
.world-track { height: 4px; background: var(--bo); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.world-fill  { height: 100%; border-radius: 2px; transition: width .5s ease; }
.world-count { font: 500 11.5px/1 'Inter', sans-serif; color: var(--mu2); }
.world-crown { position: absolute; top: 10px; right: 10px; }

/* ── Examen blanc — verrouillé jusqu'au monde 3, sinon CTA ── */
.acc2-exam {
  margin: 28px 16px 0;
  padding: 18px;
  border-radius: var(--rx);
  display: flex; align-items: center; gap: 14px;
  -webkit-tap-highlight-color: transparent;
}
.acc2-exam.locked {
  background: var(--su);
  border: 1.5px dashed var(--bo4);
}
.acc2-exam.unlocked {
  background: linear-gradient(135deg, var(--adk) 0%, var(--a) 100%);
  cursor: pointer;
  box-shadow: 0 12px 28px -10px color-mix(in srgb, var(--a) 50%, transparent);
  transition: transform .15s var(--ease-spring);
}
.acc2-exam.unlocked:active { transform: scale(.98); }
.acc2-exam-ico {
  width: 44px; height: 44px;
  border-radius: var(--r-lg);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.acc2-exam.locked .acc2-exam-ico { background: var(--bg3); color: var(--mu2); }
.acc2-exam.unlocked .acc2-exam-ico { background: rgba(255,255,255,.18); color: #fff; }
.acc2-exam-tx { flex: 1; min-width: 0; }
.acc2-exam-t { font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif; }
.acc2-exam.locked .acc2-exam-t { color: var(--mu); }
.acc2-exam.unlocked .acc2-exam-t { color: #fff; }
.acc2-exam-s { font: 500 13px/1.35 'Inter', sans-serif; margin-top: 3px; }
.acc2-exam.locked .acc2-exam-s { color: var(--mu2); }
.acc2-exam.unlocked .acc2-exam-s { color: rgba(255,255,255,.85); }
.acc2-exam-arrow { flex-shrink: 0; color: #fff; display: flex; }

/* Leaderboard slot */
.acc-lb {
  display: flex; align-items: center; gap: 14px;
  margin: 16px 16px 4px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--a) 15%, transparent) 0%, color-mix(in srgb, var(--a) 5%, transparent) 100%);
  border: 1.5px solid color-mix(in srgb, var(--a) 28%, transparent);
  border-radius: var(--r-xl);
  padding: 14px 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px -6px color-mix(in srgb, var(--a) 35%, transparent);
  -webkit-tap-highlight-color: transparent;
  transition: transform .15s var(--ease-spring), box-shadow .15s ease, border-color .15s ease;
}
.acc-lb::before {
  content: ''; position: absolute; top: -45%; right: -12%;
  width: 130px; height: 130px; pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--a) 20%, transparent), transparent 70%);
}
.acc-lb:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 22px -7px color-mix(in srgb, var(--a) 45%, transparent);
  border-color: color-mix(in srgb, var(--a) 45%, transparent);
}
.acc-lb:active { transform: scale(.98); }
.acc-lb:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; }

.acc-lb-rank {
  flex-shrink: 0; width: 52px; height: 52px; border-radius: var(--r-lg);
  display: flex; align-items: center; justify-content: center;
  background: var(--a); color: var(--a-ink);
  box-shadow: 0 5px 13px -3px color-mix(in srgb, var(--a) 60%, transparent);
  font: 800 19px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.03em;
  position: relative; z-index: 1;
}
.acc-lb-rank.empty { background: color-mix(in srgb, var(--a) 16%, transparent); color: var(--a-txt); font-size: 24px; box-shadow: none; }
.acc-lb-rank.img { background: transparent; box-shadow: none; padding: 0; }
.acc-lb-rank.img img { width: 52px; height: 52px; object-fit: contain; display: block; }
.acc-lb-rank-hash { font-size: 12px; font-weight: 700; opacity: .75; margin-right: 1px; }

.acc-lb-main { flex: 1; min-width: 0; position: relative; z-index: 1; }
.acc-lb-eyebrow {
  font: 700 10px/1 'Inter', sans-serif; color: var(--a-txt);
  letter-spacing: .08em; text-transform: uppercase; margin-bottom: 5px;
}
.acc-lb-body {
  font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  letter-spacing: -.02em; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.acc-lb-chip {
  font: 700 11px/1 'Inter', sans-serif; color: var(--am-txt);
  background: rgba(245,158,11,.14); border-radius: var(--r-full); padding: 4px 9px;
}
.acc-lb-sub { font: 500 12.5px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

.acc-lb-arrow {
  flex-shrink: 0; color: var(--a-txt); display: flex; align-items: center;
  opacity: .9; position: relative; z-index: 1; transition: transform .15s ease;
}
.acc-lb:hover .acc-lb-arrow { transform: translateX(3px); }

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
  try {
    const today = new Date().toDateString();
    const last = localStorage.getItem(LS_LAST_VISIT);
    revisitToday = last === today;
    localStorage.setItem(LS_LAST_VISIT, today);
  } catch {
    /* ignore */
  }
  if (revisitToday) return "Ça fait plaisir de te revoir aujourd'hui,";
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
    const [pendingSessionsRes, todayQuestsRes] = await Promise.allSettled([
      sb.rpc("get_pending_sessions_eleve"),
      sb.rpc("get_today_quests"),
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
    const todayQuests = todayQuestsRes.value?.data || [];
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

    // Composants non-bloquants injectés sous le fold
    if (accDiv) {
      // Quêtes du jour — carrousel réclamable, juste sous l'action du jour
      const actionEl = accDiv.querySelector(".acc2-action");
      if (actionEl) {
        const dqHost = document.createElement("div");
        dqHost.style.cssText = "margin:16px 16px 0";
        actionEl.insertAdjacentElement("afterend", dqHost);
        Promise.resolve()
          .then(() =>
            mountDailyQuests(dqHost, { prefetchedQuests: todayQuests }),
          )
          .catch(() => {});
      }
      Promise.resolve()
        .then(() => mountFeedbackFeed(accDiv, { eleveId: me.id, limit: 5 }))
        .catch(() => {});
      Promise.resolve()
        .then(() => mountRevisionCards(accDiv, { eleveId: me.id, limit: 3 }))
        .catch(() => {});
    }

    // Leaderboard async
    _loadAndInjectLeaderboard(root);

    // Bannière émotionnelle — insérée juste après le hero
    emotionalBanner
      .checkAndRender(root, { afterSelector: ".acc2-hero" })
      .catch(() => {});

    // Quiz éclair actif poussé par le moniteur — bandeau prioritaire
    _loadAndInjectFlashQuiz(root, me).catch(() => {});

    // Coffres disponibles — teaser non-bloquant injecté sous l'action du jour
    _loadAndInjectChests(root);

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
}) {
  const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
  const prenom = profile.prenom || me.prenom || "Toi";
  const isActive = streakSt !== "broken";

  // ── Séance à confirmer (priorité absolue quand présente) ──
  const pendingSession = pendingSessions?.[0] ?? null;

  // ── ACTION DU JOUR ──
  // Priorité : quête > notif quiz > QUESTION DU JOUR (boucle quotidienne) > parcours.
  // mountDailyQuests gère le carrousel claim séparé (sous ce bloc).
  const _pendingQuest = !pendingNotif
    ? (todayQuests.find(
        (q) => !q.completed && !q.claimed && q.quest_id !== "quest_login",
      ) ?? null)
    : null;
  const bloc3 = renderActionDuJour(
    _pendingQuest ? _normalizeQuest(_pendingQuest) : null,
    pendingNotif,
    totalValidated,
    dailyQuiz,
  );

  // Examen blanc : s'ouvre quand le monde 3 devient accessible.
  const examUnlocked = (worlds[1]?.done ?? 0) >= EXAM_UNLOCK_WORLD2_DONE;

  return `${STYLE}
<div class="acc2">

  <!-- ══ HERO compact — salutation + flamme ══ -->
  <div class="acc2-hero">
    <div class="acc2-hero-content">
      <div class="acc2-hero-top">
        <div class="acc2-hero-greet">
          <span class="acc2-hero-hi">${esc(_greeting(_awayDays))}</span>
          <h1 class="acc2-hero-name" tabindex="-1">${esc(prenom)}</h1>
        </div>
        ${
          streak.current_streak > 0
            ? `
        <div class="acc2-hero-streak ${isActive ? "active" : ""}" id="streak-badge-btn" role="button" tabindex="0" aria-label="Streak ${streak.current_streak} jours">
          <img class="acc2-hero-streak-img" src="/skins/permigo-streak-flame-v1.webp" alt="" />
          <span class="acc2-hero-streak-num">
            <b>${streak.current_streak}</b>
            <i>jour${streak.current_streak > 1 ? "s" : ""}</i>
          </span>
        </div>`
            : ""
        }
      </div>
      ${
        _awayDays >= 3
          ? `<div class="acc2-hero-back">Ta route t'attend depuis ${_awayDays} jours — reprends là où tu t'étais arrêté.</div>`
          : ""
      }
    </div>
  </div>

  <!-- ══ PERMIS VIRTUEL — où j'en suis, en 1 coup d'œil ══ -->
  <div class="acc2-permis" id="acc-permis">
    ${renderPermisMini({
      prenom,
      nom: profile.nom || me.nom || "",
      created_at: profile.created_at || me.created_at || null,
      validated: totalValidated,
      total: 31,
    })}
  </div>

  ${pendingSession ? `<div class="acc2-ms">${renderSessionConfirm(pendingSession)}</div>` : ""}

  <!-- ══ ACTION DU JOUR — le seul bouton à presser ══ -->
  ${bloc3}

  <!-- Classement de l'école (ligue en vedette) -->
  <div id="acc-lb-slot"></div>

  <!-- ══ BELOW FOLD ══ -->
  <div class="acc2-section-title">Mon parcours</div>
  <div class="worlds-grid">
    ${worlds
      .map(
        (w) => `
      <div class="world-card" data-world="${esc(w.id)}" data-complete="${w.complete ? "true" : "false"}">
        <div class="world-top">
          ${
            w.image
              ? `<img class="world-img" src="${esc(w.image)}" alt="${esc(w.name)}" loading="lazy">`
              : `<span class="world-ico">${icon(w.ico, { size: 22, strokeWidth: 1.5 })}</span>`
          }
          <span class="world-pct" style="color:${w.color}">${w.pct}%</span>
        </div>
        <div class="world-name">${esc(w.name)}</div>
        <div class="world-track"><div class="world-fill" style="width:${w.pct}%;background:${w.color}"></div></div>
        <div class="world-count">${w.done}/${w.total}</div>
        ${w.complete ? `<div class="world-crown">${icon("award", { size: 14 })}</div>` : ""}
      </div>
    `,
      )
      .join("")}
  </div>

  <!-- ══ EXAMEN BLANC — verrouillé jusqu'au monde 3 ══ -->
  ${
    examUnlocked
      ? `
  <div class="acc2-exam unlocked" id="acc-exam" role="button" tabindex="0" aria-label="Passer l'examen blanc">
    <div class="acc2-exam-ico">${icon("target", { size: 20 })}</div>
    <div class="acc2-exam-tx">
      <div class="acc2-exam-t">Examen blanc</div>
      <div class="acc2-exam-s">Mets-toi en conditions réelles</div>
    </div>
    <div class="acc2-exam-arrow">${icon("arrow-right", { size: 18 })}</div>
  </div>`
      : `
  <div class="acc2-exam locked" aria-label="Examen blanc verrouillé — se débloque au monde 3">
    <div class="acc2-exam-ico">${icon("lock", { size: 18 })}</div>
    <div class="acc2-exam-tx">
      <div class="acc2-exam-t">Examen blanc</div>
      <div class="acc2-exam-s">Se débloque au monde 3</div>
    </div>
  </div>`
  }

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
    <button class="bs-freeze-btn" id="bs-freeze-btn">Geler ma série · 50 ${icon("gem", { size: 14 })}</button>
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

function renderActionDuJour(quest, pendingNotif, totalValidated, dailyQuiz) {
  let label = "Action du jour";
  let title,
    sub,
    btnText,
    href,
    urgent = false;

  // Le quiz n'est plus une porte de validation : on ne pousse plus 'a_valider' en URGENT.
  // L'invitation au quiz-récap (optionnel) vient d'une notif quiz non lue.
  if (quest) {
    title = quest.label ?? "Quête du jour";
    sub = quest.sub ?? "";
    btnText = quest.btnText ?? "Commencer →";
    href = quest.href ?? "#/parcours";
    urgent = false;
  } else if (pendingNotif?.data?.competence_id) {
    const isConsolid = pendingNotif.type === "consolidation_quiz";
    title = isConsolid ? "Quiz de consolidation" : "Quiz-récap";
    sub = isConsolid ? "2 questions · 30 sec" : "3 questions · optionnel";
    btnText = isConsolid ? "Commencer →" : "Faire le récap →";
    href = `#/quiz/${pendingNotif.data.competence_id}/${isConsolid ? "consolidation" : "post_validation"}`;
    urgent = isConsolid;
  } else if (dailyQuiz && !dailyQuiz.done && dailyQuiz.competenceId) {
    // Question du jour — LA boucle solo quotidienne (plan rétention).
    label = "Question du jour";
    title =
      dailyQuiz.mode === "decouverte"
        ? "Découvre une compétence"
        : "Ne perds pas ce que tu maîtrises";
    sub = "3 questions · 2 min";
    btnText = "Je joue";
    href = `#/quiz/${dailyQuiz.competenceId}/post_validation/daily`;
  } else if (dailyQuiz?.done) {
    label = "Question du jour";
    title = "C'est fait pour aujourd'hui ✓";
    sub = "Reviens demain — ou avance sur ton parcours.";
    btnText = "Voir le parcours";
    href = "#/parcours";
  } else if (totalValidated === 0) {
    title = "Lance ton parcours";
    sub = "31 compétences à valider avec ton moniteur";
    btnText = "Voir le parcours";
    href = "#/parcours";
  } else {
    title = "Continue ton parcours";
    sub = "";
    btnText = "Voir le parcours";
    href = "#/parcours";
  }

  return `
    <div class="acc2-action">
      <div class="acc2-action-tag">
        <div class="acc2-action-tag-dot${urgent ? " urgent" : ""}"></div>
        ${esc(label)}
        ${urgent ? `<span style="color: var(--rd-txt);font-weight:700">URGENT</span>` : ""}
      </div>
      <div class="acc2-action-title">${esc(title)}</div>
      ${sub ? `<div class="acc2-action-sub">${esc(sub)}</div>` : ""}
      <button class="acc2-action-btn" id="action-cta-btn" data-href="${esc(href)}">
        ${esc(btnText)}
        ${icon("arrow-right", { size: 16 })}
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
  // Permis virtuel : barre animée + tap → parcours
  const pcmFill = root.querySelector(".pcm-fill[data-target]");
  if (pcmFill)
    setTimeout(() => {
      pcmFill.style.width = pcmFill.dataset.target + "%";
    }, 150);
  const permisCard = root.querySelector("#acc-permis .pcm");
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

  // Examen blanc (carte déverrouillée uniquement)
  const examCard = root.querySelector("#acc-exam");
  if (examCard) {
    const openExam = () => {
      haptic("select");
      track("cta.clicked", { cta_type: "exam_blanc_card" });
      navigate("#/exam-blanc");
    };
    examCard.addEventListener("click", openExam);
    examCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openExam();
      }
    });
  }

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
          "Pas assez de gemmes pour geler ta série. Il t'en faut 50 gemmes",
          "error",
        );
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `Geler ma série · 50 ${icon("gem", { size: 14 })}`;
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
      btn.innerHTML = `Geler ma série · 50 ${icon("gem", { size: 14 })}`;
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

  // BLOC 3 action btn
  root.querySelector("#action-cta-btn")?.addEventListener("click", (e) => {
    const href = e.currentTarget.dataset.href;
    if (href) {
      haptic("select");
      track("cta.clicked", { cta_type: "action_btn" });
      navigate(href);
    }
  });

  // World cards → parcours
  root.querySelectorAll("[data-world]").forEach((el) => {
    el.addEventListener("click", () => {
      track("cta.clicked", { cta_type: "world_card", world: el.dataset.world });
      navigate("#/parcours");
    });
  });
}

// ─── Leaderboard async ───────────────────────────────────────────
async function _loadAndInjectLeaderboard(root) {
  try {
    const { data, error } = await sb.rpc("get_my_leaderboard_position");
    if (error || !data || data?.error) return;
    const slot = root.querySelector("#acc-lb-slot");
    if (!slot) return;
    const rank = data.my_rank,
      total = data.total_eleves,
      pct = data.percentile;
    const ranked = rank !== null && total !== null && total > 1;

    const badge = ranked
      ? `<div class="acc-lb-rank"><span class="acc-lb-rank-hash">#</span>${esc(String(rank))}</div>`
      : `<div class="acc-lb-rank img"><img src="/skins/badge-3d-ultimate.webp" alt="" width="52" height="52" loading="lazy"></div>`;
    const chip =
      pct !== null ? `<span class="acc-lb-chip">Top ${100 - pct}%</span>` : "";
    const bodyText = ranked
      ? `Tu es #${rank} sur ${total}`
      : "Personne devant toi… pour l'instant";
    // Une seule ligne secondaire : le chip « Top X% » dit déjà l'essentiel
    const sub = ranked
      ? pct !== null
        ? ""
        : "Garde le rythme pour grimper"
      : "Invite tes potes pour lancer la course";

    const ARROW = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    slot.innerHTML = `
      <div class="acc-lb" id="acc-lb-card" role="button" tabindex="0" aria-label="Voir le classement de l'école">
        ${badge}
        <div class="acc-lb-main">
          <div class="acc-lb-eyebrow">Classement de l'école</div>
          <div class="acc-lb-body">${esc(bodyText)}${chip}</div>
          ${sub ? `<div class="acc-lb-sub">${esc(sub)}</div>` : ""}
        </div>
        <div class="acc-lb-arrow">${ARROW}</div>
      </div>`;

    const card = slot.querySelector("#acc-lb-card");
    const open = () => {
      track("leaderboard.tapped", {
        rank: data.my_rank,
        percentile: data.percentile,
      });
      navigate("#/classement");
    };
    card?.addEventListener("click", open);
    card?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  } catch (e) {
    console.error("[accueil] leaderboard", e);
  }
}

async function _loadAndInjectChests(root) {
  try {
    const chests = await getMyChests();
    const pending = chests.filter((c) => !c.opened_at);
    if (!pending.length) return;

    // Inject a teaser card just before the worlds grid
    const anchor = root.querySelector(".acc2-section-title");
    if (!anchor) return;

    const div = document.createElement("div");
    div.innerHTML = `
      <div class="acc2-chest-teaser" id="acc-chest-teaser" role="button" tabindex="0"
           aria-label="${pending.length} coffre${pending.length > 1 ? "s" : ""} à ouvrir">
        <span class="acc2-ct-ico">${icon("gift", { size: 18 })}</span>
        <div class="acc2-ct-text">
          <div class="acc2-ct-title">${pending.length} coffre${pending.length > 1 ? "s" : ""} à ouvrir</div>
          <div class="acc2-ct-sub">Réclame tes récompenses</div>
        </div>
        <div class="acc2-ct-arrow">${icon("chevron-right", { size: 16, strokeWidth: 2.5, color: "var(--a)" })}</div>
      </div>`;

    const el = div.firstElementChild;
    anchor.parentNode.insertBefore(el, anchor);

    const open = () => {
      track("chest_teaser.tapped", { count: pending.length });
      navigate("#/mes-coffres");
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

    const hero = root.querySelector(".acc2-hero");
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
        <span class="acc2-fq-ico" aria-hidden="true">${icon("zap", { size: 18 })}</span>
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
  quest_validate_1: "#/parcours",
  quest_quiz_1: "#/parcours",
  quest_quiz_3: "#/parcours",
  quest_quiz_perfect: "#/parcours",
  quest_streak_keep: "#/",
};
const _QUEST_BTN = {
  quest_validate_1: "Valider une compétence →",
  quest_quiz_1: "Faire un quiz →",
  quest_quiz_3: "Faire 3 quiz →",
  quest_quiz_perfect: "Viser 100% →",
  quest_streak_keep: "Voir mon accueil →",
};

function _normalizeQuest(q) {
  const reward = q.reward_gemmes > 0 ? `+${q.reward_gemmes} volants` : "";
  return {
    label: q.title,
    sub: reward,
    href: _QUEST_HREF[q.quest_id] ?? "#/parcours",
    btnText: _QUEST_BTN[q.quest_id] ?? "Commencer →",
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
