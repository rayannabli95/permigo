// Les cinq événements de la rue. Trente secondes, chorégraphiées.
//
// 🔴 LA RÈGLE QUI DÉCIDE DE TOUT : quatre sur cinq ne sont pas des objets
// cachés, ce sont des CHANGEMENTS DE COMPORTEMENT. Un cycliste n'est pas un
// danger. Un cycliste qui regarde derrière lui juste avant une camionnette
// garée, si.
//
// 🔴 LA RÈGLE AJOUTÉE LE 10/08 : chaque événement porte un OBJECTIF ÉLÈVE
// écrit AVANT sa chorégraphie, et une AMORCE — la petite phrase qui donne à
// l'élève une raison de regarder CET élément plutôt qu'un autre. Sans elle,
// seule la personne qui a écrit la scène sait où poser les yeux.
//
// ⚠️ Chaque script est une FONCTION PURE du temps local `te`. C'est ce qui
// permet de rembobiner en faisant simplement redescendre `te`.
//
// ⚠️ LES DISTANCES SONT CALCULÉES, PAS ESTIMÉES. À 10 m/s, l'élève parcourt
// 10 mètres par seconde de fenêtre : une scène lisible « trois secondes à
// l'avance » se joue donc à trente mètres, et à trente mètres un enfant fait
// vingt pixels de haut. `npm run avance:portees` recalcule et affiche la
// distance de chaque instant clé. Une scène lisible au-delà de ~70 m n'est
// pas difficile, elle est invisible.

import { X_STATIONNE } from "./rue.js";

const lisser = (a, b, t) => Math.max(0, Math.min(1, (t - a) / (b - a)));
// Une accélération douce puis un arrêt net : un mouvement humain, jamais
// linéaire. Un piéton qui se déplace à vitesse constante a l'air d'un jouet.
const doux = (t) => t * t * (3 - 2 * t);
const entre = (a, b, t) => doux(lisser(a, b, t));

// Le trottoir fait quinze centimètres. Un piéton posé à y = 0 s'y enfonce
// jusqu'aux chevilles, et une voiture qui en descend doit descendre vraiment.
const HAUT = (x) => 0.15 * Math.min(1, Math.max(0, (x - 5.2) / 0.8));

