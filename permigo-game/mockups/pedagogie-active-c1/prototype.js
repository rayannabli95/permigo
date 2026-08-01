const prototype = document.querySelector("#prototype");
const resetButton = document.querySelector("#reset-prototype");
const tabs = [...document.querySelectorAll("[data-variant]")];

const icon = {
  back: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 5-7 7 7 7"></path>
    </svg>`,
  sound: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9v6h4l5 4V5L9 9H5Z"></path>
      <path d="M17 9.5a4 4 0 0 1 0 5"></path>
    </svg>`,
  target: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8"></circle>
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"></path>
    </svg>`,
  arrow: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5"></path>
    </svg>`,
  shield: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>`,
  route: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 21 10 3M17 21 14 3M12 6v3M12 13v3M12 20v1"></path>
    </svg>`,
  check: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="m8 12 2.5 2.5L16 9"></path>
    </svg>`,
};

const variants = {
  cockpit: {
    title: "Le rappel actif bat la relecture",
    copy:
      "L’élève reçoit une intention de conduite et doit trouver la bonne zone. L’explication arrive après son geste.",
    observe:
      "Trouve-t-il la commande au premier essai puis explique-t-il son rôle sans retourner à la fiche ?",
    risk:
      "Un dessin trop éloigné de sa vraie voiture peut apprendre le mauvais repère spatial.",
  },
  mission: {
    title: "Le téléphone devient un coach de terrain",
    copy:
      "Chaque notion est transformée en action à faire dans une voiture à l’arrêt : observer, faire, puis dire à voix haute.",
    observe:
      "L’élève pose-t-il réellement le téléphone et peut-il refaire le geste sans l’écran ?",
    risk:
      "Impossible à utiliser immédiatement si l’élève n’a pas accès à une voiture stationnée.",
  },
  erreur: {
    title: "Comprendre l’erreur laisse une trace",
    copy:
      "On part d’un symptôme vécu, l’élève diagnostique la cause, puis découvre le geste de réparation.",
    observe:
      "Reconnaît-il la même erreur pendant sa prochaine leçon et sait-il la corriger seul ?",
    risk:
      "Trop de scénarios négatifs peuvent inquiéter un élève débutant si le ton n’est pas rassurant.",
  },
  sequence: {
    title: "Les aides disparaissent avant la leçon",
    copy:
      "Une démonstration courte devient une chaîne à reconstruire de mémoire, sans score public ni pression de vitesse.",
    observe:
      "Après quelques minutes, restitue-t-il l’ordre et les repères sans indice ?",
    risk:
      "Mémoriser une suite ne garantit pas encore la qualité du geste physique.",
  },
};

const states = {
  cockpit: { step: 0, resolved: false, feedback: null, complete: false },
  mission: { step: 0, hint: false, complete: false },
  erreur: { step: 0, wrong: null, resolved: false, complete: false },
  sequence: { phase: "model", selected: [], feedback: "", complete: false },
};

let activeVariant = getVariantFromHash();

function getVariantFromHash() {
  const hash = window.location.hash.slice(1);
  return Object.hasOwn(variants, hash) ? hash : "cockpit";
}

function topBar(progress, total) {
  const width = Math.max(6, Math.round((progress / total) * 100));
  return `
    <div class="app-top">
      <button class="app-back" type="button" data-action="back" aria-label="Retour au choix des maquettes">
        ${icon.back}
      </button>
      <div
        class="progress"
        role="progressbar"
        aria-label="Progression de l’activité"
        aria-valuemin="0"
        aria-valuemax="${total}"
        aria-valuenow="${progress}"
      >
        <div class="progress-fill" style="width:${width}%"></div>
      </div>
      <button class="sound-button" type="button" data-action="sound" aria-label="Écouter la consigne">
        ${icon.sound}
      </button>
    </div>`;
}

function completionScreen({ className = "", kicker, title, lead, note }) {
  return `
    <section class="screen ${className}">
      <div class="completion">
        <div class="completion-mark">${icon.check}</div>
        <p class="app-kicker">${kicker}</p>
        <h1>${title}</h1>
        <p class="lead">${lead}</p>
        <div class="confidence" aria-label="Auto-évaluation">
          <button type="button" data-action="confidence">Je peux le refaire sans téléphone</button>
          <button type="button" data-action="confidence">Je peux le refaire avec un indice</button>
          <button type="button" data-action="restart">Je veux consolider maintenant</button>
        </div>
        <p class="completion-note">${note}</p>
      </div>
    </section>`;
}

const cockpitTasks = [
  {
    prompt: "Tu veux tourner à gauche. Quelle commande actionnes-tu ?",
    answer: "stalk-left",
    success:
      "Oui. Clignotant = commodo gauche. Le repère doit devenir automatique pour garder les yeux sur la route.",
    retry:
      "Pas cette zone. Cherche le commodo situé à gauche du volant.",
  },
  {
    prompt: "Sur une boîte manuelle, quelle pédale sert à freiner ?",
    answer: "pedal-middle",
    success:
      "Exact. Embrayage, frein, accélérateur : le frein est au milieu et se dose avec le pied droit.",
    retry:
      "Regarde les trois pédales. Le frein est placé entre l’embrayage et l’accélérateur.",
  },
  {
    prompt: "Après le contact, un témoin rouge reste allumé. Où regardes-tu ?",
    answer: "warning",
    success:
      "Bien vu. Tu contrôles le tableau de bord et tu signales le témoin avant de partir.",
    retry:
      "Ce repère ne donne pas l’état du véhicule. Cherche la zone des témoins.",
  },
];

function cockpitMarkup() {
  const state = states.cockpit;
  if (state.complete) {
    return completionScreen({
      className: "screen-dark",
      kicker: "Exploration terminée",
      title: "Tes yeux savent où aller.",
      lead:
        "Tu as retrouvé les commandes à partir d’une intention, sans relire une liste.",
      note:
        "Dans le vrai parcours, cette activité prépare la pratique. Elle ne certifie pas encore la compétence.",
    });
  }

  const task = cockpitTasks[state.step];
  const feedbackClass = state.feedback
    ? state.resolved
      ? "is-success"
      : "is-retry"
    : "";
  const feedbackMark = state.feedback ? (state.resolved ? "✓" : "↺") : "?";

  return `
    <section class="screen screen-dark">
      ${topBar(state.step + (state.resolved ? 1 : 0), cockpitTasks.length)}
      <p class="app-kicker">A · Cockpit à explorer</p>
      <h1>Trouve sans relire.</h1>
      <p class="lead">La consigne donne une intention. À toi de retrouver le geste.</p>

      <div class="prompt-card">
        <span class="prompt-label">${icon.target} Mission ${state.step + 1} sur ${cockpitTasks.length}</span>
        <p>${task.prompt}</p>
      </div>

      <div class="cockpit" aria-label="Cockpit interactif simplifié">
        <div class="windshield"><div class="road"></div></div>
        <div class="dashboard">
          <div class="dash-screen" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
        <button class="dash-answer" type="button" data-cockpit-answer="warning" aria-label="Tableau de bord et témoins"></button>
        <button class="stalk stalk-left" type="button" data-cockpit-answer="stalk-left" aria-label="Commodo gauche"></button>
        <button class="stalk stalk-right" type="button" data-cockpit-answer="stalk-right" aria-label="Commodo droit"></button>
        <div class="steering" aria-hidden="true"><div class="steering-hub">PG</div></div>
        <div class="pedals" aria-label="Les trois pédales">
          <button class="pedal" type="button" data-cockpit-answer="pedal-left" aria-label="Pédale de gauche"></button>
          <button class="pedal" type="button" data-cockpit-answer="pedal-middle" aria-label="Pédale du milieu"></button>
          <button class="pedal" type="button" data-cockpit-answer="pedal-right" aria-label="Pédale de droite"></button>
        </div>
        <span class="hotspot-name hotspot-name-left">commodo gauche</span>
        <span class="hotspot-name hotspot-name-right">commodo droit</span>
        <span class="hotspot-name hotspot-name-pedals">pédales</span>
      </div>

      <div class="screen-feedback ${feedbackClass}" role="status">
        <span class="feedback-mark">${feedbackMark}</span>
        <span>${state.feedback || "Touche directement une zone du cockpit. Tu peux essayer sans pénalité."}</span>
      </div>

      ${
        state.resolved
          ? `<button class="primary-action" type="button" data-action="cockpit-next">
              ${state.step === cockpitTasks.length - 1 ? "Voir mon bilan" : "Mission suivante"}
              ${icon.arrow}
            </button>`
          : ""
      }
    </section>`;
}

const missionSteps = [
  {
    title: "Sécurise le départ",
    intro: "Avant de t’installer, lis l’environnement comme un conducteur.",
    observe: "Regarde le sol, les quatre pneus, les feux et les plaques.",
    do: "Fais un tour complet de la voiture.",
    say: "Nomme à voix haute ce qui t’empêcherait de partir.",
    hint: "Cherche surtout un obstacle sous une roue, un pneu visiblement à plat ou un feu abîmé.",
  },
  {
    title: "Trouve les commandes",
    intro: "Assieds-toi, moteur coupé. Tes yeux restent dirigés vers l’avant.",
    observe: "Repère les deux commodos derrière le volant.",
    do: "Montre le clignotant, puis les essuie-glaces, sans baisser la tête.",
    say: "Dis : « clignotant à gauche, balais à droite ».",
    hint: "Le commodo gauche commande aussi les feux. Celui de droite commande le lave-glace.",
  },
  {
    title: "Cartographie tes pieds",
    intro: "Le bon pied doit pouvoir agir sans recherche visuelle.",
    observe: "Repère les trois pédales sur une boîte manuelle.",
    do: "Pointe-les de gauche à droite, sans les enfoncer.",
    say: "Dis : « embrayage, frein, accélérateur ».",
    hint: "Frein et accélérateur sont tous les deux utilisés avec le pied droit.",
  },
  {
    title: "Lis les témoins",
    intro: "Le tableau de bord fait son propre contrôle avant le départ.",
    observe: "Mets le contact sans démarrer et regarde les témoins.",
    do: "Attends qu’ils s’allument puis s’éteignent.",
    say: "Montre un témoin qui devrait être signalé s’il restait allumé.",
    hint: "Huile, batterie ou frein : s’ils restent allumés, tu ne pars pas sans le signaler.",
  },
];

function missionMarkup() {
  const state = states.mission;
  if (state.complete) {
    return completionScreen({
      className: "screen-mission",
      kicker: "Mission terrain terminée",
      title: "Maintenant, refais-la sans écran.",
      lead:
        "Le test utile n’est pas d’avoir tout coché : c’est de pouvoir refaire les gestes dans la voiture.",
      note:
        "Cette mission reste une préparation. La vraie pratique se fait à l’arrêt puis pendant la leçon.",
    });
  }

  const step = missionSteps[state.step];
  return `
    <section class="screen screen-mission">
      ${topBar(state.step + 1, missionSteps.length)}
      <p class="app-kicker">B · Mission dans la voiture</p>
      <h1>Fais-le pour de vrai.</h1>
      <p class="lead">L’écran te guide, puis tu poses le téléphone pour agir.</p>
      <div class="safety-note">
        ${icon.shield}
        Voiture stationnée · moteur coupé · frein à main serré
      </div>

      <article class="mission-stage">
        <div class="mission-number">${state.step + 1}</div>
        <h2>${step.title}</h2>
        <p>${step.intro}</p>
        <div class="action-triplet">
          <div class="action-line"><strong>OBSERVE</strong><span>${step.observe}</span></div>
          <div class="action-line"><strong>FAIS</strong><span>${step.do}</span></div>
          <div class="action-line"><strong>DIS</strong><span>${step.say}</span></div>
        </div>
        ${state.hint ? `<div class="hint-box"><strong>Indice&nbsp;:</strong> ${step.hint}</div>` : ""}
      </article>

      <div
        class="step-dots"
        role="progressbar"
        aria-label="Progression de la mission"
        aria-valuemin="1"
        aria-valuemax="${missionSteps.length}"
        aria-valuenow="${state.step + 1}"
      >
        ${missionSteps
          .map(
            (_, index) =>
              `<span class="step-dot ${index <= state.step ? "is-done" : ""}"></span>`,
          )
          .join("")}
      </div>

      <button class="primary-action" type="button" data-action="mission-done">
        Je l’ai fait sans regarder l’écran
        ${icon.arrow}
      </button>
      ${
        state.hint
          ? ""
          : `<button class="secondary-action" type="button" data-action="mission-hint">J’ai besoin d’un indice</button>`
      }
    </section>`;
}

const errorScenarios = [
  {
    symptom: "Tu veux signaler un virage, mais les essuie-glaces se déclenchent.",
    question: "Quel diagnostic explique ce qui vient de se passer ?",
    choices: [
      "Tu as actionné le commodo droit",
      "Le témoin de batterie est allumé",
      "Tu as appuyé sur le frein",
    ],
    correct: 0,
    diagnosis: "Tu as cherché le clignotant du mauvais côté.",
    repair:
      "Répare avec un repère verbal court : « clignotant à gauche, balais à droite ».",
  },
  {
    symptom: "Après le contact, un témoin rouge reste allumé. Tu t’apprêtes à partir.",
    question: "Quel est le bon geste de réparation ?",
    choices: [
      "Démarrer pour voir s’il disparaît plus tard",
      "Le signaler avant de partir",
      "Couper les essuie-glaces",
    ],
    correct: 1,
    diagnosis: "Un témoin persistant signale un état à vérifier.",
    repair:
      "Ne pars pas comme si de rien n’était : identifie le témoin et signale-le à l’enseignant.",
  },
  {
    symptom: "Tu baisses longtemps les yeux pour retrouver la pédale de frein.",
    question: "Quel repère doit devenir automatique ?",
    choices: [
      "Frein à gauche, accélérateur au milieu",
      "Le pied gauche gère les trois pédales",
      "Frein au milieu, accélérateur à droite",
    ],
    correct: 2,
    diagnosis: "Chercher une pédale avec les yeux retire ton regard de la route.",
    repair:
      "Sur boîte manuelle : embrayage à gauche ; frein au milieu et accélérateur à droite, tous deux au pied droit.",
  },
];

function errorMarkup() {
  const state = states.erreur;
  if (state.complete) {
    return completionScreen({
      className: "screen-error",
      kicker: "Atelier terminé",
      title: "Tu sais lire le symptôme.",
      lead:
        "Au lieu de retenir une règle isolée, tu as relié une erreur, sa cause et le geste qui la répare.",
      note:
        "Pendant le débrief, PermiGo pourrait ressortir uniquement l’erreur réellement vécue en leçon.",
    });
  }

  const scenario = errorScenarios[state.step];
  return `
    <section class="screen screen-error">
      ${topBar(state.step + (state.resolved ? 1 : 0), errorScenarios.length)}
      <p class="app-kicker">C · Atelier des erreurs</p>
      <h1>Lis ce qui a dérapé.</h1>
      <p class="lead">Ici, l’erreur sert d’indice. Tu identifies sa cause avant de la réparer.</p>

      <div class="error-visual" aria-hidden="true">
        <div class="symptom">${scenario.symptom}</div>
        <div class="error-visual-road"></div>
        <div class="error-visual-car"></div>
      </div>

      <div class="prompt-card">
        <span class="prompt-label">${icon.target} Cas ${state.step + 1} sur ${errorScenarios.length}</span>
        <p>${scenario.question}</p>
      </div>

      <div class="choice-grid">
        ${scenario.choices
          .map((choice, index) => {
            const className = state.resolved && index === scenario.correct
              ? "is-correct"
              : state.wrong === index
                ? "is-wrong"
                : "";
            return `
              <button class="choice-button ${className}" type="button" data-error-choice="${index}">
                <span class="choice-index">${String.fromCharCode(65 + index)}</span>
                <span>${choice}</span>
              </button>`;
          })
          .join("")}
      </div>

      ${
        state.resolved
          ? `<div class="diagnostic">
              <span class="diagnostic-tag">Cause → réparation</span>
              <h3>${scenario.diagnosis}</h3>
              <p>${scenario.repair}</p>
            </div>
            <button class="primary-action" type="button" data-action="error-next">
              ${state.step === errorScenarios.length - 1 ? "Voir mon bilan" : "Cas suivant"}
              ${icon.arrow}
            </button>`
          : state.wrong !== null
            ? `<p class="micro-feedback" role="status">Ce choix n’explique pas le symptôme. Essaie une autre cause, sans pénalité.</p>`
            : ""
      }
    </section>`;
}

const sequenceSteps = [
  { id: "tour", short: "Tour voiture", detail: "Obstacle, pneus, feux, plaques" },
  { id: "porte", short: "Portière", detail: "Je m’installe et je ferme" },
  { id: "commandes", short: "Commandes", detail: "Tableau de bord et commodos" },
  { id: "pedales", short: "Pédales", detail: "Embrayage, frein, accélérateur" },
  { id: "contact", short: "Contact", detail: "Les témoins s’allument puis s’éteignent" },
];

const sequenceShuffle = ["commandes", "tour", "contact", "porte", "pedales"];

function sequenceMarkup() {
  const state = states.sequence;
  if (state.complete) {
    return completionScreen({
      className: "screen-sequence",
      kicker: "Chaîne reconstruite",
      title: "Les aides ont disparu.",
      lead:
        "Tu as récupéré les cinq repères de mémoire. La prochaine étape consiste à les refaire dans la voiture.",
      note:
        "La consolidation 48 h plus tard peut reprendre la même chaîne avec seulement deux repères à retrouver.",
    });
  }

  if (state.phase === "model") {
    return `
      <section class="screen screen-sequence">
        ${topBar(1, 3)}
        <p class="app-kicker">D · Mémoire du geste</p>
        <h1>Regarde la chaîne.</h1>
        <p class="lead">Les cinq repères forment un seul scénario de départ. Observe-les, puis les aides disparaîtront.</p>
        <div class="memory-model">
          ${sequenceSteps
            .map(
              (step, index) => `
                <div class="memory-card">
                  <span>${index + 1}</span>
                  <span><strong>${step.short}</strong><small>${step.detail}</small></span>
                </div>`,
            )
            .join("")}
        </div>
        <button class="primary-action" type="button" data-action="sequence-hide">
          Masquer et reconstruire
          ${icon.arrow}
        </button>
      </section>`;
  }

  const available = sequenceShuffle.map((id) =>
    sequenceSteps.find((step) => step.id === id),
  );
  return `
    <section class="screen screen-sequence">
      ${topBar(2, 3)}
      <p class="app-kicker">D · Aides retirées</p>
      <h1>Reconstruis de mémoire.</h1>
      <p class="lead">Touche les repères dans l’ordre. Rien ne chronomètre ta réponse.</p>

      <div class="memory-lane" aria-label="Ta chaîne reconstruite">
        ${
          state.selected.length
            ? state.selected
                .map((id) => {
                  const step = sequenceSteps.find((item) => item.id === id);
                  return `<span class="lane-chip">${step.short}</span>`;
                })
                .join("")
            : `<span class="memory-placeholder">Le premier repère vient ici…</span>`
        }
      </div>

      <div class="memory-choices">
        ${available
          .map(
            (step) => `
              <button
                class="memory-choice"
                type="button"
                data-sequence-choice="${step.id}"
                ${state.selected.includes(step.id) ? "disabled" : ""}
              >
                ${step.short}
              </button>`,
          )
          .join("")}
      </div>

      <p class="micro-feedback" role="status">
        ${state.feedback || "Si tu hésites, raconte-toi le film depuis l’extérieur de la voiture."}
      </p>
      <button class="secondary-action" type="button" data-action="sequence-show">Revoir la démonstration</button>
    </section>`;
}

const renderers = {
  cockpit: cockpitMarkup,
  mission: missionMarkup,
  erreur: errorMarkup,
  sequence: sequenceMarkup,
};

function render() {
  const meta = variants[activeVariant];
  document.querySelector("#hypothesis-title").textContent = meta.title;
  document.querySelector("#hypothesis-copy").textContent = meta.copy;
  document.querySelector("#test-observe").textContent = meta.observe;
  document.querySelector("#test-risk").textContent = meta.risk;

  tabs.forEach((tab) => {
    const isActive = tab.dataset.variant === activeVariant;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-current", isActive ? "true" : "false");
  });

  document.documentElement.style.setProperty(
    "--status-ink",
    ["cockpit", "sequence"].includes(activeVariant) ? "#f7f3ff" : "#211a35",
  );
  document.documentElement.style.setProperty(
    "--home-ink",
    ["cockpit", "sequence"].includes(activeVariant) ? "#f7f3ff" : "#211a35",
  );
  prototype.innerHTML = renderers[activeVariant]();
  prototype.scrollTop = 0;
}

function resetState(variant) {
  const defaults = {
    cockpit: { step: 0, resolved: false, feedback: null, complete: false },
    mission: { step: 0, hint: false, complete: false },
    erreur: { step: 0, wrong: null, resolved: false, complete: false },
    sequence: { phase: "model", selected: [], feedback: "", complete: false },
  };
  states[variant] = defaults[variant];
}

function currentInstruction() {
  if (activeVariant === "cockpit") {
    return cockpitTasks[states.cockpit.step]?.prompt || "Exploration terminée.";
  }
  if (activeVariant === "mission") {
    const step = missionSteps[states.mission.step];
    return step
      ? `${step.title}. ${step.observe} ${step.do} ${step.say}`
      : "Mission terrain terminée.";
  }
  if (activeVariant === "erreur") {
    const scenario = errorScenarios[states.erreur.step];
    return scenario
      ? `${scenario.symptom} ${scenario.question}`
      : "Atelier des erreurs terminé.";
  }
  return states.sequence.phase === "model"
    ? "Observe les cinq repères, puis masque-les pour reconstruire la chaîne."
    : "Reconstruis les cinq repères dans l’ordre, sans chronomètre.";
}

function speakInstruction(button) {
  if (!("speechSynthesis" in window)) {
    button.setAttribute("aria-label", "Lecture audio indisponible");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentInstruction());
  utterance.lang = "fr-FR";
  utterance.rate = 0.96;
  window.speechSynthesis.speak(utterance);
  button.setAttribute("aria-label", "Consigne en cours de lecture");
}

function selectVariant(variant) {
  activeVariant = variant;
  window.history.replaceState(null, "", `#${variant}`);
  render();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectVariant(tab.dataset.variant));
});

