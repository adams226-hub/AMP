-- ========================================
-- ROMBAT - Table des objectifs (objectives)
-- Compatible Supabase
-- ========================================

CREATE TABLE IF NOT EXISTS objectives (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension_id UUID         REFERENCES material_dimensions(id) ON DELETE CASCADE,
    site_id      UUID         REFERENCES sites(id),
    period_type  VARCHAR(20)  NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    value        DECIMAL(12,3) NOT NULL CHECK (value > 0),
    unit         VARCHAR(10)  DEFAULT 'tonne',
    active       BOOLEAN      DEFAULT true,
    created_by   UUID         REFERENCES users(id),
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    -- Contrainte unique nécessaire pour ON CONFLICT
    CONSTRAINT uq_objective_dim_site_period UNIQUE (dimension_id, site_id, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_objectives_dimension_period ON objectives(dimension_id, period_type);
CREATE INDEX IF NOT EXISTS idx_objectives_site_period      ON objectives(site_id, period_type);

-- Trigger updated_at
CREATE TRIGGER update_objectives_updated_at
    BEFORE UPDATE ON objectives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read objectives" ON objectives
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins/supervisors manage objectives" ON objectives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE auth.uid()::text = id::text
              AND role IN ('admin', 'supervisor')
        )
    );

-- ========================================
-- Seed : objectifs journaliers par défaut
-- (uniquement pour les dimensions existantes)
-- ========================================

INSERT INTO objectives (dimension_id, period_type, value, unit)
SELECT
    md.id,
    'daily',
    CASE md.name
        WHEN '0/5'   THEN 450
        WHEN '5/15'  THEN 400
        WHEN '15/40' THEN 350
        WHEN '40/80' THEN 300
    END,
    'tonne'
FROM material_dimensions md
WHERE md.name IN ('0/5', '5/15', '15/40', '40/80')
  AND md.is_active = true
ON CONFLICT (dimension_id, site_id, period_type) DO NOTHING;

