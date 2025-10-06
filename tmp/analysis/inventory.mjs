#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const repo = process.cwd();
const qafr = path.join(repo, 'qa-framework');

const walk = async (dir, depth = 2) => {
  const out = [];
  if (depth < 0) return out;
  let items = [];
  try {
    items = await fsp.readdir(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const it of items) {
    const full = path.join(dir, it.name);
    out.push({ path: full, dir: it.isDirectory() });
    if (it.isDirectory()) out.push(...await walk(full, depth - 1));
  }
  return out;
};

const readPkg = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const getWorkspaces = () => {
  const rootPkgPath = path.join(qafr, 'package.json');
  const rootPkg = fs.existsSync(rootPkgPath) ? readPkg(rootPkgPath) : {};
  const ws = new Set();
  const collect = obj => {
    if (!obj) return;
    for (const k of Object.keys(obj)) {
      if (k === 'packages') (obj[k] || []).forEach(p => ws.add(p));
      else if (typeof obj[k] === 'object') collect(obj[k]);
    }
  };
  collect(rootPkg.workspaces || rootPkg.pnpm);
  return { rootPkg, patterns: Array.from(ws) };
};

const resolvePackages = async (patterns) => {
  // naive glob: assume 'packages/*'
  const pkgsDir = path.join(qafr, 'packages');
  let dirs = [];
  try {
    dirs = (await fsp.readdir(pkgsDir, { withFileTypes: true }))
      .filter(d => d.isDirectory()).map(d => path.join(pkgsDir, d.name));
  } catch (_) {
    return [];
  }
  const results = [];
  for (const d of dirs) {
    const p = path.join(d, 'package.json');
    if (fs.existsSync(p)) {
      const pkg = readPkg(p);
      results.push({ dir: d, pkg });
    }
  }
  return results;
};

const depsMatrix = (pkgs) => {
  const nameToPkg = Object.fromEntries(pkgs.map(p => [p.pkg.name, p]));
  const edges = [];
  for (const { pkg } of pkgs) {
    const deps = { ...(pkg.dependencies||{}), ...(pkg.devDependencies||{}) };
    for (const dep of Object.keys(deps)) {
      if (nameToPkg[dep]) edges.push([pkg.name, dep]);
    }
  }
  return { edges };
};

const detectTests = async (dir) => {
  const patterns = [/\.test\.[tj]sx?$/, /__tests__/, /vitest\.config\.(t|j)s$/];
  let has = false;
  try {
    const files = await walk(dir, 3);
    for (const f of files) {
      if (patterns.some(p => p.test(f.path))) { has = true; break; }
    }
  } catch(_) {}
  return has;
};

const main = async () => {
  const map = {};
  map.repo = repo;
  map.tree = {
    root: await walk(repo, 2),
    qaFramework: await walk(qafr, 2),
  };
  const ws = getWorkspaces();
  map.workspaces = ws;
  const packages = await resolvePackages(ws.patterns);
  map.packages = [];
  for (const {dir, pkg} of packages) {
    const hasTs = fs.existsSync(path.join(dir, 'tsconfig.json'));
    const hasVitest = fs.existsSync(path.join(dir, 'vitest.config.ts')) || fs.existsSync(path.join(dir, 'vitest.config.js'));
    const hasDist = fs.existsSync(path.join(dir, 'dist'));
    const bin = pkg.bin || null;
    const scripts = pkg.scripts || {};
    const hasTests = hasVitest || await detectTests(dir);
    map.packages.push({ dir, pkg, hasTs, hasVitest, hasDist, bin, scripts, hasTests });
  }
  map.packages.sort((a,b)=> (a.pkg.name||'').localeCompare(b.pkg.name||''));
  map.graph = depsMatrix(packages);
  await fsp.mkdir(path.join(repo, 'tmp/analysis'), { recursive: true });
  await fsp.writeFile(path.join(repo, 'tmp/analysis/inventory.json'), JSON.stringify(map, null, 2), 'utf8');
  console.log('WROTE tmp/analysis/inventory.json');
};

main().catch(e => { console.error(e); process.exit(1); });


