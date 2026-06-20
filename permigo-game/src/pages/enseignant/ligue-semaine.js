// ═══════════════════════════════════════════════════════════════
// Enseignant — Ligue de la semaine
// Points = nombre de validations données cette semaine
// 4 ligues : Bronze ≥1 / Argent ≥8 / Or ≥20 / Diamant ≥40
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import {
  LEAGUES,
  getLeague,
  renderLeagueBadge,
  renderLeagueRow,
  LEAGUE_CSS,
} from "@/utils/league-shared.js";

// ─── Countdown ────────────────────────────────────────────────
function msToNextMonday() {
  const now = new Date();
  const dow = now.getDay();
  const days = dow === 0 ? 1 : 8 - dow;
  const next = new Date(now);
  next.setDate(now.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next - now;
}
function fmtCountdown(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

// ─── CSS ─────────────────────────────────────────────────────
const STYLE = `<style>
${LEAGUE_CSS}
.ls-w {
  max-width: 580px; margin: 0 auto;
  padding-bottom: 100px;
  background: var(--bg); color: var(--ink);
  font-family: 'Inter', sans-serif;
}
.ls-w-hd {
  padding: 18px 16px 16px;
  background: var(--su); border-bottom: 1px solid var(--bo);
  display: flex; align-items: center; gap: 12px;
}
.ls-w-back {
  width: 44px; height: 44px; border-radius: var(--r);
  border: 1px solid rgba(99,102,241,.15); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0;
  transition: background .15s cubic-bezier(0.23,1,0.32,1),
              border-color .15s cubic-bezier(0.23,1,0.32,1),
              transform .2s cubic-bezier(0.23,1,0.32,1);
  -webkit-tap-highlight-color: transparent;
}
.ls-w-back:hover { background: rgba(99,102,241,.06); border-color: rgba(99,102,241,.3); }
.ls-w-back:active { background: var(--bg2); transform: scale(.97); }
.ls-w-back:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .ls-w-back { transition: none; }
}
.ls-w-hd-info { flex: 1; }
.ls-w-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.025em; }
.ls-w-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 3px; }

/* Hero */
.ls-w-hero {
  margin: 16px 16px 0;
  padding: 18px;
  background: var(--su);
  border: 1px solid rgba(99,102,241,.15);
  border-radius: var(--r-lg);
  box-shadow: var(--s2), inset 0 1px 0 rgba(255,255,255,.06);
}
.ls-w-hero-top {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  margin-bottom: 16px;
}
.ls-w-countdown {
  display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
  font: 500 11px/1 'Inter', sans-serif; color: var(--mu2);
}
.ls-w-countdown-val { font: 700 14px/1 'IBM Plex Mono', monospace; color: var(--ink); }
.ls-w-pts-legend {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding-top: 14px; border-top: 1px solid var(--bo2);
}
.ls-w-pts-pill {
  font: 500 10px/1 'Inter', sans-serif; color: var(--mu);
  padding: 4px 9px; border-radius: var(--r-sm);
  background: var(--bg2); border: 1px solid var(--bo);
  transition: border-color .15s var(--ease);
}

/* Ligues header dans la liste */
.ls-w-league-hd {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 0 5px;
  font: 700 10px/1 'Inter', sans-serif; text-transform: uppercase; letter-spacing: .1em;
  color: var(--mu2);
}
.ls-w-league-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* Liste */
.ls-w-list { padding: 12px 16px 0; display: flex; flex-direction: column; gap: 6px; }
.ls-w-empty { text-align: center; padding: 48px 24px; color: var(--mu2); }
.ls-w-empty-ico { font-size: 36px; opacity: .35; margin-bottom: 12px; }
.ls-w-empty-txt { font: 500 13px/1.5 'Inter', sans-serif; }

/* Row override — top 3 medal */
.lg-row[data-rank="1"],
.lg-row[data-rank="2"],
.lg-row[data-rank="3"] {
  border-color: rgba(245,158,11,.25);
}
.lg-row[data-rank="1"] { background: rgba(245,158,11,.04); }

/* Motivation footer */
.ls-w-motivation {
  margin: 16px 16px 0;
  padding: 18px;
  background: var(--su);
  border: 1px solid rgba(99,102,241,.15);
  border-radius: var(--r-lg);
  box-shadow: var(--s1);
  display: flex; flex-direction: column; gap: 10px;
}
.ls-w-motivation-title { font: 700 14px/1.3 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.01em; }
.ls-w-motivation-sub { font: 500 12px/1.5 'Inter', sans-serif; color: var(--mu2); }
.ls-w-motivation-cta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 13px; border: none; border-radius: var(--r);
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font: 700 13px/1 'Inter', sans-serif; cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  transition: transform .2s cubic-bezier(0.23,1,0.32,1),
              box-shadow .2s cubic-bezier(0.23,1,0.32,1);
  box-shadow: 0 4px 14px -4px rgba(99,102,241,.45);
}
.ls-w-motivation-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px -4px rgba(99,102,241,.55); }
.ls-w-motivation-cta:active { transform: scale(.97); box-shadow: 0 2px 8px -4px rgba(99,102,241,.35); }
.ls-w-motivation-cta:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .ls-w-motivation-cta { transition: none; }
}

/* Shimmer animation pour ligues Or et Diamant */
@keyframes ls-shimmer-badge {
  0%,100% { opacity: .6; }
  50% { opacity: 1; }
}
</style>`;

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") return;

  track("page_view", { page: "ligue_semaine_enseignant" });

  root.innerHTML = `${STYLE}
<div class="ls-w anim-slide-up">
  <div class="ls-w-hd">
    <button class="ls-w-back" id="ls-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="ls-w-hd-info">
      <div class="ls-w-title" tabindex="-1">Ligue de la semaine</div>
      <div class="ls-w-sub">1 pt = 1 compétence validée avec un élève · remise à zéro chaque lundi</div>
    </div>
  </div>
  <div class="ls-w-list">${Array.from({ length: 4 })
    .map(
      () =>
        `<div class="skel" style="height:52px;border-radius:14px;background:linear-gradient(90deg,var(--bg3),var(--bg5) 50%,var(--bg3));background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite"></div>`,
    )
    .join("")}</div>
  <style>@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}</style>
</div>`;

  root.querySelector("#ls-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/parcours");
  });

  try {
    // TODO multi-moniteurs : aujourd'hui le classement ne fait remonter que
    // l'enseignant courant (cohorte = 1 moniteur seedé par école). Quand
    // plusieurs moniteurs partageront une école, get_league_leaderboard devra
    // renvoyer toute la cohorte intra-école pour un vrai classement.
    const { data, error } = await sb.rpc("get_league_leaderboard", {
      p_role: "enseignant",
      p_limit: 50,
    });

    if (error) throw error;
    _render(root, data || []);
  } catch (e) {
    console.error("[ligue-semaine]", e);
    toast("Données indisponibles", "error");
    _renderEmpty(root);
  }
}

