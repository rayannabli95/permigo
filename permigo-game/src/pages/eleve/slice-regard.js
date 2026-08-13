// Le banc d'essai du regard. Trois scènes, trois compétences, et rien autour.
//
// Route : #/slice   ·   #/slice?regard=gyro&action=designer&retour=minimal
//
// 🔴 Ce n'est pas un écran de PermiGo. C'est un instrument de mesure. Il n'y a
// ni score, ni points, ni volants, ni progression, ni retour à l'accueil. Il
// répond à une seule question, celle de Rayan le 09/08 :
//
//   après cinq minutes, un élève cherche-t-il le danger plus tôt dans une
//   situation qu'il n'a jamais vue ?
//
// COMPLEXE DERRIÈRE. ÉVIDENT DEVANT. Tout ce que le moteur mesure reste
// invisible : le joueur voit une rue, et il pense « attends, y'a quelque
// chose à droite ».

import "./slice-regard.css";
import { esc } from "@/utils/escape.js";
import {
  lireReglages,
  ecrireReglages,
  CHOIX,
  AXES,
} from "@/game/slice/reglages.js";
import {
  SCENES,
  TRANSFERT,
  FAMILLES,
  tirerManche,
} from "@/game/slice/scenes.js";
import {
  creerJournal,
  telecharger,
  toutEffacer,
} from "@/game/slice/journal.js";

let banc = null;
let racine = null;
let R = null;
let journal = null;
let etat = null;

export async function mount(root) {
  racine = root;
  // 🔴 Le bandeau cookies mange le tiers bas de l'écran, c'est-à-dire
  // exactement la zone de frein, et il apparaît pendant qu'un élève découvre
  // le jeu sans un mot d'explication. Le banc d'essai n'envoie rien nulle
  // part : il n'a rien à faire consentir.
  document.querySelector(".ck-banner")?.remove();
  R = lireReglages();
  journal = creerJournal(R);
  etat = { manche: 0, vues: [], resultats: [], enCours: false };
  accueil();
}

// ── L'écran de départ ────────────────────────────────────────────────────
// Un bouton. C'est tout ce que l'élève doit voir. Le réglage des versions est
// derrière une roue dentée, pour l'observateur, jamais pour lui.
function accueil() {
  racine.innerHTML = `
    <div class="sl">
      <div class="sl-accueil">
        <p class="sl-marque">PermiGo</p>
        <h1>Conduis. Regarde.</h1>
        <button class="sl-go" type="button">Commencer</button>
        <button class="sl-reglages" type="button" aria-label="Réglages du test">⚙</button>
      </div>
    </div>`;
  racine.querySelector(".sl-go").addEventListener("click", demarrer);
  racine.querySelector(".sl-reglages").addEventListener("click", panneau);
}

async function demarrer() {
  racine.innerHTML = `
    <div class="sl">
      <div class="sl-vue"></div>
      <div class="sl-charge">…</div>
      <div class="sl-carte" hidden></div>
      <div class="sl-alerte" hidden></div>
    </div>`;
  const vue = racine.querySelector(".sl-vue");

  const { creerBanc } = await import("@/game/slice/moteur.js");
  banc = await creerBanc(vue, R);

  // Le gyroscope demande une autorisation, et elle ne s'obtient qu'à la
  // suite d'un geste. 🔴 Si elle échoue et que personne ne le voit, on
  // enregistre des chiffres qui ressemblent à des vrais.
  const perm = await banc.demanderPermission();
  if (perm === "refuse" || perm === "absent") {
    const a = racine.querySelector(".sl-alerte");
    a.textContent =
      "Le téléphone ne donne pas son orientation. Cette version ne peut pas être testée ici.";
    a.hidden = false;
  }

  // Une poignée pour les bancs d'essai automatisés et pour régler une
  // distance depuis la console. La page normale n'expose rien.
  if (/(?:\?|&)debug=1/.test(location.hash + location.search))
    window.__slice = { banc, journal, etat, R, SCENES, TRANSFERT };

  racine.querySelector(".sl-charge")?.remove();
  manche();
}

// ── Une manche : trois scènes, une par compétence ────────────────────────
async function manche() {
  etat.manche++;
  etat.resultats = [];

  // ⭐⭐⭐ La scène de transfert tombe SANS PRÉVENIR. Elle n'est annoncée
  // par rien, elle ne ressemble à rien de ce qu'il a vu, et c'est la seule
  // mesure qui sépare la mémoire de l'apprentissage.
  const liste = tirerManche(FAMILLES, etat.vues, etat.manche - 1);
  if (etat.manche === R.mancheAvantTransfert) liste.push(TRANSFERT);

  for (const s of liste) {
    etat.vues.push(s.id);
    const { resultat, rate, attendre } = await banc.jouer(s);
    const enregistre = await journal.noter(resultat);
    etat.resultats.push(enregistre);
    await retour(resultat, rate, attendre);
  }
  finManche();
}

