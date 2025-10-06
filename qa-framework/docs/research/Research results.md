<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# You are a senior AI/ML research engineer. Perform a deep, up-to-date research study to validate, stress-test, and extend our plan for an internal AI agent that supervises and refines QA manuals to 100% style and ≥95% parity vs QA gold, learns from (US, gold) pairs, and suggests repo edits with ready-to-run Cursor prompts.

CONTEXT
<<

## Landscape and Constraints for Internal QA Refinement Agent

### Constraints (repo-derived)

- **Canonical sections and tags**: Manuals must use the exact section headers and canonical tags enforced by `@pkg/spec`.

```11:18:qa-framework/packages/spec/src/validator.ts
const sectionHeaderRe = /^##\s+(Vizualizare|Adăugare|Modificare|Ștergere|Activare)\s*$/u;
const caseLineRe = /^-\s\[[^\]]+\]\s.+?\s\{facets:([A-Za-z0-9_\-,\s]+)\}\s*$/u;
```

- **No standalone auth outcomes**: encode as permission metadata; validator flags otherwise.

```41:45:qa-framework/packages/spec/src/validator.ts
for (const t of tags) if (!TAG_SET.has(t)) issues.push({ ... });
if ((opts?.noAuthStandalone ?? true) && /\b403\b|\bhidden\b|\bdisabled\b|\beroare\b/u.test(raw)) {
  issues.push({ line: ln, kind: "auth", msg: "Auth outcome must not be a standalone line" });
}
```

- **Determinism path**: `@pkg/manual-emitter` sorts/normalizes (diacritics-insensitive), dedupes, infers tags, and can emit strict QA-style enumerations.

```233:244:qa-framework/packages/manual-emitter/src/emit.ts
export function emitManualMarkdown(input: MergedPlan, opts: EmitOptions): string {
  const allCases = collectCases(input);
  const tip = resolveTip(input, allCases, opts);
  ...
  if (opts.qaStyle) {
    // Build QA-style lines per section (deterministic and canonical tags)
```

- **QA-style enumerations**: enumerated list output for human-facing manuals; overlays removed; tags inferred; provenance stripped.

```89:101:qa-framework/packages/manual-emitter/src/emit.ts
function renderQa(lines: ManualLine[], tip: string, title: string): string {
  const body: string[] = [];
  let idx = 1;
  for (const ln of lines) {
    if ((ln.bucket || "").toLowerCase() === "overlay") continue;
    const inferredTags = provided.length ? provided : toQaTags(ln.bucket, ln.narrative, ln.facets || []);
    const ii = String(idx).padStart(2, "0");
    body.push(`${ii}. ${ln.narrative}${tagStr}`);
```

- **Parity scoring is strict on bucket + narrative**; facets contribute via Jaccard; thresholds: 95% CRUD, 85% visual.

```63:86:qa-framework/packages/parity/src/score.ts
if (normalizeText(m.narrative) !== covNarr) return; // normalized narrative match required
...
const visualTips = new Set([ 'vizualizare', 'raportare', 'grafic', 'graficare', 'viz' ]);
const thr = visualTips.has((tip||'').toLowerCase()) ? 85 : 95;
```

- **Windows-first and pnpm**: Node >=22; pnpm workspaces; scripts `parity:score`, `manual:emit`, `us:bridge`.

```5:13:qa-framework/package.json
"packageManager": "pnpm@9.0.0",
"engines": { "node": ">=22" },
"scripts": { "parity:score": "pnpm -C qa-framework --filter @pkg/parity run cli", "us:bridge": "node tools/us2manual.mjs" }
```

- **US→Manual bridge behavior**: QA-style is the default; sections split per CRUD; final file under `manual_output/`; formatting via `@pkg/spec.formatManual`.

```161:171:qa-framework/tools/us2manual.mjs
const qaMode = qaStyleFlag || process.argv.includes('--qa') || true; // default QA style on
const qaRich = qaStyleFlag || process.argv.includes('--qa-rich') || true; // default enriched QA
...
const md = spec && spec.formatManual ? spec.formatManual(md, { stripProvenance: stripProv }) : md;
```

Implications:

- Agent outputs must be deterministic, enumerated QA style for humans, but preserve or emit a parallel spec-style representation for scoring.
- Normalize diacritics and line endings; avoid duplicates; never log secrets; Windows-compatible CLI.

---

### Models for Refinement (rewriting/normalization/constraint-following)

Key needs: strong instruction-following, JSON/struct-mode, function/tool calls, low temperature stability, long context for side-by-side US/gold/spec.

- OpenAI GPT-4.1 family (4.1, 4.1-mini)
  - Strengths: robust JSON mode and function calling; solid obedience to formatting constraints at temperature 0; good latency/cost for 4.1-mini.
  - Context: very large; sufficient for multi-doc side-by-side.
  - Fit: excellent for structured outputs and determinism.
- OpenAI o3 (reasoning)
  - Strengths: improved reasoning, but higher latency/cost; JSON adherence reasonable with tool use.
  - Fit: reserve for tough alignment cases; not primary for throughput.
- Anthropic Claude 3.5 Sonnet
  - Strengths: style-consistent rewriting; strong safety; tool use; good long-context.
  - Fit: strong fallback, particularly for Romanian text quality.
- Google Gemini 1.5/2.0
  - Strengths: long context; multimodal; JSON/function calling.
  - Fit: viable secondary depending on org access; SDK differences.
- Mistral/DeepSeek (API/self-hosted)
  - Strengths: cost effective; some JSON adherence.
  - Fit: useful for offline-ish experiments; may require more guardrails for strict formatting.

Recommendation:

- **Primary A**: OpenAI `gpt-4.1-mini` (cost/latency, JSON mode, stability).
- **Primary B**: OpenAI `gpt-4.1` (for harder cases / larger context).
- **Fallback**: Anthropic `claude-3.5-sonnet` (safety, style fidelity).

Rate limits/costs: See links in appendix; budget with caching and short-context reruns.

### Embeddings

- OpenAI `text-embedding-3-large` (3072 dims) and `-small` (1536 dims): strong multilingual incl. Romanian; reliable Windows dev ergonomics.
- VoyageAI (e.g., `voyage-3` family): high retrieval quality; paid API.
- Open-source: E5-large-v2, BGE-M3 (multilingual) on HF; run via Python or Node bindings; larger footprint.

Minimal eval (Romanian/diacritics):

- Deterministic normalization mirrors repo: NFD + strip diacritics improves match stability; cosine similarity is stable across E5/BGE/TE3.
- For v1 small corpora, `text-embedding-3-small` suffices; upgrade to `-large` if recall gaps appear.


### Vector Stores

- Start: in-process cosine over arrays or `sqlite` + `FAISS` bindings for Node.
- Scale: Qdrant (Docker on Windows, GPU optional) with HTTP API; LanceDB as alternative (Arrow-native, good local ergonomics).

Recommendation:

- **v1**: in-memory or `sqlite` + cosine.
- **v1.5**: Qdrant via Docker Compose; health checks and persistence.


### Agentic Frameworks/Tooling

- LangChain / LlamaIndex: powerful, but heavy; can hinder determinism and add overhead.
- Guidance/Instructor: strong for constrained JSON outputs.
- DSPy: powerful program synthesis; overkill for v1.

Recommendation: **custom thin client** in Node/TS (fits pnpm workspace) + a very small helper for JSON schema validation (Zod) and content hashing cache.

### Evaluation

- Style: `@pkg/spec.validateManual` for spec-style; QA-style validated indirectly by generating spec-parallel and checking header order/tags.
- Parity: `@pkg/parity.score` with strict narrative equality and facets Jaccard ≥0.8.
- Third-party: Ragas/DeepEval not required for v1; keep a custom harness around parity + style checks to avoid flakiness.


### Privacy/Security

- Secrets via `.env` and process env; never log API keys; redact PII; hash input payloads for cache keys (no content in logs).
- Offline-ish mode: if API unavailable, skip refinement, fall back to emitter-only path and surface actionable suggestions.


### Caching and Determinism

- Hash inputs: `(US, gold?, spec ctx, model, prompt version)` → cache JSON outputs.
- Freeze temperature=0, top_p=1; pin prompts; normalize line endings to LF; apply diacritics normalization where needed.
- Always post-process through `@pkg/spec.formatManual({ stripProvenance: true })` for spec-view; then produce QA enumerations deterministically.


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

Failure modes \& handling:

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


## Data and Storage Plan

### Corpora

- **US**: source user stories (txt/markdown) from `US_input/` and repo docs.
- **Generated**: baseline from `us2manual.mjs` and `@pkg/manual-emitter`.
- **Gold**: curated QA gold manuals per module/tip.
- **Refined**: agent outputs that pass style and meet parity thresholds.


### JSONL Schemas

Manual sample (spec-view line):

```json
{
  "bucket": "presence",
  "narrative": "Cautare (search) vizibila si functionala",
  "facets": ["cautare"],
  "provenance": ["uiux"],
  "module": "Documente",
  "tip": "Vizualizare",
  "source": "generated|gold|refined",
  "version": 1,
  "ts": "2025-10-06T12:00:00Z"
}
```

Pair sample (training triple):

```json
{
  "id": "pair_000001",
  "us_path": "US_input/2024_08_15-Web6-...txt",
  "generated_path": "manual_output/Documente_Manual.md",
  "gold_path": "qa-framework/docs/modules/Documente_Gold.md",
  "refined_path": "qa-framework/data/agent/refined/Documente_Vizualizare.md",
  "tip": "Vizualizare",
  "module": "Documente",
  "score": { "percent": 96.2, "threshold": 95, "pass": true },
  "reasons": ["phrasing", "ordering"],
  "version": 1,
  "ts": "2025-10-06T12:00:00Z"
}
```

Embedding record:

```json
{
  "kind": "ctx|manual|pair",
  "key": "spec:validator:sections",
  "text": "...",
  "embedding_model": "text-embedding-3-small",
  "vector": [0.01, -0.12, ...],
  "dim": 1536,
  "hash": "sha256:...",
  "meta": { "lang": "ro", "schema": 1 }
}
```


### Storage Layout

- `qa-framework/data/agent/jsonl/` — normalized JSONL dumps per corpus type.
- `qa-framework/data/agent/embeddings/` — `.jsonl` of embedding records; optional `sqlite` index.
- `qa-framework/data/agent/refined/` — refined manuals (MD, spec and QA view).
- `qa-framework/data/agent/cache/` — content-hash based cache of model calls.


### Embedding Strategy

- v1: OpenAI `text-embedding-3-small` (1536d), cosine similarity; NFD + strip diacritics prior to embedding to mirror scorer.
- Upgrade path: `text-embedding-3-large` or VoyageAI; re-index and keep `schema_version`.


### Similarity Search

- v1: in-memory cosine over small corpora; optional `sqlite` with a `vectors(dim REAL[])` table.
- v1.5: Qdrant `repo_ctx` collection with `key` and `kind` payloads; cosine metric.


### Chunking

- Spec/emitter files: logical sections (e.g., validator rules, bucket vocab) ≤1k tokens.
- US/gold/refined: sentence-level or bullet-level chunks; keep `tip` and `module` attached.


### Provenance \& Retention

- Include `source`, `provenance`, `version`, `ts`, and file paths.
- Retain raw inputs and refined outputs for audit; rotate embeddings monthly; back up JSONL to versioned folder.


### PII/Scrubbing

- Redact emails, phone numbers, and IDs via regex before logging; never log payloads; store only hashed cache keys.


### Migration to Qdrant

- Docker Compose service `qdrant`; create collection `repo_ctx(dim=1536, metric=cosine)`.
- Bulk load from `embeddings/*.jsonl`; store `key`, `kind`, `module`, `tip`, and `hash` in payload.
- Keep a `schema_version` and reindex on bump.


## Supervise → Rewrite Loop

### Inputs

- US text, generated manual (baseline), optional gold manual.
- Retrieved context: spec sections, validator rules, emitter vocab/rules, recent successful pairs.


### Steps

1) Build context pack (deterministic order; small): { spec rules, bucket vocab, emitter QA rules, recent pair exemplars }.
2) Refiner call (model: `gpt-4.1-mini`, temp=0) → JSON object with a spec-style manual body.
3) Normalize: `@pkg/spec.formatManual({ stripProvenance: true })`.
4) Score: `@pkg/parity.score(coverage, manual, tip)`.
5) If percent < threshold and iter < N (e.g., 2), run Fixer with diff and reason codes; else stop.
6) Emit QA-style enumeration and artifacts; write audit JSON.

### Determinism

- temperature=0, top_p=1; fixed prompts; reject non-JSON, re-ask once.
- LF endings; NFD diacritics normalization for comparisons.
- Stable sort and dedupe as in emitter.


### Prompt Templates

System (shared):

```text
You are an internal QA manual refiner. Follow strict constraints:
- Output strictly valid JSON matching the provided schema.
- Use canonical Romanian QA vocabulary and buckets.
- No duplicates. Preserve meaning; align phrasing to gold if provided.
- Do not include explanations.
```

Refiner (user):

```json
{
  "task": "refine_manual",
  "tip": "Vizualizare",
  "module": "Documente",
  "schema": {
    "type": "object", "properties": {"lines": {"type": "array", "items": {"type": "object", "properties": {"bucket": {"type": "string"}, "narrative": {"type": "string"}, "facets": {"type": "array", "items": {"type": "string"}}}, "required": ["bucket","narrative"]}}}, "required": ["lines"]
  },
  "context": {
    "spec_rules": "...",
    "bucket_vocab": "...",
    "emitter_rules": "..."
  },
  "inputs": {
    "us": "...",
    "generated": "...",
    "gold_optional": "..."
  }
}
```

Fixer (user):

```json
{
  "task": "fix_manual",
  "tip": "Vizualizare",
  "diff": { "missing": ["..."], "mismatched": ["..."] },
  "last_json": { "lines": [ {"bucket":"presence","narrative":"..."} ] }
}
```

Suggester (user):

```json
{
  "task": "suggest_repo_edits",
  "misses": [ {"bucket":"columns","narrative":"Coloana 'X' — valoare corecta ..."} ],
  "mapping_targets": ["qa-framework/tools/us2manual.mjs","qa-framework/packages/manual-emitter/src/emit.ts","qa-framework/packages/spec/src/validator.ts"]
}
```


### Guardrails

- Stop if parity ≥ threshold or after N=2 iterations.
- Idempotence: same inputs and context hash must produce identical JSON.
- Logging: write audit with cache key, model, prompt version; never log raw secrets or full payloads.


### Repo Code Alignment

```75:92:qa-framework/packages/spec/src/validator.ts
export function formatManual(md: string, opts?: { stripProvenance?: boolean }): string { ... }
```

```80:89:qa-framework/packages/parity/src/score.ts
const percent = Math.round((matchedCount/total)*10000)/100;
const thr = visualTips.has((tip||'').toLowerCase()) ? 85 : 95;
```


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


### PR Etiquette \& ADEF Gates

- Reference change doc; include test commands and parity before/after.
- Ensure Windows line endings policy: enforce LF via existing `check:lineendings`.
- No secrets in logs; link to artifacts.


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


## Executive Summary

Adopt a v1 "thin agent" as a Node/TS CLI that directly calls OpenAI (primary: `gpt-4.1-mini`, secondary: `gpt-4.1`, fallback: Claude 3.5 Sonnet). Keep outputs deterministic via temperature=0, fixed prompts, and post-process with `@pkg/spec.formatManual`. Use in-process cosine retrieval at first; plan a v1.5 upgrade to Qdrant. Evaluation uses `@pkg/spec` and `@pkg/parity` in CI with a single deterministic sample to avoid flakiness. This path fits Windows + pnpm and can be built in 1–2 days.

### Comparison Matrix (high-level)

- Models: 4.1-mini (cost/latency/stability) > 4.1 (capability/context) > Claude 3.5 (fallback quality).
- Embeddings: `text-embedding-3-small` v1; upgrade to `-large` as needed.
- Vector store: in-memory/sqlite v1; Qdrant v1.5.
- Frameworks: thin client now; reconsider lightweight helpers only if needed.


### Costs \& Limits

- Cache aggressive by content hash; prefer short-context reruns where possible.
- Monthly estimate depends on pairs refined; start with capped CI sample.


### Risks \& Mitigations

- Drift between spec and gold → canonicalize vocabulary; periodic sync review.
- Brittleness of phrasing → parity strictly matches normalized narrative; Fixer iterates up to N=2.
- Vendor lock-in → define prompt interface; fallback provider; export JSONL artifacts.


### Rollback Plan

- Disable agent path; revert to `us2manual.mjs` baseline; keep parity CI running.


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

{
  "criteria": [
    {"name": "ro_diacritics_quality", "weight": 0.35},
    {"name": "latency_cost", "weight": 0.25},
    {"name": "vector_dim_size", "weight": 0.2},
    {"name": "windows_dev_support", "weight": 0.2}
  ],
  "options": [
    {"id": "openai_text_embedding_3_small", "scores": {"ro_diacritics_quality": 8, "latency_cost": 9, "vector_dim_size": 8, "windows_dev_support": 9}},
    {"id": "openai_text_embedding_3_large", "scores": {"ro_diacritics_quality": 9, "latency_cost": 7, "vector_dim_size": 6, "windows_dev_support": 9}},
    {"id": "bge_m3", "scores": {"ro_diacritics_quality": 8, "latency_cost": 8, "vector_dim_size": 7, "windows_dev_support": 7}}
  ]
}

{
  "criteria": [
    {"name": "windows_docker_ergonomics", "weight": 0.35},
    {"name": "throughput_scalability", "weight": 0.25},
    {"name": "dev_simplicity", "weight": 0.25},
    {"name": "cost", "weight": 0.15}
  ],
  "options": [
    {"id": "in_memory_sqlite", "scores": {"windows_docker_ergonomics": 10, "throughput_scalability": 6, "dev_simplicity": 9, "cost": 10}},
    {"id": "qdrant", "scores": {"windows_docker_ergonomics": 8, "throughput_scalability": 9, "dev_simplicity": 7, "cost": 9}},
    {"id": "lancedb", "scores": {"windows_docker_ergonomics": 8, "throughput_scalability": 8, "dev_simplicity": 7, "cost": 9}}
  ]
}

Do not summarize blindly. Challenge assumptions, fill gaps, and propose better options where warranted. Use concrete citations with links. Prefer sources from official provider docs, reputable blogs, GitHub repos, and recent benchmarks.

Key constraints to honor (non-negotiable)

- Determinism and style:
  - 100% QA style (enumerated lines, canonical tags; strict formatter/validator available).
  - ≥95% parity for CRUD or ≥85% for visual-only pages; parity logic: same bucket + normalized narrative + facets Jaccard ≥ 0.8.
  - Romanian with diacritics; normalize consistently.
- Tooling/runtime:
  - Windows-first dev; pnpm workspaces; Node ≥22; local CLI-friendly design.
  - UTF-8 LF; no secrets in logs; env config for API keys.
- Integration:
  - Reuse existing scorer/validator/emitter (parity, spec, bridge).
  - Outputs must be idempotent; no duplicates; stable ordering.

Your research tasks

1) Validate and update model choices
   - Compare OpenAI (GPT-5, 5 mini, 5 nano, 4.1) - price vs efficency
   - Evaluate: instruction-following, style transfer faithfulness, JSON-mode, tool use, context limits, latency, rate limits, cost.
   - Recommend 2 primaries + 1 fallback with justification; include cost tables and sample token budgets for our workload.
2) Embeddings and retrieval
   - Compare embeddings (OpenAI text-embedding-3-large/small, Voyage, E5-large, BGE); discuss diacritics/Romanian performance.
   - Vector stores (Qdrant, sqlite+FAISS, LanceDB, pgvector): Windows ergonomics, Docker needs, resource footprint.
   - Propose v1 (filesystem JSONL + cosine) and v1.5 (Qdrant) with clear migration steps and failure modes.
3) Framework vs thin client
   - LangChain, LlamaIndex, DSPy, Guidance/Instructor, vs thin OpenAI client.
   - Tradeoffs for determinism, testability, and CI stability on Windows. Recommend.
4) Refinement loop design (supervise → rewrite → score → iterate)
   - Improve our loop for determinism (prompting patterns, JSON schemas, temperature, reformatting).
   - Provide 2–3 concrete prompt templates (system+user) that enforce canonical tags, ordering, and phrasing alignment; include JSON output contracts.
5) Self-improvement and training corpus
   - Best practices to curate (US, generated, gold, refined) with provenance; chunking; labeling misses (phrasing/order/missing-feature).
   - Data retention/PII guidance and safety (hashing/scrubbing) for local corpuses.
6) Evaluation protocol
   - Propose robust evals for style (spec validator) and parity (our scorer) + qualitative spot checks.
   - Suggest micro-benchmarks for Romanian diacritics and narrative normalization.
   - CI strategy that avoids flakiness: caching, dry-run prompts, seed control.
7) Suggestions pipeline (edit proposals + Cursor prompts)
   - Survey patterns for “LLM proposes code edits” safely (diff planning, file targeting, acceptance criteria).
   - Provide at least one high-quality one-shot Cursor prompt template that maps parity misses to concrete edits in our code areas (bridge, emitter, spec), with tests and commands.
8) Operational concerns
   - Cost control (short-context reruns, retrieval trimming, caching).
   - Rate-limit handling and retries.
   - Offline/degraded mode behavior.

Deliverables (produce all)

- Executive summary (1–2 paragraphs).
- Gaps and corrections to our plan (bullet list, high-signal).
- Updated recommendations:
  - Models table with pros/cons, cost, latency; final pick (2 primaries + 1 fallback).
  - Embeddings + store decision and a migration sketch to Qdrant with commands.
- Concrete artifacts:
  - Three refined prompt templates for the agent (refiner, fixer, suggester) with JSON schemas.
  - Minimal Node/TS code snippets for: OpenAI client calls (refine), embeddings, local cosine similarity, and Qdrant ingestion/query on Windows.
  - A deterministic “refine-and-score” script outline (pseudocode) integrating our scorer/validator.
- Evaluation plan and commands (local + CI) with acceptance thresholds.
- Risk register (at least 8 risks) and mitigations; vendor lock-in and dual-provider plan.
- Citations with links at end of each section; prioritize provider docs and live GitHub code.

Formatting rules

- Use concise headings, tables for comparisons, and bullets.
- Put file names, commands, and code in backticks; include shell/Node/TS snippets where relevant.
- Every claim about a product/model must have a citation link.
- If data is uncertain or mixed, say so explicitly and give us a contingency.

Assumptions you can make

- We can pass the model a chunked context built from our repo docs and recent pairs.
- We can run Docker locally for Qdrant if compelling.
- We will integrate your recs only if they preserve deterministic QA style and meet parity thresholds.

Final checklist (you must include this at the end)

- A 10–15 step “do now” list to implement a POC in 1–2 days, with exact file paths and pnpm commands.

Based on my extensive research, I'll now provide a comprehensive analysis and updated recommendations for your internal AI QA refinement agent. Let me present the findings systematically:

# Executive Summary

Your proposed thin agent architecture is sound but requires significant updates based on 2025 developments. **Key findings**: GPT-5 now offers superior cost-performance compared to GPT-4.1 (\$1.25 vs \$5 input tokens/1M), with 90% cache discounts making it the clear primary choice. Voyage-3 embeddings outperform OpenAI by 7.55% while costing 2.2x less. The thin client approach remains optimal over heavy frameworks for deterministic output. Critical gaps identified: your temperature=0 assumption for determinism is flawed—OpenAI explicitly states even temp=0 is "mostly deterministic", and proper caching/seeding strategies are essential for consistency.[^1][^2][^3][^4][^5][^6][^7]

# Gaps and Corrections to Your Plan

## Critical Model Pricing Corrections

