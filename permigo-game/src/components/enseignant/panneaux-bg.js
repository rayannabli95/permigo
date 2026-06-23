// ═══════════════════════════════════════════════════════════════
// Fond « panneaux routiers » — couche décorative réutilisable (enseignant).
//
// Remplace les images de fond photo des heros par des panneaux de
// signalisation semés (les SVG PD déjà dans /public/signs/).
// Reprend l'esprit du fond filigrane du parcours élève, mais à la
// signalétique routière → on-brand auto-école, énergie « arcade ».
//
//   panneauxLayer()              → couche curatée pour un hero
//   panneauxLayer({ variant })   → 'hero' (dense, animé) | 'section' (discret)
//
// Aucune donnée user → pas d'esc() nécessaire (chaînes statiques).
// ═══════════════════════════════════════════════════════════════

const SIGN = (name) => `/signs/${name}.svg`;

// Compositions curatées (positions fixes = rendu propre, pas de fouillis).
// Chaque entrée : [fichier, top%, left%, taille px, opacité, rotation deg, delay s]
const LAYOUTS = {
  hero: [
    ["stop", 8, 78, 72, 0.18, -8, 0],
    ["route-prioritaire", 54, 86, 56, 0.14, 10, 1.2],
    ["danger-feux-tricolores", 60, 6, 64, 0.15, -6, 0.6],
    ["sens-interdit", 12, 12, 46, 0.13, 12, 1.8],
    ["carrefour-giratoire", 30, 48, 40, 0.1, 0, 2.4],
    ["priorite-a-droite", 80, 40, 44, 0.12, -10, 1.5],
  ],
  section: [
    ["danger-passage-pietons", 18, 84, 56, 0.06, 8, 0],
    ["cedez-le-passage", 64, 8, 52, 0.06, -8, 0],
    ["depassement-interdit", 40, 50, 40, 0.05, 0, 0],
  ],
};

/**
 * Couche de panneaux semés à poser dans un conteneur `position:relative`.
 * @param {{ variant?: 'hero'|'section', signs?: Array }} [opts]
 * @returns {string} HTML de la couche `.ens-panneaux`
 */
export function panneauxLayer({ variant = "hero", signs } = {}) {
  const items = signs || LAYOUTS[variant] || LAYOUTS.hero;
  const dur = variant === "hero" ? 9 : 0;
  const cells = items
    .map(([name, top, left, size, op, rot, delay]) => {
      const anim =
        dur > 0
          ? `--dur:${(dur + (delay || 0)).toFixed(1)}s;--delay:${delay || 0}s;`
          : "";
      return `<img class="ens-panneaux__sign" src="${SIGN(name)}" alt="" aria-hidden="true" loading="lazy"
        style="top:${top}%;left:${left}%;--s:${size}px;--o:${op};--rot:${rot}deg;${anim}" />`;
    })
    .join("");
  return `<div class="ens-panneaux" aria-hidden="true">${cells}</div>`;
}

/**
 * Hero arcade complet « clé en main » : panneaux en fond + kicker/titre/sous-titre.
 * @param {{ kicker?: string, title: string, sub?: string, extra?: string }} o
 *        (les textes doivent être DÉJÀ échappés par l'appelant si dynamiques)
 * @returns {string}
 */
export function ensHero({ kicker = "", title = "", sub = "", extra = "" }) {
  return `<header class="ens-hero">
    ${panneauxLayer({ variant: "hero" })}
    ${kicker ? `<p class="ens-hero__kicker">${kicker}</p>` : ""}
    <h1 class="ens-hero__title">${title}</h1>
    ${sub ? `<p class="ens-hero__sub">${sub}</p>` : ""}
    ${extra}
  </header>`;
}
