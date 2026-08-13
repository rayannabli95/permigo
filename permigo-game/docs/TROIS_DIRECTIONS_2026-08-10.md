# Trois directions pour le slice, et celle qui peut devenir PermiGo

> Rayan, 10/08/2026 : « Je lance le jeu et je ressens : ok, je suis dans une
> voiture, je peux tourner la caméra et ralentir. Et c'est tout. »
>
> Il a raison. On garde la technique, on jette l'expérience.
> **Rien n'est codé. Si ce n'est pas excitant à lire, on ne le code pas.**

---

## 0. Ce qui meurt tout de suite, avant même de choisir

| | |
|---|---|
| ❌ **Le crépuscule violet** | La direction artistique de l'app appliquée à un banc d'essai. Une voiture grise sur du bitume sombre à quarante mètres, personne ne la voit. **Plein jour, 14 h, ombres courtes et nettes.** La DA viendra après. |
| ❌ **Le balayage de caméra** | Le geste central était de déplacer une caméra. C'est ce que fait un jeu de conduite, et c'est ce qui n'a produit aucune sensation. |
| ❌ **La pédale de frein** | On l'a dit dix fois et on l'a quand même remise : PermiGo n'est pas un simulateur de pédales. |
| ❌ **La rue vide** | Une camionnette et une voiture grise. Ce n'est pas une rue, c'est un schéma. |

Ce qu'on garde, et c'est beaucoup : le moteur 3D, le trafic, les collisions,
la détection de ce qui est réellement visible depuis l'œil du conducteur,
l'occlusion, les horodatages mesurés. **Tout le travail de mesure reste bon.
C'est l'enveloppe qui était fausse.**

---

## 1. La rue, pour les trois directions

Le décor n'est pas un décor. C'est le terrain de jeu, et sa composition est
la moitié de la difficulté.

**Plein jour, contraste fort, réalisme propre.** Ciel clair, soleil à 60°,
ombres courtes et dures qui ancrent tout au sol. Bitume gris clair, marquages
blancs francs. Façades beige et brique. Aucune brume, aucun halo, aucun grain.

**Une rue vivante, en trois bandes de lecture :**

| Bande | Ce qu'il y a | Rôle |
|---|---|---|
| **Trottoir droit** | 6 à 10 piétons, une devanture, un livreur, une poussette, un panneau école | c'est là que naissent les trois quarts des dangers |
| **Chaussée** | 2 à 3 véhicules en mouvement, 8 à 12 en stationnement des deux côtés | l'occlusion, et le rythme |
| **Trottoir gauche** | moitié moins dense, des arbres, un abribus | de la profondeur, et du bruit utile |

**Les quatre lois de lisibilité, sinon c'est du bordel visuel :**

1. **Au plus trois choses bougent en même temps.** Le reste est immobile.
2. **Le danger n'est jamais le seul qui bouge.** Sinon on le trouve par
   élimination et il n'y a plus de jeu.
3. **Tout ce qui compte tient dans le cadre.** ⭐⭐⭐ La difficulté n'est pas
   de tourner la tête, c'est de **remarquer**. Sur un téléphone en portrait le
   champ fait trente degrés : chercher hors cadre, c'est chercher à l'aveugle.
   Et c'est aussi la vérité de la route, où l'essentiel est déjà sous nos yeux
   et où on ne le traite pas.
4. **Discret avant, évident après.** Une porte entrouverte de dix centimètres.
   Deux jambes sous une camionnette. Un rétroviseur qui se replie. Après
   découverte, la même chose devient énorme.

**Le bruit utile**, celui qui doit exister et ne rien annoncer : un piéton sur
son téléphone qui ne traversera pas, un clignotant sur une voiture garée qui
ne démarrera pas, un ballon posé sur le trottoir qui ne roulera pas. Sans lui,
« tout ce qui est bizarre est un danger » et le jeu se résout sans réfléchir.

---

## 2. DIRECTION A — « Le ralenti » · jeu vidéo premium

