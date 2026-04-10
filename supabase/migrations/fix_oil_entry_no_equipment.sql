-- Rendre equipment_id nullable : les entrées de stock n'ont pas d'équipement
ALTER TABLE public.oil_transactions ALTER COLUMN equipment_id DROP NOT NULL;
