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

## 4. À trancher avant de coder le lot suivant

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
