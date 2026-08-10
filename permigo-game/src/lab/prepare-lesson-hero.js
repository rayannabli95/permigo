import "./prepare-lesson-hero.css";

const HERO_CONFIG = {
  title: "Prépare ta leçon",
  buttonLabel: "Je la prépare",
  imageAlt:
    "Une voiture monte par une route en lacets vers le sommet d’une montagne.",
  // WebP 1200px q86 : 4,1 Mo de PNG → 131 Ko les trois (le hero ne fait jamais
  // plus de 388px de large, donc 1200px couvre déjà le DPR 3). Les .png sont
  // gardés à côté : repasser dessus = rechanger l'extension ici.
  scenes: {
    morning: "/lab/prepare-lesson-hero/assets/prepare-lesson-morning.webp",
    midday: "/lab/prepare-lesson-hero/assets/prepare-lesson-midday.webp",
    evening: "/lab/prepare-lesson-hero/assets/prepare-lesson-evening.webp",
  },
  variants: [
    { id: "cinematic", label: "Cinématique" },
    { id: "premium", label: "Premium UI" },
    { id: "game", label: "Jeu mobile" },
  ],
};

const root = document.querySelector("#prepare-lesson-lab");
let activeVariant = HERO_CONFIG.variants[0].id;
let loadingTimer = null;
let successTimer = null;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sceneFromLocalTime() {
  const forcedScene = new URLSearchParams(location.search).get("scene");
  if (Object.hasOwn(HERO_CONFIG.scenes, forcedScene)) return forcedScene;

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 18) return "midday";
  return "evening";
}

function renderVariantControls() {
  return `
    <div class="plh-variants" role="tablist" aria-label="Variantes visuelles">
      ${HERO_CONFIG.variants
        .map(
          (variant, index) => `
            <button
              class="plh-variant${variant.id === activeVariant ? " is-active" : ""}"
              type="button"
              role="tab"
              data-variant="${variant.id}"
              aria-controls="prepare-lesson-hero"
              aria-selected="${variant.id === activeVariant}"
              tabindex="${variant.id === activeVariant ? "0" : "-1"}"
            >
              <span aria-hidden="true">${index + 1}</span>
              ${esc(variant.label)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPremiumButton() {
  return `
    <button
      class="plh-action"
      type="button"
      data-prepare-action
      aria-describedby="plh-action-status"
    >
      <span class="plh-action-light" aria-hidden="true"></span>
      <span class="plh-action-label">${esc(HERO_CONFIG.buttonLabel)}</span>
      <span class="plh-action-spinner" aria-hidden="true"></span>
      <svg class="plh-action-check" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6.5 12.5 3.5 3.5 7.5-8" />
      </svg>
    </button>
  `;
}

function renderHeroCard(scene) {
  return `
    <article
      id="prepare-lesson-hero"
      class="plh-hero plh-hero--${activeVariant} plh-scene--${scene}"
      data-hero-card
      data-variant="${activeVariant}"
      data-scene="${scene}"
      aria-labelledby="plh-hero-title"
    >
      <img
        class="plh-image"
        src="${HERO_CONFIG.scenes[scene]}"
        alt="${esc(HERO_CONFIG.imageAlt)}"
        width="1200"
        height="676"
        loading="eager"
        decoding="async"
      />
      <div class="plh-image-shade" aria-hidden="true"></div>
      <div class="plh-content">
        <h1 id="plh-hero-title">${esc(HERO_CONFIG.title)}</h1>
        ${renderPremiumButton()}
      </div>
    </article>
  `;
}

function render() {
  if (!root) return;
  const scene = sceneFromLocalTime();

  root.innerHTML = `
    <div class="plh-device">
      ${renderVariantControls()}
      <div class="plh-preview">
        ${renderHeroCard(scene)}
      </div>
      <p id="plh-action-status" class="plh-sr-only" aria-live="polite"></p>
    </div>
  `;

  requestAnimationFrame(() => {
    root.querySelector("[data-hero-card]")?.classList.add("is-ready");
  });
}

function updateVariant(nextVariant) {
  if (!HERO_CONFIG.variants.some((variant) => variant.id === nextVariant))
    return;
  activeVariant = nextVariant;

  const hero = root?.querySelector("[data-hero-card]");
  if (hero) {
    for (const variant of HERO_CONFIG.variants) {
      hero.classList.toggle(
        `plh-hero--${variant.id}`,
        variant.id === activeVariant,
      );
    }
    hero.dataset.variant = activeVariant;
  }

  root?.querySelectorAll("[data-variant]").forEach((button) => {
    const selected = button.dataset.variant === activeVariant;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function clearActionTimers() {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
}

function setStatus(message) {
  const status = root?.querySelector("#plh-action-status");
  if (status) status.textContent = message;
}

function startPreparation(button) {
  if (!button || button.disabled) return;

  clearActionTimers();
  button.disabled = true;
  button.classList.add("is-loading");
  button.setAttribute("aria-busy", "true");
  setStatus("La préparation commence.");

  loadingTimer = setTimeout(() => {
    button.classList.remove("is-loading");
    button.classList.add("is-success");
    button.removeAttribute("aria-busy");
    root?.querySelector("[data-hero-card]")?.classList.add("is-started");
    setStatus("La préparation est prête à commencer.");

    successTimer = setTimeout(() => {
      button.classList.remove("is-success");
      button.disabled = false;
      root?.querySelector("[data-hero-card]")?.classList.remove("is-started");
    }, 1400);
  }, 650);
}

function focusVariantAt(index) {
  const variants = [...(root?.querySelectorAll("[data-variant]") || [])];
  if (!variants.length) return;

  const wrappedIndex = (index + variants.length) % variants.length;
  const next = variants[wrappedIndex];
  updateVariant(next.dataset.variant);
  next.focus();
}

root?.addEventListener("click", (event) => {
  const variantButton = event.target.closest("[data-variant]");
  if (variantButton) {
    updateVariant(variantButton.dataset.variant);
    return;
  }

  const actionButton = event.target.closest("[data-prepare-action]");
  if (actionButton) startPreparation(actionButton);
});

root?.addEventListener("keydown", (event) => {
  const variantButton = event.target.closest("[data-variant]");
  if (!variantButton || !["ArrowLeft", "ArrowRight"].includes(event.key))
    return;

  event.preventDefault();
  const variants = [...root.querySelectorAll("[data-variant]")];
  const currentIndex = variants.indexOf(variantButton);
  focusVariantAt(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
});

window.addEventListener("pagehide", clearActionTimers);

render();
