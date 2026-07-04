// ═══════════════════════════════════════════════════════════════
// Élève — Quiz post-validation ou consolidation
// mount(root, { competenceId, type })
// type: 'post_validation' (3 questions) | 'consolidation' (2 questions)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { ASSETS } from "@/utils/assets.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { lancerQuiz } from "@/services/quiz-engine.js";
import { findSubComp, findCategory } from "@/data/remc.js";
import { unlockChest } from "@/utils/game-state.js";
import { promptInstallAtValueMoment } from "@/components/common/install-nudge.js";
import { hideBottomNav } from "@/utils/nav.js";
import { playSuccess } from "@/utils/sound.js";

// Mappe l'icône de catégorie REMC (cat.ico) vers un médaillon 3D premium.
// [glyphe, rampe] — les 4 mondes ont chacun leur identité visuelle.
const CAT_MED = {
  "world-c1": ["volant", "gold"], // Maîtrise du véhicule
  "world-c2": ["route", "blue"], // Circulation normale
  "world-c3": ["eclair", "violet"], // Conditions difficiles
  "world-c4": ["couronne", "gold"], // Conduite autonome
};

function catMedallion(ico, size = 28) {
  const [glyph, ramp] = CAT_MED[ico] || ["cible", "teal"];
  return medallion(glyph, ramp, { size });
}

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
    border-radius: var(--rx);
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(11,13,26,.07);
  }
  .qp-mascot {
    display: block;
    width: 92px;
    height: 92px;
    object-fit: contain;
    margin: 0 auto 14px;
    animation: qpMascotIn .45s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes qpMascotIn { from { opacity: 0; transform: scale(.85) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .qp-mascot { animation: none; } }
  .qp-badge {
    display: inline-block;
    font: 700 11px/1 'Inter', sans-serif;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--a-txt);
    background: color-mix(in srgb, var(--a) 10%, transparent);
    border-radius: var(--r-xl);
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
    border-radius: var(--r-xl);
    padding: 6px 12px;
  }
  .btn-start {
    width: 100%;
    padding: 18px;
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    border: 0;
    border-radius: var(--r-lg);
    color: var(--a-ink);
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 40%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
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
    transition: transform .14s var(--ease-snap);
  }
  .btn-skip:active { transform: scale(.97); }

  /* Result */
  .qp-result-card { animation: pop .35s var(--ease-snap); }
  @keyframes pop { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .qp-result-card { animation: none; } }
  .qp-score-ring {
    position: relative;
    width: 132px;
    height: 132px;
    margin: 0 auto 24px;
    display: grid;
    place-items: center;
  }
  .qp-score-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
  .qp-ring-track { fill: none; stroke: var(--bo); stroke-width: 9; opacity: .55; }
  .qp-ring-prog {
    fill: none;
    stroke-width: 9;
    stroke-linecap: round;
    stroke-dasharray: 339.29;
    stroke-dashoffset: var(--ring-off, 339.29);
    filter: drop-shadow(0 2px 6px color-mix(in srgb, var(--ring-glow, var(--gr)) 45%, transparent));
    animation: qpRingFill .9s .15s cubic-bezier(.22,1,.36,1) forwards;
  }
  @keyframes qpRingFill { from { stroke-dashoffset: 339.29; } }
  @media (prefers-reduced-motion: reduce) { .qp-ring-prog { animation: none; stroke-dashoffset: var(--ring-off, 339.29); } }
  .qp-score-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .ring-ok .qp-ring-prog { stroke: url(#qpRingGold); --ring-glow: var(--gr); }
  .ring-warn .qp-ring-prog { stroke: url(#qpRingAmber); --ring-glow: var(--am); }
  .qp-score-num {
    font: 600 30px/1 'Fredoka', 'Plus Jakarta Sans', sans-serif;
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
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    border: 0;
    border-radius: var(--r-md);
    color: var(--a-ink);
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    margin-bottom: 12px;
    transition: transform .15s, opacity .15s;
    box-shadow: 0 6px 20px color-mix(in srgb, var(--a) 25%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  }
  .btn-parcours:active { transform: scale(.98); }
  .btn-home {
    width: 100%;
    padding: 14px;
    background: var(--bg);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-md);
    color: var(--mu4);
    font: 600 14px/1 'Inter', sans-serif;
    cursor: pointer;
    transition: transform .14s var(--ease-snap);
  }
  .btn-home:active { transform: scale(.97); }
</style>`;

export async function mount(root, params = {}) {
  const me = getCurUser();
  if (!me) return;

  // #11 — plein écran d'épreuve : masque la bottom nav (anti-triche, anti-distraction)
  const _restoreNav = hideBottomNav();

  // Params viennent soit d'un appel direct, soit du hash #/quiz/C1a/post_validation
  // Segment 3 optionnel : "auto" (lancement direct), "daily" (question du jour :
  // lancement direct + habillage + marquage), "revision" (enchaînement libre :
  // lancement direct + bouton « Continue à réviser » en boucle).
  // Sentinel competenceId = "next" → le service choisit la compétence à réviser.
  const hashParts = location.hash.replace(/^#\/?/, "").split("/");
  const type = params?.type || hashParts[2] || "post_validation";
  const isDaily = hashParts[3] === "daily";
  const isRevision = hashParts[3] === "revision";
  const autoStart =
    params?.autoStart || hashParts[3] === "auto" || isDaily || isRevision;
  let competenceId = params?.competenceId || hashParts[1] || null;
  // Révision « ciblée » : sentinel "unseen" → ne pioche que les compétences pas
  // encore réussies. Le focus se propage dans l'enchaînement (cf. renderResult).
  const isUnseen = isRevision && competenceId === "unseen";

  // Session de révision : capture l'état de départ (rang ligue Révision) AVANT
  // le 1er quiz, pour le récap de fin de session. Idempotent (no-op si déjà active).
  if (isRevision) {
    import("@/services/revision-session.js")
      .then((m) => m.ensureRevisionSessionStarted())
      .catch(() => {});
  }

  // Mode révision sans cible explicite → on délègue le choix au service.
  // "unseen" = focus lacunes (compétences pas encore réussies) ; sinon mixte.
  if (isRevision && (!competenceId || competenceId === "next" || isUnseen)) {
    try {
      const { pickRevisionQuiz, pickUnseenRevisionQuiz } =
        await import("@/services/daily-quiz.js");
      const pick = isUnseen
        ? (await pickUnseenRevisionQuiz(me.id)) ||
          (await pickRevisionQuiz(me.id))
        : await pickRevisionQuiz(me.id);
      competenceId = pick?.competenceId || null;
    } catch {
      competenceId = null; // → écran « quiz non disponible » ci-dessous
    }
  }

  if (!competenceId) {
    root.innerHTML = `<div style="padding:48px 24px;text-align:center;font-family:'Inter',sans-serif;color:var(--mu2)">
      <div style="font:700 16px/1.4 'Plus Jakarta Sans',sans-serif;color:var(--ink);margin-bottom:8px">Quiz non disponible</div>
      <p style="font-size:14px;margin:0 0 20px">Sélectionne une compétence depuis ton parcours pour démarrer un quiz.</p>
      <a href="#/parcours" style="display:inline-block;padding:15px 24px;background:var(--a);color: var(--a-ink);border-radius:12px;font:700 14px/1 'Plus Jakarta Sans',sans-serif;text-decoration:none">Retour au parcours</a>
    </div>`;
    return;
  }

  const sub = findSubComp(competenceId);
  const cat = findCategory(competenceId);
  const nbQuestions = type === "post_validation" ? 3 : 2;
  const typeLabel = isDaily
    ? "Question du jour"
    : type === "post_validation"
      ? "Quiz post-validation"
      : "Consolidation 48h";

  track("page.view", {
    page: "eleve_quiz",
    competence_id: competenceId,
    quiz_type: type,
    daily: isDaily,
  });

  root.innerHTML = `
    ${STYLE}
    <div class="qp anim-slide-up">
      <div class="qp-card" id="qp-welcome">
        <img class="qp-mascot" src="/skins/mascot-hello.png" alt="" aria-hidden="true" />
        <div class="qp-badge">${esc(typeLabel)}</div>
        <div class="qp-cat-row">${cat?.ico ? catMedallion(cat.ico, 28) : ""} <span>${esc(cat?.name || "")}</span></div>
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
    const startBtn = root.querySelector("#btn-start");
    if (startBtn) startBtn.disabled = true;
    const startTs = Date.now();

    const launched = await lancerQuiz({
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
          isDaily,
          isRevision,
          isUnseen,
        });
      },
    });

    // lancerQuiz renvoie null si la compétence n'a aucune question de ce type :
    // sans ce garde-fou le bouton restait figé en « disabled » sans aucun
    // retour (cul-de-sac). On réactive + message clair, ou on rentre à
    // l'accueil si le quiz avait été lancé automatiquement (pas de bouton à
    // réactiver pour l'élève).
    if (launched === null) {
      if (startBtn) startBtn.disabled = false;
      toast("Pas encore de questions sur cette compétence", "info");
      if (autoStart) location.hash = "#/";
    }
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
  {
    competenceId,
    type,
    score,
    total,
    duration,
    isDaily = false,
    isRevision = false,
    isUnseen = false,
  },
) {
  const scorePct = Math.round((score / total) * 100);
  // Enchaînement libre : question du jour OU session de révision.
  const canChain = isDaily || isRevision;

  // Mémorise la compétence jouée pour varier la suivante dans la session.
  if (canChain) {
    import("@/services/daily-quiz.js")
      .then((m) => m.pushRevisionRecent(competenceId))
      .catch(() => {});
  }

  // Question du jour : terminée = faite (réussie ou non — la métrique
  // mesure le rendez-vous quotidien, pas la performance).
  let dailyStreakAfter = 0;
  if (isDaily) {
    const { markDailyDone, getDailyStreak } =
      await import("@/services/daily-quiz.js");
    markDailyDone(); // met à jour LS_DONE + LS_DAILY_STREAK
    dailyStreakAfter = getDailyStreak(); // lit la série APRES le marquage
    // Son de succès — fluide, non intrusif (respecte le pref son de l'élève).
    playSuccess();
    track("daily_quiz.completed", {
      competence_id: competenceId,
      score_pct: scorePct,
      daily_streak: dailyStreakAfter,
    });
    // Moment d'opt-in idéal : l'élève vient de vivre la boucle → on propose
    // le rappel quotidien (banner soft, 1 seule fois, jamais re-demandé).
    import("@/services/web-push.js")
      .then((m) => m.maybeSoftRequestPush({ skipValidatedGate: true }))
      .catch(() => {});
  }

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
    // En mode découverte (question du jour / révision sur une compétence pas
    // encore travaillée), c'est le cas NORMAL — pas de message « bloqué ».
    if (!canChain)
      toast(
        "Cette compétence n'est pas encore débloquée par ton moniteur.",
        "info",
      );
  } else if (validated) {
    // Marque la compétence comme célébrée (ledger partagé avec le parcours)
    // pour éviter une double-célébration, quel que soit le mode.
    const { markCompetenceCelebrated } =
      await import("@/services/competence-celebration.js");
    markCompetenceCelebrated(competenceId);

    // En ENCHAÎNEMENT de révision, on ne coupe pas la boucle avec l'écran
    // plein écran « Compétence acquise » à chaque quiz (souvent une compétence
    // déjà acquise qu'on re-révise) : le flux reste fluide et la célébration
    // est réservée au récap de fin de session. Hors révision : écran premium.
    if (!isRevision) {
      // Compte le total de compétences acquises pour le bloc stats + la barre.
      let acquiredCount = null;
      try {
        const { count } = await sb
          .from("validations")
          .select("id", { count: "exact", head: true })
          .eq("eleve_id", me.id)
          .eq("statut", "acquis");
        if (typeof count === "number") acquiredCount = count;
      } catch {
        /* best-effort — l'écran s'affiche sans le compteur */
      }
      // Montée de niveau ? (XP dérivée des compétences → 1 niveau / 5 acquis).
      // On la détecte ici et on la célèbre APRÈS l'écran « compétence acquise ».
      let leveledTo = 0;
      if (typeof acquiredCount === "number") {
        const { levelForCount, checkLevelUp } =
          await import("@/components/eleve/level-up.js");
        leveledTo = checkLevelUp(levelForCount(acquiredCount));
      }

      const { showCompetenceUnlock } =
        await import("@/components/eleve/competence-unlock.js");
      showCompetenceUnlock({
        competenceCode: competenceId,
        scorePct,
        validatedCount: acquiredCount,
        ctaLabel: "Voir mon parcours",
        source: "quiz",
        onCta: () => {
          location.hash = "#/parcours";
        },
        // À la fermeture : d'abord la fanfare « niveau supérieur » si montée,
        // PUIS l'install nudge — on n'empile jamais deux overlays d'un coup.
        onClose: async () => {
          const installNudge = () => {
            if (!canChain) promptInstallAtValueMoment(me, "eleve_quiz_reussi");
          };
          if (leveledTo) {
            const { showLevelUp } =
              await import("@/components/eleve/level-up.js");
            showLevelUp({ level: leveledTo, onClose: installNudge });
          } else {
            installNudge();
          }
        },
      });
    }
  } else if (!passed) {
    toast("Presque ! Il te faut 70% pour valider. Réessaie.", "info");
  } else {
    toast("Quiz enregistré.", "success");
  }

  // Victoire élève SANS validation de compétence (quiz réussi mais pas de
  // transition de statut) → meilleur moment pour proposer l'install écran
  // d'accueil. Cap 1/24h + no-op si déjà installée (géré dans l'export).
  // Le cas "validated" gère son propre nudge via onClose de l'unlock screen.
  if (
    passed &&
    !validated &&
    !canChain &&
    reason !== "no_competence_unlocked"
  ) {
    promptInstallAtValueMoment(me, "eleve_quiz_reussi");
  }

  // Comptage de la session de révision (pour le récap de fin de session).
  if (isRevision) {
    const quizPassed = !!validated || !!passed || scorePct >= 70;
    import("@/services/revision-session.js")
      .then((m) => m.noteRevisionQuiz({ passed: quizPassed }))
      .catch(() => {});
  }

  renderResult(root, {
    score,
    total,
    scorePct,
    validated: !!validated,
    passed: !!passed,
    reason,
    type,
    isDaily,
    isRevision,
    isUnseen,
    canChain,
    me,
    competenceId,
    dailyStreakAfter,
  });
}

