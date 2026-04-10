-- ============================================================
-- DONNÉES INITIALES — ROMBAT Mining Platform
-- Coller et exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. SITES
INSERT INTO public.sites (name, location, is_active, description) VALUES
  ('Site Principal',   'Carrière Nord',  true, 'Site principal d''extraction'),
  ('Carrière Sud',     'Zone Sud',       true, 'Carrière secondaire'),
  ('Dépôt Central',   'Base logistique', true, 'Zone de stockage et expédition')
ON CONFLICT DO NOTHING;

-- 2. ÉQUIPEMENTS
INSERT INTO public.equipment (name, type, status, serial_number, model, location) VALUES
  ('Excavateur CAT 320',   'Excavateur',   'active',  'CAT-320-001', 'CAT 320D', 'Carrière Nord'),
  ('Camion VOLVO FH16',    'Camion',       'active',  'VOL-FH16-001','Volvo FH16 750', 'Carrière Nord'),
  ('Bulldozer D8T',        'Bulldozer',    'active',  'CAT-D8T-001', 'CAT D8T', 'Carrière Nord'),
  ('Foreuse Atlas 270',    'Foreuse',      'active',  'ATL-270-001', 'Atlas Copco 270', 'Carrière Nord'),
  ('Chargeur 966H',        'Chargeur',     'active',  'CAT-966H-001','CAT 966H', 'Carrière Nord'),
  ('Compacteur CS56',      'Compacteur',   'maintenance', 'CAT-CS56-001','CAT CS56B', 'Dépôt Central'),
  ('Camion BENNE 001',     'Camion benne', 'active',  'MAN-TGS-001', 'MAN TGS 41.480', 'Carrière Nord'),
  ('Camion BENNE 002',     'Camion benne', 'active',  'MAN-TGS-002', 'MAN TGS 41.480', 'Carrière Nord')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VÉRIFICATION (optionnel — afficher ce qui a été inséré)
-- ============================================================
SELECT 'sites' AS table_name, COUNT(*) FROM public.sites
UNION ALL
SELECT 'equipment', COUNT(*) FROM public.equipment;
