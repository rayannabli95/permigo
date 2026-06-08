// ═══════════════════════════════════════════════════════════════
// Moniteur — Système de progression (vision V3 : Linear, pas Duolingo)
// Modèle : basé sur # validations cumulées.
//   - 10 paliers majeurs, titres pros, récompenses UTILES uniquement
//     (exports, stats, templates, modules…) — JAMAIS de skin/cosmétique.
//   - 12 saisons mensuelles (badge + wrap-up).
// 300 validations = palier max (Expert REMC certifié).
//
// ⚠️ Antipatterns vision V3 n°2 & n°8 : aucune monnaie virtuelle, aucun
//    skin, aucune récompense décorative. Monter de palier = débloquer un outil.
//
// Terminologie : « Enseignant » partout (jamais « Moniteur en route »).
// Échelle : Démarrage → confirmé → chevronné → Référent pédagogique →
//           Expert REMC (certifié au dernier palier).
// ═══════════════════════════════════════════════════════════════

/**
 * 10 paliers majeurs — progression non-linéaire (HOOK rapide, MASTERY lente).
 *
 * Phase 1 — TUTO/HOOK (jours 1-2) : 1ers paliers à 3 / 8 / 15 validations.
 * Phase 2 — ENGAGEMENT : montée régulière (30 → 50 → 80).
 * Phase 3 — MASTERY (mois 2+) : 120 → 170 → 230 → 300.
 *
 * Le champ unlock.desc est volontairement concret (2-3 infos) : il alimente
 * le panneau de détail affiché au clic sur un palier (parcours-pro*).
 */
export const MONITEUR_TIERS = [
  // ─ Phase 1 TUTO/HOOK (early game rapide pour le hook) ─
  {
    tier: 1,
    threshold: 3,
    title: "Enseignant — Démarrage",
    unlock: {
      iconName: "file-text",
      name: "Export PDF du livret élève",
      desc: "Génère un PDF propre du livret REMC d'un élève (compétences acquises, dates, commentaires). Pratique pour un point parent ou un dossier examen.",
    },
  },
  {
    tier: 2,
    threshold: 8,
    title: "Enseignant confirmé",
    unlock: {
      iconName: "chart-bar",
      name: "Tableaux de bord détaillés par élève",
      desc: "Une vue par élève : progression compétence par compétence, rythme d'acquisition et points à retravailler, pour préparer la prochaine séance.",
    },
  },
  {
    tier: 3,
    threshold: 15,
    title: "Enseignant confirmé",
    unlock: {
      iconName: "clipboard",
      name: "Modèles de bilans mensuels",
      desc: "Des trames prêtes à remplir pour le bilan mensuel d'un élève. Tu gagnes du temps et tu gardes une trace structurée de son évolution.",
    },
  },
  // ─ Phase 2 ENGAGEMENT (montée régulière) ─
  {
    tier: 4,
    threshold: 30,
    title: "Enseignant chevronné",
    unlock: {
      iconName: "target",
      name: "Mode préparation à l'examen",
      desc: "Un mode dédié à l'approche de l'examen : check-list des points sensibles et suivi des dernières compétences à sécuriser avant le jour J.",
    },
  },
  {
    tier: 5,
    threshold: 50,
    title: "Enseignant chevronné",
    unlock: {
      iconName: "users",
      name: "Vue d'ensemble de tous tes élèves",
      desc: "Un tableau agrégé de toute ta classe : qui avance, qui stagne, qui est à relancer. Tu repères d'un coup d'œil où porter ton attention.",
    },
  },
  // ─ Phase 3 MASTERY ─
  {
    tier: 6,
    threshold: 80,
    title: "Référent pédagogique",
    unlock: {
      iconName: "file-text",
      name: "Export groupé des livrets",
      desc: "Génère les PDF des livrets de plusieurs élèves en une seule fois. Idéal pour un bilan de fin de mois ou un dépôt de dossiers examen groupé.",
    },
  },
  {
    tier: 7,
    threshold: 120,
    title: "Référent pédagogique",
    unlock: {
      iconName: "book",
      name: "Formation continue",
      desc: "Accès aux modules de formation continue PermiGo : mises à jour REMC, pédagogie et nouveautés réglementaires.",
    },
  },
  {
    tier: 8,
    threshold: 170,
    title: "Référent pédagogique",
    unlock: {
      iconName: "users",
      name: "Mentorat de nouveaux moniteurs",
      desc: "Tu peux accompagner les enseignants débutants de ton réseau : partage de méthodes et suivi de leurs premiers mois.",
    },
  },
  {
    tier: 9,
    threshold: 230,
    title: "Expert REMC",
    unlock: {
      iconName: "shield",
      name: "Communauté privée experts REMC",
      desc: "Rejoins l'espace privé des enseignants experts : échanges de cas concrets, ressources avancées et entraide entre pairs.",
    },
  },
  {
    tier: 10,
    threshold: 300,
    title: "Expert REMC certifié",
    unlock: {
      iconName: "trending-up",
      name: "Comparaison avec d'autres écoles (anonyme)",
      desc: "Le palier le plus élevé. Situe tes indicateurs (rythme, validations) par rapport à d'autres auto-écoles, de façon totalement anonyme. Aucune donnée nominative.",
    },
  },
];

