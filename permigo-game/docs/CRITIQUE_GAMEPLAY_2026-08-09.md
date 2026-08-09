# Ce qu'on a construit, et pourquoi c'est le mauvais jeu

> Critique sans complaisance du mode « mise en situation 3D », demandée par
> Rayan le 09/08/2026. Puis cinq concepts, comparés, et une recommandation.
>
> Le filtre de toute mécanique, à partir de maintenant :
> **1.** Ça aide vraiment à mieux conduire dans la vraie vie ?
> **2.** Ça donne envie de relancer tout de suite ?
> **3.** Ça se comprend en moins de 5 secondes, même quand on déteste réviser ?
> Trois oui, sinon on jette.

---

## 1. Le verdict sur ce qu'on a

**J'ai construit un simulateur alors que le produit a besoin d'un entraîneur à
la décision.** Le moteur est bon. La boucle est fausse.

### Passons notre propre travail aux trois questions

**Question 1 — Est-ce que ça aide à mieux conduire ?**

En partie seulement, et pas là où on a mis l'effort.

- ✅ Ce qui sert : tourner la tête avant de s'engager, la vitesse à l'entrée
  d'un carrefour, céder le passage, l'écart au cycliste. Ce sont de vraies
  habitudes, et elles se transfèrent.
- ❌ Ce qui ne sert à rien : tenir une voie en ligne droite à 29 km/h pendant
  sept secondes. Le dosage d'une pédale sur un écran tactile. Le freinage.
  Aucune de ces trois choses ne se transfère à une vraie voiture, parce que le
  retour physique (le poids, le bruit, l'inertie dans le corps) est ce qui les
  enseigne, et un téléphone ne l'a pas.
- 🔴 **On a mis 90 % de l'ingénierie sur la partie qui n'enseigne rien.**

**Question 2 — Est-ce que ça donne envie de relancer ?**

Non, et c'est mesurable.

- Une situation dure **40 secondes** dont **7 d'approche où le joueur ne fait
  rien** (la voiture roule seule, c'est nous qui l'avons voulu). Le temps mort
  est l'ennemi numéro un de l'envie de rejouer.
- Une situation contient **UNE décision**. Quarante secondes pour une décision.
- À la fin : une carte, un bouton, la suivante. **Aucune tension, aucun score à
  battre, aucune série à ne pas casser.** Rien ne pousse au coup d'après.

**Question 3 — Est-ce compréhensible en 5 secondes ?**

Non. Il y a une pédale de frein, une d'accélérateur, un manche pour tourner,
un glissement sur le pare-brise pour regarder, un bouton de vue, un compteur
d'étape. **Six commandes pour une décision qui est binaire dans cinq
situations sur six.** Un élève qui déteste réviser ne va pas apprendre à jouer.

### La mesure qui résume tout

> **Densité d'apprentissage : notre jeu propose 1 situation lue toutes les 40 s.
> Un bon jeu d'entraînement en propose 1 toutes les 4 s.**

C'est un facteur **10**. Sur une session de 5 minutes, ça fait la différence
entre 7 situations vues et 75. Et c'est exactement le même chiffre qui sépare
un jeu qu'on relance d'un jeu qu'on ferme : Duolingo pose une question toutes
les 4 secondes, Chess.com un problème toutes les 15, GeoGuessr une manche
toutes les 90 mais avec une tension énorme à l'intérieur.

### Ce que j'ai fait de bien malgré tout

Il ne faut pas jeter le moteur, il faut le déplacer.

- La **3D réelle** (vraie caméra, vraie perspective, vrais modèles) est le seul
  moyen de montrer **ce qui SERAIT arrivé**. Une photo ne peut pas le faire.
  C'est là que la 3D gagne, et on ne s'en sert pas.
- L'**évaluation par le comportement** (zones, regard, écart, vitesse) reste la
  bonne idée. Elle change juste d'échelle.
- Le **format de données d'un scénario** est presque bon tel quel.
- Le **plan de cinéma**, le **son**, l'**image** : ce sont des outils de
  RÉCOMPENSE. On les a mis sur le gameplay, ils appartiennent au feedback.

---

## 2. Cinq concepts

Chacun est noté sur les six critères demandés. Note de 1 à 5.

### A. « Coup d'œil » — le repérage du danger

Vue conducteur, la scène vit pendant 3 à 5 secondes. L'élève **tape ce qui est
dangereux** : l'enfant derrière la camionnette, le vélo dans l'angle mort, le
piéton qui hésite. Score = ce qu'il a vu, et à quelle vitesse.

- **Apprentissage : 5/5.** C'est le seul module d'examen au monde dont
  l'efficacité est prouvée (le Hazard Perception Test britannique et
  néerlandais, associé à une baisse réelle des accidents de jeunes conducteurs).
  C'est aussi la compétence que les moniteurs français n'ont pas le temps
  d'entraîner : ça demande des centaines de répétitions.
