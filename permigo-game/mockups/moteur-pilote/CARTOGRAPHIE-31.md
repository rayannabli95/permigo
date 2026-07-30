# Mode Pilote — cartographie des 31 missions

## Décision de référence

Cette cartographie suit les **31 identifiants réellement utilisés par PermiGo**
dans `src/data/remc.js` : C1a à C1i, C2a à C2h, C3a à C3g et C4a à C4g.
Elle ne remplace pas le référentiel réglementaire. Elle traduit le découpage
produit actuel en entraînements de préparation à la conduite.

Une mission Mode Pilote :

- prépare un geste, une observation ou une décision avant la vraie leçon ;
- ne certifie jamais une compétence ;
- se termine par une explication et un transfert à réaliser dans la voiture ;
- ne récompense ni la vitesse ni le nombre réduit d’essais ;
- reste jouable en boîte manuelle ou automatique quand le geste le permet.

Le pilote complet à confier à Claude est décrit dans
`MISSION-CLAUDE-C1A.md`.

## Grammaire d’assemblage

Une mission n’est pas une page dessinée sur mesure. C’est une donnée qui
assemble cinq couches dans cet ordre :

1. **Atmosphère** — jour, nuit, pluie, brouillard ou tunnel.
2. **Route** — voie, virage, intersection, giratoire, parking ou autoroute.
3. **Contexte** — bâtiments, panneaux, autres véhicules et usagers.
4. **Objet pédagogique** — élément de la bibliothèque dans son état piloté.
5. **Interaction** — choix ou repères HTML placés au bord du cadre, puis retour
   `found` ou `error`. La cible ne recouvre jamais l’objet.

Le moteur possède déjà cinq verbes réutilisables :

| Verbe | Action de l’élève | Conséquence pédagogique |
|---|---|---|
| `spot` | repérer un indice ou un organe | entraîne le balayage et le rappel spatial |
| `decision` | choisir le prochain geste | entraîne l’anticipation et l’arbitrage |
| `sequence` | reconstruire un ordre | fixe une procédure avant de la pratiquer |
| `trajectory` | choisir une ligne sûre | entraîne placement et regard |
| `diagnostic` | relier symptôme, risque et action | apprend à ne pas agir à l’aveugle |

Une seule extension est nécessaire pour ne pas transformer le maniement en
QCM : `dosage`. Elle pilote une pédale, une aiguille ou un volant sur une plage
continue et mesure la stabilité, **sans chronomètre** et sans bonus de vitesse.

### Cycle d’un temps de jeu

```text
brief court
  → scène au repos
  → objet actif
  → réponse
      → juste : objet trouvé + pourquoi
      → à consolider : objet en erreur + nouvel essai
  → transfert concret pour la prochaine leçon
  → « prêt·e à pratiquer », jamais « compétence validée »
```

Après deux réponses à consolider, un indice peut apparaître. Il ne donne pas la
solution ; il recentre l’attention sur le bon indice. La mission peut être
rejouée sans perte.

## Contrat boîte manuelle / automatique

Le choix de boîte est enregistré à l’inscription ou dans l’onboarding. Il filtre
les missions avant leur affichage.

- **Mission identique** : `transmissions: ["manual", "automatic"]`.
- **Même objectif, gestes différents** : une définition commune et deux
  surcharges `variants.manual` / `variants.automatic`.
- **Interdit** : dupliquer toute la mission uniquement pour changer un pédalier,
  un sélecteur, une étape ou une phrase.
- Une surcharge peut remplacer les objets, la séquence, l’explication et le
  transfert. Le titre, la compétence et le résultat pédagogique restent communs.

Exemple de résolution attendu :

```js
{
  id: "c1d-depart",
  competence: "C1d",
  transmissions: ["manual", "automatic"],
  variants: {
    manual: {
      assets: ["clutch-foot", "manual-shifter"],
      sequence: ["clutch", "gear-1", "bite", "gas"],
    },
    automatic: {
      assets: ["brake-foot", "automatic-selector"],
      sequence: ["brake", "drive", "observe", "release"],
    },
  },
}
```

## Inventaire réellement disponible

### Bibliothèque validée

- **Lot 1** : `manual-pedals`, `clutch-foot`, `automatic-pedals`,
  `brake-foot`, `automatic-selector`, `manual-shifter`.
- **Lot 2** : `instrument-cluster`, les douze voyants, `tachometer`.
- **Lot 3** : `car-front`, `car-rear`, `car-profile`, `tyre-wear`,
  `headlight-front`, `taillight-rear`, `hood-levels`.

### Bibliothèque encore attendue

- **Lot 4** : siège et commande, rétroviseur intérieur, appuie-tête,
  mains à 9 h 15.
- **Lot 5** : créneau, épi, bataille, demi-tour en trois temps.

### Primitives de scène à prévoir après les lots

Les 24 éléments de la commande couvrent le véhicule, pas toute la route. Pour
C2 à C4, il faudra une petite bibliothèque séparée et réutilisable :

