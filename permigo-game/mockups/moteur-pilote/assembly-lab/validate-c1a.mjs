/**
 * Preuves automatiques de la mission pilote C1a.
 *
 * Lancer un serveur statique depuis `permigo-game/`, puis :
 *   PILOTE_C1A_CAPTURE=/tmp/c1a.png \
 *     node mockups/moteur-pilote/assembly-lab/validate-c1a.mjs
 */

import assert from "node:assert/strict";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

import { validateMission, MissionSchemaError } from "../assembly/mission-schema.js";
import { resolveMission } from "../assembly/mission-resolver.js";
import { C1A_INSPECTION_360 } from "../assembly/missions/c1a-inspection-360.js";
import { LOT_ONE_ELEMENTS } from "../art-library/elements.js";
import { LOT_TWO_ELEMENTS } from "../art-library/dashboard-elements.js";
import { LOT_THREE_ELEMENTS } from "../art-library/vehicle-elements.js";

const url =
  process.env.PILOTE_C1A_URL ||
  "http://127.0.0.1:4181/mockups/moteur-pilote/assembly-lab/c1a.html";
const capturePath = process.env.PILOTE_C1A_CAPTURE || "";

/* ─────────────────────────────  1. la donnée  ───────────────────────────── */

validateMission(C1A_INSPECTION_360);

// Les types employés existent vraiment dans la bibliothèque.
const TYPES_CONNUS = new Set(
  [...LOT_ONE_ELEMENTS, ...LOT_TWO_ELEMENTS, ...LOT_THREE_ELEMENTS].map(
    (element) => element.type,
  ),
);
C1A_INSPECTION_360.beats.forEach((beat) => {
  beat.assets.forEach((asset) => {
    if (asset.family === "photo") return; // une photo n'est pas un dessin
    assert.ok(
      TYPES_CONNUS.has(asset.type),
      `Objet inconnu de la bibliothèque : ${asset.type}`,
    );
  });
});

// Les photos référencées existent vraiment sur le disque.
{
  const { access } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const dossier = fileURLToPath(new URL("../photos/", import.meta.url));
  for (const beat of C1A_INSPECTION_360.beats) {
    for (const asset of beat.assets) {
      if (asset.family !== "photo") continue;
      await access(`${dossier}${asset.type}.webp`).catch(() => {
        throw new Error(`Photo manquante : ${asset.type}.webp`);
      });
    }
  }
}

// Le schéma refuse bien une mission qui promet une certification.
assert.throws(
  () =>
    validateMission({
      ...C1A_INSPECTION_360,
      outcome: { ...C1A_INSPECTION_360.outcome, body: "Compétence validée." },
    }),
  MissionSchemaError,
  "Le schéma laisse passer une promesse de certification",
);

// … et une solution qui ne correspond à aucune réponse.
assert.throws(
  () =>
    validateMission({
      ...C1A_INSPECTION_360,
      beats: C1A_INSPECTION_360.beats.map((beat, i) =>
        i === 0 ? { ...beat, solution: "inexistant" } : beat,
      ),
    }),
  MissionSchemaError,
  "Le schéma laisse passer une solution fantôme",
);

/* ──────────────────  2. la résolution des deux boîtes  ─────────────────── */

const manuelle = resolveMission(C1A_INSPECTION_360, "manual");
const automatique = resolveMission(C1A_INSPECTION_360, "automatic");

assert.equal(manuelle.beats.length, 4);
assert.deepEqual(
  { ...manuelle, transmission: null },
  { ...automatique, transmission: null },
  "C1a est un contrôle à l'arrêt : les deux boîtes doivent donner la même chose",
);
assert.ok(!("variants" in manuelle), "La mission résolue ne porte plus de surcharge");
assert.ok(
  !JSON.stringify(C1A_INSPECTION_360).includes('"transmission"'),
  "La donnée source ne doit pas être modifiée par la résolution",
);

