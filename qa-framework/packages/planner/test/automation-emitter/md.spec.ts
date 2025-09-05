import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { emitAutomationMd } from "../../src/emit/automation_md.js";

const planPath = path.join(process.cwd(), "packages/planner/test/emitter/automation/fixtures/plan.sample.json");

describe("automation emitter - MD", () => {
  it("writes MD with title, table, and atoms block", async () => {
    const rows: any[] = JSON.parse(await fs.readFile(planPath, "utf8"));
    const docDir = path.join(process.cwd(), "tmp_docs");
    const file = await emitAutomationMd(rows as any, { moduleName: "Accesare", docDir });
    expect(await fs.pathExists(file)).toBe(true);
    const md = await fs.readFile(file, "utf8");
    expect(md).toContain("# Plan de Automatizare — Accesare");
    expect(md).toContain("| tipFunctionalitate | bucket | feasibility | confidence | rule_tags |");
    // quick check fenced block
    expect(md).toContain("```");
  });
});


