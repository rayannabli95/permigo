-- ═══════════════════════════════════════════════════════════════
-- Parrainage : récompense RÉELLE, déclenchée par un paiement confirmé.
--
-- Le parrainage existant (referral_code / referred_by / apply_referral)
-- ne récompensait qu'en XP + gemmes, versés dès l'usage du code, sans lien
-- avec un paiement. On garde ce bonus cosmétique (il reste une bonne carotte
-- immédiate) et on AJOUTE une couche réelle par-dessus :
--
--   · Le FILLEUL débloque 1 mois d'accès gratuit dès qu'il applique un code,
--     pour qu'il ait le temps de devenir accro avant de tomber sur le mur
--     de paiement (bonus_access_until, honoré par eleve_access_status() /
--     moniteur_access_status()).
--   · Le PARRAIN débloque 1 mois gratuit sur SON propre accès uniquement
--     quand son filleul CONFIRME un premier paiement réel (Pass Permis ou
--     abonnement moniteur) — jamais à l'inscription seule, pour éviter les
--     faux comptes. Déclenché par le webhook Stripe (service role) via
--     grant_referral_conversion_reward(), jamais par le client.
--
-- Le crédit d'accès se fait en base (bonus_access_until), PAS via Stripe :
-- aucune manipulation d'abonnement/coupon côté Stripe, donc aucun risque de
-- double remise ou de proration foireuse. Idempotent par construction : la
-- contrainte unique (referred_id, reward_type) empêche un même filleul de
-- déclencher deux fois la même récompense, même si le webhook Stripe livre
-- l'événement plusieurs fois (retry) ou sur chaque renouvellement.
-- ═══════════════════════════════════════════════════════════════

-- ── Colonne d'accès bonus (partagée élève/moniteur, même table profiles) ──
alter table public.profiles
  add column if not exists bonus_access_until timestamptz;

comment on column public.profiles.bonus_access_until is
  'Accès débloqué gratuitement par récompense (parrainage), indépendant de Stripe. Honoré par eleve_access_status() et moniteur_access_status() en plus d''un paiement réel.';

-- ── Journal des récompenses réelles (audit + idempotence) ──────────────
create table if not exists public.referral_rewards (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.profiles (id) on delete cascade,
  referred_id  uuid not null references public.profiles (id) on delete cascade,
  -- referred_signup_bonus  : 1 mois offert au filleul à l'application du code.
  -- referrer_conversion_bonus : 1 mois offert au parrain au 1er paiement confirmé du filleul.
  reward_type  text not null check (reward_type in ('referred_signup_bonus', 'referrer_conversion_bonus')),
  granted_at   timestamptz not null default now(),
  -- Un filleul ne peut déclencher chaque type de récompense qu'UNE fois dans
  -- toute sa vie, quel que soit le nombre d'événements Stripe reçus derrière.
  unique (referred_id, reward_type)
);

comment on table public.referral_rewards is
  'Journal des récompenses de parrainage réelles (accès bonus). Écrit uniquement par apply_referral() et grant_referral_conversion_reward() (SECURITY DEFINER / service role). Lecture seule côté client.';

create index if not exists referral_rewards_referrer_idx
  on public.referral_rewards (referrer_id);

alter table public.referral_rewards enable row level security;

-- drop + create (pas de CREATE POLICY IF NOT EXISTS en Postgres) : rend ce
-- fichier rejouable sans erreur si un essai précédent a déjà posé les policies.
drop policy if exists "owner reads all referral rewards" on public.referral_rewards;
create policy "owner reads all referral rewards"
  on public.referral_rewards
  for select
  to authenticated
  using (public.is_owner());

drop policy if exists "user reads own referral rewards" on public.referral_rewards;
create policy "user reads own referral rewards"
  on public.referral_rewards
  for select
  to authenticated
  using (
    referrer_id = public.current_profile_id()
    or referred_id = public.current_profile_id()
  );

-- Aucune policy INSERT/UPDATE/DELETE `to authenticated` : les écritures
-- passent exclusivement par les fonctions SECURITY DEFINER ci-dessous.
revoke insert, update, delete on public.referral_rewards from authenticated, anon;

