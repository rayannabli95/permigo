-- ════════════════════════════════════════════════════════════════
-- 20260730120000 — Retrait de l'ÉMISSION moniteur → élève (lot 4 du pivot)
--
-- Décision Rayan (30/07/2026). Le pivot du 17/07 fait de l'élève le moteur :
-- il certifie lui-même ses compétences (self_validations). Le moniteur est
-- OBSERVATEUR — il ne doit plus rien pouvoir écrire qui atterrisse chez
-- l'élève. Le front a été retiré en même temps (pages, boutons, bannières) ;
-- cette migration ferme la porte côté SERVEUR, sinon un vieux bundle en cache
-- ou un appel direct à l'API pourrait encore émettre.
--
-- CE QU'ON COUPE (4 émetteurs) :
--   1. validate_session        — validation de séance → validations +
--                                comptes_rendus + notif + push
--   2. set_competence_status   — statut par compétence → devoir + compte-rendu
--                                + notif
--   3. send_flash_quiz         — « quiz éclair » 3 questions / 5 min + notif
--   4. INSERT direct sur revision_focus par le moniteur (devoir imposé)
--   + le type `compte_rendu` sort de l'allowlist du push événementiel.
--
-- CE QU'ON GARDE VOLONTAIREMENT :
--   · send_eleve_relance — décision Rayan : un message d'encouragement humain,
--     qui ne bloque rien dans le cycle de l'élève. Ce n'est pas de la saisie
--     pédagogique.
--   · Les DONNÉES existantes : 612 validations, 36 comptes-rendus, 156 devoirs.
--     On n'efface RIEN. `validations` est lue par une quinzaine d'écrans élève
--     (c'est le socle de sa progression) — la supprimer effacerait la
--     progression visible d'élèves réels. On arrête d'écrire, pas de lire.
--   · Les tables comptes_rendus / flash_quizzes et leurs policies SELECT :
--     l'historique reste lisible en base (audit, support), il n'est simplement
--     plus affiché dans l'app.
--
-- MÉTHODE : on RÉVOQUE l'exécution au rôle `authenticated` plutôt que de
-- DROP les fonctions. Deux raisons : (a) réversible en une ligne si Rayan
-- change d'avis, (b) un DROP casserait toute dépendance oubliée (trigger,
-- vue, autre fonction) alors qu'un REVOKE échoue proprement côté client.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Les 3 RPC d'émission : plus exécutables par un client connecté
-- ─────────────────────────────────────────────────────────────────
revoke execute on function
  public.validate_session(uuid, date, text, text[], text[], text[], text)
  from authenticated;

revoke execute on function
  public.set_competence_status(uuid, text, text, text, text)
  from authenticated;

do $$
begin
  -- send_flash_quiz : signature non garantie identique en prod (fonction
  -- héritée d'une migration archivée) → on révoque sur TOUTES ses surcharges.
  perform 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'send_flash_quiz';
  if found then
    execute (
      select string_agg(
        format('revoke execute on function public.%I(%s) from authenticated;',
               p.proname, pg_get_function_identity_arguments(p.oid)),
        E'\n')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'send_flash_quiz'
    );
  end if;
end $$;

comment on function public.validate_session(uuid, date, text, text[], text[], text[], text) is
  'RETIRÉE du produit le 30/07/2026 (lot 4 du pivot) : le moniteur n''évalue plus, l''élève certifie lui-même. Execute révoqué à authenticated. Conservée pour réversibilité et pour l''historique des données déjà écrites.';

comment on function public.set_competence_status(uuid, text, text, text, text) is
  'RETIRÉE du produit le 30/07/2026 (lot 4 du pivot) : voir validate_session. Execute révoqué à authenticated.';

-- ─────────────────────────────────────────────────────────────────
-- 2. revision_focus : le moniteur n'impose plus de devoir
--    (le composant « cibler une révision » faisait un INSERT direct)
-- ─────────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select polname
      from pg_policies
     where schemaname = 'public'
       and tablename  = 'revision_focus'
       and cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.revision_focus', r.polname);
  end loop;
end $$;

revoke insert, update, delete on public.revision_focus from authenticated;

comment on table public.revision_focus is
  'Devoirs « à retravailler » de l''élève. Depuis le 30/07/2026 (lot 4 du pivot) plus AUCUNE écriture client : le moniteur n''impose plus de devoir. Les 156 lignes existantes restent lisibles et cochables par l''élève (done_at passe par sa propre RPC).';

-- ─────────────────────────────────────────────────────────────────
-- 3. Push événementiel : `compte_rendu` sort de l'allowlist
--    (aucun ne sera plus inséré, mais on ne laisse pas un chemin ouvert)
-- ─────────────────────────────────────────────────────────────────
create or replace function public.send_push_on_notification_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_secret text;
  v_base   text;
  v_type   text;
begin
  -- NB : consolidation_quiz volontairement ABSENT (trigger-consolidation
  -- pousse déjà directement → sinon double-push, cf. 20260625190200).
  -- ⚠️ Liste RELEVÉE EN PROD le 30/07/2026 (elle contenait `comp_acquise`,
  -- ajouté par une migration absente du repo — ne pas la reconstruire de
  -- mémoire depuis les fichiers). On en retire les 2 types que seul le
  -- moniteur émettait : `compte_rendu` et `comp_acquise`. Tout le reste est
  -- conservé à l'identique, `relance` compris (décision Rayan : on la garde).
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
