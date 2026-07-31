// ═══════════════════════════════════════════════════════════════
// build-seo.mjs — Générateur de pages statiques SEO (post `vite build`)
//
// Pourquoi : l'app est un SPA hash-router rendu en `innerHTML` → une seule
// URL indexable. Ce script écrit dans `dist/` de VRAIES pages HTML complètes
// (title/meta/canonical/JSON-LD + contenu visible sans JS) sur des URLs
// path-based, sans toucher au SPA. Voir docs/SEO_STRATEGY.md.
//
// Sortie :
//   dist/centres-examen/index.html              (hub)
//   dist/centres-examen/{slug}/index.html        (×6 centres)
//   dist/guides/index.html                       (hub)
//   dist/guides/{slug}/index.html                (×N guides)
//   dist/pour-moniteurs/index.html               (pilier moniteur)
//   dist/sitemap.xml                             (régénéré)
//
// Exécution : `node scripts/build-seo.mjs` (branché dans package.json `build`).
// ═══════════════════════════════════════════════════════════════

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CENTRES_EXAMEN } from "../src/data/centres-examen.js";
import { GUIDES, MONITEUR_PILLAR } from "../src/data/seo-pages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE = "https://www.permigo.fr";

// ─── Échappement HTML ─────────────────────────────────────────
function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escAttr(s = "") {
  return esc(s).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// ─── CSS commun (inline, mobile-first, charte PermiGo) ────────
const CSS = `
:root{--bg:#0a0d1a;--surface:#121627;--surface-2:#1a1f36;--line:#252b45;
--ink:#eef1ff;--muted:#9aa3c7;--indigo:#6366f1;--violet:#8b5cf6;--cyan:#06b6d4;--radius:18px}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--ink);
font-family:'Archivo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
line-height:1.65;-webkit-font-smoothing:antialiased;
background-image:radial-gradient(900px 500px at 80% -10%,rgba(99,102,241,.18),transparent 60%),radial-gradient(700px 400px at -10% 10%,rgba(139,92,246,.12),transparent 55%)}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
h1,h2,h3{font-family:'Archivo',system-ui,sans-serif;line-height:1.15;letter-spacing:-.025em}
h1{font-size:clamp(1.7rem,6vw,2.5rem);font-weight:900;letter-spacing:-.035em;margin:.2em 0 .4em}
h2{font-size:clamp(1.3rem,4.5vw,1.7rem);font-weight:700;margin:1.8em 0 .5em}
h3{font-size:1.12rem;font-weight:700;margin:1.3em 0 .35em;color:#fff}
p{color:#d7dcf5;margin:.7em 0}
a{color:#a9b0ff;text-decoration:none}a:hover{text-decoration:underline}
header.top{position:sticky;top:0;z-index:5;backdrop-filter:blur(12px);
background:rgba(10,13,26,.7);border-bottom:1px solid var(--line)}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;height:58px}
.brand{display:flex;align-items:center;gap:9px;font-family:'Archivo',sans-serif;font-weight:900;color:#fff;font-size:1.05rem;letter-spacing:-.02em}
/* le globe est détouré : pas de border-radius (icon-192 a un fond noir opaque) */
.brand img{width:30px;height:30px}
.btn{display:inline-block;background:linear-gradient(135deg,var(--indigo),var(--violet));
color:#fff;font-weight:700;padding:11px 18px;border-radius:12px;font-size:.92rem;
box-shadow:0 8px 24px rgba(99,102,241,.35)}
.btn:hover{text-decoration:none;filter:brightness(1.06)}
.btn-ghost{background:var(--surface-2);box-shadow:none;border:1px solid var(--line);color:#cfd5ff}
.crumb{font-size:.82rem;color:var(--muted);margin:18px 0 4px}
.crumb a{color:var(--muted)}
.lead{font-size:1.12rem;color:#c3c9ee;margin:.4em 0 1.2em}
.lead.big{font-size:1.2rem}
ul.list{margin:.6em 0;padding:0;list-style:none}
ul.list li{position:relative;padding:6px 0 6px 24px;color:#d7dcf5}
ul.list li::before{content:"";position:absolute;left:2px;top:14px;width:8px;height:8px;
border-radius:50%;background:linear-gradient(135deg,var(--indigo),var(--cyan))}
.callout{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--indigo);
border-radius:14px;padding:14px 16px;margin:1.1em 0;color:#e6e9ff}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:18px;margin:14px 0}
.grid{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:560px){.grid.two{grid-template-columns:1fr 1fr}}
.tile{display:block;background:var(--surface);border:1px solid var(--line);border-radius:16px;
padding:16px;transition:border-color .2s,transform .2s}
.tile:hover{border-color:var(--indigo);text-decoration:none;transform:translateY(-2px)}
.tile h3{margin:.1em 0 .25em}
.tile .meta{font-size:.82rem;color:var(--muted)}
.dots{display:inline-flex;gap:3px;vertical-align:middle}
.dot{width:9px;height:9px;border-radius:50%;background:#2c3358}
.dot.on{background:linear-gradient(135deg,var(--indigo),var(--violet))}
.cta{background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(139,92,246,.14));
border:1px solid rgba(99,102,241,.4);border-radius:var(--radius);padding:22px;margin:30px 0;text-align:center}
.cta h3{margin-top:0}.cta p{color:#cfd5ff}
.faq dt{font-weight:800;color:#fff;margin:16px 0 4px;font-family:'Archivo',sans-serif}
.faq dd{margin:0;color:#d0d6f3}
footer.foot{border-top:1px solid var(--line);margin-top:40px;padding:26px 0 60px;color:var(--muted);font-size:.86rem}
footer.foot .links{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:14px}
footer.foot a{color:#aab1d8}
.pill{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
color:#bcc3ff;background:rgba(99,102,241,.16);border:1px solid rgba(99,102,241,.3);
padding:3px 10px;border-radius:999px;margin-bottom:10px}
.section p:first-child{margin-top:.2em}
`;

// ─── Layout HTML ──────────────────────────────────────────────
function layout({ title, desc, path, jsonLd = [], body }) {
  const canonical = SITE + path;
  const ld = jsonLd
    .map(
      (o) =>
        `<script type="application/ld+json">${JSON.stringify(o)}</script>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>${esc(title)}</title>
<meta name="description" content="${escAttr(desc)}"/>
<link rel="canonical" href="${escAttr(canonical)}"/>
<meta name="theme-color" content="#6366f1"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="PermiGo"/>
<meta property="og:locale" content="fr_FR"/>
<meta property="og:title" content="${escAttr(title)}"/>
<meta property="og:description" content="${escAttr(desc)}"/>
<meta property="og:url" content="${escAttr(canonical)}"/>
<meta property="og:image" content="${SITE}/og-image-2026.jpg"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:image" content="${SITE}/og-image-2026.jpg"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" href="/favicon.ico"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400..900&display=swap" rel="stylesheet"/>
<style>${CSS}</style>
${ld}
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="/"><img src="/logo-permigo.png" alt="PermiGo" width="30" height="30"/>PermiGo</a>
<a class="btn btn-ghost" href="/#/signup">Ouvrir l'app</a>
</div></header>
<main class="wrap">
${body}
</main>
<footer class="foot"><div class="wrap">
<div class="links">
<a href="/">Accueil</a>
<a href="/centres-examen/">Centres d'examen</a>
<a href="/guides/">Guides</a>
<a href="/pour-moniteurs/">Pour les moniteurs</a>
</div>
PermiGo. Le compagnon qui te prépare avant chaque heure de conduite et t'accompagne entre deux leçons.
</div></footer>
</body>
</html>`;
}

// ─── Helpers de rendu ─────────────────────────────────────────
function renderBlocks(blocks = []) {
  return blocks
    .map((b) => {
      if (b.type === "p") return `<p>${esc(b.text)}</p>`;
      if (b.type === "h3") return `<h3>${esc(b.text)}</h3>`;
      if (b.type === "callout") return `<div class="callout">${esc(b.text)}</div>`;
      if (b.type === "ul")
        return `<ul class="list">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      return "";
    })
    .join("\n");
}
function renderSections(sections = []) {
  return sections
    .map(
      (s) =>
        `<section class="section"><h2>${esc(s.h2)}</h2>${renderBlocks(s.blocks)}</section>`,
    )
    .join("\n");
}
function renderFaq(faq = []) {
  if (!faq.length) return "";
  const items = faq
    .map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.r)}</dd>`)
    .join("\n");
  return `<section><h2>Questions fréquentes</h2><dl class="faq">${items}</dl></section>`;
}
function renderCta(cta) {
  if (!cta) return "";
  return `<div class="cta"><h3>${esc(cta.text)}</h3><p>${esc(cta.sub)}</p>
<a class="btn" href="${escAttr(cta.href)}">Commencer →</a></div>`;
}
function dots(n, max = 5) {
  let out = '<span class="dots">';
  for (let i = 1; i <= max; i++)
    out += `<span class="dot${i <= n ? " on" : ""}"></span>`;
  return out + "</span>";
}
function faqLd(faq = []) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.r },
    })),
  };
}
function breadcrumbLd(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: SITE + t.path,
    })),
  };
}
function crumbHtml(trail) {
  return (
    `<nav class="crumb">` +
    trail
      .map((t, i) =>
        i < trail.length - 1
          ? `<a href="${t.path}">${esc(t.name)}</a> › `
          : esc(t.name),
      )
      .join("") +
    `</nav>`
  );
}

