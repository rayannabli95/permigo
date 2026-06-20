// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes élèves
// Liste filtrée + progression livret par élève
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";
import {
  renderEmptyState,
  emptyState,
} from "@/components/common/empty-state.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { fmtName } from "@/utils/fmt-name.js";
import { triggerEleveRecovery } from "@/services/eleve-recovery.js";
import { icon } from "@/utils/icons.js";
import { openInviteEleveModal } from "@/services/invite-eleve.js";
import { shouldShowHint, markHintSeen } from "@/utils/coach-hint.js";

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
  .me-page {
    padding: 20px 16px 100px;
    max-width: 600px;
    margin: 0 auto;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--ink);
  }

  /* Header */
  .me-hd { margin-bottom: 24px; }
  .me-h1 {
    font: 700 24px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }
  .me-sub {
    font: 500 13px/1.4 'Inter', sans-serif;
    color: var(--mu2);
    margin: 0;
  }

  /* Search */
  .me-search-wrap {
    position: relative;
    margin-bottom: 16px;
  }
  .me-search-ico {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--mu2);
    font-size: 15px;
    pointer-events: none;
  }
  .me-search {
    width: 100%;
    padding: 12px 12px 12px 40px;
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r);
    font: 500 16px/1 'Inter', sans-serif;
    color: var(--ink);
    outline: none;
    transition: border-color .15s var(--ease), box-shadow .15s var(--ease);
    box-sizing: border-box;
  }
  .me-search::placeholder { color: var(--mu2); }
  .me-search:focus { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
  .me-search::-webkit-search-cancel-button { -webkit-appearance: none; appearance: none; }
  .me-search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px; height: 22px;
    border: none;
    background: var(--bo);
    border-radius: 50%;
    color: var(--mu);
    font-size: 12px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-family: inherit;
    flex-shrink: 0;
  }
  .me-search-clear.visible { display: flex; }

  /* Tabs */
  .me-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: var(--bg2);
    padding: 4px;
    border-radius: var(--r);
  }
  .me-tab {
    flex: 1;
    padding: 8px 2px;
    border: none;
    background: transparent;
    border-radius: var(--r-sm);
    font: 600 11.5px/1 'Inter', sans-serif;
    color: var(--mu2);
    cursor: pointer;
    transition: background .15s var(--ease), color .15s var(--ease);
    min-height: 44px; /* cible tactile a11y */
    white-space: nowrap;
  }
  .me-tab.active {
    background: var(--su);
    color: var(--adk);
    box-shadow: var(--s1);
  }

  /* Liste */
  .me-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Card élève */
  .me-row {
    background: var(--su);
    border: 1px solid var(--bo);
    border-radius: var(--r);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--s0);
    transition: border-color .15s var(--ease), transform .15s var(--ease), box-shadow .15s var(--ease);
    cursor: pointer;
    min-height: 44px;
  }
  @media (hover: hover) and (pointer: fine) {
    .me-row:hover {
      border-color: var(--bo4);
      transform: translateY(-1px);
      box-shadow: var(--s2);
    }
  }
  .me-row:active { transform: scale(0.97); transition: transform 180ms cubic-bezier(0.23,1,0.32,1); }
  @media (prefers-reduced-motion: reduce) { .me-row:active { transform: none; } }
  .me-row:focus { outline: none; }
  .me-row:focus-visible { outline: 3px solid var(--a); outline-offset: 2px; border-radius: var(--r); }

  /* Avatar */
  .me-av {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 600 14px/1 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    flex-shrink: 0;
  }

  /* Infos */
  .me-info { flex: 1; min-width: 0; }
  .me-nom {
    font: 700 14.5px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .me-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .me-meta-count {
    font: 500 11px/1 'Inter', sans-serif;
    color: var(--mu2);
  }

  /* Badge statut */
  .me-badge {
    font: 600 11px/1 'Inter', sans-serif;
    padding: 3px 8px;
    border-radius: var(--r);
    flex-shrink: 0;
  }
  .me-badge.actif {
    color: var(--grd);
    background: rgba(16,185,129,.1);
  }
  .me-badge.inactif {
    color: var(--mu2);
    background: rgba(148,163,184,.1);
  }
  .me-badge.pret {
    color: var(--grd);
    background: rgba(16,185,129,.12);
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .me-badge.recu {
    color: var(--adk);
    background: color-mix(in srgb, var(--a) 14%, transparent);
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .me-badge.planifie {
    color: #6366f1;
    background: rgba(99,102,241,.12);
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  /* Progression REMC */
  .me-prog {
    flex: 1;
    min-width: 60px;
    max-width: 88px;
  }
  .me-prog-bar {
    height: 4px;
    background: var(--bo);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  .me-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--a), var(--a-lt));
    border-radius: 2px;
    transition: width .6s var(--ease);
  }
  /* Lecture instantanée par état : vert = prêt/diplômé (objectif),
     ambre = à relancer (attention). Défaut accent = en cours. */
  .me-prog-fill.is-pret { background: linear-gradient(90deg, var(--grd), var(--gr)); }
  .me-prog-fill.is-relancer { background: var(--am); }
  .me-prog-txt {
    font: 700 12px/1 'IBM Plex Mono', monospace;
    color: var(--ink3);
    text-align: right;
  }
  .me-prog-txt.is-pret { color: var(--gr-txt); }
  .me-prog-txt.is-relancer { color: var(--am-txt); }

  /* Bouton actions rapides */
  .me-more {
    flex-shrink: 0;
    align-self: center;
    width: 44px; height: 44px; /* cible tactile a11y */
    margin: 0 -8px 0 -2px; /* recale optiquement sur le bord droit de la carte */
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; border-radius: var(--r);
    color: var(--mu2); cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background .12s, color .12s;
  }
  .me-more:hover { background: var(--bg2); color: var(--ink); }
  .me-more:active { transform: scale(.92); }
  .me-more:focus-visible { outline: 2px solid var(--a); outline-offset: 2px; }

  /* Chevron (legacy) */
  .me-chev {
    color: var(--mu2);
    font-size: 16px;
    flex-shrink: 0;
  }

  /* Empty state */
  .me-empty {
    padding: 48px 20px;
    text-align: center;
    color: var(--mu2);
    font: 500 14px/1.6 'Inter', sans-serif;
  }
  .me-empty-ico {
    font-size: 36px;
    margin-bottom: 12px;
    display: block;
    opacity: .6;
  }

  /* Skeleton */
  .me-skel-list { display: flex; flex-direction: column; gap: 8px; }
  .me-skel-row {
    height: 72px;
    background: var(--su);
    border: 1.5px solid var(--bo);
    border-radius: var(--r-xl);
    animation: skel-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Bouton Inviter */
  .me-invite-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; min-height: 44px; border-radius: var(--r);
    background: color-mix(in srgb, var(--a) 10%, transparent); border: 1px solid color-mix(in srgb, var(--a) 20%, transparent);
    color: var(--a-txt); font: 600 13px/1 'Inter', sans-serif;
    cursor: pointer; flex-shrink: 0;
    transition: background .12s, border-color .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .me-invite-btn:hover { background: color-mix(in srgb, var(--a) 18%, transparent); border-color: color-mix(in srgb, var(--a) 40%, transparent); }
  .me-invite-btn:active { background: color-mix(in srgb, var(--a) 22%, transparent); }

  /* Anti-décrochage */
  .me-relancer-section {
    background: rgba(245,158,11,.06);
    border: 1.5px solid rgba(245,158,11,.25);
    border-radius: var(--r-xl);
    padding: 14px 16px;
    margin-bottom: 16px;
    animation: skel-pulse 0s; /* reset */
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    box-shadow: var(--s-am);
    transition: transform .14s var(--ease-snap);
  }
  .me-relancer-section:active { transform: scale(0.98); transition: transform 180ms cubic-bezier(0.23,1,0.32,1); }
  @media (prefers-reduced-motion: reduce) { .me-relancer-section:active { transform: none; } }
  .me-relancer-section:focus-visible { outline: 3px solid var(--amx); outline-offset: 2px; }
  .me-relancer-title {
    font: 700 13px/1.2 'Plus Jakarta Sans', sans-serif;
    color: var(--amx);
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .me-relancer-sub {
    font: 500 12px/1.4 'Inter', sans-serif;
    color: #92400e;
    margin: 0;
  }

  /* Badge à relancer inline */
  .me-badge-relancer {
    font: 600 10px/1 'Inter', sans-serif;
    padding: 3px 7px;
    border-radius: var(--r);
    color: var(--amx);
    background: rgba(245,158,11,.12);
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  /* FAB Séance */
  .me-fab {
    position: fixed;
    bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 16px);
    right: 16px;
    z-index: 50;
    display: flex; align-items: center; gap: 8px;
    padding: 0 20px 0 16px;
    height: 52px;
    background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%);
    color: var(--a-ink);
    border: none; border-radius: 26px;
    font: 800 14px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 18px -4px color-mix(in srgb, var(--a) 60%, transparent), 0 2px 6px rgba(0,0,0,.12), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset;
    transition: transform .15s var(--ease), box-shadow .15s var(--ease);
    -webkit-tap-highlight-color: transparent;
    animation: meFabIn .5s .3s var(--ease-spring) both;
  }
  .me-fab:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px -4px color-mix(in srgb, var(--a) 65%, transparent), 0 2px 8px rgba(0,0,0,.14);
  }
  .me-fab:active { transform: scale(.94); box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--a) 40%, transparent); }
  .me-fab:focus-visible { outline: 3px solid var(--a); outline-offset: 3px; }
  @keyframes meFabIn {
    from { opacity: 0; transform: translateY(20px) scale(.9); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) { .me-fab { animation: none; } }
</style>`;

const INACTIF_SEUIL_MS = 14 * 86400000; // 14 jours

// « Prêt » pour l'examen = 100% des compétences de BASE (C1+C2+C3, 24
// sous-compétences). C4 (conduite autonome) ne conditionne pas la
// présentation au permis. Règle métier validée avec le moniteur.
const BASE_CATS = ["C1", "C2", "C3"];
const BASE_COMPS = REMC.filter((c) => BASE_CATS.includes(c.id)).flatMap((c) =>
  c.subs.map((s) => s.c),
);
const APPROCHE_SEUIL = 18; // < bases complètes mais bien avancé → en approche

/** Sous-compétences de base (C1-C3) non encore acquises. */
function baseManquantes(acquisSet) {
  return BASE_COMPS.filter((c) => !acquisSet.has(c));
}

/**
 * État de readiness d'un élève vis-à-vis de l'examen.
 * @param {Set<string>} acquisSet  compétences acquises (école)
 * @returns {'recu'|'pret'|'en_approche'|'en_cours'}
 */
function computeReadiness(acquisSet, examStatut) {
  if (examStatut === "recu") return "recu";
  if (baseManquantes(acquisSet).length === 0) return "pret";
  if (acquisSet.size >= APPROCHE_SEUIL) return "en_approche";
  return "en_cours";
}

/** Liste des sous-compétences non encore acquises pour un élève. */
function missingComps(acquisSet) {
  const out = [];
  for (const cat of REMC) {
    for (const s of cat.subs) {
      if (!acquisSet.has(s.c)) out.push(s);
    }
  }
  return out;
}

/** Date du jour au format ISO court (YYYY-MM-DD). */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Format court FR d'une date ISO d'examen (ex: "15 juin"). */
function fmtExamDate(iso) {
  if (!iso) return "planifié";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "planifié";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = []; // { id, prenom, nom, acquis, total, actif }
let _query = "";
let _tab = "tous"; // 'tous' | 'actifs' | 'arelancer' | 'prets' | 'recus'
let _drillComp = null; // competence_id si mode drill bloque_sur

// ─── Entry point ─────────────────────────────────────────────────
export async function unmount() {
  document.querySelector(".me-qm")?.remove();
  document.querySelector(".me-miss")?.remove();
  document.querySelector(".me-confirm")?.remove();
  document.querySelector(".me-undo")?.remove();
}

export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _query = "";
  _tab = "tous";
  _drillComp = null;

  // Lire le param bloque_sur depuis le hash URL (#/eleves?bloque_sur=C2a)
  const hash = window.location.hash;
  const qmark = hash.indexOf("?");
  if (qmark >= 0) {
    const params = new URLSearchParams(hash.slice(qmark + 1));
    _drillComp = params.get("bloque_sur") || null;
  }

  track("page.view", {
    page: "mes_eleves",
    role: _me.role,
    drill: _drillComp || undefined,
  });

  // Skeleton
  root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <h1 class="me-h1">${_drillComp ? `Élèves bloqués sur ${esc(_drillComp)}` : "Mes élèves"}</h1>
        <p class="me-sub">Récupération de la liste…</p>
      </header>
      <div class="me-skel-list">
        ${[1, 2, 3, 4].map(() => `<div class="me-skel-row"></div>`).join("")}
      </div>
    </div>
  `;

  if (_drillComp) {
    await loadDrillData(_drillComp);
    renderDrill();
  } else {
    await loadData();
    render();
    wire();
  }
}

