// ═══════════════════════════════════════════════════════════════
// Élève — Quiz éclair (poussé par le moniteur)
// Route : #/flash-quiz/{id}
// 3 questions, 5 min, score serveur-side via respond_flash_quiz.
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { icon } from '@/utils/icons.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { burstConfetti } from '@/components/common/confetti.js';
import { playCorrect, playWrong, playStreak, playPerfect } from '@/utils/sound.js';

let _timer = null;

function richEsc(str) {
  return esc(String(str ?? ''))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\b(\d+(?:[.,]\d+)?\s*(?:%|km\/h|m|sec|secondes?|min|minutes?|heures?|jours?|mois|g\/L))\b/gi, '<strong>$1</strong>')
    .replace(/\b(JAMAIS|TOUJOURS|OBLIGATOIRE|INTERDIT|IMPÉRATIF|AUCUN)\b/g, '<strong>$1</strong>');
}

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export async function mount(root, flashQuizId) {
  if (_timer) { clearInterval(_timer); _timer = null; }
  const me = getCurUser();
  if (!me) return;
  if (!flashQuizId) { navigate('/'); return; }

  track('page.view', { page: 'eleve_flash_quiz' });
  root.innerHTML = `${STYLE}<div class="fqz"><div class="fqz-card"><div class="fqz-load">Chargement…</div></div></div>`;

  try {
    // RLS : seul sent_to (l'élève) peut lire sa ligne
    const { data: quiz, error } = await sb
      .from('flash_quizzes')
      .select('id, competence_id, question_ids, expires_at, responded_at, score')
      .eq('id', flashQuizId)
      .maybeSingle();

    if (error || !quiz) return renderClosed(root, "Ce quiz éclair est introuvable.");
    if (quiz.responded_at) return renderClosed(root, "Tu as déjà répondu à ce quiz éclair.");
    if (new Date(quiz.expires_at).getTime() <= Date.now()) {
      return renderClosed(root, "Trop tard — ce quiz éclair est expiré.");
    }

    // Charge les questions (ordre = question_ids)
    const { data: rows } = await sb
      .from('questions_competence')
      .select('id, question, options, correct_index, explanation')
      .in('id', quiz.question_ids);

    const byId = new Map((rows || []).map(q => [q.id, q]));
    const pool = quiz.question_ids.map(id => byId.get(id)).filter(Boolean);

    if (pool.length === 0) return renderClosed(root, "Questions indisponibles, réessaie plus tard.");

    track('flash_quiz.started', { flash_quiz_id: quiz.id, competence_id: quiz.competence_id });
    runQuiz(root, { quiz, pool });
  } catch (e) {
    console.error('[flash-quiz] mount failed', e);
    renderClosed(root, "Oups, impossible de charger le quiz.");
  }
}