async function write(relPath, html) {
  const full = resolve(DIST, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, html, "utf8");
  return "/" + relPath.replace(/index\.html$/, "");
}

// ─── Pages : centre d'examen ──────────────────────────────────
function centrePath(c) {
  return `/centres-examen/${c.slug}/`;
}
function buildCentre(c) {
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Centres d'examen", path: "/centres-examen/" },
    { name: c.nom, path: centrePath(c) },
  ];
  const related = CENTRES_EXAMEN.filter(
    (o) => o.deptNum === c.deptNum && o.slug !== c.slug,
  ).slice(0, 4);

  const acces = c.acces?.length
    ? `<section><h2>Accès au centre</h2><ul class="list">${c.acces
        .map((a) => `<li>${esc(a.texte)}</li>`)
        .join("")}</ul></section>`
    : "";
  const pieges = c.pieges?.length
    ? `<section><h2>Les pièges du secteur</h2>${c.pieges
        .map(
          (p) => `<h3>${esc(p.titre)}</h3><p>${esc(p.texte)}</p>`,
        )
        .join("")}</section>`
    : "";
  const conseils = c.conseils?.length
    ? `<section><h2>Nos conseils pour ce centre</h2><ul class="list">${c.conseils
        .map((x) => `<li>${esc(x)}</li>`)
        .join("")}</ul></section>`
    : "";
  const relatedHtml = related.length
    ? `<section><h2>Autres centres en ${esc(c.departement)}</h2><div class="grid two">${related
        .map(
          (o) =>
            `<a class="tile" href="${centrePath(o)}"><h3>${esc(o.nom)}</h3><div class="meta">Difficulté ${o.difficulte}/5 · ${esc(o.difficulteLabel)}</div></a>`,
        )
        .join("")}</div></section>`
    : "";

  const body = `
${crumbHtml(trail)}
<span class="pill">Centre d'examen · ${esc(c.departement)} (${esc(c.deptNum)})</span>
<h1>Centre d'examen du permis à ${esc(c.nom)}</h1>
<p class="lead">${esc(c.resume)}</p>
<div class="card"><strong>Adresse :</strong> ${esc(c.adresse)}<br/>
<strong>Difficulté observée :</strong> ${dots(c.difficulte)} ${esc(c.difficulteLabel)} (${c.difficulte}/5)</div>
${acces}
${pieges}
${conseils}
${renderCta({
    text: `Révise les pièges de ${c.nom} dans PermiGo`,
    sub: "Questions ciblées sur ce secteur, examens blancs et suivi de progression. Gratuit pour commencer.",
    href: "/#/signup",
  })}
${renderFaq(c.faq)}
${relatedHtml}
`;
  const jsonLd = [breadcrumbLd(trail)];
  const fl = faqLd(c.faq);
  if (fl) jsonLd.push(fl);
  return layout({
    title: `Centre d'examen du permis à ${c.nom} (${c.deptNum}). Pièges et conseils | PermiGo`,
    desc: `Centre d'examen du permis de ${c.nom} : accès, difficulté (${c.difficulteLabel.toLowerCase()}), pièges réels du secteur et conseils pour réussir. ${c.resume.slice(0, 90)}…`,
    path: centrePath(c),
    jsonLd,
    body,
  });
}

