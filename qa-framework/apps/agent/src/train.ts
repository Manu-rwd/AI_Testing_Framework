import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { ensureDir, resolvePath, normalizeDiacritics } from './util/env.js';
import { embedBatch, type EmbeddingItem } from './similarity.js';

export async function runTrain(args: { pairsDir?: string; embeddings?: boolean; update?: boolean; }) {
  const pairsDir = resolvePath(args.pairsDir || 'qa-framework/data/agent/jsonl');
  const embDir = resolvePath('qa-framework/data/agent/embeddings');
  ensureDir(embDir);

  if (!fs.existsSync(pairsDir)) return { ok: true, count: 0 };
  const files = fs.readdirSync(pairsDir).filter(f => f.endsWith('.jsonl'));

  const items: EmbeddingItem[] = [];
  for (const f of files) {
    const full = path.join(pairsDir, f);
    const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/).filter(Boolean);
    for (const ln of lines) {
      try {
        const obj = JSON.parse(ln);
        const textParts: string[] = [];
        if (obj?.inputs?.us) textParts.push(obj.inputs.us);
        if (obj?.inputs?.generated) textParts.push(obj.inputs.generated);
        if (obj?.outMd) {
          const md = fs.existsSync(obj.outMd) ? fs.readFileSync(obj.outMd, 'utf8') : '';
          textParts.push(md);
        }
        const content = normalizeDiacritics(textParts.join('\n\n'));
        if (content) items.push({ id: `${f}:${items.length}`, text: content });
      } catch {}
    }
  }

  let vectors: number[][] = [];
  if (args.embeddings && items.length) {
    vectors = await embedBatch(items);
  }

  const out = path.join(embDir, `pairs_${Date.now()}.jsonl`);
  const stream = fs.createWriteStream(out, { encoding: 'utf8' });
  for (let i = 0; i < items.length; i++) {
    const rec = { id: items[i].id, text: items[i].text, vec: vectors[i] };
    stream.write(JSON.stringify(rec) + '\n');
  }
  stream.end();
  return { ok: true, count: items.length, out };
}

export function registerTrainCommand(program: Command) {
  program
    .command('train')
    .description('Ingest (US, generated, refined) pairs and compute optional embeddings')
    .option('--pairsDir <dir>', 'Pairs JSONL dir', 'qa-framework/data/agent/jsonl')
    .option('--embeddings', 'Compute embeddings')
    .option('--update', 'Update existing items (reserved)')
    .action(async (opts) => {
      const res = await runTrain(opts);
      console.log(JSON.stringify(res, null, 2));
    });
}


