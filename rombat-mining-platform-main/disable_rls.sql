-- Script pour désactiver RLS temporairement sur Supabase Cloud
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- Désactiver RLS sur les tables principales
ALTER TABLE fuel_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Permettre l'accès en lecture à tous (temporaire pour développement)
CREATE POLICY "allow_all_read" ON fuel_transactions FOR SELECT USING (true);
CREATE POLICY "allow_all_read_equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "allow_all_read_sites" ON sites FOR SELECT USING (true);

-- Permettre l'insertion/modification pour les tests
CREATE POLICY "allow_all_write_fuel" ON fuel_transactions FOR ALL USING (true);
CREATE POLICY "allow_all_write_equipment" ON equipment FOR ALL USING (true);