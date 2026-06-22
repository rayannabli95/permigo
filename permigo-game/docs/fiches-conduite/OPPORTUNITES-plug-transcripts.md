# Opportunités — « le plug » (transcripts → contenu de conduite)

*Document de stratégie produit. Écrit le 2026-06-22.*

> **Le plug, en une phrase** : on sait aspirer gratuitement et en local le savoir de **vrais moniteurs**
> (transcriptions YouTube aujourd'hui, voix Whisper demain), le nettoyer, le classer par compétence REMC,
> et le transformer en **contenu de conduite structuré** (fiches, questions, examens blancs reconstitués).
>
> **Pourquoi c'est gros** : jusqu'ici notre seul contenu original était le **code** (que tout le monde a) et
> des fiches centre **écrites à la main** (qui ne scalent pas). Le plug nous donne le contenu qu'aucun concurrent
> n'a : de la **conduite** (le vrai trou de marché), produite **à la chaîne**, et — c'est le coup de génie —
> **brandable à la méthode de CHAQUE moniteur**. Ça transforme une corvée éditoriale en machine, et ça arme
> directement les trois piliers de la value-prop : *engagement élève*, *à SA marque*, *preuve & autorité*.

---

## 0. La grille de lecture (à garder en tête)

Tout est jugé sur 4 questions, dans cet ordre :
1. **Ça sert le moniteur indé ?** (c'est lui qui paie 9,99 €/mois)
2. **Ça nourrit l'engagement élève ?** (l'élève = le carburant viral, son envie de réviser = l'arme commerciale)
3. **C'est défendable ?** (un concurrent ne peut pas le copier en un week-end)
4. **Le risque est maîtrisable ?** (droit d'auteur, sécurité de l'info, maintenance)

Deux garde-fous non négociables, déjà posés dans `00-STUDIO.md` et `ARBITRAGES.md`, qui valent pour TOUT ce
qui suit :
- **On reformule, jamais on copie.** Le transcript est une *source d'inspiration*, pas un produit à republier.
- **Sécurité d'abord.** Une info de conduite fausse peut tuer. En cas de doute on flague, `ARBITRAGES.md` fait foi,
  et tout passe par le poste « Contrôle qualité » avant câblage.

---

## 1. Les opportunités

### O1 — Usine à fiches + questions de conduite par compétence (le socle)

**Quoi.** Ce qu'on vient de prouver : n'importe quelle chaîne de moniteur → transcripts → fiches REMC
(méthode / pourquoi / erreur classique / 3 questions), mappées C1-C4. On l'a fait sur ~170 vidéos.
C'est le **socle** : tout le reste s'appuie dessus.

- **Valeur moniteur** : enfin un livret de conduite vivant à mettre dans les mains de ses élèves entre les leçons,
  sans qu'il ait rien à écrire. Aujourd'hui il n'a *rien* à leur laisser entre deux séances.
- **Valeur élève** : du contenu qui parle de **sa** réalité (le créneau, le rond-point), pas du code qu'il révise déjà
  partout ailleurs. C'est la révision « utile » qui le fait revenir.
- **Effort** : **M.** Le pipeline existe ; reste à industrialiser le tri + QA + câblage dans `remc-details.js` et
  `questions_competence`. Le gros du travail est éditorial, pas technique.
- **Risque** : **faible-moyen.** On reformule (cadré). Vrai risque = qualité/sécurité → le poste QA est obligatoire.

---

### O2 — Contenu spécifique au centre d'examen (LE levier qui m'enthousiasme le plus)

**Quoi.** Les chaînes ont des vidéos « parcours examen Évry », « centre Créteil / Nanterre / Trappes / Argenteuil »,
des conduites commentées géolocalisées. On les transforme en **fiches centre vivantes** : pièges réels du secteur,
ce que l'inspecteur regarde *là-bas*, quiz ciblé sur les difficultés du centre. Ça branche directement la feature
**« Ton centre d'examen »** qui existe déjà (`src/data/centres-examen.js`, `src/pages/eleve/centre-examen.js`,
avec `quizTags`, `pieges`, `acces`, FAQ).

**Pourquoi c'est le levier #1 produit.** Aujourd'hui les fiches centre sont **écrites à la main** (Cergy seedé,
9 centres environ). Ça ne scale pas : il y a ~120 centres d'examen B en France. Le plug **automatise la production**
là où c'était le mur. Et c'est ultra-défendable : personne ne peut écrire 120 fiches centre crédibles à la main,
et le contenu existe déjà sur YouTube, dispersé, inexploitable tel quel par un élève stressé.

- **Valeur moniteur** : « mes élèves savent à quoi s'attendre dans LEUR centre » = argument de vente béton + preuve
  d'expertise locale. Un moniteur de Trappes vend mieux s'il prouve qu'il connaît Trappes.
- **Valeur élève** : le truc qui fait dormir tranquille la veille de l'examen. Émotionnellement le contenu le plus
  fort qu'on puisse offrir → conversion premium évidente (`CENTRES_PREMIUM_LOCKED` est déjà câblé).
- **Effort** : **M-L.** Pipeline = M (filtrer les vidéos géolocalisées, en extraire pièges + parcours). Mais couvrir
  un grand nombre de centres = L cumulé. À faire **par vagues**, en commençant par l'Île-de-France où on a déjà du matériau.
- **Risque** : **moyen.** (a) Sécurité : un « piège » faux ou périmé (travaux, rond-point modifié) décrédibilise →
  daté + reformulé + QA. (b) Droit : décrire les difficultés d'un secteur = fait public reformulé, OK ; ne jamais
  prétendre donner « le parcours exact » (la FAQ existante le dit déjà bien : pas de bachotage de parcours).

---

### O3 — Examen blanc de conduite reconstitué (« ce que l'inspecteur attend »)

**Quoi.** Les chaînes regorgent de vidéos « examen blanc » / « déroulé de l'épreuve » / « les pièges à éviter »
(déjà au catalogue). On en reconstitue la **structure de l'épreuve réelle** : les étapes (départ → voie rapide →
conduite autonome → vérifs → retour), **les fautes éliminatoires**, ce que l'inspecteur coche. On le branche sur le
mode **Examen officiel 40Q** déjà en place + le câblage `exam-blanc.js` qui consomme déjà `quizTags`.

