# Pré-modifications — code mort

Date : 27/07/2026

Branche : `codex/fix-code-mort-audit`

Base : `origin/main` (`6a1f48b`)

Statut : proposition isolée, non fusionnée et non déployée

## Résultat

Les 83 findings de la section « Code mort » ont été revérifiés dans tout
`permigo-game/`, y compris les tests, scripts, mockups et outils de build que
l'audit initial excluait.

- 62 exports réellement utilisés uniquement dans leur propre module ont été
  rendus privés en retirant seulement le mot-clé `export`.
- Aucune logique, fonction ou donnée n'a été modifiée.
- Aucun fichier ni aucune fonction n'a été supprimé.
- 12 exports signalés à tort ont été conservés, car ils ont un consommateur
  dynamique ou externe à `src`.
- Les suppressions réelles restent proposées ci-dessous pour validation par
  Claude avant un éventuel second passage.

## Pré-modifications appliquées dans cette branche

Ces changements réduisent l'API publique des modules sans modifier leur
comportement :

- `src/components/common/arene-rank.js` — `ARENE_ACCENTS`
- `src/components/common/celebrate-screen.js` — `CELEBRATE_PRESETS`,
  `showCelebrate`
- `src/components/common/cookie-banner.js` — `getConsent`
- `src/components/common/palier-sheet.js` — `closePalierSheet`
- `src/components/common/profile-card.js` — `renderProfileCard`
- `src/components/eleve/competence-unlock.js` —
  `COMPETENCE_VOLANT_REWARD`
- `src/components/eleve/daily-quests.js` — `cleanQuestTitle`
- `src/components/eleve/first-quiz-reward.js` —
  `INSTALL_AFTER_ROUE_KEY`
- `src/components/eleve/permis-card.js` — `renderPermisCard`
- `src/components/eleve/quiz-ui.js` — `richEsc`, `pickPraise`,
  `pickCoachHead`, `pickResultMsg`, `pipsHTML`
- `src/components/eleve/quiz-visuals.js` — `cockpitSVG`, `pedalesSVG`,
  `levierSVG`, `feuSVG`, `panneauSVG`
- `src/components/eleve/world-unlock-cinematic.js` —
  `playUnlockCinematic`
- `src/components/enseignant/illus.js` — `ILLUS`
- `src/components/enseignant/trophy-sheet.js` — `TROPHEES`, `BADGE_IMG`
- `src/data/fiches-i18n.js` — `FICHE_UI`, `FICHE_I18N`
- `src/data/fiches-schemas.js` — `FICHE_SCHEMAS`
- `src/data/moniteur-levels.js` — `SAISONS`
- `src/data/parcours-quiz-i18n.js` — `EXAM_UI`, `EXAM_I18N`
- `src/data/quiz-conduite.js` — `QUIZ_CONDUITE`
- `src/data/remc-details.js` — `REMC_DETAILS`
- `src/data/rewards-i18n.js` — `TROPHY_I18N`, `TROPHY_GROUP_I18N`,
  `ITEM_I18N`, `RARITY_I18N`
- `src/data/worlds-i18n.js` — `WORLD_I18N`
- `src/pages/enseignant/relances.js` — `COOL_SEUIL_J`
- `src/services/daily-quiz.js` — `LS_DAILY_STREAK`,
  `LS_DAILY_STREAK_LAST`
- `src/utils/accent.js` — `byId`
- `src/utils/free-tier.js` — `FREE_QUOTAS`
- `src/utils/game-state.js` — `getLeague`, `getNextLeague`,
  `spendGemmes`, `ownsItem`, `addOwnedItem`, `applyThemeColor`
- `src/utils/lang.js` — `isLang`
- `src/utils/league-shared.js` — `LEAGUES`, `getLeague`
- `src/utils/provenance.js` — `PROV_COLORS`, `PROV_PRESETS`, `provInk`
- `src/utils/pwa.js` — `isInAppBrowser`, `isIosNonSafari`
- `src/utils/speech.js` — `isQuizMuted`, `setQuizMuted`, `speakQuestion`
- `src/utils/statut-label.js` — `statutCfg`
- `src/utils/theme.js` — `listenSystem`
- `src/utils/theory-league.js` — `THEORY_PTS`

