import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeUS } from "../src/us-review/normalize";
import { computeConfidence } from "../src/us-review/confidence";
import { applyProjectFallbacks } from "../src/us-review/applyProject";
import { it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const usPath = path.resolve(__dirname, "fixtures/us/basic_us.txt");
  const raw = await fs.promises.readFile(usPath, "utf8");
  let us = normalizeUS(raw, { strict: true });
  us = computeConfidence(us);

  if (us.buckets.length === 0) throw new Error("Expected at least one bucket.");
  if (us.fields.length === 0) throw new Error("Expected fields.");
  if (!us.fields.some(f => f.regex)) throw new Error("Expected at least one field with regex.");
  if (!(us.confidence.overall > 0 && us.confidence.overall <= 1)) throw new Error("Confidence out of range.");

  const exampleProject = path.resolve(process.cwd(), "projects", "example");
  if (fs.existsSync(exampleProject)) {
    const before = us.confidence.overall;
    const { us: merged } = applyProjectFallbacks(us, exampleProject);
    us = computeConfidence(merged);
    if (us.confidence.overall < before) throw new Error("Confidence should not decrease after project merge.");
  }

  console.log("OK - US Review");
}

main().catch(err => { console.error(err); process.exit(1); });

it("smoke", () => {});
