# PermiGo Game — Côté Moniteur · Vision V3

_Source : conversation Rayan 2026-05-16_

---

## 🎯 Vision pitch & stratégie

### Positionnement

> **"Le GitHub des moniteurs — un outil de carrière qui se trouve être addictif."**

PermiGo côté moniteur n'est PAS une app de gamification. C'est un **outil de carrière professionnel** qui rend chaque validation REMC visible, mesurable et valorisable — avec une couche XP/progression par-dessus ce qui existe déjà, sans changer le geste métier.

Le ton est celui de **Linear, pas de Duolingo**. Sérieux, sobre, utile. L'addiction vient de la progression visible, pas des confettis.

### Les 3 règles d'or

1. **L'XP vient toujours d'une vraie action métier.** Pas de bonus connexion, pas de gemmes, pas de coffres aléatoires.
2. **La compétition se segmente.** Jamais de classement national brut. Ligues, cohortes, comparatifs relatifs — toujours avec opt-in explicite.
3. **Les récompenses sont utiles.** Monter en niveau = débloquer un outil, un export, une stat. Jamais un skin ou un badge cosmétique.

### 8 antipatterns à éviter absolument

1. **Pas de mascottes, confettis enfantins, ton "Bravo champion"** — le moniteur est un professionnel adulte, pas un collégien sur Duolingo
2. **Pas de monnaie virtuelle** (gemmes, coffres) — ça infantilise et dilue le sens de l'XP
3. **Pas de leaderboard global brut** — toujours percentile + cohorte homogène, jamais "tu es 247e sur 3000"
4. **Pas de streak punitif** — jamais "tu vas perdre ton streak", jamais de notif culpabilisante ; le streak est un indicateur, pas une menace
5. **Pas de récompense pour vitesse de validation** — incite à bâcler ; l'XP récompense le geste métier, pas la rapidité
6. **Pas de surveillance managériale** — le gérant voit des agrégats d'auto-école, jamais les stats nominatives d'un moniteur individuel sans son consentement
7. **Pas de notif agressive** — max 1 push/jour, ton factuel ("5 validations aujourd'hui"), jamais émotionnel ("ton école compte sur toi !")
8. **Pas de pay-to-win** — la monétisation est un abonnement auto-école ; aucune feature ne s'achète à la carte par le moniteur

### Roadmap 4 phases

| Phase | Nom | Durée | Focus |
|-------|-----|-------|-------|
| **MVP** | Spark | mois 0-3 | XP + niveaux + streak pro + classement intra-école |
| **V2** | Social | mois 3-9 | Ligues hebdo + quêtes mensuelles + kudos d'agence + saisons |
| **V3** | National | mois 9-18 | Classement national opt-in + score WCA + coef difficulté + Permigo Wrapped |
| **V4** | Expert systems | mois 18+ | Coef difficulté ML + score mentorat + marketplace cross-école + Permigo Cup |

### KPI cible MVP

| Métrique | Cible | Définition |
|----------|-------|------------|
| **DAU/MAU** | > 40% | Moniteurs actifs chaque jour / actifs ce mois |
| Validation rate | > 80% | % de leçons avec ≥1 compétence validée |
| Streak 7j | > 30% | % de moniteurs avec streak ≥ 7j |
| XP gainé/semaine | > 200 XP | Proxy d'engagement réel |

---

---

## Annexe — Implémentation V3+ (détail technique)

> _Cette section détaille l'implémentation complète prévue à partir de V3. Le MVP suit uniquement la "Roadmap 4 phases" ci-dessus._

---

## Les 5 Principes à Graver

1. **Ne jamais agréger ce qui n'est pas comparable**
2. **Le mérite suit le travail, pas la conclusion**
3. **L'incertitude est une info, pas un bruit**
4. **La transparence doit être asymétrique**
5. **Tout signal manipulable doit être audité**

---

## 1. L'Idée en une Phrase

Transformer chaque clic de validation REMC en moment de jeu pour le moniteur, sans changer son geste actuel, juste en ajoutant une couche XP/carrière par-dessus ce qui existe déjà.

---

## 2. Les 3 Règles d'Or

1. **L'XP vient toujours d'une vraie action métier.** Pas de bonus connexion, pas de gemmes, pas de coffres.
2. **La compétition se segmente.** Pas de classement national brut. Des ligues, des cohortes, des comparatifs relatifs.
3. **Les récompenses sont utiles.** Monter en niveau = débloquer un template, des stats, des outils. Pas des skins.

---

## 3. Ce qui Existe Déjà dans PermiGo Game

