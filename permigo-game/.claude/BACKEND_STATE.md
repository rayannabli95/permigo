# 🗄️ BACKEND_STATE — État complet PermiGo

*Source de vérité technique du backend Supabase. Mis à jour : 2026-05-18.*
*À relire au début de chaque session pour avoir le contexte technique.*

---

## 📊 Métriques globales

| Métrique | Valeur |
|---|---|
| **RPC SECURITY DEFINER** | 92 |
| **Triggers DB** | 16 |
| **pg_cron actifs** | 13 |
| **Tables principales** | 30 |
| **Vues SQL** | 4 |
| **Edge functions** | 10 |

---

## 🗂 Tables (30)

### Core
- `profiles` — users (id ≠ auth_id !) avec xp, gemmes, referral_code, referred_by
- `auto_ecoles` — écoles (id, nom, slug, ville)
- `competences_remc` — 31 compétences (id, code, nom, monde, ordre)
- `remc_questions` — pool quiz
- `validations` — comp acquises (eleve_id, competence_id, validated_by, note_enseignant)
- `quiz_attempts` — scores quiz
- `streaks` — streak quotidien
- `lecons_realisees` — legacy (côté élève désactivé, gardé pour back-compat)
- `notifications` — bell + push (title NOT NULL, read + read_at)
- `push_subscriptions` — VAPID web push subs
- `invitations` — invitations enseignant par email
- `leads` — leads marketing
- `events_analytics` — tracking (user_id, event_name, properties, role, school)

### Gamification
- `chest_unlocks` — coffres (world_1-4, streak_7/14/30, perfect_quiz)
- `achievements_unlocked` — milestones progressifs (comp_5/10/15/20/25/28/31, streak_3/14/60, quiz_10/50/perfect_5)
- `items_catalog` — boutique (avatars, thèmes, fonds permis, boosts)
- `user_inventory` — items achetés
- `streak_freezes` — geler 1 jour pour 50 gemmes
- `daily_quests_progress` — 3 quêtes/jour avec XP/gemmes

### PermiGo Log (sessions moniteur)
- `sessions_moniteur` — sessions déclarées (caps 10h/jour, 50h/semaine, 7j max)
- `messages` — messagerie 1:1 (sender, recipient, thread_id, body)

### Examens & Analytics
- `exam_blanc_sessions` — examens blancs 40 questions
- `school_daily_snapshot` — KPI école par jour (validations/quiz/sessions_h)

### Infrastructure
- `experiments` + `experiment_assignments` — A/B test
- `feature_flags` — activation features dynamique
- `incident_reports` — feedback bug user
- `audit_log` — actions sensibles (validations/sessions/profiles)
- `app_config` — secrets (DISPATCH_PUSH_SECRET, SUPABASE_FUNCTIONS_URL)

---

## 🔧 RPC SECURITY DEFINER (92)

### Helper utilitaire
- `current_profile_id()` — ⚠️ **À utiliser dans toute RPC** au lieu de `auth.uid()` (qui retourne `profiles.auth_id`)
- `compute_thread_id(a, b)` — hash uuid deterministe par paire (messagerie)
- `add_gemmes(amount)` — crédit gemmes générique

### Côté ÉLÈVE
| RPC | Usage |
|---|---|
| `get_coaching_tip(eleve_id?)` | Tip contextuel personnalisé |
| `predict_exam_ready_date(eleve_id?)` | Date examen prédite |
| `get_my_wrapped(year?)` | Récap annuel Spotify-style |
| `get_my_achievements()` | Milestones débloqués |
| `get_today_quests()` | 3 quêtes du jour |
| `claim_quest(quest_id)` | Réclame récompenses |
| `get_items_catalog(type?)` | Boutique avec flag owned |
| `purchase_item(item_id)` | Achat avec débit gemmes |
| `get_my_inventory(type?)` | Items débloqués |
| `use_streak_freeze(date?)` | Geler 1 jour 50💎 |
| `get_my_freezes()` | Historique freezes |
| `start_exam_blanc()` | Lance exam 40 questions |
| `submit_exam_blanc(session_id, answers)` | Score + résultats |
| `generate_referral_code(length?)` | Code parrain 6 chars |
| `apply_referral(code)` | +200 XP +50 gemmes |
| `get_my_referral_stats()` | Code + n_referrals + xp earned |
| `unlock_chest(type, rewards)` / `open_chest(type)` / `get_my_chests()` | Coffres |
| `get_revision_recommendations(eleve_id?, limit?)` | 3-5 comp à réviser |

