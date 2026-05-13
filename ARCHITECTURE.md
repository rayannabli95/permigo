# PermiGo v7 — Architecture

## Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| **Build** | Vite | Le plus rapide (HMR <100ms), config quasi nulle, prod build optimisé |
| **Frontend** | Vanilla JS modules (ES modules) | Pas de framework = zéro coût d'apprentissage, fichiers lisibles à 6 mois |
| **CSS** | Pur CSS + custom properties | Pas de Tailwind (verrouille), variables CSS héritées de l'app actuelle |
| **DB dev** | SQLite via `better-sqlite3` (Node) | Fichier unique `dev.db`, zéro setup, parfait pour debug |
| **DB prod** | Postgres via Supabase | Déjà en place, RLS gratuite |
| **ORM** | Drizzle | Même schéma SQLite + Postgres, requêtes typées, migrations |
| **Backend** | Hono (mini-Express) | API REST légère, démarre en <50ms |
| **Auth** | Supabase Auth | Conservé tel quel — gère email, sessions, JWT |

---

## Structure des dossiers

```
permigo-v7/
├── package.json                  ← deps + scripts (npm run dev / build / start)
├── vite.config.js                ← config build frontend
├── drizzle.config.js             ← config migrations
├── .env                          ← clés Supabase, NODE_ENV, DATABASE_URL
├── .env.example                  ← template à committer (sans secrets)
├── ARCHITECTURE.md               ← ce fichier
├── README.md                     ← démarrage rapide
│
├── public/                       ← assets statiques (logo, favicon)
│   ├── logo.png
│   └── favicon.ico
│
├── index.html                    ← entry HTML (1 seule page)
│
├── src/
│   ├── main.js                   ← entry JS — boot app, mount router
│   │
│   ├── config/
│   │   └── env.js                ← lecture des env vars
│   │
│   ├── db/                       ← couche données (swap SQLite ↔ Postgres)
│   │   ├── client.js             ← façade — exporte un objet `db` utilisable partout
│   │   ├── schema.js             ← Drizzle schema (commun aux 2 dialectes)
│   │   ├── sqlite.js             ← impl SQLite (dev)
│   │   └── postgres.js           ← impl Postgres (prod, via Supabase)
│   │
│   ├── auth/
│   │   ├── auth.js               ← login, logout, getSession
│   │   ├── auth-listener.js      ← onAuthStateChange handler
│   │   └── cur-user.js           ← CUR_USER global state
│   │
│   ├── styles/                   ← découpage CSS (un fichier = un concern)
│   │   ├── base.css              ← reset, variables racine, body
│   │   ├── typography.css        ← fonts + classes h1/h2/...
│   │   ├── components.css        ← .btn, .card, .badge, .input, .toggle
│   │   ├── layout.css            ← .page, .sidebar, .topbar, grid helpers
│   │   ├── animations.css        ← transitions, ripple, fade, slide
│   │   ├── dark.css              ← override .dark mode
│   │   └── pages/                ← styles propres à chaque page
│   │       ├── planning.css
│   │       ├── livret.css
│   │       └── ...
│   │
│   ├── components/               ← composants UI réutilisables
│   │   ├── toast.js              ← notifications éphémères
│   │   ├── modal.js              ← modales centralisées
│   │   ├── ripple.js             ← effet Material sur clic
│   │   ├── navbar.js             ← sidebar + topbar
│   │   ├── bottom-nav.js         ← navigation mobile
│   │   ├── badge.js
│   │   └── progress-bar.js
│   │
│   ├── pages/                    ← une page = un module
│   │   ├── router.js             ← navTo(pageId, title)
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   ├── signup.js
│   │   │   └── reset-password.js
│   │   ├── moniteur/
│   │   │   ├── planning.js       ← vue jour/semaine
│   │   │   ├── mes-eleves.js
│   │   │   ├── fiche-eleve.js
│   │   │   ├── livret.js         ← REMC évaluation
│   │   │   └── notifications.js
│   │   ├── eleve/
│   │   │   ├── accueil.js
│   │   │   ├── reservation.js
│   │   │   ├── parcours.js       ← REMC vue élève
│   │   │   ├── trophees.js
│   │   │   └── profil.js
│   │   └── admin/
│   │       ├── tableau-bord.js
│   │       ├── eleves.js
│   │       ├── moniteurs.js
│   │       ├── calendrier.js
│   │       └── assiduite.js
│   │
│   ├── data/                     ← constantes métier (pas de DB)
│   │   ├── remc.js               ← les 31 compétences officielles
│   │   ├── lieux.js              ← lieux de RDV par défaut
│   │   ├── motifs-annulation.js
│   │   └── badges.js
│   │
│   ├── utils/
│   │   ├── escape.js             ← esc() — XSS-safe HTML
│   │   ├── format-date.js
│   │   ├── format-hours.js
│   │   ├── debounce.js
│   │   ├── audit.js              ← logAction()
│   │   └── analytics.js          ← (futur)
│   │
│   └── server/                   ← backend Node minimal (dev SQLite)
│       ├── index.js              ← Hono app
│       ├── routes/
│       │   ├── events.js
│       │   ├── profiles.js
│       │   ├── remc.js
│       │   └── notifications.js
│       └── middleware/
│           ├── auth.js           ← vérif JWT Supabase
│           └── cors.js
│
└── supabase/
    ├── config.toml               ← config Supabase local (CLI)
    ├── seed.sql                  ← données de seed pour dev
    └── migrations/               ← migrations versionnées (drizzle-kit)
        ├── 0001_initial.sql
        ├── 0002_remc.sql
        └── ...
```

