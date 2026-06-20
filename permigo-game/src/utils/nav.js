// Masque la bottom-nav pendant les écrans plein écran (quiz/examen) et la
// restaure au prochain changement de route. Dédup de 3 copies (quiz/examen/
// exam-blanc). Renvoie la fonction de restauration pour un appel manuel éventuel.
export function hideBottomNav(onRestore) {
  document.getElementById("bottom-nav")?.setAttribute("hidden", "");
  const restore = () => {
    document.getElementById("bottom-nav")?.removeAttribute("hidden");
    try {
      onRestore?.();
    } catch {
      /* noop */
    }
    window.removeEventListener("hashchange", restore);
  };
  window.addEventListener("hashchange", restore);
  return restore;
}
