-- 013_event_status_index.sql
-- Ajoute un index pour accélérer les requêtes sur le champ status de la table events

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
