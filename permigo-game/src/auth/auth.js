/**
 * Authentication — wrapper Supabase.
 *
 * Conserve la couche Auth existante (Supabase) car déjà éprouvée et gratuite.
 * En dev local, Supabase tourne quand même via le cloud (l'auth est centralisée).
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { setCurUser } from "./cur-user.js";

export const sb =
  env.SUPABASE_URL && env.SUPABASE_ANON_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // requis pour magic link (parse #access_token=... au retour)
          flowType: "pkce", // flow plus sécurisé pour magic link/OTP
          storageKey: "permigo-v7-auth",
        },
      })
    : null;

if (!sb) console.warn("[auth] Supabase non configuré — auth désactivée");

// NOTE : le listener auth est attaché manuellement APRÈS le boot
// (pour éviter le deadlock sur getSession au démarrage).

/**
 * Login email + password.
 * @param {string} email
 * @param {string} password
 * @param {{captchaToken?: string}} [opts]
 * @returns {Promise<{ok: boolean, profile?: object, error?: string}>}
 */
export async function login(email, password, opts = {}) {
  if (!sb) return { ok: false, error: "Supabase non configuré" };

  const cleanEmail = email.trim().toLowerCase();

  const payload = { email: cleanEmail, password };
  if (opts.captchaToken) payload.options = { captchaToken: opts.captchaToken };

  const loginPromise = sb.auth.signInWithPassword(payload);
  const timeout = new Promise((_, rej) =>
    setTimeout(
      () => rej(new Error("Login timeout 10s — vérifie la console réseau")),
      10000,
    ),
  );

  let data, error;
  try {
    const res = await Promise.race([loginPromise, timeout]);
    data = res.data;
    error = res.error;
  } catch (e) {
    console.error("[auth] login timeout/erreur", e);
    return { ok: false, error: e.message };
  }

  if (error) return { ok: false, error: error.message };

  // Récupère le profil DB (role, nom, etc.)
  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select(
      "id, auth_id, role, nom, prenom, username, date_naissance, email, auto_ecole_id, join_code, avatar_url, avatar_preset, unlocked_avatars, first_value_action_at, gemmes, parental_consent_required, parental_consent_given_at, parental_consent_token",
    )
    .eq("auth_id", data.user.id)
    .maybeSingle();

  if (pErr || !profile) {
    await sb.auth.signOut();
    return { ok: false, error: "Profil introuvable — contacter l'admin" };
  }

  setCurUser({ ...profile, email: profile.email || cleanEmail });
  return { ok: true, profile };
}

/**
 * Envoie un magic link / code OTP par email.
 * L'user reçoit un email avec :
 *  - un lien magique cliquable (renvoie sur l'app avec la session déjà créée)
 *  - un code à 6 chiffres à saisir manuellement (fallback)
 * @param {string} email
 * @param {{captchaToken?: string, shouldCreateUser?: boolean}} [opts]
 */
export async function loginWithOtp(email, opts = {}) {
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const cleanEmail = email.trim().toLowerCase();
  const options = {
    shouldCreateUser: opts.shouldCreateUser ?? false, // false = login only (pas de création silencieuse)
    emailRedirectTo: window.location.origin + window.location.pathname,
  };
  if (opts.captchaToken) options.captchaToken = opts.captchaToken;
  const { error } = await sb.auth.signInWithOtp({ email: cleanEmail, options });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Vérifie un code OTP saisi manuellement.
 * @param {string} email
 * @param {string} token - code 6 chiffres
 */
export async function verifyOtp(email, token) {
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await sb.auth.verifyOtp({
    email: cleanEmail,
    token: token.trim(),
    type: "email",
  });
  if (error) return { ok: false, error: error.message };
  // Recupère le profil après succès
  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select(
      "id, auth_id, role, nom, prenom, username, date_naissance, email, auto_ecole_id, join_code, avatar_url, avatar_preset, unlocked_avatars, first_value_action_at, gemmes, parental_consent_required, parental_consent_given_at, parental_consent_token",
    )
    .eq("auth_id", data.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("[auth] profil après OTP", profileError);
    await sb.auth.signOut();
    return {
      ok: false,
      error: "Impossible de charger le profil — réessaie",
    };
  }
  if (!profile) {
    await sb.auth.signOut();
    return { ok: false, error: "Profil introuvable — contacter l'admin" };
  }
  setCurUser({ ...profile, email: profile.email || cleanEmail });
  return { ok: true, profile };
}

export async function logout() {
  if (!sb) return;
  await sb.auth.signOut();
  setCurUser(null);
  // Dispatch les deux events (compat anciens + nouveaux listeners)
  window.dispatchEvent(new CustomEvent("auth:loggedout"));
  window.dispatchEvent(new CustomEvent("auth:signedout"));
  // Navigate to clean root — plus fiable qu'un reload avec hash
  try {
    if (typeof window !== "undefined" && window.location) {
      window.location.href = window.location.origin + "/";
    }
  } catch {}
}

/**
 * Récupère la session active au démarrage de l'app.
 * À appeler dans main.js avant de monter l'UI.
 */
export async function restoreSession() {
  if (!sb) return null;
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return null;

  // On a une session valide → on charge le profil. En cas d'ERREUR transitoire
  // (réseau, hoquet RLS), on retente 1× avant d'abandonner : sinon un simple
  // hoquet renvoyait null et boot() traitait l'utilisateur connecté comme un
  // invité → « déconnexion fantôme » (retour landing/login alors que la session
  // est bien là). Un vrai « pas de profil » (error null, profile null) sort tout
  // de suite, sans retry inutile.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: profile, error } = await sb
      .from("profiles")
      .select(
        "id, auth_id, role, nom, prenom, username, date_naissance, email, auto_ecole_id, join_code, avatar_url, avatar_preset, unlocked_avatars, first_value_action_at, gemmes, parental_consent_required, parental_consent_given_at, parental_consent_token",
      )
      .eq("auth_id", session.user.id)
      .maybeSingle();

    if (profile) {
      setCurUser({ ...profile, email: profile.email || session.user.email });
      return profile;
    }
    if (!error) break; // pas d'erreur mais pas de profil → vrai cas « sans profil »
    if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}
