// ═══════════════════════════════════════════════════════════════
// Élève — Toutes mes leçons : historique des comptes-rendus
// Route : #/mes-lecons (chantier 5, nav simplifiée — sous-page du hub
// « Mon permis », étape ② « Mes leçons » → « Toutes mes leçons »).
//
// Données 100% réelles : table `comptes_rendus` (RLS déjà en place, cf.
// migration 20260626120000_compte_rendu_auto.sql), chaque ligne ouvre le
// détail existant `#/compte-rendu/{id}` — zéro duplication de ce rendu.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";
import { esc } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { navigate } from "@/router.js";
import { haptic } from "@/utils/haptic.js";
import { icon } from "@/utils/icons.js";
import { medallion } from "@/utils/medallions.js";
import { emptyState } from "@/components/common/empty-state.js";

const PAGE_SIZE = 100; // historique élève réaliste ≪ 1000 (pas de pagination PostgREST à gérer)

// ─── CSS scoped ────────────────────────────────────────────────
const STYLE = `<style>
.ml {
  max-width: 480px; margin: 0 auto; padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 40px);
  background: var(--bg); font-family: 'Inter', sans-serif; color: var(--ink); min-height: 100dvh;
}
.ml-hd {
  position: sticky; top: calc(52px + env(safe-area-inset-top, 0px)); z-index: 20;
  background: var(--su); border-bottom: 1px solid var(--bo); padding: 10px 16px;
  display: flex; align-items: center; gap: 10px;
}
.ml-back {
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--bo);
  background: var(--su); cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--ink); padding: 0; position: relative;
}
.ml-back::before { content: ''; position: absolute; inset: -4px; }
.ml-back:active { background: var(--bg); }
.ml-hd-title { font: 800 16px/1.2 'Plus Jakarta Sans', sans-serif; letter-spacing: -.02em; flex: 1; }
.ml-hd-count { font: 700 11.5px/1 'IBM Plex Mono', monospace; color: var(--mu2); }

.ml-list { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.ml-row {
  display: block; width: 100%; padding: 13px 14px; border-radius: 16px; cursor: pointer; text-align: left;
  font: inherit; color: inherit; background: var(--su); border: 1px solid var(--bo);
  box-shadow: 0 1px 2px rgba(10,13,26,.04); min-height: 44px;
}
.ml-row-top { display: flex; align-items: center; gap: 10px; }
.ml-row-ico { flex: none; }
.ml-row-b { flex: 1; min-width: 0; }
.ml-row-date { font: 700 14px/1.25 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
.ml-row-chips { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.ml-row-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 800; }
.ml-row-chip.ok { color: var(--gr-txt); }
.ml-row-chip.warn { color: var(--am-txt); }
.ml-row-new {
  flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--a);
}
.ml-row-go { flex: none; color: var(--mu2); }

.ml-skel-row {
  height: 66px; border-radius: 16px;
  background: linear-gradient(90deg, var(--bg3, #f0f0f4) 0%, var(--bo, #e4e4eb) 50%, var(--bg3, #f0f0f4) 100%);
  background-size: 200% 100%; animation: mlShim 1.4s ease-in-out infinite;
}
@keyframes mlShim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) { .ml-skel-row { animation: none; } }
</style>`;

