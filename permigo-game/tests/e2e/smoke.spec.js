/**
 * Smoke tests — flows critiques élève
 * Couvre : login → accueil → parcours → fiche compétence → notifications push
 *
 * Pré-requis : compte Supabase prod actif
 *   latifa.sahli@autopilot.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";

const EMAIL = "latifa.sahli@autopilot.fr";
const PWD = "Autopilot2025!";

async function loginAsEleve(page) {
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  await page.waitForSelector(".acc2-hero-hi", { timeout: 20_000 });
}

// ─── Login ──────────────────────────────────────────────────────────
test.describe("Login", () => {
  test("formulaire login visible au démarrage", async ({ page }) => {
    await page.goto("/#/login");
    await expect(page.locator("#lg-email")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#lg-pwd")).toBeVisible();
    await expect(page.locator("#lg-submit")).toBeVisible();
  });

  test("connexion élève réussie → accueil chargé", async ({ page }) => {
    await loginAsEleve(page);
    await expect(page.locator(".acc2-hero-hi")).toBeVisible();
    await expect(page.locator(".acc2-xp-bar")).toBeVisible();
  });
});

// ─── Accueil ─────────────────────────────────────────────────────────
test.describe("Accueil élève", () => {
  test.beforeEach(async ({ page }) => loginAsEleve(page));

  test("hero section visible", async ({ page }) => {
    await expect(page.locator(".acc2-hero")).toBeVisible();
  });

  test("CTA vers parcours présent", async ({ page }) => {
    await expect(page.locator('[data-href="#/parcours"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── Parcours ────────────────────────────────────────────────────────
test.describe("Parcours REMC", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEleve(page);
    await page.evaluate(() => {
      location.hash = "#/parcours";
    });
    await page.waitForSelector(".prc-node", { timeout: 15_000 });
  });

  test("au moins une compétence visible", async ({ page }) => {
    await expect(page.locator(".prc-node").first()).toBeVisible();
  });

  test("fiche s'ouvre au clic sur un nœud", async ({ page }) => {
    await page.locator(".prc-node").first().click();
    await page.waitForSelector("#bsheet.open", { timeout: 6_000 });
    await expect(page.locator(".fiche-hero")).toBeVisible();
  });

  test("fiche se referme avec le bouton ×", async ({ page }) => {
    await page.locator(".prc-node").first().click();
    await page.waitForSelector("#bsheet.open", { timeout: 6_000 });
    await page.locator(".fiche-close").click();
    await expect(page.locator("#bsheet")).not.toHaveClass(/open/, {
      timeout: 4_000,
    });
  });
});

// ─── Push Notifications ──────────────────────────────────────────────
test.describe("Push notifications — gating", () => {
  test("banner push absent au 1er login (sans permigo_has_validated)", async ({
    page,
  }) => {
    // Simuler un 1er login : effacer le flag has_validated
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("permigo_has_validated"));

    await loginAsEleve(page);
    // Attendre plus que le délai banner (5s) pour être sûr
    await page.waitForTimeout(6_500);
    // Le banner ne doit pas être dans le DOM
    await expect(page.locator("#push-soft-banner")).toHaveCount(0);
  });

  test("banner push absent si permission déjà refusée (denied)", async ({
    page,
    context,
  }) => {
    // Le navigateur headless n'a pas de Notification par défaut → on simule denied
    await context.grantPermissions([]); // aucune permission
    await page.goto("/");
    // Injecter denied dans l'API Notification avant le boot
    await page.addInitScript(() => {
      Object.defineProperty(Notification, "permission", {
        get: () => "denied",
        configurable: true,
      });
    });
    await page.evaluate(() => {
      localStorage.setItem("permigo_has_validated", "1");
      localStorage.removeItem("permigo_push_asked");
      localStorage.removeItem("permigo_push_optout");
    });
    await loginAsEleve(page);
    await page.waitForTimeout(6_500);
    await expect(page.locator("#push-soft-banner")).toHaveCount(0);
  });

  test("toggle notifications visible dans profil", async ({ page }) => {
    await loginAsEleve(page);
    await page.evaluate(() => {
      location.hash = "#/profil";
    });
    // Attendre la page profil
    await page.waitForSelector(".prf", { timeout: 10_000 });
    // Si Notification API dispo → toggle row doit être présent
    const hasNotifAPI = await page.evaluate(() => "Notification" in window);
    if (hasNotifAPI) {
      await expect(page.locator("#prf-notif-row")).toBeVisible();
    }
  });

  test("toggle change l'état opted-out dans localStorage", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["notifications"]);
    await loginAsEleve(page);
    await page.evaluate(() => {
      localStorage.removeItem("permigo_push_optout");
    });
    await page.evaluate(() => {
      location.hash = "#/profil";
    });
    await page.waitForSelector("#prf-notif-row", { timeout: 10_000 });

    // Skip si la permission push n'est pas réellement 'granted' dans ce contexte headless
    const pushAvailable = await page.evaluate(
      () =>
        "Notification" in window &&
        Notification.permission === "granted" &&
        !localStorage.getItem("permigo_push_optout"),
    );
    if (!pushAvailable) {
      test.skip(true, "Push permission non disponible en headless");
      return;
    }

    await page.locator("#prf-notif-row").click();
    const optedOut = await page.evaluate(() =>
      localStorage.getItem("permigo_push_optout"),
    );
    expect(optedOut).toBe("1");
  });
});
