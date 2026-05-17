// ═══════════════════════════════════════════════════════════════
// Élève — Accueil (hub principal)
// ADN : Clash Royale + Duolingo — dopamine immédiate, "encore une leçon"
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

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* ── Layout ── */
.acc {
  padding: 20px 16px 100px;
  max-width: 480px;
  margin: 0 auto;
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
  margin-bottom: 10px;
}
.acc-hd-left { display: flex; align-items: center; gap: 12px; }
.acc-avatar { display: block; width: 48px; height: 48px; flex-shrink: 0; }
.acc-bonjour { font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.acc-level { font: 500 12px/1 'IBM Plex Mono', monospace; color: #6366f1; margin-top: 3px; }
.acc-xp-pill {
  background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 20px;
  padding: 5px 10px;
  flex-shrink: 0;
}
.acc-xp-num { font: 700 12px/1 'IBM Plex Mono', monospace; color: #6366f1; }
.acc-xp-track {
  height: 6px;
  background: #e2e6f2;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
}
.acc-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 3px;
  transition: width .5s ease;
}
.acc-xp-labels {
  display: flex;
  justify-content: space-between;
  font: 500 10px/1 'IBM Plex Mono', monospace;
  color: #94a3b8;
  margin-bottom: 16px;
}

/* ── Streak Pro ── */
.streak-pro {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 24px;
  padding: 18px 16px 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(11,13,26,.05);
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
  position: relative;
  overflow: hidden;
}
.streak-pro::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--sp-tint, rgba(99,102,241,.04));
  pointer-events: none;
}
.streak-pro:active { transform: scale(.985); }
.streak-pro-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
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
  font: 800 52px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.04em;
  background: linear-gradient(135deg, #6366f1 30%, #8b5cf6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.streak-pro-lbl {
  font: 500 13px/1 'Inter', sans-serif;
  color: #64748b;
  margin-top: 3px;
}
.streak-pro-status {
  align-self: flex-start;
  font: 700 11px/1 'IBM Plex Mono', monospace;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}
