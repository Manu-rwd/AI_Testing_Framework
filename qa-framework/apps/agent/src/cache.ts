import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ensureDir, resolvePath } from './util/env.js';

export type CacheEntry = {
  key: string;
  createdAt: string;
  model: string;
  payloadHash: string;
  response: unknown;
};

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function buildCacheKey(parts: Record<string, unknown>): string {
  const stable = JSON.stringify(parts, Object.keys(parts).sort());
  return sha256(stable);
}

export class JsonCache {
  private dir: string;

  constructor(dir = 'qa-framework/data/agent/cache') {
    this.dir = resolvePath(dir);
    ensureDir(this.dir);
  }

  private fileFor(key: string): string {
    return path.join(this.dir, `${key}.json`);
  }

  get<T = unknown>(key: string): T | null {
    const file = this.fileFor(key);
    if (!fs.existsSync(file)) return null;
    try {
      const txt = fs.readFileSync(file, 'utf8');
      return JSON.parse(txt) as T;
    } catch {
      return null;
    }
  }

  set(key: string, value: unknown) {
    const file = this.fileFor(key);
    fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
  }
}


