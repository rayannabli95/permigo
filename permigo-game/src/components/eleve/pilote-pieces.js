// ═══════════════════════════════════════════════════════════════
// Les pièces de voiture dessinées, branchées sur les missions.
//
// La bibliothèque vit dans `pieces/` : elle dessine seize pièces en SVG (les
// pédales, le levier, le sélecteur, le bloc compteurs, les douze voyants, le
// compte-tours, le pneu et son usure, le capot et ses quatre niveaux, la
// voiture de face, de dos et de profil).
//
// Elle a longtemps dormi dans `mockups/moteur-pilote/art-library`, jamais
// branchée : les missions affichaient des décors refaits en CSS pendant que ces
// dessins existaient à côté. Ce fichier est le pont. Il donne un nom court à
// chaque pièce, celui qu'une mission écrit dans son champ `visual`.
//
// ⚠️ Une mission qui porte des `hotspots` ou des `spots` cale ses zones
// tactiles en pourcentage du décor. Lui changer son décor décale ses zones :
// ces missions gardent le leur.
// ═══════════════════════════════════════════════════════════════
import { renderDrivingElement } from "@/components/eleve/pieces/elements.js";
import { renderDashboardElement } from "@/components/eleve/pieces/dashboard-elements.js";
import { renderVehicleElement } from "@/components/eleve/pieces/vehicle-elements.js";
import "@/components/eleve/pieces/pieces.css";

/**
 * Chaque entrée : le nom écrit dans `visual`, la fonction qui dessine, et
 * l'état de la pièce à l'écran.
 */
const PIECES = {
  // Le tableau de bord.
  "voyant-moteur": () =>
    renderDashboardElement("instrument-cluster", {
      warning: "engine",
      lit: true,
      speed: 0,
      rpm: 800,
    }),
  "compte-tours-bas": () =>
    renderDashboardElement("tachometer", { rpm: 700, speed: 22 }),
  "compte-tours-haut": () =>
    renderDashboardElement("tachometer", { rpm: 4200, speed: 48 }),
  voyants: () =>
    renderDashboardElement("warning-lights", { warning: "engine" }),

  // Les commandes au pied et à la main.
  "pedales-manuelle": () => renderDrivingElement("manual-pedals", {}),
  "pedales-auto": () => renderDrivingElement("automatic-pedals", {}),
  levier: (options) =>
    renderDrivingElement("manual-shifter", { gear: options.gear || "1" }),
  selecteur: (options) =>
    renderDrivingElement("automatic-selector", {
      position: options.position || "D",
    }),
  "pied-embrayage": () => renderDrivingElement("clutch-foot", {}),
  "pied-frein": () => renderDrivingElement("brake-foot", {}),

  // Le véhicule et ses vérifications.
  pneu: (options) =>
    renderVehicleElement("tyre-wear", { wear: options.wear ?? 20 }),
  "pneu-use": () => renderVehicleElement("tyre-wear", { wear: 92 }),
  capot: (options) =>
    renderVehicleElement("hood-levels", {
      fluid: options.fluid || "oil",
      level: options.level ?? 72,
    }),
  // ⚠️ C'est le REFROIDISSEMENT qu'on met au plus bas, pas l'huile. Le bocal
  // de refroidissement est le seul dessiné en rouge quand il est plein : avec
  // l'huile en alerte, l'écran montrait deux rouges et l'élève désignait le
  // mauvais. Un bocal presque vide reste alors le seul signal rouge.
  "capot-bas": () =>
    renderVehicleElement("hood-levels", { fluid: "coolant", level: 9 }),
  "voiture-profil": () => renderVehicleElement("car-profile", {}),
  "voiture-face": (options) =>
    renderVehicleElement("car-front", { lit: options.lit === true }),
  "voiture-dos": (options) =>
    renderVehicleElement("car-rear", { lit: options.lit === true }),
};

/** @param {string} nom valeur du champ `visual` d'une mission */
export function estUnePiece(nom) {
  return Object.hasOwn(PIECES, nom);
}

/**
 * Dessine une pièce, prête à être posée dans la scène d'une mission.
 *
 * @param {string} nom valeur du champ `visual`
 * @param {object} [options] réglages de la pièce (usure, rapport, niveau…)
 * @returns {string} HTML, ou chaîne vide si le nom n'est pas une pièce
 */
export function renderPiece(nom, options = {}) {
  if (!estUnePiece(nom)) return "";
  return `<div class="mp-piece">${PIECES[nom](options)}</div>`;
}
