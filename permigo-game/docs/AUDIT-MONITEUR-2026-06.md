# Audit front moniteur — 2026-06-11

Périmètre : tout ce que voit l'enseignant (`src/pages/enseignant/**` + chrome).
Angle demandé : **design, accessibilité, simplicité, moins de texte**.
Méthode : parcours réel au format mobile (390px, compte enseignant@test.fr),
capture de chaque page, lecture du code. Classé par impact.

Rappel ADN moniteur (CLAUDE.md) : pro, dense mais scannable, 1 tap = 1 action,
utilisable au volant garé. Le moniteur « aime les belles choses mais surtout
l'efficacité ».

---

## P0 — Bugs visibles / bloquants UX

### 1. Le FAB « + Séance » chevauche les CTA du bas
Sur **/validation**, le FAB vert recouvre le coin du bouton « Enregistrer la
séance » (le CTA le plus important de l'app moniteur). Même collision sur
les cartes du bas d'Analyses et la carte Ligue de l'accueil.
**Fix** : masquer le FAB quand un footer CTA est présent (`.vs-footer`),
et le remonter de `calc(footer + 12px)` sur les pages à contenu long.

### 2. Bilan : « 0 % » rouge alarmant quand AUCUN quiz n'a été fait
`bilan.js` affiche « 0 % SCORE MOYEN QUIZ (0/0 réussis) » en rouge vif pour
un élève qui n'a simplement jamais ouvert un quiz. Donnée vide ≠ échec —
et c'est un document montrable aux parents.
**Fix** : `0/0` → « — » neutre + « Pas encore de quiz » (Analyses le fait
déjà correctement avec son « — »).

### 3. « PERMIGO AUTOPILOT » sur le bilan
Le bilan imprimable porte l'ancien nom du produit en en-tête. Document
externe → c'est la marque qui fuit.
**Fix** : nom de l'auto-école (profiles/auto_ecoles), fallback « PermiGo ».

---

## P1 — Simplicité & moins de texte (le cœur de la demande)

### 4. Mes élèves : 5 micro-infos par ligne, badge « Actif » partout
Chaque ligne = nom + badge Actif + (parfois Prêt/date) + « X validations »
+ fraction + barre + ⋮. Le badge « Actif » est répété sur ~25 lignes : un
signal présent partout n'est plus un signal.
**Fix** : n'afficher QUE les badges d'exception (🔴 à relancer, ✅ prêt,
🎓 reçu). Ligne = avatar · nom · barre+fraction · ⋮. Le « X validations »
et la date partent dans la fiche.

### 5. Accueil : 3 actions rapides redondantes
« Valider une séance » existe en quick-action ET en FAB ET parfois en hero.
« Mes élèves » est déjà dans la nav du bas. Trois chemins pour la même
action = bruit.
**Fix** : garder UNE rangée de 2 (Inviter · Classement) ou supprimer la
rangée et laisser hero + FAB + nav faire le travail.

### 6. Sous-titres pédagogiques répétés à chaque visite
« Choisis l'élève, déroule un monde, coche ce qui est validé. » (validation),
le bandeau orange 2 lignes de mes-eleves, « Votre activité pédagogique · 60
derniers jours »… Un pro le lit une fois, ensuite c'est du texte mort.
**Fix** : pattern « coach-hint » : visible à la 1re visite (localStorage),
puis remplacé par rien / une icône ?.

### 7. Livret : le fil des moniteurs répète 20 cartes identiques
« Rayan Nabli — a validé : X · 11 juin » ×20 à la suite. Mur de texte.
**Fix** : grouper par jour/séance : « 11 juin — 8 compétences validées ✓ »
(dépliable), limite 5 groupes + « voir tout ».

### 8. Validation : légende verbeuse
« Appuie sur une compétence — chaque appui change l'état : acquis → en
cours → à retravailler. » → remplacer par 3 pastilles colorées inline
(●acquis ●en cours ●à retravailler), le geste s'auto-explique.

### 9. Accueil : KPI jargon
« 29/33 école » et « Actifs ces 7 jours (9/29) » demandent un décodage.
**Fix** : « 29 élèves » (le /33 école en tooltip/sous-texte), « 31 % actifs
cette semaine ».

---

## P2 — Design & cohérence

### 10. En-têtes incohérents entre pages
Accueil : pas de titre de page. Mes élèves : barre titre + 2 chips boutons.
Analyses : gros titre. Bilan : 2 boutons flottants. Validation : back + titre.
**Fix** : un seul pattern d'entête moniteur (back? · titre · 1 action max).

### 11. Bilan : noms de catégories ≠ livret
Bilan dit « Contrôle & Sécurité / Manœuvres / Circulation / Situations
complexes », le livret dit « Maîtrise du véhicule / Circulation normale /
Conditions difficiles / Conduite autonome ». Même référentiel, deux
vocabulaires → harmoniser sur les intitulés REMC du livret.

### 12. Analyses : carte « TAUX QUIZ — » vide
Une carte KPI qui affiche « — » en permanence (les élèves de ce moniteur
n'ont pas de quiz 30j) occupe 25 % du bloc. → état vide actionnable
(« Encourage les quiz : tes élèves n'en ont fait aucun ce mois ») ou
masquer la carte.

### 13. Hiérarchie de l'accueil
6 blocs empilés de même poids visuel (hero, KPI, actions, palier,
classements, activité). Le « hero action » est bien, mais le reste se vaut.
**Fix** : 2 niveaux visuels max — hero + KPI en haut, le reste en cartes
légères ; « Activité récente » limitée à 3 + « voir tout ».

---

## P3 — Accessibilité

La suite axe-core est verte sur login/validation/profil (critical+serious=0).
Reste :
- **⋮ menus** de mes-eleves : cible ~24px, pas d'aria-label parlant →
  44px + « Actions pour {élève} ».
- **Textes mono 10-11px gris** (dates, fractions) sous le seuil de confort —
  passer à 12px/`--ink3` (déjà fait côté élève, pas côté moniteur).
- **Tabs « Tous (32)… »** : vérifier hauteur 44px + `aria-selected`.
- Bandeau orange : icône seule porte le sens (⚠️) → garder le texte court
  mais réel pour les lecteurs d'écran.

---

## Ce qui est déjà bon (ne pas toucher)
- Page **validation** : dropdown élève + chips par monde = exactement le
  « 2 taps dans la voiture » du plan. Garder.
- **Parcours pro / ligue / classement élèves** : refondus cette semaine,
  cohérents.
- Dashboard accueil : hero « prochaine action » priorisé = bon réflexe.

## Ordre de réalisation proposé
1. P0.1 FAB (5 min) + P0.2 bilan 0% (10 min) + P0.3 Autopilot (10 min)
2. P1.4 mes-eleves allégé + P1.6 coach-hints + P1.8 légende pastilles
3. P1.7 fil groupé + P1.5 actions accueil + P1.9 KPI wording
4. P2 cohérence (entêtes, catégories bilan, carte quiz vide)
5. P3 finitions a11y
