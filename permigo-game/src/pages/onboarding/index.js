// ═══════════════════════════════════════════════════════════════
// Onboarding élève — tour de bienvenue (carrousel swipe)
// Déclenché par main.js quand profiles.first_value_action_at IS NULL
// Inspiré des meilleurs onboardings mobiles (Duolingo/Notion) :
// 1 idée par écran, copy orientée bénéfice, transitions fluides,
// swipe natif, progression claire, perso (prénom + avatar), skippable.
// Écrans : 4 narratifs → avatar → notifs (opt-in réel) → écran d'accueil.
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

// Pictos inline pour le tuto "ajouter à l'écran d'accueil"
const A2HS_SHARE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>`;
const A2HS_DOTS = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
const A2HS_PLUS = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;

// ─── Contenu des 4 écrans narratifs ──────────────────────────────
const SLIDES = [
  {
    ico: "car",
    badge: "PermiGo",
    title: 'Bienvenue, <span class="accent">{prenom}</span> !',
    body: "Ton permis, une victoire par jour. On avance ensemble : toi, ton moniteur, et un parcours clair.",
    cta: "Commencer",
  },
  {
    ico: "map",
    title: "31 compétences, zéro brouillard",
    body: "Le programme officiel du permis transformé en parcours. Tu avances compétence par compétence, et ton moniteur valide ce que tu maîtrises en séance.",
    cta: "Continuer",
  },
  {
    ico: "zap",
    title: "Ancre ce que tu apprends",
    body: "Après chaque compétence, un quiz éclair de 30 secondes. Une question ratée ? On te la represente quelques jours plus tard, pile au bon moment. C'est la mémoire qui dure.",
    cta: "Continuer",
  },
  {
    ico: "flame",
    title: "Reviens chaque jour",
    body: "Chaque jour de pratique fait monter ton streak, débloque des trophées et te place dans le classement de ton auto-école. Du jeu, pour de vrais résultats.",
    cta: "Continuer",
  },
  // Écrans suivants (avatar / notifs / A2HS) gérés à part.
];

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("onboarding.start", { role: me.role });

  // Étape notifs : seulement si l'API existe (iOS hors PWA = pas dispo)
  // et que la permission n'est pas déjà accordée.
  const showNotif =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Notification.permission !== "granted";
  // Dernière étape = tuto "ajouter à l'écran d'accueil" (sauf si déjà installée)
  const showA2HS = !isStandalone();

  const AVATAR_I = SLIDES.length;
  const NOTIF_I = showNotif ? AVATAR_I + 1 : -1;
  const A2HS_I = AVATAR_I + 1 + (showNotif ? 1 : 0);
  const TOTAL = SLIDES.length + 1 + (showNotif ? 1 : 0) + (showA2HS ? 1 : 0);

  let idx = 0;
  let avatar =
    me.avatar_url && ASSETS.avatar?.includes(me.avatar_url)
      ? me.avatar_url
      : ASSETS.avatar?.[0] || null;
  let a2hsPlat = guessPlatform() === "android" ? "android" : "ios";
  let notifDone = false; // opt-in tenté (accordé OU refusé) → on peut avancer
  let notifBusy = false;
  let finishing = false;

  const prenom = esc(me.prenom || me.nom || "toi");

  root.innerHTML = `
    ${STYLE}
    <div class="ob" role="dialog" aria-modal="true" aria-label="Tour de bienvenue">
      <div class="ob-orb ob-orb-a" aria-hidden="true"></div>
      <div class="ob-orb ob-orb-b" aria-hidden="true"></div>
      <div class="ob-head">
        <div class="ob-dots" id="ob-dots">
          ${Array.from({ length: TOTAL }, (_, i) => `<span class="ob-dot${i === 0 ? " active" : ""}" data-i="${i}"></span>`).join("")}
        </div>
        <button class="ob-skip" id="ob-skip" type="button">Passer</button>
      </div>

      <div class="ob-viewport" id="ob-viewport">
        <div class="ob-track" id="ob-track" style="width:${TOTAL * 100}%">
          ${SLIDES.map(
            (s, i) => `
            <section class="ob-slide" data-i="${i}">
              <div class="ob-halo" aria-hidden="true"><div class="ob-emoji">${icon(s.ico, { size: 44 })}</div></div>
              ${s.badge ? `<div class="ob-badge">Permi<span>Go</span></div>` : ""}
              <h1 class="ob-title">${s.title.replace("{prenom}", prenom)}</h1>
              <p class="ob-body-txt">${esc(s.body)}</p>
            </section>
          `,
          ).join("")}
          <section class="ob-slide ob-slide-avatar" data-i="${AVATAR_I}">
            <div class="ob-halo" aria-hidden="true"><div class="ob-emoji">${icon("palette", { size: 34 })}</div></div>
            <h1 class="ob-title">Choisis ta tête</h1>
            <p class="ob-body-txt">Tu pourras en changer quand tu veux depuis ton profil.</p>
            <div class="ob-av-grid" id="ob-av-grid" role="radiogroup" aria-label="Choix de l'avatar">
              ${(ASSETS.avatar || [])
                .map(
                  (url, i) => `
                <button class="ob-av-card${url === avatar ? " sel" : ""}" data-url="${esc(url)}" role="radio" aria-checked="${url === avatar}" aria-label="Avatar ${i + 1}" type="button">
                  <img class="ob-av-img" src="${esc(url)}" alt="" loading="lazy" />
                  <span class="ob-av-check" aria-hidden="true">✓</span>
                </button>`,
                )
                .join("")}
            </div>
          </section>
          ${
            showNotif
              ? `
          <section class="ob-slide ob-slide-notif" data-i="${NOTIF_I}">
            <div class="ob-halo ob-halo-bell" aria-hidden="true"><div class="ob-emoji ob-bell">${icon("bell", { size: 40 })}</div></div>
            <h1 class="ob-title">Ton rappel quotidien</h1>
            <p class="ob-body-txt">Chaque soir, 3 questions, 2 minutes. C'est comme ça qu'on garde une longueur d'avance sur l'examen.</p>
            <div class="ob-notif-preview" aria-hidden="true">
              <img class="ob-notif-ico" src="/skins/avatars/permigo-badge-icon.png" alt="" />
              <div class="ob-notif-txt">
                <div class="ob-notif-app">PermiGo <span>maintenant</span></div>
                <div class="ob-notif-title">Ta question du jour t'attend</div>
                <div class="ob-notif-body">3 questions · 2 minutes — garde ton avance.</div>
              </div>
            </div>
            <p class="ob-notif-note" id="ob-notif-note">1 seul rappel par jour, jamais plus. Désactivable quand tu veux.</p>
          </section>`
              : ""
          }
          ${
            showA2HS
              ? `
          <section class="ob-slide ob-slide-a2hs" data-i="${A2HS_I}">
            <img class="ob-a2hs-badge" src="/skins/avatars/permigo-badge-icon.png" alt="" />
            <h1 class="ob-title">Garde PermiGo à portée de main</h1>
            <p class="ob-body-txt">Ajoute l'app à ton écran d'accueil pour l'ouvrir d'un seul geste, chaque jour.</p>
            <div class="ob-seg" role="tablist">
              <button class="ob-seg-btn" data-plat="ios" type="button">iPhone (iOS)</button>
              <button class="ob-seg-btn" data-plat="android" type="button">Android</button>
            </div>
            <div class="ob-a2hs-steps" id="ob-a2hs-steps"></div>
          </section>`
              : ""
          }
        </div>
      </div>

      <div class="ob-footer">
        <button class="ob-cta" id="ob-cta" type="button">${esc(SLIDES[0].cta)} <span aria-hidden="true">→</span></button>
        <button class="ob-later" id="ob-later" type="button" hidden>Plus tard</button>
      </div>
    </div>
  `;

  const track$ = root.querySelector("#ob-track");
  const ctaBtn = root.querySelector("#ob-cta");
  const laterBtn = root.querySelector("#ob-later");
  const dotsEl = root.querySelector("#ob-dots");
  const viewport = root.querySelector("#ob-viewport");

  const lastIdx = TOTAL - 1;
  function isLast() {
    return idx === lastIdx;
  }
  function isAvatar() {
    return idx === AVATAR_I;
  }
  function isNotif() {
    return showNotif && idx === NOTIF_I;
  }

  function update() {
    track$.style.transform = `translateX(-${(idx * 100) / TOTAL}%)`;
    dotsEl.querySelectorAll(".ob-dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("done", i < idx);
    });
    // Ré-anime le contenu du slide actif (cascade title/body)
    root.querySelectorAll(".ob-slide").forEach((s, i) => {
      s.classList.toggle("on", i === idx);
      s.setAttribute("aria-hidden", i === idx ? "false" : "true");
    });
    if (isNotif() && !notifDone) {
      ctaBtn.innerHTML = "Activer mes rappels 🔔";
    } else if (isLast()) {
      ctaBtn.innerHTML = "Voir mon parcours";
    } else if (isAvatar() || isNotif()) {
      ctaBtn.innerHTML = 'Continuer <span aria-hidden="true">→</span>';
    } else {
      ctaBtn.innerHTML = `${esc(SLIDES[idx].cta)} <span aria-hidden="true">→</span>`;
    }
    laterBtn.hidden = !(isNotif() && !notifDone);
    track("onboarding.step_viewed", { step: idx + 1 });
  }

  function goTo(i) {
    idx = Math.max(0, Math.min(TOTAL - 1, i));
    haptic?.("tap");
    update();
  }
  function advance() {
    isLast() ? finish() : goTo(idx + 1);
  }
  function prev() {
    if (idx > 0) goTo(idx - 1);
  }

  // ─── Opt-in notifications — DOIT rester synchrone dans le tap
  // (iOS exige le user gesture pour Notification.requestPermission)
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
        haptic?.("success");
        root.querySelector(".ob-slide-notif")?.classList.add("granted");
        if (note) note.textContent = "Rappels activés ✓ À ce soir !";
        // Petite pause pour laisser la célébration se voir, puis on avance.
        setTimeout(() => {
          ctaBtn.disabled = false;
          advance();
        }, 900);
        return;
      }
      if (note && Notification.permission === "denied") {
        note.textContent =
          "Notifications bloquées — tu pourras les autoriser dans les réglages du téléphone.";
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

  function next() {
    if (isNotif() && !notifDone) {
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

  // Dots cliquables (retour en arrière possible)
  dotsEl.querySelectorAll(".ob-dot").forEach((d) => {
    d.addEventListener("click", () => goTo(parseInt(d.dataset.i, 10)));
  });

  // Avatar
  root.querySelectorAll(".ob-av-card").forEach((card) => {
    card.addEventListener("click", () => {
      avatar = card.dataset.url;
      haptic?.("select");
      root.querySelectorAll(".ob-av-card").forEach((c) => {
        const on = c.dataset.url === avatar;
        c.classList.toggle("sel", on);
        c.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
  });

  // ─── Tuto "ajouter à l'écran d'accueil" (dernière slide) ──────────
  if (showA2HS) {
    const stepsEl = root.querySelector("#ob-a2hs-steps");

    const stepsIOS = () => `
      <div class="ob-a2hs-step"><span class="ob-a2hs-num">1</span><span>Dans <strong>Safari</strong>, touche le bouton Partager <span class="ob-a2hs-glyph">${A2HS_SHARE}</span> en bas.</span></div>
      <div class="ob-a2hs-step"><span class="ob-a2hs-num">2</span><span>Choisis <strong>« Sur l'écran d'accueil »</strong>.</span></div>
      <div class="ob-a2hs-step"><span class="ob-a2hs-num">3</span><span>Touche <strong>« Ajouter »</strong>. C'est fait !</span></div>`;

    const stepsAndroid = () => {
      const btn = canPromptInstall()
        ? `<button class="ob-a2hs-install" id="ob-a2hs-install" type="button">Installer l'app en 1 tap</button>`
        : "";
      return `${btn}
      <div class="ob-a2hs-step"><span class="ob-a2hs-num">1</span><span>Dans <strong>Chrome</strong>, touche le menu <span class="ob-a2hs-glyph">${A2HS_DOTS}</span> en haut à droite.</span></div>
      <div class="ob-a2hs-step"><span class="ob-a2hs-num">2</span><span>Choisis <strong>« Ajouter à l'écran d'accueil »</strong> <span class="ob-a2hs-glyph">${A2HS_PLUS}</span>.</span></div>
      <div class="ob-a2hs-step"><span class="ob-a2hs-num">3</span><span>Confirme avec <strong>« Ajouter »</strong>. C'est fait !</span></div>`;
    };

    const renderA2HSSteps = () => {
      root
        .querySelectorAll(".ob-seg-btn")
        .forEach((b) =>
          b.classList.toggle("active", b.dataset.plat === a2hsPlat),
        );
      stepsEl.innerHTML = a2hsPlat === "android" ? stepsAndroid() : stepsIOS();
      const ib = root.querySelector("#ob-a2hs-install");
      if (ib)
        ib.addEventListener("click", async () => {
          ib.disabled = true;
          ib.textContent = "Installation…";
          const outcome = await promptInstall();
          track("a2hs.install_prompt", { outcome, source: "onboarding" });
          if (outcome === "accepted") {
            finish();
            return;
          }
          ib.disabled = false;
          ib.textContent = "Installer l'app en 1 tap";
        });
    };

    root.querySelectorAll(".ob-seg-btn").forEach((b) =>
      b.addEventListener("click", () => {
        a2hsPlat = b.dataset.plat;
        track("a2hs.platform_selected", {
          platform: a2hsPlat,
          source: "onboarding",
        });
        renderA2HSSteps();
      }),
    );

    renderA2HSSteps();
  }

  // Skip → termine direct
  root.querySelector("#ob-skip").addEventListener("click", () => {
    track("onboarding.skipped", { at_step: idx + 1 });
    finish();
  });

  // Swipe horizontal (mobile natif)
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
      const dx = t.clientX - startX,
        dy = t.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        // Le swipe avant ne court-circuite pas l'opt-in : il "passe" l'étape
        if (dx < 0 && isNotif() && !notifDone) {
          track("onboarding.push_optin", { outcome: "swiped_past" });
          notifDone = true;
          advance();
          return;
        }
        dx < 0 ? advance() : prev();
      }
    },
    { passive: true },
  );

  // Clavier (flèches)
  function onKey(e) {
    if (e.key === "ArrowRight") advance();
    else if (e.key === "ArrowLeft") prev();
  }
  document.addEventListener("keydown", onKey);

  async function finish() {
    if (finishing) return;
    finishing = true;
    document.removeEventListener("keydown", onKey);
    track("onboarding.completed", {
      last_step: idx + 1,
      avatar_chosen: !!avatar,
    });
    ctaBtn.disabled = true;
    ctaBtn.innerHTML = "Lancement…";
    try {
      const now = new Date().toISOString();
      const patch = { first_value_action_at: now };
      if (avatar) patch.avatar_url = avatar;
      await sb.from("profiles").update(patch).eq("id", me.id);
      setCurUser({ ...me, ...patch });
    } catch (e) {
      console.error("[onboarding] finish update failed", e);
    }
    // Fallback localStorage : évite re-affichage si la mise à jour DB échoue
    try {
      localStorage.setItem("permigo_eleve_onboarding_done", "1");
    } catch {}
    // Coffre de bienvenue — crédité une seule fois, idempotent côté serveur.
    // L'élève le trouvera sur l'accueil dès son arrivée (teaser coffres).
    unlockChest("welcome", {
      xp: 50,
      gemmes: 25,
      title: "Bienvenu·e dans PermiGo !",
    }).catch(() => {});
    // Reboot complet → monte le chrome + flow normal, atterrit sur l'accueil
    // (le teaser "coffre à ouvrir" s'affiche immédiatement).
    location.hash = "#/";
    location.reload();
  }

  update();
}