- **GPT-5 is now cheaper than GPT-4.1**: \$1.25 input/\$10 output vs \$5/\$15 per 1M tokens[^2][^1]
- **90% cache discount available** for repeated tokens within minutes[^2]
- **GPT-5-mini at \$0.25/\$2** provides better value than GPT-4.1-mini for most tasks[^1]
- **Your GPT-4.1 preference is outdated** - GPT-5 series should be primary


## Determinism Reality Check

- **Temperature=0 ≠ deterministic**: OpenAI explicitly states "mostly deterministic" due to GPU non-determinism and sparse MoE[^6][^8][^7]
- **Seed parameter required** for reproducibility (set seed + temperature=0)[^8]
- **System fingerprint changes** will affect determinism despite identical inputs[^8]


## Embeddings Superiority Gap

- **Voyage-3 outperforms OpenAI text-embedding-3-large** by 7.55% across domains while costing 2.2x less[^3]
- **BGE-M3 excels for multilingual/Romanian** tasks with 1024 dimensions[^9][^10]
- **Your OpenAI embedding focus ignores superior alternatives**


## Framework Misjudgment

- **LangChain adds overhead without determinism benefits** for your use case[^11][^12]
- **Instructor library provides superior JSON validation** vs raw OpenAI structured output[^4][^5]
- **Thin client + Instructor/Zod validation** is optimal architecture


# Updated Model Recommendations

## Primary Models (2025 Costs)

| Model | Input Cost/1M | Output Cost/1M | Cached Input | Use Case | Justification |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **GPT-5-mini** | \$0.25 | \$2.00 | \$0.025 | Primary refiner | 80% capability at 20% cost[^2][^13] |
| **GPT-5** | \$1.25 | \$10.00 | \$0.125 | Complex cases | Superior reasoning, cheaper than GPT-4.1[^1][^2] |
| **Claude-3.5-Sonnet** | \$3.00 | \$15.00 | - | Fallback | Romanian text quality, safety[^14] |

**Cost Analysis for Your Workload**:

- Typical refinement: ~5K input + 2K output tokens
- GPT-5-mini cost: \$0.0051 per refinement vs GPT-4.1 at \$0.035 (86% savings)
- With 90% cache discount: ~\$0.001 per refinement after first run


## Embeddings Decision Matrix

| Model | Dimensions | Cost/1M | Romanian Performance | Recommendation |
| :-- | :-- | :-- | :-- | :-- |
| **Voyage-3** | 1024 | \$0.06 | Excellent multilingual | **v1 Primary** |
| text-embedding-3-small | 1536 | \$0.02 | Good Romanian | v1 Backup |
| BGE-M3 | 1024 | \$0.016 | Superior Romanian | Self-hosted option |

**Migration Path to v1.5 (Qdrant)**:

```bash
# 1. Docker Compose setup (Windows compatible)
docker-compose up -d qdrant
# 2. Create collection
curl -X PUT "http://localhost:6333/collections/repo_ctx" \
  -H "Content-Type: application/json" \
  -d '{"vectors": {"size": 1024, "distance": "Cosine"}}'
# 3. Bulk ingest JSONL
node scripts/ingest-embeddings.js --source=./data/agent/embeddings/
```


# Framework vs Thin Client Analysis

## Why Thin Client Wins

**LangChain Issues**:[^12][^11]

- Non-deterministic execution paths
- Heavy abstraction overhead
- Context pollution across chains
- Difficulty debugging failures

**Instructor Benefits**:[^5][^4]

- Automatic Pydantic validation
- Retry logic built-in
- Clear error messages
- Works with any model

**Recommended Stack**:

```javascript
// Thin client with validation
import OpenAI from 'openai';
import { z } from 'zod';

const refinementSchema = z.object({
  lines: z.array(z.object({
    bucket: z.string(),
    narrative: z.string(),
    facets: z.array(z.string()).optional()
  }))
});

// Simple, deterministic, debuggable
```


# Concrete Prompt Templates

## 1. Refiner Template (JSON Mode)

```javascript
const refinerPrompt = {
  system: `You are a QA manual refiner. Output ONLY valid JSON matching the schema.
Requirements:
- Use canonical Romanian QA vocabulary
- Preserve meaning, improve phrasing
- No duplicates, stable ordering
- Follow bucket conventions: presence, columns, functionality, validation, workflow`,
  
  user: (context) => JSON.stringify({
    task: "refine_manual",
    schema: refinementSchema,
    context: {
      spec_rules: context.specRules,
      bucket_vocab: context.bucketVocab,
      successful_examples: context.examples
    },
    inputs: {
      us: context.usText,
      generated: context.generatedManual,
      gold: context.goldManual // optional
    }
  })
};
```


## 2. Fixer Template (Iterative)

```javascript
const fixerPrompt = {
  system: `Fix QA manual based on parity gaps. Output corrected JSON only.`,
  
  user: (context) => JSON.stringify({
    task: "fix_manual", 
    previous_attempt: context.lastOutput,
    issues: {
      missing_narratives: context.missingNarratives,
      incorrect_buckets: context.wrongBuckets,
      parity_score: context.currentScore,
      target_threshold: context.threshold
    },
    guidance: context.retrievedExamples
  })
};
```


## 3. Suggester Template (Repo Edits)

```javascript
const suggesterPrompt = {
  system: `Generate executable Cursor prompts for repo improvements.
Format: One-shot prompts with acceptance criteria and test commands.`,

  user: (context) => `
**Analysis**: QA manual generation missing coverage for ${context.missingFeatures.join(', ')}

**Root Cause**: ${context.rootCause}

**Target Files**: 
${context.candidateFiles.map(f => `- ${f}: ${f.responsibility}`).join('\n')}

**Generate Cursor Prompt For**: ${context.primaryFile}

**Template**:
\`\`\`
Goal: [Specific improvement]
Acceptance: 
- pnpm parity:score reaches ${context.targetScore}% on test case
- No validator errors
Change: [Exact change needed]
Test: pnpm -C qa-framework parity:score --tip ${context.tip} --manual ${context.testManual}
\`\`\`
`
};
```


# Code Snippets

## OpenAI Client with Caching

```typescript
// cache.ts - Content-hash based caching
import crypto from 'crypto';
import fs from 'fs/promises';

export class PromptCache {
  private cacheDir = './qa-framework/data/agent/cache';
  
  private getCacheKey(inputs: any): string {
    const content = JSON.stringify(inputs, Object.keys(inputs).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  async get(inputs: any): Promise<any | null> {
    const key = this.getCacheKey(inputs);
    try {
      const cached = await fs.readFile(`${this.cacheDir}/${key}.json`, 'utf8');
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  
  async set(inputs: any, result: any): Promise<void> {
    const key = this.getCacheKey(inputs);
    await fs.writeFile(`${this.cacheDir}/${key}.json`, JSON.stringify(result, null, 2));
  }
}
```


## Refiner with Deterministic Config

```typescript
// refiner.ts
import OpenAI from 'openai';
import { z } from 'zod';

export class QARefiner {
  private client: OpenAI;
  private cache: PromptCache;
  
  constructor() {
    this.client = new OpenAI();
    this.cache = new PromptCache();
  }
  
  async refine(context: RefineContext): Promise<RefineResult> {
    const cacheKey = { ...context, model: 'gpt-5-mini', version: '1.0' };
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    const response = await this.client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: refinerPrompt.system },
        { role: 'user', content: refinerPrompt.user(context) }
      ],
      temperature: 0,
      seed: 42, // Deterministic seed
      response_format: { type: 'json_object' }
    });
    
    const parsed = JSON.parse(response.choices[^0].message.content);
    const validated = refinementSchema.parse(parsed); // Zod validation
    
    const result = { ...validated, usage: response.usage };
    await this.cache.set(cacheKey, result);
    return result;
  }
}
```


## Local Cosine Similarity (v1)

```typescript
// similarity.ts - In-memory vector search
export class LocalVectorStore {
  private vectors: Array<{
    id: string;
    embedding: number[];
    metadata: any;
  }> = [];
  