> Un film d'action de quinze secondes dont tu es le réalisateur.

### 1 · Ce que je vois, seconde par seconde

```
00,0  Rue commerçante, plein jour. On roule à 45. La voiture avance seule.
      Trottoir droit chargé : une devanture, un livreur qui décharge.
      Le son est plat, ambiant, un peu étouffé. Rien ne presse.
02,0  Je pose le pouce sur le livreur. La caméra fouette vers lui en
      0,25 s, la profondeur de champ se resserre dessus, le reste du
      monde part en flou doux. Le son ambiant BAISSE d'un cran.
      Rien. Il décharge, c'est tout. Je relâche, la caméra revient.
04,5  Je pose le pouce sur une camionnette garée 30 m devant.
06,2  Sous elle, une ombre glisse. Le monde tombe à 0,12× de sa vitesse.
      Les couleurs se retirent SAUF l'ombre, qui reste. Un clic sec de
      mise au point, une note grave qui monte. Le moteur se tait.
06,4  Une ligne blanche part du capot. C'est ma trajectoire.
08,0  Je trace au doigt : je serre à gauche, je ralentis avant le seuil.
      La ligne s'épaissit là où je ralentis. Je relâche.
08,3  Le temps repart à 0,4× puis à fond. La voiture suit MA ligne.
09,8  La berline débouche. Je passe à 1,2 m d'elle, au pas.
10,5  Plan extérieur, une seconde, les deux voitures qui se croisent.
      Timbre « VU 2,4 s AVANT ». Retour au volant, la rue continue.
15,0  Le prochain danger est déjà en train de naître, 60 m devant.
```

### 2 · Ce que je fais du doigt

**Deux gestes.** Maintenir pour viser, glisser pour tracer.

### 3 · Le moment où je trouve

Le monde se fige à un huitième de vitesse, les couleurs se retirent partout
sauf sur ce que j'ai trouvé, la mise au point claque dessus, le son ambiant
disparaît et laisse une note grave. **Un huitième de seconde de silence total
avant la note.** C'est ce silence qui fait le frisson.

### 4 · Le retour de réussite

Le rejeu extérieur d'une seconde, au ralenti, sur ma propre trajectoire. Puis
le timbre : le nombre de secondes d'avance que j'ai prises.

### 5 · Si je rate

Je ne vise jamais, la berline sort, choc. **Coupe au noir instantanée, son
coupé net.** Puis rembobinage à 0,2× jusqu'à l'instant où l'ombre était
visible, entourée, avec le compteur qui remonte : « elle était là depuis
3,4 secondes ».

### 6 · Pourquoi je relance

Parce que je viens de réaliser un plan de cinéma et que je peux le faire mieux.
Tracer une meilleure ligne est une compétence, et on veut la refaire.

### 7 · Le prix

**Le plus cher des trois.** Juger un tracé au doigt est flou, la caméra à
fouet demande du soin, et une scène dure quinze secondes : la densité
d'apprentissage retombe à quatre situations par minute.

---

## 3. DIRECTION B — « Le rush » · arcade

> Soixante secondes. Combien de dangers tu vois avant les autres.

### 1 · Ce que je vois, seconde par seconde

```
00,0  Un compte à rebours de 60 s démarre en haut. Sous lui, un combo à 0.
00,3  Une tranche de rue apparaît, plein cadre, PLEIN JOUR. Elle VIT :
      deux secondes de vraie circulation, en boucle si je tarde.
      Un bus à l'arrêt, des piétons, une file de voitures garées.
01,4  Je tape le ballon qui roule devant le bus.
      L'image se FIGE sur mon doigt. Tout passe en gris sauf le ballon,
      qui garde sa couleur et grossit d'un cheveu. « chk. »
      +1. Le combo passe à 1. Un instrument s'ajoute à la musique.
01,9  La tranche suivante glisse depuis la droite. Elle est 5 % plus rapide.
03,1  Un carrefour. Une voiture arrive de la droite, à moitié cachée.
      Je tape. « chk. » Combo 2.
04,6  Une rue calme. Une dame sur son téléphone, sur le trottoir.
      Rien ne va arriver. J'attends. La tranche s'achève.
      « RIEN À SIGNALER. » +1. Combo 3. ⭐ La tranche vide vaut autant.
06,0  Un cycliste. Je tape le cycliste. FAUX : il est visible, il n'est pas
      le danger. Le vrai était la portière qui s'ouvre devant lui.
      La tranche se joue en entier, une seconde : la portière s'ouvre,
      le vélo l'évite. Combo cassé. −3 s au chrono.
...
60,0  27 lues. 19 justes. Meilleure série 8. Meilleur du jour : 23.
```

