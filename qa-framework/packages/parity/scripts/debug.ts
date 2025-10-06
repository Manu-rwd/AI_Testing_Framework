import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadCoverage, loadManual, score } from '../src/score';
import { emitManualMarkdown } from '../../manual-emitter/src/emit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(tip: string) {
  const root = path.resolve(__dirname, '../../../..');
  const project = path.join(root, 'qa-framework/projects/example');
  const planPath = path.join(root, 'qa-framework/temp/merged_plan.json');
  const basePlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  const copy = JSON.parse(JSON.stringify(basePlan));
  if (tip.toLowerCase() === 'vizualizare') {
    copy.uiux = {
      tip: 'Vizualizare',
      overlays: [ { family: 'presence' }, { family: 'columns' }, { family: 'sorting' }, { family: 'pagination' }, { family: 'responsive' }, { family: 'resilience' }, { family: 'auth' } ],
      columns: [ { label: 'Nume', sortable: true, header: { visible: true, align: 'left' }, value: { format: 'text' } } ],
      table: { paginated: true, stickyHeader: true, columnVisibilityMenu: true },
      resilience: { offline: true, slow: true, loadingSLAms: 2000, dropOnAccess: true, dropDuringAction: true },
      responsive: { breakpoints: ['md'] },
      pagination: { sizes: [10,25,50] },
      auth: { roles: ['admin','user'], unauthRedirect: '/login' }
    };
  } else {
    copy.uiux = { tip, overlays: [ { family: 'presence' }, { family: 'responsive' }, { family: 'resilience' }, { family: 'auth' } ], table: { paginated: false }, resilience: { offline: true }, responsive: { breakpoints: ['md'] }, auth: { roles: ['user'], unauthRedirect: '/login' } };
  }
  const md = emitManualMarkdown(copy, { filterTip: tip, includeGeneralOnly: true, title: `Plan de testare — ${tip}` });
  const tmp = path.join(process.cwd(), `reports/__tmp_${tip}_Manual.md`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, md, 'utf8');
  const manItems = loadManual(tmp);
  const cov = loadCoverage(path.join(project, 'standards/coverage', `${tip}.yaml`));
  const res = score(cov, manItems, tip);
  console.log(JSON.stringify({ tip, percent: res.overall.percent, missing: res.missing, extra: res.extra.slice(0,5) }, null, 2));
}

const tip = process.argv[2] || 'Vizualizare';
run(tip);


