// ═══════════════════════════════════════════════════════════════
// Enseignant — Enregistrer une session — Wizard 3 étapes
// Étape 1 : Élève + durée + date
// Étape 2 : Compétences (accordéons C1–C4)
// Étape 3 : Commentaire + enregistrement
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

// ─── Constantes ───────────────────────────────────────────────
const DURATIONS_PRESET = [
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
];
const DEFAULT_DURATION = 60;
const MAX_COMMENT = 300;
const RPC_ERRORS = {
  P0001:
    "Une erreur pédagogique a bloqué l'enregistrement. Vérifie les compétences sélectionnées.",
  no_session: "Impossible de trouver la session. Rafraîchis et réessaie.",
  cap_daily_exceeded: "Tu as déjà 10h de sessions enregistrées aujourd'hui.",
  cap_weekly_exceeded: "Tu as déjà 50h de sessions enregistrées cette semaine.",
  session_too_old: "Impossible d'enregistrer une session de plus de 48h.",
  invalid_duration: "Durée invalide.",
};
const DRAFT_KEY = () => `draft_session_${todayIso()}`;
const MONDE_LABELS = [
  "",
  "Maîtrise du véhicule",
  "Appréhension de la route",
  "Circulation",
  "En autonomie",
];

// ─── Helpers ──────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function isoToFr(iso) {
  const d = new Date(iso + "T12:00:00");
  if (iso === todayIso())
    return `Aujourd'hui · ${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}`;
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
function fmtDur(min) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60),
    m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

// ─── State module-level (réinitialisé à chaque mount) ─────────
let _me, _eleves, _allComps, _compCache, _templates;
let _eleve = null,
  _duration = DEFAULT_DURATION,
  _date = todayIso();
let _comps = new Map(),
  _comment = "",
  _query = "";
let _customDurOpen = false,
  _customDur = 105;
let _draftTimer = null;
let _step = 1;
let _openMondes = new Set();

// ─── Cycle statuts ────────────────────────────────────────────
const STATUT_CYCLE = ["acquis", "en_cours", "a_retravailler"];
function _nextStatut(cur) {
  if (!cur) return "acquis";
  const i = STATUT_CYCLE.indexOf(cur);
  return i === STATUT_CYCLE.length - 1 ? null : STATUT_CYCLE[i + 1];
}
function _statutMeta(s) {
  if (s === "acquis") return { label: "Acquis", icoName: "check" };
  if (s === "en_cours") return { label: "En cours", icoName: "refresh-cw" };
  if (s === "a_retravailler")
    return { label: "À retravailler", icoName: "alert-triangle" };
  return null;
}

// ─── Mount ────────────────────────────────────────────────────
export async function mount(root) {
  _me = getCurUser();
  if (!_me) return;

  _step = 1;
  _openMondes = new Set();
  _eleve = null;
  _duration = DEFAULT_DURATION;
  _date = todayIso();
  _comps = new Map();
  _comment = "";
  _query = "";
  _customDurOpen = false;
  _customDur = 105;
  _compCache = {};
  _templates = [];

  track("page_view", { page: "log-session", user_role: _me.role });

  root.innerHTML = `<style>${CSS}</style>
  <div class="ls-page anim-slide-up" id="ls-root">
    <div class="ls-header">
      <button class="ls-back" id="ls-back" aria-label="Retour">${icon("arrow-left", { size: 20, strokeWidth: 2.5 })}</button>
      <h1 class="ls-header-title" tabindex="-1">Séance</h1>
      <span class="ls-step-pill" id="ls-step-pill">1/4</span>
    </div>
    <div class="ls-screen" id="ls-screen">
      ${[1, 2, 3].map(() => `<div class="ls-card"><div class="skel" style="height:80px;border-radius:12px"></div></div>`).join("")}
    </div>
    <div class="ls-footer" id="ls-footer"></div>
  </div>`;

  root
    .querySelector("#ls-back")
    .addEventListener("click", () => _handleBack(root));

  const draft = _loadDraft();
  const [elevesRes, compsRes, templatesRes] = await Promise.allSettled([
    sb
      .from("profiles")
      .select("id, prenom, nom, avatar_url, last_active_at")
      .eq("role", "eleve")
      .eq("enseignant_id", _me.id)
      .order("nom", { ascending: true }),
    sb
      .from("competences_remc")
      .select("id, nom, code, monde")
      .order("id", { ascending: true }),
    Promise.resolve(sb.rpc("get_my_message_templates")).catch(() => ({
      data: [],
    })),
  ]);

  _eleves = elevesRes.status === "fulfilled" ? elevesRes.value.data || [] : [];
  _allComps = compsRes.status === "fulfilled" ? compsRes.value.data || [] : [];
  _templates =
    templatesRes.status === "fulfilled" ? templatesRes.value?.data || [] : [];

  if (draft) {
    _eleve = _eleves.find((e) => e.id === draft.eleve_id)
      ? draft.eleve_id
      : null;
    _duration = draft.duration ?? DEFAULT_DURATION;
    _date = draft.date ?? todayIso();
    if (Array.isArray(draft.comps)) {
      _comps = new Map(draft.comps.map((id) => [id, "acquis"]));
    } else if (draft.comps && typeof draft.comps === "object") {
      _comps = new Map(Object.entries(draft.comps));
    } else {
      _comps = new Map();
    }
    _comment = draft.comment ?? "";
  }

  const _hash = window.location.hash;
  const _qIdx = _hash.indexOf("?");
  const _preEleveId =
    _qIdx >= 0
      ? new URLSearchParams(_hash.slice(_qIdx + 1)).get("eleveId")
      : null;
  if (_preEleveId && _eleves.find((e) => e.id === _preEleveId)) {
    _eleve = _preEleveId;
    _comps = new Map();
  }

  if (!_eleve && _eleves.length > 0) _eleve = _eleves[0].id;
  if (_eleve) await _fetchCompData(_eleve);

  _renderStep(root);
}

