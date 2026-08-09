# Prototype papier — dix scènes, une manche, trois moteurs

> Demandé par Rayan le 09/08/2026. Pas de code. On écrit la manche avant de la
> construire.
>
> Suite de [`BOUCLES_DE_DECISION_2026-08-09.md`](BOUCLES_DE_DECISION_2026-08-09.md).

---

## 0. Le barème, vérifié sur les sources officielles

Rayan avait raison : **le dépassement dangereux retire 3 points, pas 4.** Ma
première version en contenait deux erreurs. Voici le barème vérifié, et il n'y
a plus rien d'inventé dedans.

| Infraction | Points | Vérifié |
|---|---|---|
| Excès de moins de 20 km/h · chevauchement de ligne continue | **1** | ✅ |
| Excès de 20 à moins de 30 km/h | **2** | ✅ |
| **Dépassement dangereux** | **3** | ✅ *(j'avais écrit 4)* |
| Franchissement de ligne continue | **3** | ✅ |
| Non-respect des distances de sécurité | **3** | ✅ |
| Changement de direction sans avertissement | **3** | ✅ |
| Téléphone tenu en main · ceinture non attachée | **3** | ✅ |
| Excès de 30 à moins de 40 km/h | **3** | ✅ *(j'avais écrit 4)* |
| Feu rouge · stop non marqué · **refus de priorité** | **4** | ✅ |
| Sens interdit · excès de 40 à moins de 50 km/h | **4** | ✅ |
| 🔴 **Refus de priorité à un piéton** | **6** | ✅ depuis le 18/09/2018 |
| Excès de 50 km/h et plus · alcool · stupéfiants | **6** | ✅ |
| **Permis probatoire : on démarre à 6 points, pas 12** | | ✅ |

⭐⭐⭐ **La trouvaille : ne pas céder le passage à un piéton coûte 6 points,
autant que conduire ivre.** Presque aucun élève ne le sait. C'est passé de 4 à
6 en septembre 2018. **Cette seule information justifie une scène entière**, et
c'est le genre de chose qu'un élève raconte à ses copains le soir même.

---

## 1. Ce que le joueur FAIT vraiment

Rayan a raison : « 12 points » est l'enveloppe, pas le jeu. Voici le jeu.

### La chaîne du moniteur, rendue mécanique

> **IL REGARDE → IL IDENTIFIE → IL ANTICIPE → IL DÉCIDE → IL AGIT**

Chacun de ces cinq maillons devient une chose que le moteur MESURE :

| Maillon | Ce que le moteur mesure |
|---|---|
| **Il regarde** | les angles balayés, et à quel moment de l'approche |
| **Il identifie** | l'indice caché était-il dans son champ pendant qu'il balayait |
| **Il anticipe** | le délai entre le moment où l'indice devient visible et son geste |
| **Il décide** | ce qu'il fait |
| **Il agit** | quand, et avec quelle force |

### Trois gestes. Pas un de plus. Aucun bouton.

1. **Balayer** — le pouce glisse horizontalement, la tête tourne. Toujours
   disponible, jamais imposé, **toujours mesuré**.
2. **Freiner** — on maintient le pouce en bas. La durée fait l'intensité.
3. **Désigner** — on touche quelque chose dans la scène (le prioritaire, le
   danger). Une scène sur trois.

**Il n'y a pas de QCM. Il n'y a pas de question affichée.** La voiture avance
seule à vitesse normale. Le travail du joueur, ce sont ses yeux et son pied.
C'est exactement le travail que le moniteur observe.

### Le verdict n'est plus binaire : trois axes

|  | **A décidé juste** | **A décidé faux** |
|---|---|---|
| **A regardé** | ✅ **Parfait.** « Tu l'as vu et tu as géré. » | 🟠 « Tu l'as vu et tu es passé quand même. » |
| **N'a pas regardé** | 🟠 **« Tu es passé. Tu ne pouvais pas savoir. »** | 🔴 La conséquence, en 3D. |

Et un troisième axe par-dessus : **le moment.**
Bonne observation + bonne décision mais **trop tard** → 🟠 « Tu avais compris.
Tu n'as pas anticipé. »

⭐⭐⭐ **La case en bas à gauche est la raison d'être du produit.** C'est la
seule chose qu'aucune appli de code, aucun moniteur pressé et aucun examinateur
ne dit jamais à un élève : *tu as eu raison par hasard.*

### La loi d'écriture des scènes, celle qui décide de tout

> **Chaque scène contient au moins une information INVISIBLE depuis la position
> de départ, et DÉCOUVRABLE en regardant.**

Sans elle, regarder ne sert à rien, et le jeu retombe en QCM déguisé. Avec
elle, on est dans GeoGuessr : le monde contient la réponse.

---

## 2. Les dix scènes de la première manche

Ordre voulu : la scène 1 enseigne la règle du jeu sans un mot, la scène 3
assène la leçon la plus mémorable, et on alterne ensuite les registres.

---

### 🟣 Scène 1 — La rue tranquille · *on apprend le geste*

| | |
|---|---|
| **1. Ce que Yanis voit** | Une rue résidentielle étroite. Des voitures garées des deux côtés. Une intersection à 40 m, sans aucun panneau. |
| **2. Ce qui bouge** | Un chat traverse loin devant, à gauche. Une branche remue. **Rien de menaçant : c'est un appât pour donner envie de balayer.** |
| **3. Ce qui est caché** | **Rien. Absolument rien.** C'est le piège, et c'est délibéré. |
| **4. Où regarder** | À droite, dans la rue transversale. |
| **5. Les indices** | L'absence de panneau = priorité à droite. |
| **6. Interaction** | Balayer à droite. Éventuellement lever le pied. |
| **7. Ce que le moteur mesure** | A-t-il balayé au-delà de 30° à droite avant la ligne d'entrée. |
| **8. Bonne décision** | Ralentir un peu, regarder à droite, passer. |
| **9. S'il se trompe** | Impossible de se tromper : personne ne vient. |
| **10. 🟠 S'il réussit sans avoir observé** | Il passe à 50, rien n'arrive. Le jeu s'arrête une seconde : **« Personne ne venait. Mais tu ne pouvais pas le savoir. »** Aucun point perdu, c'est la première scène. |
| **11. Conséquence 3D** | On rembobine, on remontre la même approche, et **cette fois une voiture débouche.** Sans commentaire. |
| **12. Durée** | **6 s** — la plus longue de la manche, c'est celle qui enseigne la règle. |

> ⭐ En six secondes et sans un mot d'explication, Yanis a compris que ce jeu
> ne note pas ce qu'il fait mais ce qu'il a regardé.

---

### 🟣 Scène 2 — La camionnette qui masque l'intersection

| | |
|---|---|
| **1. Il voit** | Une rue. Une camionnette blanche garée à droite, juste avant une intersection. Elle bouche complètement la vue. |
| **2. Ce qui bouge** | Rien, sauf nous qui avançons. Le cadrage se referme. |
| **3. Ce qui est caché** | Une voiture arrive derrière la camionnette. |
| **4. Où regarder** | À droite, **sous** et **derrière** la camionnette. |
| **5. Les indices** | ⭐ **Une ombre qui glisse au sol sous la camionnette.** Un bout de roue qui dépasse. Le reflet dans la vitrine d'en face. |
| **6. Interaction** | Balayer à droite, puis freiner. |
| **7. Mesuré** | Balayage à droite · vitesse à la ligne d'entrée · moment du freinage. |
| **8. Bonne décision** | Ralentir fortement dès la camionnette, arriver au pas, la laisser passer. |
| **9. S'il se trompe** | Collision latérale. **−4 (refus de priorité).** |
| **10. 🟠 Réussite par hasard** | Il freine par prudence sans avoir regardé : **« Bien freiné. Tu ne savais pas pourquoi. »** Aucun point perdu, mais c'est noté au casier. |
| **11. Conséquence 3D** | Le choc au ralenti vu de trois quarts, puis rembobinage qui **surligne l'ombre au sol** qu'il n'a pas vue. |
| **12. Durée** | **5 s** |

---

### 🔴 Scène 3 — La dame au passage piéton · *la scène à 6 points*

| | |
|---|---|
| **1. Il voit** | Un passage piéton à 30 m. Une femme debout sur le trottoir de droite, face à la chaussée. |
| **2. Ce qui bouge** | Elle **avance d'un pas, puis s'arrête**. Elle tourne la tête vers nous. |
| **3. Ce qui est caché** | Rien de physique. Ce qui est caché, c'est **son intention**, et c'est bien plus subtil qu'un objet. |
| **4. Où regarder** | Les deux trottoirs, avant le passage. |
| **5. Les indices** | Son corps est tourné vers la route. Elle a avancé un pied. Elle nous regarde. La loi dit : *« manifestant clairement l'intention de traverser ».* |
| **6. Interaction** | Freiner. |
| **7. Mesuré** | A-t-il balayé les trottoirs · s'est-il arrêté · à quelle distance. |
| **8. Bonne décision** | S'arrêter avant le passage. Elle traverse. |
| **9. S'il se trompe** | Elle recule vivement. **−6 points.** Et un carton d'une ligne : **« Six points. Autant que l'alcool au volant. »** |
| **10. 🟠 Par hasard** | Il ralentit parce qu'il y a un ralentisseur, sans l'avoir vue : « Tu t'es arrêté. Pas pour elle. » |
| **11. Conséquence 3D** | Elle fait un bond en arrière, un klaxon, l'image se fige. Puis le compteur tombe de 12 à 6 en une seconde, chiffre par chiffre. |
| **12. Durée** | **5 s** |

> ⭐⭐⭐ C'est la scène dont Yanis parlera. Il ne savait pas que ça coûtait 6.
> Personne ne le sait.

---

### 🟣 Scène 4 — Le cycliste dans l'angle mort

| | |
|---|---|
| **1. Il voit** | Une intersection à droite. Le clignotant droit est déjà mis. La voie devant est libre. |
| **2. Ce qui bouge** | Rien devant. Tout est calme. |
| **3. Ce qui est caché** | Un cycliste remonte le long de la voiture, par la droite. Invisible sans tourner la tête au-delà du rétroviseur. |
| **4. Où regarder** | Rétroviseur droit, **puis au-delà** : l'angle mort. |
| **5. Les indices** | ⭐ Le **cliquetis d'un dérailleur** (le son est l'indice, pas l'image). Une ombre qui file le long de la portière. |
| **6. Interaction** | Balayer loin à droite, au-delà de 60°. |
| **7. Mesuré** | L'amplitude du balayage. Le rétroviseur seul **ne suffit pas** et le moteur fait la différence. |
| **8. Bonne décision** | Le voir, le laisser passer, tourner après. |
| **9. S'il se trompe** | On lui coupe la route. Le vélo tombe. |
| **10. 🟠 Par hasard** | Il tourne lentement par habitude, le cycliste freine : « Il t'a évité. Pas l'inverse. » |
| **11. Conséquence 3D** | Vue extérieure, le vélo au sol, au ralenti. Rembobinage : l'ombre le long de la portière, surlignée. |
| **12. Durée** | **5 s** |

---

### 🟠 Scène 5 — Le feu qui passe à l'orange · *le vrai dilemme*

| | |
|---|---|
| **1. Il voit** | Un feu **vert** à 60 m. On roule à 50. |
| **2. Ce qui bouge** | Le feu passe à l'orange pile au moment où l'on entre dans la zone où l'on peut encore s'arrêter, mais de justesse. |
| **3. Ce qui est caché** | ⭐ **Dans le rétroviseur intérieur : une voiture collée derrière.** |
| **4. Où regarder** | Le feu, **et** le rétroviseur. |
| **5. Les indices** | La distance restante. Les phares dans le rétroviseur, très proches. |
| **6. Interaction** | Freiner, ou ne rien faire. |
| **7. Mesuré** | La décision · a-t-il consulté le rétroviseur avant de freiner. |
| **8. Bonne décision** | ⚠️ **Il n'y en a pas une seule.** S'arrêter est correct ; s'arrêter brutalement sans avoir regardé derrière ne l'est pas. **C'est la scène du crédit partiel.** |
| **9. S'il se trompe** | Il passe au rouge franc : **−4**. Ou il freine sec sans regarder : la voiture de derrière le percute (**0 point**, il n'est pas en tort, mais la scène est ratée). |
| **10. 🟠 Par hasard** | Il freine sans avoir regardé et rien n'arrive : « Tu as bien fait. Tu ne savais pas ce qu'il y avait derrière. » |
| **11. Conséquence 3D** | Selon le cas : le carrefour traversé au rouge vu du ciel, ou le choc arrière. |
| **12. Durée** | **4 s** |

> ⭐⭐ La scène qui apprend que conduire n'est pas un QCM. Il y a des situations
> où toutes les réponses ont un coût, et où seule l'information qu'on a prise
> décide de la moins mauvaise.

---

### 🟣 Scène 6 — Le freinage devant · *l'indice est deux voitures plus loin*

| | |
|---|---|
| **1. Il voit** | On suit une berline grise, d'un peu trop près. Route droite, deux voies. |
| **2. Ce qui bouge** | ⭐ **Loin devant, par-dessus la berline, les feux stop d'un TROISIÈME véhicule s'allument.** |
| **3. Ce qui est caché** | La raison : un bus arrêté encore plus loin. |
| **4. Où regarder** | **Au-delà** de la voiture qu'on suit. Pas devant : loin. |
| **5. Les indices** | Les feux rouges lointains, visibles par la vitre arrière de la berline. |
| **6. Interaction** | Lever le pied **avant** que la berline ne freine. |
| **7. Mesuré** | Le délai entre l'allumage des feux lointains et le geste du joueur. **C'est la mesure la plus pure de l'anticipation de toute la manche.** |
| **8. Bonne décision** | Ralentir dès l'indice lointain. Quand la berline freine, on a déjà de la marge. |
| **9. S'il se trompe** | Freinage tardif, choc arrière. **−3 (distances de sécurité).** |
| **10. 🟠 Par hasard** | Il freine au dernier moment et s'arrête à dix centimètres : **« Tu t'en es sorti. Tu n'avais aucune marge. »** |
| **11. Conséquence 3D** | Le choc, puis un plan latéral qui montre les trois voitures et l'espace qu'il n'a pas laissé. |
| **12. Durée** | **4 s** |

---

### 🟣 Scène 7 — Le giratoire · *la bonne réponse est d'AVANCER*

| | |
|---|---|
| **1. Il voit** | Un giratoire. On arrive au cédez-le-passage. Une voiture est déjà dans l'anneau, sur notre gauche. |
| **2. Ce qui bouge** | Elle approche de notre entrée. |
| **3. Ce qui est caché** | ⭐ **Elle a mis son clignotant droit : elle sort au niveau de notre branche.** L'indice fait dix pixels. |
| **4. Où regarder** | À gauche, et sur l'avant du véhicule. |
| **5. Les indices** | Le clignotant orange. Elle se déporte légèrement vers l'extérieur. Elle ralentit. |
| **6. Interaction** | S'engager, ou attendre. |
| **7. Mesuré** | Balayage à gauche · le clignotant était-il dans son champ · a-t-il avancé. |
| **8. Bonne décision** | **S'engager.** Elle sort, la voie se libère. |
| **9. S'il se trompe** | Il attend pour rien. Aucun point perdu, mais la scène est ratée et la file klaxonne derrière. |
| **10. 🟠 Par hasard** | Il s'engage sans regarder à gauche et ça passe : « Elle sortait. Tu n'en savais rien. » **−1.** |
| **11. Conséquence 3D** | Vue du ciel qui montre les deux trajectoires et le clignotant, agrandi. |
| **12. Durée** | **5 s** |

> ⭐⭐ Scène indispensable : **elle casse la triche du joueur.** Sans elle, la
> stratégie gagnante est « dans le doute, je freine », et on entraînerait des
> conducteurs hésitants, ce qui est un défaut d'examen aussi grave que la
> précipitation.

---

### 🟣 Scène 8 — La sortie de stationnement · *avoir raison ne protège de rien*

| | |
|---|---|
| **1. Il voit** | Une rue bordée d'une longue file de voitures garées à droite. |
| **2. Ce qui bouge** | Rien d'évident au premier coup d'œil. |
| **3. Ce qui est caché** | ⭐ Une voiture garée a ses **feux de recul blancs allumés**, ses **roues avant braquées**, et une silhouette au volant. |
| **4. Où regarder** | La file de voitures garées, en balayant vers la droite. |
| **5. Les indices** | Les deux points blancs, les roues de travers, un panache d'échappement. |
| **6. Interaction** | Lever le pied et se déporter légèrement à gauche. |
| **7. Mesuré** | Le repérage avant qu'elle ne bouge. |
| **8. Bonne décision** | Ralentir et s'écarter avant qu'elle ne sorte. |
| **9. S'il se trompe** | Elle sort, choc. ⚠️ **Zéro point perdu : c'est elle qui est en tort.** Mais la scène est ratée, et le carton dit : **« Tu avais la priorité. Tu es quand même dans le décor. »** |
| **10. 🟠 Par hasard** | Il se déporte parce qu'un nid-de-poule le gêne : « Tu es passé à côté. Sans le voir. » |
| **11. Conséquence 3D** | Le choc, puis rembobinage sur les feux de recul, agrandis, six secondes plus tôt. |
| **12. Durée** | **5 s** |

> ⭐⭐ La seule scène où l'on ne perd aucun point et où l'on a pourtant échoué.
> Elle enseigne ce qu'aucune fiche n'enseigne : **le code protège les torts, pas
> les carrosseries.**

---

### 🔴 Scène 9 — Le ballon devant le bus

| | |
|---|---|
| **1. Il voit** | Un bus scolaire arrêté à droite, warnings allumés. La voie de gauche est libre pour le contourner. |
| **2. Ce qui bouge** | Les warnings clignotent. |
| **3. Ce qui est caché** | ⭐ **Un ballon roule sur la chaussée devant le bus.** Et **deux jambes** apparaissent sous le châssis. |
| **4. Où regarder** | **Sous** le bus, et devant lui. |
| **5. Les indices** | Le ballon, les jambes, les warnings qui disent « des enfants descendent ». |
| **6. Interaction** | Freiner franchement. |
| **7. Mesuré** | Le regard sous le bus · le moment du freinage par rapport à l'apparition du ballon. |
| **8. Bonne décision** | S'arrêter. Attendre. |
| **9. S'il se trompe** | ⚠️ **On ne montre AUCUN impact.** La scène se fige, l'écran blanchit une demi-seconde, **le son se coupe net.** Puis le rembobinage montre le ballon. Le silence fait plus que le choc. |
| **10. 🟠 Par hasard** | Il freine parce que le bus le gêne, sans avoir vu le ballon : **« Tu t'es arrêté. Tu n'avais pas vu le ballon. »** −1. |
| **11. Conséquence 3D** | Le rembobinage, le ballon surligné, et rien d'autre. |
| **12. Durée** | **5 s** |

> ⚠️ **Règle éthique, non négociable** : jamais de corps heurté à l'écran,
> jamais de sang, jamais de cri. On coupe avant. Un blanc et un silence
> marquent plus fort qu'une image, et ne traumatisent personne.

---

### 🟣 Scène 10 — Le changement de voie · *juger une vitesse, pas une distance*

| | |
|---|---|
| **1. Il voit** | Deux voies. On est derrière un camion lent, voie de droite. Clignotant gauche mis. |
| **2. Ce qui bouge** | Une voiture arrive dans la voie de gauche, **loin** derrière. |
| **3. Ce qui est caché** | ⭐ **Sa vitesse.** Elle est loin, mais elle grossit très vite. L'information n'est pas sa position, c'est son taux de rapprochement. |
| **4. Où regarder** | Rétroviseur gauche, puis angle mort gauche. |
| **5. Les indices** | Elle double de taille en une seconde. Ses phares. |
| **6. Interaction** | Balayer à gauche, puis déboîter ou rester. |
| **7. Mesuré** | Balayage · durée de l'observation (un coup d'œil de 0,2 s ne suffit pas à juger une vitesse) · décision. |
| **8. Bonne décision** | **Attendre.** La laisser passer, déboîter après. |
| **9. S'il se trompe** | Elle freine en catastrophe, klaxon, écart. **−3 (dépassement dangereux).** |
| **10. 🟠 Par hasard** | Il reste derrière parce qu'il n'ose pas : « Bonne décision. Prise sans regarder. » |
| **11. Conséquence 3D** | Plan aérien qui montre les deux trajectoires qui se croisent, au ralenti. |
| **12. Durée** | **5 s** |

