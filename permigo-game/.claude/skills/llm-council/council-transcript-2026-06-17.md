# Council Transcript — Modèle économique PermiGo+

**Date :** 2026-06-17

## Question framée
Lancer PermiGo+, abonnement premium ÉLÈVE à 3,99€/mois (fiches centre d'examen, révise-par-centre, examen blanc illimité) + 1€/mois reversé au moniteur de l'élève (commission de parrainage) + « premier mois offert au moniteur » après 3 abos parrainés — sur fond d'un SaaS B2B où l'auto-école paie déjà ~9,99€/seat/moniteur. Garder / modifier / abandonner ?

## Mapping anonymisation
- A = The Outsider
- B = The Contrarian
- C = The Executor
- D = The First Principles Thinker
- E = The Expansionist

## Réponses des advisors

### The Contrarian (B)
Problème fatal : tu retournes ton canal de vente B2B contre toi-même. Le moniteur (champion qui vend les seats au patron) devient un affilié qui monétise sa relation avec des jeunes sous pression financière → risque DGCCRF (pratique commerciale trompeuse). Unit economics : 3,99 − 1 − ~0,50 (Stripe) = 2,49€ de marge ; il faut 4 élèves payants permanents pour « offrir » un seat à 9,99€ ; conversion réelle 15-20% → jamais rentable. Le patron va se réveiller (son moniteur touche de l'argent de ses élèves via toi) → résiliation + plainte. WTP de l'élève non testée pour des fiches dispo gratuitement. Lance d'abord un paywall élève SANS commission, valide le WTP.

### The First Principles Thinker (D)
La vraie question : qui détient la relation ? PermiGo+ inverse la hiérarchie (élève devient client, moniteur devient commercial payé). (1) Commission structurellement corrompue : un moniteur réglementé (ECSR) payé pour recommander un produit payant à un élève vulnérable frôle le démarchage abusif (DGCCRF). (2) 3€ pour couvrir 9,99€ = tu subventionnes ton propre canal via ton propre client B2B → signe que ton pricing B2B est trop bas, pas que le B2C est une opportunité. (3) L'élève veut-il payer pour un outil que son école lui impose gratuitement ? Prouve d'abord l'usage spontané. Sinon PermiGo+ = extraction, pas valeur.

### The Expansionist (E)
L'upside : PermiGo+ n'est pas un abonnement, c'est un CANAL DE DISTRIBUTION. 1,3M candidats/an, permis à 1800-2500€ → 3,99€ est du bruit. Chaque élève abonné = profil qualifié (âge, ville, centre, date d'obtention) que les assureurs jeune conducteur / fintech auto paieraient cher (CPA 30-80€). 100k élèves = 3-8M€/an via partenariats assurance. Bundle « abo + 1er mois assurance offert ». Expansion Belgique/Maroc/Tunisie. Pousse la commission moniteur en cashback/réduction seat → force commerciale de 20 000 personnes. L'upside = marketplace post-permis qui vaut 10x le SaaS B2B.

### The Outsider (A)
Réaction d'élève : je paie déjà 1500-2000€ pour le permis, 3,99€ c'est pas la mort. MAIS le truc gênant : pourquoi mon auto-école ne me le donne pas gratuit si elle paie déjà l'abo ? Sentiment de DOUBLE FACTURATION. Le 1€ au moniteur = commission cachée → il me recommande pour mon bien ou parce qu'il est payé ? Il est censé être mon prof, pas un affilié Amazon. Les features ressemblent à du gratuit (YouTube, Codéclic). Tension principale = double facturation perçue.

### The Executor (C)
Lundi matin : lance manuellement. Pas de Stripe Connect. WhatsApp à 5 moniteurs (« 3 élèves via ton lien = ton mois offert »), encaisse via Stripe Payment Link, Google Sheet, rembourse à la main. Valide en 30 jours sans code. Blocages : (1) MINEURS 17-18 ans, accord parental requis, risque rétrofacturation → case à cocher +18/accord parents. (2) Commission moniteur = revenu imposable déclarable, surtout si salarié (vs auto-entrepreneur) → comptable. (3) Stripe Connect : pas avant 50 élèves payants.

## Peer reviews (synthèse)
- **Plus forte :** B (3 votes) et D (2 votes) — toutes deux pointent que la commission corrompt le canal + unit economics cassées.
- **Plus gros angle mort :** E (unanime) — overreach, ignore RGPD/CNIL sur données de mineurs, suppose le B2B acquis alors qu'il est la condition de survie, churn non adressé.
- **Ce que les 5 ont manqué :**
  - Les PARENTS sont les vrais payeurs/prescripteurs du permis (ignorés).
  - Le PATRON d'auto-école = risque d'extinction (résiliation, fédérations CNPA/UNIC) ; sa proposition de valeur B2B repose implicitement sur la GRATUITÉ élève.
  - Le moniteur activerait-il PermiGo+ s'il ne touche rien ? Sinon la feature n'a pas de valeur propre.
  - La valeur pic POST-permis (assurance, voiture) → PermiGo+ devrait peut-être être un produit post-obtention.

## Chairman — Verdict
Voir council-report-2026-06-17.html. Recommandation : MODIFIER fortement — tuer la commission cash au moniteur, régler la double-facturation perçue (bundle B2B ou positionnement propre), valider le WTP en no-code d'abord, envisager un prix one-shot + l'angle post-permis comme vraie expansion.
