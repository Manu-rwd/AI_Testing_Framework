import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { CsvContext } from "./types.js";

// --- BOM / EOL detection ---
export function hasUTF8BOM(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

export function detectEOL(text: string): "CRLF" | "LF" | "MIXED" | "NONE" {
  if (!text.length) return "NONE";
  const crlf = (text.match(/\r\n/g) || []).length;
  const loneLF = (text.replace(/\r\n/g, "").match(/\n/g) || []).length;
  if (crlf && loneLF) return "MIXED";
  if (crlf) return "CRLF";
  if (loneLF) return "LF";
  return "NONE";
}

// --- RFC4180 CSV parsing (minimal, strict) ---
export function parseCsvRFC4180(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, field = "", record: string[] = [];
  const len = text.length;
  const commitField = () => { record.push(field); field = ""; };
  const commitRecord = () => { rows.push(record); record = []; };

  while (i < len) {
    const ch = text[i];
    if (ch === '"') {
      // quoted field
      i++;
      while (i < len) {
        const c2 = text[i];
        if (c2 === '"') {
          // doubled quote?
          if (i + 1 < len && text[i + 1] === '"') {
            field += '"'; i += 2; continue;
          } else {
            i++; // closing quote
            break;
          }
        }
        field += c2; i++;
      }
      // after quoted field: comma or newline or end
      if (i < len && text[i] === ',') { commitField(); i++; continue; }
      if (i + 1 < len && text[i] === '\r' && text[i+1] === '\n') { commitField(); commitRecord(); i += 2; continue; }
      if (i < len && text[i] === '\n') { commitField(); commitRecord(); i += 1; continue; }
      if (i >= len) { commitField(); commitRecord(); break; }
      // any other char post-quote is invalid per RFC but we’ll treat as error by splitting later
    } else if (ch === ',') {
      commitField(); i++;
    } else if (ch === '\r' && i + 1 < len && text[i+1] === '\n') {
      commitField(); commitRecord(); i += 2;
    } else if (ch === '\n') {
      commitField(); commitRecord(); i += 1;
    } else {
      field += ch; i++;
    }
  }
  // trailing field if file doesn't end with newline
  if (field.length || record.length) { commitField(); commitRecord(); }
  // drop possible empty last row from trailing newline
  if (rows.length) {
    const last = rows[rows.length - 1];
    if ((last?.length === 1) && ((last?.[0] ?? "") === "")) rows.pop();
  }
  return rows;
}

// --- JSON helpers ---
export function isCompactJsonString(s: string): boolean {
  s = s.trim();
  if (!s) return true; // empty is allowed elsewhere by rule, this function is "compactness"
  try {
    const parsed = JSON.parse(s);
    const reStr = JSON.stringify(parsed);
    return reStr === s;
  } catch {
    return false;
  }
}

export function decimalsAtMost(s: string, max: number): boolean {
  const m = s.trim().match(/^[+-]?\d+(?:\.(\d+))?$/);
  if (!m) return false;
  const dec = m[1] || "";
  return dec.length <= max;
}

// --- small IO/glob helpers (no external deps) ---
function toRegexFromGlob(glob: string): RegExp {
  // normalize to posix-like
  const pat = glob.replace(/\\/g, "/")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§§DOUBLESTAR§§")
    .replace(/\*/g, "[^/]*")
    .replace(/§§DOUBLESTAR§§/g, ".*");
  return new RegExp("^" + pat + "$");
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    const entries = await fsp.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else out.push(p);
    }
  }
  return out;
}

export async function expandInputs(patterns: string[], cwd = process.cwd()): Promise<string[]> {
  const files = await walk(cwd);
  const norm = files.map(f => f.replace(/\\/g, "/"));
  const regs = patterns.flatMap(p => p.split(",")).map(p => toRegexFromGlob(p.trim().replace(/\\/g, "/")));
  const matched = norm.filter(f => regs.some(r => r.test(path.relative(cwd, f).replace(/\\/g, "/"))));
  return matched.length ? matched : patterns; // if nothing matched, return raw (assume direct file path)
}

export async function loadCsv(file: string): Promise<CsvContext> {
  const buffer = await fsp.readFile(file);
  const hasBOM = hasUTF8BOM(buffer);
  const text = hasBOM ? buffer.toString("utf8").slice(1) : buffer.toString("utf8");
  const eol = detectEOL(text);
  const rows = parseCsvRFC4180(text);
  const header = rows[0] || [];
  return { file, buffer, text, hasBOM, eol, rows, header };
}

export function pickCols(header: string[], row: string[], names: string[]): Record<string,string> {
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  const out: Record<string,string> = {};
  for (const n of names) out[n] = row[idx[n] ?? -1] ?? "";
  return out;
}

// Allow lists / constants
export const MODULE5_HEADER = [
  "module","tipFunctionalitate","bucket","narrative_ro","atoms",
  "selector_needs","selector_strategy","data_profile",
  "feasibility","source","confidence","rule_tags","notes",
] as const;

export const REVIEW_SUFFIX = [
  "review_disposition","feasibility","review_needs","review_notes","reviewer","reviewed_at",
] as const;

// Shared across modules (Module 9 validation and Module 10 review gate)
// Keep this single source of truth so the allowed set stays in sync.
export const REVIEW_DISPOSITION_ALLOWED = new Set([
  "ok",
  "needs-ids",
  "needs-roles",
  "needs-data",
  "skip",
  "ambiguous",
]);

export const SELECTOR_STRATEGY_ALLOWED = new Set([
  "data-testid-preferred","role-with-name","role","css","text"
]);

export const SELECTOR_NEEDS_ALLOWED = new Set([
  "needs-ids","needs-roles","needs-names","needs-data","needs-labels"
]);


