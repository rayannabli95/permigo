// ═══════════════════════════════════════════════════════════════
// Élève — Ton parcours d'examen (5 parcours × 15 questions)
// 100 % statique — pas de Supabase
// Seuil : 12/15 (80 %) — verdict CEPC
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getMyChests } from "@/utils/game-state.js";
import {
  recordAnswer,
  getWeakPoints,
  TAG_LABELS,
} from "@/utils/weak-points.js";
import { PARCOURS } from "@/data/parcours-quiz-meta.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import {
  quizVisualHTML,
  QUIZ_VISUAL_CSS,
} from "@/components/eleve/quiz-visuals.js";
import { swapVisualToReveal } from "@/components/eleve/quiz-ui.js";
import { hideBottomNav } from "@/utils/nav.js";
import { chromeNight } from "@/utils/chrome-night.js";
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
  playWhoosh,
} from "@/utils/sound.js";

let quizData = null;
let quizDataPromise = null;
let examI18n = null;
let examI18nPromise = null;

async function ensureQuizData() {
  if (quizData) return quizData;
  if (!quizDataPromise)
    quizDataPromise = import("@/data/parcours-quiz.js").then((module) => {
      quizData = module;
      return module;
    });
  return quizDataPromise;
}

async function ensureExamI18n() {
  if (getLang() === "fr" || examI18n) return examI18n;
  if (!examI18nPromise)
    examI18nPromise = import("@/data/parcours-quiz-i18n.js").then((module) => {
      examI18n = module;
      return module;
    });
  return examI18nPromise;
}

function examTr(id, lang) {
  return examI18n?.examTr(id, lang) || null;
}

function examUi(key, fr) {
  return examI18n?.examUi(key, fr) ?? fr;
}

async function getCentre(slug) {
  const { getCentre: findCentre } = await import("@/data/centres-examen.js");
  return findCentre(slug);
}

// ── i18n de la COQUE (élève non-francophone) — ÉCRAN DE SÉLECTION seulement.
// Les QUESTIONS (énoncés/options/explications) restent gérées par examBi/
// examTr/examUi (data/parcours-quiz-i18n.js) — on n'y touche pas ici. Dict
// local (règle coque), repli FR si clé absente. Le confirm() natif de sortie
// de parcours/examen est aussi traduit (cf. RULES de la tâche).
const EXBS_I18N = {
  en: {
    back_aria: "Back",
    fb_results: "See results →",
    fb_result: "See result →",
    fb_bilan: "See summary →",
    trophy_start: "First spark",
    trophy_end: "A month without a miss",
    title: "Your exam journey",
    subtitle: "The real exam experience or practise by topic.",
    officiel_kicker: "Official exam",
    officiel_title: "40 questions · timed · just like the real thing",
    officiel_sub_unlocked: "Pass with 5 mistakes maximum.",
    officiel_cta: "Start →",
    officiel_aria_locked: "Official exam locked",
    officiel_aria_unlocked: "Start the official exam",
    lock_badge_premium: "PermiGo+",
    lock_badge_comp1: "Skill 1",
    lock_sub_premium: "Unlock the real mock exam with PermiGo+.",
    lock_sub_comp1: "Validate skill 1 to unlock the real mock exam.",
    weak_title: "Your weak points",
    weak_stat: "{left} to review · {pct}% missed",
    weak_cta: "Review →",
    theme_sub2: "Practise by topic · {n} journeys of 15 questions",
    pcard_num: "Journey {n}",
    pcard_stars_lbl: "Difficulty",
    pcard_stars_aria: "Difficulty {n}/5",
    pcard_aria_start: "Start the journey",
    pcard_meta: "15 questions · pass from 12/15",
    toast_premium: "Coming soon: the official exam with PermiGo+",
    toast_locked: "Validate skill 1 to unlock the mock exam 🔒",
    confirm_quit_parcours: "Quit this journey? Your progress will be lost.",
    confirm_quit_officiel: "Quit the exam? Your progress will be lost.",
    answers_aria: "Answers",
    road_sign_alt: "Road sign to identify",
    quit_aria: "Quit",
    official_exam: "Official exam",
    perfect: "Perfect! No mistakes.",
    wrong_questions: "Questions missed",
    your_answer: "Your answer:",
    correct_answer: "Correct answer:",
    verdict_eliminatory: "Failed · eliminatory fault",
    verdict_pass: "Passed · you're on target",
    verdict_fail: "Not passed · a little more practice",
    cepc_eliminatory:
      "An eliminatory fault means an immediate fail in the exam, whatever the rest of your score.",
    cepc_pass: "With this score, you would get your licence. Keep it up.",
    cepc_fail:
      "You need at least 12/15 with no eliminatory fault. Come back and practise.",
    retry_journey: "Retry this journey",
    choose_journey: "Choose another journey",
    home: "← Home",
    official_perfect: "No mistakes. Impressive.",
    to_review: "To review ({count})",
    no_answer: "No answer · time ran out",
    mistakes: "{count} mistake(s) · {pct}%",
    official_verdict_pass: "Passed · well done",
    official_verdict_fail: "Failed · more than 5 mistakes",
    official_cepc_pass:
      "The real exam requires 35/40. You made it. Keep it up.",
    official_cepc_fail:
      "You need at least 35/40, which means 5 mistakes maximum. Come back and practise.",
    retry_official: "Retry an official exam",
    choose_training: "Choose practice",
    review_header: "Review · {label}",
    no_theme_questions: "No questions on this topic yet",
    unknown_centre: "Unknown centre",
    no_centre_questions: "No questions for this centre yet",
    centre_traps: "Tricky questions from {name}",
    theme_perfect: "No mistakes on this topic. You've mastered it.",
    revision_done: "Review complete",
    revision_help:
      "Repeat this set until you've mastered it, then try the official exam.",
    retry: "Retry",
    back: "Back",
  },
  ar: {
    back_aria: "رجوع",
    fb_results: "عرض النتائج →",
    fb_result: "عرض النتيجة →",
    fb_bilan: "عرض الحصيلة →",
    trophy_start: "الشرارة الأولى",
    trophy_end: "شهر دون خطأ",
    title: "مسارك للامتحان",
    subtitle: "الامتحان كالحقيقي أو تدرّب حسب الموضوع.",
    officiel_kicker: "الامتحان الرسمي",
    officiel_title: "40 سؤالاً · بوقت محدد · كالامتحان الحقيقي",
    officiel_sub_unlocked: "النجاح بـ 5 أخطاء كحد أقصى.",
    officiel_cta: "ابدأ ←",
    officiel_aria_locked: "الامتحان الرسمي مقفل",
    officiel_aria_unlocked: "ابدأ الامتحان الرسمي",
    lock_badge_premium: "PermiGo+",
    lock_badge_comp1: "المهارة 1",
    lock_sub_premium: "افتح الامتحان التجريبي الحقيقي مع PermiGo+.",
    lock_sub_comp1: "اعتمد المهارة 1 لفتح الامتحان التجريبي الحقيقي.",
    weak_title: "نقاط ضعفك",
    weak_stat: "{left} للمراجعة · {pct}% إجابات خاطئة",
    weak_cta: "راجع ←",
    theme_sub2: "تدرّب حسب الموضوع · {n} مسارًا من 15 سؤالاً",
    pcard_num: "المسار {n}",
    pcard_stars_lbl: "الصعوبة",
    pcard_stars_aria: "الصعوبة {n}/5",
    pcard_aria_start: "ابدأ مسار",
    pcard_meta: "15 سؤالاً · النجاح من 12/15",
    toast_premium: "قريبًا: الامتحان الرسمي مع PermiGo+",
    toast_locked: "اعتمد المهارة 1 لفتح الامتحان التجريبي 🔒",
    confirm_quit_parcours: "الخروج من هذا المسار؟ ستفقد تقدّمك.",
    confirm_quit_officiel: "الخروج من الامتحان؟ ستفقد تقدّمك.",
    answers_aria: "الإجابات",
    road_sign_alt: "لافتة طريق للتعرّف عليها",
    quit_aria: "خروج",
    official_exam: "الامتحان الرسمي",
    perfect: "ممتاز! بلا أخطاء.",
    wrong_questions: "الأسئلة الخاطئة",
    your_answer: "إجابتك:",
    correct_answer: "الإجابة الصحيحة:",
    verdict_eliminatory: "راسب · خطأ إقصائي",
    verdict_pass: "ناجح · أنت ضمن المطلوب",
    verdict_fail: "غير ناجح · تحتاج إلى مزيد من التدريب",
    cepc_eliminatory:
      "الخطأ الإقصائي يعني الرسوب المباشر في الامتحان مهما كانت بقية النتيجة.",
    cepc_pass: "بهذه النتيجة كنت ستحصل على رخصتك. واصل هكذا.",
    cepc_fail: "تحتاج إلى 12/15 على الأقل من دون خطأ إقصائي. عد للتدريب.",
    retry_journey: "إعادة هذا المسار",
    choose_journey: "اختيار مسار آخر",
    home: "← الرئيسية",
    official_perfect: "بلا أخطاء. رائع.",
    to_review: "للمراجعة ({count})",
    no_answer: "لا إجابة · انتهى الوقت",
    mistakes: "{count} خطأ · {pct}%",
    official_verdict_pass: "ناجح · أحسنت",
    official_verdict_fail: "راسب · أكثر من 5 أخطاء",
    official_cepc_pass: "يتطلب الامتحان الحقيقي 35/40. لقد نجحت. واصل هكذا.",
    official_cepc_fail:
      "تحتاج إلى 35/40 على الأقل، أي 5 أخطاء كحد أقصى. عد للتدريب.",
    retry_official: "إعادة امتحان رسمي",
    choose_training: "اختيار تدريب",
    review_header: "مراجعة · {label}",
    no_theme_questions: "لا توجد أسئلة عن هذا الموضوع بعد",
    unknown_centre: "مركز غير معروف",
    no_centre_questions: "لا توجد أسئلة لهذا المركز بعد",
    centre_traps: "أسئلة {name} الصعبة",
    theme_perfect: "بلا أخطاء في هذا الموضوع. لقد أتقنته.",
    revision_done: "انتهت المراجعة",
    revision_help: "أعد هذه السلسلة حتى تتقنها ثم جرّب الامتحان الرسمي.",
    retry: "إعادة",
    back: "رجوع",
  },
};
function exsT(key, fr, vars) {
  const l = getLang();
  let value = (l !== "fr" && EXBS_I18N[l]?.[key]) || fr;
  if (vars)
    for (const [name, replacement] of Object.entries(vars))
      value = value.split(`{${name}}`).join(String(replacement));
  return value;
}
// RTL par ATTRIBUT sur le bloc de texte (jamais <html dir> — règle lang.js).
function exsRtl() {
  return getLang() === "ar" ? ' dir="rtl" lang="ar"' : "";
}