function renderResult(
  root,
  {
    score,
    total,
    scorePct,
    validated,
    passed,
    reason,
    type,
    isDaily = false,
    isRevision = false,
    isUnseen = false,
    canChain = false,
    me = null,
    competenceId = null,
    dailyStreakAfter = 0,
  },
) {
  const success = validated || passed;

  // Message contextualisé selon le mode.
  // Question du jour : message positif indépendamment du score (le rendez-vous
  // compte, pas la performance).
  let msg;
  if (isDaily) {
    msg = success
      ? "Bien joué ! Question du jour cochée."
      : "Bonne tentative ! Reviens demain pour la suivante.";
  } else {
    msg = validated
      ? "Compétence validée ! Continue comme ça"
      : passed
        ? canChain
          ? "Bien joué ! Tu es chaud — on enchaîne ?"
          : "Bien joué ! Quiz réussi."
        : reason === "no_competence_unlocked"
          ? canChain
            ? "Belle découverte ! Tu viens d'explorer une compétence à venir — ton moniteur la travaillera avec toi."
            : "Compétence pas encore débloquée par ton moniteur."
          : canChain
            ? "Pas grave — chaque question te fait progresser. On continue ?"
            : "Tu y es presque — un dernier tour avec ton moniteur et c'est dans la poche.";
  }

  // Serie silencieuse sur l'ecran de resultat daily (>= 2 jours = fierté).
  // JAMAIS de mention de perte ou de pression.
  const dailyStreakHtml =
    isDaily && dailyStreakAfter >= 2
      ? `<div class="qp-daily-streak" role="status"><img class="qp-daily-streak-ico" src="${ASSETS.streakFlame}" alt="" aria-hidden="true" width="16" height="16" />${dailyStreakAfter} jours d'affilée</div>`
      : "";

  // Slot pour le gain Ligue Revision (injecte de facon asynchrone apres render).
  const theoryGainSlot = isDaily ? `<div id="qp-theory-gain-slot"></div>` : "";

  // Enchaînement libre : « Continue à réviser » devient l'action principale,
  // « Voir mon parcours » passe en secondaire.
  // En mode daily: le bouton principal est "Retour accueil" (la boucle est terminee),
  // mais on propose un bouton secondaire "Continue a reviser" pour les motives.
  let continueBtn, parcoursBtn, homeBtn;
  if (isDaily) {
    continueBtn = `<button class="btn-parcours" id="btn-continue">Continue à réviser</button>`;
    parcoursBtn = "";
    homeBtn = `<button class="btn-home" id="btn-home">Retour accueil</button>`;
  } else {
    continueBtn = canChain
      ? `<button class="btn-parcours" id="btn-continue">Continue a reviser</button>`
      : "";
    parcoursBtn = canChain
      ? `<button class="btn-home" id="btn-parcours">Voir mon parcours</button>`
      : `<button class="btn-parcours" id="btn-parcours">Voir mon parcours</button>`;
    homeBtn =
      !success && !canChain
        ? `<button class="btn-home" id="btn-home">Retour accueil</button>`
        : "";
  }

  root.innerHTML = `
    ${STYLE}
    <style>
    .qp-daily-streak {
      display: inline-flex; align-items: center; gap: 5px;
      margin: 10px auto 0;
      font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
      color: var(--am-txt);
      background: color-mix(in srgb, var(--am, #f59e0b) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--am, #f59e0b) 28%, transparent);
      border-radius: 99px;
      padding: 6px 14px 7px;
      animation: qpStreakIn .4s .3s cubic-bezier(.34,1.56,.64,1) both;
    }
    .qp-daily-streak-ico { display: block; width: 16px; height: 16px; object-fit: contain; }
    @keyframes qpStreakIn { from { opacity:0; transform:translateY(6px) scale(.9); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion: reduce) { .qp-daily-streak { animation: none; } }
    </style>
    <div class="qp anim-slide-up">
      <div class="qp-card qp-result-card" role="status" aria-live="polite">
        <div class="qp-score-ring ${success ? "ring-ok" : "ring-warn"}" style="--ring-off:${(339.29 * (100 - Math.max(0, Math.min(100, scorePct)))) / 100}">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="qpRingGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffd24a"/><stop offset=".55" stop-color="#6fe016"/><stop offset="1" stop-color="#3f9e00"/>
              </linearGradient>
              <linearGradient id="qpRingAmber" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffdfb8"/><stop offset="1" stop-color="#ff9c1c"/>
              </linearGradient>
            </defs>
            <circle class="qp-ring-track" cx="60" cy="60" r="54"/>
            <circle class="qp-ring-prog" cx="60" cy="60" r="54"/>
          </svg>
          <div class="qp-score-inner">
            <span class="qp-score-num">${score}/${total}</span>
            <span class="qp-score-pct">${scorePct}%</span>
          </div>
        </div>
        <p class="qp-result-msg">${esc(msg)}</p>
        ${dailyStreakHtml}
        ${theoryGainSlot}
        ${continueBtn}
        ${parcoursBtn}
        ${homeBtn}
      </div>
    </div>
  `;

  // Gain Ligue Revision — injecte de facon asynchrone apres le RPC
  // (le calcul a deja ete fait dans quiz-engine via computeTheoryGain, mais
  // pour la question du jour on doit le refaire ici car quiz.js gere le flow
  // complet et le slot est disponible maintenant).
  if (isDaily) {
    const gainSlot = root.querySelector("#qp-theory-gain-slot");
    if (gainSlot) {
      Promise.all([import("@/components/eleve/theory-gain.js")])
        .then(([{ computeTheoryGain, renderTheoryGain }]) =>
          computeTheoryGain({
            kind: "quiz",
            competenceId,
            scorePct,
          }).then((gain) => {
            if (gain && gainSlot.isConnected) renderTheoryGain(gainSlot, gain);
          }),
        )
        .catch(() => {});
    }
  }

  const contBtn = root.querySelector("#btn-continue");
  contBtn?.addEventListener("click", async () => {
    contBtn.disabled = true;
    contBtn.textContent = "On y va…";
    track("revision_chain.continue", {
      from_competence: competenceId,
      unseen: isUnseen,
    });
    // Focus « lacunes » : on garde le sentinel "unseen" pour que le mount
    // re-pioche une compétence pas encore réussie. Sinon, pré-résolution mixte.
    let next = isUnseen ? "unseen" : null;
    if (!isUnseen) {
      try {
        const { pickRevisionQuiz } = await import("@/services/daily-quiz.js");
        if (me?.id)
          next = (await pickRevisionQuiz(me.id))?.competenceId || null;
      } catch {
        /* pick échoué → on délègue le choix au mount via le sentinel */
      }
    }
    // Nonce en 5e segment : garantit un hash distinct (donc un re-mount) même
    // si la compétence suivante est identique. Le parsing ignore ce segment.
    location.hash = `#/quiz/${next || "next"}/post_validation/revision/${Date.now()}`;
  });

  root.querySelector("#btn-parcours")?.addEventListener("click", async (e) => {
    // En mode révision, « Voir mon parcours » = quitter l'enchaînement →
    // on affiche d'abord le récap de session (Clash Royale), puis on navigue.
    if (isRevision) {
      const btn = e.currentTarget;
      btn.disabled = true;
      const src = await runRevisionRecap();
      location.hash =
        src === "secondary" ? "#/classement/revision" : "#/parcours";
      return;
    }
    location.hash = "#/parcours";
  });
  root.querySelector("#btn-home")?.addEventListener("click", () => {
    location.hash = "#/";
  });
}

// Récap de fin de session révision (façon Clash Royale). Retourne la source de
// fermeture ('cta' | 'secondary' | 'close') ou null si rien n'a été affiché.
async function runRevisionRecap() {
  try {
    const sess = await import("@/services/revision-session.js");
    if (!sess.isRevisionSessionActive()) return null;
    const summary = await sess.buildRevisionSummary();
    sess.clearRevisionSession();
    if (!summary || (summary.nQuiz ?? 0) === 0) return null;
    const { showRevisionRecap } =
      await import("@/components/eleve/revision-recap.js");
    // onSecondary présent → fait apparaître le lien « Voir le classement » ;
    // la navigation finale est décidée par la source de fermeture ci-dessus.
    return await showRevisionRecap(summary, { onSecondary: () => {} });
  } catch (e) {
    console.warn("[quiz] revision recap failed", e);
    return null;
  }
}
