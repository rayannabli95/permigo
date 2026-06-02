// ═══════════════════════════════════════════════════════════════
// Élève — Ton parcours d'examen (5 parcours × 15 questions)
// 100 % statique — pas de Supabase
// Seuil : 12/15 (80 %) — verdict CEPC
// ═══════════════════════════════════════════════════════════════
import { getCurUser }            from '@/auth/cur-user.js';
import { esc }                   from '@/utils/escape.js';
import { track }                 from '@/services/analytics.js';
import { navigate }              from '@/router.js';
import { PARCOURS, questionsForParcours } from '@/data/parcours-quiz.js';
import { haptic }                from '@/utils/haptic.js';
import { playPageturn, playCorrect, playWrong, playFanfare } from '@/utils/sound.js';

const PASS_THRESHOLD = 12; // / 15

// Trophées DÉCORATIFS (pas de déblocage ici — pur design)
const TROPHY_START = { img: '/skins/trophy-first-validation.png', emoji: '⚡', nom: 'Première étincelle' };
const TROPHY_END   = { img: '/skins/trophy-streak-30d.png',       emoji: '💎', nom: 'Mois sans rater' };

function renderTrophy(t, variant) {
  return `
    <div class="exb-trophy ${variant}">
      <img class="exb-trophy-img" src="${esc(t.img)}" alt="${esc(t.nom)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="exb-trophy-emoji" style="display:none">${t.emoji}</span>
      <span class="exb-trophy-cap">${esc(t.nom)}</span>
    </div>`;
}

// Parcours visuel : 15 points reliés, vert (juste) / rouge (faux) / courant
function renderTrack(questions, answers, currentIdx) {
  return `<div class="exb-track" id="exb-track">${questions.map((q, i) => {
    let cls = '';
    if (answers[i] === null || answers[i] === undefined) cls = (i === currentIdx ? 'is-current' : '');
    else cls = (answers[i] === q.correct ? 'is-correct' : 'is-wrong');
    return `<span class="exb-node ${cls}" data-node="${i}"></span>`;
  }).join('')}</div>`;
}

// ─── Mount ───────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  // Masque la bottom nav pendant le quiz (anti-distraction)
  document.getElementById('bottom-nav')?.setAttribute('hidden', '');
  const _restoreNav = () => {
    document.getElementById('bottom-nav')?.removeAttribute('hidden');
    window.removeEventListener('hashchange', _restoreNav);
  };
  window.addEventListener('hashchange', _restoreNav);

  track('page_view', { page: 'parcours_quiz', user_role: me.role });

  root.innerHTML = renderStyles() + renderSelection();
  wireSelection(root);
}

// ─── Écran 1 : sélection du parcours ─────────────────────────
function renderSelection() {
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  const cards = PARCOURS.map(p => `
    <button class="exb-pcard" data-pid="${p.id}" aria-label="Démarrer le parcours ${esc(p.nom)}">
      <div class="exb-pcard-top">
        <span class="exb-pcard-num">Parcours ${p.id}</span>
        <span class="exb-pcard-stars" aria-label="Difficulté ${p.difficulte}/5">${esc(stars(p.difficulte))}</span>
      </div>
      <div class="exb-pcard-nom">${esc(p.nom)}</div>
      <div class="exb-pcard-ctx">${esc(p.contexte)}</div>
      <div class="exb-pcard-meta">15 questions · seuil 12/15</div>
    </button>
  `).join('');

  return `
<div class="exb anim-slide-up" id="exb-screen">
  <div class="exb-sel-header">
    <button class="exb-quit-btn" id="exb-back" aria-label="Retour">←</button>
    ${renderTrophy(TROPHY_START, 'exb-trophy--start')}
    <h1 class="exb-sel-title">Ton parcours d'examen</h1>
    <p class="exb-sel-sub">5 parcours · 15 questions · estime tes chances au permis</p>
  </div>
  <div class="exb-pcards" id="exb-pcards">
    ${cards}
  </div>
</div>`;
}

