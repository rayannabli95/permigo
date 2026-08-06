// ═══════════════════════════════════════════════════════════════
// Élève — CERTIFIER une compétence de son parcours (TOUS les élèves)
// Route #/valider-seul/{compId} — CTA posé dans la fiche compétence de
// parcours.js (openFiche).
//
// Pivot 17/07 (décision Rayan) : l'élève avance SEUL dans son parcours —
// rattaché ou solo, il a de toute façon un enseignant dans la voiture. Le
// moniteur ne valide plus rien d'obligatoire ; il observe (livret : badge
// distinct, policy #512). `validations` (écrite par l'enseignant) reste une
// confirmation optionnelle jamais écrasée.
//
// Flow :
//   1. Relire la fiche de la compétence (rappel condensé + lien fiche).
//   2. Quiz de validation (quiz-engine.js, questions post_validation DB).
//   3. Score ≥ 80% → question de certification UNIFIÉE : « Tu te sens
//      prêt à passer à la suite ? ». L'élève certifie ce qui s'est
//      passé en vraie leçon (crédibilité : il n'a aucun intérêt à tricher,
//      son moniteur voit ses certifications).
//   4. Oui → RPC self_validate_competence (correction SERVEUR, table
//      self_validations séparée de `validations`) + 25 volants
//      (claim_competence_reward, idempotent).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import { lancerQuiz } from "@/services/quiz-engine.js";
import { findSubComp, findCategory } from "@/data/remc.js";
import { loadFiche } from "@/data/fiches-loader.js";
import { burstConfetti } from "@/components/common/confetti.js";
import { refreshGemmes } from "@/utils/game-state.js";
import { getLang } from "@/utils/lang.js";
import { findCarte } from "@/data/cartes.js";
import { chargerBoite, enregistrerBoite } from "@/utils/transmission.js";
import {
  monterMissions,
  missionsPour,
} from "@/components/eleve/pilote-mission.js";

// ⚠️ Le routeur RÉUTILISE le même nœud `root` d'une page à l'autre (il fait
// `root.innerHTML = ...`, jamais un nouveau conteneur). Toute écriture posée
// APRÈS un `await` (une requête réseau, une RPC) doit donc vérifier qu'aucune
// navigation n'a eu lieu entre-temps, sinon un résultat qui arrive en retard
// écrase la page suivante avec l'écran d'une AUTRE compétence — repéré en
// testant la boucle des 3 compétences gratuites (02/08) : quitter l'écran de
// résultat de C1a juste après avoir répondu au quiz laissait le score de C1a
// s'afficher par-dessus la fiche de C1b, quelques centaines de ms plus tard.
// `mount()` incrémente `_gen` à chaque montage ; toute fonction qui écrit
// dans `root` après un `await` capture `_gen` avant d'attendre et vérifie
// qu'il n'a pas changé avant d'écrire.
let _gen = 0;
export function unmount() {
  _gen++;
}

const NB_QUESTIONS = 5; // plus que le quiz-récap (3) : la barre doit avoir du sens
const SEUIL = 80; // barre INTERNE, jamais affichée : on ne parle pas en pourcentage
// Ce que l'élève lit : un nombre de bonnes réponses, pas une note sur cent
// (décision Rayan, 31/07/2026).
const MIN_JUSTES = Math.ceil((NB_QUESTIONS * SEUIL) / 100);

