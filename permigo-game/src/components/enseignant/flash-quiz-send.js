// ═══════════════════════════════════════════════════════════════
// Moniteur — « Quiz éclair » : envoie à SON élève un défi de 3 questions
// sur une compétence REMC, à répondre en 5 minutes.
// Appelle la RPC `send_flash_quiz` (existante en prod : tire 3 questions
// aléatoires de la compétence, périme le quiz précédent non répondu, et
// notifie l'élève in-app). Côté élève : bandeau accueil + hub Réviser +
// page #/flash-quiz/{id}.
//
// Composant autonome monté en bas de la fiche élève (livret), à côté des
// « Devoirs de révision ». Ton pro (Linear/Notion), pas de mascotte.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { esc, escAttr } from "@/utils/escape.js";
import { track } from "@/services/analytics.js";
import { getCurUser } from "@/auth/cur-user.js";
import { REMC } from "@/data/remc.js";

const STYLE = `<style>
.fqs { display:block; margin-top:12px; }
.fqs-card { border:1px solid var(--bo2,#e2e8f0); border-radius:14px; padding:16px; background:var(--bg,#fff); }
.fqs-h { font:700 15px 'Plus Jakarta Sans',sans-serif; color:var(--ink,#0f172a); }
.fqs-sub { font:500 12px/1.4 'Inter',sans-serif; color:var(--mu2,#64748b); margin:2px 0 12px; }
.fqs-sel { width:100%; box-sizing:border-box; border:1px solid var(--bo2,#e2e8f0); border-radius:10px; padding:11px 12px; font:500 14px 'Inter',sans-serif; color:var(--ink,#0f172a); background:var(--bg,#fff); margin-bottom:8px; }
.fqs-send { width:100%; border:0; border-radius:10px; padding:12px; cursor:pointer; font:700 14px 'Plus Jakarta Sans',sans-serif; color:#fff; background:var(--a,#6366f1); }
.fqs-send:disabled { opacity:.6; cursor:default; }
.fqs-feedback { font:600 12px 'Inter',sans-serif; color:#16a34a; margin-top:8px; min-height:16px; }
.fqs-feedback.err { color:#dc2626; }
</style>`;

export function mountFlashQuizSend(root, eleveId) {
  if (!eleveId || !root) return;
  const host = root.querySelector(".lr-page");
  if (!host || host.querySelector(".fqs")) return; // idempotent
  const me = getCurUser();
  if (!me) return;

  const opts = REMC.map(
    (cat) =>
      `<optgroup label="${escAttr(cat.id)} — ${esc(cat.name)}">${cat.subs
        .map(
          (s) =>
            `<option value="${escAttr(s.c)}">${esc(s.c)} — ${esc(s.n)}</option>`,
        )
        .join("")}</optgroup>`,
  ).join("");

  const el = document.createElement("section");
  el.className = "fqs";
  el.innerHTML = `${STYLE}
    <div class="fqs-card">
      <div class="fqs-h">Quiz éclair ⚡</div>
      <div class="fqs-sub">3 questions sur une compétence, 5 minutes chrono. L'élève est notifié immédiatement — parfait juste après une leçon.</div>
      <select class="fqs-sel" aria-label="Compétence du quiz éclair">${opts}</select>
      <button class="fqs-send" type="button">Envoyer maintenant</button>
      <div class="fqs-feedback" aria-live="polite"></div>
    </div>`;
  host.appendChild(el);

  const sel = el.querySelector(".fqs-sel");
  const btn = el.querySelector(".fqs-send");
  const fb = el.querySelector(".fqs-feedback");

  btn.addEventListener("click", async () => {
    const code = sel.value;
    if (!code) return;
    btn.disabled = true;
    fb.classList.remove("err");
    fb.textContent = "Envoi…";
    try {
      const { error } = await sb.rpc("send_flash_quiz", {
        p_eleve_id: eleveId,
        p_competence_id: code,
      });
      if (error) throw error;
      track("flash_quiz.sent", { eleve_id: eleveId, competence_id: code });
      fb.textContent = "Envoyé ✓ — il a 5 minutes pour répondre.";
    } catch (e) {
      fb.classList.add("err");
      // Cas connu : la compétence n'a pas assez de questions en base.
      fb.textContent = String(e?.message || "").includes("not enough questions")
        ? "Pas assez de questions sur cette compétence — choisis-en une autre."
        : "Envoi impossible pour l'instant. Réessaie.";
      console.error("[flash-quiz-send]", e);
    } finally {
      btn.disabled = false;
    }
  });
}
