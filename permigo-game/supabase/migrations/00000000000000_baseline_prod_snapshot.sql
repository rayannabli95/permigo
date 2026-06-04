-- =====================================================================
-- BASELINE SNAPSHOT — état réel de la prod PermiGo
-- Projet Supabase : arrfmdagdqtrtfbhxlty (eu-west-1)
-- Généré par introspection read-only le 2026-06-04
-- =====================================================================
-- Ce fichier remplace l'ancien historique idéalisé (archivé dans
-- _archive_legacy/). Il décrit l'état réel appliqué en prod au moment
-- du resync. Les anciennes migrations 0000->0026 ne reflétaient PAS la
-- prod (115 migrations réelles, noms différents, numéros dupliqués).
--
-- NB replay : ce dump documente un schéma DÉJÀ appliqué. Si tu fais un
-- `supabase db reset` local, l'ordre fonctions->matview->triggers est
-- pensé pour rejouer, mais certaines fns SQL pourraient dépendre d'un
-- ordre fin non garanti ici. Pour la prod, ne PAS rejouer : prod l'a déjà.
-- Objets attendus : 44 tables, 156 fonctions, 36 triggers, 1 matview,
-- 72 policies RLS, 23 jobs pg_cron.
-- =====================================================================

-- ============ EXTENSIONS ============
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ============ TABLES (44) ============
CREATE TABLE public.achievements_unlocked (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  bonus_xp integer NOT NULL DEFAULT 0,
  bonus_gemmes integer NOT NULL DEFAULT 0,
  metadata jsonb
);

CREATE TABLE public.app_config (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.auto_ecoles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  slug text,
  ville text,
  abonnement_status text NOT NULL DEFAULT 'beta'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.chest_unlocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chest_type text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  opened_at timestamp with time zone,
  rewards jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.community_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposed_by uuid NOT NULL,
  competence_id text NOT NULL,
  question text NOT NULL,
  choices jsonb NOT NULL,
  correct_idx integer NOT NULL,
  explanation text,
  status text NOT NULL DEFAULT 'pending'::text,
  moderated_by uuid,
  moderated_at timestamp with time zone,
  moderation_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.comp_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  competence_id text NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.competences_remc (
  id text NOT NULL,
  code text NOT NULL,
  nom text NOT NULL,
  description text,
  monde integer,
  ordre integer,
  prerequis text[] DEFAULT ARRAY[]::text[]
);

CREATE TABLE public.daily_quests_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  quest_id text NOT NULL,
  target integer NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_gemmes integer NOT NULL DEFAULT 0,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.eleve_daily_snapshot (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  n_comp_acquises integer NOT NULL DEFAULT 0,
  total_xp integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  validations_24h integer NOT NULL DEFAULT 0,
  quiz_24h integer NOT NULL DEFAULT 0,
  avg_score_30d numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.eleve_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL,
  target_exam_date date,
  target_comp_per_week integer,
  motivation_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.eleve_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL,
  tag text NOT NULL,
  color text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.events_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  session_id text,
  created_at timestamp with time zone DEFAULT now(),
  auto_ecole_id uuid,
  role text,
  ts timestamp with time zone DEFAULT now()
);

CREATE TABLE public.exam_blanc_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  questions jsonb NOT NULL,
  answers jsonb,
  score integer,
  duration_sec integer
);

CREATE TABLE public.experiment_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  experiment_key text NOT NULL,
  variant text NOT NULL,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.experiments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experiment_key text NOT NULL,
  name text NOT NULL,
  description text,
  variants text[] NOT NULL,
  weights integer[] NOT NULL,
  active boolean NOT NULL DEFAULT true,
  target_role text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone
);

CREATE TABLE public.feature_flags (
  key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  target_role text,
  rollout_pct integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.flash_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sent_by uuid NOT NULL,
  sent_to uuid NOT NULL,
  competence_id text NOT NULL,
  question_ids uuid[] NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:05:00'::interval),
  responded_at timestamp with time zone,
  score integer,
  results jsonb
);