---

## 3. La minute entière, téléphone en main

Yanis, 18 ans, première manche de sa vie. Il n'a rien lu, on ne lui a rien
expliqué. **12 points.**

```
00:00   Il appuie sur le seul bouton de l'écran.
        Pas de menu. La rue est déjà là. En haut à droite : 12.

00:01   SCÈNE 1 · la rue tranquille
        Il ne fait rien. La voiture avance seule. Il regarde le chat.
00:06   Il franchit l'intersection à 50. Rien ne se passe.
        L'image se fige une seconde.
        « Personne ne venait. Mais tu ne pouvais pas le savoir. »
        Rembobinage : la même rue, et cette fois une voiture débouche.
        ➜ 12 points. Il comprend la règle du jeu. Personne ne la lui a dite.

00:09   SCÈNE 2 · la camionnette
        Cette fois il glisse le pouce à droite. La tête tourne.
        Sous la camionnette, une ombre bouge.
00:12   Il maintient le pouce en bas. La voiture ralentit.
        Une berline débouche et passe devant lui.
        ✅ « Tu l'as vu. »
        ➜ 12 points · 1 situation gérée

00:14   SCÈNE 3 · le passage piéton
        Une femme sur le trottoir droit. Il ne balaie pas : il regarde la route.
00:18   Il passe devant elle à 45. Elle fait un bond en arrière. Klaxon.
        Le compteur tombe : 12 · 11 · 10 · 9 · 8 · 7 · 6.
        🔴 « Six points. Autant que l'alcool au volant. »
        ➜ 6 points

00:21   SCÈNE 4 · le cycliste
        Il a compris. Avant même de voir quoi que ce soit, il balaie à droite.
        Loin. Un cycliste est là, le long de sa portière.
00:25   Il attend. Le vélo passe. Il tourne.
        ✅ « Tu l'as vu. »
        ➜ 6 points · 2 situations

00:27   SCÈNE 5 · le feu orange
        Le feu passe à l'orange. Il hésite. Il accélère.
00:30   Il franchit au rouge. −4.
        Vue du ciel : sa voiture traverse le carrefour, seule, au rouge.
        ➜ 2 points

00:32   SCÈNE 6 · le freinage devant
        Il suit une berline. Loin devant, des feux stop s'allument.
        Il les voit. Il lève le pied tout de suite.
        Il appuie sur son compteur : « JE LE SENS ».
00:36   La berline freine. Il avait déjà ralenti.
        ✅ Pari gagné. +1
        ➜ 3 points · 3 situations

00:37   SCÈNE 7 · le giratoire
        Il s'engage sans regarder à gauche. Ça passe : elle sortait.
00:41   🟠 « Elle sortait. Tu n'en savais rien. » −1
        ➜ 2 points

00:43   SCÈNE 8 · la sortie de stationnement
        Il balaie la file de voitures garées. Deux points blancs.
        Il lève le pied et se décale.
00:47   La voiture sort. Il passe à côté.
        ✅ « Tu l'as vu avant qu'elle bouge. »
        ➜ 2 points · 4 situations

00:48   SCÈNE 9 · le bus scolaire
        Il freine parce que le bus le gêne. Il ne balaie pas dessous.
00:52   🟠 « Tu t'es arrêté. Tu n'avais pas vu le ballon. » −1
        Rembobinage : le ballon, surligné, roule devant le bus.
        ➜ 1 point

00:54   SCÈNE 10 · le changement de voie
        Camion lent devant. Il jette un œil à gauche, une demi-seconde.
        Une voiture, loin. Il déboîte.
00:58   Elle freine en catastrophe. Klaxon. −3 → 0.
        🔴 « Elle était loin. Elle allait vite. Un coup d'œil ne suffit pas
        à juger une vitesse. »

00:59   FIN DE MANCHE
        ┌──────────────────────────────┐
        │        4 / 10                │
        │  situations gérées proprement│
        │                              │
        │  6 · 4 · 1 · 1 · 3           │
        │                              │
        │  Ce qui t'a coûté le plus    │
        │  cher : ne pas regarder      │
        │  avant de t'engager.         │
        │                              │
        │  Demain, avant CHAQUE        │
        │  intersection : tourne la    │
        │  tête. Je te demanderai.     │
        │                              │
        │        [  ENCORE  ]          │
        └──────────────────────────────┘
```

