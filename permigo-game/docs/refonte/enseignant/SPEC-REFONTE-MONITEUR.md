# Spec de refonte — Côté MONITEUR (enseignant)

> Document de référence. Toute session codeuse qui touche le moniteur DOIT lire ce fichier + `docs/MONITEUR_VISION_V3.md` avant de coder.
> Statut : v1 — 2026-05-22. Auteur : pilotage (Rayan + Claude). À valider écran par écran.

---

## 0. Principes directeurs (non négociables)

1. **Linear, pas Duolingo.** Le moniteur est un pro adulte. Ton sobre, utile. Aucun skin, aucune monnaie cosmétique, aucune récompense décorative. (cf. `MONITEUR_VISION_V3.md`, antipatterns n°2 & n°8.)
2. **Le moniteur n'est jamais bloqué par l'élève.** Beaucoup d'élèves se fichent de l'app (ils viennent pour les heures). Toute validation + comptage d'heures doit marcher à 100 % **sans aucune action de l'élève**. Le quiz élève est un **bonus optionnel**, jamais une porte.
3. **Une seule source de vérité : le moniteur.** Quand il valide, c'est validé. Le quiz élève = formalité / refresh, avec animation, mais ne change pas le résultat.
4. **Récompenses utiles only.** Monter de palier = débloquer un outil/export/stat réel. Jamais un cosmétique.
5. **Mobile-first** (90 % des usages).

---

## 1. Modèle de validation (LE point de fond)

### Problème actuel
Deux flux contradictoires coexistent :
- **Livret REMC** → le moniteur met « Acquis » **direct**, sans quiz.
- **Séance / Valider** → le moniteur débloque « à valider » → l'élève passe un quiz → ça devient « Acquis ». Si l'élève ne fait rien, ça reste bloqué.

Résultat : incohérence, et le moniteur est l'otage de l'engagement de l'élève (ex. « Lassad : 0h / 17 validations », ou des compétences coincées en « à valider »).

### Modèle cible
- L'action du **moniteur valide immédiatement** la compétence (statut `acquis`), peu importe l'entrée (Livret, Séance, Valider).
- Si l'élève utilise l'app : il reçoit un **petit quiz-récap** (formalité) + une **animation de validation** côté élève. C'est du bonus d'engagement.
- Le quiz **ne peut pas faire échouer** la validation côté moniteur. Au pire l'élève ne le fait jamais → la compétence reste `acquis` quand même.

### Implications techniques (chantier sensible — DB)
- Revoir le statut `a_valider` : aujourd'hui il « attend » le quiz. Cible : la validation moniteur écrit `acquis` directement ; `a_valider` ne sert plus qu'à signaler à l'élève « un quiz-récap t'attend » (purement cosmétique côté élève).
- Vérifier les triggers (`a_valider → acquis` au succès du quiz), les notifs (`send_quiz_notification`), et `validations.statut`.
- **Migration probable** → à montrer à Rayan AVANT application. Audit + spec dédiés.

> ⚠️ Ce chantier est séparé de la refonte visuelle. Ne pas le mélanger.

---

## 2. Écran par écran

### 2.1 Accueil « Aujourd'hui » (`aujourdhui.js`)
- **État round 1 :** hero « prochaine action » déjà posé ✅. Les 4 KPI morts retirés.
- **Reste à faire :**
  - Label « Élèves suivis » / « 3 élèves accompagnés » est **ambigu** (compte les élèves avec activité, pas les attitrés ni le total). → Clarifier : soit « 3 élèves actifs ce mois », soit afficher attitrés vs total explicitement.
  - Vérifier que le hero priorise bien : relancer (14j+) → consolidation due → inactifs → faire avancer le prochain élève.

### 2.2 Mes élèves (`mes-eleves.js`)
- Globalement OK (badges Actif/Attitré, progression x/31).
- Cohérence du compte « 4 élèves · 4 actifs » avec le « 3 accompagnés » de l'accueil/profil → aligner les définitions et les nommer pareil partout.

### 2.3 Livret REMC + modal de validation (`livret-remc.js`)
- Modal actuelle : Acquis / En cours / À retravailler + note. Bien, mais :
  - Selon le **modèle de validation cible** (§1), « Acquis » ici doit suivre la même logique que Séance/Valider (déclencher le quiz-récap élève optionnel, mais valider direct).
  - Enrichir légèrement (optionnel) : ce que la Séance a en plus (vu pendant / à revoir) pourrait être accessible, mais sans alourdir.

### 2.4 Valider / Séance (`validation.js`, `log-session.js`)
- C'est la 2ᵉ entrée de validation. Doit aboutir au **même résultat** que le Livret (§1).
- Séance : durée défaut 1h ✅, picker date ✅ (déjà fait).

