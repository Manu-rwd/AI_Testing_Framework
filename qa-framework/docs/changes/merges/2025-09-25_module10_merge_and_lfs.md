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
