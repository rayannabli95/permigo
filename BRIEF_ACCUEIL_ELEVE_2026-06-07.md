# Brief — Refonte Accueil élève (suggestions doc + captures)

Source : Google Doc « Front_Acceuil_suggestions » + 13 captures. Croisé avec le code le 2026-06-07.
Tous les chemins sont relatifs à `permigo-game/`.

**Fil rouge (Gestalt)** : supprimer la redondance visuelle (doublons), grouper par l'espace, traiter les états terminaux (100 %). Moins de signaux dupliqués = lecture plus fluide.

---

## Groupe 1 — Quick wins CSS (sûrs, confirmés par capture)

### C1 — Marge superflue sur le « X compétences restantes »
- **Constat** : `margin-left: 4px` en trop sur la `span` (confirmé sur ta capture devtools).
- **Fichier** : `src/pages/eleve/accueil.js` L.335 — `.acc2-ms-reward-remaining span`.
- **Action** : retirer `margin-left: 4px;`.
- **Risque** : nul.

### C2 — Marges du module « Retours de tes moniteurs »
- **Constat** : module collé aux bords, pas d'air autour.
- **Fichier** : `src/components/eleve/feedback-feed.js` L.31 — `.ff-section { margin-bottom: 20px; }`.
- **Action** : `margin: 40px 16px 0;` (16px côtés, 0 bas, 40px haut — ta proposition).
- **Note** : le 40px top crée la séparation avec le bloc précédent (proximité). Vérifier que ça ne double pas une marge déjà posée par le bloc au-dessus.

---

## Groupe 2 — Doublons à supprimer (Gestalt)

### C3 — Cloche dans le Hero = doublon de celle du header
- **Constat** : 2 cloches à l'écran. Le header est visible partout, le Hero seulement en haut → garder celle du header.
- **Fichier** : `src/pages/eleve/accueil.js` — bouton `acc2-hero-notif-btn` (L.1010-1012), son CSS (L.106-118), et le wiring `#notif-btn` (dans `wire()`).
- **Action** : supprimer le bouton + son CSS + son listener. Le `flex:1` de `.acc2-hero-hi` réabsorbe l'espace.
- **Risque** : faible (vérifier qu'aucun autre code ne cible `#notif-btn`).

### C4 — Doublon de bouton « Profil »
- **Constat** : 3 accès profil pour l'élève :
  1. avatar dans le Hero — `accueil.js` L.1008 (décoratif, non cliquable)
  2. avatar dans le header — `header-top.js` L.90, clique vers `#/profil`
  3. onglet « Profil » bottom-nav — `nav-bottom.js` L.28, vers `#/profil`
  → **(2) et (3) = vrai doublon fonctionnel.**
- **Reco** : retirer l'avatar du **header** (`ht-avatar` L.90 + handler L.101-103 + CSS `.ht-avatar-btn` L.54-67 + listener cosmetics L.107-116). Header = logo + cloche, plus épuré et « aligné ». L'avatar reste visible dans le Hero, le profil reste accessible via l'onglet.
- **Risque** : faible. Bien retirer aussi le listener `pg:cosmetics-changed` devenu inutile.

---

## Groupe 3 — Labels de la bottom-nav (décision, pas quick win)

### C5 — Supprimer les labels sous les pictogrammes
- **Constat** : nav = Accueil / Parcours / Boutique / Trophées / Profil, picto + label.
- **Fichier** : `src/components/nav-bottom.js` — `<span class="bn-label">` L.168, CSS `.bn-label` L.93.
- **⚠️ Trade-off honnête** : les boutons ont déjà `aria-label` (a11y OK). MAIS visuellement, « Boutique » et « Trophées » ne sont pas évidents au picto seul (loi de familiarité : les libellés aident la reconnaissance). Retirer les 5 labels = gain d'épure, perte de clarté pour l'utilisateur occasionnel.
- **Reco** : plutôt que tout supprimer, option « label de l'onglet actif uniquement » (affiche le libellé sous l'onglet courant, picto seul pour les autres). À trancher avant de coder.

