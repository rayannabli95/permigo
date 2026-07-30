// ═══════════════════════════════════════════════════════════════
// Chrome « nuit » — supprime la couture des pages sombres.
//
// Le problème : le bandeau du haut et la barre du bas sont posés sur
// --su (blanc en thème clair). Les pages qui se peignent en nuit (Réviser,
// Profil, Cartes, l'Arène…) donnaient donc « bande blanche / page violet
// nuit / bande blanche » — trois zones qui ne se parlent pas.
//
// Le contrat : une page nuit colle chromeNight() dans SON bloc <style> et
// déclare la teinte qu'elle a en haut et en bas. Le chrome suit.
//
// Pourquoi dans le <style> de la page plutôt qu'un appel JS : le router
// remplace le contenu de #app à chaque navigation, donc le <style> part
// avec la page et les variables disparaissent toutes seules. Aucun
// nettoyage à faire, aucune page ne peut « laisser le chrome sale »
// derrière elle.
// ═══════════════════════════════════════════════════════════════

/**
 * @param {string} top    couleur de la page au RAS du haut (sous le bandeau)
 * @param {string} bottom couleur de la page au RAS du bas (sous la nav)
 * @returns {string} règle CSS à insérer dans le <style> de la page
 */
export function chromeNight(top, bottom = top) {
  return `
body {
  --chrome-top: ${top};
  --chrome-bottom: ${bottom};
  --chrome-ink: #f4f2ff;                    /* icônes + chiffres du bandeau */
  --chrome-mu: rgba(244,242,255,.60);       /* libellés d'onglets au repos */
  --chrome-bo: rgba(255,255,255,.12);       /* filets haut/bas */
  --chrome-btn: rgba(255,255,255,.08);      /* fond des boutons icône */
  --chrome-a: var(--a-lt, var(--a));        /* onglet actif : l'accent CLAIR passe sur fond nuit */
}`;
}
