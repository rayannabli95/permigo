# PERMIGO GAME ART BIBLE

> Version 1.0 · 10/08/2026 · écrite en phase « cerveau » (Fable), exécutée par n'importe quel modèle.
> Périmètre : **tout le monde 3D de PermiGo** (`#/avance`, `#/situation-3d`, futures scènes).
> Ce document répond à UNE question : à quoi ressemble PermiGo, et pourquoi.
> Le « comment construire » vit dans `PERMIGO_DA_IMPLEMENTATION_PLAN.md`.

---

## 0 · LA DÉCISION

La direction artistique de PermiGo s'appelle **« SEIZE HEURES »**.

> **Le monde de PermiGo est un jouet premium vu à hauteur d'œil, figé à seize
> heures : l'heure de la sortie d'école.**

Pourquoi seize heures, et pas « plein jour » générique :

1. **C'est du plein jour** : la décision gameplay (lisibilité avant tout) est conservée. Le soleil est encore haut (~46°), les ombres restent courtes.
2. **La lumière est latérale et chaude** : c'est elle qui donne du volume et de la matière GRATUITEMENT. Le « plein jour neutre » actuel éclaire tout pareil, donc tout est plat. À 16 h, chaque façade a une face au soleil et une face à l'ombre : le monde a du relief sans un polygone de plus.
3. **C'est l'heure la plus dangereuse de la journée pour un conducteur** : les enfants sortent de l'école, les parents se garent en double file, les vélos rentrent. Notre décor RACONTE notre gameplay. Ce n'est pas un choix esthétique plaqué, c'est le sujet du jeu.

Et le lien avec le reste de l'app : l'Arène des quiz est la **nuit-violet** de
l'univers PermiGo. Le monde 3D en est le **jour**. Mêmes ombres violettes,
même or, même Archivo : deux heures du même monde.

### Les signatures visuelles (le test iconique)

Une capture d'écran sans logo doit se reconnaître à **trois choses nommées** :

| # | Signature | Ce que c'est |
|---|---|---|
| **X** | **LE CAPOT VIOLET** | Le joueur conduit LA voiture PermiGo : la Cupra laquée violette (celle des fiches, validée le 05/08). Son capot glossy occupe le bas de chaque image. Aucun autre jeu de conduite n'a un capot violet laqué. |
| **Y** | **LES OMBRES VIOLETTES** | Toute ombre du monde tire vers le violet de la marque, jamais vers le gris ou le bleu neutre. C'est le réglage le moins cher et le plus identitaire de toute cette bible. |
| **Z** | **L'OR DU REGARD** | Tout ce que le jeu récompense est OR : l'anneau de découverte, les chiffres qui montent, le compteur. L'or n'apparaît JAMAIS ailleurs. Voir de l'or = le joueur a bien regardé. |

Deux signatures secondaires, au service du gameplay :

- **LES TÊTES RONDES** : tous les personnages ont une tête sphérique surdimensionnée. Parce que notre gameplay EST la lecture d'intention, et qu'une intention se lit d'abord dans l'orientation d'une tête. On grossit l'organe que le joueur doit lire.
- **LA CALOTTE DE LUMIÈRE** : chaque arbre, chaque volume organique porte son highlight PEINT (une géométrie claire côté soleil), comme dans Mario ou Wind Waker. La lumière n'est pas seulement calculée, elle est dessinée.

**Phrase de contrôle** (à réciter devant chaque capture) :

> « Une capture PermiGo montre un monde jouet chaud sous un soleil de 16 h,
> des ombres violettes, un capot violet laqué en bas, et de l'or là où le
> joueur a bien regardé. »

Si une capture pourrait appartenir à 50 autres jeux, c'est qu'une des trois
signatures manque.

---

## 1 · L'EXPLORATION (pourquoi ce choix et pas un autre)

Quatre philosophies radicalement différentes ont été posées sur la table.

### Piste A — La maquette d'architecte
Un diorama mat et précis : bois clair, carton premium, tilt-shift, ambiance Monument Valley. **Beau** par sa retenue. **Lisible** car épuré. **Faisable** (matériaux mats = le moins cher). **Rejetée** pour une raison de fond : la miniature se lit VU D'EN HAUT. Notre caméra est à 1,22 m, à hauteur d'œil : vue du sol, une maquette mate redevient… des primitives mates. C'est littéralement notre problème actuel. Et un monde mat tue les carrosseries, qui sont notre plus bel atout (la Cupra).

