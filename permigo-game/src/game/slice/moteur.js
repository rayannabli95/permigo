// Le banc d'essai. Il joue une scène, il mesure tout, il rend un verdict.
//
// Ce n'est PAS le jeu. Il n'y a ni points, ni score, ni progression, ni
// boutique, ni monde. Il répond à une seule question :
//
//   après cinq minutes, un élève cherche-t-il le danger plus tôt dans une
//   situation qu'il n'a jamais vue ?
//
// ⭐ Le monde 3D se construit UNE FOIS et vit d'une scène à l'autre. Une
// scène n'est qu'un jeu d'acteurs et de décors qu'on pose et qu'on retire.
// C'est ce qui permet d'enchaîner sans écran de chargement, et l'enchaînement
// fait partie de ce qu'on teste : un temps mort entre deux scènes et on ne
// mesure plus l'envie de rejouer, on mesure la patience.
//
// ⚠️ Three.js est en import dynamique. Il ne doit jamais entrer dans le
// bundle principal de l'app.

import { creerMonde, AVANT } from "../engine/world.js";
import { creerVehicule, seTouchent } from "../engine/vehicle.js";
import { creerRig } from "../engine/camera-rig.js";
import { creerActeur } from "../engine/npc.js";
import { creerSon } from "../engine/audio.js";
import { creerPost } from "../engine/post.js";
import { creerQualite } from "../engine/qualite.js";
import { chargerModeles, copier } from "../engine/modeles.js";
import * as CARREFOUR from "../environments/carrefour.js";
import { creerEntree } from "./entree.js";
import { creerObservation } from "./observation.js";
import { juger } from "./verdict.js";

// Ce dont le banc a besoin, et rien de plus. `capOffset` remet l'avant du
// modèle sur -Z : sans lui, toutes les voitures roulent en marche arrière et
// ça ne se voit que de trois quarts.
const MODELES = {
  cupra: { fichier: "cupra.glb", longueur: 4.3, capOffset: -Math.PI / 2 },
  voiture: { fichier: "voiture.glb", longueur: 4.2, capOffset: -Math.PI / 2 },
  gris: { fichier: "gris.glb", longueur: 4.25, capOffset: -Math.PI / 2 },
  camion: { fichier: "camion.glb", longueur: 7.6, capOffset: -Math.PI / 2 },
  planche: { fichier: "planche.glb", longueur: 1.78, poser: false },
  volant: { fichier: "volant.glb", longueur: 0.37, poser: false },
  velo: { fichier: "velo.glb", hauteur: 1.75, capOffset: Math.PI },
  immeuble: { fichier: "immeuble.glb", longueur: 13 },
  maison: { fichier: "maison.glb", longueur: 11 },
  arbre: { fichier: "arbre.glb", hauteur: 7.2 },
  lampe: { fichier: "lampe.glb", hauteur: 6.4 },
};

