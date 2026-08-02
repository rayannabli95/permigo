# Quel geste prouve chacune des 31 compétences

> Analyse de conception du 2 août 2026. Ce document repart du geste à prouver, pas des missions déjà écrites.

## Règles de lecture

Un téléphone ne peut pas certifier la mémoire musculaire d'une pédale, l'effort dans le volant ou le comportement réel dans la circulation. Il peut en revanche produire une preuve numérique de préparation : choisir une marge, reconnaître une cause, ordonner une action ou maintenir une priorité malgré une distraction. La certification complète reste donc liée à la pratique vécue puis déclarée par l'élève.

Chaque question ne propose que trois issues. Une zone, une position, un cran, un instant ou une trajectoire correspond toujours à l'index `0`, `1` ou `2`. Un geste peut sembler continu, mais sa fin se verrouille sur l'une de ces trois options. Aucun temps brut, score continu ou tracé libre ne part au serveur.

Chaque déroulé tient entre cinq et quinze secondes avec un seul doigt. Toutes les scènes reposent sur des formes CSS et SVG simples. Aucun geste ne demande une image, une vidéo, le son, un capteur ou une seconde main. Pour `sequence`, une question contient exactement trois chaînes candidates. La manipulation peut se faire pictogramme par pictogramme, mais le résultat envoyé reste l'index de la chaîne finalement construite.

Le premier choix est verrouillé avant la correction. L'animation de conséquence arrive ensuite. Elle ne permet donc pas de trouver la réponse par essais successifs. Les trois options restent visuellement neutres avant la validation. Le coût indiqué concerne le travail de dessin en CSS et SVG, pas le développement de la mécanique.

## Les neuf mécaniques retenues

| Mécanique | Geste élémentaire | Sortie serveur |
|---|---|---|
| `spot` | Toucher une zone non signalée | Index de la zone |
| `sequence` | Enchaîner des pictogrammes dans un ordre | Index de la chaîne obtenue |
| `trajectory` | Désigner une ligne dans la scène | Index de la ligne |
| `diagnostic` | Relier un effet à une cause ou une correction | Index de la cible |
| `réglage` | Faire glisser une commande puis la relâcher sur un cran | Index du cran |
| `placement` | Déplacer un objet vers une position possible | Index de la position |
| `balayage` | Explorer une scène puis désigner l'indice retenu | Index de l'indice |
| `anticipation` | Faire avancer une scène puis choisir un instant | Index de l'instant |
| `réaction engagée` | Quitter une zone active pour rejoindre une réponse | Index de la zone de réponse |

La mécanique existante `decision` ne ressort jamais comme le meilleur geste. Quand une compétence demande une décision, son objet concret est presque toujours plus probant que trois cartes de texte : une marge, un instant, une trajectoire, un réglage ou une correction.

## Chapitre 1 : la voiture

### C1a : Maîtriser la mécanique

**GESTE**  Relie d'un glissement un symptôme animé à l'un des trois organes stylisés qui peut le provoquer.

**CE QUE ÇA PROUVE**  Tu relies un effet observable à une cause mécanique précise au lieu de réciter le nom d'une pièce.

**DÉROULÉ**

1. Tu vois une voiture simplifiée en transparence, un indicateur de température qui monte et trois organes plausibles.
2. Aucun organe ne clignote et les trois dessins ont le même poids visuel.
3. Tu prends l'icône du symptôme et tu la fais glisser vers l'organe que tu soupçonnes.
4. La cible choisie se verrouille et devient l'option `0`, `1` ou `2`.
5. La correction anime ensuite le circuit concerné. Sur erreur, elle montre pourquoi le symptôme reste inexpliqué.

**POURQUOI PAS AUTRE CHOSE**  Toucher une pièce déjà nommée testerait sa position, pas la compréhension du lien entre cause et effet.

**RÉUTILISE**  La mécanique existante `diagnostic` convient, on la garde.

**COÛT**  moyen

### C1b : Connaître les organes

**GESTE**  Touche dans un poste de conduite non légendé la commande qui produit l'effet demandé.

**CE QUE ÇA PROUVE**  Tu retrouves une commande à partir de sa fonction dans un environnement chargé, sans aide par son nom.

**DÉROULÉ**

1. Le pare-brise se couvre de buée et trois commandes plausibles sont visibles autour du volant.
2. La consigne demande de rendre la vue, sans citer le désembuage ni montrer son pictogramme.
3. Tu touches directement la commande que tu utiliserais.
4. La zone touchée fournit l'un des trois index de réponse.
5. Après verrouillage, la bonne commande agit sur la vitre. Sur erreur, l'effet choisi se produit ailleurs dans le poste.

**POURQUOI PAS AUTRE CHOSE**  Remettre des commandes dans un ordre prouverait une procédure, pas la capacité à retrouver le bon organe.

**RÉUTILISE**  La mécanique existante `spot` convient, on la garde.

**COÛT**  moyen

