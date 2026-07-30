# Bibliothèque graphique Mode Pilote — lot 3

Le lot 3 ajoute les vues extérieures du véhicule et les contrôles visuels
réalisés avant de prendre la route. Les sept éléments sont dessinés en SVG,
sans fichier image et sans texte inclus dans le dessin.

## Prévisualiser

Depuis `permigo-game/` :

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Puis ouvrir :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/art-library/lot3.html
```

## Valider

Avec le serveur local actif :

```bash
PILOTE_ART_CAPTURE=/tmp/mode-pilote-lot3.png \
  node mockups/moteur-pilote/art-library/validate-lot3.mjs
```

Le contrôle vérifie les largeurs 320, 390 et 520, les quatre états, les feux
éteints/allumés, l’usure, les quatre fluides, le niveau, les zones tactiles,
le mouvement réduit, les silhouettes à 40, la console et l’accessibilité.

## API

```js
import {
  LOT_THREE_ELEMENTS,
  VEHICLE_FLUIDS,
  renderVehicleElement,
  mountVehicleElement,
} from "./art-library/vehicle-elements.js";
```

Exemples :

```js
renderVehicleElement("car-front-three-quarter", {
  state: "active",
  lit: true,
});

renderVehicleElement("tyre-wear", {
  state: "found",
  wear: 80,
});

renderVehicleElement("hood-levels", {
  fluid: "coolant",
  level: 20,
  labels: { coolant: "Refroidissement" },
});
```

## Types

| Type | Élément | Options particulières |
|---|---|---|
| `car-front-three-quarter` | voiture trois-quarts avant | `lit` |
| `car-rear-three-quarter` | voiture trois-quarts arrière | `lit` |
| `car-profile` | voiture de profil | `lit` |
| `tyre-wear` | pneu et témoin d’usure | `wear` de 0 à 100 |
| `headlight-front` | bloc optique avant | `lit` |
| `taillight-rear` | bloc optique arrière | `lit` |
| `hood-levels` | capot ouvert et quatre fluides | `fluid`, `level`, `labels` |

Tous acceptent `state` (`idle`, `active`, `found`, `error`) et `silhouette`.
Les trois vues de voiture sont indépendantes de la transmission : elles
s’intègrent donc sans variante forcée dans une mission manuelle ou automatique.
L’option `lit`, indépendante de l’état, permet aussi de les composer dans une
scène de jour ou de nuit.

## Contrat graphique

Le lot réutilise exclusivement `art-core.js` pour la palette, les quatre
matières, l’éclairage, les états et l’étalon de taille. Les positions internes
sont proportionnelles au `viewBox`. Les noms de fluides et les valeurs sont des
surcouches HTML traduisibles ; aucun `<text>` n’est généré dans un SVG.
