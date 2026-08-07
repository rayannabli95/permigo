/**
 * E2E — Empty States (tous rôles)
 *
 * Vérifie les états vides actuels :
 *  - composant empty-state (déplacé dans components/common/) : styles injectés
 *    une seule fois
 *  - mes-élèves enseignant : liste (.me-row) ou état vide (.me-empty), et
 *    « Aucun résultat » quand la recherche ne matche rien
 *
 * Comptes test :
 *   Élève  : eleve@test.fr      / Autopilot2025!
 *   Moniteur : enseignant@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ELEVE, ENSEIGNANT as MONITEUR } from "./_creds.js";

async function loginAs(page, { email, pwd }) {
  // Marque cookies + tours guidés (élève ET moniteur) comme vus : sinon
  // l'overlay du tour (.gt-root) intercepte les clics (flake récurrent).
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "essential");
      localStorage.setItem("pg-tour-eleve-v1", "1");
      localStorage.setItem("permigo-parcours-tuto-v1", "1");
      localStorage.setItem("permigo-theory-tuto-v1", "1");
      localStorage.setItem("pg-nav-intro-done", "1");
      localStorage.setItem("pg-tour-moniteur-v1", "1");
      localStorage.setItem("pg-tour-validation-v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", email);
  await page.fill("#lg-pwd", pwd);
  await page.click("#lg-submit");
  await page.waitForSelector("body.has-chrome", { timeout: 25_000 });
}

async function goTo(page, hash) {
  await page.evaluate((h) => {
    location.hash = h;
  }, hash);
}

// ── Inject a module directly if the route isn't wired yet ────────
async function injectPage(page, modulePath, extraArgs = []) {
  await page.evaluate(
    async ({ path, args }) => {
      const mod = await import(path);
      const root = document.querySelector("#app") || document.body;
      await mod.mount(root, ...args);
    },
    { path: modulePath, args: extraArgs },
  );
}

// ────────────────────────────────────────────────────────────────

test.describe("Empty states — composant", () => {
  test("empty-state component injecte les styles une seule fois dans <head>", async ({
    page,
  }) => {
    await loginAs(page, ELEVE);

    await page.evaluate(async () => {
      // Le composant vit désormais dans components/common/
      const { renderEmptyState } =
        await import("/src/components/common/empty-state.js");
      // Appeler deux fois pour vérifier l'injection unique
      renderEmptyState({
        illustration: "/skins/empty-parcours.png",
        title: "Test",
      });
      renderEmptyState({
        illustration: "/skins/empty-parcours.png",
        title: "Test 2",
      });
    });

    const styleCount = await page.evaluate(
      () =>
        [...document.head.querySelectorAll("style")].filter((s) =>
          s.textContent.includes(".es-wrap"),
        ).length,
    );
    expect(styleCount).toBe(1);
  });
});

test.describe("Empty state — Mes Élèves enseignant", () => {
  // La page a été refondue : racine .me-page, contenu .me-pipeline,
  // lignes .me-row, état vide .me-empty (illustration incluse).
  test("affiche la liste ou l'état vide (aucun élève)", async ({ page }) => {
    await loginAs(page, MONITEUR);
    await goTo(page, "#/eleves");

    const found = await page
      .waitForSelector(".me-page", { timeout: 8_000 })
      .catch(() => null);
    if (!found) await injectPage(page, "/src/pages/enseignant/mes-eleves.js");
    await page.waitForSelector(".me-pipeline", { timeout: 10_000 });

    const hasRows = await page
      .locator(".me-row")
      .count()
      .then((n) => n > 0)
      .catch(() => false);
    const hasEmpty = await page
      .locator(".me-empty")
      .isVisible()
      .catch(() => false);

    // La page doit montrer soit des élèves, soit l'état vide illustré
    expect(hasRows || hasEmpty).toBe(true);
  });

  test("une recherche sans résultat affiche « Aucun résultat »", async ({
    page,
  }) => {
    await loginAs(page, MONITEUR);
    await goTo(page, "#/eleves");

    const found = await page
      .waitForSelector(".me-page", { timeout: 8_000 })
      .catch(() => null);
    if (!found) await injectPage(page, "/src/pages/enseignant/mes-eleves.js");
    await page.waitForSelector(".me-pipeline", { timeout: 10_000 });

    // S'il n'y a aucun élève, la barre de recherche n'a pas de sens ici
    const hasRows = await page
      .locator(".me-row")
      .count()
      .then((n) => n > 0)
      .catch(() => false);
    if (!hasRows) {
      test.skip(
        true,
        "Aucun élève sur le compte test — recherche non applicable",
      );
      return;
    }

    // La barre de recherche actuelle est l'input .me-search (classe, pas id)
    const searchInput = page.locator(".me-search").first();
    await expect(searchInput).toBeVisible({ timeout: 4_000 });
    await searchInput.fill("xxxxintrouvablexxx");
    await page.waitForTimeout(400);

    // Doit montrer le texte « Aucun résultat »
    const noResultTxt = await page
      .locator(".me-empty")
      .textContent({ timeout: 3_000 })
      .catch(() => "");
    expect(noResultTxt).toMatch(/aucun résultat/i);
  });
});
