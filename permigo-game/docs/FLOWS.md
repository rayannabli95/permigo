# FLOWS.md — User journeys détaillés

## 🎓 Flow ÉLÈVE

### Onboarding (1ère utilisation)

```
[Lien d'invitation depuis email auto-école]
        ↓
Écran 1 : "Bienvenue chez Auto-École Du Centre"
        ↓
Écran 2 : Prénom + photo (optionnel) + avatar SVG par défaut
        ↓
Écran 3 : "Voici ton parcours : 31 compétences à acquérir avant ton permis"
        ↓
Écran 4 : "Ton enseignant attitré : Rayan"
        ↓
[Accueil élève]
```

**Notes** :
- AUCUNE demande d'infos perso (tel, adresse, etc.)
- L'email est juste un identifiant éphémère
- 4 écrans max — 30 secondes total
- Pas de tutoriel : l'app est self-evident

### Cycle quotidien type

```
Matin (8h-9h) :
  Notif push : "Petit rappel sur les giratoires ?"
  → 30 sec de quiz
  → Streak +1

Après-midi (post-leçon) :
  Notif : "Rayan a validé 'Insertion autoroute' ! 🎉"
  → Modal Quiz 3 questions (post-validation)
  → Score affiché
  → Animation reveal trophy si compétence débloquée
  → +30 XP, +20 gemmes

48h après une validation :
  Notif : "Petite vérif rapide ? (20 sec)"
  → 2 questions consolidation
  → Score solidité de la compétence stocké

Soir (21h) :
  Notif "À 7 jours d'affilée !" si streak palier atteint
```

### Écran d'accueil élève (le hub principal)

**Header (sticky)** :
- Avatar + prénom
- Streak 🔥 (12 jours)
- Vies ❤️ (4/5)
- Gemmes 💎 (230)

**Hero card "Prochaine action"** :
- Si dernière compétence validée < 48h : "Mini quiz à faire"
- Sinon si streak en danger : "Sauve ton streak"
- Sinon : "Continue à apprendre"
- CTA : 1 bouton clair

**Stats** : 3 cards
- Crédit d'heures restantes (ex: 8h)
- Compétences acquises (12/31)
- Jours d'activité (28 jours)

**Bottom nav** : Accueil, Parcours, Trophées, Profil

### Écran Parcours REMC

- Map verticale scroll
- 31 nodes en route serpentine
- 4 mondes (Campagne, Ville, Montagne, Sommet)
- Tap sur un node → fiche compétence (description + score cognitif + statut)

### Écran Trophées

- 4 grands trophées (par monde) + trophée Permis Complet
- État : Verrouillé / En cours (X/Y) / Acquis
- Animation shimmer sur ceux acquis

### Écran Profil

- Avatar + édition (boutique avatars)
- Total compétences validées
- Total examens blancs réussis
- Streak record
- Bouton "Voir ma chronologie complète" (historique)
- Bouton "Se déconnecter"

---

## 👨‍🏫 Flow ENSEIGNANT

### Onboarding (1ère utilisation)

```
[Email d'invitation du gérant]
        ↓
Écran 1 : "Bienvenue. Voici comment ça marche en 30 sec"
        ↓
Écran 2 : Demo animée — comment valider une compétence
        ↓
Écran 3 : "C'est tout. Tu es prêt."
        ↓
[Liste de ses élèves]
```

### Écran principal : "Mes élèves" (le seul écran utilisé quotidiennement)

**Header** :
- Logo auto-école
- "Mes élèves (5)"
- Bouton bell (notifs)

**Liste verticale** : 5-15 cards élèves
- Avatar + prénom + nom initialisé (Latifa S.)
- Sub-text : "Crédit : 8h restantes" + "Dernière leçon : il y a 3j"
- Badge à droite :
  - 🟢 "Acquis solide" (toutes comp récentes ont score cognitif > 80%)
  - 🟡 "En cours" (progression normale)
  - 🟠 "À retravailler" (score cognitif < 60% sur ≥1 compétence)
- Score cognitif moyen visible (ex: "82%")

**Click sur un élève** → écran "Fiche élève"

### Écran "Fiche élève" (pour valider compétences)

- Header : prénom + avatar + crédit d'heures
- Sections :
  1. **Compétences validées récemment** (3 dernières, avec score cognitif)
  2. **Compétences à valider** (les 31 disponibles, avec statut)
  3. **Notes personnelles** (texte libre privé enseignant)

**Action principale** : Toggle "Valider" sur une compétence
- Confirmation modal : "Valider 'Giratoire 2 voies' pour Latifa ?"
- Si OK → push notif élève + déclenche son quiz post-validation
- Toast confirmation enseignant : "✓ Compétence validée, élève notifié"

### Notification post-leçon (optionnel)

Après une leçon, enseignant peut envoyer une note rapide :
- "Bonne leçon ! Bien sur les giratoires. Manque la maîtrise du créneau."
- L'élève reçoit ça en notif sur son tel

---

## 👔 Flow GÉRANT

### Onboarding (1ère fois)

