# Brief Codex : la banque de questions de certification

> Écrit le 01/08/2026. Chantier long, autonome, sans dépendance sur le travail
> de Claude. Tu peux tourner dessus plusieurs heures.

## Le problème, en une phrase

Il n'y a que **six questions de certification par compétence**, et le quiz en
tire cinq. Un élève qui rate et clique « Relire la fiche et retenter » retombe
sur cinq des six mêmes. Au deuxième essai il ne réapprend pas le geste, il se
souvient de la case.

## Ta mission

Faire passer chaque compétence de 6 à **au moins 12 questions**.

Trois compétences sont déjà faites, elles servent de modèle et de mètre étalon :
**C1a, C1b, C1c** (voir `supabase/migrations/20260801160000_banque_questions_c1_et_tirets.sql`).

Il reste **28 compétences**, dans cet ordre de priorité :

| Priorité | Compétences | Pourquoi d'abord |
|---|---|---|
| 1 | C1d, C1e, C1f, C1g, C1h, C1i | Le premier chapitre, tout le monde le traverse |
| 2 | C2a → C2h | La conduite en ville, le gros du volume |
| 3 | C3a → C3g | Les conditions difficiles |
| 4 | C4a → C4g | L'autonomie et l'examen |

Les noms exacts des compétences sont dans `src/data/remc.js`.

## Où ça vit

Un fichier de migration SQL par lot, dans `permigo-game/supabase/migrations/`,
nommé `AAAAMMJJhhmmss_banque_questions_<lot>.sql`.

**Tu ne touches à AUCUN fichier de `src/`.** Claude travaille en parallèle sur
`src/data/missions-pilote.js` et les composants du Mode Pilote. Aucune
collision possible tant que tu restes dans `supabase/migrations/`.

## Le schéma

Deux tables. Le français va dans `questions_competence`, l'anglais et l'arabe
dans `question_translations`.

```sql
insert into public.questions_competence
  (id, competence_id, question, options, correct_index, explanation, difficulty, type, boite)
values
('<uuid>','C1d',$pg$L'énoncé en français$pg$,
 $pg$["Bonne réponse", "Distracteur", "Distracteur"]$pg$::jsonb,
 0,
 $pg$L'explication qui apprend quelque chose.$pg$,
 2,'post_validation',null)
on conflict (id) do nothing;

insert into public.question_translations (question_id, lang, question, options, explanation)
values
('<uuid>','en',$pg$The question in English$pg$,$pg$["…","…","…"]$pg$::jsonb,$pg$The explanation.$pg$),
('<uuid>','ar',$pg$السؤال بالعربية$pg$,$pg$["…","…","…"]$pg$::jsonb,$pg$الشرح.$pg$)
on conflict (question_id, lang) do nothing;
```

Détails qui comptent :

- **`$pg$…$pg$` partout** pour le texte. Les apostrophes françaises sont
  partout, doubler les quotes est une source d'erreurs.
- **`correct_index`** est l'index dans `options`, en base 0. Varie-le, ne mets
  pas toujours la bonne réponse en premier.
- **`difficulty`** : 1 facile, 2 moyen, 3 difficile. Vise un tiers de chaque.
- **`type`** : toujours `'post_validation'`.
- **`boite`** : `null` = les deux boîtes, c'est le cas par défaut et de loin
  le plus fréquent. `'manuelle'` ou `'auto'` seulement si la question n'a
  aucun sens dans l'autre.
- **`id`** : un UUID v4 valide et STABLE (le serveur le vérifie par regex).
  Choisis un préfixe lisible par lot, comme les migrations existantes.

## La règle la plus importante sur la boîte

Le quiz filtre sur la boîte de l'élève. Après ton lot, **chaque compétence doit
avoir au moins 12 questions jouables pour la boîte manuelle ET au moins 12 pour
l'automatique**. Concrètement : si tu écris trois questions `'manuelle'`, tu
écris les trois équivalents `'auto'`.

Attention aux compétences où le piège s'est déjà refermé une fois :
C1d, C1e, C1f, C3d, C4c. En automatique il n'y a **pas d'embrayage, deux
pédales, et le frein est à gauche**.

Vérifie ton lot avec ça avant de le proposer :

```sql
select competence_id,
       count(*) filter (where boite is null or boite = 'manuelle') as manuelle,
       count(*) filter (where boite is null or boite = 'auto')     as auto
  from public.questions_competence
 where type = 'post_validation'
 group by competence_id
 having least(count(*) filter (where boite is null or boite = 'manuelle'),
              count(*) filter (where boite is null or boite = 'auto')) < 12
 order by competence_id;
```

Zéro ligne = le lot est bon.

## Comment on écrit, chez PermiGo

Ces textes, un élève de dix-sept ans les lit sur son téléphone, parfois en
apprenant le français. C'est la partie la plus importante du brief.

**On pose une situation, pas une définition.** « Tu roules de nuit et une
voiture arrive en face. Ton geste ? » vaut mieux que « Quel est l'usage
réglementaire des feux de route ? ». L'élève doit se voir dans la voiture.

**L'explication apprend quelque chose de neuf.** Elle ne répète pas la bonne
réponse, elle dit *pourquoi*, avec les mains. « Les pleins phares éblouissent
celui d'en face pendant plusieurs secondes » plutôt que « il faut passer en
code ».

**La métaphore avant la règle.** Le point de patinage, c'est « le moment où
l'embrayage commence à mordre et où la voiture veut avancer », pas « la phase
de transmission partielle du couple ».

**Les distracteurs sont plausibles.** Une mauvaise réponse absurde ne teste
rien. Écris ce qu'un élève ferait vraiment de travers.

**Jamais de pourcentage, jamais le code REMC.** L'élève ne lit ni « C1d » ni
« 80 % ». Le code est une clé technique.

**Zéro tiret dans le texte affiché.** Ni `—`, ni `–`, ni ` - ` comme séparateur.
Deux idées, deux phrases courtes. Une énumération courte prend le point médian
`·`. La virgule reste normale dans les phrases longues comme les explications,
elle est interdite dans un titre ou un libellé de bouton.

**L'anglais et l'arabe sont des traductions vraies**, pas du mot à mot. On
utilise le vocabulaire du permis local : `dipped headlights`, pas `crossing
lights`. En arabe, on écrit pour quelqu'un qui apprend à conduire en France.

## Ce que tu ne fais pas

- Tu ne touches pas à `src/`.
- Tu n'appliques pas la migration en production. Tu écris le fichier, tu
  ouvres une PR, Rayan tranche. Les tables de contenu sont en lecture seule
  pour la clé du dépôt de toute façon.
- Tu ne modifies pas les questions existantes, sauf si tu en trouves une
  **fausse**. Dans ce cas tu la signales dans la PR, tu ne la corriges pas en
  silence.
- Tu ne réécris pas le quiz ni le moteur. Ce chantier est purement du contenu.

## Ce qui compte dans ta PR

Un lot par PR, cinq ou six compétences maximum, pour qu'elles restent
relisables. Dans le corps de la PR : les compétences couvertes, le compte
avant et après par boîte, et la requête de vérification qui rend zéro ligne.

Si tu doutes d'un point de code de la route, dis-le dans la PR plutôt que de
trancher tout seul. Une question fausse dans un quiz qui **certifie** est pire
que six questions répétitives.
