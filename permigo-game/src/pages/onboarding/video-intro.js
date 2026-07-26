// ═══════════════════════════════════════════════════════════════
// Intro vidéo post-onboarding — remplace l'accroche « mise en situation ».
//
// Deux temps :
//   1. Carte d'accroche « Laisse-nous te présenter PermiGo » + bouton OK.
//      Le clic sur OK fournit le GESTE UTILISATEUR qui autorise la lecture
//      de la vidéo AVEC le son (sinon les navigateurs bloquent l'autoplay).
//   2. La vidéo promotionnelle en plein écran, avec une petite croix (✕)
//      en haut à droite pour la passer.
//
// Fin de vidéo OU croix OU erreur de chargement → onDone() (l'onboarding
// enchaîne alors sur l'accueil). onDone n'est JAMAIS appelé deux fois.
//
// La vidéo (public/video/permigo-intro.mp4) est un H.264 1080p +faststart,
// converti depuis le .MOV 4K/HEVC d'origine (lecture progressive web).
// ═══════════════════════════════════════════════════════════════
import { track } from "@/services/analytics.js";
import { haptic } from "@/utils/haptic.js";
import { esc } from "@/utils/escape.js";
import { getLang } from "@/utils/lang.js";

const VIDEO_SRC = "/video/permigo-intro.mp4";
const POSTER_SRC = "/video/permigo-intro-poster.jpg";

// ─── i18n (coque) — traduction seule, repli FR ───
const VI_I18N = {
  en: {
    dialog_aria: "PermiGo introduction",
    title: "Let us introduce PermiGo",
    lead: "One minute to see how we get you ready for every lesson.",
    ok: "OK, show me",
    later: "Later",
    skip_aria: "Skip the video",
  },
  ar: {
    dialog_aria: "تقديم بيرميغو",
    title: "دعنا نُعرّفك على بيرميغو",
    lead: "دقيقة واحدة لتكتشف كيف نحضّرك لكل درس من دروسك.",
    ok: "حسناً، أرِني",
    later: "لاحقاً",
    skip_aria: "تخطّي الفيديو",
  },
};
function t(key, fr) {
  const l = getLang();
  return esc((l !== "fr" && VI_I18N[l]?.[key]) || fr);
}

