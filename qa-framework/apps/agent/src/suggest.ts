import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { ensureDir, resolvePath } from './util/env.js';

type Miss = { bucket: string; narrative: string; facets?: string[] };

function classify(m: Miss): string {
  if (!m.facets || m.facets.length === 0) return 'missing-feature';
  if (/ordine|ordinea|sortare/i.test(m.narrative)) return 'order';
  return 'phrasing';
}

export function buildCursorPrompt(moduleName: string, tip: string, misses: Miss[], mappingTargets: string[]): string {
  const grouped = new Map<string, Miss[]>();
  for (const miss of misses) {
    const c = classify(miss);
    grouped.set(c, [...(grouped.get(c) || []), miss]);
  }
  const parts: string[] = [];
  parts.push(`# Goal\nImprove QA manual generation to close parity gaps for ${moduleName} — ${tip}.`);
  parts.push(`\n## Acceptance\n- Style clean by @pkg/spec\n- Parity pass by @pkg/parity (threshold per tip)\n- Deterministic outputs`);
  parts.push(`\n## Proposed Changes\nTargets: ${mappingTargets.join(', ')}`);
  for (const [k, arr] of grouped.entries()) {
    parts.push(`\n### ${k}\n` + arr.map(a => `- [${a.bucket}] ${a.narrative} ${a.facets?.length?`{facets:${a.facets.join(',')}}`:''}`).join('\n'));
  }
  parts.push(`\n## Testing\n- pnpm -C qa-framework run us:bridge -- --qa-style --no-provenance\n- pnpm -C qa-framework run agent:refine -- --use-cache --tip ${tip} --module ${moduleName}`);
  return parts.join('\n');
}

export async function runSuggest(args: { us?: string; gen?: string; refined?: string; tip: string; module: string; report?: string; }) {
  const misses: Miss[] = [];
  if (args.report && fs.existsSync(resolvePath(args.report))) {
    try {
      const txt = fs.readFileSync(resolvePath(args.report), 'utf8');
      const obj = JSON.parse(txt);
      for (const m of obj?.missing || []) misses.push({ bucket: String(m.bucket), narrative: String(m.narrative), facets: m.facets || [] });
      for (const mm of obj?.mismatched || []) misses.push({ bucket: String(mm.cov?.bucket||''), narrative: String(mm.cov?.narrative||''), facets: mm.cov?.facets || [] });
    } catch {}
  }
  const prompt = buildCursorPrompt(args.module, args.tip, misses, [
    'qa-framework/tools/us2manual.mjs',
    'qa-framework/packages/manual-emitter/src/emit.ts',
    'qa-framework/packages/spec/src/validator.ts'
  ]);
  const outDir = resolvePath('qa-framework/data/agent/suggestions');
  ensureDir(outDir);
  const out = path.join(outDir, `${args.module}_${args.tip}_${Date.now()}.md`);
  fs.writeFileSync(out, prompt, 'utf8');
  return { ok: true, out };
}

export function registerSuggestCommand(program: Command) {
  program
    .command('suggest')
    .description('Generate Cursor-ready prompts based on parity misses')
    .requiredOption('--tip <name>', 'Tip section, e.g. Vizualizare')
    .requiredOption('--module <name>', 'Module name')
    .option('--report <file>', 'Parity JSON report (optional)')
    .option('--us <file>', 'User Story input txt (optional)')
    .option('--gen <file>', 'Generated baseline manual md (optional)')
    .option('--refined <file>', 'Refined manual md (optional)')
    .action(async (opts) => {
      const res = await runSuggest(opts);
      console.log(JSON.stringify(res, null, 2));
    });
}


