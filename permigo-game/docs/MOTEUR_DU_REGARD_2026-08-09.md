# Le moteur du regard — taxonomie, preuves, modèle de conduite, vertical slice

> Demandé par Rayan le 09/08/2026 : « attaque ton prototype comme si tu voulais
> le casser ». Suite de [`PROTOTYPE_PAPIER_2026-08-09.md`](PROTOTYPE_PAPIER_2026-08-09.md).
>
> Le concept n'est plus « 12 points ». C'est :
> **REGARDER → COMPRENDRE → ANTICIPER → DÉCIDER**, et PermiGo doit savoir
> distinguer les quatre.

---

## 0. Les quatre failles, et ce qui les ferme

| Faille | Ce qui la ferme |
|---|---|
| Toutes les scènes deviennent « trouve l'indice caché » | Une **taxonomie de 8 types** et une loi de composition qui interdit d'en enchaîner deux du même |
| Le balayage se triche | Le balayage a un **coût**, et la preuve la plus lourde est la **décision suivante**, pas le regard |
| Toute la qualité dépend des points du permis | **Deux registres séparés** : la barre de vie et le modèle de conduite |
| Toutes les scènes durent 5 secondes | La durée est **calculée** à partir de trois horodatages, jamais choisie |

Et une cinquième faille, qui n'était dans aucune des quatre et qui aurait
invalidé tout le test terrain :

> 🔴 **La deuxième exposition ne doit JAMAIS être la même scène.**
> Sinon « il fait mieux la deuxième fois » ne prouve rien : il se souvient que
> la voiture sort derrière la camionnette blanche. On mesurerait la mémoire
> d'une image, pas une compétence. **Chaque scène du slice existe donc en trois
> variantes** qui testent la même compétence avec une surface différente.
> Détail au § 5.

---

## 1. La taxonomie des scènes

Elle est classée par **la nature du problème d'information**, parce que c'est
exactement ce que le moteur peut mesurer.

| | Type | Le problème | Ce que l'élève doit faire | Ce que le moteur mesure | Durée type |
|---|---|---|---|---|---|
| **A** | Information masquée | Le danger existe et il est caché | **Chercher** | Le regard a-t-il couvert la zone d'occlusion | 4 à 5 s |
| **B** | Information visible mal lue | Le danger est en pleine vue, sa signification échappe | **Interpréter** | La décision, pas le regard | 4 à 6 s |
| **C** | Information dynamique | Il faut estimer une évolution, pas lire un état | **Échantillonner dans le temps** | La **durée** d'observation, deux prises minimum | 6 à 8 s |
| **D** | Anticipation | L'indice est en amont de la chaîne causale | **Déduire** | Le délai entre l'indice et le geste | 5 à 7 s |
| **E** | Danger potentiel | Aucun danger n'existe encore, seule sa probabilité est signalée | **Se comporter comme si** | Le comportement, sans aucune découverte | 4 à 5 s |
| **F** | Informations à combiner | Deux informations vraies mènent à deux décisions opposées | **Arbitrer** | Les deux zones ont-elles été consultées | 5 à 6 s |
| **G** | Fausse alerte | Tout crie danger, avancer est la bonne réponse | **Inhiber le réflexe** | A-t-il freiné pour rien | 3 à 5 s |
| **H** | Aucune urgence | Rien ne se passe, le bon comportement est de garder de la marge | **Tenir une distance** | La distance de suivi, la vitesse | 3 à 4 s |

### Le détail, et le piège de chacun

**A — information masquée.** Camionnette, haie, virage, file de voitures
garées. Le seul type où « chercher » est littéralement la mécanique. **Piège :
c'est le type le plus facile à écrire, donc celui qui envahit un catalogue si
personne ne surveille.** Plafond dur : **jamais plus de 3 sur 10**.

