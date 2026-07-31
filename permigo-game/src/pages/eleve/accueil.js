// ═══════════════════════════════════════════════════════════════
// Élève — Accueil. 3 questions, 3 secondes :
// 1. Où j'en suis ?        → hero + PERMIS VIRTUEL (dominant)
// 2. Que dois-je faire ?   → ACTION DU JOUR (1 seul CTA)
// 3. Mon objectif actuel ? → ligue + mondes + examen blanc
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { blendLeagueRows, isSoloEleve } from "@/utils/league-bots.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { REMC } from "@/data/remc.js";
import { labelComp } from "@/utils/remc-label.js";
import {
  renderHeatmap,
  ensureHeatmapStyles,
} from "@/components/eleve/activity-heatmap.js";
import {
  maybeSoftRequestPush,
  maybeSendStreakRiskNotif,
} from "@/services/web-push.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { volantImg } from "@/utils/volant.js";
import { ASSETS } from "@/utils/assets.js";
import { emotionalBanner } from "@/components/eleve/emotional-banner.js";
import { getMyChests } from "@/utils/game-state.js";
import { mountDailyQuests } from "@/components/eleve/daily-quests.js";
import { toast } from "@/components/common/toast.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { startTour } from "@/components/common/guided-tour.js";
import { onPopupsSettled } from "@/utils/intro-overlays.js";
import {
  mountLeagueHero,
  LEAGUE_HERO_CSS,
} from "@/components/eleve/league-hero.js";
// ⚠️ daily-quiz.js ne sert plus qu'aux helpers de date : la « question du
// jour » a quitté l'accueil (pivot 17/07 — le hero prépare la prochaine leçon).
import { todayKey, yesterdayKey, dayKey } from "@/services/daily-quiz.js";
import { isStandalone } from "@/utils/pwa.js";
import { openInstallSheet } from "@/components/common/install-nudge.js";
import { getLang } from "@/utils/lang.js";

// ── i18n de la COQUE Accueil (EN/AR). L'app reste FR par défaut. at(key,fr) =
// traduit-ou-français avec esc() (texte) ; atR = version brute (pour construire
// les chaînes à trous {…} avant esc/escAttr). Repli FR systématique.
const ACC_I18N = {
  en: {
    install_t: "Install PermiGo on your phone",
    install_s: "Quick access and your reminders · 10 seconds.",
    install_btn: "Install",
    hero_aria: "Get ready for your next lesson",
    hero_kicker: "Your next lesson",
    hero_h1: "Get ready for your lesson",
    prep_pill_sub: "For your next hour",
    prep_pill_aria: "Your next lesson's topic: {t}. Tap to change",
    hero_meta: "Be ready in 5 min for your next driving hour.",
    cta_king: "I'm getting ready",
    debrief_k: "Let's look back at your lesson",
    debrief_t: 'Did you go over "{t}" with your instructor?',
    debrief_s:
      "Some skills take several lessons. That's normal. We keep going together.",
    debrief_keep: "I'll practise more",
    debrief_next: "Next lesson →",
    debrief_later: "Haven't had my lesson yet",
    consol_aria_cons: "Consolidation quiz. 2 questions, 30 seconds",
    consol_aria_rec: "Recap quiz. 3 questions",
    consol_t_cons: "Lock in your new skill",
    consol_t_rec: "Recap on your skill",
    consol_s_cons: "Consolidation quiz · 2 questions · 30 s",
    consol_s_rec: "Recap quiz · 3 questions · optional",
    sos_title_crit: "Your {j} streak is about to break!",
    sos_title_risk: "Your {j} streak breaks tonight",
    sos_sub_crit: "Quick. One quiz saves it.",
    sos_sub_risk: "Do your daily quiz to keep it.",
    sos_freeze: "Freeze · 50",
    sos_freeze_aria: "Freeze my streak for 50 tokens",
    day_sing: "day",
    day_plur: "days",
    sitday_aria: "Road scenario. Play today's scene",
    sitday_title: "Road scenario",
    sitday_play: "Play",
    permis_aria: "Your virtual licence. {n} of 31 skills",
    permis_label: "Your virtual licence",
    permis_sub_zero_solo: "Every skill you validate completes it.",
    permis_sub_zero_mon: "Every skill your instructor validates completes it.",
    permis_sub_done: "All skills achieved. Well done!",
    permis_sub_left: "{n} skill{s} left before the test",
    bs_streak_aria: "Streak details",
    bs_title: "Your revision streak",
    bs_record: "Record: {r} {jr} · Current: {c}",
    bs_mymonth: "My month",
    bs_active: "{n} active day{s}",
    bs_freeze: "Freeze my streak · 50",
    bs_freeze_desc: "Protects your streak for 24 h.",
    hud_streak_aria: "{n}-day streak · view details",
    cr_aria: "Your instructor sent you a report · tap to read",
    cr_t: "Your instructor sent you a report",
    cr_s: "Read their feedback on your lesson.",
    cr_cta: "Read it",
    cr_apercu_one: "Skill validated: {c}",
    cr_apercu_multi: "{n} skills validated, including {c}",
    cr_revisit_t: "Revisit your last lesson's report",
    cr_revisit_aria: "Revisit your last lesson's report · tap to open",
    chest_label: "{n} chest{s} to open",
    chest_sub: "Claim your daily reward.",
    fq_aria: "Flash quiz from your instructor, answer now",
    fq_title: "Flash quiz from your instructor",
    fq_sub: "3 questions · answer now",
    tour_welcome_t: "Welcome 👋",
    tour_welcome_x: "Quick tour. Skip any time.",
    tour_flame_t: "Your flame 🔥",
    tour_flame_x:
      "Come back every day. Your streak grows and earns you steering wheels.",
    tour_lesson_t: "Your next lesson",
    tour_lesson_x:
      "Get ready for every driving hour here. 5 minutes is enough.",
    tour_map_t: "Your licence map",
    tour_map_x: "31 skills to validate to earn your licence.",
    tour_rewards_t: "Your rewards",
    tour_rewards_x:
      "The wheel, the shop, your trophies and your league. All in one place.",
    hint_reviser: "Find this lesson any time in “Practice” 📚",
    err_t: "“Home” is unavailable",
    err_s: "Check your connection. Try again.",
    err_retry: "Try again",
    reason_weak: "🎯 Based on your recent mistakes",
    reason_next: "📍 Next on your route",
    reason_consol: "🔁 Achieved. Worth consolidating",
    freeze_wait: "⏳ Freezing…",
    freeze_need: "You need 50 steering wheels to freeze your streak.",
    freeze_ok_toast: "Streak frozen for 24 h.",
    freeze_ok_btn: "✓ Streak frozen",
    freeze_fail: "The freeze failed. Try again.",
    debrief_keep_toast: "Consolidating. That's how you improve 💪",
    debrief_new_toast: "New lesson to prepare: {t}",
    sheet_aria: "Choose your next lesson's topic",
    sheet_h: "What's your next lesson?",
    sheet_s: "PermiGo picked your next 3. Your call.",
    sheet_more_q: "Another topic in mind?",
    sheet_more_u: "Full list",
    sheet_monde: "World",
    sheet_done_aria: "already achieved",
    unit_min: "min",
    heat_quiz_one: "quiz",
    heat_quiz_many: "quizzes",
  },
  ar: {
    install_t: "ثبّت بيرميغو على هاتفك",
    install_s: "وصول سريع وتذكيراتك · 10 ثوانٍ.",
    install_btn: "تثبيت",
    hero_aria: "استعدّ لدرسك القادم",
    hero_kicker: "درسك القادم",
    hero_h1: "استعدّ لدرسك",
    prep_pill_sub: "مختار لساعتك القادمة",
    prep_pill_aria: "موضوع درسك القادم: {t}. اضغط للتغيير",
    hero_meta: "كن مستعدّاً في 5 دقائق لساعة قيادتك القادمة.",
    cta_king: "أستعدّ",
    debrief_k: "لنعُد إلى درسك",
    debrief_t: "هل راجعت «{t}» مع مدرّبك؟",
    debrief_s: "بعض المهارات تحتاج عدة دروس. هذا طبيعي. نواصل معاً.",
    debrief_keep: "أواصل التدريب",
    debrief_next: "الدرس التالي ←",
    debrief_later: "لم آخذ درسي بعد",
    consol_aria_cons: "اختبار ترسيخ. سؤالان، 30 ثانية",
    consol_aria_rec: "اختبار مراجعة. 3 أسئلة",
    consol_t_cons: "ثبّت مهارتك الجديدة",
    consol_t_rec: "مراجعة لمهارتك",
    consol_s_cons: "اختبار ترسيخ · سؤالان · 30 ث",
    consol_s_rec: "اختبار مراجعة · 3 أسئلة · اختياري",
    sos_title_crit: "سلسلتك ({j}) على وشك الانقطاع!",
    sos_title_risk: "ستنقطع سلسلتك ({j}) الليلة",
    sos_sub_crit: "بسرعة. اختبار واحد ينقذها.",
    sos_sub_risk: "أنجز اختبار اليوم للحفاظ عليها.",
    sos_freeze: "تجميد · 50",
    sos_freeze_aria: "تجميد سلسلتي مقابل 50 مقودًا",
    day_sing: "يوم",
    day_plur: "أيام",
    sitday_aria: "سيناريو الطريق. العب مشهد اليوم",
    sitday_title: "سيناريو الطريق",
    sitday_play: "العب",
    permis_aria: "رخصتك الافتراضية. {n} من 31 مهارة",
    permis_label: "رخصتك الافتراضية",
    permis_sub_zero_solo: "كل مهارة تثبّتها تُكملها.",
    permis_sub_zero_mon: "كل مهارة يثبّتها مدرّبك تُكملها.",
    permis_sub_done: "كل المهارات مكتسبة. أحسنت!",
    permis_sub_left: "بقيت {n} مهارة قبل الامتحان",
    bs_streak_aria: "تفاصيل سلسلتك",
    bs_title: "سلسلة مراجعتك",
    bs_record: "الرقم القياسي: {r} {jr} · الحالية: {c}",
    bs_mymonth: "شهري",
    bs_active: "{n} يوم نشط",
    bs_freeze: "تجميد سلسلتي · 50",
    bs_freeze_desc: "تحمي سلسلتك لمدة 24 ساعة.",
    hud_streak_aria: "سلسلة {n} يوم · عرض التفاصيل",
    cr_aria: "أرسل لك مدرّبك تقريراً · اضغط للقراءة",
    cr_t: "أرسل لك مدرّبك تقريراً",
    cr_s: "اقرأ ملاحظاته على درسك.",
    cr_cta: "اقرأه",
    cr_apercu_one: "مهارة مكتسبة: {c}",
    cr_apercu_multi: "{n} مهارات مكتسبة، منها {c}",
    cr_revisit_t: "راجع تقرير درسك الأخير",
    cr_revisit_aria: "راجع تقرير درسك الأخير · اضغط لفتحه",
    chest_label: "{n} صندوق للفتح",
    chest_sub: "احصل على مكافأتك اليومية.",
    fq_aria: "اختبار سريع من مدرّبك، أجب الآن",
    fq_title: "اختبار سريع من مدرّبك",
    fq_sub: "3 أسئلة · أجب الآن",
    tour_welcome_t: "أهلاً بك 👋",
    tour_welcome_x: "جولة سريعة. تجاوزها متى شئت.",
    tour_flame_t: "شعلتك 🔥",
    tour_flame_x: "عُد كل يوم. سلسلتك تكبر وتكسبك مقودات.",
    tour_lesson_t: "درسك القادم",
    tour_lesson_x: "استعدّ هنا لكل ساعة قيادة. 5 دقائق تكفي.",
    tour_map_t: "خريطة رخصتك",
    tour_map_x: "31 مهارة عليك إتقانها لنيل رخصتك.",
    tour_rewards_t: "مكافآتك",
    tour_rewards_x: "العجلة والمتجر وكؤوسك ودوريك. كلها هنا.",
    hint_reviser: "تجد هذا الدرس متى شئت في «المراجعة» 📚",
    err_t: "«الرئيسية» غير متاحة",
    err_s: "تحقّق من اتصالك ثم أعد المحاولة.",
    err_retry: "إعادة المحاولة",
    reason_weak: "🎯 بناءً على أخطائك الأخيرة",
    reason_next: "📍 التالي في مسارك",
    reason_consol: "🔁 مكتسبة. للترسيخ",
    freeze_wait: "⏳ جارٍ التجميد…",
    freeze_need: "تحتاج 50 مقودًا لتجميد سلسلتك.",
    freeze_ok_toast: "جُمّدت السلسلة لمدة 24 ساعة.",
    freeze_ok_btn: "✓ جُمّدت السلسلة",
    freeze_fail: "فشل التجميد. أعد المحاولة.",
    debrief_keep_toast: "نرسّخ المهارة. هكذا نتقدّم 💪",
    debrief_new_toast: "درس جديد للتحضير: {t}",
    sheet_aria: "اختر موضوع درسك القادم",
    sheet_h: "ما موضوع درسك القادم؟",
    sheet_s: "اختار لك بيرميغو 3 مواضيع. القرار لك.",
    sheet_more_q: "موضوع آخر في بالك؟",
    sheet_more_u: "القائمة الكاملة",
    sheet_monde: "عالم",
    sheet_done_aria: "مكتسبة بالفعل",
    unit_min: "د",
    heat_quiz_one: "اختبار",
    heat_quiz_many: "اختبارات",
  },
};
function atR(key, fr) {
  const l = getLang();
  return (l !== "fr" && ACC_I18N[l]?.[key]) || fr;
}
// Isole un fragment HTML (déjà échappé) en RTL quand la langue est l'arabe :
// sans ça, la ponctuation finale saute en début de ligne dans la page LTR
// (audit 23/07). L'app reste LTR — RTL par span uniquement (cf. lang.js).
function _rtl(html) {
  return getLang() === "ar" ? `<span dir="rtl">${html}</span>` : html;
}
function at(key, fr) {
  return _rtl(esc(atR(key, fr)));
}
// Mot « jour/jours » traduit selon le nombre (pluriel simple).
function atDay(n) {
  return atR(n > 1 ? "day_plur" : "day_sing", n > 1 ? "jours" : "jour");
}
// Locale d'affichage des dates (mois écrits dans la langue choisie).
function atLoc() {
  const l = getLang();
  return l === "en" ? "en-GB" : l === "ar" ? "ar" : "fr-FR";
}
// Noms des 4 mondes (feuille « changer de thème ») — libellés de coque.
const MONDE_I18N = {
  en: {
    1: "Vehicle handling",
    2: "Traffic",
    3: "Difficult conditions",
    4: "Independent driving",
  },
  ar: {
    1: "التحكم في المركبة",
    2: "السير في الطريق",
    3: "الظروف الصعبة",
    4: "القيادة المستقلة",
  },
};
function mondeNom(n, fr) {
  const l = getLang();
  return (l !== "fr" && MONDE_I18N[l]?.[n]) || fr;
}
// Titres de fiches : contenu DYNAMIQUE. Décision Rayan 23/07 (« plus un mot
// de FR dans la coque ») : en 'en'/'ar' on charge le chunk fiches-i18n À LA
// DEMANDE dans mount() — les élèves FR ne le paient jamais (la décision
// bundle de #538 reste vraie pour eux).
let _ficheI18nMod = null;
function ficheTitre(code, fr) {
  const l = getLang();
  if (l === "fr") return fr;
  return _ficheI18nMod?.ficheTr?.(code, l)?.titre || fr;
}

