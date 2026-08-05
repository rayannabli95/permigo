# PermiGo Art Bible 2.0 — l'univers visuel des certifications

> Statut : v1, validée sur la direction générale le 05/08/2026 avec Rayan. Vit et bouge à chaque scène qu'on construit. Rien n'est gravé sauf ce qui est marqué ✅ VERROUILLÉ.
> Périmètre : les scènes de mise en situation et de certification (Mode Pilote, quiz Arène 3D). Pas les écrans d'interface (accueil, boutique, etc.) qui suivent déjà `docs/DESIGN_SYSTEM.md`.
> Le problème qu'on résout : les scènes actuelles fonctionnent mais elles se ressemblent à n'importe quel rendu IA générique. Zéro identité, zéro effet « je joue à un jeu vidéo ».

---

## 1. La direction en une phrase

**Un monde miniature en plastique brillant, la nuit, vu depuis le poste de conduite d'une vraie rue française.** Esprit Mario Kart posé sur des rues de France réelles. Chaque scène doit se reconnaître comme PermiGo en une seconde, même sans logo à l'écran.

### Pourquoi ce choix (comparé aux 3 autres pistes testées)

| Piste testée | Verdict |
|---|---|
| Cell-shaded façon Fortnite | Ambiance forte mais dérive cyberpunk glauque, à l'opposé du ton ludique voulu |
| Réaliste premium façon Forza | Ressemble à n'importe quel GTA nocturne générique. C'est le rendu par défaut de toute IA : zéro identité, et c'est exactement ce qui a fait griller la vidéo promo en juillet (reconnue comme IA) |
| Illustré peint façon Ori | Beau mais trop sombre et brouillé. Un élève doit lire un feu rouge en une seconde, pas déchiffrer une toile |
| **Glossy plastique façon Mario Kart** ✅ | Lisible instantanément, cohérent avec les boutons plastique 3D déjà utilisés dans l'Arène de quiz, aucune appli concurrente de code de la route ne fait ça |

Référence de calibrage retenue lors du test du 04/08 : [voir `4-mario-glossy-france.png`] carrefour de nuit avec immeuble haussmannien, feu tricolore français correct, tableau de bord violet plastique brillant.

---

## 2. Palette de couleurs ✅ VERROUILLÉ

On réutilise les tokens de marque existants (`src/styles/base.css`), on ne réinvente rien.

- **Violet accent** `--a` `#6c63ff` et `--a-lt` `#8e87ff` : dashboard, habitacle, néons, reflets glossy. C'est LA couleur signature de chaque scène.
- **Or/ambre** `--am` `#f59e0b` et `#fbbf24` : accents lumineux (fenêtres allumées, phares, feux orange, halos).
- **Nuit profonde** : bleu marine quasi noir en fond de ciel, jamais du noir pur (`#0b0d1a` type `--ink` en base, pas un vrai `#000`).
- **Rouge/vert des feux** : réservés strictement aux feux de circulation, jamais utilisés ailleurs dans le décor pour ne pas créer de fausse alerte visuelle.
- Interdiction : pas de rose, pas de couleurs criardes hors palette. (Piège identifié le 05/08 : la mascotte est ressortie rose sur un test, à corriger systématiquement, voir §5.)

---

## 3. Composition et caméra

- **Point de vue par défaut : siège conducteur**, à travers le pare-brise. C'est ce qui vend « je conduis », pas « je regarde une image ».
- Volant et haut du tableau de bord visibles en bas de cadre pour ancrer le point de vue, jamais plus d'1/4 de l'image.
- Plan large cinématique, horizon dégagé, jamais de gros plan flou façon photo bokeh (contraire à la lisibilité).
- Format 16:9 par défaut (large, façon jeu de course). Les scènes verticales (mobile plein écran) sont une déclinaison à cadrer, pas le point de départ.
- Nuit par défaut. Le jour est une variante possible pour certaines compétences (ex. stationnement de jour) mais l'identité de marque de la certification reste la nuit violette.

---

## 4. Matériaux et lumière

