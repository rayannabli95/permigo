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
    // ⚠️ 0,0022 se VOYAIT : franges vertes et violettes sur les arêtes des
    // façades. Une aberration qu'on remarque n'est plus un objectif, c'est un
    // défaut. Elle doit se sentir sans se voir.
    uAberration: { value: 0.0011 },
    uFlou: { value: 1.0 }, // 0 = net partout, 1 = bords ouverts, >1 = rack focus
    uPixel: { value: [1 / 1080, 1 / 1920] },
    uFroid: { value: 0.16 }, // les ombres tirent vers le bleu-violet
    uChaud: { value: 0.1 }, // les hautes lumières vers l'ambre
    uSaturation: { value: 1.14 },
    uSecousse: { value: 0 }, // l'impact : l'image se déchire une fraction de s
    // ⭐ LE MOMENT DE DÉCOUVERTE. Tout l'écran perd sa couleur et son
    // contraste SAUF un disque autour de ce qu'on vient de trouver. C'est ça
    // qui transforme « j'ai tapé un truc » en « JE L'AI VU ».
    uFocus: { value: 0 }, // 0 = rien, 1 = le reste du monde s'efface
    uCible: { value: [0.5, 0.5] }, // position à l'écran, en 0..1
    uRayonFocus: { value: 0.1 },
    uAspect: { value: 0.46 }, // largeur / hauteur, pour un disque rond
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
    uniform float uFocus, uRayonFocus, uAspect;
    uniform vec2 uCible;
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

      // ⭐ La focalisation. Le monde entier tombe en gris sombre, sauf un
      // disque autour de ce qu'on vient de trouver, qui garde sa couleur et
      // gagne même un peu d'éclat. Aucun texte, aucune icône : c'est l'image
      // elle-même qui dit « c'est ÇA ».
      if (uFocus > 0.001) {
        float d = length((uv - uCible) * vec2(uAspect, 1.0));
        float dehors = smoothstep(uRayonFocus, uRayonFocus * 2.4, d);
        float k = uFocus * dehors;
        float gris = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col, vec3(gris) * 0.42, k);
        // Et l'intérieur du disque respire : +12 % de lumière au centre.
        col *= 1.0 + uFocus * (1.0 - dehors) * 0.12;
      }

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
//
// ⚠️ Ce module ne DÉCIDE plus de rien : c'est `qualite.js` qui tient l'échelle
// et appelle `regler()`. Deux régulateurs qui se surveillaient finissaient par
// se battre, et personne ne savait plus quel réglage était actif.

export function creerPost(THREE, monde) {
  const { rendu, scene, camera } = monde;

  // 🔴 L'ANTICRÉNELAGE VIT ICI, et nulle part ailleurs. Dès qu'on dessine dans
  // une cible intermédiaire, l'option `antialias` du rendu ne sert plus à
  // rien : c'est cette cible qui doit être multi-échantillonnée. C'est la
  // raison pour laquelle l'image avait des bords en escalier alors que le
  // rendu était censé être anticrénelé.
  const cible = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(rendu, cible);
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
    u.uAspect.value = l / h;
  });

  // Ce que le gouverneur peut couper, et ce que la caméra pilote.
  const reglages = { flou: 1, aberration: u.uAberration.value, objectif: 1 };

  const dessiner = (dt) => {
    u.uTemps.value = (u.uTemps.value + dt) % 100;
    if (u.uSecousse.value > 0)
      u.uSecousse.value = Math.max(0, u.uSecousse.value - dt * 3.2);
    composer.render(dt);
  };
  monde.brancherRendu(dessiner);

  return {
    uniforms: u,
    composer, // pour le banc d'essai : mesurer le coût d'une image au cran voulu

    // Appelé par le gouverneur de qualité à chaque changement de cran.
    // `objectif` : 1 = tous les effets, 0,5 = sans aberration, 0 = seulement
    // le vignettage et le grain (les lectures multiples du flou sont ce qui
    // coûte le plus cher).
    regler({ halo: avecHalo = true, msaa = 4, objectif: niveau = 1 }) {
      halo.enabled = avecHalo;
      reglages.objectif = niveau;
      if (cible.samples !== msaa) {
        cible.samples = msaa;
        cible.dispose(); // la cible se recrée au prochain rendu
      }
      appliquerObjectif();
    },

    // Le rack focus : la caméra « fait le point ». 0 = tout net (on regarde
    // au loin), 2,5 = tout se ferme sauf le centre (on regarde tout près).
    point(valeur) {
      reglages.flou = valeur;
      appliquerObjectif();
    },

    // Le moment de découverte. `cible` est en coordonnées d'écran 0..1.
    focaliser(force, cible, rayon = 0.1) {
      u.uFocus.value = force;
      if (cible) u.uCible.value = cible;
      u.uRayonFocus.value = rayon;
    },

    // Le choc. L'image se déchire, puis se recolle en un tiers de seconde.
    secouer(force = 1) {
      u.uSecousse.value = Math.min(1, force);
    },

    detruire() {
      composer.dispose?.();
      cible.dispose();
    },
  };

  function appliquerObjectif() {
    const n = reglages.objectif;
    u.uFlou.value = n > 0 ? reglages.flou : 0;
    u.uAberration.value = n >= 1 ? reglages.aberration : 0;
  }
}
