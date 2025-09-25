import path from "node:path";
import fs from "fs-extra";
import { describe, it, expect, beforeAll } from "vitest";
import { spawn } from "node:child_process";

function runNode(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn(args[0]!, args.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    p.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    p.on("close", (code) => resolve({ code: code ?? 0, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
}

describe("review:extend CLI", () => {
  const plannerDir = process.cwd();
  const workspaceRoot = path.join(plannerDir, "..", ".."); // qa-framework
  const src = path.join(workspaceRoot, "packages", "planner", "src", "review", "extend_csv.ts");
  const fixtures = path.join(workspaceRoot, "packages", "planner", "test", "_fixtures", "review_cli");
  const tmp = path.join(workspaceRoot, "packages", "planner", "test", "tmp_review_cli");

  beforeAll(async () => {
    await fs.remove(tmp);
    await fs.mkdirp(tmp);
    await fs.remove(fixtures);
    await fs.mkdirp(fixtures);
    await fs.writeFile(path.join(fixtures, "one.csv"), ["id,name", "1,Foobar", ""].join("\r\n"), { encoding: "utf8" });
  });

  it("handles globs, --out dir, and sidecar generation", async () => {
    const glob = path.join(fixtures, "*.csv");
    const nodeBin = process.execPath;
    const tsxRunner = path.join(workspaceRoot, "node_modules", "tsx", "dist", "cli.mjs");
    const res = await runNode([nodeBin, tsxRunner, src, glob, "--out", tmp, "--sidecar", "--pretty", "-q"], plannerDir);
    expect(res.code).toBe(0);
    const outFiles = await fs.readdir(tmp);
    const csvs = outFiles.filter((f) => f.endsWith(".csv"));
    expect(csvs.length).toBeGreaterThan(0);
    for (const c of csvs) {
      const sc = path.join(tmp, c.replace(/\.csv$/i, ".review.json"));
      const exists = await fs.pathExists(sc);
      expect(exists).toBe(true);
      const json = JSON.parse(await fs.readFile(sc, "utf8"));
      expect(Array.isArray(json.columns)).toBe(true);
      expect(json.columns).toEqual(["disposition","feasibility","selector_needs","parameter_needs","notes"]);
      expect(Array.isArray(json.rows)).toBe(true);
    }
  });
  
  it("creates .bak on --backup", async () => {
    const input = path.join(tmp, "bak.csv");
    await fs.writeFile(input, ["id,name", "1,Alpha", ""].join("\r\n"), { encoding: "utf8" });
    const nodeBin = process.execPath;
    const tsxRunner = path.join(workspaceRoot, "node_modules", "tsx", "dist", "cli.mjs");
    const res = await runNode([nodeBin, tsxRunner, src, input, "--backup", "-q"], plannerDir);
    expect(res.code).toBe(0);
    const exists = await fs.pathExists(input + ".bak");
    expect(exists).toBe(true);
  });
});


