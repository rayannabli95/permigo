// ═══════════════════════════════════════════════════════════════
// Élève — Hub « Mon permis » : la route vers le VRAI permis (chantier 5,
// nav simplifiée, maquette validée Rayan : mockups/nav-mon-permis-A.html,
// variante A « La Route » — timeline sérieuse).
//
// Décision produit ferme (2026-07) : le JEU et le SÉRIEUX sont séparés.
//   - La route immersive (mondes/boss/coffres de parcours.js) RESTE à
//     #/parcours, accessible par Réviser → « Jouer ». Elle n'apparaît PAS
//     ici.
//   - « Mon permis » devient la route crédible : les compétences acquises
//     (`validations` + `self_validations`) et l'examen. Zéro XP/mondes/
//     coffres dans cet écran.
//
// Retrait du moniteur (lot 4 du pivot, 30/07/2026, décision Rayan) : le hub est
// passé de 3 à 2 étapes. L'étape ② « Mes leçons » (les comptes-rendus du
// moniteur) est retirée — il n'émet plus rien, elle ne pouvait que se vider.
//
// Grammaire éditoriale (fidèle à la maquette, façon Carnet) : timeline,
// numéros violets + filet vertical — PAS de médaillon-monde/route
// SVG (ça, c'est le langage du jeu).
//
// Réutilisation (ne duplique PAS la grosse logique métier des pages
// dédiées — même doctrine que recompenses.js) :
//   ① Mes compétences → `computeWorldStates()` EXPORTÉE de parcours.js
//     (mêmes seuils de déblocage, mêmes 4 chapitres, zéro seuil réécrit).
//   ② L'examen → `loadData/buildCriteria/buildVerdict/parseSavedDate/
//     saveExamDate/countdown/fmtDate` EXPORTÉS de examen.js (la readiness
//     reste GELÉE : un seul calcul dans toute l'app, jamais un « prêt à
//     X % » inventé ici).
// Ces pages sœurs sont IMPORTÉES DYNAMIQUEMENT (jamais en import statique
// en tête de fichier) : parcours.js est un GROS chunk (chest,
// sheet-swipe, league-hero, heatmap…) — un import statique le fusionnerait
// dans le chunk de ce hub, alors que #/parcours a déjà son
// propre chunk chargé par le router. Même raisonnement que le commentaire
// de reviser.js sur exam-blanc.js, appliqué via import() plutôt que
// duplication (les seuils/la readiness ne doivent JAMAIS diverger).
//
// Le centre d'examen (entrée finale) pointe vers #/centre-examen dans son
// état ACTUEL (CENTRES_PREMIUM_LOCKED = false dans centre-examen.js) :
// PAS de pastille PermiGo+ ni de cadenas — la maquette montre un état futur
// (module verrouillable), on ne l'invente pas ici.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { isSoloEleve } from "@/utils/league-bots.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { REMC_TOTAL } from "@/data/remc.js";
import { getLang } from "@/utils/lang.js";
import { worldTr } from "@/data/worlds-i18n.js";

const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;

