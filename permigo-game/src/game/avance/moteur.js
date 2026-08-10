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
// secondes. Le même nombre sert de plaisir au joueur et de mesure au produit.
//
// 🔴 CE QUI A CHANGÉ LE 10/08 — le retour de Rayan, en une phrase :
// « minimaliste ≠ incompréhensible ». Le moteur était bon, l'expérience
// autour était muette. Donc : le champ de vision est refait (voir plus bas),
// chaque scène porte une phrase qui dit où regarder, la première scène est un
// tutoriel qui se relance tout seul si rien n'est touché, et l'aide diminue
// au fil des parties.

import { creerMonde } from "../engine/world.js";
import { creerSon } from "../engine/audio.js";
import { creerPost } from "../engine/post.js";
import { creerQualite } from "../engine/qualite.js";
import { creerKit } from "../environments/kit.js";
import { construireRue, X_STATIONNE } from "./rue.js";
import { EVENEMENTS, TROUS, DUREE, VITESSE, DEPART } from "./scenario.js";
import { VEHICULES_PORTEURS, VETEMENTS, lisere } from "../da/palette.js";
import { vehicule } from "../da/vehicules.js";
import { personnage, cycliste } from "../da/personnages.js";

// 🔴 PLUS AUCUN FICHIER À TÉLÉCHARGER. Les quatre modèles restants (camion,
// piéton, vélo, arbre) sont devenus morts avec les phases 2, 4 et 5 : tout est
// procédural. C'est le lint de performance qui les a trouvés, pas une
// relecture — ils continuaient d'être chargés avant la première image sans que
// rien ne s'en serve. Conséquence : `#/avance` n'émet plus une seule requête
// d'asset, donc plus de dépendance à la CSP et un démarrage instantané.
// Le moment de découverte, au centième. Court, sinon il casse le rythme ;
// trop court, il ne claque pas. 0,42 s en tout — sauf la toute première fois,
// où il dure le temps d'expliquer ce qu'est une seconde d'avance.
const SUSPENSION = { creux: 0.3, sortie: 0.12, tempo: 0.08 };
const SUSPENSION_PREMIERE = 2.4;

// 🔴 LE CHAMP HORIZONTAL, PAS LE VERTICAL. C'est le réglage qui a fait dire
// « j'ai l'impression de regarder une scène 3D de loin ».
//
// Un téléphone en portrait est haut et étroit. Three.js prend un champ
// VERTICAL : en fixer 44° sur un écran de rapport 0,46 donne 21° horizontaux,
// c'est-à-dire un téléobjectif. Un téléobjectif écrase la profondeur, et une
// image sans profondeur ressemble exactement à ce que Rayan a décrit : une
// scène regardée de loin, pas une route vue du siège conducteur.
//
// On fixe donc l'horizontal à 36° et on DÉDUIT le vertical du format réel de
// la fenêtre. Le pare-brise n'occupe plus tout l'écran (le poste de conduite
// prend le bas), donc le rapport de la zone 3D est bien plus proche du carré
// et le vertical reste raisonnable.
const FOV_H = 36;

// Le doigt n'est pas un rayon laser. Un enfant à trente mètres fait trente
// pixels de haut : exiger de le toucher au pixel près, c'est transformer un
// jeu de lecture en jeu d'adresse.
const TOLERANCE = 46;

