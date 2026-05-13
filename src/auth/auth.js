/**
 * Authentication — wrapper Supabase.
 *
 * Conserve la couche Auth existante (Supabase) car déjà éprouvée et gratuite.
 * En dev local, Supabase tourne quand même via le cloud (l'auth est centralisée).
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { setCurUser } from './cur-user.js';

export const sb = env.SUPABASE_URL && env.SUPABASE_ANON_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'permigo-v7-auth',
      },
    })
  : null;

if (!sb) console.warn('[auth] Supabase non configuré — auth désactivée');

// NOTE : le listener auth est attaché manuellement APRÈS le boot
// (pour éviter le deadlock sur getSession au démarrage).

/**
 * Login email + password.
 * @returns {Promise<{ok: boolean, profile?: object, error?: string}>}
 */
export async function login(email, password) {
  if (!sb) return { ok: false, error: 'Supabase non configuré' };

  const cleanEmail = email.trim().toLowerCase();
  console.log('[auth] login() appelé pour', cleanEmail);

  const loginPromise = sb.auth.signInWithPassword({ email: cleanEmail, password });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Login timeout 10s — vérifie la console réseau')), 10000));

  let data, error;
  try {
    const res = await Promise.race([loginPromise, timeout]);
    data = res.data;
    error = res.error;
  } catch (e) {
    console.error('[auth] login timeout/erreur', e);
    return { ok: false, error: e.message };
  }

  if (error) return { ok: false, error: error.message };

  // Récupère le profil DB (role, nom, etc.)
  const { data: profile, error: pErr } = await sb
    .from('profiles')
    .select('id, role, nom, email, avatar_url')
    .eq('auth_id', data.user.id)
    .maybeSingle();

  if (pErr || !profile) {
    await sb.auth.signOut();
    return { ok: false, error: 'Profil introuvable — contacter l\'admin' };
  }

  setCurUser({ ...profile, email: profile.email || cleanEmail });
  return { ok: true, profile };
}

export async function logout() {
  if (!sb) return;
  await sb.auth.signOut();
  setCurUser(null);
  window.dispatchEvent(new CustomEvent('auth:loggedout'));
}

/**
 * Récupère la session active au démarrage de l'app.
 * À appeler dans main.js avant de monter l'UI.
 */
export async function restoreSession() {
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;

  const { data: profile } = await sb
    .from('profiles')
    .select('id, role, nom, email, avatar_url')
    .eq('auth_id', session.user.id)
    .maybeSingle();

  if (profile) {
    setCurUser({ ...profile, email: profile.email || session.user.email });
    return profile;
  }
  return null;
}