// Le mécanisme de surcharge, lui, est prouvé sur une mission d'essai : c'est
// lui qui portera C1d et C1f, où les gestes diffèrent vraiment.
const ESSAI = {
  ...C1A_INSPECTION_360,
  id: "essai-surcharge",
  variants: {
    automatic: {
      beats: [
        {
          id: "dashboard-alert",
          prompt: "Sélecteur sur P, contact mis : ce voyant reste allumé.",
        },
      ],
    },
  },
};
const essaiManuel = resolveMission(ESSAI, "manual");
const essaiAuto = resolveMission(ESSAI, "automatic");
assert.equal(essaiManuel.beats[0].prompt, C1A_INSPECTION_360.beats[0].prompt);
assert.equal(
  essaiAuto.beats[0].prompt,
  "Sélecteur sur P, contact mis : ce voyant reste allumé.",
);
assert.equal(
  essaiAuto.beats[0].solution,
  C1A_INSPECTION_360.beats[0].solution,
  "La surcharge ne doit pas effacer le reste du temps de jeu",
);
assert.equal(essaiAuto.beats.length, 4, "La surcharge ne duplique pas la mission");
assert.throws(
  () =>
    resolveMission(
      { ...ESSAI, variants: { automatic: { beats: [{ id: "fantome" }] } } },
      "automatic",
    ),
  /absents de la base/,
  "Une surcharge doit viser un temps de jeu existant",
);

/* ───────────────────────────  3. à l'écran  ─────────────────────────────── */

const navigateur = await chromium.launch();
const erreurs = [];

async function nouvelOnglet(width) {
  // axe-core exige un contexte explicite, pas un onglet créé à la volée.
  const contexte = await navigateur.newContext({ viewport: { width, height: 900 } });
  const page = await contexte.newPage();
  page.on("pageerror", (e) => erreurs.push(`${width}px · ${e}`));
  page.on("console", (m) => {
    if (m.type() === "error") erreurs.push(`${width}px · ${m.text()}`);
  });
  await page.goto(url, { waitUntil: "networkidle" });
  return page;
}

