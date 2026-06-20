// ═══════════════════════════════════════════════════════════════
// Quiz Engine — moteur générique pour quizzes Triple Validation
// Utilisé par post-validation (3 questions) + consolidation (2 questions)
// Rendu : module partagé quiz-ui.js (même langage visuel que flash-quiz)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { track } from "@/services/analytics.js";
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
  computeTheoryGain,
  renderTheoryGain,
} from "@/components/eleve/theory-gain.js";
import { wireQuestionSpeech, stopSpeaking } from "@/utils/speech.js";
import {
  playCorrect,
  playWrong,
  playStreak,
  playVictory,
  playDefeat,
  playWhoosh,
  playQuizMusic,
} from "@/utils/sound.js";

/**
 * @param {Object} opts
 * @param {string} opts.competenceId  - ex: C1a, C2f, etc.
 * @param {'post_validation'|'consolidation'} opts.type
 * @param {number} opts.nbQuestions
 * @param {(score, total) => void} opts.onComplete
 */
export async function lancerQuiz({
  competenceId,
  type,
  nbQuestions,
  onComplete,
}) {
  const { data: questions, error } = await sb
    .from("questions_competence")
    .select(
      "id, competence_id, type, question, options, correct_index, explanation, difficulty",
    )
    .eq("competence_id", competenceId)
    .eq("type", type)
    .limit(nbQuestions);

  if (error || !questions?.length) {
    console.error("[quiz]", error);
    return null;
  }

  // Mélange + slice
  const pool = shuffle(questions).slice(0, nbQuestions);
  let idx = 0;
  let score = 0;
  let streak = 0; // bonnes réponses consécutives (son + chip « Série de N »)

  track("quiz.started", {
    competence_id: competenceId,
    quiz_type: type,
    nb_questions: pool.length,
  });

  const overlay = renderOverlay();
  document.body.appendChild(overlay);

  // Mélodie de fond pendant le quiz (coupée à la fin / fermeture)
  const stopMusic = playQuizMusic();

  function renderQuestion() {
    const q = pool[idx];
    if (!q) return finish();

    setMascot(overlay, "think");
    overlay.querySelector(".quiz-zone").innerHTML = questionHTML({
      q,
      idx,
      total: pool.length,
    });

    overlay.querySelectorAll(".qz-opt").forEach((btn) => {
      btn.addEventListener("click", () =>
        handleAnswer(parseInt(btn.dataset.i, 10), q),
      );
    });

    wireQuestionSpeech(overlay.querySelector(".quiz-zone"), q.question);
  }

  function handleAnswer(chosen, q) {
    stopSpeaking();
    const zone = overlay.querySelector(".quiz-zone");
    const correct = applyReveal(zone, {
      chosen,
      correctIndex: q.correct_index,
    });

    if (correct) {
      score++;
      streak++;
      playCorrect();
      if (streak >= 2) playStreak(); // escalade à partir de la 2e bonne d'affilée
      navigator.vibrate?.(20);
      setMascot(overlay, "celebrate");
      // Hero : bandeau de célébration varié + chip de série
      zone
        .querySelector(".qz-opts")
        .insertAdjacentHTML("afterend", praiseHTML({ streak }));
    } else {
      streak = 0;
      playWrong();
      setMascot(overlay, "coach");
    }

    if (q.explanation) {
      zone.insertAdjacentHTML(
        "beforeend",
        explHTML({ correct, explanation: q.explanation }),
      );
    }

    track("quiz.question_answered", {
      competence_id: competenceId,
      quiz_type: type,
      correct,
      question_id: q.id,
    });

    // Pas d'auto-avance : l'élève lit la correction à son rythme et clique
    // « Suivant » quand il a fini (les timers fixes étaient trop courts/longs).
    const isLast = idx >= pool.length - 1;
    const nextBtn = document.createElement("button");
    nextBtn.className = "qz-next";
    nextBtn.type = "button";
    nextBtn.textContent = isLast ? "Voir mon résultat" : "Suivant";
    nextBtn.addEventListener("click", () => {
      idx++;
      playWhoosh();
      renderQuestion();
    });
    zone.appendChild(nextBtn);
    nextBtn.focus({ preventScroll: true });
    nextBtn.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  async function finish() {
    const total = pool.length;
    const perfect = score === total;
    track("quiz.completed", {
      competence_id: competenceId,
      quiz_type: type,
      score,
      total,
      score_pct: Math.round((score / total) * 100),
    });

    // Musique de fin : victoire si réussi (>=60%), défaite sinon. Confetti en plus sur sans-faute.
    const passed = score >= total * 0.6;
    stopMusic(); // coupe la mélodie de fond avant le jingle de fin
    stopSpeaking(); // coupe une éventuelle lecture vocale en cours
    if (perfect) burstConfetti({ count: 100, power: 16 });
    if (passed) playVictory();
    else playDefeat();

    const mascotEl = overlay.querySelector(".quiz-mascot-slot .qz-mascot");
    if (mascotEl) mascotEl.remove(); // le résultat a sa propre mascotte
    overlay.querySelector(".quiz-zone").innerHTML = resultHTML({
      score,
      total,
    });
    overlay.querySelector(".qz-cta").addEventListener("click", () => {
      overlay.remove();
      onComplete?.(score, total);
    });

    // Gain ligue théorique — calculé AVANT la persistance (faite par le
    // caller via submit_competence_quiz). Affiché seulement si le point
    // est nouveau ; sinon rien (pas d'incitation à re-farmer).
    computeTheoryGain({
      kind: "quiz",
      competenceId,
      scorePct: Math.round((score / total) * 100),
    })
      .then((gain) => {
        if (!gain || !overlay.isConnected) return;
        const res = overlay.querySelector(".qz-result");
        const closeBtn = overlay.querySelector(".qz-cta");
        if (!res || !closeBtn) return;
        const slot = document.createElement("div");
        res.insertBefore(slot, closeBtn);
        renderTheoryGain(slot, gain);
      })
      .catch(() => {});
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
  const el = document.createElement("div");
  el.className = "quiz-overlay";
  el.innerHTML = `
    ${QUIZ_STYLE}
    <style>
      .quiz-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,13,26,.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top, 0px) + 20px) 20px calc(env(safe-area-inset-bottom, 0px) + 20px);animation:quizIn .3s cubic-bezier(.23,1,.32,1);overflow-y:auto}
      @keyframes quizIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
      .quiz-body{position:relative;width:100%;max-width:480px;background:linear-gradient(180deg,#1a1d2e,#0f1220);border:1px solid rgba(99,102,241,.3);border-radius:24px;padding:28px;color:#fff;margin:auto}
      @media (prefers-reduced-motion:reduce){.quiz-overlay{animation:none}}
    </style>
    <div class="quiz-body">
      <span class="quiz-mascot-slot">${mascotHTML("think")}</span>
      <div class="quiz-zone"></div>
    </div>
  `;
  return el;
}
