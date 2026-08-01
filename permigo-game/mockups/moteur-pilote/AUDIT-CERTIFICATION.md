# Audit du circuit de certification

> 01/08/2026. Circuit parcouru en entier, écran par écran, avec les vrais
> textes de l'app et les vraies questions en base de production.
> Complète `BOUCLE-CERTIFICATION.md`.

## Le circuit tel qu'il existe

Réviser → la fiche → « Certifie la compétence » → `#/valider-seul/{code}` →
écran d'accueil (2 étapes) → quiz de 5 questions tirées de la base →
si 4 justes : « Tu te sens prêt à passer à la suite ? » → « Oui je certifie » →
`self_validate_competence` → carte de collection + 25 volants → la compétence
passe acquise dans « Mon permis ».

## 🔴 1. Le quiz de certification ignore la boîte automatique

C'est le trou le plus grave, et il est mesuré, pas supposé.

**L'app ne demande à aucun moment quelle boîte l'élève conduit.** Aucune
colonne, aucun réglage, aucune question à l'inscription. Le mot `bva` n'existe
que dans le texte des fiches.

La fiche, elle, s'adapte : chaque fiche a un bloc « En boîte auto ». Le quiz qui
CERTIFIE, lui, ne filtre rien. Extrait de la base (`questions_competence`,
`type = post_validation`) :

- **C1d « Démarrer et s'arrêter », 6 questions sur 6 portent sur l'embrayage** :
  « Quel est le tempo de l'embrayage ? », « À quel moment enfonces-tu
  l'embrayage ? », « Pour doser l'embrayage au millimètre, ton pied gauche fait
  comment ? ». Un élève en boîte automatique n'a pas cette pédale. On lui
  demande de certifier un geste qu'il ne peut pas faire.
- **C1f « Utiliser la boîte de vitesses »** est entièrement manuelle (levier,
  point mort, ressort de rappel, régime de passage).
- **C1a contient une question FAUSSE en boîte automatique** : « Tu découvres les
  pédales. Laquelle est au milieu ? » → réponse attendue « le frein », avec
  l'explication « de gauche à droite : embrayage, frein, accélérateur ». En
  automatique il y a **deux** pédales et le frein est **à gauche**. La bonne
  réponse de l'app est la mauvaise réponse pour cet élève.

Il n'y a que **6 questions par compétence** en base et le quiz en tire 5 : on ne
peut pas se contenter de filtrer, il faudra écrire les questions manquantes.

## 🔴 2. On promet à l'élève que son enseignant voit ses certifications. C'est faux

L'écran de confirmation dit mot pour mot : « Ton enseignant peut voir tes
certifications. »

Or les deux écrans qu'un moniteur ouvre vraiment, **Aujourd'hui** et
**Mes élèves**, ne lisent que la table `validations`, celle qu'il remplit
lui-même. Un élève qui certifie vingt compétences reste affiché à zéro chez son
moniteur, et sa préparation à l'examen (`readiness`) est calculée sur les seules
validations du moniteur.

Dans le livret REMC, il existe bien un badge, mais :

- il s'appelle **« Auto-validée »**, ce qui sonne comme « il s'est noté
  lui-même » ;
- son infobulle dit « Validée en autonomie (quiz 82 %) **avant rattachement**.
  À confirmer en séance » : un **pourcentage** (banni), et une notion morte
  depuis le pivot du 17/07, où l'auto-certification est devenue la voie normale
  de TOUS les élèves, plus un reliquat de la période solo ;
- il n'apparaît **que si le moniteur n'a rien mis lui-même** : dès qu'il pose un
  statut, la certification de l'élève disparaît de l'écran ;
- le commentaire du code le dit noir sur blanc : « N'entre dans AUCUNE stat
  moniteur ».

## 🔴 3. Quatre mots pour une seule chose

Sur le même parcours, l'élève lit successivement :

| Écran | Le mot employé |
| --- | --- |
| Fiche | **Certifie** la compétence |
| Bandeau de l'écran suivant | VALIDATION AUTONOME |
| Étape 2 | Le quiz de **validation** |
| Écran de fin | Compétence **certifiée** |
| Parcours / Mon permis | **acquis** |
| Côté moniteur | Auto-**validée** |

Certifier, valider, acquérir : pour nous c'est la même chose, pour un élève ce
sont trois promesses différentes. « Validation » évoque l'administration,
« certification » évoque un diplôme, « acquis » évoque l'école.

## 🟠 4. La phrase d'accueil contredit la prévention posée deux écrans plus tôt

L'écran de certification ouvre sur : « **Ton moniteur te l'a validée en leçon,
ou tu maîtrises déjà ce geste ?** Prouve-le en 2 étapes. »

