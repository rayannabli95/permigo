// ═══════════════════════════════════════════════════════════════
// Moniteur — « Cibler une révision conduite » (couche 2 « Avant/Après ta leçon »)
// Le moniteur désigne une compétence REMC à faire réviser à SON élève.
// Insère une ligne dans `revision_focus` (RLS : moniteur → son élève only).
// L'élève la voit ensuite dans #/revision-conduite.
//
// Composant autonome monté en bas de la fiche élève (livret). Ton pro
// (Linear/Notion), pas de mascotte/confetti (antipatterns moniteur).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { FICHES } from "@/data/fiches-conduite.js";

const STYLE = `<style>
.cr { display:block; margin-top:16px; }
.cr-card { border:1px solid var(--bo2,#e2e8f0); border-radius:14px; padding:16px; background:var(--bg,#fff); }
.cr-h { font:700 15px 'Plus Jakarta Sans',sans-serif; color:var(--ink,#0f172a); }
.cr-sub { font:500 12px/1.4 'Inter',sans-serif; color:var(--mu2,#64748b); margin:2px 0 12px; }
.cr-sel, .cr-note { width:100%; box-sizing:border-box; border:1px solid var(--bo2,#e2e8f0); border-radius:10px; padding:11px 12px; font:500 14px 'Inter',sans-serif; color:var(--ink,#0f172a); background:var(--bg,#fff); margin-bottom:8px; }
.cr-send { width:100%; border:0; border-radius:10px; padding:12px; cursor:pointer; font:700 14px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1); }
.cr-send:disabled { opacity:.6; cursor:default; }
.cr-feedback { font:600 12px 'Inter',sans-serif; color:#16a34a; margin-top:8px; min-height:16px; }
</style>`;

export function mountCiblerRevision(root, eleveId) {
  if (!eleveId || !root) return;
  const host = root.querySelector(".lr-page");
  if (!host || host.querySelector(".cr")) return; // idempotent
  const me = getCurUser();
  if (!me) return;

  const opts = FICHES.map(
    (f) =>
      `<option value="${esc(f.code)}">${esc(f.code)} — ${esc(f.titre)}</option>`,
  ).join("");

  const el = document.createElement("section");
  el.className = "cr";
  el.innerHTML = `${STYLE}
    <div class="cr-card">
      <div class="cr-h">Cibler une révision conduite</div>
      <div class="cr-sub">L'élève la révisera entre deux leçons (3 questions ciblées).</div>
      <select class="cr-sel" aria-label="Compétence à faire réviser">${opts}</select>
      <input class="cr-note" type="text" maxlength="80" placeholder="Note courte (optionnel)" />
      <button class="cr-send" type="button">Envoyer à l'élève</button>
      <div class="cr-feedback" aria-live="polite"></div>
    </div>`;
  host.appendChild(el);

  const sel = el.querySelector(".cr-sel");
  const note = el.querySelector(".cr-note");
  const btn = el.querySelector(".cr-send");
  const fb = el.querySelector(".cr-feedback");

  btn.addEventListener("click", async () => {
    const code = sel.value;
    if (!code) return;
    btn.disabled = true;
    fb.textContent = "";
    try {
      const { error } = await sb.from("revision_focus").insert({
        eleve_id: eleveId,
        moniteur_id: me.id,
        competence_code: code,
        note: note.value.trim() || null,
      });
      if (error) throw error;
      track("revision_focus_created", { code });
      toast("Révision envoyée à l'élève");
      note.value = "";
      fb.textContent = "Envoyé ✓";
    } catch (e) {
      console.error("[cibler-revision]", e);
      toast("Envoi impossible. Réessaie.");
    } finally {
      btn.disabled = false;
    }
  });
}
