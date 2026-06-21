# 🎯 next-up.md — File priorisée (le GOAL du prochain run)

> Le prochain run lit ce fichier pour choisir quoi faire. Garde-le court et ordonné : le haut = le plus prioritaire.

## P0 — décisions humaines en attente (Rayan tranche)
- [ ] **PR #215 (SEO statique)** : merge, refondre, ou fermer ? Dépend du verrou SSG (cf. `docs/SEO_STRATEGY.md`). Ne pas merger à l'aveugle.
- [ ] **Passage Stripe LIVE** : feu vert pour brancher clés + webhook prod ?
- [ ] **Connecter GitHub** (`/web-setup`) pour débloquer le heartbeat cloud — sinon la routine `trig_01NBuewjGcrtCq4hnKct4SfG` échoue.
- [x] ~~Heartbeat cron (pilier 1)~~ → ✅ activé (routine quotidienne 09h Paris, cf. `LOOP.md`).

## P1 — GTM premiers clients (le vrai sujet business)
- [ ] Landing à **refondre** (positionnement « l'outil DU moniteur, à SA marque ») — **confirmer le copy avant de coder**.
- [ ] Canal #1 : **DM + Loom** vers moniteurs indé (prix lead 9,99 €) — cf. `docs/GTM_PREMIERS_CLIENTS.md`.

## P2 — produit / rétention
- [ ] Test **WTP PermiGo+** (premium élève 4,99 €/mois) en no-code, fenêtre 30 j — valider l'appétence avant de coder.
- [ ] **Question du jour** (boucle solo 3 q/j, ligue vedette, push, install guidée) — métrique cible J+1 = 40 %.

## P3 — dette technique (quand fenêtre dispo)
- [ ] Nettoyer la suite e2e (retirer refs aux modules supprimés).
- [ ] Réconcilier le ledger migrations (`docs/SUPABASE_MIGRATION_RECONCILE.md`).
- [ ] Planifier le cron `trigger-consolidation`.
- [ ] Créditer les assets Twemoji (CC-BY).

---
*Quand tu prends une tâche : déplace-la dans `board.md` (En cours). Quand finie : `done-log.md` + retire-la d'ici.*
