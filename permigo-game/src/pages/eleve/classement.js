// ═══════════════════════════════════════════════════════════════
// Classement élève — « Arène Podium » (skin partagé arene-rank.js)
//  - Ligue Conduite = REMC (validations moniteur, /31) · portée Mon école / National
//  - Ligue Révision = effort solo (quiz + examens blancs, /50), cf. theory-league.js
// Deep-link : #/classement/ecole | /national | /revision
// Aucun nom réel exposé hors Hall of Fame : pseudo ou « Apprenti ».
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { icon } from "@/utils/icons.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { playPop, playClick } from "@/utils/sound.js";
import { haptic } from "@/utils/haptic.js";
import { fmtName } from "@/utils/fmt-name.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { THEORY_LEAGUES, theoryLeague } from "@/utils/theory-league.js";
import {
  showTheoryTuto,
  maybeShowTheoryTuto,
} from "@/components/eleve/theory-tuto.js";
import {
  ARENE_CSS,
  areneAccent,
  arenePodium,
  areneRow,
  areneMeRow,
  arenePaliers,
} from "@/components/common/arene-rank.js";

const LIMIT = 50;

// ─── Paliers Conduite (REMC, /31) — 4 mondes, échelle accent ──────
// endAt = score atteint quand le monde est terminé.
const REMC_LEAGUES = [
  {
    id: "C1",
    name: "Maîtrise véhicule",
    endAt: 9,
    color: "color-mix(in srgb, var(--acc) 50%, #fff)",
  },
  {
    id: "C2",
    name: "Circulation",
    endAt: 17,
    color: "color-mix(in srgb, var(--acc) 78%, #fff)",
  },
  { id: "C3", name: "Conditions diff.", endAt: 24, color: "var(--acc)" },
  { id: "C4", name: "Conduite autonome", endAt: 31, color: "var(--acc-dk)" },
];

// Accent de l'arène par ligue : Conduite suit l'accent choisi de l'app
// (var(--a)…), Révision est en bleu (échelle théorie monochrome).
const CONDUITE_ACCENT =
  "--acc:var(--a);--acc-lt:var(--a-lt);--acc-dk:var(--adk)";
const REVISION_ACCENT = areneAccent("bleu");

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root, initialTab) {
  const me = getCurUser();
  if (!me) return;
  track("page_view", { page: "classement", user_role: me.role });

  root.innerHTML = `${ARENE_CSS}<div class="arn" style="${CONDUITE_ACCENT}">
    <div class="arn-hd"><h1>Classement</h1><p class="arn-sub">Chargement…</p></div>
    <div class="arn-list">${Array.from({ length: 5 })
      .map(
        () =>
          `<div class="arn-row" style="opacity:.4"><span class="arn-rk"></span><span class="arn-nm"></span></div>`,
      )
      .join("")}</div>
  </div>`;

  const [ecoleRes, nationalRes, theorieRes, hofRes] = await Promise.all([
    sb.rpc("get_eleve_leaderboard", { p_scope: "ecole", p_limit: LIMIT }).then(
      (r) => r,
      () => ({ data: null }),
    ),
    sb
      .rpc("get_eleve_leaderboard", { p_scope: "national", p_limit: LIMIT })
      .then(
        (r) => r,
        () => ({ data: null }),
      ),
    sb.rpc("get_theory_leaderboard", { p_scope: "ecole", p_limit: LIMIT }).then(
      (r) => r,
      () => ({ data: null }),
    ),
    sb.rpc("get_hall_of_fame", { p_scope: "ecole", p_limit: 100 }).then(
      (r) => r,
      () => ({ data: null }),
    ),
  ]);

  const data = {
    ecole: ecoleRes.data || [],
    national: nationalRes.data || [],
    theorie: theorieRes.data || [],
    hof: hofRes.data || [],
  };

  // État : ligue (conduite|revision) + portée (ecole|national, Conduite only).
  const DEEP = {
    ecole: { ligue: "conduite", scope: "ecole" },
    national: { ligue: "conduite", scope: "national" },
    revision: { ligue: "revision", scope: "ecole" },
    theorie: { ligue: "revision", scope: "ecole" },
  };
  const state = DEEP[initialTab] || { ligue: "conduite", scope: "ecole" };

  const rerender = () => {
    root.innerHTML = `${ARENE_CSS}${_renderArena(state, data)}`;
    _wire(root, state, data, rerender);
  };
  rerender();
  if (state.ligue === "revision") maybeShowTheoryTuto();
}

// ─── Helpers données ─────────────────────────────────────────────
const OF = { conduite: 31, revision: 50 };

function _rowsFor(state, data) {
  if (state.ligue === "revision") return data.theorie;
  return state.scope === "national" ? data.national : data.ecole;
}
function _myRow(rows) {
  return rows.find((r) => r.is_me === true) || null;
}
function _fmtScore(ligue) {
  const of = OF[ligue];
  return (r) => `${r.score ?? 0}<span class="of">/${of}</span>`;
}

