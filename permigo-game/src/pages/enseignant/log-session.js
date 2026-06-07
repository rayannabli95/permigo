// ═══════════════════════════════════════════════════════════════
// Enseignant — Valider une séance (REFONTE sans heures)
// Un seul écran : élève → compétences REMC (multi-statut) → note → valider.
// Moniteur = source de vérité. Zéro durée, zéro métrique de classement.
// RPC : validate_session(p_eleve_id, p_session_date, p_note,
//                        p_acquis[], p_en_cours[], p_a_retravailler[])
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { toast } from "@/components/common/toast.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { icon } from "@/utils/icons.js";
import { haptic } from "@/utils/haptic.js";
import { renderUserAvatar } from "@/components/common/avatar.js";
import { REMC, REMC_TOTAL } from "@/data/remc.js";

const MAX_NOTE = 300;

// Cycle de statut au tap : rien → acquis → en cours → à retravailler → rien
const CYCLE = ["acquis", "en_cours", "a_retravailler"];
function nextStatut(cur) {
  if (!cur) return "acquis";
  const i = CYCLE.indexOf(cur);
  return i === CYCLE.length - 1 ? null : CYCLE[i + 1];
}
function statutMeta(s) {
  if (s === "acquis") return { label: "Acquis", ico: "check" };
  if (s === "en_cours") return { label: "En cours", ico: "refresh-cw" };
  if (s === "a_retravailler")
    return { label: "À retravailler", ico: "alert-triangle" };
  return null;
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ─── State ───────────────────────────────────────────────────────
let _root = null;
let _me = null;
let _eleves = [];
let _eleve = null; // id
let _acquisSet = new Set(); // compétences déjà acquises (verrouillées)
let _picked = new Map(); // competence_id → statut choisi cette séance
let _note = "";
let _query = "";
let _submitting = false;

// ─── CSS ─────────────────────────────────────────────────────────
const STYLE = `<style>
  .vs { padding: 16px 16px calc(152px + env(safe-area-inset-bottom,0px)); max-width: 600px; margin: 0 auto; background: var(--bg); color: var(--ink); font-family: 'Inter', sans-serif; }
  .vs-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .vs-back { width: 40px; height: 40px; flex-shrink: 0; border: 1px solid var(--bo); background: var(--su); border-radius: 10px; color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .vs-back:active { transform: scale(.95); }
  .vs-h1 { font: 800 19px/1.2 'Plus Jakarta Sans', sans-serif; margin: 0; letter-spacing: -.02em; }
  .vs-sub { font: 500 12.5px/1.3 'Inter', sans-serif; color: var(--mu2); margin: 2px 0 0; }

  .vs-card { background: var(--su); border: 1px solid var(--bo); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
  .vs-card-ttl { font: 700 12px/1 'Inter', sans-serif; letter-spacing: .04em; text-transform: uppercase; color: var(--mu2); margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }

  /* Sélecteur élève */
  .vs-search-wrap { position: relative; margin-bottom: 10px; }
  .vs-search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--mu2); pointer-events: none; }
  .vs-search { width: 100%; box-sizing: border-box; padding: 10px 12px 10px 36px; background: var(--bg); border: 1px solid var(--bo); border-radius: 10px; font: 500 14px/1 'Inter', sans-serif; color: var(--ink); outline: none; }
  .vs-search:focus { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
  .vs-eleve-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
  .vs-eleve-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--bo); background: var(--bg); cursor: pointer; min-height: 44px; }
  .vs-eleve-row:active { transform: scale(.99); }
  .vs-eleve-row.sel { border-color: var(--a); background: rgba(88,204,2,.06); }
  .vs-eleve-name { font: 600 14px/1.2 'Inter', sans-serif; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vs-eleve-check { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--a); color: #fff; }

  /* Bandeau élève sélectionné */
  .vs-eleve-banner { display: flex; align-items: center; gap: 12px; }
  .vs-eleve-banner .vs-eb-info { flex: 1; min-width: 0; }
  .vs-eb-name { font: 700 15px/1.2 'Plus Jakarta Sans', sans-serif; }
  .vs-eb-prog { font: 600 12px/1 'IBM Plex Mono', monospace; color: var(--mu2); margin-top: 3px; }
  .vs-eb-change { font: 600 12px/1 'Inter', sans-serif; color: var(--a); background: rgba(88,204,2,.1); border: 0; border-radius: 8px; padding: 8px 10px; cursor: pointer; flex-shrink: 0; min-height: 36px; }

  /* Légende */
  .vs-comps { margin-bottom: 4px; }
  .vs-legend { font: 500 12px/1.5 'Inter', sans-serif; color: var(--mu2); margin: 0 2px 18px; }
  .vs-leg { font-weight: 700; }
  .vs-leg.acquis { color: var(--grd); }
  .vs-leg.en_cours { color: #6366f1; }
  .vs-leg.a_retravailler { color: var(--amx); }

  /* Sections par monde */
  .vs-monde { margin-bottom: 20px; }
  .vs-monde-hd { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; }
  .vs-monde-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .vs-monde-nom { font: 700 13.5px/1 'Plus Jakarta Sans', sans-serif; color: var(--ink); flex: 1; min-width: 0; }
  .vs-monde-cnt { font: 700 11px/1 'IBM Plex Mono', monospace; color: var(--mu2); }
  .vs-chips { display: flex; flex-direction: column; gap: 4px; }
  .vs-chip { display: flex; align-items: center; gap: 9px; width: 100%; box-sizing: border-box; padding: 8px 11px; min-height: 42px; border: 1px solid var(--bo); background: var(--su); border-radius: 11px; cursor: pointer; font: 500 13px/1.25 'Inter', sans-serif; color: var(--ink); text-align: left; -webkit-tap-highlight-color: transparent; transition: border-color .12s, background .12s; }
  .vs-chip:active { transform: scale(.99); }
  .vs-chip-ico { width: 15px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; color: var(--bo4); }
  .vs-chip-code { font: 700 10px/1 'IBM Plex Mono', monospace; color: var(--mu); background: var(--bg2); padding: 3px 5px; border-radius: 5px; flex-shrink: 0; }
  .vs-chip-nom { flex: 1; min-width: 0; }
  /* déjà acquis → s'efface (focus sur ce qu'il reste) */
  .vs-chip.locked { cursor: default; border-color: transparent; background: transparent; min-height: 30px; padding: 4px 11px; opacity: .55; }
  .vs-chip.locked .vs-chip-ico { color: var(--grd); }
  .vs-chip.locked .vs-chip-code { background: transparent; color: var(--grd); padding-left: 0; }
  .vs-chip.locked .vs-chip-nom { color: var(--mu2); }
  /* sélection en séance */
  .vs-chip.acquis { border-color: var(--grd); background: rgba(16,185,129,.08); }
  .vs-chip.acquis .vs-chip-ico { color: var(--grd); }
  .vs-chip.en_cours { border-color: #6366f1; background: rgba(99,102,241,.08); }
  .vs-chip.en_cours .vs-chip-ico { color: #6366f1; }
  .vs-chip.a_retravailler { border-color: var(--amx); background: rgba(245,158,11,.08); }
  .vs-chip.a_retravailler .vs-chip-ico { color: var(--amx); }

  /* Note */
  .vs-note { width: 100%; box-sizing: border-box; min-height: 72px; resize: vertical; padding: 12px; background: var(--bg); border: 1px solid var(--bo); border-radius: 12px; font: 500 14px/1.5 'Inter', sans-serif; color: var(--ink); outline: none; }
  .vs-note:focus { border-color: var(--a); box-shadow: 0 0 0 3px var(--ap); }
  .vs-note-count { font: 500 11px/1 'Inter', sans-serif; color: var(--mu2); text-align: right; margin-top: 6px; }

  /* Footer sticky — posé JUSTE AU-DESSUS de la nav du bas (≈60px) */
  .vs-footer { position: fixed; bottom: calc(60px + env(safe-area-inset-bottom,0px)); left: 0; right: 0; z-index: 45; padding: 10px 16px; background: color-mix(in srgb, var(--bg) 90%, transparent); backdrop-filter: blur(12px); border-top: 1px solid var(--bo); }
  /* layout seulement — l'apparence vient de .pg-btn (global) */
  .vs-submit { width: 100%; max-width: 600px; margin: 0 auto; min-height: 52px; font-size: 15px; }

  .vs-empty { padding: 32px 16px; text-align: center; color: var(--mu2); font: 500 14px/1.5 'Inter', sans-serif; }
  .vs-skel { height: 64px; border-radius: 12px; background: var(--su); border: 1px solid var(--bo); animation: vsPulse 1.4s ease-in-out infinite; margin-bottom: 8px; }
  @keyframes vsPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
</style>`;

// ─── Mount ───────────────────────────────────────────────────────
export async function mount(root) {
  _root = root;
  _me = getCurUser();
  if (!_me) return;

  _eleve = null;
  _acquisSet = new Set();
  _picked = new Map();
  _note = "";
  _query = "";
  _submitting = false;

  track("page_view", { page: "valider_seance", user_role: _me.role });

  root.innerHTML = `${STYLE}
    <div class="vs anim-slide-up">
      <div class="vs-hd">
        <button class="vs-back" id="vs-back" aria-label="Retour">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
        <div><h1 class="vs-h1">Valider une séance</h1><p class="vs-sub">Chargement…</p></div>
      </div>
      <div class="vs-skel"></div><div class="vs-skel"></div><div class="vs-skel"></div>
    </div>`;
  root.querySelector("#vs-back").addEventListener("click", goBack);

  // Élèves attitrés du moniteur
  const { data, error } = await sb
    .from("profiles")
    .select("id, prenom, nom, avatar_url")
    .eq("role", "eleve")
    .eq("enseignant_id", _me.id)
    .order("prenom", { ascending: true });

  if (error) {
    toast("Impossible de charger vos élèves", "error");
    _eleves = [];
  } else {
    _eleves = data || [];
  }

  // Pré-sélection via #/log-session?eleveId=...
  const hash = window.location.hash;
  const qi = hash.indexOf("?");
  const preId =
    qi >= 0 ? new URLSearchParams(hash.slice(qi + 1)).get("eleveId") : null;
  if (preId && _eleves.find((e) => e.id === preId)) {
    await selectEleve(preId, false);
  }

  render();
}

function goBack() {
  navigate("#/eleves");
}

// ─── Sélection élève ─────────────────────────────────────────────
async function selectEleve(id, doRender = true) {
  _eleve = id;
  _picked = new Map();
  _acquisSet = new Set();
  try {
    const { data, error } = await sb
      .from("validations")
      .select("competence_id, statut")
      .eq("eleve_id", id)
      .eq("statut", "acquis");
    if (error) throw error;
    _acquisSet = new Set((data || []).map((v) => v.competence_id));
  } catch (e) {
    console.error("[valider-seance] fetch validations", e);
  }
  if (doRender) render();
}

// ─── Render ──────────────────────────────────────────────────────
function eleveById(id) {
  return _eleves.find((e) => e.id === id) || null;
}

function render() {
  const el = eleveById(_eleve);
  _root.innerHTML = `${STYLE}
    <div class="vs anim-slide-up">
      <div class="vs-hd">
        <button class="vs-back" id="vs-back" aria-label="Retour">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
        <div>
          <h1 class="vs-h1">Valider une séance</h1>
          <p class="vs-sub">Tu coches le référentiel REMC — l'élève est notifié.</p>
        </div>
      </div>
      ${el ? renderEleveBanner(el) : renderEleveSelector()}
      ${el ? renderComps() + renderNote() : ""}
    </div>
    ${el ? renderFooter() : ""}`;
  wire();
}

function renderEleveSelector() {
  const list = _query
    ? _eleves.filter((e) =>
        `${e.prenom || ""} ${e.nom || ""}`
          .toLowerCase()
          .includes(_query.toLowerCase()),
      )
    : _eleves;
  return `
    <div class="vs-card">
      <div class="vs-card-ttl">${icon("users", { size: 13, strokeWidth: 2.4 })} Avec qui ?</div>
      ${
        _eleves.length > 6
          ? `<div class="vs-search-wrap">
               <span class="vs-search-ico">${icon("search", { size: 14, strokeWidth: 2.2 })}</span>
               <input class="vs-search" id="vs-search" type="search" placeholder="Chercher un élève…" value="${esc(_query)}" autocomplete="off" aria-label="Chercher un élève">
             </div>`
          : ""
      }
      <div class="vs-eleve-list">
        ${
          list.length === 0
            ? `<div class="vs-empty">${_eleves.length === 0 ? "Aucun élève attitré." : "Aucun résultat."}</div>`
            : list
                .map(
                  (e) => `
          <div class="vs-eleve-row" data-eleve="${esc(e.id)}" role="button" tabindex="0">
            <div style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 38)}</div>
            <div class="vs-eleve-name">${esc(e.prenom || "")} ${esc(e.nom || "")}</div>
          </div>`,
                )
                .join("")
        }
      </div>
    </div>`;
}

