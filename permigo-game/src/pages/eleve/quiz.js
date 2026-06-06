// ═══════════════════════════════════════════════════════════════
// Élève — Quiz post-validation ou consolidation
// mount(root, { competenceId, type })
// type: 'post_validation' (3 questions) | 'consolidation' (2 questions)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { lancerQuiz } from "@/services/quiz-engine.js";
import { findSubComp, findCategory } from "@/data/remc.js";
import { unlockChest } from "@/utils/game-state.js";
import { playVictory } from "@/utils/sound.js";

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
    color: var(--a);
    background: rgba(88,204,2,.1);
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
    background: var(--a);
    border: 0;
    border-radius: 16px;
    color: #fff;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(88,204,2,.4);
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
  .ring-ok { border-color: var(--gr); background: rgba(16,185,129,.08); }
  .ring-warn { border-color: var(--am); background: rgba(245,158,11,.08); }
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
    color: var(--mu4);
    margin: 0 0 28px;
  }
  .btn-parcours {
    width: 100%;
    padding: 16px;
    background: var(--a);
    border: 0;
    border-radius: 14px;
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    margin-bottom: 12px;
    transition: transform .15s, opacity .15s;
    box-shadow: 0 6px 20px rgba(88,204,2,.25);
  }
  .btn-parcours:active { transform: scale(.98); }
  .btn-home {
    width: 100%;
    padding: 14px;
    background: var(--bg);
    border: 1.5px solid var(--bo);
    border-radius: 14px;
    color: var(--mu4);
    font: 600 14px/1 'Inter', sans-serif;
    cursor: pointer;
  }
