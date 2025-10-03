import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { score, loadCoverage, loadManual } from '../src/score';
import { emitManualMarkdown } from '../../manual-emitter/src/emit';

function runEmitter(plan: any, tip: string, title: string) {
  const md = emitManualMarkdown(plan, { filterTip: tip, includeGeneralOnly: true, title });
  return md;
}

describe('Parity E2E — Module16 tuned emitter', () => {
  const root = path.resolve(__dirname, '../../../..');
  const project = path.join(root, 'qa-framework/projects/example');
  const planPath = path.join(root, 'qa-framework/temp/merged_plan.json');
  const basePlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  it('Vizualizare reaches >=95%', () => {
    const tip = 'Vizualizare';
    const plan = getPlanWithUiux(basePlan, tip);
    const md = runEmitter(plan, tip, 'Plan de testare — Vizualizare');
    const manItems = loadManual(writeTempManual(md, tip));
    const covItems = loadCoverage(path.join(project, 'standards/coverage', `${tip}.yaml`));
    const res = score(covItems, manItems, tip);
    expect(res.overall.percent).toBeGreaterThanOrEqual(95);
    expect(res.overall.pass).toBe(true);
  });

  it('Adaugare reaches >=95%', () => {
    const tip = 'Adaugare';
    const plan = getPlanWithUiux(basePlan, tip);
    const md = runEmitter(plan, tip, 'Plan de testare — Adaugare');
    const manItems = loadManual(writeTempManual(md, tip));
    const covItems = loadCoverage(path.join(project, 'standards/coverage', `${tip}.yaml`));
    const res = score(covItems, manItems, tip);
    expect(res.overall.percent).toBeGreaterThanOrEqual(95);
    expect(res.overall.pass).toBe(true);
  });

  it('Modificare reaches >=95%', () => {
    const tip = 'Modificare';
    const plan = getPlanWithUiux(basePlan, tip);
    const md = runEmitter(plan, tip, 'Plan de testare — Modificare');
    const manItems = loadManual(writeTempManual(md, tip));
    const covItems = loadCoverage(path.join(project, 'standards/coverage', `${tip}.yaml`));
    const res = score(covItems, manItems, tip);
    expect(res.overall.percent).toBeGreaterThanOrEqual(95);
    expect(res.overall.pass).toBe(true);
  });
});

function writeTempManual(md: string, tip: string) {
  const f = path.join(process.cwd(), `reports/__tmp_${tip}_Manual.md`);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, md, 'utf8');
  return f;
}

function getPlanWithUiux(plan: any, tip: string) {
  const copy = JSON.parse(JSON.stringify(plan));
  const lower = (tip || '').toLowerCase();
  if (lower === 'vizualizare') {
    copy.uiux = {
      tip: 'Vizualizare',
      overlays: [ { family: 'presence' }, { family: 'columns' }, { family: 'sorting' }, { family: 'pagination' }, { family: 'responsive' }, { family: 'resilience' }, { family: 'auth' } ],
      columns: [
        { label: 'Nume', sortable: true, header: { visible: true, align: 'left' }, value: { format: 'text' } },
      ],
      table: { paginated: true, stickyHeader: true, columnVisibilityMenu: true },
      resilience: { offline: true, slow: true, loadingSLAms: 2000, dropOnAccess: true, dropDuringAction: true },
      responsive: { breakpoints: ['md'] },
      pagination: { sizes: [10,25,50] },
      auth: { roles: ['admin','user'], unauthRedirect: '/login' }
    };
  } else {
    copy.uiux = {
      tip,
      overlays: [ { family: 'presence' }, { family: 'responsive' }, { family: 'resilience' }, { family: 'auth' } ],
      table: { paginated: false },
      resilience: { offline: true },
      responsive: { breakpoints: ['md'] },
      auth: { roles: ['user'], unauthRedirect: '/login' }
    };
  }
  return copy;
}


