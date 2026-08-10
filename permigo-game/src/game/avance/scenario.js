// Les cinq événements de la rue. Trente secondes, chorégraphiées.
//
// 🔴 LA RÈGLE QUI DÉCIDE DE TOUT : quatre sur cinq ne sont pas des objets
// cachés, ce sont des CHANGEMENTS DE COMPORTEMENT. Un cycliste n'est pas un
// danger. Un cycliste qui regarde derrière lui juste avant une camionnette
// garée, si. Le jeu ne demande pas « trouve le pixel bizarre », il demande
// « comprends QUAND une situation devient dangereuse ».
//
// ⚠️ Chaque script est une FONCTION PURE du temps local `te`. C'est ce qui
// permet de rembobiner en faisant simplement redescendre `te` : aucun
// historique à conserver, et la scène rejouée est exactement la même.
//
// Trois instants par événement :
//   naissance  te = 0     l'acteur entre en scène, parfaitement inoffensif
//   lisible               le premier signe. AVANT, toucher n'est qu'une
//                         hypothèse : « Pas encore », sans punition.
//   incident              ça se produit. La récompense est incident − touche.

import { X_STATIONNE } from "./rue.js";

const lisser = (a, b, t) => Math.max(0, Math.min(1, (t - a) / (b - a)));
// Une accélération douce puis un arrêt net : un mouvement humain, jamais
// linéaire. Un piéton qui se déplace à vitesse constante a l'air d'un jouet.
const doux = (t) => t * t * (3 - 2 * t);
const entre = (a, b, t) => doux(lisser(a, b, t));

