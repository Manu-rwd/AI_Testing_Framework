import fs from 'node:fs';
import path from 'node:path';
import type { ScoreResult } from './types';

export function writeReports(res: ScoreResult, area: string, tip: string, outDir: string) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const base = `${area}_${tip}_parity`;
  const jsonPath = path.join(outDir, `${base}.json`);
  const mdPath = path.join(outDir, `${base}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(res, null, 2), 'utf8');

  const md: string[] = [];
  md.push(`# Parity report — ${area} / ${tip}`);
  md.push('');
  md.push(`Overall: **${res.overall.percent}%** (matched ${res.overall.matched}/${res.overall.total}); threshold **${res.overall.threshold}%** → ${res.overall.pass ? 'PASS' : 'FAIL'}`);
  md.push('');
  const sect = (title: string, items: any[], render: (x:any)=>string) => {
    md.push(`## ${title}`);
    if (!items.length) { md.push('- none'); return; }
    for (const it of items) md.push(`- ${render(it)}`);
    md.push('');
  };
  sect('Missing (in coverage, not in manual)', res.missing, (x)=>`[${x.bucket}] ${x.narrative}`);
  sect('Extra (in manual, not in coverage)', res.extra, (x)=>`[${x.bucket}] ${x.narrative}`);
  sect('Mismatched (facets Jaccard < 0.8 but same bucket+narrative)', res.mismatched, (x)=>`[${x.cov.bucket}] ${x.cov.narrative} — jaccard: ${x.jaccard.toFixed(2)}`);

  fs.writeFileSync(mdPath, md.join('\n'), 'utf8');
  return { jsonPath, mdPath };
}


