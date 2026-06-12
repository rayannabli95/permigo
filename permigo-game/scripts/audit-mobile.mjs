// ═══════════════════════════════════════════════════════════════
// Audit mobile instrumenté — Phase 1 de FABLE_MOBILE_HARDENING.
// Mesure, écran par écran et par rôle :
//   1. touch targets < 44×44px        4. contraste < 4.5:1 (light + dark)
//   2. débordement horizontal          5. pièges de scroll imbriqués
//   3. (safe-area = grep statique)     6. boutons sans feedback :active
// Usage : node scripts/audit-mobile.mjs > /tmp/audit-mobile.json
// ═══════════════════════════════════════════════════════════════
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE || "http://localhost:5173";
const PWD = "Autopilot2025!";

const ROUTES = {
  eleve: ["", "parcours", "sessions", "quiz", "flash-quiz", "trophees", "classement", "galerie", "examen", "feedback", "boutique", "exam-blanc", "mes-coffres", "messages", "legal", "profil", "notifications", "settings"],
  enseignant: ["aujourdhui", "parcours", "parcours-complet", "eleves", "classement-eleves", "livret", "insights", "bilan", "trophees-moniteur", "ligue-semaine", "log-session", "messages", "profil", "notifications", "settings"],
  gerant: ["", "pulse", "equipe", "eleves", "bilan", "messages", "profil", "notifications", "settings"],
};
const PUBLIC_ROUTES = ["", "login", "signup"];
const ACCOUNTS = { eleve: "eleve@test.fr", enseignant: "enseignant@test.fr", gerant: "gerant@test.fr" };

// Viewport principal (checks complets) + secondaires (overflow seulement)
const MAIN_VP = { width: 390, height: 844 };
const EXTRA_VPS = [
  { width: 360, height: 780 },
  { width: 414, height: 896 },
  { width: 844, height: 390 }, // landscape
];

// ─── Fonction d'audit injectée dans la page ──────────────────────
const auditFn = (opts) => {
  const { full } = opts;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const out = {};

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0.05;
  };
  const sig = (el) => {
    const cls = (typeof el.className === "string" ? el.className : "")
      .split(" ").filter(Boolean).slice(0, 2).join(".");
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
  };

  // 2. Débordement horizontal (toujours)
  const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  out.overflow = sw > vw + 2 ? { vw, sw } : null;

  if (!full) return out;

  // 1. Touch targets < 44px
  const targets = [];
  document.querySelectorAll('button, a, [role="button"], [role="tab"], input:not([type=hidden]), select, textarea, summary').forEach((el) => {
    if (!visible(el) || el.disabled) return;
    const r = el.getBoundingClientRect();
    // hors écran (carrousels) : on ignore ce qui est entièrement hors viewport horizontal
    if (r.right < 0 || r.left > vw) return;
    // exemption WCAG : lien inline dans un paragraphe
    if (el.tagName === "A" && el.closest("p,li,td")) return;
    // exemption : liens d'évitement clavier (visibles uniquement au focus)
    if (/(^|\s)(skip-link|prc-skip)(\s|$)/.test(el.className || "")) return;
    // checkbox/radio dans un label cliquable plus grand → hit-area = le label
    if ((el.type === "checkbox" || el.type === "radio") && el.closest("label")) {
      const lr = el.closest("label").getBoundingClientRect();
      if (lr.width >= 44 && lr.height >= 44) return;
    }
    // Crédit des hit-areas étendues par pseudo-élément (::before/::after en
    // position:absolute avec insets négatifs) : elles reçoivent les taps.
    let w = r.width, h = r.height;
    for (const pseudo of ["::before", "::after"]) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content !== "none" && ps.position === "absolute") {
        const t = parseFloat(ps.top), b = parseFloat(ps.bottom), l = parseFloat(ps.left), rr = parseFloat(ps.right);
        if (t < 0 || b < 0 || l < 0 || rr < 0) {
          w = Math.max(w, r.width - (l < 0 ? l : 0) - (rr < 0 ? rr : 0));
          h = Math.max(h, r.height - (t < 0 ? t : 0) - (b < 0 ? b : 0));
        }
      }
    }
    if (w < 43.5 || h < 43.5) {
      targets.push({ sig: sig(el), w: Math.round(w), h: Math.round(h), txt: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 28) });
    }
  });
  // dédup par signature, garde la plus petite occurrence + compte
  const bySig = {};
  targets.forEach((t) => {
    if (!bySig[t.sig] || t.w * t.h < bySig[t.sig].w * bySig[t.sig].h) bySig[t.sig] = { ...t, n: 0 };
    bySig[t.sig].n++;
  });
  out.smallTargets = Object.values(bySig);

  // 6. Boutons sans feedback :active
  const activeSelectors = [];
  const harvest = (rules) => {
    for (const r of rules) {
      try {
        // ⚠️ CSS nesting : CHAQUE CSSStyleRule a un .cssRules (souvent vide mais truthy)
        // → tester selectorText d'abord, puis ne récurser que si la liste est non vide.
        if (r.selectorText && r.selectorText.includes(":active")) activeSelectors.push(...r.selectorText.split(",").filter((s) => s.includes(":active")).map((s) => s.replace(/:active/g, "").trim()));
        if (r.cssRules && r.cssRules.length) harvest(r.cssRules);
      } catch { /* cross-origin */ }
    }
  };
  for (const ss of document.styleSheets) { try { harvest(ss.cssRules); } catch {} }
  const noFeedback = {};
  document.querySelectorAll('button, [role="button"]').forEach((el) => {
    if (!visible(el) || el.disabled) return;
    const r = el.getBoundingClientRect();
    if (r.right < 0 || r.left > vw) return;
    const has = activeSelectors.some((s) => { try { return s && el.matches(s); } catch { return false; } });
    if (!has) {
      const k = sig(el);
      noFeedback[k] = (noFeedback[k] || 0) + 1;
    }
  });
  out.noActiveFeedback = Object.entries(noFeedback).map(([k, n]) => ({ sig: k, n }));

  // 5. Pièges de scroll : conteneurs scrollables verticaux imbriqués
  const traps = [];
  document.querySelectorAll("body *").forEach((el) => {
    const s = getComputedStyle(el);
    if ((s.overflowY === "auto" || s.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 10 && visible(el)) {
      if (s.overscrollBehaviorY === "auto") traps.push(sig(el));
    }
  });
  out.scrollTraps = [...new Set(traps)].slice(0, 6);

  // 4. Contraste — texte visible, ratio WCAG
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (str) => {
    const m = str.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const effBg = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const st = getComputedStyle(node);
      // Fond dégradé/image : ratio incalculable de façon fiable → on saute (pas de faux positif)
      if (st.backgroundImage && st.backgroundImage !== "none") return null;
      const c = parse(st.backgroundColor);
      if (c && c.a > 0.85) return c;
      node = node.parentElement;
    }
    const rootBg = parse(getComputedStyle(document.body).backgroundColor);
    return rootBg && rootBg.a > 0 ? rootBg : { r: 255, g: 255, b: 255, a: 1 };
  };
  const contrastIssues = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn, count = 0;
  while ((tn = walker.nextNode()) && count < 1200) {
    const txt = tn.textContent.trim();
    if (txt.length < 3) continue;
    const el = tn.parentElement;
    if (!el || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh * 3 || r.right < 0 || r.left > vw) continue;
    count++;
    const s = getComputedStyle(el);
    const fg = parse(s.color);
    // Texte transparent = gradient-clipped (background-clip:text) → incalculable, on saute
    if (!fg || fg.a < 0.6) continue;
    const bg = effBg(el);
    if (!bg) continue;
    const l1 = lum(fg.r, fg.g, fg.b), l2 = lum(bg.r, bg.g, bg.b);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const fs = parseFloat(s.fontSize);
    const big = fs >= 24 || (fs >= 18.66 && parseInt(s.fontWeight) >= 700);
    const need = big ? 3 : 4.5;
    if (ratio < need - 0.05) {
      const k = sig(el);
      if (!contrastIssues[k] || ratio < contrastIssues[k].ratio) {
        contrastIssues[k] = { sig: k, ratio: Math.round(ratio * 100) / 100, fs: Math.round(fs), txt: txt.slice(0, 26) };
      }
    }
  }
  out.contrast = Object.values(contrastIssues).sort((a, b) => a.ratio - b.ratio).slice(0, 10);
  return out;
};

