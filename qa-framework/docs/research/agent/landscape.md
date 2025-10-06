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


