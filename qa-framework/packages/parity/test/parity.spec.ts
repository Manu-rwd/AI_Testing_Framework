import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadCoverage, loadManual, score } from '../src/score';

const fx = (p:string)=>path.join(__dirname,'fixtures',p);

describe('Parity scorer', () => {
  it('passes with >=85% for Vizualizare when all match', () => {
    const cov = loadCoverage(fx('Vizualizare.yaml'));
    const man = loadManual(fx('Vizualizare_Manual_ok.md'));
    const res = score(cov, man, 'Vizualizare'); // visual tips threshold 85
    expect(res.overall.percent).toBe(100);
    expect(res.overall.pass).toBe(true);
    expect(res.missing.length).toBe(0);
    expect(res.extra.length).toBe(0);
    expect(res.mismatched.length).toBe(0);
  });

  it('computes missing/extra/mismatched and fails threshold when partial', () => {
    const cov = loadCoverage(fx('Vizualizare.yaml'));
    const man = loadManual(fx('Vizualizare_Manual_partial.md'));
    const res = score(cov, man, 'Vizualizare');
    // only happy matches but facets jaccard < 0.8 (2/3=0.66) -> mismatched, not counted
    expect(res.matched.length).toBe(0);
    expect(res.mismatched.length).toBe(1);
    expect(res.missing.length).toBe(2-0-1); // edge remains missing
    expect(res.extra.length).toBe(1);
    expect(res.overall.pass).toBe(false);
  });
});


