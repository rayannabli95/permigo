// ═══════════════════════════════════════════════════════════════
// Les décors du Mode Pilote.
//
// Les 22 scènes (habitacle, carrefour, giratoire, nuit, pluie…) sont toutes
// des images (Art Bible 2.0, 05/08/2026). Le dernier lot dessiné en CSS pur,
// hérité du prototype `mockups/moteur-pilote`, a été retiré le 06/08/2026 :
// aucune scène ne reste à convertir.
//
// À côté de ces scènes vivent les PIÈCES dessinées en SVG (`pilote-pieces.js`) :
// le bloc compteurs, les pédales, le levier. Une scène plante un lieu, une
// pièce montre un objet. Le même champ `visual` désigne les deux.
//
// Et il y a les PHOTOS. Règle posée par Rayan le 30/07/2026 devant les
// voitures dessinées de Codex (« ça fait tellement cheap ») :
//
//   on DESSINE ce qui change d'état, on PHOTOGRAPHIE ce qu'on regarde.
//
// Le tableau de bord, les voyants, les pédales changent d'état à l'infini :
// le dessin s'y décline sans une image par variante. Un pneu, un compartiment
// moteur, une carrosserie ne changent pas d'état : dessinés au trait ils font
// toujours cheap, quel que soit l'agent qui les dessine.
//
// Ordre de priorité : photo, puis pièce dessinée, puis décor CSS.
// ═══════════════════════════════════════════════════════════════
import { estUnePiece, renderPiece } from "@/components/eleve/pilote-pieces.js";

/**
 * Les photos du Mode Pilote, pour ce qu'on regarde sans le transformer.
 *
 * ⚠️ Le nom du fichier porte sa DATE. Le cache de l'app garde une image à vie
 * sous le même nom : remplacer une photo sans changer son nom laisse l'ancienne
 * chez tous ceux qui ont déjà installé.
 */
const PHOTOS = {
  "photo-pneu": {
    src: "/pilote/pneu-use-2026-08-02.webp",
    alt: "Le pneu avant d'une voiture, vu de près",
  },
  "photo-capot": {
    src: "/pilote/capot-ouvert-2026-08-02.webp",
    alt: "Le compartiment moteur d'une voiture, capot ouvert",
  },
};

/**
 * Les scènes illustrées, pour les missions « Balayer ».
 *
 * Une photo se regarde, une illustration se FOUILLE : le balayage demande à
 * l'élève de trouver trois objets dans une rue, et un objet ne se trouve pas
 * s'il est écrit. Ces scènes gardent donc leurs couleurs pleines, sans le
 * virage nuit des photos, sinon les indices se noient dans le gris.
 *
 * ⚠️ Toutes en 4/3, et la scène est calée en 4/3 pour ces missions : les
 * indices sont posés en pourcentage de la SCÈNE, et un `object-fit: cover` sur
 * une boîte d'un autre format les décalerait de l'objet qu'ils désignent.
 */
const ILLUSTRATIONS = {
  "rue-bus": {
    src: "/pilote/rue-bus-2026-08-02.webp",
    alt: "Une rue au coucher du soleil, un bus arrêté le long du trottoir",
  },
  "rue-ballon": {
    src: "/pilote/rue-ballon-2026-08-02.webp",
    alt: "Une rue pavillonnaire au coucher du soleil, un ballon sur la chaussée",
  },
  "tour-voiture": {
    src: "/pilote/tour-voiture-2026-08-02.webp",
    alt: "Une voiture garée, vue de trois quarts avant",
  },
};

