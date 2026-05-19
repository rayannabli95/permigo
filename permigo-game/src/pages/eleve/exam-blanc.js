// ═══════════════════════════════════════════════════════════════
// Élève — Examen blanc
// RPCs : start_exam_blanc() → submit_exam_blanc(session_id, answers)
// ═══════════════════════════════════════════════════════════════
import { sb }         from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast }      from '@/components/toast.js';
import { esc }        from '@/utils/escape.js';
import { track }      from '@/services/analytics.js';

const TOTAL_Q     = 40;
const PASS_PCT    = 70;
const DURATION_S  = 30 * 60; // 30 min in seconds

// ─── Mount ───────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;
  track('page_view', { page: 'exam_blanc', user_role: me.role });

  root.innerHTML = renderStyles() + renderIntro();
  wireIntro(root);
}

// ─── Intro screen ────────────────────────────────────────────
function renderIntro() {
  return `
<div class="exb anim-slide-up" id="exb-screen">
  <div class="exb-intro">
    <div class="exb-intro-icon">📋</div>
    <h1 class="exb-intro-title">Examen blanc</h1>
    <p class="exb-intro-sub">Teste tes connaissances dans les conditions réelles</p>

    <div class="exb-rules">
      <div class="exb-rule">
        <span class="exb-rule-ico">❓</span>
        <span class="exb-rule-txt"><strong>40 questions</strong> de code de la route</span>
      </div>
      <div class="exb-rule">
        <span class="exb-rule-ico">⏱</span>
        <span class="exb-rule-txt"><strong>30 minutes</strong> pour répondre</span>
      </div>
      <div class="exb-rule">
        <span class="exb-rule-ico">🎯</span>
        <span class="exb-rule-txt"><strong>70 % minimum</strong> pour valider (28 / 40)</span>
      </div>
      <div class="exb-rule">
        <span class="exb-rule-ico">🔒</span>
        <span class="exb-rule-txt">Pas de retour en arrière possible</span>
      </div>
    </div>

    <button class="exb-start-btn" id="exb-start">Commencer l'examen</button>
    <p class="exb-disclaimer">Résultats non pris en compte pour ton permis officiel</p>
  </div>
</div>`;
}

function wireIntro(root) {
  root.querySelector('#exb-start')?.addEventListener('click', async () => {
    const btn = root.querySelector('#exb-start');
    btn.disabled = true;
    btn.textContent = 'Chargement…';

    try {
      const { data, error } = await sb.rpc('start_exam_blanc');
      if (error || data?.error) {
        toast(data?.error || 'Impossible de démarrer l\'examen', 'error');
        btn.disabled = false;
        btn.textContent = 'Commencer l\'examen';
        return;
      }

      const { session_id, questions } = data;
      if (!session_id || !Array.isArray(questions) || questions.length === 0) {
        toast('Erreur: examen incomplet reçu', 'error');
        btn.disabled = false;
        btn.textContent = 'Commencer l\'examen';
        return;
      }

      track('exam_blanc.started', { session_id, q_count: questions.length });
      startQuiz(root, { session_id, questions });
    } catch (e) {
      console.error('[exam-blanc] start error', e);
      toast('Erreur de connexion', 'error');
      btn.disabled = false;
      btn.textContent = 'Commencer l\'examen';
    }
  });
}

