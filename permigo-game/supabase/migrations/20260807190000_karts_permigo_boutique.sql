-- ═══════════════════════════════════════════════════════════════
-- Les 4 voitures de la boutique deviennent des karts PermiGo.
--
-- Pourquoi : les visuels précédents étaient des rendus de voitures de
-- série avec le logo du constructeur bien visible sur la calandre. On les
-- remplace par une voiture maison, sans marque, déclinée en 4 paliers qui
-- montent visiblement en gamme (nue → jantes et becquet → élargie et
-- énervée → or massif). Décision Rayan, 07/08/2026.
--
-- Les id ne bougent pas : un élève qui possède déjà un skin le garde, il
-- voit juste le nouveau visuel. Seuls le nom, la description et l'image
-- changent. Le prix reste celui fixé par 20260611150000_rebalance_volants.
--
-- ⚠️ Nouveaux noms de fichiers (`-v2.webp`) : réutiliser le même nom aurait
-- laissé le cache de la PWA servir l'ancienne image à vie.
-- ⚠️ Le front sépare voiture/personnage sur le motif '/car-' dans l'asset_url
-- (src/pages/eleve/boutique.js) : les nouveaux chemins le gardent.
-- ═══════════════════════════════════════════════════════════════

UPDATE public.items_catalog
   SET name        = 'Citadine',
       description = 'Ta première voiture. Elle ne paie pas de mine mais elle démarre tout.',
       asset_url   = '/skins/avatars/car-citadine-v2.webp'
 WHERE id = 'car_citadine';

UPDATE public.items_catalog
   SET name        = 'Sportive',
       description = 'Jantes chrome et becquet. Elle commence à prendre de la vitesse.',
       asset_url   = '/skins/avatars/car-sportive-v2.webp'
 WHERE id = 'car_sportive';

UPDATE public.items_catalog
   SET name        = 'La Furieuse',
       description = 'Carrosserie élargie et bande lumineuse au sol. Elle ne sourit plus.',
       asset_url   = '/skins/avatars/car-suv-v2.webp'
 WHERE id = 'car_suv';

UPDATE public.items_catalog
   SET name        = 'La Dorée',
       description = 'Or massif. Flammes à l''échappement. La dernière marche.',
       asset_url   = '/skins/avatars/car-supercar-v2.webp'
 WHERE id = 'car_supercar';
