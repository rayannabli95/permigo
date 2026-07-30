import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const url =
  process.env.PILOTE_ART_URL ||
  "http://127.0.0.1:4175/mockups/moteur-pilote/art-library/lot2.html";
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

  assert.equal(await page.locator("[data-card]").count(), 3);
  assert.equal(
    await page
      .locator('[data-card="warning-lights"] [data-warning-cell]')
      .count(),
    12,
  );
  assert.equal(await page.locator(".al-warning-silhouette").count(), 12);
  assert.equal(await page.locator("svg text").count(), 0);
  assert.equal(await page.locator("img").count(), 0);
  assert.equal(await page.locator(".pg-element button").count(), 0);

  const touchTargets = await page
    .locator("button, input[type=range]")
    .evaluateAll((targets) =>
      targets.map((target) => {
        const rect = target.getBoundingClientRect();
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

  await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(
    await page
      .locator('[data-card="instrument-cluster"] .pg-cluster-warning.is-lit')
      .count(),
    0,
  );
  assert.equal(
    await page
      .locator('[data-card="warning-lights"] .pg-warning-cell.is-lit')
      .count(),
    0,
  );

  const warningIds = await page.locator("[data-set-warning]").evaluateAll(
    (buttons) => buttons.map((button) => button.dataset.setWarning),
  );
  assert.equal(warningIds.length, 12);

  for (const warning of warningIds) {
    await page.locator(`[data-set-warning="${warning}"]`).click();
    const cluster = page.locator('[data-card="instrument-cluster"]');
    const board = page.locator('[data-card="warning-lights"]');
    assert.equal(await cluster.locator(".pg-cluster-warning.is-lit").count(), 1);
    assert.equal(
      await cluster
        .locator(`[data-cluster-warning="${warning}"].is-lit`)
        .count(),
      1,
    );
    assert.equal(await board.locator(".pg-warning-cell.is-lit").count(), 1);
    assert.equal(
      await board.locator(`[data-warning-cell="${warning}"].is-lit`).count(),
      1,
    );
  }

  await page.locator("[data-toggle-light]").click();
  assert.equal(
    await page
      .locator(
        '[data-card="instrument-cluster"] .pg-cluster-warning.is-lit, [data-card="warning-lights"] .pg-warning-cell.is-lit',
      )
      .count(),
    0,
  );

  for (const rpm of [0, 2000, 6500, 8000]) {
    await page.locator("[data-rpm-range]").fill(String(rpm));
    const values = await page
      .locator(
        '[data-card="instrument-cluster"] .pg-element, [data-card="tachometer"] .pg-element',
      )
      .evaluateAll((elements) =>
        elements.map((element) => Number(element.dataset.rpm)),
      );
    assert.deepEqual(values, [rpm, rpm]);
  }

  const familySilhouettes = await page
    .locator(".al-silhouette-frame")
    .evaluateAll((frames) =>
      frames.map((frame) => {
        const rect = frame.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    );
  assert.equal(familySilhouettes.length, 3);
  assert.ok(
    familySilhouettes.every(
      ({ width, height }) => width === 40 && height === 40,
    ),
    "Les silhouettes des familles ne sont pas rendues à 40",
  );

  const warningSilhouettes = await page
    .locator(".al-warning-silhouette > div")
    .evaluateAll((frames) =>
      frames.map((frame) => {
        const rect = frame.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          background: getComputedStyle(frame).backgroundColor,
        };
      }),
    );
  assert.equal(warningSilhouettes.length, 12);
  assert.ok(
    warningSilhouettes.every(
      ({ width, height }) => width === 40 && height === 40,
    ),
    "Les voyants individuels ne sont pas rendus à 40",
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
    const { LOT_TWO_ELEMENTS, renderDashboardElement } = await import(
      "./dashboard-elements.js"
    );
    const results = [];
    for (const type of LOT_TWO_ELEMENTS.map((element) => element.type)) {
      for (const width of [320, 390, 520]) {
        const host = document.createElement("div");
        host.style.position = "absolute";
        host.style.left = "-200vw";
        host.style.width = `${width}px`;
        host.style.height = `${width}px`;
        host.innerHTML = renderDashboardElement(type, {
          state: "active",
          warning: "oil",
          rpm: 6500,
        });
        document.body.append(host);
        const element = host.firstElementChild;
        const rect = element.getBoundingClientRect();
        results.push({
          type,
          width,
          renderedWidth: rect.width,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        });
        host.remove();
      }
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
    "LOT2_VALIDATION_OK widths=320,390,520 states=4 warnings=12 rpm=0..8000 silhouettes=15 axe=0 console=0",
  );
} finally {
  await context.close();
  await browser.close();
}
