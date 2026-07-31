/**
 * Assembleur de scène.
 *
 * Il sait poser n'importe quel temps de jeu à partir du schéma : il connaît les
 * familles de la bibliothèque, jamais une mission en particulier. Aucun SVG et
 * aucune recette de matière ne sont recopiés ici.
 */

import { escapeText } from "../art-library/art-core.js";
import { renderDrivingElement } from "../art-library/elements.js";
import { renderDashboardElement } from "../art-library/dashboard-elements.js";
import { renderVehicleElement } from "../art-library/vehicle-elements.js";

const RENDUS_PAR_FAMILLE = Object.freeze({
  driving: renderDrivingElement,
  dashboard: renderDashboardElement,
  vehicle: renderVehicleElement,
});

/**
 * Les photos.
 *
 * On dessine ce qui change d'état — un tableau de bord, un voyant, une aiguille.
 * On photographie ce qu'on regarde sans le transformer — la voiture, le pneu, le
 * compartiment moteur. Dessinés, ces objets-là font toujours pauvres.
 *
 * Les photos sont prises en JOUR NEUTRE : c'est le CSS qui fait la nuit, et un
 * halo posé par-dessus qui allume un phare. Une photo peut donc changer d'état.
 */
const PHOTOS = Object.freeze({
  "voiture-avant": "../photos/voiture-avant.webp",
  "voiture-arriere": "../photos/voiture-arriere.webp",
  pneu: "../photos/pneu.webp",
  moteur: "../photos/moteur.webp",
});

/**
 * Proportion naturelle d'un objet. C'est une connaissance de bibliothèque, pas
 * de mission : la donnée n'a pas à savoir qu'un bloc compteurs est large.
 */
const RATIOS_LARGES = Object.freeze({
  "instrument-cluster": 1.85,
  "hood-levels": 1.7,
  "car-front": 1.35,
  "car-rear": 1.35,
  "car-profile": 1.5,
  "manual-pedals": 1.3,
  "automatic-pedals": 1.3,
});

function ratioDe(asset) {
  return asset.anchor.ratio ?? RATIOS_LARGES[asset.type] ?? 1.14;
}

/** Identifiant stable d'un objet dans un temps de jeu. */
export function assetId(asset) {
  return asset.id || asset.type;
}

/**
 * Un objet posé dans la scène. `state` vient du déroulé du jeu, pas de la
 * donnée : la mission décrit un repos, le jeu décide de `found` et `error`.
 */
function renderPhoto(asset) {
  const source = PHOTOS[asset.type];
  const halos = (asset.options?.glows || [])
    .map(
      (halo) =>
        `<span class="mp-glow" style="left:${halo.x}%;top:${halo.y}%"></span>`,
    )
    .join("");

  return `
    <div class="mp-photo" data-asset="${escapeText(assetId(asset))}">
      <img src="${escapeText(source)}" alt="${escapeText(asset.options?.alt || "")}">
      ${halos}
    </div>`;
}

function renderAsset(asset, etats) {
  if (asset.family === "photo") return renderPhoto(asset);
  const rendu = RENDUS_PAR_FAMILLE[asset.family];
  const id = assetId(asset);
  const state = etats[id] || asset.options?.state || "idle";
  const scale = asset.anchor.scale ?? 1;

  const style = [
    `left:${asset.anchor.x}%`,
    `top:${asset.anchor.y}%`,
    `--pg-asset-scale:${scale}`,
    `--pg-asset-ratio:${ratioDe(asset)}`,
  ].join(";");

  return `
    <div class="mp-asset" style="${style}" data-asset="${escapeText(id)}">
      ${rendu(asset.type, { ...asset.options, state })}
    </div>`;
}

/**
 * Les pastilles posées sur la photo.
 *
 * Ici la réponse EST l'endroit : on ne peut pas désigner un pneu depuis une
 * liste. La pastille est donc un anneau creux, l'objet reste visible au milieu,
 * et son libellé n'est lu que par les lecteurs d'écran.
 */
function renderHotspots(beat, { verrouille, reponses = {} }) {
  return beat.answers.options
    .map((option, i) => {
      const etat = reponses[option.id];
      return `
        <button
          class="mp-hotspot"
          type="button"
          data-answer="${escapeText(option.id)}"
          ${etat ? `data-etat="${etat}"` : ""}
          ${verrouille && !etat ? "disabled" : ""}
          style="left:${option.at.x}%;top:${option.at.y}%"
          aria-label="${escapeText(option.label)}"
        ><span aria-hidden="true">${i + 1}</span></button>`;
    })
    .join("");
}

