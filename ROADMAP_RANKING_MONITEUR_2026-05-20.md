# Roadmap Ranking Moniteur — Permigo
Date : 2026-05-20 · Auteur : Claude Code · Pages moniteur auditées : 9 (+1 orpheline)

## 1. TL;DR

- État actuel : le ranking existe (matview `moniteur_ranking_mv` + RPC `get_moniteur_ranking` + composant `moniteur-ranking.js`), mais il est **enterré dans la page profil** (`common/profil.js`, ligne 582) — invisible sur le dashboard `aujourdhui.js` et **totalement absent côté gérant** (`gerant/equipe.js` affiche une liste plate sans rang ni tri). La value-prop n°1 du produit est cachée.
- Gap critique : **aucun ranking régional ni national** — la matview partitionne `PARTITION BY auto_ecole_id` uniquement. La promesse marketing "ranking national" n'est pas tenue par le code.
- Recommandation : exécuter **Sprint 1 + 80 % Sprint 2** pour le MVP démo client (ranking local visible partout + paliers branchés sur la vraie table). National = Sprint 3.
- Effort estimé total : **4 semaines de dev solo** (dev front Vanilla JS + 4 migrations SQL).
- Risque produit n°1 : le piège "leaderboard global qui écrase 90 %" (Computers in Education 2022 : 31,3 % se découragent en leaderboard-only). On le neutralise en n'affichant jamais le rang absolu national, seulement le percentile + top 100.

## 2. Audit de l'existant

Routing vérifié (`src/router.js`) : `default`/`aujourdhui` → `aujourdhui.js` ; `parcours` → `parcours-pro.js` ; `parcours-complet` → `parcours-pro-complet.js` ; `validation`, `eleves`, `livret`, `insights`, `bilan`, `log-session`. Le fichier `parcours.js` n'a **aucune route**.

| Page | Rôle | Ranking affiché ? | Score live/stale | Indicateurs gamif | Comparaison pairs | Partage social |
|---|---|---|---|---|---|---|
| `aujourdhui.js` (751 l.) | Dashboard : 4 KPI (validées, élèves, consolidation, inactifs) + récap soir + activité + mes élèves | **NON** | — | aucun | aucune | non |
| `validation.js` (518 l.) | Valider une compétence REMC (flow élève→compétence→confirm) | NON | — | aucun | aucune | non |
| `mes-eleves.js` (838 l.) | Liste élèves + progression REMC par élève | NON | — | aucun | aucune | non |
| `livret-remc.js` (830 l.) | Livret REMC d'un élève (31 sous-comp.) + feedback feed | NON | — | aucun | aucune | non |
| `insights.js` (930 l.) | KPI perso + heatmap + top élèves + difficulté comps | NON (KPI perso non rangés) | live (requêtes directes) | aucun palier | aucune | non |
| `bilan.js` (452 l.) | Bilan trimestriel élève, print-friendly | NON | — | aucun | aucune | print PDF (élève, pas moniteur) |
| `log-session.js` (1167 l.) | Logger une séance (30 s) + templates messages débloqués (`get_my_message_templates`) | NON | — | templates débloqués selon nb validations | aucune | non |
| `parcours-pro.js` (632 l.) | Hero niveau/XP/streak + **next unlock** (`get_my_next_unlock_moniteur`) + roadmap 3 stops | NON (paliers oui, classement non) | live RPC | palier actuel + barre progression | aucune | non |
| `parcours-pro-complet.js` (388 l.) | Timeline complète des paliers (depuis parcours-pro) | NON | live (tiers locaux) | tous les paliers | aucune | non |

**Où vit réellement le ranking** : `moniteur-ranking.js` (composant complet : ma position + top 3 + métriques + "tu es à X pts derrière Y") est monté **uniquement** dans `common/profil.js` pour `me.role === 'enseignant'`. Score lu depuis la matview (donc **stale** : rafraîchi par `refresh_moniteur_ranking_mv()`, pas en temps réel). Pas de tendance vs mois dernier. Pas de partage. Critères de score non explicités à l'écran.

**Côté gérant** : `gerant/equipe.js` (474 l.) liste les enseignants avec `valCount` du mois + nb élèves + badge actif/inactif. **Aucun rang, aucun score, aucun tri par performance.** Le patron ne voit pas le classement qui est censé être l'argument de vente.

