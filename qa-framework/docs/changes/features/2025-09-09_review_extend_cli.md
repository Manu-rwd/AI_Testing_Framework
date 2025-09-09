### Title
Review Tools: CSV extender CLI and JSON sidecar (review:extend)

### What
- Adds a CLI and library to append five review columns to existing CSV exports.
- Optional JSON sidecar generation with per-row review metadata scaffold.
- Idempotent behavior, delimiter/BOM preservation, glob and directory support.

### Why
QA review requires consistent columns across exports and an auxiliary structure to track review state without altering source systems. This tool standardizes the columns and enables sidecar-based review workflows.

### How
- Implemented `packages/planner/src/review/extend_csv.ts` (CLI + lib).
- Appends columns: disposition, feasibility, selector_needs, parameter_needs, notes.
- Preserves delimiter ("," or ";"), quoting, BOM, header order, and row order.
- Optional `--sidecar` writes `<csv>.review.json` with empty review fields.
- Supports globs and directories; in-place by default; `--out` for redirected output; `--backup` to create `.bak`.

### Alternatives Considered
- Using csv-parse/stringify: custom minimal RFC-compatible splitter/joiner chosen to avoid reformatting existing files and to preserve exact formatting.

### Impacts
- New dependency: globby (planner package).
- No breaking changes; additive CLI and tests.

### Testing
- Vitest suite covers: delimiter and BOM preservation, idempotency, sidecar shape, globs, and backups.
- Manual: `pnpm review:extend -- exports/Accesare.csv`.

### Edited Files (key)
- `packages/planner/src/review/extend_csv.ts`
- `packages/planner/test/review/extend_csv.spec.ts`
- `packages/planner/test/review/extend_csv_cli.spec.ts`
- `packages/planner/package.json`
- `qa-framework/package.json`
- `docs/tools/Review_Tools.md`

### Rollback Plan
- Remove planner script and file; uninstall globby; revert docs/tests.


