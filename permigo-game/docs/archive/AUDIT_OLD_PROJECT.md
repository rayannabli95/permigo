# AUDIT — Comparaison permigo-v7 → permigo-game
Date : 2026-05-17

---

## Pages BIEN MEILLEURES dans l'ancien projet

| Page | État game | État ancien | Delta |
|---|---|---|---|
| `enseignant/mes-eleves.js` | Proxy vers validation (vide) | Search + 3 tabs + avatars gradients + REMC bar | ★★★★★ manque |
| `enseignant/livret-remc.js` | Placeholder "bientôt" | 31 compétences, 4 cats, filter tabs, bottom sheet | ★★★★★ manque |
| `gerant/equipe.js` | Placeholder "bientôt" | Moniteurs + stats heures/sem/mois + note moy | ★★★★★ manque |
| `gerant/eleves.js` | Placeholder "bientôt" | Liste filtrée statut/code + REMC progress | ★★★★★ manque |
| `gerant/pulse.js` | Existe mais DARK theme | Light, KPIs date-aware, team recap | ★★★ dark |
| `enseignant/aujourdhui.js` | N'existe pas | Timeline jour, FAB, livret tracking | ★★★★ manque |

## Composants manquants dans game vs ancien

Présents dans l'ancien, absents dans game :
- `utils/count-up.js` — animation chiffres (utilisé dans dashboards, KPIs)
- `utils/reveal-on-scroll.js` — utilisé dans parcours
- `utils/game-state.js` — computeStats, isChestOpened (non pertinent game schema)
- `services/geo-tracking.js` — NON PERTINENT (planning)
- `components/avatar.js` — standalone avatar (game a avatar-modal mais pas avatar seul)
- `components/logo.js` — non critique (header-top.js dans game)
- `components/rating-prompt.js` — V2

## Patterns UX perdus

1. **CSS variables** — ancien utilise `var(--su)`, `var(--ink)`, `var(--mu)`, `var(--bo)` partout. Game hardcode les couleurs dans chaque page → incohérence. `base.css` a les variables mais les pages ne les utilisent pas.
2. **Search + filter tabs** — absent de mes-eleves game
3. **Avatar gradients initiales** — `AVATARS[]` palette dans mes-eleves ancien
4. **Tab segmenté** — UI tabs Tous/Actifs/Inactifs lost
5. **REMC progress bar** sur cartes élèves — lost
6. **Bottom sheet eval** — livret-remc ancien avait bottom sheet avec radio Acquis/En cours/À retravailler + note textarea
7. **count-up animation** — les KPIs animaient les chiffres au mount

## Schéma DB : différences critiques

| Ancien | Game |
|---|---|
| `remc_entries(comp_id, lv: v/p/r, note, validated_at)` | `validations(competence_id, statut: acquis, validated_by, score_cognitif)` |
| `events` (planning) | ❌ absent (pas de planning) |
| `notations(moniteur_id, note)` | ❌ absent V1 |
| `profiles.nom` | `profiles.prenom` |
| `profiles.forfait_h` | `profiles.credit_heures` |
| role=`moniteur` | role=`enseignant` |

## Ce que le game a en PLUS (à conserver absolument)

- Streak Pro (Apple Health vibe) — inexistant dans l'ancien
- Activity Heatmap indigo
- Quiz engine (Triple Validation) — c'est le cœur du game
- XP system + levels
- Trophées avec legendary border @property
- Onboarding modal
- Confetti + level-up detection
- Quiz post_validation + consolidation flow

## Actions prioritaires

1. **URGENT** : Construire `mes-eleves.js` enseignant (vrai contenu)
2. **URGENT** : Construire `livret-remc.js` enseignant (adapté à `validations`)
3. **URGENT** : Construire `equipe.js` et `eleves.js` gérant
4. **URGENT** : Refonte `pulse.js` → light theme
5. **MOYEN** : Créer `aujourdhui.js` enseignant (stats du jour)
6. **MOYEN** : Migrer hardcoded colors → CSS vars dans pages principales
7. **FAIBLE** : Copier `count-up.js` de l'ancien