function wireSelection(root) {
  root.querySelector('#exb-back')?.addEventListener('click', () => {
    haptic('tap');
    navigate('/');
  });

  root.querySelectorAll('.exb-pcard').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = parseInt(btn.dataset.pid, 10);
      haptic('select');
      startParcours(root, pid);
    });
  });
}

// ─── Écran 2 : quiz ──────────────────────────────────────────
function startParcours(root, parcours_id) {
  const parcours   = PARCOURS.find(p => p.id === parcours_id);
  const questions  = questionsForParcours(parcours_id);
  const answers    = new Array(questions.length).fill(null); // null = non répondu
  let currentIdx   = 0;
  let answered     = false; // flag pour éviter le double-clic

  track('parcours_quiz.started', { parcours_id, nom: parcours?.nom });

  function renderQuestion() {
    answered = false;
    const q   = questions[currentIdx];
    const num = currentIdx + 1;

    root.querySelector('#exb-screen').innerHTML = `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="Quitter">×</button>
        <div class="exb-track-wrap">
          ${renderTrack(questions, answers, currentIdx)}
          <span class="exb-progress-label">${num} / ${questions.length}</span>
        </div>
        <span class="exb-quiz-parcours-name">${esc(parcours?.nom ?? '')}</span>
      </div>

      <div class="exb-qbody" id="exb-qbody">
        <p class="exb-qnum">Question ${num}</p>
        <p class="exb-qtext">${esc(q.enonce)}</p>
        <div class="exb-choices" id="exb-choices" role="group" aria-label="Réponses">
          ${q.options.map((opt, i) => `
            <button class="exb-choice" data-idx="${i}" aria-pressed="false">
              <span class="exb-choice-letter">${String.fromCharCode(65 + i)}</span>
              <span class="exb-choice-text">${esc(opt)}</span>
            </button>
          `).join('')}
        </div>
        <div class="exb-feedback" id="exb-feedback" hidden></div>
      </div>
    `;

    root.querySelector('#exb-quit')?.addEventListener('click', () => {
      if (confirm('Quitter ce parcours ? Ta progression sera perdue.')) {
        haptic('tap');
        track('parcours_quiz.quit', { parcours_id, question: num });
        root.innerHTML = renderStyles() + renderSelection();
        wireSelection(root);
      }
    });

    root.querySelectorAll('.exb-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.dataset.idx, 10);
        answers[currentIdx] = chosen;
        showFeedback(root, q, chosen, questions, currentIdx, parcours_id, answers, renderQuestion);
      });
    });
  }

  renderQuestion();
}

function showFeedback(root, q, chosen, questions, currentIdx, parcours_id, answers, renderQuestion) {
  const isCorrect = chosen === q.correct;
  const isFaute   = q.tags?.includes('faute_eliminatoire');

  if (isCorrect) { haptic('success'); playCorrect(); }
  else           { haptic('warning'); playWrong(); }

  // Colorie les boutons
  root.querySelectorAll('.exb-choice').forEach(btn => {
    const idx = parseInt(btn.dataset.idx, 10);
    btn.disabled = true;
    btn.setAttribute('aria-pressed', idx === chosen ? 'true' : 'false');
    if (idx === q.correct)   btn.classList.add('exb-choice--correct');
    if (idx === chosen && !isCorrect) btn.classList.add('exb-choice--wrong');
  });

  // Colorie le point du parcours correspondant à cette question
  const node = root.querySelector(`.exb-node[data-node="${currentIdx}"]`);
  if (node) {
    node.classList.remove('is-current');
    node.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
  }

  const feedbackEl = root.querySelector('#exb-feedback');
  feedbackEl.hidden = false;
  feedbackEl.innerHTML = `
    ${!isCorrect && isFaute ? '<div class="exb-faute-banner">⚠️ Faute éliminatoire à l\'examen</div>' : ''}
    <div class="exb-feedback-verdict ${isCorrect ? 'exb-feedback-verdict--ok' : 'exb-feedback-verdict--ko'}">
      ${isCorrect ? '✓ Bonne réponse' : '✗ Mauvaise réponse — Réponse : ' + esc(String.fromCharCode(65 + q.correct))}
    </div>
    <p class="exb-feedback-explication">${esc(q.explication)}</p>
    <button class="exb-next-btn" id="exb-next">
      ${currentIdx + 1 < questions.length ? 'Question suivante →' : 'Voir les résultats →'}
    </button>
  `;

  root.querySelector('#exb-next')?.addEventListener('click', () => {
    playPageturn();
    if (currentIdx + 1 < questions.length) {
      // Remplace uniquement le contenu du qbody pour éviter de recréer les listeners du header
      const exbScreen = root.querySelector('#exb-screen');
      // Incrément puis re-render complet (simple et fiable)
      const nextIdx = currentIdx + 1;
      // On réaffecte currentIdx via closure dans renderQuestion — passer via callback
      renderNextQuestion(root, questions, answers, nextIdx, parcours_id);
    } else {
      showResults(root, questions, answers, parcours_id);
    }
  });
}