function renderEleveBanner(el) {
  const acquis = _acquisSet.size;
  return `
    <div class="vs-card vs-eleve-banner">
      <div style="flex-shrink:0">${renderUserAvatar({ avatar_url: el.avatar_url, prenom: el.prenom, nom: el.nom }, 44)}</div>
      <div class="vs-eb-info">
        <div class="vs-eb-name">${esc(el.prenom || "")} ${esc(el.nom || "")}</div>
        <div class="vs-eb-prog">${acquis}/${REMC_TOTAL} acquises</div>
      </div>
      <button class="vs-eb-change" id="vs-change-eleve" type="button">Changer</button>
    </div>`;
}

const MONDE_COLOR = {
  C1: "var(--a)",
  C2: "#3b82f6",
  C3: "#eab308",
  C4: "#8b5cf6",
};

function renderComps() {
  const sections = REMC.map((cat) => {
    const color = MONDE_COLOR[cat.id] || "var(--mu)";
    const acquisInCat = cat.subs.filter((s) => _acquisSet.has(s.c)).length;
    const pickedInCat = cat.subs.filter((s) => _picked.has(s.c)).length;
    // À valider d'abord, déjà acquises (effacées) en bas
    const ordered = [
      ...cat.subs.filter((s) => !_acquisSet.has(s.c)),
      ...cat.subs.filter((s) => _acquisSet.has(s.c)),
    ];
    const chips = ordered
      .map((s) => {
        const locked = _acquisSet.has(s.c);
        const st = _picked.get(s.c) || null;
        const cls = locked ? "locked" : st ? st : "";
        const meta = locked ? { ico: "check" } : statutMeta(st);
        const ico = meta ? icon(meta.ico, { size: 12, strokeWidth: 2.8 }) : "";
        return `<button class="vs-chip ${cls}" type="button" ${locked ? 'disabled aria-disabled="true"' : `data-comp="${esc(s.c)}"`}
                  title="${esc(s.n)}${locked ? " — déjà acquis" : ""}">
          <span class="vs-chip-ico">${ico}</span><span class="vs-chip-code">${esc(s.c)}</span><span class="vs-chip-nom">${esc(s.n)}</span>
        </button>`;
      })
      .join("");
    return `
      <section class="vs-monde">
        <header class="vs-monde-hd">
          <span class="vs-monde-dot" style="background:${color}"></span>
          <span class="vs-monde-nom">${esc(cat.name)}</span>
          <span class="vs-monde-cnt" data-cat="${esc(cat.id)}">${acquisInCat + pickedInCat}/${cat.subs.length}</span>
        </header>
        <div class="vs-chips">${chips}</div>
      </section>`;
  }).join("");

  return `
    <div class="vs-comps">
      <p class="vs-legend">Appuie sur une compétence — chaque appui change l'état :
        <b class="vs-leg acquis">acquis</b> → <b class="vs-leg en_cours">en cours</b> → <b class="vs-leg a_retravailler">à retravailler</b>.</p>
      ${sections}
    </div>`;
}

