# La boucle de certification

> Décision de Rayan, 31/07/2026. Ce fichier prime sur `CARTOGRAPHIE-31.md` sur
> le point de la certification, et complète `DECISIONS-RAYAN.md`.

## En une ligne

**La contradiction est tranchée : le Mode Pilote certifie.** La cartographie
disait « une mission ne certifie jamais une compétence ». C'est faux à partir
d'aujourd'hui. Finir la mission fait passer la compétence en **acquise** dans
« Mon permis ».

## Le parcours, écran par écran

1. **L'élève révise.** Il lit sa fiche de révision et fait son quiz de fiche.
   Rien ne change ici, c'est `revision-conduite.js`.
2. **On lui propose de certifier la leçon.** Un bouton, une phrase. Le pont
   existe déjà (commit `9967e20`).
3. **Le jeu s'ouvre.** Pas de menu, pas d'écran intermédiaire, pas de choix de
   mission. Le Mode Pilote reçoit l'identifiant de la compétence de la fiche et
   joue directement.
4. **Il finit la mission, la compétence est certifiée.** Écran de succès
   existant : la carte de collection se révèle, +25 volants.
5. **S'il rate**, on ne le note pas, on le renvoie à sa fiche. Le bouton
   « Relire la fiche » attend ~5 secondes avant d'être actif, le temps qu'il
   lise le pourquoi de son erreur. Durée à affiner à l'œil.
6. **La mascotte propose la suite.** Après la certification, elle propose de
   préparer la prochaine leçon avec le thème suivant.
7. **Dans « Mon permis », la compétence s'affiche acquise.** Automatique dès que
   `self_validate_competence` a tourné, la page lit déjà `self_validations`.

## Les deux règles de langage

**Jamais le code REMC à l'écran.** « C1a » ne veut rien dire pour un élève. On
affiche le titre de la fiche, « Prendre en main le poste de conduite ». Le code
reste un identifiant interne. Déjà appliqué dans la maquette.

**Jamais de pourcentage.** Ni pendant le jeu, ni à l'arrivée, ni en cas d'échec.
Aujourd'hui l'écran d'échec de `valider-seul.js` dit « 60 % sur … il te faut
70 % pour valider ». Cette phrase saute. On dit « pas encore », on dit ce qui
manque, on ne note pas.

## Ce qui existe déjà, à ne pas réécrire

| Brique | Où | Ce qu'elle fait |
| --- | --- | --- |
| Le pont vers la certif | `src/pages/eleve/revision-conduite.js` | propose de certifier après la révision |
| La certification serveur | `src/pages/eleve/valider-seul.js` | RPC `self_validate_competence`, corrigée serveur |
| La récompense | idem | `claim_competence_reward`, +25 volants, carte de collection |
| L'avancée du hero | idem | efface `pg-prep-theme` pour que « Je me prépare » passe au thème suivant |
| L'affichage acquis | `src/pages/eleve/mon-permis.js` | lit `self_validations`, coche verte |
| Les mascottes | `public/skins/mascot-*.png` | 5 poses dont `mascot-point` et `mascot-coach` |
| Le moteur de mission | `mockups/moteur-pilote/assembly/` | schéma, résolveur de boîte, assembleur de scène |

Aucune migration à prévoir. L'infrastructure « auto-certification pour tous »
est déployée depuis le 17/07.

## Ce qui reste à coder

1. **Le jeu prend la place de l'épreuve de `valider-seul`.** La page garde son
   rôle (elle certifie, elle récompense, elle fait avancer le hero) mais son
   quiz interne est remplacé par la mission.
2. **Le titre affiché vient de la fiche**, jamais du code.
3. **L'écran d'échec** perd son pourcentage et gagne sa temporisation.
4. **L'écran mascotte « prochaine leçon »**, avec le thème suivant nommé.
5. **Le schéma de mission doit autoriser un résultat certifiant.** Il refuse
   aujourd'hui tout mot qui promet une certification (`MOTS_INTERDITS` dans
   `assembly/mission-schema.js`), garde-fou écrit quand la règle était
   l'inverse. À rouvrir proprement, pas à contourner.
6. **Le filet des 29 compétences sans mission.** Deux missions existent sur 31.
   Tant que les autres n'existent pas, la certification retombe sur le quiz
   actuel. Le front ne doit jamais laisser un élève devant une porte fermée.

## Restent à trancher

- **Le pourcentage du hero de « Mon permis »** (« 26 % » sur la barre globale) :
  il tombe sous la règle ou il reste ? Ce n'est pas une note, c'est une
  progression, mais c'est un pourcentage à l'écran.
- **Les 5 corrections pédagogiques relevées par Codex** avant de dupliquer le
  modèle sur les 29 autres compétences : mauvais angle mort en C2f, consigne
  d'insertion dangereuse en C3e, questions d'embrayage posées à des élèves en
  boîte automatique, sous-régime conseillé en C4c, le mot « officiel » sur un
  quiz qui ne l'est pas.
