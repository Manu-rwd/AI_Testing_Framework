# AI QA Framework — Modular Roadmap

*Owner:* Manu Rusu  
*Project:* AI-driven testing (RO manual plans → EN Playwright)  
*Repo:* `qa-framework` (monorepo)  
*Status Legend:* ☐ Not started · ☐▶ In progress · ☑ Done · ☐✖ Blocked

---

## Project Description
This project builds an **AI-driven QA testing framework**. It mirrors the QA team’s **manual Excel workflow** (Romanian templates → test plans) and automates:
- **Plan generation in Romanian** (from standardized templates + user story)
- **Selector map + parameter binding**
- **Export as CSV/XLSX (for automation) + Markdown (for QA documentation)**
- **Codegen in English** (Playwright TypeScript tests)
- **Executor** (local first, then Playwright MCP)
- **GUI** (non-technical users)

The system is modular and progresses module-by-module (9 sheets from the Excel library).

---

## Milestones
- **M0:** Repo + backups in place
- **M1:** Accesare module normalized and approved
- **M2:** All 9 modules normalized & seeded to DB
- **M3:** Planner generates Romanian plan from US + Excel
- **M4:** Dual outputs (CSV/XLSX + .md) approved by QA
- **M5:** Selector map GUI + Data profiles
- **M6:** Playwright codegen (EN) for approved cases
- **M7:** Local executor (then MCP)
- **M8:** Auth + server deployment

---

## Phase 0 — Safety, Repo, & Tooling
- [ ] Create **Git repo** (`qa-framework`) with `.editorconfig`, `.gitignore`, `README.md` (this roadmap)
- [ ] Enable **branch protection** (`main`), required PR review
- [ ] Set up **offsite backups** (Git remote + ZIP export after milestones)
- [ ] Configure **Cursor** project (OpenAI API key, TypeScript strict)
- [ ] (Optional) Enable **Codex** (ChatGPT) on the same repo for cloud PRs

---

## Phase 0.1 — Repo Bootstrap Plan (for Codex)
**Folder structure (first commit):**
```
qa-framework/
  apps/
    api/        # backend service (Fastify/NestJS)
    web/        # Next.js GUI
  packages/
    db/         # Prisma schema + migrations
    agents/     # Planner, Codegen, Executor logic
    schemas/    # Zod schemas for validation
    codegen/    # Playwright TS generator
    executors/  # test runner wrappers
  data/
    templates/  # normalized template dumps (per module)
  docs/
    roadmap.md  # this file
    modules/    # module-level .md files after review
  exports/
    # per-module CSV/XLSX outputs
  docker/
    compose.local.yml  # local Postgres only
.gitignore
.editorconfig
README.md
```

**Initial commit files:**
- `README.md` → short project intro + setup instructions
- `docs/roadmap.md` → this roadmap file
- `docker/compose.local.yml` → Postgres service only
- `packages/db/prisma/schema.prisma` → stub schema (User, TestTemplate)
- `apps/api/README.md`, `apps/web/README.md` → placeholders
- `packages/agents/README.md` → placeholder

**PR Workflow with Codex:**
1. **You**: open an issue/PR in GitHub (e.g., “Normalize Accesare module”).
2. **Codex**: generate scripts/code, open a PR against `main`.
3. **Cursor**: you review locally, test, merge.
4. **Codex** can also run normalization for each sheet and produce CSV/.md directly.

**Branching:**
- `main` → stable
- `dev` → active feature work
- Feature branches: `feature/<module>-normalization`

---

## Phase 1 — Data Model & DB Bootstrap
- [ ] Initialize **Prisma + PostgreSQL** (local Docker Compose)
- [ ] Create minimal schemas for: `template`, `template_step`, `template_param`, `template_variant`, `module`, `bucket`
- [ ] Seed tables: **modules** (9 sheets) & canonical **functionality types**
- [ ] Implement importer **skeleton** (XLSX → JSON rows per sheet)

**DoD (P1):** can import one sheet into staging tables without loss (columns + cell comments captured).

---

