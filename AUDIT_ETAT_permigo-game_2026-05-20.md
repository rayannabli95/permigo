# Audit état — permigo-game/ — 2026-05-20

Audit en lecture seule. Statuts inférés du code, des migrations, de git et de checks statiques (pas de test runtime — le build n'est pas exécutable dans le sandbox Linux, voir §4).

## 1. Pages & routes

Accès piloté par rôle dans `src/router.js` (`ROUTES[role]`), hash router `#/route/{param}`. Aucune page placeholder/vide.

**Public (hors auth)**
- `auth/login` — fonctionnelle
- `public/signup` — fonctionnelle
- `onboarding/index` — fonctionnelle
- `public/ecole` (`#/ecole/{slug}`) — fonctionnelle (page école publique, accessible aux 3 rôles aussi)

**Élève**
- `eleve/accueil` (défaut, 1225 l.), `eleve/parcours` (1851 l.), `eleve/quiz`, `eleve/examen`, `eleve/exam-blanc`, `eleve/trophees`, `eleve/galerie`, `eleve/boutique`, `eleve/mes-coffres`, `eleve/wrapped`, `eleve/feedback`, `eleve/session-confirmation` — toutes code-complètes.

**Moniteur (enseignant)**
- `enseignant/aujourdhui` (défaut), `enseignant/validation`, `enseignant/mes-eleves`, `enseignant/livret-remc`, `enseignant/insights`, `enseignant/bilan`, `enseignant/log-session`, `enseignant/parcours-pro`, `enseignant/parcours-pro-complet` — code-complètes.
- ⚠️ `enseignant/parcours.js` (859 l.) — **orphelin** : pas mappé dans le router (le routeur pointe `parcours`→`parcours-pro.js`).

**Patron (gérant)**
- `gerant/cockpit` (défaut), `gerant/pulse`, `gerant/equipe`, `gerant/eleves` ; réutilise `enseignant/livret-remc` et `enseignant/bilan` — code-complètes.

**Commun (3 rôles)**
- `common/messages`, `common/notifications`, `common/profil`, `common/settings`, `common/legal`, `admin/debug` — code-complètes.

Fichiers <10 lignes : `data/trophies.js` (re-export déprécié → `trophees.js`), `utils/remc-label.js` (8 l., normal). Aucun n'est un placeholder cassé.

## 2. Features

**End-to-end (code présent côté front + backend versionné)**
- Auth Supabase : signup / login / onboarding + trigger `handle_new_user_signup`.
- Validation REMC : `validation.js` + `award_xp_on_validation` + trigger prérequis `check_validation_prerequisites` + `set_consolidation_due`.
- XP moniteur : migration `0003_xp_moniteur` + `data/moniteur-levels.js`.
- Quiz post-validation : `modules/pedagogie/quiz-engine.js`.
- Parcours élève (31 compétences) : `eleve/parcours.js`.

**Commencé, pas fini**
- Sprint 7 (dernier commit) : flux séance→quiz + statut `a_valider` + retrait crédits heures — touche `validation`, `livret-remc`, `parcours`, `accueil`.
- Web push : `services/web-push.js` avec `TODO(Cowork)` explicites — table `push_subscriptions` **absente des migrations**.
- `accueil.js` : `hoursThisWeek: 0 // TODO` (donnée en dur tant que `lecons_realisees` n'est pas alimentée).

**Prévu mais absent (côté backend)**
- La quasi-totalité de la logique RPC : 51 fonctions appelées par le front, 7 seulement versionnées ici (voir §3).

## 3. Base de données (`permigo-game/supabase/migrations/`)

**12 tables — toutes avec RLS activée, 26 policies au total :**
`profiles`, `auto_ecoles`, `competences_remc`, `questions_competence`, `validations`, `quiz_attempts`, `lecons_realisees`, `streaks`, `notifications`, `invitations`, `leads`, `events_analytics`.

**Tables seedées :**
- `competences_remc` (référentiel REMC — `0001`)
- `questions_competence` (quiz — `0002` + `0006_monde1`)
- `profiles` (un enregistrement de seed)

**Fichiers de migration :** `0000_initial_schema`, `0001_seed_competences_remc`, `0002_seed_questions`, `0003_validation_prerequisites_trigger`, `0003_xp_moniteur`, `0005_user_preferences`, `0006_seed_questions_monde1`.
Numérotation incohérente : **deux `0003`, pas de `0004`**.

**⚠️ Dérive migrations ↔ prod (risque majeur)**
Le front appelle **51 RPC** (`sb.rpc(...)`). Seules **7 fonctions** sont définies ici :
`award_xp_on_validation`, `check_validation_prerequisites`, `get_my_auto_ecole_id`, `get_my_id`, `get_my_role`, `handle_new_user_signup`, `set_consolidation_due`.

**44 RPC appelées mais absentes de `permigo-game/supabase/migrations/`** (certaines existent dans `racine/supabase/migrations/` : `get_gerant_cockpit`, `get_gerant_cohort_details`, `get_wrapped_eleve`) :

```
accept_invitation, admin_get_dashboard, apply_referral, check_duplicate_session,
claim_quest, confirm_session, delete_my_account, export_my_data,
generate_referral_code, get_bilan_data, get_coaching_tip, get_eleve_feedback_feed,
get_eleve_pending_competences, get_eleves_bloque_sur_competence, get_fraud_signals,
get_gerant_cockpit, get_gerant_cohort_details, get_invitation_by_token,
get_items_catalog, get_moniteur_ranking, get_my_achievements, get_my_chests,
get_my_leaderboard_position, get_my_message_templates, get_my_next_unlock_moniteur,
get_my_pending_sessions, get_my_preferences, get_my_referral_stats, get_my_threads,
get_my_today_sessions, get_pending_sessions_eleve, get_revision_recommendations,
get_school_trend, get_thread, get_today_quests, get_wrapped_eleve, log_session,
mark_all_notifs_read, mark_notif_read, open_chest, predict_exam_ready_date,
purchase_item, send_message, send_quiz_notification, set_my_preferences,
start_exam_blanc, submit_competence_quiz, submit_exam_blanc, suggest_next_session,
unlock_chest, use_streak_freeze
```

Conséquence : les migrations ne reproduisent pas la prod. Un déploiement « propre » donne une app cassée (dont le classement moniteur, `get_moniteur_ranking` = la value-prop).

## 4. État technique

- **Build (`npm run build`)** : non vérifiable dans le sandbox (Linux vs `node_modules` natif macOS → erreur native rollup `MODULE_NOT_FOUND`). À lancer en local.
- **Syntaxe** : `node --check` passe sur **111/111** fichiers `.js`.
- **Lint (`npm run lint`)** : le script = `echo 'No lint configured yet'` → **aucun lint réel**.
- **Tests (`npm run test`)** : 9 specs Playwright e2e (`tests/e2e/`, dont `a11y.spec.js` via axe-core). Non exécutables ici (navigateurs + serveur requis).
- **Console** : 11 `console.log`, 54 `console.error`, 40 `console.warn` dans `src/`. Pas de logger central.

## 5. Derniers 7 jours

Tous les commits datent du 18–20/05 (activité intense, Sprints 5.5 → 7). Messages souvent non descriptifs (`push`, `p`, `f`).

Fichiers les plus touchés : `eleve/parcours.js` (25), `enseignant/validation.js` (18), `eleve/accueil.js` (18), `enseignant/aujourdhui.js` (17), `router.js` (16), `common/profil.js` (15).

Contexte en cours :
- **Sprint 7** (le plus récent) : boucle séance→quiz + statut `a_valider` + retrait de la notion de crédits d'heures.
- **Sprint 6** : backgrounds mondes jour/nuit (parcours + landing).
- **Sprint 5.5** : KPI cockpit gérant (taux réussite 90j) + tri équipe/élèves.

## 6. Verdict

**Prochaine feature logique pour une démo à un patron**
Fiabiliser la boucle centrale = moniteur valide une compétence → l'élève la voit dans son parcours + fait le quiz → le classement moniteur (`get_moniteur_ranking`) s'actualise. C'est la value-prop, et c'est ce que Sprint 7 câble actuellement. Le `cockpit` gérant (vue acheteur) est déjà code-complet — bon second écran à montrer, à condition que ses RPC soient bien en prod.

**3 plus gros risques techniques**
1. **Migrations ≠ prod** : 44/51 RPC (dont le classement) non versionnées. Pas de source de vérité backend ; DB non reproductible ; redéploiement ou onboarding dev = app cassée.
2. **Aucun garde-fou qualité automatisé** : lint factice, build non testé en CI, tests e2e non lancés. Rien n'empêche un commit cassé de partir (cf. historique git `push`/`p`/`f`).
3. **Dérive d'état/assets** : table `push_subscriptions` manquante (web push cassé), page `enseignant/parcours.js` orpheline, numérotation migrations incohérente (deux `0003`, pas de `0004`), `hoursThisWeek` en dur.
