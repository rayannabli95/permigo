// L'ARCHITECTURE DE PERMIGO — une grammaire, et du RELIEF.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §6 (bâtiments) et §5 (matières).
//
// ⭐ ON N'ÉCRIT PAS « UN IMMEUBLE », ON ÉCRIT UNE LANGUE :
//
//     SOCLE + (BANDEAU + TRAVÉES) × n + CORNICHE + COURONNE
//
// Chaque terme a deux ou trois variantes, la variété vient de la COMBINAISON,
// et un agent peut étendre le vocabulaire sans jamais modéliser.
//
// 🔴 CE QUI A CHANGÉ LE 10/08, ET POURQUOI C'ÉTAIT LE VRAI DÉFAUT.
//
// La version précédente posait UN plan par façade, avec la fenêtre PEINTE
// dedans. Verdict de Rayan, et il avait raison : « ça fait blocs, les
// matériaux sont plats, les volumes simplifiés ». La cause n'était pas la
// méthode (des primitives peintes, c'est le bon choix), c'était que je
// m'étais arrêté au premier niveau de cette méthode. Une fenêtre plate ne
// projette pas d'ombre ; sans ombre, un mur n'a pas d'épaisseur ; sans
// épaisseur, un immeuble reste une boîte coloriée. Aucun réglage de lumière
// ne rattrape ça.
//
// Ce fichier ajoute donc la MODÉNATURE — le mot d'architecte pour « tout ce
// qui dépasse du nu du mur » : encadrement saillant, appui, bandeau d'étage,
// double corniche, volets, garde-corps à barreaux. Chaque pièce fait quelques
// centimètres de saillie et projette une vraie ombre au soleil de seize
// heures. C'est ce jeu d'ombres, et rien d'autre, qui sépare une façade d'un
// autocollant.
//
// ⭐ ET ÇA NE COÛTE RIEN, parce que tout passe par le banc d'instances : neuf
// cents fenêtres tiennent en un ordre de dessin. Le détail était bridé par un
// budget, pas par la machine (cf. `instances.js`).

import { FACADES, COMMERCES, jitter, lisere, assombrir } from "./palette.js";
import { platre, vitrage } from "./textures.js";
import { CUBE, PLAN, CADRE, BARREAU } from "./instances.js";

const ETAGE = 3.1;
const SOCLE = 3.3;
const PROF = 11;

// Les volets : la touche la plus française de la rue, et l'accent de couleur
// le moins cher. Toujours plus saturés que le mur, jamais dans la teinte du
// mur : c'est ce contraste qui rythme une façade.
// ⚠️ Éclaircis d'un quart le 10/08 : plus sombres, ils ressortaient en
// rectangles NOIRS à trente mètres et mitraillaient la façade de trous.
const VOLETS = [0x5c8ba6, 0x6f9a80, 0xa8705c, 0x74748f, 0xb08f5c, 0x577a94];
// Zinc, ardoise et tuile. Trois valeurs très différentes, parce que la ligne
// de toits est la silhouette qu'on regarde le plus longtemps en roulant.
const TOITURES = [0x6e6f76, 0x4a4b55, 0x8a5b4a, 0x5f6068];

let MATS = null;
function materiaux(THREE) {
  if (MATS) return MATS;
  const std = (o) =>
    new THREE.MeshStandardMaterial({
      metalness: 0,
      envMapIntensity: 0.4,
      ...o,
    });
  const carte = platre(THREE);
  MATS = {
    // ⚠️ Blanc. La couleur arrive par copie (`instanceColor`), donc UN seul
    // ordre de dessin sert les six familles de la palette. C'est ce qui
    // remplace les six textures teintées d'avant.
    mur: std({ map: carte, color: 0xffffff, roughness: 0.93 }),
    pierre: std({ color: 0xffffff, roughness: 0.82 }),
    verre: new THREE.MeshStandardMaterial({
      map: vitrage(THREE),
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.35,
      envMapIntensity: 1.7,
    }),
    bois: std({ color: 0xffffff, roughness: 0.72 }),
    metal: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.44,
      metalness: 0.55,
      envMapIntensity: 0.9,
    }),
    toit: std({ color: 0xffffff, roughness: 0.88 }),
  };
  return MATS;
}

