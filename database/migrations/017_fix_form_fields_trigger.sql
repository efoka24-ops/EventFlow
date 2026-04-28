-- 017 — Correction : supprimer le trigger cassé sur event_form_fields
-- Le trigger event_form_fields_updated_at appelait set_updated_date() qui tente
-- de mettre à jour la colonne updated_date, inexistante dans cette table (updated_at).
-- Le backend met déjà à jour updated_at manuellement dans chaque UPDATE.

DROP TRIGGER IF EXISTS event_form_fields_updated_at ON event_form_fields;
