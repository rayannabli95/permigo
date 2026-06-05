// ═══════════════════════════════════════════════════════════════
// Enseignant — Parcours Pro (refonte 3 blocs)
// Bloc 1 : HERO immersif (niveau, XP, streak)
// Bloc 2 : NEXT UNLOCK — 1 seul palier visible via RPC
// Bloc 3 : ROADMAP MINI — 3 stops (current / next / blurred)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import {
  getMoniteurState,
  buildTimelineStops,
  SAISONS,
} from "@/data/moniteur-levels.js";
import { animateCounter } from "@/utils/gestures.js";
import { icon } from "@/utils/icons.js";
import { openPalierSheet } from "@/components/common/palier-sheet.js";
import { playParcours } from "@/utils/sound.js";

// ─── CSS ────────────────────────────────────────────────────────
const STYLE = `<style>
.pcp {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 0 100px;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

/* ═══════════════════════════ BLOC 1 — HERO ═══════════════════════ */
.pcp-hero {
  position: relative;
  overflow: hidden;
  padding: 48px 24px 32px;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Ton sobre « Linear » : slate profond neutre, pas de néon */
  background: linear-gradient(165deg, var(--ink4) 0%, var(--ink) 100%);
  border-bottom: 1px solid rgba(255,255,255,.06);
}

/* Fine ligne d'accent en haut — discrète, pas de mesh ni de grain */
.pcp-hero::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(88,204,2,.6), transparent);
  pointer-events: none;
}

.pcp-hero-content { position: relative; z-index: 1; }

.pcp-hero-label {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.55);
  margin-bottom: 8px;
}
.pcp-hero-title {
  font: 800 44px/1.05 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  text-shadow: 0 2px 24px rgba(0,0,0,.3);
}
.pcp-hero-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}
.pcp-hero-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pcp-hero-stat-val {
  font: 700 24px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.02em;
}
.pcp-hero-stat-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.6);
}
.pcp-hero-sep {
  width: 1px; height: 32px;
  background: rgba(255,255,255,.2);
  flex-shrink: 0;
}
.pcp-streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 99px;
  padding: 6px 12px;
  backdrop-filter: blur(8px);
}
.pcp-streak-fire {
  font-size: 16px;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(251,146,60,.8));
}
.pcp-streak-val {
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.pcp-streak-lbl {
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}

/* ═══════════════════════ BLOC 2 — NEXT UNLOCK ════════════════════ */
.pcp-next {
  margin: 20px 16px 0;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  min-height: 220px;
  /* Accent indigo sobre — outil utile, pas une loot box */
  background: linear-gradient(150deg, var(--adk) 0%, var(--a) 100%);
  box-shadow:
    0 12px 28px -14px rgba(79,70,229,.45),
    0 4px 10px -4px rgba(10,13,26,.12);
  animation: pcpNextIn .6s .1s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes pcpNextIn {
  from { opacity: 0; transform: translateY(16px) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.pcp-next::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 80% at 85% 20%, rgba(255,255,255,.18) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 15% 90%, rgba(255,255,255,.1) 0%, transparent 50%);
  pointer-events: none;
}

.pcp-next-inner {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.pcp-next-label {
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.6);
  margin-bottom: 20px;
}
.pcp-next-top {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.pcp-next-icon-wrap {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.28);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.pcp-next-info { flex: 1; min-width: 0; }
.pcp-next-remaining {
  font: 800 28px/1 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: 6px;
}
.pcp-next-remaining span {
  font: 500 13px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
  letter-spacing: 0;
  margin-left: 4px;
}
.pcp-next-reward-label {
  font: 700 16px/1.3 'Plus Jakarta Sans', sans-serif;
  color: #fff;
  margin-bottom: 3px;
}
.pcp-next-reward-desc {
  font: 500 12px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}

/* Mystery mode */
.pcp-next-mystery .pcp-next-icon-wrap {
  filter: blur(2px);
}
.pcp-next-mystery .pcp-next-reward-label,
.pcp-next-mystery .pcp-next-reward-desc {
  filter: blur(5px);
  user-select: none;
}
.pcp-mystery-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 99px;
  padding: 4px 10px;
  font: 700 11px/1 'Inter', sans-serif;
  color: #fff;
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-top: 8px;
}

/* Barre de progression */
.pcp-next-prog {
  margin-top: 4px;
}
.pcp-next-prog-track {
  height: 8px;
  background: rgba(255,255,255,.18);
  border-radius: 99px;
  overflow: hidden;
}
.pcp-next-prog-fill {
  height: 100%;
  background: var(--su);
  border-radius: 99px;
  width: 0; /* animé via JS */
  transition: width .9s cubic-bezier(.2,.7,.3,1);
  box-shadow: 0 0 12px rgba(255,255,255,.5);
}
.pcp-next-prog-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font: 500 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}
.pcp-next-prog-meta strong { color: #fff; }

/* All done */
.pcp-next-alldone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 24px;
  color: rgba(255,255,255,.9);
  text-align: center;
}
.pcp-next-alldone-ico {
  font-size: 48px;
  line-height: 1;
}
.pcp-next-alldone-title {
  font: 700 20px/1.2 'Plus Jakarta Sans', sans-serif;
  color: #fff;
}
.pcp-next-alldone-sub {
  font: 500 13px/1.4 'Inter', sans-serif;
  color: rgba(255,255,255,.7);
}

/* ═══════════════════════ BLOC 3 — ROADMAP MINI ═══════════════════ */
.pcp-road {
  margin: 20px 16px 0;
}
.pcp-road-title {
  font: 600 11px/1 'Inter', sans-serif;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 12px;
}
.pcp-road-stops {
  background: var(--su);
  border: 1px solid var(--bo);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(10,13,26,.06);
}
.pcp-road-stop {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  position: relative;
  border-bottom: 1px solid var(--bo2);
  transition: background .12s;
}
.pcp-road-stop:last-of-type { border-bottom: none; }
.pcp-road-stop[role="button"] { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.pcp-road-stop[role="button"]:active { background: rgba(88,204,2,.07); }
.pcp-road-stop:focus-visible { outline: 2px solid var(--a); outline-offset: -2px; }
.pcp-road-stop.pcp-now { background: rgba(88,204,2,.04); }
.pcp-road-stop.pcp-blurred { opacity: .45; filter: blur(1.5px); pointer-events: none; user-select: none; }

.pcp-road-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.pcp-road-dot.done  { background: var(--gr); color: #fff; }
.pcp-road-dot.now   { background: #fff; border: 2.5px solid var(--a); color: var(--a);
                       box-shadow: 0 0 0 4px rgba(88,204,2,.15); }
.pcp-road-dot.todo  { background: var(--bg2); border: 2px solid var(--bo); color: var(--mu2); }

.pcp-road-body { flex: 1; min-width: 0; }
.pcp-road-tier {
  font: 600 10px/1 'Inter', sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--mu2);
  margin-bottom: 4px;
}
.pcp-road-stop.done .pcp-road-tier  { color: var(--gr); }
.pcp-road-stop.pcp-now .pcp-road-tier { color: var(--a); }

.pcp-road-name {
  font: 600 14px/1.3 'Inter', sans-serif;
  color: var(--ink);
}
.pcp-road-stop.done .pcp-road-name { color: var(--mu3); }

.pcp-road-reward {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  font: 500 11.5px/1 'Inter', sans-serif;
  color: var(--a);
  background: rgba(88,204,2,.08);
  border-radius: 8px;
  padding: 3px 8px;
}
.pcp-road-stop.done .pcp-road-reward { color: var(--grd); background: rgba(16,185,129,.08); }

.pcp-road-badge {
  flex-shrink: 0;
  font: 600 11px/1 'Inter', sans-serif;
  padding: 4px 8px;
  border-radius: 99px;
}
.pcp-road-badge.done  { color: var(--grd); background: rgba(16,185,129,.1); }
.pcp-road-badge.now   { color: #fff; background: var(--a); }
.pcp-road-badge.todo  { color: var(--mu2); background: var(--bg2); }

/* Bouton voir tout */
.pcp-see-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  background: none;
  border: 1.5px solid var(--bo);
  border-radius: 14px;
  color: var(--mu);
  font: 600 13px/1 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.pcp-see-all:hover { border-color: var(--a); color: var(--a); background: rgba(88,204,2,.04); }
.pcp-see-all:active { transform: scale(.98); }

/* Skeletons */
.pcp-skel {
  background: linear-gradient(90deg, var(--bg3) 0%, var(--bg5) 50%, var(--bg3) 100%);
  background-size: 200% 100%;
  animation: pcpShim 1.4s ease-in-out infinite;
  border-radius: 20px;
}
@keyframes pcpShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Hero : slide only — toujours visible (pas de flash opacity: 0) */
.pcp-hero { animation: pcpHeroIn .4s cubic-bezier(.2,.7,.3,1) forwards; }
@keyframes pcpHeroIn {
  from { transform: translateY(10px); }
  to   { transform: translateY(0); }
}
/* Next + Road : fade-up séquentiels (.pcp-next garde pcpNextIn défini plus haut) */
.pcp-road { animation: pcpBlockIn .5s 240ms cubic-bezier(.2,.7,.3,1) both; }
@keyframes pcpBlockIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .pcp-hero, .pcp-next, .pcp-road { animation: none; }
  .pcp-next-prog-fill { transition: none; }
}

/* ── Saison chip ── */
.pcp-saison {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  font: 600 11px/1 'Inter', sans-serif;
  color: rgba(255,255,255,.8);
  margin-top: 16px;
}
.pcp-saison-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* ── Trophées shortcut card ── */
.pcp-trophees-card {
  margin: 16px 16px 0;
  padding: 16px;
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  display: flex; align-items: center; gap: 14px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
  animation: pcpBlockIn .5s 360ms cubic-bezier(.2,.7,.3,1) both;
  transition: border-color .15s, transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.pcp-trophees-card:active { transform: scale(.98); }
.pcp-trophees-card:hover { border-color: var(--a); }
.pcp-trophees-ico {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(245,158,11,.1); border: 1.5px solid rgba(245,158,11,.25);
  display: flex; align-items: center; justify-content: center;
  color: #f59e0b; flex-shrink: 0;
}
.pcp-trophees-body { flex: 1; min-width: 0; }
.pcp-trophees-title {
  font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink);
  margin-bottom: 3px;
}
.pcp-trophees-sub {
  font: 500 12px/1 'Inter', sans-serif;
  color: var(--mu2);
}
.pcp-trophees-badge {
  font: 700 12px/1 'IBM Plex Mono', monospace;
  color: #f59e0b;
  background: rgba(245,158,11,.1);
  padding: 4px 8px; border-radius: 8px;
  white-space: nowrap; flex-shrink: 0;
}

/* ── Ligue shortcut card ── */
.pcp-ligue-card {
  margin: 16px 16px 0;
  padding: 15px 16px;
  background: var(--su); border: 1.5px solid var(--bo); border-radius: 20px;
  display: flex; align-items: center; gap: 14px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
  animation: pcpBlockIn .5s 400ms cubic-bezier(.2,.7,.3,1) both;
  transition: border-color .15s, transform .12s;
  -webkit-tap-highlight-color: transparent;
}
.pcp-ligue-card:active { transform: scale(.98); }
.pcp-ligue-card:hover { border-color: #f59e0b; }
.pcp-ligue-ico {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(245,158,11,.1); border: 1.5px solid rgba(245,158,11,.25);
  display: flex; align-items: center; justify-content: center;
  color: #f59e0b; flex-shrink: 0; font-size: 22px; line-height: 1;
}
.pcp-ligue-body { flex: 1; min-width: 0; }
.pcp-ligue-title { font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 3px; }
.pcp-ligue-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); }
</style>`;

