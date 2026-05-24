# Sprint 1 — Rapport de fin de session autonome

_Date : 16 mai 2026_

---

## ✅ Ce qui marche

### 1. Notif-listener (bugfix critique)
- Logs verbeux ajoutés : `[notif-listener] starting`, `poll cycle`, `found N notifs`, `dispatching type=...`
- Confirmation que `user_id = profiles.id` (pas auth.users.id) → requête correcte
- Notif marquée **lue AVANT** le lancement du quiz → anti double-trigger
- Handler `consolidation_quiz` ajouté (manquait côté dispatch)

### 2. REMC / codes compétences
- `src/data/remc.js` confirmé correct : 31 sous-compétences, codes C1a–C4g
- `worlds.js` mis à jour : counts corrects (9/8/7/7 au lieu de 7/8/8/8)
- Référence `C01.1` nettoyée dans `quiz-engine.js` et `worlds.js`

### 3. Design — Dark mode forcé
- `<html data-theme="dark">` posé dans `index.html`
- `:root` overridé dans `base.css` avec les valeurs dark (#0a0d1a, etc.)
- `body { background: #0a0d1a; color: #fff }` hardcodé
- `h1, h2, h3, h4 { color: #fff }` global
- Toast : fond `#1e2235` + border glass → visible sur fond sombre

### 4. Pages complètes

| Page | Fichier | État |
|------|---------|------|
| Trophées élève | `src/pages/eleve/trophees.js` | ✅ complet |
| Profil (tous rôles) | `src/pages/common/profil.js` | ✅ complet |
| Dashboard gérant | `src/pages/gerant/pulse.js` | ✅ complet |

**Trophées** : 5 trophées Sprint 1 dans `src/data/trophees.js`, grille 3 cols mobile, bottom sheet détail, locked/unlocked states, check côté client sur données Supabase.

**Profil** : avatar SVG initiales, role badge, email/id, déconnexion (`logout()`), bouton suppression (alert placeholder conforme spec).

**Pulse gérant** : 4 KPI (élèves actifs 7j, compétences validées 7j, taux quiz, streak moyen), liste enseignants avec count validations, 5 derniers élèves. Lecture seule.

### 5. Onboarding premier login
- Composant `src/components/onboarding-modal.js` : 3 slides animés, bouton "Suivant / C'est parti !", bouton "Passer"
- Wired dans `accueil.js` : si `profiles.first_value_action_at IS NULL` → modal s'ouvre
- À la fin : `profiles.first_value_action_at = now()` → ne se réaffiche jamais

### 6. Animations & micro-interactions
- **Confetti** : déclenché dans `quiz-engine.js` quand `score === total` (quiz parfait) — utilise le composant `confetti.js` existant
- **Flamme streak** : `@keyframes flameBump` + `.anim-flame-bump` dans `animations.css`
- **World pulse** : `@keyframes worldPulse` + `.anim-world-pulse` dans `animations.css`

### 7. Robustesse
- **Offline/online** : listeners dans `main.js` → toast "Pas de connexion" / "Connexion rétablie"
- Toutes les nouvelles pages : try/catch autour des fetches Supabase, toast erreur visible
- Skeleton loaders dans trophees.js et pulse.js

### 8. Documentation
- `docs/consolidation-edge-function.md` : deploy command, cron SQL, test local, architecture

---

## ❌ Ce qui ne marche pas / bugs résiduels

1. **Quiz auto côté élève : non testé en live** — le fix notif-listener est logiquement correct mais il faut valider sur un vrai compte avec une vraie notif en DB. Faire le test : login enseignant → valider compétence → vérifier que `notifications` a une ligne → login élève → attendre 30s → voir le quiz.

2. **`profiles.first_value_action_at`** : le champ doit exister en DB. S'il n'existe pas → le build ne crash pas (Supabase ignore les colonnes manquantes dans select) mais l'onboarding s'affichera à chaque connexion. Vérifier via Supabase Dashboard → `profiles` table.

3. **`profiles.last_active_at`** utilisé dans `pulse.js` pour trier les élèves : si la colonne n'existe pas en DB, l'order sera ignoré. Vérifier.

4. **`validations.enseignant_id`** requis pour le KPI enseignants dans pulse.js. Si la colonne n'existe pas, le join retourne 0 partout. À vérifier sur le schéma.

5. **Streak flame et world pulse** sont définis en CSS mais pas encore déclenchés par JS (c'est de la classe CSS à ajouter/retirer). Il faut wirer `.classList.add('anim-flame-bump')` dans l'accueil.js quand le streak augmente — c'est du polish V2, pas critique.

6. **Pas de tests E2E** — le flow complet n'est pas automatisé. Test manuel obligatoire.

---

## 🧠 Décisions prises sans consultation

| Décision | Raison |
|----------|--------|
| Dark mode forcé via `data-theme="dark"` dans index.html | Plus propre que de modifier toutes les variables CSS. Réversible. |
| Trophées vérifiés côté client (pas de table `user_trophees`) | Évite une migration DB. Les conditions sont simples et deterministes. V2 pourra ajouter une table si besoin. |
| Onboarding dans profil modal (pas de route dédiée) | Plus simple, moins de navigation, spec le demandait comme modal |
| `docs/` au lieu de `src/server/` pour la doc consolidation | `src/server/` n'existe pas, `docs/` est plus approprié pour de la documentation |
| Pulse gérant : fallback `0` sur tous les KPI si DB vide | Évite les crashs sur auto-école sans données |
| Profil : `alert()` pour suppression de compte | Spec le demandait explicitement comme placeholder |

---

## 🚀 Prochaines priorités selon moi

1. **Tester le flow end-to-end en live** (validation enseignant → notif → quiz élève)
2. **Vérifier les colonnes DB** : `first_value_action_at`, `last_active_at`, `enseignant_id` dans validations
3. **Wirer les animations streak + world pulse** en JS (ajouter/retirer les classes CSS au bon moment)
4. **Navigation bottom bar** : la `nav-bottom` existante n'est pas encore branchée aux nouvelles pages (trophees, profil). À vérifier.
5. **120 questions REMC** : le seed actuel (`0002_seed_questions.sql`) a combien de questions ? Si < 30, les quiz vont échouer en silence.
6. **Dark mode test sur iPhone** : ouvrir sur Safari iOS, vérifier les safe areas et les noirs.
