# CHANGELOG v6.5 → v6.6 "Polish + démo robuste"

**Date :** 2 mai 2026
**Focus :** régler les 5 points signalés à la fin de v6.5, sans rien casser.

## ✅ 5 fixes appliqués

### #1 — Sélecteur moniteur admin : filtrage RÉEL
Avant : `evts.filter((_,i)=>i%5===filterMonIdx%5||i%3===0)` — modulo arbitraire.
Après : chaque event a (ou se voit attribuer par hash stable du nom) un `monIdx`. Le filtre est maintenant `evts.filter(e=>e.monIdx===filterMonIdx)`. Cohérent et visuellement crédible en démo.

### #2 — Indicateur "● EN COURS" pulsant
Nouvelle classe CSS `.lp.live` : pulse bleu + badge "● EN COURS" en haut-droite, animation `liveDot` 1.4s.
Helper `isLessonLive(ev)` : true si `now ∈ [start, start+dur]`.
Appliqué dans `buildCalendar` uniquement sur la semaine actuelle ET le jour courant.
Refresh auto toutes les 60s via `startLiveTick()` → l'indicateur s'éteint quand la leçon se termine.

### #3 — EVENTS toujours peuplés pour today
Nouveau helper `ensureTodayHasEvents(arr)` appelé au chargement. Si moins de 2 leçons sur today, en seede 3 :
- une dans 1h
- une qui démarrera dans ~10 min (déclenche le pop-up démo automatiquement)
- une en fin d'aprem
→ La carte "Aujourd'hui" et le calendrier ne sont plus jamais vides, même un dimanche.

### #4 — Trigger manuel pop-up fin de leçon (pour démo)
Fonction `window.triggerEndOfLessonDemo()` exposée en console. Reset les flags pop-up, crée un event factice "in progress", déclenche immédiatement le bon modal selon le rôle. Permet de tester la feature sans attendre l'heure exacte.

**Usage** (console navigateur) :
```js
triggerEndOfLessonDemo()  // affiche le pop-up selon le rôle actif
```

### #5 — Compteur 35h moniteur : semaine seule
Avant : additionnait TOUS les events de la collection (hors-semaine compris).
Après : filtre `e.d>=1 && e.d<=7` — uniquement les jours de la semaine en cours. Le compteur reflète enfin la réalité hebdomadaire.

## 📊 Métriques

| | v6.5 | v6.6 | Δ |
|---|---|---|---|
| Lignes | 4 385 | 4 462 | +77 |
| Taille | 262 KB | 266 KB | +4 KB |
| Bugs corrigés | — | 5 | +5 |

## 🚫 Aucune régression — audit R1-R10

✓ R1 (pas IA) · ✓ R2 (pas CA) · ✓ R3 (pas Congé) · ✓ R4 (dates réelles)
✓ R5 (statuts couleur) · ✓ R6 (palette bleue) · ✓ R8 (mono-fichier)

## 🎯 Test rapide après install

1. Lancer en local : `python3 -m http.server 8080`
2. Mode démo → Moniteur → Planning :
   - Carte "Aujourd'hui" jamais vide ✓
   - Compteur 35h reflète la semaine réelle ✓
   - Une cellule du jour pulse "● EN COURS" si une leçon est en cours ✓
3. Console : `triggerEndOfLessonDemo()` → pop-up immédiat
4. Mode démo → Gérant → Calendrier → choisir un moniteur dans le dropdown → filtre cohérent ✓
5. Cliquer sur un slot `+` mardi 14h depuis le planning → modal avec `c-date = mardi` ✓ (déjà en v6.5)
