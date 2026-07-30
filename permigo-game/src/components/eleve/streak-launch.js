// ═══════════════════════════════════════════════════════════════
// Animation « série au lancement » — façon TikTok/Snap.
// Au 1er accueil de la journée, la flamme surgit en GRAND au centre
// (jour de flamme, embers qui montent, le nombre de jours en gros),
// on savoure ~1,5 s, puis elle rétrécit et VOLE se poser dans le
// badge en haut à gauche (#streak-badge-btn) — pour que l'élève
// capte où « vit » sa série ensuite. Le vrai badge fait un petit
// pop de réception à l'atterrissage (continuité visuelle).
//
// Jouée 1× par jour. Tap n'importe où = on envoie la flamme se poser
// tout de suite (skip). Bail si : série cassée / à 0, reduced-motion,
// onglet en arrière-plan (rAF gelés) ou déjà vue aujourd'hui.
// Si l'élève quitte l'accueil pendant l'anim (hashchange) → on
// démonte tout proprement (overlay + timers + badge rétabli).
// ═══════════════════════════════════════════════════════════════
import { haptic, hapticRaw } from "@/utils/haptic.js";
import { track } from "@/services/analytics.js";

const LS_KEY = "pg-streak-launch-date";
const FLAME = "/skins/permigo-streak-flame-v1.webp";

// Timings (ms).
const POP_MS = 560; // entrée élastique de la flamme
const HOLD_MS = 1500; // temps de célébration au centre avant le vol
const FLY_MS = 620; // vol vers le badge (part vite, décélère dedans)
const REVEAL_AT = 480; // révèle/poppe le badge PENDANT que la flamme arrive (overlap)

// Braises qui montent derrière la flamme (position en %, taille px, timing s).
const EMBERS = [
  { l: 38, s: 9, d: 0.0, dur: 2.6 },
  { l: 46, s: 6, d: 0.5, dur: 3.1 },
  { l: 54, s: 11, d: 0.2, dur: 2.4 },
  { l: 61, s: 7, d: 0.9, dur: 2.9 },
  { l: 43, s: 5, d: 1.3, dur: 3.3 },
  { l: 57, s: 8, d: 0.7, dur: 2.7 },
  { l: 50, s: 6, d: 1.6, dur: 3.0 },
  { l: 35, s: 7, d: 1.0, dur: 3.2 },
  { l: 64, s: 5, d: 0.35, dur: 2.8 },
  { l: 49, s: 10, d: 1.9, dur: 2.5 },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function prefersReducedMotion() {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Joue l'animation de série au lancement si les conditions sont réunies.
 * À appeler après le render de l'accueil (le badge cible doit exister).
 * @param {{ streak?: {current_streak?:number}, streakSt?: string, targetSel?: string }} opts
 * @returns {boolean} true si l'animation a été lancée
 */
export function maybeShowStreakLaunch({
  streak,
  streakSt,
  targetSel = "#streak-badge-btn",
} = {}) {
  const days = streak?.current_streak || 0;
  if (days < 1) return false; // rien à célébrer
  if (streakSt === "broken") return false; // série cassée → pas de fête
  if (prefersReducedMotion()) return false; // accessibilité : pas d'anim
  if (document.querySelector(".stl, .fqr")) return false; // pas de télescopage

  // Déjà vue aujourd'hui ? (lecture protégée)
  try {
    if (localStorage.getItem(LS_KEY) === todayKey()) return false;
  } catch {
    /* localStorage indispo → on tente quand même (au pire 1×/session) */
  }

  // Onglet en arrière-plan : les requestAnimationFrame sont gelés → l'anim ne
  // jouerait pas. On attend le retour au premier plan et on NE consomme PAS la
  // journée (le flag n'est posé qu'après un lancement réussi, plus bas).
  if (typeof document !== "undefined" && document.hidden) {
    const onVis = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onVis);
      maybeShowStreakLaunch({ streak, streakSt, targetSel });
    };
    document.addEventListener("visibilitychange", onVis);
    return false;
  }

  // Joue, puis persiste le flag UNIQUEMENT si le lancement n'a pas levé
  // (sinon un throw synchrone « brûlerait » la journée sans rien montrer).
  try {
    playStreakLaunch(days, targetSel);
  } catch {
    return false;
  }
  try {
    localStorage.setItem(LS_KEY, todayKey());
  } catch {
    /* no-op */
  }
  return true;
}

