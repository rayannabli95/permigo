-- ═══════════════════════════════════════════════════════════════
-- Pass Permis élève (pré-vente) — achats et pré-commandes Stripe.
--
-- Test de demande lancé le 15/07/2026 : 3 paliers élève (mensuel 9,99 €,
-- pass 3 mois 24,99 €, pass 6 mois 39,99 €), pré-commande remboursable.
-- Le paiement peut se faire SANS compte (invité via DM / TikTok) : on garde
-- alors l'email Stripe, et user_id reste NULL jusqu'au rattachement.
--
-- Source de vérité = Stripe ; cette table est un MIROIR écrit UNIQUEMENT par
-- l'edge function `stripe-webhook` (service role → bypass RLS). Aucune
-- policy d'écriture `to authenticated` : volontaire.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.pass_purchases (
  id                     uuid primary key default gen_random_uuid(),
  -- Email du payeur (collecté par Stripe Checkout — seul identifiant en mode invité).
  email                  text,
  -- Rempli si l'acheteur était connecté au moment du paiement (= auth.uid()).
  user_id                uuid references auth.users (id) on delete set null,
  plan                   text not null check (plan in ('mensuel', 'pass3', 'pass6')),
  amount_cents           integer not null default 0,
  currency               text not null default 'eur',
  stripe_session_id      text not null unique,
  stripe_payment_intent  text,
  stripe_customer_id     text,
  stripe_subscription_id text,
  -- paid | refunded
  status                 text not null default 'paid',
  -- Pré-vente : engagement « remboursable sur simple demande ».
  preorder               boolean not null default true,
  created_at             timestamptz not null default now()
);

comment on table public.pass_purchases is
  'Achats/pré-commandes du Pass Permis élève (miroir Stripe, écrit par l''edge function stripe-webhook en service role). Lecture seule côté client.';
comment on column public.pass_purchases.plan is
  'mensuel (abo 9,99 €/mois) | pass3 (24,99 € one-shot) | pass6 (39,99 € one-shot).';

create index if not exists pass_purchases_email_idx
  on public.pass_purchases (email);
create index if not exists pass_purchases_user_idx
  on public.pass_purchases (user_id);
-- Lookup du webhook sur charge.refunded.
create index if not exists pass_purchases_pi_idx
  on public.pass_purchases (stripe_payment_intent);

alter table public.pass_purchases enable row level security;

-- L'owner (Rayan) voit toutes les ventes (suivi du test des 5 payeurs).
create policy "owner reads all pass purchases"
  on public.pass_purchases
  for select
  to authenticated
  using (public.is_owner());

-- Un utilisateur connecté voit SES achats (rattachés à son auth.uid()).
create policy "user reads own pass purchases"
  on public.pass_purchases
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Aucune policy INSERT/UPDATE/DELETE `to authenticated` : les écritures passent
-- exclusivement par le webhook Stripe (service role). Même verrou que
-- public.subscriptions.
revoke insert, update, delete on public.pass_purchases from authenticated, anon;
