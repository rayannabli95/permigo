# CLAUDE.md — Contexte projet pour Claude

> **Ce fichier est lu automatiquement par Claude au démarrage.** Garde-le à jour pour qu'une nouvelle conversation reprenne le travail là où on l'a laissé.

## 📚 Référence permanente — Best Practices Claude Code

**Repo à consulter systématiquement avant toute tâche non triviale :**
👉 https://github.com/shanraisshan/claude-code-best-practice

Hub communautaire #1 GitHub trending qui regroupe :
- **Concepts** : table complète des primitives Claude Code (Subagents, Commands, Skills, Workflows, Hooks, MCP, Plugins, Settings, Memory, CLI flags) avec leur location filesystem
- **Orchestration Workflow** : pattern Command → Agent → Skill
- **Development Workflows** : comparaison Superpowers, Spec Kit, BMAD-METHOD, GSD, OpenSpec, gstack, HumanLayer (tous suivent Research → Plan → Execute → Review → Ship)
- **84 Tips & Tricks** catégorisés (Prompting, Planning, CLAUDE.md, Agents, Commands, Skills, Hooks, Debugging…)
- **Reports** : deep-dives (Agent SDK vs CLI, Agent Memory, Skills in Monorepos, LLM Degradation, etc.)

**Règle :** avant chaque nouvelle feature/page complexe, va piocher la meilleure pratique applicable dans ce repo (workflow, pattern d'agent, structure CLAUDE.md, etc.) et applique-la ici.

## Projet

PermiGo Autopilot v7 — plateforme auto-école (gérant + moniteur + élève). Refonte modulaire de l'ancien `autopilot.html` monolithique (4 Mo).

## Stack

- **Vite** + **vanilla JS modules** (pas de framework)
- **CSS pur** avec variables CSS + animations natives
- **Drizzle ORM** : SQLite (dev) ↔ Postgres (prod via Supabase)
- **Supabase Auth** (conservé)
- **Hono** (backend léger Node.js)
- **@libsql/client** : SQLite pure JS (pas besoin de compilation native)

## Commandes essentielles

```bash
npm install           # première fois
npm run dev           # lance frontend (5173) + backend (3001)
npm run db:generate   # génère les migrations Drizzle
npm run db:migrate    # applique les migrations
npm run db:seed       # charge données de seed
npm run build         # build prod
```

## État actuel (au 11 mai 2026, soir)

### ✅ Fait

- Scaffold complet : `package.json`, `vite.config.js`, `drizzle.config.js`, `.env.example`, `index.html`
- DB layer : `src/db/schema.js` (9 tables) + `src/db/client.js` (switch SQLite/Postgres)
- Auth : `src/auth/auth.js` (login + restore session + signout), `cur-user.js` (CUR_USER global)
- Utils : `src/utils/escape.js` (esc XSS-safe), `src/utils/format-date.js` (fix bug Dim/Lun)
- Composants : `src/components/toast.js`
- Data : `src/data/remc.js` (référentiel REMC officiel 31 sous-compétences sur 4 catégories)
- Styles : `src/styles/{base,components,animations,main}.css`
- Backend Hono : `src/server/index.js` (API REST basique)

### ✅ Pages migrées (5 pages fonctionnelles, branchées Supabase)

| Page | Fichier | Rôle |
|---|---|---|
| Login | `src/pages/auth/login.js` | tous |
| Accueil dashboard | `src/pages/eleve/accueil.js` | élève |
| Parcours REMC (route SVG sinueuse + fiche bottom sheet) | `src/pages/eleve/parcours.js` | élève |
| Mes Élèves (liste + recherche + tabs) | `src/pages/moniteur/mes-eleves.js` | moniteur |
| Fiche Élève (KPIs + leçons + notes privées) | `src/pages/moniteur/fiche-eleve.js` | moniteur |

### ⏳ Pages à coder (prioritaire en haut)

| Page | Effort | Rôle |
|---|---|---|
| **Planning moniteur** (jour/semaine, créneaux 6h-22h, click = créer leçon) | 60 min | moniteur |
| Livret REMC évaluation (moniteur valide les sous-comp) | 45 min | moniteur |
| Réservation (élève réserve un créneau) | 45 min | élève |
| Trophées élève (vue ludique) | 20 min | élève |
| Tableau bord admin (KPIs + offre/demande) | 45 min | admin |
| Calendrier admin (tous les events) | 45 min | admin |
| Gestion équipe admin (ajouter/modifier moniteurs) | 30 min | admin |
| Notifications | 20 min | tous |
| Profil utilisateur | 20 min | tous |
| Page d'inscription publique | 30 min | non-auth |

**Total restant : ~6h de dev.**

## Comptes de test (Supabase prod)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin/Gérant | rayannabli27@gmail.com | Autopilot2025! |
| Moniteur | rayan.nabli@autopilot.fr | Autopilot2025! |
| Élève | latifa.sahli@autopilot.fr | Autopilot2025! |
| Élève 2 | sherine.nabli@autopilot.fr | Autopilot2025! |
| Moniteur 2 | lassaad.sahli@autopilot.fr | Autopilot2025! |
| Moniteur 3 | elyne.semaan@autopilot.fr | Autopilot2025! |

## Pattern obligatoire pour chaque nouvelle page

```js
// src/pages/<role>/<nom>.js
import { sb } from '@/auth/auth.js';
import { getCurUser } from '@/auth/cur-user.js';
import { toast } from '@/components/toast.js';
import { esc } from '@/utils/escape.js';

export async function mount(root, ...args) {
  const me = getCurUser();
  if (!me) return;

  // 1. Skeleton initial
  root.innerHTML = `<div class="skel"></div>`;

  // 2. Fetch Supabase
  const { data, error } = await sb.from('table').select('*');
  if (error) { toast('Erreur DB', 'error'); return; }

  // 3. Render
  root.innerHTML = renderTemplate(me, data);

  // 4. Wire listeners
  root.querySelector('#btn')?.addEventListener('click', handle);
}

function renderTemplate(me, data) {
  return `
    <style>/* CSS scoped */</style>
    <div class="page anim-slide-up">${esc(me.nom)}</div>
  `;
}
```

**Règles non négociables :**
- Toujours utiliser `esc()` sur les data user dans `innerHTML`
- Pattern `mount(root, ...args)` exporté (pas de side effects au import)
- CSS scoped dans la page via `<style>` inline (évite collisions)
- `class="anim-slide-up"` sur le container racine pour la transition d'entrée
- Branche dans `src/main.js` (sinon la page n'est jamais chargée)

## Routing actuel

`src/main.js` route selon `CUR_USER.role` :

```js
if (cur.role === 'eleve')    → import('./pages/eleve/accueil.js')
if (cur.role === 'moniteur') → import('./pages/moniteur/mes-eleves.js')
if (cur.role === 'admin')    → (placeholder)
```

La navigation inter-pages se fait par `mount()` direct depuis une page vers l'autre (pas de hash router pour l'instant).

## Bugs connus / dette

- Pas de hash router → reload casse la nav (toujours redirige selon role)
- Backend Hono démarré mais pas utilisé par le frontend (toutes les requêtes vont direct à Supabase)
- Pas de dark mode encore (le scaffold le prévoit mais pas implémenté)
- Pas de tests
- L'ancien projet v6 reste déployé sur https://rayannabli95.github.io/Autopilot/ (à supprimer quand v7 prend le relais)

## Pour une prochaine session Claude

**Si tu reprends ce projet :**

1. Lis ce fichier en premier
2. **Lis `ROADMAP.md`** — c'est la source de vérité de l'avancement (slices verticales, ce qui est shippé, ce qui est en cours)
3. Lis aussi `ARCHITECTURE.md` et `MIGRATION_GUIDE.md` si tu touches au schéma DB
4. Regarde l'état dans la liste "Pages à coder" ci-dessus (sera bientôt remplacée par ROADMAP.md)
4. Code la prochaine page en suivant le pattern obligatoire ci-dessus
5. Branche dans `src/main.js`
6. Demande à l'utilisateur de tester sur `http://localhost:5173` après `npm run dev`
7. Met à jour la section "Pages migrées" / "Pages à coder" de ce fichier

**Commande typique de démarrage de session :**

> "Reprends le projet PermiGo v7 au dossier `~/Desktop/permigo-v7/`. Lis `CLAUDE.md` puis code la prochaine page de la liste à coder."
