# TODO Demain (2026-05-21)

## Audits livrés ce soir
- AUDIT_UX_A11Y_ELEVE_2026-05-20.md (9 findings, 3 critiques fixés et pushés)
- AUDIT_FONCTIONNEL_ELEVE_2026-05-20.md (11 findings, 2 critiques fixés et pushés)
- ROADMAP_RANKING_MONITEUR_2026-05-20.md (à lire demain matin)

## Quick wins fonctionnels (~60 min)
- #3 routes mortes : câbler galerie + wrapped dans game-hud.js
- #4 erreur=vide : mes-coffres.js + boutique.js
- #5 critère examen mort : câbler permigo:has_revised
- #6 traduction erreur refus séance (session-confirmation.js)
- #7 bouton gel série figé (accueil.js)
- #8 imports zombies galerie
- #11 commentaire RPC + handlers boutique dupliqués

## Quick wins a11y (~30 min)
- #4 :focus-visible global (12 pages)
- #5 aria-live sur résultats (quiz, examen, boutique, coffres)
- #6 cibles tactiles 44px (parcours.js:852, exam-blanc.js:106)

## Chantiers structurants (week-end)
- Wrapper Supabase uniforme loadOr()
- Composants EmptyState/ErrorState
- Logger central src/utils/logger.js (remplace 105 console.*)
- Convention nav "page profonde" (← partout)
- Test CI routes vs liens (aurait attrapé galerie/wrapped morts)
- npm run lint à câbler vraiment (placeholder echo aujourd'hui)
- Investiguer les 3 warnings Vite "dynamic + static import" du build

## Schéma DB
- Tester 0008_demo_core_recovery.sql sur branche Supabase DEV (pas prod, pas la nuit)
- Préparer 0009 (gamification : daily_quests, items_catalog, chest_unlocks)

## Sub-agents à corriger
- .claude/agents/react-component-builder.md mentionne React mais stack vanilla JS

## Business
- 1 appel patron auto-école par jour minimum
- Lire ROADMAP_RANKING_MONITEUR_2026-05-20.md au calme
- Décider : renommer Permigo (cf scandale PermiGo 1/2 SAS 2017)
