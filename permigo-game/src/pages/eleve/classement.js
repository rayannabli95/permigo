// ═══════════════════════════════════════════════════════════════
// Classement élève — 3 onglets : Mon école / Révision / National
//  - Mon école / National = ligue REMC (validations, score /31)
//  - Révision = effort solo (quiz réussis + examens blancs), cf. theory-league.js
// Deep-link possible : #/classement/ecole | /revision | /national
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
import { fmtName } from "@/utils/fmt-name.js";
import {
  LEAGUES,
  getLeague,
  renderLeagueBadge,
  renderLeagueRow,
  LEAGUE_CSS,
  msToNextMonday,
  fmtCountdown,
} from "@/utils/league-shared.js";
import {
  THEORY_LEAGUES,
  THEORY_PTS,
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
.clt-score { flex-shrink: 0; font: 700 13px/1 'IBM Plex Mono', monospace; color: var(--a-txt);
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
/* ── Bandeau descriptif sous les onglets ── */
.clt-scope-desc {
  font: 500 12px/1.4 'Inter', sans-serif; color: var(--mu2);
  padding: 7px 0 0; letter-spacing: .01em;
}
/* Transitions onglets : ease-out snap + touch feedback */
.clt-tab {
  transition:
    background .18s cubic-bezier(0.23,1,0.32,1),
    color .18s cubic-bezier(0.23,1,0.32,1),
    border-color .18s cubic-bezier(0.23,1,0.32,1),
    transform .15s cubic-bezier(0.23,1,0.32,1),
    opacity .15s cubic-bezier(0.23,1,0.32,1);
}
.clt-tab:active { transform: scale(.97); opacity: .88; }
@media (prefers-reduced-motion: reduce) {
  .clt-tab, .clt-row { transition: none; }
  .clt-tab:active { transform: none; opacity: 1; }
}

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

/* ── Ligue Révision (dimension autonomie — visuellement distincte) ── */
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

/* ── Raccourci quiz : bouton glass brillant + focus « lacunes » ── */
.clt-quiz-cta { margin-top: 16px; }
.clt-glass-btn {
  position: relative; overflow: hidden;
  width: 100%; min-height: 52px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  padding: 14px 20px; border-radius: var(--r); box-sizing: border-box;
  border: 1px solid color-mix(in srgb, #fff 28%, var(--a));
  background: linear-gradient(135deg, color-mix(in srgb, var(--a) 80%, transparent), color-mix(in srgb, var(--adk) 90%, transparent));
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  color: #fff; font: 800 15px/1 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  box-shadow:
    0 8px 24px -6px color-mix(in srgb, var(--adk) 55%, transparent),
    inset 0 1px 0 rgba(255,255,255,.42),
    inset 0 -1px 0 rgba(0,0,0,.12);
  transition: transform .14s var(--ease-snap), box-shadow .2s;
}
.clt-glass-btn:active { transform: scale(.98); }
.clt-glass-ico { display: inline-flex; filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }
.clt-glass-lbl { text-shadow: 0 1px 2px rgba(0,0,0,.22); }
/* Reflet qui balaie le bouton — l'effet « brillant » */
.clt-glass-sheen {
  position: absolute; top: 0; left: -60%; width: 45%; height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent);
  transform: skewX(-18deg); pointer-events: none;
  animation: cltSheen 3.6s ease-in-out infinite;
}
@keyframes cltSheen {
  0% { left: -60%; }
  35% { left: 130%; }
  100% { left: 130%; }
}
@media (prefers-reduced-motion: reduce) { .clt-glass-sheen { animation: none; opacity: 0; } }

/* Toggle « cibler ce que je n'ai pas réussi » */
.clt-quiz-focus {
  display: flex; align-items: center; gap: 10px;
  margin-top: 11px; padding: 4px 2px; cursor: pointer;
  -webkit-tap-highlight-color: transparent; position: relative;
}
.clt-quiz-focus input { position: absolute; opacity: 0; width: 0; height: 0; }
.clt-quiz-focus-box {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 6px;
  border: 1.5px solid var(--bo); background: var(--bg2);
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; transition: background .15s, border-color .15s, transform .12s;
}
.clt-quiz-focus-box svg { opacity: 0; transition: opacity .12s; }
.clt-quiz-focus input:checked + .clt-quiz-focus-box { background: var(--a); border-color: var(--a); transform: scale(1.05); }
.clt-quiz-focus input:checked + .clt-quiz-focus-box svg { opacity: 1; }
.clt-quiz-focus input:focus-visible + .clt-quiz-focus-box { outline: 2px solid var(--a); outline-offset: 2px; }
.clt-quiz-focus-lbl { font: 500 13px/1.3 'Inter', sans-serif; color: var(--mu); }

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
.clt-th-help:hover span, .clt-th-help:active span { color: var(--a-txt); border-color: var(--a); }
/* Légende « Comment gagner des points ? » */
.clt-th-how-ttl {
  width: 100%; font: 700 11px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu); margin-bottom: 2px;
}
/* ── « Comment je gagne des points ? » — version simple (2 lignes) ── */
.clt-how { margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--bo2); }
.clt-how-ttl {
  font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  margin-bottom: 10px;
}
.clt-how-row {
  display: flex; align-items: center; gap: 10px; padding: 5px 0;
  font: 500 14px/1.2 'Inter', sans-serif; color: var(--ink5);
}
.clt-how-lbl { flex: 1; min-width: 0; }
.clt-how-row b { font: 800 14px/1 'Plus Jakarta Sans', sans-serif; color: var(--a-txt); flex-shrink: 0; }
.clt-how-ico {
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.clt-how-ico.ok { background: rgba(16,185,129,.14); color: var(--grdk); }
.clt-how-ico.ex { background: color-mix(in srgb, var(--a) 14%, transparent); color: var(--a-txt); }
.clt-mine-pts {
  margin-top: 12px; font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu2);
}
.clt-mine-pts strong { color: var(--ink); font-weight: 700; }

