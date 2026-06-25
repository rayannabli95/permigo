-- Anti double-push : consolidation_quiz est DÉJÀ poussé par l'edge function
-- trigger-consolidation (appel direct dispatch-push en Bearer SERVICE_KEY).
-- Maintenant que le trigger DB s'authentifie aussi (fix 401), garder
-- consolidation_quiz dans son allowlist provoquerait 2 pushs par notif.
-- → on le retire de l'allowlist du trigger DB ; trigger-consolidation reste
--   l'unique émetteur de ce push.
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
                    'student_at_risk','emotional_nudge','session_confirmation') then
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
