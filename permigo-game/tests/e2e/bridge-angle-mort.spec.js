import { expect, test } from "@playwright/test";

function trackRemoteRequests(page) {
  const remoteRequests = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
      remoteRequests.push(request.url());
    }
  });

  return remoteRequests;
}

test.describe("PermiGo Bridge Lab — angle mort", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("parcourt les six écrans sans requête distante", async ({ page }) => {
    const remoteRequests = trackRemoteRequests(page);

    await page.goto("/lab/bridge-angle-mort");

    await expect(page.locator('[data-screen="intro"]')).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Contrôler les rétroviseurs et l’angle mort",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Commencer" }).click();

    await expect(page.locator('[data-screen="observation"]')).toBeVisible();
    for (const zone of [
      "Rétroviseur intérieur",
      "Rétroviseur extérieur",
      "Angle mort",
    ]) {
      await page.getByRole("button", { name: zone }).click();
    }
    await page.getByRole("button", { name: "Je suis prêt" }).click();

    await expect(page.locator('[data-screen="action"]')).toBeVisible();
    await page.getByRole("button", { name: "Angle mort" }).click();
    await expect(
      page.getByText("Commence par regarder ce qui se passe derrière toi."),
    ).toBeVisible();
    await expect(page.locator(".bridge-feedback")).not.toContainText(
      "mauvaise réponse",
    );

    await page.getByRole("button", { name: "Rétroviseur intérieur" }).click();
    await page.getByRole("button", { name: "Rétroviseur extérieur" }).click();
    await page.getByRole("button", { name: "Angle mort" }).click();
    await expect(page.getByText("Le geste est complet.")).toBeVisible();
    await page.getByRole("button", { name: "Comprendre le geste" }).click();

    await expect(page.locator('[data-screen="explanation"]')).toBeVisible();
    await expect(
      page.getByText(
        "Avant de changer de direction, vérifie les rétroviseurs puis regarde brièvement derrière ton épaule.",
      ),
    ).toHaveCount(2);
    await page.getByRole("button", { name: "Continuer" }).click();

    await expect(page.locator('[data-screen="phrase"]')).toBeVisible();
    await expect(
      page.getByText("« Contrôle ton angle mort. »"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Écouter", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Réécouter" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Terminer" }).click();

    await expect(page.locator('[data-screen="success"]')).toBeVisible();
    await expect(
      page.getByText(
        "Tu reconnaîtras maintenant cette consigne dans la voiture.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Prêt pour ta leçon" }),
    ).toBeVisible();
    expect(remoteRequests).toEqual([]);
  });

  test("conserve le sens physique de la scène en arabe", async ({ page }) => {
    const remoteRequests = trackRemoteRequests(page);

    await page.goto("/lab/bridge-angle-mort");
    await page.getByRole("button", { name: "Français" }).click();
    await page.getByRole("button", { name: "Commencer" }).click();

    const mirrorBefore = await page
      .locator('[data-observe-zone="interiorMirror"]')
      .boundingBox();
    const exteriorBefore = await page
      .locator('[data-observe-zone="exteriorMirror"]')
      .boundingBox();

    await page.getByRole("button", { name: "العربية" }).press("Enter");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(
      page.getByText("اضغط على المناطق بالترتيب الصحيح"),
    ).toHaveAttribute("dir", "rtl");

    const mirrorAfter = await page
      .locator('[data-observe-zone="interiorMirror"]')
      .boundingBox();
    const exteriorAfter = await page
      .locator('[data-observe-zone="exteriorMirror"]')
      .boundingBox();

    expect(mirrorAfter?.x).toBe(mirrorBefore?.x);
    expect(exteriorAfter?.x).toBe(exteriorBefore?.x);
    expect(remoteRequests).toEqual([]);
  });

  test("garde les cibles tactiles à 44 px minimum", async ({ page }) => {
    await page.goto("/lab/bridge-angle-mort");
    await page.getByRole("button", { name: "Commencer" }).click();

    const sizes = await page
      .locator("button:visible")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );

    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("la page principale Vite reste servie", async ({ request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toContain("/src/main.js");
  });
});
