// ═══════════════════════════════════════════════════════════════
// Launch splash — écran d'accueil au lancement de l'app
// Gate « Appuie pour démarrer » : le tap débloque le jingle (politique
// autoplay) puis joue l'anim avant de révéler l'app.
// Badge PermiGo en haut + « PERMIGO » en cubes 3D animés (vague) +
// phrases qui défilent dans une pill « text-flip » (lettres flou→net).
// Overlay fixe au-dessus de #app, affiché 1×/session (= un lancement).
// ═══════════════════════════════════════════════════════════════
import { icon } from "@/utils/icons.js";
import { playParcoursIntro } from "@/utils/sound.js";

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
      #pg-launch-splash{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:var(--bg,#f4f5fb);padding:24px;opacity:1;transition:opacity .35s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none;}
      #pg-launch-splash.out{opacity:0;pointer-events:none;}
      #pg-launch-splash .ls-badge{width:96px;height:96px;border-radius:28px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(180deg,#6fe016 0%,#58CC02 48%,#46A302 100%);box-shadow:0 16px 38px -8px rgba(70,163,2,.5),0 1.5px 0 0 rgba(255,255,255,.3) inset,0 -2px 8px 0 rgba(70,163,2,.5) inset;animation:lsPop .55s cubic-bezier(.34,1.56,.64,1) both,lsFloat 2.4s ease-in-out .55s infinite;}
      #pg-launch-splash .ls-badge svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.2));}

      /* ── « PERMIGO » en cubes 3D ── */
      #pg-launch-splash .ls-cubes{display:flex;gap:9px;perspective:800px;}
      #pg-launch-splash .ls-cube{position:relative;width:46px;height:46px;transform-style:preserve-3d;animation:lsCubeFlip 2s ease-in-out infinite;}
      #pg-launch-splash .ls-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 26px/1 'Plus Jakarta Sans','Nunito',sans-serif;color:#fff;border-radius:10px;backface-visibility:hidden;box-shadow:0 2px 6px rgba(70,163,2,.25) inset,0 1px 0 rgba(255,255,255,.18) inset;}
      #pg-launch-splash .f-front {background:linear-gradient(180deg,#6fe016,#58CC02);transform:translateZ(23px);}
      #pg-launch-splash .f-back  {background:linear-gradient(180deg,#58CC02,#46A302);transform:rotateY(180deg) translateZ(23px);}
      #pg-launch-splash .f-right {background:#46A302;transform:rotateY(90deg) translateZ(23px);}
      #pg-launch-splash .f-left  {background:#46A302;transform:rotateY(-90deg) translateZ(23px);}
      #pg-launch-splash .f-top   {background:#7be81e;transform:rotateX(90deg) translateZ(23px);}
      #pg-launch-splash .f-bottom{background:#3a8a00;transform:rotateX(-90deg) translateZ(23px);}

      /* ── Pill « text-flip » (phrases sous les cubes) ── */
      #pg-launch-splash .ls-flip{position:relative;display:inline-block;border-radius:12px;padding:8px 16px 10px;min-height:38px;font:800 17px/1.15 'Plus Jakarta Sans','Nunito',sans-serif;color:#1a2800;text-align:center;background:linear-gradient(to bottom,#ffffff,#edf2ea);box-shadow:inset 0 -1px #d6e3cf, inset 0 0 0 1px #d8e6d0, 0 4px 10px rgba(70,163,2,.12);}
      #pg-launch-splash .ls-flip span{display:inline-block;animation:lsLetterIn .5s both;}
      #pg-launch-splash .ls-cta{display:inline-flex;align-items:center;gap:6px;padding:11px 22px;border-radius:99px;background:color-mix(in srgb,#58CC02 12%,transparent);border:1.5px solid color-mix(in srgb,#58CC02 30%,transparent);color:#46A302;font:800 14px/1 'Plus Jakarta Sans','Nunito',sans-serif;animation:lsPulse 1.6s ease-in-out infinite;}
      #pg-launch-splash.go .ls-cta{display:none;}

      @keyframes lsPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
      @keyframes lsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes lsPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.85}}
      @keyframes lsLetterIn{from{opacity:0;filter:blur(10px)}to{opacity:1;filter:blur(0)}}
      /* La lettre reste face avant ~45% du temps, puis flip complet → effet vague */
      @keyframes lsCubeFlip{0%,45%{transform:rotateX(0)}70%,100%{transform:rotateX(360deg)}}

      #pg-launch-splash:focus-visible{box-shadow:inset 0 0 0 3px color-mix(in srgb,#58CC02 40%,transparent);}
      @media (prefers-reduced-motion:reduce){
        #pg-launch-splash .ls-badge{animation:lsPop .55s both}
        #pg-launch-splash .ls-cube{animation:none}
        #pg-launch-splash .ls-cta{animation:none}
        #pg-launch-splash .ls-flip span{animation:none}
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
    <div class="ls-badge">${icon("map-pin", { size: 46, strokeWidth: 2.2, color: "#fff" })}</div>
    <div class="ls-cubes" aria-label="PermiGo" role="img">${LETTERS.map(cube).join("")}</div>
    <p class="ls-flip" id="pg-ls-msg" aria-live="polite">${letterize(ACCROCHE)}</p>
    <div class="ls-cta">Appuie pour démarrer ${icon("chevron-right", { size: 15, strokeWidth: 2.8, color: "#46A302" })}</div>
  `;
  document.body.appendChild(host);
  host.focus({ preventScroll: true });

  let launched = false;
  const launch = () => {
    if (launched) return;
    launched = true;
    host.classList.add("go");

    // Jingle — déclenché par le geste utilisateur → autoplay autorisé
    const stopMusic = playParcoursIntro(duration);

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

    // Fin : coupe le son, fond, retire
    setTimeout(() => {
      clearInterval(tid);
      stopMusic?.();
      host.classList.add("out");
      setTimeout(() => host.remove(), 360);
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
