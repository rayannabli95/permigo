import {
  ART_MATERIALS,
  ART_PALETTE,
  ELEMENT_STATES,
} from "./art-core.js";
import {
  LOT_THREE_ELEMENTS,
  VEHICLE_FLUIDS,
  renderVehicleElement,
} from "./vehicle-elements.js";

const root = document.querySelector("#art-library");

const ui = {
  state: "idle",
  lit: false,
  wear: 20,
  fluid: "oil",
  level: 70,
};

const stateLabels = {
  idle: "Repos",
  active: "Actif",
  found: "Trouvé",
  error: "Erreur",
};

const materialLabels = {
  matte: "Plastique mat",
  gloss: "Plastique brillant",
  glass: "Verre",
  metal: "Métal",
};

function renderStateButtons() {
  return ELEMENT_STATES.map((state) => `
    <button
      class="al-state-button ${ui.state === state ? "is-selected" : ""}"
      type="button"
      data-set-state="${state}"
      aria-pressed="${ui.state === state}"
    >
      <span aria-hidden="true"></span>
      ${stateLabels[state]}
    </button>`).join("");
}

function renderFluidButtons() {
  return VEHICLE_FLUIDS.map((fluid) => `
    <button
      class="al-fluid-button ${ui.fluid === fluid.id ? "is-selected" : ""}"
      type="button"
      data-set-fluid="${fluid.id}"
      aria-pressed="${ui.fluid === fluid.id}"
      style="--fluid-tone:${fluid.tone}"
    >
      <span aria-hidden="true"></span>
      ${fluid.shortLabel}
    </button>`).join("");
}

function elementOptions(silhouette = false) {
  return {
    state: ui.state,
    silhouette,
    lit: ui.lit,
    wear: ui.wear,
    fluid: ui.fluid,
    level: ui.level,
  };
}

function slotClass(type) {
  if (type === "hood-levels") return "al-element-slot-hood";
  if (type === "tyre-wear") return "al-element-slot-tyre";
  return "al-element-slot-vehicle";
}

function renderCard(element) {
  return `
    <article
      class="al-card al-card-vehicle ${element.type === "hood-levels" ? "is-wide" : ""}"
      data-card="${element.type}"
    >
      <header class="al-card-header">
        <span>${String(element.number).padStart(2, "0")}</span>
        <div>
          <h2>${element.title}</h2>
          <p>${element.shortTitle}</p>
        </div>
      </header>
      <div class="al-element-slot ${slotClass(element.type)}">
        ${renderVehicleElement(element.type, elementOptions())}
      </div>
    </article>`;
}

function renderElementSilhouette(element) {
  return `
    <div class="al-silhouette-item">
      <span>${String(element.number).padStart(2, "0")}</span>
      <div class="al-silhouette-frame">
        ${renderVehicleElement(element.type, elementOptions(true))}
      </div>
    </div>`;
}

function renderMaterials() {
  return Object.entries(ART_MATERIALS).map(([key, recipe]) => `
    <div class="al-material">
      <span class="al-material-sample al-material-${key}" aria-hidden="true"></span>
      <strong>${materialLabels[key]}</strong>
      <small>${recipe.base} · ${recipe.middle} · ${recipe.light}</small>
    </div>`).join("");
}

function boardTemplate() {
  return LOT_THREE_ELEMENTS.map(renderCard).join("");
}

