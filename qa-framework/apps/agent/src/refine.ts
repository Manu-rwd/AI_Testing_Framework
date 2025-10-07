import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { LlmCaller } from './lib/call.js';
import { JsonCache, buildCacheKey } from './cache.js';
import { ensureDir, resolvePath } from './util/env.js';
import { ManualOutputSchema, FixInputSchema, type ManualOutput } from './schema.js';
import { formatManual, validateManual } from '../../../packages/spec/src/validator.js';
import { BUCKET_TAGS } from '../../../packages/spec/src/vocabulary.js';
import { loadCoverage, loadManual, score } from '../../../packages/parity/src/score.js';

function toManualMarkdown(output: ManualOutput, tip: string): string {
  const lines: string[] = [];
  lines.push(`## ${tip}`);
  for (const item of output.lines) {
    const facets = Array.isArray(item.facets) && item.facets.length > 0 ? `{facets:${item.facets.join(',')}}` : '';
    lines.push(`- [${item.bucket}] ${item.narrative}${facets ? ' ' + facets : ''}`);
  }
  lines.push('');
  return lines.join('\n');
}

function buildContextPack() {
  const specRules: string[] = [];
  specRules.push('No standalone auth outcomes; encode permissions as metadata');
  specRules.push('Canonical section headers: Vizualizare, Adăugare, Modificare, Ștergere, Activare');
  specRules.push('Case lines: - [bucket] narrative {facets:a,b,c}');
  return { spec_rules: specRules.join('\n'), bucket_vocab: BUCKET_TAGS };
}