```
Invitation directe (ou inscription auto-école)
        ↓
Écran 1 : "Configurez votre auto-école"
        ↓
Écran 2 : Nom école, ville, nb enseignants
        ↓
Écran 3 : "Voici votre dashboard. Pas grand-chose à régler."
        ↓
[Dashboard Pulse école]
```

### Écran principal : "Pulse école" (consulté 1-2x/semaine)

**4 KPI grands cards** :

1. **Taux de réussite école** : 73%
   - Comparaison : "vs 60% moyenne nationale (+13%)"
   - Badge vert si supérieur
   - Sur les 12 derniers mois

2. **Élèves actifs** : 47 sur 52
   - "Actifs = ≥1 connexion la semaine"
   - Sub-text : "5 inactifs depuis +14 jours"

3. **À risque** : 5 élèves
   - Couleur rouge
   - Click → liste détaillée
   - Critère : sans connexion >14j ou abandon imminent

4. **Prêts pour examen** : 8 élèves
   - Couleur vert
   - Click → liste avec contact info enseignant
   - Critère : ≥80% compétences validées + score cognitif solide

**Graphique secondaire** :
- Évolution engagement (DAU/MAU sur 4 semaines)

**Footer** :
- Sticker "Auto-école certifiée PermiGo"
- Lien page publique de l'école : `permigo.app/<slug>`

### Écran "Équipe" (1x/mois)

- Liste enseignants
- Activité de chacun (nb compétences validées/semaine)
- Bouton "Ajouter un enseignant" (envoie invitation email)

### Écran "Marketing" (asset à partager)

- QR code unique de l'école
- Page publique : permigo.app/auto-ecole-de-rayan
- Témoignages élèves (récupérés depuis l'app)
- Texte standard à copier-coller pour Insta/Facebook
- Sticker imprimable "Auto-école certifiée PermiGo"

---

## 🔄 Flow Triple Validation (cœur du produit)

### Niveau 1 : Validation pratique (immédiat)

```
[Enseignant termine leçon avec élève]
        ↓
Enseignant ouvre app sur son tel
        ↓
Liste élèves → click Latifa
        ↓
Toggle "Giratoire 2 voies" → ✓
        ↓
[DB : nouvelle ligne validations + status='acquis']
        ↓
Push notif à Latifa
```

### Niveau 2 : Validation cognitive (30 sec après)

```
[Latifa reçoit notif]
        ↓
Tap sur notif → app s'ouvre sur modal quiz
        ↓
"Compétence validée ! Mini vérification (30 sec) ?"
        ↓
3 questions ciblées sur 'Giratoire 2 voies'
        ↓
Score affiché (3/3, 2/3, 1/3)
        ↓
Animation reveal trophy si compétence vraiment débloquée
        ↓
[DB : quiz_attempts + score_cognitif dans validations]
        ↓
+30 XP, +20 gemmes
```

### Niveau 3 : Consolidation 48h

```
[Cron job détecte validations >48h sans consolidation]
        ↓
Push notif à Latifa : "Petite vérif rapide sur les giratoires ?"
        ↓
Tap → 2 questions rappel
        ↓
Score solidité affiché
        ↓
[DB : update validations.score_consolidation]
        ↓
Si score < 60% : compétence repasse en "À retravailler"
Si score > 60% : compétence "Solidifiée"
```

### Niveau bonus : Réactivation 7 jours

```
[Cron détecte compétences avec score consolidation faible]
        ↓
Notif gentle : "T'es prêt à reprendre les giratoires ?"
        ↓
Mini exercice 3 questions
```

---

## 🚨 Edge cases & flux d'erreur

### Élève qui n'a pas de smartphone
- Pas notre cible prioritaire. L'auto-école continue son fonctionnement classique sans PermiGo pour cet élève.

### Élève qui rate son quiz post-validation
- Pas grave. La compétence reste "validée pratiquement" par l'enseignant. Le score cognitif est juste un indicateur d'aide.

### Enseignant qui valide une compétence par erreur
- Bouton "Annuler la validation" disponible 24h.
- L'élève reçoit notif "L'enseignant a annulé la validation. Cliquez pour comprendre."

### Auto-école qui dégage PermiGo
- Export complet des données possibles en 1 click
- Comptes élèves passent en "Auto-école inconnue" mais ils gardent leur progression
- Possibilité de continuer sur un compte personnel (4.99€/mois)

### Bug technique côté quiz
- Si le quiz post-validation foire (3 questions ne se chargent pas), validation pratique reste OK.
- Quiz peut être refait plus tard via notif.

---

## 🎯 Le test ultime de chaque écran

Avant de finaliser un écran, pose-toi :

1. **Ça prend combien de temps pour l'action principale ?** (cible : < 10 sec)
2. **Combien de taps pour l'action principale ?** (cible : 1-2 taps)
3. **Est-ce que l'écran est compréhensible sans tutoriel ?** (oui obligatoire)
4. **Le bouton principal est-il évident ?** (un seul, gros, contrasté)

Si NON à n'importe lequel → on retravaille.
