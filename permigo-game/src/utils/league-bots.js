// ═══════════════════════════════════════════════════════════════
// Ligue « amorcée » pour l'élève SOLO (inscrit sans moniteur) —
// profils fictifs façon Duolingo, le temps que la vraie base se remplisse.
//
// Pourquoi : un élève solo (profiles.auto_ecole_id NULL) n'a pas d'école →
// sa ligue « Mon école » est VIDE. Sans comparaison, la ligue ne motive pas.
// On bascule donc sa ligue en portée nationale (vrais élèves inclus) et on
// COMPLÈTE le classement avec des profils fictifs générés côté client.
//
// Règles de conception :
//  · 100 % client, AUCUNE écriture en base — zéro pollution de la prod.
//  · Déterministe : seedé par (élève, semaine) → mêmes « camarades », mêmes
//    scores à chaque visite ; les scores MONTENT au fil de la semaine
//    (un bot ne redescend jamais), reset naturel le lundi comme la saison.
//  · Cohorte STABLE par élève : mêmes identités d'une semaine à l'autre et
//    entre les deux ligues (rivalité récurrente, cohérence Conduite/Révision).
//  · Pseudos indiscernables des vrais : même format que genUsername()
//    (prénom slugifié + 4 chiffres), prénoms mixtes et d'origines variées.
//  · Auto-extinction : dès que ≥ REAL_ENOUGH vrais élèves actifs existent au
//    national, on ne complète plus — les vrais remplacent les fictifs.
//  · Jamais pour un élève rattaché à un moniteur (sa ligue école est vraie).
// ═══════════════════════════════════════════════════════════════

const WEEK_MS = 7 * 24 * 3600 * 1000;
// Ancre calendaire fixe : fait « vieillir » les bots de la ligue Conduite au
// fil des semaines réelles (leur score cumulé progresse d'une visite à l'autre).
const EPOCH = new Date(2025, 8, 1).getTime();

const FILL_TO = 22; // taille de ligue visée (vrais actifs + fictifs)
const REAL_ENOUGH = 12; // assez de vrais actifs → plus aucun fictif

// Prénoms déjà slugifiés (a-z, sans accent) — mixtes, origines variées,
// reflet des élèves d'auto-école en France.
const PRENOMS = [
  "lea",
  "hugo",
  "camille",
  "lucas",
  "emma",
  "jade",
  "louis",
  "chloe",
  "manon",
  "theo",
  "nathan",
  "clara",
  "maxime",
  "juliette",
  "antoine",
  "margaux",
  "romain",
  "elise",
  "bastien",
  "oceane",
  "enzo",
  "lina",
  "noah",
  "zoe",
  "gabriel",
  "ambre",
  "arthur",
  "louna",
  "paul",
  "eva",
  "yasmine",
  "mehdi",
  "amine",
  "sofia",
  "nadia",
  "karim",
  "leila",
  "walid",
  "samira",
  "bilal",
  "imene",
  "youssef",
  "rania",
  "hamza",
  "salma",
  "zakaria",
  "meriem",
  "kenza",
  "sabrina",
  "nassim",
  "aminata",
  "moussa",
  "fatoumata",
  "ibrahima",
  "awa",
  "mamadou",
  "aissatou",
  "ousmane",
  "mariama",
  "abdoulaye",
  "adama",
  "binta",
  "tidiane",
  "sekou",
  "fanta",
  "elif",
  "emre",
  "zeynep",
  "esra",
  "kaan",
  "linh",
  "thanh",
  "mai",
  "anh",
  "mei",
  "jun",
  "hana",
  "kim",
  "ines",
  "diego",
  "luana",
  "matteo",
  "carla",
  "tiago",
  "elena",
  "marco",
  "rafael",
  "laura",
  "milan",
  "anastasia",
  "ivan",
  "oksana",
  "stefan",
  "alina",
  "kassim",
  "anais",
  "dylan",
  "naomi",
  "warren",
  "shaina",
];

// Une minorité d'élèves personnalise son pseudo dans le profil : quelques
// pseudos « choisis » crédibles (charset username_format : [A-Za-z0-9_]{3,16}).
const PSEUDOS = [
  "futurpilote",
  "permis2026",
  "volant_dor",
  "boiteauto",
  "feuvert7",
  "enroute77",
  "petitbolide",
  "turbo_diesel",
  "creneau_queen",
  "retro_viseur",
  "lapilote",
  "roadtrip_93",
];