---

## Comment ça marche : SQLite ↔ Postgres

`src/db/client.js` :

```js
import { env } from '../config/env.js';
import { sqliteDb } from './sqlite.js';
import { postgresDb } from './postgres.js';

export const db = env.NODE_ENV === 'production' ? postgresDb : sqliteDb;
```

Toutes les pages importent `import { db } from '@/db/client.js'`. Pour switcher de DB en prod, on touche **uniquement** `client.js`. Le reste du code est identique grâce à Drizzle (même API SQL).

---

## Installation

### Prérequis
- Node.js ≥ 20 ([installer via brew](https://nodejs.org/) : `brew install node@20`)
- Git
- Compte Supabase (déjà en place)

### Setup

```bash
# 1. Cloner / aller dans le dossier
cd ~/Desktop/permigo-v7

# 2. Installer les dépendances
npm install

# 3. Copier .env.example → .env et remplir
cp .env.example .env
# Édite .env avec tes vraies clés Supabase

# 4. Initialiser la base SQLite locale
npm run db:migrate

# 5. (Optionnel) Charger des données de seed
npm run db:seed

# 6. Lancer le dev server
npm run dev
# → ouvre http://localhost:5173
```

### Scripts disponibles

| Commande | Effet |
|---|---|
| `npm run dev` | Frontend Vite + backend Hono en parallèle (port 5173 + 3001) |
| `npm run build` | Build prod dans `dist/` (statique pour GitHub Pages ou Vercel) |
| `npm run preview` | Sert le build pour test local |
| `npm run db:migrate` | Applique les migrations Drizzle sur la DB locale |
| `npm run db:seed` | Charge `supabase/seed.sql` |
| `npm run db:studio` | Ouvre Drizzle Studio (interface web pour explorer la DB) |
| `npm run lint` | Vérifie le style code |
| `npm run typecheck` | (Si tu actives TS) vérifie les types |

---

## Migration depuis l'ancien `autopilot.html`

Le HTML monolithique de 4 Mo se découpe ainsi :

| Ancien (autopilot.html, lignes) | Nouveau emplacement |
|---|---|
| `<style>` interne (l. 22-1000) | `src/styles/*.css` (1 fichier par concern) |
| `const REMC = [...]` (l. 2449) | `src/data/remc.js` |
| `const ELEVES_DEFAULT = [...]` | **Supprimé** (BUG-01 — données 100% DB) |
| `signInWithPassword()` | `src/auth/auth.js` |
| `renderToday()`, `buildCalendar()` | `src/pages/moniteur/planning.js` |
| `buildElvFiche()` | `src/pages/moniteur/fiche-eleve.js` |
| `<div id="page-livret">` | `src/pages/moniteur/livret.js` |
| `<div id="page-espace-eleve">` | `src/pages/eleve/accueil.js` |
| etc. | … |

Voir `MIGRATION_GUIDE.md` pour le détail bloc par bloc.

---

## Animations & micro-interactions

Dans `src/styles/animations.css` :

- **Page transitions** : `fade-in` (150ms) + `slide-up` (200ms, easing premium `cubic-bezier(.4,0,.2,1)`)
- **Ripple** : effet Material sur clic boutons (component dédié `src/components/ripple.js`)
- **Skeleton loaders** : pendant le fetch DB (`.skel`, `.skel-text`, `.skel-card`)
- **Progress bars** : `transition: width .5s ease` + counter `animation-fill-mode: forwards`
- **Toast slide-in** : depuis bas, scale 0.95 → 1
- **REMC validation** : checkmark draw SVG (300ms) + haptic feedback
- **Number counters** : `requestAnimationFrame` rolling (cf. anim XP)
- **Dark mode** : `transition: background .35s, color .35s` sur `body`

Toutes ces animations sont en CSS pur (pas de lib type Framer Motion). Performances mobile garanties.

---

## Sécurité

- **CSP stricte** (déjà en place dans `index.html`)
- **`esc()` partout** où on insère de la data user dans innerHTML (cf. `src/utils/escape.js`)
- **Supabase RLS** active sur toutes les tables (déjà fait en v6)
- **Pas de localStorage pour des secrets** — utiliser sessionStorage pour le JWT (déjà géré par supabase-js)
- **Service role JWT JAMAIS exposé côté client** (toutes les ops admin passent par le backend Hono)