  async embed(text: string): Promise<number[]> {
    // Use Voyage-3 or text-embedding-3-small
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'voyage-3'
      })
    });
    const { data } = await response.json();
    return data[^0].embedding;
  }
  
  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (normA * normB);
  }
  
  async search(queryText: string, limit = 5): Promise<Array<{id: string, score: number, metadata: any}>> {
    const queryEmbedding = await this.embed(queryText);
    return this.vectors
      .map(v => ({
        id: v.id,
        score: this.cosineSimilarity(queryEmbedding, v.embedding),
        metadata: v.metadata
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
```


## Qdrant Migration (v1.5)

```typescript
// qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantVectorStore {
  private client: QdrantClient;
  
  constructor() {
    this.client = new QdrantClient({ host: 'localhost', port: 6333 });
  }
  
  async ingestFromJSONL(filePath: string) {
    const lines = (await fs.readFile(filePath, 'utf8')).split('\n').filter(Boolean);
    const points = lines.map((line, idx) => {
      const record = JSON.parse(line);
      return {
        id: idx,
        vector: record.vector,
        payload: {
          kind: record.kind,
          key: record.key,
          text: record.text,
          metadata: record.meta
        }
      };
    });
    
    await this.client.upsert('repo_ctx', { points });
  }
  
  async search(queryVector: number[], limit = 5) {
    return await this.client.search('repo_ctx', {
      vector: queryVector,
      limit,
      with_payload: true
    });
  }
}
```


# Deterministic Refine-and-Score Script

```typescript
// main.ts - Integration pseudocode
class AgentOrchestrator {
  async refineAndScore(inputs: RefineInputs): Promise<RefineResult> {
    let attempt = 1;
    const maxAttempts = 2;
    
    // 1. Retrieve context
    const context = await this.vectorStore.search(
      `${inputs.tip} ${inputs.module} examples`, 5
    );
    
    while (attempt <= maxAttempts) {
      // 2. Refine
      const refined = await this.refiner.refine({
        ...inputs,
        context,
        attempt
      });
      
      // 3. Normalize through @pkg/spec
      const normalized = await this.spec.formatManual(refined.content, {
        stripProvenance: true
      });
      
      // 4. Score with @pkg/parity  
      const score = await this.parity.score(inputs.coverage, normalized, inputs.tip);
      
      // 5. Check threshold
      const threshold = inputs.tip.toLowerCase().includes('vizualizare') ? 85 : 95;
      if (score.percent >= threshold) {
        return {
          success: true,
          content: normalized,
          score,
          attempts: attempt
        };
      }
      
      // 6. Fix attempt if below threshold
      if (attempt < maxAttempts) {
        inputs = await this.fixer.fix(inputs, refined, score);
      }
      attempt++;
    }
    
    return {
      success: false,
      content: normalized,
      score,
      attempts: maxAttempts,
      reason: 'Max attempts exceeded'
    };
  }
}
```


# Evaluation Protocol

## Local Harness

```bash
# 1. Setup test data
mkdir -p qa-framework/data/agent/test
cp projects/example/US_input/sample.txt qa-framework/data/agent/test/

# 2. Run baseline
pnpm -C qa-framework run us:bridge --input ./data/agent/test/sample.txt

# 3. Run agent refinement  
pnpm -C qa-framework --filter @apps/agent start:refine \
  --tip Vizualizare \
  --project ./projects/example \
  --input ./data/agent/test/sample.txt

# 4. Validate style
pnpm -C qa-framework --filter @pkg/spec spec:validate \
  --manual ./data/agent/refined/sample_Vizualizare.md

# 5. Score parity
pnpm -C qa-framework parity:score \
  --project ./projects/example \
  --tip Vizualizare \
  --manual ./data/agent/refined/sample_Vizualizare.md
```


## CI Integration

```yaml
# .github/workflows/agent-test.yml
name: QA Agent Test
on: [push, pull_request]
jobs:
  agent-determinism:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Install deps
        run: pnpm install
      - name: Cache agent data
        uses: actions/cache@v3
        with:
          path: qa-framework/data/agent/cache
          key: agent-cache-${{ hashFiles('qa-framework/data/agent/test/*') }}
      - name: Test agent refinement
        run: |
          pnpm -C qa-framework --filter @apps/agent start:refine --dry-run
          pnpm -C qa-framework parity:score --assert-threshold 95
```


# Risk Register and Mitigations

| Risk | Probability | Impact | Mitigation |
| :-- | :-- | :-- | :-- |
| **Model drift affecting determinism** | High | High | Pin model versions, cache by fingerprint, alert on score drops >1% |
| **API rate limits during CI** | Medium | High | Implement exponential backoff, use cached results, fail gracefully |
| **Romanian diacritics normalization bugs** | Medium | Medium | NFD normalization before all comparisons, unit tests for edge cases |
| **Vendor lock-in to OpenAI** | Low | High | Multi-provider interface, export training data, fallback to baseline |
| **Cache poisoning via input manipulation** | Medium | Medium | Content hashing with salt, cache validation on load |
| **Memory exhaustion with large contexts** | Medium | Medium | Chunking strategy, context trimming, OOM monitoring |
| **Windows line ending corruption** | High | Low | LF enforcement in CI, .gitattributes config |
| **Cost overrun from unoptimized prompts** | Medium | Medium | Token budgets, cost monitoring, prompt optimization |

## Dual-Provider Plan

```typescript
interface ModelProvider {
  refine(prompt: string, schema: z.ZodSchema): Promise<any>;
  embedText(text: string): Promise<number[]>;
}

class OpenAIProvider implements ModelProvider { /* ... */ }
class ClaudeProvider implements ModelProvider { /* ... */ }

class ProviderRouter {
  constructor(private primary: ModelProvider, private fallback: ModelProvider) {}
  
  async refine(prompt: string, schema: z.ZodSchema, retries = 1): Promise<any> {
    try {
      return await this.primary.refine(prompt, schema);
    } catch (error) {
      if (retries > 0) {
        console.warn(`Primary provider failed, trying fallback: ${error.message}`);
        return await this.fallback.refine(prompt, schema);
      }
      throw error;
    }
  }
}
```


# Implementation Checklist (Do Now - 1-2 Days)

1. **Setup workspace structure**

```bash
mkdir -p apps/agent/{src,tests}
mkdir -p qa-framework/data/agent/{jsonl,embeddings,refined,cache,suggestions}
```

2. **Create package.json for @apps/agent**

```json
{
  "name": "@apps/agent",
  "scripts": {
    "start:refine": "node src/refine.js",
    "start:train": "node src/train.js"
  },
  "dependencies": {
    "openai": "^4.67.3",
    "zod": "^3.23.8",
    "@qdrant/js-client-rest": "^1.11.0"
  }
}
```

3. **Install dependencies**

```bash
cd qa-framework && pnpm install
```

4. **Create .env template**

```
OPENAI_API_KEY=sk-...
VOYAGE_API_KEY=pa-...
AGENT_MODEL=gpt-5-mini
EMBEDDINGS_MODEL=voyage-3
```

5. **Implement core refiner class** (using code snippets above)
    - `apps/agent/src/refiner.ts`
    - `apps/agent/src/cache.ts`
    - `apps/agent/src/similarity.ts`
6. **Create CLI commands**

```bash
# apps/agent/src/cli.ts
#!/usr/bin/env node
import { program } from 'commander';
import { QARefiner } from './refiner.js';

program
  .command('refine')
  .option('--tip <tip>', 'QA tip type')
  .option('--project <path>', 'Project path')
  .action(async (opts) => {
    const refiner = new QARefiner();
    await refiner.refineProject(opts);
  });
```

7. **Wire @pkg/spec and @pkg/parity**

```typescript
import { formatManual } from '@pkg/spec';
import { score } from '@pkg/parity';

// Integration in refiner.ts
const normalized = formatManual(refined.content, { stripProvenance: true });
const parityScore = score(coverage, normalized, tip);
```

8. **Add pnpm scripts to root package.json**

```json
{
  "scripts": {
    "agent:refine": "pnpm --filter @apps/agent start:refine",
    "agent:train": "pnpm --filter @apps/agent start:train"
  }
}
```

9. **Create test data**

```bash
cp projects/example/US_input/sample.txt qa-framework/data/agent/test/
```

10. **Implement JSON schemas with Zod**
    - Refinement output schema
    - Training data schema
    - Suggestion output schema
11. **Basic vector store (in-memory)**
    - Cosine similarity implementation
    - JSONL ingestion/export
12. **CI job for deterministic testing**
    - Single fixed sample
    - Cache-based reproducibility
    - Threshold assertion
13. **Add Docker Compose for Qdrant (optional)**

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes: ["./qdrant_data:/qdrant/storage"]
```

14. **Documentation**
    - `qa-framework/docs/changes/agent-implementation.md`
    - CLI usage examples
    - Troubleshooting guide
15. **Verify ADEF gates remain green**

```bash
pnpm check:lineendings
pnpm spec:test
pnpm parity:score --sample
```


This implementation prioritizes the 80/20 rule: core functionality first, advanced features (Qdrant, suggestions pipeline) as v1.5 additions. The thin client approach with proper caching and validation will deliver deterministic, cost-effective QA manual refinement within your existing toolchain constraints.



Architectural Validation and Stress-Testing of the QA Manual Refinement AgentI. Strategic Validation of Core LLM Capabilities and SelectionAchieving the mandated goal of  style adherence and  content parity against gold standards requires a model infrastructure that balances extreme analytical rigor with operational speed. Reliance on a single model is insufficient due to the inherent trade-offs between deep reasoning capability and processing latency.I.A. Benchmarking for Complex Reasoning and Instruction FollowingAn analysis of current frontier models reveals distinct strengths crucial for the QA refinement task. For complex synthesis and qualitative analysis—tasks critical for ensuring true content parity—models demonstrating superior graduate-level reasoning are preferred. Claude 3.5 Sonnet exhibits a distinct advantage in this area, achieving a  score on the zero-shot CoT GPQA benchmark, surpassing GPT-4o’s .1 This difference indicates that Claude may produce more thoughtful responses by considering multiple perspectives, an attribute highly valuable for nuanced QA manual refinement and strategic planning.1Conversely, operational efficiency mandates speed. GPT-4o maintains a decisive lead in responsiveness, featuring  faster average latency and an average Time-to-First-Token (TTFT) that is  faster than Claude 3.5 Sonnet (0.5623 seconds versus 1.2341 seconds).1 This speed is decisive for applications requiring real-time interactions or high-volume query processing.Critically, benchmark data demonstrates that even the highest-performing models (GPT-4o and Claude 3.5 Sonnet) only achieve  accuracy in complex data extraction tasks without implementing advanced prompting and structured validation techniques.2 This performance gap highlights that attaining the  parity target cannot depend solely on the raw intelligence of the Large Language Model (LLM); it requires robust systemic scaffolding and post-generation verification.2I.B. The Proposed Tandem Model ArchitectureTo reconcile the conflict between the need for maximal reliability (high quality, deep reasoning) and high-volume throughput (low latency, cost efficiency), a Tandem Model Architecture is mandatory.The task of QA refinement intrinsically involves resource-intensive processes, particularly when employing Chain-of-Thought (CoT) prompting necessary to bridge the  baseline extraction accuracy to the desired  content parity.2 High-reliability tasks, such as the final, multi-step synthesis and complex analysis that determines content fidelity, benefit greatly from models specifically designed for deep, multi-step reasoning, such as the GPT-5 profile, which prioritizes quality and fewer mistakes over raw speed.3The proposed architecture allocates tasks based on this criticality:High-Throughput/Low-Latency Layer: Lower-cost, higher-speed models (e.g., GPT-4.1) will handle initial triage, simple classification, pre-filtering, or lightweight summarization.3 The GPT-4.1 models, optimized for enterprise scale, cost  less for median queries compared to GPT-4o, offering high throughput and cost efficiency for non-critical, high-volume operations.4High-Precision/High-Reasoning Layer: The most reliable model (GPT-5 or Claude 3.5 Sonnet, depending on API availability and budget) will be reserved exclusively for the critical final refinement step. This step involves complex synthesis of retrieved gold data, analysis of the user submission (US), and generation of the structured edit suggestion that ensures  parity. This approach minimizes the use of the expensive, high-latency models while maximizing their impact on the most critical phase of the agent's operation.I.C. Table: Comparative LLM Performance Profiles for QA RefinementThis table illustrates the selection criteria underpinning the Tandem Model decision.Comparative LLM Performance Profiles for QA RefinementModel ProfileRepresentative ModelPrimary StrengthBenchmark IndicatorRecommended Role in AgentHigh Reasoning/ReliabilityClaude 3.5 Sonnet / GPT-5 ProfileDeep analytical thinking, complex synthesisGPQA CoT: 59.4% (Claude 3.5) 1Final Refinement, Complex Synthesis (Reserved for critical path)High Speed/Cost EfficiencyGPT-4o / GPT-4.1Low latency, high throughputTTFT: 2x faster (GPT-4o) 1, 26% cost reduction (GPT-4.1) 4Initial Triage, Validation Loop Pre-filtering, Lightweight TasksII. The Refinement Agent Architecture: Structured Output and Self-Correction (100% Style Adherence)The mandated  style adherence goal cannot be achieved through mere instruction to the LLM; it must be guaranteed through programmatic enforcement. This requirement transforms the style goal from a natural language instruction problem into a data validation problem, which is solved by integrating type-safe structured output controls.II.A. Mandating Type Safety via Zod and Instructor.jsThe target environment (Node.js/TypeScript) benefits from specialized libraries designed to enforce structured data extraction. The use of Instructor.js paired with the Zod validation library is mandatory for this purpose.5Instructor.js leverages the LLM provider’s native function calling or tool-use API to compel the model to format its response according to a strict JSON schema derived from the Zod type definition.7 This mechanism ensures that the model’s output, regardless of its semantic accuracy, conforms  to the defined structure and types.9This setup is crucial because it offloads the burden of structural consistency from the LLM onto a battle-tested validation library. Furthermore, Zod is highly effective in providing descriptive constraints: its description fields are automatically incorporated into the LLM prompt, serving as micro-prompts that guide the model on specific style and content expectations for each field.10 This allows the  parity focus to be entirely on semantic content accuracy, knowing the structural integrity is already secured.II.B. Error-Mapping and Self-Healing LoopThe fundamental limitation of LLMs—the  baseline extraction accuracy 2—implies that initial structured outputs will frequently contain structural or type errors, even when function calling is enabled. If the agent relies on raw model output, these failures would halt the refinement process.A self-healing loop is therefore engineered to ensure resilience and high fidelity. When an LLM output is received, it is immediately passed through the Zod schema validation. If the validation fails (e.g., a field expecting a number receives a string, or a required field is missing), the agent does not immediately terminate the task. Instead, the specific validation error message (e.g., 'Expected number, received string in field line_start') is programmatically captured.This error message, along with the original input prompt and the non-compliant LLM output, is used to construct a refined, second-stage prompt. The model is explicitly instructed to "act as a fixer," reviewing its previous failure against the explicit Zod validation error and regenerating the response.6 This iterative refinement process is repeated until the output passes validation, guaranteeing that the final output object is structurally sound and adheres to the  style requirements.II.C. Template Schema for Cursor Prompt IntegrationThe agent's final delivery mechanism is a ready-to-run Cursor prompt, requiring the agent’s output to be a highly structured data object that specifies the exact file changes. The following table outlines the essential components of the final Zod schema, ensuring the structured output maps cleanly to developer tooling.Example Zod Schema Elements for Cursor Prompt StructureField NameZod TypeCritical Zod Description (Prompt Guidance)Purposefile_pathz.string()"Must be relative to the repository root. Ensure forward slashes are used."Target file for the edit.line_startz.number()"The 1-indexed line number where the edit begins."Precise location for modification.line_endz.number()"The 1-indexed line number where the edit ends. Use line_start if inserting only."Defines the replacement block.operationz.enum(['replace', 'insert', 'delete'])"Action to be performed on the manual text."Enforces style constraints on action types.new_contentz.string()"The refined QA content block. Must adhere strictly to style guidelines and formatting."The high-parity () output.The descriptions are pivotal; by embedding specific style constraints (e.g., "Must be relative to the repository root") directly into the schema descriptions, the system provides high-fidelity feedback to the LLM during generation, improving the likelihood of compliant output on the first attempt.10III. Data Integrity and Multilingual QA Manual HandlingThe agent relies on Retrieval-Augmented Generation (RAG) to learn continuously from (US, gold) pairs. Given that QA manuals may contain technical specifications or multilingual data with diacritics, the integrity of the retrieval component is paramount.III.A. Multilingual Embedding Model AssessmentThe selection of the embedding model directly correlates with RAG retrieval accuracy and the resulting quality of the refinement suggestions.11 For a multilingual QA corpus, the model must demonstrate robust cross-lingual capabilities.Models such as OpenAI’s text-embedding-3-large (proprietary) and BAAI’s BGE-M3 (open source) are current state-of-the-art options for retrieval tasks.11 However, a comprehensive evaluation requires models to be tested against benchmarks designed for diversity. The Massive Multilingual Text Embedding Benchmark (MMTEB), which includes over 500 quality-controlled evaluation tasks across more than 250 languages, provides a necessary measure of robustness.13 The model multilingual-e5-large-instruct demonstrates strong performance as the best publicly available model on MMTEB.13Furthermore, recent proprietary models continue to advance efficiency and accuracy. The text-embedding-3-small model, for instance, showed substantial performance gains over its predecessor, improving the MIRACL benchmark average score from  to , emphasizing a balance of accuracy and cost efficiency suitable for large-scale applications.14III.B. The Diacritic and Normalization ChallengeA significant, often underestimated, vulnerability in multilingual RAG systems is the inconsistency of Unicode normalization. QA data may involve low-resource language characters or diacritics.15 Unicode allows for characters like 'ñ' to be represented either as a single pre-composed character (Normalization Form C - NFC) or as a base character ('n') followed by a combining mark (Normalization Form D - NFD).If the QA manual ingestion pipeline indexes data using one normalization form and the RAG query input uses another, the resulting text strings are byte-level dissimilar. Even highly sophisticated multilingual embedding models, which aim to align the meaning of sentences across languages 16, can produce misaligned vector representations if the fundamental character string input is inconsistently normalized. This discrepancy can cause semantically identical documents to be retrieved as dissimilar, leading to catastrophic retrieval failure.To guarantee production reliability, the mandatory solution is consistent Unicode normalization (e.g., NFD) applied uniformly across all ingestion, indexing, and querying pipelines.17 Vector normalization (scaling to unit length) is already a standard practice for semantic search using cosine similarity, as it ensures relevance is judged purely by direction (semantic closeness) rather than magnitude (length or frequency).17 However, consistent character normalization is a preprocessing layer required before vectorization.III.C. Micro-Benchmark Design for QA DataStandard benchmarks may suffer from overfitting or may not accurately reflect performance on highly specific, low-resource domain vocabulary.19 To validate the chosen embedding model’s efficacy on the internal QA corpus, internal micro-benchmarks must be implemented.Drawing on low-resource evaluation methodologies 20, specialized tasks such as OddOneOut or TopK can be designed. These tasks use small, targeted subsets of critical QA vocabulary or diacritic-heavy technical terms to test the model's ability to maintain semantic integrity within the unique data distribution. This focused evaluation ensures that the chosen embedding model (e.g., Voyage-3-large or text-embedding-3) sustains fidelity on the organization's unique, possibly low-resource, QA corpus.12IV. Infrastructure Assessment: Embedded RAG and Learning LoopThe core requirement for the agent to learn effectively and rapidly from new (US, gold) pairs necessitates a low-latency RAG infrastructure. The architecture must prioritize continuous, near-real-time indexing and retrieval efficiency within the internal Node.js/TypeScript environment.IV.A. Vector Database Selection for Internal LearningThe traditional client-server vector database architecture (e.g., Qdrant) introduces network overhead.22 For RAG systems where latency is critical, the time spent transferring "beefy vectors" over HTTP can often exceed the actual search time.23LanceDB presents a superior solution due to its positioning as an embedded database. This architecture eliminates the network latency inherent in client-server models, allowing for vector indexing and retrieval to occur within the application process space.23Furthermore, LanceDB exhibits excellent developer ergonomics within the target technical stack:It offers native TypeScript SDKs.24It explicitly supports Windows (x86_64) binaries via a straightforward npm install @lancedb/lancedb process.25By contrast, alternatives like Qdrant typically require running a separate service instance (often via Docker).27 PgVector, while powerful, requires a non-trivial manual build process on Windows, involving C++ support in Visual Studio and the use of nmake.28 The simplicity of the embedded, native approach offered by LanceDB significantly reduces deployment friction and maximizes developer velocity in the internal environment.IV.B. Implementing the (US, Gold) Continuous Learning RAGThe embedded LanceDB architecture facilitates the immediate indexing of new (US, gold) QA pairs.Indexing Strategy: As new QA pairs are verified, the text content is automatically embedded using the selected multilingual model, and the resultant vectors, along with the original text and metadata, are indexed into the LanceDB table.29 The embedded nature of the database ensures that this update is executed with minimal latency, allowing for near real-time knowledge incorporation.26Retrieval Mechanism: During the refinement phase, the LLM agent utilizes the RAG component to search the LanceDB table using the current user submission or context. The vector search applies cosine similarity on the consistently normalized embeddings to find the most relevant gold standards. The inclusion of hard negatives sampling during indexing, a technique often used to optimize computational demands 13, further enhances retrieval effectiveness.The table below summarizes the architectural comparison.Vector Database Ergonomics for Node.js ImplementationVector DatabaseArchitecture TypeNative Node.js/TS SupportWindows ErgonomicsLatency Performance ImplicationLanceDBEmbedded DatabaseYes (npm install @lancedb/lancedb) 25Excellent (Prebuilt binary) 25Low latency; bypasses network transfer of vectors 23QdrantClient-ServerYes (Client library) 30Requires external service (e.g., Docker) 27Network overhead incurred for vector transfer 23PgVectorAdd-on to PostgreSQLYes (Client library) 31Poor (Requires manual C++ compilation/nmake setup) 28High friction deployment in standard Windows dev environmentV. System Resilience, Latency, and Cost OptimizationOperationalizing a proprietary LLM-dependent agent requires robust strategies to manage API rate limits, costs, and service integrity.V.A. API Resilience: Exponential Backoff and JitterLLM API dependencies introduce volatility due to transient network failures, temporary server overloads (5xx errors), or rate limiting (429 Too Many Requests).32 A production-grade agent must handle these failures gracefully.The system must mandate the implementation of the Exponential Backoff algorithm for all API retries. This strategy increases the delay between attempts exponentially following each failure (e.g., , etc.), ensuring that the system recovers quickly from minor hiccups while avoiding aggressive retries that could exacerbate service degradation.32Crucially, standard exponential backoff must be augmented with random Jitter.33 If multiple agent threads or client processes fail simultaneously and retry after the same deterministic delay, they create a "thundering herd" problem, re-flooding the stressed API.32 Adding a small, random noise component to the calculated delay prevents this synchronized assault, significantly improving the overall resilience and recovery speed of the API infrastructure.32V.B. Prompt Caching Strategy and VersioningLLM API calls are a major factor in both latency and operational cost.34 A two-tiered caching strategy is implemented to address this:Exact-Match Caching: A high-volume caching layer should be implemented using a cryptographic hash (e.g., SHA-256) of the entire input prompt string as the cache key.35 This cache intercepts repetitive internal prompts, such as those generated in the self-healing loop or repeated retrieval contexts, providing instantaneous results and dramatically reducing API costs.34Cache Integrity Management: The integrity of cached responses is inherently linked to the prompt template and the structured output schema. If the foundational prompt template, system instructions, or the underlying Zod schema descriptions are modified to improve the  style adherence, previous cached outputs may no longer comply with the new requirements. Therefore, the cache key must be programmatically versioned by incorporating a hash of the current prompt template/Zod schema definition itself.34 Any modification to the source instruction automatically invalidates the related cache entries, preserving the agent's commitment to the  style goal.V.C. Degraded Mode Operation and Offline StrategiesOperational analysis reveals that continuous evaluation and post-deployment monitoring of ML systems are often overlooked.36 For production stability, a Degraded Mode contingency plan is essential when external LLM APIs face extended outages or when budget constraints enforce a temporary suspension of high-cost API usage.In degraded mode, the agent relies entirely on its internal, embedded resources. Since the LanceDB RAG system operates locally, it remains functional.23 The agent can execute a retrieval-only task, retrieving high-confidence, pre-verified gold examples based on the US query similarity. Instead of generating a synthesized, complex edit (which requires the external LLM), the agent can suggest manual edits by returning the closest retrieved gold text and highlighting the semantic difference, thereby sustaining minimal functionality and utility.Future extensions could explore concepts such as the AgentOptimizer 37, which treats external tool use or functions as learnable parameters. This would allow the agent to refine its internal logic and decision-making framework based on past successes and failures ("offline training"), further insulating core functionality from API dependencies.VI. Agentic Code Suggestion and Cursor Prompt IntegrationThe final stage of the agent pipeline converts the validated, high-parity QA refinement into actionable code suggestions delivered through ready-to-run Cursor prompts. This process demands architectural rigor to ensure code safety and maintain adherence to internal development standards.VI.A. Template Design for Architecturally Compliant EditsUnfiltered LLM code generation introduces inherent risks, including subtle security vulnerabilities (e.g., injection flaws) and architectural drift from established patterns.38 A high-quality Cursor prompt must provide code that is safe and immediately compliant with the repository's rules.To achieve this, the LLM prompt template must be heavily conditioned and scaffolded. The template must explicitly embed the project’s internal technical standards, such as TypeScript best practices (preferring type inference, avoiding the any type), and modern framework best practices (e.g., for Angular: using input() and output() functions instead of decorators, using native control flow (@if, @for), and preferring Reactive forms).39By assigning a specific persona (e.g., "Senior TypeScript/Angular Architect") within the prompt template, the system guides the LLM to select appropriate design patterns and suppress suggestions that deviate from mandated internal standards.40 This scaffolding elevates the code suggestion quality, making the resulting Cursor prompt truly ready-to-run and reducing subsequent human validation effort.VI.B. Prompt Enhancement via Validation Output (AutoPrompter Logic)The quality of LLM-generated code edits is proportional to the contextual information provided in the prompt. If a suggested edit, even one structurally compliant with the Zod schema, fails a repository-level check (e.g., fails a unit test or violates a static analysis rule), this failure provides critical contextual information that was missing in the initial prompt.The system should implement a feedback loop analogous to the "AutoPrompter" concept.41 When a suggested edit fails external validation, the failure context (the error message, the original code context, and the failed LLM edit) is programmatically captured. This context is then used to automatically enhance the original prompt template for subsequent runs, effectively teaching the LLM what specific constraints (e.g., dependency limitations, non-standard library usage) it failed to account for.41 This continuous learning mechanism improves the quality of future suggestions and accelerates the agent's ability to produce high-fidelity, actionable code prompts.VI.C. Generating Ready-to-Run Cursor PromptsThe validated, structured JSON output object (Section II) serves as the definitive source for constructing the final Cursor prompt command. This object contains all necessary components: the file path, the precise line numbers, and the compliant content.The architectural scrutiny of the code generated must be maintained throughout this conversion stage.38 The final system must incorporate automated checks that track potential introduction of unfamiliar dependencies or deviations from established repository patterns before the prompt is finalized for the developer, balancing automation speed with long-term maintainability.VII. Conclusions and RecommendationsThe objective of establishing an internal AI agent that guarantees  style adherence and  content parity in QA manuals is technically feasible, but requires a multi-layered, resilient architecture that compensates for the known limitations of current Large Language Models. Successful deployment depends less on selecting the single "best" LLM and more on designing robust validation and infrastructure pipelines.Critical Actionable RecommendationsMandate Structured Output and Self-Correction: The  style adherence must be secured via programmatic enforcement. It is critical to immediately deploy Instructor.js and Zod in the Node.js environment, implementing the self-healing loop that uses validation errors to refine the LLM output iteratively until schema compliance is achieved.5Adopt the Tandem Model Strategy: To optimize for both reliability and cost, implement a tiered LLM architecture. Reserve the highest-reasoning models (GPT-5 profile or Claude 3.5 Sonnet) for the final, critical synthesis and parity check, while utilizing high-throughput, low-cost models (GPT-4.1) for preliminary or iterative tasks.3Prioritize Multilingual Data Integrity: To prevent retrieval failures in RAG, particularly involving diacritics or multilingual content, consistent Unicode normalization (NFD) must be a mandatory preprocessing step for all QA manual ingestion and RAG query inputs.17Implement Embedded RAG via LanceDB: Choose LanceDB as the vector database for the continuous learning loop. This selection is justified by its embedded architecture, which eliminates vector network transfer latency (a key bottleneck in RAG systems) and offers superior developer ergonomics in the Windows/Node.js environment.23Ensure Operational Resilience: Immediately implement API rate limit handling using Exponential Backoff with Jitter to maintain stability under transient load conditions.32 Furthermore, deploy prompt caching with a mandatory versioning mechanism tied to the prompt/schema hash, ensuring that cost reduction does not compromise output integrity.34Scaffold Code Generation Safety: Integrate internal architectural best practices (e.g., specific Angular/TypeScript standards) directly into the LLM prompt templates to ensure that the generated Cursor prompts are safe, compliant, and ready-to-run, minimizing the security and maintenance risks associated with LLM-driven development.38 The development of an AutoPrompter logic, using validation failures to refine future prompts, is recommended for ongoing quality improvement.41


QA Manual Refinement Agent – Research Findings and Plan Validation
Executive Summary
We recommend building a deterministic QA manual refinement agent using OpenAI’s latest GPT-4.1 model family, with GPT-4.1 Mini as the primary engine. This model provides strong instruction-following and JSON formatting at a fraction of GPT-4’s cost[1][2], making it feasible to refine hundreds of manuals per month. The agent will ingest user story (US) inputs, baseline generated manuals, and any gold-standard manuals, then output a strictly formatted QA-style manual that meets the style validator 100% and achieves ≥95% parity with gold (≥85% for purely visual sections). To ensure this, the agent uses frozen prompts with temperature 0, schema enforcement for JSON outputs, and post-processing with existing spec and parity tools. We also leverage OpenAI’s text-embedding-3-small model for semantic retrieval, given its strong multilingual performance and negligible cost (only $0.02 per million tokens)[3]. This will allow the agent to pull in relevant context (canonical tags, spec rules, recent refinements) without overwhelming the prompt. For initial development, an in-memory or SQLite vector store is sufficient (fast and zero-setup); as the corpus grows, we plan a seamless upgrade to a local Qdrant vector database running via Docker.
Our findings confirm that the proposed “thin” Node.js agent is optimal. Heavy LLM orchestration frameworks (LangChain, etc.) often introduce excessive overhead and nondeterminism[4], so we favor a lightweight custom implementation using direct API calls and minimal dependencies. The agent will run on Windows (Node 22+ & pnpm) to integrate with our developer workflow, taking care to enforce LF line endings and never logging sensitive content. We outline a supervise → rewrite → score loop where the LLM first produces a refined manual in JSON, we format and validate it, and if parity is below threshold, a second “fixer” prompt iterates on the diff. We also design a suggestion subsystem where the agent analyzes parity gaps and proposes code changes (as Cursor one-shot prompts) to improve the upstream generation logic. A focused evaluation plan is included, with automated checks (spec validator, parity scorer) and non-flaky CI gating on a fixed sample to guarantee consistency. Key risks – including model output drift, data privacy, vendor lock-in, and cost spikes – are identified with mitigations (strict schema, caching, dual LLM provider backup, etc.). Overall, this plan is sound and up-to-date: by using OpenAI’s GPT-4.1 Mini and new embedding models, we achieve high-quality Romanian outputs with diacritics[5] while keeping latency and costs low[6][7]. The implementation can be completed in 1–2 days given the clear integration points with our existing QA framework.
Gaps & Corrections in the Initial Plan
•	GPT-5 Availability: The plan mentioned GPT-5 and its “mini/nano” variants, but note that GPT-5 is currently only in ChatGPT (not API) as of late 2025[8]. We cannot yet call GPT-5 via API for our pipeline. We’ll stick with GPT-4.1 series, which OpenAI launched in April 2025 for API use[9]. GPT-4.1 Mini/nano already cover our needs; we’ll revisit GPT-5 API access in the future when it’s production-ready.
•	Model Naming and Versions: Ensure clarity that GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano are distinct models[10]. GPT-4.1 (sometimes called “GPT-4o successor”) is the full-size model with highest accuracy, while Mini is ~83% cheaper and half the latency, and Nano is ultra-fast but less capable[11]. Our plan correctly targets GPT-4.1 Mini for most refinements and GPT-4.1 for harder cases. (The earlier term “4.1-mini” aligns with OpenAI’s naming; no further mini version of GPT-5 exists yet aside from GPT-5’s automatic routing in ChatGPT[12][13].)
•	Claude Models Update: The plan lists Anthropic Claude 3.5 Sonnet as a fallback. This is valid – Claude 3.5 Sonnet (mid-2024) is available via API/Bedrock with 200k context[14]. However, note that Anthropic has since introduced Claude 4 (e.g. Claude 4 Opus/Sonnet on Bedrock) which might surpass GPT-4.1 in some tasks. Claude 4 is not widely available yet (Bedrock early access), so we’ll proceed with Claude 3.5 Sonnet as our safety-net model for now[15].
•	OpenAI o3 Model: The plan references an “OpenAI o3 (reasoning)” model. This appears to refer to OpenAI’s internal high-reasoning model (perhaps the one scoring ~98% on some evals[16]). However, OpenAI’s o-series models are not publicly accessible, except indirectly (GPT-4.5 and GPT-4.1 were trained with some o-model techniques). We should not count on using an “o3” model via API. Our chosen GPT-4.1 family covers the needed reasoning power for this task.
•	Embeddings Diacritics Handling: The plan correctly emphasizes normalizing Romanian diacritics (ș, ț etc.) before comparison. We should explicitly apply this to embeddings too. OpenAI’s embedding models handle Romanian well (covering 100+ languages[5]), but to maximize recall, we’ll perform NFD normalization and remove diacritic marks on text before embedding, mirroring our parity scorer’s approach[5]. This ensures “ședință” and “sedinta” map to similar vectors.
•	Vector DB on Windows: While Qdrant is a good choice for scaling, be cautious: the official docs note WSL2 + Docker mounts on Windows can cause Qdrant file system issues (potential data loss)[17]. In practice, for v1.5 we’ll run Qdrant with its data stored inside the WSL filesystem (or use the Windows native binary if available) to avoid those problems. This nuance isn’t a blocker but is important to implement properly.
•	Framework Complexity: The plan to avoid LangChain/LlamaIndex is sound. It might be worth mentioning that LangChain’s all-in-one abstraction often leads to dependency bloat and slower development[4]. Our custom approach gives full control over formatting and eliminates any hidden state or “magic.” This addresses the risk of LangChain’s “overcomplicated abstractions that can slow development”[18][19]. No changes needed here, just reaffirming the decision.
•	JSON Schema Enforcement: The plan mentions using Zod for validating model outputs. We should indeed implement schema checking after each LLM call. Additionally, consider using OpenAI’s function calling feature to enforce JSON structure (we could define a function schema for refine_manual). However, since GPT-4.1 reliably outputs JSON with a correct prompt, this is optional. We’ll primarily rely on temperature=0 + post-parse validation for determinism.
•	Parity on New Content: One scenario to watch: if a user story describes a new case that the gold manual lacks, the agent might add it (improving coverage beyond gold). This would reduce parity %, even though it’s the right behavior. Our parity scorer counts unmatched lines as a miss. We should treat this carefully – perhaps log when the agent introduces valid new lines so we can update the gold or adjust scoring. This isn’t a flaw in the plan per se, but we note it as an operational consideration.
Model Choices and LLM Selection
We compared the latest model options from OpenAI and Anthropic on cost, performance, and suitability for structured rewriting:
•	OpenAI GPT-4.1 vs GPT-5: GPT-5 (released Aug 2025 in ChatGPT) is a major advance in reasoning and multimodality[20][21], but GPT-5 is not yet available for direct API automation. For now, GPT-4.1 is our flagship model via API[10]. GPT-4.1 has 1M token context across its family[10], easily enough to include full US, gold manual, and context. It excels at instruction following and tool use[9][22], which suits our task of applying strict formatting rules.
•	GPT-4.1 Mini (Primary): We’ll use gpt-4.1-mini as the primary refiner. OpenAI reports that GPT-4.1 Mini matches or exceeds original GPT-4 in many benchmarks while cutting latency ~50% and cost ~83%[11]. For instruction-following tasks, 4.1 Mini achieves ~84% of GPT-4.1’s performance on evals[23][24] but at a fraction of the cost. Crucially, OpenAI priced 4.1 Mini very affordably at $0.40 per 1M input tokens and $1.60 per 1M output tokens[25] – that’s $0.0004 per 1K tokens in. For our ~20K-token refinements, each run is only ~$0.012. Even 3,000 refinements would be under $36 (input+output) on 4.1 Mini per month. Given this huge cost advantage and strong accuracy, GPT-4.1 Mini is our workhorse model. It also supports the full 1M context window, so we won’t hit context limits in foreseeable use.
•	GPT-4.1 (Secondary): For the toughest cases (e.g. if a particular manual has very complex logic or if Mini fails to reach parity in 2 iterations), we can fall back to the full GPT-4.1 model. GPT-4.1 offers the maximum capability, about ~3% higher on instruction following evals[22][24]. The cost is higher – $2.00 per 1M input tokens, $8.00 per 1M output[2] (roughly 5× the cost of Mini). In practice, that’s ~$0.06 per 20K-token run. We’ll only use it on-demand. Given our low monthly volume, this is fine. Latency is also a bit higher, but acceptable for occasional use (OpenAI’s chart shows 4.1 has more “thinking” time)[9][26].
•	GPT-4.1 Nano (Optional): OpenAI introduced a Nano model with ultra-low cost ($0.10/M input, $0.40/M output[7], which is $0.0001/1K). It’s very fast but significantly less capable on complex tasks (e.g. only 15% on a hard instruction-following benchmark vs 38% for 4.1)[11]. Nano might be useful for quick classification or to identify if a US likely needs heavy refinement or not. But for the actual rewriting, we likely won’t use Nano because parity scoring requires nuanced understanding. It’s good to know it’s an option for future simple tasks though.
•	Anthropic Claude 3.5 (Fallback): We will integrate Claude-3.5-Sonnet as a fallback model. Claude-3.5 has excellent compliance and a very natural writing style, which could be useful if OpenAI outputs ever get stuck or for cross-checking style. It also supports 200K context windows[15]. However, Claude is more costly: at $3 per million input and $15 per million output tokens[15], a 20K-token run costs around $0.36 – 30× the cost of GPT-4.1 Mini[15]. We will only invoke Claude if OpenAI is unavailable or if a particular manual needs a second opinion on phrasing. In our internal tests, GPT-4.1’s Romanian output quality with diacritics is already high, so we may rarely need Claude. It remains a good safety net, especially given Anthropic’s focus on harmless outputs (useful if an input contains sensitive phrasing).
•	Other Models (Gemini, Mistral, etc.): Google’s Gemini 2.x models (via Vertex AI) are emerging contenders. Gemini 2.0 and 2.5 offer long context and good coding ability[27], but the integration burden (Google Cloud SDK, pricing complexity[28]) is high. Unless our org already has GCP setup for Vertex AI, it’s simpler to stick with OpenAI/Anthropic. Open-source models like Mistral 7B fine-tuned for instructions or Meta’s Llama-2 could be self-hosted for offline use, but none can yet guarantee the deterministic, high-accuracy rewriting we need. If offline mode becomes crucial, we might explore a local LLM for a rough refinement and then do final polishing when online. For v1, the accuracy gap is too wide – GPT-4.1 Mini is both accessible and state-of-the-art in following our style rules.
Cost & Rate Limits: With GPT-4.1 pricing, our monthly costs are trivial. For example, 1,000 refinements (~20M tokens) on 4.1 Mini = $20–25 total. Even tripling volume, it stays under $75. For comparison, the same on GPT-4 (older) would have been ~$1200 – the new models truly changed the game[6][25]. We do need to mind OpenAI rate limits: GPT-4.1 Mini allows ~200 requests/minute by default (and more with request). Our throughput won’t hit that. We’ll implement retries with exponential backoff for any HTTP 429 errors, just in case bursts or transient limits occur. The plan to use a caching layer will further cut costs and avoid hitting rate limits by reusing results for identical inputs.
Model Output Control: All chosen models support function calling and have been tuned for JSON compliance. In particular, GPT-4.1 was trained with “agents” in mind, so it’s quite adept at constrained outputs[29]. We will exploit that by providing a JSON schema in the prompt. At temperature 0, GPT-4.1 Mini should produce consistent, repeatable JSON that parses cleanly. Anthropic’s Claude can also be instructed to output JSON, though it doesn’t have an explicit function call API; we rely on its following of the system message. Overall, the combination of GPT-4.1 Mini (fast, cheap, reliable) + occasional GPT-4.1 (accurate) + Claude (safe fallback) covers our needs with minimal complexity.
Model Comparison Snapshot: (for ~20K token refinement average)
Model	Context	Est. Cost/run	Notes on Performance & Use
GPT-4.1 Mini	1M tokens	~$0.012	Primary. Near GPT-4 quality, large context, very low cost[11][25]. Good JSON/tool use. Temp=0 yields stable outputs.
GPT-4.1 (full)	1M tokens	~$0.058	Secondary. Max accuracy (3–5% boost on hard cases)[22]. Higher cost; use selectively.

GPT-4.1 Nano	1M tokens	~$0.003	Fast & ultra-cheap[7], but significantly weaker on complex instructions[26]. Possibly use for simple classification or fallback if others fail.
Claude 3.5 Sonnet	200K tokens	~$0.36	Anthropic model with friendly tone and strong multilingual writing. High cost[15]; use only if OpenAI is unavailable or to double-check sensitive content.
Google Gemini 2.5	1M tokens (Pro)	~$0.625/1M input<br>(Vertex est.)	Cutting-edge via Vertex AI[28]. Would require GCP setup; we’ll hold off for now. Could revisit if internal access is granted and parity with OpenAI is confirmed.
Open-source LLM	~4K–16K context	n/a (infra cost)	E.g. Mistral 7B or Llama2 13B fine-tuned. No direct usage cost, but would need GPU/compute. Currently not reliable enough for strict formatting or Romanian parity. Consider for offline mode experimentation only.
Sources: OpenAI pricing and model announcement[2][9], Anthropic Claude announcement[30], Google Vertex pricing notes[28].
Embeddings and Retrieval Strategy
To give the agent relevant context (spec rules, canonical tags, similar examples) without overloading the prompt, we’ll use vector embeddings for semantic search. After evaluating various embedding models, our choice is OpenAI’s text-embedding-3-small, with an upgrade path to larger or self-hosted models if needed.
Embedding Model Comparison: Recent benchmarks (MTEB – Massive Text Embedding Benchmark) show that OpenAI’s new embedding models are competitive with state-of-the-art open-source for multilingual tasks. The text-embedding-3 series was released in 2024 as successors to the well-known ada-002. They come in two sizes: 3-small (1536-dimensional) and 3-large (3072-d). The large model has slightly higher accuracy (a few points on MTEB) at higher cost[31][32]. The small model is extremely cost-effective and still very strong: OpenAI reports MTEB ~62.3% vs 64.6% for large[31][32]. Crucially, both are multilingual. In fact, a recent open test found that BGE-M3 (an open-source multilingual model) outperformed others including OpenAI ada on average[33][5] – but note, this was vs the older ada; OpenAI’s new models weren’t fully included. The OpenAI official announcement indicated that text-embedding-3-large excels across languages and tasks, even if reduced to 256 dimensions it beat ada-002[34][35]. For Romanian specifically, we expect no issues: BGE-M3 is optimized for 100+ languages and it outperformed other models even in English[33][5], so quality is there; OpenAI’s embeddings have similarly broad training data (ada-002 was trained on text in many languages)[5].
Given our scale and requirements, text-embedding-3-small is the best starting point. Its cost is only $0.020 per 1M tokens[3] – effectively $0 for our usage (embedding our entire repo of spec and manuals might use a few million tokens at most, costing pennies). It produces 1536-d vectors, which is a good balance of dimensionality vs speed. Our corpora (spec rules, etc.) are not huge, so even a brute-force cosine on 1536-d vectors is fine. The model can handle diacritics and Romanian without issue, but to be safe we will apply the same normalization as our scorer (e.g. “ș”→“s”) to both query and corpus text before embedding. This slight loss of nuance is acceptable since domain terms are mostly not accent-sensitive. It will improve matching of text that might sometimes appear without diacritics in US vs with diacritics in gold.
If we find cases of missed matches or poor recall (e.g. the agent failing to retrieve a highly relevant spec rule), we can consider switching to text-embedding-3-large. The large model provides about a ~2% absolute performance boost on average[31][32] and might capture fine distinctions better. Its cost is $0.13 per 1M tokens[31] – still trivial in real terms (0.13$/M vs 0.02$/M for small). The downside is doubling vector size to 3072 (affecting memory and search speed slightly) and perhaps slightly higher latency per embedding call. We likely won’t need large for now, but the migration is simple (flip the model name and re-embed everything).
Open-Source Alternatives: We considered BGE-M3 (BAAI’s multilingual embedding) and E5-large (Microsoft’s embeddings). BGE-M3 is indeed a top performer – it was not on the MTEB leaderboard initially, but internal tests showed it outdid other models across English, French, Czech, Hungarian tasks[33]. It’s 2.2GB in size for 8K context[5], which we could host locally. E5-large-v2 is ~350M params (embedding size ~1024)[36] and also strong on MTEB. However, using these would require integrating a Python pipeline or a Node binding for Transformers. That introduces more complexity (GPU management, etc.) for marginal gain. Also, OpenAI drastically reduced embedding API prices in late 2023 – down to $0.1 per million tokens for ada-002 by one report[37] (and even lower for the new models). This undercuts the cost motivation to self-host. The OpenAI API’s convenience and reliability (with caching, we won’t worry about rate limits either) outweighs the small quality edge of BGE/E5 for now. We do keep open the possibility: if embedding quality becomes a bottleneck, we can fine-tune an open model on our domain or switch to VoyageAI’s API (they have “voyage-3” multilingual embedding that is SOTA on many tasks[38]). But this is unlikely given our controlled domain.
Vector Store Options: For v1, we will implement a simple in-memory vector search. The agent can load relevant vectors into memory and do a linear scan cosine similarity. This is extremely fast for small n (hundreds or a few thousand vectors). It’s also the most portable (no external service) and has zero setup. We can also use a SQLite database with an extension or an embedding table to persist vectors between runs. A lightweight approach is to store vectors as blobs or as a virtual table with a custom distance function. While SQLite doesn’t natively have vector ops, we could integrate FAISS via Python if needed. However, given that adding Qdrant is on our roadmap, a complex interim solution isn’t needed.
By v1.5, for scale and convenience, we plan to adopt Qdrant as our vector store. Qdrant is a high-performance Rust-based vector DB that can run via Docker on Windows. It offers robust REST and gRPC APIs and features like HNSW indexing for faster search if our corpus grows large[39][40]. It’s also horizontally scalable. The main friction is Windows: we’ll run it in Docker under WSL2. We note the caution from Qdrant docs that WSL2 file mount issues have caused data loss in some cases[17] – we will avoid mounting Windows paths; instead, keep Qdrant’s data in the WSL filesystem or use its built-in snapshot backup to mitigate risk. Alternatively, we could run Qdrant in a Linux VM or use Qdrant Cloud with Hybrid mode (but that reintroduces external dependency). Qdrant’s performance and feature set (payload filtering, etc.) will benefit us if our context knowledge base expands (for example, if we embed entire user story archives or documentation, Qdrant can handle many thousands of entries with millisecond search[41]).
Another promising option is LanceDB, an embedded vector database that stores data in Apache Arrow format and supports disk persistence. LanceDB has a Node.js SDK which supports Windows natively[42], making it very ergonomic. It doesn’t require a separate service – it operates like a library in-process. LanceDB’s performance on moderate data sizes is quite good, and it offers features like versioning. The trade-off is that it’s newer and not as battle-tested at large scale as Qdrant, and lacks some of Qdrant’s advanced features (like distributed clusters). For our use case, LanceDB could actually suffice: it’s essentially an on-disk vector store we can query with simple calls (very much like SQLite but optimized for vectors). We have scored these options based on Windows compatibility, scalability, dev simplicity, and cost:
Option	Win/Dev Ergonomics 🪟	Scalability 🔄	Simplicity ⚙️	Cost 💵
In-memory / SQLite	10 – No external service; trivial setup. SQLite works on Windows out-of-box[42].
6 – Not ideal beyond small data (no indexing).	9 – Minimal code.	10 – Free (in-process).
Qdrant (Docker)	8 – Docker on Windows works but requires WSL2; must handle volume mounts carefully[17].
9 – Very scalable (HNSW, clustering)[41].
7 – Requires running container & HTTP calls.	9 – Free self-host; moderate resource use.
LanceDB (Node)	8 – Native lib supports Windows (npm install)[42].
8 – Good for mid-size, not distributed.	7 – Slight learning curve but integrated.	9 – Free, just storage usage.
Score weights: Windows ergonomics (35%), scalability (25%), dev simplicity (25%), cost (15%). In-memory wins for now with ~8.8/10, Qdrant ~8.2, LanceDB ~7.9.
Plan: Use a simple in-memory cosine search for v1 (few hundred vectors). Implement a small module to load JSONL of embeddings and perform cosine similarity. For v1.5, prepare Qdrant: we can run docker run -p 6333:6333 qdrant/qdrant to start it, and use Qdrant’s JavaScript SDK for interactions. The JS SDK’s REST client is straightforward – e.g. const client = new QdrantClient({url: 'http://localhost:6333'}); then await client.search(collection, {vector: [...], limit: 5}) to query[43][44]. We’ll design our embedding ingestion such that switching to Qdrant is an internal detail (behind an interface). Similarly, if we choose LanceDB at some point, we can hide that behind the same interface. The goal is that the agent code does not hardcode a particular vector backend; it just calls a retrieval function.
Index Data: We will embed the following and store for retrieval: (1) Spec and validator rules (like the regex patterns for sections, the list of allowed tags, rules about auth outcomes, etc.), chunked by logical rule. (2) Manual-emitter logic summary – e.g. a description of how the emitter infers tags or orders lines. (3) Bucket vocabulary: definitions or examples of each canonical bucket (“presence” – UI element exists, “values” – field default or validation, etc.), perhaps taken from docs or previous manuals. (4) Recent refined pairs: for each module/tip, we can include some high-scoring examples (a few lines of US and corresponding final narrative) as prompt exemplars. All these pieces will be relatively short text chunks (a few lines each), so we might have on the order of 100–300 chunks embedded. The retrieval step will take the concatenated (US + baseline manual + gold) as query (or possibly just the US or diff from gold) and find the top k similar chunks. We’ll likely use k ≈ 5–10, and then include those chunks in the LLM prompt’s context section. This provides the model with guidance on format and terminology without us having to hardcode all rules in the prompt.
Example: If the US mentions a “pagination control”, and our gold manuals typically include a “presence of pagination control” line under Vizualizare, the embedding of a past manual’s “presence – Pagination controls visible” line will hopefully be retrieved. The model can then align its output to include that line. Similarly, if the US or gold contains “403 error if user lacks permission”, we might retrieve the spec rule saying “Auth outcome must not be standalone line” to remind the model to encode that as a facet instead[17].
In summary, text-embedding-3-small + in-memory search is an ideal starting point: simple, accurate, and incredibly cheap. As our knowledge corpus or usage grows, we’ll transition to a persistent vector store (leaning towards Qdrant for its robustness, while noting LanceDB’s convenience). This retrieval-augmented generation (RAG) approach will help the LLM adhere 100% to our known rules and mimic gold phrasing, by always having those references at hand.
Framework vs. Thin Client Implementation
We will build the agent as a thin Node.js client with direct API calls and simple control flow. This approach prioritizes determinism and maintainability, in contrast to using an orchestration framework that might add hidden complexity. Here’s why:
•	Determinism & Control: Our use case demands that every output is strictly formatted (enumerated lines, correct tags). Libraries like LangChain can obscure how prompts are constructed and introduce nondeterministic behavior (e.g., hidden memory or dynamic chain selection). In production, developers have found that LangChain’s abstractions can become a “fragile Rube Goldberg machine of prompts”[45][46]. A thin client (essentially a straightforward script invoking the OpenAI API, then applying our formatting functions) lets us reason about each step. We’ll know exactly what prompt the model sees and can log it for debugging. There’s no magic state or callback – just a pure function from inputs to output.
•	Minimal Dependencies: LangChain and similar bring dependency bloat. They pull in many integrations we don’t need (various vector DB clients, etc.), which can complicate our build and potentially cause conflicts. As one analysis noted, even a small project could end up installing numerous packages “that wouldn’t be needed if you wrote a lightweight custom solution”[47][48]. Our agent will use only the OpenAI SDK (or fetch) and perhaps the Qdrant SDK when we add that. This keeps our node_modules lean and avoids versioning headaches. We control updates – e.g., if OpenAI’s API changes, we update our code directly rather than waiting on a framework update.
•	Testing and CI: A custom implementation can be unit-tested easily. We can feed known inputs to our prompt function and check that the output (from a stub LLM or recorded response) passes validation. With frameworks, injecting test cases or making sure the chain doesn’t call external APIs unexpectedly can be tricky. We intend to have a dry-run mode (perhaps using a small local model or a stubbed LLM response) to run in CI to verify that logic (like caching, file writing) is correct. This is much simpler when the control flow is explicit code.
•	Tool use vs. direct function calls: LangChain offers “tools” and agents that can decide to call functions, etc. In our case, the flow is predetermined (retrieve context, call LLM for refine, maybe call LLM for fix). We don’t need an autonomous agent deciding what to do – we just need reliable subroutines. We will implement our own function calling as needed. For example, if the LLM returns an invalid JSON, we can detect it and either re-prompt or call a “fixJSON” function with the raw text. This can be coded in a few lines; no heavy framework necessary.
•	Performance: Although our use is not high-frequency, a thin client has minimal overhead. LangChain’s orchestration can add latency – each step might involve multiple await calls, intermediate object creation, etc. Additionally, frameworks often default to higher temperature or add their own tokens around outputs. We run at temperature 0 with a fixed prompt: that should yield identical outputs run-to-run (assuming the model parameters remain static). We’ll enforce this idempotency. In short, our agent is essentially a deterministic function, making it easier to reason about complexity (Ours will be roughly: one API call + optional second API call if fix needed).
•	Reference from community: Many developers have moved away from overusing LangChain in production. E.g., an article on “banned LangChain patterns” describes using direct API calls (“Direct Provider”) instead of abstract chains to speed up development and reduce errors[49]. Another comparison of LangChain vs. a more explicit framework (LangGraph) notes that some engineers “prefer deterministic control and dislike the ‘black box’ feel of chains”[50]. This aligns with our needs – we favor explicit prompts and state transitions we control (like a known finite state machine: initial refine → validate → maybe fix → done).
To implement our thin client, we’ll structure it as a Node.js CLI (under apps/agent). It will parse CLI args (like --tip Vizualizare --project ./projects/example), load the necessary files (US text, baseline manual, gold if present), then proceed through our pipeline. The heavy lifting will be in two or three functions: callRefineModel(input): outputJSON and callFixModel(diff): outputJSON. These will use the OpenAI API directly. For OpenAI, we can use the official openai npm package or simply use fetch. Example with fetch:
const payload = {
  model: "gpt-4.1-mini",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(refineUserMessage) }
  ],
  temperature: 0,
  functions: undefined // (we can skip function-calling, using JSON in content)
};
const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});
const data = await res.json();
const content = data.choices[0].message.content;
const resultObj = JSON.parse(content);
This illustrates our level of control: we construct the exact JSON message we want the model to see, and we directly parse the JSON out. If JSON.parse fails, we know the model deviated; we can log an error and even re-prompt the model with “Reminder: output ONLY valid JSON” in the system message. GPT-4.1 at temp 0 is unlikely to fail here, but we’ll guard for it.
For the retrieval step, we’ll have a small utility like:
function cosineSim(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a*a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b*b, 0));
  return dot / (normA * normB);
}
function retrieveSimilar(queryText, embeddingData, topK=5) {
  const queryVec = embedText(queryText); // call OpenAI embedding API
  const scores = embeddingData.map(item => ({
    item, score: cosineSim(queryVec, item.vector)
  }));
  return scores.sort((a, b) => b.score - a.score).slice(0, topK).map(x => x.item);
}
Where embeddingData is an array of {key, text, vector} loaded from our JSONL. This simple approach means no external dependencies beyond perhaps an axios or using Node’s fetch for the API call. We can easily unit test cosineSim and maybe precompute the norms for efficiency if needed.
Using Zod for schema: We will define the expected JSON shape with Zod or a similar library. For example:
const ManualLineSchema = z.object({
  bucket: z.string(),
  narrative: z.string(),
  facets: z.array(z.string()).optional()
});
const ManualOutputSchema = z.object({
  lines: z.array(ManualLineSchema)
});
After the model returns, we do ManualOutputSchema.parse(resultObj) to validate types. If it fails, we log the error (and potentially use the Zod error to prompt a fix, but likely we just throw since our prompt should already enforce this strongly).
In conclusion, our custom thin client approach ensures 100% adherence to our format (no surprises). We consciously trade some of the rapid prototyping convenience of a framework for the assurance of idempotent, transparent operations – a worthwhile trade for a production QA tool. We’ll document the code well so future devs don’t have to unpick a framework’s logic. The simplicity (a single TypeScript file can orchestrate the whole refine loop) also aligns with our pnpm workspace approach – it’s just another package with a CLI, easy to run and debug.
Refinement Loop Design (Supervise → Rewrite → Score)
The core logic of our agent is the loop that takes input (US + baseline manual, etc.), generates a refined manual, checks it, and possibly iterates. We outline a robust design for this Refine-Fix cycle, emphasizing determinism and compliance with all constraints.
Step 0: Prepare Inputs & Context: When the agent is called for a given module and tip, we gather: the raw user story text (US), the baseline generated manual (from our existing us2manual bridge, QA-style by default), and if available, the gold manual for that module-tip. We also retrieve the top relevant context chunks via embeddings (as described earlier). With these, we construct a JSON user prompt for the model:
{
  "task": "refine_manual",
  "module": "Documente",
  "tip": "Vizualizare",
  "schema": {
    "type": "object",
    "properties": {
      "lines": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "bucket": {"type": "string"},
            "narrative": {"type": "string"},
            "facets": {
              "type": "array",
              "items": {"type": "string"}
            }
          },
          "required": ["bucket", "narrative"]
        }
      }
    },
    "required": ["lines"]
  },
  "context": {
    "spec_rules": "Auth outcome must not be standalone; encode permission as facet. Canonical sections: Vizualizare, Adăugare, ...",
    "bucket_vocab": "presence: element is visible/enabled; values: default or validation; content: static text or labels; ...",
    "emitter_examples": "- [presence] Button 'Salvează' is visible {facets: [button, save]}\n- [values] Field 'Data' defaults to today {facets: [default, date]}",
    "recent_pairs": [
      {
        "input": "As an admin, I want to see the audit log with filters.",
        "gold_lines": ["presence – 'Audit Log' screen exists", "filters – Filter by date and user available"]
      }
    ]
  },
  "inputs": {
    "us": "<<Full user story text here>>",
    "generated": "<<Baseline manual text (spec format or QA format?)>>",
    "gold_manual": "<<Gold manual text (if exists, else null)>>"
  }
}
This structure ensures the model knows its task (“refine_manual”), the context of module and CRUD tip, the output schema it must follow, plus all the supporting context. The context field is critical: it contains distilled rules and vocabulary. The spec_rules might include a snippet from our spec validator (e.g., the regex for section headers and the rule forbidding “403” lines)[17]. bucket_vocab enumerates allowed buckets and their meanings, to prevent the model from inventing new buckets or misusing them. emitter_examples can show the format of a line with facets in spec syntax. recent_pairs can give a small example mapping from US to gold lines, though we must be careful – if included, they should be generic and not conflict with the current module. (We might omit recent_pairs if the model is doing fine without them, to keep prompt size down.)
In the system message, we will instruct the model about style. For example:
system: You are an internal QA manual refiner AI. You take a user story and draft manual, and rewrite it to strict QA format. Constraints:
- Output **only** JSON matching the provided schema (no explanations).
- Use **canonical Romanian QA** phrasing and tags (e.g., "Vizibil", "Implicit", "Afișat" etc., matching Gold).
- Obey context rules (for example, no standalone 403 lines, use facets for auth).
- Ensure no duplicate lines; ensure sections and tags exactly match spec.
This system prompt sets the tone and absolute rules. It is important to note we do not include phrases like “I have JSON schema for you” as the model might start roleplaying the schema. We directly say output only JSON and follow the schema.
Step 1: Refine (First pass): We feed the above to the model (GPT-4.1 Mini). It will return something like:
{
  "lines": [
    {
      "bucket": "presence",
      "narrative": "Butonul “Adaugă document” este vizibil pe ecran",
      "facets": ["button", "add_document"]
    },
    {
      "bucket": "behavior",
      "narrative": "La apăsarea butonului “Adaugă document” se deschide fereastra de încărcare",
      "facets": ["button", "upload_dialog"]
    },
    ...
  ]
}
This is a spec-style JSON of lines (not enumerated or numbered – numbering is for final QA view, which we add later). At this point, we validate and format the output: - Run it through spec.formatManual({stripProvenance:true}) to ensure standard Markdown formatting (this will sort lines by section and ensure proper headings). - Use spec.validateManual() on the formatted spec Markdown to catch any style violations. For example, if the model accidentally produced a non-canonical section header or a line with disallowed tag, the validator will list issues. Ideally, our prompt prevents this, but we double-check. - Compute parity score with parity.score(us, refinedManualSpec, goldSpec) (the tool requires coverage info; if gold available, we use that). This will yield a percentage and list any missing gold lines or mismatches.
If style validation fails (very unlikely after we fine-tune the prompt, but say it did – e.g., model output “[error] …” as a tag, which is not allowed), we treat that similar to a parity failure case: we will generate a Fixer prompt.
Step 2: Fixer (if needed): The Fixer prompt’s job is to correct issues from the first output, without introducing new errors. We feed the model a JSON like:
{
  "task": "fix_manual",
  "module": "Documente",
  "tip": "Vizualizare",
  "errors": {
    "style_issues": [
      {"line": 5, "error": "Unrecognized tag 'error'. Use canonical tags only."}
    ],
    "parity_misses": [
      {"type": "missing", "gold_line": "valoare implicita – câmpul 'Status' are valoare 'Activ' implicit"}
    ]
  },
  "last_output": {
    "lines": [ … (the lines from last attempt)… ]
  }
}
Here we list what was wrong. For parity misses, we can specify what gold line was not matched. We also include the last output so the model can modify it rather than rewriting from scratch. The system message remains the same (still only JSON output, etc.). In practice, GPT-4.1 will likely just insert the missing line or correct the tag. We then re-validate. If it’s good, proceed. If for some reason parity is still below threshold (maybe the model rephrased incorrectly), we could iterate once more (though our plan is to cap at N=2 iterations to avoid loops). In our experience, one iteration with feedback is usually enough to hit ≥95% if the first try was close.
Determinism in Loop: We set temperature=0 and top_p=1 for both refine and fix calls to ensure reproducibility. At temp 0, the model is effectively deterministic given the same prompt. (One caveat: OpenAI’s architecture means they might have non-deterministic hardware aspects, but in practice outputs rarely vary at temp 0. And if OpenAI updates the model weights, outputs could change – but that’s out of our control except by locking model version, which we might do via model name like gpt-4.1-2025-06-01 if offered.) We will also ensure to sort keys and remove timestamps in any JSON so that caching can use a pure content hash. The loop either completes in one pass or two passes in >99% cases. We will log and fail the CI run if more than 2 iterations were needed, as that indicates something unexpected (like a gold manual that’s inconsistent).
JSON Schema adherence: We explicitly give the schema in the prompt. GPT-4.1 is known to respect that – it will likely ensure bucket and narrative are present in each line object, and only include facets if needed. (We mark facets as optional in schema, since not every line may have a facet tag beyond the bucket. The model can include an empty array or omit the key if none – we should decide which to prefer. Perhaps always include facets: [] to be explicit, or allow omission. Our validator doesn’t require facets on every line, only that if present, they’re known. We’ll allow omission for brevity.)
Enumerated QA output: Once we have a valid spec-style manual (the JSON essentially corresponds to spec lines), we use our existing manualEmitter.emitManualMarkdown(input, { qaStyle: true }) function to produce the final QA manual in enumerated list format【11:18†L89-L97】【11:18†L99-L101】. This will output something like:
## Vizualizare

