## Executive Summary
Adopt a v1 "thin agent" as a Node/TS CLI that directly calls OpenAI (primary: `gpt-4.1-mini`, secondary: `gpt-4.1`, fallback: Claude 3.5 Sonnet). Keep outputs deterministic via temperature=0, fixed prompts, and post-process with `@pkg/spec.formatManual`. Use in-process cosine retrieval at first; plan a v1.5 upgrade to Qdrant. Evaluation uses `@pkg/spec` and `@pkg/parity` in CI with a single deterministic sample to avoid flakiness. This path fits Windows + pnpm and can be built in 1–2 days.

### Comparison Matrix (high-level)
- Models: 4.1-mini (cost/latency/stability) > 4.1 (capability/context) > Claude 3.5 (fallback quality).
- Embeddings: `text-embedding-3-small` v1; upgrade to `-large` as needed.
- Vector store: in-memory/sqlite v1; Qdrant v1.5.
- Frameworks: thin client now; reconsider lightweight helpers only if needed.

### Costs & Limits
- Cache aggressive by content hash; prefer short-context reruns where possible.
- Monthly estimate depends on pairs refined; start with capped CI sample.

### Risks & Mitigations
- Drift between spec and gold → canonicalize vocabulary; periodic sync review.
- Brittleness of phrasing → parity strictly matches normalized narrative; Fixer iterates up to N=2.
- Vendor lock-in → define prompt interface; fallback provider; export JSONL artifacts.

### Rollback Plan
- Disable agent path; revert to `us2manual.mjs` baseline; keep parity CI running.


