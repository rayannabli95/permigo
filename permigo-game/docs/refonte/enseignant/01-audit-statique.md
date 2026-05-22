# 01 — Audit statique · Côté enseignant · PermiGo

> **Source unique de vérité.** Date : 2026-05-21. Périmètre : 10 pages enseignant + 2 composants de log de séance + header/nav transverses.
>
> Méthode : lecture intégrale des fichiers + Grep de vérification. **Chaque `file:line` cité a été vérifié dans le code actuel** (`permigo-game/src/`). Aucune ligne inventée. Les "faux bugs" remontés en analyse (ex. interpolation de nombres présentée à tort comme XSS) sont écartés et signalés comme tels.

## Légende sévérité

- 🔴 **critique** — bloque l'usage, expose une info technique, ou casse une donnée
- 🟠 **majeur** — UX cassée, accessibilité non conforme, info métier illisible
- 🟡 **mineur** — cosmétique, dette technique, conformité limite

## Tableau de bord

| Sévérité | Count |
|---|---|
| 🔴 critique | 7 |
| 🟠 majeur | 13 |
| 🟡 mineur | 9 |
| **Total** | **29** |

Périmètre fichiers (lignes réelles) : `aujourdhui.js` 751 · `mes-eleves.js` 838 · `log-session.js` 1167 · `log-session-modal.js` 751 · `log-session-fab.js` 143 · `validation.js` 518 · `parcours.js` 859 · `parcours-pro.js` 632 · `parcours-pro-complet.js` 388 · `bilan.js` 452 · `insights.js` 930 · `livret-remc.js` 830 · `header-top.js` 87 · `nav-bottom.js` 213.

---

## `src/pages/enseignant/aujourdhui.js` (751 lignes)

### 🟠 Bug #1 — Horaires de l'activité récente affichés dans le désordre apparent

- **Render** : ligne 730 — `<span class="aj-act-time">${formatHeure(val.validated_at)}</span>`
- **`formatHeure`** : lignes 362-365 — `return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });` → rend **HH:MM uniquement, sans date**.
- **Fetch** : lignes 451-456 — les 5 dernières validations sont récupérées **tous jours confondus** : `.from('validations').eq('validated_by', _me.id).order('validated_at', { ascending: false }).limit(5)`.
- **Cause racine** : la liste EST triée correctement par timestamp décroissant, mais comme l'affichage ne montre que l'heure (pas le jour), une validation d'hier à `23:40` apparaît sous une validation d'aujourd'hui à `08:53`. L'œil lit `11:17 · 08:53 · 08:53 · 23:40` et conclut à un tri cassé. C'est un **bug d'affichage**, pas un bug de tri.
- **Impact** : 100 % des moniteurs avec >1 jour d'activité. Perte de confiance dans les données.
- **Sévérité** : 🟠 majeur.
- **Fix** : afficher un libellé relatif daté (`Aujourd'hui 11:17`, `Hier 23:40`) ou regrouper par jour avec en-têtes de section. Voir spec §aujourdhui.

### 🟠 Bug #2 — « 4 fois 0 » : quatre cards KPI à zéro en hero au chargement

