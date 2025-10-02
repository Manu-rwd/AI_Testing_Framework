# Module 14 - Manual QA Emitter (strict parity)

Date: 2025-10-02

- Branch: feature/manual-qa-emitter-v1
- Behavior: strict parity headings, deterministic order, no metadata leaks
- Filtering: Tip functionalitate; include only General valabile = 1
- CLI: pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in D:\Proj\Ai_Testing_Framework\qa-framework\temp\merged_plan.json --out D:\Proj\Ai_Testing_Framework\qa-framework\docs\modules\Accesare_Manual.md --filter-tip Accesare --include-general-only --title Plan de testare - Accesare
- Gates: flake8 OK, mypy OK, JS tests OK (workspace)