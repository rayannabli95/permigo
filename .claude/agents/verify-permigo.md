---
name: verify-permigo
description: Test end-to-end via browser de la PR courante
tools: Read, Bash, mcp__playwright__*
model: opus
---
1. `npm run build` doit passer.
2. `npm run dev`.
3. Via Playwright MCP, ouvre localhost:5173.
4. Login moniteur démo.
5. Pour la feature de la PR : exécute le user flow.
6. Aucune erreur console.
7. Screenshots avant/après.
8. Rapport PASS/FAIL avec captures.
