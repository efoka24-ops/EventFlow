-- Migration 009: Update payments provider default and rename column alias
-- The campay_reference column is kept for backward compatibility (already in use in prod)
-- but we update the default provider value to 'easytransact'

ALTER TABLE payments ALTER COLUMN provider SET DEFAULT 'easytransact';

-- Update existing rows that still have the old default
UPDATE payments SET provider = 'easytransact' WHERE provider = 'campay';
