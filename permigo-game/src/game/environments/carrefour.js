// Un carrefour de banlieue française. Un environnement, pas une situation :
// il ne sait rien du scénario qui va s'y jouer. C'est lui qui donne les
// coordonnées des voies, pour qu'un scénario s'écrive « la voiture arrive de
// la droite » et jamais « la voiture est en x = 34,7 ».
//
// Les branches sont nommées par le point cardinal d'où l'on ARRIVE :
//   S = on vient du sud et on roule vers le nord (c'est la branche du joueur
//   par défaut). Nord = -Z, est = +X.

import { creerKit, VOIE, TROTTOIR, HAUT_TROTTOIR, COULEURS } from "./kit.js";

const DEMI = VOIE; // demi-largeur de chaussée : 2 voies
const LONG = 90; // longueur d'une branche
export const BRANCHES = ["N", "S", "E", "W"];
const OPPOSE = { N: "S", S: "N", E: "W", W: "E" };

// Cap d'un véhicule qui ARRIVE par cette branche (radians, cf. world.js).
export const CAP_ENTREE = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 };

// Point sur la voie d'arrivée de la branche, à `d` mètres du centre.
export function point(branche, d) {
  const c = VOIE / 2;
  if (branche === "S") return [c, d];
  if (branche === "N") return [-c, -d];
  if (branche === "E") return [d, -c];
  return [-d, c]; // W
}
// Point sur la voie de SORTIE de la branche (celle qu'on emprunte en partant).
export function sortie(branche, d) {
  return point(OPPOSE[branche], -d);
}
export const oppose = (b) => OPPOSE[b];

// La branche à la droite d'un véhicule qui arrive par `b`.
export const aDroiteDe = { S: "E", E: "N", N: "W", W: "S" };
export const aGaucheDe = { S: "W", W: "N", N: "E", E: "S" };

export function construire(
  THREE,
  {
    branches = BRANCHES,
    passages = [], // branches portant un passage piéton
    panneaux = [], // [{ branche, type }]
    feux = [], // [{ branche, etat }]
    batiments = true,
    arbres = true,
  } = {},
  modeles = {},
) {
  const kit = creerKit(THREE);
  const g = new THREE.Group();

  // Chaque pièce prend son modèle s'il existe et retombe sur la primitive du
  // kit sinon, pièce par pièce. Un modèle manquant enlève du beau, jamais du
  // jouable.
  const poser = (modele, x, z, capY = 0, echelle = 1) => {
    const m = modele.clone(true);
    m.position.set(x, 0, z);
    m.rotation.y = capY;
    if (echelle !== 1) m.scale.multiplyScalar(echelle);
    return m;
  };

  // Sol : un grand plan sombre, la brume du monde en avale le bord.
  const sol = kit.dalle(400, 400, COULEURS.sol, 0, 0, 0);
  g.add(sol);

  // ── Chaussées ────────────────────────────────────────────────────────
  for (const b of branches) {
    const long = LONG;
    const [dx, dz] =
      b === "N" ? [0, -1] : b === "S" ? [0, 1] : b === "E" ? [1, 0] : [-1, 0];
    const cx = dx * (DEMI + long / 2);
    const cz = dz * (DEMI + long / 2);
    const selonZ = b === "N" || b === "S";
    g.add(
      kit.dalle(
        selonZ ? DEMI * 2 : long,
        selonZ ? long : DEMI * 2,
        COULEURS.bitume,
        cx,
        cz,
      ),
    );

    // Ligne d'axe en pointillés, coupée avant le carrefour (elle ne le
    // traverse jamais : dans un carrefour, plus personne ne guide).
    kit.ligne(g, {
      x: selonZ ? 0 : cx,
      z: selonZ ? cz : 0,
      longueur: long - 8,
      selonZ,
    });

    // Trottoirs des deux côtés.
    for (const s of [-1, 1]) {
      const ox = selonZ ? s * (DEMI + TROTTOIR / 2) : cx;
      const oz = selonZ ? cz : s * (DEMI + TROTTOIR / 2);
      kit.trottoir(g, {
        x: ox,
        z: oz,
        l: selonZ ? TROTTOIR : long,
        p: selonZ ? long : TROTTOIR,
      });
    }
  }
  // Le carré central : une dalle un poil plus claire, on voit qu'on y entre.
  g.add(kit.dalle(DEMI * 2, DEMI * 2, COULEURS.bitumeUse, 0, 0, 0.005));

  // Angles de trottoir, sinon les quatre trottoirs ne se rejoignent pas.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      g.add(
        kit.bloc(
          TROTTOIR,
          HAUT_TROTTOIR,
          TROTTOIR,
          COULEURS.trottoir,
          sx * (DEMI + TROTTOIR / 2),
          0,
          sz * (DEMI + TROTTOIR / 2),
        ),
      );

  // ── Passages piétons ─────────────────────────────────────────────────
  for (const b of passages) {
    const selonZ = b === "N" || b === "S";
    const d = DEMI + 1.9;
    const [px, pz] =
      b === "N" ? [0, -d] : b === "S" ? [0, d] : b === "E" ? [d, 0] : [-d, 0];
    kit.passage(g, { x: px, z: pz, largeur: DEMI * 2, selonZ });
  }

  // ── Panneaux et feux, au bord droit de la voie d'arrivée ─────────────
  const MODELE_PANNEAU = { stop: "panneauStop", cede: "panneauCede" };
  for (const { branche, type } of panneaux) {
    const [x, z] = bordDroit(branche);
    // Le panneau REGARDE le conducteur qui arrive : il fait donc face au sens
    // inverse de sa marche.
    const cap = CAP_ENTREE[branche] + Math.PI;
    const m = modeles[MODELE_PANNEAU[type]];
    g.add(m ? poser(m, x, z, cap) : kit.panneau(type, x, z, cap));
  }
  const feuxPoses = {};
  for (const { branche, etat = "rouge" } of feux) {
    const [x, z] = bordDroit(branche);
    const f = kit.feu(x, z, CAP_ENTREE[branche] + Math.PI);
    f.userData.mettre(etat);
    feuxPoses[branche] = f;
    g.add(f);
  }

  // ── Décor ────────────────────────────────────────────────────────────
  // Il n'est pas ornemental : sans lui, on ne voit pas qu'on avance, et
  // surtout un bâtiment d'angle est ce qui MASQUE la voiture qui arrive.
  const bord = DEMI + TROTTOIR;
  if (batiments) {
    let t = 0;
    // Le cap tourne les façades vers le carrefour : un immeuble présenté de
    // dos montre un mur nu et le coin de rue perd son épaisseur.
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const versRue = Math.atan2(-sx, -sz);
        const rangee = [
          [sx * (bord + 7), sz * (bord + 6.5), "immeuble", 11],
          [sx * (bord + 9), sz * (bord + 26), "maison", 12],
          [sx * (bord + 28), sz * (bord + 9), "immeuble", 15],
        ];
        for (const [bx, bz, quoi, large] of rangee) {
          const m = modeles[quoi];
          if (m) g.add(poser(m, bx, bz, versRue + (t % 2 ? 0.06 : -0.05)));
          else g.add(kit.batiment(bx, bz, large, large - 1, 3 + (t % 2), t));
          t++;
        }
      }
  }
  if (arbres) {
    const unArbre = (x, z, e, tour) =>
      modeles.arbre ? poser(modeles.arbre, x, z, tour, e) : kit.arbre(x, z, e);
    for (const s of [-1, 1])
      for (let i = 0; i < 6; i++) {
        const d = bord + 1.2;
        const l = 15 + i * 11;
        // Les arbres tournent d'un multiple d'un tiers de tour : sans ça, la
        // rangée entière est le MÊME arbre vu sous le même angle, et l'œil le
        // voit tout de suite.
        const e = 0.88 + ((i * 5) % 4) * 0.09;
        g.add(unArbre(s * d, -l, e, i * 1.9));
        g.add(unArbre(s * d, l, e + 0.06, i * 2.7));
        g.add(unArbre(-l, s * d, 0.95, i * 1.3));
        g.add(unArbre(l, s * d, 0.95, i * 3.1));
      }
  }
  for (const s of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const d = bord + 0.9;
      for (const z of [-(9 + i * 22), 9 + i * 22]) {
        if (modeles.lampe) {
          // Le modèle a son bras d'un côté : on le fait pivoter pour que la
          // lampe surplombe toujours la chaussée.
          g.add(
            poser(modeles.lampe, s * d, z, s > 0 ? Math.PI / 2 : -Math.PI / 2),
          );
          g.add(
            kit
              .halo(4.6, 0.6)
              .translateX(s * d - s * 1.6)
              .translateZ(z),
          );
        } else {
          g.add(kit.lampadaire(s * d, z, -s));
        }
      }
    }

  function bordDroit(branche) {
    // 1,3 m après la bordure, 6 m avant l'entrée du carrefour.
    const c = DEMI + 1.3,
      d = DEMI + 6;
    if (branche === "S") return [c, d];
    if (branche === "N") return [-c, -d];
    if (branche === "E") return [d, -c];
    return [-d, c];
  }

  return { kit, groupe: g, feux: feuxPoses, bordDroit };
}

