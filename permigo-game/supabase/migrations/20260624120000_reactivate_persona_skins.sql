-- ═══════════════════════════════════════════════════════════════
-- Réactive les 4 skins PERSONNAGE pour la section « Personnages » de la boutique.
-- Ils existaient (avatar_warrior/pilot/mage/legend) mais avaient été désactivés
-- (active=false) lors de l'arrivée des skins voiture (migration 0022). On les
-- remet actifs avec leurs assets transparents .webp (déjà présents dans
-- public/skins/avatars/) + des prix alignés sur l'éco volants actuelle.
--
-- type='avatar' (comme les voitures) : le front sépare voiture/perso via
-- l'asset_url ('/avatars/car-' = voiture, sinon perso). Aucun changement de
-- schéma, juste des données. Idempotent.
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.items_catalog
  (id, type, name, description, cost_gemmes, rarity, asset_url, display_color, ordre, active)
VALUES
  ('avatar_warrior', 'avatar', 'Le Guerrier', 'Robuste et déterminé — prêt à tout affronter sur la route.', 80,  'commun',     '/skins/avatars/warrior.webp', '#9A938A', 11, true),
  ('avatar_pilot',   'avatar', 'Le Pilote',   'Sang-froid et précision : l''ADN d''un bon conducteur.',     220, 'rare',       '/skins/avatars/pilot.webp',   '#3E78C8', 12, true),
  ('avatar_mage',    'avatar', 'Le Mage',     'Un brin de magie pour décrocher ton permis.',                350, 'epique',     '/skins/avatars/mage.webp',    '#7C4DD8', 13, true),
  ('avatar_legend',  'avatar', 'La Légende',  'Le panache des conducteurs de légende.',                     700, 'legendaire', '/skins/avatars/legend.webp',  '#fbbf24', 14, true)
ON CONFLICT (id) DO UPDATE
  SET type          = EXCLUDED.type,
      name          = EXCLUDED.name,
      description   = EXCLUDED.description,
      cost_gemmes   = EXCLUDED.cost_gemmes,
      rarity        = EXCLUDED.rarity,
      asset_url     = EXCLUDED.asset_url,
      display_color = EXCLUDED.display_color,
      ordre         = EXCLUDED.ordre,
      active        = true;
