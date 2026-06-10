// ═══════════════════════════════════════════════════════════════
// Launch splash — écran d'accueil au lancement de l'app
// Gate « Appuie pour démarrer » : le tap débloque le jingle (politique
// autoplay) puis joue une séquence cinématique (~2,8 s max) avant de
// révéler l'app : route lumineuse qui se trace + rev du badge + cubes
// qui bondissent en cascade + traînées de phares + sortie zoom-fade.
// Overlay fixe au-dessus de #app, affiché 1×/session (= un lancement).
// ═══════════════════════════════════════════════════════════════
import { icon } from "@/utils/icons.js";
import { playLaunchSound } from "@/utils/sound.js";

const SESSION_KEY = "permigo-launch-splash";
const LETTERS = ["P", "E", "R", "M", "I", "G", "O"];
const ACCROCHE = "Prêt à reprendre ta route ?";

const MSGS = [
  "Démarrage du moteur…",
  "Réglage des rétroviseurs…",
  "Vérification de l'angle mort…",
  "Ceinture attachée…",
  "C'est parti !",
];

// Un cube 3D par lettre : la lettre est sur les faces avant + arrière pour
// rester lisible pendant la rotation. Délai d'anim échelonné = effet de vague.
function cube(letter, i) {
  return `
    <div class="ls-cube" style="animation-delay:${(i * 0.1).toFixed(2)}s">
      <div class="ls-face f-front">${letter}</div>
      <div class="ls-face f-back">${letter}</div>
      <div class="ls-face f-right"></div>
      <div class="ls-face f-left"></div>
      <div class="ls-face f-top"></div>
      <div class="ls-face f-bottom"></div>
    </div>`;
}

// « text-flip » : chaque lettre apparaît en flou→net, décalée (effet vague).
// Recréer les <span> rejoue l'animation à chaque changement de phrase.
function letterize(text) {
  return text
    .split("")
    .map(
      (ch, i) =>
        `<span style="animation-delay:${(i * 0.025).toFixed(3)}s">${ch === " " ? "&nbsp;" : ch}</span>`,
    )
    .join("");
}

/**
 * Affiche l'écran de lancement avec gate au tap. No-op si déjà vu dans la session.
 * @param {{ duration?: number }} opts  durée de l'anim après le tap
 */
