# EventFlow Database (PostgreSQL)

Ce dossier contient le schéma SQL complet du projet.

## Fichier principal

- `schema.sql`: création de toutes les tables, contraintes, clés étrangères et index.

## Tables créées

- `events`
- `registrations`
- `help_articles`
- `site_sessions`
- `event_feedback`
- `user_actions`
- `payments`
- `payment_events`
- `creator_accounts`

## Exécution

Option recommandée (migrations):

1. Créer une base PostgreSQL (exemple: `eventflow`).
2. Configurer `DATABASE_URL` dans `backend/.env`.
3. Appliquer les migrations:

```bash
cd backend
npm run db:migrate
```

Option directe (sans historique de migrations):

```bash
psql -U <user> -d eventflow -f database/schema.sql
```

## Migrations

Les migrations se trouvent dans `migrations/` et s'appliquent dans l'ordre numerique (`001`, `002`, ...), sur base vide ou base existante selon les scripts.

### 001 — Schéma initial

Fichier : `migrations/001_initial_schema.sql`

Crée les extensions, fonctions, tables, index et triggers principaux du projet.

### 002 — Champs payeur sur les paiements

Fichier : `migrations/002_payments_payer_fields.sql`

Ajoute la colonne `payer_name` et étend la contrainte `endpoint` pour accepter `checkout-link` (Easy Transact).

```bash
psql -U <user> -d eventflow -f database/migrations/002_payments_payer_fields.sql
```

> **Pourquoi ?** Sans cette migration, les champs **Payeur**, **Téléphone**, **Opérateur** et **Payé le** apparaissent comme `—` dans le détail de paiement du back office.

### 003 — Comptes administrateurs

Fichier : `migrations/003_admin_accounts.sql`

Crée la table `admin_accounts` pour authentifier les admins depuis PostgreSQL (`email`, `password_hash`, `is_active`, `last_login_at`).

### 004 — Donnees de demonstration

Fichier : `migrations/004_demo_seed_data.sql`

Insere des donnees de test (createur, evenements, articles d'aide). Migration idempotente (safe si relancee).

Utilisation recommandee : local/staging.

### 005 — Statut paiement en attente des inscriptions

Fichier : `migrations/005_registrations_pending_payment_status.sql`

Etend la contrainte `registrations.status` pour autoriser `en_attente_paiement`.

---

## Notes

- Les colonnes temporelles sont alignées avec le front actuel (`created_date`, `updated_date`).
- `creator_accounts` garde une colonne `password` pour compatibilité immédiate.
- Une colonne `password_hash` est prévue pour migration sécurité ultérieure.
