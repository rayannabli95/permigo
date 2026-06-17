// ═══════════════════════════════════════════════════════════════
// Moniteur Tier Celebration — déclenche l'écran "Palier atteint" quand le
// nombre de validations cumulées du moniteur franchit un seuil MONITEUR_TIERS.
//
// « Comme sur son parcours » (parcours-pro) : jalons = validations cumulées.
// Idempotent via localStorage (ne re-célèbre jamais un palier déjà fêté).
// 1er passage = seed silencieux (pas de célébration rétroactive de l'historique).
//
// Lecture seule : ne modifie aucune donnée serveur.
// ═══════════════════════════════════════════════════════════════
import { MONITEUR_TIERS } from "@/data/moniteur-levels.js";

const LEDGER_KEY = "permigo:moniteur_tier_celebrated_v1";

/** Seuil de palier le plus haut atteint pour un count donné (0 si aucun). */
function currentThreshold(count) {
  let thr = 0;
  for (const t of MONITEUR_TIERS) {
    if (count >= t.threshold) thr = t.threshold;
    else break;
  }
  return thr;
}

/**
 * Vérifie si le moniteur vient de franchir un nouveau palier et, si oui,
 * affiche l'écran plein écran "Palier atteint".
 *
 * @param {number} afterCount  total de validations cumulées APRÈS la séance
 * @param {Object} [opts]
 * @param {string} [opts.ctaLabel]
 * @param {Function}[opts.onCta]
 * @returns {Promise<boolean>} true si un écran a été affiché
 */
export async function maybeCelebrateTier(afterCount, opts = {}) {
  if (typeof localStorage === "undefined" || typeof afterCount !== "number")
    return false;

  const count = Math.max(0, Math.floor(afterCount));
  const raw = localStorage.getItem(LEDGER_KEY);

  // 1er passage : on enregistre le palier courant SANS célébrer l'historique.
  if (raw == null) {
    localStorage.setItem(LEDGER_KEY, String(currentThreshold(count)));
    return false;
  }

  const lastCelebrated = parseInt(raw, 10) || 0;

  // Paliers nouvellement franchis (au-dessus du dernier fêté), trié croissant.
  const crossed = MONITEUR_TIERS.filter(
    (t) => t.threshold <= count && t.threshold > lastCelebrated,
  );
  if (!crossed.length) return false;

  // On ne fête que le palier le plus haut atteint (un écran, pas une rafale).
  const top = crossed[crossed.length - 1];
  localStorage.setItem(LEDGER_KEY, String(top.threshold));

  const { showTierUnlock } =
    await import("@/components/enseignant/tier-unlock.js");
  await showTierUnlock({
    tier: top,
    validationsAfter: count,
    ctaLabel: opts.ctaLabel,
    onCta: opts.onCta,
  });
  return true;
}
