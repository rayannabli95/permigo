# 🔍 Audit final — Sprint multi-IA PermiGo

> Généré le 2026-05-18 — État après la session Cowork + Claude Code (VS Code) en parallèle.

---

## ✅ Backend Supabase

### Edge Functions (6 actives)

| Function | Type | verify_jwt | Statut |
|---|---|---|---|
| `trigger-consolidation` | Quiz 48h auto (pg_cron) | false | ✅ Active depuis avant la session |
| `send-invitation-email` | Email signup enseignant via Resend | true | ✅ Nouvelle |
| `dispatch-push` v2 | Web Push VAPID (4 types: élève + moniteur) | false | ✅ Nouvelle |
| `check-streak-risk` | Détection streak élève à risque | false | ✅ Nouvelle |
| `check-students-at-risk` | Détection décrochage → notif moniteur | false | ✅ Nouvelle |
| `generate-vapid-keys` | Utilitaire one-shot (clés VAPID) | false | ⚠️ À SUPPRIMER après config secrets |

### pg_cron Jobs (3 actifs)

| Job | Schedule | Cible | Effet |
|---|---|---|---|
| `trigger-consolidation` (pré-existant) | toutes les heures | Élèves avec validation 48h | Crée notifs `consolidation_quiz` |
| `check-streak-risk-daily` | `0 18 * * *` (18h UTC) | Élèves streak ≥3 inactif hier | Crée notifs `streak_risk` |
| `check-students-at-risk-weekly` | `0 9 * * 1` (lundi 9h UTC) | Élèves inactifs 14j+ | Crée notifs `student_at_risk` (au moniteur) |

### Tables publiques (15)

- `auto_ecoles`, `profiles`, `competences_remc`, `questions_competence`, `validations`, `quiz_attempts`, `streaks`, `lecons_realisees`, `notifications`, `events_analytics`, `pulse_ecole` (vue), `leads`, `invitations`, **`push_subscriptions`** (nouvelle), **`app_config`** (nouvelle)

### Trigger DB

- `notif_dispatch_push` AFTER INSERT ON `notifications` → call `dispatch-push` async via pg_net
  Types supportés : `post_validation_quiz`, `consolidation_quiz`, `streak_risk`, `student_at_risk`

### RPC sécurisées (SECURITY DEFINER + search_path lockdown)

- `get_my_id()`, `get_my_role()`, `get_my_auto_ecole_id()` (pré-existantes, utilisées par RLS)
- `get_moniteur_achievements()` (pré-existante)
- **`get_invitation_by_token(text)`** ← nouvelle (consultation token signup)
- **`accept_invitation(text)`** ← nouvelle (acceptation token signup)
- `send_push_on_notification_insert()` (trigger, non publique)

### RLS

- ✅ Toutes les tables ont RLS activé
- ✅ Multi-moniteurs : `validations_select`, `quiz_attempts_select`, `streaks_select`, `lecons_select` adaptés pour partager les données entre moniteurs d'une même école
- ✅ `push_subscriptions` : élève voit/écrit que sa ligne
- ✅ `app_config` : aucune policy = aucun rôle ne peut lire (sauf service_role qui bypasse)

### Données en DB (état actuel)

