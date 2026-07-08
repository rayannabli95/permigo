// ═══════════════════════════════════════════════════════════════
// Élève — Ton parcours d'examen (5 parcours × 15 questions)
// 100 % statique — pas de Supabase
// Seuil : 12/15 (80 %) — verdict CEPC
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getMyChests } from "@/utils/game-state.js";
import { recordAnswer, getWeakPoints } from "@/utils/weak-points.js";
import {
  PARCOURS,
  QUESTIONS,
  questionsForParcours,
} from "@/data/parcours-quiz.js";
import { getCentre } from "@/data/centres-examen.js";
import { toast } from "@/components/common/toast.js";
import {
  computeTheoryGain,
  renderTheoryGain,
} from "@/components/eleve/theory-gain.js";
import { haptic } from "@/utils/haptic.js";
import { hideBottomNav } from "@/utils/nav.js";
import {
  muteButtonHTML,
  wireQuestionSpeech,
  stopSpeaking,
} from "@/utils/speech.js";
import {
  playPageturn,
  playCorrect,
  playWrong,
  playVictory,
  playDefeat,
  playQuizMusic,
  playWhoosh,
} from "@/utils/sound.js";

const PASS_THRESHOLD = 12; // / 15

// ── Mode « Examen officiel » ──────────────────────────────────
// 40 questions tirées au hasard dans TOUTE la banque, chrono par question,
// verdict comme le vrai ETG : admis si 5 fautes maximum (≥ 35/40).
const OFFICIEL_TOTAL = 40;
const OFFICIEL_MAX_FAUTES = 5;
const OFFICIEL_SECONDS = 20; // temps par question
// Verrou premium : passe à `true` le jour où PermiGo+ élève (paiement) est en
// place → la carte se grise et l'achat se déclenche. Tant que c'est `false`,
// le mode est GRATUIT : il doit être goûté pour donner envie d'acheter
// (cf. docs/AUDIT-EXAMEN-BLANC-2026-06-16.md).
const EXAMEN_OFFICIEL_LOCKED = false;

// Timer du mode officiel — module-level pour pouvoir le couper à la sortie.
let _examTimer = null;
function clearExamTimer() {
  if (_examTimer) {
    clearInterval(_examTimer);
    _examTimer = null;
  }
}

// Mélange les réponses d'une question (Fisher-Yates) et remappe l'index de la
// bonne réponse vers sa nouvelle position. Sans ça, `correct` reste fixe dans
// les données → la bonne réponse tombe toujours à la même place (souvent la 1re).
// On clone la question : les données sources (QUESTIONS) restent intactes, et le
// même objet mélangé sert au rendu ET au score (cohérence garantie).
function withShuffledOptions(q) {
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return {
    ...q,
    options: idx.map((i) => q.options[i]),
    correct: idx.indexOf(q.correct),
  };
}

// Déblocage par progression : l'examen officiel s'ouvre une fois que l'élève a
// validé sa compétence 1 — concrètement quand il a OUVERT le coffre `world_1`
// (son premier coffre, qui annonce « Examen blanc débloqué »). Recalculé au mount.
let _examenUnlocked = false;

// Mélodie de fond de l'examen (module-level : start au parcours, stop en sortie)
let _examStopMusic = null;
function stopExamMusic() {
  if (_examStopMusic) {
    _examStopMusic();
    _examStopMusic = null;
  }
  stopSpeaking(); // toute sortie de l'examen coupe la lecture vocale
}

// Trophées DÉCORATIFS (pas de déblocage ici — pur design)
const TROPHY_START = {
  img: "/skins/trophy-first-validation.webp",
  ico: "zap",
  nom: "Première étincelle",
};
const TROPHY_END = {
  img: "/skins/trophy-streak-30d.webp",
  ico: "gem",
  nom: "Mois sans rater",
};

function renderTrophy(t, variant) {
  return `
    <div class="exb-trophy ${variant}">
      <img class="exb-trophy-img" src="${esc(t.img)}" alt="${esc(t.nom)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="exb-trophy-emoji" style="display:none">${icon(t.ico, { size: 28 })}</span>
      <span class="exb-trophy-cap">${esc(t.nom)}</span>
    </div>`;
}

// Parcours visuel : 15 points reliés, vert (juste) / rouge (faux) / courant
function renderTrack(questions, answers, currentIdx) {
  return `<div class="exb-track" id="exb-track">${questions
    .map((q, i) => {
      let cls = "";
      if (answers[i] === null || answers[i] === undefined)
        cls = i === currentIdx ? "is-current" : "";
      else cls = answers[i] === q.correct ? "is-correct" : "is-wrong";
      return `<span class="exb-node ${cls}" data-node="${i}"></span>`;
    })
    .join("")}</div>`;
}

// ─── Mount ───────────────────────────────────────────────────
export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;

  // Masque la bottom nav pendant le quiz (anti-distraction)
  const _restoreNav = hideBottomNav(() => {
    stopExamMusic();
    clearExamTimer();
  });

  track("page_view", { page: "parcours_quiz", user_role: me.role });

  // Déblocage de l'examen officiel = coffre de la compétence 1 (world_1) ouvert.
  _examenUnlocked = false;
  try {
    const chests = await getMyChests();
    _examenUnlocked = (chests || []).some(
      (c) => c?.chest_type === "world_1" && c?.opened_at,
    );
  } catch (_) {
    /* DB indispo → on reste prudemment verrouillé */
  }

  // Deep-link depuis la fiche centre : #/exam-blanc/c-<slug>
  // → lance directement la révision du centre sans afficher la sélection.
  if (param && param.startsWith("c-")) {
    const slug = param.slice(2);
    const centre = getCentre(slug);
    if (centre) {
      root.innerHTML = renderStyles() + renderSelection();
      startCentreRevision(root, slug);
      return;
    }
  }

  root.innerHTML = renderStyles() + renderSelection();
  wireSelection(root);
}

