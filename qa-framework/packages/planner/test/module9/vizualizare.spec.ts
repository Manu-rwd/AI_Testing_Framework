import path from "node:path";
import fs from "fs-extra";
import { describe, it, expect, beforeAll } from "vitest";
import { spawn } from "node:child_process";

function runNode(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn(args[0]!, args.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    p.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    p.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    p.on("close", (code) => resolve({ code: code ?? 0, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
}

function splitCRLF(text: string): string[] { return text.split(/\r\n/); }
function csvSplit(line: string): string[] {
  const out: string[] = []; let s = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') { if (q && line[i + 1] === '"') { s += '"'; i++; } else { q = !q; } continue; }
    if (ch === ',' && !q) { out.push(s); s = ""; continue; }
    s += ch;
  }
  out.push(s);
  return out;
}

describe("Module 9: Vizualizare review flow", () => {
  const plannerDir = path.resolve(process.cwd());
  const workspaceRoot = path.join(plannerDir, "..", "..");
  const tsxRunner = path.join(workspaceRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const extendSrc = path.join(workspaceRoot, "packages", "planner", "src", "review", "extend_csv.ts");
  const reportBin = path.join(workspaceRoot, "packages", "planner", "bin", "review-report-viz.ts");
  const tmp = path.join(workspaceRoot, "packages", "planner", "test", "tmp_review_viz");

  beforeAll(async () => {
    await fs.remove(tmp);
    await fs.mkdirp(tmp);
  });

  it("extends Vizualizare CSV and is idempotent; report sets Approved", async () => {
    const input = path.join(tmp, "viz.csv");
    await fs.writeFile(input, ["id,name", "1,Foo", ""].join("\r\n"), { encoding: "utf8" });
    const nodeBin = process.execPath;
    // First extend in place
    const res1 = await runNode([nodeBin, tsxRunner, extendSrc, input, "-q"], plannerDir);
    expect(res1.code).toBe(0);
    const text1 = await fs.readFile(input, "utf8");
    const content1 = text1.startsWith("\uFEFF") ? text1.slice(1) : text1;
    const header1 = splitCRLF(content1)[0] || "";
    const cols1 = csvSplit(header1);
    ["disposition","feasibility","selector_needs","parameter_needs","notes"].forEach(c => expect(cols1.includes(c)).toBe(true));
    const snapshot1 = content1;

    // Run again idempotent
    const res2 = await runNode([nodeBin, tsxRunner, extendSrc, input, "-q"], plannerDir);
    expect(res2.code).toBe(0);
    const text2 = await fs.readFile(input, "utf8");
    const content2 = text2.startsWith("\uFEFF") ? text2.slice(1) : text2;
    expect(content2).toBe(snapshot1);

    // Produce report
    const outMd = path.join(tmp, "Accesare_Vizualizare.md");
    const res3 = await runNode([nodeBin, tsxRunner, reportBin, "--csv", input, "--md", outMd, "--approve"], plannerDir);
    expect(res3.code).toBe(0);
    const md = await fs.readFile(outMd, "utf8");
    expect(md).toMatch(/Status: Approved/);
    expect(md).toMatch(/## Rezumat review/);
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const ymd = `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}-${parts.find(p=>p.type==='day')?.value}`;
    expect(md).toContain(`### ${ymd}`);
  });
});