// ── i18n de la COQUE « Mon permis » (EN/AR) — élèves non-francophones.
// Dict LOCAL au composant (règle coque validée : pas de fichier partagé →
// zéro collision multi-session), repli FR intégral. Le CONTENU pédagogique
// (titres de chapitres REMC, note du moniteur) reste en français — il est
// traduit à SA source quand un pattern existe. RTL : uniquement par <span
// dir="rtl"> autour du texte arabe affiché (l'app reste LTR), avec îlots
// dir="ltr" pour les nombres/« n / m » (ordre visuel stable).
const MP_I18N = {
  en: {
    title: "My licence",
    chip_followed: "Coached by {name}",
    chip_sub: "· validated in lessons",
    hero_kick: "The road to the real licence",
    hero_of: "out of {t}",
    hero_lbl: "skills validated",
    hero_sub_solo: "At your own pace. Your real progress.",
    hero_sub_monit:
      "Practised in lessons then certified by you. Your real progress.",
    hero_aria: "{n} skills out of {t}",
    hero_chap: "Current chapter:",
    hero_all_done: "All chapters validated",
    s2_err: "“My lessons” is unavailable. Check your connection and try again.",
    retry: "Try again",
    lbl_done: "done",
    lbl_locked: "upcoming",
    lbl_progress: "in progress",
    s2_title: "My lessons",
    s2_sub: "your instructor's lesson reports",
    cr_lesson_of: "Lesson of {date}",
    cr_new: "New",
    cr_valid_one: "{n} validated",
    cr_valid_many: "{n} validated",
    cr_rework: "{n} to work on",
    cr_empty:
      "Your instructor hasn't sent you a lesson report (compte-rendu) yet.",
    cr_all: "All my lessons",
    cr_count_one: "{n} report",
    cr_count_many: "{n} reports",
    cr_none: "No report yet",
    s3_title: "The exam",
    s3_sub: "get ready for the big day here",
    s3_err: "“The exam” is unavailable. Check your connection and try again.",
    exam_nodate: "Add your exam date to start the countdown.",
    exam_choose: "Pick my date",
    exam_save: "Save",
    exam_passed_b: "Done",
    exam_passed_t: "Your exam is behind you",
    exam_passed_s: "Good luck with the results.",
    exam_change: "Change the date",
    exam_soon: "Your exam is coming up",
    exam_edit: "Edit the date",
    day_one: "day",
    day_many: "days",
    prep_h: "Your preparation",
    centre_t: "Your exam centre",
    centre_s: "Difficulty · route traps · on-site tips",
    verdict_high: "Ready for the exam. Your {t} core skills are validated.",
    verdict_mid: "Almost ready. {n} core skill{s} left to validate.",
    verdict_low:
      "In preparation. Validate your skills lesson after lesson, revision after revision.",
    crit_parcours: "Progress above 50%",
    crit_parcours_sub: "{n} skills validated out of 31",
    crit_streak: "Active streak",
    crit_streak_days: "{n} day{s} in a row",
    crit_streak_none: "Come back and revise today",
    crit_quiz: "Quiz score above 70%",
    crit_quiz_avg: "Average: {n}%",
    crit_quiz_none: "No quiz recorded",
    crit_rev: "Revision done",
    crit_rev_yes: "Revision sheets consulted",
    crit_rev_no: "Check your revision sheets",
    badge_day: "{n}d",
  },
  ar: {
    title: "رخصتي",
    chip_followed: "يتابعك {name}",
    chip_sub: "· يُصادَق عليها في الدروس",
    hero_kick: "الطريق إلى الرخصة الحقيقية",
    hero_of: "من {t}",
    hero_lbl: "مهارة مُصادَق عليها",
    hero_sub_solo: "بشكل مستقل وعلى وتيرتك. هذا تقدّمك الحقيقي.",
    hero_sub_monit: "من مدرّبك أثناء الدروس الحقيقية. هذا تقدّمك الحقيقي.",
    hero_aria: "{n} مهارة من {t}",
    hero_chap: "الفصل الحالي:",
    hero_all_done: "اكتملت جميع الفصول",
    s2_err: "تعذّر تحميل «دروسي». تحقّق من اتصالك ثم أعد المحاولة.",
    retry: "أعد المحاولة",
    lbl_done: "مكتمل",
    lbl_locked: "لاحقًا",
    lbl_progress: "جارٍ",
    s2_title: "دروسي",
    s2_sub: "تقارير مدرّبك عن الدروس",
    cr_lesson_of: "درس يوم {date}",
    cr_new: "جديد",
    cr_valid_one: "{n} مُصادَق عليها",
    cr_valid_many: "{n} مُصادَق عليها",
    cr_rework: "{n} تحتاج مراجعة",
    cr_empty: "لم يرسل لك مدرّبك بعد أيّ تقرير درس (compte-rendu).",
    cr_all: "كل دروسي",
    cr_count_one: "تقرير واحد",
    cr_count_many: "{n} تقارير",
    cr_none: "لا تقارير حتى الآن",
    s3_title: "الامتحان",
    s3_sub: "الاستعداد ليوم الامتحان يبدأ هنا",
    s3_err: "تعذّر تحميل «الامتحان». تحقّق من اتصالك ثم أعد المحاولة.",
    exam_nodate: "أضف تاريخ امتحانك لبدء العدّ التنازلي.",
    exam_choose: "اختيار التاريخ",
    exam_save: "حفظ",
    exam_passed_b: "انتهى",
    exam_passed_t: "امتحانك أصبح خلفك",
    exam_passed_s: "حظًا موفقًا في النتائج.",
    exam_change: "تغيير التاريخ",
    exam_soon: "امتحانك يقترب",
    exam_edit: "تعديل التاريخ",
    day_one: "يوم",
    day_many: "أيام",
    prep_h: "استعدادك",
    centre_t: "مركز امتحانك",
    centre_s: "الصعوبة · مطبّات المسار · نصائح في الموقع",
    verdict_high: "جاهز للامتحان. مهاراتك الأساسية الـ{t} مُصادَق عليها.",
    verdict_mid: "قريبًا تكون جاهزًا. بقيت {n} مهارة أساسية للمصادقة.",
    verdict_low: "في طور الاستعداد. صادق على مهاراتك درسًا بعد درس.",
    crit_parcours: "تقدّم فوق 50%",
    crit_parcours_sub: "{n} مهارة مُصادَق عليها من 31",
    crit_streak: "سلسلة نشطة",
    crit_streak_days: "{n} يوم على التوالي",
    crit_streak_none: "عد وراجع اليوم",
    crit_quiz: "نتيجة الاختبارات فوق 70%",
    crit_quiz_avg: "المعدل: {n}%",
    crit_quiz_none: "لا اختبار مسجّل",
    crit_rev: "المراجعة منجزة",
    crit_rev_yes: "بطاقات المراجعة مُطالَعة",
    crit_rev_no: "طالع بطاقات المراجعة",
    badge_day: "{n}ي",
  },
};