function buildCentresHub() {
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Centres d'examen", path: "/centres-examen/" },
  ];
  // Regroupe par département
  const byDept = {};
  for (const c of CENTRES_EXAMEN) {
    (byDept[c.departement] ||= []).push(c);
  }
  const groups = Object.entries(byDept)
    .map(
      ([dep, list]) =>
        `<section><h2>${esc(dep)}</h2><div class="grid two">${list
          .map(
            (c) =>
              `<a class="tile" href="${centrePath(c)}"><h3>${esc(c.nom)}</h3><div class="meta">Difficulté ${c.difficulte}/5 · ${esc(c.difficulteLabel)}</div></a>`,
          )
          .join("")}</div></section>`,
    )
    .join("\n");
  const body = `
${crumbHtml(trail)}
<span class="pill">Guides centres d'examen</span>
<h1>Centres d'examen du permis</h1>
<p class="lead big">Chaque centre a ses pièges. On te dit, secteur par secteur, ce qui fait échouer les candidats. Et comment t'y préparer. Connaître ton centre, c'est une vraie longueur d'avance le jour J.</p>
${groups}
${renderCta({
    text: "Prépare ton centre dans PermiGo",
    sub: "Entraînement ciblé sur les pièges de ton secteur. Gratuit pour démarrer.",
    href: "/#/signup",
  })}
`;
  return layout({
    title: "Centres d'examen du permis : pièges et conseils par ville | PermiGo",
    desc: "Guides des centres d'examen du permis de conduire : accès, difficulté et pièges réels secteur par secteur. Prépare ton centre et mets toutes les chances de ton côté.",
    path: "/centres-examen/",
    jsonLd: [breadcrumbLd(trail)],
    body,
  });
}

