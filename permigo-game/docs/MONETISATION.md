# PermiGo — Modèles économiques (brouillon de réflexion)
*Night session 2026-06-16. À challenger ensemble. Le pitch clients = à faire demain à deux.*

## 0. Où on en est
- **Moniteur** : abonnement self-serve **9,99 €/mois** (Stripe Checkout) — **en place et testé**. C'est la première source de revenu (B2B indé).
- Reste à explorer : **faire payer l'élève** (volume énorme) + **faire gagner de l'argent au moniteur** (alignement + canal d'acquisition).

## 1. Contrainte produit à respecter (CLAUDE.md)
- **Pas de pay-to-win** : ce qu'on vend ne doit JAMAIS donner un avantage de classement ou « acheter » le permis.
- **Pédagogie d'abord** : un paywall élève doit débloquer de la *vraie valeur d'entraînement* (plus de quiz, plus d'examens blancs, analyses), pas du cosmétique creux ni un raccourci.
- **Le moniteur ne doit pas devenir un vendeur** : l'incentive ne doit pas l'inciter à pousser l'achat plutôt qu'à enseigner.
→ Tout modèle ci-dessous est filtré par : *« est-ce que ça aide vraiment à réussir le permis ? »*

## 2. Faire payer l'élève

### Le bon format : freemium + Apple Pay
- **Apple Pay / Google Pay via Stripe** = paiement en **1 tap**, friction quasi nulle → parfait pour un petit récurrent. C'est LE déblocage psychologique pour un jeune.
- **Gratuit** : livret REMC, parcours, 1 quiz/jour, classement, streak (la boucle d'engagement reste gratuite = rétention + bouche-à-oreille).
- **PermiGo+ (payant)** : ce qui fait *réussir plus vite*.

### Pricing — 3 paliers à A/B tester
| Prix | Perception | Pour qui |
|---|---|---|
| **2,99 €/mois** | impulsif, « pourquoi pas » | conversion volume max |
| **4,99 €/mois** | « premium » crédible | **recommandé pour démarrer** — meilleur ARPU sans tuer la conversion |
| **+ option 19,99 € « jusqu'au permis »** (one-shot 4 mois) | engagement, pas d'abo à gérer | ceux qui détestent les abos |

**Ce que débloque PermiGo+** (valeur pédagogique réelle) :
- Examens blancs **illimités** (vs 1-2/sem en gratuit).
- Quiz de **consolidation avancés** + révisions ciblées sur ses points faibles.
- **Analyses perso** : « tes 3 compétences les plus fragiles », courbe de progression.
- Mode **hors-ligne** (réviser dans le métro).
- (Cosmétiques premium en bonus, jamais comme cœur de l'offre.)

**Garde-fou** : aucune de ces features ne change le **classement** ni ne « valide » une compétence (ça reste le moniteur). On vend de l'**entraînement**, pas un avantage.

### Ordre de grandeur (pourquoi c'est gros)
~1 M candidats/an. Apprentissage moyen ~4-6 mois. Si **5 %** paient **4,99 €** pendant **4 mois** → 50 000 × 4 × 4,99 ≈ **1 M€/an**. Même à 2 % de conversion, c'est le plus gros levier de revenu du produit (bien devant le moniteur).

## 3. Faire gagner de l'argent au moniteur

Trois mécaniques, de la plus simple/sûre à la plus lourde :

### A. Parrainage / revenue-share (recommandé, étape 2-3)
- Le moniteur invite ses élèves → si l'élève passe **PermiGo+**, le moniteur touche **20-30 %** du récurrent tant que l'élève paie.
- Effet : le moniteur devient un **canal d'acquisition** aligné — il gagne quand ses élèves s'entraînent plus. Et il a une raison de plus de garder son abo.
- ⚠️ Cadrage charte : ce n'est PAS « le moniteur achète une feature » (interdit) — c'est un **revenu** versé au moniteur. À formuler comme « tes élèves s'équipent, tu es récompensé », jamais « vends à tes élèves ».

### B. Pourboire / « merci » (élève reçu → moniteur)
- À l'obtention du permis, l'élève peut **remercier** son moniteur (don ponctuel, 5/10/20 €). Émotion forte au bon moment (le Hall of Fame qu'on vient de coder est exactement ce moment 🎓).
- Tech : **Stripe Connect** (comptes connectés) pour reverser au moniteur.

### C. Bonus performance
- PermiGo (ou l'auto-école) récompense les moniteurs dont les élèves réussissent — data-driven, vertueux pédagogiquement. Plus tard, demande de la donnée fiable.

### Implication tech/légale (à ne pas sous-estimer)
Verser de l'argent à des moniteurs = **Stripe Connect** → PermiGo devient une **plateforme/marketplace** : KYC des moniteurs, conformité, fiscalité, statut. C'est un vrai chantier — à faire **après** avoir prouvé que l'élève paie. Ne pas mettre la charrue avant les bœufs.

## 4. Séquencement recommandé
1. **Maintenant** : moniteur 9,99 € (fait) → encaisser, prouver la willingness-to-pay.
2. **Étape 2** : **PermiGo+ élève 4,99 €/mois** via Apple Pay (déblocage pédagogique). Le plus gros revenu potentiel, techniquement proche de ce qu'on a déjà (même Stripe, on réutilise checkout/webhook avec un 2ᵉ prix + un paywall `isActive` côté élève).
3. **Étape 3** : **parrainage moniteur** (revenue-share léger) une fois qu'il y a du volume d'élèves payants → le moniteur devient growth engine.
4. **Étape 4 (plus tard)** : Stripe Connect (pourboires / reversements) si le marché le demande.

## 5. Risques & garde-fous
- **Cannibalisation** : si le gratuit est trop riche, personne ne paie. Si trop pauvre, on tue la rétention. → le gratuit garde la *boucle d'habitude*, le payant l'*intensité d'entraînement*.
- **Perception « payer pour le permis »** : bien séparer « outil d'entraînement payant » de « le permis ». Wording prudent.
- **Conformité revenue-share** : statut plateforme = obligations. À cadrer avec un comptable avant l'étape 3-4.

## 6. Graine de pitch clients (à développer demain ensemble)
- **Au patron d'auto-école** : « différenciez-vous (suivi numérique RGPD), réduisez l'abandon, et vos élèves s'entraînent 2× plus ».
- **Au moniteur indé** : « ayez l'air pro, gagnez du temps de paperasse, et bientôt : touchez un revenu quand vos élèves s'équipent ».
- **À l'élève** : « réussis ton permis plus vite — entraîne-toi quand tu veux, vois exactement quoi réviser ».

> **TL;DR** : le moniteur paie déjà. Le **vrai jackpot, c'est l'élève** (volume × Apple Pay = friction zéro). Et le **revenue-share moniteur** transforme chaque enseignant en commercial aligné. Mais on avance par étapes, et chaque € vendu doit aider à réussir le permis — sinon on dégage (charte).