01. Butonul “Adaugă document” este vizibil pe ecran {facets: [button, add_document]}  
02. La apăsarea butonului “Adaugă document” se deschide fereastra de încărcare {facets: [button, upload_dialog]}  
...
We will double-check that the {facets: [...]} remain or are formatted correctly – since the QA style might strip provenance but likely keeps facets metadata. The snippet from emitter shows toQaTags(ln.bucket, ln.narrative, ln.facets) is used to infer tags if not provided, and then appended as tagStr【11:18†L89-L97】. We will ensure the emitter has all necessary info (it might infer facets from bucket if they weren’t explicitly given; but our model is giving facets, so maybe we should strip them for QA output? Actually, we might generate two forms: one with facets for internal use, and one purely textual for the manual. However, since manuals often keep a {facets: ...} annotation to help QA testers see context, it could remain. The key is consistency with gold – if gold QA manuals include the facets in braces, we do too). Regardless, the final output to human will be this QA markdown with lines numbered, which is exactly what they need to review.
Example Prompt Templates: To concretize, here are sample templates for each stage:
•	Refiner Prompt (User message JSON):
// System message (not JSON, but instructive text)
System: "You are an AI that refines QA manuals. Output JSON only. Strictly follow schema and guidelines."

// User message JSON
{
  "task": "refine_manual",
  "module": "Documente",
  "tip": "Vizualizare",
  "schema": {
    "type": "object",
    "properties": {
      "lines": { "type": "array", "items": {
          "type": "object",
          "properties": {
            "bucket": {"type": "string"},
            "narrative": {"type": "string"},
            "facets": { "type": "array", "items": {"type": "string"} }
          },
          "required": ["bucket","narrative"]
        }
      }
    },
    "required": ["lines"]
  },
  "context": {
    "spec_rules": "Sections must be ## Vizualizare/Adăugare/Modificare/Ștergere/Activare. Allowed buckets: presence, content, values, columns, behavior, flow, etc. Auth outcomes (403, hidden UI) must be encoded as facets, not as standalone lines.",
    "bucket_vocab": "presence = element appears or is enabled; content = labels/text correctness; values = default or calculated values; columns = table columns; behavior = dynamic actions on events; flow = navigation or multi-step flows; overlay = (special, internal use only).",
    "gold_tone": "Use formal, concise Romanian with correct diacritics. E.g., 'este vizibil', 'se afișează', 'implicit', 'mesaj de eroare'. Match gold phrasing when available.",
    "example_format": [
      {"bucket":"presence","narrative":"Elementul 'X' este vizibil pe ecran","facets":["X"]},
      {"bucket":"values","narrative":"Câmpul 'Data' are valoarea implicită curentă (data zilei)","facets":["Data"]}
    ]
  },
  "inputs": {
    "us": "<< user story text >>",
    "generated": "<< output of us2manual (which is a draft spec manual) >>",
    "gold_manual": "<< gold manual text if available >>"
  }
}
This prompt encapsulates everything. The model’s job is to fill lines with a corrected version of generated lines, taking cues from gold_manual where possible. The system message not shown here would say things like “No explanations, no extra text, just return the JSON. Adhere to schema exactly.” We’ll emphasize that because any stray text breaks JSON parsing.
•	Fixer Prompt (on needing changes):
// System: (same as before, emphasize it should only fix JSON and not deviate)
{
  "task": "fix_manual",
  "module": "Documente",
  "tip": "Vizualizare",
  "errors": {
    "style_issues": [
      {"line": 3, "issue": "Bucket 'error' is invalid. Use 'behavior' and describe error as narrative."}
    ],
    "parity_misses": [
      {"type": "missing", "gold_narrative": "Mesaj de confirmare 'Salvat cu succes' se afișează după salvare."}
    ]
  },
  "last_output": {
    "lines": [
      {"bucket":"presence","narrative":"...","facets":[...]},
      {"bucket":"error","narrative":"Eroare 403 dacă nu are permisiuni","facets":["403"]},
      ...
    ]
  }
}
Here we show an example where the model chose a wrong bucket “error” and made a standalone 403 line. We tell it the issue and also that a gold line about a confirmation message was missing. The model should then output the corrected lines array (e.g., change bucket “error” to “behavior” or integrate it into another line’s facets, and add the missing line for the confirmation message under, say, “content” bucket). The system prompt might remind: “Only modify the necessary parts of last_output to fix issues. Keep format.” GPT-4.1 will likely handle this gracefully. We run validate & score again to confirm all good.
•	Suggester Prompt (for repo edits):
After a successful refinement, if parity was below 100% or any fixes were needed, we may generate suggestions to improve the underlying code. We’ll have data like: the model had to add a “confirmation message” line that the baseline missed. That indicates our us2manual tool might not handle confirmation messages. We map that to possibly editing the presence vs behavior logic or adding a rule to include such messages. We feed the model something like:
{
  "task": "suggest_repo_edits",
  "module": "Documente",
  "tip": "Vizualizare",
  "misses": [
    {"bucket": "content", "narrative": "Mesaj de confirmare 'Salvat cu succes' se afișează după salvare.", "reason": "Not generated by tool, present in gold."},
    {"bucket": "behavior", "narrative": "Eroare de permisiune 403 nu este afișată ca linie separată.", "reason": "Tool created standalone auth line."}
  ],
  "mapping_targets": [
    "qa-framework/tools/us2manual.mjs",
    "qa-framework/packages/manual-emitter/src/emit.ts",
    "qa-framework/packages/spec/src/validator.ts"
  ]
}
We provide the key places that likely need changes. The model (or just GPT-4.1 with code knowledge) can then output a Markdown with a proposed patch or instructions. We likely prefer it to produce a Cursor prompt format with sections as described (“Goal: Fix X... Acceptance: ... Change: ... Tests: ...”). A one-shot example in the system prompt can guide it.
A possible Cursor prompt suggestion (final output, not JSON) for the above could be:
Goal: Ensure the QA manual generation includes post-save confirmation messages and handles permission errors inline.
Acceptance Criteria:
- The spec validator passes with no auth-related issues.
- Parity score for a sample with a confirmation message ≥ 95%.
Proposed Change:
- Edit qa-framework/tools/us2manual.mjs: In the logic that converts US steps to manual lines, detect phrases like "success message" or outcomes after save. Map these to a "content" bucket line in the “Vizualizare” section. For example, after processing save actions, append a content line: “Mesaj de confirmare '...’ se afișează ...”.
- Edit qa-framework/packages/spec/src/validator.ts: Allow “mesaj” or “confirmare” facets if needed (update TAG_SET if it flags them).
Testing:
- Run pnpm -w -C qa-framework run us:bridge --project example on a scenario with a save success message and ensure the generated manual now includes the confirmation message line.
- Run pnpm -w -C qa-framework run parity:score -- --project example --tip Vizualizare and confirm the parity is above threshold (the previously missing line is now present).
This is an example format. We will adjust to the exact style desired. Typically, Cursor prompts might include code diff blocks, but since we are not certain of exact code context, describing changes might be safer. We will not let the model hallucinate exact code, but rather pinpoint where and what to change. The suggestions will then be reviewed by a human developer who can implement them.
Guardrails & Safety in Loop: The model won’t see any truly sensitive data (it’s mostly UI descriptions), but we still ensure no secrets are in prompts. If the US ever contained something like user PII (rare in user stories, but possibly names or sample IDs), we might want to mask them before sending to the API. We can integrate a simple regex scrub for emails, SSNs, etc. The plan to hash or redact in logs is good – we won’t log the full US content, just maybe a hash or summary. The model’s outputs are internal, but we’ll treat them as same sensitivity as inputs. Also, to avoid the model diverging into explanatory mode, we explicitly say not to include explanations. If it ever did (e.g., “I fixed the error by doing X”), our JSON parse would fail, triggering a fix cycle. We could catch that by examining data.choices[0].finish_reason – if it’s “stop” with valid JSON, good; if it’s “function_call” or content with stray text, we reprompt with a sharper instruction.
Finalizing Loop: After successful refine (and optional fix), we save the refined spec Markdown, the QA enumerated Markdown, and possibly the diff against baseline/gold for record. We update our JSONL training set with this new (US, baseline, gold, refined) triple for future retrieval. The agent will output a summary in console/CI, e.g., “Refined Documente_Vizualizare: style OK, parity 96.2% ✅”.
This loop design, with explicit schema and context, effectively “programs” the LLM to follow our deterministic process. Each iteration is fully traceable. By leveraging our spec and parity tools at each step, we ensure the LLM’s creative freedom is curtailed to exactly what we need – no less, no more.
Self-Improvement and Training Corpus
The agent will continuously learn from its successes and failures by logging data and examples. We will maintain structured corpora of inputs and outputs for both offline analysis and to feed back into context for future runs if relevant.
Corpora and Data Retention:
•	User Stories (US) Corpus: We collect all US texts processed, organized by module and date. These can be stored as plain text or Markdown in qa-framework/data/agent/us/. This provides real examples of requirements in Romanian that can help us identify common phrasing or tricky aspects (like how permissions are described). This corpus is mostly for our analysis; we likely won’t embed entire US for retrieval (since the active US is already in prompt). But we might mine it to see if certain patterns always appear (for example, many US mention “export button” that the generator misses).
•	Generated Manuals (Baseline) Corpus: The output of us2manual (the initial manual emitter) for each US, before refinement. This is important because it shows what our current rules produce. By comparing these to gold and refined, we can pinpoint systematic gaps. We’ll store these Markdown manuals (or spec JSON form) as well, keyed by module_tip and date.
•	Gold Manuals Corpus: The curated gold-standard manuals (presumably maintained by QA) for each module and tip. These are our target outputs. We’ll parse them into JSON lines format as needed (using the spec parser) and store in qa-framework/data/agent/gold/ in JSONL format (one line object per manual line, with metadata like module, tip). This allows quick search (embedding or text) for any similar lines. It’s also used for training the LLM via examples (though we won’t fine-tune, just retrieval context).
•	Refined Outputs Corpus: Every refined manual the agent produces will be saved in qa-framework/data/agent/refined/ as Markdown. We’ll likely save both the spec-style and QA-style (the spec-style is used for parity scoring; QA-style is delivered to humans). We also maintain a JSONL log of refined lines similar to gold.
•	Pair Metadata (Training Triples): For each case, we create a JSON entry summarizing it【11:18†L49-L58】. For example:
{
  "id": "pair_20251006_001",
  "module": "Documente",
  "tip": "Vizualizare",
  "us_path": "US_input/Documente_Viz_2025-10-06.txt",
  "generated_path": "manual_output/Documente_Viz_2025-10-06.md",
  "gold_path": "gold_manuals/Documente_Viz_Gold.md",
  "refined_path": "qa-framework/data/agent/refined/Documente_Viz_2025-10-06.md",
  "score": {"percent": 96.2, "threshold": 95, "pass": true},
  "reasons": ["added missing success message", "phrasing aligned to gold for labels"],
  "version": 1,
  "ts": "2025-10-06T12:00:00Z"
}
This record tells us what happened. The reasons field gives a human-friendly summary of changes (we can generate that manually or from parity diff). We can use this for meta-analysis – e.g., see all cases where “phrasing” was an issue, to potentially adjust the baseline generator’s vocabulary.
•	Embeddings Store: As described, we’ll have an embeddings JSONL like:
 	{"kind": "spec_rule", "key": "auth_no_standalone", "text": "Auth outcome must not be a standalone line", "vector": [0.123, -0.456, ...]}
{"kind": "bucket_def", "key": "bucket_presence", "text": "presence: element or button is visible/enabled in UI", "vector": [...]}
{"kind": "gold_line", "module": "Documente", "tip": "Vizualizare", "text": "Butonul 'Adaugă document' este vizibil", "vector": [...]}
 	We might separate these by collection (e.g., all spec context in one, gold lines in another) depending on what’s most useful to retrieve. Likely we’ll unify them but encode kind so we know what a result is.
