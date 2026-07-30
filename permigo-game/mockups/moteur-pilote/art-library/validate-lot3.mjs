import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const url =
  process.env.PILOTE_ART_URL ||
  "http://127.0.0.1:4175/mockups/moteur-pilote/art-library/lot3.html";
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

  assert.equal(await page.locator("[data-card]").count(), 7);
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
  const defaultLit = await page
    .locator(".al-card .pg-element")
    .evaluateAll((elements) => elements.map((element) => element.dataset.lit));
  assert.ok(defaultLit.every((value) => value === "false"));
  assert.equal(
    await page.locator(
      ".al-card .pg-car-lamp.is-lit, .al-card .pg-light-unit.is-lit",
    ).count(),
    0,
  );

  await page.locator("[data-toggle-light]").click();
  const activeLit = await page
    .locator(".al-card .pg-element")
    .evaluateAll((elements) => elements.map((element) => element.dataset.lit));
  assert.ok(activeLit.every((value) => value === "true"));
  assert.ok(
    await page.locator(
      ".al-card .pg-car-lamp.is-lit, .al-card .pg-light-unit.is-lit",
    ).count() >= 8,
    "Les feux pilotables ne sont pas tous allumés",
  );

  for (const wear of [0, 60, 100]) {
    await page.locator("[data-wear-range]").fill(String(wear));
    assert.equal(
      await page
        .locator('[data-card="tyre-wear"] .pg-element')
        .getAttribute("data-wear"),
      String(wear),
    );
  }

  for (const fluid of ["oil", "coolant", "brake", "washer"]) {
    await page.locator(`[data-set-fluid="${fluid}"]`).click();
    const hood = page.locator('[data-card="hood-levels"] .pg-element');
    assert.equal(await hood.getAttribute("data-fluid"), fluid);
    assert.equal(
      await hood.locator(".pg-fluid-container.is-selected").count(),
      1,
    );
    assert.equal(
      await hood.locator(`[data-fluid-vessel="${fluid}"].is-selected`).count(),
      1,
    );
    assert.equal(
      await hood.locator(`[data-fluid-label="${fluid}"].is-selected`).count(),
      1,
    );
  }

  for (const level of [0, 20, 70, 100]) {
    await page.locator("[data-level-range]").fill(String(level));
    assert.equal(
      await page
        .locator('[data-card="hood-levels"] .pg-element')
        .getAttribute("data-level"),
      String(level),
    );
  }

  const silhouettes = await page
    .locator(".al-silhouette-frame")
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
  assert.equal(silhouettes.length, 7);
  assert.ok(
    silhouettes.every(
      ({ width, height }) => width === 40 && height === 40,
    ),
    "Les silhouettes ne sont pas rendues à 40",
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
    const { LOT_THREE_ELEMENTS, renderVehicleElement } = await import(
      "./vehicle-elements.js"
    );
    const results = [];
    for (const type of LOT_THREE_ELEMENTS.map((element) => element.type)) {
      for (const width of [320, 390, 520]) {
        const host = document.createElement("div");
        host.style.position = "absolute";
        host.style.left = "-200vw";
        host.style.width = `${width}px`;
        host.style.height = `${width}px`;
        host.innerHTML = renderVehicleElement(type, {
          state: "active",
          lit: true,
          wear: 80,
          fluid: "coolant",
          level: 20,
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
    "LOT3_VALIDATION_OK widths=320,390,520 states=4 vehicles=7 lights=off/on wear=0..100 fluids=4 levels=0..100 silhouettes=7 axe=0 console=0",
  );
} finally {
  await context.close();
  await browser.close();
}
