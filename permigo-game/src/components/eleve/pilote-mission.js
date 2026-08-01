// ═══════════════════════════════════════════════════════════════
// Mode Pilote : le lecteur de missions.
//
// On lui donne un code de compétence, il enchaîne les missions de cette
// compétence et il rappelle quand c'est gagné. Il n'a NI hub, NI mondes,
// NI carte de missions, NI niveau, NI XP : le parcours de « Mon permis »
// est le seul parcours (décision du 31/07/2026, confirmée le 01/08).
//
// Le code REMC sert de clé d'entrée, il ne s'affiche jamais à l'élève.
//
// Rater a un prix. Au-delà de LIMITE_ERREURS fautes sur l'ensemble de la
// chaîne, on renvoie l'élève à sa fiche : « s'il rate il doit relire la fiche
// de révision » (Rayan, 31/07). Sans ce mur, tout le monde finit par
// certifier à l'usure et la certification ne vaut plus rien.
// ═══════════════════════════════════════════════════════════════
import { esc, escAttr } from "@/utils/escape.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { track } from "@/services/analytics.js";
import { playCorrect, playWrong, playVictory } from "@/utils/sound.js";
import { missionsPour } from "@/data/missions-pilote.js";
import { renderArt } from "@/components/eleve/pilote-scenes.js";
import "@/components/eleve/pilote.css";

/** Fautes tolérées sur toute la chaîne avant le retour à la fiche. */
const LIMITE_ERREURS = 4;

/** Les couleurs de chaque famille de compétence, pour la teinte de la scène. */
const TEINTES = {
  C1: ["#8b6dff", "#4e2cc7"],
  C2: ["#41c7d8", "#087d96"],
  C3: ["#ff8a5b", "#b43d2b"],
  C4: ["#f4c75e", "#a86810"],
};

function teinte(code) {
  return TEINTES[String(code).slice(0, 2)] || TEINTES.C1;
}

/**
 * Monte le lecteur dans un hôte et joue les missions d'une compétence.
 *
 * @param {HTMLElement} hote
 * @param {object} o
 * @param {string} o.code compétence, ex. « C1a »
 * @param {'manuelle'|'auto'|null} o.boite
 * @param {() => void} o.onReussite toutes les missions sont passées
 * @param {() => void} o.onEchec trop de fautes, retour à la fiche
 * @param {() => void} [o.onQuitter] l'élève ferme la mission
 * @returns {boolean} false si aucune mission n'existe pour cette compétence
 */
