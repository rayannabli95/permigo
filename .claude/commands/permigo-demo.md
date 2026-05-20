---
description: Prépare un compte démo seedé pour RDV client
---
Crée `scripts/seed-demo.ts` qui :
1. Crée auto-école "Auto-École Demo Paris 11e"
2. Crée 3 moniteurs (Sarah, Karim, Pierre)
3. Crée 12 élèves avec progression REMC variée
4. Génère 50-80 validations de compétences avec timestamps réalistes
5. Calcule rankings local + national
6. Output URL dashboard moniteur "Sarah" pour la démo

Idempotent (skip si déjà seedé).
