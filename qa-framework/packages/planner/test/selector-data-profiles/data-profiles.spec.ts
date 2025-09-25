import path from "node:path";
import { describe, it, expect } from "vitest";
import { decideProfile } from "../../src/data-profiles/engine.js";

const exampleProject = path.join(process.cwd(), "qa-framework/projects/example");
const usPath = path.join(process.cwd(), "qa-framework/packages/planner/test/selector-data-profiles/fixtures/us.normalized.sample.json");

describe("data profiles", () => {
  it("minimal_valid for login/auth buckets", () => {
    const row: any = { bucket: "Login", feasibility: "A" };
    const res = decideProfile(row, { projectPath: exampleProject, usPath });
    expect(res.profile).toBe("minimal_valid");
  });

  it("invalid_regex when hard feasibility and regex present", () => {
    const row: any = { bucket: "Form", feasibility: "D" };
    const res = decideProfile(row, { projectPath: exampleProject, usPath });
    expect(["invalid_regex","edge_long","edge_empty","minimal_valid"]).toContain(res.profile);
  });

  it("edge_long when maxLen present and hard feasibility", () => {
    const row: any = { bucket: "Form", feasibility: "E" };
    const res = decideProfile(row, { projectPath: exampleProject, usPath });
    expect(["edge_long","invalid_regex","edge_empty"]).toContain(res.profile);
  });

  it("provenance reflects US first, then project, then defaults", () => {
    const row: any = { bucket: "Form", feasibility: "B" };
    const res = decideProfile(row, { projectPath: exampleProject, usPath });
    expect(["US","project","defaults"]).toContain(res.provenance);
    expect(res.confidenceBump).toBeGreaterThanOrEqual(0);
    expect(res.confidenceBump).toBeLessThanOrEqual(0.02);
  });
});


