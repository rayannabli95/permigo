// ═══════════════════════════════════════════════════════════════
// Enseignant — Livret REMC d'un élève
// mount(root, eleveId)
// Affiche les 31 sous-compétences avec leur état, permet de valider
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import { icon } from "@/utils/icons.js";
import { STATUT_CFG } from "@/utils/statut-label.js";
import { theoryLeague, computeTheoryScore } from "@/utils/theory-league.js";
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";

// ─── Couleurs par monde ───────────────────────────────────────────
const MONDE_COLORS = {
  C1: {
    accent: "var(--a)",
    bg: "color-mix(in srgb, var(--a) 7%, transparent)",
    border: "color-mix(in srgb, var(--a) 20%, transparent)",
  },
  C2: {
    accent: "var(--blk)",
    bg: "rgba(8,145,178,.07)",
    border: "rgba(8,145,178,.2)",
  },
  C3: {
    accent: "var(--am)",
    bg: "rgba(245,158,11,.07)",
    border: "rgba(245,158,11,.2)",
  },
  C4: {
    accent: "var(--gr)",
    bg: "rgba(16,185,129,.07)",
    border: "rgba(16,185,129,.2)",
  },
};

// Mapping centralisé : @/utils/statut-label.js (STATUT_CFG importé)

// ─── CSS (design clean — cohérent avec aujourdhui/mes-eleves/validation) ──
const STYLE = `<style>
  .lr-page {
    padding: 0 0 120px;
    max-width: 600px;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    background: var(--bg);
  }

  /* Header sticky sous le header global */
  .lr-hd {
    position: sticky;
    top: calc(52px + env(safe-area-inset-top, 0px));
    z-index: 20;
    background: color-mix(in srgb, var(--su2) 94%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--bo);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lr-back {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1px solid var(--bo);
    background: var(--su);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--ink);
    flex-shrink: 0;
    transition: border-color .15s ease;
  }
  .lr-back:hover { border-color: var(--a); }
  .lr-hd-info { flex: 1; min-width: 0; }
  .lr-title {
    font: 700 17px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 3px;
    letter-spacing: -0.022em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lr-subtitle { font: 500 12px/1 'Inter', sans-serif; color: var(--mu2); margin: 0; }

  /* KPI global — la "barre de chaleur" du livret */
  .lr-kpi {
    margin: 16px;
    padding: 20px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-xl);
    box-shadow: var(--s1);
  }
  .lr-kpi-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 8px;
  }
  .lr-kpi-label {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .lr-kpi-val {
    font: 700 22px/1 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    letter-spacing: -0.022em;
  }
  .lr-kpi-pct {
    font: 500 13px/1 'Inter', sans-serif;
    color: var(--mu2);
  }
  .lr-global-bar {
    height: 6px;
    background: var(--bo3);
    border-radius: var(--r-full);
    overflow: hidden;
  }
  .lr-global-fill {
    height: 100%;
    background: var(--a);
    border-radius: var(--r-full);
    transition: width .8s var(--ease-out);
  }

  /* Corps */
  .lr-body { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

  /* Section monde */
  .lr-monde {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r-xl);
    overflow: hidden;
    box-shadow: var(--s0);
  }
  .lr-monde-hd {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--bo2);
  }
  .lr-monde-ico { display: flex; align-items: center; flex-shrink: 0; }
  .lr-monde-nm {
    font: 600 14px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
    letter-spacing: -0.01em;
  }
  .lr-monde-prog {
    font: 600 12px/1 'Inter', sans-serif;
    color: var(--mu2);
    flex-shrink: 0;
  }
  .lr-monde-bar-wrap {
    height: 3px;
    background: var(--bo3);
  }
  .lr-monde-bar-fill {
    height: 100%;
    transition: width .6s var(--ease-out);
  }

  /* Ligne sous-compétence */
  .lr-comp {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--bo2);
    cursor: pointer;
    transition: background .12s ease;
    min-height: 56px;
  }
  .lr-comp:last-child { border-bottom: none; }
  .lr-comp:hover { background: var(--bg); }
  .lr-comp:active { background: var(--bg2); }

  .lr-comp-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lr-comp-code {
    font: 600 11px/1 'Inter', sans-serif;
    color: var(--a-txt);
    background: color-mix(in srgb, var(--a) 10%, transparent);
    border-radius: 6px;
    padding: 4px 8px;
    flex-shrink: 0;
  }
  .lr-comp-nom {
    font: 500 14px/1.4 'Inter', sans-serif;
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }
  .lr-comp-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 5px 10px;
    border-radius: var(--r-full);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .lr-comp-chev { color: var(--bo4); font-size: 14px; flex-shrink: 0; }

  /* Bouton bilan trimestriel */
  .lr-bilan-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 12px; min-height: 44px; border-radius: var(--r);
    background: transparent; border: 1px solid var(--bo);
    color: var(--mu); font: 600 12px/1 'Inter', sans-serif;
    cursor: pointer; flex-shrink: 0; white-space: nowrap;
    transition: border-color .15s, color .15s, background .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .lr-bilan-btn:hover { border-color: #6366f1; color: #6366f1; }
  .lr-bilan-btn:active { background: rgba(99,102,241,.06); transform: scale(.97); }
  .lr-bilan-btn:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

  /* ─── Bottom sheet overlay ────────────────────────────────── */
  .lr-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(10,13,26,.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    animation: lr-overlay-in .2s ease;
  }
  @keyframes lr-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .lr-sheet {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    background: var(--su);
    border-radius: 24px 24px 0 0;
    padding: 0 0 max(24px, env(safe-area-inset-bottom));
    box-shadow: 0 -10px 40px rgba(10,13,26,.15);
    animation: lr-sheet-in .28s cubic-bezier(.33,1,.68,1) forwards;
    max-height: 92dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    transform: translateY(100%);
  }
  @keyframes lr-sheet-in {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .lr-sheet-hd {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--bo2);
    position: sticky;
    top: 0;
    background: var(--su);
    z-index: 2;
  }
  .lr-sheet-title {
    font: 700 17px/1.3 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0;
    flex: 1;
    letter-spacing: -0.022em;
  }
  .lr-sheet-close {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1px solid var(--bo);
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: var(--mu);
    flex-shrink: 0;
    transition: border-color .15s ease, color .15s ease;
  }
  .lr-sheet-close:hover { border-color: var(--a); color: var(--a-txt); }

  .lr-sheet-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

  /* Boutons statut */
  .lr-statut-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .lr-statut-btn {
    padding: 14px 8px;
    border-radius: var(--r);
    border: 1.5px solid var(--bo);
    background: var(--bg);
    cursor: pointer;
    text-align: center;
    transition: border-color .15s ease, background .15s ease, color .15s ease, transform .15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .lr-statut-btn:hover { border-color: var(--a); background: var(--su); }
  .lr-statut-btn:active { transform: scale(.98); }
  .lr-statut-btn.selected-acquis {
    border-color: var(--gr);
    background: rgba(16,185,129,.08);
  }
  .lr-statut-btn.selected-en_cours {
    border-color: var(--am);
    background: rgba(245,158,11,.08);
  }
  .lr-statut-btn.selected-a_retravailler {
    border-color: var(--rd);
    background: rgba(239,68,68,.08);
  }
  .lr-statut-btn-ico { font-size: 20px; line-height: 1; }
  .lr-statut-btn-lbl {
    font: 600 12px/1.3 'Inter', sans-serif;
    color: var(--ink);
  }

  /* Note */
  .lr-note-label {
    font: 600 11px/1 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--mu2);
    margin: 0 0 8px;
    display: block;
  }
  .lr-note {
    width: 100%;
    padding: 14px;
    background: var(--bg);
    border: 1px solid var(--bo);
    border-radius: var(--r);
    font: 500 14px/1.5 'Inter', sans-serif;
    color: var(--ink);
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
    outline: none;
    transition: border-color .15s ease, background .15s ease;
    box-sizing: border-box;
  }
  .lr-note::placeholder { color: var(--mu2); }
  .lr-note:focus {
    border-color: var(--a);
    background: var(--su);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--a) 12%, transparent);
  }
  .lr-note-count {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
    text-align: right;
    margin-top: 4px;
  }

  /* Bouton valider — SEUL gradient de la page */
  .lr-btn-save {
    width: 100%;
    padding: 16px;
    background: var(--a);
    border: none;
    border-radius: var(--r);
    color: var(--a-ink);
    font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    transition: opacity .15s ease, transform .12s ease;
    min-height: 52px;
    letter-spacing: -0.01em;
  }
  .lr-btn-save:disabled {
    opacity: .45;
    cursor: not-allowed;
  }
  .lr-btn-save:not(:disabled):hover { opacity: .92; }
  .lr-btn-save:not(:disabled):active { transform: scale(.98); }

  /* Skeleton */
  .lr-skel { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
  .lr-skel-hd { height: 100px; background: linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%); background-size: 200% 100%; border-radius: var(--r-xl); animation: lr-pulse 1.4s ease-in-out infinite; }
  .lr-skel-bloc { height: 220px; background: linear-gradient(90deg,var(--bg2) 0%,var(--bo) 50%,var(--bg2) 100%); background-size: 200% 100%; border-radius: var(--r-xl); animation: lr-pulse 1.4s ease-in-out infinite; animation-delay: .1s; }
  @keyframes lr-pulse { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* Message erreur */
  .lr-err {
    padding: 60px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 14px/1.6 'Inter', sans-serif;
  }
  .lr-err-ico { font-size: 40px; display: block; margin-bottom: 12px; }

  /* État succès après validation acquise — referme la boucle de valeur.
     Sobre (pas de confetti) : on PROUVE que l'élève vient d'avancer. */
  .lr-success {
    padding: 28px 24px calc(24px + env(safe-area-inset-bottom, 0px));
    text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .lr-success-check {
    width: 60px; height: 60px; border-radius: 50%;
    background: var(--grp);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
    animation: lr-pop .42s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes lr-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .lr-success-comp {
    font: 600 13px/1.3 'Inter', sans-serif; color: var(--mu);
    margin-bottom: 6px;
  }
  .lr-success-title {
    font: 800 19px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 18px;
  }
  .lr-success-bar {
    width: 100%; height: 8px; background: var(--bo);
    border-radius: 99px; overflow: hidden; margin-bottom: 10px;
  }
  .lr-success-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, var(--a), var(--a-lt));
    transition: width .8s .1s cubic-bezier(.2,.7,.3,1);
  }
  .lr-success-meta {
    font: 600 13px/1 'Inter', sans-serif; color: var(--ink); margin-bottom: 6px;
  }
  .lr-success-meta b { font-weight: 800; color: var(--adk); }
  .lr-success-note {
    font: 500 13px/1.45 'Inter', sans-serif; color: var(--mu2); margin-bottom: 22px;
  }
  @media (prefers-reduced-motion: reduce) {
    .lr-success-check { animation: none; }
    .lr-success-fill { transition: none; }
  }
</style>`;

