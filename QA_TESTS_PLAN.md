# Plan de Tests QA — PermiGo

> Format : T-{série}-{n°} • Objectif • Préconditions • Étapes • Attendu • Priorité • Type

Priorité : 🔴 Critique • 🟠 Haute • 🟡 Moyenne • 🟢 Basse
Type : F=Fonctionnel • U=UX • B=Bug • P=Performance • S=Sécurité • M=Mobile

---

## 1. CONNEXION

### T-1-01 | Inscription élève
- Objectif : créer un compte élève via le formulaire public
- Préconditions : pas de compte existant avec cet email
- Étapes :
  1. Ouvrir l'app, écran login → « Créer un compte gratuit »
  2. Saisir email valide + mot de passe fort + forfait 20h
  3. Saisir nom + téléphone
  4. Valider
- Attendu : compte créé, profil DB inséré (role=eleve), email reçu si confirm ON, redirigé vers accueil
- 🔴 F

### T-1-02 | Login standard email + mot de passe
- Objectif : se connecter avec identifiants valides
- Préconditions : compte existant (latifa.sahli@autopilot.fr / Autopilot2025!)
- Étapes :
  1. Écran login → saisir email + password
  2. Cliquer « Se connecter »
- Attendu : redirection vers accueil élève, toast « Bonjour [Prénom] 👋 »
- 🔴 F

### T-1-03 | Logout depuis menu profil
- Objectif : déconnecter l'utilisateur
- Préconditions : utilisateur connecté
- Étapes :
  1. Profil → bouton Déconnexion
  2. Confirmer
- Attendu : session détruite, retour écran login, localStorage Supabase vide
- 🔴 F

### T-1-04 | Mot de passe oublié → flow OTP
- Objectif : récupérer accès via code OTP par email
- Préconditions : compte existant
- Étapes :
  1. Écran login → cliquer « Mot de passe oublié ? » ou « 🔐 Recevoir un code par email »
  2. Saisir email → Envoyer le code
  3. Aller dans la boîte mail → copier le code 6 chiffres
  4. Coller dans l'app → Vérifier
- Attendu : code reçu en <30s, connexion réussie après vérification
- 🔴 F

### T-1-05 | Session expirée
- Objectif : vérifier comportement à l'expiration du JWT
- Préconditions : connecté depuis >1h, token expiré
- Étapes :
  1. Laisser l'app ouverte 1h+ sans interaction
  2. Tenter une action (créer leçon, etc.)
- Attendu : auto-refresh du token (autoRefreshToken=true) OU redirection login si refresh impossible
- 🟠 F

### T-1-06 | Reconnexion après fermeture app
- Objectif : la session doit persister à la réouverture
- Préconditions : connecté, app fermée proprement
- Étapes :
  1. Fermer complètement l'app
  2. Relancer
- Attendu : restoreSession() restaure CUR_USER, accueil direct sans repasser par login
- 🔴 F

### T-1-07 | Double connexion 2 téléphones
- Objectif : même compte connecté sur 2 appareils
- Préconditions : compte élève, 2 téléphones
- Étapes :
  1. Connexion sur téléphone A
  2. Connexion sur téléphone B (même compte)
  3. Action depuis A
  4. Action depuis B
- Attendu : les 2 sessions actives simultanément, données synchronisées via Supabase
- 🟠 F

### T-1-08 | Changement de téléphone
- Objectif : migration de session sur nouvel appareil
- Préconditions : compte avec données existantes
- Étapes :
  1. Login sur nouveau téléphone
  2. Vérifier profil, leçons passées, progression REMC, gemmes
- Attendu : toutes les données serveur (Supabase) chargées. localStorage local (gemmes, équipement) PERDU
- 🟡 F

### T-1-09 | Mauvais identifiants
- Objectif : message d'erreur clair sur mauvais password
- Préconditions : compte existant
- Étapes :
  1. Saisir bon email + mauvais password
  2. Cliquer Se connecter
