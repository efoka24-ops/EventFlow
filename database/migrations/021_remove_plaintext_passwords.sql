-- Migration 021 : supprimer la colonne 'password' (mots de passe en clair) de creator_accounts.
--
-- PRÉREQUIS : exécuter d'abord le script node src/scripts/migratePasswords.js
-- pour hasher les mots de passe en clair restants avant de supprimer la colonne.

BEGIN;

ALTER TABLE creator_accounts DROP COLUMN IF EXISTS password;

COMMIT;