// ─── Data ────────────────────────────────────────────────────────
async function loadData() {
  // 1. Tous les élèves de mon auto-école (RLS multi-moniteurs : on voit tout le monde)
  //    Côté frontend on marquera ensuite les "attitrés" (enseignant_id = me.id)
  const { data: elevesRaw, error: e1 } = await sb
    .from("profiles")
    .select("id, prenom, nom, enseignant_id, last_active_at, avatar_url")
    .eq("role", "eleve")
    .order("prenom");

  if (e1) {
    console.error("[mes-eleves] query error", e1);
    toast("Impossible de charger les élèves", "error");
    _eleves = [];
    return;
  }

  if (!elevesRaw || elevesRaw.length === 0) {
    const {
      data: { session },
    } = await sb.auth.getSession();
    console.warn(
      "[mes-eleves] 0 élèves retournés. Session active:",
      !!session,
      "| CUR_USER:",
      _me?.id,
      "| auto_ecole_id:",
      _me?.auto_ecole_id,
    );
  }

  // Tag "attitré" sur chaque élève — affichage UI peut prioriser
  const rawList = (elevesRaw || []).map((e) => ({
    ...e,
    isMine: e.enseignant_id === _me.id,
  }));

  // 2. Progression REMC réelle de chaque élève = TOTAL des compétences acquises
  //    (peu importe le moniteur validateur — auto-école multi-moniteurs).
  //    La barre "X/31" doit refléter l'avancement permis de l'élève, pas la
  //    seule contribution du moniteur courant (sinon 0/31 trompeur pour un
  //    élève suivi par un collègue). RLS partage déjà les validations école.
  const { data: valsRaw, error: e2 } = await sb
    .from("validations")
    .select("eleve_id, competence_id")
    .eq("statut", "acquis");

  if (e2) console.error("[mes-eleves] validations query error", e2);

  // Map : eleve_id → Set des competence_id acquis (total école).
  // Le Set alimente à la fois le count et la liste des compétences manquantes.
  const acquisSetByEleve = {};
  (valsRaw || []).forEach((v) => {
    if (!v.competence_id) return;
    (acquisSetByEleve[v.eleve_id] ||= new Set()).add(v.competence_id);
  });

  // 3. Dernier examen par élève (le plus récent fait foi).
  const { data: examsRaw, error: e3 } = await sb
    .from("examens")
    .select("eleve_id, statut, date_examen, created_at")
    .order("created_at", { ascending: false });

  if (e3) console.error("[mes-eleves] examens query error", e3);

  const lastExamByEleve = {};
  (examsRaw || []).forEach((ex) => {
    // ordonné desc → la première ligne vue par élève est la plus récente
    if (!lastExamByEleve[ex.eleve_id]) lastExamByEleve[ex.eleve_id] = ex;
  });

  // Set des élèves ayant au moins 1 compétence acquise
  const touchedEleves = new Set(Object.keys(acquisSetByEleve));

  const now = Date.now();
  _eleves = rawList
    .map((e, i) => {
      const acquisSet = acquisSetByEleve[e.id] || new Set();
      const acquis = acquisSet.size;
      const actif = touchedEleves.has(e.id) || !!e.last_active_at;
      const lastActive = e.last_active_at
        ? new Date(e.last_active_at).getTime()
        : null;
      const aRelancer =
        actif && (!lastActive || now - lastActive >= INACTIF_SEUIL_MS);
      const joursInactif = lastActive
        ? Math.floor((now - lastActive) / 86400000)
        : null;
      const lastExam = lastExamByEleve[e.id] || null;
      const examStatut = lastExam ? lastExam.statut : null;
      const examDate = lastExam ? lastExam.date_examen : null;
      return {
        ...e,
        acquis,
        acquisSet,
        total: REMC_TOTAL,
        actif,
        idx: i,
        aRelancer,
        joursInactif,
        examStatut,
        examDate,
        readiness: computeReadiness(acquisSet, examStatut),
      };
    })
    // Mes élèves attitrés en haut, puis ceux que j'ai déjà validé, puis le reste
    .sort((a, b) => {
      if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
      if (touchedEleves.has(a.id) !== touchedEleves.has(b.id))
        return touchedEleves.has(a.id) ? -1 : 1;
      return (a.prenom || "").localeCompare(b.prenom || "");
    });
}