export async function creerBanc(hote, R, { sur = () => {} } = {}) {
  const THREE = await import("three");
  const monde = creerMonde(THREE, hote, { qualite: R.qualite });
  const modeles = await chargerModeles(THREE, MODELES, {
    base: `${import.meta.env.BASE_URL || "/"}art/course3d/`,
  });

  // Le décor, monté une seule fois pour les quatre branches. Les scènes
  // changent d'angle d'arrivée, pas de ville.
  const { kit, groupe } = CARREFOUR.construire(
    THREE,
    { batiments: true, arbres: true, passages: [] },
    modeles,
  );
  monde.scene.add(groupe);

  const carrosserie = (type, couleur) => {
    const cle = modeles[couleur] ? couleur : modeles[type] ? type : null;
    return (cle && copier(modeles[cle])) || kit.vehicule(type, couleur);
  };

  // ── Le joueur, une fois pour toutes ──────────────────────────────────
  const corps = carrosserie("voiture", "cupra");
  const feuxCorps = kit.feuxVehicule(1.85, 4.3);
  corps.add(feuxCorps);
  const poste = habitacle(THREE, kit, modeles);
  const faisceau = kit.feuxVehicule(1.85, 4.3);
  // 🔴 Les optiques de cette copie flotteraient en plein pare-brise (il n'y a
  // pas de capot). On ne garde que la lumière au sol.
  faisceau.userData.lentilles.forEach((m) => (m.visible = false));
  const tache = kit.tache(1.85, 4.3);
  monde.scene.add(corps, poste, faisceau, tache);

  const rig = creerRig(THREE, monde.camera);
  const post = creerPost(THREE, monde);
  const qualite = creerQualite(monde, { qualite: R.qualite });
  qualite.brancherPost(post);
  const son = creerSon();
  const entree = creerEntree(hote, R);
  const obs = creerObservation(THREE, monde, R);

  // L'anneau qui surligne ce qu'il n'a pas vu. Une seule pièce, réutilisée.
  const anneau = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.35, 36),
    new THREE.MeshBasicMaterial({
      color: 0xffc861,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false, // il doit se voir À TRAVERS ce qui le cachait
      fog: false,
    }),
  );
  anneau.renderOrder = 40;
  anneau.visible = false;
  monde.scene.add(anneau);

  // ── L'état d'une scène ───────────────────────────────────────────────
  let scene = null;
  let v = null;
  let acteurs = new Map();
  let poses = []; // ce qu'on retire à la fin de la scène
  let phase = "attente"; // attente · joue · consequence · fini
  let t = 0;
  let tReel = 0;
  let finir = null;
  let mesures = null;
  let evts = [];
  let sons = [];
  let arret = 0;
  let cheminIdx = 1;
  let autoFrein = false;
  let restant = 0;

  function nettoyer() {
    for (const o of poses) monde.scene.remove(o);
    poses = [];
    acteurs = new Map();
    anneau.visible = false;
    anneau.material.opacity = 0;
  }

  // ── Poser une scène ──────────────────────────────────────────────────
  function poser(s) {
    nettoyer();
    scene = s;
    t = 0;
    tReel = 0;
    arret = 0;
    cheminIdx = 1;
    autoFrein = false;
    evts = (s.evenements || []).map((e) => ({ ...e, fait: false }));
    sons = (s.sons || []).map((x) => ({ ...x, prochain: x.t }));

    const j = s.joueur;
    const depart = j.chemin
      ? [j.chemin[0][0], j.chemin[0][1]]
      : CARREFOUR.point(j.branche, j.recul ?? 40);
    v = creerVehicule({
      x: depart[0],
      z: depart[1],
      cap: CARREFOUR.CAP_ENTREE[j.branche],
      vitesse: j.vitesse ?? 9,
      vitesseMax: 18,
    });

    for (const p of s.props || []) {
      const m = carrosserie(p.modele, p.couleur || p.modele);
      m.position.set(p.x, 0, p.z);
      m.rotation.y = p.cap || 0;
      if (p.echelle) m.scale.multiplyScalar(p.echelle);
      const tc = kit.tache(2.4, 7.6, 0.55);
      tc.position.set(p.x, 0.015, p.z);
      tc.rotation.z = -(p.cap || 0);
      monde.scene.add(m, tc);
      poses.push(m, tc);
      if (p.masque) m.userData.masque = true;
    }

    for (const a of s.acteurs || []) {
      const ac = creerActeur(a);
      // 🔴 `creerActeur` démarre TOUJOURS à l'arrêt : un acteur mettait deux
      // secondes à prendre son allure, et toutes les scènes rataient leur
      // rendez-vous. La berline passait derrière le joueur, et le banc
      // d'essai enregistrait des « aucun danger » parfaitement crédibles.
      // Ici un véhicule roule déjà : c'est une rue, pas un feu vert.
      ac.v.vitesse = ac.vitesseVoulue;
      ac.maille = carrosserie(a.type || "voiture", a.couleur || "gris");
      if (a.type !== "pieton" && a.type !== "velo") {
        ac.feux = kit.feuxVehicule(ac.v.largeur, ac.v.longueur);
        ac.maille.add(ac.feux);
      }
      ac.tache = kit.tache(ac.v.largeur, ac.v.longueur, 0.5);
      ac.stopForce = false;
      monde.scene.add(ac.maille, ac.tache);
      poses.push(ac.maille, ac.tache);
      acteurs.set(a.id, ac);
      if (a.masque) ac.maille.userData.masque = true;
    }

    // Ce qui peut cacher quelque chose. Une petite liste, pas la ville.
    obs.poserMasques([
      ...poses.filter((o) => o.userData?.masque),
      ...[...acteurs.values()]
        .filter((a) => scene.suivi === a.id || a.maille.userData?.masque)
        .map((a) => a.maille),
    ]);
    obs.reglerAmplitude(s.angleRegardMax ?? R.angleRegardMax);
    obs.poser(s.interets);
    entree.zero(s.angleRegardMax ?? R.angleRegardMax);
    rig.changerVue("conduite");

    mesures = {
      tAction: null, // le premier geste de ralentissement
      tPremierFrein: null,
      dureeFrein: 0,
      vitesseMin: Infinity,
      croisiere: j.chemin
        ? j.chemin[0][2] || j.vitesse
        : (s.joueur.croisiere ?? 9),
      premierBalayage: null,
      amplitudeRegard: 0,
      balayageSterile: 0,
      deficit: 0,
      aRalenti: false,
      controleFait: false,
      controleAngle: 0,
      controleQuand: null,
      tropPres: false,
      distanceMin: Infinity,
      issue: "passe",
      designations: [],
      regard: [], // 10 Hz
      _prochainEchantillon: 0,
    };
    phase = "joue";
    sur("depart", { scene: s });
  }

  // ── La conduite automatique ──────────────────────────────────────────
  // Le joueur ne pilote pas. Il regarde et il ralentit, un point c'est tout.
  // La direction suit un chemin quand la scène en donne un (le virage à
  // droite du contrôle d'angle mort), sinon elle tient la voie.
  function conduire(dt, ralentir) {
    let volant = 0;
    let cible = mesures.croisiere;

    if (scene.joueur.chemin) {
      const ch = scene.joueur.chemin;
      const p = ch[Math.min(cheminIdx, ch.length - 1)];
      const dx = p[0] - v.x;
      const dz = p[1] - v.z;
      if (dx * dx + dz * dz < 16 && cheminIdx < ch.length - 1) cheminIdx++;
      const n = Math.hypot(dx, dz) || 1;
      const [ax, az] = AVANT(v.cap);
      const cote = (ax * dz - az * dx) / n;
      const devant = (ax * dx + az * dz) / n;
      volant = Math.max(-1, Math.min(1, Math.atan2(-cote, devant) * 1.5));
      cible = p[2] ?? cible;
    }

    let gaz = 0;
    let freinage = 0;
    if (ralentir > 0.02) freinage = ralentir;
    else if (autoFrein) freinage = R.designerFreinage;
    else if (v.vitesse < cible - 0.2)
      gaz = Math.min(1, (cible - v.vitesse) / 1.5);
    else if (v.vitesse > cible + 0.4) freinage = 0.16;
    v.avancer(dt, { gaz, freinage, volant });
    return { freinage, cible, gaz };
  }

  // ── La fin d'une scène ───────────────────────────────────────────────
  function conclure(issue) {
    if (phase !== "joue") return;
    mesures.issue = issue;
    mesures.balayageSterile = obs.sterile;
    mesures.vitesseMin = Math.min(mesures.vitesseMin, v.vitesse);
    // « Il a ralenti » : soit il a freiné franchement, soit la vitesse est
    // tombée nettement sous l'allure de croisière. Les deux comptent, parce
    // qu'un maintien léger tenu longtemps est une décision, lui aussi.
    mesures.aRalenti = mesures.dureeFrein > 0.3 || mesures.deficit > 1.8;

    const verdict = juger(scene, obs, mesures, R);
    const rate = !verdict.juste || verdict.tard || issue === "choc";

    // La conséquence : le temps se dilate, la caméra sort de la voiture, et
    // l'anneau se pose sur ce qu'il n'a pas vu. Aucun texte ici — c'est la
    // coque qui décide si elle en met un, et c'est le TEST 3.
    if (rate) {
      phase = "consequence";
      restant = R.dureeConsequence;
      rig.changerVue("exterieur");
      if (R.surlignerIndice) {
        const cible = obs.indice || obs.danger;
        if (cible && cible._point) {
          anneau.position.copy(cible._point);
          anneau.visible = true;
        }
      }
      if (issue === "choc") son.jouer("choc");
      else son.jouer("alerte");
    } else {
      phase = "fini";
    }

    const resultat = {
      scene: scene.id,
      famille: scene.famille,
      competence: scene.competence,
      competences: scene.competences,
      type: scene.type,
      variante: scene.variante,
      transfert: !!scene.transfert,
      attendu: scene.attendu,
      duree: t,
      verdict,
      mesures: {
        ...mesures,
        _prochainEchantillon: undefined,
        vitesseMin: Number.isFinite(mesures.vitesseMin)
          ? +mesures.vitesseMin.toFixed(2)
          : null,
        distanceMin: Number.isFinite(mesures.distanceMin)
          ? +mesures.distanceMin.toFixed(2)
          : null,
      },
      zones: obs.zones.map((z) => ({
        id: z.id,
        role: z.role,
        nature: z.nature,
        seuil: z.seuil,
        premierRegard: arrondi(z.premierRegard),
        dureeCumulee: +z.dureeCumulee.toFixed(2),
        distanceAuPremierRegard: arrondi(z.distanceAuPremierRegard),
        niveau: z.niveau,
        designe: z.designe,
        evident: arrondi(z.evident),
        critique: arrondi(z.critique),
        connaissable: arrondi(z.connaissable),
        avantEvidence:
          z.premierRegard !== null &&
          (z.evident === null || z.premierRegard <= z.evident),
        // Un regard n'est une observation que s'il arrive avant que la chose
        // vous saute au visage. Après, c'est une constatation.
      })),
    };
    const rendre = finir;
    finir = null;
    // On rend le résultat TOUT DE SUITE : la conséquence continue de se jouer
    // pendant que la coque prépare l'écran. C'est ce qui supprime le temps
    // mort entre deux scènes.
    rendre?.({ resultat, rate, attendre: rate ? R.dureeConsequence : 0 });
  }

  // ── La boucle ────────────────────────────────────────────────────────
  monde.demarrer((dtReel) => {
    qualite.maj(dtReel);
    const e = entree.lire(dtReel);
    const ralenti = phase === "consequence" ? R.tempoRalenti : 1;
    const dt = dtReel * ralenti;

    if (phase === "consequence") {
      restant -= dtReel;
      anneau.material.opacity = Math.min(
        0.95,
        anneau.material.opacity + dtReel * 4,
      );
      anneau.lookAt(monde.camera.position);
      if (restant <= 0) phase = "fini";
    }

    if (phase === "joue") {
      t += dt;
      tReel += dtReel;

      for (const ev of evts) {
        if (ev.fait || t < ev.t) continue;
        ev.fait = true;
        const a = acteurs.get(ev.acteur);
        if (!a) continue;
        if (ev.vitesse !== undefined) a.vitesseVoulue = ev.vitesse;
        if (ev.feuxStop !== undefined) a.stopForce = ev.feuxStop;
      }
      for (const s of sons) {
        if (t < s.prochain || (s.jusqu && t > s.jusqu)) continue;
        son.jouer(s.nom);
        s.prochain = s.repete ? s.prochain + s.repete : Infinity;
      }

      // Désigner : la seule version où le doigt sert à comprendre et pas à
      // commander. Toucher juste fait ralentir la voiture toute seule.
      for (const tape of e.tapes) {
        const z = obs.designer(tape, monde.camera, hote);
        mesures.designations.push({ t: +t.toFixed(2), zone: z?.id || null });
        if (R.action === "designer" && z && z.role === "danger")
          autoFrein = true;
      }

      const ralentir = R.action === "designer" ? 0 : e.ralentir;
      const { cible, gaz } = conduire(dt, ralentir);
      // 🔴 On ne compte QUE le freinage du joueur. Le régulateur freine tout
      // seul, et la voiture ralentit d'elle-même dans un virage : la première
      // version prenait ça pour une décision, et toute scène avec un virage
      // était notée « il a ralenti » même quand le joueur n'avait rien fait.
      const sien = ralentir > 0.05 || autoFrein;
      if (sien) {
        mesures.dureeFrein += dt;
        if (mesures.tPremierFrein === null) mesures.tPremierFrein = t;
      }
      // Et le déficit : de combien il roule SOUS ce que la voiture visait à
      // cet instant. C'est ça, ralentir, quelle que soit la scène.
      // ⚠️ Pas quand la voiture est à fond pour REPRENDRE son allure : en
      // sortie de virage elle est à 2,5 m/s et vise 7, et ce retard-là est
      // une accélération, pas un freinage. Sans ce test, toute scène avec un
      // virage était notée « il a ralenti », y compris pour un joueur qui
      // n'avait pas touché l'écran.
      if (gaz < 0.98)
        mesures.deficit = Math.max(mesures.deficit, cible - v.vitesse);
      // ⭐ L'instant de la décision. C'est lui qui, comparé à l'instant où le
      // danger crevait les yeux, donne la marge d'anticipation.
      if (mesures.tAction === null && (ralentir > 0.05 || autoFrein))
        mesures.tAction = t;
      mesures.vitesseMin = Math.min(mesures.vitesseMin, v.vitesse);

      if (
        mesures.premierBalayage === null &&
        Math.abs(e.regard) > R.regardMinimum
      )
        mesures.premierBalayage = t;
      mesures.amplitudeRegard = Math.max(
        mesures.amplitudeRegard,
        Math.abs(e.regard),
      );
      // ⭐⭐ Le contrôle déclaré par la scène. Sur une scène où il ne se passe
      // rien, aucun objet ne peut prouver qu'il a regardé : « il a vu qu'il
      // n'y avait personne » ne se mesure pas. Ce qui se mesure, c'est LE
      // GESTE. Sans ça, un élève qui contrôle correctement son angle mort et
      // qui continue était noté « il ne pouvait pas savoir ».
      const c = scene.controle;
      if (c && !mesures.controleFait) {
        const vers = c.cote === "gauche" ? e.regard : -e.regard;
        mesures.controleAngle = Math.max(mesures.controleAngle, vers);
        if (vers >= (c.angleMin ?? 1.2) && t <= (c.avant ?? scene.duree)) {
          mesures.controleFait = true;
          mesures.controleQuand = t;
        }
      }
      if (t >= mesures._prochainEchantillon) {
        mesures.regard.push({ t: +t.toFixed(2), a: +e.regard.toFixed(3) });
        mesures._prochainEchantillon = t + 0.1;
      }

      for (const a of acteurs.values()) a.maj(dt);
    }

    // Les corps suivent, dans toutes les phases : la conséquence doit montrer
    // la scène qui continue, pas une image figée.
    for (const a of acteurs.values()) {
      a.maille.position.set(a.x, 0, a.z);
      a.maille.rotation.y = a.cap;
      a.tache.position.set(a.x, 0.015, a.z);
      a.tache.rotation.z = -a.cap;
      a.feux?.userData.freiner(a.stopForce || a.v.freine);
    }
    if (v) {
      for (const m of [corps, poste, faisceau]) {
        m.position.set(v.x, 0, v.z);
        m.rotation.y = v.cap;
      }
      tache.position.set(v.x, 0.015, v.z);
      tache.rotation.z = -v.cap;
      feuxCorps.userData.freiner(v.freine && v.vitesse > 0.2);
      const dedans = rig.vue === "conduite";
      corps.visible = !dedans;
      poste.visible = dedans;
      faisceau.visible = dedans;
      poste.userData.volant.rotation.z = v.braquage * 2.6;
      monde.majOmbres(v.x, v.z);
      rig.regarder(phase === "joue" ? e.regard : 0);
      rig.maj(dtReel, v);
      son.maj(dtReel, {
        vitesse: v.vitesse,
        gaz: 0,
        freinage: v.freine ? 0.5 : 0,
        fige: phase !== "joue",
      });
    }

    if (phase !== "joue") return;

    // La mesure du regard vient APRÈS le placement de la caméra : c'est la
    // position réelle de l'œil qui décide de ce qui est visible.
    obs.maj(dt, t, {
      v,
      regard: e.regard,
      acteurs,
      camera: monde.camera,
    });

    // ── Les fins de scène ───────────────────────────────────────────────
    for (const a of acteurs.values()) {
      if (a.fini) continue;
      const d = Math.hypot(a.x - v.x, a.z - v.z);
      if (scene.suivi === a.id || scene.croisement === a.id)
        mesures.distanceMin = Math.min(mesures.distanceMin, d);
      if (seTouchent(v, a.v)) {
        v.vitesse = 0;
        a.v.vitesse = 0;
        return conclure("choc");
      }
    }
    // Trop près, sans se toucher : c'est une faute à part entière, et c'est
    // celle qu'on apprend le moins bien en salle.
    if (scene.suivi && mesures.distanceMin < 6.2) mesures.tropPres = true;
    // 🔴 Pour un usager qu'on croise, la distance de centre à centre ne veut
    // RIEN dire : un élève qui s'arrête pour laisser passer un vélo le voit
    // défiler à un mètre, et il a parfaitement raison. Ce qui compte est
    // l'écart LATÉRAL, et seulement au moment où il est à notre hauteur.
    if (scene.croisement) {
      const a = acteurs.get(scene.croisement);
      if (a && !a.fini) {
        const [ax, az] = AVANT(v.cap);
        const dx = a.x - v.x;
        const dz = a.z - v.z;
        const long = dx * ax + dz * az;
        // ⚠️ Et seulement si NOUS roulons. L'écart d'un mètre est une règle de
        // dépassement : un élève à l'arrêt qui laisse un vélo se faufiler le
        // long de sa portière a fait exactement ce qu'il fallait, et la
        // première version le lui reprochait.
        if (Math.abs(long) < 1.4 && v.vitesse > 1.5) {
          const lat = Math.abs(dx * -az + dz * ax);
          const libre = lat - (v.largeur + a.v.largeur) / 2;
          if (libre < 0.85) mesures.tropPres = true;
        }
      }
    }

    // Il s'est arrêté et il attend : la scène n'a plus rien à raconter.
    if (v.vitesse < 0.5) arret += dt;
    else arret = 0;
    if (arret > 1.4 && t > 2) return conclure("attend");

    if (t > scene.duree) return conclure("passe");
    if (Math.hypot(v.x, v.z) > 120) return conclure("passe");
  });

  return {
    monde,
    rig,
    obs,
    son,
    entree,
    qualite,
    get phase() {
      return phase;
    },
    get scene() {
      return scene?.id || null;
    },
    get pretGyro() {
      return !entree.gyroIndisponible;
    },
    demanderPermission: () => entree.demanderPermission(),

    // Joue une scène et rend son résultat. La conséquence continue de se
    // jouer à l'écran pendant que la coque affiche ce qu'elle veut.
    jouer(s) {
      return new Promise((ok) => {
        finir = ok;
        poser(s);
      });
    },

    detruire() {
      nettoyer();
      entree.detruire();
      son.detruire();
      post.detruire();
      monde.detruire();
    },
  };
}

