## Architecture Options for QA Refinement Agent

### Option A — v1 "Thin Agent" (recommended starter)

- **Form**: Node/TS CLI app `@apps/agent` in pnpm workspace.
- **APIs**: Direct OpenAI REST (primary), Anthropic as fallback.
- **State**: Local JSONL store under `qa-framework/data/agent/` with cosine retrieval (in-memory or sqlite-backed).
- **Integration**: Uses `@pkg/spec` for format/validate, `@pkg/parity` for scoring, `qa-framework/tools/us2manual.mjs` for baseline.
- **Determinism**:
  - temperature=0, top_p=1; fixed prompt templates; content-hash caching.
  - Post-process with `formatManual({ stripProvenance: true })` and emit QA-enumerations via `@pkg/manual-emitter` rules.
  - Diacritics normalization mirrors emitter and parity scorer.
- **Windows**: Single `node` CLI; no Docker required.

Sequence (happy path):

```
Developer → agent:refine → (load US, gold?, context) → embed/retrieve (local) → LLM refine(JSON) → @pkg/spec.formatManual → @pkg/parity.score → if <thr & iter<N: re-prompt else: write artifacts
```

Failure modes & handling:
- API unavailable: skip refinement, emit baseline from `us2manual` + suggestions stub; log redacted error.
- Style invalid: re-normalize; if still invalid, attach validator issues in report.
- Parity < threshold after N iters: produce diff + reason codes; mark FAIL for CI sample run.

### Option B — v1.5 "RAG+" (Qdrant)

- **Adds**: Qdrant via Docker Compose on Windows; ingest repo docs, spec vocab, emitter rules, and recent pairs.
- **Changes**: Retrieval via HTTP to Qdrant; same agent core.
- **Determinism**: unchanged; retrieval improves context quality but final output still normalized.
- **Windows constraints**: Ensure Docker Desktop WSL2 backend; allocate 2–4GB RAM.

Data flow:

```
agent:train → ingest JSONL → embeddings → Qdrant(collection: repo_ctx) → agent:refine queries Qdrant → LLM → normalization → scoring → artifacts
```

Failure modes:
- Qdrant down: fall back to in-process retrieval; warn.
- Collection drift: include schema versioning; re-index on version bump.

### Option C — v2 "Local Service"

- **Form**: Local service (Node/TS) exposing HTTP endpoints with a job queue, rate limiter, artifact store.
- **Adds**: Concurrency control, retry/backoff, runbooks.
- **Use when**: Multiple teams or CI jobs require parallel refinement.

Sequence (simplified):

```
CLI → Service.enqueue → Worker(fetch ctx → LLM → normalize → score) → Artifacts(JSONL, MD, reports) → Service emits events → CLI polls/status
```

### Determinism Strategy (all options)

- Pin prompts and model versions; set temperature=0, top_p=1; force JSON output; reject/resample until valid JSON.
- Canonicalize: LF line endings; NFD strip diacritics before comparisons; stable sorting; dedupe.
- Always pass through `@pkg/spec.formatManual({ stripProvenance: true })` then emit QA enumeration.

### References (repo code behavior)

```210:231:qa-framework/packages/manual-emitter/src/emit.ts
// dedupe + stable sort, then formatted output (spec view)
uniq.sort(stableCompare);
const out: string[] = [ `# ${title}`, "" ];
```

```49:58:qa-framework/packages/parity/src/score.ts
// narrative equality after diacritics normalization; facets Jaccard
if (normalizeText(m.narrative) !== covNarr) return;
```


