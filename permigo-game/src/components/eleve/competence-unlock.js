// ═══════════════════════════════════════════════════════════════
// Competence Unlock — écran plein écran "Nouvelle compétence acquise" (élève)
//
// Wrapper de rôle au-dessus du moteur générique
// @/components/common/unlock-screen.js. Résout le nom de la compétence et
// le monde/couleur de la catégorie (REMC ↔ WORLDS).
//
// Usage :
//   import { showCompetenceUnlock } from '@/components/eleve/competence-unlock.js';
//   await showCompetenceUnlock({ competenceCode: 'C2f', scorePct: 100, validatedCount: 12 });
// ═══════════════════════════════════════════════════════════════
import { findSubComp, findCategory } from "@/data/remc.js";
import { WORLDS } from "@/data/worlds.js";
import { track } from "@/services/analytics.js";
import { showUnlockScreen } from "@/components/common/unlock-screen.js";

// Catégorie REMC → monde (couleur + emoji). C1→1, C2→2, …
function worldForCategory(catId) {
  const n = parseInt(String(catId || "").replace(/\D/g, ""), 10);
  return WORLDS.find((w) => w.id === n) || null;
}

/**
 * Affiche l'écran plein écran "Nouvelle compétence acquise".
 * @param {Object} opts
 * @param {string}  [opts.competenceCode]  ex: 'C2f' (résout nom + monde)
 * @param {string}  [opts.competenceName]  override du nom affiché
 * @param {number}  [opts.scorePct]        score du quiz (0-100)
 * @param {number}  [opts.validatedCount]  total acquis APRÈS celle-ci
 * @param {number}  [opts.totalComps=31]
 * @param {string}  [opts.ctaLabel='Continuer']
 * @param {string}  [opts.source]          analytics : 'quiz' | 'parcours'
 * @param {Function}[opts.onCta]
 * @param {Function}[opts.onClose]
 * @returns {Promise<'cta'|'close'>}
 */
export function showCompetenceUnlock(opts = {}) {
  const {
    competenceCode,
    competenceName,
    scorePct,
    validatedCount,
    totalComps = 31,
    ctaLabel = "Continuer",
    source = null,
    onCta,
    onClose,
  } = opts;

  const sub = competenceCode ? findSubComp(competenceCode) : null;
  const cat = competenceCode ? findCategory(competenceCode) : null;
  const world = worldForCategory(cat?.id || competenceCode);
  const accent = world?.couleur || "var(--gr)";
  const emoji = world?.emoji || "🎯";
  const name = competenceName || sub?.n || competenceCode || "Compétence";
  const catLabel = [cat?.id, world?.nom].filter(Boolean).join(" · ");

  try {
    track("eleve.competence_unlock_shown", {
      competence_id: competenceCode || null,
      score_pct: scorePct ?? null,
      source,
    });
  } catch {
    /* best-effort */
  }

  const stats = [];
  if (typeof scorePct === "number") {
    stats.push({ value: scorePct, suffix: "%", label: "Score" });
  }
  if (typeof validatedCount === "number") {
    stats.push({
      countTo: validatedCount,
      suffix: `/${totalComps}`,
      label: "Acquises",
    });
  }
  if (catLabel) {
    stats.push({
      value: cat?.id || "",
      label: world?.nom || "Compétence",
      small: true,
    });
  }

  const progress =
    typeof validatedCount === "number"
      ? {
          pct: (validatedCount / totalComps) * 100,
          leftLabel: "Permis virtuel",
          rightLabel: `${Math.round((validatedCount / totalComps) * 100)}%`,
        }
      : null;

  return showUnlockScreen({
    accent,
    emblem: emoji,
    kicker: "Compétence acquise",
    kickerIcon: "✓",
    title: name,
    subtitle: catLabel,
    stats,
    progress,
    ctaLabel,
    ariaLabel: `Compétence acquise : ${name}`,
    onCta,
    onClose,
  });
}
