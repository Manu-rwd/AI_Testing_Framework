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