Deux problèmes. Le moniteur ne valide plus rien depuis le pivot, la phrase
décrit un produit qui n'existe plus. Et le « ou tu maîtrises déjà ce geste »
rouvre exactement la porte que la prévention de la fiche venait de fermer
(« fais-la d'abord en leçon avec ton enseignant »).

## 🟠 5. Rater n'apprend rien

Six questions en base, cinq tirées. Un élève qui rate et clique « Relire la
fiche et retenter » retombe sur cinq des six mêmes questions. Au deuxième essai
il ne réapprend pas le geste, il se souvient de la case. Le message dit la bonne
chose, la mécanique dit l'inverse.

## 🟠 6. « Presque ! » même à zéro sur cinq

L'écran d'échec est le même pour 3/5 et pour 0/5. À quelqu'un qui n'a rien
compris, on dit « Presque ! ». C'est gentil et c'est faux, et ça n'aide pas à
savoir quoi relire.

## 🟡 Le reste

- **Une explication fausse** : sur C1f, « Une erreur de boîte est éliminatoire ».
  À l'examen français, une erreur de boîte n'est pas éliminatoire en soi. On
  fabrique une peur inutile dans un écran qui certifie.
- **Du vocabulaire de métier jamais expliqué** : « commodo », « patinage »,
  « rétrograder » arrivent sans définition, y compris dans les questions qui
  certifient.
- **Rien ne dit ce que la certification vaut**. Aucun écran ne précise que ça
  n'a aucune valeur officielle et que ça ne remplace ni la leçon ni l'examen.
  La seule phrase honnête (« ce quiz ne remplace pas une vraie leçon de
  conduite ») est en petit, sous le bouton, après.
- **La route de certification n'est pas murée** pour le compte gratuit alors que
  la fiche l'est : `#/valider-seul/C1d` en accès direct reste ouvert.

## Les six personnes qui traversent ce circuit

**Yanis, 17 ans, inscrit hier soir, jamais monté dans une voiture.**
Je lis une fiche, il y a un gros bouton doré qui dit « Certifie la compétence ».
Je réponds à cinq questions faciles, je gagne une carte de collection et 25
volants. Je recommence. En une soirée mon permis est à moitié rempli et je n'ai
jamais touché un volant. Rien ne m'a arrêté sauf une phrase que j'ai sautée, et
tout le reste de l'écran m'encourageait à continuer.

**Karim, 24 ans, en France depuis huit mois, comprend le français parlé.**
« Validation autonome », « compétence certifiée », « certifie la compétence » :
c'est le français des papiers, pas celui qu'on m'a appris. Je clique sans savoir
si je m'engage à quelque chose. Et je conduis une automatique, comme la voiture
de mon école : on me demande cinq fois où est l'embrayage. Je réponds au hasard,
je rate, l'app me dit « Presque ! ».

**Louis, 18 ans, auto-école classique, son moniteur est un vrai professeur.**
Je certifie mes cinq premières compétences et je montre l'écran à mon moniteur
au début de l'heure. Il ouvre son côté à lui : il ne voit rien. Mon travail
n'existe pas chez lui. Soit l'app ment, soit c'est un jouet.

**Michel, 52 ans, repasse le permis après une annulation.**
On me dit « compétence certifiée », et dans la seconde on me donne une carte à
collectionner et des volants. Je ne sais plus si je suis dans un jeu ou dans un
suivi sérieux. Si c'est un jeu, pourquoi le mot « certifiée » ? Si c'est
sérieux, pourquoi la carte ?

**Sarah, 19 ans, elle vient de payer le Pass.**
J'ai révisé la fiche, j'ai certifié, c'est acquis. Personne ne me dit ce que
j'en fais maintenant. Est-ce que je peux dire à mon moniteur « j'ai validé C1a » ?
Est-ce que ça compte pour l'examen ? L'app est muette exactement au moment où
elle vient de me donner quelque chose.

**Sofiane, moniteur, 14 ans de métier.**
J'ouvre le livret d'un élève, je vois marqué « Auto-validée » à côté d'une
compétence. Pour moi ça veut dire : il s'est mis la note tout seul. Je ne sais
pas s'il l'a faite avec moi, ni ce qu'il a répondu, ni quoi en faire. Mon tableau
de bord ne bouge pas, donc dans les faits ça ne me sert à rien. Au mieux je
l'ignore, au pire ça me braque contre l'appli devant l'élève.

## Ce que je propose de corriger, dans cet ordre

1. **Demander la boîte à l'inscription** (une question, deux boutons), puis
   filtrer les questions et écrire les questions manquantes en automatique.
   Tant que ce n'est pas fait, ne pas ouvrir la certification sur C1d, C1e et
   C1f à un élève en automatique.
2. **Faire exister les certifications chez le moniteur** : les compter dans
   « Mes élèves » et « Aujourd'hui » avec une pastille distincte de sa propre
   validation, renommer « Auto-validée » en quelque chose qui ne sonne pas comme
   de la triche (« Certifiée par l'élève »), retirer le pourcentage et la
   mention « avant rattachement ». Ou, si on assume l'inverse, retirer la phrase
   « ton enseignant peut voir tes certifications ».
3. **Un seul mot partout.** Choisir entre certifier et valider, et le tenir de la
   fiche jusqu'au livret du moniteur.
4. **Réécrire la phrase d'accueil** de l'écran de certification pour qu'elle dise
   la même chose que la prévention.
5. **Écrire les questions manquantes** pour qu'un deuxième essai ne soit pas le
   même quiz, et **différencier l'écran d'échec** selon ce qui a été raté.
6. **Corriger « une erreur de boîte est éliminatoire »**.
