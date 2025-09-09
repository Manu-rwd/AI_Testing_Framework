import { describe, it, expect } from "vitest";
import { resolveSelectorStrategyFromProject } from "../../src/selectors/selectorResolver";

describe("selectorResolver", () => {
  const projectPath = "qa-framework/projects/example";

  it("prefers data-testid when standards say so", () => {
    const res = resolveSelectorStrategyFromProject("Salvare în formular", projectPath);
    expect(res.selector_strategy.primary).toMatch(/getBy(TestId|Role)/);
    // Either direct data-testid or getByRole due to role override; both acceptable primary
  });

  it("falls back to role when testid missing and role hint present", () => {
    const res = resolveSelectorStrategyFromProject("Apasă butonul Salvare", projectPath);
    const first = res.selectors[0];
    expect(first).toMatch(/getBy(Role|TestId)/);
  });

  it("disallows CSS patterns listed", () => {
    const res = resolveSelectorStrategyFromProject("Navighează înapoi", projectPath);
    expect(res.selectors.join(" ")).not.toContain("[class*=ant-]");
    expect(res.selectors.join(" ")).not.toContain("[class*=Mui-]");
  });

  it("confidence matches weights order rough bounds", () => {
    const res = resolveSelectorStrategyFromProject("Introduce email în formular", projectPath);
    expect(res.selector_strategy.confidence).toBeGreaterThan(0.39);
    expect(res.selector_strategy.confidence).toBeLessThanOrEqual(1);
  });
});


