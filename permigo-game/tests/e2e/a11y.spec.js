/**
 * A11y audit — axe-core WCAG 2.1 AA scan sur les 5 pages clés.
 *
 * Politique :
 *  - Violations critical/serious  → test FAIL (bloquant)
 *  - Violations moderate/minor    → test WARN (loguées, non-bloquantes)
 *
 * Pré-requis : npm run dev (ou webServer dans playwright.config.js)
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ELEVE, ENSEIGNANT } from "./_creds.js";

const EMAIL_ELEVE = ELEVE.email;
const EMAIL_ENSEIGNANT = ENSEIGNANT.email;
const PWD = ELEVE.pwd;

// Consentement cookies pré-posé : sinon le banner + son scrim translucide
// recouvrent la page et axe calcule les contrastes À TRAVERS le scrim.
async function prepPage(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("permigo_cookie_consent", "essential");
    } catch {
      /* ignore */
    }
  });
}

async function loginAs(page, email) {
  await prepPage(page);
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 12_000 });
  await page.fill("#lg-email", email);
  await page.fill("#lg-pwd", PWD);
  await page.click("#lg-submit");
  // afterLogin() force le hash sur "#/" en différé et pose body.has-chrome
  // en dernier : attendre ce signal avant toute navigation hash.
  await page.waitForSelector("body.has-chrome", { timeout: 25_000 });
}

function splitViolations(violations) {
  const blocking = violations.filter((v) =>
    ["critical", "serious"].includes(v.impact),
  );
  const warnings = violations.filter(
    (v) => !["critical", "serious"].includes(v.impact),
  );
  return { blocking, warnings };
}

function formatViolation(v) {
  return (
    `[${v.impact.toUpperCase()}] ${v.id}: ${v.description}\n` +
    v.nodes
      .slice(0, 2)
      .map((n) => `  → ${n.target.join(", ")}`)
      .join("\n")
  );
}

// ─── Page : Login ────────────────────────────────────────────────────
test("a11y · login page", async ({ page }) => {
  await prepPage(page);
  await page.goto("/#/login");
  await page.waitForSelector("#lg-email", { timeout: 10_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("#cf-turnstile-wrapper") // Cloudflare Turnstile (external)
    .analyze();

  const { blocking, warnings } = splitViolations(results.violations);

  if (warnings.length) {
    console.warn(
      `[a11y login] ${warnings.length} moderate/minor violations:\n` +
        warnings.map(formatViolation).join("\n"),
    );
  }

  expect(
    blocking,
    `Critical/serious a11y violations on login:\n${blocking.map(formatViolation).join("\n")}`,
  ).toHaveLength(0);
});

// ─── Page : Accueil élève ────────────────────────────────────────────
test("a11y · accueil élève", async ({ page }) => {
  await loginAs(page, EMAIL_ELEVE);
  await page.waitForSelector(".acc2", { timeout: 20_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const { blocking, warnings } = splitViolations(results.violations);

  if (warnings.length) {
    console.warn(
      `[a11y accueil] ${warnings.length} moderate/minor violations:\n` +
        warnings.map(formatViolation).join("\n"),
    );
  }

  expect(
    blocking,
    `Critical/serious a11y violations on accueil:\n${blocking.map(formatViolation).join("\n")}`,
  ).toHaveLength(0);
});

// ─── Page : Parcours élève ───────────────────────────────────────────
test("a11y · parcours élève", async ({ page }) => {
  await loginAs(page, EMAIL_ELEVE);
  await page.waitForSelector(".acc2", { timeout: 20_000 });
  await page.evaluate(() => {
    // Vue par défaut « Chapitre » (jalons .prc-cv-jalon) — forcée pour déterminisme.
    try {
      localStorage.setItem("permigo_parcours_view", "chapitre");
    } catch {
      /* ignore */
    }
    location.hash = "#/parcours";
  });
  await page.waitForSelector(".prc-cv-jalon", { timeout: 15_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const { blocking, warnings } = splitViolations(results.violations);

  if (warnings.length) {
    console.warn(
      `[a11y parcours] ${warnings.length} moderate/minor violations:\n` +
        warnings.map(formatViolation).join("\n"),
    );
  }

  expect(
    blocking,
    `Critical/serious a11y violations on parcours:\n${blocking.map(formatViolation).join("\n")}`,
  ).toHaveLength(0);
});

// ─── Parcours : fiche compétence (dialog) ───────────────────────────
test("a11y · fiche compétence dialog", async ({ page }) => {
  await loginAs(page, EMAIL_ELEVE);
  await page.waitForSelector(".acc2", { timeout: 20_000 });
  await page.evaluate(() => {
    // Vue par défaut « Chapitre » (jalons .prc-cv-jalon) — forcée pour déterminisme.
    try {
      localStorage.setItem("permigo_parcours_view", "chapitre");
    } catch {
      /* ignore */
    }
    location.hash = "#/parcours";
  });
  await page.waitForSelector(".prc-cv-jalon", { timeout: 15_000 });
  // Ouvre la première fiche (clic via evaluate : les nodes ont une animation
  // continue qui les rend « not stable » pour l'auto-wait Playwright)
  await page
    .locator(".prc-cv-jalon:not(.locked)")
    .first()
    .evaluate((el) => el.click());
  await page.waitForSelector("#bsheet.open", { timeout: 6_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include("#bsheet")
    .analyze();

  const { blocking, warnings } = splitViolations(results.violations);

  if (warnings.length) {
    console.warn(
      `[a11y fiche] ${warnings.length} moderate/minor violations:\n` +
        warnings.map(formatViolation).join("\n"),
    );
  }

  expect(
    blocking,
    `Critical/serious a11y violations on fiche dialog:\n${blocking.map(formatViolation).join("\n")}`,
  ).toHaveLength(0);
});

// ─── Page : Validation enseignant ───────────────────────────────────
test("a11y · validation enseignant", async ({ page }) => {
  await loginAs(page, EMAIL_ENSEIGNANT);
  await page.waitForSelector(".aj-page, .vs, .me-list", { timeout: 20_000 });
  await page.evaluate(() => {
    location.hash = "#/validation";
  });
  await page.waitForSelector(".vs", { timeout: 10_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const { blocking, warnings } = splitViolations(results.violations);

  if (warnings.length) {
    console.warn(
      `[a11y validation] ${warnings.length} moderate/minor violations:\n` +
        warnings.map(formatViolation).join("\n"),
    );
  }

  expect(
    blocking,
    `Critical/serious a11y violations on validation:\n${blocking.map(formatViolation).join("\n")}`,
  ).toHaveLength(0);
});

// ─── Page : Profil (commun) ──────────────────────────────────────────
test("a11y · profil", async ({ page }) => {
  await loginAs(page, EMAIL_ELEVE);
  await page.waitForSelector(".acc2", { timeout: 20_000 });
  await page.evaluate(() => {
    location.hash = "#/profil";
  });
  await page.waitForSelector(".prf", { timeout: 10_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const { blocking, warnings } = splitViolations(results.violations);

  if (warnings.length) {
    console.warn(
      `[a11y profil] ${warnings.length} moderate/minor violations:\n` +
        warnings.map(formatViolation).join("\n"),
    );
  }

  expect(
    blocking,
    `Critical/serious a11y violations on profil:\n${blocking.map(formatViolation).join("\n")}`,
  ).toHaveLength(0);
});
