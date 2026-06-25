-- Radar de relance moniteur → notification in-app à l'élève (+ push web si
-- l'app est installée, via le trigger send_push_on_notification_insert).
-- Miroir de send_quiz_notification : seul un membre du staff (enseignant/gérant)
-- de la MÊME auto-école que l'élève peut envoyer. RLS notifications interdit
-- l'insert direct pour autrui (with_check user_id = get_my_id()) → SECURITY DEFINER.
create or replace function public.send_eleve_relance(p_eleve_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_caller uuid := current_profile_id();
  v_caller_role text;
  v_caller_ecole uuid;
  v_caller_nom text;
  v_eleve_ecole uuid;
  v_msg text := nullif(btrim(p_message), '');
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  select role, auto_ecole_id, nom
    into v_caller_role, v_caller_ecole, v_caller_nom
  from profiles where id = v_caller;

  if v_caller_role not in ('enseignant','gerant') then
    raise exception 'forbidden: only staff can send relances';
  end if;

  if v_msg is null then
    raise exception 'empty message';
  end if;

  select auto_ecole_id into v_eleve_ecole from profiles where id = p_eleve_id;

  if v_eleve_ecole is null or v_eleve_ecole is distinct from v_caller_ecole then
    raise exception 'forbidden: eleve not in your auto-ecole';
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    p_eleve_id,
    'relance',
    coalesce(nullif(v_caller_nom, ''), 'Ton moniteur') || ' t''encourage',
    left(v_msg, 400),
    jsonb_build_object('link', '#/parcours')
  );
end;
$function$;

revoke all on function public.send_eleve_relance(uuid, text) from public, anon;
grant execute on function public.send_eleve_relance(uuid, text) to authenticated;
