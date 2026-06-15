# Stripe — mise en route (abonnement 9,99 €/mois, bêta moniteur indé)

Le code est livré. Il manque ce que SEUL toi peux faire : créer le compte Stripe,
le produit/prix, poser les secrets, déployer les functions, appliquer la migration.
Fais tout en **mode test** d'abord (cartes factices), puis bascule en live.

Architecture : Stripe **Checkout** (page hébergée) + **webhook**. Pas de Stripe.js
ni de clé publishable côté client (on redirige vers `session.url`). La clé secrète
ne vit QUE dans les edge functions.

---

## 1. Compte + produit + prix
1. Crée un compte sur https://dashboard.stripe.com (reste en **Test mode**, switch en haut à droite).
2. **Produits → + Ajouter un produit** : nom « PermiGo Pro », prix **récurrent 9,99 € / mois**.
3. Copie l'**ID du prix** → `price_…` (Produit → section Tarifs).
4. **Développeurs → Clés API** : copie la **clé secrète** `sk_test_…`.

## 2. Secrets Supabase (jamais dans le front)
```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_PRICE_ID=price_xxx
# (STRIPE_WEBHOOK_SECRET ajouté à l'étape 4)
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY sont auto-injectés.
```

## 3. Déploiement des edge functions
```bash
supabase functions deploy stripe-checkout            # JWT vérifié (user connecté)
supabase functions deploy stripe-webhook --no-verify-jwt   # Stripe n'a pas de JWT Supabase
```

## 4. Webhook Stripe
1. **Développeurs → Webhooks → + Ajouter un endpoint**.
2. URL : `https://arrfmdagdqtrtfbhxlty.supabase.co/functions/v1/stripe-webhook`
3. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie le **Signing secret** `whsec_…` puis :
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase functions deploy stripe-webhook --no-verify-jwt   # re-deploy pour charger le secret
```

## 5. Migration (table subscriptions)
La migration `supabase/migrations/20260615120000_subscriptions.sql` n'est **pas
encore appliquée**. Applique-la :
- via le dashboard SQL editor (copier le fichier), **ou**
- `supabase db push`, **ou**
- demande-moi de l'appliquer via le MCP Supabase (`apply_migration`).

## 6. Test (mode test)
1. Connecte-toi en moniteur → **Réglages → Abonnement → S'abonner**.
2. Carte test : `4242 4242 4242 4242`, date future, CVC quelconque.
3. Retour sur Réglages → toast « activation en cours » ; quelques secondes après
   (le temps du webhook) le statut passe à **Abonnement actif**.
4. Vérifie la ligne dans `public.subscriptions` (status = `active`).

## 7. Passage en live
- Refais produit/prix en **live**, récupère `sk_live_…` + nouveau `price_…`.
- Recrée le webhook en live → nouveau `whsec_…`.
- `supabase secrets set STRIPE_SECRET_KEY=sk_live_… STRIPE_PRICE_ID=price_live_… STRIPE_WEBHOOK_SECRET=whsec_live_…`
- Re-deploy les deux functions.

---

## Ce qui reste optionnel (pas bloquant pour encaisser)
- **Paywall** : aujourd'hui l'abonnement est lisible (`isActive` dans `src/services/billing.js`)
  mais rien n'est encore bloqué. Quand tu veux gater une fonctionnalité : `isActive(await getSubscription())`.
- **Portail client Stripe** (gérer/annuler son abo) : ajouter une edge function
  `stripe-portal` (billingPortal.sessions.create) + un bouton « Gérer mon abonnement ».
- **Pricing Table / promo 3 mois** : `allow_promotion_codes` est déjà activé sur le Checkout.
