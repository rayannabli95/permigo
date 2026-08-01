# Les 6 chantiers des premières secondes — briefs prêts à lancer

**Date** : 1er août 2026 · suite de [`AUDIT_PREMIERES_SECONDES_2026-08-01.md`](AUDIT_PREMIERES_SECONDES_2026-08-01.md)
**Comment s'en servir** : chaque chantier a un **prompt complet à copier tel quel** dans une session (Claude ou Codex). Un chantier = une branche = une PR. Les prompts sont écrits pour être exécutables sans que l'agent ait besoin de deviner quoi que ce soit.

**Ordre conseillé** : 1 → 4 → 3 → 2 → 5 → 6.
Le chantier 1 est un correctif de fuite, le 2 est le gros gain, le 5 est le plus long, le 6 ne demande pas de code.

**Règles qui valent pour les six** (elles sont rappelées dans chaque prompt, ne pas les retirer) :
- On part d'un **worktree isolé depuis `origin/main` fraîchement récupéré**, jamais du dossier de travail principal.
- On **mesure dans l'app réelle** (build de prod + navigateur piloté + captures) avant de conclure. Lire le code ne suffit pas : trois balayages successifs ont déjà raté les mêmes fichiers.
- **Textes affichés** : zéro tiret comme séparateur, zéro virgule dans un titre ou un bouton, le point médian `·` pour les énumérations courtes.
- **Sécurité** : toute donnée utilisateur injectée en `innerHTML` passe par `esc()`. Tokens couleur `--a` `--su` `--mu` `--bo` `--ink`, jamais `--surface` ni `--border`.
- **Avant de dire « c'est fini »** : `npm run build` vert, `npm run test` sur les flux touchés, et la vraie sortie recopiée.

---

## Chantier 1 — La journée « rien ne fuit »

**Sous-chantiers** : 1a la langue du visiteur · 1b la porte du compte gratuit · 1c le bandeau cookies · 1d les cinq chaînes fausses · 1e l'écran de démarrage trop long.
**Durée** : 1 journée. **Branche** : `fix/premieres-secondes-fuites`.