// ─── Comp data ────────────────────────────────────────────────
async function _fetchCompData(eleveId) {
  if (!eleveId || _compCache[eleveId]) return;
  try {
    const { data } = await sb
      .from("validations")
      .select("competence_id")
      .eq("eleve_id", eleveId)
      .eq("statut", "acquis");
    _compCache[eleveId] = new Set((data || []).map((v) => v.competence_id));
  } catch {
    _compCache[eleveId] = new Set();
  }
}
function _acquis() {
  return _compCache[_eleve] ?? new Set();
}
function _compsSummary() {
  if (_comps.size === 0) return "";
  const c = { acquis: 0, en_cours: 0, a_retravailler: 0 };
  for (const s of _comps.values()) c[s] = (c[s] || 0) + 1;
  const parts = [];
  if (c.acquis) parts.push(`${c.acquis} acquis`);
  if (c.en_cours) parts.push(`${c.en_cours} en cours`);
  if (c.a_retravailler) parts.push(`${c.a_retravailler} à retravailler`);
  return parts.join(" · ");
}
function _renderCompChip(c, acquisSet) {
  const isAlreadyAcquis = acquisSet.has(c.id);
  const localStatut = _comps.get(c.id) || null;
  if (isAlreadyAcquis) {
    return `<button class="ls-comp-chip ls-comp-acquis"
                    data-comp="${esc(c.id)}" disabled aria-disabled="true"
                    type="button" title="${esc(c.nom)} — déjà acquis">
      <span class="ls-comp-check-ico">${icon("check", { size: 10, strokeWidth: 3, color: "var(--grd)" })}</span>
      <span class="ls-comp-code">${esc(c.code || "")}</span>
      <span class="ls-comp-lbl">${esc(c.nom)}</span>
    </button>`;
  }
  const cls = localStatut ? `ls-comp-sel ls-comp-${localStatut}` : "";
  const meta = _statutMeta(localStatut);
  const ico = meta
    ? `<span class="ls-comp-statut-ico">${icon(meta.icoName, { size: 10, strokeWidth: 2.8 })}</span>`
    : "";
  return `<button class="ls-comp-chip ${cls}"
                  data-comp="${esc(c.id)}" data-statut="${esc(localStatut || "")}"
                  aria-label="${esc(c.nom)}${meta ? " — " + meta.label : ""}"
                  type="button" title="${esc(c.nom)}${meta ? " — " + meta.label : ""}">
    ${ico}
    <span class="ls-comp-code">${esc(c.code || "")}</span>
    <span class="ls-comp-lbl">${esc(c.nom)}</span>
  </button>`;
}

// ─── Draft ────────────────────────────────────────────────────
function _saveDraft() {
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY(),
        JSON.stringify({
          eleve_id: _eleve,
          duration: _duration,
          date: _date,
          comps: Object.fromEntries(_comps),
          comment: _comment,
        }),
      );
    } catch {}
  }, 600);
}
function _loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY()) || "null");
  } catch {
    return null;
  }
}
function _clearDraft() {
  clearTimeout(_draftTimer);
  try {
    localStorage.removeItem(DRAFT_KEY());
  } catch {}
}

// ─── Navigation ───────────────────────────────────────────────
function _goNext(root) {
  if (_step === 1 && !_eleve) return;
  _step++;
  _renderStep(root, "fwd");
}
function _handleBack(root) {
  if (_step === 1) {
    navigate("/");
    return;
  }
  _step--;
  _renderStep(root, "bwd");
}

// ─── Render étapes ────────────────────────────────────────────
function _renderStep(root, dir = "fwd") {
  const screen = root.querySelector("#ls-screen");
  const footer = root.querySelector("#ls-footer");
  const pill = root.querySelector("#ls-step-pill");
  if (!screen || !footer) return;

  if (pill) pill.textContent = `${_step}/4`;

  screen.innerHTML =
    _step === 1
      ? _step1Html()
      : _step === 2
        ? _step2Html()
        : _step === 3
          ? _step3Html()
          : _step4Html();

  screen.style.animation = "none";
  screen.offsetWidth; // reflow
  screen.style.animation =
    dir === "bwd"
      ? "ls-bwd .22s cubic-bezier(.22,1,.32,1) both"
      : "ls-fwd .22s cubic-bezier(.22,1,.32,1) both";

  if (_step === 1) {
    footer.innerHTML = "";
  } else if (_step < 4) {
    footer.innerHTML = `<button class="ls-btn-next" id="ls-btn-next" type="button">
      Suivant ${icon("arrow-right", { size: 16, strokeWidth: 2.5 })}
    </button>`;
  } else {
    const acquisCount = [..._comps.values()].filter(
      (s) => s === "acquis",
    ).length;
    const lbl =
      acquisCount > 0
        ? `Enregistrer · ${acquisCount} comp.${acquisCount > 1 ? "s" : ""} validée${acquisCount > 1 ? "s" : ""}`
        : "Enregistrer la session";
    footer.innerHTML = `<button class="ls-submit-btn" id="ls-submit" type="button">
      ${icon("check", { size: 18, strokeWidth: 2.5 })}
      <span id="ls-submit-lbl">${esc(lbl)}</span>
    </button>`;
  }

  _wireStep(root);
}

// ─── Étape 1 : Sélection élève ────────────────────────────────
function _step1Html() {
  const filtered = _query
    ? _eleves.filter((e) =>
        `${e.prenom} ${e.nom}`.toLowerCase().includes(_query.toLowerCase()),
      )
    : _eleves;

  return `
    <div class="ls-card ls-card-eleve">
      <div class="ls-sec-title">${icon("users", { size: 13, strokeWidth: 2.4 })} Avec qui ?</div>
      ${
        _eleves.length > 6
          ? `
      <div class="ls-search-wrap">
        <span class="ls-search-ico">${icon("search", { size: 14, strokeWidth: 2.2, color: "var(--mu2)" })}</span>
        <input class="ls-search" id="ls-search" type="search" placeholder="Chercher un élève…"
               aria-label="Chercher un élève" value="${esc(_query)}"
               autocomplete="off" autocorrect="off" spellcheck="false">
      </div>`
          : ""
      }
      <div class="ls-eleve-list" id="ls-eleve-list">
        ${
          filtered.length === 0
            ? `<div class="ls-empty-hint">Aucun élève trouvé.</div>`
            : filtered
                .map((e) => {
                  const sel = e.id === _eleve;
                  return `<div class="ls-eleve-row${sel ? " ls-sel" : ""}" data-eleve="${esc(e.id)}" role="radio" aria-checked="${sel}">
                <div class="ls-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 38)}</div>
                <div class="ls-eleve-info"><div class="ls-eleve-name">${esc(e.prenom || "")} ${esc(e.nom || "")}</div></div>
                <div class="ls-eleve-check${sel ? " ls-eleve-check-on" : ""}">${sel ? icon("check", { size: 12, strokeWidth: 3, color: "#fff" }) : ""}</div>
              </div>`;
                })
                .join("")
        }
      </div>
    </div>
    <div style="height:8px"></div>`;
}

