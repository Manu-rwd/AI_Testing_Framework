import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { repoRoot } from "../../../src/util/paths";
import { automationPlanToMarkdown } from "../../../src/emitter/automation/md";

describe("automation markdown emitter", () => {
  it("produces H1 and sections per row with confidence percent", async () => {
    const fixturePath = path.resolve(repoRoot, "packages/planner/test/emitter/automation/fixtures/plan.sample.json");
    const plan = JSON.parse(await fs.readFile(fixturePath, "utf8"));
    const md = automationPlanToMarkdown(plan);
    expect(md).toMatch(/^# .* — Automation Plan/m);
    expect(md).toContain("## ");
    expect(md).toContain("### Arrange");
    expect(md).toContain("### Act");
    expect(md).toContain("### Assert");
    expect(md).toContain("### Selectors");
    expect(md).toContain("### Data Profile");
    expect(md).toContain("### Feasibility");
    expect(md).toContain("### Provenance");
    expect(md).toContain("### Confidence");
    expect(md).toMatch(/\d{1,3}\.\d%/); // one decimal percent
  });
});


