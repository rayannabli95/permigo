// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes élèves
// Liste filtrée + progression REMC par élève
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { REMC_TOTAL } from '@/data/remc.js';

// ─── Gradients avatar (8 couleurs cycliques) ─────────────────────
const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#a16207,#713f12)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
  'linear-gradient(135deg,#059669,#064e3b)',
];

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
  .me-page {
    padding: 20px 16px 100px;
    max-width: 600px;
    margin: 0 auto;
    font-family: var(--fb);
  }

  /* Header */
  .me-hd { margin-bottom: 20px; }
  .me-h1 {
    font: 800 24px/1.2 var(--fd);
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }
  .me-sub {
    font: 500 13px/1.4 var(--fb);
    color: var(--mu);
    margin: 0;
  }

  /* Search */
  .me-search-wrap {
    position: relative;
    margin-bottom: 14px;
  }
  .me-search-ico {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--mu);
    font-size: 15px;
    pointer-events: none;
  }
  .me-search {
    width: 100%;
    padding: 11px 12px 11px 38px;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r);
    font: 500 14px/1 var(--fb);
    color: var(--ink);
    outline: none;
    transition: border-color var(--t), box-shadow var(--t);
    box-sizing: border-box;
  }
  .me-search::placeholder { color: var(--mu2); }
  .me-search:focus {
    border-color: var(--a);
    box-shadow: 0 0 0 3px var(--ap);
  }

  /* Tabs */
  .me-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    background: var(--bg2);
    padding: 4px;
    border-radius: var(--r);
  }
  .me-tab {
    flex: 1;
    padding: 8px 4px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font: 600 13px/1 var(--fb);
    color: var(--mu);
    cursor: pointer;
    transition: background var(--t), color var(--t), box-shadow var(--t);
    min-height: 36px;
  }
  .me-tab.active {
    background: var(--su);
    color: var(--a);
    box-shadow: var(--s0);
  }

  /* Liste */
  .me-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Card élève */
  .me-row {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--rl);
    padding: 13px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--s0);
    transition: transform .2s, border-color .15s, box-shadow .2s;
    cursor: pointer;
    min-height: 44px;
  }
  .me-row:hover {
    border-color: var(--a);
    box-shadow: var(--s1);
    transform: translateY(-2px);
  }
  .me-row:active { transform: scale(.985); }

  /* Avatar */
  .me-av {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 700 14px/1 var(--fd);
    color: #fff;
    flex-shrink: 0;
    letter-spacing: 0;
  }

  /* Infos */
  .me-info { flex: 1; min-width: 0; }
  .me-nom {
    font: 700 14px/1.2 var(--fd);
    color: var(--ink);
    margin: 0 0 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .me-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Badge statut */
  .me-badge {
    font: 600 11px/1 var(--fn);
    padding: 3px 8px;
    border-radius: 20px;
    flex-shrink: 0;
  }
  .me-badge.actif {
    color: var(--gr);
    background: var(--grp);
  }
  .me-badge.inactif {
    color: var(--mu);
    background: var(--bg2);
  }

  /* Progression REMC */
  .me-prog {
    flex: 1;
    min-width: 60px;
    max-width: 100px;
  }
  .me-prog-bar {
    height: 5px;
    background: var(--bo);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 3px;
  }
  .me-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--a), #8b5cf6);
    border-radius: 99px;
    transition: width .5s ease;
  }
  .me-prog-txt {
    font: 600 11px/1 var(--fn);
    color: var(--mu);
    text-align: right;
  }

  /* Chevron */
  .me-chev {
    color: var(--mu2);
    font-size: 16px;
    flex-shrink: 0;
  }

  /* Empty state */
  .me-empty {
    padding: 48px 20px;
    text-align: center;
    color: var(--mu);
    font: 500 14px/1.6 var(--fb);
  }
  .me-empty-ico {
    font-size: 36px;
    margin-bottom: 12px;
    display: block;
    opacity: .6;
  }

  /* Skeleton */
  .me-skel-list { display: flex; flex-direction: column; gap: 10px; }
  .me-skel-row {
    height: 72px;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--rl);
    animation: skel-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
</style>`;

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = [];       // { id, prenom, nom, acquis, total, actif }
let _query = '';
let _tab = 'tous';      // 'tous' | 'actifs' | 'inactifs'

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _query = '';
  _tab = 'tous';

  track('page.view', { page: 'mes_eleves', role: _me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <h1 class="me-h1">Mes élèves</h1>
        <p class="me-sub">Chargement…</p>
      </header>
      <div class="me-skel-list">
        ${[1,2,3,4].map(() => `<div class="me-skel-row"></div>`).join('')}
      </div>
    </div>
  `;

  await loadData();
  render();
  wire();
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData() {
  // 1. Tous les élèves (scope : auto_ecole de l'enseignant ou liés via validations)
  const { data: elevesRaw, error: e1 } = await sb
    .from('profiles')
    .select('id, prenom, nom, credit_heures')
    .eq('role', 'eleve')
    .order('prenom');

  if (e1) { toast('Impossible de charger les élèves', 'error'); _eleves = []; return; }

  const rawList = elevesRaw || [];

  // 2. Mes validations groupées par eleve_id (statut acquis uniquement)
  const { data: valsRaw } = await sb
    .from('validations')
    .select('eleve_id, statut')
    .eq('validated_by', _me.id);

  // Map : eleve_id → count acquis
  const acquisByEleve = {};
  (valsRaw || []).forEach(v => {
    if (!acquisByEleve[v.eleve_id]) acquisByEleve[v.eleve_id] = 0;
    if (v.statut === 'acquis') acquisByEleve[v.eleve_id]++;
  });

  // Set des élèves que j'ai validé au moins une fois
  const touchedEleves = new Set(Object.keys(acquisByEleve));

  _eleves = rawList.map((e, i) => {
    const acquis = acquisByEleve[e.id] || 0;
    const actif = (e.credit_heures != null && e.credit_heures > 0) || touchedEleves.has(e.id);
    return { ...e, acquis, total: REMC_TOTAL, actif, idx: i };
  });
}

