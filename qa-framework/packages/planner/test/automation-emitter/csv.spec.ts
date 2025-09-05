import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { emitAutomationCsv } from "../../src/emit/automation_csv.js";

const planPath = path.join(process.cwd(), "packages/planner/test/emitter/automation/fixtures/plan.sample.json");

describe("automation emitter - CSV", () => {
  it("writes CSV with exact header and valid rows", async () => {
    const rows: any[] = JSON.parse(await fs.readFile(planPath, "utf8"));
    const outDir = path.join(process.cwd(), "tmp_exports");
    const file = await emitAutomationCsv(rows as any, { moduleName: "Accesare", outDir });
    expect(await fs.pathExists(file)).toBe(true);
    const content = await fs.readFile(file, "utf8");
    const lines = content.split(/\r?\n/).filter(Boolean);
    expect(lines[0]).toBe("module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes");
    expect(lines.length).toBeGreaterThan(1);
    // first row must be quoted properly (atoms JSON)
    expect(lines[1]).toContain("\"");
  });
});