export function showLaunchSplash({ duration = 2800 } = {}) {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* sessionStorage indispo (mode privé strict) → on affiche quand même */
  }

  const host = document.createElement("div");
  host.id = "pg-launch-splash";
  host.setAttribute("role", "button");
  host.setAttribute("tabindex", "0");
  host.setAttribute("aria-label", "Appuie pour démarrer PermiGo");
  host.innerHTML = `
    <style>
      #pg-launch-splash{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:var(--bg,#f4f5fb);padding:24px;opacity:1;transform:scale(1);transition:opacity .45s ease,transform .45s cubic-bezier(.4,0,.7,1);cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none;overflow:hidden;}
      /* Sortie : zoom-fade — l'app « émerge » du splash au lieu d'un cut */
      #pg-launch-splash.out{opacity:0;transform:scale(1.06);pointer-events:none;}

      #pg-launch-splash .ls-badge{width:108px;height:108px;display:flex;align-items:center;justify-content:center;animation:lsPop .55s cubic-bezier(.34,1.56,.64,1) both,lsFloat 2.4s ease-in-out .55s infinite;}
      #pg-launch-splash .ls-badge img{width:108px;height:108px;object-fit:contain;filter:drop-shadow(0 12px 26px color-mix(in srgb, var(--adk) 40%, transparent));}
      /* Coup de « rev » au tap : kick d'échelle + micro-rotation, puis le float reprend */
      #pg-launch-splash.go .ls-badge{animation:lsRev .55s cubic-bezier(.34,1.56,.64,1) both,lsFloat 2.4s ease-in-out .55s infinite;}

      /* ── Route lumineuse (se trace au tap, derrière les cubes) ── */
      #pg-launch-splash .ls-road{position:absolute;left:0;right:0;top:50%;height:120px;transform:translateY(-58%);pointer-events:none;opacity:0;}
      #pg-launch-splash.go .ls-road{opacity:1;transition:opacity .25s ease;}
      #pg-launch-splash .ls-road path{fill:none;stroke:color-mix(in srgb, var(--a) 55%, transparent);stroke-width:3;stroke-linecap:round;stroke-dasharray:6 14;filter:drop-shadow(0 0 6px color-mix(in srgb, var(--a) 50%, transparent));}
      #pg-launch-splash.go .ls-road path{stroke-dashoffset:400;animation:lsRoadDraw 1.4s cubic-bezier(.2,.7,.3,1) both;}

      /* ── Traînées de phares (filent au tap) ── */
      #pg-launch-splash .ls-streak{position:absolute;height:2px;width:140px;border-radius:99px;background:linear-gradient(90deg,transparent,var(--a-lt),transparent);opacity:0;pointer-events:none;will-change:transform,opacity;}
      #pg-launch-splash .ls-streak:nth-child(1){top:34%;}
      #pg-launch-splash .ls-streak:nth-child(2){top:50%;height:3px;width:200px;}
      #pg-launch-splash .ls-streak:nth-child(3){top:66%;}
      #pg-launch-splash.go .ls-streak:nth-child(1){animation:lsStreak 1s cubic-bezier(.2,.7,.3,1) .1s both;}
      #pg-launch-splash.go .ls-streak:nth-child(2){animation:lsStreak .9s cubic-bezier(.2,.7,.3,1) .35s both;}
      #pg-launch-splash.go .ls-streak:nth-child(3){animation:lsStreak 1.1s cubic-bezier(.2,.7,.3,1) .6s both;}

      /* ── « PERMIGO » en cubes 3D ── */
      #pg-launch-splash .ls-cubes{position:relative;display:flex;gap:9px;perspective:800px;}
      #pg-launch-splash .ls-cube{position:relative;width:46px;height:46px;transform-style:preserve-3d;animation:lsCubeFlip 2s ease-in-out infinite;will-change:transform;}
      /* Au tap : chaque cube bondit en cascade (délai inline réutilisé), puis la vague reprend */
      #pg-launch-splash.go .ls-cube{animation:lsCubeJump .5s cubic-bezier(.34,1.56,.64,1) both,lsCubeFlip 2s ease-in-out .5s infinite;}
      #pg-launch-splash .ls-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 26px/1 'Plus Jakarta Sans','Nunito',sans-serif;color:#fff;border-radius:10px;backface-visibility:hidden;box-shadow:0 2px 6px color-mix(in srgb, var(--adk) 25%, transparent) inset,0 1px 0 rgba(255,255,255,.18) inset;}
      #pg-launch-splash .f-front {background:linear-gradient(180deg,var(--a-lt),var(--a));transform:translateZ(23px);}
      #pg-launch-splash .f-back  {background:linear-gradient(180deg,var(--a),var(--adk));transform:rotateY(180deg) translateZ(23px);}
      #pg-launch-splash .f-right {background:var(--adk);transform:rotateY(90deg) translateZ(23px);}
      #pg-launch-splash .f-left  {background:var(--adk);transform:rotateY(-90deg) translateZ(23px);}
      #pg-launch-splash .f-top   {background:color-mix(in srgb, var(--a-lt) 80%, #fff);transform:rotateX(90deg) translateZ(23px);}
      #pg-launch-splash .f-bottom{background:color-mix(in srgb, var(--adk) 80%, #000);transform:rotateX(-90deg) translateZ(23px);}

      /* ── Pill « text-flip » (phrases sous les cubes) ── */
      #pg-launch-splash .ls-flip{position:relative;display:inline-block;border-radius:12px;padding:8px 16px 10px;min-height:38px;font:800 17px/1.15 'Plus Jakarta Sans','Nunito',sans-serif;color:var(--a-ink);text-align:center;background:linear-gradient(to bottom,var(--su,#fff),color-mix(in srgb, var(--a) 8%, var(--su,#fff)));box-shadow:inset 0 -1px color-mix(in srgb, var(--adk) 18%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--adk) 14%, transparent), 0 4px 10px color-mix(in srgb, var(--adk) 12%, transparent);}
      #pg-launch-splash .ls-flip span{display:inline-block;animation:lsLetterIn .5s both;}
      #pg-launch-splash .ls-cta{display:inline-flex;align-items:center;gap:6px;padding:11px 22px;border-radius:99px;background:color-mix(in srgb,var(--a) 12%,transparent);border:1.5px solid color-mix(in srgb,var(--a) 30%,transparent);color:var(--adk);font:800 14px/1 'Plus Jakarta Sans','Nunito',sans-serif;animation:lsPulse 1.6s ease-in-out infinite;transition:opacity .2s,transform .2s;}
      #pg-launch-splash.go .ls-cta{opacity:0;transform:scale(.9);pointer-events:none;}

      @keyframes lsPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
      @keyframes lsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes lsRev{0%{transform:scale(1) rotate(0)}30%{transform:scale(1.14) rotate(-3deg)}60%{transform:scale(.97) rotate(2deg)}100%{transform:scale(1) rotate(0)}}
      @keyframes lsPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.85}}
      @keyframes lsLetterIn{from{opacity:0;filter:blur(10px)}to{opacity:1;filter:blur(0)}}
      @keyframes lsRoadDraw{from{stroke-dashoffset:400}to{stroke-dashoffset:0}}
      @keyframes lsStreak{0%{opacity:0;transform:translateX(-60vw)}25%{opacity:.9}100%{opacity:0;transform:translateX(60vw)}}
      @keyframes lsCubeJump{0%{transform:translateY(0)}45%{transform:translateY(-16px)}100%{transform:translateY(0)}}
      /* La lettre reste face avant ~45% du temps, puis flip complet → effet vague */
      @keyframes lsCubeFlip{0%,45%{transform:rotateX(0)}70%,100%{transform:rotateX(360deg)}}

      #pg-launch-splash:focus-visible{box-shadow:inset 0 0 0 3px color-mix(in srgb,var(--a) 40%,transparent);}
      @media (prefers-reduced-motion:reduce){
        #pg-launch-splash{transition:opacity .3s ease;}
        #pg-launch-splash.out{transform:none;}
        #pg-launch-splash .ls-badge,#pg-launch-splash.go .ls-badge{animation:lsPop .55s both}
        #pg-launch-splash .ls-cube,#pg-launch-splash.go .ls-cube{animation:none}
        #pg-launch-splash .ls-cta{animation:none}
        #pg-launch-splash .ls-flip span{animation:none}
        #pg-launch-splash.go .ls-road path{animation:none;stroke-dashoffset:0}
        #pg-launch-splash.go .ls-streak{animation:none;opacity:0}
      }
      @media (max-width:380px){
        #pg-launch-splash .ls-cubes{gap:6px}
        #pg-launch-splash .ls-cube{width:38px;height:38px}
        #pg-launch-splash .f-front,#pg-launch-splash .f-back{font-size:22px}
        #pg-launch-splash .f-front {transform:translateZ(19px)}
        #pg-launch-splash .f-back  {transform:rotateY(180deg) translateZ(19px)}
        #pg-launch-splash .f-right {transform:rotateY(90deg) translateZ(19px)}
        #pg-launch-splash .f-left  {transform:rotateY(-90deg) translateZ(19px)}
        #pg-launch-splash .f-top   {transform:rotateX(90deg) translateZ(19px)}
        #pg-launch-splash .f-bottom{transform:rotateX(-90deg) translateZ(19px)}
      }
    </style>
    <svg class="ls-road" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M -10 95 C 80 95, 120 30, 200 30 S 320 95, 410 95" pathLength="400"/>
    </svg>
    <div class="ls-streak" aria-hidden="true"></div>
    <div class="ls-streak" aria-hidden="true"></div>
    <div class="ls-streak" aria-hidden="true"></div>
    <div class="ls-badge"><img src="/skins/avatars/permigo-badge-icon.png" alt="PermiGo" width="108" height="108" /></div>
    <div class="ls-cubes" aria-label="PermiGo" role="img">${LETTERS.map(cube).join("")}</div>
    <p class="ls-flip" id="pg-ls-msg" aria-live="polite">${letterize(ACCROCHE)}</p>
    <div class="ls-cta">Appuie pour démarrer ${icon("chevron-right", { size: 15, strokeWidth: 2.8, color: "var(--adk)" })}</div>
  `;
  document.body.appendChild(host);
  host.focus({ preventScroll: true });

  let launched = false;
  const launch = () => {
    if (launched) return;
    launched = true;
    host.classList.add("go");

    // Jingle — déclenché par le geste utilisateur → autoplay autorisé
    const stopMusic = playLaunchSound(duration);

    // Phrases qui défilent dans la pill « text-flip »
    let i = 0;
    const setMsg = (n) => {
      const el = host.querySelector("#pg-ls-msg");
      if (el) el.innerHTML = letterize(MSGS[n]);
    };
    setMsg(0);
    const tid = setInterval(() => {
      i = (i + 1) % MSGS.length;
      setMsg(i);
    }, 1300);

    // Fin : coupe le son, sortie zoom-fade, retire
    setTimeout(() => {
      clearInterval(tid);
      stopMusic?.();
      host.classList.add("out");
      setTimeout(() => host.remove(), 480);
    }, duration);
  };

  host.addEventListener("click", launch);
  host.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      launch();
    }
  });
}
