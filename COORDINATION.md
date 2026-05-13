# COORDINATION.md — Comment les 3 bots PermiGo travaillent ensemble

> **Lis-moi quand tu lances une nouvelle conversation Claude.** Ce fichier dit comment les 3 conversations parallèles (élève / moniteur / gérant) se branchent les unes aux autres sans collision.

## TL;DR du plug

```
       ┌──────────────────────────────────┐
       │  CONTRATS PARTAGÉS (racine projet) │
       │  • OWNERSHIP.md  → qui peut quoi   │
       │  • FLOWS.md      → flux cross-rôles│
       │  • src/db/schema.js → source DB     │
       └──────────────────────────────────┘
              ▲           ▲           ▲
              │           │           │
   ┌──────────┴──┐  ┌────┴────────┐  ┌┴───────────────┐
   │ BOT ÉLÈVE   │  │ BOT MONITEUR│  │ BOT GÉRANT     │
   │             │  │             │  │                │
   │ Skill +     │  │ Skill +     │  │ Skill +        │
   │ Agent       │  │ Agent       │  │ Agent          │
   │             │  │             │  │                │
   │ Écrit dans  │  │ Écrit dans  │  │ Écrit dans     │
   │ pages/eleve │  │ pages/      │  │ pages/admin    │
   │             │  │ moniteur    │  │                │
   └─────────────┘  └─────────────┘  └────────────────┘
              │           │           │
              └─────► DB Supabase ◄───┘
                      (RLS protège)
```

3 conversations Claude différentes (3 onglets/sessions). Chacune charge **son** skill via le matching de description, peut invoquer **son** sub-agent via Task tool. Toutes les 3 lisent les **mêmes contrats partagés** au démarrage. La DB Supabase est la zone de rendez-vous.

## Les 4 mécanismes de couplage

### 1. Contrats partagés en racine — la "constitution"

`OWNERSHIP.md`, `FLOWS.md`, `src/db/schema.js`, `CLAUDE.md`.

Chaque skill ordonne au bot de les lire **avant** toute modification. Ils définissent : qui peut écrire dans quel dossier, qui peut écrire dans quelle colonne DB, quels événements cross-rôles existent et quels champs ils portent. Si ces 4 fichiers sont stables, les 3 bots peuvent travailler des semaines en parallèle sans se voir et ne jamais se marcher dessus.

### 2. Section "Changements en cours" de FLOWS.md — le "tableau d'affichage"

Quand un bot doit toucher du code partagé (rare mais inévitable), il écrit une ligne avant de coder :

```
[2026-05-13 permigo-eleve-dev] ajout colonne profiles.skin_actif (nullable) | rétrocompat: oui | status: in-progress
```

Les autres bots lisent cette section au début de chaque tâche. Si une ligne dit "rétrocompat: non", ils stoppent et attendent — c'est toi (l'humain) qui coordonnes.

### 3. DB Supabase — la "boîte aux lettres"

Les 3 bots ne se parlent jamais directement. Ils communiquent par insertions DB :

- L'élève réserve → INSERT events.t='pend' → notification au moniteur
- Le moniteur valide compétence → UPDATE remc_entries → notification à l'élève
- L'admin modifie forfait → UPDATE profiles + audit_log + notification à l'élève et au moniteur

Le tableau Flux 4 de `FLOWS.md` est le **contrat de messagerie**. Chaque bot sait quoi insérer dans `notifications` quand son action concerne un autre rôle. Oublier = bug silencieux côté destinataire.

### 4. Skill descriptions "pushy" — le "routage automatique"

Les frontmatter `description:` des 3 skills sont écrits pour matcher des phrases-déclencheurs distinctes :

- `permigo-eleve-ux` se charge sur "élève", "parcours", "réservation", "trophées"
- `permigo-moniteur-ux` se charge sur "moniteur", "planning", "fiche élève (vue moniteur)", "livret REMC à valider"
- `permigo-admin-ops` se charge sur "admin", "gérant", "tableau de bord", "audit"