export function mountVideoIntro(root, onDone) {
  let done = false;
  const finish = (reason) => {
    if (done) return;
    done = true;
    track("onboarding.video_intro_end", { reason });
    if (typeof onDone === "function") onDone();
  };

  const arrow = getLang() === "ar" ? "←" : "→";
  root.innerHTML = `
    ${STYLE}
    <div class="vi" role="dialog" aria-modal="true" aria-label="${t("dialog_aria", "Présentation de PermiGo")}">

      <!-- ── Étape 1 : carte d'accroche ── -->
      <div class="vi-gate" id="vi-gate">
        <span class="vi-eyebrow">Permi<b>Go</b></span>
        <div class="vi-mascot-wrap">
          <img class="vi-mascot" src="/skins/mascot-hello.png" alt="" />
        </div>
        <h1 class="vi-title" tabindex="-1">${t("title", "Laisse-nous te présenter PermiGo")}</h1>
        <p class="vi-lead">${t("lead", "Une minute pour découvrir comment on prépare chacune de tes leçons.")}</p>
        <button class="vi-ok" id="vi-ok" type="button">
          ${t("ok", "OK, montre-moi")} <span class="vi-ok-arr" aria-hidden="true">${arrow}</span>
        </button>
        <button class="vi-skip-gate" id="vi-skip-gate" type="button">${t("later", "Plus tard")}</button>
      </div>

      <!-- ── Étape 2 : lecteur vidéo (masqué au départ) ── -->
      <div class="vi-player" id="vi-player" hidden>
        <video
          class="vi-video"
          id="vi-video"
          src="${VIDEO_SRC}"
          poster="${POSTER_SRC}"
          playsinline
          preload="none"
        ></video>
        <div class="vi-loading" id="vi-loading" aria-hidden="true"><i></i><i></i><i></i></div>
        <button class="vi-close" id="vi-close" type="button" aria-label="${t("skip_aria", "Passer la vidéo")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const gate = root.querySelector("#vi-gate");
  const player = root.querySelector("#vi-player");
  const video = root.querySelector("#vi-video");
  const loading = root.querySelector("#vi-loading");
  const okBtn = root.querySelector("#vi-ok");
  const skipGate = root.querySelector("#vi-skip-gate");
  const closeBtn = root.querySelector("#vi-close");

  track("onboarding.video_intro_shown", {});

  // Focus sur le titre (a11y) au montage.
  requestAnimationFrame(() =>
    root.querySelector(".vi-title")?.focus({ preventScroll: true }),
  );

  // ── OK → on lance la vidéo (dans le geste tactile → son autorisé) ──
  okBtn.addEventListener("click", async () => {
    haptic("tap");
    track("onboarding.video_intro_play", {});
    gate.hidden = true;
    player.hidden = false;

    try {
      // La vidéo reste à zéro octet avant le choix explicite de l'élève.
      video.load();
      await video.play(); // avec son : autorisé car dans le geste utilisateur
    } catch {
      // Autoplay avec son refusé malgré le geste → on retente en muet.
      try {
        video.muted = true;
        await video.play();
      } catch {
        // Lecture impossible → on n'emprisonne pas l'élève.
        finish("play_error");
      }
    }
  });

  // Le poster masque un éventuel écran noir avant le premier frame ; on
  // cache l'indicateur de chargement dès que ça joue.
  video.addEventListener("playing", () => {
    if (loading) loading.style.display = "none";
  });
  video.addEventListener("waiting", () => {
    if (loading) loading.style.display = "";
  });

  // Fin naturelle → suite.
  video.addEventListener("ended", () => finish("ended"));
  // Fichier introuvable / décodage impossible → on continue, pas de blocage.
  video.addEventListener("error", () => finish("media_error"));

  // ── Croix : passer la vidéo ──
  closeBtn.addEventListener("click", () => {
    haptic("tap");
    try {
      video.pause();
    } catch {}
    finish("skipped");
  });

  // ── « Plus tard » sur la carte : sauter toute la présentation ──
  skipGate.addEventListener("click", () => {
    haptic("tap");
    finish("gate_skipped");
  });
}

// ─── Styles (cinématique nuit-violet, cohérent avec l'onboarding Arène) ───
const STYLE = `<style>
  .vi {
    position: fixed; inset: 0; z-index: 10000;
    display: flex; flex-direction: column;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: #fff; -webkit-font-smoothing: antialiased;
    background:
      radial-gradient(120% 70% at 50% -8%, rgba(255,206,77,.16) 0%, rgba(255,206,77,0) 46%),
      linear-gradient(180deg, #241a4d 0%, #2c2160 42%, #3a2a7a 100%);
    animation: viFade .3s ease both;
  }
  @keyframes viFade { from { opacity: 0; } to { opacity: 1; } }

  /* L'attribut [hidden] doit gagner sur les display:flex ci-dessous
     (sinon la carte et le lecteur restent visibles en même temps). */
  .vi-gate[hidden], .vi-player[hidden] { display: none !important; }

  /* ── Étape 1 : carte d'accroche ── */
  .vi-gate {
    flex: 1; min-height: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; gap: 6px;
    padding: calc(env(safe-area-inset-top, 0px) + 24px) 26px calc(env(safe-area-inset-bottom, 0px) + 24px);
  }
  .vi-eyebrow {
    font: 700 14px/1 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
    letter-spacing: 2.4px; text-transform: uppercase;
    color: #cdc2f5; margin-bottom: 10px;
  }
  .vi-eyebrow b { color: #ffce4d; text-shadow: 0 0 14px rgba(255,206,77,.5); }
  .vi-mascot-wrap {
    position: relative; width: 150px; height: 150px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
  }
  .vi-mascot-wrap::before {
    content: ""; position: absolute; inset: -6px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,206,77,.40) 0%, rgba(124,77,255,.30) 42%, rgba(124,77,255,0) 70%);
    filter: blur(4px);
  }
  .vi-mascot {
    position: relative; width: 140px; height: 140px; object-fit: contain;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,.45));
    animation: viPop .55s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes viPop { 0% { transform: scale(.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .vi-mascot { animation: none; } }
  .vi-title {
    /* color explicite : l'écran est TOUJOURS sombre, or une règle globale
       (base.css : h1,h2,h3,h4 { color: var(--ink) }) rendrait ce <h1> noir
       en thème clair → titre noir sur fond sombre. On force le blanc. */
    color: #fff;
    font: 800 27px/1.15 'Baloo 2', 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.3px; margin: 0 0 6px; max-width: 340px;
    text-shadow: 0 2px 10px rgba(0,0,0,.3); outline: none;
  }
  .vi-lead {
    font: 500 15.5px/1.5 'Plus Jakarta Sans', sans-serif;
    color: #cdc2f5; max-width: 300px; margin: 0 0 26px;
  }
  .vi-ok {
    display: inline-flex; align-items: center; gap: 8px;
    border: 0; cursor: pointer; min-height: 56px; padding: 0 30px;
    border-radius: 17px;
    font: 800 18px/1 'Baloo 2', 'Plus Jakarta Sans', sans-serif; color: #1a1233;
    background: linear-gradient(180deg, #ffe39a, #f0a500);
    box-shadow: 0 5px 0 #b87d00, 0 8px 20px rgba(255,206,77,.35), 0 0 0 1px rgba(255,255,255,.5) inset;
    transition: transform .12s, box-shadow .12s;
  }
  .vi-ok:active { transform: translateY(3px); box-shadow: 0 2px 0 #b87d00, 0 4px 12px rgba(255,206,77,.3), 0 0 0 1px rgba(255,255,255,.5) inset; }
  .vi-ok-arr { font-size: 20px; }
  .vi-skip-gate {
    margin-top: 18px; background: none; border: 0; cursor: pointer;
    color: #9b8fd0; font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
    padding: 10px 14px; min-height: 44px;
  }
  .vi-skip-gate:active { color: #fff; }
  .vi-ok:focus-visible, .vi-skip-gate:focus-visible, .vi-close:focus-visible {
    outline: 3px solid #fff; outline-offset: 2px;
  }

  /* ── Étape 2 : lecteur vidéo ── */
  .vi-player {
    position: fixed; inset: 0; z-index: 1;
    background: #000;
    display: flex; align-items: center; justify-content: center;
  }
  .vi-video {
    width: 100%; height: 100%; object-fit: contain; background: #000;
  }
  .vi-close {
    position: absolute; z-index: 3;
    top: calc(env(safe-area-inset-top, 0px) + 12px); right: 14px;
    width: 42px; height: 42px; border-radius: 50%;
    display: grid; place-items: center; cursor: pointer;
    color: #fff; border: 0;
    background: rgba(0,0,0,.45);
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
    box-shadow: 0 2px 10px rgba(0,0,0,.4);
    transition: transform .12s, background .15s;
  }
  .vi-close:active { transform: scale(.9); background: rgba(0,0,0,.65); }
  .vi-close svg { width: 22px; height: 22px; }

  /* ── Indicateur de chargement (3 points) ── */
  .vi-loading {
    position: absolute; z-index: 2; display: flex; gap: 8px;
  }
  .vi-loading i {
    width: 11px; height: 11px; border-radius: 50%;
    background: rgba(255,255,255,.85);
    animation: viBounce 1s ease-in-out infinite;
  }
  .vi-loading i:nth-child(2) { animation-delay: .15s; }
  .vi-loading i:nth-child(3) { animation-delay: .3s; }
  @keyframes viBounce { 0%, 80%, 100% { transform: scale(.5); opacity: .4; } 40% { transform: scale(1); opacity: 1; } }
</style>`;