// ─── Étape 2 : Sélection durée ────────────────────────────────
function _step2Html() {
  return `
    <div class="ls-card" id="ls-dur-card">
      <div class="ls-sec-title">${icon("clock", { size: 13, strokeWidth: 2.4 })} Durée</div>
      <div class="ls-dur-chips" id="ls-dur-chips">
        ${DURATIONS_PRESET.map(
          (d) => `
          <button class="ls-dur-chip${_duration === d.value && !_customDurOpen ? " ls-sel" : ""}"
                  data-dur="${d.value}" type="button">${d.label}</button>
        `,
        ).join("")}
        <button class="ls-dur-chip ls-dur-other${_customDurOpen || !DURATIONS_PRESET.find((d) => d.value === _duration) ? " ls-sel" : ""}"
                id="ls-dur-other" type="button">
          ${_customDurOpen || !DURATIONS_PRESET.find((d) => d.value === _duration) ? fmtDur(_duration) : "Autre"}
        </button>
      </div>
      ${
        _customDurOpen
          ? `
      <div class="ls-dur-sheet" id="ls-dur-sheet">
        <div class="ls-stepper">
          <button class="ls-step-btn" id="ls-step-minus" type="button" aria-label="Réduire">−</button>
          <span class="ls-step-val" id="ls-step-val">${fmtDur(_customDur)}</span>
          <button class="ls-step-btn" id="ls-step-plus" type="button" aria-label="Augmenter">+</button>
        </div>
        <button class="ls-step-apply" id="ls-step-apply" type="button">Valider</button>
      </div>`
          : ""
      }
    </div>
    <div style="height:8px"></div>`;
}

// ─── Étape 3 : Sélection date ─────────────────────────────────
function _step3Html() {
  return `
    <div class="ls-card">
      <div class="ls-sec-title">${icon("calendar", { size: 13, strokeWidth: 2.4 })} Date</div>
      <div class="ls-date-row" id="ls-date-row">
        <span class="ls-date-txt">${isoToFr(_date)}</span>
        <span class="ls-date-badge">Modifier</span>
        <input type="date" id="ls-date-input" class="ls-date-input"
               aria-label="Date de la séance" value="${esc(_date)}" max="${todayIso()}"
               min="${(() => {
                 const d = new Date();
                 d.setDate(d.getDate() - 7);
                 return d.toISOString().slice(0, 10);
               })()}">
      </div>
    </div>
    <div style="height:8px"></div>`;
}

// ─── Étape 4 : Compétences (flat, toutes visibles) ─────────────
function _step4Html() {
  const byMonde = {};
  for (const c of _allComps) {
    if (!byMonde[c.monde]) byMonde[c.monde] = [];
    byMonde[c.monde].push(c);
  }
  const acquis = _acquis();
  const summary = _compsSummary();

  const sections = Object.entries(byMonde)
    .sort(([a], [b]) => +a - +b)
    .map(([monde, comps]) => {
      const m = +monde;
      const active = comps.filter((c) => _comps.has(c.id)).length;
      return `
      <div class="ls-c-section">
        <div class="ls-c-section-hdr">
          <span class="ls-acc-dot c${m}"></span>
          <span class="ls-c-section-name">C${m} — ${esc(MONDE_LABELS[m] || `Monde ${m}`)}</span>
          <span class="ls-acc-badge ls-c-badge" data-monde-badge="${m}"${active === 0 ? ' style="display:none"' : ""}>${active}</span>
        </div>
        <div class="ls-comp-chips ls-comps-list" data-monde="${m}">
          ${comps.map((c) => _renderCompChip(c, acquis)).join("")}
        </div>
      </div>`;
    })
    .join("");

  return `
    <div class="ls-card">
      <div class="ls-sec-header">
        <div class="ls-sec-title">${icon("book-open", { size: 13, strokeWidth: 2.4 })} Compétences travaillées</div>
        <span class="ls-comp-count" id="ls-comp-count" ${_comps.size === 0 ? 'style="display:none"' : ""}>${esc(summary)}</span>
      </div>
      <div class="ls-comp-legend" aria-label="Légende des statuts">
        <span>Appuie pour cycler :</span>
        <span class="ls-leg-pill ls-leg-acquis">${icon("check", { size: 10, strokeWidth: 3 })} Acquis</span>
        <span class="ls-leg-pill ls-leg-en_cours">${icon("refresh-cw", { size: 10, strokeWidth: 2.4 })} En cours</span>
        <span class="ls-leg-pill ls-leg-a_retravailler">${icon("alert-triangle", { size: 10, strokeWidth: 2.4 })} À retravailler</span>
      </div>
      <div id="ls-comps-flat">
        ${_allComps.length === 0 ? `<div class="ls-empty-hint">Aucune compétence disponible.</div>` : sections}
      </div>
    </div>
    <div style="height:8px"></div>`;
}

// ─── Wire par étape ───────────────────────────────────────────
function _wireStep(root) {
  root
    .querySelector("#ls-btn-next")
    ?.addEventListener("click", () => _goNext(root));
  root
    .querySelector("#ls-submit")
    ?.addEventListener("click", () => _handleSubmit(root));

  if (_step === 1) {
    root.querySelector("#ls-search")?.addEventListener("input", (e) => {
      _query = e.target.value;
      _renderEleveList(root);
    });
    _wireEleveList(root);
  } else if (_step === 2) {
    _wireDuration(root);
  } else if (_step === 3) {
    _wireDate(root);
  } else {
    _wireComps(root);
  }
}

