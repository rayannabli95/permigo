import "./bridge-angle-mort.css";

const LANGUAGE_KEY = "permigo_bridge_lab_language";
const PROGRESS_KEY = "permigo_bridge_lab_progress";

const BRIDGE_COMPETENCE = {
  id: "bridge-angle-mort",
  languages: {
    fr: { code: "fr", label: "FR", name: "Français", direction: "ltr" },
    en: { code: "en", label: "EN", name: "English", direction: "ltr" },
    ar: { code: "ar", label: "AR", name: "العربية", direction: "rtl" },
  },
  titles: {
    fr: "Contrôler les rétroviseurs et l’angle mort",
    en: "Check the mirrors and blind spot",
    ar: "التحقّق من المرايا والنقطة العمياء",
  },
  intro: {
    fr: "Un geste, puis la route s’ouvre.",
    en: "One gesture, then the road opens.",
    ar: "خطوة واحدة، ثم ينفتح الطريق.",
  },
  instructions: {
    fr: "Touche les zones dans le bon ordre.",
    en: "Tap the areas in the correct order.",
    ar: "اضغط على المناطق بالترتيب الصحيح",
  },
  explanations: {
    fr: "Avant de changer de direction, vérifie les rétroviseurs puis regarde brièvement derrière ton épaule.",
    en: "Before changing direction, check the mirrors and then briefly look over your shoulder.",
    ar: "قبل تغيير الاتجاه، تحقّق من المرايا ثم انظر بسرعة خلف كتفك.",
  },
  instructorPhrase: {
    fr: "Contrôle ton angle mort.",
    en: "Check your blind spot.",
    ar: "تحقّق من النقطة العمياء.",
  },
  expectedOrder: ["interiorMirror", "exteriorMirror", "blindSpot"],
  zones: {
    interiorMirror: {
      fr: "Rétroviseur intérieur",
      en: "Interior mirror",
      ar: "المرآة الداخلية",
    },
    exteriorMirror: {
      fr: "Rétroviseur extérieur",
      en: "Exterior mirror",
      ar: "المرآة الخارجية",
    },
    blindSpot: {
      fr: "Angle mort",
      en: "Blind spot",
      ar: "النقطة العمياء",
    },
  },
  helpMessages: {
    interiorMirror: {
      fr: "Commence par regarder ce qui se passe derrière toi.",
      en: "Start by checking what is happening behind you.",
      ar: "ابدأ بالنظر إلى ما يحدث خلفك.",
    },
    exteriorMirror: {
      fr: "Puis vérifie le côté de ta voiture.",
      en: "Then check the side of your car.",
      ar: "ثم تحقّق من جانب سيارتك.",
    },
    blindSpot: {
      fr: "Termine par un regard bref derrière ton épaule.",
      en: "Finish with a brief look over your shoulder.",
      ar: "اختم بنظرة سريعة خلف كتفك.",
    },
  },
};

