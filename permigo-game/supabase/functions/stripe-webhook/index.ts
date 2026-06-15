// ═══════════════════════════════════════════════════════════════
// Edge Function : stripe-webhook
// Vérifie la signature Stripe et met à jour public.subscriptions (service role).
// Seule source qui écrit l'état d'abonnement : le client ne peut pas s'auto-débloquer.
//
// Events : checkout.session.completed + customer.subscription.created/updated/deleted
// Secrets : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Deploy  : supabase functions deploy stripe-webhook --no-verify-jwt
// Endpoint Stripe : https://<project>.supabase.co/functions/v1/stripe-webhook
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17";

const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// .trim() : robustesse si un \n / espace s'est glissé en collant les secrets.
const stripe = new Stripe((Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim(), {
  httpClient: Stripe.createFetchHttpClient(),
});

// deno-lint-ignore no-explicit-any
async function upsertFromSubscription(admin: any, sub: any) {
  const userId = sub?.metadata?.user_id;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  let resolvedUserId = userId;
  if (!resolvedUserId && customerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    resolvedUserId = data?.user_id;
  }
  if (!resolvedUserId) {
    console.warn("[stripe-webhook] no user_id for subscription", sub.id);
    return;
  }

  const item = sub.items?.data?.[0];
  // API Stripe 2025+ : current_period_end a migré vers la ligne (item).
  const periodEnd = sub.current_period_end ?? item?.current_period_end ?? null;
  const row = {
    user_id: resolvedUserId, // = auth.uid() (FK → auth.users, cf. migration)
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: item?.price?.id ?? null,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
  };
  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "user_id" });
  if (error) {
    console.error("[stripe-webhook] upsert error", error);
    // On throw → 500 → Stripe re-tente la livraison (auto-healing).
    throw new Error(`upsert failed: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  const secret = (Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "").trim();
  if (!secret) return new Response("webhook_secret_missing", { status: 500 });

  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text(); // RAW body obligatoire pour la signature

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (e) {
    console.warn("[stripe-webhook] bad signature", (e as Error)?.message);
    return new Response("invalid_signature", { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          if (!sub.metadata?.user_id && session.client_reference_id) {
            sub.metadata = {
              ...sub.metadata,
              user_id: session.client_reference_id,
            };
          }
          await upsertFromSubscription(admin, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertFromSubscription(admin, event.data.object);
        break;
      }
      default:
        break; // events non gérés : 200 sans rien faire
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error", (e as Error)?.message);
    return new Response("handler_error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
