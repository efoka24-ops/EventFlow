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

## Lancer le serveur

```bash
cd backend
npm run dev
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
