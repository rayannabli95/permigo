# CHECKPOINT Autopilot v6.1 — Analyse honnête

## Méthode

J'ai relu l'app en me mettant successivement dans la peau de chaque rôle, avec
focus sur le moniteur (cœur de l'app, comme tu le soulignes).

---

## ✅ POSITIFS

### Infra
- Mono-fichier propre, persistance localStorage qui marche, refresh ne casse rien
- Couche `STORE` prête à être branchée sur une vraie API
- 3 rôles isolés, navigation propre, sidebar + bottom nav mobile
- Auth screen v6 (login/signup/demo) fonctionnel

### Élève
- **C'est la partie la plus aboutie** — comme tu l'as remarqué.
- Hero clair, prochains cours visibles, livret rempli mis en avant
- Trophées REMC bien gamifiés
- Réservation simple

### Admin
- Dashboard structuré, KPIs, alertes, actions rapides
- Assiduité hebdo + paye + notations rassemblées
- Calendrier avec sélecteur moniteur

---

## ❌ NÉGATIFS / FAILLES (par ordre de gravité)

### 1. CÔTÉ MONITEUR — pas assez fort (le cœur de l'app !)

**Le moniteur ouvre l'app et que voit-il ?** Une grille semaine entière avec
toutes les heures de 6h à 23h. Pour un mec qui veut juste savoir "qui à 9h ce
matin", c'est trop.

Manque :
- **Section "Aujourd'hui"** en haut — prochaine leçon en gros, qui, où, contact
- **Téléphone élève cliquable** — pour appeler en cas de retard
- **Adresse du lieu cliquable** — pour ouvrir Maps direct
- **Résumé de la dernière leçon** avant d'arriver chez l'élève
- **Action "Marquer présent / absent"** en un tap après la leçon
- **Booklet ultra-rapide** — 31 compétences c'est trop pour le quotidien

### 2. IA partout, partout

**L'IA n'a rien à faire dans une appli de logistique.** Tu l'as dit. Elle ajoute :
- Du bruit visuel (chips, panels noirs gradients)
- De la confusion (5 agents, 4 prompts par contexte)
- Une promesse non tenue (l'IA est mockée → décevant)

→ Action : tout retirer. Si on en remet un jour, ce sera ciblé (1 endroit, 1 usage).

### 3. CA / Revenus côté gérant

Pas pertinent. Le gérant veut savoir :
- Combien de leçons cette semaine ?
- Qui ne tourne pas rond ?
- Mes moniteurs sont-ils dans les clous (heures + plafond) ?

Pas "je gagne combien" — c'est une métrique compta, pas logistique.

### 4. Calendrier non-réel

`DATES = [23,24,25,26,27,28,29]` codé en dur. Si tu navigues 3 semaines en avant,
tu peux tomber sur "33 avril". Inacceptable.

→ Refonte sur vraies `Date` JS, calcul dynamique de la semaine en cours.

### 5. "Congés payés" / "Congé sans solde"

Pas dans une appli de logistique. C'est une dimension RH gérée par le compta /
DRH. Les seuls cas pertinents pour le planning :
- **Maladie** (dernière minute, on doit re-router)
- **Formation** (planifié, on bloque le planning)
- **Autre** (souplesse)

### 6. Taux de réussite : seuil trop élevé

`>= 85% = vert`. Mais 51% c'est déjà au-dessus de la moyenne nationale du permis
(57%). 51% devrait être vert. À corriger.

### 7. Trop de fonctionnalités gadget

À garder en standby pour V2 ou V3, mais pas critique pour livraison initiale :
- Connexion biométrique (toggle qui sauvegarde mais ne fait rien de concret)
- Dark mode (joli mais pas demandé par le client)
- Export CSV paye (le client a probablement déjà sa solution paye)
- Vue Hebdo synthétique vs Semaine (redondance)
- Trophées élèves (gamification — sympa mais pas critique)

→ Décision : garder dark mode et photos, mais retirer le reste s'il complique
   l'expérience moniteur.

### 8. Trop d'emojis partout

L'enseignant qui est fatigué après 10 leçons n'a pas envie d'un sapin de Noël.
Réduire de moitié au moins.

### 9. Texte hardcodé "Auto-École du Centre · Paris 15e"

Pour livraison multi-clients, à paramétrer. Mineur mais à noter.

### 10. Notifs juste cosmétiques

`NOTIFS` est un tableau hardcodé. Cliquer "marquer lu" change le visuel mais ne
persiste pas. À corriger : persister le statut "lu" en localStorage.

---

## 🧠 CŒUR DU PROBLÈME (vue moniteur)

Un moniteur d'auto-école n'est pas un knowledge worker. Son flux quotidien :

```
07h  Réveil → check planning sur le tel
07h  "OK 1ère leçon : Sophie à 8h, je dois être à Pte de Clichy à 7h50"
07h45 Arrive sur place
08h  Leçon
09h  Pause 5 min → check qui est le suivant → marche vers point de RDV
09h05 Leçon suivante
...
17h  Dernière leçon finie
17h05 Remplir les livrets de la journée (souvent rapide, en 30 sec/élève)
17h30 Rentre chez lui
```

**Donc l'app doit lui donner :**
1. **Le prochain truc à faire**, gros, en haut, sans cliquer
2. **Un accès direct au student** (téléphone, adresse) en 1 tap
3. **Un livret qui se remplit en 30s** (pas 31 cases à cocher)
4. **Une vue "ma journée"** avant la vue semaine

L'app actuelle est faite pour quelqu'un assis devant un PC — pas pour un mec
dans sa voiture entre 2 leçons. C'est ça qu'il faut corriger.

---

## 🎯 ACTIONS POUR v6.1 (ce que je fais maintenant)

| # | Action | Statut |
|---|---|---|
| 1 | Retirer toute l'IA | À faire |
| 2 | Retirer CA / revenus | À faire |
| 3 | Retirer "Congé" des absences | À faire |
| 4 | Calendrier sur vraies dates | À faire |
| 5 | Taux de réussite vert dès 51% | À faire |
| 6 | Section "Aujourd'hui" sur planning moniteur | À faire |
| 7 | Téléphone + adresse cliquables (tel: / maps:) | À faire |
| 8 | Cleaner profil moniteur (sections inutiles) | À faire |
| 9 | Persister statut "lu" des notifs | À faire |
| 10 | Réduire emojis | À faire |

Le reste (biometric, trophées élève, export paye, etc.) → on garde mais on en
parlera en V2 si besoin de purger plus.
