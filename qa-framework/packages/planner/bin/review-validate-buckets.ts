#!/usr/bin/env tsx
import path from "node:path";
import process from "node:process";
import { validateBucketsStrict } from "../src/review/validateBuckets";

function parseArgs(argv: string[]): { csv?: string; us?: string; project?: string; policy?: string } {
  const out: any = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i] || "";
    if (a === "--csv") out.csv = String(argv[++i] || "");
    else if (a === "--us") out.us = String(argv[++i] || "");
    else if (a === "--project") out.project = String(argv[++i] || "");
    else if (a === "--policy") out.policy = String(argv[++i] || "");
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: review-validate-buckets --csv <path> --us <path> [--policy strict]`);
}

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.csv || !flags.us) { printHelp(); process.exit(2); }
  const csv = path.resolve(flags.csv);
  const us = path.resolve(flags.us);
  const policy = (flags.policy || "strict").toLowerCase();
  if (policy !== "strict") { console.error(`Unsupported policy: ${policy}`); process.exit(2); }
  const res = await validateBucketsStrict({ csvPath: csv, usPath: us });
  if ((res as any).ok === true) {
    const ok = res as any;
    console.log(`Conformitate strictă bucket: OK`);
    console.log(`Rânduri: ${ok.total}; Bucket-uri unice: ${ok.uniqueBuckets.length}`);
    process.exit(0);
  } else {
    const err = res as any;
    console.error(err.message);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });


