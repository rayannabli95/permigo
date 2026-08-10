# 🌅 Night run — 11/08/2026

## ⏱ Temps

- Début : 03 h 30 · Fin : 07 h 00 · **3 h 30**
- Phases du plan DA exécutées : **2, 3, 4, 5 sur 8** (les 0 et 1 l'étaient déjà hier soir)
- Six commits, tous poussés sur `fix/epuration-app-eleve`

## 🎯 Ce que j'ai décidé seul, et pourquoi

`.claude/NIGHT_RUN.md` décrit un programme écrit en juillet (accueil élève,
parcours, trophées, onboarding). Tous ces chantiers sont périmés. J'ai donc
gardé **l'esprit** du protocole (autonomie, commits incrémentaux, log, rapport)
et je l'ai appliqué à la **priorité réelle** : exécuter
`docs/PERMIGO_DA_IMPLEMENTATION_PLAN.md`, écrit hier soir exactement pour ça.

J'ai aussi changé l'ordre des phases : 2, 4, 3, 5 au lieu de 2, 3, 4, 5. Le
plan l'autorise, et j'ai classé par impact visuel : les véhicules étaient le
pire élément à l'écran, les personnages viennent juste après parce que notre
gameplay EST la lecture d'intentions.

## ✅ Ce qui est fait

### Phase 2 — les véhicules · `bcafb06`

Une voiture n'est plus un empilement de boîtes, c'est **un profil extrudé avec
biseau** : on dessine sa silhouette vue de côté et on l'étire sur la largeur.
Le biseau donne gratuitement les arêtes cassées qui attrapent le soleil, et un
nouveau gabarit ne coûte que six nombres — donc la flotte s'étend sans
modélisation. Cinq silhouettes : citadine, berline, SUV, utilitaire (sans
vitrage arrière, c'est ce trou qui le fait reconnaître de loin) et bus.
Visière d'un seul tenant, arches de roue creusées, jantes, feux en bandeau.

### Phase 4 — les personnages · `eb8240c`

Conçus **à l'envers d'un personnage de jeu** : ni visage, ni doigts, ni plis.
On grossit l'organe que le joueur doit lire. Tête à 20 % de la taille (26 %
chez l'enfant), et surtout une **chevelure qui couvre l'arrière du crâne** :
sans elle, une sphère tourne sans qu'on le voie et « il a regardé derrière
lui » devient invisible. Le buste tourne indépendamment du bassin, la tête
arrive avant les épaules. Le cycliste est reconstruit sur ce principe.

La marche est pilotée par le **déplacement réellement mesuré** de l'acteur :
un piéton ne peut donc plus glisser, et le rembobinage reste juste.

### Phase 3 — l'architecture · `0e900d6`

La grammaire SOCLE + ÉTAGES + COURONNE. Deux couronnes (toit en pente avec
cheminée, ou terrasse avec parapet et cage d'escalier), balcons sur les deux
premiers niveaux seulement, auvents de commerce qui portent une vraie ombre.
Et les règles de rue : voisins de familles et de hauteurs différentes, un
accident de rythme tous les cinq à sept parcelles.

### Phase 5 — le mobilier · `7ec3da9`

Lampadaires, bancs, corbeilles, files de potelets, abribus, arbres à calotte
avec grille au pied. Un trottoir vide n'est pas neutre, il est faux.

### Performance · `d59c060`

**`#/avance` n'émet plus une seule requête d'asset.** Le lint a trouvé quatre
GLB morts qui se chargeaient encore avant la première image. Plus de
dépendance à la CSP, qui avait déjà cassé toute la 3D en prod le 9 août.

## 🔴 Le problème que je n'ai PAS réglé

**1 606 appels de dessin par image, pour un budget de 140.**

Les triangles vont bien (53 000 sur 180 000) et les assets sont à zéro : le
problème est le NOMBRE D'OBJETS, pas leur poids. Cent immeubles de huit pièces,
cinquante voitures de quatorze pièces, du mobilier, des arbres. Sur ce Mac
l'image tient les 16,7 ms ; sur un téléphone, ça ne tiendra pas.

Je ne l'ai pas attaqué cette nuit **volontairement** : c'est la phase 8 du
plan, elle demande de fusionner les géométries en passant les nuances en
couleurs par sommet, et ce n'est pas un chantier à mener à 6 h du matin sans
personne pour regarder le résultat. J'ai fait les deux gains sûrs à la place
(cache de matériaux, rue ramenée de 400 à 300 m).

**La recette pour la phase 8 est simple** : quantifier chaque famille de
façade à trois tons (mur, liseré, sombre), passer ces tons en couleurs par
sommet, puis fusionner tous les immeubles d'une rangée en un seul maillage par
matériau. Cent immeubles devraient tomber à une vingtaine d'appels.

## 🧪 À vérifier à ton réveil

- [ ] La rue te plaît. C'est la seule question qui compte, le reste est mesuré.
- [ ] Le cycliste : est-ce que son coup d'œil par-dessus l'épaule se voit ?
- [ ] Les deux enfants : est-ce qu'ils se repèrent l'un en face de l'autre ?
- [ ] Le capot violet : trop, pas assez, ou juste ?
- [ ] Les couleurs de façades : sorbet ou encore trop Lego ?

## 📐 Mesures

| Lint | Résultat |
|---|---|
| `verif-teinte` | ✅ gris 0,06 à 0,09 (≤ 0,20) · chaud 0,53 à 0,70 (≥ 0,30) · saturation 0,20 à 0,24 (≥ 0,18) · accent 0,10 à 0,20 |
| `verif-perf` | ❌ **1 606 appels** (≤ 140) · ✅ 52 747 triangles · ✅ 0 asset réseau |
| `npm run build` | ✅ vert à chaque commit |
| Console | ✅ zéro erreur sur `#/avance` et `#/slice` |
| `#/situation-3d` | ✅ démarre toujours (ses erreurs sont un 403 d'auth locale, sans rapport) |

## 🤔 Les cinq choses que le rendu m'a apprises

1. **Une couleur se choisit APRÈS le rendu.** Les teintes franches de la bible sortaient Lego sous un soleil à 2,2 : désaturées d'un tiers.
2. **Une texture est MULTIPLIÉE par la couleur du matériau**, donc un encadrement ne peut jamais être plus clair que son mur. Il faut peindre la couleur dans la texture.
3. **Les carrosseries claires brûlent.** Six neutres différents ressortaient tous blancs. Le nuancier doit viser la valeur voulue À L'ÉCRAN.
4. **Un trou de scène protège un CÔTÉ, pas les deux.** Le couloir de vue de la voiture qui hésite vidait aussi le trottoir d'en face : la rue devenait un désert au moment précis où le jeu dit « regarde loin ».
5. **Le lint trouve ce que la relecture ne trouve pas.** La moitié de l'image quasi grise, quatre téléchargements morts : deux défauts réels, aucun visible à la lecture du code.

## ⏸ Non fait

- **Phase 6** (la Seconde d'or en or, l'UI) : le VFX marche déjà, ce n'était pas le plus urgent face à un monde qui faisait « primitives ».
- **Phase 7** (générateur de scènes et scoreur) : elle n'a de sens qu'une fois la DA validée par toi.
- **Phase 8** (fusion des géométries) : voir plus haut.
