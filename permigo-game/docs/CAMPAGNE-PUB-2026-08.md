# Campagne publicitaire 200 € — ce qui reste à faire

> Note de suivi, 31/07/2026. Cible : élèves non-francophones en France (arabe + anglais).
> Budget 200 €, Facebook/Instagram uniquement. Lancement visé début août.

---

## 🔴 À FAIRE PAR RAYAN (bloquant pour la mesure)

### 1. Créer le pixel Facebook et me donner son numéro

Sans ce numéro, **le compteur est complètement éteint** : le code est en place mais il ne
charge rien, n'envoie rien et ne pose aucun cookie. Ce n'est pas grave pour cette
campagne-ci (200 € ne suffisent jamais à ce que l'algorithme apprenne), **mais c'est ce qui
rend la campagne SUIVANTE possible** : sans pixel, impossible de recontacter les
300 personnes qui auront cliqué, ni de demander à Facebook « trouve-moi des gens qui
ressemblent à ceux qui ont payé ».

**Les étapes, dans l'ordre :**

1. Aller sur `business.facebook.com` → Gestionnaire d'événements → « Connecter des données »
   → **Web** → nommer le pixel `PermiGo`.
2. Copier le **numéro du pixel** (une quinzaine de chiffres).
3. Dans Vercel → projet PermiGo → Settings → Environment Variables :
   ajouter `VITE_META_PIXEL_ID` = ce numéro, sur **Production** (et Preview si tu veux
   tester avant).
4. Redéployer (n'importe quel nouveau déploiement suffit — les variables sont lues au build).
5. Vérifier avec l'extension **Meta Pixel Helper** sur `www.permigo.fr` : accepter les
   cookies d'abord, sinon rien ne part (c'est voulu).

**Ce que le pixel remontera une fois branché :**

| Moment | Nom de l'événement |
|---|---|
| chaque page vue | `PageView` |
| compte créé | `CompleteRegistration` |
| clic sur un bouton d'achat | `InitiateCheckout` |
| retour de paiement réussi | `Purchase` (avec le montant) |

### 2. Mettre à jour la politique de confidentialité

Le bandeau cookies ne dit plus « sans tracker tiers » (c'était devenu faux), mais la page
`#/legal/privacy` n'a **pas** encore été mise à jour. Il faut y mentionner le pixel
Facebook : qui le pose, pourquoi, et comment le refuser (le bouton « Essentiels
uniquement » du bandeau suffit — c'est déjà le cas techniquement).

---

## ⚠️ Les pièges à ne pas se prendre en écrivant les pubs

- **Ne jamais dire à quelqu'un ce qu'il est.** « Tu ne comprends pas ton moniteur ? » sur
  une audience ciblée en arabe = refus quasi automatique par Facebook (règle sur les
  attributs personnels), et compte bloqué si ça se répète. **Toujours à la première
  personne** : « J'ai passé mon permis en France sans parler français. Voilà ce qui m'a
  sauvé. »
- **Ne jamais écrire « essai gratuit »** (ni trial, ni période, ni durée). Ça refroidit :
  les gens comprennent « après je devrai m'engager ». On dit **compte gratuit**, et il n'a
  effectivement aucune date de fin.
- **Pas de pub TikTok** avec ce budget : le minimum imposé est de 50 €/jour au niveau
  campagne, les 200 € tiendraient quatre jours sans que l'algorithme ait le temps
  d'apprendre. TikTok en organique, oui — les mises en situation se comprennent sans son
  et sans lire le français.
- **200 € = budget d'information, pas de vente.** Environ 250 à 350 clics. Ce qu'on mesure,
  c'est « est-ce qu'ils entrent et est-ce qu'ils jouent », pas le chiffre d'affaires.

---

## Le lien à mettre dans les pubs

- version arabe : `https://www.permigo.fr/#/pass?lang=ar`
- version anglaise : `https://www.permigo.fr/#/pass?lang=en`

Depuis le 31/07, ce `?lang=` **force** la langue à l'arrivée, même pour quelqu'un qui était
déjà venu en français. Ajouter aussi un `utm_source` par pub pour s'y retrouver, par
exemple `?utm_source=fb&utm_campaign=ar_moniteur&lang=ar`.

---

## Ce qui est déjà fait (31/07, branche `feat/compte-gratuit`)

- Compte gratuit : les 3 premières leçons (C1a, C1b, C1c) ouvertes en permanence,
  3 questions par jour, 1 mise en situation par jour, la langue comprise. Mur sur C1d.
  **Vérifié au navigateur avec un vrai compte solo non payé.**
- La page de vente ne prétend plus que « l'app est en français simple » (EN et AR).
- Le titre du mur de vente était sombre sur fond sombre — corrigé.

## Ce qui reste côté produit

- **Le mur de vente est en français uniquement** alors que c'est l'écran où l'arabophone
  décide de payer. À traduire en priorité.
- **Faire toucher le jeu AVANT de demander un compte** : aujourd'hui il faut s'inscrire
  (email, prénom, nom, date de naissance, mot de passe) avant de voir quoi que ce soit.
  C'est le plus gros levier de conversion restant.
- Trancher : la pub tombe-t-elle sur le jeu, ou sur la page de vente ?
- Le cas du code moniteur (aujourd'hui : 100 élèves ont tout, gratuit, à vie).
