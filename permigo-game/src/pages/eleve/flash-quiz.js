// ═══════════════════════════════════════════════════════════════
// Élève — Quiz éclair (poussé par le moniteur)
// Route : #/flash-quiz/{id}
// 3 questions, 5 min, score serveur-side via respond_flash_quiz.
// Rendu : module partagé quiz-ui.js (même langage visuel que les
// quizz post-validation/consolidation).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { burstConfetti } from "@/components/common/confetti.js";
import {
  QUIZ_STYLE,
  questionHTML,
  applyReveal,
  praiseHTML,
  explHTML,
  resultHTML,
  mascotHTML,
  setMascot,
} from "@/components/eleve/quiz-ui.js";
import {
  playCorrect,
  playWrong,
  playStreak,
  playPerfect,
} from "@/utils/sound.js";

let _timer = null;

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export async function mount(root, flashQuizId) {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  const me = getCurUser();
  if (!me) return;
  if (!flashQuizId) {
    navigate("/");
    return;
  }

  track("page.view", { page: "eleve_flash_quiz" });
  root.innerHTML = `${STYLE}<div class="fqz"><div class="fqz-card"><div class="fqz-load">Chargement…</div></div></div>`;

  try {
    // RLS : seul sent_to (l'élève) peut lire sa ligne
    const { data: quiz, error } = await sb
      .from("flash_quizzes")
      .select(
        "id, competence_id, question_ids, expires_at, responded_at, score",
      )
      .eq("id", flashQuizId)
      .maybeSingle();

    if (error || !quiz)
      return renderClosed(root, "Ce quiz éclair est introuvable.");
    if (quiz.responded_at)
      return renderClosed(root, "Tu as déjà répondu à ce quiz éclair.");
    if (new Date(quiz.expires_at).getTime() <= Date.now()) {
      return renderClosed(root, "Trop tard — ce quiz éclair est expiré.");
    }

    // Charge les questions (ordre = question_ids)
    const { data: rows } = await sb
      .from("questions_competence")
      .select("id, question, options, correct_index, explanation")
      .in("id", quiz.question_ids);

    const byId = new Map((rows || []).map((q) => [q.id, q]));
    const pool = quiz.question_ids.map((id) => byId.get(id)).filter(Boolean);

    if (pool.length === 0)
      return renderClosed(root, "Questions indisponibles, réessaie plus tard.");

    track("flash_quiz.started", {
      flash_quiz_id: quiz.id,
      competence_id: quiz.competence_id,
    });
    runQuiz(root, { quiz, pool });
  } catch (e) {
    console.error("[flash-quiz] mount failed", e);
    renderClosed(root, "Oups, impossible de charger le quiz.");
  }
}

