import * as path from "node:path";
import * as fs from "node:fs/promises";
import { expandInputs } from "../validate/utils.js";
import { RuleId, ValidateResult } from "../validate/types.js";
import { validateFile } from "../validate/index.js";

function parseArgs(argv: string[]) {
  const out: any = { input: "", rules: "", format: "text", module: "" };
  for (let i=0;i<argv.length;i++){
    const a = argv[i];
    if (a === "--input") out.input = argv[++i] ?? "";
    else if (a === "--rules") out.rules = argv[++i] ?? "";
    else if (a === "--format") out.format = (argv[++i] ?? "text") as "text"|"json";
    else if (a === "--module") out.module = argv[++i] ?? "";
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0] || "";
  const args = command === "plan:validate" ? parseArgs(argv.slice(1)) : parseArgs(argv);
  if (!args.input) {
    console.error("Usage: plan:validate --input <csvOrGlob>[,<csvOrGlob>...] [--rules <commaList>] [--format text|json] [--module Name]");
    process.exit(2);
  }
  const patterns = args.input.split(",").map((s:string)=>s.trim()).filter(Boolean);
  const cwd = process.cwd();
  const files0 = await expandInputs(patterns, cwd);
  // filter to .csv
  const files = files0.filter(f => f.endsWith(".csv"));
  const selected: RuleId[] | undefined = args.rules ? args.rules.split(",").map((x:string)=>x.trim()).filter(Boolean) as RuleId[] : undefined;

  const results: ValidateResult[] = [];
  for (const f of files) {
    const r = await validateFile(path.resolve(cwd, f), selected, { module: args.module });
    results.push(r);
  }
  const all = results.flatMap(r => r.issues);
  if (args.format === "json") {
    console.log(JSON.stringify({ results, totals: { files: files.length, issues: all.length } }, null, 2));
  } else {
    for (const r of results) {
      console.log(path.relative(cwd, r.file));
      if (!r.issues.length) { console.log("  OK\n"); continue; }
      for (const i of r.issues) {
        const loc = [i.row ? `row ${i.row}` : "", i.col ? `col ${i.col}` : ""].filter(Boolean).join(", ");
        console.log(`  [${i.level}] ${i.code} ${loc} — ${i.message}`);
      }
      console.log("");
    }
    console.log(`Totals: files=${files.length} issues=${all.length}`);
  }
  process.exit(all.length ? 1 : 0);
}

main().catch((e)=>{ console.error(e); process.exit(1); });


