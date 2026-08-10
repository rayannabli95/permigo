// Le son. Entièrement SYNTHÉTISÉ : pas un seul fichier à télécharger, rien à
// générer, rien à héberger. Un moteur, du roulement, du vent, des freins et
// quelques impacts, fabriqués avec des oscillateurs et du bruit blanc.
//
// Pourquoi pas des mp3 : un bruit de moteur enregistré est une boucle de
// quelques secondes qu'on entend boucler au bout de dix, et il faut la
// désaccorder en temps réel pour suivre le régime. Ici la fréquence EST le
// régime, donc l'accélération s'entend vraiment.
//
// ⚠️ Un navigateur refuse de sortir du son avant un geste de l'utilisateur.
// Le graphe se construit tout de suite mais le contexte reste suspendu ; on
// le réveille au premier appui, où qu'il soit.

const CLE_MUET = "permigo.son3d";

// Une boîte de vitesses, en m/s. Sans elle le moteur monte tout droit de 0 à
// 130 km/h : c'est une sirène, pas une voiture. Avec, le régime retombe à
// chaque passage et l'oreille reconnaît une auto.
const RAPPORTS = [0, 6.5, 12, 19, 30];

export function creerSon() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return muet();

  let ctx;
  try {
    ctx = new AC();
  } catch {
    return muet();
  }

  // ── Sortie ────────────────────────────────────────────────────────────
  // ⚠️ Un limiteur en bout de chaîne, pas par confort : le moteur, le
  // roulement, le vent et un choc peuvent tomber sur la même image, et la
  // somme dépasse alors 1. Au-delà, un navigateur ne baisse pas le volume,
  // il écrête — ça craque. Le limiteur rattrape ce cas sans qu'on ait à
  // brider chaque voix « au cas où ».
  const limiteur = ctx.createDynamicsCompressor();
  limiteur.threshold.value = -8;
  limiteur.knee.value = 6;
  limiteur.ratio.value = 12;
  limiteur.attack.value = 0.003;
  limiteur.release.value = 0.25;
  limiteur.connect(ctx.destination);

  const sortie = ctx.createGain();
  sortie.gain.value = 0.9;
  sortie.connect(limiteur);

  // ── Le moteur ─────────────────────────────────────────────────────────
  // Deux dents de scie légèrement désaccordées (un seul oscillateur sonne
  // comme un buzzer) plus une quinte au-dessus qui donne le grain.
  const filtreMoteur = ctx.createBiquadFilter();
  filtreMoteur.type = "lowpass";
  filtreMoteur.frequency.value = 400;
  // Un peu de résonance : c'est elle qui fait le grondement plutôt qu'un
  // bourdonnement plat. Trop (Q = 5) et le filtre à lui seul double le
  // signal, ce qui sature avant même d'arriver au limiteur.
  filtreMoteur.Q.value = 3;
  const gainMoteur = ctx.createGain();
  gainMoteur.gain.value = 0;
  filtreMoteur.connect(gainMoteur).connect(sortie);

  // Les trois niveaux font 1 en tout : ce qui entre dans le filtre ne dépasse
  // jamais l'unité, et c'est le gain moteur seul qui décide du volume.
  const oscs = [
    osc("sawtooth", 1, 0.5),
    osc("sawtooth", 1.007, 0.36), // le battement entre les deux fait le grain
    osc("square", 1.5, 0.14),
  ];
  function osc(type, ratio, niveau) {
    const o = ctx.createOscillator();
    o.type = type;
    const g = ctx.createGain();
    g.gain.value = niveau;
    o.connect(g).connect(filtreMoteur);
    o.start();
    return { o, ratio };
  }

  // ── Le bruit (roulement, vent, freins) ────────────────────────────────
  // Une seule source de bruit blanc en boucle, filtrée trois fois. Trois
  // sources coûteraient trois fois plus cher pour le même résultat.
  const bruit = ctx.createBufferSource();
  bruit.buffer = bufferBruit(ctx, 2);
  bruit.loop = true;

  // ⚠️ Q = 0,5 et non 1,1 : un filtre étroit RÉSONNE, c'est-à-dire qu'il
  // chante une note. Deux notes tenues (le moteur et lui) faisaient le bourdon.
  const roulement = voie(bruit, "bandpass", 500, 0.5);
  const vent = voie(bruit, "highpass", 900, 0.7);
  const freins = voie(bruit, "bandpass", 2600, 14);
  bruit.start();

  // L'horloge du son : elle ne sert qu'à faire respirer ce qui, sinon, serait
  // parfaitement stable. C'est la stabilité qui s'entend comme une machine.
  let horloge = 0;

  function voie(source, type, freq, q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    source.connect(f).connect(g).connect(sortie);
    return { f, g };
  }

  // ── Réveil au premier geste ───────────────────────────────────────────
  let reveille = false;
  const reveiller = () => {
    if (reveille) return;
    reveille = true;
    ctx.resume?.();
    retirerEcoutes();
  };
  const evts = ["pointerdown", "keydown", "touchstart"];
  evts.forEach((e) =>
    addEventListener(e, reveiller, { passive: true, capture: true }),
  );
  const retirerEcoutes = () =>
    evts.forEach((e) => removeEventListener(e, reveiller, { capture: true }));

  // ── L'état ────────────────────────────────────────────────────────────
  let coupe = false;
  try {
    coupe = localStorage.getItem(CLE_MUET) === "1";
  } catch {
    /* mode privé : on garde le son */
  }
  appliquerCoupure();

  function appliquerCoupure() {
    sortie.gain.setTargetAtTime(coupe ? 0 : 0.9, ctx.currentTime, 0.03);
  }

  // Une rampe douce partout : écrire directement dans `.value` soixante fois
  // par seconde produit un grésillement (l'escalier s'entend).
  const vers = (param, valeur, tau = 0.05) =>
    param.setTargetAtTime(valeur, ctx.currentTime, tau);

  return {
    get coupe() {
      return coupe;
    },

    basculer(force) {
      coupe = force === undefined ? !coupe : !!force;
      try {
        localStorage.setItem(CLE_MUET, coupe ? "1" : "0");
      } catch {
        /* rien à sauver, tant pis */
      }
      appliquerCoupure();
      return coupe;
    },

    // Appelé une fois par image. `fige` = la manche est finie : tout se tait
    // sauf ce qu'on déclenche explicitement (le choc, par exemple).
    maj(dt, { vitesse = 0, gaz = 0, freinage = 0, fige = false } = {}) {
      if (coupe || ctx.state !== "running") return;
      horloge += dt || 0;

      // Le régime : dans quel rapport on est, et où on en est dedans.
      let i = RAPPORTS.length - 2;
      while (i > 0 && vitesse < RAPPORTS[i]) i--;
      const bas = RAPPORTS[i];
      const haut = RAPPORTS[i + 1];
      const dans = Math.min(1, Math.max(0, (vitesse - bas) / (haut - bas)));
      const regime = fige ? 0 : 0.22 + dans * 0.78;

      // 🔴 « ON DIRAIT UN DRONE, C'EST HORRIBLE. » (Rayan, 10/08) Et c'était
      // mécanique : ce moteur a été réglé pour un jeu où l'on ACCÉLÈRE, où la
      // fréquence raconte la montée en régime. Dans « Secondes d'avance » on
      // roule à 36 km/h constants pendant trente secondes, donc la même note
      // de scie tenait trente secondes. Une note tenue, c'est la définition
      // d'un bourdon.
      //
      // Trois corrections, et la troisième est la vraie :
      //   · le moteur descend à un GRONDEMENT (filtre à 130 Hz au lieu de
      //     260) trois fois moins fort : à cette allure, une voiture moderne
      //     ne s'entend quasiment pas de l'intérieur ;
      //   · sa hauteur RESPIRE de deux pour cent (deux sinusoïdes lentes et
      //     désaccordées). Une fréquence parfaitement stable est ce que
      //     l'oreille appelle « une machine » ;
      //   · ⭐ c'est le ROULEMENT qui mène, pas le moteur. À 36 km/h on entend
      //     les pneus sur le bitume, et un bruit large n'est jamais un bourdon.
      const souffle =
        1 + 0.02 * Math.sin(horloge * 0.7) + 0.012 * Math.sin(horloge * 2.3);
      const f0 = (30 + regime * 120) * souffle;
      for (const { o, ratio } of oscs) vers(o.frequency, f0 * ratio, 0.06);
      vers(filtreMoteur.frequency, 130 + regime * 620 + gaz * 800, 0.08);
      vers(gainMoteur.gain, fige ? 0 : 0.014 + gaz * 0.06 + regime * 0.014);

      // Le roulement monte avec la vitesse, le vent avec son carré. Le filtre
      // est LARGE (Q = 0,5) : à Q = 1,1 il résonnait sur une note et ajoutait
      // son propre bourdon à celui du moteur.
      const vr = fige ? 0 : vitesse;
      const route = 1 + 0.09 * Math.sin(horloge * 1.7 + 0.6); // le grain du bitume
      vers(roulement.g.gain, Math.min(1, vr / 15) * 0.125 * route);
      vers(roulement.f.frequency, 380 + vr * 22, 0.1);
      vers(vent.g.gain, Math.pow(Math.min(1, vr / 24), 2) * 0.1);

      // Les freins ne chantent qu'en ralentissant vraiment, et jamais à
      // l'arrêt : un crissement continu à 3 km/h serait faux et agaçant.
      const crisse =
        !fige && freinage > 0.3 && vr > 2.5
          ? Math.min(1, (vr - 2.5) / 8) * freinage * 0.05
          : 0;
      vers(freins.g.gain, crisse, 0.04);
      vers(freins.f.frequency, 2100 + vr * 45, 0.08);
    },

    // Les ponctuations. Chacune est un son jetable : on le crée, il s'éteint,
    // il se ramasse tout seul.
    jouer(nom) {
      if (coupe || ctx.state !== "running") return;
      const t = ctx.currentTime;
      if (nom === "choc") {
        // Un impact = un coup sourd (une sinus qui plonge) plus un fracas
        // (une salve de bruit filtrée bas).
        pic(ctx, sortie, {
          type: "sine",
          de: 150,
          a: 42,
          duree: 0.5,
          niveau: 0.45,
        });
        salve(ctx, sortie, { duree: 0.35, coupe: 900, niveau: 0.32 });
      } else if (nom === "alerte") {
        pic(ctx, sortie, {
          type: "square",
          de: 420,
          a: 400,
          duree: 0.11,
          niveau: 0.1,
        });
        pic(ctx, sortie, {
          type: "square",
          de: 420,
          a: 400,
          duree: 0.11,
          niveau: 0.1,
          retard: 0.15,
        });
      } else if (nom === "clic") {
        pic(ctx, sortie, {
          type: "triangle",
          de: 1100,
          a: 900,
          duree: 0.05,
          niveau: 0.08,
        });
      } else if (nom === "reussi") {
        [523, 784, 1046].forEach((f, k) =>
          pic(ctx, sortie, {
            type: "triangle",
            de: f,
            a: f,
            duree: 0.3,
            niveau: 0.14,
            retard: k * 0.09,
          }),
        );
      } else if (nom === "rate") {
        pic(ctx, sortie, {
          type: "sawtooth",
          de: 200,
          a: 110,
          duree: 0.4,
          niveau: 0.12,
        });
      }
      return t;
    },

    detruire() {
      retirerEcoutes();
      try {
        oscs.forEach(({ o }) => o.stop());
        bruit.stop();
      } catch {
        /* déjà arrêtés */
      }
      ctx.close?.();
    },
  };
}

