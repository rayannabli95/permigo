# Objets manquants aux migrations — permigo-game/ — 2026-05-20

Roadmap de récupération du schéma. Croisement entre l'inventaire prod (catalogue Postgres, projet `arrfmdagdqtrtfbhxlty`), les objets versionnés dans `0000-0006`, et les références réelles des 52 RPC (parsing de `0007_rpc_recovery_RAW.sql`). Lecture seule.

**Critère « Critique démo ? »** = alimente la boucle de démonstration **validation → quiz → classement moniteur + cockpit gérant**.

**Notes**
- `user_preferences` : le fichier `0005_user_preferences.sql` ne contient aucun `CREATE TABLE` → la table compte comme manquante.
- Aucun **type ENUM / composite custom** : les `%ROWTYPE` (`sessions_moniteur`, `daily_quests_progress`…) sont des row-types de tables, couverts en recréant les tables.
- Récap : **21 tables**, **1 vue**, **1 matview**, **4 helpers**, **24 triggers** (+ leurs fonctions).

## 1. Tables / Vues / Matviews

| Type | Nom | Utilisé par (RPC) | Critique démo ? |
|---|---|---|---|
| Table | **sessions_moniteur** | log_session, confirm_session, get_moniteur_ranking, get_gerant_cockpit, get_my_today_sessions, get_pending_sessions_eleve, get_my_pending_sessions, get_wrapped_eleve, suggest_next_session, check_duplicate_session, get_eleve_feedback_feed, export_my_data | **OUI** |
| Matview | **moniteur_ranking_mv** | get_moniteur_ranking | **OUI** |
| Table | **exam_blanc_sessions** | get_gerant_cockpit, start_exam_blanc, submit_exam_blanc, export_my_data | **OUI** (dépendance cockpit) |
| Table | daily_quests_progress | claim_quest, get_today_quests, export_my_data | NON |
| Table | items_catalog | get_items_catalog, purchase_item | NON |
| Table | user_inventory | get_items_catalog, purchase_item, export_my_data | NON |
| Table | chest_unlocks | get_my_chests, open_chest, unlock_chest, export_my_data | NON |
| Table | achievements_unlocked | get_my_achievements, export_my_data | NON |
| Table | messages | send_message, get_my_threads, get_thread, delete_my_account, export_my_data | NON |
| Table | message_templates | get_my_message_templates | NON |
| Table | moniteur_paliers | get_my_next_unlock_moniteur | NON |
| Table | streak_freezes | use_streak_freeze, delete_my_account, export_my_data | NON |
| Table | user_preferences | get_my_preferences, set_my_preferences, delete_my_account, export_my_data | NON |
| Table | eleve_goals | delete_my_account, export_my_data | NON |
| Table | eleve_tags | delete_my_account, export_my_data | NON |
| Table | comp_bookmarks | delete_my_account, export_my_data | NON |
| Table | push_subscriptions | admin_get_dashboard, delete_my_account | NON |
| Table | remc_questions | start_exam_blanc | NON |
| Table | school_daily_snapshot | get_school_trend | NON |
| Table | incident_reports | export_my_data | NON |
| Table | audit_log | export_my_data | NON |
| Table | webhooks_subscriptions | delete_my_account | NON |
| Vue | suspicious_moniteurs_v | get_fraud_signals | NON |

## 2. Helpers (fonctions normales)

| Type | Nom | Utilisé par (RPC) | Critique démo ? |
|---|---|---|---|
| Helper fn | **current_profile_id()** | 46 RPC (toutes les RPC authentifiées, dont validation / ranking / cockpit) | **OUI** |
| Helper fn | _set_trusted_op() | apply_referral, claim_quest, purchase_item, use_streak_freeze | NON |
| Helper fn | compute_thread_id() | send_message, get_thread | NON |
| Helper fn | is_admin() | get_fraud_signals | NON |

## 3. Triggers (+ leurs fonctions)

Non appelés directement par les RPC, mais se déclenchent sur les tables que les RPC écrivent.

| Type | Trigger → fonction (table) | Rôle | Critique démo ? |
|---|---|---|---|
| Trigger | trg_credit_xp_on_validation → credit_xp_on_validation (validations) | XP élève à la validation | **OUI** |
| Trigger | trg_credit_xp_moniteur_on_validation → credit_xp_moniteur_on_validation (validations) | XP moniteur → classement | **OUI** |
| Trigger | trg_credit_xp_moniteur_on_session → credit_xp_moniteur_on_session (sessions_moniteur) | XP moniteur sur séance | **OUI** |
| Trigger | trg_credit_xp_moniteur_on_session_confirm → credit_xp_moniteur_on_session_confirm (sessions_moniteur) | XP moniteur à la confirmation | **OUI** |
| Trigger | trg_credit_xp_on_quiz → credit_xp_on_quiz (quiz_attempts) | XP élève au quiz | **OUI** |
| Trigger | trg_notify_eleve_on_session_insert → notify_eleve_on_session_insert (sessions_moniteur) | Notif élève (flux séance→quiz) | **OUI** |
| Trigger | trg_notify_eleve_session_logged → notify_eleve_on_session_logged (sessions_moniteur) | Notif élève séance loggée | **OUI** |
| Trigger | trg_advance_quest_validation → advance_quest_validation (validations) | Avance quêtes | NON |
| Trigger | trg_advance_quest_quiz → advance_quest_quiz (quiz_attempts) | Avance quêtes | NON |
| Trigger | trg_check_validation_achievements → check_validation_achievements (validations) | Trophées | NON |
| Trigger | trg_check_quiz_achievements → check_quiz_achievements (quiz_attempts) | Trophées | NON |
| Trigger | trg_check_streak_achievements → check_streak_achievements (streaks) | Trophées | NON |
| Trigger | trg_bump_moniteur_streak_on_session → bump_moniteur_streak_on_session (sessions_moniteur) | Streak moniteur | NON |
| Trigger | trg_credit_xp_on_chest_open → credit_xp_on_chest_open (chest_unlocks) | XP coffre | NON |
| Trigger | trg_dedupe_notifications → dedupe_notifications (notifications) | Anti-doublon notifs | NON |
| Trigger | notif_dispatch_push → send_push_on_notification_insert (notifications) | Push web (subs absentes) | NON |
| Trigger | trg_audit_profiles / trg_audit_sessions / trg_audit_validations → _log_audit | Audit log | NON |
| Trigger | trg_protect_profile_fields → protect_profile_fields (profiles) | Garde anti-triche | NON (sécurité) |
| Trigger | trg_protect_validations → protect_validations (validations) | Garde anti-triche | NON (sécurité) |
| Trigger | trg_protect_streaks → protect_streaks_fields (streaks) | Garde anti-triche | NON (sécurité) |
| Trigger | trg_protect_auto_ecoles → protect_auto_ecoles (auto_ecoles) | Garde anti-triche | NON (sécurité) |
| Trigger | trg_leads_rate_limit → leads_rate_limit_check (leads) | Rate-limit leads | NON |

## Noyau minimal « démo qui tourne » (objets OUI)

1. Helper `current_profile_id()`
2. Tables `sessions_moniteur`, `exam_blanc_sessions`
3. Matview `moniteur_ranking_mv` (+ fonction `refresh_moniteur_ranking_mv`)
4. Les 7 triggers XP/notif marqués OUI (+ leurs fonctions)

→ objet de la migration `0008_demo_core_recovery.sql`. Le reste suivra par vagues (gamif, messagerie, RGPD, sécurité, analytics).