**C — dynamique** et **D — anticipation** se ressemblent et sont deux choses
différentes. En C, l'information **change sous les yeux** et il faut l'intégrer
dans le temps : la voiture qui grossit dans le rétroviseur, c'est une
*estimation de vitesse*, et un coup d'œil de 0,2 s ne peut mathématiquement pas
la produire, il faut deux échantillons. En D, l'information est **complète dès
la première image** mais elle est **en amont** : les feux stop deux voitures
plus loin, c'est une *déduction*. Un coup d'œil suffit, encore faut-il regarder
au bon endroit, c'est-à-dire loin. **C entraîne la durée du regard, D entraîne
la portée du regard.** Les deux méritent d'exister.

**E — danger potentiel** est le type le plus important du catalogue et le moins
spectaculaire. Le bus scolaire dont aucun enfant ne sort. La file de voitures
garées dont aucune ne démarre. La balle qui ne roule jamais. **La bonne réponse
n'est vérifiable par aucune découverte** : elle est dans le comportement, lever
le pied et s'écarter, alors qu'il ne se passera rien. C'est la définition même
de la conduite défensive, et c'est ce qu'aucune application de code n'enseigne,
parce qu'un QCM ne sait pas noter une prudence qui n'a rien empêché.

**F — combinaison.** Feu orange plus voiture collée derrière. Piéton engagé
plus deux-roues qui remonte. **Il n'existe pas de bonne réponse, seulement une
moins mauvaise, et elle dépend de l'information prise.** C'est le seul type à
crédit partiel.

**G — fausse alerte.** Le giratoire où l'autre sort. Le piéton qui recule. Le
bus dont les warnings signalent une livraison. **Sans ce type, la stratégie
gagnante du joueur devient « dans le doute je freine », et on fabrique des
conducteurs hésitants** — un défaut d'examen aussi éliminatoire que la
précipitation. G est le contrepoison de A.

**H — aucune urgence.** Route droite, rien devant, une voiture à cinquante
mètres. La bonne réponse est de ne rien faire de spécial et de garder deux
secondes d'écart. **C'est le type qui apprend au joueur que le jeu ne cache pas
toujours quelque chose**, et c'est aussi celui qui donne le rythme : après une
scène de type C à sept secondes, une H à trois secondes fait respirer.

### 🆕 Le type que j'ajoute, et que je ne construirais pas tout de suite

**I — l'information déjà passée.** Un panneau lu il y a six secondes s'applique
encore. Une limitation, une interdiction de dépasser, un rappel de priorité.
La compétence est la **mémoire de la signalisation**, et elle est un vrai motif
d'échec à l'examen. Je la sors du slice parce qu'elle demande des scènes plus
longues et qu'elle risque de se confondre avec un test de mémoire pure, ce qui
n'est pas le sujet du jeu. À rouvrir quand les huit premiers types tiennent.

### La loi de composition d'une manche de dix scènes

```
Jamais deux scènes du même type à la suite.
Au moins un G ou un H parmi les CINQ premières  ← l'heuristique se forme tôt
Au plus 3 scènes de type A sur 10
Au moins 1 E, 1 G, 1 H sur 10
Alternance des durées : jamais deux scènes de plus de 6 s à la suite
```

Composition cible d'une manche : **A×2 · B×2 · C×1 · D×1 · E×1 · F×1 · G×1 ·
H×1.** Le sélecteur du § 3 a le droit de dévier pour cibler une faiblesse, mais
jamais de violer les quatre lois ci-dessus.

### Le garde-fou mesurable : le taux de freinage stérile

> **Sur les scènes G et H, quelle proportion de joueurs freine ?**

Si ce taux monte au fil des manches, **le jeu est en train d'enseigner la peur
au lieu de la lecture**, et c'est une régression produit, pas une statistique
d'usage. Cible : sous 25 % à la dixième manche. C'est le seul chiffre qui
détecte que la taxonomie a dérivé, et il doit vivre dans le tableau de bord au
même titre que la rétention.

---

## 2. Regardé ≠ vu ≠ compris

### Les cinq niveaux de preuve

