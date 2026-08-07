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

// Préchargement DIFFÉRÉ au PREMIER GESTE. Avant, deux mp3 (~90 Ko) tombaient au
// boot sur tous les visiteurs, y compris la page de vente publique où aucun son
// ne joue jamais. Le premier geste est de toute façon le moment où iOS débloque
// l'audio : rien n'est perdu, et la première vue s'allège d'autant.
function _preloadOnce() {
  _get("click");
  _get("success");
}
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", _preloadOnce, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", _preloadOnce, { once: true });
}

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
export const playTick = () => play("pop", 0.28); // tic de roulette (répété au ralenti)
export const playBack = () => play("back");
export const playWhoosh = () => play("whoosh");
export const playGold = () => play("gold");
export const playPageturn = () => play("pageturn");
export const playNotify = () => play("notify");
export const playHorn = () => play("horn");

// ─── Musiques de fin (vraies pistes dédiées) ───
// quiz recap réussi / exam blanc admis / compétence débloquée.
// ⚠️ 2,2 s, pas 16. L'ancienne fanfare tenait seize secondes et pesait 526 Ko :
// elle jouait encore quand l'élève lisait déjà l'écran suivant. Un bon jeu
// mobile récompense en deux secondes puis rend la main. Le nom porte sa DATE,
// sinon le cache de l'app garde l'ancien fichier à vie chez les installés.
export const playVictory = () => play("victoire-courte-2026-08-03", 0.55);
export const playDefeat = () => play("defeat", 0.5); // quiz recap échoué / exam blanc recalé

// ─── Alias sémantiques quiz/examen (remappés sur .mp3 existants en attendant vrais sons) ───
export const playCorrect = () => play("success"); // bonne réponse
export const playWrong = () => play("hint"); // mauvaise réponse
// Carillon dédié à la réaction mascotte du quiz (06/08, Rayan : « crée un
// nouveau son »). Composé pour ce moment précis, pas un remap d'un .mp3
// existant. Sert UNIQUEMENT au call site quiz-engine.js (pas playCorrect
// ailleurs : pilote-mission/exam-blanc/en-situation gardent le son actuel).
export const playMascotDing = () => play("mascotte-ding", 0.5);
export const playStreak = () => play("whoosh", 0.5); // 2+ bonnes d'affilée
export const playPerfect = () => play("reward"); // quiz sans-faute
export const playLevelup = () => play("unlock"); // compétence validée
export const playFanfare = () => play("horn", 0.45); // exam réussi / monde débloqué
export const playStar = () => play("coin"); // quête réclamée

// ─── Duel synchronisé (06/08) ───
// La petite montée à 4 notes jouée à chaque bascule vers la question
// suivante : c'est elle qui donne l'envie d'enchaîner, pas le silence.
export const playDuelBoost = () => play("duel-vroom", 0.55);

// Joué une seule fois par session (jingle long ~2-3s, page souvent revisitée)
export function playParcours() {
  if (sessionStorage.getItem(PARCOURS_KEY)) return;
  sessionStorage.setItem(PARCOURS_KEY, "1");
  play("parcours", 0.15);
}

// Jingle/musique de l'écran de chargement. Joue puis s'arrête après
// `durationMs`. Retourne une fonction stop() (appelée à la fermeture du splash).
function _playIntro(name, vol, durationMs) {
  if (!isSoundEnabled()) return () => {};
  try {
    const a = _get(name, vol);
    a.currentTime = 0;
    a.play().catch(() => {});
    const t = setTimeout(() => {
      a.pause();
      a.currentTime = 0;
    }, durationMs);
    return () => {
      clearTimeout(t);
      a.pause();
      a.currentTime = 0;
    };
  } catch {
    return () => {};
  }
}

export const playParcoursIntro = (durationMs = 3000) =>
  _playIntro("parcours", 0.18, durationMs);

// Musique d'accueil PermiGo (réserve).
export const playConnexionIntro = (durationMs = 2800) =>
  _playIntro("connexion", 0.28, durationMs);

// Son de lancement de l'app — « voiture qui démarre » (sons/launch.mp3).
export const playLaunchSound = (durationMs = 2800) =>
  _playIntro("launch", 0.45, durationMs);

// Mélodie de fond bouclée, faible volume. Retourne stop().
// `fadeInMs` : monte le volume progressivement au lieu de démarrer plein pot
// (utile quand la musique enchaîne juste après un moment silencieux, ex. la
// mission du Mode Pilote, où le démarrage à volume fixe sonnait brutal).
//
// ⚠️ Instance DÉDIÉE, jamais `_get()`/`_cache` : `_get` partage UN SEUL objet
// Audio par nom entre tous les appelants. Deux boucles simultanées sur la
// même piste (ex. un quiz ouvert par une notif push pendant qu'un autre quiz
// tourne déjà, cf. quiz-engine.js) partageraient alors le même élément — le
// premier qui se ferme et appelle son stop() couperait la musique de l'autre,
// encore ouvert, sans qu'il s'en rende compte (bug trouvé à l'audit du
// 07/08/2026). Un `new Audio()` par appel isole chaque boucle : son propre
// stop() ne peut plus agir que sur elle-même.
function _loopTrack(name, vol, { fadeInMs = 0 } = {}) {
  if (!isSoundEnabled()) return () => {};
  try {
    const a = new Audio(`/sounds/${name}.mp3`);
    a.volume = fadeInMs ? 0 : vol;
    a.loop = true;
    a.play().catch(() => {});
    let stopped = false;
    if (fadeInMs) {
      const start = performance.now();
      const step = (t) => {
        if (stopped) return;
        const p = Math.min(1, (t - start) / fadeInMs);
        a.volume = vol * p;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    return () => {
      stopped = true;
      a.loop = false;
      a.pause();
      a.currentTime = 0;
    };
  } catch {
    return () => {};
  }
}

// Quizz : mélodie douce de fond (sons/tuto.mp3), fondu d'entrée sur 700 ms.
export const playQuizMusic = (vol = 0.12) =>
  _loopTrack("tuto", vol, { fadeInMs: 700 });

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
