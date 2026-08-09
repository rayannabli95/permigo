// « Mise en situation » en 3D — la coque autour du moteur (src/game/).
// Elle n'a aucune logique de jeu : elle affiche un compteur, des commandes,
// enchaîne les situations et transforme les verdicts en progression PermiGo.
//
// Route : #/situation-3d  (ajouter ?debug=1 pour le mode développeur)

import "@/game/ui/hud.css";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { recordAnswer } from "@/utils/weak-points.js";
import { haptic } from "@/utils/haptic.js";
import { addGemmes } from "@/utils/game-state.js";
import { volantImg } from "@/utils/volant.js";
import {
  SITUATIONS,
  RETOURS_COMMUNS,
  TITRES_FAUTE,
} from "@/game/scenarios/index.js";

const VOLANTS_PAR_REUSSITE = 3;

let partie = null;
let racine = null;
let manche = null;

export async function mount(root) {
  racine = root;
  manche = { i: 0, reussies: 0, faites: [] };
  await jouer(root);
}

async function jouer(root) {
  const scenario = SITUATIONS[manche.i];
  const debug = /(?:\?|&)debug=1/.test(location.hash);

  root.innerHTML = `
    <div class="g3">
      <div class="g3-vue"></div>
      <div class="g3-regard" aria-hidden="true"></div>
      <div class="g3-chargement">Chargement de la scène</div>

      <button class="g3-quitter" type="button" aria-label="Quitter">✕</button>
      <button class="g3-oeil" type="button" aria-pressed="false">
        <span class="g3-oeil-i" aria-hidden="true">◨</span> Vue extérieure
      </button>

      <div class="g3-etape">${manche.i + 1}<span>/${SITUATIONS.length}</span></div>

      <div class="g3-consigne">
        <b>${esc(scenario.titre)}</b>
        <small>${esc(scenario.consigne)}</small>
      </div>
      <div class="g3-flash" role="status"></div>

      <div class="g3-vitesse"><b>0</b><span>KM/H</span></div>

      <div class="g3-cmd">
        <div class="g3-manche">GLISSE POUR TOURNER</div>
        <div class="g3-pedales">
          <button class="g3-pedale frein" type="button" aria-label="Freiner">▼</button>
          <button class="g3-pedale gaz" type="button" aria-label="Accélérer">▲</button>
        </div>
      </div>

      <p class="g3-clavier">La voiture avance seule<br>S freiner · A D tourner · Q E regarder · H debug</p>

      <div class="g3-fin"><div class="g3-carte"></div></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const compteur = $(".g3-vitesse b");
  const flash = $(".g3-flash");
  const fin = $(".g3-fin");

  track("situation3d.started", { scenario: scenario.id, etape: manche.i + 1 });

  const { lancerScenario } = await import("@/game/runner.js");
  partie = await lancerScenario($(".g3-vue"), scenario, {
    debug,
    sur: (type, data) => {
      if (type === "image") compteur.textContent = Math.round(data.kmh);
      else if (type === "faute") montrerFlash(MSG_FLASH[data]);
      else if (type === "feu") montrerFlash(MSG_FEU[data]);
      else if (type === "fin") terminer(data);
    },
  });

  partie.cmd.brancherManche($(".g3-manche"));
  partie.cmd.brancherPedale($(".g3-pedale.gaz"), "gaz");
  partie.cmd.brancherPedale($(".g3-pedale.frein"), "frein");
  partie.cmd.brancherRegard($(".g3-regard"));

  $(".g3-chargement").remove();
  setTimeout(() => $(".g3-consigne")?.classList.add("off"), 2800);

  $(".g3-quitter").addEventListener("click", quitter);

  // La vue extérieure n'est pas un gadget de développeur : on se voit
  // manœuvrer, et c'est le seul moyen de comprendre où on s'est placé sur la
  // chaussée. La caméra libre, elle, reste au mode debug (touche C).
  const oeil = $(".g3-oeil");
  oeil.addEventListener("click", () => {
    const vue = partie.changerVue(
      partie.rig.vue === "conduite" ? "exterieur" : "conduite",
    );
    const dehors = vue === "exterieur";
    oeil.setAttribute("aria-pressed", String(dehors));
    oeil.classList.toggle("on", dehors);
    oeil.lastChild.textContent = dehors ? " Vue conducteur" : " Vue extérieure";
    haptic("select");
  });

  let minuteurFlash = 0;
  function montrerFlash(txt) {
    if (!txt) return;
    flash.textContent = txt;
    flash.classList.add("on");
    clearTimeout(minuteurFlash);
    minuteurFlash = setTimeout(() => flash.classList.remove("on"), 1900);
  }

  function terminer(v) {
    const ok = v.ok;
    haptic(ok ? "success" : "error"); // haptic() joue déjà le son associé
    $(".g3").classList.add("fini");
    if (ok) manche.reussies++;
    manche.faites.push({ id: scenario.id, titre: scenario.titre, ok });

    // La progression PermiGo, inchangée : le verdict du moteur remplace
    // simplement « la bonne case a été cliquée ».
    try {
      recordAnswer(scenario.tags, ok);
      track("situation3d.completed", {
        scenario: scenario.id,
        ok,
        faute: v.principale,
        kmh: Math.round(v.vitesseCarrefour),
        regard_droite: v.regarde.droite,
        duree: Math.round(v.chrono),
        user: getCurUser?.()?.id ? 1 : 0,
      });
    } catch (e) {
      console.warn("[situation3d] progression", e);
    }

    const texte = ok
      ? scenario.retours.reussi
      : scenario.retours[v.principale] ||
        RETOURS_COMMUNS[v.principale] ||
        scenario.regle;
    const dernier = manche.i >= SITUATIONS.length - 1;

    $(".g3-carte").className = "g3-carte" + (ok ? "" : " rate");
    $(".g3-carte").innerHTML = `
      <div class="g3-verdict">${ok ? "Bien joué" : "À refaire"}</div>
      <h2>${esc(ok ? scenario.titre : TITRES_FAUTE[v.principale] || "Situation manquée")}</h2>
      <p>${esc(texte)}</p>
      <div class="g3-bilan">${bilan(scenario, v)}</div>
      <div class="g3-actions">
        <button class="g3-rejouer" type="button">Refaire</button>
        <button class="g3-sortir" type="button">${dernier ? "Voir le bilan" : "Situation suivante"}</button>
      </div>`;
    fin.classList.add("on");
    $(".g3-rejouer").addEventListener("click", () => {
      manche.faites.pop();
      if (ok) manche.reussies--;
      relancer();
    });
    $(".g3-sortir").addEventListener("click", () => {
      manche.i++;
      if (manche.i >= SITUATIONS.length) recap();
      else relancer();
    });
  }
}

// Les chiffres affichés sont ceux que le moteur a MESURÉS, pas des mentions.
// Chaque situation n'en montre que ce qui la concerne.
function bilan(scenario, v) {
  const puces = [];
  if (scenario.observation) {
    const vu = v.regarde[scenario.observation];
    puces.push(
      `<span class="${vu ? "ok" : "ko"}">Regard à ${scenario.observation} ${vu ? "fait" : "oublié"}</span>`,
    );
  }
  if (scenario.attendu === "arret")
    puces.push(
      `<span class="${v.arret ? "ok" : "ko"}">Arrêt ${v.arret ? "marqué" : "non marqué"}</span>`,
    );
  if (Number.isFinite(v.ecart))
    puces.push(
      `<span class="${v.ecart >= (scenario.ecartMin ?? 1) ? "ok" : "ko"}">${v.ecart.toFixed(1)} m d'écart</span>`,
    );
  if (v.vitesseCarrefour > 0)
    puces.push(
      `<span class="${v.vitesseCarrefour <= scenario.vitesseSure * 3.6 ? "ok" : "ko"}">${Math.round(v.vitesseCarrefour)} km/h à l'entrée</span>`,
    );
  puces.push(`<span>${v.chrono.toFixed(1)} s</span>`);
  return puces.join("");
}

