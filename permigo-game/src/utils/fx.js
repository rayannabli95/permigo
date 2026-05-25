// ═══════════════════════════════════════════════════════════════
// Couche « effets » — combine animation + son + vibration pour les
// moments clés de l'app, en un seul appel. Construit sur :
//   - anim.js  (visuel : confettis, pop, shake)
//   - sound.js (audio)
//   - haptic.js (vibration mobile)
//
// Usage :
//   import { fxCorrect, fxWrong, fxReward, fxCelebrate, fxClick } from '@/utils/fx.js';
//   fxCorrect(choiceEl);   // bonne réponse  : son + vibration + pop
//   fxWrong(choiceEl);     // mauvaise        : son + vibration + shake
//   fxReward(buttonEl);    // récompense      : son + confettis
//   fxCelebrate(el);       // grosse victoire : jingle + gros confettis
// ═══════════════════════════════════════════════════════════════
import { confettiFrom, pop, shake } from '@/utils/anim.js';
import {
  playClick, playSuccess, playError, playReward, playPop, playWrapped,
} from '@/utils/sound.js';
import { haptic } from '@/utils/haptic.js';

/** Bonne réponse / action réussie. */
export function fxCorrect(el) {
  haptic('success');
  playSuccess();
  pop(el);
}

/** Mauvaise réponse / erreur. */
export function fxWrong(el) {
  haptic('warning');
  playError();
  shake(el);
}

/** Récompense obtenue (gain, déblocage léger). */
export function fxReward(el) {
  haptic('success');
  playReward();
  confettiFrom(el);
}

/** Grosse célébration (montée de niveau, parcours réussi…). */
export function fxCelebrate(el) {
  haptic('success');
  playWrapped();
  confettiFrom(el, { count: 30, spread: 150 });
}

/** Ouverture d'un panneau / feuille (avec petit burst). */
export function fxOpen(el) {
  haptic('select');
  playPop();
  confettiFrom(el);
}

/** Simple clic / navigation. */
export function fxClick() {
  haptic('tap');
  playClick();
}
