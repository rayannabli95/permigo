// « Secondes d'avance » — route #/avance
//
// Trente secondes, une rue, cinq événements. Un seul geste : toucher ce qui
// va poser problème. L'écran ne porte QUE deux choses : le compteur et la
// route. Tout le reste du jeu se raconte dans l'image.

import "./avance.css";
import { creerPartie } from "@/game/avance/moteur.js";

let partie = null;
let racine = null;

const secondes = (x) => x.toFixed(1).replace(".", ",");

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
      <h1>Vois avant<br>les autres</h1>
      <button class="av-go" type="button">Commencer</button>
    </div>`;
  racine.querySelector(".av-go").addEventListener("click", jouer);
}

async function jouer() {
  racine.innerHTML = `
    <div class="av">
      <div class="av-vue"></div>
      <div class="av-bord" aria-hidden="true"></div>
      <div class="av-compteur">
        <span>secondes d'avance</span>
        <b>0,0</b>
      </div>
      <div class="av-gains" aria-hidden="true"></div>
      <div class="av-souffle" aria-hidden="true"></div>
      <p class="av-note" aria-hidden="true"></p>
      <div class="av-flash" aria-hidden="true"></div>
      <div class="av-perdu" aria-hidden="true"></div>
      <div class="av-fin"></div>
      <div class="av-charge">…</div>
    </div>`;

  const $ = (s) => racine.querySelector(s);
  const compteur = $(".av-compteur b");
  const gains = $(".av-gains");
  const note = $(".av-note");
  let minuteurNote = 0;

  partie = await creerPartie($(".av-vue"), {
    sur: (type, d) => {
      if (type === "image") {
        compteur.textContent = secondes(d.avance);
        return;
      }
      if (type === "trouve") return trouve(d);
      if (type === "pasencore") return pasEncore(d);
      if (type === "flash") return flash();
      if (type === "rate") return rate(d);
      if (type === "fin") return fin(d);
    },
  });
  $(".av-charge")?.remove();

  // ⭐ LE MOMENT. Le nombre naît exactement là où le doigt s'est posé, monte
  // de trente pixels et s'efface. Il n'y a rien d'autre : pas de « bravo »,
  // pas d'étoile, pas de carte. La récompense, c'est que rien n'arrivera.
  function trouve(d) {
    const [x, y] = d.ecran;
    const b = document.createElement("b");
    b.className = "av-gain";
    b.textContent = `+ ${secondes(d.gain)} s`;
    b.style.left = `${Math.max(12, Math.min(88, x * 100))}%`;
    b.style.top = `${Math.max(14, Math.min(80, (1 - y) * 100))}%`;
    gains.appendChild(b);
    setTimeout(() => b.remove(), 1400);
    $(".av-compteur").classList.add("on");
    setTimeout(() => $(".av-compteur").classList.remove("on"), 600);
    $(".av-souffle").classList.add("on");
    setTimeout(() => $(".av-souffle").classList.remove("on"), 420);
    navigator.vibrate?.(12);
  }

  // « Pas encore ». Deux mots, en bas, gris. Le premier ne coûte rien : on
  // veut un joueur qui ose formuler une hypothèse, pas un joueur qui a peur
  // de toucher.
  function pasEncore(d) {
    note.textContent = d.cout
      ? `Pas encore. − ${secondes(d.cout)} s`
      : "Pas encore.";
    note.classList.add("on");
    clearTimeout(minuteurNote);
    minuteurNote = setTimeout(() => note.classList.remove("on"), 1100);
  }

  function flash() {
    const f = $(".av-flash");
    f.classList.add("on");
    setTimeout(() => f.classList.remove("on"), 520);
  }

  // Le rembobinage. Un seul chiffre : le temps qu'on avait et qu'on n'a pas
  // pris. Aucune phrase, aucun sermon.
  function rate(d) {
    const p = $(".av-perdu");
    p.innerHTML = `<b>${secondes(d.secondes)} s</b>`;
    p.classList.add("on");
    setTimeout(() => p.classList.remove("on"), 1600);
  }

  function fin(d) {
    const f = $(".av-fin");
    f.innerHTML = `
      <div class="av-carte">
        <p class="av-total"><b>${secondes(d.avance)}</b><span>secondes d'avance</span></p>
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