```
Tu es développeur produit sur PermiGo (Vanilla JS + Vite + Supabase, dossier permigo-game/).
Mission : boucher les fuites des dix premières secondes du visiteur. Cinq sous-chantiers,
une seule PR. Tout est mesuré dans l'audit AUDIT_PREMIERES_SECONDES_2026-08-01.md, lis-le
d'abord.

PRÉPARATION OBLIGATOIRE
- git fetch origin main, puis worktree isolé depuis origin/main. Jamais dans le dossier sale.
- Compte l'écart avec origin/main AVANT de toucher quoi que ce soit et dis-le moi.
- Lance le build de prod et sers-le, tu travailleras avec un navigateur piloté et des captures.

1a — LA LANGUE DU VISITEUR EST IGNORÉE (bloquant)
Symptôme mesuré : un téléphone en anglais, arabe ou bengali reçoit la page de vente
entièrement en français. L'écran de démarrage, lui, salue bien dans la bonne langue à la
première visite, puis dit « Bonjour » à la deuxième.
Cause : src/utils/lang.js — initLangEarly() appelle applyLang(getLang()) ; getLang() renvoie
« fr » par défaut et applyLang() PERSISTE ce défaut dans localStorage.permigo_lang. Ensuite
src/pages/public/pass.js lit permigo_lang AVANT navigator.language : le repli navigateur est
du code mort.
Travail attendu :
 - Ne jamais persister un défaut. Soit applyLang(lang, {persist:false}) au démarrage, soit un
   drapeau permigo_lang_explicit posé uniquement sur un choix humain (sélecteur, inscription,
   réglages) ou sur un ?lang= de campagne.
 - Ordre de priorité unique et documenté, appliqué partout (pass.js, rejoindre.js, login.js,
   le script inline de index.html) : ?lang= → choix explicite mémorisé → préférence en base
   pour un connecté → navigator.language → français.
 - Poser <html lang> ET le titre de l'onglet dans la langue affichée, sur toutes les pages
   publiques.
 - Vérifier que la préférence en base d'un élève connecté gagne toujours sur le miroir local.
Preuve à me fournir : un tableau de 6 mesures réelles (fr-FR, en-US, en-GB, ar-EG, ar-MA,
bn-BD) avec pour chacune la langue affichée en première visite, en deuxième visite, et après
un clic sur le sélecteur. Plus 3 captures.

1b — LE COMPTE GRATUIT N'A AUCUNE PORTE (bloquant)
Mesuré : #/rejoindre?solo=1 n'est référencé qu'UNE fois dans tout le code, sur l'écran de
succès après paiement. Le mot « gratuit » n'apparaît pas une seule fois dans pass.js. Sur
#/login le seul chemin élève exige un code moniteur. #/pro n'a aucun lien entrant.
Travail attendu :
 - Sur la page d'accueil publique : un CTA secondaire sous le bouton principal,
   « Commencer gratuitement · 3 leçons offertes », vers #/rejoindre?solo=1. Il doit exister
   dans les trois langues.
 - Sur #/login, en pied de page : « Pas encore de compte ? Créer mon compte élève · gratuit ».
 - Sur #/rejoindre?solo=1 : titre et sous-titre qui annoncent le gratuit, pas le Pass payé.
   Reprends les mots déjà validés dans free-tier-wall.js (3 premières leçons à toi pour
   toujours · 3 questions par jour · 1 scène par jour).
 - Traque : un évènement distinct pour ce CTA gratuit, séparé du CTA payant, dans
   src/services/analytics.js.
Interdit : promettre plus que ce que free-tier.js donne vraiment (C1a C1b C1c à vie,
quiz 3/jour, scène 1/jour). Vérifie les quotas dans le code avant d'écrire un chiffre.

1c — LE BANDEAU COOKIES MASQUE L'OFFRE (bloquant)
Mesuré : src/components/common/cookie-banner.js s'affiche à 800 ms et occupe le tiers bas
d'un iPhone 13, il recouvre le billet et le bouton principal.
Travail attendu : version compacte d'une ligne collée en bas, hauteur maximale 72 px, deux
choix visuellement équivalents, apparition après 4 secondes OU au premier scroll. Vérifie
qu'aucun traceur non essentiel (PostHog, Vercel) n'est initialisé avant le consentement, sinon
le report est illégal. Garde la mention « Aucune publicité dans l'app », elle rassure.
Preuve : capture avant/après sur iPhone 13 et sur un petit écran (iPhone SE).

1d — LES CINQ CHAÎNES FAUSSES
 - pass.js : « Embarquement JUIL. 2026 » est périmé au 1er août. Rends la date dynamique
   (mois courant) ou retire la ligne.
 - pass.js : « La seule app qui… » est une allégation de supériorité invérifiable, risque au
   titre des pratiques commerciales trompeuses. Remplace par « L'app qui travaille ta
   conduite, pas seulement le code ».
 - pass.js FAQ française : « cette page existe en anglais » alors que l'arabe existe.
 - login.js : le sélecteur affiche « ع » au lieu de « العربية » comme sur rejoindre.js.
 - pass.js : « Réserver ma place » suppose des places limitées alors que le compteur a été
   retiré. Remplace par « Ouvrir tout mon parcours ».
Vérifie chaque chaîne dans les TROIS dictionnaires (fr, en, ar), pas seulement le français.

1e — L'ÉCRAN DE DÉMARRAGE COÛTE 2 À 3,4 SECONDES
index.html tient le splash 2 s (plafond 3400 ms) alors que le contenu est prêt à 800 ms en 4G.
Travail attendu : conserver l'écran de marque complet pour l'app installée et pour un visiteur
déjà venu ; le réduire à 900 ms maximum pour une première visite venant d'un lien externe
(présence de ?utm_ ou d'un referrer externe). Ne casse pas le repli image ni le respect de
prefers-reduced-motion.
Preuve : mesures avant/après en wifi, 4G lente et 3G, avec le temps du premier titre lisible.

CRITÈRES D'ACCEPTATION DE LA PR
- Les 6 mesures de langue sont vertes.
- Un visiteur sans code moniteur peut créer un compte gratuit en partant de la page d'accueil,
  en 3 taps maximum.
- Le billet et le bouton principal sont visibles à la première seconde sur iPhone 13.
- Zéro chaîne périmée, dans les trois langues.
- npm run build vert, npm run test vert, sorties recopiées dans la PR.
- La PR contient un avant/après visuel pour chaque sous-chantier.
```

