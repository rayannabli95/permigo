import { PermiGoSimulationEngine } from "./engine.js";
import { MISSIONS, MODE_INFO, TRANSMISSIONS, WORLDS } from "./content.js";

const root = document.querySelector("#game");

const icons = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Z"/><path d="M17 9.5a4 4 0 0 1 0 5"/></svg>`,
  muted: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Z"/><path d="m17 9 4 6M21 9l-4 6"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.3.75.6 1 .3.25.7.4 1.1.4h.09v4h-.09a1.7 1.7 0 0 0-1.7.6Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  route: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 6v3M12 13v3M12 20v1"/></svg>`,
  wheel: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M3.6 9h16.8M10.5 14.6 8 20M13.5 14.6 16 20"/></svg>`,
  replay: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a8 8 0 1 1 2.35 5.65M4 11V6m0 5h5"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  controller: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10a4 4 0 0 1 3.7 5.5l-1.4 3.4a2 2 0 0 1-3.1.8L14 16h-4l-2.2 1.7a2 2 0 0 1-3.1-.8l-1.4-3.4A4 4 0 0 1 7 8Z"/><path d="M8 11v4M6 13h4M16.5 12h.01M18.5 14h.01"/></svg>`,
};

const ui = {
  resetArmed: false,
  lastEvent: null,
};

class GameAudio {
  constructor() {
    this.context = null;
  }

  getContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.context = new AudioContext();
    }
    return this.context;
  }

  tone(frequency, start, duration, volume = 0.04, type = "sine") {
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    gain.gain.setValueAtTime(0, context.currentTime + start);
    gain.gain.linearRampToValueAtTime(volume, context.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + start + duration,
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.02);
  }

  play(kind) {
    if (!engine?.state.profile.sound) return;
    if (kind === "tap") this.tone(330, 0, 0.08, 0.025, "triangle");
    if (kind === "progress") {
      this.tone(430, 0, 0.1, 0.035, "triangle");
      this.tone(560, 0.07, 0.11, 0.035, "triangle");
    }
    if (kind === "correct") {
      this.tone(523, 0, 0.13, 0.045, "triangle");
      this.tone(659, 0.09, 0.13, 0.04, "triangle");
      this.tone(784, 0.18, 0.2, 0.045, "triangle");
    }
    if (kind === "retry") {
      this.tone(180, 0, 0.11, 0.035, "sine");
      this.tone(145, 0.08, 0.12, 0.03, "sine");
    }
    if (kind === "win") {
      [392, 523, 659, 784].forEach((frequency, index) =>
        this.tone(frequency, index * 0.08, 0.25, 0.05, "triangle"),
      );
    }
  }
}

const audio = new GameAudio();

const engine = new PermiGoSimulationEngine({
  missions: MISSIONS,
  worlds: WORLDS,
  onChange: render,
  onEvent: handleEngineEvent,
});

function handleEngineEvent(event) {
  ui.lastEvent = event;
  if (event.type === "answer_retry") {
    audio.play("retry");
    navigator.vibrate?.(18);
  }
  if (event.type === "sequence_progress") {
    audio.play("progress");
    navigator.vibrate?.(10);
  }
  if (event.type === "answer_correct") {
    audio.play("correct");
    navigator.vibrate?.([12, 30, 18]);
  }
  if (event.type === "mission_completed") {
    audio.play("win");
    navigator.vibrate?.([18, 35, 18, 35, 26]);
  }
}

function worldById(id) {
  return WORLDS.find((world) => world.id === Number(id)) || WORLDS[0];
}

function transmission() {
  return TRANSMISSIONS[engine.state.profile.transmission] || null;
}

function modeInfo(mode) {
  return MODE_INFO[mode] || MODE_INFO.spot;
}

function render() {
  document.body.dataset.screen = engine.state.screen;
  const screens = {
    onboarding: renderOnboarding,
    hub: renderHub,
    briefing: renderBriefing,
    play: renderPlay,
    outcome: renderOutcome,
    settings: renderSettings,
  };
  root.innerHTML = (screens[engine.state.screen] || renderOnboarding)();
  root.querySelector("h1")?.setAttribute("tabindex", "-1");
  if (engine.state.screen === "outcome" && ui.lastEvent?.type === "mission_completed") {
    window.requestAnimationFrame(burstParticles);
    ui.lastEvent = null;
  }
}

function renderLogo() {
  return `
    <span class="mp-logo" aria-label="PermiGo">
      <span class="mp-logo-mark">${icons.wheel}</span>
      <span><strong>PermiGo</strong><small>MODE PILOTE</small></span>
    </span>`;
}

function renderOnboarding() {
  return `
    <div class="mp-game mp-onboarding anim-slide-up">
      <div class="mp-onboarding-sky" aria-hidden="true">
        <span class="mp-star mp-star-a"></span>
        <span class="mp-star mp-star-b"></span>
        <span class="mp-star mp-star-c"></span>
        <div class="mp-horizon-city"></div>
        <div class="mp-onboarding-road"><span></span></div>
        <div class="mp-hero-car">
          <span class="mp-car-glass"></span>
          <span class="mp-car-light mp-car-light-left"></span>
          <span class="mp-car-light mp-car-light-right"></span>
        </div>
      </div>

      <header class="mp-onboarding-head">
        ${renderLogo()}
        <span class="mp-prototype-pill">Prototype jouable</span>
      </header>

      <section class="mp-onboarding-copy">
        <p class="mp-kicker">Ton parcours. Tes réflexes.</p>
        <h1>La route devient<br><span>ton terrain de jeu.</span></h1>
        <p>
          Observe, décide et agis dans des scènes de conduite.
          Chaque mission prépare un geste à refaire dans la vraie voiture.
        </p>
      </section>

      <section class="mp-transmission-panel" aria-labelledby="transmission-title">
        <div class="mp-panel-head">
          <span class="mp-step-badge">1</span>
          <span>
            <small>CONFIGURE TON VÉHICULE</small>
            <h2 id="transmission-title">Tu apprends sur quelle boîte&nbsp;?</h2>
          </span>
        </div>
        <div class="mp-transmission-grid">
          ${Object.values(TRANSMISSIONS)
            .map(
              (item) => `
                <button class="mp-transmission-card" type="button" data-transmission="${item.id}">
                  <span class="mp-gear-orb">${item.symbol}</span>
                  <span class="mp-transmission-copy">
                    <strong>${item.label}</strong>
                    <small>${item.description}</small>
                  </span>
                  <span class="mp-card-arrow">${icons.arrow}</span>
                </button>`,
            )
            .join("")}
        </div>
        <p class="mp-panel-note">Tu pourras changer ce choix sans perdre ta progression.</p>
      </section>
    </div>`;
}

function renderHub() {
  const selectedWorld = worldById(engine.state.selectedWorld);
  const selectedMissions = engine.missionsForWorld(selectedWorld.id);
  const level = engine.levelInfo();
  const total = engine.availableMissions().length;
  const completed = engine.completedCount();
  const recommended = engine.recommendedMission(selectedWorld.id);

  return `
    <div class="mp-game mp-hub anim-slide-up" style="--world:${selectedWorld.color};--world-dark:${selectedWorld.dark}">
      <div class="mp-ambient mp-ambient-a" aria-hidden="true"></div>
      <div class="mp-ambient mp-ambient-b" aria-hidden="true"></div>

      <header class="mp-hub-head">
        ${renderLogo()}
        <div class="mp-head-actions">
          <button class="mp-icon-button" type="button" data-action="toggle-sound" aria-label="${engine.state.profile.sound ? "Couper le son" : "Activer le son"}">
            ${engine.state.profile.sound ? icons.sound : icons.muted}
          </button>
          <button class="mp-icon-button" type="button" data-action="settings" aria-label="Réglages">
            ${icons.settings}
          </button>
        </div>
      </header>

      <section class="mp-pilot-card">
        <div class="mp-pilot-medal">
          <span>${level.level}</span>
          <small>NIV.</small>
        </div>
        <div class="mp-pilot-main">
          <div class="mp-pilot-line">
            <span>
              <small>PROFIL ACTIF</small>
              <strong>Pilote ${transmission().short}</strong>
            </span>
            <span class="mp-private-score">${completed}/${total} repères</span>
          </div>
          <div class="mp-xp-track" role="progressbar" aria-label="Progression du niveau" aria-valuemin="0" aria-valuemax="${level.step}" aria-valuenow="${level.inLevel}">
            <span style="width:${Math.max(level.percent, 3)}%"></span>
          </div>
          <div class="mp-xp-meta">
            <span>${engine.state.xp} XP personnels</span>
            <span>${level.step - level.inLevel} avant niveau ${level.level + 1}</span>
          </div>
        </div>
      </section>

      <section class="mp-world-picker" aria-label="Compétences REMC">
        ${WORLDS.map((world) => {
          const isActive = world.id === selectedWorld.id;
          const progress = engine.progressPercent(world.id);
          return `
            <button
              class="mp-world-chip ${isActive ? "is-active" : ""}"
              type="button"
              data-world="${world.id}"
              aria-pressed="${isActive}"
              style="--chip:${world.color};--chip-dark:${world.dark}"
            >
              <span class="mp-world-code">${world.code}</span>
              <span>
                <strong>${world.title}</strong>
                <small>${progress}% préparé</small>
              </span>
            </button>`;
        }).join("")}
      </section>

      <section class="mp-world-hero">
        <div class="mp-world-hero-copy">
          <p>${selectedWorld.code} · ${selectedWorld.eyebrow}</p>
          <h1>${selectedWorld.title}</h1>
          <span>${selectedWorld.description}</span>
        </div>
        <div class="mp-world-emblem" aria-hidden="true">
          <span class="mp-emblem-ring"></span>
          ${renderWorldSymbol(selectedWorld.icon)}
        </div>
      </section>

      <section class="mp-map" aria-labelledby="map-title">
        <div class="mp-section-heading">
          <span>
            <small>CAMPAGNE ${selectedWorld.code}</small>
            <h2 id="map-title">Choisis ta mission</h2>
          </span>
          <span class="mp-world-progress">${engine.completedCount(selectedWorld.id)}/${selectedMissions.length}</span>
        </div>

        <div class="mp-mission-path">
          ${selectedMissions.map((mission, index) =>
            renderMissionNode(mission, index, mission.id === recommended?.id),
          ).join("")}
        </div>
      </section>

      <section class="mp-engine-deck">
        <div class="mp-section-heading">
          <span><small>LE MOTEUR</small><h2>5 façons d’apprendre en jouant</h2></span>
        </div>
        <div class="mp-mode-strip" tabindex="0" aria-label="Les cinq mécaniques du moteur">
          ${Object.entries(MODE_INFO).map(([id, mode]) => `
            <div class="mp-mode-card">
              <span>${mode.symbol}</span>
              <strong>${mode.label}</strong>
              <small>${mode.description}</small>
            </div>
          `).join("")}
        </div>
      </section>
    </div>`;
}

function renderWorldSymbol(name) {
  if (name === "wheel") return `<span class="mp-symbol-wheel">${icons.wheel}</span>`;
  if (name === "city") {
    return `<span class="mp-symbol-city"><i></i><i></i><i></i><b></b></span>`;
  }
  if (name === "storm") {
    return `<span class="mp-symbol-storm"><i></i><i></i><b></b></span>`;
  }
  return `<span class="mp-symbol-route">${icons.route}</span>`;
}

function renderMissionNode(mission, index, recommended) {
  const done = Boolean(engine.state.completed[mission.id]);
  const mode = modeInfo(mission.mode);
  const side = index % 2 === 0 ? "is-left" : "is-right";
  return `
    <div class="mp-mission-row ${side} ${done ? "is-done" : ""}">
      ${index ? `<span class="mp-path-line" aria-hidden="true"></span>` : ""}
      <button class="mp-mission-node" type="button" data-mission="${mission.id}">
        ${recommended && !done ? `<span class="mp-recommended">À TOI</span>` : ""}
        <span class="mp-node-orb">
          <span class="mp-node-symbol">${done ? icons.check : mode.symbol}</span>
          <span class="mp-node-number">${index + 1}</span>
        </span>
        <span class="mp-node-copy">
          <small>${mission.competence} · ${mode.label}</small>
          <strong>${mission.title}</strong>
          <span>${mission.objective}</span>
        </span>
        <span class="mp-node-xp">+${mission.xp} XP</span>
      </button>
    </div>`;
}

function renderBriefing() {
  const mission = engine.currentMission();
  if (!mission) return renderHub();
  const world = worldById(mission.world);
  const mode = modeInfo(mission.mode);

  return `
    <div class="mp-game mp-briefing anim-slide-up" style="--world:${world.color};--world-dark:${world.dark}">
      <header class="mp-screen-head">
        <button class="mp-icon-button" type="button" data-action="hub" aria-label="Retour à la carte">${icons.back}</button>
        <span class="mp-screen-brand">${world.code} · MISSION ${mission.order}</span>
        <button class="mp-icon-button" type="button" data-action="speak" aria-label="Écouter la mission">${icons.sound}</button>
      </header>

      <div class="mp-brief-visual">
        <div class="mp-brief-grid" aria-hidden="true"></div>
        <span class="mp-brief-halo" aria-hidden="true"></span>
        <div class="mp-mode-emblem">
          <span>${mode.symbol}</span>
          <small>${mode.label}</small>
        </div>
        ${renderSceneVisual(mission, false)}
      </div>

      <section class="mp-brief-card">
        <div class="mp-brief-tags">
          <span>${mission.competence}</span>
          <span>${transmission().label}</span>
        </div>
        <p class="mp-kicker">${world.eyebrow}</p>
        <h1>${mission.title}</h1>
        <p class="mp-brief-objective">${mission.objective}</p>
        <div class="mp-brief-facts">
          <span>${icons.controller}<b>${mode.label}</b><small>${mode.description}</small></span>
          <span>${icons.clock}<b>${mission.estimated}</b><small>Sans chrono</small></span>
        </div>
        <div class="mp-transfer-preview">
          <span>${icons.route}</span>
          <span><small>TRANSFERT DANS LA VOITURE</small><strong>${mission.transfer}</strong></span>
        </div>
        <button class="mp-primary-button" type="button" data-action="start">
          Entrer dans la scène
          ${icons.arrow}
        </button>
        <p class="mp-no-certification">${icons.lock} Cette mission prépare le geste ; elle ne certifie pas la compétence.</p>
      </section>
    </div>`;
}

function renderPlay() {
  const mission = engine.currentMission();
  const run = engine.state.run;
  if (!mission || !run) return renderHub();
  const world = worldById(mission.world);
  const progress = mission.mode === "sequence"
    ? Math.round((run.selected.length / mission.sequence.length) * 100)
    : run.solved
      ? 100
      : 14;

  return `
    <div class="mp-game mp-play anim-slide-up" style="--world:${world.color};--world-dark:${world.dark}">
      <header class="mp-play-hud">
        <button class="mp-icon-button mp-dark-button" type="button" data-action="hub" aria-label="Quitter la mission">${icons.back}</button>
        <div class="mp-mission-progress">
          <span class="mp-progress-label">${mission.competence} · ${mission.modeLabel}</span>
          <div role="progressbar" aria-label="Progression de la mission" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
            <span style="width:${Math.max(progress, 4)}%"></span>
          </div>
        </div>
        <button class="mp-icon-button mp-dark-button" type="button" data-action="speak" aria-label="Écouter la consigne">${icons.sound}</button>
      </header>

      <section class="mp-play-title">
        <p>MISSION ${mission.order} · ${mission.title}</p>
        <h1>${mission.prompt}</h1>
      </section>

      ${renderInteraction(mission, run)}

      <section class="mp-play-bottom">
        ${renderFeedback(mission, run)}
        ${run.hintVisible && !run.solved ? `
          <div class="mp-hint">
            <span>${icons.eye}</span>
            <span><small>INDICE ADAPTATIF</small><strong>${mission.hint}</strong></span>
          </div>` : ""}
        ${run.solved ? `
          <button class="mp-primary-button mp-success-button" type="button" data-action="complete">
            Ancrer ce repère
            ${icons.arrow}
          </button>` : ""}
      </section>
    </div>`;
}

function renderInteraction(mission, run) {
  if (mission.mode === "spot") {
    return `
      <section class="mp-interaction mp-spot-interaction">
        ${renderSceneVisual(mission, true, run)}
        <p class="mp-scene-instruction">Touche directement la zone dans la scène.</p>
      </section>`;
  }
  if (mission.mode === "sequence") {
    return renderSequence(mission, run);
  }
  if (mission.mode === "trajectory") {
    return `
      <section class="mp-interaction mp-trajectory-interaction">
        ${renderSceneVisual(mission, true, run)}
        <div class="mp-path-legend">
          <span><i class="mp-line-a"></i>A · Coupe</span>
          <span><i class="mp-line-b"></i>B · Reste dans la voie</span>
          <span><i class="mp-line-c"></i>C · Longe le bord</span>
        </div>
      </section>`;
  }
  return `
    <section class="mp-interaction mp-choice-interaction">
      ${renderSceneVisual(mission, false, run)}
      ${mission.symptom ? `<div class="mp-symptom"><small>SYMPTÔME</small><strong>${mission.symptom}</strong></div>` : ""}
      <div class="mp-choice-list">
        ${mission.choices.map((choice, index) => {
          const isLastWrong = run.lastAnswer === choice.id && run.feedback?.tone === "retry";
          const isCorrect = run.solved && choice.id === mission.solution;
          return `
            <button
              class="mp-answer-card ${isLastWrong ? "is-wrong" : ""} ${isCorrect ? "is-correct" : ""}"
              type="button"
              data-answer="${choice.id}"
              ${run.solved ? "disabled" : ""}
            >
              <span class="mp-answer-index">${String.fromCharCode(65 + index)}</span>
              <span>${choice.label}</span>
              <span class="mp-answer-state">${isCorrect ? icons.check : ""}</span>
            </button>`;
        }).join("")}
      </div>
    </section>`;
}

function renderSequence(mission, run) {
  const shuffled = [...mission.steps].sort((a, b) => b.id.localeCompare(a.id));
  return `
    <section class="mp-interaction mp-sequence-interaction">
      ${renderSceneVisual(mission, false, run)}
      <div class="mp-sequence-lane" aria-label="Ta chaîne de gestes">
        ${mission.sequence.map((id, index) => {
          const selectedId = run.selected[index];
          const selectedStep = mission.steps.find((step) => step.id === selectedId);
          return `
            <span class="mp-sequence-slot ${selectedStep ? "is-filled" : ""}">
              <small>${index + 1}</small>
              ${selectedStep ? `<strong>${selectedStep.label}</strong>` : `<i></i>`}
            </span>`;
        }).join("")}
      </div>
      <div class="mp-sequence-bank">
        ${shuffled.map((step) => `
          <button
            class="mp-sequence-card"
            type="button"
            data-answer="${step.id}"
            ${run.selected.includes(step.id) || run.solved ? "disabled" : ""}
          >
            <span>${step.symbol}</span>
            <strong>${step.label}</strong>
          </button>
        `).join("")}
      </div>
    </section>`;
}

function renderFeedback(mission, run) {
  if (!run.feedback) {
    return `
      <div class="mp-feedback mp-feedback-neutral">
        <span>?</span>
        <p><strong>Prends le temps d’observer.</strong><small>Tu peux recommencer sans perdre de point.</small></p>
      </div>`;
  }
  return `
    <div class="mp-feedback mp-feedback-${run.feedback.tone}" role="status">
      <span>${run.feedback.tone === "success" ? icons.check : run.feedback.tone === "retry" ? "↺" : "→"}</span>
      <p><strong>${run.feedback.title}</strong><small>${run.feedback.copy}</small></p>
    </div>`;
}

function renderSceneVisual(mission, interactive = false, run = null) {
  const scene = `
    <div class="mp-scene-art mp-art-${mission.visual}" aria-hidden="true">
      ${renderArt(mission.visual)}
    </div>`;

  const hotspots = interactive && mission.hotspots
    ? mission.hotspots.map((hotspot, index) => {
        const isHint = run?.hintVisible && hotspot.id === mission.solution;
        return `
          <button
            class="mp-hotspot ${isHint ? "is-hint" : ""}"
            type="button"
            data-answer="${hotspot.id}"
            aria-label="${hotspot.label}"
            style="--x:${hotspot.x}%;--y:${hotspot.y}%;--w:${hotspot.w}%;--h:${hotspot.h}%;--delay:${index * 80}ms"
          >
            <span></span>
          </button>`;
      }).join("")
    : "";

  const trajectories = interactive && mission.mode === "trajectory"
    ? `
      <svg class="mp-trajectory-svg" viewBox="0 0 360 260" aria-label="Choix de trajectoire">
        <g class="mp-trajectory-choice path-a" role="button" tabindex="0" data-answer="cut" aria-label="Trajectoire A, couper vers la ligne centrale">
          <path class="mp-path-hit" d="M180 245 C180 178 95 145 119 68"/>
          <path class="mp-path-visible" d="M180 245 C180 178 95 145 119 68"/>
        </g>
        <g class="mp-trajectory-choice path-b" role="button" tabindex="0" data-answer="safe" aria-label="Trajectoire B, rester dans sa voie">
          <path class="mp-path-hit" d="M205 245 C211 180 166 153 190 61"/>
          <path class="mp-path-visible" d="M205 245 C211 180 166 153 190 61"/>
        </g>
        <g class="mp-trajectory-choice path-c" role="button" tabindex="0" data-answer="edge" aria-label="Trajectoire C, longer le bord extérieur">
          <path class="mp-path-hit" d="M233 245 C253 184 242 143 272 78"/>
          <path class="mp-path-visible" d="M233 245 C253 184 242 143 272 78"/>
        </g>
      </svg>`
    : "";

  return `
    <div class="mp-scene mp-scene-${mission.visual}">
      <div class="mp-scene-scan" aria-hidden="true"></div>
      ${scene}
      ${hotspots}
      ${trajectories}
      <span class="mp-scene-tag">${mission.competence} · SIMULATION</span>
    </div>`;
}

function renderArt(visual) {
  if (visual === "cockpit") return artCockpit();
  if (visual === "start-manual" || visual === "start-automatic") {
    return artStart(visual === "start-automatic");
  }
  if (visual === "warning") return artWarning();
  if (visual === "intersection") return artIntersection();
  if (visual === "roundabout") return artRoundabout();
  if (visual === "bend") return artBend();
  if (visual === "night") return artNight();
  if (visual === "rain") return artRain();
  if (visual === "emergency") return artEmergency();
  if (visual === "gps") return artGps();
  if (visual === "city-light") return artCityLight();
  if (visual === "exterior") return artExterior();
  return artCockpit();
}

function artCockpit() {
  return `
    <div class="art-sky"><span class="art-road"></span></div>
    <div class="art-dash">
      <span class="art-dial art-dial-left"></span>
      <span class="art-dial art-dial-right"></span>
      <span class="art-screen">0</span>
    </div>
    <span class="art-stalk art-stalk-left"></span>
    <span class="art-stalk art-stalk-right"></span>
    <div class="art-wheel"><span>PG</span></div>
    <div class="art-pedals"><i></i><i></i><i></i></div>`;
}

function artStart(automatic) {
  return `
    <div class="art-start-grid"></div>
    <div class="art-footwell">
      <span class="art-foot"></span>
      <span class="art-pedal-large"></span>
      ${automatic ? `<span class="art-pedal-small"></span>` : `<span class="art-pedal-small"></span><span class="art-pedal-clutch"></span>`}
    </div>
    <div class="art-selector">
      <span class="${automatic ? "" : "is-active"}">${automatic ? "P" : "1"}</span>
      <span class="${automatic ? "is-active" : ""}">${automatic ? "D" : "2"}</span>
      <span>${automatic ? "R" : "3"}</span>
      <i></i>
    </div>`;
}

function artWarning() {
  return `
    <div class="art-warning-dash">
      <span class="art-warning-dial"><i></i></span>
      <span class="art-warning-screen">CONTACT</span>
      <span class="art-warning-dial"><i></i></span>
      <b class="art-warning-light">!</b>
      <small>ALERTE ACTIVE</small>
    </div>`;
}

function artIntersection() {
  return `
    <div class="art-city-sky"></div>
    <div class="art-building art-building-left"><i></i><i></i><i></i></div>
    <div class="art-building art-building-right"><i></i><i></i><i></i></div>
    <div class="art-main-road"><span></span></div>
    <div class="art-side-road"><span></span></div>
    <div class="art-parked-car"><i></i><b></b></div>
    <span class="art-crosswalk"></span>`;
}

function artRoundabout() {
  return `
    <div class="art-top-road art-top-road-v"></div>
    <div class="art-top-road art-top-road-h"></div>
    <div class="art-roundabout-ring"><span></span></div>
    <span class="art-top-car art-top-car-player"></span>
    <span class="art-top-car art-top-car-other"></span>
    <span class="art-exit-arrow">↗</span>`;
}

function artBend() {
  return `
    <svg class="art-bend-svg" viewBox="0 0 360 260" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#58a06d"/><stop offset="1" stop-color="#284c3a"/></linearGradient>
      </defs>
      <rect width="360" height="260" fill="url(#grass)"/>
      <path d="M132 270 C140 192 57 163 90 48 L280 48 C245 141 292 185 280 270Z" fill="#4a4857"/>
      <path d="M205 270 C211 192 154 154 183 48" fill="none" stroke="#f7e9a1" stroke-width="5" stroke-dasharray="18 14"/>
      <path d="M130 270 C140 192 57 163 90 48M280 270 C292 185 245 141 280 48" fill="none" stroke="#f7f3ff" stroke-width="4"/>
      <circle cx="54" cy="76" r="27" fill="#1d5e3e"/><circle cx="314" cy="105" r="34" fill="#1d5e3e"/>
    </svg>`;
}

function artNight() {
  return `
    <div class="art-night-sky"><i></i><i></i><i></i><i></i></div>
    <div class="art-night-road"><span></span><b></b></div>
    <div class="art-oncoming"><i></i><i></i></div>
    <span class="art-right-edge"></span>
    <div class="art-night-dash"></div>`;
}

function artRain() {
  return `
    <div class="art-rain-sky"></div>
    <div class="art-rain-road"><span></span></div>
    <div class="art-rain-car"><i></i><b></b></div>
    <div class="art-rain-lines">${"<i></i>".repeat(18)}</div>
    <span class="art-wiper art-wiper-left"></span>
    <span class="art-wiper art-wiper-right"></span>`;
}

function artEmergency() {
  return `
    <div class="art-emergency-sky"></div>
    <div class="art-emergency-road"><span></span></div>
    <div class="art-obstacle"><i></i><b>!</b></div>
    <div class="art-player-hood"></div>
    <span class="art-brake-wave art-brake-wave-a"></span>
    <span class="art-brake-wave art-brake-wave-b"></span>`;
}

function artGps() {
  return `
    <div class="art-map-grid"></div>
    <span class="art-map-road art-map-road-main"></span>
    <span class="art-map-road art-map-road-exit"></span>
    <span class="art-map-route"></span>
    <span class="art-map-car">▲</span>
    <span class="art-map-exit">SORTIE</span>
    <div class="art-gps-card"><small>RECALCUL</small><strong>Continue tout droit</strong></div>`;
}

function artCityLight() {
  return `
    <div class="art-light-sky"></div>
    <div class="art-light-city"><i></i><i></i><i></i><i></i></div>
    <div class="art-light-road"><span></span></div>
    <div class="art-traffic-light"><i></i><i class="is-red"></i><i></i></div>
    <div class="art-player-hood"></div>`;
}

function artExterior() {
  return `
    <div class="art-garage-grid"></div>
    <div class="art-car-side">
      <span class="art-car-window"></span>
      <span class="art-car-door"></span>
      <i class="art-car-wheel art-car-wheel-left"></i>
      <i class="art-car-wheel art-car-wheel-right is-flat"></i>
      <b class="art-car-mirror"></b>
      <small class="art-car-plate">PG-2026</small>
    </div>
    <span class="art-floor-shadow"></span>`;
}

function renderOutcome() {
  const mission = engine.currentMission();
  if (!mission) return renderHub();
  const world = worldById(mission.world);
  const completion = engine.state.completed[mission.id];
  const firstCompletion = ui.lastEvent?.detail?.firstCompletion ?? false;
  const awardedXp = firstCompletion ? mission.xp : 0;

  return `
    <div class="mp-game mp-outcome anim-slide-up" style="--world:${world.color};--world-dark:${world.dark}">
      <div class="mp-particles" aria-hidden="true"></div>
      <div class="mp-outcome-grid" aria-hidden="true"></div>
      <header class="mp-outcome-head">${renderLogo()}</header>
      <section class="mp-outcome-main">
        <div class="mp-reward-orb">
          <span class="mp-reward-ring"></span>
          <span class="mp-reward-core">${icons.spark}</span>
          <small>${mission.competence}</small>
        </div>
        <p class="mp-kicker">REPÈRE DÉBLOQUÉ</p>
        <h1>${mission.success}</h1>
        <p>${mission.why}</p>
        <div class="mp-reward-row">
          <span><small>RÉCOMPENSE</small><strong>${awardedXp ? `+${awardedXp} XP` : "Déjà obtenu"}</strong></span>
          <span><small>STATUT</small><strong>Prêt à pratiquer</strong></span>
        </div>
        <div class="mp-real-world-card">
          <span class="mp-real-world-icon">${icons.route}</span>
          <span><small>QUÊTE DANS LA VRAIE VOITURE</small><strong>${mission.transfer}</strong></span>
        </div>
        <p class="mp-consolidation-note">
          Prochaine consolidation prévue 48 h après ce repère.
          Elle ne remplacera jamais la pratique ni ta certification.
        </p>
        <button class="mp-primary-button" type="button" data-action="next">
          Mission suivante
          ${icons.arrow}
        </button>
        <button class="mp-secondary-button" type="button" data-action="hub">Retour à la carte</button>
      </section>
    </div>`;
}

function renderSettings() {
  const activeTransmission = transmission();
  return `
    <div class="mp-game mp-settings anim-slide-up">
      <header class="mp-screen-head">
        <button class="mp-icon-button" type="button" data-action="hub" aria-label="Retour à la carte">${icons.back}</button>
        <span class="mp-screen-brand">RÉGLAGES DU PILOTE</span>
        <span class="mp-head-spacer"></span>
      </header>
      <section class="mp-settings-copy">
        <p class="mp-kicker">TON MOTEUR, TES RÈGLES</p>
        <h1>Configure ton expérience.</h1>
        <p>Changer de transmission ne supprime pas les repères déjà débloqués.</p>
      </section>

      <section class="mp-settings-section">
        <div class="mp-setting-title"><small>VÉHICULE</small><h2>Transmission</h2></div>
        <div class="mp-setting-options">
          ${Object.values(TRANSMISSIONS).map((item) => `
            <button
              class="mp-setting-choice ${item.id === activeTransmission.id ? "is-active" : ""}"
              type="button"
              data-transmission="${item.id}"
              aria-pressed="${item.id === activeTransmission.id}"
            >
              <span>${item.symbol}</span>
              <strong>${item.label}</strong>
              <small>${item.id === activeTransmission.id ? "Active" : "Choisir"}</small>
            </button>
          `).join("")}
        </div>
      </section>

      <section class="mp-settings-section">
        <div class="mp-setting-row">
          <span>
            <small>AUDIO</small>
            <strong>Effets sonores</strong>
            <p>Retours synthétiques, sans musique répétitive.</p>
          </span>
          <button
            class="mp-switch ${engine.state.profile.sound ? "is-on" : ""}"
            type="button"
            data-action="toggle-sound"
            role="switch"
            aria-label="Effets sonores"
            aria-checked="${engine.state.profile.sound}"
          >
            <span></span>
          </button>
        </div>
      </section>

      <section class="mp-settings-section mp-danger-zone">
        <div class="mp-setting-title"><small>PROTOTYPE</small><h2>Recommencer le test</h2></div>
        <p>Efface uniquement la progression locale du Mode Pilote.</p>
        <button class="mp-reset-button ${ui.resetArmed ? "is-armed" : ""}" type="button" data-action="reset">
          ${ui.resetArmed ? "Confirmer la remise à zéro" : "Effacer ma progression locale"}
        </button>
      </section>
    </div>`;
}

function speakCurrent() {
  if (!("speechSynthesis" in window)) return;
  const mission = engine.currentMission();
  const text = mission
    ? `${mission.title}. ${mission.prompt}`
    : "Mode Pilote PermiGo.";
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.96;
  window.speechSynthesis.speak(utterance);
}

function burstParticles() {
  const layer = root.querySelector(".mp-particles");
  if (!layer) return;
  const colors = ["#f4c75e", "#8b6dff", "#41c7d8", "#ff8a5b", "#ffffff"];
  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement("i");
    const angle = (Math.PI * 2 * index) / 18;
    const distance = 82 + (index % 4) * 18;
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle", colors[index % colors.length]);
    particle.style.setProperty("--delay", `${(index % 3) * 35}ms`);
    layer.append(particle);
  }
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action],[data-transmission],[data-world],[data-mission],[data-answer]");
  if (!target) return;

  audio.play("tap");

  if (target.dataset.transmission) {
    engine.chooseTransmission(target.dataset.transmission);
    ui.resetArmed = false;
    return;
  }
  if (target.dataset.world) {
    engine.selectWorld(target.dataset.world);
    return;
  }
  if (target.dataset.mission) {
    engine.openMission(target.dataset.mission);
    return;
  }
  if (target.dataset.answer) {
    engine.answer(target.dataset.answer);
    return;
  }

  const action = target.dataset.action;
  if (action === "hub") engine.goHub();
  if (action === "settings") engine.setScreen("settings");
  if (action === "toggle-sound") engine.toggleSound();
  if (action === "speak") speakCurrent();
  if (action === "start") engine.startMission();
  if (action === "complete") engine.completeMission();
  if (action === "next") engine.openNextMission();
  if (action === "replay") engine.replayCurrent();
  if (action === "reset") {
    if (!ui.resetArmed) {
      ui.resetArmed = true;
      render();
    } else {
      ui.resetArmed = false;
      engine.resetProgress();
    }
  }
});

root.addEventListener("keydown", (event) => {
  const target = event.target.closest("[data-answer]");
  if (!target || !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  engine.answer(target.dataset.answer);
});

export function mount() {
  render();
}

mount();
