// ═══════════════════════════════════════════════════════════════
// Mise en situation — le moteur.
//
// Le monde tient en deux nombres par pièce : combien de mètres devant la
// voiture (z) et combien de mètres à droite de l'axe (x). Tout le reste
// (taille à l'écran, hauteur, recouvrement) est calculé par le navigateur,
// parce que les pièces sont posées sur un plan basculé en 3D.
//
// Le rythme : on roule, une situation arrive, la question monte, l'élève a
// quelques secondes, on enchaîne SANS écran de résultat. C'est l'enchaînement
// qui accroche, pas la question.
// ═══════════════════════════════════════════════════════════════

const M_PAR_PX = 80; // 80 px du plan = 1 mètre
const LARGEUR = {
  joueur: 1.8,
  gris: 1.85,
  rouge: 1.8,
  camion: 2.45,
  velo: 0.7,
  pieton: 0.62,
};

// Les situations. `arrive` place les acteurs, `bonne` est l'index de la
// bonne réponse, `suite` dit ce que la voiture fait quand on a bien répondu.
export const SITUATIONS = [
  {
    id: "pieton",
    acteurs: [{ piece: "pieton", x: -6.4, z: 54, vx: 1.1, vz: 0 }],
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
    acteurs: [{ piece: "velo", x: 1.05, z: 52, vx: 0, vz: 3.5 }],
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
    acteurs: [{ piece: "camion", x: -3.5, z: 120, vx: 0, vz: -22 }],
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
    acteurs: [{ piece: "gris", x: 0, z: 50, vx: 0, vz: 0.5 }],
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
    id: "rouge",
    acteurs: [{ piece: "rouge", x: -3.5, z: 110, vx: 0, vz: -18 }],
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
      <div class="jeu-ciel"></div>
      <img class="jeu-horizon" src="${sur}/horizon.webp" alt="">
      <div class="jeu-camera">
        <div class="jeu-sol"></div>
        <div class="jeu-brume"></div>
        <div class="jeu-teinte"></div>
      </div>
      <div class="jeu-phares"></div>
      <img class="jeu-joueur" src="${sur}/c-joueur.webp" alt="">
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
  const sol = $(".jeu-sol");
  const cam = $(".jeu-camera");
  const carte = $(".jeu-carte");
  const jauge = $(".carte-jauge i");
  const elQ = $(".carte-q");
  const elChoix = $(".carte-choix");
  const elScore = $(".hud-score");
  const elCombo = $(".hud-combo");
  const elVitesse = $(".hud-vitesse");
  const flash = $(".jeu-flash");
  const points = $(".jeu-points");

  const etat = {
    vitesse: 0, // m/s
    cible: 14,
    defile: 0,
    score: 0,
    combo: 0,
    acteurs: [],
    scene: null,
    attente: false,
    lenteur: 1,
    fini: false,
    reste: 0,
    ordre: SITUATIONS.map((_, i) => i),
    curseur: 0,
  };

  // ── Les pièces posées sur le sol ──────────────────────────────
  function poser(a) {
    const el = document.createElement("div");
    el.className = "pion";
    const px = LARGEUR[a.piece] * M_PAR_PX;
    el.style.setProperty("--ombre", px * 1.05 + "px");
    el.innerHTML = `<img src="${sur}/c-${a.piece}.webp" alt="" style="width:${px}px">`;
    sol.appendChild(el);
    return { ...a, el };
  }
  function placer(a) {
    a.el.style.setProperty("--x", a.x.toFixed(2));
    a.el.style.setProperty("--z", a.z.toFixed(2));
    // Au-delà de l'horizon utile, on n'affiche rien : sinon une pièce à 120 m
    // devient un pixel qui scintille au ras de la brume.
    a.el.style.opacity = a.z > 130 || a.z < -14 ? "0" : "1";
  }

  function viderActeurs() {
    etat.acteurs.forEach((a) => a.el.remove());
    etat.acteurs = [];
  }

  // ── Le rythme ─────────────────────────────────────────────────
  function prochaine() {
    if (etat.curseur >= etat.ordre.length) {
      etat.fini = true;
      carte.classList.remove("on");
      onFin?.({ score: etat.score });
      return;
    }
    const s = SITUATIONS[etat.ordre[etat.curseur++]];
    etat.scene = s;
    viderActeurs();
    etat.acteurs = s.acteurs.map(poser);
    etat.acteurs.forEach(placer);
    etat.attente = false;
    jeu.classList.remove("gauche", "droite");
  }

  function poserQuestion() {
    const s = etat.scene;
    etat.attente = true;
    etat.reste = 5;
    elQ.textContent = s.question;
    elChoix.innerHTML = s.choix
      .map((c, i) => `<button type="button" data-i="${i}">${c}</button>`)
      .join("");
    jauge.style.transition = "none";
    jauge.style.transform = "scaleX(1)";
    requestAnimationFrame(() => {
      jauge.style.transition = "transform 5s linear";
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

    // Pas d'écran de résultat. La carte redescend, la route reprend, la
    // situation suivante arrive. On ne repose jamais le téléphone.
    setTimeout(() => carte.classList.remove("on"), bon ? 700 : 1500);
    setTimeout(prochaine, bon ? 1400 : 2400);
  }

  function appliquer(suite) {
    if (suite === "freine") {
      etat.cible = 4;
      jeu.classList.add("freine");
      setTimeout(() => jeu.classList.remove("freine"), 600);
      setTimeout(() => (etat.cible = 14), 1400);
    } else if (suite === "gauche" || suite === "droite") {
      jeu.classList.add(suite);
      setTimeout(() => jeu.classList.remove(suite), 1600);
    }
  }

  function montrerPoints(txt) {
    points.textContent = txt;
    points.style.fontSize = txt.length > 12 ? "15px" : "34px";
    points.style.maxWidth = "78%";
    points.style.textAlign = "center";
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
  function image(t) {
    if (etat.fini) return;
    if (!dernier) dernier = t;
    // 🔴 Le pas de temps se borne : un onglet remis au premier plan renvoie
    // un écart de plusieurs secondes et toute la scène se téléporte.
    const vrai = Math.min(0.05, (t - dernier) / 1000);
    dernier = t;

    // Le RALENTI. Pendant la question le monde tourne au quart de sa vitesse :
    // sans lui, la scène est derrière nous avant qu'on ait fini de lire. C'est
    // aussi ce qui fait qu'un choix « se joue », au lieu d'être un formulaire.
    etat.lenteur +=
      ((etat.attente ? 0.30 : 1) - etat.lenteur) * Math.min(1, vrai * 5);
    const dt = vrai * etat.lenteur;

    etat.vitesse += (etat.cible - etat.vitesse) * Math.min(1, vrai * 2.2);
    etat.defile += etat.vitesse * dt * M_PAR_PX;
    sol.style.backgroundPositionY = etat.defile + "px";
    elVitesse.innerHTML = Math.round(etat.vitesse * 3.6) + "<span>km/h</span>";

    for (const a of etat.acteurs) {
      // Un acteur immobile recule quand même : c'est NOUS qui avançons.
      a.z += (a.vz - etat.vitesse) * dt;
      a.x += a.vx * dt;
      placer(a);
    }

    // La question monte dès que la situation est LISIBLE, pas quand elle est
    // sur nous : à 50 km/h, 26 m tiennent en moins de deux secondes.
    if (etat.scene && !etat.attente && etat.acteurs.length) {
      const proche = Math.min(...etat.acteurs.map((a) => a.z));
      if (proche < 34 && proche > 3) poserQuestion();
    }

    brut = requestAnimationFrame(image);
  }

  prochaine();
  brut = requestAnimationFrame(image);

  return {
    arreter() {
      etat.fini = true;
      if (brut) cancelAnimationFrame(brut);
    },
  };
}