// ─── Drill mode : élèves bloqués sur une compétence ──────────────
let _drillEleves = [];

async function loadDrillData(compId) {
  try {
    const { data, error } = await sb.rpc("get_eleves_bloque_sur_competence", {
      p_competence_id: compId,
      p_window_days: 30,
    });
    if (error) throw error;
    _drillEleves = data || [];
  } catch (e) {
    console.error("[mes-eleves] drill load error", e);
    _drillEleves = [];
    toast("Impossible de charger le drill", "error");
  }
}

function renderDrill() {
  const page = _root.querySelector(".me-page");
  if (!page) return;

  const count = _drillEleves.length;
  page.innerHTML = `
    <header class="me-hd" style="margin-bottom:4px;">
      <div>
        <h1 class="me-h1" style="display:flex;align-items:center;gap:8px;font-size:17px;">
          ${icon("search", { size: 16, strokeWidth: 2.2, color: "var(--a)" })}
          Bloqués — compétence ${esc(_drillComp)}
        </h1>
        <p class="me-sub">${count} élève${count !== 1 ? "s" : ""} en difficulté sur cette compétence · 30 derniers jours</p>
      </div>
    </header>
    <button class="me-drill-back" id="me-drill-back"
            style="display:flex;align-items:center;gap:6px;margin-bottom:16px;padding:8px 12px;background:var(--su);border:1.5px solid var(--bo);border-radius:10px;font:600 13px/1 'Inter',sans-serif;color:var(--a-txt);cursor:pointer;">
      ${icon("arrow-left", { size: 14, strokeWidth: 2.5 })} Voir tous les élèves
    </button>
    <div class="me-list">
      ${
        count === 0
          ? `<div style="text-align:center;padding:40px 20px;color:var(--mu2);font:500 14px/1.6 'Inter',sans-serif;">
             ${icon("check-circle", { size: 32, strokeWidth: 1.5, color: "var(--bo)" })}
             <br><br>Aucun élève en difficulté sur cette compétence ces 30 derniers jours.
           </div>`
          : _drillEleves
              .map((e) => {
                const nm = esc(
                  fmtName(`${e.prenom || ""} ${e.nom || ""}`.trim()),
                );
                return `
              <div class="me-row" data-eleve-id="${esc(e.id)}" role="button" tabindex="0">
                <div class="me-ava" style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 44)}</div>
                <div class="me-info">
                  <div class="me-name">${nm}</div>
                  <div class="me-meta">
                    ${e.jours_bloque != null ? `<span style="font:500 11px/1 'Inter',sans-serif;color:var(--rdk);">Bloqué depuis ${e.jours_bloque}j</span>` : ""}
                  </div>
                </div>
                <div class="me-eleve-chev">${icon("chevron-right", { size: 16, strokeWidth: 2.5, color: "var(--bo4)" })}</div>
              </div>
            `;
              })
              .join("")
      }
    </div>
  `;

  // Back button
  _root.querySelector("#me-drill-back")?.addEventListener("click", () => {
    navigate("#/eleves");
  });

  // Row click → livret
  _root.querySelectorAll(".me-row[data-eleve-id]").forEach((row) => {
    row.addEventListener("click", () => {
      track("drill.eleve.open", {
        eleve_id: row.dataset.eleveId,
        comp: _drillComp,
      });
      navigate(`#/livret/${row.dataset.eleveId}`);
    });
  });
}

