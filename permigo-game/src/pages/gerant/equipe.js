// ═══════════════════════════════════════════════════════════════
// Gérant — Équipe (light theme)
// Liste enseignants + stats ce mois + recherche
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';

// ─── CSS scoped ──────────────────────────────────────────────
const STYLE = `<style>
.eq-page {
  max-width: 580px;
  margin: 0 auto;
  background: var(--bg);
  padding-bottom: 100px;
  font-family: var(--fb);
}

/* Header */
.eq-hd {
  padding: 24px 20px 16px;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
}
.eq-hd-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.eq-title {
  font: 800 22px/1.2 var(--fd);
  color: var(--ink);
  letter-spacing: -0.022em;
}
.eq-count {
  font: 700 12px/1 var(--fn);
  color: var(--a);
  background: var(--ap);
  padding: 4px 10px;
  border-radius: 20px;
}

/* Search */
.eq-search-wrap {
  margin-top: 14px;
  position: relative;
}
.eq-search-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--mu2);
  font-size: 15px;
  pointer-events: none;
}
.eq-search {
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
.eq-search::placeholder { color: var(--mu2); }
.eq-search:focus {
  border-color: var(--a);
  box-shadow: 0 0 0 3px var(--ap);
}

/* Liste */
.eq-list {
  padding: 14px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Card enseignant */
.eq-card {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: var(--rl);
  padding: 16px;
  box-shadow: var(--s1);
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.eq-av {
  width: 46px; height: 46px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 700 17px/1 var(--fd);
  color: #fff;
  flex-shrink: 0;
}
.eq-info { flex: 1; min-width: 0; }
.eq-name {
  font: 700 15px/1.2 var(--fd);
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eq-email {
  font: 500 12px/1 var(--fn);
  color: var(--mu);
  margin-top: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.eq-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.eq-stat {
  font: 600 12px/1 var(--fn);
  color: var(--mu);
  background: var(--bg2);
  border: 1px solid var(--bo2);
  border-radius: 8px;
  padding: 4px 9px;
}
.eq-stat strong {
  color: var(--ink);
  font-weight: 700;
}
.eq-badge {
  font: 700 11px/1 var(--fb);
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: .2px;
}
.eq-badge.actif {
  color: var(--gr);
  background: var(--grp);
}
.eq-badge.inactif {
  color: var(--mu2);
  background: var(--bg2);
  border: 1px solid var(--bo);
}

/* Bouton ajouter */
.eq-add-wrap {
  padding: 20px 16px 0;
}
.eq-add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border: 1.5px dashed var(--bo);
  border-radius: var(--rl);
  background: transparent;
  color: var(--mu);
  font: 600 14px/1 var(--fb);
  cursor: pointer;
  transition: border-color var(--t), background var(--t), color var(--t);
}
.eq-add-btn:hover {
  border-color: var(--a);
  background: var(--ap);
  color: var(--a);
}
.eq-add-ico { font-size: 18px; }

/* Vide / pas de résultat */
.eq-empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--mu2);
  font: 500 13px/1.6 var(--fb);
}
.eq-empty-ico { font-size: 36px; margin-bottom: 10px; }

/* Skeleton */
.eq-skel {
  background: linear-gradient(90deg, var(--bo2) 0%, var(--bg2) 50%, var(--bo2) 100%);
  background-size: 200% 100%;
  animation: eqShimmer 1.4s ease-in-out infinite;
  border-radius: var(--rl);
}
@keyframes eqShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
</style>`;

const AVATARS = [
  'linear-gradient(135deg,#5b5bd6,#3a3a8e)',
  'linear-gradient(135deg,#0891b2,#155e75)',
  'linear-gradient(135deg,#7c3aed,#4c1d95)',
  'linear-gradient(135deg,#0e7c66,#064e3b)',
  'linear-gradient(135deg,#9333ea,#6b21a8)',
  'linear-gradient(135deg,#dc2626,#7f1d1d)',
];

