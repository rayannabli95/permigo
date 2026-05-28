/**
 * Composant Cloche de notifications.
 *
 * Usage :
 *   import { mountNotifBell } from '@/components/common/notif-bell.js';
 *   mountNotifBell(container);   // monte une cloche cliquable
 *
 * - Fetch les 20 dernières notifs de l'utilisateur connecté
 * - Affiche un badge rouge avec le count non-lus
 * - Click → dropdown panel avec la liste, click sur notif = mark read
 * - "Tout marquer comme lu" en bas du panel
 *
 * Branché sur Supabase :
 *   - notifications (SELECT user_id = me.id)
 *   - notifications (UPDATE read = true)
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/common/toast.js';

let _notifs = [];

/**
 * Monte une cloche dans le `container` donné.
 * @param {HTMLElement} container
 */
export async function mountNotifBell(container) {
  const me = getCurUser();
  if (!me) return;

  // Skeleton initial : bouton cloche sans badge
  container.innerHTML = `
    <style>
      .nb-wrap{position:relative;display:inline-block}
      .nb-btn{width:36px;height:36px;border-radius:8px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;transition:background .12s,border-color .12s;font-family:inherit;padding:0}
      .nb-btn:hover{background:var(--bg2);border-color:var(--mu2)}
      .nb-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:var(--rd);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);line-height:1;font-family:var(--fn)}
      .nb-panel{position:absolute;top:calc(100% + 6px);right:0;width:340px;max-height:480px;background:var(--bg);border:1px solid var(--bo);border-radius:var(--rl);box-shadow:var(--s3);z-index:80;display:none;overflow:hidden;flex-direction:column}
      .nb-panel.show{display:flex;animation:nbSlide .18s ease}
      @keyframes nbSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      @media (max-width:560px){.nb-panel{width:calc(100vw - 28px);right:-4px}}
      .nb-h{padding:12px 14px;border-bottom:1px solid var(--bo2);display:flex;align-items:center;justify-content:space-between}
      .nb-h .ti{font-family:var(--fd);font-weight:800;font-size:14px;letter-spacing:-.01em}
      .nb-h .ct{font-size:10.5px;color:var(--mu);font-weight:700}
      .nb-list{flex:1;overflow-y:auto;max-height:360px}
      .nb-item{padding:11px 14px;border-bottom:1px solid var(--bo2);cursor:pointer;transition:background .1s}
      .nb-item:last-child{border-bottom:0}
      .nb-item:hover{background:var(--bg2)}
      .nb-item.unread{background:linear-gradient(90deg,var(--ap) 0%,transparent 30%)}
      .nb-item .nm{font-family:var(--fd);font-size:12.5px;font-weight:700;color:var(--ink);letter-spacing:-.005em;display:flex;align-items:center;gap:6px}
      .nb-item .nm::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--a);flex-shrink:0;opacity:0;transition:opacity .12s}
      .nb-item.unread .nm::before{opacity:1}
      .nb-item .bd{font-size:11.5px;color:var(--mu);margin-top:3px;line-height:1.45}
      .nb-item .dt{font-size:10px;color:var(--mu2);margin-top:4px;font-family:var(--fn);font-weight:700}
      .nb-empty{padding:32px 16px;text-align:center;color:var(--mu);font-size:12.5px}
      .nb-empty .em{font-size:28px;margin-bottom:6px}
      .nb-foot{padding:10px 12px;border-top:1px solid var(--bo2);background:var(--bg2)}
      .nb-foot button{width:100%;height:32px;border:0;background:transparent;color:var(--a);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border-radius:6px;transition:background .12s}
      .nb-foot button:hover{background:var(--ap)}
      .nb-foot button:disabled{color:var(--mu2);cursor:default}
      .nb-foot button:disabled:hover{background:transparent}
    </style>
    <div class="nb-wrap">
      <button class="nb-btn" id="nb-toggle" aria-label="Notifications" title="Notifications">
        🔔
        <span class="nb-badge" id="nb-badge" style="display:none">0</span>
      </button>
      <div class="nb-panel" id="nb-panel">
        <div class="nb-h">
          <div class="ti">Notifications</div>
          <div class="ct" id="nb-count">…</div>
        </div>
        <div class="nb-list" id="nb-list">
          <div class="nb-empty"><div class="em">⏳</div>Chargement…</div>
        </div>
        <div class="nb-foot" style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <button id="nb-readall" disabled>Tout marquer lu</button>
          <button id="nb-seeall" style="color:var(--ink);font-weight:700">Voir tout →</button>
        </div>
      </div>
    </div>
  `;

  await refreshBell(container, me);
  wireBell(container, me);
}

