#!/usr/bin/env tsx
import path from "node:path";
import process from "node:process";
import { processOne } from "../src/review/extend_csv";

function parseArgs(argv: string[]): { input?: string; out?: string } {
  const out: { input?: string; out?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i] || "";
    if (a === "--in") out.input = String(argv[++i] || "");
    else if (a === "--out") out.out = String(argv[++i] || "");
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: review-extend-csv --in <csv> [--out <csv|dir>]\n\nExtinde (idempotent) coloanele de review in CSV: disposition, feasibility, selector_needs, parameter_needs, notes.`);
}

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.input) {
    printHelp();
    process.exit(2);
  }
  const inPath = path.resolve(flags.input);
  const res = await processOne(inPath, {
    files: [inPath],
    out: flags.out ? path.resolve(flags.out) : undefined,
  } as any);
  if (res.changed) console.log(`updated: ${res.outPath}`);
  else console.log(`already extended: ${res.outPath}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});


