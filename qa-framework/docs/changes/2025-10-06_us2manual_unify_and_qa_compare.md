# Change — US→Manual bridge unify output + QA comparator

Date: 2025-10-06
Category: Modification

## What

- Unify US→Manual bridge output directory to `manual_output/`.
- Add lightweight QA text comparator CLI to compute coverage vs a gold QA list.
- Add npm script `qa:compare` for easy local parity checks.

## Why

- Prior bridge wrote to `Manual_output/` while other tools used `manual_output/`, causing confusion and path errors.
- The parity scorer operates on bucketed emitter lines; for human QA review we also need a fast comparator for enumerated QA text.

## How

- Edited `qa-framework/tools/us2manual.mjs` to target `manual_output/` consistently.
- Created `qa-framework/tools/qa_compare.mjs` that:
  - Reads gold enumerated QA lines (e.g. `01. Narrative {tags}`) and emitter bullets (`- [bucket] narrative {facets:...}`), normalizes diacritics/whitespace.
  - Computes exact narrative matches (1:1, no duplicates) and reports percent matched, total, threshold, pass/fail.
- Added `qa:compare` script in `qa-framework/package.json`.

## Acceptance

- `pnpm -C qa-framework run us:bridge` writes manuals under `manual_output/`.
- `pnpm -C qa-framework run qa:compare -- --gold ../manual_output/<gold>.txt --manual ../manual_output/<gen>.md --threshold 0.95` prints JSON and exits 0 when ≥95%.

## Impacted files

- `qa-framework/tools/us2manual.mjs`
- `qa-framework/tools/qa_compare.mjs` (new)
- `qa-framework/package.json`

## Notes

- Commit subject kept ASCII-only; file encodings UTF-8 LF.
- No secrets or credentials added.


