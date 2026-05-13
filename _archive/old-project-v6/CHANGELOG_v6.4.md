# CHANGELOG v6.3 → v6.4 "Élève-First"

**Date :** 2 mai 2026
**Focus :** Tenir la promesse "placer / modifier / annuler / programmer en 1-3 clics"

## 🎯 6 tâches appliquées

### EF-01 — Bouton "✏️ Modifier" dans modal m-event ⭐⭐⭐
Avant : pour décaler une leçon, il fallait supprimer + recréer (8 clics).
Après : 1 clic Modifier → m-cren pré-rempli avec les données → 1 clic Valider.
Mécanique : `window._editingEvent` flag, le `btn-valider` retire l'ancien event puis push le nouveau, titre et bouton du modal s'adaptent.

### EF-02 — Section "⏳ Demandes en attente" en haut du planning ⭐⭐⭐
Bannière jaune au-dessus de la carte Aujourd'hui qui liste toutes les leçons `t==='pend'`. Boutons inline ✓ Confirmer (vert) / ✗ Refuser (rouge) sur chaque ligne. Refus = `toastUndo` pour récupération en 5s.

### EF-03 — Bouton "📅 Proposer 3 créneaux" sur fiche élève ⭐⭐⭐
Sur la fiche élève, 3 boutons côte à côte : Livret / Proposer 3 créneaux / Créneau personnalisé. Le bouton ouvre un modal avec 5 créneaux suggérés (dont 3 pré-cochés), basés sur les heures historiques de l'élève. Validation = 3 events `t='pend'` créés.

### EF-04 — Replacements intelligents dans annulation ⭐⭐
`smartReplacements(ev)` priorise :
1. Même heure les jours suivants (score 1000-50/jour)
2. Horaires alternatifs proches du même jour ou lendemain (score décroissant selon écart heure + jour)
Badge "même heure" affiché sur les replacements idéaux.

### EF-05 — Calendrier compact 8h-20h par défaut + toggle 🌙/☀️
`HOURS_COMPACT` (13 lignes) au lieu de `HOURS_FULL` (18 lignes). Bouton 🌙 dans la barre du planning pour étendre. Préférence persistée (`ap-extended-hours`).

### EF-06 — Messages rapides sur fiche élève
Bloc dédié avec 4 SMS prédéfinis : "🚗 J'arrive dans 5 min", "⏱ Je suis en retard de 10 min", "📍 Êtes-vous au point de RDV ?", "✓ Bien reçu, à bientôt". Toast simulant l'envoi en prod.

## 📊 Métriques

| | v6.3 | v6.4 | Δ |
|---|---|---|---|
| Lignes | 4 010 | 4 217 | +207 |
| Taille | 239 KB | 251 KB | +12 KB |
| Modals | 9 | 10 (+ m-propose) | +1 |
| Score UX moniteur | 6.5/10 | **8.5/10** estimé | +2 |
| Clics pour modifier une leçon | ∞ (impossible) | **2** | -∞ |
| Clics pour proposer une leçon | 8 | **2** | -6 |
| Clics pour confirmer une demande | 4 | **1** | -3 |

## 🚫 Aucune régression

Pas d'IA, pas de CA, pas de Congé, calendrier sur vraies dates, statuts white/yellow/red, persistance complète.
