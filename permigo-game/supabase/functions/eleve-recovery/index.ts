// ═══════════════════════════════════════════════════════════════
// Edge Function : eleve-recovery
// Un enseignant/gérant déclenche l'envoi d'un email de récupération d'accès
// À UN ÉLÈVE de SON école. Le moniteur ne voit jamais le lien (envoyé direct
// à l'élève). L'élève reçoit un lien/code magique → reprend la main → peut
// redéfinir son mot de passe dans Réglages.
//
// Sécurité :
//   - JWT obligatoire (verify_jwt=true) → on identifie l'appelant.
//   - l'appelant doit être enseignant|gerant.
//   - l'élève cible doit appartenir à la MÊME auto_ecole que l'appelant.
//
// Secrets : aucun en plus (SUPABASE_URL/ANON_KEY/SERVICE_ROLE auto-injectés).
// L'envoi réel d'email passe par le SMTP configuré dans Supabase Auth
// (gratuit, ex. Resend) — sans ça, soumis aux limites d'email par défaut.
//
// Deploy : supabase functions deploy eleve-recovery
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";

const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const { eleve_id } = await req.json().catch(() => ({}));
    if (!eleve_id) return json({ error: "missing_eleve_id" }, 400);

    // 1. Identifier l'appelant
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 2. Profil de l'appelant (role + école) — via auth_id (≠ id dans ce projet)
    const { data: caller } = await admin
      .from("profiles")
      .select("id, role, auto_ecole_id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!caller || !["enseignant", "gerant"].includes(caller.role)) {
      return json({ error: "forbidden" }, 403);
    }

    // 3. Élève cible — doit être un élève de la MÊME école
    const { data: eleve } = await admin
      .from("profiles")
      .select("id, role, auto_ecole_id, auth_id, email")
      .eq("id", eleve_id)
      .maybeSingle();
    if (
      !eleve ||
      eleve.role !== "eleve" ||
      !eleve.auto_ecole_id ||
      eleve.auto_ecole_id !== caller.auto_ecole_id
    ) {
      return json({ error: "forbidden" }, 403);
    }

    // 4. Email authoritatif de l'élève (auth.users via auth_id, repli profiles.email)
    let email = eleve.email as string | null;
    if (eleve.auth_id) {
      const { data: au } = await admin.auth.admin.getUserById(eleve.auth_id);
      if (au?.user?.email) email = au.user.email;
    }
    if (!email) return json({ error: "no_email" }, 422);

    // 5. Envoi du lien/code de connexion À L'ÉLÈVE (réutilise le flux OTP existant).
    const origin =
      req.headers.get("origin") ??
      Deno.env.get("APP_URL") ??
      "https://permigo.vercel.app";
    const { error: otpErr } = await userClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: origin },
    });
    if (otpErr) {
      console.error("[eleve-recovery] otp send error", otpErr.message);
      return json({ error: "send_failed", detail: otpErr.message }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("[eleve-recovery] error", (e as Error)?.message);
    return json({ error: "server_error" }, 500);
  }
});
