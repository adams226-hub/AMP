-- ============================================================
-- MIGRATION : Maintenance Préventive + Magasin Pièces de Rechange
-- African Mining Partenair SARL
-- ============================================================

-- ── 1. CATALOGUE DES PIÈCES DE RECHANGE ─────────────────────
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT,           -- filtre, huile, courroie, frein, electrique, hydraulique, autre
  unit            TEXT DEFAULT 'unité',
  description     TEXT,
  supplier        TEXT,
  unit_price      NUMERIC(12,2),
  compatible_with TEXT[],         -- types d'équipements compatibles
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. STOCK DES PIÈCES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spare_parts_stock (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id  UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity       NUMERIC(10,2) DEFAULT 0,
  safety_stock   NUMERIC(10,2) DEFAULT 0,   -- seuil minimum (stock de sécurité)
  location       TEXT,                        -- emplacement dans le magasin
  last_updated   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spare_part_id)
);

-- ── 3. MOUVEMENTS DE STOCK PIÈCES ───────────────────────────
CREATE TABLE IF NOT EXISTS public.spare_parts_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id   UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  movement_type   TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment')),
  quantity        NUMERIC(10,2) NOT NULL,
  movement_date   DATE DEFAULT CURRENT_DATE,
  reason          TEXT,           -- achat, maintenance, casse, retour, inventaire
  equipment_id    UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  maintenance_id  UUID,           -- référence optionnelle vers maintenance_history
  unit_price      NUMERIC(12,2),
  supplier        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. PLANIFICATION DES MAINTENANCES PÉRIODIQUES ───────────
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  task_name       TEXT NOT NULL,
  description     TEXT,
  frequency_days  INTEGER NOT NULL,           -- périodicité en jours
  frequency_hours NUMERIC(10,1),              -- périodicité en heures moteur (optionnel)
  last_done_date  DATE,
  next_due_date   DATE,                        -- calculé automatiquement
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  estimated_cost  NUMERIC(12,2),
  estimated_duration_hours NUMERIC(6,1),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. PIÈCES REQUISES PAR PLANIFICATION ────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_spare_parts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id       UUID REFERENCES public.maintenance_schedules(id) ON DELETE CASCADE,
  spare_part_id     UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity_required NUMERIC(10,2) NOT NULL,
  UNIQUE(schedule_id, spare_part_id)
);

-- ── 6. HISTORIQUE DES MAINTENANCES EFFECTUÉES ───────────────
CREATE TABLE IF NOT EXISTS public.maintenance_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  schedule_id     UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  task_name       TEXT NOT NULL,
  performed_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  performed_by    TEXT,
  cost            NUMERIC(12,2),
  duration_hours  NUMERIC(6,1),
  notes           TEXT,
  status          TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. PIÈCES UTILISÉES LORS D'UNE MAINTENANCE ──────────────
CREATE TABLE IF NOT EXISTS public.maintenance_history_parts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_history_id  UUID REFERENCES public.maintenance_history(id) ON DELETE CASCADE,
  spare_part_id           UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity_used           NUMERIC(10,2) NOT NULL,
  unit_price              NUMERIC(12,2)
);

-- ── INDEX POUR LES PERFORMANCES ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_spare_parts_movements_part ON public.spare_parts_movements(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_movements_date ON public.spare_parts_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_equipment ON public.maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_due ON public.maintenance_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_equipment ON public.maintenance_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_date ON public.maintenance_history(performed_date);

-- ── FONCTION : Recalculer next_due_date automatiquement ─────
CREATE OR REPLACE FUNCTION update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_done_date IS NOT NULL AND NEW.frequency_days IS NOT NULL THEN
    NEW.next_due_date := NEW.last_done_date + NEW.frequency_days;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_schedules_next_due
  BEFORE INSERT OR UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_next_due_date();

-- ── FONCTION : Mettre à jour le stock après un mouvement ────
CREATE OR REPLACE FUNCTION update_spare_part_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une ligne stock si elle n'existe pas
  INSERT INTO public.spare_parts_stock (spare_part_id, quantity, safety_stock, last_updated)
  VALUES (NEW.spare_part_id, 0, 0, NOW())
  ON CONFLICT (spare_part_id) DO NOTHING;

  -- Mettre à jour la quantité
  IF NEW.movement_type = 'entry' THEN
    UPDATE public.spare_parts_stock
    SET quantity = quantity + NEW.quantity, last_updated = NOW()
    WHERE spare_part_id = NEW.spare_part_id;
  ELSIF NEW.movement_type = 'exit' THEN
    UPDATE public.spare_parts_stock
    SET quantity = GREATEST(0, quantity - NEW.quantity), last_updated = NOW()
    WHERE spare_part_id = NEW.spare_part_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE public.spare_parts_stock
    SET quantity = NEW.quantity, last_updated = NOW()
    WHERE spare_part_id = NEW.spare_part_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_spare_parts_stock_update
  AFTER INSERT ON public.spare_parts_movements
  FOR EACH ROW EXECUTE FUNCTION update_spare_part_stock();

-- ── RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history_parts ENABLE ROW LEVEL SECURITY;

-- Politiques : accès authentifié uniquement
CREATE POLICY "Authenticated full access" ON public.spare_parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.spare_parts_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.spare_parts_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.maintenance_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.schedule_spare_parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.maintenance_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.maintenance_history_parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