// Tour guidé élève — 1× à la première arrivée sur l'accueil (l'onboarding
// plein écran est déjà passé : main.js le monte AVANT cette page).
const TOUR_KEY = "pg-tour-eleve-v1";
// Étapes évaluées À L'APPEL (fonction, pas const) : les libellés suivent la
// langue courante (getLang() via atR) au moment où le tour démarre.
function eleveTourSteps() {
  return [
    {
      title: atR("tour_welcome_t", "Bienvenue 👋"),
      text: atR("tour_welcome_x", "Visite express. Passe quand tu veux."),
    },
    {
      sel: "#streak-badge-btn",
      title: atR("tour_flame_t", "Ta flamme 🔥"),
      text: atR(
        "tour_flame_x",
        "Reviens chaque jour. Ta série monte et te rapporte des volants.",
      ),
    },
    {
      sel: "#action-cta-btn",
      title: atR("tour_lesson_t", "Ta prochaine leçon"),
      text: atR(
        "tour_lesson_x",
        "Prépare chaque heure de conduite ici. 5 minutes suffisent.",
      ),
    },
    {
      // 2026-07-16 : l'onglet « Mon permis » ré-ouvre directement le
      // parcours (data-id="parcours") — le sélecteur suit.
      sel: '.bn-tab[data-id="parcours"]',
      title: atR("tour_map_t", "Ta carte du permis"),
      // Copie neutre : vaut pour l'élève rattaché ET l'élève solo (validation
      // autonome).
      text: atR(
        "tour_map_x",
        "31 compétences à valider pour décrocher ton permis.",
      ),
    },
    {
      sel: '.bn-tab[data-id="recompenses"]',
      title: atR("tour_rewards_t", "Tes récompenses"),
      text: atR(
        "tour_rewards_x",
        "La roue, la boutique, tes trophées et ta ligue. Tout est là.",
      ),
    },
  ];
}

function maybeStartEleveTour() {
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
  } catch {
    return;
  }
  // Le tuto attend que le popup d'engagement (A2HS / rappels) soit fermé :
  // sinon il s'affiche dessous et le spotlight se mesure au mauvais endroit.
  onPopupsSettled(() => {
    setTimeout(() => {
      // Ancré sur le CTA king (toujours rendu) — présent quel que soit l'état
      // (le hero « prépare ta leçon » est toujours rendu). Garanti en DOM avant ce timeout.
      if (!document.querySelector("#action-cta-btn")) return;
      track("eleve.tour.start");
      startTour(eleveTourSteps(), {
        onDone: () => {
          try {
            localStorage.setItem(TOUR_KEY, "1");
          } catch {
            /* stockage indispo */
          }
          track("eleve.tour.done");
        },
      });
    }, 600);
  });
}

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.acc2 {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 110px;
  background: var(--bg);
  font-family: 'Archivo', sans-serif;
  color: var(--ink);
}

/* ════ ACCENT ACCUEIL — suit le token --a (l'accent choisi par l'élève) ════
   Défaut élève = violet (cf. main.js). Tout l'accueil + le chrome (header/nav,
   qui suivent --a) restent cohérents, et le picker de couleur recolore aussi
   l'accueil. Neutres via --su/--ink/--mu (theme-aware) → pas d'override dark. */
.acc2 {
  --acc-vio: var(--a);
  --acc-vio-dk: var(--adk);
  --acc-vio-lt: var(--a-lt);
  --acc-hero-bg: linear-gradient(150deg,
    color-mix(in srgb, var(--a) 13%, var(--su)) 0%,
    color-mix(in srgb, var(--a) 6%, var(--su)) 55%,
    var(--su) 100%);
  --acc-hero-border: color-mix(in srgb, var(--a) 24%, var(--su));
  --acc-hero-kicker: var(--a-txt);
  --acc-hero-ink: var(--ink);
  --acc-hero-mu: var(--mu);
  --acc-gold: #f7b32b;
  --acc-gold-dk: #e08e0b;
  --acc-hud-bg: var(--su);
  --acc-hud-border: var(--bo);
  --acc-cta-shadow: 0 6px 0 var(--adk), 0 14px 26px -6px color-mix(in srgb, var(--a) 42%, transparent);
}

/* ════════════════ HUD — rangée tout en haut ════════════════════ */
.acc2-hud {
  display: flex;
  align-items: center;
  gap: 9px;
  /* Le safe-area + la hauteur du header sont deja pris par body.has-chrome #app
     (components.css). Ne PAS re-compter env(safe-area-inset-top) ici, sinon gros
     vide entre le logo du header et la serie. Juste une petite respiration. */
  padding: 10px 18px 0;
}
.acc2-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--acc-hud-bg);
  border: 1px solid var(--acc-hud-border);
  border-radius: 999px;
  padding: 6px 13px 6px 8px;
  box-shadow: 0 4px 14px rgba(0,0,0,.06);
  font: 800 16px/1 'Archivo', sans-serif;
  color: var(--ink);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.acc2-chip img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.acc2-chip.streak img {
  filter: drop-shadow(0 2px 4px rgba(255,120,0,.5));
  animation: hudFlameFlick 1.5s ease-in-out infinite;
  transform-origin: 50% 85%;
}
.acc2-chip.streak.inactive img {
  filter: grayscale(1) brightness(.72);
  animation: none;
}
.acc2-chip .num {
  font-variant-numeric: tabular-nums;
}
@keyframes hudFlameFlick {
  0%, 100% { transform: scale(1) rotate(0); }
  50%       { transform: scale(1.08, 1.12) rotate(-2deg); }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-chip.streak img { animation: none; }
}

/* ════════════ Bandeau « série en danger » (SOS) ════════════ */
.acc2-sos {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 12px 16px 0;
}
.acc2-sos-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  border-radius: 18px;
  padding: 12px 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border: 1px solid color-mix(in srgb, var(--am) 42%, transparent);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--am) 16%, var(--su)),
    color-mix(in srgb, var(--am) 9%, var(--su)));
  transition: transform .12s ease;
}
.acc2-sos-main:active { transform: scale(.985); }
.acc2-sos.crit .acc2-sos-main {
  border-color: color-mix(in srgb, var(--or) 55%, transparent);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--or) 20%, var(--su)),
    color-mix(in srgb, var(--or) 11%, var(--su)));
}
.acc2-sos-flame {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 40%,
    color-mix(in srgb, var(--am) 32%, transparent), transparent 70%);
}
.acc2-sos-flame img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(255,120,0,.5));
  animation: hudFlameFlick 1.3s ease-in-out infinite;
  transform-origin: 50% 85%;
}
.acc2-sos-txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.acc2-sos-title {
  font: 800 14.5px/1.2 'Archivo', sans-serif;
  color: var(--ink);
  letter-spacing: -.01em;
}
.acc2-sos-sub {
  font: 500 12.5px/1.3 'Archivo', sans-serif;
  color: var(--mu);
}
.acc2-sos-arr {
  flex-shrink: 0;
  align-self: center;
  font: 800 16px/1 'Archivo', sans-serif;
  color: color-mix(in srgb, var(--am) 75%, var(--ink));
}
.acc2-sos-freeze {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 13px;
  border: 0;
  border-radius: 16px;
  cursor: pointer;
  font: 800 12.5px/1 'Archivo', sans-serif;
  color: #4a2c00;
  background: linear-gradient(180deg, #ffdf8f, #f5b636);
  box-shadow: 0 4px 12px -4px rgba(240,165,0,.5), inset 0 1px 0 rgba(255,255,255,.5);
  -webkit-tap-highlight-color: transparent;
  transition: transform .12s ease;
}
.acc2-sos-freeze img { width: 15px; height: 15px; }
.acc2-sos-freeze:active { transform: scale(.96); }
.acc2-sos-freeze:disabled { opacity: .6; }
@media (prefers-reduced-motion: reduce) {
  .acc2-sos-flame img { animation: none; }
}

/* ════════════════ HERO FOCAL v2 — la route de montagne ═════════════
   Le hero n'est plus un dégradé plat : c'est une ILLUSTRATION plein cadre
   (route en lacets vers le sommet = la métaphore du parcours), qui change
   selon l'heure locale — matin / midi / soir. La colonne texte vit dans le
   ciel vide à gauche, la route et la voiture restent visibles à droite.
   3 images WebP de ~30 Ko, une seule chargée à la fois. */
.acc2-hero-v2 {
  position: relative;
  border: 0;
  border-radius: 30px;
  margin: 12px 16px 0;
  padding: 20px;
  overflow: hidden;
  isolation: isolate;
  aspect-ratio: 1.24;
  min-height: 296px;
  display: flex;
  align-items: stretch;
  background: var(--acc-hero-bg);
  box-shadow:
    0 20px 46px -20px rgba(22,25,58,.42),
    0 2px 6px -2px rgba(22,25,58,.18);
}
.acc2-hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 78% 52%;
  pointer-events: none;
}
/* Voile de lisibilité : côté texte seulement, jamais sur la route. */
.acc2-hero-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: var(--acc-hero-shade);
}
/* Titre BLANC sur les 3 scènes (demande Rayan 30/07). Du blanc sur le ciel
   clair du matin/midi serait illisible → le voile côté texte devient SOMBRE
   et teinté par scène (chaud le matin, bleu à midi, violet le soir), à la
   façon d'une affiche de film. La route et la voiture, à droite, ne sont
   jamais assombries. Ces couleurs ne dépendent PAS du thème clair/sombre de
   l'app : l'image est fixe. */
.acc2-hero--matin, .acc2-hero--midi, .acc2-hero--soir {
  --acc-scene-ink: #ffffff;
  --acc-scene-kick: rgba(255,255,255,.82);
  --acc-scene-mu: rgba(255,255,255,.9);
  --acc-scene-sh: 0 2px 18px rgba(20,12,40,.55), 0 1px 2px rgba(20,12,40,.4);
}
.acc2-hero--matin {
  --acc-hero-shade: linear-gradient(92deg,
    rgba(58,22,44,.66) 0%,
    rgba(58,22,44,.40) 40%,
    rgba(58,22,44,.08) 66%,
    transparent 80%);
}
.acc2-hero--midi {
  --acc-hero-shade: linear-gradient(92deg,
    rgba(14,30,64,.66) 0%,
    rgba(14,30,64,.40) 40%,
    rgba(14,30,64,.08) 66%,
    transparent 80%);
}
.acc2-hero--soir {
  --acc-scene-kick: #ffcf8f;
  --acc-hero-shade: linear-gradient(92deg,
    rgba(16,12,44,.70) 0%,
    rgba(16,12,44,.44) 40%,
    rgba(16,12,44,.10) 66%,
    transparent 82%);
}
.acc2-hero-v2-txt {
  position: relative;
  z-index: 2;
  width: 63%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.acc2-hero-kicker {
  font: 800 11.5px/1 'Archivo', sans-serif;
  letter-spacing: .09em;
  color: var(--acc-scene-kick);
  text-transform: uppercase;
  margin-bottom: 7px;
  text-shadow: var(--acc-scene-sh);
}
/* Titre « affiche » : Archivo 900 en capitales serrées. Fredoka (rond,
   enfantin) manquait de punch sur une photo — ici on veut le coup de poing
   d'un titre de sport. Archivo reste dans la famille de l'app. */
.acc2-hero-h1 {
  font: 900 clamp(25px, 7.5vw, 31px)/.92 'Archivo', sans-serif;
  letter-spacing: -.035em;
  text-transform: uppercase;
  color: var(--acc-scene-ink);
  margin: 0;
  text-wrap: balance;
  text-shadow: var(--acc-scene-sh);
}
.acc2-hero-meta {
  margin-top: 9px;
  font: 700 12.5px/1.4 'Archivo', sans-serif;
  color: var(--acc-scene-mu);
  text-shadow: var(--acc-scene-sh);
}
/* Le CTA se colle en bas de la colonne : le regard descend
   ciel → titre → thème → bouton, dans l'ordre de la décision. */
.acc2-hero-spacer { flex: 1 1 auto; min-height: 10px; }
/* Écrans large / desktop : la colonne texte ne doit pas s'étirer */
@media (min-width: 560px) {
  .acc2-hero-v2 { aspect-ratio: 1.9; min-height: 300px; }
  .acc2-hero-v2-txt { width: 46%; }
}

/* ════════════ CTA ROI — gros bouton violet 3D ══════════════════ */
.acc2-cta-king {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: calc(100% - 32px);
  margin: 14px 16px 0;
  border: none;
  border-radius: 20px;
  padding: 18px;
  font: 800 18px/1 'Archivo', sans-serif;
  color: #fff;
  /* Dégradé MÊME TEINTE (reflet clair → accent → accent foncé) : on garde le
     relief plastique 3D sans virer de couleur. L'ancien --a-lt → --a faisait
     lavande-clair → bleu-violet → lecture « bicolore ». */
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--a) 88%, #fff) 0%,
    var(--a) 50%,
    var(--adk) 100%);
  box-shadow: var(--acc-cta-shadow);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform .09s, box-shadow .09s;
}
.acc2-cta-king:active {
  transform: translateY(5px);
  box-shadow: 0 1px 0 var(--acc-vio-dk), 0 6px 14px -6px color-mix(in srgb, var(--a) 30%, transparent);
}
.acc2-cta-king.muted {
  background: transparent;
  border: 1.5px solid var(--bo);
  color: var(--mu);
  box-shadow: none;
}
.acc2-cta-king.muted:active { box-shadow: none; transform: none; }
.acc2-cta-arr { font-size: 20px; }
@media (prefers-reduced-motion: reduce) {
  .acc2-cta-king { transition: none; }
}

/* ═══ Hero « Prépare ta prochaine leçon » — gloss & pastille thème ═══ */
/* Balayage lumineux périodique — comme un reflet qui passe sur la carte.
   Plus de voile clair de base : il délavait l'illustration. */
.acc2-hero-gloss {
  position: absolute;
  inset: 0;
  border-radius: 30px;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}