### Côté ENSEIGNANT
| RPC | Usage |
|---|---|
| `log_session(eleve_id, duration, date, notes, comp_ids?, comment?)` | Session atomique + comp + commentaire |
| `confirm_session(session_id, status)` | Élève oui/non |
| `get_my_pending_sessions()` | Sessions à confirmer (élève) |
| `get_my_today_sessions()` | Récap soir moniteur |
| `suggest_next_session(day_of_week?)` | Suggestions habitudes |
| `get_moniteur_ranking(month?)` | Ranking 4-dim mensuel |
| `get_moniteur_dashboard(id?, days?)` | KPI complets + timeline + rank |
| `suggest_moniteur_for_eleve(eleve_id)` | Match-score multi-critères |
| `get_eleve_journey(eleve_id)` | Timeline 100 events |
| `get_eleve_pending_competences(eleve_id)` | Comp non-validées pour chips |
| `get_eleve_feedback_feed(eleve_id?, limit?, offset?)` | Timeline feedback |
| `get_eleves_bloque_sur_competence(comp_id, days)` | Drill comp difficile |

### Côté GÉRANT
| RPC | Usage |
|---|---|
| `get_school_pulse()` | KPI école synthétique |
| `get_school_trend(days)` | Évolution 30j SETOF snapshot |
| `get_school_spotlights()` | Top progressant/streak/moniteur/comp |
| `export_eleves_csv()` | Liste élèves pour CSV |
| `get_bilan_data(eleve_id, trimestre?)` | Bilan trimestriel complet |

### Côté ADMIN (rayannabli27@gmail.com)
| RPC | Usage |
|---|---|
| `get_global_stats()` | Vue platform/engagement/conversion |
| `admin_get_dashboard()` | Debug counts/activity 24h/crons |
| `get_audit_trail(table?, actor?, limit?)` | Historique actions |
| `get_live_activity(minutes?)` | Events 5 dernières min |
| `get_backend_stats()` | Diagnostic technique |
| `admin_list_incidents(status?, limit?)` | Liste incidents |
| `get_fraud_signals()` | Signaux anti-fraude moniteurs |
| `set_flag(key, enabled, rollout, target_role, desc)` | Set feature flag |
| `get_experiment_results(exp_key)` | Stats A/B test |

### Notifs
- `mark_notif_read(id)` / `mark_all_notifs_read(type?)` / `count_unread_notifs(type?)`

### Tech transverse
- `is_flag_enabled(key)` — feature flag check
- `get_my_variant(experiment_key)` — A/B variant deterministe
- `track_event(name, props?, session?)` — analytics (fail silent)
- `report_incident(category, title, desc, severity?, url?, ua?)` — user report bug
- `get_user_optimal_hour(user_id?)` — heure de connexion habituelle
- `get_public_school_info(slug)` — anon-accessible vitrine école
- `get_competence_difficulty(days?)` — % échec par comp
- `run_school_snapshot()` — déclenche snapshot manuel

---

## 🪝 Triggers DB (16)

### Crédit XP automatique
- `trg_credit_xp_on_validation` — +100 XP élève
- `trg_credit_xp_on_quiz` — +30/50/+20 quiz
- `trg_credit_xp_on_chest_open` — XP du tier
- `trg_credit_xp_moniteur_on_validation` — +15 XP moniteur
- `trg_credit_xp_moniteur_on_session` — +10 XP moniteur
- `trg_credit_xp_moniteur_on_session_confirm` — +5 XP bonus

### Achievements auto
- `trg_check_validation_achievements` — milestones comp (5/10/15/20/25/28/31)
- `trg_check_streak_achievements` — milestones streak (3/14/60)
- `trg_check_quiz_achievements` — milestones quiz (10/50/perfect_5)

### Quêtes auto-progress
- `trg_advance_quest_validation`
- `trg_advance_quest_quiz`

### Audit log
- `trg_audit_validations`, `trg_audit_sessions`, `trg_audit_profiles`

### Notif élève session
- `trg_notify_eleve_on_session_insert` — crée notif `session_confirmation`

