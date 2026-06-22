# FLOWS.md — Parcours cross-rôles PermiGo

> **Source de vérité des scénarios end-to-end** qui impliquent plusieurs rôles. Si tu codes côté élève, tu lis ici ce que le moniteur t'envoie et inversement.
> Schéma DB technique = `src/db/schema.js` (ne dupliquer ici aucun champ).

## Vocabulaire

- **REMC** : Référentiel d'Éducation à la Mobilité Citoyenne — 31 sous-compétences × 4 catégories
- **Leçon** : `events.t ∈ {conf, lecon, pend}` (conf=confirmée, pend=en attente, lecon=passée)
- **Dispo** : `events.t = 'dispo'` (créneau libre proposé par moniteur)
- **Forfait** : `profiles.forfait_h` heures payées par l'élève

---

## Flux 1 — Cycle d'une leçon

```
[ÉLÈVE]                    [MONITEUR]                  [DB]
   │                            │                       │
   │ ouvre /reservation         │                       │
   │ ──► lit events t='dispo'   │                       │
   │                            │                       │
   │ click créneau              │                       │
   │ ──► insert events t='pend' │                       │
   │     eleve_id=me            │ ──► notif "Demande   │
   │                            │       de leçon"       │
   │                            │ confirme              │
   │                            │ ──► update t='conf'   │
   │ ──► notif "Confirmée"      │                       │
   │                            │                       │
   │     ⏰ jour J               │     ⏰ jour J          │
   │                            │                       │
   │                            │ post-leçon :          │
   │                            │ ──► update t='lecon'  │
   │                            │     remc_entries (lv) │
   │                            │     lesson_reviews    │
   │ ──► notif "Leçon notée"    │                       │
   │ ouvre /accueil             │                       │
   │ ──► voit dernière review   │                       │
   │     prompt rating moniteur │                       │
   │ ──► insert notations       │                       │
   │                            │ voit étoiles ⭐        │
```

**Contrat technique :**
- Élève → écrit `events` (`t='pend'`), `notations`, `lesson_self_evals`
- Moniteur → écrit `events` (`t='conf'|'lecon'`), `remc_entries`, `lesson_reviews`, `notes_priv`
- Notifications déclenchées : voir Flux 4

## Flux 2 — Progression REMC

```
[MONITEUR]                                [ÉLÈVE]
   │                                          │
   │ /livret-remc?id=<eleve>                  │
   │ click case "C1a" → niveau 'v'            │
   │ ──► upsert remc_entries                  │
   │     {eleve_id, comp_id:'C1a', lv:'v'}    │
   │                                          │
   │                                          │ /parcours
   │                                          │ select remc_entries where eleve_id=me
   │                                          │ ──► node "C1a" se déverrouille
   │                                          │     XP +100, confetti, world-unlock
```

**Contrat :**
- `remc_entries.lv` valeurs autorisées : `'v'` (acquis) | `'p'` (en cours) | `'r'` (à retravailler) | `null` (pas évalué)
- `comp_id` doit exister dans `src/data/remc.js` (REMC officiel)
- Total = 31 compétences (constante `REMC_TOTAL`)

## Flux 3 — Forfait / heures consommées

```
[ADMIN]                       [MONITEUR]                  [ÉLÈVE]
   │                              │                          │
   │ /eleves                      │                          │
   │ update profiles.forfait_h    │                          │
   │                              │ /mes-eleves              │
   │                              │ voit heures restantes    │
   │                              │                          │ /accueil
   │                              │                          │ KPI "restantes"
   │                              │                          │ = forfait_h
   │                              │                          │   - SUM(events.dur)
   │                              │                          │     WHERE t IN ('conf','lecon')
```

**Contrat :** la formule "heures restantes" doit rester IDENTIQUE dans les 3 vues. Si elle change, mettre à jour `src/services/planning.js` (helper partagé à créer si manquant).

## Flux 4 — Notifications cross-rôles

Toute écriture qui doit notifier quelqu'un d'un autre rôle passe par `notifications`.

