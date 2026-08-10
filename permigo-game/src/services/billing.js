// ═══════════════════════════════════════════════════════════════
// Billing — abonnement Stripe (bêta moniteur indépendant, 9,99 €/mois).
// Le client NE FAIT que : lancer le Checkout (via edge function) et lire son
// statut. Toute l'écriture d'état passe par le webhook Stripe (service role).
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { getLang } from "@/utils/lang.js";

const ACTIVE_STATUSES = ["active", "trialing"];

/**
 * Langue à envoyer à Stripe. Deux mémoires cohabitent : `permigo_lang` pour
 * l'app (via getLang) et `pv_lang`, propre à l'ancienne page `#/pass` qui a
 * son propre sélecteur. Un visiteur venu par une pub arabe n'a que la seconde :
 * si on ne lisait que la première, il repartait en français.
 * @returns {'fr'|'en'|'ar'}
 */
function langueDePaiement() {
  const ok = (v) => v === "fr" || v === "en" || v === "ar";
  try {
    // Le choix fait DANS l'app gagne : c'est la langue du mur de vente que
    // l'élève vient de lire. `pv_lang` ne sert que s'il n'a jamais ouvert
    // l'app (visiteur arrivé par une pub, resté sur `#/pass`).
    const app = localStorage.getItem("permigo_lang");
    if (ok(app)) return app;
    const pass = localStorage.getItem("pv_lang");
    if (ok(pass)) return pass;
  } catch {
    /* mode privé */
  }
  return getLang();
}

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
 * Un seul palier depuis le 05/08/2026 : tout le reste est refusé par le
 * serveur (`unknown_plan`, 400).
 *
 * `lang` : la langue CHOISIE dans l'app, pas celle du téléphone. Sans elle,
 * Stripe se cale sur les réglages de l'appareil : un élève qui a fait tout le
 * parcours en anglais tombait sur une page de paiement en français.
 * @param {'mensuel'} plan
 * @returns {Promise<void>} redirige la page si succès ; throw sinon.
 */
export async function startPassCheckout(plan) {
  const { data, error } = await sb.functions.invoke("pass-checkout", {
    body: { plan, lang: langueDePaiement() },
  });
  if (error) throw error;
  const url = data?.url;
  if (!url) throw new Error("checkout_url_missing");
  window.location.href = url;
}

/**
 * Retrouve l'email d'une session Stripe Checkout Pass Permis (audit landing
 * 03/08/2026) : un invité qui vient de payer doit retaper exactement le même
 * email pour débloquer son accès (eleve_access_status matche par email). Cet
 * appel permet de le pré-remplir sur #/rejoindre au lieu de le lui demander
 * de mémoire. Best-effort : au pire l'élève retape son email lui-même.
 * @param {string} sessionId depuis l'URL de retour (`?session_id=...`)
 * @returns {Promise<string|null>}
 */
export async function getPassSessionEmail(sessionId) {
  if (!sessionId) return null;
  try {
    const { data, error } = await sb.functions.invoke("pass-session-email", {
      body: { session_id: sessionId },
    });
    if (error) return null;
    return data?.email || null;
  } catch {
    return null;
  }
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
