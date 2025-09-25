import fs from "fs-extra";
import path from "node:path";
import { enrichRows } from "../v2/enrich.js";
import type { AutomationPlanRow } from "../emitter/automation/types.js";
import { emitAutomation } from "../emitter/automation/index.js";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    const a = typeof raw === "string" ? raw : String(raw ?? "");
    if (a && a.startsWith("--")) {
      const key = a.slice(2);
      const nraw = argv[i + 1];
      const next = typeof nraw === "string" ? nraw : undefined;
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

export default async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  const input = String(args.input || "");
  if (!input) throw new Error("--input <path> is required");
  const output = String(args.output || "tmp/enriched.plan.json");
  const project = typeof args.project === "string" ? String(args.project) : undefined;
  const usPath = typeof args.us === "string" ? String(args.us) : undefined;
  const doEmit = Boolean(args.emit);
  const moduleName = doEmit ? String(args.module || "") : "";
  const docDir = String(args.docDir || "docs/modules");
  const outDir = String(args.outDir || "exports");

  if (!(await fs.pathExists(input))) throw new Error(`Input not found: ${input}`);
  const rows: AutomationPlanRow[] = JSON.parse(await fs.readFile(input, "utf8"));
  const enriched = await enrichRows(rows, { projectPath: project, usPath });

  await fs.ensureDir(path.dirname(output));
  await fs.writeFile(output, JSON.stringify(enriched, null, 2));
  console.log(`Enriched plan written → ${output}`);

  if (doEmit) {
    if (!moduleName) throw new Error("--module <name> is required when --emit is used");
    const csvFile = path.join(outDir, `${moduleName}_Automation.csv`);
    const mdFile = path.join(docDir, `${moduleName}_Automation.md`);
    await emitAutomation(enriched, { csvFile, mdFile });
  }
}