function renderNote() {
  return `
    <div class="vs-card">
      <div class="vs-card-ttl">${icon("edit-3", { size: 13, strokeWidth: 2.4 })} Note (optionnel)</div>
      <textarea class="vs-note" id="vs-note" maxlength="${MAX_NOTE}" placeholder="Un mot sur la séance…" aria-label="Note de séance">${esc(_note)}</textarea>
      <div class="vs-note-count" id="vs-note-count">${_note.length}/${MAX_NOTE}</div>
    </div>`;
}

function pickedCounts() {
  let acquis = 0,
    other = 0;
  for (const s of _picked.values()) s === "acquis" ? acquis++ : other++;
  return { acquis, other, total: acquis + other };
}

function renderFooter() {
  const { acquis, total } = pickedCounts();
  const lbl =
    acquis > 0
      ? `Valider · ${acquis} compétence${acquis > 1 ? "s" : ""}`
      : total > 0
        ? `Enregistrer la séance`
        : `Enregistrer la séance`;
  return `<div class="vs-footer">
    <button class="vs-submit pg-btn" id="vs-submit" type="button">${icon("check", { size: 18, strokeWidth: 2.6 })} <span id="vs-submit-lbl">${esc(lbl)}</span></button>
  </div>`;
}

// ─── Wire ────────────────────────────────────────────────────────
function wire() {
  _root.querySelector("#vs-back")?.addEventListener("click", goBack);

  // Sélecteur élève
  _root.querySelector("#vs-search")?.addEventListener("input", (e) => {
    _query = e.target.value;
    render();
    // refocus
    const s = _root.querySelector("#vs-search");
    if (s) {
      s.focus();
      s.setSelectionRange(s.value.length, s.value.length);
    }
  });
  _root.querySelectorAll(".vs-eleve-row[data-eleve]").forEach((row) => {
    const act = () => selectEleve(row.dataset.eleve);
    row.addEventListener("click", act);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        act();
      }
    });
  });

  // Changer d'élève
  _root.querySelector("#vs-change-eleve")?.addEventListener("click", () => {
    _eleve = null;
    _picked = new Map();
    render();
  });

  // Chips compétences (délégation)
  _root.querySelectorAll(".vs-chips").forEach((list) => {
    list.addEventListener("click", (e) => {
      const chip = e.target.closest(".vs-chip[data-comp]");
      if (!chip) return;
      const id = chip.dataset.comp;
      const next = nextStatut(_picked.get(id) || null);
      if (next === null) _picked.delete(id);
      else _picked.set(id, next);
      haptic(next === "acquis" ? "success" : next ? "select" : "tap");
      render();
    });
  });

  // Note
  const ta = _root.querySelector("#vs-note");
  ta?.addEventListener("input", () => {
    _note = ta.value;
    const c = _root.querySelector("#vs-note-count");
    if (c) c.textContent = `${_note.length}/${MAX_NOTE}`;
  });

  // Submit
  _root.querySelector("#vs-submit")?.addEventListener("click", submit);
}