// ── i18n de la COQUE « certifier une compétence » (EN/AR) — le cœur du
// pivot (« Tu te sens prêt ? »). Dict LOCAL, repli FR intégral. Le CONTENU
// (nom de compétence, étapes de la fiche) reste en français. RTL : par
// <span dir="rtl"> autour du texte arabe affiché uniquement (app LTR).
const VS_I18N = {
  en: {
    back: "Back",
    kick: "Certification",
    loading: "Loading…",
    nf_title: "Skill not found",
    nf_title2: "This skill doesn't exist.",
    nf_body: "Go back to your journey to pick one.",
    load_title: "Verification unavailable",
    load_body:
      "We couldn't verify this skill. Check your connection and try again.",
    retry: "Try again",
    comp_fallback: "Skill",
    blocked_kick: "Already done",
    blocked_q:
      "This skill is already done. The quiz stays open to keep the move sharp.",
    blocked_m:
      "This skill is already done. The driving scene stays open to keep the move sharp.",
    self: "You already certified this skill. The quiz stays open for as much practice as you want.",
    self_m:
      "You already certified this skill. The driving scene stays open for as much practice as you want.",
    blocked_cta: "Replay the driving scene",
    blocked_quiz: "Retake the quiz",
    blocked_hint:
      "This practice changes nothing in your journey. It's just for the hand.",
    ent_kick: "Practice",
    ent_title: "The move is still there",
    ent_p: "“{n}” stays done in your journey. This practice changes nothing.",
    ent_cta: "Back to the journey",
    hero_p:
      "Have you already worked on this move in a real lesson? Certify it in 2 steps.",
    step1_t: "Re-read the method",
    step1_s: "A quick reminder of what you need to know.",
    fiche_link: "See the full sheet (fiche)",
    step2_t: "The certification quiz",
    step2_s: "{n} questions. You need {j} right to certify.",
    step2_m_t: "The driving scene",
    step2_m_s:
      "You get in the car and you make the move. A few questions then close the certification.",
    cta_m_start: "Get in the car",
    hint_m:
      "Be honest with yourself. None of this replaces a real driving lesson.",
    mr_kick: "Not yet",
    mr_title: "Let's go back to the sheet",
    mr_p: "The move isn't in place yet on “{n}”. Re-read the sheet calmly, then come back and do it again.",
    mr_retry: "Re-read the sheet and retry",
    mr_back: "Back to the journey",
    cta_start: "Start the quiz",
    hint: "Be honest with yourself. This quiz never replaces a real driving lesson.",
    toast_noq: "No questions on this skill yet. Try again later.",
    toast_nopressure: "No pressure. Come back when you feel it.",
    toast_valerr: "Something went wrong while validating. Try again.",
    toast_neterr: "Network error. Try again.",
    ok_kick: "Certified by you",
    ok_title: "Skill certified!",
    ok_p: "“{n}” is now done in your journey.",
    ok_volants: "+{n} Steering wheels (volants)",
    ok_vaut:
      "It becomes done in My licence. It replaces neither the lesson nor the test.",
    ok_encourage: "One more move that will stick with you on the road.",
    ok_cta: "Find this skill in My licence",
    fail_kick: "Not yet",
    fail_title: "Almost!",
    fail_p: "“{n}” isn't yours yet. Re-read the sheet, then try again.",
    fail_title_loin: "Let's go back to the sheet",
    fail_p_loin:
      "Some landmarks are still missing on “{n}”. Re-read the sheet calmly, and bring it up with your instructor at your next lesson.",
    fail_retry: "Re-read the sheet and retry",
    fail_back: "Back to the journey",
    cf_kick: "Quiz passed",
    cf_title: "Do you feel ready to move on?",
    cf_p: "By certifying “{n}”, you confirm this move is done in a real lesson.",
    cf_yes: "Yes I certify",
    cf_no: "Not yet",
    boite_kick: "One question first",
    boite_title: "Which car do you drive?",
    boite_p:
      "The questions aren't the same with or without a clutch. We'll ask you the ones for your car.",
    boite_manuelle: "Manual gearbox",
    boite_manuelle_s: "Three pedals and a gear lever",
    boite_auto: "Automatic gearbox",
    boite_auto_s: "Two pedals and a P R N D selector",
    boite_hint: "You can change this in your settings.",
  },
  ar: {
    back: "رجوع",
    kick: "مصادقة",
    loading: "جارٍ التحميل…",
    nf_title: "المهارة غير موجودة",
    nf_title2: "هذه المهارة غير موجودة.",
    nf_body: "عد إلى مسارك لاختيار واحدة.",
    load_title: "التحقق غير متاح",
    load_body: "تعذّر التحقق من هذه المهارة. افحص اتصالك وحاول مجددًا.",
    retry: "أعد المحاولة",
    comp_fallback: "مهارة",
    blocked_kick: "مكتسبة سلفًا",
    blocked_q:
      "هذه المهارة مكتسبة سلفًا. ويبقى الاختبار مفتوحًا للحفاظ على الحركة.",
    blocked_m:
      "هذه المهارة مكتسبة سلفًا. ويبقى المشهد العملي مفتوحًا للحفاظ على الحركة.",
    self: "لقد صادقت سلفًا على هذه المهارة. ويبقى الاختبار مفتوحًا للتدرّب كما تشاء.",
    self_m:
      "لقد صادقت سلفًا على هذه المهارة. ويبقى المشهد العملي مفتوحًا للتدرّب كما تشاء.",
    blocked_cta: "أعد المشهد العملي",
    blocked_quiz: "أعد الاختبار",
    blocked_hint: "هذا التمرين لا يغيّر شيئًا في مسارك. إنه لليد فقط.",
    ent_kick: "تمرين",
    ent_title: "الحركة ما زالت حاضرة",
    ent_p: "«{n}» تبقى مكتسبة في مسارك. وهذا التمرين لا يغيّر شيئًا.",
    ent_cta: "العودة إلى المسار",
    hero_p: "هل تدرّبت على هذه الحركة في درس حقيقي؟ صادق عليها في خطوتين.",
    step1_t: "أعد قراءة الطريقة",
    step1_s: "تذكير سريع بما يجب أن تتقنه.",
    fiche_link: "اعرض البطاقة الكاملة (fiche)",
    step2_t: "اختبار المصادقة",
    step2_s: "{n} أسئلة. تحتاج إلى {j} إجابات صحيحة للمصادقة.",
    step2_m_t: "المشهد العملي",
    step2_m_s:
      "تركب السيارة وتؤدّي الحركة. ثم تُغلق بضعة أسئلة عملية المصادقة.",
    cta_m_start: "اركب السيارة",
    hint_m: "كن صادقًا مع نفسك. لا شيء من هذا يعوّض درس قيادة حقيقيًا.",
    mr_kick: "ليس بعد",
    mr_title: "نعود إلى البطاقة",
    mr_p: "الحركة لم تستقرّ بعد في «{n}». أعد قراءة البطاقة بهدوء ثم عد لتؤدّيها من جديد.",
    mr_retry: "أعد قراءة البطاقة وحاول مجددًا",
    mr_back: "العودة إلى المسار",
    cta_start: "ابدأ الاختبار",
    hint: "كن صادقًا مع نفسك. هذا الاختبار لا يعوّض درس قيادة حقيقيًا.",
    toast_noq: "لا أسئلة على هذه المهارة بعد. أعد المحاولة لاحقًا.",
    toast_nopressure: "لا ضغط. عد متى شعرت بالجاهزية.",
    toast_valerr: "حدث خطأ أثناء المصادقة. أعد المحاولة.",
    toast_neterr: "خطأ في الشبكة. أعد المحاولة.",
    ok_kick: "صادقت عليها بنفسك",
    ok_title: "تمت المصادقة على المهارة!",
    ok_p: "«{n}» أصبحت الآن مكتملة في مسارك.",
    ok_volants: "+{n} مقود (volants)",
    ok_vaut: "تصبح مكتسبة في «رخصتي». وهي لا تعوّض الدرس ولا الامتحان.",
    ok_encourage: "حركة إضافية لن تفارقك على الطريق.",
    ok_cta: "اعثر على هذه المهارة في رخصتي",
    fail_kick: "ليس بعد",
    fail_title: "اقتربت!",
    fail_p: "«{n}» ليست مكتسبة بعد. أعد قراءة البطاقة ثم حاول مجددًا.",
    fail_title_loin: "نعود إلى البطاقة",
    fail_p_loin:
      "ما زالت تنقصك بعض المعالم في «{n}». أعد قراءة البطاقة بهدوء، وتحدّث عنها مع مدرّبك في الدرس القادم.",
    fail_retry: "أعد قراءة البطاقة وحاول مجددًا",
    fail_back: "العودة إلى المسار",
    cf_kick: "نجحت في الاختبار",
    cf_title: "هل تشعر أنك جاهز للانتقال إلى ما بعدها؟",
    cf_p: "بمصادقتك على «{n}» تؤكد أن هذه الحركة أُنجزت في درس حقيقي.",
    cf_yes: "نعم أصادق",
    cf_no: "ليس بعد",
    boite_kick: "سؤال واحد أولًا",
    boite_title: "أي سيارة تقود؟",
    boite_p:
      "الأسئلة ليست نفسها مع وجود القابض أو بدونه. سنطرح عليك أسئلة سيارتك.",
    boite_manuelle: "علبة سرعة يدوية",
    boite_manuelle_s: "ثلاث دواسات وعصا نقل السرعات",
    boite_auto: "علبة سرعة أوتوماتيكية",
    boite_auto_s: "دواستان ومُحدِّد P R N D",
    boite_hint: "يمكنك تغيير ذلك في الإعدادات.",
  },
};
function vsTR(key, fr, vars) {
  const l = getLang();
  let s = (l !== "fr" && VS_I18N[l]?.[key]) || fr;
  if (vars)
    for (const [k, v] of Object.entries(vars))
      s = s.split(`{${k}}`).join(String(v));
  return s;
}
function vsT(key, fr, vars) {
  return esc(vsTR(key, fr, vars));
}
function vsRtl(escaped) {
  const s = escaped.replace(
    /\d+(?:\s*\/\s*\d+)?(?:\s*%)?/g,
    (m) => `<span dir="ltr">${m}</span>`,
  );
  return `<span dir="rtl">${s}</span>`;
}
function vsD(key, fr, vars) {
  const l = getLang();
  const out = esc(vsTR(key, fr, vars));
  return l === "ar" && VS_I18N.ar?.[key] ? vsRtl(out) : out;
}