/**
 * Les décors de rue générés (Art Bible 2.0, 05/08/2026) : un monde glossy
 * plastique façon jouet premium, calé sur la voiture et l'habitacle
 * PermiGo verrouillés. Détail complet : `docs/ART_BIBLE_CERTIF_2026.md`.
 *
 * ⚠️ Seuls les décors dont AUCUNE mission ne pose de zone tactile ou de
 * tracé en pourcentage dessus sont ici. Un décor où l'élève doit taper une
 * zone précise (mode `spot`), tracer un chemin (`trajectory`) ou faire
 * glisser une pièce (`placement`) reste en CSS : ses coordonnées sont
 * calées sur l'ancien schéma, un nouveau décor les décalerait toutes.
 *
 * Exception : `seat-profile` EST une mission `placement` (le siège qu'on
 * fait glisser), mais ses zones ont été recalées en même temps que le décor
 * (voir `missions-pilote.js`, mission `c1c-siege`), donc les deux avancent
 * ensemble plutôt que l'un sans l'autre.
 *
 * Deuxième exception (05/08, plus tard) : `cockpit` et `intersection` ont
 * des missions `spot` (zones de « Trouver »), mais dans l'autre sens que le
 * siège : au lieu de recaler les zones sur un nouveau décor, le décor a été
 * COMPOSÉ pour tomber sur les zones qui existaient déjà (commodo gauche visible
 * là où `c1a-commodos` pose sa zone, voiture garée + ouverture entre les
 * bâtiments là où `c2f-indices`/`c3g-masque` posent les leurs). Possible ici
 * parce que les zones restent des cadres en pointillés (jamais un repère
 * précis à quelques pixels près) : `missions-pilote.js` n'a pas bougé.
 *
 * Troisième vague (05/08, fin de session) : `bend`, `brouillard-file`,
 * `exterior`, `insertion`, `mirror`, `night`, `overtake-empty`,
 * `overtake-top`, `overtake-top-libre`, `voie-garee`. Même méthode que
 * `cockpit`/`intersection` (décor composé pour tomber sur des zones
 * inchangées), sauf que ces dix-là avaient déjà été générés lors de la
 * session initiale mais jamais branchés : `night`, `brouillard-file`,
 * `exterior`, `overtake-empty`, `voie-garee` étaient bons tels quels.
 * `mirror`, `insertion` et `overtake-top` ont eu besoin d'une deuxième passe
 * (voir l'historique de la bible : miroir qui montrait l'extérieur de la
 * voiture au lieu du poste de conduite, panneau « SORTIE » sur une mission
 * qui fait ENTRER sur l'autoroute, mesure « 1 MÈTRE D'ÉCART » incrustée qui
 * donnait la réponse d'une mission de tracé).
 */
/**
 * ⚠️ Quatrième vague (06/08/2026) : les quatre décors des missions « Placer »
 * ont été REFAITS en vue de dessus. Ceux du 05/08 étaient vus du poste de
 * conduite, et une mission de placement demande de poser une voiture sur une
 * route : les deux tiers du bas de ces images sont l'habitacle, donc les
 * cibles tombaient sur le tableau de bord. Deux d'entre eux contenaient en
 * plus la voiture du joueur, alors que la voiture du joueur EST la pièce
 * qu'on fait glisser : l'élève en voyait deux.
 *
 * Les quatre nouveaux (`-2026-08-06`) sont en vue de dessus stricte, sans
 * aucune voiture du joueur, avec la voie de circulation laissée vide pour que
 * les cibles se posent sur du bitume. Nom de fichier redaté : les `-08-05`
 * sont déjà partis en prod, réutiliser leur nom laisserait l'ancienne image
 * chez qui a déjà installé.
 */
