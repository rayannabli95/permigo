// ═══════════════════════════════════════════════════════════════
// Page Notifications — liste groupée par jour
// ═══════════════════════════════════════════════════════════════

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { skelRows } from '@/components/skeleton.js';

const STYLE = `
  .nf-page {
    min-height: 100dvh;
    background: #f8f9fc;
    padding-bottom: 80px;
  }
  .nf-header {
    padding: 16px 16px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border-bottom: 1px solid #e2e6f2;
  }
  .nf-back {
    width: 36px; height: 36px;
    border-radius: 8px;
    border: 1px solid #e2e6f2;
    background: #fff;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background .12s;
    color: #0b0d1a;
    font-family: inherit;
    padding: 0;
  }
  .nf-back:hover { background: #f4f5fb; }
  .nf-title {
    font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.02em;
    color: #0b0d1a;
    flex: 1;
  }
  .nf-mark-all {
    font: 700 12px/1 'Inter', sans-serif;
    color: #6366f1;
    background: none; border: none;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 6px;
    transition: background .12s;
    font-family: inherit;
  }
  .nf-mark-all:hover { background: rgba(99,102,241,.08); }
  .nf-mark-all:disabled { color: #94a3b8; cursor: default; }
  .nf-mark-all:disabled:hover { background: none; }

  .nf-group-label {
    padding: 16px 16px 6px;
    font: 700 11px/1 'Inter', sans-serif;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .nf-list {
    background: #fff;
    border-top: 1px solid #e2e6f2;
    border-bottom: 1px solid #e2e6f2;
  }
  .nf-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 16px;
    border-bottom: 1px solid #f0f2f8;
    cursor: pointer;
    transition: background .1s;
    position: relative;
  }
  .nf-item:last-child { border-bottom: 0; }
  .nf-item:hover { background: #f8f9fc; }
  .nf-item:active { background: #f0f2f8; transform: scale(.99); }
  .nf-item.unread { background: linear-gradient(90deg, rgba(99,102,241,.05) 0%, transparent 40%); }
  .nf-item.unread:hover { background: linear-gradient(90deg, rgba(99,102,241,.08) 0%, #f8f9fc 60%); }

  .nf-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .nf-body { flex: 1; min-width: 0; }
  .nf-name {
    font: 700 13.5px/1.3 'Plus Jakarta Sans', sans-serif;
    color: #0b0d1a;
    letter-spacing: -.005em;
    display: flex; align-items: center; gap: 6px;
  }
  .nf-name::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #6366f1;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity .15s;
  }
  .nf-item.unread .nf-name::before { opacity: 1; }
  .nf-desc {
    font: 500 12px/1.45 'Inter', sans-serif;
    color: #64748b;
    margin-top: 3px;
  }
  .nf-time {
    font: 700 10.5px/1 'IBM Plex Mono', monospace;
    color: #94a3b8;
    margin-top: 5px;
  }

  .nf-empty {
    padding: 56px 24px;
    text-align: center;
    color: #64748b;
  }
  .nf-empty .em { font-size: 44px; margin-bottom: 10px; }
  .nf-empty .t { font: 700 15px/1.3 'Plus Jakarta Sans', sans-serif; color: #0b0d1a; margin-bottom: 4px; }
  .nf-empty .s { font-size: 13px; }
`;

const TYPE_META = {
  xp:           { icon: '⚡', bg: 'rgba(99,102,241,.1)',  color: '#6366f1' },
  trophy:       { icon: '🏆', bg: 'rgba(245,158,11,.1)',  color: '#f59e0b' },
  validation:   { icon: '✅', bg: 'rgba(16,185,129,.1)',  color: '#10b981' },
  streak:       { icon: '🔥', bg: 'rgba(239,68,68,.1)',   color: '#ef4444' },
  consolidation:{ icon: '🧠', bg: 'rgba(139,92,246,.1)', color: '#8b5cf6' },
  reminder:     { icon: '📌', bg: 'rgba(14,165,233,.1)',  color: '#0ea5e9' },
  info:         { icon: 'ℹ️', bg: 'rgba(100,116,139,.1)', color: '#64748b' },
};

function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.info;
}

