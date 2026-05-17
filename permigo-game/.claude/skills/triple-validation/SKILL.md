---
name: triple-validation
description: Systeme pedagogique core de PermiGo. A UTILISER IMPERATIVEMENT des que l'utilisateur mentionne validation competence, quiz, consolidation, post-validation, score cognitif, ou REMC C1-C4. Garantit que chaque feature pedagogique respecte le pattern Triple Validation et n'introduit pas de dark patterns gamifies.
---

# Triple Validation — coeur pedagogique PermiGo

## Le concept (non-negociable)

Chaque competence REMC est validee 3 fois pour creer une memorisation durable :

1. **Validation pratique** (par l'enseignant) — geste maitrise en lecon
2. **Quiz post-validation** (30 secondes apres) — 3 questions, valide la comprehension
3. **Quiz consolidation** (48h apres) — 2 questions, valide la memorisation long-terme

**Ne JAMAIS modifier ce pattern sans validation explicite de Rayan.**

## Tables impliquees

- `validations` (statut, score, dates)
  - `practical_validated_at` (timestamp validation enseignant)
  - `cognitive_score` (score quiz post, 0-100)
  - `cognitive_done_at` (timestamp quiz post)
  - `consolidation_due_at` (= practical + 48h)
  - `consolidation_done_at` (timestamp quiz consolidation)
  - `consolidation_score` (0-100)
- `questions_competence` (banque de questions par competence + type)
  - `type` : `post_validation` (3 questions) OU `consolidation` (2 questions)
- `quiz_attempts` (log de chaque tentative)

## Flow technique

### Phase 1 : Enseignant valide
```js
// src/pages/enseignant/validation.js
await sb.from('validations').insert({
  eleve_id, competence_id, enseignant_id,
  practical_validated_at: new Date().toISOString(),
  consolidation_due_at: new Date(Date.now() + 48*3600*1000).toISOString()
});
```

### Phase 2 : Quiz post-validation (30s apres)
```js
import { lancerQuiz } from '@/modules/pedagogie/quiz-engine.js';

setTimeout(() => {
  lancerQuiz({
    competenceId, type: 'post_validation', nbQuestions: 3,
    onComplete: async (score, total) => {
      await sb.from('validations').update({
        cognitive_score: Math.round((score/total)*100),
        cognitive_done_at: new Date().toISOString()
      }).eq('id', validationId);
    }
  });
}, 30000);
```

### Phase 3 : Quiz consolidation (48h apres, declenche par cron)
Edge Function `trigger-consolidation` tourne toutes les heures, scanne `consolidation_due_at <= now()` et cree une notif `consolidation_quiz` pour l'eleve. L'eleve voit la notif, clique, lance le quiz 2 questions, enregistre `consolidation_done_at`.

## Anti-patterns interdits

❌ **Skip une phase** — les 3 sont obligatoires, dans l'ordre
❌ **Quiz qui dure > 2 min** — micro-quiz uniquement (3 ou 2 questions max)
❌ **Penalite si echec** — l'eleve refait, pas de honte
❌ **Score visible publiquement** — privacy eleve absolue
❌ **Recompense pour rapidite** — incite a bacler
❌ **Notif culpabilisante** ("tu as oublie ton quiz !") — toujours factuel ("Quiz consolidation pret quand tu veux")
❌ **Validation enseignant sans quiz** — la validation pratique seule ne valide PAS la competence dans le systeme

## Antipatterns moniteur (cf CLAUDE.md)

Repete car critique :
1. Pas de mascotte / confetti enfantin cote enseignant
2. Pas de monnaie virtuelle
3. Pas de leaderboard brut
4. Pas de streak punitif
5. Pas de recompense pour vitesse validation
6. Pas de surveillance managerial
7. Notif max 1/jour, ton factuel
8. Pas de pay-to-win

## Quiz engine

Tout passe par `src/modules/pedagogie/quiz-engine.js` -> `lancerQuiz()`. NE PAS recoder un quiz en parallele. Si besoin different, etendre l'engine existant.

## Checklist nouvelle feature pedagogique

- [ ] Respect des 3 phases (pratique + post + consolidation)
- [ ] Utilise `quiz-engine.js` (ne pas re-implementer)
- [ ] Track `quiz.started`, `quiz.question_answered`, `quiz.completed`
- [ ] Pas de dark pattern (cf antipatterns moniteur)
- [ ] Si nouvelle table : RLS + index (voir skill `supabase-permigo`)
- [ ] Question banque alimentee dans `questions_competence` avec bon `type`
