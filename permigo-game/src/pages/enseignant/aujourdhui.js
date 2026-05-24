// ═══════════════════════════════════════════════════════════════
// Enseignant — Aujourd'hui
// KPI du jour + activité récente + mes élèves actifs
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/common/toast.js';
import { esc } from '@/utils/escape.js';
import { track } from '@/services/analytics.js';
import { navigate } from '@/router.js';
import { REMC_TOTAL } from '@/data/remc.js';
import { labelComp } from '@/utils/remc-label.js';
import { statutCfg } from '@/utils/statut-label.js';
import { icon, iconBadge } from '@/utils/icons.js';

// ─── Gradients avatar ─────────────────────────────────────────────
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

// ─── Statuts labels : mapping centralisé @/utils/statut-label.js ──

// ─── CSS ──────────────────────────────────────────────────────────
const STYLE = `<style>
  .aj-page {
    padding: 20px 16px 100px;
    max-width: 600px;
    margin: 0 auto;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
  }

  /* Header */
  .aj-hd { margin-bottom: 24px; }
  .aj-h1 {
    font: 700 26px/1.15 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.025em;
  }
  .aj-date {
    font: 500 13px/1 'Inter', sans-serif;
    color: var(--mu2);
    margin: 0;
    text-transform: capitalize;
  }

  /* Widgets KPI — style Apple Health */
  .aj-widgets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 24px;
  }
  .aj-widget {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 24px;
    padding: 18px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 6px 16px -8px rgba(10,13,26,.08);
    position: relative;
    overflow: hidden;
    animation: ajWidgetIn .5s cubic-bezier(.34,1.56,.64,1) both;
    transition: transform .15s, border-color .15s;
  }
  .aj-widget[role="button"] { cursor: pointer; }
  .aj-widget[role="button"]:active { transform: scale(.97); }
  .aj-widget:nth-child(1) { animation-delay: .05s; }
  .aj-widget:nth-child(2) { animation-delay: .12s; }
  .aj-widget:nth-child(3) { animation-delay: .19s; }
  .aj-widget:nth-child(4) { animation-delay: .26s; }
  @keyframes ajWidgetIn {
    from { opacity: 0; transform: translateY(10px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .aj-widget { animation: none; }
  }
  .aj-widget-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .aj-widget-lbl {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .aj-widget-val {
    font: 700 32px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -0.025em;
    margin: 0;
  }
  .aj-widget-sub {
    font: 500 12px/1.3 'Inter', sans-serif;
    color: var(--mu);
    margin-top: 4px;
  }
  .aj-widget-delta {
    font: 600 12px/1 'Inter', sans-serif;
    color: #10b981;
    margin-top: 6px;
  }
  .aj-widget-delta.down { color: #94a3b8; }

  /* Widget alert state (metric > 0 and needs attention) */
  .aj-widget.aj-widget-alert {
    border-color: rgba(245,158,11,.3);
    background: rgba(245,158,11,.03);
  }

  /* ── Hero « prochaine action » (sobre, mobile-first) ── */
  .aj-hero {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 6px 16px -8px rgba(10,13,26,.08);
    animation: ajWidgetIn .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  .aj-hero-top { display: flex; align-items: flex-start; gap: 14px; }
  .aj-hero-ico {
    width: 44px; height: 44px;
    border-radius: 12px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .aj-hero.tone-warn    .aj-hero-ico { background: rgba(245,158,11,.12); color: #d97706; }
  .aj-hero.tone-ok      .aj-hero-ico { background: rgba(16,185,129,.12); color: #059669; }
  .aj-hero.tone-neutral .aj-hero-ico { background: var(--bg2);           color: #6366f1; }
  .aj-hero-body { flex: 1; min-width: 0; }
  .aj-hero-kicker {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--mu2);
    margin-bottom: 6px;
  }
  .aj-hero-title {
    font: 700 18px/1.25 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.02em;
    margin: 0 0 4px;
  }
  .aj-hero-sub {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: var(--mu);
    margin: 0;
  }
  .aj-hero-cta {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 13px;
    background: #6366f1;
    color: #fff;
    font: 600 14px/1 'Inter', sans-serif;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s, background .12s;
    min-height: 44px;
  }
  .aj-hero-cta:active { transform: scale(.98); }
  .aj-hero-cta:hover { background: #4f46e5; }

  /* ── Stats compactes (remplacent les KPI 2×2 souvent à zéro) ── */
  .aj-quickstats { display: flex; gap: 10px; margin-bottom: 24px; }
  .aj-quickstat {
    flex: 1;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: 14px;
    padding: 12px 14px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04);
  }
  .aj-quickstat-val {
    font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -.02em;
  }
  .aj-quickstat-lbl {
    font: 500 11px/1.3 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 4px;
  }

  /* Section title */
  .aj-section-title {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--mu2);
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .aj-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e6f2;
  }

  /* Section block */
  .aj-section { margin-bottom: 24px; }

  /* Activité récente */
  .aj-activity-list {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
  }
  .aj-act-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bo2);
  }
  .aj-act-row:last-child { border-bottom: none; }

  .aj-act-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .aj-act-info { flex: 1; min-width: 0; }
  .aj-act-name {
    font: 600 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    margin: 0 0 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-act-comp { min-width: 0; }
  .aj-act-comp-label {
    display: block;
    font: 600 13px/1.3 'Inter', sans-serif;
    color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-act-comp-code {
    display: block;
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    margin-top: 2px;
  }
  .aj-act-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }
  .aj-act-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 3px 8px;
    border-radius: 12px;
  }
  .aj-act-time {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
  }

  /* Élèves compacts */
  .aj-eleves-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .aj-eleve-row {
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 20px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
    cursor: pointer;
    transition: border-color .15s, transform .15s;
    min-height: 44px;
  }
  .aj-eleve-row:hover { border-color: #6366f1; }
  .aj-eleve-row:active { transform: scale(.985); }

  .aj-eleve-av {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font: 600 13px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }
  .aj-eleve-nom {
    font: 500 13px/1.2 'Inter', sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aj-eleve-prog {
    font: 600 12px/1 'Inter', sans-serif;
    color: #6366f1;
    flex-shrink: 0;
  }
  .aj-eleve-chev { color: #94a3b8; font-size: 14px; flex-shrink: 0; }

  /* Empty */
  .aj-empty {
    padding: 24px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 13px/1.5 'Inter', sans-serif;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: 20px;
  }

  /* Skeleton */
  .aj-skel { display: flex; flex-direction: column; gap: 16px; padding: 20px 16px; }
  .aj-skel-kpi { height: 90px; background: var(--su); border: 1.5px solid var(--bo); border-radius: 20px; animation: aj-pulse 1.4s ease-in-out infinite; }
  .aj-skel-bloc { height: 160px; background: var(--su); border: 1.5px solid var(--bo); border-radius: 20px; animation: aj-pulse 1.4s ease-in-out infinite; animation-delay: .1s; }
  @keyframes aj-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Widget récap soir */
  .aj-recap {
    background: linear-gradient(135deg, rgba(99,102,241,.06), rgba(139,92,246,.06));
    border: 1.5px solid rgba(99,102,241,.2);
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: border-color .15s, transform .15s;
    animation: ajWidgetIn .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  .aj-recap:active { transform: scale(.985); }
  .aj-recap-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 8px;
  }
  .aj-recap-title {
    font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    flex: 1;
  }
  .aj-recap-kpi {
    font: 700 20px/1 'Plus Jakarta Sans', sans-serif;
    color: #6366f1;
    letter-spacing: -.02em;
  }
  .aj-recap-sub {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: var(--mu);
  }
  .aj-recap-rows { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
  .aj-recap-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 10px;
    background: rgba(255,255,255,.7);
    border-radius: 10px;
    font: 500 12px/1 'Inter', sans-serif;
    color: var(--ink);
  }
  .aj-recap-row-name { flex: 1; }
  .aj-recap-row-dur  { font-weight: 600; color: #6366f1; flex-shrink: 0; }
  .aj-recap-row-status {
    font: 600 10px/1 'Inter', sans-serif;
    padding: 2px 6px;
    border-radius: 8px;
    flex-shrink: 0;
  }
  .aj-recap-row-status.s-confirmed { background: rgba(16,185,129,.1); color: #059669; }
  .aj-recap-row-status.s-pending   { background: rgba(245,158,11,.1); color: #d97706; }
  .aj-recap-row-status.s-refused   { background: rgba(239,68,68,.08); color: #dc2626; }
  .aj-recap-row-status.s-auto      { background: var(--bg2); color: #94a3b8; }

  /* Prompt log si gap */
  .aj-log-prompt {
    background: rgba(99,102,241,.05);
    border: 1.5px dashed rgba(99,102,241,.25);
    border-radius: 20px;
    padding: 14px 16px;
    margin-bottom: 20px;
    cursor: pointer;
    display: flex; align-items: center; gap: 12px;
    transition: border-color .15s, background .15s;
    animation: ajWidgetIn .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  .aj-log-prompt:active { transform: scale(.985); }
  .aj-log-prompt-ico { font-size: 22px; flex-shrink: 0; }
  .aj-log-prompt-txt {
    flex: 1;
    font: 500 13px/1.4 'Inter', sans-serif;
    color: #4b5563;
  }
  .aj-log-prompt-cta {
    font: 700 12px/1 'Inter', sans-serif;
    color: #6366f1;
    flex-shrink: 0;
  }
</style>`;

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatHeure(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function initials(prenom, nom) {
  const p = (prenom || '')[0] || '';
  const parts = (nom || '').trim().replace(/\./g, '').split(/\s+/).filter(Boolean);
  const n = parts.length
    ? (parts[parts.length - 1][0] || '')
    : ((prenom || '').trim()[1] || '');
  return (p + n).toUpperCase() || '?';
}

// ─── Entry point ──────────────────────────────────────────────────
let _ptrCleanup = null;

export async function unmount() {
  if (_ptrCleanup) { _ptrCleanup(); _ptrCleanup = null; }
}

export async function mount(root) {
  const _root = root;
  const _me = getCurUser();
  if (!_me) return;

  track('page.view', { page: 'aujourdhui', role: _me.role });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page">
      <div class="aj-skel">
        <div class="aj-skel-kpi"></div>
        <div class="aj-skel-bloc"></div>
        <div class="aj-skel-bloc"></div>
      </div>
    </div>
  `;

  // ─── Render principal (extrait pour réutilisation au pull-to-refresh) ──
  async function renderAll() {
    await renderInto(root, _me);
  }

  await renderAll();

  // ─── Pull-to-refresh + Live counter ──────────────────────────────────
  const { attachPullToRefresh, animateCounter } = await import('@/utils/gestures.js');

  // PTR : refait le fetch + render avec animation du compteur
  _ptrCleanup?.();
  _ptrCleanup = attachPullToRefresh(document.scrollingElement || document.body, {
    onRefresh: async () => {
      const before = parseInt(root.querySelector('.aj-kpi .aj-kpi-val')?.textContent || '0', 10);
      await renderAll();
      const after = parseInt(root.querySelector('.aj-kpi .aj-kpi-val')?.textContent || '0', 10);
      // Si nouvelles validations détectées, on anime le delta visuellement
      if (after > before) {
        const el = root.querySelector('.aj-kpi .aj-kpi-val');
        if (el) animateCounter(el, before, after, 700);
      }
    },
  });

  return;
}

// ─── Render principal (factorisé pour pull-to-refresh) ─────────────────
async function renderInto(root, _me) {

  // ─── Fetch en parallèle ────────────────────────────────────────
  const today = todayISO();

  const [valsToday, valsAll, elevesAll, consolidRes, todaySessionsRes] = await Promise.all([
    // Validations d'aujourd'hui (faites par moi)
    sb
      .from('validations')
      .select('id, competence_id, statut, eleve_id, validated_at')
      .eq('validated_by', _me.id)
      .gte('validated_at', today + 'T00:00:00.000Z')
      .lte('validated_at', today + 'T23:59:59.999Z')
      .order('validated_at', { ascending: false }),

    // 5 dernières validations (activité récente)
    sb
      .from('validations')
      .select('id, competence_id, statut, eleve_id, validated_at')
      .eq('validated_by', _me.id)
      .order('validated_at', { ascending: false })
      .limit(5),

    // Tous les élèves de l'école (RLS filtre par école automatiquement)
    sb
      .from('profiles')
      .select('id, prenom, nom, last_active_at, enseignant_id')
      .eq('role', 'eleve'),

    // Quiz de consolidation en attente pour mes élèves
    sb
      .from('validations')
      .select('id', { count: 'exact', head: true })
      .eq('validated_by', _me.id)
      .not('consolidation_due_at', 'is', null)
      .lt('consolidation_due_at', new Date().toISOString())
      .is('consolidation_done_at', null),

    // Sessions loggées aujourd'hui (pour le widget récap soir)
    // Note : Supabase rpc ne supporte pas .catch() direct → on wrap dans Promise.resolve
    Promise.resolve(sb.rpc('get_my_today_sessions')).then(r => r).catch(() => ({ data: null })),
  ]);

  if (valsToday.error || valsAll.error) {
    toast('Impossible de charger les données', 'error');
  }

  const todayVals = valsToday.data || [];
  const recentVals = valsAll.data || [];
  const elevesMap = {};
  (elevesAll.data || []).forEach((e, i) => { elevesMap[e.id] = { ...e, idx: i }; });

  // KPI
  const acquisAujourdhui = todayVals.filter(v => v.statut === 'acquis').length;

  // Élèves que j'ai validé au moins une fois (tous statuts)
  const { data: elevesValides } = await sb
    .from('validations')
    .select('eleve_id, competence_id, statut')
    .eq('validated_by', _me.id);

  const tousByEleve = {};
  (elevesValides || []).forEach(v => {
    if (!tousByEleve[v.eleve_id]) tousByEleve[v.eleve_id] = { acquis: 0 };
    if (v.statut === 'acquis') tousByEleve[v.eleve_id].acquis++;
  });

  // Union : élèves directement attitrés (enseignant_id = me) + élèves déjà validés
  // → garantit que les élèves assignés sans validation encore apparaissent quand même
  const mesIds = new Set(
    Object.values(elevesMap)
      .filter(e => e.enseignant_id === _me.id)
      .map(e => e.id)
  );
  for (const id of Object.keys(tousByEleve)) mesIds.add(id);

  const mesElevesActifs = Array.from(mesIds).map(id => ({
    id,
    ...(elevesMap[id] || { prenom: 'Élève', nom: '', idx: 0 }),
    acquis: tousByEleve[id]?.acquis || 0,
  }));

  const nbElevesActifs = mesElevesActifs.length;

  // Consolidations à relancer (quizzes 48h overdue)
  const consolidCount = consolidRes.count ?? 0;

  // Élèves inactifs depuis 7+ jours parmi mes élèves
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const inactifCount = mesElevesActifs.filter(e => {
    const p = elevesMap[e.id];
    return !p?.last_active_at || p.last_active_at < sevenDaysAgo;
  }).length;

  // Élèves à reconnecter : inactifs depuis 14j+ parmi mes élèves suivis
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const reconnectList = mesElevesActifs.filter(e => {
    const p = elevesMap[e.id];
    return !p?.last_active_at || p.last_active_at < fourteenDaysAgo;
  });
  const reconnectCount = reconnectList.length;

  // ─── Hero « prochaine action » — 1 action utile priorisée ──────
  // Priorité : relancer (14j+) → consolidation due → inactifs 7j → faire
  // avancer le prochain élève → fallback démarrage. Ton factuel, pas d'emoji.
  let hero;
  if (reconnectCount > 0) {
    const noms = reconnectList.slice(0, 2).map(e => e.prenom || 'Élève').join(', ');
    hero = {
      tone: 'warn', ico: 'users', kicker: 'À relancer',
      title: `${reconnectCount} élève${reconnectCount > 1 ? 's' : ''} sans activité depuis 14 j`,
      sub: noms ? `Dont ${esc(noms)}${reconnectCount > 2 ? '…' : ''}` : '',
      cta: 'Voir qui relancer', href: '#/eleves?tab=arelancer', ev: 'hero.reconnect',
    };
  } else if (consolidCount > 0) {
    hero = {
      tone: 'warn', ico: 'refresh', kicker: 'Consolidation',
      title: `${consolidCount} quiz à relancer`,
      sub: 'Des acquis attendent leur quiz de consolidation.',
      cta: 'Ouvrir mes élèves', href: '#/eleves', ev: 'hero.consolidation',
    };
  } else if (inactifCount > 0) {
    hero = {
      tone: 'neutral', ico: 'clock', kicker: 'Suivi',
      title: `${inactifCount} élève${inactifCount > 1 ? 's' : ''} inactif${inactifCount > 1 ? 's' : ''} cette semaine`,
      sub: 'Un message peut les remettre en route.',
      cta: 'Voir mes élèves', href: '#/eleves', ev: 'hero.inactifs',
    };
  } else if (nbElevesActifs > 0) {
    // Tout est à jour → proposer de faire avancer l'élève le moins avancé
    const next = mesElevesActifs.slice().sort((a, b) => (a.acquis || 0) - (b.acquis || 0))[0];
    hero = {
      tone: 'ok', ico: 'check', kicker: 'Tout est à jour',
      title: 'Aucune relance en attente',
      sub: next ? `Prochain élève à faire avancer : ${esc(next.prenom || 'Élève')}` : 'Enregistre ta prochaine séance.',
      cta: next ? 'Ouvrir son livret' : 'Enregistrer une séance',
      href: next ? `#/livret/${next.id}` : '#/log-session', ev: 'hero.next_eleve',
    };
  } else {
    hero = {
      tone: 'neutral', ico: 'users', kicker: 'Démarrage',
      title: 'Aucun élève assigné',
      sub: 'Tes élèves apparaîtront ici une fois affectés par le gérant.',
      cta: null, href: null, ev: null,
    };
  }

  const heroHtml = `
    <div class="aj-hero tone-${hero.tone}"${hero.href ? ` id="aj-hero" data-href="${esc(hero.href)}" data-ev="${esc(hero.ev)}"` : ''}>
      <div class="aj-hero-top">
        <div class="aj-hero-ico">${iconBadge(hero.ico, { color: hero.tone === 'warn' ? '#d97706' : hero.tone === 'ok' ? '#059669' : '#6366f1', size: 44 })}</div>
        <div class="aj-hero-body">
          <div class="aj-hero-kicker">${esc(hero.kicker)}</div>
          <h2 class="aj-hero-title">${hero.title}</h2>
          ${hero.sub ? `<p class="aj-hero-sub">${hero.sub}</p>` : ''}
        </div>
      </div>
      ${hero.cta ? `<button class="aj-hero-cta" type="button" id="aj-hero-cta">${esc(hero.cta)} ${icon('chevron-right', { size: 16, strokeWidth: 2.5 })}</button>` : ''}
    </div>`;

  // ─── Widget récap soir ────────────────────────────────────────
  const isEvening = new Date().getHours() >= 18;
  const todaySessions = todaySessionsRes?.data || [];
  const totalSessionMinutes = todaySessions.reduce((s, r) => s + (r.duration_minutes || 0), 0);
  const confirmedCount = todaySessions.filter(r => r.confirmation_status === 'confirmed').length;

  function _fmtMin(min) {
    if (!min) return '0h';
    const h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h${m}`;
  }
  function _statusLabel(s) {
    if (s === 'confirmed') return '<span class="aj-recap-row-status s-confirmed">✓ Confirmée</span>';
    if (s === 'refused')   return '<span class="aj-recap-row-status s-refused">Refusée</span>';
    if (s === 'auto')      return '<span class="aj-recap-row-status s-auto">Auto</span>';
    return '<span class="aj-recap-row-status s-pending">En attente</span>';
  }

  const recapWidget = isEvening && todaySessions.length > 0 ? `
    <div class="aj-recap" id="aj-recap-soir" role="button" tabindex="0" aria-label="Ouvrir le log de session">
      <div class="aj-recap-head">
        <span class="aj-recap-title">Ta journée</span>
        <span class="aj-recap-kpi">${_fmtMin(totalSessionMinutes)}</span>
      </div>
      <div class="aj-recap-sub">${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} enregistrée${todaySessions.length > 1 ? 's' : ''}${confirmedCount > 0 ? ` · ${confirmedCount} confirmée${confirmedCount > 1 ? 's' : ''} par tes élèves` : ''}</div>
      <div class="aj-recap-rows">
        ${todaySessions.map(s => `
          <div class="aj-recap-row">
            <span class="aj-recap-row-name">${esc(s.eleve_prenom || 'Élève')}</span>
            <span class="aj-recap-row-dur">${_fmtMin(s.duration_minutes)}</span>
            ${_statusLabel(s.confirmation_status)}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // ─── Render ───────────────────────────────────────────────────
  root.innerHTML = `
    ${STYLE}
    <div class="aj-page anim-slide-up">

      <header class="aj-hd">
        <h1 class="aj-h1">Aujourd'hui</h1>
        <p class="aj-date">${formatDate(new Date())}</p>
      </header>

      ${recapWidget}

      <!-- Hero : prochaine action utile -->
      ${heroHtml}

      <!-- Stats compactes du jour (factuelles, pas de gros zéros) -->
      <div class="aj-quickstats">
        <div class="aj-quickstat">
          <div class="aj-quickstat-val">${acquisAujourdhui}</div>
          <div class="aj-quickstat-lbl">Validée${acquisAujourdhui > 1 ? 's' : ''} aujourd'hui</div>
        </div>
        <div class="aj-quickstat">
          <div class="aj-quickstat-val">${nbElevesActifs}</div>
          <div class="aj-quickstat-lbl">Élève${nbElevesActifs > 1 ? 's' : ''} suivi${nbElevesActifs > 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="aj-section">
        <div class="aj-section-title">Activité récente</div>
        ${recentVals.length === 0
          ? `<div class="aj-empty" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 20px;">
               <span style="font-size:36px;opacity:.5" aria-hidden="true">📋</span>
               <strong style="font:600 14px/1.2 'Inter',sans-serif;color:var(--ink)">Pas encore de validation</strong>
               <span style="font:500 12px/1.5 'Inter',sans-serif;color:var(--mu2);text-align:center">Enregistre ta première séance<br>pour voir l'activité ici.</span>
             </div>`
          : `<div class="aj-activity-list">
              ${recentVals.map(v => renderActRow(v, elevesMap)).join('')}
            </div>`
        }
      </div>

      <!-- Mes élèves -->
      <div class="aj-section">
        <div class="aj-section-title">Mes élèves</div>
        ${mesElevesActifs.length === 0
          ? `<div class="aj-empty" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 20px;">
               <span style="font-size:36px;opacity:.5" aria-hidden="true">👥</span>
               <strong style="font:600 14px/1.2 'Inter',sans-serif;color:var(--ink)">Aucun élève assigné</strong>
               <span style="font:500 12px/1.5 'Inter',sans-serif;color:var(--mu2);text-align:center">Tes élèves apparaîtront ici<br>une fois affectés par le gérant.</span>
             </div>`
          : `<div class="aj-eleves-list">
              ${mesElevesActifs.map(e => renderEleveRow(e)).join('')}
            </div>`
        }
      </div>

    </div>

  `;

  // Wire listeners
  // Hero « prochaine action » → navigue vers la cible priorisée
  if (hero.href) {
    const goHero = () => {
      track(hero.ev || 'hero.clicked');
      navigate(hero.href);
    };
    root.querySelector('#aj-hero-cta')?.addEventListener('click', goHero);
    root.querySelector('#aj-hero')?.addEventListener('click', (e) => {
      // tap sur la carte (hors bouton, déjà géré) = même action
      if (!e.target.closest('#aj-hero-cta')) goHero();
    });
  }

  // Recap soir / prompt log → page dédiée plein écran
  const goLogSession = () => { track('log_prompt.soir.clicked'); navigate('#/log-session'); };
  root.querySelector('#aj-recap-soir')?.addEventListener('click', goLogSession);

  root.querySelectorAll('.aj-eleve-row[data-eleve-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.eleveId;
      track('eleve.livret.open', { eleve_id: id, from: 'aujourdhui' });
      navigate(`#/livret/${id}`);
    });
  });
}

