-- Refresh tokens for persistent sessions (Eventbrite-style)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  text        NOT NULL UNIQUE,
  user_id     text        NOT NULL,
  user_type   text        NOT NULL CHECK (user_type IN ('admin', 'creator')),
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  last_used_at timestamptz,
  is_revoked  boolean     NOT NULL DEFAULT false,
  device_info text
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash   ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user   ON refresh_tokens (user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens (expires_at) WHERE is_revoked = false;

-- Auto-cleanup: expired or revoked tokens older than 60 days
CREATE OR REPLACE FUNCTION cleanup_refresh_tokens() RETURNS void LANGUAGE sql AS $$
  DELETE FROM refresh_tokens
  WHERE is_revoked = true OR expires_at < NOW() - INTERVAL '60 days';
$$;
