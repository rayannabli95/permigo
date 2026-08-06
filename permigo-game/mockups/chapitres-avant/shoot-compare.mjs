// Planche de comparaison : les captures 390px cote a cote, sur un ecran large.
import pw from '/Users/macbookm3/Desktop/permigo-v7/permigo-game/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE;
const OUT = process.env.OUT;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1720, height: 1200 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('requestfailed', (r) => errs.push(`REQ FAIL ${r.url()}`));
await page.goto(`${BASE}/compare.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/planche-comparaison.png`, fullPage: true });
console.log(errs.length ? `ERRORS ${JSON.stringify(errs)}` : 'planche OK, aucune erreur');
await browser.close();
