-- ═══════════════════════════════════════════════════════════════
-- Rééquilibrage de l'économie (monnaie « volants », colonne gemmes).
-- Audit 2026-06-11 : gains réels d'un élève (coffres mondes 50/100/175/300,
-- streaks 30/80/200, bienvenue 25, quiz parfait 25) ≈ 700 volants à la
-- 25e compétence. L'ancien prix du skin légendaire (6000) était donc
-- inatteignable ×8. Cible : le légendaire tombe vers la 25e compétence.
-- ═══════════════════════════════════════════════════════════════

UPDATE items_catalog SET cost_gemmes = CASE id
  -- Skins voiture (vedette de la boutique)
  WHEN 'car_citadine'  THEN 100
  WHEN 'car_sportive'  THEN 250
  WHEN 'car_suv'       THEN 450
  WHEN 'car_supercar'  THEN 700   -- légendaire ≈ 25e compétence
  -- Avatars legacy
  WHEN 'avatar_warrior' THEN 80
  WHEN 'avatar_mage'    THEN 120
  WHEN 'avatar_pilot'   THEN 160
  WHEN 'avatar_legend'  THEN 400
  -- Fonds de permis (secondaires, sous le skin légendaire)
  WHEN 'permis_bg_minimal_white' THEN 60
  WHEN 'permis_bg_racetrack'     THEN 120
  WHEN 'permis_bg_nebula'        THEN 180
  WHEN 'permis_sunset'           THEN 200
  WHEN 'permis_aurora'           THEN 260
  WHEN 'permis_bg_cyberpunk'     THEN 320
  WHEN 'permis_gold'             THEN 400
  ELSE cost_gemmes
END
WHERE id IN (
  'car_citadine','car_sportive','car_suv','car_supercar',
  'avatar_warrior','avatar_mage','avatar_pilot','avatar_legend',
  'permis_bg_minimal_white','permis_bg_racetrack','permis_bg_nebula',
  'permis_sunset','permis_aurora','permis_bg_cyberpunk','permis_gold'
);