// ─── State ────────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleveId = null;
let _eleveProfil = null; // { prenom, nom }
let _validationsMap = {}; // competence_id → { statut, note }
let _theory = null; // { score, nComp, nExams } — ligue théorique (autonomie)
let _sheetComp = null; // { c, n } la comp ouverte dans le sheet
let _sheetStatut = null;
let _sheetNote = "";

// ─── Entry point ──────────────────────────────────────────────────
export async function mount(root, eleveId) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _eleveId = eleveId || null;

  if (!_eleveId) {
    root.innerHTML = `
      ${STYLE}
      <div class="lr-page">
        <div class="lr-err">
          <span class="lr-err-ico">${icon("alert-circle", { size: 22 })}</span>
          Aucun élève sélectionné. Retournez à la liste.
        </div>
      </div>
    `;
    return;
  }

  track("page.view", {
    page: "livret_remc",
    role: _me.role,
    eleve_id: _eleveId,
  });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="lr-page">
      <div class="lr-skel">
        <div class="lr-skel-hd"></div>
        <div class="lr-skel-bloc"></div>
        <div class="lr-skel-bloc"></div>
      </div>
    </div>
  `;

  await loadData();
  render();
}

// ─── Data ─────────────────────────────────────────────────────────
async function loadData() {
  // Profil élève
  const { data: profil } = await sb
    .from("profiles")
    .select("id, prenom, nom")
    .eq("id", _eleveId)
    .single();

  _eleveProfil = profil || { prenom: "Élève", nom: "" };

  // Toutes les validations de cet élève (tous enseignants — pour voir l'état complet)
  const { data: vals } = await sb
    .from("validations")
    .select("competence_id, statut, note_enseignant")
    .eq("eleve_id", _eleveId);

  _validationsMap = {};
  (vals || []).forEach((v) => {
    _validationsMap[v.competence_id] = {
      statut: v.statut,
      note: v.note_enseignant || "",
    };
  });

  // Ligue théorique (autonomie élève) — lecture seule, RLS : enseignant
  // voit les tentatives des élèves de son école.
  try {
    const { data: qa, error } = await sb
      .from("quiz_attempts")
      .select("competence_id, type, score, ref_id, passed")
      .eq("user_id", _eleveId);
    _theory = error ? null : computeTheoryScore(qa);
  } catch (e) {
    _theory = null;
  }
}

// ─── Ligne « Ligue théorique » (KPI, lecture seule, ton factuel) ──
// Hook conversation moniteur : « t'en es où sur tes quiz ? »
function _renderTheoryRow() {
  if (!_theory) return "";
  const info = theoryLeague(_theory.score);
  const label = info.league
    ? `Ligue ${info.league.n} — ${esc(info.league.name)} · ${_theory.score} pts`
    : "Pas encore commencé";
  const detail = info.league
    ? `${_theory.nComp} quiz de compétence réussi${_theory.nComp > 1 ? "s" : ""} · ${_theory.nExams} examen${_theory.nExams > 1 ? "s" : ""} blanc${_theory.nExams > 1 ? "s" : ""} réussi${_theory.nExams > 1 ? "s" : ""}`
    : "Aucun quiz réussi en autonomie pour l'instant";
  const dotColor = info.league ? info.league.color : "var(--mu2)";
  return `
    <div class="lr-kpi-row" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bo2)">
      <span class="lr-kpi-label">Théorie (autonomie)</span>
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span style="width:8px;height:8px;border-radius:50%;background:${dotColor};display:inline-block" aria-hidden="true"></span>
        <span class="lr-kpi-pct">${label}</span>
      </span>
    </div>
    <div style="font:500 11px/1.4 'Inter',sans-serif;color:var(--mu2);margin-top:4px">${detail}</div>`;
}

// ─── Render principal ─────────────────────────────────────────────
function render() {
  const acquis = Object.values(_validationsMap).filter(
    (v) => v.statut === "acquis",
  ).length;
  const pct = REMC_TOTAL > 0 ? Math.round((acquis / REMC_TOTAL) * 100) : 0;
  const prenomNom = [
    esc(_eleveProfil?.prenom || ""),
    esc(_eleveProfil?.nom || ""),
  ]
    .filter(Boolean)
    .join(" ");

  _root.innerHTML = `
    ${STYLE}
    <div class="lr-page anim-slide-up">

      <header class="lr-hd">
        <button class="lr-back" aria-label="Retour liste élèves">←</button>
        <div class="lr-hd-info">
          <h1 class="lr-title" tabindex="-1">Livret REMC — ${prenomNom || "Élève"}</h1>
          <p class="lr-subtitle">${acquis}/${REMC_TOTAL} compétences acquises</p>
        </div>
        <button class="lr-bilan-btn" id="lr-bilan-btn" aria-label="Voir le bilan trimestriel">
          ${icon("file-text", { size: 14, strokeWidth: 2 })} Bilan
        </button>
      </header>

      <div class="lr-kpi">
        <div class="lr-kpi-row">
          <span class="lr-kpi-label">Progression globale</span>
          <span>
            <span class="lr-kpi-val">${acquis}</span>
            <span class="lr-kpi-pct"> / ${REMC_TOTAL} · ${pct}%</span>
          </span>
        </div>
        <div class="lr-global-bar">
          <div class="lr-global-fill" style="width:${pct}%"></div>
        </div>
        ${_renderTheoryRow()}
      </div>

      <div class="lr-body">
        ${REMC.map(renderMonde).join("")}
      </div>

      <!-- Fil des moniteurs — injecté dynamiquement -->
      <div id="lr-feed-section" style="padding:0 16px 100px"></div>

    </div>
  `;

  wireMain();
  _loadFeedSection();
}

async function _loadFeedSection() {
  const host = document.getElementById("lr-feed-section");
  if (!host || !_eleveId) return;

  host.innerHTML = `<div style="padding:8px 0;color:var(--mu2);font:500 12px/1 'Inter',sans-serif">Chargement du fil…</div>`;

  let events = [];
  try {
    const { data } = await sb.rpc("get_eleve_feedback_feed", {
      p_eleve_id: _eleveId,
      p_limit: 30,
    });
    events = data || [];
  } catch (e) {
    host.innerHTML = "";
    return;
  }

  if (events.length === 0) {
    host.innerHTML = "";
    return;
  }

  function _relTime(ts) {
    if (!ts) return "";
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (d === 0) return "aujourd'hui";
    if (d === 1) return "hier";
    if (d < 7) return `il y a ${d}j`;
    return new Date(ts).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }

  // Groupé par jour × moniteur : 20 cartes « a validé X » à la suite = mur
  // de texte. Un groupe = « 8 compétences validées ✓ », dépliable.
  const groups = [];
  const byKey = new Map();
  for (const evt of events) {
    const day = evt.ts ? new Date(evt.ts).toDateString() : "";
    const moniteur =
      `${evt.moniteur_prenom || ""} ${evt.moniteur_nom || ""}`.trim();
    const key = `${day}|${moniteur}`;
    let g = byKey.get(key);
    if (!g) {
      g = { ts: evt.ts, moniteur, items: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.items.push(evt);
  }

  const MAX_GROUPS = 5;

  function _renderGroup(g) {
    const nValid = g.items.filter((e) => e.kind !== "session").length;
    const nSession = g.items.length - nValid;
    const summary = [
      nValid
        ? `${nValid} compétence${nValid > 1 ? "s" : ""} validée${nValid > 1 ? "s" : ""}`
        : "",
      nSession ? `${nSession} séance${nSession > 1 ? "s" : ""}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const detail = g.items
      .map((evt) => {
        const isSession = evt.kind === "session";
        return `<div class="lr-feed-item">
          <div class="lr-feed-dot ${isSession ? "k-session" : "k-validation"}">${isSession ? icon("car", { size: 12, strokeWidth: 2 }) : icon("check", { size: 12, strokeWidth: 2.5 })}</div>
          <div class="lr-feed-content">
            <div class="lr-feed-desc">${isSession ? "Séance" : `${esc(evt.competence_id || "—")} validée`}</div>
            ${evt.comment ? `<div class="lr-feed-comment">"${esc(evt.comment)}"</div>` : ""}
          </div>
        </div>`;
      })
      .join("");
    return `
      <details class="lr-feed-grp">
        <summary>
          <span class="lr-feed-dot k-validation">${icon("check", { size: 12, strokeWidth: 2.5 })}</span>
          <span class="lr-feed-grp-txt">
            <span class="lr-feed-grp-ttl">${esc(_relTime(g.ts))} — ${esc(summary || "activité")}</span>
            <span class="lr-feed-grp-sub">${esc(g.moniteur)}</span>
          </span>
          <span class="lr-feed-grp-chev">${icon("chevron-down", { size: 14, strokeWidth: 2.2 })}</span>
        </summary>
        <div class="lr-feed-grp-body">${detail}</div>
      </details>`;
  }

  host.innerHTML = `
    <style>
      .lr-feed { margin-bottom: 0; }
      .lr-feed-hd {
        font: 600 11px/1 'Inter', sans-serif;
        text-transform: uppercase; letter-spacing: .08em;
        color: var(--mu2); margin: 0 0 12px;
        display: flex; align-items: center; gap: 8px;
      }
      .lr-feed-hd::after { content:''; flex:1; height:1px; background:var(--bo); }
      .lr-feed-list { display: flex; flex-direction: column; gap: 1px; }
      .lr-feed-item {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--bo2);
      }
      .lr-feed-item:last-child { border-bottom: none; }
      .lr-feed-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 2px;
        display: flex; align-items: center; justify-content: center;
      }
      .lr-feed-dot.k-session { background: color-mix(in srgb, var(--a) 10%, transparent); color: var(--a-txt); }
      .lr-feed-dot.k-validation { background: rgba(16,185,129,.1); color: var(--gr-txt); }
      .lr-feed-content { flex: 1; min-width: 0; }
      .lr-feed-author {
        font: 600 12px/1.2 'Inter', sans-serif;
        color: var(--ink);
        margin-bottom: 2px;
      }
      .lr-feed-desc {
        font: 500 12px/1.4 'Inter', sans-serif;
        color: var(--mu);
      }
      .lr-feed-comment {
        font: italic 11px/1.4 'Inter', sans-serif;
        color: var(--mu2);
        margin-top: 4px;
        padding-left: 6px;
        border-left: 2px solid var(--bo);
      }
      .lr-feed-ts {
        font: 500 10px/1 'Inter', sans-serif;
        color: var(--mu5);
        flex-shrink: 0;
        margin-top: 4px;
      }
      .lr-feed-grp { border-bottom: 1px solid var(--bo2); }
      .lr-feed-grp:last-child { border-bottom: none; }
      .lr-feed-grp summary {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 0;
        min-height: 44px; box-sizing: border-box;
        cursor: pointer; list-style: none;
        -webkit-tap-highlight-color: transparent;
      }
      .lr-feed-grp summary::-webkit-details-marker { display: none; }
      .lr-feed-grp-txt { flex: 1; min-width: 0; }
      .lr-feed-grp-ttl { display: block; font: 600 12.5px/1.3 'Inter', sans-serif; color: var(--ink); }
      .lr-feed-grp-sub { display: block; font: 500 11px/1.3 'Inter', sans-serif; color: var(--mu2); margin-top: 1px; }
      .lr-feed-grp-chev { color: var(--mu2); display: inline-flex; flex-shrink: 0; transition: transform .2s; }
      .lr-feed-grp[open] .lr-feed-grp-chev { transform: rotate(180deg); }
      .lr-feed-grp-body { padding: 0 0 8px 40px; }
      .lr-feed-grp-body .lr-feed-item { padding: 6px 0; border-bottom: none; }
      .lr-feed-all {
        width: 100%; margin-top: 8px; padding: 11px;
        min-height: 44px;
        background: none; border: 1.5px dashed var(--bo);
        border-radius: var(--r);
        font: 600 12.5px/1 'Inter', sans-serif; color: var(--mu);
        cursor: pointer;
        transition: transform .14s var(--ease-snap);
      }
      .lr-feed-all:hover { border-color: var(--bo4); color: var(--ink5); }
      .lr-feed-all:active { transform: scale(.98); }
    </style>
    <div class="lr-feed">
      <div class="lr-feed-hd" style="display:flex;align-items:center;gap:6px;">${icon("clock", { size: 14, strokeWidth: 2.2, color: "var(--a)" })} Fil des moniteurs</div>
      <div class="lr-feed-list">
        ${groups.slice(0, MAX_GROUPS).map(_renderGroup).join("")}
      </div>
      ${
        groups.length > MAX_GROUPS
          ? `<div class="lr-feed-list" id="lr-feed-more" hidden>${groups.slice(MAX_GROUPS).map(_renderGroup).join("")}</div>
             <button class="lr-feed-all" id="lr-feed-all" type="button">Voir tout (${groups.length})</button>`
          : ""
      }
    </div>
  `;

  const moreBtn = host.querySelector("#lr-feed-all");
  moreBtn?.addEventListener("click", () => {
    host.querySelector("#lr-feed-more")?.removeAttribute("hidden");
    moreBtn.remove();
  });
}