// ─── Écran 1 : sélection du parcours ─────────────────────────
// Grille de réponses A/B/C/D — markup partagé par les boucles de quiz exam-blanc.
function renderChoices(q) {
  return `<div class="exb-choices" id="exb-choices" role="group" aria-label="Réponses">
          ${q.options
            .map(
              (opt, i) => `
            <button class="exb-choice" data-idx="${i}" aria-pressed="false">
              <span class="exb-choice-letter">${String.fromCharCode(65 + i)}</span>
              <span class="exb-choice-text">${esc(opt)}</span>
            </button>`,
            )
            .join("")}
        </div>`;
}

// Corps d'une question (énoncé + grille de réponses + conteneur feedback),
// partagé par les 4 rendus de question. La mascotte n'apparaît qu'en parcours.
// mascotState : pose initiale ("hello" 1re question, "think" sinon).
function renderQuestionBody(
  q,
  num,
  { mascot = false, mascotState = "think" } = {},
) {
  return `<div class="exb-qbody" id="exb-qbody">
        ${mascot ? `<img class="exb-mascot" src="/skins/mascot-${esc(mascotState)}.png" alt="" aria-hidden="true" />` : ""}
        <p class="exb-qnum">Question ${num}</p>
        <div class="exb-qhead">
          ${muteButtonHTML()}
          <p class="exb-qtext">${esc(q.enonce)}</p>
        </div>
        ${q.image ? `<img class="exb-qimg" src="${esc(q.image)}" alt="Panneau routier à identifier" />` : ""}
        ${renderChoices(q)}
        <div class="exb-feedback" id="exb-feedback" role="status" aria-live="polite" hidden></div>
      </div>`;
}

// Bloc de feedback partagé par les 3 modes (parcours / officiel / révision).
// Variantes : bannière « faute éliminatoire » (parcours), préfixe « Temps
// écoulé » (officiel en timeout), libellé du dernier bouton.
function renderFeedbackBlock({
  isCorrect,
  correct,
  explication,
  isLast,
  lastLabel,
  faute = false,
  timedOut = false,
}) {
  const banner =
    !isCorrect && faute
      ? `<div class="exb-faute-banner">${medallion("panneau", "red", { size: 22 })}<span>À l’examen, cette faute est éliminatoire. Mieux vaut la corriger ici.</span></div>`
      : "";
  const verdict = isCorrect
    ? "✓ Bonne réponse"
    : (timedOut ? "⏱ Temps écoulé · " : "") +
      "La bonne réponse était la " +
      esc(String.fromCharCode(65 + correct));
  return `
    ${banner}
    <div class="exb-feedback-verdict ${isCorrect ? "exb-feedback-verdict--ok" : "exb-feedback-verdict--ko"}">
      ${verdict}
    </div>
    <p class="exb-feedback-explication">${esc(explication)}</p>
    <button class="exb-next-btn" id="exb-next">${isLast ? esc(lastLabel) : "Question suivante →"}</button>
  `;
}

function renderSelection() {
  // Étoiles de difficulté : mini-SVG (pleines dorées / contour gris) — pas un
  // médaillon par étoile (trop lourd). 1 seul path d'étoile réutilisé.
  const stars = (n) =>
    `<span class="exb-pcard-stars-svg" aria-hidden="true">${Array.from(
      { length: 5 },
      (_, i) =>
        `<svg viewBox="0 0 24 24" width="13" height="13" class="exb-star ${i < n ? "is-on" : ""}"><path d="M12 2.6l2.7 5.9 6.4.7-4.8 4.4 1.3 6.4L12 17l-5.6 3 1.3-6.4L2.9 9.2l6.4-.7z"/></svg>`,
    ).join("")}</span>`;
  const cards = PARCOURS.map(
    (p) => `
    <button class="exb-pcard" data-pid="${p.id}" aria-label="Démarrer le parcours ${esc(p.nom)}">
      <div class="exb-pcard-top">
        <span class="exb-pcard-num">Parcours ${p.id}</span>
        <span class="exb-pcard-stars" aria-label="Difficulté ${p.difficulte}/5"><small class="exb-pcard-stars-lbl">Difficulté</small>${stars(p.difficulte)}</span>
      </div>
      <div class="exb-pcard-nom">${esc(p.nom)}</div>
      <div class="exb-pcard-ctx">${esc(p.contexte)}</div>
      <div class="exb-pcard-meta">15 questions · réussir dès 12/15</div>
    </button>
  `,
  ).join("");

  const locked = EXAMEN_OFFICIEL_LOCKED || !_examenUnlocked;
  const lockMed = medallion("cadenas", "slate", { size: 16 });
  const lockBadge = EXAMEN_OFFICIEL_LOCKED
    ? `${lockMed} PermiGo+`
    : `${lockMed} Compétence 1`;
  const lockSub = EXAMEN_OFFICIEL_LOCKED
    ? "Débloque le vrai examen blanc avec PermiGo+."
    : "Valide ta compétence 1 pour ouvrir le vrai examen blanc.";
  const officiel = locked
    ? `<button class="exo-hero is-locked" id="exb-officiel" aria-label="Examen officiel verrouillé">
        <span class="exo-hero-lock">${lockBadge}</span>
        <span class="exo-hero-kicker">Examen officiel</span>
        <span class="exo-hero-title">40 questions · chrono · comme le vrai</span>
        <span class="exo-hero-sub">${lockSub}</span>
      </button>`
    : `<button class="exo-hero" id="exb-officiel" aria-label="Démarrer l’examen officiel">
        <span class="exo-hero-kicker">Examen officiel</span>
        <span class="exo-hero-title">40 questions · chrono · comme le vrai</span>
        <span class="exo-hero-sub">Admis avec 5 fautes maximum.</span>
        <span class="exo-hero-cta">Commencer →</span>
      </button>`;

  const weak = getWeakPoints({ minSeen: 3, limit: 3 });
  const weakSection = weak.length
    ? `<div class="exb-weak">
    <p class="exb-weak-title">${medallion("cible", "red", { size: 24 })} Tes points faibles</p>
    <div class="exb-weak-list">
      ${weak
        .map(
          (w) =>
            `
        <button class="exb-weak-btn" data-tag="${esc(w.tag)}" data-label="${esc(w.label)}" aria-label="Réviser ${esc(w.label)}">
          <span class="exb-weak-info">
            <span class="exb-weak-nom">${esc(w.label)}</span>
            <span class="exb-weak-stat">${w.wrong} erreur${w.wrong > 1 ? "s" : ""} · ${Math.round(w.rate * 100)} % ratées</span>
          </span>
          <span class="exb-weak-cta">Réviser →</span>
        </button>`,
        )
        .join("")}
    </div>
  </div>`
    : "";

  return `
<div class="exb anim-slide-up" id="exb-screen">
  <div class="exb-sel-header">
    <button class="exb-quit-btn" id="exb-back" aria-label="Retour">←</button>
    ${renderTrophy(TROPHY_START, "exb-trophy--start")}
    <h1 class="exb-sel-title">Ton parcours d’examen</h1>
    <p class="exb-sel-sub">L’examen comme le vrai, ou entraîne-toi par thème.</p>
  </div>
  ${officiel}
  ${weakSection}
  <p class="exb-sel-sub2">Entraîne-toi par thème · ${PARCOURS.length} parcours de 15 questions</p>
  <div class="exb-pcards" id="exb-pcards">
    ${cards}
  </div>
</div>`;
}