.acc2-hero-gloss::after {
  content: "";
  position: absolute;
  top: -40%;
  bottom: -40%;
  left: 0;
  width: 44%;
  background: linear-gradient(105deg,
    transparent,
    rgba(255,255,255,.30) 50%,
    transparent);
  transform: skewX(-14deg) translateX(-160%);
  animation: prepSheen 7s ease-in-out infinite;
}
@keyframes prepSheen {
  0%, 72%  { transform: skewX(-14deg) translateX(-160%); }
  92%, 100% { transform: skewX(-14deg) translateX(420%); }
}
/* Gloss du CTA roi : reflet plastique en haut du bouton (esprit Arène 3D) */
.acc2-cta-king {
  position: relative;
  overflow: hidden;
}
.acc2-cta-king::before {
  content: "";
  position: absolute;
  inset: 2px 3px 52%;
  border-radius: 17px 17px 60px 60px;
  background: linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,.04));
  pointer-events: none;
}
/* Pastille du thème : verre dépoli posé SUR l'illustration (elle doit se
   détacher du ciel sans faire tache blanche opaque). */
.acc2-prep-pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-top: 13px;
  max-width: 100%;
  /* Verre dépoli SOMBRE sur les 3 scènes : le titre est blanc, la pastille
     doit rester dans la même famille (une pastille blanche ferait une tache). */
  background: rgba(26,18,54,.52);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  backdrop-filter: blur(10px) saturate(1.2);
  border: 1.5px solid rgba(255,255,255,.24);
  border-radius: 999px;
  padding: 7px 13px 7px 9px;
  color: #fff;
  box-shadow: 0 8px 20px -10px rgba(12,8,32,.55);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.acc2-prep-pill:active { transform: scale(.97); }
.acc2-prep-pill-ic {
  flex: 0 0 auto;
  width: 25px; height: 25px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255,255,255,.16);
}
.acc2-prep-pill-tl {
  display: flex; flex-direction: column; min-width: 0;
  line-height: 1.15; text-align: left;
}
.acc2-prep-pill-tl b {
  font: 800 13px/1.15 'Archivo', sans-serif;
  color: inherit;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.acc2-prep-pill-tl span {
  font: 600 10px/1.2 'Archivo', sans-serif;
  opacity: .72;
  /* Une seule ligne : sur 2 lignes la pastille devenait un pavé et écrasait
     le chevron — le titre de la compétence doit rester la vedette. */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.acc2-prep-chev {
  flex: 0 0 auto; font-size: 15px; font-weight: 800; opacity: .55;
  margin-left: 1px;
}
/* CTA « Je me prépare » DANS le hero : occupe la colonne texte */
.acc2-hero-v2-txt .acc2-cta-king {
  width: 100%;
  margin: 13px 0 0;
  padding: 16px;
  font-size: 16.5px;
  border-radius: 18px;
}

/* ── « Appuie ici » : respiration du CTA ────────────────────────────
   L'élève ne voyait pas que le hero était tapable (retour Rayan). Un
   grossissement LÉGER et lent (2 %) + un halo qui pulse : ça attire l'œil
   sans clignoter. transform-origin en bas pour que le bouton « pousse »
   depuis sa base plastique au lieu de flotter. */
@keyframes accCtaBreathe {
  0%, 62%, 100% { transform: scale(1); }
  76%           { transform: scale(1.022); }
}
@keyframes accCtaHalo {
  0%, 62%, 100% { opacity: 0; transform: scale(.98); }
  76%           { opacity: .55; transform: scale(1.05); }
}
.acc2-hero-v2-txt .acc2-cta-king {
  transform-origin: 50% 88%;
  animation: accCtaBreathe 3.4s cubic-bezier(.34,1.4,.64,1) .9s infinite;
}
/* Le halo vit dans un calque à part : le bouton est overflow:hidden. */
.acc2-hero-cta-wrap { position: relative; width: 100%; }
.acc2-hero-cta-wrap::before {
  content: "";
  position: absolute;
  inset: 2px 0 4px;
  border-radius: 18px;
  z-index: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--a) 55%, transparent);
  filter: blur(11px);
  animation: accCtaHalo 3.4s cubic-bezier(.34,1.4,.64,1) .9s infinite;
}
.acc2-hero-cta-wrap .acc2-cta-king { position: relative; z-index: 1; }
/* Au doigt, la respiration s'arrête : l'appui reprend la main. */
.acc2-hero-v2-txt .acc2-cta-king:active {
  animation: none;
  transform: translateY(5px);
}
@media (prefers-reduced-motion: reduce) {
  .acc2-hero-gloss::after { animation: none; }
  .acc2-hero-v2-txt .acc2-cta-king { animation: none; }
  .acc2-hero-cta-wrap::before { animation: none; opacity: 0; }
}

/* ═══ Carte consolidation compacte (sous le CTA) ═══
   Le quiz de consolidation / récap garde sa porte sur l'accueil : petite
   carte tapable, ton factuel (jamais culpabilisant). */
.acc2-consol {
  display: flex;
  align-items: center;
  gap: 11px;
  width: calc(100% - 32px);
  margin: 12px 16px 0;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--a) 26%, var(--bo));
  border-radius: 16px;
  background: color-mix(in srgb, var(--a) 7%, var(--su));
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.acc2-consol:active { transform: scale(.985); }
.acc2-consol-ico { font-size: 22px; flex: 0 0 auto; }
.acc2-consol-txt { flex: 1; min-width: 0; }
.acc2-consol-t { display: block; font: 800 13.5px/1.2 'Archivo', sans-serif; color: var(--ink); }
.acc2-consol-s { display: block; margin-top: 2px; font: 700 11.5px/1.3 'Archivo', sans-serif; color: var(--mu); }
.acc2-consol-arr { color: var(--a-txt); font-weight: 800; font-size: 17px; flex: 0 0 auto; }

/* ═══ « Revenons sur ta leçon » — le débrief SANS note ni agenda ═══
   Deux choix équivalents (consolider n'est jamais un échec), un report
   discret. Ton chaleureux, jamais culpabilisant. */
.acc2-debrief {
  width: calc(100% - 32px);
  margin: 12px 16px 0;
  padding: 15px 16px 13px;
  border: 1px solid color-mix(in srgb, var(--a) 22%, var(--bo));
  border-radius: 18px;
  background: linear-gradient(150deg,
    color-mix(in srgb, var(--a) 8%, var(--su)) 0%,
    var(--su) 70%);
  box-shadow: 0 8px 22px -14px color-mix(in srgb, var(--a) 40%, transparent);
}
.acc2-debrief-k {
  font: 800 11px/1 'Archivo', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--a-txt);
  margin: 0 0 7px;
}
.acc2-debrief-t {
  font: 800 15.5px/1.3 'Archivo', sans-serif;
  color: var(--ink);
  margin: 0 0 4px;
}
.acc2-debrief-s {
  font: 600 12px/1.45 'Archivo', sans-serif;
  color: var(--mu);
  margin: 0 0 12px;
}
.acc2-debrief-row { display: flex; gap: 8px; }
.acc2-debrief-btn {
  flex: 1;
  min-height: 44px;
  border-radius: 13px;
  padding: 11px 8px;
  font: 800 13px/1.2 'Archivo', sans-serif;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.acc2-debrief-btn:active { transform: scale(.97); }
.acc2-debrief-btn.keep {
  border: 1.5px solid color-mix(in srgb, var(--a) 40%, var(--bo));
  background: var(--su);
  color: var(--a-txt);
}
.acc2-debrief-btn.next {
  border: 0;
  color: #fff;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--a) 88%, #fff) 0%,
    var(--a) 50%,
    var(--adk) 100%);
  box-shadow: 0 3px 0 var(--adk);
}
.acc2-debrief-later {
  display: block;
  width: 100%;
  margin-top: 9px;
  padding: 7px;
  border: 0;
  background: none;
  font: 700 11.5px/1 'Archivo', sans-serif;
  color: var(--mu);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* Pointeur « retrouve ce cours dans Réviser » : l'onglet pulse 2 fois */
@keyframes prepTabPulse {
  0%, 100% { transform: none; }
  35%      { transform: scale(1.22) translateY(-2px); }
}
.bn-tab.prep-pulse { animation: prepTabPulse .65s ease-in-out 2; }
@media (prefers-reduced-motion: reduce) {
  .bn-tab.prep-pulse { animation: none; }
}

/* ═══ Feuille de choix du thème (pastille 🎯 du hero) ═══ */
.prep-sheet-ov {
  position: fixed;
  inset: 0;
  z-index: 340;
  background: rgba(11,13,26,.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: prepOvIn .18s ease-out both;
}
@keyframes prepOvIn { from { opacity: 0; } to { opacity: 1; } }
.prep-sheet {
  width: 100%;
  max-width: 560px;
  max-height: 76vh;
  display: flex;
  flex-direction: column;
  background: var(--su);
  border-radius: 24px 24px 0 0;
  padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
  box-shadow: 0 -14px 44px rgba(11,13,26,.28);
  animation: prepSheetIn .24s cubic-bezier(.32,.72,.28,1) both;
}
@keyframes prepSheetIn { from { transform: translateY(48px); opacity: .4; } to { transform: none; opacity: 1; } }
.prep-sheet-grab { width: 40px; height: 4px; border-radius: 999px; background: var(--bo); margin: 0 auto 12px; flex: 0 0 auto; }
.prep-sheet-h { font: 800 16px/1.2 'Archivo', sans-serif; color: var(--ink); margin: 0 2px 2px; flex: 0 0 auto; }
.prep-sheet-s { font: 700 12px/1.4 'Archivo', sans-serif; color: var(--mu); margin: 0 2px 10px; flex: 0 0 auto; }
.prep-sheet-list { overflow-y: auto; min-height: 0; }
.prep-sheet-monde {
  font: 800 11px/1 'Archivo', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--a-txt);
  margin: 14px 2px 7px;
}
.prep-sheet-monde:first-child { margin-top: 2px; }
.prep-sheet-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  margin-bottom: 6px;
  border: 1px solid var(--bo);
  border-radius: 14px;
  background: var(--su);
  font: 700 14px/1.25 'Archivo', sans-serif;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.prep-sheet-item:active { transform: scale(.985); }
.prep-sheet-item.cur {
  border-color: color-mix(in srgb, var(--a) 45%, var(--bo));
  background: color-mix(in srgb, var(--a) 9%, var(--su));
}
.prep-sheet-item .tt { flex: 1; min-width: 0; }
.prep-sheet-item .ok { flex: 0 0 auto; font-size: 13px; color: var(--gr-txt); font-weight: 800; }

/* Les 3 suggestions ciblées — en grand, avec la raison du choix */
.prep-sheet-item.sug {
  min-height: 68px;
  padding: 14px 15px;
  border-radius: 18px;
  margin-bottom: 9px;
  border-color: color-mix(in srgb, var(--a) 22%, var(--bo));
  background: linear-gradient(150deg,
    color-mix(in srgb, var(--a) 8%, var(--su)) 0%,
    var(--su) 70%);
  box-shadow: 0 6px 18px -10px color-mix(in srgb, var(--a) 35%, transparent);
}
.prep-sheet-item.sug.cur {
  border-color: color-mix(in srgb, var(--a) 55%, var(--bo));
  background: color-mix(in srgb, var(--a) 12%, var(--su));
}
.prep-sheet-item.sug .sug-n {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--a) 85%, #fff), var(--a));
  color: #fff;
  font: 800 14px/1 'Archivo', sans-serif;
  box-shadow: 0 2px 0 var(--adk);
}
.prep-sheet-item.sug .sug-t {
  display: block;
  font: 700 16.5px/1.2 'Archivo', sans-serif;
  letter-spacing: -.01em;
  color: var(--ink);
}
.prep-sheet-item.sug .sug-r {
  display: block;
  margin-top: 3px;
  font: 700 11.5px/1.3 'Archivo', sans-serif;
  color: var(--mu);
}
.prep-sheet-item.sug .sug-go {
  flex: 0 0 auto;
  color: var(--a-txt);
  font-weight: 800;
  font-size: 18px;
}

/* Lien discret vers la liste complète */
.prep-sheet-more {
  display: block;
  width: 100%;
  margin: 4px 0 8px;
  padding: 10px;
  border: 0;
  background: none;
  font: 700 12.5px/1.3 'Archivo', sans-serif;
  color: var(--mu);
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.prep-sheet-more u { text-underline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .prep-sheet-ov, .prep-sheet { animation: none; }
}

/* ── Skeletons ── */
.skel2 {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: skel2Shim 1.4s ease-in-out infinite;
  border-radius: var(--r-xl);
}
@keyframes skel2Shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }


/* ═══════════ PERMIS VIRTUEL — l'élément dominant ═══════════════ */
.acc2-permis {
  margin: -52px 16px 0;
  position: relative;
  z-index: 2;
  animation: acc2PermisIn .55s .05s var(--ease-spring) both;
}
@keyframes acc2PermisIn {
  from { opacity: 0; transform: translateY(14px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ═══════════════════════ BELOW FOLD ═══════════════════════════ */
/* Réserve la hauteur des ligues injectées en async : évite le layout-shift
   à chaque retour sur l'accueil. :empty → la réserve disparaît une fois
   le contenu monté (qui est toujours plus haut que cette valeur). */
#acc-lb-slot:empty { display: block; min-height: 430px; }

.acc2-section-title {
  font: 600 12px/1 'Archivo', sans-serif;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--mu2);
  margin: 32px 20px 14px;
}


/* ── Tes ligues — 2 cartes premium (École + Révision) ── */
.acc-lg-head {
  font: 800 18px/1 'Archivo', sans-serif; letter-spacing: -.01em;
  color: var(--ink); margin: 28px 18px 4px;
  display: flex; align-items: center; gap: 10px;
}
.acc-lg-head::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--a) 22%, transparent), transparent);
}
/* Lève l'ambiguïté « faut-il cliquer ? » : on dit ce que c'est ET que ça s'ouvre. */
.acc-lg-lead {
  font: 600 12.5px/1.4 'Archivo', sans-serif; color: var(--mu);
  margin: 0 18px 14px;
}
.acc-lg-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  padding: 0 16px; margin-bottom: 4px;
}

/* ── Carte de base — socle commun ── */
.acc-lg-card {
  display: flex; flex-direction: column; align-items: flex-start;
  text-align: left; min-height: 118px;
  padding: 15px 15px 13px; border-radius: var(--r-xl);
  cursor: pointer; position: relative; overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  transition: transform .18s var(--ease-spring, cubic-bezier(.34,1.56,.64,1)), box-shadow .18s ease, border-color .18s ease;
  font-family: 'Archivo', sans-serif;
  animation: lgCardReveal .42s cubic-bezier(.34,1.56,.64,1) both;
}
.acc-lg-card:nth-child(2) { animation-delay: .07s; }

@keyframes lgCardReveal {
  from { opacity: 0; transform: translateY(10px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .acc-lg-card { animation: none; }
}

/* ── Inner highlight bord supérieur (::after) — fine ligne, pas de halo ── */
.acc-lg-card::after {
  content: ''; position: absolute; pointer-events: none;
  top: 0; left: 10%; right: 10%; height: 1px;
  border-radius: 0 0 50% 50%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--a-lt) 70%, transparent) 40%, color-mix(in srgb, var(--a-lt) 70%, transparent) 60%, transparent);
  opacity: .6;
}

