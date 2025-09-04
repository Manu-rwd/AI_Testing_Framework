#!/usr/bin/env node
import path from "node:path";
import { repoRoot } from "./util/paths";
import fs from "fs-extra";
import { runPlanner } from "./engine";
import { emitMarkdown } from "./emit/markdown";
import { emitCSV } from "./emit/csv";
// --- [US Review precheck integration - additive] ---
const argv = process.argv.slice(2);
const hasReviewPrecheck = argv.includes("--review-precheck");
let minConfidenceIdx = argv.indexOf("--min-confidence");
const minConfidence = minConfidenceIdx >= 0 ? Number(argv[minConfidenceIdx + 1]) : 0.6;

let usPathIdx = argv.indexOf("--us");
const usPathFromFlag = usPathIdx >= 0 ? argv[usPathIdx + 1] : undefined;

let projectIdx = argv.indexOf("--project");
const projectPathFromFlag = projectIdx >= 0 ? argv[projectIdx + 1] : undefined;

const strictFlag = argv.includes("--strict") && !argv.includes("--lax");
// --- [end precheck integration] ---

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
  if (hasReviewPrecheck) {
    const usFlag = usPathFromFlag;
    if (!usFlag) {
      console.error("US Review precheck necesită --us <path>.");
      process.exit(1);
    }
    const { precheckUS } = await import("./engine_precheck");
    const res = await precheckUS({ usPath: path.resolve(repoRoot, usFlag), projectPath: projectPathFromFlag ? path.resolve(repoRoot, projectPathFromFlag) : undefined, minConfidence, strict: strictFlag, outDir: undefined });
    if (!res.ok) {
      console.error(`US Review gate a eșuat (${res.score} < ${minConfidence}). Consultați gaps: ${res.gapsPath}`);
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


