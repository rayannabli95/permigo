// ═══════════════════════════════════════════════════════════════
// i18n de l'univers RÉCOMPENSES (EN/AR) — données partagées entre
// boutique.js / trophees.js / galerie.js / recompenses.js.
//
// ⚠️ COHÉRENCE : les NOMS de trophées reprennent MOT POUR MOT les
// traductions déjà en prod sur le profil (PROF_ACH_I18N, PR #555).
// Même clé → même texte : ne pas resynonymiser ici sans changer là-bas.
//
// « volants » (la monnaie) = "steering wheels" / « مقود » — JAMAIS "gems".
// Contenu FR = source de vérité (data/achievements.js + items_catalog prod) ;
// en 'fr' ou clé absente les accessors renvoient le français inchangé.
// ═══════════════════════════════════════════════════════════════
import { STREAK_SEUIL, QUIZ_SEUIL } from "@/data/achievements.js";

// ─── Trophées (CATALOG d'achievements.js) : t = titre, b = description ──
const TROPHY_I18N = {
  en: {
    comp_5: {
      t: "First adjustments",
      b: "5 skills validated. The engine is starting to run!",
    },
    comp_10: {
      t: "Chassis set",
      b: "A third of the journey. The foundations are there — keep going!",
    },
    comp_15: {
      t: "Engine fitted",
      b: "Halfway there. The heart of the beast is in place.",
    },
    comp_20: {
      t: "Body mounted",
      b: "Two thirds of the journey. The car is taking shape.",
    },
    comp_25: {
      t: "Headlights on",
      b: "You're almost there. Only 6 skills left!",
    },
    comp_28: {
      t: "Mock exam ready",
      b: "28/31. The car is on the road — start the mock exam.",
    },
    comp_31: {
      t: "Open road",
      b: "31/31. Full car, open road. Ready for the real exam.",
    },
    streak_3: {
      t: "Engine started",
      b: "3 days in a row. The ignition is on!",
    },
    streak_14: {
      t: "Full tank",
      b: "14 days straight. You're rolling non-stop.",
    },
    streak_60: {
      t: "Streak driver",
      b: "30 days non-stop. Unstoppable. Respect.",
    },
    quiz_10: {
      t: "Brakes tested",
      b: "5 quizzes passed. You know exactly when to stop.",
    },
    quiz_50: {
      t: "Steering calibrated",
      b: "20 quizzes passed. Your precision at the wheel is formidable.",
    },
    quiz_perfect_5: {
      t: "Retro rim",
      b: "5 perfect quizzes. Clean, precise, not a scratch.",
    },
  },
  ar: {
    comp_5: {
      t: "الضبط الأول",
      b: "5 مهارات مُتحقّقة. المحرك بدأ يدور!",
    },
    comp_10: {
      t: "الهيكل جاهز",
      b: "ثلث المسار. الأساسات موجودة — واصل!",
    },
    comp_15: {
      t: "المحرك مثبّت",
      b: "نصف الطريق. قلب الآلة في مكانه.",
    },
    comp_20: {
      t: "البدن مركّب",
      b: "ثلثا المسار. السيارة تأخذ شكلها.",
    },
    comp_25: {
      t: "الأضواء مشتعلة",
      b: "أوشكت على الوصول. بقيت 6 مهارات فقط!",
    },
    comp_28: {
      t: "جاهز للامتحان التجريبي",
      b: "28/31. السيارة على الطريق — ابدأ الامتحان التجريبي.",
    },
    comp_31: {
      t: "الطريق مفتوح",
      b: "31/31. سيارة مكتملة وطريق مفتوح. جاهز للامتحان الرسمي.",
    },
    streak_3: {
      t: "المحرك يعمل",
      b: "3 أيام متتالية. تم إدارة المحرك!",
    },
    streak_14: {
      t: "خزان ممتلئ",
      b: "14 يومًا على التوالي. تسير دون توقف.",
    },
    streak_60: {
      t: "سائق مثابر",
      b: "30 يومًا دون انقطاع. لا شيء يوقفك. احترام.",
    },
    quiz_10: {
      t: "الفرامل مُختبرة",
      b: "5 اختبارات ناجحة. تعرف تمامًا متى تتوقف.",
    },
    quiz_50: {
      t: "المقود مُعاير",
      b: "20 اختبارًا ناجحًا. دقتك خلف المقود مذهلة.",
    },
    quiz_perfect_5: {
      t: "جنط كلاسيكي",
      b: "5 اختبارات بعلامة كاملة. نظيف ودقيق وبلا خدش.",
    },
  },
};