- **Tout ce qui est objet manufacturé** (voiture, feux, panneaux, mobilier urbain) : plastique/laqué brillant, reflets nets, arêtes arrondies façon jouet premium. C'est la signature « glossy toy ».
- **Tout ce qui est architecture** (immeubles, façades) : reste plus sobre et texturé, moins glossy que les objets. Le contraste objet-brillant / décor-mat évite la fatigue visuelle sur 400 scènes (point soulevé par Rayan le 05/08).
- Éclairage nocturne chaud dans les fenêtres (ambre) contre froid dans l'air ambiant (violet). Ce contraste chaud/froid est la carte de visite lumineuse de PermiGo.
- Reflets au sol sur chaussée mouillée autorisés avec modération : ça vend le premium sans virer photoréaliste.

---

## 5. Le kit France : la contrainte non négociable

**Constat du 05/08** : sans référence réelle, un modèle IA sort par défaut des feux américains, des panneaux japonais ou hébreux, des rues new-yorkaises. Sur un outil qui CERTIFIE la conduite en France, une erreur de pays n'est pas un détail esthétique, c'est une faute pédagogique.

**Règle de travail : toujours ancrer sur une vraie photo avant de générer.**

1. On constitue une bibliothèque de références réelles et vérifiées à l'œil (jamais se fier à la description automatique d'un outil de recherche, elle peut mentir, cf. l'incident du 05/08 où une image annoncée comme un feu français était en fait une cour d'immeuble en Afrique de l'Ouest).
2. Chaque référence est injectée comme image de départ ou de style au moment de la génération, pas juste décrite en texte.
3. Une fois qu'un élément est validé (feu, panneau, passage piéton), on le garde et on le réutilise partout, on ne le redemande pas à chaque scène en espérant que l'IA retombe pile dessus.

### Kit à constituer (statut : à faire, prochaine étape)

