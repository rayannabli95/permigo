// ═══════════════════════════════════════════════════════════════
// Enseignant — Progression (style indigo premium)
// Raccord visuel avec Aujourd'hui / Mes élèves / Stats.
// Fond #eef1fb · cartes blanches radius 16 · hero indigo #4f46e5→#8b5cf6
// Trophée 3D flottant · section trophées images réelles · carte ligue.
//
// Source de données :
//   - Palier     : validations WHERE validated_by = me.id (count) → getMoniteurState
//   - Trophées   : même logique que trophees-moniteur.js (12 jalons)
//   - Ligue      : get_league_leaderboard({p_role:'enseignant'})
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { getMoniteurState, MONITEUR_TIERS } from "@/data/moniteur-levels.js";
import { animateCounter } from "@/utils/gestures.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { getLeague } from "@/utils/league-shared.js";

// ─── Trophées : 12 jalons (même définition que trophees-moniteur.js) ──
const TROPHEES = [
  { id: "premiere_seance", check: (d) => d.totalVals >= 1 },
  { id: "dix_comps", check: (d) => d.totalVals >= 10 },
  { id: "premier_eleve", check: (d) => d.studentsActive >= 1 },
  { id: "streak_7", check: (d) => d.streak >= 7 },
  { id: "cinquante_comps", check: (d) => d.totalVals >= 50 },
  { id: "cinq_eleves", check: (d) => d.studentsTotal >= 5 },
  { id: "cent_comps", check: (d) => d.totalVals >= 100 },
  { id: "streak_30", check: (d) => d.streak >= 30 },
  { id: "dix_eleves", check: (d) => d.studentsTotal >= 10 },
  { id: "deux_cent_comps", check: (d) => d.totalVals >= 200 },
  {
    id: "classe_complete",
    check: (d) => d.studentsTotal >= 3 && d.studentsActive >= d.studentsTotal,
  },
  { id: "expert_remc", check: (d) => d.totalVals >= 300 },
];
const BADGE_IMG = {
  premiere_seance: "badge-3d-01",
  dix_comps: "badge-3d-02",
  premier_eleve: "badge-3d-03",
  streak_7: "badge-3d-04",
  cinquante_comps: "badge-3d-06",
  cinq_eleves: "badge-3d-08",
  cent_comps: "badge-3d-02",
  streak_30: "badge-3d-04",
  dix_eleves: "badge-3d-06",
  deux_cent_comps: "badge-3d-08",
  classe_complete: "badge-3d-01",
  expert_remc: "badge-3d-ultimate",
};
const badgeSrc = (id) => `/skins/${BADGE_IMG[id] || "badge-3d-01"}.webp`;

// Noms lisibles pour aria-label des trophées
const TROPHEE_NAMES = {
  premiere_seance: "Premier pas",
  dix_comps: "10 validations",
  premier_eleve: "Premier élève mobilisé",
  streak_7: "Semaine active",
  cinquante_comps: "50 validations",
  cinq_eleves: "Classe en formation",
  cent_comps: "100 validations",
  streak_30: "Mois sans faille",
  dix_eleves: "Portefeuille solide",
  deux_cent_comps: "200 validations",
  classe_complete: "Classe au complet",
  expert_remc: "Référent certifié",
};

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
.ppr {
  max-width: 480px; margin: 0 auto;
  padding: 0 0 calc(96px + env(safe-area-inset-bottom, 0px));
  background: #eef1fb; color: #1a1c2e;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

/* ── En-tête « Progression » ── */
.ppr-hd {
  padding: calc(env(safe-area-inset-top, 0px) + var(--th, 52px) + 14px) 20px 0;
}
.ppr-hd-title {
  font: 800 23px/1.15 'Manrope', 'Inter', sans-serif;
  color: #1a1c2e; letter-spacing: -.02em;
}

/* ── Hero indigo dégradé ── */
.ppr-hero {
  position: relative;
  margin: 14px 16px 0;
  background: linear-gradient(150deg, #4f46e5, #6d6bff 60%, #8b5cf6);
  border-radius: 24px;
  padding: 20px 18px 26px;
  overflow: visible;
  box-shadow: 0 16px 40px -14px rgba(79, 70, 229, .58);
  isolation: isolate;
  min-height: 172px;
  color: #fff;
  animation: pprHeroIn .45s cubic-bezier(.22,.68,0,1.2) both;
}

/* Halo doré autour du trophée */
.ppr-hero-halo {
  position: absolute;
  right: -10px; top: -16px;
  width: 170px; height: 170px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 210, 120, .60), transparent 65%);
  z-index: 0; filter: blur(4px); pointer-events: none;
}

