#!/usr/bin/env tsx
import path from "node:path";
import fs from "fs-extra";
import process from "node:process";

const REVIEW_COLUMNS = [
  "disposition",
  "feasibility",
  "selector_needs",
  "parameter_needs",
  "notes",
] as const;

type ReviewColumn = (typeof REVIEW_COLUMNS)[number];

type Flags = {
  sidecar?: boolean;
  pretty?: boolean;
  out?: string;
  backup?: boolean;
  delimiter?: string;
  encoding?: BufferEncoding;
  quiet?: boolean;
  files: string[];
};

function parseArgv(argv: string[]): Flags {
  const out: Flags = { files: [] } as any;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i] || "";
    if (a === "--sidecar") out.sidecar = true;
    else if (a === "--no-sidecar") out.sidecar = false;
    else if (a === "--pretty") out.pretty = true;
    else if (a === "--backup") out.backup = true;
    else if (a === "-q" || a === "--quiet") out.quiet = true;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    } else if (a === "--out") {
      out.out = String(argv[++i] || "");
    } else if (a === "--delimiter") {
      out.delimiter = String(argv[++i] || ",");
    } else if (a === "--encoding") {
      out.encoding = String(argv[++i] || "utf8") as BufferEncoding;
    } else if (a.startsWith("-")) {
      console.error(`Unknown option: ${a}`);
      process.exit(2);
    } else {
      out.files.push(a);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: review:extend [options] <files...>\n\nOptions:\n  --sidecar                Write <name>.review.json next to each CSV (default: false)\n  --pretty                 Pretty-print the JSON sidecar\n  --out <path>             Output file or directory (default: in-place)\n  --backup                 Create <file>.bak before writing in-place\n  --delimiter <char>       Force delimiter if auto-detect fails (e.g., ';' or ',')\n  --encoding <enc>         Input encoding (default: utf8)\n  -q, --quiet              Reduce logging\n  -h, --help`);
}

function detectHasBOM(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

function autoDetectDelimiter(headerLine: string): string {
  const comma = (headerLine.match(/,/g) || []).length;
  const semi = (headerLine.match(/;/g) || []).length;
  if (comma === 0 && semi === 0) return ","; // default
  return semi > comma ? ";" : ",";
}

function chooseEol(text: string): "\r\n" | "\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function splitRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        current += ch;
        i++;
        continue;
      }
    }
    if (!inQuotes && ch === "\r" && text[i + 1] === "\n") {
      rows.push(current);
      current = "";
      i += 2;
      continue;
    }
    if (!inQuotes && ch === "\n") {
      rows.push(current);
      current = "";
      i += 1;
      continue;
    }
    current += ch;
    i++;
  }
  rows.push(current);
  return rows;
}

function csvSplit(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function csvJoin(fields: string[], delimiter: string): string {
  return fields
    .map((f) => {
      const needsQuote = new RegExp(`["${delimiter}\\r\\n]`).test(f);
      if (needsQuote) {
        const escaped = f.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return f;
    })
    .join(delimiter);
}

const ID_COLUMNS = ["id", "case_id", "test_id", "uuid"];

function computeMissingColumns(header: string[]): ReviewColumn[] {
  const set = new Set(header);
  const missing: ReviewColumn[] = [] as any;
  for (const c of REVIEW_COLUMNS) if (!set.has(c)) missing.push(c);
  return missing;
}

function normalizeSlashes(p: string): string { return p.replace(/\\/g, "/"); }