-- ── apply_referral() : ajoute le bonus d'accès réel du filleul ─────────
create or replace function public.apply_referral(p_code text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user_id    uuid := current_profile_id();
  v_parrain_id uuid;
  v_claimed    uuid;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;

  select id into v_parrain_id from profiles where referral_code = upper(p_code);
  if v_parrain_id is null then return jsonb_build_object('error', 'invalid_code'); end if;
  if v_parrain_id = v_user_id then return jsonb_build_object('error', 'self_referral_not_allowed'); end if;

  perform _set_trusted_op();

  -- Pose atomique : ne réussit que si referred_by était NULL (1er appel gagnant).
  update profiles set referred_by = v_parrain_id
   where id = v_user_id and referred_by is null
   returning id into v_claimed;

  if v_claimed is null then
    return jsonb_build_object('error', 'already_referred');
  end if;

  update profiles set xp = coalesce(xp, 0) + 200, gemmes = coalesce(gemmes, 0) + 50
   where id in (v_user_id, v_parrain_id);

  -- Bonus réel : le filleul débloque 1 mois d'accès gratuit immédiatement.
  -- Cumulable (n'écrase jamais un bonus déjà plus long, ex : 2 codes appliqués
  -- par erreur ne peuvent pas arriver ici de toute façon car already_referred).
  update profiles
     set bonus_access_until = greatest(coalesce(bonus_access_until, now()), now()) + interval '1 month'
   where id = v_user_id;

  insert into referral_rewards (referrer_id, referred_id, reward_type)
  values (v_parrain_id, v_user_id, 'referred_signup_bonus')
  on conflict (referred_id, reward_type) do nothing;

  insert into notifications (user_id, type, title, body, data) values (
    v_parrain_id, 'emotional_nudge',
    '🎉 Quelqu''un t''a rejoint',
    'Un nouvel élève vient de rejoindre PermiGo avec ton code. +200 XP, +50 gemmes pour toi !',
    jsonb_build_object('template_id', 'referral_success', 'tone', 'celebrate',
      'title', '🎉 Quelqu''un t''a rejoint',
      'body', 'Un nouvel élève vient de rejoindre PermiGo avec ton code. +200 XP, +50 gemmes pour toi !',
      'cta', 'Voir mon profil', 'route', '#/profil'));

  return jsonb_build_object('ok', true, 'parrain_id', v_parrain_id,
    'xp_gained', 200, 'gemmes_gained', 50, 'bonus_months', 1);
end;
$function$;

-- ── grant_referral_conversion_reward() : appelée UNIQUEMENT par le webhook Stripe ──
create or replace function public.grant_referral_conversion_reward(p_auth_user_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_referred_id uuid;
  v_parrain_id  uuid;
  v_inserted    uuid;
begin
  if p_auth_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_user');
  end if;

  select id, referred_by into v_referred_id, v_parrain_id
    from profiles where auth_id = p_auth_user_id;

  if v_referred_id is null or v_parrain_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_referrer');
  end if;

  -- Idempotent : un seul crédit "conversion" par filleul, peu importe le
  -- nombre d'événements Stripe reçus (checkout initial + renouvellements +
  -- retries de livraison webhook).
  insert into referral_rewards (referrer_id, referred_id, reward_type)
  values (v_parrain_id, v_referred_id, 'referrer_conversion_bonus')
  on conflict (referred_id, reward_type) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return jsonb_build_object('ok', true, 'already_granted', true);
  end if;

  update profiles
     set bonus_access_until = greatest(coalesce(bonus_access_until, now()), now()) + interval '1 month'
   where id = v_parrain_id;

  insert into notifications (user_id, type, title, body, data) values (
    v_parrain_id, 'emotional_nudge',
    '💰 Ton parrainage a payé',
    'La personne que tu as parrainée vient de s''abonner à PermiGo. +1 mois offert sur ton compte !',
    jsonb_build_object('template_id', 'referral_conversion', 'tone', 'celebrate',
      'title', '💰 Ton parrainage a payé',
      'body', 'La personne que tu as parrainée vient de s''abonner à PermiGo. +1 mois offert sur ton compte !',
      'cta', 'Voir mon profil', 'route', '#/profil'));

  return jsonb_build_object('ok', true, 'already_granted', false, 'referrer_id', v_parrain_id, 'bonus_months', 1);
end;
$function$;

-- Verrou d'exposition : seul le webhook Stripe (service role) peut créditer
-- une récompense de conversion. Un utilisateur authentifié ne doit JAMAIS
-- pouvoir s'auto-créditer en appelant cette RPC avec un uuid arbitraire.
revoke all on function public.grant_referral_conversion_reward(uuid) from public, authenticated, anon;
grant execute on function public.grant_referral_conversion_reward(uuid) to service_role;

-- ── get_my_referral_stats() : expose le bonus réel en plus du cosmétique ──
create or replace function public.get_my_referral_stats()
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare
  v_user_id     uuid := current_profile_id();
  v_code        text;
  v_count       int;
  v_paid_count  int;
  v_bonus_until timestamptz;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  select referral_code, bonus_access_until into v_code, v_bonus_until
    from profiles where id = v_user_id;
  select count(*)::int into v_count from profiles where referred_by = v_user_id;
  select count(*)::int into v_paid_count from referral_rewards
    where referrer_id = v_user_id and reward_type = 'referrer_conversion_bonus';

  return jsonb_build_object(
    'code', v_code,
    'referrals_count', v_count,
    'total_xp_earned', v_count * 200,
    'total_gemmes_earned', v_count * 50,
    'paid_referrals_count', v_paid_count,
    'bonus_access_until', v_bonus_until
  );
end;
$function$;

-- ── eleve_access_status() : honore le bonus avant le mur de paiement ────
create or replace function public.eleve_access_status()
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare
  p profiles%rowtype;
  v_email text;
  has_pass boolean;
begin
  select * into p from profiles where auth_id = auth.uid();
  if not found or p.role <> 'eleve' then
    return jsonb_build_object('gated', false, 'reason', 'not_eleve');
  end if;

  -- Rattaché à un moniteur (code utilisé) → gratuit, le moniteur paie pour lui.
  if p.enseignant_id is not null then
    return jsonb_build_object('gated', false, 'reason', 'via_moniteur');
  end if;

  -- Comptes de dev/test → jamais bloqués.
  if coalesce(p.is_internal, false)
     or p.email ilike '%@test.fr'
     or p.email ilike '%permigo-test%' then
    return jsonb_build_object('gated', false, 'reason', 'internal');
  end if;

  -- Bonus de parrainage actif (code appliqué, ou filleul devenu payeur pour
  -- un parrain) → accès ouvert tant qu'il n'est pas expiré.
  if p.bonus_access_until is not null and p.bonus_access_until > now() then
    return jsonb_build_object('gated', false, 'reason', 'referral_bonus');
  end if;

  -- Élèves solo déjà inscrits avant le lancement → grandfathered (gratuits à vie).
  if p.created_at < timestamptz '2026-07-18 00:00:00+00' then
    return jsonb_build_object('gated', false, 'reason', 'grandfathered');
  end if;

  -- Pass payé (matché par user_id OU email confirmé) → accès.
  select lower(email) into v_email
    from auth.users where id = p.auth_id and email_confirmed_at is not null;
  select exists(
    select 1 from pass_purchases pp
    where pp.status = 'paid'
      and (pp.user_id = p.auth_id
           or (v_email is not null and lower(pp.email) = v_email))
  ) into has_pass;
  if has_pass then
    return jsonb_build_object('gated', false, 'reason', 'pass');
  end if;

  -- Solo, nouveau, sans Pass → mur de paiement.
  return jsonb_build_object('gated', true, 'reason', 'solo_no_pass');
end;
$function$;

-- ── moniteur_access_status() : idem côté moniteur ───────────────────────
create or replace function public.moniteur_access_status()
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare
  p profiles%rowtype;
  trial_end timestamptz;
  has_sub boolean;
begin
  select * into p from profiles where auth_id = auth.uid();
  if not found or p.role <> 'enseignant' then
    return jsonb_build_object('gated', false, 'reason', 'not_moniteur');
  end if;

  if coalesce(p.is_internal, false)
     or p.email ilike '%@test.fr'
     or p.email ilike '%permigo-test%' then
    return jsonb_build_object('gated', false, 'reason', 'internal');
  end if;

  -- Bonus de parrainage actif (chaque élève payant amené = 1 mois offert)
  -- → accès ouvert tant qu'il n'est pas expiré, avant même de checker Stripe.
  if p.bonus_access_until is not null and p.bonus_access_until > now() then
    return jsonb_build_object('gated', false, 'reason', 'referral_bonus');
  end if;

  select exists(
    select 1 from subscriptions s
    where s.user_id = p.auth_id
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  ) into has_sub;
  if has_sub then
    return jsonb_build_object('gated', false, 'reason', 'subscribed');
  end if;

  if p.created_at >= timestamptz '2026-07-23 00:00:00+00' then
    return jsonb_build_object('gated', true, 'reason', 'signup_paywall');
  end if;

  trial_end := greatest(p.created_at, timestamptz '2026-07-18 00:00:00+00') + interval '14 days';
  return jsonb_build_object(
    'gated', now() >= trial_end,
    'reason', 'trial',
    'trial_ends_at', trial_end,
    'days_left', greatest(0, ceil(extract(epoch from (trial_end - now())) / 86400.0))::int
  );
end;
$function$;
