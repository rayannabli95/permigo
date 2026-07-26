// ═══════════════════════════════════════════════════════════════
// i18n des 4 chapitres REMC (titres + descriptions) — EN/AR.
//
// Affiché en petit italique SOUS le nom français (le FR reste la référence :
// l'élève apprend le vocabulaire qu'il entendra en leçon). Les NOMS d'étapes
// (sous-compétences) sont traduits à leur source : data/fiches-i18n.js.
//
// ⚠️ On garde le FR « Maîtriser le véhicule » (nom officiel REMC C1) ; la
// traduction évite « mastery/إتقان » (voisin du terme banni « maîtrisé »).
// Traductions vérifiées (relecture bilingue adversariale).
// ═══════════════════════════════════════════════════════════════
const WORLD_I18N = {
  1: {
    en: {
      titre: "Handling the vehicle",
      desc: "The basics: starting off, braking, steering.",
    },
    ar: {
      titre: "التحكم في المركبة",
      desc: "الأساسيات: الانطلاق، الفرملة، والتوجيه.",
    },
  },
  2: {
    en: {
      titre: "Driving in normal conditions",
      desc: "Intersections, roundabouts, sharing the road.",
    },
    ar: {
      titre: "القيادة في الظروف العادية",
      desc: "التقاطعات، الدوّارات، ومشاركة الطريق.",
    },
  },
  3: {
    en: {
      titre: "Challenging conditions",
      desc: "Motorway, night, bad weather, overtaking.",
    },
    ar: {
      titre: "الظروف الصعبة",
      desc: "الطريق السريع، الليل، سوء الأحوال الجوية، التجاوز.",
    },
  },
  4: {
    en: {
      titre: "Independent & safe driving",
      desc: "Long-distance trips, eco-driving, safety.",
    },
    ar: {
      titre: "القيادة المستقلة والآمنة",
      desc: "الرحلات لمسافات طويلة، القيادة الاقتصادية، والسلامة.",
    },
  },
};

// Renvoie {titre, desc} traduits pour un id de monde (1–4), ou null en fr /
// id inconnu (le FR d'origine fait alors foi).
export function worldTr(id, lang) {
  if (lang === "fr" || id == null) return null;
  return WORLD_I18N[id]?.[lang] || null;
}
