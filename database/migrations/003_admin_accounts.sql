-- Create dedicated admin accounts table for DB-backed admin authentication
CREATE TABLE IF NOT EXISTS admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT 'Administrator',
  email text NOT NULL UNIQUE CHECK (email = LOWER(email)),
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_is_active ON admin_accounts (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_created_date ON admin_accounts (created_date DESC);

CREATE TRIGGER trg_admin_accounts_updated_date
BEFORE UPDATE ON admin_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();
