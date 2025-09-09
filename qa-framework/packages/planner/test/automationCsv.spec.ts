import { describe, it, expect } from "vitest";
import { automationPlanToCsvBuffer, AUTOMATION_CSV_COLUMNS } from "../src/emit/automation_csv";

const sample = [
  {
    module: "Adăugare",
    tipFunctionalitate: "Adăugare",
    bucket: "General",
    narrative_ro: "Utilizatorul adaugă un element.",
    atoms: { setup: ["autentificare"], action: ["clic pe Adaugă"], assert: ["vede confirmare"] },
    selector_needs: "low",
    selector_strategy: "data-testid (preferred); fallback role/aria; avoid text; reason: stable ids",
    data_profile: "user: seeded",
    feasibility: "B",
    source: "US",
    confidence: 0.87,
    rule_tags: ["happy-path","auth"],
    notes: "ok",
  },
  {
    module: "Adăugare",
    tipFunctionalitate: "Adăugare",
    bucket: "Edge",
    narrative_ro: "Caz cu diacritice și \"ghilimele\"",
    atoms: { setup: [], action: ["introduce date"], assert: ["eroare vizibilă"] },
    selector_needs: "medium",
    selector_strategy: "role/aria; no testids; mitigate with scoped queries",
    data_profile: "product: generated(minimal)",
    feasibility: "C",
    source: "defaults",
    confidence: 0.55,
    rule_tags: [],
    notes: "verificare manuală",
  },
] as any[];

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
      } else { cur += ch; }
    } else {
      if (ch === ',') { out.push(cur); cur = ""; }
      else if (ch === '"') { inQ = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

describe("automation CSV emitter", () => {
  it("writes BOM, CRLF, ordered headers and quoted fields", () => {
    const buf = automationPlanToCsvBuffer(sample as any);
    const text = buf.toString("utf8");
    expect(text.startsWith("\uFEFF")).toBe(true);
    const [bomless, ...rest] = [text.slice(1)];
    const lines = bomless.split("\r\n");
    expect(lines[0]).toBe(AUTOMATION_CSV_COLUMNS.join(","));
    const fields = parseCsvLine(lines[1] || "");
    expect(fields.length).toBe(AUTOMATION_CSV_COLUMNS.length);
    // narrative with quotes is preserved after CSV parsing
    const fields2 = parseCsvLine(lines[2] || "");
    expect(fields2[3] || "").toBe('Caz cu diacritice și "ghilimele"');
  });
});


