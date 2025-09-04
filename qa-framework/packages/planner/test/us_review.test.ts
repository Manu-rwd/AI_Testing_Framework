import path from "node:path";
import fs from "node:fs";
import { normalizeUSFromFile } from "../src/us-review/normalize";
import { computeConfidence, DEFAULT_WEIGHTS } from "../src/us-review/confidence";
import { applyProjectFallbacks } from "../src/us-review/applyProject";

const usPath = path.resolve(__dirname, "fixtures/us/basic_us.txt");

function assert(cond: any, msg: string) {
  if (!cond) { throw new Error("Test failed: " + msg); }
}

(async () => {
  const n0 = normalizeUSFromFile(usPath, { strict: true });
  assert(n0.buckets.length >= 1, "should detect at least one bucket (Formular/Tabel)");
  assert(n0.fields.length >= 2, "should detect fields");
  const hasRegex = n0.fields.some(f => !!f.regex);
  assert(hasRegex, "should detect at least one field with regex");

  const c0 = computeConfidence(n0, DEFAULT_WEIGHTS);
  assert(c0.overall > 0 && c0.overall <= 1, "confidence overall within (0,1]");

  // If a project example exists, ensure it can fill missing data & increase confidence
  const proj = path.resolve(process.cwd(), "projects/example");
  if (fs.existsSync(proj)) {
    const n1 = applyProjectFallbacks(n0, proj);
    const c1 = n1.confidence!;
    assert(c1.overall >= c0.overall, "confidence should not decrease after project fallback");
    const anyProjectSource = n1.fields.some(f => f.source === "project")
      || n1.buckets.some(b => b.source === "project")
      || n1.permissions.some(p => p.source === "project");
    assert(anyProjectSource, "should tag project-sourced items with source=project");
  }

  console.log("OK - US Review");
})().catch(e => {
  console.error(e);
  process.exit(1);
});


