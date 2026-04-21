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

1. Créer une base PostgreSQL (exemple: `eventflow`).
2. Exécuter le schéma:

```bash
psql -U <user> -d eventflow -f database/schema.sql
```

## Migrations

Les migrations se trouvent dans `migrations/` et s'appliquent sur une base **déjà existante** (sans recréer les tables).

### 002 — Champs payeur sur les paiements

Fichier : `migrations/002_payments_payer_fields.sql`

Ajoute la colonne `payer_name` et étend la contrainte `endpoint` pour accepter `checkout-link` (Easy Transact).

```bash
psql -U <user> -d eventflow -f database/migrations/002_payments_payer_fields.sql
```

> **Pourquoi ?** Sans cette migration, les champs **Payeur**, **Téléphone**, **Opérateur** et **Payé le** apparaissent comme `—` dans le détail de paiement du back office.

---

## Notes

- Les colonnes temporelles sont alignées avec le front actuel (`created_date`, `updated_date`).
- `creator_accounts` garde une colonne `password` pour compatibilité immédiate.
- Une colonne `password_hash` est prévue pour migration sécurité ultérieure.