// Titres/descriptions des 12 parcours (coque de l'écran de sélection). Les
// contextes gardent le vocabulaire FR pour les termes métier (giratoires,
// créneau…) entre parenthèses à la 1re occurrence — cf. règle de la tâche.
// Clé = id du parcours (PARCOURS[i].id, data/parcours-quiz.js).
const PARCOURS_I18N = {
  en: {
    1: {
      nom: "Cergy. Roundabouts",
      contexte:
        "Leaving Cergy-Saint-Christophe station, heavy traffic, many roundabouts (giratoires) and 30 km/h zones.",
    },
    2: {
      nom: "Paris. Heavy traffic",
      contexte:
        "Crossing central Paris, 50 km/h boulevards, cycle boxes (sas vélos), lots of pedestrians.",
    },
    3: {
      nom: "Beauce countryside",
      contexte:
        "Country roads with no road markings, unmarked intersections, farm tractors.",
    },
    4: {
      nom: "Lyon. 30 zone",
      contexte:
        "Residential area in Lyon, 30 km/h zone (zone 30), tramway, lots of cyclists and pedestrians.",
    },
    5: {
      nom: "Expressway / A86",
      contexte:
        "Merging onto the A86, high-speed driving, overtaking lanes, hard shoulder (bande d'arrêt d'urgence).",
    },
    6: {
      nom: "Essential revision",
      contexte:
        "The basics that come up in every exam: alcohol, speed, equipment, first aid, road signs.",
    },
    7: {
      nom: "Night & bad weather",
      contexte:
        "Night driving, rain, fog, snow and ice: see and be seen, adjust your speed.",
    },
    8: {
      nom: "Signs & road markings",
      contexte:
        "Read fast and right: prohibition, danger, obligation, road markings and traffic lights.",
    },
    9: {
      nom: "Mountain & winding roads",
      contexte:
        "Downhill sections, hairpin bends, engine braking, mountain priority rules and slippery roads.",
    },
    10: {
      nom: "Sharing the road",
      contexte:
        "Bicycles, two-wheelers, vulnerable pedestrians, buses, trucks and blind spots.",
    },
    11: {
      nom: "Parking & manoeuvres",
      contexte:
        "Stopping or parking? Parallel parking (créneau), U-turns, no-parking zones and road markings.",
    },
    12: {
      nom: "Signs & road markings",
      contexte:
        "Recognise the signs that come up in the exam: stop, priority, prohibition and danger signs. One picture, one right answer.",
    },
  },
  ar: {
    1: {
      nom: "سيرجي. الدوارات",
      contexte:
        "الخروج من محطة سيرجي-سان-كريستوف، حركة مرور كثيفة، دوّارات (giratoires) عديدة ومناطق سرعة 30.",
    },
    2: {
      nom: "باريس. حركة كثيفة",
      contexte:
        "عبور وسط باريس، شوارع بسرعة 50 كم/سا، مربعات انتظار الدراجات (sas vélos)، مشاة بكثرة.",
    },
    3: {
      nom: "ريف بوس",
      contexte:
        "طرق ريفية بلا علامات أرضية، تقاطعات غير مؤشَّرة، جرارات زراعية.",
    },
    4: {
      nom: "ليون. منطقة 30",
      contexte:
        "حي سكني في ليون، منطقة سرعة 30 (zone 30)، ترام، دراجات ومشاة بكثرة.",
    },
    5: {
      nom: "طريق سريع / A86",
      contexte:
        "الاندماج في طريق A86 السريع، قيادة بسرعة عالية، حارات التجاوز، حارة الطوارئ (bande d'arrêt d'urgence).",
    },
    6: {
      nom: "مراجعة أساسية",
      contexte:
        "الأساسيات التي تتكرر في كل امتحان: الكحول، السرعة، التجهيزات، الإسعافات، الإشارات.",
    },
    7: {
      nom: "الليل والطقس الصعب",
      contexte:
        "القيادة ليلاً، تحت المطر، الضباب، الثلج والجليد: أن ترى وتُرى، وتكيّف سرعتك.",
    },
    8: {
      nom: "اللافتات والإشارات",
      contexte:
        "اقرأ بسرعة ودقة: المنع، الخطر، الإلزام، العلامات الأرضية والإشارات الضوئية.",
    },
    9: {
      nom: "الجبل والطرق المتعرجة",
      contexte:
        "المنحدرات، المنعطفات الحادة، الكبح بالمحرك، قواعد الأولوية في الجبل والطرق الزلقة.",
    },
    10: {
      nom: "مشاركة الطريق",
      contexte:
        "الدراجات، المركبات ذات العجلتين، المشاة الضعفاء، الحافلات، الشاحنات والزوايا العمياء.",
    },
    11: {
      nom: "التوقف والمناورات",
      contexte:
        "وقوف أم توقف؟ ركن السيارة (créneau)، الاستدارة الكاملة، أماكن ممنوعة والعلامات الأرضية.",
    },
    12: {
      nom: "اللافتات والإشارات",
      contexte:
        "تعرّف على اللافتات التي تتكرر في الامتحان: قف، الأولوية، المنع والخطر. صورة واحدة، إجابة صحيحة واحدة.",
    },
  },
};
function parcoursNom(p) {
  const l = getLang();
  return (l !== "fr" && PARCOURS_I18N[l]?.[p.id]?.nom) || p.nom;
}
function parcoursContexte(p) {
  const l = getLang();
  return (l !== "fr" && PARCOURS_I18N[l]?.[p.id]?.contexte) || p.contexte;
}

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

