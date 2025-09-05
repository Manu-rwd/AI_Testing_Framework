#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { repoRoot } from "../util/paths.js";
import { extendReviewColumns } from "../review/extend.js";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i] as string | undefined;
    const v = argv[i + 1];
    if (!k) continue;
    if (k.startsWith("--")) {
      if (!v || v.startsWith("--")) {
        out[k.slice(2)] = true;
      } else {
        out[k.slice(2)] = v;
        i++;
      }
    }
  }
  return out;
}

async function cmdInit(args: Record<string, string | boolean>) {
  const input = String(args.input || "");
  const inPlace = Boolean(args.inPlace);
  const outDirFlag = typeof args.outDir === "string" ? (args.outDir as string) : "";
  const columnsFlag = typeof args.columns === "string" ? (args.columns as string) : "";
  if (!input) {
    console.error("--input <path> is required");
    process.exit(1);
  }
  const resolvedInput = path.resolve(repoRoot, input);
  try {
    await fs.stat(resolvedInput);
  } catch {
    console.error(`Input file not found: ${resolvedInput}`);
    process.exit(2);
  }
  const outDir = outDirFlag ? path.resolve(repoRoot, outDirFlag) : undefined;
  const columns = columnsFlag ? columnsFlag.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  const { outputCsvPath } = await extendReviewColumns(resolvedInput, { inPlace, outDir, columns });
  console.log(outputCsvPath);
}

function safeCsvSplit(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function countBy(values: string[], allowed?: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) {
    const key = (v || "").trim();
    if (allowed && key && !allowed.includes(key)) continue;
    m.set(key, (m.get(key) || 0) + 1);
  }
  return m;
}

async function cmdSummary(args: Record<string, string | boolean>) {
  const input = String(args.input || "");
  const moduleName = String(args.module || "");
  const outFlag = typeof args.out === "string" ? (args.out as string) : "";
  if (!input) {
    console.error("--input <path> is required");
    process.exit(1);
  }
  if (!moduleName) {
    console.error("--module <name> is required");
    process.exit(1);
  }
  const resolvedInput = path.resolve(repoRoot, input);
  const mdOut = outFlag
    ? path.resolve(repoRoot, outFlag)
    : path.resolve(repoRoot, `docs/reviews/${moduleName}_Review_Summary.md`);
  let buf: Buffer;
  try {
    buf = await fs.readFile(resolvedInput);
  } catch {
    console.error(`Input file not found: ${resolvedInput}`);
    process.exit(2);
  }
  const text = buf.toString("utf8");
  const hasBOM = text.charCodeAt(0) === 0xfeff;
  const content = hasBOM ? text.slice(1) : text;
  function splitCsvRowsRFC(textIn: string): string[] {
    const rows: string[] = [];
    let current = "";
    let i = 0;
    let inQuotes = false;
    while (i < textIn.length) {
      const ch = textIn[i]!;
      if (ch === '"') {
        if (inQuotes && textIn[i + 1] === '"') {
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
      if (!inQuotes && ch === "\r" && textIn[i + 1] === "\n") {
        rows.push(current);
        current = "";
        i += 2;
        continue;
      }
      current += ch;
      i++;
    }
    rows.push(current);
    return rows;
  }
  const rows = splitCsvRowsRFC(content);
  const header = rows[0] || "";
  const headerCols = safeCsvSplit(header);
  const idxDisposition = headerCols.indexOf("review_disposition");
  const idxFeasibility = headerCols.indexOf("feasibility");
  const dataRows = rows.slice(1).filter((r) => r.length > 0);
  const dispositionValues: string[] = [];
  const feasibilityValues: string[] = [];
  for (const r of dataRows) {
    const cols = safeCsvSplit(r);
    if (idxDisposition >= 0) dispositionValues.push(cols[idxDisposition] || "");
    if (idxFeasibility >= 0) feasibilityValues.push(cols[idxFeasibility] || "");
  }
  const feasibilityOrder = ["A", "B", "C", "D", "E"];
  const dispositionOrder = [
    "ready",
    "needs-ids",
    "needs-roles",
    "blocked",
    "skip",
    "duplicate",
    "revisit",
  ];
  const feasCount = countBy(feasibilityValues, feasibilityOrder);
  const dispCount = countBy(dispositionValues, dispositionOrder);
  const timestamp = new Date().toISOString();
  const lines: string[] = [];
  lines.push(`# Review Summary: ${moduleName}`);
  lines.push("");
  lines.push(`Timestamp: ${timestamp}`);
  lines.push("");
  lines.push("## Feasibility Counts");
  lines.push("");
  lines.push("| Feasibility | Count |");
  lines.push("| --- | ---: |");
  let feasTotal = 0;
  for (const k of feasibilityOrder) {
    const n = feasCount.get(k) || 0;
    feasTotal += n;
    lines.push(`| ${k} | ${n} |`);
  }
  lines.push(`| Total | ${feasTotal} |`);
  lines.push("");
  lines.push("## Review Disposition Counts");
  lines.push("");
  lines.push("| Disposition | Count |");
  lines.push("| --- | ---: |");
  let dispTotal = 0;
  for (const k of dispositionOrder) {
    const n = dispCount.get(k) || 0;
    dispTotal += n;
    lines.push(`| ${k} | ${n} |`);
  }
  lines.push(`| Total | ${dispTotal} |`);
  await fs.mkdir(path.dirname(mdOut), { recursive: true });
  await fs.writeFile(mdOut, lines.join("\r\n"), "utf8");
  console.log(mdOut);
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0] || "";
  const args = parseArgs(argv.slice(1));
  if (command === "plan:review:init") {
    await cmdInit(args);
    return;
  }
  if (command === "plan:review:summary") {
    await cmdSummary(args);
    return;
  }
  console.error("Unknown command. Use plan:review:init or plan:review:summary");
  process.exit(1);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});


