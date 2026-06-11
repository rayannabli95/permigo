// Coach-hints : texte pédagogique affiché à la 1re visite seulement.
// Un pro lit l'explication une fois ; ensuite c'est du texte mort à l'écran.
const PREFIX = "pg-hint-";

export function shouldShowHint(key) {
  try {
    return !localStorage.getItem(PREFIX + key);
  } catch {
    return true;
  }
}

export function markHintSeen(key) {
  try {
    localStorage.setItem(PREFIX + key, "1");
  } catch {
    /* stockage indisponible (navigation privée) — le hint restera visible */
  }
}