const CSS = `
  .stl{position:fixed;inset:0;z-index:9000;overflow:hidden;pointer-events:auto;
    -webkit-tap-highlight-color:transparent;cursor:pointer;}
  .stl-bg{position:absolute;inset:0;opacity:0;transition:opacity .32s ease;
    background:radial-gradient(120% 85% at 50% 34%,#3a2a7a 0%,#211750 52%,#160f33 100%);}
  .stl.on .stl-bg{opacity:1;}
  .stl.flying .stl-bg{opacity:0;transition:opacity .5s ease;}

  .stl-embers{position:absolute;inset:0;opacity:0;transition:opacity .35s ease;pointer-events:none;}
  .stl.on .stl-embers{opacity:1;}
  .stl.flying .stl-embers{opacity:0;transition:opacity .25s ease;}
  .stl-embers span{position:absolute;bottom:34%;border-radius:50%;opacity:0;
    background:radial-gradient(circle,#ffe0a0 0%,#ff9a2e 55%,transparent 72%);
    animation:stlEmber linear infinite;}

  .stl-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
  .stl-flamewrap{position:relative;display:flex;flex-direction:column;align-items:center;
    will-change:transform,opacity;}
  .stl-glow{position:absolute;top:-6%;width:150%;height:110%;border-radius:50%;pointer-events:none;
    background:radial-gradient(circle,rgba(255,176,64,.55),rgba(255,120,0,.16) 46%,transparent 70%);
    filter:blur(8px);animation:stlPulse 1.7s ease-in-out infinite;}
  .stl-flame{position:relative;width:clamp(148px,45vw,206px);height:auto;object-fit:contain;
    filter:drop-shadow(0 18px 34px rgba(255,110,0,.42));
    animation:stlFlick 1.4s ease-in-out infinite;transform-origin:50% 82%;}
  .stl-num{position:relative;margin-top:-4px;letter-spacing:-.02em;
    font:900 clamp(58px,15vw,92px)/.9 'Archivo',sans-serif;
    background:linear-gradient(180deg,#ffeaa8 0%,#ffb420 68%,#ff8c1e 100%);
    -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 4px 12px rgba(255,140,0,.45));}

  .stl-caption{position:absolute;left:0;right:0;text-align:center;padding:0 28px;
    bottom:calc(17% + env(safe-area-inset-bottom,0px));
    opacity:0;transform:translateY(14px);
    transition:opacity .42s ease .16s,transform .42s cubic-bezier(.34,1.4,.64,1) .16s;}
  .stl.on .stl-caption{opacity:1;transform:none;}
  .stl.flying .stl-caption{opacity:0;transform:translateY(8px);transition:opacity .28s ease,transform .28s ease;}
  .stl-cap-big{font:800 clamp(22px,6.2vw,29px)/1.15 'Archivo',sans-serif;
    color:#fff;letter-spacing:-.01em;}
  .stl-cap-sub{margin-top:7px;font:600 13.5px/1.45 'Archivo',sans-serif;color:#d8ccff;}

  .stl-skip{position:absolute;left:0;right:0;text-align:center;pointer-events:none;
    bottom:calc(7% + env(safe-area-inset-bottom,0px));
    font:600 12px/1 'Archivo',sans-serif;color:#b9a9ee;letter-spacing:.02em;
    opacity:0;transition:opacity .5s ease;}
  .stl.skipcue .stl-skip{opacity:.85;}
  .stl.flying .stl-skip{opacity:0;transition:opacity .2s ease;}

  @keyframes stlFlick{0%,100%{transform:scale(1) rotate(0)}
    45%{transform:scale(1.05,1.09) rotate(-2deg)}72%{transform:scale(1.02,1.05) rotate(1.6deg)}}
  @keyframes stlPulse{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.95;transform:scale(1.08)}}
  @keyframes stlEmber{0%{transform:translateY(0) scale(1);opacity:0}
    14%{opacity:.9}100%{transform:translateY(-150px) scale(.35);opacity:0}}

  @media (prefers-reduced-motion:reduce){
    .stl-flame,.stl-glow,.stl-embers span{animation:none!important;}
  }
`;

