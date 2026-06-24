// ═══════════════════════════════════════════════════════════════
// Examen blanc de CONDUITE — structure officielle de l'ECE (permis B).
// 8 phases dans l'ordre réel, scoré « façon /31 », fautes éliminatoires.
//
// Source : docs/fiches-conduite/EXAMEN-BLANC-structure.md (croisé officiel
// service-public.fr / sécurité-routière.gouv.fr / guide IPCSR + débriefs de
// vrais moniteurs). 100% reformulé, tutoiement.
//
// ⚠️ Garde-fou : c'est une SIMULATION d'entraînement, PAS la vraie note (seul
// l'inspecteur la donne le jour J). On le dit dans l'UI.
// ⚠️ Faute éliminatoire (`elim`) : UNIQUEMENT la liste confirmée par l'officiel
// (§3 du doc). On n'invente jamais d'éliminatoire.
// ═══════════════════════════════════════════════════════════════

// Familles de compétences (grille officielle, sous-totaux indicatifs = /29) +
// 2 bonus à +1 → total 31. Barème PARAMÉTRABLE (pas figé ligne à ligne).
export const FAMILLES = {
  commandes: { label: "Maîtrise du véhicule", max: 8 },
  info: { label: "Prise d'information", max: 9 },
  partage: { label: "Partage de la chaussée", max: 9 },
  autonomie: { label: "Autonomie & risque", max: 3 },
};
export const BONUS = {
  courtoisie: { label: "Courtoisie", max: 1 },
  eco: { label: "Éco-conduite", max: 1 },
};
export const TOTAL = 31;
export const SEUIL = 20; // reçu si ≥ 20 ET 0 faute éliminatoire (officiel)