function runQuiz(root, { quiz, pool }) {
  let idx = 0, score = 0, streak = 0;
  const answers = [];
  const expiresMs = new Date(quiz.expires_at).getTime();

  root.innerHTML = `${STYLE}
    <div class="fqz">
      <div class="fqz-top">
        <div class="fqz-tag">${icon('zap',{size:14})} Quiz éclair</div>
        <div class="fqz-clock" id="fqz-clock">5:00</div>
      </div>
      <div class="fqz-card"><div class="fqz-body" id="fqz-body"></div></div>
    </div>`;

  const clockEl = root.querySelector('#fqz-clock');
  const bodyEl = root.querySelector('#fqz-body');

  function tick() {
    if (!document.body.contains(clockEl)) { clearInterval(_timer); _timer = null; return; }
    const left = expiresMs - Date.now();
    clockEl.textContent = fmtClock(left);
    clockEl.classList.toggle('danger', left < 60000);
    if (left <= 0) {
      clearInterval(_timer); _timer = null;
      renderClosed(root, "Temps écoulé — le quiz éclair est expiré.");
    }
  }
  if (_timer) clearInterval(_timer);
  _timer = setInterval(tick, 250);
  tick();

  function renderQuestion() {
    const q = pool[idx];
    if (!q) return finish();
    bodyEl.innerHTML = `
      <div class="fqz-prog">
        <span>${idx + 1} / ${pool.length}</span>
        <div class="fqz-bar"><div class="fqz-bar-fill" style="width:${(idx / pool.length) * 100}%"></div></div>
      </div>
      <h3 class="fqz-q">${richEsc(q.question)}</h3>
      <div class="fqz-opts">
        ${(q.options || []).map((opt, i) => `<button class="fqz-opt" data-i="${i}" type="button">${richEsc(opt)}</button>`).join('')}
      </div>`;
    bodyEl.querySelectorAll('.fqz-opt').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.i, 10), q));
    });
  }

  function handleAnswer(chosen, q) {
    const correct = chosen === q.correct_index;
    answers.push({ question_id: q.id, selected_idx: chosen });
    if (correct) { score++; streak++; playCorrect(); if (streak >= 2) playStreak(); }
    else { streak = 0; playWrong(); }

    bodyEl.querySelectorAll('.fqz-opt').forEach(b => {
      b.disabled = true;
      const i = parseInt(b.dataset.i, 10);
      if (i === q.correct_index) b.classList.add('ok');
      else if (i === chosen) b.classList.add('ko');
    });

    if (q.explanation) {
      const expl = document.createElement('div');
      expl.className = `fqz-expl ${correct ? 'ok' : 'ko'}`;
      expl.innerHTML = `<div class="fqz-expl-h">${correct ? 'Bien joué !' : 'À retenir'}</div><div>${richEsc(q.explanation)}</div>`;
      bodyEl.querySelector('.fqz-opts').appendChild(expl);
    }

    setTimeout(() => { idx++; renderQuestion(); }, correct ? 2000 : 3800);
  }

  async function finish() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    bodyEl.innerHTML = `<div class="fqz-result"><div class="fqz-spin">Envoi…</div></div>`;
    let score3 = score, total = pool.length;
    try {
      const { data, error } = await sb.rpc('respond_flash_quiz', {
        p_flash_quiz_id: quiz.id,
        p_answers: answers,
      });
      if (!error && data) {
        const r = Array.isArray(data) ? data[0] : data;
        if (r) { score3 = r.score ?? score; total = r.total ?? pool.length; }
      } else if (error) {
        console.error('[flash-quiz] respond error', error);
        if (/expired/i.test(error.message || '')) {
          return renderClosed(root, "Temps écoulé — le quiz éclair est expiré.");
        }
      }
    } catch (e) { console.error('[flash-quiz] respond crashed', e); }

    const perfect = score3 === total;
    track('flash_quiz.completed', { flash_quiz_id: quiz.id, competence_id: quiz.competence_id, score: score3, total });
    if (perfect) { burstConfetti({ count: 100, power: 16 }); playPerfect(); }

    const msg = perfect ? 'Sans-faute !' : score3 >= total * 0.6 ? 'Bien joué !' : 'À revoir avec ton moniteur';
    bodyEl.innerHTML = `
      <div class="fqz-result">
        <div class="fqz-score">${score3}/${total}</div>
        <p>${msg}</p>
        <button class="fqz-cta" id="fqz-done" type="button">Continuer</button>
      </div>`;
    bodyEl.querySelector('#fqz-done').addEventListener('click', () => navigate('/'));
  }

  renderQuestion();
}

function renderClosed(root, message) {
  if (_timer) { clearInterval(_timer); _timer = null; }
  root.innerHTML = `${STYLE}
    <div class="fqz">
      <div class="fqz-card">
        <div class="fqz-closed">
          <div class="fqz-closed-ico">⏱️</div>
          <p>${esc(message)}</p>
          <button class="fqz-cta" id="fqz-back" type="button">Retour à l'accueil</button>
        </div>
      </div>
    </div>`;
  root.querySelector('#fqz-back')?.addEventListener('click', () => navigate('/'));
}

