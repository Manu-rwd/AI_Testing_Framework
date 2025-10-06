## PoC Plan (v1 Thin Agent)

### New workspace app
- `apps/agent/` (Node/TS) with CLI commands:
  - `agent:refine` — run supervise→rewrite loop on one or many inputs.
  - `agent:train` — build JSONL + embeddings store from repo docs and pairs.
  - `agent:suggest` — generate repo edit prompts from parity misses.
  - `agent:watch` — watch `US_input/` and refine on change (optional).

### Environment
- `.env`: `OPENAI_API_KEY`, `AGENT_MODEL=gpt-4.1-mini`, `EMBEDDINGS_MODEL=text-embedding-3-small`.
- Windows-first scripts; enforce LF via existing `check:lineendings`.

### Data dirs
- `qa-framework/data/agent/{jsonl,embeddings,refined,cache,suggestions}`

### Commands (pnpm scripts to add)
- In root `qa-framework/package.json`:
  - `agent:refine`: `pnpm --filter @apps/agent start:refine`
  - `agent:train`: `pnpm --filter @apps/agent start:train`
  - `agent:suggest`: `pnpm --filter @apps/agent start:suggest`

### CI
- Add a job that runs `agent:refine` on a fixed sample and asserts:
  - `@pkg/spec.validateManual` returns ok
  - `parity:score` ≥ threshold
- Use cached artifacts by content hash.

### Next steps checklist
1) Create `apps/agent/` with CLI skeleton and env loading.
2) Implement cache (hash of inputs + prompt version -> JSON).
3) Implement embeddings helper (OpenAI embeddings) and cosine search.
4) Implement Refiner → Normalizer → Scorer loop with N=2 retries.
5) Write JSON schemas (Zod) for model outputs.
6) Wire `@pkg/spec.formatManual` and `@pkg/parity.score` calls.
7) Add `agent:suggest` to produce Cursor prompts + acceptance criteria.
8) Create `qa-framework/data/agent/` directories.
9) Add pnpm scripts to `qa-framework/package.json` for agent commands.
10) Add a CI job (Windows-compatible) to run the single deterministic sample.
11) Add a change doc under `qa-framework/docs/changes/...` referencing this research.
12) Verify ADEF gates remain green.