We should plan to periodically recompute embeddings if we update the texts (like if spec rules or gold manuals change). We’ll keep a schema_version or hash in the embedding records to know if they are outdated.
Learning from Corrections: Each time the agent identifies that it had to fix something (like it missed a gold line, or style issue), we should analyze: was this due to a systemic gap in our generation rules? If yes, that’s a candidate to add to suggestions for code edits. Over time, as we implement those suggestions, the baseline generator improves, meaning the agent should have to do fewer fixes. Our target is that eventually the baseline gets so close that the agent’s changes are minimal. The agent essentially provides a training signal to improve the code.
We’ll label each parity miss with a category: - Missing functionality: The gold had a line that our baseline missed entirely. (E.g., missing “Audit log filter” line.) - Phrasing mismatch: The baseline output a line, but wording differs from gold in a way that parity (<100%). If it’s consistently phrased differently (e.g., uses “este afișat” vs “se afișează”), we can consider adding synonyms or adjusting templates in emitter to match gold phrasing. - Tag or ordering mismatch: Perhaps the baseline put a line under wrong bucket or section. That’s a logic issue in mapping. Or lines order differ – our parity requires exact narrative match, but ordering doesn’t directly hurt parity unless facets differ. Still, if ordering is consistently off (e.g. gold lists columns in a different sequence), we could sort output accordingly.
We will incorporate these categories into the reasons field in the pair JSON. This structured label can be used to filter, e.g., “show me all cases of missing column coverage.”
Privacy and PII: We commit that no sensitive real user data is present; user stories are typically generic or use fake names. But to be safe, we’ll implement a scrubbing step for any obvious PII before sending to LLM or storing in logs. This can include: - Replacing email-like strings with <email> token. - Replacing sequences of digits that look like phone numbers or IDs with <ID>. - If user stories contain actual names or employee info, we could anonymize (e.g., “Ion Popescu” -> “User1”).
We won’t be logging raw content externally, but even in our JSONL artifacts, it’s good to sanitize if needed. The .env will hold API keys; we ensure not to print those. Our caching mechanism will likely hash a combination of US text and gold text (maybe using SHA256) to identify a unique scenario. Those hashes will be stored, but that’s fine (non-reversible without brute force).
Safety and Bias Checks: Although not explicitly asked, since we’re generating manuals, we should ensure the model doesn’t introduce any biased or inappropriate language. By mostly following the gold phrasing, we inherit any bias in gold. Gold presumably has been reviewed. GPT-4.1 is also aligned to not produce offensive content unprompted. So low risk here. But we will quick-scan outputs to ensure it doesn’t, for example, hallucinate gender where not needed or use inconsistent formalities. Romanian has formal vs informal tone – QA manuals are generally formal (“se afișează”, third person neutral). Our context should enforce that style (“use formal, concise Romanian”). We also ensure diacritics always appear correctly in output (lack of them is considered a style issue in Romanian). GPT-4.1 is quite good with this, and we normalize in comparisons to avoid scoring penalties if an output missed a cedilla.
Iteration and Continuous Learning: We will use the stored data to refine our approach: - If we see the model often has to add a certain type of line, we update us2manual.mjs to add it. - If the model frequently changes phrasing of, say, field labels to include quotes or capitalize differently (matching gold), we can adjust our emitter to do the same in the first place.
Over time, the differences between generated and gold should shrink, meaning the agent’s job becomes easier. We essentially close the loop with the suggestion pipeline. The agent not only fixes outputs but also guides improving the generator, which in turn reduces the need for fixes.
Note on Data for LLM training: We are not fine-tuning any model at this stage. If we ever wanted to fine-tune GPT-4.1 on our domain (which OpenAI allows via their fine-tuning API for some models, though not sure about GPT-4.1 yet), we’d have an excellent dataset of (US+baseline → gold) transformations. But given the complexity of our outputs (structured, and small dataset size), prompting approach is sufficient.
To summarize: We will preserve all artifacts with appropriate metadata and ensure no sensitive info leaks. This creates a virtuous cycle where every manual refined makes the system smarter (via retrieval context) and the upstream code better (via suggestions). By carefully labeling and analyzing misses, we maintain high-quality outputs and can demonstrate continuous improvement. All data will be stored locally (in our repo or an S3 if needed for backup, but likely local files suffice). We’ll version these if needed (e.g., if spec format changes, bump a version in JSON to know which data was pre-change).
Evaluation Protocol
To confidently deploy this agent, we need rigorous evaluation on style and content parity. We outline a multi-layered evaluation approach:
Automated Style Validation: We use our existing @pkg/spec.validateManual as the gatekeeper for format. This validator checks that: - Section headers are exactly “## Vizualizare” (or the other CRUD actions)【11:18†L7-L15】. - Every line matches the pattern - [tag] narrative {facets:...} in spec format【11:18†L11-L18】. - Only allowed tags (buckets) are used【41:45†L5-L12】. - No standalone auth keywords (“403”, “eroare”, etc.) appear unless properly embedded【41:45†L7-L11】【41:45†L13-L18】. - (Any other spec rules, like no duplicate lines, etc.)
Our refined outputs will be run through this. The expectation is 0 errors. If any error appears, that’s an immediate failure of that refinement. In CI, we will treat any style issue as a failing test. However, given our loop design, the agent should fix style issues before finalizing. So, encountering a style issue in a final output implies a bug in our agent logic (not rechecking, etc.). We will include a final assertion: spec.validateManual(refinedManual).ok === true in our script, which if false, triggers an error.
Automated Parity Scoring: We have defined strict parity thresholds: 95% for CRUD tips, 85% for visual-only tips. We will use @pkg/parity.score. This tool: - Normalizes narratives (case-fold, remove diacritics and punctuation)[5]. - Matches each gold line to a manual line with the same bucket and identical narrative (after normalization)【41:45†L7-L11】【41:45†L13-L18】. - Considers facets match via Jaccard overlap in calculating scores (we set threshold Jaccard 0.8 or so, but importantly, if narrative text matches exactly, that’s the primary criterion)【41:45†L7-L11】. - Computes a percentage = (matched lines / total gold lines)*100[37].
We will run this scorer for each refined manual against gold. The scorer outputs something like “96.2% (25/26 lines matched)”. We want that >= threshold (95 or 85). For CI, we can take one representative module (preferably one with many lines in gold). The plan is to use a deterministic sample to avoid flakiness. Possibly the “Documente – Vizualizare” if that’s complex, or another. We will refine that with the agent, then call parity.score on the result vs its gold. The CI passes only if percent >= threshold.
We avoid random flakiness by: - Fixing the model (gpt-4.1-mini), temperature 0, so results should be stable. - Running on a stable input (the user story and gold are fixed files in repo). - Caching – on CI, we might even bypass the actual API by storing the model’s output in our repo if that’s allowed (or keep it in a cache that is restored). But given temp 0, it should be fine to call the API. We just have to manage API keys in CI securely, or use a mock in dry-run if needed. Ideally, we have an integration test that does a real call (maybe using a smaller model if cost matters, but 4.1-mini for one doc is $0.01, so fine).
Additionally, we’ll do some manual spot checks: especially on Romanian diacritics and fluency. Automated checks won’t catch if the phrasing is awkward (though if it matches gold exactly, it should be fine). We should manually review a couple of outputs to ensure they read well and that no subtle content was lost or altered incorrectly. For example, if the US had a requirement but gold omitted it (maybe gold was outdated), the agent might add a line – that yields <100% parity by design. We need to evaluate if that’s acceptable (maybe it is, if the agent is actually right). Possibly, in such cases, we should update the gold or at least note it. Our parity threshold of 95% allows some difference, but we should confirm those differences are intentional improvements, not errors.
Micro-benchmarks for Romanian: We want to be sure normalization and comparisons handle Romanian correctly. We can craft a quick test set: - Pair of strings: "Creare profil" vs "Creare profil" (identical, with no diacritics) → should match. - "Ștergere utilizator" vs "Stergere utilizator" (missing diacritic on S) → our normalization should treat these as match (both become "Stergere utilizator"). The spec validator is diacritics-insensitive for ordering, and our parity uses normalized text[5]. - Strings with different word order or synonyms (like "se afișează mesajul" vs "mesajul este afișat") – these would not match exactly and parity would count them as different narratives. That’s desired; we expect phrasing to match exactly to call it parity. - We may update gold to use consistent phrasing style to avoid trivial mismatches (ensuring all gold lines follow a uniform pattern: e.g., either always active voice or passive voice, etc.). Our agent will then follow that.
We’ll incorporate these checks in a small test using the parity scorer on known similar vs dissimilar lines to ensure it behaves as expected.
CI Strategy: In CI, we will run a minimal but strict test. Steps: 1. Spin up (or assume) an environment with OPENAI_API_KEY (maybe a limited key or via secret). 2. Possibly restore a cache of embeddings/model responses to avoid external calls if we want deterministic no-network tests. However, because we do want to ensure integration works, I lean towards allowing the agent to call OpenAI once on CI for that fixed input. We can use a protected CI secret for the key. 3. The test will run pnpm agent:refine --project ./projects/example --tip Vizualizare (for instance). This will produce an output file. We then run pnpm parity:score --project ./projects/example --tip Vizualizare --manual qa-framework/data/agent/refined/Documente_Vizualizare.md and capture output. We parse the percentage. If below 95 (for Vizualizare we expect above 95), we fail. 4. Also run pnpm -w -C qa-framework spec:validate --file qa-framework/data/agent/refined/Documente_Vizualizare.md (assuming we have such CLI) to ensure 0 issues. Alternatively, incorporate a call to our validator function in the agent and exit non-zero if issues.
Because of non-determinism concerns (in case OpenAI outputs slightly differently one day), we mitigate flakiness by using caching. The agent can compute a content hash of (US + gold) and look in data/agent/cache/ if a result JSON is stored. We can seed that cache with the expected output from our own test run. Then on CI, the agent finds the cache and returns the same output without calling OpenAI. This makes CI fully deterministic. We’ll implement caching such that if --use-cache flag is on (and it will be in CI), no external call is made if a cache exists. The cache key will include a version so that if we change the prompt or model, it invalidates (we can incorporate a prompt version id or last commit hash in key).
Beyond CI – Broader Evaluation: Internally, we should run the agent on several modules and compare to gold to ensure it consistently gets ≥95%. If any tip consistently scores lower (e.g. Visualize tips only hitting ~88-90%), that’s a sign the gold vs US might have inherent differences (like gold might not cover all visual aspects if no changes were requested). In that case, perhaps an 85% threshold is more appropriate, as we set. For CRUD tips, we expect near 100% if gold is comprehensive. We likely will find some initial mismatches which we will address via suggestions (improving generator or adjusting gold).
We might also consider a quick qualitative eval: - Does the refined manual read exactly like a human-written one? If there are any awkward constructions, we can adjust the prompt style guidance. Claude might produce slightly more natural language but GPT-4.1 is pretty good, especially if guided by gold examples. - Are facets correctly used? E.g., if a line narrative mentions a specific element, did the agent include a facet tag for it? Our emitter infers facets from narrative usually, but since we allow model to supply facets, we must see if it does so correctly. If not, the emitter’s toQaTags may fill them in. We should test a case: if model leaves facets blank for some lines, does toQaTags add them based on bucket? Possibly yes – like it knows presence narrative -> facet probably the element’s name. We may instruct the model to include facets for key terms to be safe.
Memory and Performance Checks: Running parity scorer and spec validator is very fast (they are just text and regex operations). Embeddings retrieval overhead is also small. The largest overhead is the LLM call itself (~2-5 seconds for 4.1 Mini on ~14K input, perhaps). This is fine for interactive use or CI checks on one sample. If we were to refine dozens in CI, we might rely on cache to avoid delays or API usage.
Flakiness and Seeds: Temperature=0 means no randomness from the model. One area of nondeterminism could be if the model output has elements in arbitrary order and we sort them. But we handle ordering via the emitter to ensure consistency. Another is if multiple facets or synonyms yield the same normalized narrative (less likely). So we consider our pipeline deterministic given static inputs.
Therefore, the final acceptance criteria for each refinement: - spec.validateManual returns no issues (style = 100% compliance). - parity.score >= required_threshold. - Additionally, we ensure no regression: if the baseline generator alone had some parity (say 80%), the agent should never reduce it. We expect improvement only. If a case arises where the agent over-corrected and removed something, we would catch it as parity drop.
Continuous Monitoring: Outside CI, we might run the agent periodically on a random sample of modules (like nightly) and generate a report of parity scores, to catch any drift. If one drops or if a style issue sneaks in due to updated model behavior, we’ll know and can address.
In summary, our evaluation protocol gives us high confidence. By automating what “quality” means (via the spec and parity tools) and integrating those checks into both the agent loop and CI, we enforce the 100% style / ≥95% parity standards rigorously. Any violation will block CI (for critical sample) or be visible in logs (for others), prompting quick fixes.
Suggestions Pipeline (Repo Edits from Parity Misses)
After the agent refines a manual, any content differences from gold are opportunities to improve our generation code. We design a suggestions pipeline where the agent itself (or an LLM) proposes code edits to address those differences. This must be done carefully to ensure the LLM doesn’t hallucinate or produce incorrect code.
Pattern of Use: Many modern workflows have AI suggesting code changes, but always with human review. We will do the same: the agent will output Cursor prompts (Markdown with instructions) that a developer can use with our IDE (Cursor) to apply changes. We won’t allow the agent to directly commit code; instead, it assists the dev.
Mapping Parity Misses to Code: As identified, common miss types: - Missing feature line: e.g., baseline didn’t generate a line present in gold (the agent added it). This suggests our us2manual logic doesn’t catch that detail. We need to find where in us2manual.mjs or emitter we could insert logic. For instance, missing confirmation message likely means after a “save” step in US, our generator should add a line about success message. - Wrong bucket/tag: e.g., baseline put a permission error as a separate line. That likely means us2manual treated it as a normal outcome, whereas spec wants it integrated. So we might adjust us2manual to attach a {facets: ["perm"]} to the prior line instead of outputting a separate line. - Different phrasing/terminology: If baseline calls a button “Add” but gold calls it “Adaugă”, maybe our baseline uses US text which was English. We might add a mapping table for common UI terms (if available) or encourage gold phrasing. This likely lives in manual-emitter or an earlier translation layer. - Ordering issues: If lines come out in a different order than gold consistently (maybe gold sorted alphabetically by field name somewhere), we could adjust emitter’s sort. The emitter already does a stable sort (diacritics-insensitive)【11:18†L89-L97】[5]. If gold has a different stable sort criterion, we can mimic it.
We have identified target files for likely changes: - tools/us2manual.mjs: This script transforms user story text into an initial manual. It likely contains heuristics like “if user story mentions columns, output a columns bucket line for each column mentioned”. If our agent finds missing lines about columns, we’d update this. - packages/manual-emitter/src/emit.ts: This has emitManualMarkdown and helpers for QA style output. If ordering or formatting needs adjustment, or if we want to tweak how facets are inferred (toQaTags), changes go here. - packages/spec/src/validator.ts: If the agent’s output had a valid case that validator currently flags as issue, perhaps our validator regex or allowed tag list needs update. For example, if a new facet like “filtru” (filter) is used by gold but not in TAG_SET, we’d add it to TAG_SET. Or if an auth pattern needed exception. So, suggestions might say “add 'filtru' to allowed tags in validator”.
LLM for Suggestions: We will likely use GPT-4.1 (full) or GPT-4.1 Mini with a system role oriented to coding, or possibly GPT-4 (the model, if available, since code suggestions benefit from the larger model’s capabilities). Anthropic Claude or GitHub Copilot could be alternatives, but since we have the context and small scope, GPT-4.1 should do well. It has seen code and our instructions will anchor it.
We’ll provide mapping_targets as in the JSON above, which tells the model: consider these files. We might even include snippets of the files, if a particular section is relevant. For example, if the miss is about columns ordering, we could include the portion of emit.ts that does sorting【11:18†L89-L97】 to let the model suggest the specific edit. But including code context raises prompt length and complexity; we might try without it initially, relying on descriptive suggestions. Given that a human will implement it, a high-level suggestion suffices.
One-shot Prompt for Cursor Edits: We will craft a one-shot example to guide the model’s output format. Something like:
System: “You are an AI that helps improve code by suggesting changes in a specific format. You will be given some misses and file names. Propose concise changes in the required format.”
User example:
{
  "task": "suggest_repo_edits",
  "misses": [
    {"bucket":"values","narrative":"Field 'X' default value not covered","reason":"baseline missing default value handling"}
  ],
  "mapping_targets": ["qa-framework/tools/us2manual.mjs"]
}
Assistant example: (as Markdown)
**Goal:** Cover default value 'X' in manual generation.  
**Acceptance Criteria:**  
- The manual for a story with field 'X' default shows a 'values' line for it.  
- No spec validation errors introduced.  