export function monterMissions(
  hote,
  { code, boite, onReussite, onEchec, onQuitter },
) {
  const missions = missionsPour(code, boite);
  if (!hote || !missions.length) return false;

  const [clair, sombre] = teinte(code);
  let index = 0;
  let fautes = 0;
  let etat = null; // { essais, resolu, indice, retour, choisis, dernier }

  const nouvelEtat = () => ({
    essais: 0,
    resolu: false,
    indice: false,
    retour: null,
    choisis: [],
    dernier: null,
  });

  const mission = () => missions[index];

  function dessiner() {
    const m = mission();
    hote.innerHTML = `
      <div class="mp-game mp-play" style="--world:${clair};--world-dark:${sombre}">
        ${enTete(m)}
        <section class="mp-play-title">
          <p>${esc(`Étape ${index + 1} sur ${missions.length}`)} · ${esc(m.title)}</p>
          <h1>${esc(m.prompt)}</h1>
        </section>
        ${interaction(m)}
        <section class="mp-play-bottom">
          ${retour(m)}
          ${
            etat.indice && !etat.resolu
              ? `<div class="mp-hint"><span>${icon("eye", { size: 18 })}</span>
                   <span><small>UN COUP DE POUCE</small><strong>${esc(m.hint)}</strong></span></div>`
              : ""
          }
          ${
            etat.resolu
              ? `<div class="mp-transfer">
                   <small>À FAIRE DANS LA VRAIE VOITURE</small>
                   <strong>${esc(m.transfer)}</strong>
                 </div>
                 <button class="mp-primary-button mp-success-button" type="button" data-suite>
                   ${esc(index + 1 < missions.length ? "Continuer" : "Terminer")}
                   ${icon("arrow-right", { size: 18 })}
                 </button>`
              : ""
          }
        </section>
      </div>`;
    brancher();
  }

  function enTete(m) {
    const avance =
      m.mode === "sequence"
        ? Math.round((etat.choisis.length / m.sequence.length) * 100)
        : etat.resolu
          ? 100
          : 14;
    return `
      <header class="mp-play-hud">
        <button class="mp-icon-button mp-dark-button" type="button" data-quitter
          aria-label="${escAttr("Quitter la mission")}">${icon("arrow-left", { size: 18 })}</button>
        <div class="mp-mission-progress">
          <span class="mp-progress-label">${esc(m.modeLabel)}</span>
          <div role="progressbar" aria-label="${escAttr("Progression de la mission")}"
            aria-valuemin="0" aria-valuemax="100" aria-valuenow="${avance}">
            <span style="width:${Math.max(avance, 4)}%"></span>
          </div>
        </div>
        <span class="mp-play-count">${index + 1}/${missions.length}</span>
      </header>`;
  }

  function scene(m, interactif) {
    const zones =
      interactif && m.hotspots
        ? m.hotspots
            .map((z, i) => {
              const montre = etat.indice && z.id === m.solution;
              return `<button class="mp-hotspot ${montre ? "is-hint" : ""}" type="button"
              data-reponse="${escAttr(z.id)}" aria-label="${escAttr(z.label)}"
              style="--x:${z.x}%;--y:${z.y}%;--w:${z.w}%;--h:${z.h}%;--delay:${i * 80}ms"><span></span></button>`;
            })
            .join("")
        : "";

    const trajets =
      interactif && m.mode === "trajectory"
        ? `<svg class="mp-trajectory-svg" viewBox="0 0 360 260" aria-label="${escAttr("Choix de trajectoire")}">
          <g class="mp-trajectory-choice path-a" role="button" tabindex="0" data-reponse="cut" aria-label="${escAttr("Trajectoire A, couper vers la ligne centrale")}">
            <path class="mp-path-hit" d="M180 245 C180 178 95 145 119 68"/>
            <path class="mp-path-visible" d="M180 245 C180 178 95 145 119 68"/>
          </g>
          <g class="mp-trajectory-choice path-b" role="button" tabindex="0" data-reponse="safe" aria-label="${escAttr("Trajectoire B, rester dans sa voie")}">
            <path class="mp-path-hit" d="M205 245 C211 180 166 153 190 61"/>
            <path class="mp-path-visible" d="M205 245 C211 180 166 153 190 61"/>
          </g>
          <g class="mp-trajectory-choice path-c" role="button" tabindex="0" data-reponse="edge" aria-label="${escAttr("Trajectoire C, longer le bord extérieur")}">
            <path class="mp-path-hit" d="M233 245 C253 184 242 143 272 78"/>
            <path class="mp-path-visible" d="M233 245 C253 184 242 143 272 78"/>
          </g>
        </svg>`
        : "";

    // L'étiquette porte la MÉCANIQUE, jamais le code REMC.
    return `
      <div class="mp-scene mp-scene-${esc(m.visual)}">
        <div class="mp-scene-scan" aria-hidden="true"></div>
        <div class="mp-scene-art mp-art-${esc(m.visual)}" aria-hidden="true">${renderArt(m.visual)}</div>
        ${zones}${trajets}
        <span class="mp-scene-tag">${esc(m.modeLabel)}</span>
      </div>`;
  }

  function interaction(m) {
    if (m.mode === "spot") {
      return `<section class="mp-interaction mp-spot-interaction">
        ${scene(m, true)}
        <p class="mp-scene-instruction">Touche directement la zone dans la scène.</p>
      </section>`;
    }
    if (m.mode === "trajectory") {
      return `<section class="mp-interaction mp-trajectory-interaction">
        ${scene(m, true)}
        <div class="mp-path-legend">
          <span><i class="mp-line-a"></i>A · Coupe</span>
          <span><i class="mp-line-b"></i>B · Reste dans la voie</span>
          <span><i class="mp-line-c"></i>C · Longe le bord</span>
        </div>
      </section>`;
    }
    if (m.mode === "sequence") return sequence(m);

    return `<section class="mp-interaction mp-choice-interaction">
      ${scene(m, false)}
      ${m.symptom ? `<div class="mp-symptom"><small>CE QUE TU CONSTATES</small><strong>${esc(m.symptom)}</strong></div>` : ""}
      <div class="mp-choice-list">
        ${m.choices
          .map((c, i) => {
            const rate = etat.dernier === c.id && etat.retour?.ton === "retry";
            const bon = etat.resolu && c.id === m.solution;
            return `<button class="mp-answer-card ${rate ? "is-wrong" : ""} ${bon ? "is-correct" : ""}"
              type="button" data-reponse="${escAttr(c.id)}" ${etat.resolu ? "disabled" : ""}>
              <span class="mp-answer-index">${String.fromCharCode(65 + i)}</span>
              <span>${esc(c.label)}</span>
              <span class="mp-answer-state">${bon ? icon("check", { size: 16 }) : ""}</span>
            </button>`;
          })
          .join("")}
      </div>
    </section>`;
  }

  function sequence(m) {
    // Ordre d'affichage stable mais différent de la solution : on trie sur
    // l'identifiant à l'envers, comme le prototype. Pas de Math.random, le
    // rendu doit être le même à chaque dessin de l'écran.
    const banque = [...m.steps].sort((a, b) => b.id.localeCompare(a.id));
    return `<section class="mp-interaction mp-sequence-interaction">
      ${scene(m, false)}
      <div class="mp-sequence-lane" aria-label="${escAttr("Ta chaîne de gestes")}">
        ${m.sequence
          .map((_, i) => {
            const pris = m.steps.find((s) => s.id === etat.choisis[i]);
            return `<span class="mp-sequence-slot ${pris ? "is-filled" : ""}">
              <small>${i + 1}</small>${pris ? `<strong>${esc(pris.label)}</strong>` : "<i></i>"}
            </span>`;
          })
          .join("")}
      </div>
      <div class="mp-sequence-bank">
        ${banque
          .map(
            (
              s,
            ) => `<button class="mp-sequence-card" type="button" data-reponse="${escAttr(s.id)}"
              ${etat.choisis.includes(s.id) || etat.resolu ? "disabled" : ""}>
              <span>${esc(s.symbol)}</span><strong>${esc(s.label)}</strong>
            </button>`,
          )
          .join("")}
      </div>
    </section>`;
  }

  function retour(m) {
    if (!etat.retour) {
      return `<div class="mp-feedback mp-feedback-neutral">
        <span>?</span>
        <p><strong>Prends le temps d'observer.</strong><small>Tu peux te reprendre.</small></p>
      </div>`;
    }
    const signe =
      etat.retour.ton === "success"
        ? icon("check", { size: 16 })
        : etat.retour.ton === "retry"
          ? "↺"
          : "→";
    return `<div class="mp-feedback mp-feedback-${etat.retour.ton}" role="status">
      <span>${signe}</span>
      <p><strong>${esc(etat.retour.titre)}</strong><small>${esc(etat.retour.texte)}</small></p>
    </div>`;
  }

  function faute(m) {
    fautes += 1;
    etat.essais += 1;
    const indiceAvant = etat.indice;
    etat.indice = etat.essais >= m.attemptsBeforeHint;
    playWrong();
    haptic("error"); // deux coups secs : on a touché la mauvaise chose
    // Le coup de pouce qui apparaît a sa propre secousse, sinon il arrive en
    // silence au milieu d'un écran que l'élève relit déjà.
    if (etat.indice && !indiceAvant) setTimeout(() => haptic("notify"), 260);
    if (fautes >= LIMITE_ERREURS) {
      track("pilote_mission_echec", { code, mission: m.id, fautes });
      onEchec?.();
      return true;
    }
    return false;
  }

  function reussi(m) {
    etat.resolu = true;
    etat.retour = { ton: "success", titre: m.success, texte: m.why };
    playCorrect();
    haptic("validate"); // la montée, la même que pour une compétence validée
    track("pilote_mission_reussie", {
      code,
      mission: m.id,
      essais: etat.essais,
    });
  }

  function repondre(id) {
    const m = mission();
    if (!m || etat.resolu) return;

    if (m.mode === "sequence") {
      if (etat.choisis.includes(id)) return;
      if (id !== m.sequence[etat.choisis.length]) {
        etat.dernier = id;
        etat.retour = {
          ton: "retry",
          titre: "Repars du début",
          texte: m.retry,
        };
        if (faute(m)) return;
        dessiner();
        return;
      }
      etat.choisis.push(id);
      if (etat.choisis.length === m.sequence.length) reussi(m);
      else {
        // Chaque maillon posé a son cran. La chaîne se sent sous le doigt.
        haptic("impact");
        etat.retour = {
          ton: "progress",
          titre: "Bon enchaînement",
          texte: "Continue le scénario dans ta tête.",
        };
      }
      dessiner();
      return;
    }

    etat.dernier = id;
    if (id === m.solution) {
      reussi(m);
    } else {
      etat.retour = { ton: "retry", titre: "Observe encore", texte: m.retry };
      if (faute(m)) return;
    }
    dessiner();
  }

  function suite() {
    if (index + 1 < missions.length) {
      haptic("swipe");
      index += 1;
      etat = nouvelEtat();
      dessiner();
      hote.scrollTo?.({ top: 0, behavior: "smooth" });
      return;
    }
    playVictory();
    haptic("unlock"); // le crescendo de fin de chaîne
    track("pilote_chaine_reussie", { code, missions: missions.length, fautes });
    onReussite?.();
  }

  function brancher() {
    hote.querySelector("[data-quitter]")?.addEventListener("click", () => {
      haptic("tap");
      onQuitter?.();
    });
    hote.querySelector("[data-suite]")?.addEventListener("click", suite);
    hote.querySelectorAll("[data-reponse]").forEach((el) => {
      // Le doigt sent le contact AVANT de savoir s'il a bon : c'est ce
      // décalage qui donne l'impression de toucher une vraie commande.
      // `pointerdown` et pas `click` : sur mobile le clic arrive trop tard.
      el.addEventListener("pointerdown", () => {
        if (!etat.resolu) haptic("impact");
      });
      el.addEventListener("click", () => repondre(el.dataset.reponse));
      // Les trajectoires sont des <g> SVG : le clavier ne les active pas seul.
      el.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        repondre(el.dataset.reponse);
      });
    });
  }

  etat = nouvelEtat();
  haptic("nav"); // on entre dans la voiture
  track("pilote_chaine_ouverte", {
    code,
    missions: missions.length,
    boite: boite || "inconnue",
  });
  dessiner();
  return true;
}

export { missionsPour };
