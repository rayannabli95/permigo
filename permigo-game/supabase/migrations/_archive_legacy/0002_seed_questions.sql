-- ═══════════════════════════════════════════════════════════════
-- Seed : 30 questions starter pour MVP V1
-- ═══════════════════════════════════════════════════════════════
-- Distribuées sur 8 sous-compétences clés (les plus utilisées en début d'apprentissage)
-- Format : 3-5 questions par compétence
-- ═══════════════════════════════════════════════════════════════

-- ─── C01.2 — Démarrer et s'arrêter en douceur ───────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C01.2', 'Avant de démarrer le véhicule, quelle vérification est la plus importante ?',
  '["Régler le siège, le rétroviseur et boucler la ceinture", "Allumer la radio", "Vérifier le niveau d''essence", "Mettre le clignotant"]'::jsonb,
  0, 'Le réglage poste de conduite + ceinture est la base de la sécurité avant tout déplacement.', 1, 'post_validation'),

('C01.2', 'Pour démarrer en douceur sur du plat avec une boîte manuelle, tu dois :',
  '["Appuyer fort sur l''accélérateur d''un coup", "Relâcher progressivement l''embrayage en accélérant doucement", "Lâcher l''embrayage d''un coup sans accélérer", "Démarrer en 3ème vitesse"]'::jsonb,
  1, 'Le point de patinage progressif + une accélération douce évitent les à-coups et les calages.', 1, 'post_validation'),

('C01.2', 'Pour s''arrêter en douceur, l''ordre des actions est :',
  '["Embrayer, freiner, débrayer", "Lever le pied de l''accélérateur, freiner, puis débrayer juste avant l''arrêt", "Tirer le frein à main", "Passer au point mort directement"]'::jsonb,
  1, 'Le freinage moteur (lever le pied) précède le frein. Débrayer trop tôt fait perdre le freinage moteur.', 2, 'post_validation');

-- ─── C02.4 — Tourner en agglomération ───────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C02.4', 'Avant de tourner à droite en ville, quel est le contrôle PRINCIPAL à effectuer ?',
  '["L''angle mort droit (cycliste, deux-roues)", "Le rétroviseur gauche", "L''accélération", "La radio"]'::jsonb,
  0, 'Les cyclistes et deux-roues sont souvent dans l''angle mort droit. Un coup d''œil par-dessus l''épaule droite est obligatoire.', 1, 'post_validation'),

('C02.4', 'Pour tourner à gauche à un feu vert dans une intersection avec circulation en sens inverse :',
  '["Tu fonces dès que le feu passe au vert", "Tu attends que la voie soit libre en sens inverse, en restant au centre de l''intersection", "Tu klaxonnes pour qu''on te laisse passer", "Tu tournes en coupant la voie sans regarder"]'::jsonb,
  1, 'La priorité va aux véhicules en sens inverse. Tu attends sereinement, sans bloquer.', 2, 'post_validation'),

('C02.4', 'Quand mettre le clignotant avant de tourner en ville ?',
  '["Au moment où je tourne", "Environ 30-50 mètres avant l''intersection", "Une fois engagé dans le virage", "Pas besoin si la route est dégagée"]'::jsonb,
  1, '30-50m avant : assez tôt pour que les autres usagers anticipent, assez tard pour ne pas créer d''ambiguïté.', 1, 'post_validation'),

('C02.4', 'En tournant à droite sur une route avec piste cyclable :',
  '["J''ai la priorité sur le cycliste qui va tout droit", "Le cycliste qui va tout droit a la priorité, je dois céder le passage", "Je passe en premier si je suis plus rapide", "Le cycliste doit s''arrêter"]'::jsonb,
  1, 'Le cycliste qui poursuit tout droit a la priorité sur celui qui tourne — c''est la règle des priorités.', 2, 'consolidation');

-- ─── C02.6 — Giratoires et ronds-points ─────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C02.6', 'À l''approche d''un giratoire, quelle voie choisir si tu veux prendre la 1ère sortie (à droite) ?',
  '["La voie de droite", "La voie de gauche", "N''importe laquelle", "La voie centrale"]'::jsonb,
  0, 'Pour la 1ère sortie : voie de droite. Pour la dernière sortie ou demi-tour : voie de gauche.', 1, 'post_validation'),

