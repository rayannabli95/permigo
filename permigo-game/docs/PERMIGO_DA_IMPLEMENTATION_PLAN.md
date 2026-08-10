# PERMIGO DA — PLAN D'IMPLÉMENTATION

> Version 1.0 · 10/08/2026. Compagnon d'exécution de `PERMIGO_GAME_ART_BIBLE.md`.
> Toute décision artistique est DÉJÀ prise dans la bible : si une phase semble
> demander un choix esthétique, la réponse est dans la bible. Si elle n'y est
> vraiment pas, on demande à Rayan, on n'improvise pas.

## Comment travailler (toutes les phases)

1. Lire la section de la bible citée par la phase. Elle fait autorité.
2. Construire dans `src/game/da/` (nouveau module). `kit.js` reste intact pour les anciennes scènes tant que la phase 8 n'a pas basculé tout le monde.
3. Vérifier : `npm run build` vert → capture Playwright en 390×844, `deviceScaleFactor: 2`, navigateur VISIBLE (jamais headless : rAF y tourne à 4 img/s) → lancer les scripts `outils/da/verif-*.mjs` de la phase.
4. Montrer à Rayan UNE image par critère visuel, pas un pavé.
5. Une phase se termine par UN commit dédié. Jamais deux phases dans un commit.

### Interdits globaux (toutes phases)

- **Ne pas toucher** : `src/game/avance/scenario.js` (timings, chorégraphies), la logique de `moteur.js` (phases, gains, rembobinage), `router.js`/`main.js`, les textes élève, la CSP, `package.json` (zéro dépendance nouvelle).
- Pas de `Math.random` : LCG seedé (copier `des()` de `rue.js`).
- Pas d'asset réseau : tout est géométrie + CanvasTexture.
- Aucun hex hors de `palette.js` à partir de la phase 0.
- Chaque valeur non triviale porte un commentaire qui dit POURQUOI (style maison).

### Harnais de capture (à créer en phase 0, réutilisé partout)

