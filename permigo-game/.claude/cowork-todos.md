# Cowork TODOs — Demandes de Claude Code

> Fichier géré par Claude Code pour signaler des modifications dans la ZONE INTERDITE.
> Cowork applique ces changements.

---

## [2026-05-20] 🔄 SPRINT 7 — NOUVEAU FLUX VALIDATION (séance → quiz) + retrait crédits (Cowork → Claude Code)

> **Backend DÉJÀ migré et testé par Cowork** (migration `inverse_validation_flow`). Il reste tout le FRONT à adapter. Lis `/permigo-game/design-system/permigo-laws.md` avant.

### 🎯 OBJECTIF
Inverser la logique pédagogique : **la séance débloque la compétence, le quiz la valide**. Avant : quiz prérequis → moniteur valide. Maintenant : moniteur log séance → compétence passe en `a_valider` → élève fait le quiz → compétence `acquis`. + Retirer TOUS les crédits heures (on est 100% compétences).

### 🔧 CE QUE LE BACKEND FAIT DÉJÀ (ne pas re-coder, juste câbler)
- `log_session(p_eleve_id, p_duration_minutes, p_session_date, p_notes, p_competence_ids, p_comment)` → insère les compétences en statut **`a_valider`** (plus jamais `acquis` direct). **Ne bloque plus sur le quiz.** Retourne `{ ok, session, validations:[{competence_id, created, statut:'a_valider'}] }`.
- **NOUVELLE RPC** `submit_competence_quiz(p_competence_id text, p_score int, p_type text default 'post_validation')` → enregistre le quiz + si `score >= 70` passe la compétence `a_valider`→`acquis` (crédite XP/trophées automatiquement). Retourne `{ ok, passed, validated, reason? }`.
- Nouveau statut DB : **`a_valider`** (en plus de `acquis`/`en_cours`/`a_retravailler`).

### 📋 CHANGEMENTS FRONT (par zone)

**A. Nouveau statut `a_valider` partout où les statuts sont mappés**
Fichiers : `pages/eleve/parcours.js`, `pages/enseignant/livret-remc.js`, `pages/enseignant/validation.js`, `pages/enseignant/parcours.js`
- Ajouter le statut `a_valider` aux maps de libellé/couleur/icône.
- Libellé élève : **"À valider"** (+ sous-texte "Fais ton quiz") · couleur ambre/violet · icône `clipboard-check` ou `help-circle`
- Libellé moniteur/gérant : **"En attente quiz élève"** · couleur ambre
- Sur le parcours élève, un node `a_valider` = débloqué, cliquable → ouvre le quiz de la compétence.

**B. log-session moniteur — `pages/enseignant/log-session.js`**
- Renommer la section "COMPÉTENCES" en **"COMPÉTENCES TRAVAILLÉES"** (pas "validées").
- Le bouton final : **"Enregistrer la séance"** (plus "X compétences validées"). Sous-texte optionnel : "X compétence(s) débloquée(s)".
- Au succès, toast : **"Séance enregistrée · X compétence(s) débloquée(s) 🔓"** (plus "validées").
- Retirer toute la gestion d'erreur `no_quiz_attempt` (n'existe plus). Garder `no_session` (improbable ici).

**C. Quiz élève — `pages/eleve/quiz.js` + `modules/pedagogie/quiz-engine.js`**
- À la fin du quiz d'une compétence, appeler **`await sb.rpc('submit_competence_quiz', { p_competence_id: compId, p_score: scorePct })`** (au lieu de l'ancien flux d'insertion validation).
- Gérer le retour :
  - `validated: true` → écran succès "Compétence validée ! ✅ +XP" + confetti (réutilise celebrate-screen)
  - `passed: false` (score < 70) → "Presque ! Il te faut 70% pour valider. Réessaie." + bouton recommencer
  - `reason: 'no_competence_unlocked'` → "Cette compétence n'est pas encore débloquée par ton moniteur."
- Le quiz d'une compétence n'est accessible QUE si elle est `a_valider` (débloquée). Sinon message "Pas encore débloquée".

