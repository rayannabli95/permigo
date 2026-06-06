// HTML Audio — fichiers /sounds/*.mp3 (dossier public/, servi par Vite sans import)
const PREF_KEY = "permigo-sound";
const LAUNCH_KEY = "permigo-launched";
const PARCOURS_KEY = "permigo-parcours-played";
const _cache = {};

export function isSoundEnabled() {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}
export function setSoundEnabled(v) {
  try {
    localStorage.setItem(PREF_KEY, v ? "on" : "off");
  } catch {}
}

function _get(name, vol = 0.4) {
  if (!_cache[name]) {
    const a = new Audio(`/sounds/${name}.mp3`);
    a.volume = vol;
    _cache[name] = a;
  }
  return _cache[name];
}

function play(name, vol = 0.4) {
  if (!isSoundEnabled()) return;
  try {
    const a = _get(name, vol);
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

// Précharger click + success : les navigateurs créent l'élément Audio même sans autoplay
_get("click");
_get("success");

// ─── Exports existants — haptic.js, reward-reveal.js, celebrate-screen.js déjà câblés ───
export const playClick = () => play("click");
export const playSuccess = () => play("success");
export const playReward = () => play("reward");
export const playError = () => play("hint");

// ─── Nouveaux exports ───
export const playUnlock = () => play("unlock");
export const playCoin = () => play("coin");
export const playReveal = () => play("reveal");
export const playPop = () => play("pop");
export const playBack = () => play("back");
export const playWhoosh = () => play("whoosh");
export const playGold = () => play("gold");
export const playPageturn = () => play("pageturn");
export const playNotify = () => play("notify");
export const playHorn = () => play("horn");

// ─── Musiques de fin (vraies pistes dédiées) ───
export const playVictory = () => play("victory", 0.5); // quiz recap réussi / exam blanc admis / compétence débloquée
export const playDefeat = () => play("defeat", 0.5); // quiz recap échoué / exam blanc recalé

// ─── Alias sémantiques quiz/examen (remappés sur .mp3 existants en attendant vrais sons) ───
export const playCorrect = () => play("success"); // bonne réponse
export const playWrong = () => play("hint"); // mauvaise réponse
export const playStreak = () => play("whoosh", 0.5); // 2+ bonnes d'affilée
export const playPerfect = () => play("reward"); // quiz sans-faute
export const playLevelup = () => play("unlock"); // compétence validée
export const playFanfare = () => play("horn", 0.45); // exam réussi / monde débloqué
export const playStar = () => play("coin"); // quête réclamée

// Joué une seule fois par session (jingle long ~2-3s, page souvent revisitée)
export function playParcours() {
  if (sessionStorage.getItem(PARCOURS_KEY)) return;
  sessionStorage.setItem(PARCOURS_KEY, "1");
  play("parcours", 0.15);
}

// Joué une seule fois par session, après le 1er geste user (autoplay safe)
// Durée limitée à 2 secondes
export function playLaunch() {
  if (sessionStorage.getItem(LAUNCH_KEY)) return;
  sessionStorage.setItem(LAUNCH_KEY, "1");
  if (!isSoundEnabled()) return;
  try {
    const a = _get("transition", 0.1);
    a.currentTime = 0;
    a.play().catch(() => {});
    setTimeout(() => {
      a.pause();
      a.currentTime = 0;
    }, 2000);
  } catch {}
}
