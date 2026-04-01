-- Fix fuel_transactions column name
ALTER TABLE fuel_transactions RENAME COLUMN date TO transaction_date;

