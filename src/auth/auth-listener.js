/**
 * Listener sur les changements d'auth Supabase.
 * Gère :
 *  - SIGNED_OUT → reset CUR_USER + redirect login
 *  - TOKEN_REFRESHED → rien (supabase-js gère)
 *  - SIGNED_IN externe (autre onglet) → réhydrate profil
 *
 * Corrige le BUG-05 du rapport QA v6.9.
 */

import { setCurUser } from './cur-user.js';

export function setupAuthListener(sb) {
  sb.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        setCurUser(null);
        // Le router détecte CUR_USER=null et redirige
        window.dispatchEvent(new CustomEvent('auth:signedout'));
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await sb
          .from('profiles')
          .select('id, role, nom, email, avatar_url')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        if (profile) {
          setCurUser({ ...profile, email: profile.email || session.user.email });
          window.dispatchEvent(new CustomEvent('auth:signedin', { detail: profile }));
        }
      }
    } catch (e) {
      console.warn('[auth-listener]', e);
    }
  });
}