// ─── Étape 1 : wiring ─────────────────────────────────────────
function _wireEleveList(root) {
  root.querySelectorAll(".ls-eleve-row").forEach((row) => {
    row.addEventListener("click", async () => {
      const id = row.dataset.eleve;
      _eleve = id;
      _comps = new Map();
      _saveDraft();
      await _fetchCompData(id);
      _goNext(root);
    });
  });
}

function _renderEleveList(root) {
  const filtered = _query
    ? _eleves.filter((e) =>
        `${e.prenom} ${e.nom}`.toLowerCase().includes(_query.toLowerCase()),
      )
    : _eleves;
  const listEl = root.querySelector("#ls-eleve-list");
  if (!listEl) return;
  listEl.innerHTML =
    filtered.length === 0
      ? `<div class="ls-empty-hint">Aucun élève trouvé.</div>`
      : filtered
          .map((e) => {
            const sel = e.id === _eleve;
            return `<div class="ls-eleve-row${sel ? " ls-sel" : ""}" data-eleve="${esc(e.id)}" role="radio" aria-checked="${sel}">
          <div class="ls-av" style="flex-shrink:0">${renderUserAvatar({ avatar_url: e.avatar_url, prenom: e.prenom, nom: e.nom }, 38)}</div>
          <div class="ls-eleve-info"><div class="ls-eleve-name">${esc(e.prenom || "")} ${esc(e.nom || "")}</div></div>
          <div class="ls-eleve-check${sel ? " ls-eleve-check-on" : ""}">${sel ? icon("check", { size: 12, strokeWidth: 3, color: "#fff" }) : ""}</div>
        </div>`;
          })
          .join("");
  _wireEleveList(root);
}

function _wireDuration(root) {
  root.querySelectorAll(".ls-dur-chip[data-dur]").forEach((chip) => {
    chip.addEventListener("click", () => {
      _duration = +chip.dataset.dur;
      _customDurOpen = false;
      root
        .querySelectorAll(".ls-dur-chip")
        .forEach((c) => c.classList.remove("ls-sel"));
      chip.classList.add("ls-sel");
      const other = root.querySelector("#ls-dur-other");
      if (other) {
        other.textContent = "Autre";
        other.classList.remove("ls-sel");
      }
      _removeSheet(root);
      _saveDraft();
    });
  });
  root.querySelector("#ls-dur-other")?.addEventListener("click", () => {
    _customDurOpen = !_customDurOpen;
    if (_customDurOpen)
      _customDur = DURATIONS_PRESET.find((d) => d.value === _duration)
        ? 105
        : _duration;
    _rerenderDuration(root);
    _wireDuration(root);
  });
}

function _rerenderDuration(root) {
  const card = root.querySelector("#ls-dur-card");
  if (!card) return;
  card.innerHTML = `
    <div class="ls-sec-title">${icon("clock", { size: 13, strokeWidth: 2.4 })} Durée</div>
    <div class="ls-dur-chips" id="ls-dur-chips">
      ${DURATIONS_PRESET.map(
        (d) => `
        <button class="ls-dur-chip${_duration === d.value && !_customDurOpen ? " ls-sel" : ""}"
                data-dur="${d.value}" type="button">${d.label}</button>
      `,
      ).join("")}
      <button class="ls-dur-chip ls-dur-other${_customDurOpen || !DURATIONS_PRESET.find((d) => d.value === _duration) ? " ls-sel" : ""}"
              id="ls-dur-other" type="button">
        ${_customDurOpen || !DURATIONS_PRESET.find((d) => d.value === _duration) ? fmtDur(_duration) : "Autre"}
      </button>
    </div>
    ${
      _customDurOpen
        ? `
    <div class="ls-dur-sheet" id="ls-dur-sheet">
      <div class="ls-stepper">
        <button class="ls-step-btn" id="ls-step-minus" type="button" aria-label="Réduire">−</button>
        <span class="ls-step-val" id="ls-step-val">${fmtDur(_customDur)}</span>
        <button class="ls-step-btn" id="ls-step-plus" type="button" aria-label="Augmenter">+</button>
      </div>
      <button class="ls-step-apply" id="ls-step-apply" type="button">Valider</button>
    </div>`
        : ""
    }`;
  root.querySelector("#ls-step-minus")?.addEventListener("click", () => {
    _customDur = Math.max(15, _customDur - 15);
    const v = root.querySelector("#ls-step-val");
    if (v) v.textContent = fmtDur(_customDur);
  });
  root.querySelector("#ls-step-plus")?.addEventListener("click", () => {
    _customDur = Math.min(480, _customDur + 15);
    const v = root.querySelector("#ls-step-val");
    if (v) v.textContent = fmtDur(_customDur);
  });
  root.querySelector("#ls-step-apply")?.addEventListener("click", () => {
    _duration = _customDur;
    _customDurOpen = false;
    _rerenderDuration(root);
    _wireDuration(root);
    _saveDraft();
  });
}

function _removeSheet(root) {
  root.querySelector("#ls-dur-sheet")?.remove();
}

function _wireDate(root) {
  const dateRow = root.querySelector("#ls-date-row");
  const dateInput = root.querySelector("#ls-date-input");
  if (!dateRow || !dateInput) return;
  dateRow.addEventListener("click", () => {
    try {
      if (typeof dateInput.showPicker === "function") {
        dateInput.showPicker();
        return;
      }
    } catch {}
    dateInput.focus();
    dateInput.click();
  });
  dateInput.addEventListener("change", () => {
    if (!dateInput.value) return;
    _date = dateInput.value;
    const txt = dateRow.querySelector(".ls-date-txt");
    if (txt) txt.textContent = isoToFr(_date);
    _saveDraft();
  });
}

// ─── Étape 2 : accordéons + comps ────────────────────────────
function _wireAccordeons(root) {
  root.querySelectorAll(".ls-acc-hdr").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = +btn.dataset.monde;
      if (_openMondes.has(m)) _openMondes.delete(m);
      else _openMondes.add(m);
      _renderStep(root);
    });
  });
}

