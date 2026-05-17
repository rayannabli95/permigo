// ═══════════════════════════════════════════════════════════════
// Haptic feedback — vibrations courtes pour actions critiques
// Apple-style : court, discret, jamais long
// ═══════════════════════════════════════════════════════════════

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
 * Déclenche un feedback haptique court.
 * Silencieux si non supporté ou si le user a désactivé les anims réduites.
 * @param {'tap'|'select'|'success'|'warning'|'swipe'|'longpress'} type
 */
export function haptic(type = 'tap') {
  if (!HAS_VIBRATE) return;
  if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try { navigator.vibrate(PATTERNS[type] || PATTERNS.tap); } catch {}
}