---

## Chantier 2 — La démonstration jouable

**Sous-chantiers** : 2a la scène sans compte · 2b le retour pédagogique · 2c le passage vers le compte · 2d la mesure de l'entonnoir.
**Durée** : 2 jours. **Branche** : `feat/demo-jouable-landing`.

```
Tu es designer produit ET développeur sur PermiGo. Mission : rendre le produit jouable AVANT
l'inscription et AVANT le prix. C'est le chantier qui rapporte le plus dans l'audit
AUDIT_PREMIERES_SECONDES_2026-08-01.md (faille C1).

LE PROBLÈME EN UNE PHRASE
Aujourd'hui le visiteur froid arrive sur une billetterie : logo, promo, billet doré, prix. Il
n'a rien vu bouger, rien réussi, et on lui demande 24,99 €. Le taux de conversion sera bas et
on n'apprendra rien de l'échec.

CE QU'ON CONSTRUIT
Une vraie scène « En situation » jouable directement dans la page d'accueil publique, sans
compte, au-dessus de la ligne de flottaison, à la place du billet doré actuel (le billet
descend sous la démonstration).

2a — LA SCÈNE
- Réutilise le moteur existant : src/components/eleve/situation-scene.js, les données de
  src/data/situations-conduite.js et les traductions de src/data/situations-i18n.js. N'écris
  pas un deuxième moteur. Si le composant dépend d'un utilisateur connecté ou d'un appel
  Supabase, isole une version publique qui n'écrit rien et ne lit rien en base.
- Choisis UNE scène d'ouverture et défends ton choix : elle doit être comprise sans avoir
  jamais conduit, visuelle avant d'être textuelle, et donner raison au joueur dans 70 % des
  cas environ (on veut une victoire, pas un examen).
- Trois réponses tapables maximum. Aucune saisie clavier. Zone de tap 44 px minimum.
- Elle doit fonctionner en français, anglais et arabe, la version arabe en miroir complet.

2b — LE RETOUR
- Bonne réponse : féliciter et NOMMER la compétence de conducteur, jamais le code REMC à
  l'écran. Exemple de ton : « Bien vu. C'est exactement ce que regarde l'inspecteur. »
- Mauvaise réponse : jamais « faux », jamais « raté ». On montre l'indice qui décide, on
  explique en deux lignes dans le vocabulaire d'un moniteur, et on propose de réessayer.
- Le retour doit être lisible par quelqu'un qui parle mal français : phrases de 8 mots
  maximum, une idée par phrase.

2c — LE PASSAGE
- Après la scène : « Continuer gratuitement · 3 leçons offertes » vers #/rejoindre?solo=1.
- Le prix reste EN DESSOUS de la démonstration, jamais au-dessus.
- Le CTA payant ne disparaît pas, il devient secondaire dans la hiérarchie.

2d — LA MESURE
Ajoute les évènements manquants dans src/services/analytics.js pour suivre l'entonnoir
complet, qui aujourd'hui commence trop tard : page ouverte → scène affichée → scène jouée →
réponse juste ou fausse → clic gratuit → compte créé → 3e leçon atteinte → mur → paiement.
Chaque évènement porte la langue.

AXES À COUVRIR DANS TA PROPOSITION (avant de coder)
- Psychologie : quelle émotion à la seconde 10 ? On cherche la compétence ressentie, pas
  l'amusement.
- Poids : la page fait déjà 1,9 Mo. Ta démonstration ne doit pas ajouter plus de 150 Ko sur la
  première vue. Images en WebP ou AVIF, différé pour tout ce qui est sous la ligne.
- Accessibilité : navigable au clavier, focus visible, prefers-reduced-motion respecté,
  contraste AA sur le texte de retour.
- Repli : si le module de scène échoue à charger, la page doit rester vendable (image fixe +
  CTA), jamais un trou blanc.
- Ne dépends pas d'IntersectionObserver pour rendre la scène visible : le contenu est visible
  par défaut, l'animation retire un état plutôt que de l'ajouter.

MÉTHODE
Commence par une maquette (capture ou page statique) que je valide, avant d'écrire le code
définitif. Montre-moi deux directions d'ouverture différentes, pas une seule.

CRITÈRES D'ACCEPTATION
- Un inconnu peut jouer une scène en 2 taps depuis l'ouverture de la page, sans compte.
- Le premier prix visible n'apparaît qu'après la démonstration.
- Fonctionne dans les trois langues, arabe en miroir.
- Première vue sous 700 Ko, mesurée.
- L'entonnoir complet est traçable de bout en bout.
```

