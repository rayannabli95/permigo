// ═══════════════════════════════════════════════════════════════
// Classement élève — 3 onglets : Ligue semaine / École / National
// Ligues : Bronze→Diamant selon pts hebdo (quiz×2 + comp_acquis×5)
// Aucun nom réel exposé : pseudo ou « Apprenti »
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { playPop, playClick } from "@/utils/sound.js";
import { haptic } from "@/utils/haptic.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import {
  LEAGUES,
  getLeague,
  renderLeagueBadge,
  renderLeagueRow,
  LEAGUE_CSS,
} from "@/utils/league-shared.js";
import {
  THEORY_LEAGUES,
  THEORY_PTS,
  THEORY_QUIZ_PASS_PCT,
  theoryLeague,
} from "@/utils/theory-league.js";
import {
  showTheoryTuto,
  maybeShowTheoryTuto,
} from "@/components/eleve/theory-tuto.js";

const LIMIT = 50;

// ─── Ligues REMC (4 mondes) — un élève « monte » en finissant chaque monde ──
// endAt = score (/31) atteint quand le monde est terminé.
const REMC_LEAGUES = [
  { n: 1, id: "C1", name: "Maîtrise du véhicule", color: "#22c55e", endAt: 9 },
  { n: 2, id: "C2", name: "Circulation normale", color: "#3b82f6", endAt: 17 },
  {
    n: 3,
    id: "C3",
    name: "Conditions difficiles",
    color: "#eab308",
    endAt: 24,
  },
  { n: 4, id: "C4", name: "Conduite autonome", color: "#8b5cf6", endAt: 31 },
];
function remcLeague(score) {
  const s = Math.max(0, Math.min(31, score || 0));
  const idx = REMC_LEAGUES.findIndex((l) => s < l.endAt);
  if (idx === -1)
    return {
      elite: true,
      league: REMC_LEAGUES[3],
      idx: 3,
      toNext: 0,
      next: null,
    };
  return {
    elite: false,
    league: REMC_LEAGUES[idx],
    idx,
    toNext: REMC_LEAGUES[idx].endAt - s,
    next: REMC_LEAGUES[idx + 1] || null, // null = prochain palier = Élite/permis
  };
}
// Médailles top 3 : dégradé + icône + halo (or / argent / bronze)
const MEDALS = {
  1: {
    grad: "linear-gradient(145deg,#fde68a,#f59e0b)",
    ico: "crown",
    glow: "rgba(245,158,11,.4)",
  },
  2: {
    grad: "linear-gradient(145deg,#f1f5f9,#94a3b8)",
    ico: "award",
    glow: "rgba(148,163,184,.35)",
  },
  3: {
    grad: "linear-gradient(145deg,#fcd34d,#b45309)",
    ico: "award",
    glow: "rgba(180,83,9,.35)",
  },
};

