-- 016 — Configuration du formulaire d'inscription par événement
-- Stocke la visibilité des champs de base (email, phone, gender) par événement.
-- Structure : { "hide_email": false, "hide_phone": false, "hide_gender": false }

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_config JSONB NOT NULL DEFAULT '{}';
