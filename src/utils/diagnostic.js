/**
 * Diagnostic & helpers pédagogiques pour les moniteurs.
 *
 * - `diagnostiqueFaiblesses(remcEntries)` : détecte les compétences à travailler
 * - `suggestionsComp(remcEntries, max)` : top N compétences prioritaires pour la prochaine leçon
 * - `PLANS_LECON` : 6 thèmes pré-définis avec leurs sous-comp mappées
 * - `compsForPlan(planId)` : retourne les comp_ids du plan
 *
 * Utilisé dans : planning.js (modal create), fiche-eleve.js (card diagnostic).
 */

import { REMC } from '@/data/remc.js';

const DAYS_BLOCKED = 14; // jours depuis lv='p' = bloquée

/**
 * Analyse les remc_entries pour identifier les comp à retravailler.
 * @param {Array} entries — remc_entries [{ comp_id, lv, validated_at }]
 * @returns { blocked: [...], toReview: [...], inProgress: [...] }
 */
export function diagnostiqueFaiblesses(entries = []) {
  const now = Date.now();
  const blockedThresholdMs = DAYS_BLOCKED * 86400000;

  const blocked = [];   // 'p' depuis trop longtemps
  const toReview = [];  // 'r' = à retravailler
  const inProgress = []; // 'p' récente

  for (const e of entries) {
    if (e.lv === 'r') {
      toReview.push({
        compId: e.comp_id,
        validatedAt: e.validated_at,
        comp: findComp(e.comp_id),
      });
    } else if (e.lv === 'p') {
      const validatedTime = e.validated_at ? new Date(e.validated_at).getTime() : 0;
      const age = now - validatedTime;
      if (age > blockedThresholdMs) {
        blocked.push({
          compId: e.comp_id,
          validatedAt: e.validated_at,
          daysAgo: Math.round(age / 86400000),
          comp: findComp(e.comp_id),
        });
      } else {
        inProgress.push({
          compId: e.comp_id,
          validatedAt: e.validated_at,
          daysAgo: Math.round(age / 86400000),
          comp: findComp(e.comp_id),
        });
      }
    }
  }

  return { blocked, toReview, inProgress };
}

/** Top N comp à prioriser sur la prochaine leçon (revoir + bloquées + non commencées du monde actuel). */
export function suggestionsComp(entries = [], max = 5) {
  const diag = diagnostiqueFaiblesses(entries);
  const acquis = new Set(entries.filter(e => e.lv === 'v').map(e => e.comp_id));

  // Priorité : 1) toReview, 2) blocked, 3) inProgress, 4) prochaines comp non-évaluées du monde actuel
  const seen = new Set();
  const out = [];

  const push = (compId, reason) => {
    if (seen.has(compId)) return;
    const c = findComp(compId);
    if (!c) return;
    out.push({ compId, reason, ...c });
    seen.add(compId);
  };

  diag.toReview.forEach(x => push(x.compId, 'À retravailler'));
  diag.blocked.forEach(x => push(x.compId, `Bloquée (${x.daysAgo}j)`));
  diag.inProgress.forEach(x => push(x.compId, 'En cours'));

  // Compléter avec les comp non-évaluées du monde actif (1er monde où il reste des comp à faire)
  for (const cat of REMC) {
    const remaining = cat.subs.filter(s => !acquis.has(s.c) && !seen.has(s.c));
    for (const s of remaining) {
      if (out.length >= max) break;
      push(s.c, 'Prochaine étape');
    }
    if (out.length >= max) break;
  }

  return out.slice(0, max);
}

function findComp(compId) {
  for (const cat of REMC) {
    const sub = cat.subs.find(s => s.c === compId);
    if (sub) return { c: sub.c, n: sub.n, cat: cat.id, catName: cat.name, ico: cat.ico };
  }
  return null;
}

// ─── PLANS DE LEÇON pré-définis ───
// Chaque plan a un nom, une icône, une description courte, et une liste de comp_ids cibles
export const PLANS_LECON = [
  {
    id: 'manoeuvres',
    name: 'Manœuvres',
    ico: '🔄',
    desc: 'Créneau, demi-tour, marche arrière',
    compIds: ['1.08', '1.09'], // adjuster selon nomenclature REMC
  },
  {
    id: 'urbain',
    name: 'Conduite urbaine',
    ico: '🏙️',
    desc: 'Intersections, priorités, piétons',
    compIds: ['2.02', '2.03', '2.04', '2.05'],
  },
  {
    id: 'autoroute',
    name: 'Périph & autoroute',
    ico: '🛣️',
    desc: 'Insertion, vitesse, dépassement',
    compIds: ['3.01', '3.02', '3.03'],
  },
  {
    id: 'nuit',
    name: 'Conduite de nuit',
    ico: '🌙',
    desc: 'Visibilité réduite, éclairages',
    compIds: ['3.05', '3.06'],
  },
  {
    id: 'meteo',
    name: 'Conditions météo',
    ico: '🌧️',
    desc: 'Pluie, brouillard, glissant',
    compIds: ['3.07', '3.08'],
  },
  {
    id: 'examen',
    name: 'Examen blanc',
    ico: '🏁',
    desc: 'Simulation complète avec scoring',
    compIds: ['4.01', '4.02', '4.03', '4.04'],
  },
];

export function getPlanLecon(planId) {
  return PLANS_LECON.find(p => p.id === planId) || null;
}

/** Renvoie les sub objects (n, c, cat) pour les comp_ids d'un plan. */
export function compsForPlan(planId) {
  const plan = getPlanLecon(planId);
  if (!plan) return [];
  return plan.compIds.map(c => findComp(c)).filter(Boolean);
}

/** Calcule le statut du forfait d'un élève. Renvoie { used, total, pct, status: 'ok'|'warning'|'critical' } */
export function statutForfait({ heuresFaites = 0, forfaitH = 20 } = {}) {
  const pct = Math.min(100, Math.round((heuresFaites / forfaitH) * 100));
  let status = 'ok';
  if (pct >= 90) status = 'critical';
  else if (pct >= 75) status = 'warning';
  return { used: heuresFaites, total: forfaitH, restantes: Math.max(0, forfaitH - heuresFaites), pct, status };
}