/**
 * Un immeuble, posé directement dans le banc d'instances.
 *
 * @param cote     +1 = trottoir de droite, -1 = celui de gauche
 * @param xFacade  l'abscisse du NU DU MUR, côté rue
 * @param z0 / z1  les deux bouts de la parcelle (z0 > z1)
 */
export function batiment(
  THREE,
  banc,
  {
    cote = 1,
    xFacade = 9,
    z0 = 0,
    z1 = -9,
    etages = 3,
    famille = 0,
    alea,
    commerce = false,
  },
) {
  const M = materiaux(THREE);
  const cube = CUBE(THREE);
  const plan = PLAN(THREE);
  // `vers` = la direction qui va du mur vers la rue. Tout ce qui SAILLIT part
  // dans ce sens ; c'est la seule variable d'orientation du fichier.
  const vers = -cote;
  const cadre = CADRE(THREE, vers);
  const largeur = z0 - z1;
  const zc = (z0 + z1) / 2;
  const couleur = jitter(FACADES[famille % FACADES.length], alea);
  const hCorps = SOCLE + ETAGE * etages;
  const seg = { segmente: true };

  // Une boîte aux cotes voulues : profondeur (X), hauteur (Y), largeur (Z),
  // posée par son DESSOUS. Toutes les boîtes de pierre du quartier partagent
  // le même lot, donc le même ordre de dessin.
  const bloc = (c, prof, haut, larg, x, yBas, z) => {
    const p = banc.neuf();
    p.position.set(x, yBas + haut / 2, z);
    p.scale.set(prof, haut, larg);
    banc.poser("pierre", cube, M.pierre, c, seg);
  };

  // ── LA MASSE ──────────────────────────────────────────────────────────
  // Reculée de trois centimètres : les panneaux de mur se posent devant, et
  // deux surfaces exactement coplanaires clignotent.
  // ⚠️ Habillée de plâtre et non d'un aplat : ses faces LATÉRALES sont des
  // murs aveugles, et il y en a un en pleine vue à chaque angle de carrefour.
  // En couleur pure, un pignon de onze mètres est une dalle ; avec le dégradé
  // vertical de la texture, c'est un mur.
  {
    const p = banc.neuf();
    p.position.set(xFacade + cote * (PROF / 2 + 0.03), hCorps / 2, zc);
    p.scale.set(PROF, hCorps, largeur);
    banc.poser("masse", cube, M.mur, assombrir(couleur, 0.14), seg);
  }

  // ── LES ÉTAGES ────────────────────────────────────────────────────────
  const travees = Math.max(2, Math.round(largeur / 3));
  const w = largeur / travees;
  const wl = Math.min(1.3, w * 0.44); // la largeur de baie
  const wh = 1.62; // sa hauteur
  const volets = alea() < 0.55;
  const teinteVolet =
    VOLETS[Math.floor(alea() * VOLETS.length) % VOLETS.length];
  const pierre = lisere(couleur, 0.22);

  // ⭐ L'ENCORBELLEMENT (le « bow-window »). Une travée sur trois immeubles
  // avance de quatre-vingts centimètres sur toute la hauteur des étages.
  //
  // C'est la réponse au « les volumes sont simplifiés » : tant que chaque
  // immeuble est un pavé aligné sur le même nu, la rue reste un ruban, quelle
  // que soit la finesse des fenêtres. Un seul volume qui sort du plan casse
  // l'alignement, projette une grande ombre verticale sur ses voisins et donne
  // enfin une profondeur à la façade. Trois copies par immeuble.
  const SAILLIE = 0.8;
  const orielT = alea() < 0.34 ? Math.floor(alea() * travees) : -1;
  const orielHaut = etages - 1;
  const sortie = (t, e) =>
    t === orielT && e >= 1 && e <= orielHaut ? SAILLIE : 0;

  if (orielT >= 0) {
    const zo = z0 - (orielT + 0.5) * w;
    const yA = SOCLE + ETAGE;
    const hO = ETAGE * (orielHaut - 1 + 1);
    // Le coffre lui-même : c'est lui qui porte les joues latérales.
    bloc(
      assombrir(couleur, 0.04),
      SAILLIE,
      hO,
      w * 0.9,
      xFacade + vers * (SAILLIE / 2),
      yA,
      zo,
    );
    // Le dessous mouluré, et le petit toit qui le coiffe. Sans eux, le coffre
    // a l'air d'un tiroir mal fermé.
    bloc(
      pierre,
      SAILLIE + 0.16,
      0.16,
      w * 0.98,
      xFacade + vers * (SAILLIE / 2),
      yA - 0.16,
      zo,
    );
    bloc(
      pierre,
      SAILLIE + 0.2,
      0.14,
      w * 1.0,
      xFacade + vers * (SAILLIE / 2),
      yA + hO,
      zo,
    );
  }

  for (let e = 0; e < etages; e++) {
    const y0 = SOCLE + e * ETAGE;

    // ⭐ LE BANDEAU D'ÉTAGE. Une réglette de douze centimètres qui court sur
    // toute la largeur, à chaque plancher. C'est la pièce la plus rentable de
    // tout le fichier : elle porte une ombre horizontale nette sur le mur du
    // dessous, et une façade cesse d'être un panneau pour devenir un
    // empilement d'étages. Coût : une copie.
    bloc(pierre, 0.16, 0.13, largeur, xFacade + vers * 0.08, y0 - 0.06, zc);

    for (let t = 0; t < travees; t++) {
      const zt = z0 - (t + 0.5) * w;
      // Le nu de CETTE travée : celle qui porte l'encorbellement avance de
      // quatre-vingts centimètres, et tout ce qu'elle contient avec elle.
      const xf = xFacade + vers * sortie(t, e);

      // Le panneau de mur : plan unitaire, teinté par copie.
      {
        const p = banc.neuf();
        p.position.set(xf + vers * 0.005, y0 + ETAGE / 2, zt);
        p.rotation.y = vers > 0 ? Math.PI / 2 : -Math.PI / 2;
        p.scale.set(w, ETAGE, 1);
        banc.poser("mur", plan, M.mur, couleur, {
          segmente: true,
          ombre: false,
        });
      }

      const yc = y0 + ETAGE * 0.54;

      // L'encadrement saillant, percé : la lèvre qui fait l'ombre.
      {
        const p = banc.neuf();
        p.position.set(xf, yc, zt);
        p.scale.set(1, wh, wl);
        banc.poser(`cadre${vers}`, cadre, M.pierre, pierre, seg);
      }
      // La vitre, en retrait de cinq centimètres derrière la lèvre.
      {
        const p = banc.neuf();
        p.position.set(xf + vers * 0.05, yc + wh * 0.04, zt);
        p.scale.set(0.05, wh * 0.79, wl * 0.73);
        banc.poser("vitre", cube, M.verre, null, {
          segmente: true,
          ombre: false,
        });
      }
      // L'appui : la pièce qui déborde le plus, donc celle qui pose la
      // fenêtre dans le mur au lieu de la coller dessus.
      bloc(
        lisere(couleur, 0.3),
        0.26,
        0.09,
        wl + 0.36,
        xf + vers * 0.11,
        yc - wh * 0.5 - 0.09,
        zt,
      );

      // Les volets, rabattus contre le mur.
      if (volets)
        for (const s of [-1, 1])
          bloc(
            teinteVolet,
            0.05,
            wh * 0.94,
            wl * 0.46,
            xf + vers * 0.16,
            yc - wh * 0.47,
            zt + s * (wl * 0.5 + wl * 0.25),
          );
    }

    // ── LE BALCON ───────────────────────────────────────────────────────
    // Seulement aux deux premiers niveaux : ce sont les seuls que la caméra
    // regarde vraiment depuis 1,22 m. Plus haut, ce serait des triangles
    // pour personne.
    // ⚠️ Jamais avec un encorbellement : la dalle du balcon traverserait le
    // coffre de part en part.
    if (orielT < 0 && e >= 1 && e <= 2 && alea() < 0.5) {
      const lb = largeur * 0.74;
      bloc(pierre, 0.66, 0.1, lb, xFacade + vers * 0.33, y0 + 0.07, zc);
      // ⭐ De VRAIS barreaux. Douze par balcon, un seul ordre pour la rue
      // entière. C'est exactement le détail qui était impensable avant le
      // banc : à trente mètres il ne se compte pas, mais il se VOIT, parce
      // qu'un garde-corps ajouré laisse passer le ciel et qu'une plaque
      // pleine non.
      const n = Math.max(6, Math.round(lb / 0.15));
      for (let i = 0; i < n; i++) {
        const p = banc.neuf();
        p.position.set(
          xFacade + vers * 0.6,
          y0 + 0.62,
          zc - lb / 2 + (i + 0.5) * (lb / n),
        );
        p.scale.set(1, 1.0, 1);
        banc.poser("barreau", BARREAU(THREE), M.metal, 0x3a4152, seg);
      }
      bloc(0x333a4a, 0.09, 0.06, lb, xFacade + vers * 0.6, y0 + 1.12, zc);
    }
  }

  // ── LE SOCLE ──────────────────────────────────────────────────────────
  {
    const yPl = 0.34;
    bloc(
      assombrir(couleur, 0.3),
      0.13,
      yPl,
      largeur,
      xFacade + vers * 0.06,
      0,
      zc,
    );
    if (commerce) {
      const teinte =
        COMMERCES[Math.floor(alea() * COMMERCES.length) % COMMERCES.length];
      // La vitrine : une grande vitre sombre qui renvoie le ciel. C'est le
      // seul endroit de la rue où la réflexion travaille à hauteur d'œil.
      {
        const p = banc.neuf();
        p.position.set(xFacade + vers * 0.04, yPl + 1.12, zc);
        p.scale.set(0.06, 2.05, largeur * 0.84);
        banc.poser("vitre", cube, M.verre, null, {
          segmente: true,
          ombre: false,
        });
      }
      // Les piédroits qui encadrent la vitrine.
      for (const s of [-1, 1])
        bloc(
          pierre,
          0.2,
          2.36,
          0.32,
          xFacade + vers * 0.1,
          yPl,
          zc + (s * largeur * 0.84) / 2,
        );
      // Le bandeau d'enseigne, dans la couleur du commerce.
      bloc(
        teinte,
        0.22,
        0.62,
        largeur * 0.96,
        xFacade + vers * 0.11,
        SOCLE - 0.78,
        zc,
      );
      // ⭐ LE STORE BANNE. Deux copies de plus, et c'est là que le PIGMENT de
      // la rue est allé quand les façades sont passées à la pierre : une
      // petite surface très saturée fait chic, une grande fait Lego. C'est le
      // rapport de surfaces qui décide, jamais la teinte.
      bloc(
        lisere(teinte, 0.34),
        0.06,
        0.44,
        largeur * 0.8,
        xFacade + vers * 0.72,
        SOCLE - 1.6,
        zc,
      );
      // ⭐ L'AUVENT. Quatre-vingt-quinze centimètres de saillie, et surtout
      // une VRAIE ombre portée sur la devanture. C'est cette bande sombre à
      // hauteur d'homme qui fait exister un rez-de-chaussée ; sans elle, un
      // commerce n'est qu'un rectangle plus foncé.
      if (alea() < 0.92)
        bloc(
          lisere(teinte, 0.18),
          0.95,
          0.1,
          largeur * 0.86,
          xFacade + vers * 0.52,
          SOCLE - 1.16,
          zc,
        );
    } else {
      // Une porte cochère, avec son encadrement.
      const zp = zc + (alea() - 0.5) * largeur * 0.4;
      {
        const p = banc.neuf();
        p.position.set(xFacade, yPl + 1.15, zp);
        p.scale.set(1, 2.3, 1.35);
        banc.poser(`cadre${vers}`, cadre, M.pierre, pierre, seg);
      }
      bloc(
        assombrir(couleur, 0.5),
        0.08,
        2.05,
        1.05,
        xFacade + vers * 0.04,
        yPl + 0.05,
        zp,
      );
      // Deux fenêtres de rez-de-chaussée de part et d'autre.
      for (const s of [-1, 1]) {
        const zf = zp + s * (largeur * 0.3);
        if (Math.abs(zf - zc) > largeur * 0.45) continue;
        const p = banc.neuf();
        p.position.set(xFacade, yPl + 1.55, zf);
        p.scale.set(1, 1.45, 1.05);
        banc.poser(`cadre${vers}`, cadre, M.pierre, pierre, seg);
        const q = banc.neuf();
        q.position.set(xFacade + vers * 0.05, yPl + 1.6, zf);
        q.scale.set(0.05, 1.15, 0.77);
        banc.poser("vitre", cube, M.verre, null, {
          segmente: true,
          ombre: false,
        });
      }
    }
  }

  // ── LA CORNICHE, EN DEUX RESSAUTS ─────────────────────────────────────
  // ⭐ Un seul bandeau donne une arête franche et morte. Deux ressauts de
  // profondeurs différentes donnent DEUX ombres superposées, et c'est cette
  // épaisseur-là qu'on lit comme « travaillé » à cinquante mètres. Deux
  // copies, et la ligne de toit cesse d'être un trait.
  const xm = xFacade + cote * (PROF / 2);
  bloc(pierre, PROF + 0.32, 0.14, largeur + 0.32, xm, hCorps - 0.22, zc);
  bloc(lisere(couleur, 0.3), PROF + 0.62, 0.3, largeur + 0.62, xm, hCorps, zc);

  // ── LA COURONNE ───────────────────────────────────────────────────────
  const hToit = hCorps + 0.3;
  const teinteToit =
    TOITURES[Math.floor(alea() * TOITURES.length) % TOITURES.length];
  if (alea() < 0.55) {
    // Toit en pente, débordant. Deux plans suffisent, et leur arête haute
    // donne la seule diagonale de la silhouette.
    const pente = 0.55;
    const demi = PROF / 2 + 0.32;
    const haut = demi * Math.tan(pente);
    for (const s of [-1, 1]) {
      const p = banc.neuf();
      p.position.set(xm + (s * demi) / 2, hToit + haut / 2, zc);
      p.rotation.set(-Math.PI / 2, 0, 0);
      p.rotation.order = "ZYX";
      p.rotation.z = s * pente;
      p.scale.set(demi / Math.cos(pente), largeur + 0.62, 1);
      banc.poser("toit", plan, M.toit, teinteToit, seg);
    }
    // ⭐ LES LUCARNES. Une à trois par toit, du côté de la rue. C'est le
    // détail qui fait le plus de travail par copie de tout le fichier : la
    // ligne de toit est la silhouette qu'on regarde le plus longtemps en
    // roulant, et deux petits volumes qui en dépassent suffisent à la
    // transformer en profil de ville. Elles ne coûtent que trois copies.
    {
      const n = 1 + Math.floor(alea() * 3);
      const yL = hToit + haut * 0.28;
      const xL = xm - cote * (demi * 0.5);
      for (let i = 0; i < n; i++) {
        const zL = zc + ((i + 0.5) / n - 0.5) * largeur * 0.8;
        bloc(pierre, 0.9, 1.0, 0.9, xL, yL, zL);
        const p = banc.neuf();
        p.position.set(xL + vers * 0.5, yL + 1.05, zL);
        p.scale.set(0.06, 0.55, 0.6);
        banc.poser("vitre", cube, M.verre, null, {
          segmente: true,
          ombre: false,
        });
        bloc(teinteToit, 1.15, 0.1, 1.1, xL, yL + 1.0, zL);
      }
    }

    // La souche de cheminée : quatre-vingt-dix centimètres qui cassent la
    // ligne du toit, et son couronnement clair.
    if (alea() < 0.8) {
      const zx = zc + (alea() - 0.5) * largeur * 0.5;
      const xx = xm + (alea() - 0.5) * PROF * 0.4;
      bloc(
        assombrir(couleur, 0.26),
        0.5,
        1.0,
        0.55,
        xx,
        hToit + haut * 0.25,
        zx,
      );
      bloc(pierre, 0.62, 0.1, 0.67, xx, hToit + haut * 0.25 + 1.0, zx);
    }
  } else {
    // Toit-terrasse : un parapet ajouré et une cage d'escalier.
    for (const s of [-1, 1]) {
      bloc(pierre, 0.2, 0.6, largeur + 0.4, xm + (s * PROF) / 2, hToit, zc);
      bloc(pierre, PROF + 0.4, 0.6, 0.2, xm, hToit, zc + (s * largeur) / 2);
    }
    if (alea() < 0.6)
      bloc(
        assombrir(couleur, 0.18),
        2.3,
        1.7,
        2.5,
        xm + (alea() - 0.5) * 3,
        hToit,
        zc + (alea() - 0.5) * largeur * 0.4,
      );
  }

  return hToit;
}

