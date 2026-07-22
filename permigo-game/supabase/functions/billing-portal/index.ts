// ═══════════════════════════════════════════════════════════════
// Edge Function : billing-portal
// Ouvre le portail de facturation Stripe (billingPortal.sessions.create) pour
// l'utilisateur connecté → il y gère / RÉSILIE son abonnement en ligne, sans
// nous contacter (obligation L215-1-1 : résiliation en ligne simple).
//
// Vaut pour l'abonnement moniteur (stripe-checkout) ET l'abonnement mensuel
// élève (pass-checkout) : on retrouve le customer Stripe par tous les chemins
// possibles (subscriptions, pass_purchases, email Stripe). Pas de customer →
// 404 clair (le client affiche alors un e-mail de secours).
//
// Appelée via supabase.functions.invoke('billing-portal') (JWT user attaché).
// Secrets : STRIPE_SECRET_KEY, APP_URL (optionnel).
// Deploy  : supabase functions deploy billing-portal
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17";

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

  // .trim() : robustesse si un \n / espace s'est glissé en collant le secret.
  const stripeKey = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();
  if (!stripeKey) return json({ error: "stripe_not_configured" }, 500);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user)
      return json({ error: "unauthorized", detail: userErr?.message }, 401);

    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Retrouver le customer Stripe de l'utilisateur ────────────────────
    // 1. Abonnement (moniteur, ou mensuel élève acheté connecté) : subscriptions.
    let customerId: string | undefined;
    const { data: subRow } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    customerId = subRow?.stripe_customer_id ?? undefined;

    // 2. Achat Pass (mensuel) rattaché au compte : pass_purchases.user_id.
    if (!customerId) {
      const { data: pp } = await admin
        .from("pass_purchases")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      customerId = pp?.stripe_customer_id ?? undefined;
    }

    // 3. Achat invité rattaché plus tard (même e-mail) : pass_purchases.email.
    if (!customerId && user.email) {
      const { data: ppe } = await admin
        .from("pass_purchases")
        .select("stripe_customer_id")
        .ilike("email", user.email)
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      customerId = ppe?.stripe_customer_id ?? undefined;
    }

    // 4. Dernier recours : le customer existe côté Stripe (même e-mail).
    if (!customerId && user.email) {
      const list = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      customerId = list.data[0]?.id;
    }

    if (!customerId)
      return json(
        {
          error: "no_customer",
          message: "Aucun abonnement trouvé pour ce compte.",
        },
        404,
      );

    const origin =
      req.headers.get("origin") ??
      Deno.env.get("APP_URL") ??
      "https://www.permigo.fr";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/#/settings`,
    });

    return json({ url: session.url });
  } catch (e) {
    const err = e as { message?: string };
    console.error("[billing-portal] error", err?.message, e);
    return json(
      { error: "stripe_error", detail: err?.message ?? String(e) },
      500,
    );
  }
});
