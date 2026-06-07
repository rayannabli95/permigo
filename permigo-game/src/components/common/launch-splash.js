// ═══════════════════════════════════════════════════════════════
// Launch splash — écran d'accueil global au lancement de l'app
// Badge PermiGo vert + jingle (best-effort) + messages qui défilent.
// Overlay fixe au-dessus de #app : le routing rend dessous, on révèle
// l'app au fondu. Affiché une seule fois par session (= un lancement).
// ═══════════════════════════════════════════════════════════════
import { icon } from "@/utils/icons.js";
import { playParcoursIntro } from "@/utils/sound.js";

const SESSION_KEY = "permigo-launch-splash";

const MSGS = [
  "Démarrage du moteur…",
  "Réglage des rétroviseurs…",
  "Vérification de l'angle mort…",
  "Ceinture attachée…",
  "C'est parti !",
];

/**
 * Affiche le splash de lancement. No-op si déjà montré dans la session.
 * @param {{ duration?: number }} opts
 */
export function showLaunchSplash({ duration = 2600 } = {}) {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* sessionStorage indispo (mode privé strict) → on affiche quand même */
  }

  const host = document.createElement("div");
  host.id = "pg-launch-splash";
  host.setAttribute("role", "status");
  host.setAttribute("aria-label", "Chargement de PermiGo");
  host.innerHTML = `
    <style>
      #pg-launch-splash{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:var(--bg,#f4f5fb);padding:24px;opacity:1;transition:opacity .35s ease;}
      #pg-launch-splash.out{opacity:0;pointer-events:none;}
      #pg-launch-splash .ls-badge{width:104px;height:104px;border-radius:30px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(180deg,#6fe016 0%,#58CC02 48%,#46A302 100%);box-shadow:0 16px 38px -8px rgba(70,163,2,.5),0 1.5px 0 0 rgba(255,255,255,.3) inset,0 -2px 8px 0 rgba(70,163,2,.5) inset;animation:lsPop .55s cubic-bezier(.34,1.56,.64,1) both,lsFloat 2.4s ease-in-out .55s infinite;}
      #pg-launch-splash .ls-badge svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.2));}
      #pg-launch-splash .ls-word{font:900 34px/1 'Plus Jakarta Sans','Nunito',sans-serif;letter-spacing:-.03em;background:linear-gradient(90deg,#58CC02,#46A302);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
      #pg-launch-splash .ls-msg{font:600 14px/1.4 'Inter','Nunito',sans-serif;color:var(--mu,#5f6788);min-height:20px;text-align:center;transition:opacity .22s;}
      #pg-launch-splash .ls-dots{display:flex;gap:6px;}
      #pg-launch-splash .ls-dots i{width:8px;height:8px;border-radius:50%;background:#58CC02;opacity:.3;animation:lsDot 1.2s ease-in-out infinite;}
      #pg-launch-splash .ls-dots i:nth-child(2){animation-delay:.2s}
      #pg-launch-splash .ls-dots i:nth-child(3){animation-delay:.4s}
      @keyframes lsPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
      @keyframes lsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes lsDot{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @media (prefers-reduced-motion:reduce){#pg-launch-splash .ls-badge{animation:lsPop .55s both}#pg-launch-splash .ls-dots i{animation:none}}
    </style>
    <div class="ls-badge">${icon("map-pin", { size: 50, strokeWidth: 2.2, color: "#fff" })}</div>
    <div class="ls-word">PermiGo</div>
    <div class="ls-msg" id="pg-ls-msg">${MSGS[0]}</div>
    <div class="ls-dots" aria-hidden="true"><i></i><i></i><i></i></div>
  `;
  document.body.appendChild(host);

  // Jingle (peut être bloqué par la politique autoplay si pas de geste préalable)
  const stopMusic = playParcoursIntro(duration);

  // Messages qui défilent
  let i = 0;
  const tid = setInterval(() => {
    const m = host.querySelector("#pg-ls-msg");
    if (!m) return;
    i = (i + 1) % MSGS.length;
    m.style.opacity = "0";
    setTimeout(() => {
      if (m) {
        m.textContent = MSGS[i];
        m.style.opacity = "1";
      }
    }, 200);
  }, 620);

  // Fin : on coupe le son, on fond, on retire
  setTimeout(() => {
    clearInterval(tid);
    stopMusic?.();
    host.classList.add("out");
    setTimeout(() => host.remove(), 360);
  }, duration);
}
