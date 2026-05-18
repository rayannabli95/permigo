# Audit hebdo PermiGo — 2026-05-18

## Résumé exécutif

Semaine globalement saine : aucune injection XSS détectée (`esc()` partout), tous les `console.error` sont dans des `catch` ou après vérif `error`. Deux `await` Supabase non protégés par `try/catch` à surveiller (quiz + parcours) et un TODO data côté élève.

## 🔴 Critiques

Aucune vulnérabilité bloquante cette semaine. ✅

## 🟠 À surveiller

### Await sans try/catch (network throw possible)

- `permigo-game/src/modules/pedagogie/quiz-engine.js:18` — `await sb.from('questions_competence')...` : erreur applicative captée via `if (error)`, mais un throw réseau (offline, timeout) remonterait non-géré et casserait `lancerQuiz`. Fix : wrapper l'appel dans `try/catch`, toast en cas d'échec.
- `permigo-game/src/pages/eleve/parcours.js:1055` — `await sb.from('validations')...` : aucune vérification d'`error` ni `try/catch`. En cas d'échec, `valData` est `undefined` et la page affiche un parcours vide silencieusement. Fix : `try/catch` + fallback `toast('Erreur DB', 'error')` comme dans le pattern obligatoire du `CLAUDE.md`.

### TODO / dette technique

- `permigo-game/src/pages/eleve/accueil.js:522` — `hoursThisWeek: 0, // TODO: from lecons_realisees when data exists` : valeur en dur, à remplacer dès que la table `lecons_realisees` est alimentée.
- `permigo-game/src/pages/eleve/parcours.js:465` — `/* ─ TODO — blanc, bordure pointillée ─ */` : marker dans le CSS pour state "à faire", purement décoratif, pas d'action requise.

### addEventListener sans removeEventListener (memory leak potentiel en SPA)

Constat sur les fichiers modifiés :
- `permis-card.js` : 4 add / 0 remove
- `accueil.js` : 5 add / 0 remove
- `parcours.js` : 8 add / 2 remove
- `validation.js` : 3 add / 0 remove (mitigation : pattern clone-replace ligne ~475 pour reset les listeners)
- `router.js` : 1 add (`hashchange`) / 0 remove — listener global volontaire, OK.

En pratique : la majorité des listeners sont attachés à des éléments qui sont remplacés par `root.innerHTML = ...` lors du re-render, donc GC'd. À surveiller si on ajoute un hash router qui change `root` sans wiper les listeners globaux (`document`, `window`).

## 🟢 OK

- **XSS** : tous les `innerHTML` dans les fichiers modifiés interpolent via `esc()` (ou `richEsc()` qui wrappe `esc()`). Aucune fuite détectée.
- **console.error** : tous placés dans un `catch` ou après un `if (error)` — aucun appel orphelin.
- **accueil.js** : `mount()` wrappé dans un `try/catch` global avec fallback UI propre (bouton recharger). 👌
- **validation.js** : try/catch propre sur la fetch des validations + fallback set vide pour ne pas bloquer l'UI.
- **router.js** : gestion fine du stale chunk après deploy (reload-once via sessionStorage). 👌

## Commits scannés (10 derniers)

`permigo-game/src/components/permis-card.js`, `data/remc-details.js`, `modules/pedagogie/quiz-engine.js`, `pages/eleve/accueil.js`, `pages/eleve/parcours.js`, `pages/enseignant/validation.js`, `router.js`, `utils/assets.js`.
