// ═══════════════════════════════════════════════════════════════
// Élève — Accueil (refonte 3 blocs immersifs)
// Bloc 1 : HERO (gradient, niveau, XP, streak)
// Bloc 2 : NEXT MILESTONE (session à confirmer OU récompense)
// Bloc 3 : ACTION DU JOUR (1 quête / quiz)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { REMC } from '@/data/remc.js';
import { renderHeatmap, ensureHeatmapStyles } from '@/components/eleve/activity-heatmap.js';
import { maybeSoftRequestPush, maybeSendStreakRiskNotif } from '@/services/web-push.js';
import { maybePlayWeeklyReplay } from '@/components/eleve/weekly-replay.js';
import { icon } from '@/utils/icons.js';
import { ASSETS } from '@/utils/assets.js';
import { emotionalBanner } from '@/components/eleve/emotional-banner.js';
import { getMyChests, getEquippedAsset } from '@/utils/game-state.js';
import { mountFeedbackFeed } from '@/components/eleve/feedback-feed.js';
import { mountRevisionCards } from '@/components/eleve/revision-cards.js';
import { mountDailyQuests } from '@/components/eleve/daily-quests.js';
import { toast } from '@/components/common/toast.js';
import { navigate } from '@/router.js';
import { haptic } from '@/utils/haptic.js';

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
  border-radius: 20px;
}
@keyframes skel2Shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ════════════════════════ BLOC 1 — HERO ═══════════════════════ */
.acc2-hero {
  position: relative;
  overflow: hidden;
  padding: calc(env(safe-area-inset-top, 0px) + 56px) 24px 32px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(160deg, rgba(11,13,26,.72) 0%, rgba(20,35,5,.55) 40%, rgba(11,13,26,.68) 100%), url('/skins/landing/monde4jour.webp') center/cover no-repeat;
}
.acc2-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 15% 35%, rgba(88,204,2,.20) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 85% 75%, rgba(70,163,2,.14) 0%, transparent 55%);
  pointer-events: none;
}
.acc2-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(70,163,2,.55) 0%,
    rgba(46,122,0,.35) 50%,
    rgba(70,163,2,.55) 100%);
  mix-blend-mode: multiply;
  pointer-events: none;
}
.acc2-hero-content { position: relative; z-index: 1; }
.acc2-hero-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.acc2-hero-av {
  width: 52px; height: 52px;
  border-radius: 16px;
  background: rgba(255,255,255,.18);
  border: 1.5px solid rgba(255,255,255,.28);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  flex-shrink: 0;
}
.acc2-hero-hi {
  font: 500 15px/1.2 'Inter', sans-serif;
  color: rgba(255,255,255,.75);
  flex: 1;
}
.acc2-hero-notif-btn {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,.12);
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.8);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.acc2-hero-notif-btn:active { background: rgba(255,255,255,.2); }
.acc2-hero-title {
  font: 800 40px/1.05 var(--fd), sans-serif;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0 0 16px;
}
.acc2-hero-niv-badge {
  display: inline-block;
  background: var(--a);
  color: #fff;
  padding: 10px 22px;
  border-radius: var(--rl);
  font-weight: 900;
  box-shadow: var(--s-btn-rest);
  text-shadow: none;
}
.acc2-hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.acc2-hero-xp-pill {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 99px;
  padding: 7px 12px;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.acc2-hero-streak {
  display: flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 99px;
  padding: 7px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s;
}
.acc2-hero-streak:active { background: rgba(255,255,255,.22); }
.acc2-hero-streak-fire {
  font-size: 15px;
  line-height: 1;
  filter: drop-shadow(0 0 5px rgba(251,146,60,.8));
}
.acc2-hero-streak.active .acc2-hero-streak-fire {
  animation: heroFirePulse .7s ease-in-out infinite alternate;
}
@keyframes heroFirePulse {
  from { transform: scale(1) rotate(-4deg); }
  to   { transform: scale(1.18) rotate(4deg); }
}
.acc2-hero-streak-val {
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.acc2-hero-streak-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}
.acc2-xp-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.acc2-xp-bar {
  height: 5px;
  background: rgba(255,255,255,.2);
  border-radius: 99px;
  overflow: hidden;
}
.acc2-xp-fill {
  height: 100%;
  background: rgba(255,255,255,.85);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.acc2-xp-hint {
  font: 500 10.5px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.55);
}

/* ══════════════════ BLOC 2 — NEXT MILESTONE ════════════════════ */
.acc2-ms {
  margin: 20px 16px 0;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  min-height: 200px;
  animation: acc2MsIn .55s .1s cubic-bezier(.34,1.56,.64,1) both;
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
  background: radial-gradient(ellipse 70% 60% at 90% 20%, rgba(88,204,2,.25) 0%, transparent 55%);
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
  border-radius: 14px;
  background: rgba(88,204,2,.3);
  border: 1px solid rgba(88,204,2,.4);
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
  border-radius: 16px;
  color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 52px;
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), opacity .12s;
  position: relative; z-index: 1;
}
.acc2-ms-session-btn:active { transform: scale(.96); opacity: .9; }

/* Next reward */
.acc2-ms-reward {
  background: linear-gradient(135deg, var(--a) 0%, var(--adk) 100%);
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px -12px rgba(88,204,2,.35), 0 6px 16px rgba(10,13,26,.15);
}
.acc2-ms-reward::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 80% at 85% 20%, rgba(255,255,255,.16) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 15% 90%, rgba(255,255,255,.08) 0%, transparent 50%);
  pointer-events: none;
}
.acc2-ms-reward-inner { position: relative; z-index: 1; }
.acc2-ms-reward-label {
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.55);
  margin-bottom: 16px;
}
.acc2-ms-reward-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.acc2-ms-reward-icon {
  width: 60px; height: 60px;
  border-radius: 18px;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.25);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.acc2-ms-reward-info { flex: 1; min-width: 0; }
.acc2-ms-reward-remaining {
  font: 800 26px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: 4px;
}
.acc2-ms-reward-remaining span {
  font: 500 13px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.65);
  letter-spacing: 0;
  margin-left: 4px;
}
.acc2-ms-reward-name {
  font: 600 13px/1.3 'Inter', sans-serif;
  color: rgba(255,255,255,.8);
}
.acc2-ms-prog-bar {
  height: 8px;
  background: rgba(255,255,255,.2);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 8px;
}
.acc2-ms-prog-fill {
  height: 100%;
  background: rgba(255,255,255,.9);
  border-radius: 99px;
  transition: width 1s .15s cubic-bezier(.2,.7,.3,1);
}
.acc2-ms-prog-meta {
  display: flex;
  justify-content: space-between;
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.6);
  margin-bottom: 16px;
}
.acc2-ms-cta-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%;
  padding: 14px 20px;
  background: rgba(255,255,255,.16);
  border: 1.5px solid rgba(255,255,255,.3);
  border-radius: 16px;
  color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 50px;
  backdrop-filter: blur(8px);
  -webkit-tap-highlight-color: transparent;
  transition: background .12s, transform .12s;
}
.acc2-ms-cta-btn:active { background: rgba(255,255,255,.25); transform: scale(.98); }