### C1c : Installation au poste de conduite

**GESTE**  Fais glisser le siège et le buste vers l'une des trois positions où pieds, bras et regard s'alignent.

**CE QUE ÇA PROUVE**  Tu arbitres simultanément la flexion du genou, celle du coude et la hauteur du regard.

**DÉROULÉ**

1. Une vue de profil montre le conducteur, les pédales, le volant, l'appui-tête et le haut du pare-brise.
2. Trois positions d'ancrage sont possibles, mais aucune n'est nommée ou colorée.
3. Tu fais glisser le bloc siège et buste jusqu'à la position que tu juges sûre.
4. Le bloc se cale sur un des trois ancrages et envoie son index.
5. La correction trace ensuite les angles du genou et du coude. Sur erreur, elle montre la contrainte sacrifiée.

**POURQUOI PAS AUTRE CHOSE**  Connaître l'ordre des réglages ne prouve pas que la position finale permet d'agir et de voir correctement.

**RÉUTILISE**  Mécanique nouvelle, à construire : `placement`.

**COÛT**  moyen

### C1d : Démarrer et s'arrêter

**GESTE**  Enchaîne les pictogrammes de commande dans l'ordre qui fait démarrer ou arrêter la voiture selon la scène.

**CE QUE ÇA PROUVE**  Tu conserves les dépendances de sécurité entre pédale, rapport, observation et immobilisation.

**DÉROULÉ**

1. La question montre soit une voiture immobile prête à partir, soit une arrivée au point d'arrêt.
2. Trois chaînes possibles utilisent les mêmes pictogrammes dans des ordres différents.
3. Tu touches les actions de la chaîne que tu appliquerais dans cette scène.
4. La chaîne complète correspond à l'une des trois options et produit son index.
5. Sur erreur, la voiture cale, bondit ou reste non sécurisée seulement après le verrouillage de la réponse.

**POURQUOI PAS AUTRE CHOSE**  Toucher le frein ou le levier au bon endroit ne prouve pas que tu sais coordonner toute la chaîne.

**RÉUTILISE**  La mécanique existante `sequence` convient, on la garde.

**COÛT**  faible

### C1e : Doser accélération et freinage

**GESTE**  Fais glisser une pédale virtuelle, maintiens la pression choisie puis relâche sur l'un des trois crans de dosage.

**CE QUE ÇA PROUVE**  Tu choisis une intensité progressive en fonction de la distance disponible, plutôt qu'une simple consigne « freine doucement ».

**DÉROULÉ**

1. Une voiture approche d'une ligne d'arrêt avec un passager stylisé et trois crans neutres sous la pédale.
2. La distance restante et l'allure sont visibles, mais aucun cran ne porte de mot ni de couleur de réussite.
3. Tu fais glisser la pédale, tu maintiens brièvement, puis tu relâches au dosage choisi.
4. La position finale se cale sur un cran et fournit l'index `0`, `1` ou `2`.
5. Après validation, l'animation montre un arrêt trop court, souple sur la ligne ou trop tardif. Aucun second essai ne modifie la réponse certifiée.

**POURQUOI PAS AUTRE CHOSE**  Une carte « freinage progressif » vérifie du vocabulaire et une note continue serait incompatible avec la certification.

**RÉUTILISE**  Mécanique nouvelle, à construire : `réglage`.

**COÛT**  moyen

### C1f : Utiliser la boîte de vitesses

**GESTE**  Enchaîne embrayage, passage dans la grille et reprise de l'accélérateur à partir du régime affiché.

**CE QUE ÇA PROUVE**  Tu choisis le bon rapport puis tu coordonnes les actions qui évitent à-coup, surrégime et calage.

**DÉROULÉ**

1. Le compte-tours et la pente donnent la situation sans écrire le rapport attendu.
2. Trois chaînes de pictogrammes proposent des rapports et des ordres différents.
3. Tu touches les actions de la chaîne que tu veux exécuter.
4. La chaîne obtenue se ramène à l'une des trois options et envoie son index.
5. Après verrouillage, le moteur prend un régime stable. Sur erreur, il hurle, tousse ou la voiture donne un à-coup.

**POURQUOI PAS AUTRE CHOSE**  Diagnostiquer le bruit du moteur ne prouve pas que tu sais construire la réponse complète avec les commandes.

**RÉUTILISE**  La mécanique existante `sequence` convient, on la garde.

**COÛT**  faible

### C1g : Contrôles de sécurité extérieure

**GESTE**  Balaye tout le tour d'une voiture par un glissement circulaire puis touche l'un des trois indices suspects observés.

**CE QUE ÇA PROUVE**  Tu mènes une inspection complète et tu distingues un défaut de sécurité d'un détail sans conséquence.

**DÉROULÉ**

