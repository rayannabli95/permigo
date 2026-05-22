// ═══════════════════════════════════════════════════════════════
// Moniteur — Système de progression (vision V3 : Linear, pas Duolingo)
// Modèle : basé sur # validations cumulées.
//   - 10 paliers majeurs, titres pros, récompenses UTILES uniquement
//     (exports, stats, templates, modules…) — JAMAIS de skin/cosmétique.
//   - 12 saisons mensuelles (badge + wrap-up).
// 380 validations = palier max (Cercle Or = statut Expert REMC certifié).
//
// ⚠️ Antipatterns vision V3 n°2 & n°8 : aucune monnaie virtuelle, aucun
//    skin, aucune récompense décorative. Monter de palier = débloquer un outil.
// ═══════════════════════════════════════════════════════════════

/**
 * 10 paliers majeurs — progression non-linéaire (HOOK rapide, MASTERY lente).
 *
 * Phase 1 — HOOK (jours 1-3) : 1er outil dès 10 validations
 * Phase 2 — ENGAGEMENT (semaines 1-4) : +30 entre chaque palier
 * Phase 3 — MASTERY (mois 2+) : +50 entre chaque palier
 *
 * Cercle Or atteignable en ~1.5 mois actif (380 validations à 10/jour).
 */
export const MONITEUR_TIERS = [
  // ─ Phase 1 HOOK ─
  { tier: 1,  threshold: 10,  title: 'Moniteur en route',  unlock: { iconName: 'file-text',    name: 'Export PDF Livret',        desc: 'Export PDF personnalisé du livret élève' } },
  // ─ Phase 2 ENGAGEMENT (+30) ─
  { tier: 2,  threshold: 40,  title: 'Moniteur confirmé',  unlock: { iconName: 'chart-bar',    name: 'Stats avancées élèves',    desc: 'Tableaux de bord détaillés par élève' } },
  { tier: 3,  threshold: 70,  title: 'Moniteur confirmé',  unlock: { iconName: 'clipboard',    name: 'Templates bilan pédago',   desc: 'Modèles de bilans mensuels prêts' } },
  { tier: 4,  threshold: 100, title: 'Enseignant chevronné', unlock: { iconName: 'target',     name: 'Prépa examen enrichie',   desc: 'Mode préparation examen avec checkpoints' } },
  { tier: 5,  threshold: 130, title: 'Enseignant chevronné', unlock: { iconName: 'trending-up', name: 'Analytics comparatives',  desc: 'Comparaison anonyme vs cohorte nationale' } },
  // ─ Phase 3 MASTERY (+50) ─
  { tier: 6,  threshold: 180, title: 'Référent pédagogique', unlock: { iconName: 'award',      name: 'Profil mis en avant',     desc: 'Ton profil remonte aux nouveaux élèves' } },
  { tier: 7,  threshold: 230, title: 'Référent pédagogique', unlock: { iconName: 'book',       name: 'Modules formation',       desc: 'Accès aux modules de formation continue' } },
  { tier: 8,  threshold: 280, title: 'Maître enseignant',    unlock: { iconName: 'users',      name: 'Programme mentorat',      desc: 'Accompagne d\'autres moniteurs débutants' } },
  { tier: 9,  threshold: 330, title: 'Maître enseignant',    unlock: { iconName: 'shield',     name: 'Expert Hub',              desc: 'Communauté privée des experts REMC' } },
  { tier: 10, threshold: 380, title: 'Expert REMC',          unlock: { iconName: 'sparkle',    name: 'Cercle Or',               desc: 'Statut Expert REMC certifié PermiGo' } },
];

const MAX_VAL = MONITEUR_TIERS[MONITEUR_TIERS.length - 1].threshold;

/**
 * 12 saisons = 12 mois.
 */
export const SAISONS = [
  { month: 0,  name: 'Janvier — Nouveau départ',   accent: '#0ea5e9', badge: 'Saisonnier hiver' },
  { month: 1,  name: 'Février — Cap maintenu',     accent: '#6366f1', badge: 'Saisonnier hiver' },
  { month: 2,  name: 'Mars — Premier souffle',     accent: '#10b981', badge: 'Saisonnier printemps' },
  { month: 3,  name: 'Avril — Élan',                accent: '#84cc16', badge: 'Saisonnier printemps' },
  { month: 4,  name: 'Mai — Pleine accélération',   accent: '#f59e0b', badge: 'Saisonnier printemps' },
  { month: 5,  name: 'Juin — Examen blanc',         accent: '#f97316', badge: 'Saisonnier été' },
  { month: 6,  name: 'Juillet — Permanence',        accent: '#eab308', badge: 'Saisonnier été' },
  { month: 7,  name: 'Août — Repli stratégique',    accent: '#a855f7', badge: 'Saisonnier été' },
  { month: 8,  name: 'Septembre — Rentrée',         accent: '#3b82f6', badge: 'Saisonnier automne' },
  { month: 9,  name: 'Octobre — Cadence',           accent: '#d946ef', badge: 'Saisonnier automne' },
  { month: 10, name: 'Novembre — Concentration',    accent: '#0891b2', badge: 'Saisonnier automne' },
  { month: 11, name: 'Décembre — Wrapped',          accent: '#ec4899', badge: 'Saisonnier hiver' },
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
    if (safe >= t.threshold) tier = t; else break;
  }
  const tierIdx = tier ? MONITEUR_TIERS.findIndex(t => t.tier === tier.tier) : -1;
  const nextTier = tierIdx + 1 < MONITEUR_TIERS.length ? MONITEUR_TIERS[tierIdx + 1] : null;

  // Prochaine récompense = prochain palier (toujours un outil utile)
  let nextReward = null;
  if (nextTier) {
    nextReward = {
      kind: 'tier',
      threshold: nextTier.threshold,
      label: nextTier.unlock.name,
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
    pctToNextReward = span > 0 ? Math.max(0, Math.min(100, Math.round((done / span) * 100))) : 100;
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
  return MONITEUR_TIERS
    .map(t => ({ threshold: t.threshold, kind: 'tier', tier: t }))
    .sort((a, b) => a.threshold - b.threshold);
}