// Traduit-ou-français (brut, pour interpolation / attributs SANS esc)
function mpTR(key, fr, vars) {
  const l = getLang();
  let s = (l !== "fr" && MP_I18N[l]?.[key]) || fr;
  if (vars)
    for (const [k, v] of Object.entries(vars))
      s = s.split(`{${k}}`).join(String(v));
  return s;
}
// Version échappée — sûre en texte ET en attribut
function mpT(key, fr, vars) {
  return esc(mpTR(key, fr, vars));
}
// Texte AFFICHÉ : en arabe, enveloppe <span dir="rtl"> + îlots LTR pour les
// nombres (« 3 / 8 », « 80% ») afin que la ponctuation/les chiffres gardent
// un ordre visuel correct. Jamais utilisé dans un attribut.
function mpRtl(escaped) {
  const s = escaped.replace(
    /\d+(?:\s*\/\s*\d+)?(?:\s*%)?/g,
    (m) => `<span dir="ltr">${m}</span>`,
  );
  return `<span dir="rtl">${s}</span>`;
}
function mpD(key, fr, vars) {
  const l = getLang();
  const out = esc(mpTR(key, fr, vars));
  return l === "ar" && MP_I18N.ar?.[key] ? mpRtl(out) : out;
}
// Chaîne DÉJÀ échappée, assemblée dynamiquement : RTL seulement en arabe.
function mpDyn(escaped) {
  return getLang() === "ar" ? mpRtl(escaped) : escaped;
}

