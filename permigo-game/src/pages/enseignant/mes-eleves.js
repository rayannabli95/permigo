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

  /* CTA flottant */
  .me-cta {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    background: rgba(248,249,252,.95);
    border-top: 1px solid #e2e6f2;
    backdrop-filter: blur(10px);
  }
  .me-cta-btn {
    width: 100%;
    max-width: 600px;
    display: block;
    margin: 0 auto;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: #fff;
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    transition: transform .15s, opacity .15s;
    min-height: 48px;
  }
  .me-cta-btn:active { transform: scale(.98); opacity: .9; }

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

// ─── Entry point ─────────────────────────────────────────────────
export async function unmount() {
  const { unmountFab } = await import('@/components/fab.js');
  unmountFab();
  document.querySelector('.me-qm')?.remove();
}

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

  // FAB : raccourci validation rapide
  const { mountFab } = await import('@/components/fab.js');
  mountFab({
    icon: '+',
    label: 'Valider une compétence',
    onClick: () => {
      track('cta.valider_competence', { from: 'mes_eleves_fab' });
      navigate('#/validation');
    },
  });
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData() {
  // 1. Tous les élèves de mon auto-école (RLS multi-moniteurs : on voit tout le monde)
  //    Côté frontend on marquera ensuite les "attitrés" (enseignant_id = me.id)
  const { data: elevesRaw, error: e1 } = await sb
    .from('profiles')
    .select('id, prenom, nom, credit_heures, enseignant_id, last_active_at')
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

// ─── Render ──────────────────────────────────────────────────────
function render() {
  const filtered = filterList();
  const total = _eleves.length;
  const actifs = _eleves.filter(e => e.actif).length;
  const inactifs = total - actifs;
  const aRelancerList = _eleves.filter(e => e.aRelancer);

  const relancerSection = aRelancerList.length > 0 ? `
    <div class="me-relancer-section" id="me-relancer-section">
      <p class="me-relancer-title">⚠️ ${aRelancerList.length} élève${aRelancerList.length > 1 ? 's' : ''} à relancer cette semaine</p>
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
        ${aRelancerList.length > 0 ? `
        <button class="me-tab${_tab === 'arelancer' ? ' active' : ''}" data-tab="arelancer" role="tab"
                style="${_tab !== 'arelancer' ? 'color:#b45309' : ''}">
          ⚠️ (${aRelancerList.length})
        </button>
        ` : `
        <button class="me-tab${_tab === 'inactifs' ? ' active' : ''}" data-tab="inactifs" role="tab">
          Inactifs (${inactifs})
        </button>
        `}
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

    <div class="me-cta">
      <button class="me-cta-btn" id="me-btn-valider">+ Valider une compétence</button>
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
  const fullNom = esc(eleve.nom || eleve.prenom || '—');

  return `
    <div class="me-row" data-eleve-id="${esc(eleve.id)}" role="button" tabindex="0"
         aria-label="Fiche de ${fullNom}">
      <div class="me-av" style="background:${grad}">${esc(initials || '?')}</div>

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
            <span class="me-badge-relancer">
              ⚠ ${eleve.joursInactif ? `${eleve.joursInactif}j` : 'À relancer'}
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
  // CTA
  _root.querySelector('#me-btn-valider')?.addEventListener('click', () => {
    track('cta.valider_competence', { from: 'mes_eleves' });
    navigate('#/validation');
  });

  // Section relancer → filtre tab arelancer
  _root.querySelector('#me-relancer-section')?.addEventListener('click', () => {
    _tab = 'arelancer';
    _root.querySelectorAll('.me-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'arelancer'));
    renderList();
    track('mes_eleves.relancer_section.click');
  });

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

    // ── Swipe right = validation rapide, swipe left = livret ──
    // Visual follow : on translate la row pendant le drag
    row.style.transition = 'transform .25s cubic-bezier(.2,.7,.3,1), background .15s';
    attachSwipe(row, {
      threshold: 80,
      follow: (dx) => {
        // Clamp visual
        const clamped = Math.max(-100, Math.min(100, dx));
        row.style.transform = `translateX(${clamped}px)`;
        row.style.background = dx > 30 ? 'rgba(99,102,241,.06)'
                              : dx < -30 ? 'rgba(16,185,129,.06)'
                              : '';
      },
      onSwipeRight: () => {
        haptic('select');
        track('eleve.swipe_validate', { eleve_id: id });
        navigate(`#/validation?eleveId=${id}`);
      },
      onSwipeLeft: () => {
        haptic('select');
        track('eleve.swipe_livret', { eleve_id: id });
        navigate(`#/livret/${id}`);
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
        <span class="me-qm-ico">✓</span> Valider une compétence
      </button>
      <button class="me-qm-item" data-action="livret">
        <span class="me-qm-ico">→</span> Ouvrir le livret REMC
      </button>
      <button class="me-qm-item" data-action="note">
        <span class="me-qm-ico">📝</span> Ajouter une note rapide
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
      else if (action === 'note') {
        // Placeholder pour future feature notes
        import('@/components/toast.js').then(({ toast }) => {
          toast('Notes rapides : bientôt 📝', 'info', 2500);
        });
      }
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
