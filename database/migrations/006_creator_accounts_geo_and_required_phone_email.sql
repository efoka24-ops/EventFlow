-- Enforce email + phone on creator accounts and store signup geolocation
ALTER TABLE creator_accounts
  ADD COLUMN IF NOT EXISTS geo_latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS geo_longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS geo_accuracy numeric(12,3),
  ADD COLUMN IF NOT EXISTS geo_source text,
  ADD COLUMN IF NOT EXISTS geo_captured_at timestamptz;

ALTER TABLE creator_accounts DROP CONSTRAINT IF EXISTS creator_accounts_check;
ALTER TABLE creator_accounts ADD CONSTRAINT creator_accounts_check
  CHECK (COALESCE(email, '') <> '' AND COALESCE(phone, '') <> '');