1. La voiture apparaît de trois quarts avec un anneau de visite, sans liste de contrôles à cocher.
2. Ton doigt fait tourner la voiture et ouvre successivement les vues pneus, feux, vitres et dessous.
3. Trois indices plausibles restent mémorisés sous forme de petits croquis neutres.
4. Après avoir fait le tour complet, tu touches celui qui interdit ou retarde le départ.
5. Cet indice fournit l'index. La correction montre ensuite le défaut, ou explique pourquoi le détail choisi était normal.

**POURQUOI PAS AUTRE CHOSE**  Ordonner une liste de vérifications récompense la récitation et ne vérifie pas que tu remarques réellement une anomalie.

**RÉUTILISE**  Mécanique nouvelle, à construire : `balayage`.

**COÛT**  élevé

### C1h : Manœuvres, créneau et demi-tour

**GESTE**  Désigne parmi trois tracés celui qui fait entrer la voiture dans l'espace sans toucher les limites.

**CE QUE ÇA PROUVE**  Tu relies les phases de braquage à la géométrie réelle de la voiture et de son environnement.

**DÉROULÉ**

1. Une vue de dessus montre la voiture, l'emplacement et les obstacles avec des formes simples.
2. Trois lignes partent du même point et diffèrent par le moment du braquage et du contre-braquage.
3. Tu touches la ligne que la voiture doit suivre.
4. La ligne sélectionnée transmet son index avant toute animation.
5. La voiture parcourt ensuite le tracé. Sur erreur, la roue monte sur le bord ou la voiture termine mal alignée.

**POURQUOI PAS AUTRE CHOSE**  Une séquence de mots peut être apprise sans comprendre l'espace nécessaire au nez et à l'arrière de la voiture.

**RÉUTILISE**  La mécanique existante `trajectory` convient, on la garde.

**COÛT**  moyen

### C1i : Autonomie sur les manœuvres de base

**GESTE**  Relie une voiture mal engagée à l'une des trois corrections dessinées qui permet de reprendre la manœuvre.

**CE QUE ÇA PROUVE**  Tu sais lire ta propre erreur et choisir une correction sans attendre une instruction extérieure.

**DÉROULÉ**

1. La scène commence au milieu d'un créneau avec la voiture trop loin, trop serrée ou mal orientée.
2. Trois corrections visuelles montrent un mouvement du volant et un déplacement possible.
3. Tu prends le symbole de la voiture et tu le relies à la correction que tu choisis.
4. La cible reçoit l'index de réponse.
5. La conséquence se joue ensuite. Sur erreur, la correction aggrave clairement l'écart avant que la bonne reprise soit expliquée.

**POURQUOI PAS AUTRE CHOSE**  Choisir une trajectoire parfaite depuis le départ ne prouve pas que tu sais te reprendre seul quand la réalité dévie.

**RÉUTILISE**  La mécanique existante `diagnostic` convient, on la garde.

**COÛT**  moyen

## Chapitre 2 : circuler

### C2a : Prendre l'information visuelle

**GESTE**  Fais glisser une fenêtre de regard entre loin, côtés et rétroviseurs puis touche l'indice qui peut modifier ta conduite en premier.

**CE QUE ÇA PROUVE**  Tu explores plusieurs profondeurs et tu hiérarchises une information utile au lieu de fixer le détail le plus visible.

**DÉROULÉ**

1. Une rue simple contient un panneau lointain, un véhicule dans le rétroviseur et un piéton partiellement masqué.
2. La scène reste lisible, mais les détails fins se révèlent seulement quand la fenêtre de regard passe dessus.
3. Tu balayes librement sans limite de temps et sans compteur de vitesse du doigt.
4. Trois indices observés restent disponibles et tu touches celui qui exige l'action la plus proche.
5. L'indice devient l'index de réponse. Sur erreur, la correction rejoue l'ordre dans lequel les risques vont atteindre ta trajectoire.

**POURQUOI PAS AUTRE CHOSE**  Un `spot` statique teste la découverte d'un détail, pas l'organisation du balayage ni la priorité entre plusieurs informations.

**RÉUTILISE**  Mécanique nouvelle, à construire : `balayage`.

**COÛT**  élevé

### C2b : Adapter sa conduite

**GESTE**  Fais glisser l'aiguille d'allure vers l'un des trois crans adaptés à la marge visible dans la scène.

**CE QUE ÇA PROUVE**  Tu transformes des indices de route en niveau d'allure concret, sans confondre limite autorisée et vitesse sûre.

**DÉROULÉ**

1. La scène combine une limitation, une sortie d'école, des voitures garées et une visibilité partielle.
2. Trois crans d'allure sont possibles, mais aucun n'est appelé lent, normal ou rapide.
3. Tu fais glisser l'aiguille jusqu'au réglage que tu conserverais à cet endroit.
4. Le relâchement verrouille le cran et transmet son index.
5. La scène avance ensuite. Sur erreur, un danger devient visible alors que la distance d'arrêt est déjà consommée, ou la circulation est bloquée sans raison.

