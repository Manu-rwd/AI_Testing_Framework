import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { automationPlanToCsvBuffer, AUTOMATION_CSV_COLUMNS } from "../../src/emit/automation_csv.js";

const planPath = path.resolve(__dirname, "../emitter/automation/fixtures/plan.sample.json");

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') { out.push(cur); cur = ""; }
      else if (ch === '"') { inQ = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

describe("automation emitter - CSV", () => {
  it("writes CSV with BOM, CRLF, header and compact JSON", async () => {
    const rows: any[] = JSON.parse(await fs.readFile(planPath, "utf8"));
    const buf = automationPlanToCsvBuffer(rows as any);
    const text = buf.toString("utf8");
    expect(text.startsWith("\uFEFF")).toBe(true);
    const lines = text.slice(1).split("\r\n");
    expect(lines[0]).toBe(AUTOMATION_CSV_COLUMNS.join(","));
    const first = lines[1] || "";
    const fields = parseCsvLine(first);
    const atomsIdx = AUTOMATION_CSV_COLUMNS.indexOf("atoms");
    const atomsField = fields[atomsIdx] || "";
    expect(atomsField).toMatch(/\{"setup"/);
    const confIdx = AUTOMATION_CSV_COLUMNS.indexOf("confidence");
    const confidenceField = (fields[confIdx] || "").replace(/"/g, "");
    expect(/^\d*(\.\d{1,3})?$/.test(confidenceField)).toBe(true);
  });
});


