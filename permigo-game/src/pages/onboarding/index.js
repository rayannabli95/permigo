// ═══════════════════════════════════════════════════════════════
// Onboarding élève — écrans mascotte, un par un.
//
// Un tour en étapes plein écran (fini le scroll unique) : chaque écran
// montre une pose de la mascotte, une phrase courte, une seule décision.
// La barre de progression avance à chaque étape (plus au scroll). Le
// bouton « Continuer »/« C'est parti » reste collé en bas, identique sur
// toutes les étapes.
//
// Étapes :
//   0 intro               — « Salut {prenom} ! » + mascotte + pitch coach.
//   1 « Ton style »        — avatar + couleur d'accent, sur un seul écran.
//   2 « Tes rappels du soir » — toggle (ON = demande permission notif)
//                               + carte récompense (coffre / XP / volants).
//   3 « Ajoute l'appli »   — A2HS, seulement si pas déjà installée.
//
// 2 finitions selon le thème global (html[data-theme]) :
//   • défaut / dark  → Arène nuit-violet (Archivo, plastique 3D, or).
//   • light          → Clair premium (Archivo, ombres douces).
//
// Au FINISH : patch profil (first_value_action_at, avatar, accent),
// unlockChest("welcome", {xp:50,gemmes:25}), flag localStorage, → #/.
// A11y : nav clavier sur les contrôles + flèches dans la grille avatars,
// focus déplacé sur le titre de l'étape à chaque changement.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { esc, escAttr, safeCssColor } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { ASSETS, optimizedAvatarUrl } from "@/utils/assets.js";
import { haptic } from "@/utils/haptic.js";
import {
  isStandalone,
  guessPlatform,
  canPromptInstall,
  promptInstall,
} from "@/utils/pwa.js";
import { optInPush } from "@/services/web-push.js";
import { unlockChest } from "@/utils/game-state.js";
import { ACCENTS, getAccent, setAccent } from "@/utils/accent.js";
import { a2hsStepsHTML, A2HS_STYLE } from "@/components/common/a2hs-steps.js";
import { getLang } from "@/utils/lang.js";

