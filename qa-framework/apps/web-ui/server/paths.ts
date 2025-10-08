import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findUpDirByName(targetDirName: string, startDir: string): string | null {
  let current: string = startDir;
  while (true) {
    if (path.basename(current) === targetDirName && fs.existsSync(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const qaRoot: string = findUpDirByName('qa-framework', __dirname) ?? path.resolve(process.cwd(), 'qa-framework');
export const repoRoot: string = path.dirname(qaRoot);

export const manualOutputDir: string = path.resolve(repoRoot, 'manual_output');
export const refinedDir: string = path.resolve(qaRoot, 'data/agent/refined');
export const reportsDir: string = path.resolve(qaRoot, 'data/agent/reports');
export const agentEnvFile: string = path.resolve(qaRoot, 'apps/agent/.env');
export const tmpUploadsDir: string = path.resolve(qaRoot, 'tmp_uploads');

for (const dir of [manualOutputDir, refinedDir, tmpUploadsDir, reportsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function isPathInside(childPath: string, parentPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}