**POURQUOI PAS AUTRE CHOSE**  Dire « je ralentis » dans une carte ne prouve pas que tu sais de combien réduire ta marge d'allure.

**RÉUTILISE**  Mécanique nouvelle, à construire : `réglage`.

**COÛT**  moyen

### C2c : Trajectoire et placement

**GESTE**  Déplace la voiture latéralement vers l'une des trois positions possibles dans sa voie.

**CE QUE ÇA PROUVE**  Tu répartis les marges à gauche et à droite selon les obstacles présents, au lieu de viser mécaniquement le centre.

**DÉROULÉ**

1. Une coupe de chaussée montre une ligne centrale, des voitures garées et une portière susceptible de s'ouvrir.
2. Trois positions d'ancrage attendent la voiture sans contour de réussite.
3. Tu fais glisser la voiture vers la position qui garde les deux marges utiles.
4. La voiture se cale et la position fournit l'index.
5. Après validation, les distances latérales apparaissent. Sur erreur, l'une des marges tombe à zéro.

**POURQUOI PAS AUTRE CHOSE**  Une trajectoire longue ajoute du mouvement inutile quand la compétence à juger est la position transversale immédiate.

**RÉUTILISE**  Mécanique nouvelle, à construire : `placement`.

**COÛT**  faible

### C2d : Vitesse et trajectoire en virage

**GESTE**  Désigne l'un des trois tracés dont la forme et l'espacement des repères codent ensemble trajectoire et allure.

**CE QUE ÇA PROUVE**  Tu associes le ralentissement avant le virage à une ligne stable dans ta voie, puis la reprise à la sortie.

**DÉROULÉ**

1. Une courbe est vue de dessus avec trois lignes possibles dans la même voie.
2. Des points régulièrement animés sur chaque ligne montrent où la voiture ralentit puis reprend, sans afficher de chiffre.
3. Tu observes les trois couples allure et trajectoire puis tu touches celui que tu choisis.
4. La ligne fournit directement l'index de réponse.
5. La voiture suit ensuite le tracé. Sur erreur, elle freine en appui, coupe la ligne ou sort trop large.

**POURQUOI PAS AUTRE CHOSE**  Un simple réglage de vitesse ignore la trajectoire, et une ligne sans rythme ignore le moment du ralentissement.

**RÉUTILISE**  La mécanique existante `trajectory` convient, on la garde.

**COÛT**  moyen

### C2e : Croisements et dépassements

**GESTE**  Fais glisser ta voiture vers l'un des trois espaces disponibles autour de l'usager à dépasser ou à croiser.

**CE QUE ÇA PROUVE**  Tu juges simultanément la distance latérale, la visibilité et l'espace de retour avant de t'engager.

**DÉROULÉ**

1. Une vue de dessus montre un vélo, une voiture en face et trois positions possibles pour ta voiture.
2. Les vitesses relatives sont indiquées par l'espacement de trois repères derrière chaque véhicule.
3. Tu déplaces ta voiture vers l'espace où tu veux la placer, y compris la position d'attente derrière le vélo.
4. La zone d'ancrage choisie produit l'index.
5. Après verrouillage, les véhicules avancent. Sur erreur, l'écart latéral disparaît ou la zone de retour se ferme.

**POURQUOI PAS AUTRE CHOSE**  Trois phrases « je dépasse » ou « j'attends » cachent le jugement spatial qui rend la décision sûre.

**RÉUTILISE**  Mécanique nouvelle, à construire : `placement`.

**COÛT**  moyen

### C2f : Intersections et ronds-points

**GESTE**  Fais avancer la scène entre trois instants puis relâche le curseur au premier créneau où tu peux t'engager.

**CE QUE ÇA PROUVE**  Tu lis l'évolution des priorités et choisis une fenêtre de passage, sans dépendre de la rapidité de ton doigt.

**DÉROULÉ**

1. Une intersection vue de dessus montre ta voiture et deux usagers dont les positions changent.
2. Tu fais coulisser le temps à ton rythme entre trois images clés.
3. À chaque cran, les mêmes trajectoires restent visibles afin que la mémoire ne soit pas le test.
4. Tu relâches sur l'instant où tu décides de partir. Ce cran fournit l'index.
5. La scène se joue ensuite. Sur erreur, une priorité coupe ton passage ou le créneau sûr est déjà refermé.

**POURQUOI PAS AUTRE CHOSE**  Toucher le véhicule prioritaire prouve une règle statique, pas le choix du bon moment pour entrer.

**RÉUTILISE**  Mécanique nouvelle, à construire : `anticipation`.

**COÛT**  élevé

### C2g : Communiquer avec les autres usagers

**GESTE**  Enchaîne regard, signal et déplacement dans l'ordre où les autres peuvent comprendre ton intention.

**CE QUE ÇA PROUVE**  Tu annonces une action après avoir pris l'information et avant de déplacer la voiture.

**DÉROULÉ**