function relancer() {
  partie?.detruire();
  partie = null;
  jouer(racine);
}

function recap() {
  partie?.detruire();
  partie = null;
  const total = SITUATIONS.length;
  const gagnes = manche.reussies * VOLANTS_PAR_REUSSITE;
  if (gagnes > 0) {
    try {
      addGemmes(gagnes);
    } catch (e) {
      console.warn("[situation3d] volants", e);
    }
  }
  track("situation3d.round_completed", { score: manche.reussies, total });

  const titre =
    manche.reussies === total
      ? "Sans faute"
      : manche.reussies >= total / 2
        ? "Tu as l'œil"
        : "On y retourne";
  racine.innerHTML = `
    <div class="g3 g3-recap">
      <div class="g3-carte">
        <div class="g3-verdict">Manche terminée</div>
        <h2>${esc(titre)}</h2>
        <div class="g3-score">${manche.reussies}<span>/${total}</span></div>
        <ul class="g3-liste">
          ${manche.faites
            .map(
              (s) =>
                `<li class="${s.ok ? "ok" : "ko"}">${s.ok ? "✓" : "✕"} ${esc(s.titre)}</li>`,
            )
            .join("")}
        </ul>
        <p class="g3-gain">${volantImg(18)} +${gagnes}</p>
        <div class="g3-actions">
          <button class="g3-rejouer" type="button">Rejouer la manche</button>
          <button class="g3-sortir" type="button">Sortir</button>
        </div>
      </div>
    </div>`;
  racine.querySelector(".g3-rejouer").addEventListener("click", () => {
    manche = { i: 0, reussies: 0, faites: [] };
    jouer(racine);
  });
  racine.querySelector(".g3-sortir").addEventListener("click", quitter);
}

function quitter() {
  location.hash = "#/accueil";
}

const MSG_FLASH = {
  trop_vite: "Trop vite",
  refus_priorite: "Il avait la priorité",
  pas_regarde_droite: "Tu n'as pas regardé à droite",
  pas_regarde_gauche: "Tu n'as pas regardé à gauche",
  collision: "Collision",
  pas_arrete: "Pas d'arrêt",
  feu_rouge: "Tu es passé au rouge",
  pas_cede_pieton: "Un piéton traversait",
  trop_pres: "Trop près",
};

const MSG_FEU = { orange: "Le feu passe à l'orange", rouge: "Feu rouge" };

export function unmount() {
  partie?.detruire();
  partie = null;
  if (racine) racine.innerHTML = "";
}
