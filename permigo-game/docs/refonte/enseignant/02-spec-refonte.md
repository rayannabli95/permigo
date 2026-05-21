# 02 — Spec refonte UX/UI · Côté enseignant · PermiGo

> Date : 2026-05-21. Référence audit : `01-audit-statique.md`. Cible : moniteur d'auto-école 30-50 ans, usage mobile entre deux leçons, vouvoiement systématique.
>
> Doctrine design : Ornikar Enseignants (vouvoiement pro), Doctolib Pro (cards d'agenda denses), Notion/Linear (hiérarchie de profondeur, empty states, prosumer propre), Strava Local Legend (ranking glissant 90j, hyperlocal), Material 3 Expressive + Apple HIG (FAB, bottom bar 5 tabs max). **Aucune gamification clinquante. Aucune microcopy infantilisante.**

## Design system enseignant

| Token | Valeur | Note |
|---|---|---|
| Couleur primaire | violet Permigo désaturé `#6366F1` (vs néon élève) | nausée du néon évitée |
| Accent paliers hauts | or `#D4AF37` | réservé Or / Couronne |
| Texte principal | `#1E2030` | |
| Texte secondaire | `#475569` | remplace les gris #94a3b8 trop pâles |
| Surface / carte | `#FFFFFF` sur fond `#F6F7FB` | |
| Bordure | `#E2E6F2` | |
| h1 | 24 / 700 | plus dense que côté élève |
| body | 15 / 400 / 1.5 | (vs élève 16) ; police Inter / SF Pro |
| label uppercase | 11 / 600 / `.08em` | couleur `#475569` min |
| Touch target | ≥ 44 × 44 pt (48 dp idéal) | impératif |
| Élévation | 3 niveaux M3 (section / item / detail) | hiérarchie de profondeur |
| Animations | fade 150 ms, scale 0.98→1 sur tap | + garde `prefers-reduced-motion` toujours |
| Rayon | 12 px cartes, 16 px conteneurs | |

Hiérarchie de cartes (corrige la « hiérarchie plate ») : **hero** (ombre portée 8px, bordure accent), **item** (ombre 2px), **detail** (plat, bordure 1px). Le poids visuel suit l'importance d'action.

---

## ZOOM 1 — `log-session.js` (refonte prioritaire)

### AVANT
- 31 sous-compétences à plat (lignes 269-291), groupées C1-C4 mais toutes visibles → scroll ~4 écrans.
- Pas de recherche, pas de multi-select, pas de progress global.
- Commentaire routé sur `p_notes` au lieu de `p_comment` (invisible élève).
- Erreur SQL brute affichée (overload RPC).
- « Visible par l'élève » en gris #94a3b8 illisible (ligne 297).
- Chips 34 px (sous 44 px).

### APRÈS

**Structure verticale (mobile-first) :**

1. **Bandeau visibilité** (remplace ligne 297) — pleine largeur, fond `#EEF0FF`, texte `#475569` (AA), icône œil + libellé : « Visible par l'élève et l'auto-école ». Position sticky sous le titre. Contraste vérifié ≥ 4.5:1.

2. **Progress bar globale** — sticky en tête : `Validées aujourd'hui · 12/31` + barre 6 px remplie à 39 %. Couleur primaire. `aria-valuenow/min/max`.

3. **Recherche live** — `<input type="search">` 44 px, placeholder « Rechercher une compétence… ». Filtre l'array `_allComps` en JS sur `nom` + `code` (insensible casse/accents via `.normalize('NFD')`). Re-render des accordions filtrés. Bouton clear.

4. **Accordions C1-C4** — un panneau repliable par compétence :
   - En-tête 56 px : `C1 — Maîtriser le maniement` + compteur `3/9 validées` + chevron `aria-expanded`.
   - Bouton secondaire dans l'en-tête : **« Valider tout C1 »** (visible si l'élève maîtrise toute la compétence ; coche les sous-comp non acquises d'un coup, confirmation légère).
   - Corps : sous-compétences en lignes 48 px min, checkbox tap target 48×48 dp, libellé + code REMC. Acquis = désactivé + check vert.
   - Un seul accordion ouvert par défaut (le premier non complété) ; les autres repliés → fin du scroll de 4 écrans.

5. **Multi-select** — chaque sous-comp cochable ; barre d'action collante en bas : `N sélectionnée(s)` + bouton « Enregistrer la séance ».

6. **Commentaire fonctionnel** — `<textarea>` 500 caractères, label « Commentaire pour l'élève (optionnel) », compteur `0/500`, persisté via `p_comment` (visible côté élève). Auto-save : debounce 5 s + sur `blur`. Indicateur « Enregistré » discret.

7. **Auto-save séance** — brouillon local (`sessionStorage`) toutes les 5 s pour ne rien perdre si interruption (réalité terrain).

8. **Gestion d'erreur** — appel `log_session_v2` (signature unique). En cas d'échec : toast générique vouvoyé « Enregistrement impossible pour le moment. Nous réessayons. » + retry auto, **jamais** `error.message` brut. Détail technique en `console.error` seulement.

**Composants impactés** : nouveau `accordion-comp.js` (réutilisable validation.js), `progress-bar.js`, refonte du bloc commentaire, mapping `RPC_ERRORS` étendu.

**Microcopy (vouvoiement)** : « Pourquoi validez-vous ces compétences ? (optionnel) » · « Que souhaitez-vous faire ? »

---

## ZOOM 2 — `parcours.js` enseignant (parcours de carrière moniteur)

### AVANT
- Chargement ~5 min (fetch validations sans limite, ligne 566).
- 10 paliers + 9 skins affichés en timeline, **skins non équipables** → concept incompris.
- Pas d'ancrage local, pas de partage.

### APRÈS — inspiration Strava Local Legend + LinkedIn badges + Uber Pro

**A. Performance (voir patches #P4 / DB-002)** : RPC agrégée paginée + index `validations(validated_by)` + cache local 5 min. Cible : < 1,5 s.

**B. Les 10 paliers — critères explicites.** Chaque palier affiche son **critère de validation** (fini le « pourquoi je suis bloqué ? »). Barème démotivation-proof (Hamari : pas d'humiliation, aspirations claires) :

| # | Palier | Critère explicite |
|---|---|---|
| 1 | Premier kilomètre | 10 séances enregistrées |
| 2 | Volant souple | 40 séances + 5 élèves suivis |
| 3 | Phares allumés | 70 séances |
| 4 | Boîte fluide | 100 séances enregistrées |
| 5 | Carte ouverte | 130 séances + 10 élèves actifs |
| 6 | Compas calé | 180 séances |
| 7 | Tableau pro | 230 séances + 70 % de réussite au 1er passage (réf. moyenne nationale 58,2 %) |
| 8 | Maître artisan | 280 séances + 5 élèves référents satisfaits |
| 9 | Couronne discrète | 330 séances + 75 % de réussite (réf. conduite accompagnée 75 %) |
| 10 | Cercle Or | 380 séances + maintien 90 j du taux de réussite |

> Sources de référence affichées en note : taux de réussite 1er passage moyenne nationale **58,2 %**, conduite accompagnée **75 %** (Bilan annuel 2024 des examens du permis, Sécurité Routière).

**C. Skins équipables.** Ajout d'un mécanisme d'équipement : bouton « Équiper » sous chaque skin débloqué → persistance `profiles.skin_active` (voir patches DB + #P-skin). Le skin équipé apparaît :
- sur la **fiche pro publique** du moniteur (avatar + médaillon) ;
- en **carte partageable** LinkedIn (1200×627) et story Instagram (1080×1920) — « Permigo Certified Moniteur — Niveau Or », générée côté client. Visuels : voir `04-prompts-gpt-images.md`.

**D. Ranking hyperlocal (Strava Local Legend).**
- Segment **local** : « Top 3 du département 75 » (pas « Top 100 France ») → pertinence + pas d'écrasement.
- Fenêtre **glissante 90 jours** → pas de « moniteur de l'année » figé ; tout le monde peut remonter.
- Métrique pro mise en avant : **taux de réussite 1er passage de vos élèves** vs moyenne nationale 58,2 %.
- Badges qualitatifs (Uber Pro / Airbnb Superhost) : Excellent / Très bien / En progression — **jamais** de classement humiliant des derniers.
- **Privé par défaut**, partage opt-in (case à cocher explicite).
- Aspiration claire : « 5 séances réussies de plus pour atteindre Cercle Or. »

**E. Distinction visuelle paliers vs skins.** Deux types de jalons dans la timeline, différenciés (paliers = bornes carrière ; skins = récompenses cosmétiques) → lève la confusion « 10 vs 19 ».

---

## ZOOM 3 — `aujourdhui.js` (fin des « 4 zéros »)

### AVANT
Hero = 4 cards KPI souvent à 0 ; activité récente avec horaires en désordre apparent.

### APRÈS — hiérarchie (Doctolib Pro : agenda dense, hiérarchie nette)

1. **Salutation contextuelle** (remplace le mur de zéros) : « Bonjour Karim · jeudi 21 mai · 3 leçons » (vouvoiement dans le corps). Pas de « Prêt à enseigner ? ».

2. **Carte hero — prochain élève** (élévation max) : nom, heure, lieu, dernier point de progression, **sous-compétences à travailler aujourd'hui**. CTA direct « Ouvrir le livret » + « Enregistrer la séance ».

3. **Leçons du jour** (cards item, ordre chronologique correct — fix tri) : liste daté/horodaté lisible.

4. **Activité récente** (corrige Bug #1) : chaque ligne montre un libellé daté relatif — « Aujourd'hui 11:17 », « Hier 23:40 » — au lieu de l'heure seule. Regroupement par jour avec en-têtes si > 1 jour.

5. **Stats du jour** (cards detail, plates, en bas) : seulement après le contenu actionnable. Quand 0, libellé neutre (« Aucun pour l'instant ») plutôt qu'un « 0 » nu. Pas de mur de zéros en hero.

**Microcopy** : « par vos élèves », « cliquez pour voir », « Enregistrez votre première séance pour voir l'activité ici. »

---

## `mes-eleves.js`

**AVANT** : badge « ATTITRÉ » opaque (ligne 608) ; empty state tutoyé.

**APRÈS** :
- Badge renommé/explicité : « Référent » + tooltip au tap « Élève dont vous êtes le moniteur référent (assigné par le gérant) ». Légende en tête de liste : icône + « Référent = vous êtes le moniteur principal ».
- Tri conservé (référents en haut), mais section visuelle « Mes élèves référents » / « Autres élèves de l'école » pour clarifier.
- Empty state vouvoyé : « Votre gérant doit vous attribuer des élèves dans la console. » + CTA secondaire.
- Menu contextuel : items `min-height: 44px`.

---

## `validation.js`

**AVANT** : liste plate de `comp-row` (pas d'accordion réel) ; boutons « à valider » inertes non expliqués ; tutoiement (377).

**APRÈS** :
- Réutilise le composant **accordion C1-C4** du ZOOM 1 (compteur par compétence, `aria-expanded`).
- Lignes « à valider » : badge explicite « En attente du quiz élève » + curseur `not-allowed` documenté visuellement (icône horloge). L'inertie devient lisible, plus perçue comme un bug.
- Vouvoiement : « Vous débloquez la compétence — l'élève la valide en réussissant son quiz. »
- Touch targets ≥ 44 px sur toutes les lignes/boutons.

---

## `insights.js` & `bilan.js`

- Tabs `min-height: 44px` + `aria-selected` synchronisé (Bugs #24, #27).
- Recommandations vouvoyées, registre pro (Bug #25) : « Lancez votre semaine », « Vos élèves progressent bien. » — supprimer « streak », « champion », ton coach.
- Contraste : sous-titres/labels gris → `#475569`/`#334155` (Bug #26).
- Transition `.bl-bar` : ajouter garde `prefers-reduced-motion`.
- Conserver `role="img"` + `aria-label` sur les graphiques (déjà conforme).

---

## `livret-remc.js`

- Modal : ajouter garde `prefers-reduced-motion` (CSS lignes 219-240 + JS `closeSheet` 762) — Bug #28.
- Focus trap complet (Tab/Shift+Tab bouclés) + handler `Escape` — Bug #29.
- Chevron `#cbd5e1` → `#64748b`.

---

## Header & navigation (transverse)

### Header (`header-top.js`)
**AVANT** : logo « PermiGo » → accueil uniquement ; aucun menu compte.
**APRÈS** : **avatar utilisateur** cliquable (initiales/photo) à droite → menu déroulant :
- Profil (fiche pro + skin équipé)
- Auto-école (infos établissement)
- Déconnexion
Menu = `role="menu"`, items 44 px, fermeture Échap + clic extérieur, focus trap. Logo reste à gauche (retour accueil).

### Bottom nav (`nav-bottom.js`) + FAB
- **5 tabs max** (Apple HIG) : Aujourd'hui · Élèves · **+ Séance (FAB central)** · Validation · Parcours.
- **Un seul FAB** : le bouton central intégré à la nav (M3 Expressive, shape morphing au tap). **Supprimer** le FAB flottant `log-session-fab.js` OU, si conservé temporairement, le repositionner `bottom: calc(nav + 16px)` avec `z-index: 320 > 300`. Recommandation : FAB central nav.
- Bottom bar courte (M3 Expressive). Animations sobres + garde reduced-motion.

---

## Récap couverture critères de succès

| Critère brief | Traité |
|---|---|
| log-session : accordion + search + multi-select + progress + commentaire + auto-save + 48 dp | ZOOM 1 |
| parcours : 10 paliers + critères + skins équipables/shareables + local 90j | ZOOM 2 |
| aujourdhui : hero prochain élève, tri horaires, stats reléguées | ZOOM 3 |
| FAB n'overlap plus | Header & nav |
| Header → menu compte | Header & nav |
| Vouvoiement 100% | toutes sections |
| Touch ≥ 44 px | design system + chaque page |
| reduced-motion partout | design system + livret/bilan |
| Ranking démotivation-proof | ZOOM 2-D |
