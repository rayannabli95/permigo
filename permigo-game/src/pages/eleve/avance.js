// « Secondes d'avance » — route #/avance
//
// Trente secondes, une rue, cinq événements. Un seul geste : toucher ce qui
// va poser problème.
//
// 🔴 CE QUI A CHANGÉ LE 10/08. La version précédente ne portait QUE le
// compteur et la route, et un élève qui découvrait le jeu ne savait ni ce
// qu'il cherchait, ni pourquoi toucher, ni ce que « + 2,8 s » voulait dire.
// « Minimaliste ≠ incompréhensible » (Rayan). Donc quatre ajouts, et pas un
// de plus :
//   1. deux phrases au lancement, pendant deux secondes quatre ;
//   2. une micro-phrase par scène, qui dit où poser les yeux ;
//   3. une explication du compteur, UNE SEULE FOIS dans la vie de l'élève ;
//   4. un vrai poste de conduite, parce que « je ne me sens pas au volant »
//      était d'abord un problème de cadrage.

import "./avance.css";
import { creerPartie } from "@/game/avance/moteur.js";
import { niveauPour } from "@/game/avance/scenario.js";

let partie = null;
let racine = null;

const CLE_PARTIES = "permigo.avance.parties";
const CLE_EXPLIQUE = "permigo.avance.explique";

const secondes = (x) => x.toFixed(1).replace(".", ",");
const lire = (cle) => {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
};
const ecrire = (cle, val) => {
  try {
    localStorage.setItem(cle, val);
  } catch {
    /* navigation privée : le jeu marche, la progression ne se garde pas */
  }
};

export async function mount(root) {
  racine = root;
  // Le bandeau cookies mange le bas de l'écran et arrive pendant qu'on
  // découvre le jeu. Le banc n'envoie rien nulle part.
  document.querySelector(".ck-banner")?.remove();
  accueil();
}

function accueil() {
  racine.innerHTML = `
    <div class="av av-accueil">
      <div class="av-marque">
        <h1>Secondes d'avance</h1>
        <p>Une rue. Trente secondes. Vois avant les autres.</p>
      </div>
      <button class="av-go" type="button">Commencer</button>
    </div>`;
  racine.querySelector(".av-go").addEventListener("click", jouer);
}

