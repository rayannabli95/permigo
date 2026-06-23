# Idées « builders IA » → appliquées à PermiGo

*Recherche web + extraction produit. Écrit le 2026-06-23.*

> **But du doc.** Pas un cours sur l'IA. On regarde ce que font les gens qui **construisent avec l'IA / les agents** (génération de contenu à l'échelle, agents qui vérifient, perso, boucles de croissance, UGC, voix) et on en sort des idées **concrètes, applicables à PermiGo**, ancrées sur notre cible (le moniteur indé) et notre moat (la **conduite** pilotée par la leçon).
>
> ⚠️ **Ce doc ne refait PAS le pipeline contenu.** Le « plug » (transcripts → fiches/questions/centres) est déjà cadré dans `docs/fiches-conduite/OPPORTUNITES-plug-transcripts.md` (O1→O7). Ici on apporte la **couche méthode** : *comment* un builder IA produit, vérifie, personnalise et fait grandir — appliqué à nous. C'est complémentaire, pas redondant.
>
> 🚫 **Garde-fou Rayan (verrouillé).** « Branche ta chaîne » comme **promesse marketing** est rejeté : **PermiGo a UNE voix.** Le moniteur ne configure pas un tuyau ; il reçoit un produit fini, propre, à sa marque. Toutes les idées ci-dessous respectent ça : l'IA tourne **en coulisse**, jamais exposée comme un gadget « branche ton flux ».

---

## La grille de lecture (la même que le plug)

Chaque idée jugée sur 4 questions, dans l'ordre :
1. **Ça sert le moniteur indé ?** (c'est lui qui paie 9,99 €/mois)
2. **Ça nourrit l'engagement élève ?** (le carburant viral)
3. **C'est défendable ?** (pas copiable en un week-end)
4. **Le risque est maîtrisable ?** (sécurité info, droit, maintenance, coût)

Plus deux garde-fous métier non négociables, déjà posés :
- **On reformule, jamais on copie** (le transcript inspire, il n'est pas republié).
- **Sécurité d'abord** : une info de conduite fausse peut tuer → tout contenu sensible passe par un contrôle qualité avant câblage.

---

## Les idées

### B1 — Pipeline « générateur → critique → juge » (le pattern qui industrialise le contenu) ⭐

**Ce que c'est (vu chez les builders).** Le pattern multi-agent qui revient partout en 2026 : un agent **génère** un brouillon, un second agent **critique** contre des critères durs (factualité, format, ton), une **boucle bornée** à 2-3 passes (au-delà ça se mange la queue), puis un **juge** rend une décision binaire *ship / bloque / escalade vers un humain*. Idée clé : **séparer génération et vérification, idéalement avec deux modèles différents** pour l'indépendance. C'est exactement comme ça que Duolingo industrialise ses leçons (génération paramétrée + couche d'éval IA + relecture humaine qui a le dernier mot).

**Appliqué à PermiGo.** Notre pipeline « plug » (O1) produit déjà des fiches + questions de conduite. On le muscle avec une chaîne formelle :
- **Générateur** : transcript nettoyé → fiche REMC (méthode / pourquoi / erreur classique / 3 questions) + tags C1-C4.
- **Critique sécurité conduite** : un agent dédié qui ne fait QUE chasser l'info fausse/datée/dangereuse (« priorité à droite », « distances », « fautes éliminatoires ») et la flague.
- **Juge** : décision *auto-publiable / à relire / à jeter*. Tout ce qui touche aux **fautes éliminatoires** ou aux **pièges centre** part d'office en « à relire humain » (croisement obligatoire avec la grille officielle REA, pas juste les vidéos).

**Valeur.** Moniteur : un livret qui s'enrichit sans qu'il écrive rien, et **fiable** (l'argument de vente s'effondre si une info est fausse). Élève : du contenu de conduite varié et sûr. Business : c'est ce qui rend O1→O6 **scalable sans noyer Rayan sous la relecture** — le QA passe de « tout relire » à « relire seulement ce que le juge escalade ».

**Effort : M.** Le pipeline existe ; on ajoute deux étapes (critique + juge) et une file « à relire ». Surcoût d'inférence sur le sous-ensemble vérifié seulement.
**Risque : faible.** C'est un *réducteur* de risque (sécurité). Seul piège : ne pas faire confiance aveugle au juge sur le critique (fautes éliminatoires = toujours œil humain).

---

### B2 — La curriculum-as-examples (la technique Duolingo qui change tout) ⭐

**Ce que c'est.** La vraie leçon du pipeline Duolingo : au lieu d'écrire des instructions compliquées (« génère un exercice pédagogiquement valide… »), ils **donnent au modèle des exemples déjà validés par leurs experts** comme patrons à suivre — un système « Mad Libs » : règles fixes + paramètres variables (niveau, thème, compétence visée, format). Le modèle copie un **bon** patron au lieu d'interpréter une consigne floue. Résultat : qualité bien plus stable, dev de contenu massivement accéléré.

**Appliqué à PermiGo.** On a déjà des **fiches de conduite faites main de référence** (`docs/fiches-conduite/fiches/`, RECETTES-pedagogie.md) et des questions validées. On en fait des **gabarits d'or** : le générateur de B1 reçoit 2-3 de nos meilleures fiches REMC comme exemples + des paramètres (compétence C1-C4, type d'erreur, centre). Il calque notre format, notre ton, notre niveau d'exigence. **C'est aussi ce qui garantit la « UNE voix »** exigée par Rayan : le contenu ne dérive pas vers le ton de la chaîne source, il converge vers le **gabarit PermiGo**.

**Valeur.** Business : qualité homogène = moins de relecture = le pipeline tient à l'échelle. Élève : tout sonne « PermiGo », cohérent. C'est le levier qui fait passer O1 de « ça marche sur 170 vidéos » à « ça tient sur 120 centres ».

**Effort : S.** On sélectionne nos meilleures fiches/questions existantes comme few-shot examples. Pas de nouvelle infra — c'est du prompt-engineering sur le générateur déjà là.
**Risque : faible.** Veiller à régénérer les gabarits quand le standard éditorial monte (sinon le contenu plafonne au niveau des exemples).

---

### B3 — Personnalisation « points faibles » pilotée par les erreurs réelles

**Ce que c'est.** Les tuteurs IA 2026 ne « poussent pas du contenu » : ils lisent les **signaux** (réponses, temps passé, motifs d'erreur) et **changent ce que l'élève voit ensuite**. La combinaison qui marche : suivi de l'état de connaissance + répétition espacée + sélection adaptative de la difficulté. Hippocrates (MeducationAI) « apprend de tes erreurs et adapte ses questions futures ».