## Phase 2 — Module Normalization Loop (repeat ×9)
### Per-module checklist
- [ ] Extract rows filtered by **Tip functionalitate** (single type) + include **General valabile = 1** within filtered set
- [ ] Parse **Legenda** → placeholder dictionary (sheet-specific)
- [ ] Convert `Caz de testare` → **narrative_ro** + **placeholders** + **atoms** (step skeleton)
- [ ] Ingest **cell comments** → `step_hints`
- [ ] Map **Bucket** + metadata (Impact, Efort, Importanță, Env flags)
- [ ] QA **review + improve** ambiguous cases; add missing cases
- [ ] Write module **CSV/XLSX export** (tabular) and **.md** (human doc)
- [ ] Seed normalized templates into DB

### Module trackers
- [ ] **Accesare**
- [ ] **Autorizare**
- [ ] **FRT-Output inițial**
- [ ] **BKD-Input**
- [ ] **BKD-Proces**
- [ ] **FRT-Confirmare acțiune**
- [ ] **FRT-Output final**
- [ ] **Reverificare output final**
- [ ] **Particulare**

**DoD (per module):** approved .md + CSV/XLSX; DB seeded; importer can re-run idempotently.

---

## Phase 3 — Selector Map & Data Profiles
- [ ] RO → **selector registry** format (testid/role/CSS) with GUI editing
- [ ] Auto-suggest selectors from US text; require QA confirm/override
- [ ] **Data profiles** (e.g., `local-default`, `test-default`, `prod-default`) with parameter values (EMAIL, PASSWORD, etc.)

**DoD:** selector map saved per component/page; profiles versioned.

---

## Phase 4 — Planner (Romanian Plan from US)
- [ ] Parser for **User Story** (RO) → features, components, buckets, fields (with regex)
- [ ] Filter templates by **functionality type**; include **General valabile**; limit to **US-mentioned buckets**
- [ ] Bind parameters from **data profile** + US specifics
- [ ] Expand to locales/viewports (rules toggleable)
- [ ] Validate: no unknown placeholders; narrative matches atoms
- [ ] Emit **Plan (RO)**

**Outputs:**
- [ ] **CSV/XLSX** for codegen
- [ ] **.md** for QA

**DoD:** Given US → plan created in RO with consistent numbering and metadata.

---

## Phase 5 — Codegen (Playwright EN)
- [ ] TS generator (atoms → Playwright) + lint/typecheck gate
- [ ] Bilingual header comment (RO title + EN description)
- [ ] Foldering: `features/<module>/<case>.spec.ts`
- [ ] Config: retries, trace, screenshot-on-fail

**DoD:** Generate deterministic, compilable specs for approved cases.

---

## Phase 6 — Executor (Local → MCP)
- [ ] Local **Playwright** run pipeline (no MCP) with artifacts
- [ ] Results store (JSON) + artifact viewer
- [ ] Swap to **Playwright MCP** client; shard & stream logs

**DoD:** One-click run from GUI; artifacts visible per case.

---

## Phase 7 — GUI (No-auth → Company email auth)
- [ ] Local GUI (no auth): submit US, preview plan, export CSV/.md, manage selector map
- [ ] Add company email auth (NextAuth Email) when ready

**DoD:** Non-technical QA can generate and export plans end to end.

---

## Phase 8 — Deployment & Ops
- [ ] Docker Compose for server; Postgres + API + Web
- [ ] Backups (DB dump + artifacts) + monitoring
- [ ] CI (lint, typecheck, unit tests, golden tests for codegen)

---

## Phase 9 — Governance & Iteration
- [ ] Template change proposals (PR workflow)
- [ ] Feedback loop: rejected/edited plan cases improve future selection
- [ ] Prioritization model v2 (use Impact/Efort/Importanță)

---

## Artifacts to keep in repo
- `/docs/roadmap.md` (this file)
- `/docs/modules/<module>.md` (approved human docs)
- `/exports/<module>.csv` (tabular)
- `/data/templates/*.json` (normalized dumps)

---

## Fast Start Checklist
- [ ] Commit this roadmap to repo
- [ ] Bootstrap repo folders + placeholders (Phase 0.1)
- [ ] Import **Accesare** (single functionality type)
- [ ] Produce Accesare CSV + .md → review
- [ ] Repeat for other modules
- [ ] Wire Planner → Outputs → Codegen → Executor

