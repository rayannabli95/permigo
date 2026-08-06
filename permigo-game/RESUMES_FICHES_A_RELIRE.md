# « En 10 secondes » — les 31 résumés à relire

**Pour Rayan.** Tu es moniteur, c'est toi qui valides la justesse pédagogique.
Ce fichier existe pour que tu puisses tout relire d'une traite, sans ouvrir 31 écrans.

## Ce que c'est

Un bloc de 3 lignes posé en tête de chaque fiche de révision, sous l'accroche
« Aujourd'hui ». C'est la réponse directe à « les textes sont trop denses, on a
la flemme » : l'élève qui n'a que 30 secondes avant sa leçon lit ça et repart
avec le principal.

## Comment ils ont été écrits

**À la main, fiche par fiche.** Rien n'est généré automatiquement, et c'est
volontaire : un résumé ne se déduit pas du texte sans le paraphraser, et
paraphraser du contenu pédagogique sur une app qui prépare au permis, c'est
inventer des règles de conduite.

Les règles que je me suis données :

- **Aucune règle inventée.** Chaque ligne reformule un geste réellement présent
  dans la fiche. Quand la matière manquait, je n'ai pas comblé le trou.
- **Toute la fiche est couverte**, pas seulement sa première section. Sur C2f
  par exemple, les trois lignes couvrent « Aux intersections », « Priorité à
  droite » et « Au giratoire ».
- 3 lignes, une idée par ligne, 8 à 12 mots, à la première personne de l'élève.
- Zéro tiret séparateur, zéro virgule, énumération au point médian, zéro
  écriture inclusive.
- **Rien qui soit faux en boîte automatique.** Quand la fiche a une
  spécificité `bva`, je suis monté en généralité plutôt que d'écrire un geste
  qui ne s'applique pas.

## Où c'est rangé

Champ `resume10s` dans `src/data/fiches/monde-1.json` à `monde-4.json`.
C'est un **ajout** de données : aucun texte de fiche existant n'a été modifié.
Affichage dans `renderFicheDeck()` (`src/pages/eleve/revision-conduite.js`).

## Anglais et arabe

**Le résumé ne s'affiche qu'en français.** Le reste de la fiche a des
traductions relues (`fiches-i18n`) ; ce résumé n'en a pas. Le traduire à la
volée reviendrait à livrer une règle de conduite approximative dans une langue
que personne n'a relue. En anglais et en arabe l'élève voit la fiche exactement
comme avant, méthode complète comprise. Le jour où tu veux les traductions, il
faut les faire relire, pas les générer.

---

## Les 31 résumés

Les fiches marquées ⚠️ sont celles où j'ai eu un doute ou dû monter en
généralité. Le détail est juste après le tableau.

### Monde 1 · Maniement du véhicule

| Fiche | Titre | En 10 secondes |
|---|---|---|
| **C1a** | Prendre en main le poste de conduite | Je fais le tour de la voiture avant de monter.<br>Je repère les commodos et les commandes au pied.<br>Je mets le contact et je surveille les témoins. |
| **C1b** | Régler son poste de conduite | Je règle la distance du siège puis sa hauteur.<br>Je cale le dossier · l'appuie-tête · le volant.<br>Je règle mes trois rétroviseurs puis je boucle la ceinture. |
| **C1c** | Tenir le volant et tenir sa trajectoire | Je place mes mains à neuf heures quinze.<br>Je regarde loin devant et ma trajectoire suit.<br>Je tourne sans croiser les mains à allure normale. |
| **C1d** ⚠️ | Démarrer et s'arrêter en douceur | Je prépare la voiture à l'arrêt avant de mettre le contact.<br>Je fais avancer la voiture tout en douceur.<br>Je lâche l'accélérateur tôt puis je freine progressivement. |
| **C1e** | Doser l'accélérateur et le frein | J'accélère progressivement avec la pointe du pied droit.<br>Je regarde loin pour voir venir les ralentissements.<br>Je lâche l'accélérateur puis je freine en deux temps. |
| **C1f** ⚠️ | Changer de vitesse au bon moment | Je change de rapport quand j'entends le moteur monter.<br>Je tiens le levier paume posée sans quitter la route des yeux.<br>Je rétrograde avant le virage ou le freinage jamais pendant. |
| **C1g** | Les vérifications avant de rouler (tour de voiture) | Je contrôle mes pneus · mes feux · mes vitres.<br>Je sais montrer où sont les niveaux sous le capot.<br>À l'examen je montre l'élément au lieu de réciter. |
| **C1h** ⚠️ | Réussir les manœuvres-test (créneau, demi-tour, stationnement) | Je mets le clignotant et je contrôle tout autour.<br>J'avance le plus lentement possible je ne suis pas chronométré.<br>Je garde mes repères et je corrige doucement sans forcer. |
| **C1i** | Enchaîner les manœuvres en autonomie | J'analyse la place et je choisis moi-même la manœuvre.<br>Je sécurise avant de bouger je ne suis jamais prioritaire.<br>Si ça rate je me remets droit et je recommence. |

