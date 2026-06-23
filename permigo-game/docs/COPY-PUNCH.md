# COPY-PUNCH — Réécriture « TikTok-fast » des écrans Révision conduite

> **But** : on lit en 2 sec. Un mot de trop = perdu. Verbes d'action, bénéfice clair,
> ton de pote qui te coache, jamais culpabilisant. **Reste juste** : ne jamais dire
> « validé / prêt » quand c'est de l'auto-éval (le moniteur valide, l'inspecteur note).
>
> Spec pure. Rien n'est appliqué dans le code — à toi de jouer.
>
> **Périmètre** :
> - `src/pages/eleve/revision-conduite.js`
> - `src/pages/eleve/exam-conduite.js`
> - `src/components/eleve/premium-quiz.js`
>
> **Conventions de lecture du tableau** : « Avant » = le libellé exact dans le code.
> « Après » = la version proposée. Quand une cellule contient `→` ce sont des variantes.

---

## Principes appliqués partout

1. **Verbe d'action en tête** de chaque bouton (« Réviser », « Lancer », « Voir »).
2. **Pas de redondance avec le contexte** : si l'écran s'appelle « Examen blanc », le bouton
   ne répète pas « examen blanc ».
3. **Bénéfice avant effort** : on dit ce que l'élève GAGNE, pas ce qu'il doit faire.
4. **Chaleur sans niaiserie** : « nickel », « propre », « t'as géré » — pas « Bravo champion ».
5. **Honnêteté** : « où t'en es », « ton ressenti » côté auto-éval. Jamais « validé ».
6. **Émojis** : 0 ou 1 par libellé, jamais deux. Sert d'icône, pas de décoration.

---

## 1. `revision-conduite.js` — l'écran d'accueil de la révision

### En-têtes & sous-titres

| Avant | Après | Pourquoi |
|---|---|---|
| `Révision conduite` (titre H1) | **Révise ta conduite** | Verbe d'action > nom statique. On parle à l'élève, pas d'un menu. |
| `Le contenu arrive très vite. Reviens dans un instant 👀` | **Ça arrive. Reviens dans 2 min 👀** | Plus court, plus concret (« 2 min » > « un instant »). |
| `Par compétence` (label section) | **Par thème** → ou **Choisis ton thème** | « Compétence » = mot scolaire/REMC. L'élève pense « créneau, demi-tour », pas « compétence C3 ». |

### Carte « point faible du jour »

| Avant | Après | Pourquoi |
|---|---|---|
| `⚡ Ton point faible du jour` | **⚡ Ton défi du jour** | « Point faible » culpabilise. « Défi » = même info, énergie positive, donne envie de cliquer. |
| `3 questions ciblées · 1 minute` | **3 questions · 1 min chrono** | « ciblées » est mou et invisible en 2 sec. « chrono » crée l'urgence ludique. |
| `Réviser maintenant` (bouton) | **Go, 1 min** → ou **J'attaque** | « maintenant » est faible. Court + l'enjeu temps = ZÉRO friction pour taper. |

### Bloc « ciblé par le moniteur »

| Avant | Après | Pourquoi |
|---|---|---|
| `🎯 Ciblé par ton moniteur` | **🎯 Ton moniteur t'a ciblé ça** | Phrase active = ça vient d'une vraie personne. Plus engageant qu'un label froid. |
| `Réviser →` (bouton focus) | **J'm'y mets →** → ou **Go →** | Réponse directe au moniteur, ton complice. |

### Carte « Examen blanc »

| Avant | Après | Pourquoi |
|---|---|---|
| `🏁 Examen blanc` | **🏁 Examen blanc** *(garder)* | Mot connu, attendu, crédible. Ne pas inventer ici. |
| `Teste-toi sur tout` | **Toutes les compétences d'un coup** → ou **Le grand test** | « sur tout » est vague. On promet l'ampleur (= le boss de fin). |

### Vue « fiche » (détail d'une compétence)

| Avant | Après | Pourquoi |
|---|---|---|
| `La méthode` | **La méthode** *(garder)* | Court, clair, juste. RAS. |
| `Le pourquoi` | **Pourquoi ça compte** | « Le pourquoi » sonne abstrait. La version longue dit le bénéfice (comprendre = retenir). Reste 3 mots. |
| `L'erreur classique` | **Le piège** → ou **L'erreur qui coûte** | « classique » est tiède. « Le piège » accroche + sous-entend « évite-le ». |
| `Boîte automatique` | **En boîte auto** | Plus parlé, plus court. « boîte auto » = comment les jeunes le disent. |
| `🎬 D'après de vrais moniteurs : …` | **🎬 Vu chez de vrais moniteurs : …** | « D'après » = distant. « Vu chez » = preuve sociale vivante, plus crédible. |
| `🧩 Remets les étapes dans l'ordre` (bouton) | **🧩 Remets dans l'ordre** | « les étapes » est implicite (elles sont au-dessus). 4 mots de trop coupés. |
| `▶ Lancer le quizz` (bouton) | **▶ Lance le quiz** | Tutoiement (impératif) > infinitif neutre. + orthographe « quiz ». |

> ⚠️ **Note ortho** : le code écrit « quizz » (2 z) à plusieurs endroits. La graphie
> française standard est **quiz**. À harmoniser si tu touches ces libellés.

### Vue « ordre des étapes »

| Avant | Après | Pourquoi |
|---|---|---|
| `Tape les étapes dans le bon ordre.` | **Dans le bon ordre. À toi.** | Coupé en deux temps, ton défi. « Tape » sous-entendu par l'interaction. |
| `Étape X / Y` (progression) | **X / Y** *(garder le compteur, retirer « Étape »)* | Le mot « Étape » est redondant avec le contexte visuel. Le chiffre suffit. |
| `Dans l'ordre, nickel !` (fin) | **Dans l'ordre, nickel !** *(garder)* | Pile le bon ton. Court, chaleureux, juste. RAS. |
| `Tu as remis les N étapes de « X » dans le bon ordre.` | **Les N étapes de « X » : pliées.** | Phrase scolaire → punchline. « pliées » = ton jeune, sentiment de maîtrise. |
| `Continuer` (bouton) | **Continuer** *(garder)* | Standard, clair. RAS. |

---

## 2. `exam-conduite.js` — l'examen blanc de conduite

### En-têtes

| Avant | Après | Pourquoi |
|---|---|---|
| `Examen blanc de conduite` (H1 intro) | **Examen blanc** | « de conduite » est implicite (on est dans la révision conduite). Allège le titre. |
| `Examen blanc` (H1 pendant le quiz) | **Examen blanc** *(garder)* | OK tel quel. |
| `Le contenu arrive très vite 👀` | **Ça arrive très vite 👀** | Cohérent avec l'autre empty state. Plus parlé. |

### Écran d'intro

| Avant | Après | Pourquoi |
|---|---|---|
| `N questions, tous les mondes` | **N questions · toutes les compétences** | « mondes » = jargon interne (gamif). L'élève comprend « compétences ». |
| `Tu réponds dans ta tête, tu vérifies, et tu t'auto-notes honnêtement. À la fin : où tu en es + quoi réviser.` | **Réponds dans ta tête, vérifie, note-toi cash. À la fin : où t'en es + quoi bosser.** | Verbes à l'impératif = rythme. « cash » > « honnêtement » (plus jeune, même sens). « bosser » > « réviser » (varie). Phrase plus courte. |
| `⚠️ C'est une auto-évaluation pour t'entraîner — la vraie note (/31), c'est l'inspecteur le jour J qui la donne.` | **⚠️ C'est un entraînement, pas la vraie note. Le /31, c'est l'inspecteur le jour J.** | Plus court, garde la HONNÊTETÉ (essentiel : ne pas faire croire que c'est officiel). Met le mensonge à éviter en premier (« pas la vraie note »). |
| `Commencer` (bouton) | **C'est parti** → ou **J'y vais** | « Commencer » est neutre/scolaire. « C'est parti » = élan, ton complice. |

