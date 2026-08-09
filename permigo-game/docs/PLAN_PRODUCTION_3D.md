# Plan de production 3D — PermiGo

> **À quoi sert ce document.** Passer de « une scène 3D qui tourne » à « un vrai
> jeu mobile premium », sans repartir de zéro et sans casser ce qui marche.
> Il est écrit pour être **exécuté par quelqu'un d'autre**, dans l'ordre donné.
> Les règles chiffrées à respecter à chaque PR sont dans [`QUALITY_BIBLE_3D.md`](QUALITY_BIBLE_3D.md).
>
> Écrit le 09/08/2026, après audit mesuré du moteur (commit `4033fb2`).

---

## 0. Ce que l'audit a réellement mesuré

Tout ce qui suit vient d'une session réelle en portrait 430 × 932 à densité 3
(le cadre d'un iPhone récent), pas d'une estimation.

| Mesure | Valeur constatée | Verdict |
|---|---|---|
| Résolution de rendu | **645 × 1398** | 🔴 l'écran fait 1290 × 2796. On dessine à **48 %** et on étire |
| Anticrénelage | **désactivé** sur mobile | 🔴 c'est la cause des bords en escalier |
| Ombres portées | **désactivées** sur mobile | 🔴 rien ne touche le sol, tout flotte |
| Appels de dessin | **~84 par image** | 🟡 acceptable, mais évitable |
| Triangles dessinés | **~380 000 par image** | 🔴 3 à 4 fois le budget d'un téléphone d'entrée de gamme |
| Triangles uniques en scène | 77 876 | 🟢 |
| Textures | 14 réelles, **512 px au maximum** | 🟡 trop petites pour un écran 1080 de large |
| Mémoire textures estimée | ~20 Mo (non compressées) | 🟡 |
| Poids des modèles | 2,3 Mo pour 14 fichiers | 🟢 |
| Ouverture jusqu'au jouable | **1 250 ms** | 🟢 |
| Poids du code du jeu | 867 Ko, **233 Ko compressés** | 🟢 hors bundle principal |
| Coût GPU · scène seule | 0,44 ms/image | 🟢 |
| Coût GPU · chaîne d'effets complète | +1,8 ms/image | 🟢 |

**La conclusion tient en une phrase : ce n'est pas le moteur qui limite le
rendu, c'est la résolution, l'anticrénelage, les ombres et la finition des
assets.** Le GPU a de la marge (2,2 ms utilisées sur un budget de 16,7 ms).
On a dépensé cette marge à ne rien faire au lieu de dessiner net.

---

## 1. Ce qu'on garde

Ces choix sont bons et ne se rediscutent pas. Les remettre en cause coûterait
des semaines pour un gain nul.

- **Three.js**, chargé en import dynamique. Voir le point 5 pour le pourquoi.
- **La séparation moteur / données.** Un scénario est un fichier de données
  (`src/game/scenarios/*.js`) : titre, acteurs, comportement attendu, seuils.
  Ajouter une situation ne touche pas au moteur. C'est l'acquis le plus
  précieux du chantier et il conditionne tout le contenu à venir.
- **Le modèle de conduite** (bicyclette cinématique, `src/game/engine/vehicle.js`)
  et la limite de braquage qui décroît avec la vitesse. Pas de moteur physique :
  Rapier coûterait 400 Ko et un budget d'images pour un gain nul sur une voiture
  qui roule à 30 km/h sur du plat.
- **L'évaluation par le comportement** : zones, regard mesuré, écart latéral,
  arrêt constaté. C'est ce qui distingue PermiGo d'un quiz déguisé.
- **La chaîne d'effets** (`src/game/engine/post.js`) et sa dégradation
  automatique. Elle coûte 1,8 ms et transforme l'image.
- **Le réalisateur de caméra** (`src/game/engine/cinema.js`).
- **Le son entièrement synthétisé** (`src/game/engine/audio.js`). Zéro octet
  téléchargé, le régime suit la vitesse réelle.
- **Le pipeline d'assets** : Higgsfield → `generate_3d` → `gltf-transform
  optimize --compress meshopt`. Il descend un modèle de 4,4 Mo à 210 Ko.
- **Les bancs d'essai** `/lab/conduite-3d/` et `/lab/apercu/`. Un modèle se
  regarde AVANT d'entrer dans la scène.

## 2. Ce qu'on améliore

Par ordre d'impact visuel décroissant. Le détail d'exécution est au point 15.

1. **La résolution et l'anticrénelage.** Le chantier numéro un, et de loin.
2. **Les ombres.** Rien ne touche le sol aujourd'hui sur téléphone.
3. **La densité de triangles des végétaux.** Les arbres consomment à eux seuls
   la majorité des 380 000 triangles.
4. **La taille des textures**, et leur compression en KTX2.
5. **Le nombre d'appels de dessin**, par instanciation du décor répété.
6. **L'habitacle**, reconstruit à partir de deux objets isolés. Il occupe un
   tiers du cadre en portrait et c'est la surface la moins travaillée.
7. **Le poids de la voiture** : inertie, transfert de masse, roulis en virage,
   plongée au freinage. Aujourd'hui la caisse est rigide.
8. **Les décors**, trop vides. Aucune vie autour du joueur.
9. **Les transitions** entre situations, aujourd'hui un remplacement de DOM.

## 3. Ce qu'on supprime

- **Le rendu isométrique en SVG** (`src/components/eleve/situation-scene.js`)
  pour les mises en situation, une fois les 71 scènes migrées. ⚠️ Il sert
  AUSSI au quiz et à la démo de la landing : on ne le supprime qu'après avoir
  vérifié qui le lit encore.
- **Les primitives du kit** (`src/game/environments/kit.js`) pour tout ce qui a
  un vrai modèle. Elles restent comme **repli** quand un fichier manque, et
  pour ce qui doit changer d'état (le feu tricolore).
- **`eclairer` au-dessus de 1** dans les spécifications de modèles. Sur un
  modèle texturé, `material.color` est un blanc neutre : le monter brûle la
  texture. Le seul usage légitime est d'assombrir.
- **La double barre de commandes** si les mesures montrent que personne
  n'utilise l'accélérateur (la voiture roule seule). Un bouton inutile occupe
  de la place et fatigue l'écran.

## 4. Les vrais points de blocage techniques

Ceux qui empêchent aujourd'hui un rendu premium, dans l'ordre.

### 4.1 🔴 On dessine à moins de la moitié de la résolution de l'écran

```js
// src/game/engine/world.js, état actuel
const petit = Math.min(innerWidth, innerHeight) < 500;   // vrai sur tout téléphone
rendu.setPixelRatio(Math.min(dpr, petit ? 1.5 : 2));      // 1,5 au lieu de 3
antialias: !petit                                          // désactivé
```

Un iPhone rend donc en 645 × 1398, affiché sur 1290 × 2796. **Chaque pixel est
étiré 2 fois**, sans anticrénelage. C'est la cause unique et suffisante de
l'impression « application web ». Aucun étalonnage ne rattrape ça.

Le réglage était prudent, il date d'avant la mesure. Le GPU utilise 2,2 ms sur
16,7 : il y a la place.

### 4.2 🔴 Aucune ombre portée sur téléphone

`ombres = qualite === "haute" || (auto && !petit)` → faux sur tout téléphone.
Sans contact au sol, un objet ne pèse rien et semble collé sur le décor. C'est
exactement le « objets flottants » de la liste des tueurs de qualité.

### 4.3 🔴 Les arbres coûtent plus cher que tout le reste réuni

`arbre.glb` fait 256 Ko, le plus lourd du lot, et la scène en place une
quinzaine. Environ 380 000 triangles par image, dont la grande majorité en
feuillage. Un jeu mobile premium tient sous 150 000.

### 4.4 🟡 Le décor n'est pas instancié

Chaque arbre, chaque lampadaire, chaque bâtiment est un maillage distinct :
201 maillages, ~84 appels de dessin. Une `InstancedMesh` par famille ramène
ça à une poignée.

### 4.5 🟡 Les textures plafonnent à 512 px, non compressées

Sur un écran de 1290 px de large, une carrosserie qui occupe la moitié du
cadre reçoit 512 px de texture étirés sur 645. C'est flou, et ça se voit
surtout sur la vue extérieure et le plan d'ouverture.

### 4.6 🟡 L'habitacle est une reconstruction, pas un modèle

Une planche de bord et un volant, deux objets isolés posés côte à côte. Il
manque les montants, la casquette de combiné, le rétroviseur, la portière.
C'est un tiers du cadre en permanence.

### 4.7 🟡 La voiture n'a pas de poids

La caisse ne roule pas en virage, ne plonge pas au freinage, ne se cabre pas
à l'accélération. Le modèle de conduite est bon, c'est la CARROSSERIE qui ne
raconte rien. Trois lignes de ressort amorti suffisent, et c'est le plus gros
gain de « sensation » par ligne de code du document.

## 5. La technologie : on garde Three.js, et voici pourquoi

**La question mérite d'être posée une fois, sérieusement, puis close.**

| Option | Poids au chargement | Verdict |
|---|---|---|
| **Three.js** (actuel) | 233 Ko compressés, hors bundle principal | ✅ **On garde** |
| Unity WebGL | 15 à 35 Mo, 5 à 15 s d'ouverture | ❌ |
| Godot Web | 10 à 25 Mo | ❌ |
| PlayCanvas | ~350 Ko | 🟡 mieux outillé, mais migration totale pour un gain marginal |
| Babylon.js | ~900 Ko | 🟡 idem |

Trois raisons de rester :

1. **L'audit dit que le moteur n'est pas le goulot.** 0,44 ms pour la scène.
   Changer de moteur ne rendrait pas une image plus nette : c'est la
   résolution qui le fera.
2. **PermiGo est une page web, pas une application à installer.** Un élève
   ouvre `#/situation-3d` et joue en 1,2 s. Une brique Unity casse ça, et
   casse aussi le partage de l'authentification, de Supabase et de l'interface
   en DOM.
3. **Tout est déjà écrit contre l'API Three.js** : 3 900 lignes de moteur, de
   décors et de scénarios.

⚠️ **Ce qui manque à Three.js et qu'il faut ajouter à la main** : compression
de textures KTX2, instanciation, LOD, occlusion. Trois de ces quatre sont dans
la bibliothèque, il faut juste les brancher (points 14 et 15).

## 6. Comment structurer les scènes

Ce qui existe est bon. On le formalise et on l'étend.

```
src/game/
  engine/       world · vehicle · camera-rig · cinema · controls · zones
                npc · modeles · post · audio · debug
  environments/ kit.js (primitives + repli) · carrefour.js
                → à venir : giratoire.js · insertion.js · rurale.js
  scenarios/    un fichier = une situation. Zéro logique.
  ui/           hud.css
  runner.js     installe, joue, observe, rend un verdict
```

**Les trois règles de structure, à ne jamais enfreindre :**

1. **Un environnement ne connaît aucun scénario.** Il expose une géométrie
   (`point`, `sortie`, `surRoute`, `zones*`) et se construit à partir d'options.
2. **Un scénario ne contient aucune logique.** S'il faut écrire un `if` dans un
   scénario, c'est que le moteur manque d'une notion : on l'ajoute au moteur.
3. **Le runner ne dessine rien lui-même.** Il assemble. Toute primitive
   graphique appartient au kit ou à un modèle.

**Le découpage cible d'un environnement**, pour préparer l'instanciation et
l'occlusion : un groupe `statique` (bitume, trottoirs, marquages, bâtiments),
un groupe `mobilier` instancié (arbres, lampadaires, panneaux), un groupe
`dynamique` (véhicules, piétons, feux). Le statique se cuit une fois, le
mobilier s'instancie, le dynamique seul se met à jour chaque image.

## 7. Voiture, personnages, environnements

### La voiture du joueur
Le **Cupra violet de la DA PermiGo** (`cupra.glb`), et lui seul. C'est la
seule voiture que l'élève voit de dehors : elle doit être la nôtre.
À faire : suspension visuelle (roulis, plongée, cabrage), roues qui tournent
et braquent, feux de stop déjà en place, ombre de contact.

### Les autres véhicules
Trois silhouettes suffisent au départ (berline, camion, utilitaire) et se
déclinent en couleur. ⚠️ **Une couleur ne se change pas en teintant une
texture** : ça donne du violet sale. Chaque couleur est un modèle, ou une
texture dédiée.

### Les personnages
Piéton et cycliste sont statiques aujourd'hui : ils GLISSENT. C'est le défaut
le plus visible du lot. Deux options, dans l'ordre de préférence :
1. `generate_3d` avec `enable_rigging` et une animation de marche, puis
   `AnimationMixer` (Three.js le gère nativement).
2. À défaut, une animation procédurale simple : balancement des bras et des
   jambes en sinusoïde calée sur la distance parcourue. Laid de près,
   invisible à vingt mètres, et cent fois mieux qu'une statue qui glisse.

### Les environnements
Un environnement = une leçon de conduite. Dans l'ordre de valeur pédagogique :
carrefour (fait) → **giratoire** → **insertion sur voie rapide** → route de
campagne → ville dense. Chacun sert ensuite des dizaines de scénarios.

## 8. Le système de caméra

Il est déjà en deux étages et c'est la bonne architecture.

- **`camera-rig.js`** — la caméra du JOUEUR. Trois vues : conduite, extérieure,
  libre (mode développeur). Le regard est un angle continu, LU par le moteur
  pour juger si l'élève a tourné la tête.
- **`cinema.js`** — la caméra du RÉALISATEUR. Elle prend la main sur les temps
  non jouables : plan d'ouverture, ralenti d'impact, plan final.

**Ce qu'il faut y ajouter**, dans cet ordre :
1. **Un tremblement de main** très léger, proportionnel à la vitesse. C'est ce
   qui sépare une caméra montée sur rail d'une caméra tenue.
2. **Un champ de vision qui respire** : 55° au repos, 60° à pleine vitesse.
   La sensation de vitesse vient de là, pas de la vitesse elle-même.
3. **Un plan de fin** par situation, avec la mise au point qui se ferme.
4. **Les autres plans de la grammaire** au fil des besoins : orbite lente sur
   le carton de réussite, plongée avant un giratoire.

⭐⭐⭐ **La loi du cadre en portrait, payée trois fois.** Un écran de téléphone
n'a qu'une trentaine de degrés de champ HORIZONTAL. Une caméra haute qui
plonge ne cadre pas un carrefour, elle cadre du bitume. **En portrait, un plan
large se fait BAS et se regarde à l'horizontale.** Corollaire : la part
d'écran prise par ce qu'on met devant l'œil ne dépend QUE de la hauteur de
l'œil. Piquer la caméra ne sert à rien.

## 9. Le pipeline des assets 3D

```
1. Image      Higgsfield generate_image (nano_banana_pro)
              → objet ISOLÉ, fond uni, éclairage de studio, vue 3/4
2. Modèle     Higgsfield generate_3d (image_to_3d, should_texture: true)
              → GLB de 3 à 5 Mo, 20 crédits
3. Régime     npx @gltf-transform/cli optimize <in> <out> \
                --texture-size 1024 --texture-compress webp \
                --compress meshopt --simplify-error 0.002
              → 200 à 400 Ko
4. Contrôle   /lab/apercu/?m=<fichier>&longueur=…&a=0&e=10
              → orientation, échelle, propreté. AVANT d'intégrer.
5. Intégration Une entrée dans MODELES (runner.js) : fichier, longueur ou
              hauteur, capOffset.
```

**Les six règles apprises au prix fort :**

- 🔴 **Higgsfield reconstruit des OBJETS, jamais des pièces creuses.** Un
  habitacle complet revient avec le pare-brise bouché par une surface pleine.
  On génère des objets isolés et on assemble.
- 🔴 **Un objet qui doit CHANGER D'ÉTAT ne peut pas être un modèle importé.**
  Un feu tricolore reste une primitive du kit : rien ne dit où sont ses trois
  lampes dans un maillage.
- 🔴 **`--compress quantize` ne suffit pas** (4 Mo → 400 Ko, et le reste est de
  la géométrie). **`meshopt` fait 4 Mo → 210 Ko** et exige
  `new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)`, sinon le chargement
  échoue **en silence**.
- 🔴 **Un objet haut et fin se cale sur sa HAUTEUR**, pas sur son emprise au
  sol. Calé sur sa longueur, un cycliste fait trois mètres.
- 🔴 **Vérifier l'orientation dans `/lab/apercu/?a=0`** : la caméra y est en
  +Z et regarde vers −Z, donc la gauche de l'image est −X. L'avant du jeu est
  −Z. Une erreur de signe fait rouler toutes les voitures en marche arrière,
  et ça ne se voit pas sur une voiture qui vient de face.
- 🔴 **Un modèle importé arrive métallique.** Sans carte d'environnement, un
  métal ne reçoit rien : la voiture est une silhouette noire. `metalness = 0`.

**À ajouter au pipeline** : une étape 3bis de conversion en **KTX2/Basis**
(`gltf-transform uastc` ou `etc1s`) et le `KTX2Loader` côté moteur. C'est ce
qui permet de passer à 1024 px de texture sans exploser la mémoire.

## 10. Le pipeline Higgsfield / Seedance

**La ligne à ne jamais franchir : l'IA vidéo ne joue jamais.** Un jeu fait de
vidéos est un faux jeu, l'élève le sent en trois secondes, et ça condamne
toute idée de mise en situation réactive.

| Usage | Outil | Statut |
|---|---|---|
| Concept art, recherche de direction | `generate_image` | ✅ en place |
| Modèles 3D d'objets | `generate_3d` | ✅ en place |
| Image de fond d'un écran de chargement | `generate_image` | à faire |
| Ouverture de chapitre, révélation d'un environnement | `generate_video` | à faire |
| Bande-annonce, publicité | `generate_video` + Remotion | ✅ déjà fait |
| **Référence de caméra** | `generate_video` avec un mouvement nommé | ⭐ le plus utile |
| Voix des personnages | `generate_audio` | plus tard |
| Ambiance sonore d'un lieu | `generate_audio` | plus tard |

⭐⭐ **L'usage le plus rentable est le dernier auquel on pense : la référence
de caméra.** On génère un plan (orbite, travelling avant, plongée, mise au
point qui glisse), on le regarde image par image, et on REPRODUIT la courbe
dans `cinema.js`. Ça coûte quelques crédits et ça donne une grammaire visuelle
qu'on n'invente pas en tâtonnant.

⚠️ **Ne jamais recharger de crédits sans validation de Rayan.**

## 11. Le standard lumière, matériaux, effets

### Lumière
Trois sources, jamais plus, et **la somme reçue par une surface plate doit
rester sous 1,4** sinon tout ce qui est horizontal part en blanc.

```js
HemisphereLight(0xb9a9ff, 0x40336b, 0.9)   // le ciel violet remplit les ombres
DirectionalLight(0xffc98a, 1.0)             // soleil rasant, chaud, il détache
DirectionalLight(0x8fa8ff, 0.3)             // contre-jour froid, il dessine les arêtes
```

⭐⭐ **La carte d'environnement est LE réglage qui sépare « des formes
colorées » d'un rendu de jeu.** Sans elle, une carrosserie ne reflète rien.
Elle se cuit une fois au démarrage depuis le dégradé de ciel (PMREM), coût nul
ensuite. ⚠️ Elle ne s'applique QU'AUX matériaux Standard et Physical.

### Matériaux
`MeshStandardMaterial` partout. `metalness = 0` sauf métal réel,
`roughness` entre 0,6 et 0,9, `envMapIntensity` autour de 0,9 dehors et
**0,12 dans l'habitacle** (l'intérieur d'une voiture ne reçoit ni le ciel ni
le décor).