// q   = la mise en situation
// opts= réponses ; correct = index de la bonne ; elim = index d'une réponse
//       qui est une FAUTE ÉLIMINATOIRE (optionnel, liste officielle uniquement)
// fam = famille notée ; why = correction courte (tutoiement)
// bonus = 'courtoisie' | 'eco' (l'item rapporte le point bonus si correct)
export const PHASES = [
  {
    n: 1,
    key: "accueil",
    emoji: "🪪",
    titre: "Accueil & identité",
    sous: "Avant de rouler — l'inspecteur vérifie que c'est bien toi.",
    items: [
      {
        id: "p1-impression",
        fam: "info",
        q: "Pare-brise plein de gouttes, tu t'installes. L'inspecteur t'observe déjà. Tu fais quoi ?",
        opts: [
          "Tu mets les essuie-glaces avant de démarrer",
          "Tu démarres, tu verras bien en roulant",
          "Tu attends que ça sèche tout seul",
        ],
        correct: 0,
        why: "La première impression compte. Démarrer sans rien voir ni vérifier dit tout de suite « pas dedans ». Tu prends l'info AVANT de bouger.",
      },
    ],
  },
  {
    n: 2,
    key: "installation",
    emoji: "🪑",
    titre: "Installation & sécurité à bord",
    sous: "Réglages + tout le monde en sécurité. 2 points « cadeau ».",
    items: [
      {
        id: "p2-ordre",
        fam: "commandes",
        q: "Tu règles ton poste. Le plus logique, c'est dans quel ordre ?",
        opts: [
          "Siège → volant → rétroviseurs",
          "Rétroviseurs → volant → siège",
          "Volant → siège → rétroviseurs",
        ],
        correct: 0,
        why: "Siège d'abord (ta position de référence), puis volant, puis les rétros — réglés une fois que tu es bien assis. L'inspecteur n'est pas au taquet sur l'ordre exact, mais que tu sois bien installé.",
      },
      {
        id: "p2-securite",
        fam: "commandes",
        q: "Tu es installé. Avant de partir, le réflexe sécurité c'est…",
        opts: [
          "Vérifier que tout le monde est attaché + portières fermées, aucun voyant rouge",
          "Démarrer dès que l'inspecteur s'assoit",
          "Régler la clim et la radio",
        ],
        correct: 0,
        why: "Sécurité à bord = 1 point facile : ceintures, portières (verrouiller force à vérifier), tableau de bord sans voyant rouge.",
      },
    ],
  },
  {
    n: 3,
    key: "consignes",
    emoji: "🗣️",
    titre: "Les consignes",
    sous: "L'inspecteur explique le déroulé. Écoute vraiment.",
    items: [
      {
        id: "p3-silence",
        fam: "autonomie",
        q: "« Les directions, je te les donne. Si je ne dis rien… » — tu fais quoi ?",
        opts: [
          "Tu continues tout droit",
          "Tu t'arrêtes pour demander",
          "Tu tournes au prochain croisement",
        ],
        correct: 0,
        why: "« Si je ne dis rien, c'est tout droit. » C'est la règle annoncée par tous les inspecteurs.",
      },
    ],
  },
  {
    n: 4,
    key: "conduite",
    emoji: "🚗",
    titre: "Conduite en circulation",
    sous: "Le cœur de l'épreuve (≥ 25 min). C'est ici que tout se joue.",
    items: [
      {
        id: "p4-prio-droite",
        fam: "partage",
        q: "Intersection sans panneau, une voiture arrive à ta droite. Tu fais quoi ?",
        opts: [
          "Tu cèdes — priorité à droite",
          "Tu passes, tu étais là avant",
          "Tu accélères pour passer devant",
        ],
        correct: 0,
        elim: 1, // refus de priorité = éliminatoire (officiel)
        why: "Priorité à droite : tu cèdes. Forcer le passage = refus de priorité = faute éliminatoire.",
      },
      {
        id: "p4-ligne",
        fam: "partage",
        q: "Un cycliste lent devant toi, ligne blanche continue au sol. Tu veux le doubler.",
        opts: [
          "Tu patientes derrière jusqu'à la ligne discontinue",
          "Tu franchis la ligne continue pour le doubler",
          "Tu klaxonnes pour qu'il se pousse",
        ],
        correct: 0,
        elim: 1, // franchir ligne continue = éliminatoire (officiel)
        why: "Franchir une ligne continue = faute éliminatoire. Tu restes derrière, tu doubles quand c'est permis et sûr.",
      },
      {
        id: "p4-giratoire",
        fam: "info",
        q: "Sur un giratoire, tu réalises que tu es mal placé pour ta sortie. Le mieux ?",
        opts: [
          "Tu refais un tour proprement",
          "Tu donnes un coup de volant pour sortir quand même",
          "Tu t'arrêtes sur le giratoire",
        ],
        correct: 0,
        why: "Refaire un tour > un coup de volant dangereux. Les moniteurs valorisent énormément l'erreur rattrapée sans panique.",
      },
      {
        id: "p4-angle-mort",
        fam: "info",
        q: "Tu vas te déporter pour une voiture en stationnement. Un usager peut être à gauche.",
        opts: [
          "Rétro + coup d'œil angle mort, puis tu te déportes",
          "Tu te déportes direct, c'est rapide",
          "Tu klaxonnes et tu te déportes",
        ],
        correct: 0,
        elim: 1, // changement de voie/déport sans contrôle, usager présent = éliminatoire
        why: "Changer de trajectoire sans contrôler l'angle mort alors qu'un usager est là = faute éliminatoire. Le contrôle, c'est ce qui te sauve.",
      },
      {
        id: "p4-distance",
        fam: "info",
        q: "Tu suis une voiture sur une route à 80. La bonne distance de sécurité ?",
        opts: [
          "Environ 2 secondes derrière elle",
          "Le plus près possible pour ne pas te faire doubler",
          "Une demi-voiture",
        ],
        correct: 0,
        why: "~2 secondes : tu choisis un repère fixe, la voiture le passe, tu comptes « mille-un, mille-deux ». Ton coussin de sécurité.",
      },
      {
        id: "p4-allure",
        fam: "commandes",
        q: "Ligne droite dégagée, limite à 50, tu roules à 30 « pour être sûr ». L'inspecteur…",
        opts: [
          "Le manque de dynamisme est pénalisé : mets de l'allure quand c'est permis",
          "Adore, plus c'est lent plus c'est sûr",
          "S'en fiche de la vitesse",
        ],
        correct: 0,
        why: "Trop mou = pénalisé. Tu adaptes : ni trop vite, ni trop lent. Une conduite dynamique quand la situation le permet.",
      },
      {
        id: "p4-feu",
        fam: "partage",
        q: "Feu qui passe au rouge devant toi, tu peux encore freiner sans danger.",
        opts: [
          "Tu t'arrêtes avant la ligne",
          "Tu passes, t'étais presque engagé",
          "Tu accélères pour passer à l'orange",
        ],
        correct: 0,
        elim: 1, // non-respect d'un signal d'arrêt = éliminatoire
        why: "Griller un feu rouge = faute éliminatoire. Si tu peux t'arrêter en sécurité, tu t'arrêtes.",
      },
      {
        id: "p4-courtoisie",
        fam: "partage",
        bonus: "courtoisie",
        q: "Une voiture veut s'insérer depuis un parking, le trafic est dense mais tu peux la laisser sans gêner.",
        opts: [
          "Tu la laisses passer d'un geste",
          "Tu avances, chacun pour soi",
          "Tu t'arrêtes net en plein milieu d'un carrefour pour elle",
        ],
        correct: 0,
        elim: 2, // arrêt injustifié/dangereux = éliminatoire
        why: "Bonus courtoisie : tu facilites quand tu peux, sans danger. Mais t'arrêter n'importe où (carrefour) = arrêt injustifié dangereux = éliminatoire. La courtoisie n'est jamais au prix de la sécurité.",
      },
    ],
  },
  {
    n: 5,
    key: "autonomie",
    emoji: "🧭",
    titre: "Conduite autonome",
    sous: "« Suis la direction de [ville] » — ~5 min sans guidage.",
    items: [
      {
        id: "p5-tromper",
        fam: "autonomie",
        q: "En autonomie, tu réalises que tu pars dans la mauvaise direction. Tu fais quoi ?",
        opts: [
          "Tu continues proprement, tu te recales dès que possible",
          "Tu changes de voie au dernier moment pour rattraper",
          "Tu freines fort et tu fais demi-tour",
        ],
        correct: 0,
        elim: 1, // changement de voie au dernier moment sans contrôle = danger
        why: "Te tromper de direction n'est PAS éliminatoire (1 point d'autonomie en jeu). Mais déboîter au dernier moment sans contrôle pour rattraper = dangereux. Tu te recales calmement.",
      },
    ],
  },
  {
    n: 6,
    key: "manoeuvre",
    emoji: "↩️",
    titre: "La manœuvre",
    sous: "Freinage de précision + marche arrière (créneau, bataille, demi-tour).",
    items: [
      {
        id: "p6-clignotant",
        fam: "partage",
        q: "Tu vas t'arrêter pour faire ton créneau. Le clignotant, c'est…",
        opts: [
          "AVANT de t'arrêter",
          "Une fois arrêté",
          "Pas besoin, tu es à l'arrêt",
        ],
        correct: 0,
        why: "Clignotant AVANT de t'arrêter : sinon tu as déjà surpris la voiture derrière toi. Tu préviens, puis tu manœuvres.",
      },
      {
        id: "p6-espace",
        fam: "commandes",
        q: "Pour ton créneau, l'inspecteur t'a laissé une GRANDE place. Erreur classique à éviter ?",
        opts: [
          "Braquer trop tôt et risquer de frotter la voiture",
          "Utiliser tout l'espace disponible",
          "Contrôler tout autour pendant le recul",
        ],
        correct: 0,
        why: "On te laisse de la place exprès : sers-t'en. Braquer trop tôt = collision évitée par l'inspecteur = échec. Et tu contrôles tout autour, pas juste un rétro.",
      },
    ],
  },
  {
    n: 7,
    key: "questions",
    emoji: "❓",
    titre: "Les questions",
    sous: "Vérif technique + sécurité routière + premiers secours. 3 points faciles.",
    items: [
      {
        id: "p7-detresse",
        fam: "commandes",
        q: "Vérif intérieure : « Allume les feux de détresse et cite 3 cas où on les utilise. »",
        opts: [
          "Panne/accident, ralentissement brutal sur autoroute, véhicule lent gênant",
          "La nuit en ville pour mieux voir",
          "Pour remercier une voiture qui te laisse passer",
        ],
        correct: 0,
        why: "Warnings = signaler un danger : panne/accident, bouchon soudain sur voie rapide, convoi/véhicule très lent. C'est du par-cœur, ne lâche pas ces 3 points.",
      },
      {
        id: "p7-secours",
        fam: "autonomie",
        q: "Premiers secours : à quelle distance places-tu le triangle de pré-signalisation ?",
        opts: [
          "Environ 30 mètres avant le danger (et visible)",
          "Juste derrière ta voiture",
          "On ne pose pas de triangle",
        ],
        correct: 0,
        why: "~30 m avant le danger, là où les autres te voient à temps — et tu te mets en sécurité (gilet, hors chaussée) avant.",
      },
    ],
  },
  {
    n: 8,
    key: "bilan",
    emoji: "🏁",
    titre: "Retour & immobilisation",
    sous: "L'examen n'est fini que moteur coupé. Reste concentré.",
    items: [
      {
        id: "p8-immo",
        fam: "commandes",
        q: "Tu rentres au centre. Pour immobiliser proprement :",
        opts: [
          "Point mort, frein à main, essuie-glaces coupés, moteur éteint",
          "Tu coupes le moteur en laissant une vitesse engagée sur le plat",
          "Tu sors, l'inspecteur s'occupe du reste",
        ],
        correct: 0,
        why: "Point mort + frein à main + essuie-glaces coupés + moteur éteint. Des élèves se font éliminer en relâchant dans les dernières minutes — reste à fond jusqu'au bout.",
      },
      {
        id: "p8-eco",
        fam: "commandes",
        bonus: "eco",
        q: "Tout au long du parcours, pour la conduite économique tu as…",
        opts: [
          "Passé les rapports assez tôt, conduite souple et fluide",
          "Poussé chaque vitesse au maximum dans les tours",
          "Roulé constamment en sous-régime à 1000 tr/min",
        ],
        correct: 0,
        why: "Bonus éco-conduite : monter les rapports tôt, anticiper pour éviter les coups de frein, rester fluide.",
      },
    ],
  },
];