- **Valeur moniteur** : « je te prépare à l'épreuve, pas juste au code » — le différenciateur conduite incarné.
- **Valeur élève** : démystifie l'examen, baisse l'angoisse, sait *exactement* ce qui fait échouer. Très fort.
- **Effort** : **S-M.** La structure de l'épreuve est stable et semi-officielle ; un bon corpus suffit à la fiabiliser.
  L'infra examen blanc existe déjà.
- **Risque** : **moyen.** Les fautes éliminatoires = info **critique** (faux = on coule l'élève à l'examen).
  Croisement obligatoire avec la grille officielle (REA), pas seulement les vidéos. QA renforcée.

---

### O4 — Onboarding « branche TA chaîne / TA voix » (le moat, version produit) ⭐

**Quoi.** À l'inscription, le moniteur colle l'URL de **sa** chaîne YouTube (ou, demain, enregistre sa voix via
Whisper). En quelques minutes, l'app génère **SES** fiches, **SA** méthode, **SON** ton — pas un contenu générique.
C'est la traduction produit de la phrase clé de `ARBITRAGES.md` : *« la surcouche ta méthode = le moat »*
(repères de créneau personnalisés, rotation du volant à sa façon, etc.).

**Pourquoi c'est le moat.** Trois effets cumulés :
1. **Onboarding tueur** : en 10 min le moniteur voit SON savoir transformé en app à son nom → « ah ouais, OK » immédiat.
   C'est l'aha-moment qui transforme un essai en abonnement.
2. **Justification premium permanente** : il paie 9,99 € pour un contenu **qui est le sien**, qu'aucun concurrent
   (Ornikar, EVS) ne peut répliquer parce qu'eux imposent LEUR marque et LEUR méthode.
3. **Coût de départ (switching cost)** : une fois sa méthode dans l'app, partir = tout reperdre.

- **Valeur moniteur** : maximale. C'est *littéralement* la promesse « ton app à ton nom » rendue tangible.
- **Valeur élève** : cohérence totale entre ce que dit le moniteur en voiture et ce qu'il révise dans l'app
  (zéro contradiction de méthode = moins de confusion = meilleur apprentissage).
- **Effort** : **L.** Pipeline self-serve (file d'attente de traitement, génération auto, **relecture par le moniteur
  avant publication** — indispensable pour la sécurité ET pour qu'il s'approprie), UI d'édition. Plus lourd, mais
  c'est l'actif stratégique.