// ─── PRNG déterministe (FNV-1a → mulberry32) ─────────────────────
function _seed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function _rng(seedStr) {
  let a = _seed(seedStr);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Lundi 00:00 de la semaine courante (heure locale — app 100 % France).
function _weekStart(nowMs) {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** L'élève est-il « solo » (inscrit sans moniteur / auto-école) ? */
export function isSoloEleve(me) {
  return !!me && me.role === "eleve" && !me.auto_ecole_id;
}

// ─── Cohorte d'identités (stable par élève) ──────────────────────
function _cohort(userKey) {
  const rand = _rng("cohorte|" + userKey);
  const pool = PRENOMS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const pseudos = PSEUDOS.slice();
  const bots = [];
  for (let i = 0; i < 30; i++) {
    const prenom = pool[i];
    const custom = rand() < 0.16 && pseudos.length ? pseudos.pop() : null;
    bots.push({
      id: "bot-" + prenom,
      display_name: custom || prenom + String(1000 + Math.floor(rand() * 9000)),
      zeal: rand(), // assiduité générale (0 = dilettante, 1 = sérieux)
      gamma: 0.35 + rand() * 1.5, // <1 = marque tôt dans la semaine, >1 = tard
      joinOffset: rand() * 45, // semaines après EPOCH → ancienneté variable
      pace: 0.35 + rand() * 1.25, // compétences validées / semaine (Conduite)
      plateau: 2 + Math.floor(Math.pow(rand(), 1.2) * 28), // où il stagne
    });
  }
  return bots;
}

// ─── Scores ──────────────────────────────────────────────────────
// Révision = saison hebdo (/50). Objectif de la semaine tiré au sort
// (peu de gros scores), atteint progressivement → un bot MONTE, jamais
// ne redescend, et le lundi tout repart de zéro comme pour les vrais.
function _revisionScore(bot, userKey, nowMs) {
  const ws = _weekStart(nowMs);
  const rand = _rng(["rev", userKey, bot.id, ws].join("|"));
  if (rand() > 0.45 + bot.zeal * 0.45) return 0; // semaine sans réviser
  const grinder = rand() < 0.12;
  const target = grinder
    ? 22 + Math.floor(rand() * 16)
    : 1 + Math.floor(Math.pow(rand(), 1.8) * 20);
  const frac = Math.min(1, Math.max(0, (nowMs - ws) / WEEK_MS));
  return Math.min(48, Math.round(target * Math.pow(frac, bot.gamma)));
}

// Conduite = cumul à vie (/31). Chaque bot a une date de début et un rythme ;
// son score grandit avec les semaines réelles puis stagne à son plateau
// (pause, abandon…). Personne à 31 : un lauréat sortirait du classement.
function _conduiteScore(bot, nowMs) {
  const activeWeeks = Math.max(0, (nowMs - EPOCH) / WEEK_MS - bot.joinOffset);
  return Math.min(bot.plateau, Math.floor(bot.pace * activeWeeks), 29);
}

/**
 * Complète un classement avec des profils fictifs (élève solo uniquement —
 * l'appelant vérifie isSoloEleve). Ne touche pas aux vrais scores : les
 * lignes réelles sont conservées, seuls les rangs sont recalculés.
 * @param {Array} rows lignes RPC { rang, display_name, score, is_me, avatar }
 * @param {{ligue: 'conduite'|'revision', userKey: string, now?: number}} opts
 */
export function blendLeagueRows(rows, { ligue, userKey, now = Date.now() }) {
  const arr = (Array.isArray(rows) ? rows : []).map((r) => ({ ...r }));
  const realActive = arr.filter((r) => (r.score ?? 0) > 0);
  if (realActive.length >= REAL_ENOUGH) return arr;

  const bots = _cohort(userKey)
    .map((b) => ({
      rang: 0,
      display_name: b.display_name,
      score:
        ligue === "revision"
          ? _revisionScore(b, userKey, now)
          : _conduiteScore(b, now),
      is_me: false,
      avatar: null,
      bot: true,
    }))
    .filter((r) => r.score > 0)
    .slice(0, Math.max(0, FILL_TO - realActive.length));

  const merged = arr.concat(bots);
  // Même sémantique que row_number() côté SQL — à égalité, l'élève passe
  // devant un fictif (petit coup de pouce, jamais l'inverse).
  merged.sort(
    (a, b) =>
      (b.score ?? 0) - (a.score ?? 0) ||
      (a.is_me ? -1 : 0) ||
      (b.is_me ? 1 : 0) ||
      String(a.display_name).localeCompare(String(b.display_name)),
  );
  merged.forEach((r, i) => {
    r.rang = i + 1;
  });
  return merged;
}