---

## Groupe 4 — États terminaux (le 100 %)

### C6 — Label « vers max » de la barre XP
- **Constat** : « 100% vers max » s'affiche au dernier niveau — peu utile une fois le max atteint.
- **Fichier** : `src/pages/eleve/accueil.js` L.1035 (`${lvl.pct}% vers ${LEVEL_NAMES[...] ?? "max"}`).
- **Action** : si dernier niveau et `pct === 100` → texte « Niveau max atteint » (ou « Score max ») + changer la couleur de `.acc2-xp-fill` (ex. doré `var(--am)`).
- **Risque** : faible.

### C7 — Lisibilité du bloc « Parcours complété »
- **Constat** : texte « Tous les mondes maîtrisés » trop discret sur fond vert (contraste faible).
- **Fichier** : `accueil.js` `renderNextReward()` L.1155-1170 — `.acc2-ms-reward-remaining span` et `.acc2-ms-reward-name` en `rgba(255,255,255,.65/.8)`.
- **Action** : monter l'opacité/poids du texte, ou restructurer (titre blanc plein + sous-titre). Reformuler pour meilleure visibilité.

### C8 — « Pourquoi les 2 en même temps ? » (Action du jour examen + Boule de cristal)
- **Constat** : dès `totalValidated > 0`, l'Action du jour tombe sur « Ton parcours d'examen » (`accueil.js` L.1236-1240) ALORS QUE la Boule de cristal (= prédiction d'examen) est aussi affichée. Les deux parlent d'examen → redondance perçue.
- **Reco produit** : soit n'afficher l'Action « examen » que quand l'élève est proche/prêt (ex. ≥ cible), soit fusionner crystal-ball + CTA examen en un seul bloc.
- **+ Idée associée** : à 100 %, basculer en état « Parcours complété » dédié.
- **Risque** : décision produit, pas juste CSS — à cadrer avant de coder.

---

## Groupe 5 — Cohérence visuelle

### C9 — Icône cloche pleine + états
- **Constat** : cloche actuelle = outline ; tu proposes une cloche pleine, état gris (aucune notif) / jaune (avec notif).
- **Existant** : `src/components/notif-bell.js` affiche DÉJÀ un badge rouge avec le compteur de non-lus (L.40, L.112-118). Donc l'état « avec notif » existe (badge), mais l'icône elle-même ne change pas.
- **Action** : remplacer `icon("bell")` (L.68) par une variante pleine ; basculer la couleur selon `unread > 0` dans `renderList()`. Décider si on garde le badge chiffré EN PLUS de la couleur (sinon doublon de signal — un seul suffit).

---

## Groupe 6 — Incohérence relevée (hors doc)

### C10 — 3 cibles différentes sur le même écran
- **Constat** : footer « /31 » et « avant l'examen blanc » calculé sur **28** (`accueil.js` L.1077-1084) ; prédiction visant **28** (`examen.js` `PREDICT_TARGET = 28`) ; « Prochain objectif » raisonnant par **mondes complets**. → 3 modèles mentaux sur un écran.
- **Action** : harmoniser le discours (28 vs 31). Décision produit.

---

## Question résolue — Boule de cristal
Dynamique, calculée **côté serveur** (RPC `get_my_prediction`). Moyenne pondérée de 4 signaux : couverture 40 % (compétences acquises /31), maîtrise 30 % (moy. 30 derniers quiz), régularité 15 % (plus longue série, max 30j), vélocité 15 % (validations sur 28j). Bornée 5-99 %. Le front ne fait que l'afficher.

---

## Ordre d'exécution conseillé
1. **Sans débat** : C1, C2, C3, C6, C7 (CSS/contenu, faible risque).
2. **Doublon** : C4, C9 (vérifier les références avant suppression).
3. **À trancher d'abord** : C5 (labels nav), C8 (examen vs cristal), C10 (cibles).

**Avant commit** : `npm run build` (le lint est un stub). Branche dédiée `feat/accueil-gestalt`.
