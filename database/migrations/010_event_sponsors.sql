-- Migration 010: Event sponsors table
CREATE TABLE IF NOT EXISTS event_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_account_id uuid NOT NULL REFERENCES creator_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website_url text,
  level text NOT NULL DEFAULT 'bronze' CHECK (level IN ('or', 'argent', 'bronze', 'partenaire')),
  description text,
  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS event_sponsors_event_id_idx ON event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS event_sponsors_creator_idx ON event_sponsors(creator_account_id);