/** La bande de réponses. Elle vit SOUS le cadre : elle ne couvre aucun objet. */
function renderAnswers(beat, { verrouille }) {
  const boutons = beat.answers.options
    .map((option) => {
      const est = beat.answers.kind === "target" ? "désigner" : "choisir";
      return `
        <button
          class="mp-answer"
          type="button"
          data-answer="${escapeText(option.id)}"
          ${verrouille ? "disabled" : ""}
          aria-label="${escapeText(`${est} ${option.label}`)}"
        >${escapeText(option.label)}</button>`;
    })
    .join("");

  return `<div class="mp-answers" role="group" aria-label="Réponses">${boutons}</div>`;
}

/**
 * Rend un temps de jeu complet.
 *
 * @param {object} beat temps de jeu résolu
 * @param {object} etat état vivant du jeu
 * @param {Record<string,string>} etat.assetStates état par objet
 * @param {boolean} etat.verrouille réponses figées (le temps est joué)
 * @param {string} etat.retour message affiché sous la consigne
 * @param {"neutre"|"reussi"|"consolider"} etat.ton couleur du message
 * @param {boolean} etat.indiceVisible
 * @param {number} etat.index position du temps (à partir de 1)
 * @param {number} etat.total nombre de temps
 */
export function renderBeat(beat, etat) {
  const {
    assetStates = {},
    reponses = {},
    verrouille = false,
    retour = "",
    ton = "neutre",
    indiceVisible = false,
    index = 1,
    total = 1,
  } = etat || {};

  const jauge = Array.from({ length: total }, (_, i) => {
    const classe =
      i < index - 1 ? "est-fait" : i === index - 1 ? "est-ici" : "";
    return `<i class="${classe}"></i>`;
  }).join("");

  return `
    <div class="mp-beat" data-beat="${escapeText(beat.id)}" data-mode="${escapeText(beat.mode)}">
      <div class="mp-progress" role="img" aria-label="Temps ${index} sur ${total}">${jauge}</div>

      <div class="mp-stage" data-scene="${escapeText(beat.scene)}">
        ${beat.assets.map((asset) => renderAsset(asset, assetStates)).join("")}
        ${
          beat.answers.kind === "hotspot"
            ? renderHotspots(beat, { verrouille, reponses })
            : ""
        }
      </div>

      <div class="mp-panel">
        <p class="mp-prompt" dir="auto">${escapeText(beat.prompt)}</p>
        ${beat.answers.kind === "hotspot" ? "" : renderAnswers(beat, { verrouille })}
        <p class="mp-feedback is-${ton}" dir="auto" role="status" aria-live="polite">${escapeText(retour)}</p>
        ${
          indiceVisible
            ? `<p class="mp-hint" dir="auto"><span>Indice</span> ${escapeText(beat.hint)}</p>`
            : `<button class="mp-hint-ask" type="button" data-action="indice">Voir un indice</button>`
        }
        <button class="mp-next" type="button" data-action="suivant" ${verrouille ? "" : "disabled"}>
          ${index === total ? "Terminer" : "Contrôle suivant"}
        </button>
      </div>
    </div>`;
}

/** Écran d'ouverture. */
export function renderBrief(mission) {
  return `
    <div class="mp-brief">
      <span class="mp-eyebrow">${escapeText(mission.competence)} · préparation</span>
      <h1 dir="auto">${escapeText(mission.title)}</h1>
      <p class="mp-hook" dir="auto">${escapeText(mission.hook)}</p>
      <p class="mp-duration">${mission.estimatedMinutes} minutes, sans chronomètre</p>
      <button class="mp-next" type="button" data-action="commencer">${escapeText(mission.cta)}</button>
    </div>`;
}

/** Écran de sortie. Jamais de note, jamais de « validée ». */
export function renderOutcome(mission, { recap = [] } = {}) {
  const etapes = recap
    .map((item) => `<li dir="auto">${escapeText(item)}</li>`)
    .join("");

  return `
    <div class="mp-outcome">
      <h2 dir="auto">${escapeText(mission.outcome.title)}</h2>
      <ol class="mp-recap">${etapes}</ol>
      <p dir="auto">${escapeText(mission.outcome.body)}</p>
      <p class="mp-transfer" dir="auto"><span>En leçon</span> ${escapeText(mission.outcome.transfer)}</p>
      <button class="mp-next" type="button" data-action="retour">Revenir aux missions</button>
      <button class="mp-replay" type="button" data-action="rejouer">Rejouer sans indice</button>
    </div>`;
}
