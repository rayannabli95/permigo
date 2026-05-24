// ═══════════════════════════════════════════════════════════════
// Haptic feedback — vibrations courtes pour actions critiques
// Apple-style : court, discret, jamais long
// ═══════════════════════════════════════════════════════════════
import { playClick, playSuccess, playError } from '@/utils/sound.js';

const HAS_VIBRATE = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/**
 * Patterns Apple-like (en ms) — toujours < 30ms pour rester discret
 */
const PATTERNS = {
  tap:     [8],          // tap léger : sélection, navigation
  select:  [12],         // sélection plus marquée
  success: [10, 50, 18], // validation réussie (deux pulses)
  warning: [25],         // attention/erreur
  swipe:   [6],          // début de swipe
  longpress: [18, 30, 12], // long press déclenché
};

/**
 * Déclenche un feedback haptique court + son d'interface.
 * Vibration silencieuse si non supporté ou prefers-reduced-motion.
 * Son ignoré si l'utilisateur a désactivé les sons (localStorage).
 * @param {'tap'|'select'|'success'|'warning'|'swipe'|'longpress'} type
 */
export function haptic(type = 'tap') {
  if (HAS_VIBRATE && !matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    try { navigator.vibrate(PATTERNS[type] || PATTERNS.tap); } catch {}
  }
  // swipe exclu : déclenché sur chaque pixel, trop fréquent pour un son
  if (type === 'success')       playSuccess();
  else if (type === 'warning')  playError();
  else if (type !== 'swipe')    playClick();
}