- **Risque** : **moyen-élevé.** (a) Qualité variable selon la chaîne source (certains moniteurs disent des choses
  fausses ou datées) → l'étape « le moniteur valide ses fiches » sert aussi de filet. (b) Sa voix = donnée perso →
  consentement explicite, on traite, on ne republie pas ailleurs. (c) Charge de traitement (Whisper local OK pour
  l'instant, mais à surveiller au volume).

---

### O5 — Guide de conduite commentée audio (entre les leçons)

**Quoi.** Whisper dans l'autre sens : on génère de courts **audios de conduite commentée** (« là tu approches d'un
rond-point, qu'est-ce que tu fais… ») à écouter passivement entre deux leçons, idéalement avec la voix/méthode du
moniteur (lien avec O4).

- **Valeur moniteur** : sa présence pédagogique continue même quand il n'est pas là.
- **Valeur élève** : révision passive, faible friction, format jeune (podcast/TikTok-audio), entretient la boucle.
- **Effort** : **M-L** (TTS gratuit on-device contraint la qualité — cf. préférence « gratuit/local » de Rayan ;
  faire parler le *vrai* moniteur via clips existants évite le TTS robotique).
- **Risque** : **moyen.** Qualité TTS gratuit limitée ; conduite décrite à l'oreille = risque d'imprécision.
  **À voir comme une V2 de O4, pas un chantier autonome.**

---

### O6 — Bibliothèque de questions/fiches « toujours fraîche » (alimentation continue)

**Quoi.** Le plug tourne en continu : nouvelles vidéos → nouvelles questions → le stock `questions_competence` ne
s'épuise jamais, on couvre des cas rares (verglas, insertion autoroute, priorité à droite tordue).

- **Valeur moniteur** : un produit qui s'enrichit tout seul (perception de qualité qui monte).
- **Valeur élève** : moins de répétition, plus de variété → meilleure rétention.
- **Effort** : **S** une fois le pipeline O1 industrialisé (c'est un sous-produit, pas un chantier séparé).
- **Risque** : **faible.** Risque principal = dérive qualité si on relâche la QA → garder le poste contrôle.

---

### O7 (option lointaine) — Contenu de conduite indexable pour le SEO/GEO

**Quoi.** Les fiches centre + fiches conduite reformulées = des **pages riches et uniques** (« pièges de l'examen à
Créteil », « réussir le rond-point ») qui matchent ce que les candidats googlent. Lien direct avec
`docs/SEO_STRATEGY.md` (pari « centres programmatique »).

- **Valeur** : acquisition organique d'élèves (carburant viral) → pression d'inscription sur les moniteurs.
- **Effort** : **L** (bloqué par le verrou SPA hash-router à lever d'abord — cf. SEO_STRATEGY).
- **Risque** : **moyen** (qualité = critère Google ; contenu mince ou dupliqué = pénalité).
- **Verdict** : réel mais **dépendant d'un chantier SEO non encore débloqué**. À garder en réserve, pas maintenant.

---

## 2. Vue d'ensemble (effort vs impact)

| # | Opportunité | Moniteur | Élève | Effort | Risque |
|---|---|---|---|---|---|
| O1 | Usine fiches + questions par compétence | élevé | élevé | **M** | faible-moyen |
| O2 | Contenu par centre d'examen | **très élevé** | **très élevé** | M-L | moyen |
| O3 | Examen blanc reconstitué + fautes éliminatoires | élevé | **très élevé** | **S-M** | moyen |
| O4 | Onboarding « TA chaîne / TA voix » (moat) | **maximal** | élevé | L | moyen-élevé |
| O5 | Conduite commentée audio | moyen | élevé | M-L | moyen |
| O6 | Stock de questions toujours frais | moyen | élevé | **S** | faible |
| O7 | SEO/GEO contenu conduite | élevé (acq.) | — | L | moyen |

---

## 3. Top 3 recommandé

### 🥇 1. O2 — Contenu spécifique au centre d'examen
Le meilleur rapport impact / défendabilité. La feature « Ton centre d'examen » existe déjà mais est **bloquée par la
production manuelle** ; le plug fait sauter exactement ce verrou. C'est aussi le contenu le plus **émotionnel** pour
l'élève (la veille de l'examen) → conversion premium évidente (`CENTRES_PREMIUM_LOCKED` est prêt), et le plus
**vendeur** pour le moniteur (« mes élèves connaissent LEUR centre »). Personne ne peut copier 120 fiches centre à la
main. **Premier pas concret** : une vague Île-de-France (on a déjà Évry + matériau IDF au catalogue), reformulée,
QA, branchée sur les `quizTags`/`pieges` existants.

### 🥈 2. O3 — Examen blanc reconstitué (« ce que l'inspecteur attend »)
L'effort le plus faible (**S-M**) pour une valeur élève **très élevée**, et c'est le différenciateur conduite
incarné : on ne prépare pas au code, on prépare à **l'épreuve**. L'infra (mode Examen officiel 40Q, `exam-blanc.js`)
existe déjà ; le matériau (vidéos « déroulé / pièges ») est déjà catalogué. **Seule vigilance** : les fautes
éliminatoires = info critique → croiser avec la grille officielle, QA renforcée.

### 🥉 3. O4 — Onboarding « branche TA chaîne / TA voix » (le moat)
L'effort le plus lourd (**L**), donc 3e — mais c'est **l'actif stratégique de long terme**. C'est ce qui rend
PermiGo *impossible à commoditiser* : le contenu devient celui du moniteur, à sa marque, avec un coût de départ réel.
À lancer une fois O1 industrialisé et O2/O3 validés en production. **Quand ce sera prêt, c'est lui qui ferme la vente
et fait grimper la rétention.**

**Logique de séquençage** : O1 (socle) est le prérequis implicite des trois. On industrialise O1 → on shippe O2 et O3
(quick wins défendables, infra déjà là) → on capitalise avec O4 (le moat). O6 vient gratuitement en route ; O5 est une
V2 de O4 ; O7 attend le déblocage SEO.
