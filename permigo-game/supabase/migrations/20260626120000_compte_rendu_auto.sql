-- ════════════════════════════════════════════════════════════════
-- 20260626120000 — Compte-rendu AUTOMATIQUE (moniteur → élève, in-app)
--
-- Avant : le « compte-rendu de leçon » n'entrait JAMAIS dans l'app. Le
-- moniteur cliquait un bouton qui ouvrait un partage WhatsApp/SMS externe
-- (sendCompteRendu) ; rien n'était stocké, l'élève ne recevait rien dans
-- PermiGo. Et « à retravailler » / « en cours » ne prévenaient pas l'élève.
--
-- Après : à la validation d'une séance, le compte-rendu part TOUT SEUL :
--   1. il est STOCKÉ (table comptes_rendus = historique consultable) ;
--   2. l'élève reçoit UNE notification `compte_rendu` (push compris) ;
--   3. chaque « à retravailler » crée automatiquement un DEVOIR
--      (revision_focus) que l'élève voit déjà sur son accueil.
--
-- Tout passe par des fonctions SECURITY DEFINER : la RLS `notifications`
-- (WITH CHECK user_id = get_my_id()) interdit au moniteur de notifier un
-- autre user depuis le client. Idem pour insérer dans comptes_rendus.
--
-- Lien élève↔moniteur = profiles.enseignant_id (cohérent revision_focus) ;
-- contrôle d'accès = même auto_ecole (cohérent validate_session).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Table comptes_rendus
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.comptes_rendus (
  id             uuid primary key default gen_random_uuid(),
  eleve_id       uuid not null references public.profiles(id) on delete cascade,
  moniteur_id    uuid not null references public.profiles(id) on delete cascade,
  session_date   date not null default current_date,
  acquis         text[] not null default '{}',     -- codes REMC validés
  en_cours       text[] not null default '{}',
  a_retravailler text[] not null default '{}',
  total_acquis   int,                              -- snapshot total acquis (tous temps)
  note           text,                             -- texte libre du moniteur
  body           text,                             -- texte rendu (partage WhatsApp + fallback)
  created_at     timestamptz not null default now(),
  read_at        timestamptz                       -- renseigné quand l'élève l'ouvre
);

comment on table public.comptes_rendus is
  'Compte-rendu de leçon envoyé automatiquement par le moniteur à l''élève (historique in-app). Aucune donnée perso : codes REMC + note courte.';
comment on column public.comptes_rendus.body is 'Texte rendu (joli) du compte-rendu, réutilisé pour le partage WhatsApp/SMS optionnel.';
comment on column public.comptes_rendus.read_at is 'Renseigné par l''élève via mark_compte_rendu_read quand il ouvre le compte-rendu.';

create index if not exists comptes_rendus_eleve_idx
  on public.comptes_rendus (eleve_id, created_at desc);
create index if not exists comptes_rendus_moniteur_idx
  on public.comptes_rendus (moniteur_id, created_at desc);

alter table public.comptes_rendus enable row level security;

-- Élève : lit ses propres comptes-rendus.
create policy "eleve lit ses comptes-rendus"
on public.comptes_rendus for select
to authenticated
using (eleve_id = (select public.current_profile_id()));

-- Moniteur : lit les comptes-rendus qu'il a émis.
create policy "moniteur lit ses comptes-rendus"
on public.comptes_rendus for select
to authenticated
using (moniteur_id = (select public.current_profile_id()));

-- Grants : SELECT seul. Aucun INSERT/UPDATE direct → tout via RPC SECURITY
-- DEFINER (defense-in-depth, même logique que revision_focus).
revoke all on public.comptes_rendus from anon;
grant select on public.comptes_rendus to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 2. RPC : l'élève marque un compte-rendu « lu » (read_at, sur SA ligne)
-- ─────────────────────────────────────────────────────────────────
create or replace function public.mark_compte_rendu_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.comptes_rendus
     set read_at = now()
   where id = p_id
     and eleve_id = current_profile_id()
     and read_at is null;
end;
$function$;

