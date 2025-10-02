import { provenance } from "./provenance";
import type { MergeInputs, PlanModel, SourceTier } from "./types";

/**
 * Deterministic deep merge with precedence:
 * US > Project Standards > UI/UX Guide > Coverage Overlay > Defaults
 * - Objects: pick first defined by precedence, then deep-merge children.
 * - Arrays: pick first non-empty by precedence.
 * - Primitives: pick first defined by precedence.
 * Adds __prov per-leaf with { source, confidence_bump }.
 * Output is stable: keys sorted asc.
 */

const ORDER: SourceTier[] = ["us", "project", "uiux", "coverage", "defaults"];

function isObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function keysSorted(obj: any): string[] {
  return Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function deepMerge(inputs: MergeInputs): PlanModel {
  const stack: Partial<Record<SourceTier, any>> = inputs;

  function pickFirst(path: string[]): { val: any; src: SourceTier | null } {
    for (const tier of ORDER) {
      const root = stack[tier];
      const v = getIn(root, path);
      if (v !== undefined) return { val: v, src: tier };
    }
    return { val: undefined, src: null };
  }

  function getIn(obj: any, path: string[]): any {
    if (!obj) return undefined;
    let cur = obj;
    for (const p of path) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function setIn(obj: any, path: string[], value: any) {
    let cur = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i] as string;
      if (!isObject(cur[k])) cur[k] = {};
      cur = cur[k];
    }
    const lastKey = path[path.length - 1] as string;
    cur[lastKey] = value;
  }

  const out: any = {};

  // gather all keys present across inputs for a breadth-first deterministic walk
  function unionKeysAt(path: string[]): string[] {
    const s = new Set<string>();
    for (const tier of ORDER) {
      const root = stack[tier];
      const node = getIn(root, path);
      if (isObject(node)) keysSorted(node).forEach(k => s.add(k));
    }
    return Array.from(s).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  function walk(path: string[]) {
    const { val, src } = pickFirst(path);
    if (val === undefined) return;

    if (Array.isArray(val)) {
      // arrays: choose first non-empty by precedence (no provenance key per snapshot expectations)
      const chosen = val;
      setIn(out, path, chosen);
      return;
    }

    if (isObject(val)) {
      setIn(out, path, {});
      // merge children keys deterministically
      const ks = unionKeysAt(path);
      for (const k of ks) walk([...path, k]);
      return;
    }

    // primitive: take first found and add sibling provenance key with __prov suffix
    setIn(out, path, val);
    const last = path[path.length - 1];
    const siblingProvKey = `${last}__prov`;
    const parentPath = path.slice(0, -1);
    setIn(out, [...parentPath, siblingProvKey], src ? provenance(src) : { source: "defaults", confidence_bump: 0 });
  }

  // Top-level keys union
  const topKeys = new Set<string>();
  for (const tier of ORDER) {
    const node = (inputs as any)[tier];
    if (isObject(node)) keysSorted(node).forEach(k => topKeys.add(k));
  }
  Array.from(topKeys).sort().forEach(k => walk([k]));

  return out;
}

