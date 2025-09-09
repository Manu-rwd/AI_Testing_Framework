import { describe, it, expect } from "vitest";
import { scoreFeasibility } from "../src/automation/feasibility";

describe("automation feasibility scorer", () => {
  it("rates A for stable simple single-route", () => {
    const res = scoreFeasibility({
      atoms: { setup: ["autentificare"], action: ["navigheaza"], assert: ["vede pagina"] },
      preferredSelectors: ["data-testid","role"],
      missingSelectors: [],
      hasDynamicContent: false,
      crossRouteSteps: 1,
      dataProfileComplexity: "simple",
      oracleKind: "dom",
    });
    expect(res.feasibility).toBe("A");
    expect(["none","low","medium","high"]).toContain(res.selector_needs);
  });

  it("rates C or worse for medium/high selector needs or dynamic content", () => {
    const res = scoreFeasibility({
      atoms: { setup: [], action: new Array(6).fill("pas"), assert: ["ok"] },
      preferredSelectors: ["data-testid","role"],
      missingSelectors: ["data-testid"],
      hasDynamicContent: true,
      crossRouteSteps: 2,
      dataProfileComplexity: "mixed",
      oracleKind: "visual",
    });
    expect(["C","D","E"]).toContain(res.feasibility);
  });
});


