Below are ready-to-commit files. Create the folder structure, then paste each file exactly as shown.

---

## 1) `.editorconfig`
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

---

## 2) `.gitignore`
```gitignore
# Node
node_modules/
.pnpm-store/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Env
.env
.env.*

# Build
.next/
dist/
build/
coverage/

# DB & Artifacts
/.artifacts/
/exports/

# OS / IDE
.DS_Store
.vscode/
.idea/
```

---

## 3) `README.md`
```md
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
```

---

## 4) `package.json` (root)
```json
{
  "name": "qa-framework",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev:web": "pnpm --filter @app/web dev",
    "dev:api": "pnpm --filter @app/api dev",
    "prisma:generate": "pnpm --filter @pkg/db prisma:generate",
    "prisma:migrate": "pnpm --filter @pkg/db prisma:migrate",
    "db:seed": "pnpm --filter @pkg/db seed",
    "lint": "echo 'add linter later'",
    "typecheck": "echo 'add typecheck later'"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

---

## 5) `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## 6) `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@pkg/*": ["packages/*/src"],
      "@app/*": ["apps/*/src"]
    }
  }
}
```

---

## 7) `docker/compose.local.yml`
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    container_name: qa_local_pg
    environment:
      POSTGRES_USER: qa_user
      POSTGRES_PASSWORD: qa_pass
      POSTGRES_DB: qa_framework
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qa_user"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pgdata:
```

---

## 8) `apps/web/README.md`
```md
# Web (GUI)

Next.js app (to be added). Local dev will run without auth first.
```

---

## 9) `apps/api/README.md`
```md
# API

Backend service (Fastify or NestJS — TBD).
```

---

## 10) `packages/db/README.md`
```md
# DB Package

Prisma + PostgreSQL. Migrations and seeds live here.

## Commands
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
```
```

---

## 11) `packages/db/package.json`
```json
{
  "name": "@pkg/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.15.0"
  },
  "devDependencies": {
    "prisma": "^5.15.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 12) `packages/db/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Minimal bootstrap models (expand later)
model Module {
  id    String @id @default(uuid())
  name  String @unique
  order Int
}

model TestTemplate {
  id        String   @id @default(uuid())
  moduleId  String
  key       String   @unique
  titleRo   String
  narrativeRo String
  generalValabile Boolean @default(false)
  tipFunctionalitate String // e.g., "Adaugare, Modificare"
  bucket    String?
  impact    Int?
  efort     Int?
  importanta Int?
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())

  module Module @relation(fields: [moduleId], references: [id])
}
```

---

## 13) `packages/db/src/seed.ts`
```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const modules = [
    "Accesare",
    "Autorizare",
    "FRT-Output initial",
    "BKD-Input",
    "BKD-Proces",
    "FRT-Confirmare actiune",
    "FRT-Output final",
    "Reverificare output final",
    "Particulare"
  ];
  for (let i = 0; i < modules.length; i++) {
    await prisma.module.upsert({
      where: { name: modules[i] },
      create: { name: modules[i], order: i + 1 },
      update: { order: i + 1 }
    });
  }
  console.log("Seeded modules");
}

main().finally(async () => prisma.$disconnect());
```

---

## 14) `packages/agents/README.md`
```md
# Agents

Will host:
- Planner (RO plan from user story + Excel templates)
- Codegen (EN Playwright from atoms)
- Executor (local → MCP)
```

---

## 15) `packages/schemas/package.json`
```json
{
  "name": "@pkg/schemas",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

---

## 16) `packages/schemas/src/index.ts`
```ts
import { z } from "zod";

export const Atom = z.object({
  kind: z.enum(["action", "assert"]),
  type: z.string(),
  selector: z.string().optional(),
  to: z.string().optional(),
  value: z.any().optional(),
  keys: z.string().optional(),
  state: z.string().optional(),
  matches: z.string().optional(),
  op: z.string().optional(),
  count: z.number().optional(),
  meta: z.record(z.any()).optional()
});

export type Atom = z.infer<typeof Atom>;
```

---

## 17) `.cursorrules` (optional but recommended)
```txt
- Use TypeScript strict everywhere.
- Keep functions pure in agents where possible.
- Validate all LLM outputs with Zod.
- Prefer role-based or data-testid selectors in Playwright.
```

---

## 18) `docs/roadmap.md`
> Paste the roadmap file from the canvas here (same content).

---

## 19) `.env.example` (root)
```bash
DATABASE_URL=postgresql://qa_user:qa_pass@localhost:5432/qa_framework?schema=public
OPENAI_API_KEY=sk-REPLACE
```

---

### Next actions
1) Create the repo `qa-framework` and commit these files.
2) `pnpm i` → `docker compose -f docker/compose.local.yml up -d` → `pnpm -w prisma:generate` → `pnpm -w prisma:migrate` → `pnpm -w db:seed`.
3) Point **Codex** at the repo and open the first PR: *Importer skeleton for Accesare sheet*.