### 2 · Ce que je fais du doigt

**Un appui. Un seul.** Toucher ce qui va poser problème, ou ne rien toucher.

### 3 · Le moment où je trouve

L'image se fige à l'instant précis de mon doigt, tout se décolore sauf la
cible, un son sec et court. **Le gel est instantané, il n'y a aucune
animation d'entrée** : c'est ça qui donne la sensation de vitesse.

### 4 · Le retour de réussite

Le combo qui monte, un instrument de musique qui s'ajoute tous les cinq, le
tempo qui accélère de 5 % à chaque tranche.

### 5 · Si je rate

La tranche se joue jusqu'au bout, une seconde, et je vois ce qui est arrivé.
Le chrono perd trois secondes, la série tombe à zéro. **C'est la perte de la
série qui fait mal, pas le chrono.**

### 6 · Pourquoi je relance

Le meilleur score du jour, la série à battre, et soixante secondes qui
n'engagent à rien. C'est la boucle de Puzzle Rush, et elle est prouvée.

### 7 · Le prix et le risque

Le moins cher à construire, le plus facile à remplir. **Mais ce n'est plus
de la conduite, c'est un diaporama de moments.** On perd la continuité, donc
l'anticipation longue, donc la moitié de ce qu'on veut enseigner. Et une fois
bien fait, ça reste un très bon jeu générique : l'identité vient du soin, pas
du concept.

---

## 4. DIRECTION C — « Secondes d'avance » · observation ⭐

> Ton score n'est pas un score. C'est le temps que tu as gagné.

### L'idée en une phrase

**Tu roules. Tu touches ce qui va poser problème, le plus tôt que tu oses.
Ta récompense est le nombre de secondes d'avance que tu viens de prendre.
Et voir suffit : ta voiture se comporte comme quelqu'un qui a vu.**

### 1 · Ce que je vois, seconde par seconde

```
00,0  Plein jour. Une rue de ville, deux voies, vivante.
      Je roule à 40. Vue depuis le siège, cadrée large, PAS DE CAMÉRA
      À BOUGER : ce qui compte est devant moi, comme dans la vraie vie.
      En haut à gauche, trois chiffres discrets : 0,0 s d'avance.
01,0  Un cycliste 40 m devant, à droite. Une camionnette de livraison
      arrêtée, warnings allumés. Des gens sur le trottoir. Un bus au loin.
      Rien d'anormal. Le son est celui d'une rue : moteur, une radio
      lointaine, des pas.
02,8  ⭐ La porte arrière de la camionnette s'entrouvre de dix centimètres.
      Personne ne regarde là. Moi non plus, la première fois.
04,6  Je la touche.
      → LE MONDE SE SUSPEND. 0,15 s de silence complet.
      → Tout perd son contraste SAUF la porte, qui reste nette.
      → Une note claire, courte. Un anneau fin se referme dessus.
      → Un nombre monte à l'écran : « + 2,8 s ».
      → 0,4 s en tout. Puis la vie reprend, exactement où elle était.
04,9  Ma voiture lève le pied toute seule et se déporte d'un demi-mètre.
      ⭐⭐⭐ Je n'ai pas freiné. J'ai VU, et ça suffit : la voiture
      conduit comme quelqu'un qui a vu. C'est tout le geste du jeu.
07,4  Un homme sort de la camionnette, un carton dans les bras, sans
      regarder. Je passe à 20 km/h, à un mètre. Il lève la main.
      Le compteur en haut vire au vert une demi-seconde. Rien d'autre.
09,0  La rue continue. Le cycliste se rapproche du trottoir.
      Une voiture garée allume ses feux de recul, deux points blancs.
11,2  Je la touche. « + 1,9 s ». Je ralentis.
13,0  Elle sort. Je l'attends. Elle me fait un appel de phares.
15,0  Le compteur affiche 4,7 s d'avance. La rue ne s'est jamais arrêtée.
```