export async function runRefine(args: {
  us?: string; gen?: string; gold?: string; tip: string; module: string;
  outDir?: string; maxIters?: number; useCache?: boolean; project?: string;
}) {
  const tip = args.tip;
  const moduleName = args.module;
  const outDir = resolvePath(args.outDir || 'qa-framework/data/agent/refined');
  ensureDir(outDir);

  const inputs = {
    us: args.us ? fs.readFileSync(resolvePath(args.us), 'utf8') : undefined,
    generated: args.gen ? fs.readFileSync(resolvePath(args.gen), 'utf8') : undefined,
    gold_optional: args.gold ? fs.readFileSync(resolvePath(args.gold), 'utf8') : undefined
  };

  const cache = new JsonCache();
  const caller = new LlmCaller();
  const context = buildContextPack();

  // Build a minimal JSON schema the model can follow (avoid zod-specific toJSON)
  const schemaJson = {
    type: 'object',
    properties: {
      lines: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            bucket: { type: 'string' },
            narrative: { type: 'string' },
            facets: { type: 'array', items: { type: 'string' } }
          },
          required: ['bucket', 'narrative']
        },
        minItems: 1
      }
    },
    required: ['lines']
  } as const;
  const payload = {
    task: 'refine_manual', module: moduleName, tip, schema: schemaJson, context, inputs
  };
  const cacheKey = buildCacheKey({ v: 1, payload, model: process.env.AGENT_MODEL || 'gpt-5' });

  let parsed: ManualOutput | null = null;
  if (args.useCache) {
    const hit = cache.get<{ response: { content: string } }>(cacheKey);
    if (hit?.response?.content) {
      try {
        const obj = JSON.parse(hit.response.content);
        parsed = ManualOutputSchema.parse(obj);
      } catch {}
    }
  }

  const system = 'You are an internal QA manual refiner. Output ONLY valid JSON per the provided schema. Use canonical Romanian QA vocabulary and tags; no duplicates; respect auth rules (no standalone outcomes).';

  let completionContent: string | null = null;
  if (!parsed) {
    const res = await caller.chat({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(payload) }
      ],
      responseFormatJson: true
    });
    completionContent = res.choices?.[0]?.message?.content || '';
    const obj = JSON.parse(completionContent || '{}');
    parsed = ManualOutputSchema.parse(obj);
    if (args.useCache) cache.set(cacheKey, { response: { content: completionContent } });
  }

  let manualMd = formatManual(toManualMarkdown(parsed as ManualOutput, tip), { stripProvenance: true });
  let style = validateManual(manualMd, { allowProvenance: false, noAuthStandalone: true });

  // Parity scoring (optional via coverage project)
  let parity: any = null;
  if (args.project) {
    const cov = loadCoverage(path.join(resolvePath(args.project), 'standards', 'coverage', `${tip}.yaml`));
    const manItems = loadManual(writeTempManual(manualMd));
    parity = score(cov, manItems, tip);
  }

  const maxIters = Math.max(0, Math.min(2, args.maxIters ?? 2));
  let iter = 0;
  while (iter < maxIters && (!style.ok || (parity && !parity.overall.pass))) {
    const fixer = {
      task: 'fix_manual',
      tip,
      errors: {
        style_issues: style.issues.map(x => ({ line: x.line, issue: `${x.kind}:${x.msg}` })),
        parity_misses: parity ? [
          ...parity.missing.map((m: any) => ({ type: 'missing', bucket: m.bucket, narrative: m.narrative, facets: m.facets })),
          ...parity.mismatched.map((mm: any) => ({ type: 'mismatch', bucket: mm.cov.bucket, narrative: mm.cov.narrative, facets: mm.cov.facets }))
        ] : []
      },
      last_output: parsed
    };
    // Validate fixer payload shape
    FixInputSchema.parse(fixer);

    const res = await caller.chat({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(fixer) }
      ],
      responseFormatJson: true
    });
    const content = res.choices?.[0]?.message?.content || '';
    const obj = JSON.parse(content || '{}');
    parsed = ManualOutputSchema.parse(obj);
    manualMd = formatManual(toManualMarkdown(parsed as ManualOutput, tip), { stripProvenance: true });
    style = validateManual(manualMd, { allowProvenance: false, noAuthStandalone: true });
    if (args.project) {
      const cov = loadCoverage(path.join(resolvePath(args.project), 'standards', 'coverage', `${tip}.yaml`));
      const manItems = loadManual(writeTempManual(manualMd));
      parity = score(cov, manItems, tip);
    }
    iter++;
  }

  const baseName = `${moduleName}_${tip}`;
  const outSpec = path.join(outDir, `${baseName}.spec.md`);
  const outMd = path.join(outDir, `${baseName}.md`);
  fs.writeFileSync(outSpec, manualMd, 'utf8');
  fs.writeFileSync(outMd, manualMd, 'utf8');

  const auditDir = resolvePath('qa-framework/data/agent/jsonl/pairs');
  ensureDir(auditDir);
  const audit = {
    ts: new Date().toISOString(),
    module: moduleName,
    tip,
    style_ok: style.ok,
    style_issues: style.issues,
    parity: parity?.overall ?? null,
    outSpec,
    outMd,
    cacheKey
  };
  const auditPath = path.join(auditDir, `${baseName}.jsonl`);
  fs.appendFileSync(auditPath, JSON.stringify(audit) + '\n', 'utf8');

  return { outSpec, outMd, style, parity };
}

function writeTempManual(md: string): string {
  const tmp = path.join(process.cwd(), 'qa-framework', 'tmp', `__agent_tmp_${Date.now()}.md`);
  ensureDir(path.dirname(tmp));
  fs.writeFileSync(tmp, md, 'utf8');
  return tmp;
}

export function registerRefineCommand(program: Command) {
  program
    .command('refine')
    .description('Refine QA manual using LLM with schema and parity/validator checks')
    .requiredOption('--tip <name>', 'Tip section, e.g. Vizualizare')
    .requiredOption('--module <name>', 'Module name')
    .option('--us <file>', 'User Story input txt')
    .option('--gen <file>', 'Generated baseline manual md')
    .option('--gold <file>', 'Gold QA list (optional)')
    .option('--project <dir>', 'Coverage project root (optional)')
    .option('--outDir <dir>', 'Output directory', 'qa-framework/data/agent/refined')
    .option('--maxIters <n>', 'Max fixer iterations', (v)=>Number(v), 2)
    .option('--use-cache', 'Use content-hash cache')
    .action(async (opts) => {
      const res = await runRefine(opts);
      console.log(JSON.stringify({ ok: res.style.ok, parity: res.parity?.overall ?? null, out: { spec: res.outSpec, md: res.outMd } }, null, 2));
    });
}