</style>`;

export async function mount(root, params = {}) {
  const me = getCurUser();
  if (!me) return;

  // #11 — plein écran d'épreuve : masque la bottom nav (anti-triche, anti-distraction)
  document.getElementById("bottom-nav")?.setAttribute("hidden", "");
  const _restoreNav = () => {
    document.getElementById("bottom-nav")?.removeAttribute("hidden");
    window.removeEventListener("hashchange", _restoreNav);
  };
  window.addEventListener("hashchange", _restoreNav);

  // Params viennent soit d'un appel direct, soit du hash #/quiz/C1a/post_validation
  const hashParts = location.hash.replace(/^#\/?/, "").split("/");
  const competenceId = params?.competenceId || hashParts[1] || null;
  const type = params?.type || hashParts[2] || "post_validation";
  const autoStart = params?.autoStart || hashParts[3] === "auto";

  if (!competenceId) {
    root.innerHTML = `<div style="padding:48px 24px;text-align:center;font-family:'Inter',sans-serif;color:var(--mu2)">
      <div style="font:700 16px/1.4 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:8px">Quiz non disponible</div>
      <p style="font-size:14px;margin:0 0 20px">Sélectionne une compétence depuis ton parcours pour démarrer un quiz.</p>
      <a href="#/parcours" style="display:inline-block;padding:12px 24px;background:var(--a);color:#fff;border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;text-decoration:none">Retour au parcours</a>
    </div>`;
    return;
  }

  const sub = findSubComp(competenceId);
  const cat = findCategory(competenceId);
  const nbQuestions = type === "post_validation" ? 3 : 2;
  const typeLabel =
    type === "post_validation" ? "Quiz post-validation" : "Consolidation 48h";

  track("page.view", {
    page: "eleve_quiz",
    competence_id: competenceId,
    quiz_type: type,
  });

  root.innerHTML = `
    ${STYLE}
    <div class="qp anim-slide-up">
      <div class="qp-card" id="qp-welcome">
        <div class="qp-badge">${esc(typeLabel)}</div>
        <div class="qp-cat-row">${cat?.ico ? icon(cat.ico, { size: 18, strokeWidth: 1.5 }) : ""} <span>${esc(cat?.name || "")}</span></div>
        <h1 class="qp-comp" tabindex="-1">${esc(sub?.n || competenceId)}</h1>
        <div class="qp-meta">
          <span class="qp-meta-item">${icon("file-text", { size: 14 })} ${nbQuestions} questions</span>
          <span class="qp-meta-item">${icon("zap", { size: 14 })} ~30 secondes</span>
        </div>
        <button class="btn-start" id="btn-start">Commencer</button>
        <button class="btn-skip" id="btn-skip">Plus tard</button>
      </div>
    </div>
  `;

  const startQuiz = async () => {
    root.querySelector("#btn-start").disabled = true;
    const startTs = Date.now();

    await lancerQuiz({
      competenceId,
      type,
      nbQuestions,
      onComplete: async (score, total) => {
        const duration = Math.round((Date.now() - startTs) / 1000);
        await handleComplete(root, me, {
          competenceId,
          type,
          score,
          total,
          duration,
        });
      },
    });
  };

  root.querySelector("#btn-start").addEventListener("click", startQuiz);
  root.querySelector("#btn-skip").addEventListener("click", () => {
    track("quiz.skipped", { competence_id: competenceId, type });
    location.hash = "#/";
  });

  // Lancement automatique (depuis notif-listener)
  if (autoStart) {
    await startQuiz();
  }
}

// ─── Fin de quiz ─────────────────────────────────────────────────
async function handleComplete(
  root,
  me,
  { competenceId, type, score, total, duration },
) {
  const scorePct = Math.round((score / total) * 100);

  // Coffre quiz parfait (100%) — idempotent
  if (scorePct === 100) {
    unlockChest("perfect_quiz", {
      xp: 100,
      gemmes: 25,
      title: "Précision",
    }).catch(() => {});
  }

  // Appel RPC central — gère quiz_attempts + transition statut + XP
  const { data, error } = await sb.rpc("submit_competence_quiz", {
    p_competence_id: competenceId,
    p_score: scorePct,
    p_type: type,
  });

  if (error) {
    console.warn("[quiz] submit_competence_quiz error", error);
    toast("Erreur lors de la sauvegarde — réessaie", "error");
    // Fallback : afficher le résultat quand même
    renderResult(root, {
      score,
      total,
      scorePct,
      validated: false,
      passed: scorePct >= 70,
      reason: null,
      type,
    });
    return;
  }

  const result = data?.[0] ?? data ?? {};
  const { passed, validated, reason } = result;

  track("quiz.result_saved", {
    competence_id: competenceId,
    type,
    score_pct: scorePct,
    passed: !!passed,
    validated: !!validated,
    duration_seconds: duration,
  });

  if (reason === "no_competence_unlocked") {
    toast(
      "Cette compétence n'est pas encore débloquée par ton moniteur.",
      "info",
    );
  } else if (validated) {
    toast("Compétence validée !", "success");
    navigator.vibrate?.([30, 50, 30]);
    playVictory();
  } else if (!passed) {
    toast("Presque ! Il te faut 70% pour valider. Réessaie.", "info");
  } else {
    toast("Quiz enregistré.", "success");
  }

  renderResult(root, {
    score,
    total,
    scorePct,
    validated: !!validated,
    passed: !!passed,
    reason,
    type,
  });
}

function renderResult(
  root,
  { score, total, scorePct, validated, passed, reason, type },
) {
  const success = validated || passed;
  const msg = validated
    ? "Compétence validée ! Continue comme ça"
    : passed
      ? "Bien joué ! Quiz réussi."
      : reason === "no_competence_unlocked"
        ? "Compétence pas encore débloquée par ton moniteur."
        : "Continue à pratiquer — revoir avec ton moniteur avant la prochaine leçon.";

  root.innerHTML = `
    ${STYLE}
    <div class="qp anim-slide-up">
      <div class="qp-card qp-result-card" role="status" aria-live="polite">
        <div class="qp-score-ring ${success ? "ring-ok" : "ring-warn"}">
          <span class="qp-score-num">${score}/${total}</span>
          <span class="qp-score-pct">${scorePct}%</span>
        </div>
        <p class="qp-result-msg">${esc(msg)}</p>
        <button class="btn-parcours" id="btn-parcours">Voir mon parcours →</button>
        ${!success ? `<button class="btn-home" id="btn-home">Retour accueil</button>` : ""}
      </div>
    </div>
  `;

  root.querySelector("#btn-parcours")?.addEventListener("click", () => {
    location.hash = "#/parcours";
  });
  root.querySelector("#btn-home")?.addEventListener("click", () => {
    location.hash = "#/";
  });
}