- 31 sous-compétences REMC (C1a → C4g)
- 3 niveaux visuels : 🔴 À travailler / 🟠 En progression / 🟢 Acquis
- Trophées élève qui s'animent quand une compétence passe 🟢
- 4 blocs leçon : compétences travaillées, vu pendant, à revoir, commentaire libre
- Commentaires privés moniteur

---

## 4. Ce qu'il Faut Ajouter Côté Moniteur

### A. Barème XP par action métier

| Action | XP | Fréquence |
|--------|-----|-----------|
| Noter une leçon | 10 | Quotidien |
| Annoter qualitativement | +5 | Bonus |
| Valider une sous-compétence REMC | 25 | Quotidien |
| Passage C1→C2 ou C2→C3 | 100 | Hebdo |
| Passage C3→C4 | 150 | Mensuel |
| Examen blanc noté | 40 | Hebdo |
| Réussite au permis (1er coup) | 500 | Le jackpot |
| Réussite au permis (2e+) | 300 | — |
| Bilan pédagogique mensuel | 75 | Mensuel |

### B. 50 niveaux avec titres pros

| Niveaux | Titre |
|---------|-------|
| 1-5 | Moniteur en route |
| 6-10 | Moniteur confirmé |
| 11-20 | Enseignant chevronné |
| 21-30 | Référent pédagogique |
| 31-40 | Maître enseignant |
| 41-50 | Expert REMC |

### C. Déblocages utiles (jamais cosmétiques)

- **Niveau 5** → Export PDF livret personnalisé
- **Niveau 10** → Stats avancées sur ses élèves
- **Niveau 15** → Templates de bilan pédagogique
- **Niveau 20** → Mode Préparation examen enrichi
- **Niveau 25** → Analytics comparatives vs cohorte nationale
- **Badge Maître REMC** → Modules formation continue
- **Cercle Or** → Profil top moniteur mis en avant aux élèves

### D. Streak professionnel adulte

- Compteur jours consécutifs avec journée complète
- Dimanche neutre (auto-écoles fermées)
- Mode congés (vacances scolaires en pause)
- 1 jour de récup/mois de droit
- **AUCUNE notif culpabilisante** (principe RGPD UX)

---

## 5. Les 4 Horizons Temporels

### Quotidien — La Tournée du soir

Notif 19h factuelle. 5 min pour valider la journée. Mini-feedback dopaminergique au moment du clic 🟢 : toast "+25 XP · Léa a débloqué le trophée Maîtrise du véhicule".

### Hebdomadaire — Les Ligues

7 ligues : Apprenti → Confirmé → Expérimenté → Référent → Maître → Maître d'Excellence → Cercle Or. Cohortes de ~30 monos à activité comparable. Reset dimanche 23h59. Top 7 montent, bottom 5 descendent. Opt-out possible.

### Mensuel — 3 quêtes

- Quête perso auto-calibrée ("4 élèves au palier C3 ce mois")
- Quête d'agence collective ("200 validations C2 ensemble")
- Quête nationale Permigo ("100 000 validations REMC tous monos confondus")

### Trimestriel — Saisons

4 saisons/an avec thématique métier. Reset des ligues. Trophée trimestriel exportable LinkedIn.

### Annuel — Permigo Wrapped

15 décembre, 12 cartes format story. "Tu as accompagné 47 élèves. 79.5% de réussite vs 58% moyenne nationale. Top 8% national." Exportable, partageable, viral.

---

## 6. Le Score Moniteur — 4 Composantes

| Composante | Poids | Mesure |
|------------|-------|--------|
| S1 Production | 30% | XP cumulée sur 90 jours pondérée par difficulté |
| S2 Efficience pédago | 30% | Compétences validées par heure, normalisée |
| S3 Réussite finale | 25% | Taux de réussite permis, attribution WCA |
| S4 Satisfaction élève | 15% | Note avis vérifiés (V2) |

Score affiché public = Score brut moins l'incertitude statistique (modèle TrueSkill). Plus tu accumules d'élèves, plus tu peux monter.

---

## 7. Attribution du Mérite — Modèle WCA

Quand plusieurs monos contribuent au même élève qui réussit son permis :

```
Poids mono = 0,6 × (compétences mono ÷ total) + 0,4 × (heures mono ÷ total)
```

**Exemple** : élève Karim, 21 compétences, 30h
- Mono A : 3 compétences, 8h → poids 0,19 → reçoit ~250 XP
- Mono B : 18 compétences, 22h → poids 0,81 → reçoit ~1050 XP

**Garde-fou anti-hijack** : pour toucher de l'XP, il faut min 2 compétences ET 4h avec l'élève. Sinon poids = 0.

---

## 8. Coefficient de Difficulté Élève

Coefficient 1,0 à 1,75 basé sur 3 signaux légaux uniquement :