- **Plaisir : 4/5.** Chercher est plus amusant que répondre.
- **Simplicité : 5/5.** « Tape ce qui est dangereux. » Zéro apprentissage.
- **Addictif : 4/5.** Combo, série, chronomètre.
- **Développement : 3/5.** Il faut marquer les objets dangereux dans chaque
  scène, et gérer les faux positifs (taper un arbre ne doit pas rapporter).
- **Évolutivité : 5/5.** Une scène donne dix configurations.

### B. « Passe ou passe pas » — la décision réflexe

Une situation apparaît. **Deux secondes** pour trancher : j'y vais, je
m'arrête, je ralentis. Le temps est compté, la série se casse à la première
erreur.

- **Apprentissage : 4/5.** C'est exactement là que les élèves français
  échouent : priorité, insertion, tourne-à-gauche, feu orange. Et la vraie
  conduite demande de décider VITE, ce que le format entraîne.
- **Plaisir : 5/5.** C'est un jeu de réflexe, le plus addictif des formats.
- **Simplicité : 5/5.** Deux ou trois gros boutons.
- **Addictif : 5/5.** Série, mort subite, score à battre.
- **Développement : 5/5.** Le plus facile : on a déjà les scènes, on retire la
  conduite.
- **Évolutivité : 5/5.** Une situation = un fichier de données.
- ⚠️ **Le risque** : à deux choix, on réussit une fois sur deux au hasard. Il
  faut trois à quatre réponses, et surtout des situations vraiment ambiguës.

### C. « La trajectoire » — tracer son chemin

Vue légèrement surélevée du carrefour ou du giratoire. L'élève **dessine au
doigt** le chemin de sa voiture : par où il entre, où il se place, où il sort.
Puis le jeu **rejoue son tracé en 3D depuis le siège conducteur**.

- **Apprentissage : 5/5.** Le placement sur la chaussée et les giratoires sont
  le premier motif d'échec pratique, et rien ne les entraîne aujourd'hui.
- **Plaisir : 4/5.** Le rejeu en 3D est une vraie récompense.
- **Simplicité : 4/5.** « Trace ton chemin » se comprend, mais c'est plus lent.
- **Addictif : 3/5.** On ne trace pas trente trajectoires d'affilée.
- **Développement : 2/5.** Le plus cher : conversion tracé → trajectoire,
  jugement du tracé, rejeu.
- **Évolutivité : 4/5.**

### D. « Le film » — la conduite complète (ce qu'on a aujourd'hui)

- **Apprentissage : 3/5** · **Plaisir : 2/5** · **Simplicité : 2/5** ·
  **Addictif : 1/5** · **Développement : déjà fait** · **Évolutivité : 4/5**
- Verdict : **ce n'est pas la boucle principale.** Ça devient l'exception, une
  fois par session, comme un boss.

### E. « Le rush » — la coque qui enveloppe tout le reste

Ce n'est pas un gameplay, c'est un CADRE : **60 secondes, enchaîne le plus de
situations possible.** Bonne réponse, on continue. Mauvaise réponse, on perd 5
secondes et **la scène se joue en 3D pour montrer ce qui serait arrivé**.

- C'est le Puzzle Rush de Chess.com. C'est ce qui transforme n'importe quel
  exercice correct en chose qu'on relance dix fois.

---

## 3. La recommandation

> ### On garde le moteur, on jette la boucle.
> **B + A à l'intérieur de E.** Une décision toutes les 3 à 5 secondes, dans
> une coque chronométrée, et la 3D sert à montrer la CONSÉQUENCE.