---

## ⏰ pg_cron jobs (13)

```
trigger-consolidation-hourly       0 * * * *   — quiz consolidation
auto-confirm-sessions-daily        0 3 * * *   — sessions 7j pending → auto
cleanup-old-notifications          30 3 * * *  — notifs lues >60j
cleanup-audit-log                  40 3 * * *  — audit >90j
refresh-streak-pro-daily           5 0 * * *   — streak pro
fraud-alert-gerant-weekly          0 7 * * 1   — alerte fraude gérant
monthly-recap-moniteur             0 8 1 * *   — récap mensuel 1er du mois
check-students-at-risk-weekly      0 9 * * 1   — alerte moniteur élève inactif
send-emotional-nudge-daily         0 10 * * *  — nudges 11h Paris
friday-digest-moniteur             0 17 * * 5  — digest vendredi 18h
check-streak-risk-daily            0 18 * * *  — alerte streak en danger
weekly-recap-eleve-sunday          0 18 * * 0  — récap dimanche 19h
school-daily-snapshot              0 23 * * *  — KPI école
```

---

## ⚡ Edge functions (10)

| Function | verify_jwt | Trigger |
|---|---|---|
| `dispatch-push` v4 | false | Trigger DB notifs (6 types) |
| `send-emotional-nudge` | false | pg_cron 10h UTC |
| `weekly-recap-eleve` | false | pg_cron dimanche 18h UTC |
| `monthly-recap-moniteur` | false | pg_cron 1er du mois 8h UTC |
| `friday-digest-moniteur` | false | pg_cron vendredi 17h UTC |
| `check-streak-risk` | false | pg_cron 18h UTC |
| `check-students-at-risk` | false | pg_cron lundi 9h UTC |
| `check-fraud-alert-gerant` | false | pg_cron lundi 7h UTC |
| `refresh-streak-pro` | false | pg_cron 00:05 UTC |
| `send-invitation-email` | true | RPC `create_invitation` |

---

## 🔐 Règles d'or backend

1. **`auth.uid()` ≠ `profiles.id`** — toujours utiliser `current_profile_id()`
2. **Toutes FK pointent vers `profiles.id`** (pas `auth.users.id`)
3. **`notifications.title` est NOT NULL** — toujours fournir un title dans les inserts
4. **`SECURITY DEFINER` + `SET search_path = public`** — toutes mes RPC
5. **`GRANT EXECUTE TO authenticated`** — pour chaque RPC
6. **RLS avec `(SELECT auth.uid())`** au lieu de `auth.uid()` direct (perf initplan)
7. **Caps physiques** sur sessions : 10h/jour, 50h/sem, 7j max ancienneté
8. **Anti-spam** notifs : check si dernière notif du même type <X heures

---

## 📋 Conventions naming

- `p_param` pour args RPC
- `v_var` pour variables locales SQL
- `idx_<table>_<col>` pour indexes
- `trg_<action>` pour triggers
- `flag_*` pour boolean signaux
- `n_*` pour counts
- Tables au pluriel (`validations`, `chest_unlocks`)
- RPC verbe + objet (`get_my_chests`, `purchase_item`)

---

## ⚠️ Dette technique connue

- **Multiple permissive policies** sur `sessions_moniteur` et `exam_blanc_sessions` (3 et 2 policies SELECT) — voulu pour multi-rôle, accepté
- **Unused indexes** (info-only) — créés récemment, vont être utilisés avec le câblage frontend
- **4 `.bak` files** dans `src/pages/eleve/` et `src/pages/common/` — sandbox bloque le rm, user doit faire à la main
- **Crédit XP cosmétique côté front** déjà patché DB mais les anciens toasts peuvent mentir
- **Activer Leaked Password Protection** Supabase Auth dashboard
- **Supprimer manuellement edge fn `generate-vapid-keys`** (utilitaire one-shot)

---

## 🔗 Liens utiles

- Project ID Supabase : `arrfmdagdqtrtfbhxlty`
- Admin email : `rayannabli27@gmail.com`
- Routes API SQL : execute via `mcp__31727b35-9278-4b6b-97c4-5fc9a4f48a52__execute_sql`
- Migration via : `apply_migration`
- Edge functions via : `deploy_edge_function`