### 2 · Ce que je fais du doigt

**UN geste, et un seul : je touche ce qui va poser problème.**

Pas de caméra. Pas de pédale. Pas de menu. Pas de bouton.

Toucher est à la fois le regard, la compréhension et la décision. C'est
exactement la chaîne que tu voulais mesurer, ramenée à un doigt.

Et toucher n'est pas gratuit : **toucher quelque chose d'inoffensif coûte
une seconde**, avec une phrase de quatre mots. « Il ne bougeait pas. »

### 3 · Le moment où je trouve

C'est LE moment, et il dure quatre dixièmes de seconde :

| | |
|---|---|
| **Le son** | tout se coupe net pendant 0,15 s. Le silence, pas un bruit ajouté. Puis une note claire et courte, et la rue revient. |
| **Le temps** | il ne se fige pas, il **se suspend** : 0,08× pendant trois dixièmes. Assez pour que ça claque, trop court pour casser le rythme. |
| **L'image** | tout perd son contraste et sa saturation SAUF ce que j'ai trouvé, qui reste net et coloré. Un anneau fin se referme dessus, une seule fois. |
| **La profondeur** | la mise au point glisse sur lui en deux dixièmes. |
| **Le nombre** | « + 2,8 s » monte depuis l'objet et s'efface. **C'est ma récompense, et elle a un sens dans la vraie vie.** |

### 4 · Le retour de réussite

**Il n'y en a pas d'autre, et c'est voulu.** Pas de « bravo », pas d'étoiles,
pas de carte de fin de scène. Ma voiture ralentit toute seule, le danger se
produit, je passe à côté, et le compteur en haut a grossi. La récompense est
que **rien n'est arrivé**, et que je sais que c'est grâce à moi.

⭐ Un conducteur qui anticipe ne vit jamais d'événement. Le jeu doit apprendre
ça aussi : la conduite réussie est celle dont on ne se souvient pas.

### 5 · Si je rate

Je ne touche rien. À 07,4 s l'homme sort de la camionnette.

```
07,4  Freinage d'urgence, crissement, le carton part au sol.
      ⚠️ Aucun impact montré. L'écran BLANCHIT une demi-seconde et
      le son se coupe net.
08,0  Rembobinage à 0,25×, en marche arrière, jusqu'à 02,8 s.
      La porte s'entrouvre, entourée, en couleur, tout le reste en gris.
      Un seul chiffre : « 4,6 s ».
09,5  Le jeu repart. La rue continue. Aucune phrase, aucun sermon.
```

⭐ Le chiffre du rembobinage, c'est **le temps que j'avais et que je n'ai pas
pris**. C'est la même unité que ma récompense. Un seul nombre pour tout le jeu.

### 6 · Pourquoi je relance

Parce que je sais que j'aurais pu le voir avant. Ce n'est pas « j'ai perdu »,
c'est **« je l'ai vu 2,8 secondes avant, je peux faire 4 »**. C'est la boucle
de GeoGuessr : personne n'y joue pour le score, on y joue pour la sensation
d'avoir trouvé, et le score n'est là que pour prouver qu'on progresse.

Et le nombre veut dire quelque chose dehors. **« Aujourd'hui j'ai pris 12
secondes d'avance »** est une phrase qu'un élève peut répéter à son moniteur.

### 7 · Ce que ça devient au bout de trois jours