| | Niveau | Ce qu'on constate | Trichable ? |
|---|---|---|---|
| 1 | **Balayé** | L'angle de caméra est passé sur la zone | 🔴 Oui, trivialement |
| 2 | **Vu** | La cible est restée dans le champ assez longtemps, pendant sa fenêtre utile, sans occlusion | 🟠 Difficilement |
| 3 | **Désigné** | Il a touché l'élément | 🟢 Non, mais coûteux à demander |
| 4 | **Interprété** | Sa décision suivante n'a de sens que s'il l'a compris | 🟢 **Non** |
| 5 | **Anticipé** | Son geste a commencé **avant** le seuil d'évidence | 🟢 **Non** |

**Le poids doit être sur 4 et 5.** Un moteur qui note le niveau 1 note un geste
de pouce. Un moteur qui note le niveau 4 note une compréhension. Le regard ne
sert pas à donner des points, il sert à **expliquer** un résultat : c'est lui
qui permet de dire « tu es passé, tu ne pouvais pas savoir », et cette phrase
est la raison d'être du produit.

### Pourquoi une règle ne suffit pas, et ce qui marche vraiment

On ne bat pas le balayage métronomique avec une contre-mesure. On le bat avec
un **coût**.

> ⭐⭐⭐ **En portrait, le champ horizontal fait une trentaine de degrés.
> Regarder à droite, c'est ne plus voir devant. Le balayage systématique n'est
> pas une triche gratuite : c'est une conduite les yeux ailleurs.**

Le joueur qui balaie en permanence **rate les scènes de type D**, où l'indice
est loin devant, et les scènes de type C, où il faut *rester* sur la cible. La
taxonomie est elle-même l'anti-triche. C'est plus solide que n'importe quel
détecteur, parce que ça ne se contourne pas : ça se corrige en conduisant mieux.

### Les quatre verrous, tous invisibles

**1. La fenêtre utile.** Chaque indice déclare `t_apparition` et `t_evident`.
Un regard ne compte que dans cet intervalle. Après `t_evident`, ce n'est plus
de l'observation, c'est de la réaction.

**2. Le temps de fixation minimum**, propre à la nature de l'information :

| Information | Fixation minimale | Pourquoi |
|---|---|---|
| Un objet statique (ombre, roue, ballon) | **250 ms** | Une fixation oculaire ordinaire |
| Une intention (piéton, regard, posture) | **400 ms** | Il faut lire une posture, pas un objet |
| Une vitesse (véhicule qui approche) | **700 ms** | ⭐ Deux échantillons minimum : une vitesse ne se lit pas, elle se dérive |
| Un clignotant, un feu stop | **200 ms** | Contraste fort, lecture immédiate |

Un balayeur métronomique passe environ 100 ms par zone. **Il déclenche le
niveau 1 et jamais le niveau 2.** Aucune règle n'a été écrite pour lui.

**3. L'occlusion compte.** La cible doit être géométriquement visible depuis la
position de l'œil au moment du regard. Regarder vers la voiture *à travers* la
camionnette ne vaut rien, et le moteur le sait déjà puisqu'il a une vraie 3D.

**4. La cohérence de la décision.** C'est le verrou principal. Freiner devant
une camionnette sans jamais avoir regardé dessous donne **la bonne action et
zéro observation** : la case en bas à gauche de la matrice, celle qui déclenche
« tu es passé, tu ne pouvais pas savoir ».

### Ce que le joueur ne voit jamais

Pas de jauge de regard. Pas de zone qui s'allume quand on la survole. Pas de
« +1 observation ». **La preuve doit rester invisible**, sinon elle devient une
mécanique à optimiser, et on aura fabriqué un jeu de balayage.

La seule chose que le joueur voit, c'est **une phrase à la fin d'une scène**,
et cette phrase change selon la case de la matrice. C'est tout.

---

## 3. Deux registres séparés

### Registre 1 — la barre de vie

Les 12 points. **Elle ne sert qu'à une chose : donner une fin à la manche.**
Elle bouge uniquement sur des infractions réelles, au barème officiel vérifié.
Elle ne mesure aucune compétence et ne doit jamais prétendre le contraire.

### Registre 2 — le modèle de conduite

