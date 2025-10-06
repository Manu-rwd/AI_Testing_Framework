# AI Testing Framework — Modular Build Roadmap (ChatGPT × Cursor)

_Last updated: 2025-09-03_  
**Backbone:** US → Review (agent + human-in-the-loop) → Dual Plans (Manual = QA template, Automation = atoms+metadata) → Optional Codegen (Playwright TS) → Executor/CI → Integrations.  
**Project concept:** Per-project standards (selectors, messages, regex, routes, permissions, coverage) fill US gaps with provenance.

---

## Collaboration Protocol (per module)

1. **New Chat (Module X)** → I generate a **one-shot Cursor prompt**.  
2. **You run Cursor** → paste build logs/results back here.  
3. **I analyze & propose tweaks** (patch prompts).  
4. Once stable, **I post a Handover message** to start the **next module chat**.

**Conventions**
- Branch names: `feature/<module-slug>`
- PR title: `feat(<area>): <module goal>`
- Windows-friendly commands: prefer `;` separators over `&&`
- Encoding: **UTF-8** only; avoid mojibake in RO docs

---

## Phase Overview

| Phase | Focus | Key Modules |
|---|---|---|
| 0 | Bootstrap (done) | Repo + DB + Importer for Accesare |
| 1 | Foundation | Project standards, US Review, Rules/Planner v2 |
| 2 | Plans | Manual emitter (QA template), Automation emitter (atoms/metadata) |
| 3 | Module Reviews | Accesare (Adăugare, Vizualizare), then other sheets |
| 4 | Automation Enablers | Selector strategy, Data profiles, Feasibility & review tools |
| 5 | Codegen & Execution | Playwright TS, Executor (local → MCP), CI & artifacts |
| 6 | Integrations & UX | Test mgmt export, Visual oracles, GUI app, Auth, Deployment |

---

## Module 1 — Project Standards Pack (data model + loader)

**Goal**: First-class “Project” with standards; enable gap-filling with provenance.  
**Inputs**: None (new files).  
**Outputs**:
- `/projects/<project_id>/Project.yaml` (policies, envs, selector strategy)  
- `/projects/<project_id>/standards/*.yaml` (selectors, messages, regex, components, coverage, env, permissions)  
- Loader in `@pkg/planner` to merge: **US > Project > Defaults**; tag `source=project` with small confidence bump.

**Acceptance**: Planner can load a project pack; when US lacks data, rows show `source=project`.