---

## Chantier 3 — Le prix

**Sous-chantiers** : 3a deux offres partout · 3b l'addition remontée · 3c le vocabulaire commercial · 3d la garantie.
**Durée** : une demi-journée. **Branche** : `fix/offre-coherente`.

```
Tu es responsable monétisation sur PermiGo. Mission : rendre l'offre cohérente et le prix
justifié. Base : AUDIT_PREMIERES_SECONDES_2026-08-01.md, failles C4 et C5.

3a — DEUX OFFRES PARTOUT
Aujourd'hui la page publique pass.js affiche 3 offres (9,99 · 24,99 · 39,99) alors que le mur
interne pass-requis.js n'en affiche que 2 depuis la décision du 31/07 (9,99 · 24,99). L'élève
qui a vu Platine et ne le retrouve plus perd confiance.
Travail : aligner la page publique sur deux offres. Vérifie AUSSI le circuit de paiement
(src/services/billing.js et l'edge function pass-checkout) : si un plan disparaît de l'écran,
regarde qui le lit encore côté serveur, webhook et table pass_purchases, avant de le retirer.
Retirer une offre ne se voit PAS dans le build.

3b — L'ADDITION REMONTÉE
Le bloc « 1 heure de conduite 55 € · budget permis 1 800 € · PermiGo 9,99 € » est le meilleur
argument de la page et il est enterré au deux tiers. Remonte-le juste AVANT les offres, avec
une conclusion neutre : « PermiGo coûte moins qu'une demi-heure de conduite. » Garde les
sources affichées.

3c — LE VOCABULAIRE
Retire la rareté fabriquée : « Réserver ma place » sans places limitées, « Offre de
lancement » sans date, « le prix remontera » sans échéance. Deux options, tu me proposes
laquelle tu défends : soit une date réelle affichée, soit on enlève tout et on assume le prix
plein. Sur une cible jeune et méfiante, la fausse rareté coûte plus qu'elle ne rapporte.

3d — LA GARANTIE
« Satisfait ou remboursé sous 3 jours » doit apparaître deux fois : sous le bouton principal
et dans le bloc des offres. Vérifie que le texte dit exactement la même chose aux trois
endroits où il vit aujourd'hui, et dans les trois langues.

CRITÈRES D'ACCEPTATION
- Le même catalogue partout : page publique, mur interne, paiement, page de succès.
- Aucune mention de rareté non datée.
- Le prix n'apparaît jamais avant une démonstration ou l'addition.
- Build vert, et un test qui ouvre le paiement des deux offres restantes sans erreur.
```

---

## Chantier 4 — Les portes oubliées

**Sous-chantiers** : 4a moniteur · 4b auto-école · 4c la promesse moniteur en public.
**Durée** : 2 heures pour les liens, une journée si on fait la page moniteur publique.
**Branche** : `feat/portes-moniteur-ecole`.

