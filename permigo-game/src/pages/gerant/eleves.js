// ═══════════════════════════════════════════════════════════════
// Gérant — Élèves (light theme)
// Liste élèves + barre progression REMC + tabs + recherche
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';
import { REMC_TOTAL } from '@/data/remc.js';

// ─── CSS scoped ──────────────────────────────────────────────
const STYLE = `<style>
.el-page {
  max-width: 580px;
  margin: 0 auto;
  background: var(--bg);
  padding-bottom: 100px;
  font-family: var(--fb);
}

/* Header */
.el-hd {
  padding: 24px 20px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
}
.el-hd-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.el-title {
  font: 800 22px/1.2 var(--fd);
  color: var(--ink);
  letter-spacing: -0.022em;
}
.el-count {
  font: 700 12px/1 var(--fn);
  color: var(--a);
  background: var(--ap);
  padding: 4px 10px;
  border-radius: 20px;
}

/* Search */
.el-search-wrap {
  margin-top: 14px;
  position: relative;
}
.el-search-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--mu2);
  font-size: 15px;
  pointer-events: none;
}
.el-search {
  width: 100%;
  height: 42px;
  padding: 0 14px 0 36px;
  border: 1px solid var(--bo);
  border-radius: var(--r);
  background: var(--bg);
  color: var(--ink);
  font: 500 14px/1 var(--fb);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.el-search::placeholder { color: var(--mu2); }
.el-search:focus {
  border-color: var(--a);
  box-shadow: 0 0 0 3px var(--ap);
}

/* Tabs */
.el-tabs {
  display: flex;
  gap: 0;
  margin-top: 14px;
  background: var(--bg2);
  border-radius: var(--r);
  padding: 3px;
}
.el-tab {
  flex: 1;
  height: 34px;
  border: none;
  background: transparent;
  color: var(--mu);
  font: 600 13px/1 var(--fb);
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--t), color var(--t), box-shadow var(--t);
}
.el-tab.active {
  background: var(--su);
  color: var(--ink);
  box-shadow: var(--s1);
}

/* Liste */
.el-list {
  padding: 14px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Card eleve */
.el-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--rl);
  padding: 16px;
  box-shadow: var(--s1);
  cursor: pointer;
  transition: box-shadow var(--t), border-color var(--t);
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.el-card:active {
  box-shadow: var(--s0);
}
.el-av {
  width: 44px; height: 44px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 700 16px/1 var(--fd);
  color: #fff;
  flex-shrink: 0;
}
.el-info { flex: 1; min-width: 0; }
.el-name {
  font: 700 15px/1.2 var(--fd);
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Credit heures badge */
.el-hours {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: 600 11px/1 var(--fn);
  color: var(--a);
  background: var(--ap);
  border-radius: 20px;
  padding: 3px 8px;
  margin-top: 4px;
}
.el-hours.zero {
  color: var(--mu2);
  background: var(--bg2);
}

/* REMC progress */
.el-remc {
  margin-top: 10px;
}
.el-remc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}
.el-remc-lbl {
  font: 500 11px/1 var(--fn);
  color: var(--mu);
}
.el-remc-val {
  font: 700 11px/1 var(--fn);
  color: var(--ink);
}
.el-remc-bar {
  height: 5px;
  background: var(--bg2);
  border-radius: 99px;
  overflow: hidden;
}
.el-remc-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--a), var(--adk));
  border-radius: 99px;
  min-width: 4px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}

/* Derniere validation */
.el-last {
  font: 500 11px/1 var(--fn);
  color: var(--mu2);
  margin-top: 6px;
}

/* Vide */
.el-empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--mu2);
  font: 500 13px/1.6 var(--fb);
}
.el-empty-ico { font-size: 36px; margin-bottom: 10px; }

/* Skeleton */
.el-skel {
  background: linear-gradient(90deg, var(--bo2) 0%, var(--bg2) 50%, var(--bo2) 100%);
  background-size: 200% 100%;
  animation: elShimmer 1.4s ease-in-out infinite;
  border-radius: var(--rl);
}
@keyframes elShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
</style>`;

