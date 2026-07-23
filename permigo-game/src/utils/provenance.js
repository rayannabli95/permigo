// ═══════════════════════════════════════════════════════════════
// Provenance élève — pastille CRM PRIVÉE au moniteur (nom + couleur).
//
// Le moniteur note d'où vient chaque élève (Le Bon Coin, Instagram,
// bouche à oreille…). Donnée privée : l'élève ne la voit jamais.
// Stockage : public.eleve_provenance (migration 20260706120000, RLS).
//
// Ce module fournit :
//   • provenanceBadge(prov)     → HTML de la pastille 3D (XSS-safe)
//   • fetchProvenanceMap()      → Map(eleve_id → {label,color}) de MES élèves
//   • openProvenanceEditor(...) → la feuille d'édition (nom + couleur)
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc, escAttr } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { haptic } from "@/utils/haptic.js";
import { track } from "@/services/analytics.js";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Palette proposée (teintes saturées → texte lisible).
export const PROV_COLORS = [
  "#ff6e14",
  "#e1306c",
  "#4285f4",
  "#16a34a",
  "#00c2a8",
  "#7c4dff",
  "#f59e0b",
  "#5e6e82",
];

// Choix rapides : nom + couleur par défaut (le moniteur peut tout changer).
export const PROV_PRESETS = [
  { label: "Le Bon Coin", color: "#ff6e14" },
  { label: "Instagram", color: "#e1306c" },
  { label: "Google", color: "#4285f4" },
  { label: "Bouche à oreille", color: "#16a34a" },
  { label: "Ornikar", color: "#00c2a8" },
  { label: "En Voiture Simone", color: "#2f6bff" },
  { label: "Affiche / flyer", color: "#f59e0b" },
];

