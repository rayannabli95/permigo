# Autopilot v6.1 — Rapport de tests QA

**Auditeur :** Engineering Tester
**Build testé :** `autopilot.html` v6.1 (3 498 lignes, 206 Ko)
**Méthodologie :** Audit statique + scénarios utilisateur + checks automatisés
**Verdict global :** **GO démo** — **NO-GO production sans corriger les P1**

---

## 1. Synthèse exécutive

| Catégorie | Score | Commentaire |
|---|---|---|
| Fonctionnel | 🟢 8.5/10 | 100% des boutons ont un handler, persistance OK |
| UX | 🟡 7/10 | Carte "Aujourd'hui" excellente, quelques frictions |
| Accessibilité | 🔴 3/10 | 0 aria-label, pas de focus management |
| Sécurité | 🟡 6/10 | esc() utilisé partout, mais photos en localStorage |
| Performance | 🟢 8/10 | MutationObserver actif, animations contrôlées |
| Design system | 🟢 9/10 | 37 vars CSS, palette cohérente |
| Code quality | 🟢 9/10 | 0 console.log, 2 TODO, JS valide |
| **Moyen** | **🟡 7.2/10** | **Solide pour démo, polissage avant prod** |

**Top 3 actions prioritaires :**

1. 🔴 Ajouter aria-labels et focus management (a11y conforme RGAA)
2. 🟡 Date du modal créneau hardcodée → today + liste élèves dynamique
3. 🟡 Photos en localStorage → migrer vers backend storage (quota 5-10 Mo)

---

## 2. Méthodologie

### 2.1 Couverture testée

```
Rôles               : Admin · Moniteur · Élève (3/3)
Écrans              : 8/8 selon spec v6
Modals              : 8/8 (cren, annul, absence, notation, event, troph, lieu, res)
Parcours utilisateur : 12 scénarios end-to-end
Tests auto          : 13 catégories de checks programmatiques
```

### 2.2 Approche

Audit statique du code (regex + parsing), tests fonctionnels par scénario,
revue UX en se mettant dans la peau de chaque rôle, checks accessibilité
selon WCAG 2.1 niveau AA, et sanity check sécurité (XSS, secrets, quota).

---

## 3. Résultats par catégorie

### 3.1 Fonctionnel — 🟢 8.5/10

**Ce qui marche :**

| # | Test | Résultat |
|---|---|---|
| F1 | Login : validation email regex | ✅ PASS |
| F2 | Login : validation longueur password | ✅ PASS |
| F3 | Signup : confirmation password match | ✅ PASS |
| F4 | Signup : indicateur force mot de passe | ✅ PASS |
| F5 | Calendrier : dates réelles (pas "33 avril") | ✅ PASS |
| F6 | Calendrier : navigation prev/next/today | ✅ PASS |
| F7 | Calendrier : transition mois (30 mars → 5 avril) | ✅ PASS |
| F8 | Carte Aujourd'hui : prochaine leçon visible | ✅ PASS |
| F9 | Persistance refresh : rôle, planning, livret, photos | ✅ PASS |
| F10 | Suppression événement (filter EVENTS) | ✅ PASS |
| F11 | 8 modals avec data-close | ✅ PASS |
| F12 | esc() utilisé pour échappement HTML | ✅ PASS |
| F13 | Seuil taux réussite vert dès 51% | ✅ PASS |

**Problèmes détectés :**

