-- ============================================================
-- DIAGNOSTIC ET CORRECTION DES TABLES STOCK
-- À exécuter dans l'éditeur SQL de Supabase
-- La DB utilise full_setup.sql :
--   stock_exits.exit_date (pas "date")
--   stock_exit_details.stock_exit_id (pas "exit_id")
--   stock_entry_details.stock_entry_id (pas "entry_id")
-- ============================================================

-- 1. Vérifier les colonnes réelles des tables stock
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('stock_exits','stock_entries','stock_exit_details','stock_entry_details')
ORDER BY table_name, ordinal_position;

-- 2. Compter les enregistrements pour vérifier qu'il y en a bien
SELECT 'stock_exits' AS table_name, COUNT(*) FROM public.stock_exits
UNION ALL
SELECT 'stock_exit_details', COUNT(*) FROM public.stock_exit_details
UNION ALL
SELECT 'stock_entries', COUNT(*) FROM public.stock_entries
UNION ALL
SELECT 'stock_entry_details', COUNT(*) FROM public.stock_entry_details;

-- 3. Vérifier les détails orphelins (sans sortie parente valide)
SELECT COUNT(*) AS details_orphelins
FROM public.stock_exit_details sed
WHERE NOT EXISTS (
  SELECT 1 FROM public.stock_exits se WHERE se.id = sed.stock_exit_id
);

-- 4. Voir les 10 dernières sorties avec leurs détails
SELECT
  se.id,
  se.exit_date,
  se.destination,
  sed.dimension,
  sed.quantity
FROM public.stock_exits se
LEFT JOIN public.stock_exit_details sed ON sed.stock_exit_id = se.id
ORDER BY se.exit_date DESC
LIMIT 20;