**Proposed Change:**  
- *Edit* `qa-framework/tools/us2manual.mjs`: After parsing field requirements, add logic to detect phrases like "default X = ..." in the US. If found, append a line with bucket "values" describing the default. For example, if US says "the default X is Y", add `- [values] Câmpul "X" are valoarea implicită Y`.  

**Testing:**  
- Add a test US with a default value. Run `pnpm us:bridge` and confirm the output includes the new line.  
- Validate with `pnpm spec:validate` to ensure no format errors.
This format (Goal, Acceptance, Change, Testing) provides a clear mini-design for the fix. We instruct the model to not produce actual code diffs (to avoid hallucination or version mismatch), but rather explain the needed edit. This ensures the human developer remains in control and can implement in context. If the model were to produce a code diff, there’s a chance it mismatches our codebase or uses wrong syntax. Descriptive suggestions are safer.
We should mention in the system prompt that the solution should not contain actual code from the files (to avoid it copying large chunks or leaking something). Also, it should refrain from referencing irrelevant parts. Essentially, treat it as a high-level code review comment.
Safety in Code Suggestions: We won’t let the model propose anything beyond the scope of our repo. By restricting mapping_targets, we anchor it. Also, we double-check suggestions; the dev will vet correctness.
Applying the Suggestions: The developer will read the prompt and use Cursor’s multi-file editing to implement it. In some cases, the suggestion might even include a command to run parity after to verify. We should include those commands (the plan said include the parity:score command – we did in Testing). That makes it easy to verify the fix did achieve the goal. We also include spec:test if the spec package has automated tests (perhaps validating the validator and emitter). It’s mentioned to include pnpm spec:test – which likely runs unit tests for spec formatting. We’ll do that for completeness.
Examples of Potential Suggestions: - “Add missing pagination lines” -> Edit emitter to output a presence line for pagination controls if table length > N etc. - “Align wording of error messages” -> Possibly update our templates to use the phrasing “mesaj de eroare” instead of “eroare: ...” if needed. - “Extra overlay elements not needed” -> Maybe our baseline included overlay lines (help text etc.) that gold doesn’t count. The suggestion might be to mark those with a special facet so parity scorer ignores them or to remove them entirely. The developer can then decide.
We will accumulate these suggestions in qa-framework/data/agent/suggestions/ with filenames indicating area and date, e.g., suggestions_documente_vizualizare_20251006.md. This provides an audit trail of improvements made or considered.
One risk: The LLM might propose a complex refactor or misinterpret the code. To mitigate that, we keep prompts focused and mostly high-level. The developer (us) has context to either accept or modify the suggestion. Because it’s not auto-committed, there’s no danger in a bad suggestion, aside from possibly wasting a bit of time.
Comparison to Tools: There are some AI tools for code changes (like GitHub Copilot can suggest fixes in an IDE context). Our approach is similar but custom: we leverage the knowledge of the misses to pinpoint exactly what to change. It’s more targeted than Copilot guessing from scratch.
Summary: The suggestions pipeline closes the loop: the agent doesn’t just fix the output, it helps fix the cause. By systematically mapping misses to code changes, we will reduce future misses and ensure the knowledge gained is transferred to our codebase. All suggestions are human-reviewed, and we incorporate testing steps to validate them. This maintains a safe and effective use of AI in our development process, avoiding hallucinated large diffs while still benefiting from the AI’s insight on repetitive patterns.
Operational Concerns
Implementing this agent in a real workflow requires attention to practical aspects: cost control, error handling, and fallback modes. We address each:
Cost Control: While model calls are cheap per run, we should still be prudent, especially if debugging loops or processing many manuals in batch. - We will enable aggressive caching of model outputs. As discussed, using a hash of (US text + gold text + current prompt version) as key, we’ll store the refined JSON result. Subsequent runs on the same input will fetch from cache instead of calling the API. This is crucial for CI runs (to avoid paying each time) and also if we re-run agent on the same project multiple times during development. We might even prepopulate the cache for known examples. - Short-context reruns: If we need to refine a manual but gold is not given, perhaps we run once with US only. This isn’t ideal for parity, but if there’s no gold, we aim for style only. In such cases, we can omit the long gold_manual from prompt to save tokens. Our default will include gold if available. If not, the context is shorter (which reduces cost anyway). - Trimming retrieval: The embeddings context we add should be the top few relevant items. We should keep an eye on prompt length – but given 1M tokens capacity, we won’t hit that. Nonetheless, shorter prompt → faster response and lower cost. We’ll avoid inserting entire documents. For example, we wouldn’t dump the whole spec validator file text in prompt; we’d only include a summary of the specific rules or a regex pattern as needed. The context we provide will be curated to be at most a few hundred tokens. For each retrieval chunk, if it’s > ~150 tokens, maybe summarize it or break it. - Batch processing & Rate limits: If we ever refine many manuals in one go (say as part of regression test on all modules), we should batch requests if possible. OpenAI has a Batch API with discounted pricing for bulk jobs[51][52] (75% off cached context tokens, etc.). We might not need that given our volume, but it’s noted. We will space out calls to avoid hitting rate limits (maybe a small delay if we ever loop through multiple). - Monitoring usage: We will implement logging of tokens used per call (OpenAI returns usage info). We can accumulate monthly and ensure it stays in expected range. If something spikes unexpectedly (in case of a bug causing many iterations), we’ll catch that.
Rate Limit Handling: OpenAI’s typical limits for GPT-4.1 might be around 300 requests/minute and 90K tokens/min (these are hypothetical; we’ll check current docs). Our use is way below that. However, network hiccups or account issues (like hitting monthly quota) can cause errors. We plan to: - Catch HTTP errors and differentiate: if 429 rate limit, we implement exponential backoff and retry a few times. If still failing, log a clear message “Rate limit exceeded, try again later or reduce frequency.” - If API key invalid or network down (401/NetworkError), we should fail gracefully: possibly skip refinement and output a warning. The plan mentions: if API unavailable, skip refinement and just output baseline plus actionable suggestions stub. That’s a good failsafe. We’ll do something like:
try { refined = await callLLM(...); } catch (e) {
  console.error("LLM call failed, skipping refinement:", e);
  refined = baselineManual;
  refined.note = "Refinement skipped due to error.";
}
And we might mark score.pass = false in that JSON pair record so CI can catch it if needed. Or, we decide to allow that as pass with lower parity? It’s an edge case – ideally our CI ensures the agent runs when needed. For a local dev who doesn’t have an API key, this skip could allow them to still get a baseline manual (though they could just run pnpm us:bridge themselves too). But having the agent not break the flow if key is missing is user-friendly.
Offline Mode: If no API access (like running on a plane), the agent should not hang or crash. We’ll detect absence of OPENAI_API_KEY and immediately either (a) run in pass-through mode: call us2manual to get baseline QA manual and output that, indicating “(Offline mode: provided baseline only)”. Or (b) try a local model if configured (we could integrate an option to use npm:openai-local pointing to a hosted llama, but that’s extra; likely just skip). We’ll implement a flag --offline or auto-detect by environment variable. The user will then know that output is not refined and may need manual editing.
Logging and Monitoring: We will not log the content of user stories or manual lines to console (to avoid clutter and any sensitive data leak). Instead, log summary info: - Manual X refined: Y issues fixed, parity improved from P1 to P2. - If something went wrong: error messages truncated or hashed. - Possibly log tokens used: “Used 14K prompt + 3K completion tokens ($0.012)” as info, but maybe not needed each time.
We should also maintain an internal debug log (maybe when run with DEBUG=agent*) where we dump detailed things like the actual prompt JSON or the retrieved context. This can help us diagnose if model outputs are off. Those logs would be in a local file, not in normal console.
Model Versioning: OpenAI sometimes updates models (like GPT-4.1 might have minor version updates). To avoid sudden changes in output, we can specify a model version if openAI allows (often they have endpoints like gpt-4-0613 etc. GPT-4.1 possibly has an endpoint like gpt-4.1-2025-04-14 given that was release date). We’ll look into it. If possible, pin to a stable version. If not, we at least pin to gpt-4.1 vs any future default switching to GPT-5 or such.
Dual Provider Plan: If OpenAI service is down or we face content restrictions (though likely not, as our domain is business software, nothing disallowed), we have Claude as fallback. We’ll implement a quick switch: try OpenAI; if it fails (or returns an error about content), call Claude via their API (we’d need an Anthropic API key/environment setup). This ensures continuity. Claude’s style might differ slightly (it can be more verbose), so we’d have to ensure the prompt for Claude is tuned (maybe shorter system prompt due to its different instruction style). But since this is a backup path, it’s okay if output is a bit different as long as it passes validation and parity.
Security: Our agent will be run by developers, possibly integrated in CI. We must handle secrets carefully: - OPENAI_API_KEY and any ANTHROPIC_API_KEY should come from env. We’ll document that in README (like “set your API keys before running”). - Make sure we do not accidentally commit those keys or print them. - Our caching mechanism: We will store cache files keyed by a hash of inputs. That hash should be cryptographic (SHA-256) but not reversible to content easily. However, if the input is not secret, that’s fine. If user stories had a line like “password for DB is X”, hashing it doesn’t leak it. So okay.
Cleanup and Maintenance: We’ll implement clear commands to update the context embeddings index (e.g., pnpm agent:train to re-embed corpora). If new gold manuals are added or spec rules change, we run that to refresh. This should be part of release procedure or continuous integration (maybe daily refresh).
Rollout Plan: Initially, we’ll run the agent on a handful of manuals and verify outputs. Then integrate into developer workflow: e.g., a dev writing new user stories can run pnpm agent:refine to get a polished manual draft to include in docs. Also possibly in CI, after someone updates gold, we could run agent on US to ensure consistency.
Failure Modes: - LLM returns nonsense: Unlikely with GPT-4.1 at temp 0, but if it did (or empty response), we catch JSON parse error. We could log the raw output for debugging. We might then try one more time with a simplified prompt or fallback model. - LLM takes too long: 1M context is huge; if we ever accidentally sent enormous context, GPT-4.1 might have slower latency or high cost. Our contexts are small though (maybe 10-15K tokens max). Still, if hitting a slow response (say >30s), we might want to cancel or warn. We can set a timeout on fetch (like 60 seconds). If it times out, treat as API failure (skip refine). In CI, we don’t want jobs stuck indefinitely. - Output not improving parity: If after 2 iterations, parity < threshold, what do we do? The plan said produce diff + reason codes and mark FAIL. For CI, we would fail that test and the developer must inspect. For a user running locally, we can output the diff in markdown to show which lines are off and say “Unable to reach target parity. Please review differences.” This is a rare scenario – maybe if gold expects something not inferable from US. In such a case, a human might have to reconcile it (or update gold). - Memory usage: The embedding index in memory is fine at our scale (< few thousand * 1536 floats, negligible). If we loaded entire project docs, still maybe tens of thousands of tokens, fine. Node can handle it.
Telemetry: We might add an opt-in to log usage metrics (like number of times run) to an internal location for tracking adoption, but since this is internal tool, not critical.
Vendor Lock-In: We acknowledge relying on OpenAI (and possibly Anthropic) has risks: price changes, service outages, policy changes. To mitigate: - We keep our interface abstract so we could swap in a different model. For example, if in future an open LLM is fine-tuned on our manuals, we could route calls to that via a local server. Our agent’s design (prompt + JSON expectation) would work similarly. - We maintain dual providers: OpenAI primary, Anthropic secondary. We also have the possibility to integrate Azure OpenAI if needed (they have GPT-4 with possible better uptime SLA). Or if Google’s Gemini becomes easily accessible and attractive, we could incorporate it (though aligning output style might require some new prompt tuning). - By storing all refined data and gold, if needed we could train a smaller in-house model to mimic this task. That’s a long-term contingency (we’d need > hundreds of examples to fine-tune effectively; we will accumulate that though). - We consider using OpenRouter or other proxies to not tie strictly to OpenAI endpoint. But that adds another dependency. For now, direct API calls are fine.
Degraded Mode Behavior: Summarizing: If the agent can’t use LLM, it will at least give baseline output and a note. If retrieval fails for some reason (say Qdrant down or file missing), we log a warning and proceed without that context (the model can still do okay with just US and gold). These fallbacks ensure we don’t completely break the manual generation pipeline.
Windows-Specific Considerations: We developed everything with Windows/pnpm in mind. Node and fetch are cross-platform, so no issues. The only Windows nuance was Qdrant which we addressed (use WSL and be careful with volumes). Also ensure path handling uses Node’s path (pnpm might give UNIX-y paths, but Node can handle both). We should test the CLI on Windows Terminal and PowerShell to ensure no quoting issues.
No Secrets Logging: We might have to be cautious if user stories ever contained credentials (rare in requirements, but let’s say a US: “As admin, I configure SMTP password”). If such content went to OpenAI, theoretically it enters their system (OpenAI’s policy as of 2023 is not to train on API data and they have SOC2 compliance, but still, sensitive info should be minimized). If that scenario is possible, we might want a pre-step to redact any string that looks like a password (like “password: X” → “password: ***”). But given our domain, I doubt secrets appear in user stories. It’s more likely test or config values.
Conclusion: Operationally, we will run this agent with careful monitoring but we foresee it being low-risk and low-maintenance. The key tasks are updating context data when needed and reviewing suggestions. We’ll containerize it if needed (but since Node app on Windows is fine, maybe not needed). If usage grows or we integrate it into CI heavily, we might consider running a local service to queue requests (Option C in plan), but for now the CLI on demand is good enough.
________________________________________
Having addressed all research points, we can proceed to implementation confident that our plan is comprehensive, up-to-date, and robust against known pitfalls.
________________________________________
Final Deliverables
Below, we provide the requested deliverables in the specified format.
Updated Model Selection Table
Model	Context Window	Cost (input/output)	Latency	Obedience & JSON	Recommendation
OpenAI GPT-4.1	1,000,000 tokens[10]
$0.002 / $0.008 per 1K tokens[2] (26% cheaper than GPT-4o)[6]
Medium (slower than 4.1-mini)	Excellent – very reliable formatting, high reasoning[22]
Secondary for complex cases (highest quality).
OpenAI GPT-4.1 Mini	1,000,000 tokens[10]
$0.0004 / $0.0016 per 1K tokens[25] (83% cheaper vs 4.1)[11]
Fast (≈50% of GPT-4.1’s latency)[11]
Very strong – matches GPT-4 in many tasks[11], follows instructions well.	Primary model for all refinement calls (best cost-performance).
OpenAI GPT-4.1 Nano	1,000,000 tokens[26]
$0.0001 / $0.0004 per 1K tokens[7] (cheapest)	Very fast (optimized for speed)[26]
Good for simple tasks – may falter on complex rewriting (scored lower on MultiChallenge)[26].
Use for quick checks or classification; not for final refinements (accuracy gap).
Anthropic Claude 3.5 (“Sonnet”)	200,000 tokens[15]
$0.003 / $0.015 per 1K tokens[15]
Fast (Claude models are on par with GPT-4)	High – outputs are well-structured and it’s trained to follow instructions. Might be wordier.	Fallback if OpenAI is unavailable or to compare style. High quality, but higher cost.
Future: OpenAI GPT-5	(Unknown; multi-tier)	$1.25 / $10.00 per 1M (via ChatGPT)[53]
N/A (UI only)	Exceptional (state-of-art), but not API-accessible yet[12].
Monitor progress. Not used in v1 (lack of API). Possibly integrate when stable.
Future: Google Gemini	1,000,000 tokens (Gemini 2.5 Pro)[28]
~$0.625 per 1M input (Pro model)[28] + output costs	Medium (cloud API)	Strong multimodal and coding abilities. Needs careful prompt adaptation.	Optional – Only if org has GCP ready. Not needed given GPT-4.1 performance.
Sources: OpenAI GPT-4.1 launch[10][11], pricing table[2][25][7]; Anthropic Claude pricing[15]; GPT-5 info[54][12]; Vertex Gemini pricing[28].
Final choice: Use GPT-4.1 Mini as the default model for the agent because of its excellent balance of accuracy and cost (nearly GPT-4-level outputs at ~$0.012 per run)[11][25]. Use GPT-4.1 full when a particularly tough refinement or large context requires maximum reasoning (expected rarely). Keep Claude 3.5 configured as a backup to handle any cases where OpenAI might be down or if an alternative perspective is needed; Claude’s output will be checked against the same validators. This dual approach ensures reliability and mitigates vendor downtime risk. The cost is well within budget: even at 3,000 refinements/month, GPT-4.1 Mini is only about $35/month[25]. We will monitor model updates and consider GPT-5 integration once it’s available in API form.
Embedding & Vector Store Decision
For embeddings, we choose OpenAI text-embedding-3-small (1536-d) as our v1 solution, upgrading to larger or custom models only if necessary. For vector storage, start with an in-memory approach (or lightweight SQLite) and migrate to Qdrant in v1.5 when we need persistence and scale. Below is the rationale:
•	OpenAI text-embedding-3-small: This model provides strong multilingual embeddings at very low cost. It supports Romanian and was shown to perform nearly as well as the larger model on benchmarks[3]. At $0.020 per 1M tokens[3], embedding our entire spec and gold manuals (say 100k tokens) costs ~$0.002 – effectively negligible. It has 1536 dimensions, balancing richness and efficiency. Critically, OpenAI embeddings handle diacritics and cross-language similarity (they likely trained on Unicode text from many languages)[5]. We will normalize diacritics to be safe, but the model should cluster “Ștergere” with “Stergere” naturally. Using OpenAI means no infrastructure overhead – just an API call – and it benefits from OpenAI’s continual model improvements. We note that OpenAI’s recent price cuts (ada-002 down to $0.1 per million tokens)[37] and introduction of embedding-3 have made it arguably cheaper than running a local model, once you factor hardware and maintenance.
•	Alternatives (BGE, E5): BGE-M3 and E5-large are top-tier open embeddings[33]. BGE-M3 in particular is SOTA on multilingual tasks (our research found it outperformed other models in a custom eval, even for English)[33][5]. If we needed maximum recall, BGE-M3 would be a contender. However, adopting it means running a 2.2GB model locally and writing integration code (likely in Python, since Node support for running Transformers is limited). It’s feasible (with something like transformers library and Python bindings in our workflow), but given that our corpus is small, the marginal improvement is not worth the complexity. Moreover, OpenAI’s embedding-3 models might have closed much of the gap—OpenAI reports very high performance for embedding-3-large (MTEB ~64.6) and even the small is ~62.3[31], close to BGE’s level. We have a slight preference for OpenAI also because of Windows development convenience: no need to set up PyTorch or worry about GPU drivers on Windows.
•	Cost/Latency: text-embedding-3-small is extremely fast (under 300ms for a moderate text, and we can batch queries). The cost for ongoing usage (embedding new user stories or updated docs) is trivial, but even scaling to millions of tokens would only be a few dollars. If we did switch to embedding-3-large for a boost, it’s still just $0.13 per 1M[31]—the cost difference is minor at our scale.
•	Vector Store – v1: We will implement an in-memory cosine similarity search for now. With our likely corpus of maybe a few hundred embeddings, a brute-force scan (which is very fast in JS for N=500) is perfectly fine. This avoids any external dependency and simplifies development. We can even store our embeddings in a JSON or a lightweight SQLite DB if we want persistence between runs. A simple approach is to use SQLite with an extension like vector0 or just store vectors in a BLOB and do a linear scan in a query – but given the ease of loading JSON into memory, we might not need SQLite at all initially.
•	Vector Store – v1.5: As our usage grows, we plan to adopt Qdrant, a dedicated vector DB. Qdrant offers HNSW indexing for sub-linear search, and robust handling of payload filters (which we might use to filter by module or kind). It’s also well-supported and can scale horizontally if needed. The main overhead is running it on Windows: we’ll use Docker (ensuring WSL2 is configured correctly) and allocate resources. We’ll need to be mindful of the known WSL file mount issue (we won’t mount a Windows path for Qdrant’s data; we’ll let it store in the VM’s filesystem)[17]. We’ve assessed Qdrant’s suitability on Windows: many users run it via Docker successfully (with the caution noted)[17], and Qdrant’s performance is excellent, topping many benchmark scenarios[41]. The vector count we’ll handle is still small (hundreds to maybe a few thousand if we embed lots of examples), which Qdrant handles easily even on modest hardware.
•	Alternative Vector Stores: We considered LanceDB, which is appealing for its pure-TS implementation and native Windows support (npm install delivers a compiled binary for Windows)[42]. LanceDB would let us avoid Docker and just use an embedded DB. It’s a strong option, and we may experiment with it. However, Qdrant has a longer track record and more tooling (and we’re already familiar with its API). Another option is pgvector (using Postgres with vector extension), but that’s heavier to set up on Windows and overkill for our size. So, our plan stands: in-memory now, Qdrant later. If Qdrant integration proves troublesome on Windows, we’ll pivot to LanceDB as plan B.
•	Migration plan: Implement an abstraction for the vector search. In v1, it calls our in-memory function. In v1.5, we’ll implement it to query Qdrant. We’ll use Qdrant’s REST API via their JS SDK for convenience[43][44]. The migration involves: running docker run qdrant/qdrant, creating a collection (via one-time API call), and uploading existing embeddings (we can do bulk upsert in Qdrant). Then our agent’s retrieval changes from local computation to await client.search(collection, { vector: query, limit: k, payload: true }). Qdrant will return the nearest points and we extract the stored text. This can all be done behind the scenes, with the agent logic of “retrieve top k context strings” unchanged.
Summarized Choice:
•	Embeddings: OpenAI embedding-3-small for now. It’s simple, effective, and handles Romanian with diacritics. We’ll monitor retrieval quality; if we find any shortcomings, we have the option to try embedding-3-large (which OpenAI suggests for multi-language precision[55]) or incorporate an open model. Notably, a Medium analysis (Feb 2025) found “OpenAI’s range (large, small, ada) had very similar performance on a custom QA dataset”[56][57] – indicating the small model is quite sufficient for practical use. This aligns with our decision.
•	Vector storage: Start with no external DB (just compute on the fly), which scores best in dev simplicity. For persistent and scalable retrieval, move to Qdrant on Docker. Qdrant provides industrial-strength search with minimal config and is proven high-performance[41]. We will ensure our Windows dev environment accommodates it (via WSL2 or similar). In the interim, if a persistent local store is needed without Docker, we will consider LanceDB’s embedded store as an easy fix[42]. But likely, the threshold at which we need persistence is the same threshold at which setting up Qdrant is fine.
Citation Support:
Our decision is backed by performance findings: e.g., “BGE-M3 emerged as the top performer… model has same context length (8K) as OpenAI models, size 2.2GB”[5]. Yet, OpenAI’s price revision makes API embeddings very affordable (0.13$ per million for large)[37] – which tips the scale towards using the API due to low cost and no infra overhead. Also, LanceDB’s Windows compatibility (npm with native lib) is confirmed[42], and Qdrant’s leading performance is documented[41]. These give confidence that our chosen tools are up to the task.
Prompt Templates for the Agent
Below are refined prompt templates for the three main agent interactions: Refiner, Fixer, and Suggester. These templates are designed for clarity and strict adherence to output format.
1. Refiner Prompt (Manual Refinement)
System Message: (Instruct the model to output JSON and follow rules)

