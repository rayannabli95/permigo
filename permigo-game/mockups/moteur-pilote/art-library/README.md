# Bibliothèque graphique Mode Pilote — lot 1

Bibliothèque SVG réutilisable pour les mini-jeux PermiGo. Ce premier lot couvre
uniquement les pieds et les boîtes de vitesses. Aucun fichier image n’est
nécessaire.

## Prévisualiser

Depuis `permigo-game/` :

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Puis ouvrir :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/art-library/
```

La planche est conçue et contrôlée à 390 pixels de large.

## Valider le lot

Avec le serveur local actif :

```bash
PILOTE_ART_CAPTURE=/tmp/mode-pilote-lot1.png \
  node mockups/moteur-pilote/art-library/validate.mjs
```

Le contrôle vérifie les largeurs 320, 390 et 520, les quatre états, toutes les
positions du sélecteur et du levier, les zones tactiles, le mouvement réduit,
la console, les silhouettes et les erreurs d’accessibilité sérieuses.

## API

```js
import {
  ART_SCALE,
  renderDrivingElement,
  mountDrivingElement,
} from "./art-library/elements.js";
```

Rendu sous forme de chaîne HTML :

```js
const html = renderDrivingElement("automatic-selector", {
  state: "active",
  position: "D",
  lit: true,
});
```

Montage direct dans un conteneur :

```js
const element = mountDrivingElement(
  document.querySelector("#scene-control"),
  "manual-shifter",
  {
    state: "found",
    gear: "3",
    lit: true,
  },
);
```

## Types du lot 1

| Type | Élément | Options particulières |
|---|---|---|
| `manual-pedals` | pédalier manuel | — |
| `clutch-foot` | pied gauche sur embrayage | — |
| `automatic-pedals` | pédalier automatique | — |
| `brake-foot` | pied droit sur frein | — |
| `automatic-selector` | sélecteur P R N D | `position`, `lit` |
| `manual-shifter` | levier et grille manuels | `gear`, `lit` |

Tous acceptent :

- `state`: `idle`, `active`, `found` ou `error` ;
- `silhouette`: active la vue de contrôle à 40 ;
- `labels`: remplace les libellés HTML superposés pour la traduction.

`position` accepte `P`, `R`, `N` ou `D`. `gear` accepte `1` à `6`, `R` ou `N`.
Une seule position est éclairée à la fois.

`ART_SCALE` fixe l’étalon de composition : volant `1`, compteur `1/3`,
commande `1/10`. Un assembleur de scène doit partir de ces rapports, jamais
d’une taille choisie à l’œil.

## Contrat graphique

- palette exportée dans `ART_PALETTE`, aucune couleur locale par objet ;
- quatre recettes exportées dans `ART_MATERIALS` ;
- SVG en `viewBox="0 0 100 100"` et placements internes proportionnels ;
- lumière violette en haut au centre, complément chaud à droite ;
- ombre de contact douce sous chaque objet, aucun contour noir ;
- libellés traduisibles en HTML, jamais dans les SVG ;
- une seule animation lente : le balayage du verre ;
- animations et transitions supprimées avec `prefers-reduced-motion`.

## Ajouter le lot suivant

Ajouter les types à une nouvelle liste sans modifier les six types existants.
Réutiliser `materialDefs()` et les classes de matière. Un nouveau type doit
exposer ses variantes par options : ne pas créer une copie par état.

Le lot 2 n’est volontairement pas commencé : chaque lot attend la validation
visuelle du précédent.