export async function creerPartie(
  hote,
  { sur = () => {}, niveau = "guide", expliquer = false } = {},
) {
  const THREE = await import("three");
  // 📖 « Seize heures », la recette de lumière de la bible §4. C'est elle qui
  // donne du volume à un monde fait de primitives, et les ombres violettes
  // qui font qu'une capture est reconnaissable.
  const monde = creerMonde(THREE, hote, { heure: "seize" });
  const kit = creerKit(THREE);

  const { groupe, animer } = construireRue(THREE, kit, {
    trous: TROUS,
  });
  monde.scene.add(groupe);

  // 🔴 L'ombre ne couvrait que trente mètres autour de la voiture, et les
  // immeubles projettent en travers de toute la chaussée : leur ombre
  // s'arrêtait donc NET au milieu de la route, sur une arête bien droite qui
  // ressemble à une tache sale. Le champ passe à cinquante-cinq mètres, et la
  // carte double pour garder la même finesse par mètre.
  {
    const c = monde.soleil.shadow.camera;
    c.left = -55;
    c.right = 55;
    c.top = 55;
    c.bottom = -55;
    c.far = 170;
    c.updateProjectionMatrix();
    monde.soleil.shadow.mapSize.set(2048, 2048);
  }

  monde.surRedimension((l, h) => {
    const v = 2 * Math.atan((Math.tan((FOV_H * Math.PI) / 360) * h) / l);
    monde.camera.fov = Math.max(26, Math.min(64, (v * 180) / Math.PI));
    monde.camera.updateProjectionMatrix();
  });

  const post = creerPost(THREE, monde);
  // 🔴 L'étalonnage par défaut est celui du CRÉPUSCULE : les ombres tirent
  // vers le violet, les hautes lumières vers l'ambre, et le vignettage est
  // lourd. Appliqué à une rue de plein jour, il rend une image sale et
  // bleuâtre. Ici : neutre, contrasté, propre.
  // L'étalonnage « Seize heures » (bible §4) : CHAUD dans les hautes lumières,
  // VIOLET dans les ombres. C'est ce contraste de température qui fait le
  // « cinéma », et il ne coûte rien puisque la chaîne d'effets tourne déjà.
  Object.assign(post.uniforms.uFroid, { value: 0.05 });
  Object.assign(post.uniforms.uChaud, { value: 0.1 });
  // ⚠️ 1,05 et pas 1,12 : au-dessus, les façades sorbet virent au Lego. La
  // chaîne ACES sature déjà d'elle-même, l'étalonnage ne doit pas en rajouter.
  Object.assign(post.uniforms.uSaturation, { value: 1.05 });
  Object.assign(post.uniforms.uVignette, { value: 0.3 });
  Object.assign(post.uniforms.uGrain, { value: 0.016 });
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

  // ⭐ Le halo du tutoriel. Il n'existe QU'AU premier niveau d'aide, et il
  // n'apparaît que si l'élève n'a rien touché alors que le signe est déjà là.
  // Son rôle n'est pas de désigner le danger : c'est d'apprendre qu'on a le
  // droit de toucher l'image.
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.22, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      fog: false,
    }),
  );
  halo.renderOrder = 49;
  halo.visible = false;
  monde.scene.add(halo);
  let cibleHalo = null;

  // ── Les acteurs des cinq événements ────────────────────────────────────
  const touchables = [];

  function fabriquer(a) {
    if (a.type === "porte") {
      // Une portière tourne autour de sa CHARNIÈRE, pas de son centre : on la
      // décale dans un pivot, sinon elle pivote sur elle-même comme une
      // hélice et personne ne comprend ce qu'il regarde.
      const pivot = new THREE.Group();
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 1.02, 1.05),
        // Un bleu plus clair que la carrosserie : en s'ouvrant, la face
        // extérieure se tourne vers nous et prend le soleil. C'est ce qui la
        // rend lisible à trente mètres, où elle ne fait que douze pixels.
        new THREE.MeshStandardMaterial({
          color: lisere(VEHICULES_PORTEURS.bleu, 0.22),
          roughness: 0.34,
          metalness: 0.1,
        }),
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
      // ⭐ Plus de modèle importé : une quille dessinée, dont la tête tourne
      // indépendamment du corps. C'est la condition pour que « il a regardé
      // derrière lui » et « il regarde l'autre trottoir » soient LISIBLES.
      const p = personnage(THREE, {
        enfant: a.type === "enfant",
        couleur: a.couleur ?? null,
      });
      const g = new THREE.Group();
      g.add(p);
      g.userData.buste = p.userData.buste;
      g.userData.pas = p.userData.pas;
      return g;
    }
    if (a.type === "velo") {
      const v = cycliste(THREE, { couleur: a.couleur ?? null });
      const g = new THREE.Group();
      g.add(v);
      g.userData.buste = v.userData.buste;
      g.userData.pas = v.userData.pas;
      return g;
    }
    // 🔴 AUCUN MODÈLE 3D POUR UN VÉHICULE DE SCÈNE, et c'est un piège tombé
    // deux fois : les GLB sont texturés pour la DA de NUIT, donc en plein jour
    // ils rendent tous le même bleu marine. La voiture qui hésite est censée
    // être rouge et se repérer à soixante-dix mètres ; elle sortait bleu
    // sombre au milieu d'une file de voitures garées bleu sombre.
    //
    // ⭐ Un PORTEUR de scène est toujours laqué : son reflet le détache des
    // figurants, qui sont mats. La couleur et la finition font le travail
    // qu'un contour ou une flèche feraient dans un jeu moins soigné.
    const m = vehicule(
      THREE,
      a.type === "camion" ? "utilitaire" : "berline",
      a.couleur,
      { laque: true },
    );
    const g = new THREE.Group();
    g.add(m);
    g.userData.freiner = m.userData.freiner;
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
      amorceDite: false,
      relanceDite: false,
      zLisible: undefined, // où était la voiture quand le signe est apparu
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
    phase: "roule", // roule · consequence · rembobine · fini
    t: 0,
    avance: 0,
    fauxPositifs: 0,
    trouves: 0,
    manques: 0,
    dangers: EVENEMENTS.filter((e) => e.danger).length,
    journal: [],
  };
  const v = { x: DEPART.x, z: DEPART.z, vitesse: VITESSE, ecart: 0 };
  let securiteJusqu = -1; // « voir suffit » : la voiture lève le pied
  let freinUrgence = 0;
  let suspension = 0;
  let cibleFocus = null;
  let rembobine = null;
  let premierTrouve = true;

  const camera = monde.camera;
  const rayon = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const projete = new THREE.Vector3();

  function versEcran(objet, hauteur = 0.9) {
    if (!objet) return [0.5, 0.5];
    objet.getWorldPosition(projete);
    projete.y += hauteur;
    projete.project(camera);
    return [projete.x * 0.5 + 0.5, projete.y * 0.5 + 0.5];
  }

  // ── Le doigt ───────────────────────────────────────────────────────────
  //
  // `undefined` = le ciel, ça ne coûte rien. `null` = quelque chose d'inerte.
  // Sinon, l'événement visé.
  function viser(px, py) {
    const r = hote.getBoundingClientRect();
    // 1. Le porteur actif le plus proche, en pixels d'écran. C'est cette
    //    tolérance qui rend le jeu jouable au pouce.
    let meilleur = null;
    let dMin = Infinity;
    for (const e of evts) {
      if (!e.actif || e.fini || e.trouve || e.rate) continue;
      const o = e.objets[e.def.porteur];
      if (!o || !o.visible) continue;
      o.getWorldPosition(projete);
      projete.y += 0.6;
      projete.project(camera);
      if (projete.z > 1) continue; // derrière nous
      const ex = r.left + (projete.x * 0.5 + 0.5) * r.width;
      const ey = r.top + (-projete.y * 0.5 + 0.5) * r.height;
      const d = Math.hypot(px - ex, py - ey);
      if (d < dMin) {
        dMin = d;
        meilleur = e;
      }
    }
    if (meilleur && dMin <= TOLERANCE) return meilleur;

    // 2. Sinon le rayon, sur le décor.
    ndc.set(
      ((px - r.left) / r.width) * 2 - 1,
      -((py - r.top) / r.height) * 2 + 1,
    );
    rayon.setFromCamera(ndc, camera);
    const touches = rayon.intersectObjects(touchables, true);
    if (!touches.length) return undefined;
    let o = touches[0].object;
    while (o && !o.userData.evenement && o.parent) o = o.parent;
    const id = o?.userData?.evenement;
    return evts.find((x) => x.def.id === id) || null;
  }

  function toucher(px, py) {
    if (etat.phase !== "roule") return;
    const e = viser(px, py);
    if (e === undefined) return; // le ciel ne coûte rien

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

    // La toute première réussite de l'élève, une seule fois dans sa vie : le
    // monde reste suspendu le temps de dire ce que le nombre veut dire.
    const premier = expliquer && premierTrouve;
    premierTrouve = false;

    suspension = premier
      ? SUSPENSION_PREMIERE
      : SUSPENSION.creux + SUSPENSION.sortie;
    cibleFocus = e.objets[e.def.porteur];
    anneau.visible = true;
    anneau.material.opacity = 0;
    cibleHalo = null;
    halo.visible = false;
    son.jouer("clic");
    // « Voir suffit » : la voiture lève le pied et s'écarte, toute seule.
    securiteJusqu = etat.t + 2.6;
    sur("trouve", {
      gain,
      total: etat.avance,
      ecran: versEcran(cibleFocus),
      indice: e.def.indice,
      premier,
    });
  }

  const surAppui = (e) => toucher(e.clientX, e.clientY);
  hote.addEventListener("pointerdown", surAppui);

  // ── La boucle ──────────────────────────────────────────────────────────
  monde.demarrer((dtReel) => {
    qualite.maj(dtReel);

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

    // Le focus suit sa cible : l'objet bouge encore un peu pendant la
    // suspension, et un halo figé à côté de lui trahirait tout.
    if (cibleFocus) {
      const total =
        suspension > SUSPENSION.creux + SUSPENSION.sortie
          ? SUSPENSION_PREMIERE
          : SUSPENSION.creux + SUSPENSION.sortie;
      const force = Math.min(1, (total - suspension) * 9);
      // ⚠️ 0,86 et pas 1 : à pleine force le hors-champ tombe au gris sombre
      // et on ne reconnaît plus la rue autour de ce qu'on vient de trouver.
      // Et un rayon de 0,16 : c'est la LARGEUR de la zone épargnée, donc la
      // taille de ce que l'élève lit comme « ça, c'est ce que j'ai vu ».
      post.focaliser(force * 0.86, versEcran(cibleFocus), 0.16);
      cibleFocus.getWorldPosition(anneau.position);
      anneau.position.y += 0.9;
      anneau.lookAt(camera.position);
      anneau.material.opacity = force * 0.9;
      anneau.scale.setScalar(1.9 - force * 0.9);
    }

    // Le halo d'apprentissage, qui respire doucement.
    if (cibleHalo) {
      cibleHalo.getWorldPosition(halo.position);
      halo.position.y += 0.7;
      halo.lookAt(camera.position);
      halo.material.opacity = 0.26 + 0.2 * Math.sin(etat.t * 4.4);
      halo.scale.setScalar(1 + 0.09 * Math.sin(etat.t * 4.4));
    }

    if (etat.phase === "roule" || etat.phase === "consequence") {
      etat.t += dt;
      // 🔴 CE QUE COÛTENT LES RALENTISSEMENTS. Chaque scène ratée freinait à
      // 1,2 m/s pendant 1,4 s, et chaque scène trouvée levait le pied pendant
      // 4,2 s : vingt mètres perdus à chaque fois. Au bout de deux scènes, la
      // voiture avait vingt-cinq mètres de retard sur la chorégraphie, et les
      // deux dernières scènes ne se jouaient tout simplement jamais dans les
      // trente secondes. Le remède tient en deux endroits : on freine moins
      // fort ici, et la partie ne se termine plus à l'heure mais quand les
      // cinq scènes ont été jouées (voir la fin de la boucle).
      const vise =
        freinUrgence > 0 ? 3.4 : etat.t < securiteJusqu ? 6.4 : VITESSE;
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

      // 🔴 On note OÙ ÉTAIT LA VOITURE au moment où le signe est devenu
      // lisible. Sans ça, le rembobinage remettait la scène en arrière mais
      // pas la caméra : on se retrouvait à montrer une portière située
      // trente mètres DERRIÈRE le joueur, donc un écran gris. Le seul moment
      // du jeu censé faire comprendre ce qu'on a raté ne montrait rien.
      if (
        e.zLisible === undefined &&
        e.def.lisible !== null &&
        e.te >= e.def.lisible
      )
        e.zLisible = v.z;

      // ⭐ L'amorce : la phrase qui donne une raison de regarder CET élément.
      // C'est elle qui remplace le tutoriel qu'on ne fera pas.
      const a = e.def.amorce;
      if (a && !e.amorceDite && e.te >= a.te && etat.phase === "roule") {
        e.amorceDite = true;
        const texte =
          niveau === "guide" ? a.guide : niveau === "vague" ? a.vague : null;
        if (texte) sur("amorce", { texte, evenement: e.def.id });
      }
      // La relance du tutoriel, au premier niveau d'aide seulement.
      const r = e.def.relance;
      if (
        r &&
        niveau === "guide" &&
        !e.relanceDite &&
        !e.trouve &&
        e.te >= r.te &&
        etat.phase === "roule"
      ) {
        e.relanceDite = true;
        cibleHalo = e.objets[e.def.porteur];
        halo.visible = true;
        sur("relance", { texte: r.texte });
      }
      if ((e.trouve || e.rate) && cibleHalo === e.objets[e.def.porteur]) {
        cibleHalo = null;
        halo.visible = false;
      }

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
        freinUrgence = 1.0;
        cibleHalo = null;
        halo.visible = false;
        son.jouer("alerte");
        etat.phase = "consequence";
        rembobine = { e, te: e.te, attente: 1.1 };
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
        const e = rembobine.e;
        etat.phase = "rembobine";
        rembobine.te = e.te;
        rembobine.depart = e.te;
        rembobine.but = e.def.lisible ?? 0;
        // La caméra rembobine avec la scène. On revient exactement là où on
        // était quand le signe est apparu — et on repartira d'ici, sans
        // rejouer les trente mètres : le rembobinage est un REPLAY, il ne
        // doit rien coûter de plus que les secondes déjà perdues.
        rembobine.zDepart = v.z;
        rembobine.zBut =
          e.zLisible ?? v.z + VITESSE * (rembobine.depart - rembobine.but);
        sur("flash", {});
      }
    }
    if (etat.phase === "rembobine" && rembobine) {
      const e = rembobine.e;
      const but = rembobine.but;
      if (rembobine.te > but) {
        // 🔴 On rembobine à 2,6× : plus lent, on s'ennuie ; plus rapide, on
        // ne voit pas ce qu'on nous montre, et c'est tout l'intérêt.
        rembobine.te = Math.max(but, rembobine.te - dtReel * 2.6);
        const k =
          rembobine.depart > but
            ? (rembobine.te - but) / (rembobine.depart - but)
            : 0;
        v.z = rembobine.zBut + (rembobine.zDepart - rembobine.zBut) * k;
        if (rembobine.te <= but) {
          cibleFocus = e.objets[e.def.porteur];
          anneau.visible = true;
          suspension = 1.6;
          sur("rate", {
            indice: e.def.indice,
            secondes: +(e.def.incident - e.def.lisible).toFixed(1),
            ecran: versEcran(cibleFocus),
          });
        }
      } else if (suspension <= 0) {
        e.fini = true;
        for (const id in e.objets) e.objets[id].visible = false;
        v.z = rembobine.zDepart; // on reprend la route où on l'avait laissée
        rembobine = null;
        etat.phase = "roule";
      }
    }

    // La caméra : le siège du conducteur, et RIEN à manipuler.
    // ⚠️ 1,22 m et non 1,30 : c'est la hauteur d'œil réelle dans une berline,
    // et elle change tout — plus haut on survole la route comme une caméra de
    // drone, plus bas on ne voit plus par-dessus les voitures garées.
    camera.position.set(v.x - 0.32, 1.22, v.z);
    camera.rotation.order = "YXZ";
    camera.rotation.set(-0.05, 0, 0);
    animer(etat.t);
    monde.majOmbres(v.x, v.z);
    son.maj(dtReel, {
      vitesse: v.vitesse,
      gaz: 0,
      freinage: freinUrgence > 0 ? 0.9 : 0,
      fige: suspension > 0 || etat.phase === "rembobine",
    });

    // ⭐ La partie ne s'arrête pas au chronomètre : elle s'arrête quand les
    // cinq scènes ont été jouées. Trente secondes est une CIBLE, pas une
    // guillotine — un élève qui rate tout roule moins vite, et il a le droit
    // de voir l'enfant lui aussi.
    if (
      etat.phase !== "fini" &&
      etat.t >= DUREE &&
      evts.every((e) => e.fini) &&
      suspension <= 0
    ) {
      etat.phase = "fini";
      sur("fin", {
        avance: +etat.avance.toFixed(1),
        trouves: etat.trouves,
        dangers: etat.dangers,
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
      const buste = o.userData.buste ?? o.children[0];
      if (q.buste !== undefined && buste) buste.rotation.y = q.buste * 1.5;
      // ⭐ La marche est pilotée par le DÉPLACEMENT MESURÉ, jamais par un
      // drapeau posé à la main dans le scénario. Conséquence : un piéton ne
      // peut pas glisser, un enfant qui s'élance court forcément, et le
      // rembobinage reste cohérent puisque la vitesse redevient nulle.
      if (o.userData.pas) {
        const av = o.userData.dernier;
        const dt = av ? Math.abs(e.te - av.te) : 0;
        const d = av ? Math.hypot(q.x - av.x, q.z - av.z) : 0;
        o.userData.pas(e.te, dt > 1e-4 ? Math.min(1, d / dt / 1.3) : 0);
        o.userData.dernier = { x: q.x, z: q.z, te: e.te };
      }
      if (q.court !== undefined && o.children[0])
        o.children[0].rotation.z = q.court ? Math.sin(e.te * 18) * 0.14 : 0;
      o.userData.freiner?.(!!q.stop);
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