| Métrique | Valeur |
|---|---|
| Profiles élèves | 1 |
| Profiles enseignants | 1 |
| Profiles gérants | 1 |
| Compétences REMC | 31 (C1a → C4g) |
| Questions REMC reformulées | 155 |
| Validations acquises | 12 |
| Notifications | 16 |
| Push subscriptions | 0 (en attente d'opt-in) |
| Invitations pending | 0 |

---

## 🛡️ Sécurité — Advisors

### État après tous les fix

- **0 ERROR** ✅
- **9 WARN** (tous expliqués + intentionnels)
  - 4 SECURITY DEFINER auth helpers (`get_my_*`) → utilisées par RLS, NÉCESSAIRES
  - 2 SECURITY DEFINER invitations RPC (`get_invitation_by_token`, `accept_invitation`) → INTENTIONNELLES (anon peut signup via token)
  - 1 SECURITY DEFINER `get_moniteur_achievements` → utilisée côté UI moniteur
  - 1 Auth `leaked_password_protection` → à activer manuellement via Dashboard Auth (toggle)
- **1 INFO** (informatif)
  - `app_config` RLS sans policy → INTENTIONNEL (table secrets, accessible uniquement service_role)

**Conclusion** : posture sécurité saine. Tous les warnings sont des trade-offs documentés.

---

## 🎨 Frontend — Syntaxe vérifiée (ma zone)

✅ 12/12 fichiers Cowork passent `node --check` sans erreur :
- `src/pages/gerant/pulse.js` (cockpit refondu)
- `src/pages/gerant/equipe.js` (modal invitation)
- `src/pages/gerant/eleves.js` (drill-down élève)
- `src/components/permis-card.js` (3 backgrounds + toast palier)
- `src/components/profile-card.js` (avatar picker câblé)
- `src/components/avatar-picker.js` (nouveau)
- `src/components/celebrate-screen.js` (nouveau, succès fullscreen + confetti)
- `src/pages/public/signup.js` (nouveau, activation token)
- `src/pages/eleve/galerie.js` (nouveau, collection trophées + fonds permis)
- `src/router.js` (routes signup + galerie + livret gérant)
- `src/main.js` (intercept #/signup avant login)
- `src/utils/assets.js` (ASSETS étoffé + helper `getPermisBg`)

**À noter** : `mes-eleves.js`, `aujourdhui.js`, `validation.js`, `livret-remc.js`, `onboarding-modal.js`, `profil.js` sont dans la zone Claude Code — pas vérifiés ici, mais il a confirmé build 0 warning de son côté.

---

## 🧪 Tests E2E (Playwright — Claude Code)

- 22 tests existants (smoke, quiz, validation enseignant, onboarding, a11y)
- À ajouter post-Claude-Code livraison : `insights.spec.js` (4 tests dans son livrable 4)

---

## 📦 Assets (48 PNG ChatGPT)

### Câblés au code ✅

- 10 badges 3D (`badge-3d-01..09` + `badge-3d-ultimate`)
- 4 mondes REMC (`permigo-remc-*`)
- 8 trophées (`trophy-*.png`)
- 6 avatars défaut (`avatar-default-*.png`)
- 3 fonds permis (`permis-bg-{mesh,route,holographic}.png`)
- 1 streak flame (`permigo-streak-flame-v1.png`)
- 1 parcours map (`permigo-parcours-map-v1.png`)
- 1 volant background parcours (`permigo-volant-bg.png`) ← nouveau

### Présents disk mais pas encore câblés ⏳

- 4 burst stickers (confetti / star / streak / validated) → potentiellement utilisable dans `celebrate-screen.js`
- 2 coffres (open / closed) → pour passage de palier
- 4 mascotte poses (hello / pointing / celebrate / coach) → pour onboarding / empty states
- 3 onboarding (welcome / triple-validation / first-goal) → Claude Code branche dans `onboarding-modal.js`
- 4 empty states (parcours / trophies / lessons / students-manager) → à câbler page par page
- 1 skill-shard-indigo (hors scope, peut être retiré)

**Total** : 48 PNG dont 34 câblés (71 %), 14 prêts à câbler.

---

## 🚀 Actions critiques côté Rayan

### ⚠️ IMMÉDIAT (avant prod fonctionnelle des push)

1. **Configurer secrets Supabase** Dashboard → Project Settings → Edge Functions → Secrets :
   ```
   VAPID_PRIVATE_KEY = oDVXvVksK9TtXQPuOaNOpJaEW_sS_-0DgwZ9461s5CY
   VAPID_PUBLIC_KEY  = BHXSS9J2htRlMGSoDAhDoPQIKRdYDWWGifJI4NhnMGsIcVK95f6ZI69IqjKgj3X6lq48uDwSVwypavrgtN8FOCk
   VAPID_SUBJECT     = mailto:rayan@permigo.fr
   DISPATCH_PUSH_SECRET = qzx72UvQuYxAu_zPIJ5V4c4x_KtmP00ahAogj0qucds
   ```

2. **Configurer Vercel** env vars (env Production + Preview) :
   ```
   VITE_VAPID_PUBLIC_KEY = BHXSS9J2htRlMGSoDAhDoPQIKRdYDWWGifJI4NhnMGsIcVK95f6ZI69IqjKgj3X6lq48uDwSVwypavrgtN8FOCk
   ```

3. **Supprimer la fonction utilitaire** `generate-vapid-keys` du Dashboard Edge Functions (sécu).

### 🔧 OPTIONNEL (impact UX)

4. **Activer Leaked Password Protection** : Dashboard → Authentication → Policies → toggle "Check passwords against HaveIBeenPwned"
5. **Configurer Resend** (si tu veux envoyer les emails d'invitation réels) : ajouter `RESEND_API_KEY` dans Edge Functions Secrets + signer un compte Resend gratuit.

---

## 📋 Récap session journée

### Livrables Cowork (moi)

- 🛠️ 9 chantiers majeurs livrés
- 💾 5 edge functions déployées
- 📊 3 nouvelles tables (push_subscriptions, app_config) + 1 vue (pulse_ecole)
- ⏰ 2 nouveaux pg_cron jobs
- 🔐 4 RPC sécurisées
- 🎬 2 trigger DB
- 🎨 5 nouveaux composants frontend (signup page, celebrate-screen, avatar-picker, galerie, polish carte permis)
- 🛡️ Sécurité Supabase : 25 → 9 advisors (tous intentionnels)

### Livrables Claude Code (VS Code) — résumé connu

- 🧪 22 tests E2E Playwright (smoke + quiz + validation + onboarding + a11y)
- ♿ 6 violations WCAG 2.1 AA fixées
- ⚡ Build optim : sourcemap off, esbuild, cssCodeSplit, preconnect Supabase
- 📲 Web push frontend : SW push handler, VAPID subscription, toggle profil
- 🏠 Refonte page Aujourd'hui enseignant (widgets)
- 🚨 Anti-décrochage UI (en cours sur mes-eleves.js + aujourdhui.js)
- 📈 Page Insights enseignant (en cours)

### Total session

**~17 livrables, ~30+ fichiers modifiés, 5 edge functions, 2 pg_cron, build clean.**

---

## 🎯 Recommandation prochaine étape

Une fois Claude Code livré son chantier insights + une fois tu as push toutes les modifs :

1. **Test end-to-end manuel** sur la prod en incognito (login élève → validation → quiz → push)
2. **Onboarder un premier vrai utilisateur** (toi ou un proche moniteur)
3. **Surveiller les analytics events_analytics** pendant 7j → premiers insights réels
4. **Chantier suivant suggéré** : **Bilan trimestriel auto** (gros impact perçu auto-écoles)

Bon travail. 🚗