// ─── State ──────────────────────────────────────────────────────
let _root = null;
let _me = null;

// ─── Entry point ────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me || _me.role !== "enseignant") return;

  track("page.view", { page: "parcours_pro" });
  playParcours();

  root.innerHTML = `${STYLE}
    <div class="pcp">
      <div class="pcp-skel" style="height:300px;margin:0;border-radius:0"></div>
      <div class="pcp-skel" style="height:260px;margin:20px 16px 0"></div>
      <div class="pcp-skel" style="height:180px;margin:20px 16px 0"></div>
    </div>`;

  // ─── Fetch en parallèle ──────────────────────────────────────
  // ⚠️ La progression (titre, prochain palier, %) est dérivée du VRAI compte
  // de validations via getMoniteurState() — source de vérité = table
  // `validations` + `moniteur-levels.js`. On n'utilise plus le RPC
  // get_my_next_unlock_moniteur (paliers DB) pour l'affichage, afin d'éviter
  // toute désynchro avec les seuils du fichier local.
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

  const [profileRes, countRes, studentsRes, activeRes] = await Promise.all([
    sb
      .from("profiles")
      .select("prenom, xp, streak_pro_days")
      .eq("id", _me.id)
      .maybeSingle(),
    sb
      .from("validations")
      .select("id", { count: "exact", head: true })
      .eq("validated_by", _me.id),
    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("enseignant_id", _me.id)
      .eq("role", "eleve"),
    sb
      .from("validations")
      .select("eleve_id")
      .eq("validated_by", _me.id)
      .gte("validated_at", since30d),
  ]);

  const me = profileRes.data || {};
  const streak = me.streak_pro_days ?? 0;
  const totalVals = countRes.count ?? 0;
  const studentsTotal = studentsRes.count ?? 0;
  const studentsActive = new Set(
    (activeRes.data || []).map((v) => v.eleve_id).filter(Boolean),
  ).size;
  const state = getMoniteurState(totalVals);
  const stops = buildTimelineStops();

  render(root, {
    me,
    streak,
    totalVals,
    studentsTotal,
    studentsActive,
    state,
    stops,
  });
}

