-- ═══════════════════════════════════════════════════════════════
-- Migration 0006 — Seed questions Monde 1 (C1a → C1d)
-- 3 post_validation + 2 consolidation par compétence = 20 questions
-- Niveau réaliste Code de la Route français
-- difficulty : 1=facile  2=moyen  3=difficile
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions_competence
  (competence_id, type, question, options, correct_index, explanation, difficulty)
VALUES

-- C1a : Connaître et respecter les règles de priorité
('C1a', 'post_validation',
 'À une intersection sans signalisation, quelle est la règle générale de priorité ?',
 '["Priorité à gauche","Priorité à droite","Priorité au plus gros véhicule","Priorité à celui qui arrive en premier"]',
 1, 'En France, la règle de base est la priorité à droite : tout conducteur doit céder le passage au véhicule arrivant par sa droite.', 1),

('C1a', 'post_validation',
 'Sur une route à double sens, un véhicule arrive en face et tourne à gauche. Que faites-vous ?',
 '["Je continue sans ralentir car j''ai la priorité","Je ralentis et laisse passer le véhicule","Je klaxonne pour signaler ma présence","Je me déporte sur le bas-côté"]',
 1, 'Un véhicule qui tourne à gauche doit céder le passage aux véhicules venant en sens inverse.', 2),

('C1a', 'post_validation',
 'Qu''indique un panneau triangulaire rouge avec un X blanc au centre ?',
 '["Priorité absolue","Intersection avec priorité à droite","Passage à niveau sans barrières","Stop obligatoire"]',
 1, 'Ce panneau (AB3) signale une intersection où la règle de priorité à droite s''applique. Il ne confère aucune priorité à celui qui le rencontre.', 2),

('C1a', 'consolidation',
 'Une route est signalée "route prioritaire" (panneau jaune losangique). Cela signifie que :',
 '["Vous devez céder le passage à toutes les intersections","Vous êtes prioritaire sur les routes qui croisent la vôtre","Vous pouvez rouler plus vite","Les piétons doivent vous céder le passage"]',
 1, 'Le panneau "route prioritaire" (B15) vous indique que vous avez la priorité à toutes les intersections, sauf indication contraire.', 1),

('C1a', 'consolidation',
 'À un carrefour giratoire, qui est prioritaire ?',
 '["Les véhicules qui entrent dans le giratoire","Les véhicules déjà engagés dans le giratoire","Les véhicules venant de droite","Les poids lourds"]',
 1, 'Dans un giratoire, les véhicules déjà engagés sont prioritaires sur ceux qui souhaitent entrer.', 1),

-- C1b : Maîtriser la distance de sécurité
('C1b', 'post_validation',
 'Quelle est la distance de sécurité minimale recommandée entre deux véhicules à 90 km/h ?',
 '["25 mètres","50 mètres (règle des 2 secondes)","100 mètres","10 mètres"]',
 1, 'À 90 km/h, un véhicule parcourt 25 m/s. La règle des 2 secondes représente donc environ 50 mètres.', 1),

('C1b', 'post_validation',
 'Par temps de pluie, comment adapte-t-on la distance de sécurité ?',
 '["On la maintient identique","On la double car la distance de freinage augmente","On la réduit car les freins sont plus efficaces","On la réduit de moitié"]',
 1, 'Par temps de pluie, la distance de freinage peut doubler. On doit donc au minimum doubler la distance de sécurité.', 1),

('C1b', 'post_validation',
 'Un véhicule roule à 130 km/h. Quelle distance parcourt-il pendant le temps de réaction moyen (1 seconde) ?',
 '["13 mètres","36 mètres","50 mètres","100 mètres"]',
 1, 'À 130 km/h = 36 m/s. En 1 seconde de réaction, le véhicule parcourt environ 36 mètres avant que le conducteur n''appuie sur la pédale de frein.', 2),

('C1b', 'consolidation',
 'Sur autoroute, quelle est la distance de sécurité légale minimale imposée par le Code de la route ?',
 '["Distance correspondant à 2 secondes de trajet","50 mètres fixes","Distance correspondant à 1 seconde","100 mètres fixes"]',
 0, 'Le Code de la route impose sur autoroute une distance correspondant au moins à 2 secondes de trajet.', 2),

