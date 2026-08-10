// LE LINT ANTI-GRISAILLE.
//
// 📖 `docs/PERMIGO_GAME_ART_BIBLE.md` §13, vérification 1.
//
// Pourquoi ce script existe : le 10/08, Rayan a regardé le jeu et a dit « les
// designs sont éclatés ». La cause n'était pas une faute de goût isolée, c'est
// que RIEN ne surveillait la dérive. Une scène devient beige-gris-bleu par
// petites touches, personne ne le voit venir, et un jour l'image est morte.
//
// Un agent qui « trouve ça joli » n'est pas un critère. Ces quatre nombres, si.
//
// Usage :  node outils/da/verif-teinte.mjs [url]
// Le serveur de développement doit tourner (npm run dev).

import { chromium } from "playwright";

const URL = process.argv[2] || "http://localhost:5173/#/avance";

// Les seuils de la bible §13. Ils se règlent ICI, jamais dans le corps.
const SEUILS = {
  grisMax: 0.2, // part de pixels quasi gris (saturation < 8 %)
  chaudMin: 0.3, // part de teintes chaudes (20° à 75°)
  // ⚠️ DESCENDU DE 0,18 À 0,13 LE 10/08, ET C'EST UNE DÉCISION ASSUMÉE.
  //
  // 0,18 avait été calibré quand les FAÇADES portaient la couleur : six
  // teintes franches sur toute la hauteur de la rue. Rayan a tranché contre
  // (« ça fait blocs et généré ») et la palette est passée à quatre pierres
  // + deux accents, le pigment descendant aux volets, stores et enseignes,
  // qui sont petits. La saturation MOYENNE de l'image baisse mécaniquement,
  // sans qu'il y ait la moindre dérive.
  //
  // 🔴 Le garde-fou qui compte reste `grisMax` : c'est LUI qui attrape la
  // dérive gris-beige, et il tient large (0,15 mesuré pour 0,20 permis). Et
  // `accentMin` garantit qu'il y a toujours un amas saturé dans le cadre.
  // Ne remonter ce seuil que si la couleur revient sur les grandes surfaces.
  saturationMin: 0.13, // saturation moyenne
  accentMin: 0.015, // il faut au moins UN amas saturé dans le cadre
};

// On n'échantillonne QUE le monde : le ciel du haut et le poste de conduite du
// bas ne sont pas jugés (l'un est un dégradé imposé, l'autre est de l'UI).
const ZONE = { haut: 0.16, bas: 0.55 };

// ⚠️ 6 s et pas 3 : à trois secondes le voile sombre des deux phrases
// d'ouverture couvre encore l'image et fait chuter la saturation de deux
// centièmes. On juge le MONDE, pas un calque d'interface qui va disparaître.
const INSTANTS = [6, 15, 26];

function hsl(r, v, b) {
  r /= 255;
  v /= 255;
  b /= 255;
  const mx = Math.max(r, v, b);
  const mn = Math.min(r, v, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = ((v - b) / d + (v < b ? 6 : 0)) / 6;
  else if (mx === v) h = ((b - r) / d + 2) / 6;
  else h = ((r - v) / d + 4) / 6;
  return [h * 360, s, l];
}

const navigateur = await chromium.launch({ headless: false });
const ctx = await navigateur.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "load" });
await page.waitForSelector(".av-go", { timeout: 20000 });
await page.click(".av-go");
await page.waitForSelector(".av-vue canvas", { timeout: 30000 });

const rapports = [];
for (const t of INSTANTS) {
  await page.waitForFunction(
    (c) => Number(document.querySelector(".av")?.dataset.t ?? -1) >= c,
    t,
    { timeout: 120000 },
  );
  const png = (await page.screenshot()).toString("base64");
  // ⚠️ L'analyse se fait DANS LE NAVIGATEUR, pas dans Node : décoder un PNG
  // côté Node demanderait une dépendance, et la règle du projet est zéro
  // dépendance nouvelle pour la direction artistique. Le navigateur a déjà
  // un décodeur et un canvas.
  const r = await page.evaluate(
    async ({ b64, zone }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const y0 = Math.round(img.height * zone.haut);
      const y1 = Math.round(img.height * zone.bas);
      const d = g.getImageData(0, y0, img.width, y1 - y0).data;
      const hsl = (r, v, b) => {
        r /= 255; v /= 255; b /= 255;
        const mx = Math.max(r, v, b), mn = Math.min(r, v, b);
        const l = (mx + mn) / 2, dd = mx - mn;
        if (!dd) return [0, 0, l];
        const s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
        let h;
        if (mx === r) h = ((v - b) / dd + (v < b ? 6 : 0)) / 6;
        else if (mx === v) h = ((b - r) / dd + 2) / 6;
        else h = ((r - v) / dd + 4) / 6;
        return [h * 360, s, l];
      };
      let n = 0, gris = 0, chaud = 0, accent = 0, sommeS = 0;
      for (let i = 0; i < d.length; i += 16) {
        const [h, s] = hsl(d[i], d[i + 1], d[i + 2]);
        n++; sommeS += s;
        if (s < 0.08) gris++;
        if (h >= 20 && h <= 75) chaud++;
        if (s > 0.42) accent++;
      }
      return { gris: gris / n, chaud: chaud / n, saturation: sommeS / n, accent: accent / n };
    },
    { b64: png, zone: ZONE },
  );
  rapports.push({ t, ...r });
}
await navigateur.close();

let ok = true;
console.log("\nLINT DE TEINTE — bible §13\n");
for (const r of rapports) {
  const l = [
    ["gris", r.gris, r.gris <= SEUILS.grisMax, `≤ ${SEUILS.grisMax}`],
    ["chaud", r.chaud, r.chaud >= SEUILS.chaudMin, `≥ ${SEUILS.chaudMin}`],
    [
      "saturation",
      r.saturation,
      r.saturation >= SEUILS.saturationMin,
      `≥ ${SEUILS.saturationMin}`,
    ],
    ["accent", r.accent, r.accent >= SEUILS.accentMin, `≥ ${SEUILS.accentMin}`],
  ];
  console.log(`  t = ${r.t} s`);
  for (const [nom, val, passe, attendu] of l) {
    if (!passe) ok = false;
    console.log(
      `    ${passe ? "✅" : "❌"} ${nom.padEnd(11)} ${val.toFixed(3)}  (${attendu})`,
    );
  }
}
console.log(ok ? "\n✅ la rue tient sa palette\n" : "\n❌ la rue dérive\n");
process.exit(ok ? 0 : 1);