**Ce qui vient de se passer, du point de vue de Yanis :** il a joué une minute,
il n'a rien lu, personne ne lui a rien expliqué, et il a appris quatre choses
qu'il ne savait pas. Il a surtout appris **qu'il ne regarde pas**. Aucun
moniteur n'a le temps de le lui démontrer dix fois en une minute.

---

## 4. Les trois moteurs

### A — Arcade
3 secondes par scène. Pas de rejeu : un éclair, le nombre qui tombe, la
suivante. **20 scènes en 60 secondes.**
- ✅ Rythme de Tinder. Potentiel addictif maximal. Très facile à équilibrer.
- ❌ **Aucun temps pour comprendre.** Sans le rejeu, l'erreur n'enseigne rien,
  et on retombe exactement dans le piège de Duolingo : le compteur monte, la
  compétence non. Et 3 secondes ne suffisent pas à balayer une scène.
- Apprentissage **2/5** · Plaisir **5/5** · Rétention à un mois **2/5**

### B — Équilibrée ⭐
5 secondes par scène, rejeu de 2,5 s **uniquement sur erreur**, une phrase.
**10 à 12 scènes en 60 secondes.** C'est ce qui est simulé ci-dessus.
- ✅ Assez lent pour regarder, assez rapide pour ne jamais s'ennuyer. L'erreur
  enseigne. Le rythme tient.