**Verdict fichier orphelin `parcours.js` (859 l.)** : c'est l'ancêtre riche de `parcours-pro.js` — "Parcours pro / carrière moniteur, ADN Linear", avec une **timeline "La Route" 50 niveaux** (volant = position actuelle), card profil+XP, cohorte 5 élèves swipeables, mini-stats semaine. Il importe `getMoniteurState, buildTimelineStops, MONITEUR_TIERS` depuis `data/moniteur-levels.js` (toujours utilisé). Décision : **RÉCUPÉRER la timeline "La Route"** pour la nouvelle page `ranking.js` (l'effet visuel route sinueuse est exactement le bon support pour la progression paliers), puis **SUPPRIMER le fichier** une fois la timeline extraite. Ne pas le router en l'état (doublon de parcours-pro).

## 3. Analyse psychologique cible

**Profil** : moniteur auto 30-50 ans, métier socialement dévalorisé, ~26-37 €/h (grille EVS), identité pro forte ("je suis un BON moniteur"), chacun se croit meilleur que ses collègues. Insécurités : zéro reconnaissance externe, taux de réussite individuel souvent inconnu de lui-même, comparaison frustrée avec collègues. Aspirations : reconnaissance par les pairs, par le patron (levier de négociation heures/élèves/salaire), régionale puis nationale.

**5 leviers d'engagement (Octalysis, Yu-kai Chou)** :
1. **CD2 — Development & Accomplishment** : progression visible par paliers nommés + barre vers le prochain unlock. C'est le moteur de rétention quotidienne (déjà branché via `get_my_next_unlock_moniteur`).
2. **CD5 — Social Influence & Relatedness** : podium intra-école public, "tu es à X pts derrière Y" (déjà codé dans `moniteur-ranking.js`) — c'est le miroir objectif que le moniteur n'a jamais eu.
3. **CD6 — Scarcity & Impatience** : badge "Top 100 France 2026" non rachetable, paliers rares avec compteur "plus que 50 moniteurs peuvent débloquer ce palier ce mois".
4. **CD7 — Unpredictability & Curiosity** : reset mensuel du classement (saison) = nouvelle chance, suspense du "wrapped" mensuel.
5. **CD8 — Loss & Avoidance** : afficher la tendance ↓ "tu as reculé de 2 places" déclenche l'aversion à la perte — mais à doser (cf. piège 1).

**3 pièges à éviter (recherche académique)** :
1. **Leaderboard global qui écrase 90 %** (Computers in Education 2022, 31,3 % de décrochage en leaderboard-only). Mitigation : jamais de rang absolu national affiché ; seulement percentile + top 100 + segment local où chacun peut être dans le haut.
2. **Métriques perçues comme injustes** : un moniteur avec peu d'élèves fait peu d'heures → il est puni sur un critère de volume qu'il ne contrôle pas. Mitigation : score v2 pondéré vers la **qualité** (taux de réussite, satisfaction) et la **régularité**, pas seulement le volume.
3. **Compétition qui tue la collaboration intra-école** (les moniteurs ne se filent plus de tuyaux). Mitigation : garder l'intra-école en "podium top 3 + ma position" sans humilier les derniers (pas de "dernier de l'école" affiché), et mettre l'enjeu compétitif fort au niveau régional/national (entre écoles, pas entre collègues).

## 4. Système de ranking proposé (3 niveaux)

### 4.1 Intra-école (déjà en place via `moniteur_ranking_mv`)
- Affichage : podium top 3 + position personnelle + **tendance vs mois dernier** (à ajouter : la MV ne stocke pas l'historique).
- Visibilité : public dans l'auto-école — les autres moniteurs voient le top 3 + leur propre rang, **jamais** "qui est dernier".
- Fréquence : **mise à jour quotidienne** (cron `refresh_moniteur_ranking_mv()` à 4h). Tranche : pas de temps réel intra-école — le coût matview concurrent + le bruit psychologique (rang qui bouge toutes les 5 min) ne valent pas le gain. Le moniteur voit "classement arrêté ce matin".

### 4.2 Régional (à créer — n'existe pas)
- Critère de zone : **département** (code INSEE 2 chiffres du `code_postal` de l'auto-école). Tranche : le département est la maille mentale du moniteur ("le meilleur du 93"), assez large pour avoir du monde, assez serré pour rester crédible. Région = trop dilué ; rayon km = complexité géo non justifiée au MVP.
- Anti-injustice : afficher **uniquement le top 10 % du département + la position personnelle** (modèle Strava local segments). Le n°340/400 voit "top 18 % du 75", pas "340e".
- Anonymisation : format **"M. K. — Auto-école Paris 11"** (initiale prénom + initiale nom + nom commercial école). Pas de nom complet → limite le doxxing tout en gardant la fierté locale.

### 4.3 National (à créer — promesse marketing critique)
- **Top 100 affiché publiquement** (nom format anonymisé "M. K. — 75").
- Tous les autres voient leur **percentile** : "Tu es dans le top 32 % des moniteurs France".
- Critères de qualification : **minimum 20 validations sur les 90 derniers jours** pour entrer au classement national. Tranche : sinon le n°1 est un nouveau avec 1 validation parfaite. Le seuil 20/90j filtre les comptes fantômes sans exclure les moniteurs réellement actifs.
- Récompenses : badge **"Top 100 France 2026"** non rachetable + déblocage de la page profil public partageable LinkedIn (cf. §4.5 et page `profil-public.js`).

### 4.4 Formule de score v2

Score actuel (matview, vérifié ligne 167 de `0008`) : `0.40·heures + 0.25·validations + 0.20·(élèves_diff·1.5) + 0.15·(jours_actifs·0.5)`. Faiblesse : 40 % sur les heures = avantage mécanique aux moniteurs à gros volume d'élèves ; aucun signal de **qualité pédagogique**.

| Pondération | Critère | Justification (1 phrase) | Champ DB |
|---|---|---|---|
| **30 %** | Taux de réussite des élèves au permis | C'est le seul indicateur de qualité réelle, et l'argument que le moniteur veut brandir devant son patron. | **À CRÉER** : aucun champ "permis obtenu" par élève ni attribution moniteur. Le `taux_reussite_90j` du cockpit gérant est calculé sur `exam_blanc_sessions` (examen blanc), au niveau école, non rattaché au moniteur. |
| **25 %** | Compétences validées dans le mois | Cœur d'activité mesurable et déjà tracké, corrélé à l'avancement réel des élèves. | EXISTE : `validations` (`statut='acquis'`, `validated_by`, `validated_at`). |
| **20 %** | Élèves distincts en suivi actif | Récompense la capacité à faire progresser un portefeuille, pas juste 1 élève chouchou. | EXISTE : `COUNT(DISTINCT eleve_id)` sur `sessions_moniteur`. |
| **15 %** | Régularité (jours actifs / 30) | La régularité prédit la rétention élève mieux que les pics, et lisse l'avantage volume. | EXISTE : `COUNT(DISTINCT session_date)`. |
| **10 %** | Satisfaction élève (feedback ≥ 4/5) | Petit poids mais signal anti-"moniteur qui valide vite et mal" ; volontairement minoritaire car déclaratif/biaisable. | **À CRÉER/VÉRIFIER** : `get_eleve_feedback_feed` existe mais le champ note 1-5 explicite n'est pas confirmé ; prévoir colonne `rating` sur la table feedback. |

Décision de bascule : on **garde le score v1 (volume) en production pour le MVP démo** (il tourne), et on **ship le score v2 derrière un flag** une fois les 2 champs manquants créés (Sprint 3). Sortir v2 sans le taux de réussite réel = mentir sur le label "qualité".

### 4.5 Paliers

État : la table `moniteur_paliers` existe en prod (non versionnée, cf. `AUDIT_OBJETS_MANQUANTS`) et alimente `get_my_next_unlock_moniteur`. Le front a déjà `MONITEUR_TIERS` (10 paliers, seuils 10→380 validations cumulées) dans `data/moniteur-levels.js`, + 9 skins + 12 saisons. **Décision : aligner la table SQL sur ces 10 tiers front et en ajouter 2 (Élite France) → 12 paliers.** Seuils basés sur **validations cumulées (lifetime)**, cohérent avec la RPC existante.

| # | Nom | Seuil (validations) | Récompense |
|---|---|---|---|
| 1 | Moniteur en route | 10 | Export PDF du livret élève |
| 2 | Moniteur confirmé | 40 | Stats avancées par élève |
| 3 | Pilote pédagogue | 70 | Templates de bilan mensuel |
| 4 | Enseignant chevronné | 100 | Mode prépa examen enrichi |
| 5 | Stratège du volant | 130 | Analytics comparatives anonymes cohorte |
| 6 | Référent pédagogique | 180 | Profil mis en avant aux nouveaux élèves |
| 7 | Référent régional | 230 | Accès classement régional détaillé |
| 8 | Maître enseignant | 280 | Programme mentorat (accompagner des débutants) |
| 9 | Expert REMC | 330 | Expert Hub (communauté privée REMC) |
| 10 | Cercle Or | 380 | Statut Expert REMC certifié PermiGo |
| 11 | Légende d'école | 480 | Badge animé + bannière profil public |
| 12 | **Élite France** | 600 | Badge "Élite France" — **Last 50 to unlock** : compteur public "plus que N moniteurs en France peuvent débloquer ce palier cette saison" (scarcity CD6) |

## 5. UX par page

Tutoiement, court, motivant, jamais condescendant. État vide systématiquement prévu.

| Page | Composant ranking | Position UI | Données (RPC) | Microcopy | État vide (0 validation) |
|---|---|---|---|---|---|
| `aujourdhui.js` | `RankingCard` (réutilise `moniteur-ranking.js`) | Top du dashboard, juste après le `<h1>Aujourd'hui` | `get_moniteur_ranking` | "Tu es **3e** de ton école ce mois · +12 pts pour doubler Karim →" | "Enregistre ta 1re séance pour entrer au classement de ton école." |
| `parcours-pro.js` | `PalierProgress` (existe déjà) + `RankBadge` mini | Sous le hero | `get_my_next_unlock_moniteur` | "Plus que **6 validations** avant *Pilote pédagogue*." | "Ton 1er palier *Moniteur en route* à 10 validations — t'y es presque." |
| `parcours-pro-complet.js` | `PalierTimeline` (route sinueuse, récupérée de `parcours.js`) | Pleine page | tiers locaux + `get_my_next_unlock_moniteur` | "10 paliers. Tu es au 3e. Le Cercle Or t'attend." | "Ton parcours commence à la 1re validation." |
| `ranking.js` (NOUVELLE) | `LeaderboardPodium` + `RegionalBoard` + `NationalPercentile` | Pleine page dédiée | `get_moniteur_ranking`, `get_regional_ranking`*, `get_national_position`* | "🥇 dans ton école · top 14 % du 93 · top 32 % France" | "Fais 20 validations sur 90j pour débloquer ton rang national." |
| `profil-public.js` (NOUVELLE) | `PublicProfileHero` + bouton partage | Pleine page publique | `get_public_profile`* (route `#/m/:slug`) | "Karim B. — Top 5 % des moniteurs de France · 412 validations · 38 élèves suivis" | (page non générée tant que < palier 6) |
| `mes-eleves.js` | `MicroRankNudge` (bandeau 1 ligne) | Header de liste | `get_moniteur_ranking` (ma ligne) | "Chaque validation te rapproche du top 3 de ton école." | rien (pas de bandeau si 0 validation) |
| `insights.js` | `RankTrendChart` | Sous les KPI perso | `get_my_rank_history`* | "Ton rang école : 5e → 3e en 30 jours ↗" | "Pas encore d'historique — reviens le mois prochain." |
| `log-session.js` | `XPGainToast` (post-log) | Toast après enregistrement | trigger XP existant | "+10 pts. Tu repasses 2e de ton école 🎯" | "+10 pts. Bienvenue au classement !" |
| `validation.js` | `ValidationRankPing` | Toast post-validation | trigger XP + `get_moniteur_ranking` | "Validation acquise · +0,25 pt au classement." | "1re validation enregistrée — t'es dans la course." |
| `livret-remc.js` | aucun (page de travail, on ne pollue pas) | — | — | — | — |
| `bilan.js` | aucun (doc destiné à l'élève/famille) | — | — | — | — |

\* RPC à créer (Sprint 3/4).

**Nouvelle page `enseignant/ranking.js`** : route `#/ranking`. 4 onglets — École (podium top 3 + ma position + tendance) / Région (top 10 % du dépt + ma position anonymisée) / France (top 100 + mon percentile) / Paliers (timeline 12 paliers + next unlock). État vide global : "Ton classement se construit dès ta 1re séance."

**Nouvelle page `enseignant/profil-public.js`** : route publique `#/m/:slug` (accessible sans auth, RLS lecture seule sur champs publics). Hero stats : palier actuel, % France, validations lifetime, nb élèves suivis, badges saison. Bouton "Partager sur LinkedIn" (Web Share API + fallback `linkedin.com/sharing`). Générée seulement à partir du palier 6 (Référent pédagogique) pour que la page soit toujours flatteuse.

## 6. Roadmap 4 sprints

### Sprint 1 — Fondations (déblocage value-prop) · semaine 1
- **Objectif** : le ranking local sort de la page profil et devient la 1re chose que le moniteur voit.
- Features : `RankingCard` en haut de `aujourdhui.js` (§5) ; versionner la table `moniteur_paliers` + aligner sur les 12 paliers (§4.5) ; cron quotidien `refresh_moniteur_ranking_mv()` ; `XPGainToast` post-log (§5).
- SQL : migration `0009_moniteur_paliers.sql` (CREATE TABLE versionnée + seed 12 paliers, ref `AUDIT_OBJETS_MANQUANTS` ligne 26) ; `0010_cron_refresh_ranking.sql` (pg_cron 4h).
- Risques : la MV peut être vide en démo si pas de séances confirmées du mois → seeder des sessions de démo. RLS sur `moniteur_paliers` (lecture publique authentifiée).
- Critère de succès : un moniteur voit son rang école **en < 1 s** sur le dashboard, et le toast +pts s'affiche à chaque log de séance. 100 % des moniteurs actifs ont un palier affiché.

### Sprint 2 — Ranking local visible partout · semaine 2
- **Objectif** : le classement est partout côté moniteur ET visible côté gérant (argument démo).
- Features : page `ranking.js` onglet École complet (podium + tendance) ; bandeau `MicroRankNudge` (`mes-eleves.js`) ; `ValidationRankPing` ; **ajouter une colonne rang + tri par score dans `gerant/equipe.js`** (lecture de `get_moniteur_ranking`) ; tendance vs mois dernier.
- SQL : `0011_rank_history.sql` (table `moniteur_rank_snapshot` mensuelle + fonction snapshot appelée par le cron) pour alimenter la tendance.
- Risques : la tendance n'existe pas tant qu'il n'y a pas 2 snapshots → afficher "Nouveau" le 1er mois. Le gérant ne doit voir QUE son école (RLS `auto_ecole_id`).
- Critère de succès : depuis `equipe.js`, le patron voit ses moniteurs triés par rang avec score ; la page `#/ranking` charge l'onglet École avec tendance pour ≥ 90 % des moniteurs ayant 2 mois d'ancienneté.

### Sprint 3 — Ranking régional + national · semaine 3
- **Objectif** : tenir la promesse marketing — rang régional (dépt) + national (percentile + top 100), + score v2.
- Features : RPC `get_regional_ranking` (dépt via code postal école) + `get_national_position` (percentile + qualif 20 val/90j) ; onglets Région + France dans `ranking.js` ; bascule **score v2** derrière flag ; champs DB manquants (`rating` feedback, `permis_obtenu`/attribution moniteur).
- SQL : `0012_geo_dept.sql` (colonne `dept` dérivée du code postal sur `auto_ecoles` + index) ; `0013_score_v2.sql` (nouvelle MV nationale `moniteur_ranking_national_mv` + colonnes qualité) ; `0014_feedback_rating.sql`.
- Risques : RGPD sur l'affichage "M. K. — 75" (cf. §8) ; le national exige une MV non partitionnée → coût refresh, prévoir refresh nocturne séparé ; le taux de réussite réel dépend de la saisie "permis obtenu" qui n'existe pas encore → score v2 partiel au début.
- Critère de succès : un moniteur voit son percentile France ; le top 100 national se charge en < 1,5 s ; ≥ 1 dépt avec ≥ 5 écoles affiche un classement régional crédible.

### Sprint 4 — Profil public + partage social · semaine 4
- **Objectif** : transformer le moniteur en ambassadeur — page partageable qui ramène des leads.
- Features : page `profil-public.js` (route publique `#/m/:slug`) ; badge "Top 100 France 2026" non rachetable ; bouton partage LinkedIn (Web Share API) ; OpenGraph meta dynamiques pour l'aperçu social ; `RankTrendChart` dans `insights.js`.
- SQL : `0015_public_profile.sql` (colonne `public_slug` + policy RLS lecture anonyme sur sous-ensemble de champs ; vue `moniteur_public_v` exposant uniquement stats non sensibles).
- Risques : exposition publique = surface RGPD/sécurité maximale → ne publier que les champs strictement consentis, opt-in explicite. Aperçu OG nécessite un endpoint SSR/edge function (Vercel) car le SPA hash-router ne génère pas de meta crawlables.
- Critère de succès : un moniteur palier 6+ peut générer et partager sa page en 2 taps ; l'aperçu LinkedIn affiche correctement nom + palier + stats ; ≥ 1 lead tracké via `?ref=profil_public`.

**MVP démo client** : **Sprint 1 + 80 % de Sprint 2** (RankingCard dashboard + page ranking onglet École + colonne rang dans `equipe.js`). C'est le strict nécessaire pour qu'un patron voie en démo : "mes moniteurs sont classés, ils se comparent, je vois qui performe". Le national (Sprint 3) est l'argument de closing mais peut être montré en maquette si le temps manque.

## 7. Décisions à prendre (par toi, Rayan)

1. **Maille régionale : département ou région ?** → Reco : **département**. Plus parlant pour le moniteur, assez dense.
2. **Fréquence MV intra-école : temps réel ou quotidien ?** → Reco : **quotidien (4h)**. Le temps réel coûte cher et crée du bruit anxiogène.
3. **Affiche-t-on les moniteurs "perdants" intra-école ?** → Reco : **NON** — top 3 + ta position uniquement, jamais "dernier de l'école" (piège 3, anti-churn §8).
4. **Score v2 maintenant ou après création du champ "permis obtenu" ?** → Reco : **après** — garder v1 en démo, v2 derrière flag au Sprint 3. Pas de label "qualité" sans donnée qualité.
5. **Profil public : opt-in ou opt-out ?** → Reco : **opt-in explicite** (RGPD + un moniteur mal classé ne doit pas être exposé sans accord).
6. **Anonymisation régionale/nationale : "M. K. — école" ou nom complet ?** → Reco : **initiales + nom école** (fierté locale sans doxxing).
7. **Reset mensuel du classement ou cumul annuel ?** → Reco : **mensuel pour le rang (saison), cumul lifetime pour les paliers** — donne une 2e chance chaque mois (CD7) sans effacer la progression.
8. **Le badge "Top 100 France" est-il millésimé (2026) ou permanent ?** → Reco : **millésimé** — la rareté annuelle (CD6) vaut mieux qu'un badge qui se dévalue.

## 8. Risques business

1. **Le moniteur n°1 qui perd sa place le mois suivant churne.** Mitigation : afficher un "record personnel" permanent ("meilleur rang atteint : 1er en mars") que personne ne peut lui retirer, et formuler la perte comme un défi ("reprends ta place, +8 pts suffisent") plutôt qu'un échec. Le reset mensuel est cadré comme une nouvelle saison, pas une rétrogradation.
2. **Le patron flique ses moniteurs via le ranking : feature ou bug ?** C'est une **feature assumée côté achat** (le patron paie pour ça) mais un **risque de défiance côté moniteur**. Mitigation : côté gérant, exposer le rang + score agrégé, mais **pas** le détail jour-par-jour ni la géoloc des séances ; cadrer le ranking comme un outil de valorisation/négociation pour le moniteur, pas de surveillance. Le moniteur doit sentir que l'outil le sert d'abord.
3. **RGPD : afficher publiquement "M. K. — Auto-école Paris 11" = donnée personnelle.** Mitigation : opt-in explicite pour le national/régional public et la page profil ; pseudonymisation par initiales ; mention dans les CGU + registre de traitement ; droit de retrait en 1 tap (revenir à "anonyme dans le classement"). Le classement intra-école reste justifiable au titre de l'intérêt légitime de l'employeur, le national exige le consentement.
