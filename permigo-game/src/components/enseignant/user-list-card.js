/**
 * Composant Card "Liste d'utilisateurs" — réutilisable.
 *
 * Inspiré du pattern Recent Users : header + scrollable list + footer.
 * Cas d'usage : "Mes élèves" enseignant, "Équipe en ligne" admin, etc.
 *
 * Usage :
 *   import { renderUserListCard, wireUserListCard, USER_LIST_CARD_CSS } from '@/components/enseignant/user-list-card.js';
 *
 *   const html = renderUserListCard({
 *     title: 'Mes élèves',
 *     items: [{ id, nom, sub, badge: { label, variant }, avatarUrl }],
 *     footer: { label: 'Voir tous mes élèves', action: 'seeAll' },
 *   });
 *
 *   wireUserListCard(root, { onItemClick: (id) => ..., onAction: (name) => ... });
 *
 * Variants badge : 'success' (vert), 'warning' (orange), 'neutral' (gris), 'danger' (rouge)
 */

import { esc } from '@/utils/escape.js';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#30cfd0,#330867)',
];

function gradientFor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
}

export function renderUserListCard({
  title = 'Liste',
  subtitle = null,
  items = [],
  footer = null,
  emptyText = 'Aucun élément',
  maxHeight = 320,
} = {}) {
  return `
    <div class="ulc-card">
      <header class="ulc-h">
        <div>
          <h3 class="ulc-ti">${esc(title)}</h3>
          ${subtitle ? `<div class="ulc-sub">${esc(subtitle)}</div>` : ''}
        </div>
        ${items.length > 0 ? `<div class="ulc-count">${items.length}</div>` : ''}
      </header>

      <div class="ulc-body" style="max-height:${maxHeight}px">
        ${items.length === 0 ? `
          <div class="ulc-empty">
            <div class="ulc-empty-em">📭</div>
            <div>${esc(emptyText)}</div>
          </div>
        ` : items.map(it => renderItem(it)).join('')}
      </div>

      ${footer ? `
        <footer class="ulc-foot">
          <button class="ulc-foot-btn" data-action="${esc(footer.action || 'seeAll')}" type="button">
            ${esc(footer.label || 'Voir tous')} <span class="ulc-foot-arrow">→</span>
          </button>
        </footer>
      ` : ''}
    </div>
  `;
}

