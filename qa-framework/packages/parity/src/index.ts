#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { loadCoverage, loadManual, score } from './score';
import { writeReports } from './report';

const program = new Command();
program
  .name('parity:score')
  .description('Compute QA parity (coverage vs manual overlays) and emit JSON + Markdown report')
  .option('--project <dir>', 'project root (contains projects/<id>/standards/coverage)')
  .option('--tip <name>', 'coverage tip name (e.g., Vizualizare)')
  .option('--manual <file>', 'path to manual Markdown file')
  .parse(process.argv);

const opts = program.opts();
if (!opts.project || !opts.tip || !opts.manual) {
  console.error('Usage: --project ./projects/<id> --tip <Tip> --manual <Manual.md>');
  process.exit(2);
}

const tip = String(opts.tip);
const covPath = path.resolve(process.cwd(), path.join(String(opts.project), 'standards', 'coverage', `${tip}.yaml`));
const manualPath = path.resolve(process.cwd(), String(opts.manual));
if (!fs.existsSync(covPath)) { console.error('Coverage YAML not found: ' + covPath); process.exit(2); }
if (!fs.existsSync(manualPath)) { console.error('Manual MD not found: ' + manualPath); process.exit(2); }

const coverage = loadCoverage(covPath);
const manual = loadManual(manualPath);
const result = score(coverage, manual, tip);

// derive area from manual filename without _Manual.md
const base = path.basename(manualPath).replace(/_Manual\.md$/i, '').replace(/\.md$/i,'');
const outDir = path.resolve(process.cwd(), 'reports');
const { jsonPath, mdPath } = writeReports(result, base, tip, outDir);

console.log(JSON.stringify({ jsonPath, mdPath, overall: result.overall }, null, 2));
process.exit(result.overall.pass ? 0 : 1);