/* ── Variante École ── */
.acc-lg-card[data-ligue="ecole"] {
  background: linear-gradient(158deg, color-mix(in srgb, var(--a) 10%, transparent) 0%, var(--su) 100%);
  border: 1.5px solid color-mix(in srgb, var(--a) 22%, transparent);
  box-shadow:
    0 2px 0 0 color-mix(in srgb, var(--a) 8%, transparent) inset,
    0 6px 18px -6px color-mix(in srgb, var(--a) 22%, transparent);
}
/* ── Variante Révision ── */
.acc-lg-card[data-ligue="revision"] {
  background: linear-gradient(142deg, color-mix(in srgb, var(--a) 8%, transparent) 0%, var(--su) 85%);
  border: 1.5px solid color-mix(in srgb, var(--a) 18%, transparent);
  box-shadow:
    0 2px 0 0 color-mix(in srgb, var(--a) 10%, transparent) inset,
    0 6px 22px -8px color-mix(in srgb, var(--a) 20%, transparent);
}

.acc-lg-card:active { transform: scale(.97); box-shadow: 0 2px 8px -4px color-mix(in srgb, var(--a) 18%, transparent) !important; }
.acc-lg-card:focus-visible { outline: 2px solid var(--acc-vio); outline-offset: 2px; }
@media (hover:hover) and (pointer:fine) {
  .acc-lg-card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--a) 40%, transparent) !important;
    box-shadow: 0 10px 26px -8px color-mix(in srgb, var(--a) 35%, transparent) !important;
  }
}

/* ── Tag label ── */
.acc-lg-tag {
  display: inline-flex; align-items: center; gap: 7px;
  font: 800 13px/1 'Archivo', sans-serif; letter-spacing: -.01em;
  color: var(--acc-vio);
  position: relative; z-index: 1;
  background: color-mix(in srgb, var(--a) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--a) 18%, transparent);
  border-radius: 100px; padding: 4px 12px 4px 4px;
}
.acc-lg-tag .pg-med {
  flex: none;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,.16));
}

/* ── Le RANG — héros de la carte ── */
/* « Ta place » : micro-label qui donne du sens au gros numéro (sinon « #1 »
   tout seul ne dit pas que c'est ton classement). */
.acc-lg-kick {
  font: 800 10px/1 'Archivo', sans-serif;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--mu); margin-top: 9px; position: relative; z-index: 1;
}
.acc-lg-rank {
  font: 800 40px/1 'Archivo', sans-serif;
  letter-spacing: -.04em; margin: 2px 0 0; position: relative; z-index: 1;
  color: var(--ink);              /* numéro UNI — fini le dégradé « bicolore » */
  font-variant-numeric: tabular-nums;
}
.acc-lg-rank.is-empty { color: var(--mu); }
/* Podium top-3 : seul le #1 passe en or (signal sobre, une seule couleur) */
.acc-lg-card[data-pos="1"] .acc-lg-rank { color: var(--acc-gold-dk); font-size: 46px; }
.acc-lg-card[data-pos="2"] .acc-lg-rank,
.acc-lg-card[data-pos="3"] .acc-lg-rank {
  font-size: 43px;
}

/* ── Footer : contexte + chevron ── */
.acc-lg-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  width: 100%; margin-top: auto; padding-top: 6px;
  position: relative; z-index: 1;
}
.acc-lg-sub {
  font: 600 12.5px/1.3 'Archivo', sans-serif; color: var(--mu);
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* Pastille chevron violette pleine — affordance forte */
.acc-lg-go {
  flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--acc-vio); color: #fff;
  box-shadow: 0 4px 11px -3px color-mix(in srgb, var(--a) 55%, transparent);
  transition: transform .15s var(--ease-spring, cubic-bezier(.34,1.56,.64,1));
}
.acc-lg-card:active .acc-lg-go { transform: translateX(3px) scale(.94); }
@media (hover:hover) and (pointer:fine) {
  .acc-lg-card:hover .acc-lg-go { transform: translateX(3px); }
}
/* Indice de cliquabilité : petit aller-retour horizontal, joué 2× au montage.
   Activé seulement les 3 premières sessions via .acc2-afford-hint (cf. mount). */
@keyframes affordNudge {
  0%, 100% { transform: translateX(0); }
  40%      { transform: translateX(4px); }
  70%      { transform: translateX(0); }
}
.acc2-afford-hint .acc-lg-go { animation: affordNudge 1.9s var(--ease-spring) .9s 2; }
.acc2-afford-hint .pplus-arrow { animation: affordNudge 1.9s var(--ease-spring) 1.1s 2; }
@media (prefers-reduced-motion: reduce) {
  .acc-lg-go, .pplus-arrow { animation: none; }
}

/* ── Bottom sheet streak ── */
.bs-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0); z-index: 490;
  pointer-events: none; transition: background .3s;
  animation: none !important;
}
.bs-bg.open { background: rgba(0,0,0,.45); pointer-events: auto; backdrop-filter: blur(4px); }
.bs-streak {
  position: fixed; bottom: 0; left: 0; right: 0;
  z-index: 495; background: var(--su);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  overscroll-behavior: contain;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid var(--bo);
  transform: translateY(100%) !important;
  transition: transform .32s cubic-bezier(.32,.72,0,1);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  max-height: 85dvh; overflow-y: auto;
  animation: none !important;
}
.bs-streak.open { transform: translateY(0) !important; }
.bs-handle { width: 36px; height: 4px; background: var(--bo); border-radius: 2px; margin: 14px auto 0; }
.bs-hd { padding: 16px 20px 14px; border-bottom: 1px solid var(--bo2); }
.bs-hd-title { font: 800 18px/1.2 'Archivo', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.bs-hd-sub { font: 500 12px/1.3 'Archivo', sans-serif; color: var(--mu2); margin-top: 4px; }
.bs-hmap-wrap { padding: 16px 16px 8px; }
.bs-hmap-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.bs-hmap-title { font: 700 14px/1 'Archivo', sans-serif; color: var(--ink); }
.bs-hmap-sub { font: 500 11px/1 'Archivo', sans-serif; color: var(--mu2); }
.bs-hmap-wrap .hmap { padding: 0; background: none; border: none; box-shadow: none; }
.bs-hmap-wrap .hmap-tap-info { margin-top: 10px; min-height: 20px; font: 600 11.5px/1 'Archivo', sans-serif; color: var(--mu3); text-align: center; transition: opacity .15s; }
.bs-freeze-wrap { padding: 0 20px 8px; margin-top: 12px; }
.bs-freeze-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 20px;
  background: linear-gradient(135deg,#dbeafe,#e0f2fe);
  border: 1.5px solid #bfdbfe; border-radius: var(--r-lg);
  color: var(--blk2); font: 700 14px/1 'Archivo', sans-serif;
  cursor: pointer; min-height: 52px;
  transition: transform .15s, opacity .15s;
}
.bs-freeze-btn:active { transform: scale(.98); opacity: .9; }
.bs-freeze-btn:disabled { opacity: .55; cursor: default; }
.bs-freeze-desc { font: 500 11px/1.4 'Archivo', sans-serif; color: var(--mu3); text-align: center; margin-top: 7px; }

/* ── First-run dominant CTA ── */
.acc2-action--first-run {
  margin: 20px 16px 0;
  background: var(--su);
  border: 2px solid color-mix(in srgb, var(--a) 30%, transparent);
  border-radius: var(--rx);
  padding: 24px 20px 22px;
  box-shadow: 0 8px 28px -10px color-mix(in srgb, var(--a) 28%, transparent), 0 2px 6px rgba(10,13,26,.06);
}
.acc2-action--first-run .acc2-action-tag {
  font-size: 11px;
  color: var(--acc-vio);
}
.acc2-action--first-run .acc2-action-title {
  font-size: clamp(20px, 6vw, 24px);
  margin-bottom: 8px;
}
.acc2-action--first-run .acc2-action-sub {
  font-size: 14.5px;
  color: var(--mu);
  margin-bottom: 4px;
}
.acc2-action--first-run .acc2-action-btn {
  margin-top: 20px;
  padding: 18px 24px;
  font-size: 16px;
  min-height: 58px;
  letter-spacing: -.01em;
  box-shadow: 0 10px 28px -8px color-mix(in srgb, var(--a) 48%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .acc2-action--first-run .acc2-action-btn { transition: none; }
}

/* ── État vide : tiret muet dans le slot du rang ── */
.acc-lg-rank.is-empty {
  background: none;
  -webkit-text-fill-color: var(--mu);
  color: var(--mu);
  font-size: 40px; opacity: .7;
}

/* ── First-run progressive disclosure ── */
.acc2--first-run .acc2-section-title,
.acc2--first-run .worlds-grid {
  opacity: 0.45;
  pointer-events: none;
  user-select: none;
}

/* ═══════════════ PERMIS COMPACT (carte maquette) ═══════════════ */
.acc2-permis-compact {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  background: var(--su); border: 1px solid var(--bo);
  border-radius: 22px; padding: 14px; margin: 14px 16px 0;
  text-decoration: none; cursor: pointer;
  box-shadow: 0 8px 22px -12px color-mix(in srgb, var(--a) 22%, transparent);
  transition: transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.acc2-permis-compact:active { transform: scale(.985); }
.acc2-permis-thumb {
  width: 62px; height: 62px; flex: none;
  display: grid; place-items: center; position: relative; isolation: isolate;
}
.acc2-permis-thumb::before {
  content: ""; position: absolute; inset: -6px; border-radius: 50%;
  background: radial-gradient(circle, rgba(247,179,43,.4), transparent 68%);
  filter: blur(3px); z-index: 0;
}
.acc2-permis-thumb img {
  width: 58px; height: 58px; object-fit: contain; position: relative; z-index: 1;
  filter: drop-shadow(0 2px 2px rgba(40,20,90,.22)) drop-shadow(0 8px 12px rgba(40,20,90,.18));
}
.acc2-permis-body { flex: 1; min-width: 0; }
/* Quête du jour : deuxième ligne de la carte, pleine largeur. Vide, elle ne
   doit pas laisser l'écart de 14px de la carte derrière elle. */
#acc-quest-slot { width: 100%; }
#acc-quest-slot:empty { display: none; }
.acc2-permis-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.acc2-permis-label2 {
  font: 800 15px/1 'Archivo', sans-serif; color: var(--ink);
}
.acc2-permis-val {
  font: 800 16px/1 'Archivo', sans-serif;
  color: var(--a-txt); font-variant-numeric: tabular-nums;
}
.acc2-permis-bar {
  height: 9px; border-radius: 999px; background: var(--bo);
  overflow: hidden; margin: 9px 0 6px;
}
.acc2-permis-fill {
  display: block; height: 100%; border-radius: 999px;
  background: var(--a);
  box-shadow: 0 0 10px color-mix(in srgb, var(--a) 55%, transparent);
  width: 0; transition: width .6s cubic-bezier(.34,1.56,.64,1);
}
.acc2-permis-sub {
  font: 700 11.5px/1.5 'Archivo', sans-serif; color: var(--mu);
}
@media (prefers-reduced-motion: reduce) {
  .acc2-permis-fill { transition: none; }
}

/* ═══════════════ COFFRE (style maquette) ════════════════════════ */
.acc2-chest-v2 {
  display: flex; align-items: center; gap: 13px;
  background: linear-gradient(120deg, var(--su), #fff7ec);
  border: 1px solid #f4e7cf; border-radius: 20px;
  padding: 11px 14px 11px 11px; margin: 14px 16px 0;
  text-decoration: none; cursor: pointer;
  box-shadow: 0 8px 22px -12px rgba(224,142,11,.3);
  position: relative; -webkit-tap-highlight-color: transparent;
  transition: transform .12s;
}
.acc2-chest-v2:active { transform: scale(.985); }
[data-theme="dark"] .acc2-chest-v2 {
  background: linear-gradient(120deg, var(--su), rgba(247,179,43,.07));
  border-color: rgba(247,179,43,.22);
}
.acc2-chest-v2 > img {
  width: 56px; height: 56px; object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(120,80,20,.28));
  animation: acc2ChestFloat 3.4s ease-in-out infinite;
}
@keyframes acc2ChestFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-7px); }
}
@media (prefers-reduced-motion: reduce) {
  .acc2-chest-v2 > img { animation: none; }
}
.acc2-chest-v2-body { flex: 1; min-width: 0; }
.acc2-chest-v2-title {
  display: block; font: 800 14.5px/1 'Archivo', sans-serif; color: var(--ink);
}
.acc2-chest-v2-sub {
  font: 700 11.5px/1 'Archivo', sans-serif; color: var(--mu); margin-top: 3px;
}
.acc2-chest-v2-arr {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #fde68a, #f7b32b 60%, #e08e0b);
  color: #3a2606; font-size: 17px; font-weight: 800;
  box-shadow: 0 4px 10px -3px rgba(224,142,11,.5);
}

/* ═══════════════ SECTION TITRE GÉNÉRIQUE ════════════════════════ */
.acc2-sec {
  margin-top: 22px; display: flex; align-items: baseline;
  justify-content: space-between; padding: 0 18px 10px;
}
.acc2-sec h2 {
  font: 800 16px/1 'Archivo', sans-serif; color: var(--ink);
}
.acc2-sec a {
  font: 700 12.5px/1 'Archivo', sans-serif;
  /* --a-txt = accent assombri pour le texte (l'accent pur fait ~2:1 sur clair, échec AA) */
  color: var(--a-txt); text-decoration: none;
}

/* (Carte « Tes devoirs » retirée : les devoirs du moniteur ne s'affichent
   plus QUE dans le hero du hub Réviser — plus de doublon.) */
</style>`;

// ─── Constantes ──────────────────────────────────────────────────
const WORLD_IMAGES = [
  ASSETS.worldC1,
  ASSETS.worldC2,
  ASSETS.worldC3,
  ASSETS.worldC4,
];
const WORLDS = REMC.map((cat, i) => ({
  id: cat.id,
  ico: cat.ico,
  image: WORLD_IMAGES[i] || null,
  name: cat.name,
  subs: cat.subs,
  total: cat.subs.length,
  // Une seule couleur (le thème) : la couleur guide l'attention, elle ne décore pas.
  color: "var(--adk)",
}));

// Thème déclaré par l'élève pour sa prochaine leçon (pastille 🎯 du hero).
// Simple code de compétence REMC en localStorage — une intention, pas un
// planning (charte : pas de réservation dans PermiGo).
const PREP_THEME_KEY = "pg-prep-theme";

// Cycle de préparation (lot 2 de la boucle : Préparer → Conduire → Débriefer
// → Consolider ou passer à la suite). Un cycle = un thème + un angle de
// travail qui TOURNE à chaque prep — on ne re-sert jamais deux fois le même
// plat : fiche (0) → questions (1) → mise en situation (2) → questions…
// `startedAt` = dernière prep lancée (sert au bloc « Revenons sur ta leçon »
// ~4 h plus tard — heuristique sans agenda, charte : pas de planning).
const PREP_CYCLE_KEY = "pg-prep-cycle";
const PREP_DEBRIEF_AFTER_MS = 4 * 3600 * 1000;
const PREP_HINT_MIN_MS = 60 * 1000;

function loadPrepCycle() {
  try {
    return JSON.parse(localStorage.getItem(PREP_CYCLE_KEY)) || null;
  } catch {
    return null;
  }
}
function savePrepCycle(c) {
  try {
    localStorage.setItem(PREP_CYCLE_KEY, JSON.stringify(c));
  } catch {
    /* stockage indispo → la rotation retombe sur la fiche, pas grave */
  }
}
function prepHrefFor(code, step) {
  if (step === 1) return `#/revision-conduite/${code}:quiz`;
  if (step === 2) return "#/en-situation";
  return `#/revision-conduite/${code}`;
}