// ─── Render ──────────────────────────────────────────────────
function _render(root, rows) {
  const mine = rows.find((r) => r.is_me) || null;
  const myPts = mine?.weekly_pts ?? 0;
  const myLeague = getLeague(myPts);
  const countdown = fmtCountdown(msToNextMonday());

  // Seuils min pour remonter de ligue
  const myLeagueIdx = myLeague
    ? LEAGUES.findIndex((l) => l.id === myLeague.id)
    : LEAGUES.length;
  const prevLeague = myLeagueIdx > 0 ? LEAGUES[myLeagueIdx - 1] : null;
  const ptsToNext = prevLeague ? prevLeague.minPts - myPts : 0;

  const hero = `
  <div class="ls-w-hero">
    <div class="ls-w-hero-top">
      ${renderLeagueBadge(myLeague, myPts, "md")}
      <div class="ls-w-countdown">
        <span>Remise à zéro dans</span>
        <span class="ls-w-countdown-val">${esc(countdown)}</span>
      </div>
    </div>
    <div class="ls-w-pts-legend">
      <span class="ls-w-pts-pill">1 pt = 1 compétence validée avec un élève</span>
      ${LEAGUES.map((l) => `<span class="ls-w-pts-pill" style="border-color:${l.border};color:color-mix(in srgb, ${l.color} 60%, var(--ink))">${l.name} ≥${l.minPts}</span>`).join("")}
    </div>
  </div>`;

  // Liste avec séparateurs par ligue
  let listHtml = "";
  if (rows.length === 0) {
    listHtml = `<div class="ls-w-empty">
      <div class="ls-w-empty-ico">${icon("zap", { size: 30 })}</div>
      <div class="ls-w-empty-txt">Aucune compétence validée cette semaine.<br>Enregistre une séance avec un élève pour marquer ton premier point et entrer en ligue.</div>
    </div>`;
  } else {
    const sorted = [...rows].sort((a, b) => b.weekly_pts - a.weekly_pts);
    let prevLeagueId = null;
    const MEDALS = ["", "🥇", "🥈", "🥉"];
    for (const entry of sorted) {
      const lg = getLeague(entry.weekly_pts);
      const lid = lg?.id ?? "hors";
      if (lid !== prevLeagueId) {
        if (prevLeagueId !== null) listHtml += `<div style="height:8px"></div>`;
        const lObj = LEAGUES.find((l) => l.id === lid);
        listHtml += `<div class="ls-w-league-hd">
          ${lObj ? `<span class="ls-w-league-dot" style="background:${lObj.color}"></span>${icon(lObj.iconName, { size: 12, strokeWidth: 2, color: lObj.color })} Ligue ${esc(lObj.name)}` : "Hors ligue"}
        </div>`;
        prevLeagueId = lid;
      }
      // Wrapper pour attribut data-rank (override CSS bordure top 3)
      const rankPos = entry.rank_pos ?? 0;
      listHtml += `<div data-rank="${rankPos}">${renderLeagueRow(entry, true)}</div>`;
    }
  }

  // Motivation CTA
  const motiv =
    prevLeague && ptsToNext > 0
      ? `<div class="ls-w-motivation">
        <div class="ls-w-motivation-title">Plus que ${ptsToNext} validation${ptsToNext > 1 ? "s" : ""} pour passer en Ligue ${esc(prevLeague.name)}</div>
        <div class="ls-w-motivation-sub">Valide des compétences avec un élève — chaque compétence compte comme un point cette semaine.</div>
        <button class="ls-w-motivation-cta" id="ls-seance-cta">
          ${icon("plus", { size: 16, strokeWidth: 2.5 })} Enregistrer une séance
        </button>
      </div>`
      : "";

  root.innerHTML = `${STYLE}
<div class="ls-w anim-slide-up">
<div class="ls-w-hd">
  <button class="ls-w-back" id="ls-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
  <div class="ls-w-hd-info">
    <div class="ls-w-title" tabindex="-1">Ligue de la semaine</div>
    <div class="ls-w-sub">1 pt = 1 compétence validée · ${rows.length} moniteur${rows.length > 1 ? "s" : ""} en lice cette semaine</div>
  </div>
</div>
${hero}
<div class="ls-w-list">${listHtml}</div>
${motiv}
</div>`;

  root.querySelector("#ls-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/parcours");
  });
  root.querySelector("#ls-seance-cta")?.addEventListener("click", () => {
    navigate("#/log-session");
  });
}

function _renderEmpty(root) {
  root.innerHTML = `${STYLE}
<div class="ls-w anim-slide-up">
<div class="ls-w-hd">
  <button class="ls-w-back" id="ls-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
  <div class="ls-w-hd-info">
    <div class="ls-w-title">Ligue de la semaine</div>
  </div>
</div>
<div class="ls-w-empty">
  <div class="ls-w-empty-ico">${icon("alert-circle", { size: 30 })}</div>
  <div class="ls-w-empty-txt">La ligue n'a pas pu se charger. Réessaie dans quelques instants.</div>
</div>
</div>`;
  root
    .querySelector("#ls-back")
    ?.addEventListener("click", () => navigate("#/parcours"));
}
