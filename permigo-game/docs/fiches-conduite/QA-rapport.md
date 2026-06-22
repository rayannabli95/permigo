# Rapport QA — fiches de révision conduite (avant câblage app)

> Relecteur QA du studio. Relecture des 4 fiches de monde + structure examen blanc, contre `ARBITRAGES.md` et `00-STUDIO.md`.
> **Aucune fiche n'a été modifiée.** Ce document est un rapport de contrôle.
> Sévérité : 🔴 bloquant (faux / dangereux) · 🟠 à corriger · 🟢 cosmétique.
>
> **Cross-checks officiels effectués** (juin 2026) :
> - service-public.gouv.fr (F2825) : examen 32 min, ≥ 20 points, **2 manœuvres** (freinage de précision + marche arrière), ≥ 25 min de conduite → **confirme les chiffres des fiches.**
> - Code de la route art. R416-7 (Légifrance) : feux brouillard arrière = **brouillard OU neige uniquement**, interdits sous la pluie ; avant = brouillard / neige / forte pluie → **confirme ARBITRAGES + fiches.**
> - securite-routiere.gouv.fr (jeunes conducteurs) : 110 autoroute / 100 voie rapide / 80 route, 0,2 g/l, 6 → 12 points, probatoire 3 ans (2 ans AAC) → **confirme la fiche C4g.**

---

## Verdict express

Les 4 fiches + la structure examen blanc sont **solides, exactes et sûres** sur le fond. Aucune info de conduite fausse ou dangereuse détectée après cross-check officiel. Les points légaux sensibles (vitesses, feux, examen, probatoire, écarts cyclistes) sont **tous confirmés** par les sources officielles. Le ton (tutoiement, une idée à la fois) et le français sont propres. Pas de plagiat verbatim détecté : tout est reformulé.

Les remarques ci-dessous sont **mineures** : cohérence inter-fiches sur la phrase canonique des contrôles, deux formulations à lisser, et la consolidation des divergences demandée.

---

## 1. Exactitude / sécurité conduite (priorité absolue)

**Aucun 🔴.** Tous les points légaux et de sécurité ont été vérifiés.

- 🟢 **Examen /31 (EXAMEN-BLANC).** Le total « /31 » n'est pas explicitement chiffré sur la page grand public service-public ; il est confirmé par le guide IPCSR cité dans le doc, et le doc lui-même flague déjà les sous-totaux (8/9/9) comme « indicatifs ». **C'est correctement géré** : le doc dit bien « ce qui est certain : total 31, seuil 20, notation 0-3, 2 bonus ». RAS, juste noté pour traçabilité.
- 🟢 **Manœuvres = 2 (EXAMEN-BLANC §6, Phase 6).** Confirmé officiellement : freinage de précision **+** marche arrière. Le doc le signale très bien (« écart sources à connaître »). Quand on câblera, **bien retenir 2 manœuvres** (le freinage de précision compte), pas 1.
- 🟢 **Durée examen 32 min / conduite ≥ 25 min / autonomie ~5 min.** 32 min et ≥ 25 min confirmés. La durée d'autonomie « ~5 min » n'est pas chiffrée à l'officiel — le doc le flague déjà correctement (« à traiter comme environ 5 minutes »).
- 🟢 **Feux de brouillard (C3b).** Conforme à la loi (R416-7) et à ARBITRAGES : arrière interdits sous pluie, autorisés brouillard/neige ; avant pour pluie dense / brouillard / neige. Parfait.
- 🟢 **Freinage d'urgence (C3d).** Frein à fond d'abord (ABS gère la direction), débrayer juste avant de caler. Conforme à ARBITRAGES (« frein puis débrayer »). Parfait.
- 🟢 **Jeune conducteur (C4g).** 110/100/80, 0,2 g/l, 6→12 points, 3 ans / 2 ans AAC : tout confirmé.
- 🟢 **Écarts cyclistes (C2e, C3g, C4e).** 1 m en ville / 1,5 m hors agglo : standard officiel, cohérent partout. Bien.
- 🟢 **Limitations pluie autoroute (C3b).** 130→110, 110→100 : exact.

---

## 2. Cohérence avec ARBITRAGES.md

