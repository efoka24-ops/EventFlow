-- Allow payment workflow status for registrations
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE registrations ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('en_attente', 'en_attente_paiement', 'validee', 'refusee'));
