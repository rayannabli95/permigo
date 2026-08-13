// Tous les réglages de l'expérience, à UN SEUL endroit.
//
// 🔴 RIEN ICI N'EST UNE LOI DU PRODUIT. Ce sont des SEUILS DE TEST, posés à la
// main avant d'avoir vu un seul élève jouer. On va probablement en jeter la
// moitié après les dix premiers. Le rôle de ce fichier est de rendre ça
// indolore : on change un chiffre, on relance, on ne touche à aucun moteur.
//
// Trois façons de régler, de la plus faible à la plus forte :
//   1. les valeurs ci-dessous
//   2. ce qui a été enregistré dans le navigateur (le panneau de réglages)
//   3. l'adresse : #/slice?regard=gyro&action=designer&retour=minimal
//
// L'adresse gagne toujours : pendant un test terrain on passe d'une version à
// l'autre en envoyant un lien, sans rien réinstaller.

const CLE = "permigo.slice.reglages";

export const DEFAUTS = {
  // ── TEST 1 · comment on regarde ────────────────────────────────────────
  // swipe    : le pouce glisse à l'horizontale
  // gyro     : on tourne physiquement le téléphone
  // hybride  : le téléphone donne la base, le pouce va plus loin
  regard: "swipe",

  // ── TEST 2 · comment on ralentit ───────────────────────────────────────
  // freinBas : maintenir dans le bandeau du bas
  // maintien : maintenir n'importe où (un appui qui ne glisse pas)
  // designer : aucune pédale, on touche le danger et la voiture s'adapte
  action: "freinBas",

  // ── TEST 3 · ce qu'on raconte ──────────────────────────────────────────
  // toujours : une phrase après chaque scène
  // erreur   : une phrase seulement quand ça se passe mal
  // minimal  : presque aucun texte, l'indice surligné et on enchaîne
  retour: "toujours",

  // ── Le geste du regard ─────────────────────────────────────────────────
  // ⚠️ C'est peut-être l'identité produit tout entière. À traiter comme la
  // variable la plus importante du banc d'essai, pas comme un réglage de
  // confort.
  angleRegardMax: 1.15, // rad · ~66°, au-delà on regarde sa propre portière
  lissageRegard: 11, // plus haut = la tête suit plus sec
  // Le regard revient-il tout seul au centre quand on lâche ?
  // 0 = il reste où on l'a laissé · 1 = il revient vite.
  // ⭐ Question ouverte : un regard qui ne revient pas est plus permissif,
  // mais il laisse le joueur rouler la tête tournée, ce qui n'existe pas.
  rappelRegard: 2.4,
  swipeSensibilite: 0.0052, // rad par pixel parcouru
  gyroGain: 2.4, // 1° de téléphone = 2,4° de tête
  gyroZoneMorte: 1.6, // degrés ignorés autour du zéro, sinon ça tremble
  gyroAmplitude: 28, // degrés de téléphone pour l'amplitude complète
  hybridePartGyro: 0.6, // en hybride, ce que le téléphone fournit

  // ── La preuve d'observation ────────────────────────────────────────────
  // ⚠️ Rayan, 09/08 : « ne les grave pas comme des vérités scientifiques ».
  // Ce sont des hypothèses. Le test doit nous dire si 250 ms sur un téléphone
  // veut dire quoi que ce soit.
  seuilObservationInitial: {
    objet: 0.25, // une ombre, une roue, un ballon
    intention: 0.4, // une posture, un regard de piéton
    vitesse: 0.7, // ⭐ deux prises minimum : une vitesse se dérive
    feu: 0.2, // un clignotant, un feu stop
  },
  // ⭐ Le seuil de la preuve PAR RÉACTION. Un téléphone n'a pas de profondeur
  // de regard : quand l'indice est droit devant mais loin (les feux stop deux
  // véhicules plus loin), aucune direction de regard ne prouve qu'on l'a lu.
  // La seule preuve possible est le DÉLAI entre son apparition et le geste.
  // Découvert en construisant le banc, pas en écrivant le document.
  delaiReactionInitial: 1.6,
  // Un élément compte comme « dans le champ » s'il est dans cette fraction
  // centrale du cadre. À 1, le coin de l'écran compterait comme regardé.
  champUtile: 0.82,
  // Regarder À TRAVERS la camionnette ne vaut rien. Coupable de désactiver ce
  // test : on croit mesurer un regard, on mesure un cap.
  testerOcclusion: true,
  // En dessous, on n'a pas tourné la tête, on a bougé les yeux.
  regardMinimum: 0.3, // rad · ~17°

  // ── Le ralentissement ──────────────────────────────────────────────────
  freinageMaintien: 0.8, // force appliquée par un maintien
  bandeauFrein: 0.34, // fraction basse de l'écran, version freinBas
  maintienDelai: 0.13, // s avant qu'un appui immobile devienne un frein
  maintienTolerance: 20, // px de glissement encore tolérés
  // Version « designer » : ce que fait la voiture quand le danger est désigné.
  designerFreinage: 0.85,

  // ── Le retour ──────────────────────────────────────────────────────────
  dureeConsequence: 1.6, // s de ralenti après une erreur
  dureePhrase: 2.4, // s d'affichage d'une phrase
  surlignerIndice: true, // l'anneau sur ce qu'il n'a pas vu
  tempoRalenti: 0.28, // vitesse du temps pendant la conséquence

  // ── Les seuils d'ANALYSE ───────────────────────────────────────────────
  // 🔴 Ceux-là ne changent rien au jeu. Ils servent à lire les résultats, et
  // c'est justement pour ça qu'ils doivent rester visibles et discutables.
  deltaExpositionAttendu: 0.4, // s de marge gagnée entre exposition 1 et 2
  freinageSterileMax: 0.25, // part de freinages sur scènes sans danger
  elevesQuiComprennent: 7, // sur 10, sans tutoriel
  margeAnticipationBonne: 1.0, // s ; au-delà, on considère qu'il a anticipé

  // ── Le déroulé du banc d'essai ─────────────────────────────────────────
  // Les trois familles, puis la scène de transfert. Voir scenes.js.
  serie: ["camionnette", "cycliste", "freinage"],
  // ⭐ Après ce nombre de manches, une scène JAMAIS VUE tombe sans prévenir.
  // C'est la seule mesure qui sépare la mémoire de l'apprentissage.
  mancheAvantTransfert: 3,
  qualite: "auto",
};