/* ═══════════════════ BLOC 3 — ACTION DU JOUR ══════════════════ */
.acc2-action {
  margin: 16px 16px 0;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  animation: acc2ActionIn .55s .22s cubic-bezier(.34,1.56,.64,1) both;
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
  color: var(--mu2);
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
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 18px;
}
.acc2-action-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
  padding: 16px 24px;
  background: var(--a);
  border: none;
  border-radius: 16px;
  color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 52px;
  box-shadow: 0 8px 24px -6px rgba(88,204,2,.45);
  -webkit-tap-highlight-color: transparent;
  transition: transform .14s cubic-bezier(.34,1.56,.64,1), box-shadow .14s;
}
.acc2-action-btn:active { transform: scale(.96); box-shadow: 0 4px 12px -4px rgba(88,204,2,.4); }

/* ═══════════════════════ BELOW FOLD ═══════════════════════════ */
.acc2-section-title {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin: 28px 20px 12px;
}

/* ── Chest teaser ── */
.acc2-chest-teaser {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, rgba(88,204,2,.08), rgba(88,204,2,.04));
  border: 1.5px solid rgba(88,204,2,.2);
  border-radius: 18px;
  padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer;
  transition: border-color .14s, transform .14s;
  animation: acc2ChestIn .4s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes acc2ChestIn {
  from { opacity:0; transform:translateY(8px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@media (hover:hover) and (pointer:fine) {
  .acc2-chest-teaser:hover { border-color: rgba(88,204,2,.4); }
}
.acc2-chest-teaser:active { transform: scale(.98); }
.acc2-ct-ico { font-size: 28px; flex-shrink: 0; }
.acc2-ct-text { flex: 1; min-width: 0; }
.acc2-ct-title {
  font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
}
.acc2-ct-sub {
  font: 500 12px/1 'Inter', sans-serif;
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
  border-radius: 20px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: transform .15s, box-shadow .15s;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.world-card:active { transform: scale(.97); }
.world-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; min-height: 56px; }
.world-ico  { font-size: 22px; line-height: 1; }
.world-img  { width: 56px; height: 56px; object-fit: contain; display: block; filter: drop-shadow(0 2px 6px rgba(11,13,26,.12)); transition: transform .3s; }
.world-card[data-world="C2"] .world-img { transform: scale(1.18); }
.world-card:hover .world-img { transform: scale(1.1) rotate(-3deg); }
.world-card[data-world="C2"]:hover .world-img { transform: scale(1.28) rotate(-3deg); }
.world-card[data-complete="true"] .world-img { animation: worldFloat2 2.8s ease-in-out infinite; }
@keyframes worldFloat2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@media (prefers-reduced-motion: reduce) { .world-card[data-complete="true"] .world-img { animation: none; } }
.world-pct  { font: 700 13px/1 'Inter', sans-serif; }
.world-name { font: 600 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-bottom: 8px; }
.world-track { height: 4px; background: var(--bo); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.world-fill  { height: 100%; border-radius: 2px; transition: width .5s ease; }
.world-count { font: 500 11px/1 'Inter', sans-serif; color: var(--mu2); }
.world-crown { position: absolute; top: 10px; right: 10px; }

.trophees-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 16px 6px;
  margin-bottom: 8px;
  scrollbar-width: none;
}
.trophees-row::-webkit-scrollbar { display: none; }
.trophy-card {
  flex-shrink: 0; width: 120px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 14px 10px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
  cursor: pointer;
}
.trophy-unlocked {
  border-color: color-mix(in srgb, var(--tc) 35%, transparent);
  background: color-mix(in srgb, var(--tc) 6%, #fff);
  position: relative; overflow: hidden;
}
.trophy-unlocked::after {
  content: '';
  position: absolute; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.14) 50%, transparent 60%);
  animation: shimmerTrophy 2.5s ease-in-out infinite;
}
@keyframes shimmerTrophy { 0% { transform: translateX(-100%) rotate(15deg); } 100% { transform: translateX(100%) rotate(15deg); } }
.trophy-ico     { font-size: 28px; line-height: 1; margin-bottom: 8px; display: block; }
.trophy-ico-dim { opacity: .35; filter: grayscale(1); }
.trophy-label   { font: 600 11px/1.3 'Inter', sans-serif; color: var(--ink); margin-bottom: 4px; }
.trophy-state   { font: 500 10px/1 'Inter', sans-serif; color: var(--mu2); }
.trophy-unlocked .trophy-state { color: var(--tc); }
.trophy-next-bar { height: 3px; background: var(--bo); border-radius: 2px; overflow: hidden; margin: 5px 0 4px; }
.trophy-next-fill { height: 100%; border-radius: 2px; }
.trophees-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px; background: var(--bg); border: 1.5px dashed #d1d8ee;
  border-radius: 20px; text-align: center;
}
.trophees-empty-ico { font-size: 28px; opacity: .3; }
.trophees-empty-txt { font: 500 12px/1.5 'Inter', sans-serif; color: var(--mu2); }

.acc2-footer {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px;
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  margin: 0 16px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.footer-stat { flex: 1; }
.footer-val  { font: 800 20px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 3px; }
.footer-lbl  { font: 500 11px/1.3 'Inter', sans-serif; color: var(--mu2); }
.footer-sep  { width: 1px; height: 38px; background: var(--bo); flex-shrink: 0; }

/* Leaderboard slot */
.acc-lb {
  display: flex; align-items: center; gap: 14px;
  margin: 0 16px 16px;
  background: linear-gradient(135deg, rgba(88,204,2,.15) 0%, rgba(88,204,2,.05) 100%);
  border: 1.5px solid rgba(88,204,2,.28);
  border-radius: 20px;
  padding: 14px 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px -6px rgba(88,204,2,.35);
  -webkit-tap-highlight-color: transparent;
  transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease, border-color .15s ease;
}
.acc-lb::before {
  content: ''; position: absolute; top: -45%; right: -12%;
  width: 130px; height: 130px; pointer-events: none;
  background: radial-gradient(circle, rgba(88,204,2,.20), transparent 70%);
}
.acc-lb:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 22px -7px rgba(88,204,2,.45);
  border-color: rgba(88,204,2,.45);
}
.acc-lb:active { transform: scale(.98); }
.acc-lb:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; }

