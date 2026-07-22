-- Paiement OBLIGATOIRE à l'inscription moniteur (décision Rayan, 2026-07-22).
-- On repart du corps de 20260718120000_moniteur_access_status.sql et on change
-- UNIQUEMENT la logique d'essai :
--   • moniteurs créés À PARTIR du 2026-07-23 → PLUS d'essai : gated dès
--     l'inscription tant qu'aucun abonnement actif (le paywall du formulaire
--     d'inscription est le seul chemin, cf. creer-compte.js).
--   • moniteurs créés AVANT le 2026-07-23 → gardent leur essai 14 j existant
--     (grandfather : on ne mure personne rétroactivement).
-- Un abonnement Stripe actif ungate TOUJOURS, quelle que soit la date de création.
-- Exemptions (@test.fr / is_internal) et grants/search_path inchangés.
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

  -- Abonnement Stripe actif (subscriptions.user_id = auth_id) → jamais bloqué,
  -- peu importe la date de création (un moniteur qui paie à l'inscription passe ici).
  select exists(
    select 1 from subscriptions s
    where s.user_id = p.auth_id
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  ) into has_sub;
  if has_sub then
    return jsonb_build_object('gated', false, 'reason', 'subscribed');
  end if;

  -- Paywall à l'inscription : les moniteurs créés à partir du 2026-07-23 n'ont
  -- plus d'essai gratuit → verrouillés tant qu'aucun abonnement actif.
  if p.created_at >= timestamptz '2026-07-23 00:00:00+00' then
    return jsonb_build_object('gated', true, 'reason', 'signup_paywall');
  end if;

  -- Grandfather : essai gratuit 14 j pour les moniteurs d'avant le paywall —
  -- 14 j depuis max(inscription, lancement du paywall 18/07) → inchangé.
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
