# Bibliothèque graphique Mode Pilote — lot 2

Le lot 2 étend le noyau graphique du lot 1 sans dupliquer la palette, les
matières, les états ou l’échelle. Il couvre uniquement le tableau de bord.

## Prévisualiser

Depuis `permigo-game/` :

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Puis ouvrir :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/art-library/lot2.html
```

## API

```js
import {
  DASHBOARD_WARNINGS,
  renderDashboardElement,
  renderWarningIcon,
} from "./art-library/dashboard-elements.js";
```

Bloc complet avec un seul voyant allumé :

```js
renderDashboardElement("instrument-cluster", {
  state: "active",
  warning: "oil",
  lit: true,
  speed: 50,
  rpm: 2400,
});
```

Compte-tours piloté :

```js
renderDashboardElement("tachometer", {
  state: "idle",
  rpm: 6500,
});
```

Voyant isolé :

```js
renderWarningIcon("seatbelt", {
  state: "found",
  lit: true,
});
```

## Types

| Type | Élément | Options |
|---|---|---|
| `instrument-cluster` | bloc compteurs complet | `warning`, `lit`, `speed`, `rpm` |
| `warning-lights` | collection des douze voyants | `warning`, `lit` |
| `tachometer` | compte-tours et zone rouge | `rpm` |

Tous acceptent `state`, `silhouette` et `labels`.

`warning` accepte :

```text
engine · oil · battery · abs · airbag · temperature
tyre-pressure · handbrake · fuel · esp · seatbelt · lights
```

`speed` est borné entre 0 et 130 km/h et pilote l’aiguille gauche. `rpm` est
borné entre 0 et 8 000 et arrondi par pas de 100. Une seule alerte peut être
éclairée à la fois. `lit: false` éteint les douze voyants sans changer la
sélection mémorisée.

## Noyau commun

`art-core.js` est la source unique de :

- la palette ;
- quatre recettes de matière ;
- quatre états ;
- l’étalon volant / compteur / commande ;
- la lumière, les libellés superposés et le cadre d’état.

Les SVG ne contiennent aucun texte. Les noms, valeurs et unités restent des
calques HTML traduisibles.

## Valider

Avec le serveur local actif :

```bash
node mockups/moteur-pilote/art-library/validate-lot2.mjs
```

Le validateur contrôle les trois largeurs, les quatre états, les douze voyants,
la vitesse 0–130, le régime 0–8 000, les quinze silhouettes à 40, les cibles
tactiles, le mouvement réduit, l’accessibilité et la console.

Le lot 3 n’est volontairement pas commencé.
