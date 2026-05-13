# ROADMAP.md — PermiGo v7

> **Source de vérité unique** pour suivre l'avancement du SaaS.
> Mise à jour à chaque fin de slice. Lue par Claude au démarrage de chaque session.

---

## 🎯 Vision produit

PermiGo = **SaaS auto-école B2B2C** qui remplace les outils éparpillés (papier, Excel, SMS) par UNE app web moderne.

- **3 rôles** : Élève (mobile-first, ludique) · Moniteur (efficace, pro) · Gérant (vision globale, KPIs)
- **Critère commercial** : un gérant doit pouvoir tester en 5 min et avoir envie de payer.
- **Promesse** : "Le seul outil dont une auto-école a besoin."

---

## 🧭 Méthode de travail — Cycle pour CHAQUE slice

Inspiré de Spec Kit / BMAD / GSD (cf. `claude-code-best-practice`).

```
1. RESEARCH   → Lire ancien HTML v6 + repo best-practice + Supabase schema actuel
2. PLAN       → Écrire le scope dans ce fichier (✏️ commit avant code)
3. EXECUTE    → Coder backend (schema + API) PUIS frontend (pages)
4. REVIEW     → Tester sur les 3 comptes (élève / moniteur / gérant)
5. SHIP       → Update ce ROADMAP.md + commit Git + déploiement
```

**Règle d'or :** on ne passe JAMAIS à la slice N+1 avant d'avoir shippé la slice N.

---

## 🧱 Architecture en SLICES VERTICALES (pas par rôle)

Une "slice" = une feature complète de bout en bout, touchant tous les rôles concernés.

### Légende
- ✅ **Shipped** : codé, testé, déployé
- 🚧 **En cours** : on travaille dessus maintenant
- ⏳ **Planifié** : scopé, pas encore commencé
- 💡 **Idée** : à scoper

---

### SLICE 0 — Fondations (✅ Shipped)

> Le socle technique sans lequel rien ne tourne.

| Item | Fichier | Status |
|---|---|---|
| Scaffold Vite + Hono | `package.json`, `vite.config.js` | ✅ |
| DB schema 9 tables (Drizzle) | `src/db/schema.js` | ✅ |
| Auth Supabase (login + session restore + signout) | `src/auth/*` | ✅ |
| Utils XSS-safe (`esc`) + format date FR | `src/utils/*` | ✅ |
| Toast component | `src/components/toast.js` | ✅ |
| Référentiel REMC officiel (31 sous-comp / 4 catégories) | `src/data/remc.js` | ✅ |
| Routing simple par rôle | `src/main.js` | ✅ |

**Dette identifiée :** pas de hash router, pas de tests, pas de dark mode, backend Hono inutilisé.
→ À traiter dans SLICE 8 (Polish).

---

### SLICE 1 — Login & Onboarding (✅ Shipped — design premium 12 mai)

> Le tout premier contact. Doit être impeccable visuellement.

