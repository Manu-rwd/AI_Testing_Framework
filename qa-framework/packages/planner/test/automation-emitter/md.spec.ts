import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { automationPlanToMarkdown } from "../../src/emit/automation_md.js";

const planPath = path.join(process.cwd(), "packages/planner/test/emitter/automation/fixtures/plan.sample.json");

describe("automation emitter - MD", () => {
  it("generates MD with title, table, and atoms block", async () => {
    const rows: any[] = JSON.parse(await fs.readFile(planPath, "utf8"));
    const md = automationPlanToMarkdown("Accesare", rows as any);
    expect(md).toContain("# Accesare: Plan de automatizare");
    expect(md).toContain("| tipFunctionalitate | bucket | feasibility | source | confidence | rule_tags |");
    // details delimiter
    expect(md).toContain("---");
    // fenced JSON block present
    expect(md).toContain("```json");
  });
});


