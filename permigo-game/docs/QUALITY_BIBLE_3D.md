# Quality Bible 3D — PermiGo

> **La règle d'or : une PR n'ajoute jamais seulement une fonctionnalité. Elle
> préserve ou augmente la qualité perçue.** Une PR qui ajoute du contenu en
> faisant tomber les images par seconde est refusée, même si la fonctionnalité
> marche.
>
> Ce document est une **grille de contrôle**, pas un texte d'intention. Chaque
> ligne est vérifiable. Le plan qui explique le pourquoi est dans
> [`PLAN_PRODUCTION_3D.md`](PLAN_PRODUCTION_3D.md).

---

## 1. Les seuils chiffrés

Référence : iPhone 12 ou Android milieu de gamme 2023, en portrait.

| Critère | Minimum refusé en dessous | Cible |
|---|---|---|
| Largeur de rendu | 900 px | **≥ 1080 px** |
| Densité de pixels | 2,0 | 2,0 à 3,0, adaptative |
| Anticrénelage | aucun toléré | **MSAA 4×** |
| Images par seconde | 30 stables | **60** |
| Chute d'images | aucune sous 26 pendant plus d'1 s | — |
| Triangles par image | 200 000 | **≤ 150 000** |
| Appels de dessin | 90 | **≤ 60** |
| Texture d'un objet proche | 512 px | **1024 px**, en KTX2 |
| Texture d'un objet lointain | — | **256 à 512 px** |
| Mémoire textures | 64 Mo | **≤ 48 Mo** |
| Poids téléchargé d'une situation | 6 Mo | **≤ 4 Mo** |
| Ouverture jusqu'au jouable | 4 000 ms | **≤ 2 500 ms** en 4G |
| Poids d'un modèle après optimisation | 500 Ko | **≤ 300 Ko** |
| Carte d'ombre | — | **1024**, cadre de 60 m |
| Niveaux de détail | — | au-delà de **60 m** |

## 2. Caméra et cadrage

| Critère | Règle |
|---|---|
| Champ vertical | **55°** au repos, **60°** au maximum. Au-delà c'est un grand-angle : une voiture à 60 m fait quelques pixels et on ne la voit pas arriver |
| Hauteur de l'œil en conduite | **1,24 m**. C'est elle, et elle seule, qui décide de la part d'écran mangée par l'habitacle |
| Plan proche / plan lointain | 0,25 m / 220 m |
| Plan large en portrait | **caméra basse, regard à l'horizontale**. Jamais de plongée : elle ne cadre que du bitume |
| Tremblement de main | présent, proportionnel à la vitesse, jamais visible consciemment |
| Durée d'un plan non jouable | **≤ 4 s**, et **toujours interruptible au premier appui** |

## 3. Animation

| Critère | Règle |
|---|---|
| Courbes | **jamais linéaires**. Départ franc, arrivée douce |
| Poids | tout véhicule roule en virage, plonge au freinage, se cabre à l'accélération |
| Personnages | **aucun personnage ne glisse**. Un piéton qui se déplace marche |
| Inertie de caméra | la caméra extérieure suit avec retard, elle ne colle pas |
| Retour à l'état neutre | volant, regard, suspension reviennent progressivement |
| Transition entre deux écrans | **180 à 320 ms**. Au-delà on attend, en deçà on ne voit rien |
| Carton de fin | **≥ 400 ms** d'apparition, il doit se poser |

## 4. Lumière et matériaux

| Critère | Règle |
|---|---|
| Somme des lumières sur une surface plate | **< 1,4** sinon tout l'horizontal est brûlé |
| Nombre de sources | **3** : ciel, soleil rasant, contre-jour froid |
| Carte d'environnement | **obligatoire**, cuite une fois depuis le ciel (PMREM) |
| Type de matériau | `MeshStandardMaterial` partout. `Lambert` ne reçoit PAS la carte d'environnement |
| Métal | `metalness = 0` sauf métal réel |
| Habitacle | `envMapIntensity = 0,12`. Un intérieur ne reçoit ni ciel ni décor |
| Ombres | jamais du noir pur. Le bleu du ciel les remplit |
| Halo | seuil **0,93**, force **0,42**. Un halo généreux fait de la buée, pas du cinéma |
| Étalonnage | ombres vers le violet froid, hautes lumières vers l'ambre |

## 5. Interface

| Critère | Règle |
|---|---|
| Taille de texte minimum | **13 px**, et 15 px pour tout ce qui se lit en conduisant |
| Zone tactile | **≥ 56 px** de côté, **≥ 44 px** sans exception |
| Marge basse | **90 px** libres au-dessus du bord bas, plus la zone sûre |
| Marge haute | **60 px**, plus la zone sûre |
| Police | **Archivo uniquement**. Chiffres qui changent en chasse fixe |
| Texte pendant la conduite | **une ligne au maximum**, et elle s'efface |
| Ponctuation | **zéro tiret**, **zéro virgule** dans un titre, un bouton ou un libellé |
| Écriture inclusive | **interdite**. On reformule pour que la question du genre ne se pose pas |
| Contraste | 4,5:1 minimum sur tout texte lisible |
| Calque invisible | **`pointer-events: none` obligatoire** quand il est masqué. Un calque transparent plein écran avale chaque appui, et rien ne le signale |