// ─── STYLE (scopé .mp-*, tokens theme-aware — jamais --surface/--border/--muted) ──
const STYLE = `<style>
.mp {
  --gold-1:#ffe9a8; --gold-2:#ffd24a; --gold-3:#ff9c1c; --gold-deep:#c87d12; --gold-ink:#7a5510;
  max-width: 480px; margin: 0 auto; padding: 14px 15px 32px;
  font-family: 'Archivo', system-ui, sans-serif; color: var(--ink);
  background:
    radial-gradient(120% 40% at 22% -6%, color-mix(in srgb, var(--a) 10%, transparent) 0%, transparent 58%),
    radial-gradient(110% 36% at 96% 0%, rgba(255,180,40,.12) 0%, transparent 55%),
    var(--bg);
}
.mp-title { font: 800 26px/1.1 'Archivo', system-ui, sans-serif; letter-spacing: .2px; margin: 4px 2px 14px; }

/* ── Chip moniteur : qui suit l'élève (il observe, il ne valide plus) ── */
.mp-monit {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px;
  padding: 5px 13px 5px 6px; border-radius: 999px;
  background: color-mix(in srgb, var(--a) 10%, var(--su)); border: 1px solid color-mix(in srgb, var(--a) 30%, transparent);
}
.mp-mavatar {
  width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex: none;
  font: 800 12px/1 'Archivo', system-ui, sans-serif; color: var(--a-ink);
  background: linear-gradient(180deg, var(--a), var(--adk)); box-shadow: 0 2px 5px color-mix(in srgb, var(--adk) 45%, transparent);
}
.mp-monit b { font-size: 12.5px; font-weight: 800; color: var(--a-txt); }
.mp-monit i { font-size: 11.5px; font-weight: 700; font-style: normal; color: var(--mu2); }

/* ══ HERO — LE PERMIS VIRTUEL ══ */
.mp-hero {
  position: relative; border: 1.5px solid color-mix(in srgb, var(--a) 26%, var(--bo)); border-radius: 26px;
  padding: 17px 16px 16px; margin-bottom: 20px; overflow: hidden;
  background:
    radial-gradient(130% 80% at 88% 0%, color-mix(in srgb, var(--a) 14%, transparent) 0%, transparent 55%),
    radial-gradient(90% 70% at 6% 100%, rgba(255,210,74,.10) 0%, transparent 60%),
    var(--su);
  box-shadow: inset 0 2px 0 rgba(255,255,255,.06), 0 6px 20px -14px rgba(0,0,0,.35);
}
.mp-hero-k {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; margin-bottom: 11px;
  background: linear-gradient(180deg, var(--a), var(--adk)); box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
  font: 600 10px/1 'Archivo', sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--a-ink);
}
.mp-hero-row { display: flex; align-items: center; gap: 14px; }
.mp-hero-txt { flex: 1; min-width: 0; }
.mp-hero-t { font: 800 30px/1 'Archivo', system-ui, sans-serif; color: var(--ink); }
.mp-hero-t small { font-size: 16px; font-weight: 800; color: var(--mu2); }
.mp-hero-lbl { margin-top: 3px; font-size: 13px; font-weight: 800; color: var(--mu); }
.mp-hero-s { margin-top: 7px; font-size: 11.5px; font-weight: 700; color: var(--mu2); line-height: 1.4; }
.mp-hero-med { flex: none; filter: drop-shadow(0 8px 12px rgba(50,40,110,.3)); }
.mp-hero-track {
  margin-top: 13px; height: 10px; border-radius: 6px; background: var(--bg2); overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(50,40,110,.12);
}
.mp-hero-track i {
  display: block; height: 100%; border-radius: 6px;
  background: linear-gradient(90deg, var(--adk), var(--a)); box-shadow: 0 0 10px color-mix(in srgb, var(--a) 50%, transparent);
  transition: width .6s var(--ease, ease);
}
.mp-hero-foot { display: flex; justify-content: space-between; margin-top: 7px; gap: 8px; font-size: 10.5px; font-weight: 800; color: var(--mu2); }
.mp-hero-foot b { color: var(--a-txt); }

/* ══ TIMELINE — numéros violets + filet ══ */
.mp-tl { position: relative; }
.mp-step { position: relative; padding: 0 0 26px 44px; }
/* Seule étape restante : plus de puce ni de frise, donc plus de gouttière. */
.mp-step-seul { padding-left: 0; }
.mp-step:last-child { padding-bottom: 6px; }
.mp-step::before {
  content: ""; position: absolute; left: 15px; top: 36px; bottom: -2px; width: 2px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--a) 35%, transparent), color-mix(in srgb, var(--a) 12%, transparent));
}
.mp-step:last-child::before { display: none; }
.mp-step-num {
  position: absolute; left: 0; top: 0; width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center; font: 800 15px/1 'Archivo', system-ui, sans-serif; color: var(--a-ink);
  background: linear-gradient(180deg, var(--a), var(--adk));
  border: 2px solid var(--su); box-shadow: 0 3px 0 var(--adk), 0 8px 14px -6px color-mix(in srgb, var(--adk) 50%, transparent);
}
.mp-step-h { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-height: 32px; padding-top: 4px; margin-bottom: 10px; }
.mp-step-t { font: 800 17px/1 'Archivo', system-ui, sans-serif; }
.mp-step-s { font-size: 10.5px; font-weight: 800; color: var(--mu2); text-align: right; }

/* ── Étape 1 : les 4 blocs C1-C4 ── */


/* ── Étape 2 : mes leçons (comptes-rendus) ── */

.mp-linkrow {
  display: flex; align-items: center; gap: 10px; width: 100%; margin-top: 9px; padding: 11px 13px; border-radius: 15px; cursor: pointer;
  background: var(--su); border: 1px solid var(--bo); box-shadow: 0 1px 2px rgba(10,13,26,.04); font: inherit; color: inherit; text-align: left;
  min-height: 44px;
}
.mp-linkrow p { flex: 1; font-size: 12.5px; font-weight: 800; }
.mp-linkrow p i { display: block; font-style: normal; font-size: 10.5px; font-weight: 700; color: var(--mu2); margin-top: 2px; }
.mp-linkrow svg { width: 16px; height: 16px; flex: none; color: var(--mu2); }

/* ── Étape 3 : l'examen ── */
.mp-exam {
  padding: 14px; border-radius: 20px; margin-bottom: 9px;
  background:
    radial-gradient(120% 80% at 85% 0%, rgba(255,210,74,.16) 0%, transparent 55%),
    var(--su);
  border: 1.5px solid color-mix(in srgb, var(--gold-deep) 35%, var(--bo)); box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.mp-exam-top { display: flex; align-items: center; gap: 12px; }
.mp-exam-cd {
  flex: none; width: 74px; padding: 9px 4px 7px; border-radius: 15px; text-align: center;
  background: color-mix(in srgb, var(--gold-1) 30%, var(--su)); border: 1px solid color-mix(in srgb, var(--gold-deep) 40%, transparent);
}
.mp-exam-cd b { display: block; font: 800 26px/1 'Archivo', system-ui, sans-serif; color: var(--gold-ink); }
.mp-exam-cd span { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--gold-deep); }
.mp-exam-tb { flex: 1; min-width: 0; }
.mp-exam-t { font: 800 15.5px/1.15 'Archivo', system-ui, sans-serif; }
.mp-exam-d { font-size: 11.5px; font-weight: 800; color: var(--mu); margin-top: 3px; }
.mp-exam-edit {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; padding: 5px 10px; border-radius: 999px;
  border: 1px solid var(--bo); background: var(--su); cursor: pointer; font: 800 10.5px/1 'Archivo', sans-serif; color: var(--mu);
  min-height: 30px;
}
.mp-exam-date-wrap { display: none; margin-top: 10px; align-items: center; gap: 8px; }
.mp-exam-date-wrap.open { display: flex; }
.mp-exam-date-input {
  flex: 1; border: 1.5px solid var(--bo); border-radius: 12px; padding: 9px 12px; font: 500 13px/1 'Archivo', sans-serif;
  color: var(--ink); background: var(--bg); outline: none; min-height: 44px;
}
.mp-exam-date-save {
  padding: 9px 14px; background: var(--a); color: var(--a-ink); border: 0; border-radius: 12px;
  font: 700 12.5px/1 'Archivo', sans-serif; cursor: pointer; min-height: 44px;
}
.mp-exam-nodate { text-align: center; padding: 6px 0 2px; }
.mp-exam-nodate p { font: 600 12.5px/1.4 'Archivo', sans-serif; color: var(--mu); margin-bottom: 10px; }

.mp-verdict {
  display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 13px;
  font-size: 11.5px; font-weight: 800; line-height: 1.4;
}
.mp-verdict.high { background: var(--grp2); color: var(--grk2); }
.mp-verdict.mid  { background: #fef9c3; color: #a16207; }
.mp-verdict.low  { background: var(--amp); color: var(--am-txt); }
.mp-verdict svg { flex: none; margin-top: 1px; }

.mp-prep { margin-top: 10px; display: flex; flex-direction: column; gap: 7px; }
.mp-prep-h { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--mu2); margin: 2px 2px 1px; }
.mp-crit { display: flex; align-items: center; gap: 10px; padding: 8px 11px; border-radius: 13px; background: var(--su); border: 1px solid var(--bo); }
.mp-crit.pass { background: var(--grp); border-color: color-mix(in srgb, var(--gr) 24%, transparent); }
.mp-crit.fail { background: var(--amp); border-color: color-mix(in srgb, var(--am) 24%, transparent); }
.mp-crit p { flex: 1; font-size: 11.5px; font-weight: 800; line-height: 1.25; }
.mp-crit p i { display: block; font-style: normal; font-size: 10px; font-weight: 700; color: var(--mu2); margin-top: 1px; }
.mp-crit.pass p i { color: var(--gr-txt); opacity: .85; }
.mp-crit.fail p i { color: var(--am-txt); opacity: .85; }
.mp-crit-b { flex: none; font: 800 12px/1 'Archivo', system-ui, sans-serif; padding: 3px 8px; border-radius: 8px; }
.mp-crit.pass .mp-crit-b { background: var(--grp2); color: var(--grk2); }
.mp-crit.fail .mp-crit-b { background: #fbe5c4; color: var(--am-txt); }
.mp-crit.neutral .mp-crit-b { background: var(--bg2); color: var(--mu3); }

.mp-centre {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 13px; border-radius: 17px; cursor: pointer;
  background: var(--su); border: 1px solid var(--bo); box-shadow: 0 1px 2px rgba(10,13,26,.04);
  font: inherit; color: inherit; text-align: left; text-decoration: none; min-height: 44px;
}
.mp-centre svg { width: 16px; height: 16px; flex: none; color: var(--mu2); }
.mp-centre-b { flex: 1; min-width: 0; }
.mp-centre-t { font: 700 14px/1 'Archivo', system-ui, sans-serif; }
.mp-centre-s { font-size: 10.5px; font-weight: 700; color: var(--mu2); margin-top: 2px; line-height: 1.35; }

.mp-err {
  padding: 24px 18px; border-radius: 18px; background: var(--su); border: 1px solid var(--bo); text-align: center;
}
.mp-err p { font: 600 13px/1.5 'Archivo', sans-serif; color: var(--mu3); margin: 8px 0 12px; }
.mp-err button {
  padding: 10px 20px; border: 0; border-radius: 12px; background: var(--a); color: var(--a-ink);
  font: 700 13px/1 'Archivo', sans-serif; cursor: pointer; min-height: 44px;
}

/* ── Skeleton ── */
.mp-skel { border-radius: 18px; background: var(--bg2); }
@keyframes mpPulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
.mp-skel { animation: mpPulse 1.3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .mp-hero-track i { transition: none; }
  .mp-skel { animation: none; }
}
</style>`;

