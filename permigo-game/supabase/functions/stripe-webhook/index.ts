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

// Best-effort : crédite le PARRAIN (si le payeur a été parrainé) au 1er
// paiement confirmé. Idempotent côté DB (contrainte unique sur referred_id),
// donc sans risque à appeler plusieurs fois pour le même utilisateur (retries
// Stripe, renouvellements). Ne doit JAMAIS faire échouer le webhook : une
// erreur ici est loguée, pas propagée (le paiement lui-même reste valide).
// deno-lint-ignore no-explicit-any
async function grantReferralReward(admin: any, authUserId: string | null) {
  if (!authUserId) return;
  try {
    const { data, error } = await admin.rpc(
      "grant_referral_conversion_reward",
      {
        p_auth_user_id: authUserId,
      },
    );
    if (error) {
      console.error("[stripe-webhook] grant_referral_conversion_reward", error);
      return;
    }
    if (data?.ok && data?.already_granted === false) {
      console.log("[stripe-webhook] referral reward granted", authUserId);
    }
  } catch (e) {
    console.error("[stripe-webhook] grant_referral_conversion_reward threw", e);
  }
}

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
    return null;
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

  // Résiliation / impayé d'un abonnement MENSUEL (moniteur ou Pass Permis élève) :
  // en plus de subscriptions, on EXPIRE l'accès mensuel acheté via pass-checkout.
  // Sans ça, eleve_access_status() (qui ne compte que les pass_purchases 'paid')
  // laisserait un « mensuel résilié = accès à vie ». On matche par
  // stripe_subscription_id (posé à l'achat) → aucun risque de toucher une autre
  // ligne. On ne touche JAMAIS pass3/pass6 (achats uniques à durée déterminée).
  const TERMINATED = ["canceled", "unpaid"];
  if (TERMINATED.includes(sub.status)) {
    const { error: exErr } = await admin
      .from("pass_purchases")
      .update({ status: "expired" })
      .eq("plan", "mensuel")
      .eq("status", "paid")
      .eq("stripe_subscription_id", sub.id);
    if (exErr) {
      console.error("[stripe-webhook] mensuel expire error", exErr);
      throw new Error(`mensuel expire failed: ${exErr.message}`);
    }
  }

  return resolvedUserId;
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
        // Pré-vente Pass Permis élève : toute session portant
        // metadata.permigo_plan (posée par pass-checkout) est enregistrée dans
        // pass_purchases — one-shot (pass3/pass6) comme abo (mensuel), invité
        // (user_id null, email Stripe) comme connecté. Le flow moniteur
        // (stripe-checkout) ne pose pas cette metadata → inchangé.
        if (session.metadata?.permigo_plan) {
          const row = {
            email:
              session.customer_details?.email ?? session.customer_email ?? null,
            user_id: session.client_reference_id ?? null,
            plan: session.metadata.permigo_plan,
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? "eur",
            stripe_session_id: session.id,
            stripe_payment_intent:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : (session.customer?.id ?? null),
            stripe_subscription_id:
              typeof session.subscription === "string"
                ? session.subscription
                : (session.subscription?.id ?? null),
            status: "paid",
            preorder: session.metadata.preorder === "true",
          };
          const { error } = await admin
            .from("pass_purchases")
            .upsert(row, { onConflict: "stripe_session_id" });
          if (error) {
            console.error("[stripe-webhook] pass_purchases upsert", error);
            // throw → 500 → Stripe re-tente (même auto-healing que subscriptions).
            throw new Error(`pass upsert failed: ${error.message}`);
          }
          // Paiement Pass Permis confirmé + acheteur connecté (pas invité) →
          // crédite un éventuel parrain. Un achat invité (user_id null) ne
          // peut pas être rattaché à un referred_by : hors scope pour l'instant.
          if (row.status === "paid" && row.user_id) {
            await grantReferralReward(admin, row.user_id);
          }
        }
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
          const resolvedUserId = await upsertFromSubscription(admin, sub);
          if (["active", "trialing"].includes(sub.status)) {
            await grantReferralReward(admin, resolvedUserId);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const resolvedUserId = await upsertFromSubscription(admin, sub);
        if (["active", "trialing"].includes(sub.status)) {
          await grantReferralReward(admin, resolvedUserId);
        }
        break;
      }
      // Pré-vente remboursable : un remboursement (dashboard Stripe) marque la
      // ligne pass_purchases correspondante. Ne matche rien pour les paiements
      // hors Pass → no-op.
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (pi) {
          const { error } = await admin
            .from("pass_purchases")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent", pi);
          if (error) {
            console.error("[stripe-webhook] refund update", error);
            throw new Error(`refund update failed: ${error.message}`);
          }
        }
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
