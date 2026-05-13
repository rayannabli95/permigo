/**
 * Page Leads Admin — pipeline commercial (B2B).
 *
 * Liste les leads remplis depuis le form public `/inscription-ecole`.
 *
 * Actions possibles :
 *  - Filtre par statut (Tous / Nouveau / Contacté / Converti / Perdu)
 *  - Marquer comme contacté / converti / perdu
 *  - Voir les infos complètes (modal détail)
 *  - Lien direct mailto: et tel: pour rappel rapide
 *
 * Stats en haut : compteurs par statut + taux de conversion.
 */

import { sb, logout } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { mountNotifBell } from '@/components/notif-bell.js';

let _root, _me;
let _leads = [];
let _filter = 'all'; // 'all' | 'nouveau' | 'contacte' | 'converti' | 'perdu'
let _selected = null;

const STATUS_LABELS = {
  nouveau:  { label: 'Nouveau',  color: '#6366f1', emoji: '🔥' },
  contacte: { label: 'Contacté', color: '#f59e0b', emoji: '📞' },
  converti: { label: 'Converti', color: '#10b981', emoji: '✅' },
  perdu:    { label: 'Perdu',    color: '#94a3b8', emoji: '❌' },
};

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;
  if (_me.role !== 'admin') { root.innerHTML = '<p>Accès admin requis</p>'; return; }

  root.innerHTML = `<div style="padding:18px"><div class="skel skel-card"></div><div class="skel skel-card"></div></div>`;

  await loadLeads();
  render();
}

async function loadLeads() {
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[leads] fetch error', error);
    toast('Erreur chargement des leads', 'error');
    _leads = [];
    return;
  }
  _leads = data || [];
}