revoke execute on function public.mark_compte_rendu_read(uuid) from public, anon;
grant  execute on function public.mark_compte_rendu_read(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 3. Helper interne : crée un devoir (revision_focus) sans doublon
--    (un seul devoir OUVERT par (élève, compétence) à la fois).
-- ─────────────────────────────────────────────────────────────────
create or replace function public._upsert_revision_focus(
  p_eleve_id    uuid,
  p_moniteur_id uuid,
  p_code        text,
  p_note        text
) returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if not exists (
    select 1 from public.revision_focus
     where eleve_id = p_eleve_id
       and competence_code = p_code
       and done_at is null
  ) then
    insert into public.revision_focus (eleve_id, moniteur_id, competence_code, note)
    values (p_eleve_id, p_moniteur_id, p_code, p_note);
  end if;
end;
$function$;

revoke execute on function public._upsert_revision_focus(uuid, uuid, text, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 4. validate_session — version COMPTE-RENDU AUTO
--    ⚠️ On AJOUTE un paramètre (p_compte_rendu) → la signature change
--    (6 → 7 args). `create or replace` matche sur la signature : sans drop,
--    il CRÉERAIT un 2e overload et PostgREST ne saurait plus choisir
--    (PGRST203) → la validation casserait en prod. On drope donc d'abord
--    explicitement l'ancienne signature 6-args (et son grant authenticated).
-- ─────────────────────────────────────────────────────────────────
drop function if exists public.validate_session(uuid, date, text, text[], text[], text[]);

--    Ajoute p_compte_rendu (texte rendu côté client). Quand il est
--    fourni : crée la ligne comptes_rendus + UNE notif `compte_rendu`
--    (au lieu des notifs par-compétence comp_acquise) + les devoirs
--    pour chaque « à retravailler ». Sinon : comportement historique
--    (notif comp_acquise par compétence) conservé (rétro-compat).
-- ─────────────────────────────────────────────────────────────────
create or replace function public.validate_session(
  p_eleve_id        uuid,
  p_session_date    date    default current_date,
  p_note            text    default null,
  p_acquis          text[]  default null,
  p_en_cours        text[]  default null,
  p_a_retravailler  text[]  default null,
  p_compte_rendu    text    default null
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
as $function$
declare
  v_moniteur     uuid := current_profile_id();
  v_role         text;
  v_caller_ecole uuid;
  v_eleve_ecole  uuid;
  v_comp         text;
  v_prev         text;
  v_n_new        int := 0;
  v_total_acquis int := 0;
  v_cr_id        uuid;
  v_n_retr       int := 0;
begin
  if v_moniteur is null then raise exception 'not_authenticated'; end if;

  select role, auto_ecole_id into v_role, v_caller_ecole
    from public.profiles where id = v_moniteur;
  if v_role not in ('enseignant','gerant') then
    return jsonb_build_object('error','wrong_role');
  end if;

  select auto_ecole_id into v_eleve_ecole
    from public.profiles where id = p_eleve_id and role = 'eleve';
  if v_eleve_ecole is null or v_eleve_ecole is distinct from v_caller_ecole then
    return jsonb_build_object('error','eleve_not_in_ecole');
  end if;

  -- NB : aucune écriture dans sessions_moniteur (évite les 6 triggers
  -- + la boucle de confirmation 'pending'). Validations uniquement.

  if p_acquis is not null then
    foreach v_comp in array p_acquis loop
      select statut into v_prev from public.validations
        where eleve_id = p_eleve_id and competence_id = v_comp;

      insert into public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      values (p_eleve_id, v_comp, v_moniteur, now(), 'acquis', p_note)
      on conflict (eleve_id, competence_id) do update
        set statut = 'acquis', validated_by = v_moniteur, validated_at = now(),
            note_enseignant = coalesce(excluded.note_enseignant, public.validations.note_enseignant);

      if v_prev is distinct from 'acquis' then
        v_n_new := v_n_new + 1;
        -- Notif par-compétence SEULEMENT si on n'envoie pas de compte-rendu
        -- groupé (sinon double-notif → spam de la cloche).
        if p_compte_rendu is null then
          insert into public.notifications (user_id, type, title, body, data)
          values (p_eleve_id, 'comp_acquise', 'Compétence validée ✅',
                  v_comp || ' — validée par ton moniteur',
                  jsonb_build_object('competence_id', v_comp));
        end if;
      end if;
    end loop;
  end if;

  if p_en_cours is not null then
    foreach v_comp in array p_en_cours loop
      insert into public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      values (p_eleve_id, v_comp, v_moniteur, now(), 'en_cours', p_note)
      on conflict (eleve_id, competence_id) do update
        set statut = 'en_cours', validated_by = v_moniteur, validated_at = now()
        where public.validations.statut is distinct from 'acquis';
    end loop;
  end if;

  if p_a_retravailler is not null then
    foreach v_comp in array p_a_retravailler loop
      insert into public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
      values (p_eleve_id, v_comp, v_moniteur, now(), 'a_retravailler', p_note)
      on conflict (eleve_id, competence_id) do update
        set statut = 'a_retravailler', validated_by = v_moniteur, validated_at = now()
        where public.validations.statut is distinct from 'acquis';

      -- « À retravailler » → devoir automatique (l'élève le voit sur l'accueil).
      perform public._upsert_revision_focus(p_eleve_id, v_moniteur, v_comp, p_note);
      v_n_retr := v_n_retr + 1;
    end loop;
  end if;

  -- ── Compte-rendu groupé : stocké + UNE notif (push compris) ──
  if p_compte_rendu is not null then
    select count(*) into v_total_acquis
      from public.validations
     where eleve_id = p_eleve_id and statut = 'acquis';

    insert into public.comptes_rendus
      (eleve_id, moniteur_id, session_date, acquis, en_cours, a_retravailler, total_acquis, note, body)
    values
      (p_eleve_id, v_moniteur, coalesce(p_session_date, current_date),
       coalesce(p_acquis, '{}'), coalesce(p_en_cours, '{}'), coalesce(p_a_retravailler, '{}'),
       v_total_acquis, p_note, p_compte_rendu)
    returning id into v_cr_id;

    insert into public.notifications (user_id, type, title, body, data)
    values (
      p_eleve_id, 'compte_rendu', 'Compte-rendu de ta leçon 📋',
      case
        when v_n_new > 0 and v_n_retr > 0
          then v_n_new || ' validée(s) · ' || v_n_retr || ' à retravailler'
        when v_n_new > 0
          then v_n_new || ' compétence(s) validée(s) par ton moniteur'
        when v_n_retr > 0
          then v_n_retr || ' compétence(s) à retravailler'
        else 'Ton moniteur a mis à jour ta progression'
      end,
      jsonb_build_object('compte_rendu_id', v_cr_id)
    );
  end if;

  return jsonb_build_object('ok', true, 'n_acquis_new', v_n_new, 'compte_rendu_id', v_cr_id);
end;
$function$;

revoke execute on function public.validate_session(uuid, date, text, text[], text[], text[], text) from public, anon;
grant  execute on function public.validate_session(uuid, date, text, text[], text[], text[], text) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 5. RPC set_competence_status — chemin LIVRET (correction par compétence)
--    Autorise la RÉTROGRADATION d'un « acquis » (ce que validate_session
--    interdit volontairement). Pour « à retravailler » : crée le devoir +
--    un compte-rendu d'1 compétence + notif (l'élève est prévenu). Pour
--    « en cours » : simple upsert neutre (pas de notif).
-- ─────────────────────────────────────────────────────────────────
create or replace function public.set_competence_status(
  p_eleve_id       uuid,
  p_competence_id  text,
  p_statut         text,
  p_note           text default null,
  p_compte_rendu   text default null
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
as $function$
declare
  v_moniteur     uuid := current_profile_id();
  v_role         text;
  v_caller_ecole uuid;
  v_eleve_ecole  uuid;
  v_cr_id        uuid;
begin
  if v_moniteur is null then raise exception 'not_authenticated'; end if;
  if p_statut not in ('acquis','en_cours','a_retravailler') then
    return jsonb_build_object('error','bad_statut');
  end if;

  select role, auto_ecole_id into v_role, v_caller_ecole
    from public.profiles where id = v_moniteur;
  if v_role not in ('enseignant','gerant') then
    return jsonb_build_object('error','wrong_role');
  end if;

  select auto_ecole_id into v_eleve_ecole
    from public.profiles where id = p_eleve_id and role = 'eleve';
  if v_eleve_ecole is null or v_eleve_ecole is distinct from v_caller_ecole then
    return jsonb_build_object('error','eleve_not_in_ecole');
  end if;

  -- Upsert SANS garde anti-rétrogradation (c'est l'outil de correction).
  insert into public.validations (eleve_id, competence_id, validated_by, validated_at, statut, note_enseignant)
  values (p_eleve_id, p_competence_id, v_moniteur, now(), p_statut, p_note)
  on conflict (eleve_id, competence_id) do update
    set statut = p_statut, validated_by = v_moniteur, validated_at = now(),
        note_enseignant = coalesce(excluded.note_enseignant, public.validations.note_enseignant);

  if p_statut = 'a_retravailler' then
    perform public._upsert_revision_focus(p_eleve_id, v_moniteur, p_competence_id, p_note);

    insert into public.comptes_rendus
      (eleve_id, moniteur_id, a_retravailler, note, body)
    values
      (p_eleve_id, v_moniteur, array[p_competence_id], p_note, p_compte_rendu)
    returning id into v_cr_id;

    insert into public.notifications (user_id, type, title, body, data)
    values (p_eleve_id, 'compte_rendu', 'À retravailler 📋',
            'Ton moniteur t''a laissé une compétence à retravailler',
            jsonb_build_object('compte_rendu_id', v_cr_id));
  end if;

  return jsonb_build_object('ok', true, 'compte_rendu_id', v_cr_id);
end;
$function$;

revoke execute on function public.set_competence_status(uuid, text, text, text, text) from public, anon;
grant  execute on function public.set_competence_status(uuid, text, text, text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 6. Push événementiel : activer le push pour le type `compte_rendu`.
--    (Le trigger n'envoyait le push que pour une allowlist de types ;
--     on y ajoute compte_rendu pour que l'élève soit notifié hors-app.)
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
  -- NB : consolidation_quiz est volontairement ABSENT (la fonction edge
  -- trigger-consolidation le pousse déjà directement → sinon double-push,
  -- cf. migration 20260625190200). On reprend cette allowlist + compte_rendu.
  v_type := coalesce(NEW.type, '');
  if v_type not in ('post_validation_quiz','streak_risk',
                    'student_at_risk','emotional_nudge','session_confirmation',
                    'compte_rendu') then
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