### Effets
L'ordre est imposé : rendu → halo → `OutputPass` → objectif.
⚠️ **`OutputPass` est obligatoire** : c'est lui qui applique la courbe ACES et
repasse en sRGB. Sans lui, une chaîne d'effets rend une image délavée et
personne ne comprend pourquoi.
⚠️ **Halo : seuil haut (0,93) et force basse (0,42).** Un halo généreux ne fait
pas « cinéma », il fait « buée sur l'objectif ».

## 12. Le standard d'interface mobile

Les chiffres sont dans la Quality Bible. Les principes :

- **Une seule police, Archivo.** Les chiffres qui changent (vitesse, chrono,
  score) passent en chasse fixe pour ne pas danser.
- **Rien d'important dans les 90 px du bas** ni les 60 px du haut : c'est là
  que vivent les pouces et l'encoche.
- **Pendant la conduite, presque pas de texte.** On apprend en agissant. Le
  texte appartient au carton de fin.
- **Zéro tiret, zéro virgule dans un titre ou un bouton.** Règle Rayan du
  31/07, elle vaut aussi ici.
- **Chaque commande tactile fait au moins 56 px** et donne un retour haptique.

## 13. Le budget de performances

Pour un iPhone 12 ou un Android milieu de gamme de 2023, en portrait.

