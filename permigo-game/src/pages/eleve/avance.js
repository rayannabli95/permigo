// « Au volant » — route #/avance
//
// Trente secondes, une rue, cinq événements. Un seul geste : toucher ce qui
// va poser problème. Le score s'appelle « secondes d'avance » : c'est la
// MESURE, pas le nom du jeu (12/08 — le jeu entre dans le hub Réviser, et
// « Au volant » dit en deux mots ce qu'on y fait, ce que « Secondes d'avance »
// ne disait qu'à ceux qui avaient déjà joué).
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
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { creerPartie } from "@/game/avance/moteur.js";
import { niveauPour } from "@/game/avance/scenario.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";

let partie = null;
let racine = null;

const CLE_PARTIES = "permigo.avance.parties";
const CLE_EXPLIQUE = "permigo.avance.explique";
const CLE_AVIS = "permigo.avance.avis";

// Le bandeau « bêta » et la sortie. Le jeu est en `position:fixed` par-dessus
// toute l'app : sans croix, l'élève qui arrive depuis le hub n'a que le bouton
// retour du navigateur pour repartir.
const COIFFE = `
  <span class="av-beta" aria-hidden="true">bêta</span>
  <button class="av-sortie" type="button" aria-label="Quitter le jeu">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
  </button>`;

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
  document.body.classList.add("av-plein");
  accueil();
}

function accueil() {
  racine.innerHTML = `
    <div class="av av-accueil">
      ${COIFFE}
      <div class="av-marque">
        <h1>Au volant</h1>
        <p>Une rue · trente secondes · vois avant les autres</p>
      </div>
      <button class="av-go" type="button">Commencer</button>
    </div>`;
  racine.querySelector(".av-go").addEventListener("click", jouer);
  brancherSortie();
}

// Retour au hub. `history.back()` si on vient de l'app (on garde la position
// de défilement du hub), sinon une vraie navigation : on peut arriver ici par
// un lien direct, sans rien derrière.
function brancherSortie() {
  racine.querySelector(".av-sortie")?.addEventListener("click", () => {
    haptic("tap");
    partie?.detruire();
    partie = null;
    if (window.history.length > 1) window.history.back();
    else navigate("/reviser");
  });
}

async function jouer() {
  const parties = Number(lire(CLE_PARTIES) || 0);
  const niveau = niveauPour(parties);
  const expliquer = !lire(CLE_EXPLIQUE);

  racine.innerHTML = `
    <div class="av">
      ${COIFFE}
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
          <em>Touche l'indice dès que tu comprends ce qui va se passer</em>
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

  brancherSortie();

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
        <span>Tu as repéré le danger ${secondes(gain)} secondes avant qu'il devienne évident</span>
      </div>`;
    l.classList.add("on");
    setTimeout(() => l.classList.remove("on"), 2200);
    ecrire(CLE_EXPLIQUE, "1");
  }

  // « Pas encore ». Le premier ne coûte rien : on veut un joueur qui ose
  // formuler une hypothèse, pas un joueur qui a peur de toucher.
  function pasEncore(d) {
    souffler(
      d.cout ? `Pas encore · − ${secondes(d.cout)} s` : "Pas encore",
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
    // ⭐ L'AVIS SE DEMANDE ICI ET NULLE PART AILLEURS. C'est la seule seconde
    // de la vie de l'élève où il a un avis sur ce jeu et où il n'est pas
    // occupé à jouer. Et une seule fois : passé son premier avis, on ne
    // redemande plus (un formulaire à chaque partie ferait fuir).
    const dejaDonne = !!lire(CLE_AVIS);
    f.innerHTML = `
      <div class="av-carte">
        <p class="av-total"><b>${secondes(d.avance)}</b><span>secondes d'avance</span></p>
        <p class="av-bilan">${d.trouves} danger${d.trouves > 1 ? "s" : ""} repéré${d.trouves > 1 ? "s" : ""} sur ${d.dangers}</p>
        ${dejaDonne ? "" : blocAvis()}
        <button class="av-encore" type="button">Encore</button>
      </div>`;
    f.classList.add("on");
    if (!dejaDonne) brancherAvis(f, d);
    f.querySelector(".av-encore").addEventListener("click", () => {
      partie?.detruire();
      partie = null;
      jouer();
    });
  }

  // La note de 1 à 5, puis le mot libre. Les étoiles sont le CTA : rien
  // d'autre n'apparaît tant qu'on n'en a pas touché une, parce qu'un
  // formulaire complet posé sur un écran de fin ne se remplit jamais.
  function blocAvis() {
    const etoile = (n) => `
      <button class="av-note" type="button" data-note="${n}" aria-label="${n} sur 5">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"/></svg>
      </button>`;
    return `
      <div class="av-avis">
        <p class="av-avis-t">Ce jeu est en bêta · ton avis le fait avancer</p>
        <div class="av-notes" role="group" aria-label="Note de 1 à 5">${[1, 2, 3, 4, 5].map(etoile).join("")}</div>
        <p class="av-mot" aria-live="polite">Mets une note</p>
        <div class="av-suite">
          <textarea class="av-texte" rows="2" maxlength="600" placeholder="Ce qui t'a plu · ce qui manque"></textarea>
          <button class="av-envoi" type="button">Envoyer mon avis</button>
        </div>
      </div>`;
  }

  function brancherAvis(f, d) {
    const MOTS = ["", "Bof", "Moyen", "Pas mal", "Très bien", "Excellent"];
    const bloc = f.querySelector(".av-avis");
    const mot = f.querySelector(".av-mot");
    let note = 0;

    f.querySelectorAll(".av-note").forEach((b) => {
      b.addEventListener("click", () => {
        note = Number(b.dataset.note);
        f.querySelectorAll(".av-note").forEach((o) =>
          o.classList.toggle("on", Number(o.dataset.note) <= note),
        );
        mot.textContent = MOTS[note];
        bloc.classList.add("choisi");
        navigator.vibrate?.(10);
      });
    });

    f.querySelector(".av-envoi").addEventListener("click", async (e) => {
      if (!note) return;
      const bouton = e.currentTarget;
      const texte = f.querySelector(".av-texte").value.trim();
      bouton.disabled = true;
      bouton.textContent = "Envoi…";
      const me = getCurUser();
      let erreur = null;
      try {
        const { error } = await sb.from("jeu_avis").insert({
          user_id: me?.id || null,
          jeu: "avance",
          note,
          texte: texte || null,
          contexte: {
            avance: d.avance,
            trouves: d.trouves,
            dangers: d.dangers,
            partie: parties + 1,
            niveau,
          },
        });
        erreur = error;
      } catch (err) {
        erreur = err;
      }
      if (erreur) {
        // On ne dit pas merci pour un avis qui n'est jamais parti.
        bouton.disabled = false;
        bouton.textContent = "Réessayer";
        mot.textContent = "Ton avis n'est pas parti";
        return;
      }
      ecrire(CLE_AVIS, String(note));
      bloc.innerHTML = `<p class="av-merci">Merci · c'est noté</p>`;
    });
  }
}

export function unmount() {
  partie?.detruire();
  partie = null;
  document.body.classList.remove("av-plein");
  if (racine) racine.innerHTML = "";
  racine = null;
}
