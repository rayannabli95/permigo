# PermiGo — Implementation Blueprint

## 1. ARCHITECTURE SYSTÈME

### Data Model (Supabase)
```
competences (6 shared skills across app)
├─ id, name, description, order
└─ Shared between élève & moniteur views

eleve_competences (progress tracking)
├─ eleve_id, competence_id, status (locked/unlocked)
├─ validated_by_moniteur (boolean) ← KEY
├─ validated_at (timestamp)
└─ Only unlocks when moniteur validates

```

### Authentication Routes
```
Élève (role='eleve')
├─ Dashboard → Candy Crush board (v6)
├─ Can view progress (locked until moniteur validates)
└─ Cannot validate self

Moniteur (role='moniteur')
├─ Dashboard → Simple card view (v4-style)
├─ Can view all élèves
├─ CAN validate competences (toggles unlock for élève)
└─ Audit trail of validations
```

---

## 2. UNIFIED DESIGN SYSTEM

### Colors (Consistent Across Both Views)
```
Compétence 1: #FF6B6B (Coral)
Compétence 2: #25D9D9 (Teal)
Compétence 3: #FFE066 (Yellow)
Compétence 4: #D7A3FF (Purple)
Compétence 5: #95E1D3 (Mint)
Compétence 6: #FFA500 (Orange)

Locked: #E8EBF0 (Gray)
Unlocked: #4CAF50 (Green checkmark)
```

### Typography (Both Views)
```
Brand: "PermiGo" → Gradient text (multi-color)
Headings: System font, 700 weight, 18-20px
Body: System font, 400 weight, 13-14px
Labels: System font, 600 weight, 12px (UPPERCASE)
```

### Competence Names (Exact Same Across Both)
```
1. Maître de la Ville        (circulation urbaine)
2. As de la Route            (route nationale)
3. Expert du Stationnement   (parking & créneau)
4. Conducteur Confiant       (confiance générale)
5. Sans Défaut               (5 étoiles × 5 leçons)
6. Champion de la Route      (30h + 0 absence + 4.5★)
```

---

## 3. TWO VIEWS — COHERENT DESIGN

### ÉLÈVE View (Candy Crush Board - v6)
```
Header: "PermiGo 🚗" (gradient) + "Votre route..."
Body: Vertical scrollable board
  └─ Path line connecting 6 competences
  └─ Badges: LOCKED (grayscale, 🔒) → UNLOCKED (color, ✓)
  └─ Labels: name + unlock condition
Footer: "X/6 compétences débloquées"
Interaction: Read-only (wait for moniteur validation)
```

### MONITEUR View (Simple Cards - v4-inspired)
```
Header: "PermiGo Coach" + student selector
Body: Simple 2-col grid of competence cards
  └─ Card shows: Icon + Name + Status badge
  └─ Status: LOCKED 🔒 | AWAITING ⏳ | VALIDATED ✅
  └─ Button: "Valider" (only if ready)
Footer: Audit trail (who validated what, when)
Interaction: Can click "Valider" → updates élève view instantly
```

**KEY**: Same competence names, same colors, diff layout (élève = vertical/playful, moniteur = grid/utilitarian)

---

## 4. USER FLOWS

### Flow A: Élève Progression
```
1. Élève sees competence LOCKED (grayscale badge, 🔒, gray border)
2. Élève completes leçons for that competence
3. System calculates: "Ready to validate" (5/5 stars, etc.)
4. Élève sees AWAITING (yellow badge, ⏳, dashed border)
5. Moniteur validates on their view
6. Élève sees UNLOCKED (color badge, ✓, solid border) + animation
```

### Flow B: Moniteur Validation
```
1. Moniteur opens dashboard (card grid view)
2. Sees all élèves + their competences
3. Clicks élève card → sees detailed stats
4. If élève ready: "Valider" button enabled
5. Clicks "Valider" → dialog "Confirm validation?"
6. Submits → updates DB (eleve_competences.validated_by_moniteur = true)
7. Moniteur sees checkmark ✅ in grid
8. Élève sees unlock animation on their board
```

