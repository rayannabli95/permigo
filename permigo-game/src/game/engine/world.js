// Le monde : la scène Three.js, le rendu, la boucle. Rien de métier ici.
//
// Repère du jeu (celui de Three.js, sans changement) :
//   X = est, Z = sud, Y = hauteur. Un objet de rotation nulle regarde vers -Z.
//   Donc « avant » = (-sin(cap), 0, -cos(cap)) et le cap augmente vers la GAUCHE.
// Tout le reste du moteur ne connaît que ça : mètres, secondes, radians.
//
// ⚠️ Three.js est chargé en import dynamique par le runner : il ne doit JAMAIS
// entrer dans le bundle principal de l'app.

export const AVANT = (cap) => [-Math.sin(cap), -Math.cos(cap)];

// Un pas de temps se borne : un onglet réveillé après 10 s téléporterait
// la voiture au bout du monde (et à travers les murs).
export const PAS_MAX = 0.05;

export function creerMonde(
  THREE,
  hote,
  { qualite = "auto", jour = false, heure = null } = {},
) {
  const scene = new THREE.Scene();

  // ⭐ « SEIZE HEURES » — la recette de lumière de la direction artistique.
  // 📖 docs/PERMIGO_GAME_ART_BIBLE.md §4.
  //
  // Ce n'est pas un préréglage de confort, c'est LA décision qui donne du
  // volume à un monde fait de primitives : un soleil à 46° venant de
  // l'avant-gauche donne à chaque façade une face éclairée et une face à
  // l'ombre. Le « plein jour neutre » précédent éclairait tout pareil, donc
  // tout était plat, et c'est ça qu'on voyait comme « des primitives ».
  //
  // 🔴 Le sol de l'hémisphère est VIOLET (`0x8a76a8`) : c'est lui qui teinte
  // toutes les ombres du jeu. Une ligne, et c'est la signature visuelle la
  // plus reconnaissable de PermiGo.
  const seize = heure === "seize";
  if (seize) jour = true;

  // Deux ambiances. Le crépuscule violet est la DA PermiGo. Le PLEIN JOUR
  // existe pour une seule raison, et elle prime sur la DA : sur un banc
  // d'essai d'observation, il faut VOIR. Une voiture grise sur du bitume
  // sombre à quarante mètres n'est lisible par personne.
  const CIEL = seize ? 0xe8ddc9 : jour ? 0xc8ddf2 : 0x2a1d5c;
  // La brume de « seize heures » est CRÈME, pas bleue : c'est elle qui pose
  // l'heure. Elle commence plus loin (130 m) pour ne pas laver les scènes
  // détectables de loin, qui se jouent à 70 m.
  scene.fog = new THREE.Fog(
    CIEL,
    seize ? 165 : jour ? 120 : 55,
    seize ? 380 : jour ? 340 : 160,
  );

  // Le ciel est un dégradé, pas un aplat. Une couleur unique donne un fond de
  // studio : il n'y a plus d'horizon, donc plus de profondeur. Un dôme et une
  // texture de 2 × 64 px suffisent, et ça ne coûte rien à dessiner.
  const bandeau = document.createElement("canvas");
  bandeau.width = 2;
  bandeau.height = 64;
  const g2 = bandeau.getContext("2d");
  // ⚠️ Le haut de cette image est le ZÉNITH et son milieu est l'HORIZON
  // (la sphère prend la texture du pôle bas au pôle haut). La lueur chaude se
  // pose donc vers 0,48, juste AU-DESSUS de la ligne d'horizon. Placée en bas
  // de l'image, elle se retrouve sous le sol et on ne la voit jamais.
  const grad = g2.createLinearGradient(0, 0, 0, 64);
  if (seize) {
    grad.addColorStop(0, "#6fa8e6"); // zénith
    grad.addColorStop(0.34, "#8fbde9");
    grad.addColorStop(0.47, "#cfe0ee");
    grad.addColorStop(0.5, "#f3e7cf"); // ⭐ l'horizon crème : il teinte tous
    grad.addColorStop(1, "#b9a894"); //    les reflets de carrosserie
  } else if (jour) {
    grad.addColorStop(0, "#2f74c8"); // zénith
    grad.addColorStop(0.34, "#69a4de");
    grad.addColorStop(0.47, "#a8cbea");
    grad.addColorStop(0.5, "#d6e6f4"); // l'horizon, presque blanc
    grad.addColorStop(1, "#9fb0bd");
  } else {
    grad.addColorStop(0, "#120d33"); // zénith
    grad.addColorStop(0.35, "#241a4e");
    grad.addColorStop(0.44, "#43285f");
    grad.addColorStop(0.48, "#8a5570"); // la dernière lueur du jour
    grad.addColorStop(0.5, "#6b4468"); // l'horizon
    grad.addColorStop(1, "#201840");
  }
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 2, 64);
  const texCiel = new THREE.CanvasTexture(bandeau);
  texCiel.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(190, 24, 14),
    new THREE.MeshBasicMaterial({
      map: texCiel,
      side: THREE.BackSide,
      fog: false,
    }),
  );
  scene.add(dome);

  // La lumière d'un crépuscule, pas d'une nuit noire. Deux sources et un
  // contre-jour : le ciel violet remplit les ombres, le soleil rasant chaud
  // détache les volumes, et une troisième lumière froide et faible vient de
  // derrière pour dessiner les arêtes. Sans ce contre-jour, une voiture
  // sombre sur une route sombre n'a plus de silhouette.
  // ⚠️ Le total reçu par une surface à plat doit rester sous 1,4, sinon tout
  // l'horizontal part en blanc (c'est ce qui cramait le capot).
  // 🔴🔴 LE SOL DE L'HÉMISPHÈRE EST VIOLET EN « SEIZE HEURES ». C'est la
  // signature Y de la bible : toute ombre du jeu tire vers le violet de la
  // marque au lieu du gris. Une seule valeur, et une capture devient
  // reconnaissable. Ne pas la « corriger » vers un gris neutre.
  const ambiante = seize
    ? new THREE.HemisphereLight(0xcfe0f6, 0x8a76a8, 0.9)
    : jour
      ? new THREE.HemisphereLight(0xcfe2f7, 0x9a8f7e, 1.05)
      : new THREE.HemisphereLight(0xb9a9ff, 0x40336b, 0.9);
  scene.add(ambiante);

  const rebond = new THREE.DirectionalLight(
    jour ? 0xbdd6ff : 0x8fa8ff,
    seize ? 0.2 : jour ? 0.24 : 0.3,
  );
  rebond.position.set(18, 12, -30);
  scene.add(rebond);

  const soleil = new THREE.DirectionalLight(
    seize ? 0xfff0d8 : jour ? 0xfff4e2 : 0xffc98a,
    seize ? 2.2 : jour ? 2.1 : 1,
  );
  // ⚠️ En plein jour le soleil est HAUT (≈ 60°) : les ombres sont courtes et
  // dures, et c'est exactement ce qu'on veut. Une ombre longue et molle rend
  // le sol sale et noie les petits indices au ras du bitume.
  // ⭐ À seize heures il vient de l'AVANT-GAUCHE, à 46° : les façades et les
  // véhicules de DROITE (là où vivent tous nos événements) prennent la
  // lumière, et l'ombre des immeubles de gauche barre la chaussée en
  // diagonale. Cette diagonale est notre bande de profondeur, gratuite.
  if (seize) soleil.position.set(-28, 34, 16);
  else if (jour) soleil.position.set(34, 52, 26);
  else soleil.position.set(-26, 20, 18); // rasant : les ombres s'allongent
  scene.add(soleil);
  scene.add(soleil.target);

  const dpr = window.devicePixelRatio || 1;
  const petit = Math.min(window.innerWidth, window.innerHeight) < 500;

  // 🔴 Les ombres ne se coupent PLUS sur téléphone. C'était le réglage le plus
  // coûteux de l'audit : sans ombre portée, rien ne touche le sol, tout a
  // l'air posé en autocollant sur le décor. Le cadre est serré autour de la
  // voiture (voir majOmbres) : une carte de 1024 sur 60 m reste nette.
  soleil.shadow.mapSize.set(1024, 1024);
  {
    const c = soleil.shadow.camera;
    c.left = -30;
    c.right = 30;
    c.top = 30;
    c.bottom = -30;
    c.near = 1;
    c.far = 110;
    soleil.shadow.bias = -0.0012;
    soleil.shadow.normalBias = 0.02; // évite l'ombre qui grimpe sur les faces
    soleil.shadow.radius = seize ? 2 : jour ? 1.6 : 3;
    // ⚠️ Une ombre à 1 tombe au NOIR : le ciel remplit toujours les ombres.
    // En plein jour elle peut être plus franche, c'est elle qui pose les
    // objets au sol et qui rend une portière entrouverte lisible de loin.
    if ("intensity" in soleil.shadow)
      soleil.shadow.intensity = seize ? 0.72 : jour ? 0.8 : 0.68;
  }

  const rendu = new THREE.WebGLRenderer({
    // ⚠️ Ne sert QUE lorsque la chaîne d'effets est absente : dès qu'on
    // dessine dans une cible intermédiaire, c'est elle qui porte
    // l'anticrénelage (cf. post.js et son échantillonnage multiple).
    antialias: true,
    powerPreference: "high-performance",
  });
  rendu.setPixelRatio(Math.min(dpr, 2));
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = THREE.PCFShadowMap;
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = seize ? 1.0 : jour ? 0.98 : 1.28;
  rendu.domElement.style.cssText = "display:block;width:100%;height:100%";
  hote.appendChild(rendu.domElement);

  // ⭐ La carte d'environnement. C'est LE réglage qui sépare « des formes
  // colorées » d'un rendu de jeu : sans elle, une carrosserie ne reflète rien
  // et reste un aplat, quel que soit l'éclairage. On cuit le dégradé de ciel
  // une seule fois au démarrage — le coût est nul ensuite.
  const equi = texCiel.clone();
  equi.mapping = THREE.EquirectangularReflectionMapping;
  equi.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(rendu);
  pmrem.compileEquirectangularShader();
  const cible = pmrem.fromEquirectangular(equi);
  scene.environment = cible.texture;
  // ⭐ C'est CETTE valeur qui fait le glossy des carrosseries laquées : le
  // ciel cuit en carte d'environnement se reflète dessus. C'est la qualité
  // perçue la moins chère de tout le moteur, elle est déjà payée.
  scene.environmentIntensity = seize ? 1.15 : jour ? 1.05 : 0.85;
  pmrem.dispose();
  equi.dispose();

  // 55° de champ vertical. Plus large, c'est un grand-angle : une voiture à
  // 60 m tombe à quelques pixels, on ne la voit littéralement pas arriver.
  const camera = new THREE.PerspectiveCamera(55, 1, 0.25, 220);
  scene.add(camera);

  // Ce qui dessine réellement l'image. Par défaut c'est le rendu direct ; la
  // chaîne d'effets (post.js) vient prendre sa place quand elle s'installe.
  // Le reste du moteur n'a pas à savoir laquelle des deux tourne.
  let dessiner = () => rendu.render(scene, camera);
  const auxRedimensions = [];

  function taille() {
    const r = hote.getBoundingClientRect();
    const l = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
    auxRedimensions.forEach((f) => f(l, h));
  }
  taille();
  const ro = new ResizeObserver(taille);
  ro.observe(hote);

  const soleilDecalage = seize
    ? [-28, 34, 16]
    : jour
      ? [34, 52, 26]
      : [-26, 20, 18];

  // L'ombre ne couvre que 60 m : sans ça, une carte d'ombre de 1024 px étalée
  // sur toute la scène ne montre plus rien.
  function majOmbres(x, z) {
    // Le dôme de ciel suit la voiture, sinon en s'éloignant on finit par
    // s'approcher de sa paroi et l'horizon se met à pencher.
    dome.position.set(x, 0, z);
    if (!soleil.castShadow) return;
    soleil.position.set(
      x + soleilDecalage[0],
      soleilDecalage[1],
      z + soleilDecalage[2],
    );
    soleil.target.position.set(x, 0, z);
    soleil.target.updateMatrixWorld();
  }

  // ── Ce que le gouverneur de qualité peut changer à chaud ──────────────
  function reglerDensite(d) {
    const v = Math.max(1, Math.min(3, d));
    if (Math.abs(rendu.getPixelRatio() - v) < 0.01) return;
    rendu.setPixelRatio(v);
    taille(); // les cibles de rendu de la chaîne d'effets suivent
  }

  // Les ombres portées : on ou off, et rien d'autre.
  //
  // 🔴🔴 `PCFSoftShadowMap` est DÉPRÉCIÉ dans cette version de Three.js. Le
  // moteur le remplace lui-même par `PCFShadowMap` À CHAQUE IMAGE, dans
  // `WebGLShadowMap.render` :
  //
  //     if (this.type === PCFSoftShadowMap) { warn(...); this.type = PCFShadowMap; }
  //
  // On demandait donc des ombres douces, on en obtenait des dures, et le seul
  // indice était un avertissement noyé dans la console. Trouvé en piégeant
  // l'écriture de la propriété, pas en relisant le code.
  //
  // La douceur vient maintenant de deux réglages qui, eux, fonctionnent :
  // le rayon de flou et surtout l'INTENSITÉ, qui empêche l'ombre de tomber au
  // noir pur (« jamais du noir pur », cf. la grille de qualité).
  function reglerOmbres(actives) {
    if (soleil.castShadow === !!actives) return;
    soleil.castShadow = !!actives;
    rendu.shadowMap.enabled = !!actives;
    rendu.shadowMap.needsUpdate = true;
  }

  // La boucle. `sur` reçoit le pas de temps borné, en secondes.
  let brut = 0;
  let dernier = 0;
  let vivant = true;
  const mesures = [];
  function demarrer(sur) {
    const image = (t) => {
      if (!vivant) return;
      brut = requestAnimationFrame(image);
      if (!dernier) dernier = t;
      const dt = Math.min(PAS_MAX, (t - dernier) / 1000);
      if (mesures.length < 400) mesures.push(t - dernier);
      dernier = t;
      sur(dt, t / 1000);
      dessiner(dt);
    };
    brut = requestAnimationFrame(image);
  }

  function detruire() {
    vivant = false;
    cancelAnimationFrame(brut);
    ro.disconnect();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else if (m) m.dispose();
    });
    rendu.dispose();
    rendu.domElement.remove();
  }

  return {
    THREE,
    scene,
    camera,
    rendu,
    soleil,
    ambiante,
    petit,
    taille,
    majOmbres,
    reglerDensite,
    reglerOmbres,
    get densite() {
      return rendu.getPixelRatio();
    },
    get ombres() {
      return soleil.castShadow;
    },
    // La chaîne d'effets s'installe ici, et peut se retirer d'elle-même si la
    // machine ne suit pas (voir post.js).
    brancherRendu(fn) {
      dessiner = fn || ((_dt) => rendu.render(scene, camera));
    },
    surRedimension(fn) {
      auxRedimensions.push(fn);
      const r = hote.getBoundingClientRect();
      fn(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)));
    },
    demarrer,
    detruire,
    get mesures() {
      return mesures;
    },
  };
}
