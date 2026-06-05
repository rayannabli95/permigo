// ═══════════════════════════════════════════════════════════════
// Enseignant — Mes élèves
// Liste filtrée + progression REMC par élève
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { REMC_TOTAL } from "@/data/remc.js";
import {
  renderEmptyState,
  emptyState,
} from "@/components/common/empty-state.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { icon } from "@/utils/icons.js";
import { openInviteEleveModal } from "@/services/invite-eleve.js";

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
    border: 1px solid rgba(99,102,241,.15);
    border-radius: 12px;
    font: 500 14px/1 'Inter', sans-serif;
    color: var(--ink);
    outline: none;
    transition: border-color .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
    box-sizing: border-box;
  }
  .me-search::placeholder { color: var(--mu2); }
  .me-search:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
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
    border-radius: 12px;
  }
  .me-tab {
    flex: 1;
    padding: 8px 4px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font: 600 13px/1 'Inter', sans-serif;
    color: var(--mu2);
    cursor: pointer;
    transition: background .15s cubic-bezier(.4,0,.2,1), color .15s cubic-bezier(.4,0,.2,1);
    min-height: 36px;
  }
  .me-tab.active {
    background: var(--su);
    color: #6366f1;
    box-shadow: 0 1px 3px rgba(10,13,26,.06), 0 2px 6px -2px rgba(10,13,26,.08);
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
    border: 1px solid rgba(99,102,241,.12);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 2px rgba(10,13,26,.03);
    transition: border-color .15s cubic-bezier(.4,0,.2,1), transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
    cursor: pointer;
    min-height: 44px;
  }
  @media (hover: hover) and (pointer: fine) {
    .me-row:hover {
      border-color: rgba(99,102,241,.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px -4px rgba(10,13,26,.1);
    }
  }
  .me-row:active { transform: scale(.985); }
  .me-row:focus { outline: none; }
  .me-row:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; border-radius: 12px; }

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
    font: 600 14px/1.2 'Inter', sans-serif;
    color: var(--ink);
    margin: 0 0 4px;
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
    border-radius: 12px;
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
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 2px;
    transition: width .6s cubic-bezier(.4,0,.2,1);
  }
  .me-prog-txt {
    font: 700 11px/1 'IBM Plex Mono', monospace;
    color: var(--mu2);
    text-align: right;
  }

  /* Chevron */
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
    border-radius: 20px;
    animation: skel-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* Bouton Inviter */
  .me-invite-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; min-height: 44px; border-radius: 10px;
    background: rgba(88,204,2,.1); border: 1px solid rgba(88,204,2,.2);
    color: var(--a); font: 600 13px/1 'Inter', sans-serif;
    cursor: pointer; flex-shrink: 0;
    transition: background .12s, border-color .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .me-invite-btn:hover { background: rgba(88,204,2,.18); border-color: rgba(88,204,2,.4); }
  .me-invite-btn:active { background: rgba(88,204,2,.22); }

  /* Anti-décrochage */
  .me-relancer-section {
    background: rgba(245,158,11,.06);
    border: 1.5px solid rgba(245,158,11,.25);
    border-radius: 20px;
    padding: 14px 16px;
    margin-bottom: 16px;
    animation: skel-pulse 0s; /* reset */
  }
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
    border-radius: 10px;
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
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none; border-radius: 26px;
    font: 700 14px/1 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 18px -4px rgba(99,102,241,.6), 0 2px 6px rgba(0,0,0,.12);
    transition: transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
    -webkit-tap-highlight-color: transparent;
    animation: meFabIn .5s .3s cubic-bezier(.34,1.56,.64,1) both;
  }
  .me-fab:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px -4px rgba(99,102,241,.65), 0 2px 8px rgba(0,0,0,.14);
  }
  .me-fab:active { transform: scale(.94); box-shadow: 0 2px 8px -2px rgba(99,102,241,.4); }
  .me-fab:focus-visible { outline: 2px solid #6366f1; outline-offset: 3px; }
  @keyframes meFabIn {
    from { opacity: 0; transform: translateY(20px) scale(.9); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) { .me-fab { animation: none; } }
</style>`;

const INACTIF_SEUIL_MS = 14 * 86400000; // 14 jours

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = []; // { id, prenom, nom, acquis, total, actif }
let _query = "";
let _tab = "tous"; // 'tous' | 'actifs' | 'inactifs' | 'arelancer'
let _drillComp = null; // competence_id si mode drill bloque_sur

// ─── Entry point ─────────────────────────────────────────────────
export async function unmount() {
  document.querySelector(".me-qm")?.remove();
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
        <p class="me-sub">Chargement…</p>
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
  const { data: valsRaw } = await sb
    .from("validations")
    .select("eleve_id, statut")
    .eq("statut", "acquis");

  // Map : eleve_id → count acquis (total école)
  const acquisByEleve = {};
  (valsRaw || []).forEach((v) => {
    if (!acquisByEleve[v.eleve_id]) acquisByEleve[v.eleve_id] = 0;
    acquisByEleve[v.eleve_id]++;
  });

  // Set des élèves ayant au moins 1 compétence acquise
  const touchedEleves = new Set(Object.keys(acquisByEleve));

  const now = Date.now();
  _eleves = rawList
    .map((e, i) => {
      const acquis = acquisByEleve[e.id] || 0;
      const actif = touchedEleves.has(e.id) || !!e.last_active_at;
      const lastActive = e.last_active_at
        ? new Date(e.last_active_at).getTime()
        : null;
      const aRelancer =
        actif && (!lastActive || now - lastActive >= INACTIF_SEUIL_MS);
      const joursInactif = lastActive
        ? Math.floor((now - lastActive) / 86400000)
        : null;
      return {
        ...e,
        acquis,
        total: REMC_TOTAL,
        actif,
        idx: i,
        aRelancer,
        joursInactif,
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
          Bloqués sur ${esc(_drillComp)}
        </h1>
        <p class="me-sub">${count} élève${count !== 1 ? "s" : ""} · 30 derniers jours</p>
      </div>
    </header>
    <button class="me-drill-back" id="me-drill-back"
            style="display:flex;align-items:center;gap:6px;margin-bottom:16px;padding:8px 12px;background:#fff;border:1.5px solid var(--bo);border-radius:10px;font:600 13px/1 'Inter',sans-serif;color:var(--a);cursor:pointer;">
      ${icon("arrow-left", { size: 14, strokeWidth: 2.5 })} Voir tous les élèves
    </button>
    <div class="me-list">
      ${
        count === 0
          ? `<div style="text-align:center;padding:40px 20px;color:var(--mu2);font:500 14px/1.6 'Inter',sans-serif;">
             ${icon("check-circle", { size: 32, strokeWidth: 1.5, color: "var(--bo)" })}
             <br><br>Aucun élève bloqué sur cette compétence actuellement.
           </div>`
          : _drillEleves
              .map((e) => {
                const nm = esc(`${e.prenom || ""} ${e.nom || ""}`.trim());
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
  const total = _eleves.length;
  const actifs = _eleves.filter((e) => e.actif).length;
  const inactifs = total - actifs;
  const aRelancerList = _eleves.filter((e) => e.aRelancer);

  const relancerSection =
    aRelancerList.length > 0
      ? `
    <div class="me-relancer-section" id="me-relancer-section">
      <p class="me-relancer-title" style="display:flex;align-items:center;gap:6px;">${icon("alert-circle", { size: 15, strokeWidth: 2.2, color: "var(--amx)" })} ${aRelancerList.length} élève${aRelancerList.length > 1 ? "s" : ""} à relancer cette semaine</p>
      <p class="me-relancer-sub">Sans activité depuis 14 jours ou plus — un point en leçon peut débloquer la progression.</p>
    </div>
  `
      : "";

  _root.innerHTML = `
    ${STYLE}
    <div class="me-page anim-slide-up">
      <header class="me-hd">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <h1 class="me-h1">Mes élèves</h1>
          <button id="me-invite-btn" class="me-invite-btn" type="button"
                  aria-label="Inviter un élève">
            ${icon("user-plus", { size: 14, strokeWidth: 2.2 })} Inviter
          </button>
        </div>
        <p class="me-sub">${total} élève${total > 1 ? "s" : ""} · ${actifs} actif${actifs > 1 ? "s" : ""}</p>
      </header>

      ${relancerSection}

      <div class="me-search-wrap">
        <span class="me-search-ico">${icon("search", { size: 15, strokeWidth: 2, color: "var(--mu2)" })}</span>
        <input
          class="me-search"
          type="search"
          placeholder="Rechercher un élève…"
          value="${esc(_query)}"
          autocomplete="off"
          aria-label="Rechercher un élève"
        />
        <button class="me-search-clear${_query ? " visible" : ""}" id="me-search-clear" type="button" aria-label="Effacer la recherche">✕</button>
      </div>

      <div class="me-tabs" role="tablist">
        <button class="me-tab${_tab === "tous" ? " active" : ""}" data-tab="tous" role="tab">
          Tous (${total})
        </button>
        <button class="me-tab${_tab === "actifs" ? " active" : ""}" data-tab="actifs" role="tab">
          Actifs (${actifs})
        </button>
        <button class="me-tab${_tab === "arelancer" ? " active" : ""}" data-tab="arelancer" role="tab"
                style="display:flex;align-items:center;gap:4px;${aRelancerList.length > 0 && _tab !== "arelancer" ? "color:var(--amx)" : ""}">
          ${aRelancerList.length > 0 ? icon("alert-circle", { size: 13, strokeWidth: 2.2 }) : ""}
          À relancer (${aRelancerList.length})
        </button>
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
                  title: "Invite ton premier élève",
                  body: "Envoie un lien d'inscription par SMS ou WhatsApp. Ton élève crée son compte en 30 secondes.",
                  cta: `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px">
                    <button id="me-invite-empty-btn" style="display:inline-flex;align-items:center;gap:7px;padding:12px 22px;background:var(--a);color:#fff;border:0;border-radius:12px;font:600 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;min-height:44px;transition:transform .12s,background .12s">
                      ${icon("user-plus", { size: 15, strokeWidth: 2.2 })} Inviter ton premier élève
                    </button>
                    <span style="font:500 12px/1.4 'Inter',sans-serif;color:var(--mu2);max-width:260px;text-align:center">Tu travailles en auto-école ? Tes élèves peuvent aussi être affectés par le gérant.</span>
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

  if (_tab === "actifs") list = list.filter((e) => e.actif);
  if (_tab === "inactifs") list = list.filter((e) => !e.actif);
  if (_tab === "arelancer") list = list.filter((e) => e.aRelancer);

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
    [eleve.prenom, eleve.nom].filter(Boolean).join(" ") || "—",
  );

  return `
    <div class="me-row" data-eleve-id="${esc(eleve.id)}" role="button" tabindex="0"
         aria-label="Fiche de ${fullNom} — ${eleve.acquis}/${eleve.total} compétences acquises, ${eleve.actif ? "actif" : "inactif"}">
      <div class="me-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: eleve.avatar_url, prenom: eleve.prenom, nom: eleve.nom }, 44)}</div>

      <div class="me-info">
        <div class="me-nom">
          ${fullNom || "—"}
          ${eleve.isMine ? `<span style="margin-left:6px;display:inline-block;font:700 9px/1 'Inter',sans-serif;padding:3px 6px;border-radius:4px;background:rgba(88,204,2,.12);color:var(--adk);letter-spacing:.04em;text-transform:uppercase;vertical-align:middle">attitré</span>` : ""}
        </div>
        <div class="me-meta">
          <span class="me-badge ${eleve.actif ? "actif" : "inactif"}">
            ${eleve.actif ? "Actif" : "Inactif"}
          </span>
          ${
            eleve.aRelancer
              ? `
            <span class="me-badge-relancer" style="display:inline-flex;align-items:center;gap:3px;">
              ${icon("alert-circle", { size: 11, strokeWidth: 2.2 })} ${eleve.joursInactif ? `${eleve.joursInactif}j` : "À relancer"}
            </span>
          `
              : ""
          }
          <span class="me-meta-count">
            ${eleve.acquis} validation${eleve.acquis > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div class="me-prog">
        <div class="me-prog-bar">
          <div class="me-prog-fill" style="width:${pct}%"></div>
        </div>
        <div class="me-prog-txt">${eleve.acquis}/${eleve.total}</div>
      </div>

      <span class="me-chev" aria-hidden="true">›</span>
    </div>
  `;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire() {
  _root
    .querySelector("#me-invite-btn")
    ?.addEventListener("click", () => openInviteEleveModal(_me));

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
    _root
      .querySelectorAll(".me-tab")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.tab === "arelancer"),
      );
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
      _root
        .querySelectorAll(".me-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
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
        row.style.background = dx > 30 ? "rgba(88,204,2,.06)" : "";
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

    // ── Long press → menu rapide ──
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
        border-radius: 16px;
        box-shadow: 0 12px 32px -8px rgba(10,13,26,.2);
        padding: 6px;
        min-width: 220px;
        font-family: 'Inter', sans-serif;
        animation: meqmPanel .2s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes meqmPanel { from { opacity: 0; transform: translateY(-4px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @media (prefers-reduced-motion: reduce) { .me-qm-bg, .me-qm-panel { animation: none; } }
      .me-qm-item {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        border-radius: 10px;
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
      .me-qm-ico { font-size: 16px; line-height: 1; }
      .me-qm-item.danger { color: var(--rd); }
    </style>
    <div class="me-qm-bg" data-close="1"></div>
    <div class="me-qm-panel">
      <button class="me-qm-item" data-action="valider">
        <span class="me-qm-ico">${icon("check", { size: 14, strokeWidth: 2.5 })}</span> Enregistrer une séance
      </button>
      <button class="me-qm-item" data-action="livret">
        <span class="me-qm-ico">${icon("arrow-right", { size: 14, strokeWidth: 2.5 })}</span> Ouvrir le livret REMC
      </button>
    </div>
  `;
  document.body.appendChild(menu);

  // Position du panel sous la row
  const panel = menu.querySelector(".me-qm-panel");
  const top = Math.min(rect.bottom + 8, window.innerHeight - 220);
  const left = Math.min(rect.left + 16, window.innerWidth - 240);
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;

  const close = () => menu.remove();

  menu.querySelector("[data-close]").addEventListener("click", close);
  menu.querySelectorAll(".me-qm-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      close();
      if (action === "valider") navigate(`#/log-session?eleveId=${eleveId}`);
      else if (action === "livret") navigate(`#/livret/${eleveId}`);
    });
  });
}

