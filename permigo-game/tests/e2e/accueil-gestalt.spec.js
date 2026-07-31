/**
 * E2E — Accueil élève : nettoyage Gestalt (lot 1 & 2)
 *
 * Couvre les décisions produit du redesign accueil :
 *   C3 — pas de cloche en doublon (la cloche header a été retirée :
 *        l'entrée notifications vit dans le profil)
 *   C5 — label de nav visible uniquement sous l'onglet actif
 *        (picto ligne/plein par onglet, un seul visible)
 *   C8 — au plus une entrée examen blanc sur l'accueil
 *        (la Boule de cristal a été retirée)
 *
 * Compte test : eleve@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";

const EMAIL = ELEVE.email;
const PWD = ELEVE.pwd;

async function loginAsEleve(page) {
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  // 25 s : sous forte charge (suite complète en parallèle), le boot
  // post-login peut dépasser les 20 s.
  await page.waitForSelector("body.has-chrome", { timeout: 25_000 });
}

test.describe("Accueil élève — Gestalt cleanup", () => {
  test.beforeEach(async ({ page }) => loginAsEleve(page));

  // ─── C3 — pas de cloche dupliquée ─────────────────────────────────
  // La cloche header a été RETIRÉE : l'entrée notifications vit désormais
  // dans le profil (#/notifications). L'invariant produit conservé :
  // aucune cloche en doublon sur l'accueil, et surtout aucune dans le hero.
  test("C3 — aucune cloche sur l'accueil (entrée notifications = profil), hero propre", async ({
    page,
  }) => {
    // Le chrome (header) est bien monté
    await expect(page.locator("#header-bar")).toBeVisible();

    // Plus aucune cloche .nb-btn nulle part (composant retiré)
    await expect(page.locator(".nb-btn")).toHaveCount(0);

    // Aucune entrée notifications dans le hero
    await expect(page.locator(".acc2-hero-v2 .nb-btn")).toHaveCount(0);
    await expect(
      page.locator('.acc2-hero-v2 [aria-label="Notifications"]'),
    ).toHaveCount(0);
  });

  // ─── C5 — la nav distingue l'onglet actif ─────────────────────────
  // La règle d'origine (« seul l'onglet actif porte un label ») a été
  // ABANDONNÉE : la nav affiche désormais le label sous CHAQUE picto, comme
  // repère des sections (cf. nav-bottom.js, « TOUJOURS visible sous chaque
  // picto »). Le test vérifie donc la règle qui a remplacé l'ancienne :
  // tous les labels se lisent, et l'actif se distingue par la COULEUR.
  // Cette dernière assertion n'est pas cosmétique : le 31/07/2026 le label
  // actif est passé à 1,62:1 sur les pages nuit — invisible — sans qu'aucun
  // test ne s'en aperçoive.
  test("C5 — tous les labels se lisent, l'onglet actif se distingue", async ({
    page,
  }) => {
    await expect(page.locator("#bottom-nav")).toBeVisible();

    const tabs = page.locator("#bottom-nav .bn-tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);

    // Exactement un onglet actif
    await expect(page.locator("#bottom-nav .bn-tab.active")).toHaveCount(1);

    // Label de l'onglet actif visible (opacité ~1)
    const activeOpacity = await page
      .locator("#bottom-nav .bn-tab.active .bn-label")
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(activeOpacity).toBeGreaterThan(0.9);

    // Tous les labels se lisent + un seul picto visible par onglet
    const couleurs = new Set();
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const isActive = await tab.evaluate((el) =>
        el.classList.contains("active"),
      );
      // Chaque onglet embarque 2 pictos (tracé .bn-ico-line + plein .bn-ico-fill,
      // l'actif bascule sur la version pleine) — mais UN SEUL est visible à la fois.
      await expect(tab.locator(".bn-ico-line svg")).toHaveCount(1);
      await expect(tab.locator(".bn-ico-fill svg")).toHaveCount(1);
      await expect(tab.locator("svg:visible")).toHaveCount(1);

      const { op, color } = await tab.locator(".bn-label").evaluate((el) => {
        const cs = getComputedStyle(el);
        return { op: parseFloat(cs.opacity), color: cs.color };
      });
      // Le label de CHAQUE onglet doit se lire, actif ou non.
      expect(op).toBeGreaterThan(0.9);
      couleurs.add(isActive ? `actif:${color}` : `repos:${color}`);
    }

    // L'actif doit se distinguer par la couleur — c'est le SEUL signal qui
    // reste maintenant que tous les labels sont affichés.
    const actif = [...couleurs].filter((c) => c.startsWith("actif:"));
    const repos = [...couleurs].filter((c) => c.startsWith("repos:"));
    expect(actif).toHaveLength(1);
    expect(repos.map((c) => c.slice(6))).not.toContain(actif[0].slice(6));
  });

  // ─── C8 — pas de doublon d'entrée « examen blanc » sur l'accueil ──
  // La Boule de cristal a été RETIRÉE de l'accueil (l'examen blanc s'atteint
  // depuis le parcours / la nav). L'invariant produit conservé : jamais deux
  // CTA examen blanc en concurrence sur l'accueil.
  test("C8 — au plus une entrée examen blanc sur l'accueil, boule de cristal retirée", async ({
    page,
  }) => {
    // Attendre le CTA roi (le contenu principal de l'accueil est rendu)
    await page.waitForSelector(".acc2-cta-king", { timeout: 12_000 });

    // Plus aucune boule de cristal (ni son état vide)
    await expect(page.locator(".acc2-crystal")).toHaveCount(0);
    await expect(page.locator(".acc2-cb-empty")).toHaveCount(0);

    // Au plus UNE entrée vers l'examen blanc sur toute la page
    const entries = page.locator(
      '#app [href="#/exam-blanc"], #app [data-href="#/exam-blanc"]',
    );
    expect(await entries.count()).toBeLessThanOrEqual(1);

    // L'« action du jour » (si présente) ne contient jamais de CTA exam-blanc
    const action = page.locator(".acc2-action");
    if ((await action.count()) > 0) {
      await expect(action.locator('[data-href="#/exam-blanc"]')).toHaveCount(0);
    }
  });
});