// Score « façon /31 » : par famille, (bonnes / total) × max famille ; + bonus.
// Une faute éliminatoire rencontrée → échec quel que soit le total (officiel).
export function scoreExam(answers) {
  // answers : [{ item, picked, correct, fam, bonusKey, isElim }]
  const elim = answers.find((a) => a.isElim) || null;
  const famScore = {};
  for (const key of Object.keys(FAMILLES)) {
    const list = answers.filter((a) => a.fam === key);
    const good = list.filter((a) => a.correct).length;
    famScore[key] = list.length
      ? Math.round((good / list.length) * FAMILLES[key].max)
      : 0;
  }
  let bonus = 0;
  const bonusGot = {};
  for (const key of Object.keys(BONUS)) {
    const it = answers.find((a) => a.bonusKey === key);
    bonusGot[key] = !!(it && it.correct);
    if (bonusGot[key]) bonus += BONUS[key].max;
  }
  const base = Object.values(famScore).reduce((s, v) => s + v, 0);
  const note = Math.min(TOTAL, base + bonus);
  // Point faible = la famille la plus loin de son max — SEULEMENT si elle a
  // réellement perdu des points (ratio < 1). Score parfait → weak = null.
  let weak = null;
  let worst = 1;
  for (const key of Object.keys(FAMILLES)) {
    const ratio = famScore[key] / FAMILLES[key].max;
    if (ratio < worst) {
      worst = ratio;
      weak = key;
    }
  }
  return {
    note,
    famScore,
    bonusGot,
    elim,
    weak,
    passed: !elim && note >= SEUIL,
  };
}