1. La voiture doit changer de voie et quatre pictogrammes représentent rétroviseur, clignotant, angle mort et mouvement.
2. Tu touches les pictogrammes dans l'ordre que tu appliquerais.
3. Les autres véhicules restent figés afin que la vitesse de réponse ne compte pas.
4. La chaîne terminée correspond à l'une des trois options et transmet son index.
5. Sur erreur, la conséquence montre un signal trop tardif ou un mouvement lancé avant le dernier contrôle.

**POURQUOI PAS AUTRE CHOSE**  Trouver le clignotant ne prouve pas que le message arrive au moment où il est encore utile aux autres.

**RÉUTILISE**  La mécanique existante `sequence` convient, on la garde.

**COÛT**  faible

### C2h : Conduire en autonomie

**GESTE**  Trace du doigt l'une des trois routes possibles quand l'itinéraire prévu devient impraticable.

**CE QUE ÇA PROUVE**  Tu choisis une solution sûre sans attendre une consigne et sans tenter de récupérer la route à tout prix.

**DÉROULÉ**

1. Une carte très simple montre ta position, la destination et une rue soudainement barrée.
2. Trois lignes proposent un détour sûr, un passage interdit et un retour dangereux.
3. Tu suis du doigt la ligne que tu décides de prendre.
4. La ligne touchée fournit l'index de réponse.
5. La correction déroule ensuite le trajet. Sur erreur, le point précis où la sécurité ou la règle est rompue apparaît.

**POURQUOI PAS AUTRE CHOSE**  Diagnostiquer que la rue est fermée ne prouve pas que tu sais choisir et assumer une nouvelle route.

**RÉUTILISE**  La mécanique existante `trajectory` convient, on la garde.

**COÛT**  moyen

## Chapitre 3 : conditions difficiles

### C3a : Conduite de nuit

**GESTE**  Touche la zone où poser ton regard lorsque des phares arrivent en face.

**CE QUE ÇA PROUVE**  Tu choisis un repère qui protège de l'éblouissement tout en conservant la trajectoire.

**DÉROULÉ**

1. Une route nocturne montre des phares en face, le bord droit, un rétroviseur et le tableau de bord.
2. Les trois zones de réponse restent dessinées avec la même luminosité.
3. Tu touches la zone que tes yeux doivent suivre pendant le croisement.
4. La zone choisie transmet son index.
5. Après validation, le halo augmente. Sur erreur, la zone choisie disparaît dans l'éblouissement ou détourne le regard de la route.

**POURQUOI PAS AUTRE CHOSE**  Une carte sur les feux connaît la règle, mais ne vérifie pas où tu places concrètement ton regard.

**RÉUTILISE**  La mécanique existante `spot` convient, on la garde.

**COÛT**  moyen

### C3b : Mauvaise visibilité

**GESTE**  Éloigne ta voiture de celle qui précède et relâche-la vers l'une des trois distances possibles.

**CE QUE ÇA PROUVE**  Tu convertis la portée visuelle réduite en espace d'arrêt disponible devant toi.

**DÉROULÉ**

1. Le brouillard masque progressivement un véhicule placé devant le tien.
2. Trois positions d'ancrage longitudinales sont possibles, sans chiffre ni nom.
3. Tu fais glisser ta voiture vers l'arrière jusqu'à la distance que tu conserverais.
4. La position finale transmet son index.
5. Un obstacle apparaît ensuite derrière le véhicule de tête. Sur erreur, ta zone d'arrêt le dépasse ou ta distance est inutilement excessive.

**POURQUOI PAS AUTRE CHOSE**  Régler seulement la vitesse ne prouve pas que tu conserves assez d'espace pour t'arrêter dans ce que tu vois.

**RÉUTILISE**  Mécanique nouvelle, à construire : `placement`.

**COÛT**  moyen

### C3c : Chaussée glissante

**GESTE**  Fais glisser la commande de correction vers l'un des trois crans d'intensité lorsque l'arrière de la voiture dérive.

**CE QUE ÇA PROUVE**  Tu choisis une correction mesurée et résistes au freinage ou au braquage brutal qui amplifierait la perte d'adhérence.

**DÉROULÉ**

1. Une vue de dessus montre la voiture légèrement en travers sur une zone brillante.
2. Une commande unique combine relâchement, maintien et correction forte sur trois crans neutres.
3. Tu la fais glisser jusqu'à l'intensité que tu appliquerais puis tu relâches.
4. Le cran choisi devient l'index de réponse.
5. La voiture réagit ensuite. Sur erreur, elle poursuit la dérive ou reprend brutalement de l'adhérence avant que la correction sûre soit montrée.

**POURQUOI PAS AUTRE CHOSE**  Reconnaître le verglas par un diagnostic ne prouve pas que tu choisis un geste assez doux quand l'adhérence part.

**RÉUTILISE**  Mécanique nouvelle, à construire : `réglage`.

**COÛT**  moyen

### C3d : Adhérence et freinage d'urgence

