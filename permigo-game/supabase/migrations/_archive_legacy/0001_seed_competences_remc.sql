-- ═══════════════════════════════════════════════════════════════
-- Seed : 31 sous-compétences REMC officielles (Référentiel pour l'Éducation à la Mobilité Citoyenne)
-- ═══════════════════════════════════════════════════════════════
-- Source : Arrêté du 13 mai 2013 (révisé)
-- 4 mondes = 4 compétences principales du REMC
-- ═══════════════════════════════════════════════════════════════

insert into public.competences_remc (id, code, nom, description, monde, ordre, prerequis) values

-- ─── MONDE 1 : Maîtriser le maniement du véhicule (Campagne) ────
('C01.1', 'C1.1', 'Connaître les principaux organes et commandes du véhicule', 'Identifier et utiliser les commandes essentielles : volant, pédales, levier de vitesse, frein à main.', 1, 1, array[]::text[]),
('C01.2', 'C1.2', 'Démarrer et s''arrêter en douceur', 'Maîtriser le démarrage progressif et l''arrêt sans à-coups.', 1, 2, array['C01.1']),
('C01.3', 'C1.3', 'Doser l''accélération et le freinage', 'Adapter l''accélération et le freinage aux situations rencontrées.', 1, 3, array['C01.2']),
('C01.4', 'C1.4', 'Utiliser la boîte de vitesses', 'Passer les rapports de manière fluide en adaptant à la vitesse et au régime moteur.', 1, 4, array['C01.2']),
('C01.5', 'C1.5', 'Diriger la voiture en avant et marche arrière', 'Contrôler la trajectoire en marche avant et en marche arrière.', 1, 5, array['C01.2']),
('C01.6', 'C1.6', 'Réguler son allure en circulation', 'Adapter sa vitesse aux conditions de circulation.', 1, 6, array['C01.3']),
('C01.7', 'C1.7', 'Maintenir une trajectoire stable', 'Tenir une trajectoire correcte sans dévier.', 1, 7, array['C01.5']),

-- ─── MONDE 2 : Appréhender la route et circuler dans des conditions normales (Ville) ───
('C02.1', 'C2.1', 'Rechercher la signalisation et les indices utiles', 'Lire la route, anticiper les éléments visuels (panneaux, marquages au sol, autres usagers).', 2, 8, array['C01.6']),
('C02.2', 'C2.2', 'Positionner le véhicule sur la chaussée', 'Choisir la voie et la position adaptées à la situation.', 2, 9, array['C01.7']),
('C02.3', 'C2.3', 'Adapter son allure aux situations', 'Ralentir, accélérer, s''arrêter en fonction du contexte.', 2, 10, array['C01.6']),
('C02.4', 'C2.4', 'Tourner à droite et à gauche en agglomération', 'Effectuer des virages en ville en respectant priorités et signalisation.', 2, 11, array['C02.2']),
('C02.5', 'C2.5', 'Détecter, identifier et franchir les intersections', 'Reconnaître les types d''intersections et les franchir correctement.', 2, 12, array['C02.1']),
('C02.6', 'C2.6', 'Franchir les ronds-points et giratoires', 'Aborder, circuler et sortir des giratoires en respectant les règles de priorité.', 2, 13, array['C02.5']),
('C02.7', 'C2.7', 'S''arrêter et stationner en sécurité', 'Choisir un emplacement légal et exécuter le stationnement sans gêner.', 2, 14, array['C02.2']),
('C02.8', 'C2.8', 'Communiquer avec les autres usagers', 'Utiliser les clignotants, klaxon, regards et gestes pour communiquer.', 2, 15, array['C02.1']),

-- ─── MONDE 3 : Circuler dans des conditions difficiles et partager la route (Montagne) ───
('C03.1', 'C3.1', 'Évaluer et maintenir les distances de sécurité', 'Calculer et conserver la distance par rapport au véhicule précédent.', 3, 16, array['C02.3']),
('C03.2', 'C3.2', 'Croiser, dépasser, être dépassé', 'Effectuer des dépassements et croisements en sécurité.', 3, 17, array['C03.1']),
('C03.3', 'C3.3', 'Passer des virages et conduire en déclivité', 'Adapter sa conduite aux virages et aux pentes (montée/descente).', 3, 18, array['C01.7']),
('C03.4', 'C3.4', 'Connaître les caractéristiques des autres usagers (piétons, deux-roues, poids lourds)', 'Anticiper le comportement des autres usagers vulnérables ou imposants.', 3, 19, array['C02.8']),
('C03.5', 'C3.5', 'S''insérer, circuler et sortir d''une voie rapide ou d''autoroute', 'Maîtriser l''insertion, le maintien à allure stable et la sortie sur voies rapides.', 3, 20, array['C03.2']),
('C03.6', 'C3.6', 'Conduire dans une file', 'Suivre un véhicule en respectant les distances et l''allure du groupe.', 3, 21, array['C03.1']),
('C03.7', 'C3.7', 'Conduire de nuit ou par visibilité réduite', 'Utiliser correctement les feux et adapter sa conduite (brouillard, pluie, nuit).', 3, 22, array['C03.4']),
('C03.8', 'C3.8', 'Conduire en présence d''intempéries (pluie, neige, verglas)', 'Adapter sa conduite et ses réactions aux conditions climatiques difficiles.', 3, 23, array['C03.3']),

-- ─── MONDE 4 : Pratiquer une conduite autonome, sûre et économique (Sommet) ───
('C04.1', 'C04.1', 'Suivre un itinéraire de manière autonome', 'Mémoriser et suivre un trajet sans guidage permanent.', 4, 24, array['C03.5']),
('C04.2', 'C04.2', 'Préparer et effectuer un voyage longue distance en autonomie', 'Planifier un trajet long (pauses, carburant, météo).', 4, 25, array['C04.1']),
('C04.3', 'C04.3', 'Connaître les principaux facteurs de risque au volant et les recommandations à appliquer', 'Identifier et anticiper alcool, drogues, fatigue, distraction.', 4, 26, array['C03.4']),
('C04.4', 'C04.4', 'Connaître les comportements à adopter en cas d''accident', 'Protéger, alerter, secourir dans l''ordre.', 4, 27, array['C04.3']),
('C04.5', 'C04.5', 'Faire l''expérience des aides à la conduite (ESP, ABS, régulateur)', 'Comprendre et utiliser les aides modernes à la conduite.', 4, 28, array['C03.7']),
('C04.6', 'C04.6', 'Pratiquer une éco-conduite', 'Adopter une conduite économe en carburant et respectueuse de l''environnement.', 4, 29, array['C01.3','C01.4']),
('C04.7', 'C04.7', 'Connaître les principaux contrôles d''entretien du véhicule', 'Vérifier pneus, niveaux, éclairage, etc.', 4, 30, array['C01.1']),
('C04.8', 'C04.8', 'Avoir des notions sur l''entretien et le dépannage', 'Réagir à une panne courante (crevaison, batterie).', 4, 31, array['C04.7']);

-- Total = 31 sous-compétences (7 + 8 + 8 + 8)
