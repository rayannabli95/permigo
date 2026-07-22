// ═══════════════════════════════════════════════════════════════
// Competence Celebration — pilote l'écran plein écran "Compétence
// acquise" À PARTIR DE L'ÉTAT RÉEL DES VALIDATIONS DU PARCOURS.
//
// Pourquoi : une compétence devient `acquis` par DEUX chemins —
//   1. l'élève réussit son quiz post-validation  (géré inline dans quiz.js)
//   2. le moniteur valide en leçon → `acquis` direct, SANS quiz côté élève
// Le cas (2) n'a aucun moment "live" côté élève : on le célèbre donc quand
// l'élève ouvre son parcours, en détectant les acquis pas encore célébrés.
//
// Idempotent via un ledger localStorage (1 célébration / compétence / device).
// Lecture seule : ce module NE modifie JAMAIS le statut d'une validation.
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getCurUser } from "@/auth/cur-user.js";

const LEDGER_KEY = "permigo:celebrated_comps_v1";
const TOTAL_COMPS = 31;

function readLedger() {
  if (typeof localStorage === "undefined") return new Set();
  const raw = localStorage.getItem(LEDGER_KEY);
  if (raw == null) return null; // jamais initialisé → premier passage
  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function writeLedger(set) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify([...set]));
  } catch {
    /* quota / mode privé — best-effort */
  }
}

/** Marque une compétence comme déjà célébrée (appelé par le chemin quiz). */
export function markCompetenceCelebrated(code) {
  if (!code) return;
  const set = readLedger() ?? new Set();
  set.add(code);
  writeLedger(set);
}

/** True si la compétence a déjà eu son écran de célébration sur ce device. */
export function hasCelebratedCompetence(code) {
  return !!readLedger()?.has(code);
}

/**
 * Détecte les compétences `acquis` jamais célébrées et lance l'écran plein
 * écran pour chacune (séquentiel, l'une après l'autre).
 *
 * @param {Object} [opts]
 * @param {Array}  [opts.validations]   rows déjà chargées { competence_id, statut, validated_at, score_cognitif } — sinon fetch
 * @param {number} [opts.maxScreens=3]  cap anti-fatigue si gros retard (les plus anciennes sont marquées vues sans écran)
 * @param {string} [opts.ctaLabel]
 * @returns {Promise<number>} nombre d'écrans réellement affichés
 */
export async function celebrateNewValidations({
  validations,
  maxScreens = 3,
  ctaLabel = "Continuer",
} = {}) {
  const me = getCurUser();
  if (!me?.id) return 0;

  let rows = validations;
  if (!rows) {
    try {
      const { data } = await sb
        .from("validations")
        .select("competence_id, statut, validated_at, score_cognitif")
        .eq("eleve_id", me.id)
        .eq("statut", "acquis");
      rows = data || [];
      // Validation autonome (élève solo, valider-seul.js) : table séparée de
      // `validations`, fusionnée pour que les paliers se déclenchent aussi
      // pour un compte sans moniteur. Même pattern que accueil.js.
      try {
        const { data: selfData } = await sb
          .from("self_validations")
          .select("competence_id, validated_at")
          .eq("eleve_id", me.id);
        rows = rows.concat(selfData || []);
      } catch {
        /* self_validations optionnel : célébration reste basée sur validations */
      }
    } catch {
      return 0;
    }
  }

  // acquis uniquement, dédupliqués par competence_id (on garde le 1er validated_at)
  const acquis = new Map();
  for (const v of rows || []) {
    if (v?.statut && v.statut !== "acquis") continue;
    const cid = v?.competence_id;
    if (!cid) continue;
    const prev = acquis.get(cid);
    const ts = v.validated_at ? new Date(v.validated_at).getTime() : Infinity;
    const prevTs = prev?.validated_at
      ? new Date(prev.validated_at).getTime()
      : Infinity;
    if (!prev || ts < prevTs) acquis.set(cid, v);
  }

  const ledger = readLedger();

  // Premier passage : on enregistre l'historique SANS célébrer
  // (évite un mur de pop-ups pour les comptes déjà avancés).
  if (ledger == null) {
    writeLedger(new Set(acquis.keys()));
    return 0;
  }

  const total = acquis.size;
  const fresh = [...acquis.values()]
    .filter((v) => !ledger.has(v.competence_id))
    .sort(
      (a, b) =>
        new Date(a.validated_at || 0).getTime() -
        new Date(b.validated_at || 0).getTime(),
    );

  if (!fresh.length) return 0;

  // Gros retard : on ne montre que les N plus récentes, le reste est marqué vu.
  const toCelebrate = fresh.slice(-maxScreens);
  const silent = fresh.slice(0, Math.max(0, fresh.length - maxScreens));

  const newLedger = new Set(ledger);
  for (const v of silent) newLedger.add(v.competence_id);
  writeLedger(newLedger);

  const { showCompetenceUnlock } =
    await import("@/components/eleve/competence-unlock.js");

  // Compteur courant : total - (à célébrer), incrémenté à chaque écran.
  let runningCount = total - toCelebrate.length;
  let shown = 0;

  for (const v of toCelebrate) {
    runningCount += 1;
    // Séquentiel volontaire : un écran à la fois, on attend la fermeture.
    // eslint-disable-next-line no-await-in-loop
    await showCompetenceUnlock({
      competenceCode: v.competence_id,
      scorePct:
        typeof v.score_cognitif === "number" ? v.score_cognitif : undefined,
      validatedCount: runningCount,
      totalComps: TOTAL_COMPS,
      ctaLabel,
      source: "parcours",
    });
    newLedger.add(v.competence_id);
    writeLedger(newLedger);
    shown += 1;
  }

  return shown;
}
