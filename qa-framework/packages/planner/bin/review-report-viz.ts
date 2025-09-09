#!/usr/bin/env tsx
import path from "node:path";
import process from "node:process";
import { buildMarkdownFragment, upsertModuleDoc } from "../src/review/report";

type Flags = {
  csv?: string;
  md?: string;
  approve?: boolean;
  scope?: string;
};

function parseArgs(argv: string[]): Flags {
  const out: Flags = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i] || "";
    if (a === "--csv") out.csv = String(argv[++i] || "");
    else if (a === "--md") out.md = String(argv[++i] || "");
    else if (a === "--scope") out.scope = String(argv[++i] || "");
    else if (a === "--approve") out.approve = true;
    else if (a === "-h" || a === "--help") { printHelp(); process.exit(0); }
  }
  return out;
}

function printHelp() {
  console.log("Usage: review-report-viz --csv <path> --md <path> [--approve] [--scope <text>]");
}

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.csv || !flags.md) { printHelp(); process.exit(2); }
  const csv = path.resolve(flags.csv);
  const md = path.resolve(flags.md);
  const moduleTitle = "Accesare (Vizualizare)";
  const scope = flags.scope || "Excel → Accesare → Vizualizare";

  const fragment = await buildMarkdownFragment(csv, undefined);
  const cheatsheet = [
    "# Open Vizualizare CSV for review",
    "Start-Process exports/Accesare_Vizualizare.csv",
  ].join("\n");
  const approved = Boolean(flags.approve);
  await upsertModuleDoc(md, moduleTitle, fragment, approved, cheatsheet, scope);
  console.log(`updated: ${md}`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });


