---
description: Pipeline de fin de session - build check, commit, push. A lancer avant de fermer.
---

Execute dans cet ordre, STOP au premier echec :

1. !`npm run build` — verifie que le build Vite passe
2. !`git status` — affiche les fichiers modifies
3. Si fichiers non commites : propose un message Conventional + demande validation
4. !`git add -A`
5. !`git commit -m "<message>"`
6. !`git push`
7. Affiche le SHA + l'URL Vercel du deploy si possible

Si une etape echoue : affiche l'erreur, propose 1-2 fixes, ATTENDS validation Rayan.