- route droite, virage, intersection, giratoire, autoroute et tunnel ;
- lignes, passages piétons, feux et panneaux courants ;
- véhicule tiers, vélo, trottinette, piéton et bus ;
- pluie, brouillard, nuit, vent latéral et faible adhérence ;
- rétroviseurs/angles morts en surcouche ;
- guidage GPS et panneaux de direction.

Ces primitives doivent suivre la même palette, les mêmes matières, les mêmes
états et le même test de silhouette que les lots véhicule.

## Cartographie C1 — Maîtrise du véhicule

| ID | Mission proposée | Apprentissage actif | Mécanique | Assemblage principal | Boîte | Dépendance |
|---|---|---|---|---|---|---|
| C1a | **Inspection 360** | repérer une alerte, un feu défaillant, un pneu usé et un niveau bas | `diagnostic` + `spot` | compteurs, voyants, feux, pneu, capot | identique | prêt, lots 2–3 |
| C1b | **Cockpit sur mesure** | reconstruire l’ordre siège → dossier → appuie-tête → volant → rétros → ceinture | `sequence` | siège, appuie-tête, rétro, mains, pédalier | variante de portée des pédales | lot 4 |
| C1c | **Le regard guide** | garder les mains à 9 h 15 et choisir une trajectoire stable | `trajectory` | mains, volant, route en courbe | identique | lot 4 + route |
| C1d | **Départ sans à-coup** | reconstruire le départ puis l’arrêt sécurisé | `sequence` | embrayage + levier, ou frein + sélecteur | variante forte | prêt, lot 1 |
| C1e | **La jauge de douceur** | doser accélération puis freinage sans rupture | `dosage` | pédalier, vitesse, compte-tours, route | variante légère | nouveau verbe `dosage` |
| C1f | **Écoute le moteur** | relier son/régime au bon geste de transmission | `diagnostic` + `sequence` | compte-tours, levier ou sélecteur, pédales | variante forte | prêt, lots 1–2 |
| C1g | **Le tour sans oubli** | effectuer un balayage extérieur méthodique | `spot` + `sequence` | trois vues voiture, pneu, feux, capot | identique | prêt, lot 3 |
| C1h | **La place impossible** | choisir et reconstruire une manœuvre lente | `trajectory` + `sequence` | créneau, épi, bataille, demi-tour | variante de commandes | lot 5 + lot 1 |
| C1i | **Sans la voix du coach** | choisir la manœuvre, la corriger et la terminer avec aide à la demande | multi-temps | vues du dessus + contrôles | variante de commandes | lot 5 |

## Cartographie C2 — Circulation normale

| ID | Mission proposée | Apprentissage actif | Mécanique | Assemblage principal | Boîte | Dépendance |
|---|---|---|---|---|---|---|
| C2a | **Radar de regard** | repérer à temps panneaux, marquages et usagers | `spot` | route urbaine, panneaux, rétros, usagers | identique | primitives route/usagers |
| C2b | **La marge invisible** | adapter allure et distance avant que la situation se ferme | `decision` + `dosage` | trafic, météo, compteur, pédales | variante légère | primitives + `dosage` |
| C2c | **Garde ta voie** | choisir le bon placement et l’écart latéral | `trajectory` | route vue de dessus, voiture, véhicule garé | identique | primitive route |
| C2d | **Le virage propre** | ralentir avant et rester dans sa voie | `trajectory` | décor `bend`, voiture, compteur | identique | prêt |
| C2e | **La fenêtre de dépassement** | contrôler, signaler puis décider si le dépassement reste possible | `sequence` + `decision` | route, rétros, clignotant, véhicules | identique | primitives route/véhicules |
| C2f | **La rue cachée** | détecter une intersection puis appliquer la priorité | `spot` + `decision` | décors `intersection` et `roundabout` | identique | prêt |
| C2g | **Rends-toi lisible** | choisir le bon signal avant de modifier sa trajectoire | `sequence` + `decision` | clignotants, feux, regards des usagers | identique | primitives usagers |
| C2h | **Trois rues sans filet** | enchaîner observation, placement et décision avec aide à la demande | multi-temps | scènes urbaines assemblées | identique | primitives route/usagers |

## Cartographie C3 — Conditions difficiles

