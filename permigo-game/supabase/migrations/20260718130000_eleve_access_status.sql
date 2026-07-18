-- Verrou d'accès ÉLÈVE SOLO : un élève sans moniteur (pas de code) doit avoir un
-- Pass payé. Élève rattaché à un moniteur = gratuit (le moniteur paie). Source de
-- vérité SERVEUR (le gate client lit ce statut). Grandfather : les élèves solo
-- déjà inscrits avant le lancement restent gratuits — seuls les NOUVEAUX paient.
-- Appliquée en prod le 2026-07-18.
create or replace function public.eleve_access_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
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
$$;

grant execute on function public.eleve_access_status() to authenticated;
