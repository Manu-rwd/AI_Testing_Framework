#!/usr/bin/env node
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

function main() {
  const file = process.argv[2] || '';
  const moduleName = process.argv[3] || '';
  if (!file) {
    console.error('Usage: node review-verify-one.js <csv> [module]');
    process.exit(2);
  }
  const cli = path.join(process.cwd(), 'qa-framework', 'packages', 'planner', 'dist', 'cli', 'index.js');
  if (!fs.existsSync(cli)) {
    console.error('Planner CLI not found. Run pnpm -w build first.');
    process.exit(2);
  }
  const args = [cli, 'plan:review:verify', '--input', path.resolve(file)];
  if (moduleName) args.push('--module', moduleName);
  const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
  process.exit(res.status || 0);
}

main();