// ─── Render ──────────────────────────────────────────────────────
function render(
  root,
  {
    me,
    streak,
    totalVals,
    studentsTotal = 0,
    studentsActive = 0,
    state,
    stops,
  },
) {
  const currentTitle = state.tier?.title ?? "Débutant";
  const displayVals = totalVals;
  const xp = me.xp ?? totalVals * 10;

  // Saison courante (mois)
  const saison = SAISONS[new Date().getMonth()];

  // Comptage rapide des trophées débloqués (miroir de trophees-moniteur.js)
  const trophyChecks = [
    totalVals >= 1,
    totalVals >= 10,
    studentsActive >= 1,
    streak >= 7,
    totalVals >= 50,
    studentsTotal >= 5,
    totalVals >= 100,
    streak >= 30,
    studentsTotal >= 10,
    totalVals >= 200,
    studentsTotal >= 3 && studentsActive >= studentsTotal,
    totalVals >= 300,
  ];
  const trophyUnlocked = trophyChecks.filter(Boolean).length;
  const trophyTotal = trophyChecks.length;

  root.innerHTML = `${STYLE}
    <div class="pcp">

      <!-- ══ BLOC 1 — HERO ══ -->
      <div class="pcp-hero">
        <div class="pcp-hero-content">
          <div class="pcp-hero-label">Niveau actuel</div>
          <h1 class="pcp-hero-title">${esc(currentTitle)}</h1>
          <div class="pcp-hero-stats">
            <div class="pcp-hero-stat">
              <span class="pcp-hero-stat-val" data-counter="${displayVals}">0</span>
              <span class="pcp-hero-stat-lbl">validations</span>
            </div>
            <div class="pcp-hero-sep"></div>
            <div class="pcp-hero-stat">
              <span class="pcp-hero-stat-val">${xp.toLocaleString("fr-FR")}</span>
              <span class="pcp-hero-stat-lbl">XP total</span>
            </div>
            ${
              streak > 0
                ? `
            <div class="pcp-hero-sep"></div>
            <div class="pcp-streak-badge">
              <span class="pcp-streak-fire">${icon("flame", { size: 16 })}</span>
              <span class="pcp-streak-val">${streak}</span>
              <span class="pcp-streak-lbl">j. de suite</span>
            </div>`
                : ""
            }
          </div>
          <div class="pcp-saison">
            <span class="pcp-saison-dot" style="background:${saison.accent}"></span>
            ${esc(saison.name)}
          </div>
        </div>
      </div>

      <!-- ══ BLOC 2 — NEXT UNLOCK ══ -->
      ${renderNextUnlock(state)}

      <!-- ══ BLOC 3 — ROADMAP MINI ══ -->
      ${renderRoadmapMini(stops, totalVals)}

      <!-- ══ BLOC 4 — TROPHÉES ══ -->
      <div class="pcp-trophees-card" id="pcp-trophees" role="button" tabindex="0" aria-label="Voir mes trophées">
        <div class="pcp-trophees-ico">${icon("award", { size: 20, strokeWidth: 2 })}</div>
        <div class="pcp-trophees-body">
          <div class="pcp-trophees-title">Trophées professionnels</div>
          <div class="pcp-trophees-sub">Jalons pédagogiques débloqués</div>
        </div>
        <div class="pcp-trophees-badge">${trophyUnlocked}/${trophyTotal}</div>
        ${icon("chevron-right", { size: 16, strokeWidth: 2.5, color: "var(--mu2)" })}
      </div>

      <!-- ══ BLOC 5 — LIGUE SEMAINE ══ -->
      <div class="pcp-ligue-card" id="pcp-ligue" role="button" tabindex="0" aria-label="Voir la ligue de la semaine">
        <div class="pcp-ligue-ico">🏆</div>
        <div class="pcp-ligue-body">
          <div class="pcp-ligue-title">Ligue de la semaine</div>
          <div class="pcp-ligue-sub">Classement hebdo par validations</div>
        </div>
        ${icon("chevron-right", { size: 16, strokeWidth: 2.5, color: "var(--mu2)" })}
      </div>

    </div>`;

  wire(root, state.pctToNextReward ?? 0, stops, totalVals);
}

