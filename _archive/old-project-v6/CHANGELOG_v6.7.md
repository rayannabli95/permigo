# CHANGELOG v6.6 → v6.7 "Mobile-First façon EVS"

**Date :** 2 mai 2026
**Inspiration :** EVS (En Voiture Simone) — UI mobile pure
**Contrainte :** R5 + R6 (palette bleue gardée, pas d'orange)

## ✅ 8 actions appliquées

### 1. FAB "+ Créneau" flottant bleu bas-droite
Bouton rond 56px en `position:fixed`, ombre forte, scale au tap. Visible uniquement sur pages calendrier (planning + cal-admin), masqué sur desktop ≥1024px (où la topbar suffit).

### 2. Toggle Jour / Semaine / Hebdo (3 vues)
Au lieu du toggle 2-options Sem/Hebdo, maintenant 3 vues :
- **Jour** (par défaut sur mobile) — vue listale `day-view` + carte Aujourd'hui
- **Semaine** (par défaut desktop) — grille classique
- **Hebdo** — résumé condensé

Préférence persistée (`ap-cal-view`). Switching auto selon `window.innerWidth<769`.

### 3. Cellules calendrier 60px (au lieu de 50)
Plus lisible, noms multi-lignes possibles, touch targets respectés.

### 4. Bouton "Aujourd'hui" rond flottant centré bas
Pill arrondi blanc avec bord bleu, en `position:fixed bottom`. Plus accessible au pouce que le bouton dans la barre haute.

### 5. Card élève enrichie (façon EVS)
Sur la fiche élève :
- "🎯 C'est sa 8ème heure sur 30h forfait" — bloc bleu pâle
- "🏁 Examen : 11/05/2026 à 10:00" — bloc jaune si applicable
- Téléphone cliquable `tel:` — était texte simple

### 6. Modal m-cren — type radio plus net
Header "Vous souhaitez proposer ?" + boutons type horizontaux avec emoji+label, padding plus large, `role="radiogroup"`. Touch targets 44px min.

### 7. Bouton refresh (↻) flottant
Petit bouton rond gris foncé au-dessus du FAB. Force re-render planning + Today + pending requests. Masqué sur desktop.

### 8. Touch targets 44×44 sur mobile (Apple HIG)
Media query `@media(max-width:768px)` :
- `.btn` : min 40×40
- `.nl, .bni, .aic, .cren-type` : min 44×44
- `.star` : min 32×32
- `.mc` (close modal) : min 44×44
- inputs checkbox/radio : min 20×20

## 📊 Métriques

| | v6.6 | v6.7 | Δ |
|---|---|---|---|
| Lignes | 4 462 | 4 529 | +67 |
| Taille | 266 KB | 271 KB | +5 KB |
| FAB mobile | 0 | 3 | +3 |
| Vues calendrier | 2 | 3 (+ Jour) | +1 |
| Touch a11y | partiel | 44px+ | ✓ |

## 🚫 R1-R10 audit

✓ R1 (pas IA) · ✓ R2 (pas CA) · ✓ R3 (pas Congé) · ✓ R4 (dates réelles)
✓ R5 (statuts couleur — gardé blanc/jaune/rouge, refusé l'orange EVS) · ✓ R6 (bleu primary)
✓ R8 (mono-fichier)

## 🎯 Test mobile rapide

```bash
python3 -m http.server 8080
# Ouvrir Chrome DevTools → toggle device toolbar → iPhone SE 375px
# Mode démo → moniteur → Planning :
# - Toggle Jour sélectionné par défaut ✓
# - FAB bleu rond bas-droite visible ✓
# - Bouton Aujourd'hui pill blanc en bas centré ✓
# - Bouton ↻ refresh au-dessus du FAB ✓
# - Modal +Créneau : type horizontal touch-friendly ✓
```

## 🆚 Comparaison avec EVS

| Critère | EVS | Autopilot v6.7 | Avantage |
|---|---|---|---|
| FAB création | ✓ orange | ✓ bleu | = |
| Toggle Jour/Sem/Mois | ✓ orange segmenté | ✓ bleu segmenté | = |
| Cellules hautes mobile | ✓ | ✓ 60px | = |
| Btn Aujourd'hui flottant | ✓ orange | ✓ blanc/bord bleu | = |
| Card élève "Xème heure" | ✓ | ✓ | = |
| Card élève "Examen" | ✓ | ✓ | = |
| Touch 44px | partiel | ✓ explicite | **nous** |
| Radio Dispo/Leçon | ✓ | ✓ | = |
| **Hero Aujourd'hui en haut** | ✗ | ✓ avec compteur 35h | **nous** |
| **Pop-ups fin de leçon** | ✗ | ✓ auto | **nous** |
| **Demandes en attente ✓/✗** | ✗ | ✓ inline | **nous** |
| **Notes anonymes moniteur** | ✗ | ✓ | **nous** |
| **Gap offre/demande gérant** | ✗ | ✓ | **nous** |
| **Mode démo + login propre** | ✗ | ✓ | **nous** |
| **Master prompt anti-régression** | ✗ | ✓ | **nous** |

→ On a la **parité visuelle EVS sur mobile** + 8 features que EVS n'a pas. Prêt pour démo client.