CREATE TABLE public.incident_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'medium'::text,
  title text NOT NULL,
  description text NOT NULL,
  url text,
  user_agent text,
  status text NOT NULL DEFAULT 'new'::text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auto_ecole_id uuid,
  email text NOT NULL,
  role text NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  accepted_at timestamp with time zone,
  enseignant_attitre_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.items_catalog (
  id text NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  cost_gemmes integer NOT NULL,
  rarity text NOT NULL DEFAULT 'commun'::text,
  asset_url text,
  display_color text,
  ordre integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ecole_nom text NOT NULL,
  ville text,
  nb_enseignants integer,
  email text NOT NULL,
  telephone text,
  status text DEFAULT 'nouveau'::text,
  source text DEFAULT 'landing'::text,
  message text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.lecons_realisees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eleve_id uuid,
  enseignant_id uuid,
  date_lecon date NOT NULL,
  duree_heures numeric(3,1),
  competences_validees text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.message_templates (
  id text NOT NULL,
  emoji text NOT NULL,
  body text NOT NULL,
  unlock_at_n_validations integer NOT NULL DEFAULT 0,
  unlock_at_level integer NOT NULL DEFAULT 1,
  category text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  thread_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.moniteur_paliers (
  palier integer NOT NULL,
  threshold integer NOT NULL,
  title text NOT NULL,
  reward_label text NOT NULL,
  reward_type text NOT NULL,
  reward_icon text,
  mystery boolean NOT NULL DEFAULT false
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.questions_competence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  competence_id text,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text,
  difficulty integer DEFAULT 2,
  type text DEFAULT 'post_validation'::text
);

CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  competence_id text,
  type text NOT NULL,
  questions_ids uuid[],
  answers_indices integer[],
  score integer,
  duration_seconds integer,
  completed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quiz_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid,
  competence_id text,
  difficulty integer NOT NULL,
  was_correct boolean,
  feedback_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.rate_limit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.remc_questions (
  id text NOT NULL,
  competence_id text,
  question text NOT NULL,
  choices jsonb NOT NULL,
  correct_idx integer NOT NULL,
  explanation text,
  type text,
  difficulty integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.school_daily_snapshot (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auto_ecole_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  n_eleves integer NOT NULL DEFAULT 0,
  n_moniteurs integer NOT NULL DEFAULT 0,
  validations_24h integer NOT NULL DEFAULT 0,
  quiz_24h integer NOT NULL DEFAULT 0,
  sessions_h_24h numeric NOT NULL DEFAULT 0,
  eleves_at_risk integer NOT NULL DEFAULT 0,
  eleves_proches_examen integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.school_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  created_by uuid,
  title text NOT NULL,
  description text,
  event_date date,
  category text DEFAULT 'info'::text,
  active boolean NOT NULL DEFAULT true,
  notif_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sessions_moniteur (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moniteur_id uuid NOT NULL,
  eleve_id uuid NOT NULL,
  duration_minutes integer NOT NULL,
  session_date date NOT NULL,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmation_status text NOT NULL DEFAULT 'pending'::text,
  confirmed_at timestamp with time zone,
  flagged boolean NOT NULL DEFAULT false,
  notes text
);

CREATE TABLE public.streak_freezes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  frozen_date date NOT NULL,
  cost_gemmes integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.streaks (
  user_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  frozen_until date,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  paid_gemmes integer
);

CREATE TABLE public.user_preferences (
  user_id uuid NOT NULL,
  theme text,
  language text DEFAULT 'fr'::text,
  notif_email boolean DEFAULT true,
  notif_push boolean DEFAULT true,
  notif_in_app boolean DEFAULT true,
  dnd_start time without time zone,
  dnd_end time without time zone,
  marketing_optin boolean DEFAULT false,
  custom jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eleve_id uuid,
  competence_id text,
  validated_by uuid,
  validated_at timestamp with time zone DEFAULT now(),
  statut text DEFAULT 'acquis'::text,
  score_cognitif integer,
  score_consolidation integer,
  consolidation_due_at timestamp with time zone,
  consolidation_done_at timestamp with time zone,
  note_enseignant text
);

CREATE TABLE public.webhooks_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL,
  event_name text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  response_body text,
  duration_ms integer,
  delivered_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.webhooks_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  created_by uuid,
  url text NOT NULL,
  secret text,
  events text[] NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_fired_at timestamp with time zone,
  fail_count integer NOT NULL DEFAULT 0
);

CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid,
  role text NOT NULL,
  prenom text NOT NULL,
  nom_initial text,
  avatar_preset text DEFAULT 'starter-1'::text,
  avatar_url text,
  auto_ecole_id uuid,
  enseignant_id uuid,
  credit_heures numeric(4,1) DEFAULT 0,
  gems integer DEFAULT 0,
  xp integer DEFAULT 0,
  unlocked_avatars jsonb DEFAULT '[]'::jsonb,
  unlocked_themes jsonb DEFAULT '[]'::jsonb,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  last_active_at timestamp with time zone DEFAULT now(),
  first_value_action_at timestamp with time zone,
  nom text,
  email text,
  streak_pro_days integer NOT NULL DEFAULT 0,
  last_validation_day date,
  notif_push boolean DEFAULT true,
  notif_email boolean DEFAULT true,
  show_in_ranking boolean DEFAULT false,
  dnd_start time without time zone DEFAULT '22:00:00'::time without time zone,
  dnd_end time without time zone DEFAULT '07:00:00'::time without time zone,
  banner_url text,
  gemmes integer NOT NULL DEFAULT 0,
  referral_code text,
  referred_by uuid,
  cgu_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  marketing_optin boolean DEFAULT false,
  deleted_at timestamp with time zone,
  anonymized_at timestamp with time zone,
  username text,
  date_naissance date,
  parent_email text,
  parental_consent_token text,
  parental_consent_given_at timestamp with time zone,
  parental_consent_required boolean NOT NULL DEFAULT false
);

-- ============ CONSTRAINTS (PK / UNIQUE / CHECK / FK) ============
ALTER TABLE public.achievements_unlocked ADD CONSTRAINT achievements_unlocked_pkey PRIMARY KEY (id);
ALTER TABLE public.app_config ADD CONSTRAINT app_config_pkey PRIMARY KEY (key);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.auto_ecoles ADD CONSTRAINT auto_ecoles_pkey PRIMARY KEY (id);
ALTER TABLE public.chest_unlocks ADD CONSTRAINT chest_unlocks_pkey PRIMARY KEY (id);
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_pkey PRIMARY KEY (id);
ALTER TABLE public.comp_bookmarks ADD CONSTRAINT comp_bookmarks_pkey PRIMARY KEY (id);
ALTER TABLE public.competences_remc ADD CONSTRAINT competences_remc_pkey PRIMARY KEY (id);
ALTER TABLE public.daily_quests_progress ADD CONSTRAINT daily_quests_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.eleve_daily_snapshot ADD CONSTRAINT eleve_daily_snapshot_pkey PRIMARY KEY (id);
ALTER TABLE public.eleve_goals ADD CONSTRAINT eleve_goals_pkey PRIMARY KEY (id);
ALTER TABLE public.eleve_tags ADD CONSTRAINT eleve_tags_pkey PRIMARY KEY (id);
ALTER TABLE public.events_analytics ADD CONSTRAINT events_analytics_pkey PRIMARY KEY (id);
ALTER TABLE public.exam_blanc_sessions ADD CONSTRAINT exam_blanc_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_pkey PRIMARY KEY (id);
ALTER TABLE public.experiments ADD CONSTRAINT experiments_pkey PRIMARY KEY (id);
ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (key);
ALTER TABLE public.flash_quizzes ADD CONSTRAINT flash_quizzes_pkey PRIMARY KEY (id);
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.invitations ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);
ALTER TABLE public.items_catalog ADD CONSTRAINT items_catalog_pkey PRIMARY KEY (id);
ALTER TABLE public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
ALTER TABLE public.lecons_realisees ADD CONSTRAINT lecons_realisees_pkey PRIMARY KEY (id);
ALTER TABLE public.message_templates ADD CONSTRAINT message_templates_pkey PRIMARY KEY (id);
ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE public.moniteur_paliers ADD CONSTRAINT moniteur_paliers_pkey PRIMARY KEY (palier);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.questions_competence ADD CONSTRAINT questions_competence_pkey PRIMARY KEY (id);
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);
ALTER TABLE public.quiz_feedback ADD CONSTRAINT quiz_feedback_pkey PRIMARY KEY (id);
ALTER TABLE public.rate_limit_log ADD CONSTRAINT rate_limit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.remc_questions ADD CONSTRAINT remc_questions_pkey PRIMARY KEY (id);
ALTER TABLE public.school_daily_snapshot ADD CONSTRAINT school_daily_snapshot_pkey PRIMARY KEY (id);
ALTER TABLE public.school_events ADD CONSTRAINT school_events_pkey PRIMARY KEY (id);
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_moniteur_pkey PRIMARY KEY (id);
ALTER TABLE public.streak_freezes ADD CONSTRAINT streak_freezes_pkey PRIMARY KEY (id);
ALTER TABLE public.streaks ADD CONSTRAINT streaks_pkey PRIMARY KEY (user_id);
ALTER TABLE public.user_inventory ADD CONSTRAINT user_inventory_pkey PRIMARY KEY (id);
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);
ALTER TABLE public.validations ADD CONSTRAINT validations_pkey PRIMARY KEY (id);
ALTER TABLE public.webhooks_deliveries ADD CONSTRAINT webhooks_deliveries_pkey PRIMARY KEY (id);
ALTER TABLE public.webhooks_subscriptions ADD CONSTRAINT webhooks_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.achievements_unlocked ADD CONSTRAINT achievements_unique UNIQUE (user_id, achievement_key);
ALTER TABLE public.auto_ecoles ADD CONSTRAINT auto_ecoles_slug_key UNIQUE (slug);
ALTER TABLE public.chest_unlocks ADD CONSTRAINT chest_unlocks_user_chest_unique UNIQUE (user_id, chest_type);
ALTER TABLE public.comp_bookmarks ADD CONSTRAINT comp_bookmarks_unique UNIQUE (user_id, competence_id);
ALTER TABLE public.daily_quests_progress ADD CONSTRAINT daily_quests_unique UNIQUE (user_id, quest_date, quest_id);
ALTER TABLE public.eleve_daily_snapshot ADD CONSTRAINT eleve_daily_snapshot_unique UNIQUE (eleve_id, snapshot_date);
ALTER TABLE public.eleve_goals ADD CONSTRAINT eleve_goals_one_per_user UNIQUE (eleve_id);
ALTER TABLE public.eleve_tags ADD CONSTRAINT eleve_tags_unique UNIQUE (eleve_id, tag);
ALTER TABLE public.experiment_assignments ADD CONSTRAINT assignments_unique UNIQUE (user_id, experiment_key);
ALTER TABLE public.experiments ADD CONSTRAINT experiments_experiment_key_key UNIQUE (experiment_key);
ALTER TABLE public.invitations ADD CONSTRAINT invitations_token_key UNIQUE (token);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_auth_id_key UNIQUE (auth_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);
ALTER TABLE public.school_daily_snapshot ADD CONSTRAINT school_daily_snapshot_unique UNIQUE (auto_ecole_id, snapshot_date);
ALTER TABLE public.streak_freezes ADD CONSTRAINT streak_freezes_unique UNIQUE (user_id, frozen_date);
ALTER TABLE public.user_inventory ADD CONSTRAINT user_inventory_unique UNIQUE (user_id, item_id);
ALTER TABLE public.validations ADD CONSTRAINT validations_eleve_id_competence_id_key UNIQUE (eleve_id, competence_id);
ALTER TABLE public.auto_ecoles ADD CONSTRAINT auto_ecoles_abonnement_status_check CHECK ((abonnement_status = ANY (ARRAY['beta'::text, 'active'::text, 'cancelled'::text])));
ALTER TABLE public.chest_unlocks ADD CONSTRAINT chest_unlocks_type_valid CHECK ((chest_type = ANY (ARRAY['world_1'::text, 'world_2'::text, 'world_3'::text, 'world_4'::text, 'streak_7'::text, 'streak_14'::text, 'streak_30'::text, 'perfect_quiz'::text])));
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_correct_idx_check CHECK (((correct_idx >= 0) AND (correct_idx <= 3)));
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_question_check CHECK (((length(question) >= 10) AND (length(question) <= 500)));
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.competences_remc ADD CONSTRAINT competences_remc_monde_check CHECK (((monde >= 1) AND (monde <= 4)));
ALTER TABLE public.eleve_goals ADD CONSTRAINT eleve_goals_target_comp_per_week_check CHECK (((target_comp_per_week >= 1) AND (target_comp_per_week <= 20)));
ALTER TABLE public.eleve_tags ADD CONSTRAINT eleve_tags_tag_check CHECK (((length(tag) >= 2) AND (length(tag) <= 30)));
ALTER TABLE public.experiments ADD CONSTRAINT experiments_weights_sum CHECK ((array_length(variants, 1) = array_length(weights, 1)));
ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_rollout_pct_check CHECK (((rollout_pct >= 0) AND (rollout_pct <= 100)));
ALTER TABLE public.flash_quizzes ADD CONSTRAINT score_valid CHECK (((score IS NULL) OR ((score >= 0) AND (score <= 3))));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_category_check CHECK ((category = ANY (ARRAY['bug'::text, 'suggestion'::text, 'question'::text, 'autre'::text])));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_description_check CHECK (((length(description) >= 10) AND (length(description) <= 4000)));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_status_check CHECK ((status = ANY (ARRAY['new'::text, 'triaged'::text, 'in_progress'::text, 'resolved'::text, 'wontfix'::text])));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_title_check CHECK (((length(title) >= 3) AND (length(title) <= 200)));
ALTER TABLE public.invitations ADD CONSTRAINT invitations_role_check CHECK ((role = ANY (ARRAY['eleve'::text, 'enseignant'::text])));
ALTER TABLE public.items_catalog ADD CONSTRAINT items_catalog_cost_gemmes_check CHECK ((cost_gemmes >= 0));
ALTER TABLE public.items_catalog ADD CONSTRAINT items_catalog_rarity_check CHECK ((rarity = ANY (ARRAY['commun'::text, 'rare'::text, 'epique'::text, 'legendaire'::text])));
ALTER TABLE public.items_catalog ADD CONSTRAINT items_catalog_type_check CHECK ((type = ANY (ARRAY['avatar'::text, 'theme'::text, 'permis_bg'::text, 'boost'::text])));
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK ((status = ANY (ARRAY['nouveau'::text, 'contacte'::text, 'converti'::text, 'perdu'::text])));
ALTER TABLE public.message_templates ADD CONSTRAINT message_templates_category_check CHECK ((category = ANY (ARRAY['positif'::text, 'correctif'::text, 'encourageant'::text, 'technique'::text])));
ALTER TABLE public.messages ADD CONSTRAINT messages_body_check CHECK (((length(body) >= 1) AND (length(body) <= 2000)));
ALTER TABLE public.messages ADD CONSTRAINT messages_no_self CHECK ((sender_id <> recipient_id));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['eleve'::text, 'enseignant'::text, 'gerant'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT username_format CHECK (((username IS NULL) OR (username ~ '^[A-Za-z0-9_]{3,16}$'::text)));
ALTER TABLE public.questions_competence ADD CONSTRAINT questions_competence_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 3)));
ALTER TABLE public.questions_competence ADD CONSTRAINT questions_competence_type_check CHECK ((type = ANY (ARRAY['post_validation'::text, 'consolidation'::text, 'exam_blanc'::text])));
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_score_check CHECK (((score >= 0) AND (score <= 100)));
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_type_check CHECK ((type = ANY (ARRAY['post_validation'::text, 'consolidation'::text, 'exam_blanc'::text, 'review'::text])));
ALTER TABLE public.quiz_feedback ADD CONSTRAINT quiz_feedback_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5)));
ALTER TABLE public.remc_questions ADD CONSTRAINT remc_questions_correct_idx_check CHECK (((correct_idx >= 0) AND (correct_idx <= 3)));
ALTER TABLE public.school_events ADD CONSTRAINT school_events_category_check CHECK ((category = ANY (ARRAY['info'::text, 'promo'::text, 'exam_session'::text, 'workshop'::text, 'other'::text])));
ALTER TABLE public.school_events ADD CONSTRAINT school_events_title_check CHECK (((length(title) >= 3) AND (length(title) <= 200)));
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_moniteur_confirmation_status_check CHECK ((confirmation_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'refused'::text, 'auto'::text])));
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_moniteur_duration_minutes_check CHECK ((duration_minutes = ANY (ARRAY[30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180])));
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_session_date_not_future CHECK ((session_date <= CURRENT_DATE));
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_session_date_not_too_old CHECK ((session_date >= (CURRENT_DATE - '7 days'::interval)));
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'auto'::text])));
ALTER TABLE public.validations ADD CONSTRAINT validations_score_cognitif_check CHECK (((score_cognitif IS NULL) OR ((score_cognitif >= 0) AND (score_cognitif <= 100))));
ALTER TABLE public.validations ADD CONSTRAINT validations_score_consolidation_check CHECK (((score_consolidation IS NULL) OR ((score_consolidation >= 0) AND (score_consolidation <= 100))));
ALTER TABLE public.validations ADD CONSTRAINT validations_statut_check CHECK ((statut = ANY (ARRAY['acquis'::text, 'en_cours'::text, 'a_retravailler'::text, 'a_valider'::text])));
ALTER TABLE public.webhooks_subscriptions ADD CONSTRAINT webhooks_subscriptions_url_check CHECK ((url ~ '^https?://'::text));
ALTER TABLE public.achievements_unlocked ADD CONSTRAINT achievements_unlocked_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chest_unlocks ADD CONSTRAINT chest_unlocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES competences_remc(id);
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES profiles(id);
ALTER TABLE public.community_questions ADD CONSTRAINT community_questions_proposed_by_fkey FOREIGN KEY (proposed_by) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.comp_bookmarks ADD CONSTRAINT comp_bookmarks_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES competences_remc(id) ON DELETE CASCADE;
ALTER TABLE public.comp_bookmarks ADD CONSTRAINT comp_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.daily_quests_progress ADD CONSTRAINT daily_quests_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.eleve_daily_snapshot ADD CONSTRAINT eleve_daily_snapshot_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.eleve_goals ADD CONSTRAINT eleve_goals_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.eleve_tags ADD CONSTRAINT eleve_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE public.eleve_tags ADD CONSTRAINT eleve_tags_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.events_analytics ADD CONSTRAINT events_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.exam_blanc_sessions ADD CONSTRAINT exam_blanc_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.experiment_assignments ADD CONSTRAINT experiment_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.flash_quizzes ADD CONSTRAINT flash_quizzes_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES profiles(id);
ALTER TABLE public.flash_quizzes ADD CONSTRAINT flash_quizzes_sent_to_fkey FOREIGN KEY (sent_to) REFERENCES profiles(id);
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_auto_ecole_id_fkey FOREIGN KEY (auto_ecole_id) REFERENCES auto_ecoles(id) ON DELETE CASCADE;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_enseignant_attitre_id_fkey FOREIGN KEY (enseignant_attitre_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.lecons_realisees ADD CONSTRAINT lecons_realisees_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.lecons_realisees ADD CONSTRAINT lecons_realisees_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_auto_ecole_id_fkey FOREIGN KEY (auto_ecole_id) REFERENCES auto_ecoles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES profiles(id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.questions_competence ADD CONSTRAINT questions_competence_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES competences_remc(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES competences_remc(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_feedback ADD CONSTRAINT quiz_feedback_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES competences_remc(id);
ALTER TABLE public.quiz_feedback ADD CONSTRAINT quiz_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.rate_limit_log ADD CONSTRAINT rate_limit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.school_events ADD CONSTRAINT school_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE public.school_events ADD CONSTRAINT school_events_school_id_fkey FOREIGN KEY (school_id) REFERENCES auto_ecoles(id) ON DELETE CASCADE;
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_moniteur_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.sessions_moniteur ADD CONSTRAINT sessions_moniteur_moniteur_id_fkey FOREIGN KEY (moniteur_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.streak_freezes ADD CONSTRAINT streak_freezes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.streaks ADD CONSTRAINT streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_inventory ADD CONSTRAINT user_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES items_catalog(id);
ALTER TABLE public.user_inventory ADD CONSTRAINT user_inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.validations ADD CONSTRAINT validations_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES competences_remc(id) ON DELETE CASCADE;
ALTER TABLE public.validations ADD CONSTRAINT validations_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.validations ADD CONSTRAINT validations_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.webhooks_deliveries ADD CONSTRAINT webhooks_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks_subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.webhooks_subscriptions ADD CONSTRAINT webhooks_subscriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE public.webhooks_subscriptions ADD CONSTRAINT webhooks_subscriptions_school_id_fkey FOREIGN KEY (school_id) REFERENCES auto_ecoles(id) ON DELETE CASCADE;

-- ============ INDEXES (hors PK/UNIQUE backing) ============
-- NB: idx_moniteur_ranking_mv_* sont créés après la matview plus bas.
CREATE INDEX idx_achievements_user ON public.achievements_unlocked USING btree (user_id, unlocked_at DESC);
CREATE INDEX idx_audit_log_actor_date ON public.audit_log USING btree (actor_id, created_at DESC);
CREATE INDEX idx_audit_log_record ON public.audit_log USING btree (record_id) WHERE (record_id IS NOT NULL);
CREATE INDEX idx_audit_log_table_date ON public.audit_log USING btree (table_name, created_at DESC);
CREATE INDEX idx_auto_ecoles_slug ON public.auto_ecoles USING btree (slug);
CREATE INDEX idx_chest_unlocks_opened_at ON public.chest_unlocks USING btree (opened_at DESC) WHERE (opened_at IS NOT NULL);
CREATE INDEX idx_chest_unlocks_user_id ON public.chest_unlocks USING btree (user_id, unlocked_at DESC);
CREATE INDEX idx_community_questions_proposed_by ON public.community_questions USING btree (proposed_by);
CREATE INDEX idx_community_questions_status ON public.community_questions USING btree (status, created_at DESC);
CREATE INDEX idx_comp_bookmarks_user ON public.comp_bookmarks USING btree (user_id, created_at DESC);
CREATE INDEX idx_competences_remc_monde ON public.competences_remc USING btree (monde);
CREATE INDEX idx_daily_quests_pending_claim ON public.daily_quests_progress USING btree (user_id) WHERE ((completed_at IS NOT NULL) AND (claimed_at IS NULL));
CREATE INDEX idx_daily_quests_user_date ON public.daily_quests_progress USING btree (user_id, quest_date DESC);
CREATE INDEX idx_eleve_daily_snapshot_eleve_date ON public.eleve_daily_snapshot USING btree (eleve_id, snapshot_date DESC);
CREATE INDEX idx_eleve_tags_eleve ON public.eleve_tags USING btree (eleve_id);
CREATE INDEX idx_eleve_tags_tag ON public.eleve_tags USING btree (tag);
CREATE INDEX idx_events_analytics_event_date ON public.events_analytics USING btree (event_name, created_at DESC);
CREATE INDEX idx_events_analytics_user_date ON public.events_analytics USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);
CREATE INDEX idx_events_created_at ON public.events_analytics USING btree (created_at);
CREATE INDEX idx_events_name ON public.events_analytics USING btree (event_name);
CREATE INDEX idx_events_user_id ON public.events_analytics USING btree (user_id);
CREATE INDEX idx_exam_blanc_user_date ON public.exam_blanc_sessions USING btree (user_id, started_at DESC);
CREATE INDEX idx_assignments_experiment_variant ON public.experiment_assignments USING btree (experiment_key, variant);
CREATE INDEX idx_experiments_active_key ON public.experiments USING btree (experiment_key) WHERE (active = true);
CREATE INDEX flash_quizzes_sent_by_idx ON public.flash_quizzes USING btree (sent_by, sent_at DESC);
CREATE INDEX flash_quizzes_sent_to_active_idx ON public.flash_quizzes USING btree (sent_to, expires_at) WHERE (responded_at IS NULL);
CREATE INDEX idx_incident_reports_reporter ON public.incident_reports USING btree (reporter_id, created_at DESC);
CREATE INDEX idx_incident_reports_status_date ON public.incident_reports USING btree (status, created_at DESC);
CREATE INDEX idx_invitations_auto_ecole_id ON public.invitations USING btree (auto_ecole_id);
CREATE INDEX idx_invitations_email ON public.invitations USING btree (email);
CREATE INDEX idx_invitations_enseignant_attitre_id ON public.invitations USING btree (enseignant_attitre_id);
CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);
CREATE INDEX idx_items_catalog_type_active ON public.items_catalog USING btree (type, ordre) WHERE (active = true);
CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at);
CREATE INDEX idx_leads_status ON public.leads USING btree (status);
CREATE INDEX idx_lecons_date ON public.lecons_realisees USING btree (date_lecon);
CREATE INDEX idx_lecons_eleve_id ON public.lecons_realisees USING btree (eleve_id);
CREATE INDEX idx_lecons_enseignant_id ON public.lecons_realisees USING btree (enseignant_id);
CREATE INDEX idx_messages_recipient_unread ON public.messages USING btree (recipient_id) WHERE (read_at IS NULL);
CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);
CREATE INDEX idx_messages_thread_date ON public.messages USING btree (thread_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, read) WHERE (read = false);
CREATE INDEX idx_notifications_unread_v2 ON public.notifications USING btree (user_id, type, created_at DESC) WHERE (read = false);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_profiles_auth_id ON public.profiles USING btree (auth_id);
CREATE INDEX idx_profiles_auto_ecole_id ON public.profiles USING btree (auto_ecole_id);
CREATE INDEX idx_profiles_deleted ON public.profiles USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);
CREATE INDEX idx_profiles_ecole_role_active ON public.profiles USING btree (auto_ecole_id, role) WHERE (deleted_at IS NULL);
CREATE INDEX idx_profiles_enseignant_id ON public.profiles USING btree (enseignant_id);
CREATE INDEX idx_profiles_last_active ON public.profiles USING btree (last_active_at DESC) WHERE (role = 'eleve'::text);
CREATE INDEX idx_profiles_referral_code ON public.profiles USING btree (referral_code) WHERE (referral_code IS NOT NULL);
CREATE INDEX idx_profiles_referred_by ON public.profiles USING btree (referred_by) WHERE (referred_by IS NOT NULL);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_school_role ON public.profiles USING btree (auto_ecole_id, role) WHERE (auto_ecole_id IS NOT NULL);
CREATE UNIQUE INDEX profiles_parental_token_uq ON public.profiles USING btree (parental_consent_token) WHERE (parental_consent_token IS NOT NULL);
CREATE UNIQUE INDEX profiles_username_lower_uniq ON public.profiles USING btree (lower(username)) WHERE ((username IS NOT NULL) AND (btrim(username) <> ''::text));
CREATE UNIQUE INDEX profiles_username_lower_uq ON public.profiles USING btree (lower(username)) WHERE (username IS NOT NULL);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);
CREATE INDEX idx_questions_competence_id ON public.questions_competence USING btree (competence_id);
CREATE INDEX idx_questions_type ON public.questions_competence USING btree (type);
CREATE INDEX idx_quiz_attempts_competence_id ON public.quiz_attempts USING btree (competence_id);
CREATE INDEX idx_quiz_attempts_perfect ON public.quiz_attempts USING btree (user_id, completed_at DESC) WHERE (score >= 100);
CREATE INDEX idx_quiz_attempts_type ON public.quiz_attempts USING btree (type);
CREATE INDEX idx_quiz_attempts_user_completed ON public.quiz_attempts USING btree (user_id, completed_at DESC);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts USING btree (user_id);
CREATE INDEX idx_quiz_attempts_user_id_date ON public.quiz_attempts USING btree (user_id, completed_at);
CREATE INDEX idx_quiz_feedback_comp ON public.quiz_feedback USING btree (competence_id, difficulty);
CREATE INDEX idx_quiz_feedback_question ON public.quiz_feedback USING btree (question_id) WHERE (question_id IS NOT NULL);
CREATE INDEX idx_rate_limit_user_action_date ON public.rate_limit_log USING btree (user_id, action, created_at DESC);
CREATE INDEX idx_school_daily_snapshot_school_date ON public.school_daily_snapshot USING btree (auto_ecole_id, snapshot_date DESC);
CREATE INDEX idx_school_events_school_active ON public.school_events USING btree (school_id, active, event_date);
CREATE INDEX idx_sessions_eleve_pending ON public.sessions_moniteur USING btree (eleve_id, confirmation_status) WHERE (confirmation_status = 'pending'::text);
CREATE INDEX idx_sessions_logged_at ON public.sessions_moniteur USING btree (logged_at DESC);
CREATE INDEX idx_sessions_moniteur_eleve_date ON public.sessions_moniteur USING btree (eleve_id, session_date DESC) WHERE (confirmed_at IS NOT NULL);
CREATE INDEX idx_sessions_moniteur_id_date ON public.sessions_moniteur USING btree (moniteur_id, session_date DESC);
CREATE INDEX idx_sessions_moniteur_mon_date ON public.sessions_moniteur USING btree (moniteur_id, session_date DESC) WHERE (confirmed_at IS NOT NULL);
CREATE INDEX idx_sessions_moniteur_status_date ON public.sessions_moniteur USING btree (moniteur_id, confirmation_status, session_date DESC) WHERE (confirmation_status = ANY (ARRAY['confirmed'::text, 'auto'::text]));
CREATE INDEX idx_streak_freezes_user_date ON public.streak_freezes USING btree (user_id, frozen_date DESC);
CREATE INDEX idx_streaks_last_activity ON public.streaks USING btree (last_activity_date) WHERE (current_streak > 0);
CREATE INDEX idx_user_inventory_item_id ON public.user_inventory USING btree (item_id);
CREATE INDEX idx_user_inventory_user ON public.user_inventory USING btree (user_id, acquired_at DESC);
CREATE INDEX idx_validations_by_date ON public.validations USING btree (validated_by, validated_at DESC) WHERE (statut = 'acquis'::text);
CREATE INDEX idx_validations_competence_id ON public.validations USING btree (competence_id);
CREATE INDEX idx_validations_consolidation_due ON public.validations USING btree (consolidation_due_at) WHERE ((consolidation_due_at IS NOT NULL) AND (consolidation_done_at IS NULL));
CREATE INDEX idx_validations_eleve_id ON public.validations USING btree (eleve_id);
CREATE INDEX idx_validations_eleve_id_date ON public.validations USING btree (eleve_id, validated_at);
CREATE INDEX idx_validations_eleve_status_date ON public.validations USING btree (eleve_id, statut, validated_at DESC);
CREATE INDEX idx_validations_validated_at ON public.validations USING btree (validated_at);
CREATE INDEX idx_validations_validated_by ON public.validations USING btree (validated_by);
CREATE INDEX idx_validations_validated_by_at ON public.validations USING btree (validated_by, validated_at DESC);
CREATE INDEX idx_validations_validated_by_date ON public.validations USING btree (validated_by, validated_at DESC) WHERE (statut = 'acquis'::text);
CREATE INDEX idx_webhooks_deliveries_webhook ON public.webhooks_deliveries USING btree (webhook_id, delivered_at DESC);
CREATE INDEX idx_webhooks_school_active ON public.webhooks_subscriptions USING btree (school_id, active);