`outils/da/capture.mjs` : ouvre `#/avance` (ou une page banc), graine fixe,
attend `data-t`, capture aux instants demandés. Base : les scripts de shoot du
10/08 (attendre `.av` `data-t`, jamais l'horloge murale).

---

## PHASE 0 — Les fondations (palette, textures, vérification)

**Objectif** : le socle que toutes les phases importent. Aucun changement visible.
**Bible** : §3, §5, §13.
**Fichiers** : `src/game/da/palette.js` · `src/game/da/textures.js` · `outils/da/capture.mjs` · `outils/da/verif-teinte.mjs` · `outils/da/verif-lisibilite.mjs` · `outils/da/verif-perf.mjs`.

On construit :
- `palette.js` : TOUTES les couleurs de la bible §3, exportées par rôle (`FACADES`, `VEHICULES_NEUTRES`, `VEHICULES_PORTEURS`, `OR`, …) + `jitter(hex, graine)` (±4 % luminosité, ±3° teinte) + `liseré(hex)` (+18 % luminosité).
- `textures.js` : générateurs CanvasTexture (`bitume()`, `trottoir()`, `facade(params)`, chacun ≤ 512², sRGB, seedé).
- Les trois scripts de vérification avec les seuils de la bible §13 (seuils dans un objet en tête de fichier, pas éparpillés).

**Acceptation** : `node outils/da/verif-teinte.mjs` tourne sur l'état ACTUEL et échoue (il doit prouver qu'il détecte la grisaille d'aujourd'hui) · `verif-lisibilite.mjs` passe sur `scenario.js` actuel · build vert.
**Sortie** : les trois scripts tournent et le rapport de la rue actuelle est archivé (c'est le « avant »).

---

## PHASE 1 — La rue témoin (lumière + sol)

**Objectif** : la transformation au meilleur ratio. Même géométrie qu'aujourd'hui, mais la recette SEIZE HEURES et le nouveau sol. C'est la phase qui doit faire dire « ah, ça change tout ».
**Bible** : §4 (recette complète), §7 (cotes), §3.
**Fichiers** : `world.js` (option `heure: "seize"`), `rue.js` (sol, marquages, trottoirs depuis `da/`), `moteur.js` (uniquement le bloc d'étalonnage post), `avance.css` (capot Cupra).

On construit :
1. La recette lumière du §4, valeur par valeur (soleil `[-28, 34, 16]`, hémisphère sol `#8a76a8`, intensity ombres 0.72, étalonnage).
2. Le sol : texture bitume canvas (traces de roulement, patchs, joints), caniveaux, bordures à liseré, trottoir en dalles, marquages blanc cassé, un passage piéton par zone d'événement piéton (`TROUS` 3 et 5).
3. Le capot CSS devient la Cupra violette : laque `#7c5cd8`, reflet de ciel en dégradé, liseré d'arête (signature X). CSS pur.

**Ne pas toucher** : bâtiments, véhicules, personnages (ils resteront moches UNE phase, c'est voulu : on isole l'effet lumière).
**Acceptation** : `verif-teinte` passe sur la capture t = 15 s · les ombres échantillonnées sont violettes (teinte 260-290°) · la capture « rue vide » (graine sans acteurs) est présentable seule · `verif-perf` dans les budgets.
**Sortie** : Rayan valide 2 captures (rue vide, rue jouée). C'est le GO artistique du reste.

---## PHASE 2 — Le véhicule maître (die-cast)

**Objectif** : `da/vehicules.js`, l'usine à véhicules-jouets qui remplace `kit.vehicule` dans `#/avance`.
**Bible** : §6 véhicules (toutes les cotes y sont).

On construit : `vehicule(type, teinte, graine)` → citadine, berline, SUV, utilitaire, bus, moto. Caisse chanfreinée (BoxGeometry segmentée + arrondi des sommets, ou assemblage caisse + visière), visière d'un seul tenant, arches sombres, roues Ø 0.44×h avec jante claire, feux en bandeau émissif (avant crème / arrière rouge, avec `freiner()` comme l'existant), tache au sol intégrée. Finition : `laquee` (porteurs, roughness 0.18, envMap 1.3) ou `neutre` (garées, 0.42/0.8). Roues = InstancedMesh par scène si possible.
Remplacements dans `avance/` : voitures garées, porteurs (`hesite` en rouge laqué), camionnette (utilitaire procédural : le GLB `camion.glb` sort du jeu → plus AUCUN GLB dans `#/avance`).

**Acceptation** : planche de 6 silhouettes × 3/4 avant, identifiables par type en 100 px de haut · le porteur rouge à 68 m ≥ 24 px et ΔL ≥ 18 vs voisines (verif-lisibilite étendu) · reflet de ciel visible sur une laquée en capture · zéro requête réseau sur `#/avance` (onglet réseau vide).
**Sortie** : Rayan valide la planche + une capture en jeu.

---

## PHASE 3 — L'architecture modulaire

**Objectif** : `da/batiments.js`, la grammaire SOCLE + ÉTAGES + COURONNE.
**Bible** : §6 bâtiments, §5 (fenêtres EN TEXTURE, 1 mesh par façade).

On construit : `batiment(graine, { largeur, etages, commerce })` → UN mesh de façade avec texture canvas (fenêtres peintes, encadrements, AO de contact en bas, dégradé vertical) + corniche-liseré + toit (parapet ou pente) + géométrie SEULEMENT pour balcons/devantures des niveaux 0-1. `rangee(graine, longueur)` applique les règles de rue (familles voisines différentes, hauteurs variées, un accident tous les 5-7 modules, un commerce tous les 3-4). Branchement dans `rue.js` à la place des blocs actuels.

**Acceptation** : capture d'une rangée de 10 : aucune paire voisine même famille/même hauteur · nombre de draw calls des façades ≤ 30 pour 400 m (vs centaines de plans-fenêtres aujourd'hui) · `verif-teinte` et `verif-perf` passent · silhouette des toits contre le ciel variée (capture dédiée).
**Sortie** : Rayan valide 1 capture de rue complète (lumière phase 1 + voitures phase 2 + façades phase 3).

---

## PHASE 4 — Les personnages (quilles)

**Objectif** : `da/personnages.js`, remplace les piétons GLB et blocs.
**Bible** : §6 personnages (proportions, vocabulaire d'intentions), §8 (rythme).

On construit : `personnage(graine, { enfant })` → capsule + tête sphère surdimensionnée, palette §3 (enfants ultra-saturés), et l'API d'intentions : `regarder(cap)`, `traverserVouloir()`, `hesiter(t)`, `elancer(t)`, `attendre(t)`, `marcher(t)` (rebond 3 cm, tête qui traîne 80 ms). Branchement : passants d'ambiance de `rue.js` + acteurs de `scenario.js` (l'enfant, le copain qui saute, le passant-poubelle) SANS changer un seul timing : seules les poses/proportions changent, les fonctions `pose(te)` gardent leurs instants.

**Acceptation** : `verif-lisibilite` : la tête du cycliste/piéton en rotation ≥ 12 px à l'instant lisible · un enfant à 26 m ≥ 24 px · test A/B en capture : « regarde derrière » lisible sur une vignette de 150 px · timings de `scenario.js` inchangés au diff.
**Sortie** : Rayan joue une partie et confirme que les intentions se lisent MIEUX qu'avant.