- ❌ Demande des scènes bien écrites, sinon les 5 secondes se voient.
- Apprentissage **4/5** · Plaisir **5/5** · Rétention **4/5**

### C — Pédagogique
8 à 10 secondes par scène, rejeu **systématique** même en cas de réussite, une
explication complète. **6 scènes en 60 secondes**, plus un bilan détaillé.
- ✅ Le meilleur apprentissage par scène. Parfait juste après une leçon, quand
  l'élève veut comprendre.
- ❌ **On sent le cours.** Le rejeu systématique tue le rythme, et Karim ferme
  au troisième. Louis ne lancera jamais une session qui « explique ».
- Apprentissage **5/5** · Plaisir **2/5** · Rétention **4/5**

### Celui que je construirais

> **B, et B seul. C n'est pas un mode, c'est un bouton.**

À la fin d'une manche, chaque scène ratée est cliquable : on la revoit au
ralenti, avec l'explication complète. **C devient une option qu'on prend quand
on la veut, et pas une contrainte imposée à tout le monde.** Camille cliquera
sur les cinq, Karim sur aucune, et les deux auront joué le même jeu.

A ne se construit pas. Si le rythme doit accélérer, on réduit la durée des
scènes dans B au fil des jours : un joueur qui progresse voit les scènes
raccourcir, et c'est une montée en difficulté invisible.

