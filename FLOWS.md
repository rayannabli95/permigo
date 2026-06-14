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
- `[2026-06-15 night-run]` **Conversion A2HS (install écran d'accueil)** : `pwa.js` (additif : `isInAppBrowser`/`isIosNonSafari`/`installBlockedReason`), `install-nudge.js` (variante « ouvre dans navigateur » pour webviews/iOS non-Safari + exports `openInstallSheet`, `promptInstallAtValueMoment`), `settings.js` (entrée « Ajouter à l'écran d'accueil »), `log-session.js` (prompt install au succès de validation). Tout additif, aucune écriture DB. | Impact : tous rôles (boot + réglages) + moniteur (moment de valeur) | done (PR à ouvrir).
- `[2026-06-14 bot-moniteur]` **Coordination overlays 1er lancement** : nouvel util partagé `permigo-game/src/utils/intro-overlays.js` + `main.js` (appel `armPopupPhase()` avant `route()`). Le tuto guidé (élève `accueil.js` + enseignant `aujourdhui.js`) attend désormais que le popup d'engagement soit fermé (`onPopupsSettled`). `install-nudge.js` / `push-prime.js` signalent `notifyPopupOpen/Settled` (l'ancien deferral popup→tuto, racy, est retiré). | Impact : élève + enseignant + boot partagé | done.

---

## Historique des breaking changes

> Format : `[YYYY-MM-DD] avant → après | raison`

(vide)

### Changements en cours — 2026-06-10 (bot élève)
- **Ajout additif** `permigo-game/src/services/daily-quiz.js` (sélection « question du jour ») + flag `daily` sur la route `#/quiz/{comp}/{type}/daily` + carte action du jour dans `accueil.js`. Lecture seule de `validations`/`quiz_attempts` (RLS own). Aucun impact moniteur/gérant.