('C02.6', 'Sur un giratoire à 2 voies, quand contrôler l''angle mort droit avant de sortir ?',
  '["Pas besoin, je suis sur un giratoire", "Juste avant de sortir, en plus du clignotant droit", "Uniquement à l''entrée du giratoire", "Après être sorti"]'::jsonb,
  1, 'Le contrôle de l''angle mort droit avant la sortie est ESSENTIEL : un véhicule peut être sur la voie de droite.', 2, 'post_validation'),

('C02.6', 'Sur un giratoire, qui a la priorité ?',
  '["Les véhicules qui veulent entrer", "Les véhicules qui sont déjà à l''intérieur du giratoire", "Le plus gros véhicule", "Le plus rapide"]'::jsonb,
  1, 'Sauf indication contraire (panneau Stop ou cédez-le-passage absent), les véhicules dans le giratoire ont la priorité.', 1, 'post_validation'),

('C02.6', 'Quand mettre le clignotant droit pour sortir d''un giratoire ?',
  '["Juste après être entré dans le giratoire", "Avant la sortie qui me précède (celle juste avant la mienne)", "Une fois sorti", "Pas besoin de clignotant dans un giratoire"]'::jsonb,
  1, 'Le clignotant droit s''active après avoir dépassé la sortie qui précède la tienne, pour signaler ton intention.', 2, 'consolidation'),

('C02.6', 'Sur un giratoire à 1 voie unique, comment se placer ?',
  '["À droite", "À gauche", "Au centre de la voie", "Peu importe"]'::jsonb,
  2, 'Avec 1 seule voie, tu te places au centre. Pas besoin de choisir entre droite et gauche.', 1, 'post_validation');

-- ─── C02.7 — Stationnement ──────────────────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C02.7', 'Quelle est la distance minimale légale entre ton véhicule stationné et un passage piéton ?',
  '["1 mètre", "3 mètres", "5 mètres", "10 mètres"]'::jsonb,
  2, '5 mètres minimum avant un passage piéton (article R417-10) pour ne pas masquer la visibilité aux automobilistes.', 2, 'post_validation'),

('C02.7', 'Pour un stationnement en créneau, par où commences-tu ?',
  '["Je me gare en marche avant", "Je me place parallèlement à la voiture devant la place, puis je recule", "Je me gare directement en marche arrière sans repère", "Je préfère chercher une autre place"]'::jsonb,
  1, 'La méthode classique : alignement parallèle avec la voiture devant, puis manœuvre en marche arrière avec contrôle des angles.', 1, 'post_validation'),

('C02.7', 'Tu te gares sur une pente descendante. Comment orienter tes roues ?',
  '["Roues droites", "Roues braquées vers la chaussée", "Roues braquées vers le trottoir", "Peu importe"]'::jsonb,
  2, 'En descente : roues vers le trottoir. Si le frein lâche, le véhicule cogne le trottoir avant de partir.', 3, 'consolidation');

-- ─── C03.1 — Distances de sécurité ──────────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C03.1', 'À 90 km/h sur route normale, quelle distance de sécurité minimale par rapport au véhicule devant ?',
  '["10 mètres", "30 mètres", "50 mètres", "100 mètres"]'::jsonb,
  2, '50m minimum (règle des 2 secondes) à 90 km/h. Méthode rapide : tu comptes "2 secondes" en passant un repère fixe que le véhicule devant vient de passer.', 1, 'post_validation'),

('C03.1', 'Sur autoroute par temps de pluie, comment ajuster ta distance de sécurité ?',
  '["Je la diminue car je freine plus court", "Je la double au minimum", "Je la garde identique", "Je colle au véhicule devant"]'::jsonb,
  1, 'La distance de freinage double sur chaussée mouillée. Donc distance de sécurité doublée minimum.', 2, 'post_validation'),

('C03.1', 'La règle des 2 secondes pour estimer la distance de sécurité, c''est :',
  '["Je dois mettre 2 secondes pour démarrer", "Je dois être à 2 secondes derrière le véhicule de devant", "Je dois klaxonner pendant 2 secondes", "Je dois clignoter pendant 2 secondes"]'::jsonb,
  1, 'Tu fixes un repère sur le bord de la route. Quand le véhicule devant le passe, tu comptes "21, 22". Tu dois finir avant de passer toi-même ce repère.', 1, 'consolidation');