---

## 5. Le test décisif : et si on enlève les 12 points ?

C'est la bonne question, et je l'ai posée à chaque scène en les écrivant.

**Ce qui survit sans le compteur :**
- ✅ **Chercher et trouver.** L'ombre sous la camionnette, le ballon devant le
  bus, le clignotant du giratoire. Trouver est un plaisir en soi, GeoGuessr
  vit là-dessus depuis dix ans, et personne n'y joue pour un score.
- ✅ **« Tu es passé, mais tu ne pouvais pas le savoir. »** Cette phrase est
  surprenante, elle est vraie, et elle pique. Elle n'a besoin d'aucun point.
- ✅ **Voir ce qui serait arrivé.** La curiosité suffit.

**Ce qui meurt sans le compteur :**
- ❌ La manche n'a plus de fin. Donc plus de moment où l'on se dit « encore ».
  Sans fin, pas de recommencement.
- ❌ La gravité des fautes n'a plus d'échelle : tout devient équivalent.

> ### Réponse : oui, on tient quelque chose.
> **Le plaisir vient de regarder et de découvrir, pas du compteur.** Les
> 12 points ne créent pas l'intérêt, ils créent la FIN, et une fin est ce qui
> déclenche « Encore ». C'est bien une enveloppe, exactement comme tu le
> disais, et l'enveloppe est vide sans le contenu.