function countUp(el, target) {
  if (target <= 1 || target > 60) {
    el.textContent = String(target);
    return;
  }
  el.textContent = "1";
  const dur = 650;
  const start = performance.now();
  const tick = (now) => {
    if (!el.isConnected) return; // overlay retiré entre-temps → on arrête
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.max(1, Math.round(eased * target)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function playStreakLaunch(days, targetSel) {
  const ov = document.createElement("div");
  ov.className = "stl";
  ov.setAttribute("aria-hidden", "true");
  ov.innerHTML = `
    <style>${CSS}</style>
    <div class="stl-bg"></div>
    <div class="stl-embers">
      ${EMBERS.map(
        (e) =>
          `<span style="left:${e.l}%;width:${e.s}px;height:${e.s}px;animation-delay:${e.d}s;animation-duration:${e.dur}s"></span>`,
      ).join("")}
    </div>
    <div class="stl-stage">
      <div class="stl-flamewrap">
        <div class="stl-glow"></div>
        <img class="stl-flame" src="${FLAME}" alt="">
        <div class="stl-num">${days}</div>
      </div>
    </div>
    <div class="stl-caption">
      <div class="stl-cap-big">${days} jour${days > 1 ? "s" : ""} de flamme</div>
      <div class="stl-cap-sub">Ta série continue 🔥</div>
    </div>
    <div class="stl-skip">Appuie pour continuer</div>
  `;
  document.body.appendChild(ov);

  const flamewrap = ov.querySelector(".stl-flamewrap");
  const numEl = ov.querySelector(".stl-num");
  const badge = document.querySelector(targetSel);

  track("streak_launch.shown", { days });
  haptic("success");

  let phase = "hold";
  let removed = false;
  let holdT = 0;
  let cueT = 0;
  let upT = 0;
  let revealT = 0;
  let safetyT = 0;
  let finishT = 0;

  const restoreBadge = () => {
    if (badge) {
      badge.style.opacity = "";
      badge.style.transition = "";
    }
  };

  const finish = () => {
    if (removed) return;
    removed = true;
    clearTimeout(holdT);
    clearTimeout(cueT);
    clearTimeout(upT);
    clearTimeout(revealT);
    clearTimeout(safetyT);
    clearTimeout(finishT);
    window.removeEventListener("hashchange", onHash);
    restoreBadge();
    ov.remove();
  };

  // L'élève quitte l'accueil pendant l'anim → on démonte tout (overlay collé
  // au <body>, timers, badge masqué) au lieu de laisser un fantôme plein écran.
  const onHash = () => finish();
  window.addEventListener("hashchange", onHash);

  const land = () => {
    if (removed || phase === "done") return;
    phase = "done";
    // Révèle le vrai badge + pop de réception PENDANT que la flamme (encore
    // faiblement visible) arrive → le badge « attrape » quelque chose.
    restoreBadge();
    if (badge) {
      badge.animate(
        [
          { transform: "scale(.55)" },
          { transform: "scale(1.2)", offset: 0.6 },
          { transform: "scale(1)" },
        ],
        { duration: 440, easing: "cubic-bezier(.34,1.56,.64,1)" },
      );
      hapticRaw([14]);
    }
    ov.classList.remove("on");
    finishT = setTimeout(finish, 300);
  };

  const startFly = () => {
    if (phase !== "hold") return;
    phase = "fly";
    ov.classList.add("flying");

    const wr = flamewrap.getBoundingClientRect();
    const wcx = wr.left + wr.width / 2;
    const wcy = wr.top + wr.height / 2;
    let tcx, tcy, tScale;
    if (badge) {
      const br = badge.getBoundingClientRect();
      tcx = br.left + br.width / 2;
      tcy = br.top + br.height / 2;
      tScale = Math.max(0.12, br.height / wr.height);
      badge.style.transition = "none";
      badge.style.opacity = "0";
    } else {
      tcx = 48;
      tcy = 118;
      tScale = 0.16;
    }
    const dx = tcx - wcx;
    const dy = tcy - wcy;

    // Part vite et décélère DANS le badge (--ease-drawer). La flamme reste
    // visible jusqu'à l'arrivée puis ne fond qu'à la toute fin (continuité).
    const fly = flamewrap.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
        {
          transform: `translate(${dx}px,${dy}px) scale(${tScale})`,
          opacity: 0.85,
          offset: 0.72,
        },
        {
          transform: `translate(${dx}px,${dy}px) scale(${tScale})`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: FLY_MS,
        easing: "cubic-bezier(.32,.72,0,1)",
        fill: "forwards",
      },
    );
    fly.onfinish = land;
    // Révèle le badge pendant l'arrivée (overlap), + filet si onfinish ne tire
    // pas (onglet passé en arrière-plan pendant le vol).
    revealT = setTimeout(land, REVEAL_AT);
    safetyT = setTimeout(land, FLY_MS + 80);
  };

  ov.addEventListener("click", () => {
    if (phase === "hold") {
      track("streak_launch.skipped", { days });
      clearTimeout(holdT);
      startFly();
    }
  });

  // Tout l'état visible démarre dans un rAF (peint le 1er frame à opacity 0
  // AVANT la transition). On arme aussi le « hold » ICI pour qu'il ne puisse
  // pas devancer l'entrée si un throttling retarde le 1er frame.
  requestAnimationFrame(() => {
    if (removed) return;
    ov.classList.add("on");
    flamewrap.animate(
      [
        { transform: "scale(.34)", opacity: 0 },
        { transform: "scale(1.08)", opacity: 1, offset: 0.7 },
        { transform: "scale(1)", opacity: 1 },
      ],
      {
        duration: POP_MS,
        easing: "cubic-bezier(.34,1.56,.64,1)",
        fill: "both",
      },
    );
    // Count-up décalé après le pic du pop (sinon le nombre churne pendant que
    // la flamme fait encore son overshoot = effet machine à sous).
    upT = setTimeout(() => countUp(numEl, days), 400);
    cueT = setTimeout(() => ov.classList.add("skipcue"), 780);
    holdT = setTimeout(startFly, HOLD_MS);
  });
}