Ainsi, dans une conv, dès que tu écris "améliore le parcours élève", **seul** le skill élève s'active. Pas de pollution croisée du contexte. Token-efficient et anti-confusion.

## Comment lancer les 3 conversations

### Première fois — bot ÉLÈVE
```
Ouvre Claude. Dis : "On bosse sur PermiGo v7, scope ÉLÈVE. Lis CLAUDE.md, OWNERSHIP.md, FLOWS.md, puis ta charte dans .claude/skills/permigo-eleve-ux/SKILL.md. Première tâche : <…>"
```

### Première fois — bot MONITEUR
```
Ouvre une SECONDE conv Claude. Dis : "On bosse sur PermiGo v7, scope MONITEUR. Lis CLAUDE.md, OWNERSHIP.md, FLOWS.md, puis ta charte dans .claude/skills/permigo-moniteur-ux/SKILL.md. Première tâche : <…>"
```

### Première fois — bot GÉRANT
```
Ouvre une TROISIÈME conv. Dis : "On bosse sur PermiGo v7, scope ADMIN/GÉRANT. Lis CLAUDE.md, OWNERSHIP.md, FLOWS.md, puis ta charte dans .claude/skills/permigo-admin-ops/SKILL.md. Première tâche : <…>"
```

Chaque conv ne voit que son scope. Si tu poses une question moniteur au bot élève, il dira "scope d'un autre bot, je peux préparer un patch mais préfère que tu lances la conv moniteur".

## Comment gérer les conflits quand ils arrivent quand même

### Conflit DB (les 3 modifient `schema.js` en même temps)

C'est le seul vrai risque. Mitigation :
1. **Un seul bot à la fois** touche `schema.js`. Le premier qui veut ajouter une colonne le fait, annonce dans `FLOWS.md`, les autres attendent que ce soit `DONE`.
2. Si vraiment besoin parallèle : tu (humain) mergues les migrations à la main. Les bots n'ont pas le contexte des 2 autres convs.

### Conflit Git (2 bots commitent en même temps)

- Chaque conv commit dans son scope (`git add src/pages/eleve/` ou `src/pages/moniteur/`)
- Évite `git add .` aveugle
- Pull/rebase entre chaque session
- Si conflit : le humain (toi) tranche

### Conflit de design (parcours élève change le contrat avec le livret moniteur)

- Le bot émetteur du changement annonce dans `FLOWS.md`
- Tu (humain) propages aux autres conv : "Hey, le bot élève vient d'ajouter X dans `remc_entries`, tu en tiens compte"
- Les bots ne se voient pas, c'est toi le bus de communication

## Comment savoir si le plug fonctionne

Test simple : ouvre les 3 convs, donne à chacune une tâche dans son scope, vérifie :

1. Aucune des 3 ne touche les fichiers des 2 autres (sauf annonce explicite dans FLOWS.md)
2. Toute action métier qui doit notifier un autre rôle insère bien une ligne dans `notifications` avec le bon `type`
3. Toute action admin sensible écrit dans `audit_log`
4. Le projet build (`npm run build`) sans erreur après chaque session

Si une de ces 4 conditions casse → relis le skill du bot fautif, ajuste si nécessaire.

## Évolution future possible

- **Mémoire partagée plus riche** : si les 3 bots oublient des décisions, on peut ajouter `DECISIONS.md` (log d'architecture)
- **Bot QA cross-rôles** : un 4ème bot dont le scope est `tests/` et qui vérifie que les flux end-to-end (réservation → confirmation → validation REMC) ne se cassent pas
- **Bot designer** : un 5ème bot scope `src/styles/` + `src/components/` (ressources partagées UI) que les 3 autres lisent en additif

Pour l'instant, 3 bots + ces contrats = sweet spot.
