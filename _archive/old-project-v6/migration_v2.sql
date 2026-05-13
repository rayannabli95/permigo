-- ═══════════════════════════════════════════════════════════
-- PermiGo — Migration v2
-- Colle dans Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Colonnes supplémentaires sur events
-- ─────────────────────────────────────────────
alter table events add column if not exists eleve_id    uuid references profiles(id) on delete set null;
alter table events add column if not exists moniteur_id uuid references profiles(id) on delete set null;
alter table events add column if not exists type_event  varchar(50);

-- ─────────────────────────────────────────────
-- 2. Table inscriptions (parcours élève)
-- ─────────────────────────────────────────────
create table if not exists inscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  eleve_id              uuid references profiles(id) on delete cascade,
  moniteur_principal_id uuid references profiles(id) on delete set null,
  inscription_date      timestamptz default now(),
  forfait_heures        int default 20,
  statut                varchar(50) default 'en_cours',
  date_examen           date,
  result_examen         varchar(50),
  created_at            timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 3. Table eleve_stats (calculée depuis events)
-- ─────────────────────────────────────────────
create table if not exists eleve_stats (
  id                  uuid primary key default uuid_generate_v4(),
  eleve_id            uuid references profiles(id) on delete cascade unique,
  heures_suivies      numeric default 0,
  heures_planifiees   numeric default 20,
  presence_percent    numeric,
  etat                varchar(50) default 'nouveau',
  nb_absences         int default 0,
  updated_at          timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 4. Fonction de recalcul des stats élève
-- ─────────────────────────────────────────────
create or replace function recalculate_eleve_stats(p_eleve_id uuid)
returns void language plpgsql security definer as $$
declare
  v_heures    numeric;
  v_absences  int;
  v_etat      varchar(50);
  v_presence  numeric;
  v_forfait   int;
begin
  select coalesce(forfait_h, 20) into v_forfait
  from profiles where id = p_eleve_id;

  select coalesce(sum(dur), 0) into v_heures
  from events
  where eleve_id = p_eleve_id
    and is_deleted is not true
    and type_event = 'leçon';

  select count(*) into v_absences
  from events
  where eleve_id = p_eleve_id
    and is_deleted is not true
    and type_event = 'absence';

  v_presence := case when v_heures > 0 then round((v_heures / v_forfait) * 100, 1) else null end;

  v_etat := case
    when v_heures >= 20 then 'prêt_examen'
    when v_heures >= 10 then 'en_formation'
    else 'nouveau'
  end;

  insert into eleve_stats (eleve_id, heures_suivies, heures_planifiees, presence_percent, etat, nb_absences, updated_at)
  values (p_eleve_id, v_heures, v_forfait, v_presence, v_etat, v_absences, now())
  on conflict (eleve_id) do update set
    heures_suivies    = excluded.heures_suivies,
    heures_planifiees = excluded.heures_planifiees,
    presence_percent  = excluded.presence_percent,
    etat              = excluded.etat,
    nb_absences       = excluded.nb_absences,
    updated_at        = now();
end;
$$;

-- ─────────────────────────────────────────────
-- 5. Trigger auto-recalcul après chaque event
-- ─────────────────────────────────────────────
create or replace function trigger_recalc_stats()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.eleve_id is not null then
      perform recalculate_eleve_stats(OLD.eleve_id);
    end if;
  else
    if NEW.eleve_id is not null then
      perform recalculate_eleve_stats(NEW.eleve_id);
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_recalc_stats on events;
create trigger trg_recalc_stats
  after insert or update or delete on events
  for each row execute function trigger_recalc_stats();

-- ─────────────────────────────────────────────
-- 6. RLS nouvelles tables
-- ─────────────────────────────────────────────
alter table inscriptions enable row level security;
alter table eleve_stats   enable row level security;

drop policy if exists "inscriptions_select" on inscriptions;
create policy "inscriptions_select" on inscriptions for select using (
  eleve_id    = (select id from profiles where auth_id = auth.uid())
  or moniteur_principal_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) = 'admin'
);
drop policy if exists "inscriptions_all" on inscriptions;
create policy "inscriptions_all" on inscriptions for all using (
  (select role from profiles where auth_id = auth.uid()) in ('admin','moniteur')
);

drop policy if exists "eleve_stats_select" on eleve_stats;
create policy "eleve_stats_select" on eleve_stats for select using (
  eleve_id = (select id from profiles where auth_id = auth.uid())
  or (select role from profiles where auth_id = auth.uid()) in ('admin','moniteur')
);

-- ─────────────────────────────────────────────
-- 7. Initialiser eleve_stats pour les 3 élèves
-- ─────────────────────────────────────────────
insert into eleve_stats (eleve_id, heures_suivies, heures_planifiees, presence_percent, etat, nb_absences)
select id, 0, coalesce(forfait_h,20), null, 'nouveau', 0
from profiles where role = 'eleve'
on conflict (eleve_id) do nothing;

-- ─────────────────────────────────────────────
-- 8. Inscriptions initiales (Elyne + Sherine avec Rayan, Latifa avec Lassaad)
-- ─────────────────────────────────────────────
insert into inscriptions (eleve_id, moniteur_principal_id, forfait_heures, statut)
select
  e.id as eleve_id,
  case
    when e.nom in ('Elyne Semaan','Sherine Nabli') then
      (select id from profiles where nom = 'Rayan Nabli' limit 1)
    else
      (select id from profiles where nom = 'Lassaad Sahli' limit 1)
  end as moniteur_principal_id,
  20,
  'en_cours'
from profiles e
where e.role = 'eleve'
on conflict do nothing;
