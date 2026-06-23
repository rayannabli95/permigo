# Micro-interactions « TikTok-fast » + dopamine-alignées — SPEC

> Objectif : rendre PermiGo **fluide, addictive ET efficace** sans dark pattern.
> Cible : élève (le carburant viral). Mobile-first, vanilla JS, < 300 ms.
>
> **Ancrage psycho** (déjà acté) : on lit/scrolle vite → feedback **instantané** (flow),
> récompense **variable** (le pic dopamine grave la mémoire), sentiment de **progression**,
> **faible friction**. Jamais de streak culpabilisant, jamais de récompense pour bâcler.

---

## ⚙️ Socle déjà en place (à RÉUTILISER, ne pas recoder)

Avant de coder quoi que ce soit, sache que la moitié du travail est déjà là. La plupart
des interactions ci-dessous = **câbler l'existant au bon endroit**, pas écrire du neuf.

| Brique | Fichier | Ce que ça donne |
|---|---|---|
| Tokens d'easing | `src/styles/base.css` | `--ease-snap:cubic-bezier(.23,1,.32,1)` (le « TikTok-fast » demandé), `--ease-spring`, `--ease-bounce`, `--ease-out` |
| Count-up | `src/utils/count-up.js` | `countUp(el, 42, {suffix:'h'})` + `countUpAll([data-count])` |
| Haptique | `src/utils/haptic.js` | `haptic('tap'|'select'|'success'|'swipe'|'longpress')` — gère iOS sans `vibrate` |
| Son | `src/utils/sound.js` | `playSuccess / playPop / playCoin / playWhoosh / playReveal / playError…` |
| Swipe / long-press / pull-to-refresh | `src/utils/gestures.js` | `attachSwipe`, `attachLongPress`, `attachPullToRefresh` |
| Stagger / reveal / skeleton / `:active scale(.97)` | `src/styles/animations.css` | `.stagger`, `.reveal`, `.skel`, `spring-tap` global |
| Transition de route | `src/router.js` (`.route-enter`) | aujourd'hui = simple fade d'opacité |