const STYLE = `<style>
.vs { max-width: 480px; margin: 0 auto; padding: 0 16px calc(110px + env(safe-area-inset-bottom));
  font-family: 'Archivo', sans-serif; color: var(--ink); }
.vs-top { display:flex; align-items:center; gap:10px; padding:16px 0 8px; }
.vs-back { width:44px; height:44px; border-radius:11px; border:0; cursor:pointer;
  background: var(--su, #fff); color: var(--ink); font-size:20px; line-height:1;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-shrink:0; }
.vs-back:active { transform: scale(0.95); }
.vs-kick { font:700 11px/1 'Archivo',sans-serif; letter-spacing:.1em; text-transform:uppercase; color:var(--a-txt,var(--a)); margin:0 0 2px; }
.vs-h1 { font:800 21px/1.2 'Archivo',sans-serif; letter-spacing:-.02em; margin:0; }

.vs-card { background:var(--su,#fff); border:1px solid var(--bo); border-radius:20px; padding:18px; margin-top:16px; box-shadow:0 4px 18px -12px rgba(11,13,26,.25); }

.vs-hero { text-align:center; padding:6px 4px 4px; }
.vs-hero-med { margin:0 auto 10px; width:56px; height:56px; }
.vs-hero-cat { font:700 10px/1 'Archivo',sans-serif; letter-spacing:.14em; text-transform:uppercase; color:var(--mu2); margin-bottom:6px; }
.vs-hero-ttl { font:800 19px/1.25 'Archivo',sans-serif; margin:0 0 8px; }
.vs-hero-p { font:500 13.5px/1.55 'Archivo',sans-serif; color:var(--mu); margin:0; }
.vs-hero-ic { margin:0 auto 12px; width:52px; height:52px; border-radius:50%; display:grid; place-items:center;
  background:color-mix(in srgb, var(--am,#f59e0b) 14%, transparent); color:var(--am,#f59e0b); }

.vs-steps { margin-top:18px; display:flex; flex-direction:column; gap:10px; }
.vs-step { display:flex; gap:12px; align-items:flex-start; background:var(--su,#fff); border:1px solid var(--bo); border-radius:16px; padding:14px; }
.vs-step-n { flex-shrink:0; width:26px; height:26px; border-radius:50%; background:var(--a); color:var(--a-ink);
  display:flex; align-items:center; justify-content:center; font:800 13px/1 'Archivo',sans-serif; }
.vs-step-tx { flex:1; min-width:0; }
.vs-step-tx b { display:block; font:700 14px/1.3 'Archivo',sans-serif; margin-bottom:2px; }
.vs-step-tx span { font:500 12.5px/1.5 'Archivo',sans-serif; color:var(--mu); }
.vs-step-fiche { margin-top:10px; }
.vs-fiche-list { margin:8px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px; }
.vs-fiche-list li { display:flex; gap:8px; font:500 13px/1.45 'Archivo',sans-serif; color:var(--ink); }
.vs-fiche-list b { flex-shrink:0; color:var(--a-txt,var(--a)); font:800 12px/1.5 'IBM Plex Mono',monospace; }
.vs-fiche-link { display:inline-flex; align-items:center; gap:6px; margin-top:10px; font:700 12.5px/1 'Archivo',sans-serif; color:var(--a-txt,var(--a)); text-decoration:none; }

.vs-cta { width:100%; margin-top:20px; padding:17px; border:0; border-radius:16px; cursor:pointer;
  font:800 15.5px/1 'Archivo',sans-serif; color:var(--a-ink);
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--a) 40%, transparent), inset 0 1.5px 0 rgba(255,255,255,.28);
  display:flex; align-items:center; justify-content:center; gap:9px;
  transition: transform .15s, opacity .15s; }
.vs-cta:disabled { opacity:.55; cursor:not-allowed; }
.vs-cta:not(:disabled):active { transform: scale(.98); }
a.vs-cta { text-decoration:none; }
/* Deuxième porte d'un écran d'entraînement : présente, jamais dominante. */
.vs-second { width:100%; margin-top:11px; padding:15px; border-radius:15px; cursor:pointer; text-decoration:none;
  border:1.5px solid var(--bo); background:var(--su); color:var(--ink);
  font:800 14.5px/1 'Archivo',sans-serif;
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition: transform .15s; }
.vs-second:active { transform: scale(.98); }
.vs-hint { text-align:center; margin:10px 0 0; font:600 12px/1.5 'Archivo',sans-serif; color:var(--mu2); }

/* ── Écran résultat : DA Arène nuit-violet + or (célébration) ── */
.vsr { position:relative; min-height: calc(100dvh - 60px); padding: 30px 20px calc(120px + env(safe-area-inset-bottom));
  color:#f2f0fa; font-family:'Archivo',sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
  background:
    radial-gradient(120% 55% at 50% -5%, rgba(255,190,70,.12) 0%, transparent 55%),
    radial-gradient(120% 60% at 50% 22%, rgba(110,70,220,.24) 0%, transparent 62%),
    linear-gradient(180deg,#181241 0%,#0f0d24 58%,#0b0a1c 100%); }
.vsr-med { width:96px; height:96px; margin-bottom:16px; animation: vsrPop .5s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes vsrPop { from { opacity:0; transform:scale(.7); } to { opacity:1; transform:scale(1); } }
.vsr-kick { display:inline-flex; align-items:center; gap:6px; font:800 11px/1 'Archivo',sans-serif; letter-spacing:.12em; text-transform:uppercase;
  color:#ffd76e; background:rgba(255,210,74,.12); border:1px solid rgba(255,210,74,.3); padding:6px 14px; border-radius:99px; margin-bottom:14px; }
.vsr-ttl { font:800 25px/1.2 'Archivo', system-ui, sans-serif; margin:0 0 8px;
  background:linear-gradient(180deg,#ffe9b0,#f5b73d); -webkit-background-clip:text; background-clip:text; color:transparent; }
.vsr-p { font:500 14px/1.55 'Archivo',sans-serif; color:#cabfef; margin:0 0 4px; max-width:320px; }
.vsr-score { font:800 13px/1 'Archivo',sans-serif; color:#8ef0b0; margin:10px 0 0; }
.vsr-volants { display:inline-flex; align-items:center; gap:8px; margin:16px 0 0; padding:9px 16px; border-radius:99px;
  font:800 14px/1 'Archivo',sans-serif; color:#ffd76e;
  background:rgba(255,210,74,.12); border:1px solid rgba(255,210,74,.3); }
.vsr-volants img { width:22px; height:22px; }
.vsr-cta { width:100%; max-width:340px; margin-top:26px; padding:16px; border:0; border-radius:14px; cursor:pointer;
  font:800 15px/1 'Archivo',sans-serif; color:#4a2500;
  background:linear-gradient(180deg,#ffd76e,#f0a93f); box-shadow:0 6px 0 #b46a10, 0 12px 22px rgba(0,0,0,.4); }
.vsr-cta:active { transform:translateY(3px); box-shadow:0 3px 0 #b46a10, 0 7px 14px rgba(0,0,0,.4); }
.vsr-ghost { width:100%; max-width:340px; margin-top:10px; padding:14px; border:1.5px solid rgba(255,255,255,.35); background:transparent; color:#fff;
  border-radius:14px; cursor:pointer; font:700 13.5px/1 'Archivo',sans-serif; }
.vsr-ghost:active { transform: scale(.98); }
.vsr.fail .vsr-kick { color:#ffb0b0; background:rgba(255,120,120,.1); border-color:rgba(255,120,120,.28); }
.vsr.fail .vsr-ttl { background:linear-gradient(180deg,#ffd0d0,#ff9c9c); -webkit-background-clip:text; background-clip:text; color:transparent; }

@media (prefers-reduced-motion: reduce) { .vsr-med { animation:none; } }
</style>`;

function catMedallion(ico, size = 40) {
  const RAMP = {
    "world-c1": "gold",
    "world-c2": "blue",
    "world-c3": "violet",
    "world-c4": "gold",
  };
  return medallion("bouclier", RAMP[ico] || "violet", { size });
}

