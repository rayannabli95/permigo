// ═══════════════════════════════════════════════════════════════
// Élève — Quiz post-validation ou consolidation
// mount(root, { competenceId, type })
// type: 'post_validation' (3 questions) | 'consolidation' (2 questions)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { lancerQuiz } from '@/modules/pedagogie/quiz-engine.js';
import { findSubComp, findCategory } from '@/data/remc.js';
import { unlockChest } from '@/utils/game-state.js';

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
  .qp {
    padding: 32px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .qp-card {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 24px;
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(11,13,26,.07);
  }
  .qp-badge {
    display: inline-block;
    font: 700 11px/1 'Inter', sans-serif;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #6366f1;
    background: rgba(99,102,241,.1);
    border-radius: 20px;
    padding: 5px 12px;
    margin-bottom: 20px;
  }
  .qp-cat-row {
    font: 500 13px/1 'Inter', sans-serif;
    color: var(--mu);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .qp-comp {
    font: 800 22px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 20px;
  }
  .qp-meta {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 28px;
  }
  .qp-meta-item {
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--mu);
    background: var(--bg2);
    border-radius: 20px;
    padding: 6px 12px;
  }
  .btn-start {
    width: 100%;
    padding: 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: 0;
    border-radius: 16px;
    color: #fff;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(99,102,241,.4);
    transition: transform .15s, opacity .15s, box-shadow .15s;
    margin-bottom: 12px;
  }
  .btn-start:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
  .btn-start:not(:disabled):active { transform: scale(.97); }
  .btn-skip {
    background: none;
    border: 0;
    color: var(--mu);
    font: 500 14px/1 'Inter', sans-serif;
    cursor: pointer;
    padding: 8px;
    width: 100%;
  }

  /* Result */
  .qp-result-card { animation: pop .35s cubic-bezier(.23,1,.32,1); }
  @keyframes pop { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .qp-result-card { animation: none; } }
  .qp-score-ring {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }
  .ring-ok { border-color: #10b981; background: rgba(16,185,129,.08); }
  .ring-warn { border-color: #f59e0b; background: rgba(245,158,11,.08); }
  .qp-score-num {
    font: 800 28px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
  }
  .qp-score-pct {
    font: 600 14px/1 'Inter', sans-serif;
    color: var(--mu);
    margin-top: 4px;
  }
  .qp-result-msg {
    font: 500 15px/1.5 'Inter', sans-serif;
    color: #475569;
    margin: 0 0 28px;
  }
  .btn-parcours {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: 0;
    border-radius: 14px;
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    margin-bottom: 12px;
    transition: transform .15s, opacity .15s;
    box-shadow: 0 6px 20px rgba(99,102,241,.25);
  }
  .btn-parcours:active { transform: scale(.98); }
  .btn-home {
    width: 100%;
    padding: 14px;
    background: var(--bg);
    border: 1.5px solid var(--bo);
    border-radius: 14px;
    color: #475569;
    font: 600 14px/1 'Inter', sans-serif;
    cursor: pointer;
  }
</style>`;

export async function mount(root, params = {}) {
  const me = getCurUser();
  if (!me) return;

  // Params viennent soit d'un appel direct, soit du hash #/quiz/C1a/post_validation
  const hashParts = location.hash.replace(/^#\/?/, '').split('/');
  const competenceId = params.competenceId || hashParts[1] || null;
  const type = params.type || hashParts[2] || 'post_validation';
  const autoStart = params.autoStart || hashParts[3] === 'auto';

  if (!competenceId) {
    root.innerHTML = `<div style="padding:32px;text-align:center;color:#94a3b8">Aucune compétence à réviser.</div>`;
    return;
  }

  const sub = findSubComp(competenceId);
  const cat = findCategory(competenceId);
  const nbQuestions = type === 'post_validation' ? 3 : 2;
  const typeLabel = type === 'post_validation' ? 'Quiz post-validation' : 'Consolidation 48h';

  track('page.view', { page: 'eleve_quiz', competence_id: competenceId, quiz_type: type });

  root.innerHTML = `
    ${STYLE}
    <div class="qp anim-slide-up">
      <div class="qp-card" id="qp-welcome">
        <div class="qp-badge">${esc(typeLabel)}</div>
        <div class="qp-cat-row">${cat?.ico || ''} <span>${esc(cat?.name || '')}</span></div>
        <h2 class="qp-comp">${esc(sub?.n || competenceId)}</h2>
        <div class="qp-meta">
          <span class="qp-meta-item">📝 ${nbQuestions} questions</span>
          <span class="qp-meta-item">⚡ ~30 secondes</span>
        </div>
        <button class="btn-start" id="btn-start">Commencer 🚀</button>
        <button class="btn-skip" id="btn-skip">Plus tard</button>
      </div>
    </div>
  `;

  const startQuiz = async () => {
    root.querySelector('#btn-start').disabled = true;
    const startTs = Date.now();

    await lancerQuiz({
      competenceId,
      type,
      nbQuestions,
      onComplete: async (score, total) => {
        const duration = Math.round((Date.now() - startTs) / 1000);
        await handleComplete(root, me, { competenceId, type, score, total, duration });
      },
    });
  };

  root.querySelector('#btn-start').addEventListener('click', startQuiz);
  root.querySelector('#btn-skip').addEventListener('click', () => {
    track('quiz.skipped', { competence_id: competenceId, type });
    location.hash = '#/';
  });

  // Lancement automatique (depuis notif-listener)
  if (autoStart) {
    await startQuiz();
  }
}

// ─── Fin de quiz ─────────────────────────────────────────────────
async function handleComplete(root, me, { competenceId, type, score, total, duration }) {
  const scorePct = Math.round((score / total) * 100);
  const success = score >= Math.ceil(total * 0.67); // ≥ 2/3

  // Persister quiz_attempts
  const { error: errAttempt } = await sb.from('quiz_attempts').insert({
    user_id: me.id,
    competence_id: competenceId,
    type,
    score: scorePct,
    duration_seconds: duration,
  });
  if (errAttempt) console.warn('[quiz] quiz_attempts insert failed', errAttempt);

  // Recalculer score_cognitif ou score_consolidation dans validations
  const scoreField = type === 'post_validation' ? 'score_cognitif' : 'score_consolidation';
  const extraFields = type === 'consolidation'
    ? { consolidation_done_at: new Date().toISOString() }
    : {};

  const { error: errVal } = await sb
    .from('validations')
    .update({ [scoreField]: scorePct, ...extraFields })
    .eq('eleve_id', me.id)
    .eq('competence_id', competenceId);
  if (errVal) console.warn('[quiz] validations update failed', errVal);

  track('quiz.result_saved', {
    competence_id: competenceId,
    type,
    score_pct: scorePct,
    success,
    duration_seconds: duration,
  });

  // Coffre quiz parfait (100%) — idempotent, unique par utilisateur
  if (scorePct === 100) {
    unlockChest('perfect_quiz', { xp: 100, gemmes: 25, title: 'Précision' }).catch(() => {});
  }

  if (success) {
    toast('🔥 Compétence consolidée !', 'success');
  } else {
    toast('💡 On va re-travailler ça avec ton moniteur', 'info');
  }

  renderResult(root, { score, total, scorePct, success, type });
}

function renderResult(root, { score, total, scorePct, success, type }) {
  const msg = success
    ? 'Bien joué ! La mémoire fait son travail.'
    : 'Pas de panique — revoir avec ton moniteur avant la prochaine leçon.';

  root.innerHTML = `
    ${STYLE}
    <div class="qp anim-slide-up">
      <div class="qp-card qp-result-card">
        <div class="qp-score-ring ${success ? 'ring-ok' : 'ring-warn'}">
          <span class="qp-score-num">${score}/${total}</span>
          <span class="qp-score-pct">${scorePct}%</span>
        </div>
        <p class="qp-result-msg">${esc(msg)}</p>
        <button class="btn-parcours" id="btn-parcours">Voir mon parcours →</button>
        ${!success ? `<button class="btn-home" id="btn-home">Retour accueil</button>` : ''}
      </div>
    </div>
  `;

  root.querySelector('#btn-parcours')?.addEventListener('click', () => { location.hash = '#/parcours'; });
  root.querySelector('#btn-home')?.addEventListener('click', () => { location.hash = '#/'; });
}

