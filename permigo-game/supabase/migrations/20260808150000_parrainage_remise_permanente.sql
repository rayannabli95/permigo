-- ═══════════════════════════════════════════════════════════════
-- Parrainage : remplace le mois d'accès gratuit par une remise Stripe
-- permanente de 1 € (décision Rayan, 08/08/2026, suite à un vrai problème
-- identifié sur le design précédent).
--
-- Pourquoi le mois gratuit a été retiré : il ne demandait AUCUN paiement, ne
-- coûtait rien à personne d'en abuser (créer un compte, taper n'importe quel
-- code trouvé en ligne, profiter d'un mois entier d'accès), et pour un élève
-- ce mois pouvait couvrir toute sa période de révision → zéro conversion en
-- payeur réel possible sur ces comptes-là.
--
-- Nouveau principe : personne n'a jamais rien de gratuit, tout le monde paie,
-- juste moins cher. Impossible d'abuser sans sortir sa carte au moins une
-- fois.
--   · Le FILLEUL paie son premier abonnement à prix réduit (coupon Stripe
--     appliqué à la création de sa session de paiement, cf. pass-checkout /
--     stripe-checkout). Réduction permanente (duration=forever côté Stripe),
--     pas juste le premier mois.
--   · Le PARRAIN voit son propre abonnement passer au même tarif réduit,
--     appliqué en direct sur son abonnement Stripe existant, uniquement
--     quand son filleul règle ce premier paiement (cf. stripe-webhook).
--
-- Ce fichier ne touche QUE la partie base de données : il retire le crédit
-- bonus_access_until (remplacé par le coupon Stripe, géré côté edge
-- functions) et fait remonter l'auth_id du parrain pour que le webhook
-- puisse retrouver son abonnement Stripe. La colonne bonus_access_until et
-- les checks dans eleve_access_status()/moniteur_access_status() restent en
-- place (infra générique, inoffensive, potentiellement réutile pour un futur
-- mécanisme de bonus) mais ne sont plus alimentés par le parrainage.
-- ═══════════════════════════════════════════════════════════════

-- ── apply_referral() : plus de bonus_access_until, juste le lien + le cosmétique ──
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

  -- Marqueur d'audit uniquement : la vraie remise (coupon Stripe -1 €) se
  -- déclenche au premier paiement du filleul (pass-checkout / stripe-checkout),
  -- pas ici. Plus aucun accès gratuit accordé à l'application du code.
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
    'xp_gained', 200, 'gemmes_gained', 50);
end;
$function$;

-- ── grant_referral_conversion_reward() : renvoie l'auth_id du parrain pour
--    que le webhook puisse retrouver son abonnement Stripe et y appliquer
--    le coupon -1 €. N'écrit plus bonus_access_until : la remise se joue
--    entièrement côté Stripe désormais.
create or replace function public.grant_referral_conversion_reward(p_auth_user_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_referred_id     uuid;
  v_parrain_id      uuid;
  v_parrain_auth_id uuid;
  v_inserted        uuid;
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
  -- retries de livraison webhook). Le webhook n'applique donc le coupon au
  -- parrain qu'une seule fois, jamais en double.
  insert into referral_rewards (referrer_id, referred_id, reward_type)
  values (v_parrain_id, v_referred_id, 'referrer_conversion_bonus')
  on conflict (referred_id, reward_type) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return jsonb_build_object('ok', true, 'already_granted', true);
  end if;

  select auth_id into v_parrain_auth_id from profiles where id = v_parrain_id;

  insert into notifications (user_id, type, title, body, data) values (
    v_parrain_id, 'emotional_nudge',
    '💰 Ton parrainage a payé',
    'La personne que tu as parrainée vient de s''abonner à PermiGo. Ton abonnement passe à un tarif réduit, pour toujours !',
    jsonb_build_object('template_id', 'referral_conversion', 'tone', 'celebrate',
      'title', '💰 Ton parrainage a payé',
      'body', 'La personne que tu as parrainée vient de s''abonner à PermiGo. Ton abonnement passe à un tarif réduit, pour toujours !',
      'cta', 'Voir mon profil', 'route', '#/profil'));

  return jsonb_build_object(
    'ok', true, 'already_granted', false,
    'referrer_id', v_parrain_id, 'referrer_auth_id', v_parrain_auth_id
  );
end;
$function$;

-- ── get_my_referral_stats() : le bonus_access_until n'est plus alimenté par
--    le parrainage, on ne le montre plus dans la carte pour éviter d'afficher
--    un compteur mort. paid_referrals_count reste pertinent (filleuls
--    convertis, même sans savoir si le coupon Stripe a pu être posé).
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
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  select referral_code into v_code from profiles where id = v_user_id;
  select count(*)::int into v_count from profiles where referred_by = v_user_id;
  select count(*)::int into v_paid_count from referral_rewards
    where referrer_id = v_user_id and reward_type = 'referrer_conversion_bonus';

  return jsonb_build_object(
    'code', v_code,
    'referrals_count', v_count,
    'total_xp_earned', v_count * 200,
    'total_gemmes_earned', v_count * 50,
    'paid_referrals_count', v_paid_count
  );
end;
$function$;