### Monde 2 · Circulation

| Fiche | Titre | En 10 secondes |
|---|---|---|
| **C2a** | Lire la route avec tes yeux | Je place mon regard loin devant jamais sur le capot.<br>Je garde l'œil mobile et je tourne vraiment la tête.<br>Je reviens dans mes rétroviseurs toutes les quelques secondes. |
| **C2b** | Régler ta vitesse sur l'environnement | Je lis la signalisation le plus loin possible.<br>Je lève le pied avant la zone pas dedans.<br>Je garde deux secondes d'écart et quatre sous la pluie. |
| **C2c** | Te placer au bon endroit sur la route | Je roule au milieu de ma voie sans zigzaguer.<br>Je laisse une portière d'écart avec les voitures garées.<br>Je me fie à mes repères pas à mon impression. |
| **C2d** | Négocier un virage | Je ralentis avant le virage sur la portion droite.<br>Mon regard part vers la sortie et la trajectoire suit.<br>Je reste sur ma voie puis je réaccélère en sortie. |
| **C2e** ⚠️ | Croiser et dépasser | Je double seulement si c'est autorisé et que je vois loin.<br>Je contrôle · je signale · je vérifie l'angle mort puis je déboîte.<br>Je reviens à droite quand je le vois entier dans mon rétro. |
| **C2f** | Intersections et ronds-points | Je repère l'intersection tôt et je ralentis pour bien voir.<br>Sans panneau je laisse passer tout ce qui vient de droite.<br>Au giratoire je cède le passage puis clignotant droit en sortant. |
| **C2g** ⚠️ | Communiquer avec les autres usagers | Je mets mon clignotant bien avant de changer de direction.<br>Je me place dès que possible une fois mon intention signalée.<br>Je croise le regard des piétons avant de passer. |
| **C2h** | Conduire seul en ville (synthèse) | Je visualise mon itinéraire avant de tourner la clé.<br>J'enchaîne mes contrôles dans l'ordre sans jamais bâcler.<br>Sur un imprévu je reste calme et je reprends plus loin. |

### Monde 3 · Conditions difficiles

| Fiche | Titre | En 10 secondes |
|---|---|---|
| **C3a** ⚠️ | Bien voir et bien être vu la nuit | J'allume mes feux de croisement dès qu'il fait nuit.<br>Je repasse en croisement dès qu'une lueur apparaît en face.<br>Je vise le bord droit et je n'accélère jamais dans le doute. |
| **C3b** | Adapter ta conduite à la pluie, la neige, le brouillard | Je lance essuie-glaces et désembuage dès les premières gouttes.<br>Je double ma distance et je freine doux et tôt.<br>Sous la pluie le feu de brouillard arrière reste interdit. |
| **C3c** | Garder le contrôle quand ça glisse | Je repère les zones glissantes bien avant d'y être.<br>Je fais tout en souplesse sans aucun geste sec.<br>Si l'arrière glisse je lève le pied et je regarde loin. |
| **C3d** | Freinage d'urgence & adhérence (l'ABS) | Face à un obstacle je freine à fond immédiatement.<br>Je garde le pied enfoncé même si la pédale vibre.<br>Je regarde mon échappatoire pas l'obstacle et je peux diriger. |
| **C3e** | Voie rapide & autoroute : entrer, rouler, sortir | J'accélère sur toute la bande pour entrer à leur vitesse.<br>Je reste à droite et je dépasse franchement sans traîner.<br>Je signale ma sortie tôt et je ralentis seulement une fois sorti. |
| **C3f** | Tunnels, ponts & zones spécifiques | J'allume mes feux de croisement avant d'entrer dans un tunnel.<br>Je repère la sortie de secours et je garde mes distances.<br>Sur un pont je tiens fermement le volant contre le vent. |
| **C3g** ⚠️ | Ville dense : partager la route avec piétons, vélos et bus | En ville dense je lève le pied c'est ma marge.<br>Je balaye les trottoirs et ce qui se cache derrière un bus.<br>Je contrôle mon angle mort avant chaque manœuvre pour les vélos. |