- [x] **Feu tricolore français** ✅ VERROUILLÉ (05/08) : boîtier noir/anthracite, ordre rouge/orange/vert, liseré violet subtil.
- [x] **Feu piéton français** ✅ VERROUILLÉ (05/08) : bonhomme rouge immobile / vert qui marche.
- [x] **Panneaux courants** ✅ VERROUILLÉ (05/08) : stop (octogone rouge, texte STOP), cédez le passage (triangle pointe en bas), sens interdit (cercle rouge barre blanche), stationnement interdit (cercle bleu barré rouge), priorité (losange jaune). Formes et couleurs réglementaires françaises correctes du premier coup, sans référence photo nécessaire (ce sont des pictogrammes trop standardisés pour que l'IA se trompe de pays, contrairement à une scène de rue complète).
- [ ] Passage piéton et marquage au sol (bandes blanches, largeur, disposition) — déjà correct dans les scènes de rue testées, pas encore isolé en fiche à part
- [ ] Façades types : haussmannien pour la ville, pavillon pour le péri-urbain, route de campagne (pour varier au-delà de Paris)
- [x] **La voiture PermiGo** ✅ VERROUILLÉ v4 DÉFINITIF (05/08) : silhouette longue et sportive inspirée très librement d'une Cupra (sans en être une copie), 5 portes, capot bas et long, ligne de caractère nette. Fini ultra glossy laqué, carrosserie anthracite uniforme, liseré violet fin qui court du capot jusqu'au badge, jantes violettes, becquet de toit. **Badge du capot : le vrai logo PermiGo (le « P » blanc sur badge violet), jamais une étoile.**
  - ⚠️ Piège identifié en cours de route : pousser vers « plus épuré » fait glisser le rendu vers « plus réaliste/mat » et lui fait perdre le côté jouet. Toujours insister explicitement sur glossy/jouet dans le prompt si on épure les détails.
  - ✅ **Blocage résolu (05/08) : repartir de la MASCOTTE comme seule référence a débloqué la longueur**, là où repartir de l'image courte comme référence gardait le modèle bloqué sur les mêmes proportions à chaque tentative (2 essais infructueux). Retenir la méthode : si une génération reste bloquée sur un défaut après une correction ratée, ne pas insister sur la même image de départ, repartir d'une référence neuve avec la contrainte dès le premier prompt. Habitacle ✅ VERROUILLÉ v5 DÉFINITIF (05/08, planche multi-vues) : tableau de bord anthracite avec filet lumineux violet fin en bordure, volant plat en bas façon sportive avec le vrai badge « P » (des micro-étoiles résiduelles trainent encore sur les branches malgré la consigne contraire, défaut mineur accepté), aiguilles dorées, grand écran tactile flottant moderne avec grille d'icônes propre. Référence produite en **une seule planche à 3 vues** (tableau de bord entier, gros plan badge, gros plan écran) plutôt qu'en générations séparées, ce qui garantit que les 3 vues sont VRAIMENT identiques entre elles.
⚠️ Le fond visible dans cette fiche est un décor neutre pour présenter l'objet, pas une scène à réutiliser : les vraies scènes s'appuient sur les décors français du kit (§5).

**📐 Méthode retenue pour toute future fiche de référence (objet ou personnage) :**
1. Ne jamais redécrire l'intégralité d'une image de référence dans le prompt suivant : dire ce qui CHANGE, pas ce qui existe déjà (le modèle dérive moins quand on ne le fait pas tout réinterpréter).
2. Pour un objet qui doit rester identique partout (habitacle, mascotte, voiture), générer une **planche à plusieurs vues en une seule fois** (façon fiche personnage / turnaround produit) plutôt que plusieurs images séparées : la cohérence entre vues est garantie par construction, alors qu'enchaîner des générations séparées fait dériver chaque détail (badge, couleur, forme) un peu plus à chaque fois.
3. Garder le prompt dense mais pas interminable : un prompt trop long et trop redondant fait dériver le rendu au lieu de le stabiliser.
  - ⚠️ Reste ouvert : la carrosserie extérieure a encore une portière ressortie violet plein au lieu d'anthracite avec liseré sur un tirage. Détail mineur, à refaire avec la même méthode (mascotte jointe en référence) avant de considérer la fiche extérieure 100 % définitive.
- [x] **La mascotte** ✅ VERROUILLÉ (05/08) : redessinée dans le style glossy à partir d'elle-même comme référence. Reste fidèle au design d'origine (corps volant bleu marine, spokes et bracelet violets, badge « P » blanc sur violet, baskets blanches), plus de dérive rose. Fiche de référence à joindre systématiquement à toute génération qui l'inclut, pour éviter que la couleur dérive à nouveau.

### Règle de cohérence logique (ajoutée suite à la remarque de Rayan du 05/08)

Avant de valider toute scène avec un feu piéton et un feu voiture visibles ensemble : **le piéton est vert seulement quand la voiture est rouge, jamais les deux au rouge en même temps sauf phase de transition explicitement voulue.** Check obligatoire avant validation, comme un test de non-régression visuel.

---

## 6. Animation et effets : la règle du coût

Deux niveaux, jamais improvisés au cas par cas :

- **Défaut : image fixe.** Coût quasi nul (~0,006 €/image), c'est ce qui habille 90 % des scènes.
- **Exception : boucle courte (2 à 4 s)** sur l'élément qui porte l'enjeu de la question (le feu qui pulse au moment où l'élève doit juger s'il peut passer, une essuie-glace, une enseigne qui clignote). Coût réel constaté le 05/08 : **environ 0,90 € les 4 secondes** avec Seedance 2.0. Sur 400 scènes, tout mettre en vidéo coûterait environ 360 €, contre quelques euros en image fixe. **Donc : la vidéo est un outil de mise en scène pour un moment précis, jamais un traitement systématique.**
- Dans une boucle, tout le reste du décor doit rester parfaitement immobile. Une seule chose bouge à la fois, sinon l'œil ne sait plus où regarder (contraire à la lisibilité pédagogique).

---

## 7. Workflow Higgsfield (mécanique de production)

1. **Choisir ou valider la photo de référence** (kit France, §5). Toujours l'ouvrir et la regarder avant de l'utiliser, jamais se fier à un résumé automatique.
2. **Importer la référence** (`media_import_url` pour une URL web, `media_upload` pour un fichier local).
3. **Générer avec un modèle qui accepte une image de référence** (`nano_banana_pro` a bien fonctionné le 05/08 pour respecter à la fois le style demandé et les éléments réels). Décrire dans le prompt : le sujet, le style glossy/Mario Kart, la palette exacte en hex, la contrainte France.
4. **Vérifier visuellement** : cohérence des feux (§5), absence d'éléments parasites copiés depuis la photo de référence (ex. l'autocollant lapin recopié bêtement le 05/08 — toujours inspecter les bords et détails de la référence avant de l'utiliser, ou cadrer plus serré dessus).
5. **Réutiliser, ne pas régénérer** : une fois qu'un élément (voiture, mascotte, feu) est bon, il devient une référence pour toutes les scènes suivantes plutôt qu'un nouveau tirage à chaque fois.
   - ⚠️ **Règle stricte apprise le 05/08 : le badge « P » du volant dérive en étoile générique dès que l'image de la mascotte n'est PAS explicitement jointe en référence.** Utiliser une autre scène déjà générée comme seule référence ne suffit pas à préserver ce détail. Systématiquement joindre le fichier mascotte (`mascot-hello.png` ou son équivalent glossy validé) en plus de la référence de style/décor, à chaque génération qui montre un volant ou un objet de marque.
6. Vidéo (boucle) seulement en dernière étape, sur une scène déjà validée en image fixe, jamais en premier jet.

---

## 7bis. État des lieux du Mode Pilote (audit du 05/08)

Avant de générer quoi que ce soit en prod, voilà où on en est réellement.

- **65 missions**, réparties sur **27 compétences REMC** (C1 à C4, C4 le moins couvert).
- Aujourd'hui, **aucune scène n'est générée par IA**. Le décor est soit une photo réelle (2 photos : pneu, capot), soit dessiné en pur CSS (`pilote.css`), soit une pièce en SVG interactive (compteurs, pédales, levier).
- Règle déjà posée par Rayan le 30/07/2026, à respecter dans ce chantier aussi : **« on DESSINE ce qui change d'état, on PHOTOGRAPHIE ce qu'on regarde. »** Le tableau de bord, les voyants, les pédales changent en continu donc restent en dessin/SVG piloté par variables. Un pneu, un moteur, une carrosserie ne changent pas d'état et rendus au trait ils « font cheap » (verbatim Rayan) : ils restent en photo ou passent en scène générée façon Art Bible, jamais en dessin au trait.
- **Bonne nouvelle pour le chantier** : les 65 missions ne pointent que vers **environ 22 décors distincts** (`intersection`, `roundabout`, `motorway`, `night`, `rain`, `parking`, `tunnel`, `cockpit`, `city-light`, `overtake-*`, etc.). On ne regénère pas 65 scènes, on construit ~22 décors une fois, réutilisés partout. C'est un chantier de taille raisonnable, pas une refonte totale.

### Proposition de méthode pour la suite

1. Finir le kit France (§5) sur les éléments qui reviennent dans presque tous les décors : feu, panneau, passage piéton, la voiture PermiGo, la mascotte.
2. Piloter sur **2 décors seulement** (ex. `intersection` et `night`, les plus fréquents) : les regénérer dans le nouveau style, les brancher dans `pilote-scenes.js`, les voir tourner en vrai dans l'app.
3. Si le rendu tient la route en conditions réelles (mobile, chargement, lisibilité en situation de quiz), on déroule sur les ~20 décors restants.
4. Les 2 photos (pneu, capot) et les pièces SVG interactives ne changent pas : elles suivent déjà la bonne règle.

---

## 7ter. Avancement des 22 décors (05/08)

Priorité fixée sur la fréquence réelle d'usage dans les 65 missions (comptée dans `missions-pilote.js`).

- [x] **`intersection`** (3 usages) ✅ carrefour au crépuscule. Généré une première fois dans la session initiale mais jamais branché ; **rebranché le 05/08 en fin de session** avec les zones tactiles de `c2f-indices` et `c3g-masque` (mode `spot`) inchangées, en composant le décor pour tomber dessus (voiture garée à gauche, ouverture entre les bâtiments à droite). Vérifié en jouant les deux missions en vrai.
- [x] **`night`** (2 usages) ✅ route de campagne étoilée, badge P correct.
- [x] **`city-light`** (8 usages, LE plus fréquent) ✅ VERROUILLÉ après correction : le premier essai montrait le feu rouge ET vert allumés en même temps (incohérence détectée et corrigée immédiatement, cf. règle §5).
- [x] **`cockpit`** (5 usages, décor par défaut) ✅ **résolu autrement, le 05/08 en fin de session.** Le problème n'était pas de rendre la rue en jouet, c'était de la montrer du tout : recadré en gros plan sur l'habitacle (volant, deux commodos, compteurs), sans aucune fenêtre sur l'extérieur, donc plus aucune dérive photoréaliste possible. Branché avec les zones tactiles de `c1a-commodos` (mode `spot`) inchangées. Un premier essai a doublé le volant en fantôme et recopié par erreur le fond du giratoire de référence ; corrigé en insistant sur « UN SEUL volant » et « pas de vue extérieure ».
- [x] **`rain`** (5 usages) ✅ pluie battante, essuie-glaces en mouvement, ville mouillée.
- [x] **`tunnel`** (2 usages) ✅ aucune voiture dans le champ, aucun risque.
- [x] **`parking`** (3 usages) ✅ VERROUILLÉ après correction : le premier essai montrait une Ferrari 458 rouge ET une berline façon Audi jaune garées, deux vraies voitures de marque reconnaissables. Corrigé en imposant des voitures génériques ternes (gris, bleu marine) sans silhouette de marque.
- [x] **`roundabout`** (2 usages) ✅ VERROUILLÉ après la même correction (une voiture façon coupé sport de marque sur le premier essai). Panneau « Cédez le passage » bien écrit cette fois.
- [x] **`bend`** (2 usages, mode « tracer ») ✅ vue avancée sur une chicane, bords de voie lisibles pour superposer un tracé.
- [x] **`emergency`** (2 usages, mode « ordonner » le freinage) ✅ piéton qui surgit près du capot, flou de mouvement pour l'urgence.
- [x] **`gps`** (2 usages, mode « diagnostiquer » une sortie ratée) ✅ VERROUILLÉ après correction : **le premier essai montrait l'inverse de la situation** (le panneau de sortie et la bretelle encore devant, à venir, alors que la mission dit que la sortie vient d'être ratée). Corrigé : sortie et panneau visibles UNIQUEMENT dans le rétroviseur en train de s'éloigner, route qui continue tout droit devant, téléphone GPS affichant « MANQUÉ » et « RECALCUL ».
- [x] **`exterior`** (2 usages, mode « trouver » un défaut) ✅ VERROUILLÉ après correction : **le premier essai n'avait aucun défaut visible**, les 4 pneus étaient ronds et normaux alors que la mission demande de repérer un pneu affaissé. Corrigé avec un pneu avant clairement dégonflé et visible.
- [x] **Les 10 décors à 1 usage** (`overtake-empty`, `overtake-oncoming`, `overtake-top`, `overtake-top-libre`, `motorway`, `motorway-shoulder`, `mirror`, `insertion`, `brouillard-file`, `voie-garee`) ✅ TOUS FAITS (05/08). 6 bons du premier coup, 4 corrigés après une passe de vérification.

