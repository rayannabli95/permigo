// « Secondes d'avance ». Trente secondes, une rue, cinq événements.
//
// La boucle tient en une ligne :
//   JE VOIS AVANT → JE TOUCHE → LE MONDE RÉAGIT → JE GAGNE DU TEMPS.
//
// Un seul geste : toucher ce qui va poser problème. Pas de caméra à bouger,
// pas de frein, pas de volant, pas de choix A/B. ⭐ VOIR SUFFIT : quand la
// lecture est juste, la voiture se comporte comme quelqu'un qui a vu.
//
// La récompense n'est pas un score, c'est `incident − instant du doigt`, en
// secondes. Le même nombre sert de plaisir au joueur et de mesure au produit,
// et une seconde d'avance en jeu est une seconde d'avance en voiture.

import { creerMonde, AVANT } from "../engine/world.js";
import { creerSon } from "../engine/audio.js";
import { creerPost } from "../engine/post.js";
import { creerQualite } from "../engine/qualite.js";
import { chargerModeles, copier } from "../engine/modeles.js";
import { creerKit } from "../environments/kit.js";
import { construireRue, X_STATIONNE } from "./rue.js";
import { EVENEMENTS, TROUS, DUREE, VITESSE, DEPART } from "./scenario.js";

const MODELES = {
  voiture: { fichier: "voiture.glb", longueur: 4.2, capOffset: -Math.PI / 2 },
  gris: { fichier: "gris.glb", longueur: 4.25, capOffset: -Math.PI / 2 },
  camion: { fichier: "camion.glb", longueur: 7.6, capOffset: -Math.PI / 2 },
  pieton: { fichier: "pieton.glb", hauteur: 1.72, capOffset: Math.PI },
  velo: { fichier: "velo.glb", hauteur: 1.75, capOffset: Math.PI },
  arbre: { fichier: "arbre.glb", hauteur: 7.2 },
};

// Le moment de découverte, au centième. Court, sinon il casse le rythme ;
// trop court, il ne claque pas. 0,42 s en tout.
const SUSPENSION = { creux: 0.3, sortie: 0.12, tempo: 0.08 };