const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
];

// ─── State ───────────────────────────────────────────────────
let _eleves = [];
let _activeTab = 'tous'; // 'tous' | 'actifs'

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== 'gerant') return;

  track('page_view', { page: 'gerant_eleves', user_role: me.role });

  _activeTab = 'tous';

  // Skeleton
  root.innerHTML = `${STYLE}
<div class="el-page anim-slide-up">
  <div class="el-hd">
    <div class="el-hd-top">
      <div class="el-title">Élèves</div>
    </div>
    <div class="el-skel" style="height:42px;margin-top:14px;border-radius:var(--r)"></div>
    <div class="el-skel" style="height:40px;margin-top:10px;border-radius:var(--r)"></div>
  </div>
  <div class="el-list">
    ${[1,2,3].map(() => `<div class="el-skel" style="height:110px"></div>`).join('')}
  </div>
</div>`;

  try {
    // 1. Tous les eleves
    const { data: eleves, error: eErr } = await sb
      .from('profiles')
      .select('id, prenom, nom, credit_heures, created_at')
      .eq('role', 'eleve')
      .order('nom', { ascending: true });

    if (eErr) throw eErr;

    if (!eleves || eleves.length === 0) {
      _eleves = [];
      renderPage(root, []);
      return;
    }

    // 2. Pour chaque eleve : nb validations acquises + derniere validation
    const eleveIds = eleves.map(e => e.id);
    const { data: valsData, error: vErr } = await sb
      .from('validations')
      .select('eleve_id, statut, validated_at')
      .in('eleve_id', eleveIds);

    if (vErr) console.warn('[eleves] validations error', vErr);

    // Calcul par eleve
    const valsByEleve = {};
    (valsData || []).forEach(v => {
      if (!valsByEleve[v.eleve_id]) valsByEleve[v.eleve_id] = { acquis: 0, lastAt: null };
      if (v.statut === 'acquis') valsByEleve[v.eleve_id].acquis++;
      if (v.validated_at) {
        if (!valsByEleve[v.eleve_id].lastAt || v.validated_at > valsByEleve[v.eleve_id].lastAt) {
          valsByEleve[v.eleve_id].lastAt = v.validated_at;
        }
      }
    });

    // Enrichissement eleves
    _eleves = eleves.map(e => ({
      ...e,
      acquisCount: valsByEleve[e.id]?.acquis || 0,
      lastValidatedAt: valsByEleve[e.id]?.lastAt || null,
    }));

    renderPage(root, _eleves);

  } catch (e) {
    console.error('[eleves]', e);
    toast('Erreur de chargement', 'error');
    root.innerHTML = `${STYLE}<div class="el-page"><p style="padding:32px;color:var(--rd)">Erreur de chargement.</p></div>`;
  }
}

// ─── Render page complète ────────────────────────────────────
function renderPage(root, eleves) {
  root.innerHTML = `${STYLE}
<div class="el-page anim-slide-up">
  <div class="el-hd">
    <div class="el-hd-top">
      <div class="el-title">Élèves</div>
      <div class="el-count">${eleves.length} élève${eleves.length > 1 ? 's' : ''}</div>
    </div>
    <div class="el-search-wrap">
      <span class="el-search-ico">🔍</span>
      <input
        id="el-search"
        class="el-search"
        type="search"
        placeholder="Rechercher un élève…"
        autocomplete="off"
        enterkeyhint="search"
      />
    </div>
    <div class="el-tabs" role="tablist">
      <button id="tab-tous"   class="el-tab ${_activeTab === 'tous'   ? 'active' : ''}" role="tab">Tous (${eleves.length})</button>
      <button id="tab-actifs" class="el-tab ${_activeTab === 'actifs' ? 'active' : ''}" role="tab">Actifs</button>
    </div>
  </div>
  <div id="el-list" class="el-list">
    ${renderCards(filterEleves(eleves, _activeTab, ''))}
  </div>
</div>`;

  // Listeners
  const searchInput = root.querySelector('#el-search');
  const listEl = root.querySelector('#el-list');
  const tabTous   = root.querySelector('#tab-tous');
  const tabActifs = root.querySelector('#tab-actifs');

  function refresh() {
    const q = searchInput?.value.trim().toLowerCase() || '';
    listEl.innerHTML = renderCards(filterEleves(eleves, _activeTab, q));
    wireCardClicks(listEl);
  }

  searchInput?.addEventListener('input', refresh);

  tabTous?.addEventListener('click', () => {
    _activeTab = 'tous';
    tabTous.classList.add('active');
    tabActifs.classList.remove('active');
    tabTous.textContent = `Tous (${eleves.length})`;
    refresh();
  });

  tabActifs?.addEventListener('click', () => {
    _activeTab = 'actifs';
    tabActifs.classList.add('active');
    tabTous.classList.remove('active');
    refresh();
  });

  // Tab actifs : mettre a jour le compteur
  const actifCount = eleves.filter(isActif).length;
  if (tabActifs) tabActifs.textContent = `Actifs (${actifCount})`;

  wireCardClicks(listEl);
}

