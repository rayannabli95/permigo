// La mission du Mode Pilote s'ouvre AVANT les questions, et le code REMC ne
// s'affiche jamais à l'élève.
//
// Le compte de test a 31/31 compétences validées par le moniteur : on répond
// une liste vide sur `validations` pour retrouver l'état « pas encore
// acquise », sinon l'écran de certification est muré.
import { test, expect } from "@playwright/test";
import { ELEVE } from "./_creds.js";
import { REMC } from "../../src/data/remc.js";
import {
  MISSIONS,
  competencesAvecMission,
  missionsPour,
} from "../../src/data/missions-pilote.js";

async function connecte(page) {
  await page.route(/\/rest\/v1\/(self_)?validations/, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        })
      : route.continue(),
  );
  await page.goto("/#/login");
  await page.fill("#lg-email", ELEVE.email);
  await page.fill("#lg-pwd", ELEVE.pwd);
  await page.click("#lg-submit");
  await page.waitForSelector("body.has-chrome", { timeout: 30000 });
}

/** La boîte n'est demandée qu'une fois par compte : l'écran peut ne pas venir. */
async function passeLaBoite(page) {
  const choix = page.locator('[data-boite="manuelle"]');
  if (await choix.isVisible({ timeout: 2500 }).catch(() => false)) {
    await choix.click();
  }
}