// ─── Render ──────────────────────────────────────────────────────
function render() {
  const filtered = filterList();
  const total = _eleves.length;
  const actifs = _eleves.filter(e => e.actif).length;
  const inactifs = total - actifs;

  _root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <h1 class="me-h1">Mes élèves</h1>
        <p class="me-sub">${total} élève${total > 1 ? 's' : ''} · ${actifs} actif${actifs > 1 ? 's' : ''}</p>
      </header>

      <div class="me-search-wrap">
        <span class="me-search-ico">🔍</span>
        <input
          class="me-search"
          type="search"
          placeholder="Rechercher un élève…"
          value="${esc(_query)}"
          autocomplete="off"
          aria-label="Rechercher un élève"
        />
      </div>

      <div class="me-tabs" role="tablist">
        <button class="me-tab${_tab === 'tous' ? ' active' : ''}" data-tab="tous" role="tab">
          Tous (${total})
        </button>
        <button class="me-tab${_tab === 'actifs' ? ' active' : ''}" data-tab="actifs" role="tab">
          Actifs (${actifs})
        </button>
        <button class="me-tab${_tab === 'inactifs' ? ' active' : ''}" data-tab="inactifs" role="tab">
          Inactifs (${inactifs})
        </button>
      </div>

      <div class="me-list">
        ${filtered.length === 0
          ? `<div class="me-empty">
               <span class="me-empty-ico">👥</span>
               ${_query ? 'Aucun résultat pour <strong>"' + esc(_query) + '"</strong>.' : 'Aucun élève dans cet onglet.'}
             </div>`
          : filtered.map(renderRow).join('')
        }
      </div>
    </div>
  `;
}

function filterList() {
  let list = _eleves;

  if (_tab === 'actifs') list = list.filter(e => e.actif);
  if (_tab === 'inactifs') list = list.filter(e => !e.actif);

  if (_query.trim()) {
    const q = _query.toLowerCase().trim();
    list = list.filter(e =>
      (e.prenom || '').toLowerCase().includes(q) ||
      (e.nom || '').toLowerCase().includes(q)
    );
  }

  return list;
}

function renderRow(eleve) {
  const initials = ((eleve.prenom?.[0] || '') + (eleve.nom?.[0] || '')).toUpperCase();
  const grad = AVATARS[eleve.idx % AVATARS.length];
  const pct = eleve.total > 0 ? Math.round((eleve.acquis / eleve.total) * 100) : 0;
  const fullNom = [esc(eleve.prenom || ''), esc(eleve.nom || '')].filter(Boolean).join(' ');

  return `
    <div class="me-row" data-eleve-id="${esc(eleve.id)}" role="button" tabindex="0"
         aria-label="Fiche de ${fullNom}">
      <div class="me-av" style="background:${grad}">${esc(initials || '?')}</div>

      <div class="me-info">
        <div class="me-nom">${fullNom || '—'}</div>
        <div class="me-meta">
          <span class="me-badge ${eleve.actif ? 'actif' : 'inactif'}">
            ${eleve.actif ? 'Actif' : 'Inactif'}
          </span>
          <span style="font:500 11px/1 var(--fn); color:var(--mu);">
            ${eleve.acquis} validation${eleve.acquis > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div class="me-prog">
        <div class="me-prog-bar">
          <div class="me-prog-fill" style="width:${pct}%"></div>
        </div>
        <div class="me-prog-txt">${eleve.acquis}/${eleve.total}</div>
      </div>

      <span class="me-chev" aria-hidden="true">›</span>
    </div>
  `;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire() {
  // Search
  const searchEl = _root.querySelector('.me-search');
  searchEl?.addEventListener('input', e => {
    _query = e.target.value;
    renderList();
  });

  // Tabs
  _root.querySelectorAll('.me-tab').forEach(btn =>
    btn.addEventListener('click', () => {
      _tab = btn.dataset.tab;
      _root.querySelectorAll('.me-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderList();
    })
  );

  // Cards
  wireRows();
}

function wireRows() {
  _root.querySelectorAll('.me-row[data-eleve-id]').forEach(row => {
    const handler = () => {
      const id = row.dataset.eleveId;
      track('eleve.fiche.open', { eleve_id: id });
      navigate(`#/livret/${id}`);
    };
    row.addEventListener('click', handler);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

// ─── Partial re-render liste uniquement (sans recréer toute la page) ──
function renderList() {
  const listEl = _root?.querySelector('.me-list');
  if (!listEl) return;

  const filtered = filterList();
  const total = _eleves.length;
  const actifs = _eleves.filter(e => e.actif).length;
  const inactifs = total - actifs;

  // Mettre à jour les tabs count (les boutons eux-mêmes)
  _root.querySelectorAll('.me-tab').forEach(btn => {
    const tab = btn.dataset.tab;
    if (tab === 'tous') btn.textContent = `Tous (${total})`;
    if (tab === 'actifs') btn.textContent = `Actifs (${actifs})`;
    if (tab === 'inactifs') btn.textContent = `Inactifs (${inactifs})`;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="me-empty">
      <span class="me-empty-ico">👥</span>
      ${_query ? 'Aucun résultat pour <strong>"' + esc(_query) + '"</strong>.' : 'Aucun élève dans cet onglet.'}
    </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(renderRow).join('');
  wireRows();
}