function renderNextQuestion(root, questions, answers, idx, parcours_id) {
  const parcours = PARCOURS.find(p => p.id === parcours_id);
  let answered   = false;

  function renderAt(currentIdx) {
    answered = false;
    const q   = questions[currentIdx];
    const num = currentIdx + 1;

    root.querySelector('#exb-screen').innerHTML = `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="Quitter">×</button>
        <div class="exb-track-wrap">
          ${renderTrack(questions, answers, currentIdx)}
          <span class="exb-progress-label">${num} / ${questions.length}</span>
        </div>
        <span class="exb-quiz-parcours-name">${esc(parcours?.nom ?? '')}</span>
      </div>

      <div class="exb-qbody" id="exb-qbody">
        <p class="exb-qnum">Question ${num}</p>
        <p class="exb-qtext">${esc(q.enonce)}</p>
        <div class="exb-choices" id="exb-choices" role="group" aria-label="Réponses">
          ${q.options.map((opt, i) => `
            <button class="exb-choice" data-idx="${i}" aria-pressed="false">
              <span class="exb-choice-letter">${String.fromCharCode(65 + i)}</span>
              <span class="exb-choice-text">${esc(opt)}</span>
            </button>
          `).join('')}
        </div>
        <div class="exb-feedback" id="exb-feedback" hidden></div>
      </div>
    `;

    root.querySelector('#exb-quit')?.addEventListener('click', () => {
      if (confirm('Quitter ce parcours ? Ta progression sera perdue.')) {
        haptic('tap');
        track('parcours_quiz.quit', { parcours_id, question: num });
        root.innerHTML = renderStyles() + renderSelection();
        wireSelection(root);
      }
    });

    root.querySelectorAll('.exb-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.dataset.idx, 10);
        answers[currentIdx] = chosen;
        showFeedback(root, q, chosen, questions, currentIdx, parcours_id, answers, () => renderAt(currentIdx + 1));
      });
    });
  }

  renderAt(idx);
}

