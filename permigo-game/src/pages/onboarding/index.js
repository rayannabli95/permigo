// ═══════════════════════════════════════════════════════════════
// Onboarding élève — tour de bienvenue 5 écrans (carrousel swipe)
// Déclenché par main.js quand profiles.first_value_action_at IS NULL
// Inspiré des meilleurs onboardings mobiles (Duolingo/Notion) :
// 1 idée par écran, copy orientée bénéfice, transitions fluides,
// swipe natif, progression claire, perso (prénom + avatar), skippable.
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
import { unlockChest } from "@/utils/game-state.js";

// Pictos inline pour le tuto "ajouter à l'écran d'accueil"
const A2HS_SHARE = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>`;
const A2HS_DOTS = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
const A2HS_PLUS = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;

// ─── Contenu des 4 écrans narratifs (le 5e = avatar) ─────────────
const SLIDES = [
  {
    emoji: "🚗",
    badge: "PermiGo",
    title: 'Bienvenue, <span class="accent">{prenom}</span> !',
    body: "Ton permis, une victoire par jour. On avance ensemble : toi, ton moniteur, et un parcours clair.",
    cta: "Commencer",
  },
  {
    emoji: "🗺️",
    title: "31 compétences, zéro brouillard",
    body: "Le programme officiel du permis transformé en parcours. Tu avances compétence par compétence, et ton moniteur valide ce que tu maîtrises en séance.",
    cta: "Continuer",
  },
  {
    emoji: "⚡",
    title: "Ancre ce que tu apprends",
    body: "Après chaque compétence, un quiz éclair de 30 secondes. Une question ratée ? On te la represente quelques jours plus tard, pile au bon moment. C'est la mémoire qui dure.",
    cta: "Continuer",
  },
  {
    emoji: "🔥",
    title: "Reviens chaque jour",
    body: "Chaque jour de pratique fait monter ton streak, débloque des trophées et te place dans le classement de ton auto-école. Du jeu, pour de vrais résultats.",
    cta: "Continuer",
  },
  // 5e écran : choix d'avatar (interactif) + CTA final, géré à part.
];

export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("onboarding.start", { role: me.role });

  // Dernière étape = tuto "ajouter à l'écran d'accueil" (sauf si déjà installée)
  const showA2HS = !isStandalone();
  const AVATAR_I = SLIDES.length;
  const A2HS_I = SLIDES.length + 1;
  const TOTAL = SLIDES.length + 1 + (showA2HS ? 1 : 0);

  let idx = 0;
  let avatar =
    me.avatar_url && ASSETS.avatar?.includes(me.avatar_url)
      ? me.avatar_url
      : ASSETS.avatar?.[0] || null;
  let a2hsPlat = guessPlatform() === "android" ? "android" : "ios";
  let finishing = false;

  root.innerHTML = `
    ${STYLE}
    <div class="ob" role="dialog" aria-modal="true" aria-label="Tour de bienvenue">
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
              <div class="ob-emoji" aria-hidden="true">${s.emoji}</div>
              ${s.badge ? `<div class="ob-badge">Permi<span>Go</span></div>` : ""}
              <h1 class="ob-title">${s.title.replace("{prenom}", esc(me.prenom || me.nom || "toi"))}</h1>
              <p class="ob-body-txt">${esc(s.body)}</p>
            </section>
          `,
          ).join("")}
          <section class="ob-slide ob-slide-avatar" data-i="${AVATAR_I}">
            <div class="ob-emoji" aria-hidden="true">${icon("palette", { size: 34 })}</div>
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
      </div>
    </div>
  `;

  const track$ = root.querySelector("#ob-track");
  const ctaBtn = root.querySelector("#ob-cta");
  const dotsEl = root.querySelector("#ob-dots");
  const viewport = root.querySelector("#ob-viewport");

  const lastIdx = TOTAL - 1;
  function isLast() {
    return idx === lastIdx;
  }
  function isAvatar() {
    return idx === AVATAR_I;
  }
  function isA2HS() {
    return showA2HS && idx === A2HS_I;
  }

  function update() {
    track$.style.transform = `translateX(-${(idx * 100) / TOTAL}%)`;
    dotsEl.querySelectorAll(".ob-dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("done", i < idx);
    });
    // Ré-anime l'emoji du slide actif
    root.querySelectorAll(".ob-slide").forEach((s, i) => {
      s.classList.toggle("on", i === idx);
      s.setAttribute("aria-hidden", i === idx ? "false" : "true");
    });
    if (isLast()) {
      ctaBtn.innerHTML = "Voir mon parcours";
    } else if (isAvatar()) {
      ctaBtn.innerHTML = 'Continuer <span aria-hidden="true">→</span>';
    } else {
      ctaBtn.innerHTML = `${esc(SLIDES[idx].cta)} <span aria-hidden="true">→</span>`;
    }
    track("onboarding.step_viewed", { step: idx + 1 });
  }

  function goTo(i) {
    idx = Math.max(0, Math.min(TOTAL - 1, i));
    haptic?.("tap");
    update();
  }
  function next() {
    isLast() ? finish() : goTo(idx + 1);
  }
  function prev() {
    if (idx > 0) goTo(idx - 1);
  }

  ctaBtn.addEventListener("click", next);

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
        dx < 0 ? next() : prev();
      }
    },
    { passive: true },
  );

  // Clavier (flèches)
  function onKey(e) {
    if (e.key === "ArrowRight") next();
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

  /* Header : dots + skip */
  .ob-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 8px;
    flex-shrink: 0;
  }
  .ob-dots { display: flex; align-items: center; gap: 7px; }
  .ob-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,.22);
    transition: background .3s, width .3s; cursor: pointer;
    border: 0; padding: 0;
  }
  .ob-dot.active { width: 22px; border-radius: 4px; background: var(--a); }
  .ob-dot.done { background: color-mix(in srgb, var(--a) 45%, transparent); }
  .ob-skip {
    background: none; border: 0; color: rgba(255,255,255,.55);
    font: 600 13px/1 'Inter', sans-serif; cursor: pointer;
    padding: 10px 6px; min-height: 44px;
  }
  .ob-skip:active { color: #fff; }

  /* Viewport + track (carrousel) */
  .ob-viewport { flex: 1; overflow: hidden; position: relative; }
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

  .ob-emoji {
    font-size: 76px; line-height: 1; margin-bottom: 20px;
    filter: drop-shadow(0 12px 28px rgba(0,0,0,.45));
  }
  .ob-slide.on .ob-emoji { animation: obPop .55s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes obPop { 0% { transform: scale(.5) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ob-slide.on .ob-emoji { animation: none; } }

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

  /* Footer CTA */
  .ob-footer {
    flex-shrink: 0;
    padding: 12px 24px calc(env(safe-area-inset-bottom, 0px) + 20px);
  }
  .ob-cta {
    width: 100%; padding: 17px;
    background: linear-gradient(135deg, var(--a), var(--adk, var(--adk)));
    border: 0; border-radius: 16px; color: #fff;
    font: 800 16px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; min-height: 56px;
    box-shadow: 0 10px 28px -8px color-mix(in srgb, var(--a) 55%, transparent);
    transition: transform .12s, opacity .15s;
  }
  .ob-cta:active { transform: scale(.98); }
  .ob-cta:disabled { opacity: .6; cursor: wait; }

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
