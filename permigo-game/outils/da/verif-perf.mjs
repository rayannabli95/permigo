// LE LINT DE PERFORMANCE.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §12 et §13, vérification 3.
//
// La direction artistique n'a le droit d'exister que si elle tourne. Ces
// budgets viennent d'une cible iPhone 12 / Android milieu de gamme :
//   ≤ 140 appels de dessin · ≤ 180 000 triangles · ≤ 6 ms de moteur par image
//   · ZÉRO requête réseau (le monde est entièrement procédural).
//
// ⚠️ Le temps par image ne se mesure PAS en comptant les images par seconde
// dans un navigateur piloté : il tourne au ralenti. On mesure le temps que
// prend la boucle, pas la cadence d'affichage.
//
// Usage :  node outils/da/verif-perf.mjs [url]

import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:5173/#/avance";

const BUDGETS = {
  dessins: 140,
  triangles: 180000,
  textures: 24,
  reseau: 0, // requêtes vers /art/ ou tout autre asset 3D
};

const navigateur = await chromium.launch({ headless: false });
const ctx = await navigateur.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await ctx.newPage();

const assets = [];
page.on("request", (r) => {
  const u = r.url();
  // ⚠️ On ne compte QUE les assets 3D. Le splash et l'icône de la PWA
  // appartiennent à la coque de l'app, pas à la direction artistique.
  if (/\/art\/|\.(glb|gltf|bin|ktx2)(\?|$)/i.test(u)) assets.push(u);
});

await page.goto(URL, { waitUntil: "load" });
await page.waitForSelector(".av-go", { timeout: 20000 });
await page.click(".av-go");
await page.waitForSelector(".av-vue canvas", { timeout: 30000 });
// ⚠️ TROIS INSTANTS, et on garde le PIRE. Une seule mesure dépend de ce qui
// se trouve dans le cadre à cet instant précis : entre deux essais, le même
// code donnait 1223 puis 1541 appels. Un budget se juge sur son maximum.
const INSTANTS = [6, 15, 24];
const attendre = (t) =>
  page.waitForFunction(
    (c) => Number(document.querySelector(".av")?.dataset.t ?? -1) >= c,
    t,
    { timeout: 120000 },
  );

// ⚠️ Three.js n'est pas exposé globalement (import dynamique). On lit donc
// les compteurs par la seule voie disponible : le contexte WebGL, qu'on
// instrumente en comptant les appels de dessin sur une image.
const uneMesure = () => page.evaluate(async () => {
  const toile = document.querySelector(".av-vue canvas");
  const gl =
    toile.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
    toile.getContext("webgl");
  let dessins = 0;
  let sommets = 0;
  const elements = gl.drawElements.bind(gl);
  const tableaux = gl.drawArrays.bind(gl);
  gl.drawElements = (m, c, t, o) => {
    dessins++;
    sommets += c;
    return elements(m, c, t, o);
  };
  gl.drawArrays = (m, f, c) => {
    dessins++;
    sommets += c;
    return tableaux(m, f, c);
  };
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const parImage = { dessins, sommets };
  gl.drawElements = elements;
  gl.drawArrays = tableaux;

  // Le temps de la boucle : on chronomètre trente images consécutives.
  const t = [];
  for (let i = 0; i < 30; i++)
    t.push(
      await new Promise((r) => {
        const d = performance.now();
        requestAnimationFrame(() => r(performance.now() - d));
      }),
    );
  t.sort((a, b) => a - b);
  return { ...parImage, median: t[15] };
});

const mesures = [];
for (const t of INSTANTS) {
  await attendre(t);
  mesures.push(await uneMesure());
}
const mesure = mesures.reduce((a, b) => (b.dessins > a.dessins ? b : a));
await navigateur.close();

// Deux images sont dessinées entre les deux `requestAnimationFrame` : une
// pour la scène, une pour la chaîne d'effets. On rapporte par image.
const dessins = Math.round(mesure.dessins / 2);
const triangles = Math.round(mesure.sommets / 2 / 3);

const l = [
  ["appels de dessin", dessins, dessins <= BUDGETS.dessins, `≤ ${BUDGETS.dessins}`],
  [
    "triangles",
    triangles,
    triangles <= BUDGETS.triangles,
    `≤ ${BUDGETS.triangles}`,
  ],
  ["assets réseau", assets.length, assets.length <= BUDGETS.reseau, "= 0"],
];

console.log("\nLINT DE PERFORMANCE — bible §12\n");
let ok = true;
for (const [nom, val, passe, attendu] of l) {
  if (!passe) ok = false;
  console.log(
    `  ${passe ? "✅" : "❌"} ${nom.padEnd(18)} ${String(val).padStart(7)}  (${attendu})`,
  );
}
console.log(
  `  ℹ️  image médiane      ${mesure.median.toFixed(1)} ms  (indicatif : un navigateur piloté n'est pas une cible)`,
);
if (assets.length) console.log("\n  assets chargés :", assets.slice(0, 6));
console.log(ok ? "\n✅ dans les budgets\n" : "\n❌ hors budget\n");
process.exit(ok ? 0 : 1);
