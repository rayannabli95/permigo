# ARCHITECTURE.md — Architecture technique

## 🏗 Stack technique

### Frontend
- **Vite** 5.x (build tool ultra rapide)
- **JavaScript vanilla** (modules ES6+, pas de framework)
- **CSS pur** scopé inline (variables CSS + animations natives)
- **HTML5** sémantique

### Backend / Data
- **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Pas de serveur Node custom** (Supabase suffit pour tout)

### Hosting
- **Vercel** (déploiement GitHub auto, edge network mondial)
- **GitHub** (versioning + CI/CD natif via Vercel)

### Services tiers
- **Resend** (emails transactionnels — invitations, notifs)
- **PostHog** ou **Plausible** (analytics avancées en plus de notre table custom)

## 📁 Structure du projet

```
permigo-game/
├── CLAUDE.md, PRODUCT.md, etc.   (docs)
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── .gitignore
├── README.md
│
├── public/                        (assets statiques)
│   ├── og-image.png
│   ├── favicon.ico
│   ├── icon-192.png, icon-512.png
│   ├── manifest.webmanifest
│   ├── sw.js                      (service worker PWA)
│   ├── sounds/
│   │   ├── ding-success.mp3
│   │   ├── streak-up.mp3
│   │   └── reveal-trophy.mp3
│   ├── animations/
│   │   └── hero.mp4
│   └── images/
│       └── worlds/
│           ├── campagne.svg
│           ├── ville.svg
│           ├── montagne.svg
│           └── sommet.svg
│
├── src/
│   ├── main.js                    (entry point Vite)
│   ├── router.js                  (routing simple par hash)
│   ├── config/
│   │   └── env.js                 (parsing VITE_* env vars)
│   │
│   ├── auth/
│   │   ├── auth.js                (Supabase auth wrapper)
│   │   ├── cur-user.js            (global CUR_USER + onUserChange)
│   │   └── auth-listener.js       (sync session cross-tab)
│   │
│   ├── db/
│   │   ├── client.js              (init Supabase client)
│   │   └── schema.js              (types TS optionnel + RLS docs)
│   │
│   ├── modules/                   (logique métier)
│   │   ├── pedagogie/
│   │   │   ├── quiz-engine.js     (logique générique quiz)
│   │   │   ├── post-validation.js (modal 3 questions immédiates)
│   │   │   ├── consolidation.js   (modal 2 questions 48h)
│   │   │   ├── score-cognitif.js  (calcul + stockage)
│   │   │   └── seed-questions.js  (générateur de seed data)
│   │   ├── progression/
│   │   │   ├── parcours-remc.js   (map visuelle 4 mondes)
│   │   │   ├── streak.js          (logique streak quotidien)
│   │   │   ├── xp-system.js       (calcul + display XP)
│   │   │   └── trophees.js        (gestion trophées débloqués)
│   │   ├── enseignant/
│   │   │   └── valid-competence.js (toggle valider + notif)
│   │   └── gerant/
│   │       └── pulse-ecole.js     (calcul KPIs école)
│   │
│   ├── components/                (UI réutilisables)
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── mesh-bg.js
│   │   ├── reward-reveal.js
│   │   ├── alert-card.js
│   │   ├── avatar-modal.js
│   │   ├── stacked-cards.js
│   │   ├── notif-bell.js
│   │   ├── nav-bottom.js
│   │   ├── lamp-section.js
│   │   ├── confetti.js
│   │   └── pricing-cards.js
│   │
│   ├── pages/                     (écrans = routes)
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   └── signup.js
│   │   ├── public/
│   │   │   ├── landing.js         (page d'accueil non-auth)
│   │   │   └── inscription-ecole.js
│   │   ├── eleve/
│   │   │   ├── accueil.js
│   │   │   ├── parcours.js
│   │   │   ├── trophees.js
│   │   │   └── profil.js
│   │   ├── enseignant/
│   │   │   ├── mes-eleves.js
│   │   │   └── fiche-eleve.js
│   │   ├── gerant/
│   │   │   ├── pulse-ecole.js
│   │   │   ├── equipe.js
│   │   │   └── marketing.js
│   │   └── common/
│   │       └── notifications.js
│   │
│   ├── services/
│   │   ├── analytics.js           (trackEvent wrapper)
│   │   ├── notifications.js       (push web + email Resend)
│   │   ├── audio.js               (play sons UI)
│   │   ├── cron.js                (clientside cron pour consolidation)
│   │   └── share.js               (web share API)
│   │
│   ├── styles/
│   │   ├── base.css               (reset, variables, typo)
│   │   ├── components.css         (composants globaux)
│   │   ├── animations.css         (keyframes réutilisables)
│   │   └── main.css               (importe tout)
│   │
│   ├── data/
│   │   ├── remc-competences.js    (31 sous-compétences)
│   │   ├── worlds.js              (4 mondes du parcours)
│   │   └── seed-questions.json    (questions starter)
│   │
│   └── utils/
│       ├── escape.js              (esc() XSS-safe)
│       ├── format-date.js         (dates FR + jours)
│       ├── count-up.js            (anime chiffres)
│       └── game-state.js          (helpers gemmes/streak)
│
└── supabase/
    ├── migrations/
    │   ├── 0000_initial_schema.sql
    │   ├── 0001_seed_competences_remc.sql
    │   ├── 0002_seed_questions.sql
    │   └── 0003_analytics_events.sql
    ├── functions/
    │   ├── notify-validation/     (Edge function quand prof valide)
    │   ├── send-consolidation/    (cron 48h)
    │   └── notify-new-lead/       (alerte gérant via email)
    └── seed.sql                   (data démo pour onboarding)
```