// ── Thème déclaré : {code, consolider} ────────────────────────────
// `consolider` = l'élève a demandé EXPLICITEMENT à retravailler une
// compétence déjà acquise (« Je consolide encore »). C'est la SEULE raison
// pour laquelle le hero peut servir une compétence acquise : sans ce drapeau,
// une compétence certifiée disparaît du hero au rendu suivant.
//
// Avant, l'avancée reposait sur un `removeItem` posé dans valider-seul.js :
// un seul chemin sur les trois qui font passer une compétence en « acquise »
// (auto-certification, validation moniteur, certification sur un autre
// appareil) → le hero restait collé sur l'ancienne compétence. L'accueil est
// maintenant la seule autorité : il RECALCULE au lieu de faire confiance.
// Format legacy (chaîne nue) relu sans `consolider` → il se répare seul.
function readPrepTheme() {
  let raw = null;
  try {
    raw = localStorage.getItem(PREP_THEME_KEY);
  } catch {
    return null; // stockage indispo → choix auto
  }
  if (!raw) return null;
  if (raw[0] !== "{") return { code: raw, consolider: false };
  try {
    const o = JSON.parse(raw);
    return o?.code ? { code: o.code, consolider: !!o.consolider } : null;
  } catch {
    return null;
  }
}
function writePrepTheme(code, consolider = false) {
  try {
    localStorage.setItem(PREP_THEME_KEY, JSON.stringify({ code, consolider }));
  } catch {
    /* stockage indispo → le hero retombe sur la suggestion auto */
  }
}
function clearPrepTheme() {
  try {
    localStorage.removeItem(PREP_THEME_KEY);
    // Le cycle (angle de travail + startedAt) pointait sur l'ancien thème :
    // le garder ferait apparaître un débrief « Tu as revu X ? » sur une
    // compétence que l'élève a déjà certifiée.
    localStorage.removeItem(PREP_CYCLE_KEY);
  } catch {
    /* ignore */
  }
}

// Scène du hero selon l'heure LOCALE (l'élève vit en local). 3 illustrations
// de la même route de montagne : matin, midi, soir.
function prepScene() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "matin";
  if (h >= 11 && h < 18) return "midi";
  return "soir";
}

// Salutation contextuelle. Revisite dans la même journée → message chaleureux.
const LS_LAST_VISIT = "pg-last-visit";
function _greeting(awayDays) {
  if (awayDays >= 3) return "Content de te revoir,";
  let revisitToday = false;
  let hasPriorVisit = false;
  try {
    const today = new Date().toDateString();
    const last = localStorage.getItem(LS_LAST_VISIT);
    revisitToday = last === today;
    hasPriorVisit = !!last && last !== today; // déjà venu un autre jour → retour
    localStorage.setItem(LS_LAST_VISIT, today);
  } catch {
    /* ignore */
  }
  if (revisitToday) return "Ça fait plaisir de te revoir aujourd’hui,";
  if (hasPriorVisit) return "Rebonjour"; // l'élève revient un nouveau jour
  const h = new Date().getHours();
  if (h >= 18 || h < 5) return "Bonsoir";
  return "Bonjour";
}

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page.view", { page: "eleve_accueil" });

  // Welcome-back : jours écoulés depuis la visite précédente (localStorage,
  // plus fiable que last_active_at qui est touché par trigger à l'ouverture).
  let awayDays = 0;
  try {
    const prev = parseInt(
      localStorage.getItem("permigo-last-visit") || "0",
      10,
    );
    if (prev) awayDays = Math.floor((Date.now() - prev) / 86_400_000);
    localStorage.setItem("permigo-last-visit", String(Date.now()));
  } catch {
    /* localStorage indisponible → pas de welcome-back, pas grave */
  }
  if (awayDays >= 3) track("eleve.welcome_back", { awayDays });

  root.innerHTML = SKELETON;

  try {
    // Langue ≠ fr : titres de fiches affichés dans la langue choisie → chunk
    // i18n chargé ICI seulement (jamais pour les élèves FR). Les situations
    // ont le leur, chargé par la page En situation elle-même.
    if (getLang() !== "fr") {
      const [fm] = await Promise.allSettled([import("@/data/fiches-i18n.js")]);
      if (fm.status === "fulfilled") _ficheI18nMod = fm.value;
    }

    // Core fetches en parallèle
    const [profileRes, streakRes, validRes, notifRes, attemptsRes, selfValRes] =
      await Promise.allSettled([
        sb
          .from("profiles")
          .select(
            "prenom, nom, created_at, last_active_at, first_value_action_at, gemmes",
          )
          .eq("id", me.id)
          .maybeSingle(),
        sb
          .from("streaks")
          .select("current_streak, last_activity_date, longest_streak")
          .eq("user_id", me.id)
          .maybeSingle(),
        sb
          .from("validations")
          .select("competence_id, statut")
          .eq("eleve_id", me.id)
          .in("statut", ["acquis", "a_valider"]),
        sb
          .from("notifications")
          .select("id, data, type")
          .eq("user_id", me.id)
          .eq("read", false)
          .in("type", ["consolidation_quiz", "post_validation_quiz"])
          .order("created_at", { ascending: false })
          .limit(1),
        sb
          .from("quiz_attempts")
          .select("completed_at")
          .eq("user_id", me.id)
          .gte(
            "completed_at",
            new Date(Date.now() - 35 * 86400000).toISOString(),
          )
          .order("completed_at", { ascending: true }),
        // Validation autonome (élève solo, cf. valider-seul.js) : table
        // séparée de `validations`, fusionnée en lecture pour que le permis
        // virtuel compte aussi les compétences auto-validées (sinon un solo
        // reste affiché « 0/31 » à vie). Même pattern que mon-permis.js.
        sb
          .from("self_validations")
          .select("competence_id")
          .eq("eleve_id", me.id),
      ]);

    // RPCs optionnels (peuvent ne pas exister encore)
    const [todayQuestsRes] = await Promise.allSettled([
      sb.rpc("get_today_quests"),
    ]);

    const profile = profileRes.value?.data || {
      prenom: me.prenom || "Toi",
    };
    const rawStreak = streakRes.value?.data || {
      current_streak: 0,
      last_activity_date: null,
      longest_streak: 0,
    };
    // Série d'ACTIVITÉ (cf. migration 20260709120000_streak_activity_based) :
    // ouvrir l'app ne suffit plus, il faut avoir fait un quiz aujourd'hui.
    // get_today_quests avance la série côté serveur au retour sur l'accueil
    // APRÈS le quiz ; le read `streaks` ci-dessus étant fait AVANT cet avance,
    // on reflète le bump côté client si un quiz a bien été fait aujourd'hui
    // (affichage + célébration immédiats, sans round-trip en plus).
    // Heure LOCALE (l'élève vit en local ; le serveur date la série en
    // Europe/Paris → mêmes jours en France). Cohérent avec heatmap + daily-quiz.
    const _todayStr = todayKey();
    const _yesterday = yesterdayKey();
    const _didActivityToday = (attemptsRes.value?.data || []).some(
      (a) => a.completed_at && dayKey(a.completed_at) === _todayStr,
    );
    let streak = rawStreak;
    if (_didActivityToday && rawStreak.last_activity_date !== _todayStr) {
      const _bumped =
        rawStreak.last_activity_date === _yesterday
          ? (rawStreak.current_streak || 0) + 1
          : 1;
      streak = {
        current_streak: _bumped,
        longest_streak: Math.max(rawStreak.longest_streak || 0, _bumped),
        last_activity_date: _todayStr,
      };
    }
    const allValRows = validRes.value?.data || [];
    const validated = new Set(
      allValRows
        .filter((v) => v.statut === "acquis")
        .map((v) => v.competence_id),
    );
    for (const s of selfValRes.value?.data || [])
      validated.add(s.competence_id);
    const pendingNotif = notifRes.value?.data?.[0] || null;
    const activityDays = buildActivityData(
      attemptsRes.value?.data || [],
      streak,
    );
    // quest_validate_1 était masquée ici (« l'élève ne valide jamais lui-même,
    // c'est le moniteur ») — raison devenue fausse avec le pivot : l'élève
    // certifie lui-même, et depuis le 31/07 la certification autonome fait
    // avancer la quête (déclencheur sur self_validations). On l'affiche donc.
    const todayQuests = todayQuestsRes.value?.data || [];
    if (todayQuestsRes.status === "rejected" || todayQuestsRes.value?.error) {
      console.error(
        "[accueil] get_today_quests:",
        todayQuestsRes.reason ?? todayQuestsRes.value?.error,
      );
    }

    ensureHeatmapStyles();

    const worlds = computeWorlds(validated);
    const streakSt = streakStatus(streak);
    const gemmes = profile.gemmes || 0;

    // « Prépare ta prochaine leçon » — le hero de l'accueil (pivot 17/07 :
    // l'élève prépare sa vraie leçon de conduite ; la « question du jour » a
    // quitté l'accueil). L'algo CIBLE 3 suggestions : d'abord les compétences
    // non acquises qui recoupent « Mes fautes », puis la suite du parcours.
    // Le thème du hero = choix déclaré par l'élève (localStorage), sinon la
    // 1re suggestion. Fiches chargées en dynamique pour garder le chunk léger
    // (même raison que le deep-link `revision-conduite/next` des quêtes).
    let prep = null;
    let prepMondes = [];
    let prepSuggestions = [];
    try {
      const [{ getFiche, fichesByMonde, MONDES }, weakMod] = await Promise.all([
        import("@/data/fiches-conduite.js"),
        import("@/utils/weak-points.js"),
      ]);
      const order = WORLDS.flatMap((w) => w.subs.map((s) => s.c));
      const pool = order.filter((c) => getFiche(c));

      // Ciblage : fautes récentes (Mes fautes) > suite du parcours > révision
      const weakTags = new Set(
        weakMod.getWeakPoints({ limit: 5 }).map((w) => w.tag),
      );
      const notDone = pool.filter((c) => !validated.has(c));
      const targeted = notDone.filter((c) =>
        (weakMod.REMC_THEME_TAGS[c] || []).some((t) => weakTags.has(t)),
      );
      const picks = [
        ...targeted,
        ...notDone.filter((c) => !targeted.includes(c)),
      ].slice(0, 3);
      if (picks.length < 3)
        picks.push(
          ...pool.filter((c) => !picks.includes(c)).slice(0, 3 - picks.length),
        );
      prepSuggestions = picks.map((c) => ({
        code: c,
        titre: getFiche(c).titre,
        // `done` sert au choix manuel : piocher une compétence DÉJÀ acquise
        // dans la feuille = « je veux la consolider » → le hero la garde.
        done: validated.has(c),
        reason: targeted.includes(c)
          ? atR("reason_weak", "🎯 D'après tes fautes récentes")
          : !validated.has(c)
            ? atR("reason_next", "📍 La suite de ton parcours")
            : atR("reason_consol", "🔁 Acquise. Pour consolider"),
      }));

      // Le choix déclaré par l'élève est respecté — SAUF si la compétence est
      // devenue acquise entre-temps (certifiée par lui ou validée par son
      // moniteur). Dans ce cas le hero avance tout seul : c'est précisément
      // ce que « l'ancienne compétence ne s'enlève pas » signalait. Seul
      // « Je consolide encore » (drapeau `consolider`) la garde au hero.
      const declared = readPrepTheme();
      let code = null;
      if (declared && getFiche(declared.code)) {
        if (!validated.has(declared.code) || declared.consolider) {
          code = declared.code;
        } else {
          clearPrepTheme(); // acquise → on ne la ressert plus
        }
      } else if (declared) {
        clearPrepTheme(); // code inconnu (fiche supprimée/renommée)
      }
      if (!code) code = prepSuggestions[0]?.code || null;
      const fiche = code ? getFiche(code) : null;
      if (fiche) {
        prep = { code, titre: fiche.titre };
        prepMondes = MONDES.map((m) => ({
          n: m.n,
          nom: m.nom,
          fiches: fichesByMonde(m.n).map((f) => ({
            code: f.code,
            titre: f.titre,
            done: validated.has(f.code),
          })),
        }));
      }
    } catch {
      /* fiches indisponibles → le CTA retombe sur le hub Réviser */
    }

    track("streak.viewed", { days: streak.current_streak, status: streakSt });

    root.innerHTML = render({
      me,
      profile,
      streak,
      streakSt,
      worlds,
      activityDays,
      gemmes,
      todayQuests,
      pendingNotif,
      prep,
    });
    wire(root, {
      prep,
      prepMondes,
      prepSuggestions,
      streak,
      streakSt,
      gemmes,
      activityDays,
      todayQuests,
      pendingNotif,
    });

    // Pointeur « retrouve ce cours dans Réviser » : au retour d'une prep
    // (entre 1 min et 4 h après le lancement), UNE fois par cycle. L'onglet
    // Réviser pulse 2 fois — l'élève apprend où retrouver le cours sans
    // notification (l'infra push attend, décision Rayan : plan B d'abord).
    try {
      const cyc = loadPrepCycle();
      if (
        prep &&
        cyc &&
        cyc.code === prep.code &&
        cyc.startedAt &&
        !cyc.hinted &&
        Date.now() - cyc.startedAt > PREP_HINT_MIN_MS &&
        Date.now() - cyc.startedAt < PREP_DEBRIEF_AFTER_MS
      ) {
        savePrepCycle({ ...cyc, hinted: true });
        toast(
          atR(
            "hint_reviser",
            "Retrouve ce cours quand tu veux dans « Réviser » 📚",
          ),
          "info",
        );
        const tab = document.querySelector('.bn-tab[data-id="reviser"]');
        if (tab) {
          tab.classList.add("prep-pulse");
          setTimeout(() => tab.classList.remove("prep-pulse"), 2200);
        }
        track("prep.reviser_hint_shown", { code: prep.code });
      }
    } catch {
      /* best-effort — jamais bloquant pour l'accueil */
    }

    const accDiv = root.querySelector(".acc2");

    // Indice de cliquabilité : on fait « clignoter » une fois les pastilles
    // « va voir » (ligues + PermiGo+) pour signaler qu'on tape dessus — mais
    // seulement les 3 premières sessions, sinon ça devient du bruit pour les
    // habitués (l'app est un rituel quotidien).
    try {
      const seen = +(localStorage.getItem("pg-afford-hint") || 0);
      if (seen < 3) {
        accDiv?.classList.add("acc2-afford-hint");
        localStorage.setItem("pg-afford-hint", String(seen + 1));
      }
    } catch {
      /* localStorage indispo : pas grave, on n'affiche juste pas l'indice */
    }

    // Animation « série au lancement » (1×/jour, façon TikTok) : la flamme
    // surgit en grand puis vole se poser dans le badge en haut à gauche.
    // Réservée aux habitués : à la 1re arrivée, le tour guidé présente déjà
    // la flamme (TOUR_KEY absent) → on n'empile pas les deux.
    // Série d'activité : on célèbre SEULEMENT une fois la série sécurisée
    // aujourd'hui ("saved"). Les jours « en danger », c'est le bandeau SOS qui
    // s'affiche — pas de fête tant que le quiz du jour n'est pas fait.
    try {
      if (streakSt === "saved" && localStorage.getItem(TOUR_KEY)) {
        import("@/components/eleve/streak-launch.js")
          .then((m) => m.maybeShowStreakLaunch({ streak, streakSt }))
          .catch(() => {});
      }
    } catch {
      /* localStorage indispo → on saute l'anim, sans casser l'accueil */
    }

    // Composants non-bloquants injectés sous le fold
    if (accDiv) {
      // Quête du jour — une ligne, DANS la carte du permis virtuel. Sautée
      // quand les 31 compétences sont acquises : il n'y a plus rien à
      // certifier, et un objectif qu'on ne peut plus atteindre est pire que
      // pas d'objectif du tout.
      const questSlot = accDiv.querySelector("#acc-quest-slot");
      if (questSlot && worlds.reduce((s, w) => s + w.done, 0) < 31) {
        Promise.resolve()
          .then(() =>
            mountDailyQuests(questSlot, { prefetchedQuests: todayQuests }),
          )
          .catch(() => {});
      }
      // « Retours de ton moniteur » retiré (pivot : le moniteur n'émet plus de
      // validations/retours — décision Rayan 24/07). Le compte-rendu de leçon,
      // lui, reste (slot #acc-cr-top-slot sous le hero).
    }

    // Leaderboard async
    _loadAndInjectLeagues(root);

    // Bannière émotionnelle — insérée juste après le hero v2
    emotionalBanner
      .checkAndRender(root, { afterSelector: ".acc2-hero-v2" })
      .catch(() => {});

    // Coffres disponibles — teaser non-bloquant injecté sous l'action du jour
    _loadAndInjectChests(root);

    // Onboarding premier login : géré en amont par main.js (page plein écran
    // pages/onboarding/index.js, gate first_value_action_at). Rien à faire ici.

    // Push web (soft, après 5s)
    if (profile.first_value_action_at) {
      maybeSoftRequestPush();
      maybeSendStreakRiskNotif();
    }

    // Tour guidé première arrivée (après le wiring, ancres en place)
    maybeStartEleveTour();
  } catch (e) {
    console.error("[accueil] mount failed", e);
    root.innerHTML = `<div style="padding:60px 24px;text-align:center;color:var(--mu3);font-family:'Archivo',sans-serif">
      <div style="font:800 18px/1.3 'Archivo',sans-serif;color:var(--ink);margin-bottom:8px">${at("err_t", "« Accueil » indisponible")}</div>
      <p style="font-size:14px;line-height:1.5;margin:0 0 20px">${at("err_s", "Vérifie ta connexion puis réessaie.")}</p>
      <button id="acc-reload" style="padding:12px 24px;border:0;background:var(--a);color: var(--a-ink);border-radius:12px;font:700 14px/1 'Archivo',sans-serif;cursor:pointer">${at("err_retry", "Réessayer")}</button>
    </div>`;
    root
      .querySelector("#acc-reload")
      ?.addEventListener("click", () => location.reload());
  }
}

// ─── Logique métier ───────────────────────────────────────────────
function computeWorlds(validatedIds) {
  return WORLDS.map((w) => {
    const done = w.subs.filter((s) => validatedIds.has(s.c)).length;
    const pct = w.total > 0 ? Math.round((done / w.total) * 100) : 0;
    return { ...w, done, pct, complete: w.total > 0 && done === w.total };
  });
}

function streakStatus(streak) {
  if (!streak.current_streak) return "broken";
  const today = todayKey();
  // Série d'activité : « sauvée » seulement si une activité a été faite AUJOURD'HUI.
  if (streak.last_activity_date === today) return "saved";
  const yesterday = yesterdayKey();
  // Dernière activité ≥ 2 jours → la série est effectivement perdue.
  if (streak.last_activity_date !== yesterday) return "broken";
  // Dernière activité HIER, rien encore aujourd'hui → en danger (saute à minuit).
  const hoursLeft = 24 - new Date().getHours() - new Date().getMinutes() / 60;
  return hoursLeft < 6 ? "critical" : "at_risk";
}

// Bandeau « série en danger » : n'apparaît QUE les jours où l'élève n'a pas
// encore fait son activité (série d'activité). Il pousse d'abord vers le quiz
// (la bonne façon de garder la série), et propose le gel en filet si l'élève a
// les volants. Rien si la série est déjà sauvée/cassée/inexistante.
function renderStreakSos({ streak, streakSt, gemmes, href }) {
  if (streakSt !== "at_risk" && streakSt !== "critical") return "";
  const n = streak.current_streak || 0;
  if (n < 1) return "";
  const crit = streakSt === "critical";
  const jours = `${n} ${atDay(n)}`;
  const title = crit
    ? atR("sos_title_crit", "Ta série de {j} saute bientôt&nbsp;!").replace(
        "{j}",
        jours,
      )
    : atR("sos_title_risk", "Ta série de {j} va sauter ce soir").replace(
        "{j}",
        jours,
      );
  const sub = crit
    ? atR("sos_sub_crit", "Vite. Un quiz suffit pour la sauver.")
    : atR("sos_sub_risk", "Fais ton quiz du jour pour la garder.");
  const freeze =
    gemmes >= 50
      ? `<button class="acc2-sos-freeze" id="sos-freeze-btn" type="button"
           aria-label="${escAttr(atR("sos_freeze_aria", "Geler ma série pour 50 volants"))}">${at("sos_freeze", "Geler · 50")} ${volantImg(15)}</button>`
      : "";
  return `
  <div class="acc2-sos${crit ? " crit" : ""}" id="acc-sos">
    <button class="acc2-sos-main" id="sos-go" type="button" data-href="${escAttr(href || "")}"
            aria-label="${escAttr(`${title.replace(/&nbsp;/g, " ")}. ${sub}`)}">
      <span class="acc2-sos-flame" aria-hidden="true">
        <img src="/skins/permigo-streak-flame-v1.webp" alt="">
      </span>
      <span class="acc2-sos-txt">
        <span class="acc2-sos-title">${_rtl(title)}</span>
        <span class="acc2-sos-sub">${_rtl(sub)}</span>
      </span>
      <span class="acc2-sos-arr" aria-hidden="true">→</span>
    </button>
    ${freeze}
  </div>`;
}