| ID | Sév | Description | Fichier:ligne | Reproduction |
|---|---|---|---|---|
| BUG-01 | P1 | Date input du modal créneau hardcodée `2026-04-03` | autopilot.html:1149 | Ouvrir +Créneau → champ Date montre une date du passé |
| BUG-02 | P1 | Liste élèves du modal créneau hardcodée à 6 (sur 12 dans ELEVES) | autopilot.html:1167 | Ouvrir +Créneau → seuls 6 élèves apparaissent |
| BUG-03 | P2 | Plaque immat hardcodée `HE-466-ZC` même si moniteur change | autopilot.html:1177 | Modifier plaque dans profil → modal montre toujours l'ancienne |
| BUG-04 | P2 | Modal annulation : motif requis mais bouton actif quand même | autopilot.html:~3155 | Cliquer Annuler quand même sans motif → toast warning OK mais UX confuse |
| BUG-05 | P2 | `c-fin-time` value="10:00" hardcodée (s'écrase en mode auto, mais visible 1 frame) | autopilot.html:1163 | Premier rendu modal créneau → flash 10:00 |
| BUG-06 | P3 | NOTIFS hardcodées avec dates anciennes ("Hier 18:45", "26 mars 11:00") | autopilot.html:~2829 | Page Notifications → infos figées dans le temps |

### 3.2 UX — 🟡 7/10

**Forces :**

- Carte "Aujourd'hui" pour le moniteur : excellente, focus métier clair
- Auth screen : login/signup/démo bien séparés, password strength indicator
- Modals : animation spring-bounce, pas brutales
- Statut leçon white/yellow/red conforme spec v6
- Calendar prev/next : feedback toast "📅 Semaine actuelle"

**Frictions identifiées :**

| ID | Sév | Description | Recommandation |
|---|---|---|---|
| UX-01 | P2 | Mode démo utilise `window.prompt()` natif — incohérent visuellement | Remplacer par 3 boutons "👔 Admin" / "🧑‍🏫 Moniteur" / "🎓 Élève" |
| UX-02 | P2 | "Aussi aujourd'hui" : leçons non triées par passé/futur, on ne sait pas ce qui est fini | Trier + afficher état (passée / en cours / à venir) avec indicateur |
| UX-03 | P2 | Confirmation suppression événement : `window.confirm()` natif | Remplacer par un mini-modal styled |
| UX-04 | P2 | Annulation tardive : pénalité facturation pas chiffrée dans la modal | Afficher le montant : "Cette leçon de 1h sera facturée 22,50€" |
| UX-05 | P3 | Notifications "marquer comme lu" non persisté (refresh = reviennent non-lues) | Persister dans localStorage |
| UX-06 | P3 | Pas de raccourcis clavier visibles (le ⌘K dans la topbar ne fait que toast) | Soit retirer ⌘K soit l'implémenter (recherche globale) |
| UX-07 | P3 | Photo upload : pas de feedback "upload en cours" pour les grosses images | Ajouter spinner pendant FileReader |
| UX-08 | P3 | Livret : grille REMC 31 compétences sans collapse — long à scroller | Replier les sections C1/C2/C3/C4 par défaut |
| UX-09 | P3 | Toast n'a pas de bouton "Annuler" pour les actions destructives | Pour suppression event, toast + Undo dans 5 sec |

**Parcours utilisateur — observations détaillées :**

#### Parcours Moniteur (le critique)

```
1. Login marco@autopilot.fr / xxx
   ✅ Session OK, redirige sur Planning
2. Voit la carte "Aujourd'hui"
   ✅ Vendredi 1er mai · Bonjour Marco · 0 leçons aujourd'hui
   ⚠️ Si aucune leçon → carte vide ; on devrait montrer "Prochaine leçon : Lundi 9h" à la place
3. Clique sur un créneau libre
   ✅ Modal s'ouvre avec heure pré-remplie
   ❌ Date hardcodée 2026-04-03 (BUG-01)
4. Crée une leçon
   ✅ Apparaît dans le calendrier
   ✅ Persistance OK
5. Clique sur la leçon créée
   ✅ Modal m-event s'ouvre, voit Annuler/Supprimer
6. Annule la leçon
   ⚠️ window.confirm natif (UX-03)
7. Va dans Mes élèves → Fiche → Livret
   ✅ Grille REMC chargée
   ⚠️ 31 compétences, scroll long (UX-08)
8. Coche 3 compétences, écrit observations, sauve
   ✅ Confetti 🎉, badge passe à "Rempli"
   ✅ Persiste après refresh
```

**Verdict moniteur :** flux principal solide, friction sur la création de leçon (date) et le livret (longueur).

#### Parcours Admin

```
1. Login sophie@autoecole.fr → admin (l'email contenant 'admin' déduit le rôle)
   ⚠️ Marche en démo mais en prod il faut une vraie auth (déjà documenté)
2. Voit hero, KPIs animés count-up
   ✅ "Heures planifiées 189h" remplace "CA semaine"
3. Clique alerte "Marco surchargé"
   ✅ Toast "📋 Moniteur surchargé"
   ⚠️ Toast peu utile, devrait naviguer vers la fiche moniteur
4. Va dans Calendrier → sélectionne Marco dans dropdown
   ✅ Filtre événements
   ⚠️ Le filtre est arbitraire (i%5 / i%3) — sera correct en prod avec data réelle
5. Va dans Assiduité → tableau heures mois
   ✅ 51% en vert, 49% en rouge
   ✅ Export CSV fonctionne (téléchargement réel)
6. Enregistre une absence Maladie 7h
   ✅ Plus de "Congé" dans le sélecteur
```

**Verdict admin :** complet, manque liens cliquables sur alertes.

#### Parcours Élève

```
1. Signup nouvelle élève "Léa Martin"
   ✅ Compte créé, role 'eleve', toast bienvenue
2. Espace : voit prochaine leçon Vendredi 27 mars
   ⚠️ Date hardcodée dans le HTML (UX-06 lié)
3. Voit livret "Rempli par Marco ✅"
   ⚠️ Hardcodé aussi
4. Clique "Évaluer Marco" → 4 étoiles + commentaire
   ✅ Persiste dans NOTATIONS, visible côté admin
5. Réserve un créneau
   ✅ 4 slots disponibles, sélection bleue
   ⚠️ Slots hardcodés (devra venir de l'API en prod)
6. Refresh → toujours connectée, état OK
   ✅
```

**Verdict élève :** parcours simple, mais beaucoup de données hardcodées qui ne reflètent pas le vrai état (à brancher API).

### 3.3 Accessibilité — 🔴 3/10

**Critique :**

| ID | Critère WCAG | État | Impact |
|---|---|---|---|
| A11Y-01 | 1.3.1 Info & Relationships | ❌ FAIL | 0 `aria-label` dans le projet |
| A11Y-02 | 1.4.3 Contrast (minimum) | ⚠️ À vérifier | Texte gris `#9CA3AF` sur blanc = 2.85:1 (fail AA) |
| A11Y-03 | 2.1.1 Keyboard | ⚠️ Partiel | Modals navigables au Tab mais pas de focus trap |
| A11Y-04 | 2.1.2 No Keyboard Trap | ⚠️ FAIL | Pas de gestion Escape pour fermer modals |
| A11Y-05 | 2.4.3 Focus Order | ⚠️ FAIL | Tab order pas explicite (tabindex absent) |
| A11Y-06 | 2.4.7 Focus Visible | ✅ PASS | `:focus-visible` outline 2px var(--a) |
| A11Y-07 | 3.3.2 Labels or Instructions | ⚠️ FAIL | 12 inputs sans `<label>` ou aria-label associé |
| A11Y-08 | 4.1.2 Name, Role, Value | ❌ FAIL | Boutons emoji-only sans aria-label (📞 🗺 📷 ✕) |

**Recommandations a11y :**

- Ajouter `aria-label` sur tous les boutons emoji ou icon-only (≥30 endroits)
- Ajouter `<label for="">` ou `aria-labelledby` à tous les inputs
- Implémenter focus trap dans les modals (focus-trap-js ou code maison)
- Ajouter listener `keydown` Escape sur les modals
- Vérifier contrastes à `#9CA3AF` (le `--mu2`) — passer à `#6B7280` minimum
- Ajouter `role="dialog"` `aria-modal="true"` sur les modals
- Ajouter skip-to-content link en haut

### 3.4 Sécurité — 🟡 6/10

**Forces :**

- 9 utilisations de `esc()` pour échapper le HTML user-generated
- 0 `console.log` en production
- Pas de secrets hardcodés
- Pas de eval() ni Function() dynamique
- Form submit avec `preventDefault()`

**Risques :**

| ID | Sév | Risque | Mitigation |
|---|---|---|---|
| SEC-01 | P1 | Photos stockées en base64 dans localStorage (quota 5-10 Mo) | Migrer vers backend storage (Supabase Storage / S3) |
| SEC-02 | P2 | innerHTML avec template strings — `esc()` couvre la plupart, mais 5 cas template literals où une donnée user pourrait passer | Audit ciblé, ajouter esc() aux variables manquantes |
| SEC-03 | P2 | Pas de Content Security Policy | Ajouter `<meta http-equiv="Content-Security-Policy" ...>` |
| SEC-04 | P3 | localStorage clé `ap-email`, `ap-name` lisibles en clair par tout JS | Acceptable (info non-sensible), mais préférer cookie httpOnly en prod |
| SEC-05 | P3 | Pas de protection CSRF (formulaires) — non critique tant que pas d'API | À ajouter quand le backend sera branché |

### 3.5 Performance — 🟢 8/10

**Mesures :**

```
DOM nodes initiaux        : ~600 (acceptable)
Total addEventListener   : 129
MutationObserver actif   : 1 (pour ripples)
Animations CSS           : ~15 keyframes
Taille fichier servi     : 206.5 Ko (gzippé ~50 Ko)
localStorage utilisé     : 17 clés (peut atteindre 5+ Mo avec photos)
Network requests         : 1 (Google Fonts)
```

**Observations :**

- ✅ Animations contrôlées, GPU-friendly (transform/opacity)
- ✅ Pas de loop infinie ni timer non-cleanup
- ⚠️ MutationObserver sur tout `document.body` peut être lourd sur mobile bas de gamme
- ⚠️ Photos base64 → si 3 photos × 2 Mo = 6 Mo localStorage, proche de la limite navigateur
- ⚠️ Confetti = 60 éléments DOM créés → cleanup OK mais éviter d'enchaîner

**Recommandations :**

- Limiter le scope du MutationObserver aux conteneurs dynamiques
- Compresser les photos avant base64 (canvas resize → 200×200 px max)
- Préférer `IntersectionObserver` pour les animations onscroll

### 3.6 Design system — 🟢 9/10

**Cohérence :**

- 37 variables CSS définies
- Palette unique (--a #2563eb, --rd, --gr, --am)
- Tailles standardisées (--th, --sw, --r, --rl, --rx)
- Ombres standardisées (--s0 à --s4)

**Petits écarts :**

- 115 couleurs hex en dur dans le CSS — beaucoup sont des nuances (hex précis pour dark mode), mais une vingtaine pourrait passer en variables
- Quelques styles inline en JS qui dupliquent les classes existantes

### 3.7 Mobile / Responsive — 🟡 7/10

```
Viewport meta            : ✅ OK
Media queries            : 7 (acceptable)
Touch events             : pointerdown actif
Bottom nav mobile        : ✅ OK (<768px)
```

**À tester sur appareils réels :**

- Touch targets : certains < 44×44 px (boutons icônes ✕ dans modals)
- Carte "Aujourd'hui" : à vérifier sur 375px (iPhone SE)
- Photo upload : webcam mobile ?

---

## 4. Bugs prioritisés (backlog)

### P1 (à fixer avant prod)

```
[BUG-01]  Date modal créneau hardcodée → today
[BUG-02]  Liste élèves modal créneau dynamique (12 au lieu de 6)
[A11Y-01] Aria-labels sur tous les boutons icon-only
[A11Y-04] Escape pour fermer modals + focus trap
[SEC-01]  Photos → backend storage (pas localStorage)
```

### P2 (à fixer rapidement après prod)

```
[BUG-03]  Plaque immat dynamique dans modal créneau
[BUG-04]  Désactiver bouton "Annuler quand même" tant que motif vide
[UX-01]   Mode démo : 3 boutons au lieu de window.prompt
[UX-02]   Trier "Aussi aujourd'hui" + état passée/en cours/à venir
[UX-03]   Confirmation styled au lieu de window.confirm
[UX-04]   Pénalité chiffrée dans modal annulation
[A11Y-02] Contraste --mu2 (passer #9CA3AF → #6B7280)
[A11Y-07] Labels associés à tous les inputs
[SEC-02]  Audit innerHTML : ajouter esc() partout
[SEC-03]  Content Security Policy
```

### P3 (nice to have)

```
[BUG-05]  Suppression value="10:00" hardcodée fin time
[BUG-06]  NOTIFS dynamiques (timestamps relatifs)
[UX-05]   Persistance "lu" notifications
[UX-06]   ⌘K = recherche globale (ou retirer)
[UX-07]   Spinner upload photo
[UX-08]   Collapse sections REMC C1/C2/C3/C4
[UX-09]   Undo dans toast pour actions destructives
```

---

## 5. Tests manuels recommandés avant livraison

### Smoke test rapide (15 min)

```
[ ] Login admin → voir KPIs s'animer
[ ] Login moniteur → voir carte "Aujourd'hui"
[ ] Login élève → voir prochains cours
[ ] Refresh sur chaque rôle → état restauré
[ ] Créer une leçon (3 types : leçon, perso, absence, dispo)
[ ] Cliquer une leçon existante → modal action
[ ] Supprimer une leçon → disparaît
[ ] Remplir le livret → confetti, badge "Rempli"
[ ] Évaluer moniteur depuis l'élève → ⭐ persistées
[ ] Toggle dark mode → couvre tous les écrans
[ ] Ajouter un lieu de RDV → apparaît dans modal créneau
[ ] Logout → revient sur login
```

### Tests sur navigateurs

```
[ ] Chrome desktop / mobile
[ ] Safari Mac / iOS (date input behaviour différent !)
[ ] Firefox
[ ] Edge
```

### Tests responsive (DevTools)

```
[ ] iPhone SE (375×667)
[ ] iPad (768×1024)
[ ] Desktop 1440×900
[ ] Desktop 1920×1080
```

### Tests accessibilité

```
[ ] Navigation clavier seule (Tab / Shift+Tab / Enter / Escape)
[ ] Lecteur d'écran (VoiceOver Mac, NVDA Windows) sur 1 parcours par rôle
[ ] Lighthouse accessibility score (objectif ≥ 90)
[ ] axe DevTools — 0 critical issue
```

---

## 6. Recommandations stratégiques pour v6.2

### Quick wins (1 jour de dev)

1. Date today() partout
2. Liste élèves dynamique dans modal
3. Aria-labels sur les ~30 boutons icon-only
4. Escape ferme les modals
5. Mode démo en 3 boutons stylés

### Medium term (3-5 jours)

1. Compression photos avant upload
2. Focus trap dans modals
3. Content Security Policy
4. Audit innerHTML complet
5. Lighthouse 90+

### Long term (V2)

1. Vraie auth Supabase
2. API + DB Postgres
3. Push notifications
4. Tests automatisés (Playwright)
5. CI/CD avec lint+a11y check

---

## 7. Conclusion

**Verdict :** L'app est **prête pour démo client** mais **nécessite 2-3 jours de polissage avant prod**.

**Forces :** architecture propre, persistance robuste, design system cohérent, parcours moniteur (le critique) bien pensé avec la carte "Aujourd'hui".

**Faiblesses principales :** accessibilité quasi inexistante (à corriger pour conformité RGAA si auto-école publique), quelques données hardcodées qui apparaîtront comme bugs en démo (date, liste élèves modal).

**Confiance livraison :**
- 🟢 Démo client en l'état : OUI (la friction "BUG-01" est gérable en démo)
- 🟡 Production avec backend branché : NON sans P1 corrigés
- 🔴 Conformité RGAA : NON sans P1 a11y corrigés

**Prochaine itération recommandée :** v6.2 ciblée sur les 5 P1 listés en §4.
