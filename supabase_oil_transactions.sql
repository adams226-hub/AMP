-- ============================================================
-- MIGRATION: Compléter la table oil_transactions existante
-- À exécuter dans l'éditeur SQL de Supabase (une seule fois)
-- ============================================================

-- Ajouter les colonnes manquantes si elles n'existent pas encore
ALTER TABLE public.oil_transactions
  ADD COLUMN IF NOT EXISTS oil_type      TEXT DEFAULT 'huile_moteur',
  ADD COLUMN IF NOT EXISTS supplier      TEXT,
  ADD COLUMN IF NOT EXISTS operator_name TEXT;

-- Vérification des colonnes de la table (lecture seule, pour information)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'oil_transactions'
-- ORDER BY ordinal_position;

-- ============================================================
-- Vue: stock huile courant par équipement (recréer si besoin)
-- ============================================================

CREATE OR REPLACE VIEW public.oil_stock_by_equipment AS
SELECT
  e.id           AS equipment_id,
  e.name         AS equipment_name,
  e.type         AS equipment_type,
  COALESCE(SUM(CASE WHEN ot.transaction_type = 'entry' THEN ot.quantity ELSE 0 END), 0) AS total_entries,
  COALESCE(SUM(CASE WHEN ot.transaction_type = 'exit'  THEN ot.quantity ELSE 0 END), 0) AS total_exits,
  GREATEST(0,
    COALESCE(SUM(CASE WHEN ot.transaction_type = 'entry' THEN ot.quantity ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN ot.transaction_type = 'exit' THEN ot.quantity ELSE 0 END), 0)
  ) AS current_stock
FROM public.equipment e
LEFT JOIN public.oil_transactions ot ON ot.equipment_id = e.id
GROUP BY e.id, e.name, e.type
ORDER BY e.name;
