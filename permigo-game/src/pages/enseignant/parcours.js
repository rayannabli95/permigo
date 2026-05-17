// ═══════════════════════════════════════════════════════════════
// Enseignant — Parcours pro / carrière moniteur
// ADN : Linear, pas Duolingo. Subtil, factuel, motivant.
// Sections :
//   1. Card profil + niveau + barre XP
//   2. La Route (timeline 50 niveaux avec position actuelle = volant)
//   3. Prochain palier (next unlock utile : PDF, stats, templates...)
//   4. Ma cohorte (5 élèves actifs swipeables)
//   5. Cette semaine (mini-stats)
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { esc } from '@/utils/escape.js';
import { toast } from '@/components/toast.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { getMoniteurState, MONITEUR_LEVELS } from '@/data/moniteur-levels.js';
import { animateCounter } from '@/utils/gestures.js';
import { haptic } from '@/utils/haptic.js';

const XP_PER_VALIDATION = 25;

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
.epc {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 100px;
  background: #f8f9fc;
  font-family: 'Inter', sans-serif;
  color: #0a0d1a;
}

/* Header sticky */
.epc-hd {
  position: sticky;
  top: calc(52px + env(safe-area-inset-top, 0px));
  z-index: 10;
  background: rgba(248,249,252,.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e2e6f2;
}
.epc-h1 {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -0.022em;
  margin: 0;
}
.epc-sub {
  font: 500 12px/1 'Inter', sans-serif;
  color: #94a3b8;
  margin: 4px 0 0;
}

/* ── Section 1 : Profil card ── */
.epc-prof {
  margin: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.epc-prof-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.epc-av {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: #6366f1;
  display: flex; align-items: center; justify-content: center;
  font: 700 18px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  flex-shrink: 0;
}
.epc-prof-info { flex: 1; min-width: 0; }
.epc-prof-lvl {
  font: 600 11px/1 'Inter', sans-serif;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.epc-prof-title-big {
  font: 700 22px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -0.022em;
}

.epc-xp {
  margin-top: 14px;
}
.epc-xp-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}
.epc-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.epc-xp-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font: 500 11px/1 'Inter', sans-serif;
  color: #94a3b8;
}
.epc-xp-meta strong { color: #0a0d1a; font-weight: 600; }

/* ── Section 2 : Route timeline ── */
.epc-section-title {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin: 24px 20px 12px;
}
.epc-route {
  margin: 0 16px;
  padding: 24px 8px 16px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.epc-route::-webkit-scrollbar { height: 4px; }
.epc-route::-webkit-scrollbar-track { background: transparent; }
.epc-route::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.epc-route-track {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0;
  min-width: max-content;
  padding: 30px 12px 8px;
}
/* Ligne horizontale continue derrière */
.epc-route-track::before {
  content: '';
  position: absolute;
  top: 50px;
  left: 28px;
  right: 28px;
  height: 3px;
  background: linear-gradient(90deg, #10b981 0%, #6366f1 var(--prog,30%), #e2e8f0 var(--prog,30%), #e2e8f0 100%);
  border-radius: 99px;
  z-index: 0;
}
.epc-stop {
  position: relative;
  z-index: 1;
  width: 72px;
  flex-shrink: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.epc-stop-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border: 2.5px solid #e2e8f0;
  font-size: 16px;
  line-height: 1;
  transition: transform .2s;
}
.epc-stop.done .epc-stop-icon-wrap {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}
.epc-stop.now .epc-stop-icon-wrap {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 5px rgba(99,102,241,.18);
  width: 44px; height: 44px;
  padding: 4px;
}
.epc-stop.now .epc-stop-icon-wrap img {
  width: 100%; height: 100%;
  object-fit: contain;
  animation: epcWheelOsc 1.8s ease-in-out infinite;
  transform-origin: 50% 50%;
}
@keyframes epcWheelOsc {
  0%,100% { transform: rotate(-20deg); }
  50%     { transform: rotate(20deg); }
}
.epc-stop.locked .epc-stop-icon-wrap {
  opacity: .55;
}
.epc-stop-lvl {
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
}
.epc-stop-lbl {
  font: 500 9.5px/1.2 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .04em;
  min-height: 12px;
}
.epc-stop.now .epc-stop-lvl { color: #6366f1; }
.epc-stop.now .epc-stop-lbl { color: #6366f1; font-weight: 600; }

/* ── Section 3 : Prochain palier ── */
.epc-next {
  margin: 12px 16px;
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(99,102,241,.05), rgba(139,92,246,.05));
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 20px;
}
.epc-next-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.epc-next-ico {
  font-size: 22px;
  line-height: 1;
}
.epc-next-lbl {
  font: 600 10px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6366f1;
}
.epc-next-name {
  font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #0a0d1a;
  letter-spacing: -0.01em;
  margin: 0 0 4px;
}
.epc-next-desc {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: #64748b;
  margin: 0 0 12px;
}
.epc-next-prog {
  height: 5px;
  background: rgba(99,102,241,.15);
  border-radius: 99px;
  overflow: hidden;
}
.epc-next-prog-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 99px;
}
.epc-next-eta {
  font: 500 11px/1 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 6px;
  text-align: right;
}

/* ── Section 4 : Cohorte ── */
.epc-cohort {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.epc-cohort::-webkit-scrollbar { display: none; }
.epc-cohort-card {
  flex-shrink: 0;
  width: 110px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 16px;
  padding: 14px 10px 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color .12s ease, transform .12s ease;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.epc-cohort-card:hover { border-color: #6366f1; }
.epc-cohort-card:active { transform: scale(.97); }
.epc-cohort-av {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: #6366f1;
  margin: 0 auto 8px;
  display: flex; align-items: center; justify-content: center;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.epc-cohort-nom {
  font: 600 12px/1.2 'Inter', sans-serif;
  color: #0a0d1a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px;
}
.epc-cohort-prog {
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  color: #6366f1;
  letter-spacing: -0.01em;
}
.epc-cohort-prog small {
  font: 500 10px/1 'Inter', sans-serif;
  color: #94a3b8;
}

/* ── Section 5 : Cette semaine ── */
.epc-week {
  margin: 12px 16px 0;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.epc-week-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.epc-week-ico {
  font-size: 18px;
  line-height: 1;
  width: 32px;
  text-align: center;
}
.epc-week-txt {
  font: 500 13px/1.3 'Inter', sans-serif;
  color: #0a0d1a;
  flex: 1;
}
.epc-week-txt strong { font-weight: 700; }

/* Skeleton */
.epc-skel {
  background: linear-gradient(90deg, #f0f2f8 0%, #e4e8f4 50%, #f0f2f8 100%);
  background-size: 200% 100%;
  animation: epcShim 1.4s ease-in-out infinite;
  border-radius: 20px;
}
@keyframes epcShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .epc-stop.now .epc-stop-icon-wrap img,
  .epc-xp-fill, .epc-next-prog-fill { animation: none !important; transition: none !important; }
}
</style>`;

// ─── State ──────────────────────────────────────────────────────
let _root = null;
let _me = null;

// ─── Entry point ────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me || _me.role !== 'enseignant') return;

  track('page.view', { page: 'enseignant_parcours' });

  // Skeleton
  root.innerHTML = `${STYLE}
    <div class="epc">
      <div class="epc-hd">
        <h1 class="epc-h1">Mon parcours</h1>
        <p class="epc-sub">Chargement…</p>
      </div>
      <div class="epc-skel" style="height:140px;margin:16px"></div>
      <div class="epc-skel" style="height:120px;margin:16px"></div>
      <div class="epc-skel" style="height:80px;margin:16px"></div>
    </div>`;

  // ─── Fetch tout en parallèle ──────────────────────────────────
  const [validationsRes, profileRes] = await Promise.all([
    sb.from('validations')
      .select('id, eleve_id, statut, validated_at')
      .eq('validated_by', _me.id)
      .order('validated_at', { ascending: false }),
    sb.from('profiles')
      .select('prenom, nom, xp')
      .eq('id', _me.id)
      .maybeSingle(),
  ]);

  if (validationsRes.error) {
    toast('Impossible de charger ton parcours', 'error');
    return;
  }

  const allVals = validationsRes.data || [];
  const me = profileRes.data || {};

  // ─── Calcul XP du moniteur ────────────────────────────────────
  // Utilise la colonne xp si elle est peuplée, sinon dérive du count (25 XP par validation)
  const totalValidations = allVals.length;
  const xp = me.xp || (totalValidations * XP_PER_VALIDATION);
  const state = getMoniteurState(xp);

  // ─── Stats cette semaine ──────────────────────────────────────
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14);

  const valsThisWeek = allVals.filter(v => new Date(v.validated_at) >= weekStart);
  const valsLastWeek = allVals.filter(v => {
    const d = new Date(v.validated_at);
    return d >= lastWeekStart && d < weekStart;
  });
  const elevesThisWeek = new Set(valsThisWeek.map(v => v.eleve_id)).size;

  let trendLabel = '';
  if (valsLastWeek.length > 0) {
    const delta = Math.round(((valsThisWeek.length - valsLastWeek.length) / valsLastWeek.length) * 100);
    if (delta > 0) trendLabel = `+${delta}% vs semaine dernière`;
    else if (delta === 0) trendLabel = 'stable vs semaine dernière';
    // Pas d'affichage si négatif (no-shame)
  }

  // ─── Cohorte : top 5 élèves les plus actifs (validations récentes) ────
  const byEleve = {};
  allVals.forEach(v => {
    if (!v.eleve_id) return;
    if (!byEleve[v.eleve_id]) byEleve[v.eleve_id] = { id: v.eleve_id, count: 0, acquis: 0, lastAt: v.validated_at };
    byEleve[v.eleve_id].count++;
    if (v.statut === 'acquis') byEleve[v.eleve_id].acquis++;
    if (new Date(v.validated_at) > new Date(byEleve[v.eleve_id].lastAt)) {
      byEleve[v.eleve_id].lastAt = v.validated_at;
    }
  });
  const topEleves = Object.values(byEleve)
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
    .slice(0, 5);

  let elevesProfiles = [];
  if (topEleves.length > 0) {
    const ids = topEleves.map(e => e.id);
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, prenom, nom')
      .in('id', ids);
    elevesProfiles = (profiles || []).map(p => {
      const stat = byEleve[p.id];
      return { ...p, acquis: stat.acquis };
    });
    // Conserve l'ordre du tri
    elevesProfiles.sort((a, b) =>
      ids.indexOf(a.id) - ids.indexOf(b.id)
    );
  }

  // ─── Stops à afficher sur la route ────────────────────────────
  // 6 stops visibles autour du niveau actuel + on inclut les paliers utiles (5,10,15,20,25,30…)
  const stops = buildRouteStops(state);

  // ─── Render final ─────────────────────────────────────────────
  const prenom = me.prenom || '';
  const nom = me.nom || '';
  const initials = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';

  root.innerHTML = `${STYLE}
    <div class="epc anim-slide-up">

      <div class="epc-hd">
        <h1 class="epc-h1">Mon parcours pro</h1>
        <p class="epc-sub">${totalValidations} validation${totalValidations > 1 ? 's' : ''} cumulées</p>
      </div>

      <!-- Profil + barre XP -->
      <div class="epc-prof">
        <div class="epc-prof-row">
          <div class="epc-av">${esc(initials)}</div>
          <div class="epc-prof-info">
            <div class="epc-prof-lvl">Niveau ${state.current.level}</div>
            <div class="epc-prof-title-big">${esc(state.current.title)}</div>
          </div>
        </div>
        <div class="epc-xp">
          <div class="epc-xp-bar">
            <div class="epc-xp-fill" style="width:${state.pctInLevel}%"></div>
          </div>
          <div class="epc-xp-meta">
            <span><strong>${xp}</strong> XP</span>
            <span>${state.next ? `${state.xpToNext} XP avant Niveau ${state.next.level}` : 'Niveau max atteint 💎'}</span>
          </div>
        </div>
      </div>

      <!-- Route -->
      <div class="epc-section-title">Ma route</div>
      <div class="epc-route" id="epc-route">
        <div class="epc-route-track" style="--prog:${routeProgress(stops, state)}%">
          ${stops.map(s => renderStop(s, state)).join('')}
        </div>
      </div>

      <!-- Prochain palier -->
      ${state.nextUnlock ? `
      <div class="epc-next">
        <div class="epc-next-hd">
          <span class="epc-next-ico">${esc(state.nextUnlock.icon)}</span>
          <span class="epc-next-lbl">Prochain palier</span>
        </div>
        <h3 class="epc-next-name">Niv ${state.nextUnlock.level} · ${esc(state.nextUnlock.name)}</h3>
        <p class="epc-next-desc">${esc(state.nextUnlock.desc)}</p>
        <div class="epc-next-prog">
          <div class="epc-next-prog-fill" style="width:${unlockPct(xp, state.nextUnlock.level)}%"></div>
        </div>
        <div class="epc-next-eta">
          ${state.xpUntilNextUnlock > 0
            ? `${state.xpUntilNextUnlock} XP restants · ~${Math.ceil(state.xpUntilNextUnlock / XP_PER_VALIDATION)} validations`
            : 'Débloqué bientôt !'}
        </div>
      </div>` : ''}

      <!-- Ma cohorte -->
      ${elevesProfiles.length > 0 ? `
      <div class="epc-section-title">Ma cohorte</div>
      <div class="epc-cohort">
        ${elevesProfiles.map(e => {
          const ini = ((e.prenom || '')[0] || '') + ((e.nom || '')[0] || '');
          return `
            <div class="epc-cohort-card" data-eleve-id="${esc(e.id)}">
              <div class="epc-cohort-av">${esc(ini.toUpperCase() || '?')}</div>
              <div class="epc-cohort-nom">${esc(e.prenom || e.nom || '—')}</div>
              <div class="epc-cohort-prog">${e.acquis}<small>/${REMC_TOTAL}</small></div>
            </div>
          `;
        }).join('')}
      </div>` : ''}

      <!-- Cette semaine -->
      <div class="epc-section-title">Cette semaine</div>
      <div class="epc-week">
        <div class="epc-week-row">
          <span class="epc-week-ico">📊</span>
          <span class="epc-week-txt"><strong data-counter="${valsThisWeek.length}">0</strong> validation${valsThisWeek.length > 1 ? 's' : ''} · <strong>${elevesThisWeek}</strong> élève${elevesThisWeek > 1 ? 's' : ''}</span>
        </div>
        ${trendLabel ? `
        <div class="epc-week-row">
          <span class="epc-week-ico">📈</span>
          <span class="epc-week-txt">${esc(trendLabel)}</span>
        </div>` : ''}
      </div>

    </div>`;

  // ─── Wire ─────────────────────────────────────────────────────
  // Scroll auto vers le stop "now" sur la route
  const route = root.querySelector('#epc-route');
  const nowStop = root.querySelector('.epc-stop.now');
  if (route && nowStop) {
    setTimeout(() => {
      const offset = nowStop.offsetLeft - (route.clientWidth / 2) + (nowStop.clientWidth / 2);
      route.scrollTo({ left: offset, behavior: 'smooth' });
    }, 300);
  }

  // Anime le compteur "validations cette semaine"
  setTimeout(() => {
    const el = root.querySelector('[data-counter]');
    if (el) animateCounter(el, 0, parseInt(el.dataset.counter, 10) || 0, 900);
  }, 200);

  // Tap card élève → ouvre son livret
  root.querySelectorAll('.epc-cohort-card[data-eleve-id]').forEach(card => {
    card.addEventListener('click', () => {
      haptic('select');
      const id = card.dataset.eleveId;
      track('parcours.eleve.open', { eleve_id: id });
      navigate(`#/livret/${id}`);
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Sélectionne les stops à afficher sur la route (autour du niveau actuel + paliers utiles).
 */
function buildRouteStops(state) {
  const lv = state.current.level;
  // Stops "obligatoires" : tous les paliers d'unlock + niveau actuel
  const must = new Set([1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, lv]);
  // Plus 1 niveau avant et 1 après le current
  if (lv > 1) must.add(lv - 1);
  if (lv < 50) must.add(lv + 1);
  const sorted = [...must].sort((a, b) => a - b);
  return sorted.map(level => MONITEUR_LEVELS[level - 1]);
}

function renderStop(stop, state) {
  const lv = state.current.level;
  let cls = 'todo';
  if (stop.level < lv) cls = 'done';
  else if (stop.level === lv) cls = 'now';
  else if (stop.level > lv + 5) cls = 'locked';
  // Le node "now" affiche le volant
  const inner = cls === 'now'
    ? `<img src="/worlds/volant.png" alt="" aria-hidden="true" />`
    : cls === 'done' ? '✓'
    : stop.unlock ? stop.unlock.icon
    : '';
  const label = stop.unlock ? stop.unlock.name.split(' ')[0] : '';
  return `
    <div class="epc-stop ${cls}">
      <div class="epc-stop-icon-wrap">${inner}</div>
      <div class="epc-stop-lvl">N${stop.level}</div>
      <div class="epc-stop-lbl">${esc(label || (cls === 'now' ? 'Toi' : ''))}</div>
    </div>
  `;
}

function routeProgress(stops, state) {
  const lv = state.current.level;
  const idx = stops.findIndex(s => s.level === lv);
  if (idx < 0) return 0;
  return Math.round(((idx + (state.pctInLevel / 100)) / Math.max(1, stops.length - 1)) * 100);
}

function unlockPct(xp, targetLevel) {
  if (targetLevel <= 0) return 100;
  const target = MONITEUR_LEVELS[targetLevel - 1];
  const prev = MONITEUR_LEVELS[Math.max(0, targetLevel - 2)];
  if (!target) return 100;
  const span = target.threshold - prev.threshold;
  if (span <= 0) return 100;
  const done = xp - prev.threshold;
  return Math.max(0, Math.min(100, Math.round((done / span) * 100)));
}
