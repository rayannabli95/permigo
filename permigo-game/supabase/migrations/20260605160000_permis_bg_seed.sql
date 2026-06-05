-- ═══════════════════════════════════════════════════════════════
-- Seed — Fonds de carte permis (type permis_bg)
-- 3 items achetables en boutique élève, onglet "Autres".
-- Assets réels : public/skins/permis-bg/{racetrack,aurora,cyberpunk}.webp
-- Échelle prix alignée sur les voitures (150→4000).
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.items_catalog
  (id, type, name, description, cost_gemmes, rarity, asset_url, display_color, ordre, active)
VALUES
  (
    'permis_bg_racetrack',
    'permis_bg',
    'Fond Route',
    'Le classique. Un circuit de course en toile de fond pour ta carte permis.',
    300,
    'commun',
    '/skins/permis-bg/racetrack.webp',
    '#3b82f6',
    1,
    true
  ),
  (
    'permis_bg_aurora',
    'permis_bg',
    'Fond Aurora',
    'Lumières boréales. Pour les élèves qui conduisent vers les étoiles.',
    800,
    'rare',
    '/skins/permis-bg/aurora.webp',
    '#8b5cf6',
    2,
    true
  ),
  (
    'permis_bg_cyberpunk',
    'permis_bg',
    'Fond Cyberpunk',
    'Néons et asphalte mouillé. Réservé aux as du volant.',
    2000,
    'epique',
    '/skins/permis-bg/cyberpunk.webp',
    '#f97316',
    3,
    true
  )
ON CONFLICT (id) DO NOTHING;