const UI = {
  lab: {
    fr: "Le labo de la conduite",
    en: "The driving lab",
    ar: "مختبر القيادة",
  },
  step: {
    fr: "Étape",
    en: "Step",
    ar: "المرحلة",
  },
  of: { fr: "sur", en: "of", ar: "من" },
  start: { fr: "Commencer", en: "Start", ar: "ابدأ" },
  observeTitle: {
    fr: "Observe autour de toi",
    en: "Look around you",
    ar: "انظر حولك",
  },
  observeHint: {
    fr: "Explore les trois zones avant de continuer.",
    en: "Explore the three areas before continuing.",
    ar: "استكشف المناطق الثلاث قبل المتابعة.",
  },
  ready: { fr: "Je suis prêt", en: "I’m ready", ar: "أنا مستعد" },
  actionTitle: { fr: "À toi de jouer", en: "Your turn", ar: "حان دورك" },
  sequenceComplete: {
    fr: "Le geste est complet.",
    en: "The sequence is complete.",
    ar: "اكتملت الحركة.",
  },
  continue: { fr: "Continuer", en: "Continue", ar: "متابعة" },
  understand: {
    fr: "Comprendre le geste",
    en: "Understand the action",
    ar: "افهم الحركة",
  },
  explanationTitle: {
    fr: "Le geste qui protège",
    en: "The action that keeps you safe",
    ar: "الحركة التي تحميك",
  },
  originalFrench: {
    fr: "Français d’origine",
    en: "Original French",
    ar: "النص الفرنسي الأصلي",
  },
  vocabulary: {
    fr: "Mot à reconnaître",
    en: "Word to recognise",
    ar: "كلمة يجب التعرّف عليها",
  },
  phraseTitle: {
    fr: "Dans la voiture",
    en: "In the car",
    ar: "داخل السيارة",
  },
  phraseIntro: {
    fr: "Ton moniteur dira peut-être :",
    en: "Your instructor may say:",
    ar: "قد يقول مدرّبك:",
  },
  translation: { fr: "Traduction", en: "Translation", ar: "الترجمة" },
  listen: { fr: "Écouter", en: "Listen", ar: "استمع" },
  replay: { fr: "Réécouter", en: "Listen again", ar: "استمع مجددًا" },
  audioReady: {
    fr: "L’audio est facultatif.",
    en: "Audio is optional.",
    ar: "الصوت اختياري.",
  },
  audioPlaying: {
    fr: "Lecture de la phrase française.",
    en: "Playing the French phrase.",
    ar: "يتم تشغيل العبارة الفرنسية.",
  },
  audioFallback: {
    fr: "Aucune voix française dédiée : la voix du navigateur est utilisée.",
    en: "No dedicated French voice: using the browser’s default voice.",
    ar: "لا يتوفر صوت فرنسي مخصص: سيُستخدم صوت المتصفح الافتراضي.",
  },
  audioUnavailable: {
    fr: "La lecture audio n’est pas disponible sur ce navigateur.",
    en: "Audio playback is not available in this browser.",
    ar: "التشغيل الصوتي غير متاح في هذا المتصفح.",
  },
  audioError: {
    fr: "La phrase reste lisible même sans audio.",
    en: "The phrase remains readable without audio.",
    ar: "تبقى العبارة قابلة للقراءة من دون صوت.",
  },
  finish: { fr: "Terminer", en: "Finish", ar: "إنهاء" },
  validation: {
    fr: "Tu reconnaîtras maintenant cette consigne dans la voiture.",
    en: "You will now recognise this instruction in the car.",
    ar: "ستتعرّف الآن على هذه التعليمة داخل السيارة.",
  },
  readyLesson: {
    fr: "Prêt pour ta leçon",
    en: "Ready for your lesson",
    ar: "مستعد لدرسك",
  },
  restart: { fr: "Recommencer", en: "Start again", ar: "ابدأ من جديد" },
  back: { fr: "Revenir", en: "Back", ar: "رجوع" },
  explored: { fr: "Zone repérée", en: "Area spotted", ar: "تم تحديد المنطقة" },
};

const labRoot = document.querySelector("#bridge-lab");

let state = loadProgress();
let observedZones = new Set();

function safeLanguage(value) {
  return Object.hasOwn(BRIDGE_COMPETENCE.languages, value) ? value : "fr";
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Le prototype reste utilisable lorsque localStorage est indisponible.
  }
}

function loadProgress() {
  const language = safeLanguage(readStorage(LANGUAGE_KEY));
  let saved = {};

  try {
    saved = JSON.parse(readStorage(PROGRESS_KEY) || "{}");
  } catch {
    saved = {};
  }

  return {
    language,
    screen: Number.isInteger(saved.screen)
      ? Math.min(5, Math.max(0, saved.screen))
      : 0,
    sequenceIndex: Number.isInteger(saved.sequenceIndex)
      ? Math.min(3, Math.max(0, saved.sequenceIndex))
      : 0,
    help: "",
    nudgeZone: "",
    lastCorrect: "",
  };
}

function saveProgress() {
  writeStorage(LANGUAGE_KEY, state.language);
  writeStorage(
    PROGRESS_KEY,
    JSON.stringify({
      screen: state.screen,
      sequenceIndex: state.sequenceIndex,
    }),
  );
}

