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
    // Feedback utilisateur + télémétrie : sinon le quiz « ne se lance pas »
    // en silence et on ne détecte jamais les compétences sans questions.
    track("quiz.no_questions", { competence_id: competenceId, type });
    try {
      const { toast } = await import("@/components/common/toast.js");
      toast(
        "Ce quiz n'est pas encore prêt — réessaie plus tard.",
        "info",
        4000,
      );
    } catch {}
    return null;
  }

  // Mélange des questions + des réponses (sinon la bonne réponse reste à
  // l'index `correct_index` figé → toujours à la même place) + slice
  const pool = shuffle(questions)
    .slice(0, nbQuestions)
    .map(withShuffledOptions);
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

// Mélange les réponses d'une question et remappe `correct_index` vers sa
// nouvelle position. Clone la question : le rendu (q.options) et le score
// (q.correct_index) restent alignés sur le même objet.
function withShuffledOptions(q) {
  if (!Array.isArray(q.options) || q.options.length < 2) return q;
  const order = shuffle(q.options.map((_, i) => i));
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    correct_index: order.indexOf(q.correct_index),
  };
}

function renderOverlay() {
  const el = document.createElement("div");
  el.className = "quiz-overlay";
  el.innerHTML = `
    ${QUIZ_STYLE}
    <style>
      .quiz-overlay{position:fixed;inset:0;z-index:9999;background:rgba(6,5,20,.94);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top, 0px) + 20px) 20px calc(env(safe-area-inset-bottom, 0px) + 20px);animation:quizIn .3s cubic-bezier(.23,1,.32,1);overflow-y:auto}
      @keyframes quizIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
      .quiz-body{position:relative;width:100%;max-width:480px;border-radius:26px;padding:28px;color:#fff;margin:auto;isolation:isolate;overflow:visible;
        background:radial-gradient(150% 70% at 50% -5%, rgba(255,180,60,.10) 0%, transparent 50%),radial-gradient(120% 65% at 50% 26%, rgba(110,70,220,.22) 0%, transparent 60%),linear-gradient(180deg,#181241 0%,#0c0a26 62%,#08071c 100%);
        border:1px solid rgba(255,200,90,.16);
        box-shadow:0 24px 60px -20px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 120px 24px rgba(2,1,14,.55)}
      .quiz-body::before{content:"";position:absolute;inset:0;border-radius:26px;pointer-events:none;z-index:0;background-image:radial-gradient(1.4px 1.4px at 22% 12%,rgba(255,255,255,.45),transparent),radial-gradient(1.2px 1.2px at 80% 8%,rgba(255,210,120,.5),transparent),radial-gradient(1.1px 1.1px at 64% 18%,rgba(255,255,255,.32),transparent),radial-gradient(1.3px 1.3px at 12% 24%,rgba(180,160,255,.4),transparent)}
      .quiz-body>*{position:relative;z-index:1}
      /* le slot ne doit PAS être le repère de la mascotte : sinon elle se cale
         sur ce span 0px (haut-gauche). display:contents → la mascotte (absolute)
         s'ancre sur .quiz-body et part dans le coin haut-droit. */
      .quiz-mascot-slot{display:contents}
      @media (prefers-reduced-motion:reduce){.quiz-overlay{animation:none}}
    </style>
    <div class="quiz-body">
      <span class="quiz-mascot-slot">${mascotHTML("think")}</span>
      <div class="quiz-zone"></div>
    </div>
  `;
  return el;
}
