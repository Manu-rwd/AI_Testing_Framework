# QA Framework

AI-driven QA framework that mirrors the Romanian manual testing workflow (Excel library → Romanian test plan) and generates Playwright tests in English.

## Packages & Apps
- `apps/web` — Next.js GUI (no auth in local dev)
- `apps/api` — API service (Fastify/NestJS — TBD)
- `packages/db` — Prisma schema & migrations (PostgreSQL)
- `packages/agents` — Planner/Codegen/Executor logic
- `packages/schemas` — Zod schemas for typed contracts
- `packages/codegen` — Playwright TypeScript generator
- `packages/executors` — local runner (MCP later)

## Quickstart (local, Postgres only)
```bash
pnpm i
docker compose -f docker/compose.local.yml up -d
pnpm -w prisma:generate
pnpm -w prisma:migrate
```

More detail: see `docs/roadmap.md`.

## Planner v2 — Automation Plan emitter

Cheatsheet:

```powershell
pnpm planner:v2:adaugare -- --out-csv exports/Plan_Adaugare_v2.csv --out-md docs/Plan_Adaugare_v2.md
```

Creează automat și:
- `exports/Adaugare_Automation.csv` (UTF-8 BOM, CRLF)
- `docs/modules/Adaugare_Automation.md`



