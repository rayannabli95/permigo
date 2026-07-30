import {
  ART_MATERIALS,
  ART_PALETTE,
  ELEMENT_STATES,
} from "./art-core.js";
import {
  DASHBOARD_WARNINGS,
  LOT_TWO_ELEMENTS,
  renderDashboardElement,
  renderWarningIcon,
} from "./dashboard-elements.js";

const root = document.querySelector("#art-library");

const ui = {
  state: "idle",
  lit: false,
  warning: "engine",
  rpm: 0,
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

function renderWarningButtons() {
  return DASHBOARD_WARNINGS.map((warning) => `
    <button
      class="al-warning-button ${ui.lit && ui.warning === warning.id ? "is-selected" : ""}"
      type="button"
      data-set-warning="${warning.id}"
      aria-pressed="${ui.lit && ui.warning === warning.id}"
      style="--warning-tone:${warning.tone}"
    >
      <span aria-hidden="true"></span>
      ${warning.shortLabel || warning.label}
    </button>`).join("");
}

function elementOptions(silhouette = false) {
  return {
    state: ui.state,
    silhouette,
    lit: ui.lit,
    warning: ui.warning,
    rpm: ui.rpm,
  };
}

function renderCard(element) {
  const slotClass = element.type === "instrument-cluster"
    ? "al-element-slot-cluster"
    : element.type === "warning-lights"
      ? "al-element-slot-warnings"
      : "al-element-slot-tachometer";
  return `
    <article class="al-card al-card-dashboard" data-card="${element.type}">
      <header class="al-card-header">
        <span>${String(element.number).padStart(2, "0")}</span>
        <div>
          <h2>${element.title}</h2>
          <p>${element.shortTitle}</p>
        </div>
      </header>
      <div class="al-element-slot ${slotClass}">
        ${renderDashboardElement(element.type, elementOptions())}
      </div>
    </article>`;
}

function renderElementSilhouette(element) {
  return `
    <div class="al-silhouette-item">
      <span>${String(element.number).padStart(2, "0")}</span>
      <div class="al-silhouette-frame">
        ${renderDashboardElement(element.type, elementOptions(true))}
      </div>
    </div>`;
}

function renderWarningSilhouette(warning) {
  return `
    <div class="al-warning-silhouette">
      <div>${renderWarningIcon(warning.id, { silhouette: true })}</div>
      <span>${warning.shortLabel || warning.label}</span>
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
  return LOT_TWO_ELEMENTS.map(renderCard).join("");
}

function appTemplate() {
  return `
    <div class="al-shell">
      <header class="al-hero">
        <a class="al-back" href="./" aria-label="Voir le lot 1">←</a>
        <div>
          <p>Bibliothèque graphique · Lot 2</p>
          <h1>Le tableau de bord</h1>
          <span>3 familles · 12 voyants · SVG pilotable · 390</span>
        </div>
        <span class="al-lot-badge">L2</span>
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
            ${ui.lit ? "Voyant allumé" : "Tous éteints"}
          </button>
        </div>
        <div class="al-state-row" role="group" aria-label="État des éléments">
          ${renderStateButtons()}
        </div>

        <div class="al-dashboard-controls">
          <div class="al-dashboard-control-title">
            <span>Voyant isolé</span>
            <strong>${ui.lit ? DASHBOARD_WARNINGS.find((warning) => warning.id === ui.warning).label : "Aucun"}</strong>
          </div>
          <div class="al-warning-buttons" role="group" aria-label="Voyant à allumer">
            ${renderWarningButtons()}
          </div>

          <label class="al-rpm-control">
            <span>
              <span>Régime moteur</span>
              <strong data-rpm-output>${ui.rpm} tr/min</strong>
            </span>
            <input
              type="range"
              min="0"
              max="8000"
              step="100"
              value="${ui.rpm}"
              data-rpm-range
              aria-label="Régime moteur de 0 à 8000 tours par minute"
            />
            <span class="al-rpm-scale" aria-hidden="true"><i>0</i><i>4 000</i><i>8 000</i></span>
          </label>
        </div>
      </section>

      <section class="al-board al-dashboard-board" data-dashboard-board aria-label="Planche de contact du lot 2">
        ${boardTemplate()}
      </section>

      <section class="al-silhouette-test" aria-labelledby="silhouette-title">
        <div class="al-section-heading">
          <div>
            <p>Contrôle qualité</p>
            <h2 id="silhouette-title">Familles à 40</h2>
          </div>
          <span>3 / 3 lisibles</span>
        </div>
        <div class="al-silhouette-row al-silhouette-row-lot2">
          ${LOT_TWO_ELEMENTS.map(renderElementSilhouette).join("")}
        </div>
      </section>

      <section class="al-warning-test" aria-labelledby="warnings-title">
        <div class="al-section-heading">
          <div>
            <p>Test individuel</p>
            <h2 id="warnings-title">12 voyants à 40</h2>
          </div>
          <span>Sans libellé dessiné</span>
        </div>
        <div class="al-warning-silhouette-grid">
          ${DASHBOARD_WARNINGS.map(renderWarningSilhouette).join("")}
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
        <p>Lot 2 prêt pour validation à l’écran. Aucun élément du lot 3 inclus.</p>
      </footer>
    </div>`;
}

function refreshBoard() {
  const board = root.querySelector("[data-dashboard-board]");
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

  root.querySelectorAll("[data-set-warning]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.warning = button.dataset.setWarning;
      ui.lit = true;
      render();
    });
  });

  root.querySelector("[data-rpm-range]")?.addEventListener("input", (event) => {
    ui.rpm = Number(event.currentTarget.value);
    const output = root.querySelector("[data-rpm-output]");
    if (output) output.textContent = `${ui.rpm} tr/min`;
    refreshBoard();
  });
}

document.documentElement.style.setProperty("--al-night", ART_PALETTE.night);
render();
