// ═══════════════════════════════════════════════════════════════
// Gérant — Élèves (light theme)
// Liste élèves + barre progression REMC + tabs + recherche
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { icon } from '@/utils/icons.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/common/toast.js';
import { track } from '@/services/analytics.js';
import { REMC_TOTAL } from '@/data/remc.js';

// ─── CSS scoped (cohérent avec pulse/equipe — cockpit gérant) ────
const STYLE = `<style>
.el-page {
  max-width: 580px;
  margin: 0 auto;
  background: var(--bg);
  padding-bottom: 100px;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
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
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  letter-spacing: -0.022em;
}
.el-count {
  font: 600 12px/1 'Inter', sans-serif;
  color: var(--a);
  background: color-mix(in srgb, var(--a) 10%, transparent);
  padding: 6px 12px;
  border-radius: var(--r-full);
}

/* Search */
.el-search-wrap {
  margin-top: 16px;
  position: relative;
}
.el-search-ico {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--mu2);
  font-size: 15px;
  pointer-events: none;
}
.el-search {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 40px;
  border: 1px solid var(--bo);
  border-radius: var(--r);
  background: var(--bg);
  color: var(--ink);
  font: 500 14px/1 'Inter', sans-serif;
  outline: none;
  box-sizing: border-box;
  transition: border-color .15s ease, background .15s ease;
}
.el-search::placeholder { color: var(--mu2); }
.el-search:focus {
  border-color: var(--a);
  background: var(--su);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 12%, transparent);
}

/* Tabs */
.el-tabs {
  display: flex;
  gap: 0;
  margin-top: 16px;
  background: var(--bg2);
  border-radius: var(--r);
  padding: 4px;
}
.el-tab {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--mu);
  font: 600 13px/1 'Inter', sans-serif;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background .15s ease, color .15s ease, box-shadow .15s ease;
}
.el-tab.active {
  background: var(--su);
  color: var(--ink);
  box-shadow: var(--s0);
}

/* Liste */
.el-list {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Card eleve */
.el-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--r-xl);
  padding: 20px;
  box-shadow: var(--s0);
  cursor: pointer;
  transition: border-color .15s ease;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.el-card:hover { border-color: var(--a); }
.el-card:active { transform: scale(.99); }
.el-av {
  width: 44px; height: 44px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 600 16px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  flex-shrink: 0;
  background: var(--a);
}
.el-info { flex: 1; min-width: 0; }
.el-name {
  font: 600 15px/1.3 'Inter', sans-serif;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Credit heures badge */
.el-hours {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--a);
  background: color-mix(in srgb, var(--a) 10%, transparent);
  border-radius: var(--r-full);
  padding: 4px 10px;
  margin-top: 6px;
}
.el-hours.zero {
  color: var(--mu2);
  background: var(--bg);
}

/* REMC progress */
.el-remc {
  margin-top: 12px;
}
.el-remc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.el-remc-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
}
.el-remc-val {
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--ink);
}
.el-remc-bar {
  height: 4px;
  background: var(--bo3);
  border-radius: var(--r-full);
  overflow: hidden;
}
.el-remc-fill {
  height: 100%;
  background: var(--a);
  border-radius: var(--r-full);
  min-width: 4px;
  transition: width 1s var(--ease-out);
}

/* Derniere validation */
.el-last {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--mu2);
  margin-top: 8px;
}

/* Vide */
.el-empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--mu2);
  font: 500 13px/1.6 'Inter', sans-serif;
  background: var(--su);
  border: 1px dashed var(--bo);
  border-radius: var(--r);
  margin: 16px;
}
.el-empty-ico { font-size: 36px; margin-bottom: 10px; }

/* Skeleton */
.el-skel {
  background: linear-gradient(90deg, var(--bg2) 0%, var(--bo) 50%, var(--bg2) 100%);
  background-size: 200% 100%;
  animation: elShimmer 1.4s ease-in-out infinite;
  border-radius: var(--r-xl);
}
@keyframes elShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
</style>`;

