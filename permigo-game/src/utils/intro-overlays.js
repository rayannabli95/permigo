// ═══════════════════════════════════════════════════════════════
// intro-overlays — séquence les overlays du 1er lancement.
//
// Priorité : les popups d'engagement (install-nudge A2HS / push-prime)
// passent AVANT le tuto guidé. Le tuto s'abonne via onPopupsSettled() et
// ne démarre QU'UNE FOIS le popup résolu (fermé, OU décision « pas de
// popup »). Sans cette coordination, popup + tuto s'affichent ensemble :
// le popup masque le tuto et le spotlight se mesure au mauvais endroit.
//
// Déterministe (pas de polling DOM racy) :
//   main.js     → armPopupPhase()   AVANT route() (un popup PEUT arriver)
//   popup       → notifyPopupOpen() quand il s'affiche
//   popup       → notifyPopupSettled() quand il se ferme / ne s'affiche pas
//   tuto        → onPopupsSettled(fn) : fn() dès qu'aucun popup n'est en jeu
// ═══════════════════════════════════════════════════════════════

let pending = false; // un popup PEUT encore apparaître (phase armée)
let open = false; // un popup est actuellement à l'écran
let blockers = 0; // overlays de consentement (bandeau cookies) : bloquants
const waiters = [];

const settled = () => !pending && !open && blockers === 0;

function flush() {
  if (!settled()) return;
  while (waiters.length) waiters.shift()();
}

/**
 * Arme la phase popup AVANT de décider d'un affichage (appel synchrone dans
 * main.js, avant route()). Garde-fou : si aucun popup ne s'affiche dans les
 * 8 s (décision ratée), on libère le tuto pour ne jamais le bloquer.
 */
export function armPopupPhase() {
  pending = true;
  setTimeout(() => {
    if (pending) notifyPopupSettled();
  }, 8000);
}

/** Le popup s'affiche réellement → le tuto attend sa fermeture. */
export function notifyPopupOpen() {
  pending = false;
  open = true;
}

/** Le popup est fermé, OU la décision est « ne pas l'afficher ». */
export function notifyPopupSettled() {
  pending = false;
  open = false;
  flush();
}

/** Exécute `fn` dès qu'aucun popup n'est (ni ne sera) à l'écran. */
export function onPopupsSettled(fn) {
  if (settled()) fn();
  else waiters.push(fn);
}

/**
 * Bloqueur de consentement (bandeau cookies) — canal séparé des popups :
 * le garde-fou 8 s ne le lève PAS (une question légale sans réponse ne doit
 * jamais se retrouver sous le tuto), et le notifyPopupSettled() d'un popup
 * qui décide de ne pas s'afficher ne le libère pas non plus.
 */
export function pushIntroBlocker() {
  blockers++;
}

export function popIntroBlocker() {
  blockers = Math.max(0, blockers - 1);
  flush();
}
