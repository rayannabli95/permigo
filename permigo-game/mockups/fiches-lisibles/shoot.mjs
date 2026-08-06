import pw from '/Users/macbookm3/Desktop/permigo-v7/permigo-game/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE || 'http://127.0.0.1:8861';
const OUT = '/Users/macbookm3/Desktop/permigo-v7/permigo-game/mockups/fiches-lisibles/shots';
const PAGES = ['_avant', 'fiche-A-consigne-detail', 'fiche-B-feuille-surlignee', 'fiche-C-trois-temps'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(`${page.url()} :: ${e.message}`));
page.on('requestfailed', (r) => errs.push(`REQ FAIL ${r.url()} :: ${r.failure()?.errorText}`));

let bad = 0;
for (const slug of PAGES) {
  await page.goto(`${BASE}/${slug}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });
  const ok = w <= 390;
  if (!ok) bad++;
  console.log(`shot ${slug}  scrollW=${w} ${ok ? 'OK' : '*** DEBORDE ***'}  height=${h}`);
}
console.log(errs.length ? `ERRORS ${JSON.stringify(errs, null, 1)}` : 'aucune erreur de page');
console.log(bad ? `${bad} page(s) debordent a 390px` : 'aucun debordement horizontal');
await browser.close();
