# Le vertical slice — ce qui est construit, et ce que le construire a appris

> Demandé par Rayan le 09/08/2026 : « COMPLEXE DERRIÈRE. ÉVIDENT DEVANT. »
> Suite de [`MOTEUR_DU_REGARD_2026-08-09.md`](MOTEUR_DU_REGARD_2026-08-09.md).
>
> **Adresse : `#/slice`** · sans compte · rien n'est envoyé nulle part.

---

## 0. Ce que le joueur voit

Un bouton. Une rue. Son pouce.

Pas de score, pas de points, pas de barre de vie, pas de progression, pas de
boutique, pas de tutoriel, pas de menu, pas de retour à l'accueil. Une phrase
courte entre deux scènes, et encore, seulement dans deux des trois versions.

Tout le reste est derrière.

---

## 1. Les trois expériences, dans une adresse

```
#/slice?regard=gyro&action=designer&retour=minimal
```

| Axe | Versions |
|---|---|
| **TEST 1 · comment on regarde** | `swipe` le pouce glisse · `gyro` on tourne le téléphone · `hybride` le téléphone puis le pouce |
| **TEST 2 · comment on ralentit** | `freinBas` maintenir en bas · `maintien` maintenir n'importe où · `designer` aucune pédale, on touche le danger |
| **TEST 3 · ce qu'on raconte** | `toujours` une phrase à chaque fois · `erreur` une phrase si erreur · `minimal` presque aucun texte |

Trois façons de changer de version, de la plus faible à la plus forte : les
valeurs par défaut, la roue dentée de l'écran d'accueil, **l'adresse**. On
passe d'une version à l'autre en envoyant un lien, sans rien réinstaller.

**Tous les seuils sont dans un seul fichier**, [`src/game/slice/reglages.js`](../src/game/slice/reglages.js),
et aucun n'est une loi du produit :

```
seuilObservationInitial   objet 250 ms · intention 400 ms · vitesse 700 ms · feu 200 ms
delaiReactionInitial      1,6 s
deltaExpositionAttendu    +0,4 s
freinageSterileMax        25 %
angleRegardMax            1,15 rad (la scène peut le relever)
```

---

## 2. Ce que construire a appris, et que le document ne savait pas

### 🔴 1. La preuve par le regard ne marche pas pour tout

Le document disait : « il a vu si son regard est passé dessus assez
longtemps ». En le construisant, le banc d'essai a montré que cette règle
**crédite un joueur qui ne bouge jamais le pouce**, parce que la moitié des
informations sont droit devant.

Et une information droit devant mais LOIN — les feux stop d'un camion deux
véhicules plus loin — ne peut pas se prouver par la direction du regard :
**un téléphone n'a pas de profondeur de regard.** Regarder la malle de la
voiture qu'on suit et regarder cinquante mètres devant, c'est la même image.

Il y a donc deux preuves, et chaque information dit laquelle la concerne :

| | Preuve | Ce qui compte |
|---|---|---|
| **regard** | Il a tourné la tête **avant** que ça arrive dans l'axe | l'antériorité |
| **reaction** | C'était droit devant. Seul le **délai** entre l'apparition et le geste parle | 1,6 s |

### 🔴 2. Un angle mort demande 155°, pas 110°

Simulation numérique de la scène du vélo, hors navigateur : **le vélo reste
entre 137° et 165° pendant toute la scène.** À 110° d'amplitude il est
physiquement invisible, et la scène ne mesurait rien du tout.

Conséquence directe, et c'est la question la plus dure du TEST 1 :

- **au pouce**, 155° demandent plus d'un écran de glissement
- **au gyroscope**, il faudrait tourner physiquement le téléphone de 65°

> ⭐⭐⭐ Si aucune des trois versions ne rend ce geste naturel, la réponse
> n'est pas un réglage. C'est un **rétroviseur**. Et il vaut mieux le
> découvrir sur trois scènes que sur cent.

### ⭐ 3. Le coût du balayage est réel, et il se mesure

Même scène, même moteur, deux joueurs :