Le même run, mais les portes s'ouvrent plus tôt, les indices sont plus fins,
et le bruit utile augmente. La difficulté n'est pas la vitesse : c'est la
**discrétion de l'indice**. Un jeu d'observation se durcit en cachant mieux,
pas en accélérant.

---

## 5. Comparaison, sans complaisance

| | A · Le ralenti | B · Le rush | C · Secondes d'avance |
|---|---|---|---|
| Compréhension en 5 s | 2/5 (deux gestes à découvrir) | **5/5** | **5/5** |
| « JE L'AI VU » | 4/5 | 3/5 | **5/5** |
| Identité propre | 3/5 (c'est du Superhot) | 2/5 (c'est du Puzzle Rush) | **5/5** |
| Apprentissage réel | 3/5 | 4/5 | **5/5** |
| Envie de relancer | 3/5 | **5/5** | 4/5 |
| Densité par minute | 4 situations | **25 situations** | 8 à 10 situations |
| Coût de construction | 🔴 lourd | 🟢 léger | 🟠 moyen |
| Ce qu'on perd | la densité | la continuité, donc l'anticipation | l'angle mort et le contrôle arrière |

---

## 6. Ce que je construirais, et pourquoi c'est PermiGo

> # C — « Secondes d'avance »

**Trois raisons, et la troisième est la seule qui compte.**

**1. Le geste est le produit.** Toucher ce qui va poser problème, c'est
littéralement la chaîne regarder → comprendre → anticiper → décider, ramenée
à un doigt. Aucune commande à apprendre, aucun tutoriel, et rien à manipuler
qui ne soit pas de la conduite.

**2. « Voir, c'est agir » supprime le simulateur.** La voiture se comporte
comme quelqu'un qui a vu. Plus de pédale, plus de volant, plus de caméra.
C'est la réponse définitive à « on dirait un énième jeu de conduite » : on ne
conduit pas, **on voit**.

**3. ⭐⭐⭐ Le score et la pédagogie sont le MÊME nombre.** La seconde
d'avance est à la fois la récompense du joueur, la mesure du produit, et une
phrase qui a du sens sur la route. Aucun jeu d'apprentissage ne peut dire ça :
Duolingo compte des XP qui ne veulent rien dire dehors. **Une seconde d'avance
en jeu est une seconde d'avance en voiture.**

C'est ça, « ah ouais, ça c'est PermiGo ».

### Ce que j'emprunte aux deux autres

- **De A** : le moment de découverte. La suspension, le silence de 0,15 s, la
  décoloration sélective, la mise au point qui claque. C'est le morceau
  premium, et il est court, donc abordable.
- **De B** : la coque. Au bout de deux semaines, un mode « une minute, combien
  de secondes d'avance » avec un meilleur score du jour. Mais **la boucle de
  base reste continue**, sinon on perd l'anticipation longue.

### Ce que je perds, et je le dis

**L'angle mort et le contrôle arrière disparaissent** avec la caméra. C'est
une vraie perte : ce sont deux compétences d'examen. Elles reviendront par un
**rétroviseur** posé en haut de l'écran, qui est de toute façon la bonne
réponse et pas un balayage à 155°. Mais pas dans ce slice.

---

## 7. Les trois questions à trancher avant que j'écrive une ligne

1. **Est-ce que « voir suffit » te convient ?** C'est le pari central : on
   touche, et la voiture fait le reste. L'alternative serait de toucher puis
   de choisir entre deux réactions, mais ça rajoute un geste et une demi-
   seconde de lecture, et je pense que ça tue le rythme.
2. **Combien coûte une fausse alerte ?** Je propose une seconde, et quatre
   mots. Assez pour qu'on ne tape pas partout, pas assez pour qu'on n'ose plus.
3. **La rue continue-t-elle sans fin, ou par manches ?** Je propose une manche
   de 90 secondes, cinq à sept dangers, et un total à la fin. Une rue sans fin
   n'a pas de moment « encore ».