### Monde 4 · Conduite autonome

| Fiche | Titre | En 10 secondes |
|---|---|---|
| **C4a** | Préparer son trajet avant de tourner la clé | Je regarde mon itinéraire en entier avant de partir.<br>Je note deux ou trois repères visuels et les zones difficiles.<br>Je règle GPS · téléphone · siège · rétros avant de démarrer. |
| **C4b** | Suivre un itinéraire sans lâcher la route des yeux | Je programme mon GPS à l'arrêt et j'écoute sa voix.<br>Je lis les panneaux de loin et je me place tôt.<br>En cas de doute la route gagne toujours sur l'écran. |
| **C4c** ⚠️ | Conduire souple pour brûler moins de carburant (éco-conduite) | Je démarre en douceur sans coup d'accélérateur.<br>Je lève le pied tôt et je laisse le frein moteur agir.<br>Je garde une vitesse stable c'est là que j'économise. |
| **C4d** | Anticiper le danger et rester calme au volant | Je regarde loin devant à quinze ou vingt secondes.<br>J'imagine le pire raisonnable pour être prêt avant qu'il arrive.<br>Je garde mon calme et je ne réponds jamais à l'agressivité. |
| **C4e** | Partager la route avec les plus fragiles | Je repère tôt piétons · cyclistes · trottinettes · deux-roues.<br>Je laisse un mètre au cycliste et un mètre cinquante hors agglomération.<br>Le piéton qui attend de traverser est déjà prioritaire. |
| **C4f** | Aborder l'examen pratique sans paniquer | J'installe mon poste de conduite exactement comme à l'entraînement.<br>Les trois questions de vérification sont trois points à prendre.<br>Après une petite erreur je continue calmement sans me figer. |
| **C4g** ⚠️ | Bien démarrer en jeune permis (période probatoire) | Je colle mon disque A à l'arrière dès le permis.<br>Je respecte les vitesses réduites du permis probatoire.<br>Zéro alcool et je soigne mes six points de départ. |

---

## Mes doutes, en clair

Un doute signalé vaut mieux qu'une phrase fausse et sûre d'elle. Voici les neuf
fiches sur lesquelles j'ai tranché sans être certain.

### Les deux qui butent sur la boîte automatique

**C1d · Démarrer et s'arrêter en douceur.** Le cœur de cette fiche en boîte
manuelle, c'est la zone de patinage et le fait de débrayer juste avant l'arrêt.
Ces deux gestes n'existent pas en automatique, et la fiche a un champ `bva` qui
le dit. J'ai donc écrit un résumé volontairement général (« je fais avancer la
voiture tout en douceur ») qui reste vrai dans les deux cas. Il est plus pauvre
que ce que tu dirais en leçon à un élève en manuelle. À toi de voir si tu
préfères deux variantes.

**C1f · Changer de vitesse au bon moment.** Résumé écrit à 100 % pour la boîte
manuelle, parce que la fiche entière est manuelle. Un élève en automatique ne le
voit pas du tout : son champ `bva` dit littéralement que la fiche ne le concerne
pas, et l'app le lui annonce désormais en tête de page. Question ouverte : tu
veux qu'on lui écrive trois lignes à lui, tirées du texte `bva` existant ?

### Celles où j'ai dû laisser un geste de côté

