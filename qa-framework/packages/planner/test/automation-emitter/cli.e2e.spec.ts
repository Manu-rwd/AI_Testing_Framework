import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";

function runNode(cmd: string, args: string[], opts: any = {}) {
  return new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
    const proc = require("child_process").spawn(cmd, args, { shell: process.platform === "win32", stdio: ["ignore","pipe","pipe"], ...opts });
    let stdout = ""; let stderr = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code: number) => resolve({ stdout, stderr, code: code ?? 0 }));
    proc.on("error", reject);
  });
}

describe("CLI plan:emit e2e", () => {
  it("emits CSV and MD for Accesare", async () => {
    const bin = path.join(process.cwd(), "packages/planner/dist/cli/index.js");
    const input = path.join(process.cwd(), "packages/planner/test/selector-data-profiles/fixtures/plan.v2.sample.json");
    const res = await runNode("node", [bin, "plan:emit", "--input", input, "--module", "Accesare", "--docDir", "tmp_docs", "--outDir", "tmp_exports"]);
    expect(res.code).toBe(0);
    expect(await fs.pathExists("tmp_exports/Accesare_Automation.csv")).toBe(true);
    expect(await fs.pathExists("tmp_docs/Accesare_Automation.md")).toBe(true);
  }, 30000);
});


