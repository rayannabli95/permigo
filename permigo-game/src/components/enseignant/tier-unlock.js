// ═══════════════════════════════════════════════════════════════
// Tier Unlock — écran plein écran "Palier atteint" (moniteur)
//
// Wrapper de rôle au-dessus du moteur générique
// @/components/common/unlock-screen.js. Même ADN visuel premium que l'écran
// élève, mais contenu = STATUT/palier du parcours-pro (validations cumulées),
// pas une compétence. Déclenché au franchissement d'un seuil MONITEUR_TIERS.
//
// Usage :
//   import { showTierUnlock } from '@/components/enseignant/tier-unlock.js';
//   await showTierUnlock({ tier, validationsAfter: 50 });
// ═══════════════════════════════════════════════════════════════
import { icon } from "@/utils/icons.js";
import { track } from "@/services/analytics.js";
import { getMoniteurState } from "@/data/moniteur-levels.js";
import { showUnlockScreen } from "@/components/common/unlock-screen.js";

const ACCENT = "var(--am)"; // or premium — ton "rang/médaille" pro

/**
 * Affiche l'écran plein écran de franchissement de palier moniteur.
 * @param {Object} opts
 * @param {{tier:number, threshold:number, title:string, unlock:{iconName:string,name:string}}} opts.tier
 * @param {number} opts.validationsAfter  total de validations cumulées (compteur affiché)
 * @param {string} [opts.ctaLabel='Voir mon parcours']
 * @param {Function}[opts.onCta]
 * @param {Function}[opts.onClose]
 * @returns {Promise<'cta'|'close'>}
 */
export function showTierUnlock(opts = {}) {
  const {
    tier,
    validationsAfter,
    ctaLabel = "Voir mon parcours",
    onCta,
    onClose,
  } = opts;
  if (!tier) return Promise.resolve("close");

  const count =
    typeof validationsAfter === "number" ? validationsAfter : tier.threshold;
  const state = getMoniteurState(count);
  const tierNum = tier.tier;
  const nextThreshold = state.nextTier?.threshold ?? null;

  try {
    track("moniteur.tier_unlock_shown", {
      tier: tierNum,
      threshold: tier.threshold,
      validations: count,
    });
  } catch {
    /* best-effort */
  }

  const emblemHtml = tier.unlock?.iconName
    ? icon(tier.unlock.iconName, { size: 46, color: "#fff" })
    : null;

  const stats = [
    { countTo: count, label: "Validations" },
    { value: `${tierNum}`, suffix: "/10", label: "Palier", small: true },
  ];

  const progress = nextThreshold
    ? {
        pct: state.pctToNextReward,
        leftLabel: "Prochain palier",
        rightLabel: `${count}/${nextThreshold}`,
      }
    : { pct: 100, leftLabel: "Palier max", rightLabel: "Référent" };

  const unlockName = tier.unlock?.name ? `Débloqué · ${tier.unlock.name}` : "";

  return showUnlockScreen({
    accent: ACCENT,
    emblem: "🏅",
    emblemHtml,
    kicker: "Palier atteint",
    kickerIcon: "◆",
    title: tier.title,
    subtitle: unlockName,
    stats,
    progress,
    ctaLabel,
    ariaLabel: `Palier atteint : ${tier.title}`,
    onCta,
    onClose,
  });
}