Trois lignes ne suffisent pas toujours à couvrir une fiche riche. J'ai gardé les
gestes structurants et laissé les autres dans la méthode complète, juste en
dessous.

**C2e · Croiser et dépasser.** Les trois lignes couvrent le dépassement
(décider, contrôler, se rabattre). Le geste « croiser sur route étroite »
(ralentir, serrer à droite) n'y est pas. C'est un geste sur six, mais c'est
quand même la moitié du titre de la fiche.

**C2g · Communiquer avec les autres usagers.** J'ai gardé clignotant tôt,
placement, contact visuel. Couper le clignotant et l'usage du klaxon ne sont pas
dans le résumé.

**C3a · Bien voir et bien être vu la nuit.** J'ai gardé les feux et le regard.
Toute la section « Vigilance de nuit » côté fatigue (pause toutes les 2 h, on
s'arrête dès le premier signe) n'est pas dans le résumé. Si tu juges que la
fatigue prime, dis-le et j'échange une ligne.

**C3g · Ville dense.** J'ai gardé l'allure, le balayage du regard et l'angle
mort. Le passage piéton et le couloir de bus ne sont pas dans le résumé.

**C1h · Réussir les manœuvres-test.** C'est la fiche la plus grosse : 18 gestes
et quatre sections (les 6 familles, les règles communes, le créneau, le
bataille/épi). Les trois lignes sont donc très générales (sécuriser, aller
lentement, garder ses repères). Aucun repère chiffré de manœuvre n'y est. Je
n'ai pas trouvé mieux sans écrire un résumé qui ne vaudrait que pour le créneau.

### Deux arbitrages de formulation

**C4c · Éco-conduite.** J'ai écrit « je démarre en douceur sans coup
d'accélérateur » alors que la fiche met en avant « passe les rapports tôt », qui
est le levier n°1 de l'éco-conduite. Raison : cette fiche n'a **pas** de champ
`bva`, et « passe tes rapports tôt » est faux pour un élève en automatique. J'ai
préféré une ligne vraie pour tout le monde à une ligne fausse pour la moitié.
Si tu veux le vrai levier dans le résumé, il faut d'abord ajouter une
spécificité boîte auto à cette fiche.

**C4g · Jeune permis.** Deux raccourcis assumés. J'ai écrit « je colle mon
disque A dès le permis » et non « pendant trois ans », parce que c'est deux ans
en conduite accompagnée. Et j'ai écrit « je respecte les vitesses réduites du
permis probatoire » sans citer 110 / 100 / 80 : les trois chiffres ne tiennent
pas sur une ligne courte sans virgule. C'est moins concret, dis-moi si tu
préfères qu'on sacrifie une autre ligne pour les chiffres.

---

## Un point séparé, que tu dois trancher toi

Sept fiches parlent de gestes de boîte manuelle (rétrograder, débrayer, passer
la 2e) **sans avoir de champ `bva`** qui dise quoi faire en automatique :

`C2d` · `C2e` · `C2f` · `C3d` · `C3e` · `C3g` · `C4c`

Exemples : C2f dit « ralentis et rétrograde, souvent 2e » à l'approche d'un
giratoire, C3e dit « bande courte, tu restes en 3e », C3d dit « puis tu
débrayes » pendant le freinage d'urgence.

Je n'ai rien écrit pour combler ce trou : ce serait inventer une règle de
conduite. Leurs résumés « En 10 secondes » sont, eux, rédigés pour rester vrais
dans les deux boîtes. Mais le corps de ces fiches, lui, continue de parler
manuel à un élève en automatique. C'est à toi de dicter la version automatique
de ces gestes, on l'ajoutera dans le champ `bva`.

---

# Deuxième passe · la version boîte automatique des 7 fiches

Tu as tranché : on écrit la version auto des sept fiches qui n'en avaient pas, en
se renseignant sur le web plutôt que de mémoire. C'est fait. Chaque version est
justifiée par une source, avec son lien, pour que tu puisses vérifier sans
refaire la recherche.

**Aucun texte manuel n'a été modifié.** Les sept fiches avaient un champ `bva`
à `null` : il est désormais rempli. Ce texte s'affiche en tête de fiche pour un
élève en boîte automatique, et reste invisible pour les autres.

## Ce que la recherche a établi

Cinq points que je n'ai pas déduits mais vérifiés, chacun sur deux sources au
moins.

**1. En boîte automatique, le freinage d'urgence n'a plus d'ordre à retenir.**
Le geste ABS ne change pas : « pour que l'ABS soit efficace, il faut "écraser"
la pédale de frein, ce qui permet de conserver la trajectoire du véhicule », et
pomper la pédale « annule le bénéfice de l'ABS et accroît fortement la distance
de freinage »
([Sécurité routière de A à Z](https://www.securite-routiere-az.fr/a/abs/)).
Ce qui disparaît, c'est l'embrayage : il n'y a pas de pédale à enfoncer et le
moteur ne cale pas, la question « ne se pose pas » avec une boîte automatique
([Caradisiac](https://www.caradisiac.com/commentaires/le-freinage-d-urgence-peut-il-tuer-la-boite-manuelle-190208.htm)).
C'est cohérent avec ce que dit déjà notre propre fiche C1d : « Aucun risque de
caler. »

**2. Le vrai danger en boîte auto, c'est le pied gauche.** Le Permis Libre :
« Vous pouvez vouloir débrayer malgré vous, alors que la seule pédale
disponible est celle du frein ! », et la règle « Boite auto = pied gauche au
repos »
([Le Permis Libre](https://www.lepermislibre.fr/permis-conduire/erreurs-de-conduite-a-eviter-avec-boite-auto)).
Ornikar dit la même chose et va plus loin : le freinage devient
involontairement brutal si le conducteur appuie sur le frein avec la force
qu'il mettrait dans un embrayage
([Ornikar](https://www.ornikar.com/permis/conseils-conduite/fondamentaux/specificites-boite-automatique)).
C'est ce qui m'a fait mettre l'avertissement pied gauche dans C3d, la fiche du
freinage d'urgence : c'est là que le réflexe de panique frappe.

**3. Le kickdown est la réponse auto à « rétrograde pour avoir de la reprise ».**
Manuel constructeur : « Lorsque vous appuyez à fond sur la pédale
d'accélérateur, une fois la position dite de pleine accélération passée, le
rapport inférieur est automatiquement engagé », et « la fonction Kickdown peut
être utilisée lorsqu'une accélération maximale est nécessaire, lors d'un
dépassement par exemple »
([manuel Polestar](https://www.polestar.com/fr-ch/manual/polestar-1/2021/article/5074ba068a3e7cdbc0a801517d3b838c),
même texte dans le
[manuel Volvo XC40](https://www.volvocars.com/fr/support/manuals/xc40/2022w22/demarrage-et-conduite/boite-de-vitesses/fonction-kickdown)).
C'est ce qui alimente les versions auto de C2e (dépassement) et C3e
(insertion sur autoroute).

**4. En D, la boîte choisit le rapport, et la voiture avance au ralenti.**
« C'est la position utilisée pour tous les trajets quotidiens. Une fois le
levier en D, le véhicule avance dès que le conducteur relâche le frein »
([Ornikar, cours code](https://www.ornikar.com/code/cours/mecanique-vehicule/boite-vitesses/lettres-automatiques)).
C'est ce qui remplace « reviens en 2e » et « rétrograde souvent en 2e » dans
C2f, et « les ralentisseurs en 2e » dans C3g.

**5. L'éco-conduite en auto se joue sur la pression du pied.** Une pression
douce fait monter les rapports tôt ; « appuyer très fort sur l'accélérateur
sera considéré par votre programme comme une volonté d'aller très vite : votre
voiture restera alors sur un petit rapport et la consommation augmentera
drastiquement »
([Nouvelle Route, organisme de formation à l'éco-conduite](https://nouvelle-route.fr/2021/11/30/consommer-moins/)).
Le Permis Libre insiste sur le même levier : maintenir une vitesse constante,
« anticiper au maximum l'environnement qui vous entoure afin d'avoir la
meilleure gestion possible de votre pédale d'accélérateur », et utiliser le
mode éco qui « a pour objectif de soulager la voiture en lui demandant
d'utiliser le rapport le plus économique possible »
([Le Permis Libre](https://www.lepermislibre.fr/permis-boite-automatique/conseils-adopter-conduite-eco-responsable-boite-automatique)).
Le fond reste celui de l'ADEME : conduite souple, sans accélération brusque, et
anticipation des ralentissements
([ADEME](https://agirpourlatransition.ademe.fr/particuliers/economiser/carburant/ecoconduite-solution-consommer-moins-carburant-limiter-emissions-co2)).

## Les 7 versions, phrase manuelle en regard

### C2d · Négocier un virage
**Manuel :** « Si besoin, rétrograde pour avoir le bon rapport. » Et dans
l'erreur type : « aborder le virage en sous-régime (rapport trop haut). La
voiture peine, broute, et tu risques de caler en pleine courbe. »
**Auto :** pas de rapport à choisir, on reste en D, on ralentit au frein avant
d'entrer sur la portion droite, ni sous-régime ni calage possibles. À la
sortie, ré-accélérer progressivement pour ne pas déclencher le kickdown.
**Sources :** position D et rôle de la boîte (Ornikar, cours code) · kickdown
(manuel Polestar / Volvo).

### C2e · Croiser et dépasser
**Manuel :** « Le bon réflexe quand le doute s'installe : tu lèves le pied, tu
rétrogrades, tu renonces. »
**Auto :** renoncer demande un geste de moins, lever le pied et freiner, rien à
rétrograder. La décision ne change pas. Et pour la reprise, c'est le kickdown
qui donne la puissance, sa raison d'être documentée étant justement le
dépassement.
**Sources :** manuel Polestar / Volvo (kickdown, usage dépassement).

### C2f · Intersections et ronds-points
**Manuel :** « en approchant, contrôle derrière, ralentis et rétrograde
(souvent 2e) » et « tu reviens en 2e ; si tu ne vois rien à droite, tu reviens
même en 1re ».
**Auto :** on reste en D partout. Ce qui compte reste identique, ralentir au
frein assez tôt pour avoir le temps de regarder. Et en D la voiture avance au
ralenti dès qu'on lève le frein, ce qui aide à se présenter au pas devant un
« Cédez le passage ».
**Sources :** Ornikar, cours code (positions de la boîte, comportement en D).

### C3d · Freinage d'urgence et adhérence
C'est la plus importante, c'est de la sécurité.
**Manuel :** « Puis tu débrayes. Juste avant que le moteur cale. L'ordre est
important : frein en premier, embrayage ensuite. » Erreur type : « débrayer
AVANT de freiner ».
**Auto :** pas d'embrayage, donc aucun ordre à retenir. On écrase le frein, on
garde le pied enfoncé jusqu'à l'arrêt, la voiture ne peut pas caler. Le reste
est inchangé (pédale qui vibre = ABS, on ne relâche pas, on regarde
l'échappatoire). J'ai ajouté l'avertissement pied gauche, parce que c'est le
piège documenté propre à cette boîte et que la panique est exactement le moment
où il se déclenche.
**Sources :** Sécurité routière de A à Z (geste ABS) · Caradisiac (pas de
calage en automatique) · Le Permis Libre et Ornikar (pied gauche au repos,
freinage involontairement brutal).

### C3e · Voie rapide et autoroute
**Manuel :** « Bande courte → tu restes en 3e (plus de reprise) ; bande longue
→ tu peux passer la 4e » et « tu attends d'être sur la voie de décélération,
une fois sorti, pour ralentir et rétrograder tranquillement ».
**Auto :** pas de rapport à choisir sur la bande, on reste en D et on accélère
franchement ; à fond, la boîte rétrograde d'elle-même. L'objectif ne bouge pas,
atteindre la vitesse du flux et ne jamais s'arrêter en bout de bande. Pour
sortir, on lève le pied et on freine sur la voie de décélération.
**Sources :** manuel Polestar / Volvo (kickdown) · Ornikar (position D).

### C3g · Ville dense
**Manuel :** « Les ralentisseurs, tu les prends en 2e, en douceur. »
**Auto :** on reste en D et on règle son allure au frein, on arrive au pas et
on lève le frein pour franchir en douceur. J'ai précisé que tout le reste de la
fiche est identique dans les deux boîtes, parce que le regard, l'angle mort,
l'écart au cycliste et la priorité au piéton ne dépendent pas de la
transmission.
**Sources :** Ornikar (position D, comportement au ralenti).

### C4c · Éco-conduite
**Manuel :** « Passe les rapports tôt pour rouler en bas régime » et « la
souplesse est le levier n°1 de l'éco-conduite ».
**Auto :** ce n'est plus l'élève qui passe les rapports, mais il garde la main.
Une pression douce fait monter les rapports tôt et garde le moteur bas ;
écraser l'accélérateur est lu par la boîte comme une demande de vitesse, elle
reste sur un petit rapport et la consommation grimpe. Donc éviter le kickdown
quand il n'est pas nécessaire, et rester en D ou en mode Éco plutôt qu'en Sport.
**Sources :** Nouvelle Route et Le Permis Libre (éco-conduite spécifique BVA) ·
ADEME (souplesse et anticipation) · Ornikar (mode Sport qui retient les
rapports plus longtemps).

## Le résumé « En 10 secondes » de C4c a été corrigé

Dans la première passe j'avais dû retirer le levier n°1 de l'éco-conduite,
parce que « je passe mes rapports tôt » est faux pour un élève en automatique.
La recherche donne la formulation qui marche pour les deux boîtes : en manuelle
on monte les rapports tôt pour garder le moteur bas, en automatique une
pression douce produit exactement le même résultat. La ligne devient donc :

> **J'accélère en douceur pour garder le moteur bas.**

Les deux autres lignes ne bougent pas. C'est le seul résumé modifié : les six
autres fiches de cette passe étaient déjà rédigées pour rester vraies dans les
deux boîtes.

## Ce que je n'ai PAS écrit, et pourquoi

**Les positions L, B et le mode manuel en descente.** Les sources sont
concordantes et sérieuses : L « maintient la boîte sur les rapports les plus
courts », utilisée pour « les descentes raides (pour utiliser le frein moteur
sans risquer une surchauffe des freins) », et B « simule l'effet du frein
moteur », utile « en descente prolongée »
([Ornikar, cours code](https://www.ornikar.com/code/cours/mecanique-vehicule/boite-vitesses/lettres-automatiques)).
Je ne l'ai mis dans aucune des sept fiches parce qu'aucune ne traite la
descente de montagne, et surtout parce que la question « est-ce qu'on enseigne
ça à un élève avant son permis, et est-ce que l'inspecteur l'attend » est une
décision pédagogique qui t'appartient. **Question ouverte pour toi :** tu veux
qu'on l'ajoute, et sur quelle fiche ?

**Le chiffre exact du gain d'éco-conduite en boîte automatique.** Notre fiche
manuelle annonce « jusqu'à environ 20 % ». Je n'ai pas trouvé de source sérieuse
donnant un chiffre propre à la boîte automatique, donc je n'en ai mis aucun
dans la version auto. Je préfère pas de chiffre à un chiffre inventé.

**Le réglage précis de l'allure en manœuvre lente.** Déjà couvert par le `bva`
existant de C1h, je n'ai pas dupliqué.

## Un point technique à vérifier, que je ne peux pas trancher seul

Les deux fiches C3d et C4c contiennent, dans leur JSON, un tableau `questions`
avec des réponses qui parlent d'embrayage et de passage de rapports. Bonne
nouvelle : **ce tableau n'est affiché nulle part dans l'app**, c'est de la
donnée dormante. Aucun élève ne le voit.

Le vrai quiz de certification, lui, vit côté serveur dans la table
`questions_competence`, et il a déjà une colonne `boite` : le moteur ne sert à
un élève que les questions communes aux deux boîtes ou écrites pour la sienne.
Le mécanisme est donc en place.

**Ce qu'il reste à vérifier :** que la banque serveur contient bien, pour C3d et
C4c, des questions marquées pour la boîte automatique, et pas seulement des
questions manuelles marquées « communes ». Je n'ai pas pu interroger la base
(l'accès Supabase n'était pas authentifié dans cette session). À faire dans une
prochaine session, c'est un chantier à part.