// ─── Quiz flow ───────────────────────────────────────────────
function startQuiz(root, { session_id, questions }) {
  const answers = {};   // { [question_id]: answer_index }
  let currentIdx = 0;
  let timerLeft  = DURATION_S;
  let timerInterval = null;

  function renderQuestion() {
    const q = questions[currentIdx];
    const n = currentIdx + 1;

    root.querySelector('#exb-screen').innerHTML = `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" title="Abandonner">✕</button>
        <div class="exb-progress-wrap">
          <div class="exb-progress-bar">
            <div class="exb-progress-fill" style="width:${((n - 1) / questions.length) * 100}%"></div>
          </div>
          <span class="exb-progress-label">${n} / ${questions.length}</span>
        </div>
        <div class="exb-timer" id="exb-timer">${formatTime(timerLeft)}</div>
      </div>

      <div class="exb-qbody anim-slide-up" id="exb-qbody">
        <div class="exb-qnum">Question ${n}</div>
        <div class="exb-qtext">${esc(q.question || q.texte || '')}</div>

        ${q.image_url ? `<img class="exb-qimg" src="${esc(q.image_url)}" alt="Illustration" loading="lazy">` : ''}

        <div class="exb-choices" id="exb-choices">
          ${(q.options || q.choices || []).map((opt, i) => `
            <button class="exb-choice" data-idx="${i}">
              <span class="exb-choice-letter">${'ABCD'[i]}</span>
              <span class="exb-choice-text">${esc(opt)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Wire choices
    root.querySelectorAll('.exb-choice').forEach(btn => {
      btn.addEventListener('click', () => pickAnswer(btn, q.id || q.question_id));
    });

    // Wire quit
    root.querySelector('#exb-quit')?.addEventListener('click', () => {
      if (confirm('Abandonner l\'examen ? Ta progression sera perdue.')) {
        clearInterval(timerInterval);
        track('exam_blanc.abandoned', { session_id, at_question: currentIdx });
        mount(root);
      }
    });
  }

  function pickAnswer(btn, questionId) {
    if (btn.classList.contains('exb-choice--selected')) return;

    const idx = parseInt(btn.dataset.idx, 10);
    answers[questionId] = idx;

    // Visual feedback
    root.querySelectorAll('.exb-choice').forEach(b => b.classList.remove('exb-choice--selected'));
    btn.classList.add('exb-choice--selected');

    // Auto-advance after 350ms
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        currentIdx++;
        const qbody = root.querySelector('#exb-qbody');
        if (qbody) {
          qbody.classList.remove('anim-slide-up');
          void qbody.offsetWidth;
          qbody.classList.add('anim-slide-up');
        }
        renderQuestion();
      } else {
        // Last question answered
        clearInterval(timerInterval);
        submitExam();
      }
    }, 350);
  }

  function tickTimer() {
    timerLeft--;
    const el = root.querySelector('#exb-timer');
    if (el) {
      el.textContent = formatTime(timerLeft);
      if (timerLeft <= 5 * 60) el.classList.add('exb-timer--urgent');
    }
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      submitExam();
    }
  }

  async function submitExam() {
    root.querySelector('#exb-screen').innerHTML = `
      <div class="exb-submitting">
        <div class="exb-submitting-ico">⏳</div>
        <div class="exb-submitting-txt">Correction en cours…</div>
      </div>
    `;

    try {
      const { data, error } = await sb.rpc('submit_exam_blanc', {
        session_id,
        answers,
      });
      if (error || data?.error) {
        toast(data?.error || 'Erreur lors de la correction', 'error');
        mount(root);
        return;
      }
      track('exam_blanc.submitted', { session_id, score: data?.score });
      showResults(data);
    } catch (e) {
      console.error('[exam-blanc] submit error', e);
      toast('Erreur de connexion', 'error');
      mount(root);
    }
  }

  function showResults(res) {
    const score    = res?.score ?? 0;
    const total    = res?.total ?? TOTAL_Q;
    const pct      = Math.round((score / total) * 100);
    const passed   = pct >= PASS_PCT;
    const details  = res?.details || [];

    track('exam_blanc.result', { session_id, score, total, pct, passed });

    root.querySelector('#exb-screen').innerHTML = `
      <div class="exb-results anim-slide-up">
        <div class="exb-res-top ${passed ? 'exb-res-top--pass' : 'exb-res-top--fail'}">
          <div class="exb-res-ico">${passed ? '🏆' : '📚'}</div>
          <div class="exb-res-score">${score}<span class="exb-res-total">/${total}</span></div>
          <div class="exb-res-pct">${pct} %</div>
          <div class="exb-res-label">${passed ? 'Réussi !' : 'À retenter'}</div>
        </div>

        <div class="exb-res-body">
          <div class="exb-res-bar-wrap">
            <div class="exb-res-bar">
              <div class="exb-res-bar-fill ${passed ? 'exb-res-bar-fill--pass' : ''}" style="width:0%" data-target="${pct}%"></div>
            </div>
            <div class="exb-res-bar-labels">
              <span>0 %</span>
              <span class="exb-res-bar-threshold">70 %</span>
              <span>100 %</span>
            </div>
          </div>

          ${passed
            ? '<p class="exb-res-msg">Bravo ! Tu maîtrises bien le code de la route. Continue à travailler tes compétences faibles.</p>'
            : `<p class="exb-res-msg">Il te manque ${PASS_PCT - pct} points. Concentre-toi sur les thèmes où tu as perdu des points.</p>`
          }

          ${details.length > 0 ? `
          <div class="exb-res-detail-title">Détail par question</div>
          <div class="exb-res-details">
            ${details.map((d, i) => `
              <div class="exb-res-detail-row ${d.correct ? 'exb-res-detail-row--ok' : 'exb-res-detail-row--ko'}">
                <span class="exb-res-detail-n">${i + 1}</span>
                <span class="exb-res-detail-ico">${d.correct ? '✓' : '✗'}</span>
                <span class="exb-res-detail-q">${esc(d.question || '')}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>

        <div class="exb-res-actions">
          <button class="exb-retry-btn" id="exb-retry">Refaire un examen</button>
        </div>
      </div>
    `;

    // Animate bar
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fill = root.querySelector('.exb-res-bar-fill');
      if (fill) fill.style.width = fill.dataset.target;
    }));

    root.querySelector('#exb-retry')?.addEventListener('click', () => mount(root));
  }

  // Start
  renderQuestion();
  timerInterval = setInterval(tickTimer, 1000);
}

