// ═══════════════════════════════════════════════════════════════
// Swipe-to-dismiss pour sheets (Pointer Events)
// Glisser la feuille dans sa direction de sortie la ferme ; relâchée trop
// tôt → retour élastique.
//
// Marche pour les deux patterns de sheet du projet :
//   - sheet créé/détruit (onClose retire l'overlay du DOM)
//   - sheet persistant togglé par une classe .open (onClose retire la classe)
//
// Usage :
//   enableSheetSwipe(sheetEl, onClose, { overlay, direction });
//     sheetEl   : le panneau qui glisse (celui qui a translateY)
//     onClose   : fonction appelée pour fermer (remove / retrait de .open / cleanup)
//     overlay   : (optionnel) le fond à estomper pendant le geste
//     direction : 'down' (défaut, bottom-sheet) ou 'up' (top-sheet)
// ═══════════════════════════════════════════════════════════════

const DRAG_MIN = 6; // px avant de distinguer un drag d'un tap

export function enableSheetSwipe(
  sheet,
  onClose,
  { overlay = null, threshold = 110, direction = "down" } = {},
) {
  if (!sheet) return;
  // sign = +1 si la sortie se fait vers le bas, -1 vers le haut.
  const sign = direction === "up" ? -1 : 1;
  let startY = 0,
    dy = 0,
    startT = 0,
    active = false,
    moved = false;
  let prevTransition = "";

  const onDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    // Geste démarré sur un élément interactif (champ, bouton, lien…) :
    // on ne s'en mêle pas. Sinon un tap un peu glissé (doigt sur téléphone)
    // capturait le pointeur et ANNULAIT le focus → le clavier ne s'ouvrait
    // pas, la saisie paraissait morte (bug « je n'arrive pas à taper »).
    if (
      e.target?.closest?.(
        "input, textarea, select, button, a, [contenteditable]",
      )
    )
      return;
    // Si le contenu est scrollé, on laisse le scroll natif.
    if ((sheet.scrollTop || 0) > 0) return;
    active = true;
    moved = false;
    dy = 0;
    startY = e.clientY;
    startT = Date.now();
    prevTransition = sheet.style.transition;
  };

  const onMove = (e) => {
    if (!active) return;
    // d_out = déplacement dans la direction de sortie (toujours ≥ 0 = vers la sortie)
    const d_out = (e.clientY - startY) * sign;
    // On ne capture que les gestes vers la sortie ; sens inverse → on abandonne.
    if (!moved && d_out < DRAG_MIN) {
      if (d_out < -DRAG_MIN) active = false;
      return;
    }
    if (!moved) {
      moved = true;
      sheet.style.transition = "none";
      try {
        sheet.setPointerCapture(e.pointerId);
      } catch {
        /* ok */
      }
    }
    dy = d_out > 0 ? d_out : d_out * 0.18; // légère résistance à contre-sens
    if (e.cancelable) e.preventDefault();
    sheet.style.transform = `translateY(${dy * sign}px)`;
    if (overlay)
      overlay.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / 480));
  };

  const onUp = () => {
    if (!active) return;
    active = false;
    if (!moved) {
      sheet.style.transition = prevTransition;
      return;
    } // simple tap

    const fast = dy > 45 && Date.now() - startT < 320;
    if (dy > threshold || fast) {
      // Fermeture : on continue la sortie puis on délègue la fermeture réelle.
      sheet.style.transition = "transform .2s ease";
      sheet.style.transform = `translateY(${sign * 100}%)`;
      if (overlay) {
        overlay.style.transition = "opacity .2s ease";
        overlay.style.opacity = "0";
      }
      setTimeout(() => {
        sheet.style.transform = "";
        sheet.style.transition = prevTransition;
        if (overlay) {
          overlay.style.opacity = "";
          overlay.style.transition = "";
        }
        onClose?.();
      }, 195);
    } else {
      // Retour élastique à la position de repos.
      sheet.style.transition = "transform .26s cubic-bezier(.32,.72,0,1)";
      sheet.style.transform = "translateY(0)";
      if (overlay) overlay.style.opacity = "";
      const reset = () => {
        sheet.style.transition = prevTransition;
        sheet.style.transform = "";
      };
      setTimeout(reset, 270);
    }
  };

  sheet.addEventListener("pointerdown", onDown);
  sheet.addEventListener("pointermove", onMove);
  sheet.addEventListener("pointerup", onUp);
  sheet.addEventListener("pointercancel", onUp);
}