// Palier courant (pour la ligne « Toi ») + rail des paliers.
function _paliersData(ligue, score) {
  const s = Math.max(0, score || 0);
  if (ligue === "revision") {
    const items = THEORY_LEAGUES.map((l) => ({
      short: String(l.startAt),
      name: l.name,
    }));
    const done = THEORY_LEAGUES.filter((l) => s >= l.startAt).length; // tiers entamés
    const info = theoryLeague(s);
    return {
      items,
      doneCount: done,
      targetIdx: info.top ? 0 : done + 1,
      title: "Paliers Révision",
      goal: info.top ? "Maîtrisée" : `Objectif : ${esc(info.next?.name ?? "")}`,
      palierName: info.league?.name ?? "Pas encore classé",
      colorOf: (i, isDone) =>
        isDone
          ? `linear-gradient(160deg, ${THEORY_LEAGUES[i].color}, ${THEORY_LEAGUES[i].color})`
          : "linear-gradient(160deg,#3a3568,#262249)",
    };
  }
  const items = REMC_LEAGUES.map((l) => ({ short: l.id, name: l.name }));
  const done = REMC_LEAGUES.filter((l) => s >= l.endAt).length; // mondes finis
  const all = done >= REMC_LEAGUES.length;
  const target = all ? 0 : done + 1;
  return {
    items,
    doneCount: done,
    targetIdx: target,
    title: "Paliers Conduite",
    goal: all
      ? "Prêt examen"
      : `Objectif : ${esc(REMC_LEAGUES[target - 1]?.name ?? "")}`,
    palierName: all
      ? "Conduite autonome"
      : `${REMC_LEAGUES[Math.min(done, 3)].name}`,
    colorOf: (i, isDone) =>
      isDone
        ? `linear-gradient(160deg, ${REMC_LEAGUES[i].color}, ${REMC_LEAGUES[i].color})`
        : "linear-gradient(160deg,#3a3568,#262249)",
  };
}

// Nudge perso (écart de rang réel — pas de delta hebdo inventé).
function _nudge(ligue, rows, mine) {
  if (!mine) return "";
  if (mine.rang === 1) return "Tu es en tête du classement — reste devant.";
  const above = rows.find((r) => r.rang === mine.rang - 1);
  if (!above) return "";
  const gap = Math.max(0, (above.score ?? 0) - (mine.score ?? 0));
  if (gap <= 0) return "";
  const unit =
    ligue === "revision"
      ? gap > 1
        ? "points"
        : "point"
      : gap > 1
        ? "compétences"
        : "compétence";
  const place =
    mine.rang - 1 === 1
      ? "prendre la 1<sup>re</sup> place"
      : `passer ${mine.rang - 1}<sup>e</sup>`;
  return `Il te manque <b>${gap} ${unit}</b> pour ${place}.`;
}

// ─── Render ──────────────────────────────────────────────────────
function _renderArena(state, data) {
  const accent = state.ligue === "revision" ? REVISION_ACCENT : CONDUITE_ACCENT;
  const rows = _rowsFor(state, data);
  const sub =
    state.ligue === "revision"
      ? "Ton effort en autonomie — quiz & examens blancs"
      : "Validé en leçon avec ton moniteur";

  return `<div class="arn" style="${accent}">
  <div class="arn-hd"><h1>Classement</h1><p class="arn-sub">${sub}</p></div>

  <div class="arn-seg" role="tablist">
    <button data-ligue="conduite" role="tab" aria-selected="${state.ligue === "conduite"}">Conduite <span class="sub">en voiture</span></button>
    <button data-ligue="revision" role="tab" aria-selected="${state.ligue === "revision"}">Révision <span class="sub">en autonomie</span></button>
  </div>

  ${_renderScopebar(state, rows)}
  <div id="arn-body">${_renderBody(state, rows, data.hof)}</div>

  <a class="arn-link" href="#/profil">
    <span aria-hidden="true">${icon("user", { size: 16, strokeWidth: 2 })}</span>
    <span class="arn-link-body">
      <span class="arn-link-t">Choisis ton pseudo public</span>
      <span class="arn-link-s">Sinon tu apparais en « Apprenti »</span>
    </span>
    <span style="color:var(--mu)" aria-hidden="true">›</span>
  </a>
</div>`;
}

// Portée Mon école / National (Conduite uniquement) + effectif.
function _renderScopebar(state, rows) {
  const ranked = rows.filter(
    (r) => (r.score ?? 0) > 0 && r.rang != null,
  ).length;
  const effectif =
    ranked > 0 ? `sur ${ranked} élève${ranked > 1 ? "s" : ""}` : "";
  if (state.ligue === "revision") {
    return `<div class="arn-scopebar"><span style="font:600 12px/1 'Inter',sans-serif;color:var(--mu)">Mon école</span><span class="arn-effectif">${effectif}</span></div>`;
  }
  return `<div class="arn-scopebar">
    <div class="arn-scope" role="group" aria-label="Portée du classement">
      <button data-scope="ecole" aria-pressed="${state.scope === "ecole"}" class="${state.scope === "ecole" ? "on" : ""}">Mon école</button>
      <button data-scope="national" aria-pressed="${state.scope === "national"}" class="${state.scope === "national" ? "on" : ""}">National</button>
    </div>
    <span class="arn-effectif">${effectif}</span>
  </div>`;
}

