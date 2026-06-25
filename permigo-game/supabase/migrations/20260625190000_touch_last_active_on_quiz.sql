-- ─────────────────────────────────────────────────────────────────────────
-- FIX rétention : rafraîchir profiles.last_active_at à l'activité réelle.
--
-- Constat (audit notifs 2026-06-25) : last_active_at n'était écrit NULLE PART
-- (ni trigger, ni RPC, ni client). Il gardait sa valeur DEFAULT now() posée à
-- l'inscription et vieillissait tout seul. Conséquences :
--   • dispatch-push (mode daily) classe les élèves sur last_active_at :
--     un élève qui révise tous les jours mais inscrit depuis >3 j est vu
--     « parti depuis N jours » → il ne reçoit JAMAIS la « question du jour »,
--     et reçoit à tort les relances « ça fait N jours » (jours 3/7/14).
--   • mes-élèves / insights / relances / pulse gérant affichent une
--     « dernière activité » fausse.
--
-- Fix : un trigger AFTER INSERT sur quiz_attempts (le signal d'engagement le
-- plus fort) repose last_active_at = now(). Borné à 1×/jour/élève pour ne pas
-- gonfler audit_log (le trigger _log_audit journalise chaque UPDATE profiles)
-- et limiter le write amplification. protect_profile_fields n'est pas un
-- obstacle : il sort tôt quand pg_trigger_depth() > 1 (cas d'un trigger imbriqué).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.touch_last_active_on_quiz()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.profiles
     set last_active_at = now()
   where id = NEW.user_id
     and (last_active_at is null or last_active_at < date_trunc('day', now()));
  return NEW;
end;
$function$;

drop trigger if exists trg_touch_last_active on public.quiz_attempts;
create trigger trg_touch_last_active
  after insert on public.quiz_attempts
  for each row execute function public.touch_last_active_on_quiz();

-- Backfill une fois : recaler last_active_at sur la vraie dernière activité quiz
-- (sinon les élèves déjà actifs restent « périmés » jusqu'à leur prochain quiz).
update public.profiles p
   set last_active_at = greatest(p.last_active_at, q.last_quiz)
  from (
    select user_id, max(completed_at) as last_quiz
    from public.quiz_attempts
    group by user_id
  ) q
 where q.user_id = p.id
   and q.last_quiz is not null
   and (p.last_active_at is null or p.last_active_at < q.last_quiz);
