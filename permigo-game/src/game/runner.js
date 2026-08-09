// Le moteur de scénarios. C'est ici que « ce que l'élève fait » devient une
// évaluation. Un scénario n'est que de la DONNÉE : le runner l'installe, le
// joue, l'observe et rend un verdict.
//
// Le verdict a exactement la forme que la page attendait déjà du quiz
// (`{ ok, tags }`), pour se rebrancher sans toucher à la progression PermiGo :
// recordAnswer, marquerSceneVue, addGemmes.
//
// ⚠️ Three.js est importé DYNAMIQUEMENT. Il ne doit jamais entrer dans le
// bundle principal : personne ne paie 600 Ko pour ouvrir son accueil.

import { creerMonde, AVANT } from "./engine/world.js";
import { creerVehicule, seTouchent } from "./engine/vehicle.js";
import { creerRig, VUES } from "./engine/camera-rig.js";
import { creerCommandes } from "./engine/controls.js";
import { creerZones } from "./engine/zones.js";
import { creerActeur } from "./engine/npc.js";
import { creerDebug } from "./engine/debug.js";
import { chargerModeles, copier } from "./engine/modeles.js";
import * as CARREFOUR from "./environments/carrefour.js";

const ENVIRONNEMENTS = { carrefour: CARREFOUR };

// Un regard compte à partir de 30° : en dessous, on n'a pas tourné la tête,
// on a juste bougé les yeux vers le bord du pare-brise.
const REGARD_MIN = 0.52;

// De la plus grave à la moins grave. Sert à choisir CE QU'ON RACONTE à la fin :
// « tu arrives trop vite » sonne creux quand il y a eu un choc juste après.
const GRAVITE = [
  "collision",
  "pas_cede_pieton",
  "feu_rouge",
  "refus_priorite",
  "trop_pres",
  "pas_arrete",
  "pas_regarde_droite",
  "pas_regarde_gauche",
  "trop_vite",
  "hors_route",
  "trop_long",
];
// Les modèles 3D. `capOffset` remet l'avant du véhicule sur -Z : un modèle
// arrive orienté comme il veut, et c'est la seule chose qu'on ne peut pas
// deviner sans le regarder.
const MODELES = {
  // L'avant du modèle pointe vers +X ; +90° l'amène sur -Z, l'avant du jeu.
  voiture: { fichier: "voiture.glb", longueur: 4.2, capOffset: Math.PI / 2 },
  gris: { fichier: "gris.glb", longueur: 4.25, capOffset: Math.PI / 2 },
  camion: { fichier: "camion.glb", longueur: 7.6, capOffset: Math.PI / 2 },
  // 🔴 Le buck d'habitacle complet a été ABANDONNÉ. La reconstruction bouche
  // le pare-brise d'une surface pleine ; découpé sous ce panneau, il ne reste
  // qu'une masse grise sans détail, parce qu'on n'en voit plus que le dessus.
  // Un OBJET ISOLÉ se reconstruit bien, une pièce concave non. On repart donc
  // des pièces : une planche de bord, un volant.
  planche: {
    fichier: "planche.glb",
    longueur: 1.78,
    poser: false,
    eclairer: 0.42,
  },
  volant: {
    fichier: "volant.glb",
    longueur: 0.37,
    poser: false,
    eclairer: 0.5,
  },
  // Les usagers fragiles. Ils se calent sur leur HAUTEUR : un piéton fait
  // 1,72 m, et son emprise au sol ne veut rien dire.
  pieton: { fichier: "pieton.glb", hauteur: 1.72, capOffset: Math.PI },
  // Un cycliste se cale sur sa HAUTEUR lui aussi : posé sur sa longueur, le
  // modèle inclut le buste du cycliste et on obtient un géant de trois mètres.
  velo: { fichier: "velo.glb", hauteur: 1.75, capOffset: Math.PI },
  // La signalisation. Elle est POSÉE par l'environnement, jamais par un
  // scénario : c'est lui qui sait où est le bord droit de chaque branche.
  panneauStop: { fichier: "stop.glb", hauteur: 2.6 },
  panneauCede: { fichier: "cede.glb", hauteur: 2.6 },
  // ⚠️ PAS de modèle pour le feu tricolore. Un feu doit CHANGER de couleur ;
  // un modèle importé est une pièce figée, et rien ne dit où ses trois lampes
  // se trouvent dans le maillage. Celui du kit est trois disques qu'on
  // allume, et c'est tout ce qu'on lui demande.
  immeuble: { fichier: "immeuble.glb", longueur: 13 },
  maison: { fichier: "maison.glb", longueur: 11 },
  arbre: { fichier: "arbre.glb", hauteur: 7.2 },
  lampe: { fichier: "lampe.glb", hauteur: 6.4 },
};