/** Titre traduit d'un trophée (fallback = titre FR passé en argument). */
export function trophyTitle(key, fr, lang) {
  return (lang !== "fr" && TROPHY_I18N[lang]?.[key]?.t) || fr;
}
/** Description traduite d'un trophée (fallback = FR). */
export function trophyBody(key, fr, lang) {
  return (lang !== "fr" && TROPHY_I18N[lang]?.[key]?.b) || fr;
}

// ─── Groupes du catalogue (« Compétences / Séries / Quiz ») ─────
const TROPHY_GROUP_I18N = {
  en: { Compétences: "Skills", Séries: "Streaks", Quiz: "Quizzes" },
  ar: { Compétences: "المهارات", Séries: "السلاسل", Quiz: "الاختبارات" },
};
export function trophyGroup(fr, lang) {
  return (lang !== "fr" && TROPHY_GROUP_I18N[lang]?.[fr]) || fr;
}

// ─── Objectif d'un trophée verrouillé (miroir de shortProgress) ─
// Même logique/mêmes seuils que data/achievements.js, texte traduit.
export function trophyGoal(key, stats = { compCount: 0, streak: 0 }, lang) {
  if (lang !== "en" && lang !== "ar") return null; // le FR reste à sa source
  if (key.startsWith("comp_")) {
    const seuil = parseInt(key.replace("comp_", ""), 10);
    const n = Math.min(stats.compCount, seuil - 1);
    return lang === "en" ? `${n}/${seuil} skills` : `${n}/${seuil} مهارات`;
  }
  if (key.startsWith("streak_")) {
    const seuil = STREAK_SEUIL[key] ?? parseInt(key.replace("streak_", ""), 10);
    const n = Math.min(stats.streak, seuil - 1);
    return lang === "en" ? `${n}/${seuil} days` : `${n}/${seuil} أيام`;
  }
  if (key === "quiz_perfect_5")
    return lang === "en" ? "5 perfect quizzes" : "5 اختبارات بعلامة 100%";
  if (QUIZ_SEUIL[key])
    return lang === "en"
      ? `${QUIZ_SEUIL[key]} quizzes passed`
      : `${QUIZ_SEUIL[key]} اختبارات ناجحة`;
  return "?";
}