-- ─── C03.2 — Croisement et dépassement ──────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C03.2', 'Avant de dépasser un véhicule, quel est l''ordre des contrôles ?',
  '["Clignotant, dépassement, rétro", "Rétro, angle mort, clignotant, dépassement, retour à droite avec clignotant droit", "Klaxon, dépassement", "Pas besoin de contrôles, je fonce"]'::jsonb,
  1, 'L''ordre R.A.C.E. : Rétroviseurs, Angle mort, Clignotant gauche, Exécution + retour. Indispensable à connaître.', 2, 'post_validation'),

('C03.2', 'Tu dépasses un cycliste hors agglomération. Quelle distance latérale minimum ?',
  '["50 cm", "1 mètre", "1,5 mètre", "Je passe contre lui pour gagner du temps"]'::jsonb,
  2, '1,5m hors agglomération (1m en ville). Obligatoire et contrôlé par la police.', 1, 'post_validation'),

('C03.2', 'Quand est-il INTERDIT de dépasser ?',
  '["En montée si la visibilité est insuffisante", "Sur un passage piéton ou à son approche", "Sur une ligne continue", "Toutes les réponses"]'::jsonb,
  3, 'Les trois sont strictement interdits. Toutes les réponses sont correctes.', 2, 'consolidation');

-- ─── C03.5 — Autoroute / voies rapides ──────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C03.5', 'Lors de l''insertion sur autoroute, depuis la voie d''accélération, tu dois :',
  '["T''arrêter au bout de la bande pour laisser passer les autres", "Atteindre la vitesse de circulation et t''insérer avec un clignotant gauche", "T''insérer en force sans regarder", "Klaxonner pour annoncer ton arrivée"]'::jsonb,
  1, 'La voie d''accélération sert à atteindre la vitesse du flux. Tu t''insères en cédant le passage à ceux qui sont déjà sur l''autoroute.', 1, 'post_validation'),

('C03.5', 'Vitesse maximale autorisée sur autoroute, sous la pluie, pour un permis probatoire (jeune conducteur) ?',
  '["130 km/h", "110 km/h", "100 km/h", "90 km/h"]'::jsonb,
  2, 'Pluie + permis probatoire : 100 km/h sur autoroute (au lieu de 110 km/h pour les conducteurs confirmés).', 2, 'post_validation'),

('C03.5', 'Sur autoroute, la bande d''arrêt d''urgence sert à :',
  '["Doubler par la droite", "S''arrêter uniquement en cas d''urgence (panne, malaise)", "Faire une pause pour téléphoner", "Pique-niquer"]'::jsonb,
  1, 'Strictement réservée aux urgences. Stationnement = lourdement sanctionné.', 1, 'consolidation');

-- ─── C04.3 — Facteurs de risque ─────────────────────────────────
insert into public.questions_competence (competence_id, question, options, correct_index, explanation, difficulty, type) values
('C04.3', 'Taux d''alcool maximum autorisé pour un permis probatoire (moins de 3 ans) :',
  '["0,5 g/L de sang", "0,2 g/L de sang", "0,8 g/L de sang", "Aucune limite"]'::jsonb,
  1, '0,2 g/L pour les permis probatoires = équivalent quasi-zéro. Premier verre de bière = dépassement.', 1, 'post_validation'),

('C04.3', 'Tu sens que tu te bats contre le sommeil au volant. Que faire ?',
  '["Mettre la radio à fond", "T''arrêter dès que possible (15-20 min de pause ou sieste)", "Boire un café et continuer", "Ouvrir la fenêtre"]'::jsonb,
  1, 'L''arrêt est la SEULE solution réellement efficace. Café/radio = effet placebo, le sommeil revient en 15 min.', 1, 'post_validation'),

('C04.3', 'Quelle distraction multiplie par 23 le risque d''accident selon les études ?',
  '["Régler la radio", "Manger", "Écrire un SMS en conduisant", "Boire un café"]'::jsonb,
  2, 'Texter en conduisant = quasi 5 secondes "yeux fermés" à 90 km/h (≈ 125m parcourus en aveugle). Risque ×23.', 2, 'consolidation');

-- ═══════════════════════════════════════════════════════════════
-- Total : 30 questions starter, sur 8 sous-compétences clés
-- À étendre à 120+ pour V2 (3-5 questions par sous-compétence × 31)
-- ═══════════════════════════════════════════════════════════════
