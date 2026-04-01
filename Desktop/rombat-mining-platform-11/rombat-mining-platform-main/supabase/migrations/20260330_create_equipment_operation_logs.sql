-- Create equipment_operation_logs table for daily equipment operations tracking
CREATE TABLE IF NOT EXISTS equipment_operation_logs (
  id             UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  date           DATE      NOT NULL,
  equipment_id   UUID      NOT NULL REFERENCES equipment(id),
  shift          VARCHAR(20) NOT NULL DEFAULT 'jour',
  machine_type   VARCHAR(255),
  status         VARCHAR(50) DEFAULT 'functional',
  breakdown_time VARCHAR(20),
  repair_status  VARCHAR(50),
  resume_time    VARCHAR(20),
  counter_start  DECIMAL(12,2) DEFAULT 0,
  counter_end    DECIMAL(12,2) DEFAULT 0,
  distance       DECIMAL(12,2) DEFAULT 0,
  operator_name  VARCHAR(255),
  created_by     UUID      REFERENCES auth.users(id),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_equipment_operation_logs_updated_at
  BEFORE UPDATE ON equipment_operation_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE equipment_operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_operation_logs_select" ON equipment_operation_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "equipment_operation_logs_insert" ON equipment_operation_logs FOR INSERT WITH CHECK (get_user_role() IN ('admin','directeur','supervisor','equipement'));
CREATE POLICY "equipment_operation_logs_update" ON equipment_operation_logs FOR UPDATE USING (get_user_role() IN ('admin','directeur'));
CREATE POLICY "equipment_operation_logs_delete" ON equipment_operation_logs FOR DELETE USING (get_user_role() IN ('admin','directeur'));
