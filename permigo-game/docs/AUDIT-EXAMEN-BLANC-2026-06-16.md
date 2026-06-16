# Audit — Examen blanc élève (2026-06-16)

> Objectif business : l'examen blanc doit être **si bon qu'une fois goûté, l'élève prend PermiGo+**. C'est le déclencheur de tout le flywheel (élève accroche → achète → l'enseignant touche sa commission → il évangélise).

---

## 1. État des lieux

**`src/pages/eleve/exam-blanc.js` + `src/data/parcours-quiz.js`**
- **5 parcours × 15 questions = 75 questions, 100% statiques** (aucun fetch DB pour les questions ; seules les *tentatives* sont persistées dans `quiz_attempts` pour la ligue théorie).
- Format : 15 Q, **seuil 12/15 (80%)**, **faute éliminatoire = recalé direct** (fidèle au CEPC), 3 options par question, 1 seule bonne réponse.
- UX : écran de sélection (5 cartes parcours) → quiz avec « track » visuel de 15 points, mascotte, feedback immédiat + explication + bannière faute, écran résultats (score / verdict / récap des ratées + gain ligue théorie).

**Banque de questions en base**
- `questions_competence` : **155 questions**, couvrant **31 compétences** (set REMC complet) — **pool séparé**, utilisé par le quiz par compétence (`quiz.js`), PAS par l'examen blanc.

**Usage réel (le signal qui compte)**
- `quiz_attempts` : 176 tentatives au total, mais **1 seul `exam_blanc`**, par **1 seul élève**. → L'examen blanc n'est pas encore le hook. À transformer.

---

## 2. Ce qui est déjà bien (à garder)

- ✅ Tonalité **anti-trauma** (tutoiement, 1 idée par question) — rare et différenciant.
- ✅ **Explications pédagogiques** claires sur chaque question.
- ✅ **Verdict CEPC crédible** : seuil 12/15 + faute éliminatoire = recalé, peu importe le score.
- ✅ Feedback immédiat, track visuel, récap des erreurs en fin.

On ne jette rien — on étend.

---

## 3. Les écarts pour rendre l'examen blanc irrésistible & vendable

### P0 — déclencheurs de conversion
- **A. Visuels / mises en situation.** Les questions sont **100% texte**. Le vrai ETG est **visuel** (on VOIT une scène). C'est le plus gros écart de **crédibilité ET de valeur**. → C'est exactement l'idée « simulation giratoire / priorité à droite » : **scénarios animés en SVG** (vue de dessus, voitures qui bougent, tu choisis la bonne action). 100% faisable en vanilla (même techno que la route SVG de `parcours.js`), zéro 3D, mobile-friendly. **C'est LE différenciateur** vs Rousseau/Ediser (eux = photos figées).
- **B. Mode « Examen officiel ».** Aujourd'hui = 15 Q par situation. Il manque **le vrai blanc : 40 questions, chrono, verdict ≤ 5 fautes** — celui qui dit « t'es prêt ou pas ». C'est le **moment-hook** ("passe le vrai blanc").
- **C. Volume.** 75 Q statiques, c'est **mince pour un produit payant** (la concurrence = des milliers). Fusionner avec les 155 Q DB + industrialiser la production.

### P1 — engagement & rétention
- **D. Chrono par question** (~20 s) → réalisme + tension = addiction saine.
- **E. « Tes points faibles ».** Agréger `quiz_attempts` par tag/compétence → révision ciblée ("tu rates souvent les priorités"). Pédagogie + valeur premium.
- **F. Historique & courbe de progression** → readiness % ("à ce rythme, prêt dans 3 semaines").

### P2 — réalisme & dette
- **G. 4e option + questions multi-réponses** (fidélité ETG).
- **H. Dette code** : `renderQuestion` / `renderNextQuestion` dupliquent ~60 lignes ; questions non centralisées en DB. Refacto à faire au passage du mode Examen officiel.

---

## 4. La frontière gratuit / payant (le paywall)

- **Gratuit (assez pour goûter)** : 1 parcours d'entraînement par jour + **1 examen blanc découverte**.
- **PermiGo+** : parcours **illimités**, **mode Examen officiel illimité**, **scénarios animés**, **« tes points faibles »**, **historique/progression**.
- Paywall posé à un **moment de valeur** (limite quotidienne atteinte, ou juste après un blanc raté : "revois tes erreurs en illimité"). Gate technique = `isActive` (déjà dispo via Stripe). Jamais agressif.

---

## 5. Plan d'implémentation par lots (incrémental, shippable)

| Lot | Contenu | Pourquoi en premier | Dépend du paywall ? |
|---|---|---|---|
| **1 — Socle** | Mode **Examen officiel** : 40 Q chrono, verdict ≤ 5 fautes, en réutilisant les **155 Q DB**. | Fait **monter l'usage** (le hook), additif, zéro risque. | Non |
| **2 — La pépite** | **Scénarios animés / mises en situation** SVG (giratoire, priorité à droite, insertion A86). Démarrer par 3-4 scénarios emblématiques. | **Différenciateur** unique, c'est ce qui fait "wow → j'achète". | Non (mais candidat premium) |
| **3 — Rétention + monétisation** | « Tes points faibles » + historique + **paywall `isActive`**. | Transforme l'usage en abonnements. | Oui |
| **4 — Volume** | Pipeline de questions en DB + 4e option / multi-réponses. | Soutient la valeur perçue sur la durée. | Non |

**Recommandation : démarrer par le Lot 1** (le plus fort levier, fondation des autres, aucun risque produit), puis enchaîner sur le Lot 2 (les scénarios animés) qui est la vraie pépite marketing.

---

## Réponse directe à « peut-on faire des simulations (giratoire, etc.) ? »

**Oui, et c'est même la meilleure idée du lot.** Pas de simulateur 3D (hors sujet, lourd) — mais des **scénarios interactifs animés en SVG** :
- vue de dessus d'un giratoire / carrefour, voitures et vélos qui bougent en CSS/SVG,
- l'élève choisit la **bonne action** (qui passe ? quel clignotant ? quelle voie ?),
- correction animée qui **montre la trajectoire correcte** + le pourquoi.

C'est léger, mobile-first, dans la techno existante, et **personne ne le fait** chez les concurrents. = argument de vente n°1.