.sp-saved    { background: rgba(16,185,129,.12); color: #059669; }
.sp-at_risk  { background: rgba(245,158,11,.12); color: #d97706; }
.sp-critical { background: rgba(239,68,68,.12);  color: #dc2626; }
.sp-broken   { background: rgba(100,116,139,.1); color: #64748b; }

.streak-mini-graph {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 26px;
  margin-bottom: 5px;
}
.sg-bar {
  flex: 1;
  border-radius: 3px;
  background: #e9ecf5;
  min-height: 4px;
  transition: height .3s ease, background .3s;
}
.sg-bar.active { background: linear-gradient(180deg, #8b5cf6, #6366f1); }
.streak-mini-days {
  display: flex;
  gap: 5px;
  font: 700 9px/1 'IBM Plex Mono', monospace;
  color: #94a3b8;
}
.streak-mini-days span { flex: 1; text-align: center; }
.streak-mini-days span.smd-today { color: #6366f1; }

/* ── Heatmap card ── */
.hmap-card {
  background: #fff;
  border: 1.5px solid #e2e6f2;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(11,13,26,.04);
}
.hmap-card .hmap { padding: 0; background: none; border: none; box-shadow: none; }
.hmap-tap-info {
  margin-top: 10px;
  min-height: 20px;
  font: 600 11.5px/1 'Inter', sans-serif;
  color: #64748b;
  text-align: center;
  transition: opacity .15s;
}

/* ── Bottom sheet streak détail ── */
.bs-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0);
  z-index: 490;
  pointer-events: none;
  transition: background .3s;
}
.bs-bg.open { background: rgba(0,0,0,.45); pointer-events: auto; backdrop-filter: blur(4px); }
.bs-streak {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 495;
  background: #fff;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid #e2e6f2;
  transform: translateY(100%);
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  max-height: 85dvh;
  overflow-y: auto;
}
.bs-streak.open { transform: translateY(0); }
.bs-handle {
  width: 36px; height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  margin: 14px auto 0;
}
.bs-hd { padding: 16px 20px 14px; border-bottom: 1px solid #f0f2f8; }
.bs-hd-title { font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; letter-spacing: -.02em; }
.bs-hd-sub { font: 500 12px/1.3 'Inter', sans-serif; color: #64748b; margin-top: 4px; }
.cal-month-label { padding: 14px 20px 8px; font: 800 14px/1 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; }
.cal-hd { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 0 16px 4px; }
.cal-hd span { font: 700 9.5px/1 'IBM Plex Mono', monospace; color: #94a3b8; text-align: center; letter-spacing: .04em; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; padding: 0 16px 16px; }
.cal-day {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font: 700 11px/1 'IBM Plex Mono', monospace;
  color: #64748b;
  background: #f8f9fc;
}
.cal-day.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
.cal-day.today { outline: 2px solid #6366f1; outline-offset: 1px; color: #6366f1; }
.cal-day.active.today { color: #fff; }
.cal-day.future { background: transparent; color: #d1d8ee; }
.cal-day.empty { background: transparent; }

/* ── Action du jour ── */
.action-card {
  background: linear-gradient(160deg, rgba(99,102,241,.07), rgba(99,102,241,.03));
  border: 1.5px solid rgba(99,102,241,.18);
  border-radius: 24px;
  padding: 22px 20px;
  margin-bottom: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(99,102,241,.06);
}
.action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, var(--ac, #6366f1) 0%, transparent 70%);
  opacity: .08;
  pointer-events: none;
}
.action-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
}
.action-tag {
  font: 700 10px/1 'IBM Plex Mono', monospace;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #64748b;
  background: rgba(11,13,26,.04);
  border-radius: 20px;
  padding: 4px 10px;
}
.action-urgent {
  font: 700 11px/1 'IBM Plex Mono', monospace;
  color: #f59e0b;
  background: rgba(245,158,11,.12);
  border-radius: 20px;
  padding: 4px 10px;
}
.action-ico   { font-size: 40px; line-height: 1; margin-bottom: 10px; }
.action-label { font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin-bottom: 6px; }
.action-sub   { font: 500 13px/1.4 'Inter', sans-serif; color: #64748b; margin-bottom: 20px; }
.action-btn {
  display: inline-block;
  padding: 15px 28px;
  background: linear-gradient(135deg, var(--ac, #6366f1), color-mix(in srgb, var(--ac, #6366f1) 80%, #8b5cf6));
  border: 0;
  border-radius: 16px;
  color: #fff;
  font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--ac, #6366f1) 60%, transparent);
  transition: all .2s;
  min-height: 44px;
}
.action-btn:active { transform: scale(.97); }

/* ── Section headers ── */
.sec-hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.sec-title { font: 700 16px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; }
.sec-sub   { font: 600 12px/1 'IBM Plex Mono', monospace; color: #64748b; }

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
  border-radius: 18px;
  padding: 14px;
  cursor: pointer;
  position: relative;
  transition: all .2s;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(11,13,26,.05);
}
.world-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--wg);
  opacity: 0;
  transition: opacity .2s;
}
.world-card:hover::before { opacity: 1; }
.world-card:active { transform: scale(.97); }
.world-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.world-ico  { font-size: 22px; line-height: 1; }
.world-pct  { font: 700 13px/1 'IBM Plex Mono', monospace; }
.world-name { font: 600 12px/1.3 'Inter', sans-serif; color: #475569; margin-bottom: 8px; }
.world-track {
  height: 4px;
  background: #e2e6f2;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 5px;
}
.world-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
.world-count { font: 600 11px/1 'IBM Plex Mono', monospace; color: #64748b; }
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
  border-radius: 18px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(11,13,26,.05);
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
.trophy-state   { font: 600 10px/1 'IBM Plex Mono', monospace; color: #94a3b8; }
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
  border-radius: 18px;
  text-align: center;
}
.trophees-empty-ico { font-size: 32px; opacity: .3; }
.trophees-empty-txt { font: 500 12px/1.5 'Inter', sans-serif; color: #64748b; }

/* ── Footer ── */
.acc-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 18px;
  box-shadow: 0 1px 4px rgba(11,13,26,.05);
}
.footer-stat { flex: 1; }
.footer-val  { font: 800 20px/1 'Plus Jakarta Sans', sans-serif; color: #0a0d1a; margin-bottom: 4px; }
.footer-lecon { font-size: 13px; }
.footer-lbl  { font: 500 11px/1.3 'Inter', sans-serif; color: #64748b; }
.footer-sep  { width: 1px; height: 40px; background: #e2e6f2; flex-shrink: 0; }
</style>`;

// ─── Constantes ──────────────────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
const LEVEL_NAMES   = ['', 'Débutant', 'Apprenti', 'Conducteur', 'Confirmé', 'Expert', 'Pro', 'As du Volant'];

const WORLDS = REMC.map((cat, i) => ({
  id:    cat.id,
  ico:   cat.ico,
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

  // Fetch tout en parallèle
  const [profileRes, streakRes, validRes, notifRes, leconRes, attemptsRes] = await Promise.allSettled([
    sb.from('profiles')
      .select('prenom, xp, credit_heures, last_active_at, first_value_action_at')
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

    sb.from('lecons_realisees')
      .select('date_lecon')
      .eq('eleve_id', me.id)
      .order('date_lecon', { ascending: false })
      .limit(1),

    sb.from('quiz_attempts')
      .select('created_at')
      .eq('user_id', me.id)
      .gte('created_at', new Date(Date.now() - 35 * 86400000).toISOString())
      .order('created_at', { ascending: true }),
  ]);

  const profile   = profileRes.value?.data  || { prenom: me.prenom || 'Toi', xp: 0, credit_heures: 0 };
  const streak    = streakRes.value?.data   || { current_streak: 0, last_activity_date: null, longest_streak: 0 };
  const validated = new Set((validRes.value?.data || []).map(v => v.competence_id));
  const pendingNotif = notifRes.value?.data?.[0] || null;
  const lastLecon = leconRes.value?.data?.[0]?.date_lecon || null;
  const activityDays = buildActivityData(attemptsRes.value?.data || [], streak);

  ensureHeatmapStyles();

  const lvl     = computeLevel(profile.xp || 0);
  const worlds  = computeWorlds(validated);
  const trophees = computeTrophees(worlds);
  const streakSt = streakStatus(streak);
  const cta      = computeCta({ pendingNotif, lastLecon });

  track('streak.viewed', { days: streak.current_streak, status: streakSt });

  root.innerHTML = render({ me, profile, lvl, streak, streakSt, worlds, trophees, cta, lastLecon, activityDays });
  wire(root, { cta, worlds, pendingNotif, streak, activityDays });

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
      hoursThisWeek: 0, // TODO: from lecons_realisees when data exists
      hoursLastWeek: 0,
      compsValidated: totalValidated,
      monsReview: null,
      topLessonHour: null,
      topLessonLieu: null,
      streak: streak.current_streak,
    });
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
    const pct  = Math.round((done / w.total) * 100);
    return { ...w, done, pct, complete: done === w.total };
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

function computeCta({ pendingNotif, lastLecon }) {
  if (pendingNotif?.data?.competence_id) {
    const isConsolid = pendingNotif.type === 'consolidation_quiz';
    return {
      type: pendingNotif.type,
      ico: isConsolid ? '🧠' : '⚡',
      label: isConsolid ? 'Quiz de consolidation' : 'Quiz post-validation',
      sub: isConsolid
        ? '2 questions · 30 secondes · Renforce ta mémoire'
        : '3 questions · Prouve que tu maîtrises !',
      btn: 'Commencer maintenant →',
      href: `#/quiz/${pendingNotif.data.competence_id}/${isConsolid ? 'consolidation' : 'post_validation'}`,
      accent: isConsolid ? '#8b5cf6' : '#6366f1',
    };
  }
  if (lastLecon) {
    const days = Math.floor((Date.now() - new Date(lastLecon).getTime()) / 86_400_000);
    if (days > 3) {
      return {
        type: 'reserve_lecon',
        ico: '📅',
        label: 'Planifie ta prochaine leçon',
        sub: `Dernière leçon il y a ${days} jours — contacte ton moniteur`,
        btn: 'Voir mon moniteur →',
        href: null,
        accent: '#f59e0b',
      };
    }
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

function daysSinceLabel(dateStr) {
  if (!dateStr) return 'Aucune leçon enregistrée';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "Leçon aujourd'hui";
  if (days === 1) return 'Leçon hier';
  return `Dernière leçon il y a ${days}j`;
}

// ─── Render ───────────────────────────────────────────────────────
function render({ me, profile, lvl, streak, streakSt, worlds, trophees, cta, lastLecon, activityDays = { days7: [], activeDates: [], levels: {}, details: {}, totalActive: 0 } }) {
  const totalValidated = worlds.reduce((s, w) => s + w.done, 0);

  return `${STYLE}
<div class="acc">

  <!-- 1. HEADER -->
  <div class="acc-hd">
    <div class="acc-hd-left">
      <div class="acc-avatar" aria-hidden="true">
        ${avatarSvg(profile.prenom)}
      </div>
      <div>
        <div class="acc-bonjour">Bonjour, ${esc(profile.prenom || 'toi')} 👋</div>
        <div class="acc-level">Niv. ${lvl.level} · ${esc(lvl.name)}</div>
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

  <!-- 2. STREAK PRO -->
  <div class="streak-pro" id="streak-card" role="status" aria-label="Série d'apprentissage : ${streak.current_streak} jours"
       style="--sp-tint:${streakTint(streakSt)}">
    <div class="streak-pro-top">
      <div class="streak-pro-flame ${streakSt === 'critical' ? 'flame-pulse' : ''}">
        ${flameSvg()}
      </div>
      <div class="streak-pro-center">
        <div class="streak-pro-num">${streak.current_streak}</div>
        <div class="streak-pro-lbl">jours d'affilée</div>
      </div>
      <div class="streak-pro-status sp-${streakSt}">${streakStatusLabel(streakSt)}</div>
    </div>
    <div class="streak-mini-graph">
      ${activityDays.days7.map(d => {
        const maxH = 22, minH = 4;
        const max = Math.max(1, ...activityDays.days7.map(x => x.count));
        const h = d.count > 0 ? minH + Math.round((d.count / max) * (maxH - minH)) : minH;
        return `<div class="sg-bar ${d.count > 0 ? 'active' : ''}" style="height:${h}px"></div>`;
      }).join('')}
    </div>
    <div class="streak-mini-days">
      ${activityDays.days7.map(d => {
        const DAY = ['D','L','M','M','J','V','S'];
        const dt = new Date(d.key + 'T12:00:00');
        return `<span ${d.isToday ? 'class="smd-today"' : ''}>${DAY[dt.getDay()]}</span>`;
      }).join('')}
    </div>
  </div>

  <!-- 2b. HEATMAP MON MOIS -->
  <div class="hmap-card">
    <div class="sec-hd" style="margin-bottom:10px">
      <div class="sec-title">Mon mois</div>
      <div class="sec-sub">${activityDays.totalActive} jour${activityDays.totalActive > 1 ? 's' : ''} actif${activityDays.totalActive > 1 ? 's' : ''}</div>
    </div>
    ${renderHeatmap({ activeDates: activityDays.activeDates, activityLevels: activityDays.levels, activityDetails: activityDays.details, weeks: 5, title: '' })}
    <div class="hmap-tap-info" id="hmap-info" style="opacity:0"> </div>
  </div>

  <!-- 3. ACTION DU JOUR -->
  <div class="action-card" style="--ac:${cta.accent}">
    <div class="action-top">
      <span class="action-tag">Action du jour</span>
      ${cta.type === 'consolidation_quiz' ? '<span class="action-urgent">⚡ Urgent</span>' : ''}
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
      <div class="world-card" style="--wc:${w.color};--wg:${w.glow}" data-world="${esc(w.id)}">
        <div class="world-top">
          <span class="world-ico">${w.ico}</span>
          <span class="world-pct" style="color:${w.color}">${w.pct}%</span>
        </div>
        <div class="world-name">${esc(w.name)}</div>
        <div class="world-track">
          <div class="world-fill" style="width:${w.pct}%;background:${w.color}"></div>
        </div>
        <div class="world-count">${w.done}/${w.total}</div>
        ${w.complete ? '<div class="world-crown">👑</div>' : ''}
      </div>
    `).join('')}
  </div>

  <!-- 5. TROPHÉES / COFFRES -->
  <div class="sec-hd">
    <div class="sec-title">Trophées</div>
    <div class="sec-sub">${trophees.unlocked.length}/5 débloqués</div>
  </div>
  <div class="trophees-row">
    ${trophees.unlocked.length === 0
      ? `<div class="trophees-empty">
           <div class="trophees-empty-ico">🏆</div>
           <div class="trophees-empty-txt">Valide toutes les compétences d'un monde pour débloquer ton premier trophée</div>
         </div>`
      : trophees.unlocked.slice(0, 3).map(w => `
           <div class="trophy-card trophy-unlocked" style="--tc:${w.color}">
             <div class="trophy-ico">${w.ico}</div>
             <div class="trophy-label">${esc(w.name)}</div>
             <div class="trophy-state">Acquis ✓</div>
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

  <!-- STREAK BOTTOM SHEET -->
  <div class="bs-bg" id="bs-bg"></div>
  <div class="bs-streak" id="bs-streak" role="dialog" aria-label="Détail streak">
    <div class="bs-handle"></div>
    <div class="bs-hd">
      <div class="bs-hd-title">Série d'apprentissage</div>
      <div class="bs-hd-sub">Record : ${streak.longest_streak} jour${streak.longest_streak > 1 ? 's' : ''} · En cours : ${streak.current_streak} jour${streak.current_streak > 1 ? 's' : ''}</div>
    </div>
    ${renderCalendar(activityDays.activeDates)}
  </div>

  <!-- 6. FOOTER -->
  <div class="acc-footer">
    <div class="footer-stat">
      <div class="footer-val">${profile.credit_heures ?? '—'}h</div>
      <div class="footer-lbl">de conduite restantes</div>
    </div>
    <div class="footer-sep"></div>
    <div class="footer-stat">
      <div class="footer-val footer-lecon">${daysSinceLabel(lastLecon)}</div>
      <div class="footer-lbl">Lecture seule · contacte ton moniteur</div>
    </div>
  </div>

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

function streakSubText(status, streak) {
  if (status === 'saved')   return '🟢 Ta série est sauvegardée aujourd\'hui !';
  if (status === 'critical') return '🔴 Continue ta série — moins de 6h !';
  if (status === 'at_risk') return '🟡 Fais une action aujourd\'hui pour maintenir ta série';
  return streak.longest_streak > 0
    ? `Ton record : ${streak.longest_streak} jours — relance ta série !`
    : 'Lance ta première série d\'apprentissage !';
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, { cta, streak, activityDays }) {
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
    const key = a.created_at.slice(0, 10);
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