function render() {
  // Stats
  const stats = {
    total: _leads.length,
    nouveau: _leads.filter(l => l.status === 'nouveau').length,
    contacte: _leads.filter(l => l.status === 'contacte').length,
    converti: _leads.filter(l => l.status === 'converti').length,
    perdu: _leads.filter(l => l.status === 'perdu').length,
  };
  const taux = stats.total ? Math.round(stats.converti / stats.total * 100) : 0;

  // Filtered list
  const filtered = _filter === 'all' ? _leads : _leads.filter(l => l.status === _filter);

  _root.innerHTML = `
    <style>
      .ld-bg{position:fixed;inset:0;z-index:0;background:#0b0d1a;overflow:hidden;pointer-events:none}
      .ld-bg::before{content:'';position:absolute;inset:-50%;background:radial-gradient(ellipse at 20% 20%,#6366f1 0%,transparent 40%),radial-gradient(ellipse at 80% 30%,#8b5cf6 0%,transparent 40%);filter:blur(60px);opacity:.4;animation:ld-float 22s ease-in-out infinite alternate}
      @keyframes ld-float{0%{transform:translate(0,0)}100%{transform:translate(40px,-30px) scale(1.08)}}
      .ld-grid{position:fixed;inset:0;z-index:1;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:50px 50px;pointer-events:none;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}

      .ld-wrap{max-width:1100px;margin:0 auto;padding:14px;position:relative;z-index:2;min-height:100vh}
      .ld-top{display:flex;align-items:center;gap:10px;padding:14px 4px 22px}
      .ld-top .ttl{font-family:var(--fd);font-weight:800;font-size:26px;letter-spacing:-.02em;color:#fff}
      .ld-top .sub{font-size:12px;color:rgba(255,255,255,.55);margin-top:3px}
      .ld-back{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;height:36px;padding:0 14px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:background .15s}
      .ld-back:hover{background:rgba(255,255,255,.14)}
      .ld-top-r{margin-left:auto;display:flex;align-items:center;gap:8px}

      .ld-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:22px}
      @media (max-width:720px){.ld-stats{grid-template-columns:repeat(3,1fr)}}
      .ld-stat{background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 14px;cursor:pointer;transition:all .15s}
      .ld-stat:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.2)}
      .ld-stat.active{border-color:rgba(99,102,241,.6);box-shadow:0 0 0 1px rgba(99,102,241,.3)}
      .ld-stat .lbl{font-size:10px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
      .ld-stat .v{font-family:var(--fd);font-size:24px;font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1}
      .ld-stat .v small{font-size:11px;color:rgba(255,255,255,.55);font-weight:700;margin-left:3px}

      .ld-section-h{font-family:var(--fd);font-size:11.5px;font-weight:800;margin:0 0 10px;padding:0 4px;text-transform:uppercase;color:rgba(255,255,255,.5);letter-spacing:1.5px;display:flex;align-items:center;gap:10px}
      .ld-section-h .cnt{background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.3);padding:2px 9px;border-radius:99px;color:#a5b4fc;letter-spacing:.3px}

      .ld-list{display:flex;flex-direction:column;gap:8px;margin-bottom:30px}
      .ld-card{background:rgba(255,255,255,.05);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px 16px;display:flex;gap:14px;align-items:center;cursor:pointer;transition:all .15s;animation:ld-fade .35s ease-out backwards}
      .ld-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.2)}
      @keyframes ld-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

      .ld-status{flex-shrink:0;width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px}
      .ld-body{flex:1;min-width:0}
      .ld-nm{font-family:var(--fd);font-weight:700;font-size:14.5px;color:#fff;letter-spacing:-.005em;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .ld-tag{font-size:10px;font-weight:800;letter-spacing:.4px;padding:2px 8px;border-radius:99px;text-transform:uppercase}
      .ld-meta{font-size:11.5px;color:rgba(255,255,255,.55);margin-top:4px;display:flex;gap:10px;flex-wrap:wrap}
      .ld-meta span{display:inline-flex;align-items:center;gap:3px}
      .ld-meta b{color:rgba(255,255,255,.8);font-weight:700}
      .ld-time{font-size:10.5px;color:rgba(255,255,255,.4);font-family:var(--fn);font-weight:700;flex-shrink:0}

      .ld-empty{padding:60px 20px;text-align:center;color:rgba(255,255,255,.45);font-size:13px}
      .ld-empty-em{font-size:48px;margin-bottom:14px;opacity:.5}

      /* Modal détail */
      .ld-modal-bg{position:fixed;inset:0;z-index:100;background:rgba(11,13,26,.7);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:14px;animation:ld-mfade .2s}
      @keyframes ld-mfade{from{opacity:0}to{opacity:1}}
      .ld-modal{background:rgba(255,255,255,.04);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:24px;width:100%;max-width:480px;animation:ld-mpop .25s cubic-bezier(.5,1.6,.4,1)}
      @keyframes ld-mpop{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
      .ld-mtitle{font-family:var(--fd);font-weight:900;font-size:20px;color:#fff;letter-spacing:-.01em;margin:0 0 4px}
      .ld-msub{font-size:12px;color:rgba(255,255,255,.5);margin:0 0 18px}
      .ld-mrow{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px}
      .ld-mrow:last-of-type{border-bottom:0}
      .ld-mrow .k{color:rgba(255,255,255,.55);font-weight:600}
      .ld-mrow .v{color:#fff;font-weight:600}
      .ld-mrow .v a{color:#a5b4fc;text-decoration:none;font-weight:700}
      .ld-mrow .v a:hover{text-decoration:underline}
      .ld-mmsg{margin-top:14px;padding:12px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:13px;color:rgba(255,255,255,.85);line-height:1.5;white-space:pre-wrap}
      .ld-mactions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}
      .ld-mbtn{height:42px;border-radius:11px;font-family:var(--fd);font-weight:800;font-size:13px;cursor:pointer;border:0;letter-spacing:.3px;transition:transform .12s}
      .ld-mbtn:hover{transform:translateY(-1px)}
      .ld-mbtn.contacte{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff}
      .ld-mbtn.converti{background:linear-gradient(135deg,#10b981,#059669);color:#fff}
      .ld-mbtn.perdu{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12)}
      .ld-mbtn.reset{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12)}
      .ld-mclose{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
    </style>

    <div class="ld-bg"></div>
    <div class="ld-grid"></div>

    <div class="ld-wrap anim-slide-up">

      <div class="ld-top">
        <button class="ld-back" id="ld-back">‹ Dashboard</button>
        <div>
          <div class="ttl">Mes Leads</div>
          <div class="sub">Pipeline commercial · ${stats.total} prospect${stats.total > 1 ? 's' : ''}</div>
        </div>
        <div class="ld-top-r">
          <span id="ld-bell"></span>
        </div>
      </div>

      <!-- Stats / Filtres -->
      <div class="ld-stats">
        ${statCard('all', 'Total', stats.total, _filter === 'all')}
        ${statCard('nouveau', '🔥 Nouveau', stats.nouveau, _filter === 'nouveau')}
        ${statCard('contacte', '📞 Contacté', stats.contacte, _filter === 'contacte')}
        ${statCard('converti', `✅ Convertis (${taux}%)`, stats.converti, _filter === 'converti')}
        ${statCard('perdu', '❌ Perdu', stats.perdu, _filter === 'perdu')}
      </div>

      <div class="ld-section-h">
        ${_filter === 'all' ? 'Tous les leads' : STATUS_LABELS[_filter]?.label || ''}
        <span class="cnt">${filtered.length}</span>
      </div>

      <div class="ld-list">
        ${filtered.length === 0 ? `
          <div class="ld-empty">
            <div class="ld-empty-em">📭</div>
            <div>Aucun lead pour ce filtre.</div>
            <div style="margin-top:6px;opacity:.7">Partage le lien <b style="color:#a5b4fc">permigo.fr</b> pour générer des leads.</div>
          </div>
        ` : filtered.map((l, i) => leadCard(l, i)).join('')}
      </div>

    </div>

    ${_selected ? renderModal() : ''}
  `;

  wire();
  mountNotifBell(_root.querySelector('#ld-bell'));
}