function renderMonde(cat) {
  const col = MONDE_COLORS[cat.id] || MONDE_COLORS.C1;
  const acquis = cat.subs.filter(
    (s) => _validationsMap[s.c]?.statut === "acquis",
  ).length;
  const pct =
    cat.subs.length > 0 ? Math.round((acquis / cat.subs.length) * 100) : 0;

  return `
    <div class="lr-monde" role="group" aria-label="${esc(cat.name)} — ${acquis}/${cat.subs.length} acquises">
      <div class="lr-monde-hd" style="background:${col.bg}; border-color:${col.border};">
        <span class="lr-monde-ico">${icon(cat.ico, { size: 18, strokeWidth: 1.5 })}</span>
        <span class="lr-monde-nm">${esc(cat.name)}</span>
        <span class="lr-monde-prog">${acquis}/${cat.subs.length}</span>
      </div>
      <div class="lr-monde-bar-wrap">
        <div class="lr-monde-bar-fill" style="width:${pct}%; background:${col.accent};"></div>
      </div>
      ${cat.subs.map((sub) => renderComp(sub, col)).join("")}
    </div>
  `;
}

function renderComp(sub, col) {
  const val = _validationsMap[sub.c];
  const statut = val?.statut || null;
  const cfg = STATUT_CFG[statut] || STATUT_CFG.null;

  return `
    <div class="lr-comp" data-comp-id="${esc(sub.c)}" data-comp-nom="${esc(sub.n)}"
         role="button" tabindex="0" aria-label="${esc(sub.n)} — ${cfg.label}. Appuyer pour évaluer">
      <span class="lr-comp-dot" style="background:${cfg.dot}"></span>
      <span class="lr-comp-code" style="color:${col.accent}; background:${col.bg}">${esc(sub.c)}</span>
      <span class="lr-comp-nom">${esc(sub.n)}</span>
      <span class="lr-comp-badge" style="color:${cfg.color}; background:${cfg.bg}">${cfg.label}</span>
      <span class="lr-comp-chev" aria-hidden="true">›</span>
    </div>
  `;
}