Quatre axes, chacun découpé en sous-compétences, chacune estimée en continu.

```
OBSERVATION
  ├── balayage à droite avant engagement
  ├── balayage à gauche avant engagement
  ├── contrôle d'angle mort (au-delà du rétroviseur)
  ├── regard lointain (au-delà du véhicule suivi)
  └── contrôle arrière (rétroviseur intérieur)

ANTICIPATION
  ├── piétons et intentions
  ├── véhicules masqués
  ├── variations de vitesse du flux
  ├── dangers potentiels (bus, écoles, stationnement)
  └── évolution d'une trajectoire (giratoire, insertion)

DÉCISION
  ├── priorités
  ├── insertion et engagement
  ├── dépassement et changement de voie
  ├── allure (trop rapide / trop prudente)
  └── arbitrage sous informations contradictoires

TIMING
  ├── précocité du ralentissement
  ├── franchise du geste (a-t-il vraiment freiné ou hésité)
  └── stabilité (pas de correction tardive)
```

**Dix-huit sous-compétences. Le joueur n'en voit aucune.** Le moteur les
connaît toutes.

### La mise à jour, et pourquoi elle est prudente

Chaque tentative produit un signal entre 0 et 1 sur les sous-compétences que la
scène touche. La note évolue en moyenne mobile dont le pas décroît :

```
note ← note + k(n) × (signal − note)      avec k(n) = 1 / (3 + n)
```

`n` est le nombre d'observations sur cette sous-compétence. Une première
tentative pèse un tiers, la vingtième pèse un vingt-troisième. **Tant que
n < 4, la sous-compétence est marquée « inconnue » et n'a pas le droit de
déclencher un jugement affiché.** Un joueur qui rate un angle mort une fois
n'est pas « faible en angle mort ».

Les mots *fort / moyen / faible* sont un affichage, jamais un stockage :
`≥ 0,7` · `0,4 à 0,7` · `< 0,4`.

### À quoi ça sert vraiment : choisir la scène suivante

C'est la seule raison d'exister du modèle.

```
1. Prendre les sous-compétences FAIBLES ou INCONNUES, les plus anciennes d'abord
2. Filtrer par les quatre lois de composition (§ 1)
3. Interdire la variante déjà vue dans les 2 dernières manches
4. Une chance sur cinq : tirer une scène FORTE, pour ne pas transformer
   la manche en séance de rattrapage
```

Et un rappel espacé : une sous-compétence ratée revient après **2 scènes**,
puis **5**, puis **12**, puis **une manche plus tard**.

### Deux exemples qui prouvent que les registres sont bien séparés

| Situation | Barre de vie | Modèle de conduite |
|---|---|---|
| Feu orange : il regarde le rétroviseur, voit la voiture collée, décide de passer | **−4 points** | Observation **excellente**, arbitrage à revoir |
| Sortie de stationnement : il ne voit rien, l'autre le percute | **0 point perdu** (il n'est pas en tort) | Observation **échouée**, anticipation **échouée** |

> ⭐ Un joueur peut finir à 8 points avec une conduite dangereuse, et à 0 point
> avec un excellent regard. **Les deux chiffres ne racontent pas la même
> histoire, et c'est pour ça qu'il en faut deux.**

### Ce qu'on montre, à la fin

Pas dix-huit barres. **Une phrase, la sous-compétence la plus faible, et une
chose à faire demain dans la vraie voiture.** Et une fois par semaine, une
carte de signature : trois forces, deux fragilités, et rien d'autre.

---

## 4. Le rythme n'est pas un réglage, c'est un calcul

Une scène ne dure pas cinq secondes. Elle dure ce que sa propre chronologie
impose. L'auteur d'une scène déclare **trois horodatages**, et la durée en
découle.

| | | |
|---|---|---|
| `t0` | Le début de la scène | L'instant où l'information devient physiquement disponible |
| `t_evident` | Le seuil d'évidence | L'instant où le danger devient impossible à manquer |
| `t_limite` | Le point de non-retour | Le dernier instant où une action change encore l'issue |