// Deux secondes de bruit blanc : assez long pour que la boucle ne s'entende
// pas, assez court pour ne rien peser (352 Ko en mémoire, zéro au chargement).
function bufferBruit(ctx, secondes) {
  const n = Math.floor(ctx.sampleRate * secondes);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// Une note qui glisse d'une fréquence à l'autre et s'éteint.
function pic(ctx, vers, { type, de, a, duree, niveau, retard = 0 }) {
  const t = ctx.currentTime + retard;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(de, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, a), t + duree);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(niveau, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(vers);
  o.start(t);
  o.stop(t + duree + 0.05);
}

// Une salve de bruit qui retombe : le fracas d'un choc.
function salve(ctx, vers, { duree, coupe, niveau }) {
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = bufferBruit(ctx, duree);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(coupe, t);
  f.frequency.exponentialRampToValueAtTime(120, t + duree);
  const g = ctx.createGain();
  g.gain.setValueAtTime(niveau, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  s.connect(f).connect(g).connect(vers);
  s.start(t);
  s.stop(t + duree);
}

// Pas de Web Audio (vieux navigateur, contexte refusé) : le jeu tourne
// exactement pareil, en silence. Aucun appelant n'a à le savoir.
function muet() {
  return {
    coupe: true,
    basculer: () => true,
    maj: () => {},
    jouer: () => {},
    detruire: () => {},
  };
}