// ─── Objets de la boutique (items_catalog prod) : n = nom, d = descr. ──
// Seuls avatar/permis_bg sont affichés en boutique (les thèmes ne sortent
// jamais dans l'UI actuelle). Fallback FR pour tout id inconnu.
const ITEM_I18N = {
  en: {
    car_citadine: {
      n: "City car",
      d: "The perfect car to start your licence journey.",
    },
    car_sportive: { n: "Sports car", d: "For those picking up speed." },
    car_suv: { n: "Prestige SUV", d: "Comfort and style, no compromise." },
    car_supercar: {
      n: "Supercar",
      d: "The ultimate skin. Reserved for road legends.",
    },
    avatar_warrior: {
      n: "The Warrior",
      d: "Tough and determined — ready to face anything on the road.",
    },
    avatar_pilot: {
      n: "The Pilot",
      d: "Cool head and precision: the DNA of a good driver.",
    },
    avatar_mage: { n: "The Mage", d: "A touch of magic to earn your licence." },
    avatar_legend: { n: "The Legend", d: "The flair of legendary drivers." },
    permis_bg_minimal_white: {
      n: "Minimalist",
      d: "Elegant white simplicity",
    },
    permis_bg_racetrack: { n: "Racetrack", d: "Aerial circuit at sunrise" },
    permis_sunset: { n: "Sunset", d: "Sunset background" },
    permis_bg_nebula: { n: "Nebula", d: "Purple cosmic spiral" },
    permis_aurora: { n: "Northern lights", d: "Aurora background" },
    permis_bg_cyberpunk: { n: "Cyberpunk", d: "Futuristic neon city" },
    permis_gold: { n: "Pure gold", d: "Golden background" },
  },
  ar: {
    car_citadine: {
      n: "سيارة المدينة",
      d: "السيارة المثالية لبداية موفّقة نحو رخصتك.",
    },
    car_sportive: { n: "سيارة رياضية", d: "لمن بدأوا يكتسبون السرعة." },
    car_suv: { n: "دفع رباعي فاخر", d: "الراحة والأناقة دون أي تنازل." },
    car_supercar: {
      n: "سيارة خارقة",
      d: "الشكل الأمثل. محجوز لأساطير الطريق.",
    },
    avatar_warrior: {
      n: "المحارب",
      d: "قويّ وعازم — مستعد لمواجهة كل شيء على الطريق.",
    },
    avatar_pilot: {
      n: "الطيّار",
      d: "رِباطة جأش ودقّة: جوهر السائق الجيد.",
    },
    avatar_mage: { n: "الساحر", d: "لمسة سحر لنيل رخصتك." },
    avatar_legend: { n: "الأسطورة", d: "أناقة السائقين الأسطوريين." },
    permis_bg_minimal_white: { n: "الأبيض البسيط", d: "بساطة بيضاء أنيقة" },
    permis_bg_racetrack: {
      n: "الحلبة",
      d: "حلبة سباق من الأعلى عند الشروق",
    },
    permis_sunset: { n: "غروب الشمس", d: "خلفية الغروب" },
    permis_bg_nebula: { n: "السديم", d: "دوّامة كونية بنفسجية" },
    permis_aurora: { n: "الشفق القطبي", d: "خلفية الشفق القطبي" },
    permis_bg_cyberpunk: { n: "سايبربانك", d: "مدينة نيون مستقبلية" },
    permis_gold: { n: "ذهب خالص", d: "خلفية ذهبية" },
  },
};

/** Nom traduit d'un objet boutique (fallback = nom FR serveur). */
export function itemName(id, fr, lang) {
  return (lang !== "fr" && ITEM_I18N[lang]?.[id]?.n) || fr;
}
/** Description traduite d'un objet boutique (fallback = FR serveur). */
export function itemDesc(id, fr, lang) {
  return (lang !== "fr" && ITEM_I18N[lang]?.[id]?.d) || fr;
}

// ─── Raretés (libellés partagés par les 4 salles) ───────────────
const RARITY_I18N = {
  en: {
    commun: "Common",
    rare: "Rare",
    epique: "Epic",
    legendaire: "Legendary",
  },
  ar: {
    commun: "شائع",
    rare: "نادر",
    epique: "ملحمي",
    legendaire: "أسطوري",
  },
};
export function rarityLabel(rarity, fr, lang) {
  return (lang !== "fr" && RARITY_I18N[lang]?.[rarity]) || fr;
}

/** Accord « volant(s) » — le wording monnaie, jamais "gems". */
export function volantWord(n, lang) {
  const one = Math.abs(Number(n)) <= 1;
  if (lang === "en") return one ? "steering wheel" : "steering wheels";
  if (lang === "ar") return "مقود";
  return one ? "volant" : "volants";
}

/** Locale d'affichage des dates selon la langue de l'élève. */
export function dateLocale(lang) {
  return lang === "en" ? "en-GB" : lang === "ar" ? "ar" : "fr-FR";
}
