# Analyse UX du dashboard moniteur — ressenti d'engineering tester

**Promesse du produit :** facilité à **placer, annuler, modifier, programmer** des heures avec l'élève. Relation élève-enseignant fluide.

**Méthode :** je me mets dans la peau d'un moniteur qui ouvre l'app entre 2 leçons, dans sa voiture, sur son tel.

---

## 😊 Ce qui me met à l'aise

| Élément | Pourquoi ça marche |
|---|---|
| Carte "Aujourd'hui" en haut | Je vois mon prochain rdv sans cliquer |
| 📞 Appeler en 1 tap | Je peux prévenir l'élève si retard |
| 🗺 Itinéraire | Maps direct, je perds pas 10 sec |
| Compteur 35h proéminent | Je sais où j'en suis pour la semaine |
| Statuts white/yellow/red sur les leçons | Lecture instantanée |
| Liste "Aussi aujourd'hui" triée + état | Je vois ce qui reste à faire |

---

## 😤 Ce qui me frustre (par ordre d'impact)

### 🔴 1. Pas de bouton "Modifier" dans le modal d'événement

Quand je clique sur une leçon existante, j'ai **Fermer** et **Annuler la leçon**. C'est tout.

**Si l'élève me dit "on peut décaler de 30 min ?"** → je dois supprimer + recréer = 8 clics minimum.

**Cette friction est inacceptable** pour la promesse "modifier facilement".

### 🔴 2. Programmer une nouvelle leçon = trop d'étapes

Aujourd'hui, pour proposer un créneau à un élève précis :
1. Cliquer "+ Créneau" (topbar) ou un slot libre du calendrier
2. Choisir le type (Leçon par défaut, OK)
3. Régler la date
4. Régler la durée
5. Choisir l'heure de début dans un dropdown (qui peut commencer à 9h sans rapport)
6. Sélectionner l'élève dans une liste déroulante
7. Sélectionner le lieu de RDV
8. Valider

**~8 actions** pour ce qui devrait être 2-3 max.

**Ce qui devrait exister :** depuis la fiche élève → bouton **"📅 Proposer 3 créneaux"** qui génère 3 propositions selon mes dispos + me les fait valider en 1 clic.

### 🟡 3. Pas de "Confirmer / Refuser" rapide pour les demandes en attente

Quand un élève demande un créneau (statut "pend"), je vois la leçon en jaune dans le calendrier. Pour confirmer/refuser, il faut :
1. Naviguer dans la semaine
2. Cliquer sur le slot jaune
3. Modal s'ouvre
4. Cliquer "Annuler" (mais ce n'est pas refuser)

→ Pas d'action positive de confirmation. Pas de visibilité agrégée des demandes en attente.

**Ce qui devrait exister :** une section en haut du planning **"3 demandes en attente"** avec ✅/❌ inline pour chaque.

### 🟡 4. Définir mes dispos = action camouflée

Pour qu'un élève puisse réserver, le moniteur doit avoir des **créneaux dispos** ouverts.

Aujourd'hui : ouvrir "+ Créneau" → choisir type "Dispo" → renseigner. Pour 5 dispos par jour × 5 jours = 25 fois cette manip.

**Ce qui devrait exister :** un mode **"📅 Définir mes dispos de la semaine"** qui ouvre une mini-grille où je clique sur les heures dispos d'un coup.

### 🟡 5. Replacements arbitraires lors d'une annulation

Le modal d'annulation propose 4 créneaux libres au hasard. Si la leçon était mercredi 16h, on peut me proposer lundi 9h — pas pertinent pour l'élève.

**Ce qui devrait exister :** prioriser les replacements **proches dans le temps** (même jour suivant, même créneau horaire, etc.) et **adaptés à l'élève** (pas un samedi si l'élève bosse le samedi — V2 avec préférences élève).

### 🟢 6. Calendrier semaine entière trop large

Affichage 6h-23h × 7 jours = 119 cellules. Je travaille typiquement 8h-20h × Lun-Sam.

→ Beaucoup de scroll inutile. La densité visuelle est faible.

**Ce qui devrait exister :** par défaut 8h-20h × Lun-Sam, avec un toggle "🌙 Heures étendues" pour afficher le reste.

### 🟢 7. Pas de drag & drop pour déplacer une leçon

Standard sur tous les calendriers modernes (Google Cal, Outlook). L'absence est étrange en 2026.

### 🟢 8. Relation élève-enseignant pauvre dans l'app

L'app gère le planning, mais ne facilite pas la communication :
- Pas de "message rapide" type SMS prédéfini ("Je suis dans 5 min", "Êtes-vous prêt ?")
- Pas de "marquer présent / absent" rapide après la leçon
- Pas de "rappeler dans 1h"

---

## 📊 Bilan accessibilité

| Critère | Note | Justification |
|---|---|---|
| **Clarté** | 7/10 | La carte Aujourd'hui sauve la mise, le calendrier est dense |
| **Vitesse d'action** | 4/10 | Programmer demande 8 clics, modifier impossible |
| **Découvrabilité** | 6/10 | Beaucoup de features cachées dans des modals |
| **Mobile** | 7/10 | Bottom nav OK, mais carte Aujourd'hui peut casser sur 375px |
| **Feedback** | 8/10 | Toasts, confettis, animations OK |
| **Erreurs** | 7/10 | Validation OK mais messages parfois génériques |

**Score global UX moniteur : 6.5/10**

→ L'app **fait le job** mais ne **facilite pas** la promesse principale (placer/modifier/annuler vite).

---

## 🎯 Recommandations prioritaires (v6.4 "Élève-First")

| # | Action | Impact UX | Effort |
|---|---|---|---|
| 1 | Ajouter bouton **"Modifier"** dans modal m-event | 🔥 Énorme | S |
| 2 | Section **"⏳ Demandes en attente"** en haut du planning, avec ✅❌ inline | 🔥 Énorme | M |
| 3 | Bouton **"📅 Proposer 3 créneaux"** sur fiche élève | 🔥 Énorme | M |
| 4 | Replacements **intelligents** (proches dans le temps) lors annulation | 🟡 Moyen | S |
| 5 | Calendrier **compact par défaut** (8h-20h, Lun-Sam) + toggle étendu | 🟡 Moyen | S |
| 6 | **"Définir mes dispos"** : mode batch sur grille | 🟡 Moyen | M |
| 7 | Bouton **"Messages rapides"** sur fiche élève (toast simulant SMS prédéfinis) | 🟢 Bonus | S |
| 8 | Drag & drop minimal des leçons | 🟢 Bonus | L (skip) |

→ Si on fait les 6 premiers, le score passe à **8.5/10** et on tient enfin la promesse.

---

## 🤔 Le cœur du sujet — la relation élève/enseignant

Aujourd'hui l'app **stocke** la relation (notes privées, livret, notations) mais elle ne **fluidifie pas l'interaction**.

Ce qu'on devrait vivre côté moniteur :

> "L'élève vient de demander un créneau" → **notif** → 1 clic Confirmer
> "Mon élève est en retard" → **bouton Appeler** (déjà là ✅)
> "On veut décaler la leçon" → **bouton Modifier** (manquant)
> "Je veux proposer 3 créneaux à Arnaud" → **1 bouton sur sa fiche** (manquant)
> "L'élève vient de finir, je dois remplir le livret" → **alerte sur la carte Aujourd'hui** (manquant)

Ce sont ces interactions qui transformeront l'app de "outil de stockage" en "assistant relation client".
