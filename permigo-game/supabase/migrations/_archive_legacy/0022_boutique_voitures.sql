-- ═══════════════════════════════════════════════════════════════
-- 0022 — Refonte boutique : skins voiture
-- Remplace les 4 avatars (Guerrier/Mage/Pilote/Légende) par 4 voitures.
-- Anciens avatars désactivés (active=false) — conservés en base au cas où.
-- Prix alignés sur l'éco gemmes (gains coffres/streaks 30-200).
-- ═══════════════════════════════════════════════════════════════

-- 1) Désactiver les anciens avatars perso
UPDATE public.items_catalog
   SET active = false
 WHERE id IN ('avatar_warrior', 'avatar_mage', 'avatar_pilot', 'avatar_legend');

-- 2) Insérer les 4 voitures (type 'avatar' = skin de profil). Idempotent.
INSERT INTO public.items_catalog
  (id, type, name, description, cost_gemmes, rarity, asset_url, display_color, ordre, active)
VALUES
  ('car_citadine', 'avatar', 'Citadine',     'La voiture parfaite pour bien commencer ton permis.', 150,  'commun',     '/skins/avatars/car-citadine.png', '#3b82f6', 1, true),
  ('car_sportive', 'avatar', 'Sportive',     'Pour celles et ceux qui prennent de la vitesse.',     600,  'rare',       '/skins/avatars/car-sportive.png', '#8b5cf6', 2, true),
  ('car_suv',      'avatar', 'SUV Prestige', 'Le confort et l''allure, sans compromis.',            1500, 'epique',     '/skins/avatars/car-suv.png',      '#f97316', 3, true),
  ('car_supercar', 'avatar', 'Supercar',     'Le skin ultime. Réservé aux légendes de la route.',   4000, 'legendaire', '/skins/avatars/car-supercar.png', '#fbbf24', 4, true)
ON CONFLICT (id) DO UPDATE
  SET type          = EXCLUDED.type,
      name          = EXCLUDED.name,
      description   = EXCLUDED.description,
      cost_gemmes   = EXCLUDED.cost_gemmes,
      rarity        = EXCLUDED.rarity,
      asset_url     = EXCLUDED.asset_url,
      display_color = EXCLUDED.display_color,
      ordre         = EXCLUDED.ordre,
      active        = EXCLUDED.active;
