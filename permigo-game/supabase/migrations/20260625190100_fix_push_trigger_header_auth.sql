-- ─────────────────────────────────────────────────────────────────────────
-- FIX push événementiel : le trigger envoyait le secret dans le BODY, alors
-- que dispatch-push n'accepte l'auth que par HEADER (x-cron-secret) ou
-- Authorization: Bearer SERVICE_KEY → 401 systématique (prouvé en live :
-- net._http_response = 13× {"error":"unauthorized"}, 0 succès). Résultat :
-- AUCUN push déclenché par INSERT notification ne partait (compétence validée,
-- consolidation, série, nudge, élève à risque, confirmation de séance).
--
-- Correctifs ici :
--   1. Passer le secret en HEADER `x-cron-secret` (on garde aussi 'secret' dans
--      le body pour rétro-compat). dispatch-push compare ce header à son env
--      DISPATCH_PUSH_SECRET (cf. déploiement edge function associé).
--   2. Transmettre title/body de la notif → dispatch-push peut désormais
--      pousser les types sans gabarit dédié (emotional_nudge, student_at_risk,
--      session_confirmation) avec le texte réel de la notif, au lieu de
--      renvoyer 400 unknown_type.
-- (search_path et allowlist conservés à l'identique.)
-- ─────────────────────────────────────────────────────────────────────────

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
  if v_type not in ('post_validation_quiz','consolidation_quiz','streak_risk',
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
      'x-cron-secret', v_secret           -- ⬅️ FIX : auth par header
    ),
    body    := jsonb_build_object(
      'secret',  v_secret,                -- conservé (rétro-compat)
      'user_id', NEW.user_id,
      'type',    NEW.type,
      'title',   NEW.title,               -- ⬅️ pour les types sans gabarit
      'body',    NEW.body,
      'data',    coalesce(NEW.data, '{}'::jsonb)
    )
  );

  return NEW;
end;
$function$;
