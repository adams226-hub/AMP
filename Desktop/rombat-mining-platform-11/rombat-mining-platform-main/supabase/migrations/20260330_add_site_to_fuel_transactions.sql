-- Add site column to fuel_transactions for Koro site tracking
ALTER TABLE fuel_transactions
  ADD COLUMN IF NOT EXISTS site VARCHAR(255);