const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,var(--blk),#155e75)',
  'linear-gradient(135deg,var(--puk),#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,var(--rdk),#7f1d1d)',
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
      .select('id, prenom, nom, created_at')
      .eq('role', 'eleve')
      .order('prenom', { ascending: true });

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
      <span class="el-search-ico">${icon('search',{size:16})}</span>
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
      <div class="el-empty-ico">${icon('graduation-cap',{size:30})}</div>
      Aucun élève trouvé
    </div>`;
  }

  return eleves.map((e, i) => {
    const initials = initials2(e.prenom, e.nom);
    const gradient = AVATARS[i % AVATARS.length];
    const fullName = [e.prenom, e.nom].filter(Boolean).join(' ') || '—';
    const pct = REMC_TOTAL > 0 ? Math.round((e.acquisCount / REMC_TOTAL) * 100) : 0;
    const lastLabel = e.lastValidatedAt
      ? `Dernière validation ${relativeTime(e.lastValidatedAt)}`
      : 'Pas encore commencé';

    return `
    <div class="el-card" data-id="${esc(e.id)}">
      <div class="el-av" style="background:${gradient}">${esc(initials)}</div>
      <div class="el-info">
        <div class="el-name">${esc(fullName)}</div>
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
    card.addEventListener('click', async () => {
      const id = card.dataset.id;
      if (!id) return;
      try {
        // Navigation vers le livret REMC de l'élève (déjà existant côté enseignant — réutilisé pour gérant)
        const { navigate } = await import('@/router.js');
        navigate(`/livret/${id}`);
      } catch (e) {
        console.warn('[eleves] navigate failed', e);
        // Fallback : ouvre quick view inline
        openQuickView(id, card);
      }
    });
  });
}

// Quick view fallback si la nav livret est cassée
async function openQuickView(eleveId, anchorCard) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:elqvIn .2s ease;';
  overlay.innerHTML = `
    <style>
      @keyframes elqvIn { from { opacity:0; } to { opacity:1; } }
      .elqv-card { width:100%; max-width:420px; background:var(--su); border-radius:var(--rx); padding:24px; font-family:'Inter',sans-serif; }
      .elqv-card h3 { font:800 18px/1.2 'Plus Jakarta Sans',sans-serif; color:var(--ink); margin:0 0 10px; }
      .elqv-row { display:flex; justify-content:space-between; padding:10px 0; border-top:1px solid var(--bo); font:500 13px/1.4 'Inter',sans-serif; }
      .elqv-row:first-of-type { border-top:0; }
      .elqv-row .l { color:var(--mu); }
      .elqv-row .v { color:var(--ink); font-weight:700; }
      .elqv-btn { width:100%; margin-top:16px; padding:14px; background:var(--a); color:#fff; border:0; border-radius:var(--r-md); font:700 14px/1 'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:transform .12s; }
      .elqv-btn:active { transform: scale(.97); }
    </style>
    <div class="elqv-card">
      <h3>Vue rapide élève</h3>
      <div id="elqv-body" style="color:var(--mu2);font-size:13px">Chargement…</div>
      <button class="elqv-btn" id="elqv-close">Fermer</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#elqv-close').addEventListener('click', close);

  try {
    const [profileRes, validRes] = await Promise.all([
      sb.from('profiles').select('prenom, nom, email, last_active_at').eq('id', eleveId).maybeSingle(),
      sb.from('validations').select('competence_id').eq('eleve_id', eleveId).eq('statut', 'acquis'),
    ]);
    const p = profileRes.data;
    const v = validRes.data || [];
    const body = overlay.querySelector('#elqv-body');
    if (!p) {
      body.innerHTML = '<div style="color:var(--rd)">Élève introuvable.</div>';
      return;
    }
    body.innerHTML = `
      <div class="elqv-row"><span class="l">Nom</span><span class="v">${esc(p.nom || p.prenom || '—')}</span></div>
      <div class="elqv-row"><span class="l">Email</span><span class="v" style="font-size:12px">${esc(p.email || '—')}</span></div>
      <div class="elqv-row"><span class="l">Compétences</span><span class="v">${v.length}/${REMC_TOTAL}</span></div>
      <div class="elqv-row"><span class="l">Dernière activité</span><span class="v">${p.last_active_at ? relativeTime(p.last_active_at) : 'jamais'}</span></div>
    `;
  } catch (e) {
    overlay.querySelector('#elqv-body').innerHTML = '<div style="color:var(--rd)">Erreur lors du chargement.</div>';
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function initials2(prenom, nom) {
  const p = (prenom || '').trim()[0] || '';
  // Initiale prénom + initiale du nom (dernier mot du nom).
  // Fallback : 2e lettre du prénom si pas de nom.
  const parts = (nom || '').trim().replace(/\./g, '').split(/\s+/).filter(Boolean);
  const n = parts.length
    ? (parts[parts.length - 1][0] || '')
    : ((prenom || '').trim()[1] || '');
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