function appTemplate() {
  const fluid = VEHICLE_FLUIDS.find((item) => item.id === ui.fluid);
  return `
    <div class="al-shell">
      <header class="al-hero">
        <a class="al-back" href="./lot2.html" aria-label="Voir le lot 2">←</a>
        <div>
          <p>Bibliothèque graphique · Lot 3</p>
          <h1>Le véhicule</h1>
          <span>7 éléments · vues et contrôles · SVG pilotable · 390</span>
        </div>
        <span class="al-lot-badge">L3</span>
      </header>

      <section class="al-controls" aria-labelledby="state-title">
        <div class="al-control-heading">
          <div>
            <p>État global</p>
            <h2 id="state-title">${stateLabels[ui.state]}</h2>
          </div>
          <button
            class="al-light-button ${ui.lit ? "is-selected" : ""}"
            type="button"
            data-toggle-light
            aria-pressed="${ui.lit}"
          >
            <span aria-hidden="true"></span>
            ${ui.lit ? "Feux allumés" : "Feux éteints"}
          </button>
        </div>
        <div class="al-state-row" role="group" aria-label="État des éléments">
          ${renderStateButtons()}
        </div>

        <div class="al-vehicle-controls">
          <label class="al-rpm-control al-wear-control">
            <span>
              <span>Usure du pneu</span>
              <strong data-wear-output>${ui.wear}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value="${ui.wear}"
              data-wear-range
              aria-label="Usure du pneu de 0 à 100 pour cent"
            />
            <span class="al-rpm-scale" aria-hidden="true"><i>Neuf</i><i>Témoin</i><i>Usé</i></span>
          </label>

          <div class="al-dashboard-control-title">
            <span>Fluide observé</span>
            <strong>${fluid.label}</strong>
          </div>
          <div class="al-fluid-buttons" role="group" aria-label="Fluide à observer">
            ${renderFluidButtons()}
          </div>

          <label class="al-rpm-control al-level-control">
            <span>
              <span>Niveau du fluide</span>
              <strong data-level-output>${ui.level}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value="${ui.level}"
              data-level-range
              aria-label="Niveau du fluide de 0 à 100 pour cent"
            />
            <span class="al-rpm-scale" aria-hidden="true"><i>Bas</i><i>Milieu</i><i>Plein</i></span>
          </label>
        </div>
      </section>

      <section
        class="al-board al-vehicle-board"
        data-vehicle-board
        aria-label="Planche de contact du lot 3"
      >
        ${boardTemplate()}
      </section>

      <section class="al-silhouette-test" aria-labelledby="silhouette-title">
        <div class="al-section-heading">
          <div>
            <p>Contrôle qualité</p>
            <h2 id="silhouette-title">Éléments à 40</h2>
          </div>
          <span>7 / 7 lisibles</span>
        </div>
        <div class="al-silhouette-row al-silhouette-row-lot3">
          ${LOT_THREE_ELEMENTS.map(renderElementSilhouette).join("")}
        </div>
      </section>

      <section class="al-recipes" aria-labelledby="recipes-title">
        <div class="al-section-heading">
          <div>
            <p>Bible matière partagée</p>
            <h2 id="recipes-title">4 recettes, toujours</h2>
          </div>
          <span>3 valeurs chacune</span>
        </div>
        <div class="al-material-grid">
          ${renderMaterials()}
        </div>
      </section>

      <footer class="al-footer">
        <span aria-hidden="true"></span>
        <p>Lot 3 prêt pour validation à l’écran. Aucun élément du lot 4 inclus.</p>
      </footer>
    </div>`;
}

function refreshBoard() {
  const board = root.querySelector("[data-vehicle-board]");
  if (board) board.innerHTML = boardTemplate();
}

function render() {
  root.innerHTML = appTemplate();
  wire();
}

function wire() {
  root.querySelectorAll("[data-set-state]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.state = button.dataset.setState;
      render();
    });
  });

  root.querySelector("[data-toggle-light]")?.addEventListener("click", () => {
    ui.lit = !ui.lit;
    render();
  });

  root.querySelectorAll("[data-set-fluid]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.fluid = button.dataset.setFluid;
      render();
    });
  });

  root.querySelector("[data-wear-range]")?.addEventListener("input", (event) => {
    ui.wear = Number(event.currentTarget.value);
    const output = root.querySelector("[data-wear-output]");
    if (output) output.textContent = `${ui.wear}%`;
    refreshBoard();
  });

  root.querySelector("[data-level-range]")?.addEventListener("input", (event) => {
    ui.level = Number(event.currentTarget.value);
    const output = root.querySelector("[data-level-output]");
    if (output) output.textContent = `${ui.level}%`;
    refreshBoard();
  });
}

document.documentElement.style.setProperty("--al-night", ART_PALETTE.night);
render();
