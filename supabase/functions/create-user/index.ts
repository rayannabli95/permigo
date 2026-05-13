/**
 * Edge Function — create-user
 *
 * Permet à un admin (gérant) de créer un compte élève ou moniteur depuis le frontend.
 * Utilise la service_role key (NEVER exposée au frontend) pour appeler
 * `supabase.auth.admin.createUser()`.
 *
 * Sécurité :
 *  - Vérifie le JWT de l'appelant et son rôle 'admin' dans la table profiles
 *  - Si la création du profil échoue, rollback de l'auth user
 *  - Envoie un email de récupération (l'élève définit son propre mot de passe)
 *
 * Déploiement :
 *   supabase functions deploy create-user
 *   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... (déjà set par défaut)
 *
 * Appel depuis le frontend :
 *   await supabase.functions.invoke('create-user', {
 *     body: { nom, email, tel, forfait_h, role: 'eleve' }
 *   });
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Méthode non autorisée' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnon || !supabaseService) {
      return json({ error: 'Configuration serveur incomplète' }, 500);
    }

    // ─── 1. Vérifie le JWT de l'appelant ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Authentification requise' }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerErr,
    } = await userClient.auth.getUser();

    if (callerErr || !caller) {
      return json({ error: 'Token invalide' }, 401);
    }

    // ─── 2. Vérifie que l'appelant est admin ───
    const { data: callerProfile, error: pErr } = await userClient
      .from('profiles')
      .select('role, nom')
      .eq('auth_id', caller.id)
      .maybeSingle();

    if (pErr || !callerProfile) {
      return json({ error: 'Profil appelant introuvable' }, 403);
    }
    if (callerProfile.role !== 'admin') {
      return json({ error: 'Réservé aux administrateurs' }, 403);
    }

    // ─── 3. Parse + valide le body ───
    const body = await req.json().catch(() => ({}));
    const nom = (body.nom || '').toString().trim();
    const email = (body.email || '').toString().trim().toLowerCase();
    const tel = body.tel ? body.tel.toString().trim() : null;
    const forfait_h = Number.isFinite(+body.forfait_h) ? +body.forfait_h : 20;
    const role = body.role === 'moniteur' ? 'moniteur' : 'eleve';

    if (!nom) return json({ error: 'Le nom est obligatoire' }, 400);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json({ error: 'Email invalide' }, 400);
    }

    // ─── 4. Client admin (service_role) ───
    const admin = createClient(supabaseUrl, supabaseService, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ─── 5. Vérifie qu'aucun user/profil avec cet email n'existe déjà ───
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existing) {
      return json({ error: 'Un profil avec cet email existe déjà' }, 409);
    }

    // ─── 6. Crée l'auth user avec un password temporaire random ───
    const tempPassword = crypto.randomUUID() + 'A!1'; // satisfait la policy de Supabase
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // skip la confirmation email (l'admin valide)
      user_metadata: { nom, role, created_by_admin: caller.id },
    });

    if (createErr || !created.user) {
      return json(
        { error: createErr?.message || "Échec création de l'utilisateur" },
        400
      );
    }

    const newAuthId = created.user.id;

    // ─── 7. Insère le profil ───
    const { error: insertErr } = await admin.from('profiles').insert({
      auth_id: newAuthId,
      role,
      nom,
      email,
      tel,
      forfait_h,
      statut: 'Actif',
      code_statut: 'En cours',
    });

    if (insertErr) {
      // Rollback : delete l'auth user pour éviter un user orphelin
      await admin.auth.admin.deleteUser(newAuthId).catch(() => {});
      return json({ error: 'Erreur insertion profil : ' + insertErr.message }, 500);
    }

    // ─── 8. Génère un lien de récupération pour que l'élève définisse son mdp ───
    let actionLink: string | null = null;
    try {
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
      });
      actionLink = linkData?.properties?.action_link || null;
    } catch (_) {
      // Non bloquant — l'admin peut renvoyer un magic link manuellement
    }

    return json(
      {
        ok: true,
        userId: newAuthId,
        email,
        role,
        action_link: actionLink,
      },
      200
    );
  } catch (err) {
    console.error('[create-user] err', err);
    return json({ error: (err as Error)?.message || 'Erreur serveur' }, 500);
  }
});
