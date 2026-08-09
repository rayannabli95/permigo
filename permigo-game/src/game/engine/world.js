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

export function creerMonde(THREE, hote, { qualite = "auto" } = {}) {
  const scene = new THREE.Scene();

  // Crépuscule violet : c'est la DA PermiGo, et une scène de nuit franche
  // rend une intersection illisible.
  const CIEL = 0x2a1d5c;
  scene.fog = new THREE.Fog(CIEL, 55, 160);

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
  grad.addColorStop(0, "#120d33"); // zénith
  grad.addColorStop(0.35, "#241a4e");
  grad.addColorStop(0.44, "#43285f");
  grad.addColorStop(0.48, "#8a5570"); // la dernière lueur du jour
  grad.addColorStop(0.5, "#6b4468"); // l'horizon
  grad.addColorStop(1, "#201840");
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
  const ambiante = new THREE.HemisphereLight(0xb9a9ff, 0x40336b, 0.9);
  scene.add(ambiante);

  const rebond = new THREE.DirectionalLight(0x8fa8ff, 0.3);
  rebond.position.set(18, 12, -30);
  scene.add(rebond);

  const soleil = new THREE.DirectionalLight(0xffc98a, 1);
  soleil.position.set(-26, 20, 18); // rasant : les ombres s'allongent
  scene.add(soleil);
  scene.add(soleil.target);

  const dpr = window.devicePixelRatio || 1;
  const petit = Math.min(window.innerWidth, window.innerHeight) < 500;
  const ombres = qualite === "haute" || (qualite === "auto" && !petit);
  if (ombres) {
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(1024, 1024);
    // Le cadre d'ombre suit la voiture (voir majOmbres) : serré = net.
    const c = soleil.shadow.camera;
    c.left = -30;
    c.right = 30;
    c.top = 30;
    c.bottom = -30;
    c.near = 1;
    c.far = 110;
    soleil.shadow.bias = -0.0012;
  }

  const rendu = new THREE.WebGLRenderer({
    antialias: !petit,
    powerPreference: "high-performance",
  });
  // Au-delà de 2, on paie un million de pixels pour rien.
  rendu.setPixelRatio(Math.min(dpr, petit ? 1.5 : 2));
  rendu.shadowMap.enabled = ombres;
  rendu.shadowMap.type = THREE.PCFShadowMap;
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 1.28;
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
  scene.environmentIntensity = 0.85;
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

  // L'ombre ne couvre que 60 m : sans ça, une carte d'ombre de 1024 px étalée
  // sur toute la scène ne montre plus rien.
  function majOmbres(x, z) {
    // Le dôme de ciel suit la voiture, sinon en s'éloignant on finit par
    // s'approcher de sa paroi et l'horizon se met à pencher.
    dome.position.set(x, 0, z);
    if (!ombres) return;
    soleil.position.set(x - 26, 20, z + 18);
    soleil.target.position.set(x, 0, z);
    soleil.target.updateMatrixWorld();
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
    ombres,
    petit,
    taille,
    majOmbres,
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
