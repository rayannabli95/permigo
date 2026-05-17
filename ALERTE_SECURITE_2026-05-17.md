# 🛡️ Rapport sécurité PermiGo — 2026-05-17

Exécution automatique de la vérification hebdomadaire.

---

## 🚨 Critique

Aucun credential live leaké, aucun `.env` racine tracké, aucun `ghp_` / `sk_live_` détecté.

**Note projet Supabase :** le prompt cible `ivtuheoyfgljujliscwf` mais ce projet n'est pas accessible via MCP. Vérifications faites sur le seul projet listé : `arrfmdagdqtrtfbhxlty` (rayannabli27@gmail.com's Project, eu-west-1, ACTIVE_HEALTHY). À confirmer si l'ID du prompt est encore valide.

---

## ⚠️ Warnings

### 1. JWT (anon key) en clair dans le code source — `permigo-game/`

Deux occurrences trouvées hors `.env` :

- `permigo-game/vite.config.js:18` — la clé `VITE_SUPABASE_ANON_KEY` est injectée en dur via `define` au lieu d'être lue depuis `import.meta.env` / `loadEnv`.
- `permigo-game/.env.production` — **trackée par git** (apparaît dans `git ls-files`). Contient `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

Il s'agit techniquement de l'**anon key publique** (rôle `anon`, exp 2036-04-08), donc pas un secret de service. Mais (a) c'est un anti-pattern qui empêche de tourner la clé sans recompiler / recommit, (b) `.env.production` ne doit pas être tracké quel que soit son contenu — la convention `.gitignore` du repo principal exclut `.env` mais pas les fichiers du sous-projet `permigo-game/`.

Autres JWT trouvés : tous dans `_archive/` (snapshots de l'ancienne v6). Pas bloquant mais ces dumps gagneraient à être purgés du repo.

### 2. Couverture RLS

Sur les 9 tables listées dans le prompt, seules 2 existent dans le schéma `public` du projet courant :

| Table prompt | Présente ? | RLS actif | Nb policies |
|---|---|---|---|
| `profiles` | oui | ✅ | 3 |
| `notifications` | oui | ✅ | 3 |
| `events` | non (existe sous `events_analytics`, 3 policies) | — | — |
| `remc_entries` | non (existe sous `competences_remc`, 1 policy) | — | — |
| `notes_priv` | **non** | — | — |
| `lieux` | **non** | — | — |
| `audit_log` | **non** | — | — |
| `notations` | **non** | — | — |
| `inscriptions` | **non** (existe sous `invitations`, 2 policies) | — | — |

⚠️ Soit la liste du prompt date de l'ancien schéma v6, soit certaines tables prévues dans la roadmap n'ont jamais été créées. À réconcilier — l'alerte initiale "table sans policy" est sans objet ici puisque les tables n'existent pas, mais il faut décider : renommer la liste de surveillance pour le schéma v7, ou créer les tables manquantes.

Pour info, toutes les tables `public` actuelles ont au moins une policy (de 1 à 3), aucune n'est non protégée.

### 3. Utilisateurs sans email confirmé

Aucun. La requête `auth.users WHERE email_confirmed_at IS NULL` renvoie 0 ligne.

### 4. TODO / FIXME sécurité

Aucun commentaire `TODO sécurité` ou `FIXME sécurité` trouvé dans le code.

---

## 📋 Recommandations prioritaires

1. **Sortir l'anon key de `vite.config.js`** — utiliser `loadEnv(mode, process.cwd())` et lire `VITE_SUPABASE_ANON_KEY` depuis l'environnement comme dans le projet racine.
2. **Untrack `permigo-game/.env.production`** :
   ```bash
   git rm --cached permigo-game/.env.production
   echo "permigo-game/.env.production" >> .gitignore
   echo "permigo-game/.env" >> .gitignore
   git commit -m "chore: untrack permigo-game env files"
   ```
   Même si l'anon key n'est pas un secret, on évite de versionner des fichiers `.env*` autres que `.env.example`.
3. **Mettre à jour la liste de tables surveillées** dans ce job hebdo pour refléter le schéma v7 réel (`auto_ecoles`, `competences_remc`, `events_analytics`, `invitations`, `leads`, `lecons_realisees`, `notifications`, `profiles`, `questions_competence`, `quiz_attempts`, `streaks`, `validations`) — ou créer les tables prévues manquantes si elles sont sur la roadmap.
4. **Vérifier l'ID du projet Supabase** (`ivtuheoyfgljujliscwf` dans le prompt vs `arrfmdagdqtrtfbhxlty` accessible). Soit corriger le prompt, soit reconnecter le bon projet au MCP.
5. **Nettoyage `_archive/`** — déplacer hors du repo ou ajouter au `.gitignore` ; les snapshots v6 contiennent plusieurs JWT.
