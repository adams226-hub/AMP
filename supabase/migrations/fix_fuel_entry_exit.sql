-- ============================================================
-- MIGRATION: Système entrée/sortie pour fuel_transactions
-- Même logique que oil_transactions :
--   - Entrée = réception de carburant (pas d'équipement)
--   - Sortie  = consommation par équipement
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Créer le type enum pour le carburant
DO $$ BEGIN
  CREATE TYPE fuel_transaction_type AS ENUM ('entry', 'exit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter la colonne transaction_type (les lignes existantes deviennent 'exit')
ALTER TABLE public.fuel_transactions
  ADD COLUMN IF NOT EXISTS transaction_type fuel_transaction_type NOT NULL DEFAULT 'exit';

-- 3. Rendre equipment_id nullable (les entrées n'ont pas d'équipement)
ALTER TABLE public.fuel_transactions
  ALTER COLUMN equipment_id DROP NOT NULL;

-- 4. Rendre cost_per_liter nullable (les sorties n'ont pas de prix)
ALTER TABLE public.fuel_transactions
  ALTER COLUMN cost_per_liter DROP NOT NULL;

-- 5. Ajouter operator_name si absent
ALTER TABLE public.fuel_transactions
  ADD COLUMN IF NOT EXISTS operator_name TEXT;

-- Vérification
SELECT
  transaction_type,
  COUNT(*) AS nb,
  SUM(quantity) AS total_litres
FROM public.fuel_transactions
GROUP BY transaction_type;
