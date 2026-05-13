# Archive PermiGo — Index complet

Date d'archivage : 11 mai 2026.
Tout ce qui a été produit ou échangé durant la conversation Cowork.

## Structure

```
_archive/
├── INDEX.md ............................ ce fichier
├── handoff-claude-design/ .............. mockups visuels Claude design (12 écrans + parcours-v2)
├── old-project-v6/ ..................... ancien projet monolithique autopilot.html + tous CHANGELOGs + schémas SQL
├── reports/ ............................ rapport QA (docx + md)
└── uploads/ ............................ fichiers uploadés bruts pendant la conv
```

## Détail

### `handoff-claude-design/`

Zip du handoff Claude design extrait :
- `moniteur-v4/index.html` — design définitif 12 écrans (LISTE → PARCOURS → DÉTAIL → ÉVAL → FEEDBACK → STATS → RÉCOMPENSE)
- `parcours-v2.html` — version standalone du Parcours élève (route sinueuse SVG)
- `Parcours REMC - standalone.html` — version précédente
- `moniteur-v2.html` — itération moniteur précédente
- `screens/*.jsx` — sources React des 12 mockups
- `lib/design-canvas.jsx`, `ios-frame.jsx` — utilitaires de présentation
- `uploads/pasted-*.png` — captures de référence intégrées au mockup

### `old-project-v6/`

L'ancien projet `autopilot-project-9` :
- `autopilot-v6.10.html` (3,9 Mo) — version finale du monolithe APRÈS tous mes fixes
- `login-test.html`
- `migration_v2.sql`, `supabase_*.sql` — schémas BDD
- `CHANGELOG_v6.2.md` → `CHANGELOG_v6.10.md` — historique versions
- `CHECKPOINT.md`, `CLAUDE.md`, `DEV_BRIEF.md` — docs originales projet
- `MASTER_PROMPT.md`, `PROMPT_*.md` — prompts utilisés
- `README.md`, `TEST_REPORT.md`, `UX_ANALYSIS_MONITEUR.md`
- `design-context.md` — contexte design extrait pour Claude design

### `reports/`

- `QA_Report_PermiGo_2026-05-11.docx` — rapport QA final formaté (verdict 🟡 LIVRABLE SOUS CONDITIONS + 21 bugs)
- `QA_REPORT_PERMIGO_2026-05-11.md` — version markdown du rapport

### `uploads/`

Fichiers exactement comme uploadés pendant la conv :
- `*_autopilot.html` (les versions intermédiaires d'autopilot.html)
- `*_CHANGELOG_v6.9.md`
- `*_SETUP_FINAL_QA_READY.md`, `*_SETUP_CONFIG_REAL_ACCOUNTS.md`, `*_SETUP_CONFIG_PERMIGO_QA.md` — setups credentials
- `*_autopilot amelioration competence-handoff.zip` — zip handoff Claude design
- `*_parcours-v2.html` — copie

## Ce qui N'EST PAS dans cet archive

- **Les échanges textuels de la conv Cowork** (les messages eux-mêmes) — pas extractibles depuis ici, accessibles via l'historique Claude sur claude.ai
- **Les screenshots Chrome MCP** pris pendant les tests live — éphémères, pas sauvegardés
- **Les screenshots ChatGPT** mentionnés (si tu en as, ils sont sur ton Mac ailleurs, pas passés par la conv)
- **Les conversations Claude Design** (mockups) — chez l'autre Claude
- **Les conversations ChatGPT** — pas accessibles

## Pour retrouver les prompts importants utilisés

Voir `old-project-v6/MASTER_PROMPT.md`, `PROMPT_CLAUDE_PRO.md`, `PROMPT_COWORK_FIXES.md`, `PROMPT_COWORK_FRONTEND.md`, `PROMPT_ELEVE_FIRST.md`, `design-context.md`.

## État final (au moment de l'archivage)

- ✅ Projet v6 (`autopilot-project-9/`) : tous bugs critiques du rapport QA fixés + déployé sur https://rayannabli95.github.io/Autopilot/
- ✅ Projet v7 (`permigo-v7/`) : scaffold complet + 5 pages fonctionnelles (login, accueil élève, parcours élève, mes élèves moniteur, fiche élève moniteur), DB SQLite locale opérationnelle
- ⏳ Pages restantes (~6h) listées dans `permigo-v7/CLAUDE.md`