function _wireComps(root) {
  root.querySelectorAll(".ls-comps-list").forEach((list) => {
    if (list._wired) return;
    list._wired = true;
    list.addEventListener("click", (e) => {
      const chip = e.target.closest(".ls-comp-chip");
      if (!chip || chip.disabled) return;
      const id = chip.dataset.comp;
      if (!id) return;
      const next = _nextStatut(_comps.get(id) || null);
      if (next === null) _comps.delete(id);
      else _comps.set(id, next);

      haptic(
        next === "acquis"
          ? "success"
          : next === "a_retravailler"
            ? "warning"
            : next === "en_cours"
              ? "select"
              : "tap",
      );

      const compObj = _allComps.find((c) => c.id === id);
      if (compObj) {
        const fresh = document.createElement("div");
        fresh.innerHTML = _renderCompChip(compObj, _acquis());
        chip.replaceWith(fresh.firstElementChild);
      }
      _saveDraft();
      _refreshStep2Counters(root);
    });
  });
}

function _refreshStep2Counters(root) {
  const countEl = root.querySelector("#ls-comp-count");
  if (countEl) {
    const summary = _compsSummary();
    countEl.style.display = _comps.size === 0 ? "none" : "";
    countEl.textContent = summary;
  }
  root.querySelectorAll("[data-monde-badge]").forEach((badge) => {
    const m = +badge.dataset.mondeBadge;
    const active = _allComps.filter(
      (c) => +c.monde === m && _comps.has(c.id),
    ).length;
    badge.textContent = active;
    badge.style.display = active > 0 ? "" : "none";
  });

  // also update the submit button label live
  const submitLbl = root.querySelector("#ls-submit-lbl");
  if (submitLbl) {
    const acquisCount = [..._comps.values()].filter(
      (s) => s === "acquis",
    ).length;
    submitLbl.textContent =
      acquisCount > 0
        ? `Enregistrer · ${acquisCount} comp.${acquisCount > 1 ? "s" : ""} validée${acquisCount > 1 ? "s" : ""}`
        : "Enregistrer la session";
  }
}

// ─── Étape 3 : textarea + templates ──────────────────────────
function _wireTextarea(root) {
  const ta = root.querySelector("#ls-textarea");
  ta?.addEventListener("input", () => {
    _comment = ta.value;
    const count = root.querySelector("#ls-char-count");
    if (count) {
      count.textContent = `${_comment.length}/${MAX_COMMENT}`;
      count.classList.toggle("ls-near", _comment.length > MAX_COMMENT * 0.85);
    }
    _saveDraft();
  });
  root.querySelectorAll(".ls-tpl-chip[data-body]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!ta) return;
      ta.value = btn.dataset.body;
      _comment = ta.value;
      ta.dispatchEvent(new Event("input"));
      ta.focus();
      track("log_session.template_used", {});
    });
  });
}

// ─── Submit ────────────────────────────────────────────────────
async function _handleSubmit(root) {
  if (!_eleve) return;
  const btn = root.querySelector("#ls-submit");
  if (btn) {
    btn.disabled = true;
    btn.classList.add("ls-loading");
  }

  navigator.vibrate?.(50);

  try {
    const { data: dup } = await sb.rpc("check_duplicate_session", {
      p_eleve_id: _eleve,
      p_session_date: _date,
    });
    if (dup?.duplicate) {
      const confirmed = await _showDuplicateModal(root, dup);
      if (!confirmed) {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove("ls-loading");
        }
        return;
      }
    }
  } catch {}

  const acquisIds = [..._comps.entries()]
    .filter(([, s]) => s === "acquis")
    .map(([id]) => id);
  const enCoursIds = [..._comps.entries()]
    .filter(([, s]) => s === "en_cours")
    .map(([id]) => id);
  const aRetravaillerIds = [..._comps.entries()]
    .filter(([, s]) => s === "a_retravailler")
    .map(([id]) => id);
  const noteVal = _comment.trim() || null;

  try {
    const { data, error } = await sb.rpc("log_session", {
      p_eleve_id: _eleve,
      p_duration_minutes: _duration,
      p_session_date: _date,
      p_notes: noteVal,
      ...(acquisIds.length > 0 ? { p_competence_ids: acquisIds } : {}),
    });

    if (error || data?.error) {
      const rawCode = error?.code || "";
      const rawMsg = error?.message || data?.error || "";
      console.error(
        "[log-session] RPC error",
        rawCode,
        rawMsg,
        error?.details,
        error?.hint,
      );
      toast(
        RPC_ERRORS[rawMsg] ??
          RPC_ERRORS[rawCode] ??
          rawMsg ??
          "Erreur lors de l'enregistrement",
        "error",
      );
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("ls-loading");
      }
      return;
    }

    const result = data?.[0] ?? data;
    const validations = result?.validations || [];
    const created = validations.filter((v) => v.created).length;

    let extraCreated = 0;
    const extraIds = [
      ...enCoursIds.map((id) => ({ id, statut: "en_cours" })),
      ...aRetravaillerIds.map((id) => ({ id, statut: "a_retravailler" })),
    ];
    if (extraIds.length > 0) {
      try {
        const rows = extraIds.map(({ id, statut }) => ({
          eleve_id: _eleve,
          competence_id: id,
          validated_by: _me.id,
          validated_at: new Date().toISOString(),
          statut,
          note_enseignant: noteVal,
        }));
        const { error: upErr } = await sb.from("validations").upsert(rows, {
          onConflict: "eleve_id,competence_id",
          ignoreDuplicates: false,
        });
        if (!upErr) extraCreated = extraIds.length;
        else console.error("[log-session] upsert extra error", upErr);
      } catch (e) {
        console.error("[log-session] upsert extra crashed", e);
      }
    }

    track("session.logged", {
      duration_minutes: _duration,
      n_acquis: acquisIds.length,
      n_en_cours: enCoursIds.length,
      n_a_retravailler: aRetravaillerIds.length,
      has_comment: !!noteVal,
      user_role: _me.role,
    });

    _clearDraft();

    const eleveObj = _eleves.find((e) => e.id === _eleve);
    const totalChanges = created + extraCreated;
    if (totalChanges > 0) {
      const parts = [];
      if (created > 0)
        parts.push(`${created} validée${created > 1 ? "s" : ""}`);
      if (extraCreated > 0)
        parts.push(`${extraCreated} suivie${extraCreated > 1 ? "s" : ""}`);
      toast(`Séance enregistrée · ${parts.join(" + ")}`, "success");
    } else {
      toast(
        `Séance enregistrée · ${fmtDur(_duration)} avec ${esc(eleveObj?.prenom || "l'élève")}`,
        "success",
      );
    }

    const workedComps = [..._comps.keys()]
      .map((id) => {
        const c = _allComps?.find((x) => x.id === id);
        return c ? { id: c.id, nom: c.nom } : null;
      })
      .filter(Boolean);

    if (workedComps.length > 0) {
      try {
        const { openFlashQuizModal } =
          await import("@/components/enseignant/flash-quiz-modal.js");
        await openFlashQuizModal({
          eleveId: _eleve,
          eleveNom: eleveObj?.prenom,
          competences: workedComps,
        });
      } catch (e) {
        console.error("[log-session] flash quiz modal", e);
      }
      navigate("/");
      return;
    }

    try {
      const { mountCelebrate } =
        await import("@/components/common/celebrate-screen.js");
      mountCelebrate?.({ duration: 500 });
    } catch {}

    setTimeout(() => navigate("/"), 400);
  } catch (e) {
    console.error("[log-session] submit error", e);
    toast("Erreur réseau — réessaie", "error");
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("ls-loading");
    }
  }
}

