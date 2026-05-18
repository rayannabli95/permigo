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
import { renderEmptyState } from '@/components/empty-state.js';
import { icon } from '@/utils/icons.js';

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
    background: #f8f9fc;
    font-family: 'Inter', sans-serif;
    color: #0a0d1a;
  }

  /* Header */
  .me-hd { margin-bottom: 24px; }
  .me-h1 {
    font: 700 24px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #0a0d1a;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }
  .me-sub {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: #94a3b8;
    margin: 0;
  }

  /* Search */
  .me-search-wrap {
    position: relative;
    margin-bottom: 16px;
  }
  .me-search-ico {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 15px;
    pointer-events: none;
  }
  .me-search {
    width: 100%;
    padding: 12px 12px 12px 40px;
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 12px;
    font: 500 14px/1 'Inter', sans-serif;
    color: #0a0d1a;
    outline: none;
    transition: border-color .15s;
    box-sizing: border-box;
  }
  .me-search::placeholder { color: #94a3b8; }
  .me-search:focus { border-color: #6366f1; }
  .me-search::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }
  .me-search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px; height: 22px;
    border: none;
    background: #e2e6f2;
    border-radius: 50%;
    color: #64748b;
    font-size: 12px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-family: inherit;
    flex-shrink: 0;
  }
  .me-search-clear.visible { display: flex; }

  /* Tabs */
  .me-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: #f0f2f8;
    padding: 4px;
    border-radius: 12px;
  }
  .me-tab {
    flex: 1;
    padding: 8px 4px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font: 600 13px/1 'Inter', sans-serif;
    color: #94a3b8;
    cursor: pointer;
    transition: background .15s, color .15s;
    min-height: 36px;
  }
  .me-tab.active {
    background: #fff;
    color: #6366f1;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }

  /* Liste */
  .me-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Card élève */
  .me-row {
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
    transition: border-color .15s, transform .15s;
    cursor: pointer;
    min-height: 44px;
  }
  .me-row:hover { border-color: #6366f1; }
  .me-row:active { transform: scale(.985); }

  /* Avatar */
  .me-av {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }

  /* Infos */
  .me-info { flex: 1; min-width: 0; }
  .me-nom {
    font: 600 14px/1.2 'Inter', sans-serif;
    color: #0a0d1a;
    margin: 0 0 4px;
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
  .me-meta-count {
    font: 500 11px/1 'Inter', sans-serif;
    color: #94a3b8;
  }

  /* Badge statut */
  .me-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 3px 8px;
    border-radius: 12px;
    flex-shrink: 0;
  }
  .me-badge.actif {
    color: #059669;
    background: rgba(16,185,129,.1);
  }
  .me-badge.inactif {
    color: #94a3b8;
    background: rgba(148,163,184,.1);
  }

  /* Progression REMC */
  .me-prog {
    flex: 1;
    min-width: 60px;
    max-width: 88px;
  }
  .me-prog-bar {
    height: 4px;
    background: #e2e6f2;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  .me-prog-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 2px;
    transition: width .5s ease;
  }
  .me-prog-txt {
    font: 600 11px/1 'Inter', sans-serif;
    color: #94a3b8;
    text-align: right;
  }

  /* Chevron */
  .me-chev {
    color: #94a3b8;
    font-size: 16px;
    flex-shrink: 0;
  }

  /* Empty state */
  .me-empty {
    padding: 48px 20px;
    text-align: center;
    color: #94a3b8;
    font: 500 14px/1.6 'Inter', sans-serif;
  }
  .me-empty-ico {
    font-size: 36px;
    margin-bottom: 12px;
    display: block;
    opacity: .6;
  }

  /* Skeleton */
  .me-skel-list { display: flex; flex-direction: column; gap: 8px; }
  .me-skel-row {
    height: 72px;
    background: #fff;
    border: 1.5px solid #e2e6f2;
    border-radius: 20px;
    animation: skel-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Anti-décrochage */
  .me-relancer-section {
    background: rgba(245,158,11,.06);
    border: 1.5px solid rgba(245,158,11,.25);
    border-radius: 20px;
    padding: 14px 16px;
    margin-bottom: 16px;
    animation: skel-pulse 0s; /* reset */
  }
  .me-relancer-title {
    font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
    color: #b45309;
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .me-relancer-sub {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: #92400e;
    margin: 0;
  }

  /* Badge à relancer inline */
  .me-badge-relancer {
    font: 600 10px/1 'Inter', sans-serif;
    padding: 3px 7px;
    border-radius: 10px;
    color: #b45309;
    background: rgba(245,158,11,.12);
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
</style>`;

const INACTIF_SEUIL_MS = 14 * 86400000; // 14 jours

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = [];       // { id, prenom, nom, acquis, total, actif }
let _query = '';
let _tab = 'tous';      // 'tous' | 'actifs' | 'inactifs' | 'arelancer'
let _drillComp = null;  // competence_id si mode drill bloque_sur

// ─── Entry point ─────────────────────────────────────────────────
export async function unmount() {
  document.querySelector('.me-qm')?.remove();
}

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _query = '';
  _tab = 'tous';
  _drillComp = null;

  // Lire le param bloque_sur depuis le hash URL (#/eleves?bloque_sur=C2a)
  const hash = window.location.hash;
  const qmark = hash.indexOf('?');
  if (qmark >= 0) {
    const params = new URLSearchParams(hash.slice(qmark + 1));
    _drillComp = params.get('bloque_sur') || null;
  }

  track('page.view', { page: 'mes_eleves', role: _me.role, drill: _drillComp || undefined });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <h1 class="me-h1">${_drillComp ? `Élèves bloqués sur ${esc(_drillComp)}` : 'Mes élèves'}</h1>
        <p class="me-sub">Chargement…</p>
      </header>
      <div class="me-skel-list">
        ${[1,2,3,4].map(() => `<div class="me-skel-row"></div>`).join('')}
      </div>
    </div>
  `;

  if (_drillComp) {
    await loadDrillData(_drillComp);
    renderDrill();
  } else {
    await loadData();
    render();
    wire();
  }
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData() {
  // 1. Tous les élèves de mon auto-école (RLS multi-moniteurs : on voit tout le monde)
  //    Côté frontend on marquera ensuite les "attitrés" (enseignant_id = me.id)
  const { data: elevesRaw, error: e1 } = await sb
    .from('profiles')
    .select('id, prenom, nom, credit_heures, enseignant_id, last_active_at, avatar_url')
    .eq('role', 'eleve')
    .order('prenom');

  if (e1) { toast('Impossible de charger les élèves', 'error'); _eleves = []; return; }

  // Tag "attitré" sur chaque élève — affichage UI peut prioriser
  const rawList = (elevesRaw || []).map(e => ({
    ...e,
    isMine: e.enseignant_id === _me.id,
  }));

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

  const now = Date.now();
  _eleves = rawList
    .map((e, i) => {
      const acquis = acquisByEleve[e.id] || 0;
      const actif = (e.credit_heures != null && e.credit_heures > 0) || touchedEleves.has(e.id);
      const lastActive = e.last_active_at ? new Date(e.last_active_at).getTime() : null;
      const aRelancer = actif && (!lastActive || (now - lastActive) >= INACTIF_SEUIL_MS);
      const joursInactif = lastActive ? Math.floor((now - lastActive) / 86400000) : null;
      return { ...e, acquis, total: REMC_TOTAL, actif, idx: i, aRelancer, joursInactif };
    })
    // Mes élèves attitrés en haut, puis ceux que j'ai déjà validé, puis le reste
    .sort((a, b) => {
      if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
      if (touchedEleves.has(a.id) !== touchedEleves.has(b.id)) return touchedEleves.has(a.id) ? -1 : 1;
      return (a.prenom || '').localeCompare(b.prenom || '');
    });
}

// ─── Drill mode : élèves bloqués sur une compétence ──────────────
let _drillEleves = [];

async function loadDrillData(compId) {
  try {
    const { data, error } = await sb.rpc('get_eleves_bloque_sur_competence', {
      p_competence_id: compId,
      p_window_days: 30,
    });
    if (error) throw error;
    _drillEleves = data || [];
  } catch (e) {
    console.error('[mes-eleves] drill load error', e);
    _drillEleves = [];
    toast('Impossible de charger le drill', 'error');
  }
}

function renderDrill() {
  const page = _root.querySelector('.me-page');
  if (!page) return;

  const count = _drillEleves.length;
  page.innerHTML = `
    <header class="me-hd" style="margin-bottom:4px;">
      <div>
        <h1 class="me-h1" style="display:flex;align-items:center;gap:8px;font-size:17px;">
          ${icon('search', { size: 16, strokeWidth: 2.2, color: '#6366f1' })}
          Bloqués sur ${esc(_drillComp)}
        </h1>
        <p class="me-sub">${count} élève${count !== 1 ? 's' : ''} · 30 derniers jours</p>
      </div>
    </header>
    <button class="me-drill-back" id="me-drill-back"
            style="display:flex;align-items:center;gap:6px;margin-bottom:16px;padding:8px 12px;background:#fff;border:1.5px solid #e2e6f2;border-radius:10px;font:600 13px/1 'Inter',sans-serif;color:#6366f1;cursor:pointer;">
      ${icon('arrow-left', { size: 14, strokeWidth: 2.5 })} Voir tous les élèves
    </button>
    <div class="me-list">
      ${count === 0
        ? `<div style="text-align:center;padding:40px 20px;color:#94a3b8;font:500 14px/1.6 'Inter',sans-serif;">
             ${icon('check-circle', { size: 32, strokeWidth: 1.5, color: '#e2e6f2' })}
             <br><br>Aucun élève bloqué sur cette compétence actuellement.
           </div>`
        : _drillEleves.map(e => {
            const nm = esc(`${e.prenom || ''} ${e.nom || ''}`.trim());
            const ava = ((e.prenom || '')[0] || '').toUpperCase() + ((e.nom || '')[0] || '').toUpperCase();
            const grad = AVATARS[(e.prenom || '').charCodeAt(0) % AVATARS.length] || AVATARS[0];
            return `
              <div class="me-row" data-eleve-id="${esc(e.id)}" role="button" tabindex="0">
                <div class="me-ava" style="background:${grad}">${esc(ava || '?')}</div>
                <div class="me-info">
                  <div class="me-name">${nm}</div>
                  <div class="me-meta">
                    ${e.jours_bloque != null ? `<span style="font:500 11px/1 'Inter',sans-serif;color:#dc2626;">Bloqué depuis ${e.jours_bloque}j</span>` : ''}
                  </div>
                </div>
                <div class="me-eleve-chev">${icon('chevron-right', { size: 16, strokeWidth: 2.5, color: '#cbd5e1' })}</div>
              </div>
            `;
          }).join('')
      }
    </div>
  `;

  // Back button
  _root.querySelector('#me-drill-back')?.addEventListener('click', () => {
    navigate('#/eleves');
  });

  // Row click → livret
  _root.querySelectorAll('.me-row[data-eleve-id]').forEach(row => {
    row.addEventListener('click', () => {
      track('drill.eleve.open', { eleve_id: row.dataset.eleveId, comp: _drillComp });
      navigate(`#/livret/${row.dataset.eleveId}`);
    });
  });
}

// ─── Render ──────────────────────────────────────────────────────
function render() {
  const filtered = filterList();
  const total = _eleves.length;
  const actifs = _eleves.filter(e => e.actif).length;
  const inactifs = total - actifs;
  const aRelancerList = _eleves.filter(e => e.aRelancer);

  const relancerSection = aRelancerList.length > 0 ? `
    <div class="me-relancer-section" id="me-relancer-section">
      <p class="me-relancer-title" style="display:flex;align-items:center;gap:6px;">${icon('alert-circle', { size: 15, strokeWidth: 2.2, color: '#b45309' })} ${aRelancerList.length} élève${aRelancerList.length > 1 ? 's' : ''} à relancer cette semaine</p>
      <p class="me-relancer-sub">Sans activité depuis 14 jours ou plus — un point en leçon peut débloquer la progression.</p>
    </div>
  ` : '';

  _root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <h1 class="me-h1">Mes élèves</h1>
        <p class="me-sub">${total} élève${total > 1 ? 's' : ''} · ${actifs} actif${actifs > 1 ? 's' : ''}</p>
      </header>

      ${relancerSection}

      <div class="me-search-wrap">
        <span class="me-search-ico">${icon('search', { size: 15, strokeWidth: 2, color: '#94a3b8' })}</span>
        <input
          class="me-search"
          type="search"
          placeholder="Rechercher un élève…"
          value="${esc(_query)}"
          autocomplete="off"
          aria-label="Rechercher un élève"
        />
        <button class="me-search-clear${_query ? ' visible' : ''}" id="me-search-clear" type="button" aria-label="Effacer la recherche">✕</button>
      </div>

      <div class="me-tabs" role="tablist">
        <button class="me-tab${_tab === 'tous' ? ' active' : ''}" data-tab="tous" role="tab">
          Tous (${total})
        </button>
        <button class="me-tab${_tab === 'actifs' ? ' active' : ''}" data-tab="actifs" role="tab">
          Actifs (${actifs})
        </button>
        <button class="me-tab${_tab === 'arelancer' ? ' active' : ''}" data-tab="arelancer" role="tab"
                style="display:flex;align-items:center;gap:4px;${aRelancerList.length > 0 && _tab !== 'arelancer' ? 'color:#b45309' : ''}">
          ${aRelancerList.length > 0 ? icon('alert-circle', { size: 13, strokeWidth: 2.2 }) : ''}
          À relancer (${aRelancerList.length})
        </button>
      </div>

      <div class="me-list">
        ${filtered.length === 0
          ? (_tab === 'tous' && !_query
              ? renderEmptyState({
                  illustration: '/skins/empty-students-manager-minimal.png',
                  title: 'Aucun élève pour l\'instant',
                  subtitle: 'Vos élèves apparaîtront ici une fois invités par le gérant.',
                })
              : `<div class="me-empty">
                   <span class="me-empty-ico">👥</span>
                   ${_query ? 'Aucun résultat pour <strong>"' + esc(_query) + '"</strong>.' : 'Aucun élève dans cet onglet.'}
                 </div>`)
          : filtered.map(renderRow).join('')
        }
      </div>
    </div>

  `;
}

function filterList() {
  let list = _eleves;

  if (_tab === 'actifs')    list = list.filter(e => e.actif);
  if (_tab === 'inactifs')  list = list.filter(e => !e.actif);
  if (_tab === 'arelancer') list = list.filter(e => e.aRelancer);

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
  const _nomParts = (eleve.nom || '').trim().split(/\s+/);
  const _ini1 = (eleve.prenom || '')[0] || '';
  const _ini2 = _nomParts.length > 1
    ? (_nomParts[_nomParts.length - 1].replace(/\./g, '')[0] || _ini1)
    : (_nomParts[0]?.[1] || _ini1);
  const initials = (_ini1 + _ini2).toUpperCase() || '?';
  const grad = AVATARS[eleve.idx % AVATARS.length];
  const pct = eleve.total > 0 ? Math.round((eleve.acquis / eleve.total) * 100) : 0;
  const fullNom = esc([eleve.prenom, eleve.nom].filter(Boolean).join(' ') || '—');

  return `
    <div class="me-row" data-eleve-id="${esc(eleve.id)}" role="button" tabindex="0"
         aria-label="Fiche de ${fullNom}">
      ${eleve.avatar_url
        ? `<img class="me-av" src="${esc(eleve.avatar_url)}" alt="${fullNom}" loading="lazy" style="object-fit:cover">`
        : `<div class="me-av" style="background:${grad}">${esc(initials || '?')}</div>`
      }

      <div class="me-info">
        <div class="me-nom">
          ${fullNom || '—'}
          ${eleve.isMine ? `<span style="margin-left:6px;display:inline-block;font:700 9px/1 'Inter',sans-serif;padding:3px 6px;border-radius:4px;background:rgba(99,102,241,.12);color:#4f46e5;letter-spacing:.04em;text-transform:uppercase;vertical-align:middle">attitré</span>` : ''}
        </div>
        <div class="me-meta">
          <span class="me-badge ${eleve.actif ? 'actif' : 'inactif'}">
            ${eleve.actif ? 'Actif' : 'Inactif'}
          </span>
          ${eleve.aRelancer ? `
            <span class="me-badge-relancer" style="display:inline-flex;align-items:center;gap:3px;">
              ${icon('alert-circle', { size: 11, strokeWidth: 2.2 })} ${eleve.joursInactif ? `${eleve.joursInactif}j` : 'À relancer'}
            </span>
          ` : ''}
          <span class="me-meta-count">
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
  // Section relancer → filtre tab arelancer
  _root.querySelector('#me-relancer-section')?.addEventListener('click', () => {
    _tab = 'arelancer';
    _root.querySelectorAll('.me-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'arelancer'));
    renderList();
    track('mes_eleves.relancer_section.click');
  });

  // Search
  const searchEl  = _root.querySelector('.me-search');
  const clearBtn  = _root.querySelector('#me-search-clear');
  searchEl?.addEventListener('input', e => {
    _query = e.target.value;
    clearBtn?.classList.toggle('visible', _query.length > 0);
    renderList();
  });
  clearBtn?.addEventListener('click', () => {
    _query = '';
    if (searchEl) searchEl.value = '';
    clearBtn.classList.remove('visible');
    searchEl?.focus();
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

async function wireRows() {
  const { attachSwipe, attachLongPress } = await import('@/utils/gestures.js');
  const { haptic } = await import('@/utils/haptic.js');

  _root.querySelectorAll('.me-row[data-eleve-id]').forEach(row => {
    const id = row.dataset.eleveId;

    // ── Click standard → livret ──
    const handler = () => {
      haptic('tap');
      track('eleve.fiche.open', { eleve_id: id });
      navigate(`#/livret/${id}`);
    };
    row.addEventListener('click', handler);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });

    // ── Swipe right = validation rapide ──
    row.style.transition = 'transform .25s cubic-bezier(.2,.7,.3,1), background .15s';
    attachSwipe(row, {
      threshold: 80,
      follow: (dx) => {
        const clamped = Math.max(0, Math.min(100, dx));
        row.style.transform = `translateX(${clamped}px)`;
        row.style.background = dx > 30 ? 'rgba(99,102,241,.06)' : '';
      },
      onSwipeRight: () => {
        haptic('select');
        track('eleve.swipe_validate', { eleve_id: id });
        navigate(`#/validation?eleveId=${id}`);
      },
      onEnd: () => {
        row.style.transform = '';
        row.style.background = '';
      },
    });

    // ── Long press → menu rapide ──
    attachLongPress(row, {
      holdMs: 480,
      onLongPress: () => {
        track('eleve.longpress_menu', { eleve_id: id });
        openQuickMenu(id, row);
      },
    });
  });
}

/**
 * Mini menu contextuel apparaît sous la ligne au long-press
 */
function openQuickMenu(eleveId, anchorRow) {
  // Retire menu existant
  document.querySelector('.me-qm')?.remove();

  const rect = anchorRow.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'me-qm';
  menu.innerHTML = `
    <style>
      .me-qm-bg {
        position: fixed; inset: 0; z-index: 400;
        background: rgba(10,13,26,.18);
        backdrop-filter: blur(2px);
        animation: meqmIn .15s ease;
      }
      @keyframes meqmIn { from { opacity: 0; } to { opacity: 1; } }
      .me-qm-panel {
        position: fixed; z-index: 401;
        background: #fff;
        border: 1px solid #e2e6f2;
        border-radius: 16px;
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.2);
        padding: 6px;
        min-width: 220px;
        font-family: 'Inter', sans-serif;
        animation: meqmPanel .2s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes meqmPanel { from { opacity: 0; transform: translateY(-4px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @media (prefers-reduced-motion: reduce) { .me-qm-bg, .me-qm-panel { animation: none; } }
      .me-qm-item {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        border-radius: 10px;
        cursor: pointer;
        font: 500 14px/1.2 'Inter', sans-serif;
        color: #0a0d1a;
        background: transparent;
        border: 0;
        width: 100%;
        text-align: left;
      }
      .me-qm-item:hover { background: #f8f9fc; }
      .me-qm-item:active { background: #f0f2f8; }
      .me-qm-ico { font-size: 16px; line-height: 1; }
      .me-qm-item.danger { color: #ef4444; }
    </style>
    <div class="me-qm-bg" data-close="1"></div>
    <div class="me-qm-panel">
      <button class="me-qm-item" data-action="valider">
        <span class="me-qm-ico">${icon('check', { size: 14, strokeWidth: 2.5 })}</span> Valider une compétence
      </button>
      <button class="me-qm-item" data-action="livret">
        <span class="me-qm-ico">${icon('arrow-right', { size: 14, strokeWidth: 2.5 })}</span> Ouvrir le livret REMC
      </button>
    </div>
  `;
  document.body.appendChild(menu);

  // Position du panel sous la row
  const panel = menu.querySelector('.me-qm-panel');
  const top = Math.min(rect.bottom + 8, window.innerHeight - 220);
  const left = Math.min(rect.left + 16, window.innerWidth - 240);
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;

  const close = () => menu.remove();

  menu.querySelector('[data-close]').addEventListener('click', close);
  menu.querySelectorAll('.me-qm-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      close();
      if (action === 'valider') navigate(`#/validation?eleveId=${eleveId}`);
      else if (action === 'livret') navigate(`#/livret/${eleveId}`);
    });
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
    listEl.innerHTML = _tab === 'tous' && !_query
      ? renderEmptyState({
          illustration: '/skins/empty-students-manager-minimal.png',
          title: 'Aucun élève pour l\'instant',
          subtitle: 'Vos élèves apparaîtront ici une fois invités par le gérant.',
        })
      : `<div class="me-empty">
           <span class="me-empty-ico">👥</span>
           ${_query ? 'Aucun résultat pour <strong>"' + esc(_query) + '"</strong>.' : 'Aucun élève dans cet onglet.'}
         </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(renderRow).join('');
  wireRows();
}
