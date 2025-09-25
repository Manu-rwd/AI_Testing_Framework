# Merge Note — Module 10 & LFS Migration

- Date/Time UTC: 2025-09-25T00:00:00Z

## Merged Into `main`
- 4913b13 merge: Module 10 — feature/uiux-converter-pdf-priority into main
- fd8744a merge: Module 10 — feature/uiux-converter-local-bins into main
- dd940d2 merge: Module 10 — feature/uiux-converter into main

## Git LFS
- Tracked: `qa-framework/tools/pandoc/pandoc.exe`, `qa-framework/tools/poppler/bin/*.exe`, `qa-framework/tools/poppler/bin/*.dll`
- Migration command used:
  - `git lfs migrate import --include="qa-framework/tools/pandoc/pandoc.exe,qa-framework/tools/poppler/bin/*.exe,qa-framework/tools/poppler/bin/*.dll" --include-ref=refs/heads/main`
- Confirmation: LFS attributes applied to tracked paths (filter=lfs)

## Tests
- `pnpm -C qa-framework -r test` → all green across workspace packages.

## Smoke Conversion
- Recommended absolute-path invocation:
  - `pnpm -C qa-framework uiux:convert -- --in "D:\\Proj\\Ai_Testing_Framework\\qa-framework\\input\\Ghid UIUX - Norme si bune practici 1.pdf" --out "D:\\Proj\\Ai_Testing_Framework\\qa-framework\\temp\\uiux_guide.md" --also-html`
- Backend: `Using pdftohtml at: <repo>/qa-framework/tools/poppler/bin/pdftohtml.exe`

## Notes
- Ensure `git-lfs` is installed locally and in CI.

---

# Batch Merge — Modules & Feature Branches

- When (UTC): 2025-09-25T00:00:00Z
- From tag: pre-merge-batch-20250925-075114 → main  
- Strategy: --no-ff -X theirs --log

## Merges performed
- feature/selector-data-profiles (local) merged
- origin/Module4 merged
- origin/Module6 merged
- origin/Module7 merged
- origin/Module8 merged
- origin/Module9 merged
- SKIP: origin/Module1, origin/Module2, origin/Module3, origin/chore/m9-finalize, origin/chore/replace-fixed-accesare-csv, origin/chore/review-accesare-adaugare, origin/feat/review-gate-m10, origin/feature/Module5, origin/feature/automation-emitter, origin/feature/importer-acceseaza, origin/feature/planner-rules-adaugare, origin/feature/review-tools, origin/feature/selector-data-profiles, origin/feature/us-review

## Tests
- Workspace tests passed locally (pnpm -C qa-framework -r test) after merges

## LFS
- Git LFS enabled. Current tracked files: 0
