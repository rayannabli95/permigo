# HANDOFF — Ligue théorique explicite (tuto + légende + animation de gain)

> Pour Claude Code (VS Code). Travail fait par Cowork le 2026-06-10, **dans le working tree, non commité**.
> À toi de faire : branche `feat/theory-league-tuto` → commit → push → PR. **JAMAIS de push sur main.**
> ⚠️ Workflow : `git pull origin main` AVANT de créer la branche (les modifs locales suivront via checkout -b, elles sont uncommitted).

## Périmètre

Le scoring de la ligue théorique (PR #118, en prod) était opaque. On EXPLIQUE et on ANIME — **zéro changement de scoring, zéro migration DB, pur front**.

## Fichiers

### Créés
| Fichier | Rôle |
|---|---|
| `permigo-game/src/components/eleve/intro-tuto.js` | Carrousel de tuto **générique** (factory `createTuto({storageKey, slides, ariaLabel, trackPrefix, lastCta, onDone})`). Extrait de l'ancien parcours-tuto : mascotte flottante, dots, skip, Esc, musique/whoosh, reduced-motion. `onDone` appelé UNIQUEMENT à la complétion (pas au skip). |
| `permigo-game/src/components/eleve/theory-tuto.js` | Tuto Ligue théorique : 3 slides, flag `permigo-theory-tuto-v1`, CTA final « Faire un quiz » → `navigate("/parcours")`. Textes dérivés de `THEORY_PTS` / `THEORY_LEAGUES` (zéro chiffre en dur). |
| `permigo-game/src/components/eleve/theory-gain.js` | `computeTheoryGain()` (async, lit `quiz_attempts`, simule l'essai via `computeTheoryScore` → delta) + `renderTheoryGain()` (bloc `+N pts Théorie` : compteur rAF easeOutCubic ~450 ms, mini-barre de progression vers le palier suivant, célébration mascotte+confetti sur montée de palier). CSS injecté une fois (`#tg-style`). |

### Modifiés
| Fichier | Quoi |
|---|---|
| `permigo-game/src/utils/theory-league.js` | Exporte `THEORY_PTS = {quiz:1, exam:4}` et `THEORY_QUIZ_PASS_PCT = 70`, désormais utilisés par `computeTheoryScore` ET toute l'UI. **Valeurs inchangées.** |
| `permigo-game/src/components/eleve/parcours-tuto.js` | Réécrit en wrapper de `createTuto` — **API publique identique** (`showParcoursTuto`, `maybeShowParcoursTuto`), même clé localStorage, mêmes slides/events. Seul consommateur : `pages/eleve/parcours.js` (vérifié, rien à changer). |
| `permigo-game/src/pages/eleve/classement.js` | Hero théorie : bouton « ? » (cible 44px, délégation sur root car body re-rendu en innerHTML) + bloc « Comment gagner des points ? » (2 pills dérivées du barème, icônes `icon()` SVG — pas d'emojis, règle projet). Tuto auto au 1er clic sur l'onglet Théorie. Pills de comptage existantes : chiffres dérivés de `THEORY_PTS`. |
| `permigo-game/src/services/quiz-engine.js` | `finish()` : appelle `computeTheoryGain({kind:"quiz", competenceId, scorePct})` et insère le bloc dans `.quiz-result` avant le bouton Continuer. Calcul AVANT la persistance (faite par les callers via `submit_competence_quiz` dans `onComplete`). |
| `permigo-game/src/pages/eleve/exam-blanc.js` | `showResults()` : `gainPromise` lancée AVANT l'insert `quiz_attempts` (fire-and-forget), bloc injecté dans `.exb-res-top`. |

## Décisions de design (à respecter si tu retouches)

1. **Honnêteté du feedback** : le bloc « +N pts » ne s'affiche QUE si le point est réellement nouveau (compétence/parcours pas déjà compté). Re-réussir un quiz déjà acquis → rien. C'est voulu : on valorise la maîtrise, on n'incite pas à farmer (esprit triple-validation).
2. **Seuil quiz** : +1 exige ≥70 % (`THEORY_QUIZ_PASS_PCT`), soit 3/3 sur un quiz de 3 questions. Le quiz-engine considère « réussi » à 60 % → un 2/3 affiche « Bien ! » sans point théorie. Comportement existant du scoring, pas un bug.
3. **Course exam-blanc** : le SELECT du gain part avant l'INSERT. Si l'insert gagne la course, delta=0 → pas d'anim. Fail-safe : jamais de faux +4, au pire une anim manquée.
4. **Montée de palier** : `to.idx > from.idx` → mascotte celebrate + `burstConfetti({count:80, power:14})`. Entrée dans la ligue (0 → ≥1 pt) compte comme montée (« Tu entres dans la ligue ! »). Confetti coupé sous `prefers-reduced-motion`, compteur affiché en valeur directe.
5. **Consolidation** : les quiz `consolidation` (notif-listener) passent aussi par `finish()` → même feedback. Cohérent : `computeTheoryScore` compte toute tentative non-exam avec `competence_id` ≥70 %.
6. Jamais de mention « code »/« ETG » dans les libellés (règle métier ligue théorique).

## État de vérif

- ✅ `node --check` (ESM) sur les 8 fichiers : OK.
- ✅ `npx vite build` : OK (1.14 s). NB sandbox : build fait avec `--outDir /tmp --emptyOutDir` car `dist/.DS_Store` non supprimable depuis le sandbox — **relance `npm run build` en local**, ça passera normalement.
- ⚠️ `npm run lint` est un stub (echo vide) — seul le build est un garde-fou.
- ❌ Pas testé en navigateur. À vérifier manuellement (compte `eleve@test.fr`) :

### Checklist recette
- [ ] Classement → onglet Théorie : tuto 3 slides au 1er passage, skip OK, « ? » le relance, CTA final navigue vers le parcours.
- [ ] Hero : bloc « Comment gagner des points ? » visible (états classé ET non classé), dark mode OK.
- [ ] Quiz compétence 3/3 (compétence jamais réussie) → « +1 pt Théorie » + barre. Re-réussir le même → rien.
- [ ] Quiz 2/3 → « Bien ! » sans bloc théorie (normal, <70 %).
- [ ] Exam blanc ≥12/15 sans faute élim. (parcours jamais réussi) → « +4 pts Théorie ».
- [ ] Gain franchissant un palier (ex. 7→8) → mascotte + confetti.
- [ ] macOS « Réduire les animations » → aucun confetti/compteur animé.
- [ ] Tuto parcours (régression) : `#prc-help` sur la page Parcours fonctionne toujours.
- [ ] e2e : `npm run test` (rappel : comptes test `eleve@test.fr`/`enseignant@test.fr`, certains specs pointent encore `@autopilot.fr`).

### Commit suggéré
`feat(theorie): légende explicite, tuto 3 slides et animation de gain de points`

## Et après (reste du projet — contexte pour toi)

- Backlog/état des chantiers : voir `permigo-game/CLAUDE.md` + mémoires Cowork (refonte moniteur/exam blanc/avatars en prod ; reste = cosmétique, templates enseignant en idées futures).
- Piste naturelle après cette PR : le moniteur voit le score théorie dans `livret-remc.js`/`insights.js` — y afficher le palier (`theoryLeague()`) pour fermer la boucle côté enseignant (sans CTA contact élève, règle stricte).
- Nettoyage en attente (décision 2026-06-07) : code gemmes/boutique moniteur abandonné (migration 0023 existe encore).
- Prod = vrais élèves : aucun test d'écriture direct en prod.
