import assert from "node:assert";
import fs from "fs-extra";
import path from "node:path";
import { generatePlanV2 } from "../src/v2/generate";

async function run() {
  const type = "Adaugare";
  const rulesPath = path.resolve("packages/planner/test/fixtures/rules_v2/adaugare.yaml");
  const usPath = path.resolve("packages/planner/test/fixtures/us/us_normalized_min.yaml");
  const outCsv = path.resolve("exports/Plan_Adaugare_v2.csv");
  const outMd = path.resolve("docs/Plan_Adaugare_v2.md");

  // strict buckets
  const plan = await generatePlanV2({
    type,
    rulesPath,
    usPath,
    buckets: "strict",
    outCsv,
    outMd,
  });

  assert.ok(plan.rows.length >= 1, "Expected at least 1 row");
  const r0 = plan.rows[0];
  assert.ok(r0.atoms.setup.length + r0.atoms.action.length + r0.atoms.assert.length > 0, "AAA atoms should not be empty");
  assert.ok(["A","B","C","D","E"].includes(r0.feasibility), "Feasibility must be A..E");
  if (r0.selector_strategy.length > 0 && r0.data_profile.required.length > 0) {
    assert.ok(["A","B"].includes(r0.feasibility), "With selectors + data profile, feasibility tends to A/B");
  }
  assert.ok(["us","project","defaults"].includes(r0.source), "Source must be valid");
  assert.ok(r0.rule_tags.length >= 0, "rule_tags should exist");
  assert.ok(await fs.pathExists(outCsv), "CSV should be emitted");
  assert.ok(await fs.pathExists(outMd), "MD should be emitted");

  // lax buckets — rows should not decrease (if project adds buckets, keep/increase)
  const planLax = await generatePlanV2({
    type,
    rulesPath,
    usPath,
    buckets: "lax",
    outCsv,
    outMd,
  });
  assert.ok(planLax.rows.length >= plan.rows.length, "Lax buckets should not reduce row count");

  console.log("OK - Planner v2");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


