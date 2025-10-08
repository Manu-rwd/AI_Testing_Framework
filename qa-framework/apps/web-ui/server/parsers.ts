export type CaseItem = {
  id: string;
  bucket: string;
  narrative: string;
  facets: string[];
  selected?: boolean;
  tip?: string;
};

export function parseManualToItems(md: string): CaseItem[] {
  const lines = md.split(/\r?\n/);
  const items: CaseItem[] = [];
  let currentTip = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Capture section headers like: ## Vizualizare
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      currentTip = h[1].trim();
      continue;
    }

    // Format 1: - [bucket] narrative {facets:a,b}
    const m1 = /^-\s*\[([^\]]+)\]\s*(.*?)\s*(\{[^}]*\})?\s*$/.exec(line);
    if (m1) {
      const bucket = m1[1].trim();
      const narrative = m1[2].trim();
      const facets = extractFacets(m1[3] || '');
      const id = `${bucket}:${hashString(`${currentTip}|${narrative}`).toString(36)}`;
      items.push({ id, bucket, narrative, facets, selected: false, tip: currentTip });
      continue;
    }

    // Format 2: 01. Narrative {facet1, facet2}
    const m2 = /^(\d{1,3})\.\s*(.*?)\s*(\{[^}]*\})?\s*$/.exec(line);
    if (m2) {
      const narrative = m2[2].trim();
      const facets = extractFacets(m2[3] || '');
      const bucket = 'general';
      const id = `${bucket}:${hashString(`${currentTip}|${narrative}`).toString(36)}`;
      items.push({ id, bucket, narrative, facets, selected: false, tip: currentTip });
      continue;
    }

    // Format 3: 01. (bucket) Narrative {facet1, facet2}
    const m3 = /^(\d{1,3})\.\s*\(([^)]+)\)\s*(.*?)\s*(\{[^}]*\})?\s*$/.exec(line);
    if (m3) {
      const bucketRaw = m3[2].trim();
      const narrative = m3[3].trim();
      const facets = extractFacets(m3[4] || '');
      const bucket = normalizeText(bucketRaw) || 'general';
      const id = `${bucket}:${hashString(`${currentTip}|${narrative}`).toString(36)}`;
      items.push({ id, bucket, narrative, facets, selected: false, tip: currentTip });
      continue;
    }
  }
  return items;
}

export function formatItemsAsMarkdown(items: CaseItem[]): string {
  return items.map((i, idx) => `${String(idx + 1).padStart(2, '0')}. [${i.bucket}] ${i.narrative}${i.facets.length ? ` {facets:${i.facets.join(',')}}` : ''}`).join('\n');
}

export function formatItemsAsText(items: CaseItem[]): string {
  return items.map((i, idx) => `${String(idx + 1).padStart(2, '0')}. (${i.bucket}) ${i.narrative}`).join('\n');
}

export function diffItems(base: CaseItem[], gold: CaseItem[]) {
  const norm = (s: string) => normalizeText(s);
  const keyOf = (x: CaseItem) => `${norm(x.narrative)}|${x.facets.map(norm).join(',')}`;
  const baseMap = new Map(base.map(x => [keyOf(x), x]));
  const goldMap = new Map(gold.map(x => [keyOf(x), x]));
  const missing = [] as CaseItem[];
  const extras = [] as CaseItem[];
  for (const [k, v] of goldMap) if (!baseMap.has(k)) missing.push(v);
  for (const [k, v] of baseMap) if (!goldMap.has(k)) extras.push(v);
  const coverage = gold.length === 0 ? 1 : (gold.length - missing.length) / gold.length;
  return { missing, extras, coverage };
}

export function diffBySection(base: CaseItem[], gold: CaseItem[]) {
  const byTip = (xs: CaseItem[]) => xs.reduce<Record<string, CaseItem[]>>((acc, x) => {
    const k = x.tip || 'General';
    (acc[k] ||= []).push(x);
    return acc;
  }, {});
  const b = byTip(base);
  const g = byTip(gold);
  const allTips = new Set([...Object.keys(b), ...Object.keys(g)]);
  const rows: { tip: string; coverage: number; totalGold: number; missing: number }[] = [];
  for (const tip of allTips) {
    const db = b[tip] || [];
    const dg = g[tip] || [];
    const d = diffItems(db, dg);
    rows.push({ tip, coverage: d.coverage, totalGold: dg.length, missing: d.missing.length });
  }
  return rows;
}

export function bucketFrequencies(items: CaseItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, x) => {
    const k = normalizeText(x.bucket || 'general');
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

export function facetFrequencies(items: CaseItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, x) => {
    for (const f of x.facets || []) {
      const k = normalizeText(f);
      acc[k] = (acc[k] || 0) + 1;
    }
    return acc;
  }, {});
}

export function formatFrequenciesTable(freq: Record<string, number>, title: string): string {
  const rows = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`);
  return [`### ${title}`, ...rows].join('\n');
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function extractFacets(block: string): string[] {
  if (!block) return [];
  // Accept either {facets:a,b} or {a,b}
  const labeled = /\{\s*facets\s*:\s*([^}]*)\}/i.exec(block);
  const raw = labeled ? labeled[1] : /\{\s*([^}]*)\}/.exec(block)?.[1];
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function normalizeText(input: string): string {
  const syn: Record<string, string> = {
    'afișare': 'afisare',
    'afișată': 'afisata',
    'coloana': 'coloana',
    'coloană': 'coloana',
    'buton': 'buton',
    'butonul': 'buton',
    'mousehoover': 'mouseover',
    'celula-mouseover': 'mouseover',
    's l a': 'sla'
  };
  let s = (input || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (syn[s]) s = syn[s];
  return s;
}