// ─── Helpers ─────────────────────────────────────────────────
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Styles ──────────────────────────────────────────────────
function renderStyles() {
  return `<style>
/* === Exam Blanc === */
.exb {
  min-height: 100svh;
  background: #0a0d1a;
  font-family: 'Inter', sans-serif;
  color: #fff;
  display: flex;
  flex-direction: column;
}

/* Intro */
.exb-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 120px;
  gap: 0;
}
.exb-intro-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.exb-intro-title {
  font: 700 28px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  margin: 0 0 8px;
  text-align: center;
}
.exb-intro-sub {
  font: 400 15px/1.5 'Inter', sans-serif;
  color: var(--mu2);
  text-align: center;
  margin: 0 0 32px;
}

.exb-rules {
  background: #1a1d2e;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 32px;
}
.exb-rule {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.exb-rule-ico {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
.exb-rule-txt {
  font: 400 14px/1.5 'Inter', sans-serif;
  color: #cbd5e1;
}
.exb-rule-txt strong { color: #fff; }

.exb-start-btn {
  width: 100%;
  max-width: 400px;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 14px;
  color: #fff;
  font: 700 16px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(.23,1,.32,1), opacity 160ms;
  min-height: 54px;
}
.exb-start-btn:active { transform: scale(0.97); }
.exb-start-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

.exb-disclaimer {
  font: 400 12px/1.5 'Inter', sans-serif;
  color: #475569;
  text-align: center;
  margin: 12px 0 0;
}

/* Quiz header */
.exb-quiz-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(10,13,26,.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.exb-quit-btn {
  background: rgba(255,255,255,.08);
  border: none;
  border-radius: 8px;
  color: var(--mu2);
  font-size: 16px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms;
}
.exb-quit-btn:active { background: rgba(255,255,255,.15); }

.exb-progress-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.exb-progress-bar {
  height: 4px;
  background: rgba(255,255,255,.1);
  border-radius: 2px;
  overflow: hidden;
}
.exb-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px;
  transition: width 300ms cubic-bezier(.23,1,.32,1);
}
.exb-progress-label {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu);
  text-align: right;
}
.exb-timer {
  font: 700 15px/1 'IBM Plex Mono', monospace;
  color: var(--mu2);
  flex-shrink: 0;
  min-width: 48px;
  text-align: right;
}
.exb-timer--urgent { color: #ef4444; animation: exb-pulse 1s ease-in-out infinite; }

/* Question body */
.exb-qbody {
  padding: 24px 20px 120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.exb-qnum {
  font: 500 12px/1 'Inter', sans-serif;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.exb-qtext {
  font: 600 18px/1.5 'Plus Jakarta Sans', sans-serif;
  color: #f1f5f9;
}
.exb-qimg {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
  max-height: 200px;
}
.exb-choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exb-choice {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #1a1d2e;
  border: 1.5px solid rgba(255,255,255,.08);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 140ms, background 140ms, transform 100ms;
  min-height: 54px;
}
.exb-choice:active { transform: scale(0.98); }
.exb-choice--selected {
  border-color: #6366f1;
  background: rgba(99,102,241,.12);
}
.exb-choice-letter {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255,255,255,.08);
  font: 700 13px/28px 'IBM Plex Mono', monospace;
  color: var(--mu2);
  text-align: center;
  flex-shrink: 0;
  transition: background 140ms, color 140ms;
}
.exb-choice--selected .exb-choice-letter {
  background: #6366f1;
  color: #fff;
}
.exb-choice-text {
  font: 400 14px/1.5 'Inter', sans-serif;
  color: #e2e8f0;
}

/* Submitting */
.exb-submitting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50svh;
  gap: 16px;
}
.exb-submitting-ico { font-size: 40px; }
.exb-submitting-txt {
  font: 500 16px/1 'Inter', sans-serif;
  color: var(--mu2);
}

/* Results */
.exb-results {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}
.exb-res-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 40px;
  gap: 8px;
}
.exb-res-top--pass { background: linear-gradient(160deg, rgba(34,197,94,.15) 0%, rgba(10,13,26,0) 100%); }
.exb-res-top--fail { background: linear-gradient(160deg, rgba(239,68,68,.1) 0%, rgba(10,13,26,0) 100%); }
.exb-res-ico { font-size: 48px; margin-bottom: 8px; }
.exb-res-score {
  font: 800 56px/1 'Plus Jakarta Sans', sans-serif;
  color: #f1f5f9;
}
.exb-res-total { font-size: 28px; color: #64748b; }
.exb-res-pct {
  font: 700 20px/1 'IBM Plex Mono', monospace;
  color: var(--mu2);
}
.exb-res-label {
  font: 700 18px/1 'Plus Jakarta Sans', sans-serif;
  color: #f1f5f9;
  margin-top: 4px;
}
.exb-res-top--pass .exb-res-label { color: #22c55e; }
.exb-res-top--fail .exb-res-label { color: #ef4444; }

.exb-res-body {
  flex: 1;
  padding: 0 20px 20px;
}
.exb-res-bar-wrap { margin-bottom: 16px; }
.exb-res-bar {
  height: 8px;
  background: rgba(255,255,255,.08);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 6px;
}
.exb-res-bar::after {
  content: '';
  position: absolute;
  left: 70%;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: rgba(255,255,255,.3);
  border-radius: 1px;
}
.exb-res-bar-fill {
  height: 100%;
  background: #ef4444;
  border-radius: 4px;
  transition: width 900ms cubic-bezier(.23,1,.32,1);
}
.exb-res-bar-fill--pass { background: #22c55e; }
.exb-res-bar-labels {
  display: flex;
  justify-content: space-between;
  font: 400 11px/1 'IBM Plex Mono', monospace;
  color: #475569;
}
.exb-res-bar-threshold { color: #64748b; }

.exb-res-msg {
  font: 400 14px/1.6 'Inter', sans-serif;
  color: var(--mu2);
  margin: 0 0 24px;
}
.exb-res-detail-title {
  font: 600 13px/1 'Inter', sans-serif;
  color: var(--mu);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 10px;
}
.exb-res-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}
.exb-res-detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #1a1d2e;
}
.exb-res-detail-row--ok { border-left: 3px solid #22c55e; }
.exb-res-detail-row--ko { border-left: 3px solid #ef4444; }
.exb-res-detail-n {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: var(--mu);
  min-width: 20px;
}
.exb-res-detail-ico {
  font: 700 14px/1 'IBM Plex Mono', monospace;
  min-width: 16px;
}
.exb-res-detail-row--ok .exb-res-detail-ico { color: #22c55e; }
.exb-res-detail-row--ko .exb-res-detail-ico { color: #ef4444; }
.exb-res-detail-q {
  font: 400 13px/1.4 'Inter', sans-serif;
  color: var(--mu2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exb-res-actions {
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255,255,255,.06);
}
.exb-retry-btn {
  width: 100%;
  padding: 16px;
  background: #1a1d2e;
  border: 1.5px solid rgba(255,255,255,.1);
  border-radius: 14px;
  color: #fff;
  font: 600 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: background 160ms;
  min-height: 54px;
}
.exb-retry-btn:active { background: #252840; }

@keyframes exb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>`;
}