const STYLE = `<style>
.fqz{min-height:100vh;background:radial-gradient(120% 80% at 50% 0%,#1a1d2e 0%,#0a0d1a 60%);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 16px) 16px calc(env(safe-area-inset-bottom,0px) + 24px);font-family:'Inter',sans-serif}
.fqz-top{display:flex;align-items:center;justify-content:space-between;max-width:480px;width:100%;margin:0 auto 14px}
.fqz-tag{font:800 14px/1 'Plus Jakarta Sans',sans-serif;color:#fde68a;background:rgba(253,224,71,.12);padding:8px 14px;border-radius:999px}
.fqz-clock{font:800 20px/1 'IBM Plex Mono',monospace;color:#a7f3d0;background:rgba(16,185,129,.14);padding:8px 14px;border-radius:12px;min-width:64px;text-align:center}
.fqz-clock.danger{color:#fecaca;background:rgba(239,68,68,.18);animation:fqzPulse 1s ease-in-out infinite}
@keyframes fqzPulse{0%,100%{opacity:1}50%{opacity:.6}}
.fqz-card{width:100%;max-width:480px;margin:0 auto;background:linear-gradient(180deg,#1a1d2e,#0f1220);border:1px solid rgba(99,102,241,.3);border-radius:24px;padding:24px;color:#fff}
.fqz-load,.fqz-spin{text-align:center;color:#94a3b8;padding:40px 0;font:600 15px/1 'Inter'}
.fqz-prog{display:flex;align-items:center;gap:12px;font:600 13px/1 'Inter';color:#94a3b8;margin-bottom:18px}
.fqz-bar{flex:1;height:6px;background:rgba(148,163,184,.15);border-radius:3px;overflow:hidden}
.fqz-bar-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .4s ease}
.fqz-q{font:800 21px/1.4 'Plus Jakarta Sans',sans-serif;color:#fff;margin:0 0 22px;letter-spacing:-.015em}
.fqz-q strong{font-weight:900;color:#fde68a;background:linear-gradient(transparent 60%,rgba(253,224,71,.18) 60%);padding:0 2px;border-radius:2px}
.fqz-opts{display:flex;flex-direction:column;gap:10px}
.fqz-opt{padding:14px 18px;background:rgba(99,102,241,.12);border:1.5px solid rgba(99,102,241,.28);border-radius:14px;color:#fff;font:600 15px/1.35 'Inter';text-align:left;cursor:pointer;transition:background .18s,border-color .18s,transform .12s;min-height:48px}
.fqz-opt strong{font-weight:800;color:#fde68a}
@media(hover:hover)and(pointer:fine){.fqz-opt:hover:not(:disabled){background:rgba(99,102,241,.22);border-color:rgba(99,102,241,.55)}}
.fqz-opt:active:not(:disabled){transform:scale(.98)}
.fqz-opt.ok{background:rgba(16,185,129,.22);border-color:#10b981;color:#a7f3d0;animation:fqzReveal .55s cubic-bezier(.34,1.56,.64,1) both}
.fqz-opt.ko{background:rgba(239,68,68,.22);border-color:#ef4444;color:#fecaca;animation:fqzShake .45s ease both}
.fqz-opt:disabled{cursor:default}
@keyframes fqzReveal{0%{transform:scale(.97)}55%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes fqzShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(5px)}75%{transform:translateX(-3px)}}
.fqz-expl{margin-top:14px;padding:14px 16px;border-radius:14px;font:500 14px/1.55 'Inter';animation:fqzIn .5s cubic-bezier(.34,1.56,.64,1) both}
.fqz-expl.ok{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);color:#d1fae5}
.fqz-expl.ko{background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.4);color:#e2e8f0}
.fqz-expl-h{font:800 13px/1 'Plus Jakarta Sans';margin-bottom:6px}
.fqz-expl strong{font-weight:800;color:#fde68a}
@keyframes fqzIn{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
.fqz-result{text-align:center;padding:20px 0}
.fqz-score{font:800 56px/1 'Plus Jakarta Sans';background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px}
.fqz-result p{font:600 17px/1.4 'Inter';color:#cbd5e1;margin:0 0 24px}
.fqz-closed{text-align:center;padding:24px 0}
.fqz-closed-ico{font-size:44px;margin-bottom:12px}
.fqz-closed p{font:600 16px/1.5 'Inter';color:#cbd5e1;margin:0 0 24px}
.fqz-cta{padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:14px;color:#fff;font:700 15px/1 'Inter';cursor:pointer;min-height:48px;transition:transform .12s,opacity .12s}
.fqz-cta:active{transform:scale(.97);opacity:.9}
@media(prefers-reduced-motion:reduce){.fqz-opt.ok,.fqz-opt.ko,.fqz-expl,.fqz-clock.danger{animation:none}}
</style>`;
