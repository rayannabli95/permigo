// ═══════════════════════════════════════════════════════════════
// Achievements élève — source de vérité UNIQUE (front).
// Miroir de la fonction SQL _achievement_meta + des triggers
// check_validation_achievements / check_streak_achievements /
// check_quiz_achievements. Déblocage = table achievements_unlocked
// (RPC get_my_achievements).
//
// ⚠️ Les clés sont historiques et ne reflètent PAS le seuil réel :
//   quiz_10  → débloqué à 5 quiz réussis (≥70%)
//   quiz_50  → débloqué à 20 quiz réussis
//   streak_60 → débloqué à 30 jours d'affilée
// Voir SEUILS ci-dessous (alignés sur les triggers serveur).
//
// Consommé par : pages/eleve/trophees.js + pages/eleve/galerie.js
// ═══════════════════════════════════════════════════════════════

export const CATALOG = [
  // Compétences
  {
    key: "comp_5",
    emoji: "🔧",
    image: "/skins/badge-3d-08.webp",
    title: "Premiers réglages",
    body: "5 compétences validées. Le moteur commence à tourner !",
    rarity: "commun",
    xp: 50,
    gemmes: 15,
    group: "Compétences",
  },
  {
    key: "comp_10",
    emoji: "🏗️",
    image: "/skins/badge-3d-02.webp",
    title: "Châssis posé",
    body: "Un tiers du parcours. Les fondations sont là, continue !",
    rarity: "rare",
    xp: 120,
    gemmes: 30,
    group: "Compétences",
  },
  {
    key: "comp_15",
    emoji: "⚙️",
    image: "/skins/badge-3d-04.webp",
    title: "Moteur en place",
    body: "La moitié du chemin. Le cœur de la bête est installé.",
    rarity: "rare",
    xp: 200,
    gemmes: 50,
    group: "Compétences",
  },
  {
    key: "comp_20",
    emoji: "🚗",
    image: "/skins/badge-3d-03.webp",
    title: "Carrosserie montée",
    body: "Deux tiers du parcours. La voiture prend forme.",
    rarity: "epique",
    xp: 300,
    gemmes: 75,
    group: "Compétences",
  },
  {
    key: "comp_25",
    emoji: "💡",
    image: "/skins/badge-3d-07.webp",
    title: "Phares allumés",
    body: "Tu y es presque. Plus que 6 compétences !",
    rarity: "epique",
    xp: 450,
    gemmes: 110,
    group: "Compétences",
  },
  {
    key: "comp_28",
    emoji: "🎓",
    image: "/skins/badge-3d-05.webp",
    title: "Prêt examen blanc",
    body: "28/31. La voiture est sur la route. Lance l'examen blanc.",
    rarity: "legendaire",
    xp: 600,
    gemmes: 150,
    group: "Compétences",
  },
  {
    key: "comp_31",
    emoji: "🏁",
    image: "/skins/badge-3d-ultimate.webp",
    title: "Route ouverte",
    body: "31/31. Voiture complète, route libre. Prêt pour l'officiel.",
    rarity: "legendaire",
    xp: 1000,
    gemmes: 300,
    group: "Compétences",
  },
  // Séries
  {
    key: "streak_3",
    emoji: "🔑",
    image: "/skins/badge-3d-01.webp",
    title: "Moteur lancé",
    body: "3 jours de suite. Le contact est mis !",
    rarity: "commun",
    xp: 30,
    gemmes: 10,
    group: "Séries",
  },
  {
    key: "streak_14",
    emoji: "⛽",
    image: "/skins/badge-3d-06.webp",
    title: "Plein d'essence",
    body: "14 jours d'affilée. Tu roules sans t'arrêter.",
    rarity: "rare",
    xp: 180,
    gemmes: 50,
    group: "Séries",
  },
  {
    key: "streak_60",
    emoji: "🏎️",
    image: "/skins/badge-3d-09.webp",
    title: "Pilote en série",
    body: "30 jours non-stop. Inarrêtable. Respect.",
    rarity: "legendaire",
    xp: 800,
    gemmes: 200,
    group: "Séries",
  },
  // Quiz
  {
    key: "quiz_10",
    emoji: "🛑",
    image: "/skins/badge-3d-08.webp",
    title: "Freins testés",
    body: "5 quiz réussis. Tu sais exactement quand t'arrêter.",
    rarity: "commun",
    xp: 50,
    gemmes: 15,
    group: "Quiz",
  },
  {
    key: "quiz_50",
    emoji: "🔩",
    image: "/skins/badge-3d-02.webp",
    title: "Direction calibrée",
    body: "20 quiz réussis. Ta précision au volant est redoutable.",
    rarity: "epique",
    xp: 250,
    gemmes: 80,
    group: "Quiz",
  },
  {
    key: "quiz_perfect_5",
    emoji: "🪝",
    image: "/skins/badge-3d-03.webp",
    title: "Jante rétro",
    body: "5 quiz parfaits. Propre, précis, aucune rayure.",
    rarity: "epique",
    xp: 200,
    gemmes: 60,
    group: "Quiz",
  },
];

// Médailles de trophées (dégradés). Volontairement DISTINCT de la RARITY_META
// de boutique.js (tags néon + tri) — séparation visuelle assumée, pas un doublon
// à fusionner.
export const RARITY_META = {
  commun: {
    label: "Commun",
    gradient: "linear-gradient(145deg,var(--mu4),var(--mu3))",
  },
  rare: {
    label: "Rare",
    gradient: "linear-gradient(145deg,var(--blk2),#60a5fa)",
  },
  epique: {
    label: "Épique",
    gradient: "linear-gradient(145deg,#6d28d9,#a78bfa)",
  },
  legendaire: {
    label: "Légendaire",
    gradient: "linear-gradient(145deg,var(--amx),var(--aml2))",
  },
};

// Couleur d'accent pleine (cartes galerie, puces rareté)
export const RARITY_COLOR = {
  commun: "var(--mu2)",
  rare: "var(--bl2)",
  epique: "var(--pu)",
  legendaire: "var(--am)",
};

// Seuils RÉELS débloqués côté serveur (triggers check_*_achievements).
export const STREAK_SEUIL = { streak_3: 3, streak_14: 14, streak_60: 30 };
export const QUIZ_SEUIL = { quiz_10: 5, quiz_50: 20 };

// Texte de progression "objectif" pour une carte verrouillée.
export function shortProgress(key, stats = { compCount: 0, streak: 0 }) {
  if (key.startsWith("comp_")) {
    const seuil = parseInt(key.replace("comp_", ""), 10);
    return `${Math.min(stats.compCount, seuil - 1)}/${seuil} compétences`;
  }
  if (key.startsWith("streak_")) {
    const seuil = STREAK_SEUIL[key] ?? parseInt(key.replace("streak_", ""), 10);
    return `${Math.min(stats.streak, seuil - 1)}/${seuil} jours`;
  }
  if (key === "quiz_perfect_5") return "5 quiz 100%";
  if (QUIZ_SEUIL[key]) return `${QUIZ_SEUIL[key]} quiz réussis`;
  return "?";
}