const STYLE = `<style>
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

  /* Orbes lumineux flottants (profondeur, sans surcharger le GPU) */
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

  /* Header : dots + skip */
  .ob-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 8px;
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .ob-dots { display: flex; align-items: center; gap: 7px; }
  .ob-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,.22);
    transition: background .3s, width .3s; cursor: pointer;
    border: 0; padding: 0;
  }
  .ob-dot.active { width: 22px; border-radius: 4px; background: var(--a); box-shadow: 0 0 10px color-mix(in srgb, var(--a) 60%, transparent); }
  .ob-dot.done { background: color-mix(in srgb, var(--a) 45%, transparent); }
  .ob-skip {
    background: none; border: 0; color: rgba(255,255,255,.55);
    font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
    padding: 10px 6px; min-height: 44px;
  }
  .ob-skip:active { color: #fff; }

  /* Viewport + track (carrousel) */
  .ob-viewport { flex: 1; overflow: hidden; position: relative; z-index: 1; }
  .ob-track {
    display: flex; height: 100%;
    transition: transform .42s cubic-bezier(.4,0,.2,1);
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

  /* Halo pulsant derrière l'icône du slide */
  .ob-halo {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 124px; height: 124px; margin-bottom: 16px; flex-shrink: 0;
  }
  .ob-halo::before {
    content: ""; position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--a) 26%, transparent) 0%, transparent 70%);
  }
  .ob-slide.on .ob-halo::before { animation: obHalo 2.6s ease-in-out infinite; }
  @keyframes obHalo { 0%, 100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.18); opacity: 1; } }
  .ob-emoji {
    font-size: 76px; line-height: 1; position: relative;
    filter: drop-shadow(0 12px 28px rgba(0,0,0,.45));
  }
  .ob-slide.on .ob-emoji { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes obPop { 0% { transform: scale(.5) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

  /* Cascade d'entrée : titre puis texte (re-jouée à chaque slide) */
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
    margin-bottom: 14px; opacity: .9;
  }
  .ob-badge span { color: var(--a); }

  .ob-title {
    font: 800 27px/1.18 'Plus Jakarta Sans', sans-serif;
    color: #fff; letter-spacing: -.025em;
    margin: 0 0 14px; max-width: 18ch;
  }
  .ob-title .accent { color: var(--a); }
  .ob-body-txt {
    font: 500 16px/1.55 'Inter', sans-serif;
    color: rgba(255,255,255,.72);
    margin: 0; max-width: 32ch;
  }

  /* Avatar grid */
  .ob-av-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    margin-top: 24px; width: 100%; max-width: 340px;
  }
  .ob-av-card {
    position: relative; aspect-ratio: 1;
    border-radius: 18px; overflow: hidden; cursor: pointer;
    border: 2.5px solid transparent;
    background: rgba(255,255,255,.06);
    padding: 0; transition: border-color .15s, transform .12s;
  }
  .ob-av-card:active { transform: scale(.95); }
  .ob-av-card.sel { border-color: var(--a); }
  .ob-av-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ob-av-check {
    position: absolute; top: 5px; right: 5px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--a); color: #fff;
    font-size: 13px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: scale(.5); transition: opacity .15s, transform .15s;
  }
  .ob-av-card.sel .ob-av-check { opacity: 1; transform: scale(1); }

  /* Slide notifications : cloche qui sonne + faux aperçu de notif */
  .ob-halo-bell::before {
    background: radial-gradient(circle, color-mix(in srgb, var(--a) 32%, transparent) 0%, transparent 70%);
  }
  .ob-slide.on .ob-bell { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both, obRing 2.4s ease-in-out 1s infinite; transform-origin: 50% 8%; }
  @keyframes obRing {
    0%, 60%, 100% { rotate: 0deg; }
    64% { rotate: 12deg; } 68% { rotate: -10deg; }
    72% { rotate: 7deg; } 76% { rotate: -5deg; } 80% { rotate: 2deg; }
  }
  @media (prefers-reduced-motion: reduce) { .ob-slide.on .ob-bell { animation: none; } }
  .ob-notif-preview {
    display: flex; gap: 11px; align-items: center; text-align: left;
    width: 100%; max-width: 340px; margin-top: 22px;
    padding: 13px 14px; border-radius: 18px;
    background: rgba(255,255,255,.1);
    border: 1px solid rgba(255,255,255,.14);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 18px 40px -14px rgba(0,0,0,.55);
    opacity: 0;
  }
  .ob-slide.on .ob-notif-preview { animation: obDropIn .6s cubic-bezier(.22,1.4,.36,1) .35s both; }
  @keyframes obDropIn { from { transform: translateY(-22px) scale(.92); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ob-slide.on .ob-notif-preview { animation: none; opacity: 1; } }
  .ob-notif-ico { width: 40px; height: 40px; border-radius: 10px; object-fit: contain; flex-shrink: 0; }
  .ob-notif-txt { min-width: 0; }
  .ob-notif-app { font: 700 11.5px/1.3 'Inter', sans-serif; color: rgba(255,255,255,.65); text-transform: uppercase; letter-spacing: .02em; }
  .ob-notif-app span { font-weight: 500; text-transform: none; float: right; }
  .ob-notif-title { font: 700 14px/1.35 'Inter', sans-serif; color: #fff; margin-top: 2px; }
  .ob-notif-body { font: 400 13px/1.4 'Inter', sans-serif; color: rgba(255,255,255,.75); }
  .ob-notif-note {
    font: 500 13px/1.5 'Inter', sans-serif; color: rgba(255,255,255,.5);
    margin: 16px 0 0; max-width: 30ch;
  }
  .ob-slide-notif.granted .ob-notif-preview {
    border-color: color-mix(in srgb, var(--a) 65%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 30%, transparent), 0 18px 40px -14px rgba(0,0,0,.55);
  }
  .ob-slide-notif.granted .ob-notif-note { color: var(--a); font-weight: 700; }

  /* Footer CTA */
  .ob-footer {
    flex-shrink: 0; position: relative; z-index: 1;
    padding: 12px 24px calc(env(safe-area-inset-bottom, 0px) + 20px);
    display: flex; flex-direction: column; gap: 4px;
  }
  .ob-cta {
    position: relative; overflow: hidden;
    width: 100%; padding: 17px;
    background: linear-gradient(135deg, var(--a), var(--adk, var(--adk)));
    border: 0; border-radius: 16px; color: #fff;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 56px;
    box-shadow: 0 10px 28px -8px color-mix(in srgb, var(--a) 55%, transparent);
    transition: transform .12s, opacity .15s;
  }
  .ob-cta::after {
    content: ""; position: absolute; top: 0; bottom: 0; width: 46%;
    left: -60%; transform: skewX(-18deg);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
    animation: obShine 3.4s ease-in-out infinite;
  }
  @keyframes obShine { 0%, 55% { left: -60%; } 85%, 100% { left: 130%; } }
  @media (prefers-reduced-motion: reduce) { .ob-cta::after { animation: none; display: none; } }
  .ob-cta:active { transform: scale(.98); }
  .ob-cta:disabled { opacity: .6; cursor: wait; }
  .ob-later {
    background: none; border: 0; color: rgba(255,255,255,.55);
    font: 600 14px/1 'Inter', sans-serif; cursor: pointer;
    padding: 12px; min-height: 44px;
  }
  .ob-later:active { color: #fff; }

  /* Slide "ajouter à l'écran d'accueil" */
  .ob-a2hs-badge {
    width: 84px; height: 84px; object-fit: contain; margin-bottom: 18px;
    filter: drop-shadow(0 12px 26px rgba(16,185,129,.4));
  }
  .ob-slide.on .ob-a2hs-badge { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  .ob-seg {
    display: flex; gap: 6px; background: rgba(255,255,255,.07);
    padding: 5px; border-radius: 14px; margin: 22px 0 16px; width: 100%; max-width: 320px;
  }
  .ob-seg-btn {
    flex: 1; border: 0; background: transparent; padding: 11px 8px; border-radius: 10px;
    font: 700 14px/1 'Inter', sans-serif; color: rgba(255,255,255,.6); cursor: pointer; transition: .15s;
  }
  .ob-seg-btn.active { background: rgba(255,255,255,.16); color: #fff; }
  .ob-a2hs-steps { width: 100%; max-width: 340px; text-align: left; }
  .ob-a2hs-step {
    display: flex; gap: 11px; align-items: flex-start; padding: 9px 0;
    font: 500 14.5px/1.45 'Inter', sans-serif; color: rgba(255,255,255,.85);
  }
  .ob-a2hs-step + .ob-a2hs-step { border-top: 1px solid rgba(255,255,255,.08); }
  .ob-a2hs-step strong { color: #fff; font-weight: 700; }
  .ob-a2hs-num {
    flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--a); color: #fff; font: 800 13px/24px 'Inter'; text-align: center;
  }
  .ob-a2hs-glyph {
    display: inline-flex; vertical-align: -5px; margin: 0 2px; padding: 2px;
    border-radius: 6px; background: rgba(255,255,255,.12); color: #fff;
  }
  .ob-a2hs-install {
    width: 100%; margin-bottom: 14px; border: 0; border-radius: 13px;
    background: linear-gradient(135deg, var(--a), var(--adk, var(--adk))); color: #fff;
    font: 800 15px/1 'Inter'; padding: 14px; cursor: pointer;
    box-shadow: 0 8px 20px -6px color-mix(in srgb, var(--a) 55%, transparent);
  }
  .ob-a2hs-install:active { transform: translateY(1px); }
  .ob-a2hs-install:disabled { opacity: .6; cursor: wait; }
</style>`;
