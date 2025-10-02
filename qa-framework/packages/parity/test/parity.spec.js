import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadCoverage, loadManual, score } from '../src/score.ts';
const fx = (p)=>path.join(__dirname,'fixtures',p);

describe('Parity scorer JS smoke', () => {
  it('scores and returns objects', () => {
    const cov = loadCoverage(fx('Vizualizare.yaml'));
    const man = loadManual(fx('Vizualizare_Manual_ok.md'));
    const res = score(cov, man, 'Vizualizare');
    expect(typeof res.overall.percent).toBe('number');
  });
});