-- ============ RLS ENABLE ============
ALTER TABLE public.achievements_unlocked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_ecoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chest_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competences_remc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quests_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleve_daily_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleve_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleve_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_blanc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecons_realisees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moniteur_paliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions_competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remc_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_daily_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_moniteur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES (72) ============
-- NB: réfèrent get_my_id()/get_my_role()/get_my_auto_ecole_id()/current_profile_id()
--     -> voir INVENTAIRE FONCTIONS plus bas (corps non inlinés, cf. note en tête).
CREATE POLICY "user reads own achievements" ON public.achievements_unlocked AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY auto_ecoles_insert ON public.auto_ecoles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((nom IS NOT NULL) AND ((length(TRIM(BOTH FROM nom)) >= 2) AND (length(TRIM(BOTH FROM nom)) <= 120))));
CREATE POLICY auto_ecoles_select ON public.auto_ecoles AS PERMISSIVE FOR SELECT TO public USING ((id = get_my_auto_ecole_id()));
CREATE POLICY auto_ecoles_update ON public.auto_ecoles AS PERMISSIVE FOR UPDATE TO public USING (((id = get_my_auto_ecole_id()) AND (get_my_role() = 'gerant'::text))) WITH CHECK (((id = get_my_auto_ecole_id()) AND (get_my_role() = 'gerant'::text)));
CREATE POLICY "user reads own chests" ON public.chest_unlocks AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "moniteur reads school proposals" ON public.community_questions AS PERMISSIVE FOR SELECT TO public USING ((proposed_by IN ( SELECT p.id
   FROM (profiles p
     JOIN profiles me ON ((me.auto_ecole_id = p.auto_ecole_id)))
  WHERE ((me.auth_id = ( SELECT auth.uid() AS uid)) AND (me.role = ANY (ARRAY['enseignant'::text, 'gerant'::text]))))));