const DECORS = {
  bend: { alt: "Une route qui amorce un virage, vue à travers le pare-brise" },
  // Le brouillard vu du poste de conduite. C'est l'image qui servait à
  // `brouillard-file` avant que celui-ci passe en vue de dessus : elle reste
  // la bonne pour la question « tu ne vois plus à cinquante mètres, tu
  // allumes quoi ? », qui se posait jusque-là sur un décor de PLUIE, une rue
  // nette et lumineuse. Une question sur la visibilité a besoin d'une scène
  // où l'on ne voit pas.
  brouillard: {
    alt: "Une route noyée dans le brouillard, vue à travers le pare-brise",
    src: "brouillard-file-2026-08-05",
  },
  "brouillard-file": {
    alt: "Vue de dessus d'une route dans le brouillard, une voiture devant, feux rouges allumés",
    src: "brouillard-file-2026-08-06",
  },
  "city-light": { alt: "Un feu tricolore isolé, la nuit, en ville" },
  cockpit: {
    alt: "Le poste de conduite, volant et commodos de part et d'autre",
  },
  emergency: {
    alt: "Un piéton qui surgit soudainement devant la voiture",
    src: "emergency-2026-08-05b",
  },
  exterior: {
    alt: "La voiture vue de trois quarts avant, un pneu affaissé",
    // Seul décor en 4/3 : sans ces dimensions, le navigateur réserve la place
    // d'une image 3/2 et la page saute de 12 % de hauteur au chargement.
    width: 1600,
    height: 1195,
  },
  gps: { alt: "Une sortie d'autoroute déjà passée, vue dans le rétroviseur" },
  insertion: {
    alt: "Vue de dessus d'une entrée d'autoroute, deux espaces serrés et un large entre les voitures",
    src: "insertion-2026-08-06",
  },
  intersection: {
    alt: "Un carrefour au crépuscule, une voiture garée et une rue qui débouche",
  },
  mirror: {
    alt: "Le poste de conduite, un motard visible dans l'angle mort à gauche",
  },
  motorway: { alt: "Une insertion sur autoroute avec la circulation qui file" },
  "motorway-shoulder": {
    alt: "La voiture arrêtée en sécurité sur la bande d'arrêt d'urgence",
  },
  night: { alt: "Une route de campagne la nuit, une voiture arrive en face" },
  "overtake-empty": {
    alt: "Une route vide, vue à travers le pare-brise",
  },
  "overtake-top": {
    alt: "Vue de dessus, un cycliste devant la voiture sur une route à deux voies",
  },
  "overtake-top-libre": {
    alt: "Vue de dessus, un cycliste seul sur une route à deux voies",
    src: "overtake-top-libre-2026-08-06",
  },
  // Le premier jet du 05/08 avait un DEHORS photoréaliste (rue photo, piéton
  // photo, brume de tunnel) derrière un habitacle jouet : repéré en jouant
  // les missions en vrai sur téléphone, refait entièrement stylisé le même
  // jour. Suffixe `b` : ce nom de fichier était déjà en prod (#708), le
  // réutiliser aurait laissé l'ancienne image à vie chez qui a déjà installé.
  rain: {
    alt: "Une route sous la pluie, essuie-glaces en mouvement",
    src: "rain-2026-08-05b",
  },
  roundabout: { alt: "Un giratoire avec un panneau cédez le passage" },
  parking: { alt: "Un parking avec des places libres et occupées" },
  tunnel: {
    alt: "L'entrée d'un tunnel, la sortie visible au loin",
    src: "tunnel-2026-08-05b",
  },
  "overtake-oncoming": {
    alt: "Un cycliste devant et une voiture qui arrive en face",
  },
  "seat-profile": {
    alt: "Un habitacle vu de profil, le siège sur son rail, prêt à glisser",
    width: 1600,
    height: 894,
  },
  "voie-garee": {
    alt: "Vue de dessus d'une rue, une file de voitures garées à droite dont une portière ouverte",
    src: "voie-garee-2026-08-06",
  },

  // ── Les six gros plans de commande, en portrait ────────────────────────
  // C'étaient les six derniers dessins vectoriels au milieu de vingt-deux
  // photos jouet, et ils se voyaient. Leurs étiquettes flottaient en plus aux
  // bords de la boîte pendant que le dessin restait au centre : « Embrayage »
  // se posait loin de la pédale d'embrayage (audit joué du 06/08/2026).
  //
  // `vertical: true` = la scène prend l'écran au lieu de tenir dans une boîte
  // de 270 px. Réservé à ces six-là : ce sont des gros plans d'objet, alors
  // qu'une scène de route se regarde en large, à travers le pare-brise. Et
  // surtout AUCUNE des six ne porte de zone à toucher, donc passer en plein
  // cadre ne déplace aucune coordonnée (les zones sont en % de la scène).
  "pedales-manuelle": {
    alt: "Le pied de la voiture, les trois pédales d'une boîte manuelle",
    src: "pedales-manuelle-2026-08-07",
    vertical: true,
  },
  "pedales-auto": {
    alt: "Le pied de la voiture en boîte automatique, deux pédales et un repose-pied à gauche",
    src: "pedales-auto-2026-08-07",
    vertical: true,
  },
  "voyant-moteur": {
    alt: "Le tableau de bord de nuit, un seul témoin allumé en rouge",
    src: "voyant-moteur-2026-08-07",
    vertical: true,
  },
  levier: {
    alt: "Le levier de vitesses d'une boîte manuelle posé dans sa grille",
    src: "levier-2026-08-07",
    vertical: true,
  },
  selecteur: {
    alt: "Le sélecteur d'une boîte automatique, levier posé sur la position D",
    src: "selecteur-2026-08-07",
    vertical: true,
  },
  "compte-tours-bas": {
    alt: "Le compte-tours en gros plan, aiguille basse et zone rouge à droite",
    src: "compte-tours-2026-08-07",
    vertical: true,
  },
};

