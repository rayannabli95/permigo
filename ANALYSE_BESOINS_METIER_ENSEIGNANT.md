# Analyse des besoins métier — le compte enseignant de PermiGo

*Document de cadrage produit — 7 juin 2026*

But de ce document : répondre une bonne fois à la question qui te ronge — **à quoi sert vraiment le compte enseignant ?** — en partant du métier réel du moniteur indépendant, pas d'une intuition. À la fin, on sait ce qu'on garde, ce qu'on recycle, ce qu'on enlève. Et pourquoi.

---

## 1. Qui est vraiment Ryan (le moniteur indépendant)

Ryan n'est pas un joueur. C'est un micro-entrepreneur qui vend des heures. Son économie réelle, en 2026 :

- Il facture **25 à 32 €/h** (25 à 37 € HT via les plateformes), pour un net de **2 300 à 3 500 €/mois** — environ le double d'un salarié, *à condition que son planning soit plein*.
- Son plafond de chiffre d'affaires en micro-entreprise est de **83 600 €**, cotisations à 25,6 %.
- Sa hantise n°1 n'est pas pédagogique, elle est économique : **un planning qui se vide**. Périodes creuses (été, fêtes), lancement difficile, dépendance à une ou deux auto-écoles avec risque de requalification en salariat déguisé.

Traduction simple : **tout ce qui ne remplit pas son agenda ou ne protège pas sa réputation, il s'en fout.** Il n'a pas de temps à perdre, pas de patron à impressionner, pas de collègues à battre.

C'est le filtre à appliquer à chaque fonctionnalité : *est-ce que ça remplit son planning, ça protège son autorité, ou ça prouve sa valeur ? Sinon, dehors.*

---

## 2. Ses besoins réels, par ordre de priorité (jobs-to-be-done)

1. **Remplir son planning / sécuriser ses revenus.** La survie. Tout part de là.
2. **Tenir son autorité pédagogique au quotidien.** Décider quand un élève passe l'examen, gérer la pression de l'élève impatient sans se faire passer pour celui qui « fait traîner pour vendre des heures ». C'est la douleur que tu as identifiée — elle est réelle et quotidienne.
3. **Prouver sa valeur pour recruter sans dépendre d'une plateforme.** Sa réputation (taux de réussite, sérieux) est son seul moteur d'acquisition gratuit. S'il ne dépend que d'Ornikar pour ses élèves, il est captif et commissionné.
4. **Gagner du temps administratif.** Livret, suivi, paperasse. Important — mais c'est un *dû*, pas un argument de vente (tous les concurrents le font).
5. **Rester conforme REMC.** Obligation, pas désir.

---

## 3. Le terrain de jeu (ce qui existe déjà)

Deux constats qui doivent guider toutes les décisions :

**Le livret numérique REMC est une commodité saturée.** Klaxo, Mon Livret de Formation, Ediser, VroomVroom, Drivup, Ornikar Pro, Lepermislibre — tout le monde le fait. Si la promesse de PermiGo est « un livret numérique », c'est mort : tu arrives dixième sur un marché banalisé. Le livret doit être le *socle*, jamais l'argument.

**Ornikar et Lepermislibre sont la vraie menace — et la vraie faille.** Plus d'un candidat sur trois passe par une auto-école en ligne. Elles fournissent au moniteur indépendant à la fois les élèves *et* l'outil de suivi. Mais en échange, elles **possèdent la relation élève** et prennent leur part. Le moniteur qui veut être réellement indépendant a besoin d'outils *qu'il possède*, qui le rendent crédible *en son nom propre* — pas sous la marque d'une plateforme. **C'est exactement le créneau de PermiGo.**

---

## 4. La promesse défendable de PermiGo (côté enseignant)

> **PermiGo transforme le suivi REMC obligatoire en deux choses que Ryan ne peut obtenir nulle part ailleurs : de l'autorité au quotidien, et une preuve de valeur à son nom.**