// ─── Sub-renders ──────────────────────────────────────────────────
function renderActRow(val, elevesMap) {
  const eleve = elevesMap[val.eleve_id] || { prenom: 'Élève', nom: '', idx: 0 };
  const grad = AVATARS[eleve.idx % AVATARS.length];
  const ini = initials(eleve.prenom, eleve.nom);
  const fullNom = esc([eleve.prenom, eleve.nom].filter(Boolean).join(' ') || '—');
  const cfg = statutCfg(val.statut);

  return `
    <div class="aj-act-row">
      <div class="aj-act-av" style="background:${grad}">${esc(ini)}</div>
      <div class="aj-act-info">
        <div class="aj-act-name">${fullNom || '—'}</div>
        <div class="aj-act-comp">
          <span class="aj-act-comp-label">${esc(labelComp(val.competence_id))}</span>
          <span class="aj-act-comp-code">${esc(val.competence_id || '—')}</span>
        </div>
      </div>
      <div class="aj-act-right">
        <span class="aj-act-badge" style="color:${cfg.color}; background:${cfg.bg}">
          ${esc(cfg.label)}
        </span>
        <span class="aj-act-time">${formatHeure(val.validated_at)}</span>
      </div>
    </div>
  `;
}

function renderEleveRow(eleve) {
  const grad = AVATARS[eleve.idx % AVATARS.length];
  const ini = initials(eleve.prenom, eleve.nom);
  const fullNom = esc([eleve.prenom, eleve.nom].filter(Boolean).join(' ') || '—');
  const pct = REMC_TOTAL > 0 ? Math.round((eleve.acquis / REMC_TOTAL) * 100) : 0;

  return `
    <div class="aj-eleve-row" data-eleve-id="${esc(eleve.id)}"
         role="button" tabindex="0" aria-label="Livret de ${fullNom}">
      <div class="aj-eleve-av" style="background:${grad}">${esc(ini)}</div>
      <span class="aj-eleve-nom">${fullNom || '—'}</span>
      <span class="aj-eleve-prog">${eleve.acquis}/${REMC_TOTAL}</span>
      <span class="aj-eleve-chev" aria-hidden="true">›</span>
    </div>
  `;
}
