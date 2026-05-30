# OPÉRATION COMMANDO — bible d'exécution

> Doc de pilotage rédigé le 30 mai 2026 (~02h). À tenir à la lettre pendant l'exécution
> nocturne autonome (PC de Rayan allumé, Rayan dort). Objectif : intégrer proprement
> les 9 changements préparés, sans casser la prod.

## Mission
Committer, pousser et intégrer les 9 changements validés, en respectant les règles git
non-négociables du projet, puis vérifier que la prod tourne.

## Les 9 changements
**Déjà commités + poussés sur PR #32 (3) :**
1. `aujourdhui.js` — hero reformulé « Côté élève / X quiz pas encore refaits par tes élèves ».
2. `notif-bell.js` — fix overflow du panneau notif sur mobile.
3. `0014_fix_achievement_unlock_moniteur.sql` — fix `forbidden_target_user` (séance bloquée au palier). **Déjà appliqué en prod + vérifié.**

**Préparés cette nuit, NON commités (6 logiques / 8 fichiers) :**
4. `router.js` — `document.title` par page (a11y / onglets / historique / SEO).
5. `log-session.js` — retour haptique + son sur le cycle des chips de compétence.
6. `nav-bottom.js` — retour haptique sur les onglets + le FAB Séance.
7. `cosmos-bg.js` — respect `prefers-reduced-motion` (ciel étoilé statique).
8. `session-confirmation.js`, `legal.js`, `messages.js` — `aria-label="Retour"` sur boutons flèche.
9. `.gitignore` — exclusion des dossiers de build de test + fichiers vite parasites.

## Règles NON-NÉGOCIABLES (rappel)
- **ZÉRO git en sandbox bash.** Tout git passe par GitHub Desktop (computer-use).
- **TOUJOURS pull `main` AVANT de créer une branche** (sinon on réintroduit des commits revertés).
- **Build doit passer avant tout commit** (`npx vite build`, déjà vérifié vert).
- **Échappement XSS** : toute donnée en `innerHTML` via `esc()`.
- **DDL Supabase via MCP `apply_migration`** (projet `arrfmdagdqtrtfbhxlty`) — déjà fait pour le 0014.
- macOS : si le Centre de notifications bloque les clics sur GHD → `killall NotificationCenter`
  ou balayer la notif (déjà rencontré cette nuit).
- VS Code = lecture seule en computer-use (pas de frappe possible) → édition via les outils fichiers, pas VS Code.

## Séquence d'exécution
1. **GHD** : commit des changements nocturnes (8 fichiers : items 4–9) sur la branche
   `feat/seance-fusion-3-statuts` (PR #32). Raison : l'item 5 dépend du code de PR #32
   (`_wireComps`), donc on ne peut pas l'isoler proprement sur une branche pré-merge.
   Message : `feat(ux): passage nocturne — titres de page, haptique nav+chips, reduced-motion, aria`.
2. **GHD** : commit séparé de cette bible (`OPERATION_COMMANDO.md`).
3. **GHD** : push de la branche.
4. **GitHub web (Chrome)** : merger PR #32 dans `main`.
5. **Vercel** : vérifier que le déploiement prod (`permigo.vercel.app`) build et passe en READY.
6. **Chrome** : smoke-test prod — login démo Enseignant, ouvrir Séance, cycler une chip,
   enregistrer une séance qui atteint un palier (doit s'enregistrer, plus de `forbidden_target_user`).
7. **Mémoire** : mettre à jour l'état des chantiers (PR #32 mergée, fix 0014 en prod).

## Filet de sécurité / rollback
- Si le build Vercel ÉCHOUE : la prod précédente reste en ligne (Vercel ne remplace pas sur build KO). Reporter, ne pas paniquer.
- Si régression runtime en prod après merge : revert du merge via GitHub, ou rollback du déploiement via Vercel. Reporter en clair à Rayan.
- Ne PAS lancer le chantier 2 (nav 3 onglets) cette nuit : il se fait sur une branche fraîche
  APRÈS le merge de PR #32, et mérite la validation visuelle de Rayan.

## Définition de « terminé »
- 8 fichiers nocturnes + bible commités et poussés.
- PR #32 mergée dans `main`.
- Déploiement prod READY + smoke-test OK.
- Mémoire à jour + récap clair laissé à Rayan.
