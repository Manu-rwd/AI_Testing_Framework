import fs from "fs-extra";
import path from "node:path";
import { automationPlanToCsvBuffer } from "../emit/automation_csv.js";
import { automationPlanToMarkdown } from "../emit/automation_md.js";

type AnyRow = Record<string, any>;

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (String(a).startsWith("--")) {
      const key = String(a).slice(2);
      const next = argv[i + 1];
      if (!next || String(next).startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = String(next);
        i++;
      }
    }
  }
  return args;
}

export async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const input = String(args.input || "");
  const moduleName = String(args.module || "");
  const csvOnly = Boolean(args["csv-only"]);
  const mdOnly = Boolean(args["md-only"]);
  const outDir = String(args.outDir || "qa-framework/exports");
  const docDir = String(args.docDir || "qa-framework/docs/modules");

  if (!input) {
    console.error("Usage: plan:emit --input <path> --module <name> [--outDir <path>] [--docDir <path>] [--csv-only|--md-only]");
    process.exit(2);
  }
  if (!moduleName) {
    console.error("--module <name> is required");
    process.exit(2);
  }

  if (!(await fs.pathExists(input))) throw new Error(`Input not found: ${input}`);
  const raw = JSON.parse(await fs.readFile(input, "utf8"));
  const rows: AnyRow[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.rows) ? raw.rows : []);
  const scoped = rows.some(r => typeof r.module === "string") ? rows.filter(r => r.module === moduleName) : rows;

  const outputs: string[] = [];
  if (!mdOnly) {
    await fs.ensureDir(outDir);
    const csvPath = path.join(outDir, `${moduleName}_Automation.csv`);
    const buf = automationPlanToCsvBuffer(scoped as any);
    await fs.writeFile(csvPath, buf);
    outputs.push(csvPath);
  }
  if (!csvOnly) {
    await fs.ensureDir(docDir);
    const mdPath = path.join(docDir, `${moduleName}_Automation.md`);
    const md = automationPlanToMarkdown(moduleName, scoped as any);
    await fs.writeFile(mdPath, md, "utf8");
    outputs.push(mdPath);
  }
  for (const p of outputs) console.log(path.resolve(p));
}

if (process.argv[1]?.endsWith("emit.js")) {
  // allow standalone run
  main().catch((err) => { console.error(err?.stack || String(err)); process.exit(1); });
}

export function registerEmitCmd(program: any) {
  program.register?.("plan:emit", async () => {
    await main();
  });
}


