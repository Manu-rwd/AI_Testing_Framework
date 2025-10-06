# Merge Note - Module 11 (UI/UX Guide Ingestor)

- Date: 2025-09-25 10:42:12 UTC
- Branch merged: feature/uiux-ingestor -> main
- Merge status: SKIPPED (branch not found)
- Summary: Parse UI/UX guide MD/HTML into deterministic uiux.yaml with zod validation, facet mapping, guide_hash, and uiux_version.
- Tests: workspace tests passed (converter, ingestor, planner suites).
- Python gates: flake8 + mypy passed via local venv (ADEF\.venv).
- Optional smoke ingest: skipped (no MD present)
- Ancestry check: SKIPPED (branch not found)

CLI references:
- Convert: pnpm -C qa-framework uiux:convert -- --in [abs path to pdf] --out [abs path md] --also-html
- Ingest:  pnpm -C qa-framework uiux:ingest -- --project ./projects/example --in qa-framework/temp/uiux_guide.md