### Pendant les questions

| Avant | Après | Pourquoi |
|---|---|---|
| `Question X / Y` | **X / Y** *(retirer « Question »)* | Redondant : on voit bien que c'est une question. Le compteur pur va plus vite à lire. |
| `Voir la réponse` (bouton) | **La réponse** → ou **Montre** | « Voir » est faible. Le nom seul suffit, on sait qu'on va l'afficher. |
| `Je savais ✅` (bouton auto-note) | **Je savais ✅** *(garder)* | Honnête, clair, parfait pour l'auto-éval. RAS. |
| `Pas sûr` (bouton auto-note) | **Pas sûr** *(garder)* | Juste et non culpabilisant (« faux » serait plus dur). RAS. |

### Écran de résultat

| Avant | Après | Pourquoi |
|---|---|---|
| `Tu te sens prêt !` (verdict ≥80%) | **Ça sent bon !** → ou **T'es chaud !** | « prêt » frôle la fausse promesse (seul le moniteur le dit). « Ça sent bon » = positif SANS affirmer la réussite. Plus honnête. |
| `Beau score. Confirme avec ton moniteur — c'est lui qui valide pour de vrai.` | **Gros score. Le dernier mot, c'est ton moniteur — montre-lui.** | Garde la vérité (le moniteur valide), mais en plus court et plus actionnable (« montre-lui »). |
| `Presque !` (verdict ≥50%) | **Presque !** *(garder)* | Court, encourageant, juste. RAS. |
| `Encore quelques révisions ciblées et c'est dans la poche.` | **Quelques révisions et c'est plié.** | « ciblées » mou, « dans la poche » cliché. « plié » = ton jeune, plus court. |
| `Continue à réviser` (verdict <50%) | **Faut bosser un peu** → ou **Encore un peu** | « Continue à réviser » sonne reproche scolaire. Version pote = factuel sans juger. |
| `Reprends les fiches tranquillement, ça va rentrer.` | **Relis les fiches cool, ça va rentrer.** | « tranquillement » → « cool » (plus parlé). « ça va rentrer » est déjà parfait, on garde. |
| `À revoir en priorité` (titre liste) | **À retravailler en premier** → ou **Bosse ça d'abord** | « revoir » est passif. « retravailler / bosse » = action concrète. |
| `Rien à revoir, propre. 🎯` | **Rien à retravailler, propre. 🎯** | Cohérence avec le titre ci-dessus. « propre » est top, on garde. |
| `Retour à la révision` (bouton) | **Retour aux révisions** | Pluriel = l'ensemble du contenu (plus invitant qu'un singulier abstrait). Court. |

