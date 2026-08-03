// ═══════════════════════════════════════════════════════════════
// Edge Function : pass-session-email
//
// Un invité (pas de compte) qui vient de payer le Pass Permis doit retaper
// EXACTEMENT le même email pour débloquer son accès : eleve_access_status()
// (migration 20260718130000) matche pass_purchases par email confirmé. Une
// lettre de travers à l'inscription et il a payé pour rien.
//
// Cette fonction rend l'email attaché à SA session Stripe, pour que
// #/rejoindre puisse le pré-remplir. Elle ne rend RIEN d'autre (pas de
// montant, pas de plan, pas de nom) : le strict nécessaire pour lever la
// friction, pas une fiche de commande.
//
// Sécurité : le session_id Stripe (cs_live_…/cs_test_…) est un jeton long et
// aléatoire, livré UNIQUEMENT par la redirection Stripe elle-même après
// paiement — même sensibilité qu'une page de confirmation de commande. On ne
// rend l'email QUE si la session porte metadata.permigo_plan (donc vient
// bien de pass-checkout, pas une session Stripe quelconque du compte) ET que
// le paiement est effectivement passé.
//
// Secrets : STRIPE_SECRET_KEY
// Deploy  : supabase functions deploy pass-session-email --no-verify-jwt
// ═══════════════════════════════════════════════════════════════
import Stripe from "npm:stripe@^17";

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

  let sessionId = "";
  try {
    const body = await req.json();
    sessionId = String(body?.session_id ?? "").trim();
  } catch {
    /* body absent/malformé → rejeté juste en dessous */
  }
  // Un vrai session_id Stripe commence par "cs_". Filtre grossier avant
  // l'appel API, pour ne pas transmettre n'importe quoi à Stripe.
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return json({ error: "invalid_session_id" }, 400);
  }

  try {
    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Sans cette metadata, la session n'a pas été créée par pass-checkout :
    // on ne veut divulguer l'email d'AUCUNE autre session Stripe du compte.
    if (!session.metadata?.permigo_plan) {
      return json({ error: "not_a_pass_session" }, 404);
    }
    const paid =
      session.payment_status === "paid" || session.status === "complete";
    if (!paid) return json({ error: "not_paid" }, 404);

    const email =
      session.customer_details?.email ?? session.customer_email ?? null;
    return json({ email });
  } catch (e) {
    const err = e as { message?: string };
    console.error("[pass-session-email] error", err?.message, e);
    return json({ error: "stripe_error" }, 500);
  }
});