async function debordement(page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

// 3a — les trois largeurs, du brief à la sortie.
for (const width of [320, 390, 520]) {
  const page = await nouvelOnglet(width);
  assert.equal(await debordement(page), 0, `Débordement horizontal à ${width}px`);

  await page.click("[data-action=commencer]");
  for (const beat of manuelle.beats) {
    assert.equal(
      await page.locator(`.mp-beat[data-beat="${beat.id}"]`).count(),
      1,
      `Temps « ${beat.id} » absent à ${width}px`,
    );
    assert.equal(
      await debordement(page),
      0,
      `Débordement sur « ${beat.id} » à ${width}px`,
    );

    // 3b — aucune réponse ne recouvre un objet de la scène.
    const chevauche = await page.evaluate(() => {
      const objets = [...document.querySelectorAll(".mp-asset")].map((n) =>
        n.getBoundingClientRect(),
      );
      return [...document.querySelectorAll(".mp-answer")].some((bouton) => {
        const r = bouton.getBoundingClientRect();
        return objets.some(
          (o) => r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top,
        );
      });
    });
    assert.equal(chevauche, false, `Une réponse recouvre un objet sur « ${beat.id} »`);

    // 3b bis — les pastilles posées sur la photo ne se chevauchent pas et
    // restent dans le cadre : une réponse hors cadre est une réponse perdue.
    if (beat.answers.kind === "hotspot") {
      const probleme = await page.evaluate(() => {
        const cadre = document.querySelector(".mp-stage").getBoundingClientRect();
        const pastilles = [...document.querySelectorAll(".mp-hotspot")].map((n) =>
          n.getBoundingClientRect(),
        );
        const dehors = pastilles.some(
          (r) =>
            r.left < cadre.left - 1 ||
            r.right > cadre.right + 1 ||
            r.top < cadre.top - 1 ||
            r.bottom > cadre.bottom + 1,
        );
        let collees = false;
        for (let i = 0; i < pastilles.length; i += 1) {
          for (let j = i + 1; j < pastilles.length; j += 1) {
            const a = pastilles[i];
            const b = pastilles[j];
            if (
              a.left < b.right && a.right > b.left &&
              a.top < b.bottom && a.bottom > b.top
            ) collees = true;
          }
        }
        return { dehors, collees, nombre: pastilles.length };
      });
      assert.equal(probleme.dehors, false, `Pastille hors cadre sur « ${beat.id} » à ${width}px`);
      assert.equal(probleme.collees, false, `Deux pastilles se chevauchent sur « ${beat.id} » à ${width}px`);
      assert.equal(
        probleme.nombre,
        beat.answers.options.length,
        `Pastilles manquantes sur « ${beat.id} »`,
      );
    }

    // 3c — toutes les cibles font au moins 44 px.
    const tropPetit = await page.evaluate(() => {
      // La barre du bac à sable n'appartient pas à la mission.
      const cibles = [...document.querySelectorAll(".mp-beat button")];
      return cibles
        .filter((b) => b.offsetParent !== null)
        .filter((b) => {
          const r = b.getBoundingClientRect();
          return r.height < 43.5 || r.width < 43.5;
        }).length;
    });
    assert.equal(tropPetit, 0, `Cible sous 44 px sur « ${beat.id} » à ${width}px`);

    await page.click(`[data-answer="${beat.solution}"]`);
    await page.click("[data-action=suivant]");
  }
  assert.equal(await page.locator(".mp-outcome").count(), 1, `Sortie absente à ${width}px`);
  assert.equal(await debordement(page), 0, `Débordement sur la sortie à ${width}px`);
  await page.close();
}

// 3d — nouvel essai, indice automatique après deux hésitations, réussite.
{
  const page = await nouvelOnglet(390);
  await page.click("[data-action=commencer]");
  const beat = manuelle.beats[0];
  const faux = beat.answers.options
    .map((o) => o.id)
    .filter((id) => id !== beat.solution);

  await page.click(`[data-answer="${faux[0]}"]`);
  assert.equal(
    await page.locator(".mp-hint").count(),
    0,
    "L'indice ne doit pas surgir dès la première hésitation",
  );
  assert.equal(
    (await page.locator(".mp-feedback").textContent()).trim(),
    beat.retry,
    "Une réponse à consolider doit expliquer où regarder",
  );
  assert.equal(
    await page.locator("[data-action=suivant]").isDisabled(),
    true,
    "On ne passe pas au temps suivant sans avoir trouvé",
  );

  await page.click(`[data-answer="${faux[1]}"]`);
  assert.equal(
    await page.locator(".mp-hint").count(),
    1,
    "L'indice doit apparaître après deux hésitations",
  );

  await page.click(`[data-answer="${beat.solution}"]`);
  const retour = (await page.locator(".mp-feedback").textContent()).trim();
  assert.ok(retour.includes(beat.why), "Le pourquoi doit précéder la sortie du temps");
  assert.equal(await page.locator("[data-action=suivant]").isDisabled(), false);
  await page.close();
}

// 3e — l'indice est demandable avant toute erreur.
{
  const page = await nouvelOnglet(390);
  await page.click("[data-action=commencer]");
  await page.click("[data-action=indice]");
  assert.equal(await page.locator(".mp-hint").count(), 1, "Indice non demandable");
  await page.close();
}

// 3f — clavier seul, du brief à la première réponse.
{
  const page = await nouvelOnglet(390);
  // On tabule jusqu'au bouton de départ : compter les tabulations casserait
  // le contrôle au premier changement de barre.
  let tabulations = 0;
  while (tabulations < 12) {
    await page.keyboard.press("Tab");
    tabulations += 1;
    const surLeDepart = await page.evaluate(
      () => document.activeElement?.dataset?.action === "commencer",
    );
    if (surLeDepart) break;
  }
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".mp-beat").count(), 1, "Le brief ne se passe pas au clavier");
  const atteignables = await page.evaluate(() =>
    [...document.querySelectorAll(".mp-answer")].every(
      (b) => b.tabIndex >= 0 && !b.disabled,
    ),
  );
  assert.ok(atteignables, "Les réponses ne sont pas atteignables au clavier");
  await page.close();
}

