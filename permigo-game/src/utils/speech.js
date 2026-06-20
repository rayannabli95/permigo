// ═══════════════════════════════════════════════════════════════
// Speech — lecture vocale de la question (Web Speech API) + bouton muet
// persistant (localStorage). Partagé par tous les quiz (parcours, flash,
// examen blanc, révision).
//
//   muteButtonHTML()                 → bouton 🔊/🔇 auto-stylé (à mettre près de la question)
//   wireQuestionSpeech(el, texte)    → branche le bouton dans `el` + lit la question
//   stopSpeaking()                   → coupe la lecture en cours (réponse / sortie)
//
// Le choix muet est GLOBAL et persistant : coché une fois, il le reste
// pour l'utilisateur sur toutes les questions et tous les quiz.
// ═══════════════════════════════════════════════════════════════

const MUTE_KEY = "permigo_quiz_muted";
const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;

export function isQuizMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setQuizMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* localStorage indispo (mode privé) : on ignore */
  }
}

// ── Voix française (chargement asynchrone selon les navigateurs) ──
let frVoice = null;
function pickVoice() {
  if (!hasTTS) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  frVoice =
    voices.find((v) => /^fr[-_]?FR/i.test(v.lang)) ||
    voices.find((v) => /^fr/i.test(v.lang)) ||
    null;
  return frVoice;
}
if (hasTTS) {
  pickVoice();
  // getVoices() est souvent vide au 1er appel : on réessaie au chargement.
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

// Nettoie le texte (balises HTML + markdown gras) avant lecture.
function plainText(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stopSpeaking() {
  if (!hasTTS) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

export function speakQuestion(text) {
  if (!hasTTS || isQuizMuted()) return;
  const txt = plainText(text);
  if (!txt) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = "fr-FR";
    const v = frVoice || pickVoice();
    if (v) u.voice = v;
    u.rate = 0.97;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* TTS indisponible : silencieux */
  }
}

// ── Icônes (inline, suivent currentColor) ───────────────────────
const SVG_ON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
const SVG_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

/**
 * Bouton muet auto-stylé (inline styles → marche dans n'importe quel thème de quiz).
 * @param {{ size?: number }} opts
 */
export function muteButtonHTML({ size = 38 } = {}) {
  const muted = isQuizMuted();
  const op = muted ? "0.55" : "1";
  return `<button type="button" id="qz-mute" class="qz-mute"
    aria-pressed="${muted}"
    aria-label="${muted ? "Activer la lecture vocale de la question" : "Couper la lecture vocale de la question"}"
    title="${muted ? "Activer la voix" : "Couper la voix"}"
    style="flex:0 0 auto;width:${size}px;height:${size}px;display:inline-grid;place-items:center;border-radius:50%;border:1.5px solid currentColor;background:transparent;color:inherit;opacity:${op};cursor:pointer;padding:0;font:inherit;-webkit-tap-highlight-color:transparent;transition:opacity .15s">${muted ? SVG_OFF : SVG_ON}</button>`;
}

/**
 * Branche le bouton muet présent dans `container` et lit la question.
 * À appeler après chaque (re)rendu d'une question.
 * @param {HTMLElement} container
 * @param {string} text  texte de la question à lire
 */
export function wireQuestionSpeech(container, text) {
  if (!container) return;
  const btn = container.querySelector("#qz-mute");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const muted = !isQuizMuted();
      setQuizMuted(muted);
      btn.setAttribute("aria-pressed", String(muted));
      btn.setAttribute(
        "aria-label",
        muted
          ? "Activer la lecture vocale de la question"
          : "Couper la lecture vocale de la question",
      );
      btn.title = muted ? "Activer la voix" : "Couper la voix";
      btn.innerHTML = muted ? SVG_OFF : SVG_ON;
      btn.style.opacity = muted ? "0.55" : "1";
      if (muted) stopSpeaking();
      else speakQuestion(text);
    });
  }
  speakQuestion(text);
}