// ─── Filtrage ────────────────────────────────────────────────
function filterEleves(eleves, tab, query) {
  let list = eleves;
  if (tab === 'actifs') list = list.filter(isActif);
  if (query) {
    list = list.filter(e => {
      const full = `${e.prenom || ''} ${e.nom || ''}`.toLowerCase();
      return full.includes(query);
    });
  }
  return list;
}

function isActif(e) {
  // Actif = credit_heures > 0 ou validation dans les 30 jours
  if ((e.credit_heures || 0) > 0) return true;
  if (e.lastValidatedAt) {
    const diff = Date.now() - new Date(e.lastValidatedAt).getTime();
    return diff <= 30 * 86_400_000;
  }
  return false;
}

// ─── Render cards ────────────────────────────────────────────
function renderCards(eleves) {
  if (eleves.length === 0) {
    return `<div class="el-empty">
      <div class="el-empty-ico">🎓</div>
      Aucun élève trouvé
    </div>`;
  }

  return eleves.map((e, i) => {
    const initials = initials2(e.prenom, e.nom);
    const gradient = AVATARS[i % AVATARS.length];
    const fullName = e.nom || e.prenom || '—';
    const heures = e.credit_heures ?? 0;
    const pct = REMC_TOTAL > 0 ? Math.round((e.acquisCount / REMC_TOTAL) * 100) : 0;
    const lastLabel = e.lastValidatedAt
      ? `Dernière validation ${relativeTime(e.lastValidatedAt)}`
      : 'Pas encore commencé';

    return `
    <div class="el-card" data-id="${esc(e.id)}">
      <div class="el-av" style="background:${gradient}">${esc(initials)}</div>
      <div class="el-info">
        <div class="el-name">${esc(fullName)}</div>
        <div class="el-hours ${heures === 0 ? 'zero' : ''}">
          ${heures}h crédit${heures > 1 ? 's' : ''}
        </div>
        <div class="el-remc">
          <div class="el-remc-row">
            <span class="el-remc-lbl">Parcours REMC</span>
            <span class="el-remc-val">${e.acquisCount}/${REMC_TOTAL}</span>
          </div>
          <div class="el-remc-bar">
            <div class="el-remc-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="el-last">${esc(lastLabel)}</div>
      </div>
    </div>`;
  }).join('');
}

// ─── Wire clics cards ────────────────────────────────────────
function wireCardClicks(container) {
  container.querySelectorAll('.el-card').forEach(card => {
    card.addEventListener('click', () => {
      toast('Fiche élève disponible en V2', 'info');
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────
function initials2(prenom, nom) {
  const p = (prenom || '').trim()[0] || '';
  const parts = (nom || '').trim().split(/\s+/);
  const n = parts.length > 1
    ? (parts[parts.length - 1].replace(/\./g, '')[0] || p)
    : (parts[0]?.[1] || p);
  return (p + n).toUpperCase() || '?';
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}