| | Temps passé sur les feux stop du camion |
|---|---|
| Joueur qui regarde droit devant | **3,95 s** |
| Joueur qui balaie à droite | **0,93 s** |

Le champ d'un téléphone en portrait fait une trentaine de degrés : **regarder
à droite, c'est ne plus voir devant.** Le balayage métronomique n'est pas une
triche gratuite, c'est une conduite les yeux ailleurs, et le banc d'essai le
chiffre sans qu'aucune règle ait eu à être écrite contre lui.

### ⭐ 4. Aucun instant de référence n'est écrit à la main

Trois horodatages, tous **mesurés** pendant la partie :

| | |
|---|---|
| `connaissable` | le premier instant où, en tournant la tête à fond, il aurait pu le voir |
| `evident` | le premier instant où c'est dans l'axe de la voiture, sans rien faire |
| `critique` | le premier instant où ça arrive à portée de tôle **en se rapprochant** |

La marge d'anticipation est `référence − instant du geste`. Écrite à la main,
elle aurait été fausse dès qu'on déplace une voiture de deux mètres.

### ⭐ 5. La bonne variante du vélo, c'est le SILENCE

α a un cliquetis de dérailleur. **β n'a aucun son.** Même compétence, même
geste, et comparer les deux répond tout seul à une question qu'aucun
questionnaire ne tranchera : **est-ce que les élèves jouent avec le son, et
est-ce que l'indice sonore sert vraiment à quelque chose ?**

---

## 3. Les bugs que le banc d'essai a trouvés, et qu'un œil n'aurait pas vus

Tous les quatre produisaient des chiffres parfaitement crédibles.

| Ce qui se passait | Pourquoi c'est grave |
|---|---|
| Les acteurs démarraient **à l'arrêt** et mettaient 2 s à prendre leur allure | La berline passait DERRIÈRE le joueur. Le banc enregistrait « aucun danger », dix fois de suite. |
| Le vélo démarrait **à deux mètres** du joueur | Les deux boîtes se touchaient dès la première image. Choc instantané, scène morte. |
| L'instant critique tombait à **0,05 s** | Le vélo commence derrière : il était « à moins de six mètres » dès le départ. Toute la marge d'anticipation de la scène partait à la poubelle. Réglé : il faut aussi que ça se **rapproche**. |
| Un virage comptait comme **un freinage** | La voiture ralentit d'elle-même pour tourner. Toute scène avec un virage était notée « il a ralenti », y compris pour un joueur qui n'avait pas touché l'écran. |

Et deux règles qui punissaient le bon comportement :

- **Un élève à l'arrêt** qui laisse un vélo se faufiler le long de sa portière
  était noté « trop près ». L'écart d'un mètre est une règle de dépassement.
- **Sur une scène où il ne se passe rien**, aucun objet ne peut prouver qu'il
  a regardé : « il a vu qu'il n'y avait personne » ne se mesure pas. Ce qui se
  mesure, c'est **le geste**. Les scènes de fausse alerte déclarent donc un
  contrôle (`{ cote, angleMin, avant }`), et le geste vaut preuve.

---

## 4. Ce que le banc d'essai vérifie, automatiquement

Dix scènes rejouées par deux pilotes caricaturaux, sans main humaine.

| Pilote | Ce qu'il fait | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| **passif** | rien du tout | choc sur les 7 scènes à danger · réussite sur les 3 fausses alertes | ✅ 10/10 |
| **attentif** | il vise, puis il lève le pied | « vu et bien décidé » avec une marge positive | ✅ 6 scènes sur 7, marges de **+0,50 s à +2,30 s** |

Zéro erreur de console sur toutes les passes.

> ⚠️ Ce banc mesure des **chiffres de moteur**, jamais des images par seconde :
> un navigateur sans écran tourne à quatre images par seconde, et la
> simulation avance cinq fois moins vite que la montre.

---

## 5. Comment on fait passer le test

1. **Un lien par version.** `#/slice?regard=swipe&action=freinBas&retour=toujours`
   pour le premier élève, une autre combinaison pour le suivant.