CREATE POLICY "user inserts own community_questions" ON public.community_questions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((proposed_by IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own proposals" ON public.community_questions AS PERMISSIVE FOR SELECT TO public USING ((proposed_by IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user inserts own bookmarks" ON public.comp_bookmarks AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own bookmarks" ON public.comp_bookmarks AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY competences_select ON public.competences_remc AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "user reads own quests" ON public.daily_quests_progress AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "school reads snapshots of school" ON public.eleve_daily_snapshot AS PERMISSIVE FOR SELECT TO public USING ((eleve_id IN ( SELECT p.id
   FROM (profiles p
     JOIN profiles me ON ((me.auto_ecole_id = p.auto_ecole_id)))
  WHERE ((me.auth_id = ( SELECT auth.uid() AS uid)) AND (me.role = ANY (ARRAY['enseignant'::text, 'gerant'::text]))))));
CREATE POLICY "user reads own snapshots" ON public.eleve_daily_snapshot AS PERMISSIVE FOR SELECT TO public USING ((eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user inserts own goals" ON public.eleve_goals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own goals" ON public.eleve_goals AS PERMISSIVE FOR SELECT TO public USING ((eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "school reads tags of own school" ON public.eleve_tags AS PERMISSIVE FOR SELECT TO public USING ((eleve_id IN ( SELECT p.id
   FROM (profiles p
     JOIN profiles me ON ((me.auto_ecole_id = p.auto_ecole_id)))
  WHERE ((me.auth_id = ( SELECT auth.uid() AS uid)) AND (me.role = ANY (ARRAY['enseignant'::text, 'gerant'::text]))))));
CREATE POLICY events_insert ON public.events_analytics AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = get_my_id()) OR (user_id IS NULL)));
CREATE POLICY events_select ON public.events_analytics AS PERMISSIVE FOR SELECT TO authenticated USING (((get_my_role() = 'gerant'::text) AND (user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auto_ecole_id = get_my_auto_ecole_id())))));
CREATE POLICY "moniteur reads school exams" ON public.exam_blanc_sessions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (profiles p_user
     JOIN profiles p_eleve ON ((p_eleve.auto_ecole_id = p_user.auto_ecole_id)))
  WHERE ((p_user.auth_id = ( SELECT auth.uid() AS uid)) AND (p_user.role = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (p_eleve.id = exam_blanc_sessions.user_id)))));
