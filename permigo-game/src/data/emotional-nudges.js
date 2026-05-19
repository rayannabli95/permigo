/**
 * Templates émotionnels intelligents pour push + bannière in-app.
 * Le sélecteur côté edge function choisit selon le contexte utilisateur
 * (streak, comp count, jour, heure, dernière activité).
 *
 * Catégories :
 *  - palier_proche    : "à X comp du palier suivant"
 *  - record           : "personne n'a battu ton record"
 *  - validation_mono  : "ton moniteur t'a validé X"
 *  - streak_warm      : "garde la flamme"
 *  - retour           : "ça fait Xj, viens 5min"
 *  - examen_proche    : "plus que Xj avant ton examen"
 *  - micro_victoire   : "tu as fait X cette semaine"
 *
 * Chaque template :
 *   - title (max 50 chars, emoji autorisé en tête)
 *   - body (max 100 chars)
 *   - cta (label bouton bannière)
 *   - route (hash route si cta cliqué)
 *   - tone : 'warm' | 'urgent' | 'celebrate' | 'gentle'
 */

export const EMOTIONAL_NUDGES = [
  // ── palier_proche ──
  { id: 'palier_2', cat: 'palier_proche', tone: 'celebrate',
    title: '🔥 Tu y es presque !',
    body: 'Plus que {n} compétences validées avant l\'étape suivante de ton parcours',
    cta: 'Continuer', route: '#/parcours' },
  { id: 'palier_1', cat: 'palier_proche', tone: 'urgent',
    title: '⚡ Une seule compétence',
    body: 'Une seule compétence validée avant l\'étape suivante de ton parcours 💪',
    cta: 'Y aller', route: '#/parcours' },

  // ── streak_warm ──
  { id: 'streak_save', cat: 'streak_warm', tone: 'urgent',
    title: '🔥 Ta flamme s\'éteint',
    body: 'Plus que quelques heures pour garder ta série de {streak} jours',
    cta: 'Sauver ma série', route: '#/parcours' },
  { id: 'streak_milestone_close', cat: 'streak_warm', tone: 'celebrate',
    title: '🔥 Tu touches le jalon',
    body: 'Demain c\'est le palier {milestone} jours. Tu vas y arriver',
    cta: 'Garder la flamme', route: '#/parcours' },

  // ── record ──
  { id: 'record_week', cat: 'record', tone: 'celebrate',
    title: '👑 Personne ne fait mieux',
    body: 'Tu es l\'élève le plus actif cette semaine dans ton école',
    cta: 'Voir mon profil', route: '#/profil' },

  // ── validation_mono ──
  { id: 'validation_fresh', cat: 'validation_mono', tone: 'celebrate',
    title: '🎉 Validation !',
    body: '{teacher_name} vient de te valider "{competence_name}"',
    cta: 'Voir', route: '#/parcours' },

  // ── retour ──
  { id: 'come_back_3d', cat: 'retour', tone: 'gentle',
    title: '👋 Ton parcours t\'attend',
    body: 'Ça fait 3 jours. 5 minutes suffisent pour reprendre le rythme',
    cta: 'Reprendre', route: '#/parcours' },
  { id: 'come_back_7d', cat: 'retour', tone: 'warm',
    title: '💙 On pense à toi',
    body: 'Une semaine sans toi. Reviens quand tu veux, on est là',
    cta: 'Revenir', route: '#/accueil' },

  // ── examen_proche ──
  { id: 'exam_30d', cat: 'examen_proche', tone: 'celebrate',
    title: '🎯 J-30 examen',
    body: 'Plus qu\'un mois ! Tu en es à {acquired}/31. Continue comme ça',
    cta: 'Mon examen', route: '#/examen' },
  { id: 'exam_7d', cat: 'examen_proche', tone: 'urgent',
    title: '⏰ J-7 examen',
    body: 'Dernière semaine. Révise les compétences clés',
    cta: 'Réviser', route: '#/parcours' },

  // ── micro_victoire ──
  { id: 'week_summary', cat: 'micro_victoire', tone: 'celebrate',
    title: '✨ Belle semaine',
    body: 'Tu as validé {n_comp} compétences et joué {n_quiz} quiz. Bravo',
    cta: 'Voir mon bilan', route: '#/accueil' },
];

/**
 * Hydrate le template avec les variables du contexte utilisateur.
 * @example
 *   hydrate(template, { n: 2, target: 10 })
 *   → { title: '🔥 Tu y es presque !', body: 'Plus que 2 compétences pour atteindre le palier 10', ... }
 */
export function hydrate(template, vars = {}) {
  const replace = (str) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  return {
    ...template,
    title: replace(template.title),
    body: replace(template.body),
  };
}

export function findById(id) {
  return EMOTIONAL_NUDGES.find(n => n.id === id) || null;
}