2. **On tend le téléphone. On ne dit rien.** Aucune explication, aucun
   tutoriel, aucune aide, surtout s'il galère.
3. Trois scènes, puis un seul bouton **Encore**. On ne le propose jamais à
   voix haute : **le délai avant l'appui est la mesure de l'envie.**
4. **À la troisième manche, une scène qu'il n'a jamais vue tombe sans
   prévenir** : autre rue, autre sens d'arrivée, autre silhouette de masque,
   autre véhicule. C'est la seule mesure qui sépare la mémoire
   (« la dernière fois il y avait une voiture derrière la camionnette ») de
   l'apprentissage (« quand je ne vois pas, je cherche avant de m'engager »).
5. À la fin : roue dentée → **Exporter les mesures** → un fichier JSON par
   élève.

Tout vit en local dans le navigateur. Pas de compte, pas de réseau, pas de
donnée personnelle, pas de bandeau cookies (il est retiré sur cette page : il
mangeait le tiers bas de l'écran, c'est-à-dire la zone de frein).

---

## 6. Ce qu'on lit dans l'export

```jsonc
{
  "verdict": {
    "cas": "vu_juste",        // les 4 cases de la matrice
    "marge": 2.20,            // ⭐ référence − instant du geste
    "reference": 2.27,        // mesurée, jamais écrite
    "evident": null, "critique": 3.08, "connaissable": 0.02
  },
  "mesures": {
    "tAction": 0.07, "premierBalayage": 0.13, "amplitudeRegard": 0.72,
    "balayageSterile": 0.38,  // du regard dépensé là où il n'y avait rien
    "regard": [ { "t": 0.1, "a": -0.04 } ]   // 10 Hz
  },
  "zones": [ { "id": "berline", "niveau": 2, "premierRegard": 0.18, "dureeCumulee": 1.35 } ]
}
```

Et le bilan calcule tout seul : **delta d'exposition** (marge gagnée entre la
1re et la 2e rencontre d'une compétence, par famille), taux de découverte
précoce, balayage stérile, **freinage stérile** sur les scènes où il ne se
passe rien, rejeu spontané, et le résultat de la scène de transfert.

---

## 7. Ce qui reste ouvert

- **Le gyroscope n'a pas pu être vérifié ici.** Il demande un vrai téléphone
  et une autorisation qui ne s'obtient qu'à la suite d'un geste. Le code
  affiche un bandeau rouge si le téléphone ne répond pas : 🔴 un test terrain
  où le gyroscope est muet et où personne ne le voit produit des chiffres qui
  ressemblent à des vrais.
- **La variante β de la camionnette** (branche W) donne le bon verdict mais ne
  crédite pas encore l'observation. Réglage de géométrie, pas de mécanique.
- Le tableau de bord de la planche est très sombre en développement : le
  serveur local bloque les textures en blob (politique de sécurité). En
  production elles se chargent.
- Les 18 sous-compétences, la barre de vie, le sélecteur de scène suivante et
  la mémoire du modèle de conduite ne sont **pas** dans le slice. Ils
  n'auraient rien apporté à la question posée.

---

## 8. Les fichiers

| | |
|---|---|
| [`reglages.js`](../src/game/slice/reglages.js) | tous les seuils, à un seul endroit |
| [`scenes.js`](../src/game/slice/scenes.js) | 3 familles × 3 variantes + la scène de transfert |
| [`entree.js`](../src/game/slice/entree.js) | 3 façons de regarder × 3 façons de ralentir |
| [`observation.js`](../src/game/slice/observation.js) | regardé ≠ vu ≠ compris |
| [`verdict.js`](../src/game/slice/verdict.js) | la matrice à deux axes et la marge |
| [`journal.js`](../src/game/slice/journal.js) | l'instrumentation et l'export |
| [`moteur.js`](../src/game/slice/moteur.js) | joue une scène, mesure tout |
| [`slice-regard.js`](../src/pages/eleve/slice-regard.js) | la coque, et rien d'autre |

Le monde 3D, les modèles, la lumière, l'image et le son sont ceux du moteur
existant. Rien n'a été réécrit.
