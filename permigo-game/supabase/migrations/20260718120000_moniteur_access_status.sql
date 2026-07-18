-- Verrou d'accès moniteur : essai gratuit 14 jours puis abonnement requis.
-- Source de vérité SERVEUR : le gate client (accessGateFor) lit ce statut,
-- non-spoofable côté client. Appliquée en prod le 2026-07-18.
create or replace function public.moniteur_access_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p profiles%rowtype;
  trial_end timestamptz;
  has_sub boolean;
begin
  select * into p from profiles where auth_id = auth.uid();
  if not found or p.role <> 'enseignant' then
    return jsonb_build_object('gated', false, 'reason', 'not_moniteur');
  end if;

  -- Comptes de dev/test : jamais bloqués (fixtures e2e + démos).
  if coalesce(p.is_internal, false)
     or p.email ilike '%@test.fr'
     or p.email ilike '%permigo-test%' then
    return jsonb_build_object('gated', false, 'reason', 'internal');
  end if;

  -- Abonnement Stripe actif (subscriptions.user_id = auth_id).
  select exists(
    select 1 from subscriptions s
    where s.user_id = p.auth_id
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  ) into has_sub;
  if has_sub then
    return jsonb_build_object('gated', false, 'reason', 'subscribed');
  end if;

  -- Essai gratuit : 14 j depuis max(inscription, lancement du paywall) →
  -- les moniteurs déjà inscrits gardent 14 j pleins à partir du lancement.
  trial_end := greatest(p.created_at, timestamptz '2026-07-18 00:00:00+00') + interval '14 days';
  return jsonb_build_object(
    'gated', now() >= trial_end,
    'reason', 'trial',
    'trial_ends_at', trial_end,
    'days_left', greatest(0, ceil(extract(epoch from (trial_end - now())) / 86400.0))::int
  );
end;
$$;

grant execute on function public.moniteur_access_status() to authenticated;
