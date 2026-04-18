-- EventFlow SQL schema (PostgreSQL)
-- Creates all persistent tables used by the project.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keep updated_date in sync automatically.
CREATE OR REPLACE FUNCTION set_updated_date()
RETURNS trigger AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- EVENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (
    category IN (
      'concert', 'sport', 'conference', 'festival', 'atelier', 'exposition',
      'theatre', 'cinema', 'gastronomie', 'bien_etre', 'technologie', 'autre'
    )
  ),
  date_start timestamptz NOT NULL,
  date_end timestamptz,
  location_name text,
  city text NOT NULL,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  image_url text,
  max_participants integer CHECK (max_participants IS NULL OR max_participants >= 0),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'annule', 'termine')),
  tags text,

  submitted_by_user boolean NOT NULL DEFAULT false,
  organizer_name text,
  organizer_email text,
  organizer_phone text,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW(),

  CHECK (date_end IS NULL OR date_end >= date_start)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
CREATE INDEX IF NOT EXISTS idx_events_status_date_start ON events (status, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_date ON events (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_city ON events (city);
CREATE INDEX IF NOT EXISTS idx_events_organizer_email ON events (organizer_email);
CREATE INDEX IF NOT EXISTS idx_events_submitted_by_user ON events (submitted_by_user);

CREATE TRIGGER trg_events_updated_date
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

-- =========================================================
-- REGISTRATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  gender text CHECK (gender IS NULL OR gender IN ('homme', 'femme', 'autre')),
  age integer CHECK (age IS NULL OR age >= 0),
  id_type text CHECK (id_type IS NULL OR id_type IN ('cni', 'passeport', 'permis', 'autre')),
  id_number text,

  geo_latitude numeric(10,7),
  geo_longitude numeric(10,7),
  geo_accuracy numeric(12,3),
  geo_location_label text,
  geo_city text,
  geo_region text,
  geo_country text,

  email_provider text,
  has_gmail_account boolean,

  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'validee', 'refusee')),
  registration_method text CHECK (registration_method IS NULL OR registration_method IN ('email_auto', 'formulaire')),

  validated_date timestamptz,
  refused_date timestamptz,
  notification_status text CHECK (notification_status IS NULL OR notification_status IN ('pending', 'sent', 'failed')),
  notification_sent_at timestamptz,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations (status);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations (email);
CREATE INDEX IF NOT EXISTS idx_registrations_created_date ON registrations (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_updated_date ON registrations (updated_date DESC);

CREATE TRIGGER trg_registrations_updated_date
BEFORE UPDATE ON registrations
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

-- =========================================================
-- HELP ARTICLES
-- =========================================================
CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id text NOT NULL,
  topic_title text NOT NULL,
  topic_description text,
  topic_order integer NOT NULL DEFAULT 1,

  title text NOT NULL,
  content text NOT NULL,
  article_order integer NOT NULL DEFAULT 1,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_articles_topic ON help_articles (topic_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_topic_order ON help_articles (topic_order, article_order);

CREATE TRIGGER trg_help_articles_updated_date
BEFORE UPDATE ON help_articles
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

-- =========================================================
-- SITE SESSIONS (analytics)
-- =========================================================
CREATE TABLE IF NOT EXISTS site_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  started_at timestamptz,
  ended_at timestamptz,
  last_seen_at timestamptz,
  is_active boolean,
  page_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  minutes_spent integer NOT NULL DEFAULT 0,

  user_email text,
  user_phone text,
  account_type text,

  user_agent text,
  browser text,
  browser_version text,
  browser_full text,
  os text,
  device_type text,
  language text,
  timezone text,
  screen text,
  referrer text,

  ip text,
  country text,
  city text,
  region text,

  geo_source text,
  geo_latitude numeric(10,7),
  geo_longitude numeric(10,7),
  geo_accuracy_m numeric(12,3),
  geo_altitude_m numeric(12,3),
  geo_altitude_accuracy_m numeric(12,3),
  geo_heading_deg numeric(12,3),
  geo_speed_mps numeric(12,3),
  geo_timestamp timestamptz,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_sessions_started_at ON site_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_sessions_last_seen_at ON site_sessions (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_sessions_user_email ON site_sessions (user_email);
CREATE INDEX IF NOT EXISTS idx_site_sessions_country_city ON site_sessions (country, city);
CREATE INDEX IF NOT EXISTS idx_site_sessions_is_active ON site_sessions (is_active);

CREATE TRIGGER trg_site_sessions_updated_date
BEFORE UPDATE ON site_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

-- =========================================================
-- EVENT FEEDBACK
-- =========================================================
CREATE TABLE IF NOT EXISTS event_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  event_title text,
  participant_name text,
  participant_email text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback (event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_created_date ON event_feedback (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_event_feedback_rating ON event_feedback (rating);

CREATE TRIGGER trg_event_feedback_updated_date
BEFORE UPDATE ON event_feedback
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

-- =========================================================
-- USER ACTIONS (tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS user_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  action text NOT NULL,
  user_email text,
  session_id uuid,
  page_path text,
  context text,

  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  event_title text,
  event_category text,

  metadata jsonb,
  occurred_at timestamptz,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions (action);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_email ON user_actions (user_email);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_date ON user_actions (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_event_id ON user_actions (event_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_session_id ON user_actions (session_id);

CREATE TRIGGER trg_user_actions_updated_date
BEFORE UPDATE ON user_actions
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

-- =========================================================
-- CREATOR ACCOUNTS
-- =========================================================
CREATE TABLE IF NOT EXISTS creator_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  -- Keep `password` for compatibility with current app logic.
  -- You can migrate to password_hash later.
  password text NOT NULL,
  password_hash text,

  created_date timestamptz NOT NULL DEFAULT NOW(),
  updated_date timestamptz NOT NULL DEFAULT NOW(),

  CHECK (COALESCE(email, '') <> '' OR COALESCE(phone, '') <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_creator_accounts_email
  ON creator_accounts (LOWER(email))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_creator_accounts_phone
  ON creator_accounts (phone)
  WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS idx_creator_accounts_created_date ON creator_accounts (created_date DESC);

CREATE TRIGGER trg_creator_accounts_updated_date
BEFORE UPDATE ON creator_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_date();

COMMIT;