// ─── Modal doublon ─────────────────────────────────────────────
function _showDuplicateModal(root, dup) {
  const durLabel = fmtDur(dup.duration_minutes ?? 0);
  const statusLabel =
    { pending: "en attente", confirmed: "confirmée", refused: "refusée" }[
      dup.confirmation_status
    ] ??
    dup.confirmation_status ??
    "?";
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "ls-dup-overlay";
    overlay.innerHTML = `
      <div class="ls-dup-sheet">
        <div class="ls-dup-title">Séance déjà enregistrée</div>
        <div class="ls-dup-body">
          Une séance de <strong>${esc(durLabel)}</strong> existe déjà ce jour
          (statut : <strong>${esc(statusLabel)}</strong>). Que veux-tu faire ?
        </div>
        <div class="ls-dup-btns ls-dup-btns-col">
          ${dup.session_id ? `<button class="ls-dup-view" id="ls-dup-view" type="button">Voir la séance existante</button>` : ""}
          <button class="ls-dup-confirm" id="ls-dup-confirm" type="button">Créer quand même</button>
          <button class="ls-dup-cancel"  id="ls-dup-cancel"  type="button">Annuler</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#ls-dup-view")?.addEventListener("click", () => {
      overlay.remove();
      resolve(false);
      navigate(`#/sessions/${esc(dup.session_id)}`);
    });
    overlay.querySelector("#ls-dup-confirm").addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
    overlay.querySelector("#ls-dup-cancel").addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });
  });
}

