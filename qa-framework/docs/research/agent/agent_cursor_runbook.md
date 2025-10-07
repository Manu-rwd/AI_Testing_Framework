## Cursor Agent — Do-This-Now Runbook (Full Refine Loop)

Goal: Implement the v1 thin agent end-to-end so a US (.txt) → baseline MD → refined MD (100% style, ≥95% parity) works locally on Windows with pnpm.

Preconditions
- Node ≥22, pnpm ≥9 installed
- File `qa-framework/apps/agent/.env` with:
  - `OPENAI_API_KEY=...`
  - `AGENT_MODEL=gpt-5`
  - `EMBEDDINGS_MODEL=text-embedding-3-small`
- Repo is clean; all packages build

High-level
- Build three commands in `@apps/agent`: `refine`, `train`, `suggest`
- Use existing `LlmCaller` (GPT‑5 primary; fallback 4.1‑mini)
- Enforce JSON via Zod; post-format via `@pkg/spec`; score via `@pkg/parity`
- Deterministic: cache, stable sort, dedupe, up to 2 fixer iterations

Tasks
1) Create scaffolding files in `qa-framework/apps/agent/src/`
   - `schema.ts`: Zod schemas (ManualLine, ManualOutput, FixInput)
   - `cache.ts`: content-hash cache (sha256 of inputs + promptVersion)
   - `similarity.ts`: in-memory cosine; embedding client (defer to later if needed)
   - `refine.ts`: implement Refiner→Fixer loop (see Steps below)
   - `train.ts`: write JSONL for pairs; optional embeddings JSONL
   - `suggest.ts`: convert parity misses to Cursor prompt (Goal/Acceptance/Change/Testing)
   - `cli.ts`: yargs/commander entry with commands: `refine`, `train`, `suggest`

2) Wire package scripts
```json
// qa-framework/apps/agent/package.json
{
  "scripts": {
    "start:refine": "tsx src/cli.ts refine",
    "start:train": "tsx src/cli.ts train",
    "start:suggest": "tsx src/cli.ts suggest"
  }
}
```
```json
// qa-framework/package.json
{
  "scripts": {
    "agent:refine": "pnpm --filter @apps/agent start:refine",
    "agent:train": "pnpm --filter @apps/agent start:train",
    "agent:suggest": "pnpm --filter @apps/agent start:suggest"
  }
}
```

3) Implement `schema.ts`
```ts
import { z } from "zod";
export const ManualLineSchema = z.object({
  bucket: z.string(),
  narrative: z.string(),
  facets: z.array(z.string()).optional()
});
export const ManualOutputSchema = z.object({
  lines: z.array(ManualLineSchema)
});
export type ManualOutput = z.infer<typeof ManualOutputSchema>;
```

4) Implement `cache.ts`
```ts
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
const CACHE_DIR = path.resolve("qa-framework/data/agent/cache");
export async function readCache(keyObj: any) {
  const key = hash(keyObj); await fs.mkdir(CACHE_DIR, { recursive: true });
  try { return JSON.parse(await fs.readFile(path.join(CACHE_DIR, key+".json"), "utf8")); } catch { return null; }
}
export async function writeCache(keyObj: any, value: any) {
  const key = hash(keyObj); await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, key+".json"), JSON.stringify(value, null, 2), "utf8");
}
function hash(o: any) { return crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex"); }
```