### Piste B — La gouache animée
Illustration 3D douce : dégradés peints, ombres suggérées, ambiance « Season » ou livre jeunesse. **Magnifique** en capture. **Rejetée** pour deux raisons : (1) le rendu « doux » vit d'aplats faiblement contrastés, exactement la bouillie gris-beige qu'on fuit, et la garantie de lisibilité chiffrée (§2) devient difficile à tenir ; (2) c'est le style le plus dur à SYSTÉMATISER : la beauté d'une gouache vient de décisions locales de peintre, pas de règles, donc un agent la reproduit mal à grande échelle.

### Piste C — La ligne claire
BD franco-belge en 3D : aplats francs + contours noirs (post-process d'arêtes). **Identitaire** (personne ne fait ça en jeu de conduite) et culturellement juste (apprendre à conduire en France). **Rejetée** pour le coût et la fragilité : un contour propre demande soit un second rendu (inverted hull = ×2 géométrie), soit une détection d'arêtes en post (coûteuse et instable sur Safari mobile). Et un monde en aplats perd les indices de profondeur dont notre gameplay de DISTANCE a besoin. Trop de risque technique pour un studio d'une IA.

### Piste D — Le jouet premium à hauteur d'œil ✅ CHOISIE
Le monde entier est fabriqué comme des jouets de qualité : carrosseries laquées type die-cast, façades satinées aux couleurs sorbet, personnages-quilles, arbres à calotte. Vu à hauteur d'œil, pas d'en haut : on est DANS la ville-jouet.

1. **Ce qu'on voit** : une rue chaleureuse aux façades corail, ocre et sauge, un bitume chaud traversé par l'ombre violette des immeubles, des voitures laquées qui reflètent le ciel, des passants ronds aux têtes surdimensionnées, un capot violet brillant en bas d'écran.
2. **Pourquoi c'est beau** : le glossy EST la qualité perçue. Un reflet contrôlé sur une carrosserie dit « objet fini, cher » avec zéro géométrie en plus. C'est la leçon Pixar : la matière avant le détail.
3. **Pourquoi c'est lisible** : les jouets sont DESSINÉS pour être lus à distance par des enfants : silhouettes exagérées, couleurs franches, zéro bruit. C'est exactement le cahier des charges d'un jeu d'observation sur téléphone.
4. **Pourquoi c'est faisable en Three.js** : on a DÉJÀ tout. La carte d'environnement PMREM (cuite depuis le ciel, gratuite) fait le glossy. Les CanvasTextures font les matières. Le pipeline `kit.vehicule` fait des voitures peintes. Il manque le dessin, pas la technique.
5. **Difficulté de production** : faible. Tout est primitives + chanfreins + textures canvas. Aucun asset externe, aucun téléchargement, aucun problème de CSP.
6. **Reproductible par un agent** : oui, c'est son point fort. Un jouet est PARAMÉTRIQUE par nature (proportions + palette + finition). Toute la bible tient en tables de nombres.
7. **Limites** : le risque « Fisher-Price » si les couleurs sont criardes ou les formes molles. Parade : palette bornée (§3), saturation des neutres bridée, et la règle « simple mais dessiné » (§2, loi 4).
8. **Reconnaissable PermiGo** : par les trois signatures X, Y, Z, qui prolongent l'identité existante de l'app (Cupra violette des fiches, or de l'Arène, karts de la boutique).

**Note sur le photoréalisme** : écarté sans débat. Dans un navigateur mobile, le photoréalisme raté (et il sera raté) est la pire des DA : il invite la comparaison avec GTA et la perd. Le stylisé assumé ne se compare qu'à lui-même.

---

## 2 · LES CINQ LOIS (au-dessus de tout le reste)

1. **LA LISIBILITÉ EST CHIFFRÉE ET ELLE PRIME.**
   À 36° de champ horizontal sur 390 px, un objet de `s` mètres à `d` mètres fait `620 × s / d` pixels.
   Un indice STATIQUE (posture, roues braquées, objet) doit faire **≥ 24 px** à son instant lisible → `d ≤ 26 × s`.
   Un indice en MOUVEMENT (tête qui tourne, saut, dérive) doit faire **≥ 12 px** → `d ≤ 52 × s`.
   Une information pédagogique n'a JAMAIS le droit d'être minuscule au nom du réalisme. On rapproche, on grossit, on exagère.
2. **AUCUN GRIS PUR, AUCUN BLANC PUR, AUCUN NOIR PUR.**
   Toute surface a une teinte (saturation ≥ 8 %, même le bitume). Tout « blanc » est un crème, tout « noir » est un violet très sombre (`#1c1633`). C'est la parade structurelle contre la bouillie gris-beige-bleu actuelle.
3. **TOUT EST DÉCIDÉ.**
   Aucune valeur par défaut de Three.js n'atteint l'écran : chaque couleur vient de `palette.js`, chaque matériau d'une recette du §5, chaque lumière du §4. Un matériau « posé vite fait » est un bug.
4. **SIMPLE MAIS DESSINÉ.**
   Chaque volume porte AU MOINS une intention visible : un chanfrein qui attrape la lumière, un liseré clair, un dégradé vertical, une calotte. Une boîte nue aux faces uniformes est interdite à moins de 60 m de la caméra.
5. **TOUT SORT D'UNE GRAINE.**
   Aucune scène décorée à la main, aucun `Math.random` : générateurs déterministes (LCG seedé, comme `rue.js`). C'est ce qui permet à un agent de produire cent rues cohérentes, de comparer deux essais, et de vérifier automatiquement (§13).

---

## 3 · LA PALETTE

Source unique : `src/game/da/palette.js`. Personne n'écrit un hex ailleurs.

### Le monde

| Rôle | Hex | Note |
|---|---|---|
| Ciel zénith | `#6fa8e6` | dégradé vers l'horizon |
| Ciel horizon | `#f3e7cf` | crème chaud : c'est lui qui teinte les reflets |
| Bitume | `#86816f` | gris CHAUD, jamais bleuté |
| Bande de roulement | `#7a7566` | deux traces sombres par voie |
| Marquage | `#f6f0e0` | blanc cassé chaud, jamais `#fff` |
| Caniveau | `#6e695c` | bande de 30 cm le long des bordures |
| Trottoir | `#c9b8a2` | sable rosé |
| Bordure (chant) | `#a4937d` | |
| Bordure (dessus) | `#e6dcc6` | le liseré : face qui attrape le soleil |
| Façades (6 familles) | `#e2795a` corail · `#e6a84e` ocre · `#d9958a` rose · `#93a883` sauge · `#efe0c4` crème · `#c96a55` brique | deux voisines ne partagent jamais la même famille |
| Commerce (devantures) | `#3f6f74` canard · `#8a4d68` prune · `#4a6b52` bouteille | rez-de-chaussée uniquement |
| Feuillage ombre | `#3e7d4f` | |
| Feuillage calotte | `#7cba6e` | la géométrie « soleil » de chaque arbre |
| Troncs / mobilier bois | `#8a6648` | |
| Mobilier métal | `#4b5568` | |

### Les acteurs

| Rôle | Hex | Note |
|---|---|---|
| Véhicules NEUTRES (garés, trafic) | `#b8b3a8` pierre · `#9aa6ae` brume · `#b7a98f` sable · `#7e8894` ardoise · `#a89ba6` lilas gris | saturation ≤ 18 % : ils font la masse, jamais l'événement |
| Véhicules IMPORTANTS (porteurs de scène) | `#d5453c` rouge · `#f0b02f` jaune · `#3565c0` bleu · `#2f8f6b` vert | saturation ≥ 55 % : un porteur est TOUJOURS dans cette famille |
| La Cupra du joueur (capot) | `#7c5cd8` | laque violette, réservée au joueur |
| Peau (3 teintes) | `#e8c39e` · `#c68e5f` · `#8a5a3b` | tirage à la graine |
| Vêtements ADULTES | haut : une famille façades désaturée · bas : `#3a3654` | les adultes se fondent |
| Vêtements ENFANTS | `#f0b02f` · `#d5453c` · `#38b6c9` | **règle : les enfants sont les êtres les plus saturés de la rue.** C'est de la pédagogie déguisée en DA |

### Le gameplay

| Rôle | Hex | Note |
|---|---|---|
| OR (récompense) | `#f2b32c` | anneau, gains, compteur. INTERDIT partout ailleurs (donc jamais de taxi jaune-or : le jaune véhicule `#f0b02f` est plus orangé et mat) |
| Violet UI / guidance | `#7c5cd8` sur verre `#171130` à 72 % | phrases, relances |
| Ombre du monde | tirée vers `#8a76a8` | via l'hémisphère, §4 |

### Les interdits de contraste

- Jamais deux surfaces adjacentes de la même famille de teinte ET de la même valeur (écart de luminosité < 12/100) : c'est ça qui fabrique la bouillie.
- Le porteur d'une scène doit avoir, à son instant lisible, un ΔL ≥ 18 OU un écart de saturation ≥ 35 points avec ce qui l'entoure dans un rayon de 24 px écran (vérifié par script, §13).
- **La règle des trois valeurs** : chaque cadre contient une dominante chaude (façades, trottoirs), une secondaire froide (ciel, vitres, ombres violettes) et AU MOINS un accent saturé (végétation, véhicule, enfant). S'il n'y a pas d'accent dans le cadre, la rue est mal générée.

---

## 4 · LA LUMIÈRE (la recette « SEIZE HEURES »)

C'est LE chantier au meilleur ratio effet/coût : quatre lumières, zéro asset.

| Ingrédient | Réglage | Pourquoi |
|---|---|---|
| Soleil (Directional) | couleur `#fff0d8` · intensité 2.2 · position relative `[-28, 34, 16]` (élévation ≈ 46°, il vient de l'avant-gauche du joueur) | les façades et véhicules du CÔTÉ DROIT (là où vivent nos événements) prennent le soleil ; l'ombre des immeubles de gauche barre la chaussée en diagonale : c'est notre bande de profondeur |
| Hémisphère | ciel `#cfe0f6` · **sol `#8a76a8`** · intensité 0.9 | ⭐ le sol VIOLET de l'hémisphère est ce qui teinte toutes les ombres : la signature Y coûte une ligne |
| Rebond froid | `#bdd6ff` · 0.2 · depuis l'arrière | détache les arêtes côté ombre |
| Ombres portées | PCF · map 2048 · champ 55 m suiveur · radius 2 · **intensity 0.72** | jamais noires : le violet de l'hémisphère les remplit |
| Exposition | ACES · 1.0 | |
| Étalonnage (post.js) | `uChaud 0.10` · `uFroid 0.05` (vers violet, dans les ombres) · `uSaturation 1.12` · `uVignette 0.30` · `uGrain 0.016` | chaud dans les lumières, violet dans les ombres : le contraste de température fait le « cinéma » |
| Environnement | PMREM cuit depuis le ciel (existant) · intensité 1.15 | c'est LUI qui fait le glossy des carrosseries, il est déjà gratuit |

**Le total reçu par une surface horizontale reste sous 1,4** (règle apprise au prix du capot cramé).

### Les déclinaisons (plus tard, même identité)

On ne touche QUE : position/couleur du soleil, les deux couleurs d'hémisphère, l'horizon du ciel, `uChaud/uFroid`. Les ombres restent violettes PARTOUT : c'est le fil qui relie les heures.

| Heure | Soleil | Différences |
|---|---|---|
| MATIN | `#ffe9c4` · élévation 25° · depuis l'avant-droit | ombres longues vers le joueur, horizon `#f6e3c2`, exposition 0.95 |
| MIDI | `#fff6e8` · élévation 64° | ombres courtes, saturation 1.08 : l'heure la plus « neutre », à éviter en capture marketing |
| GOLDEN | `#ffd9a0` · élévation 14° | `uChaud 0.18`, réservée aux écrans de fin et au marketing |
| PLUIE | pas de soleil · hémisphère 1.3 | bitume roughness 0.35 + envMap 1.6 (la rue devient un miroir), saturation 1.0, marquages plus lisibles que jamais |
| NUIT | ciel `#2a1d5c` (celui de l'Arène, déjà dans `world.js`) | le monde 3D rejoint littéralement l'univers du quiz |

---

## 5 · LA MATIÈRE (simple mais dessiné)

Trois outils, dans l'ordre du ratio effet/coût. Tout le reste en découle.

1. **LE JITTER** : toute instance répétée (voiture garée, fenêtre, arbre, dalle) décale sa couleur de ±4 % de luminosité et ±3° de teinte, à la graine. Coût nul, et c'est la moitié de la différence entre « primitives » et « monde ».
2. **LE LISERÉ** : toute arête horizontale qui regarde le ciel (bordure de trottoir, corniche, parapet, arête de capot) porte une fine face claire (la couleur du matériau +18 % de luminosité). C'est le « trait de pinceau » qui dit qu'un humain a dessiné le volume. Implémentation : une géométrie-bande de 3 à 6 cm, ou la face du dessus peinte plus claire.
3. **LA TEXTURE CANVAS** : 128 à 256 px, générée au boot (comme le ciel actuel), jamais téléchargée. Une par FAMILLE de surface, pas une par objet.

### Recettes par famille

| Famille | roughness | metal | envMap | Texture canvas |
|---|---|---|---|---|
| Carrosserie laquée (porteurs + Cupra) | 0.18 | 0.0 | 1.3 | aucune : le reflet EST la matière |
| Carrosserie neutre (garées) | 0.42 | 0.0 | 0.8 | aucune |
| Vitrage véhicule | 0.08 | 0.6 | 1.5 | teinte `#1c2433` |
| Bitume | 0.94 | 0 | — | bruit fin + 2 bandes de roulement + patchs de réparation (±6 % de valeur) + joints tous les 12 m |
| Trottoir | 0.9 | 0 | — | lignes de dalles tous les 1,2 m + jitter par dalle |
| Façade | 0.85 | 0 | — | ⭐ LA texture-clé : couleur de base + **fenêtres PEINTES DANS LA TEXTURE** (encadrement crème, vitre bleu-ardoise à reflet dégradé, appui = ligne claire) + dégradé vertical (−8 % de valeur vers le sol) + **bas de façade assombri sur 40 cm** (l'occlusion de contact, peinte) |
| Feuillage | 0.8 | 0 | — | aucune : deux teintes par GÉOMÉTRIE (masse + calotte) |
| Marquages | 1.0 | 0 | — | bords très légèrement irréguliers (1 px de bruit) |

**Décision structurante** : les fenêtres sont de la TEXTURE, pas de la géométrie.
La rue actuelle dessine des centaines de plans-fenêtres : coût énorme, rendu
d'autocollant. Une façade = UN mesh, UNE texture canvas où tout est peint
(fenêtres, encadrements, AO de contact). La géométrie ne sert qu'à ce qui
change la silhouette : balcons, corniches, devantures — et seulement sur les
DEUX premiers niveaux, les seuls que la caméra regarde vraiment.

---

## 6 · LES SILHOUETTES

### Véhicules (philosophie die-cast)

Une voiture PermiGo est un jouet en métal peint : un seul volume de caisse aux
angles adoucis, une bulle de vitrage sombre d'un seul tenant (la « visière »),
des roues légèrement trop grosses, des porte-à-faux raccourcis.

| Règle | Valeur |
|---|---|
| Roues | Ø = 0.44 × hauteur totale (réel : 0.38). Jante = disque clair `#d8d4c8` Ø 55 % de la roue |
| Porte-à-faux avant/arrière | ≤ 0.14 × longueur (réel : 0.20) : le jouet est « posé sur ses roues » |
| Visière (vitrage) | un seul bandeau sombre, 30 % de la hauteur, incliné, qui fait le tour |
| Passages de roue | arche sombre `#1c1633` légèrement plus grande que la roue : c'est elle qui « creuse » la caisse |
| Chanfreins | toute arête de caisse est cassée (visuellement ~6 cm) : c'est ce qui attrape le soleil |
| Feux | signature lumineuse en BANDEAU (avant crème, arrière rouge), emissive, jamais deux petits cubes |
| Ombre au sol | tache portée (kit.tache) TOUJOURS, même quand les ombres dynamiques sont coupées |

Silhouettes types (reconnaissables à 60 m, AVANT tout détail) :

| Type | L × l × h (m) | Trait distinctif |
|---|---|---|
| Citadine | 3.7 × 1.75 × 1.52 | courte et haute, visière très arrondie |
| Berline | 4.5 × 1.82 × 1.42 | basse, visière fuyante |
| SUV | 4.4 × 1.90 × 1.72 | garde au sol visible (30 cm de jour sous caisse) |
| Utilitaire | 5.2 × 2.0 × 2.5 | caisse haute SANS visière arrière, cabine courte |
| Bus | 10.5 × 2.5 × 3.0 | un seul bandeau de vitres sur toute la longueur |
| Moto | 2.1 × 0.8 × 1.4 | le pilote fait partie de la silhouette |

### Personnages (les quilles)

| Règle | Adulte | Enfant |
|---|---|---|
| Taille | 1.72 m | 1.15 m |
| Tête (sphère) | Ø 0.34 (≈ 20 % de la taille ; réel : 13 %) | Ø 0.30 (**26 %**) |
| Corps | capsule épaulée, pas de cou | capsule courte |
| Mains / visage | AUCUN détail : ni doigts ni yeux. L'expressivité vient de l'ORIENTATION et du RYTHME, pas des traits | idem |
| Couleurs | haut désaturé, bas sombre | haut TRÈS saturé (les enfants brillent, §3) |

Le body language est un VOCABULAIRE chiffré (le gameplay lit des intentions,
donc les intentions ont des poses standard) :

| Intention | Pose |
|---|---|
| regarder | tête yaw jusqu'à ±1.2 rad + épaules qui suivent à 40 % |
| vouloir traverser | corps face à la chaussée + un demi-pas (0.35 m) vers le bord + tête qui balaie |
| hésiter | deux transferts de poids latéraux (±4 cm, 0.6 s chacun) |
| s'élancer | 150 ms d'inclinaison AVANT le premier pas (l'anticipation, §8) |
| attendre quelqu'un | sautille (l'enfant) ou pivote vers sa cible (l'adulte) |

### Bâtiments (une grammaire, pas des modèles)

`SOCLE + ÉTAGES × n + COURONNE`, sur des parcelles de 6, 9 ou 12 m.

- **SOCLE** (3.2 m) : soit habitation (porte + fenêtres hautes), soit commerce (devanture couleur « commerce » + auvent optionnel + enseigne-bloc). Un commerce tous les 3 à 4 immeubles : c'est le rez-de-chaussée qui fait « ville vivante ».
- **ÉTAGES** (2.9 m chacun, 2 à 4) : rythme de fenêtres à 1.4 m, trois dessins de fenêtre par ville (choisis à la graine PAR IMMEUBLE, jamais par fenêtre). Balcon optionnel (probabilité 0.3, géométrie réelle sur les étages 1-2 seulement).
- **COURONNE** : corniche-liseré crème obligatoire + toit (parapet plat OU pente 30° débordante) + cheminée/antenne optionnelle (la silhouette du toit contre le ciel est ce qu'on voit le plus).
- **Règles de rue** : deux voisins jamais de la même famille de couleur ni de la même hauteur exacte ; un « accident » (immeuble étroit, plus haut ou en retrait) tous les 5 à 7 modules pour casser la répétition.

---

## 7 · LA ROUTE (le personnage principal)

| Élément | Cote |
|---|---|
| Voie | 3.2 m (2 voies) |
| Bande de roulement | 2 traces de 45 cm par voie, −6 % de valeur |
| Axe central | pointillés 3 m / 3 m, largeur 15 cm |
| Rives | continues, 12 cm |
| Caniveau | bande de 30 cm, −12 % de valeur, le long des deux bordures |
| Bordure | 16 cm de haut, chant sable, DESSUS liseré crème |
| Trottoir | 2.8 m, dalles marquées tous les 1.2 m, jitter par dalle |
| Passage piéton | bandes de 50 cm, blanc cassé, un par zone d'événement piéton (il ANNONCE la possibilité d'un piéton : pédagogie gratuite) |
| Détails à la graine | 1 plaque d'égout / 25 m · 1 patch de réparation / 30 m · 1 grille de caniveau / 40 m |
| Stationnement | marquage en T aux angles des places, occupation 40 à 60 % (c'est le réglage de difficulté d'occlusion) |

Critère : **une portion de rue VIDE doit déjà être belle.** Si le screenshot
d'une rue sans acteurs est ennuyeux, la route est ratée.

---

## 8 · LE MOUVEMENT (la DA du temps)

- **Rien n'est linéaire.** Tout mouvement passe par `doux()` (le smoothstep de `scenario.js`). Une vitesse constante = un jouet tiré par une ficelle.
- **L'anticipation est obligatoire** : 120 à 180 ms de mouvement inverse avant toute action (un piéton s'incline avant de partir, une portière « respire » avant de s'ouvrir, une voiture plonge du nez avant de sortir). C'est l'anticipation qui rend nos indices LISIBLES : elle est gameplay autant que style.
- **Les voitures ont du poids** : tangage −1.5° au freinage, +1° à l'accélération, roulis 2° en virage, roues qui tournent (v/r). Quatre rotations, zéro squelette.
- **Les piétons ont un rythme** : rebond vertical de 3 cm à la fréquence du pas ; la tête TRAÎNE 80 ms derrière les épaules dans les rotations (c'est le retard qui fait « vivant »).
- **Budget** : aucune animation squelettale. Tout est translation/rotation de groupes, fonctions pures du temps local (rembobinage gratuit, règle existante).

---

## 9 · LA CAMÉRA (gelée)

Les valeurs validées le 10/08 deviennent des LOIS (elles ont coûté cher) :

| Paramètre | Valeur | Interdiction associée |
|---|---|---|
| Champ HORIZONTAL | 36°, le vertical se DÉDUIT du format | ne JAMAIS fixer le champ vertical sur téléphone (téléobjectif → « scène vue de loin ») |
| Hauteur d'œil | 1.22 m | plus haut = drone, plus bas = on ne voit plus par-dessus les voitures garées |
| Tangage | −0.05 rad | |
| Poste de conduite | 38 % de l'écran en portrait (24 % en paysage) + capot | le poste FAIT PARTIE de la caméra : c'est lui qui rend le champ horizontal possible |
| Distance des événements | naissance ≤ 70 m, instant lisible entre 15 et 45 m | au-delà de 70 m une scène n'est pas difficile, elle est invisible |
| Loi de lisibilité | `620 × s / d` px : statique ≥ 24, mouvement ≥ 12 | la lisibilité gagne. Toujours. |

Évolution du capot CSS : il devient **LA CUPRA** (signature X) : laque violette
`#7c5cd8` avec un reflet de ciel dégradé et un liseré d'arête. Toujours en
CSS/dégradés, zéro 3D, mais dessiné.

---

## 10 · « LA SECONDE D'OR » (le moment JE L'AI VU)

Le VFX-identité de PermiGo. Sobre, précis, toujours identique :

1. **La coupe** : 60 ms pour tomber à 8 % de la vitesse du monde. Le son se coupe net (un seul « tic »).
2. **Le monde s'éteint, pas l'indice** : désaturation vers le violet-gris (`0.86` de force, jamais 1.0 : la rue doit rester reconnaissable) SAUF un disque de rayon 0.16 écran autour de la découverte, qui garde ses couleurs pleines.
3. **L'anneau d'OR** : `#f2b32c`, se referme de ×1.9 à ×1.0 en 240 ms sur la cible, opacité 0.9.
4. **Le chiffre d'OR** : `+ N,N s` naît SOUS LE DOIGT, monte de 30 px, s'efface en 1.4 s.
5. **La reprise** : 120 ms pour revenir au temps réel. Total ≈ 0.42 s : jamais plus, le rythme prime.
6. **L'erreur** (« Pas encore ») : pastille violette discrète en bas. JAMAIS de rouge, jamais de tremblement d'écran : on ne punit pas une hypothèse.
7. **Le rembobinage** : flash blanc 0.5 s → replay désaturé à 2.6× (caméra ET scène, règle du 10/08) → à l'instant lisible : anneau d'or + le chiffre des secondes perdues. La leçon utilise le MÊME langage que la récompense : l'or marque ce qu'il fallait voir, dans les deux cas.

L'or n'existe QUE dans ces moments et dans le compteur. C'est sa rareté qui
fait la signature.

---

## 11 · L'UI (le même monde)

- **Une police : Archivo** (800/900 pour les chiffres et titres, 600/700 pour les phrases). `tabular-nums` sur tout chiffre. Aucune autre famille, jamais.
- **Trois couleurs de parole** : OR = récompense (gains, compteur, total) · VIOLET sur verre sombre = guidance (amorces, relances, « Pas encore ») · CRÈME `#f4f0ff` = neutre. Jamais de blanc pur.
- **Formes** : pastilles `border-radius: 999px` pour ce qui parle, cartes r = 20 px pour ce qui conclut, verre `rgba(23, 17, 48, 0.72)` + blur 6 px.
- **Un seul emplacement de parole** (règle existante) : tout message à l'élève passe par la pastille au-dessus du pare-brise. Deux messages ne s'empilent jamais.
- **Mouvement UI** : entrées en 200 ms `cubic-bezier(0.16, 1, 0.3, 1)`, sorties en 150 ms. Le compteur « respire » (scale 1.12) à chaque gain.
- Le test : une capture de l'UI seule doit dire « jeu vidéo premium », jamais « dashboard SaaS ».

---

## 12 · LA PERFORMANCE (triage assumé)

Cibles : iPhone 12 / Android milieu de gamme, Safari, 60 fps.
Budgets : **≤ 140 draw calls** · **≤ 180 k triangles** · **≤ 12 textures canvas ≤ 512²** · **temps moteur ≤ 6 ms/image** · **0 asset réseau** (le monde entier est procédural : plus de GLB, plus de problème de CSP, chargement instantané).

| INDISPENSABLE | BONUS | INUTILE / TROP CHER |
|---|---|---|
| envMap PMREM (le glossy) — déjà gratuit | reflets de pluie (roughness du sol) | SSAO temps réel |
| textures canvas | particules feuilles/poussière (≤ 30 sprites) | normal maps partout |
| ombres 1 cascade 2048 + intensity | corniches/balcons géométriques niveaux 1-2 | contours ligne claire |
| jitter + liseré + calotte | grain animé | DOF, motion blur |
| fenêtres EN TEXTURE + façade = 1 mesh | | ombres par lampadaire (nuit) |
| InstancedMesh (arbres, roues, dalles) | | géométrie de fenêtres |

---

## 13 · LA VÉRIFICATION AUTOMATIQUE (la DA se lint)

Trois scripts en Node + Playwright (dans `outils/da/`), exécutés sur 3
captures fixes (t = 3 s, 15 s, 26 s, graine fixe). Une phase n'est PAS finie
tant qu'ils ne passent pas :

1. **`verif-teinte.mjs`** — anti-grisaille. Sur la zone monde (hors ciel, hors poste) : pixels quasi gris (saturation < 8 %) ≤ 20 % · part de teintes chaudes (20° à 75°) ≥ 30 % · saturation moyenne ≥ 0.18 · au moins un amas saturé (l'accent de la règle des trois valeurs).
2. **`verif-lisibilite.mjs`** — la loi du §2, calculée hors navigateur depuis `scenario.js` (extension du `portees.mjs` existant) : chaque porteur ≥ 24/12 px à son instant lisible, dans le cadre, cône de vue dégagé.
3. **`verif-perf.mjs`** — `renderer.info` (draw calls, triangles) + temps moteur moyen sur 400 images, contre les budgets du §12.

Un agent qui « trouve ça joli » n'est pas un critère. Les scripts, oui.
L'œil de Rayan tranche ce que les scripts ne mesurent pas.

---

## 14 · CE QUE CETTE DA INTERDIT

- Les GLB texturés nuit dans une scène de jour (piège documenté, tombé deux fois).
- Tout asset généré par IA dans l'app (règle Rayan du 06/08) : ici tout est géométrie + canvas, le problème disparaît.
- Le photoréalisme, les textures photo, les packs d'assets génériques.
- `#ffffff`, `#000000`, les gris purs, les matériaux/lumières par défaut.
- L'or hors des moments de récompense.
- Une info pédagogique sous 24 px (statique) ou 12 px (mouvement).
- `Math.random` dans la génération.
- Une deuxième police.
- Fixer le champ de vision vertical.