/**
 * Une rangée d'immeubles le long d'un trottoir, posée dans le banc.
 *
 * 🔴 CE QUI FAIT LA RUE N'EST PAS L'IMMEUBLE, C'EST SON VOISIN. Deux voisins
 * ne partagent jamais ni famille de couleur ni hauteur, et un accident de
 * rythme tombe toutes les cinq à sept parcelles. Sans cette règle on obtient
 * un ruban régulier, et un ruban ne ressemble à aucune ville.
 *
 * @param vides  les portions à laisser libres (carrefours, cours)
 */
export function rangee(
  THREE,
  banc,
  { cote, zDebut, zFin, alea, xFacade, vides = [], accidents = true },
) {
  const libre = (a, b) => vides.every(([va, vb]) => a < vb || b > va);
  let familleAvant = -1;
  let etagesAvant = -1;
  let depuis = 0;

  for (let z = zDebut; z > zFin;) {
    let largeur = [6, 9, 12][Math.floor(alea() * 3) % 3];
    let etages = 2 + Math.floor(alea() * 3);
    let retrait = 0;

    depuis++;
    if (accidents && depuis >= 5 + Math.floor(alea() * 3)) {
      depuis = 0;
      const genre = Math.floor(alea() * 3);
      if (genre === 0) largeur = 5;
      else if (genre === 1) etages = 5 + Math.floor(alea() * 2);
      else retrait = 1.6;
    }

    const z1 = z - largeur;
    if (!libre(z, z1)) {
      z = z1 - 0.4;
      continue;
    }

    let famille = Math.floor(alea() * FACADES.length);
    if (famille === familleAvant) famille = (famille + 1) % FACADES.length;
    familleAvant = famille;
    if (etages === etagesAvant) etages = 2 + ((etages - 1) % 4);
    etagesAvant = etages;

    batiment(THREE, banc, {
      cote,
      xFacade: xFacade + cote * retrait,
      z0: z,
      z1,
      etages,
      famille,
      alea,
      commerce: alea() < 0.46,
    });
    z = z1 - 0.4; // un joint de quarante centimètres entre parcelles
  }
}
