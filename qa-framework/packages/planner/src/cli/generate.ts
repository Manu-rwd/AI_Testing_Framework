import fs from 'node:fs/promises';
import path from 'node:path';

// Placeholder generator: in PR #2 proper, this will use @pkg/rules + US parsing.
async function main() {
  const moduleName = process.env.MODULE ?? 'Accesare';
  const draft = {
    meta: { nume: moduleName },
    data: {},
    module: moduleName
  } as any;
  const outDir = path.resolve(process.cwd(), 'exports');
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `draft_plan_${moduleName}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(draft, null, 2), 'utf8');
  console.log(jsonPath);
}
main().catch(e => { console.error(e); process.exit(1); });


