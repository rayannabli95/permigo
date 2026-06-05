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
  width: 44px; height: 44px; border-radius: 10px;
  border: 1.5px solid var(--bo); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0; transition: background .12s;
  -webkit-tap-highlight-color: transparent;
}
.ls-w-back:active { background: var(--bg2); }
.ls-w-hd-info { flex: 1; }
.ls-w-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); letter-spacing: -.02em; }
.ls-w-sub { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }

/* Hero */
.ls-w-hero {
  margin: 14px 16px 0;
  padding: 16px;
  background: var(--su); border: 1.5px solid var(--bo); border-radius: 20px;
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.ls-w-hero-top {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  margin-bottom: 14px;
}
.ls-w-countdown {
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
  font: 500 11px/1 'Inter', sans-serif; color: var(--mu2);
}
.ls-w-countdown-val { font: 700 14px/1 'IBM Plex Mono', monospace; color: var(--ink); }
.ls-w-pts-legend {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding-top: 12px; border-top: 1px solid var(--bo2);
}
.ls-w-pts-pill {
  font: 500 10px/1 'Inter', sans-serif; color: var(--mu2);
  padding: 3px 8px; border-radius: 6px;
  background: var(--bg2); border: 1px solid var(--bo);
}

/* Ligues header dans la liste */
.ls-w-league-hd {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 0 4px;
  font: 600 10px/1 'Inter', sans-serif; text-transform: uppercase; letter-spacing: .08em;
  color: var(--mu2);
}
.ls-w-league-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* Liste */
.ls-w-list { padding: 10px 16px 0; display: flex; flex-direction: column; gap: 6px; }
.ls-w-empty { text-align: center; padding: 40px 24px; color: var(--mu2); }
.ls-w-empty-ico { font-size: 36px; opacity: .35; margin-bottom: 10px; }
.ls-w-empty-txt { font: 500 13px/1.5 'Inter', sans-serif; }

/* Motivation footer */
.ls-w-motivation {
  margin: 14px 16px 0;
  padding: 14px 16px;
  background: var(--su); border: 1px solid var(--bo); border-radius: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.ls-w-motivation-title { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.ls-w-motivation-sub { font: 500 12px/1.4 'Inter', sans-serif; color: var(--mu2); }
.ls-w-motivation-cta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px; border: none; border-radius: 12px;
  background: var(--a); color: #fff;
  font: 700 13px/1 'Inter', sans-serif; cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  transition: opacity .12s;
}
.ls-w-motivation-cta:active { opacity: .85; }
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
      <div class="ls-w-sub">Validations données</div>
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
    navigate("/parcours");
  });

  try {
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
      <span class="ls-w-pts-pill">1 pt = 1 validation</span>
      ${LEAGUES.map((l) => `<span class="ls-w-pts-pill" style="border-color:${l.border};color:${l.color}">${l.name} ≥${l.minPts}</span>`).join("")}
    </div>
  </div>`;

  // Liste avec séparateurs par ligue
  let listHtml = "";
  if (rows.length === 0) {
    listHtml = `<div class="ls-w-empty">
      <div class="ls-w-empty-ico">${icon("zap", { size: 30 })}</div>
      <div class="ls-w-empty-txt">Aucune validation cette semaine.<br>Enregistre une séance pour entrer en ligue.</div>
    </div>`;
  } else {
    const sorted = [...rows].sort((a, b) => b.weekly_pts - a.weekly_pts);
    let prevLeagueId = null;
    for (const entry of sorted) {
      const lg = getLeague(entry.weekly_pts);
      const lid = lg?.id ?? "hors";
      if (lid !== prevLeagueId) {
        if (prevLeagueId !== null) listHtml += `<div style="height:6px"></div>`;
        const lObj = LEAGUES.find((l) => l.id === lid);
        listHtml += `<div class="ls-w-league-hd">
          ${lObj ? `<span class="ls-w-league-dot" style="background:${lObj.color}"></span>${icon(lObj.iconName, { size: 12, strokeWidth: 2, color: lObj.color })} Ligue ${esc(lObj.name)}` : "Hors ligue"}
        </div>`;
        prevLeagueId = lid;
      }
      listHtml += renderLeagueRow(entry, true);
    }
  }

  // Motivation CTA
  const motiv =
    prevLeague && ptsToNext > 0
      ? `<div class="ls-w-motivation">
        <div class="ls-w-motivation-title">Plus que ${ptsToNext} pt${ptsToNext > 1 ? "s" : ""} pour la Ligue ${esc(prevLeague.name)} ${prevLeague.emoji}</div>
        <div class="ls-w-motivation-sub">Enregistre une séance pour valider des compétences et monter en ligue.</div>
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
    <div class="ls-w-sub">${rows.length} enseignant${rows.length > 1 ? "s" : ""} cette semaine</div>
  </div>
</div>
${hero}
<div class="ls-w-list">${listHtml}</div>
${motiv}
</div>`;

  root.querySelector("#ls-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("/parcours");
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
    ?.addEventListener("click", () => navigate("/parcours"));
}
