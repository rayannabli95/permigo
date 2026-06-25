-- La relance moniteur (RPC send_eleve_relance → notification type 'relance')
-- n'était PAS dans l'allowlist du trigger de push → elle restait in-app only.
-- On l'ajoute : l'élève reçoit désormais un web push « Ton moniteur t'encourage »
-- (dispatch-push v15 gère ce type via son payload générique : title/body de la
-- notif + route depuis data.link → #/parcours).
create or replace function public.send_push_on_notification_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_secret text;
  v_base   text;
  v_type   text;
begin
  v_type := coalesce(NEW.type, '');
  if v_type not in ('post_validation_quiz','streak_risk',
                    'student_at_risk','emotional_nudge','session_confirmation',
                    'relance') then
    return NEW;
  end if;

  select value into v_secret from app_config where key = 'DISPATCH_PUSH_SECRET';
  select value into v_base   from app_config where key = 'SUPABASE_FUNCTIONS_URL';

  if v_secret is null or v_base is null then
    raise warning '[send_push] app_config secret/url manquant';
    return NEW;
  end if;

  perform net.http_post(
    url     := v_base || '/dispatch-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', v_secret
    ),
    body    := jsonb_build_object(
      'secret',  v_secret,
      'user_id', NEW.user_id,
      'type',    NEW.type,
      'title',   NEW.title,
      'body',    NEW.body,
      'data',    coalesce(NEW.data, '{}'::jsonb)
    )
  );

  return NEW;
end;
$function$;
