/**
 * Migration one-shot : hash les mots de passe en clair restants et supprime la colonne password.
 *
 * Exécuter AVANT la migration SQL 021 :
 *   node src/scripts/migratePasswords.js
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const run = async () => {
  // Vérifie que la colonne existe encore
  const { rows: cols } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'creator_accounts' AND column_name = 'password'
  `);
  if (!cols.length) {
    console.log("[migratePasswords] Colonne 'password' absente — migration déjà appliquée.");
    return;
  }

  // Comptes sans hash mais avec un mot de passe en clair
  const { rows: toHash } = await pool.query(`
    SELECT id, password FROM creator_accounts
    WHERE password_hash IS NULL AND password IS NOT NULL AND password <> ''
  `);

  console.log(`[migratePasswords] ${toHash.length} compte(s) sans hash bcrypt à migrer.`);

  for (const account of toHash) {
    const hashed = await bcrypt.hash(account.password, 10);
    await pool.query(
      "UPDATE creator_accounts SET password_hash = $1 WHERE id = $2",
      [hashed, account.id]
    );
    console.log(`[migratePasswords] Hash généré pour le compte ${account.id}`);
  }

  // Comptes qui n'ont ni hash ni mot de passe en clair — cas edge
  const { rows: orphans } = await pool.query(`
    SELECT id FROM creator_accounts
    WHERE password_hash IS NULL AND (password IS NULL OR password = '')
  `);
  if (orphans.length) {
    console.warn(`[migratePasswords] ${orphans.length} compte(s) sans hash NI mot de passe en clair — ces comptes devront réinitialiser leur mot de passe.`);
  }

  // Vider la colonne plaintext sur tous les comptes
  const { rowCount } = await pool.query("UPDATE creator_accounts SET password = NULL");
  console.log(`[migratePasswords] Colonne 'password' vidée sur ${rowCount} compte(s).`);

  console.log("[migratePasswords] Terminé. Lancez maintenant : npm run db:migrate");
};

run()
  .catch((err) => {
    console.error("[migratePasswords] Erreur :", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
