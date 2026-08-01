# Mode Pilote — décisions de Rayan

> Dictées le 31/07/2026. À lire avant d'écrire une ligne de code.
> Ce fichier prime sur `README.md`, `GALERIE.md` et `CARTOGRAPHIE-31.md` en cas de désaccord.

## 1. Un seul nom : « Mode Pilote »

Le prototype appelé « Le labo de la conduite » (branche `feat/labo-moteur-presets`, PR #600)
et le Mode Pilote sont **la même chose**. Deux noms pour un seul produit, c'est fini.

**On garde « Mode Pilote ». « Labo » est abandonné**, le mot n'évoque rien de la conduite.

À renommer partout quand les deux chantiers se rejoindront :

| Aujourd'hui | Après |
|---|---|
| `permigo-game/src/lab/labo/` | dossier Mode Pilote |
| `permigo-game/lab/labo/index.html` | idem |
| `src/lab/labo/labo.css` | idem |
| `tests/e2e/labo-conduite.spec.js` | idem |
| entrées `labo` dans `vite.config.js` | idem |
| titres « Le labo de la conduite » à l'écran | « Mode Pilote » |

## 2. Où le Mode Pilote se branche dans l'app

Ce n'est **pas** un prototype à côté. C'est la marche entre la révision et la certification.

La boucle voulue :

1. l'élève révise sa fiche dans **« Prépare ta leçon »** ;
2. l'app lui **propose de certifier** la leçon ;
3. il enchaîne **directement** sur le parcours en **Mode Pilote** ;
4. le Mode Pilote **fait monter les compétences dans « Mon permis »**.

## 3. Mode Pilote n'est pas Mise en situation

Deux modes distincts, on ne les fusionne pas.

- **Mise en situation** : les scènes de décision, déjà en production.
- **Mode Pilote** : l'entraînement qui fait monter les compétences dans « Mon permis ».

## 4. L'entrée du Mode Pilote, c'est « Mon permis », pas un menu à lui

Aujourd'hui `main.js` affiche `renderHub()` (ligne 209) : ses propres mondes, ses propres
nœuds de mission, son propre niveau. C'est un deuxième hub, en concurrence directe avec
« Mon permis ».

**Ce n'est pas ce qu'on veut.** L'élève ne choisit pas une mission dans un menu séparé.
Il part de « Mon permis », il touche une compétence, et il tombe dans la mission
correspondante. Le Mode Pilote reçoit un identifiant de compétence et joue la mission.
Il ne présente rien avant.

À faire : sortir la sélection de mission du Mode Pilote et la remplacer par une entrée
directe par identifiant de compétence (C1a, C1b…). L'écran « boîte manuelle ou
automatique » reste, mais il appartient à l'inscription ou aux réglages, pas au lancement
d'une mission.

## 5. Reprendre le toucher du Labo

Le Mode Pilote a bien des zones tactiles (`content.js`, `hotspots`, mode `spot`), mais
elles sont plus pauvres que celles du Labo. Différence exacte :

| | Labo | Mode Pilote |
|---|---|---|
| Zones par scène | plusieurs, définies dans le preset `zones[] { id, label, aide, at:{x,y} }` en pourcentage du décor | une bonne réponse à trouver |
| Ce que fait l'élève | **explore** les zones, puis **les touche dans le bon ordre** | touche la bonne zone |
| Aide | un texte de coaching **par zone** | un seul message de rattrapage |
| Parcours | 6 étapes, repérer puis refaire le geste | briefing, jeu, retour |

À reprendre du Labo, sans reprendre son code tel quel :
`src/lab/labo/presets.js` (le format `zones` en pourcentage) et le temps d'exploration
avant le geste, avec son aide par zone. C'est ce qui donne la sensation de toucher.

## 6. À trancher avant de coder le lot suivant

**Contradiction ouverte sur la certification.**

`CARTOGRAPHIE-31.md` écrit aujourd'hui, ligne 13 : « ne certifie jamais une compétence »,
et ligne 249 : « le texte ne promet ni maîtrise ni certification ». Chaque mission se
termine sur « prêt à pratiquer ».

Or le point 2 ci-dessus dit que le Mode Pilote fait monter les compétences dans
« Mon permis ». Les deux ne peuvent pas être vrais en même temps.

Trois lectures possibles, Rayan tranche :

- **A.** Le Mode Pilote certifie vraiment. Alors la cartographie est à corriger.
- **B.** L'élève certifie à l'étape 2 (avant le parcours), et le Mode Pilote ne fait
  que préparer. Alors le point 2 est à reformuler, et rien ne monte via le Mode Pilote.
- **C.** Le Mode Pilote fait monter une progression **visible** dans « Mon permis »
  sans être une certification réglementaire. Alors il faut nommer cette barre
  autrement que « certifié » à l'écran.

Ne pas coder la remontée vers « Mon permis » tant que ce point n'est pas tranché.
