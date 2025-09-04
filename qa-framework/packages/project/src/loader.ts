import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ProjectProfile, ProjectProfile as ProjectProfileType } from './types';

function findDataProjectsDir(startDir: string): string | null {
  // Walk up to find a 'data/projects' directory
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'data', 'projects');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function loadProjectProfile(projectId?: string): Promise<ProjectProfileType> {
  const cwd = process.cwd();
  const fromCwd = path.resolve(cwd, 'data', 'projects');
  const found = existsSync(fromCwd) ? fromCwd : findDataProjectsDir(cwd);
  const dataDir = found ?? fromCwd;
  const candidates: string[] = [];

  if (projectId) {
    candidates.push(path.join(dataDir, `${projectId}.project.yaml`));
    candidates.push(path.join(dataDir, `${projectId}.project.yml`));
    candidates.push(path.join(dataDir, `${projectId}.project.json`));
  }
  candidates.push(path.join(dataDir, 'default.project.yaml'));

  for (const file of candidates) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = file.endsWith('.json') ? JSON.parse(raw) : YAML.parse(raw);
      const validated = ProjectProfile.parse(parsed);
      return validated;
    } catch (err) {
      // try next candidate
    }
  }
  throw new Error('Nicio configurație de proiect nu a fost găsită (nici măcar default.project.yaml).');
}


