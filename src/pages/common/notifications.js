/**
 * Page Notifications — historique complet + actions (mark read, delete, mark all).
 *
 * Branchée sur la table notifications (user_id, type, title, body, read, created_at).
 */

import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

let _root, _me, _notifs = [];

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div></div>`;
  await load();
  render();
}

async function load() {
  const { data } = await sb.from('notifications')
    .select('id, type, title, body, read, created_at')
    .eq('user_id', _me.id)
    .order('created_at', { ascending: false })
    .limit(100);
  _notifs = data || [];
}

function render() {
  const unread = _notifs.filter(n => !n.read).length;
  const grouped = groupByDate(_notifs);

  _root.innerHTML = `
    <style>
      .nt-wrap{max-width:560px;margin:0 auto;padding:14px;padding-bottom:90px}
      .nt-top{display:flex;align-items:center;gap:10px;padding:6px 4px 6px}
      .nt-back{width:36px;height:36px;border-radius:10px;border:1px solid var(--bo);background:var(--su);font-size:18px;cursor:pointer;color:var(--ink);flex-shrink:0}
      .nt-top-ti{flex:1;min-width:0}
      .nt-top h1{font-family:var(--fd);font-size:20px;font-weight:900;letter-spacing:-.02em;margin:0;line-height:1.1}
      .nt-top .sub{font-size:11.5px;color:var(--mu);margin-top:3px}
      .nt-top .sub b{color:var(--a);font-weight:800}

      .nt-toolbar{display:flex;justify-content:flex-end;margin:6px 0 14px}
      .nt-mark-all{padding:9px 16px;border-radius:99px;background:var(--ap);color:var(--a);border:1px solid var(--a);font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.2px;transition:all .15s;white-space:nowrap}
      .nt-mark-all:hover{background:var(--a);color:#fff}

      .nt-section{margin-bottom:20px}
      .nt-section-h{font-family:var(--fn);font-size:10.5px;font-weight:900;color:var(--mu);letter-spacing:.2em;text-transform:uppercase;margin:0 4px 10px;padding-bottom:6px;border-bottom:1px solid var(--bo2)}

      .nt-card{background:var(--su);border:1px solid var(--bo);border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s;position:relative;overflow:hidden}
      .nt-card:hover{transform:translateY(-2px);border-color:var(--a);box-shadow:0 8px 20px -8px rgba(99,102,241,.25)}
      .nt-card.unread{border-left:3px solid var(--a);background:linear-gradient(135deg,var(--ap),var(--su) 60%)}
      .nt-card.unread .nt-ti::after{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--a);box-shadow:0 0 6px var(--a);margin-left:7px;vertical-align:middle}
      .nt-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
      .nt-icon.info{background:var(--ap);color:var(--a)}
      .nt-icon.success{background:var(--grp);color:var(--gr)}
      .nt-icon.warning{background:var(--amp);color:var(--am)}
      .nt-icon.error{background:var(--rdp);color:var(--rd)}
      .nt-body{flex:1;min-width:0;padding-right:34px}
      .nt-ti{font-family:var(--fd);font-weight:800;font-size:14px;color:var(--ink);line-height:1.25;letter-spacing:-.005em}
      .nt-bd{font-size:12.5px;color:var(--mu);margin-top:5px;line-height:1.45;word-wrap:break-word;overflow-wrap:break-word}
      .nt-date{font-family:var(--fn);font-size:10.5px;font-weight:700;color:var(--mu2);margin-top:7px;letter-spacing:.3px}
      .nt-del{position:absolute;top:50%;right:10px;transform:translateY(-50%);width:32px;height:32px;border-radius:8px;border:0;background:var(--bg2);color:var(--mu2);cursor:pointer;font-size:13px;transition:background .15s,color .15s;display:flex;align-items:center;justify-content:center}
      .nt-del:hover{background:var(--rdp);color:var(--rd)}

      .nt-empty{text-align:center;padding:56px 20px;color:var(--mu);background:var(--bg2);border-radius:14px;font-size:13.5px}
      .nt-empty .em{font-size:48px;line-height:1;margin-bottom:12px}
      .nt-empty .ti{font-family:var(--fd);font-weight:800;font-size:15px;color:var(--ink);margin-bottom:4px}

      @media (max-width:420px){
        .nt-top h1{font-size:18px}
        .nt-card{padding:12px 14px;gap:10px}
        .nt-icon{width:36px;height:36px;font-size:16px}
        .nt-body{padding-right:30px}
        .nt-ti{font-size:13.5px}
        .nt-bd{font-size:12px}
      }
    </style>

    <div class="nt-wrap anim-slide-up">
      <div class="nt-top">
        <button class="nt-back" id="nt-back" aria-label="Retour">‹</button>
        <img src="permigo-logo.png" alt="PermiGo" style="height:26px;width:auto;margin-right:4px;filter:drop-shadow(0 3px 8px rgba(99,102,241,.25))" onerror="this.style.display='none'">
        <div class="nt-top-ti">
          <h1>🔔 Notifications</h1>
          <div class="sub">${unread > 0 ? `<b>${unread} non lue${unread > 1 ? 's' : ''}</b> · ` : ''}${_notifs.length} au total</div>
        </div>
      </div>
      ${unread > 0 ? `<div class="nt-toolbar"><button class="nt-mark-all" id="nt-mark-all" type="button">✓ Tout marquer lu</button></div>` : ''}

      ${_notifs.length === 0 ? `
        <div class="nt-empty">
          <div class="em">🔔</div>
          <div class="ti">Aucune notification</div>
          <div style="font-size:12px;color:var(--mu2)">Tu es à jour ✨</div>
        </div>
      ` : Object.entries(grouped).map(([label, items]) => `
        <div class="nt-section">
          <div class="nt-section-h">${label}</div>
          ${items.map(renderNotifCard).join('')}
        </div>
      `).join('')}
    </div>
  `;
  wire();
}

function renderNotifCard(n) {
  const ago = formatAgo(n.created_at);
  const iconChar = ({ info: 'ℹ️', success: '✓', warning: '⚠️', error: '⚠️' })[n.type] || '🔔';
  return `
    <div class="nt-card ${n.read ? '' : 'unread'}" data-id="${esc(n.id)}">
      <div class="nt-icon ${esc(n.type || 'info')}" aria-hidden="true">${iconChar}</div>
      <div class="nt-body">
        <div class="nt-ti">${esc(n.title || '—')}</div>
        ${n.body ? `<div class="nt-bd">${esc(n.body)}</div>` : ''}
        <div class="nt-date">${esc(ago)}</div>
      </div>
      <button class="nt-del" data-del="${esc(n.id)}" type="button" aria-label="Supprimer">🗑</button>
    </div>
  `;
}

function groupByDate(notifs) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const out = { "Aujourd'hui": [], 'Hier': [], 'Cette semaine': [], 'Plus ancien': [] };
  for (const n of notifs) {
    const d = (n.created_at || '').slice(0, 10);
    const ageDays = (Date.now() - new Date(n.created_at).getTime()) / 86400000;
    if (d === today) out["Aujourd'hui"].push(n);
    else if (d === yesterday) out['Hier'].push(n);
    else if (ageDays < 7) out['Cette semaine'].push(n);
    else out['Plus ancien'].push(n);
  }
  // Retire les sections vides
  Object.keys(out).forEach(k => { if (out[k].length === 0) delete out[k]; });
  return out;
}

function formatAgo(iso) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const j = Math.round(h / 24);
  return j < 7 ? `il y a ${j}j` : new Date(iso).toLocaleDateString('fr-FR');
}

function wire() {
  _root.querySelector('#nt-back')?.addEventListener('click', () => history.back());

  // Tap card → mark read + ouvrir si lien
  _root.querySelectorAll('.nt-card').forEach(c => {
    c.addEventListener('click', async (e) => {
      if (e.target.closest('[data-del]')) return;
      const id = c.dataset.id;
      const n = _notifs.find(x => x.id === id);
      if (n && !n.read) {
        n.read = true;
        c.classList.remove('unread');
        await sb.from('notifications').update({ read: true }).eq('id', id);
      }
    });
  });

  // Delete
  _root.querySelectorAll('[data-del]').forEach(b => {
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = b.dataset.del;
      const { error } = await sb.from('notifications').delete().eq('id', id);
      if (error) { toast('Erreur', 'error'); return; }
      _notifs = _notifs.filter(n => n.id !== id);
      render();
      toast('Notification supprimée', 'success');
    });
  });

  // Mark all read
  _root.querySelector('#nt-mark-all')?.addEventListener('click', async () => {
    const unreadIds = _notifs.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await sb.from('notifications').update({ read: true }).in('id', unreadIds);
    if (error) { toast('Erreur', 'error'); return; }
    _notifs.forEach(n => { n.read = true; });
    render();
    toast(`${unreadIds.length} notifications marquées lues`, 'success');
  });
}