// ─── Skeleton ─────────────────────────────────────────────────
function skeleton() {
  return `${STYLE}<div class="mp">
    <h1 class="mp-title" tabindex="-1">${mpD("title", "Mon permis")}</h1>
    <div class="mp-skel" style="height:170px;margin-bottom:20px"></div>
    <div class="mp-skel" style="height:220px;margin-bottom:20px"></div>
    <div class="mp-skel" style="height:140px;margin-bottom:20px"></div>
    <div class="mp-skel" style="height:280px"></div>
  </div>`;
}

// Médaillon d'un chapitre selon son état — grammaire dédiée « permis
// virtuel » (check/vert = acquis, étoile/or = en cours, cadenas/slate =
// à venir), distincte des médaillons-monde du jeu (parcours.js).

// ─── Chip moniteur ───────────────────────────────────────────────
function renderChip(moniteurPrenom) {
  if (!moniteurPrenom) return "";
  const initial = (moniteurPrenom[0] || "?").toUpperCase();
  return `<div class="mp-monit">
    <span class="mp-mavatar" aria-hidden="true">${esc(initial)}</span>
    <b>${mpD("chip_followed", `Suivi par ${moniteurPrenom}`, { name: moniteurPrenom })}</b><i>${mpD("chip_sub", "· il voit ta progression")}</i>
  </div>`;
}

// ─── Hero — permis virtuel ─────────────────────────────────────
function renderHero({ totalAcquis, currentTitre, allDone, solo }) {
  const pct = REMC_TOTAL > 0 ? Math.round((totalAcquis / REMC_TOTAL) * 100) : 0;
  const chapLabel = allDone
    ? mpTR("hero_all_done", "Tous les chapitres validés")
    : currentTitre || "";
  return `<section class="mp-hero">
    <span class="mp-hero-k">${mpD("hero_kick", "La route vers le vrai permis")}</span>
    <div class="mp-hero-row">
      <div class="mp-hero-txt">
        <div class="mp-hero-t">${totalAcquis} <small>${mpD("hero_of", `sur ${REMC_TOTAL}`, { t: REMC_TOTAL })}</small></div>
        <div class="mp-hero-lbl">${mpD("hero_lbl", "compétences validées")}</div>
        <!-- Retrait du moniteur (lot 4 du pivot) : plus d'attribution « par ton
             moniteur ». L'élève pratique en leçon puis certifie lui-même. -->
        <div class="mp-hero-s">${solo ? mpD("hero_sub_solo", "À ton rythme et en autonomie. Ta vraie progression.") : mpD("hero_sub_monit", "Pratiquée en leçon puis certifiée par toi. Ta vraie progression.")}</div>
      </div>
      <span class="mp-hero-med" aria-hidden="true">${medallion("trophee", "gold", { size: 68 })}</span>
    </div>
    <div class="mp-hero-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${mpT("hero_aria", `${totalAcquis} compétences sur ${REMC_TOTAL}`, { n: totalAcquis, t: REMC_TOTAL })}"><i style="width:${pct}%"></i></div>
    <div class="mp-hero-foot">
      <span>${mpD("hero_chap", "Chapitre en cours :")} <b>${esc(chapLabel)}</b></span>
      <span>${pct}&nbsp;%</span>
    </div>
  </section>`;
}

