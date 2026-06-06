# MASTER PROMPT — BUGS & UX FIXES (Session 2026-06-06)

**Durée estimée :** 2-3h  
**Copie ce prompt entier dans Claude Code.**

---

## STATUS

6 bugs/UX pain points identifiés à corriger avant client contact.

---

## BUG 1 : MUSIQUE D'ACCUEIL (TRAP) TROP LOUD

**Problème :** La musique d'accueil est trap, trop loud, rend fou → doit être silencieuse par défaut.

**Fichiers :**
- `src/utils/sound.js` — gestion audio globale
- `src/pages/public/landing.js` — landing page (où elle joue)
- `src/pages/auth/login.js` — si elle joue aussi au login

**Solution :**
```javascript
// Dans sound.js : ajouter volume par défaut = 0 ou très faible
const AUDIO_CONFIG = {
  autoplay: false,          // ← NE PAS autoplay
  defaultVolume: 0.1,       // ← 10% volume max (pas 100%)
  fadeInDuration: 500,      // ← fade in doux si l'utilisateur active
};

// Au login/landing : ne PAS appeler playBgm() automatiquement
// Laisser l'utilisateur activer le son via toggle (profil/settings)
```

**Vérifier :**
- Landing page NOT joue musique au chargement
- Login page NOT joue musique au chargement
- Toggle son dans profil fonctionne
- Volume par défaut = 0.1 (10%)

---

## BUG 2 : FAB "SÉANCE" SUPERPOSÉ AVEC BOUTON "+"

**Problème :** Sur `#/enseignant/` (accueil moniteur), le FAB "Séance" (en bas à droite) se superpose avec un bouton "+" (ou autre). Clash visuel + clics confus.

**Fichiers :**
- `src/pages/enseignant/aujourdhui.js` — page accueil moniteur
- `src/components/common/nav-bottom.js` — FAB style (rechercher `#bn-seance-fab`)

**Cause possible :**
- FAB position: `right: 20px; bottom: calc(76px + env(safe-area-inset-bottom, 0px));`
- Un autre élément (bouton action) occupe la même zone

**Solution :**
1. Vérifier s'il y a un bouton "+" dans `aujourdhui.js` → le supprimer OU le repositionner
2. Si le "+" est une feature (ex: "Ajouter élève"), le mettre ailleurs (dans nav-bottom ou menu)
3. Garder SEUL le FAB dans sa zone (bottom-right)

**Vérifier :**
- Aucun overlap visuel
- FAB "Séance" clickable sans ambiguïté
- Pas de second bouton action qui traîne en bas à droite

---

## BUG 3 : LOG-SESSION — ÉLÈVES NON TRIÉS ALFABÉTIQUEMENT + FORCE SWIPE EN BAS

**Problème :** Quand on enregistre une séance (clique sur "Séance"):
1. La liste des élèves n'est pas triée alphabétiquement (ordre aléatoire/DB order)
2. Il faut swiper jusqu'en bas de la list pour voir les derniers élèves
3. Quand on choisit un élève, ça devrait le sélectionner DIRECTEMENT, pas forcer un scroll/swipe

**Fichiers :**
- `src/pages/enseignant/log-session.js` — page validation/séance
- `src/components/enseignant/user-list-card.js` — composant affichage élèves (probablement)

**Solution :**

```javascript
// Dans log-session.js ou user-list-card.js :
// 1. Trier élèves par NOM alphabétiquement
const { data: eleves } = await sb
  .from('profiles')
  .select('id, nom, prenom, avatar_url, ...')
  .eq('school_id', me.school_id)
  .order('nom', { ascending: true })  // ← TRI ALFABÉTIQUE
  .order('prenom', { ascending: true });

// 2. Quand on clique sur un élève → sélectionner DIRECTEMENT
// (pas demander confirmation, pas forcer scroll)
eleveCard.addEventListener('click', (e) => {
  const eleveId = e.currentTarget.dataset.eleveId;
  selectedEleve = eleves.find(e => e.id === eleveId);  // ← sélection directe
  // Passer au step suivant (compétence) SANS animation/scroll
  showCompetencyStep(selectedEleve);
});
```

**Vérifier :**
- Liste élèves triée A→Z par nom (Dupont avant Gonzalez)
- Clic sur élève = sélection directe + passage immédiat au step compétence
- Pas de swipe/scroll forcé

---

## BUG 4 : SÉLECTION COMPÉTENCE — ZOOM BUG (CHIPS)

**Problème :** Quand on sélectionne une compétence (chips/boutons), ça fait un bug de zoom : la page zoom in, on doit dézoomer manuellement. C'est chiant.

**Fichiers :**
- `src/pages/enseignant/log-session.js` — étape sélection compétence
- Possible: CSS sur `.comp-chip` ou élément parent

**Cause probable :**
- Double-tap zoom activé sur élément (par défaut navigateur mobile)
- Click sur chip → interprété comme double-tap → zoom
- Ou font-size qui change dynamiquement et déclenche zoom automatique

**Solution :**

