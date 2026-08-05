// ═══════════════════════════════════════════════════════════════
// Les décors du Mode Pilote.
//
// Des scènes dessinées en CSS pur : l'habitacle, le carrefour, le giratoire,
// la nuit, la pluie… Reprises telles quelles du prototype
// `mockups/moteur-pilote`, elles ne coûtent aucune image à charger.
//
// Le style qui les dessine vit dans `pilote.css`, à côté. Une classe
// `.mp-art-{nom}` porte la mise en scène, les `<span>` portent les pièces.
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
 */
const DECORS = {
  "city-light": { alt: "Un feu tricolore isolé, la nuit, en ville" },
  emergency: {
    alt: "Un piéton qui surgit soudainement devant la voiture",
    src: "emergency-2026-08-05b",
  },
  gps: { alt: "Une sortie d'autoroute déjà passée, vue dans le rétroviseur" },
  motorway: { alt: "Une insertion sur autoroute avec la circulation qui file" },
  "motorway-shoulder": {
    alt: "La voiture arrêtée en sécurité sur la bande d'arrêt d'urgence",
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
};

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
    return `<img class="mp-decor" src="/pilote/decors/${fichier}.webp"
      alt="${decor.alt}" loading="eager" decoding="async"
      width="${decor.width || 1600}" height="${decor.height || 1067}" aria-hidden="true">`;
  }
  if (estUnePiece(visual)) return renderPiece(visual, options);
  if (visual === "cockpit") return artCockpit();
  if (visual === "intersection") return artIntersection();
  if (visual === "roundabout") return artRoundabout();
  if (visual === "bend") return artBend();
  if (visual === "night") return artNight();
  if (visual === "rain") return artRain();
  if (visual === "emergency") return artEmergency();
  if (visual === "gps") return artGps();
  if (visual === "city-light") return artCityLight();
  if (visual === "exterior") return artExterior();
  if (visual === "parking") return artParking();
  if (visual === "mirror") return artMirror();
  if (visual === "overtake") return artOvertake({ cyclist: true });
  if (visual === "overtake-oncoming")
    return artOvertake({ cyclist: true, oncoming: true });
  if (visual === "overtake-empty") return artOvertake({});
  if (visual === "overtake-top") return artOvertakeTop();
  if (visual === "overtake-top-libre") return artOvertakeTop({ joueur: false });
  if (visual === "voie-garee") return artVoieGaree();
  if (visual === "brouillard-file") return artBrouillardFile();
  if (visual === "insertion") return artInsertion();
  if (visual === "motorway") return artMotorway(false);
  if (visual === "motorway-shoulder") return artMotorway(true);
  if (visual === "tunnel") return artTunnel();
  return artCockpit();
}

function artCockpit() {
  return `
    <div class="art-sky"><span class="art-road"></span></div>
    <div class="art-dash">
      <span class="art-dial art-dial-left"></span>
      <span class="art-dial art-dial-right"></span>
      <span class="art-screen">0</span>
    </div>
    <span class="art-stalk art-stalk-left"></span>
    <span class="art-stalk art-stalk-right"></span>
    <div class="art-wheel"><span>PG</span></div>
    <div class="art-pedals"><i></i><i></i><i></i></div>`;
}

function artIntersection() {
  return `
    <div class="art-city-sky"></div>
    <div class="art-building art-building-left"><i></i><i></i><i></i></div>
    <div class="art-building art-building-right"><i></i><i></i><i></i></div>
    <div class="art-main-road"><span></span></div>
    <div class="art-side-road"><span></span></div>
    <div class="art-parked-car"><i></i><b></b></div>
    <span class="art-crosswalk"></span>`;
}

function artRoundabout() {
  return `
    <div class="art-top-road art-top-road-v"></div>
    <div class="art-top-road art-top-road-h"></div>
    <div class="art-roundabout-ring"><span></span></div>
    <span class="art-top-car art-top-car-player"></span>
    <span class="art-top-car art-top-car-other"></span>
    <span class="art-exit-arrow">↗</span>`;
}

function artBend() {
  return `
    <svg class="art-bend-svg" viewBox="0 0 360 260" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#58a06d"/><stop offset="1" stop-color="#284c3a"/></linearGradient>
      </defs>
      <rect width="360" height="260" fill="url(#grass)"/>
      <path d="M132 270 C140 192 57 163 90 48 L280 48 C245 141 292 185 280 270Z" fill="#4a4857"/>
      <path d="M205 270 C211 192 154 154 183 48" fill="none" stroke="#f7e9a1" stroke-width="5" stroke-dasharray="18 14"/>
      <path d="M130 270 C140 192 57 163 90 48M280 270 C292 185 245 141 280 48" fill="none" stroke="#f7f3ff" stroke-width="4"/>
      <circle cx="54" cy="76" r="27" fill="#1d5e3e"/><circle cx="314" cy="105" r="34" fill="#1d5e3e"/>
    </svg>`;
}