// ─── Submit ──────────────────────────────────────────────────────
async function submit() {
  if (!_eleve || _submitting) return;
  _submitting = true;
  const btn = _root.querySelector("#vs-submit");
  if (btn) {
    btn.disabled = true;
    btn.querySelector("#vs-submit-lbl").textContent = "Enregistrement…";
  }

  const acquis = [],
    enCours = [],
    aRetravailler = [];
  for (const [id, st] of _picked) {
    if (st === "acquis") acquis.push(id);
    else if (st === "en_cours") enCours.push(id);
    else if (st === "a_retravailler") aRetravailler.push(id);
  }

  try {
    const { data, error } = await sb.rpc("validate_session", {
      p_eleve_id: _eleve,
      p_session_date: todayIso(),
      p_note: _note.trim() || null,
      p_acquis: acquis.length ? acquis : null,
      p_en_cours: enCours.length ? enCours : null,
      p_a_retravailler: aRetravailler.length ? aRetravailler : null,
    });
    if (error || data?.error) {
      console.error("[valider-seance] rpc error", error || data?.error);
      toast("Erreur lors de l'enregistrement", "error");
      _submitting = false;
      if (btn) {
        btn.disabled = false;
        btn.querySelector("#vs-submit-lbl").textContent = "Réessayer";
      }
      return;
    }

    track("session.validated", {
      eleve_id: _eleve,
      n_acquis: acquis.length,
      n_en_cours: enCours.length,
      n_a_retravailler: aRetravailler.length,
      has_note: !!_note.trim(),
    });

    haptic("success");
    const nNew = data?.n_acquis_new ?? acquis.length;
    toast(
      nNew > 0
        ? `Séance enregistrée · ${nNew} compétence${nNew > 1 ? "s" : ""} validée${nNew > 1 ? "s" : ""}`
        : "Séance enregistrée",
      "success",
    );
    navigate("#/eleves");
  } catch (e) {
    console.error("[valider-seance] submit crash", e);
    toast("Erreur réseau", "error");
    _submitting = false;
    if (btn) {
      btn.disabled = false;
      btn.querySelector("#vs-submit-lbl").textContent = "Réessayer";
    }
  }
}