**Appliqué à PermiGo.** On a déjà la matière brute : `quiz_attempts` logge **toutes** les tentatives, et il y a une dette « weak_points » connue (RPC futur, cf. mémoire readiness). On la transforme en boucle :
- détecter les compétences où l'élève **se plante régulièrement** (créneau, insertion, priorités) ;
- re-servir ces thèmes en priorité dans la « question du jour » et la révision ;
- côté moniteur : **« voici les 2 trucs sur lesquels [élève] coince »** avant la leçon → il arrive en voiture en sachant quoi travailler.

**Valeur.** Moniteur : un signal qui rend sa leçon plus efficace = **preuve qu'il prépare mieux** (cœur de la value-prop « autorité »). Élève : moins de répétition inutile, révision qui sert. C'est de la perso **sans LLM coûteux** au runtime — du SQL + des règles suffisent pour la V1 (l'IA sert à *catégoriser* les erreurs en amont, pas à scorer chaque élève en live).

**Effort : M.** Surtout un chantier DB (le RPC weak_points gelé) + branchement dans la question du jour et la fiche élève moniteur. Pas d'IA temps réel nécessaire pour démarrer.
**Risque : faible.** Respecter les antipatterns moniteur (signal neutre, pas de surveillance nominative agressive ; côté élève, jamais culpabilisant).

---

### B4 — Le « Recap » partageable (boucle de croissance type Wrapped) ⭐

**Ce que c'est.** Spotify Wrapped = la boucle virale la plus copiée (Letterboxd, Oura, Beli…). Mécanique : du contenu **personnalisé, fait pour être montré**, qui parle de **l'utilisateur** (pas de la marque), au format **story animée tap-forward**, avec **rareté/ritualité** (ça ne sort qu'à un moment). 500M+ partages en un jour. Les gens partagent leur **identité**, pas la pub.

**Appliqué à PermiGo.** On a déjà des briques : `weekly-replay`, l'écran de récap de session Révision (revision-recap.js), le Hall of Fame. On en fait un **recap partageable** :
- **« Ta semaine de révision »** ou, plus fort émotionnellement, **« Prêt pour l'examen »** (jour J approchant) : carte story animée — jours de streak, compétences validées, % de progression, ton centre d'examen.
- **Et le coup malin spécifique à nous** : la carte porte **le nom et la marque du moniteur** (« préparé par [Moniteur] sur PermiGo »). Quand l'élève la poste, **c'est le moniteur qui se fait connaître** → acquisition d'autres élèves → pression d'inscription sur d'autres moniteurs. La boucle virale **sert directement la cible payante**.

**Valeur.** Élève : fierté, identité (« je bosse mon permis »), partage naturel. Moniteur : visibilité gratuite à sa marque (exactement « l'outil à SA marque »). Business : boucle d'acquisition organique **sans budget pub** — c'est le levier de croissance le moins cher. Lien direct avec la métrique rétention 40 % (memoire `retention_strategy_plan`).

**Effort : M.** Infra de récap existe (weekly-replay, revision-recap) ; reste à designer une carte **vraiment partageable** (image générée, format story, marque moniteur) + bouton partage natif. Pas d'IA obligatoire pour la V1 (template + données) ; l'IA peut écrire un mot personnalisé (« cette semaine tu as cartonné le rond-point ») en bonus.
**Risque : faible-moyen.** (a) RGPD : pas de données sensibles sur la carte (on n'a pas de tel/adresse, donc OK ; rester sur prénom + stats). (b) Ne pas tomber dans le ton enfant côté image si la marque moniteur est dessus (cohérence pro). (c) La rareté doit être réelle (un récap toutes les 5 min = zéro effet).

---

### B5 — Conduite commentée audio avec la VRAIE voix du moniteur (pas du TTS robotique)

**Ce que c'est.** Whisper + LLM transforment des vidéos en supports structurés ; et le **TTS** permet de générer de l'audio pédagogique à l'échelle (Duolingo génère son audio par LLM+TTS). Mais le TTS gratuit on-device sonne robotique (préférence Rayan = gratuit/local). La parade des builders : **réutiliser l'audio réel** (clips de la source) plutôt que synthétiser.

**Appliqué à PermiGo.** C'est O5 du plug, mais avec un angle « builder » : au lieu de générer une voix synthétique, on **découpe les vrais clips audio du moniteur** (depuis ses vidéos, via le pipeline Whisper qui a déjà l'alignement texte↔temps) en micro-capsules de conduite commentée (« là tu approches d'un rond-point… »). L'élève écoute **la vraie voix d'un vrai moniteur** entre deux leçons — format podcast/TikTok-audio, faible friction.

**Valeur.** Élève : révision passive, format jeune, voix humaine crédible. Moniteur : présence pédagogique continue. Business : entretient la boucle quotidienne (habitude).
**Effort : M-L.** Découpe + sélection de clips propres + QA (un clip sorti de contexte peut induire en erreur). À voir comme **V2**, après B1/B2 industrialisés.
**Risque : moyen.** Droit (clip d'une chaîne tierce = à reformuler/recréer, pas republier brut → privilégier des moniteurs partenaires) ; précision (conduite décrite à l'oreille). **Ne pas lancer avant que le socle contenu soit solide.**

---

### B6 — UGC assisté par IA, mais à NOTRE voix (acquisition organique élève)

**Ce que c'est.** La leçon Coconote : 0 → 6,7 M$ ARR en 18 mois, **sans budget pub**, via une petite équipe « commando » qui produit du **UGC TikTok à haute fréquence** (formats natifs : « salle de classe », « prof », pattern-interrupt), avec des **lead-magnets « cheval de Troie »**. Piège qu'ils ont identifié : le viral pur (le « PDF to Brainrot » à 40M vues) ramène du **trafic faible intention** — il faut viser des formats qui amènent des gens **qui ont vraiment le problème**.

**Appliqué à PermiGo.** Notre problème ultra-ciblé et **émotionnel** : la peur de l'examen, et **le centre d'examen** (O2). Formats UGC à fort signal d'intention :
- **« Les 3 pièges du centre de [ville] »** (Évry, Créteil, Trappes…) → l'élève stressé de cette ville *clique parce que c'est SON centre*. Trafic haute intention, pas du brainrot.
- **« Ce que l'inspecteur regarde vraiment »** (O3, fautes éliminatoires).
- L'IA aide à **produire à la chaîne** (script, montage, sous-titres) à partir de notre contenu déjà reformulé — mais **avec le ton PermiGo**, jamais « branche n'importe quoi ». Une voix, une ligne édito.

**Valeur.** Business : canal d'acquisition élève **organique et défendable** (le contenu centre, personne ne l'a). Élève = carburant viral → pression d'inscription moniteur. Lien avec O7 (SEO) : la même matière sert TikTok ET Google.
**Effort : M** (production de contenu, pas de code) — c'est un chantier **GTM/marketing**, pas produit. À cadrer avec `docs/GTM_PREMIERS_CLIENTS.md`.
**Risque : moyen.** (a) Ne pas diluer la voix (cohérence édito = règle d'or). (b) Sécurité : un « piège centre » faux dans une vidéo virale décrédibilise à grande échelle → même QA que B1. (c) Volume = temps humain réel (Coconote = une équipe dédiée, pas un bouton magique).

---

### B7 — La « question du jour » générée et vérifiée en continu (stock toujours frais)

**Ce que c'est.** Combinaison de B1 + B2 + B3 au service de la boucle de rétention déjà verrouillée (memoire `retention_strategy_plan` : 3 questions/jour, ligue, push). Les builders gardent leurs banques de questions **vivantes** : le pipeline tourne, le stock ne s'épuise jamais, on couvre les cas rares (verglas, insertion autoroute, priorité à droite tordue).

**Appliqué à PermiGo.** C'est O6 du plug, branché sur la boucle quotidienne : le pipeline alimente en continu `questions_competence`, et B3 **priorise** pour chaque élève les thèmes où il coince. La question du jour devient à la fois **fraîche** (jamais la même) et **pertinente** (sur ses points faibles). Double effet rétention.

**Valeur.** Élève : variété + pertinence = il revient. Moniteur : produit qui s'enrichit seul. Business : nourrit directement la métrique 40 %.
**Effort : S** une fois B1 industrialisé (c'est un sous-produit, pas un chantier séparé).
**Risque : faible.** Dérive qualité si on relâche la QA → garder le juge de B1.

---

## Vue d'ensemble (effort vs impact)

| # | Idée | Moniteur | Élève | Business | Effort | Risque |
|---|---|---|---|---|---|---|
| B1 | Pipeline générateur→critique→juge | élevé | élevé | **élevé** | M | faible |
| B2 | Curriculum-as-examples (gabarits d'or) | élevé | élevé | **élevé** | **S** | faible |
| B3 | Perso « points faibles » | **élevé** | élevé | moyen | M | faible |
| B4 | Recap partageable (Wrapped) | élevé | **très élevé** | **très élevé** | M | faible-moyen |
| B5 | Conduite commentée vraie voix | moyen | élevé | moyen | M-L | moyen |
| B6 | UGC assisté IA à notre voix | élevé (acq.) | élevé | **élevé** | M | moyen |
| B7 | Question du jour fraîche + ciblée | moyen | **élevé** | élevé | **S** | faible |

---

## TOP 3 recommandé

### 🥇 1. B2 — Curriculum-as-examples (gabarits d'or)
Le meilleur rapport effort/impact du lot : **effort S**, et ça débloque tout le reste. C'est la technique exacte qui fait marcher Duolingo, et chez nous elle **garantit la « UNE voix »** que Rayan exige (le contenu converge vers le gabarit PermiGo au lieu de dériver vers le ton des chaînes sources). Sans elle, le pipeline plug plafonne en qualité et noie Rayan sous la relecture. **Premier pas concret** : sélectionner 3-4 de nos meilleures fiches REMC + questions validées (`docs/fiches-conduite/fiches/`) comme exemples few-shot dans le générateur déjà en place.

### 🥈 2. B4 — Le Recap partageable « à la marque du moniteur »
La seule idée qui attaque directement **l'acquisition** (notre vrai goulot : avoir des moniteurs payants passe par des élèves engagés et visibles). Boucle Wrapped éprouvée (500M+ partages), briques déjà là (weekly-replay, revision-recap, Hall of Fame), **et le twist PermiGo** — la carte porte la marque du moniteur — transforme le partage élève en **acquisition pour la cible payante**. Croissance organique, zéro budget pub. **Premier pas concret** : un récap « Ta semaine » en carte story partageable, prénom + streak + compétences + marque moniteur, bouton partage natif.

### 🥉 3. B1 — Pipeline générateur → critique → juge
L'infrastructure qui rend tout le reste **sûr et scalable**. Effort M, mais c'est ce qui fait passer la production de contenu conduite de « ça marche en démo » à « ça tient à l'échelle sans qu'une info fausse coule un élève à l'examen ». Sécurité = condition de survie de la value-prop (une faute éliminatoire fausse et l'argument de vente s'effondre). À industrialiser juste après B2 (B2 améliore la génération, B1 la met sous contrôle). **Premier pas concret** : ajouter un agent « critique sécurité conduite » + une file « à relire humain » sur tout ce qui touche fautes éliminatoires et pièges centre.

**Logique de séquençage.** B2 (qualité, effort S) → B1 (contrôle/scale, M) forment le **socle pipeline**. Une fois posé, B7 (question du jour) vient quasi gratuitement, et B3 (points faibles) ajoute la perso. En parallèle et indépendant du pipeline : B4 (croissance) est le chantier à plus fort levier business et peut démarrer **tout de suite**. B5 et B6 sont des V2 (audio, UGC) à lancer quand le socle contenu est solide.

---

## Sources

- Duolingo — pipeline de génération de leçons (curriculum-as-examples, Mad Libs, human-in-the-loop) : [ZenML LLMOps DB](https://www.zenml.io/llmops-database/ai-powered-lesson-generation-system-for-language-learning) · [Audio LLM+TTS à l'échelle](https://www.zenml.io/llmops-database/scaling-audio-content-generation-with-llms-and-tts-for-language-learning) · [Dr Philippa Hardman — Duolingo's AI Revolution](https://drphilippahardman.substack.com/p/duolingos-ai-revolution)
- Pattern multi-agent générateur/critique/juge (boucles bornées, verifier pattern) : [Digital Applied — Multi-Agent Orchestration Patterns](https://www.digitalapplied.com/blog/multi-agent-orchestration-patterns-producer-consumer) · [MindStudio — Verifier Pattern](https://www.mindstudio.ai/blog/verifier-pattern-multi-agent-systems-independent-review)
- LLM-as-a-Judge (éval factualité/qualité) : [Evidently AI](https://www.evidentlyai.com/llm-guide/llm-as-a-judge) · [Confident AI](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method)
- Personnalisation / tuteurs adaptatifs (points faibles, répétition espacée) : [ORDO Research — LLM Tutoring](https://ordoresearch.ai/blog/llm-tutoring-personalized-learning) · [MeducationAI — AI Medical Tutors 2026](https://meducationai.com/blog/ai-medical-tutors-in-2026-how-they-work-and-which-ones-are-worth-using)
- Boucle de croissance « Wrapped » (recap partageable) : [NoGood — Spotify Wrapped Strategy](https://nogood.io/blog/spotify-wrapped-marketing-strategy/) · [Idomoo — Why Wrapped Works](https://www.idomoo.com/blog/why-spotify-wrapped-works-and-how-you-can-do-it-too/)
- UGC assisté IA / croissance organique edtech (Coconote) : [Stormy AI — Coconote UGC Playbook](https://stormy.ai/blog/coconote-ugc-playbook-app-growth-2026) · [Growth Hacking Lab — Coconote case study](https://thegrowthhackinglab.com/case-studies/coconote-300k-revenue-30k-downloads/) · [Reverse-Engineering Virality (SpyTok)](https://stormy.ai/blog/reverse-engineering-virality-spytok-coconote-strategy)
- Whisper + LLM → supports structurés (pipeline transcription) : [Medium — Whisper + GPT-4 lecture notes](https://medium.com/@ayhamboucher/using-whisper-and-gpt-4-to-automatically-generate-lecture-notes-from-audio-recordings-ebaa5c9f1329) · [arXiv — Transcribing Educational Videos Using Whisper](https://arxiv.org/html/2307.03200)
- Génération quiz/flashcards depuis vidéo (état de l'art outils) : [QuizFlex AI](https://quizflex.ai/) · [Audiorista — AI flashcards](https://www.audiorista.com/blog/ai-flashcard-creator-for-elearning)
- Patterns d'agents / build avec Claude 2026 (sub-agents spécialisés, JSON, guardrails) : [Ramlit — Custom AI Agents with Claude Code 2026](https://www.ramlit.com/blog/custom-ai-agents-agentic-workflows-claude-code-2026-guide)