function translated(dictionary, language = state.language) {
  return dictionary?.[language] || dictionary?.fr || "";
}

function languageAttributes(language = state.language) {
  const definition = BRIDGE_COMPETENCE.languages[language];
  return `lang="${definition.code}" dir="${definition.direction}"`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLanguageSelector() {
  const buttons = Object.values(BRIDGE_COMPETENCE.languages)
    .map(
      (language) => `
        <button
          class="bridge-language${state.language === language.code ? " is-active" : ""}"
          type="button"
          data-language="${language.code}"
          aria-label="${esc(language.name)}"
          aria-pressed="${state.language === language.code}"
          lang="${language.code}"
          dir="${language.direction}"
        >${language.label}</button>
      `,
    )
    .join("");

  return `
    <div class="bridge-language-selector" role="group" aria-label="Langue · Language · اللغة">
      ${buttons}
    </div>
  `;
}

function renderProgress() {
  const current = state.screen + 1;
  const label = `${translated(UI.step)} ${current} ${translated(UI.of)} 6`;

  return `
    <div class="bridge-progress" aria-label="${esc(label)}">
      <span class="bridge-progress-label" ${languageAttributes()}>${esc(label)}</span>
      <div class="bridge-progress-track" aria-hidden="true">
        <span style="width:${(current / 6) * 100}%"></span>
      </div>
    </div>
  `;
}

function renderHeader() {
  return `
    <header class="bridge-header">
      <div class="bridge-brand">
        <span class="bridge-brand-mark" aria-hidden="true"></span>
        <span>Le labo de la <strong>conduite</strong></span>
      </div>
      ${renderLanguageSelector()}
    </header>
  `;
}

function renderBackButton() {
  if (state.screen === 0 || state.screen === 5) return "";

  return `
    <button
      class="bridge-back"
      type="button"
      data-action="back"
      aria-label="${esc(translated(UI.back))}"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span ${languageAttributes()}>${esc(translated(UI.back))}</span>
    </button>
  `;
}

function renderRoadScene({ success = false } = {}) {
  return `
    <div class="bridge-road-scene${success ? " is-success" : ""}" aria-hidden="true">
      <span class="bridge-sun"></span>
      <span class="bridge-cloud bridge-cloud-one"></span>
      <span class="bridge-cloud bridge-cloud-two"></span>
      <svg viewBox="0 0 360 250" focusable="false">
        <defs>
          <linearGradient id="bridge-road-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#6d68ee" />
            <stop offset="1" stop-color="#4439a8" />
          </linearGradient>
          <linearGradient id="bridge-road-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#393183" />
            <stop offset="1" stop-color="#211d53" />
          </linearGradient>
        </defs>
        <g class="bridge-floating-island">
          <path d="M31 190 180 88l149 69-146 84Z" fill="url(#bridge-road-side)" />
          <path d="m31 174 149-102 149 69-146 84Z" fill="url(#bridge-road-top)" />
          <path
            d="m54 169 126-82 126 58-124 64Z"
            fill="none"
            stroke="#f7fbff"
            stroke-width="34"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="m54 169 126-82 126 58-124 64Z"
            fill="none"
            stroke="#c7cfdf"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="12 12"
          />
          <g class="bridge-car">
            <path d="M131 119h38l10 10v17h-58v-17Z" fill="#fff" />
            <path d="m137 121 7-8h18l9 8Z" fill="#dff6ff" />
            <path d="M126 143h48" stroke="#cbd5e1" stroke-width="3" />
            <circle cx="133" cy="147" r="6" fill="#17192c" />
            <circle cx="168" cy="147" r="6" fill="#17192c" />
            <rect x="174" y="131" width="5" height="7" rx="2" fill="#34d399" />
          </g>
        </g>
      </svg>
      <span class="bridge-success-orbit"></span>
      <span class="bridge-success-star bridge-star-one">✦</span>
      <span class="bridge-success-star bridge-star-two">✦</span>
      <span class="bridge-success-star bridge-star-three">✦</span>
    </div>
  `;
}

function renderIntroScreen() {
  return `
    <section class="bridge-screen bridge-intro" data-screen="intro">
      <div class="bridge-kicker" ${languageAttributes()}>${esc(translated(UI.lab))}</div>
      ${renderRoadScene()}
      <div class="bridge-copy">
        <h1 id="bridge-screen-title" ${languageAttributes()}>
          ${esc(translated(BRIDGE_COMPETENCE.titles))}
        </h1>
        <p ${languageAttributes()}>${esc(translated(BRIDGE_COMPETENCE.intro))}</p>
      </div>
      <button class="bridge-cta" type="button" data-action="start">
        <span ${languageAttributes()}>${esc(translated(UI.start))}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </section>
  `;
}

function zoneIcon(zoneId) {
  if (zoneId === "interiorMirror") {
    return `
      <svg viewBox="0 0 64 44" aria-hidden="true">
        <rect x="5" y="7" width="54" height="28" rx="10" />
        <path d="M31 35v6M22 41h18" />
        <path class="bridge-zone-shine" d="m16 26 14-12h17" />
      </svg>
    `;
  }

  if (zoneId === "exteriorMirror") {
    return `
      <svg viewBox="0 0 64 50" aria-hidden="true">
        <path d="M10 36c0-17 10-27 30-27 8 0 13 5 13 13 0 15-12 21-35 21Z" />
        <path d="m19 35 24-18" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="28" cy="19" r="9" />
      <path d="M13 53c1-15 7-23 18-23 8 0 14 5 18 14" />
      <path d="M42 14c8 3 12 8 13 16" />
      <path d="m50 26 5 4 3-6" />
    </svg>
  `;
}

function renderCockpit({ interactive = false } = {}) {
  const completed = new Set(
    BRIDGE_COMPETENCE.expectedOrder.slice(0, state.sequenceIndex),
  );

  const zones = BRIDGE_COMPETENCE.expectedOrder
    .map((zoneId) => {
      const isComplete = completed.has(zoneId);
      const isObserved = observedZones.has(zoneId);
      const isExpected =
        interactive &&
        BRIDGE_COMPETENCE.expectedOrder[state.sequenceIndex] === zoneId;
      const classes = [
        "bridge-zone",
        `bridge-zone-${zoneId}`,
        isComplete ? "is-complete" : "",
        isObserved ? "is-observed" : "",
        state.nudgeZone === zoneId ? "needs-attention" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const name = translated(BRIDGE_COMPETENCE.zones[zoneId]);
      const dataAttribute = interactive
        ? `data-sequence-zone="${zoneId}"`
        : `data-observe-zone="${zoneId}"`;

      return `
        <button
          class="${classes}"
          type="button"
          ${dataAttribute}
          aria-label="${esc(name)}"
          aria-pressed="${isComplete || isObserved}"
          ${isExpected ? 'data-expected="true"' : ""}
        >
          ${zoneIcon(zoneId)}
          <span class="bridge-zone-label" ${languageAttributes()}>${esc(name)}</span>
          <span class="bridge-zone-check" aria-hidden="true">✓</span>
        </button>
      `;
    })
    .join("");

  return `
    <div class="bridge-cockpit${interactive ? " is-interactive" : ""}">
      <div class="bridge-windshield" aria-hidden="true">
        <span class="bridge-horizon"></span>
        <span class="bridge-distant-road"></span>
      </div>
      <div class="bridge-dashboard" aria-hidden="true"></div>
      <div class="bridge-steering" aria-hidden="true"><span></span></div>
      ${zones}
    </div>
  `;
}

function renderObservationScreen() {
  const explored = observedZones.size;
  const exploredMessage = `${translated(UI.explored)} · ${explored}/3`;

  return `
    <section class="bridge-screen" data-screen="observation">
      <div class="bridge-copy bridge-copy-compact">
        <h1 id="bridge-screen-title" ${languageAttributes()}>
          ${esc(translated(UI.observeTitle))}
        </h1>
        <p ${languageAttributes()}>${esc(translated(BRIDGE_COMPETENCE.instructions))}</p>
      </div>
      ${renderCockpit()}
      <div class="bridge-observation-status" aria-live="polite" ${languageAttributes()}>
        ${esc(explored ? exploredMessage : translated(UI.observeHint))}
      </div>
      <button
        class="bridge-cta"
        type="button"
        data-action="ready"
        ${explored < 3 ? "disabled" : ""}
      >
        <span ${languageAttributes()}>${esc(translated(UI.ready))}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </section>
  `;
}

function renderSequenceExercise() {
  const complete =
    state.sequenceIndex === BRIDGE_COMPETENCE.expectedOrder.length;
  const completedNames = BRIDGE_COMPETENCE.expectedOrder
    .slice(0, state.sequenceIndex)
    .map(
      (zoneId, index) => `
        <span class="bridge-sequence-chip">
          <span aria-hidden="true">${index + 1}</span>
          <span ${languageAttributes()}>${esc(translated(BRIDGE_COMPETENCE.zones[zoneId]))}</span>
        </span>
      `,
    )
    .join("");

  return `
    <section class="bridge-screen" data-screen="action">
      <div class="bridge-copy bridge-copy-compact">
        <h1 id="bridge-screen-title" ${languageAttributes()}>
          ${esc(translated(UI.actionTitle))}
        </h1>
        <p ${languageAttributes()}>${esc(translated(BRIDGE_COMPETENCE.instructions))}</p>
      </div>
      ${renderCockpit({ interactive: true })}
      <div class="bridge-sequence-chips" aria-label="${esc(translated(UI.actionTitle))}">
        ${completedNames}
      </div>
      <div
        class="bridge-feedback${state.help ? " has-help" : ""}${complete ? " is-complete" : ""}"
        aria-live="polite"
        ${languageAttributes()}
      >
        ${esc(
          complete
            ? translated(UI.sequenceComplete)
            : state.help ||
                (state.lastCorrect
                  ? translated(BRIDGE_COMPETENCE.zones[state.lastCorrect])
                  : translated(UI.observeHint)),
        )}
      </div>
      ${
        complete
          ? `
            <button class="bridge-cta" type="button" data-action="explain">
              <span ${languageAttributes()}>${esc(translated(UI.understand))}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          `
          : ""
      }
    </section>
  `;
}

function renderBilingualText(primary, french) {
  const showOriginal = state.language !== "fr";

  return `
    <div class="bridge-bilingual">
      <p class="bridge-primary-text" data-primary-language="${state.language}" ${languageAttributes()}>
        ${esc(primary)}
      </p>
      ${
        showOriginal
          ? `
        <div class="bridge-original">
          <span ${languageAttributes()}>${esc(translated(UI.originalFrench))}</span>
          <p lang="fr" dir="ltr">${esc(french)}</p>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderVocabularyBridge() {
  const terms = {
    fr: "angle mort",
    en: "blind spot",
    ar: "النقطة العمياء",
  };

  return `
    <div class="bridge-vocabulary">
      <span class="bridge-vocabulary-label" ${languageAttributes()}>
        ${esc(translated(UI.vocabulary))}
      </span>
      <strong ${languageAttributes()}>
        ${esc(terms[state.language])}
        ${state.language === "fr" ? "" : ' · <bdi lang="fr" dir="ltr">angle mort</bdi>'}
      </strong>
    </div>
  `;
}

function renderExplanationScreen() {
  return `
    <section class="bridge-screen" data-screen="explanation">
      <div class="bridge-explanation-symbol" aria-hidden="true">
        <span></span>
        <svg viewBox="0 0 64 64"><path d="M15 45c2-17 10-26 24-26M38 12l5 7-8 3" /></svg>
      </div>
      <div class="bridge-copy bridge-copy-compact">
        <h1 id="bridge-screen-title" ${languageAttributes()}>
          ${esc(translated(UI.explanationTitle))}
        </h1>
      </div>
      ${renderBilingualText(
        translated(BRIDGE_COMPETENCE.explanations),
        BRIDGE_COMPETENCE.explanations.fr,
      )}
      ${renderVocabularyBridge()}
      <button class="bridge-cta" type="button" data-action="phrase">
        <span ${languageAttributes()}>${esc(translated(UI.continue))}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </section>
  `;
}

function audioSupported() {
  return (
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

function renderAudioPhrase() {
  const supported = audioSupported();
  const translation =
    state.language === "fr"
      ? BRIDGE_COMPETENCE.instructorPhrase.fr
      : translated(BRIDGE_COMPETENCE.instructorPhrase);

  return `
    <section class="bridge-screen" data-screen="phrase">
      <div class="bridge-audio-symbol" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path d="M12 38h11l15 12V14L23 26H12Z" />
          <path d="M46 24c4 5 4 11 0 16M52 17c8 9 8 21 0 30" />
        </svg>
      </div>
      <div class="bridge-copy bridge-copy-compact">
        <h1 id="bridge-screen-title" ${languageAttributes()}>
          ${esc(translated(UI.phraseTitle))}
        </h1>
        <p ${languageAttributes()}>${esc(translated(UI.phraseIntro))}</p>
      </div>
      <blockquote class="bridge-instructor-phrase" lang="fr" dir="ltr">
        « ${esc(BRIDGE_COMPETENCE.instructorPhrase.fr)} »
      </blockquote>
      ${
        state.language !== "fr"
          ? `
        <div class="bridge-translation">
          <span ${languageAttributes()}>${esc(translated(UI.translation))}</span>
          <p data-primary-language="${state.language}" ${languageAttributes()}>
            ${esc(translation)}
          </p>
        </div>
      `
          : ""
      }
      <div class="bridge-audio-actions">
        <button
          class="bridge-audio-button"
          type="button"
          data-audio="listen"
          ${supported ? "" : "disabled"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9v6h4l5 4V5l-5 4Zm12 0c2 2 2 4 0 6" />
          </svg>
          <span ${languageAttributes()}>${esc(translated(UI.listen))}</span>
        </button>
        <button
          class="bridge-audio-button"
          type="button"
          data-audio="replay"
          ${supported ? "" : "disabled"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7" />
          </svg>
          <span ${languageAttributes()}>${esc(translated(UI.replay))}</span>
        </button>
      </div>
      <p id="bridge-audio-status" class="bridge-audio-status" aria-live="polite" ${languageAttributes()}>
        ${esc(translated(supported ? UI.audioReady : UI.audioUnavailable))}
      </p>
      <button class="bridge-cta" type="button" data-action="finish">
        <span ${languageAttributes()}>${esc(translated(UI.finish))}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </section>
  `;
}

function renderSuccessScreen() {
  return `
    <section class="bridge-screen bridge-success" data-screen="success">
      ${renderRoadScene({ success: true })}
      <div class="bridge-success-check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9" /></svg>
      </div>
      <div class="bridge-copy">
        <p class="bridge-validation-copy" ${languageAttributes()}>
          ${esc(translated(UI.validation))}
        </p>
        <h1 id="bridge-screen-title" ${languageAttributes()}>
          ${esc(translated(UI.readyLesson))}
        </h1>
      </div>
      <button class="bridge-secondary-button" type="button" data-action="restart">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7" /></svg>
        <span ${languageAttributes()}>${esc(translated(UI.restart))}</span>
      </button>
    </section>
  `;
}

const SCREEN_RENDERERS = [
  renderIntroScreen,
  renderObservationScreen,
  renderSequenceExercise,
  renderExplanationScreen,
  renderAudioPhrase,
  renderSuccessScreen,
];

function render({ focus = "#bridge-screen-title" } = {}) {
  if (!labRoot) return;

  document.documentElement.lang = state.language;
  document.documentElement.dir = "ltr";
  saveProgress();

  labRoot.innerHTML = `
    ${renderHeader()}
    <div class="bridge-stage">
      ${renderProgress()}
      ${renderBackButton()}
      ${SCREEN_RENDERERS[state.screen]()}
    </div>
  `;

  requestAnimationFrame(() => {
    const target = focus ? labRoot.querySelector(focus) : null;
    if (!target) return;
    if (
      !target.matches("button, [href], input, select, textarea, [tabindex]")
    ) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  });
}

function setScreen(screen) {
  window.speechSynthesis?.cancel?.();
  state.screen = screen;
  state.help = "";
  state.nudgeZone = "";
  state.lastCorrect = "";
  render();
}

function selectLanguage(language) {
  state.language = safeLanguage(language);
  render({ focus: `[data-language="${state.language}"]` });
}

function observeZone(zoneId) {
  if (!BRIDGE_COMPETENCE.expectedOrder.includes(zoneId)) return;
  observedZones.add(zoneId);
  render({ focus: `[data-observe-zone="${zoneId}"]` });
}

function handleSequence(zoneId) {
  const expected = BRIDGE_COMPETENCE.expectedOrder[state.sequenceIndex];
  if (!expected || !BRIDGE_COMPETENCE.expectedOrder.includes(zoneId)) return;

  if (zoneId !== expected) {
    state.help = translated(BRIDGE_COMPETENCE.helpMessages[expected]);
    state.nudgeZone = expected;
    state.lastCorrect = "";
    render({ focus: `[data-sequence-zone="${expected}"]` });
    return;
  }

  state.sequenceIndex += 1;
  state.help = "";
  state.nudgeZone = "";
  state.lastCorrect = zoneId;

  const nextExpected = BRIDGE_COMPETENCE.expectedOrder[state.sequenceIndex];
  render({
    focus: nextExpected
      ? `[data-sequence-zone="${nextExpected}"]`
      : '[data-action="explain"]',
  });
}

function updateAudioStatus(dictionary) {
  const status = labRoot?.querySelector("#bridge-audio-status");
  if (!status) return;
  status.textContent = translated(dictionary);
}

function speakInstructorPhrase() {
  if (!audioSupported()) {
    updateAudioStatus(UI.audioUnavailable);
    return;
  }

  const synth = window.speechSynthesis;
  const voices = synth.getVoices?.() || [];
  const frenchVoice =
    voices.find((voice) => voice.lang?.toLowerCase() === "fr-fr") ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("fr"));
  const utterance = new SpeechSynthesisUtterance(
    BRIDGE_COMPETENCE.instructorPhrase.fr,
  );

  utterance.lang = "fr-FR";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  if (frenchVoice) utterance.voice = frenchVoice;

  utterance.onstart = () =>
    updateAudioStatus(frenchVoice ? UI.audioPlaying : UI.audioFallback);
  utterance.onend = () => updateAudioStatus(UI.audioReady);
  utterance.onerror = (event) => {
    if (event.error !== "interrupted" && event.error !== "canceled") {
      updateAudioStatus(UI.audioError);
    }
  };

  synth.cancel();
  synth.speak(utterance);
}

function handleAction(action) {
  if (action === "start") {
    observedZones = new Set();
    state.sequenceIndex = 0;
    setScreen(1);
  } else if (action === "ready" && observedZones.size === 3) {
    state.sequenceIndex = 0;
    setScreen(2);
  } else if (action === "explain" && state.sequenceIndex === 3) {
    setScreen(3);
  } else if (action === "phrase") {
    setScreen(4);
  } else if (action === "finish") {
    setScreen(5);
  } else if (action === "restart") {
    observedZones = new Set();
    state.sequenceIndex = 0;
    setScreen(0);
  } else if (action === "back") {
    setScreen(Math.max(0, state.screen - 1));
  }
}

labRoot?.addEventListener("click", (event) => {
  const languageButton = event.target.closest("[data-language]");
  if (languageButton) {
    selectLanguage(languageButton.dataset.language);
    return;
  }

  const observationButton = event.target.closest("[data-observe-zone]");
  if (observationButton) {
    observeZone(observationButton.dataset.observeZone);
    return;
  }

  const sequenceButton = event.target.closest("[data-sequence-zone]");
  if (sequenceButton) {
    handleSequence(sequenceButton.dataset.sequenceZone);
    return;
  }

  const audioButton = event.target.closest("[data-audio]");
  if (audioButton && !audioButton.disabled) {
    speakInstructorPhrase();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton && !actionButton.disabled) {
    handleAction(actionButton.dataset.action);
  }
});

window.addEventListener("pagehide", () => window.speechSynthesis?.cancel?.());

render();