// 3g — mouvement réduit : aucune transition ne subsiste sur les commandes.
{
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await contexte.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.click("[data-action=commencer]");
  const transitions = await page.evaluate(() =>
    [...document.querySelectorAll(".mp-next, .mp-answer")].map((n) =>
      Number.parseFloat(getComputedStyle(n).transitionDuration),
    ),
  );
  assert.ok(
    transitions.every((duree) => duree < 0.01),
    `Transitions encore actives en mouvement réduit : ${transitions.join(", ")}`,
  );

  // Le navigateur de test force lui-même les durées à zéro : on vérifie donc
  // aussi que la feuille de style porte bien sa propre règle.
  const regleExiste = await page.evaluate(() =>
    [...document.styleSheets].some((feuille) => {
      try {
        return [...feuille.cssRules].some(
          (regle) =>
            regle.conditionText?.includes("prefers-reduced-motion") &&
            [...regle.cssRules].length > 0,
        );
      } catch {
        return false;
      }
    }),
  );
  assert.ok(regleExiste, "Aucune règle prefers-reduced-motion dans la feuille de style");
  await page.close();
}

// 3h — accessibilité et capture des quatre temps + la sortie.
{
  const page = await nouvelOnglet(390);
  const vues = [];
  vues.push(await page.screenshot({ fullPage: true }));
  await page.click("[data-action=commencer]");
  for (const beat of manuelle.beats) {
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serieuses = axe.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact),
    );
    assert.equal(
      serieuses.length,
      0,
      `Accessibilité sur « ${beat.id} » : ${serieuses.map((v) => v.id).join(", ")}`,
    );
    vues.push(await page.screenshot({ fullPage: true }));
    await page.click(`[data-answer="${beat.solution}"]`);
    await page.click("[data-action=suivant]");
  }
  vues.push(await page.screenshot({ fullPage: true }));

  if (capturePath) {
    // Planche unique, montée dans le navigateur : pas de dépendance en plus.
    const planche = await page.evaluate(async (sources) => {
      const images = await Promise.all(
        sources.map(
          (src) =>
            new Promise((ok) => {
              const img = new Image();
              img.onload = () => ok(img);
              img.src = src;
            }),
        ),
      );
      const marge = 16;
      const largeur = Math.max(...images.map((i) => i.width));
      const hauteur = Math.max(...images.map((i) => i.height));
      const toile = document.createElement("canvas");
      toile.width = (largeur + marge) * images.length + marge;
      toile.height = hauteur + marge * 2;
      const ctx = toile.getContext("2d");
      ctx.fillStyle = "#0c071a";
      ctx.fillRect(0, 0, toile.width, toile.height);
      images.forEach((img, i) => {
        ctx.drawImage(img, marge + (largeur + marge) * i, marge);
      });
      return toile.toDataURL("image/png");
    }, vues.map((v) => `data:image/png;base64,${v.toString("base64")}`));

    const { writeFile } = await import("node:fs/promises");
    await writeFile(capturePath, Buffer.from(planche.split(",")[1], "base64"));
  }
  await page.close();
}

await navigateur.close();

assert.deepEqual(erreurs, [], `Erreurs console : ${erreurs.join(" | ")}`);

console.log(
  `C1A_VALIDATION_OK beats=${manuelle.beats.length} boîtes=manual,automatic ` +
    `largeurs=320,390,520 indice=demandé+2hésitations recouvrement=0 ` +
    `cibles>=44px axe=0 console=0`,
);
