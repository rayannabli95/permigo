// ═══════════════════════════════════════════════════════════════
// Registre central des données locales liées à UN COMPTE.
//
// Pourquoi ce fichier existe : avant, chaque écran gardait sa propre clé
// localStorage (jalon déjà vu, quota du jour, thème de fiche coché...) sans
// jamais la vider. Résultat : un nouveau compte créé sur le même téléphone
// héritait de la série, des gemmes, des quotas et de tous les jalons "déjà
// vu" du compte précédent (remonté par Rayan, 07/08/2026 — audit complet du
// 07/08/2026 : 9 clés purgées sur ~25 concernées).
//
// RÈGLE pour la suite : toute NOUVELLE clé localStorage qui dépend d'UN
// COMPTE précis (progression, quota, préférence d'achat, jalon "déjà vu"...)
// s'ajoute à `ACCOUNT_SCOPED_KEYS` (ou `ACCOUNT_SCOPED_PREFIXES` si la clé
// contient une date/un id variable). Une clé qui décrit l'APPAREIL plutôt
// que le compte (langue, thème clair/sombre, son on/off, consentement
// cookies) n'a rien à faire ici — elle doit survivre au changement de
// compte.
//
// Appelée depuis un seul endroit : `clearLocalGameState()` dans
// `game-state.js`, elle-même branchée sur logout() et sur chaque signUp().
// ═══════════════════════════════════════════════════════════════

export const ACCOUNT_SCOPED_KEYS = [
  // game-state.js — série, gemmes, coffres, inventaire, équipement
  "pg-streak-date",
  "pg-streak-count",
  "pg-chests-opened",
  "pg-chests-db-v1",
  "pg-gemmes",
  "pg-owned",
  "pg-equipped",
  "pg-equipped-assets",
  "pg-last-user",
  // weak-points.js — thèmes ratés en quiz (priorités, ronds-points...)
  "permigo_weak_points_v1",
  // daily-quiz.js — 2e système de série, indépendant de game-state.js
  "pg-daily-quiz-done",
  "pg-daily-streak",
  "pg-daily-streak-last",
  // revision-conduite.js — fiches déjà révisées / déjà lues / gestes cochés
  "rvc_revised_v1",
  "rvc_read_v1",
  "rvc_gestes_v1",
  // free-tier.js — quotas quotidiens du mode découverte (non payeur)
  "pg_freetier_v1",
  // roue.js — date du dernier tour gratuit (mode aperçu de repli)
  "pg-roue-free-last",
  // level-up.js / world-unlock-cinematic.js / weekly-replay.js / streak-launch.js
  // — jalons et cinématiques "déjà montrés"
  "pg-level-seen",
  "pg-unlock-seen",
  "pg-replay-week",
  "pg-streak-launch-date",
  // collection.js — cartes déjà regardées (badge « Nouveau »)
  "pg-cartes-seen",
  // permis-card.js / celebrate-screen.js / competence-celebration.js
  // — paliers et célébrations déjà notifiés
  "permigo:permis_bg_milestone_seen",
  "permigo:celebrate_seen",
  "permigo:celebrated_comps_v1",
  // boutique.js — objectif cosmétique épinglé (préférence d'achat perso)
  "pg-boutique-objectif",
  // accueil.js — onboarding, tour guidé, thème de prépa, dernière visite
  "pg-tour-eleve-v1",
  "pg-home-seen-v1",
  "pg-prep-theme",
  "pg-prep-cycle",
  "pg-last-visit",
  "permigo-last-visit", // doublon historique de la ligne ci-dessus, deux formats coexistent
  "pg-afford-hint",
  // quiz.js — récompense du tout premier quiz réussi
  "pg-first-quiz-reward-v1",
  // web-push.js — opt-in/opt-out des notifs + a-déjà-validé-une-fois
  "permigo_push_asked",
  "permigo_push_optout",
  "permigo_has_validated",
  // onboarding/index.js — flag maître : si un nouveau compte en hérite, il
  // SAUTE tout l'onboarding sans jamais l'avoir vu (trouvé à l'audit du
  // 08/08/2026, pas repéré au premier passage).
  "permigo_eleve_onboarding_done",
  // enseignant/aujourdhui.js — tour guidé moniteur déjà vu
  "pg-tour-moniteur-v1",
  // duel-intermission.js — messages d'entracte déjà tirés (dédoublonnage)
  "permigo.duel.entractes",
];

// Clés dont le NOM varie (date, id...) : on ne peut pas les lister une par
// une, on retire tout ce qui commence par ce préfixe.
export const ACCOUNT_SCOPED_PREFIXES = [
  // web-push.js — anti-spam "1 notif par jour", une clé par date calendaire
  "permigo_push_last_",
  // coach-hint.js — un texte pédagogique "vu 1 fois" par identifiant de hint
  "pg-hint-",
];

/** Vide tout le cache local appartenant à un compte. Ne touche pas aux
 * réglages d'appareil (langue, thème, son). */
export function purgeAccountLocalCache() {
  ACCOUNT_SCOPED_KEYS.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && ACCOUNT_SCOPED_PREFIXES.some((p) => k.startsWith(p))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
