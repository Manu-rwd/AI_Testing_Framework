import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';

export function getEnv(name: string, def?: string): string {
  const v = process.env[name] ?? def;
  if (v == null || v === '') throw new Error(`Missing required env: ${name}`);
  return v;
}

export function resolvePath(p: string): string {
  if (!p) return p;
  if (path.isAbsolute(p)) return p;
  return path.resolve(process.cwd(), p);
}

export function ensureDir(dir: string) {
  const full = resolvePath(dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
}

export function normalizeDiacritics(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}


