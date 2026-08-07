// ═══════════════════════════════════════════════════════════════
// i18n de l'univers RÉCOMPENSES (EN/AR) — données partagées entre
// boutique.js / recompenses.js / mes-coffres.js / profil.js.
//
// Les textes de trophées ont été retirés le 07/08/2026 avec les trophées
// eux-mêmes (décision Rayan « salle des trophées inutile »).
//
// « volants » (la monnaie) = "steering wheels" / « مقود » — JAMAIS "gems".
// Contenu FR = source de vérité (items_catalog prod) ; en 'fr' ou clé
// absente les accessors renvoient le français inchangé.
// ═══════════════════════════════════════════════════════════════

// ─── Objets de la boutique (items_catalog prod) : n = nom, d = descr. ──
// Seuls avatar/permis_bg sont affichés en boutique (les thèmes ne sortent
// jamais dans l'UI actuelle). Fallback FR pour tout id inconnu.
const ITEM_I18N = {
  en: {
    car_citadine: {
      n: "City car",
      d: "Your first car. Nothing fancy but it gets you going.",
    },
    car_sportive: {
      n: "Sports car",
      d: "Chrome rims and a spoiler. It is picking up speed.",
    },
    car_suv: {
      n: "The Furious",
      d: "Wide body and a light strip on the floor. It stopped smiling.",
    },
    car_supercar: {
      n: "The Golden One",
      d: "Solid gold. Flames out the back. The last step.",
    },
    avatar_warrior: {
      n: "The Warrior",
      d: "Tough and determined. Ready to face anything on the road.",
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
      d: "سيارتك الأولى. بسيطة لكنها تنطلق بك.",
    },
    car_sportive: {
      n: "سيارة رياضية",
      d: "جنوط كروم وجناح خلفي. بدأت تكتسب السرعة.",
    },
    car_suv: {
      n: "الغاضبة",
      d: "هيكل عريض وشريط مضيء على الأرض. لم تعد تبتسم.",
    },
    car_supercar: {
      n: "الذهبية",
      d: "ذهب خالص. ألسنة لهب من العادم. الدرجة الأخيرة.",
    },
    avatar_warrior: {
      n: "المحارب",
      d: "قويّ وعازم. مستعد لمواجهة كل شيء على الطريق.",
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