/* ── Hall of Fame (lauréats permis) ── */
.clt-hof-title {
  display: flex; align-items: center; gap: 8px;
  margin: 22px 16px 0; padding-bottom: 6px;
  font: 700 11px/1 'Inter', sans-serif; text-transform: uppercase; letter-spacing: .1em;
  color: var(--mu2);
}
.clt-hof-title::after { content: ''; flex: 1; height: 1px; background: var(--bo); }
.clt-hof-row {
  display: flex; align-items: center; gap: 12px;
  margin: 6px 16px 0; padding: 11px 14px;
  background: color-mix(in srgb, var(--a) 6%, var(--su));
  border: 1px solid color-mix(in srgb, var(--a) 22%, var(--bo));
  border-radius: var(--r-md);
}
.clt-hof-row.me { border-color: #6366f1; }
.clt-hof-badge {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;
  font: 700 11px/1 'Inter', sans-serif; color: var(--a-txt);
  background: color-mix(in srgb, var(--a) 14%, transparent);
  padding: 4px 8px; border-radius: var(--r-full);
}

/* ── Podium top-3 ── */
.clt-podium {
  display: flex; align-items: flex-end; justify-content: center;
  gap: 8px; padding: 14px 16px 18px;
}
.clt-pod {
  flex: 1; max-width: 33.33%; min-width: 0;
  display: flex; flex-direction: column; align-items: center;
}
.clt-pod-av {
  position: relative; border-radius: 50%; padding: 3px;
  background: var(--ring, var(--bo));
  box-shadow: 0 5px 14px -4px color-mix(in srgb, var(--ring, var(--mu2)) 60%, transparent);
}
.clt-pod.me .clt-pod-av { box-shadow: 0 0 0 2.5px #6366f1, 0 5px 14px -4px color-mix(in srgb, var(--ring) 55%, transparent); }
.clt-pod-medal {
  position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--ring); color: #fff; border: 2.5px solid var(--su);
  display: flex; align-items: center; justify-content: center;
  font: 800 11px/1 'Plus Jakarta Sans', sans-serif;
}
.clt-pod-name {
  font: 700 12px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink);
  margin: 11px 0 0; text-align: center; max-width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.clt-pod.me .clt-pod-name { color: var(--a-txt); }
.clt-pod-base {
  width: 100%; margin-top: 8px; border-radius: 12px 12px 0 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,.3);
}
.clt-pod-1 .clt-pod-base { height: 76px; background: linear-gradient(180deg,#fcd34d,#f59e0b); }
.clt-pod-2 .clt-pod-base { height: 56px; background: linear-gradient(180deg,#e2e8f0,#94a3b8); }
.clt-pod-3 .clt-pod-base { height: 44px; background: linear-gradient(180deg,#fcd9a8,#c08434); }
.clt-pod-score { font: 800 16px/1 'Plus Jakarta Sans', sans-serif; }
.clt-pod-score span { font-size: 10px; font-weight: 600; opacity: .85; margin-left: 1px; }

/* ── Rangs épurés (au-delà du podium) ── */
.clt-row2 {
  display: flex; align-items: center; gap: 12px;
  background: var(--su); border: 1px solid var(--bo);
  border-left: 3px solid var(--lc, var(--bo));
  border-radius: var(--r-md); padding: 9px 13px;
}
.clt-row2.me { border-color: #6366f1; border-left-color: #6366f1; background: rgba(99,102,241,.06); }
.clt-rank2 {
  flex-shrink: 0; min-width: 22px; text-align: center;
  font: 700 13px/1 'IBM Plex Mono', monospace; color: var(--mu2);
}
.clt-row2 .clt-name { flex: 1; }
.clt-score2 {
  flex-shrink: 0; font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); display: flex; align-items: baseline; gap: 2px;
}
.clt-score2 span { font: 600 10px/1 'Inter', sans-serif; color: var(--mu2); }
</style>`;

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root, initialTab) {
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

  const [ecoleRes, nationalRes, theorieRes, hofRes] = await Promise.all([
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
    // Hall of Fame : lauréats (permis obtenu) de l'école — prénom réel.
    sb.rpc("get_hall_of_fame", { p_scope: "ecole", p_limit: 100 }).then(
      (r) => r,
      () => ({ data: null, error: true }),
    ),
  ]);

  const data = {
    ecole: ecoleRes.data || [],
    national: nationalRes.data || [],
    theorie: theorieRes.data || [],
    hof: hofRes.data || [],
  };

  // Onglet initial : deep-link depuis l'accueil (#/classement/revision →
  // ligue Révision, #/classement/ecole → Mon école). Défaut = Mon école.
  const TAB_MAP = {
    ecole: "ecole",
    national: "national",
    revision: "theorie", // clé interne historique
    theorie: "theorie",
  };
  let scope = TAB_MAP[initialTab] || "ecole";
  root.innerHTML = `${STYLE}${_render(scope, data)}`;
  _wire(root, data, (s) => {
    scope = s;
  });
  // Deep-link direct sur la ligue Révision → tuto si jamais vu.
  if (scope === "theorie") maybeShowTheoryTuto();
}

// ─── Lexique partagé (cohérence avec l'accueil) ──────────────────
const SCOPE_DESC = {
  ecole: "Chaque compétence validée avec ton moniteur te fait grimper.",
  theorie: "Plus tu fais de quiz, plus tu montes.",
  national: "Le classement national de tous les élèves PermiGo.",
};

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
      : `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("target", { size: 14 })}</span>Ta première validation te classe ici.</div>`;
    void totalKnown;
  }

  return `
<div class="clt">
  <div class="clt-hd">
    <h1 class="clt-title">Classement</h1>
    ${pill}
    <div class="clt-tabs">
      <button class="clt-tab ${scope === "ecole" ? "on" : ""}" data-scope="ecole">${icon("trophy", { size: 13, strokeWidth: 2 })} Conduite</button>
      <button class="clt-tab ${scope === "theorie" ? "on" : ""}" data-scope="theorie">${icon("zap", { size: 13, strokeWidth: 2 })} Révision</button>
      <button class="clt-tab ${scope === "national" ? "on" : ""}" data-scope="national">National</button>
    </div>
    <p id="clt-scope-desc" class="clt-scope-desc">${SCOPE_DESC[scope] ?? ""}</p>
  </div>
  <div id="clt-body">${_renderBody(scope, rows, data.hof)}</div>
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

function _renderBody(scope, rows, hof) {
  if (scope === "semaine") return _renderLeagueBody(rows);
  if (scope === "theorie") return _renderTheoryBody(rows);
  return _renderAllTimeBody(rows, scope, hof);
}

// ── Hall of Fame (lauréats — prénom seul, ni rang ni pseudo ni « Toi ») ──
function _hofSection(hof) {
  if (!hof || hof.length === 0) return "";
  const rows = hof
    .map(
      (g) => `
    <div class="clt-hof-row${g.is_me ? " me" : ""}">
      <div class="clt-av">${renderUserAvatar({ avatar_url: g.avatar, prenom: g.prenom }, 34)}</div>
      <div class="clt-name">${esc(fmtName(g.prenom))}</div>
      <span class="clt-hof-badge">${icon("award", { size: 12, strokeWidth: 2.4 })} Permis obtenu</span>
    </div>`,
    )
    .join("");
  return `
    <div class="clt-hof-title">${icon("award", { size: 13, strokeWidth: 2.2 })} Hall of Fame — permis obtenu</div>
    <div class="clt-list">${rows}</div>`;
}

// ── Pill théorie ─────────────────────────────────────────────────
function _theoryPill(mine) {
  const info = theoryLeague(mine?.score ?? 0);
  return info.league
    ? `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("zap", { size: 14 })}</span>Ligue ${esc(info.league.name)} · ${mine?.score ?? 0} pts</div>`
    : `<div class="clt-mepill"><span class="clt-mepill-ico">${icon("zap", { size: 14 })}</span>Ton premier quiz t'ouvre la ligue</div>`;
}

// ── « Comment je gagne des points ? » — langage simple, 2 lignes ──
function _theoryHowLegend() {
  return `
    <div class="clt-how">
      <div class="clt-how-ttl">Comment je gagne des points&nbsp;?</div>
      <div class="clt-how-row">
        <span class="clt-how-ico ok">${icon("check", { size: 14, strokeWidth: 3 })}</span>
        <span class="clt-how-lbl">1 quiz réussi</span>
        <b>+${THEORY_PTS.quiz} pt</b>
      </div>
      <div class="clt-how-row">
        <span class="clt-how-ico ex">${icon("zap", { size: 13, strokeWidth: 2.6 })}</span>
        <span class="clt-how-lbl">1 examen blanc réussi</span>
        <b>+${THEORY_PTS.exam} pts</b>
      </div>
    </div>`;
}

function _theoryHelpBtn() {
  return `<button class="clt-th-help" id="clt-th-help" type="button" aria-label="Revoir comment fonctionne la ligue Révision"><span aria-hidden="true">?</span></button>`;
}

// ── Raccourci quiz (bouton glass) ────────────────────────────────
// Lance l'enchaînement révision direct. withFocus → toggle « lacunes »
// (sentinel "unseen" : ne pioche que les compétences pas encore réussies).
function _theoryQuizCta(label, withFocus) {
  return `
  <div class="clt-quiz-cta">
    <button class="clt-glass-btn" id="clt-quiz-go" type="button">
      <span class="clt-glass-sheen" aria-hidden="true"></span>
      <span class="clt-glass-ico">${icon("zap", { size: 18, strokeWidth: 2.4 })}</span>
      <span class="clt-glass-lbl">${esc(label)}</span>
    </button>
    ${
      withFocus
        ? `<label class="clt-quiz-focus">
      <input type="checkbox" id="clt-quiz-unseen" />
      <span class="clt-quiz-focus-box" aria-hidden="true">${icon("check", { size: 12, strokeWidth: 3 })}</span>
      <span class="clt-quiz-focus-lbl">Cibler ce que je n'ai pas encore réussi</span>
    </label>`
        : ""
    }
  </div>`;
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
        <div class="clt-rl-lbl">Classement révision</div>
        <div class="clt-rl-name">Fais un quiz pour entrer au classement.</div>
      </div>
      ${_theoryHelpBtn()}
    </div>
    <div class="clt-rl-prog">Plus tu fais de quiz, plus tu montes. Chaque quiz réussi rapporte des points.</div>
    ${_theoryQuizCta("Faire mon premier quiz", false)}
    ${_theoryHowLegend()}
  </div>`;
  }

  const L = info.league;
  const dots = THEORY_LEAGUES.map((l) => {
    const cls =
      sc >= l.startAt ? (l.n === L.n && !info.top ? "cur" : "done") : "";
    return `<div class="clt-rl-dot ${cls}" style="--dc:${l.color}"></div>`;
  }).join("");
  const progText = info.top
    ? "Révision maîtrisée — montre ça à ton moniteur en leçon"
    : `Encore <strong>${info.toNext}</strong> pt${info.toNext > 1 ? "s" : ""} avant la Ligue ${info.next.n} — ${esc(info.next.name)}`;
  return `
  <div class="clt-rl-hero clt-th-hero" style="--lc:${L.color}">
    <div class="clt-rl-top">
      <div class="clt-rl-medal">${info.top ? "★" : L.n}</div>
      <div class="clt-rl-info">
        <div class="clt-rl-lbl">Ta ligue révision</div>
        <div class="clt-rl-name">Ligue ${L.n} — ${esc(L.name)}</div>
      </div>
      ${_theoryHelpBtn()}
    </div>
    <div class="clt-rl-prog">${progText}</div>
    <div class="clt-rl-track">${dots}</div>
    ${_theoryQuizCta("Faire un quiz", true)}
    ${_theoryHowLegend()}
    ${
      nComp || nExams
        ? `<div class="clt-mine-pts">Déjà <strong>${nComp} quiz réussi${nComp > 1 ? "s" : ""}</strong>${nExams ? ` et ${nExams} examen${nExams > 1 ? "s" : ""} blanc${nExams > 1 ? "s" : ""}` : ""}.</div>`
        : ""
    }
  </div>`;
}

// ── Podium top-3 (partagé École + Révision) ──────────────────────
// Couleurs de médaille par rang ; l'ordre visuel place le 1er au centre.
const PODIUM = {
  1: { ring: "#f59e0b", cls: "clt-pod-1" },
  2: { ring: "#94a3b8", cls: "clt-pod-2" },
  3: { ring: "#c08434", cls: "clt-pod-3" },
};
function _podium(top3, fmtScore) {
  const byRang = {};
  top3.forEach((r) => {
    byRang[r.rang] = r;
  });
  const order = [byRang[2], byRang[1], byRang[3]]; // 2 · 1 · 3
  return `<div class="clt-podium">${order
    .map((r) => {
      if (!r) return `<div class="clt-pod" aria-hidden="true"></div>`;
      const p = PODIUM[r.rang];
      return `
      <div class="clt-pod ${p.cls} ${r.is_me ? "me" : ""}">
        <div class="clt-pod-av" style="--ring:${p.ring}">
          ${renderUserAvatar({ avatar_url: r.avatar, prenom: r.display_name }, 48)}
          <span class="clt-pod-medal" aria-label="Rang ${r.rang}">${r.rang}</span>
        </div>
        <div class="clt-pod-name">${r.is_me ? "Toi" : esc(r.display_name)}</div>
        <div class="clt-pod-base"><span class="clt-pod-score">${fmtScore(r)}</span></div>
      </div>`;
    })
    .join("")}</div>`;
}

// ── Rang épuré : un seul accent (ligue en trait latéral), score neutre ──
function _epureRow(r, scoreHtml, leagueColor) {
  return `
  <div class="clt-row2 ${r.is_me ? "me" : ""}" style="--lc:${leagueColor}">
    <div class="clt-rank2" aria-label="Rang ${r.rang}">${r.rang}</div>
    <div class="clt-av">${renderUserAvatar({ avatar_url: r.avatar, prenom: r.display_name }, 32)}</div>
    <div class="clt-name">${esc(r.display_name)}</div>
    ${r.is_me ? '<span class="clt-me-tag">Toi</span>' : ""}
    <div class="clt-score2">${scoreHtml}</div>
  </div>`;
}

// Construit podium + liste épurée à partir des lignes triées (rang asc).
function _rankedBody(top, mine, meOutside, fmtScore, leagueColorOf) {
  const podiumRows = top.slice(0, 3);
  const hasPodium = podiumRows.length >= 3;
  const podiumHtml = hasPodium ? _podium(podiumRows, fmtScore) : "";
  const listRows = hasPodium ? top.slice(3) : top;
  let html = `${podiumHtml}<div class="clt-list">${listRows
    .map((r) => _epureRow(r, fmtScore(r), leagueColorOf(r)))
    .join("")}</div>`;
  if (meOutside) {
    html += `<div class="clt-sep">· · ·</div><div class="clt-list">${_epureRow(mine, fmtScore(mine), leagueColorOf(mine))}</div>`;
  }
  return html;
}

// ── Corps ligue Révision ─────────────────────────────────────────
function _renderTheoryBody(rows) {
  const mine = _myRow(rows);
  const hero = _theoryLeagueHero(mine);
  const active = rows.filter((r) => r.score > 0);

  if (active.length < 2) {
    return `${hero}<div class="clt-empty">
      <div class="clt-empty-ico">${icon("zap", { size: 30 })}</div>
      <div class="clt-empty-txt">Le classement s'anime dès que deux élèves ont des points révision.</div>
    </div>`;
  }

  const top = active
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const meOutside = mine && mine.rang > LIMIT;
  const fmtScore = (r) => `${r.score}<span>pts</span>`;
  const leagueColorOf = (r) => {
    const info = theoryLeague(r.score);
    return info.league?.color || "var(--bo)";
  };
  return `${hero}${_rankedBody(top, mine, meOutside, fmtScore, leagueColorOf)}`;
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
        <div class="clt-rl-lbl">Classement avec ton moniteur</div>
        <div class="clt-rl-name">${info.elite ? "Élite · Prêt pour l'examen" : `Ligue ${L.n} — ${esc(L.name)}`}</div>
      </div>
    </div>
    <div class="clt-rl-prog">${progText}</div>
    <div class="clt-rl-track">${dots}</div>
  </div>`;
}

// ── Corps classement all-time ─────────────────────────────────────
function _renderAllTimeBody(rows, scope, hof) {
  // Hall of Fame : seulement sur l'onglet « Mon école » (données école-scoped).
  const hofHtml = scope === "ecole" ? _hofSection(hof) : "";
  const active = rows.filter((r) => r.score > 0).length;
  if (active < 2) {
    const inviteHtml = !_myRow(rows)
      ? `<div style="margin-top:14px;font:600 13px/1.4 'Inter',sans-serif;color:var(--a-txt)">Ta première validation te classe ici.</div>`
      : "";
    return `<div class="clt-empty">
      <div class="clt-empty-ico">${icon("target", { size: 30 })}</div>
      <div class="clt-empty-txt">Le classement apparaît dès que deux élèves ont validé une compétence avec leur moniteur.</div>
      ${inviteHtml}
    </div>${hofHtml}`;
  }

  const top = rows
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const mine = _myRow(rows);
  const meOutside = mine && mine.rang > LIMIT;
  const fmtScore = (r) => `${r.score}<span>/31</span>`;
  const leagueColorOf = (r) => {
    const info = remcLeague(r.score);
    return info.elite ? "#f59e0b" : info.league.color;
  };
  return `${_remcLeagueHero(mine)}${_rankedBody(top, mine, meOutside, fmtScore, leagueColorOf)}${hofHtml}`;
}

// ─── Wire ────────────────────────────────────────────────────────
function _wire(root, data, setScope) {
  // « ? » du hero théorie (délégation : le body est re-rendu via innerHTML)
  root.addEventListener("click", (e) => {
    if (e.target.closest("#clt-th-help")) {
      playClick();
      showTheoryTuto();
      return;
    }
    // Raccourci « Faire un quiz » → enchaînement révision direct.
    if (e.target.closest("#clt-quiz-go")) {
      const unseen = !!root.querySelector("#clt-quiz-unseen")?.checked;
      haptic("tap");
      playClick();
      track("revision_quiz.shortcut", { focus: unseen ? "unseen" : "mixte" });
      // Sentinel "unseen" = cible les compétences pas encore réussies.
      location.hash = `#/quiz/${unseen ? "unseen" : "next"}/post_validation/revision/${Date.now()}`;
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
            : `<span class="clt-mepill-ico">${icon("target", { size: 14 })}</span>Ta première validation te classe ici.`;
        }
      }

      const desc = root.querySelector("#clt-scope-desc");
      if (desc) desc.textContent = SCOPE_DESC[next] ?? "";

      const body = root.querySelector("#clt-body");
      if (body) {
        body.innerHTML = _renderBody(next, rows, data.hof);
        playPop();
      }
      track("classement.scope_changed", { scope: next });

      // 1er passage sur l'onglet Théorie → tuto (re-consultable via « ? »)
      if (next === "theorie") maybeShowTheoryTuto();
    });
  });
}