/* Trophée flottant */
.ppr-hero-trophy {
  position: absolute;
  right: -4px; bottom: -8px;
  width: 124px; z-index: 1;
  filter: drop-shadow(0 12px 20px rgba(40, 20, 90, .40));
}
@media (prefers-reduced-motion: no-preference) {
  .ppr-hero-trophy { animation: pprFloat 4s ease-in-out infinite; }
}
@keyframes pprFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-7px); }
}

.ppr-hero-in { position: relative; z-index: 2; max-width: 62%; }

.ppr-hero-surtitle {
  font: 700 10.5px/1 'Inter', sans-serif;
  letter-spacing: .1em; text-transform: uppercase;
  color: #cdc9ff; margin: 0 0 6px;
}
.ppr-hero-palier {
  font: 700 28px/1.05 'Fredoka', 'Manrope', sans-serif;
  color: #fff; margin: 0 0 3px; letter-spacing: -.01em;
}
.ppr-hero-sub {
  font: 600 12px/1.3 'Inter', sans-serif;
  color: #e2e0ff; margin: 0 0 16px;
}

/* Barre de progression */
.ppr-prog { max-width: 100%; }
.ppr-prog-bar {
  height: 8px; border-radius: 999px;
  background: rgba(255,255,255,.22); overflow: hidden;
}
.ppr-prog-fill {
  display: block; height: 100%; width: 0;
  border-radius: 999px; background: #fff;
  transition: width 1.1s cubic-bezier(.2,.7,.3,1);
}
.ppr-prog-hint {
  font: 700 11px/1 'Inter', sans-serif;
  color: #e2e0ff; margin-top: 7px;
}
.ppr-prog-hint b { color: #ffd27a; }

/* ── Section générique ── */
.ppr-sec {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 22px 20px 10px;
}
.ppr-sec-title {
  font: 800 13px/1 'Manrope', 'Inter', sans-serif;
  color: #3a3f63; letter-spacing: -.01em;
}
.ppr-sec-link {
  font: 700 11.5px/1 'Inter', sans-serif;
  color: #4f46e5; background: none; border: 0;
  cursor: pointer; padding: 4px 0; min-height: 32px;
  -webkit-tap-highlight-color: transparent;
  text-decoration: none;
}
.ppr-sec-link:focus-visible { outline: 2px solid #4f46e5; border-radius: 4px; }

/* ── Rangée trophées ── */
.ppr-troph-row {
  display: flex; gap: 9px; overflow-x: auto;
  padding: 2px 20px 4px;
  scrollbar-width: none;
}
.ppr-troph-row::-webkit-scrollbar { display: none; }

.ppr-tcell {
  width: 64px; height: 64px; flex: none;
  background: #fff; border: 1px solid #e6e9f7; border-radius: 18px;
  display: grid; place-items: center;
  box-shadow: 0 6px 16px -10px rgba(60, 50, 130, .28);
  position: relative; overflow: visible;
  transition: transform .14s cubic-bezier(.23,1,.32,1);
}
.ppr-tcell:active { transform: scale(.93); }
.ppr-tcell img {
  width: 46px; height: 46px; object-fit: contain; display: block;
  filter: drop-shadow(0 3px 5px rgba(40, 20, 90, .22));
}
.ppr-tcell.lock img {
  filter: grayscale(1) brightness(.82); opacity: .7;
}
.ppr-tcell.lock::after {
  content: ""; position: absolute; inset: 0; border-radius: 18px;
  background: rgba(245, 247, 252, .35);
}
/* Pastille NEW (dernier débloqué) */
.ppr-tcell.new-badge { border-color: #a78bff; box-shadow: 0 0 0 2px rgba(140,90,255,.32), 0 8px 18px -7px rgba(109,77,255,.48); }
.ppr-tcell.new-badge::before {
  content: ""; position: absolute; top: -3px; right: -3px;
  width: 12px; height: 12px; border-radius: 50%;
  background: #ff4d6d; border: 2.5px solid #eef1fb; z-index: 2;
}

/* ── Carte ligue ── */
.ppr-ligue {
  margin: 0 16px; padding: 16px;
  background: #fff; border: 1px solid #e6e9f7; border-radius: 18px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 8px 24px -14px rgba(60, 50, 130, .24);
  cursor: pointer;
  transition: transform .14s cubic-bezier(.23,1,.32,1), box-shadow .14s;
  -webkit-tap-highlight-color: transparent;
}
.ppr-ligue:active { transform: scale(.98); box-shadow: 0 4px 12px -8px rgba(60,50,130,.18); }
.ppr-ligue-crown {
  width: 56px; height: 56px; flex: none;
  object-fit: contain; filter: drop-shadow(0 4px 8px rgba(120,80,20,.28));
}
.ppr-ligue-info { flex: 1; min-width: 0; }
.ppr-ligue-name {
  font: 800 16px/1.2 'Manrope', 'Inter', sans-serif;
  color: #1a1c2e; letter-spacing: -.01em;
}
.ppr-ligue-sub {
  font: 600 11.5px/1.4 'Inter', sans-serif;
  color: #8b8298; margin-top: 3px;
}
.ppr-ligue-rank {
  font: 800 24px/1 'Fredoka', 'Manrope', sans-serif;
  color: #7c3aed; flex-shrink: 0;
}

/* ── Skeleton ── */
.ppr-skel {
  border-radius: 18px;
  background: linear-gradient(90deg, #dde3f5 0%, #eef1fb 50%, #dde3f5 100%);
  background-size: 200% 100%;
  animation: pprShim 1.4s ease-in-out infinite;
}
@keyframes pprShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ── Max palier ── */
.ppr-max {
  display: flex; align-items: center; gap: 10px; margin-top: 12px;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
  border-radius: 12px; padding: 10px 14px;
}
.ppr-max-txt {
  font: 700 12.5px/1.3 'Inter', sans-serif; color: #fff;
}

/* ── Retry ── */
#ppr-retry {
  display: block; margin: 24px auto 0; padding: 14px 32px; min-height: 48px;
  background: #4f46e5; color: #fff; border: 0; border-radius: 14px;
  font: 700 14px/1 'Inter', sans-serif; cursor: pointer;
  box-shadow: 0 8px 20px -6px rgba(79,70,229,.5);
  transition: transform .14s, box-shadow .14s;
}
#ppr-retry:active { transform: scale(.97); box-shadow: none; }
#ppr-retry:focus-visible { outline: 3px solid #4f46e5; outline-offset: 3px; }

@keyframes pprHeroIn {
  from { opacity: 0; transform: translateY(8px) scale(.97); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ppr-prog-fill, .ppr-skel, .ppr-hero-trophy, .ppr-hero { animation: none !important; transition: none !important; }
}
</style>`;

// ─── State ───────────────────────────────────────────────────────
let _root = null;

// ─── Entry point ─────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  const me = getCurUser();
  if (!me || me.role !== "enseignant") {
    root.innerHTML = `<p style="padding:32px;text-align:center;color:#6b7095">Accès enseignant requis</p>`;
    return;
  }

  track("page.view", { page: "parcours_pro" });

  // Skeleton
  root.innerHTML = `${STYLE}
    <div class="ppr">
      <div class="ppr-hd"><div class="ppr-hd-title">Progression</div></div>
      <div class="ppr-skel" style="height:178px;margin:14px 16px 0"></div>
      <div class="ppr-skel" style="height:86px;margin:22px 16px 0"></div>
      <div class="ppr-skel" style="height:74px;margin:22px 16px 0"></div>
    </div>`;

  // Chargement parallèle de toutes les données
  try {
    const since30d = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [valsRes, profileRes, studentsRes, activeRes, ligueRes] =
      await Promise.all([
        sb
          .from("validations")
          .select("id", { count: "exact", head: true })
          .eq("validated_by", me.id),
        sb
          .from("profiles")
          .select("streak_pro_days")
          .eq("id", me.id)
          .maybeSingle(),
        sb
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("enseignant_id", me.id)
          .eq("role", "eleve"),
        sb
          .from("validations")
          .select("eleve_id")
          .eq("validated_by", me.id)
          .gte("validated_at", since30d),
        sb.rpc("get_league_leaderboard", { p_role: "enseignant", p_limit: 50 }),
      ]);

    if (valsRes.error) throw valsRes.error;

    const d = {
      totalVals: valsRes.count ?? 0,
      streak: profileRes.data?.streak_pro_days ?? 0,
      studentsTotal: studentsRes.count ?? 0,
      studentsActive: new Set(
        (activeRes.data || []).map((v) => v.eleve_id).filter(Boolean),
      ).size,
    };

    const ligueRows = ligueRes.data || [];
    const state = getMoniteurState(d.totalVals);
    _render(root, d, state, ligueRows);
  } catch (e) {
    console.error("[parcours-pro]", e);
    root.innerHTML = `${STYLE}
      <div class="ppr">
        <div class="ppr-hd"><div class="ppr-hd-title">Progression</div></div>
        <div style="padding:48px 24px;text-align:center;color:#6b7095">
          <p style="font:600 15px/1.4 'Inter',sans-serif">Ton parcours n'a pas pu se charger.</p>
          <button id="ppr-retry">Réessayer</button>
        </div>
      </div>`;
    root
      .querySelector("#ppr-retry")
      ?.addEventListener("click", () => mount(root));
  }
}

// ─── Render ──────────────────────────────────────────────────────
function _render(root, d, state, ligueRows) {
  const { tier, nextReward, pctToNextReward, isMax } = state;
  const palierNum = tier?.tier ?? 0;
  const palierName = tier?.title ?? "Premiers pas";

  // Trophées
  const troResults = TROPHEES.map((t) => ({ ...t, unlocked: t.check(d) }));
  const unlockedCount = troResults.filter((t) => t.unlocked).length;
  const total = troResults.length;
  // Dernier débloqué = le plus haut index débloqué
  const lastUnlockedIdx = troResults.reduce(
    (best, t, i) => (t.unlocked ? i : best),
    -1,
  );

  // Ligue
  const mine = ligueRows.find((r) => r.is_me) || null;
  const myPts = mine?.weekly_pts ?? 0;
  const myRank = mine?.rank_pos ?? null;
  const myLeague = getLeague(myPts);

  // Ligue suivante (pour "monte en X à Y")
  const LEAGUES_ORDER = ["bronze", "argent", "or", "diamant"];
  const LEAGUES_DEF = {
    bronze: { name: "Bronze", minPts: 1 },
    argent: { name: "Argent", minPts: 8 },
    or: { name: "Or", minPts: 20 },
    diamant: { name: "Diamant", minPts: 40 },
  };
  const myLeagueId = myLeague?.id ?? null;
  const myLeagueIdx = myLeagueId ? LEAGUES_ORDER.indexOf(myLeagueId) : -1;
  const prevLeagueId = myLeagueIdx > 0 ? LEAGUES_ORDER[myLeagueIdx - 1] : null;
  const prevLeague = prevLeagueId ? LEAGUES_DEF[prevLeagueId] : null;
  const ptsToNext = prevLeague ? prevLeague.minPts - myPts : 0;

  // Nom de la ligue courante
  const ligueName = myLeague ? `Ligue ${esc(myLeague.name)}` : "Hors-ligue";
  const ligueSub =
    myPts === 0
      ? "Valide une compétence pour entrer en ligue"
      : ptsToNext > 0 && prevLeague
        ? `${myPts} validation${myPts > 1 ? "s" : ""} cette semaine · monte en ${esc(prevLeague.name)} à ${prevLeague.minPts}`
        : `${myPts} validation${myPts > 1 ? "s" : ""} cette semaine · ligue maximale atteinte`;

  root.innerHTML = `${STYLE}
<div class="ppr">

  <!-- En-tête -->
  <div class="ppr-hd">
    <div class="ppr-hd-title">Progression</div>
  </div>

  <!-- Hero indigo -->
  <div class="ppr-hero" aria-label="Palier de moniteur : ${esc(palierName)}, palier ${palierNum} sur ${MONITEUR_TIERS.length}">
    <div class="ppr-hero-halo"></div>
    <img
      class="ppr-hero-trophy"
      src="/skins/trophy-permis-virtuel.webp"
      alt=""
      aria-hidden="true"
      width="124"
    >
    <div class="ppr-hero-in">
      <p class="ppr-hero-surtitle">Ton palier de moniteur</p>
      <div class="ppr-hero-palier" id="ppr-palier-name">${esc(palierName)}</div>
      <div class="ppr-hero-sub">
        Palier ${palierNum} sur ${MONITEUR_TIERS.length} · <span id="ppr-val-count">0</span> compétences validées
      </div>
      ${_progHtml(state)}
    </div>
  </div>

  <!-- Trophées -->
  <div class="ppr-sec">
    <div class="ppr-sec-title">Tes trophées · ${unlockedCount} / ${total}</div>
    <button class="ppr-sec-link" id="ppr-tro-link" aria-label="Voir tous les trophées">Voir tout</button>
  </div>
  <div class="ppr-troph-row" role="list" aria-label="Aperçu des trophées">
    ${_trophRow(troResults, lastUnlockedIdx)}
  </div>

  <!-- Ligue -->
  <div class="ppr-sec">
    <div class="ppr-sec-title">Ligue de la semaine</div>
    <button class="ppr-sec-link" id="ppr-lig-link" aria-label="Voir le classement complet">Classement</button>
  </div>
  <div class="ppr-ligue" id="ppr-ligue-card" role="button" tabindex="0" aria-label="${ligueName}${myRank ? " — rang #" + myRank : ""}">
    <img class="ppr-ligue-crown" src="/skins/couronne.png" alt="" aria-hidden="true" width="56" height="56">
    <div class="ppr-ligue-info">
      <div class="ppr-ligue-name">${ligueName}</div>
      <div class="ppr-ligue-sub">${esc(ligueSub)}</div>
    </div>
    ${myRank ? `<div class="ppr-ligue-rank">#${myRank}</div>` : ""}
  </div>

</div>`;

  // Animations différées
  requestAnimationFrame(() => {
    const fill = root.querySelector("#ppr-prog-fill");
    if (fill) fill.style.width = `${Math.min(100, pctToNextReward ?? 0)}%`;
  });
  setTimeout(() => {
    const el = root.querySelector("#ppr-val-count");
    if (el) animateCounter(el, 0, d.totalVals, 900);
  }, 150);

  // Listeners navigation
  root.querySelector("#ppr-tro-link")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/trophees-moniteur");
  });
  const ligueCard = root.querySelector("#ppr-ligue-card");
  ligueCard?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/ligue-semaine");
  });
  ligueCard?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      haptic("tap");
      navigate("#/ligue-semaine");
    }
  });
  root.querySelector("#ppr-lig-link")?.addEventListener("click", () => {
    haptic("tap");
    navigate("#/ligue-semaine");
  });
}

// ─── Barre de progression dans le hero ──────────────────────────
function _progHtml(state) {
  if (state.isMax) {
    return `<div class="ppr-max">
      ${icon("check-circle", { size: 18, strokeWidth: 2 })}
      <div class="ppr-max-txt">Palier maximum atteint — référent certifié.</div>
    </div>`;
  }
  const missing = state.nextReward?.missing ?? 0;
  const nextTitle = state.nextReward?.data?.title ?? "";
  const nextNum = (state.tier?.tier ?? 0) + 1;
  return `<div class="ppr-prog">
    <div class="ppr-prog-bar">
      <span class="ppr-prog-fill" id="ppr-prog-fill" role="progressbar"
        aria-valuenow="${Math.round(state.pctToNextReward ?? 0)}"
        aria-valuemin="0" aria-valuemax="100"
        aria-label="Progression vers le palier ${nextNum}"></span>
    </div>
    <div class="ppr-prog-hint">
      Plus que <b>${missing} validation${missing > 1 ? "s" : ""}</b> pour le palier ${nextNum}
    </div>
  </div>`;
}

// ─── Rangée trophées ─────────────────────────────────────────────
function _trophRow(troResults, lastUnlockedIdx) {
  return troResults
    .map((t, i) => {
      const isNew = i === lastUnlockedIdx && t.unlocked;
      const lockCls = t.unlocked ? "" : " lock";
      const newCls = isNew ? " new-badge" : "";
      const label = TROPHEE_NAMES[t.id] || t.id;
      return `<div class="ppr-tcell${lockCls}${newCls}" role="listitem" aria-label="${esc(label)}${t.unlocked ? " — débloqué" : " — verrouillé"}">
        <img src="${badgeSrc(t.id)}" alt="" width="46" height="46" loading="lazy">
      </div>`;
    })
    .join("");
}