// ─── Étape 2 : mes leçons ───────────────────────────────────────
// Retrait du moniteur (lot 4 du pivot, 30/07/2026) : l'étape ② « Mes leçons »
// (dernier compte-rendu + lien vers l'historique) vivait ici. Elle était
// alimentée à 100 % par le moniteur → le hub passe à 2 étapes.
//
// ⚠️ NE PAS LA RECONSTRUIRE « en la faisant écrire par l'élève ». Ça a été
// tenté le 30/07 (PR #612, table lecon_debriefs) et retiré le jour même
// (#613). Raison, mot de Rayan : « on s'en fout d'un journal intime, ça sert
// à rien » — ce que l'élève écrivait ne lui revenait JAMAIS, donc il ne
// rouvrait jamais la page. Une trace n'a de valeur que si elle est
// RÉUTILISÉE : réorienter la préparation de l'heure suivante, ou devenir ce
// que l'élève MONTRE à son moniteur (piste « Bridge », élèves non
// francophones). Sans ça, c'est une page morte.

// ─── Étape 3 : l'examen ─────────────────────────────────────────
const READINESS_ICON = {
  high: "check-circle",
  mid: "alert-triangle",
  low: "alert-circle",
};

function renderExamCountdown(examDate, examMod) {
  if (!examDate) {
    return `<div class="mp-exam-nodate">
      <p>${mpD("exam_nodate", "Ajoute ta date d'examen pour lancer le compte à rebours.")}</p>
      <button class="mp-exam-edit" id="mp-exam-choose" type="button">${icon("calendar", { size: 14 })} ${mpD("exam_choose", "Choisir ma date")}</button>
      <div class="mp-exam-date-wrap" id="mp-exam-date-wrap">
        <input type="date" class="mp-exam-date-input" id="mp-exam-date-input" />
        <button class="mp-exam-date-save" id="mp-exam-date-save" type="button">${mpD("exam_save", "Enregistrer")}</button>
      </div>
    </div>`;
  }
  const cd = examMod.countdown(examDate);
  if (cd.passed) {
    return `<div class="mp-exam-top">
      <div class="mp-exam-cd"><b>${icon("check-circle", { size: 26, color: "var(--gr-txt)" })}</b><span>${mpD("exam_passed_b", "Passé")}</span></div>
      <div class="mp-exam-tb">
        <div class="mp-exam-t">${mpD("exam_passed_t", "Ton examen est passé")}</div>
        <div class="mp-exam-d">${mpD("exam_passed_s", "Bonne chance pour les résultats.")}</div>
        <button class="mp-exam-edit" id="mp-exam-choose" type="button">${icon("calendar", { size: 14 })} ${mpD("exam_change", "Changer la date")}</button>
        <div class="mp-exam-date-wrap" id="mp-exam-date-wrap">
          <input type="date" class="mp-exam-date-input" id="mp-exam-date-input" value="${examDate.toISOString().slice(0, 10)}" />
          <button class="mp-exam-date-save" id="mp-exam-date-save" type="button">${mpD("exam_save", "Enregistrer")}</button>
        </div>
      </div>
    </div>`;
  }
  const dayWord =
    cd.days > 1 ? mpTR("day_many", "jours") : mpTR("day_one", "jour");
  return `<div class="mp-exam-top">
    <div class="mp-exam-cd" aria-hidden="true"><b>${cd.days}</b><span>${esc(dayWord)}</span></div>
    <div class="mp-exam-tb">
      <div class="mp-exam-t">${mpD("exam_soon", "Ton examen approche")}</div>
      <div class="mp-exam-d">${mpDyn(esc(getLang() === "fr" ? examMod.fmtDate(examDate) : examDate.toLocaleDateString({ en: "en-GB", ar: "ar" }[getLang()] || "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })))}</div>
      <button class="mp-exam-edit" id="mp-exam-choose" type="button">${icon("calendar", { size: 14 })} ${mpD("exam_edit", "Modifier la date")}</button>
      <div class="mp-exam-date-wrap" id="mp-exam-date-wrap">
        <input type="date" class="mp-exam-date-input" id="mp-exam-date-input" value="${examDate.toISOString().slice(0, 10)}" />
        <button class="mp-exam-date-save" id="mp-exam-date-save" type="button">${mpD("exam_save", "Enregistrer")}</button>
      </div>
    </div>
  </div>`;
}

