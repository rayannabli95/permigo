# Planning moniteur — règles métier (FR simple)

> Fichier de référence pour comprendre **comment fonctionne le planning**.
> Toute la logique vit dans `src/services/planning.js`.
> Les pages UI (planning.js, mes-eleves.js, etc.) **appellent ce service** — elles ne re-codent jamais les règles.

---

## 🎯 Ce que fait le planning

Le moniteur ouvre des **créneaux dispos**. Les élèves les **réservent**.
Le moniteur **confirme** la réservation, **donne la leçon**, **remplit le livret** après.
S'il faut annuler : motif obligatoire, message si nécessaire, et on garde la traçabilité.

---

## 📦 Modèle de données

| Table | Rôle | Champs clés ajoutés |
|---|---|---|
| `events` | LA table qui contient TOUT : dispos, leçons, perso, absences | `motif_annulation`, `message_eleve`, `livret_rempli`, `numero_heure_eleve`, `competences_acquises_pct` |
| `lieux` | Points de rendez-vous du moniteur | `duree_trajet_min` (défaut 15) |
| `profiles` | Moniteurs + élèves | `boite_vehicule` (moniteur) · `boite_apprentissage` (élève) |

**Statuts d'un event (`t`)** :
- `dispo` → créneau ouvert, un élève peut réserver
- `pend` → réservation en attente de confirmation
- `conf` → leçon confirmée
- `perso` → bloc perso du moniteur
- `absence` → moniteur indisponible (vacances, maladie)

---

## ✅ Règles dures (bloquantes)

### R1 — Pas de chevauchement
Deux events du même moniteur ne peuvent jamais se superposer.
→ `checkChevauchement()`

### R3 — Compat boîte véhicule
Si l'élève apprend en boîte **manuelle**, on ne peut PAS lui assigner un moniteur **auto seulement**.
Si `boite_vehicule = 'both'`, OK pour les deux.
→ `checkVehicule()`

### R5 — Limite 8h conduite par jour
**Bloquant à 8h** · Override possible côté UI avec confirmation.
**Warning à 6h** (juste un message, on laisse passer).
→ `checkLimiteJour()`

---

## ⚠️ Règles d'alerte (warnings, pas bloquant)

### R4 — Buffer trajet
Entre 2 leçons à des **lieux différents**, prévoir au moins **15 minutes**.
Si moins → warning à l'écran, mais le moniteur peut quand même créer.
→ `checkBufferTrajet()`

### R6 — Préavis annulation
3 niveaux selon le délai avant la leçon :
- ≥ 48h → annulation **libre**, pas de friction
- 4h–48h → annulation **tardive** : motif obligatoire, message si "Autre"
- < 4h → **jour J** : alerte rouge, motif obligatoire, l'élève est notifié
→ `checkPreavisAnnulation()`

---

## 🔢 Auto-incrémentation

### R10 — Numéro d'heure de l'élève
Chaque leçon confirmée d'un élève reçoit un numéro auto : 1ère heure, 2ème heure, etc.
Calculé au moment de la création (`getNumeroHeureSuivant()`).
Affiché dans l'UI : "C'est sa 3ème heure".

---

## 📋 Motifs d'annulation (liste fermée)

Le moniteur doit choisir parmi :
1. Priorité autre élève
2. Problème véhicule
3. RDV inaccessible
4. Autre plateforme
5. Erreur planning
6. Demande élève
7. Santé
8. Urgence perso
9. Documents expirés
10. **Autre** — déclenche l'obligation d'un message libre

---

## 🔄 Workflows

### W1 — Créer une dispo / une leçon
```
createDispo({ moniteurId, dateIso, h, dur, lieu })
createLecon({ moniteurId, eleveId, dateIso, h, dur, lieu, override? })
```
Toutes les validations tournent automatiquement. Si une règle dure casse → retour `ok: false` avec la liste des erreurs. Les warnings (buffer, > 6h) sont retournés à part.

### W2 — Modifier une leçon
```
modifyLecon({ leconId, changes: { dateIso?, h?, dur?, lieu? } })
```
On exclut l'event lui-même des checks chevauchement et limite jour.
L'élève n'est **PAS modifiable** — pour changer d'élève, on annule et on recrée.

### W3 — Annuler une leçon
```
cancelLecon({ leconId, motif, message?, garderDispo: bool })
```
- `garderDispo = true` → le créneau redevient `dispo` (réservable par un autre élève)
- `garderDispo = false` → soft delete, le créneau disparaît

Le service retourne aussi le **niveau de préavis** (`libre` / `tardive` / `jour_j`) pour que l'UI affiche le bon message.

### W4 — Confirmer une leçon en attente
```
confirmLecon({ leconId })   // pend → conf
```

### W5 — Marquer le livret rempli après la leçon
```
markLivretFilled({ leconId, competencesPct })
```

---

## 🚫 Ce qui n'est PAS dans le scope

- ❌ Facturation, rémunération, paiements, factures PDF
- ❌ Examens, attribution de places, quota agréments d'État
- ❌ Stripe, abonnements, forfaits payants
- ❌ Liens partageables Calendly (push)
- ❌ Drag-and-drop sur le planning (UI — viendra plus tard)

→ Ces sujets reviendront dans d'autres slices une fois les agréments d'État branchés.

---

## 🔌 Comment utiliser le service depuis une page

```js
import { createLecon, MOTIFS_ANNULATION } from '@/services/planning.js';

const result = await createLecon({
  moniteurId: me.id,
  monNom: me.nom,
  eleveId: eleveSelected.id,
  eleveNom: eleveSelected.nom,
  dateIso: '2026-05-15',
  h: '14:00',
  dur: 2,
  lieu: 'Nanterre · Mairie',
});

if (!result.ok) {
  // Afficher les erreurs (R1, R3, R5)
  toast(result.errors[0], 'error');
} else {
  if (result.warnings.length) {
    // Afficher juste un avertissement (R4, R5 < 6h)
    toast(result.warnings[0], 'info');
  }
  toast(`Leçon créée — c'est la ${result.numero}ème heure de ${eleveSelected.nom}`, 'success');
}
```

---

## 📍 Prochaines étapes possibles

Quand on aura besoin de plus :
- **Dispos récurrentes** (style Calendly : "tous les mardis 14-18h pendant 8 semaines")
- **Liste d'attente** (si créneau saute → propose en cascade aux élèves en attente)
- **No-show tracking** (compteur d'absences par élève)
- **Drag-and-drop** sur le planning hebdo avec recalcul automatique des buffers
- **Notifications push J-1 18h** + 2h avant le créneau
- **Mode hors-ligne** (queue des actions, sync à la reconnexion)
