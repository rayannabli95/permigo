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
// 📖 Les couleurs viennent de la palette, jamais d'un hexadécimal écrit ici.
// Règle de la bible §3 : un PORTEUR de scène est toujours très saturé, un
// figurant est toujours désaturé. C'est la couleur qui dit « ceci compte ».
import { VEHICULES_PORTEURS, VETEMENTS } from "../da/palette.js";

const lisser = (a, b, t) => Math.max(0, Math.min(1, (t - a) / (b - a)));
// Une accélération douce puis un arrêt net : un mouvement humain, jamais
// linéaire. Un piéton qui se déplace à vitesse constante a l'air d'un jouet.
const doux = (t) => t * t * (3 - 2 * t);
const entre = (a, b, t) => doux(lisser(a, b, t));
// ⭐ L'ÉLAN : comme `entre`, mais avec un léger dépassement amorti à
// l'arrivée. Une portière poussée de l'intérieur ne s'arrête pas pile, elle
// va un peu trop loin et revient. Six pour cent de dépassement suffisent, et
// c'est la différence entre un objet et un mécanisme.
const elan = (a, b, t) => {
  const u = lisser(a, b, t);
  return u >= 1 ? 1 : 1 - Math.pow(1 - u, 2.2) * Math.cos(u * Math.PI * 1.15);
};

// Le trottoir fait quinze centimètres. Un piéton posé à y = 0 s'y enfonce
// jusqu'aux chevilles, et une voiture qui en descend doit descendre vraiment.
const HAUT = (x) => 0.15 * Math.min(1, Math.max(0, (x - 5.2) / 0.8));

// ⭐⭐ LE DÉNOUEMENT. `vu` est l'instant local où l'élève a repéré la scène,
// ou `null` s'il ne l'a pas vue. Renvoie 0 puis monte à 1 en neuf dixièmes.
//
// C'est la pièce qui manquait au jeu, et elle touche sa promesse : « voir
// suffit ». Avant, un script se déroulait à l'identique qu'on ait vu le
// danger ou non, donc l'homme sortait quand même de sa voiture et se plantait
// dans notre voie. Le jeu affirmait une chose et en montrait une autre.
//
// ⚠️ Ce n'est PAS « le danger disparaît ». Chaque scène se dénoue de la façon
// dont elle se dénouerait pour de vrai quand un conducteur a levé le pied :
// l'homme reste assis, la voiture attend son tour, l'enfant s'arrête au
// caniveau. On ne supprime pas le danger, on lui laisse le temps de ne pas en
// devenir un — c'est exactement ce qu'on veut enseigner.
const apaise = (vu, te) => (vu == null ? 0 : entre(vu, vu + 0.9, te));

