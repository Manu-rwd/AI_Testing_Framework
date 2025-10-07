## Agent Implementation Plan (QA Manual Refiner — v1 Thin Agent)

### Purpose
Implement an internal agent (Node/TypeScript, pnpm workspace) that supervises and refines QA manuals to 100% style and ≥95% parity vs gold, learns from (US, generated, gold, refined) pairs, and proposes code improvements via ready-to-run Cursor prompts. This plan is optimized for Windows + pnpm and integrates with existing `@pkg/spec` (style validator/formatter), `@pkg/parity` (coverage scorer), and the US→Manual bridge.

### Inputs / Outputs
- Inputs
  - User Story (US) text: `US_input/<file>.txt`
  - Baseline manual (from bridge/emitter): `manual_output/<name>_Manual.md`
  - Optional gold QA manual (enumerated list): `manual_output/Qa team generated test cases.txt` (or module-specific gold)
- Outputs
  - Refined manual (spec view + QA enumerated): `qa-framework/data/agent/refined/<Module>_<Tip>.{spec.md, md}`
  - Audit JSON: `qa-framework/data/agent/jsonl/pairs/*.jsonl`
  - Embeddings JSONL (v1, optional): `qa-framework/data/agent/embeddings/*.jsonl`
  - Suggestions (Cursor prompt): `qa-framework/data/agent/suggestions/<module>_<tip>_<ts>.md`

### Architecture (v1 Thin Agent)
- Package: `qa-framework/apps/agent` (ESM)
- Commands
  - `agent:refine` — supervise→rewrite→score loop; writes refined manuals + audit
  - `agent:train` — ingest (US, generated, gold, refined) into JSONL; compute embeddings (optional)
  - `agent:suggest` — map parity misses to code edit prompts
  - `agent:watch` — optional; watch `US_input/` and run refine automatically
- Retrieval (v1)
  - In-memory cosine similarity over a small local JSONL corpus (spec rules snippets, vocabulary, recent high-scoring pairs)
  - Embeddings: `text-embedding-3-small` (later upgradable; keep normalization consistent)
- Determinism
  - For GPT‑5: omit temperature/top_p (API requires default); for fallback `gpt-4.1-mini`: use `temperature=0, top_p=1`
  - `response_format: json_object`; Zod schema validation; content-hash caching
  - Normalize diacritics for comparisons; pass final text through `@pkg/spec.formatManual({ stripProvenance: true })`
  - Iterate at most N=2 with Fixer prompt; stable sort and dedupe before emitting QA enumerations

### Acceptance
- Style: 100% (no issues by `@pkg/spec.validateManual`)
- Parity: ≥95% CRUD (≥85% visual-only) via `@pkg/parity.score`
- Deterministic outputs (same inputs → same refined manuals); no duplicates; stable ordering

---

## Step-by-Step Tasks (Cursor Agent Checklist)

1) Preconditions
   - Ensure Node ≥22 and pnpm are installed; Windows PowerShell compatible
   - Add `.env` (already supported):
     - `qa-framework/apps/agent/.env` with `OPENAI_API_KEY=...`, `AGENT_MODEL=gpt-5`, `EMBEDDINGS_MODEL=text-embedding-3-small`

2) Package structure and deps
   - Under `qa-framework/apps/agent/src/`, create:
     - `schema.ts` — Zod schemas for model outputs
     - `cache.ts` — content-hash JSON cache (SHA‑256 of inputs + prompt version)
     - `similarity.ts` — in-memory cosine + minimal embedding client
     - `refine.ts` — main refine loop (Refiner → format/validate → parity → Fixer ≤2 → emit QA)
     - `train.ts` — write JSONL corpora (pairs, embeddings)
     - `suggest.ts` — generate repo edit prompts from parity misses
     - `cli.ts` — yargs/commander entry (commands: refine, train, suggest, watch)
     - `util/env.ts` — load dotenv; resolve paths; diacritics normalization helpers
   - Reuse existing `src/lib/call.ts` and `src/scripts/check-model.ts` for OpenAI calls/probe

3) JSON Schemas (Zod)
   - `ManualLineSchema = { bucket: string; narrative: string; facets?: string[] }`
   - `ManualOutputSchema = { lines: ManualLine[] }`
   - `FixInputSchema = { last_output: ManualOutput; errors: { style_issues?: Issue[]; parity_misses?: Miss[] } }`
   - Validate all model outputs before formatting/scoring

4) Refine loop implementation (`refine.ts`)
   - Read arguments: `--us`, `--gen`, `--gold`, `--tip`, `--module`, `--outDir`, `--maxIters=2`, `--use-cache`
   - Build deterministic context pack: spec rules excerpt (sections, tag policy, auth rules), bucket vocabulary, and up to K=5 similar examples (if `train` artifacts exist)
   - Prepare Refiner prompt (system + user): JSON schema enforced; explicit constraints (canonical Romanian tags, no standalone auth outcomes)
   - Call LLM via `LlmCaller`:
     - Primary `gpt-5` (no temp/top_p); on failure fallback to `gpt-4.1-mini` (temp=0, top_p=1)
     - Use `response_format: json_object`
   - Parse + Zod-validate; format with `@pkg/spec.formatManual({ stripProvenance: true })`
   - Score with `@pkg/parity.score` against coverage YAML (or gold text parsed to spec lines)
   - If below threshold and iter < N: prepare Fixer prompt (diff + reason codes) and retry once
   - Emit QA enumerations (use emitter rules or deterministic numbering); write files to `data/agent/refined/`
   - Write audit JSON (inputs, model, usage, score)

5) Train pipeline (`train.ts`)
   - Ingest (US, generated, gold, refined) into JSONL under `data/agent/jsonl/`
   - Compute embeddings (optional v1) for spec rules/vocabulary and recent pairs; write to `data/agent/embeddings/*.jsonl`
   - Normalize diacritics before embedding to mirror scorer behavior

6) Suggestions pipeline (`suggest.ts`)
   - From parity report: classify misses (phrasing/order/missing-feature/tag-mismatch)
   - Map classes to candidate files: `qa-framework/tools/us2manual.mjs`, `@pkg/manual-emitter/src/emit.ts`, `@pkg/spec/src/validator.ts`
   - Produce a concise one‑shot Cursor prompt with Goal / Acceptance / Proposed Change / Testing (pnpm commands)

7) CLI wiring (`cli.ts`)
   - `refine` — args: `--us`, `--gen`, `--gold`, `--tip`, `--module`, `--maxIters`, `--outDir`, `--use-cache`
   - `train` — args: `--pairsDir`, `--embeddings`, `--update`
   - `suggest` — args: `--us`, `--gen`, `--refined`, `--tip`, `--module`, `--report`

8) Scripts
   - Add to `qa-framework/package.json`:
     - `agent:refine`: `pnpm --filter @apps/agent start:refine`
     - `agent:train`: `pnpm --filter @apps/agent start:train`
     - `agent:suggest`: `pnpm --filter @apps/agent start:suggest`
   - Keep existing `agent:probe` for quick environment checks

9) Evaluation (local + CI)
   - Local: run `agent:refine` on a fixed sample; validate via `@pkg/spec.validateManual` and `@pkg/parity.score`
   - CI (Windows): one deterministic sample with cache; fail if style invalid or parity below threshold

10) Safety & logging
   - No secrets in logs; redact PII; ensure LF endings; preserve Romanian diacritics in outputs (normalization only for comparisons)
   - Capture model, version, usage, and cache key in audit JSON

---

## Prompts (Sketches)

System (Refiner/Fixer shared)
```
You are an internal QA manual refiner. Output ONLY valid JSON per the provided schema. 
Use canonical Romanian QA vocabulary and tags; no duplicates; respect auth rules (no standalone outcomes). 
```

Refiner (User JSON)
```
{
  "task": "refine_manual",
  "module": "<Module>",
  "tip": "<Vizualizare|Adăugare|...>",
  "schema": { "type": "object", "properties": { "lines": { "type": "array", "items": { "type": "object", "properties": { "bucket": {"type": "string"}, "narrative": {"type": "string"}, "facets": {"type": "array", "items": {"type": "string"}} }, "required": ["bucket","narrative"] } } }, "required": ["lines"] },
  "context": { "spec_rules": "...", "bucket_vocab": "...", "examples": [ {"bucket":"presence","narrative":"..."} ] },
  "inputs": { "us": "...", "generated": "...", "gold_optional": "..." }
}
```

Fixer (User JSON)
```
{
  "task": "fix_manual",
  "tip": "<Tip>",
  "errors": { "style_issues": [ {"line": 3, "issue": "invalid tag"} ], "parity_misses": [ {"type": "missing", "gold_narrative": "..." } ] },
  "last_output": { "lines": [ {"bucket":"presence", "narrative":"..."} ] }
}
```

Suggester (User JSON → Markdown)
```
{
  "task": "suggest_repo_edits",
  "misses": [ {"bucket":"columns","narrative":"Coloana 'X' — valoare corecta ..."} ],
  "mapping_targets": ["qa-framework/tools/us2manual.mjs","qa-framework/packages/manual-emitter/src/emit.ts","qa-framework/packages/spec/src/validator.ts"]
}
```

---

## Data Layout (v1)
- `qa-framework/data/agent/jsonl/` — normalized JSONL for pairs; audit logs
- `qa-framework/data/agent/embeddings/` — optional embeddings JSONL
- `qa-framework/data/agent/refined/` — final refined manuals (`*_SPEC.md` + enumerated `*.md`)
- `qa-framework/data/agent/suggestions/` — Cursor prompts
- `qa-framework/data/agent/cache/` — hashed model outputs

---

## Commands (Developer Quickstart)
```bash
# Probe model
pnpm -C qa-framework run agent:probe

# Refine one US (example)
pnpm -C qa-framework run us:bridge -- --qa-style --no-provenance
pnpm -C qa-framework run agent:refine -- --us US_input/<file>.txt --gen manual_output/<gen>.md --gold manual_output/<gold>.txt --tip Vizualizare --module Documente --use-cache

# Train (optional)
pnpm -C qa-framework run agent:train -- --pairsDir qa-framework/data/agent/jsonl --embeddings

# Suggest repository edits based on parity misses
pnpm -C qa-framework run agent:suggest -- --us US_input/<file>.txt --gen manual_output/<gen>.md --refined qa-framework/data/agent/refined/<mod>_<tip>.md
```

---

## CI (Non‑flaky Gate)
- Workflow (Windows):
  1. Checkout; pnpm install
  2. `pnpm -C qa-framework run us:bridge` on fixed sample
  3. `pnpm -C qa-framework run agent:refine -- --use-cache` on same sample
  4. Validate style with `@pkg/spec`; run parity scorer (`@pkg/parity.score`)
  5. Fail if below thresholds

---

## Risks & Mitigations
- Model variability → Pin prompts; enforce JSON schema; cache outputs; fallback provider
- Romanian diacritics sensitivity → Normalize for comparisons; preserve in outputs
- Windows path/line endings → Use Node `path`; enforce LF via existing line-ending checks
- Cost spikes → Cache by content hash; short-context reruns; cap iterations

---

## Done Criteria
- `agent:refine` produces style‑clean manuals with parity ≥ threshold on the sample
- Repeatable runs (deterministic) with audit artifacts written
- Optional suggestions produced for misses with actionable prompts