// ─── Wire principal ───────────────────────────────────────────────
function wireMain() {
  // Retour
  _root
    .querySelector(".lr-back")
    ?.addEventListener("click", () => navigate("#/eleves"));

  // Bilan trimestriel
  _root.querySelector("#lr-bilan-btn")?.addEventListener("click", () => {
    track("livret.bilan.open", { eleve_id: _eleveId });
    navigate(`#/bilan/${_eleveId}`);
  });

  // Clic sur sous-compétence → ouvrir sheet
  _root.querySelectorAll(".lr-comp[data-comp-id]").forEach((el) => {
    const handler = () => openSheet(el.dataset.compId, el.dataset.compNom);
    el.addEventListener("click", handler);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handler();
    });
  });
}

// ─── Bottom sheet ─────────────────────────────────────────────────
function openSheet(compId, compNom) {
  _sheetComp = { c: compId, n: compNom };
  const existing = _validationsMap[compId];
  _sheetStatut = existing?.statut || null;
  _sheetNote = existing?.note || "";

  const overlay = document.createElement("div");
  overlay.className = "lr-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `Évaluer ${compNom}`);

  overlay.innerHTML = `
    <div class="lr-sheet">
      <div class="lr-sheet-hd">
        <h2 class="lr-sheet-title">${esc(compNom)}</h2>
        <button class="lr-sheet-close" aria-label="Fermer">✕</button>
      </div>
      <div class="lr-sheet-body">
        <div>
          <label class="lr-note-label">Statut</label>
          <div class="lr-statut-grid">
            ${renderStatutBtn("acquis", icon("check-circle", { size: 16, strokeWidth: 2.2, color: "var(--grd)" }), "Acquis")}
            ${renderStatutBtn("en_cours", icon("refresh-cw", { size: 16, strokeWidth: 2.2, color: "var(--amk)" }), "En cours")}
            ${renderStatutBtn("a_retravailler", icon("alert-triangle", { size: 16, strokeWidth: 2.2, color: "var(--rdk)" }), "À retravailler")}
          </div>
        </div>
        <div>
          <label class="lr-note-label" for="lr-note-ta">Note (optionnel)</label>
          <textarea
            id="lr-note-ta"
            class="lr-note"
            maxlength="280"
            placeholder="Observations sur la séance…"
            rows="3"
          >${esc(_sheetNote)}</textarea>
          <div class="lr-note-count">${_sheetNote.length}/280</div>
        </div>
        <button class="lr-btn-save" ${_sheetStatut ? "" : "disabled"}>
          Enregistrer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Fermer en cliquant l'overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSheet(overlay);
  });
  overlay
    .querySelector(".lr-sheet-close")
    .addEventListener("click", () => closeSheet(overlay));
  enableSheetSwipe(
    overlay.querySelector(".lr-sheet"),
    () => closeSheet(overlay),
    { overlay },
  );

  // Boutons statut
  overlay.querySelectorAll(".lr-statut-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _sheetStatut = btn.dataset.statut;
      overlay
        .querySelectorAll(".lr-statut-btn")
        .forEach(
          (b) =>
            (b.className = `lr-statut-btn${b.dataset.statut === _sheetStatut ? " selected-" + _sheetStatut : ""}`),
        );
      overlay.querySelector(".lr-btn-save").disabled = false;
    });
  });

  // Note textarea
  const ta = overlay.querySelector(".lr-note");
  const counter = overlay.querySelector(".lr-note-count");
  ta.addEventListener("input", () => {
    _sheetNote = ta.value.slice(0, 280);
    ta.value = _sheetNote;
    counter.textContent = `${_sheetNote.length}/280`;
  });

  // Valider
  overlay
    .querySelector(".lr-btn-save")
    .addEventListener("click", () => doSave(overlay));

  // Focus trap initial
  requestAnimationFrame(() => ta.focus());
}

function renderStatutBtn(statut, ico, lbl) {
  const selected = _sheetStatut === statut;
  return `
    <button class="lr-statut-btn${selected ? " selected-" + statut : ""}" data-statut="${esc(statut)}">
      <span class="lr-statut-btn-ico">${ico}</span>
      <span class="lr-statut-btn-lbl">${lbl}</span>
    </button>
  `;
}

function closeSheet(overlay) {
  overlay.style.animation = "lr-overlay-in .18s ease reverse";
  setTimeout(() => overlay.remove(), 180);
}

async function doSave(overlay) {
  if (!_sheetComp || !_sheetStatut) return;

  const btn = overlay.querySelector(".lr-btn-save");
  btn.disabled = true;
  btn.textContent = "Enregistrement…";

  const note = _sheetNote.trim() || null;
  let saveError = null;

  if (_sheetStatut === "acquis") {
    // « Acquis » passe par validate_session (SECURITY DEFINER) : il écrit la
    // validation ET notifie l'élève côté serveur (comp_acquise). L'INSERT
    // notif direct du client était bloqué par la RLS notifications_insert
    // (WITH CHECK user_id = get_my_id() → un moniteur ne peut pas notifier
    // un autre user). Aucun effet de bord : validate_session n'écrit pas
    // dans sessions_moniteur.
    const { data, error } = await sb.rpc("validate_session", {
      p_eleve_id: _eleveId,
      p_session_date: new Date().toISOString().slice(0, 10),
      p_note: note,
      p_acquis: [_sheetComp.c],
    });
    saveError = error || (data?.error ? new Error(data.error) : null);
  } else {
    // « En cours » / « à retravailler » : upsert direct. Pas de notif, et il
    // faut pouvoir RÉTROGRADER une compétence acquise (correction), ce que
    // validate_session interdit volontairement. Pas de RLS bloquante ici.
    const payload = {
      eleve_id: _eleveId,
      competence_id: _sheetComp.c,
      validated_by: _me.id,
      statut: _sheetStatut,
      validated_at: new Date().toISOString(),
    };
    if (note) payload.note_enseignant = note;
    const { error } = await sb
      .from("validations")
      .upsert(payload, { onConflict: "eleve_id,competence_id" });
    saveError = error;
  }

  if (saveError) {
    console.error("[livret-remc] save failed", saveError);
    toast("Erreur lors de la sauvegarde", "error");
    btn.disabled = false;
    btn.textContent = "Enregistrer";
    return;
  }

  track("competence.evaluated", {
    competence_id: _sheetComp.c,
    eleve_id: _eleveId,
    statut: _sheetStatut,
    auto_ecole_id: _me.auto_ecole_id,
  });

  // Mettre à jour le state local
  _validationsMap[_sheetComp.c] = { statut: _sheetStatut, note: _sheetNote }; // note = note_enseignant mapped locally

  // Acquis = moment de valeur : on PROUVE l'avancée de l'élève dans le sheet.
  // Autres statuts (en cours / à retravailler) = pas de célébration, toast neutre.
  if (_sheetStatut === "acquis") {
    showSuccessState(overlay);
  } else {
    toast("Évaluation enregistrée.", "success");
    closeSheet(overlay);
    render();
  }
}

// État succès : referme la boucle « je valide → l'élève avance → il le voit ».
function showSuccessState(overlay) {
  const acquisCount = Object.values(_validationsMap).filter(
    (v) => v.statut === "acquis",
  ).length;
  const pct = REMC_TOTAL > 0 ? Math.round((acquisCount / REMC_TOTAL) * 100) : 0;
  const prenom = esc(_eleveProfil?.prenom || "Ton élève");
  const complete = acquisCount >= REMC_TOTAL;

  const sheet = overlay.querySelector(".lr-sheet");
  if (!sheet) {
    closeSheet(overlay);
    render();
    return;
  }

  sheet.innerHTML = `
    <div class="lr-success">
      <div class="lr-success-check">${icon("check", { size: 32, strokeWidth: 3, color: "var(--grd)" })}</div>
      <div class="lr-success-comp">${esc(_sheetComp.n)} · acquis</div>
      <div class="lr-success-title">${complete ? `${prenom} a tout validé` : `${prenom} vient d'avancer`}</div>
      <div class="lr-success-bar"><div class="lr-success-fill" style="width:0%"></div></div>
      <div class="lr-success-meta"><b>${acquisCount}/${REMC_TOTAL}</b> compétences · ${pct}%</div>
      <div class="lr-success-note">${complete ? `${prenom} est prêt pour l'examen.` : `${prenom} le voit déjà dans son appli.`}</div>
      <button class="lr-btn-save" id="lr-success-continue" type="button">Continuer</button>
    </div>
  `;

  // Anime la barre vers la progression réelle (l'avancée se voit)
  const fill = sheet.querySelector(".lr-success-fill");
  requestAnimationFrame(() => {
    if (fill) fill.style.width = pct + "%";
  });

  sheet.querySelector("#lr-success-continue")?.addEventListener("click", () => {
    closeSheet(overlay);
    render();
  });
}