// ─── Écran 3 : résultats ─────────────────────────────────────
function showResults(root, questions, answers, parcours_id) {
  const parcours = PARCOURS.find(p => p.id === parcours_id);
  const score    = answers.filter((a, i) => a === questions[i].correct).length;
  const total    = questions.length;
  const pct      = Math.round(score / total * 100);

  const wrongItems = questions
    .map((q, i) => ({ q, chosen: answers[i], isCorrect: answers[i] === q.correct }))
    .filter(x => !x.isCorrect);

  // Faute éliminatoire ratée → recalé direct, quel que soit le score (comme au vrai CEPC)
  const fauteRatee = wrongItems.some(({ q }) => q.tags?.includes('faute_eliminatoire'));
  const passed     = score >= PASS_THRESHOLD && !fauteRatee;

  track('parcours_quiz.completed', { parcours_id, nom: parcours?.nom, score, total, passed, faute_eliminatoire: fauteRatee });

  if (passed) playFanfare(); else playWrong();

  const wrongHtml = wrongItems.length === 0
    ? `<p class="exb-perfect">Parfait ! Aucune erreur.</p>`
    : `
      <h2 class="exb-recap-title">Questions ratées</h2>
      <div class="exb-recap-list">
        ${wrongItems.map(({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${esc(q.enonce)}</p>
            ${chosen !== null ? `<p class="exb-recap-wrong">Ta réponse : <strong>${esc(q.options[chosen])}</strong></p>` : ''}
            <p class="exb-recap-correct">Bonne réponse : <strong>${esc(q.options[q.correct])}</strong></p>
            <p class="exb-recap-explication">${esc(q.explication)}</p>
          </div>
        `).join('')}
      </div>
    `;

  root.querySelector('#exb-screen').innerHTML = `
    <div class="exb-results">
      ${renderTrophy(TROPHY_END, 'exb-trophy--end')}
      <div class="exb-res-top ${passed ? 'exb-res-top--pass' : 'exb-res-top--fail'}">
        <div class="exb-res-ico">${passed ? '🎉' : (fauteRatee ? '🛑' : '💪')}</div>
        <div class="exb-res-score">${score}<span class="exb-res-total"> / ${total}</span></div>
        <div class="exb-res-pct">${pct} %</div>
        <div class="exb-res-verdict">${
          fauteRatee ? 'Recalé — faute éliminatoire'
          : passed ? 'Admis — tu es dans les clous !'
          : 'Non admis — encore un peu d\'entraînement'
        }</div>
        <div class="exb-res-cepc">${
          fauteRatee ? 'Une faute éliminatoire = échec direct à l\'examen, peu importe le reste du score.'
          : passed ? 'Tu décrocherais ton permis. Continue comme ça !'
          : 'Il te faut au moins 12 / 15 sans faute éliminatoire. Reviens t\'entraîner !'
        }</div>
      </div>

      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${passed ? 'exb-res-bar-fill--pass' : ''}" style="width:${pct}%"></div>
        </div>
        ${wrongHtml}
      </div>

      <div class="exb-res-actions">
        <button class="exb-retry-btn" id="exb-retry">Refaire ce parcours</button>
        <button class="exb-start-btn" id="exb-other">Choisir un autre parcours</button>
        <button class="exb-quit-btn-text" id="exb-home">← Accueil</button>
      </div>
    </div>
  `;

  root.querySelector('#exb-retry')?.addEventListener('click', () => {
    haptic('tap');
    track('parcours_quiz.retry', { parcours_id });
    startParcours(root, parcours_id);
  });

  root.querySelector('#exb-other')?.addEventListener('click', () => {
    haptic('tap');
    root.innerHTML = renderStyles() + renderSelection();
    wireSelection(root);
  });

  root.querySelector('#exb-home')?.addEventListener('click', () => {
    haptic('tap');
    navigate('/');
  });
}

// ─── Styles ──────────────────────────────────────────────────
function renderStyles() {
  return `<style>
/* === Parcours quiz — exb-* === */
.exb {
  min-height: 100svh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  overflow-x: hidden;
}
.anim-slide-up {
  animation: exbSlideUp .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes exbSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Sélection ── */
.exb-sel-header {
  padding: 20px 20px 0;
}
.exb-sel-title {
  font: 800 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 10px 0 4px;
  letter-spacing: -.022em;
}
.exb-sel-sub {
  font: 500 14px/1.5 'Inter', sans-serif;
  color: var(--mu);
  margin: 0 0 20px;
}
.exb-pcards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 40px;
}
.exb-pcard {
  width: 100%;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s, transform .1s;
}
.exb-pcard:active { transform: scale(.98); }
.exb-pcard:hover { border-color: var(--a); box-shadow: 0 4px 20px rgba(88,204,2,.12); }
.exb-pcard-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.exb-pcard-num {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--a);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.exb-pcard-stars {
  font-size: 13px;
  color: var(--am);
  letter-spacing: 2px;
}
.exb-pcard-nom {
  font: 700 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 4px;
  letter-spacing: -.015em;
}
.exb-pcard-ctx {
  font: 400 13px/1.5 'Inter', sans-serif;
  color: var(--mu);
  margin-bottom: 8px;
}
.exb-pcard-meta {
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .06em;
}

