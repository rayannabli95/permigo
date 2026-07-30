/**
 * Résolution d'une mission pour une boîte de vitesses donnée.
 *
 * Une mission n'est jamais dupliquée pour changer un pédalier ou une phrase :
 * elle porte une base commune et, si besoin, une surcharge par boîte. Ce module
 * fusionne les deux sans jamais modifier la donnée source.
 */

import { TRANSMISSIONS, validateMission } from "./mission-schema.js";

function estObjetSimple(valeur) {
  return (
    typeof valeur === "object" && valeur !== null && !Array.isArray(valeur)
  );
}

/** Fusion profonde. Les tableaux sont remplacés, jamais concaténés. */
function fusionner(base, surcharge) {
  if (surcharge === undefined) return structuredClone(base);
  if (!estObjetSimple(base) || !estObjetSimple(surcharge)) {
    return structuredClone(surcharge);
  }
  const sortie = structuredClone(base);
  Object.keys(surcharge).forEach((cle) => {
    sortie[cle] = fusionner(base[cle], surcharge[cle]);
  });
  return sortie;
}

/**
 * Fusionne les temps de jeu par identifiant : une surcharge de boîte cible un
 * beat existant, elle n'en réordonne pas la liste et n'en invente pas.
 */
function fusionnerBeats(beatsBase, beatsSurcharge) {
  if (!Array.isArray(beatsSurcharge)) return structuredClone(beatsBase);
  const parId = new Map(beatsSurcharge.map((beat) => [beat.id, beat]));
  const sortie = beatsBase.map((beat) => fusionner(beat, parId.get(beat.id)));
  const inconnus = beatsSurcharge
    .map((beat) => beat.id)
    .filter((id) => !beatsBase.some((beat) => beat.id === id));
  if (inconnus.length) {
    throw new Error(
      `La surcharge de boîte vise des temps de jeu absents de la base : ${inconnus.join(", ")}`,
    );
  }
  return sortie;
}

/**
 * @param {object} mission définition brute (avec ou sans `variants`)
 * @param {"manual"|"automatic"} transmission
 * @returns {object} mission jouable, sans `variants`, source intacte
 */
export function resolveMission(mission, transmission) {
  if (!TRANSMISSIONS.includes(transmission)) {
    throw new TypeError(`Boîte inconnue : ${transmission}`);
  }
  validateMission(mission);

  if (!mission.transmissions.includes(transmission)) {
    throw new Error(
      `La mission « ${mission.id} » n'existe pas en boîte ${transmission}.`,
    );
  }

  const surcharge = mission.variants?.[transmission];
  const { variants: _ignore, ...base } = structuredClone(mission);

  if (!surcharge) {
    return validateMission({ ...base, transmission });
  }

  const { beats: beatsSurcharge, ...resteSurcharge } = surcharge;
  const resolue = fusionner(base, resteSurcharge);
  resolue.beats = fusionnerBeats(base.beats, beatsSurcharge);
  resolue.transmission = transmission;

  return validateMission(resolue);
}

/** Les deux résolutions d'un coup, pratique pour les contrôles. */
export function resolveAllTransmissions(mission) {
  return Object.fromEntries(
    mission.transmissions.map((t) => [t, resolveMission(mission, t)]),
  );
}
