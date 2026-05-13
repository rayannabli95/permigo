# PermiGo — Real Permis Structure (v2)

## COMPÉTENCES ÉLÈVE (20+ items, 5 axes)

### Axe 1: Maîtriser le Véhicule (5 sous-compétences)
```
1.1 - Démarrage & arrêt du moteur
1.2 - Utilisation du volant & direction
1.3 - Maîtrise des pédales (accélérateur, freinage)
1.4 - Utilisation boîte vitesse (manuel/auto)
1.5 - Stationnement en ligne & créneau
```

### Axe 2: Appréhender la Route (5 sous-compétences)
```
2.1 - Lecture des panneaux & signalisation
2.2 - Adaptation à la météo (pluie, neige, nuit)
2.3 - Circulation urbaine (carrefours, feux)
2.4 - Routes nationales (vitesse, dépassement)
2.5 - Autoroute (entrée, sortie, changement voie)
```

### Axe 3: Partager la Route (5 sous-compétences)
```
3.1 - Priorité & cédez-le-passage
3.2 - Distance de sécurité
3.3 - Rétroviseurs & angles morts
3.4 - Respect piétons & cyclistes
3.5 - Communication avec autres usagers
```

### Axe 4: Maintenir sa Concentration (4 sous-compétences)
```
4.1 - Absence distractions (téléphone, passagers)
4.2 - Vigilance sur durée
4.3 - Gestion fatigue & émotions
4.4 - Réaction en cas de danger
```

### Axe 5: Mobilité Citoyenne (4 sous-compétences)
```
5.1 - Économie carburant & éco-conduite
5.2 - Entretien basique du véhicule
5.3 - Assurance & responsabilité
5.4 - Trajets écologiques & transport alternatif
```

**TOTAL: 23 sous-compétences + 5 axes = 28 items dans board élève**

---

## DEUX VUES DIFFÉRENTES

### ÉLÈVE View (Board Vertical Long)
```
Affiche: 23 sous-compétences en chemin linéaire VERTICAL
Layout: Candy Crush board (v6 extended)
  ├─ Axe 1: 5 badges
  ├─ Axe 2: 5 badges
  ├─ Axe 3: 5 badges
  ├─ Axe 4: 4 badges
  └─ Axe 5: 4 badges

Each badge: 
  ├─ LOCKED (grayscale, 🔒)
  ├─ AWAITING (yellow, ⏳)
  └─ UNLOCKED (color, ✓)

Très long scroll (23 éléments alternés gauche/droite)
```

### MONITEUR View (Axes Agrégés)
```
Affiche: 5 axes principaux seulement (simpler)
Layout: Card grid (v4-style simple)
  ├─ Card 1: "Maîtriser le Véhicule" 
  │   └─ Progress: 3/5 sous-compétences validées
  ├─ Card 2: "Appréhender la Route"
  │   └─ Progress: 2/5
  ├─ Card 3: "Partager la Route"
  │   └─ Progress: 4/5
  ├─ Card 4: "Maintenir Concentration"
  │   └─ Progress: 1/4
  └─ Card 5: "Mobilité Citoyenne"
      └─ Progress: 0/4

Click on axis card → see 5 sous-compétences details + validate buttons
```

---

## DATA STRUCTURE (Supabase)

### Table: competences
```
id | axe_id | name | description | order
-----------------------------------------
1  | 1      | Démarrage & arrêt | ... | 1
2  | 1      | Volant & direction | ... | 2
...
23 | 5      | Transport alternatif | ... | 23

axes (5 items)
id | name | color | order
---------------------------
1  | Maîtriser le Véhicule | #FF6B6B | 1
2  | Appréhender la Route | #25D9D9 | 2
3  | Partager la Route | #FFE066 | 3
4  | Maintenir Concentration | #D7A3FF | 4
5  | Mobilité Citoyenne | #95E1D3 | 5
```

### Table: eleve_competences (progress)
```
id | eleve_id | competence_id | status | validated_by_moniteur | validated_at
--------
1  | 1        | 1             | unlocked | true | 2026-05-01
2  | 1        | 2             | locked | false | null
...
```

---

## UI CHANGES FROM v1 → v2

### Élève View
```
BEFORE: 6 items in 2-col grid (v5)
AFTER: 23 items in vertical board (v6 extended)

Same look, just MUCH LONGER scroll
- Colors by axe (5 gradient colors)
- Checkmarks/locks consistent
- Alternating left/right layout
- Footer: "X/23 compétences débloquées"
```

### Moniteur View
```
BEFORE: 6 items in grid (v4)
AFTER: 5 axes cards with progress bars

Card click → modal showing 5 sous-compétences
- Each sous-compétence has "Valider" button
- Moniteur validates = élève sees unlock on their board
```

---

## VALIDATION FLOW (Unchanged Logic)

```
Élève completes leçons for "1.1 - Démarrage & arrêt"
├─ System calculates readiness
├─ Élève sees "Prêt pour validation" status

Moniteur opens "Maîtriser le Véhicule" card
├─ Sees "1.1 - Démarrage & arrêt" = AWAITING
├─ Clicks "Valider 1.1"
├─ Dialog confirms
└─ Updates DB: validated_by_moniteur = true

Élève sees instant unlock
├─ Badge 1.1 → color + ✓
├─ Animation plays
└─ Progress bar updates: "1/23"
```

---

## FINAL CHECKLIST

- [ ] 23 compétences names correct?
- [ ] 5 axes grouping correct?
- [ ] Élève view (long vertical board) OK?
- [ ] Moniteur view (5 axes cards with modal) OK?
- [ ] Colors by axe consistent?
- [ ] Validation flow unchanged?

Once approved → update HTML templates & implement Phase 1 static, then dynamic Supabase.