CREATE POLICY "user reads own exams" ON public.exam_blanc_sessions AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own assignments" ON public.experiment_assignments AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "auth reads active experiments" ON public.experiments AS PERMISSIVE FOR SELECT TO public USING ((active = true));
CREATE POLICY "auth reads flags" ON public.feature_flags AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY flash_quizzes_no_direct_insert ON public.flash_quizzes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY flash_quizzes_no_direct_update ON public.flash_quizzes AS PERMISSIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY flash_quizzes_select_self ON public.flash_quizzes AS PERMISSIVE FOR SELECT TO authenticated USING (((sent_by = current_profile_id()) OR (sent_to = current_profile_id())));
CREATE POLICY "user inserts own incident_reports" ON public.incident_reports AS PERMISSIVE FOR INSERT TO public WITH CHECK ((reporter_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own reports" ON public.incident_reports AS PERMISSIVE FOR SELECT TO public USING ((reporter_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY invitations_insert ON public.invitations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((get_my_role() = ANY (ARRAY['gerant'::text, 'enseignant'::text])) AND (auto_ecole_id = get_my_auto_ecole_id())));
CREATE POLICY invitations_select ON public.invitations AS PERMISSIVE FOR SELECT TO public USING (((auto_ecole_id = get_my_auto_ecole_id()) AND (get_my_role() = ANY (ARRAY['gerant'::text, 'enseignant'::text]))));
CREATE POLICY "auth reads active items" ON public.items_catalog AS PERMISSIVE FOR SELECT TO public USING ((active = true));
CREATE POLICY leads_insert ON public.leads AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (((email IS NOT NULL) AND (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND (length(TRIM(BOTH FROM COALESCE(ecole_nom, ''::text))) >= 1)));
CREATE POLICY leads_select ON public.leads AS PERMISSIVE FOR SELECT TO authenticated USING (((get_my_role() = 'gerant'::text) AND (EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND ((users.email)::text = 'rayannabli27@gmail.com'::text))))));
CREATE POLICY lecons_insert ON public.lecons_realisees AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((get_my_role() = 'enseignant'::text) AND (enseignant_id = get_my_id())));
CREATE POLICY lecons_select ON public.lecons_realisees AS PERMISSIVE FOR SELECT TO authenticated USING (((eleve_id = get_my_id()) OR (enseignant_id = get_my_id()) OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = lecons_realisees.eleve_id) AND (p.auto_ecole_id = get_my_auto_ecole_id())))))));
CREATE POLICY templates_read_all ON public.message_templates AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "user reads own threads" ON public.messages AS PERMISSIVE FOR SELECT TO public USING (((sender_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))) OR (recipient_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY paliers_read ON public.moniteur_paliers AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY notifications_insert ON public.notifications AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = get_my_id()));
CREATE POLICY notifications_select ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = get_my_id()));
CREATE POLICY notifications_update ON public.notifications AS PERMISSIVE FOR UPDATE TO public USING ((user_id = get_my_id())) WITH CHECK ((user_id = get_my_id()));
CREATE POLICY profiles_insert ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY profiles_no_delete ON public.profiles AS PERMISSIVE FOR DELETE TO public USING (false);
CREATE POLICY profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (((auth_id = ( SELECT auth.uid() AS uid)) OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (auto_ecole_id = get_my_auto_ecole_id())) OR ((get_my_role() = 'eleve'::text) AND (auto_ecole_id = get_my_auto_ecole_id()) AND ((role = ANY (ARRAY['enseignant'::text, 'gerant'::text])) OR ((role = 'eleve'::text) AND (show_in_ranking IS NOT FALSE))))));
CREATE POLICY profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING (((auth_id = ( SELECT auth.uid() AS uid)) OR ((get_my_role() = 'gerant'::text) AND (auto_ecole_id = get_my_auto_ecole_id()))));
CREATE POLICY "own push sub all" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING ((( SELECT auth.uid() AS uid) = ( SELECT profiles.auth_id
   FROM profiles
  WHERE (profiles.id = push_subscriptions.user_id)))) WITH CHECK ((( SELECT auth.uid() AS uid) = ( SELECT profiles.auth_id
   FROM profiles
  WHERE (profiles.id = push_subscriptions.user_id))));
CREATE POLICY questions_select ON public.questions_competence AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY quiz_attempts_insert ON public.quiz_attempts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = get_my_id()));
CREATE POLICY quiz_attempts_no_delete ON public.quiz_attempts AS PERMISSIVE FOR DELETE TO public USING (false);
CREATE POLICY quiz_attempts_select ON public.quiz_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = get_my_id()) OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = quiz_attempts.user_id) AND (p.auto_ecole_id = get_my_auto_ecole_id())))))));
CREATE POLICY "user inserts own quiz_feedback" ON public.quiz_feedback AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own quiz feedback" ON public.quiz_feedback AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY remc_questions_select_auth ON public.remc_questions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "gerant reads own school snapshots" ON public.school_daily_snapshot AS PERMISSIVE FOR SELECT TO public USING ((auto_ecole_id IN ( SELECT profiles.auto_ecole_id
   FROM profiles
  WHERE ((profiles.auth_id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['gerant'::text, 'enseignant'::text]))))));
CREATE POLICY "school reads own events" ON public.school_events AS PERMISSIVE FOR SELECT TO public USING ((school_id IN ( SELECT profiles.auto_ecole_id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "eleve reads sessions about him" ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING ((eleve_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "gerant reads sessions of school" ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (profiles p_gerant
     JOIN profiles p_moniteur ON ((p_moniteur.auto_ecole_id = p_gerant.auto_ecole_id)))
  WHERE ((p_gerant.auth_id = ( SELECT auth.uid() AS uid)) AND (p_gerant.role = 'gerant'::text) AND (p_moniteur.id = sessions_moniteur.moniteur_id)))));
CREATE POLICY "moniteur reads own sessions" ON public.sessions_moniteur AS PERMISSIVE FOR SELECT TO public USING ((moniteur_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own freezes" ON public.streak_freezes AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY streaks_insert ON public.streaks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = get_my_id()));
CREATE POLICY streaks_select ON public.streaks AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = get_my_id()) OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = streaks.user_id) AND (p.auto_ecole_id = get_my_auto_ecole_id())))))));
CREATE POLICY streaks_update ON public.streaks AS PERMISSIVE FOR UPDATE TO public USING ((user_id = get_my_id())) WITH CHECK ((user_id = get_my_id()));
CREATE POLICY "user reads own inventory" ON public.user_inventory AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user inserts own prefs" ON public.user_preferences AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user reads own prefs" ON public.user_preferences AS PERMISSIVE FOR SELECT TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "user updates own prefs" ON public.user_preferences AS PERMISSIVE FOR UPDATE TO public USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY validations_delete ON public.validations AS PERMISSIVE FOR DELETE TO public USING (((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = validations.eleve_id) AND (p.auto_ecole_id = get_my_auto_ecole_id()))))));
CREATE POLICY validations_insert ON public.validations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (validated_by = get_my_id())));
CREATE POLICY validations_select ON public.validations AS PERMISSIVE FOR SELECT TO authenticated USING (((eleve_id = get_my_id()) OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = validations.eleve_id) AND (p.auto_ecole_id = get_my_auto_ecole_id())))))));
CREATE POLICY validations_update ON public.validations AS PERMISSIVE FOR UPDATE TO public USING (((eleve_id = get_my_id()) OR ((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = validations.eleve_id) AND (p.auto_ecole_id = get_my_auto_ecole_id()))))))) WITH CHECK (((get_my_role() = ANY (ARRAY['enseignant'::text, 'gerant'::text])) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = validations.eleve_id) AND (p.auto_ecole_id = get_my_auto_ecole_id()))))));
CREATE POLICY "gerant manages own webhooks" ON public.webhooks_subscriptions AS PERMISSIVE FOR SELECT TO public USING ((school_id IN ( SELECT profiles.auto_ecole_id
   FROM profiles
  WHERE ((profiles.auth_id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'gerant'::text)))));

-- ============ VUES (4) ============
CREATE OR REPLACE VIEW public.active_users_metrics AS 
 SELECT ( SELECT count(DISTINCT events_analytics.user_id)::integer AS count
           FROM events_analytics
          WHERE events_analytics.created_at >= CURRENT_DATE) AS dau,
    ( SELECT count(DISTINCT events_analytics.user_id)::integer AS count
           FROM events_analytics
          WHERE events_analytics.created_at >= (CURRENT_DATE - 6)) AS wau_7d,
    ( SELECT count(DISTINCT events_analytics.user_id)::integer AS count
           FROM events_analytics
          WHERE events_analytics.created_at >= (CURRENT_DATE - 29)) AS mau_30d;

CREATE OR REPLACE VIEW public.events_top_7d AS 
 SELECT event_name,
    count(*)::integer AS n_events,
    count(DISTINCT user_id)::integer AS n_users
   FROM events_analytics
  WHERE created_at >= (now() - '7 days'::interval)
  GROUP BY event_name
  ORDER BY (count(*)::integer) DESC;

CREATE OR REPLACE VIEW public.pulse_ecole AS 
 SELECT a.id AS auto_ecole_id,
    a.nom,
    count(DISTINCT p.id) FILTER (WHERE p.role = 'eleve'::text AND p.last_active_at > (now() - '7 days'::interval)) AS eleves_actifs_7d,
    count(DISTINCT p.id) FILTER (WHERE p.role = 'eleve'::text) AS eleves_total,
    count(DISTINCT p.id) FILTER (WHERE p.role = 'enseignant'::text) AS enseignants_total,
    count(DISTINCT p.id) FILTER (WHERE p.role = 'eleve'::text AND p.last_active_at < (now() - '14 days'::interval)) AS eleves_a_risque,
    count(DISTINCT p.id) FILTER (WHERE p.role = 'eleve'::text AND (( SELECT count(*) AS count
           FROM validations v
          WHERE v.eleve_id = p.id AND v.statut = 'acquis'::text)) >= 25) AS eleves_prets_examen,
    a.abonnement_status,
    a.created_at
   FROM auto_ecoles a
     LEFT JOIN profiles p ON p.auto_ecole_id = a.id
  GROUP BY a.id;