function runQuiz(root, { quiz, pool }) {
  let idx = 0,
    score = 0,
    streak = 0;
  const answers = [];
  const expiresMs = new Date(quiz.expires_at).getTime();

  root.innerHTML = `${STYLE}
    <div class="fqz">
      <div class="fqz-top">
        <div class="fqz-tag">${icon("zap", { size: 14 })} Quiz éclair</div>
        <div class="fqz-clock" id="fqz-clock">5:00</div>
      </div>
      <div class="fqz-card">
        <span class="fqz-mascot-slot">${mascotHTML("think")}</span>
        <div class="fqz-body" id="fqz-body"></div>
      </div>
    </div>`;

  const cardEl = root.querySelector(".fqz-card");
  const clockEl = root.querySelector("#fqz-clock");
  const bodyEl = root.querySelector("#fqz-body");

  function tick() {
    if (!document.body.contains(clockEl)) {
      clearInterval(_timer);
      _timer = null;
      return;
    }
    const left = expiresMs - Date.now();
    clockEl.textContent = fmtClock(left);
    clockEl.classList.toggle("danger", left < 60000);
    if (left <= 0) {
      clearInterval(_timer);
      _timer = null;
      renderClosed(root, "Temps écoulé — le quiz éclair est expiré.");
    }
  }
  if (_timer) clearInterval(_timer);
  _timer = setInterval(tick, 250);
  tick();

  function renderQuestion() {
    const q = pool[idx];
    if (!q) return finish();
    setMascot(cardEl, "think");
    bodyEl.innerHTML = questionHTML({ q, idx, total: pool.length });
    bodyEl.querySelectorAll(".qz-opt").forEach((btn) => {
      btn.addEventListener("click", () =>
        handleAnswer(parseInt(btn.dataset.i, 10), q),
      );
    });
  }

  function handleAnswer(chosen, q) {
    answers.push({ question_id: q.id, selected_idx: chosen });
    const correct = applyReveal(bodyEl, {
      chosen,
      correctIndex: q.correct_index,
    });

    if (correct) {
      score++;
      streak++;
      playCorrect();
      if (streak >= 2) playStreak();
      navigator.vibrate?.(20);
      setMascot(cardEl, "celebrate");
      bodyEl
        .querySelector(".qz-opts")
        .insertAdjacentHTML("afterend", praiseHTML({ streak }));
    } else {
      streak = 0;
      playWrong();
      setMascot(cardEl, "coach");
    }

    if (q.explanation) {
      bodyEl.insertAdjacentHTML(
        "beforeend",
        explHTML({ correct, explanation: q.explanation }),
      );
    }

    // Auto-avance (le chrono tourne) — un peu plus d'air après une
    // erreur pour lire la correction sans pression.
    setTimeout(
      () => {
        idx++;
        renderQuestion();
      },
      correct ? 2200 : 4200,
    );
  }

  async function finish() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
    bodyEl.innerHTML = `<div class="fqz-load">Envoi…</div>`;
    let score3 = score,
      total = pool.length;
    try {
      const { data, error } = await sb.rpc("respond_flash_quiz", {
        p_flash_quiz_id: quiz.id,
        p_answers: answers,
      });
      if (!error && data) {
        const r = Array.isArray(data) ? data[0] : data;
        if (r) {
          score3 = r.score ?? score;
          total = r.total ?? pool.length;
        }
      } else if (error) {
        console.error("[flash-quiz] respond error", error);
        if (/expired/i.test(error.message || "")) {
          return renderClosed(
            root,
            "Temps écoulé — le quiz éclair est expiré.",
          );
        }
      }
    } catch (e) {
      console.error("[flash-quiz] respond crashed", e);
    }

    const perfect = score3 === total;
    track("flash_quiz.completed", {
      flash_quiz_id: quiz.id,
      competence_id: quiz.competence_id,
      score: score3,
      total,
    });
    if (perfect) {
      burstConfetti({ count: 100, power: 16 });
      playPerfect();
    }

    cardEl.querySelector(".fqz-mascot-slot .qz-mascot")?.remove();
    bodyEl.innerHTML = resultHTML({ score: score3, total });
    bodyEl
      .querySelector(".qz-cta")
      .addEventListener("click", () => navigate("/"));
  }

  renderQuestion();
}

function renderClosed(root, message) {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
  root.innerHTML = `${STYLE}
    <div class="fqz">
      <div class="fqz-card">
        <div class="fqz-closed">
          <div class="fqz-closed-ico">${icon("clock", { size: 44, strokeWidth: 1.5, color: "#94a3b8" })}</div>
          <p>${esc(message)}</p>
          <button class="qz-cta" id="fqz-back" type="button">Retour à l'accueil</button>
        </div>
      </div>
    </div>`;
  root
    .querySelector("#fqz-back")
    ?.addEventListener("click", () => navigate("/"));
}

// Coquille de page uniquement — tout le rendu question/réponse/résultat
// vient de QUIZ_STYLE (quiz-ui.js).
const STYLE = `${QUIZ_STYLE}<style>
.fqz{min-height:100vh;background:radial-gradient(120% 80% at 50% 0%,#1a1d2e 0%,#0a0d1a 60%);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 16px) 16px calc(env(safe-area-inset-bottom,0px) + 24px);font-family:'Inter',sans-serif}
.fqz-top{display:flex;align-items:center;justify-content:space-between;max-width:480px;width:100%;margin:0 auto 22px}
.fqz-tag{display:inline-flex;align-items:center;gap:6px;font:800 14px/1 'Plus Jakarta Sans',sans-serif;color:#fde68a;background:rgba(253,224,71,.12);padding:8px 14px;border-radius:999px}
.fqz-clock{font:800 20px/1 'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;color:#a7f3d0;background:rgba(16,185,129,.14);padding:8px 14px;border-radius:12px;min-width:64px;text-align:center}
.fqz-clock.danger{color:#fecaca;background:rgba(239,68,68,.18);animation:fqzPulse 1s ease-in-out infinite}
@keyframes fqzPulse{0%,100%{opacity:1}50%{opacity:.6}}
.fqz-card{position:relative;width:100%;max-width:480px;margin:0 auto;background:linear-gradient(180deg,#1a1d2e,#0f1220);border:1px solid rgba(99,102,241,.3);border-radius:24px;padding:26px;color:#fff}
.fqz-load{text-align:center;color:#94a3b8;padding:40px 0;font:600 15px/1 'Inter'}
.fqz-closed{text-align:center;padding:24px 0}
.fqz-closed-ico{margin-bottom:12px}
.fqz-closed p{font:600 16px/1.5 'Inter';color:#cbd5e1;margin:0 0 24px}
@media(prefers-reduced-motion:reduce){.fqz-clock.danger{animation:none}}
</style>`;
