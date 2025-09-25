import fs from "fs-extra";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { rankSelectorKinds } from "../../src/selector/rankers.js";
import { selectStrategy } from "../../src/selector/engine.js";

const fixturesDir = path.join(process.cwd(), "test/selector-data-profiles/fixtures");

describe("selector strategy", () => {
  it("disallows xpath per project policy", async () => {
    const projectPath = path.join(process.cwd(), "projects/example");
    const policyFile = path.join(projectPath, "standards/selectors.yaml");
    await fs.ensureDir(path.dirname(policyFile));
    await fs.copyFile(path.join(fixturesDir, "project.selectors.yaml"), policyFile);

    const ctx = { policy: { order: ["data-testid","role","aria","text","css","xpath"], disallow: ["xpath"], role_name_required: true, fallback_text_max_len: 50 } as any };
    const ranked = rankSelectorKinds({ ...ctx, rowHints: "" });
    expect(ranked.find(r => r.kind === "xpath")!.score).toBeLessThan(0.3);
  });

  it("prefers role-with-name when roles hinted", async () => {
    const row: any = { selector_needs: "roles" };
    const res = selectStrategy(row, { projectPath: path.join(process.cwd(), "projects/example") });
    expect(res.strategy).toBe("role-with-name");
  });

  it("defaults to data-testid-preferred", async () => {
    const row: any = { selector_needs: "" };
    const res = selectStrategy(row, { projectPath: path.join(process.cwd(), "projects/example") });
    expect(res.strategy).toBe("data-testid-preferred");
  });

  it("provenance and bump when project policy drives choice", async () => {
    const row: any = { selector_needs: "" };
    const res = selectStrategy(row, { projectPath: path.join(process.cwd(), "projects/example") });
    expect(["project","defaults","US"]).toContain(res.provenance);
    if (res.provenance !== "US") {
      expect(res.confidenceBump).toBeLessThanOrEqual(0.02);
      expect(res.confidenceBump).toBeGreaterThanOrEqual(0);
    }
  });
});


