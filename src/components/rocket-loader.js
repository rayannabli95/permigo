/**
 * Rocket Loader — splash/loader animé style "fusée qui file dans le ciel".
 *
 * Adapté du composant React `rocket-loader.tsx` en vanilla JS + CSS pur.
 * Pas de Tailwind requis — les styles sont scoped via un <style> inline.
 *
 * Usage :
 *   import { showRocketLoader, hideRocketLoader } from '@/components/rocket-loader.js';
 *   const handle = showRocketLoader();          // fullscreen overlay
 *   await fetchSomething();
 *   handle.destroy();                            // ou await handle.fadeOut() pour fade out lisse
 *
 * Pour intégrer dans le splash de boot (cf. index.html / main.js).
 */

let _instance = null;

export function showRocketLoader(opts = {}) {
  if (_instance) return _instance;

  const host = document.createElement('div');
  host.id = 'rocket-loader-root';
  host.innerHTML = `
    <style>
      #rocket-loader-root{position:fixed;inset:0;z-index:10000;background-color:#0b0d1a;background-image:radial-gradient(ellipse at 50% 60%,#1e293b 0%,#0b0d1a 70%);display:flex;align-items:center;justify-content:center;overflow:hidden;animation:rl-fadein .3s ease both}
      @keyframes rl-fadein{from{opacity:0}to{opacity:1}}
      #rocket-loader-root.rl-out{animation:rl-fadeout .4s ease both}
      @keyframes rl-fadeout{from{opacity:1}to{opacity:0}}

      /* ─── Container central ─── */
      .rl-container{position:relative;width:100%;max-width:520px;height:300px;display:flex;align-items:center;justify-content:center}

      /* ─── Clouds (5 nuages qui défilent) ─── */
      .rl-clouds{position:absolute;inset:0;overflow:hidden;pointer-events:none}
      .rl-cloud{position:absolute;background:rgba(255,255,255,.08);border-radius:50%;filter:blur(8px);animation:rl-moveClouds 18s linear infinite}
      .rl-cloud1{width:120px;height:30px;top:20%;left:0;animation-duration:22s;animation-delay:0s}
      .rl-cloud2{width:90px;height:24px;top:55%;left:30%;animation-duration:16s;animation-delay:-4s;opacity:.7}
      .rl-cloud3{width:140px;height:32px;top:80%;left:60%;animation-duration:25s;animation-delay:-8s;opacity:.55}
      .rl-cloud4{width:70px;height:20px;top:35%;left:80%;animation-duration:19s;animation-delay:-2s;opacity:.6}
      .rl-cloud5{width:100px;height:26px;top:70%;left:10%;animation-duration:24s;animation-delay:-12s;opacity:.5}
      @keyframes rl-moveClouds{0%{transform:translateX(0)}100%{transform:translateX(-200vw)}}

      /* ─── Long fazers (lignes de vitesse horizontales) ─── */
      .rl-longfazers{position:absolute;inset:0;pointer-events:none}
      .rl-longfazers span{position:absolute;height:2px;background:linear-gradient(90deg,transparent,#60a5fa,transparent);width:140px}
      .rl-longfazers span:nth-child(1){top:25%;animation:rl-lf 1.4s linear infinite}
      .rl-longfazers span:nth-child(2){top:45%;animation:rl-lf2 2s linear infinite;animation-delay:-.4s}
      .rl-longfazers span:nth-child(3){top:65%;animation:rl-lf3 1.6s linear infinite;animation-delay:-.7s;width:100px}
      .rl-longfazers span:nth-child(4){top:85%;animation:rl-lf4 1.8s linear infinite;animation-delay:-.2s;width:160px}
      @keyframes rl-lf  { 0%{left:200%;opacity:1} 100%{left:-200%;opacity:0} }
      @keyframes rl-lf2 { 0%{left:200%;opacity:1} 100%{left:-200%;opacity:0} }
      @keyframes rl-lf3 { 0%{left:200%;opacity:1} 100%{left:-100%;opacity:0} }
      @keyframes rl-lf4 { 0%{left:200%;opacity:1} 100%{left:-100%;opacity:0} }

      /* ─── Loader (la fusée elle-même) ─── */
      .rl-loader{position:relative;width:120px;height:80px;animation:rl-speeder .2s linear infinite}
      @keyframes rl-speeder {
        0%{transform:translate(2px,1px) rotate(0)}
        10%{transform:translate(-1px,-3px) rotate(-1deg)}
        20%{transform:translate(-2px,0) rotate(1deg)}
        30%{transform:translate(1px,2px) rotate(0)}
        40%{transform:translate(1px,-1px) rotate(1deg)}
        50%{transform:translate(-1px,3px) rotate(-1deg)}
        60%{transform:translate(-1px,1px) rotate(0)}
        70%{transform:translate(3px,1px) rotate(-1deg)}
        80%{transform:translate(-2px,-1px) rotate(1deg)}
        90%{transform:translate(2px,1px) rotate(0)}
        100%{transform:translate(1px,-2px) rotate(-1deg)}
      }

      /* Body principal : ovale arrondi style fusée/voiture racing */
      .rl-loader > span{position:absolute;top:24px;left:30px;width:60px;height:32px;background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:30px 6px 6px 30px;box-shadow:0 6px 14px -4px rgba(0,0,0,.4),inset 0 -3px 8px rgba(0,0,0,.2),inset 0 2px 0 rgba(255,255,255,.5)}
      /* Hublot / cockpit */
      .rl-loader > span > span:nth-child(1){display:block;position:absolute;top:5px;left:8px;width:16px;height:10px;background:radial-gradient(circle at 30% 30%,#7dd3fc,#0284c7);border-radius:50%;box-shadow:inset 0 -2px 4px rgba(0,0,0,.3)}
      /* Détails feux avant */
      .rl-loader > span > span:nth-child(2){display:block;position:absolute;top:8px;right:4px;width:5px;height:5px;background:#fef3c7;border-radius:50%;box-shadow:0 0 8px #fef3c7}
      .rl-loader > span > span:nth-child(3){display:block;position:absolute;top:18px;right:4px;width:5px;height:5px;background:#fb7185;border-radius:50%;box-shadow:0 0 6px #fb7185}
      /* Ligne arrière (réacteur/échappement décoratif) */
      .rl-loader > span > span:nth-child(4){display:block;position:absolute;top:14px;left:-22px;width:24px;height:4px;background:linear-gradient(90deg,transparent,#fb923c);border-radius:2px}

      /* Base (ailerons / ombre projetée) */
      .rl-loader .base{position:absolute;top:54px;left:24px;width:72px;height:6px}
      .rl-loader .base > span{display:block;position:absolute;inset:0;background:linear-gradient(180deg,#475569,#1e293b);border-radius:4px;filter:blur(2px);opacity:.6}
      .rl-loader .face{position:absolute;top:-30px;left:8px;width:14px;height:12px;background:linear-gradient(135deg,#cbd5e1,#94a3b8);border-radius:6px 2px 2px 6px;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}

      /* Flame trail derrière (fazers) — créées dynamiquement plus tard */
      .rl-loader::after{
        content:'';
        position:absolute;
        top:34px;
        left:-8px;
        width:18px;height:12px;
        background:radial-gradient(ellipse at right,#fb923c,#fbbf24,transparent);
        border-radius:50%;
        filter:blur(2px);
        animation:rl-flame .3s ease-in-out infinite alternate;
      }
      @keyframes rl-flame{0%{transform:scaleX(1);opacity:.85}100%{transform:scaleX(1.4);opacity:1}}

      /* ─── Label ─── */
      .rl-label{position:absolute;bottom:10%;left:0;right:0;text-align:center;font-family:'Archivo',ui-sans-serif,sans-serif;color:#fff;letter-spacing:.5em;font-size:11px;font-weight:800;opacity:.7;text-transform:uppercase}
      .rl-label::after{content:'';display:inline-block;width:3px;height:3px;border-radius:50%;background:#fbbf24;margin-left:.6em;animation:rl-dot 1.2s ease-in-out infinite}
      @keyframes rl-dot{0%,100%{opacity:.3}50%{opacity:1}}
    </style>

    <style>
      /* Logo PermiGo au-dessus de la fusée */
      .rl-logo{position:absolute;top:18%;left:50%;transform:translateX(-50%);max-width:min(420px,72vw);width:auto;height:auto;opacity:0;animation:rl-logoIn 1.1s cubic-bezier(.2,.7,.3,1) .15s both;filter:drop-shadow(0 12px 32px rgba(99,102,241,.45)) drop-shadow(0 0 24px rgba(139,92,246,.35));z-index:3}
      @keyframes rl-logoIn{
        0%{opacity:0;transform:translateX(-50%) scale(.85) translateY(8px);filter:blur(6px) drop-shadow(0 12px 32px rgba(99,102,241,.45))}
        60%{opacity:1;transform:translateX(-50%) scale(1.02) translateY(0);filter:blur(0) drop-shadow(0 12px 32px rgba(99,102,241,.45))}
        100%{opacity:1;transform:translateX(-50%) scale(1) translateY(0);filter:blur(0) drop-shadow(0 12px 32px rgba(99,102,241,.45)) drop-shadow(0 0 24px rgba(139,92,246,.35))}
      }
      /* Pulse subtil après l'entrée */
      .rl-logo::after{content:'';position:absolute;inset:-20px;background:radial-gradient(ellipse at center,rgba(139,92,246,.18),transparent 60%);z-index:-1;animation:rl-logoPulse 3s ease-in-out infinite}
      @keyframes rl-logoPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
      /* Fallback texte si l'image n'est pas trouvée (avant que le user copie permigo-logo.png) */
      .rl-logo-fallback{position:absolute;top:18%;left:50%;transform:translateX(-50%);font-family:'Archivo',ui-sans-serif,sans-serif;font-weight:900;font-size:42px;letter-spacing:-.03em;background:linear-gradient(90deg,#a5b4fc 0%,#fff 35%,#fff 65%,#c4b5fd 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:rl-logoIn 1.1s cubic-bezier(.2,.7,.3,1) .15s both;filter:drop-shadow(0 8px 24px rgba(139,92,246,.4));z-index:3}
    </style>

    <div class="rl-container">
      <div class="rl-clouds">
        <div class="rl-cloud rl-cloud1"></div>
        <div class="rl-cloud rl-cloud2"></div>
        <div class="rl-cloud rl-cloud3"></div>
        <div class="rl-cloud rl-cloud4"></div>
        <div class="rl-cloud rl-cloud5"></div>
      </div>
      ${opts.logo !== false ? `
        <img class="rl-logo" src="permigo-logo.png" alt="PermiGo" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <div class="rl-logo-fallback" style="display:none">PermiGo</div>
      ` : ''}
      <div class="rl-loader">
        <span><span></span><span></span><span></span><span></span></span>
        <div class="base"><span></span><div class="face"></div></div>
      </div>
      <div class="rl-longfazers">
        <span></span><span></span><span></span><span></span>
      </div>
      ${opts.label !== false ? `<div class="rl-label">${opts.label || 'Chargement'}</div>` : ''}
    </div>
  `;
  document.body.appendChild(host);

  _instance = {
    el: host,
    destroy() {
      host.remove();
      _instance = null;
    },
    fadeOut(durationMs = 400) {
      return new Promise((resolve) => {
        host.classList.add('rl-out');
        setTimeout(() => {
          host.remove();
          _instance = null;
          resolve();
        }, durationMs);
      });
    },
  };
  return _instance;
}

export function hideRocketLoader() {
  if (_instance) return _instance.fadeOut();
  return Promise.resolve();
}
