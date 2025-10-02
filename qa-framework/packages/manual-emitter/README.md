# Manual QA Emitter (strict parity)

Emits Romanian Markdown that mirrors the QA template headings exactly. No internal metadata is leaked.

Precedence and provenance are handled upstream (Module 13). This emitter only filters and formats:

- Filter by **Tip functionalitate** (`--filter-tip`).
- Include only rows with **General valabile = 1** (`--include-general-only`).

CLI:
```bash
pnpm -C qa-framework --filter @pkg/manual-emitter run cli -- --in temp/merged_plan.json --out docs/modules/Accesare_Manual.md --filter-tip Accesare --include-general-only --title "Plan de testare — Accesare"
```
