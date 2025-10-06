## Evaluation Protocol

### Benchmarks/Datasets
- Sample US and gold manuals from `qa-framework/docs/us/` and `projects/example/standards/coverage/` (tip-specific YAMLs).
- For each tip (Vizualizare, Adăugare, Modificare, Ștergere, Activare): at least 1 module.

### Metrics
- **Style**: `@pkg/spec.validateManual` returns `ok=true` and 0 issues (strict).
- **Parity**: `@pkg/parity.score` percent ≥ 95 for CRUD; ≥ 85 for visual-only.

### Harness (local)
- Generate baseline: `pnpm -w -C qa-framework run us:bridge`
- Run agent (dry-run ok): `pnpm -w -C qa-framework --filter @apps/agent agent:refine -- --tip Vizualizare --project ./projects/example`
- Score: `pnpm -w -C qa-framework parity:score -- --project ./projects/example --tip Vizualizare --manual manual_output/Documente_Manual.md`

### CI Job (non-flaky)
- Use cached inputs by content hash; single deterministic sample (Vizualizare) to assert ≥ threshold.
- Steps:
  - Restore cache (JSONL + embeddings + model cache).
  - Run agent on one fixed pair.
  - Validate style; run parity; fail if below threshold.

### Regression Policy
- Any drop >1% on fixed sample blocks merge.
- Update gold/spec only with change doc and rerun full parity on affected modules.


