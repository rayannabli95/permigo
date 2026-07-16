/**
 * Listener sur les changements d'auth Supabase.
 *
 * Branché dans main.js APRÈS le boot (cf. note dans auth.js). Gère les
 * changements de session qui surviennent PENDANT que l'app est ouverte —
 * typiquement quand on jongle entre comptes dans plusieurs onglets (la session
 * Supabase est partagée via le storage, mais CUR_USER ne l'était pas) :
 *
 *  - SIGNED_OUT (ou session perdue)         → on repart propre sur la racine
 *  - SIGNED_IN / USER_UPDATED avec un AUTRE
 *    compte que celui affiché               → reload (rôle/nav/route cohérents)
 *  - TOKEN_REFRESHED / même compte          → rien (supabase-js gère)
 *  - PASSWORD_RECOVERY                       → route vers « nouveau mot de passe »
 *
 * Pourquoi un reload plutôt qu'un re-render in-place : changer de compte change
 * le rôle, donc le chrome (header + nav), le routing ET le contenu. Un boot
 * complet garantit un état cohérent — pas de demi-rendu (accueil moniteur qui
 * garde du contenu élève, page figée…), qui était le bug de fond.
 *
 * ⚠️ On ne fait AUCUN appel Supabase (`await sb.*`) dans le callback : c'est le
 * deadlock connu de supabase-js. Le boot qui suit le reload (re)charge le profil.
 */

import { setCurUser, getCurUser } from "./cur-user.js";

function hardReset(toRoot) {
  // setTimeout 0 : laisse supabase-js finir d'écrire la session avant le reload.
  setTimeout(() => {
    try {
      window.location.href = toRoot
        ? window.location.origin + "/"
        : window.location.href;
      if (!toRoot) window.location.reload();
    } catch {
      /* environnement sans window — no-op */
    }
  }, 0);
}

export function setupAuthListener(sb) {
  if (!sb) return;

  // Dernière identité auth connue. Seedée par INITIAL_SESSION (émis à
  // l'enregistrement du listener). On ne déclenche un reload que si elle était
  // déjà connue (non-null) → un vrai changement de compte, pas le login initial.
  let knownUid = null;

  sb.auth.onAuthStateChange((event, session) => {
    try {
      const uid = session?.user?.id || null;

      // État initial : on mémorise sans rien faire (le boot a déjà tout monté).
      if (event === "INITIAL_SESSION") {
        knownUid = uid;
        return;
      }

      // Mot de passe oublié : router vers l'écran dédié (le boot/route gère le rendu).
      if (event === "PASSWORD_RECOVERY") {
        if (!location.hash.startsWith("#/nouveau-mdp"))
          location.hash = "#/nouveau-mdp";
        return;
      }

      // Déconnexion (y compris depuis un autre onglet).
      if (event === "SIGNED_OUT" || !session) {
        const wasLogged = !!knownUid;
        knownUid = null;
        setCurUser(null);
        // Si on était connecté, on évite de laisser une page de rôle figée.
        // Sur une page PUBLIQUE (inscription, pass…), on recharge SUR PLACE :
        // renvoyer à la racine cassait le « Se déconnecter pour créer un
        // compte » des circuits d'inscription (le hash était perdu).
        if (wasLogged) {
          const publicPage =
            /^#\/(rejoindre|creer-compte|signup|pass|ecole|avis-depart|login)/.test(
              location.hash || "",
            );
          hardReset(!publicPage);
        }
        return;
      }

      // Rafraîchissement de token : même compte, rien à faire.
      if (event === "TOKEN_REFRESHED") {
        knownUid = uid;
        return;
      }

      // Connexion / mise à jour (SIGNED_IN, USER_UPDATED).
      // Changement de compte alors qu'un autre était affiché → reboot propre.
      // Login initial (knownUid null) → on laisse login.js gérer la navigation.
      const switchedAccount = knownUid && uid && uid !== knownUid;
      const sameUserStale =
        uid &&
        getCurUser() &&
        getCurUser().auth_id &&
        getCurUser().auth_id !== uid;
      knownUid = uid;
      if (switchedAccount || sameUserStale) hardReset(false);
    } catch (e) {
      console.warn("[auth-listener]", e);
    }
  });
}