// ─── Render Bloc 2 — Next Unlock ────────────────────────────────
function renderNextUnlock(state) {
  // state.nextReward null → tous les paliers débloqués
  if (!state.nextReward) {
    return `
      <div class="pcp-next">
        <div class="pcp-next-inner pcp-next-alldone">
          <div class="pcp-next-alldone-ico">${icon("trophy", { size: 28 })}</div>
          <div class="pcp-next-alldone-title">Tous les paliers atteints</div>
          <div class="pcp-next-alldone-sub">Statut Expert REMC certifié débloqué.</div>
        </div>
      </div>`;
  }

  const nextTier = state.nextReward.data; // palier cible (objet MONITEUR_TIERS)
  const iconName = nextTier.unlock.iconName ?? "star";
  const label = nextTier.unlock.name ?? "—";
  const title = nextTier.title ?? "—";
  const remaining = state.nextReward.missing ?? 0;
  const pct = state.pctToNextReward ?? 0;

  return `
    <div class="pcp-next">
      <div class="pcp-next-inner">
        <div class="pcp-next-label">Prochaine récompense</div>
        <div class="pcp-next-top">
          <div class="pcp-next-icon-wrap">
            ${icon(iconName, { size: 28, strokeWidth: 2 })}
          </div>
          <div class="pcp-next-info">
            <div class="pcp-next-remaining">
              ${remaining}<span>validation${remaining > 1 ? "s" : ""} restantes</span>
            </div>
            <div class="pcp-next-reward-label">${esc(label)}</div>
            <div class="pcp-next-reward-desc">${esc(title)}</div>
          </div>
        </div>
        <div class="pcp-next-prog">
          <div class="pcp-next-prog-track">
            <div class="pcp-next-prog-fill" id="pcp-prog-fill" style="width:0%"></div>
          </div>
          <div class="pcp-next-prog-meta">
            <span>Progression</span>
            <strong>${pct}%</strong>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Render Bloc 3 — Roadmap mini ───────────────────────────────
function renderRoadmapMini(stops, totalVals) {
  // Trouve l'index du prochain stop non atteint
  const nextIdx = stops.findIndex((s) => totalVals < s.threshold);
  if (nextIdx === -1) return ""; // tout débloqué → pas de roadmap

  // 3 stops : précédent (done) + prochain (now) + suivant (blurred)
  const toShow = [];
  if (nextIdx > 0) toShow.push({ ...stops[nextIdx - 1], state: "done" });
  toShow.push({ ...stops[nextIdx], state: "now" });
  if (nextIdx + 1 < stops.length)
    toShow.push({ ...stops[nextIdx + 1], state: "todo" });

  return `
    <div class="pcp-road">
      <div class="pcp-road-title">Ma route</div>
      <div class="pcp-road-stops">
        ${toShow.map((s) => renderRoadStop(s)).join("")}
      </div>
      <button class="pcp-see-all" id="pcp-see-all">
        Voir tous les paliers ${icon("chevron-right", { size: 14, strokeWidth: 2.5 })}
      </button>
    </div>`;
}

function renderRoadStop(s) {
  // Tiers uniquement (plus de skin) — récompense = outil utile
  const label = `Palier ${s.tier.tier}`;
  const name = s.tier.title;
  const reward = s.tier.unlock.name;
  const iconName = s.tier.unlock.iconName;
  const badgeTxt =
    s.state === "done" ? "Atteint" : s.state === "now" ? "Prochain" : label;

  const dotState = s.state;
  const dotIcon =
    s.state === "done"
      ? icon("check", { size: 15, strokeWidth: 3 })
      : icon(iconName, { size: 15, strokeWidth: 2 });

  return `
    <div class="pcp-road-stop ${dotState} ${s.state === "now" ? "pcp-now" : ""}" data-tier="${s.tier.tier}" role="button" tabindex="0" aria-label="Détail du palier ${s.tier.tier}">
      <div class="pcp-road-dot ${dotState}">${dotIcon}</div>
      <div class="pcp-road-body">
        <div class="pcp-road-tier">${esc(label)}</div>
        <div class="pcp-road-name">${esc(name)}</div>
        <div class="pcp-road-reward">
          ${icon(iconName, { size: 11, strokeWidth: 2.4 })} ${esc(reward)}
        </div>
      </div>
      <span class="pcp-road-badge ${dotState}">${esc(badgeTxt)}</span>
    </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire(root, progressPct, stops = [], totalVals = 0) {
  // Anime la barre de progression Bloc 2
  requestAnimationFrame(() => {
    setTimeout(() => {
      const fill = root.querySelector("#pcp-prog-fill");
      if (fill) fill.style.width = `${Math.min(100, progressPct)}%`;
    }, 150);
  });

  // Anime le compteur validations dans le hero
  setTimeout(() => {
    const el = root.querySelector("[data-counter]");
    if (el) animateCounter(el, 0, parseInt(el.dataset.counter, 10) || 0, 800);
  }, 100);

  // Clic / clavier sur un palier de la roadmap → sheet de détail
  const openFromStop = (el) => {
    const tierNum = parseInt(el.dataset.tier, 10);
    const stop = stops.find((s) => s.tier.tier === tierNum);
    if (!stop) return;
    track("parcours_pro.tier_detail", { tier: tierNum });
    openPalierSheet(stop.tier, totalVals);
  };
  root.querySelectorAll(".pcp-road-stop[data-tier]").forEach((el) => {
    el.addEventListener("click", () => openFromStop(el));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFromStop(el);
      }
    });
  });

  // Bouton "Voir tous les paliers →"
  root.querySelector("#pcp-see-all")?.addEventListener("click", () => {
    track("parcours_pro.see_all");
    navigate("#/parcours-complet");
  });

  // Trophées card
  const tCard = root.querySelector("#pcp-trophees");
  if (tCard) {
    const goTrophees = () => {
      track("parcours_pro.trophees_open");
      navigate("#/trophees-moniteur");
    };
    tCard.addEventListener("click", goTrophees);
    tCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goTrophees();
      }
    });
  }

  // Ligue de la semaine
  const ligueCard = root.querySelector("#pcp-ligue");
  if (ligueCard) {
    const goLigue = () => {
      track("parcours_pro.ligue_open");
      navigate("#/ligue-semaine");
    };
    ligueCard.addEventListener("click", goLigue);
    ligueCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goLigue();
      }
    });
  }
}
