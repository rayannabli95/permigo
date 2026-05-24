// Web Audio API — sons synthétisés, 0 fichier réseau
const PREF_KEY = 'permigo-sound';
let _ctx = null;

export function isSoundEnabled() {
  try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch { return true; }
}

export function setSoundEnabled(v) {
  try { localStorage.setItem(PREF_KEY, v ? 'on' : 'off'); } catch {}
}

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

function tone(freq, type = 'sine', gain = 0.06, dur = 0.06) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

export function playClick() {
  tone(800, 'sine', 0.05, 0.04);
}

export function playSuccess() {
  tone(660, 'sine', 0.06, 0.08);
  setTimeout(() => tone(880, 'sine', 0.07, 0.10), 90);
}

export function playReward() {
  [880, 1100, 1320].forEach((f, i) =>
    setTimeout(() => tone(f, 'sine', 0.06, 0.09), i * 65)
  );
}

export function playError() {
  tone(220, 'triangle', 0.05, 0.14);
}