**GESTE**  Garde le doigt sur la zone de conduite puis glisse-le vers l'une des trois réponses quand l'obstacle apparaît.

**CE QUE ÇA PROUVE**  Tu donnes la priorité au freinage utile et à l'échappatoire malgré une rupture soudaine de la scène.

**DÉROULÉ**

1. Ton doigt repose sur une grande zone neutre pendant qu'une route simple avance.
2. Après un délai variable, un obstacle surgit et trois zones d'action apparaissent : frein, évitement brutal ou maintien.
3. Tu fais glisser le doigt vers la réponse choisie, sans limite de temps éliminatoire.
4. La zone atteinte fournit l'index. Le délai reste une information d'entraînement locale et ne certifie rien.
5. La conséquence se joue ensuite. Sur erreur, la voiture perd sa marge avant que le bon premier réflexe soit expliqué.

**POURQUOI PAS AUTRE CHOSE**  Remettre calmement quatre gestes dans l'ordre teste la mémoire, alors que l'enjeu est le premier choix après la surprise.

**RÉUTILISE**  Mécanique nouvelle, à construire : `réaction engagée`.

**COÛT**  élevé

### C3e : Voies rapides et autoroutes

**GESTE**  Fais glisser ta voiture dans l'un des trois espaces du flot en tenant compte de leur vitesse relative.

**CE QUE ÇA PROUVE**  Tu choisis un créneau d'insertion atteignable et tu adaptes ton allure au trafic déjà présent.

**DÉROULÉ**

1. Une vue de dessus montre la voie d'insertion et trois espaces entre des véhicules.
2. Des repères qui défilent sous les voitures rendent visibles les vitesses relatives sans chiffres.
3. Tu fais glisser ta voiture vers l'espace que tu vises en fin de bretelle.
4. La zone d'arrivée transmet l'index de réponse.
5. Le flot avance ensuite. Sur erreur, l'espace se referme, impose un freinage aux autres ou demande une accélération impossible.

**POURQUOI PAS AUTRE CHOSE**  Une séquence « contrôle, clignotant, insertion » ne prouve pas que tu sais choisir un espace réel dans un flot mobile.

**RÉUTILISE**  Mécanique nouvelle, à construire : `placement`.

**COÛT**  élevé

### C3f : Tunnels, ponts et zones spécifiques

**GESTE**  Enchaîne les préparations dans l'ordre qui protège avant l'entrée dans la zone spéciale.

**CE QUE ÇA PROUVE**  Tu anticipes la perte de lumière, le vent ou l'absence d'échappatoire avant d'y être exposé.

**DÉROULÉ**

1. Un tunnel approche avec quatre pictogrammes : lunettes, feux, distance et repère de secours.
2. Tu touches les actions dans l'ordre où elles doivent être terminées.
3. La scène avance d'un cran après chaque choix, mais aucun chronomètre ne sanctionne la lecture.
4. La chaîne obtenue correspond à l'une des trois options et transmet son index.
5. Sur erreur, l'entrée assombrit la scène avant le réglage manquant ou place le repère de secours hors de portée.

**POURQUOI PAS AUTRE CHOSE**  Toucher une sortie de secours teste sa localisation, pas la préparation de toute la marge avant l'entrée.

**RÉUTILISE**  La mécanique existante `sequence` convient, on la garde.

**COÛT**  moyen

### C3g : Zones urbaines denses

**GESTE**  Balaye les zones masquées d'une rue puis touche l'indice du danger qui peut entrer dans ta trajectoire.

**CE QUE ÇA PROUVE**  Tu vas chercher les signes d'un usager caché au lieu d'attendre qu'il soit entièrement visible.

**DÉROULÉ**

1. Une rue contient un bus arrêté, des voitures garées et une piste cyclable partiellement cachée.
2. Tu déplaces une fenêtre de regard devant le bus, sous les voitures et dans le rétroviseur droit.
3. Trois indices deviennent lisibles : des pieds, une roue de vélo et un feu de magasin.
4. Tu touches celui qui annonce l'entrée la plus proche dans ta trajectoire.
5. L'indice fournit l'index. Sur erreur, la scène avance lentement et révèle pourquoi le danger choisi arrivait plus tard ou pas du tout.

**POURQUOI PAS AUTRE CHOSE**  Un `spot` sur un piéton déjà visible ne prouve pas que tu sais chercher ce que les volumes de la ville cachent.

**RÉUTILISE**  Mécanique nouvelle, à construire : `balayage`.

**COÛT**  élevé

## Chapitre 4 : autonomie

### C4a : Planifier un trajet

**GESTE**  Trace du doigt l'un des trois itinéraires qui respecte à la fois conditions, pauses et solution de repli.

**CE QUE ÇA PROUVE**  Tu arbitres plusieurs contraintes avant le départ au lieu de choisir automatiquement la route la plus courte.

**DÉROULÉ**