```
durée de la scène = t_limite + 1,2 s de conséquence
fenêtre d'anticipation = t_evident − t0        ← LA variable de design
```

**La fenêtre d'anticipation est la qualité de la scène.** Trop courte, on teste
des réflexes. Trop longue, on s'ennuie. Valeurs cibles par type :

| Type | Fenêtre d'anticipation | Durée totale |
|---|---|---|
| H — aucune urgence | *(pas de danger)* | 3 à 4 s |
| G — fausse alerte | 1,5 à 2 s | 3 à 5 s |
| A — masquée | 2 à 3 s | 4 à 5 s |
| B — mal interprétée | 2,5 à 3,5 s | 4 à 6 s |
| E — potentielle | 2 à 3 s | 4 à 5 s |
| F — combinaison | 2,5 à 3 s | 5 à 6 s |
| D — anticipation | **4 à 5 s** | 5 à 7 s |
| C — dynamique | **5 à 6 s** | 6 à 8 s |

**Une scène peut commencer avant qu'aucun danger n'existe.** En type E, `t0`
est l'instant où le bus devient visible, et il ne se passera jamais rien. La
scène est bonne quand même.

### Trois choses que le chrono n'a pas le droit de faire

1. **Interrompre une scène parce que le temps est écoulé.** Ne pas agir *est*
   une décision, et c'est la plus fréquente dans la vraie vie. On n'affiche
   jamais « temps écoulé », on montre la conséquence de n'avoir rien fait.
2. **Raccourcir une scène de type C ou D pour tenir le rythme.** Si la manche
   est trop longue, on retire une scène, on n'en comprime pas une.
3. **Imposer le même tempo à tout le monde.** Un joueur qui progresse voit les
   fenêtres se resserrer de 10 % tous les cinq jours. C'est une montée en
   difficulté invisible, et c'est mieux qu'un choix de difficulté au menu.

---

## 5. Le vertical slice — trois scènes, trois compétences

**Périmètre exact :** trois scènes. Pas de menu, pas de progression, pas de
boutique, pas de monde, pas de barre de vie. Une seule boucle :

```
SCÈNE → JE CHERCHE → JE COMPRENDS → J'AGIS → CONSÉQUENCE → SCÈNE SUIVANTE
```

Après la troisième, un bouton **ENCORE**, et on recommence avec **d'autres
variantes**.

### 🔴 Le principe des variantes, et pourquoi tout en dépend

Le critère final de Rayan est : *est-ce que leur comportement change entre la
première et la deuxième tentative ?* Si la deuxième tentative rejoue la même
image, un joueur peut y répondre parfaitement **sans avoir appris à regarder** :
il se souvient de la réponse. On aurait mesuré une mémoire épisodique et conclu
à un apprentissage. **C'est la façon la plus probable de se mentir sur ce
prototype.**

Donc chaque scène existe en **trois variantes** qui partagent la compétence et
changent tout le reste :

- le **côté** (droite / gauche)
- le **véhicule masquant** (camionnette / camion-benne / haie taillée)
- le **moment** d'apparition de l'indice (± 1,2 s)
- **s'il se passe quelque chose ou non** ⭐ : une variante sur trois est une
  **fausse alerte** (type G). Rien ne sort de derrière la camionnette. Sans
  cette variante, « ralentir systématiquement » réussit trois fois sur trois et
  le slice ne mesure plus rien.

Le tirage garantit qu'une variante déjà vue ne revient pas dans la même session.

---

### 🟣 Scène 1 — OBSERVER · la camionnette et la priorité masquée

**Type A — information masquée** (variante γ : type G)

