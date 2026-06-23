// ═══════════════════════════════════════════════════════════════
// Haptic feedback — vibrations courtes pour l'immersion.
// Apple-style : court, discret, jamais long.
//
// Plateformes :
//  - Android : navigator.vibrate (vrai)
//  - iPhone/iPad : navigator.vibrate n'existe PAS → on toggle un
//    <input switch> caché, ce qui déclenche un vrai retour haptique
//    (iOS 17.4+). Fallback : son d'interface.
//  - Desktop : no-op (son seulement pour les moments forts).
// ═══════════════════════════════════════════════════════════════
import { playClick, playSuccess, playError } from "@/utils/sound.js";

const HAS_VIBRATE =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// Patterns Apple-like (ms) — toujours courts pour rester discrets.
// ── Jeu de vibrations « arcade routière » : chaque geste métier a sa signature
//    haptique. Toujours court (< 250ms cumulé) pour rester pro, jamais punitif.
const PATTERNS = {
  // — base —
  tap: [8],
  select: [12],
  success: [10, 50, 18],
  warning: [25],
  swipe: [6],
  longpress: [18, 30, 12],
  // — jeu arcade (additif) —
  tick: [4], // micro-tick d'un compteur / d'un pas de slider
  impact: [16], // un « clac » net (bouton d'action métier)
  confirm: [10, 40, 10], // leçon confirmée — double appui satisfaisant
  validate: [12, 35, 12, 35, 24], // compétence REMC validée — montée
  unlock: [20, 60, 14, 40, 30], // palier débloqué — crescendo court
  levelup: [14, 45, 14, 45, 14, 45, 30], // passage de tier — escalier
  notify: [10, 30, 10], // notification / nouvel avis reçu
  error: [30, 40, 30], // refus / action impossible — deux coups secs
  nav: [5], // changement d'écran (feed) — quasi imperceptible
};

function reduced() {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// ── Hack haptique iOS : toggler un switch caché = vrai buzz sur iPhone.
let _switchLabel = null;
function iosBuzz() {
  if (typeof document === "undefined" || !document.body) return;
  try {
    if (!_switchLabel) {
      const label = document.createElement("label");
      label.dataset.noHaptic = ""; // exclu du listener global (anti-boucle)
      label.setAttribute("aria-hidden", "true");
      label.style.cssText =
        "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.tabIndex = -1;
      input.setAttribute("switch", "");
      label.appendChild(input);
      document.body.appendChild(label);
      _switchLabel = label;
    }
    _switchLabel.click();
  } catch {
    /* no-op */
  }
}

// Familles de son pour le jeu arcade (le reste = clic d'interface discret).
const SOUND_SUCCESS = new Set([
  "success",
  "confirm",
  "validate",
  "unlock",
  "levelup",
]);
const SOUND_ERROR = new Set(["warning", "error"]);
const SOUND_SILENT = new Set(["swipe", "tick", "nav"]);

/**
 * Feedback haptique court + son d'interface (moments intentionnels).
 * @param {'tap'|'select'|'success'|'warning'|'swipe'|'longpress'|'tick'|'impact'|'confirm'|'validate'|'unlock'|'levelup'|'notify'|'error'|'nav'} type
 */
export function haptic(type = "tap") {
  if (!reduced()) {
    if (HAS_VIBRATE) {
      try {
        navigator.vibrate(PATTERNS[type] || PATTERNS.tap);
      } catch {
        /* no-op */
      }
    }
    iosBuzz();
  }
  if (SOUND_SUCCESS.has(type)) playSuccess();
  else if (SOUND_ERROR.has(type)) playError();
  else if (!SOUND_SILENT.has(type)) playClick();
}

/**
 * Helper haptique direct pour un pattern custom (ms) — sans son.
 * Pour les micro-interactions (compteurs, sliders, feed).
 * @param {number|number[]} pattern
 */
export function hapticRaw(pattern) {
  if (reduced()) return;
  if (HAS_VIBRATE) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* no-op */
    }
  }
  iosBuzz();
}

// ── Tap haptique GLOBAL : court, SILENCIEUX, anti-spam (1 tap / 55 ms).
let _lastTap = 0;
export function tapHaptic() {
  const now = Date.now();
  if (now - _lastTap < 55) return;
  _lastTap = now;
  if (reduced()) return;
  if (HAS_VIBRATE) {
    try {
      navigator.vibrate(8);
    } catch {
      /* no-op */
    }
  }
  iosBuzz();
}

// ── Vibration ESCALADÉE : n pulses (combo). Avec son de réussite.
//    combo 1 → 1 pulse, combo 2 → 2 pulses, … (plafonné à 5).
export function hapticPulses(n = 1) {
  n = Math.max(1, Math.min(5, n | 0));
  if (!reduced()) {
    if (HAS_VIBRATE) {
      const pat = [];
      for (let i = 0; i < n; i++) {
        pat.push(14);
        if (i < n - 1) pat.push(55);
      }
      try {
        navigator.vibrate(pat);
      } catch {
        /* no-op */
      }
    }
    let i = 0;
    const tick = () => {
      if (i++ >= n) return;
      iosBuzz();
      setTimeout(tick, 70);
    };
    tick();
  }
  // (son géré par l'appelant → permet une récompense VARIABLE, pas toujours le même)
}
