# DB Package

Prisma + PostgreSQL. Migrations and seeds live here.

## Commands
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
```

## Troubleshooting: Prisma P1000 on Windows with Docker

If `prisma migrate` fails with P1000 (auth failed) while Postgres is healthy and credentials are correct:

- Ensure DATABASE_URL uses host port 5433:
  - packages/db/.env:
    - `DATABASE_URL=postgresql://qa_user:qa_pass@localhost:5433/qa_framework?schema=public`

- Confirm the role and DB inside the container:
  - `docker exec -i qa_local_pg psql -U qa_user -d postgres -c "\\du"`
  - `docker exec -i qa_local_pg psql -U qa_user -d postgres -c "\\l"`

- If P1000 persists, run Prisma from a Node container on the same Docker network (bypasses host auth quirks):

```bash
# Apply migrations inside a container on the docker_default network
docker run --rm --network docker_default \
  -v %cd%:/work -w /work \
  -e DATABASE_URL=postgresql://qa_user:qa_pass@qa_local_pg:5432/qa_framework?schema=public \
  node:20 npx --yes prisma migrate dev --schema=packages/db/prisma/schema.prisma --name init

# Seed inside container (clean Linux deps, avoids esbuild mismatch)
docker run --rm --network docker_default \
  -v %cd%:/work -w /work \
  -e DATABASE_URL=postgresql://qa_user:qa_pass@qa_local_pg:5432/qa_framework?schema=public \
  node:20 bash -lc "set -euo pipefail; \
    npm init -y >/dev/null; \
    npm i --silent @prisma/client@5.22.0 prisma@5.22.0 tsx@4.20.5 >/dev/null; \
    npx prisma generate --schema=packages/db/prisma/schema.prisma; \
    npx tsx packages/db/src/seed.ts"
```

Notes:
- Docker service maps 5433:5432; container address is `qa_local_pg:5432`.
- Host DSN: `postgresql://qa_user:qa_pass@localhost:5433/qa_framework?schema=public`.
- If the DB volume has stale auth, reset: `docker compose -f docker\compose.local.yml down -v && docker compose -f docker\compose.local.yml up -d`.