**Cursor One-Shot Prompt (template)**:
```bash
# Module 1 — Project Standards Pack
# Repo root assumed: qa-framework

# 1) Create /projects/<id> standards skeleton
# 2) Add Zod/YAML schema validation + loader in @pkg/planner
# 3) Wire CLI: --project ./projects/<id> to enable fallbacks
# 4) Unit tests for precedence & provenance

# Files:
# - projects/example/Project.yaml
# - projects/example/standards/{selectors,messages,regex,components,coverage,env,permissions}.yaml
# - packages/planner/src/project/{schema.ts,load.ts,merge.ts}
# - packages/planner/src/types/project.ts

# Scripts:
# - "planner:test:project": "tsx packages/planner/test/project_loader.test.ts"

# Branch: feature/project-standards-pack

Handover (next-chat)
“Open a new chat: Module 2 — US Review Agent & Normalization.”

Module 2 — US Review Agent & Normalization

Goal: Convert free-text US to US_Normalized.yaml, compute confidence, emit US_Gaps.md.
Inputs: User Story text.
Outputs: US_Normalized.yaml, US_Gaps.md, per-section + overall confidence; planner refuses < threshold unless project fallbacks allowed.

Acceptance: Demo on input/us_and_test_cases.txt with strict/lax toggle, showing gaps & score.

Cursor One-Shot Prompt:
# Module 2 — US Review Agent
# 1) Implement parser + gap detector in @pkg/planner/src/us-review/
# 2) Emit US_Normalized.yaml + US_Gaps.md; compute per-section & overall confidence
# 3) CLI: --us <path> --project <path> --strict|--lax --min-confidence 0.6
# 4) Unit tests on synthetic US variants
# Branch: feature/us-review-normalization

Handover
“Next chat: Module 3 — Rules & Planner v2 (strict/lax buckets, provenance, AAA atoms).”

Module 3 — Rules & Planner v2 (strict/lax, provenance, AAA)

Goal: Extend rules to support bucket policy, required sections, min_confidence; planner to produce AAA atoms.
Inputs: Rules YAML (e.g., rules/adaugare.yaml), US_Normalized.yaml, Project pack.
Outputs: In-memory plan rows with setup[]/action[]/assert[]/oracle_kind, provenance, rule_tags.

Acceptance: Planner for Adăugare and Vizualizare yields atoms + provenance per row.

Cursor Prompt:
# Module 3 — Planner v2
# - Update packages/rules/schema.ts: {required_sections, min_confidence, buckets.mode}
# - Engine: merge US+Project; select cases; generate AAA atoms
# - Provenance: source=US|project|defaults + rule_tags[]
# Branch: feature/planner-v2-aaa

Handover
“Next chat: Module 4 — Manual Plan Emitter (QA template).”

Module 4 — Manual Plan Emitter (QA template)

Goal: Render manual plan exactly in QA’s Markdown template.
Inputs: Grouped cases + QA-owned template.
Outputs: docs/modules/<Module>_Manual.md

Acceptance: Manual doc matches QA template 1:1.

Cursor Prompt:
# Module 4 — Manual Emitter
# - Add template renderer using QA template at docs/templates/manual/standard_v1.md.hbs
# - CLI: --out-manual-md --manual-template
# - Snapshot test: rendered MD matches template
# Branch: feature/manual-emitter-template

Handover
“Next chat: Module 5 — Automation Plan Emitter (atoms + selectors + feasibility + CSV/MD).”

Module 5 — Automation Plan Emitter (atoms & metadata)

Goal: Emit automation plan MD + CSV (atoms, selectors, data profiles, feasibility, provenance).
Inputs: Planner v2 outputs.
Outputs: docs/modules/<Module>_Automation.md, exports/<Module>_Automation.csv

Acceptance: CSV columns at minimum:

module, tipFunctionalitate, bucket, narrative_ro, atoms, selector_needs, selector_strategy, data_profile,

feasibility (A–E), source, confidence, rule_tags, notes.

Cursor Prompt:
# Module 5 — Automation Emitter
# - Extend emitters: atoms, selector_needs, data_profile, feasibility, source, confidence, rule_tags
# - Windows-safe CSV; UTF-8 only
# Branch: feature/automation-emitter

Handover
“Next chat: Module 6 — Selector Strategy & Data Profiles.”

Module 6 — Selector Strategy & Data Profiles

Goal: Enforce selector preferences; define reusable data profiles (minimal_valid, invalid_regex, edge_*).
Inputs: Project selectors & regex; US fields.
Outputs: Planner enriches rows with selector_strategy and data_profile suggestions.

Acceptance: ≥10 rows demonstrate correct strategy & profiles for Accesare (Adăugare/Vizualizare).

Cursor Prompt:
# Module 6 — Selector & Data Profiles
# - Selector strategy engine honoring project preferences
# - Data profile resolver using project regex and US fields
# Branch: feature/selector-data-profiles

Handover
“Next chat: Module 7 — Feasibility & Review Tools.”

Module 7 — Feasibility & Review Tools

Goal: Grade A–E; extend CSVs with review columns; CLI helper to append review fields.
Inputs: Existing exports.
Outputs: Updated CSVs with disposition, feasibility, selector_needs, parameter_needs, notes + helper script.

Acceptance: pnpm review:extend:* appends columns without altering existing data.

Cursor Prompt:
# Module 7 — Review Tools
# - Harden extend_csv.ts; add linting and unit tests
# - Optional: JSON sidecar for review metadata
# Branch: feature/review-tools

Handover
“Next chat: Module 8 — Module Review: Accesare (Adăugare).”

Module 8 — Module Review: Accesare (Adăugare)

Goal: Normalize/approve Accesare(Adăugare) for planner/codegen.
Inputs: Accesare.normalized.json, exports CSV, QA template.
Outputs: Updated docs/modules/Accesare.md changelog; reviewed CSV with dispositions.

Acceptance: Module marked Approved; strict bucket compliance verified.

Cursor Prompt:
# Module 8 — Review Accesare(Adăugare)
# - Open exports/Accesare.csv; apply dispositions & feasibility
# - Update docs/modules/Accesare.md with changelog
# Branch: chore/review-accesare-adaugare

Handover
“Next chat: Module 9 — Module Review: Accesare (Vizualizare).”

Module 9 — Module Review: Accesare (Vizualizare)

Goal: Same as Module 8, for Vizualizare lanes.
Acceptance: Approved; examples ready for codegen.

Cursor Prompt:
# Module 9 — Review Accesare(Vizualizare)
# - Mirror process from M8
# Branch: chore/review-accesare-vizualizare

Handover
“Next chat: Module 10 — Playwright Codegen (from atoms).”

Module 10 — Playwright Codegen (TS, EN + RO header)

Goal: Generate TS tests from atoms with fixtures; respect selector strategy & data profiles.
Inputs: Automation CSV/MD, project selectors, data profiles.
Outputs: packages/codegen/* + generated specs under /specs/<module>.

Acceptance: Generate & run a smoke suite locally (Accesare flows) with trace/screenshot artifacts.

Cursor Prompt:
# Module 10 — Codegen
# - packages/codegen: atom-to-TS generator; page objects or screenplay pattern
# - Include a RO comment header per file
# Branch: feature/codegen-playwright

Handover
“Next chat: Module 11 — Executor (local → MCP).”

Module 11 — Executor (local runner → MCP later)

Goal: CLI to run generated tests locally; scaffolding for future MCP.
Outputs: packages/executors/ with run scripts; artifacts to /artifacts.

Acceptance: Parallel runs; JUnit XML emitted.

Cursor Prompt:
# Module 11 — Executor
# - Runner with env switch (Local/Test/Prod)
# - Emit JUnit XML + traces
# Branch: feature/executor-local

Handover
“Next chat: Module 12 — CI/CD & Artifacts.”

Module 12 — CI/CD & Artifacts

Goal: GitHub Actions (or preferred CI) to run tests, store artifacts, and publish JUnit.
Acceptance: Badge + artifacts; OIDC for secrets; Windows paths validated.

Cursor Prompt:
# Module 12 — CI/CD
# - .github/workflows/test.yml with matrix (node versions/envs)
# - Upload artifacts + JUnit
# Branch: ci/tests-and-artifacts

Handover
“Next chat: Module 13 — Integrations (Xray/TestRail).”

Module 13 — Integrations: Xray/TestRail Export

Goal: Export JUnit to management tools; optional API mapping.
Acceptance: One pipeline job publishes results; optional API sync PoC.

Cursor Prompt:
# Module 13 — Integrations
# - JUnit export path and docs
# - Optional: API client stubs for Xray/TestRail
# Branch: feature/integrations-test-mgmt

Handover
“Next chat: Module 14 — Visual Oracles (optional).”

Module 14 — Visual Oracles (Optional)

Goal: Applitools/Percy PoC for key flows (toasts, empty states).
Acceptance: Baseline established; flaky sensitivity assessed.

Cursor Prompt:
# Module 14 — Visual Oracles
# - PoC wiring + doc on when to use visual asserts
# Branch: poc/visual-oracles

Handover
“Next chat: Module 15 — GUI (Next.js) MVP.”

Module 15 — GUI (Next.js) MVP

Goal: Simple web app: upload US → Review Q&A → Dual Plans preview → Codegen button.
Acceptance: MVP works locally; Project picker & strict/lax toggle present.

Cursor Prompt:
# Module 15 — GUI MVP
# - apps/web: Next.js app (no-auth), pages for Intake/Review/Plans
# Branch: feature/gui-mvp

Handover
“Next chat: Module 16 — GUI Auth (email).”

Module 16 — GUI Auth (email)

Goal: Add email auth; store user’s projects; basic RBAC (viewer/editor).
Acceptance: Authenticated flows; project selection persisted.

Cursor Prompt:
# Module 16 — GUI Auth
# - apps/web: add auth provider; simple roles
# Branch: feature/gui-auth


Cross-Cutting: Docs & Governance

RFC + Data Contracts (before coding): schemas for US_Normalized.yaml, Rules v2, Plan CSV/MD, Project pack

Decision Log: keep under docs/decisions/

Encoding & Windows: normalize CRLF/LF; UTF-8 everywhere

Security/PII: redaction pre-processor before any hosted LLM; secretless CI (OIDC)

Handover Template (for each next chat)

Handover — Module {{N}}: {{Title}}
Goal: {{1–2 sentences}}
Inputs: {{files/paths}}
What to do: Paste the one-shot Cursor prompt I’ll provide in the new chat, run it, then paste the logs + diffs back here for review.

Appendix — Naming & Paths

Packages: @pkg/rules, @pkg/planner, @pkg/codegen, @pkg/executors, apps/web

Data: /projects/<id>/standards/*.yaml, /input/*.txt|xlsx, /data/templates/*.json

Docs: /docs/modules/*.md, /docs/templates/manual/*.hbs, /docs/decisions/*

Exports: /exports/*.csv, /artifacts/*

### Save locally (PowerShell, UTF-8)
```powershell
$path = "D:\Roadmap_Modular_Build.md"
@'
<PASTE THE MARKDOWN CONTENT FROM ABOVE HERE>
'@ | Set-Content -LiteralPath $path -Encoding UTF8
Write-Host "Saved to $path"
