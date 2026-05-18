// ═══════════════════════════════════════════════════════════════
// Élève — Accueil (hub principal)
// ADN : Clash Royale + Duolingo — dopamine immédiate, "encore une compétence"
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { REMC } from '@/data/remc.js';
import { showOnboarding } from '@/components/onboarding-modal.js';
import { renderHeatmap, ensureHeatmapStyles } from '@/components/activity-heatmap.js';
import { maybeSoftRequestPush, maybeSendStreakRiskNotif } from '@/services/web-push.js';
// daily-action.js importé uniquement si la feature DA est activée (actuellement désactivée)
// import { getDailyAction, DA_TYPES, completeDailyAction } from '@/modules/progression/daily-action.js';
import { maybePlayWeeklyReplay } from '@/components/weekly-replay.js';
import { icon, iconBadge } from '@/utils/icons.js';
import { ASSETS } from '@/utils/assets.js';
import { renderEmptyState } from '@/components/empty-state.js';
import { emotionalBanner } from '@/components/emotional-banner.js';
import { mountSessionConfirmation } from '@/components/session-confirmation-banner.js';
import { mountFeedbackFeed } from '@/components/feedback-feed.js';
import { mountRevisionCards } from '@/components/revision-cards.js';
import { mountCoachingTip }  from '@/components/coaching-tip.js';
import { mountDailyQuests }  from '@/components/daily-quests.js';
import { toast }             from '@/components/toast.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.acc {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
  background: #f8f9fc;
  color: #0a0d1a;
  font-family: 'Inter', sans-serif;
}
@keyframes slideUp {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
.acc > * { animation: slideUp .35s ease both; }
.acc > *:nth-child(2) { animation-delay:.04s; }
.acc > *:nth-child(3) { animation-delay:.08s; }
.acc > *:nth-child(4) { animation-delay:.12s; }
.acc > *:nth-child(5) { animation-delay:.16s; }

/* ── Skeleton ── */
.skel-line, .skel-circle {
  background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
  display: block;
}
.skel-circle { border-radius: 50%; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ── Header ── */
.acc-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.acc-hd-left { display: flex; align-items: center; gap: 12px; }
.acc-avatar { display: block; width: 48px; height: 48px; flex-shrink: 0; }
.acc-bonjour { font: 600 22px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.acc-level { font: 500 13px/1 'Inter', sans-serif; color: #94a3b8; margin-top: 3px; }
.acc-xp-pill {
  background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 20px;
  padding: 5px 10px;
  flex-shrink: 0;
}
.acc-xp-num { font: 700 12px/1 'Inter', sans-serif; color: #6366f1; }
.acc-xp-track {
  height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}
.acc-xp-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 2px;
  transition: width .5s ease;
}
.acc-xp-labels {
  display: flex;
  justify-content: space-between;
  font: 500 10px/1 'Inter', sans-serif;
  color: #94a3b8;
  margin-bottom: 16px;
}

/* ── Streak Card ── */
.streak-pro {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  cursor: pointer;
  transition: transform .15s;
}
.streak-pro:active { transform: scale(.985); }
.streak-pro-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.streak-pro-flame { flex-shrink: 0; }
.streak-pro-flame svg { display: block; }
.flame-pulse { animation: spFlame .7s ease-in-out infinite alternate; }
@keyframes spFlame {
  from { transform: scale(1) rotate(-3deg); }
  to   { transform: scale(1.14) rotate(3deg); }
}
.streak-pro-center { flex: 1; }
.streak-pro-num {
  font: 700 40px/1 'Inter', sans-serif;
  letter-spacing: -.02em;
  color: #0a0d1a;
}
.streak-pro-lbl {
  font: 500 13px/1 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 2px;
}
.streak-pro-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  align-self: center;
}
.streak-pro-dot.active { background: #10b981; }
.streak-pro-dot.broken { background: #94a3b8; }

.streak-mini-graph {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 24px;
}
.sg-bar {
  flex: 1;
  border-radius: 3px;
  background: #e2e8f0;
  min-height: 4px;
  transition: height .3s ease;
}
.sg-bar.active { background: #6366f1; }

/* ── Bottom sheet streak détail ── */
.bs-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0);
  z-index: 490;
  pointer-events: none;
  transition: background .3s;
  animation: none !important;
}
.bs-bg.open { background: rgba(0,0,0,.45); pointer-events: auto; backdrop-filter: blur(4px); }
.bs-streak {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 495;
  background: #fff;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid #e2e6f2;
  transform: translateY(100%) !important;
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  max-height: 85dvh;
  overflow-y: auto;
  animation: none !important;
}
.bs-streak.open { transform: translateY(0) !important; }
.bs-handle {
  width: 36px; height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  margin: 14px auto 0;
}
.bs-hd { padding: 16px 20px 14px; border-bottom: 1px solid #f0f2f8; }
.bs-hd-title { font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; letter-spacing: -.02em; }
.bs-hd-sub { font: 500 12px/1.3 'Inter', sans-serif; color: #94a3b8; margin-top: 4px; }
.bs-hmap-wrap { padding: 16px 16px 8px; }
.bs-hmap-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.bs-hmap-title { font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; }
.bs-hmap-sub { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; }
.bs-hmap-wrap .hmap { padding: 0; background: none; border: none; box-shadow: none; }
.bs-hmap-wrap .hmap-tap-info { margin-top: 10px; min-height: 20px; font: 600 11.5px/1 'Inter', sans-serif; color: #64748b; text-align: center; transition: opacity .15s; }
.cal-month-label { padding: 14px 20px 8px; font: 800 14px/1 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; }
.cal-hd { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 0 16px 4px; }
.cal-hd span { font: 600 9.5px/1 'Inter', sans-serif; color: #94a3b8; text-align: center; letter-spacing: .04em; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; padding: 0 16px 16px; }
.cal-day {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font: 600 11px/1 'Inter', sans-serif;
  color: #64748b;
  background: #f8f9fc;
}
.cal-day.active { background: #6366f1; color: #fff; }
.cal-day.today { outline: 2px solid #6366f1; outline-offset: 1px; color: #6366f1; }
.cal-day.active.today { color: #fff; }
.cal-day.future { background: transparent; color: #d1d8ee; }
.cal-day.empty { background: transparent; }

/* ── Action du jour ── */
.action-card {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 20px;
  padding: 24px 20px;
  margin-bottom: 24px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.action-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}
.action-tag {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #94a3b8;
}
.action-urgent {
  font: 600 11px/1 'Inter', sans-serif;
  color: #ef4444;
}
.action-ico   { font-size: 40px; line-height: 1; margin-bottom: 8px; }
.action-label { font: 600 17px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin-bottom: 6px; }
.action-sub   { font: 500 13px/1.4 'Inter', sans-serif; color: #94a3b8; margin-bottom: 20px; }
.action-btn {
  display: inline-block;
  padding: 14px 28px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: 0;
  border-radius: 12px;
  color: #fff;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform .15s, opacity .15s;
  min-height: 44px;
}
.action-btn:active { transform: scale(.97); opacity: .9; }

/* ── Section headers ── */
.sec-hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.sec-title { font: 600 17px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.sec-sub   { font: 500 12px/1 'Inter', sans-serif; color: #94a3b8; }

/* ── Mondes ── */
.worlds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}
.world-card {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 20px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: transform .2s;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.world-card:active { transform: scale(.97); }
.world-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; min-height: 60px; }
.world-ico  { font-size: 22px; line-height: 1; }
.world-img {
  width: 60px; height: 60px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 3px 8px rgba(11,13,26,.14));
  transition: transform .3s ease;
}
/* C2 (circulation normale) — l'image a un contour foncé natif :
   on zoome 1.15× pour rogner les bords disgracieux */
.world-card[data-world="C2"] .world-img {
  transform: scale(1.18);
}
.world-card:hover .world-img { transform: scale(1.10) rotate(-3deg); }
.world-card[data-world="C2"]:hover .world-img { transform: scale(1.28) rotate(-3deg); }
.world-card[data-complete="true"] .world-img {
  animation: worldFloat 2.8s ease-in-out infinite;
}
@keyframes worldFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-3px) rotate(2deg); }
}
@media (prefers-reduced-motion: reduce) {
  .world-card[data-complete="true"] .world-img { animation: none; }
}
.world-pct  { font: 700 13px/1 'Inter', sans-serif; }
.world-name { font: 600 12px/1.3 'Inter', sans-serif; color: #94a3b8; margin-bottom: 8px; }
.world-track {
  height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}
.world-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
.world-count { font: 500 11px/1 'Inter', sans-serif; color: #94a3b8; }
.world-crown {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 14px;
}

/* ── Trophées ── */
.trophees-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: 24px;
  scrollbar-width: none;
}
.trophees-row::-webkit-scrollbar { display: none; }
.trophy-card {
  flex-shrink: 0;
  width: 130px;
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 20px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.trophy-unlocked {
  border-color: color-mix(in srgb, var(--tc) 40%, transparent);
  background: color-mix(in srgb, var(--tc) 8%, transparent);
  position: relative;
  overflow: hidden;
}
.trophy-unlocked::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.12) 50%, transparent 60%);
  animation: shimmerTrophy 2.5s ease-in-out infinite;
}
@keyframes shimmerTrophy {
  0%   { transform: translateX(-100%) rotate(15deg); }
  100% { transform: translateX(100%) rotate(15deg); }
}
.trophy-ico     { font-size: 30px; line-height: 1; margin-bottom: 8px; display: block; }
.trophy-ico-dim { opacity: .35; filter: grayscale(1); }
.trophy-label   { font: 600 11px/1.3 'Inter', sans-serif; color: #0a0d1a; margin-bottom: 6px; }
.trophy-state   { font: 500 10px/1 'Inter', sans-serif; color: #94a3b8; }
.trophy-unlocked .trophy-state { color: var(--tc); }
.trophy-next-bar {
  height: 3px;
  background: #e2e6f2;
  border-radius: 2px;
  overflow: hidden;
  margin: 6px 0 4px;
}
.trophy-next-fill { height: 100%; border-radius: 2px; }
.trophees-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px;
  background: #f8f9fc;
  border: 1.5px dashed #d1d8ee;
  border-radius: 20px;
  text-align: center;
}
.trophees-empty-ico { font-size: 32px; opacity: .3; }
.trophees-empty-txt { font: 500 12px/1.5 'Inter', sans-serif; color: #94a3b8; }

/* ── Footer ── */
.acc-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.footer-stat { flex: 1; }
.footer-val  { font: 800 20px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin-bottom: 4px; }
.footer-lbl  { font: 500 11px/1.3 'Inter', sans-serif; color: #94a3b8; }
.footer-sep  { width: 1px; height: 40px; background: #e2e6f2; flex-shrink: 0; }

/* ── Prochaine compétence (état vide) ── */
.next-comp-empty {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(99,102,241,.06) 0%, rgba(139,92,246,.04) 100%);
  border: 1px solid rgba(99,102,241,.18);
  border-radius: 16px;
  margin-bottom: 12px;
}
.next-comp-icon {
  width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; flex-shrink: 0;
}
.next-comp-bd { flex: 1; min-width: 0; }
.next-comp-title { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.next-comp-sub { font: 500 11.5px/1.4 'Inter', sans-serif; color: #64748b; margin-top: 3px; }

/* ── Streak freeze ── */
.bs-freeze-wrap { padding: 0 20px 8px; margin-top: 12px; }
.bs-freeze-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 20px;
  background: linear-gradient(135deg,#dbeafe,#e0f2fe);
  border: 1.5px solid #bfdbfe; border-radius: 16px;
  color: #1d4ed8; font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; min-height: 52px;
  transition: transform .15s cubic-bezier(.23,1,.32,1), opacity .15s;
}
.bs-freeze-btn:active { transform: scale(.98); opacity: .9; }
.bs-freeze-btn:disabled { opacity: .55; cursor: default; }
.bs-freeze-desc {
  font: 500 11px/1.4 'Inter', sans-serif; color: #64748b;
  text-align: center; margin-top: 7px;
}

/* ── Leaderboard card ── */
.acc-lb {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, rgba(99,102,241,.08) 0%, rgba(139,92,246,.06) 100%);
  border: 1.5px solid rgba(99,102,241,.18);
  border-radius: 20px;
  padding: 16px 20px;
  cursor: pointer;
  transition: transform .15s cubic-bezier(.23,1,.32,1), box-shadow .15s;
}
.acc-lb:active { transform: scale(.985); }
.acc-lb-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.acc-lb-title {
  font: 700 12px/1 'Inter', sans-serif;
  color: #6366f1;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.acc-lb-badge {
  font: 700 11px/1 'Inter', sans-serif;
  color: #f59e0b;
  background: rgba(245,158,11,.12);
  border-radius: 99px;
  padding: 4px 10px;
}
.acc-lb-body {
  font: 800 20px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -.02em;
  margin-bottom: 4px;
}
.acc-lb-sub {
  font: 500 12px/1.3 'Inter', sans-serif;
  color: #94a3b8;
}
.acc-lb-arrow {
  color: #6366f1;
  font-size: 16px;
  align-self: flex-start;
}
</style>`;

// ─── Constantes ──────────────────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
const LEVEL_NAMES   = ['', 'Débutant', 'Apprenti', 'Conducteur', 'Confirmé', 'Expert', 'Pro', 'As du Volant'];

// Images premium par monde (assets ChatGPT 3D — fallback emoji)
const WORLD_IMAGES = [ASSETS.worldC1, ASSETS.worldC2, ASSETS.worldC3, ASSETS.worldC4];

const WORLDS = REMC.map((cat, i) => ({
  id:    cat.id,
  ico:   cat.ico,
  image: WORLD_IMAGES[i] || null,
  name:  cat.name,
  subs:  cat.subs,
  total: cat.subs.length,
  color: ['#22c55e', '#3b82f6', '#eab308', '#a855f7'][i],
  glow:  ['rgba(34,197,94,.22)', 'rgba(59,130,246,.22)', 'rgba(234,179,8,.22)', 'rgba(168,85,247,.22)'][i],
}));

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track('page.view', { page: 'eleve_accueil' });

  root.innerHTML = SKELETON;

  try {
  // Fetch tout en parallèle
  const [profileRes, streakRes, validRes, notifRes, attemptsRes] = await Promise.allSettled([
    sb.from('profiles')
      .select('prenom, xp, last_active_at, first_value_action_at, gemmes')
      .eq('id', me.id)
      .maybeSingle(),

    sb.from('streaks')
      .select('current_streak, last_activity_date, longest_streak')
      .eq('user_id', me.id)
      .maybeSingle(),

    sb.from('validations')
      .select('competence_id')
      .eq('eleve_id', me.id)
      .eq('statut', 'acquis'),

    sb.from('notifications')
      .select('id, data, type')
      .eq('user_id', me.id)
      .eq('read', false)
      .in('type', ['consolidation_quiz', 'post_validation_quiz'])
      .order('created_at', { ascending: false })
      .limit(1),

    sb.from('quiz_attempts')
      .select('completed_at')
      .eq('user_id', me.id)
      .gte('completed_at', new Date(Date.now() - 35 * 86400000).toISOString())
      .order('completed_at', { ascending: true }),
  ]);

  const profile   = profileRes.value?.data  || { prenom: me.prenom || 'Toi', xp: 0 };
  const streak    = streakRes.value?.data   || { current_streak: 0, last_activity_date: null, longest_streak: 0 };
  const validated = new Set((validRes.value?.data || []).map(v => v.competence_id));
  const pendingNotif = notifRes.value?.data?.[0] || null;
  const activityDays = buildActivityData(attemptsRes.value?.data || [], streak);

  ensureHeatmapStyles();

  const lvl     = computeLevel(profile.xp || 0);
  const worlds  = computeWorlds(validated);
  const trophees = computeTrophees(worlds);
  const streakSt = streakStatus(streak);
  const cta      = computeCta({ pendingNotif });

  track('streak.viewed', { days: streak.current_streak, status: streakSt });

  const gemmes = profile.gemmes || 0;
  root.innerHTML = render({ me, profile, lvl, streak, streakSt, worlds, trophees, cta, activityDays, gemmes });
  wire(root, { cta, worlds, pendingNotif, streak, streakSt, gemmes, activityDays });

  const accDiv = root.querySelector('.acc');

  // Coaching tip (au-dessus du streak — non-bloquant)
  if (accDiv) Promise.resolve().then(() => mountCoachingTip(accDiv)).catch(e => console.error('[accueil] coaching-tip', e));

  // Quêtes du jour (avant streak — non-bloquant, après coaching tip)
  if (accDiv) Promise.resolve().then(() => mountDailyQuests(accDiv)).catch(e => console.error('[accueil] daily-quests', e));

  // Bannière sessions à confirmer (non-bloquante)
  if (accDiv) {
    const streakAnchor = accDiv.querySelector('.streak-pro') || accDiv.firstElementChild;
    Promise.resolve().then(() => mountSessionConfirmation(accDiv, streakAnchor)).catch(e => console.error('[accueil] session-confirm', e));
  }

  // Feed retours moniteurs (non-bloquant — injecté avant footer)
  if (accDiv) {
    Promise.resolve().then(() => mountFeedbackFeed(accDiv, { eleveId: me.id, limit: 5 })).catch(e => console.error('[accueil] feedback-feed', e));
  }

  // Révisions mémoire espacée (non-bloquant — injecté avant footer)
  if (accDiv) {
    Promise.resolve().then(() => mountRevisionCards(accDiv, { eleveId: me.id, limit: 3 })).catch(e => console.error('[accueil] revision-cards', e));
  }

  // Leaderboard (non-bloquant — injecté dans le slot dédié)
  _loadAndInjectLeaderboard(root);

  // Bannière émotionnelle (non-bloquante — indépendante du render principal)
  emotionalBanner.checkAndRender(root).catch(() => {});

  // Flame bump si streak vient d'être sauvegardée aujourd'hui
  if (streakSt === 'saved' && streak.current_streak > 0) {
    setTimeout(() => {
      const flame = root.querySelector('.streak-pro-flame');
      if (!flame) return;
      flame.classList.add('anim-flame-bump');
      setTimeout(() => flame.classList.remove('anim-flame-bump'), 600);
    }, 500);
  }

  // Onboarding premier login
  if (!profile.first_value_action_at) {
    showOnboarding(me.id, () => {});
  }

  // Push web (soft, après 5s, pas au 1er login)
  if (profile.first_value_action_at) {
    maybeSoftRequestPush();
    maybeSendStreakRiskNotif();

    // Weekly replay (dimanche/lundi soir seulement)
    const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
    maybePlayWeeklyReplay({
      compsValidated: totalValidated,
      monsReview: null,
      streak: streak.current_streak,
    });
  }
  } catch (e) {
    console.error('[accueil] mount failed', e);
    root.innerHTML = `<div style="padding:60px 24px;text-align:center;color:#64748b;font-family:'Inter',sans-serif">
      <div style="font:800 18px/1.3 'Plus Jakarta Sans',sans-serif;color:#0a0d1a;margin-bottom:8px">Oups, ton accueil a du mal à charger</div>
      <p style="font-size:14px;margin:0 0 20px">Vérifie ta connexion et réessaie.</p>
      <button onclick="location.reload()" style="padding:12px 24px;border:0;background:#6366f1;color:#fff;border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer">Recharger</button>
    </div>`;
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
  const max = XP_THRESHOLDS[level]     ?? XP_THRESHOLDS.at(-1);
  const pct = max > min ? Math.min(100, Math.round(((xp - min) / (max - min)) * 100)) : 100;
  return { level, name: LEVEL_NAMES[level] ?? `Niv. ${level}`, xp, min, max, pct };
}

function computeWorlds(validatedIds) {
  return WORLDS.map(w => {
    const done = w.subs.filter(s => validatedIds.has(s.c)).length;
    // Garde-fou : éviter NaN si jamais un monde a 0 sous-comp
    const pct  = w.total > 0 ? Math.round((done / w.total) * 100) : 0;
    return { ...w, done, pct, complete: w.total > 0 && done === w.total };
  });
}

function computeTrophees(worlds) {
  const unlocked = worlds.filter(w => w.complete);
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

function computeCta({ pendingNotif }) {
  if (pendingNotif?.data?.competence_id) {
    const isConsolid = pendingNotif.type === 'consolidation_quiz';
    return {
      type: pendingNotif.type,
      ico: isConsolid ? icon('target', { size: 22 }) : icon('zap', { size: 22 }),
      label: isConsolid ? 'Quiz de consolidation' : 'Quiz post-validation',
      sub: isConsolid
        ? '2 questions · 30 secondes · Renforce ta mémoire'
        : '3 questions · Prouve que tu maîtrises !',
      btn: 'Commencer maintenant →',
      href: `#/quiz/${pendingNotif.data.competence_id}/${isConsolid ? 'consolidation' : 'post_validation'}`,
      accent: isConsolid ? '#8b5cf6' : '#6366f1',
    };
  }
  return {
    type: 'parcours_remc',
    ico: '🗺️',
    label: 'Continue ton parcours',
    sub: 'Maîtrise les 31 compétences REMC',
    btn: 'Voir le parcours →',
    href: '#/parcours',
    accent: '#10b981',
  };
}

// ─── Render ───────────────────────────────────────────────────────
function render({ me, profile, lvl, streak, streakSt, worlds, trophees, cta, activityDays = { days7: [], activeDates: [], levels: {}, details: {}, totalActive: 0 }, gemmes = 0 }) {
  const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
  const isActive = streakSt !== 'broken';

  return `${STYLE}
<div class="acc">

  <!-- 1. HEADER -->
  <div class="acc-hd">
    <div class="acc-hd-left">
      <div class="acc-avatar" aria-hidden="true">
        ${avatarSvg(profile.prenom)}
      </div>
      <div>
        <div class="acc-bonjour">Bonjour ${esc(profile.prenom || 'toi')} 👋</div>
        <div class="acc-level">Niveau ${lvl.level}</div>
      </div>
    </div>
    <div class="acc-xp-pill">
      <span class="acc-xp-num">${lvl.xp} XP</span>
    </div>
  </div>
  <div class="acc-xp-track">
    <div class="acc-xp-fill" style="width:${lvl.pct}%"></div>
  </div>
  <div class="acc-xp-labels">
    <span>${lvl.min} XP</span>
    <span>${lvl.pct}% → Niv. ${lvl.level + 1}</span>
    <span>${lvl.max} XP</span>
  </div>

  <!-- 2. STREAK -->
  <div class="streak-pro" id="streak-card" role="status" aria-label="Série d'apprentissage : ${streak.current_streak} jours">
    <div class="streak-pro-top">
      <div class="streak-pro-flame ${isActive ? 'flame-pulse' : ''}">
        ${flameSvg()}
      </div>
      <div class="streak-pro-center">
        <div class="streak-pro-num">${streak.current_streak}</div>
        <div class="streak-pro-lbl">jours d'affilée</div>
      </div>
      <div class="streak-pro-dot ${isActive ? 'active' : 'broken'}"></div>
    </div>
    <div class="streak-mini-graph">
      ${activityDays.days7.map(d => {
        const maxH = 20, minH = 4;
        const max = Math.max(1, ...activityDays.days7.map(x => x.count));
        const h = d.count > 0 ? minH + Math.round((d.count / max) * (maxH - minH)) : minH;
        return `<div class="sg-bar ${d.count > 0 ? 'active' : ''}" style="height:${h}px"></div>`;
      }).join('')}
    </div>
  </div>

  <!-- 3. ACTION DU JOUR -->
  <div class="action-card">
    <div class="action-top">
      <span class="action-tag">Action du jour</span>
      ${cta.type === 'consolidation_quiz' ? `<span class="action-urgent">${icon('zap', { size: 13 })} Urgent</span>` : ''}
    </div>
    <div class="action-ico">${cta.ico}</div>
    <div class="action-label">${esc(cta.label)}</div>
    <div class="action-sub">${esc(cta.sub)}</div>
    <button class="action-btn" data-cta-type="${esc(cta.type)}" ${cta.href ? `data-href="${esc(cta.href)}"` : ''}>
      ${esc(cta.btn)}
    </button>
  </div>

  <!-- 4. PROGRESSION REMC -->
  <div class="sec-hd">
    <div class="sec-title">Parcours REMC</div>
    <div class="sec-sub">${totalValidated}/31 compétences</div>
  </div>
  <div class="worlds-grid">
    ${worlds.map(w => `
      <div class="world-card" data-world="${esc(w.id)}" data-complete="${w.complete ? 'true' : 'false'}">
        <div class="world-top">
          ${w.image
            ? `<img class="world-img" src="${esc(w.image)}" alt="${esc(w.name)}" loading="lazy" />`
            : `<span class="world-ico">${w.ico}</span>`}
          <span class="world-pct" style="color:${w.color}">${w.pct}%</span>
        </div>
        <div class="world-name">${esc(w.name)}</div>
        <div class="world-track">
          <div class="world-fill" style="width:${w.pct}%;background:${w.color}"></div>
        </div>
        <div class="world-count">${w.done}/${w.total}</div>
        ${w.complete ? `<div class="world-crown">${icon('award', { size: 16 })}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <!-- 5. TROPHÉES -->
  <div class="sec-hd">
    <div class="sec-title">Trophées</div>
    <div class="sec-sub">${trophees.unlocked.length}/${WORLDS.length} débloqués</div>
  </div>
  <div class="trophees-row">
    ${trophees.unlocked.length === 0
      ? `<div class="trophees-empty">
           <div class="trophees-empty-ico">${icon('trophy', { size: 32 })}</div>
           <div class="trophees-empty-txt">Valide toutes les compétences d'un monde pour débloquer ton premier trophée</div>
         </div>`
      : trophees.unlocked.slice(0, 3).map(w => `
           <div class="trophy-card trophy-unlocked" style="--tc:${w.color}">
             <div class="trophy-ico">${w.ico}</div>
             <div class="trophy-label">${esc(w.name)}</div>
             <div class="trophy-state">${icon('check', { size: 11, strokeWidth: 3 })} Acquis</div>
           </div>`).join('')
    }
    ${trophees.nextUp ? `
      <div class="trophy-card trophy-locked" style="--tc:${trophees.nextUp.color}">
        <div class="trophy-ico trophy-ico-dim">${trophees.nextUp.ico}</div>
        <div class="trophy-label">${esc(trophees.nextUp.name)}</div>
        <div class="trophy-next-bar">
          <div class="trophy-next-fill" style="width:${trophees.nextUp.pct}%;background:${trophees.nextUp.color}"></div>
        </div>
        <div class="trophy-state">${trophees.nextUp.pct}% · encore ${trophees.nextUp.total - trophees.nextUp.done} comp.</div>
      </div>
    ` : ''}
  </div>

  <!-- 6. LEADERBOARD — injecté en post-render (non-bloquant) -->
  <div id="acc-lb-slot"></div>

  <!-- 7. FOOTER — métriques compétences -->
  ${totalValidated === 0 ? `
    <div class="next-comp-empty">
      <div class="next-comp-icon">${icon('compass', { size: 22 })}</div>
      <div class="next-comp-bd">
        <div class="next-comp-title">Prochaine compétence à valider</div>
        <div class="next-comp-sub">Lance ton parcours REMC — ton moniteur validera tes acquis au fil de la conduite.</div>
      </div>
    </div>
  ` : ''}
  <div class="acc-footer">
    <div class="footer-stat">
      <div class="footer-val">${totalValidated}<span style="font-size:.55em;color:#94a3b8">/31</span></div>
      <div class="footer-lbl">compétences acquises</div>
    </div>
    <div class="footer-sep"></div>
    <div class="footer-stat">
      <div class="footer-val">${Math.max(0, 28 - totalValidated)}</div>
      <div class="footer-lbl">avant l'examen blanc</div>
    </div>
  </div>

</div>

<!-- STREAK BOTTOM SHEET — hors de .acc pour éviter slideUp animation -->
<div class="bs-bg" id="bs-bg"></div>
<div class="bs-streak" id="bs-streak" role="dialog" aria-label="Détail streak">
  <div class="bs-handle"></div>
  <div class="bs-hd">
    <div class="bs-hd-title">Série d'apprentissage</div>
    <div class="bs-hd-sub">Record : ${streak.longest_streak} jour${streak.longest_streak > 1 ? 's' : ''} · En cours : ${streak.current_streak} jour${streak.current_streak > 1 ? 's' : ''}</div>
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
    <button class="bs-freeze-btn" id="bs-freeze-btn">
      🧊 Geler ma série · 50 💎
    </button>
    <div class="bs-freeze-desc">Protège ta série pour les prochaines 24h</div>
  </div>
  ` : ''}
</div>`;
}

function avatarSvg(prenom) {
  const initial = (prenom || '?')[0].toUpperCase();
  return `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="avGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="24" fill="url(#avGrad)"/>
    <text x="24" y="30" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif"
          font-size="20" font-weight="800" fill="#fff">${initial}</text>
  </svg>`;
}

async function _loadAndInjectLeaderboard(root) {
  try {
    const { data, error } = await sb.rpc('get_my_leaderboard_position');
    if (error || !data || data?.error) return;
    const slot = root.querySelector('#acc-lb-slot');
    if (!slot) return;
    slot.innerHTML = renderLeaderboardCard(data);
    slot.querySelector('#acc-lb-card')?.addEventListener('click', () => {
      track('leaderboard.tapped', { rank: data.my_rank, percentile: data.percentile });
      location.hash = '#/trophees';
    });
  } catch (e) {
    console.error('[accueil] leaderboard', e);
  }
}

function renderLeaderboardCard(lb) {
  const rank  = lb.my_rank ?? null;
  const total = lb.total_eleves ?? null;
  const pct   = lb.percentile ?? null;
  const isTop = pct !== null && pct >= 90;

  const rankText = rank !== null && total !== null
    ? `Tu es #${rank} sur ${total} élève${total > 1 ? 's' : ''}`
    : 'Classement de l\'école';
  const pctText = pct !== null ? ` · Top ${100 - pct}%` : '';

  return `
<div class="acc-lb" id="acc-lb-card" role="button" tabindex="0" aria-label="Classement de l'école">
  <div class="acc-lb-top">
    <div class="acc-lb-title">🏆 Classement de l'école</div>
    ${isTop ? `<div class="acc-lb-badge">🌟 Top de l'école</div>` : ''}
  </div>
  <div class="acc-lb-body">${esc(rankText + pctText)}</div>
  ${pct !== null ? `<div class="acc-lb-sub">Dans le top ${100 - pct}% de ton auto-école</div>` : ''}
</div>`;
}

function streakSubText(status, streak) {
  if (status === 'saved')   return '🟢 Ta série est sauvegardée aujourd\'hui !';
  if (status === 'critical') return '🔴 Continue ta série — moins de 6h !';
  if (status === 'at_risk') return '🟡 Fais une action aujourd\'hui pour maintenir ta série';
  return streak.longest_streak > 0
    ? `Ton record : ${streak.longest_streak} jours — relance ta série !`
    : 'Lance ta première série d\'apprentissage !';
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, { cta, streak, streakSt, gemmes = 0, activityDays }) {
  root.querySelector('.action-btn')?.addEventListener('click', (e) => {
    const btn  = e.currentTarget;
    const type = btn.dataset.ctaType;
    const href = btn.dataset.href;
    track('cta.clicked', { cta_type: type });
    if (href) location.hash = href;
  });

  root.querySelectorAll('[data-world]').forEach(el =>
    el.addEventListener('click', () => {
      track('cta.clicked', { cta_type: 'world_card', world: el.dataset.world });
      location.hash = '#/parcours';
    })
  );

  // Streak bottom sheet
  const bsBg = root.querySelector('#bs-bg');
  const bsSheet = root.querySelector('#bs-streak');
  const openBS = () => { bsSheet?.classList.add('open'); bsBg?.classList.add('open'); track('streak.detail_opened', { days: streak?.current_streak }); };
  const closeBS = () => { bsSheet?.classList.remove('open'); bsBg?.classList.remove('open'); };
  root.querySelector('#streak-card')?.addEventListener('click', openBS);
  bsBg?.addEventListener('click', closeBS);

  // Streak freeze
  root.querySelector('#bs-freeze-btn')?.addEventListener('click', async () => {
    const btn = root.querySelector('#bs-freeze-btn');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '⏳ Gel en cours…';
    try {
      const { data, error } = await sb.rpc('use_streak_freeze');
      if (error || data?.error) {
        toast('Impossible de geler la série', 'error');
        btn.disabled = false;
        btn.innerHTML = '🧊 Geler ma série · 50 💎';
        return;
      }
      track('streak.freeze_used', {});
      toast('Série gelée pour 24h 🧊', 'success');
      closeBS();
    } catch {
      toast('Erreur lors du gel', 'error');
      btn.disabled = false;
      btn.innerHTML = '🧊 Geler ma série · 50 💎';
    }
  });

  // Heatmap tap-info tooltip
  const infoEl = root.querySelector('#hmap-info');
  root.querySelectorAll('.hmap-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const label = cell.dataset.label;
      const detail = cell.dataset.detail ? decodeURIComponent(cell.dataset.detail) : null;
      if (!label || !infoEl) return;
      infoEl.textContent = detail || label;
      infoEl.style.opacity = '1';
      clearTimeout(infoEl._t);
      infoEl._t = setTimeout(() => { infoEl.style.opacity = '0'; }, 2500);
    });
  });
}

// ─── Streak helpers ──────────────────────────────────────────────
function streakTint(status) {
  return { saved: 'rgba(16,185,129,.04)', at_risk: 'rgba(245,158,11,.04)', critical: 'rgba(239,68,68,.05)', broken: 'rgba(100,116,139,.03)' }[status] || 'rgba(99,102,241,.04)';
}

function streakStatusLabel(status) {
  return { saved: '🟢 OK', at_risk: '🟡 À risque', critical: '🔴 Urgent', broken: '⚫ Brisée' }[status] || '';
}

function flameSvg() {
  return `<svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flG" x1="22" y1="56" x2="22" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#dc2626"/>
        <stop offset="38%" stop-color="#f97316"/>
        <stop offset="75%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#fde68a"/>
      </linearGradient>
    </defs>
    <path d="M22 2C22 2 32 15 29 24C34 20 37 25 37 31C37 41 30 49 22 52C14 49 7 41 7 31C7 25 10 20 15 24C12 15 22 2 22 2Z" fill="url(#flG)"/>
    <path d="M22 18C22 18 27 26 25 33C24 36 22 37.5 22 37.5C22 37.5 20 36 19 33C17 26 22 18 22 18Z" fill="white" opacity="0.28"/>
    <ellipse cx="22" cy="36" rx="4" ry="5.5" fill="white" opacity="0.12"/>
  </svg>`;
}

function _dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildActivityData(attempts, streak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = {};
  for (const a of attempts) {
    const key = (a.completed_at || a.created_at || '').slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }
  // If no real data but streak > 0, synthesize last N days as active
  if (!attempts.length && streak?.current_streak > 0) {
    const n = Math.min(streak.current_streak, 7);
    for (let i = 0; i < n; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = _dKey(d);
      counts[key] = 1;
    }
  }
  const activeDates = Object.keys(counts);
  const levels = {};
  const details = {};
  for (const [k, v] of Object.entries(counts)) {
    levels[k] = v >= 4 ? 4 : v >= 3 ? 3 : v >= 2 ? 2 : 1;
    const dt = new Date(k + 'T12:00:00');
    const label = dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    details[k] = `${label} — ${v} quiz${v > 1 ? 's' : ''}`;
  }
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = _dKey(d);
    days7.push({ key, count: counts[key] || 0, isToday: i === 0 });
  }
  return { activeDates, levels, details, days7, totalActive: activeDates.length };
}

function renderCalendar(activeDates) {
  const activeSet = new Set(activeDates);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayKey = _dKey(today);
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DOW = ['D','L','M','M','J','V','S'];

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push('<div class="cal-day empty"></div>');
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const active = activeSet.has(key);
    const isToday = key === todayKey;
    const future = new Date(key) > today;
    cells.push(`<div class="cal-day ${active ? 'active' : ''} ${isToday ? 'today' : ''} ${future ? 'future' : ''}">${d}</div>`);
  }
  return `
    <div class="cal-month-label">${MONTHS[month]} ${year}</div>
    <div class="cal-hd">${DOW.map(l => `<span>${l}</span>`).join('')}</div>
    <div class="cal-grid">${cells.join('')}</div>
  `;
}

// ─── Skeleton ────────────────────────────────────────────────────
const SKELETON = `${STYLE}
<div class="acc" aria-busy="true">
  <div class="acc-hd" style="background:rgba(99,102,241,.06);border-radius:20px;padding:18px;margin-bottom:12px">
    <div style="display:flex;gap:14px;align-items:center">
      <div class="skel-circle" style="width:48px;height:48px;flex-shrink:0"></div>
      <div style="flex:1"><div class="skel-line" style="width:55%;height:16px;margin-bottom:8px"></div><div class="skel-line" style="width:35%;height:12px"></div></div>
    </div>
    <div class="skel-line" style="height:8px;margin-top:14px;border-radius:4px"></div>
  </div>
  <div class="skel-line" style="height:80px;border-radius:20px;margin-bottom:12px"></div>
  <div class="skel-line" style="height:140px;border-radius:20px;margin-bottom:20px"></div>
  <div class="skel-line" style="height:16px;width:40%;margin-bottom:12px;border-radius:8px"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
    <div class="skel-line" style="height:90px;border-radius:16px"></div>
    <div class="skel-line" style="height:90px;border-radius:16px"></div>
    <div class="skel-line" style="height:90px;border-radius:16px"></div>
    <div class="skel-line" style="height:90px;border-radius:16px"></div>
  </div>
  <div class="skel-line" style="height:100px;border-radius:20px"></div>
</div>`;