```
Tu es responsable acquisition sur PermiGo. Mission : deux segments payants n'ont aucune porte
d'entrée sur le site.

CONSTAT VÉRIFIÉ
- #/pro (la page auto-école, bien faite, avec formulaire de devis) n'est liée depuis AUCUNE
  page. Page orpheline.
- Le moniteur n'a qu'un lien minuscule en pied de page de la page d'accueil.
- La meilleure promesse moniteur du produit (« Tes élèves préparent chaque leçon dans l'app.
  Toi, tu vois qui s'entraîne, qui avance, qui décroche. D'un coup d'œil. ») n'existe QUE dans
  le tour guidé, c'est-à-dire APRÈS l'inscription. Elle ne convainc donc personne.

TRAVAIL
4a et 4b : une ligne discrète mais réellement visible sur la page d'accueil publique, en haut
ou juste avant le pied de page : « Moniteur ou auto-école ? » avec deux liens séparés, vers
#/creer-compte et vers #/pro. À faire dans les trois langues.
4c : sortir la promesse moniteur du tour guidé et la poser sur #/creer-compte en titre, avec
trois preuves de ce que le moniteur voit vraiment (reprends ce qui existe dans
src/pages/enseignant/aujourdhui.js et mes-eleves.js, ne promets rien qui n'existe pas).

QUESTION À TRANCHER, DIS-MOI CE QUE TU RECOMMANDES
Le prix moniteur (9,99 €/mois) n'est annoncé nulle part avant l'inscription. Est-ce qu'on
l'affiche sur #/creer-compte au risque de faire fuir, ou est-ce qu'on garde la découverte du
tableau de bord d'abord ? Argumente avec le comportement d'un moniteur indépendant qui se
méfie des outils qui lui prennent du temps.

CRITÈRES D'ACCEPTATION
- Depuis la page d'accueil, un moniteur atteint son inscription en 2 taps, une auto-école
  atteint le devis en 2 taps.
- La promesse moniteur est lisible sans compte.
- Aucune promesse qui ne corresponde pas à un écran existant.
```

---

## Chantier 5 — L'entrée dans l'app

**Sous-chantiers** : 5a l'inscription à deux champs · 5b la victoire avant la configuration · 5c une seule sollicitation · 5d l'examen blanc offert.
**Durée** : une semaine. **Branche** : `feat/premiere-minute-eleve`.

```
Tu es designer produit sur PermiGo. Mission : refaire la première minute d'un élève qui vient
de s'inscrire. Aujourd'hui il configure l'app, il n'apprend rien.

CE QUI SE PASSE AUJOURD'HUI, MESURÉ
Inscription : 6 champs dont la date de naissance, avant d'avoir rien vu.
Puis src/pages/onboarding/index.js : 4 sections, toutes de la configuration — identité
(prénom et nom déjà saisis à l'inscription, donc doublon), photo de profil et couleur, rappels
du soir, installation de l'app.
Puis src/components/common/guided-tour.js : un tour de 5 étapes qui recouvre l'accueil.
Plus une bannière d'installation (install-nudge.js) et une alerte de série qui n'a aucun sens
pour un compte neuf.
Résultat : trois couches de sollicitation avant le premier contenu, et zéro victoire.

TRAVAIL
5a — Inscription réduite à deux champs : email et mot de passe. Le prénom est demandé plus
tard, au moment où il sert (le premier « Salut Yanis »). La date de naissance ne sert qu'au
consentement parental : ne la demande qu'au moment où elle est nécessaire, et explique
pourquoi en une phrase. Vérifie l'impact sur le mur de consentement parental
(parental-consent.js et les gardes de route) AVANT de déplacer le champ.
5b — Inverser l'ordre : une scène jouée et une carte gagnée AVANT toute configuration. La
couleur d'avatar et les rappels partent dans le profil, proposés plus tard.
5c — Une seule sollicitation par session, et aucune à la toute première ouverture. La première
ouverture montre le bouton « Je me prépare » et rien d'autre. Coordonne-toi avec
src/utils/intro-overlays.js qui gère déjà l'ordre des popups.
5d — Offrir l'examen blanc de conduite une fois au compte gratuit. C'est le meilleur argument
de vente du produit : une note honnête crée le besoin. Vérifie les quotas dans
src/utils/free-tier.js et la liste DISCOVERY_ROUTES, et n'ouvre que ce qui est décidé.

AXES À COUVRIR
- Psychologie : la première minute doit produire une fierté, pas un réglage.
- Rétention : ne casse pas le mécanisme de rappel du soir, c'est lui qui ramène l'élève.
  Propose-le APRÈS la première victoire, au moment où il a une raison de revenir.
- Migration : des comptes existants sont au milieu de l'ancien parcours. Vérifie
  first_value_action_at et les drapeaux localStorage pour qu'ils ne repassent pas par
  l'onboarding.
- Tests : la suite e2e couvre l'onboarding (tests/e2e/onboarding.spec.js). Elle doit rester
  verte ou être mise à jour en connaissance de cause. La suite est verte depuis le 31/07,
  un rouge est un vrai signal.

MÉTHODE
Maquette d'abord, écran par écran, avec le temps maximum que l'élève doit passer sur chacun.
Je valide avant le code.

CRITÈRES D'ACCEPTATION
- Un compte neuf a réussi quelque chose en moins de 60 secondes, chronométré.
- Deux champs à l'inscription.
- Une seule sollicitation par session, aucune à la première ouverture.
- e2e verte, build vert, sorties recopiées.
```

