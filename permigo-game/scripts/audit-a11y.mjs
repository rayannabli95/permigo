// Audit a11y + Core Web Vitals + cibles tactiles — pages élève Permigo.
// Usage : node scripts/audit-a11y.mjs  (Vite doit tourner sur http://localhost:5173)
// Dépendances : @playwright/test, @axe-core/playwright (déjà présents).
import { chromium, devices } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const PAGES = [
  'accueil', 'parcours', 'quiz', 'examen', 'exam-blanc', 'trophees',
  'galerie', 'boutique', 'mes-coffres', 'wrapped', 'feedback', 'sessions',
];
const VIEWPORTS = {
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true }, // iPhone 14
  desktop: { width: 1280, height: 800 },
};
const AXE_TAGS = ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'];

const WEB_VITALS = `import {onLCP,onINP,onCLS} from 'https://unpkg.com/web-vitals@4?module';
  window.__cwv={};onLCP(m=>window.__cwv.LCP=m.value);onINP(m=>window.__cwv.INP=m.value);onCLS(m=>window.__cwv.CLS=m.value);`;

async function smallTargets(page) {
  return page.evaluate(() => {
    const sel = 'a, button, [role="button"], input, select, [onclick]';
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.width < 24 || r.height < 24) {
        out.push({ tag: el.tagName, cls: el.className, w: Math.round(r.width), h: Math.round(r.height), txt: (el.textContent||'').trim().slice(0,30) });
      }
    }
    return out;
  });
}

async function focusAfterRoute(page, route) {
  await page.evaluate((r) => { location.hash = r; }, route);
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const a = document.activeElement;
    return { tag: a?.tagName, tabindex: a?.getAttribute('tabindex'), isH1: a?.tagName === 'H1' };
  });
}

const results = {};
const browser = await chromium.launch();
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  for (const slug of PAGES) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile });
    const page = await ctx.newPage();
    await page.addInitScript(WEB_VITALS);
    const key = `${slug}@${vpName}`;
    try {
      await page.goto(`${BASE}/#/eleve/${slug}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(800);
      const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      const targets = await smallTargets(page);
      const cwv = await page.evaluate(() => window.__cwv || {});
      // passe prefers-reduced-motion: reduce
      await ctx.close();
      const ctxR = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
      const pageR = await ctxR.newPage();
      await pageR.goto(`${BASE}/#/eleve/${slug}`, { waitUntil: 'networkidle', timeout: 15000 });
      const animatedUnderReduce = await pageR.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll('*')) {
          const s = getComputedStyle(el);
          if ((s.animationName && s.animationName !== 'none') ||
              (s.transitionDuration && s.transitionDuration !== '0s')) {
            bad.push({ cls: el.className?.toString().slice(0,40), anim: s.animationName, trans: s.transitionDuration });
          }
        }
        return bad.slice(0, 30);
      });
      await ctxR.close();
      results[key] = {
        violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help })),
        smallTargets: targets, cwv, animatedUnderReduce,
      };
    } catch (e) {
      results[key] = { error: String(e) };
      await ctx.close().catch(() => {});
    }
  }
}
// focus management au changement de route (desktop)
const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
const page = await ctx.newPage();
await page.goto(`${BASE}/#/eleve/parcours`, { waitUntil: 'networkidle' });
results['__focusOnRoute'] = {
  toQuiz: await focusAfterRoute(page, '#/eleve/quiz'),
  toTrophees: await focusAfterRoute(page, '#/eleve/trophees'),
};
await browser.close();
fs.writeFileSync('audit-results.json', JSON.stringify(results, null, 2));
console.log('audit-results.json écrit —', Object.keys(results).length, 'entrées');