| Poste | Budget | Aujourd'hui |
|---|---|---|
| Image complète | **16,7 ms** (60/s) | 2,2 ms de GPU, mais à 48 % de résolution |
| Triangles par image | **≤ 150 000** | 🔴 ~380 000 |
| Appels de dessin | **≤ 60** | 🟡 ~84 |
| Mémoire textures | **≤ 48 Mo** | 🟡 ~20 Mo non compressés |
| Poids téléchargé d'une situation | **≤ 4 Mo** | 🟢 2,3 Mo |
| Ouverture jusqu'au jouable | **≤ 2 500 ms** en 4G | 🟢 1 250 ms en local |
| Résolution de rendu | **≥ 1080 px de large** | 🔴 645 px |

**Le repli est un contrat, pas un échec** : 30 images/s stables valent mieux
que 45 qui s'effondrent. Le seuil de dégradation ne peut PAS être 45 : beaucoup
d'écrans sont bloqués à 30 Hz, et à 45 la chaîne se coupait sur des machines
qui tournaient parfaitement.

## 14. Le système d'optimisation

Dans l'ordre du rapport gain / effort, du meilleur au moins bon.

1. **Résolution adaptative.** On démarre à densité 2, on mesure sur une
   fenêtre d'une seconde après 2 s d'échauffement, on monte à 3 si on tient
   60, on descend à 1,5 si on tombe sous 26. ⚠️ **Les deux premières secondes
   ne comptent pas** : elles contiennent la compilation des shaders et la
   première image d'ombres.