| Item | Rôle | Status |
|---|---|---|
| Page login design premium (Gooey Text Morphing + glassmorphism + gradient animé) | tous | ✅ |
| Restauration session au reload | tous | ✅ |
| Toggle visibility mot de passe (👁️) | tous | ✅ |
| 3 boutons "Démo Élève / Moniteur / Gérant" (pré-remplit email + password) | tous | ✅ |
| Lien "Inscrire mon auto-école" (placeholder vers slice 7) | tous | ✅ |
| Page inscription publique (auto-école découvre l'outil) | non-auth | ⏳ slice 7 |
| Page de profil utilisateur (avatar, nom, mot de passe) | tous | ⏳ slice 1.1 |

**Notes design login :**
- Effet Gooey Text Morphing en vanilla JS (adapté du composant React partagé) — SVG `feColorMatrix` + filter threshold + blur transitions
- Mots morphés : PermiGo → Conduis → Apprends → Progresse → Réussis
- Background : gradient animé (3 radial-gradients qui flottent en boucle 18s) + grille subtile avec mask
- Card glassmorphism (backdrop-filter blur 24px + saturate 180% + bordure semi-transparente)
- CTA en gradient violet/indigo avec shadow accentuée

---

### SLICE 2 — REMC (Parcours élève + Évaluation moniteur) — ✅ SHIPPED (12 mai 2026)

> **LA feature centrale du produit.** Sans elle, pas de produit.
>
> Le REMC (Référentiel Éducatif du Métier de la Conduite) est l'outil pédagogique officiel
> qui découpe l'apprentissage en 4 catégories × 31 sous-compétences.

| Item | Rôle | Status | Fichier |
|---|---|---|---|
| Affichage parcours (route SVG sinueuse + bottom sheet) | élève | ✅ | `src/pages/eleve/parcours.js` |
| Livret REMC — moniteur valide les sous-compétences | moniteur | ✅ | `src/pages/moniteur/livret-remc.js` |
| Sync : validation moniteur → progression élève (table `remc_entries` partagée) | tous | ✅ | — |
| Vue ludique trophées (1 trophée par catégorie REMC validée) | élève | ⏳ slice 2.1 | `src/pages/eleve/trophees.js` |

**Done :** un moniteur valide une sous-comp → l'élève voit immédiatement sur son dashboard (KPI %), son parcours (node vert), et la note du moniteur dans la fiche compétence. **Testé bout-en-bout le 12 mai.**

**Notes slice 2 :**
- `livret-remc.js` : UX accordéon par catégorie + bottom sheet d'évaluation 3 niveaux (Acquis / En cours / À retravailler) + note 280 char
- Branché depuis bouton "📝 Évaluer" de `fiche-eleve.js`
- Upsert sur `remc_entries` avec `onConflict: 'eleve_id,comp_id'` — l'index unique existait déjà côté Supabase
- Mapping `lv` : `v`=Acquis, `p`=En cours, `r`=À retravailler — cohérent avec `parcours.js`

**Migrations Supabase appliquées pendant la slice :**
1. `allow_moniteurs_to_list_profiles` — policy `profiles_select` étendue aux moniteurs (sans ça, "Mes Élèves" vide)
2. `remc_entries_add_moniteur_note_validated_at` — ajout des colonnes `moniteur_id`, `note`, `validated_at` (manquaient en prod alors qu'elles étaient dans le schema Drizzle)

**Reste pour slice 2.1 (optionnel, plus tard) :**
- Page Trophées élève (vue ludique 4 catégories débloquées)
- Realtime Supabase pour sync instantané sans reload (actuellement il faut recharger)
- Désactiver le sélecteur de niveau pour permettre "Non évalué" (toggle off du choix actuel)

---

### SLICE 3 — Leçons (Planning moniteur + Réservation élève) — ✅ SHIPPED (12 mai 2026, 3a + 3b)

> Cœur opérationnel : planifier, réserver, donner, noter une leçon.

| Item | Rôle | Status | Fichier |
|---|---|---|---|
| Planning moniteur (vue semaine 7×16, 6h-22h, navigation semaines) | moniteur | ✅ slice 3a | `src/pages/moniteur/planning.js` |
| Création créneau (Dispo / Leçon / Perso / Absence) via modal | moniteur | ✅ slice 3a | (modal interne planning) |
| Confirmer réservation en attente → conf | moniteur | ✅ slice 3a | (modal détails event) |
| Soft delete d'un créneau | moniteur | ✅ slice 3a | (modal détails event) |
| Liste créneaux dispos sur 14 jours à venir (groupé par jour, filtres moniteur) | élève | ✅ slice 3b | `src/pages/eleve/reservation.js` |
| Réserver un créneau (UPDATE event dispo → pend + assign eleve_id) | élève | ✅ slice 3b | (modal reservation) |
| Notification au moniteur d'une nouvelle réservation | tous | ✅ slice 3b | (table notifications) |
| Historique leçons passées (élève) | élève | ⏳ slice 3c (plus tard) | `src/pages/eleve/historique.js` |
| Mes Élèves (liste moniteur) — bouton Planning ajouté | moniteur | ✅ | `src/pages/moniteur/mes-eleves.js` |
| Fiche élève moniteur (KPIs + leçons + notes privées) | moniteur | ✅ | `src/pages/moniteur/fiche-eleve.js` |

**Done slice 3a (testé bout-en-bout 12 mai) :** moniteur crée un créneau Dispo OU une leçon avec élève → toast confirmation + grid mise à jour → élève voit la leçon sur son dashboard (KPIs + Prochaine leçon + Prochains cours).

**Notes slice 3a :**
- `planning.js` : grid 8 col × 17 lignes (heure + 7 jours, header + 16 heures 6h-22h). Events absolute-positionnés selon `h` (minutes) et `dur` (hauteur). Couleurs : vert=conf, orange=pend, bleu=dispo, gris=perso, rouge=absence.
- Navigation : boutons `<` / `Aujourd'hui` / `>` (deltas de 7 jours sur `_weekRef`).
- Modal créateur : 4 types (toggle), select élève apparaît si "Leçon", time + dur (1-3h) + lieu.
- Modal détails : affiche infos + bouton "Confirmer" pour les `pend` + bouton "Supprimer" (soft delete `is_deleted=true`).
- Insert respecte la policy legacy : `mon_nom` = nom du moniteur connecté (sinon RLS bloque).

**Migration Supabase :**
- `events_add_date_event` — ajout colonne `date_event` (date) + 2 index. Les events legacy (mockés sur la semaine type avec `d` 1-7) restent en DB mais n'apparaissent plus dans le planning (date_event NULL).

**Notes slice 3b (testé bout-en-bout 12 mai) :**
- `reservation.js` : liste cards groupées par jour, chips filtre moniteur, modal confirmation, UPDATE event `dispo` → `pend` + `eleve_id` + `n`
- Garde-fou : `.eq('id', ev.id).eq('t', 'dispo')` — l'update échoue silencieusement si le créneau a déjà été pris (race condition)
- Insert notification dans la même action (best effort, log si erreur)
- Branché depuis bouton "📅 RÉSERVER" de `accueil.js` (élève)

**Migrations Supabase :**
- `events_allow_eleve_to_book_dispo` — policy `events_update` étend les droits élève (peut update un dispo + ses propres réservations)
- `events_allow_eleve_to_view_dispos_and_own` — policy `events_select` étend les droits élève (voit les dispos de tous + ses propres leçons) et moniteur (voit tous les events de l'auto-école)

**Cycle complet validé :**
1. Moniteur ouvre une dispo (planning 3a)
2. Élève voit la dispo dans Réservation
3. Élève réserve → créneau `pend` + notif moniteur
4. Moniteur voit le créneau en orange dans son planning
5. Moniteur confirme → créneau `conf`
6. Élève voit "Confirmée" sur son dashboard + +2h conduites

---

### SLICE 4 — Évaluation post-leçon — ✅ SHIPPED (12 mai 2026)

> Après chaque leçon : feedback moniteur + auto-éval élève.

| Item | Rôle | Status |
|---|---|---|
| Formulaire d'éval post-leçon (étoiles 1-5 + commentaire + chips REMC) | moniteur | ✅ |
| Lecture du feedback sur dashboard (carte "Dernier feedback") | élève | ✅ |
| Cascade : sous-comp cochées → auto-marquées "Acquis" dans `remc_entries` | tous | ✅ |
| Notification élève à chaque nouvelle éval | tous | ✅ |
| Auto-évaluation élève (avant que le moniteur évalue) | élève | ⏳ slice 4.1 |
| **Évaluation moniteur anonyme par l'élève (obligatoire fin de leçon)** | élève → moniteur | ✅ slice 4.5 |
| Page "Mes Avis" moniteur (note moy + distribution + liste anonyme) | moniteur | ✅ slice 4.5 |
| Badge assiduité par moniteur dans Dashboard gérant | gérant | ✅ slice 4.5 |
| Historique des évals par leçon (page dédiée) | élève | ⏳ slice 4.2 |
| Stats : sous-compétences les plus travaillées | tous | ⏳ slice 4.2 |

**Done (testé bout-en-bout 12 mai) :** moniteur ouvre une leçon `conf` dans son planning → bouton "📝 Évaluer" → form complet → enregistre. L'élève voit instantanément le feedback étoilé sur son dashboard + son KPI Compétences saute (3% → 13% avec 3 sous-comp cochées).

**Notes slice 4 :**
- `planning.js` enrichi : la modal détails d'une leçon `conf` ouvre `openReviewModal`. Toutes les 31 sous-comp REMC sont en chips multi-select groupées par catégorie.
- Upsert sur `lesson_reviews` (unique sur `event_id`) + upsert multi-row sur `remc_entries` pour les sous-comp cochées (passe en `lv='v'`)
- `accueil.js` élève : carte "📝 Dernier feedback" entre Prochains cours et Progression. Affiche étoiles + commentaire + chips compétences.
- Notif insérée dans `notifications` pour chaque éval (visible quand on aura le centre de notifs en slice 5)

**Migration Supabase :**
- `create_lesson_reviews_table` — nouvelle table avec FK `event_id` + `eleve_id` + `moniteur_id`, contrainte unique sur `event_id`, RLS (élève voit ses reviews, moniteur ses propres, admin tout)

**Slice 4.5 — Évaluation moniteur ANONYME par l'élève (12 mai 2026) :**
- Table `notations` (déjà en DB) utilisée avec colonnes `note` (int 1-5) + `comment` (text)
- Élève côté `accueil.js` : fetch les leçons passées non-notées → ouvre une **modal obligatoire** au login (pas de bouton Annuler, click outside désactivé, bouton Envoyer disabled tant que note non choisie). 5 étoiles cliquables + commentaire optionnel + bandeau "🔒 Ton avis est anonyme".
- Moniteur : nouvelle page `src/pages/moniteur/avis.js` avec hero (note moyenne grosse + distribution barres par étoile) + liste avis SANS nom d'élève + bandeau de rappel anonymat. Branchée depuis bouton "⭐ Avis" dans Mes Élèves.
- Gérant : `dashboard.js` enrichi, badge "⭐ X.X · N" (note moy + nb avis) à côté du nom de chaque moniteur dans la section Équipe. Pas de détail individuel des avis côté gérant — juste l'agrégat (assiduité).
- Anonymat : `eleve_id` reste stocké en DB (pour empêcher doublons + permettre future modification par l'élève), mais l'UI moniteur ne sélectionne JAMAIS ce champ depuis le SELECT. Anonymat applicatif, pas cryptographique.

---

### SLICE 5 — Notifications — ✅ SHIPPED (12 mai 2026)

> Le ciment qui rend l'app vivante.

| Item | Rôle | Status |
|---|---|---|
| Centre de notifications (cloche + badge + panel dropdown) | tous | ✅ |
| Indicateur visuel non-lu (point bleu + dégradé) | tous | ✅ |
| Click notif → mark `read=true` | tous | ✅ |
| Bouton "Tout marquer comme lu" | tous | ✅ |
| Notification "votre élève a réservé" | moniteur | ✅ (déjà inséré en slice 3b) |
| Notification "votre moniteur a évalué votre leçon" | élève | ✅ (déjà inséré en slice 4) |
| Notification "votre réservation a été confirmée" | élève | ⏳ slice 5.1 |
| Notification "leçon dans 1h" (cron job) | tous | ⏳ slice 5.2 |
| Realtime Supabase au lieu de polling | tous | ⏳ slice 8 (polish) |

**Done (testé bout-en-bout 12 mai) :**
- Latifa voit 🔔 avec badge "1" en haut → click → panel s'ouvre → notif "Nouvelle évaluation de leçon" affichée
- Click sur la notif → badge disparaît + indicateur bleu retiré + header passe à "0 non lue / 1"
- Rayan voit 🔔 avec badge "1" → notif "Nouvelle réservation de Latifa Sahli"

**Notes slice 5 :**
- Composant réutilisable `src/components/notif-bell.js` exporté en `mountNotifBell(container)`
- Intégré dans 3 pages : `accueil.js` (élève), `mes-eleves.js` + `planning.js` (moniteur)
- Panel dropdown ancré sur la cloche (right:0, max-height 480px, scroll si > 10 notifs)
- Affichage temps relatif (`à l'instant` / `il y a 12 min` / `il y a 3h` / `il y a 2j`)
- Click outside ferme le panel
- Polling au montage seulement (pas de realtime — slice 8)

---

### SLICE 6 — Gérant : Tableau de bord — ✅ SHIPPED (version MVP, 12 mai 2026)

> Le rôle qui PAIE l'abonnement. Doit donner envie d'acheter.

| Item | Rôle | Status |
|---|---|---|
| 4 KPIs (CA estimé du mois, élèves actifs, leçons semaine, réservations en attente) | admin | ✅ |
| Section équipe (cards moniteurs avec heures leçons/dispos + nb élèves de la semaine) | admin | ✅ |
| Activité récente (feed mixte évals + réservations en attente, 6 dernières) | admin | ✅ |
| Cloche notifs admin + déconnexion | admin | ✅ |
| Vue offre/demande détaillée (graphique) | admin | ⏳ slice 6.1 |
| Calendrier global (tous les events de l'auto-école) | admin | ⏳ slice 6.2 |
| Gestion équipe CRUD (ajouter/modifier/désactiver moniteurs) | admin | ⏳ slice 6.3 |
| Gestion élèves CRUD (inscrire/désinscrire/changer de moniteur) | admin | ⏳ slice 6.4 |
| Export comptable (CSV des leçons par moniteur) | admin | ⏳ slice 6.5 |

**Done (testé 12 mai) :** login admin (`rayannabli27@gmail.com`) → dashboard direct avec tous les KPIs calculés sur les vraies données accumulées des slices précédentes (3a, 3b, 4). CA = 200€ (4h × 50€/h tarif par défaut).

**Notes slice 6 :**
- `src/pages/admin/dashboard.js` (~260 lignes) — vue d'ensemble en un seul écran scroll
- Brut : pas de menu, pas d'onglets — un seul scroll vertical avec KPIs, équipe, activité
- Le tarif `PRIX_LECON_H = 50` est en constante en haut du fichier (à brancher sur une table `reglages` plus tard en slice 6.1)
- `main.js` modifié : route admin → dashboard.js (avant : placeholder HTML statique)
- Calculs côté client (les volumes sont petits — 6 profils, ~20 events). Pour scale, basculer sur RPC Supabase (slice 8)
- Activité récente = merge `lesson_reviews` (10 dernières) + `events.t='pend'` triés par date desc, top 6

---

### SLICE 7 — Marketing & Conversion — ✅ SHIPPED (landing v1, 12 mai 2026)

> La couche qui convertit un visiteur en client.

| Item | Status |
|---|---|
| Landing publique (PulseBeams + features + 3 étapes + tarifs + CTA final) | ✅ |
| Routing : non-auth → landing par défaut (avant : login direct) | ✅ |
| Lien "Se connecter" depuis la nav → ouvre la page login | ✅ |
| Hub central PermiGo + 3 nodes (Élève/Moniteur/Gérant) reliés par beams animés | ✅ |
| Form d'inscription auto-école (lead → onboarding admin) | ⏳ slice 7.1 |
| Démo cliquable sans compte (élève fictif) | ⏳ slice 7.2 |
| SEO basique (meta tags, sitemap, schema.org) | ⏳ slice 7.3 |
| Témoignages clients / cas d'usage | ⏳ slice 7.4 |

**Notes slice 7 :**
- `src/pages/public/landing.js` (~430 lignes) — page complète, scroll vertical unique
- **PulseBeams adapté en vanilla** : SVG paths + `stroke-dasharray`/`stroke-dashoffset` animés en CSS (au lieu de framer-motion). 3 beams avec délais en cascade (0s, .6s, 1.2s, 1.8s)
- Filtre SVG `feGaussianBlur` + `feMerge` pour l'effet glow sur les beams
- Hub central avec animation pulse + anneau qui se diffuse en boucle (3.5s)
- Nodes positionnés en absolute aux mêmes coords que les endpoints SVG
- Tarif unique : 49€/mois par moniteur, essai 14 jours
- Tous les boutons "Inscrire" affichent un toast placeholder (à brancher sur un form en slice 7.1)
- `main.js` modifié : non-auth → landing (au lieu de login direct)
- **Section "Écosystème connecté" ajoutée (12 mai soir)** : second PulseBeams fidèle au demo Aceternity UI — 5 beams en L (orthogonal) + bouton "Démarrer" central rond avec hover glow radial. Animation des gradients via SMIL `<animate>` natif SVG (x1/x2/y1/y2 sur les linearGradient). 10 connection points circulaires aux endpoints. Texte du bouton en gradient gris animé.

---

### SLICE 8 — Polish & Production — 🚧 EN COURS

> La dette technique à régler avant de scale.

| Item | Status |
|---|---|
| Hash router (reload ne casse plus la nav) | ✅ slice 8a (12 mai) |
| Bottom navigation mobile (visible <920px) | ✅ slice 8b (12 mai) |
| Authorization sur les routes (rôle requis) | ✅ slice 8c (12 mai) |
| Redirect `/` → route nommée selon rôle | ✅ slice 8c |
| Bouton ⏻ Logout dédié (au lieu de back arrow) | ✅ slice 8c |
| Filtre events legacy dans KPI heures élève | ✅ slice 8c |
| Page Profil (commune) — édition nom/tel/dob/NEPH + change password | ✅ slice 8d |
| Page Trophées élève (4 catégories, médailles, shimmer) | ✅ slice 8d |
| Auto-évaluation élève post-leçon (table `lesson_self_evals`) | ✅ slice 8d |
| Vue moniteur de l'auto-éval (dans modal détail leçon) | ✅ slice 8d |
| Animations premium (stagger, blur-in, hover-lift, ring-rotate, pulse) | ✅ slice 8e |
| **Cosmos background** : starfield canvas 2D 3-layer parallax | ✅ slice 8e |
| Scroll progress vertical right-side | ✅ slice 8e |
| Bottom nav micro-animations (scale on tap, pill on active) | ✅ slice 8e |
| Reveal-on-scroll (IntersectionObserver + blur-in + stagger) | ✅ slice 8f |
| Progressive blur (overlay flou en bas des images/cards) | ✅ slice 8f |
| Update badge "NOUVEAU · ✨ ..." sur hero landing | ✅ slice 8f |
| **Cinématique map d'apprentissage** (starfield + texture grain + node pop stagger + rings glow) | ✅ slice 8g |
| **Refonte map parcours** : 1 seule route continue à 4 mondes (style Duolingo premium) | ✅ slice 8h |
| Portails de transition entre mondes (arches gothiques + bridges) | ✅ slice 8h |
| Système XP / Niveau / Trophées dans le header sticky | ✅ slice 8h |
| **Décors SVG illustrés** par monde (campagne, ville, montagne, futur) | ✅ slice 8i |
| Route asphalte premium (4 couches : ombre, bordure, surface, marquage jaune) | ✅ slice 8i |
| Nodes 72px avec halo blanc intégrés au décor | ✅ slice 8i |
| Sky gradients + texture grain + ground sombre par monde | ✅ slice 8i |
| **Rocket loader** plein écran (boot + transitions) avec véhicule jaune + flame + longfazers + nuages | ✅ slice 8j |
| **Service planning métier** centralisé (R1 chevauchement, R3 véhicule, R4 buffer, R5 limite 8h, R10 n° heure) | ✅ slice 9a |
| Workflow annulation avec motifs enum + niveau préavis (libre/tardive/jour_j) + garder dispo | ✅ slice 9a |
| Doc `PLANNING_SPEC.md` (règles + workflows + exemples) | ✅ slice 9a |
| Confirmation `pend → conf` via service `confirmLecon()` | ✅ slice 9b |
| Badge "📝 LIVRET" sur leçons passées non remplies + bandeau modal + bouton "Marquer fait" via `markLivretFilled()` | ✅ slice 9b |
| Affichage "N° heure de l'élève" dans le modal détails (R10) | ✅ slice 9b |
| Dark mode | ⏳ |
| Tests unitaires (Vitest) + e2e (Playwright) | ⏳ |
| Backend Hono utilisé (au lieu d'appels Supabase directs) | ⏳ |
| Déploiement Vercel/Netlify + domaine custom | ⏳ |
| Suppression de l'ancien GitHub Pages v6 | ⏳ |
| Accessibilité WCAG AA (focus visible, ARIA, contraste) | ⏳ |
| Performance (Lighthouse > 90 mobile) | ⏳ |

---

## 📦 Conventions de code (rappel)

Voir `CLAUDE.md` section "Pattern obligatoire". TL;DR :
- `mount(root, ...args)` exporté
- `esc()` partout sur les data user
- CSS scoped via `<style>` inline
- `class="anim-slide-up"` sur le container racine

---

## 🗂️ Fichiers de référence à consulter

| Fichier | Quand le lire |
|---|---|
| `CLAUDE.md` | À chaque session (auto-chargé) |
| `ROADMAP.md` (ce fichier) | À chaque session, pour savoir où on en est |
| `ARCHITECTURE.md` | Avant de toucher au schema DB ou au routing |
| `_archive/old-project-v6/autopilot-v6.10.html` | Avant chaque slice, pour comprendre le besoin fonctionnel |
| `_archive/handoff-claude-design/moniteur-v4/index.html` | Pour récupérer les mockups visuels validés |
| https://github.com/shanraisshan/claude-code-best-practice | Avant toute tâche complexe |

---

## 📍 État actuel — où on en est

**Date** : 12 mai 2026
**Dernière slice shippée** : SLICE 7 — Landing publique avec PulseBeams ✅
**Slices shippées dans la session** : 1 (redesign), 2, 3a, 3b, 4, 5, 6, 7 (**8 features livrées en une session — produit complet de la landing à l'admin**)
**Slice suivante recommandée** :
- SLICE 7.1 (form d'inscription auto-école pour brancher les CTAs landing → onboarding)
- OU SLICE 8 (Polish prod : déploiement Vercel/Netlify, hash router, tests, custom domain)
- OU enrichissement SLICE 6 (CRUD équipe gérant, calendrier global, export CSV)

---

## 🔁 Comment cette roadmap est mise à jour

À la fin de chaque slice :
1. Marquer les items en ✅
2. Ajouter un encart "Notes de slice N" en bas (bugs trouvés, décisions, captures)
3. Commit Git avec message `feat(slice-N): <nom> shipped`
4. Annoncer dans le chat ce qui est passé en prod
