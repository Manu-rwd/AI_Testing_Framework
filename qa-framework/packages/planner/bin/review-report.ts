#!/usr/bin/env tsx
import path from "node:path";
import process from "node:process";
import { buildMarkdownFragment, upsertAccesareDoc } from "../src/review/report";
import { validateBucketsStrict } from "../src/review/validateBuckets";

function parseArgs(argv: string[]): { csv?: string; out?: string } {
  const out: any = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i] || "";
    if (a === "--csv") out.csv = String(argv[++i] || "");
    else if (a === "--out") out.out = String(argv[++i] || "");
    else if (a === "-h" || a === "--help") { printHelp(); process.exit(0); }
  }
  return out;
}

function printHelp() { console.log(`Usage: review-report --csv <path> --out <docs/modules/Accesare.md>`); }

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.csv || !flags.out) { printHelp(); process.exit(2); }
  const csv = path.resolve(flags.csv);
  const outDoc = path.resolve(flags.out);
  let validateSummary: string | undefined;
  // Try load default US path relative to repo (prefer docs/us fallback to exports)
  try {
    const usPref = path.resolve(process.cwd(), "docs/us/US_Normalized.yaml");
    const usFallback = path.resolve(process.cwd(), "exports/US_Normalized.yaml");
    const useUs = usPref;
    const res = await validateBucketsStrict({ csvPath: csv, usPath: useUs });
    validateSummary = (res as any).ok ? "Verified" : "Eșec";
  } catch {
    validateSummary = undefined;
  }
  const fragment = await buildMarkdownFragment(csv, validateSummary);
  const approved = validateSummary === "Verified";
  await upsertAccesareDoc(outDoc, fragment, approved);
  console.log(`updated: ${outDoc}`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });


