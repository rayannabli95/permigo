// ═══════════════════════════════════════════════════════════════
// i18n des libellés du composant premium-quiz (EN + AR). Fichier séparé pour
// que jeu-faute (autre consommateur du quiz) ne tire pas les traductions de fiches.
// PQ_UI[lang] = { praises[], coach[], next, my_score, master_t/s, good_t/s_pass/s_mid,
//   start_t/s, quest_pass, quest_miss, continue }. L'app reste FR (rendu bilingue).
// ═══════════════════════════════════════════════════════════════
export const PQ_UI = {
  "en": {
    "praises": [
      "Bullseye",
      "You've got this",
      "Spot on",
      "Perfect reflex",
      "Good eye",
      "Exactly",
      "Like clockwork",
      "Like a pro",
      "Clean"
    ],
    "coach": [
      "The right reflex",
      "Keep in mind",
      "The pro tip",
      "For next time",
      "Good to know"
    ],
    "next": "Next",
    "my_score": "My score",
    "master_t": "You've mastered it!",
    "master_s": "Great score. Keep this level up, show it to your instructor.",
    "good_t": "Well done",
    "good_s_pass": "Quiz passed — do more to lock in the move.",
    "good_s_mid": "Almost — do two or three more and it's locked in.",
    "start_t": "Getting there",
    "start_s": "Reread the card calmly, then try again. It'll sink in.",
    "quest_pass": "It counts toward your daily quest",
    "quest_miss": "Daily quest: pass {needed}/{total} — try again anytime",
    "continue": "Continue"
  },
  "ar": {
    "praises": [
      "في الصميم",
      "أنت بارع",
      "بالضبط",
      "ردّة فعل مثالية",
      "أحسنت الملاحظة",
      "صحيح",
      "على الفور",
      "مثل المحترفين",
      "بإتقان"
    ],
    "coach": [
      "ردّة الفعل الصحيحة",
      "تذكّر هذا",
      "نصيحة المحترفين",
      "للمرة القادمة",
      "من المفيد معرفته"
    ],
    "next": "التالي",
    "my_score": "نتيجتي",
    "master_t": "لقد أتقنتها!",
    "master_s": "نتيجة رائعة. حافظ على هذا المستوى، وأرِها لمدرّبك.",
    "good_t": "أحسنت",
    "good_s_pass": "نجحت في الاختبار — أعِده لترسيخ الحركة.",
    "good_s_mid": "أوشكت — أعِده مرتين أو ثلاثًا وستترسّخ.",
    "start_t": "أنت تتحسّن",
    "start_s": "أعِد قراءة البطاقة بهدوء، ثم حاول مجددًا. ستفهمها.",
    "quest_pass": "هذا يُحتسب لمهمّة اليوم",
    "quest_miss": "مهمّة اليوم: انجح في {needed}/{total} — أعِد المحاولة متى شئت",
    "continue": "تابع"
  }
};
