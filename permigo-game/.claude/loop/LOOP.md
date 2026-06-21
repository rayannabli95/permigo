# 🔁 LOOP.md — Loop Engineering pour PermiGo

> **Charte du système.** Tu ne *promptes* plus l'agent coup par coup : tu *conçois la boucle* qui prompte, vérifie et continue pour toi. Ce dossier `.claude/loop/` est le **Vault** : la mémoire qui vit **hors du chat**, dans le repo, partagée par tous les runs et tous les agents.
>
> **Règle d'or : l'état sur disque bat l'état dans le contexte.** (`status.md` > ta mémoire de session.)

---

## La boucle (à exécuter à chaque run)

```
   ┌──────────────────────────────────────────────────┐
   │  1. GOAL     — quel est l'objectif ? (next-up.md) │
   │  2. DISCOVER — lire le Vault + le code            │
   │  3. ACT      — coder via la skill/agent adaptée   │
   │  4. VERIFY   — un sous-agent CHECKER vérifie       │
   │  5. REMEMBER — écrire status / done-log / next-up │
   └──────────────────────────────────────────────────┘
         purpose + cadence + tools + checks + memory
```

**Ouverture de run (DISCOVER)** : lis `status.md` puis `next-up.md`. C'est ta source de vérité « où on en est / quoi faire », avant le code.
**Fermeture de run (REMEMBER)** : avant de dire « c'est fini », mets à jour `status.md`, ajoute une ligne à `done-log.md`, retire/ajoute dans `next-up.md`. **Aucune exception** — un run qui n'écrit pas le Vault est un run perdu.

---

## Les 6 piliers — et où ils vivent DÉJÀ dans PermiGo

| # | Pilier (slide) | Principe | État dans ce repo |
|---|---|---|---|
| 1 | **Automations = heartbeat** | runs planifiés qui trouvent le travail, trient, démarrent | ⚠️ Partiel : mode **NIGHT RUN** (`.claude/NIGHT_RUN.md`) existe ; pas de cron récurrent. → opt-in (voir bas de page) |
| 2 | **Worktrees = anti-chaos** | agents parallèles = checkouts isolés, pas de collision | ✅ Convention déjà appliquée (night-run : « périmètre de fichiers disjoint »). Pour du vrai parallèle → `git worktree` / agents `isolation: worktree` |
| 3 | **Skills = contexte projet** | écris tes conventions une fois, la boucle les lit chaque run | ✅ `.claude/skills/` (10 skills) + RÈGLE #0 (scan obligatoire) + `CLAUDE.md` |
| 4 | **Connectors = la boucle agit** | MCP/plugins relient au réel | ✅ GitHub · Supabase · Vercel · Playwright (MCP déjà branchés) |
| 5 | **Sub-agents = maker/checker** | celui qui écrit ne se note pas lui-même | ✅ `supabase-rls-reviewer`, `verify-permigo`, `code-simplifier`, devs par rôle (élève/moniteur/admin) |
| 6 | **Repo remembers, agent forgets** | la mémoire vit dans des fichiers durables, pas dans le chat | 🆕 **CE DOSSIER** (`.claude/loop/`). Avant : état éparpillé sur ~30 docs datés qui pourrissent (preuve : le night-run-report du 20/06 cite une migration déjà supprimée) |

**Ce que ce système AJOUTE à PermiGo** = uniquement le pilier 6 (le Vault canonique ci-dessous) + la discipline read-first / write-last. Le reste existait déjà, c'est désormais **nommé et câblé**.

---

## Le Vault (fichiers de ce dossier)

| Fichier | Rôle | Écrit quand |
|---|---|---|
| `status.md` | Photo de l'état système : ce qui est live, ce qui casse, la dette | fin de chaque run qui change l'état |
| `next-up.md` | File priorisée des prochaines actions (le GOAL du prochain run) | dès qu'une priorité bouge |
| `done-log.md` | Journal append-only du travail terminé (audit trail) | à chaque tâche finie |
| `board.md` | Kanban léger (Backlog / En cours / Review / Done) en un coup d'œil | au fil de l'eau |

> Ces fichiers sont **committés** (partagés équipe + tous les runs), pas dans `~/.claude/` (machine-local). C'est la différence entre « mémoire de Claude » et « mémoire du repo ».

---

## VERIFY — ne laisse jamais le maker se noter lui-même (pilier 5)

Avant de clore une tâche à enjeu, lance un **CHECKER** distinct :
- Migration / RLS → agent `supabase-rls-reviewer`
- Flow critique (auth, paiement, onboarding, quiz) → agent `verify-permigo` (Playwright e2e)
- Toujours, en garde-fou local → `npm run lint && npm run build`

---

## Garde-fous (slide 10 — « Build the loop. Stay the engineer. »)

Les boucles augmentent le levier **mais aussi** le coût en tokens, le risque de *slop* et la dette de compréhension. Donc :
- **Une couche à la fois.** Pas d'empilement de features non vérifiées.
- **L'humain garde la main** sur : schéma DB, suppression de feature, prix, positionnement (cf. `CLAUDE.md`).
- **Utilise la boucle pour COMPRENDRE plus vite, pas pour remplacer la compréhension.**

---

## Heartbeat récurrent (pilier 1) — OPT-IN, pas activé

Un cron autonome (triage quotidien, résumé CI, chasse aux bugs) a un coût et tourne sans surveillance.
**Non activé sans ton feu vert.** Si tu le veux : dis-le, je le câble via `/schedule` (ex. triage `next-up.md` chaque matin 9h).
En attendant, le **NIGHT RUN** manuel (`.claude/NIGHT_RUN.md`) reste le heartbeat à la demande.
