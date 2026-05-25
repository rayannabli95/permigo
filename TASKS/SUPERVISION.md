# Protocole de supervision

Tu codes dans VS Code, je relis derrière. Boucle simple :

## Boucle de revue
1. Tu implémentes une tâche du `BOARD.md`, tu coches ses cases et tu passes son `Statut` à **À RELIRE**.
2. Tu me dis « relis B2 » (ou la tâche concernée).
3. Je relis :
   - `git diff` des fichiers touchés vs les critères « Done quand » de la carte
   - conformité au code « avant/après » du rapport référencé (FONC / A11Y)
   - vérif live navigateur si pertinent (focus, état d'erreur, rendu)
   - régressions : `npm run build` + console sans erreur
4. Je passe la tâche en **VALIDÉ** ✅ ou **À CORRIGER** ❌ (avec la liste précise de ce qui manque, file:line).

## Règles
- Une branche par lot (`fix/...`, `feat/...`), `git pull` main avant de brancher (déjà perdu du travail via PR #5 — cf. mémoire projet).
- `npm run lint && npm run build` avant de me demander une revue (le lint est un placeholder aujourd'hui — finding process séparé).
- Pas de push direct sur main, vérif sur preview Vercel avant merge.
- Pour les tâches **DÉCISION** (B1, C4) : ne pas coder tant que le choix n'est pas tranché.
- Échappement XSS obligatoire (`esc()`) sur toute donnée injectée en `innerHTML`.

## Légende des statuts
`TODO` → `EN COURS` → `À RELIRE` → `VALIDÉ` / `À CORRIGER` · `DÉCISION` · `EN ATTENTE INFO` · `BACKLOG`
