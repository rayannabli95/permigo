# Mode Pilote — moteur de simulations PermiGo

Prototype autonome d’un moteur pédagogique inspiré de la maquette A.
Le contenu est piloté par des données : ajouter une mission ne demande pas de
recréer une page.

## Lancer

Depuis le `permigo-game/` du worktree :

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

Puis ouvrir :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/
```

## Ce que le prototype démontre

- onboarding avec filtre boîte manuelle ou automatique ;
- campagne C1 à C4, trois missions par monde pour chaque transmission ;
- cinq mécaniques : trouver, décider, ordonner, tracer et diagnostiquer ;
- indices adaptatifs après deux hésitations ;
- sons générés localement et retours haptiques compatibles ;
- XP privé identique quel que soit le nombre d’essais, sans récompense de vitesse ;
- progression et transmission conservées dans `localStorage` ;
- changement de boîte sans perte de progression ;
- consolidation locale planifiée à 48 h dans les données du prototype ;
- aucune fausse certification : chaque fin de mission indique « prêt à pratiquer ».

## Architecture

- `content.js` — mondes, transmissions et missions ;
- `engine.js` — état, filtrage, réponses, progression et persistance ;
- `main.js` — rendu des écrans, cinq mécaniques, audio et interactions ;
- `styles.css` — direction visuelle mobile, scènes et retours de jeu.
- `art-library/` — bibliothèque SVG réutilisable, livrée et validée lot par lot.

## Cartographie des 31 missions

- `CARTOGRAPHIE-31.md` relie chaque compétence C1a–C4g à une mécanique, un
  assemblage d’assets, sa variante de boîte et ses dépendances ;
- `MISSION-CLAUDE-C1A.md` est le mandat exécutable pour construire le premier
  vrai jeu assemblé sans lancer les lots graphiques 4 et 5.

## Bibliothèque graphique

La planche de contact du lot 1 « pieds et boîte » est disponible à :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/art-library/
```

Elle expose six composants pilotables, leurs quatre états, l’éclairage séparé
de chaque position P/R/N/D et de chaque rapport, ainsi que le test de silhouette
à 40. Voir `art-library/README.md` pour l’API.

Le lot 2 « tableau de bord » est disponible à :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/art-library/lot2.html
```

Il ajoute le bloc compteurs, les douze voyants isolables et le compte-tours
pilotable. Voir `art-library/LOT2.md` pour l’API et la commande de validation.

Le lot 3 « véhicule et contrôles » est disponible à :

```text
http://127.0.0.1:4175/mockups/moteur-pilote/art-library/lot3.html
```

Il ajoute trois vues du véhicule, le pneu et son témoin d’usure, les blocs
optiques avant et arrière, ainsi que le capot ouvert et ses quatre niveaux.
Voir `art-library/LOT3.md` pour l’API et la commande de validation.

## Ajouter une mission

Ajouter une entrée à `MISSIONS` avec :

```js
{
  id,
  competence,
  world,
  transmissions,
  mode,
  title,
  objective,
  prompt,
  visual,
  solution,
  hint,
  retry,
  success,
  why,
  transfer,
}
```

Selon la mécanique, ajouter `hotspots`, `choices`, `steps + sequence` ou
`paths`. Le moteur prend ensuite en charge le filtrage, la reprise, l’indice,
la récompense privée et la persistance.

## Limites volontaires

Ce dossier reste un prototype hors production :

- aucune écriture Supabase ;
- aucune modification du routeur ;
- aucune analytics réelle ;
- aucune certification de compétence ;
- les scènes sont dessinées en HTML/CSS/SVG, pas encore adaptées au véhicule
  exact de chaque auto-école.
