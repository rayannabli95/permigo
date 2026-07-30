import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const url =
  process.env.PILOTE_ART_URL ||
  "http://127.0.0.1:4175/mockups/moteur-pilote/art-library/";
const capturePath = process.env.PILOTE_ART_CAPTURE || "";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const consoleErrors = [];

page.on("pageerror", (error) => consoleErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  for (const width of [320, 390, 520]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url, { waitUntil: "networkidle" });
    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.equal(
      viewport.scrollWidth,
      viewport.clientWidth,
      `Débordement horizontal à ${width}`,
    );
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: "networkidle" });

  assert.equal(await page.locator("[data-card]").count(), 6);
  assert.equal(await page.locator("svg text").count(), 0);
  assert.equal(await page.locator("img").count(), 0);
  assert.equal(await page.locator(".pg-element button").count(), 0);

  const touchTargets = await page.locator("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  assert.ok(
    touchTargets.every(({ width, height }) => width >= 44 && height >= 44),
    "Une commande mesure moins de 44 par 44",
  );

  for (const state of ["idle", "active", "found", "error"]) {
    await page.locator(`[data-set-state="${state}"]`).click();
    const states = await page.locator(".al-card .pg-element").evaluateAll(
      (elements) => elements.map((element) => element.dataset.state),
    );
    assert.ok(states.every((value) => value === state));
  }

  for (const position of ["P", "R", "N", "D"]) {
    await page.locator(`[data-set-selector="${position}"]`).click();
    const selector = page.locator('[data-card="automatic-selector"]');
    assert.equal(await selector.locator(".pg-selector-label.is-lit").count(), 1);
    assert.equal(
      await selector
        .locator(`[data-selector-label="${position}"].is-lit`)
        .count(),
      1,
    );
  }

  for (const gear of ["1", "2", "3", "4", "5", "6", "R", "N"]) {
    await page.locator(`[data-set-gear="${gear}"]`).click();
    const shifter = page.locator('[data-card="manual-shifter"]');
    assert.equal(await shifter.locator(".pg-gear-label.is-lit").count(), 1);
    assert.equal(
      await shifter.locator(`[data-gear-label="${gear}"].is-lit`).count(),
      1,
    );
  }

  await page.locator("[data-toggle-light]").click();
  assert.equal(
    await page
      .locator(
        '[data-card="automatic-selector"] .is-lit, [data-card="manual-shifter"] .is-lit',
      )
      .count(),
    0,
  );

  const silhouettes = await page
    .locator(".al-silhouette-frame")
    .evaluateAll((frames) =>
      frames.map((frame) => {
        const rect = frame.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    );
  assert.equal(silhouettes.length, 6);
  assert.ok(
    silhouettes.every(({ width, height }) => width === 40 && height === 40),
    "Le test de silhouette n’est pas rendu à 40",
  );

  const animatedNodesPerElement = await page
    .locator(".al-card .pg-element")
    .evaluateAll((elements) =>
      elements.map(
        (element) =>
          [...element.querySelectorAll("*")].filter(
            (node) => getComputedStyle(node).animationName !== "none",
          ).length,
      ),
    );
  assert.ok(
    animatedNodesPerElement.every((count) => count <= 1),
    "Plus de trois animations lentes dans une scène",
  );

  const componentWidths = await page.evaluate(async () => {
    const { renderDrivingElement } = await import("./elements.js");
    const results = [];
    for (const width of [320, 390, 520]) {
      const host = document.createElement("div");
      host.style.position = "absolute";
      host.style.left = "-200vw";
      host.style.width = `${width}px`;
      host.style.height = `${width}px`;
      host.innerHTML = renderDrivingElement("manual-shifter", {
        state: "active",
        gear: "6",
      });
      document.body.append(host);
      const rect = host.firstElementChild.getBoundingClientRect();
      results.push({
        width,
        renderedWidth: rect.width,
        clientWidth: host.firstElementChild.clientWidth,
        scrollWidth: host.firstElementChild.scrollWidth,
      });
      host.remove();
    }
    return results;
  });
  assert.ok(
    componentWidths.every(
      ({ width, renderedWidth, clientWidth, scrollWidth }) =>
        Math.abs(renderedWidth - width) < 1 && scrollWidth <= clientWidth + 1,
    ),
    `Un composant se casse entre 320 et 520 : ${JSON.stringify(componentWidths)}`,
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionDuration = await page
    .locator(".pg-glass-sweep")
    .first()
    .evaluate((node) => getComputedStyle(node).animationDuration);
  assert.ok(
    reducedMotionDuration === "1e-06s" ||
      reducedMotionDuration === "0.000001s",
    "Le mouvement réduit n’est pas respecté",
  );

  const axe = await new AxeBuilder({ page }).analyze();
  const severeViolations = axe.violations.filter(({ impact }) =>
    ["serious", "critical"].includes(impact),
  );
  assert.deepEqual(severeViolations, []);
  assert.deepEqual(consoleErrors, []);

  if (capturePath) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.screenshot({ path: capturePath, fullPage: true });
  }

  console.log(
    "LOT1_VALIDATION_OK widths=320,390,520 states=4 positions=12 silhouettes=6 axe=0 console=0",
  );
} finally {
  await context.close();
  await browser.close();
}
