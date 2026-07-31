/**
 * Le registre des missions, par compétence.
 *
 * Décision de Rayan du 31/07/2026 : le Mode Pilote n'a PAS de menu à lui.
 * L'élève part de « Mon permis », touche une compétence, et tombe directement
 * dans la mission. Le Mode Pilote reçoit donc un identifiant de compétence et
 * joue la mission, sans rien présenter avant.
 *
 * Ajouter une mission = ajouter une ligne ici.
 */

import { C1A_INSPECTION_360 } from "./c1a-inspection-360.js";
import { C1B_POSTE_DE_CONDUITE } from "./c1b-poste-de-conduite.js";

const MISSIONS = Object.freeze({
  C1a: C1A_INSPECTION_360,
  C1b: C1B_POSTE_DE_CONDUITE,
});

/** Les compétences qui ont une mission jouable aujourd'hui. */
export function competencesJouables() {
  return Object.keys(MISSIONS);
}

/**
 * @param {string} competence identifiant REMC, « C1a », « C1b »…
 * @returns {object} la mission, ou null si la compétence n'en a pas encore.
 */
export function missionPourCompetence(competence) {
  if (typeof competence !== "string") return null;
  const cle = competence.trim();
  return (
    MISSIONS[cle] || MISSIONS[cle.toLowerCase().replace(/^c/, "C")] || null
  );
}

export { MISSIONS };
