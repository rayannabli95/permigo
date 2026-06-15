// ═══════════════════════════════════════════════════════════════
// Billing — abonnement Stripe (bêta moniteur indépendant, 9,99 €/mois).
// Le client NE FAIT que : lancer le Checkout (via edge function) et lire son
// statut. Toute l'écriture d'état passe par le webhook Stripe (service role).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";

const ACTIVE_STATUSES = ["active", "trialing"];

/**
 * Démarre le paiement : appelle l'edge function stripe-checkout (qui crée la
 * session) puis redirige vers la page de paiement hébergée par Stripe.
 * supabase-js attache automatiquement le JWT user à l'invocation.
 * @returns {Promise<void>} redirige la page si succès ; throw sinon.
 */
export async function startCheckout() {
  const { data, error } = await sb.functions.invoke("stripe-checkout", {
    body: {},
  });
  if (error) throw error;
  const url = data?.url;
  if (!url) throw new Error("checkout_url_missing");
  window.location.href = url;
}

/**
 * Lit l'abonnement de l'utilisateur courant (RLS : il ne voit que le sien).
 * @returns {Promise<{status:string,current_period_end:string|null,cancel_at_period_end:boolean}|null>}
 */
export async function getSubscription() {
  const { data, error } = await sb
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .maybeSingle();
  if (error) {
    console.error("[billing] getSubscription", error);
    return null;
  }
  return data;
}

/** Abonnement réellement actif (statut OK + période non expirée). */
export function isActive(sub) {
  if (!sub || !ACTIVE_STATUSES.includes(sub.status)) return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end) > new Date();
}
