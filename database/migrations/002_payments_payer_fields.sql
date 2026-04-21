-- Add payer_name column and fix endpoint CHECK constraint
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_name text;

-- Drop old constraint and add new one that includes checkout-link
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_endpoint_check;
ALTER TABLE payments ADD CONSTRAINT payments_endpoint_check
  CHECK (endpoint IN ('collect', 'payment_link', 'checkout-link'));
