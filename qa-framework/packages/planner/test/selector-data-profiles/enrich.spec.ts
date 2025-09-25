import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { enrichRows } from "../../src/v2/enrich.js";

const fixtures = path.join(process.cwd(), "test/selector-data-profiles/fixtures");
const planPath = path.join(fixtures, "plan.v2.sample.json");
const exampleProject = path.join(process.cwd(), "projects/example");

describe("v2 enrich integration", () => {
  it("populates selector_strategy and data_profile; confidence up; notes provenance", async () => {
    const rows: any[] = JSON.parse(await fs.readFile(planPath, "utf8"));
    const enriched = await enrichRows(rows as any, { projectPath: exampleProject, usPath: path.join(fixtures, "us.normalized.sample.json") });
    expect(enriched.length).toBeGreaterThanOrEqual(10);
    const adaugare = enriched.filter(r => r.tipFunctionalitate === "Adăugare");
    const viz = enriched.filter(r => r.tipFunctionalitate === "Vizualizare");
    expect(adaugare.length).toBeGreaterThanOrEqual(5);
    expect(viz.length).toBeGreaterThanOrEqual(5);
    for (const r of enriched) {
      expect(r.selector_strategy && r.selector_strategy.length).toBeTruthy();
      expect(r.data_profile && r.data_profile.length).toBeTruthy();
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
      expect(String(r.notes || "")).toContain("selector_provenance=");
      expect(String(r.notes || "")).toContain("profile_provenance=");
    }
  });
});


