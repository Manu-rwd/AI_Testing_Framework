import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { agentEnvFile, manualOutputDir, tmpUploadsDir, reportsDir } from './paths.js';
import { runRefine, runUsBridge, spawnTrainBackground } from './exec.js';
import { CaseItem, parseManualToItems, formatItemsAsMarkdown, formatItemsAsText, diffItems, diffBySection, bucketFrequencies, facetFrequencies, formatFrequenciesTable } from './parsers.js';

export const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpUploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

router.post('/config/api-key', (req, res) => {
  const apiKey = String((req.body?.apiKey ?? '')).trim();
  if (!apiKey) return res.status(400).json({ ok: false, error: 'Missing apiKey' });
  const lines: string[] = [];
  if (fs.existsSync(agentEnvFile)) {
    const existing = fs.readFileSync(agentEnvFile, 'utf8').split(/\r?\n/);
    for (const line of existing) {
      if (line.startsWith('OPENAI_API_KEY=')) continue; // replace
      lines.push(line);
    }
  }
  lines.push(`OPENAI_API_KEY=${apiKey}`);
  if (!lines.some(l => l.startsWith('AGENT_MODEL='))) {
    lines.push('AGENT_MODEL=gpt-5');
  }
  fs.mkdirSync(path.dirname(agentEnvFile), { recursive: true });
  fs.writeFileSync(agentEnvFile, lines.join('\n'), { encoding: 'utf8' });
  return res.json({ ok: true });
});

router.post('/us', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file' });
  return res.json({ ok: true, path: path.resolve(req.file.path) });
});

