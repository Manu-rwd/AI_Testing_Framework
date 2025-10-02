import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { CoverageDoc, CoverageItem, ManualItem, MatchPair, ScoreResult } from './types';

function normalizeText(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function toSet(arr?: string[]) { return new Set((arr||[]).map(a => normalizeText(a))); }
function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size && !b.size) return 1;
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const uni = new Set([...a, ...b]).size;
  return uni === 0 ? 1 : inter / uni;
}

export function loadCoverage(file: string): CoverageItem[] {
  const txt = fs.readFileSync(file, 'utf8');
  const data = yaml.load(txt) as any;
  const items = (Array.isArray(data?.items) ? data.items : data) as any[];
  return (items||[]).map(x => ({ bucket: String(x.bucket||''), narrative: String(x.narrative||''), facets: x.facets? x.facets.map(String): [] }));
}

// Manual parsing: support either lines like "- [bucket] narrative {facets:a,b,c}" or fallback to headings + bullets
export function loadManual(mdFile: string): ManualItem[] {
  const md = fs.readFileSync(mdFile, 'utf8');
  const items: ManualItem[] = [];
  const lineRe = /^-\s*\[(?<bucket>[^\]]+)\]\s*(?<narr>[^{}\n]+?)(?:\s*\{\s*facets\s*:\s*(?<facets>[^}]+)\})?\s*$/i;
  for (const raw of md.split(/\r?\n/)) {
    const m = raw.match(lineRe);
    const bucket = m?.groups?.bucket?.trim();
    const narr = m?.groups?.narr?.trim();
    if (!bucket || !narr) continue;
    const f = (m?.groups?.facets || '')
      .split(/[,;|]/)
      .map(s => s.trim())
      .filter(Boolean);
    items.push({ bucket, narrative: narr, facets: f });
  }
  return items;
}

export function score(coverage: CoverageItem[], manual: ManualItem[], tip: string): ScoreResult {
  const usedManual = new Set<number>();
  const matched: MatchPair[] = [];
  const mismatched: MatchPair[] = [];

  for (const cov of coverage) {
    const covBucket = normalizeText(cov.bucket);
    const covNarr = normalizeText(cov.narrative);
    const covFac = toSet(cov.facets);
    let bestIdx = -1;
    let bestJac = -1;
    let bestMan: ManualItem | null = null;

    manual.forEach((m, idx) => {
      if (usedManual.has(idx)) return;
      if (normalizeText(m.bucket) !== covBucket) return; // same bucket required
      if (normalizeText(m.narrative) !== covNarr) return; // normalized narrative match required
      const jac = jaccard(covFac, toSet(m.facets));
      if (jac > bestJac) { bestIdx = idx; bestJac = jac; bestMan = m; }
    });

    if (bestMan !== null && bestIdx >= 0) {
      const pair: MatchPair = { cov, man: bestMan, jaccard: bestJac };
      if (bestJac >= 0.8) { matched.push(pair); usedManual.add(bestIdx); }
      else { mismatched.push(pair); usedManual.add(bestIdx); }
    }
  }

  const missing = coverage.filter(c => !matched.find(p=>p.cov===c) && !mismatched.find(p=>p.cov===c));
  const extra: ManualItem[] = manual.filter((_, idx) => !usedManual.has(idx));

  const total = coverage.length || 1;
  const matchedCount = matched.length;
  const percent = Math.round((matchedCount/total)*10000)/100; // 2 decimals

  const visualTips = new Set([ 'vizualizare', 'raportare', 'grafic', 'graficare', 'viz' ]);
  const thr = visualTips.has((tip||'').toLowerCase()) ? 85 : 95;
  const pass = percent >= thr;

  return { overall: { percent, matched: matchedCount, total: coverage.length, threshold: thr, pass }, matched, missing, extra, mismatched };
}