## Faux positifs conservés

Ces éléments ne sont pas morts :

- `src/data/seo-pages.js` — importé par `scripts/build-seo.mjs`; sa suppression
  casserait `npm run build` et la génération des 32 pages SEO.
- `renderEmptyState` — import dynamique réel dans
  `tests/e2e/empty-states.spec.js`.
- `MED_GLYPH_NAMES` et `MED_RAMPS` — importés par
  `mockups/medaillons-preview.html`, la planche de contrôle des médaillons.
- `fetchLastCompteRendu` — appelé via `accueilMod.fetchLastCompteRendu()` dans
  `pages/eleve/mon-permis.js`.
- `parseSavedDate`, `saveExamDate`, `countdown`, `fmtDate`, `loadData`,
  `BASE_TOTAL`, `buildVerdict` et `buildCriteria` — appelés via le module
  dynamique `examMod` dans `pages/eleve/mon-permis.js`.
- `computeWorldStates` — appelé via le module dynamique `parcoursMod` dans
  `pages/eleve/mon-permis.js`.
- `REMC_THEME_TAGS` — lu via le module dynamique `weakMod` dans
  `pages/eleve/accueil.js`.

## Suppressions proposées, non appliquées

### 11 fichiers sans consommateur trouvé

- `src/components/common/badge.js`
- `src/components/common/skeleton.js`
- `src/components/eleve/reward-reveal.js`
- `src/components/eleve/weekly-replay.js`
- `src/components/eleve/xp-toast.js`
- `src/data/prestige.js`
- `src/data/trophees.js`
- `src/db/client.js`
- `src/pages/auth/signup.js`
- `src/utils/count-up.js`
- `src/utils/format-date.js`

### 4 fonctions privées jamais appelées

- `src/components/eleve/chest.js` — `chestSVG`
- `src/pages/eleve/accueil.js` — `_greeting`
- `src/pages/eleve/parcours.js` — `saveParcoursView`
- `src/pages/eleve/revision-conduite.js` — `revisedToday`

### 45 exports sans consommateur trouvé

- `burstConfettiFromElement`
- `unmountHeader`
- `maybeShowInstallNudge`
- `unmountBottomNav`
- `toastAvatar`
- `markLevelSeen`
- `renderPermisMini`
- `_RULES`
- `ensHero`
- `getWorld`
- `mount` de `pages/enseignant/classement-eleves.js`
- `mount` et `unmount` de `pages/enseignant/relances.js`
- `identify` de `services/analytics.js`
- `hasCelebratedCompetence`
- `isDailyDone`
- `pickDailyQuiz`
- `stopNotifListener`
- `updateStreak`
- `getLast7Days`
- `getOpenedChests`
- `isChestOpened`
- `getOwnedItems`
- `purchaseItem`
- `computeStats`
- `attachSwipe`
- `animateCounter`
- `iconBadge`
- `LANGS`
- `LANG_LABELS`
- `isRTL`
- `saveLang`
- `renderLeagueBadge`
- `renderLeagueRow`
- `LEAGUE_CSS`
- `playHorn`
- `playLevelup`
- `playParcours`
- `playParcoursIntro`
- `playConnexionIntro`
- `playLaunchSound`
- `playLaunch`
- `statutLabel`
- `unlistenSystem`
- `volantAmount`

Ces suppressions semblent justifiées après la recherche globale, mais elles
retireraient du code ou des interfaces de module. Elles sont donc laissées
pour un GO explicite de Claude/Rayan.

## Vérifications

- Recherche globale dans `permigo-game/` hors `node_modules` et `dist`.
- `git diff --check` : OK.
- `node --check` sur les fichiers JavaScript modifiés : OK.
- Diff vérifié : 62 retraits du seul mot-clé `export`, aucune ligne de logique
  modifiée.
- `npm run build` : OK.
- Build SEO : 32 pages générées.
- Avertissements Vite : imports statiques/dynamiques déjà présents, sans
  rapport avec ce chantier.

## Risque restant

Faible pour les 62 pré-modifications : elles ne changent ni les valeurs ni les
appels internes. Le risque résiduel serait un consommateur externe inconnu au
dépôt. Les suppressions, plus risquées, n'ont pas été appliquées.