function artNight() {
  return `
    <div class="art-night-sky"><i></i><i></i><i></i><i></i></div>
    <div class="art-night-road"><span></span><b></b></div>
    <div class="art-oncoming"><i></i><i></i></div>
    <span class="art-right-edge"></span>
    <div class="art-night-dash"></div>`;
}

function artRain() {
  return `
    <div class="art-rain-sky"></div>
    <div class="art-rain-road"><span></span></div>
    <div class="art-rain-car"><i></i><b></b></div>
    <div class="art-rain-lines">${"<i></i>".repeat(18)}</div>
    <span class="art-wiper art-wiper-left"></span>
    <span class="art-wiper art-wiper-right"></span>`;
}

function artEmergency() {
  return `
    <div class="art-emergency-sky"></div>
    <div class="art-emergency-road"><span></span></div>
    <div class="art-obstacle"><i></i><b>!</b></div>
    <div class="art-player-hood"></div>
    <span class="art-brake-wave art-brake-wave-a"></span>
    <span class="art-brake-wave art-brake-wave-b"></span>`;
}

function artGps() {
  return `
    <div class="art-map-grid"></div>
    <span class="art-map-road art-map-road-main"></span>
    <span class="art-map-road art-map-road-exit"></span>
    <span class="art-map-route"></span>
    <span class="art-map-car">▲</span>
    <span class="art-map-exit">SORTIE</span>
    <div class="art-gps-card"><small>RECALCUL</small><strong>Continue tout droit</strong></div>`;
}

function artCityLight() {
  return `
    <div class="art-light-sky"></div>
    <div class="art-light-city"><i></i><i></i><i></i><i></i></div>
    <div class="art-light-road"><span></span></div>
    <div class="art-traffic-light"><i></i><i class="is-red"></i><i></i></div>
    <div class="art-player-hood"></div>`;
}

function artExterior() {
  return `
    <div class="art-garage-grid"></div>
    <div class="art-car-side">
      <span class="art-car-window"></span>
      <span class="art-car-door"></span>
      <i class="art-car-wheel art-car-wheel-left"></i>
      <i class="art-car-wheel art-car-wheel-right is-flat"></i>
      <b class="art-car-mirror"></b>
      <small class="art-car-plate">PG-2026</small>
    </div>
    <span class="art-floor-shadow"></span>`;
}

// Vue de dessus d'un créneau. Tout est posé en POURCENTAGE, pas en pixels :
// les zones tactiles des missions sont elles aussi en pourcentage de la scène,
// et un décor calé en pixels les décalerait dès que la largeur change.
function artParking() {
  return `
    <div class="art-pk-road"><span></span></div>
    <div class="art-pk-kerb"></div>
    <span class="art-pk-car art-pk-car-a"></span>
    <span class="art-pk-slot"></span>
    <span class="art-pk-car art-pk-car-b"></span>
    <span class="art-pk-car art-pk-player"><i></i></span>`;
}

// Le poste de conduite vu par le conducteur : les deux miroirs, et la vitre
// latérale gauche où passe un deux-roues qu'aucun miroir ne montre. Ajouté
// pour le chapitre 2 (prendre l'information avant de bouger).
function artMirror() {
  return `
    <div class="art-mr-cabin"></div>
    <div class="art-mr-window">
      <span class="art-mr-far"></span>
      <span class="art-mr-bike"><i></i><b></b></span>
    </div>
    <div class="art-mr-inner"><span></span><i></i></div>
    <div class="art-mr-side"><span></span></div>
    <div class="art-mr-dash"><i></i><i></i></div>`;
}

// Route à double sens vue du conducteur. Trois variantes qui partagent le même
// style : la route nue, la route avec un cycliste, et la route avec le cycliste
// ET la voiture qui arrive en face. Cette dernière change la bonne réponse,
// donc elle doit changer le décor : l'élève ne peut pas décider sur une scène
// qui ne montre pas ce dont on lui parle.
function artOvertake({ cyclist, oncoming }) {
  return `
    <div class="art-ov-sky"></div>
    <div class="art-ov-field"></div>
    <div class="art-ov-road"><span class="art-ov-center"></span></div>
    ${oncoming ? `<span class="art-ov-oncoming"><i></i><i></i></span>` : ""}
    ${cyclist ? `<span class="art-ov-cyclist"><i></i><b></b></span>` : ""}
    <div class="art-ov-hood"></div>`;
}