function renderItem(it) {
  const init = initials(it.nom || it.title || '');
  const grad = it.gradient || gradientFor(it.id || it.nom || '');
  const badge = it.badge || null;
  return `
    <button class="ulc-row" data-id="${esc(it.id)}" type="button" tabindex="0">
      <div class="ulc-av" style="background:${grad}">
        ${it.avatarUrl ? `<img src="${esc(it.avatarUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ''}
        <span class="ulc-av-init">${esc(init)}</span>
      </div>
      <div class="ulc-body-row">
        <div class="ulc-nm">${esc(it.nom || it.title || '')}</div>
        ${it.sub ? `<div class="ulc-meta">${esc(it.sub)}</div>` : ''}
      </div>
      ${badge ? `<div class="ulc-badge ulc-badge-${esc(badge.variant || 'neutral')}">${esc(badge.label || '')}</div>` : ''}
    </button>
  `;
}

export function wireUserListCard(root, { onItemClick, onAction } = {}) {
  root.querySelectorAll('.ulc-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      if (typeof onItemClick === 'function') onItemClick(id);
    });
  });
  root.querySelectorAll('.ulc-foot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (typeof onAction === 'function') onAction(action);
    });
  });
}

export const USER_LIST_CARD_CSS = `
  .ulc-card{
    background:var(--su,#fff);
    border:1px solid var(--bo,var(--bo3));
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 4px 14px -4px rgba(15,23,42,.08);
  }
  .ulc-h{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    padding:16px 18px 12px;
    border-bottom:1px solid var(--bo2,var(--bg4));
  }
  .ulc-ti{
    font-family:var(--fd,system-ui);
    font-size:15px;
    font-weight:800;
    color:var(--ink);
    margin:0;
    letter-spacing:-.01em;
    line-height:1.2;
  }
  .ulc-sub{
    font-size:11.5px;
    color:var(--mu,var(--mu3));
    margin-top:3px;
    line-height:1.3;
  }
  .ulc-count{
    font-family:var(--fn,system-ui);
    font-size:11px;
    font-weight:800;
    color:var(--mu,var(--mu3));
    background:var(--bg2,#f8fafc);
    border:1px solid var(--bo2,var(--bg4));
    padding:3px 9px;
    border-radius:99px;
    letter-spacing:.2px;
  }

  .ulc-body{
    overflow-y:auto;
    overflow-x:hidden;
    padding:6px 6px 6px 14px;
    /* Scrollbar custom */
    scrollbar-width:thin;
    scrollbar-color:rgba(100,116,139,.3) transparent;
  }
  .ulc-body::-webkit-scrollbar{width:6px}
  .ulc-body::-webkit-scrollbar-track{background:transparent}
  .ulc-body::-webkit-scrollbar-thumb{background:rgba(100,116,139,.25);border-radius:99px}
  .ulc-body::-webkit-scrollbar-thumb:hover{background:rgba(100,116,139,.45)}

  .ulc-row{
    display:flex;
    align-items:center;
    gap:11px;
    width:100%;
    padding:10px 8px;
    border:0;
    background:transparent;
    cursor:pointer;
    border-radius:10px;
    transition:background .15s;
    text-align:left;
    border-bottom:1px dashed var(--bo2,var(--bg4));
    font-family:inherit;
  }
  .ulc-row:last-child{border-bottom:0}
  .ulc-row:hover{background:var(--bg2,#f8fafc)}
  .ulc-row:focus-visible{outline:2px solid var(--a);outline-offset:-2px;background:var(--bg2,#f8fafc)}

  .ulc-av{
    width:36px;
    height:36px;
    border-radius:50%;
    position:relative;
    overflow:hidden;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#fff;
    font-family:var(--fd,system-ui);
    font-weight:800;
    font-size:13px;
    letter-spacing:-.01em;
    box-shadow:0 2px 8px -2px rgba(0,0,0,.18);
  }
  .ulc-av img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;z-index:1}
  .ulc-av-init{position:relative;z-index:0}

  .ulc-body-row{flex:1;min-width:0}
  .ulc-nm{
    font-family:var(--fd,system-ui);
    font-size:13.5px;
    font-weight:700;
    color:var(--ink);
    line-height:1.2;
    letter-spacing:-.005em;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .ulc-meta{
    font-size:12px;
    color:var(--mu,var(--mu3));
    margin-top:2px;
    line-height:1.3;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }

  .ulc-badge{
    font-family:var(--fn,system-ui);
    font-size:10.5px;
    font-weight:800;
    padding:3px 9px;
    border-radius:99px;
    border:1px solid;
    letter-spacing:.2px;
    white-space:nowrap;
    flex-shrink:0;
  }
  .ulc-badge-success{background:rgba(16,185,129,.1);color:var(--grd);border-color:rgba(16,185,129,.3)}
  .ulc-badge-warning{background:rgba(245,158,11,.1);color:var(--amk);border-color:rgba(245,158,11,.3)}
  .ulc-badge-danger{background:rgba(239,68,68,.1);color:var(--rdk);border-color:rgba(239,68,68,.3)}
  .ulc-badge-neutral{background:rgba(100,116,139,.08);color:var(--mu3);border-color:rgba(100,116,139,.2)}

  .ulc-empty{
    padding:30px 20px;
    text-align:center;
    color:var(--mu,var(--mu3));
    font-size:13px;
  }
  .ulc-empty-em{font-size:28px;margin-bottom:8px;opacity:.5}

  .ulc-foot{
    padding:10px 16px 14px;
    border-top:1px solid var(--bo2,var(--bg4));
    text-align:center;
    background:var(--su,#fff);
  }
  .ulc-foot-btn{
    background:none;
    border:0;
    color:var(--a);
    font-family:inherit;
    font-weight:700;
    font-size:13px;
    cursor:pointer;
    padding:6px 12px;
    display:inline-flex;
    align-items:center;
    gap:4px;
    transition:gap .15s;
    text-decoration:underline;
    text-decoration-style:dashed;
    text-underline-offset:4px;
    text-decoration-color:rgba(88,204,2,.3);
  }
  .ulc-foot-btn:hover{gap:8px;text-decoration-color:var(--a)}
  .ulc-foot-arrow{transition:transform .15s}
  .ulc-foot-btn:hover .ulc-foot-arrow{transform:translateX(2px)}
`;