// ── TEST 3 · ce qu'on raconte, et quand ──────────────────────────────────
// A une phrase à chaque fois · B une phrase si erreur · C presque rien.
//
// ⭐ L'hypothèse à casser : « Tu es passé. Tu ne pouvais pas savoir. » est
// peut-être forte PARCE QU'ELLE EST RARE. Répétée toutes les dix secondes,
// elle devient une notification.
function retour(resultat, rate, attendre) {
  const montrer = R.retour === "toujours" || (R.retour === "erreur" && rate);
  const carte = racine.querySelector(".sl-carte");

  return new Promise((suite) => {
    let minuteur = 0;
    let fini = false;
    const fermer = () => {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      carte.hidden = true;
      carte.classList.remove("on");
      carte.removeEventListener("click", fermer);
      suite();
    };

    // Version minimale : on laisse la conséquence se jouer, l'anneau dit ce
    // qu'il y avait à voir, et on enchaîne sans un mot.
    if (!montrer) {
      minuteur = setTimeout(fermer, Math.max(140, attendre * 1000));
      return;
    }

    // La carte n'apparaît qu'APRÈS la conséquence : la phrase commente ce
    // qu'on vient de voir, elle ne le remplace pas.
    const v = resultat.verdict;
    minuteur = setTimeout(() => {
      carte.className = `sl-carte ${v.cas}${v.tard ? " tard" : ""}`;
      carte.innerHTML = `<p>${esc(v.phrase || "")}</p>`;
      carte.hidden = false;
      requestAnimationFrame(() => carte.classList.add("on"));
      carte.addEventListener("click", fermer);
      minuteur = setTimeout(fermer, R.dureePhrase * 1000);
    }, attendre * 1000);
  });
}

// ── La fin d'une manche ──────────────────────────────────────────────────
// Un seul bouton, et on ne propose JAMAIS de rejouer à voix haute. Le délai
// entre l'apparition du bouton et l'appui est une mesure : c'est l'envie,
// constatée au lieu d'être déclarée.
function finManche() {
  const carte = racine.querySelector(".sl-carte");
  carte.className = "sl-carte sl-fin on";
  carte.innerHTML = `<button class="sl-encore" type="button">Encore</button>`;
  carte.hidden = false;
  const t0 = performance.now();

  carte.querySelector(".sl-encore").addEventListener("click", () => {
    const delai = (performance.now() - t0) / 1000;
    // ⚠️ On complète les enregistrements DÉJÀ écrits. La copie en base ne
    // portera pas ce champ (elle n'est qu'un filet de sécurité) ; l'export,
    // qui est ce qu'on lit vraiment, part de la liste en mémoire.
    for (const e of etat.resultats)
      e.apres = {
        rejoueImmediatement: delai < 4,
        delaiAvantEncore: +delai.toFixed(2),
      };
    carte.hidden = true;
    carte.classList.remove("on");
    manche();
  });
}

// ── Le panneau de l'observateur ──────────────────────────────────────────
// Il n'est jamais montré à l'élève. Il sert à passer d'une version à l'autre
// entre deux élèves, et à sortir les données.
function panneau() {
  const d = document.createElement("div");
  d.className = "sl-panneau";
  d.innerHTML = `
    <div class="sl-feuille">
      <h2>Version testée</h2>
      ${AXES.map(
        (axe) => `
        <fieldset>
          <legend>${esc(TITRES[axe])}</legend>
          ${CHOIX[axe]
            .map(
              ([val, lib]) => `
            <label class="${R[axe] === val ? "on" : ""}">
              <input type="radio" name="${axe}" value="${val}" ${R[axe] === val ? "checked" : ""}>
              <span>${esc(lib)}</span>
            </label>`,
            )
            .join("")}
        </fieldset>`,
      ).join("")}
      <p class="sl-lien">Lien direct · <code>#/slice?regard=${R.regard}&amp;action=${R.action}&amp;retour=${R.retour}</code></p>
      <div class="sl-boutons">
        <button class="sl-export" type="button">Exporter les mesures</button>
        <button class="sl-vider" type="button">Tout effacer</button>
        <button class="sl-fermer" type="button">Fermer</button>
      </div>
    </div>`;
  racine.appendChild(d);

  d.addEventListener("change", (e) => {
    if (!e.target.name) return;
    R = ecrireReglages({ [e.target.name]: e.target.value });
    d.remove();
    panneau();
  });
  d.querySelector(".sl-export").addEventListener("click", () => {
    const f = journal.fichier();
    telecharger(f, `permigo-slice-${f.version}-${journal.session}.json`);
  });
  d.querySelector(".sl-vider").addEventListener("click", async () => {
    await toutEffacer();
    d.querySelector(".sl-vider").textContent = "Effacé";
  });
  d.querySelector(".sl-fermer").addEventListener("click", () => d.remove());
}

const TITRES = {
  regard: "Comment on regarde",
  action: "Comment on ralentit",
  retour: "Ce qu'on raconte",
};

export function unmount() {
  banc?.detruire();
  banc = null;
  if (racine) racine.innerHTML = "";
  racine = null;
}

// Exposé pour les bancs d'essai automatisés : ils rejouent une scène et
// lisent les mesures sans passer par l'interface.
export const __banc = {
  get partie() {
    return banc;
  },
  get journal() {
    return journal;
  },
  SCENES,
  TRANSFERT,
};