### 2.5 Parcours pro (`parcours-pro.js`, `parcours-pro-complet.js`)
- **État round 1 :** skins supprimés ✅, hero sobre ✅, mode « Mystère » retiré ✅.
- **Reste à faire (critiques Rayan) :**

  **a) Démarrage trop lent.** Palier 1→2 = +30 validations. Les premiers paliers doivent ressembler à un **tuto rapide** (effet « hook ») puis ralentir vers la maîtrise.

  Proposition de seuils (à ajuster) :

  | Palier | Actuel | Cible | Titre actuel | Titre cible (sobre, cohérent) |
  |--------|--------|-------|--------------|-------------------------------|
  | 1 | 10 | **3** | Moniteur en route | Enseignant — Démarrage |
  | 2 | 40 | **8** | Moniteur confirmé | Enseignant confirmé |
  | 3 | 70 | **15** | Moniteur confirmé | Enseignant confirmé |
  | 4 | 100 | **30** | Enseignant chevronné | Enseignant chevronné |
  | 5 | 130 | **50** | Enseignant chevronné | Enseignant chevronné |
  | 6 | 180 | **80** | Référent pédagogique | Référent pédagogique |
  | 7 | 230 | **120** | Référent pédagogique | Référent pédagogique |
  | 8 | 280 | **170** | Maître enseignant | Référent pédagogique |
  | 9 | 330 | **230** | Maître enseignant | Expert REMC |
  | 10 | 380 | **300** | Expert REMC | Expert REMC certifié |

  → Early game rapide (3, 8, 15), puis montée régulière. Chiffres à valider par Rayan.

  **b) Titres « cheap » + incohérence Moniteur/Enseignant.** L'app dit « Enseignant » (rôle) mais le parcours dit « Moniteur en route ». **Choisir UN mot** (proposition : « Enseignant » partout) et virer « en route ». Échelle pro proposée : Démarrage → Confirmé → Chevronné → Référent pédagogique → Expert REMC certifié.

  **c) Récompenses pas claires.** « Analytics comparatives » = flou. Deux actions :
  - **Renommer en clair** :

  | Actuel | Renommage proposé |
  |--------|-------------------|
  | Export PDF Livret | Export PDF du livret élève |
  | Stats avancées élèves | Tableaux de bord détaillés par élève |
  | Templates bilan pédago | Modèles de bilans mensuels |
  | Prépa examen enrichie | Mode préparation à l'examen |
  | Analytics comparatives | Comparaison avec d'autres écoles (anonyme) |
  | Profil mis en avant | Profil visible par les nouveaux élèves |
  | Modules formation | Formation continue |
  | Programme mentorat | Mentorat de nouveaux moniteurs |
  | Expert Hub | Communauté privée experts REMC |
  | Cercle Or | Statut Expert REMC certifié |

  - **Clic sur un palier = panneau de détail** : titre de la récompense + 2-3 lignes expliquant **concrètement ce que ça débloque et à quoi ça sert**. (Aujourd'hui rien ne se passe au clic.)

### 2.6 Profil + Avatar (`profil.js`, `profile-card.js`, `avatar-modal.js`, `avatar-picker.js`)
- **Deux systèmes d'avatar coexistent** (incohérence vue par Rayan) :
  - `AVATAR_PRESETS` = avatars SVG « orange », **certains payants en gemmes** → cosmétique monétisé = **antipattern vision V3**.
  - `avatar-picker.js` = 6 avatars **PNG réalistes** (humains) + « Ma photo ».
- **Cible :** unifier sur **un seul système** = les avatars réalistes (PNG) + upload photo. **Supprimer les avatars-skins payants en gemmes** (hors-vision côté moniteur). Le header et la carte profil utilisent le même rendu.
- **Bug cadrage :** l'avatar choisi est **mal recadré** dans le cercle de la carte profil → corriger le CSS (`object-fit: cover; width/height: 100%`) sur l'`<img>` de l'avatar.

---

## 3. Systèmes transversaux

- **Labels de statut :** centralisés dans `utils/statut-label.js` ✅ (round 1). Vérifier qu'aucun statut brut (`a_valider`, codes `C2a`) ne traîne encore à l'affichage.
- **Terminologie :** trancher **Moniteur vs Enseignant** et l'appliquer **partout** (nav, titres, parcours, profil).
- **Avatars :** un seul système (cf. §2.6).

---

## 4. Découpage en chantiers (ordre conseillé)

| # | Chantier | Type | Branche | Risque |
|---|----------|------|---------|--------|
| 1 | Round 1 refonte visuelle (skins, parcours sobre, labels, hero accueil) | Visuel | `feat/refonte-enseignant` | ✅ fait, en preview |
| 2 | Round 2 visuel : seuils paliers tuto + titres pros cohérents + détail récompense au clic + renommage unlocks | Visuel | `feat/refonte-enseignant` (suite) | Faible |
| 3 | Avatars : unifier sur réalistes, retirer skins gemmes, fixer cadrage | Visuel + petite logique | branche dédiée `fix/avatars-moniteur` | Faible |
| 4 | Clarifier libellés « élèves accompagnés / actifs / attitrés » partout | Micro | avec round 2 | Faible |
| 5 | **Logique de validation** (moniteur = source de vérité, quiz optionnel non-bloquant) | Logique + DB | branche dédiée `feat/validation-moniteur` | **Élevé** — audit + spec + migration validée avant |

> On finit le visuel (2-3-4) avant d'attaquer le gros chantier logique (5).

---

## 5. Garde-fous pour les sessions codeuses

- Plan mode d'abord, montrer le plan, attendre OK avant de coder.
- Montrer les diffs. Tout `innerHTML` dynamique → `esc()`.
- **Ne jamais toucher** `src/pages/eleve/` dans un chantier moniteur.
- Aucune migration DB appliquée sans la montrer d'abord à Rayan.
- `npm run lint && npm run build` avant de conclure ; messages de commit `feat(moniteur): …` / `fix(moniteur): …` groupés.
- Rayan code via GitHub Desktop (pas de git en sandbox). Fournir les messages de commit exacts.
