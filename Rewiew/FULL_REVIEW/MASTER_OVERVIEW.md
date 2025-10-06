Title: Master Project Overview (Consolidated) (v1.1)

This is the single entry-point for the whole project context. It fuses the technical inventory with a high-level view, links to live artifacts, and summarizes decisions, current state, and next steps.

Contents
- Executive summary
- Repository and packages map (anchor to detailed architecture)
- Decisions, timeline, and current state
- Input/Output contracts and pipelines
- Quality gates and governance (ADEF)
- US → Manual (Module 16) bridge and outputs
- Parity Scorer (Module 15) and thresholds
- Known gaps and risks
- Next steps
- Source index (live references)

Executive summary
- Purpose: Build an AI-driven QA framework that ingests User Stories (US), normalizes and reviews them, generates dual plans (Manual + Automation), and enforces quality via validation and review gates; optionally emits Playwright tests.
- Status: Core engines are in place, tested, and green: Manual Emitter (Module 16, strict/deterministic lines), Parity Scorer (Module 15, coverage thresholds), Planner (emitters, review tools, validation), Merge Engine v2 (deterministic precedence), and a simple US→Manual bridge.
- Deliverables: Deterministic QA-style manuals, validated CSV/MD plans, parity reports, and reproducible finalize flows on Windows.

Repository and packages map
- See detailed architecture report: `docs/ARCHITECTURE_OVERVIEW.md` (workspace tree, packages inventory, scripts/CLIs, build/test settings, dependency graph).
- Key packages: `@pkg/manual-emitter`, `@pkg/parity`, `@pkg/merge`, `@pkg/planner`, `@pkg/project`, `@apps/us2manual`.
- Helper folders at repo root: `US_input/` (plain-text US) and `Manual_output/` (generated manuals); also `qa-framework/docs/modules/` for checked-in manuals.

Decisions, timeline, and current state
- Evolution timeline: `Rewiew/FULL_REVIEW/timeline.md` (windows 10k–87,613 processed).
- Key changes/decisions: `Rewiew/FULL_REVIEW/changes_and_decisions.md` (encoding/CSV policies, gates, selector/data profiles, bridge acceptance rules, finalize flow standardization).
- Current state snapshot: `Rewiew/FULL_REVIEW/current_state.md` (what’s merged/available and how to use it).
- Narrative overview: `Rewiew/FULL_REVIEW/overview_human.md`.
- Dense, reference-first overview: `Rewiew/FULL_REVIEW/overview_ai.md`.

Input/Output contracts and pipelines
- US → Manual (Module 16 tuned emitter):
  - Inputs: `US_input/*.txt` (or structured plan JSON)
  - Tools: `qa-framework/tools/us2manual.mjs` (`us:bridge`), `@apps/us2manual` (`us:emit`)
  - Output: `Manual_output/<Base>_Manual.md` or `qa-framework/docs/modules/*_Manual.md`
  - Guarantees: deterministic, de-duplicated bullet lines; overlay families; columns (2 lines each) + ASC/DESC; presence/pagination/responsive/resilience/auth; provenance HTML comments unless hidden by mode
- Manual → Parity (Module 15):
  - Inputs: `projects/<id>/standards/coverage/<Tip>.yaml` vs `docs/modules/<Area>_<Tip>_Manual.md`
  - CLI: `pnpm -C qa-framework --filter @pkg/parity run cli -- --project ./qa-framework/projects/<id> --tip <Tip> --manual ./qa-framework/docs/modules/<Area>_<Tip>_Manual.md`
  - Thresholds: CRUD ≥ 95%, visual-only ≥ 85%; exit code reflects pass/fail
- Planner (rules, enrichment, emitters) and Review/Validation gates: see `qa-framework/packages/planner/*` and scripts in `qa-framework/package.json`

Quality gates and governance (ADEF)
- ADEF gates: `ADEF/framework/config/quality_gates.yml`
- Local runs: `python ADEF/scripts/verify_adef_integration.py`; `flake8 ADEF/scripts`; `mypy --config-file mypy.ini ADEF/scripts`; `python ADEF/tools/check_quality_gates.py`
- Finalize flows (PowerShell 5.1 safe): `finalize_module15.ps1`, `finalize_module16.ps1` (UTF‑8 no BOM, pnpm -C scoped, JS tests, ADEF gates, branch merge, merge notes under `qa-framework/docs/changes/merges/`)

US → Manual (Module 16) bridge and outputs
- Bridge entrypoints: `us:emit` (TypeScript CLI at `@apps/us2manual`) and `us:bridge` (ESM wrapper at `qa-framework/tools/us2manual.mjs`).
- Folders: `US_input/` (inputs), `Manual_output/` (outputs) — created automatically by the wrapper.
- Acceptance (stricter prompt spec): enforce overlay families; two lines per column; ASC/DESC per sortable; presence/pagination/responsive/resilience/auth splits; stable order; no duplicates; provenance comments present (or hidden per mode).

Parity Scorer (Module 15)
- Matching: exact bucket + normalized narrative; Jaccard on facets; produces JSON + Markdown; exit code 0 on pass.
- Reports: `reports/<Area>_<Tip>_parity.{json,md}`.

Known gaps and risks
- Bridge has two entrypoints; unify (recommend keeping `us:emit`) and standardize folder names (prefer `manual_output/` or `Manual_output/` consistently).
- Some workspace packages lack `tsconfig.json` (build via tsx/tests only); document or add minimal tsconfigs if needed.
- CI wiring for ADEF gates to be confirmed/extended beyond local.

Next steps
- Unify the bridge command and folder naming; document one blessed path.
- Add canonical QA vocabulary and stricter parser rules to better align with QA-generated cases.
- Keep parity thresholds green via Module 15; add an acceptance wrapper (emit → score → enforce thresholds) in CI.
- Continue module reviews and expand coverage overlays; keep finalize flows for merges.

Source index (live references)
- High-level architecture: `docs/ARCHITECTURE_OVERVIEW.md`
- Human overview: `Rewiew/FULL_REVIEW/overview_human.md`
- AI overview: `Rewiew/FULL_REVIEW/overview_ai.md`
- Timeline: `Rewiew/FULL_REVIEW/timeline.md`
- Decisions: `Rewiew/FULL_REVIEW/changes_and_decisions.md`
- Current state: `Rewiew/FULL_REVIEW/current_state.md`
- Next steps: `Rewiew/FULL_REVIEW/next_steps.md`
- Signals cache (PDF/XLSX): `Rewiew/FULL_REVIEW/cache/signals/signals.json`
- Merge notes: `qa-framework/docs/changes/merges/`