async function jouer() {
  const parties = Number(lire(CLE_PARTIES) || 0);
  const niveau = niveauPour(parties);
  const expliquer = !lire(CLE_EXPLIQUE);

  racine.innerHTML = `
    <div class="av">
      <div class="av-vue"></div>
      <div class="av-capot" aria-hidden="true"></div>
      <div class="av-gains" aria-hidden="true"></div>
      <div class="av-souffle" aria-hidden="true"></div>
      <p class="av-dire" aria-live="polite"></p>

      <div class="av-poste" aria-hidden="true">
        <div class="av-compteur">
          <b>0,0</b>
          <span>secondes d'avance</span>
        </div>
        <div class="av-volant"></div>
      </div>

      <div class="av-intro" aria-hidden="true">
        <div>
          <strong>Repère le danger avant qu'il n'arrive</strong>
          <em>Touche l'indice dès que tu comprends ce qui va se passer.</em>
        </div>
      </div>

      <div class="av-lecon" aria-hidden="true"></div>
      <div class="av-flash" aria-hidden="true"></div>
      <div class="av-perdu" aria-hidden="true"></div>
      <div class="av-fin"></div>
      <div class="av-charge">…</div>
    </div>`;

  const $ = (s) => racine.querySelector(s);
  const compteur = $(".av-compteur b");
  const gains = $(".av-gains");
  const dire = $(".av-dire");
  const cadre = $(".av");
  let minuteurDire = 0;
  // Le temps de jeu, au demi-tour d'horloge. Il n'est là que pour les tests :
  // un banc qui doit capturer « la scène du cycliste » ne peut pas se fier à
  // la montre, parce qu'un rembobinage suspend le temps du jeu.
  let demiSeconde = -1;

  partie = await creerPartie($(".av-vue"), {
    niveau,
    expliquer,
    sur: (type, d) => {
      if (type === "image") {
        compteur.textContent = secondes(d.avance);
        const s = Math.round(d.t * 2) / 2;
        if (s !== demiSeconde) {
          demiSeconde = s;
          cadre.dataset.t = String(s);
        }
        // ⚠️ La PHASE, pour les vérifications automatiques. Le lint de teinte
        // mesurait à un instant fixe et tombait parfois sur le ralenti d'un
        // incident, qui désature l'image EXPRÈS : il annonçait une dérive de
        // couleur là où le jeu faisait exactement son travail. Un banc d'essai
        // doit pouvoir savoir si la partie roule.
        cadre.dataset.phase = partie?.etat?.phase || "roule";
        return;
      }
      if (type === "amorce") return souffler(d.texte, "amorce", 2900);
      if (type === "relance") return souffler(d.texte, "relance", 3400);
      if (type === "trouve") return trouve(d);
      if (type === "pasencore") return pasEncore(d);
      if (type === "flash") return flash();
      if (type === "rate") return rate(d);
      if (type === "fin") return fin(d);
    },
  });
  $(".av-charge")?.remove();

  // ⭐ Les deux phrases du lancement. Elles s'affichent SUR la route qui
  // défile déjà, pas sur un écran de menu : deux secondes quatre, le temps de
  // lire, et le jeu n'a jamais été interrompu.
  const intro = $(".av-intro");
  intro.classList.add("on");
  setTimeout(() => intro.classList.remove("on"), 2400);

  // La micro-phrase qui dit où regarder. Un seul emplacement pour tout ce qui
  // se dit à l'élève : une consigne et un retour ne doivent jamais s'empiler.
  function souffler(texte, ton, duree) {
    dire.textContent = texte;
    dire.className = `av-dire on av-${ton}`;
    clearTimeout(minuteurDire);
    minuteurDire = setTimeout(() => dire.classList.remove("on"), duree);
  }

  // ⭐ LE MOMENT. Le nombre naît exactement là où le doigt s'est posé, monte
  // de trente pixels et s'efface.
  function trouve(d) {
    const [x, y] = d.ecran;
    const b = document.createElement("b");
    b.className = "av-gain";
    b.textContent = `+ ${secondes(d.gain)} s`;
    b.style.left = `${Math.max(12, Math.min(88, x * 100))}%`;
    b.style.top = `${Math.max(12, Math.min(78, (1 - y) * 100))}%`;
    gains.appendChild(b);
    setTimeout(() => b.remove(), 1400);
    $(".av-compteur").classList.add("on");
    setTimeout(() => $(".av-compteur").classList.remove("on"), 600);
    $(".av-souffle").classList.add("on");
    setTimeout(() => $(".av-souffle").classList.remove("on"), 420);
    dire.classList.remove("on");
    navigator.vibrate?.(12);
    if (d.premier) lecon(d.gain);
  }

  // ⭐ UNE SEULE FOIS DANS LA VIE DE L'ÉLÈVE. Le compteur est le cœur du jeu
  // et il était parfaitement abstrait. Une phrase, à la première réussite,
  // pendant que le monde est suspendu. Ensuite il n'y a plus rien à expliquer.
  function lecon(gain) {
    const l = $(".av-lecon");
    l.innerHTML = `
      <div class="av-lecon-carte">
        <b>+ ${secondes(gain)} s d'avance</b>
        <span>Tu as repéré le danger ${secondes(gain)} secondes avant qu'il devienne évident.</span>
      </div>`;
    l.classList.add("on");
    setTimeout(() => l.classList.remove("on"), 2200);
    ecrire(CLE_EXPLIQUE, "1");
  }

  // « Pas encore ». Le premier ne coûte rien : on veut un joueur qui ose
  // formuler une hypothèse, pas un joueur qui a peur de toucher.
  function pasEncore(d) {
    souffler(
      d.cout ? `Pas encore. − ${secondes(d.cout)} s` : "Pas encore.",
      "note",
      1200,
    );
  }

  function flash() {
    const f = $(".av-flash");
    f.classList.add("on");
    setTimeout(() => f.classList.remove("on"), 520);
  }

  // Le rembobinage. Le temps qu'on avait et qu'on n'a pas pris, et ce qu'il
  // aurait fallu voir. Aucun sermon.
  function rate(d) {
    const p = $(".av-perdu");
    p.innerHTML = `<div><b>${secondes(d.secondes)} s</b><span>${d.indice}</span></div>`;
    p.classList.add("on");
    setTimeout(() => p.classList.remove("on"), 1700);
  }

  function fin(d) {
    ecrire(CLE_PARTIES, String(parties + 1));
    const f = $(".av-fin");
    f.innerHTML = `
      <div class="av-carte">
        <p class="av-total"><b>${secondes(d.avance)}</b><span>secondes d'avance</span></p>
        <p class="av-bilan">${d.trouves} danger${d.trouves > 1 ? "s" : ""} repéré${d.trouves > 1 ? "s" : ""} sur ${d.dangers}</p>
        <button class="av-encore" type="button">Encore</button>
      </div>`;
    f.classList.add("on");
    f.querySelector(".av-encore").addEventListener("click", () => {
      partie?.detruire();
      partie = null;
      jouer();
    });
  }
}

export function unmount() {
  partie?.detruire();
  partie = null;
  if (racine) racine.innerHTML = "";
  racine = null;
}
