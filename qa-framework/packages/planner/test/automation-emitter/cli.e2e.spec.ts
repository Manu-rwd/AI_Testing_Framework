import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import { describe, it, expect } from "vitest";

describe("CLI plan:emit e2e", () => {
  it("emits CSV and MD for Accesare", async () => {
    // plannerRoot => .../qa-framework/packages/planner
    const plannerRoot = path.resolve(__dirname, "..", "..");
    // workspaceRoot => .../qa-framework (default out dirs live here)
    const workspaceRoot = path.resolve(plannerRoot, "..", "..");
    const distCli = path.resolve(plannerRoot, "dist/cli/index.js");

    const input   = path.resolve(plannerRoot, "test/emitter/automation/fixtures/plan.sample.json");
    const outCsv  = path.resolve(workspaceRoot, "tmp_exports");
    const outDocs = path.resolve(workspaceRoot, "tmp_docs");

    // ensure clean
    await fs.remove(outCsv);
    await fs.remove(outDocs);

    // Run from the workspace root so relative defaults line up
    await execa("node", [distCli, "plan:emit", "--input", input, "--module", "Accesare"], {
      cwd: workspaceRoot,
    });

    // Verify outputs in the real default locations
    expect(await fs.pathExists(path.join(outCsv,  "Accesare_Automation.csv"))).toBe(true);
    expect(await fs.pathExists(path.join(outDocs, "Accesare_Automation.md"))).toBe(true);
  }, 30_000);
});