// ─── Render ───────────────────────────────────────────────────────
function render({
  me,
  profile,
  streak,
  streakSt,
  worlds,
  activityDays,
  gemmes,
  todayQuests,
  pendingNotif,
  prep,
}) {
  const totalValidated = worlds.reduce((s, w) => s + w.done, 0);
  const prenom = profile.prenom || me.prenom || "Toi";
  // Bandeau d'installation — visible TANT QUE l'app n'est pas installée
  // (sur iPhone, installer = la seule façon d'avoir les notifs). Il disparaît
  // tout seul une fois installée (isStandalone) : pas un popup qu'on oublie.
  const installBanner = !isStandalone()
    ? `<style>
    .acc-install{display:flex;align-items:center;gap:10px;margin:0 16px 12px;padding:10px 12px;border-radius:14px;background:color-mix(in srgb, var(--a) 7%, transparent);border:1px solid color-mix(in srgb, var(--a) 22%, transparent);box-shadow:0 3px 10px -4px color-mix(in srgb, var(--a) 20%, transparent)}
    .acc-install-ico{flex:0 0 38px;width:38px;height:38px;display:flex;align-items:center;justify-content:center}
    .acc-install-ico .pg-med{filter:drop-shadow(0 3px 6px rgba(0,0,0,.14))}
    .acc-install-txt{min-width:0;flex:1}
    .acc-install-t{font:700 13px/1.2 'Archivo',sans-serif;color:var(--ink)}
    .acc-install-s{font:500 11px/1.3 'Archivo',sans-serif;color:var(--mu);margin-top:2px}
    .acc-install-btn{flex:0 0 auto;min-height:44px;padding:0 14px;border:0;border-radius:10px;background:linear-gradient(180deg,var(--acc-vio-lt),var(--acc-vio));color:#fff;font:700 12px/1 'Archivo',sans-serif;cursor:pointer;box-shadow:0 3px 8px -2px color-mix(in srgb, var(--a) 45%, transparent)}
    .acc-install-btn:active{transform:scale(.96)}
    </style>
    <div class="acc-install" id="acc-install">
      <div class="acc-install-ico" aria-hidden="true">${medallion("fusee", "cyan", { size: 38 })}</div>
      <div class="acc-install-txt">
        <div class="acc-install-t">${at("install_t", "Installe PermiGo sur ton téléphone")}</div>
        <div class="acc-install-s">${at("install_s", "Accès direct et tes rappels · 10 secondes.")}</div>
      </div>
      <button class="acc-install-btn" id="acc-install-btn" type="button">${at("install_btn", "Installer")}</button>
    </div>`
    : "";
  const isActive = streakSt !== "broken";
  // First-run: no competence validated AND no streak yet → student has never done anything
  const isFirstRun = totalValidated === 0 && !streak.current_streak;

  // ── Séance à confirmer (priorité absolue quand présente) ──

  // ── Hero « Prépare ta prochaine leçon » (maquette A validée 17/07) ──
  // Toujours le même message : l'élève prépare sa vraie leçon de conduite.
  // Le CTA king garde l'id action-cta-btn (tour guidé + wire inchangés).
  // La DESTINATION tourne selon le cycle (fiche → questions → situation) :
  // variété invisible, zéro encombrement du hero.
  // Repli sans fiche (données indisponibles) : le hub Réviser.
  const _heroTitle = prep?.titre || "Prépare ta prochaine leçon";
  const _scene = prepScene();
  const _prepCycle = prep ? loadPrepCycle() : null;
  const _prepStep =
    _prepCycle && _prepCycle.code === prep?.code
      ? (_prepCycle.step || 0) % 3
      : 0;
  const _heroHref = prep ? prepHrefFor(prep.code, _prepStep) : "#/reviser";

  // Bloc « Revenons sur ta leçon » : la prep a été lancée il y a > 4 h →
  // la leçon a plausiblement eu lieu. Jamais de note, jamais « échec » :
  // consolider est un choix aussi valorisé que passer à la suite.
  const _debriefDue =
    prep &&
    _prepCycle &&
    _prepCycle.code === prep.code &&
    _prepCycle.startedAt &&
    !_prepCycle.answered &&
    Date.now() - _prepCycle.startedAt > PREP_DEBRIEF_AFTER_MS;
  const debriefCard = _debriefDue
    ? `
  <section class="acc2-debrief" id="acc-debrief" aria-label="${escAttr(atR("debrief_k", "Revenons sur ta leçon"))}">
    <p class="acc2-debrief-k">🚗 ${at("debrief_k", "Revenons sur ta leçon")}</p>
    <p class="acc2-debrief-t">${_rtl(esc(atR("debrief_t", "Tu as revu « {t} » avec ton enseignant ?").replace("{t}", ficheTitre(prep.code, prep.titre))))}</p>
    <p class="acc2-debrief-s">${at("debrief_s", "Certaines compétences demandent plusieurs leçons. C'est normal. On continue ensemble.")}</p>
    <div class="acc2-debrief-row">
      <button class="acc2-debrief-btn keep" id="debrief-keep" type="button">${at("debrief_keep", "Je consolide encore")}</button>
      <button class="acc2-debrief-btn next" id="debrief-next" type="button">${at("debrief_next", "Leçon suivante →")}</button>
    </div>
    <button class="acc2-debrief-later" id="debrief-later" type="button">${at("debrief_later", "Pas encore eu ma leçon")}</button>
  </section>`
    : "";

  // La série d'activité se sauve avec un QUIZ (quiz_attempts) : le bandeau
  // SOS pointe donc toujours vers un quiz, pas vers la fiche du hero.
  const _sosHref = "#/quiz/next/post_validation/revision";

  // Quiz de consolidation / récap en attente : la porte vit désormais dans
  // une carte compacte sous le CTA (le hero ne change plus de visage).
  const _isCons = pendingNotif?.type === "consolidation_quiz";
  const _consolHref = pendingNotif?.data?.competence_id
    ? `#/quiz/${encodeURIComponent(String(pendingNotif.data.competence_id))}/${_isCons ? "consolidation" : "post_validation"}`
    : "";
  const consolCard = pendingNotif?.data?.competence_id
    ? `
  <button class="acc2-consol" id="acc-consol-btn" type="button"
          data-href="${escAttr(_consolHref)}"
          aria-label="${escAttr(_isCons ? atR("consol_aria_cons", "Quiz de consolidation. 2 questions, 30 secondes") : atR("consol_aria_rec", "Quiz-récap. 3 questions"))}">
    <span class="acc2-consol-ico" aria-hidden="true">🧠</span>
    <span class="acc2-consol-txt">
      <span class="acc2-consol-t">${_isCons ? at("consol_t_cons", "Ancre ta nouvelle compétence") : at("consol_t_rec", "Récap sur ta compétence")}</span>
      <span class="acc2-consol-s">${_isCons ? at("consol_s_cons", "Quiz de consolidation · 2 questions · 30 s") : at("consol_s_rec", "Quiz-récap · 3 questions · optionnel")}</span>
    </span>
    <span class="acc2-consol-arr" aria-hidden="true">→</span>
  </button>`
    : "";

  return `${STYLE}
<div class="acc2${isFirstRun ? " acc2--first-run" : ""}">
  ${installBanner}

  <!-- ══ HUD — série ══ (le solde de volants vit dans le header global) -->
  <div class="acc2-hud">
    <button class="acc2-chip streak${isActive ? "" : " inactive"}" id="streak-badge-btn"
            type="button" aria-label="${escAttr(atR("hud_streak_aria", "Série de {n} jours · voir le détail").replace("{n}", streak.current_streak))}">
      <img src="/skins/permigo-streak-flame-v1.webp" alt="" aria-hidden="true">
      <span class="num">${streak.current_streak}</span>
    </button>
  </div>

  ${renderStreakSos({ streak, streakSt, gemmes, href: _sosHref })}

  <!-- ══ HERO FOCAL — Prépare ta leçon (grand) ══ -->
  <section class="acc2-hero-v2 acc2-hero--${_scene}" aria-label="${escAttr(atR("hero_aria", "Prépare ta prochaine leçon"))}">
    <img class="acc2-hero-bg" src="/skins/prepare-lecon/${_scene}.webp" alt="" aria-hidden="true"
         width="1200" height="675" fetchpriority="high" decoding="async">
    <div class="acc2-hero-shade" aria-hidden="true"></div>
    <div class="acc2-hero-gloss" aria-hidden="true"></div>
    <div class="acc2-hero-v2-txt">
      <p class="acc2-hero-kicker">${at("hero_kicker", "Ta prochaine leçon")}</p>
      <h1 class="acc2-hero-h1" id="prep-hero-title">${at("hero_h1", "Prépare ta leçon")}</h1>
      ${
        prep
          ? `<button class="acc2-prep-pill" id="prep-theme-btn" type="button"
              aria-label="${escAttr(atR("prep_pill_aria", "Thème de ta prochaine leçon : {t}. Appuie pour changer").replace("{t}", ficheTitre(prep.code, prep.titre)))}">
              <span class="acc2-prep-pill-ic" aria-hidden="true">🎯</span>
              <span class="acc2-prep-pill-tl">
                <b id="prep-theme-name">${_rtl(esc(ficheTitre(prep.code, prep.titre)))}</b>
                <span>${at("prep_pill_sub", "Pour ta prochaine heure")}</span>
              </span>
              <span class="acc2-prep-chev" aria-hidden="true">›</span>
            </button>`
          : `<p class="acc2-hero-meta">${at("hero_meta", "Sois prêt·e en 5 min pour ta prochaine heure de conduite.")}</p>`
      }
      <div class="acc2-hero-spacer" aria-hidden="true"></div>
      <div class="acc2-hero-cta-wrap">
        <button class="acc2-cta-king"
                id="action-cta-btn" type="button" data-href="${escAttr(_heroHref)}">
          ${at("cta_king", "Je me prépare")} <span class="acc2-cta-arr" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </section>

  <!-- Compte-rendu du moniteur (injecté async) — juste sous le hero, au-dessus
       du fold : c'est la porte d'entrée la plus fiable vers le retour du moniteur. -->
  <div id="acc-cr-top-slot"></div>
  ${debriefCard}
  ${consolCard}

  <!-- ══ MISE EN SITUATION — jaquette générique (esprit « mode de jeu ») ══
       La carte d'accueil ne montre JAMAIS le scénario du jour : même image,
       même texte tous les jours. La vraie scène (question + réponses) ne se
       découvre qu'après le clic, sur #/en-situation/jour. -->
  <style>
    .acc2-cover{display:block;position:relative;width:calc(100% - 32px);margin:0 16px 14px;padding:0;border:0;border-radius:22px;overflow:hidden;cursor:pointer;aspect-ratio:16/10;background:#16103c;box-shadow:0 14px 30px -12px rgba(38,20,90,.55);-webkit-tap-highlight-color:transparent;transition:transform .18s cubic-bezier(.2,.8,.3,1)}
    .acc2-cover:active{transform:scale(.985)}
    .acc2-cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 58%;transition:transform .35s cubic-bezier(.2,.8,.3,1)}
    @media (hover:hover){.acc2-cover:hover .acc2-cover-img{transform:scale(1.04)}}
    .acc2-cover-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,12,58,.30) 0%,rgba(22,12,58,.08) 34%,rgba(18,9,48,.58) 74%,rgba(15,7,40,.88) 100%)}
    .acc2-cover-in{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 16px 15px}
    .acc2-cover-t{flex:1;min-width:0;text-align:left;font:900 clamp(21px,6.4vw,30px)/1.03 'Archivo',system-ui,sans-serif;word-spacing:.06em;text-transform:uppercase;color:#fff;text-shadow:0 3px 0 rgba(88,40,200,.55),0 10px 26px rgba(26,9,68,.85)}
    .acc2-cover-btn{flex:0 0 auto;background:#fff;color:#24124f;font:800 15px/1 'Archivo',system-ui,sans-serif;border-radius:999px;padding:13px 24px;box-shadow:0 8px 18px -8px rgba(10,4,32,.8)}
    /* Arabe : l'app reste LTR (cf. lang.js) mais une jaquette se lit dans le
       sens de sa langue → on inverse titre/bouton et on aligne à droite. Le
       titre est agrandi : à taille égale, l'arabe paraît deux fois plus petit
       que les capitales latines, et Archivo n'a pas d'arabe (repli système,
       d'où la graisse 800 plutôt que 900 qui serait faussement grasse). */
    .acc2-cover.is-rtl .acc2-cover-in{flex-direction:row-reverse}
    .acc2-cover.is-rtl .acc2-cover-t{text-align:right;font-size:clamp(25px,7.6vw,35px);font-weight:800;line-height:1.35}
    @media (prefers-reduced-motion:reduce){.acc2-cover,.acc2-cover-img{transition:none}}
  </style>
  <button class="acc2-cover${getLang() === "ar" ? " is-rtl" : ""}" id="acc-sit-day" type="button"
          aria-label="${escAttr(atR("sitday_aria", "Mise en situation. Jouer la scène du jour"))}">
    <img class="acc2-cover-img" src="/skins/cover-mise-en-situation.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <span class="acc2-cover-veil" aria-hidden="true"></span>
    <span class="acc2-cover-in">
      <span class="acc2-cover-t">${at("sitday_title", "Mise en situation")}</span>
      <span class="acc2-cover-btn" aria-hidden="true">${at("sitday_play", "Jouer")}</span>
    </span>
  </button>

  <!-- ══ PERMIS VIRTUEL — carte compacte maquette ══ -->
  <div class="acc2-permis-compact" id="acc-permis" role="button" tabindex="0"
       aria-label="${escAttr(atR("permis_aria", "Ton permis virtuel. {n} sur 31 compétences").replace("{n}", totalValidated))}">
    <div class="acc2-permis-thumb">
      <img src="/skins/trophy-permis-virtuel.webp" alt="" aria-hidden="true" loading="eager">
    </div>
    <div class="acc2-permis-body">
      <div class="acc2-permis-row">
        <span class="acc2-permis-label2">${at("permis_label", "Ton permis virtuel")}</span>
        <span class="acc2-permis-val">${totalValidated}/31</span>
      </div>
      <div class="acc2-permis-bar">
        <span class="acc2-permis-fill" data-target="${Math.round((totalValidated / 31) * 100)}"></span>
      </div>
      <span class="acc2-permis-sub">${
        totalValidated === 0
          ? isSoloEleve(me)
            ? at(
                "permis_sub_zero_solo",
                "Chaque compétence que tu valides le complète.",
              )
            : at(
                "permis_sub_zero_mon",
                "Chaque compétence validée par ton moniteur le complète.",
              )
          : totalValidated >= 31
            ? at("permis_sub_done", "Toutes les compétences acquises. Bravo !")
            : _rtl(
                esc(
                  atR(
                    "permis_sub_left",
                    "Plus que {n} compétence{s} avant l’examen",
                  )
                    .replace("{n}", 31 - totalValidated)
                    .replace(
                      "{s}",
                      31 - totalValidated > 1 && getLang() !== "ar" ? "s" : "",
                    ),
                ),
              )
      }</span>
    </div>
    <!-- Quête du jour (injectée async) : elle vit DANS cette carte, sous le
         compteur qu'elle fait avancer. Décision Rayan 31/07 — un bloc de moins
         sur l'accueil, et plus rien entre « Prépare ta leçon » et la mise en
         situation. Posée en pleine largeur (et non dans la colonne de droite)
         sinon le texte se casse en trois lignes à côté du bouton. -->
    <div id="acc-quest-slot"></div>
  </div>

  <!-- Tes ligues : École (REMC) + Révision (quiz solo), à égalité -->
  <div id="acc-lb-slot"></div>

  <!-- ══ BELOW FOLD ══ -->
  <!-- Note : l'entraînement (examen blanc, révision conduite, en situation,
       centre d'examen) vit dans les onglets « Réviser » et « Mon permis ».
       L'accueil ne garde ici que ce qui vient du moniteur + les coffres. -->

  <!-- Slot coffre (injecté async par _loadAndInjectChests) -->
  <div id="acc-chest-slot"></div>

</div>

<!-- STREAK BOTTOM SHEET -->
<div class="bs-bg" id="bs-bg"></div>
<div class="bs-streak" id="bs-streak" role="dialog" aria-label="${escAttr(atR("bs_streak_aria", "Détail de ta série"))}">
  <div class="bs-handle"></div>
  <div class="bs-hd">
    <div class="bs-hd-title">${at("bs_title", "Ta série de révision")}</div>
    <div class="bs-hd-sub">${_rtl(
      esc(
        atR("bs_record", "Record : {r} {jr} · En cours : {c}")
          .replace("{r}", streak.longest_streak)
          .replace("{jr}", atDay(streak.longest_streak))
          .replace("{c}", streak.current_streak),
      ),
    )}</div>
  </div>
  <div class="bs-hmap-wrap">
    <div class="bs-hmap-head">
      <span class="bs-hmap-title">${at("bs_mymonth", "Mon mois")}</span>
      <span class="bs-hmap-sub">${_rtl(
        esc(
          atR("bs_active", "{n} jour{s} actif{s}")
            .replace("{n}", activityDays.totalActive)
            .replace(
              /\{s\}/g,
              activityDays.totalActive > 1 && getLang() !== "ar" ? "s" : "",
            ),
        ),
      )}</span>
    </div>
    ${renderHeatmap({ activeDates: activityDays.activeDates, activityLevels: activityDays.levels, activityDetails: activityDays.details, weeks: 5, title: "" })}
    <div class="hmap-tap-info" id="hmap-info" style="opacity:0"> </div>
  </div>
  ${
    (streakSt === "critical" || streakSt === "at_risk") && gemmes >= 50
      ? `
  <div class="bs-freeze-wrap">
    <button class="bs-freeze-btn" id="bs-freeze-btn">${at("bs_freeze", "Geler ma série · 50")} ${volantImg(16)}</button>
    <div class="bs-freeze-desc">${at("bs_freeze_desc", "Protège ta série pendant 24 h.")}</div>
  </div>`
      : ""
  }
</div>`;
}

// ─── Bloc 2 renderers ────────────────────────────────────────────

// ─── Wire ────────────────────────────────────────────────────────
function wire(
  root,
  {
    prep,
    prepMondes,
    prepSuggestions,
    streak,
    streakSt,
    gemmes,
    activityDays,
    todayQuests,
    pendingNotif,
  },
) {
  // Pastille 🎯 « Changer de thème » → feuille ciblée (3 suggestions)
  root.querySelector("#prep-theme-btn")?.addEventListener("click", () => {
    haptic("select");
    track("prep.theme_sheet_opened", { current: prep?.code || null });
    openPrepThemeSheet(root, { prep, prepMondes, prepSuggestions });
  });

  // Carte consolidation / récap compacte (sous le CTA roi)
  root.querySelector("#acc-consol-btn")?.addEventListener("click", (e) => {
    const href = e.currentTarget.dataset.href;
    if (href) {
      haptic("select");
      track("cta.clicked", { cta_type: "consolidation_card" });
      navigate(href);
    }
  });

  // Bandeau « Installe l'app » (présent tant que pas installé) → ouvre la sheet
  const installBtn = root.querySelector("#acc-install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", () => {
      haptic("tap");
      try {
        track("install.home_banner_click");
      } catch {
        /* best-effort */
      }
      openInstallSheet(getCurUser());
    });
  }

  // Permis virtuel compact : barre animée + tap → parcours
  const permisFill = root.querySelector(".acc2-permis-fill[data-target]");
  if (permisFill)
    setTimeout(() => {
      permisFill.style.width = permisFill.dataset.target + "%";
    }, 150);
  const permisCard = root.querySelector("#acc-permis");
  if (permisCard) {
    const openParcours = () => {
      haptic("tap");
      track("cta.clicked", { cta_type: "permis_card" });
      navigate("#/parcours");
    };
    permisCard.addEventListener("click", openParcours);
    permisCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openParcours();
      }
    });
  }

  // Scène du jour → manche En situation qui démarre par cette scène
  root.querySelector("#acc-sit-day")?.addEventListener("click", () => {
    haptic("tap");
    track("cta.clicked", { cta_type: "scene_du_jour" });
    navigate("#/en-situation/jour");
  });

  // Streak badge → bottom sheet
  const bsBg = root.querySelector("#bs-bg");
  const bsSheet = root.querySelector("#bs-streak");
  const openBS = () => {
    bsSheet?.classList.add("open");
    bsBg?.classList.add("open");
    track("streak.detail_opened", { days: streak?.current_streak });
  };
  const closeBS = () => {
    bsSheet?.classList.remove("open");
    bsBg?.classList.remove("open");
  };
  root.querySelector("#streak-badge-btn")?.addEventListener("click", openBS);
  bsBg?.addEventListener("click", closeBS);

  // Gel de série — logique partagée entre le tiroir (#bs-freeze-btn) et le
  // bandeau « série en danger » (#sos-freeze-btn). Restaure le libellé initial
  // du bouton en cas d'échec (capturé à la volée, chaque bouton a le sien).
  const runStreakFreeze = async (btn, onDone) => {
    if (!btn || btn.disabled) return;
    const prev = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = atR("freeze_wait", "⏳ Gel en cours…");
    try {
      const { data, error } = await sb.rpc("use_streak_freeze");
      if (error || data?.error) {
        toast(
          atR("freeze_need", "Il te faut 50 volants pour geler ta série."),
          "error",
        );
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = prev;
        }, 1800);
        return;
      }
      track("streak.freeze_used", {});
      toast(atR("freeze_ok_toast", "Série gelée pour 24 h."), "success");
      btn.textContent = atR("freeze_ok_btn", "✓ Série gelée"); // évite de laisser le libellé d'attente figé
      onDone?.();
    } catch {
      toast(atR("freeze_fail", "Le gel a échoué. Réessaie."), "error");
      btn.disabled = false;
      btn.innerHTML = prev;
    }
  };

  const bsFreezeBtn = root.querySelector("#bs-freeze-btn");
  bsFreezeBtn?.addEventListener("click", () =>
    runStreakFreeze(bsFreezeBtn, closeBS),
  );

  // Bandeau « série en danger » : réviser (garde la série) ou la geler (filet).
  const sosGo = root.querySelector("#sos-go");
  sosGo?.addEventListener("click", () => {
    haptic("tap");
    track("streak.sos_revise", { days: streak?.current_streak });
    const href = sosGo.dataset.href;
    if (href) navigate(href);
  });
  const sosFreezeBtn = root.querySelector("#sos-freeze-btn");
  sosFreezeBtn?.addEventListener("click", () =>
    runStreakFreeze(sosFreezeBtn, () => {
      track("streak.sos_freeze", { days: streak?.current_streak });
      const sos = root.querySelector("#acc-sos");
      if (sos) {
        sos.style.transition = "opacity .3s ease, transform .3s ease";
        sos.style.opacity = "0";
        sos.style.transform = "translateY(-6px)";
        setTimeout(() => sos.remove(), 320);
      }
    }),
  );

  // Heatmap tap
  const infoEl = root.querySelector("#hmap-info");
  root.querySelectorAll(".hmap-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const label = cell.dataset.label;
      const detail = cell.dataset.detail
        ? decodeURIComponent(cell.dataset.detail)
        : null;
      if (!label || !infoEl) return;
      infoEl.textContent = detail || label;
      infoEl.style.opacity = "1";
      clearTimeout(infoEl._t);
      infoEl._t = setTimeout(() => {
        infoEl.style.opacity = "0";
      }, 2500);
    });
  });

  // CTA king (hero prep) — enregistre le cycle AVANT de naviguer : l'angle
  // tourne pour la prochaine prep (fiche → questions → situation → questions…)
  // et `startedAt` arme le bloc « Revenons sur ta leçon » (~4 h plus tard).
  root.querySelector("#action-cta-btn")?.addEventListener("click", (e) => {
    const href = e.currentTarget.dataset.href;
    if (href) {
      haptic("select");
      track("cta.clicked", { cta_type: "action_btn" });
      if (prep && href !== "#/reviser") {
        const cyc = loadPrepCycle();
        const same = cyc && cyc.code === prep.code;
        const step = same ? (cyc.step || 0) % 3 : 0;
        savePrepCycle({
          code: prep.code,
          // Après la mise en situation (2), on repart sur les questions (1) —
          // la fiche (0) ne revient que sur un NOUVEAU thème.
          step: step === 2 ? 1 : step + 1,
          startedAt: Date.now(),
          hinted: same ? cyc.hinted || false : false,
          answered: false,
        });
        track("prep.step_started", { code: prep.code, step });
      }
      navigate(href);
    }
  });

  // ── Bloc « Revenons sur ta leçon » (débrief sans note) ──
  const _closeDebrief = () => root.querySelector("#acc-debrief")?.remove();
  root.querySelector("#debrief-keep")?.addEventListener("click", () => {
    haptic("select");
    track("prep.debrief_keep", { code: prep?.code });
    const cyc = loadPrepCycle();
    if (cyc) savePrepCycle({ ...cyc, answered: true });
    // Choix explicite : garder ce thème au hero MÊME s'il est déjà certifié.
    // C'est le seul cas où une compétence acquise reste dans « Prépare ».
    if (prep?.code) writePrepTheme(prep.code, true);
    _closeDebrief();
    toast(
      atR(
        "debrief_keep_toast",
        "On consolide. C'est comme ça qu'on progresse 💪",
      ),
      "success",
    );
  });
  root.querySelector("#debrief-next")?.addEventListener("click", () => {
    haptic("select");
    track("prep.debrief_next", { code: prep?.code });
    // Thème suivant = première suggestion différente du thème courant
    const next =
      (prepSuggestions || []).find((s) => s.code !== prep?.code) || null;
    if (next) {
      writePrepTheme(next.code, false);
      savePrepCycle({
        code: next.code,
        step: 0,
        startedAt: null,
        hinted: false,
        answered: false,
      });
      const nm = root.querySelector("#prep-theme-name");
      if (nm) nm.innerHTML = _rtl(esc(ficheTitre(next.code, next.titre)));
      const cta = root.querySelector("#action-cta-btn");
      if (cta) cta.dataset.href = prepHrefFor(next.code, 0);
      if (prep) {
        prep.code = next.code;
        prep.titre = next.titre;
      }
      toast(
        atR("debrief_new_toast", "Nouvelle leçon à préparer : {t}").replace(
          "{t}",
          ficheTitre(next.code, next.titre),
        ),
        "success",
      );
    } else {
      const cyc = loadPrepCycle();
      if (cyc) savePrepCycle({ ...cyc, answered: true });
    }
    _closeDebrief();
  });
  root.querySelector("#debrief-later")?.addEventListener("click", () => {
    haptic("tap");
    track("prep.debrief_later", { code: prep?.code });
    // Report discret : on redemandera ~4 h plus tard, jamais de relance lourde
    const cyc = loadPrepCycle();
    if (cyc) savePrepCycle({ ...cyc, startedAt: Date.now() });
    _closeDebrief();
  });
}

