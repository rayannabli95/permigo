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

// Masque le header global sur une sous-page qui a DÉJÀ son propre en-tête
// complet (retour + titre + actions) — évite deux barres de titre empilées.
// Même contrat que hideBottomNav : restauré au prochain changement de route.
// Ne l'utiliser QUE si l'en-tête in-page permet de ressortir (bouton retour).
export function hideHeader(onRestore) {
  document.getElementById("header-bar")?.setAttribute("hidden", "");
  document.body.classList.add("no-top-chrome");
  const restore = () => {
    document.getElementById("header-bar")?.removeAttribute("hidden");
    document.body.classList.remove("no-top-chrome");
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