router.post('/generate', async (req, res) => {
  try {
    const { usPath } = req.body ?? {};
    // The us2manual bridge currently reads configured paths; usPath can be used in future enhancements.
    const result = await runUsBridge();
    if (!result.ok) return res.status(500).json({ ok: false, error: result.error });
    return res.json({ ok: true, manualPath: result.latestManual });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.post('/refine', async (req, res) => {
  try {
    const { usPath, genPath, goldPath, tip, module } = req.body ?? {};
    if (!usPath || !genPath || !tip || !module) return res.status(400).json({ ok: false, error: 'Missing required fields' });
    const result = await runRefine({ us: usPath, gen: genPath, gold: goldPath, tip, module });
    if (!result.ok) return res.status(500).json({ ok: false, error: result.error });
    const mdPath = result.mdPath || '';
    const specPath = result.specPath || '';
    const md = mdPath && fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';
    const items = md ? parseManualToItems(md) : [];
    return res.json({ ok: true, parity: result.parity ?? null, out: { md: mdPath, spec: specPath }, items });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { usPath, genPath, goldPath, tip, module } = req.body ?? {};
    if (!goldPath) return res.status(400).json({ ok: false, error: 'goldPath required' });
    const result = await runRefine({ us: usPath, gen: genPath, gold: goldPath, tip, module });
    if (!result.ok) return res.status(500).json({ ok: false, error: result.error });
    const mdPath = result.mdPath || '';
    const md = mdPath && fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';
    const items = md ? parseManualToItems(md) : [];
    return res.json({ ok: true, parity: result.parity ?? null, out: { md: mdPath, spec: result.specPath || '' }, items });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.get('/manual', (req, res) => {
  const p = String(req.query.path || '');
  if (!p || !fs.existsSync(p)) return res.status(404).json({ ok: false, error: 'Not found' });
  const md = fs.readFileSync(p, 'utf8');
  const items = parseManualToItems(md);
  return res.json({ ok: true, items });
});

router.post('/export', (req, res) => {
  const { items, format, fileName } = req.body ?? {} as { items: CaseItem[]; format: 'md' | 'txt'; fileName?: string };
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ ok: false, error: 'No items' });
  const selected = items.filter(i => i.selected);
  const content = format === 'txt' ? formatItemsAsText(selected) : formatItemsAsMarkdown(selected);
  const base = fileName && typeof fileName === 'string' ? fileName : `export_${Date.now()}.${format || 'md'}`;
  const outPath = path.resolve(manualOutputDir, base);
  fs.writeFileSync(outPath, content, 'utf8');
  res.setHeader('Content-Type', format === 'txt' ? 'text/plain' : 'text/markdown');
  return res.json({ ok: true, path: outPath });
});

router.get('/file', (req, res) => {
  const p = String(req.query.path || '');
  if (!p || !fs.existsSync(p)) return res.status(404).end();
  res.sendFile(p);
});

router.post('/exit', (_req, res) => {
  res.json({ ok: true });
  setTimeout(() => process.exit(0), 200);
});

router.post('/learn-improve', upload.single('qa'), async (req, res) => {
  try {
    const qaPath = req.file ? path.resolve(req.file.path) : String(req.body?.qaPath || '');
    const usPath = String(req.body?.usPath || '');
    if (!qaPath || !usPath) return res.status(400).json({ ok: false, error: 'qaPath and usPath required' });
    // 1) Generate initial manual
    const genRes = await runUsBridge();
    if (!genRes.ok || !genRes.latestManual) return res.status(500).json({ ok: false, error: genRes.error || 'generate failed' });
    const genPath = genRes.latestManual;
    // 2) Refine with gold
    const ref = await runRefine({ us: usPath, gen: genPath, gold: qaPath, tip: 'Vizualizare', module: 'Documente' });
    if (!ref.ok) return res.status(500).json({ ok: false, error: ref.error });
    const outMd = ref.mdPath || genPath;
    const baseMd = fs.readFileSync(outMd, 'utf8');
    const goldMd = fs.readFileSync(qaPath, 'utf8');
    const baseItems = parseManualToItems(baseMd);
    const goldItems = parseManualToItems(goldMd);
    const diff = diffItems(baseItems, goldItems);
    const score = Math.round((diff.coverage || 0) * 100);
    const bySection = diffBySection(baseItems, goldItems)
      .sort((a, b) => a.tip.localeCompare(b.tip))
      .map(s => `- ${s.tip}: ${Math.round(s.coverage * 100)}% (${s.totalGold - s.missing}/${s.totalGold})`).join('\n');
    const baseBuckets = formatFrequenciesTable(bucketFrequencies(baseItems), 'Generator buckets');
    const goldBuckets = formatFrequenciesTable(bucketFrequencies(goldItems), 'QA buckets');
    const baseFacets = formatFrequenciesTable(facetFrequencies(baseItems), 'Generator facets');
    const goldFacets = formatFrequenciesTable(facetFrequencies(goldItems), 'QA facets');
    // 3) Write report
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const runSummary = `- Run ${ts}: coverage ${score}% (missing ${diff.missing.length}, extras ${diff.extras.length})`;
    const report = [
      `# Learn & Improve Report (${ts})`,
      ``,
      `## Run summary`,
      runSummary,
      ``,
      `- Coverage vs QA: ${score}%`,
      `- Missing: ${diff.missing.length}`,
      `- Extras: ${diff.extras.length}`,
      ``,
      `## Coverage by section`,
      bySection,
      ``,
      baseBuckets,
      ``,
      goldBuckets,
      ``,
      baseFacets,
      ``,
      goldFacets,
      ``,
      `## Missing (should add)`,
      formatItemsAsMarkdown(diff.missing),
      ``,
      `## Extras (consider removing or rewording)`,
      formatItemsAsMarkdown(diff.extras),
      ``,
      `## Suggestions`,
      `- Increase emphasis on QA style vocabulary and canonical sections.`,
      `- Adjust rule weights for facets observed in QA.`,
      `- Iterate with cache enabled to converge faster.`
    ].join('\n');
    const reportPath = path.join(reportsDir, `learn_improve_${ts}.md`);
    fs.writeFileSync(reportPath, report, 'utf8');

    // 4) Optional background training
    const train = String(req.body?.train || 'false') === 'true';
    if (train) spawnTrainBackground();

    return res.json({ ok: true, report: reportPath, out: { md: outMd } });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});


