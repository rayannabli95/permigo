// Photographie les maquettes du profil élève refondu.
// Sert `permigo-game/` en statique (pour que les maquettes lisent les VRAIS
// assets : /cartes/*.webp, /skins/**, /fonts/*.woff2) puis capture en 390x844
// deviceScaleFactor 2, fullPage, dans `shots/`.
//
// Lancer depuis ce dossier :  node shoot.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pw from '/Users/macbookm3/Desktop/permigo-v7/permigo-game/node_modules/playwright/index.js';

const { chromium } = pw;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..'); // permigo-game/
const PORT = 8873;
const BASE = `http://127.0.0.1:${PORT}`;
const REL = 'mockups/profil-refonte';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // Les maquettes pointent les VRAIS assets en chemin absolu (/cartes, /skins,
  // /fonts) : ils vivent dans `public/`, pas à la racine du projet. On sert donc
  // la racine puis `public/` en repli.
  let file = null;
  for (const base of [ROOT, path.join(ROOT, 'public')]) {
    const p = path.join(base, url);
    if (!p.startsWith(base)) continue;
    try {
      const st = fs.statSync(p);
      file = st.isDirectory() ? path.join(p, 'index.html') : p;
      if (st.isDirectory() && !fs.existsSync(file)) { file = null; continue; }
      break;
    } catch {
      /* essaie la base suivante */
    }
  }
  if (!file) return res.writeHead(404).end('not found');
  try {
    const buf = fs.readFileSync(file);
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const SHOTS = [
  ['profil-A-collection', 'profil-A-collection.html'],
  ['profil-B-paquet', 'profil-B-paquet.html'],
  ['profil-B-carte-ouverte', 'profil-B-paquet.html?open=1'],
  ['profil-C-vitrine', 'profil-C-vitrine.html'],
];

fs.mkdirSync(path.join(HERE, 'shots'), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errs = [];
const missing = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('response', (r) => {
  if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
});

let widthKo = 0;
for (const [slug, file] of SHOTS) {
  await page.goto(`${BASE}/${REL}/${file}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  if (w > 390) widthKo++;
  // L'état « carte ouverte » est une surcouche fixe : on la photographie
  // comme un écran de téléphone, pas en page entière.
  await page.screenshot({
    path: path.join(HERE, 'shots', `${slug}.png`),
    fullPage: !slug.includes('carte-ouverte'),
  });
  console.log('shot', slug, '· scrollWidth', w, w > 390 ? '❌ DÉBORDE' : 'ok');
}

// Planche de comparaison des 3 variantes côte à côte
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/${REL}/index.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({
  path: path.join(HERE, 'shots', 'planche-comparaison.png'),
  fullPage: true,
});
console.log('shot planche-comparaison');

console.log(errs.length ? `ERREURS JS: ${JSON.stringify(errs)}` : 'aucune erreur JS');
console.log(missing.length ? `RESSOURCES KO: ${JSON.stringify(missing)}` : 'aucune ressource manquante');
console.log(widthKo ? `${widthKo} page(s) débordent 390px` : 'aucun débordement horizontal');

await browser.close();
server.close();
console.log('done');
