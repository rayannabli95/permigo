# 🎁 Grille des récompenses PermiGo — source unique de vérité

> Toutes les récompenses XP / Gemmes / Titres / Fonds permis / Trophées.
> Mis à jour le 2026-05-18 après audit.

---

## 1. XP (Expérience)

L'XP fait grimper le niveau élève (1 → 8) et la ligue (Bronze → Champion).

### Sources d'XP côté élève (DB `profiles.xp`)

| Action | XP gagné | Quand |
|---|---|---|
| Compétence validée par moniteur | **+100 XP** | À chaque validation (`statut = 'acquis'`) |
| Quiz post-validation réussi (≥70%) | **+50 XP** | À la fin du quiz |
| Quiz consolidation réussi (≥70%) | **+30 XP** | À la fin du quiz |
| Quiz parfait (100%) | **+20 XP bonus** | En plus du XP quiz |
| Coffre de Bronze ouvert (Monde 1) | **+200 XP** | À l'ouverture |
| Coffre d'Argent ouvert (Monde 2) | **+400 XP** | À l'ouverture |
| Coffre d'Or ouvert (Monde 3) | **+700 XP** | À l'ouverture |
| Coffre Légendaire ouvert (Monde 4) | **+1200 XP** | À l'ouverture |
| Streak 7j (coffre `streak_7`) | **+150 XP** | À l'ouverture du coffre |
| Streak 14j (coffre `streak_14`) | **+350 XP** | À l'ouverture du coffre |
| Streak 30j (coffre `streak_30`) | **+800 XP** | À l'ouverture du coffre |

### Niveaux élève (XP cumulé)

| Niveau | XP requis | Nom |
|---|---|---|
| 1 | 0 | Débutant |
| 2 | 100 | Apprenti |
| 3 | 300 | Conducteur |
| 4 | 600 | Confirmé |
| 5 | 1000 | Expert |
| 6 | 1500 | Pro |
| 7 | 2200 | As du Volant |
| 8 | 3000 | Champion |

### Ligues (basées sur XP)

| Ligue | XP min | Emoji |
|---|---|---|
| Bronze | 0 | 🥉 |
| Argent | 500 | 🥈 |
| Or | 1 500 | 🥇 |
| Platine | 2 500 | 💎 |
| Diamant | 3 000 | 💠 |
| Champion | 3 100 | 👑 |

---

## 2. Gemmes 💎

Les gemmes servent à acheter des items dans la boutique (avatars, fonds permis, thèmes).

### Sources de gemmes (localStorage `pg-gemmes`)

| Action | Gemmes | Quand |
|---|---|---|
| Coffre de Bronze (Monde 1) | **+50 💎** | À l'ouverture |
| Coffre d'Argent (Monde 2) | **+100 💎** | À l'ouverture |
| Coffre d'Or (Monde 3) | **+175 💎** | À l'ouverture |
| Coffre Légendaire (Monde 4) | **+300 💎** | À l'ouverture |
| Streak 7j | **+30 💎** | À l'ouverture du coffre |
| Streak 14j | **+80 💎** | À l'ouverture du coffre |
| Streak 30j | **+200 💎** | À l'ouverture du coffre |
| Quiz parfait (coffre `perfect_quiz`) | **+25 💎** | À l'ouverture du coffre |

⚠️ **Fix 2026-05-18** : avant ce fix, chaque ouverture de coffre ajoutait +50 gemmes en plus du tier. Maintenant les gemmes du tier sont créditées **une seule fois** par la modal coffre. Aligné avec ce qui s'affiche à l'écran.

---

## 3. Titres (cosmétique permanent)

Affichés sur le profil élève après ouverture du coffre.

| Source | Titre |
|---|---|
| Coffre Monde 1 | "Maître Maîtriser le véhicule" |
| Coffre Monde 2 | "Maître Conduire en environnement simple" |
| Coffre Monde 3 | "Maître Trafic urbain" |
| Coffre Monde 4 | "Maître Autoroute et conduite avancée" |
| Streak 7j | "Persévérant" |
| Streak 14j | "Constant" |
| Streak 30j | "Inarrêtable" |
| Quiz parfait | "Précision" |

