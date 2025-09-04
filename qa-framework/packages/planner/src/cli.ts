#!/usr/bin/env node
import path from "node:path";
import { repoRoot } from "./util/paths";
import fs from "fs-extra";
import { runPlanner } from "./engine";
import { emitMarkdown } from "./emit/markdown";
import { emitCSV } from "./emit/csv";
import { precheckUS } from "./engine_precheck";

const argv = process.argv.slice(2);
const hasPrecheck = argv.includes("--review-precheck");
const getFlag = (k: string, def?: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : def;
};
const strictFlag = argv.includes("--lax") ? false : true;
let type = "";
let rulesPath = path.join(repoRoot, "packages/rules/rules/adaugare.yaml");
let usPath = path.join(repoRoot, "input/us_and_test_cases.txt");
let outCsv = path.join(repoRoot, "exports/Plan_Adaugare.csv");
let outMd = path.join(repoRoot, "docs/modules/Plan_Adaugare.md");

for (let i = 0; i < argv.length; i += 2) {
  const k = argv[i], v = argv[i + 1];
  if (k === "--type") type = v;
  if (k === "--rules") rulesPath = path.resolve(repoRoot, v);
  if (k === "--us") usPath = path.resolve(repoRoot, v);
  if (k === "--out-csv") outCsv = path.resolve(repoRoot, v);
  if (k === "--out-md") outMd = path.resolve(repoRoot, v);
}

(async () => {
  if (hasPrecheck) {
    const usFlag = getFlag("--us");
    if (!usFlag) {
      console.error("Eroare: --us este obligatoriu pentru --review-precheck.");
      process.exit(1);
    }
    const projectFlag = getFlag("--project");
    const minc = parseFloat(getFlag("--min-confidence", "0.6")!);
    try {
      await precheckUS({ usPath: path.resolve(repoRoot, usFlag), projectPath: projectFlag ? path.resolve(repoRoot, projectFlag) : undefined, minConfidence: minc, strict: strictFlag });
    } catch (e: any) {
      console.error(String(e?.message || e));
      process.exit(2);
    }
  }
  if (!type) throw new Error("--type is required (e.g., Adaugare)");
  const { us, outputs } = await runPlanner({ rulesPath, usPath, type });
  const grouped = new Map<string, any[]>();
  for (const r of outputs) {
    const key = `${r._sheet}${r.bucket ? " — " + r.bucket : ""}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  await fs.mkdirp(path.dirname(outCsv));
  await fs.mkdirp(path.dirname(outMd));
  await emitCSV(outCsv, outputs);
  await emitMarkdown(outMd, type, grouped, us);
  console.log(`Plan generated → ${outCsv} & ${outMd}`);
})();