.acc-lb-rank {
  flex-shrink: 0; width: 52px; height: 52px; border-radius: 15px;
  display: flex; align-items: center; justify-content: center;
  background: var(--a); color: #fff;
  box-shadow: 0 5px 13px -3px rgba(88,204,2,.6);
  font: 800 19px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.03em;
  position: relative; z-index: 1;
}
.acc-lb-rank.empty { background: rgba(88,204,2,.16); color: var(--a); font-size: 24px; box-shadow: none; }
.acc-lb-rank.img { background: transparent; box-shadow: none; padding: 0; }
.acc-lb-rank.img img { width: 52px; height: 52px; object-fit: contain; display: block; }
.acc-lb-rank-hash { font-size: 12px; font-weight: 700; opacity: .75; margin-right: 1px; }

.acc-lb-main { flex: 1; min-width: 0; position: relative; z-index: 1; }
.acc-lb-eyebrow {
  font: 700 10px/1 'Inter', sans-serif; color: var(--a);
  letter-spacing: .08em; text-transform: uppercase; margin-bottom: 5px;
}
.acc-lb-body {
  font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  letter-spacing: -.02em; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.acc-lb-chip {
  font: 700 11px/1 'Inter', sans-serif; color: var(--am);
  background: rgba(245,158,11,.14); border-radius: 99px; padding: 4px 9px;
}
.acc-lb-sub { font: 500 12px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

.acc-lb-arrow {
  flex-shrink: 0; color: var(--a); display: flex; align-items: center;
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
  z-index: 495; background: #fff;
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
  border: 1.5px solid #bfdbfe; border-radius: 16px;
  color: var(--blk2); font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; min-height: 52px;
  transition: transform .15s, opacity .15s;
}
.bs-freeze-btn:active { transform: scale(.98); opacity: .9; }
.bs-freeze-btn:disabled { opacity: .55; cursor: default; }
.bs-freeze-desc { font: 500 11px/1.4 'Inter', sans-serif; color: var(--mu3); text-align: center; margin-top: 7px; }
</style>`;

// ─── Constantes ──────────────────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
const LEVEL_NAMES   = ['', 'Débutant', 'Apprenti', 'Conducteur', 'Confirmé', 'Expert', 'Pro', 'As du Volant'];
const WORLD_IMAGES  = [ASSETS.worldC1, ASSETS.worldC2, ASSETS.worldC3, ASSETS.worldC4];
const WORLDS = REMC.map((cat, i) => ({
  id: cat.id, ico: cat.ico, image: WORLD_IMAGES[i] || null,
  name: cat.name, subs: cat.subs, total: cat.subs.length,
  color: ['var(--gr2)', 'var(--bl2)', '#eab308', 'var(--pul)'][i],
}));

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'eleve_accueil' });

  root.innerHTML = SKELETON;

  try {
    // Core fetches en parallèle
    const [profileRes, streakRes, validRes, notifRes, attemptsRes] = await Promise.allSettled([
      sb.from('profiles').select('prenom, xp, last_active_at, first_value_action_at, gemmes').eq('id', me.id).maybeSingle(),
      sb.from('streaks').select('current_streak, last_activity_date, longest_streak').eq('user_id', me.id).maybeSingle(),
      sb.from('validations').select('competence_id, statut').eq('eleve_id', me.id).in('statut', ['acquis', 'a_valider']),
      sb.from('notifications').select('id, data, type').eq('user_id', me.id).eq('read', false)
        .in('type', ['consolidation_quiz', 'post_validation_quiz']).order('created_at', { ascending: false }).limit(1),
      sb.from('quiz_attempts').select('completed_at').eq('user_id', me.id)
        .gte('completed_at', new Date(Date.now() - 35 * 86400000).toISOString()).order('completed_at', { ascending: true }),
    ]);

    // RPCs optionnels (peuvent ne pas exister encore)
    const [pendingSessionsRes, todayQuestsRes] = await Promise.allSettled([
      sb.rpc('get_pending_sessions_eleve'),
      sb.rpc('get_today_quests'),
    ]);

    const profile        = profileRes.value?.data  || { prenom: me.prenom || 'Toi', xp: 0 };
    const streak         = streakRes.value?.data   || { current_streak: 0, last_activity_date: null, longest_streak: 0 };
    const allValRows     = validRes.value?.data || [];
    const validated      = new Set(allValRows.filter(v => v.statut === 'acquis').map(v => v.competence_id));
    const pendingNotif   = notifRes.value?.data?.[0] || null;
    const activityDays   = buildActivityData(attemptsRes.value?.data || [], streak);
    const pendingSessions = pendingSessionsRes.value?.data || [];
    const todayQuests    = todayQuestsRes.value?.data || [];

    ensureHeatmapStyles();

    const lvl      = computeLevel(profile.xp || 0);
    const worlds   = computeWorlds(validated);
    const trophees = computeTrophees(worlds);
    const streakSt = streakStatus(streak);
    const gemmes   = profile.gemmes || 0;

    track('streak.viewed', { days: streak.current_streak, status: streakSt });

    root.innerHTML = render({ me, profile, lvl, streak, streakSt, worlds, trophees,
                              activityDays, gemmes, pendingSessions, todayQuests, pendingNotif });
    wire(root, { streak, streakSt, gemmes, activityDays, pendingSessions, todayQuests, pendingNotif });

    const accDiv = root.querySelector('.acc2');

    // Composants non-bloquants injectés sous le fold
    if (accDiv) {
      // Quêtes du jour — carrousel réclamable, juste sous l'action du jour
      const actionEl = accDiv.querySelector('.acc2-action');
      if (actionEl) {
        const dqHost = document.createElement('div');
        dqHost.style.cssText = 'margin:16px 16px 0';
        actionEl.insertAdjacentElement('afterend', dqHost);
        Promise.resolve().then(() => mountDailyQuests(dqHost)).catch(() => {});
      }
      Promise.resolve().then(() => mountFeedbackFeed(accDiv, { eleveId: me.id, limit: 5 })).catch(() => {});
      Promise.resolve().then(() => mountRevisionCards(accDiv, { eleveId: me.id, limit: 3 })).catch(() => {});
    }

    // Leaderboard async
    _loadAndInjectLeaderboard(root);

    // Bannière émotionnelle — insérée juste après le hero
    emotionalBanner.checkAndRender(root, { afterSelector: '.acc2-hero' }).catch(() => {});

    // Quiz éclair actif poussé par le moniteur — bandeau prioritaire
    _loadAndInjectFlashQuiz(root, me).catch(() => {});

    // Coffres disponibles — teaser non-bloquant injecté sous l'action du jour
    _loadAndInjectChests(root);

    // Crystal Ball — prédiction de réussite (au-dessus du parcours REMC)
    _loadAndInjectCrystalBall(root).catch(() => {});

    // Onboarding premier login : géré en amont par main.js (page plein écran
    // pages/onboarding/index.js, gate first_value_action_at). Rien à faire ici.

    // Push web (soft, après 5s)
    if (profile.first_value_action_at) {
      maybeSoftRequestPush();
      maybeSendStreakRiskNotif();
      const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
      maybePlayWeeklyReplay({ compsValidated: totalValidated, monsReview: null, streak: streak.current_streak });
    }
  } catch (e) {
    console.error('[accueil] mount failed', e);
    root.innerHTML = `<div style="padding:60px 24px;text-align:center;color:var(--mu3);font-family:'Inter',sans-serif">
      <div style="font:800 18px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:8px">Oups, ton accueil a du mal à charger</div>
      <p style="font-size:14px;margin:0 0 20px">Vérifie ta connexion et réessaie.</p>
      <button id="acc-reload" style="padding:12px 24px;border:0;background:var(--a);color:#fff;border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer">Recharger</button>
    </div>`;
    root.querySelector('#acc-reload')?.addEventListener('click', () => location.reload());
  }
}

// ─── Logique métier ───────────────────────────────────────────────
function computeLevel(xp) {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const min = XP_THRESHOLDS[level - 1] ?? 0;
  const max = XP_THRESHOLDS[level] ?? XP_THRESHOLDS.at(-1);
  const pct = max > min ? Math.min(100, Math.round(((xp - min) / (max - min)) * 100)) : 100;
  return { level, name: LEVEL_NAMES[level] ?? `Niv. ${level}`, xp, min, max, pct };
}

function computeWorlds(validatedIds) {
  return WORLDS.map(w => {
    const done = w.subs.filter(s => validatedIds.has(s.c)).length;
    const pct  = w.total > 0 ? Math.round((done / w.total) * 100) : 0;
    return { ...w, done, pct, complete: w.total > 0 && done === w.total };
  });
}

function computeTrophees(worlds) {
  const unlocked   = worlds.filter(w => w.complete);
  const inProgress = worlds.filter(w => !w.complete).sort((a, b) => b.pct - a.pct);
  return { unlocked, nextUp: inProgress[0] ?? null };
}

function streakStatus(streak) {
  if (!streak.current_streak) return 'broken';
  const today = new Date().toISOString().slice(0, 10);
  if (streak.last_activity_date === today) return 'saved';
  const hoursLeft = 24 - new Date().getHours() - new Date().getMinutes() / 60;
  return hoursLeft < 6 ? 'critical' : 'at_risk';
}

// ─── Render ───────────────────────────────────────────────────────
function render({ me, profile, lvl, streak, streakSt, worlds, trophees,
                  activityDays, gemmes, pendingSessions, todayQuests, pendingNotif }) {
  const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
  const prenom   = profile.prenom || me.prenom || 'Toi';
  const initials = prenom.slice(0, 2).toUpperCase();
  const heroAv   = getEquippedAsset('avatar') || me.avatar_url || null;
  const isActive = streakSt !== 'broken';

  // ── BLOC 2 content ──
  const pendingSession = pendingSessions?.[0] ?? null;
  const bloc2 = pendingSession
    ? renderSessionConfirm(pendingSession)
    : renderNextReward(totalValidated, worlds, trophees);

  // ── BLOC 3 content ──
  // Les quêtes du jour ont leur propre carrousel (mountDailyQuests). L'action
  // du jour reste contextuelle (quiz en attente / 1re compétence / examen).
  const bloc3 = renderActionDuJour(null, pendingNotif, totalValidated);

  return `${STYLE}
<div class="acc2">

  <!-- ══ BLOC 1 — HERO ══ -->
  <div class="acc2-hero">
    <div class="acc2-hero-content">
      <div class="acc2-hero-top">
        <div class="acc2-hero-av">${heroAv ? `<img src="${esc(heroAv)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block">` : esc(initials)}</div>
        <span class="acc2-hero-hi">Bonjour ${esc(prenom)}</span>
        <button class="acc2-hero-notif-btn" id="notif-btn" aria-label="Notifications">
          ${icon('bell', { size: 18 })}
        </button>
      </div>
      <h1 class="acc2-hero-title" tabindex="-1"><span class="acc2-hero-niv-badge">${esc(lvl.name)}</span></h1>
      <div class="acc2-hero-meta">
        <div class="acc2-hero-xp-pill">
          ${icon('zap', { size: 13 })}
          ${lvl.xp} XP · Niv. ${lvl.level}
        </div>
        ${streak.current_streak > 0 ? `
        <div class="acc2-hero-streak ${isActive ? 'active' : ''}" id="streak-badge-btn" role="button" tabindex="0" aria-label="Streak ${streak.current_streak} jours">
          <span class="acc2-hero-streak-fire">${icon('flame',{size:16})}</span>
          <span class="acc2-hero-streak-val">${streak.current_streak}</span>
          <span class="acc2-hero-streak-lbl">jours</span>
        </div>` : ''}
      </div>
      <div class="acc2-xp-bar-wrap">
        <div class="acc2-xp-bar">
          <div class="acc2-xp-fill" style="width:0%" data-target="${lvl.pct}"></div>
        </div>
        <span class="acc2-xp-hint">${lvl.pct}% vers ${esc(LEVEL_NAMES[lvl.level + 1] ?? 'max')}</span>
      </div>
    </div>
  </div>

  <!-- ══ BLOC 2 — NEXT MILESTONE ══ -->
  <div class="acc2-ms">${bloc2}</div>

  <!-- ══ BLOC 3 — ACTION DU JOUR ══ -->
  ${bloc3}

  <!-- ══ BELOW FOLD ══ -->
  <div class="acc2-section-title">Mon parcours REMC</div>
  <div class="worlds-grid">
    ${worlds.map(w => `
      <div class="world-card" data-world="${esc(w.id)}" data-complete="${w.complete ? 'true' : 'false'}">
        <div class="world-top">
          ${w.image
            ? `<img class="world-img" src="${esc(w.image)}" alt="${esc(w.name)}" loading="lazy">`
            : `<span class="world-ico">${w.ico}</span>`}
          <span class="world-pct" style="color:${w.color}">${w.pct}%</span>
        </div>
        <div class="world-name">${esc(w.name)}</div>
        <div class="world-track"><div class="world-fill" style="width:${w.pct}%;background:${w.color}"></div></div>
        <div class="world-count">${w.done}/${w.total}</div>
        ${w.complete ? `<div class="world-crown">${icon('award', { size: 14 })}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <!-- Leaderboard slot -->
  <div id="acc-lb-slot"></div>

  <!-- Stats footer -->
  <div class="acc2-footer">
    <div class="footer-stat">
      <div class="footer-val">${totalValidated}<span style="font-size:.55em;color:var(--mu2)">/31</span></div>
      <div class="footer-lbl">compétences acquises</div>
    </div>
    <div class="footer-sep"></div>
    <div class="footer-stat">
      <div class="footer-val">${Math.max(0, 28 - totalValidated)}</div>
      <div class="footer-lbl">avant l'examen blanc</div>
    </div>
  </div>

</div>

<!-- STREAK BOTTOM SHEET -->
<div class="bs-bg" id="bs-bg"></div>
<div class="bs-streak" id="bs-streak" role="dialog" aria-label="Détail série">
  <div class="bs-handle"></div>
  <div class="bs-hd">
    <div class="bs-hd-title">Série d'apprentissage</div>
    <div class="bs-hd-sub">Record : ${streak.longest_streak} jour${streak.longest_streak > 1 ? 's' : ''} · En cours : ${streak.current_streak}</div>
  </div>
  <div class="bs-hmap-wrap">
    <div class="bs-hmap-head">
      <span class="bs-hmap-title">Mon mois</span>
      <span class="bs-hmap-sub">${activityDays.totalActive} jour${activityDays.totalActive > 1 ? 's' : ''} actif${activityDays.totalActive > 1 ? 's' : ''}</span>
    </div>
    ${renderHeatmap({ activeDates: activityDays.activeDates, activityLevels: activityDays.levels, activityDetails: activityDays.details, weeks: 5, title: '' })}
    <div class="hmap-tap-info" id="hmap-info" style="opacity:0"> </div>
  </div>
  ${(streakSt === 'critical' || streakSt === 'at_risk') && gemmes >= 50 ? `
  <div class="bs-freeze-wrap">
    <button class="bs-freeze-btn" id="bs-freeze-btn">Geler ma série · 50 ${icon('gem',{size:14})}</button>
    <div class="bs-freeze-desc">Protège ta série pour les prochaines 24h</div>
  </div>` : ''}
</div>`;
}

// ─── Bloc 2 renderers ────────────────────────────────────────────

function renderSessionConfirm(session) {
  const prenom   = session.moniteur_prenom ?? 'Ton moniteur';
  const initials = prenom.slice(0, 2).toUpperCase();
  const dateStr  = session.session_date
    ? new Date(session.session_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
    : 'Récemment';
  const durStr   = session.duration_minutes ? `${session.duration_minutes} min` : '';
  const sub      = [dateStr, durStr].filter(Boolean).join(' · ');

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
        ${icon('check', { size: 16, strokeWidth: 2.8 })}
        Confirmer la séance
      </button>
    </div>`;
}

function renderNextReward(totalValidated, worlds, trophees) {
  // Calcule la prochaine récompense : monde le plus avancé non terminé
  const nextWorld = trophees.nextUp;
  if (!nextWorld) {
    return `
      <div class="acc2-ms-reward">
        <div class="acc2-ms-reward-inner">
          <div class="acc2-ms-reward-label">Parcours complété !</div>
          <div class="acc2-ms-reward-top">
            <div class="acc2-ms-reward-icon">${icon('award', { size: 28 })}</div>
            <div class="acc2-ms-reward-info">
              <div class="acc2-ms-reward-remaining"><span>Tous les mondes maîtrisés</span></div>
              <div class="acc2-ms-reward-name">Tu es prêt pour l'examen</div>
            </div>
          </div>
          <button class="acc2-ms-cta-btn" data-href="#/trophees">
            Voir mes trophées ${icon('arrow-right', { size: 14 })}
          </button>
        </div>
      </div>`;
  }

  const remaining  = nextWorld.total - nextWorld.done;
  const pct        = nextWorld.pct;

  return `
    <div class="acc2-ms-reward">
      <div class="acc2-ms-reward-inner">
        <div class="acc2-ms-reward-label">Prochain objectif</div>
        <div class="acc2-ms-reward-top">
          <div class="acc2-ms-reward-icon">
            <span style="font-size:28px;line-height:1">${nextWorld.ico}</span>
          </div>
          <div class="acc2-ms-reward-info">
            <div class="acc2-ms-reward-remaining">
              ${remaining}
              <span>compétence${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}</span>
            </div>
            <div class="acc2-ms-reward-name">Trophée ${esc(nextWorld.name)}</div>
          </div>
        </div>
        <div class="acc2-ms-prog-bar">
          <div class="acc2-ms-prog-fill" style="width:0%" data-target="${pct}"></div>
        </div>
        <div class="acc2-ms-prog-meta">
          <span>${nextWorld.done}/${nextWorld.total} compétences</span>
          <span>${pct}%</span>
        </div>
        <button class="acc2-ms-cta-btn" data-href="#/parcours">
          Continuer le parcours ${icon('arrow-right', { size: 14 })}
        </button>
      </div>
    </div>`;
}

function renderActionDuJour(quest, pendingNotif, totalValidated) {
  let label = 'Action du jour';
  let title, sub, btnText, href, urgent = false;

  // Le quiz n'est plus une porte de validation : on ne pousse plus 'a_valider' en URGENT.
  // L'invitation au quiz-récap (optionnel) vient d'une notif quiz non lue.
  if (quest) {
    title   = quest.label ?? 'Quiz disponible';
    sub     = quest.sub ?? '';
    btnText = 'Commencer →';
    href    = quest.href ?? '#/parcours';
    urgent  = quest.type === 'consolidation_quiz';
  } else if (pendingNotif?.data?.competence_id) {
    const isConsolid = pendingNotif.type === 'consolidation_quiz';
    title   = isConsolid ? 'Quiz de consolidation' : 'Quiz-récap (optionnel)';
    sub     = isConsolid ? '2 questions · 30 secondes · Renforce ta mémoire' : 'Compétence déjà acquise — un petit récap pour le plaisir.';
    btnText = isConsolid ? 'Commencer →' : 'Faire le récap →';
    href    = `#/quiz/${pendingNotif.data.competence_id}/${isConsolid ? 'consolidation' : 'post_validation'}`;
    urgent  = isConsolid;
  } else if (totalValidated === 0) {
    title   = 'Lance ton parcours REMC';
    sub     = 'Découvre les 31 compétences à maîtriser avant l\'examen';
    btnText = 'Voir le parcours →';
    href    = '#/parcours';
  } else {
    title   = 'Ton parcours d\'examen';
    sub     = '5 parcours · 15 questions · estime tes chances au permis';
    btnText = 'Démarrer l\'examen →';
    href    = '#/exam-blanc';
  }

  return `
    <div class="acc2-action">
      <div class="acc2-action-tag">
        <div class="acc2-action-tag-dot${urgent ? ' urgent' : ''}"></div>
        ${esc(label)}
        ${urgent ? `<span style="color:var(--rd);font-weight:700">URGENT</span>` : ''}
      </div>
      <div class="acc2-action-title">${esc(title)}</div>
      <div class="acc2-action-sub">${esc(sub)}</div>
      <button class="acc2-action-btn" id="action-cta-btn" data-href="${esc(href)}">
        ${esc(btnText)}
        ${icon('arrow-right', { size: 16 })}
      </button>
    </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, { streak, streakSt, gemmes, activityDays, pendingSessions, todayQuests, pendingNotif }) {
  // XP bar animation
  const xpFill = root.querySelector('.acc2-xp-fill[data-target]');
  if (xpFill) setTimeout(() => { xpFill.style.width = xpFill.dataset.target + '%'; }, 120);

  // BLOC 2 progress bar animation
  const msFill = root.querySelector('.acc2-ms-prog-fill[data-target]');
  if (msFill) setTimeout(() => { msFill.style.width = msFill.dataset.target + '%'; }, 300);

  // Notif btn → notifications
  root.querySelector('#notif-btn')?.addEventListener('click', () => {
    track('cta.clicked', { cta_type: 'notif_btn' });
    navigate('#/notifications');
  });

  // Streak badge → bottom sheet
  const bsBg     = root.querySelector('#bs-bg');
  const bsSheet  = root.querySelector('#bs-streak');
  const openBS   = () => { bsSheet?.classList.add('open'); bsBg?.classList.add('open'); track('streak.detail_opened', { days: streak?.current_streak }); };
  const closeBS  = () => { bsSheet?.classList.remove('open'); bsBg?.classList.remove('open'); };
  root.querySelector('#streak-badge-btn')?.addEventListener('click', openBS);
  bsBg?.addEventListener('click', closeBS);

  // Streak freeze
  root.querySelector('#bs-freeze-btn')?.addEventListener('click', async () => {
    const btn = root.querySelector('#bs-freeze-btn');
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.textContent = '⏳ Gel en cours…';
    try {
      const { data, error } = await sb.rpc('use_streak_freeze');
      if (error || data?.error) {
        toast('Pas assez de gemmes pour geler ta série. Il t\'en faut 50 gemmes', 'error');
        setTimeout(() => { btn.disabled = false; btn.innerHTML = `Geler ma série · 50 ${icon('gem',{size:14})}`; }, 1800);
        return;
      }
      track('streak.freeze_used', {});
      toast('Série gelée pour 24h', 'success');
      btn.textContent = '✓ Série gelée';   // évite de laisser "⏳ Gel en cours…" figé
      closeBS();
    } catch { toast('Erreur lors du gel', 'error'); btn.disabled = false; btn.innerHTML = `Geler ma série · 50 ${icon('gem',{size:14})}`; }
  });

  // Heatmap tap
  const infoEl = root.querySelector('#hmap-info');
  root.querySelectorAll('.hmap-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const label  = cell.dataset.label;
      const detail = cell.dataset.detail ? decodeURIComponent(cell.dataset.detail) : null;
      if (!label || !infoEl) return;
      infoEl.textContent = detail || label;
      infoEl.style.opacity = '1';
      clearTimeout(infoEl._t);
      infoEl._t = setTimeout(() => { infoEl.style.opacity = '0'; }, 2500);
    });
  });

  // Session confirm btn
  root.querySelector('#confirm-session-btn')?.addEventListener('click', async (e) => {
    const btn       = e.currentTarget;
    const sessionId = btn.dataset.sessionId;
    if (!sessionId) return;
    haptic('select');
    track('session.confirm_tapped', { session_id: sessionId });
    navigate(`#/sessions/${sessionId}`);
  });

  // BLOC 2 CTA (next reward btn)
  root.querySelector('.acc2-ms-cta-btn')?.addEventListener('click', (e) => {
    const href = e.currentTarget.dataset.href;
    if (href) { haptic('tap'); track('cta.clicked', { cta_type: 'ms_cta' }); navigate(href); }
  });

  // BLOC 3 action btn
  root.querySelector('#action-cta-btn')?.addEventListener('click', (e) => {
    const href = e.currentTarget.dataset.href;
    if (href) { haptic('select'); track('cta.clicked', { cta_type: 'action_btn' }); navigate(href); }
  });

  // World cards → parcours
  root.querySelectorAll('[data-world]').forEach(el => {
    el.addEventListener('click', () => {
      track('cta.clicked', { cta_type: 'world_card', world: el.dataset.world });
      navigate('#/parcours');
    });
  });

  // Trophy cards → trophées
  root.querySelectorAll('.trophy-card').forEach(card => {
    card.addEventListener('click', () => {
      track('cta.clicked', { cta_type: 'trophy_card' });
      navigate('#/trophees');
    });
  });
}

// ─── Leaderboard async ───────────────────────────────────────────
async function _loadAndInjectLeaderboard(root) {
  try {
    const { data, error } = await sb.rpc('get_my_leaderboard_position');
    if (error || !data || data?.error) return;
    const slot = root.querySelector('#acc-lb-slot');
    if (!slot) return;
    const rank = data.my_rank, total = data.total_eleves, pct = data.percentile;
    const ranked = (rank !== null && total !== null && total > 1);

    const badge = ranked
      ? `<div class="acc-lb-rank"><span class="acc-lb-rank-hash">#</span>${esc(String(rank))}</div>`
      : `<div class="acc-lb-rank img"><img src="/skins/badge-3d-ultimate.png" alt="" width="52" height="52" loading="lazy"></div>`;
    const chip = pct !== null ? `<span class="acc-lb-chip">Top ${100 - pct}%</span>` : '';
    const bodyText = ranked ? `Tu es #${rank} sur ${total}` : 'Clique pour voir ton classement';
    const sub = ranked
      ? (pct !== null ? `Dans le top ${100 - pct}% de ton auto-école` : 'Garde le rythme pour grimper')
      : 'Invite tes potes pour lancer le classement';

    const ARROW = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    slot.innerHTML = `
      <div class="acc-lb" id="acc-lb-card" role="button" tabindex="0" aria-label="Voir le classement de l'école">
        ${badge}
        <div class="acc-lb-main">
          <div class="acc-lb-eyebrow">Classement de l'école</div>
          <div class="acc-lb-body">${esc(bodyText)}${chip}</div>
          <div class="acc-lb-sub">${esc(sub)}</div>
        </div>
        <div class="acc-lb-arrow">${ARROW}</div>
      </div>`;

    const card = slot.querySelector('#acc-lb-card');
    const open = () => {
      track('leaderboard.tapped', { rank: data.my_rank, percentile: data.percentile });
      navigate('#/classement');
    };
    card?.addEventListener('click', open);
    card?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  } catch (e) { console.error('[accueil] leaderboard', e); }
}

async function _loadAndInjectCrystalBall(root) {
  try {
    if (root.querySelector('#acc-crystal')) return; // anti double-mount
    const { data } = await sb.rpc('get_my_prediction');
    const p = Array.isArray(data) ? data[0] : data;
    if (!p) return;

    const anchor = root.querySelector('.acc2-section-title');
    if (!anchor) return;

    if (!document.getElementById('acc-crystal-styles')) {
      const st = document.createElement('style');
      st.id = 'acc-crystal-styles';
      st.textContent = `
        .acc2-crystal{margin:18px 16px 0;padding:20px 20px 24px;border-radius:22px;color:#fff;position:relative;overflow:hidden;
          background:linear-gradient(160deg,#3b1f8f 0%,#5b21b6 45%,#2e2a72 100%);box-shadow:0 14px 40px -12px rgba(91,33,182,.7);
          animation:cbIn .45s cubic-bezier(.23,1,.32,1)}
        @keyframes cbIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .acc2-crystal::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.7;
          background:radial-gradient(1px 1px at 18% 24%,rgba(255,255,255,.55),transparent),
                     radial-gradient(1px 1px at 72% 16%,rgba(255,255,255,.45),transparent),
                     radial-gradient(1.5px 1.5px at 88% 58%,rgba(255,255,255,.4),transparent),
                     radial-gradient(1px 1px at 38% 82%,rgba(255,255,255,.32),transparent),
                     radial-gradient(1px 1px at 60% 90%,rgba(255,255,255,.3),transparent)}
        .acc2-cb-head{display:flex;align-items:center;gap:8px;font:700 12px/1 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:14px;position:relative;z-index:2}
        /* ── Boule de cristal (CSS) ── */
        .cb-stage{display:flex;justify-content:center;position:relative;z-index:2}
        .cb-orb{position:relative;width:150px;height:150px;display:flex;align-items:center;justify-content:center}
        .cb-orb-glow{position:absolute;inset:-20%;border-radius:50%;filter:blur(7px);
          background:radial-gradient(circle,rgba(167,139,250,.7) 0%,rgba(139,92,246,.28) 45%,transparent 70%);
          animation:cbAura 3.4s ease-in-out infinite}
        @keyframes cbAura{0%,100%{opacity:.5;transform:scale(.95)}50%{opacity:1;transform:scale(1.07)}}
        .cb-orb-glass{position:relative;width:100%;height:100%;border-radius:50%;overflow:hidden;border:1px solid rgba(255,255,255,.18);
          background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.6) 0%,rgba(255,255,255,0) 24%),
                     radial-gradient(circle at 50% 48%,rgba(196,181,253,.55) 0%,rgba(124,58,237,.6) 55%,rgba(72,28,140,.92) 100%);
          box-shadow:inset 0 -14px 30px rgba(46,16,101,.85),inset 0 12px 24px rgba(255,255,255,.22),
            0 0 32px rgba(167,139,250,.55),0 10px 20px rgba(18,9,38,.5)}
        .cb-orb-shine{position:absolute;top:-60%;width:55%;height:220%;pointer-events:none;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
          transform:rotate(18deg);animation:cbSweep 4.4s ease-in-out infinite}
        @keyframes cbSweep{0%{left:-45%}60%{left:125%}100%{left:125%}}
        .cb-orb-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:1;font:800 46px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:-.03em;color:#fff;
          text-shadow:0 1px 0 rgba(255,255,255,.55),0 -1px 1px rgba(72,28,140,.6),0 3px 8px rgba(18,9,38,.55);
          animation:cbPulse 3.4s ease-in-out infinite}
        .cb-orb-num .cb-pct{font-size:24px;opacity:.92;margin-left:1px}
        @keyframes cbPulse{0%,100%{filter:drop-shadow(0 0 4px rgba(196,181,253,.5))}50%{filter:drop-shadow(0 0 13px rgba(224,210,255,.95))}}
        .acc2-cb-msg{font:600 14.5px/1.4 'Inter',sans-serif;color:rgba(255,255,255,.94);margin:8px 0 0;text-align:center;position:relative;z-index:2}
        .acc2-cb-axes-lbl{font:600 12px/1 'Inter',sans-serif;color:rgba(255,255,255,.8);margin:16px 0 8px;text-align:center;position:relative;z-index:2}
        .acc2-cb-chips{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;position:relative;z-index:2}
        .acc2-cb-chip{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.24);border-radius:999px;padding:6px 12px;font:700 12.5px/1 'Inter',sans-serif;color:#fff}
        .acc2-cb-empty{margin:18px 16px 0;padding:18px 20px;border-radius:18px;background:var(--bg3);color:var(--mu2);font:600 13.5px/1.4 'Inter',sans-serif;display:flex;align-items:center;gap:10px}
        @media (prefers-reduced-motion:reduce){.cb-orb-glow,.cb-orb-shine,.cb-orb-num{animation:none}}
      `;
      document.head.appendChild(st);
    }

    const pct = Math.max(0, Math.min(99, p.prediction_pct ?? 0));

    if ((p.validated_count ?? 0) === 0) {
      anchor.insertAdjacentHTML('beforebegin',
        `<div class="acc2-cb-empty" id="acc-crystal"><span style="font-size:22px">🔮</span><span>Valide ta 1ʳᵉ compétence pour débloquer ta boule de cristal.</span></div>`);
      track('crystal_ball.viewed', { prediction_pct: 0, validated_count: 0 });
      return;
    }

    const CAT_NAMES = Object.fromEntries((REMC || []).map(c => [c.id, c.name]));
    const axes = (p.axes_to_improve || []).map(code => CAT_NAMES[code] || code);
    const msg = pct >= 80 ? "de chances de décrocher ton permis au 1er coup 🔥"
              : pct >= 55 ? "de chances de réussir ton permis au 1er coup"
              : "de chances pour l'instant — chaque jour compte";

    anchor.insertAdjacentHTML('beforebegin', `
      <div class="acc2-crystal" id="acc-crystal">
        <div class="acc2-cb-head"><span aria-hidden="true">🔮</span> Boule de cristal</div>
        <div class="cb-stage">
          <div class="cb-orb">
            <div class="cb-orb-glow" aria-hidden="true"></div>
            <div class="cb-orb-glass">
              <div class="cb-orb-shine" aria-hidden="true"></div>
              <div class="cb-orb-num"><span class="acc2-cb-val">0</span><span class="cb-pct">%</span></div>
            </div>
          </div>
        </div>
        <p class="acc2-cb-msg">${esc(msg)}</p>
      </div>`);

    track('crystal_ball.viewed', { prediction_pct: pct, validated_count: p.validated_count });

    // Count-up
    const valEl = root.querySelector('#acc-crystal .acc2-cb-val');
    if (valEl) {
      const reduce = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { valEl.textContent = String(pct); }
      else {
        const t0 = performance.now(), dur = 1100;
        const tick = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          valEl.textContent = String(Math.round(pct * eased));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  } catch (e) { /* silent */ }
}

async function _loadAndInjectChests(root) {
  try {
    const chests = await getMyChests();
    const pending = chests.filter(c => !c.opened_at);
    if (!pending.length) return;

    // Inject a teaser card just before the worlds grid
    const anchor = root.querySelector('.acc2-section-title');
    if (!anchor) return;

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="acc2-chest-teaser" id="acc-chest-teaser" role="button" tabindex="0"
           aria-label="${pending.length} coffre${pending.length > 1 ? 's' : ''} à ouvrir">
        <span class="acc2-ct-ico">${icon('gift',{size:18})}</span>
        <div class="acc2-ct-text">
          <div class="acc2-ct-title">${pending.length} coffre${pending.length > 1 ? 's' : ''} à ouvrir</div>
          <div class="acc2-ct-sub">Réclame tes récompenses</div>
        </div>
        <div class="acc2-ct-arrow">${icon('chevron-right', { size: 16, strokeWidth: 2.5, color: 'var(--a)' })}</div>
      </div>`;

    const el = div.firstElementChild;
    anchor.parentNode.insertBefore(el, anchor);

    const open = () => { track('chest_teaser.tapped', { count: pending.length }); navigate('#/mes-coffres'); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  } catch (e) { /* silent */ }
}

async function _loadAndInjectFlashQuiz(root, me) {
  try {
    const nowIso = new Date().toISOString();
    const { data } = await sb
      .from('flash_quizzes')
      .select('id, expires_at')
      .eq('sent_to', me.id)
      .is('responded_at', null)
      .gt('expires_at', nowIso)
      .order('sent_at', { ascending: false })
      .limit(1);

    const fq = data?.[0];
    if (!fq) return;

    const hero = root.querySelector('.acc2-hero');
    if (!hero) return;
    if (root.querySelector('#acc-flashq')) return; // déjà injecté (garde anti double-mount)

    const expiresMs = new Date(fq.expires_at).getTime();
    const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

    if (!document.getElementById('acc-flashq-styles')) {
      const st = document.createElement('style');
      st.id = 'acc-flashq-styles';
      st.textContent = `
        .acc2-flashq{display:flex;align-items:center;gap:12px;margin:14px 16px 0;padding:14px 16px;border-radius:16px;cursor:pointer;
          background:linear-gradient(135deg,#f59e0b,#f97316);box-shadow:0 6px 20px rgba(249,115,22,.32);animation:fqBannerIn .4s cubic-bezier(.23,1,.32,1)}
        @keyframes fqBannerIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .acc2-flashq:active{transform:scale(.99)}
        .acc2-fq-ico{font-size:24px;line-height:1;animation:fqWiggle 1.4s ease-in-out infinite}
        @keyframes fqWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
        .acc2-fq-text{flex:1;min-width:0}
        .acc2-fq-title{font:800 15px/1.2 'Plus Jakarta Sans',sans-serif;color:#fff}
        .acc2-fq-sub{font:600 12.5px/1.3 'Inter',sans-serif;color:rgba(255,255,255,.88);margin-top:2px}
        .acc2-fq-clock{font:800 18px/1 'IBM Plex Mono',monospace;color:#fff;background:rgba(0,0,0,.18);padding:8px 12px;border-radius:10px;flex-shrink:0}
        @media(prefers-reduced-motion:reduce){.acc2-fq-ico{animation:none}}`;
      document.head.appendChild(st);
    }

    hero.insertAdjacentHTML('afterend', `
      <div class="acc2-flashq" id="acc-flashq" role="button" tabindex="0" aria-label="Quiz éclair de ton moniteur, réponds maintenant">
        <span class="acc2-fq-ico" aria-hidden="true">${icon('zap',{size:18})}</span>
        <div class="acc2-fq-text">
          <div class="acc2-fq-title">Quiz éclair de ton moniteur</div>
          <div class="acc2-fq-sub">3 questions · réponds maintenant</div>
        </div>
        <span class="acc2-fq-clock" id="acc-fq-clock">${esc(fmt(expiresMs - Date.now()))}</span>
      </div>`);

    const el = root.querySelector('#acc-flashq');
    if (!el) return;
    const clockEl = el.querySelector('#acc-fq-clock');
    const iv = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(iv); return; }
      const left = expiresMs - Date.now();
      if (left <= 0) { clearInterval(iv); el.remove(); return; }
      clockEl.textContent = fmt(left);
    }, 500);

    const open = () => { track('flash_quiz.banner_tapped', { flash_quiz_id: fq.id }); navigate(`#/flash-quiz/${fq.id}`); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  } catch (e) { /* silent */ }
}

// ─── Helpers ─────────────────────────────────────────────────────
function _dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildActivityData(attempts, streak) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const counts = {};
  for (const a of attempts) {
    const key = (a.completed_at || a.created_at || '').slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }
  if (!attempts.length && streak?.current_streak > 0) {
    const n = Math.min(streak.current_streak, 7);
    for (let i = 0; i < n; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      counts[_dKey(d)] = 1;
    }
  }
  const activeDates = Object.keys(counts);
  const levels = {}, details = {};
  for (const [k, v] of Object.entries(counts)) {
    levels[k] = v >= 4 ? 4 : v >= 3 ? 3 : v >= 2 ? 2 : 1;
    const dt = new Date(k + 'T12:00:00');
    details[k] = `${dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${v} quiz${v > 1 ? 's' : ''}`;
  }
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = _dKey(d);
    days7.push({ key, count: counts[key] || 0 });
  }
  return { activeDates, levels, details, days7, totalActive: activeDates.length };
}

// ─── Skeleton ────────────────────────────────────────────────────
const SKELETON = `${STYLE}
<div class="acc2" aria-busy="true">
  <div class="skel2" style="height:300px;border-radius:0;margin-bottom:0"></div>
  <div class="skel2" style="height:200px;border-radius:28px;margin:20px 16px 0"></div>
  <div class="skel2" style="height:130px;border-radius:24px;margin:16px 16px 0"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px;margin-top:40px">
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
  </div>
</div>`;
