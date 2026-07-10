// ═══════════════════════════════════════════════════════════════
// Enseignant — Ligue de la semaine — DA Arcade Routière v2
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
  msToNextMonday,
  fmtCountdown,
} from "@/utils/league-shared.js";
import { medallion } from "@/utils/medallions.js";

// ─── CSS ─────────────────────────────────────────────────────
const STYLE = `<style>
${LEAGUE_CSS}
.ls-w {
  max-width: 580px; margin: 0 auto;
  padding-bottom: 100px;
  background: var(--bg); color: var(--ink);
  font-family: var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
}

/* ── Header navigation ── */
.ls-w-hd {
  padding: 18px 16px 16px;
  background: var(--su); border-bottom: 1px solid var(--bo);
  display: flex; align-items: center; gap: 12px;
}
.ls-w-back {
  width: 44px; height: 44px; border-radius: var(--ens-r, 16px);
  border: 1.5px solid var(--bo4); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0;
  transition: background .15s, border-color .15s, transform .15s;
  -webkit-tap-highlight-color: transparent;
}
.ls-w-back:hover { background: var(--bg2); border-color: var(--bo4); }
.ls-w-back:active { background: var(--bg2); transform: scale(.97); }
.ls-w-back:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .ls-w-back { transition: none; } }
.ls-w-hd-info { flex: 1; }
.ls-w-title {
  font: 700 17px/1.2 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink); letter-spacing: -.015em;
}
.ls-w-sub { font: 500 12px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: var(--mu2); margin-top: 3px; }

/* ── Hero arcade (panneaux routiers en fond) ── */
.ls-w-hero-wrap {
  position: relative; overflow: hidden;
  margin: 16px 16px 0;
  padding: 20px;
  background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
  border-radius: var(--ens-r-lg, 22px);
  color: #fff;
  box-shadow: var(--ens-shadow, var(--s2));
  isolation: isolate;
}
/* liseré marquage au sol */
.ls-w-hero-wrap::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; z-index: 1;
  background: none;
  opacity: .75; border-radius: 0 0 var(--ens-r-lg, 22px) var(--ens-r-lg, 22px);
}
.ls-w-hero-inner { position: relative; z-index: 2; }
.ls-w-hero-top {
  display: flex; align-items: flex-start; gap: 14px;
}
.ls-w-hero-illus { flex-shrink: 0; }
.ls-w-hero-text { flex: 1; min-width: 0; }
.ls-w-hero-kicker {
  font: 700 11px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  text-transform: uppercase; letter-spacing: .12em;
  color: rgba(255,255,255,.6); margin: 0 0 5px;
}
.ls-w-hero-title {
  font: 700 22px/1.08 var(--ens-display, 'Fredoka'), sans-serif;
  color: #fff; letter-spacing: -.02em; margin: 0 0 8px;
}
.ls-w-hero-badge { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ls-w-countdown {
  display: inline-flex; flex-direction: column; gap: 2px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  border-radius: var(--ens-r-pill, 999px); padding: 6px 12px;
}
.ls-w-countdown-lbl { font: 600 10px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .06em; }
.ls-w-countdown-val { font: 700 13px/1 'IBM Plex Mono', monospace; color: #fff; }

/* ── Sélecteur de portée (National / Mon école) ── */
.ls-w-scope {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
  margin: 14px 16px 0; padding: 4px;
  background: var(--bg2); border: 1.5px solid var(--bo);
  border-radius: var(--ens-r-pill, 999px);
}
.ls-w-scope button {
  border: none; border-radius: 999px; padding: 10px 12px; min-height: 40px;
  background: transparent; color: var(--mu2);
  font: 700 13px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background .15s, color .15s;
}
.ls-w-scope button.on {
  background: #4f46e5; color: #fff;
  box-shadow: 0 2px 8px -2px rgba(79,70,229,.5);
}
.ls-w-scope button:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .ls-w-scope button { transition: none; } }

/* Ligues header dans la liste */
.ls-w-league-hd {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 0 5px;
  font: 700 10px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--mu2);
}
.ls-w-league-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* Liste classement */
.ls-w-list { padding: 12px 16px 0; display: flex; flex-direction: column; gap: 6px; }

/* Empty states */
.ls-w-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 24px; text-align: center; color: var(--mu2);
}
.ls-w-empty-txt { font: 500 13px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; max-width: 30ch; }

/* Row override — top 3 mise en valeur */
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
  border: 1.5px solid var(--bo);
  border-radius: var(--ens-r-lg, 22px);
  box-shadow: var(--ens-shadow, var(--s1));
  display: flex; flex-direction: column; gap: 10px;
}
.ls-w-motivation-title {
  font: 700 14px/1.3 var(--ens-display, 'Fredoka'), sans-serif;
  color: var(--ink); letter-spacing: -.01em;
}
.ls-w-motivation-sub {
  font: 500 12px/1.5 var(--ens-body, 'Plus Jakarta Sans'), sans-serif;
  color: var(--mu2);
}
/* CTA vert arcade */
.ls-w-motivation-cta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 14px; border: none; border-radius: var(--ens-r, 16px);
  background: linear-gradient(180deg, #6d6bff, #4f46e5);
  color: var(--ens-ink-go, #07150c);
  font: 700 14px/1 var(--ens-body, 'Plus Jakarta Sans'), sans-serif; cursor: pointer;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 0 color-mix(in srgb, #4f46e5 60%, #000), var(--ens-shadow, var(--s0));
  transition: transform .1s ease, box-shadow .1s ease;
}
.ls-w-motivation-cta:active { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, #4f46e5 60%, #000); }
.ls-w-motivation-cta:focus-visible { outline: 3px solid #4f46e5; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .ls-w-motivation-cta, .ls-w-back { transition: none; }
}

</style>`;

