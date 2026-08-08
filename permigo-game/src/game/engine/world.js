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

  // ⚠️ 0,75 + 0,85, pas 1,15 + 1,35. Une surface tournée vers le ciel reçoit
  // les DEUX lumières : au-delà de 1 au total, tout ce qui est à plat part en
  // blanc. C'est ce qui transformait le capot en aplat fluo.
  const ambiante = new THREE.HemisphereLight(0x9c8cff, 0x241a44, 0.75);
  scene.add(ambiante);

  const soleil = new THREE.DirectionalLight(0xffd9b0, 0.85);
  soleil.position.set(-26, 34, 18);
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
  rendu.toneMappingExposure = 1.05;
  rendu.domElement.style.cssText = "display:block;width:100%;height:100%";
  hote.appendChild(rendu.domElement);

  // 55° de champ vertical. Plus large, c'est un grand-angle : une voiture à
  // 60 m tombe à quelques pixels, on ne la voit littéralement pas arriver.
  const camera = new THREE.PerspectiveCamera(55, 1, 0.25, 220);
  scene.add(camera);

  function taille() {
    const r = hote.getBoundingClientRect();
    const l = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
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
    soleil.position.set(x - 26, 34, z + 18);
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
      rendu.render(scene, camera);
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
    taille,
    majOmbres,
    demarrer,
    detruire,
    get mesures() {
      return mesures;
    },
  };
}