// ─── Format date FR (même logique que compte-rendu.js — parse LOCAL,
// un DATE SQL yyyy-mm-dd lu en UTC décalerait d'un jour) ──────────
function fmtDateFR(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const dt = y && m && d ? new Date(y, m - 1, d) : new Date(iso);
  return dt.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Skeleton ──────────────────────────────────────────────────
function renderSkeleton() {
  return `${STYLE}
<div class="ml anim-slide-up">
  <div class="ml-hd">
    <button class="ml-back" id="ml-back-skel" aria-label="Retour">
      ${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}
    </button>
    <div class="ml-hd-title">Mes leçons</div>
  </div>
  <div class="ml-list">
    ${Array.from({ length: 5 }, () => `<div class="ml-skel-row"></div>`).join("")}
  </div>
</div>`;
}

// ─── Render ────────────────────────────────────────────────────
function renderRow(cr) {
  const acquisN = (cr.acquis || []).length;
  const retrN = (cr.a_retravailler || []).length;
  const chips = [];
  if (acquisN > 0)
    chips.push(
      `<span class="ml-row-chip ok">${medallion("check", "green", { size: 14 })}${acquisN} validée${acquisN > 1 ? "s" : ""}</span>`,
    );
  if (retrN > 0)
    chips.push(
      `<span class="ml-row-chip warn">${medallion("cible", "orange", { size: 14 })}${retrN} à retravailler</span>`,
    );
  return `
  <button class="ml-row" data-id="${esc(cr.id)}" type="button">
    <div class="ml-row-top">
      <span class="ml-row-ico" aria-hidden="true">${medallion("fiches", "violet", { size: 34 })}</span>
      <div class="ml-row-b">
        <div class="ml-row-date">${esc(fmtDateFR(cr.session_date || cr.created_at))}</div>
        ${chips.length ? `<div class="ml-row-chips">${chips.join("")}</div>` : ""}
      </div>
      ${!cr.read_at ? `<span class="ml-row-new" aria-label="Non lu"></span>` : ""}
      <span class="ml-row-go" aria-hidden="true">${icon("chevron-right", { size: 18 })}</span>
    </div>
  </button>`;
}

// ─── Wire ──────────────────────────────────────────────────────
function wire(root) {
  root
    .querySelectorAll("#ml-back, #ml-back-skel")
    .forEach((b) =>
      b.addEventListener("click", () => navigate("#/mon-permis")),
    );

  root.querySelectorAll(".ml-row[data-id]").forEach((row) => {
    row.addEventListener("click", () => {
      haptic("tap");
      const id = row.dataset.id;
      track("mes_lecons.open", { cr_id: id });
      navigate(`#/compte-rendu/${id}`);
    });
  });
}

// ─── Mount ─────────────────────────────────────────────────────
export async function mount(root) {
  const me = getCurUser();
  if (!me) return;

  track("page_view", { page: "mes_lecons", role: me.role });

  root.innerHTML = renderSkeleton();
  root
    .querySelector("#ml-back-skel")
    ?.addEventListener("click", () => navigate("#/mon-permis"));

  const { data, error } = await sb
    .from("comptes_rendus")
    .select(
      "id, session_date, created_at, acquis, en_cours, a_retravailler, note, read_at",
    )
    .eq("eleve_id", me.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error) {
    root.innerHTML = `${STYLE}
<div class="ml anim-slide-up">
  <div class="ml-hd">
    <button class="ml-back" id="ml-back" aria-label="Retour">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
    <div class="ml-hd-title">Mes leçons</div>
  </div>
  <div style="padding:48px 24px;text-align:center;color:var(--mu3)">
    <p style="font:600 15px/1.5 'Inter',sans-serif">« Mes leçons » indisponible.<br>Vérifie ta connexion, puis réessaie.</p>
    <button id="ml-retry" style="margin-top:14px;padding:12px 24px;border:0;background:var(--a);color:var(--a-ink);border-radius:12px;cursor:pointer">Réessayer</button>
  </div>
</div>`;
    root
      .querySelector("#ml-retry")
      ?.addEventListener("click", () => mount(root));
    wire(root);
    return;
  }

  const rows = data || [];

  const listHtml = rows.length
    ? `<div class="ml-list">${rows.map(renderRow).join("")}</div>`
    : `<div class="ml-list">${emptyState({
        image: "/skins/empty-states/empty_notifications.png",
        title: "Aucun compte-rendu pour l'instant",
        body: "Ton moniteur t'enverra un compte-rendu après ta prochaine leçon.",
      })}</div>`;

  root.innerHTML = `${STYLE}
<div class="ml anim-slide-up">
  <div class="ml-hd">
    <button class="ml-back" id="ml-back" aria-label="Retour">${icon("arrow-left", { size: 18, strokeWidth: 2.5 })}</button>
    <div class="ml-hd-title">Mes leçons</div>
    ${rows.length ? `<span class="ml-hd-count">${rows.length}</span>` : ""}
  </div>
  ${listHtml}
</div>`;

  wire(root);
}
