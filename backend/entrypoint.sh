#!/bin/sh
set -e

echo "[entrypoint] Initializing database..."
npm run db:init || echo "[entrypoint] DB already initialized or init failed"

echo "[entrypoint] Starting application..."
exec npm start
