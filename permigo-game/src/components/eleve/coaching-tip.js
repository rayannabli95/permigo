// ═══════════════════════════════════════════════════════════════
// Coaching Tip — card contextuelle personnalisée accueil élève
// RPC : get_coaching_tip() → { tip_text, tone, cta_label, route, context }
// Usage : mountCoachingTip(root)  — inject avant .streak-pro
// ═══════════════════════════════════════════════════════════════
import { sb }       from '@/auth/auth.js';
import { esc }      from '@/utils/escape.js';
import { track }    from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { icon }     from '@/utils/icons.js';

const STYLE_ID = 'coaching-tip-style';

const TONE_CONFIG = {
  urgent:    { bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fca5a5', ico: 'alert-circle', icoColor: '#dc2626',  ctaBg: '#ef4444' },
  celebrate: { bg: 'linear-gradient(135deg,#faf5ff,#f3e8ff)', border: '#d8b4fe', ico: 'star',         icoColor: '#7c3aed',  ctaBg: '#7c3aed' },
  warm:      { bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '#fed7aa', ico: 'sun',          icoColor: '#ea580c',  ctaBg: '#f97316' },
  gentle:    { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#bfdbfe', ico: 'lightbulb',    icoColor: '#2563eb',  ctaBg: '#3b82f6' },
};

function ensureStyle() {
  if (document.head.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  .ct-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-radius: 18px;
    padding: 13px 14px;
    margin-bottom: 10px;
    border-width: 1.5px;
    border-style: solid;
    animation: ctSlideIn .32s cubic-bezier(.32,.72,0,1) both;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  @keyframes ctSlideIn {
    from { opacity:0; transform:translateY(-8px) scale(.98); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  .ct-ico {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,.6);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ct-body { flex: 1; min-width: 0; }
  .ct-text {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: #1e293b;
  }
  .ct-cta {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    padding: 6px 12px;
    border-radius: 8px;
    font: 600 12px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    border: 0;
    cursor: pointer;
    min-height: 32px;
    transition: opacity .12s, transform .12s;
  }
  .ct-cta:active { transform: scale(.96); opacity: .9; }
  .ct-dismiss {
    position: absolute;
    top: 8px; right: 8px;
    width: 24px; height: 24px;
    border-radius: 50%;
    background: rgba(0,0,0,.06);
    border: 0; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #64748b; font-size: 12px;
    transition: background .12s;
  }
  .ct-dismiss:hover { background: rgba(0,0,0,.12); }
  @media (prefers-reduced-motion: reduce) {
    .ct-card { animation: none; }
  }
  `;
  document.head.appendChild(s);
}

export async function mountCoachingTip(root) {
  let tip = null;
  try {
    const { data } = await sb.rpc('get_coaching_tip');
    tip = data;
  } catch (e) {
    console.warn('[coaching-tip] fetch error', e);
    return;
  }

  if (!tip?.tip_text) return;

  ensureStyle();

  const tone = tip.tone || 'gentle';
  const cfg  = TONE_CONFIG[tone] || TONE_CONFIG.gentle;

  const el = document.createElement('div');
  el.innerHTML = `
    <div class="ct-card" style="background:${cfg.bg};border-color:${cfg.border};">
      <div class="ct-ico">${icon(cfg.ico, { size: 18, strokeWidth: 2.2, color: cfg.icoColor })}</div>
      <div class="ct-body">
        <div class="ct-text">${esc(tip.tip_text)}</div>
        ${tip.cta_label && tip.route ? `
          <button class="ct-cta" style="background:${cfg.ctaBg};">
            ${esc(tip.cta_label)} ${icon('arrow-right', { size: 12, strokeWidth: 2.8 })}
          </button>
        ` : ''}
      </div>
      <button class="ct-dismiss" aria-label="Fermer">✕</button>
    </div>
  `;
  const card = el.firstElementChild;

  // Inject avant .streak-pro
  const streakEl = root.querySelector('.streak-pro') || root.querySelector('#streak-card');
  if (streakEl) {
    streakEl.parentNode.insertBefore(card, streakEl);
  } else {
    root.appendChild(card);
  }

  track('coaching_tip.shown', { tone, context: tip.context });

  const dismiss = () => {
    card.style.transition = 'opacity .2s, transform .2s';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-6px) scale(.98)';
    setTimeout(() => card.remove(), 220);
    track('coaching_tip.dismissed', { tone, context: tip.context });
  };

  card.querySelector('.ct-dismiss')?.addEventListener('click', e => { e.stopPropagation(); dismiss(); });

  if (tip.cta_label && tip.route) {
    card.querySelector('.ct-cta')?.addEventListener('click', e => {
      e.stopPropagation();
      track('coaching_tip.cta_clicked', { tone, context: tip.context, route: tip.route });
      dismiss();
      navigate(tip.route);
    });
  }
}