// Le même dépassement, mais vu de dessus. En vue subjective les trois
// trajectoires se superposent et ne veulent plus rien dire : l'écart latéral
// y vaut quelques pixels. De dessus, un mètre se voit.
//
// `joueur: false` retire la voiture du joueur du décor. C'est la variante des
// missions de placement : là, la voiture du joueur EST la pièce qu'on déplace,
// et la laisser dans le décor en afficherait deux.
function artOvertakeTop({ joueur = true } = {}) {
  return `
    <div class="art-ot-verge"></div>
    <div class="art-ot-road"><span class="art-ot-center"></span></div>
    <span class="art-ot-cyclist"><i></i></span>
    ${joueur ? `<span class="art-ot-player"><i></i></span>` : ""}`;
}

// Une voie urbaine vue de dessus, avec une file de voitures garées le long du
// trottoir de droite. L'une d'elles a sa portière entrouverte : c'est le
// danger que la place dans la voie doit anticiper.
//
// Vue de dessus, encore une fois parce qu'une marge latérale ne se juge pas en
// vue subjective : à hauteur d'œil, un mètre à droite et trois mètres à droite
// se ressemblent.
function artVoieGaree() {
  return `
    <div class="art-vg-trottoir art-vg-trottoir-gauche"></div>
    <div class="art-vg-trottoir art-vg-trottoir-droit"></div>
    <div class="art-vg-route"><span class="art-vg-axe"></span></div>
    <span class="art-vg-garee art-vg-garee-a"></span>
    <span class="art-vg-garee art-vg-garee-b"><i></i></span>`;
}

// Une file dans le brouillard, vue de dessus. Le voile s'épaissit vers le
// haut : au-delà, on ne voit plus rien. La voiture de devant est encore
// visible, ce qui donne l'échelle de la distance à garder.
function artBrouillardFile() {
  return `
    <div class="art-bf-route"><span class="art-bf-bord-gauche"></span><span class="art-bf-bord-droit"></span></div>
    <span class="art-bf-devant"><i></i></span>
    <div class="art-bf-voile"></div>`;
}

// L'insertion sur une voie rapide, vue de dessus, la circulation de gauche à
// droite. Trois voitures sur la voie de droite laissent trois espaces de
// tailles différentes, et la bretelle se pince vers son point de raccordement.
function artInsertion() {
  return `
    <div class="art-in-route"><span class="art-in-ligne"></span></div>
    <div class="art-in-bretelle"></div>
    <span class="art-in-voiture art-in-voiture-a"></span>
    <span class="art-in-voiture art-in-voiture-b"></span>
    <span class="art-in-voiture art-in-voiture-c"></span>`;
}

// Voie rapide vue de dessus, la circulation va de gauche à droite. Vue de
// dessus parce que l'insertion est une histoire d'espace entre deux voitures,
// et qu'un espace ne se juge pas en vue subjective.
//
// `shoulder` remplace la voie d'insertion par la bande d'arrêt d'urgence et
// sa glissière : une mise en sécurité se joue derrière cette glissière, elle
// doit donc être dans la scène.
function artMotorway(shoulder) {
  return `
    <div class="art-mw-road"><span class="art-mw-lane"></span></div>
    ${
      shoulder
        ? `<div class="art-mw-shoulder"><i></i></div>`
        : `<div class="art-mw-ramp"></div>`
    }
    <span class="art-mw-car art-mw-car-a"></span>
    ${shoulder ? "" : `<span class="art-mw-car art-mw-car-b"></span>`}
    <span class="art-mw-player"><i></i></span>`;
}

// L'entrée d'un tunnel, vue du conducteur : la lumière du jour, la bouche
// noire, et la rampe de lampes qui s'enfonce.
function artTunnel() {
  return `
    <div class="art-tn-sky"></div>
    <div class="art-tn-rock"></div>
    <div class="art-tn-mouth">
      <span class="art-tn-lamps">${"<i></i>".repeat(6)}</span>
      <span class="art-tn-inner-road"></span>
    </div>
    <div class="art-tn-road"><span></span></div>
    <div class="art-ov-hood"></div>`;
}
