#!/bin/sh
set -e

echo "[entrypoint] Initializing database..."
npm run db:init || echo "[entrypoint] DB already initialized or init failed"

echo "[entrypoint] Running migrations..."
npm run db:migrate || echo "[entrypoint] Migration failed or already up to date"

echo "[entrypoint] Starting application..."
exec npm start
