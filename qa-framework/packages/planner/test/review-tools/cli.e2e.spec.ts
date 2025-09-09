import path from "node:path";
import fs from "fs-extra";
import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";

function hasBOM(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

function safeSplit(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function splitCRLF(text: string): string[] {
  return text.split(/\r\n/);
}

function runNode(cmd: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [cmd, ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d: Buffer) => (stdout += d.toString()))
    p.stderr.on("data", (d: Buffer) => (stderr += d.toString()))
    p.on("close", (code: number) => resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code ?? 0 }));
  });
}

describe("review CLI e2e", () => {
  const cwd = process.cwd();
  const fixtureDir = path.join(__dirname, "fixtures");
  const fixture = path.join(fixtureDir, "automation.sample.csv");
  const tmpDir = path.join(cwd, "tmp_review");

  it("runs plan:review:init and plan:review:summary", async () => {
    await fs.remove(tmpDir);
    await fs.mkdirp(tmpDir);
    const tmpCsv = path.join(tmpDir, "automation.sample.csv");
    await fs.copyFile(fixture, tmpCsv);

    const cli = path.join(cwd, "dist", "cli", "index.js");
    const res1 = await runNode(cli, ["plan:review:init", "--input", tmpCsv, "--outDir", tmpDir], cwd);
    expect(res1.code).toBe(0);
    const reviewCsv = path.join(tmpDir, "automation.sample.review.csv");
    const outBuf1 = await fs.readFile(reviewCsv);
    expect(hasBOM(outBuf1)).toBe(true);
    const outText1 = outBuf1.toString("utf8");
    const content1 = outText1.startsWith("\uFEFF") ? outText1.slice(1) : outText1;
    const lines1 = splitCRLF(content1);
    const header1 = lines1[0]!;
    const cols1 = safeSplit(header1);
    const orig = await fs.readFile(tmpCsv, "utf8");
    const origContent = orig.startsWith("\uFEFF") ? orig.slice(1) : orig;
    const origHeader = origContent.split(/\r\n/)[0] || "";
    const origCols = safeSplit(origHeader);
    const allExpected = [
      "review_disposition",
      "feasibility",
      "review_needs",
      "review_notes",
      "reviewer",
      "reviewed_at",
    ];
    const expectedSuffix = allExpected.filter((c) => !origCols.includes(c));
    expect(cols1.slice(-expectedSuffix.length)).toEqual(expectedSuffix);

    const mdOut = path.join(tmpDir, "Accesare_Review_Summary.md");
    const res2 = await runNode(cli, ["plan:review:summary", "--input", reviewCsv, "--module", "Accesare", "--out", mdOut], cwd);
    expect(res2.code).toBe(0);
    const md = await fs.readFile(mdOut, "utf8");
    expect(md.includes("# Review Summary: Accesare")).toBe(true);
    expect(/Timestamp: \d{4}-\d{2}-\d{2}T/.test(md)).toBe(true);
    expect(md.includes("Feasibility Counts")).toBe(true);
    expect(md.includes("Review Disposition Counts")).toBe(true);
  });
});


