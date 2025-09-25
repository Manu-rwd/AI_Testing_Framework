import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { execa } from "node:child_process";

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

describe("CLI plan:enrich e2e", () => {
  it("produces enriched JSON and emits CSV/MD", async () => {
    const tmp = path.join(process.cwd(), "tmp_cli");
    await fs.emptyDir(tmp);
    const input = path.join(tmp, "plan.v2.sample.json");
    await fs.copyFile(path.join(process.cwd(), "test/selector-data-profiles/fixtures/plan.v2.sample.json"), input);

    const bin = path.join(process.cwd(), "dist/cli/index.js");
    const project = path.join(process.cwd(), "projects/example");
    const outJson = path.join(tmp, "plan.enriched.json");

    let res = await runNode("node", [bin, "plan:enrich", "--input", input, "--output", outJson, "--project", project]);
    expect(res.code).toBe(0);
    expect(await fs.pathExists(outJson)).toBe(true);

    res = await runNode("node", [bin, "plan:enrich", "--input", input, "--project", project, "--emit", "--module", "Accesare", "--docDir", "tmp_docs", "--outDir", "tmp_exports"]);
    expect(res.code).toBe(0);
    expect(await fs.pathExists("tmp_exports/Accesare_Automation.csv")).toBe(true);
    expect(await fs.pathExists("tmp_docs/Accesare_Automation.md")).toBe(true);
    const csv = await fs.readFile("tmp_exports/Accesare_Automation.csv", "utf8");
    expect(csv).toContain("selector_strategy");
    expect(csv).toContain("data_profile");
  }, 30000);
});