// ─── Partial re-render liste uniquement (sans recréer toute la page) ──
function renderList() {
  const listEl = _root?.querySelector(".me-list");
  if (!listEl) return;

  const filtered = filterList();
  const total = _eleves.length;
  const actifs = _eleves.filter((e) => e.actif).length;
  const inactifs = total - actifs;

  // Mettre à jour les tabs count (les boutons eux-mêmes)
  _root.querySelectorAll(".me-tab").forEach((btn) => {
    const tab = btn.dataset.tab;
    if (tab === "tous") btn.textContent = `Tous (${total})`;
    if (tab === "actifs") btn.textContent = `Actifs (${actifs})`;
    if (tab === "inactifs") btn.textContent = `Inactifs (${inactifs})`;
  });

  if (filtered.length === 0) {
    listEl.innerHTML =
      _tab === "tous" && !_query
        ? emptyState({
            image: "/skins/empty-states/empty_eleves.png",
            title: "Invite ton premier élève",
            body: "Envoie un lien d'inscription par SMS ou WhatsApp. Ton élève crée son compte en 30 secondes.",
            cta: `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px">
              <button id="me-invite-empty-btn" style="display:inline-flex;align-items:center;gap:7px;padding:12px 22px;background:var(--a);color:#fff;border:0;border-radius:12px;font:600 14px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;min-height:44px;transition:transform .12s,background .12s">
                ${icon("user-plus", { size: 15, strokeWidth: 2.2 })} Inviter ton premier élève
              </button>
              <span style="font:500 12px/1.4 'Inter',sans-serif;color:var(--mu2);max-width:260px;text-align:center">Tu travailles en auto-école ? Tes élèves peuvent aussi être affectés par le gérant.</span>
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

