import pw from "/Users/macbookm3/Desktop/permigo-v7/permigo-game/node_modules/playwright/index.js";
const { chromium } = pw;

const BASE = "http://127.0.0.1:8825/mockups/roue-refonte";
const PAGES = ["A-roue-epuree", "B-coffre-du-jour", "C-trois-cartes"];

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await c.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("requestfailed", (r) => errs.push(`404? ${r.url()}`));

for (const s of PAGES) {
  await p.goto(`${BASE}/${s}.html`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await p.waitForTimeout(900);
  const info = await p.evaluate(() => ({
    scrollH: document.body.scrollHeight,
    archivo: document.fonts.check("800 20px Archivo"),
  }));
  await p.screenshot({ path: `shots/${s}.png` });
  console.log(s, "hauteur", info.scrollH, "Archivo", info.archivo);
}
if (errs.length) console.log("ERR", JSON.stringify(errs.slice(0, 6), null, 1));
await b.close();
console.log("done");