5) Implement `refine.ts` (core loop)
```ts
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ManualOutputSchema, type ManualOutput } from "./schema";
import { readCache, writeCache } from "./cache";
import { LlmCaller } from "./lib/call"; // existing
// import spec/validator & parity scorer (via local imports)
import { formatManual } from "../../packages/spec/src/validator"; // adjust to actual export
import { score, loadManual } from "../../packages/parity/src/score"; // reuse scoring parse

type Args = { us: string; gen: string; gold?: string; tip: string; module?: string; outDir?: string; useCache?: boolean; maxIters?: number };

export async function refine(args: Args) {
  const caller = new LlmCaller();
  const promptVersion = "v1";
  const raw = buildRefinerInput(args); // {schema, context, inputs}
  const cacheKey = { promptVersion, model: process.env.AGENT_MODEL||"gpt-5", raw };
  if (args.useCache) { const cached = await readCache(cacheKey); if (cached) return await finalize(cached, args); }
  // Call Refiner
  const res1 = await caller.chat({ messages: [
    { role: "system", content: "You are a QA manual refiner. Output ONLY valid JSON per schema." },
    { role: "user", content: JSON.stringify(raw) }
  ], responseFormatJson: true });
  const out1 = ManualOutputSchema.parse(JSON.parse(res1.choices[0].message!.content!));
  let final = out1; let iter = 0; const maxIters = args.maxIters ?? 2;
  while (iter < maxIters) {
    const specMd = toSpecMd(final, args.tip); // build - [bucket] narrative {facets:...}
    const scored = runParity(specMd, args.tip, args.gold);
    if (scored.overall.pass) break;
    const fixRaw = buildFixerInput(final, scored);
    const res2 = await caller.chat({ messages: [
      { role: "system", content: "Fix QA manual JSON based on the errors. JSON only." },
      { role: "user", content: JSON.stringify(fixRaw) }
    ], responseFormatJson: true });
    final = ManualOutputSchema.parse(JSON.parse(res2.choices[0].message!.content!));
    iter++;
  }
  await writeCache(cacheKey, final);
  return await finalize(final, args);
}

function toSpecMd(out: ManualOutput, tip: string) {
  const lines = out.lines.map(ln => `- [${ln.bucket}] ${ln.narrative}${(ln.facets?.length?` {facets:${ln.facets.join(", ")}}`:"")}`);
  return `## ${tip}\n\n` + lines.join("\n") + "\n";
}
function runParity(specMd: string, tip: string, goldPath?: string) {
  // If gold provided, parse as manual items via loadManual (expects emitter style); else compute vs coverage YAML (extend later)
  // Minimal: treat gold as manual MD in spec style
  const manItems = loadManualFromSpec(specMd);
  const goldItems = goldPath && fs.existsSync(goldPath) ? loadManual(goldPath) : [];
  // If no gold: consider pass by style only
  if (!goldItems.length) return { overall: { percent: 100, matched: manItems.length, total: manItems.length, threshold: 95, pass: true } } as any;
  return score(goldItems as any, manItems as any, tip);
}
function loadManualFromSpec(specMd: string) {
  const items: any[] = [];
  const re = /^-\s*\[(?<bucket>[^\]]+)\]\s*(?<narr>[^\{\n]+?)(?:\s*\{\s*facets\s*:\s*(?<facets>[^}]+)\})?\s*$/i;
  for (const raw of specMd.split(/\r?\n/)) {
    const m = raw.match(re); if (!m) continue;
    const f = (m.groups?.facets||"").split(/[,;|]/).map(s=>s.trim()).filter(Boolean);
    items.push({ bucket: m.groups!.bucket!.trim(), narrative: m.groups!.narr!.trim(), facets: f });
  }
  return items;
}
function buildRefinerInput(args: Args) { return { task: "refine_manual", schema: {/* as in plan */}, context: {/* rules, vocab, examples */}, inputs: {/* us/gen/gold */} }; }
function buildFixerInput(last: ManualOutput, scored: any) { return { task: "fix_manual", errors: {/* from scored */}, last_output: last }; }
async function finalize(out: ManualOutput, args: Args) {
  const specMd = toSpecMd(out, args.tip);
  const specFmt = formatManual(specMd, { stripProvenance: true });
  const qa = toQaEnumerated(out, args.tip);
  const outDir = path.resolve(args.outDir || "qa-framework/data/agent/refined");
  fs.mkdirSync(outDir, { recursive: true });
  const base = `${args.module||"Module"}_${args.tip}`;
  fs.writeFileSync(path.join(outDir, `${base}_SPEC.md`), specFmt, "utf8");
  fs.writeFileSync(path.join(outDir, `${base}.md`), qa, "utf8");
  return { spec: specFmt, qa };
}
function toQaEnumerated(out: ManualOutput, tip: string) {
  const body = out.lines
    .filter(ln => (ln.bucket||"").toLowerCase() !== "overlay")
    .map((ln, i) => `${String(i+1).padStart(2,'0')}. ${ln.narrative}${ln.facets?.length?` {${ln.facets.join(', ')}}`:''}`)
    .join("\n");
  return `## ${tip}\n${body}\n`;
}
```

6) Implement `cli.ts` (skeleton)
```ts
#!/usr/bin/env node
import { Command } from "commander";
import { refine } from "./refine";
const program = new Command();
program.command("refine")
  .requiredOption("--us <file>")
  .requiredOption("--gen <file>")
  .option("--gold <file>")
  .requiredOption("--tip <name>")
  .option("--module <name>")
  .option("--outDir <dir>")
  .option("--use-cache")
  .action(refine as any);
program.parse();
```

7) Build & test locally
```bash
pnpm -C qa-framework install
pnpm -C qa-framework -r build
pnpm -C qa-framework run agent:refine -- --us US_input/<file>.txt --gen manual_output/<gen>.md --gold manual_output/<gold>.txt --tip Vizualizare --module Documente --use-cache
```

8) Validate gates
```bash
pnpm -C qa-framework run agent:refine -- --use-cache --us US_input/<file>.txt --gen manual_output/<gen>.md --tip Vizualizare --module Documente
pnpm -C qa-framework run parity:score -- --project ./projects/example --tip Vizualizare --manual qa-framework/data/agent/refined/Documente_Vizualizare_SPEC.md
```

9) Commit
```bash
git add qa-framework/apps/agent qa-framework/package.json
git commit -m "feat(agent): implement refine loop with schema validation, formatting and parity"
git push origin main
```

Done when
- `agent:refine` produces style‑clean refined manuals with parity ≥ threshold on the sample
- Artifacts written under `qa-framework/data/agent/refined/`


