// ═══════════════════════════════════════════════════════════════
// Edge Function : pass-checkout
// Crée une session Stripe Checkout pour le Pass Permis ÉLÈVE.
//
// UN SEUL palier : `mensuel`, abonnement 4,99 €/mois (mode subscription).
//
// ⛔ Les anciens paliers one-shot `pass3` (24,99 €) et `pass6` (39,99 €) ont
// été RETIRÉS d'ici le 05/08/2026. Ils n'étaient plus proposés par aucun bouton
// depuis le 02/08 (décision Rayan : un seul prix), mais la fonction les
// acceptait encore : n'importe qui pouvait faire partir un paiement à 24,99 €
// sur une offre qu'on ne vend plus, en appelant la fonction à la main. Ils
// renvoient maintenant `unknown_plan` (400).
//
// ⚠️ Ne PAS les retirer de `stripe-webhook` ni de `pass_purchases` : des gens
// ont réellement acheté ces paliers, leur accès doit continuer de vivre.
// Idem pour PLAN_VALUE / PLAN_LABEL dans `src/pages/public/pass.js` : ils
// servent à l'écran de succès d'un ancien acheteur qui revient sur son lien.
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

// Paliers (montants en centimes). UN SEUL : 4,99 €/mois, le même prix pour
// tout le monde. Tout ce qui n'est pas dans cette table est refusé en 400.
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
    amount: 499,
    name: "PermiGo — Abonnement mensuel",
    description:
      "Accès complet à PermiGo. Sans engagement, résiliable en un clic.",
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
      "https://www.permigo.fr";

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
      // {CHECKOUT_SESSION_ID} est un placeholder Stripe : substitué au
      // vrai id à la redirection. Sert UNIQUEMENT à pré-remplir l'email
      // d'inscription d'un invité (cf. pass-session-email) — un compte déjà
      // connecté a déjà son accès via client_reference_id, il l'ignore.
      success_url: `${origin}/#/pass?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
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
      // Facture générée et envoyée après paiement (retour Rayan sur son achat
      // réel : « 0 mail de confirmation ni facture »).
      params.invoice_creation = { enabled: true };
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