export const EVENEMENTS = [
  // ───────────────────────────────────────────────────────────────────────
  // 1 · LA PORTIÈRE — LE TUTORIEL JOUABLE.
  //
  // OBJECTIF ÉLÈVE : comprendre la boucle du jeu. Une voiture garée n'est pas
  // un décor : quelqu'un est dedans, et il va ouvrir sa portière dans ma voie.
  //
  // ⭐ Cette scène n'est PAS là pour tester. Elle est là pour apprendre le
  // geste. Donc : la portière s'entrouvre en grand (0,6 rad, pas 0,2), la
  // phrase d'amorce dit où regarder, et si rien n'est touché au bout d'une
  // seconde trois, une relance le dit en toutes lettres.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "portiere",
    objectif: "Une voiture garée n'est pas un décor. Quelqu'un est dedans.",
    role: "apprendre le geste",
    comportement: false,
    danger: true,
    zDeclenche: 24,
    lisible: 2.0, // ≈ 32 m : la portière s'entrouvre franchement
    incident: 4.7, // ≈ 5 m : l'homme descend
    fin: 7.5,
    indice: "la portière qui s'entrouvrait",
    amorce: {
      te: 0.4,
      guide: "Regarde la voiture garée sur ta droite.",
      vague: null,
    },
    // ⭐ La relance du tutoriel. Elle n'existe qu'au niveau « guide », et elle
    // n'arrive que si l'élève n'a rien touché alors que le signe est là.
    relance: {
      te: 3.2,
      texte: "Tu l'as vue ? Touche-la avant qu'elle s'ouvre.",
    },
    acteurs: [
      { id: "gare", type: "voiture", couleur: "bleu" },
      { id: "porte", type: "porte" },
      { id: "homme", type: "pieton", couleur: "rouge" },
    ],
    porteur: "porte",
    pose(te) {
      const z = -28;
      // Elle s'entrouvre, elle marque un temps, puis elle s'ouvre en grand.
      // C'est ce temps d'arrêt qui la rend crédible — et qui laisse le temps
      // de comprendre qu'on a le droit de toucher.
      const a = entre(2.0, 2.7, te) * 0.62 + entre(3.6, 4.4, te) * 0.66;
      const sorti = entre(4.5, 5.6, te);
      return {
        gare: { x: X_STATIONNE, z, cap: 0 },
        // La charnière est à l'AVANT de la portière : elle s'ouvre donc vers
        // la route, et sa face extérieure se tourne vers nous en prenant le
        // soleil. C'est ce qui la rend lisible de trente mètres.
        porte: { x: X_STATIONNE - 0.95, z: z - 0.62, cap: -a, visible: true },
        homme: {
          x: X_STATIONNE - 1.0 - sorti * 1.9,
          z: z - 1.0,
          cap: -1.4 + sorti * 0.5,
          visible: te > 4.4,
        },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 2 · LE CYCLISTE — l'intention subtile.
  //
  // OBJECTIF ÉLÈVE : comprendre qu'un cycliste qui regarde derrière lui
  // annonce un changement de trajectoire. Il ne regarde pas par curiosité :
  // il vérifie s'il peut se déporter, parce qu'un obstacle l'attend.
  //
  // Trois choses s'additionnent : il tourne la tête, il se rapproche de
  // l'axe, et une camionnette est garée devant lui. Aucune des trois seule
  // n'est un danger.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "cycliste",
    objectif: "Un cycliste qui regarde derrière lui va changer de trajectoire.",
    role: "intention subtile",
    comportement: true,
    danger: true,
    zDeclenche: -34,
    lisible: 2.2, // ≈ 19 m : le coup d'œil par-dessus l'épaule
    incident: 5.6, // ≈ 6 m : il déboîte
    fin: 8,
    indice: "il a regardé derrière lui",
    amorce: {
      te: 0.4,
      guide: "Observe le cycliste.",
      vague: "Qu'est-ce qui te paraît bizarre ?",
    },
    acteurs: [
      { id: "velo", type: "velo", couleur: "jaune" },
      { id: "camionnette", type: "camion", couleur: "blanc" },
    ],
    porteur: "velo",
    pose(te) {
      const z = -60 - 6.5 * te;
      // Le regard par-dessus l'épaule. ⚠️ 1,0 d'amplitude et pas 0,6 : à
      // quatorze mètres, un buste qui tourne de trente degrés fait quatre
      // pixels de silhouette. On exagère, sinon la scène n'existe pas.
      const tete = entre(2.2, 2.7, te) - entre(3.6, 4.0, te);
      // Puis il se rapproche de l'axe. Quarante-cinq centimètres, et c'est la
      // moitié de l'information.
      const glisse = entre(3.4, 4.8, te) * 0.45;
      const deboite = entre(5.6, 6.7, te) * 1.35;
      return {
        velo: {
          x: 3.6 - glisse - deboite,
          z,
          cap: tete * 0.5 - deboite * 0.12,
          buste: tete, // le buste tourne, pas seulement la roue
        },
        camionnette: { x: X_STATIONNE, z: -105, cap: 0 },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 3 · LE PIÉTON ET LA POUBELLE — la fausse alerte.
  //
  // OBJECTIF ÉLÈVE : apprendre que « ça bouge » n'est pas « c'est un danger ».
  // Il fait EXACTEMENT ce que fait quelqu'un qui va traverser : il se retourne
  // vers la chaussée et il avance. Sauf qu'il va jeter un sac.
  //
  // Sans cette scène, « tout ce qui bouge est un danger » gagne à tous les
  // coups et le jeu n'a plus rien à enseigner.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "poubelle",
    objectif: "Ça bouge vers la route. Ça ne veut pas dire que ça traverse.",
    role: "fausse alerte",
    comportement: true,
    danger: false,
    zDeclenche: -100,
    lisible: null, // ⭐ jamais dangereux : toucher restera « pas encore »
    incident: null,
    fin: 8,
    indice: null,
    amorce: {
      te: 0.8,
      guide: "Quelqu'un va-t-il traverser ?",
      vague: "Quelqu'un va-t-il traverser ?",
    },
    acteurs: [
      { id: "passant", type: "pieton", couleur: "gris" },
      { id: "bac", type: "poubelle" },
    ],
    porteur: "passant",
    pose(te) {
      const vers = entre(3.0, 3.9, te) - entre(5.8, 6.6, te);
      const pas = entre(3.2, 4.3, te) * 0.7 - entre(6.0, 7.0, te) * 0.7;
      const x = 7.5 - pas;
      return {
        passant: {
          x,
          y: HAUT(x),
          z: -154 - 1.2 * Math.min(te, 3.0),
          // cap = π/2 : il fait face à la chaussée. Exactement la posture de
          // quelqu'un qui s'apprête à traverser.
          cap: vers * 1.25,
        },
        bac: { x: 6.25, y: 0.15, z: -157.8, cap: 0 },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 4 · LA VOITURE QUI HÉSITE — détectable très tôt.
  //
  // OBJECTIF ÉLÈVE : apprendre à regarder LOIN. Tout est déjà lisible à
  // soixante-dix mètres : elle est de travers, ses roues sont braquées vers
  // la chaussée, ses feux de stop sont allumés. Il n'y a rien à deviner, il
  // n'y a qu'à lever les yeux.
  //
  // Celui qui regarde loin gagne six secondes. Celui qui regarde son capot en
  // gagne une demie.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "hesite",
    objectif: "Ce qui va me gêner dans six secondes est déjà visible.",
    role: "détectable très tôt",
    comportement: true,
    danger: true,
    zDeclenche: -140,
    lisible: 0.5, // ≈ 68 m : de travers, feux allumés, roues braquées
    incident: 6.5, // ≈ 8 m : elle sort
    fin: 9,
    indice: "ses roues étaient déjà braquées",
    amorce: {
      te: 0.4,
      guide: "Regarde loin devant.",
      vague: "Regarde loin.",
    },
    acteurs: [
      { id: "sortante", type: "voiture", couleur: "rouge", feux: true },
    ],
    porteur: "sortante",
    pose(te) {
      // Le petit à-coup : elle avance de quatre-vingt-dix centimètres, elle
      // s'arrête, elle repart. C'est ce faux départ qui dit « il y a
      // quelqu'un dedans et il va y aller ».
      const acoup = entre(3.4, 4.2, te) * 0.9;
      const sortie = entre(6.5, 8.6, te);
      // ⚠️ La trajectoire est écrite en clair, pas intégrée à partir du cap :
      // un cap qui revient à zéro ramenait la voiture à son point de départ.
      const x = 6.9 - acoup * 0.8 - sortie * 5.4;
      return {
        sortante: {
          x,
          y: HAUT(x),
          z: -213 - acoup * 0.55 - sortie * 9,
          // ⚠️ 1,05 rad (60°) et pas 0,95 : à soixante-dix mètres, ce qui
          // distingue cette voiture d'une voiture garée n'est ni sa couleur ni
          // ses feux, c'est sa SILHOUETTE de travers. Plus elle est en biais,
          // plus elle montre son flanc, plus elle se repère de loin.
          cap: 1.05 * (1 - sortie), // braquée vers la route, puis alignée
          stop: te < 6.4, // feux de stop allumés tant qu'elle attend
        },
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────
  // 5 · L'ENFANT — celle qu'on rate.
  //
  // OBJECTIF ÉLÈVE : un enfant ne regarde pas la route, il regarde ce qui
  // l'intéresse. Ici son copain, sur le trottoir d'en face, qui saute sur
  // place. C'est le copain qui est le signe, pas l'enfant.
  //
  // ⚠️ Le copain saute — un enfant immobile de l'autre côté d'une rue à
  // quarante mètres est invisible. Le mouvement, lui, s'attrape du coin de
  // l'œil, et c'est exactement ce qu'on veut enseigner.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "enfant",
    objectif: "Un enfant ne regarde pas la route. Il regarde son copain.",
    role: "difficile",
    comportement: true,
    danger: true,
    zDeclenche: -214,
    lisible: 1.0, // ≈ 26 m : les deux enfants se font face
    incident: 3.2, // ≈ 6 m : il s'élance
    fin: 5.4,
    indice: "son copain l'attendait en face",
    amorce: {
      te: 0.2,
      guide: "Deux enfants. Un de chaque côté.",
      vague: "Regarde les trottoirs.",
    },
    acteurs: [
      { id: "gamin", type: "enfant", couleur: 0xf4c116 },
      { id: "copain", type: "enfant", couleur: 0xe0453a },
    ],
    porteur: "gamin",
    pose(te) {
      const bord = entre(1.6, 2.6, te) * 0.75; // il s'avance au caniveau
      const course = entre(3.2, 5.0, te);
      // ⚠️ 6,3 et pas 6,7 : le champ horizontal fait 36°, donc tout ce qui est
      // à cinq mètres sur le côté sort du cadre en dessous de seize mètres.
      // Quarante centimètres vers la chaussée, c'est une seconde de plus où
      // l'enfant reste visible — et c'est là qu'un enfant attend, de toute
      // façon, quand il veut traverser.
      const x = 6.3 - bord - course * 13.0;
      return {
        gamin: {
          x,
          y: HAUT(x),
          z: -250 + course * 1.2,
          // Tourné vers l'autre trottoir depuis le début. Il ne regarde
          // jamais la route, pas même en s'élançant.
          cap: Math.PI / 2 - course * 0.2,
          court: course > 0.02,
        },
        copain: {
          x: -6.3,
          // ⚠️ 30 cm de saut, pas 15 : à trente mètres, quinze centimètres
          // font trois pixels. Le seul signe de la scène doit s'attraper du
          // coin de l'œil, donc il s'exagère.
          y: 0.15 + Math.abs(Math.sin(te * 3.6)) * 0.3,
          z: -253,
          cap: -Math.PI / 2,
        },
      };
    },
  },
];

// Les mètres réservés : ni voiture décorative ni passant d'ambiance là où un
// événement doit se lire.
//
// 🔴 Un trou ne protège pas seulement l'ENDROIT de la scène, il protège la
// LIGNE DE VUE qui y mène. La voiture qui hésite est à sept mètres sur la
// droite : à soixante-dix mètres, le regard qui va vers elle traverse la file
// de stationnement quarante mètres avant. Sans un trou de cette longueur,
// « regarde loin » demande de voir à travers une voiture garée.
//
// 🔴 ET CE N'EST PAS UN RAYON, C'EST UN ANGLE. Le calcul évident (« la droite
// qui va de l'œil à l'enfant traverse-t-elle une voiture ? ») dit non, et
// pourtant l'enfant était caché : une voiture garée à vingt mètres occupe six
// degrés de large, c'est-à-dire tout le secteur où un enfant à trente-quatre
// mètres vient se projeter. Un objet PROCHE ne masque pas une ligne, il
// masque un CÔNE. Les bornes ci-dessous sont donc calculées en angles.
export const TROUS = [
  [-36, -20],
  [-113, -93],
  [-162, -146],
  [-222, -168], // ⚠️ long : c'est le cône de vue de « hesite », à 73 m
  [-258, -228], // ⚠️ le cône de vue des deux enfants
];

export const DUREE = 30;
export const VITESSE = 10; // 36 km/h — une vitesse de ville, et du temps pour lire
export const DEPART = { x: 1.7, z: 40 };

// Les trois niveaux d'aide. Plus l'élève joue, moins on lui en donne : c'est
// la seule progression du prototype, et elle ne coûte pas une ligne d'UI.
export const NIVEAUX = ["guide", "vague", "aucun"];
export function niveauPour(parties) {
  if (parties <= 1) return "guide";
  if (parties <= 3) return "vague";
  return "aucun";
}
