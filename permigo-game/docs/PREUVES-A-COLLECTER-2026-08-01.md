# Les preuves à collecter — chantier 6

**Date** : 1er août 2026 · suite de `AUDIT_PREMIERES_SECONDES_2026-08-01.md` (faille C2)
**Pourquoi ce fichier n'est pas du code** : on ne peut pas inventer une preuve. Tout ce qui suit est prêt à coller le jour où le contenu existe. Rien ici ne doit être publié avant d'être vrai.

---

## L'état des lieux

La page d'accueil n'a **aucune preuve sociale**. Ni avis, ni nombre d'utilisateurs, ni caution métier. La seule statistique affichée (74,7 % contre 56,8 %) parle de la conduite accompagnée en général, pas de PermiGo. Un beau site inconnu ne convertit pas, et encore moins auprès d'un public qui se méfie des paiements en ligne.

Trois preuves bien placées valent mieux que dix alignées.

---

## 1. La caution métier — disponible tout de suite, sans rien collecter

C'est l'argument que personne d'autre n'a et qu'on n'utilise pas : le produit est fait par un moniteur, sur le référentiel officiel, et l'examen blanc note sur les critères de l'inspecteur.

**Emplacement** : juste avant le bloc des offres, après l'addition des 55 €.

**Français**
> **Fait par un moniteur. Pas par une agence.**
> Les fiches, les scènes et l'examen blanc suivent le référentiel officiel du permis B. Les 31 compétences que ton livret demande de valider. Ni plus ni moins.

**English**
> **Built by a driving instructor. Not by an agency.**
> The lesson sheets, the road scenes and the mock exam follow the official French licence syllabus. The 31 skills your logbook asks you to validate. Nothing more, nothing less.

**العربية**
> **صُنع على يد مدرّب قيادة. لا وكالة إعلانات.**
> الدروس وسيناريوهات الطريق والامتحان التجريبي تتبع المرجع الرسمي لرخصة B. المهارات الـ 31 التي يطلب دفترك التحقق منها. لا أكثر ولا أقل.

⚠️ **Le code REMC ne s'affiche jamais** à l'écran de l'élève. On dit « le référentiel officiel », jamais « C1a ».

---

## 2. Trois avis d'élèves — à collecter

### Le format qui marche

Prénom, âge, ville, **et un résultat concret**. Jamais « super app ».

Exemples de la forme visée (à remplacer par du vrai) :
> « J'arrivais à mes leçons sans savoir ce qu'on allait faire. Là je sais. Mon moniteur l'a vu tout de suite. » — Yanis, 19 ans, Cergy
> « Le créneau, je l'ai compris en lisant la fiche la veille. Pas en bloquant dans la rue. » — Sarah, 22 ans, Argenteuil

### Qui viser, un par persona

1. **Un débutant** : ce qui a changé entre sa 3e et sa 6e heure.
2. **Un proche de l'examen** : ce que l'examen blanc lui a montré.
3. **Un non francophone** : ce qui a débloqué la langue.

### Le message à envoyer (français)

> Salut {prénom},
> Je prépare la nouvelle page de PermiGo et j'aimerais y mettre de vrais élèves, pas des faux témoignages.
> Une question, une seule : **qu'est-ce qui a changé pour toi depuis que tu utilises l'app ?** Réponds comme tu parles, une ou deux phrases suffisent.
> Si ta réponse me va, je te demande juste : je peux la publier avec ton prénom, ton âge et ta ville ? Tu peux dire non, ça ne change rien.
> Merci 🙏

### Le message à envoyer (arabe)

> مرحباً {الاسم}،
> أُحضّر الصفحة الجديدة لـ PermiGo وأريد أن أضع فيها كلام طلاب حقيقيين، لا شهادات مصطنعة.
> سؤال واحد فقط: **ما الذي تغيّر عندك منذ أن بدأت تستخدم التطبيق؟** أجب بكلماتك، جملة أو جملتان تكفيان.
> وإذا أعجبني جوابك، سأسألك فقط: هل يمكنني نشره مع اسمك الأول وعمرك ومدينتك؟ يمكنك الرفض، ولن يتغيّر شيء.
> شكراً 🙏

### L'accord écrit

Une phrase suffit, gardée dans un dossier :
> « J'autorise PermiGo à publier ma phrase avec mon prénom, mon âge et ma ville, sur son site et ses réseaux. Je peux demander le retrait à tout moment en écrivant à {email}. »

**Interdit absolu** : écrire un avis à la place d'un élève, inventer un prénom, arrondir un âge, publier sans accord.

---

## 3. Les chiffres d'usage — à mesurer avant d'en parler

Règle : **si le chiffre n'est pas flatteur, on ne l'affiche pas. On ne le maquille pas non plus.**

La requête à lancer (Supabase, lecture seule) :

```sql
select
  (select count(*) from profiles where role = 'eleve')                                  as eleves,
  (select count(*) from profiles where role = 'eleve'
     and last_active_at > now() - interval '7 days')                                    as eleves_actifs_7j,
  (select count(*) from quiz_attempts)                                                  as sessions_totales,
  (select count(*) from quiz_attempts where created_at > now() - interval '7 days')     as sessions_7j,
  (select count(*) from pass_purchases)                                                 as achats_pass;
```

Formulations possibles selon le résultat, dans l'ordre du plus honnête au plus vendeur :

- « {n} élèves préparent leurs leçons avec PermiGo. » (si n ≥ 50)
- « {n} scènes de conduite jouées cette semaine. » (si n ≥ 200)
- Rien du tout. C'est une option parfaitement valable au lancement, et c'est mieux qu'un chiffre tiède.

⚠️ Je n'ai pas lancé cette requête moi-même : l'accès direct à la base a été refusé pendant la session (garde-fou de l'outil). À lancer par toi, ou avec ton feu vert explicite.

---

## 4. La preuve la plus forte, celle qu'on a déjà construite

**Sa propre note à l'examen blanc.** Depuis la PR « la première minute », un compte gratuit y a droit une fois. Une note honnête sur les critères de l'inspecteur convainc mieux que n'importe quel avis d'inconnu : elle parle de lui.

Le bon enchaînement, une fois l'examen passé :
> **Ta note : {n}/31.**
> C'est exactement la grille du jour J.
> Les {x} points que tu as perdus se travaillent dans les leçons {liste}.
> *Ouvrir tout mon parcours · 24,99 €*

C'est le moment où le prix est le plus facile à dire, et le seul où l'élève sait vraiment ce qu'il achète.

---

## 5. Où poser chaque preuve

| Preuve | Emplacement | Pourquoi là |
|---|---|---|
| Avis élève n°1 | juste après la démonstration jouable | il vient de réussir, il veut savoir si ça marche pour de vrai |
| Caution métier | juste avant les offres | c'est ce qui rend le prix légitime |
| Garantie 3 jours | sous le bouton d'achat **et** dans le bloc des offres | deux fois vaut mieux qu'une |
| Note de l'examen blanc | dans l'app, à la fin de l'examen | la seule preuve qui parle de lui |
| Chiffres d'usage | nulle part tant qu'ils ne sont pas flatteurs | un chiffre tiède fait plus de mal que pas de chiffre |

---

## Ce qui reste à faire, dans l'ordre

1. Envoyer le message à 10 élèves actifs. En attendre 3 réponses utilisables.
2. Lancer la requête de chiffres et décider si on affiche.
3. Coller la caution métier (elle est prête, elle ne dépend de personne).
4. Brancher l'écran de fin d'examen blanc sur l'offre.