Et il y a un actif unique que les concurrents n'ont pas : **la couche d'engagement élève (gamification).** Attention, ce n'est pas un gadget côté moniteur — c'est un levier *de son business* : un élève engagé révise plus → progresse plus vite → meilleur taux de réussite → meilleure réputation de Ryan → plus d'élèves. La gamif élève sert le job n°1 du moniteur. C'est le fil qui relie tout.

---

## 5. Confrontation : chaque brique face aux besoins

| Brique existante | Sert quel besoin ? | Verdict |
|---|---|---|
| Validation des compétences (cœur) | #2, #4, #5 | **Garder** — c'est le moteur de tout |
| Livret REMC numérique | #4, #5 (socle) | **Garder** comme fondation, jamais comme argument |
| Gamification côté **élève** (XP, ligue, coffres…) | #1 indirect (engagement → réussite → réputation) | **Garder** — c'est ton vrai différenciateur |
| Capture du **résultat d'examen** | #2, #3 | **À construire** — brique manquante, fondatrice |
| Tableau **« qui est prêt / qui ne l'est pas »** | #2 | **À construire** — l'outil d'autorité quotidien |
| Preuve de valeur partageable (taux de réussite, page/badge) | #1, #3 | **À construire** (léger), pas d'annuaire |
| Parcours moniteur 10 niveaux / XP | aucun | **Enlever du compte moniteur** |
| Ligue / classement entre **moniteurs** | aucun | **Enlever** — Ryan n'a pas de collègues à battre |

### Pourquoi le parcours moniteur et la ligue moniteur tombent

Reprends le filtre de la section 1. Le parcours XP côté moniteur ne remplit pas son planning, ne lui donne aucune autorité face à un élève, ne prouve rien à un prospect, ne lui fait pas gagner de temps. La ligue entre moniteurs non plus — un indépendant ne joue pas contre d'autres moniteurs qu'il ne connaît pas, ça ne lui ramène pas un seul élève. Ce sont des mécaniques de *joueur*, collées sur un *professionnel qui paie*. C'est précisément ce qui sonnait faux et te bloquait.

### Important : « enlever » ≠ « jeter ton travail »

Le travail de progression, les composants, le design, la mécanique de paliers — **rien n'est perdu.** On les *réoriente* : la logique « franchir une étape » devient « ma vitrine de preuve se remplit » et « mon tableau de readiness s'enrichit ». Tu n'effaces pas, tu rebranches sur ce qui compte. Et tout le reste (validation, livret, gamif élève) est non seulement gardé mais devient le centre.

---

## 6. Recommandation : le recentrage

Le compte enseignant a **un seul job clair** : *donner à Ryan de l'autorité objective face à ses élèves, et une preuve de ses résultats à son nom.*

Concrètement, par ordre de construction :

1. **Capturer le résultat d'examen** (reçu / raté / en attente). Brique de données fondatrice — un élève reçu sort de la vue active.
2. **L'écran de readiness** : élèves triés par complétude du livret, compétences manquantes visibles. L'outil que Ryan ouvre devant l'élève qui réclame une date. Déplace le conflit de l'émotionnel (« t'es pas prêt ») vers le référentiel (« le livret dit qu'il manque ça »).
3. **La preuve de valeur** : taux de réussite + complétude, affichable sur une page perso partageable ou un badge. Pas d'annuaire tant qu'il n'y a pas de volume des deux côtés (un annuaire vide décrédibilise).

Une seule brique de données (complétude + résultat d'examen) nourrit les trois. C'est ça, le vrai compte enseignant.

---

## 7. La question stratégique qui reste ouverte (la plus importante)

Cette analyse résout « à quoi sert le compte enseignant ». Mais le besoin n°1 de Ryan — **remplir son planning** — PermiGo n'y répond qu'indirectement (via la réputation). La vraie question de fond de ton business, c'est : *PermiGo veut-il seulement rendre Ryan meilleur et plus crédible, ou veut-il aussi l'aider à trouver des élèves (et donc, un jour, marcher sur les plates-bandes d'Ornikar) ?*

Pas besoin de répondre maintenant. Mais c'est ça, le vrai débat — pas le design d'un parcours.