- **Lignes 595-635** : quatre `.aj-widget` en grille — `acquisAujourdhui` (596), `nbElevesActifs` (604), `consolidCount` (611), `inactifCount` (627).
- **Cause racine** : ces 4 compteurs sont positionnés en haut de page (hero). Un matin sans activité encore enregistrée → `0 · 0 · 0 · 0`. Aucune hiérarchie : la première chose vue est un mur de zéros.
- **Impact** : effet démoralisant quotidien, surtout en début de journée (le moment exact où le moniteur ouvre l'app).
- **Sévérité** : 🟠 majeur.
- **Fix** : reléguer les stats en bas, mettre en hero la salutation + le prochain élève. Voir spec §aujourdhui (ZOOM 3).

### 🔴 Bug #3 — Tutoiement résiduel (cible pro → vouvoiement obligatoire)

- **Ligne 563** : `… confirmée${…} par tes élèves`
- **Ligne 641** : `Sans activité 14j+ — clique pour voir`
- **Ligne 652** : `Enregistre ta première séance<br>pour voir l'activité ici.`
- **Cause racine** : microcopy non revue pour la cible pro 30-50 ans.
- **Impact** : rupture de crédibilité B2B (réf. Ornikar Enseignants = vouvoiement systématique).
- **Sévérité** : 🔴 critique (cohérence brand non-négociable côté pro).
- **Fix** : « par vos élèves » / « cliquez pour voir » / « Enregistrez votre première séance ».

> **Faux positif écarté** : l'analyse initiale a signalé la ligne 563 comme « XSS critique ». Les valeurs interpolées (`todaySessions.length`, `confirmedCount`) sont des **nombres** issus de `.length` — non injectables. Aucune faille XSS ici. Le seul problème réel de cette ligne est le tutoiement (Bug #3).

---

## `src/pages/enseignant/mes-eleves.js` (838 lignes)

### 🟠 Bug #4 — Badge « ATTITRÉ » jamais expliqué

- **Render** : ligne 608 — `${eleve.isMine ? \`<span … >attitré</span>\` : ''}`
- **Logique** : ligne 377 — `isMine: e.enseignant_id === _me.id` ; tri ligne 412 — `if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;` (attitrés en haut).
- **Cause racine** : le badge marque les élèves dont `enseignant_id` = le moniteur courant, mais aucun tooltip, légende ou libellé n'explique la distinction avec un élève simplement partagé/suivi.
- **Impact** : le moniteur ne sait pas pourquoi certains élèves sont marqués → confusion sur la responsabilité pédagogique (qui suit qui dans une école multi-moniteurs).
- **Sévérité** : 🟠 majeur (logique métier opaque).
- **Fix** : tooltip + légende explicite (« Élève dont vous êtes le moniteur référent »). Voir spec §mes-eleves.

### 🔴 Bug #5 — Tutoiement dans l'empty state (× 2)

- **Lignes 554 et 827** (identiques) : `body: 'Ton gérant doit t\'attribuer des élèves dans la console.'`
- **Cause racine** : copie dupliquée non vouvoyée.
- **Impact** : empty state = premier contact d'un nouveau moniteur. Mauvaise première impression.
- **Sévérité** : 🔴 critique.
- **Fix** : « Votre gérant doit vous attribuer des élèves dans la console. »

### 🟡 Bug #6 — Boutons du menu contextuel sous le seuil tactile

- **Menu** `.me-qm-item` créé dynamiquement, `padding: 12px 14px` → hauteur ~36-40 px.
- **Cause racine** : padding insuffisant, pas de `min-height`.
- **Impact** : actions « Valider une compétence » / « Ouvrir le livret » difficiles à viser sur mobile.
- **Sévérité** : 🟡 mineur (menu secondaire).
- **Fix** : `min-height: 44px`.

---

## `src/pages/enseignant/log-session.js` (1167 lignes)

### 🔴 Bug #7 — Erreur SQL Postgres exposée en clair (overload RPC `log_session`)

- **Call-site** : lignes 630-636 —
  ```js
  const { data, error } = await sb.rpc('log_session', {
    p_eleve_id: _eleve, p_duration_minutes: _duration,
    p_session_date: _date, p_notes: noteVal,
    ...(compIds ? { p_competence_ids: compIds } : {}),
  });
  ```
- **Gestion d'erreur** : lignes ~650-656 — `friendlyMsg = RPC_ERRORS[rawMsg] ?? RPC_ERRORS[rawCode] ?? rawMsg ?? "…"; toast(friendlyMsg, 'error');` → **si aucun mapping, le message Postgres brut est affiché**.
- **Cause racine** : la fonction `log_session` a **deux signatures** en prod (overload), confirmées dans `supabase/migrations/0007_rpc_recovery.sql` :
  - Signature A (≈ ligne 2087) : `log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date, p_notes text)`
  - Signature B (≈ ligne 2151) : `log_session(p_eleve_id uuid, p_duration_minutes integer, p_session_date date, p_notes text, p_competence_ids text[], p_comment text)`
  Quand l'appel nommé est ambigu, Postgres renvoie : `Could not choose the best candidate function between: public.log_session(...)`. Aucune clé de `RPC_ERRORS` ne l'attrape → toast brut.
- **Impact** : message technique incompréhensible affiché à l'utilisateur ; fuite des signatures internes ; séance non enregistrée.
- **Sévérité** : 🔴 critique.
- **Fix code** : appeler une signature **unique** `log_session_v2` + filet `catch` générique sans `error.message` brut. **Fix DB** : migration drop de la surcharge. Voir patches §DB-001 + #P1.

### 🟠 Bug #8 — Les 31 sous-compétences affichées à plat, sans accordion ni recherche

- **Render** : lignes 269-291 (initial) + 525-542 (re-render). Structure : `Object.entries(byMonde).sort(...).map(...)` produit des `.ls-monde-group` (C1-C4) avec leurs `.ls-comp-chip`, **toutes visibles simultanément** ; `.ls-monde-group` n'a qu'un `margin-bottom: 12px` (≈ ligne 977), aucun mécanisme collapse/expand.
- **Cause racine** : pas d'accordion par compétence, pas de champ de recherche, pas de multi-sélection « valider tout C1 ».
- **Impact** : scroll de ~4 écrans pour cocher une case. UX impraticable dans la réalité terrain (5 min entre deux élèves).
- **Sévérité** : 🟠 majeur (entrave l'usage principal du produit).
- **Fix** : accordion C1-C4 + compteur par compétence + recherche live + multi-select. Voir spec §log-session (ZOOM 1).

### 🟠 Bug #9 — Le commentaire ne suit pas la bonne colonne (incohérence p_notes / p_comment)

- **Ligne 630-636** : `log-session.js` envoie `p_notes: noteVal` mais **jamais** `p_comment`.
- **Comparaison** : `log-session-modal.js` lignes 682-689 envoie **les deux** (`p_notes` ET `p_comment`).
- **Côté SQL** (signature B) : `v_final_notes := COALESCE(p_comment, p_notes, NULL);` → `p_comment` est prioritaire et porte la visibilité côté élève.
- **Cause racine** : le commentaire saisi dans `log-session.js` part dans `p_notes` (note interne) au lieu de `p_comment` (commentaire visible élève). Le brief le décrit comme « checkbox décorative qui ne fait rien » — en réalité il **persiste mais dans le mauvais canal**, donc invisible là où l'élève l'attend.
- **Impact** : commentaire pédagogique perdu pour l'élève.
- **Sévérité** : 🟠 majeur (donnée mal routée).
- **Fix** : champ commentaire 500 car. → `p_comment` explicitement, persistance + visibilité élève. Voir spec §log-session.

### 🔴 Bug #10 — Info critique « Visible par l'élève et l'auto-école » en gris pâle

- **Ligne 297** : `<div class="ls-visibility-tag">${icon('eye', { … color: '#94a3b8' })} Visible par l'élève et l'auto-école</div>`
- **Cause racine** : couleur `#94a3b8` (gris pâle) sur fond clair → contraste ≈ 2.8:1, **échec WCAG 2.2 AA** (4.5:1 requis pour texte normal). Information de confidentialité critique rendue quasi invisible.
- **Impact** : le moniteur ne réalise pas que ses commentaires/validations sont vus par l'élève ET le patron. Enjeu de confiance et de RGPD perçu.
- **Sévérité** : 🔴 critique (info de visibilité = critique, et illisible).
- **Fix** : remonter en bandeau lisible, contraste AA, icône cadenas/œil explicite. Voir spec §log-session.

### 🟠 Bug #11 — Aucun indicateur de progression global

- **Lignes 264-291** : un compteur de sélection existe (« X sélectionnée(s) »), mais **aucun** indicateur « 12/31 sous-comp ce jour » ni barre de progression globale.
- **Cause racine** : absence de composant progress.
- **Impact** : le moniteur ne sait jamais où il en est dans le référentiel.
- **Sévérité** : 🟠 majeur.
- **Fix** : progress bar « X/31 » en tête de page. Voir spec §log-session.

### 🟡 Bug #12 — Touch target des chips compétence sous 44 px

- **`.ls-comp-chip`** ≈ lignes 986-998 : `padding: 7px 11px; min-height: 34px;` → **34 px < 44 px**.
- **Impact** : cibles de clic trop petites entre deux leçons / sur tablette.
- **Sévérité** : 🟡 mineur.
- **Fix** : `min-height: 44px`, espacement vertical ≥ 8 px.

### 🟡 Bug #13 — Tutoiement résiduel (placeholders + modal)

- `log-session-modal.js:546` et `:628` : placeholder `'Pourquoi tu valides ces compétences ? (optionnel)'`
- `log-session.js:711` : `Que veux-tu faire ?`
- **Sévérité** : 🟡 mineur.
- **Fix** : « Pourquoi validez-vous ces compétences ? » / « Que souhaitez-vous faire ? »

---

## `src/components/log-session-modal.js` (751 lignes)

### 🟠 Bug #14 — Double appel commentaire ambigu côté RPC

- **Lignes 682-689** : envoie `p_notes` **et** `p_comment` simultanément, plus `p_competence_ids` conditionnel → c'est précisément la combinaison de paramètres qui déclenche l'ambiguïté de surcharge côté Postgres (Bug #7).
- **Gestion d'erreur** : lignes ~691-692 — `toast(ERROR_MSG[error.message] || error.message || '…', 'error')` → expose aussi `error.message` brut.
- **Sévérité** : 🟠 majeur (co-responsable du Bug #7).
- **Fix** : aligner sur `log_session_v2` à signature unique. Voir patches.

---

## `src/components/log-session-fab.js` (143 lignes) + `src/components/nav-bottom.js` (213 lignes)

### 🔴 Bug #15 — FAB « + Séance » en conflit avec la bottom nav (z-index + double FAB)

- **FAB flottant** `#log-session-fab` : ligne 30 `position: fixed`, ligne 32 `bottom: calc(86px + env(safe-area-inset-bottom, 0px))`, ligne 33 `z-index: 250`, lignes 35-36 `56×56`.
- **Bottom nav** `nav-bottom.js` : ligne 48 `z-index: 300`. Et la nav contient **déjà** un FAB central intégré : tab `__fab__` (ligne 27), markup `.bn-fab-wrap` / `.bn-fab-btn` (lignes 95-150).
- **Cause racine** : (1) il existe **deux** boutons « Séance » — le FAB flottant ET le bouton central de nav ; (2) le FAB flottant (`z-index:250`) passe **sous** la nav (`z-index:300`) et son `bottom:86px` le place dans la zone de chevauchement de la nav.
- **Impact** : FAB partiellement occulté / doublonné, surtout sur iPhone à encoche (`safe-area-inset-bottom`).
- **Sévérité** : 🔴 critique (action principale gênée + redondance).
- **Fix** : choisir **un seul** pattern. Recommandé : FAB central intégré à la nav (M3 Expressive), suppression du FAB flottant OU repositionnement `bottom: nav+16px` avec `z-index > 300`. Voir patches #P3.

### 🟡 Bug #16 — `aj-log-prompt` : animation sans garde `prefers-reduced-motion`

- `aujourdhui.js` lignes 327-348 : `.aj-log-prompt { animation: ajWidgetIn … }` sans `@media (prefers-reduced-motion: reduce)` (alors que `.aj-widget` lignes 85-87 l'a).
- **Sévérité** : 🟡 mineur.
- **Fix** : ajouter la garde.

---

## `src/pages/enseignant/validation.js` (518 lignes)

### 🟠 Bug #17 — Pas de vrai accordion : liste plate de `comp-row` à états

- **Lignes 109-129** : `.comp-row` avec états `comp-done`, `comp-sel`, `comp-next`, `comp-locked`, `comp-a-valider`. **Aucun** `aria-expanded`, aucun collapse/expand par compétence. Le « toggle » (ligne 289, `clickedSame = _selectedComp?.c === compId`) ne fait que sélectionner/désélectionner une ligne, pas ouvrir un accordion.
- **Cause racine** : le brief décrit des « accordions cassés » — en réalité **il n'y a pas d'accordion** ; la liste des 31 compétences est plate, ce qui produit la même friction de scroll que `log-session.js`.
- **Impact** : navigation longue, pas de regroupement C1-C4 lisible.
- **Sévérité** : 🟠 majeur.
- **Fix** : accordions réels C1-C4 avec `aria-expanded`. Voir spec §validation.

### 🟡 Bug #18 — Boutons « À valider » non cliquables (comportement intentionnel mais non signifié)

- **Lignes 127-128** : `.comp-row.comp-a-valider { … cursor: not-allowed; … }` — les compétences en attente du quiz élève sont volontairement non re-cliquables.
- **Cause racine** : le comportement est **correct** (on ne re-valide pas une compétence en attente côté élève), mais **rien n'explique** à l'utilisateur pourquoi la ligne est inerte → perçu comme « bouton cassé ».
- **Impact** : confusion ; le moniteur croit à un bug.
- **Sévérité** : 🟡 mineur (UX d'explication, pas de logique).
- **Fix** : badge « En attente du quiz élève » + curseur explicite. Voir spec §validation.

### 🟡 Bug #19 — Tutoiement

- **Ligne 377** : `<p class="vp-sub">Tu débloques la compétence — l'élève la valide en réussissant son quiz.</p>`
- **Fix** : « Vous débloquez la compétence — … ».

---

## `src/pages/enseignant/parcours.js` (859 lignes)

### 🔴 Bug #20 — Chargement ~5 min : fetch des validations sans limite ni pagination

- **Lignes 566-569** :
  ```js
  sb.from('validations')
    .select('id, eleve_id, statut, validated_at')
    .eq('validated_by', _me.id)
    .order('validated_at', { ascending: false }),
  ```
- **Cause racine** : **aucun `.limit()`** → récupération de **toutes** les validations du moniteur (potentiellement plusieurs centaines), puis agrégation JS en mémoire (`byEleve[v.eleve_id]`, calcul `topEleves` lignes ~609-621). Pas de cache : chaque montée de page refait la requête complète. Suspect d'absence d'index sur `validations(validated_by, validated_at)`.
- **Impact** : temps de chargement catastrophique signalé (~5 min) pour les moniteurs actifs.
- **Sévérité** : 🔴 critique.
- **Fix** : RPC paginée/agrégée côté serveur + index `validated_by` + cache local 5 min. Voir patches #P4 + DB-002.

> Le fetch des profils élèves (lignes 625-629, `.in('id', ids)`) est **correct** (batch, pas de N+1). À ne pas confondre avec le problème ci-dessus.

### 🟠 Bug #21 — Skins de paliers non équipables

- **Définition** : 10 paliers + 9 skins nommés (voir `moniteur-levels.js`, et rendu `parcours.js` ligne ~827 `.epc-stop-reward`). Noms confirmés : Premier kilomètre, Volant souple, Phares allumés, Boîte fluide, Carte ouverte, Compas calé, Tableau pro, Maître artisan, Couronne discrète, (+ Cercle Or au sommet).
- **Cause racine** : **aucune fonction `equipSkin()`**, aucun endpoint d'équipement, aucune persistance `profiles.skin_active`. Les skins sont affichés dans la timeline mais **purement décoratifs** : on ne peut pas les porter sur sa fiche/avatar.
- **Impact** : le moniteur ne comprend pas l'utilité du système → tout le concept de parcours (pourtant excellent) tombe à plat.
- **Sévérité** : 🟠 majeur.
- **Fix** : skin équipable + visible sur fiche pro publique + carte shareable. Voir spec §parcours (ZOOM 2).

### 🟡 Bug #22 — `onerror` HTML inline sur les images de skin

- **Lignes 796 et 828** (et `parcours-pro-complet.js:334, 359`) : `<img … onerror="this.style.display='none'">`.
- **Cause racine** : gestion d'erreur d'image en attribut inline (hygiène). Pas de faille (pas de donnée user), mais à migrer vers `addEventListener('error', …)`.
- **Sévérité** : 🟡 mineur.

> **Précision vs brief** : le brief évoque « 10 paliers selon doc, 19 selon UI ». Vérifié : il y a bien **10 paliers** (tiers) **+ 9 skins** intercalés = 19 jalons affichés dans la timeline. Ce n'est **pas** une incohérence de données, c'est la somme tiers+skins. À clarifier visuellement (deux types de jalons distincts).

### 🟡 Bug #23 — « Voir tous les paliers » : navigation OK, pas de casse confirmée

- `parcours-pro.js` lignes 573-574 (bouton `#pcp-see-all`) + 628-631 (handler → `navigate('#/parcours-complet')`). Handler propre, pas de duplication.
- **Cause racine** : la « casse de layout après clic » signalée par le brief **n'a pas été reproduite dans le code statique** : la cible `parcours-pro-complet.js` (388 l.) rend une timeline complète sans erreur évidente. Le défaut perçu vient probablement du **temps de chargement** (Bug #20) qui rend la transition douloureuse, pas d'un bug de layout pur.
- **Sévérité** : 🟡 mineur (à confirmer en runtime ; suspecter le perf Bug #20).

---

## `src/pages/enseignant/insights.js` (930 lignes)

### 🟠 Bug #24 — Tabs sous le seuil tactile

- **Lignes 239-250** : `.ins-tab { … min-height: 36px; }` → **36 px < 44 px** (WCAG 2.2 SC 2.5.8).
- **Sévérité** : 🟠 majeur.
- **Fix** : `min-height: 44px`.

### 🟠 Bug #25 — Tutoiement infantilisant dans les recommandations

- **Lignes 590-593** : `ttl: 'Lance ta semaine'` / `txt: 'Valide 1 compétence … pour relancer ton streak pro.'`
- **Ligne ~619** : `ttl: 'Tout roule'` / `txt: 'Tes élèves progressent bien. Continue sur cette lancée !'`
- **Cause racine** : ton injonctif tutoyé, registre « coach Duolingo » inadapté à la cible pro.
- **Impact** : perçu comme infantilisant (cf. interdiction brief).
- **Sévérité** : 🟠 majeur.
- **Fix** : « Lancez votre semaine », « Validez 1 compétence … pour relancer votre série pro », « Vos élèves progressent bien. »

### 🟡 Bug #26 — Contraste des sous-titres / labels gris

- `insights.js` lignes 117-121 `.ins-widget-sub { … color: var(--mu); }` (≈ #94a3b8, 11 px) → échec AA pour texte normal.
- `bilan.js` ligne 106 `.bl-kpi-label { color: #64748b; … }` (11 px) → limite AA.
- **Sévérité** : 🟡 mineur.
- **Fix** : foncer (`#475569`/`#334155`) ou grossir/bolder.

### 🟡 Bug #27 — Tabs sans `aria-selected`

- **Lignes 767-775** : `role="tablist"` + `role="tab"` présents, mais pas d'`aria-selected="true|false"`.
- **Sévérité** : 🟡 mineur.
- **Fix** : ajouter `aria-selected` synchronisé avec l'état actif.

---

## `src/pages/enseignant/livret-remc.js` (830 lignes)

### 🔴 Bug #28 — Modal (bottom sheet) animée sans garde `prefers-reduced-motion`

- **Lignes 219-240** : `.lr-overlay { animation: lr-overlay-in .2s ease; }` et `.lr-sheet { animation: lr-sheet-in .28s … forwards; transform: translateY(100%); }` — **aucun** `@media (prefers-reduced-motion: reduce)`.
- **Ligne ~762** : `closeSheet()` applique `overlay.style.animation = 'lr-overlay-in .18s ease reverse'` en JS, sans tester `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- **Cause racine** : animations d'entrée/sortie de modal non désactivables → échec WCAG 2.2 SC 2.3.3.
- **Impact** : utilisateurs sensibles au mouvement (vestibulaire, migraines).
- **Sévérité** : 🔴 critique (a11y, modal = élément central).
- **Fix** : garde CSS + garde JS. Voir patches #P6.

### 🟠 Bug #29 — Focus trap incomplet + pas de touche Échap sur la modal

- **Ligne ~748** : `requestAnimationFrame(() => ta.focus())` — focus initial OK, mais **pas de piège de focus** (Tab/Shift+Tab peuvent sortir de la modal).
- **Lignes ~719-722** : fermeture par clic backdrop + bouton, mais **pas de handler `Escape`**.
- **Cause racine** : gestion clavier de modal partielle (`role="dialog"` + `aria-modal="true"` sont bien présents, lignes ~679-681).
- **Impact** : utilisateurs clavier/lecteur d'écran ; conformité focus management.
- **Sévérité** : 🟠 majeur.
- **Fix** : focus trap + `Escape`. Voir spec §a11y.

### 🟡 Bug — Chevron de compétence quasi invisible

- **Ligne ~205** : `.lr-comp-chev { color: #cbd5e1; … }` → contraste ≈ 3:1, sous le seuil d'éléments graphiques utiles.
- **Sévérité** : 🟡 mineur.
- **Fix** : `#64748b`.

---

## Transverses — synthèse

### 🔴 Bug #30 — Header sans menu compte (déconnexion / switch école introuvables)

- **`header-top.js` lignes 71-72** : `<button class="pg-logo-btn" id="ht-logo" aria-label="Accueil PermiGo"><span class="pg-logo-txt sm">PermiGo</span></button>` ; handler ligne 83 → retour accueil **uniquement**.
- **Cause racine** : le brief décrit un dropdown « PermiGo ⌄ » à l'utilité floue. Vérifié : **il n'y a pas de dropdown** dans `header-top.js`. C'est un simple logo→accueil. Le vrai problème est l'**absence totale** de menu compte : aucun accès à Profil, Auto-école, ni Déconnexion depuis le header.
- **Impact** : le moniteur ne peut ni se déconnecter ni changer d'auto-école depuis l'UI principale.
- **Sévérité** : 🔴 critique (fonction manquante).
- **Fix** : avatar utilisateur cliquable → menu (Profil / Auto-école / Déconnexion). Voir spec §header.

### Bilan accessibilité transverse (récap)

- Touch targets < 44 px : `ls-comp-chip` (34 px), `ins-tab` (36 px), `me-qm-item` (~38 px).
- `prefers-reduced-motion` manquant : `livret-remc.js` modal (219-240, 762), `aujourdhui.js` `aj-log-prompt` (327-348), `bilan.js` `.bl-bar` transition (≈ 211).
- Contraste AA : `ls-visibility-tag` #94a3b8 (critique, Bug #10), `ins-widget-sub`, `bl-kpi-label`, `lr-comp-chev`.
- Modals : `livret-remc` focus trap + Échap manquants (Bug #29).

### Points conformes (à préserver)

- Échappement `esc()` systématique sur les données injectées en `innerHTML` (vérifié sur `bilan.js`, `insights.js`, `livret-remc.js`, `log-session.js`, `mes-eleves.js`) — **aucune XSS réelle détectée**.
- `role="dialog"` + `aria-modal="true"` présents sur la modal `livret-remc`.
- FAB flottant : garde `prefers-reduced-motion` présente (`log-session-fab.js` lignes 76-77).
- Fetch « activité récente » et « validations du jour » correctement triés côté serveur (`order(...)`).

---

## Index des correctifs prioritaires (→ `03-patches.md`)

| # patch | Bug(s) | Sévérité | Fichier(s) |
|---|---|---|---|
| DB-001 | #7, #9, #14 | 🔴 | `0007_rpc_recovery.sql` → migration `log_session_v2` |
| #P1 | #7, #9 | 🔴 | `log-session.js:630` |
| #P2 | #14 | 🟠 | `log-session-modal.js:682` |
| #P3 | #15 | 🔴 | `log-session-fab.js:32-33` + `nav-bottom.js` |
| #P4 + DB-002 | #20 | 🔴 | `parcours.js:566` + index/RPC |
| #P5 | #10 | 🔴 | `log-session.js:297` |
| #P6 | #28 | 🔴 | `livret-remc.js:219-240,762` |
| #P7 | #30 | 🔴 | `header-top.js:71` |
| #P8 | #3,#5,#13,#19,#25 | 🔴/🟠 | tutoiement multi-fichiers |
| #P9 | #1 | 🟠 | `aujourdhui.js:730,362` |