| | |
|---|---|
| **Décor** | Rue étroite, intersection sans panneau à ~45 m. Camionnette blanche garée à droite, 6 m avant la ligne. |
| **Compétence testée** | Observation → *balayage à droite avant engagement* · Anticipation → *véhicules masqués* |
| **Information cachée** | Une berline arrive par la transversale, de la droite. Priorité à droite. |
| **Indices** | ⭐ Une **ombre qui glisse au sol** sous la camionnette · un bout de roue · le reflet dans une vitrine en face |
| **Geste attendu** | Balayer à droite (≥ 35°, ≥ 250 ms) **puis** freiner |
| **`t0`** | 0,0 s — la camionnette entre dans le champ, l'ombre est déjà là |
| **`t_evident`** | 2,8 s — le capot de la berline dépasse de la camionnette |
| **`t_limite`** | 4,1 s — au-delà, freiner ne suffit plus |
| **Durée** | **5,3 s** |
| **Si erreur** | Choc latéral. Rembobinage qui **surligne l'ombre au sol** à t = 1,4 s. |
| **Variantes** | α droite / camionnette / t_evident 2,8 — β **gauche** / camion-benne / t_evident 3,6 — γ droite / haie / **personne ne vient** |

---

### 🟣 Scène 2 — CONTRÔLER · le cycliste dans l'angle mort

