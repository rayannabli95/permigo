# FABLE MASTER PROMPT — Générateur de questions pédagogiques REMC haute qualité

## Mission
Créer des **questions d'examen permis** qui répliquent et dépassent la qualité des vrais examens DREAL (direction régionale de l'environnement, de l'aménagement et du logement), avec validation critique et itération automatique.

## Contraintes métier (non-négociables)
- ✅ **Arrêté 13/05/2013** : REMC officiellement reconnu (31 compétences)
- ✅ **Arrêté 29/07/2013** : 30 objectifs pédagogiques (respecter la progressivité)
- ✅ **Code de la route français** : lois actuelles 2024-2025, pas de désinformation
- ✅ **Audience 16-25 ans** : tutoiement, contextes proches (parking lycée, route de nuit, ville)
- ✅ **Public cible** : apprentis-conducteurs avant examen (pas de truc trop niche)

## Processus de création (multi-étape)

### Étape 1 : BRIEFING INTELLIGENCE
- Compétence cible : **C1a** (ex: "Maîtriser le fonctionnement du véhicule")
- Sélectionner **2-3 sous-items** de cette compétence (ex: "Connaître les commandes et les éléments de sécurité")
- Objectif pédagogique précis : ce que l'élève DOIT savoir pour réussir l'examen
- Contexte réaliste : scène de la vie réelle (pas de truc académique abstrait)

### Étape 2 : BRAINSTORM CRITIQUE
Avant de rédiger, poser 5 questions :
1. **Pertinence examen** : cette question apparaît-elle (ou un variant proche) dans les vrais tests DREAL ?
2. **Piégeabilité** : y a-t-il un vrai disteur (réponse qui semble correcte mais ne l'est pas) ?
3. **Univocité** : la réponse correcte est-elle 100% indiscutable ? (pas d'interprétation)
4. **Progressivité** : est-ce qu'un élève moyen la réussit à 65-70% ? (ni triviale, ni impossible)
5. **Contexte réaliste** : la scène décrite pourrait-elle vraiment se produire ?

### Étape 3 : RÉDACTION CANNELLE
Écrire la question en tutoiement simple, présent actif, max 2 propositions (pas de périodes alambiquées).

**Format obligatoire:**
```
Titre compétence : C1a — Maîtriser le véhicule
Contexte : [1-2 phrases qui mettent en scène]

**Question (titre numéroté)**
Tu [action]. Qu'est-ce que tu dois [vérifier/faire/savoir] ?
A) [disteur 1 — logique trompeuse]
B) [disteur 2 — confusion courante]
C) [disteur 3 — erreur spécifique au jeune conducteur]
D) [RÉPONSE CORRECTE — claire, incontestable]

Explication (pourquoi D, pas les autres):
- Pourquoi pas A : [correction du disteur]
- Pourquoi pas B : [correction du disteur]
- Pourquoi pas C : [correction du disteur]
- Pourquoi D : [fondement légal + logique pédagogique]

Référence légale : [article du code de la route ou jurisprudence]
Piégabilité : ⭐⭐⭐ [1-5 étoiles : risque de mauvaise réponse moyen conducteur]
```

### Étape 4 : AUTO-CRITIQUE FÉROCE
Relire ET se critiquer sur ces axes :
- **Linguistique** : la question est-elle compréhensible par un ado dyscalculique ? Pas de mots rares ?
- **Logique** : le disteur B est-il *trop* faux (obvious) ? Il faut qu'il piège 15-20% de gens.
- **Légalité** : la réponse D reflète-t-elle le droit en vigueur ? (pas une "croyance courante" fausse)
- **Contexte** : la mise en scène est-elle assez détaillée pour éliminer les ambiguïtés ?
- **Réalisme** : un moniteur d'auto-école validerait-il cette question comme "bonne" ?

### Étape 5 : ITÉRATION
Si un critère fail, **récrire** la question jusqu'à ce que tous passent. Pas de copier-coller.

---

## Exemples de distracteurs CLASSE-A (les pires à éviter)

❌ **Disteur obvious** : "A) Ne pas freiner du tout"  
→ Tout le monde voit que c'est faux. Piégabilité = 0.

❌ **Disteur contradictoire** : "B) Quelque chose qui contredit complètement la question"  
→ Pas logique avec la scène.

✅ **Disteur subtil** : "B) Passer en 2e plutôt que 3e" (quand la bonne réponse est "accélérer modérément")  
→ Confond jeune conducteur qui pense qu'une vitesse basse = sécurité.

✅ **Disteur "loi d'hier"** : "C) Depuis 2020, tu peux dépasser si la file bouge lentement"  
→ Beaucoup croient ça, mais c'est l'ancien code. Piégant.

---

## Instructions pour FABLE

**Tâche** : Tu vas générer **5 questions REMC inédites et excellentes** pour la compétence que je te donne. Chaque question DOIT:
1. Passer les 5 filtres de brainstorm (pertinence, piégeabilité, univocité, progressivité, réalisme)
2. Avoir 3 disteurs sutils + 1 réponse incontestable
3. Inclure une explication pédagogique (pourquoi D, pourquoi pas les autres)
4. Citer la loi ou la jurisprudence exacte
5. Auto-évaluation critique (tu dis toi-même si tu trouves un problème et tu corriges)

**Pas d'excuses** : Si tu trouves un problème en relisant, tu **dois** itérer, pas juste le signaler.

**Liberté créative** : Tu peux inventer des contextes hyper-réalistes (nuit à 3h du matin sur une route de campagne, parking de discothèque, famille pressée en voiture, etc.) — du moment que c'est plausible et pas folklorique.

**Sortie attendue** : 5 questions formatées, prêtes à intégrer dans `parcours-quiz.js`, avec mention de la compétence, la progressivité, et ton auto-critique final (1 phrase : est-ce que tu les valides toutes ou tu veux itérer sur l'une d'elles?).

---

## Critères de succès FABLE

Tu as réussi si :
- ✅ Les 5 questions sont **inédites** (pas juste du copier-colle du code de la route)
- ✅ Les disteurs ne sont **pas obvious** (un élève mâle a 20-30% de chance de tomber dedans)
- ✅ La progressivité est **claire** : facile (65-70%) → moyen (55-65%) → dur (40-50%)
- ✅ Les explications sont **pédagogiques** (pas juste "c'est la loi" — on explique le **pourquoi**)
- ✅ Auto-critique : tu dis **honnêtement** si une question n'est pas à la hauteur et tu la réécris

---

## Appel à FABLE

*Voici la compétence cible : [INSERTION: compétence REMC + objectif pédagogique]*

Génère 5 questions de champion. Go.
