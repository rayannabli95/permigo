-- ═══════════════════════════════════════════════════════════════
-- PermiGo Game — Trigger prérequis pédagogiques avant validation
-- Vérifie 2 conditions UNIQUEMENT sur les nouvelles validations
-- (pas sur les re-validations via upsert ON CONFLICT DO UPDATE)
-- ═══════════════════════════════════════════════════════════════

-- ─── Fonction trigger ────────────────────────────────────────────
create or replace function public.check_validation_prerequisites()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_comp_nom text;
begin
  -- Ne s'applique pas aux re-validations (row déjà existante)
  if exists (
    select 1 from public.validations
    where eleve_id       = new.eleve_id
      and competence_id  = new.competence_id
  ) then
    return new;
  end if;

  -- Récupère le nom de la compétence pour les messages d'erreur
  select nom into v_comp_nom
  from public.competences_remc
  where id = new.competence_id;

  -- Garde-fou : compétence inconnue → laisse passer, la FK gérera
  if v_comp_nom is null then
    return new;
  end if;

  -- ── Prérequis 1 : session confirmée dans les 7 derniers jours ────
  -- sessions_moniteur a un CHECK natif session_date >= CURRENT_DATE - 7 days,
  -- donc toute ligne existante est déjà récente ; on filtre juste le statut.
  if not exists (
    select 1 from public.sessions_moniteur
    where eleve_id            = new.eleve_id
      and confirmation_status in ('confirmed', 'auto')
  ) then
    raise exception 'no_session'
      using
        errcode = 'P0001',
        detail  = 'Aucune session enregistrée pour cet élève dans les 7 derniers jours.',
        hint    = 'Enregistre la session de conduite avant de valider la compétence.';
  end if;

  -- ── Prérequis 2 : tentative de quiz sur cette compétence ─────────
  if not exists (
    select 1 from public.quiz_attempts
    where user_id       = new.eleve_id
      and competence_id = new.competence_id
  ) then
    raise exception 'no_quiz_attempt'
      using
        errcode = 'P0002',
        detail  = v_comp_nom,
        hint    = v_comp_nom;
  end if;

  return new;
end;
$$;

-- ─── Trigger ─────────────────────────────────────────────────────
-- Utilise DROP + CREATE pour idempotence (migration re-jouable)
drop trigger if exists validations_check_prerequisites on public.validations;

create trigger validations_check_prerequisites
  before insert on public.validations
  for each row execute function public.check_validation_prerequisites();

-- ─── Commentaires ────────────────────────────────────────────────
comment on function public.check_validation_prerequisites() is
  'Bloque une première validation REMC si : (1) aucune leçon dans les 7j (P0001 no_session) ou (2) aucun quiz_attempt sur cette compétence (P0002 no_quiz_attempt).';