function groupByDay(notifs) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const groups = { today: [], yesterday: [], week: [], older: [] };
  for (const n of notifs) {
    const t = new Date(n.created_at);
    const day = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    if (day >= today)         groups.today.push(n);
    else if (day >= yesterday) groups.yesterday.push(n);
    else if (day >= weekAgo)  groups.week.push(n);
    else                      groups.older.push(n);
  }
  return groups;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)  return `il y a ${h}h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function renderGroup(label, items) {
  if (!items.length) return '';
  return `
    <div class="nf-group-label">${label}</div>
    <div class="nf-list">
      ${items.map(n => {
        const m = typeMeta(n.type);
        return `
          <div class="nf-item ${n.read ? '' : 'unread'}" data-id="${esc(n.id)}" data-read="${n.read}">
            <div class="nf-icon" style="background:${m.bg};">${m.icon}</div>
            <div class="nf-body">
              <div class="nf-name">${esc(n.title)}</div>
              ${n.body ? `<div class="nf-desc">${esc(n.body)}</div>` : ''}
              <div class="nf-time">${fmtTime(n.created_at)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export async function mount(root, me) {
  if (!me) me = getCurUser();
  if (!me) return;

  track('page_view', { page: 'notifications', role: me.role });

  root.innerHTML = `
    <style>${STYLE}</style>
    <div class="nf-page anim-slide-up">
      <div class="nf-header">
        <button class="nf-back" id="nf-back" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="nf-title">Notifications</div>
        <button class="nf-mark-all" id="nf-mark-all" disabled>Tout lu</button>
      </div>
      <div id="nf-content">${skelRows(5)}</div>
    </div>
  `;

  root.querySelector('#nf-back').addEventListener('click', () => navigate('/'));

  const { data, error } = await sb
    .from('notifications')
    .select('id, type, title, body, read, created_at')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    toast('Impossible de charger les notifications', 'error');
    root.querySelector('#nf-content').innerHTML = `<div class="nf-empty"><div class="em">⚠️</div><div class="t">Erreur de chargement</div><div class="s">Vérifie ta connexion et réessaie.</div></div>`;
    return;
  }

  const notifs = data || [];
  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllBtn = root.querySelector('#nf-mark-all');
  markAllBtn.disabled = unreadCount === 0;

  if (notifs.length === 0) {
    root.querySelector('#nf-content').innerHTML = `
      <div class="nf-empty">
        <div class="em">🌴</div>
        <div class="t">Tout est calme ici</div>
        <div class="s">Tes notifications apparaîtront ici dès qu'il y aura de l'activité.</div>
      </div>
    `;
    return;
  }

  const groups = groupByDay(notifs);
  root.querySelector('#nf-content').innerHTML = `
    ${renderGroup('Aujourd\'hui', groups.today)}
    ${renderGroup('Hier', groups.yesterday)}
    ${renderGroup('Cette semaine', groups.week)}
    ${renderGroup('Plus ancien', groups.older)}
  `;

  // Mark individual as read on tap
  root.querySelectorAll('.nf-item').forEach(el => {
    el.addEventListener('click', async () => {
      if (el.dataset.read === 'true') return;
      const id = el.dataset.id;
      const { error } = await sb.from('notifications').update({ read: true }).eq('id', id);
      if (error) return;
      el.dataset.read = 'true';
      el.classList.remove('unread');
      track('notification.read', { notif_id: id });
      const remaining = root.querySelectorAll('.nf-item.unread').length;
      markAllBtn.disabled = remaining === 0;
    });
  });

  // Mark all as read
  markAllBtn.addEventListener('click', async () => {
    markAllBtn.disabled = true;
    markAllBtn.textContent = '…';
    const ids = notifs.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    const { error } = await sb.from('notifications').update({ read: true }).in('id', ids);
    if (error) { toast('Erreur de mise à jour', 'error'); markAllBtn.disabled = false; markAllBtn.textContent = 'Tout lu'; return; }
    root.querySelectorAll('.nf-item.unread').forEach(el => { el.classList.remove('unread'); el.dataset.read = 'true'; });
    markAllBtn.textContent = 'Tout lu';
    toast('Toutes les notifications marquées comme lues', 'success');
    track('notifications.mark_all_read', { count: ids.length });
  });
}