Globalement **excellente** : les fiches reprennent fidèlement les arbitrages (9h15, trajectoire de sécurité, feux brouillard, freinage d'urgence, pause nuit, probatoire, format vérifications examen). Deux écarts de formulation à signaler :

- 🟠 **Phrase canonique des contrôles — angle mort vs côté.** ARBITRAGES (C2e/C2f/transversal) fige : **« rétro intérieur → rétro extérieur (côté manœuvre) → clignotant → contrôle de l'angle mort → action »**, et précise pour le giratoire **« contrôle de l'angle mort GAUCHE avant de sortir »**.
  - `monde-3` **C3e** (insertion autoroute, étape 4) écrit « contrôle rétro extérieur **gauche** + coup d'œil par-dessus l'épaule (angle mort) » : OK, cohérent (insertion = manœuvre à gauche).
  - `monde-3` **C3g / C4e** parlent d'« angle mort par-dessus l'épaule » sans toujours nommer le côté : acceptable en ville (le côté dépend du contexte), mais **vérifier à l'intégration** que le wording reste compatible avec la phrase canonique (clignotant AVANT angle mort).
  - **Action :** rien de faux, mais au câblage, s'assurer que **partout** l'ordre reste « clignotant PUIS angle mort » et jamais l'inverse. (Aucune fiche ne l'inverse aujourd'hui — c'est conforme. Surveillance pour la suite.)