// Les réglages qui définissent une VERSION de l'expérience. Ce sont eux qu'on
// écrit dans chaque enregistrement : sans ça, on compare des élèves qui n'ont
// pas joué au même jeu.
export const AXES = ["regard", "action", "retour"];

export const CHOIX = {
  regard: [
    ["swipe", "Le pouce glisse"],
    ["gyro", "Je tourne le téléphone"],
    ["hybride", "Téléphone puis pouce"],
  ],
  action: [
    ["freinBas", "Maintenir en bas"],
    ["maintien", "Maintenir n'importe où"],
    ["designer", "Toucher le danger"],
  ],
  retour: [
    ["toujours", "Une phrase à chaque fois"],
    ["erreur", "Une phrase si erreur"],
    ["minimal", "Presque aucun texte"],
  ],
};

// Un nom court qui identifie la version jouée. Sert d'étiquette dans les
// enregistrements et dans le nom du fichier exporté.
export const versionCourte = (r) => `${r.regard}-${r.action}-${r.retour}`;

function depuisAdresse() {
  // Le hash peut porter ses propres paramètres (#/slice?regard=gyro) et
  // l'adresse aussi (?regard=gyro sur un banc d'essai). On lit les deux.
  const morceaux = [location.search, location.hash.split("?")[1] || ""];
  const p = new URLSearchParams();
  for (const m of morceaux)
    for (const [k, v] of new URLSearchParams(m)) p.set(k, v);
  const out = {};
  for (const [cle, valeur] of p) {
    if (!(cle in DEFAUTS)) continue;
    const ref = DEFAUTS[cle];
    if (typeof ref === "number") {
      const n = Number(valeur);
      if (Number.isFinite(n)) out[cle] = n;
    } else if (typeof ref === "boolean") out[cle] = valeur !== "0";
    else if (typeof ref === "string") out[cle] = valeur;
  }
  return out;
}

function depuisMemoire() {
  try {
    return JSON.parse(localStorage.getItem(CLE) || "{}") || {};
  } catch {
    return {};
  }
}

export function lireReglages() {
  const r = { ...DEFAUTS, ...depuisMemoire(), ...depuisAdresse() };
  // Les seuils d'observation se fusionnent champ par champ : régler un seul
  // ne doit pas effacer les trois autres.
  r.seuilObservationInitial = {
    ...DEFAUTS.seuilObservationInitial,
    ...(r.seuilObservationInitial || {}),
  };
  return r;
}

export function ecrireReglages(patch) {
  const actuel = depuisMemoire();
  const suivant = { ...actuel, ...patch };
  try {
    localStorage.setItem(CLE, JSON.stringify(suivant));
  } catch {
    /* navigation privée : tant pis, l'adresse suffit */
  }
  return lireReglages();
}

export function oublierReglages() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
}
