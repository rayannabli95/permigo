// ═══════════════════════════════════════════════════════════════
// LE LABO DE LA CONDUITE — le moteur.
//
// Il enchaîne les étapes, gère la langue, l'audio et la progression. Il ne
// sait rien du contenu : tout vient d'un preset. Ajouter une compétence ne
// demande donc aucune ligne ici.
//
// Le parcours dépend du décor :
//   cockpit → intro · repérer · refaire · comprendre · écouter · c'est prêt
//   route   → intro · décider · comprendre · écouter · c'est prêt
// ═══════════════════════════════════════════════════════════════
import "./labo.css";
import { LANGUES, PRESETS, getPreset } from "./presets.js";
import { renderScene, renderIle } from "./scenes.js";

const CLE_LANGUE = "permigo_labo_langue";
const CLE_ETAT = "permigo_labo_etat";

// Libellés de l'interface. Le contenu pédagogique, lui, vit dans presets.js.
const T = {
  labo: {
    fr: "Le labo de la conduite",
    en: "The driving lab",
    ar: "مختبر القيادة",
  },
  etape: { fr: "Étape", en: "Step", ar: "المرحلة" },
  sur: { fr: "sur", en: "of", ar: "من" },
  commencer: { fr: "Commencer", en: "Start", ar: "ابدأ" },
  retour: { fr: "Revenir", en: "Back", ar: "رجوع" },
  repererTitre: {
    fr: "Observe autour de toi",
    en: "Look around you",
    ar: "انظر حولك",
  },
  repererAide: {
    fr: "Explore les trois zones avant de continuer.",
    en: "Explore the three areas before continuing.",
    ar: "استكشف المناطق الثلاث قبل المتابعة.",
  },
  reperee: { fr: "Zone repérée", en: "Area spotted", ar: "تم تحديد المنطقة" },
  pret: { fr: "Je suis prêt", en: "I’m ready", ar: "أنا مستعد" },
  refaireTitre: { fr: "À toi de jouer", en: "Your turn", ar: "حان دورك" },
  sequenceOk: {
    fr: "Le geste est complet.",
    en: "The sequence is complete.",
    ar: "اكتملت الحركة.",
  },
  deciderTitre: { fr: "À toi de décider", en: "Your call", ar: "القرار لك" },
  bonneReponse: {
    fr: "C’est bien elle.",
    en: "That’s the one.",
    ar: "إنها هي بالضبط.",
  },
  mauvaiseReponse: {
    fr: "Pas celle-ci. Regarde qui arrive sur ta droite.",
    en: "Not that one. Look at who is coming from your right.",
    ar: "ليست هذه. انظر من يأتي عن يمينك.",
  },
  comprendre: {
    fr: "Comprendre le geste",
    en: "Understand the action",
    ar: "افهم الحركة",
  },
  continuer: { fr: "Continuer", en: "Continue", ar: "متابعة" },
  expTitre: {
    fr: "Le geste qui protège",
    en: "The action that keeps you safe",
    ar: "الحركة التي تحميك",
  },
  vo: {
    fr: "Français d’origine",
    en: "Original French",
    ar: "النص الفرنسي الأصلي",
  },
  motCle: {
    fr: "Mot à reconnaître",
    en: "Word to recognise",
    ar: "كلمة يجب التعرّف عليها",
  },
  dansLaVoiture: {
    fr: "Dans la voiture",
    en: "In the car",
    ar: "داخل السيارة",
  },
  moniteurDira: {
    fr: "Ton moniteur dira peut-être :",
    en: "Your instructor may say:",
    ar: "قد يقول مدرّبك:",
  },
  traduction: { fr: "Traduction", en: "Translation", ar: "الترجمة" },
  ecouter: { fr: "Écouter", en: "Listen", ar: "استمع" },
  reecouter: { fr: "Réécouter", en: "Listen again", ar: "استمع مجددًا" },
  audioLibre: {
    fr: "L’audio est facultatif.",
    en: "Audio is optional.",
    ar: "الصوت اختياري.",
  },
  audioJoue: {
    fr: "Lecture de la phrase française.",
    en: "Playing the French phrase.",
    ar: "يتم تشغيل العبارة الفرنسية.",
  },
  audioRepli: {
    fr: "Aucune voix française dédiée : la voix du navigateur est utilisée.",
    en: "No dedicated French voice: using the browser’s default voice.",
    ar: "لا يتوفر صوت فرنسي مخصص: سيُستخدم صوت المتصفح الافتراضي.",
  },
  audioAbsent: {
    fr: "La lecture audio n’est pas disponible sur ce navigateur.",
    en: "Audio playback is not available in this browser.",
    ar: "التشغيل الصوتي غير متاح في هذا المتصفح.",
  },
  terminer: { fr: "Terminer", en: "Finish", ar: "إنهاء" },
  validation: {
    fr: "Tu reconnaîtras maintenant cette consigne dans la voiture.",
    en: "You will now recognise this instruction in the car.",
    ar: "ستتعرّف الآن على هذه التعليمة داخل السيارة.",
  },
  pretLecon: {
    fr: "Prêt pour ta leçon",
    en: "Ready for your lesson",
    ar: "مستعد لدرسك",
  },
  recommencer: { fr: "Recommencer", en: "Start again", ar: "ابدأ من جديد" },
  autre: { fr: "Un autre exercice", en: "Another exercise", ar: "تمرين آخر" },
};