// ─── Render ──────────────────────────────────────────────────────
function render() {
  const filtered = filterList();
  // Les élèves reçus sont archivés : ils sortent du roster actif et n'entrent
  // que dans l'onglet « Reçus ».
  const recusCount = _eleves.filter((e) => e.readiness === "recu").length;
  const roster = _eleves.filter((e) => e.readiness !== "recu");
  const total = roster.length;
  // « Actifs » = actifs hors ceux à relancer (les deux compteurs ne se chevauchent pas)
  const actifs = roster.filter((e) => e.actif && !e.aRelancer).length;
  const prets = roster.filter((e) => e.readiness === "pret").length;
  const aRelancerList = roster.filter((e) => e.aRelancer);

  // Bandeau 1 ligne cliquable ; l'explication n'apparaît qu'à la 1re visite
  const showRelancerHint =
    aRelancerList.length > 0 && shouldShowHint("relancer");
  if (showRelancerHint) markHintSeen("relancer");
  const relancerSection =
    aRelancerList.length > 0
      ? `
    <div class="me-relancer-section" id="me-relancer-section" role="button" tabindex="0"
         aria-label="${aRelancerList.length} élève${aRelancerList.length > 1 ? "s" : ""} sans activité depuis plus de 14 jours — voir la liste">
      <p class="me-relancer-title" style="display:flex;align-items:center;gap:6px;margin:0;">${icon("alert-circle", { size: 15, strokeWidth: 2.2, color: "var(--amx)" })} ${aRelancerList.length} élève${aRelancerList.length > 1 ? "s" : ""} sans activité depuis +14 jours <span style="margin-left:auto;display:inline-flex">${icon("chevron-right", { size: 15, strokeWidth: 2.2, color: "var(--amx)" })}</span></p>
      ${showRelancerHint ? `<p class="me-relancer-sub">Un rappel ou un point en leçon suffit souvent à relancer la dynamique.</p>` : ""}
    </div>
  `
      : "";

  _root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <h1 class="me-h1">Mes élèves</h1>
          <div style="display:flex;gap:8px;align-items:center">
            <button id="me-rank-btn" class="me-invite-btn" type="button"
                    aria-label="Classement des élèves">
              ${icon("award", { size: 14, strokeWidth: 2.2 })} Classement
            </button>
            <button id="me-invite-btn" class="me-invite-btn" type="button"
                    aria-label="Inviter un élève">
              ${icon("user-plus", { size: 14, strokeWidth: 2.2 })} Inviter
            </button>
          </div>
        </div>
        <p class="me-sub">${
          prets > 0
            ? `${total} élève${total > 1 ? "s" : ""} · <b style="color:var(--grd);font-weight:800">${prets} prêt${prets > 1 ? "s" : ""} pour l'examen</b>`
            : total === 0
              ? "Invite ton premier élève pour commencer"
              : `${total} élève${total > 1 ? "s" : ""} · ${actifs} actif${actifs > 1 ? "s" : ""} cette semaine`
        }</p>
      </header>

      ${relancerSection}

      <div class="me-search-wrap">
        <span class="me-search-ico">${icon("search", { size: 15, strokeWidth: 2, color: "var(--mu2)" })}</span>
        <input
          class="me-search"
          type="search"
          placeholder="Chercher par nom ou prénom…"
          value="${esc(_query)}"
          autocomplete="off"
          aria-label="Chercher un élève par nom ou prénom"
        />
        <button class="me-search-clear${_query ? " visible" : ""}" id="me-search-clear" type="button" aria-label="Effacer la recherche">✕</button>
      </div>

      <div class="me-tabs" role="tablist">
        <button class="me-tab${_tab === "tous" ? " active" : ""}" data-tab="tous" role="tab" aria-selected="${_tab === "tous"}" title="Tous tes élèves en cours">Tous (${total})</button>
        <button class="me-tab${_tab === "actifs" ? " active" : ""}" data-tab="actifs" role="tab" aria-selected="${_tab === "actifs"}" title="Élèves qui ont validé au moins une compétence et sont actifs">En cours (${actifs})</button>
        <button class="me-tab${_tab === "prets" ? " active" : ""}" data-tab="prets" role="tab" aria-selected="${_tab === "prets"}"
                style="${prets > 0 && _tab !== "prets" ? "color:var(--grd)" : ""}" title="Élèves dont les compétences de base C1-C3 sont toutes acquises">Prêts (${prets})</button>
        <button class="me-tab${_tab === "arelancer" ? " active" : ""}" data-tab="arelancer" role="tab" aria-selected="${_tab === "arelancer"}"
                style="${aRelancerList.length > 0 && _tab !== "arelancer" ? "color:var(--amx)" : ""}" title="Sans activité depuis 14 jours ou plus">À relancer (${aRelancerList.length})</button>
        <button class="me-tab${_tab === "recus" ? " active" : ""}" data-tab="recus" role="tab" aria-selected="${_tab === "recus"}" title="Élèves ayant obtenu le permis">Diplômés (${recusCount})</button>
      </div>

      <button class="me-fab" id="me-fab" aria-label="Enregistrer une séance">
        ${icon("plus", { size: 20, strokeWidth: 2.5 })} Séance
      </button>

      <div class="me-list">
        ${
          filtered.length === 0
            ? _tab === "tous" && !_query
              ? emptyState({
                  image: "/skins/empty-states/empty_eleves.png",
                  title: "Aucun élève pour l'instant",
                  body: "Envoie un lien par SMS ou WhatsApp — ton élève crée son compte en 30 secondes et tu suis sa progression en temps réel.",
                  cta: `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px">
                    <button id="me-invite-empty-btn" style="display:inline-flex;align-items:center;gap:7px;padding:12px 22px;background:var(--a);color:var(--a-ink);border:0;border-radius:12px;font:600 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;min-height:44px;transition:transform .12s,background .12s">
                      ${icon("user-plus", { size: 15, strokeWidth: 2.2 })} Inviter mon premier élève
                    </button>
                  </div>`,
                })
              : `<div class="me-empty">
                   <span class="me-empty-ico">${icon("users", { size: 30 })}</span>
                   ${_query ? 'Aucun résultat pour <strong>"' + esc(_query) + '"</strong>.' : "Aucun élève dans cet onglet."}
                 </div>`
            : filtered.map(renderRow).join("")
        }
      </div>
    </div>

  `;
}

function filterList() {
  let list = _eleves;

  if (_tab === "recus") {
    list = list.filter((e) => e.readiness === "recu");
  } else {
    // tous les autres onglets excluent les élèves reçus (archivés)
    list = list.filter((e) => e.readiness !== "recu");
    if (_tab === "actifs") list = list.filter((e) => e.actif && !e.aRelancer);
    if (_tab === "arelancer") list = list.filter((e) => e.aRelancer);
    if (_tab === "prets") list = list.filter((e) => e.readiness === "pret");
  }

  if (_query.trim()) {
    const q = _query.toLowerCase().trim();
    list = list.filter(
      (e) =>
        (e.prenom || "").toLowerCase().includes(q) ||
        (e.nom || "").toLowerCase().includes(q),
    );
  }

  return list;
}

function renderRow(eleve) {
  const pct =
    eleve.total > 0 ? Math.round((eleve.acquis / eleve.total) * 100) : 0;
  const fullNom = esc(
    fmtName([eleve.prenom, eleve.nom].filter(Boolean).join(" ")) || "—",
  );

  // Onglet « Tous » = liste épurée (nom + progression). Les infos contextuelles
  // — date d'examen, jours d'inactivité — vivent dans leurs FILTRES dédiés
  // (Examen / Inactifs), pas en doublon sur chaque ligne de « Tous ».
  const epure = _tab === "tous";
  // Couleur de progression = état actionnable (vert prêt / ambre relancer / accent en cours)
  const progState =
    eleve.readiness === "pret" || eleve.readiness === "recu"
      ? "is-pret"
      : eleve.aRelancer
        ? "is-relancer"
        : "";
  const badges =
    eleve.readiness === "recu"
      ? `<span class="me-badge recu">${icon("check", { size: 11, strokeWidth: 2.6 })} Diplômé</span>`
      : [
          eleve.readiness === "pret"
            ? `<span class="me-badge pret">${icon("check", { size: 11, strokeWidth: 2.6 })} Prêt</span>`
            : "",
          !epure && eleve.examStatut === "planifie"
            ? `<span class="me-badge planifie">${icon("calendar", { size: 11, strokeWidth: 2.4 })} ${esc(fmtExamDate(eleve.examDate))}</span>`
            : "",
          !epure && eleve.aRelancer
            ? `<span class="me-badge-relancer" style="display:inline-flex;align-items:center;gap:3px;">${icon("alert-circle", { size: 11, strokeWidth: 2.2 })} ${eleve.joursInactif ? `+${eleve.joursInactif}j sans activité` : "Inactif"}</span>`
            : "",
        ]
          .filter(Boolean)
          .join(" ");

  return `
    <div class="me-row" data-eleve-id="${esc(eleve.id)}" role="button" tabindex="0"
         aria-label="Ouvrir le livret de ${fullNom} — ${eleve.acquis}/${eleve.total} compétences acquises${eleve.readiness === "pret" ? ", prêt pour l'examen" : eleve.aRelancer ? ", à relancer" : ""}">
      <div class="me-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: eleve.avatar_url, prenom: eleve.prenom, nom: eleve.nom }, 44)}</div>

      <div class="me-info">
        <div class="me-nom">
          ${fullNom || "—"}
        </div>
        ${badges ? `<div class="me-meta">${badges}</div>` : ""}
      </div>

      <div class="me-prog" title="${eleve.acquis} compétence${eleve.acquis > 1 ? "s" : ""} acquise${eleve.acquis > 1 ? "s" : ""} sur ${eleve.total}">
        <div class="me-prog-bar">
          <div class="me-prog-fill ${progState}" style="width:${pct}%"></div>
        </div>
        <div class="me-prog-txt ${progState}">${eleve.acquis}/${eleve.total}</div>
      </div>

      <button class="me-more" data-more type="button"
              aria-label="Actions rapides pour ${fullNom}">${icon("more-vertical", { size: 18, strokeWidth: 2 })}</button>
    </div>
  `;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire() {
  _root
    .querySelector("#me-invite-btn")
    ?.addEventListener("click", () => openInviteEleveModal(_me));

  _root.querySelector("#me-rank-btn")?.addEventListener("click", () => {
    track("mes_eleves.classement.click");
    navigate("#/classement-eleves");
  });

  // Bouton CTA dans l'état vide (0 élève)
  _root.querySelector("#me-invite-empty-btn")?.addEventListener("click", () => {
    track("invite.empty.header.clicked");
    openInviteEleveModal(_me);
  });

  _root.querySelector("#me-fab")?.addEventListener("click", () => {
    track("fab.seance.clicked", { from: "mes_eleves" });
    navigate("#/log-session");
  });

  // Section relancer → filtre tab arelancer
  _root.querySelector("#me-relancer-section")?.addEventListener("click", () => {
    _tab = "arelancer";
    _root.querySelectorAll(".me-tab").forEach((b) => {
      const on = b.dataset.tab === "arelancer";
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderList();
    track("mes_eleves.relancer_section.click");
  });

  // Search
  const searchEl = _root.querySelector(".me-search");
  const clearBtn = _root.querySelector("#me-search-clear");
  searchEl?.addEventListener("input", (e) => {
    _query = e.target.value;
    clearBtn?.classList.toggle("visible", _query.length > 0);
    renderList();
  });
  clearBtn?.addEventListener("click", () => {
    _query = "";
    if (searchEl) searchEl.value = "";
    clearBtn.classList.remove("visible");
    searchEl?.focus();
    renderList();
  });

  // Tabs
  _root.querySelectorAll(".me-tab").forEach((btn) =>
    btn.addEventListener("click", () => {
      _tab = btn.dataset.tab;
      _root.querySelectorAll(".me-tab").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", String(on));
      });
      track("mes_eleves.tab.click", { tab: _tab });
      renderList();
    }),
  );

  // Cards
  wireRows();
}

async function wireRows() {
  const { attachSwipe, attachLongPress } = await import("@/utils/gestures.js");
  const { haptic } = await import("@/utils/haptic.js");

  _root.querySelectorAll(".me-row[data-eleve-id]").forEach((row) => {
    const id = row.dataset.eleveId;

    // ── Click standard → livret ──
    const handler = () => {
      haptic("tap");
      track("eleve.fiche.open", { eleve_id: id });
      navigate(`#/livret/${id}`);
    };
    row.addEventListener("click", handler);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handler();
    });

    // ── Swipe right = validation rapide ──
    row.style.transition =
      "transform .25s cubic-bezier(.2,.7,.3,1), background .15s";
    attachSwipe(row, {
      threshold: 80,
      follow: (dx) => {
        const clamped = Math.max(0, Math.min(100, dx));
        row.style.transform = `translateX(${clamped}px)`;
        row.style.background =
          dx > 30 ? "color-mix(in srgb, var(--a) 6%, transparent)" : "";
      },
      onSwipeRight: () => {
        haptic("select");
        track("eleve.swipe_validate", { eleve_id: id });
        navigate(`#/log-session?eleveId=${id}`);
      },
      onEnd: () => {
        row.style.transform = "";
        row.style.background = "";
      },
    });

    // ── Bouton « ⋯ » visible → menu rapide (n'ouvre PAS le livret) ──
    const moreBtn = row.querySelector("[data-more]");
    moreBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic("tap");
      track("eleve.more_menu", { eleve_id: id });
      openQuickMenu(id, row);
    });

    // ── Long press → menu rapide (raccourci, en plus du bouton) ──
    attachLongPress(row, {
      holdMs: 480,
      onLongPress: () => {
        track("eleve.longpress_menu", { eleve_id: id });
        openQuickMenu(id, row);
      },
    });
  });
}