CREATE OR REPLACE VIEW public.suspicious_moniteurs_v AS 
 WITH base_30d AS (
         SELECT s.moniteur_id,
            s.eleve_id,
            s.duration_minutes,
            s.session_date,
            s.confirmation_status,
            s.flagged
           FROM sessions_moniteur s
          WHERE s.session_date >= (CURRENT_DATE - '30 days'::interval)
        ), agg AS (
         SELECT b.moniteur_id,
            count(*)::integer AS total_sessions,
            sum(b.duration_minutes) AS total_minutes,
            count(*) FILTER (WHERE b.confirmation_status = 'refused'::text)::integer AS n_refused,
            count(*) FILTER (WHERE b.confirmation_status = 'auto'::text)::integer AS n_auto_validated,
            count(DISTINCT b.eleve_id)::integer AS n_eleves_diff,
            count(DISTINCT b.session_date)::integer AS n_days_active,
            count(*) FILTER (WHERE (EXISTS ( SELECT 1
                   FROM sessions_moniteur s2
                  WHERE s2.moniteur_id = b.moniteur_id AND s2.session_date = b.session_date
                  GROUP BY s2.moniteur_id, s2.session_date
                 HAVING sum(s2.duration_minutes) >= 540)))::integer AS n_near_cap_days
           FROM base_30d b
          GROUP BY b.moniteur_id
        ), validations_30d AS (
         SELECT validations.validated_by AS moniteur_id,
            count(*)::integer AS n_validations
           FROM validations
          WHERE validations.validated_at >= (now() - '30 days'::interval) AND validations.statut = 'acquis'::text
          GROUP BY validations.validated_by
        )
 SELECT p.id AS moniteur_id,
    p.prenom,
    p.nom,
    p.auto_ecole_id,
    COALESCE(a.total_sessions, 0) AS total_sessions,
    COALESCE(a.total_minutes, 0::bigint) AS total_minutes,
    COALESCE(a.n_refused, 0) AS n_refused,
    COALESCE(a.n_auto_validated, 0) AS n_auto_validated,
    COALESCE(a.n_eleves_diff, 0) AS n_eleves_diff,
    COALESCE(a.n_days_active, 0) AS n_days_active,
    COALESCE(v.n_validations, 0) AS n_validations,
    COALESCE(a.n_refused, 0) >= 2 AS flag_refused_sessions,
    (COALESCE(a.n_auto_validated, 0)::double precision / NULLIF(a.total_sessions, 0)::double precision) > 0.5::double precision AS flag_high_auto_rate,
    COALESCE(a.total_minutes, 0::bigint) >= 9000 AND COALESCE(v.n_validations, 0) = 0 AS flag_hours_zero_val,
    COALESCE(a.n_eleves_diff, 0) = 1 AND COALESCE(a.total_sessions, 0) >= 8 AS flag_single_eleve_burst,
    COALESCE(a.n_days_active, 0) > 0 AND COALESCE(a.total_sessions, 0) > 0 AND (COALESCE(a.total_minutes, 0::bigint)::double precision / a.n_days_active::double precision) >= 480::double precision AS flag_high_daily_avg
   FROM profiles p
     LEFT JOIN agg a ON a.moniteur_id = p.id
     LEFT JOIN validations_30d v ON v.moniteur_id = p.id
  WHERE p.role = 'enseignant'::text;

-- ============ MATERIALIZED VIEW (1) ============
CREATE MATERIALIZED VIEW public.moniteur_ranking_mv AS 
 WITH this_month AS (
         SELECT date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)::date AS m_start,
            (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)::date AS m_end
        ), base_sessions AS (
         SELECT s.moniteur_id,
            s.eleve_id,
            s.duration_minutes,
            s.session_date,
            p.auto_ecole_id
           FROM sessions_moniteur s
             JOIN profiles p ON p.id = s.moniteur_id
             CROSS JOIN this_month tm
          WHERE s.session_date >= tm.m_start AND s.session_date < tm.m_end AND (s.confirmation_status = ANY (ARRAY['confirmed'::text, 'auto'::text]))
        ), per_moniteur AS (
         SELECT base_sessions.moniteur_id,
            base_sessions.auto_ecole_id,
            round(sum(base_sessions.duration_minutes)::numeric / 60.0, 1) AS hours_confirmed,
            count(DISTINCT base_sessions.eleve_id)::integer AS n_eleves_diff,
            count(DISTINCT base_sessions.session_date)::integer AS n_jours_actifs
           FROM base_sessions
          GROUP BY base_sessions.moniteur_id, base_sessions.auto_ecole_id
        ), validations_per AS (
         SELECT v.validated_by AS moniteur_id,
            count(*)::integer AS n_validations
           FROM validations v
             CROSS JOIN this_month tm
          WHERE v.validated_at >= tm.m_start AND v.validated_at < tm.m_end AND v.statut = 'acquis'::text
          GROUP BY v.validated_by
        ), merged AS (
         SELECT p.id AS moniteur_id,
            p.auto_ecole_id,
            p.prenom,
            p.nom,
            COALESCE(pm.hours_confirmed, 0::numeric) AS hours_confirmed,
            COALESCE(vp.n_validations, 0) AS n_validations,
            COALESCE(pm.n_eleves_diff, 0) AS n_eleves_diff,
            COALESCE(pm.n_jours_actifs, 0) AS n_jours_actifs
           FROM profiles p
             LEFT JOIN per_moniteur pm ON pm.moniteur_id = p.id
             LEFT JOIN validations_per vp ON vp.moniteur_id = p.id
          WHERE p.role = 'enseignant'::text AND p.auto_ecole_id IS NOT NULL
        ), scored AS (
         SELECT m.moniteur_id,
            m.auto_ecole_id,
            m.prenom,
            m.nom,
            m.hours_confirmed,
            m.n_validations,
            m.n_eleves_diff,
            m.n_jours_actifs,
            round(m.hours_confirmed * 0.40 + m.n_validations::numeric * 0.25 + m.n_eleves_diff::numeric * 1.50 * 0.20 + m.n_jours_actifs::numeric * 0.50 * 0.15, 2) AS score_total
           FROM merged m
        )
 SELECT moniteur_id,
    auto_ecole_id,
    prenom,
    nom,
    hours_confirmed,
    n_validations,
    n_eleves_diff,
    n_jours_actifs,
    score_total,
    row_number() OVER (PARTITION BY auto_ecole_id ORDER BY score_total DESC)::integer AS rank,
    now() AS refreshed_at
   FROM scored
WITH NO DATA;
CREATE UNIQUE INDEX idx_moniteur_ranking_mv_pk ON public.moniteur_ranking_mv USING btree (moniteur_id);
CREATE INDEX idx_moniteur_ranking_mv_school_rank ON public.moniteur_ranking_mv USING btree (auto_ecole_id, rank);

-- ============ TRIGGERS (25) ============
-- NB: les fonctions trigger sont listées dans INVENTAIRE FONCTIONS ci-dessous.
CREATE TRIGGER trg_protect_auto_ecoles BEFORE UPDATE ON auto_ecoles FOR EACH ROW EXECUTE FUNCTION protect_auto_ecoles();
CREATE TRIGGER trg_credit_xp_on_chest_open AFTER UPDATE OF opened_at ON chest_unlocks FOR EACH ROW EXECUTE FUNCTION credit_xp_on_chest_open();
CREATE TRIGGER trg_leads_rate_limit BEFORE INSERT ON leads FOR EACH ROW EXECUTE FUNCTION leads_rate_limit_check();
CREATE TRIGGER notif_dispatch_push AFTER INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION send_push_on_notification_insert();
CREATE TRIGGER trg_dedupe_notifications BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION dedupe_notifications();
CREATE TRIGGER trg_audit_profiles AFTER DELETE OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION _log_audit();
CREATE TRIGGER trg_protect_profile_fields BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_fields();
CREATE TRIGGER trg_advance_quest_quiz AFTER INSERT ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION advance_quest_quiz();
CREATE TRIGGER trg_check_quiz_achievements AFTER INSERT ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION check_quiz_achievements();
CREATE TRIGGER trg_credit_xp_on_quiz AFTER INSERT ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION credit_xp_on_quiz();
CREATE TRIGGER trg_audit_sessions AFTER INSERT OR DELETE OR UPDATE ON sessions_moniteur FOR EACH ROW EXECUTE FUNCTION _log_audit();
CREATE TRIGGER trg_bump_moniteur_streak_on_session AFTER INSERT ON sessions_moniteur FOR EACH ROW EXECUTE FUNCTION bump_moniteur_streak_on_session();
CREATE TRIGGER trg_credit_xp_moniteur_on_session AFTER INSERT ON sessions_moniteur FOR EACH ROW EXECUTE FUNCTION credit_xp_moniteur_on_session();
CREATE TRIGGER trg_credit_xp_moniteur_on_session_confirm AFTER UPDATE OF confirmation_status ON sessions_moniteur FOR EACH ROW EXECUTE FUNCTION credit_xp_moniteur_on_session_confirm();
CREATE TRIGGER trg_notify_eleve_on_session_insert AFTER INSERT ON sessions_moniteur FOR EACH ROW EXECUTE FUNCTION notify_eleve_on_session_insert();
CREATE TRIGGER trg_notify_eleve_session_logged AFTER INSERT ON sessions_moniteur FOR EACH ROW EXECUTE FUNCTION notify_eleve_on_session_logged();
CREATE TRIGGER trg_check_streak_achievements AFTER INSERT OR UPDATE OF current_streak ON streaks FOR EACH ROW EXECUTE FUNCTION check_streak_achievements();
CREATE TRIGGER trg_protect_streaks BEFORE INSERT OR UPDATE ON streaks FOR EACH ROW EXECUTE FUNCTION protect_streaks_fields();
CREATE TRIGGER trg_advance_quest_validation AFTER INSERT OR UPDATE ON validations FOR EACH ROW EXECUTE FUNCTION advance_quest_validation();
CREATE TRIGGER trg_audit_validations AFTER INSERT OR DELETE OR UPDATE ON validations FOR EACH ROW EXECUTE FUNCTION _log_audit();
CREATE TRIGGER trg_award_xp_on_validation AFTER INSERT OR UPDATE ON validations FOR EACH ROW EXECUTE FUNCTION award_xp_on_validation();
CREATE TRIGGER trg_check_validation_achievements AFTER INSERT OR UPDATE ON validations FOR EACH ROW EXECUTE FUNCTION check_validation_achievements();
CREATE TRIGGER trg_credit_xp_on_validation AFTER INSERT OR UPDATE ON validations FOR EACH ROW EXECUTE FUNCTION credit_xp_on_validation();
CREATE TRIGGER trg_protect_validations BEFORE UPDATE ON validations FOR EACH ROW EXECUTE FUNCTION protect_validations();
CREATE TRIGGER validations_set_consolidation BEFORE INSERT ON validations FOR EACH ROW EXECUTE FUNCTION set_consolidation_due();

