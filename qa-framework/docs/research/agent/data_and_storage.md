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

### Provenance & Retention
- Include `source`, `provenance`, `version`, `ts`, and file paths.
- Retain raw inputs and refined outputs for audit; rotate embeddings monthly; back up JSONL to versioned folder.

### PII/Scrubbing
- Redact emails, phone numbers, and IDs via regex before logging; never log payloads; store only hashed cache keys.

### Migration to Qdrant
- Docker Compose service `qdrant`; create collection `repo_ctx(dim=1536, metric=cosine)`.
- Bulk load from `embeddings/*.jsonl`; store `key`, `kind`, `module`, `tip`, and `hash` in payload.
- Keep a `schema_version` and reindex on bump.