function _renderBody(state, rows, hof) {
  const ligue = state.ligue;
  const mine = _myRow(rows);
  const active = rows.filter((r) => (r.score ?? 0) > 0);

  // Onboarding / vide
  if (active.length < 2) {
    const cta = ligue === "revision" ? _quizCta() : "";
    const txt =
      ligue === "revision"
        ? "Le classement s'anime dès que deux élèves ont des points révision."
        : "Le classement apparaît dès que deux élèves ont validé une compétence avec leur moniteur.";
    return `<div class="arn-empty">
      <div class="arn-empty-ico">${icon(ligue === "revision" ? "zap" : "target", { size: 34 })}</div>
      <div class="arn-empty-txt">${txt}</div>
    </div>${cta}`;
  }

  const top = active
    .filter((r) => r.rang <= LIMIT)
    .sort((a, b) => a.rang - b.rang);
  const fmt = _fmtScore(ligue);
  const hasPodium = top.length >= 3;
  const podium = hasPodium
    ? arenePodium(top.slice(0, 3), { fmtScore: fmt })
    : "";
  const listRows = hasPodium ? top.slice(3) : top;
  const pal = _paliersData(ligue, mine?.score ?? 0);

  const list = listRows.length
    ? `<div class="arn-list-head"><span class="lbl">${hasPodium ? "À partir du 4ᵉ" : "Classement"}</span><span class="rule"></span></div>
       <div class="arn-list">${listRows.map((r, i) => areneRow(r, { fmtScore: fmt, idx: i })).join("")}</div>`
    : "";

  // Ligne « Toi » épinglée (si je suis classé)
  const meRow = mine
    ? areneMeRow(mine, { fmtScore: fmt, palier: pal.palierName })
    : "";

  const nudge = _nudge(ligue, rows, mine);
  const nudgeHtml = nudge ? `<div class="arn-nudge">${nudge}</div>` : "";

  const rail = arenePaliers(pal);
  const help = ligue === "revision" ? _quizCta() : "";
  // Hall of Fame : seulement ligue Conduite, portée Mon école.
  const hofHtml =
    ligue === "conduite" && state.scope === "ecole" ? _hofSection(hof) : "";

  return `${podium}${nudgeHtml}${list}${meRow}${rail}${help}${hofHtml}`;
}

// CTA « Faire un quiz » (ligue Révision) + aide tuto.
function _quizCta() {
  return `<button class="arn-glass" id="arn-quiz-go" type="button">
    <span class="arn-glass-sheen" aria-hidden="true"></span>
    ${icon("zap", { size: 18, strokeWidth: 2.4 })}
    <span>Faire un quiz pour monter</span>
  </button>`;
}

// Hall of Fame (lauréats — prénom réel, ni rang ni « Toi »).
function _hofSection(hof) {
  if (!hof || hof.length === 0) return "";
  const rows = hof
    .map(
      (g, i) => `<div class="arn-hof-row" style="--i:${i}">
      <span class="arn-av">${renderUserAvatar({ avatar_url: g.avatar, prenom: g.prenom }, 38)}</span>
      <span class="arn-nm">${esc(fmtName(g.prenom))}</span>
      <span class="arn-hof-badge">${icon("award", { size: 12, strokeWidth: 2.4 })} Permis obtenu</span>
    </div>`,
    )
    .join("");
  return `<div class="arn-hof-title">${icon("award", { size: 13, strokeWidth: 2.2 })} Hall of Fame — permis obtenu</div>${rows}`;
}

// ─── Wire ────────────────────────────────────────────────────────
function _wire(root, state, data, rerender) {
  // Bascule de ligue
  root.querySelectorAll(".arn-seg button").forEach((b) => {
    b.addEventListener("click", () => {
      const next = b.dataset.ligue;
      if (next === state.ligue) return;
      state.ligue = next;
      if (next === "conduite" && !state.scope) state.scope = "ecole";
      haptic("select");
      playPop();
      track("classement.ligue_changed", { ligue: next });
      rerender();
      if (next === "revision") maybeShowTheoryTuto();
    });
  });

  // Bascule de portée (Conduite)
  root.querySelectorAll(".arn-scope button").forEach((b) => {
    b.addEventListener("click", () => {
      const next = b.dataset.scope;
      if (next === state.scope) return;
      state.scope = next;
      haptic("select");
      playClick();
      track("classement.scope_changed", { scope: next });
      rerender();
    });
  });

  // CTA quiz + aide tuto (délégation : le body est re-rendu)
  root.addEventListener("click", (e) => {
    if (e.target.closest("#arn-quiz-go")) {
      haptic("tap");
      playClick();
      track("revision_quiz.shortcut", { from: "classement" });
      location.hash = `#/quiz/next/post_validation/revision/${Date.now()}`;
    } else if (e.target.closest("#arn-help")) {
      playClick();
      showTheoryTuto();
    }
  });
}