// Luminance relative → texte blanc ou encre foncée pour rester lisible.
function lum(hex) {
  const n = hex.replace("#", "");
  const ch = (i) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

/** Couleur de texte lisible sur une pastille `hex`. */
export function provInk(hex) {
  return HEX.test(hex) && lum(hex) > 0.6 ? "#1a1f2b" : "#fff";
}

/** Normalise une couleur (fallback ardoise si invalide). */
function safeColor(c) {
  return HEX.test(c || "") ? c : "#5e6e82";
}

/**
 * Pastille « provenance » (plein 3D). Retourne "" s'il n'y a pas de provenance.
 * @param {{label:string,color:string}|null|undefined} prov
 * @param {{lg?:boolean}} [opts]
 */
export function provenanceBadge(prov, opts = {}) {
  if (!prov || !prov.label) return "";
  const color = safeColor(prov.color);
  const cls = "pv-badge" + (opts.lg ? " pv-badge--lg" : "");
  return `<span class="${cls}" style="--c:${color};--pv-ink:${provInk(color)}">${esc(prov.label)}</span>`;
}

/**
 * Provenance de MES élèves (RLS scope automatiquement au moniteur courant).
 * @returns {Promise<Map<string,{label:string,color:string}>>}
 */
export async function fetchProvenanceMap() {
  try {
    const { data, error } = await sb
      .from("eleve_provenance")
      .select("eleve_id, label, color");
    if (error) throw error;
    const m = new Map();
    (data || []).forEach((r) =>
      m.set(r.eleve_id, { label: r.label, color: r.color }),
    );
    return m;
  } catch (e) {
    // Table non migrée / hors-ligne → pas de provenance, silencieux.
    console.warn("[provenance] fetch", e?.message || e);
    return new Map();
  }
}

// ─── Éditeur (feuille du bas) ────────────────────────────────────
/**
 * Ouvre la feuille d'édition de provenance pour un élève.
 * @param {{ eleveId:string, prenom?:string, current?:{label:string,color:string}|null,
 *           onSaved?:(prov:{label:string,color:string}|null)=>void }} o
 */
export function openProvenanceEditor({ eleveId, prenom, current, onSaved }) {
  document.querySelector(".pv-edit")?.remove();

  const me = getCurUser();
  let label = current?.label || "";
  let color = safeColor(current?.color || PROV_COLORS[0]);

  const who = esc(prenom ? prenom : "cet élève");

  const wrap = document.createElement("div");
  wrap.className = "pv-edit";
  wrap.innerHTML = `
    <style>
      .pv-edit-bg { position: fixed; inset: 0; z-index: 500; background: rgba(10,13,26,.42);
        backdrop-filter: blur(3px); animation: pvBg .18s ease; }
      @keyframes pvBg { from { opacity: 0 } to { opacity: 1 } }
      .pv-sheet { position: fixed; z-index: 501; left: 50%; bottom: 0; transform: translateX(-50%);
        width: 100%; max-width: 440px; background: var(--su); color: var(--ink);
        border-radius: 24px 24px 0 0; border: 1px solid var(--bo); border-bottom: 0;
        box-shadow: 0 -12px 40px -8px rgba(10,13,26,.28);
        padding: 16px 16px calc(18px + env(safe-area-inset-bottom, 0px));
        font-family: 'Inter', var(--ens-body, system-ui), sans-serif;
        animation: pvUp .26s cubic-bezier(.23,1,.32,1); }
      @keyframes pvUp { from { transform: translate(-50%, 100%) } to { transform: translate(-50%, 0) } }
      @media (prefers-reduced-motion: reduce) { .pv-edit-bg, .pv-sheet { animation: none } }
      .pv-sheet::before { content: ""; display: block; width: 38px; height: 4px; border-radius: 2px;
        background: var(--bo4); margin: 0 auto 12px; }
      .pv-sh-title { font: 700 18px/1.2 var(--ens-display, 'Fredoka'), 'Inter', sans-serif; margin: 0 2px 3px; }
      .pv-sh-desc { font: 500 12.5px/1.4 'Inter', sans-serif; color: var(--mu); margin: 0 2px 14px; }
      .pv-preview { display: flex; align-items: center; gap: 11px; background: var(--su2);
        border: 1px solid var(--bo); border-radius: 16px; padding: 13px 14px; margin-bottom: 16px; min-height: 42px; }
      .pv-preview-txt { font: 700 14.5px/1 'Inter', sans-serif; color: var(--ink); }
      .pv-l { font: 800 10.5px/1 'Inter', sans-serif; letter-spacing: .08em; text-transform: uppercase;
        color: var(--mu); margin: 0 2px 9px; }
      .pv-presets { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
      .pv-chip { border: 1px solid var(--bo); background: var(--su); color: var(--ink2);
        font: 700 12px 'Inter', sans-serif; padding: 8px 12px; border-radius: 999px; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px; -webkit-tap-highlight-color: transparent; }
      .pv-chip:active { transform: scale(.96) }
      .pv-chip .pv-cdot { width: 9px; height: 9px; border-radius: 50%; background: var(--cc); }
      .pv-inp { width: 100%; box-sizing: border-box; border: 1.5px solid var(--bo); background: var(--su2);
        color: var(--ink); font: 700 15px 'Inter', sans-serif; padding: 12px 14px; border-radius: 13px;
        margin-bottom: 16px; outline: none; }
      .pv-inp:focus { border-color: var(--a); }
      .pv-sw-row { display: flex; flex-wrap: wrap; gap: 11px; align-items: center; margin-bottom: 20px; }
      .pv-sw { width: 34px; height: 34px; border-radius: 50%; border: 0; cursor: pointer; padding: 0;
        background: var(--sc); position: relative; -webkit-tap-highlight-color: transparent;
        box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--sc) 55%, transparent), inset 0 1.5px 0 rgba(255,255,255,.35);
        transition: transform .12s cubic-bezier(.34,1.56,.64,1); }
      .pv-sw:active { transform: scale(.9) }
      .pv-sw.on { box-shadow: 0 0 0 3px var(--su), 0 0 0 5px var(--sc); }
      .pv-sw.on::after { content: ""; position: absolute; inset: 0; background: center/15px no-repeat
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E"); }
      .pv-free { width: 34px; height: 34px; border-radius: 50%; border: 1.5px dashed var(--bo4);
        display: grid; place-items: center; cursor: pointer; position: relative; overflow: hidden;
        background: conic-gradient(from 0deg, #ff5f5f, #ffb03a, #6fe016, #22d3ee, #7c4dff, #ec4899, #ff5f5f); }
      .pv-free input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .pv-free span { width: 16px; height: 16px; border-radius: 50%; background: var(--su); display: grid;
        place-items: center; font: 800 14px 'Fredoka', sans-serif; color: var(--ink); line-height: 1; }
      .pv-actions { display: flex; gap: 10px; }
      .pv-btn { border: 0; border-radius: 14px; font: 700 15px var(--ens-display, 'Fredoka'), 'Inter', sans-serif;
        padding: 14px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
      .pv-btn-primary { flex: 1; background: linear-gradient(180deg, var(--a-lt, #818cf8), var(--a));
        color: #fff; box-shadow: 0 6px 16px -6px var(--a), inset 0 1px 0 rgba(255,255,255,.3); }
      .pv-btn-primary:disabled { opacity: .5; cursor: default; box-shadow: none; }
      .pv-btn-ghost { flex: 0 0 auto; background: var(--su2); color: var(--mu); border: 1px solid var(--bo); padding: 14px 18px; }
      .pv-note { font: 500 11.5px/1.5 'Inter', sans-serif; color: var(--mu); background: var(--su2);
        border: 1px solid var(--bo); border-radius: 12px; padding: 10px 12px; margin-top: 18px; }
      .pv-note b { color: var(--ink2); }
    </style>
    <div class="pv-edit-bg" data-close="1"></div>
    <div class="pv-sheet" role="dialog" aria-label="Provenance de l'élève">
      <div class="pv-sh-title">D'où vient ${who} ?</div>
      <p class="pv-sh-desc">Note comment il t'a trouvé. Visible seulement par toi.</p>

      <div class="pv-preview">
        <span class="pv-badge pv-badge--lg" id="pv-prev" style="--c:${color};--pv-ink:${provInk(color)}">${esc(label || "Provenance")}</span>
        <span class="pv-preview-txt" id="pv-prev-empty" style="display:none;color:var(--mu)">Choisis une provenance…</span>
      </div>

      <div class="pv-l">Choix rapides</div>
      <div class="pv-presets" id="pv-presets">
        ${PROV_PRESETS.map(
          (p) =>
            `<button class="pv-chip" type="button" style="--cc:${p.color}" data-l="${escAttr(p.label)}" data-c="${p.color}"><span class="pv-cdot"></span>${esc(p.label)}</button>`,
        ).join("")}
      </div>

      <div class="pv-l">Nom de la pastille</div>
      <input class="pv-inp" id="pv-lbl" value="${escAttr(label)}" maxlength="40" placeholder="Ex : Le Bon Coin, un ami, TikTok…" autocomplete="off">

      <div class="pv-l">Couleur</div>
      <div class="pv-sw-row" id="pv-sw-row">
        ${PROV_COLORS.map(
          (c) =>
            `<button class="pv-sw${c.toLowerCase() === color.toLowerCase() ? " on" : ""}" type="button" style="--sc:${c}" data-c="${c}" aria-label="Couleur ${c}"></button>`,
        ).join("")}
        <label class="pv-free" title="Couleur libre"><span>+</span><input type="color" id="pv-free" value="${color}"></label>
      </div>

      <div class="pv-actions">
        <button class="pv-btn pv-btn-primary" id="pv-save">Enregistrer</button>
        ${current ? `<button class="pv-btn pv-btn-ghost" id="pv-remove">Retirer</button>` : ""}
      </div>

      <div class="pv-note"><b>Confidentiel.</b> C'est ton info à toi (comme un CRM) — l'élève ne la voit jamais.</div>
    </div>`;

  document.body.appendChild(wrap);

  const prev = wrap.querySelector("#pv-prev");
  const prevEmpty = wrap.querySelector("#pv-prev-empty");
  const inp = wrap.querySelector("#pv-lbl");
  const saveBtn = wrap.querySelector("#pv-save");

  const refresh = () => {
    const has = !!label.trim();
    prev.style.display = has ? "" : "none";
    prevEmpty.style.display = has ? "none" : "";
    if (has) {
      prev.textContent = label.trim();
      prev.style.setProperty("--c", color);
      prev.style.setProperty("--pv-ink", provInk(color));
    }
    saveBtn.disabled = !has;
  };

  const setColor = (c) => {
    color = safeColor(c);
    wrap.querySelector("#pv-free").value = color;
    wrap
      .querySelectorAll("#pv-sw-row .pv-sw")
      .forEach((s) =>
        s.classList.toggle(
          "on",
          (s.dataset.c || "").toLowerCase() === color.toLowerCase(),
        ),
      );
    refresh();
  };

  inp.addEventListener("input", () => {
    label = inp.value;
    refresh();
  });
  wrap.querySelectorAll("#pv-sw-row .pv-sw").forEach((s) =>
    s.addEventListener("click", () => {
      haptic("tap");
      setColor(s.dataset.c);
    }),
  );
  wrap
    .querySelector("#pv-free")
    .addEventListener("input", (e) => setColor(e.target.value));
  wrap.querySelectorAll("#pv-presets .pv-chip").forEach((c) =>
    c.addEventListener("click", () => {
      haptic("tap");
      label = c.dataset.l;
      inp.value = label;
      setColor(c.dataset.c);
    }),
  );

  const close = () => wrap.remove();
  wrap.querySelector("[data-close]").addEventListener("click", close);

  saveBtn.addEventListener("click", async () => {
    const clean = label.trim().slice(0, 40);
    if (!clean) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "…";
    try {
      const { error } = await sb.from("eleve_provenance").upsert(
        {
          eleve_id: eleveId,
          moniteur_id: me.id,
          label: clean,
          color: safeColor(color),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "eleve_id" },
      );
      if (error) throw error;
      haptic("validate");
      track("eleve.provenance_set", { eleve_id: eleveId });
      toast("Provenance enregistrée", "success");
      onSaved?.({ label: clean, color: safeColor(color) });
      close();
    } catch (e) {
      console.error("[provenance] save", e);
      toast("Impossible d'enregistrer", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Enregistrer";
    }
  });

  wrap.querySelector("#pv-remove")?.addEventListener("click", async () => {
    try {
      const { error } = await sb
        .from("eleve_provenance")
        .delete()
        .eq("eleve_id", eleveId);
      if (error) throw error;
      haptic("tap");
      track("eleve.provenance_clear", { eleve_id: eleveId });
      toast("Provenance retirée", "success");
      onSaved?.(null);
      close();
    } catch (e) {
      console.error("[provenance] remove", e);
      toast("Impossible de retirer", "error");
    }
  });

  refresh();
  // Focus doux sur le champ nom si vide (le moniteur tape directement).
  if (!label) setTimeout(() => inp.focus(), 80);
}