**Les 22 décors du Mode Pilote sont maintenant tous produits.** Détail des corrections de cette dernière vague :

- **`overtake-oncoming`** : 🔴🔴 incident le plus grave de la session, voir plus haut (logo Nintendo Mario apparu à cause du mot « Mario Kart » dans le prompt). Corrigé, plus aucune marque, sens de circulation français respecté (cycliste à droite, véhicule en face à gauche).
- **`overtake-top` / `insertion`** : texte apparu en ANGLAIS (« 1 METER SAFETY GAP », « EXIT ») alors que l'app est en français. Corrigé en imposant explicitement le texte français dans le prompt.
- **`overtake-top-libre`** : la voiture et le cycliste se touchaient, aucun espace visible alors que l'exercice demande de choisir un espace. Corrigé.
- **`motorway-shoulder`** : cumulait texte anglais ET dérive photoréaliste ET voitures de fond suspectes. Corrigé sur les trois points.
- **`insertion`** : en plus du texte anglais, la première version ne montrait pas clairement des espaces de tailles différentes entre les voitures (élément clé de l'exercice « choisir un espace atteignable »). Corrigé.

**🔴🔴 Règle la plus importante retenue de cette session : tout le texte visible dans une scène doit être explicitement demandé en FRANÇAIS dans le prompt.** Sans cette précision, le modèle bascule spontanément en anglais. À vérifier systématiquement, comme la cohérence des feux.

**🔴 Règle ajoutée (05/08) : toujours vérifier que la scène montre CE QUE LA MISSION DEMANDE DE VOIR, pas juste une ambiance plausible.** Deux ratés coup sur coup : un GPS qui montrait la sortie à venir au lieu de déjà ratée, un contrôle extérieur sans le défaut à trouver. Avant de valider une scène, relire le `prompt` et la mécanique (`mode`) de la mission dans `missions-pilote.js` et vérifier que l'élément clé attendu est bien visible et sans ambiguïté.

**🔴🔴 Incident grave (05/08) : le mot-clé « Mario Kart » a fait apparaître le VRAI logo Nintendo Mario peint sur une voiture dans une scène.** Ce n'était plus une simple ressemblance de silhouette (Ferrari, Audi) mais une reproduction de marque déposée. Cause probable : j'utilisais « Mario Kart » comme raccourci de style dans presque tous les prompts de cette session. **Décision : ce mot est banni de tous les prompts à partir de maintenant.** Le remplacer par une description neutre du style : « rendu 3D stylisé brillant façon jouet premium, jeu mobile haut de gamme » sans jamais nommer un jeu ou une franchise existante. Revérifier toutes les scènes déjà générées qui contiennent d'autres véhicules pour s'assurer qu'aucune autre n'a le même problème avant mise en prod.

**🔴 Règle ajoutée (05/08) : jamais de voiture tierce à silhouette reconnaissable dans le décor.** Deux essais sur deux ont fait apparaître spontanément une vraie marque (Ferrari 458, un coupé sport, une berline type Audi) dès qu'une scène demandait « une autre voiture » sans préciser son style. **Toujours préciser explicitement** : voiture générique, ton terne (gris/bleu marine), proportions rondes façon jouet, jamais une silhouette de marque précise. Vérifier ce point sur CHAQUE scène qui inclut un véhicule tiers.

### `seat-profile` : le 11e décor débloqué (05/08, en fin de session)

Ce décor faisait partie des 11 mis de côté avec la mission `placement` (le siège qu'on fait glisser vers la bonne distance des pédales) : recalibrer ses zones tactiles semblait risqué. Idée de Rayan pour le débloquer sans y toucher à l'aveugle : **séparer le décor (fixe, généré une fois) de la pièce qu'on déplace (elle aussi une image, générée à part, fond retiré).** Comme le décor ne porte alors AUCUNE zone dessinée dessus (juste un habitacle vide avec un rail), on peut redéfinir les coordonnées des 3 zones et du départ en même temps que le décor, sans essayer de faire correspondre une nouvelle image à d'anciennes coordonnées CSS.

Concrètement : un décor `seat-profile-2026-08-05.webp` (habitacle en coupe, vide, rail au sol, tableau de bord et pédales à droite) + une pièce `siege-conducteur-2026-08-05.webp` (siège avec conducteur, vu de profil, fond retiré via `remove_background`) qui glisse dessus. Les 3 zones (`trop-loin`, `juste`, `trop-pres`) et le point de départ ont été repositionnés à la main pour coller au nouveau rail, vérifiés par une capture d'écran hors-app (le login du serveur de preview local échouait, contournement : une page HTML statique qui rejoue exactement le balisage de la scène). Résultat correct aux deux extrêmes testées (position de départ et position centrale).

**Cette méthode (décor vide + pièce détourée) est probablement transposable aux 10 autres décors `placement`/`spot`/`trajectory` encore en CSS**, à condition que la zone à toucher ne soit pas un détail fixe DANS le décor (un panneau précis, un angle mort précis) mais un espace continu où la position compte plus que le contenu exact dessous.

### 🔴🔴 Le décor était bon, c'est le cadre qui le mangeait (05/08, après test sur téléphone)

Première partie de missions jouée en vrai sur un téléphone (390 × 844, compte élève, missions enchaînées comme un élève la veille de sa leçon). Trois décors sur quatre m'ont paru « trop photoréalistes, pas assez jouet », et j'allais en relancer quatre en génération. **C'était faux, et ça aurait coûté quatre images pour rien.**

Le vrai coupable : la scène a une hauteur figée en pixels (270 px), héritée des décors DESSINÉS calés au pixel, et deux modes la raccourcissent encore (184 px pour « Décider », 145 px pour « Ordonner »). Une image y était donc rognée en hauteur : **mesuré 24 % de perte en mode « Décider » et 40 % en mode « Ordonner »**. Sur le parking, la scène montrait deux voitures jouet, des places marquées, des arbres, un levier de vitesse : on n'en voyait qu'un bandeau, le reste étant du tableau de bord. Le décor n'avait jamais été photoréaliste, il était **décapité**.

**Règle : avant de juger une image, la regarder dans le CADRE où elle vivra, pas dans l'outil qui l'a produite.** Une image jugée bonne à la génération peut être mauvaise à l'écran, et l'inverse est vrai aussi. La bonne façon de juger un décor est une capture de l'écran réel sur un vrai gabarit de téléphone, pas la vignette du générateur.

Corrigé côté code : une image reprend sa hauteur naturelle et va de bord à bord de la colonne, donc plus aucun rognage, et la scène gagne entre 43 % et 82 % de surface. Le seul décor qui restait vraiment trop photo après correction était **`rain`** (rue grise photographique derrière un tableau de bord jouet), avec `emergency` et `tunnel` à revoir de près.

Autre mesure du même test : il restait **158 à 380 px de noir vide** sous la dernière réponse, jusqu'à 45 % de l'écran sur la mission du siège. La page avait l'air coupée. Corrigé aussi (colonne en flex, la place va aux cartes de réponse qui deviennent plus faciles à viser au pouce).

⚠️ **Reste ouvert** : les missions sans liste de réponses (« Placer », « Trouver ») gardent du vide, parce que l'image est panoramique et l'écran est haut. Pour celles-là il faudra un décor **cadré plus haut** (4/3 plutôt que 3/2), pas une correction de code.

### `rain`, `emergency`, `tunnel` refaits entièrement stylisés (05/08, suite du test)

Les trois décors repérés ci-dessus ont été régénérés en repartant du **giratoire** (`roundabout`) comme référence de style plutôt que du kit France photo : « rendu 3D stylisé jouet, glossy, PAS photoréaliste » explicitement répété dans chaque prompt, plus la mascotte pour le badge du volant. Résultat propre du premier coup pour `rain` et `tunnel`.

**`emergency` a eu besoin d'un second passage** : le piéton toy avait une tête bien ronde mais **totalement vide, sans le moindre trait de visage**, un rendu plus dérangeant que la version photo qu'il remplaçait. Corrigé en imposant explicitement « deux points pour les yeux et un sourire, comme la mascotte, PAS une tête sans visage ».

⚠️ **Ces trois fichiers étaient déjà en prod sous ce nom exact** (mergés dans #708 le jour même). Écraser le même nom aurait laissé l'ancienne version à vie chez qui avait déjà installé l'app (piège du cache déjà documenté, cf. la règle sur les noms de fichiers datés). Renommés en `-2026-08-05b` et le code de `pilote-scenes.js` a été adapté pour lire un nom de fichier différent du nom du décor quand `src` est précisé dans `DECORS`.

### Les 12 décors qui restaient en CSS : aucun n'est un remplacement simple (05/08, fin de session)

Rayan a demandé de continuer sur les décors encore dessinés en CSS (`cockpit`, `intersection`, `bend`, `night`, `mirror`, `exterior`, `insertion`, `brouillard-file`, `voie-garee`, `overtake-empty`, `overtake-top`, `overtake-top-libre`). Vérification faite mission par mission dans `missions-pilote.js` : **contrairement aux 10 décors à 1 usage faits plus tôt dans la journée, ces 12-là portent TOUS au moins une mission `spot`, `trajectory` ou `placement`** posant des coordonnées précises dessus. Aucun n'est donc un simple remplacement d'image : chacun demande soit de recaler les coordonnées de la mission sur le nouveau décor (méthode du siège, §7ter), soit de composer le nouveau décor pour qu'il tombe sur des coordonnées existantes (méthode utilisée ici pour `cockpit` et `intersection`, plus bas).

**Deux traités ce soir en pilote : `cockpit` (5 usages, le plus fréquent) et `intersection` (3 usages).** Les deux étaient déjà générés depuis la session initiale mais jamais branchés dans `DECORS` : `cockpit` avait la même dérive photoréaliste que les autres ce jour-là (une rue de lotissement détaillée derrière l'habitacle), `intersection` était correct mais restait un fichier mort sur le disque, jamais chargé par aucun client (donc sans risque de cache à écraser).

**Le vrai déblocage sur `cockpit` : ne pas essayer de rendre la rue en jouet, l'enlever du cadre.** Un simple recadrage en gros plan sur l'habitacle (volant + deux commodos + compteurs, aucune fenêtre visible) supprime le problème à la racine : sans rue à dessiner, plus de dérive possible vers le photoréalisme. Les zones tactiles de `c1a-commodos` n'ont pas bougé, le nouveau décor a été composé pour tomber dessus.

**`intersection` sert DEUX missions avec des zones différentes** (`c2f-indices` : voiture garée à gauche + ouverture à droite ; `c3g-masque` : devant du véhicule + toit de bâtiment). Une image ne peut pas bouger sans casser l'une des deux : le nouveau décor a donc été composé pour satisfaire les deux jeux de coordonnées à la fois (voiture à gauche, ouverture à droite, ciel en haut, toit visible en haut à droite), sans toucher `missions-pilote.js`.

⚠️ Repéré au passage sans le corriger (hors sujet du jour) : le texte de `c3g-masque` dit « un véhicule est arrêté à droite » mais sa zone `front` est positionnée à GAUCHE (x=6). Le déplacer casserait `c2f-indices`, qui a besoin de sa voiture garée exactement là. À trancher séparément : soit le texte se trompe de côté, soit il faudrait deux décors distincts au lieu d'un partagé.

**Les 10 restants faits dans la foulée (même soir, 05/08).** Bonne surprise : les 10 étaient déjà générés depuis la session initiale, jamais branchés. Trois étaient bons tels quels après vérification (`night`, `brouillard-file`, `exterior` avaient déjà eu leur passe de correction dans la session initiale, cf. §7ter), quatre de plus se sont révélés corrects à l'inspection (`bend`, `overtake-empty`, `voie-garee`, `overtake-top-libre`). Trois ont eu besoin d'une deuxième génération :

- **`mirror`** montrait l'EXTÉRIEUR de la voiture (une vue 3/4 avec un cercle zoomé sur le rétroviseur) alors que la mission demande de regarder depuis l'intérieur (rétroviseur, lunette arrière, angle mort par la vitre, tableau de bord). Refait en vue conducteur, avec un motard visible dans la vitre latérale gauche, là où tombe la zone « angle mort » (la seule bonne réponse).
- **`insertion`** portait un panneau « SORTIE » sur une mission où l'élève ENTRE sur l'autoroute par la bretelle. Un panneau qui contredit le sens de la manœuvre. Corrigé en « ENTREE ».
- **`overtake-top`** avait un texte « 1 MÈTRE D'ÉCART » et une flèche incrustés dans l'image, qui DONNAIENT LA RÉPONSE à une mission de tracé où l'élève doit justement choisir l'écart. Refait en vue de dessus pure, sans aucun texte, sans aucune mesure : juste la route, la voiture et le cycliste.

⚠️ **Piège de spécificité CSS découvert au passage** : `.mp-trajectory-interaction .mp-scene { height: 275px }` (deux classes) l'emportait sur la règle générale qui redonne sa hauteur naturelle à un décor image (une classe + un `:has`, même poids), simplement parce qu'elle vient plus tard dans le fichier. Sans le correctif, `bend` et `overtake-top` (les deux seuls décors image en mode « tracer ») auraient été rognés dans une boîte à 275 px comme avant la correction du 05/08 après-midi. Repéré avant la mise en prod, pas en audit après coup.

**Les 22 décors du Mode Pilote sont maintenant tous en Art Bible 2.0, tous branchés.** Reste ouvert (hors sujet du jour, cf. plus haut) : la contradiction de côté sur `c3g-masque` (texte « à droite », zone à gauche), et l'absence de coordonnées vérifiées en conditions réelles pour les 4 décors `placement` de cette vague (`brouillard-file`, `insertion`, `voie-garee`, `overtake-top-libre`) : vérifiés sur une page statique hors-app plutôt qu'en jouant la vraie mission, faute de connaître la bonne réponse des missions précédentes pour y arriver en cliquant.

## 8. Ce qui reste ouvert (prochaine session)

- [ ] Construire le kit France (§5) élément par élément, avec validation visuelle de chaque pièce
- [ ] Fixer une fiche unique « voiture PermiGo » (extérieur + habitacle) et une fiche couleur stricte pour la mascotte dans ce style
- [ ] Trancher : violet brillant partout vs violet réservé aux objets clés + décor plus varié autour (question posée à Rayan, réponse en attente)
- [ ] Regarder l'état du dossier pilote certif existant pour voir ce qui doit être repris avec cette nouvelle direction
- [ ] Une fois le kit validé, produire un premier lot de scènes réelles de certification (pas des mood-boards) pour test grandeur nature

---

## Historique des décisions

- **05/08/2026** : direction glossy plastique façon Mario Kart choisie après comparaison de 4 pistes. Palette violet/or de la marque conservée. Test réussi avec vraies photos françaises en référence (immeuble haussmannien, feu et passage piéton corrects). Boucle vidéo testée et validée comme outil ponctuel, pas systématique (coût x150 vs image fixe). Anomalies notées à corriger : mascotte rose au lieu de violette, habitacle de la voiture pas encore stabilisé, feu piéton/voiture pas toujours logiquement cohérents entre eux.
