-- Supprimer l'ancienne contrainte de type et en créer une plus souple
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_type_check;

ALTER TABLE equipment ADD CONSTRAINT equipment_type_check
  CHECK (type IN ('excavator', 'drill', 'conveyor', 'crusher', 'truck', 'loader', 'other'));

-- Mettre à jour les lignes existantes avec un type vide ou NULL
UPDATE equipment SET type = 'other' WHERE type IS NULL OR type = '';
