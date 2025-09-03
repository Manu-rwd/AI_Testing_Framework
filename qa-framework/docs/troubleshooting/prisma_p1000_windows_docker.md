## Prisma P1000 on Windows with Docker (qa-framework)

Symptoms:
- `prisma migrate dev` fails with P1000 Authentication failed for `qa_user` against `localhost:5433`, while `docker ps` shows the DB healthy.
- Postgres logs show repeated `database "qa_user" does not exist` during host attempts.

Environment:
- Docker service: `qa_local_pg` (ports 5433->5432)
- Inside container: host `localhost`, port `5432`, user `qa_user`, pass `qa_pass`, db `qa_framework`
- Host DSN: `postgresql://qa_user:qa_pass@localhost:5433/qa_framework?schema=public`

Checklist:
1) Ensure env files point to 5433
```
echo DATABASE_URL=postgresql://qa_user:qa_pass@localhost:5433/qa_framework?schema=public > .env
Set-Content -Path .\packages\db\.env -Value "DATABASE_URL=postgresql://qa_user:qa_pass@localhost:5433/qa_framework?schema=public"
```

2) Ensure user/password in container
```
docker exec -it qa_local_pg psql -U qa_user -d postgres -c "ALTER ROLE qa_user WITH LOGIN PASSWORD 'qa_pass';"
docker exec -it qa_local_pg psql -U qa_user -d postgres -c "\\du"
docker exec -it qa_local_pg psql -U qa_user -d postgres -c "\\l"
```

3) If P1000 persists, run Prisma from a Node container on the same Docker network (works reliably):
```
# Apply migrations
docker run --rm --network docker_default \
  -v %cd%:/work -w /work \
  -e DATABASE_URL=postgresql://qa_user:qa_pass@qa_local_pg:5432/qa_framework?schema=public \
  node:20 npx --yes prisma migrate dev --schema=packages/db/prisma/schema.prisma --name init

# Seed (clean Linux deps to avoid esbuild mismatch)
docker run --rm --network docker_default \
  -v %cd%:/work -w /work \
  -e DATABASE_URL=postgresql://qa_user:qa_pass@qa_local_pg:5432/qa_framework?schema=public \
  node:20 bash -lc "set -euo pipefail; \
    npm init -y >/dev/null; \
    npm i --silent @prisma/client@5.22.0 prisma@5.22.0 tsx@4.20.5 >/dev/null; \
    npx prisma generate --schema=packages/db/prisma/schema.prisma; \
    npx tsx packages/db/src/seed.ts"
```

4) If the volume had stale auth rules, reset dev DB:
```
docker compose -f docker\compose.local.yml down -v
docker compose -f docker\compose.local.yml up -d
```

Notes:
- `packages/db/prisma/schema.prisma` uses `env("DATABASE_URL")`; Prisma loads from `packages/db/.env` and also `packages/db/prisma/.env`. Avoid conflicts; keep one source.
- From host, always use port 5433; from containers on the same network, use `qa_local_pg:5432`.
- If host `prisma migrate` still fails, prefer the containerized commands above; they are repeatable and reliable.


