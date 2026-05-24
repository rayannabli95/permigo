/**
 * Alert Card — alerte premium avec action obligatoire ou optionnelle.
 *
 * 2 modes :
 *  - banner  : inline dans la page (en haut), non-bloquant
 *  - modal   : full-screen avec backdrop, bloquant (action obligatoire)
 *
 * Usage banner (inline) :
 *   const html = renderAlertCard({ ... });
 *   inject in DOM + wireAlertCard(rootSelector)
 *
 * Usage modal (programmatique) :
 *   showAlertCardModal({ title, description, buttonText, onAction, ... });
 *
 * Variants : 'danger' (rouge) | 'warning' (orange) | 'info' (bleu) | 'success' (vert)
 */

import { esc } from '@/utils/escape.js';

const ICON_LIBRARY = {
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
};

export function renderAlertCard({
  id = '',
  variant = 'danger',
  icon = 'alert',
  title = '',
  description = '',
  buttonText = 'OK',
  buttonAction = '',
  dismissible = false,
} = {}) {
  const ic = ICON_LIBRARY[icon] || ICON_LIBRARY.alert;
  return `
    <div class="alc-card alc-${esc(variant)}" data-alert-id="${esc(id)}" role="alert" aria-live="assertive">
      ${dismissible ? `<button class="alc-close" data-alert-action="dismiss" aria-label="Fermer">✕</button>` : ''}

      <div class="alc-icon">
        <div class="alc-icon-inner">${ic}</div>
      </div>

      <h3 class="alc-title">${esc(title)}</h3>
      <p class="alc-desc">${esc(description)}</p>

      <button class="alc-btn" data-alert-action="${esc(buttonAction || 'action')}" type="button">
        ${esc(buttonText)}
      </button>
    </div>
  `;
}

/**
 * Wire les click handlers sur les cards alertes présentes dans `root`.
 * @param {Element} root
 * @param {function} onAction - receives (action, id) when user clicks the CTA
 * @param {function} onDismiss - receives (id) when user dismisses
 */
export function wireAlertCards(root, { onAction, onDismiss } = {}) {
  root.querySelectorAll('[data-alert-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.alertAction;
      const card = btn.closest('.alc-card');
      const id = card?.dataset.alertId;
      if (action === 'dismiss' && typeof onDismiss === 'function') onDismiss(id);
      else if (typeof onAction === 'function') onAction(action, id);
    });
  });
}

/** Modal full-screen bloquant. Pas de dismiss = action obligatoire. */
export function showAlertCardModal({
  variant = 'danger',
  icon = 'alert',
  title = 'Action requise',
  description = '',
  buttonText = 'Continuer',
  onAction,
  dismissible = false,
  onDismiss,
} = {}) {
  ensureAlertCardStyles();
  const host = document.createElement('div');
  host.className = 'alc-modal-host';
  host.innerHTML = `
    <div class="alc-modal-bg"></div>
    <div class="alc-modal-wrap">
      ${renderAlertCard({ variant, icon, title, description, buttonText, dismissible })}
    </div>
  `;
  document.body.appendChild(host);
  requestAnimationFrame(() => host.classList.add('alc-in'));

  const close = () => {
    host.classList.remove('alc-in');
    host.classList.add('alc-out');
    setTimeout(() => host.remove(), 250);
  };

  host.querySelector('[data-alert-action]')?.addEventListener('click', () => {
    close();
    if (typeof onAction === 'function') onAction();
  });
  host.querySelector('[data-alert-action="dismiss"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
    if (typeof onDismiss === 'function') onDismiss();
  });

  if (!dismissible) {
    // Click backdrop ne ferme pas (obligatoire)
    host.querySelector('.alc-modal-bg')?.addEventListener('click', (e) => e.stopPropagation());
  } else {
    host.querySelector('.alc-modal-bg')?.addEventListener('click', () => {
      close();
      if (typeof onDismiss === 'function') onDismiss();
    });
  }

  return { close };
}

let _stylesInjected = false;
function ensureAlertCardStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'alert-card-styles';
  style.textContent = ALERT_CARD_CSS;
  document.head.appendChild(style);
}

