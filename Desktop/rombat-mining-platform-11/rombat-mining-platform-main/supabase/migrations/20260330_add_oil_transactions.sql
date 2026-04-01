-- Add oil_transactions table and oil_transaction_type enum for oil management
DO $$ BEGIN CREATE TYPE oil_transaction_type AS ENUM ('entry','exit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS oil_transactions (
  id               UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE                NOT NULL,
  site             VARCHAR(255),
  equipment_id     UUID                NOT NULL REFERENCES equipment(id),
  transaction_type oil_transaction_type NOT NULL DEFAULT 'entry',
  quantity         DECIMAL(10,2)       NOT NULL CHECK (quantity > 0),
  operator_id      UUID                REFERENCES auth.users(id),
  notes            TEXT,
  created_at       TIMESTAMP           DEFAULT NOW(),
  updated_at       TIMESTAMP           DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_oil_transactions_updated_at
  BEFORE UPDATE ON oil_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE oil_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oil_select" ON oil_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "oil_insert" ON oil_transactions FOR INSERT WITH CHECK (get_user_role() IN ('admin','directeur','supervisor','equipement'));
CREATE POLICY "oil_update" ON oil_transactions FOR UPDATE USING (get_user_role() IN ('admin','directeur'));
CREATE POLICY "oil_delete" ON oil_transactions FOR DELETE USING (get_user_role() IN ('admin','directeur'));