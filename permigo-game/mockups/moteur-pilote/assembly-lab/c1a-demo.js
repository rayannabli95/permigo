/**
 * Déroulé d'une session Mode Pilote.
 *
 * Le Mode Pilote n'a PAS de menu à lui (décision Rayan, 31/07/2026) : il reçoit
 * un IDENTIFIANT DE COMPÉTENCE et joue la mission correspondante, sans rien
 * présenter avant. Ici l'identifiant vient de l'URL (`?competence=C1b`) ; dans
 * l'app il viendra de la compétence touchée dans « Mon permis ».
 *
 * La boîte de vitesses n'est pas demandée au lancement : c'est un réglage du
 * compte. On la lit, on ne la pose pas.
 *
 * Ce fichier ne connaît aucune mission en particulier. Aucun `if (mission.id
 * === ...)` ici, et il n'y en aura pas pour les trente suivantes.
 */

import { resolveMission } from "../assembly/mission-resolver.js";
import {
  renderBeat,
  renderBrief,
  renderOutcome,
} from "../assembly/scene-assembler.js";
import {
  competencesJouables,
  missionPourCompetence,
} from "../assembly/missions/index.js";

const HESITATIONS_AVANT_INDICE = 2;
const CLE_BOITE = "pg-transmission";

const racine = document.getElementById("mission");

/** La compétence à jouer. Dans l'app : celle que l'élève vient de toucher. */
function competenceDemandee() {
  const url = new URL(window.location.href);
  return url.searchParams.get("competence") || "C1a";
}

/** La boîte est un réglage du compte, pas une question posée avant de jouer. */
function boiteDuCompte() {
  try {
    const stockee = window.localStorage.getItem(CLE_BOITE);
    if (stockee === "manual" || stockee === "automatic") return stockee;
  } catch {
    /* stockage indisponible : on reste sur la boîte manuelle */
  }
  return "manual";
}

const etat = {
  competence: competenceDemandee(),
  transmission: boiteDuCompte(),
  mission: null,
  ecran: "brief", // brief | beat | outcome
  index: 0,
  hesitations: 0,
  indiceVisible: false,
  indiceCoupe: false,
  assetStates: {},
  reponsesJouees: {},
  phase: "reperer", // pour les gestes en zones
  reperees: [],
  faites: [],
  verrouille: false,
  retour: "",
  ton: "neutre",
};

function beatCourant() {
  return etat.mission.beats[etat.index];
}

function reinitialiserBeat() {
  etat.hesitations = 0;
  etat.indiceVisible = false;
  etat.assetStates = {};
  etat.reponsesJouees = {};
  etat.reperees = [];
  etat.faites = [];
  etat.phase = beatCourant()?.answers.kind === "zones" ? "reperer" : "jeu";
  etat.verrouille = false;
  etat.retour = "";
  etat.ton = "neutre";
}

function chargerMission() {
  const mission = missionPourCompetence(etat.competence);
  if (!mission) {
    racine.innerHTML = `
      <div class="mp-shell">
        <div class="mp-brief">
          <h1>Pas encore</h1>
          <p class="mp-hook">
            La compétence ${etat.competence} n'a pas encore de mission.
            Aujourd'hui : ${competencesJouables().join(", ")}.
          </p>
        </div>
      </div>`;
    return false;
  }
  etat.mission = resolveMission(mission, etat.transmission);
  etat.ecran = "brief";
  etat.index = 0;
  reinitialiserBeat();
  return true;
}

function barre() {
  return `
    <div class="mp-topbar">
      <div>
        <h2>Mode Pilote</h2>
        <p>${etat.mission.competence} · ${etat.mission.title}</p>
      </div>
    </div>`;
}

/** Barre de test, hors mission : elle n'existe que dans ce bac à sable. */
function barreLabo() {
  const boites = ["manual", "automatic"]
    .map((t) => {
      const libelle = t === "manual" ? "Manuelle" : "Automatique";
      return `<button type="button" data-boite="${t}" aria-pressed="${etat.transmission === t}">${libelle}</button>`;
    })
    .join("");
  const liens = competencesJouables()
    .map(
      (c) =>
        `<button type="button" data-competence="${c}" aria-pressed="${etat.competence === c}">${c}</button>`,
    )
    .join("");

  return `
    <div class="mp-labo">
      <span>Bac à sable</span>
      <div role="group" aria-label="Compétence jouée">${liens}</div>
      <div role="group" aria-label="Boîte de vitesses du compte">${boites}</div>
    </div>`;
}

