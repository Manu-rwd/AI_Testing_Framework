import { describe, it, expect } from "vitest";
import { automationPlanToMarkdown } from "../src/emit/automation_md";

const rows: any[] = [
  {
    module: "Adăugare",
    tipFunctionalitate: "Adăugare",
    bucket: "General",
    narrative_ro: "Utilizatorul adaugă un element.",
    atoms: { setup: ["autentificare"], action: ["clic pe Adaugă"], assert: ["vede confirmare"] },
    selector_needs: "low",
    selector_strategy: "data-testid (preferred); fallback role/aria; avoid text; reason: stable ids",
    data_profile: "user: seeded",
    feasibility: "A",
    source: "US",
    confidence: 0.87,
    rule_tags: ["happy-path","auth"],
    notes: "ok",
  },
];

describe("automation MD emitter", () => {
  it("renders title, sections, and feasibility badge", () => {
    const md = automationPlanToMarkdown("Adăugare", rows as any);
    expect(md).toContain("# Adăugare: Plan de automatizare");
    expect(md).toContain("## 1. General — Utilizatorul adaugă un element.");
    expect(md).toContain("Fezabilitate: A 🟢");
    expect(md).toContain("### Arrange");
    expect(md).toContain("### Act");
    expect(md).toContain("### Assert");
  });
});


