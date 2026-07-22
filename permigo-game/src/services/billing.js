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
 * Pré-vente Pass Permis ÉLÈVE : lance le Checkout du palier choisi.
 * Marche connecté (JWT user → achat rattaché au compte) comme invité
 * (supabase-js envoie l'anon key → Stripe collecte l'email).
 * @param {'mensuel'|'pass3'|'pass6'} plan
 * @returns {Promise<void>} redirige la page si succès ; throw sinon.
 */
export async function startPassCheckout(plan) {
  const { data, error } = await sb.functions.invoke("pass-checkout", {
    body: { plan },
  });
  if (error) throw error;
  const url = data?.url;
  if (!url) throw new Error("checkout_url_missing");
  window.location.href = url;
}

/**
 * Ouvre le portail de facturation Stripe (edge function billing-portal) pour
 * gérer / RÉSILIER l'abonnement en ligne, puis redirige vers ce portail.
 * supabase-js attache automatiquement le JWT user à l'invocation.
 * @returns {Promise<void>} redirige la page si succès ; throw sinon (ex : pas de
 *   customer Stripe → le client affiche un e-mail de secours).
 */
export async function openBillingPortal() {
  const { data, error } = await sb.functions.invoke("billing-portal", {
    body: {},
  });
  if (error) throw error;
  const url = data?.url;
  if (!url) throw new Error("portal_url_missing");
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

/**
 * Statut d'accès MONITEUR (essai gratuit 14 j → abonnement requis). Source de
 * vérité SERVEUR (RPC `moniteur_access_status`, non-spoofable côté client).
 * Fail-open : en cas d'erreur réseau, on NE bloque PAS (mieux vaut un moniteur
 * non payé qui passe qu'un légitime verrouillé sur un simple glitch).
 * @returns {Promise<{gated:boolean, reason?:string, trial_ends_at?:string, days_left?:number}>}
 */
export async function getMoniteurAccess() {
  try {
    const { data, error } = await sb.rpc("moniteur_access_status");
    if (error) throw error;
    return data || { gated: false };
  } catch (e) {
    console.error("[billing] getMoniteurAccess", e);
    return { gated: false, reason: "error" };
  }
}

/**
 * Statut d'accès ÉLÈVE SOLO. Un élève sans moniteur (pas de code) doit avoir un
 * Pass payé ; un élève rattaché à un moniteur est gratuit ; les solos déjà
 * inscrits avant le lancement sont grandfathered. Source de vérité SERVEUR
 * (RPC `eleve_access_status`). Fail-open : erreur réseau → ne bloque pas.
 * @returns {Promise<{gated:boolean, reason?:string}>}
 */
export async function getEleveAccess() {
  try {
    const { data, error } = await sb.rpc("eleve_access_status");
    if (error) throw error;
    return data || { gated: false };
  } catch (e) {
    console.error("[billing] getEleveAccess", e);
    return { gated: false, reason: "error" };
  }
}