// Les zones d'un carrefour, vues depuis la branche du joueur. Elles ne
// dépendent que de la géométrie : tous les scénarios de carrefour les
// partagent, et un scénario peut en ajouter.
export function zonesCarrefour(brancheJoueur = "S") {
  const selonZ = brancheJoueur === "N" || brancheJoueur === "S";
  const s = brancheJoueur === "S" || brancheJoueur === "W" ? 1 : -1;
  const boite = (id, role, de, a, largeur = DEMI * 2) => {
    const centre = (de + a) / 2,
      prof = Math.abs(a - de);
    return selonZ
      ? { id, role, x: 0, z: s * centre, l: largeur, p: prof }
      : { id, role, x: s * centre, z: 0, l: prof, p: largeur };
  };
  return [
    boite("approche", "approche", DEMI + 34, DEMI + 14),
    // Le passage piéton se juge AVANT le carrefour : il est à 1,9 m de la
    // ligne d'entrée, et un piéton engagé s'y trouve bien avant qu'on soit
    // dans l'intersection.
    boite("passage", "passage", DEMI + 3.4, DEMI + 0.4),
    boite("observation", "observation", DEMI + 16, DEMI + 2),
    boite("decision", "decision", DEMI + 6, DEMI - 0.5),
    {
      id: "carrefour",
      role: "danger",
      x: 0,
      z: 0,
      l: DEMI * 2.2,
      p: DEMI * 2.2,
    },
    boite("degage", "succes", -(DEMI + 5), -(DEMI + 22)),
  ];
}

// Est-on encore sur la chaussée ? Le moteur s'en sert pour brider la vitesse
// hors route : sans ça, le carrefour se contourne par la pelouse et toute la
// situation pédagogique s'évapore.
export function surRoute(x, z) {
  return Math.abs(x) <= DEMI || Math.abs(z) <= DEMI;
}

export { VOIE, DEMI };
