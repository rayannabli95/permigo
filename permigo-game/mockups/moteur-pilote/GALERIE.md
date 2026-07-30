# Mode Pilote — la galerie d'éléments

> Décision de Rayan, 30/07/2026 : chaque compétence REMC devient un jeu.
> On assemble les missions à partir d'une galerie d'éléments réutilisables,
> au lieu de dessiner une scène par mission.

## 1. La règle de cohérence (à lire avant de produire quoi que ce soit)

Le projet a deux familles de visuels et **une seule lumière**.

| Famille | Sert à | Rendu |
|---|---|---|
| **Photo étalonnée** | tout ce qui est dans la voiture, plus le tour de voiture | photo réelle, puis un étalonnage unique en CSS |
| **Moteur isométrique** | tout ce qui est situation de route | `components/eleve/situation-scene.js`, repeint aux couleurs de la nuit |

**L'étalonnage unique**, appliqué à TOUTE photo du jeu, jamais au cas par cas :

```css
.scene img { filter: saturate(.42) contrast(1.06) brightness(.82); }
.scene::after {                     /* posé par-dessus la photo */
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(139,123,240,.30), transparent 62%),
    linear-gradient(180deg, rgba(24,18,65,.34), rgba(8,7,28,.62)),
    radial-gradient(120% 120% at 50% 45%, transparent 42%, rgba(6,5,20,.55) 100%);
}
```

Conséquence pour la production : **on génère les photos en lumière neutre de
jour**, jamais en nuit. C'est le code qui fait la nuit. Une seule image sert
donc au jour et à la nuit, et si la DA change on retouche 5 lignes de CSS au
lieu de 31 images.

⚠️ **Le moteur isométrique tourne en prod** dans « En situation ». On ne le
repeint PAS en place. On lui ajoute une palette optionnelle
(`renderSituationScene(scene, { palette })`), valeur par défaut = la palette
actuelle. Le mini jeu ne change pas d'un pixel.

## 2. Ce qui existe déjà (vérifié le 30/07)

**`public/art/fiches/` — 20 photos, 2,3 Mo**

Même acteur, même voiture, même lumière. C'est la base de cohérence, tout
nouvel élément doit s'y raccorder.

- Poste et regard (6) : `geste-poste-conduite`, `geste-regard-loin`,
  `geste-angle-mort`, `geste-marche-arriere-epaule`, `geste-retro-interieur`,
  `geste-retro-ext-gauche`, `geste-retro-ext-droit`
- Commandes (5) : `geste-cligno-commodo`, `geste-phares-commodo`,
  `geste-essuie-glaces`, `geste-levier-vitesse`, `geste-frein-main`
- Départ (2) : `geste-demarrage-contact`, `geste-ceinture`
- Fonds de route vierges vus du dessus (6) : `fond-intersection-croix`,
  `fond-route-campagne-2sens`, `fond-route-ville-2voies`,
  `fond-virage-campagne`, `fond-passage-pieton-ville`,
  `fond-stationnement-creneau`

**`public/signs/` — 18 panneaux en SVG.** Stop, cédez, priorité, giratoire,
sens interdit, sens unique, dépassement interdit, stationnement, piste
cyclable, dangers. Aucun panneau à produire.

**`components/eleve/situation-scene.js` — le moteur isométrique.** Dessine à
partir de données : croisement, giratoire, route, autoroute, insertion, plus
voitures, bus, camions, motos, vélos, piétons, feux, arbres, panneaux, halo
de priorité et chevrons de trajectoire. **Toute situation de route coûte 0
image.**

## 3. Ce qu'il manque : 31 photos, en 6 lots

Classés par réutilisation. Le lot 1 débloque le plus de missions.

### Lot 1 · Pieds et sélecteur (7 photos)
Débloque C1d, C1e, C1f, C3d, **et toute la voie boîte automatique**, qui est
aujourd'hui impossible à illustrer.