// ─── Feuille « Changer de thème » (hero prépare ta leçon) ────────
// Pas de longue liste : l'algo CIBLE 3 prochaines compétences (fautes
// récentes > suite du parcours) affichées en grand, avec la raison du choix
// — l'élève sent que c'est préparé POUR LUI. La liste complète reste
// accessible derrière un lien discret (l'élève dont le moniteur a annoncé
// « demain, créneau » doit pouvoir viser précis). Choisir un thème
// enregistre une intention locale (PREP_THEME_KEY) et met à jour le hero
// EN PLACE (titre + destination du CTA) — pas de re-render complet.
function openPrepThemeSheet(root, { prep, prepMondes, prepSuggestions }) {
  if (!prepSuggestions?.length || document.querySelector(".prep-sheet-ov"))
    return;

  const ov = document.createElement("div");
  ov.className = "prep-sheet-ov";
  ov.innerHTML = `
    <div class="prep-sheet" role="dialog" aria-modal="true"
         aria-label="${escAttr(atR("sheet_aria", "Choisir le thème de ta prochaine leçon"))}" tabindex="-1">
      <div class="prep-sheet-grab" aria-hidden="true"></div>
      <h2 class="prep-sheet-h">${at("sheet_h", "Ta prochaine leçon c'est quoi ?")}</h2>
      <p class="prep-sheet-s">${at("sheet_s", "PermiGo a ciblé tes 3 prochaines. À toi de choisir.")}</p>
      <div class="prep-sheet-list">
        ${prepSuggestions
          .map(
            (s, i) => `
          <button class="prep-sheet-item sug${s.code === prep?.code ? " cur" : ""}"
                  type="button" data-code="${escAttr(s.code)}" data-titre="${escAttr(ficheTitre(s.code, s.titre))}"
                  ${s.done ? 'data-done="1"' : ""}>
            <span class="sug-n" aria-hidden="true">${i + 1}</span>
            <span class="tt">
              <span class="sug-t">${_rtl(esc(ficheTitre(s.code, s.titre)))}</span>
              <span class="sug-r">${_rtl(esc(s.reason))}</span>
            </span>
            <span class="sug-go" aria-hidden="true">→</span>
          </button>`,
          )
          .join("")}
        <button class="prep-sheet-more" id="prep-more-btn" type="button">
          ${at("sheet_more_q", "Un autre thème en tête ?")} <u>${at("sheet_more_u", "Toute la liste")}</u>
        </button>
        <div class="prep-sheet-all" hidden>
          ${prepMondes
            .map(
              (m) => `
            <div class="prep-sheet-monde">${at("sheet_monde", "Monde")} ${m.n} · ${_rtl(esc(mondeNom(m.n, m.nom)))}</div>
            ${m.fiches
              .map(
                (f) => `
              <button class="prep-sheet-item${f.code === prep?.code ? " cur" : ""}"
                      type="button" data-code="${escAttr(f.code)}" data-titre="${escAttr(ficheTitre(f.code, f.titre))}"
                      ${f.done ? 'data-done="1"' : ""}>
                <span class="tt">${_rtl(esc(ficheTitre(f.code, f.titre)))}</span>
                ${f.done ? `<span class="ok" aria-label="${escAttr(atR("sheet_done_aria", "déjà acquise"))}">✓</span>` : ""}
              </button>`,
              )
              .join("")}`,
            )
            .join("")}
        </div>
      </div>
    </div>`;

  const close = () => {
    document.removeEventListener("keydown", onKey);
    ov.remove();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  ov.addEventListener("click", (e) => {
    if (e.target === ov) close();
  });
  document.addEventListener("keydown", onKey);

  // « Toute la liste » : déplie les 31 fiches par monde (une seule fois)
  const moreBtn = ov.querySelector("#prep-more-btn");
  moreBtn?.addEventListener("click", () => {
    ov.querySelector(".prep-sheet-all")?.removeAttribute("hidden");
    moreBtn.remove();
    track("prep.theme_list_expanded", {});
  });

  ov.querySelectorAll(".prep-sheet-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      const titre = btn.dataset.titre || "";
      // Choisir une compétence DÉJÀ acquise = demander à la consolider :
      // elle a le droit de rester au hero. Une non acquise, non : elle
      // s'effacera d'elle-même dès qu'elle sera certifiée.
      writePrepTheme(code, btn.dataset.done === "1");
      // Nouveau thème = nouveau cycle : on repart sur la fiche (angle 0)
      savePrepCycle({
        code,
        step: 0,
        startedAt: null,
        hinted: false,
        answered: false,
      });
      // Mise à jour du hero en place (nom du thème dans la pastille)
      const nm = root.querySelector("#prep-theme-name");
      if (nm) nm.innerHTML = _rtl(esc(titre));
      const cta = root.querySelector("#action-cta-btn");
      if (cta) cta.dataset.href = prepHrefFor(code, 0);
      if (prep) {
        prep.code = code;
        prep.titre = titre;
      }
      haptic("select");
      track("prep.theme_changed", { code });
      close();
    });
  });

  document.body.appendChild(ov);
  ov.querySelector(".prep-sheet")?.focus();
}

// ─── Héros « Ta Ligue » (async) — LES COMPÉTENCES CERTIFIÉES ─────
// Ligue unique (décision Rayan 30/07/2026) : get_eleve_leaderboard, qui
// fusionne les compétences certifiées par l'élève et les anciennes
// validations moniteur. L'ancienne 2e ligue (saison hebdo de révision,
// get_theory_leaderboard_weekly) ne fait plus classement — la révision reste
// une progression personnelle. cf. pages/eleve/classement.js
async function _loadAndInjectLeagues(root) {
  const slot = root.querySelector("#acc-lb-slot");
  if (!slot) return;
  try {
    // Élève SOLO (sans moniteur) : portée nationale + profils fictifs
    // (utils/league-bots.js), sinon sa ligue « école » serait vide.
    const me = getCurUser();
    const solo = isSoloEleve(me);
    const scope = solo ? "national" : "ecole";
    const { data } = await sb.rpc("get_eleve_leaderboard", {
      p_scope: scope,
      p_limit: 50,
    });
    const raw = Array.isArray(data) ? data : [];
    const rows = solo
      ? blendLeagueRows(raw, { ligue: "conduite", userKey: me.id })
      : raw;

    // CSS du héros injecté une seule fois (carte toujours sombre — skin Arène)
    if (!document.getElementById("lgh-css")) {
      const st = document.createElement("style");
      st.id = "lgh-css";
      st.textContent = LEAGUE_HERO_CSS;
      document.head.appendChild(st);
    }
    mountLeagueHero(slot, { rows, solo });
  } catch (e) {
    console.error("[accueil] leagues", e);
  }
}

// Exportée (chantier nav simplifiée, hub « Mon permis ») : mon-permis.js
// réutilise CETTE lecture (même table, même tri) pour son étape ② « Mes
// leçons », sans filtre read_at (contrairement à la bannière ci-dessous qui
// ne montre QUE le non-lu) — le hub affiche le dernier compte-rendu, lu ou
// pas, avec juste un badge « Nouveau » si non lu.
// Retrait du moniteur (lot 4 du pivot, 30/07/2026) : `fetchLastCompteRendu()`,
// `_crApercu()` et la bannière « Ton moniteur t'a envoyé un compte-rendu »
// vivaient ici. Le moniteur n'émet plus de compte-rendu → plus rien à annoncer.

async function _loadAndInjectChests(root) {
  try {
    const chests = await getMyChests();
    const pending = chests.filter((c) => !c.opened_at);
    if (!pending.length) return;

    const slot = root.querySelector("#acc-chest-slot");
    if (!slot) return;

    const n = pending.length;
    const label = atR("chest_label", "{n} coffre{s} à ouvrir")
      .replace("{n}", n)
      .replace("{s}", n > 1 && getLang() !== "ar" ? "s" : "");

    slot.innerHTML = `
      <div class="acc2-chest-v2" id="acc-chest-teaser" role="button" tabindex="0"
           aria-label="${escAttr(label)}">
        <img src="/skins/chests/chest_welcome.webp" alt="" width="400" height="600" aria-hidden="true" loading="lazy" decoding="async">
        <div class="acc2-chest-v2-body">
          <strong class="acc2-chest-v2-title">${_rtl(esc(label))}</strong>
          <span class="acc2-chest-v2-sub">${at("chest_sub", "Réclame ta récompense du jour.")}</span>
        </div>
        <span class="acc2-chest-v2-arr" aria-hidden="true">›</span>
      </div>`;

    const el = slot.querySelector("#acc-chest-teaser");
    const open = () => {
      track("chest_teaser.tapped", { count: n });
      navigate("#/mes-coffres");
    };
    el?.addEventListener("click", open);
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  } catch {
    /* silent */
  }
}

// Retrait du moniteur (lot 4 du pivot, 30/07/2026) : le bandeau « ⚡ Quiz éclair
// de ton moniteur » vivait ici. L'envoi côté moniteur est supprimé → plus aucun
// quiz éclair ne peut arriver, et la page #/flash-quiz n'existe plus.

function _dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildActivityData(attempts, streak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = {};
  for (const a of attempts) {
    // Jour LOCAL (comme la grille days7 via _dKey) — .slice(0,10) prenait le
    // jour UTC et décalait les tentatives du soir dans la mauvaise case.
    const raw = a.completed_at || a.created_at;
    if (!raw) continue;
    const key = _dKey(new Date(raw));
    counts[key] = (counts[key] || 0) + 1;
  }
  if (!attempts.length && streak?.current_streak > 0) {
    const n = Math.min(streak.current_streak, 7);
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      counts[_dKey(d)] = 1;
    }
  }
  const activeDates = Object.keys(counts);
  const levels = {},
    details = {};
  for (const [k, v] of Object.entries(counts)) {
    levels[k] = v >= 4 ? 4 : v >= 3 ? 3 : v >= 2 ? 2 : 1;
    const dt = new Date(k + "T12:00:00");
    const _qWord =
      v > 1 ? atR("heat_quiz_many", "quiz") : atR("heat_quiz_one", "quiz");
    details[k] =
      `${dt.toLocaleDateString(atLoc(), { day: "numeric", month: "long" })}. ${v} ${_qWord}${v > 1 && getLang() === "fr" ? "s" : ""}`;
  }
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = _dKey(d);
    days7.push({ key, count: counts[key] || 0 });
  }
  return {
    activeDates,
    levels,
    details,
    days7,
    totalActive: activeDates.length,
  };
}

// ─── Skeleton ────────────────────────────────────────────────────
const SKELETON = `${STYLE}
<div class="acc2" aria-busy="true">
  <div class="skel2" style="height:200px;border-radius:0;margin-bottom:0"></div>
  <div class="skel2" style="height:170px;border-radius:20px;margin:-52px 16px 0;position:relative;z-index:2"></div>
  <div class="skel2" style="height:130px;border-radius:24px;margin:24px 16px 0"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px;margin-top:40px">
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
    <div class="skel2" style="height:90px"></div>
  </div>
</div>`;
