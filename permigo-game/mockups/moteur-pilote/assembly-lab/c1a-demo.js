/**
 * Déroulé d'une session Mode Pilote.
 *
 * Ce fichier ne connaît aucune mission : il reçoit une donnée, la résout pour
 * une boîte et laisse l'assembleur poser les temps de jeu. Il n'y a donc aucun
 * `if (mission.id === ...)` ici, et il n'y en aura pas pour les 30 suivantes.
 */

import { resolveMission } from "../assembly/mission-resolver.js";
import {
  renderBeat,
  renderBrief,
  renderOutcome,
} from "../assembly/scene-assembler.js";
import { C1A_INSPECTION_360 } from "../assembly/missions/c1a-inspection-360.js";

const HESITATIONS_AVANT_INDICE = 2;

const racine = document.getElementById("mission");
const etat = {
  transmission: "manual",
  mission: null,
  ecran: "brief", // brief | beat | outcome
  index: 0,
  hesitations: 0,
  indiceVisible: false,
  indiceCoupe: false, // « rejouer sans indice »
  assetStates: {},
  verrouille: false,
  retour: "",
  ton: "neutre",
};

function beatCourant() {
  return etat.mission.beats[etat.index];
}

function chargerMission(transmission) {
  etat.transmission = transmission;
  etat.mission = resolveMission(C1A_INSPECTION_360, transmission);
  etat.ecran = "brief";
  etat.index = 0;
  reinitialiserBeat();
}

function reinitialiserBeat() {
  etat.hesitations = 0;
  etat.indiceVisible = false;
  etat.assetStates = {};
  etat.verrouille = false;
  etat.retour = "";
  etat.ton = "neutre";
}

function barre() {
  const boutons = ["manual", "automatic"]
    .map((t) => {
      const libelle = t === "manual" ? "Manuelle" : "Automatique";
      const actif = etat.transmission === t;
      return `<button type="button" data-boite="${t}" aria-pressed="${actif}">${libelle}</button>`;
    })
    .join("");

  return `
    <div class="mp-topbar">
      <div>
        <h2>Mode Pilote</h2>
        <p>${etat.mission.competence} · ${etat.mission.title}</p>
      </div>
      <div class="mp-box-switch" role="group" aria-label="Boîte de vitesses">${boutons}</div>
    </div>`;
}

function rendre() {
  let corps = "";
  if (etat.ecran === "brief") {
    corps = renderBrief(etat.mission);
  } else if (etat.ecran === "beat") {
    corps = renderBeat(beatCourant(), {
      assetStates: etat.assetStates,
      verrouille: etat.verrouille,
      retour: etat.retour,
      ton: etat.ton,
      indiceVisible: etat.indiceVisible,
      index: etat.index + 1,
      total: etat.mission.beats.length,
    });
  } else {
    corps = renderOutcome(etat.mission, { recap: etat.mission.outcome.recap });
  }

  racine.innerHTML = `<div class="mp-shell">${barre()}${corps}</div>`;

  // marquage des réponses déjà jouées
  if (etat.ecran === "beat" && etat.reponsesJouees) {
    Object.entries(etat.reponsesJouees).forEach(([id, valeur]) => {
      const bouton = racine.querySelector(`[data-answer="${CSS.escape(id)}"]`);
      if (bouton) bouton.dataset.etat = valeur;
    });
  }

  const focus = racine.querySelector(
    etat.ecran === "beat" && etat.verrouille
      ? ".mp-next"
      : ".mp-prompt, .mp-brief h1, .mp-outcome h2",
  );
  if (focus && etat.deplacerFocus) {
    focus.setAttribute("tabindex", "-1");
    focus.focus({ preventScroll: true });
    etat.deplacerFocus = false;
  }
}

function repondre(id) {
  if (etat.verrouille) return;
  const beat = beatCourant();
  etat.reponsesJouees = etat.reponsesJouees || {};

  const juste = id === beat.solution;
  if (juste) {
    etat.reponsesJouees[id] = "bon";
    if (beat.answers.kind === "target") etat.assetStates[id] = "found";
    etat.verrouille = true;
    etat.ton = "reussi";
    etat.retour = `${beat.success} ${beat.why}`;
  } else {
    etat.reponsesJouees[id] = "mauvais";
    if (beat.answers.kind === "target") etat.assetStates[id] = "error";
    etat.hesitations += 1;
    etat.ton = "consolider";
    etat.retour = beat.retry;
    if (!etat.indiceCoupe && etat.hesitations >= HESITATIONS_AVANT_INDICE) {
      etat.indiceVisible = true;
    }
  }
  etat.deplacerFocus = juste;
  rendre();
}

function suivant() {
  if (etat.index + 1 < etat.mission.beats.length) {
    etat.index += 1;
    etat.reponsesJouees = {};
    reinitialiserBeat();
    etat.ecran = "beat";
  } else {
    etat.ecran = "outcome";
  }
  etat.deplacerFocus = true;
  rendre();
}

racine.addEventListener("click", (evenement) => {
  const boite = evenement.target.closest("[data-boite]");
  if (boite) {
    chargerMission(boite.dataset.boite);
    etat.reponsesJouees = {};
    rendre();
    return;
  }

  const reponse = evenement.target.closest("[data-answer]");
  if (reponse) {
    repondre(reponse.dataset.answer);
    return;
  }

  const action = evenement.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "commencer") {
    etat.ecran = "beat";
    etat.index = 0;
    etat.reponsesJouees = {};
    reinitialiserBeat();
    etat.deplacerFocus = true;
    rendre();
  } else if (action === "indice") {
    etat.indiceVisible = true;
    rendre();
  } else if (action === "suivant") {
    suivant();
  } else if (action === "rejouer") {
    etat.indiceCoupe = true;
    chargerMission(etat.transmission);
    etat.ecran = "beat";
    etat.reponsesJouees = {};
    etat.deplacerFocus = true;
    rendre();
  } else if (action === "retour") {
    etat.indiceCoupe = false;
    chargerMission(etat.transmission);
    etat.reponsesJouees = {};
    rendre();
  }
});

chargerMission("manual");
rendre();
