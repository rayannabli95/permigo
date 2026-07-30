import {
  ART_MATERIALS,
  ART_PALETTE,
  ELEMENT_STATES,
  LOT_ONE_ELEMENTS,
  renderDrivingElement,
} from "./elements.js";

const root = document.querySelector("#art-library");

const ui = {
  state: "idle",
  lit: true,
  selectorPosition: "D",
  gear: "1",
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

function renderPositionButtons(values, selected, attribute) {
  return values.map((value) => `
    <button
      class="al-position-button ${selected === value ? "is-selected" : ""}"
      type="button"
      ${attribute}="${value}"
      aria-pressed="${selected === value}"
    >${value}</button>`).join("");
}

function elementOptions(type, silhouette = false) {
  const options = {
    state: ui.state,
    silhouette,
    lit: ui.lit,
  };
  if (type === "automatic-selector") options.position = ui.selectorPosition;
  if (type === "manual-shifter") options.gear = ui.gear;
  return options;
}

function renderCard(element) {
  return `
    <article class="al-card" data-card="${element.type}">
      <header class="al-card-header">
        <span>${String(element.number).padStart(2, "0")}</span>
        <div>
          <h2>${element.title}</h2>
          <p>${element.shortTitle}</p>
        </div>
      </header>
      <div class="al-element-slot">
        ${renderDrivingElement(element.type, elementOptions(element.type))}
      </div>
    </article>`;
}

function renderSilhouette(element) {
  return `
    <div class="al-silhouette-item">
      <span>${String(element.number).padStart(2, "0")}</span>
      <div class="al-silhouette-frame">
        ${renderDrivingElement(element.type, elementOptions(element.type, true))}
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

function appTemplate() {
  return `
    <div class="al-shell">
      <header class="al-hero">
        <a class="al-back" href="../" aria-label="Retour au Mode Pilote">←</a>
        <div>
          <p>Bibliothèque graphique · Lot 1</p>
          <h1>Les pieds et la boîte</h1>
          <span>6 éléments · SVG pilotable · 390</span>
        </div>
        <span class="al-lot-badge">L1</span>
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
            Éclairage
          </button>
        </div>
        <div class="al-state-row" role="group" aria-label="État des éléments">
          ${renderStateButtons()}
        </div>
        <div class="al-position-controls">
          <div>
            <span>Sélecteur</span>
            <div role="group" aria-label="Position du sélecteur automatique">
              ${renderPositionButtons(["P", "R", "N", "D"], ui.selectorPosition, "data-set-selector")}
            </div>
          </div>
          <div>
            <span>Rapport</span>
            <div role="group" aria-label="Rapport de la boîte manuelle">
              ${renderPositionButtons(["1", "2", "3", "4", "5", "6", "R", "N"], ui.gear, "data-set-gear")}
            </div>
          </div>
        </div>
      </section>

      <section class="al-board" aria-label="Planche de contact du lot 1">
        ${LOT_ONE_ELEMENTS.map(renderCard).join("")}
      </section>

      <section class="al-silhouette-test" aria-labelledby="silhouette-title">
        <div class="al-section-heading">
          <div>
            <p>Contrôle qualité</p>
            <h2 id="silhouette-title">Silhouettes à 40</h2>
          </div>
          <span>6 / 6 lisibles</span>
        </div>
        <div class="al-silhouette-row">
          ${LOT_ONE_ELEMENTS.map(renderSilhouette).join("")}
        </div>
      </section>

      <section class="al-recipes" aria-labelledby="recipes-title">
        <div class="al-section-heading">
          <div>
            <p>Bible matière</p>
            <h2 id="recipes-title">4 recettes partagées</h2>
          </div>
          <span>3 valeurs chacune</span>
        </div>
        <div class="al-material-grid">
          ${renderMaterials()}
        </div>
      </section>

      <footer class="al-footer">
        <span aria-hidden="true"></span>
        <p>Lot 1 prêt pour validation à l’écran. Aucun élément du lot 2 inclus.</p>
      </footer>
    </div>`;
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

  root.querySelectorAll("[data-set-selector]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.selectorPosition = button.dataset.setSelector;
      ui.lit = true;
      render();
    });
  });

  root.querySelectorAll("[data-set-gear]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.gear = button.dataset.setGear;
      ui.lit = true;
      render();
    });
  });
}

document.documentElement.style.setProperty("--al-night", ART_PALETTE.night);
render();
