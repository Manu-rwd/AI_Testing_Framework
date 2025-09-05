import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { repoRoot } from "../../../src/util/paths";
import child_process from "node:child_process";

describe("emit:automation CLI", () => {
  it("writes files to default locations and verifies CSV+MD", async () => {
    const tmpDocs = path.resolve(repoRoot, "tmp_docs");
    const tmpExports = path.resolve(repoRoot, "tmp_exports");
    await fs.remove(tmpDocs);
    await fs.remove(tmpExports);
    const fixturePath = path.resolve(repoRoot, "packages/planner/test/emitter/automation/fixtures/plan.sample.json");
    const cliPath = path.resolve(repoRoot, "packages/planner/dist/cli/index.js");
    await new Promise<void>((resolve, reject) => {
      const proc = child_process.spawn("node", [cliPath, "emit:automation", "--module", "Accesare", "--input", fixturePath, "--docDir", tmpDocs, "--outDir", tmpExports], { stdio: "inherit" });
      proc.on("exit", (code) => code === 0 ? resolve() : reject(new Error(String(code))));
      proc.on("error", reject);
    });
    const outCsv = path.join(tmpExports, "Accesare_Automation.csv");
    const outMd = path.join(tmpDocs, "Accesare_Automation.md");
    expect(await fs.pathExists(outCsv)).toBe(true);
    expect(await fs.pathExists(outMd)).toBe(true);
    const buf = await fs.readFile(outCsv);
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    const text = buf.toString("utf8");
    expect(text.split("\r\n")[0]).toContain("module,tipFunctionalitate");
    const md = await fs.readFile(outMd, "utf8");
    expect(md).toMatch(/^# Accesare — Automation Plan/m);
  }, 30000);

  it("exits non-zero on invalid input shape", async () => {
    const tmp = path.resolve(repoRoot, "tmp_invalid.json");
    await fs.writeFile(tmp, "{}", "utf8");
    const cliPath = path.resolve(repoRoot, "packages/planner/dist/cli/index.js");
    let failed = false;
    try {
      await new Promise<void>((resolve, reject) => {
        const proc = child_process.spawn("node", [cliPath, "emit:automation", "--module", "Accesare", "--input", tmp], { stdio: "ignore" });
        proc.on("exit", (code) => code === 0 ? resolve() : reject(new Error(String(code))));
        proc.on("error", reject);
      });
    } catch (e: any) {
      failed = true;
    }
    expect(failed).toBe(true);
    await fs.remove(tmp);
  }, 30000);
});