**Conséquences directes :**
- Les classiques « entrées en stagger », « `:active` scale 0.97 », « squelettes », « count-up »,
  « pull-to-refresh » **existent déjà**. La SPEC ci-dessous se concentre sur **les câbler là où ils
  manquent** et sur **les vrais trous** (feedback de réponse variable, transition d'écran, swipe-next).
- Règle d'or : on n'anime **que `transform` et `opacity`** (GPU). Jamais `width`/`height`/`margin`.
- `prefers-reduced-motion` est déjà respecté globalement (animations.css) → garde opacité/couleur, coupe les déplacements.

---

## 🎯 Les micro-interactions

Format : **Nom · Où · Ce que ça fait (concret) · Principe psycho · Effort (S/M/L)**.

---

### 1. Réponse juste — célébration VARIABLE (le cœur dopamine)

- **Où** : `src/pages/eleve/quiz.js` (révision + quizz premium + exam blanc), au moment où la réponse
  est validée comme correcte.
- **Concret** : aujourd'hui c'est `playSuccess()` à plat (quiz.js:333) → toujours pareil = le cerveau
  s'habitue, la dopamine s'éteint. On rend la récompense **variable** : à chaque bonne réponse on tire
  un feedback dans un petit pool, pondéré (le « gros » feedback reste rare → c'est ça qui grave la mémoire).
  ```js
  const POOL = [
    { w: 70, fx: () => { haptic('tap');     /* coche qui pop, son discret */ } },
    { w: 22, fx: () => { haptic('success'); playPop();  burstMini(el); } },   // mini-burst
    { w: 6,  fx: () => { haptic('success'); playCoin(); burstBig(el); label('+1 série 🔥'); } },
    { w: 2,  fx: () => { haptic('longpress'); playReveal(); burstBig(el); label('Sans-faute !'); } }, // jackpot rare
  ];
  function pickWeighted(p){ let r=Math.random()*p.reduce((s,x)=>s+x.w,0); return p.find(x=>(r-=x.w)<0); }
  pickWeighted(POOL).fx();
  ```
  Le bouton de réponse : `transform: scale(.96)→1` + teinte verte en `120ms var(--ease-snap)`.
  La coche se dessine (keyframe `checkmark-draw` existe déjà). `burstMini` = 4-6 particules en
  `transform: translate()+scale()` `opacity 1→0` sur 400 ms, `pointer-events:none`. Pas de confetti
  plein écran à CHAQUE bonne réponse (ça tue la variabilité) — réservé au tirage rare.
- **Principe psycho** : **récompense à ratio variable** (Skinner). L'imprévisibilité de l'intensité
  produit le pic dopaminergique qui fixe le souvenir. Le sans-faute rare crée l'envie de rejouer.
- **Effort** : **M** (le pool + 2 fonctions burst ; tout le reste est câblé).

---

### 2. Réponse fausse — correction douce, zéro punition

- **Où** : `quiz.js`, branche réponse incorrecte.
- **Concret** : `shake` court sur la mauvaise option (`.anim-shake` existe, `.35s`), `haptic('warning')`,
  `playError()` **discret** (volume bas), puis la **bonne** réponse se révèle avec un léger glow vert
  (`box-shadow` pulse 1 fois, 250 ms `var(--ease-out)`). Surtout : **pas** de rouge agressif plein écran,
  pas de son « buzzer » humiliant. Le focus glisse vers l'explication.
- **Principe psycho** : l'erreur est un **moment d'apprentissage**, pas une sanction. La honte fait fuir ;
  la correction immédiate + neutre maintient le flow et la mémoire (test-effect). Anti-dark-pattern explicite.
- **Effort** : **S** (tout est déjà dispo : shake + haptic + son).

---

### 3. Score / série qui « monte » (count-up partout où il manque)

- **Où** : récap de fin de session (`revision-recap.js`), accueil (XP retirée de l'UI élève mais série
  + progression compétence restent), exam-blanc score final, page trophées.
- **Concret** : `countUp()` **existe** mais n'est pas branché partout. Sur chaque écran de résultat,
  les chiffres clés démarrent à 0 et montent en `~900 ms` ease-out, avec un léger `number-pop`
  (`.anim-number` existe) sur la valeur finale. Stagger 100 ms entre plusieurs chiffres (`countUpAll`).
  Sur la barre de série : le chiffre monte **pendant** que la barre se remplit (synchronisés).
- **Principe psycho** : voir le nombre **grandir** = progression rendue visible et tangible → dopamine
  d'accomplissement. Un chiffre qui apparaît figé ne déclenche rien ; un chiffre qui grimpe « se mérite ».
- **Effort** : **S** (câblage de `countUp`/`countUpAll` sur 3-4 écrans).

---

### 4. Barre de progression « satisfaisante » (remplissage + bump à l'arrivée)

- **Où** : parcours (`parcours.js`), barre de compétence, progress du quizz (question N/total), récap.
- **Concret** : remplissage `transform: scaleX()` de la valeur précédente → nouvelle valeur en
  `1.0s var(--ease-out)` (`.bar-animated` existe). **Le détail qui change tout** : un micro-**bump**
  à la fin (`scaleY(1)→1.25→1` sur la barre, 180 ms `var(--ease-spring)`) + `haptic('select')` pile
  quand elle atteint la cible. Si le palier d'une compétence est franchi → `worldPulse` (existe) sur la carte.
  Animer `scaleX` (origin left), **pas** `width` (perf).
- **Principe psycho** : **progression incarnée**. Le bump final donne le « clunk » physique d'un cran
  qui se verrouille (sensation Strava/anneaux Apple) → micro-récompense de complétion.
- **Effort** : **S-M** (la barre existe ; ajouter le bump + l'haptique de fin + passer `width`→`scaleX`).

---

### 5. Transition d'écran instantanée + directionnelle (sensation « next » rapide)

- **Où** : `src/router.js` — toutes les navigations ; en priorité l'enchaînement de questions et
  « Continue à réviser ».
- **Concret** : aujourd'hui `.route-enter` = simple fade. On ajoute une **direction** : avancer
  (quizz → quizz, parcours → leçon) entre en `translateX(16px)→0` + `opacity 0→1` en
  `200ms var(--ease-snap)` (`.anim-page-in` existe déjà, presque ça). Revenir (back) = `translateX(-16px)→0`.
  Durée **plafonnée à 200 ms** : sous 200 ms le cerveau lit ça comme « instantané ». **Jamais** d'`ease-in`
  (effet lourd). Le contenu de la nouvelle page apparaît **immédiatement** (pas d'attente de fin d'anim
  avant d'être interactif). Indice de direction via un flag sur `location.hash` ou un `history` léger.
- **Principe psycho** : **cohérence spatiale** (on avance → ça vient de la droite ; on recule → de la gauche),
  comme un feed qu'on fait défiler. Le sub-200 ms préserve le **flow** : zéro sensation d'attente entre deux
  écrans = on enchaîne sans friction, comme un scroll TikTok.
- **Effort** : **M** (gérer la direction dans le router + brancher la classe ; le keyframe existe).

---

### 6. « Swipe / Next » rapide entre questions

- **Où** : quizz révision (enchaînement de questions), galerie/cartes de révision (`revision-cards.js`).
- **Concret** : la question sortante part en `translateX(-100%)` + `opacity→0`, l'entrante arrive de
  `translateX(8%)→0`, croisement en `220ms var(--ease-snap)`. Geste optionnel : `attachSwipe` (existe)
  pour passer à la suivante au swipe gauche **une fois répondu** (pas avant — sinon on saute sans apprendre),
  avec `haptic('swipe')` au déclenchement. Le bouton « Suivant » garde son `:active scale(.97)`.
  Transitions CSS (interruptibles) plutôt que keyframes, pour que deux taps rapides ne « cassent » pas l'anim.
- **Principe psycho** : **rythme de feed**. Le geste de balayage = familier, addictif, zéro réflexion.
  Faible friction → on fait « encore une question » sans s'en rendre compte (boucle d'engagement).
- **Effort** : **M** (croisement entrant/sortant + brancher `attachSwipe` post-réponse).

---

### 7. Pull-to-refresh élastique (là où il manque)

- **Où** : accueil élève, classement/ligue, notifications (déjà fait sur notifs d'après le changelog).
- **Concret** : `attachPullToRefresh` **existe** (`gestures.js`, threshold 70, damping intégré). Le câbler
  sur accueil + classement. Détail premium : l'indicateur (spinner/flèche) tourne **proportionnellement**
  à la distance tirée (`transform: rotate()`), puis un `haptic('select')` **au franchissement du seuil**
  (l'utilisateur « sent » qu'il peut lâcher). Damping au-delà du max (déjà géré). Spinner **rapide**
  pendant le refresh (un spinner rapide = chargement perçu plus court).
- **Principe psycho** : **contrôle + boucle de rafraîchissement** (le geste « tirer pour voir du neuf »
  est un réflexe conditionné → variabilité du contenu = micro-récompense). L'haptique de seuil = feedback
  tactile qui confirme l'action sans regarder.
- **Effort** : **S** (utilitaire prêt ; brancher sur 2 écrans + l'haptique de seuil).

---

### 8. Entrées en stagger ciblées (la liste qui « se monte »)

- **Où** : accueil (cartes de sections), liste de leçons du parcours, trophées, boutique, classement.
- **Concret** : `.stagger` **existe** (`blur-in`, délais auto jusqu'à 10 enfants, 30-80 ms entre items).
  Le poser sur les conteneurs de listes au render. Garder **court** : au-delà de ~6 items, l'utilisateur
  attend → cap à 6 délais puis tout le reste arrive ensemble (déjà géré par `:nth-child(n+10)`). Ne JAMAIS
  retarder l'interactivité : on peut taper un item même pendant son fade-in.
- **Principe psycho** : **hiérarchie temporelle** = le regard suit l'ordre d'apparition (lecture rapide
  guidée), et le mouvement orchestré donne une impression de **qualité/vie** (« mille voix qui chantent juste »).
- **Effort** : **S** (poser la classe ; ne pas sur-staggerer).

---

### 9. `:active` partout + cibles tactiles (responsivité de presse)

- **Où** : global — tout élément tappable.
- **Concret** : `spring-tap` (`scale(.94)→1`) est déjà appliqué à `.btn`, `.nb-item`, etc. **Auditer**
  les éléments tappables qui n'ont PAS de `:active` (cartes custom, chips, tuiles de leçon) et leur ajouter
  `:active { transform: scale(.97) }` en `120ms var(--ease-snap)`. Min touch target **44×44px** (règle projet).
  Le `tapHaptic()` global (main.js) couvre déjà les `button/[role=button]/.tappable` → s'assurer que les
  tuiles custom portent `.tappable` ou `data-haptic`.
- **Principe psycho** : **feedback immédiat de presse** = « l'interface m'a entendu ». Sans ça, l'UI paraît
  cassée/lente même si le code est instantané. C'est la base invisible du « ça répond bien ».
- **Effort** : **S** (audit + classe `.tappable` sur les tuiles custom).

---

### 10. Squelettes rapides et fidèles (chargement perçu court)

- **Où** : toutes les pages avec fetch Supabase au `mount()` (accueil, parcours, classement, trophées…).
- **Concret** : `.skel` / `.skel2` **existent** (shimmer 1.4 s). Deux corrections de craft :
  (a) le squelette doit **épouser la forme réelle** du contenu (mêmes hauteurs/rayons que les vraies cartes —
  l'accueil le fait déjà bien, ll.1946-1953) pour zéro saut de layout au remplacement ;
  (b) **shimmer un peu plus rapide** (1.0-1.2 s) → chargement perçu plus court. Crossfade `opacity` 150 ms
  entre skeleton et contenu réel (mask les imperfections du remplacement, cf. blur/fade Emil).
- **Principe psycho** : **performance perçue**. Un squelette fidèle + shimmer rapide fait paraître l'app
  plus rapide que le même temps de chargement avec un spinner. Réduit l'anxiété d'attente → moins d'abandon.
- **Effort** : **S** (ajuster durée shimmer + crossfade ; les skeletons existent).

---

### 11. Bouton CTA qui « appelle » (sans clignoter) — le bouton de la boucle

- **Où** : CTA principal de l'accueil (« Réviser 3 questions » / question du jour), bouton « Continue ».
- **Concret** : le CTA de la boucle quotidienne porte un **glow respirant** très subtil (`.btn-glow`
  existe, `cta-glow` 2.6 s) **uniquement** si l'action du jour n'est pas faite (sinon repos — pas de
  sollicitation permanente). Au tap : `scale(.97)` + `haptic('tap')` + `playWhoosh()` léger, puis transition
  d'écran directionnelle (#5). Après l'action faite : le CTA se transforme en état « ✓ fait » (morph d'état,
  pas disparition brutale).
- **Principe psycho** : **amorce d'action à faible friction** + **fermeture de boucle** (le morph « → ✓ »
  donne la satisfaction de complétion). Le glow s'éteint une fois l'action faite = honnête, non culpabilisant.
- **Effort** : **S-M** (état conditionnel du CTA + morph « fait »).

---

### 12. Déblocage de compétence / coffre — le grand pic (rare, donc fort)

- **Où** : `competence-unlock.js`, `chest.js`, `world-unlock-cinematic.js` (déjà câblés).
- **Concret** : ces écrans plein écran existent déjà (style Nike/COD/Strava). Le point de craft : ils doivent
  rester **rares** (fin de compétence, coffre) et **variés** dans la récompense révélée (`reward-reveal.js`).
  Séquence : `whoosh` → carte qui arrive en `scale(.9)→1` `var(--ease-bounce)` → `playVictory()` →
  count-up de la récompense → confetti (réservé à CE moment). **Ne jamais** déclencher ce niveau à chaque
  bonne réponse (sinon plus aucun pic ne porte).
- **Principe psycho** : **épargne dopaminergique**. En gardant le grand feu d'artifice pour les jalons rares,
  chaque déblocage reste un événement → souvenir fort, envie de revenir « débloquer le prochain ».
- **Effort** : **S** (existant ; surtout discipline : ne pas banaliser).

---

### 13. Toast / loot discret en cours de session (récompense périphérique)

- **Où** : `loot-toast.js` (existe), pendant une session quand un micro-gain tombe (badge, série étendue).
- **Concret** : le toast entre du **bas** en `translateY(100%)→0` `var(--ease-snap)` 250 ms, swipe-to-dismiss
  (`attachSwipe` / `sheet-swipe`) **dans la même direction qu'il est entré** (cohérence spatiale),
  auto-dismiss avec timer **pausé si l'onglet est caché** (principe Sonner). `haptic('select')` à l'entrée.
- **Principe psycho** : **récompense périphérique non bloquante** — on gratifie sans interrompre le flow.
  La cohérence entrée/sortie rend le swipe « évident » (faible friction cognitive).
- **Effort** : **S** (composant existe ; vérifier la cohérence directionnelle + pause timer).

---

### 14. Compteur de série « vivant » sur l'accueil (flame bump)

- **Où** : accueil, indicateur de série (le « 🔥 »).
- **Concret** : `flameBump` **existe** (`.anim-flame-bump`, scale+rotate, `var(--ease-spring)`). À déclencher
  **au moment où la série s'incrémente** (retour sur l'accueil après une session faite), pas au simple load.
  Couplé à `haptic('success')` + son léger. Si série non encore faite aujourd'hui : flamme **calme** (pas de
  menace « tu vas perdre ta série » — antipattern interdit). Série = indicateur neutre de régularité.
- **Principe psycho** : **progression + identité** (« je suis quelqu'un de régulier »). Le bump récompense
  le retour sans menacer la perte → engagement sain, pas anxiogène.
- **Effort** : **S** (déclencher au bon événement, pas au mount).

---

### 15. Micro-feedback de sélection d'option (avant validation)

- **Où** : quizz — au tap sur une option (avant de valider).
- **Concret** : l'option sélectionnée prend un état actif net en `100ms var(--ease-snap)` (bordure accent +
  léger `scale(.98)` puis `1`) + `haptic('select')`. Désélection instantanée si on change d'avis. Le bouton
  « Valider » s'active (passe de désactivé→actif) avec un fade d'opacité + un très léger `scale` 150 ms.
- **Principe psycho** : **feedback instantané d'intention**. Chaque tap répond → sensation de contrôle et de
  précision (le quizz « obéit »), ce qui réduit la charge cognitive et garde dans le flow.
- **Effort** : **S** (état `:active`/sélection + activation du bouton Valider).

---

## 🏆 TOP 5 à implémenter en premier (meilleur ratio impact / effort)

> Critère : maximum de dopamine + flow pour un minimum de code, en réutilisant le socle existant.

1. **#1 Réponse juste — célébration VARIABLE** *(Effort M)* — LE multiplicateur. Transforme le
   `playSuccess()` plat en récompense à ratio variable. C'est ça qui grave la mémoire et crée l'envie de
   rejouer. Plus gros impact dopamine du lot.
2. **#5 Transition d'écran directionnelle < 200 ms** *(Effort M)* — donne instantanément la sensation
   « TikTok-fast » sur **toute** l'app (router) ; supprime la friction entre écrans. Le keyframe existe déjà.
3. **#3 Count-up partout où il manque** *(Effort S)* — `countUp` est écrit, il suffit de le brancher sur
   récap / exam / trophées. Progression rendue visible = dopamine d'accomplissement, quasi gratuit.
4. **#4 Barre de progression + bump final** *(Effort S-M)* — le micro-bump + haptique de complétion donne le
   « clunk » satisfaisant d'un cran verrouillé. Petit code, grosse sensation.
5. **#2 Réponse fausse douce + #9 `:active` audit** *(Effort S)* — protège le flow (pas de punition) et
   rend toute l'UI « responsive au toucher ». Base invisible : sans ça, le reste paraît moins fluide.

**Hors top 5 mais quasi-gratuits ensuite** : #7 pull-to-refresh (câblage), #8 stagger ciblé, #10 skeletons
rapides — tous en réutilisant l'existant.

---

## ✅ Garde-fous (non négociables)

- **Anti dark-pattern** : aucune célébration pour avoir bâclé ; série = neutre, jamais « tu vas perdre » ;
  pas de notif/glow culpabilisant.
- **Pédagogie d'abord** : le swipe-next ne saute pas l'apprentissage (actif **après** réponse + explication).
- **Perf** : seulement `transform` / `opacity`. `scaleX` pour les barres (pas `width`). Pas de `transition: all`.
- **a11y** : `prefers-reduced-motion` déjà global → on garde opacité/couleur, on coupe les déplacements.
- **Variabilité = discipline** : le grand feu d'artifice reste **rare** (jalons), sinon plus aucun pic ne porte.