function rendre() {
  let corps = "";
  if (etat.ecran === "brief") {
    corps = renderBrief(etat.mission);
  } else if (etat.ecran === "beat") {
    corps = renderBeat(beatCourant(), {
      assetStates: etat.assetStates,
      reponses: etat.reponsesJouees,
      phase: etat.phase,
      reperees: etat.reperees,
      faites: etat.faites,
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

  racine.innerHTML = `<div class="mp-shell">${barre()}${corps}${barreLabo()}</div>`;

  if (etat.ecran === "beat") {
    Object.entries(etat.reponsesJouees).forEach(([id, valeur]) => {
      const bouton = racine.querySelector(
        `.mp-answer[data-answer="${CSS.escape(id)}"]`,
      );
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

/* ─────────────────────────  le geste en zones  ───────────────────────── */

function toucherZone(id) {
  const beat = beatCourant();
  const zone = beat.answers.options.find((o) => o.id === id);
  if (!zone || etat.verrouille) return;

  // Temps 1 : on explore. Chaque zone raconte à quoi elle sert.
  if (etat.phase === "reperer") {
    if (!etat.reperees.includes(id)) etat.reperees.push(id);
    etat.ton = "neutre";
    etat.retour = `${zone.label} — ${zone.aide}`;
    if (etat.reperees.length === beat.answers.options.length) {
      etat.phase = "refaire";
      etat.ton = "reussi";
      etat.retour =
        "Tu les as toutes vues. Refais-les maintenant dans l'ordre.";
    }
    rendre();
    return;
  }

  // Temps 2 : on refait, dans l'ordre.
  const attendue = beat.ordre[etat.faites.length];
  if (id !== attendue) {
    etat.hesitations += 1;
    etat.ton = "consolider";
    etat.retour = beat.retry;
    etat.faites = [];
    if (!etat.indiceCoupe && etat.hesitations >= HESITATIONS_AVANT_INDICE) {
      etat.indiceVisible = true;
    }
    rendre();
    return;
  }

  etat.faites.push(id);
  if (etat.faites.length < beat.ordre.length) {
    const suivante = beat.answers.options.find(
      (o) => o.id === beat.ordre[etat.faites.length],
    );
    etat.ton = "neutre";
    etat.retour =
      `${zone.label}, fait. ${suivante ? "Et ensuite ?" : ""}`.trim();
    rendre();
    return;
  }

  etat.verrouille = true;
  etat.ton = "reussi";
  etat.retour = `${beat.success} ${beat.why}`;
  etat.deplacerFocus = true;
  rendre();
}

/* ───────────────────────────  les autres modes  ──────────────────────── */

function repondre(id) {
  if (etat.verrouille) return;
  const beat = beatCourant();

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
    reinitialiserBeat();
    etat.ecran = "beat";
  } else {
    etat.ecran = "outcome";
  }
  etat.deplacerFocus = true;
  rendre();
}

racine.addEventListener("click", (evenement) => {
  const competence = evenement.target.closest("[data-competence]");
  if (competence) {
    etat.competence = competence.dataset.competence;
    if (chargerMission()) rendre();
    return;
  }

  const boite = evenement.target.closest("[data-boite]");
  if (boite) {
    etat.transmission = boite.dataset.boite;
    try {
      window.localStorage.setItem(CLE_BOITE, etat.transmission);
    } catch {
      /* stockage indisponible : le choix ne survivra pas au rechargement */
    }
    if (chargerMission()) rendre();
    return;
  }

  const zone = evenement.target.closest("[data-zone]");
  if (zone) {
    toucherZone(zone.dataset.zone);
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
    chargerMission();
    etat.ecran = "beat";
    etat.deplacerFocus = true;
    rendre();
  } else if (action === "retour") {
    etat.indiceCoupe = false;
    chargerMission();
    rendre();
  }
});

if (chargerMission()) rendre();