/**
 * Mini menu contextuel apparaît sous la ligne au long-press
 */
function openQuickMenu(eleveId, anchorRow) {
  // Retire menu existant
  document.querySelector(".me-qm")?.remove();

  const eleve = _eleves.find((e) => e.id === eleveId) || null;
  const nMissing = eleve ? eleve.total - eleve.acquis : 0;
  // Toujours proposer « ce qu'il manque » tant qu'il reste des compétences —
  // y compris pour un élève « prêt » : c'est PILE lui qui réclame une date.
  const showManque = eleve && eleve.readiness !== "recu" && nMissing > 0;

  const rect = anchorRow.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className = "me-qm";
  menu.innerHTML = `
    <style>
      .me-qm-bg {
        position: fixed; inset: 0; z-index: 400;
        background: rgba(10,13,26,.18);
        backdrop-filter: blur(2px);
        animation: meqmIn .15s ease;
      }
      @keyframes meqmIn { from { opacity: 0; } to { opacity: 1; } }
      .me-qm-panel {
        position: fixed; z-index: 401;
        background: var(--su);
        border: 1px solid var(--bo);
        border-radius: var(--r-lg);
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.2);
        padding: 6px;
        min-width: 220px;
        font-family: 'Inter', sans-serif;
        animation: meqmPanel .2s var(--ease-spring);
      }
      @keyframes meqmPanel { from { opacity: 0; transform: translateY(-4px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @media (prefers-reduced-motion: reduce) { .me-qm-bg, .me-qm-panel { animation: none; } }
      .me-qm-item {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        border-radius: var(--r);
        cursor: pointer;
        font: 500 14px/1.2 'Inter', sans-serif;
        color: var(--ink);
        background: transparent;
        border: 0;
        width: 100%;
        text-align: left;
      }
      .me-qm-item:hover { background: var(--bg); }
      .me-qm-item:active { background: var(--bg2); }
      .me-qm-ico { font-size: 16px; line-height: 1; display: inline-flex; }
      .me-qm-item.danger { color: var(--rd-txt); }
      .me-qm-item.ok { color: var(--grd); }
      .me-qm-sep { height: 1px; background: var(--bo); margin: 6px 8px; }
      .me-qm-label {
        font: 700 10px/1 'Inter', sans-serif;
        letter-spacing: .05em;
        text-transform: uppercase;
        color: var(--mu2);
        padding: 8px 14px 4px;
      }
    </style>
    <div class="me-qm-bg" data-close="1"></div>
    <div class="me-qm-panel">
      ${
        showManque
          ? `<button class="me-qm-item" data-action="manque">
               <span class="me-qm-ico">${icon("clipboard", { size: 14, strokeWidth: 2.5 })}</span> Compétences restantes (${nMissing})
             </button>`
          : ""
      }
      <button class="me-qm-item" data-action="valider">
        <span class="me-qm-ico">${icon("check", { size: 14, strokeWidth: 2.5 })}</span> Enregistrer une séance
      </button>
      <button class="me-qm-item" data-action="livret">
        <span class="me-qm-ico">${icon("arrow-right", { size: 14, strokeWidth: 2.5 })}</span> Ouvrir le livret de compétences
      </button>
      <div class="me-qm-sep"></div>
      <div class="me-qm-label">Examen</div>
      <button class="me-qm-item" data-action="exam-planifie">
        <span class="me-qm-ico">${icon("calendar", { size: 14, strokeWidth: 2.5 })}</span> Examen planifié
      </button>
      <button class="me-qm-item ok" data-action="exam-recu">
        <span class="me-qm-ico">${icon("award", { size: 14, strokeWidth: 2.5 })}</span> Permis obtenu
      </button>
      <button class="me-qm-item danger" data-action="exam-rate">
        <span class="me-qm-ico">${icon("x", { size: 14, strokeWidth: 2.5 })}</span> Examen raté
      </button>
      <div class="me-qm-sep"></div>
      <div class="me-qm-label">Compte</div>
      <button class="me-qm-item" data-action="reset-access">
        <span class="me-qm-ico">${icon("refresh-cw", { size: 14, strokeWidth: 2.5 })}</span> Réinitialiser l'accès
      </button>
    </div>
  `;
  document.body.appendChild(menu);

  // Position du panel sous la row (clamp pour rester dans le viewport)
  const panel = menu.querySelector(".me-qm-panel");
  panel.style.maxHeight = "min(70vh, 440px)";
  panel.style.overflowY = "auto";
  const top = Math.min(rect.bottom + 8, window.innerHeight - 360);
  const left = Math.min(rect.left + 16, window.innerWidth - 240);
  panel.style.top = `${Math.max(8, top)}px`;
  panel.style.left = `${left}px`;

  const close = () => menu.remove();

  menu.querySelector("[data-close]").addEventListener("click", close);
  menu.querySelectorAll(".me-qm-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      close();
      if (action === "valider") navigate(`#/log-session?eleveId=${eleveId}`);
      else if (action === "livret") navigate(`#/livret/${eleveId}`);
      else if (action === "manque" && eleve) openMissingPanel(eleve);
      else if (action === "exam-planifie") openPlanifieDialog(eleveId);
      else if (action === "exam-recu") confirmRecu(eleveId);
      else if (action === "exam-rate") recordExam(eleveId, "rate", todayIso());
      else if (action === "reset-access") confirmResetAccess(eleveId);
    });
  });
}

