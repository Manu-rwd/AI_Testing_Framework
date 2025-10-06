## Suggestions Pipeline (Repo Edits + Cursor Prompts)

### Inputs
- Parity report: missing, mismatched, extra.
- Validator issues (if any) from `@pkg/spec`.

### Mapping to Candidate Files
- `qa-framework/tools/us2manual.mjs`: heuristics for columns, sections, QA enrichment.
- `qa-framework/packages/manual-emitter/src/emit.ts`: deterministic QA lines, facets inference, overlays.
- `qa-framework/packages/spec/src/validator.ts`: regex and vocab for tags/sections.

### Diff Analysis → Suggestions
1) Classify miss: { phrasing, ordering, missing feature class, tag mismatch }.
2) Map class → target file(s):
   - phrasing/order: adjust emitter narratives or stable sort keys.
   - missing class (e.g., pagination selector): extend emitter `emitPresenceAndGeneric` or QA rules.
   - tag mismatch: update `BUCKET_TAGS` or validator vocab.
3) Generate concise one-shot Cursor prompts.

### Cursor Prompt Template (one-shot)

```
Goal: Fix QA manual generation to cover {class}.
Acceptance:
- `@pkg/spec.validateManual` passes (0 issues).
- `parity:score --project ./projects/example --tip {Tip} --manual {Manual.md}` ≥ {thr}%.
Change:
- Edit `{file}`: {brief change summary}.
Tests:
- `pnpm -w -C qa-framework spec:test` (if applicable)
- `pnpm -w -C qa-framework parity:score -- --project ./projects/example --tip {Tip} --manual {Manual.md}`
```

### Output Artifacts
- `qa-framework/data/agent/suggestions/{area}_{tip}_{ts}.md` — prompt bundle.
- `qa-framework/data/agent/suggestions/{area}_{tip}_{ts}.json` — machine readable summary.

### PR Etiquette & ADEF Gates
- Reference change doc; include test commands and parity before/after.
- Ensure Windows line endings policy: enforce LF via existing `check:lineendings`.
- No secrets in logs; link to artifacts.


