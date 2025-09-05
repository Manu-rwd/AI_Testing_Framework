import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { repoRoot } from "../../../src/util/paths";
import { automationPlanToCsvBuffer, AUTOMATION_CSV_COLUMNS } from "../../../src/emitter/automation/csv";

describe("automation csv emitter", () => {
  it("emits correct header, BOM, CRLF and quoting", async () => {
    const fixturePath = path.resolve(repoRoot, "packages/planner/test/emitter/automation/fixtures/plan.sample.json");
    const plan = JSON.parse(await fs.readFile(fixturePath, "utf8"));
    const buf = automationPlanToCsvBuffer(plan);
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    const text = buf.toString("utf8");
    const lines = text.split("\r\n");
    const header = lines[0].replace(/^\uFEFF/, "");
    expect(header).toBe(AUTOMATION_CSV_COLUMNS.join(","));
    // row should be quoted if contains commas/newlines
    expect(text).toContain('"A narrative, with comma"');
  });

  it("serializes atoms and rule tags as compact JSON and confidence precision", async () => {
    const fixturePath = path.resolve(repoRoot, "packages/planner/test/emitter/automation/fixtures/plan.sample.json");
    const plan = JSON.parse(await fs.readFile(fixturePath, "utf8"));
    const buf = automationPlanToCsvBuffer(plan);
    const text = buf.toString("utf8");
    const lines = text.split("\r\n").filter(Boolean);
    const dataLine = lines[1]!;
    // naive CSV parser handling quotes and commas
    function parseCsvLine(line: string): string[] {
      const out: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]!;
        if (inQ) {
          if (ch === '"') {
            if (line[i + 1] === '"') { cur += '"'; i++; }
            else { inQ = false; }
          } else { cur += ch; }
        } else {
          if (ch === '"') inQ = true;
          else if (ch === ',') { out.push(cur); cur = ""; }
          else cur += ch;
        }
      }
      out.push(cur);
      return out;
    }
    const fields = parseCsvLine(dataLine);
    const atomsField = fields[4]!;
    const tagsField = fields[11]!;
    expect(() => JSON.parse(atomsField)).not.toThrow();
    // compact JSON: no extra spaces around separators and no newlines
    expect(atomsField).not.toMatch(/[\r\n]/);
    // Allow ":" inside string values; just ensure no spaces after separators
    expect(atomsField).not.toContain(", ");
    // value preserved
    expect(JSON.parse(atomsField).assert[0]).toBe('He said: "quote"');
    expect(() => JSON.parse(tagsField)).not.toThrow();
    expect(tagsField).not.toMatch(/[\r\n]/);
    // confidence at most 3 decimals exists in line
    expect(dataLine).toMatch(/,0?\.\d{1,3}(,|$)/);
  });
});