function isGlobPattern(p: string): boolean { return /[*?\[]/.test(p); }

function globToRegExp(pattern: string): RegExp {
  // Normalize to forward slashes for matching
  let pat = normalizeSlashes(pattern);
  // Escape regex special chars
  pat = pat.replace(/[.+^${}()|]/g, "\\$&");
  // Handle **/
  pat = pat.replace(/\\\*\\\*\//g, "(?:(?:.*/))?");
  // Handle ** at end or mid
  pat = pat.replace(/\\\*\\\*/g, ".*");
  // Single * matches any non-separator
  pat = pat.replace(/(?<!\\)\*/g, "[^/]*");
  // ? matches single non-separator
  pat = pat.replace(/(?<!\\)\?/g, "[^/]");
  return new RegExp("^" + pat + "$");
}

async function walkFiles(dir: string, list: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkFiles(full, list);
    else list.push(full);
  }
  return list;
}

async function* expandInputs(inputs: string[]): AsyncGenerator<string> {
  const base = process.cwd();
  for (const input of inputs) {
    const abs = path.isAbsolute(input) ? input : path.resolve(base, input);
    if (abs.includes("**")) {
      const before = abs.split("**")[0] || base;
      const files = await walkFiles(before);
      const rx = globToRegExp(normalizeSlashes(abs));
      for (const f of files) {
        const cand = normalizeSlashes(path.resolve(f));
        if (rx.test(cand)) yield path.resolve(f);
      }
      continue;
    }
    if (abs.includes("*") || abs.includes("?")) {
      const dir = path.dirname(abs);
      const pat = path.basename(abs);
      const rx = globToRegExp(normalizeSlashes(pat));
      const entries = await fs.readdir(dir).catch(() => [] as string[]);
      for (const name of entries) {
        const testName = normalizeSlashes(name);
        if (rx.test(testName)) yield path.join(dir, name);
      }
      continue;
    }
    const stat = await fs.stat(abs).catch(() => undefined);
    if (!stat) continue;
    if (stat.isDirectory()) {
      const files = await walkFiles(abs);
      for (const f of files) if (/\.csv$/i.test(f)) yield f;
    } else {
      yield abs;
    }
  }
}

function buildSidecar(
  csvPath: string,
  header: string[],
  rows: string[][]
): any {
  const rel = path.relative(process.cwd(), csvPath);
  const cols = [...REVIEW_COLUMNS];
  const keyCol = ID_COLUMNS.find((c) => header.includes(c));
  const sidecarRows = rows.map((cells, idx) => {
    const entry: any = {
      index: idx,
      review: {
        disposition: "",
        feasibility: "",
        selector_needs: "",
        parameter_needs: "",
        notes: "",
      },
    };
    if (keyCol) {
      const pos = header.indexOf(keyCol);
      entry.key = cells[pos] ?? "";
    }
    return entry;
  });
  return {
    file: rel,
    generatedAt: new Date().toISOString(),
    columns: cols,
    rows: sidecarRows,
  };
}

export async function processOne(
  inputCsvPath: string,
  flags: Flags
): Promise<{ changed: boolean; outPath: string }> {
  const buf = await fs.readFile(inputCsvPath);
  const hadBOM = detectHasBOM(buf);
  const encoding = flags.encoding ?? "utf8";
  const textAll = buf.toString(encoding);
  const text = hadBOM ? textAll.slice(1) : textAll;
  const eol = chooseEol(textAll);
  const rowsRaw = splitRows(text);
  if (rowsRaw.length === 0) throw new Error(`Empty CSV: ${inputCsvPath}`);
  const headerLine = rowsRaw[0] || "";
  const delimiter = flags.delimiter ?? autoDetectDelimiter(headerLine);
  const header = csvSplit(headerLine, delimiter);
  const missing = computeMissingColumns(header);

  const outRows: string[] = [];
  // Append header columns by string concatenation to preserve original quoting
  if (missing.length > 0) {
    const suffix = delimiter + missing.join(delimiter);
    outRows.push(headerLine + suffix);
  } else {
    outRows.push(headerLine);
  }
  const dataRows: string[][] = [];
  for (let i = 1; i < rowsRaw.length; i++) {
    const line = rowsRaw[i] ?? "";
    if (line === "") { outRows.push(""); continue; }
    const cells = csvSplit(line, delimiter);
    dataRows.push(cells);
    const suffix = missing.length > 0 ? delimiter.repeat(missing.length) : "";
    outRows.push(line + suffix);
  }
  const outText = outRows.join(eol);
  const withBOM = hadBOM ? "\uFEFF" + outText : outText;

  // Decide output path
  let outPath = inputCsvPath;
  const writingInPlace = !flags.out;
  if (!writingInPlace) {
    const outRaw = path.resolve(flags.out!);
    const outStat = await fs.stat(outRaw).catch(() => undefined);
    if (outStat?.isDirectory() || flags.files.length > 1) {
      await fs.mkdir(outRaw, { recursive: true });
      outPath = path.join(outRaw, path.basename(inputCsvPath));
    } else {
      outPath = outRaw;
    }
  }

  const changed = missing.length > 0 || !writingInPlace; // if redirecting, we write
  if (!changed && !flags.sidecar) {
    if (!flags.quiet) console.log(`already extended: ${inputCsvPath}`);
    return { changed: false, outPath: inputCsvPath };
  }
  // If no CSV changes but sidecar requested, avoid rewriting CSV; only emit sidecar
  if (!changed && flags.sidecar) {
    const sidecar = buildSidecar(inputCsvPath, header, dataRows);
    const scPath = inputCsvPath.replace(/\.csv$/i, ".review.json");
    const json = flags.pretty ? JSON.stringify(sidecar, null, 2) : JSON.stringify(sidecar);
    await fs.writeFile(scPath, json, { encoding: "utf8" });
    return { changed: false, outPath: inputCsvPath };
  }

  if (writingInPlace) {
    if (flags.backup) {
      await fs.copyFile(inputCsvPath, inputCsvPath + ".bak");
    }
    await fs.writeFile(inputCsvPath, withBOM, { encoding });
    outPath = inputCsvPath;
  } else {
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, withBOM, { encoding });
  }

  if (flags.sidecar) {
    const sidecar = buildSidecar(outPath, header, dataRows);
    const scPath = outPath.replace(/\.csv$/i, ".review.json");
    const json = flags.pretty ? JSON.stringify(sidecar, null, 2) : JSON.stringify(sidecar);
    await fs.writeFile(scPath, json, { encoding: "utf8" });
  }

  return { changed: true, outPath };
}

async function main() {
  const flags = parseArgv(process.argv);
  if (!flags.files || flags.files.length === 0) {
    printHelp();
    process.exit(2);
  }

  const seen = new Set<string>();
  const targets: string[] = [];
  for await (const f of expandInputs(flags.files)) {
    const abs = path.resolve(f);
    if (seen.has(abs)) continue;
    if (!/\.csv$/i.test(abs)) continue;
    seen.add(abs);
    targets.push(abs);
  }
  if (targets.length === 0) {
    console.error("No CSV files matched inputs.");
    process.exit(2);
  }

  let hadError = false;
  for (const file of targets) {
    try {
      const res = await processOne(file, flags);
      if (!flags.quiet) {
        const tag = res.changed ? "updated" : "skipped";
        console.log(`${tag}: ${res.outPath}`);
      }
    } catch (err: any) {
      hadError = true;
      console.error(`Error processing ${file}: ${err?.message || String(err)}`);
    }
  }
  if (hadError) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("extend_csv.ts")) {
  main();
}