function wireSelection(root) {
  root.querySelector("#exb-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/");
  });

  root.querySelector("#exb-officiel")?.addEventListener("click", () => {
    haptic("select");
    if (EXAMEN_OFFICIEL_LOCKED) {
      // Le jour J : ouvrir ici la feuille d'achat PermiGo+ (Stripe élève).
      toast("Bientôt : l’examen officiel avec PermiGo+", "info", 3500);
      return;
    }
    if (!_examenUnlocked) {
      toast(
        "Valide ta compétence 1 pour ouvrir l’examen blanc 🔒",
        "info",
        3500,
      );
      return;
    }
    startExamenOfficiel(root);
  });

  root.querySelectorAll(".exb-weak-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic("select");
      startThemeRevision(root, btn.dataset.tag, btn.dataset.label);
    });
  });

  root.querySelectorAll(".exb-pcard").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = parseInt(btn.dataset.pid, 10);
      haptic("select");
      startParcours(root, pid);
    });
  });
}

// ─── Écran 2 : quiz ──────────────────────────────────────────
// ─── Moteur de quiz unifié (parcours / officiel / révision) ──────────
// Gère l'état (answers/idx), le rendu de chaque question, la révélation de la
// réponse (couleurs + son + feedback) et l'enchaînement → résultats. Les
// différences de mode passent par `opts` : header, chrono, quit, résultats…
function runExbQuiz(
  root,
  questions,
  {
    mascot = false,
    chrono = false, // officiel : compte à rebours OFFICIEL_SECONDS / question
    renderHeader, // ({ num, total, idx, answers }) => html (doit contenir #exb-quit)
    onQuit, // (num) => void — confirm + nettoyage + nav/re-render
    colorTrackNode = false, // parcours : colore le point du track à la réponse
    feedbackLast, // libellé du bouton sur la dernière question
    feedbackFaute = false, // parcours : bannière faute éliminatoire
    onComplete, // (answers) => void — écran de résultats
  },
) {
  const answers = new Array(questions.length).fill(null); // null = non répondu
  let idx = 0;

  stopExamMusic();
  _examStopMusic = playQuizMusic();

  function renderQ() {
    clearExamTimer(); // sans effet si pas de chrono
    const q = questions[idx];
    const num = idx + 1;
    let answered = false; // anti double-clic / anti course clic↔timeout

    // Pose d'accueil sur la 1re question, pensif ensuite
    const mascotState = mascot && idx === 0 ? "hello" : "think";
    root.querySelector("#exb-screen").innerHTML = `
      ${renderHeader({ num, total: questions.length, idx, answers })}
      ${renderQuestionBody(q, num, { mascot, mascotState })}`;

    root
      .querySelector("#exb-quit")
      ?.addEventListener("click", () => onQuit(num));

    if (chrono) {
      let remaining = OFFICIEL_SECONDS;
      _examTimer = setInterval(() => {
        remaining--;
        const t = root.querySelector("#exo-time");
        if (t) t.textContent = String(Math.max(remaining, 0));
        if (remaining <= 5)
          root.querySelector("#exo-chrono")?.classList.add("is-urgent");
        if (remaining <= 0) {
          clearExamTimer();
          reveal(null); // temps écoulé = faute
        }
      }, 1000);
    }

    root.querySelectorAll(".exb-choice").forEach((btn) => {
      btn.addEventListener("click", () =>
        reveal(parseInt(btn.dataset.idx, 10)),
      );
    });

    wireQuestionSpeech(root.querySelector("#exb-screen"), q.enonce);

    function reveal(chosen) {
      if (answered) return;
      answered = true;
      stopSpeaking();
      clearExamTimer();
      const timedOut = chosen === null;
      answers[idx] = timedOut ? -1 : chosen;
      const isCorrect = chosen === q.correct;
      recordAnswer(q.tags, isCorrect);
      if (isCorrect) {
        haptic("success");
        playCorrect();
      } else {
        haptic("warning");
        playWrong();
      }
      // Mascotte réactive : celebrate (bonne) / coach (mauvaise) — uniquement
      // quand la mascotte est activée (mode parcours, pas officiel / révision).
      if (mascot) {
        const mascotEl = root.querySelector(".exb-mascot");
        if (mascotEl) {
          mascotEl.src = isCorrect
            ? "/skins/mascot-celebrate.png"
            : "/skins/mascot-coach.png";
          mascotEl.classList.remove("exb-mascot--pop");
          void mascotEl.offsetWidth;
          mascotEl.classList.add("exb-mascot--pop");
        }
      }
      root.querySelectorAll(".exb-choice").forEach((b) => {
        const i = parseInt(b.dataset.idx, 10);
        b.disabled = true;
        b.setAttribute("aria-pressed", i === chosen ? "true" : "false");
        if (i === q.correct) b.classList.add("exb-choice--correct");
        if (i === chosen && !isCorrect) b.classList.add("exb-choice--wrong");
      });
      if (colorTrackNode) {
        const node = root.querySelector(`.exb-node[data-node="${idx}"]`);
        if (node) {
          node.classList.remove("is-current");
          node.classList.add(isCorrect ? "is-correct" : "is-wrong");
        }
      }
      const fb = root.querySelector("#exb-feedback");
      fb.hidden = false;
      fb.innerHTML = renderFeedbackBlock({
        isCorrect,
        correct: q.correct,
        explication: q.explication,
        isLast: idx + 1 >= questions.length,
        lastLabel: feedbackLast,
        faute: feedbackFaute && q.tags?.includes("faute_eliminatoire"),
        timedOut,
      });
      root.querySelector("#exb-next")?.addEventListener("click", () => {
        // Son de transition : whoosh discret en parcours (avec mascotte),
        // pageturn neutre sinon — évite la surcharge sonore sur 40 questions.
        if (mascot) playWhoosh();
        else playPageturn();
        if (idx + 1 < questions.length) {
          idx++;
          renderQ();
        } else {
          onComplete(answers);
        }
      });
    }
  }

  renderQ();
}