// La trajectoire du cycliste, isolée pour qu'on puisse la DÉRIVER. C'est ce
// qui donne son cap : voir la scène 2.
const VELO = { x0: 3.6, v: 6.5 };
const xVelo = (te, vu) =>
  VELO.x0 -
  entre(3.4, 4.8, te) * 0.45 -
  entre(5.6, 6.7, te) * 1.35 * (1 - apaise(vu, te) * 0.75);

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
      { id: "gare", type: "voiture", couleur: VEHICULES_PORTEURS.bleu },
      { id: "trou", type: "ouverture" },
      { id: "porte", type: "porte" },
      // ⚠️ Un hexadécimal, pas un nom de couleur : `"rouge"` était passé tel
      // quel à Three.js, qui ne le connaît pas et rendait l'homme en BLANC.
      // Le seul acteur humain du tutoriel était donc désaturé, c'est-à-dire
      // habillé comme un figurant, dans un jeu où la saturation dit « ceci
      // compte ».
      { id: "homme", type: "pieton", couleur: VETEMENTS.acteur },
    ],
    porteur: "porte",
    pose(te, vu) {
      const z = -28;
      // Repérée à temps : il ne descend pas. S'il avait déjà un pied dehors,
      // il le rentre. C'est ce que fait quelqu'un qui entend une voiture.
      const calme = apaise(vu, te);
      // ⭐ LE GESTE, EN TROIS TEMPS. Elle se déverrouille et s'entrouvre d'un
      // coup sec, elle marque un temps d'arrêt, puis quelqu'un la POUSSE en
      // grand et elle dépasse légèrement avant de se caler. C'est le temps
      // d'arrêt du milieu qui la rend crédible, et c'est lui qui laisse
      // comprendre qu'on a le droit de toucher avant qu'il soit trop tard.
      const a = entre(1.9, 2.3, te) * 0.5 + elan(3.5, 4.5, te) * 0.66;
      const sorti = entre(4.5, 5.6, te) * (1 - calme);
      return {
        gare: { x: X_STATIONNE, z, cap: 0 },
        // La cavité sombre, plaquée sur le flanc : la portière fermée la
        // couvre exactement, et l'ouverture la révèle.
        trou: { x: X_STATIONNE - 0.897, z: z - 0.1, cap: 0, visible: true },
        // La charnière est à l'AVANT de la portière : elle s'ouvre donc vers
        // la route, et sa face extérieure se tourne vers nous en prenant le
        // soleil. C'est ce qui la rend lisible de trente mètres.
        // ⚠️ Elle est posée au SOL : toutes ses cotes en hauteur vivent dans
        // sa géométrie, sinon `poser()` écrase le pivot (bug du 10/08).
        porte: { x: X_STATIONNE - 0.95, z: z - 0.62, cap: -a, visible: true },
        homme: {
          x: X_STATIONNE - 1.0 - sorti * 1.9,
          z: z - 1.0,
          cap: -1.4 + sorti * 0.5,
          visible: te > 4.4 && sorti > 0.02,
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
      { id: "velo", type: "velo", couleur: VEHICULES_PORTEURS.jaune },
      { id: "camionnette", type: "camion", couleur: 0xd9d2c4 },
    ],
    porteur: "velo",
    pose(te, vu) {
      const z = -60 - VELO.v * te;
      // Repéré à temps : il se déporte quand même (c'est son droit et c'est
      // la leçon), mais d'un tiers seulement. On a levé le pied, il a la place.
      // Le regard par-dessus l'épaule, en deux temps : la TÊTE part la
      // première, le buste la suit avec un retard de quinze centièmes. C'est
      // l'ordre naturel, et c'est lui qui rend le geste lisible.
      // ⚠️ Amplitudes larges (1,05 + 0,48 rad, soit ~88°) : à quatorze mètres,
      // un buste qui tourne de trente degrés fait quatre pixels de silhouette.
      // On exagère, sinon la scène n'existe pas.
      const regard = (entre(2.2, 2.7, te) - entre(3.6, 4.0, te)) * 1.05;
      const buste = (entre(2.35, 2.87, te) - entre(3.75, 4.17, te)) * 0.48;

      // 🔴 LE BUG DU 10/08 : « le vélo pivote sur lui-même ».
      //
      // Son cap était ÉCRIT à la main (`tete * 0.5 - deboite * 0.12`), donc il
      // tournait de trente degrés au moment du coup d'œil, alors que sa
      // position ne bougeait pas d'un centimètre. Un objet qui change de cap
      // sans changer de trajectoire, c'est exactement la définition d'une
      // toupie. Et l'erreur était structurelle : un cap ne s'écrit pas, il SE
      // DÉDUIT du déplacement.
      //
      // Ici on dérive la trajectoire, et le cap tombe tout seul : quatre
      // degrés quand il glisse vers l'axe, seize quand il déboîte. Le regard
      // n'y touche plus du tout — c'est bien ça qu'on voulait faire lire.
      const h = 0.07;
      const dxdt = (xVelo(te + h, vu) - xVelo(te - h, vu)) / (2 * h);
      const cap = Math.atan2(-dxdt, VELO.v);
      // Le braquage est le cap qu'il AURA dans trois dixièmes : une roue avant
      // tourne toujours avant le vélo.
      const apres = (xVelo(te + 0.38, vu) - xVelo(te + 0.24, vu)) / 0.14;
      return {
        velo: {
          x: xVelo(te, vu),
          z,
          cap,
          // Un cycliste se penche DANS sa courbe. Sans ce roulis, un vélo qui
          // change de file glisse latéralement comme un palet.
          roulis: cap * 0.8,
          braquage: Math.atan2(-apres, VELO.v),
          regard,
          buste,
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
      // Désaturé exprès : la fausse alerte ne doit RIEN avoir d'un porteur.
      { id: "passant", type: "pieton", couleur: VETEMENTS.adulte[1] },
      { id: "bac", type: "poubelle" },
    ],
    porteur: "passant",
    pose(te) {
      // Pas de dénouement : cette scène n'est jamais dangereuse.
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
      {
        id: "sortante",
        type: "voiture",
        couleur: VEHICULES_PORTEURS.rouge,
        feux: true,
      },
    ],
    porteur: "sortante",
    pose(te, vu) {
      // Repérée à temps : elle ne sort pas, elle attend son tour, feux de
      // stop allumés. C'est ce que fait un conducteur qui voit qu'on arrive.
      const calme = apaise(vu, te);
      // Le petit à-coup : elle avance de quatre-vingt-dix centimètres, elle
      // s'arrête, elle repart. C'est ce faux départ qui dit « il y a
      // quelqu'un dedans et il va y aller ».
      const acoup = entre(3.4, 4.2, te) * 0.9;
      const sortie = entre(6.5, 8.6, te) * (1 - calme);
      // 🔴 LE BUG DU 10/08 : « elle semble sortir directement d'un immeuble ».
      // Elle démarrait à x = 6,9, c'est-à-dire EN PLEIN SUR LE TROTTOIR,
      // devant une façade pleine. Le joueur voyait qu'elle allait le gêner,
      // mais il ne pouvait pas comprendre d'où elle venait — et une leçon
      // qu'on ne peut pas expliquer ne s'apprend pas.
      //
      // Il y a désormais une VRAIE rue transversale à cet endroit (cf.
      // `CARREFOURS` dans rue.js) : chaussée, bordures, trottoirs, immeubles
      // en enfilade. Elle attend derrière sa ligne de « cédez le passage »,
      // à huit mètres dans la rue perpendiculaire, et elle sort par la
      // chaussée. Plus aucune roue sur un trottoir.
      // ⚠️ La trajectoire est écrite en clair, pas intégrée à partir du cap :
      // un cap qui revient à zéro ramenait la voiture à son point de départ.
      const x = 8.2 - acoup * 0.9 - sortie * 7.5;
      return {
        sortante: {
          x,
          z: -213 - acoup * 0.55 - sortie * 9,
          // ⚠️ 1,25 rad (72°) : à soixante-dix mètres, ce qui distingue cette
          // voiture d'une voiture garée n'est ni sa couleur ni ses feux,
          // c'est sa SILHOUETTE en travers. Elle sort d'une perpendiculaire,
          // donc elle montre presque tout son flanc, et c'est ce qui la rend
          // repérable six secondes à l'avance.
          cap: 1.25 * (1 - sortie), // braquée vers la route, puis alignée
          stop: te < 6.4 || calme > 0.3, // allumés tant qu'elle attend
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
      { id: "gamin", type: "enfant", couleur: VETEMENTS.enfant[0] },
      { id: "copain", type: "enfant", couleur: VETEMENTS.enfant[1] },
    ],
    porteur: "gamin",
    pose(te, vu) {
      // Repéré à temps : il s'arrête au caniveau, et il tourne enfin la tête
      // vers la route. C'est le seul dénouement où le danger REGARDE le
      // joueur, et c'est voulu : c'est la scène la plus difficile du jeu.
      const calme = apaise(vu, te);
      const bord = entre(1.6, 2.6, te) * 0.75; // il s'avance au caniveau
      const course = entre(3.2, 5.0, te) * (1 - calme);
      // ⚠️ 5,9 et pas 6,7 : le champ horizontal fait 36°, donc tout ce qui est
      // à cinq mètres sur le côté sort du cadre en dessous de seize mètres.
      // Chaque décimètre gagné vers la chaussée est du temps de lecture en
      // plus — et c'est là qu'un enfant attend, de toute façon, avant de
      // traverser.
      const x = 5.9 - bord - course * 13.0;
      return {
        gamin: {
          x,
          y: HAUT(x),
          z: -250 + course * 1.2,
          // Tourné vers l'autre trottoir depuis le début. Il ne regarde
          // jamais la route, pas même en s'élançant. Sauf s'il nous a
          // entendus ralentir : alors il se tourne vers nous et il attend.
          cap: Math.PI / 2 - course * 0.2 - calme * 0.62,
          regard: -calme * 0.5,
          court: course > 0.02,
        },
        copain: {
          // 🔴 RAMENÉ DE -6,3 À -5,7 LE 10/08 — « l'enfant on le voit à
          // peine ». À trente-six mètres, huit mètres de décalage latéral
          // mettent le copain à douze degrés de l'axe, c'est-à-dire dans le
          // tiers extérieur du cadre, là où personne ne regarde en conduisant.
          x: -5.7,
          // ⚠️ 42 cm de saut : à trente mètres, quinze centimètres font trois
          // pixels. Le seul signe de la scène doit s'attraper du coin de
          // l'œil, donc il s'exagère franchement.
          y: 0.15 + Math.abs(Math.sin(te * 3.6)) * 0.42,
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
