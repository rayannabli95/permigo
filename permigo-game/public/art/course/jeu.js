// ═══════════════════════════════════════════════════════════════
// Mise en situation — le moteur.
//
// Le monde tient en deux nombres par pièce : combien de mètres devant la
// voiture (z) et combien de mètres à droite de l'axe (x). La route et les
// véhicules passent par LA MÊME projection (route.js), donc ils ne peuvent
// pas se désaccorder.
//
// Le rythme : on roule, une situation arrive, le temps ralentit le temps du
// choix, on enchaîne SANS écran de résultat. C'est l'enchaînement qui
// accroche, pas la question.
// ═══════════════════════════════════════════════════════════════
import { creerRoute } from "./route.js";

// Encombrement réel des pièces, en mètres. C'est lui qui donne la taille à
// l'écran : rien n'est calé à l'œil.
const LARGEUR = {
  joueur: 1.8,
  gris: 1.85,
  rouge: 1.8,
  camion: 2.45,
  velo: 0.72,
  pieton: 0.66,
};

export const SITUATIONS = [
  {
    id: "pieton",
    acteurs: [{ piece: "pieton", x: -6.6, z: 62, vx: 0.75, vz: 0 }],
    zQ: 38,
    question: "Un piéton descend du trottoir devant toi",
    choix: [
      "Je ralentis et je le laisse passer",
      "Je klaxonne et je continue",
      "Je me déporte à gauche",
    ],
    bonne: 0,
    suite: "freine",
    lecon:
      "Le piéton engagé est prioritaire. On lève le pied avant, pas au dernier moment.",
  },
  {
    id: "velo",
    acteurs: [{ piece: "velo", x: 1.35, z: 58, vx: 0, vz: 3.5 }],
    zQ: 30,
    question: "Un cycliste roule devant toi sur ta voie",
    choix: [
      "Je double en le serrant",
      "Je double en laissant 1,50 m",
      "Je reste derrière jusqu'au village",
    ],
    bonne: 1,
    suite: "gauche",
    lecon:
      "Hors agglomération, on laisse 1,50 m. Si on ne peut pas, on ne double pas.",
  },
  {
    id: "camion",
    acteurs: [{ piece: "camion", x: -3.5, z: 130, vx: 0, vz: -20 }],
    zQ: 75,
    question: "Un poids lourd arrive en face, la route est étroite",
    choix: [
      "Je serre à droite et je ralentis",
      "Je garde ma position",
      "J'accélère pour croiser plus vite",
    ],
    bonne: 0,
    suite: "droite",
    lecon:
      "On se range et on ralentit. Un croisement serré se prépare avant, pas pendant.",
  },
  {
    id: "gris",
    acteurs: [{ piece: "gris", x: 0.1, z: 56, vx: 0, vz: 1 }],
    zQ: 34,
    question: "La voiture devant toi freine sans raison visible",
    choix: [
      "Je colle pour la pousser",
      "Je recule ma distance et j'observe loin",
      "Je double aussitôt",
    ],
    bonne: 1,
    suite: "freine",
    lecon:
      "Elle voit quelque chose que tu ne vois pas encore. On reprend de la distance.",
  },
  {
    // ⭐ La seule situation qui se joue DERRIÈRE. Sans le rétroviseur, elle
    // est impossible à raconter : c'est ça, le besoin d'un deuxième angle.
    id: "colle",
    acteurs: [],
    suiveur: 5,
    zQ: 999, // rien devant : la question part tout de suite
    question: "Une voiture te colle depuis deux kilomètres",
    choix: [
      "Je freine un coup pour la calmer",
      "J'augmente ma distance avec celle de devant",
      "J'accélère pour la semer",
    ],
    bonne: 1,
    suite: "droite",
    lecon:
      "On ne se venge pas au frein. On s'offre de la marge devant, pour n'avoir jamais à freiner fort.",
  },
  {
    id: "rouge",
    acteurs: [{ piece: "rouge", x: -3.5, z: 120, vx: 0, vz: -17 }],
    zQ: 70,
    question: "La voiture d'en face est en pleins phares",
    choix: [
      "Je me mets en pleins phares aussi",
      "Je regarde le bord droit de ma voie",
      "Je fixe ses phares",
    ],
    bonne: 1,
    suite: "droite",
    lecon:
      "On ne regarde jamais la source. On accroche le bord droit, le temps qu'elle passe.",
  },
];

