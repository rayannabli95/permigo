// ═══════════════════════════════════════════════════════════════
// Quiz Engine — moteur générique pour quizzes Triple Validation
// Utilisé par post-validation (3 questions) + consolidation (2 questions)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { burstConfetti } from "@/components/common/confetti.js";
import {
  computeTheoryGain,
  renderTheoryGain,
} from "@/components/eleve/theory-gain.js";
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
  let streak = 0; // compteur de bonnes réponses consécutives (pour le son d'escalade)

  track("quiz.started", {
    competence_id: competenceId,
    quiz_type: type,
    nb_questions: pool.length,
  });

  const overlay = renderOverlay();
  document.body.appendChild(overlay);

  // Mélodie de fond pendant le quiz (coupée à la fin / fermeture)
  const stopMusic = playQuizMusic();

  // Esc + transforme **mot** en <strong>mot</strong> (markdown light)
  // pour mettre en valeur les passages importants des questions REMC
  function richEsc(str) {
    return (
      esc(String(str ?? ""))
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Auto-bold sur les mots clés courants (chiffres, unités, mots-piège)
        .replace(
          /\b(\d+(?:[.,]\d+)?\s*(?:%|km\/h|m|sec|secondes?|min|minutes?|heures?|jours?|mois|g\/L))\b/gi,
          "<strong>$1</strong>",
        )
        .replace(
          /\b(JAMAIS|TOUJOURS|OBLIGATOIRE|INTERDIT|IMPÉRATIF|AUCUN)\b/g,
          "<strong>$1</strong>",
        )
    );
  }

  function renderQuestion() {
    const q = pool[idx];
    if (!q) return finish();

    overlay.querySelector(".quiz-body").innerHTML = `
      <img class="quiz-mascot" src="/skins/mascot-think.png" alt="" aria-hidden="true" />
      <div class="quiz-progress">
        <span>${idx + 1} / ${pool.length}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${(idx / pool.length) * 100}%"></div></div>
      </div>
      <h3 class="quiz-q">${richEsc(q.question)}</h3>
      <div class="quiz-options">
        ${q.options
          .map(
            (opt, i) => `
          <button class="quiz-opt" data-i="${i}">${richEsc(opt)}</button>
        `,
          )
          .join("")}
      </div>
    `;

    overlay.querySelectorAll(".quiz-opt").forEach((btn) => {
      btn.addEventListener("click", () =>
        handleAnswer(parseInt(btn.dataset.i, 10), q, btn),
      );
    });
  }

  function handleAnswer(chosen, q, btn) {
    const correct = chosen === q.correct_index;
    if (correct) {
      score++;
      streak++;
      playCorrect();
      if (streak >= 2) playStreak(); // escalade à partir de la 2e bonne d'affilée
    } else {
      streak = 0;
      playWrong();
    }

    overlay.querySelectorAll(".quiz-opt").forEach((b) => {
      b.disabled = true;
      const i = parseInt(b.dataset.i, 10);
      if (i === q.correct_index) b.classList.add("ok");
      else if (i === chosen) b.classList.add("ko");
    });

    if (q.explanation) {
      const expl = document.createElement("div");
      expl.className = `quiz-expl ${correct ? "expl-ok" : "expl-ko"}`;
      expl.innerHTML = `
        <div class="expl-head">${correct ? "Bien joué !" : "À retenir"}</div>
        <div class="expl-body">${richEsc(q.explanation)}</div>
      `;
      overlay.querySelector(".quiz-options").appendChild(expl);
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
    nextBtn.className = "quiz-close-btn quiz-next-btn";
    nextBtn.style.marginTop = "14px";
    nextBtn.textContent = isLast ? "Voir mon résultat" : "Suivant";
    nextBtn.addEventListener("click", () => {
      idx++;
      playWhoosh();
      renderQuestion();
    });
    overlay.querySelector(".quiz-options").appendChild(nextBtn);
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
    if (perfect) burstConfetti({ count: 100, power: 16 });
    if (passed) playVictory();
    else playDefeat();

    overlay.querySelector(".quiz-body").innerHTML = `
      <div class="quiz-result">
        <img class="quiz-mascot quiz-mascot-result" src="/skins/${passed ? "mascot-celebrate" : "mascot-think"}.png" alt="" aria-hidden="true" />
        <div class="quiz-score">${score}/${total}</div>
        <p>${perfect ? "Parfait !" : score >= total * 0.6 ? "Bien !" : "À revoir"}</p>
        <button class="quiz-close-btn">Continuer</button>
      </div>
    `;
    overlay.querySelector(".quiz-close-btn").addEventListener("click", () => {
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
        const res = overlay.querySelector(".quiz-result");
        const closeBtn = overlay.querySelector(".quiz-close-btn");
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
    <style>
      .quiz-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,13,26,.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:quizIn .3s cubic-bezier(.23,1,.32,1)}
      @keyframes quizIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
      .quiz-body{position:relative;width:100%;max-width:480px;background:linear-gradient(180deg,#1a1d2e,#0f1220);border:1px solid rgba(99,102,241,.3);border-radius:24px;padding:28px;color:#fff}
      .quiz-mascot{position:absolute;top:-30px;right:16px;width:72px;height:72px;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,.35));animation:quizMascotIn .4s cubic-bezier(.34,1.56,.64,1) both,quizMascotFloat 3s ease-in-out .4s infinite;pointer-events:none;z-index:2}
      .quiz-mascot-result{position:static;display:block;margin:0 auto 6px;width:96px;height:96px;animation:quizMascotIn .45s cubic-bezier(.34,1.56,.64,1) both}
      @keyframes quizMascotIn{from{opacity:0;transform:scale(.5) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes quizMascotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @media (prefers-reduced-motion:reduce){.quiz-mascot{animation:quizMascotIn .4s both}}
      .quiz-body *{color:inherit}
      .quiz-progress{display:flex;align-items:center;gap:12px;font:600 13px/1 'Inter';color:#94a3b8 !important;margin-bottom:20px}
      .quiz-bar{flex:1;height:6px;background:rgba(148,163,184,.15);border-radius:3px;overflow:hidden}
      .quiz-bar-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .4s ease}
      .quiz-q{font:800 22px/1.4 'Plus Jakarta Sans',sans-serif !important;color:#ffffff !important;margin:0 0 24px;letter-spacing:-.015em}
      .quiz-q strong, .quiz-q b{font-weight:900;color:#fde68a;background:linear-gradient(transparent 60%, rgba(253,224,71,.18) 60%);padding:0 2px;border-radius:2px}
      .quiz-options{display:flex;flex-direction:column;gap:10px}
      .quiz-opt{padding:14px 18px;background:rgba(99,102,241,.12);border:1.5px solid rgba(99,102,241,.28);border-radius:14px;color:#ffffff !important;font:600 15px/1.35 'Inter',sans-serif;text-align:left;cursor:pointer;transition:background .18s,border-color .18s,transform .12s}
      .quiz-opt strong, .quiz-opt b{font-weight:800;color:#fde68a}
      @media(hover:hover)and(pointer:fine){.quiz-opt:hover:not(:disabled){background:rgba(99,102,241,.22);border-color:rgba(99,102,241,.55);transform:translateX(2px)}}
      .quiz-opt:active:not(:disabled){transform:scale(.98)}
      .quiz-opt.ok{background:rgba(16,185,129,.22);border-color:#10b981;color:#a7f3d0 !important;animation:optReveal .6s cubic-bezier(.34,1.56,.64,1) both,optGlow 1.6s ease-in-out .6s infinite}
      .quiz-opt.ko{background:rgba(239,68,68,.22);border-color:#ef4444;color:#fecaca !important;animation:optShake .45s ease both}
      .quiz-opt:disabled{cursor:default}
      @keyframes optReveal{0%{transform:scale(.96) rotateX(-15deg)}55%{transform:scale(1.08) rotateX(8deg)}100%{transform:scale(1) rotateX(0)}}
      @keyframes optGlow{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}50%{box-shadow:0 0 0 4px rgba(16,185,129,.22)}}
      @keyframes optShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(5px)}75%{transform:translateX(-3px)}}

      .quiz-expl{margin-top:14px;padding:14px 16px;border-radius:14px;font:500 14px/1.55 'Inter',sans-serif;animation:explIn .55s cubic-bezier(.34,1.56,.64,1) both;transform-origin:top center}
      .quiz-expl strong, .quiz-expl b{font-weight:800;color:#fde68a}
      .quiz-expl.expl-ok{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);color:#d1fae5 !important}
      .quiz-expl.expl-ko{background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.4);color:#e2e8f0 !important}
      .quiz-expl .expl-head{font:800 13px/1 'Plus Jakarta Sans',sans-serif;margin-bottom:6px;letter-spacing:.02em}
      .quiz-expl.expl-ok .expl-head{color:#a7f3d0 !important}
      .quiz-expl.expl-ko .expl-head{color:#c7d2fe !important}
      .quiz-expl .expl-body{font-weight:500}
      @keyframes explIn{0%{opacity:0;transform:translateY(-8px) scaleY(.85)}60%{opacity:1;transform:translateY(0) scaleY(1.04)}100%{transform:translateY(0) scaleY(1)}}
      @media (prefers-reduced-motion: reduce){.quiz-opt.ok,.quiz-opt.ko,.quiz-expl{animation:none}}
      .quiz-result{text-align:center;padding:20px 0}
      .quiz-score{font:800 56px/1 'Plus Jakarta Sans';background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px}
      .quiz-result p{font:600 17px/1.4 'Inter';color:#cbd5e1;margin:0 0 24px}
      .quiz-close-btn{padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:0;border-radius:14px;color:#fff;font:700 15px/1 'Inter';cursor:pointer;transition:transform .12s,opacity .12s;min-height:44px}
      .quiz-close-btn:active{transform:scale(.97);opacity:.9}
      .quiz-next-btn{width:100%;color:var(--a-ink);background:linear-gradient(to bottom,var(--a-lt) 0%,var(--a) 48%,var(--adk) 100%);box-shadow:0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent),0 1.5px 0 0 rgba(255,255,255,.28) inset,0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset}
    </style>
    <div class="quiz-body"></div>
  `;
  return el;
}