// ─── Entry point ─────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== 'gerant') return;

  track('page_view', { page: 'gerant_equipe', user_role: me.role });

  // Skeleton
  root.innerHTML = `${STYLE}
<div class="eq-page anim-slide-up">
  <div class="eq-hd">
    <div class="eq-hd-top">
      <div class="eq-title">Équipe</div>
    </div>
    <div class="eq-skel" style="height:42px;margin-top:14px;border-radius:var(--r)"></div>
  </div>
  <div class="eq-list">
    ${[1,2,3].map(() => `<div class="eq-skel" style="height:100px"></div>`).join('')}
  </div>
</div>`;

  try {
    const startOfMonth = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    ).toISOString();

    // Fetch enseignants + validations ce mois
    const [teachersRes, valsRes] = await Promise.all([
      sb.from('profiles')
        .select('id, prenom, nom, email, created_at')
        .eq('role', 'enseignant')
        .order('nom', { ascending: true }),
      sb.from('validations')
        .select('validated_by, eleve_id')
        .gte('validated_at', startOfMonth)
        .not('validated_by', 'is', null),
    ]);

    if (teachersRes.error) throw teachersRes.error;

    const teachers = teachersRes.data || [];
    const vals = valsRes.data || [];

    // Calcul stats par enseignant
    const teacherStats = {};
    vals.forEach(v => {
      if (!v.validated_by) return;
      if (!teacherStats[v.validated_by]) {
        teacherStats[v.validated_by] = { valCount: 0, eleveIds: new Set() };
      }
      teacherStats[v.validated_by].valCount++;
      if (v.eleve_id) teacherStats[v.validated_by].eleveIds.add(v.eleve_id);
    });

    render(root, teachers, teacherStats);

  } catch (e) {
    console.error('[equipe]', e);
    toast('Erreur de chargement', 'error');
    root.innerHTML = `${STYLE}<div class="eq-page"><p style="padding:32px;color:var(--rd)">Erreur de chargement.</p></div>`;
  }
}

// ─── Render + filtrage reactif ────────────────────────────────
function render(root, teachers, teacherStats) {
  root.innerHTML = `${STYLE}
<div class="eq-page anim-slide-up">
  <div class="eq-hd">
    <div class="eq-hd-top">
      <div class="eq-title">Équipe</div>
      <div class="eq-count">${teachers.length} enseignant${teachers.length > 1 ? 's' : ''}</div>
    </div>
    <div class="eq-search-wrap">
      <span class="eq-search-ico">🔍</span>
      <input
        id="eq-search"
        class="eq-search"
        type="search"
        placeholder="Rechercher un enseignant…"
        autocomplete="off"
        enterkeyhint="search"
      />
    </div>
  </div>

  <div id="eq-list" class="eq-list">
    ${renderCards(teachers, teacherStats)}
  </div>

  <div class="eq-add-wrap">
    <button id="eq-add-btn" class="eq-add-btn">
      <span class="eq-add-ico">+</span>
      Ajouter un enseignant
    </button>
  </div>
</div>`;

  // Recherche en temps reel
  const searchInput = root.querySelector('#eq-search');
  const listEl = root.querySelector('#eq-list');

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q === ''
      ? teachers
      : teachers.filter(t => {
          const full = `${t.prenom || ''} ${t.nom || ''} ${t.email || ''}`.toLowerCase();
          return full.includes(q);
        });
    listEl.innerHTML = renderCards(filtered, teacherStats);
  });

  // Bouton ajouter
  root.querySelector('#eq-add-btn')?.addEventListener('click', () => {
    toast('Contactez le support pour ajouter un enseignant', 'info');
  });
}

function renderCards(teachers, teacherStats) {
  if (teachers.length === 0) {
    return `<div class="eq-empty">
      <div class="eq-empty-ico">👥</div>
      Aucun enseignant trouvé
    </div>`;
  }

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return teachers.map((t, i) => {
    const initials = initials2(t.prenom, t.nom);
    const gradient = AVATARS[i % AVATARS.length];
    const stats = teacherStats[t.id] || { valCount: 0, eleveIds: new Set() };
    const actif = stats.valCount > 0;
    const fullName = t.nom || t.prenom || '—';

    return `
    <div class="eq-card">
      <div class="eq-av" style="background:${gradient}">${esc(initials)}</div>
      <div class="eq-info">
        <div class="eq-name">${esc(fullName)}</div>
        <div class="eq-email">${esc(t.email || '—')}</div>
        <div class="eq-stats">
          <div class="eq-stat"><strong>${stats.valCount}</strong> valid. ${esc(monthLabel)}</div>
          <div class="eq-stat"><strong>${stats.eleveIds.size}</strong> élève${stats.eleveIds.size > 1 ? 's' : ''}</div>
          <span class="eq-badge ${actif ? 'actif' : 'inactif'}">${actif ? 'Actif' : 'Inactif'}</span>
        </div>
      </div>
    </div>`;
  }).join('');
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