1. Une carte simple montre trois routes, avec pictogrammes de pluie, travaux, recharge ou aire de repos.
2. La consigne donne un besoin concret, par exemple arriver de jour avec une pause possible.
3. Tu suis du doigt la route que tu prépares.
4. La trajectoire sélectionnée transmet son index.
5. La correction déroule les contraintes. Sur erreur, elle montre celle que ton itinéraire ne peut pas satisfaire et la solution de repli manquante.

**POURQUOI PAS AUTRE CHOSE**  Mettre « météo, trafic, pause » dans un ordre ne prouve pas que tu sais choisir un trajet qui les concilie.

**RÉUTILISE**  La mécanique existante `trajectory` convient, on la garde.

**COÛT**  élevé

### C4b : Suivre un itinéraire

**GESTE**  Désigne la ligne qui traverse un échangeur en accord avec le panneau et le guidage, sans changement tardif.

**CE QUE ÇA PROUVE**  Tu traduis une instruction en placement de voie tout en laissant la route prioritaire sur l'écran.

**DÉROULÉ**

1. Un échangeur simplifié montre deux panneaux, une instruction de guidage et trois lignes possibles.
2. L'une anticipe la bonne voie, une autre coupe tardivement et la dernière suit une instruction devenue impossible.
3. Tu touches la ligne que tu veux suivre.
4. La ligne transmet l'index avant que les voitures ne bougent.
5. La scène avance ensuite. Sur erreur, le changement tardif croise une autre voie ou le guidage doit simplement recalculer.

**POURQUOI PAS AUTRE CHOSE**  Toucher le bon panneau ne prouve pas que tu sais transformer l'information en trajectoire sûre.

**RÉUTILISE**  La mécanique existante `trajectory` convient, on la garde.

**COÛT**  moyen

### C4c : Conduite économique

**GESTE**  Fais glisser la commande d'allure vers le cran qui utilise l'élan disponible avant un ralentissement.

**CE QUE ÇA PROUVE**  Tu choisis quand cesser d'accélérer afin de conserver de la marge sans créer un freinage inutile.

**DÉROULÉ**

1. Un feu rouge ou une file arrêtée apparaît loin devant avec trois crans de commande neutres.
2. La pente, la distance et l'allure courante sont visibles sans jauge de bonne réponse.
3. Tu fais glisser la commande vers accélérer, maintenir ou laisser ralentir.
4. Le cran choisi fournit l'index.
5. L'énergie et la distance d'arrêt apparaissent après validation. Sur erreur, l'énergie gagnée est aussitôt perdue au frein ou la voiture gêne sans nécessité.

**POURQUOI PAS AUTRE CHOSE**  Choisir une phrase sur l'écoconduite teste une règle connue, pas l'usage concret de l'inertie dans une scène.

**RÉUTILISE**  Mécanique nouvelle, à construire : `réglage`.

**COÛT**  faible

### C4d : Anticipation et stress

**GESTE**  Reste engagé sur la conduite puis glisse vers l'une des trois priorités quand plusieurs signaux contradictoires apparaissent.

**CE QUE ÇA PROUVE**  Tu conserves la marge de sécurité comme priorité malgré une pression sociale ou une distraction soudaine.

**DÉROULÉ**

1. Ton doigt repose sur une zone de conduite pendant qu'un véhicule suit de trop près.
2. Un klaxon, une notification visuelle muette et un passage piéton apparaissent presque ensemble.
3. Trois grandes zones proposent créer de l'espace, accélérer sous la pression ou regarder la notification.
4. Tu glisses vers ta priorité sans compte à rebours. Seule la zone, jamais le délai, fournit l'index.
5. La conséquence se joue ensuite. Sur erreur, la marge disparaît et l'écran explique comment la préserver sans punir une réponse lente.

**POURQUOI PAS AUTRE CHOSE**  Un temps de réaction noterait la vitesse du doigt, tandis qu'une carte calme supprimerait la concurrence entre les signaux.

**RÉUTILISE**  Mécanique nouvelle, à construire : `réaction engagée`.

**COÛT**  élevé

### C4e : Partage de la route

**GESTE**  Déplace ta voiture vers l'une des trois positions qui laissent une enveloppe de sécurité à l'usager vulnérable.

**CE QUE ÇA PROUVE**  Tu consacres un espace réel au cycliste ou au piéton en fonction de sa trajectoire possible.

**DÉROULÉ**

1. Une vue de dessus montre un cycliste, une portière et une voiture arrivant en face.
2. Trois positions sont possibles : dépasser près, attendre derrière ou se déporter sans marge de retour.
3. Tu fais glisser ta voiture vers la position que tu choisis.
4. La position d'ancrage transmet son index.
5. Les enveloppes de mouvement apparaissent ensuite. Sur erreur, deux enveloppes se croisent et montrent le conflit créé.

**POURQUOI PAS AUTRE CHOSE**  Repérer le cycliste est évident et ne prouve pas que tu lui réserves assez d'espace pour une erreur possible.