export const ALERT_CARD_CSS = `
  /* ── Alert Card ── */
  .alc-card{
    position:relative;
    width:100%;
    max-width:420px;
    padding:24px 24px 24px 24px;
    border-radius:20px;
    overflow:hidden;
    box-shadow:0 18px 40px -10px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.08) inset;
    animation:alc-pop .45s cubic-bezier(.34,1.56,.64,1) backwards;
    font-family:inherit;
  }
  @keyframes alc-pop{
    from{opacity:0;transform:translateY(40px) scale(.95)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }

  /* Variants */
  .alc-danger{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff}
  .alc-warning{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff}
  .alc-info{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff}
  .alc-success{background:linear-gradient(135deg,#10b981,#059669);color:#fff}

  .alc-close{
    position:absolute;
    top:14px;
    right:14px;
    width:32px;
    height:32px;
    border-radius:50%;
    background:rgba(255,255,255,.15);
    border:0;
    color:#fff;
    font-size:14px;
    font-weight:700;
    cursor:pointer;
    transition:background .15s,transform .15s;
    z-index:2;
  }
  .alc-close:hover{background:rgba(255,255,255,.25);transform:scale(1.05)}

  .alc-icon{
    position:absolute;
    top:20px;
    right:20px;
    width:52px;
    height:52px;
    border-radius:14px;
    background:rgba(255,255,255,.15);
    display:flex;
    align-items:center;
    justify-content:center;
    color:#fff;
    backdrop-filter:blur(8px);
  }
  .alc-icon-inner{
    width:26px;
    height:26px;
    animation:alc-pulse 1.6s ease-in-out infinite;
  }
  .alc-icon-inner svg{width:100%;height:100%}
  @keyframes alc-pulse{
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.12)}
  }
  /* Si .alc-close existe, décale l'icône à gauche */
  .alc-card:has(.alc-close) .alc-icon{top:60px;right:20px}

  .alc-title{
    font-family:var(--fd,system-ui);
    font-size:22px;
    font-weight:900;
    letter-spacing:-.015em;
    line-height:1.2;
    margin:0 0 6px;
    max-width:calc(100% - 70px);
    color:#fff;
  }
  .alc-desc{
    font-size:13.5px;
    line-height:1.55;
    color:rgba(255,255,255,.85);
    margin:0 0 22px;
    max-width:calc(100% - 30px);
  }

  .alc-btn{
    width:100%;
    padding:14px 18px;
    border-radius:99px;
    border:0;
    background:#fff;
    color:#0f172a;
    font-family:var(--fd,system-ui);
    font-size:14.5px;
    font-weight:800;
    letter-spacing:-.005em;
    cursor:pointer;
    transition:transform .15s,box-shadow .2s,background .15s;
    box-shadow:0 8px 20px -6px rgba(0,0,0,.3);
  }
  .alc-btn:hover{transform:translateY(-1px);box-shadow:0 12px 24px -6px rgba(0,0,0,.4)}
  .alc-btn:active{transform:scale(.97)}

  /* Variant button color override */
  .alc-danger .alc-btn{color:#b91c1c}
  .alc-warning .alc-btn{color:#b45309}
  .alc-info .alc-btn{color:#1d4ed8}
  .alc-success .alc-btn{color:#047857}

  /* ── Modal mode ── */
  .alc-modal-host{
    position:fixed;
    inset:0;
    z-index:9000;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:16px;
    opacity:0;
    transition:opacity .25s;
  }
  .alc-modal-host.alc-in{opacity:1}
  .alc-modal-host.alc-out{opacity:0}
  .alc-modal-bg{
    position:absolute;
    inset:0;
    background:rgba(8,10,20,.7);
    backdrop-filter:blur(8px);
    -webkit-backdrop-filter:blur(8px);
  }
  .alc-modal-wrap{
    position:relative;
    z-index:2;
    display:flex;
    align-items:center;
    justify-content:center;
    width:100%;
    max-width:440px;
  }

  /* Mobile */
  @media (max-width:560px){
    .alc-title{font-size:19px;max-width:calc(100% - 64px)}
    .alc-desc{font-size:13px}
    .alc-icon{width:44px;height:44px;top:18px;right:18px}
  }
`;