---

## Chantier 6 — Les preuves

**Sous-chantiers** : 6a avis élèves · 6b caution métier · 6c chiffres d'usage · 6d où les poser.
**Durée** : dépend de la collecte, pas du code. **Branche** : `feat/preuves-sociales`.

```
Tu es responsable marketing sur PermiGo. Mission : la page d'accueil n'a AUCUNE preuve
sociale. Ni avis, ni nombre d'utilisateurs, ni caution métier. La seule statistique affichée
(74,7 % contre 56,8 %) parle de la conduite accompagnée, pas de PermiGo. Un beau site inconnu
ne convertit pas, surtout auprès d'un public qui se méfie des services en ligne.

6a — AVIS ÉLÈVES
Objectif : trois avis réels, un par persona — un débutant, un dont l'examen approche, un non
francophone. Format : prénom, âge, ville, une phrase de résultat concret. Jamais un avis
générique du type « super app ». Prépare-moi le message exact à envoyer aux élèves pour les
obtenir, en français et en arabe, et la façon de recueillir leur accord écrit pour publier.
Interdit absolu : inventer un avis, une note ou un nombre d'utilisateurs.

6b — CAUTION MÉTIER
On a un argument que personne d'autre n'a et qu'on n'utilise pas : le produit est fait par un
moniteur, sur le référentiel officiel (REMC, arrêté du 13/05/2013, 31 compétences), et
l'examen blanc note sur les critères de l'inspecteur. Écris ce bloc pour la page publique en
langage d'élève, sans jargon, dans les trois langues. Le code REMC ne s'affiche jamais à
l'écran de l'élève.

6c — CHIFFRES D'USAGE
Vérifie ce qu'on peut dire de VRAI aujourd'hui (nombre de scènes jouées, de questions
répondues, d'élèves actifs cette semaine) en interrogeant les données réelles. Si le chiffre
n'est pas flatteur, on ne l'affiche pas, on ne le maquille pas. Dis-moi lequel tient debout.

6d — OÙ LES POSER
Un avis juste après la démonstration jouable, la caution métier juste avant les offres, la
garantie deux fois. Pas de mur d'avis : trois preuves bien placées valent mieux que dix
alignées.

LIVRABLE
Un document avec les textes définitifs dans les trois langues, plus l'emplacement exact de
chaque preuve, prêt à intégrer. Le code vient après.
```

---

## Comment on performe mieux en session

Ce qui suit vient des sessions passées, pas de la théorie. Chaque point a déjà coûté du temps au moins une fois.

### Le rituel de début, non négociable