const arrondi = (x) => (x === null || x === undefined ? null : +x.toFixed(2));

// L'habitacle : une planche de bord, un volant, une lueur de combiné. C'est
// lui qui dit « tu es assis dedans », et c'est la moitié de la sensation de
// regarder plutôt que de déplacer une caméra.
function habitacle(THREE, kit, modeles) {
  const g = new THREE.Group();
  const planche = copier(modeles.planche);
  if (!planche) {
    const secours = kit.poste("violet");
    g.add(secours);
    g.userData.volant = secours.userData.volant;
    return g;
  }
  planche.position.set(0, 0.5, -1.5);
  g.add(planche);
  const volant = copier(modeles.volant) || kit.poste("violet").userData.volant;
  volant.position.set(-0.38, 0.8, -0.95);
  volant.rotation.x = -0.42;
  g.add(volant);
  g.userData.volant = volant;

  // ⭐ La lueur du combiné. Sans elle, la planche de bord assombrie est un
  // TROU NOIR sur 40 % de l'écran, et on ne sait plus qu'on est dans une
  // voiture. Ce n'est pas un cadran lisible, c'est la lumière qui se pose sur
  // la planche. Petite et presque à plat : dressée, elle devient un soleil
  // orange derrière le volant.
  const lueur = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.17),
    new THREE.MeshBasicMaterial({
      map: degradeCombine(THREE),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  lueur.position.set(-0.38, 0.87, -1.24);
  lueur.rotation.x = -1.16;

  // Un habitacle est SOMBRE : sans ça la planche prend la lumière du ciel et
  // rend un gris moyen sur un tiers du cadre.
  g.traverse((o) => {
    if (!o.material) return;
    const tab = Array.isArray(o.material);
    const mats = (tab ? o.material : [o.material]).map((m) => {
      const c = m.clone();
      if (c.envMapIntensity !== undefined) c.envMapIntensity = 0.12;
      c.color?.multiplyScalar(0.34);
      if (c.roughness !== undefined) c.roughness = 0.92;
      return c;
    });
    o.material = tab ? mats : mats[0];
  });
  // ⚠️ APRÈS l'assombrissement : ajoutée avant, la lueur se ferait éteindre
  // avec le reste et on n'aurait rien gagné.
  g.add(lueur);
  return g;
}

// Le dégradé ambre du combiné, dessiné une fois dans un canvas de 64 px.
function degradeCombine(THREE) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 32;
  const g = c.getContext("2d");
  const rad = g.createRadialGradient(32, 26, 2, 32, 26, 30);
  rad.addColorStop(0, "rgba(255,196,120,0.26)");
  rad.addColorStop(0.45, "rgba(255,150,80,0.1)");
  rad.addColorStop(1, "rgba(255,120,60,0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, 64, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