/* ── Quiz header ── */
.exb-quiz-header {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--bo);
  padding-bottom: 12px;
}
.exb-quit-btn {
  align-self: flex-end;
  background: none;
  border: none;
  font-size: 22px;
  color: var(--mu);
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
}
.exb-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.exb-progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bo);
  border-radius: 3px;
  overflow: hidden;
}
.exb-progress-fill {
  height: 100%;
  background: var(--a);
  border-radius: 3px;
  transition: width .3s cubic-bezier(.23,1,.32,1);
}
.exb-progress-label {
  font: 600 12px/1 'Inter', sans-serif;
  color: var(--mu);
  white-space: nowrap;
  min-width: 36px;
}
.exb-quiz-parcours-name {
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .06em;
  text-transform: uppercase;
}

/* ── Question body ── */
.exb-qbody {
  padding: 20px 16px 32px;
  flex: 1;
}
.exb-qnum {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--a);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin: 0 0 10px;
}
.exb-qtext {
  font: 600 17px/1.5 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0 0 20px;
  letter-spacing: -.015em;
}
.exb-choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exb-choice {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color .12s, background .12s, transform .1s;
  min-height: 52px;
}
.exb-choice:active { transform: scale(.98); }
.exb-choice:not(:disabled):hover { border-color: var(--a); }
.exb-choice:disabled { cursor: default; }
.exb-choice--correct { border-color: var(--gr2); background: rgba(34,197,94,.08); }
.exb-choice--wrong   { border-color: var(--rd); background: rgba(239,68,68,.08); }
.exb-choice-letter {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(88,204,2,.1);
  color: var(--a);
  font: 700 13px/26px 'Inter', sans-serif;
  text-align: center;
}
.exb-choice-text {
  font: 500 15px/1.4 'Inter', sans-serif;
  color: var(--ink);
  flex: 1;
}

/* ── Feedback ── */
.exb-feedback {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exb-faute-banner {
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.3);
  border-radius: 10px;
  padding: 10px 14px;
  font: 700 13px/1.4 'Inter', sans-serif;
  color: var(--rd);
}
.exb-feedback-verdict {
  font: 700 14px/1.3 'Plus Jakarta Sans', sans-serif;
  padding: 10px 14px;
  border-radius: 10px;
}
.exb-feedback-verdict--ok {
  background: rgba(34,197,94,.1);
  color: var(--grk);
}
.exb-feedback-verdict--ko {
  background: rgba(239,68,68,.08);
  color: var(--rdk);
}
.exb-feedback-explication {
  font: 400 13px/1.6 'Inter', sans-serif;
  color: var(--mu);
  margin: 0;
}
.exb-next-btn {
  width: 100%;
  padding: 14px;
  background: var(--a);
  border: none;
  border-radius: 14px;
  color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: transform .12s, opacity .12s;
  min-height: 50px;
}
.exb-next-btn:active { transform: scale(.97); }