2. **Anticrénelage MSAA** par cible de rendu multi-échantillonnée (WebGL2,
   `samples: 4`). Sur un GPU mobile à tuiles c'est presque gratuit ; sur
   bureau on peut monter.
3. **Décimation des végétaux** à moins de 2 000 triangles, puis
   **instanciation** de tout ce qui se répète.
4. **Ombres : une seule carte à 1024**, cadre serré autour de la voiture, plus
   des **taches de contact** sous chaque acteur. Les ombres des bâtiments se
   cuisent dans la texture du sol, elles ne bougent jamais.
5. **Textures en KTX2**, 1024 pour la voiture et le sol, 512 pour le reste.
6. **Élagage par le tronc de vue** (déjà natif dans Three.js) et **niveaux de
   détail** sur les bâtiments et les arbres au-delà de 60 m.
7. **Chargement progressif** : la situation démarre avec les modèles proches,
   le décor lointain arrive après.

## 15. L'ordre exact des travaux

Chaque ligne est une PR. Chaque PR se vérifie avec les chiffres de la Quality
Bible, captures avant / après à l'appui.

### Lot A — La netteté. Le plus gros gain visuel de tout le document.
1. **Résolution adaptative + MSAA.** Sortir du plafond à 1,5 et du
   `antialias: false`. Mesurer sur téléphone réel, pas dans Playwright.