### À quoi ça ressemble, concrètement

1. **Un compte à rebours de 60 secondes** démarre.
2. Une scène apparaît en vue conducteur, en 3D, vivante (le trafic bouge, la
   caméra respire). L'élève **peut glisser le doigt pour regarder autour** :
   ce n'est plus une commande, c'est de la CURIOSITÉ, et c'est gratuit.
3. Une question, toujours de la même famille : **« Tu fais quoi ? »** avec deux
   ou trois grands boutons. Ou, une fois sur trois : **« Tape le danger. »**
4. **Bonne réponse** : +1, le chrono continue, la suivante arrive tout de suite.
   Une demi-seconde, pas plus.
5. **Mauvaise réponse** : le chrono perd 5 secondes, et **la scène se joue** :
   la voiture avance vraiment, le camion arrive vraiment, le choc a lieu
   vraiment, au ralenti, vu de l'extérieur. Deux secondes. Une phrase.
   **C'est la seule chose qui fait retenir une règle.**
6. À la fin : un score, une série, le meilleur du jour, et les deux ou trois
   situations ratées proposées à refaire.

### Pourquoi c'est celui-là

- **La densité d'apprentissage est multipliée par dix.** 12 à 20 situations en
  une minute au lieu de 1,5.
- **Rien de ce qu'on a construit n'est perdu, tout change de rôle.** Le monde
  3D, les modèles, la lumière et la chaîne d'effets deviennent le décor des
  questions ET le rendu des conséquences. Le simulateur de véhicule et de
  trafic devient le moteur qui calcule « ce qui serait arrivé ». Le plan de
  cinéma devient le plan de la conséquence. C'est exactement ce pour quoi ces
  outils sont bons, et ce n'est pas ce qu'on leur faisait faire.
- **La 3D devient enfin nécessaire.** Aujourd'hui, une photo ferait le même
  travail. Montrer la conséquence, non : ça demande une vraie scène.
- **C'est le plus simple à développer**, parce que le plus dur est déjà écrit.
- **Ça passe à l'échelle** : une situation reste un fichier de données, et un
  environnement en sert des dizaines.

### Ce qu'on supprime, sans regret

- ❌ Les **pédales** et le **manche**. On ne conduit plus.
- ❌ Le **bouton de vue extérieure**. Une seule vue en jeu : celle du
  conducteur. L'extérieur n'existe que dans la conséquence, et c'est ce qui lui
  donne sa force.
- ❌ Les **sept secondes d'approche**. La situation commence à l'instant où il
  faut décider.
- ❌ La **manche de six situations** avec sa carte de fin à chaque étape.

### Ce qu'on garde tel quel

- ✅ Le monde 3D, les modèles, la lumière, l'image, le son.
- ✅ Le simulateur de véhicule et de trafic (pour les conséquences).
- ✅ Le format de données d'un scénario, à peine élargi.
- ✅ Le plan de cinéma, comme rendu de conséquence.
- ✅ Le mode conduite complète, **une fois par session**, comme épreuve finale.

### Ce qu'il faut inventer

- Le **catalogue de questions** : une famille de questions, pas une par
  situation. « Tu fais quoi », « tape le danger », « qui passe en premier »,
  « à quelle vitesse ».
- Le **calculateur de conséquence** : rejouer la scène avec la décision de
  l'élève, en accéléré, et savoir dire si ça finit mal.
- La **coque de rush** : chrono, série, score du jour, les ratés à refaire.

---

## 4. La question qu'il faut trancher avant de coder

**Combien de temps dure une session type ?** Tout en découle.

- **60 secondes** : c'est un jeu de réflexe pur, on le relance dix fois par
  jour, il vit à côté de la préparation de leçon.
- **3 minutes** : c'est une séance de révision, on la fait une fois par jour,
  elle remplace le quiz.

Mon avis : **60 secondes**, avec la possibilité d'enchaîner. Un élève qui a
2 minutes dans le bus fait deux manches. Un élève motivé en fait dix. Une
séance de 3 minutes demande une décision d'y aller ; une manche de 60 secondes,
non.
