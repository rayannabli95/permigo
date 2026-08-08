// « Mise en situation » en 3D — la coque autour du moteur (src/game/).
// Elle n'a aucune logique de jeu : elle affiche un compteur, des commandes,
// et transforme le verdict du moteur en progression PermiGo.
//
// Route : #/situation-3d  (ajouter ?debug=1 pour le mode développeur)

import "@/game/ui/hud.css";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { recordAnswer } from "@/utils/weak-points.js";
import { haptic } from "@/utils/haptic.js";
import SCENARIO from "@/game/scenarios/priorite-droite.js";

let partie = null;
let racine = null;

export async function mount(root) {
  racine = root;
  const debug = /(?:\?|&)debug=1/.test(location.hash);

  root.innerHTML = `
    <div class="g3">
      <div class="g3-vue"></div>
      <div class="g3-regard" aria-hidden="true"></div>
      <div class="g3-chargement">Chargement de la scène</div>

      <button class="g3-quitter" type="button" aria-label="Quitter">✕</button>

      <div class="g3-consigne">
        <b>${esc(SCENARIO.titre)}</b>
        <small>${esc(SCENARIO.consigne)}</small>
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

      <p class="g3-clavier">W accélérer · S freiner · A D tourner<br>Q E regarder · C changer de vue · H debug</p>

      <div class="g3-fin"><div class="g3-carte"></div></div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const vue = $(".g3-vue");
  const compteur = $(".g3-vitesse b");
  const flash = $(".g3-flash");
  const fin = $(".g3-fin");

  track("situation3d.started", { scenario: SCENARIO.id });

  const { lancerScenario } = await import("@/game/runner.js");
  partie = await lancerScenario(vue, SCENARIO, {
    debug,
    sur: (type, data) => {
      if (type === "image") {
        compteur.textContent = Math.round(data.kmh);
      } else if (type === "faute") {
        montrerFlash(MSG_FLASH[data]);
      } else if (type === "fin") {
        terminer(data);
      }
    },
  });

  partie.cmd.brancherManche($(".g3-manche"));
  partie.cmd.brancherPedale($(".g3-pedale.gaz"), "gaz");
  partie.cmd.brancherPedale($(".g3-pedale.frein"), "frein");
  partie.cmd.brancherRegard($(".g3-regard"));

  $(".g3-chargement").remove();
  setTimeout(() => $(".g3-consigne")?.classList.add("off"), 2600);

  $(".g3-quitter").addEventListener("click", () => {
    location.hash = "#/accueil";
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

    // La progression PermiGo, inchangée : le verdict du moteur remplace
    // simplement « la bonne case a été cliquée ».
    try {
      recordAnswer(SCENARIO.tags, ok);
      const me = getCurUser?.();
      track("situation3d.completed", {
        scenario: SCENARIO.id,
        ok,
        faute: v.principale,
        kmh: Math.round(v.vitesseCarrefour),
        regard_droite: v.regarde.droite,
        duree: Math.round(v.chrono),
        user: me?.id ? 1 : 0,
      });
    } catch (e) {
      console.warn("[situation3d] progression", e);
    }

    const texte = ok
      ? SCENARIO.retours.reussi
      : SCENARIO.retours[v.principale] || SCENARIO.regle;

    $(".g3-carte").className = "g3-carte" + (ok ? "" : " rate");
    $(".g3-carte").innerHTML = `
      <div class="g3-verdict">${ok ? "Bien joué" : "À refaire"}</div>
      <h2>${esc(ok ? "Tu as cédé le passage" : titreFaute(v.principale))}</h2>
      <p>${esc(texte)}</p>
      <div class="g3-bilan">
        <span class="${v.regarde.droite ? "ok" : "ko"}">Regard à droite ${v.regarde.droite ? "fait" : "oublié"}</span>
        <span class="${v.vitesseCarrefour <= 25 ? "ok" : "ko"}">${Math.round(v.vitesseCarrefour)} km/h à l'entrée</span>
        <span>${v.chrono.toFixed(1)} s</span>
      </div>
      <div class="g3-actions">
        <button class="g3-rejouer" type="button">Refaire</button>
        <button class="g3-sortir" type="button">Sortir</button>
      </div>`;
    fin.classList.add("on");
    $(".g3-rejouer").addEventListener("click", () => {
      unmount();
      mount(racine);
    });
    $(".g3-sortir").addEventListener("click", () => {
      location.hash = "#/accueil";
    });
  }
}

const MSG_FLASH = {
  trop_vite: "Trop vite",
  refus_priorite: "Elle venait de ta droite",
  pas_regarde_droite: "Tu n'as pas regardé à droite",
  collision: "Collision",
  pas_arrete: "Pas d'arrêt",
};

function titreFaute(code) {
  return (
    {
      collision: "Tu l'as percutée",
      refus_priorite: "Tu es passé devant",
      pas_regarde_droite: "Tu n'as pas regardé à droite",
      trop_vite: "Tu arrives trop vite",
      pas_arrete: "Tu ne t'es pas arrêté",
      trop_long: "Tu es resté sur place",
      hors_route: "Tu as quitté la route",
    }[code] || "Situation manquée"
  );
}

export function unmount() {
  partie?.detruire();
  partie = null;
  if (racine) racine.innerHTML = "";
}
