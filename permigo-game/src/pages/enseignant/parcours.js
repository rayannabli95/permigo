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
import { getMoniteurState, buildTimelineStops, MONITEUR_TIERS } from '@/data/moniteur-levels.js';
import { animateCounter } from '@/utils/gestures.js';
import { haptic } from '@/utils/haptic.js';
import { icon, iconBadge } from '@/utils/icons.js';

function iconForUnlock(iconName) {
  return iconName || 'sparkle';
}

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

/* ── Section title ── */
.epc-section-title {
  font: 600 11px/1 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin: 24px 20px 12px;
}

/* ── HÉRO : Prochaine récompense (la motivation) ── */
.epc-hero {
  margin: 16px;
  padding: 24px;
  background: linear-gradient(160deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 28px;
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px -10px rgba(99,102,241,.4), 0 6px 16px -8px rgba(10,13,26,.1);
  animation: epcHeroIn .55s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes epcHeroIn {
  from { opacity: 0; transform: translateY(12px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.epc-hero::before {
  content: '';
  position: absolute;
  top: -30%; right: -20%;
  width: 70%; height: 140%;
  background: radial-gradient(ellipse, rgba(255,255,255,.18) 0%, transparent 60%);
  pointer-events: none;
}
.epc-hero-lbl {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,.78);
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}
.epc-hero-row {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}
.epc-hero-icon {
  width: 60px; height: 60px;
  border-radius: 18px;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.25);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.epc-hero-info { flex: 1; min-width: 0; }
.epc-hero-level {
  font: 600 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
  margin-bottom: 4px;
}
.epc-hero-name {
  font: 700 19px/1.2 'Plus Jakarta Sans', sans-serif;
  margin: 0 0 6px;
  letter-spacing: -0.022em;
}
.epc-hero-desc {
  font: 500 12.5px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.8);
  margin: 0;
}
.epc-hero-prog {
  margin-top: 18px;
  position: relative;
  z-index: 1;
}
.epc-hero-prog-bar {
  height: 8px;
  background: rgba(255,255,255,.2);
  border-radius: 99px;
  overflow: hidden;
}
.epc-hero-prog-fill {
  height: 100%;
  background: #fff;
  border-radius: 99px;
  transition: width 1s cubic-bezier(.2,.7,.3,1);
}
.epc-hero-prog-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font: 500 11.5px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.85);
}

/* ── MA ROUTE : timeline VERTICALE ── */
.epc-route {
  margin: 0 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e6f2;
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04), 0 1px 3px rgba(10,13,26,.06);
}
.epc-stop {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  position: relative;
}
.epc-stop:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: -10px;
  width: 2px;
  background: #e2e8f0;
}
.epc-stop.done:not(:last-child)::before { background: #10b981; }
.epc-stop-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #fff;
  border: 2.5px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  z-index: 1;
  color: #94a3b8;
}
.epc-stop.done .epc-stop-dot {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}
.epc-stop.now .epc-stop-dot {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,.2);
  width: 44px; height: 44px;
  padding: 4px;
  margin-left: -4px;
}
.epc-stop.now .epc-stop-dot img {
  width: 100%; height: 100%;
  object-fit: contain;
  animation: epcWheelOsc 1.8s ease-in-out infinite;
  transform-origin: 50% 50%;
}
@keyframes epcWheelOsc {
  0%,100% { transform: rotate(-20deg); }
  50%     { transform: rotate(20deg); }
}
.epc-stop.locked .epc-stop-dot { opacity: .5; }
.epc-stop-body { flex: 1; min-width: 0; padding: 2px 0; }
.epc-stop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.epc-stop-lvl {
  font: 700 11px/1 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.epc-stop.now .epc-stop-lvl { color: #6366f1; }
.epc-stop.done .epc-stop-lvl { color: #10b981; }

/* Coût XP — la nouvelle info clé */
.epc-stop-cost {
  font: 600 11px/1 'Inter', sans-serif;
  padding: 4px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.epc-stop-cost.done {
  color: #059669;
  background: rgba(16,185,129,.12);
}
.epc-stop-cost.now {
  color: #fff;
  background: #6366f1;
}
.epc-stop-cost.todo {
  color: #64748b;
  background: #f0f2f8;
}
.epc-stop-cost em {
  font-style: normal;
  font-weight: 500;
  color: #94a3b8;
}

.epc-stop-title {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: #0a0d1a;
  margin-bottom: 6px;
}
.epc-stop.locked .epc-stop-title { color: #94a3b8; }
.epc-stop.done .epc-stop-title { color: #64748b; }

/* Récompense débloquée */
.epc-stop-reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(99,102,241,.08);
  border: 1px solid rgba(99,102,241,.2);
  border-radius: 10px;
  color: #6366f1;
  margin-top: 4px;
}
.epc-stop-reward.unlocked {
  background: rgba(16,185,129,.08);
  border-color: rgba(16,185,129,.2);
  color: #059669;
}
.epc-stop-reward-ico { display: flex; align-items: center; flex-shrink: 0; }
.epc-stop-skin-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(10,13,26,.15));
}
.epc-stop-reward-txt {
  font: 500 12px/1.3 'Inter', sans-serif;
}
.epc-stop-reward-txt strong { font-weight: 700; }

/* ═══════════════════════════════════════════════════════ */
/* Badges visuels — anim float + shimmer + flou pour tiers locked  */
/* ═══════════════════════════════════════════════════════ */

/* Badge image dans le dot (tier ou skin atteint) — float subtil */
.epc-stop.done .epc-stop-dot img,
.epc-stop.done .epc-stop-skin-img,
.epc-stop.done .epc-stop-reward-ico img {
  animation: epcBadgeFloat 3.2s ease-in-out infinite;
}
@keyframes epcBadgeFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}

/* Shimmer light qui passe sur les badges débloqués */
.epc-stop.done .epc-stop-reward {
  position: relative;
  overflow: hidden;
}
.epc-stop.done .epc-stop-reward::before {
  content: '';
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%);
  animation: epcShimmer 3.8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}
@keyframes epcShimmer {
  0%, 70% { left: -120%; }
  100%    { left: 130%; }
}

/* Tiers 8/9/10 NON débloqués : floutés (effet "à découvrir") */
.epc-stop.tier-locked .epc-stop-dot,
.epc-stop.tier-locked .epc-stop-reward,
.epc-stop.tier-locked .epc-stop-title {
  filter: blur(4px) saturate(.5);
  opacity: .7;
  transition: filter .3s ease, opacity .3s ease;
}
.epc-stop.tier-locked:hover .epc-stop-dot,
.epc-stop.tier-locked:hover .epc-stop-reward,
.epc-stop.tier-locked:hover .epc-stop-title {
  filter: blur(2px) saturate(.7);
  opacity: .85;
}
.epc-stop.tier-locked .epc-stop-body::after {
  content: '🔒 Mystère';
  display: inline-block;
  font: 600 10px/1 'Inter', sans-serif;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-top: 6px;
  background: rgba(148,163,184,.12);
  padding: 4px 8px;
  border-radius: 99px;
}

/* Cercle Or atteint : halo doré pulsé spécial (T10) */
.epc-stop.cercle-or.done .epc-stop-dot {
  background: radial-gradient(circle, rgba(245,158,11,.3), transparent 70%);
  animation: epcGoldHalo 2.4s ease-in-out infinite;
}
@keyframes epcGoldHalo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.5); }
  50%      { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
}