// ─── i18n (coque de l'onboarding) — traduction seule, repli FR systématique.
// « moniteur » = instructor / مدرّب · « volants » = steering wheels / مقود ·
// marque = PermiGo (بيرميغو en prose arabe, comme accueil.js/settings.js). Le
// détail des étapes « Ajoute l'appli » vient du composant partagé a2hs-steps
// (hors périmètre) et reste en français. ───
const OB_I18N = {
  en: {
    dialog_aria: "Welcome tour",
    prog_aria: "Progress",
    skip: "Skip",
    skip_aria: "Skip the intro",
    bubble_intro: "Hi. I'm PermiGo.",
    hero_lead:
      "<b>30 seconds</b> to set up your app. Then, <b>2 minutes</b> every evening.",
    sec_avatar: "Your style",
    avatar_group_aria: "Choose your avatar",
    avatar_item_aria: "Avatar {n}",
    avatar_helper: "Choose your avatar",
    color_label: "Your colour",
    color_group_aria: "Choose your colour",
    bubble_look: "Pick your style.",
    sec_reminders: "Your evening reminders",
    bubble_notif: "Never spam. Promise.",
    rem_title: "Reminder every evening",
    rem_sub: "8 pm · gentle and never spam",
    rem_switch_aria: "Turn on evening reminders",
    rem_note:
      "<b>3 questions every evening, 2 minutes</b>. That's what really makes you progress.",
    reward_aria: "Welcome chest: 50 XP and 25 steering wheels",
    reward_tag: "Reward",
    reward_title: "A chest is waiting for you tonight",
    pill_vol: "25&nbsp;steering wheels",
    sec_a2hs: "Add the app",
    bubble_a2hs: "Last step.",
    a2hs_lead:
      "<b>2 taps, 10 seconds</b>. Your reminders and rewards land right here.",
    a2hs_plat_aria: "Switch the instructions platform (iPhone / Android)",
    cta: "Let's go",
    cta_continue: "Continue",
    notif_on_note: "<b>Reminders on</b>. See you tonight!",
    notif_on_announce: "Reminders on! You'll get 3 questions tonight.",
    notif_denied_note:
      "Blocked. Turn them on in settings if you change your mind.",
    notif_denied_announce:
      "Reminders not turned on. You can enable them later in settings.",
    a2hs_install: "Install the app in 1 tap",
    a2hs_installing: "Installing…",
    plat_android: "On Android?",
    plat_iphone: "On iPhone?",
    cta_going: "Let's go…",
    chest_title: "Welcome to PermiGo!",
    greet_generic: "there",
  },
  ar: {
    dialog_aria: "جولة ترحيب",
    prog_aria: "التقدّم",
    skip: "تخطّي",
    skip_aria: "تخطّي المقدّمة",
    bubble_intro: "مرحباً. أنا بيرميغو.",
    hero_lead: "<b>30 ثانية</b> لتجهيز تطبيقك. بعدها، <b>دقيقتان</b> كل مساء.",
    sec_avatar: "أسلوبك",
    avatar_group_aria: "اختر صورتك الرمزية",
    avatar_item_aria: "صورة رمزية {n}",
    avatar_helper: "اختر صورتك الرمزية",
    color_label: "لونك",
    color_group_aria: "اختر لونك",
    bubble_look: "اختر أسلوبك.",
    sec_reminders: "تذكيراتك المسائية",
    bubble_notif: "بلا إزعاج. وعد.",
    rem_title: "تذكير كل مساء",
    rem_sub: "الساعة 20 · لطيف ودون إزعاج",
    rem_switch_aria: "تفعيل التذكيرات المسائية",
    rem_note: "<b>3 أسئلة كل مساء، دقيقتان</b>. هذا ما يجعلك تتقدّم فعلاً.",
    reward_aria: "صندوق ترحيب: 50 XP و25 مقوداً",
    reward_tag: "مكافأة",
    reward_title: "صندوق ينتظرك هذا المساء",
    pill_vol: "25&nbsp;مقوداً",
    sec_a2hs: "أضِف التطبيق",
    bubble_a2hs: "الخطوة الأخيرة.",
    a2hs_lead: "<b>لمستان، 10 ثوانٍ</b>. تذكيراتك ومكافآتك تصل إلى هنا.",
    a2hs_plat_aria: "تغيير منصّة التعليمات (iPhone / Android)",
    cta: "لننطلق",
    cta_continue: "متابعة",
    notif_on_note: "<b>التذكيرات مفعّلة</b>. إلى اللقاء هذا المساء!",
    notif_on_announce: "التذكيرات مفعّلة! ستصلك 3 أسئلة هذا المساء.",
    notif_denied_note: "محظورة. فعّلها من الإعدادات إن غيّرت رأيك.",
    notif_denied_announce:
      "التذكيرات غير مفعّلة. يمكنك تفعيلها لاحقاً من الإعدادات.",
    a2hs_install: "ثبّت التطبيق بلمسة واحدة",
    a2hs_installing: "جارٍ التثبيت…",
    plat_android: "تستعمل Android؟",
    plat_iphone: "تستعمل iPhone؟",
    cta_going: "لننطلق…",
    chest_title: "مرحباً بك في بيرميغو!",
    greet_generic: "بك",
  },
};
function obR(key, fr) {
  const l = getLang();
  return (l !== "fr" && OB_I18N[l]?.[key]) || fr;
}
function ob(key, fr) {
  return esc(obR(key, fr));
}
// Salutation localisée : le prénom (déjà échappé) est injecté tel quel.
function obGreet(n) {
  const l = getLang();
  if (l === "en") return `Hi ${n}!`;
  if (l === "ar") return `مرحباً ${n}!`;
  return `Salut, ${n}&nbsp;!`;
}

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("onboarding.start", { role: me.role, version: "v5-steps" });

  // Opt-in notif : possible si l'API existe et que ce n'est pas déjà accordé.
  const showNotif =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Notification.permission !== "granted";

  // A2HS : étape conditionnelle (uniquement si pas déjà installée).
  const showA2HS = !isStandalone();

  // ⚠️ Plus AUCUNE identité demandée ici (01/08/2026). Ni prénom, ni nom, ni
  // date de naissance : ce tour de bienvenue ne doit rien réclamer avant que
  // l'élève ait vu le produit. La date de naissance est demandée par une carte
  // posée dans l'accueil (birthdate-card.js), le prénom au premier classement
  // (identity-prompt.js). Les deux marchent quel que soit le chemin d'entrée,
  // formulaire ou « Continuer avec Google ».
  const secN = { avatar: 1, notif: 2, a2hs: 3 };
  const STEPS = ["intro", "avatar", "notif", ...(showA2HS ? ["a2hs"] : [])];

  // ─── État ──────────────────────────────────────────────────────
  const currentAvatar = optimizedAvatarUrl(me.avatar_url);
  let avatar =
    currentAvatar && ASSETS.avatar?.includes(currentAvatar)
      ? currentAvatar
      : ASSETS.avatar?.[0] || null;
  let accentId = getAccent();
  let a2hsPlat = guessPlatform() === "android" ? "android" : "ios";

  // Toggle rappels : ON par défaut. notifWanted reflète l'intention de l'utilisateur.
  let notifWanted = showNotif; // si déjà accordé / indispo → rien à demander
  let notifAsked = false; // permission déjà demandée durant cette session
  let finishing = false;

  // Prénom affiché : tant que l'élève n'a pas donné le sien, le déclencheur DB
  // a posé le préfixe de son email. On ne salue PAS quelqu'un par « yanis27 » :
  // dans ce cas on reste sur un « toi » traduit.
  const emailPrefix = (me.email || "").split("@")[0];
  const realPrenom = me.prenom && me.prenom !== emailPrefix ? me.prenom : null;
  const prenom = realPrenom ? esc(realPrenom) : ob("greet_generic", "toi");
  const arrow = getLang() === "ar" ? "←" : "→";
  const ctaHTML = () =>
    `${ob("cta", "C'est parti")} <span class="ob-arrow" aria-hidden="true">${arrow}</span>`;
  const continueHTML = () =>
    `${ob("cta_continue", "Continuer")} <span class="ob-arrow" aria-hidden="true">${arrow}</span>`;
  const dockLabel = (i) =>
    i === STEPS.length - 1 ? ctaHTML() : continueHTML();

  // Poses mascotte + phrase courte par étape (même esprit que #/rejoindre :
  // une pose, une bulle, une seule décision).
  const STEP_META = {
    intro: {
      mascot: "/skins/mascot-hello.png",
      bubble: ob("bubble_intro", "Salut. Moi c'est PermiGo."),
    },
    avatar: {
      mascot: "/skins/mascot-point.png",
      bubble: ob("bubble_look", "Choisis ton style."),
    },
    notif: {
      mascot: "/skins/mascot-think.png",
      bubble: ob("bubble_notif", "Jamais de spam. Promis."),
    },
    a2hs: {
      mascot: "/skins/mascot-celebrate.png",
      bubble: ob("bubble_a2hs", "Dernière étape."),
    },
  };

  // ─── Rendu HTML ────────────────────────────────────────────────
  root.innerHTML = `
    ${STYLE}
    <style>${A2HS_STYLE}</style>
    <div class="ob" role="dialog" aria-modal="true" aria-label="${ob("dialog_aria", "Tour de bienvenue")}">

      <!-- Barre de progression (par étape) + Passer -->
      <div class="ob-top">
        <div class="ob-prog" role="progressbar" aria-label="${ob("prog_aria", "Progression")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <i id="ob-prog-fill" style="width:8%"></i>
        </div>
        <button class="ob-skip" id="ob-skip" type="button" aria-label="${ob("skip_aria", "Passer l'introduction")}">${ob("skip", "Passer")}</button>
      </div>

      <!-- Annonces a11y -->
      <div id="ob-live" aria-live="polite" aria-atomic="true" class="sr-only"></div>

      <div class="ob-stage" id="ob-stage">

        <!-- ─── ÉTAPE : accueil ─── -->
        <section class="ob-scr" data-key="intro" aria-labelledby="ob-h1-intro">
          <div class="ob-scr-hero">
            <div class="ob-bubble">${STEP_META.intro.bubble}</div>
            <div class="ob-mascot-wrap">
              <img class="ob-mascot" src="${STEP_META.intro.mascot}" alt="" />
            </div>
          </div>
          <div class="ob-scr-body ob-scr-body-center">
            <h1 class="ob-h1" id="ob-h1-intro">${obGreet(prenom)}</h1>
            <p class="ob-lead">${obR("hero_lead", "<b>30&nbsp;secondes</b> pour préparer ton appli. Ensuite, <b>2&nbsp;minutes</b> chaque soir.")}</p>
          </div>
        </section>

        <!-- ─── ÉTAPE : Ton style ─── -->
        <section class="ob-scr" data-key="avatar" hidden aria-labelledby="ob-h1-avatar">
          <div class="ob-scr-hero">
            <div class="ob-bubble">${STEP_META.avatar.bubble}</div>
            <div class="ob-mascot-wrap">
              <img class="ob-mascot" src="${STEP_META.avatar.mascot}" alt="" />
            </div>
          </div>
          <div class="ob-scr-body">
            <div class="ob-sec-head">
              <span class="ob-sec-num">${secN.avatar}</span>
              <h2 class="ob-sec-title" id="ob-h1-avatar">${ob("sec_avatar", "Ton style")}</h2>
            </div>
            <div class="ob-av-grid" id="ob-av-grid" role="radiogroup" aria-label="${ob("avatar_group_aria", "Choix de l'avatar")}">
              ${(ASSETS.avatar || [])
                .map(
                  (url, i) => `
                <button
                  class="ob-av${url === avatar ? " sel" : ""}"
                  data-url="${escAttr(url)}"
                  role="radio"
                  aria-checked="${url === avatar ? "true" : "false"}"
                  aria-label="${escAttr(obR("avatar_item_aria", "Avatar {n}").replace("{n}", i + 1))}"
                  type="button"
                >
                  <img class="ob-av-img" src="${escAttr(url)}" alt="" loading="lazy" />
                  <span class="ob-av-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </span>
                </button>`,
                )
                .join("")}
            </div>
            <p class="ob-helper">${ob("avatar_helper", "Choisis ton avatar")}</p>

            <p class="ob-color-label">${ob("color_label", "Ta couleur")}</p>
            <div class="ob-color-grid" id="ob-color-grid" role="radiogroup" aria-label="${ob("color_group_aria", "Choix de la couleur")}">
              ${ACCENTS.map(
                (c) => `
                <button
                  class="ob-color${c.id === accentId ? " sel" : ""}"
                  data-accent="${escAttr(c.id)}"
                  role="radio"
                  aria-checked="${c.id === accentId ? "true" : "false"}"
                  aria-label="${escAttr(c.name)}"
                  type="button"
                  style="${escAttr(`--sw:${safeCssColor(c.a, "#6c63ff")};--sw-dk:${safeCssColor(c.adk, "#4a3fc9")}`)}"
                >
                  <span class="ob-color-dot" aria-hidden="true"></span>
                </button>`,
              ).join("")}
            </div>
          </div>
        </section>

        <!-- ─── ÉTAPE : Tes rappels du soir ─── -->
        <section class="ob-scr" data-key="notif" hidden aria-labelledby="ob-h1-notif">
          <div class="ob-scr-hero">
            <div class="ob-bubble">${STEP_META.notif.bubble}</div>
            <div class="ob-mascot-wrap">
              <img class="ob-mascot" src="${STEP_META.notif.mascot}" alt="" />
            </div>
          </div>
          <div class="ob-scr-body">
            <div class="ob-sec-head">
              <span class="ob-sec-num">${secN.notif}</span>
              <h2 class="ob-sec-title" id="ob-h1-notif">${ob("sec_reminders", "Tes rappels du soir")}</h2>
            </div>

            <div class="ob-card">
              <div class="ob-toggle-row">
                <div class="ob-toggle-txt">
                  <div class="ob-toggle-tt">${ob("rem_title", "Rappel chaque soir")}</div>
                  <div class="ob-toggle-ts">${obR("rem_sub", "20&nbsp;h · doux et jamais spam")}</div>
                </div>
                <button
                  class="ob-switch${notifWanted ? "" : " off"}"
                  id="ob-switch"
                  type="button"
                  role="switch"
                  aria-checked="${notifWanted ? "true" : "false"}"
                  aria-label="${ob("rem_switch_aria", "Activer les rappels du soir")}"
                >
                  <span class="ob-knob" aria-hidden="true"></span>
                </button>
              </div>
              <p class="ob-micro" id="ob-notif-note">${obR("rem_note", "<b>3 questions chaque soir, 2 minutes</b>. C'est ce qui fait progresser pour de vrai.")}</p>
            </div>

            <!-- Carte récompense -->
            <div class="ob-reward" aria-label="${ob("reward_aria", "Coffre de bienvenue : 50 XP et 25 volants")}">
              <div class="ob-reward-chest">
                <img src="/skins/chest-closed.png" alt="" />
              </div>
              <div class="ob-reward-body">
                <div class="ob-reward-tag">${ob("reward_tag", "Récompense")}</div>
                <div class="ob-reward-title">${ob("reward_title", "Un coffre t'attend dès ce soir")}</div>
                <div class="ob-pills">
                  <span class="ob-pill ob-pill-xp"><span class="ob-xp-ic" aria-hidden="true">XP</span>50&nbsp;XP</span>
                  <span class="ob-pill ob-pill-vol"><img src="/skins/volant-coin.webp" alt="" />${obR("pill_vol", "25&nbsp;volants")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        ${
          showA2HS
            ? `
        <!-- ─── ÉTAPE : Ajoute l'appli ─── -->
        <section class="ob-scr" data-key="a2hs" hidden aria-labelledby="ob-h1-a2hs">
          <div class="ob-scr-hero">
            <div class="ob-bubble">${STEP_META.a2hs.bubble}</div>
            <div class="ob-mascot-wrap">
              <img class="ob-mascot" src="${STEP_META.a2hs.mascot}" alt="" />
            </div>
          </div>
          <div class="ob-scr-body">
            <div class="ob-sec-head">
              <span class="ob-sec-num">${secN.a2hs}</span>
              <h2 class="ob-sec-title" id="ob-h1-a2hs">${ob("sec_a2hs", "Ajoute l'appli")}</h2>
            </div>
            <div class="ob-install-head">
              <img class="ob-install-badge" src="/skins/avatars/permigo-badge-icon.png" alt="" />
              <p class="ob-install-lead">${obR("a2hs_lead", "<b>2 gestes, 10 secondes</b>. Tes rappels et tes récompenses arrivent ici.")}</p>
            </div>
            <div class="ob-a2hs-steps" id="ob-a2hs-steps"></div>
            <button class="ob-plat-switch" id="ob-plat-switch" type="button" aria-label="${ob("a2hs_plat_aria", "Changer la plateforme des instructions (iPhone / Android)")}"></button>
          </div>
        </section>`
            : ""
        }

      </div>

      <!-- Bouton sticky unique -->
      <div class="ob-dock">
        <button class="ob-cta" id="ob-cta" type="button">
          ${dockLabel(0)}
        </button>
      </div>
    </div>
  `;

  // ─── Références DOM ────────────────────────────────────────────
  const stageEl = root.querySelector("#ob-stage");
  const progFill = root.querySelector("#ob-prog-fill");
  const progBar = root.querySelector(".ob-prog");
  const ctaBtn = root.querySelector("#ob-cta");
  const switchBtn = root.querySelector("#ob-switch");
  const liveEl = root.querySelector("#ob-live");
  const panels = Array.from(stageEl.querySelectorAll(".ob-scr"));

  function announce(msg) {
    if (liveEl) liveEl.textContent = msg;
  }

  // ─── Navigation entre étapes (une visible à la fois) ───────────
  let cur = 0;
  let navBusy = false;
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function updateProgress(i) {
    const pct =
      STEPS.length > 1 ? Math.round(8 + (i / (STEPS.length - 1)) * 92) : 100;
    progFill.style.width = pct + "%";
    progBar.setAttribute("aria-valuenow", String(pct));
  }

  function paintDock() {
    ctaBtn.innerHTML = dockLabel(cur);
  }

  function focusStep(panel) {
    const h = panel?.querySelector('[id^="ob-h1-"]');
    if (!h) return;
    h.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => h.focus({ preventScroll: true }));
  }

  function goStep(n) {
    if (navBusy || n === cur || n < 0 || n >= panels.length) return;
    navBusy = true;
    const from = panels[cur];
    const to = panels[n];
    if (from) from.hidden = true;
    to.hidden = false;
    to.classList.remove("ob-scr-enter");
    if (!reduceMotion) {
      void to.offsetWidth; // relance l'animation d'entrée
      to.classList.add("ob-scr-enter");
    }
    cur = n;
    updateProgress(cur);
    paintDock();
    track("onboarding.step_viewed", { step: STEPS[cur] });
    focusStep(to);
    navBusy = false;
  }

  // ─── Toggle rappels (ON = demande permission notif) ────────────
  function setSwitch(on) {
    notifWanted = on;
    switchBtn.classList.toggle("off", !on);
    switchBtn.setAttribute("aria-checked", on ? "true" : "false");
  }

  // Demande de permission notif — reste synchrone dans le geste tactile (iOS).
  async function requestNotif() {
    if (!showNotif || notifAsked) return;
    notifAsked = true;
    const note = root.querySelector("#ob-notif-note");
    try {
      const granted = await optInPush();
      track("onboarding.push_optin", {
        outcome: granted ? "granted" : Notification.permission,
      });
      if (granted) {
        haptic("success");
        setSwitch(true);
        if (note)
          note.innerHTML = obR(
            "notif_on_note",
            "<b>Rappels activés</b>. À ce soir&nbsp;!",
          );
        announce(
          obR(
            "notif_on_announce",
            "Rappels activés ! Tu recevras 3 questions ce soir.",
          ),
        );
      } else {
        // Refusé / bloqué : le toggle reflète l'état réel (off).
        setSwitch(false);
        if (note && Notification.permission === "denied") {
          note.textContent = obR(
            "notif_denied_note",
            "Bloquées. Active-les dans les réglages si tu changes d'avis.",
          );
          announce(
            obR(
              "notif_denied_announce",
              "Rappels non activés. Tu peux les activer plus tard dans les réglages.",
            ),
          );
        }
      }
    } catch (e) {
      console.error("[onboarding] push opt-in failed", e);
    }
  }

  switchBtn.addEventListener("click", () => {
    haptic("tap");
    const next = !notifWanted;
    setSwitch(next);
    track("onboarding.reminder_toggle", { on: next });
    // Passage à ON → on tente la permission tout de suite (geste utilisateur).
    if (next && showNotif && !notifAsked) requestNotif();
  });

  // ─── Étape A2HS ──────────────────────────────────────────────
  function renderA2HSSteps() {
    const stepsEl = root.querySelector("#ob-a2hs-steps");
    if (!stepsEl) return;

    const nativeBtn =
      a2hsPlat === "android" && canPromptInstall()
        ? `<button class="ob-a2hs-install" id="ob-a2hs-install" type="button">${ob("a2hs_install", "Installer l'app en 1 tap")}</button>`
        : "";

    stepsEl.innerHTML = `${nativeBtn}${a2hsStepsHTML(a2hsPlat)}`;

    const sw = root.querySelector("#ob-plat-switch");
    if (sw) {
      sw.textContent =
        a2hsPlat === "ios"
          ? obR("plat_android", "Tu es sur Android ?")
          : obR("plat_iphone", "Tu es sur iPhone ?");
    }

    const ib = root.querySelector("#ob-a2hs-install");
    if (ib) {
      ib.addEventListener("click", async () => {
        ib.disabled = true;
        ib.textContent = obR("a2hs_installing", "Installation…");
        try {
          const outcome = await promptInstall();
          track("a2hs.install_prompt", { outcome, source: "onboarding" });
          if (outcome === "accepted") {
            finish();
            return;
          }
        } catch {
          /* best-effort */
        }
        ib.disabled = false;
        ib.textContent = obR("a2hs_install", "Installer l'app en 1 tap");
      });
    }
  }

  if (showA2HS) {
    renderA2HSSteps();
    root.querySelector("#ob-plat-switch")?.addEventListener("click", () => {
      a2hsPlat = a2hsPlat === "ios" ? "android" : "ios";
      track("a2hs.platform_selected", {
        platform: a2hsPlat,
        source: "onboarding",
      });
      renderA2HSSteps();
    });
  }

  // ─── Skip → finish direct (sans l'accroche : il veut aller vite) ──
  root.querySelector("#ob-skip")?.addEventListener("click", () => {
    track("onboarding.skipped", {});
    finish({ intro: false });
  });

  // ─── CTA principal : avance d'une étape, termine sur la dernière ──
  async function advance() {
    // En quittant l'étape rappels avec le toggle ON jamais sollicité (il n'a
    // pas touché le toggle ON par défaut), on demande la permission
    // MAINTENANT — reste dans le geste tactile — puis on avance/termine.
    if (STEPS[cur] === "notif" && notifWanted && showNotif && !notifAsked) {
      await requestNotif();
    }
    if (cur === STEPS.length - 1) {
      finish();
      return;
    }
    goStep(cur + 1);
  }
  ctaBtn.addEventListener("click", () => advance());

  // ─── Radiogroups a11y (avatar + couleur) ──────────────────────
  // Tabindex roving + navigation flèches : un seul élément focusable par
  // groupe (le sélectionné), les flèches déplacent sélection + focus.
  function wireRadioGroup(selector, onSelect, isSel) {
    const items = Array.from(root.querySelectorAll(selector));
    if (!items.length) return;

    const syncTabindex = () => {
      const selIdx = Math.max(
        0,
        items.findIndex((el) => isSel(el)),
      );
      items.forEach((el, i) =>
        el.setAttribute("tabindex", i === selIdx ? "0" : "-1"),
      );
    };

    const select = (el, { focus = false } = {}) => {
      onSelect(el);
      items.forEach((it) => {
        const on = isSel(it);
        it.classList.toggle("sel", on);
        it.setAttribute("aria-checked", on ? "true" : "false");
      });
      syncTabindex();
      if (focus) el.focus({ preventScroll: true });
    };

    items.forEach((el, i) => {
      el.addEventListener("click", () => {
        haptic("select");
        select(el);
      });
      el.addEventListener("keydown", (e) => {
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown")
          next = (i + 1) % items.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
          next = (i - 1 + items.length) % items.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = items.length - 1;
        else if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          haptic("select");
          select(el, { focus: true });
          return;
        } else return;
        e.preventDefault();
        haptic("select");
        select(items[next], { focus: true });
      });
    });

    syncTabindex();
  }

  // Avatar
  wireRadioGroup(
    ".ob-av",
    (card) => {
      avatar = card.dataset.url;
    },
    (card) => card.dataset.url === avatar,
  );

  // Couleur d'accent — recoloration live de toute l'app
  wireRadioGroup(
    ".ob-color",
    (sw) => {
      accentId = sw.dataset.accent;
      setAccent(accentId);
      track("onboarding.accent_chosen", { accent: accentId });
    },
    (sw) => sw.dataset.accent === accentId,
  );

  // ─── Finish ───────────────────────────────────────────────────
  async function finish(opts = {}) {
    if (finishing) return;
    finishing = true;
    const withIntro = opts.intro !== false; // false depuis « Passer »

    track("onboarding.completed", {
      avatar_chosen: !!avatar,
      accent_id: accentId,
      reminders_on: notifWanted,
      with_intro: withIntro,
      version: "v5-steps",
    });

    ctaBtn.disabled = true;
    ctaBtn.innerHTML = ob("cta_going", "C'est parti…");

    // Sauvegarde profil (avatar + marquage onboarding terminé).
    try {
      const now = new Date().toISOString();
      const patch = { first_value_action_at: now };
      if (avatar) patch.avatar_url = avatar;
      await sb.from("profiles").update(patch).eq("id", me.id);
      setCurUser({ ...me, ...patch });
    } catch (e) {
      console.error("[onboarding] finish update failed", e);
    }

    // Fallback localStorage (évite re-affichage si DB échoue).
    try {
      localStorage.setItem("permigo_eleve_onboarding_done", "1");
    } catch {}

    // Coffre de bienvenue (crédité idempotent côté serveur). L'élève le
    // verra S'OUVRIR sur l'accueil (le composant coffre s'affiche à l'arrivée).
    unlockChest("welcome", {
      xp: 50,
      gemmes: 25,
      title: obR("chest_title", "Bienvenue dans PermiGo !"),
    }).catch(() => {});

    // Sortie vers l'accueil : le chrome n'a pas été monté pendant l'onboarding,
    // c'est le boot (reload) qui le montera ; le coffre de bienvenue s'y ouvre.
    const goHome = () => {
      location.hash = "#/";
      location.reload();
    };

    // Accroche « présentation » : une carte « Laisse-nous te présenter PermiGo »
    // + bouton OK, puis la vidéo promotionnelle plein écran (croix pour passer).
    // Le clic sur OK autorise la lecture AVEC le son (geste utilisateur).
    // Fin de vidéo / croix / erreur → accueil. Zappée si l'élève a « Passer ».
    if (withIntro) {
      try {
        const { mountVideoIntro } =
          await import("@/pages/onboarding/video-intro.js");
        mountVideoIntro(root, goHome);
        return;
      } catch (e) {
        console.error("[onboarding] intro vidéo KO", e);
        /* repli : atterrissage direct sur l'accueil ci-dessous */
      }
    }

    goHome();
  }

  // ─── Init ─────────────────────────────────────────────────────
  updateProgress(0);
  paintDock();
  track("onboarding.step_viewed", { step: STEPS[0] });
  requestAnimationFrame(() => focusStep(panels[0]));
}

