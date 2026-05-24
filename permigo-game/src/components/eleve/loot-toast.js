/**
 * Loot Toast — notif style GTA / jeu vidéo qui slide depuis la droite.
 *
 * Distinct du toast classique (qui sert pour les erreurs/infos).
 * Celui-ci célèbre les gains : XP, étoiles, coffres, niveaux up, etc.
 *
 * Usage :
 *   import { lootToast } from '@/components/eleve/loot-toast.js';
 *   lootToast({ icon: '⭐', label: '+100 XP', subLabel: 'Compétence acquise' });
 *   lootToast({ icon: '🔥', label: 'STREAK ×5', subLabel: 'Continue !', kind: 'warm' });
 *   lootToast({ icon: '🎉', label: 'LEVEL UP!', subLabel: 'Niveau 7', kind: 'levelup' });
 *
 * Les toasts s'empilent verticalement à droite. Auto-dismiss 2.8s.
 */

let _root = null;

function ensureRoot() {
  if (_root) return _root;
  _root = document.createElement('div');
  _root.id = 'loot-root';
  document.body.appendChild(_root);

  const style = document.createElement('style');
  style.textContent = `
    #loot-root{position:fixed;top:calc(80px + env(safe-area-inset-top));right:14px;z-index:120;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:min(360px,calc(100vw - 28px))}
    @media (max-width:560px){#loot-root{top:calc(70px + env(safe-area-inset-top));right:10px;left:10px;max-width:none}}

    /* ─── Toast premium gaming-grade ─── */
    .loot-toast{
      position:relative;display:flex;align-items:center;gap:12px;
      padding:13px 16px;
      background:linear-gradient(135deg,#1e1b4b 0%,#0b0d1a 60%,#1a1208 100%);
      border:1px solid rgba(255,255,255,.14);
      border-radius:13px;
      color:#fff;
      box-shadow:
        0 18px 40px -12px rgba(0,0,0,.7),
        0 0 0 1px rgba(255,255,255,.06) inset,
        0 1px 0 rgba(255,255,255,.15) inset;
      pointer-events:auto;
      transform:translateX(130%) rotate(8deg);opacity:0;
      animation:loot-in .55s cubic-bezier(.34,1.56,.64,1) forwards;
      overflow:hidden;
      backdrop-filter:blur(14px) saturate(180%);
      -webkit-backdrop-filter:blur(14px) saturate(180%);
    }
    /* Ligne lumineuse animée (gaming feel) */
    .loot-toast::before{
      content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;
      background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%);
      animation:loot-shine 2.2s ease-in-out infinite;animation-delay:.6s;
    }
    @keyframes loot-shine{0%{left:-100%}50%,100%{left:200%}}
    /* Border accent gauche (style notification jeu) */
    .loot-toast::after{
      content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
      background:linear-gradient(180deg,#a78bfa,#6366f1);
      border-radius:13px 0 0 13px;
      box-shadow:0 0 12px rgba(99,102,241,.7);
    }
    .loot-toast.warm{background:linear-gradient(135deg,#7c2d12 0%,#9a3412 60%,#451a03 100%)}
    .loot-toast.warm::after{background:linear-gradient(180deg,#fbbf24,#f59e0b);box-shadow:0 0 12px rgba(251,191,36,.8)}
    .loot-toast.levelup{background:linear-gradient(135deg,#4338ca 0%,#7c3aed 50%,#1e1b4b 100%);box-shadow:0 18px 40px -12px rgba(139,92,246,.6),0 0 0 1px rgba(167,139,250,.3) inset,0 0 24px rgba(139,92,246,.4)}
    .loot-toast.levelup::after{background:linear-gradient(180deg,#fde68a,#fbbf24);box-shadow:0 0 16px rgba(251,191,36,1)}
    .loot-toast.success{background:linear-gradient(135deg,#065f46 0%,#047857 50%,#022c22 100%)}
    .loot-toast.success::after{background:linear-gradient(180deg,#34d399,#10b981);box-shadow:0 0 12px rgba(16,185,129,.8)}
    .loot-toast.gold{background:linear-gradient(135deg,#854d0e 0%,#a16207 50%,#451a03 100%);box-shadow:0 18px 40px -12px rgba(251,191,36,.6),0 0 0 1px rgba(251,191,36,.3) inset,0 0 24px rgba(251,191,36,.35)}
    .loot-toast.gold::after{background:linear-gradient(180deg,#fde68a,#facc15);box-shadow:0 0 16px rgba(251,191,36,.9)}

    @keyframes loot-in{
      0%{transform:translateX(130%) rotate(8deg) scale(.85);opacity:0;filter:blur(4px)}
      55%{transform:translateX(-12px) rotate(-2deg) scale(1.04);opacity:1;filter:blur(0)}
      80%{transform:translateX(4px) rotate(1deg) scale(.99)}
      100%{transform:translateX(0) rotate(0) scale(1);opacity:1;filter:blur(0)}
    }
    @keyframes loot-out{from{transform:translateX(0);opacity:1;filter:blur(0)}to{transform:translateX(130%);opacity:0;filter:blur(4px)}}
    .loot-toast.out{animation:loot-out .3s cubic-bezier(.4,0,1,1) forwards}

    /* Icône avec halo */
    .loot-toast .ic-wrap{
      position:relative;flex-shrink:0;
      width:42px;height:42px;
      display:flex;align-items:center;justify-content:center;
      border-radius:11px;
      background:radial-gradient(ellipse at center,rgba(255,255,255,.18),rgba(255,255,255,.04));
      border:1px solid rgba(255,255,255,.18);
    }
    .loot-toast .ic-wrap::before{
      content:'';position:absolute;inset:-4px;
      background:radial-gradient(circle,rgba(255,255,255,.4),transparent 60%);
      filter:blur(8px);z-index:-1;opacity:.6;
      animation:loot-ic-pulse 1.8s ease-in-out infinite;
    }
    @keyframes loot-ic-pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.85;transform:scale(1.15)}}
    .loot-toast .ic{font-size:22px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}

    .loot-toast .bd{flex:1;min-width:0;position:relative;z-index:1}
    .loot-toast .lb{
      font-family:var(--fd,'Archivo',sans-serif);font-weight:900;
      font-size:15px;letter-spacing:.4px;line-height:1.1;
      text-shadow:0 2px 4px rgba(0,0,0,.5);
      text-transform:uppercase;
    }
    .loot-toast .sub{font-size:11px;font-weight:600;opacity:.78;margin-top:3px;letter-spacing:.3px}

    /* Barre de progression auto-dismiss en bas */
    .loot-toast .bar{
      position:absolute;bottom:0;left:0;height:2.5px;
      background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.5) 100%);
      border-radius:0 0 13px 13px;
      animation:loot-bar 2.8s linear forwards;
      box-shadow:0 0 8px rgba(255,255,255,.4);
    }
    @keyframes loot-bar{from{width:100%}to{width:0%}}
    @media (prefers-reduced-motion:reduce){.loot-toast,.loot-toast::before,.loot-toast .bar,.loot-toast .ic-wrap::before{animation:none;transform:translateX(0) rotate(0);opacity:1}}
  `;
  document.head.appendChild(style);
  return _root;
}

export function lootToast({ icon = '⭐', label = '', subLabel = '', kind = '', duration = 2800 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Fallback : utilise le toast classique
    return;
  }
  const root = ensureRoot();
  const el = document.createElement('div');
  el.className = `loot-toast ${kind}`;
  el.style.position = 'relative';
  el.innerHTML = `
    <div class="ic-wrap"><span class="ic" aria-hidden="true">${icon}</span></div>
    <div class="bd">
      <div class="lb">${label}</div>
      ${subLabel ? `<div class="sub">${subLabel}</div>` : ''}
    </div>
    <div class="bar"></div>
  `;
  root.appendChild(el);

  // Haptique
  try { navigator.vibrate?.(15); } catch (_) {}
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}