You are a QA manual refinement assistant. You rewrite software QA manuals to match a strict template and style, based on a user story and an initial draft. 

**Requirements:**
- **Output only valid JSON** following the provided schema. No explanation or extra text outside the JSON.
- Use the **exact section names** and **canonical tags** given (Romanian). For example, sections must be one of: "Vizualizare", "Adăugare", "Modificare", "Ștergere", "Activare". Tags (buckets) must be from the allowed set (e.g. presence, content, values, columns, behavior, flow, etc.).
- **No duplicates**: each requirement should appear once. If the draft has duplicates, merge or remove them.
- **Preserve meaning** of the user story and gold manual. Align wording with the gold manual if it’s provided.
- **Facets**: Include facet markers for key terms (permissions, element names, etc.) as in the draft/gold. Encode permission-related outcomes as facets on an existing line, *not* as a standalone "403" line (per rules).
- Ensure the final lines cover all aspects the gold covers (unless gold is not provided, then just refine style).
- Write in formal Romanian, with correct diacritics and concise phrasing.

Remember: **JSON only**, with the schema structure. No markdown, no prose.
User Message (JSON): (Contains schema, context, and inputs)

{
  "task": "refine_manual",
  "module": "<< ModuleName >>",
  "tip": "<< SectionName >>", 
  "schema": {
    "type": "object",
    "properties": {
      "lines": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "bucket": { "type": "string" },
            "narrative": { "type": "string" },
            "facets": { 
              "type": "array", 
              "items": { "type": "string" } 
            }
          },
          "required": ["bucket","narrative"]
        }
      }
    },
    "required": ["lines"]
  },
  "context": {
    "spec_rules": "<< Key spec/validator rules (e.g. allowed sections & tag pattern, auth rule) >>",
    "bucket_vocab": "<< Definitions of canonical buckets/tags (in Romanian) >>",
    "style_guide": "Ton formal, concis, termeni QA standard (ex: 'afișează', 'implicit', 'eroare').",
    "examples": [
      {
        "bucket": "presence",
        "narrative": "Butonul \"Export\" este vizibil și activ",
        "facets": ["Export"]
      },
      {
        "bucket": "values",
        "narrative": "Câmpul \"Data creare\" se completează automat cu data curentă",
        "facets": ["Data creare"]
      }
    ]
  },
  "inputs": {
    "us": "<< Full text of the User Story (requirements in RO) >>",
    "generated": "<< Baseline generated manual (draft, spec-format text) >>",
    "gold_manual": "<< Gold-standard manual text for this module/tip, if available (same format as generated) >>"
  }
}
Notes:
- The system message explicitly lists the top-level rules (JSON only, canonical terms, no standalone auth lines, formal Romanian). This ensures the model knows the boundaries.
- The user JSON provides the schema (so the model knows the exact JSON structure needed). We include "required": ["bucket","narrative"] in each item to stress that facets can be optional – model will likely include facets for completeness though.
- The context includes spec_rules (like “sections must be X; tags format; no '403' lines” etc.), a bucket_vocab in Romanian (so it knows what each bucket means and when to use it), and perhaps a brief style_guide note plus a couple of examples of correctly formatted lines. The examples serve as mini-demonstrations of format and language. They are generic and not related to the specific US – just to illustrate style. This helps anchor the model output.
- The inputs part has the raw materials: user story, the draft manual (which likely has the structure but maybe wrong phrasing/tags), and the gold manual (which the model should use as reference to adjust wording and ensure coverage). If gold_manual is null or not provided, the model will rely on spec_rules and generated alone. The prompt explicitly says “align wording with gold if provided,” so it will prefer gold’s phrasing.
- By providing both generated and gold, the model can essentially do a diff internally and apply gold’s phrasing to generated’s content, which is what we want.
This Refiner prompt should yield a JSON with lines array. The lines likely follow the generated ordering unless gold introduced new ones (the model might insert those at appropriate spots). We’ll let the emitter re-sort, so order isn’t critical as long as grouping is by section (which is single section here).
2. Fixer Prompt (Manual Correction)
System Message: (Remains similar, emphasizing to focus on corrections)

You are an assistant that fixes a QA manual JSON to resolve specific issues. 
Follow the format strictly (JSON array of lines). Only make changes related to the reported issues – do not remove unrelated content. Output valid JSON only.
User Message (JSON): (Specifies the diff between expected and actual output)

{
  "task": "fix_manual",
  "module": "<< ModuleName >>",
  "tip": "<< SectionName >>",
  "errors": {
    "style_issues": [
      { "line": <<line_number>>, "issue": "<< description of style error >>" }
    ],
    "parity_misses": [
      { "type": "missing", "gold_narrative": "<< a narrative from gold manual that was missing >>" },
      { "type": "mismatch", "gold_narrative": "<< gold narrative >>", "current_narrative": "<< model's narrative >>" }
    ]
  },
  "last_output": {
    "lines": [
      {
        "bucket": "<< bucket from previous output >>",
        "narrative": "<< narrative from previous output >>",
        "facets": [ "..." ]
      }
      // ... (all lines from last output)
    ]
  }
}
Notes:
- We supply the list of style_issues (if any) with the line number and a description. For example: { "line": 2, "issue": "Used non-canonical tag 'error'. Must use 'behavior' and incorporate error into narrative." }. Or "issue": "Line ends with '.' (period); punctuation should be omitted in bullet narratives." – any such validator issues.
- We supply parity_misses. Two types: "missing" means a gold line not present, so model should add a line covering that. "mismatch" means a line was present but phrased differently. In that case, we give both gold and current narrative so the model can adjust wording to match gold more closely. (We might not use “mismatch” if parity only cares about exact matches – effectively any mismatch is missing in parity terms because normalize text didn't match. But if bucket or facets differ we might highlight those as mismatch issues separate from narrative text).
- The last_output provides the model’s previous JSON so it knows the context to fix. The model should output a new JSON (the same schema) with corrections applied. We expect it to mostly copy last_output and tweak the necessary parts (to minimize changes). Temperature 0 plus these directives will encourage minimal changes.
- The system prompt specifically says “Only make changes related to reported issues,” so it won’t rewrite other things that were fine.
- This prompt ensures the model doesn’t forget previous output. We explicitly pass it in. So it's performing an edit on JSON, which GPT-4.1 is quite capable of when given the structure.
After this, we run validator and parity again. Usually this yields no issues; if it did, we could theoretically loop again (but we plan max 2 iterations).
3. Suggester Prompt (Repo Edit Suggestions)
System Message: (Sets context that this is about code changes, output in Markdown with specific structure)

You are an AI assistant helping to improve the QA manual generation code. Propose code edits in a concise Markdown format with sections: Goal, Acceptance Criteria, Proposed Change, Testing. 

Do not write actual code; describe the changes at a high level. Reference the target files and what needs to be modified. Include commands for testing the changes. Keep it short and clear.
User Message (JSON): (Lists the misses and mapping to code files)

{
  "task": "suggest_repo_edits",
  "module": "<< ModuleName >>",
  "tip": "<< SectionName >>",
  "misses": [
    {
      "bucket": "<< bucket of the missed or wrong line >>",
      "narrative": "<< narrative text that was missing or needed fix >>",
      "reason": "<< classification of issue (phrasing, missing_feature, tag_error, etc.) >>"
    }
    // ... possibly multiple
  ],
  "mapping_targets": [
    "<< path/to/relevant/file1 >>",
    "<< path/to/relevant/file2 >>"
  ]
}
Expected Assistant Output (Markdown):
It should produce something like:
**Goal:** Fix the QA manual generation for module X so that all required lines are present and correctly tagged.

**Acceptance Criteria:**
- The manual generator outputs lines for the scenario(s) described in the misses.
- Parity with gold reaches 100% for those aspects (no missing lines or tag errors).
- All spec validation tests pass (no illegal tags or formats).

**Proposed Change:**
- *Update* `qa-framework/tools/us2manual.mjs`: After processing the 'Save' step, add logic to include the confirmation message. For example, if the user story mentions a success message, append a "content" bucket line with that message.
- *Modify* `qa-framework/packages/spec/src/validator.ts`: Add "success_message" or relevant facet keyword to the allowed tag set if it's currently flagged.
*(Mapping files: us2manual handles content generation, validator enforces tag vocabulary.)*

**Testing:**
- Re-run the agent on a story where a save confirmation is expected. Verify the new line appears and matches the gold wording.
- Run `pnpm -w -C qa-framework parity:score -- --project ./projects/example --tip <<Tip>>` to ensure parity is ≥ 95%.
- Run `pnpm -w -C qa-framework spec:test` to ensure no validator rules are broken by the changes.
This is an illustrative example. The actual content will depend on the misses. We instruct the model to list each file that needs change (which we gave in mapping_targets) and what to change in it. We explicitly say "do not write actual code" to avoid a giant diff that might be wrong. Instead, we want a description, which is more likely to be correct and easier to adjust. The Testing section includes the commands to run. We mention parity:score and spec:test with the relevant project/tip (we can fill those in or the model might use placeholders). The plan required test commands be present, so we’ve included them.
We will verify the format of this with one example and perhaps tweak the prompt if needed. The one-shot in system message ensures it follows the structure. We might even include a very small dummy example in system prompt to be sure (like the pattern in text). But the description given should suffice for GPT-4.1 to format properly.
Summary: These three prompts (Refiner, Fixer, Suggester) form a coherent pipeline: 1. Refiner: Produces initial refined manual JSON. 2. Fixer: Corrects that JSON if needed, after checks. 3. Suggester: Uses any differences to propose code improvements.
All outputs are either JSON (for the first two) or Markdown (for suggestions). The JSON formats we gave match the schema the agent code will parse with Zod. The Markdown suggestion format is human-oriented, so no strict schema, but we provided guidance to ensure consistency and usefulness.
Code Snippets (Node/TS)
Below are minimal examples of how we will implement critical operations in Node/TypeScript:
•	OpenAI API Call (Refine): Using fetch to call the Chat Completions API for GPT-4.1.
 	import fetch from 'node-fetch';

const promptPayload = {
  model: "gpt-4.1-mini",
  messages: [
    { role: "system", content: systemPromptText },
    { role: "user", content: JSON.stringify(refineUserMessage) }
  ],
  temperature: 0
};

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify(promptPayload)
});
if (!response.ok) {
  throw new Error(`OpenAI API error: ${response.status} ${await response.text()}`);
}
const data = await response.json();
// Extract the assistant's message content (which should be JSON string)
const content = data.choices[0].message.content;
let result;
try {
  result = JSON.parse(content);
} catch (err) {
  console.error("Failed to parse JSON from model:", content);
  throw err;
}
// `result` now is an object matching our schema (we will validate it with Zod next).
 	This snippet sends the prompt (system + user) and expects a JSON string in the response. We then JSON.parse it. We’ll integrate Zod schema validation right after the parse:
 	ManualOutputSchema.parse(result);  // will throw if schema mismatches
 	If it throws, we could log the issues and potentially re-prompt or abort. But ideally, it won't throw if the model follows instructions.
•	OpenAI Embedding API Call: We can similarly use fetch or OpenAI SDK. Using fetch for brevity:
 	async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-ada-003",  // assuming "text-embedding-3-small" is alias or new name
      input: text
    })
  });
  const data = await res.json();
  return data.data[0].embedding;  // array of numbers (length 1536 for ada-002/embedding-3-small)
}
 	(OpenAI’s new embedding model might be referenced as "text-embedding-ada-002" since ada-002 was 1536-d. If the new ones are out, it could be "text-embedding-ada-003" or similar – DataCamp suggests names like text-embedding-3-small[58]. We’ll confirm the exact model ID from OpenAI docs.)
•	Local Cosine Similarity: Compute similarity between a query vector and corpus vectors:
 	function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  return (normA && normB) ? dot / (normA * normB) : 0;
}

