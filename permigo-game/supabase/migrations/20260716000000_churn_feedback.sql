-- ═══════════════════════════════════════════════════════════════
-- Questionnaire de départ (résiliation / demande de remboursement).
-- Décision Rayan 15/07/2026 : quand quelqu'un part, on collecte le POURQUOI
-- (trop lent, pas assez de questions, pas assez varié, trop cher…) pour
-- améliorer l'app. Page publique #/avis-depart → INSERT ici.
--
-- Lecture : owner uniquement. Écriture : tout le monde (page publique),
-- bornée par des contraintes de taille (anti-abus simple).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.churn_feedback (
  id         uuid primary key default gen_random_uuid(),
  -- Rempli si la personne était connectée au moment de l'envoi.
  user_id    uuid references auth.users (id) on delete set null,
  email      text,
  reasons    text[] not null default '{}',
  details    text,
  created_at timestamptz not null default now(),
  constraint churn_feedback_email_len   check (char_length(coalesce(email, '')) <= 200),
  constraint churn_feedback_details_len check (char_length(coalesce(details, '')) <= 2000),
  constraint churn_feedback_reasons_max check (coalesce(array_length(reasons, 1), 0) <= 10)
);

comment on table public.churn_feedback is
  'Raisons de départ (résiliation/remboursement) collectées via #/avis-depart. Lecture owner only.';

alter table public.churn_feedback enable row level security;

-- Tout le monde peut déposer un avis de départ (page publique).
create policy "anyone submits churn feedback"
  on public.churn_feedback
  for insert
  to anon, authenticated
  with check (true);

-- Seul l'owner lit (analyse produit).
create policy "owner reads churn feedback"
  on public.churn_feedback
  for select
  to authenticated
  using (public.is_owner());

revoke update, delete on public.churn_feedback from anon, authenticated;
