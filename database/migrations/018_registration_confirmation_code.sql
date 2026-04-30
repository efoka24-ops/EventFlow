-- 018 — Code de confirmation unique par inscription
-- Permet à l'organisateur de vérifier la présence d'un participant
-- via un code court (8 caractères alphanumériques).

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS confirmation_code TEXT;

-- Générer des codes pour les inscriptions existantes
UPDATE registrations
  SET confirmation_code = UPPER(SUBSTRING(MD5(id::text || RANDOM()::text) FROM 1 FOR 8))
  WHERE confirmation_code IS NULL;

-- Rendre obligatoire et unique pour les nouvelles inscriptions
ALTER TABLE registrations
  ALTER COLUMN confirmation_code SET DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 8));

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_confirmation_code
  ON registrations (confirmation_code);