**RÉUTILISE**  Mécanique nouvelle, à construire : `placement`.

**COÛT**  moyen

### C4f : Présentation à l'examen

**GESTE**  Enchaîne les actions qui permettent de recevoir une consigne, vérifier sa faisabilité puis agir sans précipitation.

**CE QUE ÇA PROUVE**  Tu gardes la sécurité au-dessus de l'obéissance et tu sais demander une précision avant de t'engager.

**DÉROULÉ**

1. L'inspecteur demande une manœuvre et trois pictogrammes représentent écouter, observer et agir.
2. Un détail rend la manœuvre momentanément impossible, par exemple un piéton dans la zone.
3. Tu touches les actions dans l'ordre où tu gères la consigne et l'attente.
4. La chaîne complète correspond à l'une des trois options et transmet son index.
5. Sur erreur, la scène montre une action précipitée ou une attente sans communication, puis rappelle que l'examen juge la sécurité.

**POURQUOI PAS AUTRE CHOSE**  Une réaction chronométrée renforcerait précisément la pression qu'il faut apprendre à ne pas subir.

**RÉUTILISE**  La mécanique existante `sequence` convient, on la garde.

**COÛT**  faible

### C4g : Conduite après l'examen

**GESTE**  Relie un ensemble d'indices personnels et routiers à l'une des trois décisions de départ possibles.

**CE QUE ÇA PROUVE**  Tu diagnostiques seul si tu peux conduire, adapter le trajet ou renoncer, sans moniteur ni inspecteur pour trancher.

**DÉROULÉ**

1. La scène rassemble trois indices, par exemple fatigue, pluie forte et long trajet de nuit.
2. Trois cibles concrètes sont dessinées : clés de voiture, départ reporté et autre moyen de transport.
3. Tu fais glisser les indices vers la décision que tu prends.
4. La cible choisie fournit l'index de réponse.
5. La correction hiérarchise ensuite les risques. Sur erreur, elle montre pourquoi une règle probatoire ou une limite personnelle rend le départ dangereux.

**POURQUOI PAS AUTRE CHOSE**  Toucher le disque A ou réciter le nombre de points vérifie une règle, pas l'autonomie de sécurité une fois le permis obtenu.

**RÉUTILISE**  La mécanique existante `diagnostic` convient, on la garde.

**COÛT**  moyen

## Synthèse

| Compétence | Mécanique retenue | Réutilisée ou nouvelle |
|---|---|---|
| C1a | `diagnostic` | Réutilisée |
| C1b | `spot` | Réutilisée |
| C1c | `placement` | Nouvelle |
| C1d | `sequence` | Réutilisée |
| C1e | `réglage` | Nouvelle |
| C1f | `sequence` | Réutilisée |
| C1g | `balayage` | Nouvelle |
| C1h | `trajectory` | Réutilisée |
| C1i | `diagnostic` | Réutilisée |
| C2a | `balayage` | Nouvelle |
| C2b | `réglage` | Nouvelle |
| C2c | `placement` | Nouvelle |
| C2d | `trajectory` | Réutilisée |
| C2e | `placement` | Nouvelle |
| C2f | `anticipation` | Nouvelle |
| C2g | `sequence` | Réutilisée |
| C2h | `trajectory` | Réutilisée |
| C3a | `spot` | Réutilisée |
| C3b | `placement` | Nouvelle |
| C3c | `réglage` | Nouvelle |
| C3d | `réaction engagée` | Nouvelle |
| C3e | `placement` | Nouvelle |
| C3f | `sequence` | Réutilisée |
| C3g | `balayage` | Nouvelle |
| C4a | `trajectory` | Réutilisée |
| C4b | `trajectory` | Réutilisée |
| C4c | `réglage` | Nouvelle |
| C4d | `réaction engagée` | Nouvelle |
| C4e | `placement` | Nouvelle |
| C4f | `sequence` | Réutilisée |
| C4g | `diagnostic` | Réutilisée |

## Mécaniques nouvelles à construire par rentabilité

1. **`placement` : 6 compétences.** C1c, C2c, C2e, C3b, C3e et C4e. Un seul moteur de glissement avec trois zones d'ancrage couvre position du siège, placement sur la route, distances et insertion.
2. **`réglage` : 4 compétences.** C1e, C2b, C3c et C4c. Un curseur à trois crans suffit pour dosage, allure, douceur de correction et usage de l'élan.
3. **`balayage` : 3 compétences.** C1g, C2a et C3g. Une fenêtre de regard et une phase finale de désignation couvrent inspection, prise d'information et recherche des dangers masqués.
4. **`réaction engagée` : 2 compétences.** C3d et C4d. Le doigt déjà posé crée une rupture d'attention crédible, mais le délai reste hors certification.
5. **`anticipation` : 1 compétence.** C2f. C'est la moins rentable en nombre, mais la seule qui vérifie proprement un créneau temporel sans transformer la réponse en test de réflexe.
