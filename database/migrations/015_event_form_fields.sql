-- 015 — Champs dynamiques du formulaire d'inscription par événement
-- Permet aux admins de configurer des champs supplémentaires par événement.
-- Les valeurs saisies sont stockées dans registrations.extra_data (JSONB).

CREATE TABLE event_form_fields (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_key     TEXT        NOT NULL,
  field_label   TEXT        NOT NULL,
  field_type    TEXT        NOT NULL DEFAULT 'text'
                            CHECK (field_type IN ('text','number','email','tel','select','textarea','date','checkbox')),
  field_options JSONB       NOT NULL DEFAULT '[]',
  placeholder   TEXT,
  is_required   BOOLEAN     NOT NULL DEFAULT false,
  is_visible    BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, field_key)
);

CREATE INDEX idx_event_form_fields_event_id ON event_form_fields (event_id);

-- Stockage des valeurs personnalisées dans registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS extra_data JSONB NOT NULL DEFAULT '{}';
