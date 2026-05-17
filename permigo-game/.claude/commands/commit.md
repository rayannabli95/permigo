---
description: Cree un commit Conventional Commits et push. Demande confirmation si branche = main.
---

## Contexte git
!`git status`
!`git diff --staged`
!`git log -1 --oneline`

## Instructions

1. Analyse le diff staged. Si rien staged -> `git add -A` puis re-diff.
2. Genere un message Conventional Commits :
   - `feat(scope): description` — nouvelle feature
   - `fix(scope): description` — bug fix
   - `refactor(scope): description` — refacto sans changement de comportement
   - `docs(scope): description` — doc
   - `chore(scope): description` — config, deps, etc.
   - scope = role (`eleve`, `enseignant`, `gerant`) OU module (`pedagogie`, `progression`, `auth`, `db`)
3. Si branche = `main`, **DEMANDE confirmation explicite avant commit**.
4. Commit puis push. Si pas d'upstream : `git push -u origin <branch>`.
5. Affiche le SHA + l'URL de la PR si disponible.

**JAMAIS** `git push --force` sur main. **JAMAIS** `git reset --hard` sans confirmation.
