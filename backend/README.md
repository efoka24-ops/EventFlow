# EventFlow Backend (Node.js)

Backend API Node.js pour EventFlow.

## Stack

- Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Validation (`zod`)

## Prerequis

- Node.js 18+
- PostgreSQL 14+

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

## Variables d'environnement

Voir `.env.example`.

Variables critiques:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`

## Initialiser la base

Le script utilise le schema SQL du projet: `database/schema.sql`

```bash
cd backend
npm run db:init
```

## Migrations PostgreSQL (recommande)

Le projet supporte aussi des migrations versionnees (`database/migrations`).

```bash
cd backend
npm run db:migrate
```

Ordre actuel:

- `001_initial_schema.sql`
- `002_payments_payer_fields.sql`
- `003_admin_accounts.sql`
- `004_demo_seed_data.sql` (donnees de demo, local/staging)
- `005_registrations_pending_payment_status.sql`

Le runner cree automatiquement la table `schema_migrations`.

## Seed admin (PostgreSQL)

Apres les migrations, cree/met a jour le compte admin depuis les variables d'environnement:

```bash
cd backend
npm run db:seed-admin
```

Variables requises:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FULL_NAME` (optionnelle)

## Lancer le serveur

```bash
cd backend
npm run dev
```

Au demarrage (`dev` et `start`), le backend lance automatiquement:

- `db:migrate`
- `db:seed-admin` (si `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont definis)

Commande manuelle equivalente:

```bash
npm run db:bootstrap
```

API disponible sur: `http://localhost:4000`

Health check: `GET /health`

## Routes principales

- `POST /api/auth/admin/login`
- `POST /api/auth/creator/signup`
- `POST /api/auth/creator/login`
- `GET /api/auth/me`
- `GET /api/events`
- `POST /api/events`
- `PATCH /api/events/:id` (admin)
- `DELETE /api/events/:id` (admin)
- `GET /api/registrations`
- `POST /api/registrations`
- `PATCH /api/registrations/:id` (admin)
- `DELETE /api/registrations/:id` (admin)
- `GET /api/help-articles`
- `POST /api/help-articles` (admin)
- `PATCH /api/help-articles/:id` (admin)
- `DELETE /api/help-articles/:id` (admin)
- `GET /api/event-feedback`
- `POST /api/event-feedback`
- `GET /api/user-actions` (admin)
- `POST /api/user-actions`
- `GET /api/site-sessions` (admin)
- `PUT /api/site-sessions/:id/heartbeat`
- `POST /api/payments/collect`
- `POST /api/payments/link`
- `GET /api/payments/:id/status`
- `GET /api/payments/reference/:reference`
- `POST /api/payments/webhook/campay`
- `GET /api/payments` (admin)

## Tests end-to-end (metier, securite, charge)

Depuis `backend/`:

```bash
npm run test:e2e:business
npm run test:e2e:security
npm run test:e2e:load
```

Variables optionnelles:

- `E2E_BASE_URL` (default: `http://localhost:3001/api`)
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_LOAD_CONCURRENCY`
- `E2E_LOAD_REQUESTS_PER_WORKER`

## Paiement CamPay

Renseigner dans `.env`:

- `CAMPAY_BASE_URL` (demo: `https://demo.campay.net/api`)
- soit `CAMPAY_PERMANENT_TOKEN`
- soit `CAMPAY_USERNAME` + `CAMPAY_PASSWORD`

Le backend gere:

- initiation `collect` (prompt MoMo)
- creation de lien de paiement
- polling du statut transaction
- webhook CamPay
- persistance locale (`payments`, `payment_events`)

## Auth

- Header attendu: `Authorization: Bearer <token>`
- Token admin: via `POST /api/auth/admin/login`
- Token creator: via signup/login creator

## Notes de migration front

Le front actuel appelle encore `base44Client` en local/blob.
Prochaine etape: remplacer progressivement ces appels par les endpoints `/api/*`.