function startParcours(root, parcours_id) {
  const parcours = PARCOURS.find((p) => p.id === parcours_id);
  const questions = questionsForParcours(parcours_id).map(withShuffledOptions);
  track("parcours_quiz.started", { parcours_id, nom: parcours?.nom });

  runExbQuiz(root, questions, {
    mascot: true,
    colorTrackNode: true,
    feedbackFaute: true,
    feedbackLast: "Voir les résultats →",
    renderHeader: ({ num, total, idx, answers }) => `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="Quitter">×</button>
        <div class="exb-track-wrap">
          ${renderTrack(questions, answers, idx)}
          <span class="exb-progress-label">${num} / ${total}</span>
        </div>
        <span class="exb-quiz-parcours-name">${esc(parcours?.nom ?? "")}</span>
      </div>`,
    onQuit: (num) => {
      if (confirm("Quitter ce parcours ? Ta progression sera perdue.")) {
        haptic("tap");
        track("parcours_quiz.quit", { parcours_id, question: num });
        root.innerHTML = renderStyles() + renderSelection();
        wireSelection(root);
      }
    },
    onComplete: (answers) => showResults(root, questions, answers, parcours_id),
  });
}

// ─── Écran 3 : résultats ─────────────────────────────────────
function showResults(root, questions, answers, parcours_id) {
  stopExamMusic(); // coupe la mélodie de fond avant le jingle de résultat
  const parcours = PARCOURS.find((p) => p.id === parcours_id);
  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);

  const wrongItems = questions
    .map((q, i) => ({
      q,
      chosen: answers[i],
      isCorrect: answers[i] === q.correct,
    }))
    .filter((x) => !x.isCorrect);

  // Faute éliminatoire ratée → recalé direct, quel que soit le score (comme au vrai CEPC)
  const fauteRatee = wrongItems.some(({ q }) =>
    q.tags?.includes("faute_eliminatoire"),
  );
  const passed = score >= PASS_THRESHOLD && !fauteRatee;

  track("parcours_quiz.completed", {
    parcours_id,
    nom: parcours?.nom,
    score,
    total,
    passed,
    faute_eliminatoire: fauteRatee,
  });

  // Gain ligue théorique — le SELECT part AVANT l'insert ci-dessous pour
  // mesurer le score « avant ». En cas de course (insert déjà visible),
  // delta=0 → pas d'animation : fail-safe, jamais de faux +4.
  const gainPromise = passed
    ? computeTheoryGain({
        kind: "exam",
        refId: parcours_id,
        scorePct: pct,
        passed,
      })
    : Promise.resolve(null);

  // Persistance ligue théorique — fire-and-forget (RLS : élève insère les siens)
  const me = getCurUser();
  if (me?.id) {
    sb.from("quiz_attempts")
      .insert({
        user_id: me.id,
        competence_id: null,
        type: "exam_blanc",
        ref_id: String(parcours_id),
        score: pct,
        passed,
        questions_ids: [],
        answers_indices: answers.map((a) => a ?? -1),
      })
      .then(({ error }) => {
        if (error) console.error("[exam-blanc] persist attempt", error);
      })
      .catch((e) => console.error("[exam-blanc] persist attempt", e));
  }

  if (passed) playVictory();
  else playDefeat();

  const wrongHtml =
    wrongItems.length === 0
      ? `<p class="exb-perfect">Parfait ! Aucune erreur.</p>`
      : `
      <h2 class="exb-recap-title">Questions ratées</h2>
      <div class="exb-recap-list">
        ${wrongItems
          .map(
            ({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${esc(q.enonce)}</p>
            ${chosen !== null ? `<p class="exb-recap-wrong">Ta réponse : <strong>${esc(q.options[chosen])}</strong></p>` : ""}
            <p class="exb-recap-correct">Bonne réponse : <strong>${esc(q.options[q.correct])}</strong></p>
            <p class="exb-recap-explication">${esc(q.explication)}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

  root.querySelector("#exb-screen").innerHTML = `
    <div class="exb-results">
      ${renderTrophy(TROPHY_END, "exb-trophy--end")}
      <div class="exb-res-top ${passed ? "exb-res-top--pass" : "exb-res-top--fail"}">
        <div class="exb-res-ico">${
          passed
            ? medallion("trophee", "gold", { size: 60 })
            : fauteRatee
              ? medallion("faute", "red", { size: 60 })
              : medallion("cible", "orange", { size: 60 })
        }</div>
        <div class="exb-res-score">${score}<span class="exb-res-total"> / ${total}</span></div>
        <div class="exb-res-pct">${pct} %</div>
        <div class="exb-res-verdict">${
          fauteRatee
            ? "Recalé · faute éliminatoire"
            : passed
              ? "Admis · tu es dans les clous"
              : "Non admis · encore un peu d’entraînement"
        }</div>
        <div class="exb-res-cepc">${
          fauteRatee
            ? "Une faute éliminatoire, c’est l’échec direct à l’examen, quel que soit le reste du score."
            : passed
              ? "Avec ce score, tu décrocherais ton permis. Continue comme ça."
              : "Il te faut au moins 12/15, sans faute éliminatoire. Reviens t’entraîner."
        }</div>
      </div>

      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${passed ? "exb-res-bar-fill--pass" : ""}" style="width:${pct}%"></div>
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

  // Injecte le bloc « +4 pts Révision » sous le verdict quand le gain est réel
  gainPromise
    .then((gain) => {
      if (!gain) return;
      const host = root.querySelector(".exb-res-top");
      if (!host) return; // l'élève a déjà quitté l'écran
      const slot = document.createElement("div");
      host.appendChild(slot);
      renderTheoryGain(slot, gain);
    })
    .catch(() => {});

  root.querySelector("#exb-retry")?.addEventListener("click", () => {
    haptic("tap");
    track("parcours_quiz.retry", { parcours_id });
    startParcours(root, parcours_id);
  });

  root.querySelector("#exb-other")?.addEventListener("click", () => {
    haptic("tap");
    root.innerHTML = renderStyles() + renderSelection();
    wireSelection(root);
  });

  root.querySelector("#exb-home")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/");
  });
}

