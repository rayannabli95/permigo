# Audit pré-déploiement — Backend & Sécurité (2026-06-16)
*Night session, read-only (rien modifié en prod). Source : Supabase advisors + introspection `pg_policies`/`pg_proc`/grants + revue manuelle des fonctions anon.*

## 🟢 Verdict global : prêt pour le lancement côté sécurité
**Aucune faille critique ni élevée.** RLS partout, fonctions durcies, surface anon minimale et token-gated, vues sans bypass RLS, données sensibles verrouillées. Il reste des **nettoyages mineurs** (perf + 3 durcissements optionnels) — aucun ne bloque le déploiement.

Advisors : **0 ERROR**, 137 WARN, 4 INFO (sécurité) ; perf = INFO/WARN uniquement.

---

## 1. Sécurité — détail

### RLS (Row Level Security)
- **Activée sur 100 % des tables `public`.**
- 4 tables ont RLS **sans policy** → `app_config`, `audit_log`, `rate_limit_log`, `webhooks_deliveries`. RLS + 0 policy = **deny-all** (seul le service_role/backend y accède). ✅ **Intentionnel et sûr.**

### Fonctions SECURITY DEFINER
- ~136 fonctions `security definer` (les RPC de l'app). **100 % ont un `search_path` figé** → **0 risque d'injection par search_path**. ✅
- Le lint « authenticated peut exécuter » (130×) est *par design* : ce sont les RPC appelées par le front. Chacune filtre l'identité en interne (`current_profile_id()`, rôle, école).

### Surface anonyme (internet public) — la plus scrutée
Un visiteur **non connecté** peut UNIQUEMENT :
1. **`INSERT` dans `leads`** (formulaire prospect) — **rate-limité 3/h par email** (`leads_rate_limit_check`). ✅
2. Appeler **6 fonctions pré-auth, toutes token-gated** : `accept_invitation`, `accept_parental_consent`, `get_consent_request`, `get_invitation_by_token`, `is_username_available`, `leads_rate_limit_check`.
   - **Revue manuelle faite** : toutes font un **match exact sur token** (zéro énumération), renvoient des **données minimales** au porteur légitime (ex. `get_consent_request` → prénom + nom d'école au parent qui a le lien), et `accept_invitation` exige en plus que l'email auth == email invité. ✅ **Pas de fuite, pas d'énumération.**

### Vues (le piège classique du bypass RLS) — ÉVITÉ
- `active_users_metrics`, `events_top_7d`, `pulse_ecole`, `suspicious_moniteurs_v` → **toutes `security_invoker = true`** → elles s'exécutent avec les droits + la RLS de l'appelant. Un anon n'en tire **rien** (les tables sous-jacentes exigent `auth.uid()`). ✅ La vue « moniteurs suspects » ne fuite pas.

### Données sensibles
| Donnée | Exposition | Verdict |
|---|---|---|
| `leads.telephone` (prospect B2B) | SELECT réservé au **gérant ET email fondateur** | ✅ non exposé |
| `invitations.token` | token-gated (lien d'invitation) | ✅ |
| `profiles.parental_consent_token` | token-gated (consentement parental) | ✅ |
| `webhooks_subscriptions.secret` | lisible par le **gérant propriétaire** seulement | ✅ |
| `subscriptions` (Stripe) | l'utilisateur lit **le sien** (`auth.uid()=user_id`, `to authenticated`) | ✅ |
| Téléphone / adresse / NEPH / bancaire **élève** | **aucune colonne** (leads = prospects, pas élèves) | ✅ charte respectée |

---

## 2. Points d'attention (non bloquants, à décider ensemble)

| # | Sévérité | Constat | Reco |
|---|---|---|---|
| A | 🟡 défense-en-profondeur | ~50 policies ciblent le rôle `public` (donc anon inclus) — **sûres** car le `using` exige `auth.uid()`, mais le best-practice Supabase est `TO authenticated`. | Passer les policies clés en `TO authenticated` (gros volume, faible risque). Optionnel. |
| B | 🟡 fuite mineure | `feature_flags`, `items_catalog` (actifs), `experiments` (actifs) lisibles par **anon** (policy `true`/`active`). Révèle des noms de flags/cosmétiques. | Restreindre ces SELECT à `authenticated`. |
| C | 🟡 sécurité auth | **Leaked-password protection désactivée** (refuse les mots de passe connus des fuites). | L'activer (plan Pro) avant lancement public. |
| D | 🟢 robustesse | `leads_select` **hardcode l'email fondateur** → casse si l'email change. | Remplacer par un rôle/flag plus tard. |
| E | 🟢 produit | `get_hall_of_fame` (PR #194) expose le **prénom** des reçus aux camarades. | Décision produit assumée (opt-out futur possible). |

---

## 3. Performance (perf-only, rien de critique)
- **1 index dupliqué** sur `validations` (`idx_validations_by_date` == `idx_validations_validated_by_date`) → en supprimer 1.
- **8 FK sans index** (`community_questions`×2, `comp_bookmarks`, `eleve_tags`, `examens.created_by`, `quiz_feedback.user_id`, `school_events`, `webhooks_subscriptions`) → ajouter index.
- **~35 index « inutilisés »** → **normal** (BDD jeune, peu de trafic). **NE PAS supprimer** maintenant — ils serviront à l'échelle.
- **Multiple permissive policies** (`community_questions`, `eleve_daily_snapshot`, `exam_blanc_sessions`, `sessions_moniteur`) → micro-optimisation (consolider les policies SELECT en une seule avec `OR`). Optionnel.

➡️ Migration prête (non appliquée) : `20260616020000_prelaunch_hardening.sql` (drop index dupliqué + 8 index FK — **zéro impact accès, 100 % additif**).

---

## 4. Edge functions
- `stripe-webhook` : `verify_jwt=false` + **signature Stripe** ✅ (la sécurité vient de la signature, pas du JWT — correct pour un webhook).
- `stripe-checkout` : `verify_jwt=true` ✅.
- Fonctions cron/internes (dispatch-push, etc.) : protégées par secret cron / service-role. Les `401` dans les logs = appels non autorisés **correctement rejetés**. ✅
- Secrets (Stripe, VAPID) : **backend only**, jamais côté client. ✅

---

## 5. À faire avant le « deploy officiel » (priorisé)
**Doit (5 min) :**
- [ ] Activer **leaked-password protection** (Auth settings, plan Pro).
- [ ] Appliquer `20260616020000_prelaunch_hardening.sql` (drop index dupliqué + index FK).

**Devrait :**
- [ ] Restreindre `feature_flags` / `items_catalog` / `experiments` SELECT à `authenticated` (point B).
- [ ] (Optionnel) Migrer les policies sensibles `public` → `authenticated` (point A).

**Demain (domaine custom) :**
- [ ] Vérifier que la **CSP / headers** de `vercel.json` (déjà solides : HSTS, X-Frame-Options, CSP stricte) couvrent le nouveau domaine, et brancher le domaine sur Vercel.
- [ ] Mettre à jour `APP_URL` / `success_url` Stripe avec le domaine final.

> **Bilan** : un backend **mûr et bien sécurisé** pour un projet à ce stade. La discipline RLS + search_path + security_invoker est respectée partout. Rien ne s'oppose au lancement ; les actions ci-dessus sont du polish de pré-prod.