---

## 3. `premium-quiz.js` — le moteur de quiz « jeu vidéo »

> Ce composant porte déjà une copy très soignée (variabilité des éloges = bon réflexe
> dopamine). Quelques resserrages seulement.

### Tableaux de feedback variable

| Avant (liste `PRAISES`) | Après | Pourquoi |
|---|---|---|
| `Dans le mille` | *(garder)* | Court, imagé, varié. Top. |
| `Tu gères` | *(garder)* | Parfait. |
| `Pile poil` | *(garder)* | Parfait. |
| `Réflexe parfait` | *(garder)* | OK. |
| `Bien vu` | *(garder)* | OK. |
| `Exactement` | **Exact** | « Exactement » est le plus long et le plus plat de la liste. « Exact » = plus sec, plus punchy. |
| `Au quart de tour` | *(garder)* | Bonne réf. conduite, on garde. |
| `Comme un pro` | *(garder)* | OK. |
| `Propre` | *(garder)* | Excellent (1 mot). |
| *(ajout suggéré)* | **+ « Carton »** ou **« Ça passe crème »** | Enrichir le pool = moins de répétition perçue. Optionnel. |

| Avant (liste `COACH`, après une erreur) | Après | Pourquoi |
|---|---|---|
| `Le bon réflexe` | *(garder)* | Cadre la correction sans dire « faux ». Bon. |
| `À garder en tête` | *(garder)* | OK. |
| `Le truc de pro` | *(garder)* | OK. |
| `Pour la prochaine` | *(garder)* | OK, ton bienveillant. |
| `Bon à savoir` | *(garder)* | OK. |

