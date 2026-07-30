/**
 * Contrat d'une mission Mode Pilote.
 *
 * Ce fichier ne dessine rien et ne connaît aucune mission en particulier. Il
 * refuse une donnée mal formée avec un message lisible, pour qu'une erreur de
 * contenu se voie à l'écriture de la mission et pas trois écrans plus tard.
 */

export const MISSION_MODES = Object.freeze([
  "spot",
  "decision",
  "sequence",
  "trajectory",
  "diagnostic",
  "dosage",
]);

export const ASSET_FAMILIES = Object.freeze([
  "driving", // lot 1 : pédales, pieds, sélecteur, levier
  "dashboard", // lot 2 : compteurs, voyants, compte-tours
  "vehicle", // lot 3 : voiture, pneu, feux, capot
]);

export const ANSWER_KINDS = Object.freeze([
  "choice", // l'élève choisit une phrase
  "target", // l'élève désigne un objet de la scène
]);

export const TRANSMISSIONS = Object.freeze(["manual", "automatic"]);

/** Une mission prépare, elle ne certifie pas. Ces mots sont interdits. */
const MOTS_INTERDITS = [
  "compétence validée",
  "compétence maîtrisée",
  "maîtrisée",
  "certifiée",
  "certification",
  "validée",
];

const CHAMPS_TEXTE_BEAT = ["prompt", "hint", "retry", "success", "why"];

class MissionSchemaError extends Error {
  constructor(chemin, probleme) {
    super(`Mission invalide — ${chemin} : ${probleme}`);
    this.name = "MissionSchemaError";
    this.chemin = chemin;
  }
}

function exigeTexte(valeur, chemin, longueurMin = 3) {
  if (typeof valeur !== "string" || valeur.trim().length < longueurMin) {
    throw new MissionSchemaError(chemin, `texte manquant ou trop court`);
  }
  const bas = valeur.toLowerCase();
  const interdit = MOTS_INTERDITS.find((mot) => bas.includes(mot));
  if (interdit) {
    throw new MissionSchemaError(
      chemin,
      `contient « ${interdit} » alors qu'une mission ne certifie rien`,
    );
  }
}

function exigePourcentage(valeur, chemin) {
  if (typeof valeur !== "number" || Number.isNaN(valeur)) {
    throw new MissionSchemaError(chemin, "doit être un nombre");
  }
  if (valeur < 0 || valeur > 100) {
    throw new MissionSchemaError(chemin, "doit tenir entre 0 et 100");
  }
}

function validerAsset(asset, chemin) {
  if (!asset || typeof asset !== "object") {
    throw new MissionSchemaError(chemin, "doit être un objet");
  }
  if (!ASSET_FAMILIES.includes(asset.family)) {
    throw new MissionSchemaError(
      `${chemin}.family`,
      `inconnue (attendu : ${ASSET_FAMILIES.join(", ")})`,
    );
  }
  exigeTexte(asset.type, `${chemin}.type`, 2);
  if (!asset.anchor || typeof asset.anchor !== "object") {
    throw new MissionSchemaError(`${chemin}.anchor`, "manquant");
  }
  exigePourcentage(asset.anchor.x, `${chemin}.anchor.x`);
  exigePourcentage(asset.anchor.y, `${chemin}.anchor.y`);
  if (asset.anchor.scale !== undefined) {
    if (typeof asset.anchor.scale !== "number" || asset.anchor.scale <= 0) {
      throw new MissionSchemaError(
        `${chemin}.anchor.scale`,
        "doit être un rapport strictement positif sur ART_SCALE",
      );
    }
  }
  if (asset.options !== undefined && typeof asset.options !== "object") {
    throw new MissionSchemaError(`${chemin}.options`, "doit être un objet");
  }
}

