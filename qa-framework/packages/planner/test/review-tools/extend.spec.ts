import path from "node:path";
import fs from "fs-extra";
import { describe, it, expect } from "vitest";
import { extendReviewColumns } from "../../src/review/extend";

function hasBOM(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

function splitRowsRFC(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        current += ch;
        i++;
        continue;
      }
    }
    if (!inQuotes && ch === "\r" && text[i + 1] === "\n") {
      rows.push(current);
      current = "";
      i += 2;
      continue;
    }
    current += ch;
    i++;
  }
  rows.push(current);
  return rows;
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

describe("review extend library", () => {
  const cwd = process.cwd();
  const fixtureDir = path.join(cwd, "packages", "planner", "test", "review-tools", "fixtures");
  const fixture = path.join(fixtureDir, "automation.sample.csv");
  const tmpDir = path.join(cwd, "tmp_review_tests");

  it("appends review columns, preserves BOM+CRLF, idempotent", async () => {
    await fs.remove(tmpDir);
    await fs.mkdirp(tmpDir);
    const input = path.join(tmpDir, "automation.sample.csv");
    await fs.copyFile(fixture, input);

    const origBuf = await fs.readFile(input);
    const origText = origBuf.toString("utf8");
    const origContent = origText.startsWith("\uFEFF") ? origText.slice(1) : origText;
    const origHeader = origContent.split(/\r\n/)[0] || "";
    const origCols = safeSplit(origHeader);

    const { outputCsvPath } = await extendReviewColumns(input, { outDir: tmpDir });
    const outBuf1 = await fs.readFile(outputCsvPath);
    expect(hasBOM(outBuf1)).toBe(true);
    const outText1 = outBuf1.toString("utf8");
    const content1 = outText1.startsWith("\uFEFF") ? outText1.slice(1) : outText1;
    expect(content1.includes("\r\n")).toBe(true);
    const lines1 = splitRowsRFC(content1);
    const header1 = lines1[0]!;
    const cols1 = safeSplit(header1);
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

    for (let i = 1; i < lines1.length; i++) {
      if (!lines1[i]) continue;
      const row = safeSplit(lines1[i]!);
      expect(row.length).toBe(cols1.length);
    }

    // idempotency: run again and compare bytes
    const beforeSecond = await fs.readFile(outputCsvPath);
    const { outputCsvPath: outputCsvPath2 } = await extendReviewColumns(outputCsvPath, { inPlace: true });
    expect(outputCsvPath2).toBe(outputCsvPath);
    const afterSecond = await fs.readFile(outputCsvPath2);
    expect(Buffer.compare(beforeSecond, afterSecond)).toBe(0);
  });
});