> Note : ces en-têtes COACH ne disent jamais « Faux / Raté » — c'est un **bon réflexe
> anti-culpabilisation**, à préserver.

### Boutons & résultats

| Avant | Après | Pourquoi |
|---|---|---|
| `Suivant` (bouton) | **Suivant** *(garder)* | Standard, rapide. RAS. |
| `Voir mon score` (dernier bouton) | **Mon score** | « Voir » faible. Le nom seul = plus rapide, on sait qu'on va l'afficher. |
| `Tu maîtrises !` (résultat ≥80%) | **Tu maîtrises !** *(garder)* | Honnête (parle de maîtrise du quiz, pas de « validé »). RAS. |
| `Beau score. Garde ce niveau et confirme avec ton moniteur.` | **Gros score. Garde ce niveau, montre-le à ton moniteur.** | Cohérent avec exam-conduite (« montre-lui »). « confirme » → « montre » = plus concret. |
| `Bien joué` (résultat ≥50%) | **Bien joué** *(garder)* | Court, chaleureux. RAS. |
| `Tu y es presque — refais-en quelques-unes et c'est verrouillé.` | **Presque — refais-en deux-trois et c'est verrouillé.** | « Tu y es » mou. « deux-trois » plus parlé que « quelques-unes ». « verrouillé » = top, on garde. |
| `Ça vient` (résultat <50%) | **Ça vient** *(garder)* | Parfait : encourage sans juger. RAS. |
| `Relis la fiche tranquille, puis retente. Ça va rentrer.` | **Relis la fiche cool, puis retente. Ça va rentrer.** | Cohérence « cool » avec exam-conduite. Reste juste et chaleureux. |
| `Continuer` (bouton final) | **Continuer** *(garder)* | Standard. RAS. |

---

## Récap des décisions transversales (à appliquer partout)

1. **Bannir « point faible »** → « défi » / « à retravailler ». Jamais culpabilisant.
2. **Bannir « monde »** dans la copy élève visible → « compétence » / « thème » (« monde »
   reste OK en interne/code).
3. **Couper « Question » / « Étape »** devant les compteurs `X / Y`.
4. **« quizz » → « quiz »** (orthographe) si tu touches le libellé.
5. **Verbes à l'impératif tutoyé** sur les boutons d'action (« Lance », « Réponds », « Montre »).
6. **Cohérence du registre** : « cool », « plié », « bosser », « montre-lui » réutilisés
   d'un écran à l'autre = l'app a UNE voix.
7. **Garde-fou honnêteté** (non négociable) : ne jamais transformer un verdict d'auto-éval
   en promesse (« prêt », « validé », « réussi »). Le moniteur valide, l'inspecteur note.

---

## Garde-fous « ne PAS faire »

- ❌ Pas de « Bravo champion », « Génial !!! », pas de double émoji décoratif.
- ❌ Pas de fausse urgence anxiogène (« Vite ! », « Tu vas échouer si… »).
- ❌ Pas de « validé / prêt / réussi » sur de l'auto-évaluation.
- ❌ Pas de jargon REMC visible (« compétence C3 », « objectif 14 »).
- ❌ Pas de « monde » dans le texte vu par l'élève.