// Réinitialiser l'accès d'un élève : le moniteur déclenche l'envoi d'un email de
// récupération À L'ÉLÈVE (il ne voit jamais le lien). Edge function `eleve-recovery`
// (service role) vérifie que l'élève est bien de son école.
function confirmResetAccess(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "cet élève");
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Réinitialiser l'accès">
      <div class="me-cf-title">Réinitialiser l'accès de ${prenom} ?</div>
      <div class="me-cf-body">Un email de connexion sera envoyé directement à ${prenom}. Tu ne vois jamais le lien — c'est lui qui reprend la main sur son compte.</div>
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn confirm" id="me-reset-ok" type="button">Envoyer l'email</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  wrap
    .querySelectorAll("[data-close]")
    .forEach((b) => b.addEventListener("click", () => wrap.remove()));

  wrap.querySelector("#me-reset-ok").addEventListener("click", async () => {
    const btn = wrap.querySelector("#me-reset-ok");
    btn.disabled = true;
    btn.textContent = "Envoi…";
    track("eleve.reset_access", { eleve_id: eleveId });
    const ok = await triggerEleveRecovery(eleveId);
    wrap.remove();
    toast(
      ok
        ? `Email de connexion envoyé à ${prenom}.`
        : "Envoi impossible pour le moment.",
      ok ? "success" : "error",
    );
  });
}

// ─── Enregistrement d'un résultat d'examen ───────────────────────
// dateExamen : ISO court. Planifié = date choisie ; reçu/raté = aujourd'hui.
async function recordExam(eleveId, statut, dateExamen) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prevStatut = el ? el.examStatut : null;
  const prevDate = el ? el.examDate : null;

  const { data, error } = await sb
    .from("examens")
    .insert({
      eleve_id: eleveId,
      statut,
      date_examen: dateExamen || todayIso(),
      created_by: _me.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[mes-eleves] examen insert error", error);
    toast("Impossible d'enregistrer l'examen", "error");
    return;
  }
  const newId = data ? data.id : null;

  // MAJ locale → recalcul readiness sans refetch
  if (el) {
    el.examStatut = statut;
    el.examDate = dateExamen || todayIso();
    el.readiness = computeReadiness(el.acquisSet, statut);
  }
  track("examen.record", { eleve_id: eleveId, statut });

  // Re-render complet : badges + compteurs d'onglets
  render();
  wire();

  // Snackbar avec undo (supprime la ligne créée, restaure l'état précédent)
  const msg = {
    planifie: "Examen planifié",
    recu: "Permis obtenu — archivé dans « Reçus »",
    rate: "Résultat d'examen enregistré",
  };
  showUndoSnackbar(msg[statut] || "Enregistré", async () => {
    if (newId) {
      const { error: delErr } = await sb
        .from("examens")
        .delete()
        .eq("id", newId);
      if (delErr) {
        console.error("[mes-eleves] examen undo error", delErr);
        toast("Annulation impossible", "error");
        return;
      }
    }
    if (el) {
      el.examStatut = prevStatut;
      el.examDate = prevDate;
      el.readiness = computeReadiness(el.acquisSet, prevStatut);
    }
    track("examen.undo", { eleve_id: eleveId, statut });
    render();
    wire();
  });
}