- Attendu : message rouge « Identifiants invalides », pas de fuite (pas de « email inconnu » qui révèle l'existence du compte), anim shake
- 🔴 S

### T-1-10 | Compte bloqué (rate limit)
- Objectif : blocage après 5 tentatives échouées
- Préconditions : compte existant
- Étapes :
  1. Saisir 5x mauvais password
  2. 6e tentative
- Attendu : « Trop d'essais — réessaye dans Xmin » (rate-limit client). Pas d'appel Supabase au 6e
- 🔴 S

---

## 2. ÉLÈVE

### T-2-01 | Réserver une leçon
- Objectif : élève réserve un créneau dispo
- Préconditions : connecté élève, créneaux dispo dans planning moniteur
- Étapes :
  1. Accueil → « Réserver »
  2. Choisir jour + heure libre
  3. Valider
- Attendu : leçon créée dans `events` avec eleve_id=moi, type='pend' (en attente moniteur), notif envoyée au moniteur
- 🔴 F

### T-2-02 | Annuler leçon (>24h avant)
- Objectif : annuler une leçon confirmée à l'avance
- Préconditions : leçon confirmée prévue dans >24h
- Étapes :
  1. Planning → tap sur leçon
  2. Bouton « Annuler »
  3. Confirmer
- Attendu : leçon passe en is_deleted=true, créneau libéré, notif moniteur, pas de pénalité
- 🟠 F

### T-2-03 | Annuler leçon <24h (pénalité)
- Objectif : annulation tardive comptabilisée
- Préconditions : leçon dans <24h
- Étapes : idem T-2-02
- Attendu : annulation OK mais flag `motif_annulation`, heure décomptée du forfait
- 🟠 F

### T-2-04 | Déplacer une leçon
- Objectif : changer date/heure d'une leçon existante
- Préconditions : leçon confirmée
- Étapes :
  1. Tap leçon → Modifier
  2. Choisir nouveau créneau dispo
  3. Valider
- Attendu : ancienne leçon supprimée, nouvelle créée, moniteur notifié
- 🟠 F

### T-2-05 | Voir heures restantes
- Objectif : affichage compteur forfait
- Préconditions : élève avec forfait 20h, 5h consommées
- Étapes :
  1. Accueil → bandeau heures
- Attendu : « 15h restantes / 20h » + barre progression à 25%
- 🟠 F

### T-2-06 | Voir planning
- Objectif : afficher liste leçons à venir + passées
- Préconditions : élève avec ≥3 leçons
- Étapes :
  1. Tab Planning
- Attendu : leçons groupées par jour, status visible (pending/conf/done), tri chronologique
- 🟠 F

### T-2-07 | Recevoir notif (réservation acceptée)
- Objectif : push reçue quand moniteur accepte
- Préconditions : leçon en pending, app fermée
- Étapes :
  1. Moniteur accepte depuis son tel
  2. Vérifier notif sur tel élève
- Attendu : notif push reçue en <1min, tap → ouvre l'app sur la leçon
- 🟠 F

### T-2-08 | Payer une leçon
- Objectif : régler un forfait via Stripe/Apple Pay
- Préconditions : élève sans forfait actif
- Étapes :
  1. Accueil → « Recharger forfait »
  2. Choisir 10h / 13h / 20h / 30h
  3. Payer
- Attendu : redirection passerelle, retour avec forfait crédité, facture générée
- 🔴 F

### T-2-09 | Ajouter moyen de paiement
- Objectif : enregistrer une CB pour futurs paiements
- Préconditions : connecté
- Étapes :
  1. Profil → Moyens de paiement → Ajouter
  2. Saisir CB (test : 4242 4242 4242 4242)
  3. Valider
- Attendu : carte tokenisée chez Stripe, jamais stockée brute en DB, affichée masquée •••• 4242
- 🔴 S

### T-2-10 | Consulter progression REMC
- Objectif : voir parcours 4 mondes
- Préconditions : élève avec ≥5 sous-compétences validées
- Étapes :
  1. Tab Parcours
- Attendu : carte sinueuse, mondes débloqués/verrouillés, % progression global, bulles fixées au scroll
- 🟠 F

### T-2-11 | Contacter le moniteur
- Objectif : appel ou message au moniteur
- Préconditions : élève avec moniteur principal
- Étapes :
  1. Fiche élève → bouton Téléphone / Message
- Attendu : ouverture composeur tel ou SMS pré-rempli avec n° moniteur
- 🟡 F

### T-2-12 | Réserver en urgence (J-1)
- Objectif : réserver pour demain
- Préconditions : créneaux dispo demain
- Étapes : idem T-2-01 mais sur demain
- Attendu : réservation OK, badge « Urgent » côté moniteur
- 🟡 F

### T-2-13 | Réserver avec mauvais réseau
- Objectif : robustesse offline-friendly
- Préconditions : Edge / 1 barre
- Étapes :
  1. Réserver une leçon
  2. Observer
- Attendu : loader visible, timeout 10s, message clair si échec, pas de double-création
- 🟠 P

---

## 3. MONITEUR

### T-3-01 | Ajouter dispos sur planning
- Objectif : créer un slot disponible
- Préconditions : moniteur connecté
- Étapes :
  1. Tab Planning → tap créneau vide
  2. Choisir « Dispo »
  3. Valider
- Attendu : event type='dispo' créé, visible côté élève dans réservation
- 🔴 F

### T-3-02 | Supprimer dispo
- Objectif : retirer un slot non réservé
- Préconditions : dispo existante non réservée
- Étapes :
  1. Tap sur la dispo
  2. Supprimer
- Attendu : event supprimé, plus visible côté élèves
- 🟠 F

### T-3-03 | Modifier planning hebdo
- Objectif : copier dispos d'une semaine sur autre
- Préconditions : planning S1 rempli
- Étapes :
  1. Tab Planning → Menu → « Copier sur semaine suivante »
- Attendu : tous les dispos S1 dupliqués sur S2
- 🟡 F

### T-3-04 | Accepter une réservation
- Objectif : confirmer une leçon en pending
- Préconditions : réservation élève en attente
- Étapes :
  1. Notif ou onglet Demandes
  2. Tap demande → Accepter
- Attendu : event.type passe à 'lecon', notif envoyée élève
- 🔴 F

### T-3-05 | Refuser une réservation
- Objectif : refuser une leçon avec motif
- Préconditions : réservation pending
- Étapes :
  1. Demande → Refuser
  2. Saisir motif
- Attendu : élève notifié, créneau libéré
- 🟠 F

### T-3-06 | Voir élèves du jour
- Objectif : liste leçons aujourd'hui
- Préconditions : 3+ leçons aujourd'hui
- Étapes :
  1. Tab Aujourd'hui
- Attendu : liste triée par heure, avec nom élève, lieu RDV, durée, bouton appel
- 🔴 F

### T-3-07 | Signaler absence (jour férié, maladie)
- Objectif : bloquer un jour entier
- Préconditions : aucune leçon planifiée ce jour
- Étapes :
  1. Planning → tap jour → « Absent toute la journée »
  2. Motif
- Attendu : event type='absence', plus de réservation possible
- 🟠 F

### T-3-08 | Déplacer un cours
- Objectif : changer date/heure d'une leçon existante
- Préconditions : leçon confirmée
- Étapes :
  1. Tap leçon → Déplacer
  2. Choisir nouveau créneau
- Attendu : leçon updatée, élève notifié, ancienne place libérée
- 🟠 F

### T-3-09 | Toggle planning J/S/M
- Objectif : changer vue
- Préconditions : connecté moniteur
- Étapes :
  1. Planning → toggle Jour ↔ Semaine ↔ Mois
- Attendu : vue change instant, conserve la date courante
- 🟡 U

### T-3-10 | Recevoir notif annulation
- Objectif : push quand élève annule
- Préconditions : leçon confirmée
- Étapes :
  1. Élève annule depuis son tel
- Attendu : notif moniteur en <1min, créneau remis dispo
- 🟠 F

### T-3-11 | Gérer trou dans planning
- Objectif : détecter et combler 1h libre entre 2 leçons
- Préconditions : leçon 9h, leçon 11h, rien à 10h
- Étapes :
  1. Vue jour
- Attendu : trou 10h-11h visible, possibilité d'ouvrir comme dispo en 1 tap
- 🟡 U

### T-3-12 | Utilisation à 1 main
- Objectif : actions principales accessibles avec pouce
- Préconditions : iPhone tenu d'une main
- Étapes :
  1. Tester scroll + tap principaux boutons
- Attendu : tous les CTA dans la zone basse atteignable, pas de bouton critique en haut
- 🟡 U

### T-3-13 | Lisibilité plein soleil
- Objectif : contraste suffisant en extérieur
- Préconditions : extérieur ensoleillé, luminosité max
- Étapes :
  1. Naviguer dans toutes les pages clés
- Attendu : textes lisibles, contraste ≥ AA WCAG, pas de gris pâle sur blanc
- 🟡 U

---

## 4. PLANNING

### T-4-01 | Double réservation impossible
- Objectif : 2 élèves ne peuvent pas prendre même créneau
- Préconditions : créneau dispo
- Étapes :
  1. Élève A réserve 10h-11h
  2. Élève B tente même créneau en parallèle (autre device)
- Attendu : B reçoit erreur « créneau plus dispo », A confirmé
- 🔴 F

### T-4-02 | Conflit horaire (chevauchement)
- Objectif : éviter qu'un élève réserve 2 leçons qui se chevauchent
- Préconditions : élève a déjà leçon 10h-11h
- Étapes :
  1. Tenter de réserver 10h30-11h30 (autre moniteur)
- Attendu : refus avec message « Conflit avec ta leçon de 10h »
- 🟠 F

### T-4-03 | Créneau passé non réservable
- Objectif : pas de réservation rétroactive
- Préconditions : créneau hier
- Étapes :
  1. Tenter de réserver hier 14h
- Attendu : créneau grisé, non cliquable, message « passé »
- 🔴 F

### T-4-04 | Changement d'heure (été/hiver)
- Objectif : robustesse au passage UTC+1/+2
- Préconditions : leçon le dimanche du changement d'heure
- Étapes :
  1. Réserver leçon dimanche 10h
  2. Vérifier après le changement
- Attendu : heure affichée reste 10h locale, pas de décalage 1h
- 🟡 B

### T-4-05 | Changement de date
- Objectif : reprogrammer leçon de mardi à jeudi
- Préconditions : leçon mardi
- Étapes :
  1. Déplacer leçon vers jeudi
- Attendu : event.d et event.date_event updatés
- 🟠 F

### T-4-06 | Chevauchement côté moniteur
- Objectif : moniteur ne peut pas créer 2 dispos qui se chevauchent
- Préconditions : dispo 10h-11h existante
- Étapes :
  1. Tenter dispo 10h30-11h30
- Attendu : refus ou fusion automatique 10h-11h30
- 🟠 F

### T-4-07 | Annulation last-minute (J-2h)
- Objectif : annulation 2h avant
- Préconditions : leçon dans 2h
- Étapes :
  1. Annuler
- Attendu : confirmation supplémentaire (« Es-tu sûr ? Pénalité »), motif obligatoire
- 🟠 F

### T-4-08 | Déplacer plusieurs fois la même leçon
- Objectif : pas de duplication / fuite
- Préconditions : leçon créée
- Étapes :
  1. Déplacer 5 fois de suite
- Attendu : toujours 1 seule leçon en DB, historique propre
- 🟡 B

### T-4-09 | Créneau libéré redevient dispo
- Objectif : après annulation, créneau revisible aux autres
- Préconditions : leçon annulée
- Étapes :
  1. Élève A annule
  2. Élève B regarde le planning du moniteur
- Attendu : créneau dispo affiché en <30s
- 🟠 F

### T-4-10 | Heure affichée correcte (fuseaux)
- Objectif : pas de décalage fuseau si l'élève voyage
- Préconditions : tel passé en UTC+0
- Étapes :
  1. Vérifier leçon prévue 14h Paris
- Attendu : leçon toujours affichée selon fuseau de l'auto-école (Europe/Paris), pas selon le tel
- 🟡 B

---

## 5. NOTIFICATIONS

### T-5-01 | Notif réservation confirmée
- Objectif : push élève après acceptation moniteur
- Préconditions : leçon pending
- Étapes : moniteur accepte
- Attendu : notif élève en <1min, titre « Leçon confirmée 🚗 »
- 🟠 F

### T-5-02 | Notif annulation
- Objectif : push à l'autre partie en cas d'annulation
- Préconditions : leçon confirmée
- Étapes : élève ou moniteur annule
- Attendu : notif à l'autre partie avec motif si dispo
- 🟠 F

### T-5-03 | Rappel avant cours (H-1h)
- Objectif : push 1h avant leçon
- Préconditions : leçon dans 1h
- Étapes : attendre
- Attendu : notif « Ta leçon avec [moniteur] dans 1h, RDV à [lieu] »
- 🟠 F

### T-5-04 | Notif paiement
- Objectif : confirmation paiement reçu
- Préconditions : paiement effectué
- Étapes : payer un forfait
- Attendu : notif « Paiement de 350€ accepté ✓ »
- 🟡 F

### T-5-05 | Permission notif refusée
- Objectif : comportement si user refuse les notifs OS
- Préconditions : permission notif denied au boot
- Étapes :
  1. Réserver une leçon
- Attendu : pas de crash, fallback (toast in-app), bandeau « Active les notifs pour ne rien rater »
- 🟠 U

### T-5-06 | Notif app fermée
- Objectif : push reçue si app totalement fermée
- Préconditions : app force-quit
- Étapes : moniteur accepte une demande
- Attendu : notif système affichée même app fermée, tap → ouvre app sur leçon
- 🔴 F

### T-5-07 | Notif écran verrouillé
- Objectif : preview sur lock screen
- Préconditions : tel verrouillé
- Étapes : recevoir une notif
- Attendu : notif visible sur lock screen, contenu lisible
- 🟡 U

### T-5-08 | Mauvaise connexion → notif tardive
- Objectif : robustesse latence
- Préconditions : 4G faible
- Étapes : envoyer notif
- Attendu : notif arrive en différé quand connexion revient, pas perdue
- 🟡 P

### T-5-09 | Doublon notif
- Objectif : pas de notif envoyée 2x
- Préconditions : trigger d'événement
- Étapes : provoquer event multiple
- Attendu : 1 seule notif reçue (déduplication serveur)
- 🟠 B

### T-5-10 | Délai notif (<1min)
- Objectif : latence raisonnable
- Préconditions : conditions normales
- Étapes : moniteur accepte
- Attendu : notif reçue en <60s côté élève
- 🟡 P

---

## 6. PAIEMENT

### T-6-01 | Paiement réussi
- Objectif : flow complet OK
- Préconditions : moyen paiement valide enregistré
- Étapes :
  1. Recharger forfait 20h
  2. Choisir CB
  3. Confirmer
- Attendu : redirection vers stripe, retour avec succès, forfait crédité, facture en email
- 🔴 F

### T-6-02 | Paiement refusé
- Objectif : message clair si refus banque
- Préconditions : CB test refus (4000 0000 0000 0002)
- Étapes : tenter paiement
- Attendu : message « Paiement refusé » + raison si dispo, forfait NON crédité, possibilité retry
- 🔴 F

### T-6-03 | Carte expirée
- Objectif : refus côté front avant appel banque
- Préconditions : CB avec date 01/2020
- Étapes : tenter paiement
- Attendu : « Cette carte est expirée » avant submit Stripe
- 🟠 F

### T-6-04 | Carte supprimée
- Objectif : retirer un moyen de paiement
- Préconditions : 2 CB enregistrées
- Étapes :
  1. Profil → Moyens → supprimer
  2. Confirmer
- Attendu : CB retirée chez Stripe, plus dispo dans liste
- 🟡 F

### T-6-05 | Remboursement
- Objectif : remboursement leçon non-effectuée
- Préconditions : leçon payée annulée >24h
- Étapes :
  1. Admin → trouver paiement → Rembourser
- Attendu : remboursement Stripe initié, mail au client, heure recréditée
- 🟠 F

### T-6-06 | Facture générée
- Objectif : PDF facture après chaque paiement
- Préconditions : paiement réussi
- Étapes :
  1. Profil → Factures
- Attendu : facture PDF téléchargeable, avec n° SIRET auto-école, TVA
- 🟠 F

### T-6-07 | Paiement interrompu (back app)
- Objectif : pas de double-paiement si user revient app
- Préconditions : paiement en cours
- Étapes :
  1. Initier paiement
  2. Switch app
  3. Revenir
- Attendu : état préservé, soit succès soit échec clair, pas de débit fantôme
- 🔴 F

### T-6-08 | 3D Secure
- Objectif : validation banque OK
- Préconditions : CB qui requiert 3DS (4000 0027 6000 3184)
- Étapes : payer
- Attendu : popup banque 3DS, retour OK après confirmation
- 🟠 F

### T-6-09 | Double paiement impossible
- Objectif : un même panier ne peut être payé 2x
- Préconditions : paiement en cours
- Étapes :
  1. Cliquer Payer rapidement 2 fois
- Attendu : 2e clic ignoré (bouton disabled), 1 seul débit
- 🔴 B

---

## 7. MOBILE RÉEL

### T-7-01 | iPhone SE (petit écran 4.7")
- Objectif : tout visible et utilisable
- Préconditions : iPhone SE
- Étapes : parcours complet élève
- Attendu : pas de débordement, boutons atteignables, textes lisibles
- 🟠 M

### T-7-02 | iPhone 15 Pro Max (grand écran 6.7")
- Objectif : pas de zone vide moche
- Préconditions : iPhone 15 PM
- Étapes : idem
- Attendu : contenu centré 540px max, fond gradient remplit le reste
- 🟡 M

### T-7-03 | Android petit écran (Pixel 5)
- Objectif : compatibilité Android
- Préconditions : Pixel 5
- Étapes : parcours élève
- Attendu : rendu identique iOS, pas de bug de touch
- 🟠 M

### T-7-04 | Android grand écran (S24 Ultra)
- Objectif : grand display Android
- Préconditions : S24 Ultra
- Étapes : idem
- Attendu : layout adapté
- 🟡 M

### T-7-05 | Mode sombre
- Objectif : couleurs adaptées
- Préconditions : iOS dark mode ON
- Étapes : naviguer toutes pages
- Attendu : pas de fond blanc qui éblouit, contraste OK
- 🟡 U

### T-7-06 | Mode clair
- Objectif : pareil mais light
- Préconditions : iOS light mode
- Étapes : idem
- Attendu : logo violet visible, pas de texte clair sur clair
- 🟡 U

### T-7-07 | Batterie faible
- Objectif : ne pas consommer excès
- Préconditions : batterie 5%
- Étapes : utiliser app 5 min
- Attendu : pas de surchauffe, pas plus de 2-3% conso
- 🟡 P

### T-7-08 | Mode économie d'énergie iOS
- Objectif : animations réduites
- Préconditions : Low Power Mode ON
- Étapes : ouvrir parcours élève
- Attendu : bulles flottantes désactivées (prefers-reduced-motion), reste fonctionnel
- 🟡 P

### T-7-09 | Perte réseau brutale
- Objectif : ne pas crasher
- Préconditions : tel en plein chargement
- Étapes :
  1. Activer mode avion en plein chargement planning
- Attendu : skeleton ou message « Hors ligne », pas de crash, retry auto
- 🔴 B

### T-7-10 | Bascule Wi-Fi ↔ 4G
- Objectif : continuité session
- Préconditions : Wi-Fi
- Étapes :
  1. Couper Wi-Fi pendant action
- Attendu : 4G prend le relais, action complétée
- 🟡 P

### T-7-11 | Appel entrant pendant réservation
- Objectif : état préservé
- Préconditions : en train de réserver
- Étapes :
  1. Recevoir appel téléphonique
  2. Décrocher / Rejeter
- Attendu : retour app, formulaire encore rempli, peut continuer
- 🟡 M

### T-7-12 | App en arrière-plan 10 min
- Objectif : session OK au retour
- Préconditions : connecté
- Étapes :
  1. Switch app, revenir 10 min après
- Attendu : pas de re-login, données refresh
- 🟠 M

### T-7-13 | App relancée après 24h
- Objectif : session refresh propre
- Préconditions : connecté hier
- Étapes : ouvrir app aujourd'hui
- Attendu : session refreshée auto via refresh token, accueil direct
- 🟠 F

### T-7-14 | Crash + relance
- Objectif : pas de corruption local
- Préconditions : forcer crash
- Étapes :
  1. Kill app brutalement
  2. Rouvrir
- Attendu : restoreSession() marche, pas de dégâts localStorage (gemmes, équipement)
- 🟠 B

### T-7-15 | Rotation portrait/paysage
- Objectif : layout responsive
- Préconditions : iPhone
- Étapes :
  1. Tourner tel en paysage sur écran planning
- Attendu : layout reste utilisable OU app forcée portrait (au choix mais cohérent)
- 🟡 U

---

## 8. UX

### T-8-01 | Réserver en <30s
- Objectif : flow rapide
- Préconditions : utilisateur connecté, créneaux dispo
- Étapes : chronomètre depuis accueil jusqu'à confirmation
- Attendu : ≤30s pour 1 réservation complète
- 🔴 U

### T-8-02 | Comprendre l'écran sans onboarding
- Objectif : self-explanatory
- Préconditions : nouvel utilisateur jamais connecté
- Étapes : montrer l'accueil à 5 testeurs, demander « où tu tapes pour réserver ? »
- Attendu : 5/5 trouvent le CTA principal en <5s
- 🟠 U

### T-8-03 | Trouver bouton principal
- Objectif : CTA visible
- Préconditions : utilisateur sur accueil
- Étapes : observer 1ère action
- Attendu : tap sur CTA « Réserver » sans hésitation
- 🟠 U

### T-8-04 | Éviter clics inutiles
- Objectif : pas de 5 écrans pour 1 action simple
- Préconditions : réservation
- Étapes : compter taps de l'accueil à la confirmation
- Attendu : ≤4 taps
- 🟠 U

### T-8-05 | Lisibilité textes
- Objectif : contraste + taille
- Préconditions : iPhone normal
- Étapes : audit visuel toutes pages
- Attendu : textes ≥14px, ratio contraste ≥4.5:1
- 🟠 U

### T-8-06 | Compréhension erreurs
- Objectif : message d'erreur clair
- Préconditions : provoquer erreur (mauvais pwd)
- Étapes : lire le message
- Attendu : action concrète proposée (« Réessaye » / « Mot de passe oublié ? »), pas de code technique
- 🟠 U

### T-8-07 | Sentiment de confiance
- Objectif : impression pro/sécure
- Préconditions : 1ère ouverture
- Étapes : observer impressions testeur
- Attendu : design premium, pas de typo cheap, mention « 🔒 Sécurisé »
- 🟡 U

### T-8-08 | Parcours débutant (élève 1er jour)
- Objectif : flow inscription → 1ère réservation
- Préconditions : nouveau compte
- Étapes : suivre flow complet
- Attendu : ≤5 min de l'inscription à la 1ère leçon réservée, tutoriel disponible
- 🟠 U

### T-8-09 | Parcours moniteur pressé
- Objectif : actions rapides
- Préconditions : moniteur entre 2 leçons (5 min libre)
- Étapes : accepter 3 demandes en attente
- Attendu : ≤30s pour 3 actions
- 🟠 U

### T-8-10 | Utilisateur non-tech (60+ ans)
- Objectif : accessibilité seniors
- Préconditions : élève 60+ ans
- Étapes : suivre flow réservation
- Attendu : pas de jargon, gros boutons, retours visuels clairs, possible sans aide
- 🟡 U

---

## 9. SÉCURITÉ

### T-9-01 | Accès sans connexion impossible
- Objectif : routes protégées
- Préconditions : non connecté
- Étapes :
  1. Tenter URL directe `/parcours`, `/planning`, `/admin`
- Attendu : redirection écran login systématique
- 🔴 S

### T-9-02 | Données élève cloisonnées (RLS)
- Objectif : élève A ne voit pas données élève B
- Préconditions : 2 comptes élèves
- Étapes :
  1. Connecté A, tenter `sb.from('events').select('*').eq('eleve_id', B_id)` dans console
- Attendu : retour vide grâce aux RLS, jamais les données de B
- 🔴 S

### T-9-03 | Notes privées moniteur isolées
- Objectif : moniteur X ne voit pas notes moniteur Y
- Préconditions : 2 moniteurs avec notes_priv
- Étapes : moniteur X tente de lire notes de Y
- Attendu : RLS `notes_priv` bloque, retour vide
- 🔴 S

### T-9-04 | Session expirée gérée
- Objectif : déconnexion propre si JWT invalid
- Préconditions : modifier JWT manuellement
- Étapes :
  1. Corrompre token dans localStorage
  2. Action API
- Attendu : 401, déconnexion auto, retour login
- 🟠 S

### T-9-05 | Changement mot de passe
- Objectif : flow change pwd
- Préconditions : connecté
- Étapes :
  1. Profil → Sécurité → Changer mdp
  2. Saisir ancien + nouveau
  3. Valider
- Attendu : mdp updaté côté Supabase, ancien invalide, notif email envoyée
- 🟠 S

### T-9-06 | Tentative accès via ancien magic link
- Objectif : lien à usage unique
- Préconditions : magic link reçu
- Étapes :
  1. Cliquer 1ère fois (login OK)
  2. Recliquer le même lien
- Attendu : 2e clic refusé « lien expiré »
- 🟠 S

### T-9-07 | Déconnexion tous appareils
- Objectif : invalider tous les tokens
- Préconditions : connecté sur 2 tels
- Étapes :
  1. Profil → « Déconnecter partout »
- Attendu : `signOut({ scope: 'global' })`, session tel B invalidée aussi
- 🟠 S

### T-9-08 | SQL injection dans recherche
- Objectif : protection contre injection
- Préconditions : barre de recherche
- Étapes :
  1. Saisir `'; DROP TABLE profiles; --`
- Attendu : traité comme string normale, pas d'erreur, pas d'effet
- 🔴 S

### T-9-09 | XSS dans nom élève
- Objectif : escape côté front
- Préconditions : admin crée élève
- Étapes :
  1. Nom = `<script>alert('xss')</script>`
  2. Voir fiche élève
- Attendu : script affiché en texte, jamais exécuté (esc() actif)
- 🔴 S

### T-9-10 | Honeypot capture bot
- Objectif : bots détectés et bloqués
- Préconditions : page signup
- Étapes :
  1. DevTools → remplir champ caché `website_url`
  2. Submit
- Attendu : soumission bloquée silencieusement
- 🟠 S

---

## 10. PERFORMANCE

### T-10-01 | Temps ouverture app
- Objectif : 1ère interaction <2s
- Préconditions : app fermée
- Étapes : tap icône, chrono jusqu'à accueil utilisable
- Attendu : ≤2s en 4G, ≤1s en Wi-Fi
- 🔴 P

### T-10-02 | Chargement planning (élève)
- Objectif : afficher 1 mois de leçons rapidement
- Préconditions : ~30 leçons
- Étapes : tap onglet Planning
- Attendu : skeleton <100ms, données ≤1s
- 🟠 P

### T-10-03 | Chargement créneaux (réservation)
- Objectif : afficher dispos moniteur
- Préconditions : moniteur avec 50 dispos
- Étapes : tap « Réserver » → choisir moniteur
- Attendu : dispos visibles ≤800ms
- 🟠 P

### T-10-04 | Réservation rapide
- Objectif : confirmation visible <2s après tap
- Préconditions : créneau choisi
- Étapes : tap Confirmer, chrono jusqu'à toast
- Attendu : ≤2s
- 🟠 P

### T-10-05 | Paiement rapide
- Objectif : retour de Stripe <5s
- Préconditions : CB enregistrée
- Étapes : payer
- Attendu : retour app ≤5s avec succès
- 🟠 P

### T-10-06 | Scroll fluide (60fps)
- Objectif : pas de jank
- Préconditions : liste 100 leçons
- Étapes : scroll rapide
- Attendu : 60fps constants, pas de freeze
- 🟠 P

### T-10-07 | App avec 200 cours historiques
- Objectif : ne pas charger tout en mémoire
- Préconditions : compte avec 200+ leçons archivées
- Étapes : ouvrir planning
- Attendu : pagination ou virtualisation, mémoire <150 Mo
- 🟡 P

### T-10-08 | App moniteur avec 50 élèves
- Objectif : liste élèves performante
- Préconditions : moniteur 50 élèves actifs
- Étapes : tab Mes Élèves
- Attendu : chargement ≤1.5s, recherche instant
- 🟡 P

### T-10-09 | Session longue (2h actif)
- Objectif : pas de fuite mémoire
- Préconditions : connecté 2h, naviguer beaucoup
- Étapes : monitorer mémoire
- Attendu : pas de croissance >50 Mo après 2h
- 🟡 P

### T-10-10 | Build size
- Objectif : bundle JS léger
- Préconditions : build prod
- Étapes : `npm run build`, vérifier dist/
- Attendu : JS total <500 Ko gzipped, splits async
- 🟡 P

---

## ANNEXE — Bugs connus à vérifier en priorité

| ID | Description | Source |
|---|---|---|
| B-01 | Reload casse la nav (pas de hash router) | CLAUDE.md |
| B-02 | Pas de dark mode encore | CLAUDE.md |
| B-03 | Backend Hono non utilisé (tout passe par Supabase direct) | CLAUDE.md |
| B-04 | Compteur "Nombre total d'URL" Supabase bug d'affichage | Supabase UI |
| B-05 | Vidéo hero key saccadée sur iOS avant fix scrub | hero-key-scrub.js |

---

**Total : 113 tests** • Tests critiques (🔴) : 27 • Hauts (🟠) : 52 • Moyens (🟡) : 31 • Bas (🟢) : 3

Bonne exécution 👨‍🔧
