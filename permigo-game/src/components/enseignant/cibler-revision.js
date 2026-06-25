// ═══════════════════════════════════════════════════════════════
// Moniteur — « Devoirs de révision » (couche 2 « Avant/Après ta leçon »)
// Le moniteur désigne des compétences REMC à faire réviser à SON élève, et
// SUIT leur complétion (Fait / Pas fait — la colonne done_at de revision_focus).
// Insère/lit `revision_focus` (RLS : moniteur → son élève only).
// L'élève la voit dans #/revision-conduite et la marque faite (mark_revision_focus_done).
//
// Composant autonome monté en bas de la fiche élève (livret). Ton pro
// (Linear/Notion), pas de mascotte/confetti (antipatterns moniteur).
// Cadrage VALIDATION : « avant sa prochaine validation », jamais de créneau.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc } from "@/utils/escape.js";
import { toast } from "@/components/common/toast.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { FICHES } from "@/data/fiches-conduite.js";

// code → titre (pour afficher les devoirs envoyés)
const FICHE_TITRE = Object.fromEntries(FICHES.map((f) => [f.code, f.titre]));

const STYLE = `<style>
.cr { display:block; margin-top:16px; }
.cr-card { border:1px solid var(--bo2,#e2e8f0); border-radius:14px; padding:16px; background:var(--bg,#fff); }
.cr-h { font:700 15px 'Plus Jakarta Sans',sans-serif; color:var(--ink,#0f172a); }
.cr-sub { font:500 12px/1.4 'Inter',sans-serif; color:var(--mu2,#64748b); margin:2px 0 12px; }
.cr-sel, .cr-note { width:100%; box-sizing:border-box; border:1px solid var(--bo2,#e2e8f0); border-radius:10px; padding:11px 12px; font:500 14px 'Inter',sans-serif; color:var(--ink,#0f172a); background:var(--bg,#fff); margin-bottom:8px; }
.cr-send { width:100%; border:0; border-radius:10px; padding:12px; cursor:pointer; font:700 14px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1); }
.cr-send:disabled { opacity:.6; cursor:default; }
.cr-feedback { font:600 12px 'Inter',sans-serif; color:#16a34a; margin-top:8px; min-height:16px; }

/* Suivi des devoirs envoyés (Fait / Pas fait) */
.cr-list { margin-top:16px; padding-top:14px; border-top:1px solid var(--bo2,#eef0f6); }
.cr-list-h { font:800 11px 'Inter',sans-serif; text-transform:uppercase; letter-spacing:.06em; color:var(--mu2,#64748b); margin-bottom:4px; }
.cr-item { display:flex; align-items:center; gap:10px; padding:10px 0; border-top:1px solid var(--bo2,#eef0f6); }
.cr-item:first-of-type { border-top:0; }
.cr-item-t { flex:1; min-width:0; font:600 13px/1.3 'Inter',sans-serif; color:var(--ink,#1a1c2e); }
.cr-item-t small { display:block; font:500 11px/1.3 'Inter',sans-serif; color:var(--mu2,#8b92a3); margin-top:2px; }
.cr-st { flex-shrink:0; font:700 11px 'Inter',sans-serif; padding:4px 9px; border-radius:999px; }
.cr-st.done { color:#15803d; background:#dcfce7; }
.cr-st.wait { color:#b45309; background:#fef3c7; }
.cr-empty { font:500 12px 'Inter',sans-serif; color:var(--mu2,#94a3b8); padding:6px 0 0; }
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
      <div class="cr-h">Devoirs de révision</div>
      <div class="cr-sub">Désigne une compétence à réviser avant sa prochaine validation (3 questions ciblées, entre deux leçons).</div>
      <select class="cr-sel" aria-label="Compétence à faire réviser">${opts}</select>
      <input class="cr-note" type="text" maxlength="80" placeholder="Note courte (optionnel)" />
      <button class="cr-send" type="button">Envoyer à l'élève</button>
      <div class="cr-feedback" aria-live="polite"></div>
      <div class="cr-list" id="cr-list" hidden></div>
    </div>`;
  host.appendChild(el);

  const sel = el.querySelector(".cr-sel");
  const note = el.querySelector(".cr-note");
  const btn = el.querySelector(".cr-send");
  const fb = el.querySelector(".cr-feedback");
  const listEl = el.querySelector("#cr-list");

  // Charge le suivi des devoirs déjà envoyés (Fait / Pas fait via done_at).
  async function refreshList() {
    try {
      const { data, error } = await sb
        .from("revision_focus")
        .select("id, competence_code, note, created_at, done_at")
        .eq("moniteur_id", me.id)
        .eq("eleve_id", eleveId)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      const items = data || [];
      if (!items.length) {
        listEl.hidden = false;
        listEl.innerHTML = `<div class="cr-list-h">Devoirs envoyés</div><div class="cr-empty">Aucun devoir envoyé pour l'instant.</div>`;
        return;
      }
      const fait = items.filter((i) => i.done_at).length;
      listEl.hidden = false;
      listEl.innerHTML =
        `<div class="cr-list-h">Devoirs envoyés · ${fait}/${items.length} faits</div>` +
        items
          .map((i) => {
            const titre = FICHE_TITRE[i.competence_code];
            const label = titre
              ? `${esc(i.competence_code)} — ${esc(titre)}`
              : esc(i.competence_code);
            const done = !!i.done_at;
            return `<div class="cr-item">
              <span class="cr-item-t">${label}${i.note ? `<small>${esc(i.note)}</small>` : ""}</span>
              <span class="cr-st ${done ? "done" : "wait"}">${done ? "Fait ✓" : "Pas fait"}</span>
            </div>`;
          })
          .join("");
    } catch (e) {
      console.error("[cibler-revision] refreshList", e);
      // Erreur de lecture : on masque le suivi (le formulaire d'envoi reste).
      listEl.hidden = true;
    }
  }

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
      toast("Devoir envoyé à l'élève");
      note.value = "";
      fb.textContent = "Envoyé ✓";
      refreshList();
    } catch (e) {
      console.error("[cibler-revision]", e);
      toast("Envoi impossible. Réessaie.");
    } finally {
      btn.disabled = false;
    }
  });

  refreshList();
}