- 📚 **Reprise** (élève vient d'un échec ailleurs) : +15%
- ⏱️ **Vitesse d'acquisition lente** : +30% max
- ❌ **Échecs au permis précédents** : +10% par échec

Jamais touché : origine, CSP, handicap, religion, situation familiale (RGPD données sensibles).

Bonus mix anti cherry-picking : +10% pour ceux qui acceptent un portefeuille varié.

---

## 9. Classement Transparent

### Intra-école
- Affichage du segment (top 3 + voisinage du mono)
- Pas de bottom nommé publiquement
- Catégories multiples : régularité, élèves difficiles, C3...

### National
- Top 100 visible, opt-in nominatif
- Au-delà : percentile relatif ("Top 12% sur Régularité")
- 3 ligues d'auto-écoles : Indépendants / Agence / Réseau

### 2 classements parallèles
- **Top Performance** : taux de réussite (fenêtre 6 mois, min 20 élèves)
- **Top Régularité** : leçons notées sous 48h, livrets à jour, validations sur 90 jours

---

## 10. Anti-Triche — 8 Scénarios Anticipés

| Triche | Parade |
|--------|--------|
| Cherry-picking | Coef difficulté + bonus mix |
| Last-touch hijack | WCA + seuils mini (2 comp, 4h) |
| Validation prématurée | Co-signature élève sous 7j |
| Rétro-validation cyclique | Gel XP dès 2e validation |
| Heures gonflées | Badge moniteur + GPS véhicule |
| Coordination interne | Détection transferts J-30 |
| Review bombing | Détection vélocité + sémantique |
| Faux élèves | CNI + selfie + cross-check NEPH |

Seuils statistiques : 3σ = soft flag, 4σ = hard flag automatique.

---

## 11. Système Social Intra-École

- Mur d'agence en temps réel ("Karim a fait passer Léa en C3" + bouton kudos 👏)
- Quête d'agence collective mensuelle
- Tableau de bord gérant = agrégats uniquement, jamais nominatif

---

## 12. Couche Gamification sur la Validation Existante

À brancher sur l'interface validation REMC actuelle :

### A. Mini-feedback dopaminergique
Au clic 🟢, toast latéral : "+25 XP · Léa a débloqué le trophée Maîtrise du véhicule"

### B. Miroir moniteur du trophée élève
Compteur "Tu as fait franchir C1 à 12 élèves cette année" — tableau de chasse du moniteur

### C. Le "Référent C3"
Moniteur qui valide beaucoup de C3 (la plus dure) devient "Référent C3" visible par les collègues

---

## 13. Roadmap

### MVP — mois 0-3 (V1 en cours)
- Barème XP + 50 niveaux + 20 badges
- Carnet d'élèves
- Streak pro + notif soir
- WCA simplifié 50/50
- Classement intra-école par segment
- Anti-triche couche 1

### V2 — mois 3-9
- Ligues hebdo
- Kudos + fil d'agence
- Quêtes mensuelles
- Saisons trimestrielles
- WCA pondéré 60/40
- Avis élèves vérifiés (S4)
- Classement national opt-in
- Anti-triche couches 2+3

### V3 — mois 9-18
- Coef difficulté via ML
- Score mentorat
- Marketplace cross-école
- Profil public LinkedIn exportable
- Permigo Cup annuelle

---

## 14. Conformité RGPD et Droit du Travail

- Information préalable obligatoire moniteur (Code travail L.121-7)
- Opt-in moniteur ET opt-in auto-école pour classement national nominatif
- Export PDF/CSV complet du dossier sur demande sous 1 mois
- Aucune sanction RH sur seule base du score Permigo
- Mécanisme d'appel humain sous 7 jours
- Durée conservation 2 ans après fin de contrat

---

## Notes de Mise en Garde

### Risques Produit Identifiés

| Risque | Niveau | Mitigation |
|--------|--------|------------|
| Gaming du système (cherry-picking) | Élevé | Coef difficulté + bonus mix V1 |
| Résistance moniteurs seniors | Moyen | Opt-out ligues, pas de ranking bottom public |
| Pression RH abusive | Élevé | Mention explicite "pas de sanction sur score seul" |
| Biais légaux dans coef difficulté | Critique | Uniquement 3 signaux légaux listés |
| Surcharge cognitive moniteur | Moyen | UX "1 action = 1 toast" — jamais plusieurs notifs |

### Conditions de Déploiement

1. Validation juridique du coefficient difficulté par avocat droit du travail
2. Briefing DRH auto-écoles partenaires avant activation ligues
3. Opt-in explicite moniteur (pas opt-out) pour classement nominatif national
4. A/B test streak pro sur cohorte de 20 monos volontaires avant généralisation