**Mais il y a une condition, et c'est le vrai risque du projet.**

Le jeu ne tient que si **chaque scène cache vraiment quelque chose qui se
mérite en regardant**. Dix scènes bien écrites valent mille scènes bâclées.
Le jour où l'on écrit une scène dont le danger est visible d'emblée, ce jour-là
il ne reste qu'un QCM avec un compteur, et le compteur devient tout ce qu'il y
a. **Le risque du projet n'est pas technique, il est éditorial.**

C'est aussi la bonne nouvelle : écrire une scène coûte une heure, pas une
semaine, et **c'est un travail de moniteur, pas de développeur.**

---

## 6. Ce que ça change pour le moteur existant

Rien à jeter, et beaucoup à débrancher.

| Ce qu'on a | Nouveau rôle |
|---|---|
| Monde 3D, modèles, lumière, image, son | **Le décor des scènes.** Inchangé. |
| Mesure du regard (`rig.regardDroite`) | ⭐ **Devient le cœur du jeu**, plus un détail. |
| Zones, vitesse d'entrée, écart, arrêt | **Deviennent les capteurs de la chaîne**. |
| Simulateur de véhicule et de trafic | **Calcule ce qui SERAIT arrivé.** |
| Plan de cinéma | **Le rejeu de conséquence.** |
| Pédales, manche, vue extérieure | ❌ **Débranchés.** |
| Fichier de scénario | Élargi : zones à observer, indices, dangers cachés, moment juste. |

**À inventer, et c'est peu :** le surlignage d'un indice dans le rembobinage,
le verdict à trois axes, le casier, et la coque de manche.

---

## Sources officielles consultées

- [Permis de conduire : barème des points retirés par infraction — Service-Public](https://www.service-public.gouv.fr/particuliers/vosdroits/F31551)
- [Barème des retraits de point — Sécurité Routière](https://www.securite-routiere.gouv.fr/le-permis-points/infractions-et-retrait-de-points/bareme-des-retraits-de-point)
- [Décret n° 2018-795 du 17 septembre 2018 relatif à la sécurité routière — Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037407389) *(priorité piéton portée à 6 points)*
- [Article R415-11 du code de la route — Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037411323) *(céder le passage au piéton qui manifeste l'intention de traverser)*
- [Article R413-14 du code de la route — Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048533039) *(tranches d'excès de vitesse)*
