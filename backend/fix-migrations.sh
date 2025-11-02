#!/bin/bash
# Script to fix all failed migrations in Railway production DB

echo "Fixing migration: 20250928230059_init"
npx prisma migrate resolve --applied 20250928230059_init || true

echo "Fixing migration: 20251002234449_init"
npx prisma migrate resolve --applied 20251002234449_init || true

echo "Running prisma migrate deploy"
npx prisma migrate deploy

echo "Starting server"
node dist/server.js