**Type E — danger potentiel** (l'indice est sonore, pas visuel)

| | |
|---|---|
| **Décor** | Intersection à droite, clignotant droit déjà mis, voie libre devant. |
| **Compétence testée** | Observation → *contrôle d'angle mort* · Timing → *franchise du geste* |
| **Information cachée** | Un cycliste remonte le long de la voiture, par la droite. |
| **Indices** | ⭐ Le **cliquetis d'un dérailleur** · une ombre qui file le long de la portière |
| **Geste attendu** | Balayer **au-delà de 60°** — le rétroviseur seul ne suffit pas, et le moteur fait la différence |
| **`t0`** | 0,0 s — le son commence, le cycliste est encore derrière |
| **`t_evident`** | 3,2 s — le vélo arrive à hauteur de la vitre arrière |
| **`t_limite`** | 4,4 s — début du braquage |
| **Durée** | **5,6 s** |
| **Si erreur** | On lui coupe la route, le vélo tombe. Rembobinage sur l'ombre le long de la portière. |
| **Variantes** | α cycliste / droite — β **scooter** / droite / plus rapide — γ **rien ne remonte**, tourner est correct |

> ⭐ Cette scène est la seule du slice dont l'indice principal est **sonore**.
> Elle vérifie au passage une chose qu'on ne saura pas autrement : **est-ce que
> les élèves jouent avec le son ?** Si la réponse est non, tout un pan de la
> conception tombe, et il vaut mieux le savoir sur trois scènes que sur cent.

---

### 🟣 Scène 3 — ANTICIPER · le freinage lu deux voitures plus loin

**Type D — anticipation** (la scène clé du slice)

| | |
|---|---|
| **Décor** | On suit une berline grise d'un peu trop près. Route droite, deux voies. |
| **Compétence testée** | Observation → *regard lointain* · Anticipation → *variations de vitesse* · Timing → *précocité* |
| **Information** | **Aucune information cachée.** Elle est en pleine vue, mais **loin**. |
| **Indices** | ⭐ Par-dessus la berline, les **feux stop d'un troisième véhicule** s'allument |
| **Geste attendu** | Lever le pied **avant** que la berline freine |
| **`t0`** | 0,0 s |
| **Apparition de l'indice** | 1,1 s — les feux lointains s'allument |
| **`t_evident`** | 5,4 s — la berline freine à son tour |
| **`t_limite`** | 6,6 s |
| **Durée** | **7,1 s** — ⭐ **la scène la plus longue du slice, et c'est le sujet** |
| **Si erreur** | Choc arrière. Plan latéral montrant les trois véhicules et l'espace absent. |
| **Variantes** | α trois voitures / 1,1 s — β **un bus** qui masque plus / indice à 0,7 s — γ **les feux s'allument et rien ne ralentit** (fausse alerte) |

> ⭐⭐⭐ **C'est la scène qui produit le chiffre le plus important du projet.**
> La marge d'anticipation `t_evident − t_action` est ici directement lisible :
> un joueur qui lève le pied à 1,9 s a **+3,5 s** de marge, un joueur qui
> freine à 5,9 s en a **−0,5**. Entre les deux, il y a tout le produit.

### La boucle, écran par écran

```
[ un seul bouton ]
   ↓
SCÈNE  (la voiture avance seule, le pouce regarde, maintient, désigne)
   ↓
CONSÉQUENCE  (1,2 s : soit on passe, soit le rembobinage surligne l'indice)
   ↓
UNE PHRASE  (celle de la case de la matrice)
   ↓
SCÈNE SUIVANTE
   ↓
après 3 scènes :  [ ENCORE ]  →  autres variantes
```

Rien d'autre. Pas de score affiché pendant le slice : **on veut mesurer si la
scène seule donne envie de rejouer**, et un score contaminerait la réponse.

---

## 6. L'instrumentation

### Le journal d'une tentative

```jsonc
{
  "session": "uuid",            // un élève, un après-midi
  "manche": 2,                  // la 2e fois qu'il enchaîne les 3 scènes
  "scene": "camionnette",
  "variante": "beta",
  "exposition": 2,              // 2e fois qu'il rencontre CETTE compétence
  "type": "A",

  "regard": [                   // 10 Hz, ~55 échantillons pour 5,5 s
    { "t": 0.0, "angle": 0.0 },
    { "t": 0.1, "angle": -0.04 }
  ],

  "zones": [
    { "id": "sous-camionnette",
      "premierRegard": 1.62,    // s après t0
      "dureeCumulee": 0.41,     // s dans le champ, sans occlusion
      "distanceAuDanger": 31.4, // m au premier regard
      "avantEvidence": true,
      "niveauAtteint": 2 }      // 1 balayé · 2 vu · 3 désigné
  ],

  "actions": [
    { "t": 2.31, "type": "frein", "intensite": 0.7, "duree": 1.4 }
  ],

  "chronologie": {
    "t0": 0, "indice": 0.0, "evident": 2.8, "limite": 4.1,
    "debutRalentissement": 2.31,
    "margeAnticipation": 0.49   // evident − action ; NÉGATIF = subi
  },

  "decision": "ralentir",
  "issue": "evite",
  "verdict": "vu_et_bien_decide",   // les 4 cases de la matrice
  "pointsPerdus": 0,

  "apres": { "rejoueImmediatement": true, "delaiAvantEncore": 1.9 }
}
```

### Les métriques dérivées, celles qu'on regarde vraiment

| Métrique | Formule | Ce qu'elle dit |
|---|---|---|
| ⭐⭐⭐ **Marge d'anticipation** | `t_evident − t_action` | Positive = il a anticipé. Négative = il a subi. **C'est la métrique nord du produit.** |
| **Delta d'exposition** | `marge(exp 2) − marge(exp 1)` | **Le seul chiffre qui prouve que le moteur enseigne.** |
| **Taux de découverte précoce** | zones vues avant `t_evident` / zones utiles | Regarde-t-il, ou réagit-il ? |
| **Taux de balayage stérile** | temps de regard hors zones utiles / temps de regard | Détecte le métronome |
| **Taux de freinage stérile** | freinages sur scènes G et H | Détecte que le jeu enseigne la peur |
| **Rejeu spontané** | `rejoueImmediatement` | Envie, mesurée et pas déclarée |

### Où ça vit

D'abord **en local**, dans IndexedDB, sans compte et sans réseau : le test
terrain se fait sur un téléphone posé sur une table, et rien ne doit dépendre
d'une connexion. Export en un fichier JSON par élève. La table Supabase
`essais_regard` viendra **après** que le slice ait prouvé quelque chose, avec
RLS dès la première migration.

---

## 7. Le protocole de test terrain

### Le déroulé

1. **Aucune explication. Aucun tutoriel.** On tend le téléphone : « tiens ».
2. On filme **l'écran et le pouce**, pas le visage.
3. On se tait. Aucune aide, même s'il galère. Surtout s'il galère.
4. Manche 1 : variantes α. Manche 2 : variantes β. Manche 3 s'il la demande :
   variantes γ, dont les fausses alertes.
5. **On ne propose jamais de rejouer.** On attend. Le silence est la mesure.
6. Entretien **après**, jamais pendant : « raconte-moi ce qui s'est passé »,
   puis « qu'est-ce que tu aurais dû regarder ? »
7. Ordre des trois scènes contrebalancé entre les élèves.

**Échantillon : 10 élèves**, dont au moins 3 qui ont déjà échoué à l'examen et
3 qui n'ont jamais joué à un jeu vidéo.

### Les six questions, rendues falsifiables

| La question de Rayan | Le seuil |
|---|---|
| Comprennent-ils sans tutoriel ? | **≥ 7/10** balaient spontanément avant la fin de la scène 2 |
| Regardent-ils davantage après une erreur ? | Le taux de découverte précoce monte de **≥ 20 points** entre la scène ratée et la suivante |
| Anticipent-ils plus tôt à la 2e exposition ? | **Delta d'exposition médian ≥ +0,4 s** |
| Ont-ils envie de refaire ? | **≥ 6/10** relancent sans qu'on le propose |
| Savent-ils dire ce qu'ils auraient dû observer ? | **≥ 7/10** nomment l'indice exact |
| ⭐ **Leur comportement change-t-il ?** | **Delta d'exposition ≥ +0,4 s ET taux de découverte précoce en hausse** |

### Le groupe témoin, parce qu'il faut vraiment essayer de se casser

> ⭐⭐ Cinq élèves supplémentaires ne jouent pas. On leur dit simplement, une
> fois : **« avant chaque intersection, tourne la tête à droite. »** Puis on
> leur fait passer les mêmes scènes une seule fois.

**Si une phrase de dix mots produit le même résultat que le jeu, le jeu est une
décoration.** C'est peu coûteux à mesurer et ça peut nous éviter des mois de
travail. Je préfère poser la question maintenant.

### Les critères d'arrêt

- ✅ **On continue** si le delta d'exposition est positif et si les élèves
  relancent.
- 🟠 **On réécrit les scènes** si les élèves relancent mais n'anticipent pas
  mieux : le problème est éditorial, pas mécanique.
- 🔴 **On arrête** si le delta est nul ou négatif chez plus de la moitié.
  On aura un beau jeu, et ce n'est pas ce qu'on construit.

---

## 8. Là où ce design peut encore casser

Trois choses que ce document ne résout pas, et qu'il faut avoir en tête.

**1. Un écran n'est pas un pare-brise.** Le champ d'un téléphone en portrait
fait une trentaine de degrés, celui d'un conducteur en fait près de cent
quatre-vingts. **On n'entraîne pas un mouvement de tête, on entraîne une
habitude de vérification.** C'est déjà beaucoup, mais il ne faut pas prétendre
autre chose, et il faut absolument doubler chaque manche d'une consigne réelle
(« demain, avant chaque intersection ») pour que le transfert ait une chance.

**2. On entraîne une recherche à l'écran, qui n'est pas une recherche visuelle
routière.** C'est la limite connue des tests de perception du danger. Ils ont
malgré tout un effet mesuré, ce qui suggère que la partie transférable est le
**modèle mental du risque**, pas le geste oculaire. Notre pari est là, et il
doit rester explicite.

**3. Le risque reste éditorial.** Huit types, dix-huit sous-compétences et
trois variantes par scène, cela veut dire que **le catalogue est le produit**.
Écrire une bonne scène reste une heure de travail de moniteur. La taxonomie ne
fait que garantir qu'on n'écrira pas cent fois la même.

---

## Ce qui reste à décider avant de construire

1. **Le son est-il obligatoire ?** La scène 2 en dépend. Le test le dira.
2. **La désignation (toucher un élément) entre-t-elle dans le slice ?** Mon
   avis : non. Deux gestes, balayer et freiner, suffisent à mesurer les trois
   compétences, et chaque geste ajouté est un tutoriel de plus.
3. **Combien de variantes réellement construites ?** Trois par scène, soit neuf
   configurations, dans un seul décor. C'est le minimum pour que la deuxième
   exposition veuille dire quelque chose.