let racine = null;
let preset = PRESETS[0];
let etat = charger();
let reperees = new Set();

function esc(v) {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function langueSure(v) {
  return Object.hasOwn(LANGUES, v) ? v : "fr";
}
function lire(cle) {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}
function ecrire(cle, val) {
  try {
    localStorage.setItem(cle, val);
  } catch {
    /* le labo reste utilisable sans stockage */
  }
}
function charger() {
  let s = {};
  try {
    s = JSON.parse(lire(CLE_ETAT) || "{}");
  } catch {
    s = {};
  }
  return {
    langue: langueSure(lire(CLE_LANGUE)),
    ecran: 0,
    index: 0,
    aide: "",
    signale: "",
    choisi: "",
    juste: null,
    ecoute: false,
    presetId: s.presetId || PRESETS[0].id,
  };
}
function sauver() {
  ecrire(CLE_LANGUE, etat.langue);
  ecrire(CLE_ETAT, JSON.stringify({ presetId: preset.id }));
}

/** Traduction avec repli sur le français : un preset partiel reste lisible. */
function t(dico, langue = etat.langue) {
  return dico?.[langue] || dico?.fr || "";
}
function attrsLangue(langue = etat.langue) {
  const d = LANGUES[langue];
  return `lang="${d.code}" dir="${d.dir}"`;
}

/** Les étapes du parcours dépendent du décor. */
function etapes() {
  return preset.scene === "route"
    ? ["intro", "decider", "expliquer", "ecouter", "fin"]
    : ["intro", "reperer", "refaire", "expliquer", "ecouter", "fin"];
}
function etapeCourante() {
  return etapes()[etat.ecran];
}

// ─── Coque ──────────────────────────────────────────────────────
function entete() {
  const boutons = Object.values(LANGUES)
    .map(
      (l) => `
      <button class="lb-langue${etat.langue === l.code ? " est-active" : ""}"
        type="button" data-langue="${l.code}" lang="${l.code}" dir="${l.dir}"
        aria-label="${esc(l.nom)}" aria-pressed="${etat.langue === l.code}">${l.label}</button>`,
    )
    .join("");
  return `
    <header class="lb-entete">
      <div class="lb-marque">
        <span class="lb-marque-pastille" aria-hidden="true"></span>
        <span>Le labo de la <strong>conduite</strong></span>
      </div>
      <div class="lb-langues" role="group" aria-label="Langue · Language · اللغة">${boutons}</div>
    </header>`;
}

function progression() {
  const n = etapes().length;
  const i = etat.ecran + 1;
  const txt = `${t(T.etape)} ${i} ${t(T.sur)} ${n}`;
  return `
    <div class="lb-progression" aria-label="${esc(txt)}">
      <span class="lb-progression-txt" ${attrsLangue()}>${esc(txt)}</span>
      <div class="lb-progression-rail" aria-hidden="true"><span style="width:${(i / n) * 100}%"></span></div>
    </div>`;
}

function boutonRetour() {
  if (etat.ecran === 0 || etapeCourante() === "fin") return "";
  return `
    <button class="lb-retour" type="button" data-action="retour" aria-label="${esc(t(T.retour))}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      <span ${attrsLangue()}>${esc(t(T.retour))}</span>
    </button>`;
}

function cta(action, libelle) {
  return ctaVerrouille(action, libelle, false);
}

/**
 * Même bouton, mais grisé tant que l'étape n'est pas finie. On l'affiche
 * quand même : s'il n'apparaissait qu'à la fin, toute la page se décalerait
 * d'un coup au dernier clic.
 */
function ctaVerrouille(action, libelle, verrouille) {
  return `
    <button class="lb-cta" type="button" data-action="${action}"${verrouille ? " disabled" : ""}>
      <span ${attrsLangue()}>${esc(libelle)}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
    </button>`;
}

// ─── Étapes ─────────────────────────────────────────────────────
function ecranIntro() {
  return `
    <section class="lb-ecran lb-intro" data-ecran="intro">
      <div class="lb-kicker" ${attrsLangue()}>${esc(t(T.labo))}</div>
      ${renderIle()}
      <div class="lb-copie">
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(preset.titre))}</h1>
        <p ${attrsLangue()}>${esc(t(preset.intro))}</p>
      </div>
      ${cta("commencer", t(T.commencer))}
    </section>`;
}

function ecranReperer() {
  const n = reperees.size;
  const total = preset.zones.length;
  const msg = n ? `${t(T.reperee)} · ${n}/${total}` : t(T.repererAide);
  return `
    <section class="lb-ecran" data-ecran="reperer">
      <div class="lb-copie lb-copie-serree">
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(T.repererTitre))}</h1>
        <p ${attrsLangue()}>${esc(t(preset.consigne))}</p>
      </div>
      ${renderScene(preset, { langue: etat.langue, reperees })}
      <div class="lb-etat" aria-live="polite" ${attrsLangue()}>${esc(msg)}</div>
      <button class="lb-cta" type="button" data-action="pret" ${n < total ? "disabled" : ""}>
        <span ${attrsLangue()}>${esc(t(T.pret))}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </section>`;
}

function ecranRefaire() {
  const fini = etat.index === preset.ordre.length;
  const faites = new Set(preset.ordre.slice(0, etat.index));
  const jetons = preset.ordre
    .slice(0, etat.index)
    .map((id, i) => {
      const z = preset.zones.find((x) => x.id === id);
      return `<span class="lb-jeton"><span aria-hidden="true">${i + 1}</span><span ${attrsLangue()}>${esc(t(z.label))}</span></span>`;
    })
    .join("");
  const message = fini ? t(T.sequenceOk) : etat.aide || t(T.repererAide);
  return `
    <section class="lb-ecran" data-ecran="refaire">
      <div class="lb-copie lb-copie-serree">
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(T.refaireTitre))}</h1>
        <p ${attrsLangue()}>${esc(t(preset.consigne))}</p>
      </div>
      ${renderScene(preset, {
        langue: etat.langue,
        faites,
        interactif: true,
        attendue: preset.ordre[etat.index] || null,
        signale: etat.signale,
      })}
      <div class="lb-jetons">${jetons}</div>
      <div class="lb-retour-info${etat.aide ? " a-de-l-aide" : ""}${fini ? " est-fini" : ""}" aria-live="polite" ${attrsLangue()}>${esc(message)}</div>
      ${ctaVerrouille("expliquer", t(T.comprendre), !fini)}
    </section>`;
}

function ecranDecider() {
  const repondu = etat.juste !== null;
  const message = !repondu
    ? t(preset.consigne)
    : etat.juste
      ? t(T.bonneReponse)
      : t(T.mauvaiseReponse);
  return `
    <section class="lb-ecran" data-ecran="decider">
      <div class="lb-copie lb-copie-serree">
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(T.deciderTitre))}</h1>
        <p ${attrsLangue()}>${esc(t(preset.consigne))}</p>
      </div>
      ${renderScene(preset, {
        langue: etat.langue,
        selectionnable: !etat.juste,
        choisi: etat.choisi,
        juste: etat.juste,
      })}
      <div class="lb-retour-info${repondu && !etat.juste ? " a-de-l-aide" : ""}${etat.juste ? " est-fini" : ""}" aria-live="polite" ${attrsLangue()}>${esc(message)}</div>
      ${ctaVerrouille("expliquer", t(T.comprendre), !etat.juste)}
    </section>`;
}

function blocBilingue(texte, vo) {
  const montrerVo = etat.langue !== "fr";
  return `
    <div class="lb-bilingue">
      <p class="lb-texte-principal" ${attrsLangue()}>${esc(texte)}</p>
      ${
        montrerVo
          ? `<div class="lb-vo"><span ${attrsLangue()}>${esc(t(T.vo))}</span><p lang="fr" dir="ltr">${esc(vo)}</p></div>`
          : ""
      }
    </div>`;
}

function ecranExpliquer() {
  const mot = t(preset.motCle);
  const regle = preset.regle ? t(preset.regle) : "";
  return `
    <section class="lb-ecran" data-ecran="expliquer">
      <div class="lb-symbole" aria-hidden="true"><span></span>
        <svg viewBox="0 0 64 64"><path d="M15 45c2-17 10-26 24-26M38 12l5 7-8 3"/></svg>
      </div>
      <div class="lb-copie lb-copie-serree">
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(T.expTitre))}</h1>
      </div>
      ${blocBilingue(t(preset.explication), preset.explication.fr)}
      ${regle ? `<p class="lb-regle" ${attrsLangue()}>${esc(regle)}</p>` : ""}
      <div class="lb-mot">
        <span class="lb-mot-libelle" ${attrsLangue()}>${esc(t(T.motCle))}</span>
        <strong ${attrsLangue()}>${esc(mot)}${etat.langue === "fr" ? "" : ` · <bdi lang="fr" dir="ltr">${esc(preset.motCle.fr)}</bdi>`}</strong>
      </div>
      ${cta("ecouter", t(T.continuer))}
    </section>`;
}

function audioDispo() {
  return (
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

function ecranEcouter() {
  const ok = audioDispo();
  const trad =
    etat.langue === "fr" ? preset.phraseMoniteur.fr : t(preset.phraseMoniteur);
  return `
    <section class="lb-ecran" data-ecran="ecouter">
      <div class="lb-symbole lb-symbole-audio" aria-hidden="true">
        <svg viewBox="0 0 64 64"><path d="M12 38h11l15 12V14L23 26H12Z"/><path d="M46 24c4 5 4 11 0 16M52 17c8 9 8 21 0 30"/></svg>
      </div>
      <div class="lb-copie lb-copie-serree">
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(T.dansLaVoiture))}</h1>
        <p ${attrsLangue()}>${esc(t(T.moniteurDira))}</p>
      </div>
      <blockquote class="lb-phrase" lang="fr" dir="ltr">« ${esc(preset.phraseMoniteur.fr)} »</blockquote>
      <div class="lb-traduction">
        <span ${attrsLangue()}>${esc(t(T.traduction))}</span>
        <p ${attrsLangue()}>${esc(trad)}</p>
      </div>
      <div class="lb-audio-actions">
        <button id="lb-audio-btn" class="lb-audio" type="button" data-audio="1" ${ok ? "" : "disabled"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9v6h4l5 4V5l-5 4Zm12 0c2 2 2 4 0 6"/></svg>
          <span ${attrsLangue()}>${esc(t(etat.ecoute ? T.reecouter : T.ecouter))}</span>
        </button>
      </div>
      <p id="lb-audio-etat" class="lb-audio-etat" aria-live="polite" ${attrsLangue()}>${esc(t(ok ? T.audioLibre : T.audioAbsent))}</p>
      ${cta("terminer", t(T.terminer))}
    </section>`;
}

function ecranFin() {
  const autres = PRESETS.filter((p) => p.id !== preset.id);
  return `
    <section class="lb-ecran lb-fin" data-ecran="fin">
      ${renderIle({ reussi: true })}
      <div class="lb-coche" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg></div>
      <div class="lb-copie">
        <p class="lb-validation" ${attrsLangue()}>${esc(t(T.validation))}</p>
        <h1 id="lb-titre" ${attrsLangue()}>${esc(t(T.pretLecon))}</h1>
      </div>
      <button class="lb-secondaire" type="button" data-action="recommencer">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/></svg>
        <span ${attrsLangue()}>${esc(t(T.recommencer))}</span>
      </button>
      ${
        autres.length
          ? `<div class="lb-autres">
              <span ${attrsLangue()}>${esc(t(T.autre))}</span>
              ${autres.map((p) => `<button class="lb-autre" type="button" data-preset="${esc(p.id)}" ${attrsLangue()}>${esc(t(p.titre))}</button>`).join("")}
            </div>`
          : ""
      }
    </section>`;
}

const ECRANS = {
  intro: ecranIntro,
  reperer: ecranReperer,
  refaire: ecranRefaire,
  decider: ecranDecider,
  expliquer: ecranExpliquer,
  ecouter: ecranEcouter,
  fin: ecranFin,
};

// ─── Rendu + interactions ───────────────────────────────────────
function rendre({ focus = "#lb-titre" } = {}) {
  if (!racine) return;
  document.documentElement.lang = etat.langue;
  document.documentElement.dir = "ltr"; // l'app reste LTR, le RTL est par bloc
  sauver();
  racine.innerHTML = `
    ${entete()}
    <div class="lb-scene">
      ${progression()}
      ${boutonRetour()}
      ${ECRANS[etapeCourante()]()}
    </div>`;
  requestAnimationFrame(() => {
    const cible = focus ? racine.querySelector(focus) : null;
    if (!cible) return;
    if (!cible.matches("button,[href],input,select,textarea,[tabindex]"))
      cible.setAttribute("tabindex", "-1");
    cible.focus({ preventScroll: true });
  });
}

function allerA(i) {
  window.speechSynthesis?.cancel?.();
  etat.ecran = i;
  etat.aide = "";
  etat.signale = "";
  rendre();
}

function choisirLangue(l) {
  etat.langue = langueSure(l);
  rendre({ focus: `[data-langue="${etat.langue}"]` });
}

function repererZone(id) {
  if (!preset.zones?.some((z) => z.id === id)) return;
  reperees.add(id);
  rendre({ focus: `[data-repere="${id}"]` });
}

function jouerSequence(id) {
  const attendue = preset.ordre[etat.index];
  if (!attendue) return;
  if (id !== attendue) {
    const z = preset.zones.find((x) => x.id === attendue);
    etat.aide = t(z.aide);
    etat.signale = attendue;
    rendre({ focus: `[data-sequence="${attendue}"]` });
    return;
  }
  etat.index += 1;
  etat.aide = "";
  etat.signale = "";
  const suivante = preset.ordre[etat.index];
  rendre({
    focus: suivante
      ? `[data-sequence="${suivante}"]`
      : '[data-action="expliquer"]',
  });
}

function repondreVehicule(id) {
  if (etat.juste) return;
  etat.choisi = id;
  etat.juste = id === preset.reponse;
  rendre({ focus: etat.juste ? '[data-action="expliquer"]' : "#lb-titre" });
}

function majAudio(dico) {
  const el = racine?.querySelector("#lb-audio-etat");
  if (el) el.textContent = t(dico);
}

function direPhrase() {
  if (!audioDispo()) return majAudio(T.audioAbsent);
  // Une seule touche : elle devient « Réécouter » après la première lecture.
  etat.ecoute = true;
  const btn = racine?.querySelector("#lb-audio-btn span");
  if (btn) btn.textContent = t(T.reecouter);
  const synth = window.speechSynthesis;
  const voix = synth.getVoices?.() || [];
  const fr =
    voix.find((v) => v.lang?.toLowerCase() === "fr-fr") ||
    voix.find((v) => v.lang?.toLowerCase().startsWith("fr"));
  const u = new SpeechSynthesisUtterance(preset.phraseMoniteur.fr);
  u.lang = "fr-FR";
  u.rate = 0.88;
  if (fr) u.voice = fr;
  u.onstart = () => majAudio(fr ? T.audioJoue : T.audioRepli);
  u.onend = () => majAudio(T.audioLibre);
  synth.cancel();
  synth.speak(u);
}

function chargerPreset(id) {
  preset = getPreset(id);
  reperees = new Set();
  etat.index = 0;
  etat.choisi = "";
  etat.juste = null;
  allerA(0);
}

function action(nom) {
  const suite = etapes();
  if (nom === "commencer") {
    reperees = new Set();
    etat.index = 0;
    etat.choisi = "";
    etat.juste = null;
    allerA(1);
  } else if (nom === "pret" && reperees.size === preset.zones.length) {
    etat.index = 0;
    allerA(suite.indexOf("refaire"));
  } else if (nom === "expliquer") {
    allerA(suite.indexOf("expliquer"));
  } else if (nom === "ecouter") {
    allerA(suite.indexOf("ecouter"));
  } else if (nom === "terminer") {
    allerA(suite.indexOf("fin"));
  } else if (nom === "recommencer") {
    chargerPreset(preset.id);
  } else if (nom === "retour") {
    allerA(Math.max(0, etat.ecran - 1));
  }
}

export function monter(el, presetId) {
  racine = el;
  preset = getPreset(presetId || etat.presetId);
  racine.addEventListener("click", (e) => {
    const l = e.target.closest("[data-langue]");
    if (l) return choisirLangue(l.dataset.langue);
    const p = e.target.closest("[data-preset]");
    if (p) return chargerPreset(p.dataset.preset);
    const r = e.target.closest("[data-repere]");
    if (r) return repererZone(r.dataset.repere);
    const s = e.target.closest("[data-sequence]");
    if (s) return jouerSequence(s.dataset.sequence);
    // data-hit : la zone de clic posée sur les véhicules par le moteur
    // isométrique de « En situation ».
    const v = e.target.closest("[data-vehicule],[data-hit]");
    if (v) return repondreVehicule(v.dataset.vehicule || v.dataset.hit);
    const a = e.target.closest("[data-audio]");
    if (a && !a.disabled) return direPhrase();
    const b = e.target.closest("[data-action]");
    if (b && !b.disabled) action(b.dataset.action);
  });
  window.addEventListener("pagehide", () => window.speechSynthesis?.cancel?.());
  rendre();
}
