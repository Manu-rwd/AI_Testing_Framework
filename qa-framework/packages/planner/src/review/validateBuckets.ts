import fs from "fs-extra";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

type Policy = "strict";

function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const rows: string[] = [];
  let cur = "";
  let i = 0;
  let inQ = false;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i += 2; continue; }
      inQ = !inQ; cur += ch; i++; continue;
    }
    if (!inQ && ch === "\r" && text[i + 1] === "\n") { rows.push(cur); cur = ""; i += 2; continue; }
    if (!inQ && ch === "\n") { rows.push(cur); cur = ""; i++; continue; }
    cur += ch; i++;
  }
  rows.push(cur);
  const split = (line: string): string[] => {
    const out: string[] = [];
    let s = ""; let q = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j] as string;
      if (c === '"') { if (q && line[j + 1] === '"') { s += '"'; j++; } else { q = !q; } continue; }
      if (c === "," && !q) { out.push(s); s = ""; continue; }
      s += c;
    }
    out.push(s);
    return out;
  };
  const header = rows.length > 0 ? split(rows[0] || "") : [];
  const data = rows.slice(1).filter(r => r !== "").map(split);
  return { header, rows: data };
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

export async function validateBucketsStrict(args: {
  csvPath: string;
  usPath: string;
}): Promise<{ ok: true; total: number; uniqueBuckets: string[] } | { ok: false; message: string }> {
  const csvBuf = await fs.readFile(args.csvPath);
  const txtAll = csvBuf.toString("utf8");
  const txt = txtAll.charCodeAt(0) === 0xfeff ? txtAll.slice(1) : txtAll;
  const { header, rows } = parseCsv(txt);
  const lower = header.map(h => h.toLowerCase());
  const bucketIdx = lower.indexOf("bucket");
  if (bucketIdx < 0) return { ok: false, message: `CSV nu conține coloana 'bucket' (insensibil la majuscule)` };

  const ymlText = await fs.readFile(args.usPath, { encoding: "utf8" });
  const y = YAML.parse(ymlText);
  let allowed: string[] = [];
  if (Array.isArray(y?.buckets)) {
    allowed = y.buckets.map((b: any) => typeof b === "string" ? b : (b?.name ? String(b.name) : "")).filter(Boolean);
  }
  if (allowed.length === 0) return { ok: false, message: `US nu conține lista 'buckets'` };

  const violations: { row: number; bucket: string }[] = [];
  const seen: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const bucket = rows[i]?.[bucketIdx] ?? "";
    if (bucket) seen.push(bucket);
    if (bucket && !allowed.includes(bucket)) violations.push({ row: i + 2, bucket }); // +2 for 1-based and header
  }
  if (violations.length > 0) {
    const lines = [
      `Conformitate strictă bucket: EȘEC`,
      `Bucăți nepermise (rând -> bucket):`,
      ...violations.map(v => `  ${v.row} -> ${v.bucket}`)
    ];
    return { ok: false, message: lines.join("\n") };
  }
  return { ok: true, total: rows.length, uniqueBuckets: uniq(seen) };
}