---

## 4. Fonds Permis (visuel carte permis virtuel)

3 fonds débloqués progressivement selon le nombre de compétences validées.

| Fond | Compétences requises | Effet visuel |
|---|---|---|
| Mesh (défaut) | 0–9 comp | Gradient indigo léger |
| Route | 10–19 comp | Route sinueuse animée |
| Holographic | 20+ comp | Hue-rotate + saturate animé (premium) |

Le déblocage est automatique (lecture côté frontend dans `permis-card.js`). Toast "Nouveau fond débloqué" affiché 1 fois par fond via localStorage.

---

## 5. Trophées (cosmétique permanent sur page Trophées)

7 trophées au total (après suppression de `eco_driver`).

| ID | Nom | Condition | Rareté | XP bonus* |
|---|---|---|---|---|
| `first_step` | Premier pas | 1ʳᵉ compétence validée | Commun | +25 |
| `ten_comps` | Dix au compteur | 10 compétences validées | Commun | +50 |
| `streak_7` | Une semaine en feu | Streak ≥7 jours | Commun | +60 |
| `perfect_quiz` | Quiz parfait | Quiz à 100% | Commun | +75 |
| `night_rider` | Pilote de Nuit | 1 validation entre 21h et 6h heure locale | Rare | +80 |
| `c1_complete` | Maître du Monde 1 | 9/9 sous-compétences Monde 1 | Rare | +100 |
| `permit_ready` | Prêt pour l'examen | 28/31 compétences validées | Légendaire | +200 |

*L'XP bonus trophée n'est pas encore câblé en DB (chantier futur).

---

## 6. Récompenses moniteur (côté enseignant)

| Action | Récompense |
|---|---|
| Log session via FAB | **+10 XP moniteur** (toast affiché, DB pas encore câblé) |
| Session confirmée par élève | **+5 XP moniteur bonus** |
| Validation compétence | **+15 XP moniteur** |
| Streak Pro 7j+ | Visible dans le profil |

### Ranking moniteur mensuel (4 dimensions)

Score = 40% heures confirmées + 25% validations + 20% diversité élèves + 15% jours actifs.

---

## 7. Récap visuel "qu'est-ce que je gagne ?"

Pour l'élève (la dopamine principale) :

```
Valider 1 comp    → +100 XP
Quiz post-val OK  → +50 XP (ou +70 si 100%)
Streak 7j         → coffre +150 XP, +30 gemmes, titre
Compléter Monde 1 → coffre +200 XP, +50 gemmes, titre + trophée
Compléter Monde 4 → coffre +1200 XP, +300 gemmes, titre + trophée légendaire
28/31 comp        → trophée "Prêt pour l'examen" + carte permis holographic
```

---

## 8. Boutique (consommation des gemmes)

| Item | Coût |
|---|---|
| Avatar bonus | 100 💎 |
| Thème accent rose/vert/cyan/rouge | 150 💎 |
| Fond permis (alternatif) | 200 💎 |
| Streak freeze (geler 1 jour) | 50 💎 — *à câbler* |

---

## 9. Hors-scope (volontairement)

- ❌ Pas d'achat IRL (jeu pédagogique B2B, pas de paiement élève)
- ❌ Pas de boost payant
- ❌ Pas de pubs

---

## TODO récompenses pas encore câblées

1. Crédit XP DB côté élève à chaque validation/quiz (actuellement seulement coffres)
2. Crédit XP DB côté moniteur (toasts cosmétiques pour l'instant)
3. XP bonus trophées (montants définis mais pas crédités)
4. Boutique : achat fonctionnel (purchase_item RPC à créer)
5. Streak freeze gemmes (idée listée, pas implémentée)