export function creerJeu(hote, { sur = "/art/course", onFin } = {}) {
  hote.innerHTML = `
    <div class="jeu">
      <canvas class="jeu-route"></canvas>
      <div class="jeu-miroir">
        <canvas class="miroir-vue"></canvas>
        <img class="miroir-auto" src="${sur}/c-suiveur.webp" alt="">
      </div>
      <img class="jeu-horizon" src="${sur}/horizon.webp" alt="">
      <div class="jeu-monde"></div>
      <img class="jeu-joueur j-face" src="${sur}/c-joueur.webp" alt="">
      <img class="jeu-joueur j-g" src="${sur}/c-joueur-g.webp" alt="">
      <img class="jeu-joueur j-d" src="${sur}/c-joueur-d.webp" alt="">
      <div class="jeu-flash"></div>
      <div class="jeu-points"></div>
      <div class="jeu-hud">
        <div class="hud-haut">
          <div class="hud-score">0<span>points</span></div>
          <div class="hud-combo off">x1</div>
          <div class="hud-vitesse">0<span>km/h</span></div>
        </div>
        <div class="jeu-carte">
          <div class="carte-jauge"><i></i></div>
          <p class="carte-q"></p>
          <div class="carte-choix"></div>
        </div>
      </div>
    </div>`;

  const $ = (s) => hote.querySelector(s);
  const jeu = $(".jeu");
  const canvas = $(".jeu-route");
  const monde = $(".jeu-monde");
  const carte = $(".jeu-carte");
  const jauge = $(".carte-jauge i");
  const elQ = $(".carte-q");
  const elChoix = $(".carte-choix");
  const elScore = $(".hud-score");
  const elCombo = $(".hud-combo");
  const elVitesse = $(".hud-vitesse");
  const flash = $(".jeu-flash");
  const points = $(".jeu-points");
  const horizon = $(".jeu-horizon");

  // Le décor de bord de route. On le charge sans attendre : le canvas saute
  // simplement ce qui n'est pas encore prêt, et la route démarre tout de suite.
  const images = {};
  for (const n of ["lampe", "arbre"]) {
    const im = new Image();
    im.src = `${sur}/d-${n}.webp`;
    images[n] = im;
  }

  const boite = () => jeu.getBoundingClientRect();
  const r0 = boite();
  const route = creerRoute(canvas, {
    largeur: r0.width,
    hauteur: r0.height,
    images,
  });
  // Le rétroviseur : la SEULE autre caméra dont l'app a besoin. Elle rejoue la
  // même projection en marche arrière, et elle ouvre toute une famille de
  // situations (on te colle, on te double) qu'une vue vers l'avant ne peut pas
  // raconter.
  const miroir = creerRoute($(".miroir-vue"), {
    largeur: r0.width * 0.46,
    hauteur: r0.height * 0.1,
  });
  const suiveur = $(".miroir-auto");
  let zSuiveur = 26;
  const calerHorizon = (h) => (horizon.style.top = route.hy - h * 0.055 + "px");
  calerHorizon(r0.height);

  const etat = {
    vitesse: 0, // m/s
    cible: 14,
    avance: 0, // mètres parcourus
    score: 0,
    combo: 0,
    acteurs: [],
    scene: null,
    attente: false,
    lenteur: 1,
    fini: false,
    curseur: 0,
  };

  // ── Les pièces ────────────────────────────────────────────────
  function poser(a) {
    const el = document.createElement("img");
    el.className = "pion";
    el.src = `${sur}/c-${a.piece}.webp`;
    el.alt = "";
    monde.appendChild(el);
    return { ...a, el };
  }
  function placer(a) {
    // Derrière la caméra ou noyée dans la brume : on ne dessine rien.
    if (a.z < 1.5 || a.z > 150) {
      a.el.style.display = "none";
      return;
    }
    a.el.style.display = "block";
    a.el.style.width = route.parMetre(a.z) * LARGEUR[a.piece] + "px";
    a.el.style.left = route.xDe(a.x, a.z) + "px";
    a.el.style.top = route.yDe(a.z) + "px";
    // Plus c'est près, plus c'est devant : sinon un camion lointain passe
    // par-dessus une voiture proche.
    a.el.style.zIndex = String(Math.max(1, Math.round(200 - a.z)));
  }

  function viderActeurs() {
    etat.acteurs.forEach((a) => a.el.remove());
    etat.acteurs = [];
  }

  // ── Le rythme ─────────────────────────────────────────────────
  function prochaine() {
    if (etat.curseur >= SITUATIONS.length) {
      etat.fini = true;
      carte.classList.remove("on");
      onFin?.({ score: etat.score });
      return;
    }
    const s = SITUATIONS[etat.curseur++];
    etat.scene = s;
    viderActeurs();
    etat.acteurs = s.acteurs.map(poser);
    etat.acteurs.forEach(placer);
    etat.attente = false;
    etat.depuis = 0;
    jeu.classList.remove("gauche", "droite");
  }

  function poserQuestion() {
    const s = etat.scene;
    etat.attente = true;
    elQ.textContent = s.question;
    elChoix.innerHTML = s.choix
      .map((c, i) => `<button type="button" data-i="${i}">${c}</button>`)
      .join("");
    jauge.style.transition = "none";
    jauge.style.transform = "scaleX(1)";
    requestAnimationFrame(() => {
      jauge.style.transition = "transform 9s linear";
      jauge.style.transform = "scaleX(0)";
    });
    carte.classList.add("on");
  }

  function repondre(i) {
    if (!etat.attente) return;
    etat.attente = false;
    const s = etat.scene;
    const bon = i === s.bonne;
    elChoix.querySelectorAll("button").forEach((b, j) => {
      if (j === s.bonne) b.classList.add("bon");
      else if (j === i) b.classList.add("faux");
      b.disabled = true;
    });
    flash.className = "jeu-flash " + (bon ? "bon" : "faux");
    setTimeout(() => (flash.className = "jeu-flash"), 520);

    if (bon) {
      etat.combo++;
      const gain = 100 * Math.min(etat.combo, 5);
      etat.score += gain;
      montrerPoints("+" + gain);
      elCombo.classList.remove("off");
      elCombo.textContent = "x" + Math.min(etat.combo, 5);
      elCombo.classList.add("pop");
      setTimeout(() => elCombo.classList.remove("pop"), 190);
      appliquer(s.suite);
    } else {
      etat.combo = 0;
      elCombo.classList.add("off");
      montrerPoints(s.lecon);
      appliquer("freine");
    }
    elScore.innerHTML = etat.score + "<span>points</span>";

    setTimeout(() => carte.classList.remove("on"), bon ? 700 : 1600);
    setTimeout(prochaine, bon ? 1500 : 2600);
  }

  function appliquer(suite) {
    if (suite === "freine") {
      etat.cible = 4;
      jeu.classList.add("freine");
      setTimeout(() => jeu.classList.remove("freine"), 600);
      setTimeout(() => (etat.cible = 14), 1500);
    } else if (suite === "gauche" || suite === "droite") {
      jeu.classList.add(suite);
      setTimeout(() => jeu.classList.remove(suite), 1700);
    }
  }

  function montrerPoints(txt) {
    points.textContent = txt;
    points.classList.toggle("long", txt.length > 12);
    points.classList.remove("on");
    void points.offsetWidth;
    points.classList.add("on");
  }

  elChoix.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) repondre(+b.dataset.i);
  });

  // ── La boucle ────────────────────────────────────────────────
  let dernier = 0;
  let brut = null;
  let vu = -1;
  function image(t) {
    if (etat.fini) return;
    if (!dernier) dernier = t;
    // 🔴 Le pas de temps se borne : un onglet remis au premier plan renvoie
    // un écart de plusieurs secondes et toute la scène se téléporte.
    const vrai = Math.min(0.05, (t - dernier) / 1000);
    dernier = t;

    // Le RALENTI. Pendant la question le monde tourne à un cinquième de sa
    // vitesse, et la barre laisse neuf secondes. Rayan sur la version d'avant :
    // « y'a pas assez de temps ». Six secondes à trois dixièmes, la scène
    // était sur nous avant qu'on ait fini de lire les trois réponses.
    // sans lui, la scène est derrière nous avant qu'on ait fini de lire. C'est
    // aussi ce qui fait qu'un choix « se joue », au lieu d'être un formulaire.
    etat.lenteur +=
      ((etat.attente ? 0.18 : 1) - etat.lenteur) * Math.min(1, vrai * 5);
    const dt = vrai * etat.lenteur;

    etat.vitesse += (etat.cible - etat.vitesse) * Math.min(1, vrai * 2.2);
    etat.avance += etat.vitesse * dt;
    route.dessiner(etat.avance);

    // Le rétroviseur. On regarde vers l'arrière, donc la route y défile à
    // l'envers : d'où l'avance négative.
    miroir.dessiner(-etat.avance, { decor: false });
    // La voiture derrière se rapproche ou s'éloigne doucement selon la scène.
    const cible = etat.scene?.suiveur ?? 26;
    zSuiveur += (cible - zSuiveur) * Math.min(1, vrai * 0.6);
    const ls = miroir.parMetre(zSuiveur) * 2.1;
    suiveur.style.width = ls + "px";
    suiveur.style.left = miroir.xDe(0, zSuiveur) + "px";
    suiveur.style.top = miroir.yDe(zSuiveur) + "px";

    const kmh = Math.round(etat.vitesse * 3.6);
    if (kmh !== vu) {
      vu = kmh;
      elVitesse.innerHTML = kmh + "<span>km/h</span>";
    }

    for (const a of etat.acteurs) {
      // Un acteur immobile recule quand même : c'est NOUS qui avançons.
      a.z += (a.vz - etat.vitesse) * dt;
      a.x += a.vx * dt;
      placer(a);
    }

    // ⭐ Chaque situation dit à quelle distance elle devient lisible. Un
    // camion se voit de loin, un cycliste non : une distance unique pour
    // toutes donnait soit une question posée sur une route vide, soit une
    // scène déjà passée. C'est un réglage de mise en scène, pas une formule.
    if (etat.scene && !etat.attente) {
      if (!etat.acteurs.length) {
        // Une scène qui se joue derrière n'a personne devant : on laisse
        // juste le temps de voir le rétroviseur se remplir.
        etat.depuis = (etat.depuis || 0) + vrai;
        if (etat.depuis > 2.2) poserQuestion();
      } else {
        const proche = Math.min(...etat.acteurs.map((a) => a.z));
        if (proche < (etat.scene.zQ || 34) && proche > 3) poserQuestion();
      }
    }

    brut = requestAnimationFrame(image);
  }

  function auRedim() {
    const b = boite();
    route.taille(b.width, b.height);
    calerHorizon(b.height);
  }
  window.addEventListener("resize", auRedim);

  prochaine();
  brut = requestAnimationFrame(image);

  return {
    arreter() {
      etat.fini = true;
      window.removeEventListener("resize", auRedim);
      if (brut) cancelAnimationFrame(brut);
    },
  };
}