| Trigger (écrivain) | Destinataire | type | title |
|---|---|---|---|
| Élève réserve (`events.t='pend'`) | moniteur de l'event | `lecon_demande` | "Nouvelle demande de leçon" |
| Moniteur confirme (`events.t='conf'`) | élève | `lecon_confirmee` | "Leçon confirmée" |
| Moniteur passe à `t='lecon'` + crée review | élève | `lecon_terminee` | "Ta leçon est notée" |
| Moniteur valide compétence (`remc_entries.lv='v'`) | élève | `comp_acquise` | "Compétence validée 🎉" |
| Admin modifie `profiles.forfait_h` | élève + moniteur attitré | `forfait_maj` | "Ton forfait a été mis à jour" |
| Élève note moniteur (`notations`) | moniteur | `nouvelle_note` | "Tu as une nouvelle note ⭐" |

**Règle d'or :** chaque bot écrit la `notification` au moment de l'action métier. Pas de cron, pas de trigger DB pour l'instant (KISS).

## Flux 5 — Privé vs partagé

- `notes_priv.contenu` : **JAMAIS** affiché côté élève. Si un bot élève fait un `SELECT` sur cette table, c'est un bug — l'élève ne doit même pas savoir qu'elle existe.
- `audit_log` : visible admin uniquement.
- `absences` : invisible élève.

---

## Changements en cours (bots actifs annoncent ici)

> Format : `[YYYY-MM-DD bot-X] changement | impact | status`