// ─── Countdown : temps restant jusqu'au lundi 00:00 ────────────
function msToNextMonday() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=dim, 1=lun … 6=sam
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday - now;
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

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
${LEAGUE_CSS}
.clt {
  padding: 0 0 calc(72px + env(safe-area-inset-bottom, 0px));
  max-width: 480px; margin: 0 auto;
  color: var(--ink); font-family: 'Inter', sans-serif; background: var(--bg);
}
.clt-hd {
  position: sticky; top: 0; z-index: 10; background: var(--bg);
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px 12px;
  border-bottom: 1px solid var(--bo2);
}
.clt-title { font: 800 22px/1.1 'Plus Jakarta Sans', sans-serif; letter-spacing: -.022em; margin: 0 0 10px; }
.clt-mepill {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.25);
  color: #6366f1; border-radius: var(--r-full); padding: 7px 14px;
  font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
}
.clt-mepill-ico { font-size: 15px; }
.clt-tabs { display: flex; gap: 6px; margin-top: 12px; }
.clt-tab {
  flex: 1; min-height: 44px; padding: 9px 6px;
  background: var(--su); border: 1px solid var(--bo); border-radius: var(--r);
  color: var(--mu2); font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
  white-space: nowrap;
}
.clt-tab.on { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.clt-tab-ligue.on { background: linear-gradient(135deg,#d97706,#fbbf24); border-color: transparent; color: #fff; }
.clt-tab:active { transform: scale(.97); }

/* Onglet ligue */
.clt-league-hero {
  margin: 14px 16px 0;
  padding: 16px;
  background: var(--su); border: 1.5px solid var(--bo); border-radius: var(--r-xl);
  box-shadow: 0 1px 2px rgba(10,13,26,.04);
}
.clt-league-hero-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.clt-countdown {
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
  font: 500 11px/1 'Inter', sans-serif; color: var(--mu2);
}
.clt-countdown-val {
  font: 700 14px/1 'IBM Plex Mono', monospace; color: var(--ink);
}
.clt-pts-legend {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding-top: 12px; border-top: 1px solid var(--bo2);
}
.clt-pts-pill {
  font: 500 10px/1 'Inter', sans-serif; color: var(--mu2);
  padding: 3px 8px; border-radius: 6px;
  background: var(--bg2); border: 1px solid var(--bo);
}

/* Liste unifiée */
.clt-list { padding: 10px 16px 0; display: flex; flex-direction: column; gap: 6px; }
.clt-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--su); border: 1px solid var(--bo); border-radius: var(--r-md);
  padding: 11px 14px;
}
.clt-row.me { border: 2px solid #6366f1; background: rgba(99,102,241,.06); }
.clt-rank { flex-shrink: 0; min-width: 30px; text-align: center;
  font: 800 13px/1 'IBM Plex Mono', monospace; color: var(--mu2); }
.clt-rank.medal {
  width: 32px; height: 32px; min-width: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: var(--mg);
  box-shadow: 0 3px 10px -2px var(--mglow), inset 0 1px 0 rgba(255,255,255,.45);
}
.clt-row.top1 { border-color: color-mix(in srgb, #f59e0b 45%, transparent); box-shadow: 0 4px 16px -6px rgba(245,158,11,.4); }
.clt-row.top2 { border-color: color-mix(in srgb, #94a3b8 45%, transparent); }
.clt-row.top3 { border-color: color-mix(in srgb, #b45309 40%, transparent); }
.clt-av { flex-shrink: 0; }
.clt-name { flex: 1; min-width: 0; font: 700 14px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.clt-me-tag { flex-shrink: 0; font: 700 10px/1 'Inter', sans-serif; letter-spacing: .04em;
  background: #6366f1; color: #fff; border-radius: var(--r-full); padding: 3px 7px; text-transform: uppercase; }
.clt-score { flex-shrink: 0; font: 700 13px/1 'IBM Plex Mono', monospace; color: var(--a);
  display: flex; align-items: baseline; gap: 2px; }
.clt-score-sub { font-size: 11px; color: var(--mu2); }
.clt-sep { text-align: center; color: var(--mu2); font: 600 12px/1 'Inter', sans-serif; padding: 6px 0 2px; }
.clt-empty { text-align: center; padding: 40px 24px; color: var(--mu2); }
.clt-empty-ico { font-size: 36px; opacity: .35; margin-bottom: 10px; }
.clt-empty-txt { font: 500 13px/1.5 'Inter', sans-serif; max-width: 280px; margin: 0 auto; }
.clt-pseudo { margin: 14px 16px 0; padding: 13px 16px;
  background: var(--su); border: 1px solid var(--bo); border-radius: var(--r-md);
  display: flex; align-items: center; gap: 12px;
  text-decoration: none; color: var(--ink); }
.clt-pseudo:active { transform: scale(.99); }
.clt-pseudo-ico { font-size: 18px; }
.clt-pseudo-body { flex: 1; }
.clt-pseudo-ttl { font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; }
.clt-pseudo-sub { font: 500 11px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 2px; }
@media (prefers-reduced-motion: reduce) { .clt-tab, .clt-row { transition: none; } }

/* ── Ligues REMC ── */
.clt-rl-hero { margin: 4px 16px 12px; padding: 16px; border-radius: var(--rl);
  background: var(--su); border: 1px solid var(--bo); box-shadow: var(--s1);
  border-left: 4px solid var(--lc, var(--a)); }
.clt-rl-top { display: flex; align-items: center; gap: 12px; }
.clt-rl-medal { width: 44px; height: 44px; border-radius: var(--r-md); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
  font: 800 18px/1 'Plus Jakarta Sans', sans-serif;
  background: var(--lc, var(--a));
  box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--lc, var(--a)) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.35); }
.clt-rl-info { flex: 1; min-width: 0; }
.clt-rl-lbl { font: 700 10px/1 'Inter', sans-serif; text-transform: uppercase; letter-spacing: .1em; color: var(--mu2); }
.clt-rl-name { font: 800 15px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-top: 3px; }
.clt-rl-prog { font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu); margin-top: 12px; }
.clt-rl-prog strong { color: var(--lc, var(--a)); font-weight: 800; }
.clt-rl-track { display: flex; gap: 8px; margin-top: 12px; }
.clt-rl-dot { flex: 1; height: 6px; border-radius: var(--r-full); background: var(--bo); position: relative; }
.clt-rl-dot.done { background: var(--dc); }
.clt-rl-dot.cur { background: var(--dc); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dc) 35%, transparent); }
/* Chip ligue sur chaque ligne */
.clt-lg-chip { flex-shrink: 0; width: 26px; height: 26px; border-radius: var(--r-sm);
  display: flex; align-items: center; justify-content: center; color: #fff;
  font: 800 12px/1 'Plus Jakarta Sans', sans-serif; background: var(--lc, var(--a));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3); }
.clt-lg-chip.elite { background: linear-gradient(135deg,#f59e0b,#d97706); }

/* ── Ligue théorique (dimension autonomie — visuellement distincte) ── */
.clt-th-hero { border-style: dashed; border-left-style: solid; }
.clt-th-hero .clt-pts-legend { margin-top: 12px; }
.clt-th-cta {
  display: block; margin-top: 14px; padding: 12px;
  text-align: center; text-decoration: none; border-radius: var(--r);
  color: var(--a-ink);
  background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
  box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; min-height: 44px;
  box-sizing: border-box;
}
.clt-th-cta:active { transform: scale(.98); }
/* Bouton « ? » — revoir le tuto (cible 44px) */
.clt-th-help {
  flex-shrink: 0; width: 44px; height: 44px; margin: -6px -6px -6px 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 0; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.clt-th-help span {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg2); border: 1px solid var(--bo);
  color: var(--mu); font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
  transition: color .15s, border-color .15s;
}
.clt-th-help:hover span, .clt-th-help:active span { color: var(--a); border-color: var(--a); }
/* Légende « Comment gagner des points ? » */
.clt-th-how-ttl {
  width: 100%; font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu); margin-bottom: 2px;
}
</style>`;

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "classement", user_role: me.role });

  root.innerHTML = `${STYLE}<div class="clt">
    <div class="clt-hd"><h1 class="clt-title">Classement</h1></div>
    <div class="clt-list">${Array.from({ length: 5 })
      .map(
        () =>
          `<div class="skel skel-card" style="height:52px;border-radius:14px"></div>`,
      )
      .join("")}</div>
  </div>`;

  const [ecoleRes, nationalRes, theorieRes] = await Promise.all([
    sb.rpc("get_eleve_leaderboard", { p_scope: "ecole", p_limit: LIMIT }).then(
      (r) => r,
      () => ({ data: null, error: true }),
    ),
    sb
      .rpc("get_eleve_leaderboard", { p_scope: "national", p_limit: LIMIT })
      .then(
        (r) => r,
        () => ({ data: null, error: true }),
      ),
    sb.rpc("get_theory_leaderboard", { p_scope: "ecole", p_limit: LIMIT }).then(
      (r) => r,
      () => ({ data: null, error: true }),
    ),
  ]);

  const data = {
    ecole: ecoleRes.data || [],
    national: nationalRes.data || [],
    theorie: theorieRes.data || [],
  };

  // Défaut = Mon école (la ligue hebdo est abandonnée → plus d'onglet vide)
  let scope = "ecole";
  root.innerHTML = `${STYLE}${_render(scope, data)}`;
  _wire(root, data, (s) => {
    scope = s;
  });
}

// ─── Render ──────────────────────────────────────────────────────
function _myRow(rows) {
  return rows.find((r) => r.is_me === true) || null;
}

function _render(scope, data) {
  const rows = data[scope];
  const mine = _myRow(rows);

  // Pill header selon scope
  let pill = "";
  if (scope === "theorie") {
    pill = _theoryPill(mine);
  } else if (scope === "semaine") {
    const myLeague = getLeague(mine?.weekly_pts ?? 0);
    if (myLeague) {
      pill = `<div class="clt-mepill"><span class="clt-mepill-ico">${myLeague.emoji}</span>Ligue ${esc(myLeague.name)} · ${mine?.weekly_pts ?? 0} pts</div>`;
    } else {
      pill = `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("zap", { size: 14 })}</span>Fais des quiz pour entrer en ligue</div>`;
    }
  } else {
    const totalKnown = rows.filter((r) => r.rang <= LIMIT).length;
    pill = mine
      ? `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("trophy", { size: 14 })}</span>Tu es #${mine.rang}</div>`
      : `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("target", { size: 14 })}</span>Valide une compétence pour entrer</div>`;
    void totalKnown;
  }

  return `
<div class="clt">
  <div class="clt-hd">
    <h1 class="clt-title">Classement</h1>
    ${pill}
    <div class="clt-tabs">
      <button class="clt-tab ${scope === "ecole" ? "on" : ""}" data-scope="ecole">${icon("trophy", { size: 13, strokeWidth: 2 })} Mon école</button>
      <button class="clt-tab ${scope === "national" ? "on" : ""}" data-scope="national">National</button>
      <button class="clt-tab ${scope === "theorie" ? "on" : ""}" data-scope="theorie">${icon("zap", { size: 13, strokeWidth: 2 })} Théorie</button>
    </div>
  </div>
  <div id="clt-body">${_renderBody(scope, rows)}</div>
  <a class="clt-pseudo" href="#/profil">
    <span class="clt-pseudo-ico" aria-hidden="true">${icon("user", { size: 16, strokeWidth: 2 })}</span>
    <div class="clt-pseudo-body">
      <div class="clt-pseudo-ttl">Choisis ton pseudo public</div>
      <div class="clt-pseudo-sub">Sinon tu apparais en « Apprenti »</div>
    </div>
    <span style="color:var(--mu2)" aria-hidden="true">›</span>
  </a>
</div>`;
}

function _renderBody(scope, rows) {
  if (scope === "semaine") return _renderLeagueBody(rows);
  if (scope === "theorie") return _renderTheoryBody(rows);
  return _renderAllTimeBody(rows);
}

// ── Pill théorie ─────────────────────────────────────────────────
function _theoryPill(mine) {
  const info = theoryLeague(mine?.score ?? 0);
  return info.league
    ? `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("zap", { size: 14 })}</span>Ligue ${esc(info.league.name)} · ${mine?.score ?? 0} pts</div>`
    : `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("zap", { size: 14 })}</span>Ton premier quiz t'ouvre la ligue</div>`;
}

// ── Légende explicite — dérivée du barème (theory-league.js) ────
function _theoryHowLegend() {
  return `
    <div class="clt-pts-legend">
      <span class="clt-th-how-ttl">Comment gagner des points ?</span>
      <span class="clt-pts-pill">${icon("check", { size: 11, strokeWidth: 2.4 })} Quiz d'une compétence réussi (≥${THEORY_QUIZ_PASS_PCT} %) → +${THEORY_PTS.quiz} pt</span>
      <span class="clt-pts-pill">${icon("zap", { size: 11, strokeWidth: 2.4 })} Parcours d'examen réussi → +${THEORY_PTS.exam} pts</span>
    </div>`;
}

function _theoryHelpBtn() {
  return `<button class="clt-th-help" id="clt-th-help" type="button" aria-label="Revoir comment fonctionne la ligue théorique"><span aria-hidden="true">?</span></button>`;
}

// ── Hero « Ta ligue théorique » ──────────────────────────────────
function _theoryLeagueHero(mine) {
  const sc = mine?.score ?? 0;
  const nComp = mine?.n_comp ?? 0;
  const nExams = mine?.n_exams ?? 0;
  const info = theoryLeague(sc);

  // Onboarding : pas encore dans la ligue → CTA premier quiz
  if (!info.league) {
    return `
  <div class="clt-rl-hero clt-th-hero" style="--lc:${THEORY_LEAGUES[0].color}">
    <div class="clt-rl-top">
      <div class="clt-rl-medal">?</div>
      <div class="clt-rl-info">
        <div class="clt-rl-lbl">Ta ligue théorique</div>
        <div class="clt-rl-name">Pas encore classé</div>
      </div>
      ${_theoryHelpBtn()}
    </div>
    <div class="clt-rl-prog">Remplis ton premier quiz pour entrer dans la ligue théorique — chaque compétence travaillée compte.</div>
    ${_theoryHowLegend()}
    <a class="clt-th-cta" href="#/parcours">Faire mon premier quiz</a>
  </div>`;
  }

  const L = info.league;
  const dots = THEORY_LEAGUES.map((l) => {
    const cls =
      sc >= l.startAt ? (l.n === L.n && !info.top ? "cur" : "done") : "";
    return `<div class="clt-rl-dot ${cls}" style="--dc:${l.color}"></div>`;
  }).join("");
  const progText = info.top
    ? "Théorie maîtrisée — montre ça à ton moniteur en leçon"
    : `Encore <strong>${info.toNext}</strong> pt${info.toNext > 1 ? "s" : ""} avant la Ligue ${info.next.n} — ${esc(info.next.name)}`;
  return `
  <div class="clt-rl-hero clt-th-hero" style="--lc:${L.color}">
    <div class="clt-rl-top">
      <div class="clt-rl-medal">${info.top ? "★" : L.n}</div>
      <div class="clt-rl-info">
        <div class="clt-rl-lbl">Ta ligue théorique</div>
        <div class="clt-rl-name">Ligue ${L.n} — ${esc(L.name)}</div>
      </div>
      ${_theoryHelpBtn()}
    </div>
    <div class="clt-rl-prog">${progText}</div>
    <div class="clt-rl-track">${dots}</div>
    ${_theoryHowLegend()}
    <div class="clt-pts-legend" style="border-top:0;padding-top:6px">
      <span class="clt-pts-pill">${nComp} compétence${nComp > 1 ? "s" : ""} en quiz réussi (+${THEORY_PTS.quiz} pt)</span>
      <span class="clt-pts-pill">${nExams} parcours d'examen réussi${nExams > 1 ? "s" : ""} (+${THEORY_PTS.exam} pts)</span>
    </div>
  </div>`;
}

// ── Corps ligue théorique ────────────────────────────────────────
function _renderTheoryBody(rows) {
  const mine = _myRow(rows);
  const hero = _theoryLeagueHero(mine);
  const active = rows.filter((r) => r.score > 0);

  if (active.length < 2) {
    return `${hero}<div class="clt-empty">
      <div class="clt-empty-ico">${icon("zap", { size: 30 })}</div>
      <div class="clt-empty-txt">Le classement s'anime quand 2+ élèves ont des points théorie. Quiz et examens blancs comptent.</div>
    </div>`;
  }

  const top = active
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const meOutside = mine && mine.rang > LIMIT;

  let html = `${hero}<div class="clt-list">${top.map(_theoryRowHtml).join("")}</div>`;
  if (meOutside) {
    html += `<div class="clt-sep">· · ·</div><div class="clt-list">${_theoryRowHtml(mine)}</div>`;
  }
  return html;
}

function _theoryRowHtml(r) {
  const m = MEDALS[r.rang];
  const rankCell = m
    ? `<div class="clt-rank medal" style="--mg:${m.grad};--mglow:${m.glow}" aria-label="Rang ${r.rang}">${icon(m.ico, { size: 17, strokeWidth: 2.2, color: "#fff" })}</div>`
    : `<div class="clt-rank" aria-label="Rang ${r.rang}">${r.rang}</div>`;
  const info = theoryLeague(r.score);
  const chip = !info.league
    ? ""
    : info.top
      ? `<div class="clt-lg-chip elite" title="${esc(info.league.name)}" aria-label="Ligue ${esc(info.league.name)}">★</div>`
      : `<div class="clt-lg-chip" style="--lc:${info.league.color}" title="Ligue ${info.league.n} — ${esc(info.league.name)}" aria-label="Ligue ${info.league.n}">${info.league.n}</div>`;
  return `
  <div class="clt-row ${r.is_me ? "me" : ""} ${m ? "top" + r.rang : ""}">
    ${rankCell}
    <div class="clt-av">${renderUserAvatar({ avatar_url: r.avatar, prenom: r.display_name }, 34)}</div>
    <div class="clt-name">${esc(r.display_name)}</div>
    ${r.is_me ? '<span class="clt-me-tag">Toi</span>' : ""}
    ${chip}
    <div class="clt-score">${r.score}<span class="clt-score-sub">pts</span></div>
  </div>`;
}

// ── Corps ligue semaine ──────────────────────────────────────────
function _renderLeagueBody(rows) {
  const mine = _myRow(rows);
  const myPts = mine?.weekly_pts ?? 0;
  const myLeague = getLeague(myPts);
  const countdown = fmtCountdown(msToNextMonday());

  // Hero ligue
  const hero = `
  <div class="clt-league-hero">
    <div class="clt-league-hero-top">
      ${renderLeagueBadge(myLeague, myPts, "md")}
      <div class="clt-countdown">
        <span>Réinitialisation dans</span>
        <span class="clt-countdown-val">${esc(countdown)}</span>
      </div>
    </div>
    <div class="clt-pts-legend">
      <span class="clt-pts-pill">Quiz réussi +2 pts</span>
      <span class="clt-pts-pill">Compétence acquise +5 pts</span>
      <span class="clt-pts-pill">Diamant ≥40 · Or ≥20 · Argent ≥8 · Bronze ≥1</span>
    </div>
  </div>`;

  if (rows.length === 0) {
    return `${hero}<div class="clt-empty">
      <div class="clt-empty-ico">${icon("zap", { size: 30 })}</div>
      <div class="clt-empty-txt">Fais des quiz ou valide des compétences pour apparaître ici cette semaine.</div>
    </div>`;
  }

  // Trier par pts
  const sorted = [...rows].sort((a, b) => b.weekly_pts - a.weekly_pts);

  // Séparateurs de ligue
  let prevLeagueId = null;
  let listHtml = "";
  for (const entry of sorted) {
    const league = getLeague(entry.weekly_pts);
    const lid = league?.id ?? "hors";
    if (lid !== prevLeagueId) {
      if (prevLeagueId !== null) listHtml += `<div style="height:6px"></div>`;
      const lObj = LEAGUES.find((l) => l.id === lid);
      listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:6px 0 2px;font:600 10px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.08em;color:var(--mu2)">
        ${lObj ? `<span style="width:6px;height:6px;border-radius:50%;background:${lObj.color};display:inline-block;flex-shrink:0"></span>Ligue ${esc(lObj.name)}` : "Hors ligue"}
      </div>`;
      prevLeagueId = lid;
    }
    listHtml += renderLeagueRow(entry, true);
  }

  return `${hero}<div class="clt-list">${listHtml}</div>`;
}

// ── Hero « Ta ligue » (ligues REMC) ───────────────────────────────
function _remcLeagueHero(mine) {
  const sc = mine?.score ?? 0;
  const info = remcLeague(sc);
  const L = info.league;
  const dots = REMC_LEAGUES.map((l) => {
    const cls = info.elite || sc >= l.endAt ? "done" : l.n === L.n ? "cur" : "";
    return `<div class="clt-rl-dot ${cls}" style="--dc:${l.color}"></div>`;
  }).join("");
  const progText = info.elite
    ? "Tous les mondes maîtrisés — tu es prêt pour l'examen 🎓"
    : info.next
      ? `Encore <strong>${info.toNext}</strong> validation${info.toNext > 1 ? "s" : ""} avant la Ligue ${info.next.n} — ${esc(info.next.name)}`
      : `Encore <strong>${info.toNext}</strong> validation${info.toNext > 1 ? "s" : ""} pour atteindre l'Élite (prêt examen)`;
  const lc = info.elite ? "#f59e0b" : L.color;
  return `
  <div class="clt-rl-hero" style="--lc:${lc}">
    <div class="clt-rl-top">
      <div class="clt-rl-medal">${info.elite ? "★" : L.n}</div>
      <div class="clt-rl-info">
        <div class="clt-rl-lbl">Ta ligue</div>
        <div class="clt-rl-name">${info.elite ? "Élite · Prêt pour l'examen" : `Ligue ${L.n} — ${esc(L.name)}`}</div>
      </div>
    </div>
    <div class="clt-rl-prog">${progText}</div>
    <div class="clt-rl-track">${dots}</div>
  </div>`;
}

// ── Corps classement all-time ─────────────────────────────────────
function _renderAllTimeBody(rows) {
  const active = rows.filter((r) => r.score > 0).length;
  if (active < 2) {
    return `<div class="clt-empty">
      <div class="clt-empty-ico">${icon("target", { size: 30 })}</div>
      <div class="clt-empty-txt">Le classement s'anime quand 2+ élèves ont validé des compétences.</div>
    </div>`;
  }

  const top = rows
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const mine = _myRow(rows);
  const meOutside = mine && mine.rang > LIMIT;

  let html = `${_remcLeagueHero(mine)}<div class="clt-list">${top.map(_rowHtml).join("")}</div>`;
  if (meOutside) {
    html += `<div class="clt-sep">· · ·</div><div class="clt-list">${_rowHtml(mine)}</div>`;
  }
  return html;
}

function _rowHtml(r) {
  const m = MEDALS[r.rang];
  const rankCell = m
    ? `<div class="clt-rank medal" style="--mg:${m.grad};--mglow:${m.glow}" aria-label="Rang ${r.rang}">${icon(m.ico, { size: 17, strokeWidth: 2.2, color: "#fff" })}</div>`
    : `<div class="clt-rank" aria-label="Rang ${r.rang}">${r.rang}</div>`;
  const info = remcLeague(r.score);
  const chip = info.elite
    ? `<div class="clt-lg-chip elite" title="Élite" aria-label="Ligue Élite">★</div>`
    : `<div class="clt-lg-chip" style="--lc:${info.league.color}" title="Ligue ${info.league.n} — ${esc(info.league.name)}" aria-label="Ligue ${info.league.n}">${info.league.n}</div>`;
  return `
  <div class="clt-row ${r.is_me ? "me" : ""} ${m ? "top" + r.rang : ""}">
    ${rankCell}
    <div class="clt-av">${renderUserAvatar({ avatar_url: r.avatar, prenom: r.display_name }, 34)}</div>
    <div class="clt-name">${esc(r.display_name)}</div>
    ${r.is_me ? '<span class="clt-me-tag">Toi</span>' : ""}
    ${chip}
    <div class="clt-score">${r.score}<span class="clt-score-sub">/31</span></div>
  </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function _wire(root, data, setScope) {
  // « ? » du hero théorie (délégation : le body est re-rendu via innerHTML)
  root.addEventListener("click", (e) => {
    if (e.target.closest("#clt-th-help")) {
      playClick();
      showTheoryTuto();
    }
  });

  root.querySelectorAll(".clt-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const next = tab.dataset.scope;
      if (tab.classList.contains("on")) return;
      setScope(next);
      haptic("select");
      playClick();

      root.querySelectorAll(".clt-tab").forEach((t) => {
        t.classList.toggle("on", t.dataset.scope === next);
      });

      // Update pill
      const rows = data[next];
      const mine = _myRow(rows);
      const pill = root.querySelector(".clt-mepill");
      if (pill) {
        if (next === "theorie") {
          pill.outerHTML = _theoryPill(mine);
        } else if (next === "semaine") {
          const lg = getLeague(mine?.weekly_pts ?? 0);
          pill.innerHTML = lg
            ? `<span class="clt-mepill-ico">${lg.emoji}</span>Ligue ${esc(lg.name)} · ${mine?.weekly_pts ?? 0} pts`
            : `<span class="clt-mepill-ico">${icon("zap", { size: 14 })}</span>Fais des quiz pour entrer en ligue`;
        } else {
          pill.innerHTML = mine
            ? `<span class="clt-mepill-ico">${icon("trophy", { size: 14 })}</span>Tu es #${mine.rang}`
            : `<span class="clt-mepill-ico">${icon("target", { size: 14 })}</span>Valide une compétence pour entrer`;
        }
      }

      const body = root.querySelector("#clt-body");
      if (body) {
        body.innerHTML = _renderBody(next, rows);
        playPop();
      }
      track("classement.scope_changed", { scope: next });

      // 1er passage sur l'onglet Théorie → tuto (re-consultable via « ? »)
      if (next === "theorie") maybeShowTheoryTuto();
    });
  });
}
