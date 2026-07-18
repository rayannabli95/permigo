// ═══════════════════════════════════════════════════════════════
// Murs d'accès CLIENT — rejoués à CHAQUE navigation, pas seulement au boot.
//
// Sans ça, un mineur en attente de consentement parental ou un élève jamais
// passé par l'onboarding pouvait atteindre n'importe quelle page en tapant un
// hash dans la barre d'URL (le mur n'était vérifié que dans boot()).
//
// NB : c'est un garde-fou PRODUIT côté client (parcours d'accueil), PAS une
// frontière de sécurité — la vraie protection des données reste la RLS serveur.
// ═══════════════════════════════════════════════════════════════

/**
 * Renvoie une fonction de montage de page-mur si `me` doit être bloqué, sinon
 * null. La décision est synchrone et bon marché (aucun import tant qu'aucun mur
 * ne s'applique) → zéro surcoût pour un élève en règle ou un non-élève.
 *
 * @param {{role?: string, parental_consent_required?: boolean, parental_consent_given_at?: string|null, first_value_action_at?: string|null}} me
 * @returns {((app: HTMLElement, me: any) => Promise<void>) | null}
 */
export function accessGateFor(me) {
  if (!me) return null;

  // Moniteur : essai gratuit terminé ET pas d'abonnement actif → mur
  // d'abonnement (aucun accès à l'espace moniteur tant que pas payé). Le statut
  // `me.moniteurAccess` est calculé au boot par le serveur (cf. main.js).
  if (me.role === "enseignant" && me.moniteurAccess?.gated) {
    return async (app, m) => {
      const { mount } = await import("@/pages/enseignant/abonnement-requis.js");
      await mount(app, m);
    };
  }

  if (me.role !== "eleve") return null;

  // Mineur (<15 ans) en attente du consentement parental → aucun accès.
  if (me.parental_consent_required && !me.parental_consent_given_at) {
    return async (app, m) => {
      const { mountConsentBlocked } =
        await import("@/pages/eleve/consent-blocked.js");
      mountConsentBlocked(app, m);
    };
  }

  // Élève SOLO (pas de code moniteur) sans Pass payé → mur de paiement. Après
  // le consentement parental (légal d'abord), avant l'onboarding : on paie à la
  // création. Les élèves rattachés / grandfathered / avec Pass ne sont pas gatés
  // (statut serveur `me.eleveAccess`, cf. main.js).
  if (me.eleveAccess?.gated) {
    return async (app, m) => {
      const { mount } = await import("@/pages/eleve/pass-requis.js");
      await mount(app, m);
    };
  }

  // Élève tout neuf jamais passé par le flow d'accueil → onboarding d'abord.
  if (!me.first_value_action_at && !safeGet("permigo_eleve_onboarding_done")) {
    return async (app) => {
      const { mount } = await import("@/pages/onboarding/index.js");
      await mount(app);
    };
  }

  return null;
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