// ─── Pages : guides ───────────────────────────────────────────
function guidePath(g) {
  return `/guides/${g.slug}/`;
}
function buildGuide(g) {
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Guides", path: "/guides/" },
    { name: g.h1, path: guidePath(g) },
  ];
  const others = GUIDES.filter((o) => o.slug !== g.slug).slice(0, 4);
  const relatedHtml = `<section><h2>À lire aussi</h2><div class="grid two">${others
    .map(
      (o) =>
        `<a class="tile" href="${guidePath(o)}"><h3>${esc(o.h1)}</h3></a>`,
    )
    .join("")}</div></section>`;

  const body = `
${crumbHtml(trail)}
<span class="pill">Guide permis</span>
<h1>${esc(g.h1)}</h1>
<p class="lead">${esc(g.lead)}</p>
${renderSections(g.sections)}
${renderCta(g.cta)}
${renderFaq(g.faq)}
${relatedHtml}
`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.metaDesc,
    inLanguage: "fr",
    publisher: {
      "@type": "Organization",
      name: "PermiGo",
      logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png` },
    },
  };
  const jsonLd = [breadcrumbLd(trail), article];
  const fl = faqLd(g.faq);
  if (fl) jsonLd.push(fl);
  return layout({
    title: g.metaTitle + " | PermiGo",
    desc: g.metaDesc,
    path: guidePath(g),
    jsonLd,
    body,
  });
}

function buildGuidesHub() {
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Guides", path: "/guides/" },
  ];
  const tiles = GUIDES.map(
    (g) =>
      `<a class="tile" href="${guidePath(g)}"><h3>${esc(g.h1)}</h3><div class="meta">${esc(g.metaDesc.slice(0, 80))}…</div></a>`,
  ).join("");
  const body = `
${crumbHtml(trail)}
<span class="pill">Guides permis</span>
<h1>Guides pour réussir ton permis</h1>
<p class="lead big">Tout ce qu'il faut savoir pour réviser efficacement, comprendre l'examen et arriver serein le jour J. Des guides clairs, sans blabla.</p>
<div class="grid two">${tiles}</div>
${renderCta({
    text: "Révise avec PermiGo",
    sub: "Code, examens blancs et préparation du jour J. Gratuit pour commencer.",
    href: "/#/signup",
  })}
`;
  return layout({
    title: "Guides du permis de conduire : réviser, code, examen | PermiGo",
    desc: "Guides pratiques pour réussir le permis : méthode de révision du code, examens blancs, fautes éliminatoires et déroulement de l'examen pratique.",
    path: "/guides/",
    jsonLd: [breadcrumbLd(trail)],
    body,
  });
}

// ─── Page : pilier moniteur ───────────────────────────────────
function buildMoniteur() {
  const m = MONITEUR_PILLAR;
  const trail = [
    { name: "Accueil", path: "/" },
    { name: "Pour les moniteurs", path: "/pour-moniteurs/" },
  ];
  const body = `
${crumbHtml(trail)}
<span class="pill">Pour le moniteur indépendant</span>
<h1>${esc(m.h1)}</h1>
<p class="lead big">${esc(m.lead)}</p>
${renderSections(m.sections)}
${renderCta(m.cta)}
${renderFaq(m.faq)}
`;
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PermiGo",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "9.99",
      priceCurrency: "EUR",
    },
    description: m.metaDesc,
  };
  const jsonLd = [breadcrumbLd(trail), software];
  const fl = faqLd(m.faq);
  if (fl) jsonLd.push(fl);
  return layout({
    title: m.metaTitle, // contient déjà « PermiGo »
    desc: m.metaDesc,
    path: "/pour-moniteurs/",
    jsonLd,
    body,
  });
}

// ─── Sitemap ──────────────────────────────────────────────────
function sitemap(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.prio}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
${body}
</urlset>`;
}

