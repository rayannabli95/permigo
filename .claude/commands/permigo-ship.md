---
description: Vérifie, commit, push, et ouvre une PR
---
!git status
!git diff --stat

1. Lance `npm run lint`. Plante → STOP, fixe.
2. Lance `npm run typecheck`. Idem.
3. Lance `npm run build`. Idem.
4. Tout passe : commit avec un conventional commit clair.
5. Push sur la branche actuelle.
6. `gh pr create` :
   - Title = commit subject
   - Body = description + checklist :
     - [ ] Tests passants
     - [ ] Preview Vercel OK
     - [ ] RLS testée
     - [ ] Types DB regénérés si schema modifié