const MAX_VAL = MONITEUR_TIERS[MONITEUR_TIERS.length - 1].threshold;

/**
 * 12 saisons = 12 mois.
 */
export const SAISONS = [
  {
    month: 0,
    name: "Janvier — Nouveau départ",
    accent: "var(--bl)",
    badge: "Saisonnier hiver",
  },
  {
    month: 1,
    name: "Février — Cap maintenu",
    accent: "var(--a)",
    badge: "Saisonnier hiver",
  },
  {
    month: 2,
    name: "Mars — Premier souffle",
    accent: "var(--gr)",
    badge: "Saisonnier printemps",
  },
  {
    month: 3,
    name: "Avril — Élan",
    accent: "#84cc16",
    badge: "Saisonnier printemps",
  },
  {
    month: 4,
    name: "Mai — Pleine accélération",
    accent: "var(--am)",
    badge: "Saisonnier printemps",
  },
  {
    month: 5,
    name: "Juin — Examen blanc",
    accent: "var(--or)",
    badge: "Saisonnier été",
  },
  {
    month: 6,
    name: "Juillet — Permanence",
    accent: "#eab308",
    badge: "Saisonnier été",
  },
  {
    month: 7,
    name: "Août — Repli stratégique",
    accent: "var(--pul)",
    badge: "Saisonnier été",
  },
  {
    month: 8,
    name: "Septembre — Rentrée",
    accent: "var(--bl2)",
    badge: "Saisonnier automne",
  },
  {
    month: 9,
    name: "Octobre — Cadence",
    accent: "#d946ef",
    badge: "Saisonnier automne",
  },
  {
    month: 10,
    name: "Novembre — Concentration",
    accent: "var(--blk)",
    badge: "Saisonnier automne",
  },
  {
    month: 11,
    name: "Décembre — Wrapped",
    accent: "#ec4899",
    badge: "Saisonnier hiver",
  },
];

/**
 * Calcule l'état complet du moniteur depuis le count de validations.
 * @param {number} validations  - nombre de validations cumulées
 * @returns {{
 *   tier: {tier, threshold, title, unlock} | null,
 *   nextTier: {tier, threshold, title, unlock} | null,
 *   nextReward: {kind: 'tier', threshold, label, data, missing} | null,
 *   pctToNextReward: number,
 *   isMax: boolean,
 *   saison: {month, name, accent, badge},
 *   validations: number,
 *   maxVal: number
 * }}
 */
export function getMoniteurState(validations = 0) {
  const v = Math.max(0, Math.floor(validations));
  const safe = Math.min(MAX_VAL, v);

  // Tier actuel (le dernier atteint)
  let tier = null;
  for (const t of MONITEUR_TIERS) {
    if (safe >= t.threshold) tier = t;
    else break;
  }
  const tierIdx = tier
    ? MONITEUR_TIERS.findIndex((t) => t.tier === tier.tier)
    : -1;
  const nextTier =
    tierIdx + 1 < MONITEUR_TIERS.length ? MONITEUR_TIERS[tierIdx + 1] : null;

  // Prochain palier de statut (libellé = seuil de validations, pas d'« outil »)
  let nextReward = null;
  if (nextTier) {
    nextReward = {
      kind: "tier",
      threshold: nextTier.threshold,
      label: `${nextTier.threshold} validations`,
      data: nextTier,
      missing: nextTier.threshold - safe,
    };
  }

  // Progression vers prochaine récompense (en %)
  let pctToNextReward = 100;
  if (nextReward) {
    const prevThr = tier ? tier.threshold : 0;
    const span = nextReward.threshold - prevThr;
    const done = safe - prevThr;
    pctToNextReward =
      span > 0
        ? Math.max(0, Math.min(100, Math.round((done / span) * 100)))
        : 100;
  }

  // Saison actuelle (basée sur mois courant)
  const saison = SAISONS[new Date().getMonth()];

  return {
    tier,
    nextTier,
    nextReward,
    pctToNextReward,
    isMax: safe >= MAX_VAL,
    saison,
    validations: safe,
    maxVal: MAX_VAL,
  };
}

/**
 * Liste plate des paliers pour afficher la timeline.
 * Tiers uniquement — plus aucun skin cosmétique (vision V3).
 */
export function buildTimelineStops() {
  return MONITEUR_TIERS.map((t) => ({
    threshold: t.threshold,
    kind: "tier",
    tier: t,
  })).sort((a, b) => a.threshold - b.threshold);
}
