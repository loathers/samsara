#!/usr/bin/env bash
set -euo pipefail

# Run DB migrations on container start (safe to run repeatedly)
yarn prisma migrate deploy

# Then run the passed command (default: yarn start)
exec "$@"