export async function creerPartie(hote, { sur = () => {} } = {}) {
  const THREE = await import("three");
  const monde = creerMonde(THREE, hote, { jour: true });
  const modeles = await chargerModeles(THREE, MODELES, {
    base: `${import.meta.env.BASE_URL || "/"}art/course3d/`,
  });
  const kit = creerKit(THREE);

  const { groupe, animer } = construireRue(THREE, modeles, kit, {
    trous: TROUS,
  });
  monde.scene.add(groupe);

  // 🔴 44° de champ vertical, pas 55°. Ce n'est pas un réglage de confort :
  // à 55° une portière qui s'entrouvre à soixante mètres fait quatre pixels
  // et le jeu est injouable. Resserrer le champ, c'est mettre des pixels sur
  // le lointain, et le lointain est tout le sujet.
  monde.camera.fov = 44;
  monde.camera.updateProjectionMatrix();

  const post = creerPost(THREE, monde);
  // 🔴 L'étalonnage par défaut est celui du CRÉPUSCULE : les ombres tirent
  // vers le violet, les hautes lumières vers l'ambre, et le vignettage est
  // lourd. Appliqué à une rue de plein jour, il rend une image sale et
  // bleuâtre — exactement ce qu'on cherche à fuir. Ici : neutre, contrasté,
  // propre. La DA reviendra, la lisibilité passe d'abord.
  Object.assign(post.uniforms.uFroid, { value: 0.02 });
  Object.assign(post.uniforms.uChaud, { value: 0.05 });
  Object.assign(post.uniforms.uSaturation, { value: 1.08 });
  Object.assign(post.uniforms.uVignette, { value: 0.3 });
  Object.assign(post.uniforms.uGrain, { value: 0.018 });
  Object.assign(post.uniforms.uAberration, { value: 0.0005 });
  const qualite = creerQualite(monde, {});
  qualite.brancherPost(post);
  const son = creerSon();

  // L'anneau qui se referme sur ce qu'on vient de trouver. Une seule pièce.
  const anneau = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 0.94, 44),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      fog: false,
    }),
  );
  anneau.renderOrder = 50;
  anneau.visible = false;
  monde.scene.add(anneau);

  // ── Les acteurs des cinq événements ────────────────────────────────────
  const touchables = [];
  const corps = new Map(); // "evt.acteur" → objet 3D

  function fabriquer(a) {
    if (a.type === "porte") {
      // Une portière tourne autour de sa CHARNIÈRE, pas de son centre : on la
      // décale dans un pivot, sinon elle pivote sur elle-même comme une
      // hélice et personne ne comprend ce qu'il regarde.
      const pivot = new THREE.Group();
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 1.0, 1.05),
        new THREE.MeshStandardMaterial({ color: 0x2f4f86, roughness: 0.4 }),
      );
      m.position.set(0, 0, 0.52);
      m.castShadow = true;
      pivot.add(m);
      pivot.position.y = 0.62;
      return pivot;
    }
    if (a.type === "poubelle") {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.05, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x3f4a3f, roughness: 0.9 }),
      );
      m.position.y = 0.52;
      m.castShadow = true;
      const g = new THREE.Group();
      g.add(m);
      return g;
    }
    if (a.type === "enfant" || a.type === "pieton") {
      const p = copier(modeles.pieton) || kit.vehicule("pieton", a.couleur);
      if (a.type === "enfant") p.scale.multiplyScalar(0.62);
      const g = new THREE.Group();
      g.add(p);
      return g;
    }
    if (a.type === "velo") {
      const v = copier(modeles.velo) || kit.vehicule("velo", a.couleur);
      const g = new THREE.Group();
      g.add(v);
      return g;
    }
    const cle = a.type === "camion" ? "camion" : "voiture";
    const m = copier(modeles[cle]) || kit.vehicule(a.type, a.couleur);
    const g = new THREE.Group();
    g.add(m);
    if (a.feux) {
      const f = kit.feuxVehicule(1.85, 4.2);
      g.add(f);
      g.userData.feux = f;
    }
    return g;
  }

  const evts = EVENEMENTS.map((e) => {
    const objets = {};
    for (const a of e.acteurs) {
      const o = fabriquer(a);
      o.visible = false;
      o.traverse((x) => {
        if (x.isMesh) x.castShadow = true;
      });
      o.userData.evenement = e.id;
      monde.scene.add(o);
      objets[a.id] = o;
      corps.set(`${e.id}.${a.id}`, o);
      touchables.push(o);
      // Une tache de contact sous ce qui roule : sans elle un véhicule flotte.
      if (a.type === "voiture" || a.type === "camion") {
        const t = kit.tache(1.9, a.type === "camion" ? 7 : 4.3, 0.45);
        t.visible = false;
        monde.scene.add(t);
        o.userData.tache = t;
      }
    }
    return {
      def: e,
      objets,
      actif: false,
      fini: false,
      te: 0,
      trouve: false,
      rate: false,
    };
  });

  // Les voitures garées sont touchables elles aussi : c'est indispensable.
  // Sans elles, « ce qui est touchable » trahit où sont les événements et le
  // jeu se résout en tapant partout.
  groupe.traverse((o) => {
    if (o.isGroup && o.children.length && o.position.y === 0)
      touchables.push(o);
  });

  // ── L'état de la partie ────────────────────────────────────────────────
  const etat = {
    phase: "roule", // roule · decouverte · consequence · rembobine · fini
    t: 0,
    avance: 0, // le total, en secondes gagnées
    fauxPositifs: 0,
    trouves: 0,
    manques: 0,
    journal: [],
  };
  const v = { x: DEPART.x, z: DEPART.z, vitesse: VITESSE, ecart: 0 };
  let securiteJusqu = -1; // « voir suffit » : la voiture lève le pied
  let freinUrgence = 0;
  let suspension = 0; // temps restant du moment de découverte
  let cibleFocus = null;
  let rembobine = null;

  const camera = monde.camera;
  const rayon = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const projete = new THREE.Vector3();

  // ── Le doigt ───────────────────────────────────────────────────────────
  function toucher(px, py) {
    if (etat.phase !== "roule") return;
    const r = hote.getBoundingClientRect();
    ndc.set(
      ((px - r.left) / r.width) * 2 - 1,
      -((py - r.top) / r.height) * 2 + 1,
    );
    rayon.setFromCamera(ndc, camera);
    const touches = rayon.intersectObjects(touchables, true);
    if (!touches.length) return; // le ciel ne coûte rien

    // On remonte au groupe qui porte l'événement.
    let o = touches[0].object;
    while (o && !o.userData.evenement && o.parent) o = o.parent;
    const id = o?.userData?.evenement;
    const e = evts.find((x) => x.def.id === id);

    // Rien de vivant, ou pas encore lisible : « pas encore ». C'est une
    // hypothèse, pas une faute. ⭐ La punition monte doucement, sinon on
    // fabrique un joueur qui n'ose plus toucher, et c'est le pire résultat
    // possible pour un jeu qui veut apprendre à formuler des hypothèses.
    if (
      !e ||
      !e.actif ||
      e.trouve ||
      e.def.lisible === null ||
      e.te < e.def.lisible
    ) {
      etat.fauxPositifs++;
      const cout =
        etat.fauxPositifs === 1 ? 0 : etat.fauxPositifs === 2 ? 0.5 : 1;
      etat.avance = Math.max(0, etat.avance - cout);
      sur("pasencore", { cout, total: etat.avance });
      return;
    }

    // ⭐ Trouvé. Le gain est le temps qu'il reste avant que ça arrive.
    const gain = Math.max(0, e.def.incident - e.te);
    e.trouve = true;
    etat.trouves++;
    etat.avance += gain;
    etat.journal.push({
      evenement: e.def.id,
      te: +e.te.toFixed(2),
      gain: +gain.toFixed(2),
    });

    // Le monde suspend, le son se coupe, l'image se focalise sur lui.
    suspension = SUSPENSION.creux + SUSPENSION.sortie;
    cibleFocus = e.objets[e.def.porteur];
    anneau.visible = true;
    anneau.material.opacity = 0;
    son.jouer("clic");
    // « Voir suffit » : la voiture lève le pied et s'écarte, toute seule.
    securiteJusqu = etat.t + 4.2;
    sur("trouve", {
      gain,
      total: etat.avance,
      ecran: versEcran(cibleFocus),
      indice: e.def.indice,
    });
  }

  function versEcran(objet) {
    if (!objet) return [0.5, 0.5];
    objet.getWorldPosition(projete);
    projete.y += 0.9;
    projete.project(camera);
    return [projete.x * 0.5 + 0.5, projete.y * 0.5 + 0.5];
  }

  const surAppui = (e) => toucher(e.clientX, e.clientY);
  hote.addEventListener("pointerdown", surAppui);

  // ── La boucle ──────────────────────────────────────────────────────────
  monde.demarrer((dtReel) => {
    qualite.maj(dtReel);

    // Le temps du monde. Il se suspend pendant la découverte, il ralentit
    // pendant la conséquence, il repart en arrière pendant le rembobinage.
    let tempo = 1;
    if (suspension > 0) {
      suspension -= dtReel;
      const sortie = Math.max(0, Math.min(1, suspension / SUSPENSION.sortie));
      tempo = SUSPENSION.tempo + (1 - SUSPENSION.tempo) * (1 - sortie);
      if (suspension <= 0) {
        cibleFocus = null;
        anneau.visible = false;
        post.focaliser(0);
      }
    }
    if (etat.phase === "consequence") tempo = 0.35;
    if (etat.phase === "rembobine") tempo = 0;
    const dt = dtReel * tempo;

    // Le focus suit sa cible : l'objet bouge encore un peu pendant les trois
    // dixièmes de suspension, et un halo figé à côté de lui trahirait tout.
    if (cibleFocus) {
      const force = Math.min(
        1,
        (SUSPENSION.creux + SUSPENSION.sortie - suspension) * 9,
      );
      post.focaliser(force, versEcran(cibleFocus), 0.11);
      cibleFocus.getWorldPosition(anneau.position);
      anneau.position.y += 0.9;
      anneau.lookAt(camera.position);
      anneau.material.opacity = force * 0.9;
      const k = 1.9 - force * 0.9;
      anneau.scale.setScalar(k);
    }

    if (etat.phase === "roule" || etat.phase === "consequence") {
      etat.t += dt;
      // La voiture. Elle roule seule. Quand on a VU, elle lève le pied et
      // elle s'écarte : c'est la seule conséquence du geste, et il n'y en a
      // pas besoin d'une autre.
      const vise =
        freinUrgence > 0 ? 1.2 : etat.t < securiteJusqu ? 5.4 : VITESSE;
      const ecartVise = etat.t < securiteJusqu ? -0.55 : 0;
      v.vitesse +=
        (vise - v.vitesse) * Math.min(1, dt * (vise < v.vitesse ? 2.6 : 1.1));
      v.ecart += (ecartVise - v.ecart) * Math.min(1, dt * 2.2);
      v.z -= v.vitesse * dt;
      v.x = DEPART.x + v.ecart;
      if (freinUrgence > 0) freinUrgence -= dt;
    }

    // Les événements. Chacun a son horloge locale, et son script est une
    // fonction pure de cette horloge : c'est ce qui rend le rembobinage
    // gratuit.
    for (const e of evts) {
      if (e.fini) continue;
      if (!e.actif) {
        if (v.z > e.def.zDeclenche) continue;
        e.actif = true;
        for (const id in e.objets) e.objets[id].visible = true;
      }
      if (etat.phase === "rembobine" && rembobine?.e === e) {
        e.te = rembobine.te;
      } else if (etat.phase !== "rembobine") {
        e.te += dt;
      }
      poser(e);

      // L'incident se produit sans qu'on l'ait vu : la conséquence se joue.
      if (
        !e.trouve &&
        !e.rate &&
        e.def.incident !== null &&
        e.te >= e.def.incident &&
        etat.phase === "roule"
      ) {
        e.rate = true;
        etat.manques++;
        freinUrgence = 1.4;
        son.jouer("alerte");
        etat.phase = "consequence";
        rembobine = { e, te: e.te, cible: e.def.incident, attente: 1.1 };
        sur("consequence", {});
      }
      if (e.te > e.def.fin) {
        e.fini = true;
        for (const id in e.objets) {
          e.objets[id].visible = false;
          if (e.objets[id].userData.tache)
            e.objets[id].userData.tache.visible = false;
        }
      }
    }

    // La conséquence, puis le rembobinage.
    if (etat.phase === "consequence" && rembobine) {
      rembobine.attente -= dtReel;
      if (rembobine.attente <= 0) {
        etat.phase = "rembobine";
        rembobine.te = rembobine.e.te;
        sur("flash", {});
      }
    }
    if (etat.phase === "rembobine" && rembobine) {
      const e = rembobine.e;
      const but = e.def.lisible ?? 0;
      if (rembobine.te > but) {
        // 🔴 On rembobine à 2,6× : plus lent, on s'ennuie ; plus rapide, on
        // ne voit pas ce qu'on nous montre, et c'est tout l'intérêt.
        rembobine.te = Math.max(but, rembobine.te - dtReel * 2.6);
        if (rembobine.te <= but) {
          cibleFocus = e.objets[e.def.porteur];
          anneau.visible = true;
          suspension = 1.5;
          sur("rate", {
            indice: e.def.indice,
            secondes: +(e.def.incident - e.def.lisible).toFixed(1),
            ecran: versEcran(cibleFocus),
          });
        }
      } else if (suspension <= 0) {
        e.fini = true;
        for (const id in e.objets) e.objets[id].visible = false;
        rembobine = null;
        etat.phase = "roule";
      }
    }

    // La caméra : le siège du conducteur, cadrée large, et RIEN à manipuler.
    camera.position.set(v.x - 0.34, 1.3, v.z);
    camera.rotation.order = "YXZ";
    camera.rotation.set(-0.035, 0, 0);
    animer(etat.t);
    monde.majOmbres(v.x, v.z);
    son.maj(dtReel, {
      vitesse: v.vitesse,
      gaz: 0,
      freinage: freinUrgence > 0 ? 0.9 : 0,
      fige: suspension > 0 || etat.phase === "rembobine",
    });

    if (etat.phase !== "fini" && etat.t >= DUREE && suspension <= 0) {
      etat.phase = "fini";
      sur("fin", {
        avance: +etat.avance.toFixed(1),
        trouves: etat.trouves,
        manques: etat.manques,
        fauxPositifs: etat.fauxPositifs,
        journal: etat.journal,
      });
    }

    sur("image", { t: etat.t, avance: etat.avance, kmh: v.vitesse * 3.6 });
  });

  function poser(e) {
    const p = e.def.pose(e.te);
    for (const id in p) {
      const o = e.objets[id];
      if (!o) continue;
      const q = p[id];
      o.position.set(q.x, q.y ?? 0, q.z);
      o.rotation.y = q.cap ?? 0;
      if (q.visible !== undefined) o.visible = q.visible && e.actif;
      // Le buste d'un cycliste qui regarde derrière lui : c'est le premier
      // enfant du groupe qui tourne, pas le vélo entier.
      if (q.buste !== undefined && o.children[0])
        o.children[0].rotation.y = q.buste * 1.5;
      if (q.court !== undefined && o.children[0])
        o.children[0].rotation.z = q.court ? Math.sin(e.te * 18) * 0.14 : 0;
      o.userData.feux?.userData.freiner(!!q.stop);
      const t = o.userData.tache;
      if (t) {
        t.visible = o.visible;
        t.position.set(q.x, 0.014, q.z);
        t.rotation.z = -(q.cap ?? 0);
      }
    }
  }

  return {
    monde,
    etat,
    son,
    post,
    qualite,
    get position() {
      return { ...v };
    },
    detruire() {
      hote.removeEventListener("pointerdown", surAppui);
      son.detruire();
      post.detruire();
      monde.detruire();
    },
  };
}

export { X_STATIONNE };