2. **Décimer les arbres**, puis instancier arbres, lampadaires, bâtiments.
   Objectif : passer sous 150 000 triangles et 60 appels.
3. **Rebrancher les ombres sur mobile** : une carte 1024 + taches de contact.

### Lot B — Le poids et la vie.
4. **Suspension visuelle** de la voiture : roulis, plongée, cabrage. Roues qui
   tournent et braquent.
5. **Piétons et cyclistes animés.** Ils glissent aujourd'hui.
6. **Textures en KTX2** et passage à 1024 sur la voiture et le sol.

### Lot C — Le décor raconte.
7. **Peupler le carrefour** : passages piétons usés, plaques d'égout, feux de
   fenêtres allumés, terrasse, panneaux, trottoir sali. Aucun objet ne doit
   ressembler à un asset gratuit.
8. **Trafic d'ambiance** : deux ou trois véhicules qui vivent leur vie sans
   entrer dans l'évaluation.
9. **Ambiance sonore** du lieu, en plus du moteur synthétisé.

### Lot D — Le contenu.
10. **Environnement giratoire**, puis **insertion**.
11. **Migrer les 71 scènes** du rendu isométrique vers le moteur 3D, par
    paquets, en gardant l'ancien tant que le nouveau ne couvre pas tout.

### Lot E — La mise en scène.
12. **Plans de fin** et transitions entre situations.
13. **Ouverture de chapitre** en vidéo Higgsfield, hors gameplay.
14. **Bande-annonce** du mode, pour les réseaux.

⚠️ **On ne commence pas le lot B avant que le lot A soit mesuré sur un vrai
téléphone.** Ajouter du détail à une image rendue à 48 % de sa résolution,
c'est payer deux fois pour ne rien voir.