('C1b', 'consolidation',
 'Sur une chaussée verglacée, la distance de freinage est multipliée par :',
 '["2","4 à 10","1,5","3"]',
 1, 'Sur verglas, la distance de freinage peut être multipliée par 4 à 10 selon la vitesse et la température.', 3),

-- C1c : Respecter les limitations de vitesse
('C1c', 'post_validation',
 'Quelle est la limitation de vitesse maximale sur autoroute par temps sec pour un conducteur expérimenté ?',
 '["110 km/h","130 km/h","150 km/h","120 km/h"]',
 1, 'Sur autoroute, la vitesse maximale est de 130 km/h par temps sec, ramenée à 110 km/h par temps de pluie ou en période probatoire.', 1),

('C1c', 'post_validation',
 'En agglomération, quelle est la limitation de vitesse par défaut si aucun panneau ne l''indique ?',
 '["30 km/h","50 km/h","70 km/h","45 km/h"]',
 1, 'En agglomération, la vitesse maximale autorisée est de 50 km/h sauf indication contraire.', 1),

('C1c', 'post_validation',
 'Un conducteur en permis probatoire (moins de 3 ans de permis) roule sur autoroute par temps sec. Sa limite est :',
 '["130 km/h","110 km/h","100 km/h","120 km/h"]',
 1, 'Durant la période probatoire, la vitesse maximale sur autoroute est de 110 km/h, même par temps sec.', 2),

('C1c', 'consolidation',
 'Sur une route bidirectionnelle sans séparateur central hors agglomération, quelle est la vitesse maximale depuis 2018 ?',
 '["90 km/h","100 km/h","110 km/h","80 km/h"]',
 3, 'Depuis 2018, la vitesse maximale est de 80 km/h sur ce type de route. Certaines peuvent être remontées à 90 km/h par arrêté du conseil départemental.', 2),

('C1c', 'consolidation',
 'À partir de quel excès de vitesse y a-t-il rétention immédiate du permis ?',
 '["20 km/h au-dessus de la limite","30 km/h au-dessus de la limite","50 km/h au-dessus de la limite","40 km/h au-dessus de la limite"]',
 2, 'Un excès de 50 km/h ou plus entraîne une rétention immédiate du permis et l''immobilisation du véhicule.', 3),

-- C1d : Utiliser correctement ses feux
('C1d', 'post_validation',
 'Dans quelles conditions doit-on allumer ses feux de croisement en journée ?',
 '["Jamais, ils sont réservés à la nuit","Par temps de pluie, brouillard ou visibilité réduite","Uniquement en tunnel","Uniquement sur autoroute"]',
 1, 'Les feux de croisement sont obligatoires de nuit mais aussi le jour dès que la visibilité est réduite : pluie, brouillard, tunnel, neige.', 1),

('C1d', 'post_validation',
 'À quelle distance minimale doit-on passer des feux de route aux feux de croisement en croisant un véhicule ?',
 '["100 mètres","150 mètres","200 mètres","50 mètres"]',
 1, 'On doit passer en feux de croisement au moins 150 mètres avant de croiser un véhicule, et également lors de dépassements.', 2),

('C1d', 'post_validation',
 'Les feux de brouillard arrière (rouge) doivent être utilisés :',
 '["Par temps de pluie légère","Lorsque la visibilité est inférieure à 50 mètres","Dès qu''il pleut","Uniquement de nuit"]',
 1, 'Les feux de brouillard arrière ne doivent être utilisés que lorsque la visibilité est inférieure à 50 mètres. Leur usage abusif éblouit les conducteurs suiveurs.', 2),

('C1d', 'consolidation',
 'Les feux de détresse (warning) peuvent être utilisés :',
 '["Pour se garer en double file","En cas de panne, d''accident ou de danger soudain","Pour remercier un conducteur","Pour signaler un radar"]',
 1, 'Les feux de détresse servent exclusivement à signaler un danger immédiat : panne, accident, arrêt d''urgence.', 1),

('C1d', 'consolidation',
 'L''utilisation des feux de route (pleins phares) est interdite :',
 '["Sur les voies non éclairées","Lorsque l''on suit ou croise un autre véhicule","En rase campagne par temps clair","Sur les routes sans éclairage public"]',
 1, 'Les feux de route sont interdits lorsqu''on suit un autre véhicule ou lorsqu''on en croise un. On doit alors passer en feux de croisement.', 1)

ON CONFLICT DO NOTHING;