function topBar(title) {
  return `<div class="vs-top">
      <button class="vs-back" aria-label="${vsT("back", "Retour")}">←</button>
      <div><p class="vs-kick">${vsD("kick", "Certification")}</p><h1 class="vs-h1" tabindex="-1">${esc(title)}</h1></div>
    </div>`;
}

function skeleton() {
  return `${STYLE}<div class="vs">${topBar(vsTR("loading", "Chargement…"))}</div>`;
}

function wireBack(root) {
  root
    .querySelector(".vs-back")
    ?.addEventListener("click", () => navigate("#/parcours"));
}

function notFoundScreen() {
  return `${STYLE}<div class="vs anim-slide-up">
    ${topBar(vsTR("nf_title", "Compétence introuvable"))}
    <div class="vs-card vs-hero">
      <div class="vs-hero-ic">${icon("alert-circle", { size: 24 })}</div>
      <h2 class="vs-hero-ttl">${vsD("nf_title2", "Cette compétence n'existe pas")}</h2>
      <p class="vs-hero-p">${vsD("nf_body", "Retourne à ton parcours pour en choisir une.")}</p>
    </div>
  </div>`;
}

/**
 * L'écran d'une compétence DÉJÀ acquise. Ce n'est plus une porte fermée.
 *
 * « Rien à faire ici » était vrai quand il n'y avait qu'un quiz de
 * certification derrière. Aujourd'hui il reste toujours quelque chose à
 * faire : rejouer la mise en situation, ou refaire le quiz. Le geste
 * s'entretient, la certification non.
 *
 * `parMoi` : la compétence a été certifiée par l'élève lui-même (et non
 * validée par son enseignant) — la phrase ne peut pas être la même.
 */
function blockedScreen(sub, avecMission, parMoi = false, cat = null) {
  // Le « : » n'est pas encodé : c'est le séparateur que lit revision-conduite
  // pour ouvrir le quiz directement, pas une donnée.
  const quizHref = `#/revision-conduite/${encodeURIComponent(String(sub?.c ?? ""))}:quiz`;
  const phrase = parMoi
    ? avecMission
      ? vsD(
          "self_m",
          "La mise en situation reste ouverte pour t'entraîner autant que tu veux.",
        )
      : vsD("self", "Le quiz reste ouvert pour t'entraîner autant que tu veux.")
    : avecMission
      ? // ⚠️ Ne JAMAIS nommer l'enseignant sur l'écran de certification. On y
        // entre pour relever un défi, et s'entendre dire « quelqu'un d'autre a
        // déjà validé pour toi » vide le geste de son sens à la seconde où on
        // arrive. Le résultat affiché est le même, la phrase parle de l'élève.
        vsD(
          "blocked_m",
          "La mise en situation reste ouverte pour entretenir le geste.",
        )
      : vsD("blocked_q", "Le quiz reste ouvert pour entretenir le geste.");

  return `${STYLE}<div class="vs anim-slide-up">
    ${topBar(sub?.n || vsTR("comp_fallback", "Compétence"))}
    <div class="vs-card vs-hero">
      <div class="vs-hero-med">${catMedallion(cat?.ico, 56)}</div>
      <p class="vs-hero-cat">${vsD("blocked_kick", "Déjà acquise")}</p>
      <h2 class="vs-hero-ttl">${esc(sub?.n || "")}</h2>
      <p class="vs-hero-p">${phrase}</p>
    </div>
    ${
      avecMission
        ? `<button class="vs-cta" id="vs-rejouer" type="button">${icon("zap", { size: 18 })} ${vsD("blocked_cta", "Refaire la mise en situation")}</button>
           <a class="vs-second" href="${escAttr(quizHref)}">${vsD("blocked_quiz", "Refaire le quiz")}</a>`
        : `<a class="vs-cta" href="${escAttr(quizHref)}">${icon("zap", { size: 18 })} ${vsD("blocked_quiz", "Refaire le quiz")}</a>`
    }
    <p class="vs-hint">${vsD("blocked_hint", "Cet entraînement ne change rien à ton parcours. Il est juste là pour la main.")}</p>
  </div>`;
}

function loadErrorScreen(sub) {
  return `${STYLE}<div class="vs anim-slide-up">
    ${topBar(sub?.n || vsTR("comp_fallback", "Compétence"))}
    <div class="vs-card vs-hero">
      <div class="vs-hero-ic">${icon("alert-circle", { size: 24 })}</div>
      <h2 class="vs-hero-ttl">${vsD("load_title", "Vérification indisponible")}</h2>
      <p class="vs-hero-p">${vsD("load_body", "Vérifie ta connexion puis réessaie.")}</p>
    </div>
    <button class="vs-cta" id="vs-retry-load" type="button">${vsD("retry", "Réessayer")}</button>
  </div>`;
}

/**
 * La boîte de vitesses, demandée une seule fois, juste avant le premier quiz.
 *
 * Audit du 01/08/2026 : les questions de certification étaient écrites pour la
 * boîte manuelle. Sur « Démarrer et s'arrêter », les six questions parlaient de
 * l'embrayage. On demande donc la voiture de l'élève au moment exact où la
 * réponse change ce qu'il va lire, et jamais plus ensuite.
 */
function boiteScreen(sub) {
  return `${STYLE}
    <style>
    .vs-boite { display:flex; flex-direction:column; gap:11px; margin-top:18px; }
    .vs-boite button { display:flex; align-items:center; gap:13px; width:100%; padding:16px 17px; cursor:pointer;
      text-align:left; border-radius:17px; border:1.5px solid var(--bo); background:var(--su); }
    .vs-boite button:active { transform:scale(.985); }
    .vs-boite b { display:block; font:800 15px/1.2 'Archivo',sans-serif; color:var(--ink); }
    .vs-boite span { display:block; font:500 12.5px/1.35 'Archivo',sans-serif; color:var(--mu); margin-top:3px; }
    .vs-boite i { flex:none; width:40px; height:40px; border-radius:12px; display:grid; place-items:center;
      background:color-mix(in srgb, var(--a) 12%, transparent); color:var(--a-txt,var(--a));
      font:800 14px/1 'Archivo',sans-serif; font-style:normal; }
    </style>
    <div class="vs anim-slide-up">
    ${topBar(sub.n)}
    <div class="vs-card vs-hero">
      <p class="vs-hero-cat">${vsD("boite_kick", "Une question avant")}</p>
      <h2 class="vs-hero-ttl">${vsD("boite_title", "Tu conduis quelle voiture ?")}</h2>
      <p class="vs-hero-p">${vsD("boite_p", "Les questions ne sont pas les mêmes avec ou sans embrayage. On te pose celles de ta voiture.")}</p>
    </div>
    <div class="vs-boite">
      <button type="button" data-boite="manuelle">
        <i aria-hidden="true">1-5</i>
        <span class="vs-boite-tx"><b>${vsD("boite_manuelle", "Boîte manuelle")}</b><span>${vsD("boite_manuelle_s", "Trois pédales et un levier de vitesses")}</span></span>
      </button>
      <button type="button" data-boite="auto">
        <i aria-hidden="true">PRND</i>
        <span class="vs-boite-tx"><b>${vsD("boite_auto", "Boîte automatique")}</b><span>${vsD("boite_auto_s", "Deux pédales et un sélecteur P R N D")}</span></span>
      </button>
    </div>
    <p class="vs-hint">${vsD("boite_hint", "Tu pourras le changer dans tes réglages.")}</p>
  </div>`;
}

