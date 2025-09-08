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

// path anchors
const plannerRoot = path.resolve(__dirname, "..");
const distCli = path.resolve(plannerRoot, "dist/cli/index.js");

describe("CLI plan:emit e2e", () => {
  it("emits CSV and MD for Accesare", async () => {
    const input = path.resolve(plannerRoot, "test/selector-data-profiles/fixtures/plan.v2.sample.json");
    const outDocs = path.resolve(plannerRoot, "tmp_docs");
    const outCsv = path.resolve(plannerRoot, "tmp_exports");
    const res = await runNode("node", [distCli, "plan:emit", "--input", input, "--module", "Accesare", "--docDir", outDocs, "--outDir", outCsv]);
    expect(res.code).toBe(0);
    expect(await fs.pathExists(path.join(outCsv, "Accesare_Automation.csv"))).toBe(true);
    expect(await fs.pathExists(path.join(outDocs, "Accesare_Automation.md"))).toBe(true);
  }, 30000);
});