// L'habitacle : un capot, une planche de bord, un volant.
//
// ⚠️ Ces trois hauteurs ne se règlent PAS au réalisme, elles se règlent au
// CADRAGE. L'œil est à 1,45 m (imposé par le format portrait, cf. camera-rig)
// et le champ vertical fait 55° : tout ce qui est à plus de 31° sous
// l'horizontale sort de l'image. Une planche de bord posée à sa vraie hauteur
// de 0,78 m est donc simplement invisible. On remonte la composition.
function habitacle(THREE, kit, modeles) {
  const g = new THREE.Group();

  // ⚠️ PAS de capot dessiné à la main. La version précédente en posait un, et
  // à 0,45 m sous l'œil il mangeait 38 % de l'écran à lui seul en cachant
  // l'habitacle derrière. Le bas de l'image appartient à la planche de bord :
  // c'est elle qui dit qu'on est dans une voiture.

  // La planche de bord et le volant, deux pièces distinctes. Le volant DOIT
  // rester séparé : c'est la seule qui tourne avec les roues.
  // ⚠️ Les hauteurs se lisent depuis l'œil du conducteur, à 1,24 m. La
  // planche a 0,63 m de haut, son dessus arrive donc à 1,03 m : vingt
  // centimètres sous le regard, comme dans une voiture.
  const planche = copier(modeles.planche);
  if (!planche) return kit.poste("violet");
  planche.position.set(0, 0.5, -1.5);
  g.add(planche);

  const volant = copier(modeles.volant) || kit.poste("violet").userData.volant;
  volant.position.set(-0.38, 0.8, -0.95);
  volant.rotation.x = -0.42; // l'inclinaison d'une colonne de direction
  g.add(volant);
  g.userData.volant = volant;
  return g;
}

const gravite = (f) => {
  const i = GRAVITE.indexOf(f);
  return i === -1 ? GRAVITE.length : i;
};

