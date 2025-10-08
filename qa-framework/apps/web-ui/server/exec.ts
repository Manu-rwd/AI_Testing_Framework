import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { manualOutputDir, qaRoot, repoRoot, refinedDir, agentEnvFile } from './paths.js';

function run(cmd: string, args: string[], options: { cwd?: string; env?: Record<string, string | undefined> } = {}): Promise<{ code: number; stdout: string; stderr: string; }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: options.env ? { ...process.env, ...options.env } : process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

function getPnpmCommand(): { cmd: string; prefixArgs: string[] } {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && /pnpm\.(cjs|js)$/i.test(npmExecPath)) {
    return { cmd: process.execPath, prefixArgs: [npmExecPath] };
  }
  if (process.platform === 'win32') {
    return { cmd: 'pnpm.cmd', prefixArgs: [] };
  }
  return { cmd: 'pnpm', prefixArgs: [] };
}

export async function runUsBridge(): Promise<{ ok: boolean; latestManual?: string; error?: string }> {
  const script = path.resolve(qaRoot, 'tools', 'us2manual.mjs');
  const args = [script, '--strict-spec', '--qa-style', '--no-provenance'];
  const result = await run(process.execPath, args, { cwd: qaRoot });
  if (result.code !== 0) {
    return { ok: false, error: result.stderr || result.stdout };
  }
  const latest = getMostRecentFile(manualOutputDir, [".md", ".txt"]);
  return { ok: !!latest, latestManual: latest ?? undefined, error: latest ? undefined : 'No manual generated' };
}

export type RefineParams = {
  us: string;
  gen: string;
  gold?: string;
  tip: string;
  module: string;
  outDir?: string;
};

export async function runRefine(params: RefineParams): Promise<{ ok: boolean; parity?: number | null; mdPath?: string; specPath?: string; raw?: string; error?: string }>{
  const outDir = params.outDir ?? refinedDir;
  const { cmd, prefixArgs } = getPnpmCommand();
  const args = [
    ...prefixArgs,
    '-C', 'qa-framework',
    '--filter', '@apps/agent',
    'exec', 'tsx', 'src/cli.ts', 'refine',
    '--us', path.resolve(params.us),
    '--gen', path.resolve(params.gen),
    '--tip', params.tip,
    '--module', params.module,
    '--outDir', path.resolve(outDir),
    '--maxIters', params.gold ? '4' : '2',
    '--use-cache'
  ];
  if (params.gold) {
    args.push('--gold', path.resolve(params.gold));
  }
  const env: Record<string, string | undefined> = { ...process.env };
  try {
    if (fs.existsSync(agentEnvFile)) {
      const text = fs.readFileSync(agentEnvFile, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        if (!line || line.trim().startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx <= 0) continue;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key) env[key] = value;
      }
    }
  } catch {}
  const result = await run(cmd, args, { cwd: repoRoot, env });
  if (result.code !== 0) {
    return { ok: false, error: result.stderr || result.stdout };
  }
  let parity: number | null = null;
  let mdPath: string | undefined;
  let specPath: string | undefined;
  try {
    const json = JSON.parse(result.stdout);
    parity = typeof json.parity === 'number' ? json.parity : null;
    if (json.out?.md) mdPath = path.resolve(json.out.md);
    if (json.out?.spec) specPath = path.resolve(json.out.spec);
  } catch {
    // Fallback: probe latest files in refinedDir
    mdPath = getMostRecentFile(outDir, ['.md']) ?? undefined;
    specPath = getMostRecentFile(outDir, ['.yaml', '.yml', '.json']) ?? undefined;
  }
  return { ok: true, parity, mdPath, specPath, raw: result.stdout };
}

export function spawnTrainBackground(): boolean {
  try {
    const { cmd, prefixArgs } = getPnpmCommand();
    const args = [
      ...prefixArgs,
      '-C', 'qa-framework',
      'run', 'agent:train',
      '--', '--embeddings'
    ];
    const env: Record<string, string | undefined> = { ...process.env };
    try {
      if (fs.existsSync(agentEnvFile)) {
        const text = fs.readFileSync(agentEnvFile, 'utf8');
        for (const line of text.split(/\r?\n/)) {
          if (!line || line.trim().startsWith('#')) continue;
          const idx = line.indexOf('=');
          if (idx <= 0) continue;
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim();
          if (key) env[key] = value;
        }
      }
    } catch {}
    const child = spawn(cmd, args, {
      cwd: repoRoot,
      env,
      stdio: 'ignore',
      detached: true,
      shell: false
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function getMostRecentFile(dir: string, exts: string[]): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => exts.some(e => f.toLowerCase().endsWith(e)))
    .map(f => path.join(dir, f))
    .filter(f => fs.existsSync(f) && fs.statSync(f).isFile())
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] ?? null;
}