// Démontage (appelé par le router avant de monter la page suivante) : coupe le
// chrono 1 s si l'élève quitte la page en plein examen — sinon le setInterval
// continue de tourner en fond sur un DOM déjà retiré.
export function unmount() {
  clearExamTimer();
}

// Mélange les réponses d'une question (Fisher-Yates) et remappe l'index de la
// bonne réponse vers sa nouvelle position. Sans ça, `correct` reste fixe dans
// les données → la bonne réponse tombe toujours à la même place (souvent la 1re).
// On clone la question : les données sources (QUESTIONS) restent intactes, et le
// même objet mélangé sert au rendu ET au score (cohérence garantie).
// i18n : traduction affichée, français gardé dessous (arabe RTL par span, l'app
// reste LTR). Sans traduction (fr ou question absente) → rendu FR d'origine.
function examBi(fr, tr) {
  const lang = getLang();
  if (lang === "fr" || tr == null || tr === "") return esc(fr);
  const rtl = lang === "ar" ? ' dir="rtl" lang="ar"' : "";
  return (
    `<span class="exb-tr"${rtl}>${esc(tr)}</span>` +
    `<span class="exb-fr" lang="fr" dir="ltr">${esc(fr)}</span>`
  );
}

function withShuffledOptions(q) {
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  // Traduction de la langue courante, permutée avec le MÊME idx que le FR
  // (options mélangées → la trad suit le mélange). Attachée ici = tous les
  // modes (parcours / officiel / révision) en profitent d'un coup.
  const lang = getLang();
  const t = lang !== "fr" ? examTr(q.id, lang) : null;
  const tOk =
    t && Array.isArray(t.options) && t.options.length === q.options.length;
  return {
    ...q,
    options: idx.map((i) => q.options[i]),
    correct: idx.indexOf(q.correct),
    tr: tOk
      ? {
          enonce: t.enonce,
          explication: t.explication,
          options: idx.map((i) => t.options[i]),
        }
      : undefined,
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
  nomKey: "trophy_start",
};
const TROPHY_END = {
  img: "/skins/trophy-streak-30d.webp",
  ico: "gem",
  nom: "Mois sans rater",
  nomKey: "trophy_end",
};

function renderTrophy(t, variant) {
  return `
    <div class="exb-trophy ${variant}">
      <img class="exb-trophy-img" src="${escAttr(t.img)}" alt="${escAttr(exsT(t.nomKey, t.nom))}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="exb-trophy-emoji" style="display:none">${icon(t.ico, { size: 28 })}</span>
      <span class="exb-trophy-cap">${esc(exsT(t.nomKey, t.nom))}</span>
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
    const centre = await getCentre(slug);
    if (centre) {
      root.innerHTML = renderStyles() + renderSelection();
      await startCentreRevision(root, slug, centre);
      return;
    }
  }

  // Deep-link depuis le carrousel du hub Réviser : #/exam-blanc/t-<tag>
  // → lance directement la révision ciblée du thème (ex. t-rond_point).
  if (param && param.startsWith("t-")) {
    const tag = param.slice(2);
    if (TAG_LABELS[tag]) {
      root.innerHTML = renderStyles() + renderSelection();
      await startThemeRevision(root, tag, TAG_LABELS[tag]);
      return;
    }
  }

  root.innerHTML = renderStyles() + renderSelection();
  wireSelection(root);

  // Deep-link depuis le hub Réviser : #/exam-blanc/mes-fautes
  // → amène directement sur le bloc « Tes points faibles » (s'il existe).
  // Best-effort : si l'élève n'a pas encore assez de données (bloc absent),
  // on reste simplement sur l'écran de sélection, sans erreur.
  if (param === "mes-fautes") {
    root
      .querySelector(".exb-weak")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ─── Écran 1 : sélection du parcours ─────────────────────────
// Grille de réponses A/B/C/D — markup partagé par les boucles de quiz exam-blanc.
function renderChoices(q) {
  return `<div class="exb-choices" id="exb-choices" role="group" aria-label="${escAttr(exsT("answers_aria", "Réponses"))}">
          ${q.options
            .map(
              (opt, i) => `
            <button class="exb-choice" data-idx="${i}" aria-pressed="false">
              <span class="exb-choice-letter">${String.fromCharCode(65 + i)}</span>
              <span class="exb-choice-text">${examBi(opt, q.tr?.options?.[i])}</span>
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
  const safeMascotState = ["hello", "think"].includes(mascotState)
    ? mascotState
    : "think";
  return `<div class="exb-qbody" id="exb-qbody">
        ${
          mascot
            ? `<div class="exb-mascot-badge"><video class="exb-mascot" poster="/skins/mascot-${safeMascotState}.png" muted playsinline aria-hidden="true"></video></div>`
            : ""
        }
        <p class="exb-qnum">${esc(examUi("qNum", "Question"))} ${num}</p>
        <div class="exb-qhead">
          ${muteButtonHTML()}
          <p class="exb-qtext">${examBi(q.enonce, q.tr?.enonce)}</p>
        </div>
        ${q.image ? `<img class="exb-qimg" src="${escAttr(q.image)}" alt="${escAttr(exsT("road_sign_alt", "Panneau routier à identifier"))}" />` : visualSlot(q.enonce)}
        ${renderChoices(q)}
        <div class="exb-feedback" id="exb-feedback" role="status" aria-live="polite" hidden></div>
      </div>`;
}

// Visuel + slot porteur de l'énoncé (remplacé par le geste juste au reveal)
function visualSlot(enonce) {
  const vis = quizVisualHTML(enonce);
  if (!vis) return "";
  return `<div class="qz-visual-slot" data-qzvq="${escAttr(enonce)}">${vis}</div>`;
}

// Bloc de feedback partagé par les 3 modes (parcours / officiel / révision).
// Variantes : bannière « faute éliminatoire » (parcours), préfixe « Temps
// écoulé » (officiel en timeout), libellé du dernier bouton.
function renderFeedbackBlock({
  isCorrect,
  correct,
  explication,
  explicationTr,
  isLast,
  lastLabel,
  faute = false,
  timedOut = false,
}) {
  const banner =
    !isCorrect && faute
      ? `<div class="exb-faute-banner">${medallion("panneau", "red", { size: 22 })}<span>${esc(examUi("faute", "À l’examen, cette faute est éliminatoire. Mieux vaut la corriger ici."))}</span></div>`
      : "";
  const verdict = isCorrect
    ? "✓ " + esc(examUi("verdictOk", "Bonne réponse"))
    : (timedOut ? "⏱ " + esc(examUi("timeout", "Temps écoulé")) + " · " : "") +
      esc(examUi("answerWas", "La bonne réponse était la")) +
      " " +
      esc(String.fromCharCode(65 + correct));
  return `
    ${banner}
    <div class="exb-feedback-verdict ${isCorrect ? "exb-feedback-verdict--ok" : "exb-feedback-verdict--ko"}">
      ${verdict}
    </div>
    <p class="exb-feedback-explication">${examBi(explication, explicationTr)}</p>
    <button class="exb-next-btn" id="exb-next">${isLast ? esc(lastLabel) : esc(examUi("next", "Question suivante →"))}</button>
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
    <button class="exb-pcard" data-pid="${p.id}" aria-label="${escAttr(exsT("pcard_aria_start", "Démarrer le parcours"))} ${escAttr(parcoursNom(p))}">
      <div class="exb-pcard-top">
        <span class="exb-pcard-num"${exsRtl()}>${esc(exsT("pcard_num", `Parcours ${p.id}`).replace("{n}", String(p.id)))}</span>
        <span class="exb-pcard-stars" aria-label="${escAttr(exsT("pcard_stars_aria", `Difficulté ${p.difficulte}/5`).replace("{n}", String(p.difficulte)))}"><small class="exb-pcard-stars-lbl"${exsRtl()}>${esc(exsT("pcard_stars_lbl", "Difficulté"))}</small>${stars(p.difficulte)}</span>
      </div>
      <div class="exb-pcard-nom"${exsRtl()}>${esc(parcoursNom(p))}</div>
      <div class="exb-pcard-ctx"${exsRtl()}>${esc(parcoursContexte(p))}</div>
      <div class="exb-pcard-meta"${exsRtl()}>${esc(exsT("pcard_meta", "15 questions · réussir dès 12/15"))}</div>
    </button>
  `,
  ).join("");

  const locked = EXAMEN_OFFICIEL_LOCKED || !_examenUnlocked;
  const lockMed = medallion("cadenas", "slate", { size: 16 });
  const lockBadge = EXAMEN_OFFICIEL_LOCKED
    ? `${lockMed} ${esc(exsT("lock_badge_premium", "PermiGo+"))}`
    : `${lockMed} ${esc(exsT("lock_badge_comp1", "Compétence 1"))}`;
  const lockSub = EXAMEN_OFFICIEL_LOCKED
    ? exsT("lock_sub_premium", "Débloque le vrai examen blanc avec PermiGo+.")
    : exsT(
        "lock_sub_comp1",
        "Valide ta compétence 1 pour ouvrir le vrai examen blanc.",
      );
  const officiel = locked
    ? `<button class="exo-hero is-locked" id="exb-officiel" aria-label="${escAttr(exsT("officiel_aria_locked", "Examen officiel verrouillé"))}">
        <span class="exo-hero-lock"${exsRtl()}>${lockBadge}</span>
        <span class="exo-hero-kicker"${exsRtl()}>${esc(exsT("officiel_kicker", "Examen officiel"))}</span>
        <span class="exo-hero-title"${exsRtl()}>${esc(exsT("officiel_title", "40 questions · chrono · comme le vrai"))}</span>
        <span class="exo-hero-sub"${exsRtl()}>${esc(lockSub)}</span>
      </button>`
    : `<button class="exo-hero" id="exb-officiel" aria-label="${escAttr(exsT("officiel_aria_unlocked", "Démarrer l’examen officiel"))}">
        <span class="exo-hero-kicker"${exsRtl()}>${esc(exsT("officiel_kicker", "Examen officiel"))}</span>
        <span class="exo-hero-title"${exsRtl()}>${esc(exsT("officiel_title", "40 questions · chrono · comme le vrai"))}</span>
        <span class="exo-hero-sub"${exsRtl()}>${esc(exsT("officiel_sub_unlocked", "Admis avec 5 fautes maximum."))}</span>
        <span class="exo-hero-cta"${exsRtl()}>${esc(exsT("officiel_cta", "Commencer →"))}</span>
      </button>`;

  const weak = getWeakPoints({ minSeen: 3, limit: 3 });
  const weakSection = weak.length
    ? `<div class="exb-weak">
    <p class="exb-weak-title"${exsRtl()}>${medallion("cible", "red", { size: 24 })} ${esc(exsT("weak_title", "Tes points faibles"))}</p>
    <div class="exb-weak-list">
      ${weak
        .map(
          (w) =>
            `
        <button class="exb-weak-btn" data-tag="${escAttr(w.tag)}" data-label="${escAttr(w.label)}" aria-label="${escAttr(exsT("weak_cta", "Réviser").replace(" →", ""))} ${escAttr(w.label)}">
          <span class="exb-weak-info">
            <span class="exb-weak-nom">${esc(w.label)}</span>
            <span class="exb-weak-stat"${exsRtl()}>${esc(
              exsT(
                "weak_stat",
                `${w.left} à revoir · ${Math.round(w.rate * 100)} % ratées`,
              )
                .replace("{left}", String(w.left))
                .replace("{pct}", String(Math.round(w.rate * 100))),
            )}</span>
          </span>
          <span class="exb-weak-cta"${exsRtl()}>${esc(exsT("weak_cta", "Réviser →"))}</span>
        </button>`,
        )
        .join("")}
    </div>
  </div>`
    : "";

  return `
<div class="exb anim-slide-up" id="exb-screen">
  <div class="exb-sel-header">
    <button class="exb-quit-btn" id="exb-back" aria-label="${escAttr(exsT("back_aria", "Retour"))}">←</button>
    ${renderTrophy(TROPHY_START, "exb-trophy--start")}
    <h1 class="exb-sel-title"${exsRtl()}>${esc(exsT("title", "Ton parcours d’examen"))}</h1>
    <p class="exb-sel-sub"${exsRtl()}>${esc(exsT("subtitle", "L’examen comme le vrai ou entraîne-toi par thème."))}</p>
  </div>
  ${officiel}
  ${weakSection}
  <p class="exb-sel-sub2"${exsRtl()}>${esc(exsT("theme_sub2", `Entraîne-toi par thème · ${PARCOURS.length} parcours de 15 questions`).replace("{n}", String(PARCOURS.length)))}</p>
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
      toast(
        exsT("toast_premium", "Bientôt : l’examen officiel avec PermiGo+"),
        "info",
        3500,
      );
      return;
    }
    if (!_examenUnlocked) {
      toast(
        exsT(
          "toast_locked",
          "Valide ta compétence 1 pour ouvrir l’examen blanc 🔒",
        ),
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

  // ⛔ Plus de musique de fond en boucle (retour Rayan, 05/08/2026 : « une
  // musique relou »). Elle démarrait toute seule sur les 3 modes, sans que
  // personne l'ait demandée, et sans bouton pour la couper — la seule sortie
  // était de quitter le quiz. Les sons de RÉPONSE (juste, faux, victoire) sont
  // gardés : eux répondent à un geste de l'élève.
  // `stopExamMusic()` reste appelé ici et à la sortie : un onglet ouvert avant
  // ce changement peut encore avoir une boucle en cours.
  stopExamMusic();

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
      swapVisualToReveal(root);
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
        const badge = root.querySelector(".exb-mascot-badge");
        const mascotEl = root.querySelector(".exb-mascot");
        // matchMedia, pas juste la classe CSS : animation:none n'arrête PAS
        // la lecture d'une vidéo (piège relevé sur #719/#722).
        const reduced = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (mascotEl && !reduced) {
          mascotEl.style.mixBlendMode = "lighten";
          mascotEl.src = isCorrect
            ? "/video/mascotte-quiz-bonne-reponse.mp4"
            : "/video/mascotte-quiz-mauvaise-reponse.mp4";
          mascotEl.currentTime = 0;
          mascotEl.play().catch(() => {});
        } else if (mascotEl) {
          mascotEl.poster = isCorrect
            ? "/skins/mascot-celebrate.png"
            : "/skins/mascot-coach.png";
        }
        if (badge) {
          badge.classList.remove("exb-mascot--pop");
          void badge.offsetWidth;
          badge.classList.add("exb-mascot--pop");
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
        explicationTr: q.tr?.explication,
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

async function startParcours(root, parcours_id) {
  const { questionsForParcours } = await ensureQuizData();
  await ensureExamI18n();
  const parcours = PARCOURS.find((p) => p.id === parcours_id);
  const questions = questionsForParcours(parcours_id).map(withShuffledOptions);
  track("parcours_quiz.started", { parcours_id, nom: parcours?.nom });

  runExbQuiz(root, questions, {
    mascot: true,
    colorTrackNode: true,
    feedbackFaute: true,
    feedbackLast: exsT("fb_results", "Voir les résultats →"),
    renderHeader: ({ num, total, idx, answers }) => `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="${escAttr(exsT("quit_aria", "Quitter"))}">×</button>
        <div class="exb-track-wrap">
          ${renderTrack(questions, answers, idx)}
          <span class="exb-progress-label">${num} / ${total}</span>
        </div>
        <span class="exb-quiz-parcours-name">${esc(parcours?.nom ?? "")}</span>
      </div>`,
    onQuit: (num) => {
      if (
        confirm(
          exsT(
            "confirm_quit_parcours",
            "Quitter ce parcours ? Ta progression sera perdue.",
          ),
        )
      ) {
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

  // (Retrait du 30/07/2026 : le bloc « +4 pts Révision » s'affichait sous le
  // verdict — cf. quiz-engine.js. L'essai reste enregistré ci-dessous : c'est
  // lui qui nourrit « Mes fautes », les statistiques et la vue moniteur.)

  // Persistance de l'essai — fire-and-forget (RLS : élève insère les siens)
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
      ? `<p class="exb-perfect"${exsRtl()}>${esc(exsT("perfect", "Parfait ! Aucune erreur."))}</p>`
      : `
      <h2 class="exb-recap-title"${exsRtl()}>${esc(exsT("wrong_questions", "Questions ratées"))}</h2>
      <div class="exb-recap-list">
        ${wrongItems
          .map(
            ({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${examBi(q.enonce, q.tr?.enonce)}</p>
            ${chosen !== null ? `<p class="exb-recap-wrong"${exsRtl()}>${esc(exsT("your_answer", "Ta réponse :"))} <strong>${examBi(q.options[chosen], q.tr?.options?.[chosen])}</strong></p>` : ""}
            <p class="exb-recap-correct"${exsRtl()}>${esc(exsT("correct_answer", "Bonne réponse :"))} <strong>${examBi(q.options[q.correct], q.tr?.options?.[q.correct])}</strong></p>
            <p class="exb-recap-explication">${examBi(q.explication, q.tr?.explication)}</p>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

  root.querySelector("#exb-screen").innerHTML = `
    <div class="exb-results"${exsRtl()}>
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
            ? esc(exsT("verdict_eliminatory", "Recalé · faute éliminatoire"))
            : passed
              ? esc(exsT("verdict_pass", "Admis · tu es dans les clous"))
              : esc(
                  exsT(
                    "verdict_fail",
                    "Non admis · encore un peu d’entraînement",
                  ),
                )
        }</div>
        <div class="exb-res-cepc">${
          fauteRatee
            ? esc(
                exsT(
                  "cepc_eliminatory",
                  "Une faute éliminatoire, c’est l’échec direct à l’examen, quel que soit le reste du score.",
                ),
              )
            : passed
              ? esc(
                  exsT(
                    "cepc_pass",
                    "Avec ce score, tu décrocherais ton permis. Continue comme ça.",
                  ),
                )
              : esc(
                  exsT(
                    "cepc_fail",
                    "Il te faut au moins 12/15, sans faute éliminatoire. Reviens t’entraîner.",
                  ),
                )
        }</div>
      </div>

      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${passed ? "exb-res-bar-fill--pass" : ""}" style="width:${pct}%"></div>
        </div>
        ${wrongHtml}
      </div>

      <div class="exb-res-actions">
        <button class="exb-retry-btn" id="exb-retry">${esc(exsT("retry_journey", "Refaire ce parcours"))}</button>
        <button class="exb-start-btn" id="exb-other">${esc(exsT("choose_journey", "Choisir un autre parcours"))}</button>
        <button class="exb-quit-btn-text" id="exb-home">${esc(exsT("home", "← Accueil"))}</button>
      </div>
    </div>
  `;

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
  const pool = quizData.QUESTIONS.slice();
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, Math.min(OFFICIEL_TOTAL, pool.length))
    .map(withShuffledOptions);
}

async function startExamenOfficiel(root) {
  await Promise.all([ensureQuizData(), ensureExamI18n()]);
  const questions = pickOfficielQuestions();
  const startedAt = Date.now();
  track("examen_officiel.started", { total: questions.length });

  runExbQuiz(root, questions, {
    chrono: true,
    feedbackLast: exsT("fb_result", "Voir le résultat →"),
    renderHeader: ({ num, total }) => `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="${escAttr(exsT("quit_aria", "Quitter"))}">×</button>
        <div class="exo-run-bar">
          <span class="exo-chrono" id="exo-chrono"><span id="exo-time">${OFFICIEL_SECONDS}</span>s</span>
          <div class="exo-prog"><div class="exo-prog-fill" style="width:${(num / total) * 100}%"></div></div>
          <span class="exb-progress-label">${num} / ${total}</span>
        </div>
        <span class="exb-quiz-parcours-name"${exsRtl()}>${esc(exsT("official_exam", "Examen officiel"))}</span>
      </div>`,
    onQuit: (num) => {
      if (
        confirm(
          exsT(
            "confirm_quit_officiel",
            "Quitter l’examen ? Ta progression sera perdue.",
          ),
        )
      ) {
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
        // "exam_blanc" et non "exam_officiel" : la contrainte quiz_attempts_type_check
        // n'admet que post_validation|consolidation|exam_blanc|review → l'insert
        // 400ait et l'examen officiel n'était JAMAIS persisté. Le ref_id "officiel"
        // reste le discriminant (même convention que exam-conduite).
        type: "exam_blanc",
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
      ? `<p class="exb-perfect"${exsRtl()}>${esc(exsT("official_perfect", "Sans faute. Impressionnant."))}</p>`
      : `
      <h2 class="exb-recap-title"${exsRtl()}>${esc(exsT("to_review", "À revoir ({count})", { count: wrongItems.length }))}</h2>
      <div class="exb-recap-list">
        ${wrongItems
          .map(
            ({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${examBi(q.enonce, q.tr?.enonce)}</p>
            ${
              chosen != null && chosen >= 0
                ? `<p class="exb-recap-wrong"${exsRtl()}>${esc(exsT("your_answer", "Ta réponse :"))} <strong>${examBi(q.options[chosen], q.tr?.options?.[chosen])}</strong></p>`
                : `<p class="exb-recap-wrong"${exsRtl()}>${esc(exsT("no_answer", "Pas de réponse · temps écoulé"))}</p>`
            }
            <p class="exb-recap-correct"${exsRtl()}>${esc(exsT("correct_answer", "Bonne réponse :"))} <strong>${examBi(q.options[q.correct], q.tr?.options?.[q.correct])}</strong></p>
            <p class="exb-recap-explication">${examBi(q.explication, q.tr?.explication)}</p>
          </div>`,
          )
          .join("")}
      </div>`;

  root.querySelector("#exb-screen").innerHTML = `
    <div class="exb-results"${exsRtl()}>
      <div class="exb-res-top ${passed ? "exb-res-top--pass" : "exb-res-top--fail"}">
        <div class="exb-res-ico">${
          passed
            ? medallion("trophee", "gold", { size: 60 })
            : medallion("faute", "red", { size: 60 })
        }</div>
        <div class="exb-res-score">${score}<span class="exb-res-total"> / ${total}</span></div>
        <div class="exb-res-pct">${esc(exsT("mistakes", `${fautes} faute${fautes > 1 ? "s" : ""} · ${pct} %`, { count: fautes, pct }))}</div>
        <div class="exb-res-verdict">${passed ? esc(exsT("official_verdict_pass", "Admis · bien joué")) : esc(exsT("official_verdict_fail", "Recalé · plus de 5 fautes"))}</div>
        <div class="exb-res-cepc">${
          passed
            ? esc(
                exsT(
                  "official_cepc_pass",
                  "Au vrai examen, il faut 35/40. Tu y es. Continue comme ça.",
                ),
              )
            : esc(
                exsT(
                  "official_cepc_fail",
                  "Il te faut au moins 35/40, soit 5 fautes maximum. Reviens t’entraîner.",
                ),
              )
        }</div>
      </div>
      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${passed ? "exb-res-bar-fill--pass" : ""}" style="width:${pct}%"></div>
        </div>
        ${wrongHtml}
      </div>
      <div class="exb-res-actions">
        <button class="exb-start-btn" id="exo-retry">${esc(exsT("retry_official", "Refaire un examen officiel"))}</button>
        <button class="exb-retry-btn" id="exb-other">${esc(exsT("choose_training", "Choisir un entraînement"))}</button>
        <button class="exb-quit-btn-text" id="exb-home">${esc(exsT("home", "← Accueil"))}</button>
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
    feedbackLast: exsT("fb_bilan", "Voir le bilan →"),
    renderHeader: ({ num, total }) => `
      <div class="exb-quiz-header">
        <button class="exb-quit-btn" id="exb-quit" aria-label="${escAttr(exsT("quit_aria", "Quitter"))}">×</button>
        <div class="exo-run-bar">
          <div class="exo-prog"><div class="exo-prog-fill" style="width:${(num / total) * 100}%"></div></div>
          <span class="exb-progress-label">${num} / ${total}</span>
        </div>
        <span class="exb-quiz-parcours-name"${exsRtl()}>${esc(exsT("review_header", "Révision · {label}", { label }))}</span>
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
async function startThemeRevision(root, tag, label) {
  const { QUESTIONS } = await ensureQuizData();
  await ensureExamI18n();
  const pool = QUESTIONS.filter((q) => (q.tags || []).includes(tag));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const questions = pool
    .slice(0, Math.min(12, pool.length))
    .map(withShuffledOptions);
  if (!questions.length) {
    toast(
      exsT("no_theme_questions", "Pas encore de questions sur ce thème"),
      "info",
    );
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
async function startCentreRevision(root, slug, knownCentre = null) {
  const [{ QUESTIONS }, c] = await Promise.all([
    ensureQuizData(),
    knownCentre ? Promise.resolve(knownCentre) : getCentre(slug),
    ensureExamI18n(),
  ]);
  if (!c) {
    toast(exsT("unknown_centre", "Centre inconnu"), "info");
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
    toast(
      exsT("no_centre_questions", "Pas encore de questions pour ce centre"),
      "info",
    );
    return;
  }
  const label = exsT("centre_traps", "Pièges de {name}", { name: c.nom });
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
    ? `<p class="exb-perfect"${exsRtl()}>${esc(exsT("theme_perfect", "Sans faute sur ce thème. Tu le maîtrises."))}</p>`
    : `
      <h2 class="exb-recap-title"${exsRtl()}>${esc(exsT("to_review", "À revoir ({count})", { count: wrongItems.length }))}</h2>
      <div class="exb-recap-list">
        ${wrongItems
          .map(
            ({ q, chosen }) => `
          <div class="exb-recap-item">
            <p class="exb-recap-enonce">${examBi(q.enonce, q.tr?.enonce)}</p>
            ${chosen != null ? `<p class="exb-recap-wrong"${exsRtl()}>${esc(exsT("your_answer", "Ta réponse :"))} <strong>${examBi(q.options[chosen], q.tr?.options?.[chosen])}</strong></p>` : ""}
            <p class="exb-recap-correct"${exsRtl()}>${esc(exsT("correct_answer", "Bonne réponse :"))} <strong>${examBi(q.options[q.correct], q.tr?.options?.[q.correct])}</strong></p>
            <p class="exb-recap-explication">${examBi(q.explication, q.tr?.explication)}</p>
          </div>`,
          )
          .join("")}
      </div>`;

  root.querySelector("#exb-screen").innerHTML = `
    <div class="exb-results"${exsRtl()}>
      <div class="exb-res-top ${perfect ? "exb-res-top--pass" : "exb-res-top--fail"}">
        <div class="exb-res-ico">${
          perfect
            ? medallion("trophee", "gold", { size: 60 })
            : medallion("cible", "orange", { size: 60 })
        }</div>
        <div class="exb-res-score">${score}<span class="exb-res-total"> / ${total}</span></div>
        <div class="exb-res-pct">${esc(label)} · ${pct} %</div>
        <div class="exb-res-verdict">${esc(exsT("revision_done", "Révision terminée"))}</div>
        <div class="exb-res-cepc">${esc(exsT("revision_help", "Refais cette série jusqu’à la maîtriser puis tente l’examen officiel."))}</div>
      </div>
      <div class="exb-res-body">
        <div class="exb-res-bar">
          <div class="exb-res-bar-fill ${perfect ? "exb-res-bar-fill--pass" : ""}" style="width:${pct}%"></div>
        </div>
        ${wrongHtml}
      </div>
      <div class="exb-res-actions">
        <button class="exb-start-btn" id="exo-revretry">${esc(exsT("retry", "Refaire"))}</button>
        <button class="exb-retry-btn" id="exb-other">${esc(exsT("back", "Retour"))}</button>
        <button class="exb-quit-btn-text" id="exb-home">${esc(exsT("home", "← Accueil"))}</button>
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
/* === Parcours quiz — exb-* ===

   DA Arène (nuit-violet + or), alignée sur reviser.js. Retour Rayan
   05/08/2026 : « ça met l'ancienne mise en forme des questions » — on arrivait
   ici depuis la fiche centre qui venait d'être repeinte, et on retombait sur un
   quiz tout blanc. Deux DA à un clic d'écart.

   ⚠️⚠️ ZÉRO BACKTICK ici : ce commentaire vit DANS un template littéral, un
   seul backtick le referme et la page ne se charge plus.

   Même geste que centre-examen.js : on redéfinit les TOKENS sur .exb et
   toutes les règles plus bas atterrissent dans la nuit sans être touchées.
   Ne PAS remplacer ces var() par des couleurs en dur, sinon la prochaine
   couleur ajoutée repartira en blanc sans que rien ne le signale.
*/
.exb {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  font-family: 'Archivo', sans-serif;
  overflow-x: hidden;

  --bg:   #1a1340;
  --bg3:  linear-gradient(180deg,#2c2264 0%,#241a56 100%);
  --su:   linear-gradient(180deg,#2c2264 0%,#241a56 100%);
  --bo:   #3a3178;
  --bo2:  #3a3178;
  --ink:  #f4f2ff;
  --mu:   rgba(244,242,255,.72);
  --mu2:  rgba(244,242,255,.58);
  --mu3:  rgba(244,242,255,.42);
  --a:    #6c63ff;
  --a-ink:#fff;
  --a-txt:#b3adff;

  color: var(--ink);
  background:
    radial-gradient(120% 40% at 50% 0%, rgba(142,135,255,.16) 0%, transparent 60%),
    linear-gradient(180deg,#241a52 0%,#1e1648 46%,#1a1340 100%);
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
  font: 800 22px/1.2 'Archivo', sans-serif;
  color: var(--ink);
  margin: 10px 0 4px;
  letter-spacing: -.022em;
}
.exb-sel-sub {
  font: 500 14px/1.5 'Archivo', sans-serif;
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
  font: 700 11px/1 'Archivo', sans-serif;
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
  font: 600 10px/1 'Archivo', sans-serif;
  color: var(--mu2);
  letter-spacing: .06em;
  text-transform: uppercase;
}
.exb-pcard-nom {
  font: 700 17px/1.2 'Archivo', sans-serif;
  color: var(--ink);
  margin-bottom: 4px;
  letter-spacing: -.015em;
}
.exb-pcard-ctx {
  font: 400 13px/1.5 'Archivo', sans-serif;
  color: var(--mu);
  margin-bottom: 8px;
}
.exb-pcard-meta {
  font: 600 11px/1 'Archivo', sans-serif;
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
  font: 600 12px/1 'Archivo', sans-serif;
  color: var(--mu);
  white-space: nowrap;
  min-width: 36px;
}
.exb-quiz-parcours-name {
  font: 600 11px/1 'Archivo', sans-serif;
  color: var(--mu2);
  letter-spacing: .06em;
  text-transform: uppercase;
}

/* ── Question body ── */
.exb-qbody {
  padding: 20px 16px 32px;
  flex: 1;
}
/* Coussinet sombre dédié : la vidéo mascotte (mp4, fond noir pur, pas de
   vrai alpha) a besoin d'un fond sombre local pour que mix-blend-mode:
   lighten efface son noir. exam-blanc suit le thème clair/sombre du
   système (var(--bg)) — on ne peut pas compter sur un fond sombre de
   page, donc on lui donne le sien, toujours sombre, quel que soit le
   thème. Double bénéfice : ça fait aussi un joli médaillon d'avatar. */
.exb-mascot-badge {
  width: 62px; height: 62px; margin: 0 0 8px; border-radius: 50%;
  display: grid; place-items: center; overflow: hidden;
  background: radial-gradient(75% 75% at 50% 38%, #2e2768, #14102e);
  box-shadow: 0 5px 12px rgba(10,13,26,.28), inset 0 1px 0 rgba(255,255,255,.08);
  animation: exbMascotIn .4s cubic-bezier(.34,1.56,.64,1) both;
}
.exb-mascot {
  display: block; width: 100%; height: 100%; object-fit: contain;
}
@keyframes exbMascotIn { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: scale(1) } }
/* Micro-pop sur changement d'état (celebrate / coach) */
.exb-mascot-badge.exb-mascot--pop { animation: exbMascotPop .38s cubic-bezier(.34,1.56,.64,1) both }
@keyframes exbMascotPop {
  0%  { transform: scale(1) translateY(0) }
  30% { transform: scale(1.22) translateY(-6px) }
  70% { transform: scale(.96) translateY(1px) }
  100%{ transform: scale(1) translateY(0) }
}
@media (prefers-reduced-motion: reduce) { .exb-mascot-badge, .exb-mascot-badge.exb-mascot--pop { animation: none !important } }
.exb-qnum {
  font: 700 11px/1 'Archivo', sans-serif;
  color: var(--a-txt);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin: 0 0 10px;
}
.exb-qhead { display: flex; align-items: flex-start; gap: 12px; margin: 0 0 20px; }
.exb-qhead .exb-qtext { margin: 0; flex: 1 1 auto; }
.exb-qhead .qz-mute:active { transform: scale(.92); }
.exb-qtext {
  font: 600 17px/1.5 'Archivo', sans-serif;
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
  font: 700 13px/26px 'Archivo', sans-serif;
  text-align: center;
}
.exb-choice-text {
  font: 500 15px/1.4 'Archivo', sans-serif;
  color: var(--ink);
  flex: 1;
}
/* Bilingue (en/ar) : traduction affichée, français gardé dessous (arabe RTL par
   span — l'app reste LTR). Voir lang.js + parcours-quiz-i18n.js. */
.exb-tr { display: block; }
.exb-fr {
  display: block;
  margin-top: 3px;
  font-weight: 400;
  opacity: .6;
  font-size: .86em;
}
.exb-qtext .exb-fr { font-size: .6em; line-height: 1.35; }
.exb-recap-enonce .exb-fr { font-size: .82em; }

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
  font: 700 13px/1.5 'Archivo', sans-serif;
  color: var(--rd-txt);
  display: flex;
  align-items: center;
  gap: 10px;
}
.exb-faute-banner .pg-med { flex-shrink: 0; }
.exb-feedback-verdict {
  font: 700 14px/1.3 'Archivo', sans-serif;
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
  font: 400 13px/1.6 'Archivo', sans-serif;
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
  font: 700 15px/1 'Archivo', sans-serif;
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
  font: 800 56px/1 'Archivo', sans-serif;
  color: var(--ink);
  letter-spacing: -.04em;
}
.exb-res-total { font-size: 28px; color: var(--mu); }
.exb-res-pct {
  font: 600 18px/1 'Archivo', sans-serif;
  color: var(--mu);
}
.exb-res-verdict {
  font: 700 17px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  margin-top: 4px;
}
.exb-res-cepc {
  font: 500 13px/1.5 'Archivo', sans-serif;
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
  font: 500 15px/1.5 'Archivo', sans-serif;
  color: var(--grk);
  text-align: center;
  margin: 0;
}
.exb-recap-title {
  font: 700 15px/1.2 'Archivo', sans-serif;
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
  font: 600 14px/1.4 'Archivo', sans-serif;
  color: var(--ink);
  margin: 0;
}
.exb-recap-wrong {
  font: 500 13px/1.4 'Archivo', sans-serif;
  color: var(--rdk);
  margin: 0;
}
.exb-recap-correct {
  font: 500 13px/1.4 'Archivo', sans-serif;
  color: var(--grk);
  margin: 0;
}
.exb-recap-explication {
  font: 400 12px/1.5 'Archivo', sans-serif;
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
  font: 700 15px/1 'Archivo', sans-serif;
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
  font: 700 15px/1 'Archivo', sans-serif;
  cursor: pointer;
  min-height: 50px;
  transition: transform .12s, opacity .12s;
}
.exb-start-btn:active { transform: scale(.97); }
.exb-quit-btn-text {
  background: none;
  border: none;
  color: var(--mu);
  font: 500 13px/1 'Archivo', sans-serif;
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
  font: 700 11px/1 'Archivo', sans-serif;
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
  font: 800 13px/1 'Archivo', sans-serif;
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
.exb-weak-nom { font: 700 14px/1.2 'Archivo', sans-serif; color: var(--ink); }
.exb-weak-stat { font: 500 12px/1.2 'Archivo', sans-serif; color: var(--mu); }
.exb-weak-cta { flex-shrink: 0; font: 800 12px/1 'Archivo', sans-serif; color: var(--a-txt); }

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
  font: 800 10.5px/1 'Archivo', sans-serif;
  letter-spacing: .12em; text-transform: uppercase;
  opacity: .85;
}
.exo-hero-title {
  font: 800 18px/1.2 'Archivo', sans-serif;
  letter-spacing: -.02em;
}
.exo-hero-sub {
  font: 500 13px/1.45 'Archivo', sans-serif;
  opacity: .9;
}
.exo-hero-cta {
  margin-top: 10px;
  font: 800 13px/1 'Archivo', sans-serif;
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
  font: 800 11px/1 'Archivo', sans-serif;
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
    el.textContent = EXB_CSS + QUIZ_VISUAL_CSS;
    document.head.appendChild(el);
  }
  // ⚠️ chromeNight() teinte `body` : il ne peut PAS aller dans la feuille
  // ci-dessus, qui reste dans <head> pour toujours (elle n'est jamais retirée,
  // par choix — 9 sites d'appel). Il partirait teinter le bandeau et la barre
  // du bas de toutes les pages CLAIRES visitées ensuite. Ici il est rendu DANS
  // #app : le router remplace #app à chaque navigation, donc la teinte meurt
  // avec la page, sans nettoyage.
  return `<style>${chromeNight("#241a52", "#1a1340")}</style>`;
}
