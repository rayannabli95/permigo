// ═══════════════════════════════════════════════════════════════
// Edge Function : pass-checkout
// Crée une session Stripe Checkout pour le Pass Permis ÉLÈVE (pré-vente) :
//   - mensuel : abonnement 9,99 €/mois (mode subscription)
//   - pass3   : Pass Permis 3 mois, 24,99 € one-shot (mode payment)
//   - pass6   : Pass Permis 6 mois + bonus, 39,99 € one-shot (mode payment)
//
// Les prix sont INLINE (price_data) : rien à créer dans le dashboard Stripe.
// Marche CONNECTÉ (JWT user → user_id rattaché) ou INVITÉ (anon key → Stripe
// collecte l'email). Apple Pay / Google Pay : automatiques sur le Checkout
// hébergé par Stripe. L'enregistrement de l'achat se fait dans le webhook
// (metadata.permigo_plan) → table public.pass_purchases.
//
// Appelée via supabase.functions.invoke('pass-checkout', { body: { plan } }).
// Secrets : STRIPE_SECRET_KEY, APP_URL (optionnel).
// Deploy  : supabase functions deploy pass-checkout
// ═══════════════════════════════════════════════════════════════
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^17";

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

// Paliers de la pré-vente (montants en centimes). Source : brief prix du
// 15/07/2026 — mensuel = faible barrière, pass3 = cible, pass6 = ancre haute.
const PLANS: Record<
  string,
  {
    mode: "subscription" | "payment";
    amount: number;
    name: string;
    description: string;
  }
> = {
  mensuel: {
    mode: "subscription",
    amount: 999,
    name: "PermiGo — Abonnement mensuel",
    description:
      "Accès complet à PermiGo. Sans engagement, résiliable en un clic.",
  },
  pass3: {
    mode: "payment",
    amount: 2499,
    name: "Pass Permis 3 mois — Objectif Permis en 90 jours",
    description:
      "Accès complet à PermiGo pendant 3 mois. Pré-vente : remboursable sur simple demande.",
  },
  pass6: {
    mode: "payment",
    amount: 3999,
    name: "Pass Permis 6 mois + bonus fondateur",
    description:
      "Accès complet à PermiGo pendant 6 mois + bonus fondateur. Pré-vente : remboursable sur simple demande.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // .trim() : robustesse si un \n / espace s'est glissé en collant le secret.
  const stripeKey = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").trim();
  if (!stripeKey) return json({ error: "stripe_not_configured" }, 500);

  let plan = "";
  try {
    const body = await req.json();
    plan = String(body?.plan ?? "");
  } catch {
    /* body absent/malformé → rejeté juste en dessous */
  }
  const cfg = PLANS[plan];
  if (!cfg) return json({ error: "unknown_plan" }, 400);

  try {
    // Utilisateur connecté ? (facultatif : la page est aussi publique.
    // En mode invité, supabase-js envoie l'anon key → getUser échoue → guest.)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const jwt = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (jwt) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin =
      req.headers.get("origin") ??
      Deno.env.get("APP_URL") ??
      "https://permigo.vercel.app";

    // metadata.permigo_plan = signal pour le webhook → ligne pass_purchases.
    const metadata: Record<string, string> = {
      permigo_plan: plan,
      preorder: "true",
      ...(userId ? { user_id: userId } : {}),
    };

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: cfg.mode,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: cfg.amount,
            product_data: { name: cfg.name, description: cfg.description },
            ...(cfg.mode === "subscription"
              ? { recurring: { interval: "month" } }
              : {}),
          },
        },
      ],
      metadata,
      allow_promotion_codes: true,
      success_url: `${origin}/#/pass?checkout=success&plan=${plan}`,
      cancel_url: `${origin}/#/pass?checkout=cancel`,
      ...(userId ? { client_reference_id: userId } : {}),
      ...(userEmail ? { customer_email: userEmail } : {}),
    };

    if (cfg.mode === "subscription") {
      params.subscription_data = { metadata };
    } else {
      params.payment_intent_data = { metadata };
      // Toujours créer un customer : permet le rattachement au compte plus
      // tard (même email) + le remboursement en un clic côté dashboard.
      params.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(params);
    return json({ url: session.url });
  } catch (e) {
    const err = e as { message?: string };
    console.error("[pass-checkout] error", err?.message, e);
    return json(
      { error: "stripe_error", detail: err?.message ?? String(e) },
      500,
    );
  }
});
