// ═══════════════════════════════════════════════════════════════
// Détails pédagogiques REMC — enrichissement des 31 sous-comp
// Chaque entrée : { summary, keyPoints[3], tip }
//
// summary  : 1 phrase qui résume l'essentiel (le "pitch" de la comp)
// keyPoints : 3 points concrets à maîtriser pour valider
// tip      : conseil du coach (astuce mémo ou erreur courante)
// ═══════════════════════════════════════════════════════════════

export const REMC_DETAILS = {
  // ─── MONDE 1 — Maîtrise du véhicule ──────────────────────────
  C1a: {
    summary: 'Identifier les commandes principales et vérifier que ta voiture est prête à rouler.',
    keyPoints: [
      'Reconnaître commandes au tableau de bord',
      'Vérifier feux, pneus, niveaux',
      'Connaître les voyants d\'alerte',
    ],
    tip: 'Avant chaque démarrage : tour rapide de la voiture, puis ceinture, miroirs, contact.',
  },
  C1b: {
    summary: 'Régler ton poste de conduite pour être stable, à l\'aise et bien voir la route.',
    keyPoints: [
      'Siège : pieds atteignent pédales sans tendre',
      'Volant : poignets posés en haut, bras pliés',
      'Miroirs réglés avant de démarrer',
    ],
    tip: 'Mauvais réglage = fatigue rapide + angles morts. 30 sec investis = leçon plus confortable.',
  },
  C1c: {
    summary: 'Tenir le volant correctement et garder ta voiture dans la bonne trajectoire.',
    keyPoints: [
      'Position 9h15 (ou 10h10), pouces sur la jante',
      'Regard loin pour anticiper la trajectoire',
      'Croiser les mains uniquement en manœuvre lente',
    ],
    tip: 'Ton regard guide ta trajectoire. Fixe loin devant, pas le capot.',
  },
  C1d: {
    summary: 'Démarrer en douceur et s\'arrêter sans à-coups avec un freinage progressif.',
    keyPoints: [
      'Embrayage relâché lentement au point de patinage',
      'Frein gauche-pied progressif jusqu\'à l\'arrêt',
      'Arrêt complet : frein à main + point mort',
    ],
    tip: 'Anticipe les arrêts à 50m : relâcher l\'accélérateur d\'abord, freiner ensuite.',
  },
  C1e: {
    summary: 'Doser accélération et freinage pour une conduite fluide et économique.',
    keyPoints: [
      'Accélération progressive sans saccade',
      'Anticipation pour éviter les freinages brusques',
      'Pied droit léger, jamais lourd',
    ],
    tip: 'Conduite douce = passagers contents + carburant économisé + meilleure note.',
  },
  C1f: {
    summary: 'Changer de vitesse au bon moment, sans regarder le levier ni caler.',
    keyPoints: [
      'Monter les rapports vers 2000-2500 tr/min',
      'Rétrograder avant les virages et freinages',
      'Embrayage rapide mais doux',
    ],
    tip: 'Écoute le moteur : s\'il "force", monte un rapport. S\'il "tousse", rétrograde.',
  },
  C1g: {
    summary: 'Faire les vérifications de sécurité extérieures (tour de voiture, pneus, feux).',
    keyPoints: [
      'Pneus : pression et usure',
      'Feux : phares, clignotants, stop',
      'Vitres, miroirs, plaques propres',
    ],
    tip: 'Question type examen : "Que vérifiez-vous avant de prendre la route ?"',
  },
  C1h: {
    summary: 'Réaliser les manœuvres-test du permis : créneau, demi-tour, épi, stationnement.',
    keyPoints: [
      'Créneau : repères visuels au rétroviseur droit',
      'Demi-tour : 3 temps si rue étroite',
      'Stationnement en bataille : roues droites en sortie',
    ],
    tip: 'Vitesse lente + braquage rapide. C\'est l\'inverse qui foire la manœuvre.',
  },
  C1i: {
    summary: 'Réaliser toutes les manœuvres seul, sans aide ni guidage du moniteur.',
    keyPoints: [
      'Choisir la bonne manœuvre selon la situation',
      'Gérer toi-même les repères et le timing',
      'Corriger sans paniquer si raté',
    ],
    tip: 'Cette validation = tu es prêt pour le monde 2. Pas de stress, juste de la pratique.',
  },

  // ─── MONDE 2 — Circulation normale ───────────────────────────
  C2a: {
    summary: 'Capter et interpréter les infos visuelles importantes (panneaux, autres usagers, sol).',
    keyPoints: [
      'Regard loin (15-20 sec devant)',
      'Balayage : rétro, devant, côtés, devant',
      'Identifier les panneaux à distance',
    ],
    tip: 'Tes yeux travaillent en continu : 1 contrôle rétro toutes les 5-7 secondes.',
  },
  C2b: {
    summary: 'Adapter ta vitesse et ta trajectoire à l\'environnement (météo, trafic, route).',
    keyPoints: [
      'Réduire en zone scolaire, marché, virage',
      'Augmenter distances par pluie / nuit',
      'Anticiper les comportements imprévus',
    ],
    tip: 'La règle des 2 sec : compte 2 secondes entre toi et la voiture devant (4 sec sous la pluie).',
  },
  C2c: {
    summary: 'Te placer correctement sur la chaussée selon le sens et le type de route.',
    keyPoints: [
      'Au milieu de ta voie, ni à droite ni au centre',
      'Trajectoire stable dans les courbes',
      'Bonne distance latérale avec véhicules garés',
    ],
    tip: 'Vise un point loin devant pour garder une ligne droite parfaite.',
  },
  C2d: {
    summary: 'Aborder un virage à la bonne vitesse et tracer la bonne trajectoire.',
    keyPoints: [
      'Ralentir AVANT le virage, pas pendant',
      'Trajectoire extérieur → intérieur → extérieur',
      'Accélérer à la sortie, pas avant',
    ],
    tip: 'Si tu freines dans le virage, c\'est que tu es entré trop vite. Anticipe.',
  },
  C2e: {
    summary: 'Croiser un véhicule en sécurité et dépasser quand c\'est légal et sûr.',
    keyPoints: [
      'Croisements étroits : ralentir, serrer à droite',
      'Dépassement : visibilité + indicateur + écart',
      'Jamais en ligne continue ni avant un virage',
    ],
    tip: 'Si tu hésites à dépasser, ne dépasse pas. Le doute est ton meilleur ami.',
  },
  C2f: {
    summary: 'Aborder une intersection ou un rond-point en respectant les priorités.',
    keyPoints: [
      'Identifier qui a la priorité avant d\'entrer',
      'Rond-point : céder à gauche, clignotant à droite en sortie',
      'Ne jamais s\'arrêter au milieu d\'un carrefour',
    ],
    tip: 'Priorité à droite par défaut sauf indication contraire (panneau, feu, marquage).',
  },
  C2g: {
    summary: 'Communiquer clairement avec les autres usagers : clignotants, regards, signes.',
    keyPoints: [
      'Clignotant 3 sec avant chaque changement',
      'Contact visuel aux carrefours et passages piétons',
      'Klaxon uniquement pour prévenir d\'un danger',
    ],
    tip: 'Un bon conducteur prévient ses intentions. La route est un dialogue.',
  },
  C2h: {
    summary: 'Conduire seul en ville en gérant trajectoire, vitesse et décisions sans aide.',
    keyPoints: [
      'Itinéraire mémorisé avant de partir',
      'Adapter en temps réel à l\'imprévu',
      'Garder calme et confiance même en stress',
    ],
    tip: 'Tu maîtrises le monde 2 quand tu fais 30 min sans intervention du moniteur.',
  },

  // ─── MONDE 3 — Conditions difficiles ──────────────────────────
  C3a: {
    summary: 'Conduire de nuit en gérant la visibilité réduite et la fatigue.',
    keyPoints: [
      'Phares adaptés (croisement / route)',
      'Distances augmentées',
      'Pause toutes les 2h en conduite longue',
    ],
    tip: 'Croisement d\'un véhicule : regarde la bande blanche à droite, pas les phares.',
  },
  C3b: {
    summary: 'Adapter ta conduite par pluie, neige, brouillard ou verglas.',
    keyPoints: [
      'Distance de sécurité × 2 (pluie) ou × 3 (neige)',
      'Freinage doux et progressif',
      'Feux de brouillard si visibilité < 50m',
    ],
    tip: 'Sur sol mouillé, le freinage prend 2× plus de distance. Anticipe.',
  },
  C3c: {
    summary: 'Rouler sur autoroute en sécurité : insertion, voies, vitesses, sortie.',
    keyPoints: [
      'Insertion : utiliser toute la bande d\'accélération',
      'Voie de droite par défaut',
      'Sortie : clignotant 200m avant',
    ],
    tip: 'Sur autoroute, le danger n\'est pas la vitesse mais l\'inattention. Reste vigilant.',
  },
  C3d: {
    summary: 'Dépasser un véhicule sur route ou autoroute en respectant la sécurité.',
    keyPoints: [
      'Vérifier 3 conditions : autorisé, possible, utile',
      'Clignotant gauche + contrôle angle mort',
      'Ne jamais ralentir un véhicule dépassé',
    ],
    tip: 'Si tu dépasses, fais-le franchement. L\'hésitation crée le danger.',
  },
  C3e: {
    summary: 'Réagir vite et bien face à un événement imprévu (animal, ouverture de portière, freinage).',
    keyPoints: [
      'Freinage d\'urgence : pied à fond + ABS',
      'Évitement : un seul mouvement de volant',
      'Garder le contrôle, pas paniquer',
    ],
    tip: 'En cas d\'urgence : freiner FORT, regarder OÙ tu veux aller (pas l\'obstacle).',
  },
  C3f: {
    summary: 'Gérer le stress, la fatigue et les distractions au volant.',
    keyPoints: [
      'Téléphone éteint ou en mode "Au volant"',
      'Pause toutes les 2h si trajet long',
      'Pas d\'alcool, pas de médicaments somnolents',
    ],
    tip: 'Si tu bâilles 2 fois : pause immédiate. La micro-sieste de 15 min sauve.',
  },
  C3g: {
    summary: 'Réagir en cas d\'accident : sécuriser, alerter, secourir.',
    keyPoints: [
      'Protéger : warnings, triangle, gilet',
      'Alerter : 18 (pompiers), 15 (SAMU), 112',
      'Secourir : sans déplacer les blessés',
    ],
    tip: 'PAS = Protéger, Alerter, Secourir. Dans cet ordre, toujours.',
  },

  // ─── MONDE 4 — Conduite autonome & sûre ───────────────────────
  C4a: {
    summary: 'Préparer son itinéraire avant de partir : trajet, alternatives, conditions.',
    keyPoints: [
      'Choisir l\'itinéraire et une alternative',
      'Vérifier météo, trafic et travaux',
      'Prévoir des pauses sur les longs trajets',
    ],
    tip: 'Avant un trajet inconnu, repère les sorties et les zones difficiles à l\'avance.',
  },
  C4b: {
    summary: 'Suivre un itinéraire (GPS ou panneaux) sans se laisser distraire de la route.',
    keyPoints: [
      'Régler le GPS avant de démarrer',
      'Lire les panneaux de direction à distance',
      'La route reste prioritaire sur l\'écran',
    ],
    tip: 'Sortie ratée ? Continue. On ne freine jamais et on ne recule jamais sur l\'autoroute.',
  },
  C4c: {
    summary: 'Adopter une conduite souple et éco-responsable : moins de carburant, moins de CO₂.',
    keyPoints: [
      'Anticiper pour éviter les freinages inutiles',
      'Passer les rapports tôt, rouler en sous-régime',
      'Couper le moteur à l\'arrêt prolongé',
    ],
    tip: 'Une conduite souple = jusqu\'à 20% de carburant économisé et une voiture qui dure.',
  },
  C4d: {
    summary: 'Anticiper les situations à risque et garder son calme au volant.',
    keyPoints: [
      'Regarder loin pour anticiper les dangers',
      'Garder ses distances de sécurité',
      'Respirer, ne pas se laisser gagner par le stress',
    ],
    tip: 'Un conducteur qui anticipe freine rarement en urgence. Regarde loin, pas juste le capot.',
  },
  C4e: {
    summary: 'Partager la route en sécurité avec tous les usagers, surtout les plus vulnérables.',
    keyPoints: [
      'Cyclistes : 1 m en ville, 1,5 m hors agglo',
      'Piétons et zones 30 : priorité absolue',
      'Trottinettes : trajectoires imprévisibles',
    ],
    tip: 'Plus l\'usager est vulnérable, plus tu anticipes ses erreurs. Courtoisie avant vitesse.',
  },
  C4f: {
    summary: 'Aborder l\'examen pratique sereinement et savoir comment il se déroule.',
    keyPoints: [
      'Vérifications intérieures et extérieures demandées',
      'Suivre les consignes de l\'inspecteur calmement',
      'Une petite erreur ne fait pas tout rater',
    ],
    tip: 'L\'inspecteur évalue ta sécurité, pas la perfection. Respire et conduis comme à l\'entraînement.',
  },
  C4g: {
    summary: 'Conduire en jeune permis : période probatoire et bons réflexes pour durer.',
    keyPoints: [
      'Disque A à l\'arrière pendant 3 ans',
      'Vitesses réduites pour les jeunes conducteurs',
      '6 points au départ, capital qui se reconstitue',
    ],
    tip: 'Jeune permis = vigilance maximale les 3 premières années. Un seul excès peut coûter cher.',
  },
};

/**
 * Récupère les détails enrichis pour une sous-compétence, avec fallback générique.
 * @param {string} compId  - ex: "C1h"
 * @returns {{summary: string, keyPoints: string[], tip: string}}
 */
export function getCompDetail(compId) {
  const key = compId?.toUpperCase().replace(/(\d)([a-z])/i, '$1$2'); // normalise C1h → C1H
  const exact = REMC_DETAILS[key] || REMC_DETAILS[compId];
  if (exact) return exact;
  return {
    summary: 'Compétence officielle du référentiel REMC. Pratique-la avec ton moniteur.',
    keyPoints: ['Demande à ton moniteur de te guider', 'Pratique répétée', 'Sois attentif aux feedbacks'],
    tip: 'Chaque compétence se valide par la pratique. Pas de raccourci.',
  };
}