function renderStep3({
  examMod,
  examData,
  examDate,
  solo = false,
  num = null,
}) {
  if (!examMod || examData?.loadFailed) {
    return `<section class="mp-step ${num ? "" : "mp-step-seul"}" id="mp-step-exam">
      ${num ? `<span class="mp-step-num" aria-hidden="true">${num}</span>` : ""}
      <div class="mp-step-h"><h2 class="mp-step-t">${mpD("s3_title", "L'examen")}</h2></div>
      <div class="mp-err">
        <p>${mpD("s3_err", "« L'examen » indisponible. Vérifie ta connexion puis réessaie.")}</p>
        <button id="mp-retry-3" type="button">${mpD("retry", "Réessayer")}</button>
      </div>
    </section>`;
  }

  const verdict = examMod.buildVerdict({ ...examData, solo });
  // i18n : le verdict vient d'examen.js (source UNIQUE des seuils — on ne
  // recalcule rien). En EN/AR on re-formule seulement le libellé à partir du
  // niveau + des mêmes données (baseAcquis / BASE_TOTAL exportés).
  if (getLang() !== "fr") {
    const baseTotal = examMod.BASE_TOTAL ?? 24;
    const baseRestantes = Math.max(0, baseTotal - (examData.baseAcquis ?? 0));
    verdict.text =
      verdict.level === "high"
        ? mpTR("verdict_high", verdict.text, { t: baseTotal })
        : verdict.level === "mid"
          ? mpTR("verdict_mid", verdict.text, {
              n: baseRestantes,
              s: baseRestantes > 1 ? "s" : "",
            })
          : mpTR("verdict_low", verdict.text);
  }
  const verdictHtml = `<div class="mp-verdict ${verdict.level}" role="status">
    ${icon(READINESS_ICON[verdict.level], { size: 18 })}
    <span>${mpDyn(esc(verdict.text))}</span>
  </div>`;

  // i18n : mêmes critères qu'examen.js (buildCriteria = source des seuils),
  // seuls les LIBELLÉS sont re-formulés en EN/AR depuis les mêmes données.
  const criteria = examMod.buildCriteria(examData).map((c, i) => {
    if (getLang() === "fr") return c;
    const { compsCount = 0, streak = 0, avgScore = null } = examData;
    const copy = { ...c };
    if (i === 0) {
      copy.label = mpTR("crit_parcours", c.label);
      copy.sub = mpTR("crit_parcours_sub", c.sub, { n: compsCount });
    } else if (i === 1) {
      copy.label = mpTR("crit_streak", c.label);
      copy.sub =
        streak > 0
          ? mpTR("crit_streak_days", c.sub, {
              n: streak,
              s: streak > 1 ? "s" : "",
            })
          : mpTR("crit_streak_none", c.sub);
      copy.badge = mpTR("badge_day", c.badge, { n: streak > 0 ? streak : 0 });
    } else if (i === 2) {
      copy.label = mpTR("crit_quiz", c.label);
      copy.sub =
        avgScore !== null
          ? mpTR("crit_quiz_avg", c.sub, { n: avgScore })
          : mpTR("crit_quiz_none", c.sub);
    } else if (i === 3) {
      copy.label = mpTR("crit_rev", c.label);
      copy.sub = c.pass
        ? mpTR("crit_rev_yes", c.sub)
        : mpTR("crit_rev_no", c.sub);
    }
    return copy;
  });
  const critHtml = criteria
    .map((c) => {
      const cls = c.neutral ? "neutral" : c.pass ? "pass" : "fail";
      return `<div class="mp-crit ${cls}">
        <span aria-hidden="true">${c.ico}</span>
        <p>${mpDyn(esc(c.label))} <i>${mpDyn(esc(c.sub))}</i></p>
        <span class="mp-crit-b">${esc(c.badge)}</span>
      </div>`;
    })
    .join("");

  return `<section class="mp-step ${num ? "" : "mp-step-seul"}" id="mp-step-exam">
    ${num ? `<span class="mp-step-num" aria-hidden="true">${num}</span>` : ""}
    <div class="mp-step-h">
      <h2 class="mp-step-t">${mpD("s3_title", "L'examen")}</h2>
      <span class="mp-step-s">${mpD("s3_sub", "le jour J se prépare ici")}</span>
    </div>

    <div class="mp-exam">
      <div id="mp-exam-countdown-body">${renderExamCountdown(examDate, examMod)}</div>
      ${verdictHtml}
      <div class="mp-prep">
        <div class="mp-prep-h">${mpD("prep_h", "Ta préparation")}</div>
        ${critHtml}
      </div>
    </div>

    <a class="mp-centre" id="mp-centre-link" href="#/centre-examen">
      ${medallion("carte", "blue", { size: 38 })}
      <div class="mp-centre-b">
        <div class="mp-centre-t">${mpD("centre_t", "Ton centre d'examen")}</div>
        <div class="mp-centre-s">${mpD("centre_s", "Difficulté · pièges du parcours · conseils sur place")}</div>
      </div>
      ${CHEVRON}
    </a>
  </section>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, ctx) {
  const { examMod } = ctx;

  root
    .querySelector("#mp-retry-2")
    ?.addEventListener("click", () => mount(root));
  root
    .querySelector("#mp-retry-3")
    ?.addEventListener("click", () => mount(root));

  root.querySelector("#mp-centre-link")?.addEventListener("click", () => {
    track("mon_permis.centre_examen_open");
  });

  wireExamCountdown(root, examMod);
}

function wireExamCountdown(root, examMod) {
  if (!examMod) return;

  root.querySelector("#mp-exam-choose")?.addEventListener("click", () => {
    const wrap = root.querySelector("#mp-exam-date-wrap");
    wrap?.classList.add("open");
    root.querySelector("#mp-exam-date-input")?.focus();
  });

  root.querySelector("#mp-exam-date-save")?.addEventListener("click", () => {
    const input = root.querySelector("#mp-exam-date-input");
    const val = input?.value;
    if (!val) return;
    examMod.saveExamDate(val);
    track("mon_permis.exam_date_set", { date: val });
    const body = root.querySelector("#mp-exam-countdown-body");
    if (body) {
      const d = new Date(val);
      body.innerHTML = renderExamCountdown(d, examMod);
      wireExamCountdown(root, examMod);
    }
  });
}

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "mon_permis_hub", role: me.role });

  root.innerHTML = skeleton();

  // Import dynamique des pages sœurs (jamais statique — cf. commentaire de
  // tête de fichier). Démarré immédiatement, en parallèle des requêtes DB.
  const examModP = import("@/pages/eleve/examen.js");
  const parcoursModP = import("@/pages/eleve/parcours.js");
  const examDataP = examModP.then((m) => m.loadData(me.id));

  const [valRes, profRes, examDataRes, parcoursModRes, examModRes, selfValRes] =
    await Promise.allSettled([
      sb
        .from("validations")
        .select("competence_id, statut")
        .eq("eleve_id", me.id),
      // ⚠️ Pas d'embed self-join ici : PostgREST résout
      // `moniteur:profiles!enseignant_id(prenom)` dans le sens INVERSE
      // (to-many : « les profils dont je suis l'enseignant ») → tableau vide
      // pour un élève, et la chip ne s'affichait jamais. Deux requêtes plates,
      // couvertes par la policy profiles_select (élève lit les profils
      // enseignant/gerant de son école).
      (async () => {
        const { data: moi, error } = await sb
          .from("profiles")
          .select("enseignant_id")
          .eq("id", me.id)
          .maybeSingle();
        if (error) return { data: null, error };
        if (!moi?.enseignant_id) return { data: null, error: null };
        return sb
          .from("profiles")
          .select("prenom")
          .eq("id", moi.enseignant_id)
          .maybeSingle();
      })(),
      examDataP,
      parcoursModP,
      examModP,
      // Validation autonome (élève SANS moniteur, pré-vente Pass Permis) :
      // table séparée de `validations`, fusionnée en LECTURE SEULE ci-dessous
      // pour que la progression du hub reste juste pour un compte solo.
      sb.from("self_validations").select("competence_id").eq("eleve_id", me.id),
    ]);

  const settledError = (result) =>
    result.status === "rejected"
      ? result.reason || new Error("Requête Supabase rejetée")
      : result.value?.error;
  const valError = settledError(valRes);
  const profError = settledError(profRes);
  const selfValError = settledError(selfValRes);
  const dataErrors = [
    ["validations", valError],
    ["profil moniteur", profError],
    ["auto-validations", selfValError],
  ].filter(([, error]) => error);
  if (dataErrors.length) {
    console.error(
      "[mon-permis] chargement partiel",
      Object.fromEntries(dataErrors),
    );
  }

  const examMod = examModRes.status === "fulfilled" ? examModRes.value : null;
  const parcoursMod =
    parcoursModRes.status === "fulfilled" ? parcoursModRes.value : null;

  // ── Étape 1 : compétences ──
  const valOk = !valError;
  const selfValOk = !selfValError;
  const validatedMap = {};
  if (valOk) {
    for (const v of valRes.value.data || []) {
      if (v.statut === "acquis") validatedMap[v.competence_id] = true;
    }
  }
  if (selfValOk) {
    for (const s of selfValRes.value.data || []) {
      if (!validatedMap[s.competence_id]) validatedMap[s.competence_id] = true;
    }
  }
  const step1Failed = !valOk || !selfValOk || !parcoursMod;
  const worldStates = step1Failed
    ? []
    : parcoursMod.computeWorldStates(validatedMap);
  const totalAcquis = worldStates.reduce((n, w) => n + w.done, 0);
  const allDone =
    worldStates.length > 0 && worldStates.every((w) => w.status === "complete");
  let currentIdx = worldStates.findIndex((w) => w.status === "in_progress");
  if (currentIdx === -1) {
    let lastComplete = 0;
    worldStates.forEach((w, i) => {
      if (w.status === "complete") lastComplete = i;
    });
    currentIdx = lastComplete;
  }
  const currentTitre = worldStates[currentIdx]?.world?.titre || "";

  const moniteurPrenom = !profError
    ? profRes.value?.data?.prenom || null
    : null;

  // ── Étape 2 : examen ──
  const examData =
    examDataRes.status === "fulfilled"
      ? examDataRes.value
      : { loadFailed: true };
  const examDate = examMod ? examMod.parseSavedDate() : null;

  // `solo` ne pilote plus la présence de l'étape « Mes leçons » (retirée pour
  // TOUS depuis le retrait du moniteur) : il ne sert plus qu'aux libellés.
  const solo = isSoloEleve(me);
  root.innerHTML = `${STYLE}
  <div class="mp anim-slide-up">
    <h1 class="mp-title" tabindex="-1">${mpD("title", "Mon permis")}</h1>
    ${renderChip(moniteurPrenom)}
    ${step1Failed ? "" : renderHero({ totalAcquis, currentTitre, allDone, solo })}
    <div class="mp-tl">
      ${renderStep3({ examMod, examData, examDate, solo })}
    </div>
  </div>`;

  wire(root, { examMod });

  // Deep-link « ?scroll=exam » (porte parcours.js → étape ③ du hub).
  try {
    const qs = (location.hash.split("?")[1] || "").replace(/^\?/, "");
    const params = new URLSearchParams(qs);
    if (params.get("scroll") === "exam") {
      requestAnimationFrame(() => {
        root
          .querySelector("#mp-step-exam")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  } catch {
    /* noop */
  }
}
