// ═══════════════════════════════════════════════════════════════
// Onboarding élève — 4 écrans max, 1ère valeur ressentie en <60s
//
// Flow :
//   0. Accueil perso « Salut {prenom} »
//   1. One-tap win  — panneau STOP visuel, bonne réponse → confetti +10 XP
//   2. Perso fusionnée — avatar + couleur sur un seul écran
//   3. Garde ton avance — streak + opt-in notif (CTA) + tease coffre
//   (3b) Sous-step A2HS — conditionnel (hors dots), si app non installée
//
// Dots = 4 pastilles seulement (les 4 vrais écrans).
// A11y : focus management entre slides, aria-live sur les changements d'état.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser, setCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { ASSETS } from "@/utils/assets.js";
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

// ─── Indices des 4 écrans de contenu (fixes) ────────────────────
const S_WELCOME = 0; // Accueil perso
const S_QUIZ = 1; // One-tap win
const S_PERSO = 2; // Avatar + couleur
const S_NOTIF = 3; // Garde ton avance + opt-in
const DOT_COUNT = 4; // Toujours 4 dots, jamais plus

// ─── Question infaillible (bonne réponse évidente) ──────────────
const QUIZ_QUESTION = {
  // Panneau STOP reconnu mondialement — impossible de se tromper
  sign: "🛑",
  question: "Face à ce panneau, je dois…",
  answers: [
    { id: "stop", label: "M'arrêter complètement", correct: true },
    { id: "slow", label: "Simplement ralentir", correct: false },
  ],
};

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("onboarding.start", { role: me.role, version: "v2" });

  // Opt-in notif : disponible si l'API existe et que la permission n'est pas déjà accordée.
  const showNotif =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Notification.permission !== "granted";

  // A2HS : sous-step conditionnel (pas de dot dédié)
  const showA2HS = !isStandalone();

  let idx = 0; // slide actif (0-3)
  let quizAnswered = false;
  let quizCorrect = false;
  let notifDone = false;
  let notifBusy = false;
  let a2hsDone = false;
  let finishing = false;
  let inA2HS = false; // sous-step A2HS (pas un vrai slide)

  let avatar =
    me.avatar_url && ASSETS.avatar?.includes(me.avatar_url)
      ? me.avatar_url
      : ASSETS.avatar?.[0] || null;
  let accentId = getAccent();
  let a2hsPlat = guessPlatform() === "android" ? "android" : "ios";

  const prenom = esc(me.prenom || me.nom || "toi");

  // ─── Rendu HTML initial ────────────────────────────────────────
  root.innerHTML = `
    ${STYLE}
    <style>${A2HS_STYLE}</style>
    <div class="ob" role="dialog" aria-modal="true" aria-label="Tour de bienvenue">
      <div class="ob-orb ob-orb-a" aria-hidden="true"></div>
      <div class="ob-orb ob-orb-b" aria-hidden="true"></div>

      <div class="ob-head">
        <div class="ob-dots" id="ob-dots" role="group" aria-label="Progression">
          ${Array.from(
            { length: DOT_COUNT },
            (_, i) =>
              `<span class="ob-dot${i === 0 ? " active" : ""}" data-i="${i}" aria-hidden="true"></span>`,
          ).join("")}
        </div>
        <button class="ob-skip" id="ob-skip" type="button" aria-label="Passer l'introduction">Passer</button>
      </div>

      <!-- Region annonces a11y (changements d'état, slide active) -->
      <div id="ob-live" aria-live="polite" aria-atomic="true" class="sr-only"></div>

      <div class="ob-viewport" id="ob-viewport" aria-label="Contenu de l'étape">
        <div class="ob-track" id="ob-track" style="width:${DOT_COUNT * 100}%">

          <!-- ─── Écran 0 : Accueil perso ─── -->
          <section class="ob-slide ob-slide-welcome" data-i="0" aria-labelledby="ob-title-0">
            <div class="ob-halo" aria-hidden="true">
              <div class="ob-emoji">${icon("car", { size: 44 })}</div>
            </div>
            <div class="ob-badge">Permi<span>Go</span></div>
            <h1 class="ob-title" id="ob-title-0">
              Salut, <span class="accent">${prenom}</span>&nbsp;!
            </h1>
            <p class="ob-body-txt">
              Ton permis, étape par étape — avec ton moniteur.
            </p>
          </section>

          <!-- ─── Écran 1 : One-tap win ─── -->
          <section class="ob-slide ob-slide-quiz" data-i="1" aria-labelledby="ob-title-1">
            <p class="ob-quiz-eyebrow">Question rapide</p>
            <div class="ob-sign" aria-label="Panneau de signalisation" aria-hidden="true">${QUIZ_QUESTION.sign}</div>
            <h1 class="ob-title ob-title-quiz" id="ob-title-1">${esc(QUIZ_QUESTION.question)}</h1>
            <div class="ob-quiz-answers" id="ob-quiz-answers" role="group" aria-label="Choix de réponse">
              ${QUIZ_QUESTION.answers
                .map(
                  (a) => `
                <button
                  class="ob-quiz-btn"
                  data-id="${esc(a.id)}"
                  data-correct="${a.correct}"
                  type="button"
                  aria-label="${esc(a.label)}"
                >${esc(a.label)}</button>
              `,
                )
                .join("")}
            </div>
            <!-- Feedback après réponse (caché au départ) -->
            <div class="ob-quiz-result" id="ob-quiz-result" aria-live="assertive" hidden>
              <div class="ob-quiz-xp" id="ob-quiz-xp">+10 XP</div>
              <div class="ob-quiz-msg" id="ob-quiz-msg"></div>
            </div>
          </section>

          <!-- ─── Écran 2 : Perso fusionnée (avatar + couleur) ─── -->
          <section class="ob-slide ob-slide-perso" data-i="2" aria-labelledby="ob-title-2">
            <div class="ob-halo" aria-hidden="true">
              <div class="ob-emoji">${icon("user", { size: 34 })}</div>
            </div>
            <h1 class="ob-title" id="ob-title-2">Personnalise ton profil</h1>

            <p class="ob-perso-label">Avatar</p>
            <div class="ob-av-grid" id="ob-av-grid" role="radiogroup" aria-label="Choix de l'avatar">
              ${(ASSETS.avatar || [])
                .map(
                  (url, i) => `
                <button
                  class="ob-av-card${url === avatar ? " sel" : ""}"
                  data-url="${esc(url)}"
                  role="radio"
                  aria-checked="${url === avatar}"
                  aria-label="Avatar ${i + 1}"
                  type="button"
                >
                  <img class="ob-av-img" src="${esc(url)}" alt="" loading="lazy" />
                  <span class="ob-av-check" aria-hidden="true">✓</span>
                </button>
              `,
                )
                .join("")}
            </div>

            <p class="ob-perso-label">Couleur</p>
            <p class="ob-body-txt ob-color-hint">Tout l'app change en temps réel&nbsp;→</p>
            <div class="ob-color-grid" id="ob-color-grid" role="radiogroup" aria-label="Choix de la couleur">
              ${ACCENTS.map(
                (c) => `
                <button
                  class="ob-color-sw${c.id === accentId ? " sel" : ""}"
                  data-accent="${esc(c.id)}"
                  role="radio"
                  aria-checked="${c.id === accentId}"
                  aria-label="${esc(c.name)}"
                  type="button"
                  style="--sw:${c.a};--sw-dk:${c.adk}"
                >
                  <span class="ob-color-dot" aria-hidden="true"></span>
                  <span class="ob-color-name">${esc(c.name)}</span>
                </button>
              `,
              ).join("")}
            </div>
          </section>

          <!-- ─── Écran 3 : Garde ton avance ─── -->
          <section class="ob-slide ob-slide-notif" data-i="3" aria-labelledby="ob-title-3">
            <div class="ob-halo ob-halo-bell" aria-hidden="true">
              <div class="ob-emoji ob-bell">${icon("bell", { size: 40 })}</div>
            </div>
            <h1 class="ob-title" id="ob-title-3">Garde ton avance</h1>
            <p class="ob-body-txt">3 questions ce soir, 2 minutes. Chaque jour qui passe renforce la mémorisation — pour de vrai.</p>

            <!-- Tease coffre de bienvenue -->
            <div class="ob-chest-tease" aria-label="Coffre de bienvenue débloqué">
              <span class="ob-chest-ico" aria-hidden="true">🎁</span>
              <div class="ob-chest-txt">
                <div class="ob-chest-title">Un coffre t'attend à l'arrivée</div>
                <div class="ob-chest-sub">50 XP + 25 volants à récupérer</div>
              </div>
            </div>

            <!-- Prévisualisation notif (cosmétique) -->
            <div class="ob-notif-preview" aria-hidden="true">
              <img class="ob-notif-ico" src="/skins/avatars/permigo-badge-icon.png" alt="" />
              <div class="ob-notif-txt">
                <div class="ob-notif-app">PermiGo <span>maintenant</span></div>
                <div class="ob-notif-title">Tes 3 questions t'attendent</div>
                <div class="ob-notif-body">2 minutes — garde ton avance.</div>
              </div>
            </div>

            <!-- Feedback état notif (a11y) -->
            <p class="ob-notif-note" id="ob-notif-note">1 rappel/jour max. Désactivable à tout moment.</p>
          </section>

        </div>
      </div>

      <!-- Sous-step A2HS (hors track carrousel, injecté conditionnellement) -->
      <div class="ob-a2hs-wrap" id="ob-a2hs-wrap" hidden>
        <img class="ob-a2hs-badge" src="/skins/avatars/permigo-badge-icon.png" alt="" />
        <h1 class="ob-title" id="ob-a2hs-title">Ajoute l'appli</h1>
        <p class="ob-body-txt">2 gestes, 10 secondes — tes rappels arrivent ici.</p>
        <div class="ob-a2hs-steps" id="ob-a2hs-steps"></div>
        <button class="ob-plat-switch" id="ob-plat-switch" type="button"></button>
      </div>

      <div class="ob-footer">
        <button class="ob-cta" id="ob-cta" type="button">
          Commencer <span aria-hidden="true">→</span>
        </button>
        <button class="ob-later" id="ob-later" type="button" hidden>Plus tard</button>
      </div>
    </div>
  `;

  // ─── Références DOM ────────────────────────────────────────────
  const track$ = root.querySelector("#ob-track");
  const ctaBtn = root.querySelector("#ob-cta");
  const laterBtn = root.querySelector("#ob-later");
  const dotsEl = root.querySelector("#ob-dots");
  const viewport = root.querySelector("#ob-viewport");
  const liveEl = root.querySelector("#ob-live");
  const a2hsWrap = root.querySelector("#ob-a2hs-wrap");

  // ─── Focus management helpers ──────────────────────────────────
  function focusSlideTitle(slideIdx) {
    // Déplace le focus sur le titre du nouvel écran (a11y)
    const titleId =
      slideIdx === -1 /* A2HS */ ? "ob-a2hs-title" : `ob-title-${slideIdx}`;
    const titleEl = root.querySelector(`#${titleId}`);
    if (titleEl) {
      titleEl.setAttribute("tabindex", "-1");
      titleEl.focus({ preventScroll: true });
    }
  }

  function announce(msg) {
    // Annonce douce (aria-live polite) — ne coupe pas ce qui est déjà lu
    if (liveEl) liveEl.textContent = msg;
  }

  // ─── Mise à jour affichage ─────────────────────────────────────
  function update() {
    // Déplace le carrousel si on n'est pas dans le sous-step A2HS
    if (!inA2HS) {
      track$.style.transform = `translateX(-${(idx * 100) / DOT_COUNT}%)`;
    }

    // Dots
    dotsEl.querySelectorAll(".ob-dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx && !inA2HS);
      d.classList.toggle("done", i < idx || (inA2HS && i <= idx));
    });

    // aria-hidden sur les slides (non-actifs masqués aux screen readers)
    root.querySelectorAll(".ob-slide").forEach((s, i) => {
      const on = !inA2HS && i === idx;
      s.classList.toggle("on", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });

    // Viewport principal vs sous-step A2HS
    viewport.hidden = inA2HS;
    a2hsWrap.hidden = !inA2HS;

    // Label CTA
    if (inA2HS) {
      ctaBtn.innerHTML = 'C\'est parti <span aria-hidden="true">→</span>';
      laterBtn.hidden = true;
    } else if (idx === S_QUIZ) {
      // Quiz : le CTA n'est actif qu'après avoir répondu
      if (!quizAnswered) {
        ctaBtn.innerHTML = "Réponds pour continuer";
        ctaBtn.disabled = true;
      } else {
        ctaBtn.innerHTML = 'Continuer <span aria-hidden="true">→</span>';
        ctaBtn.disabled = false;
      }
      laterBtn.hidden = true;
    } else if (idx === S_NOTIF) {
      if (!notifDone && showNotif) {
        ctaBtn.innerHTML = "Activer les rappels";
        ctaBtn.disabled = false;
      } else {
        ctaBtn.innerHTML = 'C\'est parti <span aria-hidden="true">→</span>';
        ctaBtn.disabled = false;
      }
      laterBtn.hidden = !(showNotif && !notifDone);
    } else if (idx === S_PERSO) {
      ctaBtn.innerHTML = 'Continuer <span aria-hidden="true">→</span>';
      ctaBtn.disabled = false;
      laterBtn.hidden = true;
    } else {
      // S_WELCOME
      ctaBtn.innerHTML = 'Commencer <span aria-hidden="true">→</span>';
      ctaBtn.disabled = false;
      laterBtn.hidden = true;
    }

    track("onboarding.step_viewed", { step: inA2HS ? "a2hs" : idx });
  }

  function goTo(i) {
    idx = Math.max(0, Math.min(DOT_COUNT - 1, i));
    inA2HS = false;
    haptic("tap");
    update();
    // Annonce le changement d'écran pour les lecteurs d'écran
    const labels = [
      "Bienvenue",
      "Question rapide",
      "Personnalisation",
      "Rappels",
    ];
    announce(`Étape ${idx + 1} sur ${DOT_COUNT} : ${labels[idx]}`);
    // Focus sur le titre du nouvel écran
    requestAnimationFrame(() => focusSlideTitle(idx));
  }

  function advance() {
    if (idx < DOT_COUNT - 1) {
      goTo(idx + 1);
    } else {
      // Dernier slide (S_NOTIF) — sous-step A2HS si non installé, sinon finish
      if (showA2HS && !a2hsDone && !inA2HS) {
        enterA2HS();
      } else {
        finish();
      }
    }
  }

  function prev() {
    if (inA2HS) {
      // Retour depuis A2HS → retour au dernier vrai slide
      inA2HS = false;
      haptic("tap");
      update();
      announce("Retour à l'étape précédente");
      requestAnimationFrame(() => focusSlideTitle(idx));
    } else if (idx > 0) {
      goTo(idx - 1);
    }
  }

  // ─── Quiz : one-tap win ────────────────────────────────────────
  function handleQuizAnswer(btn) {
    if (quizAnswered) return;
    quizAnswered = true;

    const correct = btn.dataset.correct === "true";
    quizCorrect = correct;

    haptic(correct ? "success" : "select");

    // Marque le bouton sélectionné + montre la bonne réponse
    root.querySelectorAll(".ob-quiz-btn").forEach((b) => {
      const isCor = b.dataset.correct === "true";
      b.disabled = true;
      b.classList.toggle("correct", isCor);
      b.classList.toggle("selected", b === btn);
      b.classList.toggle("wrong", !isCor && b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });

    // Affiche le feedback XP
    const resultEl = root.querySelector("#ob-quiz-result");
    const msgEl = root.querySelector("#ob-quiz-msg");
    const xpEl = root.querySelector("#ob-quiz-xp");

    if (correct) {
      msgEl.textContent = "Exactement ! Tu mémorises mieux en agissant.";
      xpEl.textContent = "+10 XP";
      xpEl.classList.add("win");
    } else {
      msgEl.textContent = "Le STOP oblige à s'arrêter complètement. Retenu !";
      xpEl.textContent = "+10 XP quand même";
      xpEl.classList.add("consolation");
    }

    resultEl.hidden = false;
    resultEl.removeAttribute("hidden");

    // Confetti léger (best-effort — si le module rate, on continue).
    // Le canvas confetti est posé sur <body> avec z-index:9998, soit EN DESSOUS
    // de l'overlay onboarding (z-index:9999). On l'élève brièvement à 10000
    // pour qu'il soit visible, puis on le redescend automatiquement.
    try {
      import("@/components/common/confetti.js").then(({ burstConfetti }) => {
        burstConfetti({ x: 0.5, y: 0.4, count: 55, power: 11 });
        // Élève le canvas confetti au-dessus de l'overlay le temps de l'animation (~2s)
        requestAnimationFrame(() => {
          const cvs = document.querySelector(
            'canvas[style*="z-index:9998"], canvas[style*="z-index: 9998"]',
          );
          if (cvs) {
            cvs.style.zIndex = "10000";
            setTimeout(() => {
              if (cvs) cvs.style.zIndex = "9998";
            }, 2200);
          }
        });
      });
    } catch {
      /* best-effort */
    }

    // Débloque le CTA
    update();

    // Annonce le résultat aux lecteurs d'écran
    announce(
      correct
        ? "Bonne réponse ! +10 XP gagné."
        : "Tu as appris quelque chose de nouveau. +10 XP quand même.",
    );
  }

  // ─── Opt-in notifications ──────────────────────────────────────
  // Reste synchrone dans le geste tactile (iOS exige user gesture)
  async function handleNotifOptIn() {
    if (notifBusy) return;
    notifBusy = true;
    ctaBtn.disabled = true;
    const note = root.querySelector("#ob-notif-note");

    try {
      const granted = await optInPush();
      track("onboarding.push_optin", {
        outcome: granted ? "granted" : Notification.permission,
      });
      notifDone = true;

      if (granted) {
        haptic("success");
        root.querySelector(".ob-slide-notif")?.classList.add("granted");
        if (note) note.textContent = "Rappels activés — à ce soir !";
        announce("Rappels activés ! Tu recevras 3 questions ce soir.");
        setTimeout(() => {
          ctaBtn.disabled = false;
          advance();
        }, 900);
        return;
      }

      if (note && Notification.permission === "denied") {
        note.textContent =
          "Bloquées — active-les dans les réglages si tu changes d'avis.";
        announce(
          "Rappels non activés. Tu peux les activer plus tard dans les réglages.",
        );
      }
      ctaBtn.disabled = false;
      update();
    } catch (e) {
      console.error("[onboarding] push opt-in failed", e);
      notifDone = true;
      ctaBtn.disabled = false;
      update();
    } finally {
      notifBusy = false;
    }
  }

  // ─── Sous-step A2HS ───────────────────────────────────────────
  function enterA2HS() {
    inA2HS = true;
    haptic("tap");
    track("onboarding.step_viewed", { step: "a2hs" });
    renderA2HSSteps();
    update();
    announce("Étape bonus : ajouter l'application à ton écran d'accueil");
    requestAnimationFrame(() => focusSlideTitle(-1));
  }

  function renderA2HSSteps() {
    const stepsEl = root.querySelector("#ob-a2hs-steps");
    if (!stepsEl) return;

    const nativeBtn =
      a2hsPlat === "android" && canPromptInstall()
        ? `<button class="ob-a2hs-install" id="ob-a2hs-install" type="button">Installer l'app en 1 tap</button>`
        : "";

    stepsEl.innerHTML = `${nativeBtn}${a2hsStepsHTML(a2hsPlat)}`;

    const sw = root.querySelector("#ob-plat-switch");
    if (sw) {
      sw.textContent =
        a2hsPlat === "ios" ? "Tu es sur Android ?" : "Tu es sur iPhone ?";
    }

    const ib = root.querySelector("#ob-a2hs-install");
    if (ib) {
      ib.addEventListener("click", async () => {
        ib.disabled = true;
        ib.textContent = "Installation…";
        try {
          const outcome = await promptInstall();
          track("a2hs.install_prompt", { outcome, source: "onboarding" });
          if (outcome === "accepted") {
            a2hsDone = true;
            finish();
            return;
          }
        } catch {
          /* best-effort */
        }
        ib.disabled = false;
        ib.textContent = "Installer l'app en 1 tap";
      });
    }
  }

  // ─── CTA principal ─────────────────────────────────────────────
  function next() {
    if (inA2HS) {
      a2hsDone = true;
      finish();
      return;
    }
    if (idx === S_NOTIF && showNotif && !notifDone) {
      handleNotifOptIn();
      return;
    }
    advance();
  }

  ctaBtn.addEventListener("click", next);

  laterBtn.addEventListener("click", () => {
    track("onboarding.push_optin", { outcome: "later" });
    notifDone = true;
    advance();
  });

  // Switch plateforme A2HS (délégué car injecté dynamiquement)
  root.querySelector("#ob-plat-switch")?.addEventListener("click", () => {
    a2hsPlat = a2hsPlat === "ios" ? "android" : "ios";
    track("a2hs.platform_selected", {
      platform: a2hsPlat,
      source: "onboarding",
    });
    renderA2HSSteps();
  });

  // Skip → termine direct
  root.querySelector("#ob-skip").addEventListener("click", () => {
    track("onboarding.skipped", { at_step: idx + 1 });
    finish();
  });

  // ─── Quiz : listeners réponses ─────────────────────────────────
  root.querySelectorAll(".ob-quiz-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleQuizAnswer(btn));
  });

  // ─── Avatar ────────────────────────────────────────────────────
  root.querySelectorAll(".ob-av-card").forEach((card) => {
    card.addEventListener("click", () => {
      avatar = card.dataset.url;
      haptic("select");
      root.querySelectorAll(".ob-av-card").forEach((c) => {
        const on = c.dataset.url === avatar;
        c.classList.toggle("sel", on);
        c.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
  });

  // ─── Couleur d'accent — recoloration live ─────────────────────
  root.querySelectorAll(".ob-color-sw").forEach((sw) => {
    sw.addEventListener("click", () => {
      accentId = sw.dataset.accent;
      setAccent(accentId);
      haptic("select");
      track("onboarding.accent_chosen", { accent: accentId });
      root.querySelectorAll(".ob-color-sw").forEach((s) => {
        const on = s.dataset.accent === accentId;
        s.classList.toggle("sel", on);
        s.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
  });

  // ─── Swipe horizontal ─────────────────────────────────────────
  let startX = 0,
    startY = 0,
    swiping = false;

  viewport.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
      swiping = true;
    },
    { passive: true },
  );

  viewport.addEventListener(
    "touchend",
    (e) => {
      if (!swiping) return;
      swiping = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;

      if (dx < 0) {
        // Swipe gauche = avancer
        if (idx === S_NOTIF && showNotif && !notifDone) {
          // Swipe passe l'opt-in sans l'activer
          track("onboarding.push_optin", { outcome: "swiped_past" });
          notifDone = true;
          advance();
        } else if (idx !== S_QUIZ || quizAnswered) {
          // Sur le quiz, on ne peut pas swiper sans répondre
          advance();
        }
      } else {
        prev();
      }
    },
    { passive: true },
  );

  // ─── Clavier ──────────────────────────────────────────────────
  function onKey(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      if (idx !== S_QUIZ || quizAnswered) advance();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      prev();
    }
  }
  document.addEventListener("keydown", onKey);

  // ─── Finish ───────────────────────────────────────────────────
  async function finish() {
    if (finishing) return;
    finishing = true;
    document.removeEventListener("keydown", onKey);

    track("onboarding.completed", {
      last_step: inA2HS ? "a2hs" : idx,
      quiz_correct: quizCorrect,
      avatar_chosen: !!avatar,
      accent_id: accentId,
      version: "v2",
    });

    ctaBtn.disabled = true;
    ctaBtn.innerHTML = "C'est parti…";

    // Sauvegarde profil (avatar + marquage onboarding terminé)
    try {
      const now = new Date().toISOString();
      const patch = { first_value_action_at: now };
      if (avatar) patch.avatar_url = avatar;
      await sb.from("profiles").update(patch).eq("id", me.id);
      setCurUser({ ...me, ...patch });
    } catch (e) {
      console.error("[onboarding] finish update failed", e);
    }

    // Fallback localStorage (évite re-affichage si DB échoue)
    try {
      localStorage.setItem("permigo_eleve_onboarding_done", "1");
    } catch {}

    // Coffre de bienvenue (crédité idempotent côté serveur).
    // On l'unlock ici mais l'élève le verra S'OUVRIR sur l'accueil
    // (le chest component s'affiche dès l'arrivée, pas en teaser passif).
    unlockChest("welcome", {
      xp: 50,
      gemmes: 25,
      title: "Bienvenue dans PermiGo !",
    }).catch(() => {});

    // Atterrissage sur l'accueil → le composant coffre s'affiche immédiatement
    location.hash = "#/";
    location.reload();
  }

  // ─── Init ─────────────────────────────────────────────────────
  update();
  // Focus initial sur le titre du premier écran
  requestAnimationFrame(() => focusSlideTitle(0));
}

// ─── Styles ───────────────────────────────────────────────────────
const STYLE = `<style>
  /* Utilitaire a11y : texte réservé aux lecteurs d'écran */
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  /* ── Conteneur principal ── */
  .ob {
    position: fixed; inset: 0; z-index: 9999;
    background:
      radial-gradient(ellipse 90% 60% at 50% 0%, color-mix(in srgb, var(--a) 14%, transparent) 0%, transparent 55%),
      linear-gradient(180deg, var(--ink) 0%, var(--ink4, #0f1424) 100%);
    display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    animation: obFade .3s ease both;
  }
  @keyframes obFade { from { opacity: 0; } to { opacity: 1; } }

  /* ── Orbes lumineux (profondeur) ── */
  .ob-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
    filter: blur(60px); opacity: .35; will-change: transform;
  }
  .ob-orb-a {
    width: 260px; height: 260px; top: -60px; right: -80px;
    background: color-mix(in srgb, var(--a) 55%, transparent);
    animation: obFloatA 11s ease-in-out infinite alternate;
  }
  .ob-orb-b {
    width: 220px; height: 220px; bottom: 6%; left: -90px;
    background: color-mix(in srgb, var(--adk, var(--a)) 45%, transparent);
    animation: obFloatB 14s ease-in-out infinite alternate;
  }
  @keyframes obFloatA { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,40px) scale(1.15); } }
  @keyframes obFloatB { from { transform: translate(0,0) scale(1.1); } to { transform: translate(35px,-30px) scale(.95); } }
  @media (prefers-reduced-motion: reduce) { .ob-orb { animation: none; } }

  /* ── Header dots + skip ── */
  .ob-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 8px;
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .ob-dots { display: flex; align-items: center; gap: 7px; }
  .ob-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,.22);
    transition: background .3s, width .3s;
    border: 0; padding: 0; cursor: default;
  }
  .ob-dot.active { width: 22px; border-radius: 4px; background: var(--a); box-shadow: 0 0 10px color-mix(in srgb, var(--a) 60%, transparent); }
  .ob-dot.done { background: color-mix(in srgb, var(--a) 45%, transparent); }
  .ob-skip {
    background: none; border: 0; color: rgba(255,255,255,.55);
    font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
    padding: 10px 6px; min-height: 44px;
  }
  .ob-skip:active { color: #fff; }

  /* ── Viewport + track (carrousel) ── */
  .ob-viewport { flex: 1; overflow: hidden; position: relative; z-index: 1; }
  .ob-track {
    display: flex; height: 100%;
    transition: transform .42s cubic-bezier(.22,1,.36,1);
  }
  @media (prefers-reduced-motion: reduce) { .ob-track { transition: none; } }
  .ob-slide {
    flex: 1 0 0; min-width: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 16px 28px;
    overflow-y: auto;
  }

  /* ── Halo pulsant ── */
  .ob-halo {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 100px; height: 100px; margin-bottom: 12px; flex-shrink: 0;
  }
  .ob-halo::before {
    content: ""; position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--a) 26%, transparent) 0%, transparent 70%);
  }
  .ob-slide.on .ob-halo::before { animation: obHalo 2.6s ease-in-out infinite; }
  @keyframes obHalo { 0%, 100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.18); opacity: 1; } }
  .ob-emoji {
    font-size: 64px; line-height: 1; position: relative;
    filter: drop-shadow(0 10px 22px rgba(0,0,0,.45));
  }
  .ob-slide.on .ob-emoji { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes obPop { 0% { transform: scale(.5) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

  /* ── Cascade d'entrée titre/body ── */
  .ob-slide .ob-title, .ob-slide .ob-body-txt { opacity: 0; }
  .ob-slide.on .ob-title { animation: obRise .5s cubic-bezier(.22,1,.36,1) .1s both; }
  .ob-slide.on .ob-body-txt { animation: obRise .5s cubic-bezier(.22,1,.36,1) .2s both; }
  .ob-slide.on .ob-badge { animation: obRise .5s cubic-bezier(.22,1,.36,1) .05s both; }
  @keyframes obRise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .ob-slide.on .ob-emoji, .ob-slide.on .ob-halo::before,
    .ob-slide.on .ob-title, .ob-slide.on .ob-body-txt, .ob-slide.on .ob-badge { animation: none; }
    .ob-slide .ob-title, .ob-slide .ob-body-txt { opacity: 1; }
  }

  .ob-badge {
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.01em; color: #fff;
    margin-bottom: 12px; opacity: .9;
  }
  .ob-badge span { color: var(--a); }

  .ob-title {
    font: 800 26px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #fff; letter-spacing: -.025em;
    margin: 0 0 12px; max-width: 18ch;
    outline: none; /* focus géré par JS, pas par le navigateur */
  }
  .ob-title .accent { color: var(--a); }
  .ob-body-txt {
    font: 500 15px/1.55 'Inter', sans-serif;
    color: rgba(255,255,255,.72);
    margin: 0; max-width: 32ch;
  }

  /* ── Slide quiz ── */
  .ob-quiz-eyebrow {
    font: 700 11px/1 'Inter', sans-serif;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--a); margin: 0 0 8px;
    opacity: 0;
  }
  .ob-slide-quiz.on .ob-quiz-eyebrow { animation: obRise .45s cubic-bezier(.22,1,.36,1) .05s both; }
  @media (prefers-reduced-motion: reduce) {
    .ob-slide-quiz.on .ob-quiz-eyebrow { animation: none; opacity: 1; }
  }

  .ob-sign {
    font-size: 72px; line-height: 1; margin-bottom: 10px;
    filter: drop-shadow(0 8px 18px rgba(0,0,0,.5));
    opacity: 0;
  }
  .ob-slide-quiz.on .ob-sign { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) .08s both; }
  @media (prefers-reduced-motion: reduce) { .ob-slide-quiz.on .ob-sign { animation: none; opacity: 1; } }

  .ob-title-quiz { font-size: 20px; margin-bottom: 18px; }

  .ob-quiz-answers {
    display: flex; flex-direction: column; gap: 10px;
    width: 100%; max-width: 340px;
    opacity: 0;
  }
  .ob-slide-quiz.on .ob-quiz-answers { animation: obRise .5s cubic-bezier(.22,1,.36,1) .22s both; }
  @media (prefers-reduced-motion: reduce) { .ob-slide-quiz.on .ob-quiz-answers { animation: none; opacity: 1; } }

  .ob-quiz-btn {
    width: 100%; padding: 15px 18px;
    border: 2px solid rgba(255,255,255,.18);
    border-radius: 14px;
    background: rgba(255,255,255,.07);
    color: #fff; font: 600 15px/1.35 'Inter', sans-serif;
    cursor: pointer; min-height: 52px;
    text-align: left;
    transition: border-color .15s, background .15s, transform .1s;
  }
  .ob-quiz-btn:active { transform: scale(.98); }
  .ob-quiz-btn:hover:not(:disabled) { border-color: rgba(255,255,255,.38); background: rgba(255,255,255,.12); }
  .ob-quiz-btn.correct {
    border-color: #22c55e;
    background: rgba(34,197,94,.15);
    color: #86efac;
  }
  .ob-quiz-btn.wrong {
    border-color: rgba(239,68,68,.6);
    background: rgba(239,68,68,.1);
    color: rgba(255,255,255,.55);
    text-decoration: line-through;
  }
  .ob-quiz-btn:disabled { cursor: default; }

  .ob-quiz-result {
    margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 6px;
    animation: obRise .45s cubic-bezier(.22,1,.36,1) both;
  }
  .ob-quiz-xp {
    font: 800 28px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--a);
    letter-spacing: -.02em;
    filter: drop-shadow(0 0 16px color-mix(in srgb, var(--a) 60%, transparent));
  }
  .ob-quiz-xp.win { animation: obBounce .6s cubic-bezier(.34,1.56,.64,1) both; }
  .ob-quiz-xp.consolation { color: rgba(255,255,255,.75); font-size: 20px; }
  @keyframes obBounce { 0% { transform: scale(.4); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .ob-quiz-xp.win { animation: none; }
    .ob-quiz-result { animation: none; }
  }
  .ob-quiz-msg {
    font: 500 14px/1.45 'Inter', sans-serif;
    color: rgba(255,255,255,.7);
    max-width: 30ch;
  }

  /* ── Slide perso (avatar + couleur fusionnés) ── */
  .ob-slide-perso { justify-content: flex-start; padding-top: 12px; }
  .ob-slide-perso .ob-halo { width: 80px; height: 80px; margin-bottom: 8px; }
  .ob-slide-perso .ob-emoji { font-size: 48px; }
  .ob-perso-label {
    font: 700 11px/1 'Inter', sans-serif;
    letter-spacing: .06em; text-transform: uppercase;
    color: rgba(255,255,255,.5);
    margin: 14px 0 8px; align-self: flex-start;
    opacity: 0;
  }
  .ob-slide-perso.on .ob-perso-label { animation: obRise .45s cubic-bezier(.22,1,.36,1) .18s both; }
  @media (prefers-reduced-motion: reduce) { .ob-slide-perso.on .ob-perso-label { animation: none; opacity: 1; } }

  .ob-color-hint { font-size: 13px; margin-bottom: 8px; }

  /* ── Avatar grid (3 colonnes) ── */
  .ob-av-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    width: 100%; max-width: 340px;
  }
  .ob-av-card {
    position: relative; aspect-ratio: 1;
    border-radius: 12px; overflow: hidden; cursor: pointer;
    border: 2.5px solid transparent;
    background: rgba(255,255,255,.06);
    padding: 0; transition: border-color .15s, transform .12s;
  }
  .ob-av-card:active { transform: scale(.95); }
  .ob-av-card.sel { border-color: var(--a); }
  .ob-av-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ob-av-check {
    position: absolute; top: 4px; right: 4px;
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--a); color: var(--a-ink);
    font-size: 12px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: scale(.5); transition: opacity .15s, transform .15s;
  }
  .ob-av-card.sel .ob-av-check { opacity: 1; transform: scale(1); }

  /* ── Palette couleurs (2 rangées de 3) ── */
  .ob-color-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    width: 100%; max-width: 340px;
  }
  .ob-color-sw {
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    padding: 12px 4px; border-radius: 12px; cursor: pointer;
    border: 2.5px solid transparent;
    background: rgba(255,255,255,.06);
    transition: border-color .15s, transform .12s, background .15s;
  }
  .ob-color-sw:active { transform: scale(.94); }
  .ob-color-sw.sel { border-color: #fff; background: rgba(255,255,255,.12); }
  .ob-color-dot {
    position: relative;
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, var(--sw), var(--sw-dk));
    box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--sw) 65%, transparent),
                inset 0 2px 4px rgba(255,255,255,.35);
  }
  .ob-color-sw.sel .ob-color-dot::after {
    content: '✓'; position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font: 800 17px/1 'Inter', sans-serif;
    text-shadow: 0 1px 3px rgba(0,0,0,.45);
  }
  .ob-color-name {
    font: 600 10.5px/1 'Inter', sans-serif; color: rgba(255,255,255,.78);
  }
  .ob-slide-perso.on .ob-color-sw {
    animation: obSwIn .45s cubic-bezier(.22,1,.36,1) both;
  }
  .ob-slide-perso.on .ob-color-sw:nth-child(1) { animation-delay: .22s; }
  .ob-slide-perso.on .ob-color-sw:nth-child(2) { animation-delay: .28s; }
  .ob-slide-perso.on .ob-color-sw:nth-child(3) { animation-delay: .34s; }
  .ob-slide-perso.on .ob-color-sw:nth-child(4) { animation-delay: .40s; }
  .ob-slide-perso.on .ob-color-sw:nth-child(5) { animation-delay: .46s; }
  .ob-slide-perso.on .ob-color-sw:nth-child(6) { animation-delay: .52s; }
  @keyframes obSwIn {
    from { opacity: 0; transform: translateY(14px) scale(.9); }
    to   { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) { .ob-slide-perso.on .ob-color-sw { animation: none; } }

  /* ── Slide notif ── */
  .ob-halo-bell::before {
    background: radial-gradient(circle, color-mix(in srgb, var(--a) 32%, transparent) 0%, transparent 70%);
  }
  .ob-slide.on .ob-bell {
    animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both, obRing 2.4s ease-in-out 1s infinite;
    transform-origin: 50% 8%;
  }
  @keyframes obRing {
    0%, 60%, 100% { rotate: 0deg; }
    64% { rotate: 12deg; } 68% { rotate: -10deg; }
    72% { rotate: 7deg; } 76% { rotate: -5deg; } 80% { rotate: 2deg; }
  }
  @media (prefers-reduced-motion: reduce) { .ob-slide.on .ob-bell { animation: none; } }

  /* Tease coffre */
  .ob-chest-tease {
    display: flex; align-items: center; gap: 12px;
    width: 100%; max-width: 340px; margin-top: 16px;
    padding: 12px 14px; border-radius: 14px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.12);
    text-align: left;
    opacity: 0;
  }
  .ob-slide-notif.on .ob-chest-tease {
    animation: obRise .5s cubic-bezier(.22,1,.36,1) .28s both;
  }
  @media (prefers-reduced-motion: reduce) {
    .ob-slide-notif.on .ob-chest-tease { animation: none; opacity: 1; }
  }
  .ob-chest-ico { font-size: 32px; flex-shrink: 0; }
  .ob-chest-title { font: 700 14px/1.3 'Inter', sans-serif; color: #fff; }
  .ob-chest-sub { font: 500 12.5px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.6); margin-top: 2px; }

  /* Preview notif (cosmétique) */
  .ob-notif-preview {
    display: flex; gap: 11px; align-items: center; text-align: left;
    width: 100%; max-width: 340px; margin-top: 12px;
    padding: 12px 13px; border-radius: 14px;
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.14);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    opacity: 0;
  }
  .ob-slide-notif.on .ob-notif-preview { animation: obDropIn .6s cubic-bezier(.22,1.4,.36,1) .4s both; }
  @keyframes obDropIn { from { transform: translateY(-18px) scale(.93); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ob-slide-notif.on .ob-notif-preview { animation: none; opacity: 1; } }
  .ob-notif-ico { width: 36px; height: 36px; border-radius: 9px; object-fit: contain; flex-shrink: 0; }
  .ob-notif-txt { min-width: 0; }
  .ob-notif-app { font: 700 10.5px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .02em; }
  .ob-notif-app span { font-weight: 500; text-transform: none; float: right; }
  .ob-notif-title { font: 700 13.5px/1.35 'Inter', sans-serif; color: #fff; margin-top: 1px; }
  .ob-notif-body { font: 400 12.5px/1.4 'Inter', sans-serif; color: rgba(255,255,255,.72); }
  .ob-notif-note {
    font: 500 12.5px/1.5 'Inter', sans-serif; color: rgba(255,255,255,.5);
    margin: 10px 0 0; max-width: 30ch;
    text-align: center;
  }
  .ob-slide-notif.granted .ob-notif-preview {
    border-color: color-mix(in srgb, var(--a) 65%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 30%, transparent);
  }
  .ob-slide-notif.granted .ob-notif-note { color: var(--a); font-weight: 700; }

  /* ── Sous-step A2HS (hors carrousel) ── */
  .ob-a2hs-wrap {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 16px 28px; text-align: center;
    overflow-y: auto; position: relative; z-index: 1;
    animation: obFade .3s ease both;
  }
  .ob-a2hs-badge {
    width: 76px; height: 76px; object-fit: contain; margin-bottom: 16px;
    filter: drop-shadow(0 10px 22px rgba(16,185,129,.4));
    animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both;
  }
  .ob-a2hs-steps { width: 100%; max-width: 340px; text-align: left; margin-top: 16px; }
  /* Override tokens du composant partagé a2hs-steps sur fond sombre de l'onboarding */
  .ob-a2hs-wrap .a2s-step {
    background: rgba(255,255,255,.08);
    border-color: rgba(255,255,255,.15);
  }
  .ob-a2hs-wrap .a2s-txt { color: #fff; }
  .ob-a2hs-wrap .a2s-glyph.share { background: rgba(10,132,255,.22); color: #4da6ff; }
  .ob-a2hs-wrap .a2s-glyph.plus,
  .ob-a2hs-wrap .a2s-glyph.dots { background: rgba(255,255,255,.1); color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.2); }
  .ob-a2hs-wrap .a2s-point { color: rgba(255,255,255,.6); }
  .ob-a2hs-install {
    width: 100%; margin-bottom: 12px; border: 0; border-radius: 12px;
    background: linear-gradient(135deg, var(--a), var(--adk, var(--a))); color: var(--a-ink);
    font: 800 15px/1 'Inter', sans-serif; padding: 14px; cursor: pointer;
    box-shadow: 0 8px 20px -6px color-mix(in srgb, var(--a) 55%, transparent);
  }
  .ob-a2hs-install:active { transform: translateY(1px); }
  .ob-a2hs-install:disabled { opacity: .6; cursor: wait; }
  .ob-plat-switch {
    margin-top: 12px; background: none; border: 0;
    color: rgba(255,255,255,.45); font: 500 13px/1 'Inter', sans-serif;
    cursor: pointer; padding: 10px; min-height: 44px;
  }
  .ob-plat-switch:active { color: rgba(255,255,255,.8); }

  /* ── Footer CTA ── */
  .ob-footer {
    flex-shrink: 0; position: relative; z-index: 1;
    padding: 12px 24px calc(env(safe-area-inset-bottom, 0px) + 20px);
    display: flex; flex-direction: column; gap: 4px;
  }
  .ob-cta {
    position: relative; overflow: hidden;
    width: 100%; padding: 17px;
    background: linear-gradient(135deg, var(--a), var(--adk, var(--a)));
    border: 0; border-radius: 18px; color: var(--a-ink);
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 56px;
    box-shadow: 0 10px 28px -8px color-mix(in srgb, var(--a) 55%, transparent);
    transition: transform .12s, opacity .15s;
  }
  .ob-cta::after {
    content: ""; position: absolute; top: 0; bottom: 0; width: 46%;
    left: -60%; transform: skewX(-18deg);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.26), transparent);
    animation: obShine 3.4s ease-in-out infinite;
  }
  @keyframes obShine { 0%, 55% { left: -60%; } 85%, 100% { left: 130%; } }
  @media (prefers-reduced-motion: reduce) { .ob-cta::after { animation: none; display: none; } }
  .ob-cta:active:not(:disabled) { transform: scale(.98); }
  .ob-cta:disabled { opacity: .55; cursor: default; }
  .ob-later {
    background: none; border: 0; color: rgba(255,255,255,.5);
    font: 600 14px/1 'Inter', sans-serif; cursor: pointer;
    padding: 12px; min-height: 44px;
  }
  .ob-later:active { color: #fff; }
</style>`;
