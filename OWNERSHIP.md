# OWNERSHIP.md — Anti-collision entre conversations parallèles

> **Lis-moi en premier si tu travailles avec plusieurs conversations Claude en parallèle (élève / moniteur / gérant).**
> Ce fichier dit qui a le droit de modifier quoi, pour éviter qu'une conv casse le code d'une autre.

## Règle d'or

**Une conv ne modifie JAMAIS un fichier hors de son scope sans annoncer le changement dans `FLOWS.md` + bumper la version du contrat.** Si tu dois toucher du partagé, tu coordonnes avant.

## Zones par bot

### 🎓 Bot ÉLÈVE — peut écrire librement

```
src/pages/eleve/**          ← exclusif
src/pages/public/landing.js ← partagé public (coordination nécessaire)
src/pages/public/signup.js  ← partagé public (coordination nécessaire)
.claude/skills/permigo-eleve-ux/**
.claude/agents/permigo-eleve-dev.md
```

### 👨‍🏫 Bot MONITEUR — peut écrire librement

```
src/pages/moniteur/**       ← exclusif
.claude/skills/permigo-moniteur-ux/**
.claude/agents/permigo-moniteur-dev.md
```

### 🏢 Bot GÉRANT (admin) — peut écrire librement

```
src/pages/admin/**          ← exclusif
.claude/skills/permigo-admin-ops/**
.claude/agents/permigo-admin-dev.md
```

## Zones PARTAGÉES — modification = annonce dans FLOWS.md obligatoire

| Fichier / dossier | Pourquoi sensible | Procédure si tu dois modifier |
|---|---|---|
| `src/db/schema.js` | Tables = contrat DB cross-rôles | Ajout colonne ok, suppression/rename = blocage. Annonce dans FLOWS.md + `npm run db:generate` + diff de la migration. |
| `src/router.js` | Routes = navigation cross-rôles | N'ajoute QUE ta route, ne touche pas celles des autres. Garde le bloc par rôle bien séparé. |
| `src/main.js` | Bootstrap unique | Ne touche que si tu ajoutes un side-effect cross-app (rare). Sinon, route + module = suffisant. |
| `src/auth/**` | Auth = cross-rôles | Ne pas modifier sans raison forte. Préfère ajouter un util qui se branche dessus. |
| `src/components/**` | Composants partagés | Ne modifie un composant existant que si le changement est rétrocompatible. Sinon, crée `xxx-v2.js` à côté. |
| `src/utils/**` | Utils partagés | Idem composants — additif uniquement. |
| `src/services/**` | Services métier (planning, geo) | Idem — additif. Toute modification = annonce. |
| `src/data/remc.js` | Référentiel REMC officiel | **Read-only** sauf demande explicite utilisateur. |
| `src/styles/**` | CSS global | Préfère scoper le CSS dans la page via `<style>` inline. Touche `styles/` uniquement pour variables CSS partagées. |
| `src/db/client.js` | Switch SQLite/Postgres | Read-only sauf bug. |
| `src/config/env.js` | Config | Read-only sauf nouvelle env var. |

## Tables DB — qui écrit dans quoi

| Table | Écrit | Lit | Notes |
|---|---|---|---|
| `profiles` | admin | tous | élève/moniteur lisent leur propre row uniquement |
| `events` | moniteur, admin | tous | leçons + dispos + absences |
| `remc_entries` | moniteur | élève, moniteur, admin | validation compétences |
| `notations` | élève | moniteur, admin | élève note son moniteur |
| `lesson_reviews` | moniteur, élève | élève, moniteur | feedback post-leçon |
| `lesson_self_evals` | élève | élève, moniteur | auto-éval élève |
| `notes_priv` | moniteur | moniteur (auteur uniquement) | **PRIVÉ — l'élève ne doit JAMAIS voir ce contenu** |
| `notifications` | tous | destinataire | broadcast cross-rôles |
| `absences` | moniteur, admin | moniteur, admin | jamais l'élève |
| `lieux` | moniteur | moniteur, élève | points RDV |
| `audit_log` | système | admin | immuable |

## Procédure si un bot DOIT modifier une zone partagée

1. Ouvre `FLOWS.md` → section "Changements en cours"
2. Ajoute une entrée datée : `[YYYY-MM-DD bot-X] description du changement + raison`
3. Si c'est une rupture de contrat (rename colonne, signature de fonction qui change), notifie l'utilisateur pour qu'il prévienne les autres conversations
4. Code la modification de manière **rétrocompatible si possible** (ajout > modification > suppression)
5. Met à jour FLOWS.md une fois fini avec `[DONE]`

## Comment éviter les conflits Git si plusieurs sessions en parallèle

- Chaque conv commit dans son scope uniquement (`git add src/pages/eleve/ .claude/`)
- Évite `git add .` aveugle
- Pull/rebase avant chaque session