function validerBeat(beat, chemin) {
  if (!beat || typeof beat !== "object") {
    throw new MissionSchemaError(chemin, "doit être un objet");
  }
  exigeTexte(beat.id, `${chemin}.id`, 2);
  if (!MISSION_MODES.includes(beat.mode)) {
    throw new MissionSchemaError(
      `${chemin}.mode`,
      `verbe inconnu (attendu : ${MISSION_MODES.join(", ")})`,
    );
  }
  exigeTexte(beat.scene, `${chemin}.scene`, 2);

  if (!Array.isArray(beat.assets) || beat.assets.length === 0) {
    throw new MissionSchemaError(
      `${chemin}.assets`,
      "au moins un objet requis",
    );
  }
  const idsAssets = new Set();
  beat.assets.forEach((asset, i) => {
    validerAsset(asset, `${chemin}.assets[${i}]`);
    const id = asset.id || asset.type;
    if (idsAssets.has(id)) {
      throw new MissionSchemaError(
        `${chemin}.assets[${i}]`,
        `deux objets partagent l'identifiant « ${id} », ajoute un id explicite`,
      );
    }
    idsAssets.add(id);
  });

  const reponses = beat.answers;
  if (!reponses || typeof reponses !== "object") {
    throw new MissionSchemaError(`${chemin}.answers`, "manquantes");
  }
  if (!ANSWER_KINDS.includes(reponses.kind)) {
    throw new MissionSchemaError(
      `${chemin}.answers.kind`,
      `inconnu (attendu : ${ANSWER_KINDS.join(", ")})`,
    );
  }
  if (!Array.isArray(reponses.options) || reponses.options.length < 2) {
    throw new MissionSchemaError(
      `${chemin}.answers.options`,
      "au moins deux réponses",
    );
  }
  const idsReponses = new Set();
  reponses.options.forEach((option, i) => {
    const sous = `${chemin}.answers.options[${i}]`;
    exigeTexte(option?.id, `${sous}.id`, 2);
    exigeTexte(option?.label, `${sous}.label`, 2);
    if (idsReponses.has(option.id)) {
      throw new MissionSchemaError(
        sous,
        `identifiant « ${option.id} » en double`,
      );
    }
    idsReponses.add(option.id);
    if (reponses.kind === "target" && !idsAssets.has(option.id)) {
      throw new MissionSchemaError(
        sous,
        `désigne « ${option.id} », qui n'est pas un objet de la scène`,
      );
    }
  });

  if (!idsReponses.has(beat.solution)) {
    throw new MissionSchemaError(
      `${chemin}.solution`,
      `« ${beat.solution} » ne fait pas partie des réponses`,
    );
  }

  CHAMPS_TEXTE_BEAT.forEach((champ) =>
    exigeTexte(beat[champ], `${chemin}.${champ}`),
  );
}

/**
 * Valide une mission complète. Lève une MissionSchemaError au premier problème.
 * @returns {object} la mission telle quelle, pour pouvoir chaîner.
 */
export function validateMission(mission) {
  if (!mission || typeof mission !== "object") {
    throw new MissionSchemaError("mission", "doit être un objet");
  }
  exigeTexte(mission.id, "id", 3);
  exigeTexte(mission.competence, "competence", 2);
  exigeTexte(mission.title, "title", 3);
  exigeTexte(mission.hook, "hook", 10);
  exigeTexte(mission.cta, "cta", 3);
  exigeTexte(mission.objective, "objective", 10);

  if (
    typeof mission.estimatedMinutes !== "number" ||
    mission.estimatedMinutes <= 0
  ) {
    throw new MissionSchemaError(
      "estimatedMinutes",
      "durée indicative manquante (elle n'est jamais un chronomètre)",
    );
  }

  if (mission.phase !== "preparation") {
    throw new MissionSchemaError(
      "phase",
      "une mission Mode Pilote est toujours en phase « preparation »",
    );
  }
  if (mission.certification !== false) {
    throw new MissionSchemaError(
      "certification",
      "doit valoir false : une mission ne certifie jamais",
    );
  }

  if (
    !Array.isArray(mission.transmissions) ||
    mission.transmissions.length === 0
  ) {
    throw new MissionSchemaError("transmissions", "au moins une boîte");
  }
  mission.transmissions.forEach((t, i) => {
    if (!TRANSMISSIONS.includes(t)) {
      throw new MissionSchemaError(
        `transmissions[${i}]`,
        `« ${t} » inconnue (attendu : ${TRANSMISSIONS.join(", ")})`,
      );
    }
  });

  if (mission.variants) {
    Object.keys(mission.variants).forEach((cle) => {
      if (!mission.transmissions.includes(cle)) {
        throw new MissionSchemaError(
          `variants.${cle}`,
          "surcharge une boîte que la mission ne déclare pas",
        );
      }
    });
  }

  if (
    !Array.isArray(mission.beats) ||
    mission.beats.length < 2 ||
    mission.beats.length > 4
  ) {
    throw new MissionSchemaError("beats", "entre deux et quatre temps de jeu");
  }
  const idsBeats = new Set();
  mission.beats.forEach((beat, i) => {
    validerBeat(beat, `beats[${i}]`);
    if (idsBeats.has(beat.id)) {
      throw new MissionSchemaError(
        `beats[${i}].id`,
        `« ${beat.id} » en double`,
      );
    }
    idsBeats.add(beat.id);
  });

  if (!mission.outcome || typeof mission.outcome !== "object") {
    throw new MissionSchemaError("outcome", "manquant");
  }
  if (mission.outcome.claim !== "ready-to-practice") {
    throw new MissionSchemaError(
      "outcome.claim",
      "une mission se termine sur « prêt·e à pratiquer », rien de plus fort",
    );
  }
  exigeTexte(mission.outcome.title, "outcome.title", 3);
  exigeTexte(mission.outcome.body, "outcome.body", 10);
  exigeTexte(mission.outcome.transfer, "outcome.transfer", 10);

  if (
    !Array.isArray(mission.outcome.recap) ||
    mission.outcome.recap.length !== mission.beats.length
  ) {
    throw new MissionSchemaError(
      "outcome.recap",
      `un rappel par temps de jeu (attendu : ${mission.beats.length})`,
    );
  }
  mission.outcome.recap.forEach((ligne, i) =>
    exigeTexte(ligne, `outcome.recap[${i}]`, 3),
  );

  return mission;
}

export { MissionSchemaError };
