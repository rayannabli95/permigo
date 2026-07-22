-- Répare la notification push des comptes-rendus de leçon.
--
-- Historique : 20260626120000_compte_rendu_auto.sql avait ajouté 'compte_rendu'
-- à l'allowlist du trigger push, puis 20260626130000_push_trigger_add_relance.sql
-- a recréé la fonction depuis une version antérieure et l'a fait disparaître
-- (écrasement non intentionnel — son commentaire ne mentionne pas ce type).
-- Depuis, le moment « Débriefer » de la boucle n'envoie plus aucun push,
-- seulement une notif in-app.
--
-- Ce correctif repart du corps EXACT de la fonction en prod (pg_get_functiondef,
-- vérifié le 22/07/2026) et ne change QUE l'allowlist :
--   + compte_rendu  (compte-rendu de leçon envoyé par le moniteur — régression)
--   + comp_acquise  (compétence validée par le moniteur en séance — moment fort,
--                    jamais poussé jusqu'ici, demande « plus de notifications élève »)

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
                    'relance','compte_rendu','comp_acquise') then
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