// ─── Styles partagés des dialogs (confirm + date) ────────────────
const DIALOG_STYLE = `
  <style>
    .me-cf-bg {
      position: fixed; inset: 0; z-index: 600;
      background: rgba(10,13,26,.4);
      backdrop-filter: blur(3px);
      animation: meqmIn .15s ease;
    }
    .me-cf-card {
      position: fixed; z-index: 601;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: calc(100% - 40px); max-width: 360px;
      background: var(--su);
      border: 1px solid var(--bo);
      border-radius: var(--rl);
      box-shadow: 0 16px 40px -8px rgba(10,13,26,.28);
      padding: 22px 20px 18px;
      font-family: 'Inter', sans-serif;
      animation: meqmPanel .2s var(--ease-spring);
    }
    @media (prefers-reduced-motion: reduce) { .me-cf-bg, .me-cf-card { animation: none; } }
    .me-cf-title { font: 700 17px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin: 0 0 6px; }
    .me-cf-body { font: 500 13.5px/1.5 'Inter', sans-serif; color: var(--mu2); margin: 0 0 18px; }
    .me-cf-date {
      width: 100%; box-sizing: border-box; margin: 0 0 18px;
      padding: 12px 14px; border: 1px solid var(--bo); border-radius: var(--r);
      background: var(--bg); color: var(--ink);
      font: 500 15px/1 'Inter', sans-serif; outline: none;
    }
    .me-cf-date:focus { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
    .me-cf-actions { display: flex; gap: 8px; }
    .me-cf-btn {
      flex: 1; min-height: 46px; border-radius: var(--r); cursor: pointer;
      font: 700 14px/1 'Plus Jakarta Sans', sans-serif; border: 1px solid var(--bo);
      background: var(--bg); color: var(--ink); -webkit-tap-highlight-color: transparent;
    }
    .me-cf-btn:active { transform: scale(.98); }
    .me-cf-btn.confirm { border: 0; color: var(--a-ink); background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%); box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset; }
  </style>`;

/** Confirmation avant d'archiver un élève en « reçu ». */
function confirmRecu(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "cet élève");
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `
    ${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Confirmer la réussite">
      <div class="me-cf-title">${prenom} a obtenu le permis ?</div>
      <div class="me-cf-body">Il quittera ta liste active et sera archivé dans l'onglet « Reçus ». Tu pourras annuler juste après.</div>
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn confirm" id="me-cf-ok" type="button">Permis obtenu</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  wrap
    .querySelectorAll("[data-close]")
    .forEach((x) => x.addEventListener("click", close));
  wrap.querySelector("#me-cf-ok").addEventListener("click", () => {
    close();
    recordExam(eleveId, "recu", todayIso());
  });
}

/** Saisie de la date d'un examen planifié. */
function openPlanifieDialog(eleveId) {
  const el = _eleves.find((e) => e.id === eleveId);
  const prenom = esc(el && el.prenom ? fmtName(el.prenom) : "l'élève");
  const today = todayIso();
  document.querySelector(".me-confirm")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "me-confirm";
  wrap.innerHTML = `
    ${DIALOG_STYLE}
    <div class="me-cf-bg" data-close="1"></div>
    <div class="me-cf-card" role="dialog" aria-modal="true" aria-label="Date de l'examen">
      <div class="me-cf-title">Examen de ${prenom}</div>
      <div class="me-cf-body">Quelle est la date prévue de l'examen ?</div>
      <input class="me-cf-date" id="me-cf-date" type="date" value="${today}" min="${today}" aria-label="Date de l'examen" />
      <div class="me-cf-actions">
        <button class="me-cf-btn" data-close="1" type="button">Annuler</button>
        <button class="me-cf-btn confirm" id="me-cf-ok" type="button">Planifier</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const input = wrap.querySelector("#me-cf-date");
  const close = () => wrap.remove();
  wrap
    .querySelectorAll("[data-close]")
    .forEach((x) => x.addEventListener("click", close));
  wrap.querySelector("#me-cf-ok").addEventListener("click", () => {
    const date = (input && input.value) || today;
    close();
    recordExam(eleveId, "planifie", date);
  });
}

/** Snackbar bas d'écran avec action « Annuler » (auto-dismiss 6 s). */
function showUndoSnackbar(msg, onUndo, duration = 6000) {
  document.querySelector(".me-undo")?.remove();

  const bar = document.createElement("div");
  bar.className = "me-undo";
  bar.setAttribute("role", "status");
  bar.innerHTML = `
    <style>
      .me-undo {
        position: fixed; z-index: 550;
        left: 50%; transform: translate(-50%, 16px);
        bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 80px);
        display: flex; align-items: center; gap: 14px;
        max-width: min(90vw, 380px);
        padding: 12px 12px 12px 16px;
        background: var(--ink); color: var(--bg);
        border-radius: var(--r-md);
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.4);
        font: 500 13.5px/1.3 'Inter', sans-serif;
        opacity: 0;
        transition: opacity .22s ease, transform .22s var(--ease-spring);
      }
      .me-undo.on { opacity: 1; transform: translate(-50%, 0); }
      .me-undo-msg { flex: 1; min-width: 0; }
      .me-undo-btn {
        flex-shrink: 0; border: 0; cursor: pointer;
        padding: 8px 14px; min-height: 36px; border-radius: var(--r);
        background: rgba(255,255,255,.16); color: #fff;
        font: 700 13px/1 'Plus Jakarta Sans', sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
      .me-undo-btn:active { background: rgba(255,255,255,.28); }
      @media (prefers-reduced-motion: reduce) { .me-undo { transition: none; } }
    </style>
    <span class="me-undo-msg">${esc(msg)}</span>
    <button class="me-undo-btn" type="button">Annuler</button>
  `;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add("on"));

  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    bar.classList.remove("on");
    setTimeout(() => bar.remove(), 250);
  };
  const timer = setTimeout(remove, duration);
  bar.querySelector(".me-undo-btn").addEventListener("click", () => {
    clearTimeout(timer);
    remove();
    onUndo();
  });
}