// ─── Styles ───────────────────────────────────────────────────────
// Deux finitions selon le thème global porté par html[data-theme] :
//   • défaut / "dark" → Arène nuit-violet.
//   • "light"         → Clair premium (sélecteurs html[data-theme="light"]).
const STYLE = `<style>
  /* Utilitaire a11y */
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  /* ═══════════════ ARÈNE (défaut) — tokens locaux ═══════════════ */
  .ob {
    --ob-vio: #7c4dff; --ob-vio-d: #5a2fd6; --ob-vio-l: #a583ff;
    --ob-or: #ffce4d; --ob-or-d: #f0a500;
    --ob-night-1: #241a4d; --ob-night-2: #3a2a7a;
    --ob-ink: #ffffff; --ob-ink-2: #cdc2f5; --ob-ink-3: #9b8fd0;
    --ob-plate: #2c2059; --ob-plate-2: #34286b;
    --ob-line: rgba(165,131,255,.22);
  }

  /* ── Conteneur plein écran ── */
  .ob {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column;
    font-family: 'Archivo', system-ui, sans-serif;
    color: var(--ob-ink);
    -webkit-font-smoothing: antialiased;
    background:
      radial-gradient(120% 70% at 50% -8%, rgba(255,206,77,.16) 0%, rgba(255,206,77,0) 46%),
      radial-gradient(140% 90% at 50% 0%, #2a1f55 0%, rgba(42,31,85,0) 55%),
      linear-gradient(180deg, #241a4d 0%, #2c2160 42%, #3a2a7a 100%);
    animation: obFade .3s ease both;
  }
  @keyframes obFade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Barre progression + Passer (sticky en haut) ── */
  .ob-top {
    flex-shrink: 0; position: relative; z-index: 30;
    display: flex; align-items: center; gap: 12px;
    padding: calc(env(safe-area-inset-top, 0px) + 14px) 18px 10px;
  }
  .ob-prog {
    flex: 1; height: 6px; border-radius: 99px;
    background: rgba(0,0,0,.28); overflow: hidden;
    box-shadow: 0 1px 0 rgba(255,255,255,.05) inset;
  }
  .ob-prog > i {
    display: block; height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, var(--ob-vio-l), var(--ob-or));
    box-shadow: 0 0 10px rgba(255,206,77,.55);
    transition: width .25s ease-out;
  }
  .ob-skip {
    flex-shrink: 0; background: none; border: 0;
    color: var(--ob-ink-3); cursor: pointer;
    font: 600 13px/1 'Archivo', sans-serif;
    padding: 10px 4px; min-height: 44px;
  }
  .ob-skip:active { color: #fff; }

  /* ── Scène (une étape plein écran affichée à la fois) ── */
  .ob-stage { flex: 1; min-height: 0; overflow: hidden; position: relative; z-index: 1; }
  .ob-scr {
    height: 100%; display: flex; flex-direction: column;
    padding: 8px 22px 4px; max-width: 460px; margin: 0 auto;
  }
  .ob-scr[hidden] { display: none; }
  .ob-scr-enter { animation: obScrIn .32s cubic-bezier(.22,.9,.35,1) both; }
  @keyframes obScrIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .ob-scr-enter { animation: none; } }

  .ob-scr-hero { flex: 0 0 auto; text-align: center; padding-top: 4px; }
  .ob-scr-body {
    flex: 1; min-height: 0; overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
  .ob-scr-body::-webkit-scrollbar { width: 0; }
  .ob-scr-body-center { display: flex; flex-direction: column; justify-content: center; text-align: center; }

  /* ── Bulle de dialogue (mascotte) ── */
  .ob-bubble {
    position: relative; max-width: 260px; margin: 0 auto 14px;
    text-align: center; color: var(--ob-ink);
    font: 700 13.5px/1.3 'Archivo', sans-serif;
    background: var(--ob-plate); border: 1.5px solid var(--ob-line);
    border-radius: 16px; padding: 9px 15px;
    box-shadow: 0 6px 16px -8px rgba(0,0,0,.4);
  }
  .ob-bubble::after {
    content: ""; position: absolute; left: 50%; bottom: -6px; width: 11px; height: 11px;
    transform: translateX(-50%) rotate(45deg); background: var(--ob-plate);
    border-right: 1.5px solid var(--ob-line); border-bottom: 1.5px solid var(--ob-line);
    border-bottom-right-radius: 3px;
  }

  /* ── Mascotte ── */
  .ob-mascot-wrap {
    position: relative; width: 112px; height: 112px;
    margin: 2px auto 12px; display: flex;
    align-items: center; justify-content: center;
  }
  .ob-mascot-wrap::before {
    content: ""; position: absolute; inset: -6px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,206,77,.40) 0%, rgba(124,77,255,.30) 42%, rgba(124,77,255,0) 70%);
    filter: blur(4px);
  }
  .ob-mascot {
    position: relative; width: 100px; height: 100px; object-fit: contain;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,.45));
    animation: obPop .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes obPop { 0% { transform: scale(.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ob-mascot { animation: none; } }
  .ob-h1 {
    font: 800 30px/1.1 'Archivo', sans-serif;
    letter-spacing: -.3px; margin: 0 0 12px; color: var(--ob-ink);
    text-shadow: 0 2px 10px rgba(0,0,0,.3); outline: none;
  }
  .ob-lead {
    font: 500 15.5px/1.5 'Archivo', sans-serif;
    color: var(--ob-ink-2); max-width: 290px; margin: 0 auto;
  }
  .ob-lead b { color: #fff; font-weight: 700; }

  /* ── En-tête d'étape numérotée ── */
  .ob-sec-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .ob-sec-num {
    flex: 0 0 auto; width: 34px; height: 34px; border-radius: 11px;
    display: grid; place-items: center;
    font: 800 16px/1 'Archivo', sans-serif;
    color: #1a1233; background: linear-gradient(180deg, #ffe39a, var(--ob-or-d));
    box-shadow: 0 4px 0 #b87d00, 0 0 0 1px rgba(255,255,255,.5) inset;
  }
  .ob-sec-title {
    margin: 0; font: 700 19px/1.1 'Archivo', sans-serif;
    letter-spacing: .1px; color: var(--ob-ink);
  }

  .ob-micro.ok { color: #8fe85a; }
  .ob-micro.err { color: #ffb3b3; }
  .ob-cta:disabled { opacity: .55; cursor: default; filter: grayscale(.15); }

  /* ── Avatars ── */
  .ob-av-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 13px; }
  .ob-av {
    position: relative; aspect-ratio: 1; border-radius: 20px; cursor: pointer;
    background: linear-gradient(180deg, var(--ob-plate-2), var(--ob-plate));
    border: 1px solid var(--ob-line);
    box-shadow: 0 5px 0 rgba(0,0,0,.30), 0 1px 0 rgba(255,255,255,.07) inset;
    display: grid; place-items: center; padding: 0;
    transition: transform .12s, border-color .15s;
  }
  .ob-av:active { transform: scale(.95); }
  .ob-av:focus-visible, .ob-color:focus-visible, .ob-switch:focus-visible {
    outline: 3px solid #fff; outline-offset: 2px;
  }
  .ob-av-img { width: 74%; height: 74%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,.4)); }
  .ob-av.sel {
    background: linear-gradient(180deg, #5a3fb0, #3a2a7a);
    border: 2px solid var(--ob-or);
    box-shadow: 0 6px 0 rgba(0,0,0,.32), 0 0 0 4px rgba(255,206,77,.18), 0 0 18px rgba(255,206,77,.3);
    transform: translateY(-2px);
  }
  .ob-av-check {
    position: absolute; top: -7px; right: -7px;
    width: 26px; height: 26px; border-radius: 50%;
    background: linear-gradient(180deg, #ffe39a, var(--ob-or-d));
    box-shadow: 0 3px 0 #b87d00, 0 0 0 2px #2c2059;
    display: grid; place-items: center; color: #1a1233;
    opacity: 0; transform: scale(.5); transition: opacity .15s, transform .15s;
  }
  .ob-av-check svg { width: 13px; height: 13px; }
  .ob-av.sel .ob-av-check { opacity: 1; transform: scale(1); }
  .ob-helper {
    font: 500 13px/1.4 'Archivo', sans-serif;
    color: var(--ob-ink-3); text-align: center; margin: 14px 0 0;
  }

  /* ── Couleur d'accent (rangée compacte) ── */
  .ob-color-label {
    font: 700 11px/1 'Archivo', sans-serif;
    letter-spacing: .06em; text-transform: uppercase;
    color: var(--ob-ink-3); margin: 22px 0 10px;
  }
  .ob-color-grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .ob-color {
    width: 46px; height: 46px; border-radius: 50%; cursor: pointer; padding: 0;
    background: transparent; border: 2.5px solid transparent;
    display: grid; place-items: center;
    transition: transform .12s, border-color .15s;
  }
  .ob-color:active { transform: scale(.92); }
  .ob-color.sel { border-color: #fff; }
  .ob-color-dot {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--sw), var(--sw-dk));
    box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--sw) 65%, transparent),
                inset 0 2px 4px rgba(255,255,255,.35);
    position: relative;
  }
  .ob-color.sel .ob-color-dot::after {
    content: '✓'; position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font: 800 16px/1 'Archivo', sans-serif;
    text-shadow: 0 1px 3px rgba(0,0,0,.45);
  }

  /* ── Carte toggle (plaque) ── */
  .ob-card {
    background: linear-gradient(180deg, var(--ob-plate-2), var(--ob-plate));
    border: 1px solid var(--ob-line); border-radius: 22px; padding: 18px;
    box-shadow: 0 6px 0 rgba(0,0,0,.26), 0 1px 0 rgba(255,255,255,.06) inset;
  }
  .ob-toggle-row { display: flex; align-items: center; gap: 14px; }
  .ob-toggle-txt { flex: 1; min-width: 0; }
  .ob-toggle-tt { font: 700 16px/1.2 'Archivo', sans-serif; margin-bottom: 3px; }
  .ob-toggle-ts { font: 500 12.5px/1.3 'Archivo', sans-serif; color: var(--ob-ink-3); }

  .ob-switch {
    flex: 0 0 auto; width: 62px; height: 44px; border-radius: 99px;
    padding: 3px; cursor: pointer; position: relative; border: 0;
    background: transparent;
  }
  .ob-switch::before {
    content: ""; position: absolute; inset: 4px 0; border-radius: 99px;
    background: linear-gradient(180deg, #5a3fb0, var(--ob-vio-d));
    box-shadow: 0 3px 8px rgba(124,77,255,.45), 0 1px 0 rgba(255,255,255,.18) inset, 0 -2px 4px rgba(0,0,0,.25) inset;
    transition: background .2s;
  }
  .ob-knob {
    position: absolute; top: 7px; left: 29px;
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(180deg, #fff, #e7e0ff);
    box-shadow: 0 3px 6px rgba(0,0,0,.4), 0 1px 0 rgba(255,255,255,.9) inset;
    display: grid; place-items: center; transition: left .2s;
  }
  .ob-knob::after {
    content: ""; width: 10px; height: 10px; border-radius: 50%;
    background: var(--ob-or); box-shadow: 0 0 8px var(--ob-or);
  }
  .ob-switch.off::before { background: linear-gradient(180deg, #3a3060, #241a4d); }
  .ob-switch.off .ob-knob { left: 3px; }
  .ob-switch.off .ob-knob::after { background: #6b6090; box-shadow: none; }

  .ob-micro {
    font: 500 14px/1.5 'Archivo', sans-serif;
    color: var(--ob-ink-2); margin: 14px 0 0;
  }
  .ob-micro b { color: #fff; font-weight: 700; }

  /* ── Carte récompense ── */
  .ob-reward {
    margin-top: 14px; border-radius: 22px; padding: 16px 16px 16px 14px;
    display: flex; align-items: center; gap: 14px;
    position: relative; overflow: hidden;
    background:
      radial-gradient(120% 120% at 0% 0%, rgba(255,206,77,.18) 0%, rgba(255,206,77,0) 50%),
      linear-gradient(180deg, #3a2c72, #2a1f55);
    border: 1px solid rgba(255,206,77,.40);
    box-shadow: 0 6px 0 rgba(0,0,0,.28), 0 0 22px rgba(255,206,77,.12), 0 1px 0 rgba(255,255,255,.07) inset;
  }
  .ob-reward-chest { flex: 0 0 auto; width: 64px; height: 64px; position: relative; }
  .ob-reward-chest::before {
    content: ""; position: absolute; inset: -8px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,206,77,.5), rgba(255,206,77,0) 65%);
  }
  .ob-reward-chest img {
    position: relative; width: 100%; height: 100%; object-fit: contain;
    filter: drop-shadow(0 5px 8px rgba(0,0,0,.5));
  }
  .ob-reward-body { flex: 1; min-width: 0; }
  .ob-reward-tag {
    font: 700 11px/1 'Archivo', sans-serif;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--ob-or); margin-bottom: 4px;
  }
  .ob-reward-title {
    font: 700 15px/1.2 'Archivo', sans-serif;
    color: #fff; margin-bottom: 8px;
  }
  .ob-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .ob-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font: 700 13px/1 'Archivo', sans-serif;
    padding: 5px 11px 5px 8px; border-radius: 99px;
    background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.10);
  }
  .ob-pill-xp { color: var(--ob-vio-l); }
  .ob-xp-ic {
    font: 900 10px/1 'Archivo', sans-serif;
    background: linear-gradient(180deg, var(--ob-vio-l), var(--ob-vio));
    color: #1a1233; border-radius: 6px; padding: 2px 5px;
  }
  .ob-pill-vol { color: var(--ob-or); }
  .ob-pill-vol img { width: 18px; height: 18px; object-fit: contain; }

  /* ── Étape install ── */
  .ob-install-head { display: flex; align-items: center; gap: 13px; margin-bottom: 6px; }
  .ob-install-badge {
    flex: 0 0 auto; width: 56px; height: 56px; border-radius: 16px; object-fit: contain;
    background: linear-gradient(180deg, var(--ob-plate-2), var(--ob-plate));
    border: 1px solid var(--ob-line);
    box-shadow: 0 5px 0 rgba(0,0,0,.28), 0 0 16px rgba(124,77,255,.25), 0 1px 0 rgba(255,255,255,.08) inset;
    padding: 9px;
  }
  .ob-install-lead { font: 500 14px/1.45 'Archivo', sans-serif; color: var(--ob-ink-2); margin: 0; }
  .ob-install-lead b { color: #fff; font-weight: 700; }
  .ob-a2hs-steps { margin-top: 14px; }

  /* Override des tokens du composant a2hs-steps sur le fond Arène sombre */
  .ob-a2hs-steps .a2s-step {
    background: linear-gradient(180deg, var(--ob-plate-2), var(--ob-plate));
    border-color: var(--ob-line);
    box-shadow: 0 4px 0 rgba(0,0,0,.24), 0 1px 0 rgba(255,255,255,.06) inset;
  }
  .ob-a2hs-steps .a2s-txt { color: #fff; }
  .ob-a2hs-steps .a2s-glyph.share { background: rgba(10,132,255,.22); color: #4da6ff; }
  .ob-a2hs-steps .a2s-glyph.plus,
  .ob-a2hs-steps .a2s-glyph.dots { background: rgba(255,255,255,.1); color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.2); }
  .ob-a2hs-steps .a2s-num { background: var(--ob-or); color: #1a1233; }
  .ob-a2hs-steps .a2s-point { color: var(--ob-ink-2); }
  .ob-a2hs-install {
    width: 100%; margin-bottom: 12px; border: 0; border-radius: 14px;
    background: linear-gradient(180deg, #9a6dff, var(--ob-vio-d)); color: #fff;
    font: 800 15px/1 'Archivo', sans-serif; padding: 14px; cursor: pointer;
    box-shadow: 0 5px 0 #4321a8, 0 10px 18px rgba(124,77,255,.4), 0 1px 0 rgba(255,255,255,.4) inset;
  }
  .ob-a2hs-install:active { transform: translateY(2px); box-shadow: 0 3px 0 #4321a8, 0 6px 12px rgba(124,77,255,.35); }
  .ob-a2hs-install:disabled { opacity: .6; cursor: wait; }
  .ob-plat-switch {
    margin: 14px auto 0; display: block; background: none; border: 0;
    color: var(--ob-ink-3); font: 500 13px/1 'Archivo', sans-serif;
    cursor: pointer; padding: 10px; min-height: 44px;
  }
  .ob-plat-switch:active { color: #fff; }

  /* ── Bouton sticky ── */
  .ob-dock {
    flex-shrink: 0; position: relative; z-index: 35;
    padding: 14px 20px calc(20px + env(safe-area-inset-bottom, 0px));
    background: linear-gradient(180deg, rgba(58,42,122,0) 0%, #3a2a7a 38%);
  }
  .ob-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; min-height: 56px; padding: 17px; cursor: pointer; border: 0;
    border-radius: 18px; color: #fff; position: relative; overflow: hidden;
    font: 800 18px/1 'Archivo', sans-serif; letter-spacing: .3px;
    background: linear-gradient(180deg, #9a6dff 0%, var(--ob-vio) 48%, var(--ob-vio-d) 100%);
    box-shadow: 0 7px 0 #4321a8, 0 12px 22px rgba(124,77,255,.5),
                0 1px 0 rgba(255,255,255,.55) inset, 0 -3px 6px rgba(0,0,0,.22) inset;
    transition: transform .1s, box-shadow .1s, opacity .15s;
  }
  .ob-cta::after {
    content: ""; position: absolute; top: 3px; left: 8%; right: 8%; height: 34%;
    border-radius: 99px; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,0));
  }
  .ob-cta:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 3px 0 #4321a8, 0 6px 14px rgba(124,77,255,.45), 0 1px 0 rgba(255,255,255,.5) inset;
  }
  .ob-cta:disabled { opacity: .6; cursor: default; }

  /* ═══════════════════════════════════════════════════════════════
     CLAIR PREMIUM — uniquement quand le thème global est clair.
     ═══════════════════════════════════════════════════════════════ */
  html[data-theme="light"] .ob {
    --ob-violet: #7c4dff; --ob-violet-d: #5a2fd6; --ob-violet-l: #a583ff;
    --ob-or-l: #f5b400;
    --c-ink: #1d1b2e; --c-ink-2: #4a4761; --c-ink-3: #8b88a3;
    --c-bg: #ffffff; --c-line: #ece8f7; --c-lav: #f0ebff; --c-lav-2: #e7deff;
    --c-shadow-card: 0 1px 2px rgba(29,27,46,.04), 0 8px 24px rgba(90,47,214,.06);
    --c-shadow-soft: 0 2px 8px rgba(29,27,46,.05);
    color: var(--c-ink);
    font-family: 'Archivo', system-ui, sans-serif;
    background: linear-gradient(180deg, #f7f5fd 0%, #ffffff 38%);
  }

  html[data-theme="light"] .ob-micro.ok { color: #3a8a01; }
  html[data-theme="light"] .ob-micro.err { color: #cc3344; }

  /* Top bar */
  html[data-theme="light"] .ob-top {
    background: linear-gradient(180deg, rgba(247,245,253,.97) 60%, rgba(247,245,253,0));
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  html[data-theme="light"] .ob-prog { background: var(--c-lav-2); height: 5px; }
  html[data-theme="light"] .ob-prog > i {
    background: linear-gradient(90deg, var(--ob-violet), var(--ob-violet-l));
    box-shadow: 0 0 8px rgba(124,77,255,.5);
  }
  html[data-theme="light"] .ob-skip { color: var(--c-ink-3); }
  html[data-theme="light"] .ob-skip:active { color: var(--c-ink); }

  /* Bulle + mascotte + hero */
  html[data-theme="light"] .ob-bubble {
    background: var(--c-bg); border-color: var(--c-line); color: var(--c-ink);
    box-shadow: var(--c-shadow-soft);
  }
  html[data-theme="light"] .ob-bubble::after { background: var(--c-bg); border-color: var(--c-line); }
  html[data-theme="light"] .ob-mascot-wrap::before {
    background: radial-gradient(circle, rgba(165,131,255,.30) 0%, rgba(240,235,255,0) 68%);
    filter: none; inset: -2px;
  }
  html[data-theme="light"] .ob-mascot { filter: drop-shadow(0 14px 24px rgba(124,77,255,.22)); }
  html[data-theme="light"] .ob-h1 { color: var(--c-ink); text-shadow: none; letter-spacing: -.02em; }
  html[data-theme="light"] .ob-lead { color: var(--c-ink-2); }
  html[data-theme="light"] .ob-lead b { color: var(--c-ink); font-weight: 600; }

  /* En-têtes d'étape */
  html[data-theme="light"] .ob-sec-num {
    width: 30px; height: 30px; border-radius: 10px; color: #fff;
    background: linear-gradient(135deg, var(--ob-violet), var(--ob-violet-d));
    box-shadow: 0 4px 10px rgba(124,77,255,.32); font-size: 15px;
  }
  html[data-theme="light"] .ob-sec-title { color: var(--c-ink); font-size: 18.5px; letter-spacing: -.01em; }

  /* Avatars */
  html[data-theme="light"] .ob-av {
    background: var(--c-bg); border: 2px solid var(--c-line);
    box-shadow: var(--c-shadow-soft);
  }
  html[data-theme="light"] .ob-av.sel {
    background: var(--c-lav); border: 2px solid var(--ob-violet);
    box-shadow: 0 0 0 4px rgba(124,77,255,.16), 0 6px 16px rgba(124,77,255,.2);
    transform: none;
  }
  html[data-theme="light"] .ob-av-img { filter: none; }
  html[data-theme="light"] .ob-av-check {
    top: 7px; right: 7px; width: 21px; height: 21px;
    background: var(--ob-violet); color: #fff;
    box-shadow: 0 2px 6px rgba(124,77,255,.45);
  }
  html[data-theme="light"] .ob-helper { color: var(--c-ink-3); }
  html[data-theme="light"] .ob-color-label { color: var(--c-ink-3); }
  html[data-theme="light"] .ob-color.sel { border-color: var(--ob-violet); }
  html[data-theme="light"] .ob-av:focus-visible,
  html[data-theme="light"] .ob-color:focus-visible,
  html[data-theme="light"] .ob-switch:focus-visible {
    outline: 3px solid var(--ob-violet);
  }

  /* Carte toggle */
  html[data-theme="light"] .ob-card {
    background: var(--c-bg); border: 1px solid var(--c-line);
    border-radius: 26px; box-shadow: var(--c-shadow-card);
  }
  html[data-theme="light"] .ob-toggle-tt { color: var(--c-ink); }
  html[data-theme="light"] .ob-toggle-ts { color: var(--c-ink-3); }
  html[data-theme="light"] .ob-switch {
    width: 58px; height: 44px;
    background: transparent;
    box-shadow: none;
  }
  html[data-theme="light"] .ob-switch::before {
    inset: 5px 0;
    background: linear-gradient(135deg, var(--ob-violet), var(--ob-violet-d));
    box-shadow: inset 0 1px 3px rgba(0,0,0,.18), 0 2px 8px rgba(124,77,255,.3);
  }
  html[data-theme="light"] .ob-knob {
    top: 8px; left: 27px; width: 28px; height: 28px;
    background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,.25);
  }
  html[data-theme="light"] .ob-knob::after { display: none; }
  html[data-theme="light"] .ob-switch.off::before { background: #cfc7e6; }
  html[data-theme="light"] .ob-switch.off .ob-knob { left: 3px; }
  html[data-theme="light"] .ob-micro {
    color: var(--c-ink-2); padding-top: 14px; margin-top: 14px;
    border-top: 1px solid var(--c-line);
  }
  html[data-theme="light"] .ob-micro b { color: var(--ob-violet-d); font-weight: 600; }

  /* Carte récompense */
  html[data-theme="light"] .ob-reward {
    border-radius: 26px;
    background:
      radial-gradient(120% 100% at 100% 0%, rgba(255,206,77,.16), transparent 60%),
      linear-gradient(135deg, #fbf8ff, #f1ecff);
    border: 1px solid var(--c-lav-2); box-shadow: var(--c-shadow-card);
  }
  html[data-theme="light"] .ob-reward-chest { width: 62px; height: 62px; }
  html[data-theme="light"] .ob-reward-chest::before { display: none; }
  html[data-theme="light"] .ob-reward-chest img { filter: drop-shadow(0 6px 12px rgba(245,180,0,.32)); }
  html[data-theme="light"] .ob-reward-tag { color: var(--ob-or-l); }
  html[data-theme="light"] .ob-reward-title { color: var(--c-ink); }
  html[data-theme="light"] .ob-pill {
    background: #fff; border: 1px solid var(--c-line); color: var(--c-ink);
    box-shadow: var(--c-shadow-soft);
  }
  html[data-theme="light"] .ob-pill-xp { color: var(--ob-violet-d); }
  html[data-theme="light"] .ob-xp-ic {
    background: linear-gradient(135deg, var(--ob-violet), var(--ob-violet-l));
    color: #fff; border-radius: 5px;
  }
  html[data-theme="light"] .ob-pill-vol { color: var(--c-ink); }

  /* Étape install */
  html[data-theme="light"] .ob-install-head {
    background: var(--c-bg); border: 1px solid var(--c-line);
    border-radius: 20px; padding: 14px; box-shadow: var(--c-shadow-soft);
    margin-bottom: 14px;
  }
  html[data-theme="light"] .ob-install-badge {
    width: 50px; height: 50px; border-radius: 13px; border: 0; padding: 0;
    background: none; box-shadow: 0 4px 12px rgba(124,77,255,.22);
  }
  html[data-theme="light"] .ob-install-lead { color: var(--c-ink-2); }
  html[data-theme="light"] .ob-install-lead b { color: var(--c-ink); font-weight: 600; }
  html[data-theme="light"] .ob-a2hs-steps .a2s-step {
    background: var(--c-bg); border: 1px solid var(--c-line);
    border-radius: 20px; box-shadow: var(--c-shadow-soft);
  }
  html[data-theme="light"] .ob-a2hs-steps .a2s-txt { color: var(--c-ink); }
  html[data-theme="light"] .ob-a2hs-steps .a2s-glyph.share { background: #eaf2ff; color: #0a84ff; }
  html[data-theme="light"] .ob-a2hs-steps .a2s-glyph.plus,
  html[data-theme="light"] .ob-a2hs-steps .a2s-glyph.dots {
    background: var(--c-lav); color: var(--ob-violet-d); border: 1px solid var(--c-line);
  }
  html[data-theme="light"] .ob-a2hs-steps .a2s-num { background: var(--ob-violet); color: #fff; }
  html[data-theme="light"] .ob-a2hs-steps .a2s-point { color: var(--ob-violet); }
  html[data-theme="light"] .ob-a2hs-install {
    background: linear-gradient(135deg, var(--ob-violet), var(--ob-violet-d)); color: #fff;
    box-shadow: 0 6px 18px rgba(124,77,255,.34), 0 2px 4px rgba(124,77,255,.2);
  }
  html[data-theme="light"] .ob-a2hs-install:active {
    transform: translateY(1px);
    box-shadow: 0 3px 10px rgba(124,77,255,.3);
  }
  html[data-theme="light"] .ob-plat-switch { color: var(--c-ink-3); }
  html[data-theme="light"] .ob-plat-switch:active { color: var(--c-ink); }

  /* Dock + bouton */
  html[data-theme="light"] .ob-dock {
    background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.95) 32%, #fff 60%);
  }
  html[data-theme="light"] .ob-cta {
    background: linear-gradient(135deg, var(--ob-violet), var(--ob-violet-d));
    box-shadow: 0 6px 18px rgba(124,77,255,.34), 0 2px 4px rgba(124,77,255,.2);
    border-radius: 18px;
  }
  html[data-theme="light"] .ob-cta::after { display: none; }
  html[data-theme="light"] .ob-cta:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 3px 12px rgba(124,77,255,.3);
  }
</style>`;
