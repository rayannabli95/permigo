-- ═══════════════════════════════════════════════════════════════
-- Nettoyage perf pré-lancement (issu de l'audit advisors 2026-06-16).
-- 100 % additif / sans impact sur les accès (RLS inchangée).
-- NON appliqué automatiquement — à appliquer ensemble.
-- ═══════════════════════════════════════════════════════════════

-- 1. Index dupliqué sur validations (deux index identiques) → on en garde un.
drop index if exists public.idx_validations_by_date;

-- 2. Clés étrangères sans index couvrant (advisor 0001) → on indexe.
create index if not exists idx_community_questions_competence
  on public.community_questions (competence_id);
create index if not exists idx_community_questions_moderated_by
  on public.community_questions (moderated_by);
create index if not exists idx_comp_bookmarks_competence
  on public.comp_bookmarks (competence_id);
create index if not exists idx_eleve_tags_created_by
  on public.eleve_tags (created_by);
create index if not exists idx_examens_created_by
  on public.examens (created_by);
create index if not exists idx_quiz_feedback_user
  on public.quiz_feedback (user_id);
create index if not exists idx_school_events_created_by
  on public.school_events (created_by);
create index if not exists idx_webhooks_subscriptions_created_by
  on public.webhooks_subscriptions (created_by);

-- NB : les ~35 index « inutilisés » signalés par l'advisor ne sont PAS supprimés
-- ici : la base est jeune (peu de trafic), ils serviront à l'échelle.