---

## 5. FILES TO CREATE

### Phase 1: Core Views (No Backend Yet)
```
✅ index-eleve.html          (Candy Crush board v6 - static demo)
✅ index-moniteur.html       (Simple cards v4 - static demo)
✅ design-system.css         (Shared colors, fonts, spacing)
```

### Phase 2: Supabase Integration
```
⏳ migrations/competences.sql      (table + seed 6 competences)
⏳ migrations/eleve_competences.sql (progress tracking + moniteur validation)
⏳ index-eleve-dynamic.html        (fetch from Supabase, real-time updates)
⏳ index-moniteur-dynamic.html     (fetch all élèves, enable validate button)
```

### Phase 3: Backend Logic (Edge Functions)
```
⏳ functions/validate_competence.ts   (moniteur validation → updates DB)
⏳ functions/get_eleve_progress.ts    (fetch competence status for élève)
⏳ functions/get_moniteur_view.ts     (fetch all élèves for moniteur)
```

---

## 6. COMPETENCE VALIDATION RULES

### When Does Competence Unlock?
```
Admin sets: "eleve_competences.validated_by_moniteur = true"
Trigger: System updates "status = 'unlocked'"
Élève sees: Badge color + checkmark ✓ + animation

Requirements (Examples):
- Maître Ville: 5 urban leçons + avg 4+ stars
- As Route: 1 highway leçon + 4+ stars
- Expert Parking: 3 parking leçons + 4+ stars
- Conducteur Confiant: 3 other competences unlocked
- Sans Défaut: 5 leçons with 5 stars
- Champion: 30h + 0 absences + 4.5+ avg
```

---

## 7. IMPLEMENTATION SEQUENCE

### ✅ Already Done
```
- Design Candy Crush board (v6)
- Design moniteur simple view (v4-style)
- Competence naming finalized
- Color system unified
```

### ⏳ Ready to Do
```
1. Create Supabase schema (competences + eleve_competences tables)
2. Seed 6 competences with exact names
3. Add auth (eleve vs moniteur roles)
4. Build dynamic élève view (fetch + real-time updates on validation)
5. Build dynamic moniteur view (fetch elèves, enable validate button)
6. Wire validation button → Edge Function → DB update
7. Test: moniteur validates → élève sees unlock immediately
8. Deploy to GitHub Pages
```

---

## 8. COHERENCE CHECKLIST

- [x] Same competence names both views
- [x] Same color scheme both views
- [x] Same typography system both views
- [x] Locked/Unlocked states consistent
- [x] Validation flow clear (élève waits → moniteur clicks → élève unlocks)
- [x] Role-based access (élève can't validate self)
- [x] Audit trail (who validated, when)
- [ ] Real-time sync (when moniteur validates, élève sees immediately)

---

## 9. EXAMPLE DATA FLOW

```
Élève clicks: "Je suis prêt pour validation"
├─ Not a button, just status display
└─ Shows "Prêt pour validation" badge

Moniteur opens their view
├─ Sees all élèves in grid
├─ Sees Elyne's "Expert du Stationnement" = AWAITING ⏳
├─ Clicks "Valider" button
└─ Dialog: "Valider Expert du Stationnement pour Elyne?"

Moniteur clicks "Confirmer"
├─ Edge Function: validate_competence(eleve_id, competence_id)
├─ Updates: eleve_competences.validated_by_moniteur = true
├─ Trigger: status changes to 'unlocked'
└─ Realtime broadcast to élève's session

Élève's view updates
├─ Badge changes color (grayscale → coral)
├─ Checkmark ✓ appears with animation
├─ Border changes (dashed gray → solid gold)
└─ Celebration animation plays
```

---

## READY TO IMPLEMENT?

**Validation Checklist:**
- [ ] Competence names approved?
- [ ] Color scheme approved?
- [ ] Two views design approved?
- [ ] Validation flow clear?
- [ ] DB schema makes sense?

Once all ✅, we implement Phase 1 → 2 → 3 sequentially.