// ─── CSS ───────────────────────────────────────────────────────
const CSS = `
@keyframes ls-fwd { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:none; } }
@keyframes ls-bwd { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }

.ls-page {
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  position: relative;
}

/* Header */
.ls-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--su);
  border-bottom: 1px solid var(--bo);
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  padding-top: max(14px, env(safe-area-inset-top));
}
.ls-back {
  width: 44px; height: 44px; border-radius: 10px;
  border: 1.5px solid var(--bo); background: var(--su);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--ink); flex-shrink: 0; transition: background .12s;
}
.ls-back:active { background: var(--bg2); }
.ls-header-title {
  flex: 1;
  font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif;
  color: var(--ink); letter-spacing: -.02em;
}
.ls-step-pill {
  font: 700 12px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--a);
  background: rgba(88,204,2,.12);
  padding: 5px 11px; border-radius: 20px;
  flex-shrink: 0;
}

/* Screen area */
.ls-screen {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px;
  padding-bottom: calc(16px + 60px + env(safe-area-inset-bottom, 0px));
  display: flex; flex-direction: column; gap: 12px;
}

/* Card */
.ls-card {
  background: var(--su);
  border: 1.5px solid var(--bo);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(10,13,26,.06);
}

/* Section title */
.ls-sec-title {
  font: 700 11px/1 'Inter', sans-serif;
  text-transform: uppercase; letter-spacing: .09em;
  color: var(--mu2); margin: 0 0 12px;
  display: flex; align-items: center; gap: 6px;
}
.ls-sec-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.ls-sec-header .ls-sec-title { margin: 0; }
.ls-comp-count {
  margin-left: auto;
  font: 700 11px/1 'Inter', sans-serif;
  color: var(--a); background: rgba(88,204,2,.08);
  padding: 3px 9px; border-radius: 10px;
}
.ls-optional {
  font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--mu5);
}

/* Élèves */
.ls-search-wrap { position: relative; margin-bottom: 10px; }
.ls-search-ico { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.ls-search {
  width: 100%; box-sizing: border-box;
  padding: 9px 12px 9px 34px;
  border: 1.5px solid var(--bo); border-radius: 12px;
  font: 500 13px/1 'Inter', sans-serif; color: var(--ink); background: var(--bg);
  outline: none; -webkit-appearance: none; transition: border-color .15s;
}
.ls-search:focus { border-color: var(--a); background: #fff; }
.ls-search::-webkit-search-cancel-button { -webkit-appearance: none; }
.ls-eleve-list { display: flex; flex-direction: column; gap: 6px; }
.ls-eleve-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border: 1.5px solid var(--bo); border-radius: 16px;
  cursor: pointer; background: var(--su); min-height: 52px;
  transition: border-color .12s, background .12s, transform .1s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.ls-eleve-row:active { transform: scale(.99); }
.ls-eleve-row.ls-sel { border-color: var(--a); background: rgba(88,204,2,.04); }
.ls-av {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 700 14px/1 'Plus Jakarta Sans', sans-serif; color: #fff; flex-shrink: 0;
}
.ls-eleve-info { flex: 1; min-width: 0; }
.ls-eleve-name { font: 600 14px/1.2 'Inter', sans-serif; color: var(--ink); }
.ls-eleve-check {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--bo); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s, border-color .12s;
}
.ls-eleve-check-on { background: var(--a); border-color: var(--a); }

/* Durée */
.ls-dur-chips { display: flex; gap: 8px; }
.ls-dur-chip {
  flex: 1; padding: 14px 8px;
  border: 1.5px solid var(--bo); border-radius: 14px;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif;
  color: var(--mu); background: var(--su); cursor: pointer; text-align: center;
  transition: border-color .12s, background .12s, color .12s, transform .1s;
  min-height: 50px;
}
.ls-dur-chip:active { transform: scale(.96); }
.ls-dur-chip.ls-sel { border-color: var(--a); background: rgba(88,204,2,.07); color: var(--a); }
.ls-dur-other { font-size: 13px; font-weight: 600; }
.ls-dur-sheet {
  margin-top: 12px; padding: 14px; background: var(--bg); border-radius: 14px;
  display: flex; align-items: center; gap: 12px;
}
.ls-stepper { display: flex; align-items: center; gap: 12px; flex: 1; }
.ls-step-btn {
  width: 44px; height: 44px; border: 1.5px solid var(--bo); border-radius: 10px;
  background: var(--su); font: 700 20px/1 'Inter', sans-serif; color: var(--ink);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .12s;
}
.ls-step-btn:active { background: var(--bg2); }
.ls-step-val { flex: 1; text-align: center; font: 800 18px/1 'Plus Jakarta Sans', sans-serif; color: var(--a); }
.ls-step-apply {
  padding: 10px 18px; background: var(--a); color: #fff; border: none;
  border-radius: 10px; font: 700 13px/1 'Inter', sans-serif; cursor: pointer;
  min-height: 40px; transition: opacity .12s;
}
.ls-step-apply:active { opacity: .8; }

/* Date */
.ls-date-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border: 1.5px solid var(--bo); border-radius: 14px;
  cursor: pointer; background: var(--su); position: relative; transition: border-color .12s;
}
.ls-date-row:active { border-color: var(--a); }
.ls-date-txt { flex: 1; font: 600 14px/1 'Inter', sans-serif; color: var(--ink); }
.ls-date-badge {
  font: 600 11px/1 'Inter', sans-serif; color: var(--a);
  background: rgba(88,204,2,.08); padding: 4px 9px; border-radius: 8px;
}
.ls-date-input { position: absolute; opacity: 0; width: 1px; height: 1px; top: 0; left: 0; pointer-events: none; }

/* Accordéons step 2 */
.ls-acc-list { display: flex; flex-direction: column; gap: 6px; }
.ls-acc-item {
  border: 1.5px solid var(--bo); border-radius: 14px; overflow: hidden;
  transition: border-color .15s;
}
.ls-acc-item.ls-acc-open { border-color: rgba(99,102,241,.4); }
.ls-acc-hdr {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; background: var(--su); border: none;
  cursor: pointer; text-align: left; transition: background .12s;
  -webkit-tap-highlight-color: transparent;
}
.ls-acc-hdr:active { background: var(--bg2); }
.ls-acc-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.ls-acc-dot.c1 { background: #6366f1; }
.ls-acc-dot.c2 { background: #8b5cf6; }
.ls-acc-dot.c3 { background: #06b6d4; }
.ls-acc-dot.c4 { background: #f59e0b; }
.ls-acc-name { flex: 1; font: 600 14px/1.2 'Inter', sans-serif; color: var(--ink); }
.ls-acc-badge {
  font: 700 11px/1 'Inter', sans-serif;
  background: rgba(88,204,2,.15); color: var(--a);
  padding: 3px 8px; border-radius: 8px; flex-shrink: 0;
}
.ls-acc-chevron {
  color: var(--mu2); display: flex;
  transition: transform .22s cubic-bezier(.22,1,.32,1);
}
.ls-acc-item.ls-acc-open .ls-acc-chevron { transform: rotate(180deg); }
.ls-acc-body { padding: 4px 14px 14px; background: var(--su); }

/* Compétences chips */
.ls-comp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ls-comp-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 11px; border: 1.5px solid var(--bo); border-radius: 20px;
  font: 500 12px/1 'Inter', sans-serif; color: #4b5563; background: var(--su);
  cursor: pointer; transition: border-color .12s, background .12s, color .12s, transform .1s;
  min-height: 34px; text-align: left;
  touch-action: manipulation;
}
.ls-comp-chip:active { transform: scale(.96); }
.ls-comp-chip.ls-comp-sel { font-weight: 600; }
.ls-comp-chip.ls-comp-acquis:not([disabled])    { border-color: rgba(34,197,94,.55);  background: rgba(34,197,94,.12);  color: var(--grd); }
.ls-comp-chip.ls-comp-en_cours                  { border-color: rgba(245,158,11,.55); background: rgba(245,158,11,.12); color: var(--amk); }
.ls-comp-chip.ls-comp-a_retravailler            { border-color: rgba(239,68,68,.55);  background: rgba(239,68,68,.12);  color: var(--rdx); }
.ls-comp-chip.ls-comp-acquis[disabled]          { border-color: #d1fae5; background: #f0fdf4; color: #6ee7b7; cursor: default; opacity: .8; }
.ls-comp-code {
  font: 700 9px/1 'Inter', sans-serif; padding: 1px 5px; border-radius: 5px;
  background: rgba(88,204,2,.1); color: var(--a); flex-shrink: 0;
}
.ls-comp-sel.ls-comp-acquis:not([disabled]) .ls-comp-code { background: var(--grd); color: #fff; }
.ls-comp-sel.ls-comp-en_cours               .ls-comp-code { background: var(--amk); color: #fff; }
.ls-comp-sel.ls-comp-a_retravailler         .ls-comp-code { background: var(--rdx); color: #fff; }
.ls-comp-acquis[disabled] .ls-comp-code { background: #bbf7d0; color: var(--grd); }
.ls-comp-check-ico, .ls-comp-statut-ico { flex-shrink: 0; display: inline-flex; }
.ls-comp-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }

/* Flat sections step 4 */
.ls-c-section { margin-bottom: 16px; }
.ls-c-section:last-child { margin-bottom: 0; }
.ls-c-section-hdr {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.ls-c-section-name {
  flex: 1; font: 600 13px/1 'Inter', sans-serif; color: var(--ink);
}
.ls-c-badge { flex-shrink: 0; }

/* Légende */
.ls-comp-legend {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  font: 500 11px/1.3 'Inter', sans-serif; color: var(--mu2); margin-bottom: 10px;
}
.ls-leg-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 7px; border-radius: 12px; font: 600 10px/1 'Inter', sans-serif;
}
.ls-leg-pill.ls-leg-acquis         { background: rgba(34,197,94,.12);  color: var(--grd); }
.ls-leg-pill.ls-leg-en_cours       { background: rgba(245,158,11,.12); color: var(--amk); }
.ls-leg-pill.ls-leg-a_retravailler { background: rgba(239,68,68,.12);  color: var(--rdx); }

/* Récap step 3 */
.ls-recap-card {
  background: var(--bg2, var(--bg));
  border: 1.5px solid var(--bo); border-radius: 20px;
  padding: 14px 16px;
}
.ls-recap-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.ls-recap-name { font: 600 14px/1.2 'Inter', sans-serif; color: var(--ink); }
.ls-recap-sep  { font-size: 12px; color: var(--mu5); }
.ls-recap-meta { font: 500 13px/1 'Inter', sans-serif; color: var(--mu2); }
.ls-recap-comps {
  margin-top: 8px; display: inline-block;
  font: 600 12px/1.3 'Inter', sans-serif; color: var(--a);
  background: rgba(88,204,2,.08); padding: 5px 10px; border-radius: 8px;
}

/* Commentaire */
.ls-visibility-tag {
  font: 500 11px/1 'Inter', sans-serif; color: var(--mu2);
  display: inline-flex; align-items: center; gap: 5px; margin-bottom: 10px;
}
.ls-ta-wrap { position: relative; }
.ls-textarea {
  width: 100%; box-sizing: border-box; padding: 12px 14px 24px;
  border: 1.5px solid var(--bo); border-radius: 14px;
  font: 500 13px/1.5 'Inter', sans-serif; color: var(--ink); background: var(--su);
  resize: none; outline: none; -webkit-appearance: none; transition: border-color .15s;
}
.ls-textarea:focus { border-color: var(--a); }
.ls-char-count {
  position: absolute; bottom: 8px; right: 10px;
  font: 500 10px/1 'Inter', sans-serif; color: var(--mu5); pointer-events: none;
}
.ls-char-count.ls-near { color: var(--am); }
.ls-tpl-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ls-tpl-chip {
  padding: 7px 12px; border: 1.5px solid var(--bo); border-radius: 20px;
  font: 500 12px/1.4 'Inter', sans-serif; color: var(--a);
  background: rgba(88,204,2,.04); cursor: pointer; min-height: 34px;
  transition: background .12s, border-color .12s;
  white-space: normal; max-width: 100%; text-align: left; word-break: break-word;
}
.ls-tpl-chip:active { background: rgba(88,204,2,.12); border-color: var(--a); }

/* Empty */
.ls-empty-hint { font: 500 13px/1.4 'Inter', sans-serif; color: var(--mu2); padding: 8px 0; }

/* Footer */
.ls-footer {
  position: sticky; bottom: 0;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: var(--su); border-top: 1px solid var(--bo); z-index: 50;
}
.ls-btn-next {
  width: 100%; height: 56px; border: none; border-radius: 16px;
  background: #6366f1; color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity .15s, transform .15s;
}
.ls-btn-next:active { transform: scale(.98); }
.ls-btn-next:disabled { opacity: .45; cursor: not-allowed; }
.ls-submit-btn {
  width: 100%; height: 56px; border: none; border-radius: 16px;
  background: var(--a); color: #fff;
  font: 700 15px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity .15s, transform .15s;
}
.ls-submit-btn:active { transform: scale(.98); }
.ls-submit-btn:disabled { opacity: .45; cursor: not-allowed; }
.ls-submit-btn.ls-loading { opacity: .65; cursor: wait; }

/* Modal doublon */
.ls-dup-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(10,13,26,.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ls-dup-sheet {
  background: var(--su); border-radius: 20px; padding: 24px;
  width: 100%; max-width: 360px; box-shadow: 0 8px 40px rgba(10,13,26,.2);
}
.ls-dup-title { font: 800 17px/1.2 'Plus Jakarta Sans', sans-serif; color: var(--ink); margin-bottom: 10px; letter-spacing: -.02em; }
.ls-dup-body  { font: 500 14px/1.5 'Inter', sans-serif; color: var(--mu); margin-bottom: 20px; }
.ls-dup-btns  { display: flex; gap: 10px; }
.ls-dup-btns-col { flex-direction: column; }
.ls-dup-cancel {
  width: 100%; padding: 13px; border: 1.5px solid var(--bo); border-radius: 12px;
  font: 600 13px/1 'Inter', sans-serif; color: var(--mu); background: var(--su);
  cursor: pointer; min-height: 46px; transition: background .12s;
}
.ls-dup-cancel:active { background: var(--bg2); }
.ls-dup-confirm {
  width: 100%; padding: 13px; border: none; border-radius: 12px;
  font: 700 13px/1 'Inter', sans-serif; color: #fff; background: var(--a);
  cursor: pointer; min-height: 46px; transition: opacity .12s;
}
.ls-dup-confirm:active { opacity: .85; }
.ls-dup-view {
  width: 100%; padding: 13px; border: 1.5px solid var(--adk); border-radius: 12px;
  font: 600 13px/1 'Inter', sans-serif; color: var(--adk);
  background: rgba(88,204,2,.05); cursor: pointer; min-height: 46px; transition: background .12s;
}
.ls-dup-view:active { background: rgba(88,204,2,.12); }

@media (prefers-reduced-motion: reduce) {
  .ls-eleve-row, .ls-dur-chip, .ls-comp-chip, .ls-acc-hdr { transition: none; }
  .ls-acc-chevron { transition: none; }
}
`;
