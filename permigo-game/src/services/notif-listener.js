// ═══════════════════════════════════════════════════════════════
// Notif Listener — polling notifications toutes les 30s
// Lance automatiquement les quiz post-validation ou consolidation
// Démarrer dans main.js après login : startNotifListener()
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { lancerQuiz } from '@/services/quiz-engine.js';
import { track } from '@/services/analytics.js';
import { toast } from '@/components/common/toast.js';
import { burstConfetti } from '@/components/common/confetti.js';
import { markHasValidated } from '@/services/web-push.js';
import { playNotify } from '@/utils/sound.js';

const POLL_INTERVAL = 30_000; // 30 secondes
let _intervalId = null;
let _quizOpen = false;

export function startNotifListener() {
  if (_intervalId) return;
  const me = getCurUser();
  import.meta.env.DEV && console.log(`[notif-listener] starting, user=${me?.id ?? 'none'}`);
  poll();
  _intervalId = setInterval(poll, POLL_INTERVAL);
}

export function stopNotifListener() {
  import.meta.env.DEV && console.log('[notif-listener] stopping');
  clearInterval(_intervalId);
  _intervalId = null;
}

// ─── Polling ─────────────────────────────────────────────────────
async function poll() {
  const me = getCurUser();
  import.meta.env.DEV && console.log(`[notif-listener] poll cycle — user=${me?.id ?? 'none'} quizOpen=${_quizOpen}`);

  if (!me || _quizOpen) return;

  try {
    // IMPORTANT: user_id dans notifications = profiles.id (pas auth.users.id)
    const { data, error } = await sb
      .from('notifications')
      .select('id, type, data')
      .eq('user_id', me.id)
      .eq('read', false)
      .order('created_at', { ascending: true })
      .limit(5);

    import.meta.env.DEV && console.log(`[notif-listener] found ${data?.length ?? 0} unread notifs`, error ?? '');

    if (error || !data?.length) return;

    for (const notif of data) {
      import.meta.env.DEV && console.log(`[notif-listener] dispatching type=${notif.type} id=${notif.id}`);
      // Marquer LU avant de traiter → anti double-trigger même si quiz crash
      await sb.from('notifications').update({ read: true }).eq('id', notif.id);
      await dispatch(notif, me);
    }
  } catch (e) {
    console.warn('[notif-listener] poll error', e);
  }
}

// ─── Dispatch par type ───────────────────────────────────────────
async function dispatch(notif, me) {
  switch (notif.type) {
    case 'post_validation_quiz':
      // Dopamine: celebrate before launching quiz
      _celebrateValidation(notif.data?.competence_id);
      await handleQuiz(notif, me, 'post_validation', 3);
      break;
    case 'consolidation_quiz':
      await handleQuiz(notif, me, 'consolidation', 2);
      break;
    default:
      import.meta.env.DEV && console.log(`[notif-listener] unknown notif type: ${notif.type}`);
  }
}

async function _celebrateValidation(compId) {
  // Marque que l'élève a ≥1 validation → débloque le banner push
  markHasValidated();

  playNotify();
  setTimeout(() => {
    burstConfetti({ count: 55, power: 10, spread: Math.PI * 0.5 });
  }, 200);
  const compLabel = compId ? ` (${compId})` : '';
  toast(`Nouvelle compétence acquise${compLabel} !`, 'success', 4000);

  // Trigger éventuel d'un Celebrate Screen fullscreen sur les paliers majeurs
  // (1ère validation, 10 acquises, 28 acquises = prêt examen, 31 acquises = permis)
  try {
    const me = (await import('@/auth/cur-user.js')).getCurUser();
    if (!me?.id) return;
    const { sb } = await import('@/auth/auth.js');
    const { count } = await sb
      .from('validations')
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', me.id)
      .eq('statut', 'acquis');
    if (typeof count === 'number') {
      const { maybeCelebrateMilestone } = await import('@/components/common/celebrate-screen.js');
      // Petit délai pour laisser le confetti + toast respirer
      setTimeout(() => maybeCelebrateMilestone(count), 800);
    }
  } catch (e) {
    console.warn('[notif-listener] milestone celebrate failed', e);
  }
}

async function handleQuiz(notif, me, type, nbQuestions) {
  const competenceId = notif.data?.competence_id;
  if (!competenceId || _quizOpen) return;

  import.meta.env.DEV && console.log(`[notif-listener] launching quiz type=${type} competence=${competenceId}`);
  track('notification.opened', { type: notif.type, competence_id: competenceId });

  _quizOpen = true;
  try {
    await lancerQuiz({
      competenceId,
      type,
      nbQuestions,
      onComplete: async (score, total) => {
        _quizOpen = false;
        import.meta.env.DEV && console.log(`[notif-listener] quiz done score=${score}/${total}`);
        await saveQuizResult(me, { competenceId, type, score, total });
      },
    });
  } catch (e) {
    _quizOpen = false;
    console.warn('[notif-listener] quiz launch failed', e);
  }
}

// ─── Persistance résultats ────────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000];

async function saveQuizResult(me, { competenceId, type, score, total }) {
  const scorePct = Math.round((score / total) * 100);
  const scoreField = type === 'post_validation' ? 'score_cognitif' : 'score_consolidation';
  const xpGain = type === 'post_validation' ? 25 : 10;

  // Fetch current XP before update
  const { data: profileBefore } = await sb.from('profiles').select('xp').eq('id', me.id).maybeSingle();
  const xpBefore = profileBefore?.xp ?? 0;

  const { error: errAttempt } = await sb.from('quiz_attempts').insert({
    user_id: me.id,
    competence_id: competenceId,
    type,
    score: scorePct,
  });
  if (errAttempt) {
    console.error('[notif-listener] quiz_attempts insert failed', errAttempt);
    toast('Sauvegarde du quiz impossible', 'error');
    return;
  }

  const { error: errVal } = await sb.from('validations')
    .update({
      [scoreField]: scorePct,
      ...(type === 'consolidation' ? { consolidation_done_at: new Date().toISOString() } : {}),
    })
    .eq('eleve_id', me.id)
    .eq('competence_id', competenceId);
  if (errVal) {
    console.error('[notif-listener] validation update failed', errVal);
    // On continue malgré tout — l'attempt est déjà sauvegardé
  }

  // Increment XP
  const { error: errXp } = await sb.from('profiles').update({ xp: xpBefore + xpGain }).eq('id', me.id);
  if (errXp) {
    console.error('[notif-listener] XP increment failed', errXp);
    // L'XP sera re-calculée au prochain refresh — on continue
  }

  // Detect level up
  const xpAfter = xpBefore + xpGain;
  const lvlBefore = XP_THRESHOLDS.findLastIndex(t => xpBefore >= t) + 1;
  const lvlAfter  = XP_THRESHOLDS.findLastIndex(t => xpAfter  >= t) + 1;
  if (lvlAfter > lvlBefore) {
    setTimeout(() => {
      burstConfetti({ count: 80, power: 13 });
      toast(`Niveau ${lvlAfter} atteint ! +${xpGain} XP`, 'success', 5000);
      track('level_up', { level: lvlAfter, xp: xpAfter });
    }, 800);
  }

  track('quiz.result_saved', {
    source: 'notif_listener',
    competence_id: competenceId,
    type,
    score_pct: scorePct,
  });
}