function statCard(key, label, count, active) {
  return `
    <button class="ld-stat ${active ? 'active' : ''}" data-filter="${key}" type="button">
      <div class="lbl">${esc(label)}</div>
      <div class="v">${count}</div>
    </button>
  `;
}

function leadCard(l, idx) {
  const st = STATUS_LABELS[l.status] || STATUS_LABELS.nouveau;
  return `
    <div class="ld-card" data-id="${esc(l.id)}" style="animation-delay:${idx * 35}ms">
      <div class="ld-status" style="background:${st.color}22;border:1px solid ${st.color}55">${st.emoji}</div>
      <div class="ld-body">
        <div class="ld-nm">
          ${esc(l.ecole_nom)}
          <span class="ld-tag" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}55">${st.label}</span>
        </div>
        <div class="ld-meta">
          ${l.ville ? `<span>📍 <b>${esc(l.ville)}</b></span>` : ''}
          ${l.nb_moniteurs ? `<span>👨‍🏫 <b>${l.nb_moniteurs}</b> enseignant${l.nb_moniteurs > 1 ? 's' : ''}</span>` : ''}
          <span>✉️ ${esc(l.email)}</span>
        </div>
      </div>
      <div class="ld-time">${timeAgo(l.created_at)}</div>
    </div>
  `;
}

function renderModal() {
  const l = _selected;
  const st = STATUS_LABELS[l.status] || STATUS_LABELS.nouveau;
  return `
    <div class="ld-modal-bg" id="ld-modal-bg">
      <div class="ld-modal" style="position:relative" onclick="event.stopPropagation()">
        <button class="ld-mclose" id="ld-mclose" type="button">✕</button>
        <h2 class="ld-mtitle">${esc(l.ecole_nom)}</h2>
        <p class="ld-msub">
          <span style="color:${st.color};font-weight:800">${st.emoji} ${st.label}</span>
          · reçu ${timeAgo(l.created_at)}
        </p>

        <div class="ld-mrow"><span class="k">📍 Ville</span><span class="v">${esc(l.ville || '—')}</span></div>
        <div class="ld-mrow"><span class="k">👨‍🏫 Enseignants</span><span class="v">${l.nb_moniteurs || '—'}</span></div>
        <div class="ld-mrow"><span class="k">✉️ Email</span><span class="v"><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></span></div>
        <div class="ld-mrow"><span class="k">📞 Téléphone</span><span class="v">${l.telephone ? `<a href="tel:${esc(l.telephone)}">${esc(l.telephone)}</a>` : '—'}</span></div>
        <div class="ld-mrow"><span class="k">🌐 Source</span><span class="v">${esc(l.source || 'landing')}</span></div>

        ${l.message ? `
          <div class="ld-mmsg">"${esc(l.message)}"</div>
        ` : ''}

        <div class="ld-mactions">
          ${l.status === 'nouveau' ? `<button class="ld-mbtn contacte" data-action="contacte" type="button">📞 Marquer contacté</button>` : ''}
          ${l.status !== 'converti' ? `<button class="ld-mbtn converti" data-action="converti" type="button">✅ Marquer converti</button>` : ''}
          ${l.status !== 'perdu' ? `<button class="ld-mbtn perdu" data-action="perdu" type="button">❌ Marquer perdu</button>` : ''}
          ${l.status !== 'nouveau' ? `<button class="ld-mbtn reset" data-action="nouveau" type="button">↩︎ Remettre en nouveau</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function wire() {
  // Back to dashboard
  _root.querySelector('#ld-back')?.addEventListener('click', async () => {
    const { navigate } = await import('@/router.js');
    navigate('/dashboard');
  });

  // Filter chips
  _root.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      _filter = btn.dataset.filter;
      render();
    });
  });

  // Click card → open modal
  _root.querySelectorAll('.ld-card').forEach(card => {
    card.addEventListener('click', () => {
      _selected = _leads.find(l => l.id === card.dataset.id);
      render();
    });
  });

  // Modal
  _root.querySelector('#ld-modal-bg')?.addEventListener('click', () => {
    _selected = null;
    render();
  });
  _root.querySelector('#ld-mclose')?.addEventListener('click', () => {
    _selected = null;
    render();
  });
  _root.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const newStatus = btn.dataset.action;
      await updateStatus(_selected.id, newStatus);
    });
  });
}

async function updateStatus(id, status) {
  const { error } = await sb
    .from('leads')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.warn('[leads] update error', error);
    toast('Erreur mise à jour', 'error');
    return;
  }

  // Update local state
  const lead = _leads.find(l => l.id === id);
  if (lead) lead.status = status;
  if (_selected?.id === id) _selected.status = status;

  toast(`Marqué "${STATUS_LABELS[status]?.label}"`, 'success');
  render();
}

function timeAgo(iso) {
  if (!iso) return '';
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