---

## PHASE 5 — Végétation et mobilier

**Objectif** : `da/vegetation.js` : arbres à calotte, mobilier urbain.
**Bible** : §0 (calotte), §3, §12 (instancing).

On construit : arbre = masse feuillage sombre + CALOTTE claire décalée côté soleil (`[-28, 34, 16]` normalisé) + tronc ; 3 gabarits (rue, petit, buisson) en InstancedMesh. Mobilier : lampadaire, banc, potelets, poubelle, abribus — palette bois/métal §3, liserés sur les arêtes hautes. Remplace `arbre.glb`.

**Acceptation** : les calottes font face au soleil sur TOUTE la rue (capture) · draw calls végétation ≤ 6 (instancing) · `verif-perf` passe.
**Sortie** : validation sur la capture de rue complète.

---

## PHASE 6 — La Seconde d'or + UI

**Objectif** : le VFX signature et la peau UI, aux valeurs de la bible.
**Bible** : §10 (timings exacts), §11, §3 (l'or).
**Fichiers** : `moteur.js` (uniquement anneau/focus/timings VFX), `post.js` (teinte du focaliser vers violet-gris au lieu de gris), `avance.css`, `avance.js` (classes/couleurs, pas la logique).

On construit : anneau et chiffres passent à l'OR `#f2b32c` · désaturation du focus vers violet-gris (0.86, disque 0.16) · compteur or · pastilles violet/verre · rembobinage : l'anneau d'or marque l'instant lisible (déjà en place, recolorer). RIEN d'autre : pas de particules, pas de shake.

**Acceptation** : capture du moment suspendu conforme au §10 point par point (checklist) · l'or n'apparaît sur AUCUNE autre capture (grep visuel des 3 captures fixes) · timings mesurés ≈ 60/300/120 ms.
**Sortie** : Rayan compare avant/après du moment « je l'ai vu ».

---

## PHASE 7 — Le générateur de scènes + le score de scène

**Objectif** : produire 100 rues sans redécider la DA : `da/generateur.js` + `outils/da/score-scene.mjs`.
**Bible** : §2 loi 5, §13, §7 (occupation stationnement).

On construit : `genererRue(graine, params)` (longueur, densité, commerces, zones réservées EN CÔNES — règle du 10/08 : un objet proche masque un cône, pas une ligne) et le scoreur : pour une graine donnée → densité stationnement 40-60 %, règle des trois valeurs OK, cônes de vue des porteurs dégagés, lisibilité §2, budgets perf. Sortie : un JSON de score par graine ; une graine qui échoue est simplement écartée.

**Acceptation** : 20 graines générées → ≥ 15 passent le scoreur sans intervention · les 5 échecs sont expliqués par le rapport (pas de mystère).
**Sortie** : la production de scènes est un tirage de graines filtré par le scoreur. C'est l'usine.

---

## PHASE 8 — Optimisation + déclinaisons d'heure

**Objectif** : tenir les budgets partout, puis décliner.
**Bible** : §12 (budgets et triage), §4 (déclinaisons).

On construit : passe d'instancing (roues, fenêtres restantes, dalles, potelets), fusion de géométries statiques par tronçon de 50 m, audit `renderer.info` avant/après · puis `da/lumiere.js` : `heure("matin" | "seize" | "golden" | "pluie" | "nuit")` qui ne touche QUE les paramètres autorisés §4 (les ombres restent violettes partout) · bascule éventuelle de `#/situation-3d` et du lab sur `da/` (décision Rayan à ce moment-là).

**Acceptation** : ≤ 140 draw calls, ≤ 180 k triangles, ≤ 6 ms moteur sur la rue complète · 5 captures (une par heure) où les trois signatures restent identifiables · `verif-teinte` passe sur matin/seize/golden (pluie et nuit ont leurs propres seuils, à caler alors).
**Sortie** : la DA est déclarée v1. Tout écart ultérieur = amendement de la bible, jamais une exception locale.

---

## Ordre et dépendances

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
        (2,3,4,5 permutables si besoin, mais 1 d'abord : la lumière
         est le juge de tout le reste, et 6 avant 7 : le scoreur
         doit connaître les couleurs finales du gameplay)
```

Chaque phase est UNE session de travail d'un modèle léger. Le prompt type :

> « Exécute la PHASE N de `docs/PERMIGO_DA_IMPLEMENTATION_PLAN.md`. Lis
> d'abord les sections de la bible citées. Ne prends aucune décision
> artistique : tout est dans la bible. Termine par les scripts de
> vérification et les captures d'acceptation. »
