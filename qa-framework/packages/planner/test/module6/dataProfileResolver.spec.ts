import { describe, it, expect } from "vitest";
import { resolveDataProfile } from "../../src/dataProfiles/dataProfileResolver";

describe("dataProfileResolver", () => {
  const projectPath = "qa-framework/projects/example";

  it("uses project field profile when available", () => {
    const res = resolveDataProfile({ narrative_ro: "Completează email" }, projectPath);
    expect(res.minimal_valid).toBeTruthy();
    expect(res.invalid_regex.length).toBeGreaterThan(0);
    expect(res.source === "project" || res.source === "US").toBe(true);
  });

  it("falls back to defaults and includes common invalid & edge cases", () => {
    const res = resolveDataProfile({ narrative_ro: "Completează CNP" }, projectPath);
    expect(res.invalid_regex.join(" ")).toMatch(/\^\$|\^\\s\+\$/);
    expect(res.edge_cases.length).toBeGreaterThanOrEqual(3);
  });

  it("provenance confidence mapping", () => {
    const r1 = resolveDataProfile({ narrative_ro: "Introduce nume" }, projectPath);
    expect([0.9, 0.75]).toContain(r1.confidence);
  });
});


