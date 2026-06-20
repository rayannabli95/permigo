// ═══════════════════════════════════════════════════════════════
// Bottom-sheet — cycle de vie mutualisé des feuilles qui glissent du bas.
//
// Ne fournit QUE le shell (création de l'overlay, montage, swipe-to-dismiss,
// clic backdrop, fermeture). Le STYLE et le contenu restent à la page appelante
// (via `bgClass` + `html`), donc le rendu visuel est inchangé d'une page à
// l'autre. Dédup de boutique/trophées (le drag était déjà partagé via
// sheet-swipe.js ; ici on factorise le reste du cycle de vie).
//
// Usage :
//   const { overlay, sheet, close } = openBottomSheet({
//     bgClass: "bo2-modal-bg",      // classe de l'overlay (backdrop) — CSS de la page
//     sheetSelector: ".bo2-modal",  // sélecteur de la feuille à l'intérieur
//     html: `<div class="bo2-modal">…</div>`,
//     onClose,                      // optionnel
//   });
//   overlay.querySelector("#mon-bouton")?.addEventListener("click", close);
// ═══════════════════════════════════════════════════════════════
import { enableSheetSwipe } from "@/utils/sheet-swipe.js";
import { haptic } from "@/utils/haptic.js";

export function openBottomSheet({ bgClass, sheetSelector, html, onClose }) {
  const overlay = document.createElement("div");
  overlay.className = bgClass;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    haptic("select");
    overlay.remove();
    try {
      onClose?.();
    } catch {
      /* noop */
    }
  };

  const sheet = overlay.querySelector(sheetSelector);
  if (sheet) enableSheetSwipe(sheet, close, { overlay });
  // Clic sur le backdrop (hors feuille) ferme.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  return { overlay, sheet, close };
}