// ─── Pilotage ────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: MAIN_VP, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
await ctx.addInitScript(() => { try { sessionStorage.setItem("permigo-launch-splash", "1"); } catch {} });
const page = await ctx.newPage();
const report = { meta: { base: BASE, date: new Date().toISOString() }, screens: [] };

async function visit(route) {
  await page.goto(`${BASE}/#/${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
}

async function auditScreen(role, route) {
  const entry = { role, route: "#/" + route, issues: {} };
  // viewport principal : checks complets, thème light puis dark (contraste)
  await page.setViewportSize(MAIN_VP);
  await visit(route);
  const light = await page.evaluate(auditFn, { full: true });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(250);
  const darkContrast = await page.evaluate(auditFn, { full: true });
  await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
  entry.issues = {
    smallTargets: light.smallTargets,
    noActiveFeedback: light.noActiveFeedback,
    scrollTraps: light.scrollTraps,
    contrastLight: light.contrast,
    contrastDark: darkContrast.contrast,
    overflow: {},
  };
  if (light.overflow) entry.issues.overflow["390"] = light.overflow;
  // viewports secondaires : overflow only
  for (const vp of EXTRA_VPS) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(350);
    const r = await page.evaluate(auditFn, { full: false });
    if (r.overflow) entry.issues.overflow[`${vp.width}x${vp.height}`] = r.overflow;
  }
  report.screens.push(entry);
  process.stderr.write(`  ✓ ${role} ${entry.route}\n`);
}

async function login(email) {
  await page.setViewportSize(MAIN_VP);
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const e = page.locator("input[type=email]");
  if (!(await e.count())) return false;
  await e.fill(email);
  await page.locator("input[type=password]").fill(PWD);
  await page.locator("button[type=submit]").first().click({ force: true });
  await page.waitForTimeout(3200);
  return !(await page.locator("input[type=password]").count());
}

async function logout() {
  // S'assurer d'être sur l'origin avant de toucher localStorage (about:blank au 1er run)
  if (!page.url().startsWith(BASE)) await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.setItem("permigo-launch-splash", "1"); });
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
}

// Public d'abord (déconnecté)
process.stderr.write("— public —\n");
await logout();
for (const r of PUBLIC_ROUTES) await auditScreen("public", r);

for (const [role, email] of Object.entries(ACCOUNTS)) {
  process.stderr.write(`— ${role} —\n`);
  await logout();
  const ok = await login(email);
  if (!ok) { report.screens.push({ role, route: "(login échoué)", issues: {} }); process.stderr.write(`  ✗ login ${email} échoué — rôle sauté\n`); continue; }
  for (const r of ROUTES[role]) await auditScreen(role, r);
}

await browser.close();
console.log(JSON.stringify(report, null, 1));
