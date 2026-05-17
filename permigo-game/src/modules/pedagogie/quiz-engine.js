// ═══════════════════════════════════════════════════════════════
// Quiz Engine — moteur générique pour quizzes Triple Validation
// Utilisé par post-validation (3 questions) + consolidation (2 questions)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { burstConfetti } from '@/components/confetti.js';

/**
 * @param {Object} opts
 * @param {string} opts.competenceId  - ex: C1a, C2f, etc.
 * @param {'post_validation'|'consolidation'} opts.type
 * @param {number} opts.nbQuestions
 * @param {(score, total) => void} opts.onComplete
 */
export async function lancerQuiz({ competenceId, type, nbQuestions, onComplete }) {
  const { data: questions, error } = await sb
    .from('questions_competence')
    .select('id, competence_id, type, question, options, correct_index, explanation, difficulty')
    .eq('competence_id', competenceId)
    .eq('type', type)
    .limit(nbQuestions);

  if (error || !questions?.length) {
    console.error('[quiz]', error);
    return null;
  }

  // Mélange + slice
  const pool = shuffle(questions).slice(0, nbQuestions);
  let idx = 0;
  let score = 0;

  track('quiz.started', { competence_id: competenceId, quiz_type: type, nb_questions: pool.length });

  const overlay = renderOverlay();
  document.body.appendChild(overlay);

  function renderQuestion() {
    const q = pool[idx];
    if (!q) return finish();

    overlay.querySelector('.quiz-body').innerHTML = `
      <div class="quiz-progress">
        <span>${idx + 1} / ${pool.length}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${((idx) / pool.length) * 100}%"></div></div>
      </div>
      <h3 class="quiz-q">${esc(q.question)}</h3>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-opt" data-i="${i}">${esc(opt)}</button>
        `).join('')}
      </div>
    `;

    overlay.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.i, 10), q, btn));
    });
  }

  function handleAnswer(chosen, q, btn) {
    const correct = chosen === q.correct_index;
    if (correct) score++;

    overlay.querySelectorAll('.quiz-opt').forEach(b => {
      b.disabled = true;
      const i = parseInt(b.dataset.i, 10);
      if (i === q.correct_index) b.classList.add('ok');
      else if (i === chosen) b.classList.add('ko');
    });

    if (q.explanation) {
      const expl = document.createElement('div');
      expl.className = 'quiz-expl';
      expl.innerHTML = `<strong>${correct ? '✅' : '💡'}</strong> ${esc(q.explanation)}`;
      overlay.querySelector('.quiz-options').appendChild(expl);
    }

    track('quiz.question_answered', {
      competence_id: competenceId,
      quiz_type: type,
      correct,
      question_id: q.id,
    });

    setTimeout(() => {
      idx++;
      renderQuestion();
    }, correct ? 900 : 1800);
  }

  async function finish() {
    const total = pool.length;
    const perfect = score === total;
    track('quiz.completed', {
      competence_id: competenceId,
      quiz_type: type,
      score,
      total,
      score_pct: Math.round((score / total) * 100),
    });

    // Confetti sur score parfait
    if (perfect) burstConfetti({ count: 100, power: 16 });

    overlay.querySelector('.quiz-body').innerHTML = `
      <div class="quiz-result">
        <div class="quiz-score">${score}/${total}</div>
        <p>${perfect ? '🔥 Parfait !' : score >= total * 0.6 ? '👍 Bien !' : '🤔 À revoir'}</p>
        <button class="quiz-close-btn">Continuer</button>
      </div>
    `;
    overlay.querySelector('.quiz-close-btn').addEventListener('click', () => {
      overlay.remove();
      onComplete?.(score, total);
    });
  }

  renderQuestion();
  return overlay;
}

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderOverlay() {
  const el = document.createElement('div');
  el.className = 'quiz-overlay';
  el.innerHTML = `
    <style>
      .quiz-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,13,26,.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:quizIn .3s ease}
      @keyframes quizIn{from{opacity:0}to{opacity:1}}
      .quiz-body{width:100%;max-width:480px;background:linear-gradient(180deg,#1a1d2e,#0f1220);border:1px solid rgba(99,102,241,.3);border-radius:24px;padding:28px;color:#fff}
      .quiz-progress{display:flex;align-items:center;gap:12px;font:600 13px/1 'Inter';color:#94a3b8;margin-bottom:20px}
      .quiz-bar{flex:1;height:6px;background:rgba(148,163,184,.15);border-radius:3px;overflow:hidden}
      .quiz-bar-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .4s ease}
      .quiz-q{font:700 19px/1.3 'Plus Jakarta Sans';margin:0 0 20px}
      .quiz-options{display:flex;flex-direction:column;gap:10px}
      .quiz-opt{padding:14px 18px;background:rgba(99,102,241,.1);border:1.5px solid rgba(99,102,241,.25);border-radius:14px;color:#fff;font:600 15px/1.3 'Inter';text-align:left;cursor:pointer;transition:all .2s}
      .quiz-opt:hover:not(:disabled){background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.5);transform:translateX(2px)}
      .quiz-opt.ok{background:rgba(16,185,129,.2);border-color:#10b981}
      .quiz-opt.ko{background:rgba(239,68,68,.2);border-color:#ef4444}
      .quiz-opt:disabled{cursor:default}
      .quiz-expl{margin-top:14px;padding:14px;background:rgba(99,102,241,.08);border-radius:12px;font:500 14px/1.5 'Inter';color:#cbd5e1}
      .quiz-result{text-align:center;padding:20px 0}
      .quiz-score{font:800 56px/1 'Plus Jakarta Sans';background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px}
      .quiz-result p{font:600 17px/1.4 'Inter';color:#cbd5e1;margin:0 0 24px}
      .quiz-close-btn{padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:14px;color:#fff;font:700 15px/1 'Inter';cursor:pointer}
    </style>
    <div class="quiz-body"></div>
  `;
  return el;
}