export const EVENEMENTS = [
  // ───────────────────────────────────────────────────────────────────────
  // 1 · LA PORTIÈRE — le danger évident. Il n'est là que pour apprendre le
  //     geste, en cinq secondes et sans un mot. Il faut qu'on le voie.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "portiere",
    role: "apprendre le geste",
    comportement: false,
    zDeclenche: 40,
    lisible: 2.6, // la portière commence à s'ouvrir : impossible à manquer
    incident: 5.2,
    fin: 8,
    indice: "la portière qui s'ouvre",
    acteurs: [
      { id: "gare", type: "voiture", couleur: "bleu" },
      { id: "porte", type: "porte" },
      { id: "homme", type: "pieton", couleur: "rouge" },
    ],
    porteur: "porte",
    pose(te) {
      const z = -25;
      // La portière s'entrouvre de dix centimètres, marque un temps, puis
      // s'ouvre en grand. C'est ce temps d'arrêt qui la rend crédible.
      const a = entre(2.6, 3.2, te) * 0.22 + entre(3.6, 4.4, te) * 0.95;
      const sorti = entre(4.4, 5.4, te);
      return {
        gare: { x: X_STATIONNE, z, cap: 0 },
        porte: { x: X_STATIONNE - 0.95, z: z - 0.6, cap: -a, visible: true },
        homme: {
          x: X_STATIONNE - 0.9 - sorti * 1.9,
          z: z - 0.9,
          cap: -1.4 + sorti * 0.5,
          visible: te > 4.2,
        },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 2 · LE CYCLISTE — l'intention subtile. C'est LA scène qui décide si
  //     PermiGo est un jeu d'observation intelligent ou un jeu de recherche.
  //     Il est visible depuis le début et il n'est pas un danger. Il le
  //     devient quand trois choses s'additionnent : il regarde derrière lui,
  //     il se déporte, et une camionnette apparaît devant lui.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "cycliste",
    role: "intention subtile",
    comportement: true,
    zDeclenche: -10,
    lisible: 2.6, // il tourne la tête
    incident: 5.0, // il déboîte
    fin: 8,
    indice: "il a regardé derrière lui",
    acteurs: [
      { id: "velo", type: "velo", couleur: "jaune" },
      { id: "camionnette", type: "camion", couleur: "blanc" },
    ],
    porteur: "velo",
    pose(te) {
      const z = -45 - 5.5 * te;
      // Le regard par-dessus l'épaule : 0,45 s de rotation, tenu 0,7 s, puis
      // il se retourne. Discret, et c'est tout ce qu'on a.
      const tete = entre(2.6, 3.05, te) - entre(3.75, 4.1, te);
      // Puis il se rapproche de l'axe. Quarante centimètres. Personne ne le
      // remarque, et pourtant c'est la moitié de l'information.
      const glisse = entre(3.4, 4.6, te) * 0.45;
      const deboite = entre(5.0, 6.2, te) * 1.35;
      return {
        velo: {
          x: 3.6 - glisse - deboite,
          z,
          cap: tete * 0.55 - deboite * 0.12,
          buste: tete, // le buste se tourne, pas seulement la roue
        },
        camionnette: { x: X_STATIONNE, z: -78, cap: 0 },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 3 · LE PIÉTON ET LA POUBELLE — la fausse alerte.
  //     Il fait EXACTEMENT ce que fait un piéton qui va traverser : il se
  //     retourne vers la chaussée et il avance. Sauf qu'il va jeter un sac.
  //     Sans cette scène, « tout ce qui bouge est un danger » gagne à tous
  //     les coups et le jeu n'a plus rien à enseigner.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "poubelle",
    role: "fausse alerte",
    comportement: true,
    zDeclenche: -70,
    lisible: null, // ⭐ jamais dangereux : toucher restera « pas encore »
    incident: null,
    fin: 9,
    indice: null,
    acteurs: [
      { id: "passant", type: "pieton", couleur: "gris" },
      { id: "bac", type: "poubelle" },
    ],
    porteur: "passant",
    pose(te) {
      const vers = entre(3.0, 3.9, te) - entre(5.6, 6.4, te);
      const pas = entre(3.2, 4.3, te) * 0.55 - entre(5.8, 6.8, te) * 0.55;
      return {
        passant: {
          x: 6.95 - pas,
          z: -140 - 1.15 * Math.min(te, 3.1) - 1.15 * Math.max(0, te - 6.6),
          cap: -Math.PI / 2 + vers * (Math.PI / 2),
        },
        bac: { x: 6.35, z: -146, cap: 0 },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 4 · LA VOITURE QUI HÉSITE — détectable très tôt.
  //     Elle est de travers, roues braquées vers la chaussée, feux allumés,
  //     et elle avance de trente centimètres avant de s'arrêter. Tout est
  //     lisible à quatre-vingts mètres. Celui qui regarde loin gagne six
  //     secondes ; celui qui regarde son capot en gagne une demie.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "hesite",
    role: "détectable très tôt",
    comportement: true,
    zDeclenche: -115,
    lisible: 0.6,
    incident: 6.6,
    fin: 10,
    indice: "ses roues étaient déjà braquées",
    acteurs: [
      { id: "sortante", type: "voiture", couleur: "rouge", feux: true },
    ],
    porteur: "sortante",
    pose(te) {
      // Le petit à-coup : elle avance, elle s'arrête, elle repart. C'est ce
      // faux départ qui dit « il y a quelqu'un dedans et il va y aller ».
      const avance = entre(3.8, 4.6, te) * 0.75 + entre(6.6, 8.6, te) * 9.5;
      const cap = -0.95 + entre(6.6, 8.2, te) * 0.95;
      const ax = -Math.sin(cap);
      const az = -Math.cos(cap);
      return {
        sortante: {
          x: 7.4 + ax * avance,
          z: -205 + az * avance,
          cap,
          stop: te < 6.5, // feux de stop allumés tant qu'elle attend
        },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 5 · L'ENFANT — celle qu'on rate.
  //     Il ne bouge pas. Il ne fait rien. Sa tête est tournée vers l'autre
  //     trottoir, où son copain l'attend. C'est le seul signe, il tient en
  //     quelques pixels, et il est là depuis cinq secondes.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "enfant",
    role: "difficile",
    comportement: true,
    zDeclenche: -185,
    lisible: 1.2,
    incident: 6.2,
    fin: 9,
    indice: "il regardait de l'autre côté de la rue",
    acteurs: [
      { id: "gamin", type: "enfant", couleur: "jaune" },
      { id: "copain", type: "enfant", couleur: "bleu" },
    ],
    porteur: "gamin",
    pose(te) {
      const bord = entre(5.0, 5.9, te) * 0.7;
      const course = entre(6.2, 8.4, te);
      return {
        gamin: {
          x: 6.6 - bord - course * 13.2,
          z: -265 + course * 1.6,
          // Tourné vers l'autre trottoir depuis le début. Il ne regarde
          // jamais la route, pas même en s'élançant.
          cap: Math.PI / 2 - course * 0.25,
          court: course > 0.02,
        },
        copain: { x: -6.6, z: -268, cap: -Math.PI / 2 },
      };
    },
  },
];

// Les mètres réservés : la rue ne doit pas garer une voiture décorative
// exactement là où un enfant doit surgir.
export const TROUS = [
  [-30, -18],
  [-84, -70],
  [-152, -138],
  [-212, -196],
  [-272, -258],
];

export const DUREE = 30;
export const VITESSE = 11; // ~40 km/h
export const DEPART = { x: 1.7, z: 40 };