/* ── Résultats ── */
.exb-results {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}
.exb-res-top {
  padding: 40px 20px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.exb-res-top--pass { background: linear-gradient(180deg, rgba(34,197,94,.12) 0%, transparent 100%); }
.exb-res-top--fail { background: linear-gradient(180deg, rgba(239,68,68,.08) 0%, transparent 100%); }
.exb-res-ico { font-size: 48px; margin-bottom: 4px; }
.exb-res-score {
  font: 800 56px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -.04em;
}
.exb-res-total { font-size: 28px; color: var(--mu); }
.exb-res-pct {
  font: 600 18px/1 'Inter', sans-serif;
  color: var(--mu);
}
.exb-res-verdict {
  font: 700 17px/1.3 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-top: 4px;
}
.exb-res-cepc {
  font: 500 13px/1.5 'Inter', sans-serif;
  color: var(--mu);
  max-width: 280px;
  text-align: center;
}
.exb-res-body {
  padding: 20px 16px;
  flex: 1;
}
.exb-res-bar {
  height: 8px;
  background: var(--bo);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 28px;
}
.exb-res-bar-fill {
  height: 100%;
  background: var(--rd);
  border-radius: 4px;
  transition: width .8s cubic-bezier(.23,1,.32,1);
}
.exb-res-bar-fill--pass { background: var(--gr2); }
.exb-perfect {
  font: 500 15px/1.5 'Inter', sans-serif;
  color: var(--grk);
  text-align: center;
  margin: 0;
}
.exb-recap-title {
  font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0 0 14px;
}
.exb-recap-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.exb-recap-item {
  background: var(--su);
  border: 1px solid var(--bo);
  border-left: 3px solid var(--rd);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exb-recap-enonce {
  font: 600 14px/1.4 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0;
}
.exb-recap-wrong {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--rdk);
  margin: 0;
}
.exb-recap-correct {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: var(--grk);
  margin: 0;
}
.exb-recap-explication {
  font: 400 12px/1.5 'Inter', sans-serif;
  color: var(--mu2);
  margin: 0;
  padding-top: 4px;
  border-top: 1px solid var(--bo);
}
.exb-res-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px calc(32px + env(safe-area-inset-bottom));
}
.exb-retry-btn {
  width: 100%;
  padding: 14px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  color: var(--ink);
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 50px;
  transition: border-color .12s, transform .1s;
}
.exb-retry-btn:hover { border-color: var(--a); }
.exb-retry-btn:active { transform: scale(.98); }
.exb-start-btn {
  width: 100%;
  padding: 14px;
  background: var(--a);
  border: none;
  border-radius: 14px;
  color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  min-height: 50px;
  transition: transform .12s, opacity .12s;
}
.exb-start-btn:active { transform: scale(.97); }
.exb-quit-btn-text {
  background: none;
  border: none;
  color: var(--mu);
  font: 500 13px/1 'Inter', sans-serif;
  cursor: pointer;
  padding: 10px;
  min-height: 44px;
  transition: color .15s;
}
.exb-quit-btn-text:active { color: var(--ink); }

/* ── Parcours visuel (15 points reliés) ── */
.exb-track-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.exb-track {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  padding: 2px 4px;
}
.exb-track::before {
  content: ''; position: absolute; left: 7px; right: 7px; top: 50%;
  height: 3px; background: var(--bo); transform: translateY(-50%);
  border-radius: 2px; z-index: 0;
}
.exb-node {
  width: 15px; height: 15px; border-radius: 50%;
  background: var(--bo); border: 2px solid var(--su);
  position: relative; z-index: 1; flex-shrink: 0;
  transition: background .3s, transform .25s, box-shadow .3s;
}
.exb-node.is-correct { background: var(--gr2); }
.exb-node.is-wrong   { background: var(--rd); }
.exb-node.is-current {
  background: var(--a); transform: scale(1.35);
  animation: exbNodePulse 1.2s ease-in-out infinite;
}
@keyframes exbNodePulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(88,204,2,.25); }
  50%      { box-shadow: 0 0 0 6px rgba(88,204,2,.10); }
}

/* ── Trophées décoratifs ── */
.exb-trophy { display: flex; flex-direction: column; align-items: center; }
.exb-trophy--start { margin: 8px auto 12px; }
.exb-trophy--end   { margin: 8px auto 0; }
.exb-trophy-img, .exb-trophy-emoji {
  width: 64px; height: 64px; object-fit: contain;
  filter: drop-shadow(0 6px 14px rgba(88,204,2,.35));
  animation: exbTrophyFloat 3s ease-in-out infinite;
}
.exb-trophy-emoji { align-items: center; justify-content: center; font-size: 44px; }
.exb-trophy--end .exb-trophy-img, .exb-trophy--end .exb-trophy-emoji {
  width: 84px; height: 84px; font-size: 56px;
  filter: drop-shadow(0 8px 18px rgba(168,85,247,.42));
}
.exb-trophy-cap {
  font: 700 10px/1 'IBM Plex Mono', monospace;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--mu2); margin-top: 7px;
}
@keyframes exbTrophyFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
</style>`;
}
