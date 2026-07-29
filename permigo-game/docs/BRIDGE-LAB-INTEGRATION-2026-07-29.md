# Bridge Lab — comment l'intégrer (note de décision, pas de code)

*29/07/2026 — écrit pendant l'absence de Rayan (2h de leçon), à lire à son retour. N'engage aucun changement de cap : aucune des options ci-dessous n'est codée.*

## Où on en est

Codex a livré un prototype (`permigo-game/src/lab/bridge-angle-mort.js` + `lab/bridge-angle-mort/index.html`) : un parcours en 6 écrans qui apprend à l'élève à reconnaître la consigne « Contrôle ton angle mort » que son moniteur va dire en leçon — FR/EN/AR, observation du cockpit → séquence guidée → explication bilingue → phrase audio → succès.

Vu de mes yeux (capture + 8 tests e2e verts) : **la DA tient, l'arabe RTL est bien géré (les zones gardent leur position physique), le feedback d'erreur est pédagogique**. Un doublon FR (le texte français répété deux fois) a été fixé aujourd'hui sur `codex/bridge-angle-mort-fr-fix`.

C'est un **labo isolé** : localStorage à lui, aucune connexion à l'auth/Supabase, absent du build de prod. Il ne peut pas être « mergé » tel quel — ce n'est pas une feature, c'est une preuve de concept.

Rayan a tranché (29/07) : **ce concept doit devenir une vraie feature.** Reste à choisir comment.

## Rappel du contexte stratégique (décision du 29/07, cf. mémoire `repositionnement_international_communautes`)

PermiGo se recentre sur les élèves non-francophones. La douleur : ils comprennent mal leur moniteur en leçon. Deux paris à valider avant d'investir gros : **est-ce qu'ils paient ? est-ce qu'ils invitent ?** Le plan recommandé est de tester ça sur un périmètre volontairement petit (20 élèves, 1 parcours complet), pas de construire les 31 cartes de compétence d'un coup.

Cette note d'intégration doit donc respecter cette contrainte : **coût d'implémentation minimal pour le premier test.**

## 3 options d'intégration

### Option A — Le Bridge devient LE gabarit des 31 cartes de compétence
Le format 6-écrans du lab devient la structure officielle de chaque carte REMC (C1-C4), avec la méthode maison + ICRI dedans, branché sur l'auth/Supabase/vraie progression.
- **Coût** : élevé. Il faut un vrai modèle de données (compétence × langue × phrase moniteur × audio), remplacer le localStorage par de la vraie persistance, brancher la triple validation.
- **Risque** : on construit les 31 cartes AVANT d'avoir prouvé que quelqu'un les utilise ou paie pour ça. C'est exactement le piège que la stratégie du 29/07 veut éviter.
- **Avantage** : si ça marche, c'est fini — tout le système est en place d'un coup.

### Option B — Le Bridge devient une mini-feature autonome : « Le vocabulaire de ton moniteur »
Un lexique léger, séparé de la Triple Validation et du quiz REMC : quelques phrases-clés que le moniteur dit vraiment (« Contrôle ton angle mort », « Serre à droite », « Freine doucement »...), chacune avec le mini-parcours du lab (observation → geste → explication → audio). Accessible depuis un point d'entrée simple (ex. un lien dans l'accueil ou les réglages), sans toucher au système de compétences existant.
- **Coût** : faible à moyen. On garde le moteur du lab quasi tel quel, on le branche juste à l'auth (savoir qui est connecté, sa langue) sans re-designer tout le modèle REMC.
- **Avantage** : **c'est exactement le format qu'il faut pour tester les 2 paris rapidement** — 1 parcours complet, AR+EN, devant 20 élèves, sans reconstruire l'architecture pédagogique.
- **Risque** : si ça marche, il faudra migrer vers un vrai modèle de données plus tard (dette technique assumée, pas un problème si on le sait d'avance).

### Option C (recommandée) — B d'abord, A ensuite si B valide les 2 paris
On ship l'option B en premier, sur 1 seule compétence (angle mort, déjà prête), en AR + EN. On la met devant les 20 élèves du test. On regarde conversion et parrainage (les 2 paris de la stratégie du 29/07).
- Si les chiffres sont bons → on investit dans l'option A (le vrai gabarit des 31 cartes, la vraie architecture).
- Si les chiffres sont mauvais → on n'a perdu qu'un petit chantier, pas 31 cartes construites pour rien.

**C'est celle que je recommande**, parce qu'elle colle exactement à la logique que Rayan a validée le 29/07 : tester cher-en-valeur/pas-cher-en-coût avant de construire à l'échelle.

## Ce qu'il faudra décider avec Rayan (pas maintenant, à son retour)

- Où vit le point d'entrée du lexique dans l'app (accueil ? réglages ? notification après inscription ?).
- Quel compte/quelle langue sert de test (20 élèves — lesquels, recrutés comment).
- Le dialecte arabe à trancher pour l'audio (cf. risque identifié dans l'analyse stratégique : darija ≠ fusha ≠ levantin).

Cette note ne code rien. Elle prépare la décision.