resetButton.addEventListener("click", () => {
  resetState(activeVariant);
  render();
});

window.addEventListener("hashchange", () => {
  activeVariant = getVariantFromHash();
  render();
});

prototype.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "back") {
    document.querySelector(`[data-variant="${activeVariant}"]`)?.focus();
    return;
  }
  if (action === "sound") {
    speakInstruction(target);
    return;
  }
  if (action === "restart") {
    resetState(activeVariant);
    render();
    return;
  }
  if (action === "confidence") {
    target.textContent = "Choix enregistré pour le test";
    target.disabled = true;
    return;
  }

  if (target.dataset.cockpitAnswer) {
    const state = states.cockpit;
    if (state.resolved) return;
    const task = cockpitTasks[state.step];
    state.resolved = target.dataset.cockpitAnswer === task.answer;
    state.feedback = state.resolved ? task.success : task.retry;
    render();
    return;
  }

  if (action === "cockpit-next") {
    const state = states.cockpit;
    if (state.step === cockpitTasks.length - 1) {
      state.complete = true;
    } else {
      state.step += 1;
      state.resolved = false;
      state.feedback = null;
    }
    render();
    return;
  }

  if (action === "mission-hint") {
    states.mission.hint = true;
    render();
    return;
  }

  if (action === "mission-done") {
    const state = states.mission;
    if (state.step === missionSteps.length - 1) {
      state.complete = true;
    } else {
      state.step += 1;
      state.hint = false;
    }
    render();
    return;
  }

  if (target.dataset.errorChoice !== undefined) {
    const state = states.erreur;
    if (state.resolved) return;
    const choice = Number(target.dataset.errorChoice);
    const scenario = errorScenarios[state.step];
    state.resolved = choice === scenario.correct;
    state.wrong = state.resolved ? null : choice;
    render();
    return;
  }

  if (action === "error-next") {
    const state = states.erreur;
    if (state.step === errorScenarios.length - 1) {
      state.complete = true;
    } else {
      state.step += 1;
      state.wrong = null;
      state.resolved = false;
    }
    render();
    return;
  }

  if (action === "sequence-hide") {
    states.sequence.phase = "recall";
    states.sequence.feedback = "";
    render();
    return;
  }

  if (action === "sequence-show") {
    states.sequence.phase = "model";
    states.sequence.selected = [];
    states.sequence.feedback = "";
    render();
    return;
  }

  if (target.dataset.sequenceChoice) {
    const state = states.sequence;
    const expected = sequenceSteps[state.selected.length].id;
    const selected = target.dataset.sequenceChoice;
    if (selected !== expected) {
      state.feedback =
        "Pas encore. Repars du moment où tu arrives près de la voiture.";
      render();
      return;
    }
    state.selected.push(selected);
    state.feedback =
      state.selected.length === sequenceSteps.length
        ? "Chaîne complète : tu viens de récupérer les cinq repères sans la fiche."
        : "Oui. Continue le film.";
    if (state.selected.length === sequenceSteps.length) {
      window.setTimeout(() => {
        state.complete = true;
        render();
      }, 260);
    }
    render();
  }
});

render();
