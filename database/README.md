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
- `creator_accounts`

## Exécution

1. Créer une base PostgreSQL (exemple: `eventflow`).
2. Exécuter le schéma:

```bash
psql -U <user> -d eventflow -f database/schema.sql
```

## Notes

- Les colonnes temporelles sont alignées avec le front actuel (`created_date`, `updated_date`).
- `creator_accounts` garde une colonne `password` pour compatibilité immédiate.
- Une colonne `password_hash` est prévue pour migration sécurité ultérieure.
