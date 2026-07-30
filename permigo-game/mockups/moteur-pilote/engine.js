const STORAGE_KEY = "permigo.mode-pilote.v1";

const DEFAULT_STATE = {
  version: 1,
  screen: "onboarding",
  profile: {
    transmission: null,
    sound: true,
  },
  selectedWorld: 1,
  completed: {},
  xp: 0,
  currentMissionId: null,
  run: null,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeLoad() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    const saved = JSON.parse(raw);
    if (saved?.version !== DEFAULT_STATE.version) return clone(DEFAULT_STATE);
    return {
      ...clone(DEFAULT_STATE),
      ...saved,
      profile: { ...DEFAULT_STATE.profile, ...saved.profile },
      completed: saved.completed || {},
      screen: saved.profile?.transmission ? "hub" : "onboarding",
      currentMissionId: null,
      run: null,
    };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function safeSave(state) {
  try {
    const snapshot = {
      ...state,
      screen: state.profile.transmission ? "hub" : "onboarding",
      currentMissionId: null,
      run: null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Le prototype reste jouable même si le stockage privé est indisponible.
  }
}

export class PermiGoSimulationEngine {
  constructor({ missions, worlds, onChange, onEvent }) {
    this.missions = missions;
    this.worlds = worlds;
    this.onChange = onChange;
    this.onEvent = onEvent;
    this.state = safeLoad();
  }

  emit(type, detail = {}) {
    this.onEvent?.({ type, detail, state: this.state });
  }

  notify({ persist = true } = {}) {
    if (persist) safeSave(this.state);
    this.onChange?.(this.state);
  }

  setScreen(screen) {
    this.state.screen = screen;
    this.notify({ persist: false });
  }

  chooseTransmission(transmission) {
    if (!["manual", "automatic"].includes(transmission)) return;
    const previous = this.state.profile.transmission;
    this.state.profile.transmission = transmission;
    this.state.screen = "hub";
    this.state.currentMissionId = null;
    this.state.run = null;
    this.emit("transmission_changed", { previous, transmission });
    this.notify();
  }

  toggleSound() {
    this.state.profile.sound = !this.state.profile.sound;
    this.notify();
  }

  selectWorld(worldId) {
    const world = this.worlds.find((item) => item.id === Number(worldId));
    if (!world) return;
    this.state.selectedWorld = world.id;
    this.state.screen = "hub";
    this.notify();
  }

  missionById(missionId) {
    return this.missions.find((mission) => mission.id === missionId) || null;
  }

  availableMissions() {
    const transmission = this.state.profile.transmission;
    if (!transmission) return [];
    return this.missions.filter((mission) =>
      mission.transmissions.includes(transmission),
    );
  }

  missionsForWorld(worldId = this.state.selectedWorld) {
    return this.availableMissions()
      .filter((mission) => mission.world === Number(worldId))
      .sort((a, b) => a.order - b.order);
  }

  completedCount(worldId = null) {
    const pool = worldId ? this.missionsForWorld(worldId) : this.availableMissions();
    return pool.filter((mission) => this.state.completed[mission.id]).length;
  }

  progressPercent(worldId = null) {
    const pool = worldId ? this.missionsForWorld(worldId) : this.availableMissions();
    if (!pool.length) return 0;
    return Math.round((this.completedCount(worldId) / pool.length) * 100);
  }

  levelInfo() {
    const step = 360;
    const level = Math.floor(this.state.xp / step) + 1;
    const inLevel = this.state.xp % step;
    return {
      level,
      inLevel,
      step,
      percent: Math.round((inLevel / step) * 100),
    };
  }

  recommendedMission(worldId = this.state.selectedWorld) {
    const pool = this.missionsForWorld(worldId);
    return pool.find((mission) => !this.state.completed[mission.id]) || pool[0] || null;
  }

  openMission(missionId) {
    const mission = this.missionById(missionId);
    if (
      !mission ||
      !mission.transmissions.includes(this.state.profile.transmission)
    ) {
      return;
    }
    this.state.currentMissionId = mission.id;
    this.state.run = this.createRun(mission);
    this.state.screen = "briefing";
    this.emit("mission_opened", {
      missionId: mission.id,
      competence: mission.competence,
      mode: mission.mode,
    });
    this.notify({ persist: false });
  }

  createRun(mission) {
    return {
      missionId: mission.id,
      attempts: 0,
      solved: false,
      hintVisible: false,
      feedback: null,
      selected: [],
      lastAnswer: null,
    };
  }

  startMission() {
    const mission = this.currentMission();
    if (!mission) return;
    this.state.run = this.createRun(mission);
    this.state.screen = "play";
    this.emit("mission_started", {
      missionId: mission.id,
      competence: mission.competence,
      mode: mission.mode,
    });
    this.notify({ persist: false });
  }

  currentMission() {
    return this.missionById(this.state.currentMissionId);
  }

  answer(answerId) {
    const mission = this.currentMission();
    const run = this.state.run;
    if (!mission || !run || run.solved) return;

    if (mission.mode === "sequence") {
      this.answerSequence(mission, run, answerId);
      return;
    }

    const correct = answerId === mission.solution;
    run.lastAnswer = answerId;

    if (correct) {
      run.solved = true;
      run.feedback = {
        tone: "success",
        title: mission.success,
        copy: mission.why,
      };
      this.emit("answer_correct", {
        missionId: mission.id,
        attempts: run.attempts,
      });
    } else {
      run.attempts += 1;
      run.hintVisible = run.attempts >= mission.attemptsBeforeHint;
      run.feedback = {
        tone: "retry",
        title: "Observe encore",
        copy: mission.retry,
      };
      this.emit("answer_retry", {
        missionId: mission.id,
        attempts: run.attempts,
      });
    }
    this.notify({ persist: false });
  }

  answerSequence(mission, run, answerId) {
    if (run.selected.includes(answerId)) return;
    const expected = mission.sequence[run.selected.length];
    run.lastAnswer = answerId;

    if (answerId !== expected) {
      run.attempts += 1;
      run.hintVisible = run.attempts >= mission.attemptsBeforeHint;
      run.feedback = {
        tone: "retry",
        title: "Repars du début du film",
        copy: mission.retry,
      };
      this.emit("answer_retry", {
        missionId: mission.id,
        attempts: run.attempts,
      });
      this.notify({ persist: false });
      return;
    }

    run.selected.push(answerId);
    run.feedback = {
      tone: "progress",
      title: "Bon enchaînement",
      copy:
        run.selected.length === mission.sequence.length
          ? mission.why
          : "Continue le scénario dans ta tête.",
    };

    if (run.selected.length === mission.sequence.length) {
      run.solved = true;
      run.feedback = {
        tone: "success",
        title: mission.success,
        copy: mission.why,
      };
      this.emit("answer_correct", {
        missionId: mission.id,
        attempts: run.attempts,
      });
    } else {
      this.emit("sequence_progress", {
        missionId: mission.id,
        step: run.selected.length,
        total: mission.sequence.length,
      });
    }
    this.notify({ persist: false });
  }

  completeMission() {
    const mission = this.currentMission();
    const run = this.state.run;
    if (!mission || !run?.solved) return;

    const firstCompletion = !this.state.completed[mission.id];
    if (firstCompletion) {
      this.state.completed[mission.id] = {
        completedAt: new Date().toISOString(),
        attempts: run.attempts,
        transmission: this.state.profile.transmission,
        consolidationDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      };
      this.state.xp += mission.xp;
    }
    this.state.screen = "outcome";
    this.emit("mission_completed", {
      missionId: mission.id,
      competence: mission.competence,
      xp: firstCompletion ? mission.xp : 0,
      firstCompletion,
    });
    this.notify();
  }

  replayCurrent() {
    const mission = this.currentMission();
    if (!mission) return;
    this.state.run = this.createRun(mission);
    this.state.screen = "play";
    this.emit("mission_replayed", { missionId: mission.id });
    this.notify({ persist: false });
  }

  openNextMission() {
    const current = this.currentMission();
    if (!current) {
      this.goHub();
      return;
    }
    const worldMissions = this.missionsForWorld(current.world);
    const index = worldMissions.findIndex((mission) => mission.id === current.id);
    const next =
      worldMissions
        .slice(index + 1)
        .find((mission) => !this.state.completed[mission.id]) ||
      worldMissions.find((mission) => !this.state.completed[mission.id]);

    if (next) {
      this.openMission(next.id);
      return;
    }

    const nextWorld = this.worlds.find((world) => world.id > current.world);
    if (nextWorld) this.state.selectedWorld = nextWorld.id;
    this.goHub();
  }

  goHub() {
    this.state.screen = "hub";
    this.state.currentMissionId = null;
    this.state.run = null;
    this.notify();
  }

  resetProgress() {
    const transmission = this.state.profile.transmission;
    const sound = this.state.profile.sound;
    this.state = clone(DEFAULT_STATE);
    this.state.profile.transmission = transmission;
    this.state.profile.sound = sound;
    this.state.screen = transmission ? "hub" : "onboarding";
    this.emit("progress_reset");
    this.notify();
  }
}
