// La chaîne d'effets. C'est la couche qui sépare « une scène 3D » d'une IMAGE
// de film : halo des lumières, profondeur de champ, étalonnage, vignettage,
// grain argentique, aberration chromatique, déformation anamorphique.
//
// Trois principes tenus ici :
//
// 1. ⚠️ Tout est BORNÉ par la machine. Un téléphone d'entrée de gamme n'a pas
//    le budget d'un halo en plusieurs passes ; la chaîne se dégrade toute
//    seule en cours de partie si les images tombent sous 45/s, et se retire
//    complètement si ça ne suffit pas. Un jeu à 20 images/s est laid, quelle
//    que soit la beauté de son étalonnage.
// 2. Un seul passage final fait TOUT le reste. Cinq passes coûtent cinq
//    lectures de l'écran entier ; un shader qui fait les cinq effets d'un
//    coup n'en coûte qu'une.
// 3. La profondeur de champ est RADIALE, pas géométrique. Une vraie DOF
//    demande la carte de profondeur et deux passes de plus. Le flou qui monte
//    vers les bords donne exactement la même sensation d'objectif ouvert, pour
//    quatre lectures de texture.

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// Le passage final. Un seul shader, tous les effets d'objectif.
const OBJECTIF = {
  uniforms: {
    tDiffuse: { value: null },
    uTemps: { value: 0 },
    uGrain: { value: 0.045 },
    uVignette: { value: 0.62 },
    uAberration: { value: 0.0022 },
    uFlou: { value: 1.0 }, // 0 = net partout, 1 = bords ouverts, >1 = rack focus
    uPixel: { value: [1 / 1080, 1 / 1920] },
    uFroid: { value: 0.16 }, // les ombres tirent vers le bleu-violet
    uChaud: { value: 0.1 }, // les hautes lumières vers l'ambre
    uSaturation: { value: 1.14 },
    uSecousse: { value: 0 }, // l'impact : l'image se déchire une fraction de s
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTemps, uGrain, uVignette, uAberration, uFlou;
    uniform float uFroid, uChaud, uSaturation, uSecousse;
    uniform vec2 uPixel;
    varying vec2 vUv;

    // Un bruit sans texture : deux sinus mal accordés suffisent à faire un
    // grain qui ne se répète pas à l'œil.
    float bruit(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTemps * 43.1) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);

      // Déformation anamorphique : l'image s'étire très légèrement sur les
      // bords, comme un objectif large. Trop peu pour se voir, assez pour
      // qu'une image plate cesse de l'être.
      uv += c * r2 * 0.035;

      // Aberration chromatique : le rouge et le bleu se décalent vers les
      // bords. C'est LE détail qui dit « objectif » plutôt que « rendu ».
      float ab = uAberration * r2 * 14.0;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ab).b;

      // Profondeur de champ radiale : quatre lectures en anneau, mélangées
      // seulement là où c'est loin du centre de l'image.
      float ouverture = clamp((r2 - 0.045) * 3.4, 0.0, 1.0) * uFlou;
      if (ouverture > 0.004) {
        vec2 d = uPixel * (2.2 + ouverture * 7.0);
        vec3 flou = texture2D(tDiffuse, uv + vec2(d.x, 0.0)).rgb
                  + texture2D(tDiffuse, uv - vec2(d.x, 0.0)).rgb
                  + texture2D(tDiffuse, uv + vec2(0.0, d.y)).rgb
                  + texture2D(tDiffuse, uv - vec2(0.0, d.y)).rgb;
        col = mix(col, flou * 0.25, min(ouverture, 0.85));
      }

      // L'étalonnage. Les ombres partent vers le violet froid, les hautes
      // lumières vers l'ambre du couchant : c'est la palette PermiGo, et
      // c'est ce qui donne à l'image sa couleur de film plutôt que de rendu.
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col += uFroid * (1.0 - lum) * vec3(-0.06, -0.02, 0.16);
      col += uChaud * lum * vec3(0.16, 0.06, -0.05);
      col = mix(vec3(lum), col, uSaturation);

      // Le vignettage referme le cadre sur la route.
      col *= 1.0 - uVignette * r2 * 1.35;

      // Le grain, très fin, et plus présent dans les zones sombres — comme
      // une pellicule, où le bruit vit dans les noirs.
      float g = bruit(uv * 900.0) - 0.5;
      col += g * uGrain * (1.25 - lum);

      // L'impact : l'image se déchire une fraction de seconde.
      if (uSecousse > 0.001) {
        float bande = step(0.5, bruit(vec2(0.0, floor(uv.y * 40.0))));
        col = mix(col, col.gbr, bande * uSecousse * 0.6);
      }

      gl_FragColor = vec4(col, 1.0);
    }`,
};

// Les trois crans de qualité. On DESCEND en cours de partie, jamais on ne
// remonte : une machine qui rame ne se remet pas à respirer, et remonter
// ferait clignoter l'image entre deux réglages.
const CRANS = ["cinema", "propre", "brut"];

export function creerPost(THREE, monde, { qualite = "auto" } = {}) {
  const { rendu, scene, camera } = monde;

  // Le point de départ : un téléphone commence en « propre » (pas de halo
  // multi-passes), une machine de bureau en « cinéma ».
  let cran =
    qualite === "auto" ? (monde.petit ? 1 : 0) : CRANS.indexOf(qualite);
  if (cran < 0) cran = 0;

  const composer = new EffectComposer(rendu);
  composer.addPass(new RenderPass(scene, camera));

  // Le halo. ⚠️ Seuil HAUT et force basse. Un halo généreux ne fait pas
  // « cinéma », il fait « buée sur l'objectif » : toute l'image se voile et le
  // contraste meurt. Ici seuls les phares, les feux et les vitres qui
  // accrochent la dernière lueur passent le seuil.
  const halo = new UnrealBloomPass(
    new THREE.Vector2(256, 256),
    0.42, // force
    0.5, // rayon
    0.93, // seuil
  );
  composer.addPass(halo);

  // ⚠️ OutputPass, et pas le rendu direct : c'est lui qui applique la courbe
  // ACES et repasse en sRGB en bout de chaîne. Sans lui, une chaîne d'effets
  // rend une image délavée et personne ne comprend pourquoi.
  composer.addPass(new OutputPass());

  const objectif = new ShaderPass(OBJECTIF);
  objectif.renderToScreen = true;
  composer.addPass(objectif);

  const u = objectif.uniforms;

  monde.surRedimension((l, h) => {
    composer.setSize(l, h);
    const dpr = rendu.getPixelRatio();
    u.uPixel.value = [1 / (l * dpr), 1 / (h * dpr)];
  });

  // ── La sécurité : on mesure, et on dégrade ────────────────────────────
  // ⚠️ Les deux premières secondes ne comptent PAS. Elles contiennent la
  // compilation des shaders, la mise en cache des textures et la première
  // image d'ombres : mesurées, elles font croire à n'importe quelle machine
  // qu'elle est trop lente, et la chaîne se coupait avant d'avoir servi.
  const ECHAUFFEMENT = 2;
  let echauffe = 0;
  let fenetre = 0;
  let images = 0;
  let mauvaises = 0; // il en faut DEUX de suite : un ramasse-miettes ne compte pas
  let installe = true;

  function appliquerCran() {
    halo.enabled = cran === 0;
    // En « brut », on ne garde que le vignettage et le grain : les lectures
    // multiples du flou et de l'aberration sont ce qui coûte le plus cher.
    u.uFlou.value = cran === 2 ? 0 : reglages.flou;
    u.uAberration.value = cran === 2 ? 0 : reglages.aberration;
  }

  const reglages = { flou: 1, aberration: 0.0022 };
  appliquerCran();

  const dessiner = (dt) => {
    u.uTemps.value = (u.uTemps.value + dt) % 100;
    if (u.uSecousse.value > 0)
      u.uSecousse.value = Math.max(0, u.uSecousse.value - dt * 3.2);
    composer.render(dt);

    // La mesure, sur des fenêtres d'une seconde. Une seule image lente ne
    // veut rien dire (un chargement, un ramasse-miettes) ; une seconde entière
    // sous 45 images, si.
    if (echauffe < ECHAUFFEMENT) {
      echauffe += dt;
      return;
    }
    fenetre += dt;
    images++;
    if (fenetre < 1) return;
    const fps = images / fenetre;
    fenetre = 0;
    images = 0;
    // 🔴 Le seuil ne peut PAS être 45. Beaucoup d'écrans sont bloqués à 30 Hz
    // (économie de batterie, écran externe, onglet en arrière-plan) : à 45, la
    // chaîne se dégradait sur des machines qui tournaient parfaitement, sans
    // que rien ne le signale. 30 images/s stables est un rendu acceptable ;
    // ce qu'on chasse, c'est ce qui tombe SOUS le pas d'un écran 30 Hz.
    if (fps >= 26) {
      mauvaises = 0;
      return;
    }
    if (++mauvaises < 2) return;
    mauvaises = 0;
    if (cran < CRANS.length - 1) {
      cran++;
      appliquerCran();
    } else if (fps < 20) {
      // Même dépouillée, la chaîne coûte trop cher : on la retire. Le jeu
      // reste jouable, c'est la seule chose qui n'est pas négociable.
      installe = false;
      monde.brancherRendu(null);
    }
  };
  monde.brancherRendu(dessiner);

  return {
    get cran() {
      return CRANS[cran];
    },
    get installe() {
      return installe;
    },
    uniforms: u,
    composer, // pour le banc d'essai : mesurer le coût d'une image au cran voulu

    // Le rack focus : la caméra « fait le point ». 0 = tout net (on regarde
    // au loin), 2,5 = tout se ferme sauf le centre (on regarde tout près).
    point(valeur) {
      reglages.flou = valeur;
      if (cran !== 2) u.uFlou.value = valeur;
    },

    // Le choc. L'image se déchire, puis se recolle en un tiers de seconde.
    secouer(force = 1) {
      u.uSecousse.value = Math.min(1, force);
    },

    // Forcer un cran (banc d'essai, et bascule du mode debug).
    forcer(nom) {
      const i = CRANS.indexOf(nom);
      if (i < 0) return CRANS[cran];
      cran = i;
      echauffe = 0; // on laisse à la machine le temps de se refaire un avis
      mauvaises = 0;
      appliquerCran();
      return CRANS[cran];
    },

    detruire() {
      composer.dispose?.();
    },
  };
}