/**
 * Fetch RPC get_league_leaderboard pour un scope donné ('national'|'ecole').
 * Exportée : réutilisée telle quelle par le hub « Mon blason » (aperçu ligue,
 * chantier nav simplifiée) — même requête, même p_limit, zéro duplication de
 * la mécanique RPC (pattern déjà suivi par relances.js → mes-eleves.js).
 * @param {'national'|'ecole'} scope
 * @returns {Promise<Array>} lignes du classement (peut être vide)
 */
export async function fetchLeagueLeaderboard(scope) {
  const { data, error } = await sb.rpc("get_league_leaderboard", {
    p_role: "enseignant",
    p_limit: 50,
    p_scope: scope,
  });
  if (error) throw error;
  return data || [];
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me || me.role !== "enseignant") return;

  track("page_view", { page: "ligue_semaine_enseignant" });

  // Portée par défaut : national — le moniteur indépendant est seul
  // dans son école, le classement ne prend vie qu'avec tous les inscrits.
  _renderSkeleton(root);
  await _load(root, "national");
}

function _renderSkeleton(root) {
  root.innerHTML = `${STYLE}
<div class="ls-w anim-slide-up">
  <div class="ls-w-hd">
    <button class="ls-w-back" id="ls-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
    <div class="ls-w-hd-info">
      <div class="ls-w-title" tabindex="-1">Ligue de la semaine</div>
      <div class="ls-w-sub">1 pt = 1 compétence validée · remise à zéro chaque lundi</div>
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
    navigate("#/mon-blason");
  });
}

async function _load(root, scope) {
  try {
    const rows = await fetchLeagueLeaderboard(scope);
    _render(root, rows, scope);
  } catch (e) {
    console.error("[ligue-semaine]", e);
    toast("« Ligue » indisponible", "error");
    _renderEmpty(root);
  }
}

// ─── Render ──────────────────────────────────────────────────
function _render(root, rows, scope) {
  const mine = rows.find((r) => r.is_me) || null;
  const myPts = mine?.weekly_pts ?? 0;
  const myLeague = getLeague(myPts);
  const myRank = mine?.rank_pos ?? null;
  const countdown = fmtCountdown(msToNextMonday());

  // Seuils min pour remonter de ligue
  const myLeagueIdx = myLeague
    ? LEAGUES.findIndex((l) => l.id === myLeague.id)
    : LEAGUES.length;
  const prevLeague = myLeagueIdx > 0 ? LEAGUES[myLeagueIdx - 1] : null;
  const ptsToNext = prevLeague ? prevLeague.minPts - myPts : 0;

  // Hero allégé : rang + badge de ligue (avec les points) + remise à zéro.
  // Le titre « Ligue de la semaine » est déjà dans le header juste au-dessus,
  // les points sont déjà dans le badge, et « 1 pt = 1 validation » vit dans
  // le sous-titre du header → on ne les répète plus ici.
  const hero = `
  <div class="ls-w-hero-wrap">
    <div class="ls-w-hero-inner">
      <div class="ls-w-hero-top">
        <div class="ls-w-hero-illus">${medallion("trophee", "gold", { size: 56, glow: true })}</div>
        <div class="ls-w-hero-text">
          <p class="ls-w-hero-kicker">Classement hebdo · ${scope === "national" ? "France entière" : "Mon école"}</p>
          <h1 class="ls-w-hero-title">${myRank ? `Tu es #${myRank} cette semaine` : "Marque ton premier point"}</h1>
          <div class="ls-w-hero-badge">
            ${renderLeagueBadge(myLeague, myPts, "md")}
            <div class="ls-w-countdown">
              <span class="ls-w-countdown-lbl">Remise à zéro dans</span>
              <span class="ls-w-countdown-val">${esc(countdown)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Sélecteur de portée — même mécanique que le classement élève
  const scopeBar = `
  <div class="ls-w-scope" role="group" aria-label="Portée du classement">
    <button data-scope="national" aria-pressed="${scope === "national"}" class="${scope === "national" ? "on" : ""}">National</button>
    <button data-scope="ecole" aria-pressed="${scope === "ecole"}" class="${scope === "ecole" ? "on" : ""}">Mon école</button>
  </div>`;

  // Liste avec séparateurs par ligue
  let listHtml = "";
  if (rows.length === 0) {
    listHtml = `<div class="ls-w-empty">
      ${medallion("cone", "orange", { size: 48 })}
      <div class="ls-w-empty-txt">${scope === "national" ? "Aucun moniteur n'a encore marqué de point cette semaine. Enregistre une séance pour prendre la tête." : "Aucune compétence validée cette semaine. Enregistre une séance pour marquer ton premier point."}</div>
    </div>`;
  } else {
    const sorted = [...rows].sort((a, b) => b.weekly_pts - a.weekly_pts);
    let prevLeagueId = null;
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
      const rankPos = entry.rank_pos ?? 0;
      listHtml += `<div data-rank="${rankPos}">${renderLeagueRow(entry, true)}</div>`;
    }
  }

  // Motivation CTA (vert arcade)
  const motiv =
    prevLeague && ptsToNext > 0
      ? `<div class="ls-w-motivation">
        <div class="ls-w-motivation-title">Plus que ${ptsToNext} validation${ptsToNext > 1 ? "s" : ""} pour passer en Ligue ${esc(prevLeague.name)}</div>
        <div class="ls-w-motivation-sub">Chaque compétence validée avec un élève compte pour un point cette semaine.</div>
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
${scopeBar}
<div class="ls-w-list">${listHtml}</div>
${motiv}
</div>`;

  root.querySelector("#ls-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/mon-blason");
  });
  root.querySelector("#ls-seance-cta")?.addEventListener("click", () => {
    haptic("impact");
    navigate("#/log-session");
  });
  root.querySelectorAll(".ls-w-scope button").forEach((b) => {
    b.addEventListener("click", () => {
      const next = b.dataset.scope;
      if (next === scope) return;
      haptic("tap");
      track("ligue_moniteur.scope", { scope: next });
      _renderSkeleton(root);
      _load(root, next);
    });
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
  ${medallion("cone", "orange", { size: 48 })}
  <div class="ls-w-empty-txt">Vérifie ta connexion, puis réessaie.</div>
</div>
</div>`;
  root.querySelector("#ls-back")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/mon-blason");
  });
}