async function glisserAuDoigt(page, source, cible) {
  const depart = await source.boundingBox();
  const arrivee = await cible.boundingBox();
  if (!depart || !arrivee) throw new Error("placement hors écran");

  const de = {
    x: depart.x + depart.width / 2,
    y: depart.y + depart.height / 2,
  };
  const vers = {
    x: arrivee.x + arrivee.width / 2,
    y: arrivee.y + arrivee.height / 2,
  };
  const session = await page.context().newCDPSession(page);
  const point = (x, y) => [{ x, y, id: 0, radiusX: 1, radiusY: 1, force: 1 }];

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(de.x, de.y),
  });
  for (let etape = 1; etape <= 4; etape += 1) {
    const avance = etape / 4;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(
        de.x + (vers.x - de.x) * avance,
        de.y + (vers.y - de.y) * avance,
      ),
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

/**
 * Trois vérifications de DONNÉES, sans navigateur.
 *
 * Elles existent à cause de l'audit du 06/08/2026 : les décors dessinés en CSS
 * ont été remplacés par des images sans que personne rejoue les missions, et
 * huit missions sur dix-huit se sont retrouvées avec leurs zones posées sur le
 * tableau de bord au lieu de la route. Rien ne l'avait signalé : une zone mal
 * placée reste cliquable, le build est vert et la mission se valide quand
 * même. Ces trois tests attrapent ce qu'on PEUT attraper sans regarder
 * l'image : une zone hors cadre, deux zones qui se chevauchent, et le départ
 * d'une pièce qui offre la bonne réponse.
 *
 * ⚠️ Ils ne remplacent PAS le fait de rejouer et de REGARDER : aucun test ne
 * sait si une zone tombe sur le bon élément du décor.
 */
test.describe("Mode Pilote — la géométrie des zones", () => {
  const dansLeCadre = (z) =>
    z.x >= 0 && z.y >= 0 && z.x + z.w <= 100 && z.y + z.h <= 100;

  test("aucune zone ne sort de la scène", () => {
    const dehors = [];
    for (const m of MISSIONS) {
      for (const z of m.hotspots || [])
        if (!dansLeCadre(z)) dehors.push(`${m.id} · ${z.id}`);
      for (const s of m.spots || [])
        if (!dansLeCadre(s)) dehors.push(`${m.id} · ${s.id}`);
    }
    expect(dehors, "zones hors cadre").toEqual([]);
  });

  test("deux zones d'une même mission ne se chevauchent jamais", () => {
    // Sinon le clic part sur la première du DOM, pas sur celle qu'on vise.
    const chevauche = (a, b) =>
      a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const collisions = [];
    for (const m of MISSIONS) {
      const zones = m.hotspots || m.spots || [];
      for (let i = 0; i < zones.length; i += 1)
        for (let j = i + 1; j < zones.length; j += 1)
          if (chevauche(zones[i], zones[j]))
            collisions.push(`${m.id} · ${zones[i].id} ↔ ${zones[j].id}`);
    }
    expect(collisions, "zones qui se chevauchent").toEqual([]);
  });

  test("une pièce ne démarre jamais au plus près de la bonne réponse", () => {
    // Au relâché, le placement retombe sur la zone la PLUS PROCHE. Une pièce
    // posée au départ près de la solution se valide donc d'un simple appui,
    // sans rien avoir déplacé.
    const fautes = [];
    for (const m of MISSIONS.filter((x) => x.mode === "placement")) {
      const centre = (s) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
      const d2 = (s) =>
        (centre(s).x - m.piece.departX) ** 2 +
        (centre(s).y - m.piece.departY) ** 2;
      const proche = m.spots.reduce((a, b) => (d2(b) < d2(a) ? b : a));
      if (proche.id === m.solution) fautes.push(`${m.id} → ${proche.id}`);
    }
    expect(fautes, "départ trop près de la solution").toEqual([]);
  });
});

test.describe("Mode Pilote — la mission avant les questions", () => {
  test("la mission de placement existe pour les deux boîtes", () => {
    for (const boite of ["manuelle", "auto"]) {
      expect(missionsPour("C1c", boite).map((mission) => mission.id)).toContain(
        "c1c-siege",
      );
    }
  });

  test("la scène s'ouvre et la bonne zone valide l'étape", async ({ page }) => {
    await connecte(page);
    await page.goto("/#/valider-seul/C1a");
    await page.click("#vs-start-quiz");
    await passeLaBoite(page);

    await expect(page.locator(".mp-scene")).toBeVisible({ timeout: 15000 });
    // Le code REMC est une CLÉ d'entrée, jamais un texte affiché.
    await expect(page.locator(".mp-play")).not.toContainText("C1a");

    await page.click('.mp-hotspot[data-reponse="left-stalk"]');
    await expect(page.locator(".mp-feedback-success")).toBeVisible();
    // Le devoir dans la vraie voiture est la ligne qui fait le pont.
    await expect(page.locator(".mp-transfer")).toBeVisible();
    await expect(page.locator("[data-suite]")).toBeVisible();
  });

  test("le siège se place au doigt sans faire défiler la page", async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.includes("mobile"),
      "le geste tactile est vérifié sur le projet mobile",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await connecte(page);
    await page.goto("/#/valider-seul/C1c");
    await page.click("#vs-start-quiz");
    await passeLaBoite(page);

    const piece = page.locator("[data-placement-piece]");
    const cibleRatee = page.locator('[data-placement-spot="trop-loin"]');
    const cible = page.locator('[data-placement-spot="juste"]');
    await expect(piece).toBeVisible({ timeout: 15000 });
    await expect(cible).toBeVisible();
    await expect(piece).toHaveCSS("touch-action", "none");

    const avant = await page.locator(".mp-host").evaluate((el) => el.scrollTop);
    await glisserAuDoigt(page, piece, cibleRatee);
    await expect(page.locator(".mp-feedback-retry")).toBeVisible();
    await glisserAuDoigt(page, piece, cibleRatee);
    await expect(page.locator(".mp-hint")).toBeVisible();
    await glisserAuDoigt(page, piece, cible);

    await expect(page.locator(".mp-feedback-success")).toBeVisible();
    await expect(page.locator(".mp-transfer")).toBeVisible();
    const apres = await page.locator(".mp-host").evaluate((el) => el.scrollTop);
    expect(apres).toBe(avant);
  });

  test("une compétence sans mission garde le quiz seul", async ({ page }) => {
    // La cible est lue dans les données, jamais écrite en dur : chaque lot de
    // missions couvre de nouvelles compétences, et un code figé ici finit par
    // en désigner une qui a désormais sa mission. C'est ce qui a rendu ce test
    // rouge après le lot du chapitre 1.
    const avecMission = competencesAvecMission();
    const orphelines = REMC.flatMap((w) => w.subs.map((s) => s.c)).filter(
      (c) => !avecMission.includes(c),
    );
    test.skip(
      orphelines.length === 0,
      "toutes les compétences ont désormais leur mission",
    );

    await connecte(page);
    await page.goto(`/#/valider-seul/${orphelines[0]}`);
    await page.click("#vs-start-quiz");
    await passeLaBoite(page);
    await expect(page.locator(".mp-scene")).toHaveCount(0);
  });
});