```css
/* Dans log-session.js ou global styles */
.comp-chip,
.comp-chip-container {
  touch-action: manipulation;  /* ← DÉSACTIVE double-tap zoom */
  user-select: none;            /* ← évalue selection sur click */
  -webkit-user-select: none;    /* ← webkit */
  -webkit-touch-callout: none;  /* ← iOS */
}

/* Ou: empêcher tout zoom au niveau du viewport */
/* Dans <head> index.html : */
/* <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"> */
```

**Ou en JS :**
```javascript
// Bloquer zoom sur click compétence
const chips = root.querySelectorAll('.comp-chip');
chips.forEach(chip => {
  chip.addEventListener('touchstart', (e) => {
    e.preventDefault();  // ← empêche interprétation double-tap
  }, { passive: false });
});
```

**Vérifier :**
- Clic sur chip = pas de zoom
- Page reste à 100% zoom
- Sélection compétence fluide

---

## BUG 5 : TUTORIEL ÉLÈVE S'AFFICHE À CHAQUE LOGIN

**Problème :** À chaque fois qu'un élève se connecte, le tutoriel (onboarding) s'affiche. Une fois suffit. C'est aussi dans Profil si on veut le revoir.

**Fichiers :**
- `src/pages/eleve/accueil.js` (ou`eleve/onboarding.js` si existe)
- `src/utils/game-state.js` — localStorage user prefs
- Likely: `src/main.js` ou `src/router.js` — boot sequence

**Cause :**
- Flag `permigo_onboarding_done` ou similaire NOT persistant
- Ou flag sauvé en localStorage mais pas checké au boot

**Solution :**

```javascript
// Dans game-state.js ou où le flag est sauvé :
const ONBOARDING_KEY = 'permigo_eleve_onboarding_done';

export function hasCompletedOnboarding(userId) {
  const stored = localStorage.getItem(`${ONBOARDING_KEY}_${userId}`);
  return stored === '1';  // ← check at boot
}

export function markOnboardingDone(userId) {
  localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, '1');
}

// Dans accueil.js ou main.js :
if (!hasCompletedOnboarding(me.id)) {
  showOnboarding();  // ← montre UNE SEULE FOIS
  await markOnboardingDone(me.id);
} else {
  // Skip onboarding, aller direct à dashboard
  root.innerHTML = dashboardHTML;
}
```

**Vérifier :**
- 1er login élève = tuto visible
- 2e login élève = tuto CACHÉ (skip direct)
- Tuto toujours accessible via Profil → "Revoir le tuto" si besoin

---

## BUG 6 : AUTRES BUGS CACHÉS

**Symptômes :**
- "On a la flemme" = UX pain, non-bloquant mais frustrant
- Probablement liés à scroll, zoom, ordre d'affichage, timing

**À vérifier :**
- [ ] Clavier virtuel (mobile) qui push l'écran vers le haut au focus input
- [ ] Animations lentes sur slow devices (iPad ancien)
- [ ] Overflow/scroll caché sur certaines pages (parcours, boutique)
- [ ] Boutons pas assez gros (< 44px) → manqués au toucher
- [ ] Toasts qui restent trop longtemps (> 3s)
- [ ] Transitions non-interruptibles (force attendre fin animation)

**À faire :**
1. Tester sur device réel (iPhone, iPad)
2. DevTools → simuler slow 3G + CPU throttle
3. Checker overflow sur chaque page (ne pas crop du contenu)
4. Min 44×44px pour tous boutons/clickable
5. Toasts → auto-dismiss 2-3s

---

## ORDRE EXÉCUTION

```
1. BUG 5 (Tutoriel) — 15 min — simple flag localStorage
2. BUG 1 (Musique) — 15 min — toggle autoplay + volume
3. BUG 2 (FAB overlap) — 20 min — repositionner bouton ou FAB
4. BUG 3 (Élèves tri + sélection) — 45 min — order() + click handler
5. BUG 4 (Zoom chips) — 20 min — touch-action CSS
6. BUG 6 (Autres) — scan + quick fixes → 30 min

TOTAL : ~2h45m
```

---

## CHECKLIST AVANT COMMIT

- [ ] Musique OFF par défaut (volume 0.1)
- [ ] FAB "Séance" sans overlap (visualement + cliquable)
- [ ] Élèves triés A→Z au login-session
- [ ] Clic élève = sélection directe (pas swipe)
- [ ] Compétence chip = pas de zoom
- [ ] Tuto élève = une seule fois (localStorage flag)
- [ ] npm run build — pas erreur
- [ ] npm run test — smoke tests pass (ou skip si HS)
- [ ] Device réel : iPhone/iPad test (si possible)
- [ ] Commit : `fix: ui/ux pain points — music, fabs, sorting, zoom, onboarding`
- [ ] Push → main
- [ ] Vercel déploie

---

## NOTES

- Musique : vérifier aussi qu'il existe une méthode `enableBgm()` pour les utilisateurs qui la veulent (opt-in)
- FAB : garder le "+" s'il est utile ailleurs, mais pas en bas-droite mobile
- Tuto : préserver accès depuis Profil (bouton "Revoir onboarding")
- Zoom: `touch-action: manipulation` est la solution standard pour double-tap zoom

---

**Exécute et reporte. Go ! 🚀**