export async function lancerScenario(
  hote,
  scenario,
  { debug = false, sur = () => {} } = {},
) {
  const THREE = await import("three");
  const monde = creerMonde(THREE, hote, {
    qualite: scenario.qualite || "auto",
  });
  const env = ENVIRONNEMENTS[scenario.environnement] || CARREFOUR;

  // ── Les modèles, AVANT le décor ──────────────────────────────────────
  // L'environnement construit ses bâtiments, ses arbres et ses lampadaires
  // à partir d'eux : il faut donc qu'ils soient là quand on le monte.
  // Si un fichier manque, `chargerModeles` rend null et cette pièce-là
  // retombe sur la primitive du kit. La situation s'ouvre toujours.
  const modeles = await chargerModeles(THREE, MODELES, {
    base: `${import.meta.env.BASE_URL || "/"}art/course3d/`,
  });
  const {
    kit,
    groupe,
    feux: feuxPoses,
  } = env.construire(THREE, scenario.decor || {}, modeles);
  monde.scene.add(groupe);

  // ── Le joueur ────────────────────────────────────────────────────────
  const bJ = scenario.joueur?.branche || "S";
  const d0 = scenario.joueur?.recul ?? 46;
  const [px, pz] = env.point(bJ, d0);
  const v = creerVehicule({
    x: px,
    z: pz,
    cap: env.CAP_ENTREE[bJ],
    vitesse: scenario.joueur?.vitesse ?? 11,
    vitesseMax: scenario.joueur?.vitesseMax ?? 16,
  });
  // Une carrosserie se choisit d'abord par la COULEUR demandée (chaque
  // couleur est un modèle à part : une peinture ne se change pas en teintant
  // une texture, on obtiendrait du violet sale au lieu du gris).
  const carrosserie = (type, couleur) => {
    const cle = modeles[couleur] ? couleur : modeles[type] ? type : "voiture";
    return copier(modeles[cle]) || kit.vehicule(type, couleur);
  };

  // Deux corps pour la même voiture : la carrosserie (vue de dehors) et le
  // poste de conduite (vu de dedans). On n'affiche jamais les deux.
  const mailleJoueur = carrosserie("voiture", "violet");
  const feuxJoueur = kit.feuxVehicule(v.largeur, v.longueur);
  mailleJoueur.add(feuxJoueur);
  const posteJoueur = habitacle(THREE, kit, modeles);
  // Le faisceau du joueur reste allumé même en vue conducteur : c'est lui
  // qui éclaire le bitume devant, et on le voit à travers le pare-brise.
  const faisceauJoueur = kit.feuxVehicule(v.largeur, v.longueur);
  faisceauJoueur.visible = false;
  monde.scene.add(mailleJoueur, posteJoueur, faisceauJoueur);

  // ── Le trafic ────────────────────────────────────────────────────────
  const acteurs = (scenario.acteurs || []).map((a) => {
    const chemin = a.chemin
      ? a.chemin
      : cheminBranche(env, a.de, a.vers || env.oppose(a.de), a.recul ?? 60);
    const ac = creerActeur({ ...a, chemin });
    ac.maille = carrosserie(a.type || "voiture", a.couleur || "gris");
    if ((a.type || "voiture") !== "pieton") {
      ac.feux = kit.feuxVehicule(ac.v.largeur, ac.v.longueur);
      ac.maille.add(ac.feux);
    }
    monde.scene.add(ac.maille);
    return ac;
  });

  // ── Les zones ────────────────────────────────────────────────────────
  const zones = creerZones([
    ...env.zonesCarrefour(bJ),
    ...(scenario.zones || []),
  ]);

  const rig = creerRig(THREE, monde.camera);
  const dbg = creerDebug(THREE, monde, hote);
  dbg.dessinerZones(zones);
  dbg.dessinerChemins(acteurs);
  const boiteJoueur = dbg.dessinerBoite(v, 0x7c5cff);
  const boitesNpc = acteurs.map((a) => dbg.dessinerBoite(a.v, 0xff9a4d));
  if (debug) dbg.basculer(true);

  const cmd = creerCommandes(hote, {
    surTouche: (code) => {
      if (code === "KeyH") dbg.basculer();
      if (code === "KeyC") sur("vue", rig.changerVue());
    },
  });

  // ── L'état du scénario ───────────────────────────────────────────────
  const etat = {
    phase: "roule", // roule → fini
    fautes: [], // dans l'ordre où elles arrivent
    chrono: 0,
    journal: [],
    verdict: null,
  };
  const noter = (t) => {
    etat.journal.push(`${etat.chrono.toFixed(1)}s ${t}`);
  };
  const fauter = (code) => {
    if (etat.fautes.includes(code)) return;
    etat.fautes.push(code);
    noter(`faute ${code}`);
    sur("faute", code);
  };

  // 🔴 Le regard ne se juge PAS dans une boîte. Un élève qui s'arrête dix
  // mètres trop tôt et qui tourne la tête a fait exactement ce qu'il fallait ;
  // la première version le comptait comme « n'a pas regardé ». On retient
  // donc le regard partout sur les 26 derniers mètres avant le carrefour.
  // 38 m : la distance à laquelle la zone d'approche commence. Un conducteur
  // balaie un carrefour masqué bien avant d'y être ; à 26 m, un élève qui
  // regardait tôt et bien n'était pas crédité.
  const OBSERVE_A = 38;
  const observe = { droite: false, gauche: false };

  // ── Les feux tricolores ──────────────────────────────────────────────
  // Un feu est une machine d'états qui tourne sur un cycle donné en
  // secondes. Le scénario dit `feux: [{ branche, cycle: [['rouge',6],
  // ['vert',8], ['orange',2]] }]` et le moteur s'occupe du reste.
  const cyclesFeux = (scenario.decor?.feux || [])
    .filter((f) => f.cycle)
    .map((f) => ({
      branche: f.branche,
      cycle: f.cycle,
      objet: feuxPoses[f.branche] || null,
      duree: f.cycle.reduce((s, [, d]) => s + d, 0),
      etat: f.cycle[0][0],
    }));
  const etatFeu = (b) => cyclesFeux.find((f) => f.branche === b)?.etat || null;

  const assiste = scenario.assiste !== false;
  const croisiere = scenario.croisiere ?? 11; // ~40 km/h en ville

  const attendu = scenario.attendu || "ceder";
  const observation = scenario.observation || null; // 'droite' | 'gauche' | null
  const vitesseSure = scenario.vitesseSure ?? 7; // m/s dans la zone de décision

  // « Le conflit » : un acteur prioritaire est-il en train d'arriver ?
  const prioritaires = acteurs.filter((a) => a.prioritaire !== false);
  function conflit() {
    return prioritaires.some((a) => {
      if (a.fini || a.attente > 0) return false;
      const d = Math.hypot(a.x, a.z);
      return d < 16 && a.v.vitesse > 0.8;
    });
  }

  // Un usager engagé sur la chaussée : piéton sur le passage, cycliste sur
  // la voie. On ne lui coupe pas la route, même si on a la priorité.
  const fragiles = acteurs.filter(
    (a) => a.type === "pieton" || a.type === "velo",
  );
  // Distance latérale la plus courte à laquelle on est passé de chacun.
  const ecarts = new Map(fragiles.map((a) => [a.id, Infinity]));
  const ecartMin = scenario.ecartMin ?? 1; // mètre, la loi en demande 1 en ville

  // Sur la chaussée = pas sur un trottoir. `surRoute` de l'environnement le
  // sait déjà, on ne recalcule rien.
  const surLaChaussee = (a) => !env.surRoute || env.surRoute(a.x, a.z);

  // ⚠️ L'arrêt au stop se constate sur les DOUZE derniers mètres, pas dans la
  // seule boîte « décision ». Un élève prudent s'immobilise souvent un peu
  // trop tôt : la première version le comptait comme n'ayant pas marqué
  // l'arrêt, ce qui est exactement le contraire de ce qu'il a fait.
  let arreteAvant = false;
  // Devant nous, à moins de 14 m : ce qui est derrière ne nous concerne plus.
  function devantMoi(a) {
    const [ax, az] = AVANT(v.cap);
    const d = (a.x - v.x) * ax + (a.z - v.z) * az;
    return d > -1 && d < 14;
  }

  function terminer(ok, code) {
    if (etat.phase === "fini") return;
    etat.phase = "fini";
    if (code) fauter(code);
    etat.verdict = {
      ok: ok && etat.fautes.length === 0,
      fautes: etat.fautes.slice(),
      // La faute qu'on RACONTE n'est pas la première dans le temps mais la
      // plus grave : « tu arrives trop vite » sonne creux quand il y a eu un
      // choc deux secondes plus tard.
      principale:
        [...etat.fautes].sort((a, b) => gravite(a) - gravite(b))[0] || null,
      tags: scenario.tags || [],
      chrono: etat.chrono,
      vitesseCarrefour: (zones.get("carrefour")?.vitesseEntree ?? 0) * 3.6,
      regarde: { ...observe },
      arret: arreteAvant,
      ecart: Math.min(...ecarts.values(), Infinity),
      journal: etat.journal.slice(),
    };
    noter(etat.verdict.ok ? "réussi" : "échoué");
    sur("fin", etat.verdict);
  }

  // ── La boucle ────────────────────────────────────────────────────────
  monde.demarrer((dt) => {
    const fige = etat.phase === "fini";
    etat.chrono += fige ? 0 : dt;

    const e = cmd.lire(dt);
    rig.regarder(fige ? "centre" : e.regard);

    // Les feux avancent sur leur cycle et changent de couleur à l'écran.
    for (const f of cyclesFeux) {
      let t = etat.chrono % f.duree;
      let etatFeu = f.cycle[0][0];
      for (const [couleur, duree] of f.cycle) {
        if (t < duree) {
          etatFeu = couleur;
          break;
        }
        t -= duree;
      }
      if (etatFeu !== f.etat) {
        f.etat = etatFeu;
        f.objet?.userData.mettre(etatFeu);
        if (f.branche === bJ) sur("feu", etatFeu);
      }
    }

    // ⭐ La voiture roule toute seule tant qu'on ne freine pas. PermiGo n'est
    // pas un simulateur : un élève doit comprendre la SITUATION tout de
    // suite, pas apprendre à doser une pédale. Il ne lui reste que deux
    // gestes à faire, freiner et regarder, et c'est exactement ce que la
    // situation lui demande d'apprendre. Le gaz reste disponible pour qui
    // veut accélérer.
    // ⚠️ C'est un RÉGULATEUR, pas un interrupteur. Une première version mettait
    // les gaz à fond sous la vitesse de croisière et les coupait au-dessus :
    // le frein moteur reprenait la main et la voiture faisait le yo-yo entre
    // 11 et 44 km/h toute seule.
    if (assiste && !fige && !e.gaz && !e.freinage) {
      const ecart = croisiere - v.vitesse;
      if (ecart > 0) e.gaz = Math.min(1, ecart / 1.5);
      else if (ecart < -0.4) e.freinage = 0.12;
    }

    if (!fige) {
      // Hors chaussée, ça freine tout seul : un trottoir n'est pas un raccourci.
      const dehors = env.surRoute && !env.surRoute(v.x, v.z);
      v.avancer(
        dt,
        dehors ? { ...e, gaz: 0, freinage: Math.max(e.freinage, 0.45) } : e,
      );
      // La voiture ne sort pas du monde : au-delà, on arrête la manche.
      if (Math.hypot(v.x, v.z) > 120) terminer(false, "hors_route");
    }

    for (const a of acteurs) {
      if (!fige) {
        // Un acteur qui « évite » freine si le joueur lui coupe la route.
        a.arrete =
          a.evite &&
          zones.get("carrefour")?.contient(v.x, v.z) &&
          Math.hypot(a.x - v.x, a.z - v.z) < 22;
        a.maj(dt);
      }
      a.maille.position.set(a.x, 0, a.z);
      a.maille.rotation.y = a.cap;
      a.feux?.userData.freiner(a.v.freine || (a.arrete && a.v.vitesse > 0.3));
    }

    for (const m of [mailleJoueur, posteJoueur, faisceauJoueur]) {
      m.position.set(v.x, 0, v.z);
      m.rotation.y = v.cap;
    }
    feuxJoueur.userData.freiner(v.freine && v.vitesse > 0.2);
    // ⚠️ On n'affiche jamais les deux. Compter sur le tri des faces pour que
    // la carrosserie « s'ouvre » vue de l'intérieur ne marche pas : il reste
    // des morceaux de montants et de rétroviseurs en travers de l'image.
    const dedans = rig.vue === "conduite";
    mailleJoueur.visible = !dedans;
    posteJoueur.visible = dedans;
    faisceauJoueur.visible = dedans; // le faisceau, lui, éclaire toujours
    // Le volant suit le braquage réel des roues, multiplié par la démultipli-
    // cation d'une direction de série (un tour et demi de butée à butée).
    posteJoueur.userData.volant.rotation.z = v.braquage * 2.6;

    monde.majOmbres(v.x, v.z);
    rig.maj(dt, v);

    if (!fige) {
      if (Math.hypot(v.x, v.z) < 15 && v.vitesse < 0.35) arreteAvant = true;
      if (Math.hypot(v.x, v.z) < OBSERVE_A) {
        if (rig.regardDroite > REGARD_MIN) observe.droite = true;
        if (rig.regardGauche > REGARD_MIN) observe.gauche = true;
      }
      const evts = zones.maj(dt, v, rig);
      for (const { zone, type } of evts) {
        if (type !== "entree") continue;
        noter(`entre dans ${zone.id} à ${(v.vitesse * 3.6).toFixed(0)} km/h`);
        sur("zone", { id: zone.id, role: zone.role, kmh: v.vitesse * 3.6 });

        // Le passage piéton, franchi alors que quelqu'un est engagé dessus.
        if (zone.id === "passage") {
          if (fragiles.some((a) => a.type === "pieton" && surLaChaussee(a)))
            fauter("pas_cede_pieton");
        }
        if (zone.id === "carrefour") {
          // La vitesse qui compte est celle à laquelle on ENTRE dans le
          // carrefour, pas celle de la zone d'avant : freiner au dernier
          // moment reste une bonne décision, arriver lancé n'en est pas une.
          if (v.vitesse > vitesseSure) fauter("trop_vite");
          if (observation && !observe[observation])
            fauter(`pas_regarde_${observation}`);
          if (attendu === "ceder" && conflit()) fauter("refus_priorite");
          if (attendu === "arret" && !arreteAvant) fauter("pas_arrete");
          // Le feu se juge à l'entrée du carrefour, comme la vitesse. Orange
          // compte comme rouge : on ne s'engage pas sur un orange qu'on
          // pouvait s'arrêter de respecter.
          const feu = etatFeu(bJ);
          if (feu === "rouge" || feu === "orange") fauter("feu_rouge");
          // Un piéton déjà engagé sur la chaussée passe avant tout le monde.
          if (fragiles.some((a) => surLaChaussee(a) && devantMoi(a)))
            fauter("pas_cede_pieton");
        }
        if (zone.id === "degage") terminer(true);
      }

      // L'écart au moment où l'on DÉPASSE, pas la distance à tout instant :
      // on ne retient le plus petit écart latéral que quand l'usager fragile
      // est à notre hauteur.
      for (const a of fragiles) {
        if (a.fini) continue;
        const dz = Math.hypot(a.x - v.x, a.z - v.z);
        if (dz > 6) continue;
        const [ax, az] = AVANT(v.cap);
        const long = (a.x - v.x) * ax + (a.z - v.z) * az; // devant / derrière
        if (Math.abs(long) > 1.4) continue; // il n'est pas à notre hauteur
        const lat = Math.abs((a.x - v.x) * -az + (a.z - v.z) * ax);
        const libre = Math.max(0, lat - (v.largeur + a.v.largeur) / 2);
        if (libre < ecarts.get(a.id)) ecarts.set(a.id, libre);
        if (libre < ecartMin) fauter("trop_pres");
      }

      // Le choc : c'est la seule chose qui arrête tout net.
      for (const a of acteurs) {
        if (a.fini || a.attente > 0) continue;
        if (seTouchent(v, a.v)) {
          v.vitesse = 0;
          a.v.vitesse = 0;
          terminer(false, "collision");
          break;
        }
      }

      // Garde-fou : une manche ne dure pas éternellement.
      if (etat.chrono > (scenario.duree ?? 75)) terminer(false, "trop_long");
    }

    // Boîtes de collision du mode debug.
    if (dbg.actif) {
      boiteJoueur.position.set(v.x, 0.8, v.z);
      boiteJoueur.rotation.y = v.cap;
      acteurs.forEach((a, i) => {
        boitesNpc[i].position.set(a.x, 0.8, a.z);
        boitesNpc[i].rotation.y = a.cap;
      });
    }

    dbg.maj(dt, {
      v,
      rig,
      zones,
      acteurs,
      vue: rig.vue,
      etat:
        etat.phase + (etat.fautes.length ? ` · ${etat.fautes.join(",")}` : ""),
      evts: etat.journal,
    });

    sur("image", { kmh: v.kmh, phase: etat.phase, regard: rig.regard });
  });

  return {
    monde,
    cmd,
    rig,
    dbg,
    zones,
    acteurs,
    v,
    etat,
    VUES,
    changerVue: (x) => rig.changerVue(x),
    detruire() {
      cmd.detruire();
      dbg.detruire();
      monde.detruire();
    },
  };
}

// Un chemin standard : on arrive par une branche, on repart par une autre.
// Le point du milieu est le centre du carrefour, ce qui suffit à faire une
// trajectoire ronde avec la poursuite pure du NPC.
function cheminBranche(env, de, vers, recul = 60) {
  const entree = env.point(de, recul);
  const seuil = env.point(de, 8);
  const fin = env.sortie(vers, 60);
  return de === env.oppose(vers)
    ? [entree, seuil, fin]
    : [entree, seuil, [0, 0], env.sortie(vers, 10), fin];
}
