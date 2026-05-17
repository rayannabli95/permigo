---
description: Demarre un plan structure pour une nouvelle feature PermiGo. Plan d'abord, code ensuite.
---

## Instructions

Avant d'ecrire le moindre code, mene une mini-interview :

### 1. WHAT
- Quelle feature precisement ?
- Quel role (eleve / enseignant / gerant) ?
- Quelle competence REMC (C1-C4 + sous-comp.) si applicable ?

### 2. WHY
- Quel probleme utilisateur ca resout ?
- Critere de succes mesurable ?
- Quelle metrique trackee ?

### 3. HOW — tranche verticale
- [ ] Migration SQL + RLS (si nouvelle table/colonne)
- [ ] Edge function (si cron / trigger backend)
- [ ] Composant UI (page ou modal)
- [ ] Tracking events_analytics
- [ ] Test manuel sur viewport 375x812

### 4. Fichiers a creer/modifier
Liste path:line precis.

### 5. Risques
- Perf RLS (index manquant ?)
- Conflit policy
- Breaking change schema
- Anti-pattern moniteur (cf CLAUDE.md antipatterns)
- Anti-pattern Triple Validation

### 6. Mantra final
Avant de coder, repond aux 3 questions du CLAUDE.md :
1. Ca declenche l'envie ?
2. Ca genere une metrique ?
3. Ca simplifie la vie d'au moins 1 persona ?

Si NON aux 3 -> STOP, on degage. Anti-scope-creep.

---

**Presente le plan. ATTENDS validation Rayan avant de coder. NE LANCE PAS de code pendant ce flow.**