-- =====================================================================
-- INVENTAIRE FONCTIONS (156) — corps NON inlinés (cf. note en tête).
-- Format : nom(args) -> retour | langage volatility [SECURITY DEFINER]
-- Pour le corps exact : SELECT pg_get_functiondef('public.<nom>'::regproc); en prod.
-- =====================================================================
-- _achievement_meta(p_key text) -> jsonb | sql IMMUTABLE
-- _log_audit() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- _set_trusted_op() -> void | plpgsql VOLATILE SECURITY DEFINER
-- _unlock_achievement(p_user_id uuid, p_key text) -> boolean | plpgsql VOLATILE SECURITY DEFINER
-- accept_invitation(p_token text) -> boolean | plpgsql VOLATILE SECURITY DEFINER
-- accept_parental_consent(p_token text) -> boolean | plpgsql VOLATILE SECURITY DEFINER
-- accept_terms(p_marketing_optin boolean) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- add_eleve_tag(p_eleve_id uuid, p_tag text, p_color text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- add_gemmes(p_amount integer) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- admin_get_dashboard() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- admin_list_incidents(p_status text, p_limit integer) -> SETOF incident_reports | plpgsql STABLE SECURITY DEFINER
-- advance_quest_quiz() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- advance_quest_validation() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- apply_referral(p_code text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- award_xp_on_validation() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- bump_moniteur_streak_on_session() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- check_duplicate_session(p_eleve_id uuid, p_session_date date) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- check_quiz_achievements() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- check_rate_limit(p_action text, p_max integer, p_window_seconds integer) -> boolean | plpgsql VOLATILE SECURITY DEFINER
-- check_streak_achievements() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- check_validation_achievements() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- claim_quest(p_quest_id text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- compute_thread_id(p_a uuid, p_b uuid) -> uuid | plpgsql IMMUTABLE
-- confirm_session(p_session_id uuid, p_status text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- count_unread_notifs(p_type text) -> integer | sql STABLE SECURITY DEFINER
-- create_school_event(p_title text, p_description text, p_event_date date, p_category text, p_notify boolean) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- create_webhook(p_url text, p_events text[], p_secret text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- credit_xp_moniteur_on_session() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- credit_xp_moniteur_on_session_confirm() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- credit_xp_moniteur_on_validation() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- credit_xp_on_chest_open() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- credit_xp_on_quiz() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- credit_xp_on_validation() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- current_profile_id() -> uuid | sql STABLE SECURITY DEFINER
-- dedupe_notifications() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- delete_my_account(p_confirm_text text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- export_eleves_csv() -> TABLE(prenom text, nom text, email text, created_at timestamp with time zone, last_active_at timestamp with time zone, n_validations integer, current_streak integer, total_xp integer, total_gemmes integer, enseignant_prenom text, enseignant_nom text, exam_ready boolean) | plpgsql STABLE SECURITY DEFINER
-- export_my_data() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- gdpr_pii_audit() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- generate_referral_code(p_length integer) -> text | plpgsql VOLATILE SECURITY DEFINER
-- get_audit_trail(p_table_name text, p_actor_id uuid, p_limit integer) -> SETOF audit_log | plpgsql STABLE SECURITY DEFINER
-- get_backend_stats() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_bilan_data(p_eleve_id uuid, p_trimestre_start timestamp with time zone) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_coaching_tip(p_eleve_id uuid) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_competence_difficulty(p_window_days integer) -> TABLE(competence_id text, n_attempts integer, n_failed integer, pct_failed numeric, avg_score numeric) | sql STABLE SECURITY DEFINER
-- get_consent_request(p_token text) -> TABLE(prenom text, inscrit_le timestamp with time zone, ecole_nom text) | sql STABLE SECURITY DEFINER
-- get_eleve_feedback_feed(p_eleve_id uuid, p_limit integer, p_offset integer) -> TABLE(kind text, ts timestamp with time zone, moniteur_id uuid, moniteur_prenom text, moniteur_nom text, competence_id text, duration_minutes integer, comment text, confirmation_status text) | plpgsql STABLE SECURITY DEFINER
-- get_eleve_journey(p_eleve_id uuid) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_eleve_leaderboard(p_scope text, p_limit integer) -> TABLE(rang integer, display_name text, score integer, is_me boolean, avatar text) | sql STABLE SECURITY DEFINER
-- get_eleve_pending_competences(p_eleve_id uuid) -> TABLE(competence_id text, code text, monde integer, ordre integer, nom text) | plpgsql STABLE SECURITY DEFINER
-- get_eleve_tags(p_eleve_id uuid) -> TABLE(tag text, color text, created_at timestamp with time zone) | sql STABLE SECURITY DEFINER
-- get_eleve_trend(p_eleve_id uuid, p_days integer) -> SETOF eleve_daily_snapshot | plpgsql STABLE SECURITY DEFINER
-- get_eleves_bloque_sur_competence(p_competence_id text, p_window_days integer) -> TABLE(eleve_id uuid, eleve_prenom text, eleve_nom text, n_fails integer, avg_score numeric, last_attempt_at timestamp with time zone, is_acquired boolean) | plpgsql STABLE SECURITY DEFINER
-- get_experiment_results(p_experiment_key text) -> TABLE(variant text, n_users integer, n_validations integer, n_quiz integer) | plpgsql STABLE SECURITY DEFINER
-- get_fraud_signals() -> TABLE(moniteur_id uuid, prenom text, nom text, total_sessions integer, total_minutes bigint, n_refused integer, n_auto_validated integer, n_eleves_diff integer, n_days_active integer, n_validations integer, flag_refused_sessions boolean, flag_high_auto_rate boolean, flag_hours_zero_val boolean, flag_single_eleve_burst boolean, flag_high_daily_avg boolean, flag_count integer) | plpgsql STABLE SECURITY DEFINER
-- get_gerant_cockpit() -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- get_gerant_cohort_details(p_cohort text, p_limit integer) -> TABLE(eleve_id uuid, prenom text, nom text, avatar_url text, last_active_at timestamp with time zone, streak integer, val_total integer, val_30j integer, enseignant_id uuid, enseignant_nom text) | plpgsql VOLATILE SECURITY DEFINER
-- get_global_stats() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_invitation_by_token(p_token text) -> TABLE(id uuid, email text, role text, auto_ecole_id uuid, auto_ecole_nom text, enseignant_attitre_id uuid, expires_at timestamp with time zone, accepted_at timestamp with time zone) | sql VOLATILE SECURITY DEFINER
-- get_items_catalog(p_type text) -> TABLE(id text, type text, name text, description text, cost_gemmes integer, rarity text, asset_url text, display_color text, ordre integer, owned boolean, acquired_at timestamp with time zone) | sql STABLE SECURITY DEFINER
-- get_live_activity(p_minutes integer) -> TABLE(ts timestamp with time zone, kind text, user_id uuid, user_prenom text, role text, detail jsonb) | plpgsql STABLE SECURITY DEFINER
-- get_moniteur_achievements() -> TABLE(id uuid, prenom text, nom text, avatar_url text, total_validations bigint, tier smallint, tier_name text) | sql VOLATILE SECURITY DEFINER
-- get_moniteur_dashboard(p_moniteur_id uuid, p_days integer) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_moniteur_level(p_moniteur_id uuid) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_moniteur_parcours_agg(p_moniteur_id uuid) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_moniteur_profile_stats() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_moniteur_ranking(p_month date) -> TABLE(moniteur_id uuid, moniteur_prenom text, moniteur_nom text, hours_confirmed numeric, n_validations integer, n_eleves_diff integer, n_jours_actifs integer, score_total numeric, rank integer, moniteur_avatar text) | plpgsql STABLE SECURITY DEFINER
-- get_my_achievements() -> TABLE(achievement_key text, unlocked_at timestamp with time zone, bonus_xp integer, bonus_gemmes integer, metadata jsonb) | sql STABLE SECURITY DEFINER
-- get_my_auto_ecole_id() -> uuid | sql STABLE SECURITY DEFINER
-- get_my_bookmarks() -> TABLE(competence_id text, competence_nom text, monde integer, note text, is_acquired boolean, created_at timestamp with time zone) | sql STABLE SECURITY DEFINER
-- get_my_chests() -> SETOF chest_unlocks | sql STABLE SECURITY DEFINER
-- get_my_freezes() -> SETOF streak_freezes | sql STABLE SECURITY DEFINER
-- get_my_goals_status() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_my_id() -> uuid | sql STABLE SECURITY DEFINER
-- get_my_inventory(p_type text) -> TABLE(item_id text, type text, name text, asset_url text, rarity text, display_color text, acquired_at timestamp with time zone) | sql STABLE SECURITY DEFINER
-- get_my_leaderboard_position() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_my_message_templates() -> TABLE(id text, emoji text, body text, category text, unlocked boolean, unlock_at_n_validations integer) | plpgsql STABLE SECURITY DEFINER
-- get_my_next_unlock_moniteur() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_my_pending_sessions() -> TABLE(id uuid, moniteur_prenom text, moniteur_nom text, duration_minutes integer, session_date date, logged_at timestamp with time zone) | sql STABLE SECURITY DEFINER
-- get_my_prediction() -> TABLE(prediction_pct integer, validated_count integer, avg_quiz_score numeric, longest_streak integer, velocity_per_week numeric, axes_to_improve text[]) | plpgsql STABLE SECURITY DEFINER
-- get_my_preferences() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_my_profile_completeness() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_my_referral_stats() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_my_role() -> text | sql STABLE SECURITY DEFINER
-- get_my_threads() -> TABLE(partner_id uuid, partner_prenom text, partner_nom text, partner_role text, last_message text, last_at timestamp with time zone, unread_count integer) | plpgsql STABLE SECURITY DEFINER
-- get_my_today_sessions() -> TABLE(id uuid, eleve_id uuid, eleve_prenom text, duration_minutes integer, confirmation_status text, logged_at timestamp with time zone) | sql STABLE SECURITY DEFINER
-- get_my_variant(p_experiment_key text) -> text | plpgsql VOLATILE SECURITY DEFINER
-- get_my_wrapped(p_year integer) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_pending_sessions_eleve() -> TABLE(session_id uuid, moniteur_id uuid, moniteur_prenom text, moniteur_avatar text, session_date date, duration_minutes integer, notes text, logged_at timestamp with time zone, n_validations integer) | plpgsql STABLE SECURITY DEFINER
-- get_public_school_info(p_slug text) -> jsonb | plpgsql STABLE
-- get_revision_recommendations(p_eleve_id uuid, p_limit integer) -> TABLE(competence_id text, competence_nom text, monde integer, reason text, priority_score numeric, validated_at timestamp with time zone, last_fail_at timestamp with time zone, n_fails integer) | plpgsql STABLE SECURITY DEFINER
-- get_school_benchmark() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_school_events(p_limit integer) -> SETOF school_events | plpgsql STABLE SECURITY DEFINER
-- get_school_leaderboard(p_limit integer) -> TABLE(rank integer, prenom text, initial_nom text, total_xp integer, n_validations integer, is_me boolean) | plpgsql STABLE SECURITY DEFINER
-- get_school_level(p_school_id uuid) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_school_pulse() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_school_spotlights() -> jsonb | plpgsql STABLE SECURITY DEFINER
-- get_school_trend(p_days integer) -> SETOF school_daily_snapshot | plpgsql STABLE SECURITY DEFINER
-- get_thread(p_partner_id uuid, p_limit integer, p_mark_read boolean) -> TABLE(id uuid, sender_id uuid, recipient_id uuid, body text, read_at timestamp with time zone, created_at timestamp with time zone, is_mine boolean) | plpgsql VOLATILE SECURITY DEFINER
-- get_today_quests() -> TABLE(quest_id text, title text, target integer, progress integer, completed boolean, claimed boolean, reward_xp integer, reward_gemmes integer) | plpgsql VOLATILE SECURITY DEFINER
-- get_user_optimal_hour(p_user_id uuid) -> integer | sql STABLE SECURITY DEFINER
-- get_world_stats(p_eleve_id uuid) -> TABLE(monde integer, monde_nom text, n_total integer, n_acquis integer, pct_acquis integer, avg_quiz_score numeric, last_validation timestamp with time zone) | plpgsql STABLE SECURITY DEFINER
-- get_wrapped_eleve(p_year integer) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- handle_new_user_signup() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- is_admin() -> boolean | sql STABLE SECURITY DEFINER
-- is_flag_enabled(p_key text) -> boolean | plpgsql STABLE SECURITY DEFINER
-- is_username_available(p_username text) -> boolean | sql STABLE SECURITY DEFINER
-- leads_rate_limit_check() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- list_my_webhooks() -> SETOF webhooks_subscriptions | plpgsql STABLE SECURITY DEFINER
-- log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date, p_notes text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date, p_notes text, p_competence_ids text[], p_comment text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- log_session_v2(p_eleve_id uuid, p_duration_minutes integer, p_session_date date, p_notes text, p_competence_ids text[], p_comment text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- mark_all_notifs_read(p_type text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- mark_notif_read(p_notif_id uuid) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- moderate_question(p_question_id uuid, p_status text, p_note text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- notify_eleve_on_session_insert() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- notify_eleve_on_session_logged() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- open_chest(p_chest_type text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- predict_exam_ready_date(p_eleve_id uuid) -> jsonb | plpgsql STABLE SECURITY DEFINER
-- propose_question(p_competence_id text, p_question text, p_choices jsonb, p_correct_idx integer, p_explanation text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- protect_auto_ecoles() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- protect_profile_fields() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- protect_streaks_fields() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- protect_validations() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- purchase_item(p_item_id text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- refresh_moniteur_ranking_mv() -> void | plpgsql VOLATILE SECURITY DEFINER
-- remove_eleve_tag(p_eleve_id uuid, p_tag text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- report_incident(p_category text, p_title text, p_description text, p_severity text, p_url text, p_user_agent text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- respond_flash_quiz(p_flash_quiz_id uuid, p_answers jsonb) -> TABLE(score integer, total integer, results jsonb) | plpgsql VOLATILE SECURITY DEFINER
-- revoke_marketing_consent() -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- rls_auto_enable() -> event_trigger | plpgsql VOLATILE SECURITY DEFINER
-- run_eleve_daily_snapshot() -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- run_sanity_check() -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- run_school_snapshot() -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- search_global(p_query text, p_limit integer) -> TABLE(kind text, id text, label text, sublabel text, route text, rank real) | plpgsql STABLE SECURITY DEFINER
-- send_flash_quiz(p_eleve_id uuid, p_competence_id text) -> TABLE(id uuid, question_ids uuid[], expires_at timestamp with time zone) | plpgsql VOLATILE SECURITY DEFINER
-- send_message(p_recipient_id uuid, p_body text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- send_push_on_notification_insert() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- send_quiz_notification(p_eleve_id uuid, p_competence_id text, p_comp_nom text) -> void | plpgsql VOLATILE SECURITY DEFINER
-- set_consolidation_due() -> trigger | plpgsql VOLATILE
-- set_eleve_signup_profile(p_username text, p_nom text, p_prenom text, p_date_naissance date, p_parent_email text) -> TABLE(consent_required boolean, consent_token text) | plpgsql VOLATILE SECURITY DEFINER
-- set_flag(p_key text, p_enabled boolean, p_rollout_pct integer, p_target_role text, p_description text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- set_my_goals(p_target_exam_date date, p_target_comp_per_week integer, p_motivation_text text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- set_my_preferences(p_data jsonb) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- start_exam_blanc() -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- submit_competence_quiz(p_competence_id text, p_score integer, p_type text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- submit_exam_blanc(p_session_id uuid, p_answers jsonb) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- submit_quiz_feedback(p_competence_id text, p_difficulty integer, p_question_id uuid, p_was_correct boolean, p_text text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- suggest_eleve_to_call(p_moniteur_id uuid) -> TABLE(eleve_id uuid, prenom text, nom text, reason text, priority integer, last_session timestamp with time zone, n_comp integer) | plpgsql STABLE SECURITY DEFINER
-- suggest_moniteur_for_eleve(p_eleve_id uuid) -> TABLE(moniteur_id uuid, prenom text, nom text, match_score numeric, reasons jsonb) | plpgsql STABLE SECURITY DEFINER
-- suggest_next_session(p_day_of_week integer) -> TABLE(eleve_id uuid, eleve_prenom text, typical_duration integer, last_seen_at timestamp with time zone, occurrence_count integer) | sql STABLE SECURITY DEFINER
-- sync_profile_email() -> trigger | plpgsql VOLATILE SECURITY DEFINER
-- toggle_comp_bookmark(p_comp_id text, p_note text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- track_event(p_event_name text, p_properties jsonb, p_session_id text) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- unlock_chest(p_chest_type text, p_rewards jsonb) -> jsonb | plpgsql VOLATILE SECURITY DEFINER
-- use_streak_freeze(p_date date) -> jsonb | plpgsql VOLATILE SECURITY DEFINER

-- ============ PG_CRON JOBS (23) — schedule + commande (tronquée) ============
-- Réf. exacte : SELECT jobname, schedule, command FROM cron.job; en prod.
-- [0 * * * *]  trigger-consolidation-hourly  ::   select net.http_post( url := 'https://arrfmdagdqtrtfbhxlty.supabase.co/functions/v1/trigger-consolidation', headers := jsonb_build_object('Content-Type', 'appl
-- [0 18 * * *]  check-streak-risk-daily  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/check-streak-risk', headers := jsonb_build_object('Conten
-- [0 9 * * 1]  check-students-at-risk-weekly  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/check-students-at-risk', headers := jsonb_build_object('C
-- [5 0 * * *]  refresh-streak-pro-daily  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/refresh-streak-pro', headers := jsonb_build_object('Conte
-- [0 3 * * *]  auto-confirm-sessions-daily  ::   UPDATE public.sessions_moniteur SET confirmation_status = 'auto', confirmed_at = now() WHERE confirmation_status = 'pending' AND logged_at < now() - INTERVAL '
-- [0 18 * * 0]  weekly-recap-eleve-sunday  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/weekly-recap-eleve', headers := jsonb_build_object('Conte
-- [0 8 1 * *]  monthly-recap-moniteur  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/monthly-recap-moniteur', headers := jsonb_build_object('C
-- [0 23 * * *]  school-daily-snapshot  ::   SELECT public.run_school_snapshot();
-- [0 7 * * 1]  fraud-alert-gerant-weekly  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/check-fraud-alert-gerant', headers := jsonb_build_object(
-- [30 3 * * *]  cleanup-old-notifications  ::   DELETE FROM public.notifications WHERE read = true AND read_at < now() - INTERVAL '60 days';
-- [40 3 * * *]  cleanup-audit-log  ::   DELETE FROM public.audit_log WHERE created_at < now() - INTERVAL '90 days';
-- [0 17 * * 5]  friday-digest-moniteur  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/friday-digest-moniteur', headers := jsonb_build_object('C
-- [0 */4 * * *]  refresh-moniteur-ranking-mv  ::   SELECT public.refresh_moniteur_ranking_mv();
-- [0 * * * *]  send-emotional-nudge-hourly  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/send-emotional-nudge', headers := jsonb_build_object('Con
-- [50 3 * * *]  cleanup-rate-limit-log  ::   DELETE FROM rate_limit_log WHERE created_at < now() - INTERVAL '7 days';
-- [0 17 * * *]  smart-reengagement-daily  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/smart-reengagement', headers := jsonb_build_object('Conte
-- [0 7 * * 1]  gerant-weekly-digest  ::   SELECT net.http_post( url := (SELECT value FROM app_config WHERE key = 'SUPABASE_FUNCTIONS_URL') || '/gerant-weekly-digest', headers := jsonb_build_object('Con
-- [5 23 * * *]  eleve-daily-snapshot  ::   SELECT public.run_eleve_daily_snapshot();
-- [0 12 * * *]  sanity-check-daily  ::   SELECT public.run_sanity_check();
-- [0 4 * * 0]  cleanup-events-analytics-yearly  ::   DELETE FROM events_analytics WHERE created_at < now() - INTERVAL '365 days';
-- [10 4 * * 0]  cleanup-old-leads  ::   DELETE FROM leads WHERE created_at < now() - INTERVAL '12 months';
-- [20 4 * * 0]  cleanup-old-exam-blancs  ::   DELETE FROM exam_blanc_sessions WHERE started_at < now() - INTERVAL '24 months';
-- [30 4 * * 0]  cleanup-old-messages  ::   DELETE FROM messages WHERE created_at < now() - INTERVAL '18 months';

-- ============ GRANTS (note) ============
-- anon / authenticated / service_role ont les GRANT ALL par défaut Supabase
-- sur TOUTES les tables + vues public (accès réel borné par la RLS).
-- ⚠️ CONSTAT SÉCU : malgré security_lockdown_anon_revoke / lockdown_gdpr_anon_revoke_v2,
--    le rôle anon détient TOUJOURS SELECT/INSERT/UPDATE/DELETE/TRUNCATE sur tout public.
--    Inerte tant que la RLS tient, mais le REVOKE attendu n'a pas pris. À auditer.

-- ===== FIN BASELINE =====
