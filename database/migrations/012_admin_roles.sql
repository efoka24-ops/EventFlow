-- Add role management to admin_accounts
-- Roles: super_admin, admin, support, finance, marketing, moderator

ALTER TABLE admin_accounts
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin'
    CHECK (role IN ('super_admin', 'admin', 'support', 'finance', 'marketing', 'moderator')),
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- All existing admins become super_admin (they were the only admins before this system)
UPDATE admin_accounts SET role = 'super_admin' WHERE role = 'admin';

CREATE INDEX IF NOT EXISTS idx_admin_accounts_role ON admin_accounts (role);