// Cet écran ne voit plus que des compétences PAS ENCORE acquises : une
// compétence déjà certifiée part sur l'écran d'entraînement (blockedScreen)
// avant d'arriver ici. Le bandeau « déjà certifiée » et les libellés
// « repasser le quiz » sont donc partis avec.
function introScreen(sub, cat, fiche, avecMission) {
  const ficheHref = `#/revision-conduite/${encodeURIComponent(String(sub.c ?? ""))}`;
  const steps = (fiche?.methode || []).slice(0, 4);
  const ficheList = steps.length
    ? `<ul class="vs-fiche-list">${steps.map((s, i) => `<li><b>${String(i + 1).padStart(2, "0")}</b>${esc(s)}</li>`).join("")}</ul>`
    : "";

  return `${STYLE}<div class="vs anim-slide-up">
    ${topBar(sub.n)}

    <div class="vs-card vs-hero">
      <div class="vs-hero-med">${catMedallion(cat?.ico, 56)}</div>
      <p class="vs-hero-cat">${esc(cat?.name || "")}</p>
      <h2 class="vs-hero-ttl">${esc(sub.n)}</h2>
      <p class="vs-hero-p">${vsD("hero_p", "Tu as déjà travaillé ce geste en vraie leçon ? Certifie-le en 2 étapes.")}</p>
    </div>

    <div class="vs-steps">
      <div class="vs-step">
        <div class="vs-step-n">1</div>
        <div class="vs-step-tx">
          <b>${vsD("step1_t", "Relis la méthode")}</b>
          <span>${vsD("step1_s", "Un rappel rapide de ce qu'il faut maîtriser.")}</span>
          <div class="vs-step-fiche">${ficheList}</div>
          <a class="vs-fiche-link" href="${escAttr(ficheHref)}">${icon("book", { size: 14 })} ${vsD("fiche_link", "Voir la fiche complète")}</a>
        </div>
      </div>
      <div class="vs-step">
        <div class="vs-step-n">2</div>
        <div class="vs-step-tx">
          <b>${avecMission ? vsD("step2_m_t", "La mise en situation") : vsD("step2_t", "Le quiz de certification")}</b>
          <span>${
            avecMission
              ? vsD(
                  "step2_m_s",
                  "Tu montes dans la voiture et tu fais le geste. Quelques questions ferment la certification.",
                )
              : vsD(
                  "step2_s",
                  `${NB_QUESTIONS} questions. Il t'en faut ${MIN_JUSTES} justes pour certifier.`,
                  { n: NB_QUESTIONS, j: MIN_JUSTES },
                )
          }</span>
        </div>
      </div>
    </div>

    <!-- La phrase honnête passe AVANT le bouton : sous le bouton, personne
         ne la lisait (audit 01/08). -->
    <p class="vs-hint">${avecMission ? vsD("hint_m", "Sois honnête avec toi-même. Rien de tout ça ne remplace une vraie leçon de conduite.") : vsD("hint", "Sois honnête avec toi-même. Ce quiz ne remplace pas une vraie leçon de conduite.")}</p>
    <button class="vs-cta" id="vs-start-quiz" type="button">${icon("zap", { size: 18 })} ${
      avecMission
        ? vsD("cta_m_start", "Monter dans la voiture")
        : vsD("cta_start", "Commencer le quiz")
    }</button>
  </div>`;
}

function successScreen(sub, scorePct, volants = 0) {
  const carte = findCarte(sub.c);
  // Les 31 compétences ont toutes leur carte : `carte` n'est jamais vide en
  // pratique aujourd'hui. Il y avait ici une vidéo mascotte en repli, jamais
  // vue par personne (audit Rayan 06/08). Retirée : la mascotte vit
  // maintenant à chaque question du quiz, pas sur cet écran.
  //
  // La carte se révèle UNE fois (vsrCarte), puis garde un gloss permanent
  // (vsr-carte-gloss) qui lui donne la texture d'un objet de collection.
  const carteBlock = carte
    ? `<div class="vsr-carte">
        <img class="vsr-carte-img" src="${esc(carte.img)}" alt="Carte ${esc(carte.n)}" draggable="false">
        <i class="vsr-carte-gloss"></i>
        <div class="vsr-carte-shine"></div>
      </div>`
    : "";
  return `${STYLE}
    <style>
    .vsr-carte { position:relative; width:172px; aspect-ratio:5/7; margin:4px auto 6px; border-radius:18px; overflow:hidden;
      box-shadow:0 18px 40px -14px rgba(0,0,0,.7), 0 0 0 3px rgba(255,215,110,.4);
      animation: vsrCarte .8s cubic-bezier(.34,1.56,.64,1) both; }
    .vsr-carte-img { width:100%; height:100%; object-fit:cover; display:block; }
    /* gloss permanent : bande brillante fixe + léger balayage lent */
    .vsr-carte-gloss { position:absolute; inset:0; pointer-events:none; mix-blend-mode:screen;
      background:linear-gradient(125deg, transparent 38%, rgba(255,255,255,.10) 46%, rgba(255,255,255,.42) 50%, rgba(255,255,255,.10) 54%, transparent 62%);
      background-size:250% 250%; background-position:120% 0; animation: vsrGloss 5.5s ease-in-out 1.3s infinite; }
    .vsr-carte-shine { position:absolute; inset:0; background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 62%);
      transform:translateX(-120%); animation: vsrShine 1.1s ease .5s 1 both; }
    @keyframes vsrCarte { 0%{opacity:0; transform:scale(.55) rotate(-9deg);} 60%{transform:scale(1.06) rotate(2deg);} 100%{opacity:1; transform:scale(1) rotate(0);} }
    @keyframes vsrShine { to { transform:translateX(120%); } }
    @keyframes vsrGloss { 0%{background-position:120% 0;} 50%{background-position:-20% 0;} 100%{background-position:120% 0;} }
    .vsr-name { font:800 17px/1.25 'Archivo',sans-serif; color:#fff; margin:2px 0 0; max-width:300px; }
    .vsr-encourage { font:700 14.5px/1.4 'Archivo',sans-serif; color:#ffe9b0; margin:10px auto 0; max-width:290px; }
    .vsr-vaut { font:600 12.5px/1.5 'Archivo',sans-serif; color:rgba(255,255,255,.72); margin:9px auto 0; max-width:310px; }
    .vsr-cta-carte { width:100%; max-width:340px; margin-top:20px; padding:15px; border:0; border-radius:14px; cursor:pointer;
      font:800 14px/1 'Archivo',sans-serif; color:#4a2500;
      background:linear-gradient(180deg,#ffd76e,#f0a93f); box-shadow:0 6px 0 #b46a10, 0 12px 22px rgba(0,0,0,.4); }
    .vsr-cta-carte:active { transform:translateY(3px); box-shadow:0 3px 0 #b46a10, 0 7px 14px rgba(0,0,0,.4); }
    @media (prefers-reduced-motion: reduce) { .vsr-carte, .vsr-carte-shine, .vsr-carte-gloss { animation:none; } .vsr-carte-shine { display:none; } }
    </style>
    <div class="vsr anim-slide-up">
    ${carteBlock}
    <h1 class="vsr-ttl">${vsD("ok_title", "Compétence certifiée")}</h1>
    <p class="vsr-name">${esc(sub.n)}</p>
    <!-- Le texte qui doit marquer, pas juste le score (Rayan, 06/08) : on
         parle de la route, pas de l'app. -->
    <p class="vsr-encourage">${vsD("ok_encourage", "Un geste de plus qui ne te lâchera plus sur la route.")}</p>
    <!-- Ce que ça vaut, dit une fois, au moment où on vient de le donner.
         Aucun écran ne le disait (audit 01/08) : entre « compétence
         certifiée », une carte à collectionner et des volants, un élève ne
         sait plus s'il est dans un jeu ou dans un suivi sérieux. -->
    <p class="vsr-vaut">${vsD("ok_vaut", "Elle passe en acquise dans Mon permis. Ça ne remplace ni la leçon ni l'examen.")}</p>
    ${volants > 0 ? `<span class="vsr-volants"><img src="/skins/volant-coin.webp" alt="volant"> +${volants}</span>` : ""}
    ${carte ? `<button class="vsr-cta-carte" id="vs-cta-carte" type="button">${vsD("ok_cta_carte", "Voir ma carte")}</button>` : ""}
    <button class="vsr-ghost" id="vs-cta-parcours" type="button" data-comp="${escAttr(sub.c)}">${vsD("ok_cta", "Retrouve cette compétence dans Mon permis")}</button>
  </div>`;
}

/**
 * L'écran d'échec disait « Presque ! » à quelqu'un qui n'avait rien eu de
 * juste (audit 01/08). C'est gentil, c'est faux, et ça n'aide pas à savoir
 * quoi relire. On distingue donc celui qui a frôlé de celui qui découvre.
 */
function failScreen(sub, scorePct) {
  const presque = scorePct >= 50;
  return `${STYLE}<div class="vsr fail anim-slide-up">
    <div class="vsr-med">${medallion("faute", "orange", { size: 96 })}</div>
    <span class="vsr-kick">${icon("x", { size: 13 })} ${vsD("fail_kick", "Pas encore")}</span>
    <h1 class="vsr-ttl">${presque ? vsD("fail_title", "Presque !") : vsD("fail_title_loin", "On reprend depuis la fiche")}</h1>
    <p class="vsr-p">${
      presque
        ? vsD(
            "fail_p",
            `« ${sub.n} » n'est pas encore acquise. Relis la fiche, puis retente.`,
            { n: sub.n },
          )
        : vsD(
            "fail_p_loin",
            `Il manque encore des repères sur « ${sub.n} ». Relis la fiche tranquillement, et parles-en à ton enseignant à ta prochaine leçon.`,
            { n: sub.n },
          )
    }</p>
    <button class="vsr-cta" id="vs-retry" type="button">${vsD("fail_retry", "Relire la fiche et retenter")}</button>
    <button class="vsr-ghost" id="vs-cta-parcours" type="button">${vsD("fail_back", "Retour au parcours")}</button>
  </div>`;
}

export async function mount(root, param) {
  const me = getCurUser();
  if (!me) return;

  // Nouveau montage = nouvelle génération : toute écriture encore en vol
  // depuis la page précédente (ou une frappe rapide sur cette même page,
  // ex. clic sur « réessayer » pendant que le premier chargement tourne
  // encore) doit se reconnaître périmée et ne rien écrire.
  const gen = ++_gen;

  const compId = param || null;
  const sub = compId ? findSubComp(compId) : null;
  const cat = compId ? findCategory(compId) : null;

  if (!compId || !sub || !cat) {
    root.innerHTML = notFoundScreen();
    wireBack(root);
    return;
  }

  track("page_view", {
    page: "valider_seul",
    role: me.role,
    competence_id: compId,
  });

  root.innerHTML = skeleton();
  const fichePromise = loadFiche(compId).catch(() => null);

  // Garde-fou côté AFFICHAGE (la vraie garantie est côté RPC — jamais
  // confiance au client). Ouvert à TOUS les élèves depuis le pivot 17/07 ;
  // seul cas fermé : le moniteur a déjà validé (rien à certifier).
  const [valRes, selfRes] = await Promise.allSettled([
    sb
      .from("validations")
      .select("statut")
      .eq("eleve_id", me.id)
      .eq("competence_id", compId)
      .maybeSingle(),
    sb
      .from("self_validations")
      .select("score, validated_at")
      .eq("eleve_id", me.id)
      .eq("competence_id", compId)
      .maybeSingle(),
  ]);
  if (gen !== _gen) return; // l'élève a déjà quitté cette compétence

  const valError =
    valRes.status === "rejected"
      ? valRes.reason || new Error("Lecture des validations rejetée")
      : valRes.value?.error;
  const selfError =
    selfRes.status === "rejected"
      ? selfRes.reason || new Error("Lecture des auto-validations rejetée")
      : selfRes.value?.error;
  if (valError || selfError) {
    console.error("[valider-seul] vérification initiale", {
      validations: valError || null,
      selfValidations: selfError || null,
    });
    root.innerHTML = loadErrorScreen(sub);
    wireBack(root);
    root
      .querySelector("#vs-retry-load")
      ?.addEventListener("click", () => mount(root, compId));
    return;
  }

  const acquisMoniteur = valRes.value.data?.statut === "acquis";
  const already = selfRes.value.data || null;
  const fiche = await fichePromise;
  if (gen !== _gen) return;

  // La boîte est peut-être inconnue à ce stade : on demande alors les missions
  // sans filtre. Le libellé peut donc annoncer une mise en situation qui sera
  // filtrée juste après, jamais l'inverse (aucune compétence n'a de mission
  // pour une seule boîte sans en avoir pour l'autre).
  const avecMission = missionsPour(compId, await chargerBoite()).length > 0;
  if (gen !== _gen) return;

  // Acquise ne veut pas dire fermée. Un geste, ça s'entretient : la mission et
  // le quiz restent rejouables pour s'entraîner, ils ne certifient simplement
  // plus rien. Vaut pour les deux façons d'être acquise — validée par
  // l'enseignant, ou certifiée par l'élève lui-même. Avant, la certification
  // par soi renvoyait sur l'écran « certifie-le en 2 étapes », qui reproposait
  // une certification déjà faite (remonté par Rayan, 02/08/2026).
  if (acquisMoniteur || already) {
    root.innerHTML = blockedScreen(sub, avecMission, !acquisMoniteur, cat);
    wireBack(root);
    track("valider_seul.entrainement_propose", {
      competence_id: compId,
      avec_mission: avecMission,
    });
    root.querySelector("#vs-rejouer")?.addEventListener("click", () => {
      haptic("tap");
      rejouerLaMission(root, me, compId, sub, cat);
    });
    return;
  }

  root.innerHTML = introScreen(sub, cat, fiche, avecMission);
  wireIntro(root, me, compId, sub, cat);
}

function wireIntro(root, me, compId, sub, cat) {
  wireBack(root);
  root.querySelector("#vs-start-quiz")?.addEventListener("click", async () => {
    const btn = root.querySelector("#vs-start-quiz");
    if (btn) btn.disabled = true;
    haptic("tap");

    // Boîte inconnue : on la demande une fois, ici, parce que la réponse
    // change les questions qu'il va lire juste après.
    if (!(await chargerBoite())) {
      track("valider_seul.boite_demandee", { competence_id: compId });
      root.innerHTML = boiteScreen(sub);
      wireBoite(root, me, compId, sub, cat);
      return;
    }

    await lancerLaCertification(root, me, compId, sub, cat, btn);
  });
}

function wireBoite(root, me, compId, sub, cat) {
  wireBack(root);
  root.querySelectorAll("[data-boite]").forEach((bouton) => {
    bouton.addEventListener("click", async () => {
      const choix = bouton.dataset.boite;
      haptic("tap");
      root.querySelectorAll("[data-boite]").forEach((b) => (b.disabled = true));
      await enregistrerBoite(choix);
      track("valider_seul.boite_choisie", {
        competence_id: compId,
        boite: choix,
      });
      await lancerLaCertification(root, me, compId, sub, cat, null);
    });
  });
}

/**
 * La certification en deux temps : la MISSION puis les QUESTIONS.
 *
 * La mission (Mode Pilote) est l'épreuve : l'élève agit dans une scène, il
 * touche la commande, il remet les gestes dans l'ordre. Les questions restent
 * derrière parce que c'est le SERVEUR qui certifie : `self_validate_competence`
 * corrige lui-même les réponses de la banque et refuse tout ce qui vient d'un
 * score déclaré par le téléphone. Sans elles, n'importe qui se déclarerait
 * certifié.
 *
 * Les compétences sans mission gardent le chemin d'avant : questions seules.
 */
async function lancerLaCertification(root, me, compId, sub, cat, btn) {
  const gen = _gen;
  const boite = await chargerBoite();
  if (gen !== _gen) return; // parti pendant la lecture de la boîte
  if (!missionsPour(compId, boite).length) {
    await lancerLeQuiz(root, me, compId, sub, cat, btn);
    return;
  }

  const { hote, fermer } = ouvrirLaScene();

  monterMissions(hote, {
    code: compId,
    boite,
    onReussite: () => {
      fermer();
      lancerLeQuiz(root, me, compId, sub, cat, null);
    },
    onEchec: () => {
      fermer();
      haptic("warning");
      root.innerHTML = missionRateeScreen(sub);
      wireResult(root, me, compId, sub, cat);
    },
    onQuitter: () => {
      fermer();
      navigate("#/parcours");
    },
  });
}

/**
 * Ouvre la surface plein écran qui reçoit la mission.
 *
 * Sur <body>, PAS dans #app : un parent animé en `transform` redevient le bloc
 * de référence d'un `position:fixed`, et la scène se retrouve coincée dans la
 * colonne de la page avec la barre de nav par-dessus. (Même piège que les
 * overlays du tuto.)
 */
function ouvrirLaScene() {
  const hote = document.createElement("div");
  hote.className = "mp-host";
  document.body.appendChild(hote);
  document.body.classList.add("mp-open");

  const fermer = () => {
    window.removeEventListener("hashchange", fermer);
    hote.remove();
    document.body.classList.remove("mp-open");
  };

  // La scène vit sur <body>, donc le routeur ne la balaie pas quand la page
  // change. Sans ça, un retour arrière du navigateur ou un lien profond
  // laissait l'habitacle collé par-dessus l'app, sans aucun moyen d'en sortir.
  window.addEventListener("hashchange", fermer);

  return { hote, fermer };
}

/**
 * Rejouer la mise en situation d'une compétence DÉJÀ acquise.
 *
 * Aucun quiz derrière, aucune écriture : la compétence est acquise, elle le
 * reste. C'est de l'entretien du geste, pas une certification. Sans ça, un
 * élève dont l'enseignant a tout validé tombait sur « rien à faire ici » et
 * ne pouvait plus jamais toucher une scène.
 */
async function rejouerLaMission(root, me, compId, sub, cat) {
  const gen = _gen;
  // On relit la boîte : sans elle, un élève en automatique se voyait servir
  // la mission d'embrayage. Un entraînement doit parler la voiture qu'il
  // conduit, comme la certification.
  const boite = await chargerBoite();
  if (gen !== _gen) return; // parti pendant la lecture de la boîte
  const { hote, fermer } = ouvrirLaScene();
  track("valider_seul.mission_rejouee", { competence_id: compId });

  const revenir = () => {
    fermer();
    mount(root, compId);
  };

  monterMissions(hote, {
    code: compId,
    boite,
    onReussite: () => {
      fermer();
      haptic("success");
      root.innerHTML = entrainementFiniScreen(sub);
      wireResult(root, me, compId, sub, cat);
    },
    // Un entraînement ne se rate pas : on repart simplement de l'écran d'avant.
    onEchec: revenir,
    onQuitter: revenir,
  });
}

function entrainementFiniScreen(sub) {
  return `${STYLE}<div class="vsr anim-slide-up">
    <div class="vsr-med">${medallion("check", "violet", { size: 96 })}</div>
    <span class="vsr-kick">${icon("check", { size: 13 })} ${vsD("ent_kick", "Entraînement")}</span>
    <h1 class="vsr-ttl">${vsD("ent_title", "Le geste est encore là")}</h1>
    <p class="vsr-p">${vsD("ent_p", `« ${sub.n} » reste acquise dans ton parcours. Cet entraînement n'y change rien.`, { n: sub.n })}</p>
    <button class="vsr-cta" id="vs-cta-parcours" type="button">${vsD("ent_cta", "Retour au parcours")}</button>
  </div>`;
}

/**
 * La mission est ratée : on renvoie à la fiche, sans quiz derrière.
 * « S'il rate il doit relire la fiche de révision » (Rayan, 31/07/2026).
 */
function missionRateeScreen(sub) {
  return `${STYLE}<div class="vsr fail anim-slide-up">
    <div class="vsr-med">${medallion("faute", "orange", { size: 96 })}</div>
    <span class="vsr-kick">${icon("x", { size: 13 })} ${vsD("mr_kick", "Pas encore")}</span>
    <h1 class="vsr-ttl">${vsD("mr_title", "On reprend depuis la fiche")}</h1>
    <p class="vsr-p">${vsD("mr_p", `Le geste n'est pas encore en place sur « ${sub.n} ». Relis la fiche tranquillement, puis reviens le refaire.`, { n: sub.n })}</p>
    <button class="vsr-cta" id="vs-retry" type="button">${vsD("mr_retry", "Relire la fiche et retenter")}</button>
    <button class="vsr-ghost" id="vs-cta-parcours" type="button">${vsD("mr_back", "Retour au parcours")}</button>
  </div>`;
}

async function lancerLeQuiz(root, me, compId, sub, cat, btn) {
  track("valider_seul.quiz_start", { competence_id: compId });
  const launched = await lancerQuiz({
    competenceId: compId,
    type: "post_validation",
    nbQuestions: NB_QUESTIONS,
    onComplete: (score, total, answers) =>
      handleComplete(root, me, compId, sub, cat, score, total, answers),
  });

  if (launched === null) {
    toast(
      vsTR(
        "toast_noq",
        "Pas encore de questions sur cette compétence. Réessaie plus tard.",
      ),
      "info",
    );
    // Retour sur l'écran d'accueil : sinon l'élève reste devant des boutons
    // désactivés, sans rien à faire.
    if (btn) btn.disabled = false;
    else await mount(root, compId);
  }
}

async function handleComplete(
  root,
  me,
  compId,
  sub,
  cat,
  score,
  total,
  answers,
) {
  // Capturé AVANT le `await` réseau qui suit : si l'élève a déjà quitté cette
  // compétence quand la RPC répond, `_gen` a changé et on n'écrit plus rien
  // dans `root` — sinon le score d'ici s'affichait par-dessus la page suivante.
  const gen = _gen;
  const scorePct = Math.round((score / total) * 100);
  track("valider_seul.quiz_done", {
    competence_id: compId,
    score_pct: scorePct,
  });

  // Journalise la tentative — même RPC que le reste de l'app (quiz_attempts +
  // XP/quêtes déjà câblés dessus). Pour un élève sans moniteur, `validations`
  // n'a JAMAIS de ligne pré-existante pour cette compétence → la RPC renvoie
  // systématiquement reason:'no_competence_unlocked' SANS toucher
  // `validations` (garde-fou vérifié dans le code de la RPC). Best-effort :
  // une erreur ici ne doit jamais bloquer la validation autonome elle-même.
  try {
    await sb.rpc("submit_competence_quiz", {
      p_competence_id: compId,
      p_score: scorePct,
      p_type: "post_validation",
    });
  } catch (e) {
    console.warn("[valider-seul] submit_competence_quiz", e);
  }
  if (gen !== _gen) return;

  if (scorePct < SEUIL) {
    haptic("warning");
    root.innerHTML = failScreen(sub, scorePct);
    wireResult(root, me, compId, sub, cat);
    return;
  }

  // Quiz réussi → question de certification UNIFIÉE (décision Rayan 17/07,
  // même formulation pour tous : rattaché ou solo, la vraie leçon a eu lieu
  // en voiture). La compétence ne monte que si l'élève certifie.
  haptic("success");
  root.innerHTML = confirmScreen(sub, scorePct);
  wireBack(root);
  root.querySelector("#vs-certify")?.addEventListener("click", () => {
    const b = root.querySelector("#vs-certify");
    if (b) b.disabled = true;
    certify(root, me, compId, sub, cat, scorePct, answers);
  });
  root.querySelector("#vs-not-yet")?.addEventListener("click", () => {
    track("valider_seul.not_yet", { competence_id: compId });
    toast(
      vsTR("toast_nopressure", "Aucune pression. Reviens quand tu le sens."),
      "info",
    );
    navigate("#/parcours");
  });
}

function confirmScreen(sub, scorePct) {
  return `${STYLE}<div class="vsr anim-slide-up">
    <div class="vsr-med">${medallion("check", "violet", { size: 96 })}</div>
    <span class="vsr-kick">${icon("check", { size: 13 })} ${vsD("cf_kick", "Quiz réussi")}</span>
    <h1 class="vsr-ttl">${vsD("cf_title", "Tu te sens prêt à passer à la suite ?")}</h1>
    <p class="vsr-p">${vsD("cf_p", `En certifiant « ${sub.n} », tu confirmes que ce geste est acquis en vraie leçon.`, { n: sub.n })}</p>
    <button class="vsr-cta" id="vs-certify" type="button">${vsD("cf_yes", "Oui je certifie")} ${icon("shield", { size: 16 })}</button>
    <button class="vsr-ghost" id="vs-not-yet" type="button">${vsD("cf_no", "Pas encore")}</button>
  </div>`;
}

async function certify(root, me, compId, sub, cat, scorePct, answers) {
  const gen = _gen;
  try {
    // Le SERVEUR corrige : on envoie les réponses, pas un score déclaratif
    // (migration solo_hardening — l'ancienne signature p_score est supprimée).
    const { data, error } = await sb.rpc("self_validate_competence", {
      p_competence_id: compId,
      p_answers: answers || [],
    });
    if (gen !== _gen) return; // parti avant la réponse serveur
    if (error || data?.error) {
      console.warn(
        "[valider-seul] self_validate_competence",
        error || data?.error,
      );
      toast(
        vsTR("toast_valerr", "Erreur lors de la validation. Réessaie."),
        "error",
      );
      root.innerHTML = failScreen(sub, scorePct);
      wireResult(root, me, compId, sub, cat);
      return;
    }
    // Le serveur peut recaler ce que le client croyait réussi (anti-triche).
    if (data?.passed === false) {
      haptic("warning");
      root.innerHTML = failScreen(sub, data.score ?? scorePct);
      wireResult(root, me, compId, sub, cat);
      return;
    }
    // (Le hero « Prépare ta leçon » n'a plus besoin qu'on efface son thème
    // ici : accueil.js RECALCULE et refuse de servir une compétence acquise
    // — cf. readPrepTheme(). Nettoyer depuis un seul des trois chemins de
    // certification était justement la cause du hero qui restait collé.)
    haptic("success");
    burstConfetti({ count: 120, power: 18 });
    track("valider_seul.validated", {
      competence_id: compId,
      score_pct: scorePct,
    });

    // +25 volants — même récompense qu'une validation moniteur (parité solo).
    // Claim SERVEUR idempotent : 1 seule fois par compétence, repasser le
    // quiz ne re-crédite pas. Best-effort : un refus (migration pas encore
    // appliquée, réseau) ne bloque jamais la validation elle-même.
    let volants = 0;
    try {
      const { data: claim } = await sb.rpc("claim_competence_reward", {
        p_competence_id: compId,
      });
      if (claim?.ok && !claim.already_claimed && (claim.granted ?? 0) > 0) {
        volants = claim.granted;
        // Aligne le cache local sur la vérité serveur + rafraîchit la
        // pastille du header (refreshGemmes émet déjà pg-gemmes-changed).
        await refreshGemmes();
      }
    } catch (e) {
      console.warn("[valider-seul] claim_competence_reward", e);
    }

    // La récompense doit être créditée même si l'élève est parti entre-temps
    // (RPC idempotente ci-dessus, jamais sautée) : seul l'AFFICHAGE se tait.
    if (gen !== _gen) return;
    root.innerHTML = successScreen(sub, scorePct, volants);
    wireResult(root, me, compId, sub, cat);
  } catch (e) {
    console.warn("[valider-seul] self_validate_competence", e);
    toast(vsTR("toast_neterr", "Erreur réseau. Réessaie."), "error");
    root.innerHTML = failScreen(sub, scorePct);
    wireResult(root, me, compId, sub, cat);
  }
}

function wireResult(root, me, compId, sub, cat) {
  root.querySelector("#vs-cta-parcours")?.addEventListener("click", (e) => {
    // Écran de succès : on ramène l'élève DIRECTEMENT sur le nœud de la
    // compétence dans « Mon permis » (param focus → zoom + pulse). L'écran
    // d'échec réutilise le même id sans data-comp → retour simple au parcours.
    const c = e.currentTarget.getAttribute("data-comp");
    navigate(c ? `#/parcours?focus=${encodeURIComponent(c)}` : "#/parcours");
  });
  root
    .querySelector("#vs-cta-carte")
    ?.addEventListener("click", () => navigate(`#/cartes/${compId}`));
  root.querySelector("#vs-retry")?.addEventListener("click", async () => {
    const fiche = await loadFiche(compId).catch(() => null);
    root.innerHTML = introScreen(sub, cat, null, fiche);
    wireIntro(root, me, compId, sub, cat);
  });
}
