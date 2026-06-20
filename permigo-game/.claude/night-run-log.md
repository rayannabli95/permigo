# 🌙 Night-run log — 2026-06-20

**Branch** `feat/nuit-polish-eleve` (off `feat/revision-quiz-shortcut`, 1 ahead of main).
**Mission (Rayan, autonome):** polish utile + intuition (élève), vocab fixes, tuto copy, trophées thème auto, nom visible au lieu de usertag, refonte intuition accueil. Puis MÊME refonte enseignant (ton pro). Merge + push les deux sans demander.

## Wave 1 — DONE
- Research scout: brief intuition accueil (Duolingo/NN-g patterns + microcopy FR). ✅
- tuto-copy: réécrit intro/theory/parcours-tuto + onboarding + guided-tour (ultra-court, 1 slide filler retirée). ✅
- trophées-auto: achievements.js renommé thème pièces auto (Premiers réglages→Route ouverte ; Freins testés ; Jante rétro). Keys/images/seuils inchangés. ✅
- identity: ACCROCHE "Prêt à prendre la route ?" ; signup usertag→"Identifiant" + copy "ton prénom est ce que les autres voient" ; migration 20260620120000_leaderboard_nom_reel.sql (3 RPCs → "Prénom N.", À APPLIQUER MANUELLEMENT). ✅

## Wave 2 — IN PROGRESS
- homepage intuition (accueil.js + revision-cards.js) — gros bot, brief research embarqué
- parcours clarté (parcours.js)
- classement ligues clarté (classement.js)

## Lexique figé (cohérence inter-pages)
- Hero: "Ta carte du permis" ; 0: "0 sur 31 — chaque compétence validée par ton moniteur la complète."
- CTA 1er run: "Commence ta 1re révision" / récurrent "Continue à réviser" ; sous-texte "2 min suffisent."
- Ligue Révision: "Classement révision" — "Plus tu fais de quiz, plus tu montes." — vide "Fais un quiz pour entrer au classement."
- Ligue École: "Classement avec ton moniteur" — "Chaque compétence validée te fait grimper." — vide "Ta première validation te classe ici."
- Jamais: REMC, consolidation, C1-C4.

## À FAIRE manuellement par Rayan
- [ ] Appliquer migration `20260620120000_leaderboard_nom_reel.sql` (sinon classement montre encore le username).