@media (prefers-reduced-motion: reduce) {
  .epc-stop.done .epc-stop-dot img,
  .epc-stop.done .epc-stop-skin-img,
  .epc-stop.done .epc-stop-reward::before,
  .epc-stop.cercle-or.done .epc-stop-dot {
    animation: none !important;
  }
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

  // ─── Calcul de l'état moniteur (basé sur count de validations) ──
  const totalValidations = allVals.length;
  const state = getMoniteurState(totalValidations);

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

  // ─── Stops timeline (tiers majeurs + skins intercalés) ────────
  const stops = buildTimelineStops();

  // ─── Render final ─────────────────────────────────────────────
  const prenom = me.prenom || '';
  const nom = me.nom || '';
  const initials = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
  const currentTitle = state.tier ? state.tier.title : 'Débutant';
  const currentRank = state.tier ? state.tier.tier : 0;
  const accentColor = state.skin ? state.skin.accent : '#6366f1';

  root.innerHTML = `${STYLE}
    <div class="epc anim-slide-up">

      <div class="epc-hd">
        <h1 class="epc-h1">Mon parcours pro</h1>
        <p class="epc-sub">${totalValidations} validation${totalValidations > 1 ? 's' : ''} cumulées · ${esc(state.saison.name)}</p>
      </div>

      <!-- Profil + progression -->
      <div class="epc-prof">
        <div class="epc-prof-row">
          <div class="epc-av" style="background:${esc(accentColor)}">${esc(initials)}</div>
          <div class="epc-prof-info">
            <div class="epc-prof-lvl">Palier ${currentRank} / 10</div>
            <div class="epc-prof-title-big">${esc(currentTitle)}</div>
          </div>
        </div>
        <div class="epc-xp">
          <div class="epc-xp-bar">
            <div class="epc-xp-fill" style="width:${state.pctToNextReward}%"></div>
          </div>
          <div class="epc-xp-meta">
            <span><strong>${totalValidations}</strong> validations</span>
            <span>${state.nextReward ? `${state.nextReward.missing} avant ${esc(state.nextReward.kind === 'tier' ? state.nextReward.data.unlock.name : 'nouveau skin')}` : 'Cercle Or atteint'}</span>
          </div>
        </div>
      </div>

      <!-- HÉRO : Prochaine récompense (skin OU outil majeur — le + proche) -->
      ${state.nextReward ? `
      <div class="epc-hero">
        <div class="epc-hero-lbl">Prochaine récompense</div>
        <div class="epc-hero-row">
          <div class="epc-hero-icon">${icon(state.nextReward.kind === 'tier' ? state.nextReward.data.unlock.iconName : 'sparkle', { size: 28, strokeWidth: 2.2 })}</div>
          <div class="epc-hero-info">
            ${state.nextReward.kind === 'tier' ? `
              <div class="epc-hero-level">Palier ${state.nextReward.data.tier} · Outil utile</div>
              <h3 class="epc-hero-name">${esc(state.nextReward.data.unlock.name)}</h3>
              <p class="epc-hero-desc">${esc(state.nextReward.data.unlock.desc)}</p>
            ` : `
              <div class="epc-hero-level">Récompense intermédiaire</div>
              <h3 class="epc-hero-name">Nouveau skin de profil</h3>
              <p class="epc-hero-desc">Couleur d'accent personnalisée pour ton avatar.</p>
            `}
          </div>
        </div>
        <div class="epc-hero-prog">
          <div class="epc-hero-prog-bar">
            <div class="epc-hero-prog-fill" style="width:${state.pctToNextReward}%"></div>
          </div>
          <div class="epc-hero-prog-meta">
            <span>${state.nextReward.missing} validation${state.nextReward.missing > 1 ? 's' : ''} restantes</span>
            <span>${state.pctToNextReward}%</span>
          </div>
        </div>
      </div>` : ''}

      <!-- Route timeline VERTICALE -->
      <div class="epc-section-title">Ma route · ${esc(state.saison.name)}</div>
      <div class="epc-route" id="epc-route">
        ${stops.map(s => renderStop(s, totalValidations)).join('')}
      </div>

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
          <span class="epc-week-ico">${icon('chart-bar', { size: 18 })}</span>
          <span class="epc-week-txt"><strong data-counter="${valsThisWeek.length}">0</strong> validation${valsThisWeek.length > 1 ? 's' : ''} · <strong>${elevesThisWeek}</strong> élève${elevesThisWeek > 1 ? 's' : ''}</span>
        </div>
        ${trendLabel ? `
        <div class="epc-week-row">
          <span class="epc-week-ico">${icon('trending-up', { size: 18 })}</span>
          <span class="epc-week-txt">${esc(trendLabel)}</span>
        </div>` : ''}
      </div>

    </div>`;

  // ─── Wire ─────────────────────────────────────────────────────
  // Scroll smooth vers le stop "now" sur la route verticale
  const nowStop = root.querySelector('.epc-stop.now');
  if (nowStop) {
    setTimeout(() => {
      nowStop.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
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

// buildRouteStops() supprimé — remplacé par buildTimelineStops() du data layer

function renderStop(stop, totalValidations) {
  // stop = { threshold, kind: 'tier'|'skin', tier?, skin? }
  let cls = 'todo';
  if (totalValidations >= stop.threshold) cls = 'done';

  // Tiers 8/9/10 → floutés tant que pas atteints (mystère)
  const isMajor = stop.kind === 'tier';
  const tierNum = isMajor ? stop.tier.tier : 0;
  const tierLocked = isMajor && tierNum >= 8 && cls !== 'done';
  const isCercleOr = isMajor && tierNum === 10;

  // Contenu du dot
  let dotContent;
  const iconName = isMajor ? stop.tier.unlock.iconName : 'sparkle';

  if (cls === 'done') {
    // Si le tier a une image, on la prend ; sinon icon check
    dotContent = isMajor
      ? icon('check', { size: 16, strokeWidth: 3 })
      : (stop.skin?.image
          ? `<img class="epc-stop-skin-img" src="${esc(stop.skin.image)}" alt="" style="width:100%;height:100%" onerror="this.style.display='none'">`
          : icon('check', { size: 16, strokeWidth: 3 }));
  } else if (isMajor) {
    dotContent = icon(iconName, { size: 15, strokeWidth: 2 });
  } else {
    dotContent = `<span style="width:8px;height:8px;border-radius:50%;background:${esc(stop.skin?.accent || '#cbd5e1')}"></span>`;
  }

  // ─── Coût (validations restantes pour débloquer) ───
  const diff = stop.threshold - totalValidations;
  let costLine;
  if (cls === 'done') {
    costLine = `<span class="epc-stop-cost done">Atteint · ${stop.threshold} valid.</span>`;
  } else {
    costLine = `<span class="epc-stop-cost todo">+${diff} validation${diff > 1 ? 's' : ''}</span>`;
  }

  // ─── Titre & récompense ───
  const title = isMajor ? stop.tier.title : 'Skin de profil';
  const rewardName = isMajor ? stop.tier.unlock.name : `Couleur ${stop.skin?.accent || ''}`;
  const rewardDesc = isMajor ? stop.tier.unlock.desc : null;

  const rewardLine = isMajor ? `
    <div class="epc-stop-reward ${cls === 'done' ? 'unlocked' : ''}">
      <span class="epc-stop-reward-ico">${icon(iconName, { size: 14, strokeWidth: 2.4 })}</span>
      <span class="epc-stop-reward-txt">
        ${cls === 'done' ? 'Débloqué : ' : 'Débloque : '}
        <strong>${esc(stop.tier.unlock.name)}</strong>
      </span>
    </div>
  ` : (stop.skin ? `
    <div class="epc-stop-reward skin-reward" style="border-color:${esc(stop.skin.accent)}44;background:${esc(stop.skin.accent)}10;color:${esc(stop.skin.accent)}">
      ${stop.skin.image ? `<img class="epc-stop-skin-img" src="${esc(stop.skin.image)}" alt="" onerror="this.style.display='none'">` : ''}
      <span class="epc-stop-reward-txt">
        ${cls === 'done' ? 'Skin débloqué : ' : 'Skin : '}
        <strong>${esc(stop.skin.name)}</strong>
      </span>
    </div>
  ` : '');

  const classList = [
    'epc-stop',
    cls,
    isMajor ? 'tier' : 'skin',
    tierLocked ? 'tier-locked' : '',
    isCercleOr ? 'cercle-or' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classList}">
      <div class="epc-stop-dot">${dotContent}</div>
      <div class="epc-stop-body">
        <div class="epc-stop-head">
          <span class="epc-stop-lvl">${isMajor ? `Palier ${stop.tier.tier}` : `${stop.threshold} valid.`}</span>
          ${costLine}
        </div>
        ${isMajor ? `<div class="epc-stop-title">${esc(title)}</div>` : ''}
        ${rewardLine}
      </div>
    </div>
  `;
}

// unlockPct() supprimé — remplacé par state.pctToNextReward (calculé dans data layer)