// ─── Mode « Examen officiel » : 40 questions chrono ──────────
function pickOfficielQuestions() {
  const pool = QUESTIONS.slice();
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, Math.min(OFFICIEL_TOTAL, pool.length))
    .map(withShuffledOptions);
}

function startExamenOfficiel(root) {
  const questions = pickOfficielQuestions();
  const startedAt = Date.now();
  track("examen_officiel.started", { total: questions.length });

  runExbQuiz(root, questions, {
    chrono: true,
    feedbackLast: "Voir le résultat →",
    renderHeader: ({ num, total }) => `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="Quitter">×</button>
        <div class="exo-run-bar">
          <span class="exo-chrono" id="exo-chrono"><span id="exo-time">${OFFICIEL_SECONDS}</span>s</span>
          <div class="exo-prog"><div class="exo-prog-fill" style="width:${(num / total) * 100}%"></div></div>
          <span class="exb-progress-label">${num} / ${total}</span>
        </div>
        <span class="exb-quiz-parcours-name">Examen officiel</span>
      </div>`,
    onQuit: (num) => {
      if (confirm("Quitter l’examen ? Ta progression sera perdue.")) {
        clearExamTimer();
        haptic("tap");
        track("examen_officiel.quit", { question: num });
        root.innerHTML = renderStyles() + renderSelection();
        wireSelection(root);
      }
    },
    onComplete: (answers) =>
      showOfficielResults(root, questions, answers, startedAt),
  });
}

