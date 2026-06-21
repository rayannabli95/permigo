# 📊 status.md — Photo de l'état système

> Mis à jour : **2026-06-21** · HEAD : `main` @ `6a8a7f0` (PR #243 mergée)
> Lis ce fichier EN PREMIER à chaque run. Mets-le à jour AVANT de dire « c'est fini ».

## Cap produit (verrouillé 2026-06-17)
Deux rôles cibles : **élève** (engagement / carburant viral) + **moniteur indépendant** (autorité / preuve, c'est le payeur). Modèle = abonnement self-serve **9,99 €/mois** (Stripe). Espace **gérant = dormant**, ne pas router en avant, ne pas supprimer (couplé RLS `leads_select`).

## ✅ Live / shippé
- **Onboarding self-serve** (PR #223) — moniteur indé crée son compte seul.
- **Stripe abonnement 9,99 €/mois** — fonctionnel **en mode test** (PR #192/#193).
- **Examen blanc** — 165 Q (11 parcours) + mode Examen officiel 40 Q chrono, déblocage via coffre compétence 1.
- **Centres d'examen** — fiches Cergy, Massy, Évry, Melun (PR #242) — futur module premium.
- **Hall of Fame élève** + refonte intuition élève & enseignant (PR #217/#218).
- **Quiz vocal** — lecture FR de la question + bouton muet persistant (PR #243).
- Sécurité prélancement : IDOR + streak + policies + RPC onboarding **appliqués en prod**.

## 🟡 En cours / ouvert
- **PR #215** `feat/seo-static-content` — couche statique indexable (centres, guides, pilier moniteur). **Ouverte depuis le 17/06, à trancher** (merge / refonte / fermer). Liée au verrou SEO ci-dessous.

## 🔴 Dette / à décider (non bloquant lancement, mais à ne pas perdre)
- **Stripe → mode LIVE** : encore en test, passage live à faire (clés + webhook prod).
- **Ledger migrations à réconcilier** : `docs/SUPABASE_MIGRATION_RECONCILE.md` (20/06) — écart historique migrations locales vs prod.
- **Suite e2e bit-rotted** : tests référencent des modules supprimés (`onboarding-modal.js`, `empty-state.js`, `acc2-xp-bar`). Échecs préexistants, pas de régression — mais à nettoyer.
- **SEO** : verrou SPA hash-router à lever (SSG découplé) avant d'investir le contenu — cf. `docs/SEO_STRATEGY.md`.
- **leaked-password protection** : OFF (feature Supabase Pro) — à activer au passage Pro.
- **trigger-consolidation** : edge function présente, cron non planifié.
- **Attribution Twemoji CC-BY** : illustrations UI à créditer (dette légale légère).

## 🩺 Santé build/test
- `npm run lint && npm run build` = référence avant tout commit (cf. CLAUDE.md).
- e2e Playwright : rouge partiel **préexistant** (cf. dette ci-dessus) — ne pas confondre avec une régression.
