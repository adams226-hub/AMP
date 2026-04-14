-- ============================================================
-- MIGRATION : Stock de Consommables
-- African Mining Partenair SARL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consumable_movements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  movement_type  TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit')),
  category       TEXT NOT NULL,   -- Nom du consommable : Explosifs, Détonateurs, etc.
  quantity       NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit           TEXT DEFAULT 'tonne',
  notes          TEXT,
  operator_name  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index sur la date et la catégorie pour les agrégations rapides
CREATE INDEX IF NOT EXISTS idx_consumable_movements_date     ON public.consumable_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_consumable_movements_category ON public.consumable_movements(category);
CREATE INDEX IF NOT EXISTS idx_consumable_movements_type     ON public.consumable_movements(movement_type);

-- RLS
ALTER TABLE public.consumable_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.consumable_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
