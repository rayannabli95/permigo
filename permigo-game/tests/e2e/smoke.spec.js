/**
 * Smoke tests — flows critiques élève
 * Couvre : login → accueil → parcours → fiche compétence → notifications push
 *
 * Pré-requis : compte Supabase prod actif
 *   eleve@test.fr / Autopilot2025!
 */
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";

const EMAIL = ELEVE.email;
const PWD = ELEVE.pwd;

async function loginAsEleve(page) {
  // Marque cookies + tutos/tour guidés comme vus : sinon l'overlay du tour
  // (.gt-root / .gt-catch) intercepte les clics sur le parcours (flaky → timeout).
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "essential");
      localStorage.setItem("pg-tour-eleve-v1", "1");
      localStorage.setItem("permigo-parcours-tuto-v1", "1");
      localStorage.setItem("permigo-theory-tuto-v1", "1");
      localStorage.setItem("pg-nav-intro-done", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", EMAIL);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  // Shell monté post-login (accueil redesign : l'ancien .acc2-hero-hi n'existe plus).
  await page.waitForSelector("body.has-chrome", { timeout: 25_000 });
  await page.waitForSelector(".acc2", { timeout: 20_000 });
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
    await expect(page.locator(".acc2")).toBeVisible();
    await expect(page.locator(".acc2-hero-v2")).toBeVisible();
  });
});

// ─── Accueil ─────────────────────────────────────────────────────────
test.describe("Accueil élève", () => {
  test.beforeEach(async ({ page }) => loginAsEleve(page));

  test("hero section visible", async ({ page }) => {
    await expect(page.locator(".acc2-hero-v2")).toBeVisible();
  });

  test("CTA principal (king) présent", async ({ page }) => {
    await expect(page.locator(".acc2-cta-king").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── Parcours ────────────────────────────────────────────────────────
test.describe("Parcours REMC", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEleve(page);
    await page.evaluate(() => {
      // Vue par défaut = « Chapitre » (jalons .prc-cv-ms). On la force pour
      // un test déterministe, indépendant d'une préférence éventuellement stockée.
      try {
        localStorage.setItem("permigo_parcours_view", "chapitre");
      } catch {
        /* ignore */
      }
      location.hash = "#/parcours";
    });
    await page.waitForSelector(".prc-cv-ms", { timeout: 15_000 });
  });

  test("au moins une compétence visible", async ({ page }) => {
    await expect(page.locator(".prc-cv-ms").first()).toBeVisible();
  });

  // NB : les nœuds ont une animation continue (« not stable » pour l'auto-wait)
  // et un overlay de tour peut intercepter le pointeur → on clique en DOM direct
  // (.evaluate(el => el.click())), comme le fait a11y.spec.js.
  test("fiche s'ouvre au clic sur un nœud", async ({ page }) => {
    await page
      .locator(".prc-cv-ms[data-comp]")
      .first()
      .evaluate((el) => el.click());
    await page.waitForSelector("#bsheet.open", { timeout: 6_000 });
    await expect(page.locator(".fiche-hero")).toBeVisible();
  });

  test("fiche se referme avec le bouton ×", async ({ page }) => {
    await page
      .locator(".prc-cv-ms[data-comp]")
      .first()
      .evaluate((el) => el.click());
    await page.waitForSelector("#bsheet.open", { timeout: 6_000 });
    await page.locator(".fiche-close").evaluate((el) => el.click());
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

  // Le profil élève est le profil « Arène » (.arn) : le toggle rappels y est
  // le bouton #arn-notif (l'ancien #prf-notif-row ne sert plus que gérant/owner).
  test("toggle notifications visible dans profil", async ({ page }) => {
    await loginAsEleve(page);
    await page.evaluate(() => {
      location.hash = "#/profil";
    });
    // Attendre la page profil élève (Arène)
    await page.waitForSelector(".arn", { timeout: 10_000 });
    // Si Notification API dispo → le bouton rappels doit être présent
    const hasNotifAPI = await page.evaluate(() => "Notification" in window);
    if (hasNotifAPI) {
      await expect(page.locator("#arn-notif")).toBeVisible();
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
    await page.waitForSelector("#arn-notif", { timeout: 10_000 });

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

    // Toggle ON → OFF : optOutPush() pose permigo_push_optout=1.
    // Clic en DOM direct (la page a une animation d'entrée).
    await page.locator("#arn-notif").evaluate((el) => el.click());
    await expect
      .poll(
        () => page.evaluate(() => localStorage.getItem("permigo_push_optout")),
        { timeout: 5_000 },
      )
      .toBe("1");
    // L'état accessible suit
    await expect(page.locator("#arn-notif")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