1. **Mesurer l'écart avec `origin/main` avant de parler.** Cette session a commencé sur une branche qui avait **168 commits de retard**. Sans cette vérification, j'aurais audité une version morte du produit et sorti un rapport faux. C'est trente secondes de commande, ça sauve une journée.
2. **Un worktree isolé depuis `origin/main` fraîchement récupéré.** Jamais de travail dans le dossier principal, qui est presque toujours sale.
3. **Un GO nommé par lot.** « Fais le chantier 1 » vaut mieux que « améliore la landing ». Un chantier, une branche, une PR.

### La règle qui change tout : mesurer, pas lire

Les trois bloqueurs de l'audit sont invisibles à la lecture du code. Le bug de langue se voit uniquement en ouvrant la page avec un téléphone en arabe. Le bandeau cookies qui masque le bouton se voit uniquement en capture. La porte manquante du gratuit se voit en comptant les liens entrants.

**Le protocole gagnant** : build de prod → serveur local → navigateur piloté → captures + mesures chiffrées → conclusion. Une conclusion sans capture est une hypothèse.

### Ce qui nous fait perdre du temps, et le contre-poison

| Ce qui arrive | Le contre-poison |
|---|---|
| On travaille sur une branche périmée | Compter l'écart avec `origin/main` en premier |
| On cherche une chaîne et on rate des fichiers | Vérifier à l'œil dans l'app, pas seulement par recherche |
| On retire une fonctionnalité et le build reste vert | Chercher qui LIT encore ce qu'on cesse d'écrire, jusque dans les fonctions serveur et les notifications |
| On patche un libellé en JavaScript puis la page se redessine | Corriger à la source, pas après coup |
| On annonce « c'est vert » sans avoir lancé | Recopier la vraie sortie, toujours |
| On code avant d'avoir vu la maquette | Maquette ou capture d'abord, GO, puis code |

### Ce que j'attends de toi en début de session

- **Le lot** : quel chantier, dans quel ordre.
- **Le GO nommé** quand une maquette te convient, avec le mot « GO » et le nom du lot. Sans ça je continue à proposer au lieu de construire.
- **Ce que l'utilisateur doit récupérer** quand tu demandes une nouveauté. La question « qu'est-ce que Yanis récupère concrètement ? » a déjà évité de construire puis de retirer deux fonctionnalités dans la même journée.

### Ce que tu attends de moi, et que je dois tenir

- **Raconter avant de coder** : « Yanis, 18 ans, leçon demain à 14 h, il ouvre l'app » — une histoire à la première personne, pas une liste d'options. Tu tranches en une ligne.
- **Trois à cinq phrases dans la conversation**, le technique dans le commit et la PR.
- **Une preuve visuelle par lot** : avant / après, sur un vrai téléphone simulé.
- **Dire quand quelque chose est raté**, avec la sortie brute.

### Qui fait quoi quand on est plusieurs

- **Le visuel, la direction artistique, le produit, le créatif** : moi.
- **La mécanique, les textes de masse, les balayages répétitifs, les migrations** : Codex.
- **Le pont entre les deux** : Git et les rapports recopiés. Jamais deux sessions dans le même dossier.
- **Anti-collision** : un chantier touche des fichiers annoncés à l'avance. Le chantier 2 touche `pass.js` et `situation-scene.js`, le chantier 5 touche `onboarding/index.js` et `guided-tour.js` — ils peuvent tourner en parallèle. Les chantiers 1, 3 et 4 touchent tous `pass.js` : ils passent **l'un après l'autre**, jamais en même temps.

### Comment on saura qu'on a gagné

Trois chiffres à suivre après le chantier 2, et pas dix :
1. **Part des visiteurs qui jouent la scène** (aujourd'hui : impossible, la scène n'existe pas).
2. **Part des visiteurs qui créent un compte gratuit** (aujourd'hui : proche de zéro, la porte n'existe pas).
3. **Part des comptes gratuits qui atteignent le mur de la 4e leçon** — c'est le seul vrai signal d'intention d'achat.

Le taux de paiement direct depuis la page d'accueil n'est pas un bon indicateur aujourd'hui : il mesure surtout la qualité de la publicité qui amène le visiteur, pas la qualité du produit.