/** Le décor prend-il l'écran entier ? Sert à basculer la mise en page. */
export function estDecorPlein(visual) {
  return Boolean(DECORS[visual]?.vertical);
}

/**
 * @param {string} visual nom du décor, de la pièce ou de la photo
 * @param {object} [options] réglages passés à la pièce (usure, rapport, niveau)
 */
export function renderArt(visual, options = {}) {
  const illu = ILLUSTRATIONS[visual];
  if (illu) {
    return `<img class="mp-illu" src="${illu.src}" alt="" loading="eager"
      decoding="async" width="1200" height="900" aria-hidden="true">`;
  }
  const photo = PHOTOS[visual];
  if (photo) {
    // `loading="eager"` : la scène est le premier écran de la mission, une
    // image qui arrive après coup ferait sauter la mise en page.
    return `<img class="mp-photo" src="${photo.src}" alt="" loading="eager"
      decoding="async" width="1100" height="825" aria-hidden="true">`;
  }
  const decor = DECORS[visual];
  if (decor) {
    const fichier = decor.src || `${visual}-2026-08-05`;
    // Les portraits sont générés en 768×1376 et se posent en plein cadre.
    if (decor.vertical) {
      return `<img class="mp-decor mp-decor-plein" src="/pilote/decors/${fichier}.webp"
        alt="${decor.alt}" loading="eager" decoding="async"
        width="768" height="1376" aria-hidden="true">`;
    }
    // 1600×1074, la taille réelle des fichiers. La valeur 1067 qui traînait
    // ici décrivait un 3/2 parfait que plus aucun décor n'a.
    return `<img class="mp-decor" src="/pilote/decors/${fichier}.webp"
      alt="${decor.alt}" loading="eager" decoding="async"
      width="${decor.width || 1600}" height="${decor.height || 1074}" aria-hidden="true">`;
  }
  if (estUnePiece(visual)) return renderPiece(visual, options);
  // Aucun décor CSS ne reste : les 22 scènes du Mode Pilote sont toutes en
  // image (voir DECORS ci-dessus). Si ce point est atteint, un `visual` n'est
  // référencé dans aucune des quatre listes (illustration, photo, décor,
  // pièce) : c'est une faute de frappe dans `missions-pilote.js`, pas un cas
  // normal à couvrir.
  console.warn(`[pilote] visual inconnu : "${visual}"`);
  return "";
}
