-- i18n élève — traductions des questions de quiz (questions_competence)
-- Objectif : afficher chaque question dans la langue choisie par l'élève
-- (user_preferences.language) avec le français gardé dessous.
--
-- Le contenu source (français) reste dans questions_competence.
-- Ici on stocke UNIQUEMENT les traductions, par (question, langue).
-- Les `options` traduites sont dans l'ORDRE ORIGINAL (même index que
-- questions_competence.options) — le mélange à l'affichage applique la
-- même permutation aux deux, donc l'index correct reste aligné.

create table if not exists public.question_translations (
  question_id  uuid not null references public.questions_competence(id) on delete cascade,
  lang         text not null check (lang in ('en', 'ar')),
  question     text not null,
  options      jsonb not null,          -- array parallèle à questions_competence.options
  explanation  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (question_id, lang)
);

comment on table public.question_translations is
  'Traductions (en/ar) des questions_competence. Français = source dans questions_competence. options = même ordre que la source.';

-- RLS : lecture pour tout utilisateur connecté (identique à questions_competence).
-- Aucune policy d'écriture → contenu géré uniquement par migrations / service role.
alter table public.question_translations enable row level security;

create policy "translations_select"
  on public.question_translations
  for select
  to authenticated
  using (true);