async function refreshBell(container, me) {
  const { data, error } = await sb.from('notifications')
    .select('id, type, title, body, read, created_at, data')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) { console.warn('[notif-bell] err', error); return; }
  _notifs = data || [];
  renderList(container);
}

function renderList(container) {
  const badge = container.querySelector('#nb-badge');
  const count = container.querySelector('#nb-count');
  const list = container.querySelector('#nb-list');
  const readall = container.querySelector('#nb-readall');

  const unread = _notifs.filter(n => !n.read).length;
  if (unread > 0) {
    badge.style.display = 'flex';
    badge.textContent = unread > 99 ? '99+' : String(unread);
  } else {
    badge.style.display = 'none';
  }
  count.textContent = `${unread} non lue${unread > 1 ? 's' : ''} / ${_notifs.length}`;
  readall.disabled = unread === 0;

  if (_notifs.length === 0) {
    list.innerHTML = `<div class="nb-empty"><div class="em">🌴</div>Aucune notification</div>`;
    return;
  }

  list.innerHTML = _notifs.map(n => `
    <div class="nb-item ${n.read ? '' : 'unread'}" data-id="${esc(n.id)}">
      <div class="nm">${esc(n.title)}</div>
      ${n.body ? `<div class="bd">${esc(n.body)}</div>` : ''}
      <div class="dt">${timeAgo(n.created_at)}</div>
    </div>
  `).join('');

  // Click sur une notif → mark read + navigate vers l'action liée
  list.querySelectorAll('.nb-item').forEach(it => {
    it.addEventListener('click', async () => {
      const id = it.dataset.id;
      const n = _notifs.find(x => x.id === id);
      if (!n) return;
      // Mark read (si pas déjà lu)
      if (!n.read) {
        const { error } = await sb.rpc('mark_notif_read', { p_notif_id: id });
        if (!error) { n.read = true; renderList(container); }
        else console.warn('[notif read]', error);
      }
      // Navigation contextuelle selon type + data
      const route = notifRoute(n);
      if (route) {
        container.querySelector('#nb-panel')?.classList.remove('show');
        try {
          const { navigate } = await import('@/router.js');
          navigate(route);
        } catch (_) { window.location.hash = route.startsWith('#') ? route : `#${route}`; }
      }
    });
  });
}

// Map type+data → URL
function notifRoute(n) {
  const d = n.data || {};
  switch (n.type) {
    case 'post_validation_quiz': return d.competence_id ? `/quiz/${d.competence_id}/post_validation` : '/parcours';
    case 'consolidation_quiz':   return d.competence_id ? `/quiz/${d.competence_id}/consolidation`   : '/parcours';
    case 'session_confirmation': return d.session_id    ? `/sessions/${d.session_id}` : '/';
    case 'session_confirmed':    return '/';
    case 'emotional_nudge':      return '/parcours';
    default: return '/notifications';
  }
}

function wireBell(container, me) {
  const btn = container.querySelector('#nb-toggle');
  const panel = container.querySelector('#nb-panel');
  const readall = container.querySelector('#nb-readall');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('show');
    if (panel.classList.contains('show')) refreshBell(container, me);
  });

  // Click outside → close
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) panel.classList.remove('show');
  });

  // Voir tout → page /notifications
  container.querySelector('#nb-seeall')?.addEventListener('click', async () => {
    panel.classList.remove('show');
    try {
      const { navigate } = await import('@/router.js');
      navigate('/notifications');
    } catch (e) {
      console.warn('[notif-bell] navigate failed', e);
      window.location.hash = '#/notifications';
    }
  });

  readall.addEventListener('click', async () => {
    readall.disabled = true; readall.textContent = '…';
    const hasUnread = _notifs.some(n => !n.read);
    if (!hasUnread) return;
    const { error } = await sb.rpc('mark_all_notifs_read');
    if (error) { toast('Erreur marquage', 'error'); readall.disabled = false; readall.textContent = 'Tout marquer comme lu'; return; }
    _notifs.forEach(n => { n.read = true; });
    renderList(container);
    toast('Tout marqué comme lu', 'success');
  });
}

/** "il y a 2h" / "il y a 3 jours" / "12/05" */
function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j}j`;
  return d.toLocaleDateString('fr-FR');
}