// ─── Run ──────────────────────────────────────────────────────
async function run() {
  if (!existsSync(DIST)) {
    console.error("[build-seo] dist/ introuvable — lance `vite build` d'abord.");
    process.exit(1);
  }
  const urls = [];

  await write("pour-moniteurs/index.html", buildMoniteur());
  urls.push({ loc: "/pour-moniteurs/", freq: "monthly", prio: "0.9" });

  await write("centres-examen/index.html", buildCentresHub());
  urls.push({ loc: "/centres-examen/", freq: "weekly", prio: "0.8" });
  for (const c of CENTRES_EXAMEN) {
    await write(`centres-examen/${c.slug}/index.html`, buildCentre(c));
    urls.push({ loc: centrePath(c), freq: "monthly", prio: "0.7" });
  }

  await write("guides/index.html", buildGuidesHub());
  urls.push({ loc: "/guides/", freq: "weekly", prio: "0.8" });
  for (const g of GUIDES) {
    await write(`guides/${g.slug}/index.html`, buildGuide(g));
    urls.push({ loc: guidePath(g), freq: "monthly", prio: "0.7" });
  }

  await writeFile(resolve(DIST, "sitemap.xml"), sitemap(urls), "utf8");

  const total = 3 + CENTRES_EXAMEN.length + GUIDES.length;
  console.log(
    `[build-seo] ${total} pages SEO générées (${CENTRES_EXAMEN.length} centres, ${GUIDES.length} guides, 1 pilier moniteur, 2 hubs) + sitemap.xml`,
  );
}

run().catch((e) => {
  console.error("[build-seo] échec :", e);
  process.exit(1);
});
