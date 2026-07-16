// ═══════════════════════════════════════════════════════════════
// Edge Function : stripe-checkout
// Crée une session Stripe Checkout (abonnement) pour l'utilisateur connecté
// et renvoie l'URL de paiement hébergée par Stripe (redirection côté client).
//
// Appelée via supabase.functions.invoke('stripe-checkout') (JWT user attaché).
// Secrets : STRIPE_SECRET_KEY, STRIPE_PRICE_ID, APP_URL (optionnel).
// Deploy  : supabase functions deploy stripe-checkout
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
  const priceId = (Deno.env.get("STRIPE_PRICE_ID") ?? "").trim();
  if (!stripeKey || !priceId) {
    return json(
      {
        error: "stripe_not_configured",
        has_key: !!stripeKey,
        has_price: !!priceId,
      },
      500,
    );
  }

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

    // Réutilise le customer Stripe existant si on en a déjà un.
    let customerId: string | undefined;
    const { data: existing } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    customerId = existing?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const origin =
      req.headers.get("origin") ??
      Deno.env.get("APP_URL") ??
      "https://www.permigo.fr";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${origin}/#/settings?checkout=success`,
      cancel_url: `${origin}/#/settings?checkout=cancel`,
    });

    return json({ url: session.url });
  } catch (e) {
    const err = e as { message?: string };
    console.error("[stripe-checkout] error", err?.message, e);
    return json(
      { error: "stripe_error", detail: err?.message ?? String(e) },
      500,
    );
  }
});
