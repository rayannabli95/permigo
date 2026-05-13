# CHANGELOG Autopilot v6.1 → v6.2

**Date :** 1 mai 2026
**Spec source :** `PROMPT_COWORK_FIXES.md` (23 tâches)
**Smoke test :** 23/23 PASS

## P1 — Bloquants prod (5 tâches)

| TASK | Description | Statut |
|---|---|---|
| 01 | Date du modal créneau pré-remplie sur today + min=today | ✅ |
| 02 | Liste élèves dynamique (10 actifs au lieu de 6 hardcodés) | ✅ |
| 03 | Aria-labels sur tous les boutons icon-only (29 ajoutés) | ✅ |
| 04 | Escape ferme les modals + focus trap + role="dialog" | ✅ |
| 05 | Photos compressées canvas (300px max, JPEG 78%) avant localStorage | ✅ |

## P2 — Sécurité & a11y (4 tâches)

| TASK | Description | Statut |
|---|---|---|
| 12 | Contraste `--mu2` corrigé (#9CA3AF → #6B7280, ratio AA OK) | ✅ |
| 13 | Aria-labels sur tous les inputs (login, signup, recherche, etc.) | ✅ |
| 14 | Audit innerHTML — déjà couvert par `esc()` (vérifié) | ✅ |
| 15 | Content Security Policy stricte ajoutée | ✅ |

## P2 — UX (6 tâches)

| TASK | Description | Statut |
|---|---|---|
| 06 | Plaque immat dynamique dans modal créneau (depuis MONS[0]) | ✅ |
| 07 | Bouton "Annuler quand même" désactivé tant que motif vide | ✅ |
| 08 | Mode démo : 3 boutons stylés au lieu de window.prompt | ✅ |
| 09 | "Aussi aujourd'hui" trié + état leçon (passée/en cours/à venir) | ✅ |
| 10 | Confirmation suppression in-line stylisée (plus de window.confirm) | ✅ |
| 11 | Pénalité chiffrée dans modal annulation (durée × tarif lieu) | ✅ |

## P3 — Polish (8 tâches)

| TASK | Description | Statut |
|---|---|---|
| 16 | Persistance "lu" notifications via localStorage `ap-notifs-read` | ✅ |
| 17 | Bouton ⌘K placeholder retiré (et le 💾 livret aussi) | ✅ |
| 18 | Spinner upload photo (opacity 0.5 pendant compression) | ✅ |
| 19 | Sections REMC repliables avec `<details>` (C1 ouvert par défaut) | ✅ |
| 20 | Toast Undo sur suppressions (bouton ↩ Annuler 5 sec) | ✅ |
| 21 | NOTIFS dynamiques (`ts:Date.now()-...` + `relTime()`) | ✅ |
| 22 | MutationObserver scopé (#pw, #auth-screen, .bnav, .mb) | ✅ |
| 23 | Skip-to-content link visible au focus clavier | ✅ |

## Métriques

| | v6.1 | v6.2 | Δ |
|---|---|---|---|
| Lignes | 3 498 | 3 705 | +207 |
| Taille | 206 KB | 224 KB | +18 KB |
| aria-label | 0 | 29 | +29 |
| Tâches QA P1+P2+P3 | 0 | 23 | +23 |
| Tests automatiques PASS | — | 23/23 | 100% |

## Aucune régression

- ✅ Pas d'IA réintroduite (AI_SIM, AGENTS toujours absents)
- ✅ Pas de CA / revenus
- ✅ Pas de "Congé" dans absences
- ✅ Calendrier sur vraies dates
- ✅ Statuts white/yellow/red conservés
- ✅ Carte "Aujourd'hui" moniteur préservée
- ✅ Persistance localStorage (17 clés) intacte
- ✅ Dark mode fonctionnel

## Restant pour v7

- Vraie auth Supabase (remplacer mock auth)
- API REST + tables Postgres
- Notifications push (Service Worker)
- Stripe Connect pour facturation
- Multi-tenant (plusieurs auto-écoles)