- `[2026-06-14 bot-moniteur]` **Ajout additif** `permigo-game/src/utils/fmt-name.js` (`fmtName` — Title Case d'affichage, ne touche pas la DB) | importé seulement par des pages `src/pages/enseignant/**` (log-session, aujourdhui, mes-eleves, classement-eleves, bilan) | done. Réutilisable par les bots élève/admin pour normaliser l'affichage des noms.
- `[2026-06-14 bot-moniteur]` **Lecture seule** `quiz_attempts` (user_id, score, completed_at) ajoutée dans `classement-eleves.js` pour la nouvelle « Ligue théorie » (mode `#/classement-eleves/theorie`) — même requête RLS que la KPI « Taux quiz » d'Analyses | aucun écrit | done.
- `[2026-06-16 auth]` **Récupération d'accès élève déclenchée par le moniteur** : edge function `eleve-recovery` (verify_jwt, **DÉPLOYÉE**) — authz enseignant/gérant + élève de la même `auto_ecole` → envoie un email de connexion (OTP/lien) à l'élève (le moniteur ne voit jamais le lien). Bouton « Réinitialiser l'accès » dans le quick-menu de `mes-eleves.js` + `src/services/eleve-recovery.js`. ⚠️ Envoi fiable nécessite SMTP custom (gratuit, Resend) — sinon limites email par défaut. **Pas de Pro requis.** | Impact : moniteur déclenche, élève reçoit.
- `[2026-06-16 bot-eleve]` **Hall of Fame élève** (PR ouverte, NON appliquée/mergée) : modifie le RPC partagé `get_eleve_leaderboard` (exclut les lauréats `examens.statut='recu'` du classement) + nouveau RPC `get_hall_of_fame(p_scope)` (renvoie le **prénom réel** des lauréats, école-scoped). Décision produit validée Rayan : prénom des reçus exposé aux camarades d'école. À appliquer + merger ensemble (matin). Impact : classement élève (et indirectement la lecture moniteur via examens — lecture seule, pas de changement moniteur).
- `[2026-06-15 billing]` **Stripe Checkout (abonnement 9,99 €/mois moniteur indé)** : nouvelle table `subscriptions` + RLS (miroir Stripe, écrit par webhook en service role, lecture user only) ; edge functions `stripe-checkout` + `stripe-webhook` ; `src/services/billing.js` ; section Abonnement dans `settings.js` (rôle enseignant). **NON déployé / migration NON appliquée** (besoin compte Stripe + secrets — voir `permigo-game/docs/STRIPE-SETUP.md`). | Impact : moniteur (self-serve) + DB | scaffold done, PR ouverte.
- `[2026-06-15 night-run]` **Conversion A2HS (install écran d'accueil)** : `pwa.js` (additif : `isInAppBrowser`/`isIosNonSafari`/`installBlockedReason`), `install-nudge.js` (variante « ouvre dans navigateur » pour webviews/iOS non-Safari + exports `openInstallSheet`, `promptInstallAtValueMoment`), `settings.js` (entrée « Ajouter à l'écran d'accueil »), `log-session.js` (prompt install au succès de validation). Tout additif, aucune écriture DB. | Impact : tous rôles (boot + réglages) + moniteur (moment de valeur) | done (PR à ouvrir).
- `[2026-06-18 bot-eleve]` **Récap fin de session Révision (Clash Royale)** : composant **additif** `src/components/eleve/revision-recap.js` (`showRevisionRecap`, z-index 10050, visuel de dépassement d'un autre élève) + service `src/services/revision-session.js` (session sessionStorage `permigo:revision_session_v1`, TTL 3h, capture rang Révision au 1er quiz, compteurs). Déclenché dans `quiz.js` quand l'élève quitte l'enchaînement révision (`#btn-parcours` en mode `isRevision`) → `#/parcours` (ou `#/classement/revision` via lien secondaire). **Lecture seule** : appelle le RPC partagé `get_theory_leaderboard(p_scope='ecole')` (déjà utilisé par classement.js), aucune écriture DB. Impact : élève (quiz révision) uniquement.
- `[2026-06-18 bot-eleve+moniteur]` **Écran plein écran de célébration (Nike/COD/Strava)** : moteur générique **additif** `src/components/common/unlock-screen.js` (`showUnlockScreen`, z-index 10050). Wrappers de rôle : `src/components/eleve/competence-unlock.js` (`showCompetenceUnlock` — refactoré pour déléguer au moteur, **API/comportement inchangés**) ; `src/components/enseignant/tier-unlock.js` (`showTierUnlock` — palier moniteur). Déclencheurs : élève = quiz `validated` (quiz.js) + parcours-driven (`src/services/competence-celebration.js`) ; moniteur = franchissement seuil `MONITEUR_TIERS` au succès de `validate_session` (`log-session.js` → `src/services/moniteur-tier-celebration.js`, ledger localStorage, seed silencieux). Lecture seule (count `validations`), aucune écriture DB. ⚠️ **Décision produit Rayan (2026-06-18)** : l'écran moniteur réutilise le style premium élève — dérogation **assumée** à l'antipattern moniteur « pas de confetti/Duolingo ». NE PAS « corriger » en sobre sans redemander. | Impact : élève (parcours/quiz) + moniteur (log-session) | done (non commité).
- `[2026-06-14 bot-moniteur]` **Coordination overlays 1er lancement** : nouvel util partagé `permigo-game/src/utils/intro-overlays.js` + `main.js` (appel `armPopupPhase()` avant `route()`). Le tuto guidé (élève `accueil.js` + enseignant `aujourdhui.js`) attend désormais que le popup d'engagement soit fermé (`onPopupsSettled`). `install-nudge.js` / `push-prime.js` signalent `notifyPopupOpen/Settled` (l'ancien deferral popup→tuto, racy, est retiré). | Impact : élève + enseignant + boot partagé | done.

- `[2026-06-22 permigo-eleve-dev]` **Variete mascotte quiz** : modif **additive** `src/components/eleve/quiz-ui.js` (fonction `setMascot` enrichie d'un micro-pop CSS — ajout classe `.qz-mascot--pop`, aucun changement de signature, rétrocompat) + `src/pages/eleve/exam-blanc.js` (mascotte reactive dans `renderQuestionBody` / `reveal()` : switch pose think/celebrate/coach selon état réponse, playWhoosh sur nextQ). Aucune écriture DB, aucun nouveau son. | status: in-progress

---

## Historique des breaking changes

> Format : `[YYYY-MM-DD] avant → après | raison`

(vide)

### Changements en cours — 2026-06-10 (bot élève)
- **Ajout additif** `permigo-game/src/services/daily-quiz.js` (sélection « question du jour ») + flag `daily` sur la route `#/quiz/{comp}/{type}/daily` + carte action du jour dans `accueil.js`. Lecture seule de `validations`/`quiz_attempts` (RLS own). Aucun impact moniteur/gérant.