- 🟢 **Tenue du volant en virage (C2d) vs C1c.** C2d enseigne « tire le volant d'une seule main » en virage ; C1c enseigne « tirer-pousser sans croiser ». Ce n'est **pas** une contradiction (un virage léger = accompagner d'une main ; une vraie rotation = tirer-pousser), et les deux fiches sont cohérentes avec ARBITRAGES C1c. La fiche monde-2 le note elle-même comme point « à harmoniser » : à clarifier d'un mot au câblage pour ne pas dérouter, mais **pas un défaut**.

---

## 3. Cohérence inter-fiches

- 🟠 **« contrôle de l'angle mort gauche » au giratoire — formulation à uniformiser.** `monde-2` C2f dit « contrôle de l'angle mort **gauche** avant de sortir » (cohérent ARBITRAGES). À vérifier que la version câblée ne laisse pas ailleurs un simple « angle mort » sans côté pour le giratoire. Aujourd'hui c'est OK dans les fiches, juste à garder à l'œil.
- 🟢 **Régime moteur** ~2000 diesel / ~2500 essence : formulé **identiquement** en C1f et C4c. Cohérent.
- 🟢 **Freinage dégressif** (C1e et C4c) : même définition « pression plus forte puis plus légère, relâcher avant l'arrêt ». Cohérent.
- 🟢 **Distances de sécurité** (2 s / 4 s pluie) : cohérent C2b, C3b, C4d.
- 🟢 **Format des vérifications examen** (1 vérif + 1 sécurité routière + 1 premiers secours) : identique en C1g, C4f et EXAMEN-BLANC. Cohérent.
- 🟢 **Manœuvres : « pas chronométré », « pas prioritaire », « clignotant AVANT l'arrêt »** : cohérent C1h, C1i, C4f, EXAMEN-BLANC.

---

## 4. Plagiat / style parlé non reformulé

- 🟢 **Aucun copier-coller verbatim détecté.** Tout le contenu est en prose reformulée, à la 2ᵉ personne (tutoiement). Les rares citations directes de moniteurs sont **courtes, entre guillemets et attribuées** (ex. monde-1 C1a « Si la tenue n'est pas bonne, l'exécution ne le sera pas non plus » ; EXAMEN-BLANC « On sent rien qu'avec ça que tu es pas dedans »). C'est de la citation assumée, pas du plagiat masqué — **conforme à 00-STUDIO** (« on s'inspire, on reformule »).
- 🟢 **Anglicismes maîtrisés.** EXAMEN-BLANC et monde-2 utilisent « slow is smooth, smooth is fast » : c'est une citation moniteur entre guillemets, acceptable en l'état, mais à surveiller si le glossaire app bannit l'anglais (cf. préférence « zéro anglicisme »). 🟢 cosmétique.

---

## 5. Français (accents, tutoiement, lisibilité, fautes)

- 🟢 **Accents et orthographe : propres.** Aucune faute bloquante repérée. Tutoiement constant partout.
- 🟢 **« appui-tête » vs « appuie-tête ».** `monde-1` C1b écrit « **appuie-tête** » (orthographe recommandée), `EXAMEN-BLANC` Phase 2 écrit « **appui-tête** ». Les deux graphies existent ; **harmoniser sur « appuie-tête »** (déjà majoritaire) au câblage. Cosmétique.
- 🟢 **« déportation » (C3f, question 3).** « prêt à corriger une **déportation** » — le terme conduite usuel est « un **déport** » / « être **déporté** ». « Déportation » a une autre connotation. Remplacer par « un déport ». Cosmétique mais à corriger pour la propreté.

---

## 6. Conduite, pas code (règle 00-STUDIO)

- 🟢 **Aucune question de trivia code (« c'est quoi ce panneau »).** Toutes les questions portent sur le **geste / la méthode / la décision**. Conforme.
- 🟠 **Frontière conduite/code assumée mais à surveiller.** Quelques contenus sont à la limite (limitations chiffrées pluie C3b ; vitesses jeune conducteur C4g ; barème /31 et liste éliminatoires EXAMEN-BLANC). Ils sont **justifiés** (un conducteur doit les appliquer au volant) et les fiches concernées le flaguent déjà comme « à confirmer dans le périmètre ». **Recommandation :** garder, car directement actionnables en conduite — mais ne pas en faire des questions « par cœur » déguisées. Le phrasé actuel (toujours rattaché à un geste) est bon.

---

## 7. Consolidation de TOUTES les nouvelles divergences (+ décision par défaut)

Regroupement des divergences « nouvelles » remontées en bas des 4 fiches (hors points déjà tranchés dans ARBITRAGES). Décision par défaut proposée — points factuels tranchés via sources, « choix moniteur » réservé au vrai style subjectif.

| # | Origine | Divergence | Décision par défaut proposée |
|---|---|---|---|
| 1 | monde-1 C1d | Ordre « accélérateur PUIS patinage » vs « patinage PUIS accélérateur » au démarrage | **Choix moniteur (style).** Aucune n'est plus sûre que l'autre. Défaut app : présenter les deux temps (gaz + patinage) sans imposer l'ordre, mention « ton moniteur te dira dans quel ordre il préfère ». Personnalisable plus tard, au même titre que C1c. |
| 2 | monde-1 C1h | Braquer les roues à l'arrêt (sur place) pendant une manœuvre | **Choix moniteur (style).** Factuel : braquer à l'arrêt use un peu les pneus mais n'est ni interdit ni dangereux. Défaut app : tolérer pour décomposer la manœuvre (plus simple pour le débutant), avec mention « certains moniteurs préfèrent que tu braques en roulant doucement ». Personnalisable. |
| 3 | monde-2 C2f | Détection d'intersection : check-list d'indices (passage piéton, arrondi trottoir, ouverture, panneaux) — étape explicite ou implicite ? | **Trancher : étape EXPLICITE.** Factuel/pédagogique : c'est un apport sécurité fort et constant chez les moniteurs (voir avant la priorité). À intégrer comme étape nommée. Pas un choix de style. |
| 4 | monde-2 C2f | « Refus de priorité = obliger l'autre à freiner/s'arrêter » — adopter tel quel ? | **Trancher : ADOPTER.** Factuel, juridiquement correct (un refus de priorité existe dès qu'on contraint le prioritaire à modifier sa marche). Wording élève à garder. |
| 5 | monde-2 C2f | Faux positifs de priorité à droite (sortie de parking / privé / trottoir surélevé) — niveau de détail débutant ? | **Trancher : GARDER, en bref.** Factuel et utile (évite des refus/arrêts injustifiés). Garder une mention courte, pas un catalogue. |
| 6 | monde-2 C2b | Adapter l'allure « dans les deux sens » (1-2 km/h au-dessus mieux que 1-2 en dessous ; descente/côte à l'accélérateur) | **Choix moniteur (nuance).** Factuel : le « manque de dynamisme » est réellement pénalisé à l'examen (confirmé EXAMEN-BLANC). Défaut : garder le nuancier « ni trop vite ni trop lent », mais **retirer le chiffre « 1-2 km/h au-dessus »** côté élève (frontière code, peut inciter au dépassement de limite). Formuler « rouler à l'allure quand c'est dégagé, sans ramper ». |
| 7 | monde-2 C2d | Tenue du volant en virage = une main qui tire — harmoniser avec C1c | **Trancher : HARMONISER.** Pas une vraie divergence. Préciser : virage léger = accompagner d'une main ; rotation marquée = tirer-pousser sans croiser (C1c). Un mot de liaison au câblage. |
| 8 | monde-3 C3e | Rapport d'insertion autoroute (3e vs 4e) | **Trancher : PAS de rapport fixe.** Garder « adapte selon la longueur de bande » (plus robuste, dépend du véhicule). Le repère 3e/4e peut rester en aparté « selon ta voiture ». |
| 9 | monde-3 C3b | Limitations chiffrées pluie autoroute (130→110, 110→100) — dans le périmètre conduite ? | **Trancher : GARDER.** Exact et directement actionnable au volant. Conduite, pas pure trivia code. Conserver. |
| 10 | monde-3 C3a | Couper les pleins phares « au moindre doute / lueur derrière un mur » | **Trancher : GARDER (anticipation forte).** Plus prudent, conforme sécurité routière. Aucun risque à enseigner l'anticipation. Conserver tel quel. |
| 11 | monde-4 C4a | Niveau de préparation d'itinéraire / itinéraire de secours attendu à l'examen | **Choix moniteur (selon zone).** Déjà tranché ARBITRAGES : présenter en **conseil**, itinéraire de secours = bonus. Confirmer selon les inspecteurs locaux. |
| 12 | monde-4 C4c | Régime exact de changement de rapport (chiffre vs « dès que possible ») | **Choix moniteur (style).** Identique à C1f : repère sonore d'abord + ~2000/2500 indicatif. Personnalisable. |
| 13 | monde-4 C4f | Détail/formulation des vérifications intérieures/extérieures | **Choix moniteur (selon véhicule-école).** Format figé (1 vérif + 1 sécu + 1 premiers secours) ; le contenu exact dépend de la voiture. Aligner sur les fiches du moniteur. |
| 14 | monde-4 C4g | Durée probatoire 3 ans / 2 ans AAC à mettre en avant | **Trancher : AFFICHER LES DEUX.** Déjà fait dans la fiche, conforme service-public. Pas de choix à faire : les deux sont vrais, on montre les deux. |
| 15 | EXAMEN-BLANC | Durée conduite autonome (~5 min, non chiffrée officiel) | **Trancher : « environ 5 min ».** Déjà flaggé. Ne pas figer un chiffre dur dans le barème. |
| 16 | EXAMEN-BLANC | Nombre de manœuvres (officiel = 2 dont freinage précision ; vidéos = 1) | **Trancher : 2 manœuvres.** Confirmé service-public. Compter freinage de précision + marche arrière au câblage. |
| 17 | EXAMEN-BLANC | Sous-totaux points par famille (8/9/9 indicatif) | **Trancher : paramétrable, affiché « indicatif ».** Ne pas figer en dur tant que le CEPC ligne-à-ligne n'est pas vérifié. Déjà recommandé dans le doc. |

**Synthèse :** sur 17 divergences consolidées, **12 sont tranchables factuellement** (sources officielles / pédagogie) et **5 restent du vrai style moniteur** (#1, #2, #6, #11, #12, #13 — soit les gestes où aucune option n'est plus sûre/correcte que l'autre). Aucune ne bloque le câblage v1.

---

## Résumé final

- 🔴 **Bloquant : 0.** Aucune info fausse ou dangereuse. Tous les points légaux sensibles confirmés par sources officielles (service-public, R416-7, sécurité-routière).
- 🟠 **À corriger : 4.** Surveiller la phrase canonique des contrôles (clignotant AVANT angle mort) à l'intégration ; uniformiser « angle mort gauche » au giratoire ; retirer le chiffre « 1-2 km/h au-dessus » côté élève (C2b) ; harmoniser la tenue du volant en virage (C2d ↔ C1c).
- 🟢 **Cosmétique : 5.** « appui-tête » → « appuie-tête » ; « déportation » → « déport » (C3f) ; anglicisme « slow is smooth » à surveiller ; mentions frontière conduite/code OK en l'état ; barème /31 bien flaggé.
- **Verdict : GO pour câblage v1.** Le contenu est exact, sûr, cohérent et original. Les 4 🟠 sont des ajustements de wording sans risque, applicables au moment du câblage (pas de blocage). Les divergences sont toutes tranchées (12 factuelles + 5 style personnalisable).