1. Pédalier boîte manuelle, 3 pédales, vue depuis le siège
2. Pied gauche enfoncé à fond sur l'embrayage
3. Pédalier boîte automatique, 2 pédales, repose-pied à gauche
4. Pied droit sur le frein, au repos
5. Pied droit enfoncé à fond sur le frein (freinage d'urgence)
6. Sélecteur automatique P/R/N/D, main absente
7. Main sur le sélecteur, position D

### Lot 2 · Tableau de bord (3 photos + 12 icônes vectorielles)
Débloque toute la mécanique « diagnostiquer », plus C1f, C1g, C3d, C4c.

8. Tableau de bord entier, moteur tournant, **tous voyants éteints**
9. Compte-tours en gros plan
10. Écran central, vue conducteur

Astuce qui économise 12 photos : la photo 8 est la **base neutre**, et chaque
voyant est une **icône vectorielle posée dessus** en pourcentage. Une image
sert donc à une dizaine de missions de diagnostic. Icônes à dessiner en SVG :
moteur, huile, batterie, ABS, airbag, température, pression des pneus, frein
à main, réserve de carburant, ESP, ceinture, feux.

### Lot 3 · Tour de voiture (7 photos)
Débloque C1g en entier, aujourd'hui non illustrable.

11. Voiture 3/4 avant
12. Voiture 3/4 arrière
13. Profil complet
14. Pneu de près, avec le témoin d'usure
15. Feu avant de près
16. Feu arrière de près
17. Capot ouvert, les niveaux

### Lot 4 · Pare-brise et conditions (7 photos)
Débloque C2a, C3a, C3b, C3c, C3f, C4b.

18. Pare-brise, route de campagne, dégagé (base de comparaison)
19. Pare-brise sous la pluie
20. Pare-brise dans le brouillard
21. Pare-brise sur route enneigée
22. Pare-brise à l'entrée d'un tunnel
23. Pare-brise face au soleil rasant
24. Pare-brise en ville dense, piétons et vélos

### Lot 5 · Réglages du poste (4 photos)
Débloque C1b et C1c.

25. Main sur la commande de réglage du siège
26. Main réglant le rétroviseur intérieur
27. Appui-tête, réglage
28. Mains en 9h15 sur le volant, gros plan

### Lot 6 · Manœuvres vues de dessus (3 fonds)
Débloque C1h et C1i. Le créneau existe déjà.

29. Stationnement en épi, place vide
30. Stationnement en bataille, place vide
31. Aire de demi-tour

## 4. La recette de génération (la cohérence se joue ici)

Non négociable, sinon la galerie se disperse et on perd le bénéfice.

- **Même voiture** que les 20 photos en stock : compacte européenne récente,
  planche de bord noire, tissu gris foncé, écran central rectangulaire.
- **Même acteur** : homme jeune, cheveux courts châtains, pull bleu marine,
  jean. Mains visibles, ongles nets, pas de bijou.
- **Lumière neutre de jour**, ciel couvert doux. Pas de nuit, pas de coucher
  de soleil, pas de contre-jour. **C'est le CSS qui fait la nuit.**
- **Cadrage carré 1:1**, sujet centré, 1440 px de côté minimum, export WebP
  qualité 82. Les images en stock font entre 39 et 170 ko, on reste dessous.
- **Aucun texte, aucune flèche, aucun chiffre dans l'image.** Les repères et
  les trajectoires sont des vecteurs posés par-dessus, sinon la traduction en
  arabe et en anglais est impossible.
- **Marge de jeu** : laisser au moins 60 px de vide autour de chaque élément
  cliquable, sinon la pastille de 46 px recouvre ce qu'elle désigne. Erreur
  déjà commise sur le labo, corrigée à la main ensuite.

## 5. Carte des 31 compétences

`M` = mécanique. `spot` trouver, `seq` ordonner, `dec` décider,
`traj` tracer, `diag` diagnostiquer. « iso » = aucune image, le moteur suffit.

| Comp. | M | Éléments |
|---|---|---|
| C1a Prendre en main le poste | spot | ✅ poste-conduite |
| C1b Régler son poste | seq | 25, 26, 27, ✅ ceinture, ✅ retro-interieur |
| C1c Tenir le volant, la trajectoire | spot + traj | 28, iso |
| C1d Démarrer et s'arrêter | seq | 1, 2, 6, 7, ✅ contact, ✅ levier, ✅ frein-main |
| C1e Doser accélérateur et frein | seq | 1, 3, 4 |
| C1f Changer de vitesse | seq + diag | ✅ levier, 9 |
| C1g Vérifications, tour de voiture | spot | 11, 12, 13, 14, 15, 16, 17 |
| C1h Manœuvres test | traj | ✅ fond-creneau, 29, 30, 31 |
| C1i Enchaîner les manœuvres | traj | réutilise C1h |
| C2a Lire la route avec les yeux | spot | 24, ✅ regard-loin |
| C2b Régler sa vitesse | dec | iso + ✅ panneaux |
| C2c Se placer sur la route | traj | iso |
| C2d Négocier un virage | traj | iso, ✅ fond-virage |
| C2e Croiser et dépasser | dec | iso |
| C2f Intersections et ronds-points | dec | iso |
| C2g Communiquer | seq | ✅ cligno, ✅ phares |
| C2h Conduire seul en ville | dec | iso |
| C3a Voir et être vu la nuit | seq | ✅ phares-commodo, 18 |
| C3b Pluie, neige, brouillard | dec | 19, 20, 21 |
| C3c Quand ça glisse | traj | iso, 19 |
| C3d Freinage d'urgence, ABS | seq + diag | 5, 8 + icône ABS |
| C3e Voie rapide et autoroute | dec | iso |
| C3f Tunnels et zones spécifiques | dec | 22, 23 |
| C3g Ville dense | dec | iso |
| C4a Préparer son trajet | seq | 10 |
| C4b Suivre un itinéraire | dec | 10, 18 |
| C4c Éco conduite | diag | 9, 8 |
| C4d Anticiper le danger | dec | iso |
| C4e Les usagers fragiles | dec | iso |
| C4f Aborder l'examen | dec | réutilise tout |
| C4g Jeune permis | dec | iso + ✅ panneaux |

**Bilan : 13 compétences se contentent du moteur ou du stock existant. 18
attendent une ou plusieurs des 31 photos.**

## 6. Ce qui reste à trancher

- **Volants, pas un deuxième XP.** Décidé par Rayan. Le moteur de Codex
  empile un `xp` local et un niveau à part, alors que le XP de l'app est un
  calcul (`compétences validées × 100`). À remplacer par un crédit de
  volants, plafonné, une seule fois par mission.
- **Où ça vit.** `mon-permis.js` porte une décision ferme de juillet : jeu et
  sérieux séparés, zéro XP ni monde dans cet écran. La route de jeu, avec les
  4 mondes et les 31 compétences, c'est `parcours.js`. C'est là que chaque
  nœud devient un jeu.
- **Phase 0.** Les missions préparent, elles ne certifient pas. Elles ne
  touchent ni `validations` ni `self_validations`. La Triple Validation reste
  intacte, le mot « prêt à pratiquer » de Codex est le bon.

## 7. Répartition proposée

| Qui | Quoi |
|---|---|
| **Rayan** | pilote la génération des 31 photos, suit la recette du §4 |
| **Claude** | palette de nuit du moteur iso (sans toucher la prod), étalonnage photo, intégration dans `parcours.js`, volants |
| **Codex** | les 12 icônes de voyants en SVG, l'extension du modèle de données aux 31 compétences, les missions qui n'ont besoin que du moteur (les 13 « iso ») |