// ─── Panneau « ce qu'il manque » (écran à montrer à l'élève) ─────
function openMissingPanel(eleve) {
  document.querySelector(".me-miss")?.remove();

  const missing = missingComps(eleve.acquisSet);
  const nom = esc(
    fmtName([eleve.prenom, eleve.nom].filter(Boolean).join(" ")) || "—",
  );
  const baseRestantes = baseManquantes(eleve.acquisSet).length;

  const wrap = document.createElement("div");
  wrap.className = "me-miss";
  wrap.innerHTML = `
    <style>
      .me-miss-bg {
        position: fixed; inset: 0; z-index: 500;
        background: rgba(10,13,26,.4);
        backdrop-filter: blur(3px);
        animation: meqmIn .15s ease;
      }
      .me-miss-card {
        position: fixed; z-index: 501;
        left: 50%; bottom: 0;
        transform: translateX(-50%);
        width: 100%; max-width: 480px;
        max-height: 82vh;
        display: flex; flex-direction: column;
        background: var(--su);
        border: 1px solid var(--bo);
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -8px 32px -8px rgba(10,13,26,.25);
        padding: 20px 18px calc(20px + env(safe-area-inset-bottom, 0px));
        font-family: 'Inter', sans-serif;
        animation: meMissUp .24s cubic-bezier(.34,1.4,.64,1);
      }
      @keyframes meMissUp { from { transform: translate(-50%, 100%); } to { transform: translate(-50%, 0); } }
      @media (prefers-reduced-motion: reduce) { .me-miss-bg, .me-miss-card { animation: none; } }
      .me-miss-title { font: 700 18px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin: 0 0 4px; }
      .me-miss-sub { font: 500 13px/1.4 'Inter', sans-serif; color: var(--mu2); margin: 0 0 16px; }
      .me-miss-list { overflow-y: auto; flex: 1; margin: 0 -4px; padding: 0 4px; }
      .me-miss-cat { font: 700 11px/1 'Inter', sans-serif; letter-spacing: .04em; text-transform: uppercase; color: var(--a-txt); margin: 14px 0 8px; }
      .me-miss-cat:first-child { margin-top: 0; }
      .me-miss-item { display: flex; align-items: baseline; gap: 8px; padding: 7px 0; font: 500 14px/1.3 'Inter', sans-serif; color: var(--ink); border-bottom: 1px solid var(--bg2); }
      .me-miss-code { font: 700 11px/1 'IBM Plex Mono', monospace; color: var(--mu); background: var(--bg2); padding: 3px 6px; border-radius: 6px; flex-shrink: 0; }
      .me-miss-empty { text-align: center; padding: 32px 16px; color: var(--grd); font: 600 14px/1.5 'Inter', sans-serif; }
      .me-miss-cta { margin-top: 16px; width: 100%; min-height: 48px; border: 0; border-radius: var(--r); color: var(--a-ink); font: 700 14px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; background: linear-gradient(to bottom, var(--a-lt) 0%, var(--a) 48%, var(--adk) 100%); box-shadow: 0 2px 10px 0 color-mix(in srgb, var(--adk) 35%, transparent), 0 1.5px 0 0 rgba(255,255,255,.28) inset, 0 -2px 8px 0 color-mix(in srgb, var(--adk) 50%, transparent) inset; }
      .me-miss-cta:active { transform: scale(.98); }
    </style>
    <div class="me-miss-bg" data-close="1"></div>
    <div class="me-miss-card" role="dialog" aria-modal="true" aria-label="Compétences manquantes de ${nom}">
      <div class="me-miss-title">Il manque à ${nom}</div>
      <div class="me-miss-sub">${eleve.acquis}/${eleve.total} compétences acquises · ${baseRestantes > 0 ? `encore ${baseRestantes} compétence${baseRestantes > 1 ? "s" : ""} essentielles avant l'examen` : "toutes les compétences essentielles acquises — prêt pour l'examen"}</div>
      <div class="me-miss-list">
        ${
          missing.length === 0
            ? `<div class="me-miss-empty">${icon("check-circle", { size: 28, strokeWidth: 2 })}<br>Toutes les compétences sont acquises.</div>`
            : REMC.map((cat) => {
                const subs = cat.subs.filter((s) => !eleve.acquisSet.has(s.c));
                if (!subs.length) return "";
                return (
                  `<div class="me-miss-cat">${esc(cat.name)}</div>` +
                  subs
                    .map(
                      (s) =>
                        `<div class="me-miss-item"><span class="me-miss-code">${esc(s.c)}</span> ${esc(s.n)}</div>`,
                    )
                    .join("")
                );
              }).join("")
        }
      </div>
      <button class="me-miss-cta" data-livret="1">Ouvrir le livret de compétences</button>
    </div>
  `;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  wrap.querySelector("[data-close]").addEventListener("click", close);
  wrap.querySelector("[data-livret]").addEventListener("click", () => {
    close();
    navigate(`#/livret/${eleve.id}`);
  });
}

// ─── Partial re-render liste uniquement (sans recréer toute la page) ──
function renderList() {
  const listEl = _root?.querySelector(".me-list");
  if (!listEl) return;

  const filtered = filterList();
  const recusCount = _eleves.filter((e) => e.readiness === "recu").length;
  const roster = _eleves.filter((e) => e.readiness !== "recu");
  const total = roster.length;
  const actifs = roster.filter((e) => e.actif && !e.aRelancer).length;
  const prets = roster.filter((e) => e.readiness === "pret").length;
  const arelancer = roster.filter((e) => e.aRelancer).length;

  // Mettre à jour les tabs count (les boutons eux-mêmes)
  _root.querySelectorAll(".me-tab").forEach((btn) => {
    const tab = btn.dataset.tab;
    if (tab === "tous") btn.textContent = `Tous (${total})`;
    if (tab === "actifs") btn.textContent = `En cours (${actifs})`;
    if (tab === "prets") btn.textContent = `Prêts (${prets})`;
    if (tab === "arelancer") btn.textContent = `À relancer (${arelancer})`;
    if (tab === "recus") btn.textContent = `Diplômés (${recusCount})`;
  });

  if (filtered.length === 0) {
    listEl.innerHTML =
      _tab === "tous" && !_query
        ? emptyState({
            image: "/skins/empty-states/empty_eleves.png",
            title: "Aucun élève pour l'instant",
            body: "Envoie un lien par SMS ou WhatsApp — ton élève crée son compte en 30 secondes et tu suis sa progression en temps réel.",
            cta: `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px">
              <button id="me-invite-empty-btn" style="display:inline-flex;align-items:center;gap:7px;padding:12px 22px;background:var(--a);color:var(--a-ink);border:0;border-radius:12px;font:600 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;min-height:44px;transition:transform .12s,background .12s">
                ${icon("user-plus", { size: 15, strokeWidth: 2.2 })} Inviter mon premier élève
              </button>
            </div>`,
          })
        : `<div class="me-empty">
           <span class="me-empty-ico">${icon("users", { size: 30 })}</span>
           ${_query ? 'Aucun résultat pour <strong>"' + esc(_query) + '"</strong>.' : "Aucun élève dans cet onglet."}
         </div>`;
    // Wire the invite button if it was just rendered
    listEl
      .querySelector("#me-invite-empty-btn")
      ?.addEventListener("click", () => {
        track("invite.empty.list.clicked");
        openInviteEleveModal(_me);
      });
    return;
  }

  listEl.innerHTML = filtered.map(renderRow).join("");
  wireRows();
}
