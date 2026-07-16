-- ═══════════════════════════════════════════════════════════════
-- 20260716230000 — Seed : 124 questions post_validation (4 par compétence)
--
-- Contexte : chaque compétence n'avait que 2 questions post_validation alors
-- que le quiz de validation autonome (valider-seul.js) en annonce 5 et que le
-- moteur (quiz-engine.js) en tire jusqu'à 5. Conséquences : l'UI mentait, et
-- rater le quiz = revoir immédiatement les 2 mêmes questions.
-- Après ce seed : 6 questions par compétence (2 existantes + 4 nouvelles),
-- rédigées à partir des fiches de conduite du repo (src/data/fiches-conduite.js),
-- même style que l'existant (situation concrète, tutoiement, 3 options,
-- explication mémorable, difficulty 2). Relecture humaine-équivalente :
-- règles du code vérifiées question par question avant seed.
--
-- Idempotent : garde NOT EXISTS sur (competence_id, type, question) —
-- ré-appliquer ne crée aucun doublon.
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.questions_competence
  (competence_id, type, question, options, correct_index, explanation, difficulty)
SELECT t.competence_id, 'post_validation', t.question, t.options, t.correct_index, t.explanation, 2
FROM jsonb_to_recordset($json$
[
 {
  "competence_id": "C1a",
  "question": "Tu découvres les pédales pour la première fois. Laquelle est au milieu ?",
  "options": [
   "L'embrayage",
   "L'accélérateur",
   "Le frein"
  ],
  "correct_index": 2,
  "explanation": "De gauche à droite : embrayage, frein, accélérateur. Le frein au milieu, ça ne change jamais."
 },
 {
  "competence_id": "C1a",
  "question": "Tu mets le contact sans démarrer et tous les témoins s'allument d'un coup. C'est grave ?",
  "options": [
   "Non, c'est le test : ils vont s'éteindre",
   "Oui, panne électrique en vue",
   "Oui, il faut couper le contact"
  ],
  "correct_index": 0,
  "explanation": "La voiture fait son auto-contrôle au contact. Le vrai signal d'alarme, c'est un témoin qui RESTE allumé après."
 },
 {
  "competence_id": "C1a",
  "question": "Après le test des témoins, celui de l'huile reste allumé. Tu fais quoi ?",
  "options": [
   "Tu démarres, il s'éteindra en roulant",
   "Tu ne pars pas et tu le signales",
   "Tu attends cinq minutes et tu réessaies"
  ],
  "correct_index": 1,
  "explanation": "Huile, batterie, frein : un témoin qui reste allumé signale un défaut. On ne roule pas avec."
 },
 {
  "competence_id": "C1a",
  "question": "Tu veux faire un appel de phare pour prévenir quelqu'un. Quelle commande ?",
  "options": [
   "Le commodo de gauche",
   "Le commodo de droite",
   "Un bouton sur le tableau de bord"
  ],
  "correct_index": 0,
  "explanation": "Le commodo de gauche gère toute la lumière : croisement, route, appel de phare. La droite, c'est pour l'eau."
 },
 {
  "competence_id": "C1b",
  "question": "Tu règles la hauteur de ton siège. Quel repère malin du moniteur ?",
  "options": [
   "Toucher presque le plafond",
   "Abaisser le pare-soleil : tu dois voir la route en dessous",
   "Voir tout le capot"
  ],
  "correct_index": 1,
  "explanation": "Si le pare-soleil te cache la route, tu es assis trop bas. Ce petit test règle ta hauteur de regard en deux secondes."
 },
 {
  "competence_id": "C1b",
  "question": "Comment vérifies-tu que ton dossier est bien incliné ?",
  "options": [
   "Bras tendus à fond sur le volant",
   "Tu touches le pare-brise du bout des doigts",
   "Mains sur le volant, bras légèrement fléchis"
  ],
  "correct_index": 2,
  "explanation": "Bras tendus = trop loin, bras trop pliés = trop près. Légèrement fléchis, tu gardes force et précision pour tourner."
 },
 {
  "competence_id": "C1b",
  "question": "Dans tes rétros extérieurs, ta carrosserie doit occuper quelle place ?",
  "options": [
   "Juste un petit bout en bas, le reste pour la route",
   "La moitié du miroir",
   "Aucune, que de la route"
  ],
  "correct_index": 0,
  "explanation": "Vise environ 90 % de route : ta carrosserie n'est qu'un repère, pas le spectacle."
 },
 {
  "competence_id": "C1b",
  "question": "Tu règles l'appuie-tête. Son haut se place où ?",
  "options": [
   "Au niveau de ta nuque",
   "Au niveau du haut de ton crâne",
   "Le plus haut possible"
  ],
  "correct_index": 1,
  "explanation": "Haut de l'appuie-tête = haut du crâne. C'est lui qui protège ta nuque en cas de choc arrière."
 },
 {
  "competence_id": "C1c",
  "question": "Tu n'arrives pas à rouler bien droit. La première chose à corriger ?",
  "options": [
   "Serrer le volant plus fort",
   "Regarder loin devant, pas le capot",
   "Ralentir fortement"
  ],
  "correct_index": 1,
  "explanation": "Ton regard tire la voiture : tu vas là où tu regardes. Vise loin, la trajectoire se redresse toute seule."
 },
 {
  "competence_id": "C1c",
  "question": "Tu as le droit de croiser les mains sur le volant à quel moment ?",
  "options": [
   "Seulement en manœuvre lente, comme le créneau",
   "Dans tous les virages serrés",
   "Jamais, c'est interdit"
  ],
  "correct_index": 0,
  "explanation": "À vitesse normale, on tire-pousse sans croiser. Croiser les mains, c'est réservé au pas-à-pas des manœuvres."
 },
 {
  "competence_id": "C1c",
  "question": "En sortie de virage, le volant veut revenir tout seul. Tu le lâches ?",
  "options": [
   "Oui, il sait revenir droit",
   "Oui, mais en gardant une main dessus",
   "Non, tu le laisses revenir en le retenant"
  ],
  "correct_index": 2,
  "explanation": "Un volant lâché revient trop vite et trop loin. Tu l'accompagnes : lui travaille, toi tu contrôles."
 },
 {
  "competence_id": "C1c",
  "question": "En marche arrière, tu ne sais plus dans quel sens tourner le volant. Le repère qui sauve ?",
  "options": [
   "Toujours l'inverse de la marche avant",
   "Tu tournes côté trottoir",
   "Tu tournes le volant du côté où tu veux aller"
  ],
  "correct_index": 2,
  "explanation": "Marche avant ou arrière, c'est pareil : le volant va du côté où tu veux emmener la voiture. Fini les nœuds au cerveau."
 },
 {
  "competence_id": "C1d",
  "question": "Tu t'apprêtes à mettre le contact. Tu vérifies quoi d'abord ?",
  "options": [
   "Frein à main serré et levier au point mort",
   "Première enclenchée, prêt à partir",
   "Clim et autoradio éteints"
  ],
  "correct_index": 0,
  "explanation": "Point mort + frein à main = la voiture ne peut pas bondir au démarrage. Et embrayage enfoncé à fond pour lancer le moteur."
 },
 {
  "competence_id": "C1d",
  "question": "Tu freines pour un arrêt complet. À quel moment enfonces-tu l'embrayage ?",
  "options": [
   "Dès que tu commences à freiner",
   "Juste avant l'arrêt complet",
   "Après l'arrêt"
  ],
  "correct_index": 1,
  "explanation": "Trop tôt, tu roules en roue libre ; trop tard, tu cales. Juste avant l'arrêt, c'est le bon tempo."
 },
 {
  "competence_id": "C1d",
  "question": "Pour doser l'embrayage au millimètre, ton pied gauche fait comment ?",
  "options": [
   "Il appuie à plat, talon décollé",
   "Il pousse avec le talon",
   "Pointe du pied, talon ancré qui glisse au sol"
  ],
  "correct_index": 2,
  "explanation": "Le talon au sol, c'est ton pivot : tu retrouves le patinage toujours au même endroit. Talon décollé = plus de repère."
 },
 {
  "competence_id": "C1d",
  "question": "Tu restes immobilisé un moment après ton arrêt. Tu fais quoi ?",
  "options": [
   "Point mort et frein à main",
   "Tu restes en 1ère, embrayage enfoncé",
   "Tu laisses juste le pied sur le frein"
  ],
  "correct_index": 0,
  "explanation": "Point mort + frein à main : la voiture est verrouillée et ta jambe se repose. Rester débrayé longtemps fatigue tout le monde."
 },
 {
  "competence_id": "C1e",
  "question": "Tu vises 1500 tr/min mais l'aiguille grimpe à 2500. Ton geste ?",
  "options": [
   "Tu lâches complètement l'accélérateur",
   "Tu soulages un peu le pied sans lâcher, puis tu réajustes",
   "Tu freines pour faire redescendre"
  ],
  "correct_index": 1,
  "explanation": "Le dosage, c'est un peu plus, un peu moins — jamais tout ou rien. Lâcher d'un coup, c'est l'à-coup garanti."
 },
 {
  "competence_id": "C1e",
  "question": "Tu conduis en « accordéon » : j'accélère fort, je freine fort. La cause, en général ?",
  "options": [
   "Une voiture trop nerveuse",
   "Un mauvais réglage du siège",
   "Tu regardes trop près devant toi"
  ],
  "correct_index": 2,
  "explanation": "Regarde loin : tu vois les ralentissements arriver et tu n'as plus jamais à freiner brutalement. La douceur, c'est de l'anticipation."
 },
 {
  "competence_id": "C1e",
  "question": "Tu lâches l'accélérateur sans toucher le frein. Que fait la voiture ?",
  "options": [
   "Elle ralentit d'elle-même : c'est le frein moteur",
   "Elle continue à la même vitesse",
   "Elle cale au bout de quelques secondes"
  ],
  "correct_index": 0,
  "explanation": "Le frein moteur fait une partie du travail gratuitement. Lâche les gaz tôt, et tes freinages deviennent tout doux."
 },
 {
  "competence_id": "C1e",
  "question": "Ton moniteur te dit que tu as le « pied lourd ». Ça coûte quoi ?",
  "options": [
   "Rien, c'est juste un style",
   "Des à-coups, de la surconsommation et des passagers secoués",
   "Juste un peu d'essence en plus"
  ],
  "correct_index": 1,
  "explanation": "Le pied droit se pose en pointe et pousse tout doucement. Pied léger = conduite fluide et meilleure note à l'examen."
 },
 {
  "competence_id": "C1f",
  "question": "En voiture essence, vers quel régime passes-tu la vitesse supérieure ?",
  "options": [
   "Vers 1000 tr/min",
   "Vers 2500 tr/min",
   "Vers 4500 tr/min"
  ],
  "correct_index": 1,
  "explanation": "Le repère sonore d'abord : le moteur « monte ». En diesel, c'est plus tôt, autour de 2000 tr/min."
 },
 {
  "competence_id": "C1f",
  "question": "Tu lâches le levier au point mort : il se replace tout seul. Entre quels rapports ?",
  "options": [
   "Entre la 3e et la 4e",
   "Entre la 1ère et la 2e",
   "Devant la marche arrière"
  ],
  "correct_index": 0,
  "explanation": "C'est le ressort de rappel. Apprivoise-le : ta main s'appuie dessus pour trouver chaque rapport sans regarder."
 },
 {
  "competence_id": "C1f",
  "question": "Un virage serré arrive. Tu rétrogrades à quel moment ?",
  "options": [
   "En plein virage",
   "Juste après le virage",
   "Avant le virage, une fois que tu as ralenti"
  ],
  "correct_index": 2,
  "explanation": "On rétrograde parce qu'on a DÉJÀ ralenti, pas pour ralentir. Le bon rapport avant le virage te donne de la reprise en sortie."
 },
 {
  "competence_id": "C1f",
  "question": "En 4e à très basse allure, le moteur broute et « tousse ». Ça veut dire quoi ?",
  "options": [
   "Le rapport est trop haut : rétrograde",
   "Le moteur manque d'huile",
   "Tu accélères trop fort"
  ],
  "correct_index": 0,
  "explanation": "Rapport trop haut, le moteur tousse ; trop bas, il hurle. Le bon rapport, c'est un moteur à l'aise."
 },
 {
  "competence_id": "C1g",
  "question": "Tu veux vérifier tes feux stop avant de partir. Comment ?",
  "options": [
   "Quelqu'un regarde derrière pendant que tu appuies sur le frein",
   "Tu les regardes dans le rétro intérieur",
   "Tu tapotes dessus pour voir s'ils bougent"
  ],
  "correct_index": 0,
  "explanation": "Seul, le reflet dans une vitrine ou un mur peut aussi t'aider. Un feu stop mort = personne ne voit que tu freines."
 },
 {
  "competence_id": "C1g",
  "question": "À l'examen, la vérification s'accompagne de quoi ?",
  "options": [
   "D'un test de code de 5 questions",
   "De rien, c'est juste la vérification",
   "D'une question de sécurité routière et d'une notion de premiers secours"
  ],
  "correct_index": 2,
  "explanation": "Le trio de l'examen : une vérification, une question sécurité, une notion de secours. Prépare les trois, pas juste la première."
 },
 {
  "competence_id": "C1g",
  "question": "L'inspecteur te demande le niveau de lave-glace. Qu'attend-il vraiment ?",
  "options": [
   "Que tu récites la contenance du réservoir",
   "Que tu montres où il se trouve sous le capot",
   "Que tu cites la marque du liquide"
  ],
  "correct_index": 1,
  "explanation": "On montre, on ne récite pas. Désigner l'élément et faire le geste, c'est ça qui compte, à l'examen comme en vrai."
 },
 {
  "competence_id": "C1g",
  "question": "Tes optiques sont couvertes de boue. Tu pars quand même ?",
  "options": [
   "Oui, la boue partira en roulant",
   "Oui, tant qu'il fait jour",
   "Non, tu nettoies : tu éclaires moins et on te voit moins"
  ],
  "correct_index": 2,
  "explanation": "Optiques, vitres, plaques : propres avant de rouler. Être vu, c'est la moitié de la sécurité."
 },
 {
  "competence_id": "C1h",
  "question": "Le jour de l'examen, combien de manœuvres l'inspecteur t'impose-t-il ?",
  "options": [
   "Trois, tirées au sort",
   "Une seule, parmi six familles",
   "Aucune si tu conduis bien"
  ],
  "correct_index": 1,
  "explanation": "Une seule, mais tu ne choisis pas laquelle. La clé commune à toutes : savoir déplacer ta voiture en marche arrière."
 },
 {
  "competence_id": "C1h",
  "question": "Tu attaques un créneau. Tu t'arrêtes où par rapport à la voiture devant la place ?",
  "options": [
   "À sa hauteur, rétro contre rétro",
   "Un mètre derrière elle",
   "Le plus près possible du trottoir"
  ],
  "correct_index": 0,
  "explanation": "Rétro contre rétro, à bonne distance latérale : c'est ton point de départ. Ensuite, marche arrière très lente et petit quart de volant à droite."
 },
 {
  "competence_id": "C1h",
  "question": "Un vélo arrive pendant ton créneau. Qui passe ?",
  "options": [
   "Toi, tu as commencé la manœuvre",
   "Le premier arrivé",
   "Lui : en manœuvre, tu n'es jamais prioritaire"
  ],
  "correct_index": 2,
  "explanation": "En manœuvre, tu cèdes le passage à tout le monde. Tu t'arrêtes, tu laisses passer, tu reprends tranquillement."
 },
 {
  "competence_id": "C1h",
  "question": "Tu as du mal à voir le trottoir pendant ton créneau. Une astuce ?",
  "options": [
   "Ouvrir la portière pour regarder",
   "Incliner le rétro droit vers le bas, puis le remettre avant de repartir",
   "Te fier au bruit des roues"
  ],
  "correct_index": 1,
  "explanation": "Le rétro incliné te montre la roue et le trottoir. Pense juste à le remettre en place avant de repartir."
 },
 {
  "competence_id": "C1i",
  "question": "Tu repères une place en créneau sur le côté GAUCHE de la rue. Tu peux la prendre quand ?",
  "options": [
   "Jamais, c'est interdit",
   "Quand il n'y a personne derrière",
   "Uniquement si la rue est en sens unique"
  ],
  "correct_index": 2,
  "explanation": "En double sens, te garer à gauche te met à contre-sens. En sens unique, c'est permis."
 },
 {
  "competence_id": "C1i",
  "question": "Tu vas t'arrêter pour manœuvrer. Tu annonces comment ?",
  "options": [
   "Clignotant avant même de t'arrêter",
   "Feux de détresse une fois arrêté",
   "Un signe de la main suffit"
  ],
  "correct_index": 0,
  "explanation": "Le clignotant AVANT l'arrêt prévient ceux qui te suivent. Puis contrôles rétros, angle mort et vision directe."
 },
 {
  "competence_id": "C1i",
  "question": "Pourquoi refaire exactement la même procédure à chaque manœuvre ?",
  "options": [
   "Pour aller plus vite",
   "Pour repérer ce qui a raté et le corriger",
   "Parce que l'inspecteur l'exige"
  ],
  "correct_index": 1,
  "explanation": "Même base à chaque fois : quand ça rate, tu sais où. Si tu improvises, impossible de progresser."
 },
 {
  "competence_id": "C1i",
  "question": "Pendant la manœuvre du permis, qui te dit quand braquer ?",
  "options": [
   "L'inspecteur, étape par étape",
   "Ton moniteur depuis l'arrière",
   "Personne : tu décides et tu te corriges seul"
  ],
  "correct_index": 2,
  "explanation": "L'inspecteur ne guide pas. C'est justement ta capacité à décider et te corriger seul qu'il évalue."
 },
 {
  "competence_id": "C2a",
  "question": "Tu te rends compte que tu fixes la voiture devant toi depuis plusieurs secondes. Tu fais quoi ?",
  "options": [
   "Rien, la suivre des yeux suffit",
   "Tu relances ton regard : loin devant, trottoirs, rétros",
   "Tu la dépasses pour dégager ta vue"
  ],
  "correct_index": 1,
  "explanation": "Un œil qui se fige rate tout le reste : ton regard doit se poser ailleurs à peu près chaque seconde."
 },
 {
  "competence_id": "C2a",
  "question": "Ton moniteur te demande de commenter à voix haute tout ce que tu vois. Ça sert à quoi ?",
  "options": [
   "À forcer ton œil à chercher les indices et à anticiper",
   "À vérifier que tu connais les panneaux par cœur",
   "À meubler le silence pendant la leçon"
  ],
  "correct_index": 0,
  "explanation": "La conduite commentée entraîne le regard : ce que tu sais nommer, tu l'as vu à temps."
 },
 {
  "competence_id": "C2a",
  "question": "Tu roules tranquille, la route est calme. Quelles questions tournent en boucle dans ta tête ?",
  "options": [
   "« Quel rapport ? Quel régime moteur ? »",
   "« À combien je roule ? Depuis combien de temps ? »",
   "« Où suis-je maintenant ? Où est-ce que je veux aller ? »"
  ],
  "correct_index": 2,
  "explanation": "Ces deux questions gardent ton regard actif : il repart loin chercher la suite au lieu de s'endormir."
 },
 {
  "competence_id": "C2a",
  "question": "Tu traverses une rue bordée de voitures garées des deux côtés. Où vont tes yeux ?",
  "options": [
   "Sur le compteur, pour surveiller ta vitesse",
   "Tu tournes la tête pour balayer entre les voitures et les entrées",
   "Droit devant, sans bouger"
  ],
  "correct_index": 1,
  "explanation": "Bouger la tête, c'est photographier les endroits d'où peut surgir un piéton — les yeux seuls ne suffisent pas."
 },
 {
  "competence_id": "C2b",
  "question": "Un panneau annonce des travaux à 200 m. Tu ralentis quand ?",
  "options": [
   "Avant la zone, en relâchant simplement l'accélérateur",
   "Une fois entré dans la zone",
   "Au dernier moment, d'un bon coup de frein"
  ],
  "correct_index": 0,
  "explanation": "Lever le pied tôt suffit souvent : la voiture décélère toute seule, sans freinage brusque."
 },
 {
  "competence_id": "C2b",
  "question": "Route dégagée limitée à 80, et tu roules à 50 « pour être prudent ». Bonne idée ?",
  "options": [
   "Oui, moins vite c'est toujours plus sûr",
   "Oui, tant que personne ne klaxonne",
   "Non : trop lent gêne le flux, tu adaptes ton allure"
  ],
  "correct_index": 2,
  "explanation": "Adapter marche dans les deux sens : ramper sous la limite n'est pas un gage de sécurité."
 },
 {
  "competence_id": "C2b",
  "question": "Tout est calme, aucun danger en vue. Tu continues à lire les panneaux ?",
  "options": [
   "Non, tu reposes ton attention",
   "Oui : c'est ton échauffement avant les zones chargées",
   "Seulement les limitations de vitesse"
  ],
  "correct_index": 1,
  "explanation": "Aller chercher la signalisation loin, même au calme, garde l'œil entraîné pour quand ça se corse."
 },
 {
  "competence_id": "C2b",
  "question": "Tu abordes une côte assez raide. Tu gères l'accélérateur comment ?",
  "options": [
   "Tu anticipes un peu de gaz pour ne pas t'écrouler",
   "Tu gardes exactement le même pied qu'en plat",
   "Tu lâches tout : la côte régulera"
  ],
  "correct_index": 0,
  "explanation": "La vitesse se pilote avec le relief : un peu de gaz avant la montée, et tu la passes sans t'effondrer."
 },
 {
  "competence_id": "C2c",
  "question": "Tu doutes d'être bien centré dans ta voie. Tu vérifies comment ?",
  "options": [
   "Au ressenti : si ça semble bon, c'est bon",
   "En fixant le capot",
   "Avec tes rétros : l'écart à la ligne à gauche, à la bordure à droite"
  ],
  "correct_index": 2,
  "explanation": "Tes repères valent mieux que ta sensation : les rétros te donnent l'écart réel de chaque côté."
 },
 {
  "competence_id": "C2c",
  "question": "En roulant, tu jettes un coup d'œil bas pour te situer. Où « arrive » la bordure de droite quand tu es bien placé ?",
  "options": [
   "Tout au bord gauche du pare-brise",
   "À peu près au milieu de ton pare-brise",
   "Elle doit disparaître sous le capot"
  ],
  "correct_index": 1,
  "explanation": "Ce repère visuel remplace la sensation : bordure au milieu du pare-brise, tu es à ta place."
 },
 {
  "competence_id": "C2c",
  "question": "Par prudence, tu roules collé à la bordure de droite. Bon réflexe ?",
  "options": [
   "Non : trop à droite est aussi dangereux que trop au centre",
   "Oui, tu laisses un maximum de place aux autres",
   "Oui, sauf quand il pleut"
  ],
  "correct_index": 0,
  "explanation": "Frôler la bordure, les piétons et les vélos n'a rien de prudent : ta place, c'est le milieu de ta voie."
 },
 {
  "competence_id": "C2c",
  "question": "Dans un virage serré, tu te guides au rétro pour longer le trottoir. Fiable ?",
  "options": [
   "Oui, c'est le repère le plus précis",
   "Oui, à condition de rouler au pas",
   "Non : en courbe le rétro ment, tu risques de taper le trottoir"
  ],
  "correct_index": 2,
  "explanation": "En virage, l'arrière de ta voiture est plus loin de la bordure que l'avant : le rétro te fait corriger à tort."
 },
 {
  "competence_id": "C2d",
  "question": "Ta voiture broute et peine en plein virage. Qu'est-ce que tu as raté ?",
  "options": [
   "Le rétrogradage avant d'entrer : tu es en sous-régime",
   "Le clignotant à l'entrée du virage",
   "Le coup de frein au milieu de la courbe"
  ],
  "correct_index": 0,
  "explanation": "On rétrograde AVANT la courbe pour avoir de la force ; en sous-régime, tu peux caler en plein virage."
 },
 {
  "competence_id": "C2d",
  "question": "Le montant du pare-brise te cache l'intérieur du virage. Tu fais quoi ?",
  "options": [
   "Tu ralentis au pas en fixant le montant",
   "Tu te penches et tournes la tête pour garder la sortie en vue",
   "Tu suis le marquage au sol, ça suffira"
  ],
  "correct_index": 1,
  "explanation": "La trajectoire suit le regard : tu bouges le corps s'il le faut, mais tes yeux gardent la sortie."
 },
 {
  "competence_id": "C2d",
  "question": "Un pote te conseille la trajectoire « extérieur-intérieur-extérieur » comme en course. Au permis ?",
  "options": [
   "C'est la trajectoire de sécurité officielle",
   "Ça se fait, mais seulement dans les virages à droite",
   "Hors-sujet : tu restes sur ta voie, sans couper ni mordre"
  ],
  "correct_index": 2,
  "explanation": "La ligne de course, c'est pour le circuit ; au permis, la sécurité c'est rester lisible sur SA voie."
 },
 {
  "competence_id": "C2d",
  "question": "Tu as dû freiner en pleine courbe parce que tu es entré trop vite. Tu en retiens quoi ?",
  "options": [
   "Ralentir plus tôt, sur la portion droite, au prochain virage",
   "Freiner plus fort la prochaine fois dans la courbe",
   "Prendre le virage plus à l'intérieur"
  ],
  "correct_index": 0,
  "explanation": "Freiner en courbe, c'est le signal d'une anticipation ratée : la vitesse se règle AVANT, le volant se gère PENDANT."
 },
 {
  "competence_id": "C2e",
  "question": "Un tracteur roule au pas devant toi, mais un sommet de côte approche. Tu dépasses ?",
  "options": [
   "Oui, un tracteur c'est vite doublé",
   "Non : sans voir ce qui arrive en face, on ne double pas",
   "Oui, en klaxonnant pour prévenir"
  ],
  "correct_index": 1,
  "explanation": "Sommet de côte, virage, ligne continue : tu roulerais dans la voie d'en face sans voir qui arrive."
 },
 {
  "competence_id": "C2e",
  "question": "La voiture derrière te colle pour te pousser à doubler. Tu fais quoi ?",
  "options": [
   "Tu doubles vite pour t'en débarrasser",
   "Tu freines sec pour la calmer",
   "Tu ne cèdes pas : tu doubles seulement si TES conditions sont réunies"
  ],
  "correct_index": 2,
  "explanation": "C'est toi qui iras dans la voie d'en face, pas lui : la décision t'appartient à 100 %."
 },
 {
  "competence_id": "C2e",
  "question": "Tu croises un camion sur une route étroite. Tu gères comment ?",
  "options": [
   "Tu ralentis et tu serres à droite, sans frôler le bas-côté",
   "Tu t'arrêtes complètement à chaque fois",
   "Tu gardes le milieu : c'est à lui de serrer"
  ],
  "correct_index": 0,
  "explanation": "Ralentir et serrer raisonnablement à droite : l'espace passe, et tu reprends ta place une fois croisé."
 },
 {
  "competence_id": "C2e",
  "question": "Tu commences un dépassement puis tu hésites, à hauteur du véhicule. Il fallait quoi ?",
  "options": [
   "Rester à sa hauteur le temps d'observer",
   "Décider franchement AVANT : doubler ou renoncer, jamais hésiter au milieu",
   "Accélérer au-delà de la limite pour finir vite"
  ],
  "correct_index": 1,
  "explanation": "Un dépassement se joue avant de déboîter : une fois dans la voie d'en face, l'hésitation est ton pire ennemi."
 },
 {
  "competence_id": "C2f",
  "question": "Une voiture sort d'un parking sur ta droite. Tu lui laisses la priorité à droite ?",
  "options": [
   "Oui, tout ce qui vient de droite passe d'abord",
   "Oui, dès qu'elle est à moitié engagée",
   "Non : une sortie de parking n'est pas une rue, mais tu restes prudent"
  ],
  "correct_index": 2,
  "explanation": "Parking, résidence privée, trottoir surélevé : pas de priorité à droite — ceux qui en sortent ne sont pas prioritaires."
 },
 {
  "competence_id": "C2f",
  "question": "À une intersection, une haie te bouche complètement la vue à droite. Tu fais quoi ?",
  "options": [
   "Tu redescends en 1re s'il le faut, le temps de bien voir",
   "Tu passes vite pour dégager la zone",
   "Tu klaxonnes et tu t'engages"
  ],
  "correct_index": 0,
  "explanation": "L'inspecteur ne t'en voudra jamais de ralentir pour observer — il t'en voudra de passer à l'aveugle."
 },
 {
  "competence_id": "C2f",
  "question": "Feu vert, mais le carrefour est saturé : tu risques de rester coincé au milieu. Tu t'engages ?",
  "options": [
   "Oui, le feu est vert donc tu passes",
   "Non : on ne s'engage que si on peut dégager",
   "Oui, sinon tu perds ta priorité"
  ],
  "correct_index": 1,
  "explanation": "Vert ou pas, se retrouver bloqué au milieu paralyse tout le carrefour : tu attends de pouvoir traverser en entier."
 },
 {
  "competence_id": "C2f",
  "question": "Sur l'anneau du giratoire, ton clignotant droit s'est effacé tout seul avant ta sortie. Tu fais quoi ?",
  "options": [
   "Tant pis, la manœuvre est déjà annoncée",
   "Tu mets le gauche pour compenser",
   "Tu le remets aussitôt"
  ],
  "correct_index": 2,
  "explanation": "Sans clignotant, ceux qui attendent d'entrer croient que tu restes sur l'anneau : remets-le sans hésiter."
 },
 {
  "competence_id": "C2g",
  "question": "Ta manœuvre est finie mais ton clignotant clignote toujours. Grave ?",
  "options": [
   "Oui : les autres croient que tu vas encore tourner, tu le coupes",
   "Non, il finira par s'arrêter tout seul",
   "Non, un clignotant en trop ne gêne personne"
  ],
  "correct_index": 0,
  "explanation": "Un clignotant oublié envoie une fausse info : la communication, ça s'ouvre ET ça se referme."
 },
 {
  "competence_id": "C2g",
  "question": "Tu attends de t'engager sur une voie, clignotant bien visible. Ça sert à quoi, à l'arrêt ?",
  "options": [
   "À rien tant que tu ne bouges pas",
   "À montrer ton intention : ça rassure et on te laisse entrer plus facilement",
   "À réserver ta place légalement"
  ],
  "correct_index": 1,
  "explanation": "Un clignotant en évidence fait avancer la situation : les autres comprennent et s'adaptent."
 },
 {
  "competence_id": "C2g",
  "question": "Tu vas changer de direction. Combien de temps d'avance donnes-tu à ton clignotant ?",
  "options": [
   "Une demi-seconde, c'est suffisant",
   "Une trentaine de secondes",
   "Environ 3 secondes avant d'agir"
  ],
  "correct_index": 2,
  "explanation": "Trois secondes, c'est le temps qu'il faut à ceux qui te suivent pour comprendre et s'adapter."
 },
 {
  "competence_id": "C2g",
  "question": "Un enfant s'élance sur la chaussée devant une voiture qui ne l'a pas vu. Tu klaxonnes ?",
  "options": [
   "Oui : avertir d'un danger, c'est exactement son rôle",
   "Non, jamais en ville",
   "Non, un appel de phares suffit toujours"
  ],
  "correct_index": 0,
  "explanation": "Le klaxon n'est pas banni : il sert à ça — prévenir d'un danger immédiat, et rien d'autre."
 },
 {
  "competence_id": "C2h",
  "question": "La rue que tu devais prendre est barrée par des travaux. Ton réflexe ?",
  "options": [
   "Tu fais demi-tour immédiatement",
   "Tu continues calmement et tu reprends ton itinéraire plus loin",
   "Tu recules jusqu'à la dernière intersection"
  ],
  "correct_index": 1,
  "explanation": "Jamais de manœuvre dangereuse pour « rattraper » : on continue, on se replace en sécurité plus loin."
 },
 {
  "competence_id": "C2h",
  "question": "Rue commerçante bondée, les voitures derrière s'impatientent. Tu fais quoi ?",
  "options": [
   "Tu accélères un peu pour fluidifier",
   "Tu te gares pour laisser tout le monde passer",
   "Tu gardes ton allure : dans une zone piégeuse, tu ne te laisses pas presser"
  ],
  "correct_index": 2,
  "explanation": "L'impatience des autres ne réduit pas le danger : dans les zones chargées, c'est toi qui fixes l'allure."
 },
 {
  "competence_id": "C2h",
  "question": "Pressé par le trafic, tu es tenté de bâcler ton changement de voie. La bonne approche ?",
  "options": [
   "Tu déroules quand même l'ordre : contrôle, clignotant, angle mort, action",
   "Tu simplifies : clignotant et tu y vas",
   "Tu renonces à changer de voie tant qu'il y a du monde"
  ],
  "correct_index": 0,
  "explanation": "C'est justement l'ordre des gestes qui rend la conduite fluide : bâcler fait perdre plus qu'il ne fait gagner."
 },
 {
  "competence_id": "C2h",
  "question": "Tu viens de dépasser l'entrée du parking que tu visais. Tu passes la marche arrière sur la chaussée ?",
  "options": [
   "Oui, avec les warnings c'est couvert",
   "Non : tu continues et tu fais le tour pour revenir",
   "Oui, si tu regardes bien derrière"
  ],
  "correct_index": 1,
  "explanation": "La marche arrière en pleine rue, c'est le geste dangereux type : on continue et on revient en sécurité."
 },
 {
  "competence_id": "C3a",
  "question": "Tu pars en voiture à la nuit tombée et ton pare-brise est couvert de poussière. Tu fais quoi avant de rouler ?",
  "options": [
   "Tu nettoies vitres et phares",
   "Tu pars, ça se verra à peine",
   "Tu comptes sur les essuie-glaces en route"
  ],
  "correct_index": 0,
  "explanation": "Une vitre sale double les reflets la nuit : chaque phare d'en face devient un halo. Propre dehors, clair dedans."
 },
 {
  "competence_id": "C3a",
  "question": "Tu traverses une ville très éclairée en pleine nuit. Tes feux ?",
  "options": [
   "Éteints, les lampadaires suffisent",
   "Feux de croisement allumés",
   "Pleins phares pour bien voir"
  ],
  "correct_index": 1,
  "explanation": "La nuit, les feux de croisement s'allument partout, même sous les lampadaires : tu dois voir, mais surtout être vu."
 },
 {
  "competence_id": "C3a",
  "question": "Route de campagne sans éclairage, personne devant ni en face. Quels feux choisis-tu ?",
  "options": [
   "Les feux de croisement, par prudence",
   "Les feux de brouillard avant",
   "Les feux de route (pleins phares)"
  ],
  "correct_index": 2,
  "explanation": "Seul dans la nuit, les pleins phares font briller panneaux et balises réfléchissants : tu vois beaucoup plus loin. Tu rebaisses dès la moindre lueur."
 },
 {
  "competence_id": "C3a",
  "question": "La nuit, ton regard porte moins loin qu'en plein jour. Comment tu compenses ?",
  "options": [
   "Tu freines un peu plus tôt qu'en journée",
   "Tu suis de près les feux de la voiture devant",
   "Tu roules plus au centre de la chaussée"
  ],
  "correct_index": 0,
  "explanation": "Voir moins loin = agir en décalage : tu freines plus tôt et tu ré-accélères plus tard. Tes yeux gagnent le temps que la nuit leur vole."
 },
 {
  "competence_id": "C3b",
  "question": "Sous la pluie, la buée envahit ton pare-brise. Ton réflexe ?",
  "options": [
   "Tu ouvres la fenêtre et tu attends",
   "Tu mets clim + air chaud sur le pare-brise",
   "Tu essuies avec la main en roulant"
  ],
  "correct_index": 1,
  "explanation": "Le duo clim + air chaud chasse la buée en quelques secondes. Une vitre embuée te vole autant de visibilité que la pluie elle-même."
 },
 {
  "competence_id": "C3b",
  "question": "Il neige et tu suis une voiture. Quel écart tu laisses ?",
  "options": [
   "Jusqu'à 3 fois plus que d'habitude",
   "Le même que sous la pluie",
   "2 secondes, comme toujours"
  ],
  "correct_index": 0,
  "explanation": "Pluie = ×2, neige = jusqu'à ×3 : moins tes pneus accrochent, plus tu achètes de la distance devant."
 },
 {
  "competence_id": "C3b",
  "question": "Brouillard épais, tu ne vois qu'à 50 mètres environ. Tu roules à combien ?",
  "options": [
   "70 km/h",
   "90 km/h",
   "50 km/h maximum"
  ],
  "correct_index": 2,
  "explanation": "Retiens la règle des trois 50 : 50 m de visibilité → 50 km/h → 50 m d'écart."
 },
 {
  "competence_id": "C3b",
  "question": "Nuit de forte pluie sur une route déserte. Tu passes en pleins phares pour mieux voir ?",
  "options": [
   "Oui, il n'y a personne en face",
   "Non, tu restes en feux de croisement",
   "Oui, avec le brouillard arrière en plus"
  ],
  "correct_index": 1,
  "explanation": "Les pleins phares se réfléchissent sur les gouttes et te créent un mur d'éblouissement : tu verrais encore moins bien."
 },
 {
  "competence_id": "C3c",
  "question": "Le feu passe au vert sur une chaussée détrempée. Comment tu redémarres ?",
  "options": [
   "Franchement, pour dégager vite",
   "Comme sur sol sec",
   "En douceur, très progressivement"
  ],
  "correct_index": 2,
  "explanation": "Sur sol mouillé, un coup d'accélérateur suffit à faire patiner les roues. La souplesse, c'est ton adhérence."
 },
 {
  "competence_id": "C3c",
  "question": "Tu abordes un virage sur une chaussée glissante. Ton regard et ton pied font quoi ?",
  "options": [
   "Regard loin vers la sortie, pied levé",
   "Regard sur le capot, pied sur le frein",
   "Regard dans le rétro, pied sur l'accélérateur"
  ],
  "correct_index": 0,
  "explanation": "Le ralentissement s'est fait avant, en ligne droite : dans la courbe, tu tournes pied levé et ton regard trace la trajectoire."
 },
 {
  "competence_id": "C3c",
  "question": "Tu roules prudemment sur une route glissante. Qu'est-ce qui risque le plus de te faire partir en glissade ?",
  "options": [
   "Rouler à plus de 50 km/h",
   "Un geste brusque : volant, frein ou accélérateur",
   "Le poids de la voiture"
  ],
  "correct_index": 1,
  "explanation": "C'est le coup sec qui dépasse la petite accroche des pneus. Gestes lisses = la voiture reste collée à la route."
 },
 {
  "competence_id": "C3c",
  "question": "Un matin de gel, la route passe dans une zone encore à l'ombre. Pourquoi tu lèves le pied avant ?",
  "options": [
   "Le givre peut encore y tenir",
   "On voit moins bien à l'ombre",
   "Pour ménager le moteur froid"
  ],
  "correct_index": 0,
  "explanation": "L'ombre garde le gel quand le soleil a séché le reste. On repère à l'œil et on ralentit avant la zone, jamais dessus."
 },
 {
  "competence_id": "C3d",
  "question": "Freinage d'urgence : tu écrases le frein. À quel moment tu débrayes ?",
  "options": [
   "Avant de freiner, pour ne pas caler",
   "Juste avant que le moteur cale",
   "En même temps que le frein"
  ],
  "correct_index": 1,
  "explanation": "L'ordre est sacré : frein d'abord, embrayage ensuite. Tu débrayes seulement quand le moteur est sur le point de caler."
 },
 {
  "competence_id": "C3d",
  "question": "Tu as pilé, l'obstacle est évité, le danger est passé. Tu fais quoi de la pédale de frein ?",
  "options": [
   "Tu la relâches d'un coup",
   "Tu restes à fond encore quelques secondes",
   "Tu la relâches progressivement"
  ],
  "correct_index": 2,
  "explanation": "Le freinage d'urgence s'arrête avec le danger : on relâche en douceur et on reprend une conduite normale."
 },
 {
  "competence_id": "C3d",
  "question": "Ta voiture-école est équipée de l'ABS. Il sert à quoi pendant un freinage d'urgence ?",
  "options": [
   "Il empêche les roues de se bloquer",
   "Il freine à ta place",
   "Il raccourcit toujours la distance d'arrêt"
  ],
  "correct_index": 0,
  "explanation": "Roues non bloquées = voiture qui reste dirigeable : tu peux freiner à fond ET viser ton échappatoire."
 },
 {
  "competence_id": "C3d",
  "question": "Un ami te conseille de débrayer avant de freiner en urgence. Pourquoi c'est une mauvaise idée ?",
  "options": [
   "Ça use l'embrayage",
   "Tu perds le frein moteur au début du freinage",
   "Ça coupe l'ABS"
  ],
  "correct_index": 1,
  "explanation": "Débrayer trop tôt, c'est freiner avec un allié en moins : le frein moteur aide dès les premiers mètres. Frein d'abord, embrayage juste avant de caler."
 },
 {
  "competence_id": "C3e",
  "question": "Sur une voie rapide, tu croises le combo « cédez le passage » + « interdiction de tourner à gauche ». Ça annonce quoi ?",
  "options": [
   "Une aire de repos",
   "Un péage",
   "Une bande d'insertion"
  ],
  "correct_index": 2,
  "explanation": "Ce duo de panneaux annonce une insertion 9 fois sur 10. Dès que tu le vois, tu te prépares à accélérer."
 },
 {
  "competence_id": "C3e",
  "question": "La bande d'insertion devant toi est courte. Tu accélères sur quel rapport ?",
  "options": [
   "La 3e, pour garder de la reprise",
   "La 5e, pour la vitesse de pointe",
   "Le rapport le plus haut possible"
  ],
  "correct_index": 0,
  "explanation": "Bande courte = 3e : elle pousse fort pour atteindre vite l'allure du flux. Bande longue, tu peux passer la 4e."
 },
 {
  "competence_id": "C3e",
  "question": "L'autoroute s'élargit à 3 voies et la circulation est fluide. Tu roules sur quelle voie ?",
  "options": [
   "Celle du milieu, plus tranquille",
   "Celle de gauche, pour anticiper",
   "Celle de droite"
  ],
  "correct_index": 2,
  "explanation": "La droite est ta voie par défaut, même à 3 voies. Les autres ne servent qu'à dépasser, puis on revient."
 },
 {
  "competence_id": "C3e",
  "question": "En doublant un poids lourd, tu te retrouves à rouler à sa hauteur. Tu fais quoi ?",
  "options": [
   "Tu restes à sa hauteur, c'est confortable",
   "Tu accélères pour le dépasser franchement",
   "Tu piles pour repasser derrière"
  ],
  "correct_index": 1,
  "explanation": "À sa hauteur, tu vis dans ses angles morts. On ne s'installe jamais à côté d'un camion : on passe franchement, sans décélérer."
 },
 {
  "competence_id": "C3f",
  "question": "Bouchon complet dans un tunnel, tout le monde est à l'arrêt. Ton geste ?",
  "options": [
   "Tu laisses le moteur tourner",
   "Tu klaxonnes pour faire avancer",
   "Tu coupes le moteur"
  ],
  "correct_index": 2,
  "explanation": "Espace fermé = moteur coupé, on n'enfume pas tout le monde. Et en cas de souci, tu rejoins à pied la sortie de secours repérée."
 },
 {
  "competence_id": "C3f",
  "question": "Un matin froid et humide, tu arrives en sortie de pont. Tu te méfies de quoi ?",
  "options": [
   "De la chaussée, souvent plus glissante",
   "Du péage qui peut suivre",
   "De tes feux à rallumer"
  ],
  "correct_index": 0,
  "explanation": "Exposé au vent et au froid, le pont givre avant le reste de la route. La sortie de pont est un piège à adhérence."
 },
 {
  "competence_id": "C3f",
  "question": "Tu traverses un long tunnel, la circulation est fluide. Comment tu conduis ?",
  "options": [
   "Tu te rapproches des feux arrière devant toi",
   "Tu gardes ton allure et tes distances",
   "Tu ralentis fortement par prudence"
  ],
  "correct_index": 1,
  "explanation": "Dans un tunnel, on ne surprend personne : allure stable, écart maintenu — et jamais de demi-tour ni de marche arrière."
 },
 {
  "competence_id": "C3f",
  "question": "Un panneau annonce des rafales de vent avant un grand viaduc. Tu redoutes quoi ?",
  "options": [
   "Une crevaison",
   "De l'aquaplaning",
   "Un déport brutal sur le côté"
  ],
  "correct_index": 2,
  "explanation": "Sur un pont exposé, la rafale pousse la voiture d'un coup. Deux mains fermes sur le volant, prêt à corriger."
 },
 {
  "competence_id": "C3g",
  "question": "Ta rue de quartier enchaîne les ralentisseurs. Tu les passes comment ?",
  "options": [
   "En 2e, en douceur",
   "En 3e, sur l'élan",
   "En 1re, en accélérant entre chaque"
  ],
  "correct_index": 0,
  "explanation": "La 2e en douceur : assez lent pour amortir, assez souple pour ne pas secouer. En ville dense, l'allure réduite est ta marge numéro un."
 },
 {
  "competence_id": "C3g",
  "question": "Tu découvres un vélo devant toi, trop tard pour laisser 1 mètre d'écart. Tu fais quoi ?",
  "options": [
   "Tu le frôles en ralentissant",
   "Tu klaxonnes pour qu'il se serre",
   "Tu lèves le pied et tu restes derrière"
  ],
  "correct_index": 2,
  "explanation": "Pas d'écart = pas de dépassement. Tu patientes derrière lui jusqu'à avoir la place : quelques secondes contre un accident."
 },
 {
  "competence_id": "C3g",
  "question": "Un piéton pose un pied sur le passage devant toi. Tu fais quoi ?",
  "options": [
   "Tu t'arrêtes et tu le laisses traverser",
   "Tu passes vite avant qu'il avance",
   "Tu klaxonnes pour le prévenir"
  ],
  "correct_index": 0,
  "explanation": "Engagé d'un seul pas, le piéton a déjà la priorité. Tant qu'il est sur le passage, la route est à lui."
 },
 {
  "competence_id": "C3g",
  "question": "Dans les bouchons, le couloir de bus à ta droite est complètement vide. Tu peux y rouler ?",
  "options": [
   "Oui, s'il est vide",
   "Non, sauf autorisation marquée au sol",
   "Oui, en dehors des heures de pointe"
  ],
  "correct_index": 1,
  "explanation": "Vide ou pas, le couloir reste réservé aux bus. Seul un marquage au sol peut t'y autoriser."
 },
 {
  "competence_id": "C4a",
  "question": "Ton appli annonce des travaux possibles sur ton trajet de demain. Tu prévois quoi ?",
  "options": [
   "Tu repères un itinéraire de secours à l'avance",
   "Rien : le GPS recalculera tout seul en route",
   "Tu pars plus tôt pour passer avant les bouchons"
  ],
  "correct_index": 0,
  "explanation": "Un plan B repéré au calme vaut mieux qu'un recalcul improvisé à 90 km/h : route coupée, zéro panique, tu as déjà la solution."
 },
 {
  "competence_id": "C4a",
  "question": "Tu stresses à l'idée de te perdre sur un trajet inconnu. Le réflexe qui rassure le plus ?",
  "options": [
   "Fixer l'écran du GPS à chaque intersection",
   "Demander ton chemin dès que tu doutes",
   "Repérer avant de partir 2-3 repères visuels, genre « après la station, je sors »"
  ],
  "correct_index": 2,
  "explanation": "« Après le McDo, je tourne » : un repère visuel reste dans ta tête même si le GPS bug. C'est ton filet de sécurité."
 },
 {
  "competence_id": "C4a",
  "question": "Ton itinéraire passe par un gros échangeur inconnu. Tu le découvres quand ?",
  "options": [
   "Sur place, en suivant le flot des voitures",
   "Avant de partir, en le repérant sur la carte",
   "Au dernier moment, le GPS annoncera la voie"
  ],
  "correct_index": 1,
  "explanation": "Les zones piégeuses s'étudient au calme, pas à 90 km/h. Savoir ce qui t'attend, c'est déjà la moitié du travail."
 },
 {
  "competence_id": "C4a",
  "question": "Grand départ prévu demain matin. Tu vérifies quoi la veille ?",
  "options": [
   "Juste l'heure de départ pour éviter les bouchons",
   "Rien : les conditions changent tout le temps",
   "La météo, le trafic et les travaux annoncés"
  ],
  "correct_index": 2,
  "explanation": "Pas de surprise = pas de stress. Découvrir la neige ou la route barrée en roulant, c'est décider dans l'urgence."
 },
 {
  "competence_id": "C4b",
  "question": "Tu suis le GPS en ville. Pour garder les yeux sur la route, tu fais quoi ?",
  "options": [
   "Tu montes le son et tu laisses la voix te guider",
   "Tu regardes l'écran à chaque intersection pour être sûr",
   "Tu mémorises tout le trajet et tu coupes le GPS"
  ],
  "correct_index": 0,
  "explanation": "Le GPS te parle exactement pour ça : tes yeux restent dehors. L'écran, c'est un coup d'œil bref, pas un film."
 },
 {
  "competence_id": "C4b",
  "question": "Ta sortie est à droite dans 2 km et tu roules sur la voie de gauche. Tu t'y prends quand ?",
  "options": [
   "Au dernier moment, pour ne pas gêner ceux de droite",
   "Tout de suite : rétros, clignotant, et une voie à la fois",
   "Tu attends qu'une voiture te fasse signe de passer"
  ],
  "correct_index": 1,
  "explanation": "Plusieurs voies à traverser = on commence le plus tôt possible. Une voie à la fois, en douceur, jamais en diagonale."
 },
 {
  "competence_id": "C4b",
  "question": "Tu changes de voie sur voie rapide pour préparer ta sortie. Ta vitesse ?",
  "options": [
   "Tu freines un peu par prudence pendant la manœuvre",
   "Tu accélères fort pour te placer vite",
   "Tu la gardes stable et tu glisses sur la voie d'à côté"
  ],
  "correct_index": 2,
  "explanation": "Freiner sans raison surprend ceux qui te suivent. Un changement de voie, ça se glisse, ça ne se freine pas."
 },
 {
  "competence_id": "C4b",
  "question": "Un grand panneau de direction apparaît au loin sur la voie rapide. Tu le lis quand ?",
  "options": [
   "De loin, pour préparer ton placement en avance",
   "En passant dessous, c'est là qu'il est le plus lisible",
   "Pas besoin de le lire, le GPS gère"
  ],
  "correct_index": 0,
  "explanation": "Un panneau lu tôt = un placement en douceur. Lu trop tard, c'est le rabattement en catastrophe."
 },
 {
  "competence_id": "C4c",
  "question": "Tu t'arrêtes à un stop. C'est quoi, un freinage « dégressif » ?",
  "options": [
   "Freiner par petites touches répétées",
   "Freiner un peu plus fort au début, puis relâcher doucement à la fin",
   "Freiner franchement juste avant la ligne"
  ],
  "correct_index": 1,
  "explanation": "Fort au début, presque rien à la fin : tu t'arrêtes pile, sans secouer tes passagers ni surprendre ceux qui suivent."
 },
 {
  "competence_id": "C4c",
  "question": "En voiture essence, tu passes le rapport supérieur vers quel régime pour rester éco ?",
  "options": [
   "Vers 4000 tr/min, pour garder de la reprise",
   "Vers 1000 tr/min, le plus bas possible",
   "Vers 2500 tr/min"
  ],
  "correct_index": 2,
  "explanation": "2500 en essence, 2000 en diesel : le moteur reste bas et calme. À l'oreille : tu changes dès que tu le sens monter."
 },
 {
  "competence_id": "C4c",
  "question": "Belle ligne droite dégagée, tu roules en 4e. Côté conso, le bon geste ?",
  "options": [
   "Monter en 5e ou 6e",
   "Rester en 4e, le rapport passe-partout",
   "Redescendre en 3e pour garder de la reprise"
  ],
  "correct_index": 0,
  "explanation": "Plus le rapport est haut, plus le moteur tourne bas — et moins il boit. La 5e et la 6e sont faites pour ça."
 },
 {
  "competence_id": "C4c",
  "question": "Sur une longue départementale, la conduite qui consomme le moins ?",
  "options": [
   "Accélérer puis laisser filer, en boucle",
   "Une vitesse stable, sans à-coups",
   "Rouler 20 km/h sous la limite"
  ],
  "correct_index": 1,
  "explanation": "Chaque coup d'accélérateur ou de frein, c'est du carburant jeté. La régularité, c'est la sobriété."
 },
 {
  "competence_id": "C4d",
  "question": "Il pleut sur la voie rapide. Ta distance avec la voiture devant ?",
  "options": [
   "2 secondes, comme d'habitude",
   "3 longueurs de voiture",
   "4 secondes : le double de la normale"
  ],
  "correct_index": 2,
  "explanation": "Sous la pluie, tu doubles la règle des 2 secondes. La route glisse, tu vois moins bien : ta marge grandit avec le risque."
 },
 {
  "competence_id": "C4d",
  "question": "Tu longes une file de voitures garées en ville. Tu imagines quoi ?",
  "options": [
   "Une portière qui s'ouvre ou un piéton qui surgit entre deux voitures",
   "Rien de spécial : elles sont à l'arrêt",
   "Qu'il faut serrer à droite pour laisser la place aux autres"
  ],
  "correct_index": 0,
  "explanation": "« Imagine le pire raisonnable » : si tu l'as prévu, tu ne freines pas en urgence — tu étais déjà prêt."
 },
 {
  "competence_id": "C4d",
  "question": "Long trajet monotone sur nationale. Tes yeux font quoi ?",
  "options": [
   "Ils se posent sur la voiture devant, c'est la référence",
   "Ils vérifient les rétros toutes les cinq minutes",
   "Ils balayent en continu : loin devant, les côtés, les rétros"
  ],
  "correct_index": 2,
  "explanation": "L'info se prend AVANT que ça devienne un problème. Le balayage, c'est ton radar permanent."
 },
 {
  "competence_id": "C4d",
  "question": "L'énervement monte dans les bouchons. Tu fais quoi ?",
  "options": [
   "Tu changes de file dès qu'une avance plus vite",
   "Tu respires un bon coup et tu acceptes que ça n'avance pas",
   "Tu klaxonnes un coup pour évacuer"
  ],
  "correct_index": 1,
  "explanation": "Conduire énervé, c'est décider mal. Sauter de file en file ne fait rien gagner et multiplie les risques."
 },
 {
  "competence_id": "C4e",
  "question": "Ton feu est vert, un piéton attend à son feu rouge. Tu t'arrêtes pour le laisser passer ?",
  "options": [
   "Non : il n'est pas prioritaire, s'arrêter là serait un arrêt injustifié",
   "Oui, un piéton passe toujours en premier",
   "Oui, mais seulement si personne ne te suit"
  ],
  "correct_index": 0,
  "explanation": "La gentillesse mal placée devient une faute : celui qui te suit ne s'attend pas à ton arrêt. Prioritaire = tu laisses ; pas prioritaire = tu passes."
 },
 {
  "competence_id": "C4e",
  "question": "Tu vas tourner à droite en ville. Juste avant de tourner, tu vérifies quoi en plus des rétros ?",
  "options": [
   "Que ton clignotant fonctionne bien",
   "Le rétro intérieur une deuxième fois",
   "Ton angle mort : un vélo ou une trottinette s'y glisse vite"
  ],
  "correct_index": 2,
  "explanation": "Le rétro ne voit pas tout. Le coup d'œil angle mort, c'est LA vérif qui sauve le cycliste qui remonte la file."
 },
 {
  "competence_id": "C4e",
  "question": "Un bus est à l'arrêt sur ta droite, tu vas le dépasser. Le vrai danger ?",
  "options": [
   "Que le bus redémarre avant ton passage",
   "Un piéton qui surgit devant ou derrière le bus",
   "Aucun, si ta voie est libre"
  ],
  "correct_index": 1,
  "explanation": "Un bus, c'est un mur qui cache des piétons pressés. Tu ralentis et tu passes prêt à freiner."
 },
 {
  "competence_id": "C4e",
  "question": "Sortie d'école, des enfants sur le trottoir. Tu adaptes quoi ?",
  "options": [
   "Tu roules très lentement, pied prêt sur le frein",
   "Tu klaxonnes doucement pour signaler ta présence",
   "Tu gardes le 30 affiché : c'est déjà réduit"
  ],
  "correct_index": 0,
  "explanation": "Un enfant s'élance sans vérifier : c'est TOI qui anticipes ses erreurs. Plus l'usager est fragile, plus ta marge grandit."
 },
 {
  "competence_id": "C4f",
  "question": "L'inspecteur te demande de te ranger pour une manœuvre. Le clignotant, c'est quand ?",
  "options": [
   "Une fois arrêté, juste avant de reculer",
   "Pas besoin : la manœuvre est demandée par l'inspecteur",
   "Avant de t'arrêter le long du trottoir"
  ],
  "correct_index": 2,
  "explanation": "Le clignotant AVANT l'arrêt prévient ceux qui te suivent. Mis après, ils ont déjà été surpris."
 },
 {
  "competence_id": "C4f",
  "question": "Installé au poste, tu rebouges ton siège après avoir réglé les rétros. Tu fais quoi ?",
  "options": [
   "Rien, les rétros étaient déjà bons",
   "Tu re-règles les rétros derrière",
   "Tu les ajusteras en roulant, au premier feu"
  ],
  "correct_index": 1,
  "explanation": "Siège bougé = yeux déplacés = rétros faux. L'ordre est libre, mais le siège d'abord, les rétros toujours après."
 },
 {
  "competence_id": "C4f",
  "question": "Tu n'as pas bien compris la consigne de l'inspecteur. Tu fais quoi ?",
  "options": [
   "Tu demandes calmement de répéter",
   "Tu suis la direction qui te semble logique",
   "Tu ralentis fortement en attendant qu'il précise"
  ],
  "correct_index": 0,
  "explanation": "Faire répéter ne coûte aucun point. Deviner, si : tu roules stressé sur une consigne inventée."
 },
 {
  "competence_id": "C4f",
  "question": "Marche arrière pendant l'examen : tu regardes où ?",
  "options": [
   "Uniquement les rétros, c'est plus précis",
   "La caméra de recul, si la voiture en a une",
   "Partout : vision directe par les vitres, en plus des rétros"
  ],
  "correct_index": 2,
  "explanation": "Vitesse d'escargot et regard partout : l'inspecteur veut voir que TU vois. Les rétros seuls laissent des trous."
 },
 {
  "competence_id": "C4g",
  "question": "Permis probatoire et soirée entre amis : la limite d'alcool pour toi au volant ?",
  "options": [
   "0,5 g/l, comme tout le monde",
   "0,2 g/l — autant dire zéro verre",
   "Un verre, ça passe si tu manges avec"
  ],
  "correct_index": 1,
  "explanation": "0,2 g/l, c'est moins d'un verre : la vraie règle simple, c'est « celui qui conduit ne boit pas »."
 },
 {
  "competence_id": "C4g",
  "question": "Jeune conducteur sur une voie rapide à chaussées séparées limitée à 110. Tu roules à combien max ?",
  "options": [
   "110, comme le panneau",
   "90, par prudence",
   "100 km/h"
  ],
  "correct_index": 2,
  "explanation": "Probatoire = un cran en dessous : 110 au lieu de 130, 100 au lieu de 110, 80 au lieu de 90. Le panneau donne la limite des autres, pas la tienne."
 },
 {
  "competence_id": "C4g",
  "question": "Permis depuis une semaine, on te propose de conduire en centre-ville un vendredi soir. Tu n'es pas à l'aise. Tu fais quoi ?",
  "options": [
   "Tu refuses et tu commences par des petits trajets tranquilles",
   "Tu y vas : il faut bien se lancer un jour",
   "Tu y vas, mais très lentement pour compenser"
  ],
  "correct_index": 0,
  "explanation": "Le permis t'autorise à conduire, il ne t'oblige pas à foncer. Tu montes en difficulté à TON rythme : les premiers mois seul sont les plus risqués."
 },
 {
  "competence_id": "C4g",
  "question": "Permis en poche ! Les réflexes des leçons (contrôles, distances, zéro téléphone), tu en fais quoi ?",
  "options": [
   "Tu peux relâcher : l'examen est validé",
   "Tu les gardes : c'est ta vraie protection maintenant",
   "Tu les gardes seulement sur les grands axes"
  ],
  "correct_index": 1,
  "explanation": "L'inspecteur est parti, pas le danger. Une seule grosse infraction peut faire sauter un permis tout neuf à 6 points."
 }
]
$json$::jsonb)
  AS t(competence_id text, question text, options jsonb, correct_index int, explanation text)
WHERE NOT EXISTS (
  SELECT 1 FROM public.questions_competence q
  WHERE q.competence_id = t.competence_id
    AND q.type = 'post_validation'
    AND q.question = t.question
);
