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
import { getLang } from "@/utils/lang.js";
import { track } from "@/services/analytics.js";
import { lancerQuiz } from "@/services/quiz-engine.js";
import { findSubComp, findCategory } from "@/data/remc.js";
import { unlockChest } from "@/utils/game-state.js";
import { promptInstallAtValueMoment } from "@/components/common/install-nudge.js";
import { hideBottomNav } from "@/utils/nav.js";
import { playSuccess } from "@/utils/sound.js";
import {
  isFreeTierUser,
  freeQuota,
  consumeFree,
  resetIfNewDay,
} from "@/utils/free-tier.js";
import {
  discoveryPillHTML,
  DISCOVERY_PILL_STYLE,
} from "@/components/eleve/free-tier-wall.js";

// ── i18n de la COQUE (élève non-francophone) ────────────────────
// Textes d'interface REMPLACÉS dans la langue de l'élève (les QUESTIONS, elles,
// restent bilingues via quiz-ui/biText : traduction + FR gardé dessous).
// Dict local (règle coque), repli FR si clé absente. Les noms de compétence /
// catégorie REMC restent FR (contenu dynamique, traduit à sa source).
const QP_I18N = {
  en: {
    na_t: "Quiz not available",
    na_p: "Pick a skill from your journey to start a quiz.",
    na_btn: "Back to my journey",
    t_daily: "Question of the day",
    t_post: "Post-validation quiz",
    t_consol: "48h consolidation",
    m_q: "questions",
    m_s: "~30 seconds",
    start: "Start",
    later: "Later",
    no_q: "No questions for this skill yet",
    save_err: "Couldn't save. Try again",
    locked: "Your instructor hasn't unlocked this skill yet.",
    almost: "Almost! You need 70% to pass. Try again.",
    saved: "Quiz saved.",
    daily_ok: "Well done! Question of the day: done.",
    daily_ko: "Good try! Come back tomorrow for the next one.",
    validated: "Skill validated! Keep it up",
    passed_chain: "Well done! You're on a roll. Keep going?",
    passed: "Well done! Quiz passed.",
    upcoming_chain:
      "Upcoming skill. Your instructor will work on it with you.",
    upcoming:
      "Upcoming skill. Your instructor will work on it with you in a lesson.",
    retry_chain: "No worries. Every question helps you improve. Keep going?",
    retry:
      "You're almost there. One more round with your instructor and it's in the bag.",
    streak_days: "{n} days in a row",
    cont: "Keep practising",
    see_parcours: "See my journey",
    home: "Back home",
    go: "Here we go…",
  },
  ar: {
    na_t: "الاختبار غير متاح",
    na_p: "اختر مهارة من مسارك لبدء الاختبار.",
    na_btn: "العودة إلى المسار",
    t_daily: "سؤال اليوم",
    t_post: "اختبار ما بعد الاعتماد",
    t_consol: "ترسيخ بعد 48 ساعة",
    m_q: "أسئلة",
    m_s: "‏~30 ثانية",
    start: "ابدأ",
    later: "لاحقًا",
    no_q: "لا توجد أسئلة لهذه المهارة بعد",
    save_err: "تعذّر الحفظ. حاول مجددًا",
    locked: "لم يفتح مدرّبك هذه المهارة بعد.",
    almost: "اقتربت! تحتاج إلى 70٪ للنجاح. حاول مجددًا.",
    saved: "تم حفظ الاختبار.",
    daily_ok: "أحسنت! أنجزت سؤال اليوم.",
    daily_ko: "محاولة جيدة! عد غدًا للسؤال التالي.",
    validated: "تم اعتماد المهارة! واصل هكذا",
    passed_chain: "أحسنت! أنت في أوج حماسك. نتابع؟",
    passed: "أحسنت! نجحت في الاختبار.",
    upcoming_chain: "مهارة قادمة. سيتدرّب عليها مدرّبك معك.",
    upcoming: "مهارة قادمة. سيتدرّب عليها مدرّبك معك في الدرس.",
    retry_chain: "لا بأس. كل سؤال يجعلك تتقدّم. نواصل؟",
    retry: "اقتربت. جولة أخيرة مع مدرّبك وستنجح.",
    streak_days: "{n} أيام متتالية",
    cont: "واصل المراجعة",
    see_parcours: "عرض مساري",
    home: "العودة للرئيسية",
    go: "هيا بنا…",
  },
};
function qt(key, fr) {
  const l = getLang();
  return (l !== "fr" && QP_I18N[l]?.[key]) || fr;
}
// RTL par ATTRIBUT sur le bloc de texte (jamais <html dir> — règle lang.js).
function qtRtl() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}

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
    font: 700 11px/1 'Archivo', sans-serif;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--a-txt);
    background: color-mix(in srgb, var(--a) 10%, transparent);
    border-radius: var(--r-xl);
    padding: 5px 12px;
    margin-bottom: 20px;
  }
  .qp-cat-row {
    font: 500 13px/1 'Archivo', sans-serif;
    color: var(--mu);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .qp-comp {
    font: 800 22px/1.3 'Archivo', sans-serif;
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
    font: 600 12px/1 'Archivo', sans-serif;
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
    font: 800 16px/1 'Archivo', sans-serif;
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
    font: 500 14px/1 'Archivo', sans-serif;
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
    font: 600 30px/1 'Archivo', sans-serif;
    color: var(--ink);
  }
  .qp-score-pct {
    font: 600 14px/1 'Archivo', sans-serif;
    color: var(--mu);
    margin-top: 4px;
  }
  .qp-result-msg {
    font: 500 15px/1.5 'Archivo', sans-serif;
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
    font: 700 15px/1 'Archivo', sans-serif;
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
    font: 600 14px/1 'Archivo', sans-serif;
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

  // Session de révision : ouvre les compteurs de la session (quiz joués /
  // réussis) pour le récap de fin. Idempotent (no-op si déjà active).
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
    root.innerHTML = `<div style="padding:48px 24px;text-align:center;font-family:'Archivo',sans-serif;color:var(--mu2)"${qtRtl()}>
      <div style="font:700 16px/1.4 'Archivo',sans-serif;color:var(--ink);margin-bottom:8px">${esc(qt("na_t", "Quiz non disponible"))}</div>
      <p style="font-size:14px;margin:0 0 20px">${esc(qt("na_p", "Sélectionne une compétence depuis ton parcours pour démarrer un quiz."))}</p>
      <a href="#/parcours" style="display:inline-block;padding:15px 24px;background:var(--a);color: var(--a-ink);border-radius:12px;font:700 14px/1 'Archivo',sans-serif;text-decoration:none">${esc(qt("na_btn", "Retour au parcours"))}</a>
    </div>`;
    return;
  }

  const sub = findSubComp(competenceId);
  const cat = findCategory(competenceId);
  let nbQuestions = type === "post_validation" ? 3 : 2;

  // ── Mode découverte (élève solo non payé) : quota de questions du jour ──────
  // Quota épuisé → mur découverte chaleureux. Sinon on plafonne le nombre de
  // questions au reste du quota (le moteur s'arrête donc « après 3 questions »).
  const gated = isFreeTierUser(me);
  if (gated) {
    resetIfNewDay();
    const q = freeQuota("quiz");
    if (q.remaining <= 0) {
      _restoreNav();
      track("freetier.quota_hit", { kind: "quiz" });
      const { mountFreeTierWall } =
        await import("@/components/eleve/free-tier-wall.js");
      await mountFreeTierWall(root, { me, reason: "quota", kind: "quiz" });
      return;
    }
    nbQuestions = Math.min(nbQuestions, q.remaining);
  }
  const typeLabel = isDaily
    ? qt("t_daily", "Question du jour")
    : type === "post_validation"
      ? qt("t_post", "Quiz post-validation")
      : qt("t_consol", "Consolidation 48h");

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
        <div class="qp-badge"${qtRtl()}>${esc(typeLabel)}</div>
        <div class="qp-cat-row">${cat?.ico ? catMedallion(cat.ico, 28) : ""} <span>${esc(cat?.name || "")}</span></div>
        <h1 class="qp-comp" tabindex="-1">${esc(sub?.n || competenceId)}</h1>
        <div class="qp-meta">
          <span class="qp-meta-item"${qtRtl()}>${icon("file-text", { size: 14 })} ${nbQuestions} ${esc(qt("m_q", "questions"))}</span>
          <span class="qp-meta-item"${qtRtl()}>${icon("zap", { size: 14 })} ${esc(qt("m_s", "~30 secondes"))}</span>
        </div>
        ${gated ? `${DISCOVERY_PILL_STYLE}<div style="margin:0 0 16px">${discoveryPillHTML("quiz")}</div>` : ""}
        <button class="btn-start" id="btn-start">${esc(qt("start", "Commencer"))}</button>
        <button class="btn-skip" id="btn-skip">${esc(qt("later", "Plus tard"))}</button>
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
      toast(qt("no_q", "Pas encore de questions sur cette compétence"), "info");
      if (autoStart) location.hash = "#/";
    } else if (gated) {
      // Le quiz est bien lancé : on décompte les questions du quota du jour.
      consumeFree("quiz", null, nbQuestions);
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
// 1er quiz réussi : flag local (une fois par appareil, comme les ex-tutos).
const FIRST_QUIZ_REWARD_KEY = "pg-first-quiz-reward-v1";
function firstQuizRewardPending() {
  try {
    return !localStorage.getItem(FIRST_QUIZ_REWARD_KEY);
  } catch {
    return false;
  }
}
function markFirstQuizRewardDone() {
  try {
    localStorage.setItem(FIRST_QUIZ_REWARD_KEY, "1");
  } catch {
    /* mode privé strict → on ne re-célèbre pas de façon fiable, tant pis */
  }
}

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
    toast(qt("save_err", "Erreur lors de la sauvegarde. Réessaie"), "error");
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

  // 1er quiz réussi (hors question du jour, qui a déjà son moment d'opt-in
  // push) → on débloque un TOUR DE ROUE offert via un overlay dédié. C'est
  // aussi là que l'install se pitche désormais (plus de nudge à froid au boot).
  const quizWin = scorePct >= 70;
  const firstQuizReward = quizWin && !isDaily && firstQuizRewardPending();
  if (firstQuizReward) markFirstQuizRewardDone();
  // L'écran plein écran « Compétence acquise » (validated hors révision) gère
  // sa propre fermeture → la récompense y est déclenchée dans son onClose.
  const showsUnlockScreen = !!validated && !isRevision;

  track("quiz.result_saved", {
    competence_id: competenceId,
    type,
    score_pct: scorePct,
    passed: !!passed,
    validated: !!validated,
    duration_seconds: duration,
  });

  // Referme la boucle de consolidation : une fois le quiz de consolidation
  // fait, on marque LUE la notif correspondante. Sinon elle reste non lue à vie
  // et le hero d'accueil + la Daily Action repoussent le MÊME quiz déjà réussi
  // (cause du backlog de 424 consolidations « dues » jamais clôturées).
  if (type === "consolidation" && competenceId) {
    try {
      const me = getCurUser();
      if (me?.id) {
        await sb
          .from("notifications")
          .update({ read: true })
          .eq("user_id", me.id)
          .eq("type", "consolidation_quiz")
          .eq("data->>competence_id", String(competenceId))
          .eq("read", false);
      }
    } catch {
      /* best-effort : ne bloque jamais l'affichage du résultat */
    }
  }

  if (reason === "no_competence_unlocked") {
    // En mode découverte (question du jour / révision sur une compétence pas
    // encore travaillée), c'est le cas NORMAL — pas de message « bloqué ».
    if (!canChain)
      toast(
        qt(
          "locked",
          "Cette compétence n'est pas encore débloquée par ton moniteur.",
        ),
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
        const [valRes, selfValRes] = await Promise.allSettled([
          sb
            .from("validations")
            .select("competence_id")
            .eq("eleve_id", me.id)
            .eq("statut", "acquis"),
          // Validation autonome (élève solo, valider-seul.js) : table séparée
          // de `validations`, fusionnée pour ne pas laisser le compteur
          // bloqué. Même pattern que accueil.js.
          sb
            .from("self_validations")
            .select("competence_id")
            .eq("eleve_id", me.id),
        ]);
        const _compSet = new Set(
          (valRes.value?.data || []).map((v) => v.competence_id),
        );
        for (const s of selfValRes.value?.data || [])
          _compSet.add(s.competence_id);
        acquiredCount = _compSet.size;
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
        ctaLabel: qt("see_parcours", "Voir mon parcours"),
        source: "quiz",
        onCta: () => {
          location.hash = "#/parcours";
        },
        // À la fermeture : d'abord la fanfare « niveau supérieur » si montée,
        // PUIS l'install nudge — on n'empile jamais deux overlays d'un coup.
        onClose: async () => {
          // 1er quiz réussi → la récompense roue prend le pas sur l'install
          // (elle pitchera l'install après le tour, sur la page roue).
          if (firstQuizReward) {
            const { showFirstQuizReward } =
              await import("@/components/eleve/first-quiz-reward.js");
            showFirstQuizReward({ me, scorePct });
            return;
          }
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
    toast(
      qt("almost", "Presque ! Il te faut 70% pour valider. Réessaie."),
      "info",
    );
  } else {
    toast(qt("saved", "Quiz enregistré."), "success");
  }

  // Victoire élève SANS validation de compétence (quiz réussi mais pas de
  // transition de statut) → meilleur moment pour proposer l'install écran
  // d'accueil. Cap 1/24h + no-op si déjà installée (géré dans l'export).
  // Le cas "validated" gère son propre nudge via onClose de l'unlock screen.
  if (
    passed &&
    !validated &&
    !canChain &&
    reason !== "no_competence_unlocked" &&
    !firstQuizReward
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

  // 1er quiz réussi (hors écran « Compétence acquise » qui a son propre
  // enchaînement) → récompense roue offerte, par-dessus l'écran de résultat.
  if (firstQuizReward && !showsUnlockScreen) {
    const { showFirstQuizReward } =
      await import("@/components/eleve/first-quiz-reward.js");
    showFirstQuizReward({ me, scorePct });
  }
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
      ? qt("daily_ok", "Bien joué ! Question du jour cochée.")
      : qt("daily_ko", "Bonne tentative ! Reviens demain pour la suivante.");
  } else {
    msg = validated
      ? qt("validated", "Compétence validée ! Continue comme ça")
      : passed
        ? canChain
          ? qt("passed_chain", "Bien joué ! Tu es chaud. On enchaîne ?")
          : qt("passed", "Bien joué ! Quiz réussi.")
        : reason === "no_competence_unlocked"
          ? canChain
            ? qt(
                "upcoming_chain",
                "Compétence à venir. Ton moniteur la travaillera avec toi.",
              )
            : qt(
                "upcoming",
                "Compétence à venir. Ton moniteur la travaillera avec toi en leçon.",
              )
          : canChain
            ? qt(
                "retry_chain",
                "Pas grave. Chaque question te fait progresser. On continue ?",
              )
            : qt(
                "retry",
                "Tu y es presque. Un dernier tour avec ton moniteur et c'est dans la poche.",
              );
  }

  // Serie silencieuse sur l'ecran de resultat daily (>= 2 jours = fierté).
  // JAMAIS de mention de perte ou de pression.
  const dailyStreakHtml =
    isDaily && dailyStreakAfter >= 2
      ? `<div class="qp-daily-streak" role="status"><img class="qp-daily-streak-ico" src="${ASSETS.streakFlame}" alt="" aria-hidden="true" width="16" height="16" /><span${qtRtl()}>${esc(qt("streak_days", `${dailyStreakAfter} jours d'affilée`).replace("{n}", String(dailyStreakAfter)))}</span></div>`
      : "";

  // Enchaînement libre : « Continue à réviser » devient l'action principale,
  // « Voir mon parcours » passe en secondaire.
  // En mode daily: le bouton principal est "Retour accueil" (la boucle est terminee),
  // mais on propose un bouton secondaire "Continue a reviser" pour les motives.
  const contLbl = esc(qt("cont", "Continue à réviser"));
  const parcoursLbl = esc(qt("see_parcours", "Voir mon parcours"));
  const homeLbl = esc(qt("home", "Retour accueil"));
  let continueBtn, parcoursBtn, homeBtn;
  if (isDaily) {
    continueBtn = `<button class="btn-parcours" id="btn-continue">${contLbl}</button>`;
    parcoursBtn = "";
    homeBtn = `<button class="btn-home" id="btn-home">${homeLbl}</button>`;
  } else {
    continueBtn = canChain
      ? `<button class="btn-parcours" id="btn-continue">${contLbl}</button>`
      : "";
    parcoursBtn = canChain
      ? `<button class="btn-home" id="btn-parcours">${parcoursLbl}</button>`
      : `<button class="btn-parcours" id="btn-parcours">${parcoursLbl}</button>`;
    homeBtn =
      !success && !canChain
        ? `<button class="btn-home" id="btn-home">${homeLbl}</button>`
        : "";
  }

  root.innerHTML = `
    ${STYLE}
    <style>
    .qp-daily-streak {
      display: inline-flex; align-items: center; gap: 5px;
      margin: 10px auto 0;
      font: 700 13px/1 'Archivo', sans-serif;
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
        <p class="qp-result-msg"${qtRtl()}>${esc(msg)}</p>
        ${dailyStreakHtml}
        ${continueBtn}
        ${parcoursBtn}
        ${homeBtn}
      </div>
    </div>
  `;

  // (Retrait du 30/07/2026 : le bloc « +1 pt Révision » de la question du
  // jour vivait ici — cf. quiz-engine.js pour le pourquoi.)

  const contBtn = root.querySelector("#btn-continue");
  contBtn?.addEventListener("click", async () => {
    contBtn.disabled = true;
    contBtn.textContent = qt("go", "On y va…");
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
      location.hash = src === "secondary" ? "#/classement" : "#/parcours";
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
