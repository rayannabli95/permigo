// ═══════════════════════════════════════════════════════════════
// Daily Action — détermine LA bonne action du jour pour l'élève
// Priorité : consolidation > quiz post-val jamais fait > révision > idle
// Retourne un objet { type, label, cta, color, competenceId? }
// ═══════════════════════════════════════════════════════════════
import { sb } from '@/auth/auth.js';
import { track } from '@/services/analytics.js';

export const DA_TYPES = {
  CONSOLIDATION:  'consolidation',
  POST_VAL:       'post_validation',
  REVISION:       'revision',
  IDLE:           'idle',
};

const DA_CONFIG = {
  [DA_TYPES.CONSOLIDATION]: {
    label:  'Quiz de consolidation',
    cta:    'Je consolide maintenant',
    color:  '#8b5cf6',
    icon:   '🧠',
    desc:   'Un apprentissage en attente de renforcement.',
  },
  [DA_TYPES.POST_VAL]: {
    label:  'Valider une compétence',
    cta:    'Faire le quiz',
    color:  '#6366f1',
    icon:   '⚡',
    desc:   'Ton enseignant a validé une compétence — prouve-le !',
  },
  [DA_TYPES.REVISION]: {
    label:  'Révision recommandée',
    cta:    'Réviser maintenant',
    color:  '#06b6d4',
    icon:   '🔄',
    desc:   'Cette compétence n\'a pas été revue depuis 7 jours.',
  },
  [DA_TYPES.IDLE]: {
    label:  'Tout est à jour !',
    cta:    'Explorer mon parcours',
    color:  '#10b981',
    icon:   '✅',
    desc:   'Super travail — aucune action en attente aujourd\'hui.',
  },
};

/**
 * Calcule la Daily Action pour l'élève courant.
 * @param {string} userId - profiles.id de l'élève
 * @returns {Promise<{ type, label, cta, color, icon, desc, competenceId?, notifId? }>}
 */
export async function getDailyAction(userId) {
  try {
    // Priorité 1 : quiz consolidation en attente (notif non lue)
    const { data: consolidNotifs } = await sb
      .from('notifications')
      .select('id, data')
      .eq('user_id', userId)
      .eq('type', 'consolidation_quiz')
      .eq('read', false)
      .limit(1);

    if (consolidNotifs?.length) {
      const notif = consolidNotifs[0];
      track('daily_action.shown', { type: DA_TYPES.CONSOLIDATION });
      return {
        ...DA_CONFIG[DA_TYPES.CONSOLIDATION],
        type: DA_TYPES.CONSOLIDATION,
        competenceId: notif.data?.competence_id,
        notifId: notif.id,
      };
    }

    // Priorité 2 : notif post-validation non lue (quiz jamais fait)
    const { data: postValNotifs } = await sb
      .from('notifications')
      .select('id, data')
      .eq('user_id', userId)
      .eq('type', 'post_validation_quiz')
      .eq('read', false)
      .limit(1);

    if (postValNotifs?.length) {
      const notif = postValNotifs[0];
      track('daily_action.shown', { type: DA_TYPES.POST_VAL });
      return {
        ...DA_CONFIG[DA_TYPES.POST_VAL],
        type: DA_TYPES.POST_VAL,
        competenceId: notif.data?.competence_id,
        notifId: notif.id,
      };
    }

    // Priorité 3 : compétence validée mais pas révisée depuis 7j
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldValidations } = await sb
      .from('validations')
      .select('competence_id, validated_at')
      .eq('eleve_id', userId)
      .lte('validated_at', sevenDaysAgo)
      .order('validated_at', { ascending: true })
      .limit(1);

    if (oldValidations?.length) {
      track('daily_action.shown', { type: DA_TYPES.REVISION });
      return {
        ...DA_CONFIG[DA_TYPES.REVISION],
        type: DA_TYPES.REVISION,
        competenceId: oldValidations[0].competence_id,
      };
    }

    // Priorité 4 : idle
    track('daily_action.shown', { type: DA_TYPES.IDLE });
    return {
      ...DA_CONFIG[DA_TYPES.IDLE],
      type: DA_TYPES.IDLE,
    };

  } catch (e) {
    console.error('[daily-action]', e);
    return { ...DA_CONFIG[DA_TYPES.IDLE], type: DA_TYPES.IDLE };
  }
}

/**
 * Marque la Daily Action comme complétée (tracking).
 * @param {string} type - DA_TYPES.*
 */
export function completeDailyAction(type) {
  track('daily_action.completed', { type });
}