## 6. Son

| Critère | Règle |
|---|---|
| Niveau crête en sortie | **< 0,8**. Un limiteur en bout de chaîne, toujours |
| Niveau efficace en conduite | autour de **0,10** |
| Régime moteur | suit la vitesse réelle, **avec boîte de vitesses**. Sans elle c'est une sirène |
| Rampe de paramètre | `setTargetAtTime`, jamais `.value` écrit chaque image (ça grésille) |
| Coupure | accessible d'un pouce, **mémorisée** d'une situation à l'autre |
| Réveil du son | au premier geste, jamais avant. Le navigateur l'exige |
| Silence | le carton de fin coupe le moteur. Un verdict se lit dans le silence |

## 7. Direction artistique

**On ne vise pas le photoréalisme.** Notre cible est un stylisé premium :
volumes lisibles, silhouettes fortes, matériaux magnifiques, lumière
spectaculaire, couleurs maîtrisées. Entre Astro Bot et un jeu de conduite
mobile haut de gamme, avec l'identité PermiGo.

**Interdits absolus :**
- 🚫 Un objet qui ressemble à un asset gratuit téléchargé.
- 🚫 Une texture visiblement répétée.
- 🚫 Un objet qui flotte, sans contact au sol.
- 🚫 Un halo posé pour faire joli.
- 🚫 Un décor vide : chaque lieu raconte quelque chose.
- 🚫 Le rendu « template IA » : composition centrée, arrondis partout,
  dégradé violet vers bleu, emoji en marqueur de section.
- 🚫 Une étincelle, une flamme, une particule lumineuse sur une pièce de
  voiture. Une pièce mécanique ne pète pas.

**Palette :** nuit violette PermiGo. Ombres vers le violet froid, hautes
lumières vers l'ambre du couchant. Le violet de l'accent ne sert qu'à une
chose à la fois.

## 8. La grille de relecture d'une PR

À copier dans la description de chaque PR touchant la 3D.

```
## Qualité
- [ ] Images par seconde mesurées AVANT / APRÈS, sur un vrai téléphone
- [ ] Triangles et appels de dessin mesurés (voir /lab, script audit)
- [ ] Capture avant / après en portrait, à la même seconde de la même situation
- [ ] `npm run build` vert
- [ ] Aucune erreur en console pendant une manche complète
- [ ] Les six situations se terminent toujours, avec les mêmes chiffres
- [ ] Aucun seuil de la Quality Bible franchi vers le bas
- [ ] Chaque nouveau modèle vu dans /lab/apercu/ avant intégration
```

## 9. Comment mesurer

Les scripts vivent dans le dossier de travail de session. Ce qu'ils font :

| Ce qu'on veut savoir | Comment |
|---|---|
| Triangles, appels, textures, mémoire | Parcourir la scène + `rendu.info` avec `autoReset = false` |
| Coût GPU réel d'une image | Dessiner 90 fois de suite avec `gl.finish()` entre. **Jamais** en comptant les images par seconde : l'écran de test peut être bloqué à 30 Hz et cacher tout |
| Résolution réellement rendue | `gl.drawingBufferWidth / Height`, pas la taille CSS |
| Une manche complète | Jouer les six situations et comparer le journal à la référence |
| Le son | Espionner `AudioParam.setTargetAtTime` et brancher un analyseur sur la sortie |
| Un pixel suspect | Tirer un rayon depuis ce pixel et lire le matériau touché. **Ne jamais deviner à l'œil** |

⚠️ **Playwright en mode caché rend en logiciel** (83 ms par image). Tout
chiffre de performance se prend avec `headless: false`.

## 10. Les pièges déjà payés

Ils ne se redécouvrent pas. Chacun a coûté une demi-journée.

- 🔴 **`computeBoundingBox()` ignore l'index.** Après avoir retiré des
  triangles, la boîte reste celle d'avant et tout ce qui se calcule ensuite est
  faux. `geo.boundingBox = null` puis recalcul.
- 🔴 **Rendre un TABLEAU de matériaux à un maillage sans groupes** : il ne
  dessine plus rien, sans une seule erreur en console. Se souvenir si c'était
  un tableau AVANT de le remplacer.
- 🔴 **`eclairer` au-dessus de 1 sur un modèle texturé brûle la texture** :
  `material.color` y est un blanc neutre qui multiplie la texture, pas la
  couleur de l'objet.
- 🔴 **`meshopt` sans `setMeshoptDecoder` échoue en silence.**
- 🔴 **Le seuil de dégradation ne peut pas être 45 images/s** : beaucoup
  d'écrans sont bloqués à 30 Hz.
- 🔴 **Les deux premières secondes ne se mesurent jamais** : compilation des
  shaders et première image d'ombres.
- 🔴 **Le milieu de la texture d'un dôme de ciel est l'HORIZON**, pas le bas.
- 🔴 **Un sol dessiné en CSS 3D fait clignoter l'écran.** Il se dessine au canvas.
- 🔴 **`overflow: hidden` tue `animation-timeline: view()`**, sans erreur.
- 🔴 **Un backtick dans un commentaire CSS d'un template `STYLE` casse le build.**
