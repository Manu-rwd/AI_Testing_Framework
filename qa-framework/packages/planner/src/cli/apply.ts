import fs from 'node:fs/promises';
import path from 'node:path';
import { withProjectStandards } from '../project-standards/bridge.js';

function resolveInputPath(argv: string[]): string | null {
  const idx = argv.findIndex(a => a === '--in' || a === '-i');
  if (idx >= 0 && argv[idx + 1]) return path.resolve(process.cwd(), argv[idx + 1]);
  return null;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const projectId = process.env.PROJECT_ID || undefined;

  let inputPath = resolveInputPath(process.argv);
  if (!inputPath) {
    const moduleName = process.env.MODULE || 'Accesare';
    inputPath = path.resolve(process.cwd(), 'exports', `draft_plan_${moduleName}.json`);
  }

  const raw = await fs.readFile(inputPath, 'utf8');
  const draft = JSON.parse(raw);

  const enriched = await withProjectStandards(draft, { projectId });

  const outDir = path.resolve(process.cwd(), 'exports');
  await fs.mkdir(outDir, { recursive: true });

  const stem = path.basename(inputPath, path.extname(inputPath));
  const jsonOut = path.join(outDir, `${stem}.enriched.json`);
  const mdOut   = path.join(outDir, `${stem}.md`);
  const csvOut  = path.join(outDir, `${stem}.csv`);

  if (!dry) {
    await fs.writeFile(jsonOut, JSON.stringify(enriched, null, 2), 'utf8');
    const { writeMarkdown } = await import('../exporters/markdown.js');
    const { writeCsv } = await import('../exporters/csv.js');
    await writeMarkdown(enriched, mdOut);
    await writeCsv(enriched, csvOut);
  }

  console.log(JSON.stringify({ input: inputPath, jsonOut, mdOut, csvOut, projectId }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });


