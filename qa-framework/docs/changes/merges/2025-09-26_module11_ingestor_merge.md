# Merge Note - Module 11 UIUX Ingestor

- Date: 2025-09-26 05:34:41 UTC
- Branch merged: feature/uiux-ingestor -> main
- Summary: Parse UIUX guide MD or HTML into deterministic uiux.yaml with zod validation, facet mapping, guide_hash, and uiux_version.
- Tests: workspace tests passed (converter, ingestor, planner).
- Python gates: flake8 and mypy passed via local venv ADEF\.venv.
- Optional smoke ingest: skipped (no MD present)
- Merge status: OK
- Ancestry check: OK

CLI references:
- Convert: pnpm -C qa-framework uiux:convert -- --in "<abs path to pdf>" --out "<abs path md>" --also-html
- Ingest:  pnpm -C qa-framework uiux:ingest -- --project ./projects/example --in qa-framework/temp/uiux_guide.md
