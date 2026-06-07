/**
 * E2E — Accueil élève : nettoyage Gestalt (lot 1 & 2)
 *
 * Couvre les décisions produit du redesign accueil :
 *   C3 — une seule cloche de notifications (header), aucune dans le hero
 *   C5 — label de nav visible uniquement sous l'onglet actif (picto partout)
 *   C8 — la Boule de cristal est le point d'entrée examen unique
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
  await page.waitForSelector(".acc2-hero-hi", { timeout: 20_000 });
}

test.describe("Accueil élève — Gestalt cleanup", () => {
  test.beforeEach(async ({ page }) => loginAsEleve(page));

  // ─── C3 — une seule cloche ────────────────────────────────────────
  test("C3 — une seule cloche, dans le header, aucune dans le hero", async ({
    page,
  }) => {
    // La cloche vit dans #header-bar
    await expect(page.locator("#header-bar")).toBeVisible();
    await expect(page.locator("#header-bar .nb-btn")).toHaveCount(1);

    // Une seule cloche sur toute la page
    await expect(page.locator(".nb-btn")).toHaveCount(1);

    // Aucune cloche dans le hero
    await expect(page.locator(".acc2-hero .nb-btn")).toHaveCount(0);
    await expect(
      page.locator('.acc2-hero [aria-label="Notifications"]'),
    ).toHaveCount(0);
  });

  // ─── C5 — label nav visible sous l'onglet actif seulement ─────────
  test("C5 — label de nav visible uniquement sous l'onglet actif", async ({
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

    // Labels des onglets inactifs masqués (opacité 0) + picto présent partout
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const isActive = await tab.evaluate((el) =>
        el.classList.contains("active"),
      );
      // Picto (svg) présent dans chaque onglet, actif ou non
      await expect(tab.locator("svg")).toHaveCount(1);

      if (!isActive) {
        const op = await tab
          .locator(".bn-label")
          .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
        expect(op).toBeLessThan(0.05);
      }
    }
  });

  // ─── C8 — Boule de cristal = point d'entrée examen unique ─────────
  test("C8 — la Boule de cristal navigue vers l'examen blanc, sans doublon dans l'action du jour", async ({
    page,
  }) => {
    // La crystal (peuplée) ou son empty-state est inséré en async après le hero
    await page.waitForSelector(".acc2-crystal, .acc2-cb-empty", {
      timeout: 12_000,
    });

    // NB : l'accueil peut injecter plusieurs cartes crystal (cf. rapport — la
    // garde anti-double-mount d'accueil.js laisse passer un doublon en course
    // async). On valide la décision produit sur la première carte peuplée.
    const crystal = page.locator(".acc2-crystal").first();
    const populated = (await page.locator(".acc2-crystal").count()) > 0;

    // L'« action du jour » ne doit jamais contenir de CTA vers l'examen blanc
    // (plus de doublon avec la boule de cristal)
    const action = page.locator(".acc2-action");
    if ((await action.count()) > 0) {
      await expect(action.locator('[data-href="#/exam-blanc"]')).toHaveCount(0);
    }

    if (!populated) {
      // eleve@test.fr n'a aucune compétence validée → crystal en état vide.
      // On ne peut pas tester le clic→exam-blanc sans état peuplé.
      test.skip(
        true,
        "Crystal en état vide (validated_count=0 sur le compte de test) — pas de carte .acc2-crystal cliquable",
      );
      return;
    }

    // role=button + focusable
    await expect(crystal).toHaveAttribute("role", "button");
    await expect(crystal).toHaveAttribute("tabindex", "0");
    await crystal.focus();
    await expect(crystal).toBeFocused();

    // Un clic navigue vers #/exam-blanc
    await crystal.click();
    await page.waitForFunction(() => location.hash === "#/exam-blanc", {
      timeout: 6_000,
    });
    expect(new URL(page.url()).hash).toBe("#/exam-blanc");
  });
});