function showOfficielResults(root, questions, answers, startedAt) {
  stopExamMusic();
  clearExamTimer();
  const total = questions.length;
  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const fautes = total - score;
  const pct = Math.round((score / total) * 100);
  const passed = fautes <= OFFICIEL_MAX_FAUTES;
  const durationSec = Math.round((Date.now() - startedAt) / 1000);

  track("examen_officiel.completed", {
    score,
    total,
    fautes,
    passed,
    duration: durationSec,
  });

  const me = getCurUser();
  if (me?.id) {
    sb.from("quiz_attempts")
      .insert({
        user_id: me.id,
        competence_id: null,
        type: "exam_officiel",
        ref_id: "officiel",
        score: pct,
        passed,
        duration_seconds: durationSec,
        // [] et non les IDs : la colonne est uuid[], or les questions exam-blanc
        // ont des IDs texte locaux (ex "p4q11") → l'insert 400ait (l'historique
        // officiel n'était jamais persisté). Aligné sur le parcours (showResults).
        questions_ids: [],
        answers_indices: answers.map((a) => a ?? -1),
      })
      .then(({ error }) => {
        if (error) console.error("[exam-officiel] persist attempt", error);
      })
      .catch((e) => console.error("[exam-officiel] persist attempt", e));
  }

  if (passed) playVictory();
  else playDefeat();

  const wrongItems = questions
    .map((q, i) => ({ q, chosen: answers[i] }))
    .filter((x) => x.chosen !== x.q.correct);

  const wrongHtml =
    wrongItems.length === 0
      ? `<p class="exb-perfect">Sans faute. Impressionnant.</p>`
      : `
      <h2 class="exb-recap-title">À revoir (${wrongItems.length})</h2>
      <div class="exb-recap-list">
        ${wrongItems
          .map(
            ({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${esc(q.enonce)}</p>
            ${
              chosen != null && chosen >= 0
                ? `<p class="exb-recap-wrong">Ta réponse : <strong>${esc(q.options[chosen])}</strong></p>`
                : `<p class="exb-recap-wrong">Pas de réponse · temps écoulé</p>`
            }
            <p class="exb-recap-correct">Bonne réponse : <strong>${esc(q.options[q.correct])}</strong></p>
            <p class="exb-recap-explication">${esc(q.explication)}</p>
          </div>`,
          )
          .join("")}
      </div>`;

  root.querySelector("#exb-screen").innerHTML = `
    <div class="exb-results">
      <div class="exb-res-top ${passed ? "exb-res-top--pass" : "exb-res-top--fail"}">
        <div class="exb-res-ico">${
          passed
            ? medallion("trophee", "gold", { size: 60 })
            : medallion("faute", "red", { size: 60 })
        }</div>
        <div class="exb-res-score">${score}<span class="exb-res-total"> / ${total}</span></div>
        <div class="exb-res-pct">${fautes} faute${fautes > 1 ? "s" : ""} · ${pct} %</div>
        <div class="exb-res-verdict">${passed ? "Admis · bien joué" : "Recalé · plus de 5 fautes"}</div>
        <div class="exb-res-cepc">${
          passed
            ? "Au vrai examen, il faut 35/40. Tu y es. Continue comme ça."
            : "Il te faut au moins 35/40, soit 5 fautes maximum. Reviens t’entraîner."
        }</div>
      </div>
      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${passed ? "exb-res-bar-fill--pass" : ""}" style="width:${pct}%"></div>
        </div>
        ${wrongHtml}
      </div>
      <div class="exb-res-actions">
        <button class="exb-start-btn" id="exo-retry">Refaire un examen officiel</button>
        <button class="exb-retry-btn" id="exb-other">Choisir un entraînement</button>
        <button class="exb-quit-btn-text" id="exb-home">← Accueil</button>
      </div>
    </div>`;

  root.querySelector("#exo-retry")?.addEventListener("click", () => {
    haptic("tap");
    startExamenOfficiel(root);
  });
  root.querySelector("#exb-other")?.addEventListener("click", () => {
    haptic("tap");
    root.innerHTML = renderStyles() + renderSelection();
    wireSelection(root);
  });
  root.querySelector("#exb-home")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/");
  });
}

// ─── Révision générique (coeur réutilisable) ──────────────────
// questions : tableau déjà mélangé + slicé
// opts.label       : affiché dans le header du quiz + le bilan
// opts.trackName   : nom de l'event analytics ("revision_theme" | "revision_centre")
// opts.trackMeta   : objet fusionné dans les events analytics
// opts.retryFn     : callback appelé par le bouton « Refaire »
function runRevision(
  root,
  questions,
  { label, trackName, trackMeta, retryFn, backRoute = null },
) {
  track(`${trackName}.started`, { ...trackMeta, total: questions.length });

  runExbQuiz(root, questions, {
    feedbackLast: "Voir le bilan →",
    renderHeader: ({ num, total }) => `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="Quitter">×</button>
        <div class="exo-run-bar">
          <div class="exo-prog"><div class="exo-prog-fill" style="width:${(num / total) * 100}%"></div></div>
          <span class="exb-progress-label">${num} / ${total}</span>
        </div>
        <span class="exb-quiz-parcours-name">Révision · ${esc(label)}</span>
      </div>`,
    onQuit: (num) => {
      haptic("tap");
      stopExamMusic();
      track(`${trackName}.quit`, { ...trackMeta, question: num });
      if (backRoute) {
        navigate(backRoute);
      } else {
        root.innerHTML = renderStyles() + renderSelection();
        wireSelection(root);
      }
    },
    onComplete: (answers) =>
      showRevisionResults(root, questions, answers, label, {
        trackName,
        trackMeta,
        retryFn,
        backRoute,
      }),
  });
}

// ─── Révision ciblée d'un thème (points faibles) ─────────────
function startThemeRevision(root, tag, label) {
  const pool = QUESTIONS.filter((q) => (q.tags || []).includes(tag));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const questions = pool
    .slice(0, Math.min(12, pool.length))
    .map(withShuffledOptions);
  if (!questions.length) {
    toast("Pas encore de questions sur ce thème", "info");
    return;
  }
  runRevision(root, questions, {
    label,
    trackName: "revision_theme",
    trackMeta: { tag },
    retryFn: () => startThemeRevision(root, tag, label),
  });
}

// ─── Révision multi-tags par centre d'examen ─────────────────
function startCentreRevision(root, slug) {
  const c = getCentre(slug);
  if (!c) {
    toast("Centre inconnu", "info");
    return;
  }
  const tags = c.quizTags || [];
  const pool = QUESTIONS.filter((q) =>
    (q.tags || []).some((t) => tags.includes(t)),
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const questions = pool
    .slice(0, Math.min(15, pool.length))
    .map(withShuffledOptions);
  if (!questions.length) {
    toast("Pas encore de questions pour ce centre", "info");
    return;
  }
  const label = `Pièges de ${c.nom}`;
  runRevision(root, questions, {
    label,
    trackName: "revision_centre",
    trackMeta: { centre: slug },
    retryFn: () => startCentreRevision(root, slug),
    backRoute: `/centre-examen/${slug}`,
  });
}

function showRevisionResults(
  root,
  questions,
  answers,
  label,
  { trackName, trackMeta, retryFn, backRoute = null },
) {
  stopExamMusic();
  const total = questions.length;
  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const pct = Math.round((score / total) * 100);
  const perfect = score === total;

  track(`${trackName}.completed`, { ...trackMeta, score, total });
  if (perfect) playVictory();
  else playDefeat();

  const wrongItems = questions
    .map((q, i) => ({ q, chosen: answers[i] }))
    .filter((x) => x.chosen !== x.q.correct);

  const wrongHtml = perfect
    ? `<p class="exb-perfect">Sans faute sur ce thème. Tu le maîtrises.</p>`
    : `
      <h2 class="exb-recap-title">À revoir (${wrongItems.length})</h2>
      <div class="exb-recap-list">
        ${wrongItems
          .map(
            ({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${esc(q.enonce)}</p>
            ${chosen != null ? `<p class="exb-recap-wrong">Ta réponse : <strong>${esc(q.options[chosen])}</strong></p>` : ""}
            <p class="exb-recap-correct">Bonne réponse : <strong>${esc(q.options[q.correct])}</strong></p>
            <p class="exb-recap-explication">${esc(q.explication)}</p>
          </div>`,
          )
          .join("")}
      </div>`;

  root.querySelector("#exb-screen").innerHTML = `
    <div class="exb-results">
      <div class="exb-res-top ${perfect ? "exb-res-top--pass" : "exb-res-top--fail"}">
        <div class="exb-res-ico">${
          perfect
            ? medallion("trophee", "gold", { size: 60 })
            : medallion("cible", "orange", { size: 60 })
        }</div>
        <div class="exb-res-score">${score}<span class="exb-res-total"> / ${total}</span></div>
        <div class="exb-res-pct">${esc(label)} · ${pct} %</div>
        <div class="exb-res-verdict">Révision terminée</div>
        <div class="exb-res-cepc">Refais cette série jusqu’à la maîtriser, puis tente l’examen officiel.</div>
      </div>
      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${perfect ? "exb-res-bar-fill--pass" : ""}" style="width:${pct}%"></div>
        </div>
        ${wrongHtml}
      </div>
      <div class="exb-res-actions">
        <button class="exb-start-btn" id="exo-revretry">Refaire</button>
        <button class="exb-retry-btn" id="exb-other">Retour</button>
        <button class="exb-quit-btn-text" id="exb-home">← Accueil</button>
      </div>
    </div>`;

  root.querySelector("#exo-revretry")?.addEventListener("click", () => {
    haptic("tap");
    if (retryFn) retryFn();
  });
  root.querySelector("#exb-other")?.addEventListener("click", () => {
    haptic("tap");
    if (backRoute) {
      navigate(backRoute);
    } else {
      root.innerHTML = renderStyles() + renderSelection();
      wireSelection(root);
    }
  });
  root.querySelector("#exb-home")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/");
  });
}

// ─── Styles ──────────────────────────────────────────────────
const EXB_STYLE_ID = "exb-styles";
const EXB_CSS = `
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
.exb-pcard:hover { border-color: var(--a); box-shadow: 0 4px 20px color-mix(in srgb, var(--a) 12%, transparent); }
.exb-pcard-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.exb-pcard-num {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--a-txt);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.exb-pcard-stars {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.exb-pcard-stars-svg { display: inline-flex; align-items: center; gap: 2px; }
.exb-star { display: block; }
.exb-star path { fill: var(--bo); }
.exb-star.is-on path {
  fill: #ffd24a;
  filter: drop-shadow(0 1px 1.5px rgba(240,138,18,.45));
}
/* étoiles nues = ambigu (note ? difficulté ?) → étiquette visible */
.exb-pcard-stars-lbl {
  font: 600 10px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .06em;
  text-transform: uppercase;
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
.exb-mascot {
  display: block; width: 56px; height: 56px; object-fit: contain;
  margin: 0 0 8px; filter: drop-shadow(0 5px 12px rgba(10,13,26,.16));
  animation: exbMascotIn .4s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes exbMascotIn { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: scale(1) } }
/* Micro-pop sur changement d'état (celebrate / coach) */
.exb-mascot--pop { animation: exbMascotPop .38s cubic-bezier(.34,1.56,.64,1) both }
@keyframes exbMascotPop {
  0%  { transform: scale(1) translateY(0) }
  30% { transform: scale(1.22) translateY(-6px) }
  70% { transform: scale(.96) translateY(1px) }
  100%{ transform: scale(1) translateY(0) }
}
@media (prefers-reduced-motion: reduce) { .exb-mascot, .exb-mascot--pop { animation: none !important } }
.exb-qnum {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--a-txt);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin: 0 0 10px;
}
.exb-qhead { display: flex; align-items: flex-start; gap: 12px; margin: 0 0 20px; }
.exb-qhead .exb-qtext { margin: 0; flex: 1 1 auto; }
.exb-qhead .qz-mute:active { transform: scale(.92); }
.exb-qtext {
  font: 600 17px/1.5 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0 0 20px;
  letter-spacing: -.015em;
}
/* Image de question (ex. panneau routier à identifier) — carte blanche pour
   que le panneau reste lisible quel que soit le thème. */
.exb-qimg {
  display: block;
  width: clamp(124px, 40vw, 168px);
  height: clamp(124px, 40vw, 168px);
  object-fit: contain;
  margin: 0 auto 20px;
  padding: 14px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 20px rgba(0,0,0,.14);
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
  background: color-mix(in srgb, var(--a) 10%, transparent);
  color: var(--a-txt);
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
  font: 700 13px/1.5 'Inter', sans-serif;
  color: var(--rd-txt);
  display: flex;
  align-items: center;
  gap: 10px;
}
.exb-faute-banner .pg-med { flex-shrink: 0; }
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
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  border: none;
  border-radius: 14px;
  color: var(--a-ink);
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
.exb-res-ico {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.exb-res-ico .pg-med {
  filter: drop-shadow(0 8px 18px rgba(10,13,26,.22));
  animation: exbResIcoPop .5s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes exbResIcoPop {
  from { opacity: 0; transform: scale(.5); }
  to   { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) { .exb-res-ico .pg-med { animation: none !important; } }
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
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
  border: none;
  border-radius: 14px;
  color: var(--a-ink);
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
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 25%, transparent); }
  50%      { box-shadow: 0 0 0 6px color-mix(in srgb, var(--a) 10%, transparent); }
}

/* ── Trophées décoratifs ── */
.exb-trophy { display: flex; flex-direction: column; align-items: center; }
.exb-trophy--start { margin: 8px auto 12px; }
.exb-trophy--end   { margin: 8px auto 0; }
.exb-trophy-img, .exb-trophy-emoji {
  width: 64px; height: 64px; object-fit: contain;
  filter: drop-shadow(0 6px 14px color-mix(in srgb, var(--a) 35%, transparent));
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

/* ── Hero « Examen officiel » ── */
.exb-sel-sub2 {
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  letter-spacing: .06em;
  text-transform: uppercase;
  margin: 22px 16px 10px;
}

/* ── Section « Tes points faibles » ── */
.exb-weak {
  margin: 16px 16px 0;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 18px;
  padding: 14px 14px 8px;
}
.exb-weak-title {
  font: 800 13px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin: 0 0 10px;
  letter-spacing: -.01em;
  display: flex;
  align-items: center;
  gap: 7px;
}
.exb-weak-title .pg-med { flex-shrink: 0; }
.exb-weak-list { display: flex; flex-direction: column; gap: 8px; }
.exb-weak-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; text-align: left;
  padding: 12px 14px;
  background: var(--bg);
  border: 1.5px solid var(--bo);
  border-left: 3px solid var(--am, #f59e0b);
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: border-color .12s, transform .1s;
}
.exb-weak-btn:active { transform: scale(.98); }
.exb-weak-btn:hover { border-color: var(--a); }
.exb-weak-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.exb-weak-nom { font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.exb-weak-stat { font: 500 12px/1.2 'Inter', sans-serif; color: var(--mu); }
.exb-weak-cta { flex-shrink: 0; font: 800 12px/1 'Plus Jakarta Sans', sans-serif; color: var(--a-txt); }

.exo-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: calc(100% - 32px);
  margin: 0 16px;
  padding: 18px 18px 16px;
  text-align: left;
  border: 0;
  border-radius: 20px;
  cursor: pointer;
  color: var(--a-ink);
  background: linear-gradient(145deg, var(--a-lt) 0%, var(--a) 50%, var(--adk) 100%);
  box-shadow: 0 14px 36px -12px color-mix(in srgb, var(--a) 65%, transparent),
    0 1.5px 0 rgba(255,255,255,.28) inset;
  transition: transform .12s, box-shadow .12s;
  position: relative;
  overflow: hidden;
}
.exo-hero::after {
  content: '';
  position: absolute; right: -30px; top: -30px;
  width: 130px; height: 130px; border-radius: 50%;
  background: rgba(255,255,255,.12);
}
.exo-hero:active { transform: scale(.99); }
.exo-hero:hover { box-shadow: 0 18px 44px -12px color-mix(in srgb, var(--a) 80%, transparent); }
.exo-hero-kicker {
  font: 800 10.5px/1 'Inter', sans-serif;
  letter-spacing: .12em; text-transform: uppercase;
  opacity: .85;
}
.exo-hero-title {
  font: 800 18px/1.2 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -.02em;
}
.exo-hero-sub {
  font: 500 13px/1.45 'Inter', sans-serif;
  opacity: .9;
}
.exo-hero-cta {
  margin-top: 10px;
  font: 800 13px/1 'Plus Jakarta Sans', sans-serif;
  padding: 9px 16px;
  border-radius: 99px;
  background: rgba(255,255,255,.18);
  box-shadow: 0 0 0 1px rgba(255,255,255,.25) inset;
}
/* Verrou premium (grisé) */
.exo-hero.is-locked {
  background: linear-gradient(145deg, var(--bo) 0%, var(--mu2) 120%);
  color: var(--ink);
  box-shadow: 0 8px 24px -14px rgba(0,0,0,.4);
  filter: grayscale(.4);
}
.exo-hero.is-locked .exo-hero-kicker,
.exo-hero.is-locked .exo-hero-sub { opacity: .75; }
.exo-hero-lock {
  position: absolute; top: 12px; right: 12px;
  font: 800 11px/1 'Plus Jakarta Sans', sans-serif;
  background: rgba(0,0,0,.18); color: #fff;
  padding: 5px 10px 5px 6px; border-radius: 99px;
  display: inline-flex; align-items: center; gap: 5px;
}
.exo-hero-lock .pg-med { flex-shrink: 0; }

/* ── Barre chrono du mode officiel ── */
.exo-run-bar { display: flex; align-items: center; gap: 10px; }
.exo-chrono {
  font: 800 13px/1 'IBM Plex Mono', monospace;
  color: var(--ink);
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 10px;
  padding: 6px 9px;
  min-width: 44px; text-align: center;
  transition: color .2s, border-color .2s, background .2s;
}
.exo-chrono.is-urgent {
  color: #fff; background: var(--rd); border-color: var(--rd);
  animation: exoPulse 1s ease-in-out infinite;
}
@keyframes exoPulse { 0%,100%{ transform: scale(1) } 50%{ transform: scale(1.08) } }
.exo-prog {
  flex: 1; height: 6px; background: var(--bo);
  border-radius: 3px; overflow: hidden;
}
.exo-prog-fill {
  height: 100%; background: var(--a); border-radius: 3px;
  transition: width .3s cubic-bezier(.23,1,.32,1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`;

// Monte le CSS une seule fois dans <head> (id-guard) au lieu de le réinjecter
// à chaque root.innerHTML (9 sites d'appel). Renvoie "" pour rester compatible
// avec les appels `root.innerHTML = renderStyles() + X`.
function renderStyles() {
  if (
    typeof document !== "undefined" &&
    !document.getElementById(EXB_STYLE_ID)
  ) {
    const el = document.createElement("style");
    el.id = EXB_STYLE_ID;
    el.textContent = EXB_CSS;
    document.head.appendChild(el);
  }
  return "";
}
