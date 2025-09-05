#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { repoRoot } from "../util/paths.js";
import { emitAutomation } from "../emitter/automation/index.js";
import type { AutomationPlan } from "../emitter/automation/types.js";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    const v = argv[i + 1];
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

function validatePlanShape(plan: any): plan is AutomationPlan {
  if (!Array.isArray(plan)) return false;
  for (const r of plan) {
    if (!r) return false;
    const hasFields =
      typeof r.module === "string" &&
      typeof r.tipFunctionalitate === "string" &&
      typeof r.bucket === "string" &&
      typeof r.narrative_ro === "string" &&
      r.atoms && Array.isArray(r.atoms.setup) && Array.isArray(r.atoms.action) && Array.isArray(r.atoms.assert) &&
      typeof r.selector_needs === "string" &&
      typeof r.selector_strategy === "string" &&
      typeof r.data_profile === "string" &&
      typeof r.feasibility === "string" &&
      typeof r.source === "string" &&
      typeof r.confidence === "number" &&
      Array.isArray(r.rule_tags) &&
      typeof r.notes === "string";
    if (!hasFields) return false;
  }
  return true;
}

async function main() {
  const argv = parseArgs(process.argv.slice(2));
  const moduleName = String(argv.module || "");
  const inputPath = String(argv.input || "");
  const docDir = String(argv.docDir || "docs/modules");
  const outDir = String(argv.outDir || "exports");
  const csvFlag = typeof argv.csv === "string" ? (argv.csv as string) : "";
  const mdFlag = typeof argv.md === "string" ? (argv.md as string) : "";

  if (!moduleName) {
    console.error("--module <name> is required");
    process.exit(1);
  }
  if (!inputPath) {
    console.error("--input <path> is required");
    process.exit(1);
  }

  const resolvedInput = path.resolve(repoRoot, inputPath);
  let exists = true;
  try {
    await fs.stat(resolvedInput);
  } catch {
    exists = false;
  }
  if (!exists) {
    console.error(`Input file not found: ${resolvedInput}`);
    process.exit(2);
  }
  const raw = await fs.readFile(resolvedInput, "utf8");
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error("Input is not valid JSON");
    process.exit(2);
  }
  if (!validatePlanShape(json)) {
    console.error("Input JSON is not a valid AutomationPlan[] shape");
    process.exit(2);
  }

  const csvOut = csvFlag
    ? path.resolve(repoRoot, csvFlag)
    : path.resolve(repoRoot, `${outDir}/${moduleName}_Automation.csv`);
  const mdOut = mdFlag
    ? path.resolve(repoRoot, mdFlag)
    : path.resolve(repoRoot, `${docDir}/${moduleName}_Automation.md`);

  await emitAutomation(json, { csvFile: csvOut, mdFile: mdOut });
  console.log(`Automation emitted → CSV: ${csvOut}; MD: ${mdOut}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(3);
});


