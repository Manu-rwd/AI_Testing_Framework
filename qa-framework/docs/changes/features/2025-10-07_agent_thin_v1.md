# Feature Change: QA Manual Refiner Agent (Thin v1)

## What
- Add internal agent under `qa-framework/apps/agent` with commands: refine, train, suggest.
- Integrate with `@pkg/spec` validator/formatter and `@pkg/parity` scorer.
- Deterministic caching, optional embeddings, and suggestion prompts for repo edits.

## Why
- Automate refinement of QA manuals to achieve 100% style and parity thresholds, reduce manual iteration, and provide actionable prompts for code improvements.

## How
- New files: `src/schema.ts`, `src/util/env.ts`, `src/cache.ts`, `src/similarity.ts`, `src/refine.ts`, `src/train.ts`, `src/suggest.ts`, `src/cli.ts`.
- Reuse `src/lib/call.ts` for LLM calls; add scripts in `@apps/agent` and root package.
- Outputs under `qa-framework/data/agent/{refined, jsonl, embeddings, suggestions, cache}`.

## Impacts
- Adds dev dependency on `tsx` in agent package; uses existing OpenAI client.
- No breaking changes to existing packages.

## Testing
- `pnpm -C qa-framework run agent:probe` succeeds with valid `OPENAI_API_KEY`.
- Run a sample refine with `--use-cache` and validate with `@pkg/spec.validateManual` and `@pkg/parity.score`.

## Files
- `qa-framework/apps/agent/src/*.ts`
- `qa-framework/apps/agent/package.json` scripts
- `qa-framework/package.json` scripts