**D. Accueil élève — `pages/eleve/accueil.js`**
- Si l'élève a des compétences `a_valider`, l'**ACTION DU JOUR** devient prioritaire : **"Valide ta compétence — Fais le quiz de [nom]"** → `#/quiz/{compId}/post_validation`. (avant l'examen blanc)

**E. Retirer les CRÉDITS HEURES partout**
Fichiers : `pages/enseignant/mes-eleves.js`, `pages/gerant/eleves.js`, `pages/enseignant/livret-remc.js` (+ tout endroit affichant `credit_heures` / "Xh crédit" / "Xh crédits")
- Supprimer les chips/labels "0h crédit", "20h crédits", etc.
- Remplacer par la **progression compétences** uniquement (X/31). C'est la seule métrique élève.

### 🔒 CONTRAINTES (Loi 4)
- Ne PAS toucher au backend (déjà fait, testé).
- `var(--token)` partout, pas de hex en dur.
- Le statut `a_valider` doit avoir une identité visuelle distincte (ambre) — ni vert (acquis) ni gris (à faire).
- Mobile-first, fallback gracieux.

### ⚠️ BUGS À ÉVITER
- Ne pas oublier `a_valider` dans les `switch/map` de statut → sinon affichage cassé (statut inconnu = vide).
- Le quiz doit envoyer le **score en pourcentage 0-100** (le backend valide à >= 70).
- Ne pas ré-insérer de validation côté front : `submit_competence_quiz` gère tout.

### ✅ VALIDATION
Tester le flux complet : moniteur log séance Rezah (compétence) → Rezah voit "À valider" sur son parcours → clique → quiz → réussit → "acquis" + XP. Échec quiz → reste "À valider".

### 📊 DONNÉES DE TEST EN PLACE (Cowork)
- **Rezah Bensalem** : C1a `acquis` (quiz réussi), C1b `a_valider` (quiz à refaire) → parfait pour démontrer les 2 états.
- Comptes : `rezah.bensalem@test.fr` / `betty.ntoni@test.fr` / `eleve@test.fr` (Latifa god-mode) — tous `Autopilot2025!`

---

## [2026-05-19 NUIT+1] 🩹 SPRINT 6.5 — Fix gradient opaque qui masque les fonds (Cowork → Claude Code)

> **Bug confirmé en live sur Vercel prod via Chrome MCP** : l'image `monde1nuit.png` se charge bien (naturalWidth 853, complete:true, opacity:.38, display:block) mais elle est INVISIBLE sous une plaque opaque. En désactivant `.prc-world::before` via JS le fond apparaît instantanément, parfait.
>
> **Cause** : `color-mix(in srgb, var(--wc) X%, var(--bg))` produit un mélange OPAQUE entre la couleur du monde et la couleur du fond — pas une transparence. Le pseudo-élément `::before` à z-index:1 est donc un rectangle quasi-opaque qui cache l'image en z-index:0.

### 🎯 OBJECTIF
Remplacer `var(--bg)` par `transparent` dans le gradient `.prc-world::before` pour préserver la teinte couleur du monde TOUT EN laissant passer l'image background.

### 🔒 CONTRAINTES
- Ne touche QUE au bloc `.prc-world::before` (lignes ~50-61 de `src/pages/eleve/parcours.js`)
- Aucune autre modification dans le fichier
- Garde l'identité couleur du monde (la teinte doit rester perceptible)

### Diff exact — `src/pages/eleve/parcours.js` lignes 57-60

```diff
 .prc-world::before {
   content: '';
   position: absolute;
   inset: 0;
   z-index: 1;
   pointer-events: none;
   background: linear-gradient(180deg,
-    color-mix(in srgb, var(--wc, #10b981) 8%, var(--bg)) 0%,
-    color-mix(in srgb, var(--wc, #10b981) 3%, var(--bg)) 50%,
-    var(--bg) 100%);
+    color-mix(in srgb, var(--wc, #10b981) 22%, transparent) 0%,
+    color-mix(in srgb, var(--wc, #10b981) 12%, transparent) 50%,
+    color-mix(in srgb, var(--wc, #10b981) 4%, transparent) 100%);
 }
```

**Pourquoi ces pourcentages** : 22% en haut donne assez de teinte pour identifier le monde (emerald/cyan/violet/amber) sans étouffer l'image. 4% en bas laisse l'image presque pure pour que les nodes du parcours soient lisibles.

### 💛 ÉMOTION CIBLE
Quand tu push, l'effet doit être : *"on voit une route nocturne en arrière-plan teintée légèrement de la couleur du monde, comme une fenêtre sur un atlas Apple"*. Pas un overlay plastique.

### ⚠️ BUGS À ÉVITER
- Si tu mets >25% en haut, on perd l'image
- Si tu mets <10% en haut, on perd l'identité couleur du monde
- Ne pas re-introduire `var(--bg)` à 100% en bas (re-créerait l'opacité)
- Vérifie dark mode : la même règle marche (transparent reste transparent)

### ✅ VALIDATION
Après push Vercel, vérifie sur `/parcours` que :
- Monde 1 (Campagne) actif : route nocturne légèrement verte visible derrière
- Le titre "Maîtriser le véhicule" reste parfaitement lisible
- Les nodes (cercles compétences) restent contrastés

---

## [2026-05-19 NUIT] 🌅🌌 SPRINT 6 — Backgrounds mondes jour/nuit (parcours élève + landing)

> **⚠️ Lecture préalable obligatoire** : `/permigo-game/design-system/permigo-laws.md` (Lois 2, 3, 4, 10). Ce prompt suit la Loi 9 (OBJECTIF / CONTRAINTES / ÉMOTION / GARDE / BUGS).
>
> **AVANT TOUTE MODIFICATION** : ouvre et lis `src/pages/eleve/parcours.js` en entier. Identifie la hiérarchie actuelle (`prc-world`, `prc-world-decor`, gradient `--wc`, scroll snap). Comprends comment chaque monde a déjà sa couleur (`#10b981`, `#06b6d4`, `#8b5cf6`, `#f59e0b`) et son décor en haut à droite. **NE PAS** casser ce qui existe — on **AJOUTE** un fond derrière, on ne remplace pas le gradient.

### 🎯 OBJECTIF

1. Intégrer 8 backgrounds (`monde{1-4}jour.png` + `monde{1-4}nuit.png`, déjà dans `/public/skins/landing/`) en **fond très subtil** de chaque section monde du parcours élève
2. Switch jour/nuit **automatique selon l'heure locale** : nuit si `getHours() >= 20 || getHours() < 7`, sinon jour
3. La landing (route racine non-auth — à identifier : probablement `src/pages/auth/login.js` ou racine dans `main.js`) utilise `monde4nuit.png` comme background si nuit, sinon `monde4jour.png` ou hero existant
4. Monde **actif** (celui où l'élève progresse) = background **plus vif** (opacity .35-.45)
5. Mondes **verrouillés** ou complétés = background **plus discret** (opacity .12-.18)

### 💛 ÉMOTION CIBLE (Loi 2)

- **Sensation** : aventure légère + progression, **comme ouvrir un atlas Apple**. Pas un jeu mobile bruyant.
- **Référence visuelle** : Apple Health "Découvrir", Linear "Workspace dark", Headspace splash screens
- **Test ultime** : *"Si je montre ça à un fondateur Apple, est-ce que ça passe ?"* Si non, baisser l'opacity et le blur.

### 🔒 CONTRAINTES (strictes — bible Loi 4)

1. **NE PAS** dépasser opacity `.45` sur le monde actif, `.18` sur les autres
2. **NE PAS** retirer le gradient `prc-world` existant — il reste, le background s'AJOUTE derrière en `position:absolute; z-index: 0`
3. **NE PAS** supprimer le filigrane volant (`prc::before` ligne ~31) — il reste, on l'estompe encore plus (`opacity:.08` si fond image présent)
4. **Blur léger obligatoire** : `filter: blur(2px) saturate(.85)` sur les backgrounds pour qu'ils ne distraient jamais du texte
5. **Lazy load** : `<img loading="lazy" decoding="async">` pour éviter de charger 4 PNG au mount
6. **Preload UNIQUEMENT** le monde actif (le reste se charge au scroll)
7. **Respecter `prefers-reduced-motion`** : pas de fade-in animé si l'user a cette préférence
8. **Mode sombre** : les backgrounds NUIT marchent en dark mode natif ; les backgrounds JOUR doivent être atténués en dark mode (`opacity * 0.6`)
9. **Pas d'overlay coloré** par-dessus — laisser le gradient `--wc` faire le boulot
10. **Mobile-first** : container 480px, les PNG sont 1080×1920 → `object-fit: cover; object-position: center`

### 🛡️ CE QU'ON GARDE (intouchable)

- La couleur emerald/cyan/violet/amber par monde
- La position du `prc-world-decor` (logo monde haut-droite)
- Le scroll snap entre mondes
- Le filigrane volant (juste atténué)
- La structure HTML `prc-world > prc-world-hd + prc-world-nodes`
- L'animation `decorFloat` sur monde complete

### ⚠️ BUGS À ÉVITER

- **Layout shift** : fixer `width:100%; height:100%; position:absolute; inset:0` sur le `<img>`, pas de hauteur naturelle
- **Z-index hell** : background image en `z-index:0`, gradient en `z-index:1`, decor/header/nodes en `z-index:5+`
- **Performance** : 4 PNG × 1080×1920 = ~3 Mo. Lazy mandatory, sinon premier paint catastrophique
- **Mauvais path** : les fichiers sont dans `/skins/landing/`, pas `/skins/worlds/` (oui c'est bizarre, on a renommé)
- **Switch jour/nuit qui glitch** : calculer `isNight` UNE fois au mount, ne pas recalculer à chaque render

### 📐 IMPLEMENTATION GUIDELINE

```js
// En haut de parcours.js
const isNight = (() => {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
})();

const WORLD_BG = (worldId) => `/skins/landing/monde${worldId}${isNight ? 'nuit' : 'jour'}.png`;
```

Dans le render de chaque `.prc-world`, ajouter en premier enfant :

```html
<img class="prc-world-bg ${isActive ? 'prc-world-bg--active' : ''}"
     src="${WORLD_BG(world.id)}"
     alt=""
     aria-hidden="true"
     loading="${isActive ? 'eager' : 'lazy'}"
     decoding="async">
```

CSS à ajouter :

```css
.prc-world { position: relative; overflow: hidden; isolation: isolate; }
.prc-world-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: .14;
  filter: blur(2px) saturate(.85);
  z-index: 0;
  pointer-events: none;
  transition: opacity .6s cubic-bezier(.22,1,.36,1);
}
.prc-world-bg--active { opacity: .38; }
@media (prefers-color-scheme: dark) {
  .prc-world-bg { opacity: .10; }
  .prc-world-bg--active { opacity: .28; }
}
.prc > * { position: relative; z-index: 1; }  /* déjà présent ligne 55 */

/* Atténuer le volant si fond image présent */
.prc:has(.prc-world-bg)::before { opacity: .08; }
```

### 📄 LANDING — page racine non-auth

1. **D'abord identifier** où elle est : grep `landing`, regarde `main.js` route racine, ou `src/pages/auth/login.js` si c'est le premier écran public
2. Si la landing n'existe pas en tant que page dédiée → c'est `login.js` qui sert de landing → ajouter le background nuit/jour en `<div class="lg-bg">` derrière le formulaire login
3. Asset : `/skins/landing/monde4nuit.png` (nuit) ou `/skins/landing/monde4jour.png` (jour) — monde 4 (le sommet) = aspiration ultime, parfait pour la landing
4. **Opacity max** sur la landing : `.65` (plus immersif que parcours car pas de contenu dense), avec gradient overlay `linear-gradient(180deg, transparent 0%, var(--bg) 100%)` en bas pour la lisibilité du CTA

### ✅ VALIDATION

Quand tu push, vérifie en local :
- `npm run dev`, ouvre `/parcours` à 14h → backgrounds jour visibles
- Change l'horloge système (ou hardcode `isNight = true` temporairement) → backgrounds nuit
- Inspecte performance : Network tab → 1 seul PNG chargé eagerly (le monde actif), 3 lazy
- Lisibilité texte : sur monde 4 actif (le plus vif), le titre `Sommet` reste contrasté et propre

### 📦 SI tu doutes

Ne push pas. Pose la question dans `.claude/cowork-todos.md` en bas, je passe derrière.

---

## [2026-05-19 NUIT] 🔧 SPRINT 5.5 — Fixes P1 cockpit gérant (Cowork → Claude Code)

> Backend patché par Cowork (RPC `get_gerant_cockpit` renvoie maintenant `validations_30j`). Il reste 2 diffs front, **très petits**.

### 🎯 OBJECTIF
Cockpit gérant affiche 6 KPIs corrects (au lieu de 4 dont 2 manquantes) + listes équipe/élèves triées par prénom (pas par nom).

### 🔒 CONTRAINTES
- Ne touche QUE aux 3 lignes ci-dessous
- Aucune autre modification dans ces fichiers

### Diff 1 — `src/pages/gerant/cockpit.js` ligne 27

```diff
-  { key: 'taux_reussite',    label: 'Taux réussite',    color: '#10b981', unit: '%'  },
+  { key: 'taux_reussite_90j', label: 'Taux réussite 90j', color: '#10b981', unit: '%'  },
```

**Pourquoi** : la RPC renvoie `taux_reussite_90j`, pas `taux_reussite`. Sans ce fix la KPI est silencieusement filtrée. (Backend confirmé : `SELECT get_gerant_cockpit()->'kpis'` renvoie bien `taux_reussite_90j` + maintenant `validations_30j: 4`).

### Diff 2 — `src/pages/gerant/equipe.js` ligne 246

```diff
-        .order('nom', { ascending: true }),
+        .order('prenom', { ascending: true }),
```

### Diff 3 — `src/pages/gerant/eleves.js` ligne 268

```diff
-      .order('nom', { ascending: true });
+      .order('prenom', { ascending: true });
```

**Pourquoi** : l'affichage est `${prenom} ${nom}` (correct) mais l'ordre alphabétique se faisait sur le nom de famille → impression que "le nom est devant le prénom". Trier par `prenom` aligne l'ordre visuel avec ce qu'on lit en premier.

### ⚠️ BUGS À ÉVITER
- Ne PAS changer le `label` "Taux réussite" — laisse "Taux réussite 90j" pour la transparence sur la fenêtre temporelle (cohérent avec "Heures 30j", "Nouveaux 30j", "Validations 30j")

---

## [2026-05-19 NUIT] 🎨 SPRINT 5 — Câbler 21 assets ChatGPT (Cowork → Claude Code)

> **⚠️ Lecture préalable obligatoire** : `/permigo-game/design-system/permigo-laws.md` (vient d'être créé, c'est la nouvelle bible). Loi 9 du projet = chaque prompt suit le format OBJECTIF / CONTRAINTES / ÉMOTION / CE QU'ON GARDE / BUGS À ÉVITER. Ce prompt suit ce format.

---

### 🎯 OBJECTIF

Câbler 21 assets PNG ChatGPT (uploadés mais inutilisés) dans 3 pages élève (`mes-coffres`, `trophees`, `wrapped`) + 4 empty states. Aucun nouveau composant XL, on étend l'existant.

### 🔒 CONTRAINTES (strictes)

1. **NE PAS toucher** à `src/components/chest.js` — le modal cinématique reste en SVG inline (les animations en dépendent)
2. **NE PAS supprimer** les emojis existants — ils restent en fallback `onerror`
3. **NE PAS introduire** de couleurs hex en dur — toujours `var(--token)` (cf permigo-laws.md §1)
4. **NE PAS ajouter** d'animations gratuites (cf Loi 3 — animations = récompenses, pas décoration)
5. **Build doit passer** : `npm run build` 0 erreur, taille bundle stable (±10kb max)
6. **Mobile-first** : conteneur 480px max, touch targets ≥44px

### 💛 ÉMOTION CIBLE

- **Coffres** : prestige + anticipation. Le légendaire doit donner envie. Le commun reste sobre.
- **Trophées** : fierté + collection. Le mur de trophées doit donner le sentiment "j'ai construit ça".
- **Wrapped** : screenshot-worthy en 0.8s (Loi 6). Chaque slide doit être lisible à l'arrêt sur une story Instagram.
- **Empty states** : calme + direction (Loi 7). Jamais "rien à voir", toujours "voici la prochaine étape".

### 🛡️ CE QU'ON GARDE

- Hiérarchie visuelle actuelle des pages (titres, sections, ordres)
- Couleurs sémantiques (tokens existants)
- Les emojis (en fallback `onerror`)
- Le modal d'ouverture coffre (SVG cinématique)
- Les animations existantes de unlock (confetti, lootToast)

### ⚠️ BUGS À ÉVITER

- **Régression visuelle si PNG 404** : tester avec `onerror` qui montre l'emoji
- **Layout shift** au chargement image : fixer `width/height` inline
- **Performance** : `loading="lazy"` sur toutes les `<img>` non visibles initialement
- **Dark mode** : vérifier que les PNG fonctionnent sur fond `--bg` clair ET sombre (drop-shadow)
- **Path absolu** : toujours `/skins/...` (pas `./skins/`, casse en hash routing)

---

### 1. COFFRES — `src/pages/eleve/mes-coffres.js`

Fichier ligne 19-28 : remplacer le bloc `CHEST_META` complet par :

```js
const CHEST_META = {
  world_1:      { label: 'Monde 1 — Sécurité',  image: '/skins/chests/chest_world_1.png',     tier: 'bronze',     xp: 200,  gemmes: 50  },
  world_2:      { label: 'Monde 2 — Manœuvres', image: '/skins/chests/chest_world_2.png',     tier: 'argent',     xp: 400,  gemmes: 100 },
  world_3:      { label: 'Monde 3 — Conduite',  image: '/skins/chests/chest_world_3.png',     tier: 'or',         xp: 700,  gemmes: 175 },
  world_4:      { label: 'Monde 4 — Maîtrise',  image: '/skins/chests/chest_world_4.png',     tier: 'legendaire', xp: 1200, gemmes: 300 },
  streak_7:     { label: 'Streak 7 jours',      image: '/skins/chests/chest_streak_7.png',    tier: 'argent',     xp: 150,  gemmes: 30  },
  streak_14:    { label: 'Streak 14 jours',     image: '/skins/chests/chest_streak_14.png',   tier: 'or',         xp: 350,  gemmes: 80  },
  streak_30:    { label: 'Streak 30 jours',     image: '/skins/chests/chest_streak_30.png',   tier: 'legendaire', xp: 800,  gemmes: 200 },
  perfect_quiz: { label: 'Quiz parfait',        image: '/skins/chests/chest_perfect_quiz.png',tier: 'or',         xp: 100,  gemmes: 25  },
};
```

Puis dans la fonction qui rend la card coffre (cherche `meta.emoji` dans le fichier), remplacer le rendu emoji par :

```html
<div class="mc-thumb" style="background:${TIER_GRADIENT[meta.tier]}">
  <img src="${meta.image}" alt="${esc(meta.label)}" loading="lazy"
       onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
       style="width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.35))">
  <span style="font-size:32px;display:none">${meta.emoji ?? '🎁'}</span>
</div>
```

Si `meta.emoji` n'existe plus dans CHEST_META, garde un fallback emoji inline `'🎁'`.

---

### 2. TROPHÉES — `src/pages/eleve/trophees.js`

Fichier ligne 14-31 : ajouter le champ `image:` à chaque entrée CATALOG dont l'asset existe (les autres restent en emoji) :

```js
const CATALOG = [
  // Compétences
  { key: 'comp_5',         emoji: '🎯', image: '/skins/achievements/ach_comp_5.png',         title: 'Premières racines', ... },
  { key: 'comp_10',        emoji: '🌱', image: '/skins/achievements/ach_comp_10.png',        title: '10/31', ... },
  { key: 'comp_15',        emoji: '⚡', image: '/skins/achievements/ach_comp_15.png',        title: 'Cap des 15', ... },
  { key: 'comp_20',        emoji: '🔥', image: '/skins/achievements/ach_comp_20.png',        title: '20 acquises', ... },
  { key: 'comp_25',        emoji: '💎', image: '/skins/achievements/ach_comp_25.png',        title: '25/31', ... },
  { key: 'comp_28',        emoji: '🎓', image: '/skins/achievements/ach_comp_28.png',        title: 'Prêt examen blanc', ... },
  { key: 'comp_31',        emoji: '👑', image: '/skins/achievements/ach_comp_31.png',        title: '31/31 — Complet !', ... },
  // Séries
  { key: 'streak_3',       emoji: '🔥', image: '/skins/achievements/ach_streak_3.png',       title: '3 jours', ... },
  { key: 'streak_14',      emoji: '🔥', image: '/skins/achievements/ach_streak_14.png',      title: 'Deux semaines', ... },
  { key: 'streak_60',      emoji: '🔥', image: '/skins/achievements/ach_streak_60.png',      title: "60 jours d'affilée", ... },
  // Quiz
  { key: 'quiz_10',        emoji: '🧠', image: '/skins/achievements/ach_quiz_10.png',        title: '10 quiz', ... },
  { key: 'quiz_50',        emoji: '🧠', image: '/skins/achievements/ach_quiz_50.png',        title: '50 quiz', ... },
  { key: 'quiz_perfect_5', emoji: '✨', image: '/skins/achievements/ach_quiz_perfect_5.png', title: '5 quiz parfaits', ... },
];
```

Puis dans le template qui rend chaque trophée (cherche `tr2-card-emoji` ou `${esc(it.emoji)}` dans le fichier), remplacer par :

```html
<div class="tr2-card-emoji">
  ${it.image ? `
    <img src="${it.image}" alt="${esc(it.title)}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"
         style="width:56px;height:56px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(0,0,0,.25))">
    <span style="display:none;font-size:36px">${it.emoji}</span>
  ` : `<span style="font-size:36px">${it.emoji}</span>`}
</div>
```

Important : **désaturer si non-débloqué** (ajouter `filter: grayscale(1) opacity(.4)` si `!it.unlocked`).

---

### 3. WRAPPED — `src/pages/eleve/wrapped.js`

Fichier ligne 91 : `wrapped_streak.png` → `wrapped_percentile.png`
Fichier ligne 129 : `wrapped_streak.png` → `wrapped_top_comp.png`
Fichier ligne 112 : laisser `wrapped_streak.png` (slide 3 = streak, correct)

Diff exact :

```diff
- function renderSlide2({ percentile }) {
-   ...
-   <div class="wrp-slide-bg" style="background-image:url('/skins/wrapped/wrapped_streak.png')"></div>
+ function renderSlide2({ percentile }) {
+   ...
+   <div class="wrp-slide-bg" style="background-image:url('/skins/wrapped/wrapped_percentile.png')"></div>

- function renderSlide4({ topCompLabel, topCompN }) {
-   ...
-   <div class="wrp-slide-bg" style="background-image:url('/skins/wrapped/wrapped_streak.png')"></div>
+ function renderSlide4({ topCompLabel, topCompN }) {
+   ...
+   <div class="wrp-slide-bg" style="background-image:url('/skins/wrapped/wrapped_top_comp.png')"></div>
```

---

### 4. EMPTY STATES — wire dans 4 pages

Crée un helper réutilisable `src/components/empty-state.js` :

```js
export function emptyState({ image, title, body, cta }) {
  return `
    <div style="text-align:center;padding:48px 24px;display:flex;flex-direction:column;align-items:center;gap:16px">
      <img src="${image}" alt="" loading="lazy"
           style="width:140px;height:140px;object-fit:contain;opacity:.92"
           onerror="this.style.display='none'">
      <div style="font:700 18px/1.2 'Plus Jakarta Sans',sans-serif;color:var(--ink)">${title}</div>
      <div style="font:500 14px/1.5 'Inter',sans-serif;color:var(--mu);max-width:280px">${body}</div>
      ${cta ?? ''}
    </div>
  `;
}
```

Puis wire dans :

- `src/pages/common/notifications.js` — quand `notifs.length === 0`, render `emptyState({ image:'/skins/empty-states/empty_notifications.png', title:'Aucune notification', body:'Tu es à jour ! Reviens plus tard.' })`
- `src/pages/common/messages.js` — quand pas de threads, `emptyState({ image:'/skins/empty-states/empty_messages.png', title:'Aucun message', body:'Lance la conversation avec ton moniteur ou ta classe.' })`
- `src/pages/enseignant/mes-eleves.js` — quand 0 élèves, `emptyState({ image:'/skins/empty-states/empty_eleves.png', title:'Aucun élève assigné', body:'Ton gérant doit t\\'attribuer des élèves dans la console.' })`
- `src/pages/eleve/trophees.js` — quand 0 unlocked, `emptyState({ image:'/skins/empty-states/empty_trophees.png', title:'Aucun trophée encore', body:'Valide des compétences, fais des quiz, débloque !' })`

---

### 5. CONTRAINTES

- **Ne touche pas** à `src/components/chest.js` (le modal cinématique reste en SVG inline, c'est volontaire pour les animations)
- **Garde l'emoji en fallback** partout (la PNG peut 404, on ne casse jamais le rendu)
- **Vérifie le build** : `npm run build` doit sortir 0 erreur
- **Commit + push** à la fin

---

### 6. BONUS si tu as le temps

Sur les coffres légendaires (`tier: 'legendaire'`) **fermés**, ajoute une animation pulse glow sur la card :

```css
.mc-card[data-tier="legendaire"]:not(.opened) {
  animation: legendaryPulse 2.4s ease-in-out infinite;
}
@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,.4); }
  50%      { box-shadow: 0 0 24px 6px rgba(168,85,247,.55); }
}
```

Ça donne l'effet "dopamine Clash Royale" — le légendaire pulse, le commun reste statique.

---

## [2026-05-19 SOIR] ✅ SPRINT 4 — Bug fixes livrés (Claude Code)

> 5 bugs P0/P1 fixés, build propre (130 modules, 866ms).

| Fichier | Bug | Fix |
|---|---|---|
| `profil.js` | "0 élèves accompagnés" même si élèves assignés | Union `enseignant_id` query + validations (plus de count incorrect) |
| `parcours.js` | Zone blanche en dark mode | Toutes les couleurs hardcodées → CSS vars (`var(--bg)`, `color-mix(in srgb, var(--bg) N%, transparent)`) + suppression `renderEmptyState` du `.prc-map` |
| `parcours-pro.js` | Hero vide au chargement (opacity:0) + `.pcp-next` animation écrasée | Nouveau keyframe `pcpHeroIn` sans opacity (juste transform), retrait `.pcp-next` du bloc sequential, `streak_pro_days` depuis `profiles`, hero title depuis RPC `current_palier.title` |
| `validation.js` | C1b–C1f verrouillées (gating séquentiel abusif) + `navigate` manquant | Suppression du bloc de gating séquentiel, badges "À valider" au lieu de "Verrouillé", import `navigate` ajouté |
| `boutique.js` | Pas de bouton "Acheter" lisible + images sans fallback | Texte `Acheter · X 💎`, `disabled` si solde insuffisant, fallback `asset_url || image_url || null` + `display_color || '#6366f1'` |

**Aucune demande Cowork dans ce sprint.** Tout côté Claude Code.

---

## [2026-05-19 MATIN] 🔥 P0 — REFONTE PARCOURS MONITEUR (ADN Clash Royale + Apple)

> ChatGPT a roasté la page parcours moniteur. Verdict : "tu affiches le système au lieu d'afficher l'émotion du système". UI 8/10 mais sensation mobile native 5.5/10. À fixer.

### 🐛 BUG À TRAITER EN PREMIER

**"Mode rapide" (validate-batch.js)** doit être supprimé ou redirigé vers `#/log-session`. Pourquoi : il INSERT direct dans `validations` sans créer de session → bloqué par le trigger `validations_check_prerequisites` → toast rouge "Erreur lors de la validation batch" (visible en prod). C'est le comportement correct du trigger, c'est le bouton qui ne doit plus exister.

**Fix proposé** : remplacer le bouton "Mode rapide" + page validate-batch.js par redirect vers `#/log-session?eleve_id={id}` (pré-rempli si élève déjà choisi).

### 🎬 REFONTE — 3 BLOCS, RIEN DE PLUS

**Bloc 1 — HERO** (premium, presque jeu AAA)
- Niveau actuel ENORME (le nom du palier : "Débutant", "Moniteur en route", etc.)
- XP total + streak (compteur animé, glow léger)
- Background : gradient subtle violet → indigo, avec mesh/grain
- Hauteur : 280-320px, immersif
- Pas de cards blanches inutiles, pas de border, juste du fond + texte hiérarchisé

**Bloc 2 — NEXT UNLOCK** (UN SEUL palier visible, le prochain)
- Appel RPC : `const { data } = await sb.rpc('get_my_next_unlock_moniteur');`
- Affiche UNIQUEMENT `data.next_palier` avec :
  - Icône GROSSE de la récompense (`reward_icon` = lucide icon name)
  - Label palier : `"Plus que {data.remaining} validations"`
  - Nom récompense : `data.next_palier.reward_label` (ex: "Export PDF Livret")
  - Description : `data.next_palier.title` (ex: "Moniteur en route")
  - Barre de progression : `data.progress_pct` (animée au mount)
- Si `mystery === true` → afficher avec cadenas + "MYSTÈRE" (cachez le label)
- Design : carte 280px haut avec gradient violet → fuchsia, glow subtle, ombre portée
- L'utilisateur doit avoir envie de débloquer

**Bloc 3 — ROADMAP MINIMALISTE**
- Montre UNIQUEMENT 3 paliers : actuel + prochain + suivant flouté
- Si l'utilisateur veut voir toute la roadmap : bouton discret en bas "Voir tous les paliers →" → ouvre une page secondaire `#/parcours-pro-complet` (la timeline actuelle, gardée intacte mais cachée par défaut)

### 🔘 FAB EN BAS

Remplacer le bouton noir rond style Material par :
- **Tabbar enrichie** : 5 onglets en bas + un bouton "+" central proéminent (gradient violet, légèrement remonté façon iOS app store "+ Create")
- OU **dock flottant glass** : barre en bas avec glassmorphism (`backdrop-filter: blur(20px)`, fond `rgba(255,255,255,0.7)`)
- Pas de bouton noir Android-style isolé. Jamais.

### 🎨 RÈGLES PREMIUM MOBILE

- **Respiration** : 24-32px de padding vertical entre les 3 blocs (laisser respirer)
- **Hiérarchie forte** : un seul élément "hero" par écran (le bloc Next Unlock, le reste est support)
- **Animations cinéma** : fade-up au mount sur chaque bloc (delay 0/150/300ms), barre de progression qui se remplit en 800ms avec ease-out cubic
- **Couleurs émotionnelles** : utilisez les gradients (violet→indigo→fuchsia) pour les moments importants, pas pour tout
- **Fini les cartes blanches sur fond blanc** : varier les fonds (gradient, mesh, glass) pour créer du contraste

### 📦 LIVRABLES

- [ ] `src/pages/enseignant/parcours-pro.js` refonte complète en 3 blocs
- [ ] `src/pages/enseignant/parcours-pro-complet.js` (nouvelle page, la timeline actuelle déplacée ici)
- [ ] Suppression ou redirect de `validate-batch.js` → `#/log-session`
- [ ] Refonte FAB : tabbar + bouton central iOS-style
- [ ] Test sur iPhone (375x812 et 393x852)
- [ ] Coche cette section + retour ligne courte ici

---

## [2026-05-18 SOIR] 🎯 P0 — REFONTE FAB "ENREGISTRER SESSION" (ADN Uber Driver)

> Discuté avec Rayan : le moniteur doit pouvoir logger une séance complète en 30 secondes, une main, en sortant de la voiture. **Validation = session + commentaire + templates, en 1 action atomique.**

### 🔒 Backend Cowork — DÉJÀ EN PROD

- **Trigger `enforce_session_before_validation`** : refuse INSERT/UPDATE de `validations.statut='acquis'` si pas de session confirmée du binôme moniteur/élève dans les 7 derniers jours **OU** si l'élève n'a pas tenté le quiz de la compétence au moins 1 fois.
  - Erreur P0001 = pas de session
  - Erreur P0002 = pas de tentative quiz
- **Table `message_templates`** seedée avec 15 templates (5 default + 10 progressifs paliers 5/15/30/50)
- **RPC `get_my_message_templates()`** : retourne tous les templates avec flag `unlocked` selon nb total de validations lifetime du moniteur

### 📋 Spec frontend complète

Fichier cible : `src/pages/enseignant/log-session.js` (refonte complète)
Pattern : `mount(root, ...args)` exporté
Objectif : 30 sec max pour logger séance complète

**Écran unique, scroll vertical, 5 blocs :**

**1. Élève** (sélecteur)
- `sb.from('profiles').select('id,prenom,nom,avatar_url').eq('role','eleve').eq('enseignant_id', me.id).order('last_active_at',{ascending:false})`
- Photo + prénom + nom, le + récent en haut
- Search bar si > 6 élèves
- 1 tap = sélectionné (border violet `#6366f1`)

**2. Durée** (préset)
- 3 chips XL côte à côte : `1h` `1h30` `2h`
- Bouton secondaire "Autre durée" → bottom sheet stepper 15min
- Stocker en **minutes** (60, 90, 120…)

**3. Date** (auto = aujourd'hui)
- Display : `"Aujourd'hui · " + new Date().toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long'})`
- Tap → calendar picker bottom sheet (rattrapage)

**4. Compétences** (multi-select, ordre **alphabétique**)
- `sb.from('competences_remc').select('id,nom').order('nom',{ascending:true})`
- Pour chaque comp, check si déjà 'acquis' pour cet élève → chip vert "✓ Déjà acquis" et **désactive le tap** (anti-doublon)
- Sinon checkbox toggleable
- Header sticky : `"{N} compétences sélectionnées"`
- ⚠️ Le trigger refuse les comps sans tentative quiz → ne PAS pré-filtrer mais catch P0002 au submit avec toast clair

**5. Commentaire** (optionnel)
- Textarea 300 chars max, counter en bas droite
- Sous le textarea : grille de chips templates :
  ```js
  const { data: templates } = await sb.rpc('get_my_message_templates');
  // Affiche unlocked en couleur, locked en grisé avec 🔒 + "Débloque à {n} validations"
  ```
- Tap chip = `textarea.value = template.emoji + ' ' + template.body` (éditable après)
- Le message sera visible élève + autres enseignants de l'école

**Bouton sticky bas** : `"Enregistrer la session"` — gradient violet, h:56px

**Au tap :**
1. `navigator.vibrate?.(50)`
2. Show loader
3. INSERT atomique :
   ```js
   const { data: session, error: e1 } = await sb.from('sessions_moniteur').insert({
     moniteur_id: me.id,
     eleve_id: selectedEleveId,
     duration_minutes: selectedMinutes,
     session_date: selectedDate, // ISO YYYY-MM-DD
     confirmation_status: 'pending', // élève confirme depuis sa notif
     notes: commentText || null
   }).select().single();
   if (e1) return toast('Erreur enregistrement séance', 'error');

   // Pour chaque comp sélectionnée :
   for (const compId of selectedComps) {
     const { error: e2 } = await sb.from('validations').insert({
       eleve_id: selectedEleveId,
       competence_id: compId,
       validated_by: me.id,
       statut: 'acquis',
       validated_at: new Date().toISOString(),
       note_enseignant: commentText || null
     });
     if (e2?.code === 'P0002') {
       toast(`L'élève n'a pas encore tenté le quiz de cette compétence — validation impossible`, 'warning', 5000);
       continue;
     }
   }
   ```
4. Sur succès : `mount(celebrate-screen)` 500ms confetti puis retour Aujourd'hui + toast vert `"Séance enregistrée · {N} compétences validées"`

### 🎨 Règles UX absolues

- Mobile-first, zone safe iPhone (`env(safe-area-inset-bottom)`)
- Tout opérable à une main (pouce droit)
- `prefers-reduced-motion` respecté (skip confetti)
- `esc()` sur tous les noms d'élèves dans innerHTML
- Auto-save brouillon localStorage clé `draft_session_{date}` toutes les 5s
- Détection doublon : avant submit, check `sb.from('sessions_moniteur').select('id').eq('moniteur_id',me.id).eq('eleve_id',sel).eq('session_date',date)` → si existe : modal "Une séance existe déjà aujourd'hui avec {prenom}. Éditer ou créer une 2ème ?"

### 🎨 Design tokens

- Background : `#f8f9fc`
- Cards : bg `#fff`, radius 20px, border 1.5px `#e2e6f2`
- Accent violet : `#6366f1`
- Vert success : `#10b981`
- Rouge erreur : `#ef4444`
- Spacing inter-blocs : 16px
- Fonts : `'Plus Jakarta Sans'` (titres 16-18px 700) + `'Inter'` (body 13-14px 500)

### 📦 Livrables attendus

- [ ] `src/pages/enseignant/log-session.js` refonte complète
- [ ] Branche dans `src/main.js` si pas déjà fait
- [ ] Test : login moniteur (`enseignant@test.fr` / Autopilot2025!) → FAB → flow complet → vérif séance + validations en DB
- [ ] Coche cette section quand terminé + retour ligne courte ici

---

## [2026-05-18] 🚀 SUPER-VAGUE BACKEND v3 — 14 chantiers autonomes shippés

> Cowork a shippé 14 chantiers backend pendant que tu bossais. **87 RPC, 16 triggers, 13 cron jobs, 29 tables** au total. Voici la liste des câblages frontend à faire, regroupés par persona et priorité.

### 📚 RPC DISPONIBLES (référence complète)

#### Côté ÉLÈVE (dopamine)
| RPC | Usage |
|---|---|
| `get_coaching_tip()` | Tip contextuel personnalisé (8 contextes) — pour widget accueil |
| `predict_exam_ready_date()` | Date examen prédite + vélocité + confiance + conseil |
| `get_my_wrapped(year)` | Récap annuel style Spotify (overview, streaks, hour fav, percentile école) |
| `get_my_achievements()` | Liste achievements débloqués (5/10/15/20/25/28/31 + streaks + quiz) |
| `get_today_quests()` | 3 quêtes du jour avec progress/completed/claimed |
| `claim_quest(quest_id)` | Réclame récompenses XP/gemmes |
| `get_items_catalog(type?)` | Items boutique avec flag owned |
| `purchase_item(item_id)` | Achat avec débit gemmes |
| `get_my_inventory(type?)` | Mes items débloqués |
| `use_streak_freeze(date?)` | Geler 1 jour pour 50 gemmes |
| `get_my_freezes()` | Historique freezes |
| `start_exam_blanc()` | Démarre exam 40 questions |
| `submit_exam_blanc(session_id, answers)` | Soumet et calcule score |
| `generate_referral_code()` | Génère/retourne code parrain 6 chars |
| `apply_referral(code)` | Applique un code, +200 XP +50 gemmes pour les 2 |
| `get_my_referral_stats()` | Code + n_referrals + xp_earned |
| `send_message(to_id, body)` | Envoie message (auto notif) |
| `get_thread(partner_id, limit?)` | Messages d'un thread |
| `get_my_threads()` | Liste threads avec last_message + unread count |

#### Côté ENSEIGNANT
| RPC | Usage |
|---|---|
| `get_moniteur_dashboard(id?, days?)` | KPI complets + timeline 30 events + rank |
| `suggest_moniteur_for_eleve(eleve_id)` | Match-score multi-critères |
| `get_revision_recommendations(eleve_id, limit)` | Reco révisions pour un élève spécifique |

#### Côté GÉRANT
| RPC | Usage |
|---|---|
| `get_school_spotlights()` | Top progressant/streak/moniteur/comp difficile/quiz parfait récents |
| `export_eleves_csv()` | Liste élèves formatée pour export CSV |
| `get_school_trend(days)` | Évolution KPI école (déjà câblé Pulse) |

#### Admin RAYAN (rayannabli27@gmail.com)
| RPC | Usage |
|---|---|
| `get_global_stats()` | Vue platform/engagement/conversion/top_schools |
| `get_audit_trail(table?, actor?, limit?)` | Historique actions sensibles |
| `get_live_activity(minutes?)` | Events live 5 dernières min |
| `get_backend_stats()` | Diagnostic technique (RPC/triggers/crons/tables) |
| `admin_list_incidents(status?, limit?)` | Liste incidents reportés |
| `get_fraud_signals()` | Signaux anti-fraude moniteurs (déjà câblé debug) |

#### Tech transverse
| RPC | Usage |
|---|---|
| `is_flag_enabled(key)` | Check feature flag pour rollout progressif |
| `get_my_variant(experiment_key)` | A/B test variant deterministe |
| `track_event(name, props?, session?)` | Tracking analytics (fail silent) |
| `mark_notif_read`, `mark_all_notifs_read`, `count_unread_notifs` | Notifs (déjà câblé chantier A) |
| `report_incident(category, title, desc, severity?, url?, ua?)` | User report un bug |
| `add_gemmes(amount)` | Crédit gemmes (utilitaire) |

### 🎯 CHANTIERS FRONTEND à faire (par priorité)

#### 🥇 NIVEAU 1 — Impact dopamine + visibilité immédiate

**1. Widget coaching tip sur accueil élève** (15 min)
- Créer `src/components/coaching-tip.js` exportant `mountCoachingTip(root)`
- Fetch `get_coaching_tip()` au mount
- Card horizontale en top d'accueil (au-dessus du streak)
- Adaptive selon `tone` (urgent/celebrate/warm/gentle)
- Tap CTA → navigate `route`
- Skip si pas de tip
- Câbler dans `src/pages/eleve/accueil.js`

**2. Daily quests carousel sur accueil élève** (45 min)
- Créer `src/components/daily-quests.js`
- 3 cartes scrollables avec progress bar
- Fetch `get_today_quests()` 
- Card complétée tap → `claim_quest()` + anim "+XP +gemmes" + remove
- Câbler accueil élève (après header, avant streak)

**3. Streak freeze button** (20 min)
- Dans le bottom-sheet streak `accueil.js` (déjà existant)
- Si `streakSt === 'critical'` ou `'at_risk'` ET `gemmes >= 50`
- Bouton "🧊 Geler ma série (50💎)" → `use_streak_freeze()` 
- Toast vert success + close sheet

**4. Section "Examen prévu pour..." sur page examen** (30 min)
- Dans `src/pages/eleve/examen.js`
- Fetch `predict_exam_ready_date()` 
- Card avec date prédite + advice + barre de progression vers 28/31
- Si déjà ≥28, message "Tu es prêt !"

#### 🥈 NIVEAU 2 — Nouvelles pages (gros chantiers)

**5. Page Boutique** (1-2h) `src/pages/eleve/boutique.js`
- 3 sections : Avatars, Thèmes, Fonds permis
- Fetch `get_items_catalog()` 
- Cards avec rarity (gris/bleu/violet/or)
- Tap → modal "Acheter pour X💎 ?" → `purchase_item()`
- Affichage balance gemmes en header
- Route `#/boutique` à créer dans router.js (Cowork)

**6. Page Exam Blanc** (2-3h) `src/pages/eleve/exam-blanc.js`
- Écran intro : "40 questions · 30 min · 70% pour valider"
- Tap "Commencer" → `start_exam_blanc()` → reçoit questions
- UI quiz : 1 question/écran, timer global
- Submit → `submit_exam_blanc(session_id, answers)` → écran résultat
- Route `#/exam-blanc` à créer (Cowork)

**7. Page Messagerie** (2-3h) `src/pages/common/messages.js`
- Liste threads `get_my_threads()` + tap → ouvre conversation
- Conversation : `get_thread(partner_id)` + input bottom
- Send → `send_message(partner_id, body)`
- Route `#/messages` à créer (Cowork)
- Style WhatsApp simple

**8. Page PermiGo Wrapped** (annuelle, V2)
- Trigger : si décembre, banner sur accueil "Ton Wrapped 2026 est dispo"
- Page slides Spotify-like avec stats annuelles
- À faire plus tard

#### 🥉 NIVEAU 3 — Côté ENSEIGNANT/GÉRANT

**9. Profil moniteur enrichi** (1h) `src/pages/common/profil.js`
- Si `me.role === 'enseignant'` : fetch `get_moniteur_dashboard()`
- Section "Mes 30 jours" avec KPI grid + rank
- Mini-timeline des 5 derniers events

**10. Section Spotlights sur Pulse gérant** (45 min)
- ⚠️ **À demander à Cowork** : `src/pages/gerant/pulse.js` est zone interdite Claude Code
- Skip ou laisser à Cowork

**11. Export CSV élèves bouton gérant** (15 min)
- Dans `src/pages/gerant/eleves.js` header : bouton "📥 Exporter CSV"
- Tap → `export_eleves_csv()` → format CSV côté JS → download
```js
const csv = rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
const blob = new Blob([headers + '\n' + csv], { type: 'text/csv' });
// puis url.createObjectURL + a.click()
```

#### Niveau 4 — Tech / transverse

**12. Câbler analytics tracking** (30 min)
- `src/services/analytics.js` : remplacer le track local par `sb.rpc('track_event', { p_event_name, p_properties })`
- Garder la signature `track(name, props)` identique
- Fail silent (déjà géré côté DB)

**13. Référral section dans profil** (45 min)
- Dans `src/pages/common/profil.js` côté élève
- Fetch `get_my_referral_stats()` → si pas de code, bouton "Générer mon code"
- Affichage code + n_referrals + xp_earned
- Input pour entrer un code parrain (`apply_referral`)
- Bouton "Partager" → Web Share API

### 📋 Ordre recommandé pour câblage en 1 session

1. **NIVEAU 1 complet (4 widgets)** → 2h
2. **Boutique** (gros impact) → 1-2h
3. **Câblage analytics + référral profil** → 1h
4. Reste pour V2

### 📋 Routes manquantes à câbler (Cowork)

- `#/boutique` → `src/pages/eleve/boutique.js`
- `#/exam-blanc` → `src/pages/eleve/exam-blanc.js`
- `#/messages` → `src/pages/common/messages.js`

---

## [2026-05-18] 🆕 BACKEND v2 — Câblages restants après autonomie Cowork

> **Contexte :** Cowork a shippé 8 chantiers backend en autonomie. 4 sont autonomes (triggers XP, monthly recap, fraud alert, school snapshot — fonctionnent via cron). 4 RPC attendent un câblage frontend.

### ✅ Backend dispo (à utiliser)

| RPC | Usage |
|---|---|
| `mark_notif_read(p_notif_id)` | marque une notif lue (set `read=true` + `read_at=now()`) |
| `mark_all_notifs_read(p_type?)` | marque toutes les notifs (ou d'un type) comme lues |
| `count_unread_notifs(p_type?)` | nombre de notifs non-lues (pour badge bell) |
| `get_school_trend(p_days)` | évolution KPI école sur N jours (validations/quiz/sessions_h par jour) |
| `get_revision_recommendations(p_eleve_id?, p_limit)` | 3-5 comp à réviser (basé fails quiz + ancienneté validation + consolidation due) |
| `get_eleves_bloque_sur_competence(p_competence_id, p_window_days)` | drill depuis comp difficile insights |

### 🔌 CHANTIER A — Standardiser les notifs lues (priorité haute)

3 composants utilisent des conventions différentes pour marquer notif lue. Tous doivent passer par les RPC.

**Fichiers** :
- `src/components/notif-bell.js` : remplacer le UPDATE direct par `sb.rpc('mark_notif_read', { p_notif_id: id })`
- `src/components/notif-bell.js` : badge count = `await sb.rpc('count_unread_notifs')` (au lieu de query manuelle)
- `src/components/emotional-banner.js` : déjà OK avec `read_at IS NULL`, mais remplacer `update({ read_at: new Date().toISOString() })` par `sb.rpc('mark_notif_read', { p_notif_id })`
- `src/components/session-confirmation-banner.js` : si marque la notif lue après confirm → utiliser `mark_notif_read`
- `src/pages/common/notifications.js` : bouton "Tout marquer comme lu" → `sb.rpc('mark_all_notifs_read')`

### 📊 CHANTIER B — Graphe évolution 30j Pulse gérant (priorité moyenne)

**Fichier :** `src/pages/gerant/pulse.js`

Ajouter une section "📈 Tendance 30 jours" (Bloomberg style) :
```js
const { data: trend } = await sb.rpc('get_school_trend', { p_days: 30 });
// trend = [{ snapshot_date, validations_24h, quiz_24h, sessions_h_24h, eleves_at_risk, ... }]
```

Rendu : mini-line-chart 3 séries (validations / quiz / sessions h) avec couleurs accent indigo. Axe X = 30 derniers jours. Pas de lib externe (canvas ou SVG pur).

Position : juste après les 4 cards KPI principales, avant la section moniteurs.

### 🎯 CHANTIER C — Section "Mes révisions" élève (priorité haute, dopamine)

**Fichier nouveau :** `src/components/revision-cards.js`

```js
import { mountRevisionCards } from '@/components/revision-cards.js';
await mountRevisionCards(root, { eleveId: me.id, limit: 3 });
```

Fetch `get_revision_recommendations(me.id, 3)` → 3 cartes compactes :
- Couleur selon `reason` : `quiz_fails` rouge tendre, `old_validation` ambre, `consolidation_due` violet urgent
- Tap card → ouvre quiz de cette compétence (`#/quiz/{competence_id}/post_validation`)
- Si 0 reco → ne rien afficher

**Câblage :** dans `accueil.js`, ajouter mount entre la section "Trophées" et "Footer" (sauf si déjà 0 reco).

### 🔎 CHANTIER D — Drill comp difficile dans insights (priorité basse)

**Fichier :** `src/pages/enseignant/insights.js`

Le chantier 2 de l'audit a déjà câblé `.ins-diff-row` vers `#/eleves?bloque_sur={competence_id}`. Maintenant **côté `src/pages/enseignant/mes-eleves.js`** : lire le query param `bloque_sur` au mount, et si présent → fetch `get_eleves_bloque_sur_competence(competence_id, 30)` au lieu de la liste normale.

Header de la page indique : "🔎 Élèves bloqués sur C2a (4 élèves)" avec un bouton "Voir tous les élèves →" pour revenir à la liste normale.

### 📋 Ordre prioritaire

1. **A** — Standardiser notifs (impact cohérence) — gros impact, mais touche plusieurs fichiers
2. **C** — Section révisions élève (dopamine, mémoire espacée light) — peut être petit composant standalone
3. **B** — Graphe Pulse gérant (visibilité cockpit) — peut être très simple ou très polish
4. **D** — Drill mes-eleves (utile mais petit cas d'usage)

---

## [2026-05-18] 🆕 AUDIT UX ÉLÈVE + GÉRANT — Cleanup boutons

> **Contexte :** audit complet des 137 boutons cliquables sur tous les personas. Backend pagination feedback fixée côté Cowork. Reste 4 chantiers Claude Code.

### ✅ Backend Cowork
- ✅ RPC `get_eleve_feedback_feed` accepte maintenant `p_offset` (pagination fixée)

### 🔌 CHANTIER A — Câbler boutons morts (priorité haute)

**ÉLÈVE :**

**`src/pages/eleve/accueil.js`** :
- [ ] `.trophy-card.trophy-unlocked` (×3 cards sur accueil) — actuellement hover/cursor:pointer mais aucun handler. Ajouter listener → `location.hash = '#/trophees'` (ou `#/galerie` si tu préfères)
- [ ] `.trophy-card.trophy-locked` (next up) — même problème, câbler vers `#/parcours` (pour aller débloquer)

**`src/pages/eleve/parcours.js`** :
- [ ] Bloc "Examen" final (renderFinal, ~ligne 1532) — non-cliquable. Ajouter handler → `location.hash = '#/examen'`. Pulse animation + drapeau si 28+/31 acquises
- [ ] Empty state CTA `#prc-comp-first` ligne ~1361 — ancre morte. Remplacer par `location.hash = '#/parcours'` direct

**`src/pages/eleve/galerie.js`** :
- [ ] `.gal-card` (trophées) — cursor:pointer mais pas de handler. Soit ouvrir le bottom-sheet détail (réutiliser logique de `trophees.js`), soit retirer cursor:pointer

**`src/pages/eleve/feedback.js`** :
- [ ] `loadMore()` doit envoyer `p_offset: currentItems.length` à la RPC (backend supporte maintenant `p_offset`)

**GÉRANT :**

**`src/pages/gerant/pulse.js`** :
- [ ] `.team-row` (cartes enseignants équipe) — hover bleu mais pas câblé. Ajouter handler → `location.hash = '#/equipe'` (ou `#/livret-enseignant/<id>` si page existe)
- [ ] `.activity-row` — opportunity miss. Câbler → drill vers `#/livret/<eleve_id>` si la row concerne un élève

**`src/pages/gerant/equipe.js`** :
- [ ] `.eq-card` (carte enseignant) — pas de handler malgré le hover. Câbler vers une vue détail enseignant. Si pas de page fiche enseignant prête, ouvrir un bottom-sheet avec stats (validations 30j, n élèves, ranking position)

### 🚮 CHANTIER B — Émojis interdits côté gérant (ADN Bloomberg)

L'ADN gérant = Tesla + Airbnb + Bloomberg. Zéro émoji. Remplacer par icônes Lucide :

**`src/pages/gerant/eleves.js`** :
- [ ] Ligne ~325 : `🔍` dans search icon → `icon('search')` SVG
- [ ] Ligne ~408 : `🎓` dans empty state → `icon('graduation-cap')` ou retirer
- [ ] Ligne ~484 : bouton `#elqv-close` "Fermer" trop primaire (#6366f1) — utiliser style cancel (#f8f9fc + border #e2e6f2)

**`src/pages/gerant/equipe.js`** :
- [ ] Ligne ~288 : `🔍` search icon → `icon('search')`
- [ ] Ligne ~434 : `👥` empty state → `icon('users')` ou retirer
- [ ] Position bouton "+ Ajouter enseignant" ligne ~305 — déplacer dans le header (`.eq-hd-top`) pour cockpit pattern

**`src/pages/gerant/pulse.js`** :
- [ ] Ligne ~506 : fallback émoji `⚠️` dans le bandeau alerte → garantir SVG inline (pas de fallback string)

### 🎨 CHANTIER C — Différenciation icônes nav gérant

**`src/components/nav-bottom.js`** :
- [ ] Tabs "Équipe" et "Élèves" utilisent toutes les deux `ICO.users` — confusion. Changer :
  - Équipe → `icon('users')`
  - Élèves → `icon('user-check')` ou `icon('graduation-cap')`

### 🎨 CHANTIER D — Refonte visuelle (priorité moyenne)

**ÉLÈVE :**
- [ ] `parcours.js` : `.fiche-close (×)` → circle 36px style `.cs-close` du celebrate-screen (rgba blanc + blur)
- [ ] `feedback.js` : `.fb-back` ← flèche unicode → `icon('arrow-left')` propre
- [ ] `emotional-banner.js` : `.eb-close` rendre adaptatif au tone (border-color matching)
- [ ] `feedback.js` + `feedback-feed.js` : ajouter chevron qui rotate 180° au expand (affordance)
- [ ] `accueil.js` fallback erreur "Recharger" → illustration sad + ton plus Duolingo
- [ ] `chest.js` `.chest-cta` → text-shadow pour pop sur fond clair
- [ ] `session-confirmation-banner.js` : "Oui, c'est juste" → "✓ Confirmer" (plus net)

**GÉRANT :**
- [ ] `pulse.js` sparkline `.spark-bar` aujourd'hui → indigo saturé au lieu de jaune/orange (cohérence Bloomberg)
- [ ] `pulse.js` lien "Voir" dans bandeau alerte → vrai `<button>` (sémantique correcte)

### 🧹 CHANTIER E — Redondances à supprimer (priorité basse)

- [ ] `trophees.js` `#trp-close-btn` "Fermer" — redondant avec backdrop + swipe. Garder uniquement "Partager"
- [ ] `parcours.js` `#prc-back` ← legacy si nav-bottom couvre déjà. Soit retirer, soit sticky-scroll only
- [ ] `feedback.js` vs `feedback-feed.js` → mutualiser dans un composant avec `mode: 'page' | 'widget'`
- [ ] `galerie.js` vs `trophees.js` → fusionner en 1 page galerie avec onglets, ou supprimer une des deux pages

### 📋 Ordre de priorité Claude Code

1. **Chantier A** (boutons morts) — gros impact UX immédiat (8 fixes)
2. **Chantier B** (émojis gérant) — cohérence ADN, vite fait (6 fixes)
3. **Chantier C** (nav icônes) — 1 fix vital
4. **Chantier D** (refonte visuelle) — polish (~7 fixes)
5. **Chantier E** (redondances) — cleanup architectural

---

## [2026-05-18] 🆕 AUDIT UX ENSEIGNANT — Cleanup boutons + uniformisation icônes

> **Contexte :** audit complet UX/UI des 7 pages enseignant + composants moniteur. Le FAB log-session a été refait côté Cowork (style Apple sobre, circle 56px noir, plus de pulse infinie). Reste 3 chantiers Claude Code.

### 🚮 CHANTIER 1 — Supprimer les FAB locaux redondants

3 FAB superposés en bas droite sur `aujourdhui.js` et `mes-eleves.js`. Le `log-session-fab` du router suffit (et son modal couvre désormais log + validation).

**Fichier `src/pages/enseignant/aujourdhui.js`** :
- [ ] Retirer le `mountFab(...)` ligne ~463 (FAB local "Valider une compétence")
- [ ] Retirer le CTA sticky bas `#aj-btn-valider` lignes ~709 (bouton plein gradient violet)
- [ ] Le log-session-fab du router fait le job

**Fichier `src/pages/enseignant/mes-eleves.js`** :
- [ ] Retirer le `mountFab(...)` ligne ~352
- [ ] Retirer le CTA sticky `#me-btn-valider` ligne ~488
- [ ] Garder le log-session-fab du router

### 🔌 CHANTIER 2 — Câbler les boutons morts

**`src/pages/enseignant/insights.js`** :
- [ ] `.ins-reco-card` (recommandations) — actuellement non-cliquables. Ajouter handler `click` → navigate `#/livret/{eleve_id}` si la reco concerne un élève spécifique (data.topStagnent[0] ou data.topProgressent[0]), sinon `#/validation` pour les recos générales
- [ ] `.ins-diff-row` (compétences difficiles) — non-cliquables. Ajouter handler → ouvre un bottom sheet ou navigate vers `#/eleves?bloque_sur={competence_id}` (Cowork ajoutera ce filtre si demandé)

**`src/pages/enseignant/mes-eleves.js`** :
- [ ] Long press → action "📝 Ajouter une note rapide" affiche `toast('Bientôt 📝')` — soit câbler une vraie fonctionnalité (modal note libre + RPC Cowork à demander), soit RETIRER l'option du quick menu (préférer retirer pour ne pas promettre du vaporware)

### 🎨 CHANTIER 3 — Uniformiser émojis → icônes Lucide

L'ADN PermiGo est Apple + Linear (pas Duolingo côté enseignant/gérant). Les émojis font enfantin et incohérents avec la charte. À remplacer par `icon('xxx')` partout :

**`src/pages/enseignant/livret-remc.js`** :
- [ ] Statut buttons : `✅` → `icon('check-circle')`, `🔄` → `icon('refresh-cw')`, `⚠️` → `icon('alert-triangle')`
- [ ] "📜 Fil des moniteurs" → `icon('list')` ou `icon('clock')`

**`src/pages/enseignant/mes-eleves.js`** :
- [ ] Bannière `⚠️ N élève à relancer` → `icon('alert-circle')` + adoucir le fond (moins alerte agressive)
- [ ] Quick menu items : `✓` `→` `📝` → `icon('check')`, `icon('arrow-right')`, `icon('edit-3')`

**`src/pages/enseignant/validation.js`** :
- [ ] Bouton "🚀 Mode rapide" → `icon('zap')` + label "Mode rapide" (sans rocket)

**`src/pages/enseignant/insights.js`** :
- [ ] Tabs `📈 Progressent` / `⚠️ Stagnent` → `icon('trending-up')` + `icon('alert-triangle')` (déjà partiellement Lucide, vérifier homogénéité)
- [ ] Reco cards émojis `🎯 ⚠️ 🔍 ✅` → icônes Lucide cohérentes

### 🧹 CHANTIER 4 — Nettoyage logique tabs mes-eleves.js

- [ ] Fusionner les onglets "Inactifs" et "À relancer" : sémantiquement c'est presque pareil (≥14j sans validation). Garder UN seul onglet "À relancer" (≥14j). L'onglet "Inactifs" actuel apporte de la confusion.
- [ ] Swipe LEFT sur row élève = navigate livret/{id} (identique au click). REDONDANT. Soit changer pour un autre raccourci (genre marquer "vu"), soit retirer.

### 📋 Coordination

**Côté Cowork (déjà fait) :**
- ✅ FAB log-session refait (`src/components/log-session-fab.js`) — style Apple circle 56px, ombre douce, pas de pulse infinie

**Côté Claude Code (à faire — ordre de priorité) :**
1. Chantier 1 (supprimer FAB redondants) — priorité top, gros impact visuel immédiat
2. Chantier 3 (uniformiser icônes) — priorité haute, cohérence charte
3. Chantier 2 (câbler boutons morts) — priorité moyenne
4. Chantier 4 (cleanup tabs) — priorité basse, petite ambiguïté

---

## [2026-05-18] 🆕 LOG SESSION v2 — Fusion atomique session + comp + commentaire

> **Concept :** la modal "Log session" devient l'**outil unique** moniteur. En 1 submit : log durée + valider compétences (optionnel) + commentaire (visible élève + autres moniteurs). Plus de double saisie.

### ✅ Backend déployé (Cowork)

**RPC `log_session` étendue :**
```js
const { data, error } = await sb.rpc('log_session', {
  p_eleve_id: eleveId,
  p_duration_minutes: 120,
  p_session_date: '2026-05-18',
  p_notes: null,                          // fallback si pas de commentaire
  p_competence_ids: ['C1a', 'C1b'],       // 🆕 array optionnel
  p_comment: 'Belle séance ! Tu maîtrises bien le freinage.'  // 🆕 visible élève + moniteurs
});

// Retour :
{
  ok: true,
  session: { id, duration_minutes, session_date, notes, ... },
  validations: [
    { competence_id: 'C1a', created: true },
    { competence_id: 'C1b', created: false, reason: 'already_acquired' }
  ]
}
```

**Nouvelles RPC :**
```js
// Comp NON-validées d'un élève (pour les chips de la modal)
const { data } = await sb.rpc('get_eleve_pending_competences', { p_eleve_id: eleveId });
// → [{ competence_id, code: 'C1a', monde: 1, ordre: 1, nom: 'Organes, commandes, vérifications' }]

// Timeline feedback (visible élève + moniteurs même école)
const { data } = await sb.rpc('get_eleve_feedback_feed', {
  p_eleve_id: eleveId,  // null = mon propre feed (élève voit le sien)
  p_limit: 30
});
// → [{ kind: 'session'|'validation', ts, moniteur_prenom, moniteur_nom, competence_id, duration_minutes, comment, confirmation_status }]
```

### 🎨 Frontend à faire

#### A. Modal log-session étendue — `src/components/log-session-modal.js`

**Ajouter 2 nouvelles sections** après les 3 existantes :

**D. Compétences travaillées** (optionnel)
- Fetch `get_eleve_pending_competences(eleveId)` quand l'élève change
- Affiche chips groupées par monde (Monde 1, 2, 3, 4)
- Multi-select, tap pour toggle
- Header : "Tu as validé une compétence aujourd'hui ?" + compteur "X sélectionnées"
- Skippable (zéro friction si juste session pure)

**E. Commentaire** (optionnel mais encouragé)
- Textarea max 500 chars
- Placeholder selon contexte :
  - Si 0 comp sélectionnée : "Comment s'est passée la séance ? (visible élève + autres moniteurs)"
  - Si N comp sélectionnées : "Pourquoi tu valides ces compétences ? (visible élève + autres moniteurs)"
- Au-dessus de la textarea : badge "👁 Visible élève + autres moniteurs"
- Compteur de chars discret en bas-droite

**Submit** : appelle `log_session` avec p_competence_ids + p_comment. Toast vert :
- Si validations created : "+10 XP · 2 compétences validées 🎉"
- Sinon : "+10 XP · Session loggée"

#### B. Composant feedback feed élève — `src/components/feedback-feed.js`

Section "Retours de tes moniteurs" sur l'accueil élève (entre streak et trophées) :
```js
import { mountFeedbackFeed } from '@/components/feedback-feed.js';
await mountFeedbackFeed(root, { eleveId: me.id, limit: 5 });
```

Affichage :
- Carte par event (session validée OU validation)
- Avatar moniteur + prénom + temps relatif (il y a 2h, hier, etc.)
- Si session : icône `clock` + "1h30 de conduite avec toi"
- Si validation : icône `check-circle` vert + nom de la compétence
- Commentaire (si présent) en italique
- Tap → expand pour voir tout le détail
- Bouton "Voir tout le fil →" → ouvre `#/feedback` (page complète)

#### C. Timeline feedback livret REMC — `src/pages/enseignant/livret-remc.js`

Dans la vue détail élève côté enseignant, ajouter une section :
- "📜 Fil des moniteurs (transmission)"
- Liste les events des 30 derniers jours
- Permet à Lassaad de voir ce que Rayan a fait avec Sherine
- Cherche le commentaire en premier plan, le détail comp/durée en sous-info

#### D. (Optionnel) Page complète feedback élève — `src/pages/eleve/feedback.js`

Route `#/feedback` qui affiche tout le fil chronologique (pagination 30 par 30).

### 📋 Coordination

**Pré-requis : RPC dispo immédiatement** (backend déployé).

Order recommandé :
1. A (modal étendue) — gros impact UX
2. B (feedback feed accueil) — dopamine pour l'élève
3. C (timeline livret) — transmission moniteurs
4. D (page complète) — nice-to-have

### ✅ Frontend DONE (Claude Code — 2026-05-18)

A, B, C, D tous implémentés. ✅ Route `#/feedback` câblée dans router.js par Cowork.

---

## [2026-05-18] 🆕 CHANTIER PERMIGO LOG — Sessions moniteur (zéro planning, full gamif)

> **Concept :** PermiGo n'est PAS un outil de planning. Le moniteur log ses sessions APRÈS coup en 3 taps. L'élève confirme (anti-triche). Ranking moniteur 4-dim. ADN = Uber Driver + Apple.
> **Détail produit complet** dans la conversation Cowork du 2026-05-18.

### ✅ Backend DÉPLOYÉ en prod le 2026-05-18 (Cowork)

**Table `sessions_moniteur`** :
```sql
CREATE TABLE sessions_moniteur (
  id uuid PK,
  moniteur_id uuid → profiles,
  eleve_id uuid → profiles,
  duration_minutes int CHECK (IN (30,45,60,90,120,150,180)),
  session_date date,            -- jour réel de la session
  logged_at timestamptz,        -- horodatage saisie
  confirmation_status text,     -- 'pending'|'confirmed'|'refused'|'auto'
  confirmed_at timestamptz,
  flagged boolean,
  notes text
);
```

**RPC disponibles (à utiliser côté Claude Code) :**

```js
// 1. Logger une session (côté moniteur)
const { data, error } = await sb.rpc('log_session', {
  p_eleve_id: eleveId,
  p_duration_minutes: 120,    // 30|45|60|90|120|150|180
  p_session_date: '2026-05-18', // YYYY-MM-DD, max 48h ago
  p_notes: null
});
// Retour : { ok: true, session: {...} } OU { error: 'cap_daily_exceeded'|'cap_weekly_exceeded'|'session_too_old'|'invalid_duration' }

// 2. Confirmer/refuser une session (côté élève)
await sb.rpc('confirm_session', {
  p_session_id: id,
  p_status: 'confirmed'  // 'confirmed' | 'refused'
});

// 3. Sessions à confirmer pour l'élève (banner home élève)
const { data } = await sb.rpc('get_my_pending_sessions');
// Retour : [{ id, moniteur_prenom, duration_minutes, session_date }]

// 4. Récap journée moniteur (widget soir accueil)
const { data } = await sb.rpc('get_my_today_sessions');
// Retour : [{ id, eleve_prenom, duration_minutes, confirmation_status }]

// 5. Suggestions smart (habitudes)
const { data } = await sb.rpc('suggest_next_session', {
  p_day_of_week: 2  // 0=dimanche, 1=lundi...
});
// Retour : [{ eleve_id, eleve_prenom, typical_duration, last_seen_at, score }]

// 6. Ranking moniteurs du mois (Pulse gérant + Profil moniteur)
const { data } = await sb.rpc('get_moniteur_ranking', {
  p_month: '2026-05-01'  // 1er du mois, défaut = mois courant
});
// Retour : [{ moniteur_id, moniteur_prenom, score_total, hours_confirmed, n_validations, n_eleves_diff, n_jours_actifs, rank }]
```

**Garde-fous appliqués côté DB (CHECK + trigger BEFORE INSERT) :**
- Cap 10h/jour par moniteur (CHECK contre SUM existant)
- Cap 50h/semaine par moniteur
- Session date max 48h dans le passé
- Duration valide uniquement (30/45/60/90/120/150/180 min)
- Insert auto crée une notif `session_confirmation` pour l'élève
- pg_cron `auto-confirm-sessions-daily` à 03h UTC qui passe `pending` → `auto` après 7j

**dispatch-push v4** ajoute le type `session_confirmation` qui rend :
- title : `Confirme ta session avec {moniteur_prenom}`
- body : `{duration_minutes} min · {date_lisible}`
- route : `#/` (accueil élève — la bannière de confirmation se trouve là)

### 🎨 Frontend à faire (pour Claude Code)

#### 3.1 FAB "+ Session" — composant `src/components/log-session-fab.js`

Bouton flottant rond en bas-droite, visible sur **toutes les pages moniteur** (enseignant + gerant si gérant fait aussi de la conduite). Icône `plus`, accent indigo, animation pulse subtile.

```js
import { mountLogSessionFab } from '@/components/log-session-fab.js';

// Dans router.js ou main.js, après route enseignant/gerant :
if (me.role === 'enseignant' || me.role === 'gerant') {
  mountLogSessionFab(document.body);
}
```

Tap → ouvre modal `log-session-modal.js`.

#### 3.2 Modal log session — `src/components/log-session-modal.js`

3 sections, scroll vertical :

**A. Choix élève** : liste avec dernière session pré-cochée. Pull suggestions de `suggest_next_session(today_day_of_week)`. Search box si beaucoup d'élèves.

**B. Durée** : 7 chips one-tap : `30min · 1h · 1h15 · 1h30 · 2h · 2h30 · 3h`. Sélection par défaut = 1h30. Style chips ronds avec accent quand sélectionnés.

**C. Jour** : 3 chips horizontaux : `Aujourd'hui · Hier · Avant-hier`. Par défaut "Aujourd'hui". Au-delà = 48h = bloqué côté DB.

**Submit** :
- Toast vert "+10 XP · Session loggée" 
- Appel `log_session()` 
- Si error : affiche raison ('cap_daily_exceeded' → "Tu as déjà 10h aujourd'hui", etc.)
- Si success : ferme modal + maj cache local si dispo

#### 3.3 Bannière confirmation élève — `src/components/session-confirmation-banner.js`

Sur l'accueil élève, si `get_my_pending_sessions()` retourne >=1 session :

Carte premium avec :
- "Rayan a déclaré 2h de conduite avec toi mardi"
- 2 boutons : `[✓ Oui c'est juste]` (vert) · `[✗ Non]` (rouge léger)
- Tap → `confirm_session(id, 'confirmed'|'refused')` + retire de la liste
- Si plusieurs sessions à confirmer : stack vertical

#### 3.4 Widget récap soir — `src/pages/enseignant/aujourdhui.js`

Si l'heure locale > 18h, afficher en haut un widget :
```
🌙 Ta journée
3 sessions loggées · 6h totales
[2 confirmées par tes élèves]
```

Si gap >48h sans log un jour habituel : afficher "💭 Tu as fait conduire hier ? Tape pour logger."

#### 3.5 Ranking moniteur

**Côté Pulse gérant** : section "🏆 Top moniteurs ce mois" avec top 3, chacun avec son score + 4 sous-métriques (heures · validations · élèves · jours actifs).

**Côté Profil moniteur** : sa position dans le ranking + ses 4 métriques perso + comparaison vs moniteur n+1.

### 📋 Order recommandé

1. 3.2 Modal (cœur du flow)
2. 3.1 FAB (déclencheur)
3. 3.3 Bannière confirmation élève (boucle anti-triche)
4. 3.5 Ranking (le truc gratifiant)
5. 3.4 Widget récap soir (cherry on top)

### 🚫 Hors-scope (ne PAS faire)

- ❌ Pas de calendrier ni planning à l'avance
- ❌ Pas de récurrence hebdo
- ❌ Pas de sync Google Calendar
- ❌ Pas de géoloc

### 📋 Demandes Claude Code → router.js / main.js

#### FAB log session ✅ TRAITÉ (router.js : mount/unmount selon role)

```js
// Dans router.js, après le mount de chaque page enseignant :
import { mountLogSessionFab, unmountLogSessionFab } from '@/components/log-session-fab.js';

// À ajouter dans le beforeUnmount / unmount de chaque page enseignant :
unmountLogSessionFab();

// À ajouter après le mount de chaque page enseignant :
mountLogSessionFab();

// Pages concernées : tous les hash routes #/enseignant/* 
// (aujourd'hui, mes-eleves, fiche-eleve, livret-remc, planning, validation)
```

---

## [2026-05-18] 🆕 CHANTIER COFFRES + NOTIFS ÉMOTIONNELLES — pour Claude Code

> **Contexte :** Cowork prépare le backend (table `chest_unlocks`, RPC `unlock_chest` / `open_chest` / `get_my_chests`, edge function `send-emotional-nudge` + pg_cron 11h Paris). Claude Code prend tout le frontend.

### ✅ BACKEND DISPONIBLE (déployé en prod le 2026-05-18)

- ✅ Table `chest_unlocks` (RLS user reads own) + CHECK constraint sur les 8 types valides
- ✅ RPC `unlock_chest(p_chest_type text, p_rewards jsonb)` → idempotent, retourne `{unlocked|already_unlocked, chest}`
- ✅ RPC `open_chest(p_chest_type text)` → retourne `{opened, chest}` ou `{error: 'already_opened'|'not_unlocked', chest?}`
- ✅ RPC `get_my_chests()` → SETOF chest_unlocks ORDER BY unlocked_at DESC
- ✅ Types valides : `world_1`, `world_2`, `world_3`, `world_4`, `streak_7`, `streak_14`, `streak_30`, `perfect_quiz`
- ✅ Edge function `dispatch-push` v3 (handle `emotional_nudge` en lisant title/body/route/tone/cta depuis data)
- ✅ Trigger DB `send_push_on_notification_insert` whitelist mise à jour avec `emotional_nudge`
- ✅ Edge function `send-emotional-nudge` v1 déployée (verify_jwt=false)
- ✅ pg_cron `send-emotional-nudge-daily` actif à `0 10 * * *` UTC (11h Paris été, 12h hiver)
- ✅ Anti-spam : skip si emotional_nudge déjà envoyée dans les 36h précédentes
- ✅ Templates côté edge function (5 + 1 fallback) : `palier_1`, `palier_2`, `come_back_3d`, `come_back_7d`, `week_summary`, `micro_victoire`

Le payload `data` de la notif émotionnelle a cette shape :
```json
{
  "template_id": "palier_2",
  "tone": "celebrate",         // 'urgent' | 'celebrate' | 'warm' | 'gentle'
  "title": "🔥 Tu y es presque !",
  "body":  "Plus que 2 compétences pour atteindre le palier 10",
  "cta":   "Continuer",
  "route": "#/parcours"
}
```

**Logique de sélection (priorité descendante) côté edge function :**
1. `come_back_7d` si 7-30 jours sans validation
2. `come_back_3d` si 3-6 jours sans validation
3. `palier_1` si 1 comp avant palier (10/15/20/25/30)
4. `palier_2` si 2 comp avant palier
5. `week_summary` si dimanche UTC + ≥1 validation cette semaine
6. `micro_victoire` (fallback) si 5+ comp acquises et activité <= 2j

Le frontend `emotional-banner.js` doit donc juste lire `notifications WHERE type='emotional_nudge' AND read_at IS NULL` et rendre selon `data.tone`.

### 🎁 PARTIE 1 — Coffres (persistance DB + extension triggers)

#### 1.1 Migrer `game-state.js` localStorage → DB

**Fichier :** `src/utils/game-state.js`

Remplacer le système localStorage `LS_CHESTS_OPENED` par les RPC Supabase :

```js
// Nouvelle API attendue (utilise les RPC qui seront dispo bientôt côté Cowork) :

// Récupère tous les coffres (débloqués + ouverts) de l'utilisateur
export async function getMyChests() {
  const { data, error } = await sb.rpc('get_my_chests');
  if (error) { console.error('[chests]', error); return []; }
  return data; // [{ id, user_id, chest_type, unlocked_at, opened_at, rewards }]
}

// Débloque un coffre (idempotent — si déjà débloqué, retourne l'existant)
export async function unlockChest(chestType, rewards) {
  const { data, error } = await sb.rpc('unlock_chest', {
    p_chest_type: chestType,  // 'world_1' | 'world_2' | 'world_3' | 'world_4' | 'streak_7' | 'streak_14' | 'streak_30' | 'perfect_quiz'
    p_rewards: rewards         // { xp: 200, gemmes: 50, title: '...' }
  });
  if (error) { console.error('[chests]', error); return null; }
  return data; // { unlocked: true, chest: {...} } OU { already_unlocked: true, chest: {...} }
}

// Marque un coffre comme ouvert (déclenché par la modal)
export async function openChest(chestType) {
  const { data, error } = await sb.rpc('open_chest', {
    p_chest_type: chestType
  });
  if (error) { console.error('[chests]', error); return null; }
  return data; // { opened: true, chest: {...} }
}
```

⚠️ Garder une **cache localStorage** par-dessus pour éviter les flash (fetch initial → cache → invalidation à chaque unlock/open).

#### 1.2 Étendre les triggers de coffres

Actuellement : 1 coffre par monde REMC complété (4 mondes). À ajouter :

| Trigger | chest_type | Rewards |
|---|---|---|
| Streak 7 jours | `streak_7` | `{ xp: 150, gemmes: 30, title: 'Persévérant' }` |
| Streak 14 jours | `streak_14` | `{ xp: 350, gemmes: 80, title: 'Constant' }` |
| Streak 30 jours | `streak_30` | `{ xp: 800, gemmes: 200, title: 'Inarrêtable' }` |
| Quiz parfait (100%) | `perfect_quiz` | `{ xp: 100, gemmes: 25, title: 'Précision' }` |

**Où câbler :**
- Streak : dans `updateStreak()` de `game-state.js`, après increment, check si le nouveau count = 7/14/30 → `unlockChest('streak_X', rewards)`
- Quiz parfait : dans la page quiz (`src/pages/eleve/quiz.js`), à la fin du quiz si score = 100% → `unlockChest('perfect_quiz', rewards)` — UNIQUE par utilisateur (déjà géré par la contrainte UNIQUE de la table, l'appel est idempotent)

#### 1.3 Vérifier câblage parcours

**Fichier :** `src/pages/eleve/parcours.js`

S'assurer que `renderChest({ worldNum, worldName })` est bien appelé à la fin de chaque monde quand les 8 sous-comp sont validées. Au mount, appeler `unlockChest('world_X', { xp: ..., gemmes: ... })` pour persister.

---

### 🔔 PARTIE 2 — Notifs émotionnelles intelligentes

#### 2.1 Library de templates émotionnels

**Fichier à créer :** `src/data/emotional-nudges.js`

```js
/**
 * Templates émotionnels intelligents pour push + bannière in-app.
 * Le sélecteur côté edge function choisit selon le contexte utilisateur
 * (streak, comp count, jour, heure, dernière activité).
 *
 * Catégories :
 *  - palier_proche    : "à X comp du palier suivant"
 *  - record           : "personne n'a battu ton record"
 *  - validation_mono  : "ton moniteur t'a validé X"
 *  - streak_warm      : "garde la flamme"
 *  - retour           : "ça fait Xj, viens 5min"
 *  - examen_proche    : "plus que Xj avant ton examen"
 *  - micro_victoire   : "tu as fait X cette semaine"
 *
 * Chaque template :
 *   - title (max 50 chars, emoji autorisé en tête)
 *   - body (max 100 chars)
 *   - cta (label bouton bannière)
 *   - route (hash route si cta cliqué)
 *   - tone : 'warm' | 'urgent' | 'celebrate' | 'gentle'
 */

export const EMOTIONAL_NUDGES = [
  // ── palier_proche ──
  { id: 'palier_2', cat: 'palier_proche', tone: 'celebrate',
    title: '🔥 Tu y es presque !',
    body: 'Plus que {n} compétences pour atteindre le palier {target}',
    cta: 'Continuer', route: '#/parcours' },
  { id: 'palier_1', cat: 'palier_proche', tone: 'urgent',
    title: '⚡ Une seule compétence',
    body: 'Une seule compétence te sépare du palier {target} 💪',
    cta: 'Y aller', route: '#/parcours' },

  // ── streak_warm ──
  { id: 'streak_save', cat: 'streak_warm', tone: 'urgent',
    title: '🔥 Ta flamme s\'éteint',
    body: 'Plus que quelques heures pour garder ta série de {streak} jours',
    cta: 'Sauver ma série', route: '#/parcours' },
  { id: 'streak_milestone_close', cat: 'streak_warm', tone: 'celebrate',
    title: '🔥 Tu touches le jalon',
    body: 'Demain c\'est le palier {milestone} jours. Tu vas y arriver',
    cta: 'Garder la flamme', route: '#/parcours' },

  // ── record ──
  { id: 'record_week', cat: 'record', tone: 'celebrate',
    title: '👑 Personne ne fait mieux',
    body: 'Tu es l\'élève le plus actif cette semaine dans ton école',
    cta: 'Voir mon profil', route: '#/profil' },

  // ── validation_mono ──
  { id: 'validation_fresh', cat: 'validation_mono', tone: 'celebrate',
    title: '🎉 Validation !',
    body: '{teacher_name} vient de te valider "{competence_name}"',
    cta: 'Voir', route: '#/parcours' },

  // ── retour ──
  { id: 'come_back_3d', cat: 'retour', tone: 'gentle',
    title: '👋 Ton parcours t\'attend',
    body: 'Ça fait 3 jours. 5 minutes suffisent pour reprendre le rythme',
    cta: 'Reprendre', route: '#/parcours' },
  { id: 'come_back_7d', cat: 'retour', tone: 'warm',
    title: '💙 On pense à toi',
    body: 'Une semaine sans toi. Reviens quand tu veux, on est là',
    cta: 'Revenir', route: '#/accueil' },

  // ── examen_proche ──
  { id: 'exam_30d', cat: 'examen_proche', tone: 'celebrate',
    title: '🎯 J-30 examen',
    body: 'Plus qu\'un mois ! Tu en es à {acquired}/31. Continue comme ça',
    cta: 'Mon examen', route: '#/examen' },
  { id: 'exam_7d', cat: 'examen_proche', tone: 'urgent',
    title: '⏰ J-7 examen',
    body: 'Dernière semaine. Révise les compétences clés',
    cta: 'Réviser', route: '#/parcours' },

  // ── micro_victoire ──
  { id: 'week_summary', cat: 'micro_victoire', tone: 'celebrate',
    title: '✨ Belle semaine',
    body: 'Tu as validé {n_comp} compétences et joué {n_quiz} quiz. Bravo',
    cta: 'Voir mon bilan', route: '#/accueil' },
];

/**
 * Hydrate le template avec les variables du contexte utilisateur.
 * @example
 *   hydrate(template, { n: 2, target: 10 })
 *   → { title: '🔥 Tu y es presque !', body: 'Plus que 2 compétences pour atteindre le palier 10', ... }
 */
export function hydrate(template, vars = {}) {
  const replace = (str) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  return {
    ...template,
    title: replace(template.title),
    body: replace(template.body),
  };
}

export function findById(id) {
  return EMOTIONAL_NUDGES.find(n => n.id === id) || null;
}
```

#### 2.2 Composant bannière in-app émotionnelle

**Fichier à créer :** `src/components/emotional-banner.js`

Bannière premium qui apparaît en haut de l'accueil élève si une notif émotionnelle non-lue est dispo (lookup `notifications` WHERE `type LIKE 'emotional_%' AND read_at IS NULL`).

Specs :
- Apparaît avec animation slide-down + halo selon `tone`
- Tone `warm` → dégradé orange/rouge
- Tone `urgent` → pulse subtle + chrono visible si streak risk
- Tone `celebrate` → confetti micro + gradient violet/rose
- Tone `gentle` → bleu doux, slow fade-in
- CTA → `navigate(template.route)` + `mark_as_read`
- Croix discrete top-right → `mark_as_read` sans naviguer
- Auto-dismiss après 12s si pas interaction (mais reste dans bell)

Pattern attendu :
```js
import { emotionalBanner } from '@/components/emotional-banner.js';

// Dans accueil.js mount() :
await emotionalBanner.checkAndRender(root);
```

#### 2.3 Câblage accueil élève

**Fichier :** `src/pages/eleve/accueil.js`

Ajouter au début du `mount()`, après le check user :
```js
import { emotionalBanner } from '@/components/emotional-banner.js';
// ...
await emotionalBanner.checkAndRender(root);
```

---

### 📋 Coordination

**Côté Cowork (zone interdite — en cours) :**
- [ ] Migration `chest_unlocks` table + RLS
- [ ] RPC `unlock_chest`, `open_chest`, `get_my_chests`
- [ ] Edge function `send-emotional-nudge` (sélecteur de templates contextuels)
- [ ] pg_cron : `0 10 * * *` (= 11h Paris, sweet spot pause matinée)

**Côté Claude Code (à toi) :**
- [ ] 1.1 — Migrer `game-state.js` localStorage → DB
- [ ] 1.2 — Étendre triggers (streak 7/14/30 + quiz parfait)
- [ ] 1.3 — Vérifier câblage parcours
- [ ] 2.1 — `src/data/emotional-nudges.js`
- [ ] 2.2 — `src/components/emotional-banner.js`
- [ ] 2.3 — Câblage accueil élève

**Pré-requis avant de coder :**
Attendre que Cowork ait push le commit avec les 3 RPC + edge function. Cowork écrira ✅ DISPONIBLE ici quand prêt.

---

## [2026-05-18] RPC `get_bilan_data` disponible pour LIVRABLE 3 (bilan trimestriel)

**Pour Claude Code :** pour ta page `src/pages/enseignant/bilan.js`, utilise la RPC
Supabase plutôt que de faire 5-6 queries séparées (gain perf énorme + comment
pédagogique auto-généré côté DB).

**Usage** :
```js
const { data, error } = await sb.rpc('get_bilan_data', {
  p_eleve_id: eleveId,
  // p_trimestre_start optionnel — défaut = trimestre en cours
});
```

**Retour** (jsonb) :
```ts
{
  eleve: { id, prenom, nom },
  trimestre_start, trimestre_end,
  kpi: {
    acquises_now, acquises_prev, delta_pct,
    quiz_total, quiz_reussis, score_moyen,
    jours_actifs, jours_total
  },
  by_monde: { "C1": [{competence_id, validated_at}, ...], "C2": [...], ... },
  evolution: [{ month: "janv.", count: 3 }, { month: "févr.", count: 5 }, ...],
  comment: "Bonne dynamique. 12 compétences..."
}
```

**Avantages** :
- 1 round-trip DB au lieu de 5
- Index optimisés sur validations.validated_at + (eleve_id, validated_at)
- Commentaire pédago auto rule-based (5 paliers)
- Delta % vs trimestre précédent pré-calculé

---

## [2026-05-18] Route bilan trimestriel enseignant ✅ TRAITÉ
*(route `bilan` ajoutée dans enseignant + gerant. Pattern : `#/bilan/{eleveId}` — le param est passé en 2e arg de mount)*

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'bilan/:eleveId'` qui pointe vers `src/pages/enseignant/bilan.js`

```js
// Dans le router, section routes enseignant (avec param eleveId) :
'bilan/:eleveId': (params) => import('./pages/enseignant/bilan.js').then(m => m.mount(root, params.eleveId)),
```

Ou équivalent selon le pattern de paramètres du router actuel.

**Contexte :** `bilan.js` attend `mount(root, eleveId)`. La page est print-friendly (@media print). La RPC `get_bilan_data` est documentée dans le TODO ci-dessus (section "RPC get_bilan_data disponible").

---

## [2026-05-18] Route examen élève ✅ TRAITÉ
*(route `examen` ajoutée dans eleve)*

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'examen'` qui pointe vers `src/pages/eleve/examen.js`

```js
// Dans le router, section routes élève :
'examen': () => import('./pages/eleve/examen.js'),
```

Et dans la nav bar élève (si elle existe) :
- Ajouter un lien "Mon examen" avec l'icon `award` ou `graduation-cap`
- Route : `#/examen`

**Contexte :** La page `examen.js` est complète. Elle affiche le compte à rebours jusqu'à l'examen B (date stockée dans localStorage), une checklist "Suis-je prêt ?" (5 critères) et des conseils.

---

## [2026-05-18] Route insights enseignant ✅ TRAITÉ

**Fichier :** `src/router.js`  
**Demande :** Ajouter la route `'insights'` qui pointe vers `src/pages/enseignant/insights.js`

```js
// Dans le router, section routes enseignant :
'insights': () => import('./pages/enseignant/insights.js'),
```

Et dans la nav bar enseignant (si elle existe dans `src/components/` ou `src/main.js`) :
- Ajouter un lien "Insights" avec l'icon `chart-bar` ou `activity`
- Route : `#/insights`

**Contexte :** La page `insights.js` est complète et déployée. Elle ne sera accessible qu'une fois la route câblée.

---