## 🗃 Schéma DB Supabase

### Tables principales

```sql
-- ─── PROFILS UTILISATEURS ────────────────────────
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL CHECK (role IN ('eleve', 'enseignant', 'gerant')),
  prenom text NOT NULL,
  nom_initial text,             -- 'S.' (pas le nom complet)
  avatar_preset text DEFAULT 'starter-1',
  avatar_url text,
  auto_ecole_id uuid REFERENCES auto_ecoles(id),
  enseignant_id uuid REFERENCES profiles(id), -- pour élève (enseignant attitré)
  credit_heures int DEFAULT 0,  -- élève uniquement
  gems int DEFAULT 0,
  xp int DEFAULT 0,
  unlocked_avatars jsonb DEFAULT '[]'::jsonb,
  unlocked_themes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz
);

-- ─── AUTO-ÉCOLES ─────────────────────────────────
CREATE TABLE auto_ecoles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  slug text UNIQUE,             -- pour URL publique permigo.app/<slug>
  ville text,
  abonnement_status text DEFAULT 'beta', -- 'beta'/'active'/'cancelled'
  created_at timestamptz DEFAULT now()
);

-- ─── COMPÉTENCES REMC (référentiel officiel) ────
CREATE TABLE competences_remc (
  id text PRIMARY KEY,          -- 'C01.1', 'C02.3', etc.
  code text NOT NULL,
  nom text NOT NULL,
  description text,
  monde int CHECK (monde BETWEEN 1 AND 4), -- 1=Campagne, 2=Ville, 3=Montagne, 4=Sommet
  ordre int,
  prerequis text[]              -- array de comp.id préalables
);

-- ─── QUESTIONS PAR COMPÉTENCE ────────────────────
CREATE TABLE questions_competence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competence_id text REFERENCES competences_remc(id),
  question text NOT NULL,
  options jsonb NOT NULL,       -- ["option A", "option B", "option C", "option D"]
  correct_index int NOT NULL,
  explanation text,
  difficulty int DEFAULT 2,     -- 1-3 (facile à difficile)
  type text DEFAULT 'post_validation' -- 'post_validation'/'consolidation'/'exam'
);

-- ─── VALIDATIONS COMPÉTENCES ─────────────────────
CREATE TABLE validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid REFERENCES profiles(id),
  competence_id text REFERENCES competences_remc(id),
  validated_by uuid REFERENCES profiles(id), -- enseignant
  validated_at timestamptz DEFAULT now(),
  statut text DEFAULT 'acquis', -- 'acquis'/'en_cours'/'a_retravailler'
  score_cognitif int,           -- 0-100 (résultat quiz post-validation)
  score_consolidation int,      -- 0-100 (résultat quiz 48h)
  consolidation_due_at timestamptz, -- quand envoyer la notif
  consolidation_done_at timestamptz,
  note_enseignant text,
  UNIQUE(eleve_id, competence_id)
);

-- ─── TENTATIVES QUIZ (log complet) ───────────────
CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  competence_id text REFERENCES competences_remc(id),
  type text NOT NULL, -- 'post_validation'/'consolidation'/'exam_blanc'/'review'
  questions_ids uuid[],
  answers_indices int[],
  score int,                    -- 0-100
  duration_seconds int,
  completed_at timestamptz DEFAULT now()
);

-- ─── STREAK QUOTIDIEN ────────────────────────────
CREATE TABLE streaks (
  user_id uuid PRIMARY KEY REFERENCES profiles(id),
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_activity_date date,
  frozen_until date,            -- si l'élève a "gelé" son streak avec gemmes
  updated_at timestamptz DEFAULT now()
);

-- ─── LEÇONS RÉALISÉES (log simple) ───────────────
CREATE TABLE lecons_realisees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid REFERENCES profiles(id),
  enseignant_id uuid REFERENCES profiles(id),
  date_lecon date NOT NULL,
  duree_heures decimal(3,1),
  competences_validees text[],  -- ids des compétences validées dans cette leçon
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ─── NOTIFICATIONS ───────────────────────────────
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ─── ANALYTICS EVENTS ────────────────────────────
CREATE TABLE events_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  event_name text NOT NULL,
  properties jsonb,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- ─── INVITATIONS (gérant invite élèves/enseignants) ──
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_ecole_id uuid REFERENCES auto_ecoles(id),
  email text,
  role text CHECK (role IN ('eleve', 'enseignant')),
  token text UNIQUE,
  expires_at timestamptz,
  accepted_at timestamptz,
  enseignant_attitré_id uuid REFERENCES profiles(id), -- pour invité élève
  created_at timestamptz DEFAULT now()
);
```

