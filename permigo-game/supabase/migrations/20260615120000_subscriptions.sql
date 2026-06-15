-- ═══════════════════════════════════════════════════════════════
-- Abonnements Stripe (bêta moniteur indépendant self-serve, 9,99 €/mois).
--
-- Source de vérité = Stripe ; cette table est un MIROIR mis à jour UNIQUEMENT
-- par l'edge function `stripe-webhook` (service role → bypass RLS).
-- L'utilisateur lit SON abonnement pour savoir s'il est actif. Aucune écriture
-- côté client (pas de policy write `to authenticated` = volontaire).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  -- miroir du statut Stripe : active | trialing | past_due | canceled |
  -- incomplete | incomplete_expired | unpaid | paused
  status                 text not null default 'incomplete',
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.subscriptions is
  'Miroir des abonnements Stripe (écrit par l''edge function stripe-webhook en service role). Lecture seule côté client.';
comment on column public.subscriptions.status is
  'Statut Stripe : active/trialing = accès ouvert ; le reste = bloqué.';

-- Index pour les lookups du webhook (le user_id est déjà la PK).
create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

-- L'utilisateur lit UNIQUEMENT son propre abonnement.
create policy "user reads own subscription"
  on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Aucune policy INSERT/UPDATE/DELETE `to authenticated` : les écritures passent
-- exclusivement par le webhook Stripe (service role, qui contourne la RLS).
-- C'est volontaire — le client ne doit jamais pouvoir s'auto-abonner.

-- updated_at auto
create or replace function public.touch_subscription_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscription_updated_at();