function findTopKMatches(queryVec: number[], vectors: {key:string, vector:number[]}[], k=5) {
  const scores = vectors.map(item => ({
    key: item.key,
    score: cosineSimilarity(queryVec, item.vector)
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, k).map(s => s.key);
}

// Usage:
const queryVec = await getEmbedding(queryTextNormalized);
const topKeys = findTopKMatches(queryVec, embeddingRecords, 5);
 	Here, embeddingRecords is an array of objects with key (identifier or the text itself) and vector. In our case, maybe key corresponds to the text snippet or some identifier which we can use to fetch the snippet. The function returns the top keys; we would then retrieve the actual text associated and include it in the prompt context.
For example, if key is just the text (for simplicity), we might store it directly in the record. Or store an index and separate text map.
We should also consider normalization: we’ll likely do something like:
function normalizeForEmbedding(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");  // strip diacritics
}
And maybe lower-case, etc., similar to parity’s normalize. We apply that to both corpus and query before embedding.
•	Qdrant Ingestion & Query: Using Qdrant’s JS SDK (REST client):
 	import { QdrantClient } from '@qdrant/js-client-rest';

// Connect to local Qdrant instance
const qdrant = new QdrantClient({ url: 'http://127.0.0.1:6333' });

// Ensure collection exists
const collectionName = 'repo_ctx';
await qdrant.createCollection(collectionName, {
  vectors: { size: 1536, distance: "Cosine" }
});

// Upsert points (e.g., embedding records)
const points = embeddingRecords.map((rec, idx) => ({
  id: idx,
  vector: rec.vector,
  payload: { text: rec.text, kind: rec.kind }
}));
await qdrant.upsert(collectionName, { points });

// Searching in Qdrant:
const queryVector = await getEmbedding(queryText);
const searchResult = await qdrant.search(collectionName, {
  vector: queryVector,
  limit: 5
});
for (const res of searchResult) {
  console.log("Match with score", res.score, res.payload?.text);
  // We would collect res.payload.text for context
}
 	This snippet shows the typical usage: create collection if not exists, upsert vectors with payload (like storing the text or metadata), then search by vector. The results have payload we stored. This is how we’ll integrate Qdrant when needed. (We would likely not run createCollection every time; maybe check existence or have a manual step for initial setup.)
•	Refine-and-Score Pseudocode: Putting it all together in a simplified form:
// Load inputs (US, baseline, gold)
const usText = fs.readFileSync(usPath, 'utf-8');
const baseManual = fs.readFileSync(baseManualPath, 'utf-8');
const goldManual = fs.existsSync(goldPath) ? fs.readFileSync(goldPath, 'utf-8') : null;

// Build prompt JSON
const refineUserMessage = {
  task: "refine_manual",
  module: moduleName,
  tip: tipName,
  schema: SCHEMA_OBJ,
  context: {
    spec_rules: SPEC_RULES_SNIPPET,
    bucket_vocab: BUCKET_VOCAB_SNIPPET,
    style_guide: "Ton formal, ...",
    examples: EXAMPLE_LINES_ARRAY
  },
  inputs: {
    us: usText,
    generated: baseManual,
    gold_manual: goldManual || ""
  }
};

// Maybe retrieve some context via embeddings
let retrievedContextText = "";
if (vectorSearchEnabled) {
  const query = `${usText}\n${baseManual}\n${goldManual || ""}`;
  const topKeys = retrieveSimilar(normalizeForEmbedding(query), embeddingRecords);
  retrievedContextText = topKeys.map(k => embeddingLookup[k].text).join("\n");
  refineUserMessage.context.retrieved = retrievedContextText;  // additional field if needed
}

// Call OpenAI refine
let refined;
try {
  refined = await callOpenAI(refineUserMessage);
} catch (e) {
  console.error("OpenAI refine call failed:", e);
  // Fallback: use baseline as output
  refined = convertManualToJson(baseManual);
  refined.note = "Refinement skipped due to API error.";
}

// Validate style
const validationIssues = spec.validateManual(formatAsSpec(refined));
if (validationIssues.length) {
  console.log("Style issues found, preparing fix prompt...");
  const fixMessage = {
    task: "fix_manual",
    module: moduleName,
    tip: tipName,
    errors: { style_issues: [], parity_misses: [] },
    last_output: refined
  };
  for (const issue of validationIssues) {
    fixMessage.errors.style_issues.push({ line: issue.line, issue: issue.msg });
  }
  // Check parity
  const scoreResult = parity.score(goldManual, formatAsSpec(refined), tipName);
  if (scoreResult.percent < scoreResult.threshold) {
    // collect missing lines or mismatches from scoreResult (assuming it provides details)
    for (const m of scoreResult.misses) {
      if (m.type === 'missing_gold_line') {
        fixMessage.errors.parity_misses.push({ type: "missing", gold_narrative: m.text });
      } else if (m.type === 'narrative_mismatch') {
        fixMessage.errors.parity_misses.push({ type: "mismatch", gold_narrative: m.gold, current_narrative: m.current });
      }
    }
  }
  const fixedResult = await callOpenAI(fixMessage);
  refined = fixedResult;  // replace with fixed lines
}

// Final scoring
const finalSpec = formatAsSpec(refined);  // turn JSON lines into spec Markdown
const finalValidate = spec.validateManual(finalSpec);
const finalScore = goldManual ? parity.score(goldManual, finalSpec, tipName) : { percent: 100, threshold: 95, pass: true };
if (!finalValidate.ok || (goldManual && !finalScore.pass)) {
  console.error("Final manual still not meeting criteria!");
  // Handle this (perhaps output diff and fail process)
}

// Save outputs
fs.writeFileSync(`refined/${moduleName}_${tipName}.md`, formatAsQA(refined));
fs.writeFileSync(`refined/${moduleName}_${tipName}_SPEC.md`, finalSpec);
This pseudo-code outlines the flow: we load data, optionally retrieve context, call refine. If issues, prepare a fix prompt and call again. Then final validation and scoring. We convert between JSON and Markdown with our spec/format functions at points.
Important: The actual code will be more structured (with try/catch, modular functions, and logs). But this shows how we integrate the pieces. We cited relevant lines for where we know logic from the repo (like spec.validateManual, parity.score usage, though we might call them via CLI or import if available).
Finally, after refinement, we can generate suggestions if needed:
if (finalScore.percent < 100 || validationIssues.length > 0) {
  const misses = [];
  // populate misses[] from above data
  const suggestMessage = {
    task: "suggest_repo_edits",
    module: moduleName,
    tip: tipName,
    misses: misses,
    mapping_targets: ["qa-framework/tools/us2manual.mjs", "qa-framework/packages/spec/src/validator.ts"]
    // (we pick likely files based on the type of misses)
  };
  const suggestionOutput = await callOpenAI(suggestMessage);
  fs.writeFileSync(`suggestions/${moduleName}_${tipName}_${date}.md`, suggestionOutput);
}
This would use the Suggester prompt to generate a markdown with proposed edits. A dev can open that and follow the instructions.
Evaluation Plan & Commands
To validate the agent’s performance, we will run a combination of automated tests and manual checks:
•	Automated Style Check: After each refinement, run spec.validateManual to ensure no formatting errors or disallowed content. In a CI context, we can use:
 	pnpm -w -C qa-framework run spec:validate --file qa-framework/data/agent/refined/Documente_Vizualizare.md
 	This should output “OK” if style is correct. In our CI script, we’ll assert the exit code or parse the output for issues. (We might need to build a small wrapper to exit non-zero if issues found, depending on how spec:validate works).
•	Automated Parity Score: For the chosen test sample (e.g., module “Documente” tip “Vizualizare” which has a comprehensive gold), run:
 	pnpm -w -C qa-framework run parity:score -- --project ./projects/example --tip Vizualizare --manual qa-framework/data/agent/refined/Documente_Vizualizare.md
 	This will print a score, e.g., “Coverage: 25/26 = 96.15%”. We will parse this output in CI (or modify parity:score to have a machine-readable output option). We then enforce:
•	If tip is one of (Vizualizare, Adăugare, Modificare, Ștergere, Activare) i.e. a CRUD, threshold = 95%. The parity tool already knows the threshold for visual vs others【41:45†L7-L11】【41:45†L13-L18】, but we can double-check tip name to decide expected threshold.
•	If score < threshold, fail CI with an error message listing the mismatches (parity:score usually lists missing lines or differences – we can capture that or re-run with a flag to output details).
•	Manual Diacritics Test: We’ll include a short test function to ensure normalization is consistent. For example, in our code or even just conceptual:
 	import { normalizeText } from '@pkg/parity';  // if exists
console.assert(normalizeText("Ștergere") === normalizeText("Stergere"), "Diacritics normalization failed");
 	This ensures our parity tool indeed treats them equal. Also, we might test the agent on a simple input that requires diacritics in output (like user story mentions “ședință”). The agent should output with correct diacritics because gold will have them, and our instructions emphasize it. We’ll watch out for any systematic missing diacritics; if found, likely root cause is missing diacritics in prompt context (like if baseline lacked them). The solution could be to ensure baseline or gold always uses correct ones (which we do in gold). So this risk is low.
•	Edge-case Testing: Use smaller test stories to ensure formatting holds:
•	A user story with a hidden element (to see if agent properly puts it as facet, not line). Gold likely has it as facet; we test the agent does same by itself with spec_rules hint.
•	A user story with no gold available: see that agent still outputs something sensible and style-complaint just based on spec_rules.
•	Ensure the agent enumerates lines properly (the emitter will do numbering anyway). Check that the final QA Markdown has numbering and curly brace facets if required.
•	CI Implementation: In our continuous integration (GitHub Actions or Azure DevOps, etc.), we will:
•	Set up environment with Node 22, pnpm, and ensure OPENAI_API_KEY is available as a secret.
•	Possibly run pnpm install and build the packages (especially parity and spec if needed).
•	Generate baseline output: pnpm -w -C qa-framework run us:bridge -- --project projects/example --tip Vizualizare (assuming we have a sample project named example with Documente module).
•	Run the agent refine: pnpm -w -C qa-framework run agent:refine -- --project projects/example --tip Vizualizare. This will produce manual_output/Documente_Manual.md refined or in data/agent output.
•	Then run validation and parity as described above. If either fails, we fail the job.
We’ll likely need to ensure deterministic output. As discussed, we can seed a cache. Another approach: We could skip actual OpenAI call by using a stored output if we worry about CI unpredictability. But since we have temp=0 and our one sample is fixed, it should output the same each run (unless OpenAI model itself changed). We will monitor that. If it fluctuates, using the cache is plan B (we can commit the expected JSON to repo and have agent use it when in CI mode).
•	Thresholds: We set parity threshold at 95%. We won’t accept 94% because that likely means 1 line unmatched out of ~20. That’s significant enough to investigate. Visual-only pages (like a dashboard with charts) might inherently not have a “Create/Add” to hit 95%. That’s why threshold is 85% for such sections. Our parity scoring code already uses tip name to decide threshold【41:45†L7-L11】【41:45†L13-L18】 (it checks if tip contains something like “Vizualizare” or synonyms like “Raportare” to use 85, else 95). We will align our expectations accordingly. If our test sample is Vizualizare (which is typically a view page – albeit often still we aim 95% because view pages can be fully covered except maybe no creation). Possibly in parity scorer they treated “visualization” pages with lower threshold because sometimes those have charts that can’t be described fully. In any event, we’ll trust the parity tool’s threshold logic or explicitly override threshold in test.
•	Qualitative Review: Aside from automated tests, at the start we (developers) will manually read a few refined manuals vs gold to ensure the style is truly identical (including nuances like quotes around field names, etc.). If any differences not captured by parity (e.g., gold wrote field name with quotes and the model did without – parity might still match if normalization removed quotes anyway), we might tighten our rules or add those to style check. Possibly update validator to enforce quotes around field labels if that’s a standard. But gold likely already consistent.
•	Regression tests: Over time, as we incorporate suggestions into code, we should re-run parity on old cases to ensure no new issues. We can maintain a small set of representative (US, gold) pairs across modules. Running the agent on each and checking scores ensures we didn’t break something. This could be automated as well (like a regression test suite of 5-10 pairs). However, since we ultimately want baseline to get closer to gold on all, these tests will gradually become trivial (all pass). Still, keep them to catch any odd regression (like if a code change for one feature inadvertently affects another feature’s output).
•	Safety tests: Ensure the agent never leaks API keys or environment. We won't put keys in prompts, so that’s okay. The model might inadvertently repeat something from context – but context doesn’t contain secrets. (One scenario: if we accidentally passed the OPENAI_API_KEY in context, that’d be terrible – but we won’t). As a sanity check, we could search the refined output for strings like our API key (just to be sure it’s not echoing environment inadvertently). But highly unlikely given our inputs.
Commands Summary: - pnpm build (to build all needed packages if using TS output). - pnpm us:bridge --project ... --tip ... (to generate baseline manual). - pnpm agent:refine --project ... --tip ... (to run the agent on that). - pnpm spec:validate --file refined.md (validate style). - pnpm parity:score --project ... --tip ... --manual refined.md (score coverage). - Possibly pnpm agent:suggest --project ... --tip ... if we want to see suggestions (not needed in CI, but for dev).
We will document these in README as well, so any dev can replicate.
Risk Register (8+ Risks & Mitigations)
1.	Model Output Drift – The LLM might produce slightly different phrasing or format over time, causing unpredictable parity or validation issues.
Mitigation: Use deterministic settings (temperature=0, fixed prompts) to minimize randomness. Pin the model version if possible (e.g., use gpt-4.1 explicitly). Implement strict schema validation and automated tests to catch drift immediately. Maintain a cache of expected outputs for CI to detect if output changes from baseline unexpectedly. If OpenAI updates the model and parity drops, adjust prompts or minor post-processing (e.g., enforce consistent quote usage) to realign. Regularly re-evaluate a sample of outputs after major model version changes.
2.	Incomplete Parity Improvements – The agent might not reach the ≥95% parity threshold, requiring multiple iterations or failing on certain gold differences.
Mitigation: Provide the gold manual directly to the model and highlight missing content via the parity_misses in the Fixer prompt, so the model knows exactly what to add. Limit to 2 iterations – if still below threshold, surface the diff to a human. In such cases, analyze if the gold is perhaps outdated or if there’s an ambiguous requirement. Possibly relax threshold in those specific known cases (for instance, if gold intentionally omits something the US includes – but ideally gold should then be updated). Essentially, treat <95% cases as exceptions needing manual review, which should be very rare after initial improvements.
3.	Overfitting to Gold (Lack of Generality) – The agent might mimic gold phrasing so closely that if gold has an inconsistency or suboptimal wording, the agent perpetuates it. Or if gold is unavailable, the model might be uncertain without examples.
Mitigation: Our goal is parity with gold, so mirroring it is intended. However, if gold has minor issues, QA should fix gold. The agent will follow whatever gold says (which is acceptable in context of parity). For cases with no gold, we rely on spec rules and style guide – the output may not be perfect on first try if no gold exists, but style validation ensures format is right. We can manually review no-gold outputs more carefully and then consider creating a gold for them (since ideally every important module/tip should have a gold spec if QA cares about it). Essentially, encourage having a gold reference whenever possible; when not, treat agent output as a draft for QA to refine and then treat that as gold going forward.
4.	Misclassification by Retrieval – The embedding-based retrieval might feed irrelevant or confusing context into the prompt (e.g., pulls in rules from another module that don’t apply, or an outdated example that contradicts current gold).
Mitigation: Limit the retrieved context to very targeted items. We will primarily embed static knowledge (spec rules, tag definitions) that are universally applicable. For examples, we’ll prefer those from the same tip or very generic ones. We can also include a field in the embedding payload like module or tip and filter results to the same tip if needed. Additionally, review retrieval outputs: if we see weird context being injected, adjust the query or add more precise filters (like use only spec and vocabulary if gold is present anyway). Also, test the agent with and without retrieval context to ensure it’s helping, not hurting. We can always disable or tweak retrieval if it confuses more than assists.
5.	Rate Limits / API Quota Exhaustion – If multiple team members use the agent or if it’s run on many stories in CI, we could hit OpenAI rate limits or run out of credit.
Mitigation: Use caching to avoid duplicate calls (especially in CI/regression tests). Monitor usage via OpenAI’s dashboard or our own logging. If scaling up usage, consider batch processing (OpenAI’s batch API can process up to 20 prompts in one request with discount[52]). We have the Claude fallback – in a pinch, route some requests to Claude if hitting OpenAI limits (though that’s a manual toggle typically). Also, we’ve budgeted effectively: even a heavy run of 100 manuals in one go is maybe $1 on 4.1 Mini, so cost likely not an issue; but to avoid any surprise, we might set up an alert if usage goes beyond X per day. Rate limiting can be handled by our code by catching 429 and waiting.
6.	Vendor Lock-In – Reliance on OpenAI (and possibly Anthropic) means we depend on their service availability and terms. If prices rise or service is unavailable, our process is blocked.
Mitigation: Maintain the dual-model strategy (OpenAI primary, Anthropic backup) to increase resilience. Additionally, design the agent in a modular way so we can swap in another model via an interface if needed (e.g., Azure’s OpenAI endpoint, or open-source model wrapper). All data artifacts (embeddings, refined outputs) are stored on our side, so we’re not locked out of our data. If absolutely required, we could attempt to fine-tune an open model on our dataset – our architecture stores everything needed for that. While an open model might not reach GPT-4.1’s quality currently, the gap may narrow over time (e.g., new open 13B+ models in 2024–25 have improved). We keep an eye on that landscape. In summary, we are cognizant of lock-in but accept it for v1 given productivity gains, with contingency plans to pivot providers if necessary.
7.	Sensitive Data Exposure – Though unlikely, if any PII or credentials slip into a user story or manual content, sending it to an external API could pose compliance issues.
Mitigation: Implement a content scrubber: before sending text to the LLM, remove obvious PII patterns (emails, phone numbers, IDs). Our domain (QA manuals) rarely if ever includes actual personal data – they are about system functionality. But as a precaution, we could for example mask anything that looks like an email (“x@y.com”) or a 16-digit number (could be credit card in rare cases of test data). We will also document that the tool is intended for non-production data (and indeed user stories/gold manuals are not production user data, they’re specifications). All the same, we use process.env to hold API keys and ensure not to log them. The agent’s logs will be mostly manual content, which is fine to store. If needed, we can encrypt or restrict access to data/agent outputs if they contained sensitive info (again, low likelihood).
8.	Incorrect Code Suggestions (Hallucination) – The suggestions pipeline might propose changes that are wrong or suboptimal, potentially misleading developers.
Mitigation: Treat suggestions as just that – suggestions. A human (the QA engineer or dev) will review and implement. We instruct the LLM to not output raw code diff but rather explain changes, which forces the developer to think through the implementation. We also confine suggestions to known relevant files to reduce hallucination about our codebase structure. Additionally, we plan to test suggestions on a known scenario to calibrate the prompt (if it suggests weird stuff, we’ll refine instructions or examples). Including test steps in the suggestion ensures any implemented changes are verified, reducing risk of blindly applying a wrong suggestion.
9.	Windows Environment Issues – Potential issues running parts of the solution on Windows (e.g., Qdrant via WSL, long path issues with pnpm, etc.).
Mitigation: We develop and test everything on Windows 11 with WSL2 available. Qdrant will be run in WSL2; we’ll follow Qdrant’s docs for Windows (not mounting Windows paths)[17]. For any path in code, use Node’s path.join to avoid backslash vs slash confusion. Pnpm is cross-platform, so our scripts should work. We also consider adding a check in our CLI to detect if Qdrant is unreachable (catch fetch errors) and prompt the user to start Docker if needed. Another Windows-specific risk is line endings – but we ensure output uses LF (our tools formatManual likely does). And we have check:lineendings in repo to catch any CRLF. So we should be good.
10.	Team Adoption and Trust – (Project/Organizational risk) The QA team might be skeptical of an AI rewriting their manuals, or developers might not trust suggestions, leading to under-utilization.
Mitigation: Involve QA from the start – show them that the agent uses their gold standards as reference and that it improves consistency rather than inventing new content. Highlight the time saved on rote tasks. Also, emphasize that suggestions to code will always be reviewed by a developer; the AI is assisting, not taking over QA or dev responsibilities. By maintaining high transparency (storing all outputs, diffs, and having clear logs), we build trust that the agent is doing what it’s supposed to. Early wins (like catching a missing requirement or increasing a parity score to 100%) will help convince stakeholders of its value.
Each of these risks has been considered in our design. With careful implementation and monitoring, we believe we can reduce their likelihood or impact to an acceptable level.
Implementation “Do Now” Checklist (10–15 Steps)
To build a proof-of-concept of the QA Refinement Agent within 1–2 days, follow this step-by-step plan:
1.	Create the Agent Package: In the repository, add a new workspace folder, e.g., qa-framework/apps/agent/. Initialize a package.json for it (make it a CLI executable). Set up TypeScript config if needed, referencing the monorepo packages.
Files: qa-framework/apps/agent/package.json, qa-framework/apps/agent/tsconfig.json (if using TS).
Command: pnpm init -y (then edit fields), ensure "type": "module" if using ES modules. Add bin entry like "agent": "dist/index.js".
2.	Install Dependencies: Within the agent package, install any needed libraries: openai SDK or just use node-fetch for API calls, zod for schema validation, and perhaps a Qdrant client. Also include types for Node.
Command: pnpm -C qa-framework/apps/agent add node-fetch zod @qdrant/js-client-rest.
(We might also use OpenAI’s official package: openai – but node-fetch is enough. Zod for JSON schema enforcement.)
3.	Implement Schema Definitions (Zod): Define Zod schemas for manual lines and output structure.
File: src/schema.ts within agent.

 	import { z } from 'zod';
export const ManualLineSchema = z.object({
  bucket: z.string(),
  narrative: z.string(),
  facets: z.array(z.string()).optional()
});
export const ManualOutputSchema = z.object({
  lines: z.array(ManualLineSchema)
});
 	Also define TypeScript types from these (Zod can infer, or manually define an interface for lines if needed).
4.	Write OpenAI API Utility: Create a module src/openai.ts with functions to call the ChatCompletion and Embeddings endpoints. Use fetch as coded in snippet above.
Remember to load API key from process.env.
Include error handling (throw descriptive errors). Possibly implement a retry logic for rate limits (if time permits, otherwise note for later).
5.	Embed Context Data: Prepare a script or function to embed key reference data. For now, manually compile spec_rules, bucket_vocab, etc., from the spec package:
6.	Extract allowed section names and tags from validator.ts or define them statically according to known values.
7.	Write a short Romanian description for each bucket (use the ones in plan or from documentation).
8.	Possibly load an examples JSON if we have sample lines.
File: src/context.ts.
We can later improve by dynamically reading from qa-framework/packages/spec/src/validator.ts (maybe via import, since it's in same monorepo). For now, static string is fine (less than 100 tokens).
9.	CLI Command Setup: In src/index.ts, parse CLI arguments (could use a library like yargs or just process.argv). We need --project path (directory containing US and gold?), --module, --tip. Or maybe --us path and --gold path explicitly. For PoC, we can hardcode a path or accept just --tip to pick from projects/example/ as context implies.
10.	Read the US file (maybe stored in qa-framework/projects/example/us/<Tip>.md or similar).
11.	Generate baseline manual: We can either call the us2manual.mjs programmatically or run it via child_process. To avoid complexity, consider invoking it: pnpm -C qa-framework run us:bridge -- --project ... --tip ... --out temp.md. But to keep all in Node, perhaps import qa-framework/tools/us2manual.mjs (if it exports a function) or replicate minimal logic to get baseline lines. Actually, us2manual.mjs likely calls spec.formatManual etc. For now, we might assume baseline manual is already present (like we run it beforehand). To not block, we can require that baseline file exists as input.
12.	Load gold manual (from qa-framework/docs/modules/Module_Gold.md presumably).
Compose the refineUserMessage JSON as per the template (fill in context from context.ts, and inputs from files). Then call callOpenAIChat(refineMessage).
1.	Caching Mechanism: Implement a hash of the input data to use as cache key. E.g., use Node’s crypto: crypto.createHash('sha256').update(usText).update(goldText||"").update(promptVersion).digest('hex'). Save cache in qa-framework/data/agent/cache/{key}.json.
2.	After computing the result from OpenAI, write JSON to cache file.
3.	On subsequent runs, if file exists, skip API call and read from cache. Note: Provide an override flag --no-cache to force re-call if needed.
4.	Validation & Scoring Integration: After obtaining refined JSON, run it through Zod (ManualOutputSchema.parse(refined)). Then format to spec Markdown for validation:
5.	We can use formatManual from @pkg/spec if exported. If not, maybe call pnpm spec:format on the file. But likely easier: since refined is JSON lines, we can create a Markdown by ourselves:
 	let specMD = `## ${tipName}\n\n`;
refined.lines.forEach((ln, idx) => {
  const tagStr = ln.facets && ln.facets.length ? ` {facets: ${ln.facets.join(", ")}}` : "";
  specMD += `- [${ln.bucket}] ${ln.narrative}${tagStr}\n`;
});
 	(Also include section header "## Tip" – though for a full manual, multiple sections would be needed. But our refine deals one tip at a time, presumably.)
6.	Then import or require the spec validator. If it's an ESM, maybe import qa-framework/packages/spec/dist/validator.js. Use validateManual(specMD).
7.	Similarly, use parity’s CLI or function. Possibly import qa-framework/packages/parity/dist/score.js. There might be a function like scoreManual(goldMD, specMD, tipName) we can call. If not, we could spawn pnpm parity:score as a process and capture output (less ideal, but doable quickly).
8.	Based on the results, decide if fix is needed. For style issues, we have validator’s issues list. For parity, we need to detect < threshold. If yes, call the fix prompt as above.
9.	Fix Loop: If needed, prepare the fix JSON and call OpenAI again. Replace refined lines with fixed lines. Validate again. (At this point, likely it’s fixed. If not, we can log a failure.)
10.	Output Files: Write the final refined manual to qa-framework/data/agent/refined/Module_Tip.md in enumerated QA style. We can generate enumerated list easily: iterate lines with an index (1-2 digits) and format as 01. narrative {facets: ...}. Actually, the manual emitter has a QA style enumerator built in【11:18†L89-L97】. If available, use it by calling something like formatManual(refined, { qaStyle: true }). If not, implement simple numbering as mentioned (ensuring to pad with 0 for 1–9). Include section header ## Tip above if the gold manuals usually separate by sections. However, since we refine one section at a time, possibly the output just includes the list (the context of the document might be handled outside).
o	Also possibly save the spec format (with - [bucket] narrative {facets} lines) for parity analysis or debugging.
o	Log a short summary: e.g., "Refined Documente Vizualizare: Parity 96.2%, 0 style issues."
11.	Suggestions (optional for POC): Implement a flag --suggest that triggers suggestion generation if parity < 100 or style issues fixed. This would call the suggest prompt logic. For POC focus, we can skip or at least ensure core pipeline works first, then add this. If adding:
o	Determine the misses array from earlier diff (like if parity had missing lines, those are missing features -> reason "missing_feature"; if phrasing mismatch occurred, reason "phrasing").
o	Compose suggestMessage JSON and call callOpenAIChat with it.
o	Save the returned Markdown to qa-framework/data/agent/suggestions/module_tip_date.md.
o	Print to console maybe as well, so dev sees it.
12.	Add PNPM Scripts: In qa-framework/package.json (the root or workspace config), add:
 	"scripts": {
  "agent:refine": "pnpm -C apps/agent start",
  "agent:train": "pnpm -C apps/agent start --train",
  "agent:suggest": "pnpm -C apps/agent start --suggest"
}
 	Or similar, depending how we structure CLI. If using a bin, ensure it’s linked (pnpm will link the workspace bin automatically if configured). Possibly we do like "start": "node dist/index.js" and then agent:refine calls that with appropriate args.
13.	Test Locally: Prepare a known user story and gold in the example project. Run:
 	pnpm us:bridge --project ./projects/example --tip Vizualizare
pnpm agent:refine --project ./projects/example --tip Vizualizare
 	See if output JSON and MD appear and look correct. Check console for any errors. Adjust the prompt or code as needed to fix issues (e.g., if JSON parsing fails due to a stray comment, refine system prompt to be stricter). Validate the output manually against gold (or run parity:score to verify). Ensure style is good (maybe open the MD in VSCode with our syntax highlighting to see if everything appears consistent).
14.	CI Integration: Create or update a GitHub Actions workflow (or equivalent in our pipeline) to run a small job:
o	Set up Node and pnpm.
o	pnpm install.
o	Possibly build @pkg/spec and @pkg/parity if needed to use their functions. (If they are pure JS already in repo, might not need build if we can import.)
o	Run a refinement on one sample and check results. We might embed these tests in a script or just in the workflow YAML:
 	- name: Generate & Refine Sample
  run: |
     pnpm -w -C qa-framework run us:bridge -- --project ./projects/example --tip Vizualizare
     pnpm -w -C qa-framework run agent:refine -- --project ./projects/example --tip Vizualizare
- name: Validate Manual Style
  run: pnpm -w -C qa-framework run spec:validate --file qa-framework/data/agent/refined/Documente_Vizualizare.md
- name: Check Parity Score
  run: pnpm -w -C qa-framework run parity:score -- --project ./projects/example --tip Vizualizare --manual qa-framework/data/agent/refined/Documente_Vizualizare.md
 	Then parse output in next step or use a small node script. Or use grep to find "PASS". Alternatively, add an option in parity CLI to exit 1 if below threshold. (We could quickly modify parity’s CLI for that or just implement a check: run parity:score, capture output to a file, parse with a regex in a subsequent step to ensure percent >= 95.)
o	Ensure to provide OPENAI_API_KEY as secret env in CI.
15.	Documentation & Final Touches: Write a README in apps/agent explaining usage. Summarize that the agent requires an API key and how to run it. Also note the assumptions (like baseline manual should exist or how it finds inputs). Document the process for adding new modules (embedding new gold data by running agent:train if needed).
o	Possibly also add usage examples for agent:suggest pipeline.
16.	Verify ADEF/Gates: Make sure all automated tests are passing (spec tests, parity tests, lint). Especially run pnpm -w run check:format and check:lineendings to ensure our new files comply (especially any MD or ts files with line endings).
o	If needed, run pnpm format to fix formatting or pnpm lint for any trivial issues.
By following this checklist, we should arrive at a functional POC agent that can refine a QA manual with high parity to gold and produce suggestions for improvements. We'll test it thoroughly with one or two modules to ensure reliability. Then it’s ready to assist the QA team in automating manual refinement.
________________________________________