### RLS (Row Level Security) — règles

Toutes les tables ont RLS activé. Voici les règles de base :

**profiles** :
- SELECT : lit son propre profil + profils de son auto-école (si dans la même)
- UPDATE : peut modifier son propre profil uniquement

**competences_remc** :
- SELECT : tout le monde (référentiel public)
- INSERT/UPDATE/DELETE : aucun (data en seed uniquement)

**questions_competence** :
- SELECT : tout authentifié
- Le reste : admin seulement

**validations** :
- SELECT : l'élève voit ses propres validations, l'enseignant voit ses élèves
- INSERT : enseignant ou élève (pour son auto-école)
- UPDATE : enseignant uniquement

**quiz_attempts** :
- SELECT : utilisateur voit ses propres tentatives
- INSERT : authentifié

**streaks** :
- SELECT / UPDATE : utilisateur sur son propre streak uniquement

**lecons_realisees** :
- SELECT : élève + enseignant impliqués + gérant de l'auto-école
- INSERT : enseignant uniquement

**events_analytics** :
- INSERT : tous (anonyme OK)
- SELECT : admin / gérant pour ses propres données

## 🔄 Edge Functions Supabase

### `notify-validation` (HTTP webhook, déclenché par trigger DB)
Quand une validation est créée → envoie push notif + email à l'élève.

### `send-consolidation` (cron, toutes les heures)
Détecte les validations avec `consolidation_due_at < now()` et `consolidation_done_at IS NULL`.
Envoie une notif "Petite vérif rapide ?" à l'élève.

### `notify-new-lead` (déjà existant)
Quand une auto-école s'inscrit via la landing → email à `rayannabli27@gmail.com`.

### `weekly-pulse-report` (cron hebdo, lundi 8h)
Envoie un email récap au gérant avec les KPI de la semaine.

## 🔐 Auth & Sécurité

### Authentication
- Supabase Auth (email magic link OU password)
- Pas de social auth pour V1 (KISS)
- Sessions JWT, refresh automatique
- Logout cross-tab via auth listener

### Sécurité
- HTTPS partout (Vercel le force)
- CSP headers stricts (cf. `index.html`)
- RLS sur 100% des tables
- Pas de `service_role_key` exposé côté client
- `esc()` XSS partout sur user content

### RGPD
- Pas de PII sensible stockée (pas de tel, adresse, NEPH)
- Email = identifiant éphémère
- Export complet utilisateur en 1 click
- Suppression compte = soft delete puis purge 30 jours
- Données hébergées en Europe (Supabase EU)

## 📊 Performance

### Bundle size targets
- JS initial : < 200 KB gzip
- CSS initial : < 50 KB
- LCP image : < 100 KB
- Total page initiale : < 500 KB

### Optimisations Vite
- Code splitting automatique (chaque page = chunk)
- Modulepreload pour assets critiques
- Compression Brotli sur Vercel
- Cache-Control `immutable` sur `/assets/*`

### Service Worker
- Cache des pages déjà visitées (Stale-While-Revalidate)
- Offline basique (page d'erreur si vraiment offline)
- Pas de offline-first complet pour V1

## 🧪 Tests

### V1 : tests manuels uniquement
- Login chaque rôle
- Cycle complet : enseignant valide → élève reçoit notif → quiz → score
- Test consolidation 48h (simulé en changeant date DB)
- Test mobile sur iPhone réel

### V2+ : tests automatisés
- Vitest pour utils (esc, format-date, score calcul)
- Playwright pour parcours critiques
- Lighthouse CI sur PRs

## 🚀 Déploiement

### Workflow Git
- Branche `main` = production
- Pas de staging pour V1 (Vercel preview deployments suffisent)
- Chaque push sur `main` → déploiement auto Vercel

### Variables d'environnement Vercel
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_RESEND_API_KEY=re_... (côté Edge function uniquement)
VITE_POSTHOG_KEY=phc_... (optionnel)
```

### Rollback
- Via Vercel dashboard (1 click)
- Ou redéployer un ancien commit GitHub

## 🛠 Commandes essentielles

```bash
# Setup initial
npm install
cp .env.example .env  # remplir avec les vraies clés

# Dev
npm run dev           # http://localhost:5173

# Build
npm run build         # génère dist/

# Preview build
npm run preview

# Supabase
supabase start        # local DB
supabase db push      # appliquer migrations
supabase db reset     # reset local DB
```