| ID | Mission proposée | Apprentissage actif | Mécanique | Assemblage principal | Boîte | Dépendance |
|---|---|---|---|---|---|---|
| C3a | **L’éblouissement** | déplacer son regard vers un repère droit stable et adapter les feux | `spot` + `decision` | décor `night`, feux avant/arrière | identique | prêt |
| C3b | **Voir moins, prévoir plus** | choisir distances, douceur et feux adaptés à la visibilité | `decision` + `diagnostic` | décor `rain`, feux, compteur | identique | prêt |
| C3c | **Zéro geste brusque** | conserver l’adhérence avec des commandes progressives | `dosage` + `trajectory` | chaussée glissante, pédales, volant | variante légère | primitive adhérence + `dosage` |
| C3d | **Frein d’urgence** | freiner d’abord, garder l’appui et regarder l’échappatoire | `sequence` + `dosage` | décor `emergency`, frein, compteurs | variante forte pour l’embrayage | prêt pour la séquence |
| C3e | **Le trou dans le flux** | accélérer sur la voie d’insertion et choisir un espace libre | `trajectory` + `decision` | autoroute, véhicules, compteur, rétros | identique | primitive autoroute |
| C3f | **Zone spéciale** | adapter feux, distance et placement en tunnel, sur pont ou par vent | `diagnostic` + `decision` | tunnel, vent, feux, voiture profil | identique | primitives tunnel/vent |
| C3g | **Tout peut surgir** | repérer piéton, vélo, trottinette et bus avant leur conflit | `spot` | ville dense, rétros, usagers vulnérables | identique | primitives usagers |

## Cartographie C4 — Conduite autonome

| ID | Mission proposée | Apprentissage actif | Mécanique | Assemblage principal | Boîte | Dépendance |
|---|---|---|---|---|---|---|
| C4a | **Le plan B** | préparer trajet, variante et pauses avant de démarrer | `sequence` + `decision` | carte, météo, trafic, étapes | identique | primitive itinéraire |
| C4b | **La sortie ratée** | continuer en sécurité et laisser l’itinéraire se recalculer | `diagnostic` | décor `gps`, route, signalisation | identique | prêt |
| C4c | **Le feu rouge loin** | lever le pied tôt et garder une conduite souple | `decision` + `dosage` | décor `city-light`, compteur, pédales | variante de rapport | prêt pour la décision |
| C4d | **Garde ta marge** | repérer tôt un risque et choisir une réponse calme | `spot` + `decision` | route, dangers progressifs, distances | identique | primitives route/usagers |
| C4e | **Un mètre de vie** | choisir écart, allure et moment de dépassement d’un usager vulnérable | `trajectory` + `decision` | vélo, piéton, trottinette, voiture | identique | primitives usagers |
| C4f | **Départ inspecteur** | enchaîner installation, vérification et première consigne sans se précipiter | `sequence` + `spot` | lots 2–4, extérieur, cockpit | variante de commandes | prêt partiellement, lot 4 |
| C4g | **Premier trajet solo** | décider face aux situations typiques du jeune conducteur | multi-temps | route, météo, passagers, signalisation | identique | primitives route |

## Ordre de production recommandé

### Vague A — assemblage immédiat

Assembler d’abord les 12 compétences déjà soutenues par les lots 1–3 et les
décors existants :

```text
C1a · C1d · C1f · C1g
C2d · C2f
C3a · C3b · C3d
C4b · C4c · C4f (partie vérifications)
```

La mission C1a sert de preuve du système. Elle doit être auditée avant d’en
dupliquer la grammaire.

### Vague B — après validation du lot 4

```text
C1b · C1c · C4f complet
```

### Vague C — après validation du lot 5

```text
C1h · C1i
```

### Vague D — bibliothèque de route

Créer les primitives manquantes, puis assembler les 15 missions restantes.
Ne pas fabriquer ces primitives au milieu de chaque mission : une primitive
validée doit servir au moins deux fois.

## Règles de contenu pour les 31 missions

Chaque définition contient obligatoirement :

```text
id · competence · transmissions · phase
objectif observable · mécanique · décor · objets · états
consigne · réponses possibles · solution
indice · retour à consolider · réussite · pourquoi · transfert en voiture
```

Chaque mission respecte aussi ces invariants :

- deux à quatre temps de jeu, une seule notion par temps ;
- le mauvais choix correspond à une erreur réelle documentée, pas à une blague ;
- une réponse à consolider explique où regarder, jamais « faux » tout seul ;
- la réussite donne le pourquoi avant les points ;
- l’aide est demandable et apparaît aussi après deux hésitations ;
- les libellés restent en HTML traduisible ;
- une scène n’a jamais plus de trois animations lentes ;
- les états et variantes passent uniquement par les options des composants ;
- fin : « Tu es prêt·e à le pratiquer en leçon » ;
- la Triple Validation reste dans le produit, en dehors de Mode Pilote.

## Définition de fini d’une mission assemblée

- La mission se charge depuis une donnée, sans branche dédiée dans le rendu.
- Les deux boîtes se résolvent sans contenu incohérent ni mission dupliquée.
- Chaque objet vient de la bibliothèque ou d’une primitive déclarée.
- Les réponses, solutions et identifiants d’objets sont vérifiés automatiquement.
- Les interactions clavier et tactiles font au moins 44 px.
- Le rendu tient à 320, 390 et 520 px, sans débordement.
- `prefers-reduced-motion` supprime les animations non essentielles.
- Zéro erreur console et aucune erreur d’accessibilité sérieuse.
- Une capture à 390 px montre tous les temps de jeu.
- Le texte ne promet ni maîtrise ni certification.
- `npm run build` reste vert.
