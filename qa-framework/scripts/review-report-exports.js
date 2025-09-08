#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else out.push(p);
    }
  }
  return out;
}

function main() {
  const root = process.cwd();
  const base = path.join(root, 'qa-framework', 'tmp_exports');
  if (!fs.existsSync(base)) {
    process.exit(0);
  }
  const files = walk(base).filter(f => f.toLowerCase().endsWith('.csv'));
  if (!files.length) {
    process.exit(0);
  }
  const cli = path.join(root, 'qa-framework', 'packages', 'planner', 'dist', 'cli', 'index.js');
  for (const f of files) {
    const moduleName = path.basename(f).split('_')[0] || '';
    const args = [cli, 'plan:review:report', '--input', f];
    if (moduleName) args.push('--module', moduleName);
    const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
    // always continue; reporting should not fail pipeline
  }
  process.exit(0);
}

main();


